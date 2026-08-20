import Conversation from "../models/Conversation.js";
import SupportTicket from "../models/SupportTicket.js";
import { sendEmail } from "../services/email.service.js";
import supportStatusFlow from "../utils/supportStatusFlow.js";
import {
  supportTicketCreatedEmail,
  supportTicketClaimedEmail,
  supportTicketResolvedEmail,
  supportTicketClosedEmail,
} from "../templates/emails/supportTicketEmail.js";
import User from "../models/User.js";
import { createNotification } from "../utils/createNotification.js";
import { generateTicketNumber } from "../utils/generateTicketNumber.js";
import { buildInstructorSupportActivityFeed } from "../utils/supportActivity.js";
import createAuditLog from "../utils/createAuditLog.js";
import notifyAdmins from "../utils/notifyAdmins.js";
import { getIO } from "../sockets/index.js";

export const createSupportTicket = async (req, res) => {
  try {
    const { title, description, priority, course, lesson } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const ticketNumber = await generateTicketNumber();

    const conversation = await Conversation.create({
      participants: [req.user._id],
      isGroup: false,
      name: `${ticketNumber} Support`,
      conversationType: "support", // Enforcing the conversation type
    });

    const ticket = await SupportTicket.create({
      ticketNumber,
      title,
      description,
      priority: priority || "Medium",
      student: req.user._id,
      conversation: conversation._id,
      track: req.user.primaryTrack,
      course: course || "",
      lesson: lesson || "",

      statusHistory: [
        {
          status: "Open",
          changedBy: req.user._id,
        },
      ],
    });

    try {
      await sendEmail({
        to: req.user.email,
        subject: `Support Ticket Created - ${ticket.ticketNumber}`,
        html: supportTicketCreatedEmail(ticket.ticketNumber, ticket.title),
      });
    } catch (error) {}

    await notifyAdmins({
      type: "support",
      title: "New Support Ticket",
      message: `Ticket #${ticket.ticketNumber} requires attention.`,
      relatedEntity: ticket._id,
      relatedEntityType: "SupportTicket",
    });

    res.status(201).json({
      success: true,
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({
      student: req.user._id,
    })
      .sort({ createdAt: -1 })
      .populate("assignedInstructor", "name username");

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.ticketId)
      .populate("student", "name username")
      .populate("assignedInstructor", "name username")
      .populate("conversation");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const isOwner = ticket.student._id.toString() === req.user._id.toString();
    const isAssignedInstructor =
      ticket.assignedInstructor &&
      ticket.assignedInstructor._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const isInstructor = req.user.role === "instructor";

    if (!isOwner && !isAssignedInstructor && !isAdmin && !isInstructor) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const claimTicket = async (req, res) => {
  try {
    if (req.user.role !== "instructor" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only instructors and admins can claim tickets",
      });
    }

    const ticket = await SupportTicket.findById(req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (ticket.status !== "Open") {
      return res.status(400).json({
        success: false,
        message: "Only open tickets can be claimed",
      });
    }

    if (ticket.assignedInstructor) {
      return res.status(409).json({
        success: false,
        message: "Ticket has already been claimed",
      });
    }

    // Assign and update status to Claimed
    ticket.assignedInstructor = req.user._id;
    ticket.claimedAt = new Date();
    ticket.status = "Claimed";

    ticket.statusHistory.push({
      status: "Claimed",
      changedBy: req.user._id,
    });

    // Automatically start work
    ticket.status = "In Progress";

    ticket.statusHistory.push({
      status: "In Progress",
      changedBy: req.user._id,
    });
    ticket.lastActivityAt = new Date();

    await ticket.save();

    if (req.user.role === "admin") {
      await createAuditLog({
        admin: req.user._id,
        action: "SUPPORT_TICKET_CLAIMED",
        targetUser: ticket.student,
        details: `Ticket ${ticket.ticketNumber} claimed by admin`,
      });
    }

    await createNotification({
      user: ticket.student,
      type: "support",
      title: "Support Ticket Claimed",
      message: `Your support ticket #${ticket.ticketNumber} has been claimed and is now being handled.`,
      relatedEntity: ticket._id,
      relatedEntityType: "SupportTicket",
    });

    try {
      const student = await User.findById(ticket.student);

      if (student?.email) {
        await sendEmail({
          to: student.email,
          subject: `Support Ticket Claimed - ${ticket.ticketNumber}`,
          html: supportTicketClaimedEmail(ticket.ticketNumber),
        });
      }
    } catch (error) {}

    await Conversation.findByIdAndUpdate(ticket.conversation, {
      $addToSet: {
        participants: req.user._id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Ticket claimed successfully",
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getOpenTickets = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 0;

    const query = SupportTicket.find({
      status: "Open",
    })
      .populate("student", "username email")
      .sort({
        priority: -1,
        createdAt: 1,
      });

    if (limit > 0) {
      query.limit(limit);
    }

    const tickets = await query;

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "Open",
      "Claimed",
      "In Progress",
      "Waiting For Student",
      "Resolved",
      "Closed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const isAdmin = req.user.role === "admin";
    const isAssignedInstructor =
      ticket.assignedInstructor &&
      ticket.assignedInstructor.toString() === req.user._id.toString();

    if (!isAdmin && !isAssignedInstructor) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this ticket",
      });
    }

    const allowedNextStatuses = supportStatusFlow[ticket.status] || [];

    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot move ticket from ${ticket.status} to ${status}`,
      });
    }

    ticket.status = status;
    ticket.lastActivityAt = new Date();
    ticket.statusHistory.push({
      status,
      changedBy: req.user._id,
    });

    // Timestamp management based on status
    if (status === "Resolved") {
      ticket.resolvedAt = new Date();
    } else if (status === "Closed") {
      ticket.closedAt = new Date();
    } else if (status === "Waiting For Student") {
      ticket.waitingForStudentAt = new Date();
    } else if (
      status === "In Progress" &&
      (ticket.resolvedAt || ticket.closedAt)
    ) {
      // If the ticket was previously resolved/closed and is now back in progress
      ticket.reopenedAt = new Date();
      ticket.resolvedAt = null;
      ticket.closedAt = null;
    }

    await ticket.save();

    const io = getIO();
    if (io) {
      const recipients = new Set([
        ticket.student.toString(),
        ticket.assignedInstructor?.toString(),
      ]);

      recipients.forEach((recipientId) => {
        if (recipientId) {
          io.to(recipientId).emit("support:status-updated", {
            ticketId: ticket._id.toString(),
            ticket,
          });
        }
      });
    }

    if (isAdmin) {
      await createAuditLog({
        admin: req.user._id,
        action: "SUPPORT_TICKET_STATUS_CHANGED",
        targetUser: ticket.student,
        details: `Ticket ${ticket.ticketNumber}: ${ticket.status}`,
      });
    }

    // Notifications and Emails
    if (status === "Resolved") {
      await createNotification({
        user: ticket.student,
        type: "support",
        title: "Ticket Resolved",
        message: `Your support ticket #${ticket.ticketNumber} has been resolved.`,
        relatedEntity: ticket._id,
        relatedEntityType: "SupportTicket",
      });

      try {
        const student = await User.findById(ticket.student);
        if (student?.email) {
          await sendEmail({
            to: student.email,
            subject: `Support Ticket Resolved - ${ticket.ticketNumber}`,
            html: supportTicketResolvedEmail(ticket.ticketNumber),
          });
        }
      } catch (error) {}
    }

    if (status === "Closed") {
      await createNotification({
        user: ticket.student,
        type: "support",
        title: "Ticket Closed",
        message: `Your support ticket #${ticket.ticketNumber} has been closed.`,
        relatedEntity: ticket._id,
        relatedEntityType: "SupportTicket",
      });

      try {
        const student = await User.findById(ticket.student);
        if (student?.email) {
          await sendEmail({
            to: student.email,
            subject: `Support Ticket Closed - ${ticket.ticketNumber}`,
            html: supportTicketClosedEmail(ticket.ticketNumber),
          });
        }
      } catch (error) {}
    }

    res.status(200).json({
      success: true,
      message: "Ticket status updated successfully",
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAssignedTickets = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 0;
    const statusParam = req.query.status;
    const query = {
      assignedInstructor: req.user._id,
    };

    if (statusParam) {
      query.status = {
        $in: Array.isArray(statusParam)
          ? statusParam
          : statusParam
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
      };
    }

    const supportQuery = SupportTicket.find(query)
      .populate("student", "username email")
      .sort({
        lastActivityAt: -1,
      });

    if (limit > 0) {
      supportQuery.limit(limit);
    }

    const tickets = await supportQuery;

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getInstructorSupportOverview = async (req, res) => {
  try {
    const [open, assigned, inProgress, waitingForStudent, resolved] =
      await Promise.all([
        SupportTicket.countDocuments({ status: "Open" }),
        SupportTicket.countDocuments({ assignedInstructor: req.user._id }),
        SupportTicket.countDocuments({
          assignedInstructor: req.user._id,
          status: { $in: ["Claimed", "In Progress"] },
        }),
        SupportTicket.countDocuments({
          assignedInstructor: req.user._id,
          status: "Waiting For Student",
        }),
        SupportTicket.countDocuments({
          assignedInstructor: req.user._id,
          status: { $in: ["Resolved", "Closed"] },
        }),
      ]);

    res.status(200).json({
      success: true,
      overview: {
        open,
        assigned,
        inProgress,
        waitingForStudent,
        resolved,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getInstructorSupportActivity = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const tickets = await SupportTicket.find({
      assignedInstructor: req.user._id,
    })
      .select("ticketNumber title student statusHistory")
      .populate("student", "username")
      .sort({ lastActivityAt: -1 })
      .limit(20);

    const activityFeed = buildInstructorSupportActivityFeed(tickets, limit);

    res.status(200).json({
      success: true,
      activityFeed,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
