import Conversation from "../models/Conversation.js";
import SupportTicket from "../models/SupportTicket.js";
import { sendEmail } from "../services/email.service.js";
import {
  supportTicketCreatedEmail,
  supportTicketClaimedEmail,
  supportTicketResolvedEmail,
  supportTicketClosedEmail,
} from "../templates/emails/supportTicketEmail.js";
import User from "../models/User.js";
import { createNotification } from "../utils/createNotification.js";
import { generateTicketNumber } from "../utils/generateTicketNumber.js";

export const createSupportTicket = async (req, res) => {
  try {
    const { title, description, priority } = req.body;

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
    });

    const ticket = await SupportTicket.create({
      ticketNumber,
      title,
      description,
      priority: priority || "Medium",

      student: req.user._id,

      conversation: conversation._id,

      track: req.user.primaryTrack,
    });

    try {
      await sendEmail({
        to: req.user.email,
        subject: `Support Ticket Created - ${ticket.ticketNumber}`,
        html: supportTicketCreatedEmail(ticket.ticketNumber, ticket.title),
      });
    } catch (error) {
      console.error("Support ticket created email failed:", error.message);
    }

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

    if (!isOwner && !isAssignedInstructor && !isAdmin) {
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

    if (ticket.assignedInstructor) {
      return res.status(409).json({
        success: false,
        message: "Ticket has already been claimed",
      });
    }

    ticket.assignedInstructor = req.user._id;

    ticket.claimedAt = new Date();

    ticket.status = "In Progress";

    await ticket.save();

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
    } catch (error) {
      console.error("Support ticket claimed email failed:", error.message);
    }

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
    const tickets = await SupportTicket.find({
      assignedInstructor: null,
      status: "Open",
    })
      .populate("student", "username email")
      .sort({ createdAt: 1 });

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

    const allowedStatuses = ["Open", "In Progress", "Resolved", "Closed"];

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

    ticket.status = status;

    await ticket.save();

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
      } catch (error) {
        console.error("Support ticket resolved email failed:", error.message);
      }
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
      } catch (error) {
        console.error("Support ticket closed email failed:", error.message);
      }
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
    const tickets = await SupportTicket.find({
      assignedInstructor: req.user._id,
    })
      .populate("student", "username email")
      .sort({ updatedAt: -1 });

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
