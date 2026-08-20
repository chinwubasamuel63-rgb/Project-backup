import mongoose from "mongoose";
import Stream from "../models/Stream.js";
import User from "../models/User.js";
import StreamParticipant from "../models/StreamParticipant.js";
import StreamBan from "../models/StreamBan.js";
import StreamRequest from "../models/StreamRequest.js";
import createAuditLog from "../utils/createAuditLog.js";
import { createNotification } from "../utils/createNotification.js";
import { finalizeStreamLifecycle } from "../services/streamLifecycle.service.js";
import { canAccessStream } from "../services/streamAccess.service.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getAllStreams = async (req, res) => {
  try {
    const streams = await Stream.find()
      .populate("host", "username role profilePicture")
      .populate("project", "name")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: streams.length,
      streams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStreamDetails = async (req, res) => {
  try {
    const { streamId } = req.params;

    if (!isValidObjectId(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream id",
      });
    }

    const stream = await Stream.findById(streamId)
      .populate("host", "username role profilePicture")
      .populate("project");

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    if (
      req.user.role !== "admin" &&
      !canAccessStream(stream, req.user, "read")
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this stream",
      });
    }

    res.status(200).json({
      success: true,
      stream,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const forceEndStream = async (req, res) => {
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

    if (stream.status === "ended") {
      return res.status(400).json({
        success: false,
        message: "Stream already ended",
      });
    }

    await finalizeStreamLifecycle(stream, {
      reason: "admin-force-ended",
      endedAt: new Date(),
    });

    await createNotification({
      user: stream.host,
      type: "stream_force_ended",
      title: "Stream Ended By Admin",
      message: "An administrator ended your stream.",
      relatedEntity: stream._id,
      relatedEntityType: "Stream",
    });

    await createAuditLog({
      admin: req.user._id,
      action: "STREAM_FORCE_ENDED",
      targetUser: stream.host,
      targetStream: stream._id,
      details: "Stream ended by admin",
    });

    res.status(200).json({
      success: true,
      message: "Stream force ended successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const suspendStreamHost = async (req, res) => {
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

    const host = await User.findById(stream.host);

    if (!host) {
      return res.status(404).json({
        success: false,
        message: "Host not found",
      });
    }

    host.isSuspended = true;

    host.suspensionReason = "Streaming policy violation";

    await host.save();

    if (stream.status === "started") {
      await finalizeStreamLifecycle(stream, {
        reason: "host-suspended",
        endedAt: new Date(),
      });
    }

    await createNotification({
      user: host._id,
      type: "account_suspended",
      title: "Account Suspended",
      message:
        "Your account has been suspended due to streaming policy violations.",
    });

    await createAuditLog({
      admin: req.user._id,
      action: "STREAM_HOST_SUSPENDED",
      targetUser: host._id,
      targetStream: stream._id,
      details: "Host suspended through stream moderation",
    });

    res.status(200).json({
      success: true,
      message: "Host suspended successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
