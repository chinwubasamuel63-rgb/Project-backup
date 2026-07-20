import mongoose from "mongoose";

const streamParticipantSchema = new mongoose.Schema(
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

    role: {
      type: String,
      enum: ["host", "speaker", "viewer"],
      default: "viewer",
    },

    microphoneEnabled: {
      type: Boolean,
      default: false,
    },

    cameraEnabled: {
      type: Boolean,
      default: false,
    },

    screenShareEnabled: {
      type: Boolean,
      default: false,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

streamParticipantSchema.index({ stream: 1, user: 1 }, { unique: true });

export default mongoose.model("StreamParticipant", streamParticipantSchema);
