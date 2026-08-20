import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedInstructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
    },
    track: {
      type: String,
      trim: true,
    },
    course: {
      type: String,
      trim: true,
    },
    lesson: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: [
        "Open",
        "Claimed",
        "In Progress",
        "Waiting For Student",
        "Resolved",
        "Closed",
      ],
      default: "Open",
    },
    statusHistory: [
      {
        status: {
          type: String,
        },

        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        note: {
          type: String,
          default: "",
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // --- Timestamps & Metrics ---
    claimedAt: {
      type: Date,
      default: null,
    },
    waitingForStudentAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    reopenedAt: {
      type: Date,
      default: null,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

supportTicketSchema.index({ student: 1 });
supportTicketSchema.index({ assignedInstructor: 1 });
supportTicketSchema.index({ status: 1 });

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);

export default SupportTicket;
