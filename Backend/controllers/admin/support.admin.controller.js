import mongoose from "mongoose";
import SupportTicket from "../../models/SupportTicket.js";

export const getAllSupportTickets = async (req, res) => {
  try {
    const { search = "", status, priority, page = 1, limit = 10 } = req.query;

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

    const pageNumber = Math.max(1, Number(page));

    const pageLimit = Math.min(Math.max(1, Number(limit)), 100);

    const totalTickets = await SupportTicket.countDocuments(query);

    const tickets = await SupportTicket.find(query)
      .populate("student", "username email")
      .populate("assignedInstructor", "username email")
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
      message: error.message,
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
      .populate("student", "username email profilePicture")
      .populate("assignedInstructor", "username email profilePicture")
      .populate("conversation");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
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
