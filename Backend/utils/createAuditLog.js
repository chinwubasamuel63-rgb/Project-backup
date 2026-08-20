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
    throw new Error("Audit log could not be written");
  }
};

export default createAuditLog;
