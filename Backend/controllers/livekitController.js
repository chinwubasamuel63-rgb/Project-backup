import mongoose from "mongoose";
import { AccessToken } from "livekit-server-sdk";
import Stream from "../models/Stream.js";
import StreamParticipant from "../models/StreamParticipant.js";
import StreamBan from "../models/StreamBan.js";

export const generateStreamToken = async (req, res) => {
  try {
    const { streamId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream ID",
      });
    }

    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      return res.status(500).json({
        success: false,
        message: "LiveKit configuration missing",
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
      return res.status(403).json({
        success: false,
        message: "You must join the stream first",
      });
    }

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

    const roomName = `stream_${streamId}`;

    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: req.user._id.toString(),
        name:
          req.user.username ||
          `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim(),
      },
    );

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: participant.role === "host" || participant.role === "speaker",
      canSubscribe: true,
    });

    const jwt = await token.toJwt();

    res.status(200).json({
      success: true,
      token: jwt,
      roomName,
      participantRole: participant.role,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
