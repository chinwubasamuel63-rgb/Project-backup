import AuditLog from "../models/AuditLog.js";

const createAuditLog = async ({
  admin,
  action,
  targetUser = null,
  targetStream = null,
  targetReport = null,
  details = "",
}) => {
  try {
    await AuditLog.create({
      admin,
      action,
      targetUser,
      targetStream,
      targetReport,
      details,
    });
  } catch (error) {
    console.error("Audit log error:", error.message);
  }
};

export default createAuditLog;
