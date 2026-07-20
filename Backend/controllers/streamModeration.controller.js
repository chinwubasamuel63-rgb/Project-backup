import Stream from "../models/Stream.js";
import User from "../models/User.js";
import createAuditLog from "../utils/createAuditLog.js";
import { createNotification } from "../utils/createNotification.js";

export const getAllStreams = async (req, res) => {
  try {
    const streams = await Stream.find()
      .populate("host", "username email role")
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
    const stream = await Stream.findById(req.params.streamId)
      .populate("host", "username email role")
      .populate("project");

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
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
    const stream = await Stream.findById(req.params.streamId);

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

    const endedAt = new Date();

    const duration = stream.startedAt
      ? Math.floor((endedAt - stream.startedAt) / 1000)
      : 0;

    await StreamAnalytics.create({
      title: stream.title,
      host: stream.host,
      project: stream.project,
      startedAt: stream.startedAt,
      endedAt,
      duration,
      peakViewers: stream.peakViewers,
      totalViewers: stream.totalViewers,
    });

    await StreamParticipant.deleteMany({ stream: stream._id });
    await StreamBan.deleteMany({ stream: stream._id });
    await StreamRequest.deleteMany({ stream: stream._id });

    if (stream.thumbnail?.publicId) {
      await cloudinary.uploader.destroy(stream.thumbnail.publicId);
    }

    await stream.deleteOne();

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
    const stream = await Stream.findById(req.params.streamId);

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

    if (stream.status === "live") {
      stream.status = "ended";

      stream.endedAt = new Date();

      await stream.save();
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
