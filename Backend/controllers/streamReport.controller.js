import mongoose from "mongoose";
import Stream from "../models/Stream.js";
import StreamReport from "../models/StreamReport.js";
import createAuditLog from "../utils/createAuditLog.js";
import { canAccessStream } from "../services/streamAccess.service.js";
import notifyAdmins from "../utils/notifyAdmins.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createStreamReport = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { reason, details } = req.body;

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

    if (stream.host.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot report your own stream",
      });
    }

    if (!canAccessStream(stream, req.user, "join")) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to report this stream",
      });
    }

    if (stream.status !== "started") {
      return res.status(400).json({
        success: false,
        message: "Reports can only be created for active streams",
      });
    }

    const existingReport = await StreamReport.findOne({
      stream: stream._id,
      reporter: req.user._id,
      status: "Pending",
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: "You already reported this stream",
      });
    }

    const report = await StreamReport.create({
      stream: stream._id,
      reporter: req.user._id,
      host: stream.host,
      reason,
      details,
    });

    await notifyAdmins({
      type: "stream_report",
      title: "New Stream Report",
      message: `A stream was reported for ${reason}.`,
      relatedEntity: report._id,
      relatedEntityType: "StreamReport",
    });

    res.status(201).json({
      success: true,
      report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllReports = async (req, res) => {
  try {
    const reports = await StreamReport.find()
      .populate("reporter", "username profilePicture")
      .populate("host", "username profilePicture")
      .populate("stream", "title status")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const reviewReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!isValidObjectId(reportId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report id",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const report = await StreamReport.findById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    report.status = "Reviewed";

    report.reviewedBy = req.user._id;

    report.reviewedAt = new Date();

    await report.save();

    await createAuditLog({
      admin: req.user._id,
      action: "REPORT_REVIEWED",
      targetUser: report.reporter,
      targetReport: report._id,
      details: "Report reviewed",
    });

    res.status(200).json({
      success: true,
      message: "Report reviewed",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const dismissReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!isValidObjectId(reportId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report id",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const report = await StreamReport.findById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    report.status = "Dismissed";

    report.reviewedBy = req.user._id;

    report.reviewedAt = new Date();

    await report.save();

    await createAuditLog({
      admin: req.user._id,
      action: "REPORT_DISMISSED",
      targetUser: report.reporter,
      targetReport: report._id,
      details: "Report dismissed",
    });

    res.status(200).json({
      success: true,
      message: "Report dismissed",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
