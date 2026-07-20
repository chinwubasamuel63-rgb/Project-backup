import mongoose from "mongoose";

const streamSchema = new mongoose.Schema(
  {
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

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    thumbnail: {
      publicId: {
        type: String,
        default: "",
      },

      url: {
        type: String,
        default: "",
      },
    },

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    status: {
      type: String,
      enum: ["live", "ended"],
      default: "live",
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    endedAt: {
      type: Date,
      default: null,
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

streamSchema.index({
  title: "text",
  description: "text",
});

streamSchema.index({
  host: 1,
});

streamSchema.index({
  status: 1,
});

export default mongoose.model("Stream", streamSchema);
