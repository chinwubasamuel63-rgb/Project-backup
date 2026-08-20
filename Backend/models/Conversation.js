import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    isGroup: {
      type: Boolean,
      default: false,
    },

    name: {
      type: String,
      default: "",
    },
    
    conversationType: {
      type: String,
      enum: ["direct", "support", "project"],
      default: "direct",
    },

    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
