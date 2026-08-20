import mongoose from "mongoose";
import SupportTicket from "../../models/SupportTicket.js";
import Conversation from "../../models/Conversation.js";
import Message from "../../models/Message.js";
import User from "../../models/User.js";
import createAuditLog from "../../utils/createAuditLog.js";
import { createNotification } from "../../utils/createNotification.js";

export const getAllSupportTickets = async (req, res) => {
  try {
    const {
      search = "",
      status,
      priority,
      track,
      assignedInstructor,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (search.trim()) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      query.$or = [
        {
          title: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          ticketNumber: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (track) query.track = track;
    if (assignedInstructor === "unassigned") {
      query.assignedInstructor = null;
    } else if (assignedInstructor) {
      if (!mongoose.Types.ObjectId.isValid(assignedInstructor)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid instructor ID" });
      }
      query.assignedInstructor = assignedInstructor;
    }

    const pageNumber = Math.max(1, Number(page));

    const pageLimit = Math.min(Math.max(1, Number(limit)), 100);

    const totalTickets = await SupportTicket.countDocuments(query);

    const tickets = await SupportTicket.find(query)
      .populate("student", "username email avatar role")
      .populate("assignedInstructor", "username email avatar role")
      .sort({
        createdAt: -1,
      })
      .skip((pageNumber - 1) * pageLimit)
      .limit(pageLimit);

    res.status(200).json({
      success: true,

      pagination: {
        page: pageNumber,
        limit: pageLimit,
        totalTickets,

        totalPages: Math.ceil(totalTickets / pageLimit),
      },

      tickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to process admin support request",
    });
  }
};

export const getSupportTicketByIdAdmin = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const ticket = await SupportTicket.findById(req.params.ticketId)
      .populate(
        "student",
        "username email avatar role bio isVerified createdAt lastSeen isOnline",
      )
      .populate("assignedInstructor", "username email avatar role")
      .populate("statusHistory.changedBy", "username email role")
      .populate("conversation");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const messages = ticket.conversation
      ? await Message.find({ conversation: ticket.conversation._id })
          .select(
            "conversation sender content attachments createdAt updatedAt edited isDeletedForEveryone",
          )
          .populate("sender", "username email avatar role")
          .sort({ createdAt: 1 })
      : [];

    res.status(200).json({
      success: true,
      ticket,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to process admin support request",
    });
  }
};

export const getSupportAssignees = async (req, res) => {
  try {
    const instructors = await User.find({ role: "instructor" })
      .select("username email avatar role")
      .sort({ username: 1 });

    return res.status(200).json({ success: true, instructors });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Unable to load support assignees" });
  }
};

export const assignSupportTicketAdmin = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { instructorId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(ticketId) ||
      !mongoose.Types.ObjectId.isValid(instructorId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ticket or instructor ID" });
    }

    const [ticket, instructor] = await Promise.all([
      SupportTicket.findById(ticketId),
      User.findOne({ _id: instructorId, role: "instructor" }).select(
        "username email",
      ),
    ]);

    if (!ticket)
      return res
        .status(404)
        .json({ success: false, message: "Ticket not found" });
    if (!instructor)
      return res
        .status(404)
        .json({ success: false, message: "Instructor not found" });
    if (ticket.status !== "Open" || ticket.assignedInstructor) {
      return res.status(400).json({
        success: false,
        message: "Only unassigned open tickets can be assigned",
      });
    }

    ticket.assignedInstructor = instructor._id;
    ticket.claimedAt = new Date();
    ticket.status = "Claimed";
    ticket.statusHistory.push({
      status: "Claimed",
      changedBy: req.user._id,
      note: `Assigned to ${instructor.username}`,
    });
    ticket.lastActivityAt = new Date();
    await ticket.save();

    if (ticket.conversation) {
      await Conversation.findByIdAndUpdate(ticket.conversation, {
        $addToSet: { participants: { $each: [instructor._id, req.user._id] } },
      });
    }

    await createNotification({
      user: instructor._id,
      type: "support",
      title: "Support ticket assigned",
      message: `Ticket #${ticket.ticketNumber} was assigned to you.`,
      relatedEntity: ticket._id,
      relatedEntityType: "SupportTicket",
    });
    await createAuditLog({
      admin: req.user._id,
      action: "SUPPORT_TICKET_ASSIGNED",
      targetUser: ticket.student,
      details: `Ticket ${ticket.ticketNumber} assigned to instructor ${instructor.username}`,
    });

    return res
      .status(200)
      .json({ success: true, message: "Ticket assigned successfully", ticket });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Unable to assign support ticket" });
  }
};
