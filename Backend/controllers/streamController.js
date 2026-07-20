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

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const emitParticipantsUpdate = async (streamId) => {
  const participants = await StreamParticipant.find({
    stream: streamId,
  })
    .populate("user", "username firstName lastName profilePicture")
    .sort({ joinedAt: 1 });

  emitToStream(streamId, "stream:participants-updated", participants);
};

const updateParticipantRole = (participant) => {
  const hasPermission =
    participant.microphoneEnabled ||
    participant.cameraEnabled ||
    participant.screenShareEnabled;

  participant.role = hasPermission ? "speaker" : "viewer";
};

export const createStream = async (req, res) => {
  try {
    const { title, description, visibility = "public", project } = req.body;

    const existingHostStream = await Stream.findOne({
      host: req.user._id,
      status: "live",
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

    const existingProjectStream = await Stream.findOne({
      project,
      status: "live",
    });

    if (existingHostStream) {
      return res.status(400).json({
        success: false,
        message: "You already have an active stream",
      });
    }

    if (visibility === "private") {
      if (!project) {
        return res.status(400).json({
          success: false,
          message: "Private streams require a project",
        });
      }

      const existingProject = await Project.findById(project);

      if (!existingProject) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      if (existingProject.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Only the project owner can create a private stream",
        });
      }

      const existingProjectStream = await Stream.findOne({
        project,
      });

      if (existingProjectStream) {
        return res.status(400).json({
          success: false,
          message: "This project already has an active stream",
        });
      }
    }

    const stream = await Stream.create({
      host: req.user._id,
      title: title.trim(),
      description: description?.trim() || "",
      visibility,
      project: visibility === "private" ? project : null,

      peakViewers: 0,
      totalViewers: 0,
    });

    const populatedStream = await Stream.findById(stream._id)
      .populate("host", "username email")
      .populate("project", "title");

    res.status(201).json({
      success: true,
      stream: populatedStream,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStreams = async (req, res) => {
  try {
    const streams = await Stream.find({
      visibility: "public",
    })
      .populate("host", "username email")
      .populate("project", "title")
      .sort({ createdAt: -1 });

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

export const getStreamById = async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.streamId)
      .populate("host", "username email")
      .populate("project", "title description");

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

export const endStream = async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.streamId);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    if (stream.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the stream host can end this stream",
      });
    }

    const endedAt = new Date();

    const duration = Math.floor((endedAt - stream.startedAt) / 1000);

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

    await StreamParticipant.deleteMany({
      stream: stream._id,
    });

    await StreamBan.deleteMany({
      stream: stream._id,
    });

    await StreamRequest.deleteMany({
      stream: stream._id,
    });

    if (stream.thumbnail?.publicId) {
      await cloudinary.uploader.destroy(stream.thumbnail.publicId);
    }

    await stream.deleteOne();

    res.status(200).json({
      success: true,
      message: "Stream ended successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const joinStream = async (req, res) => {
  try {
    const { streamId } = req.params;

    const stream = await Stream.findById(streamId).populate("project");

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
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

    const existingParticipation = await StreamParticipant.findOne({
      user: req.user._id,
    });

    if (existingParticipation) {
      return res.status(400).json({
        success: false,
        message: "Leave your current stream before joining another",
      });
    }

    if (stream.visibility === "private") {
      const project = stream.project;

      const isOwner = project.owner.toString() === req.user._id.toString();

      const isMember = project.members?.some(
        (memberId) => memberId.toString() === req.user._id.toString(),
      );

      if (!isOwner && !isMember) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this project",
        });
      }
    }

    const participant = await StreamParticipant.create({
      stream: stream._id,
      user: req.user._id,
      role:
        stream.host.toString() === req.user._id.toString() ? "host" : "viewer",
    });

    stream.totalViewers += 1;

    const currentParticipants = await StreamParticipant.countDocuments({
      stream: streamId,
    });

    if (currentParticipants > stream.peakViewers) {
      stream.peakViewers = currentParticipants;
    }

    await stream.save();

    emitToStream(streamId, "stream:participant-joined", {
      userId: req.user._id,
      role: participant.role,
    });

    await emitParticipantsUpdate(streamId);

    res.status(201).json({
      success: true,
      participant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const leaveStream = async (req, res) => {
  try {
    const { streamId } = req.params;

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

    // HOST LEAVING A PUBLIC STREAM
    if (stream.visibility === "public" && isHost) {
      emitToStream(streamId, "stream:participant-left", {
        userId: req.user._id,
      });

      await StreamParticipant.deleteMany({
        stream: streamId,
      });

      await emitParticipantsUpdate(streamId);

      await stream.deleteOne();

      return res.status(200).json({
        success: true,
        message: "Host left. Public stream ended.",
      });
    }

    // NORMAL PARTICIPANT LEAVING
    emitToStream(streamId, "stream:participant-left", {
      userId: req.user._id,
    });

    await participant.deleteOne();

    await emitParticipantsUpdate(streamId);

    if (stream.visibility === "private") {
      const remainingParticipants = await StreamParticipant.countDocuments({
        stream: streamId,
      });

      if (remainingParticipants === 0) {
        await stream.deleteOne();

        return res.status(200).json({
          success: true,
          message: "Last participant left. Private stream ended.",
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Left stream successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getParticipants = async (req, res) => {
  try {
    const participants = await StreamParticipant.find({
      stream: req.params.streamId,
    })
      .populate("user", "username firstName lastName profilePicture email")
      .sort({ joinedAt: 1 });

    res.status(200).json({
      success: true,
      count: participants.length,
      participants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const kickParticipant = async (req, res) => {
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
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    await participant.deleteOne();

    emitToStream(streamId, "stream:participant-kicked", {
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
      message: error.message,
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
      return res.status(400).json({
        success: false,
        message: "User is already banned",
      });
    }

    await StreamBan.create({
      stream: streamId,
      user: userId,
      bannedBy: req.user._id,
      reason,
    });

    await StreamParticipant.deleteOne({
      stream: streamId,
      user: userId,
    });

    emitToStream(streamId, "stream:participant-banned", {
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
      message: error.message,
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
      message: error.message,
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
      message: error.message,
    });
  }
};

export const requestPermission = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { requestType } = req.body;

    if (!["microphone", "camera", "screen-share"].includes(requestType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request type",
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

    if (participant.role === "host") {
      return res.status(400).json({
        success: false,
        message: "Host does not need permission requests",
      });
    }

    const permissionMap = {
      microphone: participant.microphoneEnabled,
      camera: participant.cameraEnabled,
      "screen-share": participant.screenShareEnabled,
    };

    if (permissionMap[requestType]) {
      return res.status(400).json({
        success: false,
        message: `${requestType} already enabled`,
      });
    }

    const existingRequest = await StreamRequest.findOne({
      stream: streamId,
      user: req.user._id,
      requestType,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: `You already have a pending ${requestType} request`,
      });
    }

    const request = await StreamRequest.create({
      stream: streamId,
      user: req.user._id,
      requestType,
    });

    emitToStream(streamId, "stream:request-created", {
      requestId: request._id,
      userId: req.user._id,
      requestType,
    });

    res.status(201).json({
      success: true,
      message: "Permission request submitted",
      request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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
      message: error.message,
    });
  }
};

export const approveRequest = async (req, res) => {
  try {
    const { streamId, requestId } = req.params;

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

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request already ${request.status}`,
      });
    }

    const participant = await StreamParticipant.findOne({
      stream: streamId,
      user: request.user,
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

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

    participant.role = "speaker";

    await participant.save();

    request.status = "approved";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();

    await request.save();

    emitToStream(streamId, "stream:request-approved", {
      requestId: request._id,
      userId: request.user,
      requestType: request.requestType,
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
      message: error.message,
    });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const { streamId, requestId } = req.params;

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

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request already ${request.status}`,
      });
    }

    request.status = "rejected";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();

    await request.save();

    emitToStream(streamId, "stream:request-rejected", {
      requestId: request._id,
      userId: request.user,
      requestType: request.requestType,
    });

    res.status(200).json({
      success: true,
      message: `${request.requestType} request rejected`,
      request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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

    updateParticipantRole(participant);

    await participant.save();

    emitToStream(streamId, "stream:permission-revoked", {
      userId,
      permission: "microphone",
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
      message: error.message,
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

    updateParticipantRole(participant);

    await participant.save();

    emitToStream(streamId, "stream:permission-revoked", {
      userId,
      permission: "camera",
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
      message: error.message,
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

    updateParticipantRole(participant);

    await participant.save();

    emitToStream(streamId, "stream:permission-revoked", {
      userId,
      permission: "screen-share",
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
      message: error.message,
    });
  }
};

export const uploadStreamThumbnail = async (req, res) => {
  try {
    const { streamId } = req.params;

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
      await cloudinary.uploader.destroy(stream.thumbnail.publicId);
    }

    const result = await uploadToCloudinary(
      req.file.buffer,
      "devstream-nexus/streams",
    );

    stream.thumbnail = {
      publicId: result.public_id,
      url: result.secure_url,
    };

    await stream.save();

    res.status(200).json({
      success: true,
      thumbnail: stream.thumbnail,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteStreamThumbnail = async (req, res) => {
  try {
    const { streamId } = req.params;

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

    stream.thumbnail = {
      publicId: "",
      url: "",
    };

    await stream.save();

    res.status(200).json({
      success: true,
      message: "Thumbnail removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
