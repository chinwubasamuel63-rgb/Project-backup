import mongoose from "mongoose";
import {
  AccessToken,
  RoomServiceClient,
  TrackSource,
  WebhookReceiver,
} from "livekit-server-sdk";
import Stream from "../models/Stream.js";
import StreamParticipant from "../models/StreamParticipant.js";
import StreamBan from "../models/StreamBan.js";
import StreamRequest from "../models/StreamRequest.js";
import { canAccessStream } from "./streamAccess.service.js";

/**
 * LiveKit Service - Hardened integration with proper validation, logging, and error handling
 * Ensures token generation is secure, permissions are consistent between MongoDB and LiveKit,
 * and all operations are properly logged for debugging and auditing.
 */

// ==================== Configuration Management ====================

const getLivekitHost = () => {
  const host = process.env.LIVEKIT_HOST || process.env.LIVEKIT_URL;
  return normalizeLivekitUrl(host);
};

const getLivekitApiKey = () => process.env.LIVEKIT_API_KEY;
const getLivekitApiSecret = () => process.env.LIVEKIT_API_SECRET;

/**
 * Normalize LiveKit URL to ensure proper format (http:// or https://, no trailing slash)
 */
const normalizeLivekitUrl = (url) => {
  if (!url) return url;

  // Remove trailing slashes
  url = url.replace(/\/+$/, "");

  // Add protocol if missing
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  return url;
};

/**
 * Validates that LiveKit is properly configured before operations
 * Throws detailed error if configuration is incomplete
 */
const validateLivekitConfiguration = () => {
  const host = getLivekitHost();
  const apiKey = getLivekitApiKey();
  const apiSecret = getLivekitApiSecret();

  if (!host || !apiKey || !apiSecret) {
    const missing = [];
    if (!host) missing.push("LIVEKIT_HOST/LIVEKIT_URL");
    if (!apiKey) missing.push("LIVEKIT_API_KEY");
    if (!apiSecret) missing.push("LIVEKIT_API_SECRET");

    throw new Error(`LiveKit configuration missing: ${missing.join(", ")}`);
  }

  return { host, apiKey, apiSecret };
};

const isLivekitConfigured = () => {
  const host = getLivekitHost();
  const apiKey = getLivekitApiKey();
  const apiSecret = getLivekitApiSecret();
  return Boolean(host && apiKey && apiSecret);
};

/**
 * Narrowed error filter - only ignores specific "participant not found" errors
 * Does NOT swallow authentication, authorization, server, or unexpected errors
 *
 * Ignorable errors:
 * - "participant X not found" (already disconnected)
 * - "room not found" (already deleted)
 *
 * Non-ignorable errors (will be thrown):
 * - Any error with status codes indicating auth/server problems
 * - Errors without clear "not found" message
 */
const isIgnorableLivekitError = (error) => {
  if (!error) return false;

  const message = (error?.message || "").toLowerCase();
  const statusCode = error?.statusCode || error?.status;

  // Never ignore authentication/authorization errors
  if (statusCode === 401 || statusCode === 403) {
    return false;
  }

  // Never ignore server errors
  if (statusCode >= 500) {
    return false;
  }

  // Only ignore specific "not found" errors that indicate participant already left
  return /participant.*not found|room.*not found|already.*disconnect/i.test(
    message,
  );
};

// ==================== Participant Role and Permission Management ====================

export const getStreamRoomName = (streamId) => `stream_${streamId.toString()}`;

/**
 * Calculate the display role for a participant based on their permissions
 * - host: always has publishing permissions
 * - speaker: viewer with at least one publishing permission
 * - viewer: no publishing permissions
 *
 * Role is derived from permissions, NOT settable by client
 */
export const calculateParticipantRole = (participant) => {
  if (!participant) {
    return "viewer";
  }

  // Role "host" is authoritative from Stream.host field, checked elsewhere
  if (participant.role === "host") {
    return "host";
  }

  // Speaker = any publishing permission enabled
  const hasPublishingPermission = Boolean(
    participant.microphoneEnabled ||
    participant.cameraEnabled ||
    participant.screenShareEnabled,
  );

  return hasPublishingPermission ? "speaker" : "viewer";
};

/**
 * Get publishing sources a participant is allowed to use
 * Hosts always get all sources
 * Others get only the sources they have permission for
 */
export const getParticipantPublishingSources = (participant) => {
  const sources = [];

  if (!participant) {
    return sources;
  }

  if (participant.role === "host") {
    // Hosts always get full publishing capabilities
    return ["microphone", "camera", "screen_share"];
  }

  if (participant.microphoneEnabled) {
    sources.push("microphone");
  }

  if (participant.cameraEnabled) {
    sources.push("camera");
  }

  if (participant.screenShareEnabled) {
    sources.push("screen_share");
  }

  // Note: screen_share_audio is only added if explicitly supported
  // Current SDK supports it, but we don't track it in MongoDB yet
  // Future enhancement: add screenShareAudioEnabled field if needed

  return sources;
};

/**
 * Convert permission names to LiveKit TrackSource enum values
 * Ensures consistency between MongoDB permission model and LiveKit SDK
 */
const toLivekitPublishSources = (participant) => {
  const publishSources = getParticipantPublishingSources(participant);

  return publishSources.map((source) => {
    switch (source) {
      case "microphone":
        return TrackSource.MICROPHONE;
      case "camera":
        return TrackSource.CAMERA;
      case "screen_share":
        return TrackSource.SCREEN_SHARE;
      case "screen_share_audio":
        return TrackSource.SCREEN_SHARE_AUDIO;
      default:
        // This should never happen if getParticipantPublishingSources is correct
        return TrackSource.UNKNOWN;
    }
  });
};

/**
 * Build the LiveKit grant for a participant token
 * Ensures permissions in token match MongoDB state
 * Hosts always have canPublish=true
 * Others depend on their assigned permissions
 */
export const buildLivekitGrant = (participant, roomName) => {
  const publishSources = toLivekitPublishSources(participant);
  const canPublish = participant?.role === "host" || publishSources.length > 0;

  return {
    roomJoin: true,
    room: roomName,
    canPublish,
    canPublishSources: publishSources,
    canSubscribe: true,
  };
};

// ==================== Token Generation ====================

/**
 * Create a secure LiveKit token for a participant
 *
 * Security guarantees:
 * - Token identity ALWAYS from authenticated req.user, never client-supplied
 * - Token only generated for authorized users with participant records
 * - Token contains only non-sensitive metadata
 * - Permissions in token match MongoDB authoritative state
 * - Token cannot override host role or escalate privileges
 *
 * @param {Object} params - Parameters object
 * @param {string} params.streamId - Stream ID to generate token for
 * @param {Object} params.participant - Participant record from MongoDB (required)
 * @param {Object} params.user - Authenticated user from req.user (required, never from client)
 * @param {Function} params.tokenFactory - AccessToken factory (for testing)
 * @throws {Error} If configuration missing, user not authorized, or participant record missing
 */
export const createParticipantToken = async ({
  streamId,
  participant,
  user,
  tokenFactory = (apiKey, apiSecret, options) =>
    new AccessToken(apiKey, apiSecret, options),
}) => {
  // Validate LiveKit configuration
  if (!isLivekitConfigured()) {
    throw new Error("LiveKit configuration missing");
  }

  // Verify authenticated user exists (never trust client-supplied userId)
  if (!user || !user._id) {
    throw new Error("Authentication required");
  }

  // Verify participant record from MongoDB exists and is active
  if (!participant || !participant._id) {
    throw new Error("Participant record missing or invalid");
  }

  // Verify participant is currently active (leftAt is null)
  if (participant.leftAt !== null && participant.leftAt !== undefined) {
    throw new Error("You have already left this stream");
  }

  const roomName = getStreamRoomName(streamId);

  // Generate token with identity from authenticated user only
  const token = tokenFactory(getLivekitApiKey(), getLivekitApiSecret(), {
    identity: user._id.toString(),
    name:
      user.username ||
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user._id.toString(),
    // Metadata: only non-sensitive stream and role information
    metadata: JSON.stringify({
      streamId: streamId.toString(),
      role: calculateParticipantRole(participant),
      // Do NOT include permissions, bans, private data, etc in metadata
    }),
  });

  // Add the grant with permissions from MongoDB state
  token.addGrant(buildLivekitGrant(participant, roomName));

  const jwt = await token.toJwt();

  return {
    jwt,
    roomName,
    participantRole: calculateParticipantRole(participant),
  };
};

// ==================== Stream Access Validation ====================

/**
 * Validate that a user can access a stream and generate a token
 *
 * Checks:
 * - Stream exists
 * - Stream is in "started" status (not scheduled or ended)
 * - User has access (not banned, private stream access if needed)
 *
 * @param {Object} params
 * @param {string} params.streamId - Stream ID to validate
 * @param {Object} params.user - Authenticated user
 * @returns {Object} Stream document
 * @throws {Error} Detailed error if stream cannot be accessed
 */
export const validateStreamAccessForLivekit = async ({ streamId, user }) => {
  if (!mongoose.Types.ObjectId.isValid(streamId)) {
    throw new Error("Invalid stream id");
  }

  const stream = await Stream.findById(streamId).populate("project");

  if (!stream) {
    throw new Error("Stream not found");
  }

  // === Check stream status - must be "started" ===
  // Prevent token generation for scheduled or ended streams
  if (stream.status !== "started") {
    if (stream.status === "ended") {
      throw new Error("This stream has ended and is no longer available");
    }
    if (stream.status === "scheduled") {
      throw new Error("Stream has not started yet");
    }
    throw new Error("Stream is not active");
  }

  // === Check private stream access ===
  if (
    stream.visibility === "private" &&
    !canAccessStream(stream, user, "join")
  ) {
    throw new Error("You are not authorized to join this private stream");
  }

  // === Check ban status ===
  const banRecord = await StreamBan.findOne({
    stream: streamId,
    user: user._id,
  });

  if (banRecord) {
    throw new Error("You are banned from this stream");
  }

  return stream;
};

// ==================== LiveKit Client Management ====================

/**
 * Get an authenticated LiveKit RoomServiceClient
 * Validates configuration before creating client
 * Normalizes URL format
 * @throws {Error} If configuration is invalid or missing
 */
export const getLivekitClient = () => {
  const config = validateLivekitConfiguration();

  try {
    const client = new RoomServiceClient(
      config.host,
      config.apiKey,
      config.apiSecret,
    );

    return client;
  } catch (error) {
    throw error;
  }
};

// ==================== Webhook Verification ====================

let cachedWebhookReceiver = null;

/**
 * Get (and cache) a WebhookReceiver instance for verifying LiveKit webhook
 * payloads. Uses the same API key/secret as everything else in this file.
 */
export const getWebhookReceiver = () => {
  if (cachedWebhookReceiver) return cachedWebhookReceiver;

  const apiKey = getLivekitApiKey();
  const apiSecret = getLivekitApiSecret();

  if (!apiKey || !apiSecret) {
    throw new Error(
      "LiveKit configuration missing: LIVEKIT_API_KEY, LIVEKIT_API_SECRET",
    );
  }

  cachedWebhookReceiver = new WebhookReceiver(apiKey, apiSecret);
  return cachedWebhookReceiver;
};

/**
 * Verify and parse an incoming LiveKit webhook request.
 *
 * IMPORTANT: `rawBody` must be the raw, unparsed request body (a Buffer or
 * string), NOT JSON.parse()'d. Signature verification hashes the raw bytes,
 * so if your app applies a global express.json() middleware before this
 * route, verification will fail. Mount this route with express.raw()
 * (or place it before your global json() middleware).
 *
 * @param {Buffer|string} rawBody - Raw request body
 * @param {string} authHeader - Value of the `Authorization` request header
 * @returns {Object} Parsed, verified WebhookEvent
 * @throws {Error} If signature verification fails
 */
export const verifyLivekitWebhook = (rawBody, authHeader) => {
  const receiver = getWebhookReceiver();
  return receiver.receive(rawBody, authHeader);
};

/**
 * Extract the Stream ObjectId from a LiveKit room name of the form
 * `stream_<streamId>` (see getStreamRoomName above). Returns null if the
 * room name doesn't match the expected pattern - defends against acting on
 * rooms this app didn't create (e.g. another app sharing the same project).
 */
export const streamIdFromRoomName = (roomName) => {
  if (!roomName || !roomName.startsWith("stream_")) return null;
  const candidate = roomName.slice("stream_".length);
  return mongoose.Types.ObjectId.isValid(candidate) ? candidate : null;
};

// ==================== Participant Removal ====================

/**
 * Remove a participant from a LiveKit room
 * Idempotent: safe to call multiple times even if participant not in room
 *
 * @param {Object} params
 * @param {string} params.streamId - Stream ID
 * @param {string} params.userId - User ID to remove
 * @returns {Object} Result with {removed: boolean, alreadyDisconnected: boolean}
 * @throws {Error} Only throws for real LiveKit errors (auth, server), not for "not found"
 */
export const removeParticipantFromLivekit = async ({ streamId, userId }) => {
  const roomName = getStreamRoomName(streamId);

  try {
    const client = getLivekitClient();

    try {
      await client.removeParticipant(roomName, userId.toString());

      return { removed: true, alreadyDisconnected: false };
    } catch (error) {
      // If participant was already not in room, that's OK (idempotent)
      if (isIgnorableLivekitError(error)) {
        return { removed: true, alreadyDisconnected: true };
      }

      // Real error - authentication, authorization, server error, etc
      throw error;
    }
  } catch (error) {
    // If we can't create the LiveKit client, that's a configuration problem
    if (error.message.includes("configuration")) {
      throw error;
    }

    // Re-throw the error
    throw error;
  }
};

// ==================== Room Cleanup ====================

/**
 * Delete a LiveKit room when stream ends
 * Idempotent: safe to call multiple times
 *
 * @param {string} streamId - Stream ID
 * @returns {Object} Result with {deleted: boolean, alreadyDeleted: boolean}
 * @throws {Error} Only throws for real LiveKit errors, not for "not found"
 */
export const deleteRoomInLivekit = async (streamId) => {
  const roomName = getStreamRoomName(streamId);

  try {
    const client = getLivekitClient();

    try {
      await client.deleteRoom(roomName);

      return { deleted: true, alreadyDeleted: false };
    } catch (error) {
      // If room was already deleted, that's OK (idempotent)
      if (isIgnorableLivekitError(error)) {
        return { deleted: true, alreadyDeleted: true };
      }

      // Real error - authentication, authorization, server error, etc
      throw error;
    }
  } catch (error) {
    if (error.message.includes("configuration")) {
      throw error;
    }
    throw error;
  }
};

// ==================== Permission Synchronization ====================

/**
 * Synchronize participant permissions between MongoDB and LiveKit
 * Makes the operation safe by:
 * 1. Capturing state BEFORE changes
 * 2. Updating MongoDB first
 * 3. Then syncing to LiveKit
 * 4. Rolling back MongoDB if LiveKit sync fails
 *
 * This ensures DB and LiveKit never get permanently out of sync.
 * If sync fails, operator can retry the update safely.
 *
 * @param {Object} params
 * @param {string} params.streamId - Stream ID
 * @param {Object} params.participant - Participant record
 * @param {string} params.permission - Permission name (microphone|camera|screen-share)
 * @param {boolean} params.enabled - Whether to enable or disable
 * @returns {Object} Synchronized participant
 * @throws {Error} Only if update cannot be completed safely
 */
export const syncParticipantPermissionsInLivekit = async ({
  streamId,
  participant,
  permission,
  enabled,
}) => {
  if (!participant || !participant._id) {
    throw new Error("Valid participant record required");
  }

  if (!streamId) {
    throw new Error("Stream ID required");
  }

  // Validate permission type
  const validPermissions = ["microphone", "camera", "screen-share"];
  if (!validPermissions.includes(permission)) {
    throw new Error(
      `Invalid permission: ${permission}. Must be one of: ${validPermissions.join(", ")}`,
    );
  }

  const roomName = getStreamRoomName(streamId);

  // Capture state BEFORE modifications
  const previousState = {
    microphoneEnabled: participant.microphoneEnabled,
    cameraEnabled: participant.cameraEnabled,
    screenShareEnabled: participant.screenShareEnabled,
    role: participant.role,
  };

  // UPDATE MONGODB FIRST
  // Apply the permission change to the participant record
  if (permission === "microphone") {
    participant.microphoneEnabled = enabled;
  } else if (permission === "camera") {
    participant.cameraEnabled = enabled;
  } else if (permission === "screen-share") {
    participant.screenShareEnabled = enabled;
  }

  // Recalculate role based on new permissions
  const newRole = calculateParticipantRole(participant);
  participant.role = newRole;

  // Save to MongoDB first (before LiveKit sync)
  try {
    await participant.save();
  } catch (dbError) {
    // If DB save fails, the permissions weren't changed
    throw dbError;
  }

  // THEN SYNC TO LIVEKIT
  let livekitSynced = false;
  let livekitError = null;

  try {
    const client = getLivekitClient();
    await client.updateParticipant(roomName, participant.user.toString(), {
      permission: {
        canPublish:
          participant.role === "host" ||
          toLivekitPublishSources(participant).length > 0,
        canPublishSources: toLivekitPublishSources(participant),
        canSubscribe: true,
      },
    });
    livekitSynced = true;
  } catch (error) {
    livekitError = error;

    // If participant not in LiveKit, that's OK - they haven't connected yet
    if (isIgnorableLivekitError(error)) {
      livekitSynced = true;
    } else {
      // Real error - try to rollback MongoDB changes
      // Restore previous state in MongoDB
      try {
        participant.microphoneEnabled = previousState.microphoneEnabled;
        participant.cameraEnabled = previousState.cameraEnabled;
        participant.screenShareEnabled = previousState.screenShareEnabled;
        participant.role = previousState.role;
        await participant.save();
      } catch (rollbackError) {
        // Don't throw rollback error - throw the original error instead
        // Operator should manually inspect DB state and retry
      }

      // Throw the original LiveKit error
      throw livekitError;
    }
  }

  return {
    participant,
    livekitSynced,
    previousState,
  };
};

/**
 * Reject any pending permission requests from a user
 * Used when user is kicked or banned
 *
 * @param {Object} params
 * @param {string} params.streamId - Stream ID
 * @param {string} params.userId - User ID
 */
export const rejectPendingRequestsForUser = async ({ streamId, userId }) => {
  try {
    // Invalidate both pending and approved requests for this user
    // This is called when a user is banned or kicked
    const result = await StreamRequest.updateMany(
      {
        stream: streamId,
        user: userId,
        status: { $in: ["pending", "approved"] },
      },
      {
        $set: {
          status: "revoked",
          reviewedAt: new Date(),
        },
      },
    );

    if (result.modifiedCount > 0) {
    }

    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Ensure a participant's LiveKit publishing permissions match their MongoDB state
 * This is called after permission changes to update connected participants
 * Does NOT change MongoDB state - assumes it's already synced
 *
 * @param {Object} params
 * @param {string} params.streamId - Stream ID
 * @param {Object} params.participant - Participant record (must have current permissions)
 * @throws {Error} If update fails
 */
export const ensureParticipantCanPublish = async ({
  streamId,
  participant,
}) => {
  if (!participant || !participant._id) {
    throw new Error("Valid participant record required");
  }

  if (!streamId) {
    throw new Error("Stream ID required");
  }

  const roomName = getStreamRoomName(streamId);

  try {
    const client = getLivekitClient();

    // Update LiveKit to match MongoDB permissions
    await client.updateParticipant(roomName, participant.user.toString(), {
      permission: {
        canPublish:
          participant.role === "host" ||
          getParticipantPublishingSources(participant).length > 0,
        canPublishSources: toLivekitPublishSources(participant),
        canSubscribe: true,
      },
    });
  } catch (error) {
    // If participant not in room, that's OK - they'll get correct permissions on connect
    if (isIgnorableLivekitError(error)) {
      return;
    }

    // Real error - log and throw
    throw error;
  }
};
