import mongoose from "mongoose";

const streamAnalyticsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    startedAt: {
      type: Date,
      required: true,
    },

    endedAt: {
      type: Date,
      required: true,
    },

    duration: {
      type: Number,
      required: true,
    },

    peakViewers: {
      type: Number,
      default: 0,
    },

    totalViewers: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("StreamAnalytics", streamAnalyticsSchema);
