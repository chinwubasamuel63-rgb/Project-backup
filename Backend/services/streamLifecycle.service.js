import Stream from "../models/Stream.js";
import StreamAnalytics from "../models/StreamAnalytics.js";
import StreamParticipant from "../models/StreamParticipant.js";
import StreamBan from "../models/StreamBan.js";
import StreamRequest from "../models/StreamRequest.js";
import { v2 as cloudinary } from "cloudinary";
import { emitToStream } from "../sockets/index.js";
import {
  removeParticipantFromLivekit,
  deleteRoomInLivekit,
} from "./livekit.service.js";

export const buildStreamEndedPayload = (stream, options = {}) => ({
  streamId: stream._id?.toString() || stream.toString(),
  title: stream.title,
  hostId: stream.host?.toString(),
  reason: options.reason || "ended",
  endedAt: options.endedAt || new Date(),
});

export const finalizeStreamLifecycle = async (stream, options = {}) => {
  if (!stream) {
    throw new Error("Stream is required");
  }

  const streamId = stream._id ? stream._id : stream;
  let streamDoc = stream._id ? stream : await Stream.findById(streamId);

  if (!streamDoc) {
    throw new Error("Stream not found");
  }

  const endedAt = options.endedAt || new Date();

  // Use atomic update to prevent concurrent finalization
  // This ensures idempotency - if already ended, just return the existing data
  const existingEndedStream = await Stream.findById(streamDoc._id);

  if (existingEndedStream?.status === "ended") {
    // Already finalized, return early (idempotent)
    return {
      stream: existingEndedStream,
      alreadyEnded: true,
      analyticsCreated: false,
    };
  }

  // Atomically transition from started → ended
  const activeStream = await Stream.findOneAndUpdate(
    { _id: streamDoc._id, status: "started" },
    {
      $set: {
        status: "ended",
        endedAt,
        hostPresenceLastSeen: null, // Clear presence since stream ended
      },
    },
    { new: true },
  );

  streamDoc = activeStream || existingEndedStream;

  // If we couldn't update (because it was already ended), check and return early
  if (!activeStream && existingEndedStream?.status === "ended") {
    return {
      stream: existingEndedStream,
      alreadyEnded: true,
      analyticsCreated: false,
    };
  }

  if (!streamDoc) {
    throw new Error("Stream not found or unable to finalize");
  }

  const duration = streamDoc.startedAt
    ? Math.max(0, Math.floor((endedAt - streamDoc.startedAt) / 1000))
    : 0;

  // Check for existing analytics (idempotency - don't create duplicate analytics)
  const existingAnalytics = await StreamAnalytics.findOne({
    title: streamDoc.title,
    host: streamDoc.host,
    project: streamDoc.project,
    startedAt: streamDoc.startedAt,
    endedAt: {
      $gte: new Date(endedAt.getTime() - 5000), // Within 5 seconds
      $lte: new Date(endedAt.getTime() + 5000),
    },
  });

  let analyticsCreated = false;

  if (!existingAnalytics) {
    await StreamAnalytics.create({
      title: streamDoc.title,
      host: streamDoc.host,
      project: streamDoc.project,
      startedAt: streamDoc.startedAt,
      endedAt,
      duration,
      peakViewers: streamDoc.peakViewers,
      totalViewers: streamDoc.totalViewers,
    });

    analyticsCreated = true;
  }

  // Clean up LiveKit participants
  const participants = await StreamParticipant.find({ stream: streamDoc._id });

  await Promise.all(
    participants.map(async (participant) => {
      try {
        await removeParticipantFromLivekit({
          streamId: streamDoc._id,
          userId: participant.user,
        });
      } catch (error) {
        ;
        // Non-fatal, continue with cleanup
      }
    }),
  );

  // Delete the LiveKit room itself
  try {
    await deleteRoomInLivekit(streamDoc._id);
  } catch (error) {
    ;
    // Non-fatal, continue with cleanup
  }

  // Mark all participants as left (don't delete to preserve history)
  await StreamParticipant.updateMany(
    { stream: streamDoc._id },
    { $set: { leftAt: endedAt } },
  );

  // Clean up bans
  await StreamBan.deleteMany({ stream: streamDoc._id });

  // REQUIREMENT 9: Mark all pending/approved requests as revoked when stream ends
  // This preserves the audit trail of permission requests
  await StreamRequest.updateMany(
    {
      stream: streamDoc._id,
      status: { $in: ["pending", "approved"] },
    },
    {
      $set: {
        status: "revoked",
        reviewedAt: endedAt,
      },
    },
  );

  // Clean up old revoked requests (older than 30 days) to manage storage
  const thirtyDaysAgo = new Date(endedAt.getTime() - 30 * 24 * 60 * 60 * 1000);
  await StreamRequest.deleteMany({
    stream: streamDoc._id,
    status: "revoked",
    reviewedAt: { $lt: thirtyDaysAgo },
  });

  // Clean up thumbnail from cloud storage
  if (streamDoc.thumbnail?.publicId) {
    try {
      await cloudinary.uploader.destroy(streamDoc.thumbnail.publicId);
    } catch (error) {
      ;
      // Non-fatal, continue
    }
  }

  // Notify all participants that stream ended
  emitToStream(streamDoc._id, "stream:participants-updated", []);
  emitToStream(
    streamDoc._id,
    "stream:ended",
    buildStreamEndedPayload(streamDoc, options),
  );

  return {
    stream: streamDoc,
    alreadyEnded: false,
    analyticsCreated,
  };
};
