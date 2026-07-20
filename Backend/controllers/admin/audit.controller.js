import AuditLog from "../../models/AuditLog.js";

export const getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);

    const limit = Math.min(Math.max(1, Number(req.query.limit) || 20), 100);

    const logs = await AuditLog.find()
      .populate("admin", "username email")
      .populate("targetUser", "username email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalLogs = await AuditLog.countDocuments();

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
      message: error.message,
    });
  }
};
