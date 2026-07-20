import Stream from "../models/Stream.js";
import StreamReport from "../models/StreamReport.js";
import createAuditLog from "../utils/createAuditLog.js";

export const createStreamReport = async (req, res) => {
  try {
    const { reason, details } = req.body;

    const stream = await Stream.findById(req.params.streamId);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
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
      .populate("reporter", "username email")
      .populate("host", "username email")
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
    const report = await StreamReport.findById(req.params.reportId);

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
      targetUser: report.reportedBy,
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
    const report = await StreamReport.findById(req.params.reportId);

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
      targetUser: report.reportedBy,
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
