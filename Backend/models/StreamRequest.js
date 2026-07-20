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

export default mongoose.model("StreamRequest", streamRequestSchema);
