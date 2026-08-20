import mongoose from "mongoose";
import Stream from "../models/Stream.js";
import StreamParticipant from "../models/StreamParticipant.js";
import {
  createParticipantToken,
  validateStreamAccessForLivekit,
} from "../services/livekit.service.js";

/**
 * Sanitize error messages to prevent exposing stack traces or sensitive information
 * @param {Error} error - The error object
 * @returns {string} Safe error message for client
 */
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
    "authentication",
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

/**
 * Generate a LiveKit access token for a participant
 *
 * Security checks:
 * - Stream must exist and be in "started" status
 * - Stream must not be "ended" (even if participant record cached)
 * - User must be authorized (not banned, has private stream access)
 * - User must have joined the stream (active participant record exists)
 * - Participant must not have left
 * - Token identity comes from authenticated req.user only
 *
 * @param {Object} req - Express request with authenticated user
 * @param {Object} res - Express response
 */
export const generateStreamToken = async (req, res) => {
  try {
    const { streamId } = req.params;
    // Validate stream ID format
    if (!mongoose.Types.ObjectId.isValid(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream ID",
      });
    }

    // Validate user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // === CRITICAL: Double-check stream is still active ===
    // Even if participant has a cached record, stream must be "started" not "ended"
    // This prevents tokens from being generated after stream ends
    const stream = await Stream.findById(streamId);
    if (!stream || stream.status !== "started") {
      if (!stream) {
        return res.status(404).json({
          success: false,
          message: "Stream not found",
        });
      }

      if (stream.status === "ended") {
        return res.status(410).json({
          success: false,
          message: "This stream has ended and is no longer available",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Stream is not active",
      });
    }

    // === Validate access (ban check, private stream access, etc) ===
    // This will throw specific errors if access is denied
    try {
      await validateStreamAccessForLivekit({
        streamId,
        user: req.user,
      });
    } catch (accessError) {
      // Convert known access errors to appropriate HTTP status codes
      if (
        accessError.message.includes("banned") ||
        accessError.message.includes("not authorized")
      ) {
        return res.status(403).json({
          success: false,
          message: accessError.message,
        });
      }
      if (accessError.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: accessError.message,
        });
      }
      // Other access validation errors
      return res.status(400).json({
        success: false,
        message: accessError.message,
      });
    }

    // === Check participant has active session ===
    // Participant record must exist and user must not have already left
    const participant = await StreamParticipant.findOne({
      stream: streamId,
      user: req.user._id,
      leftAt: null, // Only active participants can generate tokens
    });
    if (!participant) {
      return res.status(403).json({
        success: false,
        message: "You must join the stream first",
      });
    }

    // === Generate token ===
    const { jwt, roomName, participantRole } = await createParticipantToken({
      streamId,
      participant,
      user: req.user,
    });
    // === Success response ===
    res.status(200).json({
      success: true,
      token: jwt,
      roomName,
      participantRole,
      serverUrl: process.env.LIVEKIT_HOST || process.env.LIVEKIT_URL || "",
    });
  } catch (error) {
    let status = 500;
    let message = error?.message || "Token generation failed";

    if (
      message.includes("configuration missing") ||
      message.includes("LiveKit")
    ) {
      status = 503;
      message = "LiveKit service temporarily unavailable";
    } else if (message.includes("Authentication required")) {
      status = 401;
    } else if (
      message.includes("banned") ||
      message.includes("not authorized")
    ) {
      status = 403;
    } else if (message.includes("not found")) {
      status = 404;
    } else if (message.includes("not active")) {
      status = 400;
    } else {
      message = getSafeErrorMessage(error);
    }

    res.status(status).json({
      success: false,
      message,
    });
  }
};
