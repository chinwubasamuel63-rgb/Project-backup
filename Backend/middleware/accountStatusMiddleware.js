import User from "../models/User.js";

export const checkAccountStatus = async (req, res, next) => {
  try {
    // Extra safety
    if (req.user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "Your account has been banned",
      });
    }

    // Auto-expire suspension
    if (
      req.user.isSuspended &&
      req.user.suspensionExpiresAt &&
      req.user.suspensionExpiresAt <= new Date()
    ) {
      await User.findByIdAndUpdate(req.user._id, {
        isSuspended: false,
        suspendedAt: null,
        suspensionExpiresAt: null,
        suspensionReason: "",
      });

      req.user.isSuspended = false;
    }

    if (req.user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: "Your account is currently suspended",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
