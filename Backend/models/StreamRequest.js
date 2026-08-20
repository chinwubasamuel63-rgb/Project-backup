import mongoose from "mongoose";

const streamRequestSchema = new mongoose.Schema(
  {
    stream: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stream",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    requestType: {
      type: String,
      enum: ["microphone", "camera", "screen-share"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "revoked"],
      default: "pending",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    lastRejectedAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

streamRequestSchema.index(
  {
    stream: 1,
    user: 1,
    requestType: 1,
    status: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: "pending",
    },
  },
);

// Index for efficient pending request queries by host
streamRequestSchema.index({
  stream: 1,
  status: 1,
  createdAt: -1,
});

// Index for efficient expiration checks
streamRequestSchema.index(
  {
    expiresAt: 1,
  },
  {
    partialFilterExpression: {
      status: "pending",
      expiresAt: { $ne: null },
    },
  },
);

// Index for user request history (useful for requests view)
streamRequestSchema.index({
  user: 1,
  status: 1,
  createdAt: -1,
});

// Index for cooldown check (lastRejectedAt)
streamRequestSchema.index({
  stream: 1,
  user: 1,
  requestType: 1,
  lastRejectedAt: 1,
});

export default mongoose.model("StreamRequest", streamRequestSchema);
