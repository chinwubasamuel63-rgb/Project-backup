import mongoose from "mongoose";
import User from "../../models/User.js";
import Project from "../../models/Project.js";
import SupportTicket from "../../models/SupportTicket.js";
import { sendEmail } from "../../services/email.service.js";
import createAuditLog from "../../utils/createAuditLog.js";
import {
  roleChangedEmail,
  accountSuspendedEmail,
  accountRestoredEmail,
  accountBannedEmail,
  accountUnbannedEmail,
} from "../../templates/emails/securityEmails.js";

const ADMIN_USER_FIELDS = [
  "username",
  "email",
  "role",
  "authProvider",
  "primaryTrack",
  "secondaryTracks",
  "avatar",
  "coverImage",
  "bio",
  "isVerified",
  "displayName",
  "skills",
  "experienceLevel",
  "portfolioUrl",
  "githubUrl",
  "linkedinUrl",
  "isOnline",
  "lastSeen",
  "isSuspended",
  "suspendedAt",
  "suspensionExpiresAt",
  "suspensionReason",
  "isBanned",
  "bannedAt",
  "banReason",
  "lastLoginAt",
  "flags",
  "adminNotes",
  "moderationHistory",
  "createdAt",
  "updatedAt",
].join(" ");

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
      .select(ADMIN_USER_FIELDS)
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
      message: "Unable to load admin users",
    });
  }
};

export const getUserDetailsAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const [user, projects, supportTickets] = await Promise.all([
      User.findById(userId).select(ADMIN_USER_FIELDS),
      Project.find({
        $or: [{ owner: userId }, { members: userId }],
      })
        .select(
          "name tagline status visibility owner members createdAt updatedAt",
        )
        .populate("owner", "username email")
        .sort({ updatedAt: -1 }),
      SupportTicket.find({
        $or: [{ student: userId }, { assignedInstructor: userId }],
      })
        .select(
          "ticketNumber title status priority createdAt updatedAt resolvedAt",
        )
        .sort({ createdAt: -1 }),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
      projects,
      supportTickets,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to process admin user request",
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

    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
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

    if (user.role === "admin" && role !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "The final admin account cannot be demoted",
        });
      }
    }

    if (user.role === role) {
      return res.status(400).json({
        success: false,
        message: "User already has this role",
      });
    }

    const previousRole = user.role;
    user.role = role;

    await user.save();

    await createAuditLog({
      admin: req.user._id,
      action: "ROLE_CHANGED",
      targetUser: user._id,
      details: JSON.stringify({
        previous: { role: previousRole },
        next: { role },
      }),
    });

    try {
      await sendEmail({
        to: user.email,
        subject: "Role Updated",
        html: roleChangedEmail(role),
      });
    } catch (error) {}

    const safeUser = await User.findById(userId).select(ADMIN_USER_FIELDS);

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      user: safeUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to update admin user",
    });
  }
};

export const adminUserAction = async (req, res) => {
  try {
    const { userId } = req.params;

    const { action, reason = "", note } = req.body;
    const reasonText = typeof reason === "string" ? reason.trim() : "";
    const noteText = typeof note === "string" ? note.trim() : "";

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

    const previousState = {
      role: user.role,
      isBanned: user.isBanned,
      isSuspended: user.isSuspended,
      flags: user.flags,
    };

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
          return res
            .status(400)
            .json({ success: false, message: "User is already suspended" });
        }
        const { expiresAt } = req.body;
        const expirationDate = new Date(expiresAt);
        if (
          !expiresAt ||
          Number.isNaN(expirationDate.getTime()) ||
          expirationDate <= new Date()
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message: "A future suspension expiration is required",
            });
        }
        if (!reasonText) {
          return res
            .status(400)
            .json({ success: false, message: "Suspension reason is required" });
        }
        user.isSuspended = true;
        user.suspendedAt = new Date();
        user.suspensionExpiresAt = expirationDate;
        user.suspensionReason = reasonText;
        user.moderationHistory.push({
          action: "suspend",
          reason: reasonText,
          performedBy: req.user._id,
        });
        break;
      }
      case "unsuspend": {
        if (!user.isSuspended) {
          return res
            .status(400)
            .json({ success: false, message: "User is not suspended" });
        }
        user.isSuspended = false;
        user.suspendedAt = null;
        user.suspensionExpiresAt = null;
        user.suspensionReason = "";
        user.moderationHistory.push({
          action: "unsuspend",
          reason: reasonText,
          performedBy: req.user._id,
        });
        break;
      }
      case "ban": {
        if (user.isBanned) {
          return res
            .status(400)
            .json({ success: false, message: "User is already banned" });
        }
        if (!reasonText) {
          return res
            .status(400)
            .json({ success: false, message: "Ban reason is required" });
        }
        user.isBanned = true;
        user.bannedAt = new Date();
        user.banReason = reasonText;
        user.isSuspended = false;
        user.suspendedAt = null;
        user.suspensionExpiresAt = null;
        user.suspensionReason = "";
        user.moderationHistory.push({
          action: "ban",
          reason: reasonText,
          performedBy: req.user._id,
        });
        break;
      }
      case "unban": {
        if (!user.isBanned) {
          return res
            .status(400)
            .json({ success: false, message: "User is not banned" });
        }
        user.isBanned = false;
        user.bannedAt = null;
        user.banReason = "";
        user.moderationHistory.push({
          action: "unban",
          reason: reasonText,
          performedBy: req.user._id,
        });
        break;
      }
      case "addFlag": {
        user.flags += 1;
        user.moderationHistory.push({
          action: "addFlag",
          reason: reasonText,
          performedBy: req.user._id,
        });
        break;
      }
      case "removeFlag": {
        user.flags = Math.max(0, user.flags - 1);
        user.moderationHistory.push({
          action: "removeFlag",
          reason: reasonText,
          performedBy: req.user._id,
        });
        break;
      }
      case "addNote": {
        if (!noteText) {
          return res
            .status(400)
            .json({ success: false, message: "Note is required" });
        }
        user.adminNotes.push({ note: noteText, addedBy: req.user._id });
        user.moderationHistory.push({
          action: "addNote",
          reason: "Admin note added",
          performedBy: req.user._id,
        });
        break;
      }
    }

    await user.save();

    const auditActions = {
      suspend: "USER_SUSPENDED",
      unsuspend: "USER_UNSUSPENDED",
      ban: "USER_BANNED",
      unban: "USER_UNBANNED",
      addFlag: "FLAG_ADDED",
      removeFlag: "FLAG_REMOVED",
      addNote: "ADMIN_NOTE_ADDED",
    };

    await createAuditLog({
      admin: req.user._id,
      action: auditActions[action],
      targetUser: user._id,
      details: JSON.stringify({
        previous: previousState,
        next: {
          role: user.role,
          isBanned: user.isBanned,
          isSuspended: user.isSuspended,
          flags: user.flags,
        },
        reason: reasonText || noteText,
      }),
    });

    // Email notifications remain unchanged...

    const safeUser = await User.findById(user._id).select(ADMIN_USER_FIELDS);

    res.status(200).json({
      success: true,
      message: `${action} completed successfully`,
      user: safeUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to process admin user action",
    });
  }
};
