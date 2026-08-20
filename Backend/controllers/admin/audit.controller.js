import AuditLog from "../../models/AuditLog.js";
import mongoose from "mongoose";

export const getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);

    const limit = Math.min(Math.max(1, Number(req.query.limit) || 20), 100);

    const query = {};

    if (req.query.action?.trim()) {
      query.action = req.query.action.trim();
    }

    if (req.query.adminId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.adminId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid admin ID",
        });
      }
      query.admin = req.query.adminId;
    }

    const logs = await AuditLog.find(query)
      .populate("admin", "username email")
      .populate("targetUser", "username email")
      .populate("targetStream", "title status")
      .populate("targetReport", "reason status")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalLogs = await AuditLog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: logs.length,
      totalLogs,
      currentPage: page,
      totalPages: Math.ceil(totalLogs / limit),
      logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to load audit logs",
    });
  }
};
