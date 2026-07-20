import mongoose from "mongoose";
import User from "../../models/User.js";
import { sendEmail } from "../../services/email.service.js";
import createAuditLog from "../../utils/createAuditLog.js";
import {
  roleChangedEmail,
  accountSuspendedEmail,
  accountRestoredEmail,
  accountBannedEmail,
  accountUnbannedEmail,
} from "../../templates/emails/securityEmails.js";

export const getAllUsers = async (req, res) => {
  try {
    const {
      search,
      role,
      suspended,
      banned,
      page = 1,
      limit = 10,
      sort = "newest",
    } = req.query;

    const query = {};

    if (search?.trim()) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      query.$or = [
        {
          username: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          email: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (suspended === "true") {
      query.isSuspended = true;
    }

    if (suspended === "false") {
      query.isSuspended = false;
    }

    if (banned === "true") {
      query.isBanned = true;
    }

    if (banned === "false") {
      query.isBanned = false;
    }

    const currentPage = Math.max(1, Number(page));

    const pageLimit = Math.min(Math.max(1, Number(limit)), 100);

    const totalUsers = await User.countDocuments(query);

    const users = await User.find(query)
      .select("-password")
      .sort({
        createdAt: sort === "oldest" ? 1 : -1,
      })
      .skip((currentPage - 1) * pageLimit)
      .limit(pageLimit);

    res.status(200).json({
      success: true,

      pagination: {
        page: currentPage,
        limit: pageLimit,
        totalUsers,
        totalPages: Math.ceil(totalUsers / pageLimit),
      },

      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const allowedRoles = ["student", "instructor", "admin"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      process.env.ADMIN_EMAIL &&
      user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase() &&
      role !== "admin"
    ) {
      return res.status(400).json({
        success: false,
        message: "Primary admin role cannot be changed",
      });
    }

    if (req.user._id.toString() === userId && role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "You cannot remove your own admin role",
      });
    }

    if (user.role === role) {
      return res.status(400).json({
        success: false,
        message: "User already has this role",
      });
    }

    user.role = role;

    await user.save();

    await createAuditLog({
      admin: req.user._id,
      action: "ROLE_CHANGED",
      targetUser: user._id,
      details: `Role changed to ${role}`,
    });

    try {
      await sendEmail({
        to: user.email,
        subject: "Role Updated",
        html: roleChangedEmail(role),
      });
    } catch (error) {
      console.error("Role change email failed:", error.message);
    }

    const safeUser = await User.findById(userId).select("-password");

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      user: safeUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const adminUserAction = async (req, res) => {
  try {
    const { userId } = req.params;

    const { action, reason = "", note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const allowedActions = [
      "suspend",
      "unsuspend",
      "ban",
      "unban",
      "addFlag",
      "removeFlag",
      "addNote",
    ];

    if (!allowedActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Primary admin protection
    if (
      process.env.ADMIN_EMAIL &&
      user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()
    ) {
      return res.status(403).json({
        success: false,
        message: "Primary admin cannot be moderated",
      });
    }

    // Admin hierarchy protection
    if (
      user.role === "admin" &&
      req.user.email.toLowerCase() !== process.env.ADMIN_EMAIL?.toLowerCase()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only primary admin can moderate admins",
      });
    }

    // Prevent self moderation
    if (
      req.user._id.toString() === userId &&
      ["suspend", "ban"].includes(action)
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot perform this action on your own account",
      });
    }

    switch (action) {
      case "suspend": {
        if (user.isSuspended) {
          return res.status(400).json({
            success: false,
            message: "User is already suspended",
          });
        }

        const { expiresAt } = req.body;

        if (!expiresAt) {
          return res.status(400).json({
            success: false,
            message: "Expiration date is required",
          });
        }

        const expirationDate = new Date(expiresAt);

        if (expirationDate <= new Date()) {
          return res.status(400).json({
            success: false,
            message: "Expiration date must be in the future",
          });
        }

        if (!reason.trim()) {
          return res.status(400).json({
            success: false,
            message: "Suspension reason is required",
          });
        }

        user.isSuspended = true;
        user.suspendedAt = new Date();
        user.suspensionExpiresAt = expirationDate;
        user.suspensionReason = reason;

        user.moderationHistory.push({
          action: "suspend",
          reason,
          performedBy: req.user._id,
        });

        await createAuditLog({
          admin: req.user._id,
          action: "USER_SUSPENDED",
          targetUser: user._id,
          details: reason,
        });

        break;
      }

      case "unsuspend": {
        if (!user.isSuspended) {
          return res.status(400).json({
            success: false,
            message: "User is not suspended",
          });
        }

        user.isSuspended = false;
        user.suspendedAt = null;
        user.suspensionExpiresAt = null;
        user.suspensionReason = "";

        user.moderationHistory.push({
          action: "unsuspend",
          reason,
          performedBy: req.user._id,
        });

        await createAuditLog({
          admin: req.user._id,
          action: "USER_UNSUSPENDED",
          targetUser: user._id,
          details: reason,
        });

        break;
      }

      case "ban": {
        if (user.isBanned) {
          return res.status(400).json({
            success: false,
            message: "User is already banned",
          });
        }

        if (!reason.trim()) {
          return res.status(400).json({
            success: false,
            message: "Ban reason is required",
          });
        }

        user.isBanned = true;
        user.bannedAt = new Date();
        user.banReason = reason;

        user.isSuspended = false;
        user.suspendedAt = null;
        user.suspensionExpiresAt = null;
        user.suspensionReason = "";

        user.moderationHistory.push({
          action: "ban",
          reason,
          performedBy: req.user._id,
        });

        await createAuditLog({
          admin: req.user._id,
          action: "USER_BANNED",
          targetUser: user._id,
          details: reason,
        });

        break;
      }

      case "unban": {
        if (!user.isBanned) {
          return res.status(400).json({
            success: false,
            message: "User is not banned",
          });
        }

        user.isBanned = false;
        user.bannedAt = null;
        user.banReason = "";

        user.moderationHistory.push({
          action: "unban",
          reason,
          performedBy: req.user._id,
        });

        await createAuditLog({
          admin: req.user._id,
          action: "USER_UNBANNED",
          targetUser: user._id,
          details: reason,
        });

        break;
      }

      case "addFlag": {
        user.flags += 1;

        user.moderationHistory.push({
          action: "addFlag",
          reason,
          performedBy: req.user._id,
        });

        await createAuditLog({
          admin: req.user._id,
          action: "FLAG_ADDED",
          targetUser: user._id,
          details: reason,
        });

        break;
      }

      case "removeFlag": {
        user.flags = Math.max(0, user.flags - 1);

        user.moderationHistory.push({
          action: "removeFlag",
          reason,
          performedBy: req.user._id,
        });

        await createAuditLog({
          admin: req.user._id,
          action: "FLAG_REMOVED",
          targetUser: user._id,
          details: reason,
        });

        break;
      }

      case "addNote": {
        if (!note?.trim()) {
          return res.status(400).json({
            success: false,
            message: "Note is required",
          });
        }

        user.adminNotes.push({
          note: note.trim(),
          addedBy: req.user._id,
        });

        user.moderationHistory.push({
          action: "addNote",
          reason: "Admin note added",
          performedBy: req.user._id,
        });

        await createAuditLog({
          admin: req.user._id,
          action: "ADMIN_NOTE_ADDED",
          targetUser: user._id,
          details: note,
        });

        break;
      }
    }

    await user.save();

    // Email notifications remain unchanged...

    const safeUser = await User.findById(user._id).select("-password");

    res.status(200).json({
      success: true,
      message: `${action} completed successfully`,
      user: safeUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
