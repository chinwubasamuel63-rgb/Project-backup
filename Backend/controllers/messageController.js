import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import mongoose from "mongoose";
import { getIO } from "../sockets/index.js";
import { createNotification } from "../utils/createNotification.js";
import Notification from "../models/Notification.js";

export const createConversation = async (req, res) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: "Participant ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid participant ID",
      });
    }

    if (participantId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot create a conversation with yourself",
      });
    }

    const existingConversation = await Conversation.findOne({
      isGroup: false,
      participants: {
        $all: [req.user._id, participantId],
      },
      $expr: {
        $eq: [{ $size: "$participants" }, 2],
      },
    });

    if (existingConversation) {
      return res.status(200).json({
        success: true,
        conversation: existingConversation,
      });
    }

    const conversation = await Conversation.create({
      participants: [req.user._id, participantId],
    });

    res.status(201).json({
      success: true,
      conversation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const isParticipant = conversation.participants.some(
      (participant) => participant.toString() === req.user._id.toString(),
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to send messages to this conversation",
      });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      content: content.trim(),
      readBy: [req.user._id],
    });

    conversation.lastMessage = message._id;

    await conversation.save();

    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "username avatar",
    );

    const receivers = conversation.participants.filter(
      (participant) => participant.toString() !== req.user._id.toString(),
    );

    for (const receiver of receivers) {
      const existingNotification = await Notification.findOne({
        user: receiver,
        type: "message",
        relatedEntity: conversation._id,
        isRead: false,
      });

      if (!existingNotification) {
        await createNotification({
          user: receiver,
          type: "message",
          title: "New Message",
          message: "You have unread messages.",
          relatedEntity: conversation._id,
          relatedEntityType: "Conversation",
        });
      }
    }

    const io = getIO();

    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== req.user._id.toString()) {
        io.to(participantId.toString()).emit("newMessage", populatedMessage);
      }
    });

    res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const isParticipant = conversation.participants.some(
      (participant) => participant.toString() === req.user._id.toString(),
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this conversation",
      });
    }

    const messages = await Message.find({
      conversation: req.params.conversationId,

      deletedFor: {
        $ne: req.user._id,
      },
    })
      .populate("sender", "username avatar")
      .sort({ createdAt: 1 });

    const formattedMessages = messages.map((message) => {
      if (message.isDeletedForEveryone) {
        return {
          ...message.toObject(),
          content: "This message was deleted",
        };
      }

      return message;
    });

    res.status(200).json({
      success: true,
      count: formattedMessages.length,
      messages: formattedMessages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "username avatar")
      .populate("lastMessage")
      .sort({
        updatedAt: -1,
      });

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,

          sender: {
            $ne: req.user._id,
          },

          readBy: {
            $ne: req.user._id,
          },

          deletedFor: {
            $ne: req.user._id,
          },
        });

        return {
          ...conversation.toObject(),
          unreadCount,
        };
      }),
    );

    res.status(200).json({
      success: true,
      count: conversationsWithUnread.length,
      conversations: conversationsWithUnread,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const deleteMessage = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    const conversation = await Conversation.findById(message.conversation);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const isParticipant = conversation.participants.some(
      (participant) => participant.toString() === req.user._id.toString(),
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const isSender = message.sender.toString() === req.user._id.toString();

    const { deleteForEveryone } = req.body;

    // Delete For Everyone
    if (deleteForEveryone) {
      if (!isSender) {
        return res.status(403).json({
          success: false,
          message: "Only sender can delete for everyone",
        });
      }

      message.isDeletedForEveryone = true;

      await message.save();

      return res.status(200).json({
        success: true,
        message: "Message deleted for everyone",
      });
    }

    // Delete For Me
    const alreadyDeleted = message.deletedFor.some(
      (userId) => userId.toString() === req.user._id.toString(),
    );

    if (!alreadyDeleted) {
      message.deletedFor.push(req.user._id);
      await message.save();
    }

    return res.status(200).json({
      success: true,
      message: "Message deleted for you",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const markConversationAsRead = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const isParticipant = conversation.participants.some(
      (participant) => participant.toString() === req.user._id.toString(),
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    await Message.updateMany(
      {
        conversation: req.params.conversationId,

        readBy: {
          $ne: req.user._id,
        },
      },
      {
        $addToSet: {
          readBy: req.user._id,
        },
      },
    );

    await Notification.deleteMany({
      user: req.user._id,
      type: "message",
      relatedEntity: conversation._id,
    });

    res.status(200).json({
      success: true,
      message: "Conversation marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
