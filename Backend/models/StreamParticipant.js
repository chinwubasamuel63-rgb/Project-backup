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
      default: true,
    },

    cameraEnabled: {
      type: Boolean,
      default: true,
    },

    screenShareEnabled: {
      type: Boolean,
      default: false,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    // Track when participant left the stream (null = currently active)
    leftAt: {
      type: Date,
      default: null,
    },

    // Track how many times this user has joined this stream
    // Used to distinguish first join vs rejoin
    joinCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

// Unique constraint: only one active participant record per stream+user
// This is enforced at application level using upsert with the constraint
streamParticipantSchema.index({ stream: 1, user: 1 }, { unique: true });

// For efficient queries of active participants
streamParticipantSchema.index({ stream: 1, leftAt: 1 });

// For querying participants by user across streams
streamParticipantSchema.index({ user: 1, leftAt: 1 });

export default mongoose.model("StreamParticipant", streamParticipantSchema);
