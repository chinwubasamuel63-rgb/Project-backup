import Stream from "../models/Stream.js";
import Project from "../models/Project.js";
import StreamParticipant from "../models/StreamParticipant.js";
import StreamBan from "../models/StreamBan.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import StreamRequest from "../models/StreamRequest.js";
import { emitToStream } from "../sockets/index.js";
import StreamAnalytics from "../models/StreamAnalytics.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import { canAccessStream } from "../services/streamAccess.service.js";
import { finalizeStreamLifecycle } from "../services/streamLifecycle.service.js";
import {
  removeParticipantFromLivekit,
  syncParticipantPermissionsInLivekit,
  rejectPendingRequestsForUser,
  calculateParticipantRole,
} from "../services/livekit.service.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Hard cap on concurrent active participants per stream.
// Keeps bandwidth/connection-minute usage predictable on a free-tier LiveKit
// deployment (self-hosted free VM or LiveKit Cloud free tier). Tune this
// based on your actual infra headroom.
const MAX_ACTIVE_PARTICIPANTS = parseInt(
  process.env.MAX_STREAM_PARTICIPANTS || "25",
  10,
);

const getSafeErrorMessage = (error) => {
  if (!error) return "An unexpected error occurred";
  const message = error?.message || "";
  const safeKeywords = [
    "validation",
    "not found",
    "already",
    "cannot",
    "invalid",
    "unauthorized",
    "banned",
    "access",
  ];
  const hasStackTrace =
    message.includes("at ") ||
    message.includes(".js:") ||
    message.includes("/");
  const isSafe =
    !hasStackTrace &&
    message.length < 200 &&
    (safeKeywords.some((kw) => message.toLowerCase().includes(kw)) ||
      message === "");
  return isSafe ? message : "An error occurred while processing your request";
};

const emitParticipantsUpdate = async (streamId) => {
  // Only emit active participants (those who haven't left)
  const participants = await StreamParticipant.find({
    stream: streamId,
    leftAt: null,
  })
    .populate("user", "username firstName lastName profilePicture")
    .sort({ joinedAt: 1 });

  emitToStream(streamId, "stream:participants-updated", participants);
};

const updateParticipantRole = (participant) => {
  participant.role = calculateParticipantRole(participant);
};

export const normalizeCreateStreamInput = (
  payload = {},
  authenticatedUser = {},
) => {
  const host = authenticatedUser?._id || authenticatedUser?.id || null;
  const title = typeof payload?.title === "string" ? payload.title.trim() : "";
  const description =
    typeof payload?.description === "string" ? payload.description.trim() : "";
  const visibility = ["public", "private"].includes(payload?.visibility)
    ? payload.visibility
    : "public";

  const normalized = {
    host,
    title,
    description,
    visibility,
  };

  if (visibility === "private" && payload?.project) {
    normalized.project = payload.project;
  } else {
    normalized.project = null;
  }

  return normalized;
};

export const normalizeStreamThumbnail = (thumbnail = null) => {
  if (!thumbnail || typeof thumbnail === "string") {
    return {
      publicId: "",
      url: typeof thumbnail === "string" ? thumbnail : "",
      secure_url: typeof thumbnail === "string" ? thumbnail : "",
    };
  }

  const publicId = thumbnail.publicId || thumbnail.public_id || "";
  const url = thumbnail.url || thumbnail.secure_url || thumbnail.src || "";

  return {
    publicId,
    url,
    secure_url: url,
  };
};

export const getDefaultJoinPermissions = ({ isHost = false } = {}) => ({
  microphoneEnabled: Boolean(isHost),
  cameraEnabled: Boolean(isHost),
  screenShareEnabled: false,
});

export const buildParticipantJoinUpdate = ({
  role,
  leftAt,
  joinedAt,
  microphoneEnabled = false,
  cameraEnabled = false,
  screenShareEnabled = false,
}) => {
  const base = {
    $set: {
      role,
      leftAt,
      microphoneEnabled,
      cameraEnabled,
      screenShareEnabled,
    },
    $setOnInsert: {
      joinCount: 1,
      joinedAt,
    },
  };

  return base;
};

export const createStream = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const normalizedInput = normalizeCreateStreamInput(req.body, req.user);
    const { title, description, visibility, project, host } = normalizedInput;

    const existingHostStream = await Stream.findOne({
      host: req.user._id,
      status: "started",
    });

    if (existingHostStream) {
      return res.status(400).json({
        success: false,
        message: "You already have an active stream",
      });
    }

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Stream title is required",
      });
    }

    if (!["public", "private"].includes(visibility)) {
      return res.status(400).json({
        success: false,
        message: "Invalid visibility type",
      });
    }

    let projectData = null;

    if (visibility === "private") {
      if (!project) {
        return res.status(400).json({
          success: false,
          message: "Private streams require a project",
        });
      }

      projectData = await Project.findById(project);

      if (!projectData) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      const isOwner = projectData.owner?.toString() === req.user._id.toString();

      const coOwners = Array.isArray(projectData.coOwners)
        ? projectData.coOwners
        : [];

      const isCoOwner = coOwners.some(
        (id) => id.toString() === req.user._id.toString(),
      );

      if (!isOwner && !isCoOwner) {
        return res.status(403).json({
          success: false,
          message:
            "Only project owners or co-owners can create private streams",
        });
      }

      const existingProjectStream = await Stream.findOne({
        project,
        status: "started",
      });

      if (existingProjectStream) {
        return res.status(400).json({
          success: false,
          message: "This project already has an active stream",
        });
      }
    }

    const stream = await Stream.create({
      host,
      title,
      description,
      visibility,
      project: visibility === "private" ? project : null,
      peakViewers: 0,
      totalViewers: 0,
    });

    const populatedStream = await Stream.findById(stream._id)
      .populate("host", "username email")
      .populate("project", "name");

    res.status(201).json({
      success: true,
      stream: populatedStream,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: getSafeErrorMessage(error),
    });
  }
};

export const startStream = async (req, res) => {
  try {
    const { streamId } = req.params;

    if (!isValidObjectId(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream id",
      });
    }

    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    if (!stream.host) {
      return res.status(500).json({
        success: false,
        message: "Stream data is invalid",
      });
    }

    if (stream.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the stream host can start this stream",
      });
    }

    // Already started - return success (idempotent)
    if (stream.status === "started") {
      const populatedStream = await Stream.findById(stream._id)
        .populate("host", "username email")
        .populate("project", "name");

      return res.status(200).json({
        success: true,
        message: "Stream already started",
        stream: populatedStream,
      });
    }

    // Cannot start ended streams
    if (stream.status === "ended") {
      return res.status(400).json({
        success: false,
        message: "Cannot start an ended stream. Create a new one instead.",
      });
    }

    // Only scheduled streams can be started
    if (stream.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "Only scheduled streams can be started",
      });
    }

    // Use atomic findOneAndUpdate to prevent race conditions
    const startedStream = await Stream.findOneAndUpdate(
      {
        _id: streamId,
        status: "scheduled", // Ensure it's still scheduled
        host: req.user._id,
      },
      {
        $set: {
          status: "started",
          startedAt: new Date(),
          hostPresenceLastSeen: new Date(), // Update presence when host starts stream
        },
      },
      { new: true },
    )
      .populate("host", "username email")
      .populate("project", "name");

    if (!startedStream) {
      // Race condition: stream already started by another request
      const recheck = await Stream.findById(streamId)
        .populate("host", "username email")
        .populate("project", "name");

      if (recheck?.status === "started") {
        return res.status(200).json({
          success: true,
          message: "Stream already started",
          stream: recheck,
        });
      }

      return res.status(400).json({
        success: false,
        message: "Failed to start stream. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Stream started successfully",
      stream: startedStream,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: getSafeErrorMessage(error),
    });
  }
};

export const getStreams = async (req, res) => {
  try {
    const streams = await Stream.find({
      visibility: "public",
      status: "started",
    })
      .populate("host", "username email")
      .populate("project", "title")
      .sort({ createdAt: -1 });

    const normalizedStreams = streams.map((stream) => ({
      ...stream.toObject(),
      thumbnail: normalizeStreamThumbnail(stream.thumbnail),
    }));

    res.status(200).json({
      success: true,
      count: normalizedStreams.length,
      streams: normalizedStreams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: getSafeErrorMessage(error),
    });
  }
};

export const getMyStreams = async (req, res) => {
  try {
    const streams = await Stream.find({
      host: req.user._id,
    })
      .populate("project", "name")
      .sort({ createdAt: -1 });

    const normalizedStreams = streams.map((stream) => ({
      ...stream.toObject(),
      thumbnail: normalizeStreamThumbnail(stream.thumbnail),
    }));

    res.status(200).json({
      success: true,
      count: normalizedStreams.length,
      streams: normalizedStreams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: getSafeErrorMessage(error),
    });
  }
};

export const getUserStreams = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }

    const streams = await Stream.find({
      host: req.params.userId,
      visibility: "public",
      status: "started",
    })
      .populate("project", "name")
      .sort({ createdAt: -1 });

    const normalizedStreams = streams.map((stream) => ({
      ...stream.toObject(),
      thumbnail: normalizeStreamThumbnail(stream.thumbnail),
    }));

    res.status(200).json({
      success: true,
      count: normalizedStreams.length,
      streams: normalizedStreams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: getSafeErrorMessage(error),
    });
  }
};

export const getStreamById = async (req, res) => {
  try {
    const { streamId } = req.params;
    if (!isValidObjectId(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream id",
      });
    }

    const stream = await Stream.findById(streamId)
      .populate("host", "username profilePicture")
      .populate(
        "project",
        "name description owner coOwners members visibility",
      );

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    if (!canAccessStream(stream, req.user, "read")) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this stream",
      });
    }

    const normalizedStream = {
      ...stream.toObject(),
      thumbnail: normalizeStreamThumbnail(stream.thumbnail),
    };

    res.status(200).json({
      success: true,
      stream: normalizedStream,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: getSafeErrorMessage(error),
    });
  }
};

export const endStream = async (req, res) => {
  try {
    const { streamId } = req.params;

    if (!isValidObjectId(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream id",
      });
    }

    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    // Idempotent: already ended
    if (stream.status === "ended") {
      return res.status(200).json({
        success: true,
        message: "Stream already ended",
      });
    }

    // Only host can end stream
    if (stream.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the stream host can end this stream",
      });
    }

    // Use atomic update to prevent concurrent end operations
    const endedStream = await Stream.findOneAndUpdate(
      {
        _id: streamId,
        status: { $in: ["scheduled", "started"] }, // Can end any non-ended stream
      },
      {
        $set: {
          status: "ended",
          endedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!endedStream) {
      // Race condition: already ended
      const recheck = await Stream.findById(streamId);
      if (recheck?.status === "ended") {
        return res.status(200).json({
          success: true,
          message: "Stream already ended",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Failed to end stream",
      });
    }

    // Finalize the stream lifecycle (cleanup participants, LiveKit room, etc.)
    await finalizeStreamLifecycle(endedStream);

    res.status(200).json({
      success: true,
      message: "Stream ended successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: getSafeErrorMessage(error),
    });
  }
};

export const joinStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    if (!isValidObjectId(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream id",
      });
    }

    const stream = await Stream.findById(streamId).populate("project");

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    if (stream.status !== "started") {
      return res.status(400).json({
        success: false,
        message: "Stream is not active",
      });
    }

    // Check ban status BEFORE attempting to join
    const banRecord = await StreamBan.findOne({
      stream: streamId,
      user: req.user._id,
    });

    if (banRecord) {
      return res.status(403).json({
        success: false,
        message: "You are banned from this stream",
      });
    }

    // Check private stream access
    if (
      stream.visibility === "private" &&
      !canAccessStream(stream, req.user, "join")
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to join this private stream",
      });
    }

    // Determine the correct role from the stream authoritative state
    // Host role comes from stream.host, NEVER from participant data or frontend
    const hostId = stream.host?._id || stream.host;
    const isHost = hostId && hostId.toString() === req.user._id.toString();
    const correctRole = isHost ? "host" : "viewer";

    // Enforce a hard room-size cap for everyone except the host (host must
    // always be allowed back in to manage/end their own stream). Only counts
    // people who are not already an active participant, so rejoining doesn't
    // get double-counted.
    if (!isHost) {
      const alreadyActive = await StreamParticipant.exists({
        stream: stream._id,
        user: req.user._id,
        leftAt: null,
      });

      if (!alreadyActive) {
        const activeCount = await StreamParticipant.countDocuments({
          stream: stream._id,
          leftAt: null,
        });

        if (activeCount >= MAX_ACTIVE_PARTICIPANTS) {
          return res.status(409).json({
            success: false,
            message: "This stream is full. Please try again later.",
          });
        }
      }
    }

    // Use atomic findOneAndUpdate with upsert to create/update participant.
    // Important: each field can only appear in one top-level operator per update.
    // role/leftAt are set in $set, while joinCount/joinedAt are set only on insert.
    const defaultJoinPermissions = getDefaultJoinPermissions({ isHost });

    let participant;
    try {
      participant = await StreamParticipant.findOneAndUpdate(
        {
          stream: stream._id,
          user: req.user._id,
        },
        buildParticipantJoinUpdate({
          role: correctRole,
          leftAt: null,
          joinedAt: new Date(),
          ...defaultJoinPermissions,
        }),
        {
          upsert: true,
          new: true,
        },
      );
    } catch (error) {
      if (error.code === 11000) {
        participant = await StreamParticipant.findOne({
          stream: stream._id,
          user: req.user._id,
        });
      } else {
        throw error;
      }
    }

    if (!participant) {
      throw new Error("Failed to create stream participant");
    }

    // Re-check ban status AFTER creating participant (race condition protection)
    // If user was banned between our initial check and participant creation,
    // mark participant as left and deny access
    const reCheckBan = await StreamBan.findOne({
      stream: streamId,
      user: req.user._id,
    });

    if (reCheckBan) {
      // Mark as left instead of deleting, to preserve history
      await StreamParticipant.updateOne(
        { _id: participant._id },
        { $set: { leftAt: new Date() } },
      );
      return res.status(403).json({
        success: false,
        message: "You are banned from this stream",
      });
    }

    // Determine if this is a first join or rejoin
    // First join: participant was just inserted (joinCount was 1 from $setOnInsert)
    // Rejoin: participant already existed and we just updated it (joinCount > 1)
    const isFirstJoin =
      participant.joinCount === 1 &&
      participant.createdAt.getTime() === participant.updatedAt.getTime();

    if (isFirstJoin) {
      // Only increment totalViewers on first join
      await Stream.updateOne({ _id: streamId }, { $inc: { totalViewers: 1 } });
    } else {
      // On rejoin, increment joinCount
      await StreamParticipant.updateOne(
        { _id: participant._id },
        { $inc: { joinCount: 1 } },
      );
    }

    // Update peakViewers based on current active participants
    const activeParticipants = await StreamParticipant.countDocuments({
      stream: streamId,
      leftAt: null,
    });

    if (activeParticipants > 0) {
      // Atomically update peakViewers only if new count is higher
      await Stream.updateOne(
        {
          _id: streamId,
          $expr: { $lt: ["$peakViewers", activeParticipants] },
        },
        { $set: { peakViewers: activeParticipants } },
      );
    }

    // Fetch latest participant data to return to client
    const updatedParticipant = await StreamParticipant.findById(
      participant._id,
    );
    const participantRole = calculateParticipantRole(updatedParticipant);
    updatedParticipant.role = participantRole;
    await updatedParticipant.save();

    emitToStream(streamId, "stream:participant-joined", {
      streamId,
      userId: req.user._id,
      role: updatedParticipant.role,
      isRejoin: !isFirstJoin,
    });

    await emitParticipantsUpdate(streamId);

    res.status(201).json({
      success: true,
      participant: updatedParticipant,
      isFirstJoin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: getSafeErrorMessage(error),
    });
  }
};

export const leaveStream = async (req, res) => {
  try {
    const { streamId } = req.params;

    if (!isValidObjectId(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream id",
      });
    }

    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    const participant = await StreamParticipant.findOne({
      stream: streamId,
      user: req.user._id,
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "You are not in this stream",
      });
    }

    const isHost = stream.host.toString() === req.user._id.toString();

    // Emit participant left event
    emitToStream(streamId, "stream:participant-left", {
      streamId,
      userId: req.user._id,
      isHost,
    });

    // Remove from LiveKit
    try {
      await removeParticipantFromLivekit({ streamId, userId: req.user._id });
    } catch (livekitError) {
      // Non-fatal error, continue
    }

    // Mark participant as left (set leftAt) instead of deleting
    // This preserves participant history while marking them inactive
    await StreamParticipant.updateOne(
      { _id: participant._id },
      { $set: { leftAt: new Date() } },
    );

    // REQUIREMENT 9: Invalidate pending/approved requests when participant leaves
    await StreamRequest.updateMany(
      {
        stream: streamId,
        user: req.user._id,
        status: { $in: ["pending", "approved"] },
      },
      {
        $set: {
          status: "revoked",
          reviewedAt: new Date(),
        },
      },
    );

    // Update host presence if this is the host (but don't end the stream)
    // The stream only ends when the host explicitly calls endStream()
    if (isHost && stream.status === "started") {
      // Update hostPresenceLastSeen to indicate host was last active at this moment
      await Stream.updateOne(
        { _id: streamId },
        { $set: { hostPresenceLastSeen: new Date() } },
      );
    }

    // Emit updated participant list
    await emitParticipantsUpdate(streamId);

    res.status(200).json({
      success: true,
      message: isHost ? "Host left the stream." : "Left stream successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: getSafeErrorMessage(error),
    });
  }
};

export const getParticipants = async (req, res) => {
  try {
    const { streamId } = req.params;
    if (!isValidObjectId(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream id",
      });
    }

    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    if (!canAccessStream(stream, req.user, "read")) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this stream",
      });
    }

    // Only return active participants (those who haven't left)
    const participants = await StreamParticipant.find({
      stream: streamId,
      leftAt: null,
    })
      .populate("user", "username firstName lastName profilePicture")
      .sort({ joinedAt: 1 });

    // Get statistics from stream
    const streamStats = {
      totalViewers: stream.totalViewers || 0,
      peakViewers: stream.peakViewers || 0,
      currentViewers: participants.length,
    };

    res.status(200).json({
      success: true,
      count: participants.length,
      participants,
      stats: streamStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: getSafeErrorMessage(error),
    });
  }
};

export const kickParticipant = async (req, res) => {
  try {
    const { streamId, userId } = req.params;

    if (!isValidObjectId(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream id",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    const isHost = stream.host.toString() === req.user._id.toString();

    if (!isHost) {
      return res.status(403).json({
        success: false,
        message: "Only the host can kick users",
      });
    }

    if (userId === stream.host.toString()) {
      return res.status(400).json({
        success: false,
        message: "Host cannot be kicked",
      });
    }

    const userToKick = await User.findById(userId);

    if (!userToKick) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const participant = await StreamParticipant.findOne({
      stream: streamId,
      user: userId,
    });

    if (!participant) {
      // Idempotent: already removed from stream (either never joined or already left/kicked)
      return res.status(200).json({
        success: true,
        message: "Participant not in stream",
      });
    }

    // If participant already left, this is idempotent
    if (participant.leftAt !== null) {
      return res.status(200).json({
        success: true,
        message: "Participant already left the stream",
      });
    }

    try {
      await removeParticipantFromLivekit({ streamId, userId });
    } catch (livekitError) {
      // Non-fatal error, continue
    }

    // Mark participant as left instead of deleting
    await StreamParticipant.updateOne(
      { _id: participant._id },
      { $set: { leftAt: new Date() } },
    );

    // REQUIREMENT 9: Invalidate pending/approved requests from kicked user
    // Mark them as revoked instead of deleting (audit trail)
    await StreamRequest.updateMany(
      {
        stream: streamId,
        user: userId,
        status: { $in: ["pending", "approved"] },
      },
      {
        $set: {
          status: "revoked",
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
        },
      },
    );

    emitToStream(streamId, "stream:participant-kicked", {
      streamId,
      userId,
    });

    await emitParticipantsUpdate(streamId);

    res.status(200).json({
      success: true,
      message: "Participant kicked successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: getSafeErrorMessage(error),
    });
  }
};

export const banParticipant = async (req, res) => {
  try {
    const { streamId, userId } = req.params;
    const reason = req.body?.reason?.trim() || "";

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    const isHost = stream.host.toString() === req.user._id.toString();

    if (!isHost) {
      return res.status(403).json({
        success: false,
        message: "Only the host can ban users",
      });
    }

    if (userId === stream.host.toString()) {
      return res.status(400).json({
        success: false,
        message: "Host cannot be banned",
      });
    }

    const userToBan = await User.findById(userId);

    if (!userToBan) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const existingBan = await StreamBan.findOne({
      stream: streamId,
      user: userId,
    });

    if (existingBan) {
      return res.status(409).json({
        success: false,
        message: "User is already banned",
      });
    }

    // Create ban record first (atomically blocks future joins)
    await StreamBan.create({
      stream: streamId,
      user: userId,
      bannedBy: req.user._id,
      reason,
    });

    try {
      await removeParticipantFromLivekit({ streamId, userId });
    } catch (livekitError) {
      // Non-fatal error (participant might not be in LiveKit), continue
    }

    await rejectPendingRequestsForUser({ streamId, userId });

    // Mark participant as left if they exist
    // This is safe if participant doesn't exist or already left
    const participant = await StreamParticipant.findOne({
      stream: streamId,
      user: userId,
    });

    if (participant && !participant.leftAt) {
      // Only update if participant exists and hasn't already left
      await StreamParticipant.updateOne(
        { _id: participant._id },
        { $set: { leftAt: new Date() } },
      );
    }

    emitToStream(streamId, "stream:participant-banned", {
      streamId,
      userId,
    });

    await emitParticipantsUpdate(streamId);

    res.status(200).json({
      success: true,
      message: "User banned successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: getSafeErrorMessage(error),
    });
  }
};

export const unbanParticipant = async (req, res) => {
  try {
    const { streamId, userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    const isHost = stream.host.toString() === req.user._id.toString();

    if (!isHost) {
      return res.status(403).json({
        success: false,
        message: "Only the host can unban users",
      });
    }

    const banRecord = await StreamBan.findOne({
      stream: streamId,
      user: userId,
    });

    if (!banRecord) {
      return res.status(404).json({
        success: false,
        message: "User is not banned",
      });
    }

    await banRecord.deleteOne();

    res.status(200).json({
      success: true,
      message: "User unbanned successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: getSafeErrorMessage(error),
    });
  }
};

export const getBannedUsers = async (req, res) => {
  try {
    const { streamId } = req.params;

    if (!isValidObjectId(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream id",
      });
    }

    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    const isHost = stream.host.toString() === req.user._id.toString();

    if (!isHost) {
      return res.status(403).json({
        success: false,
        message: "Only the host can view banned users",
      });
    }

    const bannedUsers = await StreamBan.find({
      stream: streamId,
    })
      .populate("user", "username firstName lastName profilePicture")
      .populate("bannedBy", "username");

    res.status(200).json({
      success: true,
      count: bannedUsers.length,
      bannedUsers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: getSafeErrorMessage(error),
    });
  }
};

export const requestPermission = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { requestType } = req.body;

    // Validate input
    if (!isValidObjectId(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream id",
      });
    }

    if (!["microphone", "camera", "screen-share"].includes(requestType)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid request type. Must be: microphone, camera, or screen-share",
      });
    }

    // Check stream exists and is active
    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    if (stream.status !== "started") {
      return res.status(400).json({
        success: false,
        message: `Cannot request permissions. Stream is ${stream.status}`,
      });
    }

    // Check private stream access
    if (
      stream.visibility === "private" &&
      !canAccessStream(stream, req.user, "join")
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to request permissions for this private stream",
      });
    }

    // REQUIREMENT 1: Banned user cannot create permission requests
    const banRecord = await StreamBan.findOne({
      stream: streamId,
      user: req.user._id,
    });

    if (banRecord) {
      return res.status(403).json({
        success: false,
        message:
          "You are banned from this stream and cannot request permissions",
      });
    }

    // Check participant exists and is active (not left)
    const participant = await StreamParticipant.findOne({
      stream: streamId,
      user: req.user._id,
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: "You must join the stream first",
      });
    }

    // REQUIREMENT 2: Kicked user cannot maintain stale requests (check if participant is still active)
    if (participant.leftAt) {
      return res.status(403).json({
        success: false,
        message: "You are no longer in this stream",
      });
    }

    // Host doesn't need permission requests
    if (participant.role === "host") {
      return res.status(400).json({
        success: false,
        message: "Host does not need permission requests",
      });
    }

    // Check if permission is already enabled
    const permissionMap = {
      microphone: participant.microphoneEnabled,
      camera: participant.cameraEnabled,
      "screen-share": participant.screenShareEnabled,
    };

    if (permissionMap[requestType]) {
      return res.status(400).json({
        success: false,
        message: `${requestType} is already enabled for you`,
      });
    }

    // REQUIREMENT 5: Prevent duplicate pending requests for same stream + user + requestType
    const existingPendingRequest = await StreamRequest.findOne({
      stream: streamId,
      user: req.user._id,
      requestType,
      status: "pending",
    });

    if (existingPendingRequest) {
      return res.status(400).json({
        success: false,
        message: `You already have a pending ${requestType} request`,
      });
    }

    // REQUIREMENT 6 & 7: Request cooldown - prevent spam after rejection
    // 5 minute cooldown after a rejected request
    const cooldownMs = 5 * 60 * 1000; // 5 minutes
    const lastRejected = await StreamRequest.findOne({
      stream: streamId,
      user: req.user._id,
      requestType,
      status: "rejected",
    }).sort({ lastRejectedAt: -1 });

    if (lastRejected && lastRejected.lastRejectedAt) {
      const timeSinceRejection =
        Date.now() - lastRejected.lastRejectedAt.getTime();
      if (timeSinceRejection < cooldownMs) {
        const secondsRemaining = Math.ceil(
          (cooldownMs - timeSinceRejection) / 1000,
        );
        return res.status(429).json({
          success: false,
          message: `Please wait ${secondsRemaining} seconds before requesting ${requestType} again`,
        });
      }
    }

    // REQUIREMENT 8: Request expiration - set expiration to 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create the request
    const request = await StreamRequest.create({
      stream: streamId,
      user: req.user._id,
      requestType,
      expiresAt,
    });

    // Emit event to host that a new request was created
    emitToStream(streamId, "stream:request-created", {
      streamId,
      requestId: request._id,
      userId: req.user._id,
      username: req.user.username,
      requestType,
      createdAt: request.createdAt,
    });

    res.status(201).json({
      success: true,
      message: "Permission request submitted",
      request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: getSafeErrorMessage(error),
    });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const { streamId } = req.params;

    if (!isValidObjectId(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream id",
      });
    }

    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    const isHost = stream.host.toString() === req.user._id.toString();

    if (!isHost) {
      return res.status(403).json({
        success: false,
        message: "Only the host can view requests",
      });
    }

    const requests = await StreamRequest.find({
      stream: streamId,
      status: "pending",
    })
      .populate("user", "username firstName lastName profilePicture")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: getSafeErrorMessage(error),
    });
  }
};

export const approveRequest = async (req, res) => {
  try {
    const { streamId, requestId } = req.params;

    // Validate input
    if (!isValidObjectId(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream id",
      });
    }

    if (!isValidObjectId(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request id",
      });
    }

    // Check stream exists and host is the current user
    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    const isHost = stream.host.toString() === req.user._id.toString();

    if (!isHost) {
      return res.status(403).json({
        success: false,
        message: "Only the host can approve requests",
      });
    }

    // Check request exists
    const request = await StreamRequest.findOne({
      _id: requestId,
      stream: streamId,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // Only pending requests can be approved
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request has already been ${request.status}`,
      });
    }

    // Validate requestType
    const validRequestTypes = ["microphone", "camera", "screen-share"];
    if (!validRequestTypes.includes(request.requestType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request type",
      });
    }

    // REQUIREMENT 3 & 4: Participant must exist when approved, and must not be left/kicked/banned
    const participant = await StreamParticipant.findOne({
      stream: streamId,
      user: request.user,
    });

    if (!participant) {
      // Participant no longer exists - invalidate request
      request.status = "revoked";
      request.reviewedBy = req.user._id;
      request.reviewedAt = new Date();
      await request.save();

      return res.status(404).json({
        success: false,
        message: "Participant no longer exists in the stream",
      });
    }

    // Check if participant has left
    if (participant.leftAt) {
      // Participant has left - invalidate request
      request.status = "revoked";
      request.reviewedBy = req.user._id;
      request.reviewedAt = new Date();
      await request.save();

      return res.status(410).json({
        success: false,
        message: "Participant has left the stream",
      });
    }

    // Check if participant is banned
    const banRecord = await StreamBan.findOne({
      stream: streamId,
      user: request.user,
    });

    if (banRecord) {
      // Participant is banned - invalidate request
      request.status = "revoked";
      request.reviewedBy = req.user._id;
      request.reviewedAt = new Date();
      await request.save();

      return res.status(403).json({
        success: false,
        message: "Participant is banned from the stream",
      });
    }

    // Update participant permissions based on request type
    switch (request.requestType) {
      case "microphone":
        participant.microphoneEnabled = true;
        break;
      case "camera":
        participant.cameraEnabled = true;
        break;
      case "screen-share":
        participant.screenShareEnabled = true;
        break;
    }

    participant.role = calculateParticipantRole(participant);

    // Try to sync to LiveKit (best effort)
    try {
      await syncParticipantPermissionsInLivekit({
        streamId,
        participant,
        permission: request.requestType,
        enabled: true,
      });
    } catch (livekitError) {
      // Continue - permissions are saved to MongoDB, will be synced on next connection
    }

    // Mark request as approved
    request.status = "approved";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();

    await request.save();

    // Emit event - notify requester that their request was approved
    emitToStream(streamId, "stream:request-approved", {
      streamId,
      requestId: request._id,
      userId: request.user,
      requestType: request.requestType,
      approvedBy: req.user._id,
      approvedAt: request.reviewedAt,
    });

    await emitParticipantsUpdate(streamId);

    res.status(200).json({
      success: true,
      message: `${request.requestType} request approved`,
      participant,
      request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: getSafeErrorMessage(error),
    });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const { streamId, requestId } = req.params;

    // Validate input
    if (!isValidObjectId(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream id",
      });
    }

    if (!isValidObjectId(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request id",
      });
    }

    // Check stream exists and host is the current user
    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    const isHost = stream.host.toString() === req.user._id.toString();

    if (!isHost) {
      return res.status(403).json({
        success: false,
        message: "Only the host can reject requests",
      });
    }

    // Check request exists
    const request = await StreamRequest.findOne({
      _id: requestId,
      stream: streamId,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // Only pending requests can be rejected
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request has already been ${request.status}`,
      });
    }

    // Validate requestType
    const validRequestTypes = ["microphone", "camera", "screen-share"];
    if (!validRequestTypes.includes(request.requestType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request type",
      });
    }

    // Mark request as rejected and record rejection timestamp for cooldown
    request.status = "rejected";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.lastRejectedAt = new Date(); // For cooldown tracking

    await request.save();

    // REQUIREMENT 11: Notify the requester that their request was rejected
    emitToStream(streamId, "stream:request-rejected", {
      streamId,
      requestId: request._id,
      userId: request.user,
      requestType: request.requestType,
      rejectedBy: req.user._id,
      rejectedAt: request.reviewedAt,
      message: `Your ${request.requestType} request was rejected`,
    });

    res.status(200).json({
      success: true,
      message: `${request.requestType} request rejected`,
      request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: getSafeErrorMessage(error),
    });
  }
};

export const revokeMicrophone = async (req, res) => {
  try {
    const { streamId, userId } = req.params;

    if (!isValidObjectId(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream id",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    const isHost = stream.host.toString() === req.user._id.toString();

    if (!isHost) {
      return res.status(403).json({
        success: false,
        message: "Only the host can revoke permissions",
      });
    }

    const participant = await StreamParticipant.findOne({
      stream: streamId,
      user: userId,
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    participant.microphoneEnabled = false;
    participant.role = calculateParticipantRole(participant);

    // Try to sync to LiveKit (best effort)
    try {
      await syncParticipantPermissionsInLivekit({
        streamId,
        participant,
        permission: "microphone",
        enabled: false,
      });
    } catch (livekitError) {
      // Continue - permissions are saved to MongoDB
    }

    // REQUIREMENT 12: Mark pending/approved microphone requests as revoked instead of deleting
    // This creates an audit trail
    await StreamRequest.updateMany(
      {
        stream: streamId,
        user: userId,
        requestType: "microphone",
        status: { $in: ["pending", "approved"] },
      },
      {
        $set: {
          status: "revoked",
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
        },
      },
    );

    // Emit revoke event
    emitToStream(streamId, "stream:permission-revoked", {
      streamId,
      userId,
      permission: "microphone",
      revokedBy: req.user._id,
      revokedAt: new Date(),
    });

    // REQUIREMENT 12: Also notify the user whose permission was revoked
    emitToStream(streamId, "stream:my-permission-revoked", {
      streamId,
      userId,
      permission: "microphone",
      message: "Your microphone permission has been revoked",
    });

    await emitParticipantsUpdate(streamId);

    res.status(200).json({
      success: true,
      message: "Microphone revoked",
      participant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: getSafeErrorMessage(error),
    });
  }
};

export const revokeCamera = async (req, res) => {
  try {
    const { streamId, userId } = req.params;

    if (!isValidObjectId(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream id",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    const isHost = stream.host.toString() === req.user._id.toString();

    if (!isHost) {
      return res.status(403).json({
        success: false,
        message: "Only the host can revoke permissions",
      });
    }

    const participant = await StreamParticipant.findOne({
      stream: streamId,
      user: userId,
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    participant.cameraEnabled = false;
    participant.role = calculateParticipantRole(participant);

    try {
      await syncParticipantPermissionsInLivekit({
        streamId,
        participant,
        permission: "camera",
        enabled: false,
      });
    } catch (livekitError) {}

    // Mark pending/approved camera requests as revoked instead of deleting
    await StreamRequest.updateMany(
      {
        stream: streamId,
        user: userId,
        requestType: "camera",
        status: { $in: ["pending", "approved"] },
      },
      {
        $set: {
          status: "revoked",
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
        },
      },
    );

    emitToStream(streamId, "stream:permission-revoked", {
      streamId,
      userId,
      permission: "camera",
      revokedBy: req.user._id,
      revokedAt: new Date(),
    });

    emitToStream(streamId, "stream:my-permission-revoked", {
      streamId,
      userId,
      permission: "camera",
      message: "Your camera permission has been revoked",
    });

    await emitParticipantsUpdate(streamId);

    res.status(200).json({
      success: true,
      message: "Camera revoked",
      participant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: getSafeErrorMessage(error),
    });
  }
};

export const revokeScreenShare = async (req, res) => {
  try {
    const { streamId, userId } = req.params;

    if (!isValidObjectId(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream id",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    const isHost = stream.host.toString() === req.user._id.toString();

    if (!isHost) {
      return res.status(403).json({
        success: false,
        message: "Only the host can revoke permissions",
      });
    }

    const participant = await StreamParticipant.findOne({
      stream: streamId,
      user: userId,
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    participant.screenShareEnabled = false;
    participant.role = calculateParticipantRole(participant);

    try {
      await syncParticipantPermissionsInLivekit({
        streamId,
        participant,
        permission: "screen-share",
        enabled: false,
      });
    } catch (livekitError) {}

    // Mark pending/approved screen-share requests as revoked instead of deleting
    await StreamRequest.updateMany(
      {
        stream: streamId,
        user: userId,
        requestType: "screen-share",
        status: { $in: ["pending", "approved"] },
      },
      {
        $set: {
          status: "revoked",
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
        },
      },
    );

    emitToStream(streamId, "stream:permission-revoked", {
      streamId,
      userId,
      permission: "screen-share",
      revokedBy: req.user._id,
      revokedAt: new Date(),
    });

    emitToStream(streamId, "stream:my-permission-revoked", {
      streamId,
      userId,
      permission: "screen-share",
      message: "Your screen share permission has been revoked",
    });

    await emitParticipantsUpdate(streamId);

    res.status(200).json({
      success: true,
      message: "Screen share revoked",
      participant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: getSafeErrorMessage(error),
    });
  }
};

export const uploadStreamThumbnail = async (req, res) => {
  try {
    const { streamId } = req.params;

    console.log("📤 uploadStreamThumbnail called:", {
      streamId,
      filePresent: !!req.file,
      fileSize: req.file?.size,
      fileName: req.file?.originalname,
      fileMimetype: req.file?.mimetype,
    });

    if (!isValidObjectId(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream id",
      });
    }

    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    if (stream.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the host can update the thumbnail",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image",
      });
    }

    if (stream.thumbnail?.publicId) {
      try {
        await cloudinary.uploader.destroy(stream.thumbnail.publicId);
      } catch (destroyError) {
        console.warn("Failed to destroy old thumbnail:", destroyError.message);
      }
    }

    console.log("📤 Uploading to Cloudinary...");
    const result = await uploadToCloudinary(
      req.file.buffer,
      "devstream-nexus/streams",
    );
    console.log("✅ Cloudinary upload succeeded:", {
      public_id: result.public_id,
      secure_url: result.secure_url,
    });

    stream.thumbnail = normalizeStreamThumbnail({
      publicId: result.public_id,
      public_id: result.public_id,
      url: result.secure_url,
      secure_url: result.secure_url,
    });

    await stream.save();
    console.log("✅ Stream thumbnail saved to database");

    res.status(200).json({
      success: true,
      thumbnail: stream.thumbnail,
    });
  } catch (error) {
    console.error("❌ uploadStreamThumbnail error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    res.status(500).json({
      success: false,
      message: getSafeErrorMessage(error),
    });
  }
};

export const deleteStreamThumbnail = async (req, res) => {
  try {
    const { streamId } = req.params;

    if (!isValidObjectId(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream id",
      });
    }

    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    if (stream.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the host can remove the thumbnail",
      });
    }

    if (!stream.thumbnail?.publicId) {
      return res.status(400).json({
        success: false,
        message: "This stream does not have a thumbnail",
      });
    }

    await cloudinary.uploader.destroy(stream.thumbnail.publicId);

    stream.thumbnail = normalizeStreamThumbnail({
      publicId: "",
      public_id: "",
      url: "",
      secure_url: "",
    });

    await stream.save();

    res.status(200).json({
      success: true,
      message: "Thumbnail removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: getSafeErrorMessage(error),
    });
  }
};
