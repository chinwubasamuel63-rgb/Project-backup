import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 12000,
    },

    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    attachments: [
      {
        name: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          default: "",
        },
        type: {
          type: String,
          default: "file",
        },
        mimeType: {
          type: String,
          default: "",
        },
        size: {
          type: Number,
          default: 0,
        },
      },
    ],

    isDeletedForEveryone: {
      type: Boolean,
      default: false,
    },

    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    edited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
