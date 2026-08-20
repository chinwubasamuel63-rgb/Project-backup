import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import SupportTicket from "../models/SupportTicket.js";
import mongoose from "mongoose";
import { getIO } from "../sockets/index.js";
import { createNotification } from "../utils/createNotification.js";
import Notification from "../models/Notification.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import cloudinary from "../config/cloudinary.js";
import {
  sanitizeMessageContent,
  validateAttachmentFile,
  buildMessagePagination,
} from "../utils/messageSecurity.js";

const deleteCloudinaryAttachments = async (attachments = []) => {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return;
  }

  await Promise.all(
    attachments
      .filter((attachment) => attachment?.publicId)
      .map((attachment) =>
        cloudinary.uploader.destroy(attachment.publicId).catch(() => {}),
      ),
  );
};

const restoreConversationForUser = async (conversation, userId) => {
  if (
    !Array.isArray(conversation.deletedFor) ||
    !conversation.deletedFor.length
  ) {
    return;
  }

  const deletedForStrings = conversation.deletedFor.map((participantId) =>
    participantId.toString(),
  );

  if (!deletedForStrings.includes(userId.toString())) {
    return;
  }

  await Message.updateMany(
    {
      conversation: conversation._id,
      deletedFor: userId,
    },
    {
      $pull: { deletedFor: userId },
    },
  );

  conversation.deletedFor = conversation.deletedFor.filter(
    (participantId) => participantId.toString() !== userId.toString(),
  );
  await conversation.save();
};

const restoreConversationForAllDeleted = async (conversation) => {
  if (
    !Array.isArray(conversation.deletedFor) ||
    !conversation.deletedFor.length
  ) {
    return;
  }

  const deletedForUsers = conversation.deletedFor;

  await Message.updateMany(
    {
      conversation: conversation._id,
      deletedFor: { $in: deletedForUsers },
    },
    {
      $pull: { deletedFor: { $in: deletedForUsers } },
    },
  );

  conversation.deletedFor = [];
  await conversation.save();
};

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
      conversationType: "direct",
      participants: {
        $all: [req.user._id, participantId],
      },
      $expr: {
        $eq: [{ $size: "$participants" }, 2],
      },
    });

    if (existingConversation) {
      await restoreConversationForUser(existingConversation, req.user._id);

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
    const uploadedAttachments = [];
    const files = Array.isArray(req.files) ? req.files : [];
    const hasAttachments = files.length > 0;
    const normalizedContent = sanitizeMessageContent(content || "").trim();

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    if (!normalizedContent && !hasAttachments) {
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

    await restoreConversationForAllDeleted(conversation);

    const isParticipant = conversation.participants.some(
      (participant) => participant.toString() === req.user._id.toString(),
    );

    const isAdminSupportConversation =
      req.user.role === "admin" && conversation.conversationType === "support";

    if (!isParticipant && !isAdminSupportConversation) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to send messages to this conversation",
      });
    }

    if (isAdminSupportConversation) {
      conversation.participants.addToSet(req.user._id);
    }

    if (hasAttachments) {
      for (const file of files) {
        const validation = validateAttachmentFile(file);

        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            message: validation.message,
          });
        }

        const result = await uploadToCloudinary(
          file.buffer,
          "support-attachments",
        );

        uploadedAttachments.push({
          name: file.originalname || "attachment",
          url: result.secure_url,
          publicId: result.public_id,
          type: file.mimetype?.startsWith("image/") ? "image" : "file",
          mimeType: file.mimetype || "",
          size: file.size || 0,
        });
      }
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      content: normalizedContent || "Shared attachment",
      readBy: [req.user._id],
      attachments: uploadedAttachments,
    });

    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    if (conversation.conversationType === "support") {
      const ticket = await SupportTicket.findOne({
        conversation: conversation._id,
      });

      if (ticket) {
        ticket.lastActivityAt = new Date();

        if (
          ["instructor", "admin"].includes(req.user.role) &&
          ticket.status === "Claimed"
        ) {
          ticket.status = "In Progress";

          ticket.statusHistory.push({
            status: "In Progress",
            changedBy: req.user._id,
          });
        }

        if (
          req.user._id.toString() === ticket.student.toString() &&
          ticket.status === "Waiting For Student"
        ) {
          ticket.status = "In Progress";

          ticket.statusHistory.push({
            status: "In Progress",
            changedBy: req.user._id,
          });
        }

        await ticket.save();
      }
    }

    const populatedMessage = await Message.findById(message._id)
      .lean()
      .populate("sender", "username avatar");

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
      message: "Message sent successfully.",
      data: { message: populatedMessage },
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
    const { conversationId } = req.params;
    const { before, limit = 50 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findById(conversationId).lean();

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

    const query = {
      conversation: conversationId,
      deletedFor: {
        $ne: req.user._id,
      },
    };

    const pagination = buildMessagePagination(before, limit);

    if (pagination.createdAt) {
      query.createdAt = pagination.createdAt;
    }

    const messages = await Message.find(query)
      .populate("sender", "username avatar")
      .sort({ createdAt: -1 })
      .limit(pagination.limit)
      .lean();

    const formattedMessages = messages.reverse().map((message) => ({
      ...message,
      content: message.isDeletedForEveryone
        ? "This message was deleted."
        : message.content,
    }));

    res.status(200).json({
      success: true,
      message: "Messages retrieved successfully.",
      data: {
        messages: formattedMessages,
        pagination: {
          limit: pagination.limit,
          hasMore: formattedMessages.length === pagination.limit,
        },
      },
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
    const { type } = req.query;

    const query = {
      participants: req.user._id,
      deletedFor: { $ne: req.user._id },
    };

    if (type) {
      query.conversationType = type;
    }

    const conversations = await Conversation.find(query)
      .populate("participants", "username avatar")
      .populate("lastMessage")
      .sort({ updatedAt: -1 })
      .lean();

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,
          sender: { $ne: req.user._id },
          readBy: { $ne: req.user._id },
          deletedFor: { $ne: req.user._id },
        });

        return {
          ...conversation,
          unreadCount,
        };
      }),
    );

    res.status(200).json({
      success: true,
      message: "Conversations retrieved successfully.",
      data: {
        conversations: conversationsWithUnread,
      },
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

    if (deleteForEveryone) {
      if (!isSender) {
        return res.status(403).json({
          success: false,
          message: "Only sender can delete for everyone",
        });
      }

      await deleteCloudinaryAttachments(message.attachments);
      message.isDeletedForEveryone = true;
      message.content = "This message was deleted.";
      message.attachments = [];
      message.edited = false;
      message.editedAt = null;
      await message.save();

      const io = getIO();
      io.to(conversation._id.toString()).emit("message:deleted", {
        messageId: message._id,
        deletedForEveryone: true,
      });

      return res.status(200).json({
        success: true,
        message: "Message deleted successfully.",
        data: { message },
      });
    }

    const alreadyDeleted = message.deletedFor.some(
      (userId) => userId.toString() === req.user._id.toString(),
    );

    if (!alreadyDeleted) {
      message.deletedFor.push(req.user._id);
      await message.save();
    }

    const io = getIO();
    io.to(conversation._id.toString()).emit("message:deleted", {
      messageId: message._id,
      deletedForEveryone: false,
      deletedFor: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Message deleted for you.",
      data: { message },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
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
        message: "Not authorized to delete this conversation",
      });
    }

    const userIdString = req.user._id.toString();
    const alreadyDeleted = conversation.deletedFor.some(
      (participantId) => participantId.toString() === userIdString,
    );

    if (!alreadyDeleted) {
      conversation.deletedFor.push(req.user._id);
      await Message.updateMany(
        {
          conversation: conversation._id,
          deletedFor: { $ne: req.user._id },
        },
        {
          $addToSet: { deletedFor: req.user._id },
        },
      );
    }

    const allDeleted = conversation.participants.every((participant) =>
      conversation.deletedFor
        .map((participantId) => participantId.toString())
        .includes(participant.toString()),
    );

    if (allDeleted) {
      await Message.deleteMany({ conversation: conversation._id });
      await Conversation.deleteOne({ _id: conversation._id });

      return res.status(200).json({
        success: true,
        message: "Conversation permanently deleted.",
      });
    }

    await conversation.save();

    return res.status(200).json({
      success: true,
      message: "Conversation deleted for you.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    if (typeof content !== "string") {
      return res.status(400).json({
        success: false,
        message: "Message content must be a string",
      });
    }

    const sanitizedContent = sanitizeMessageContent(content).trim();

    if (!sanitizedContent) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    const message = await Message.findById(messageId);

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

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the sender can edit this message",
      });
    }

    message.content = sanitizedContent;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    const io = getIO();
    io.to(conversation._id.toString()).emit("message:edited", {
      messageId: message._id,
      content: message.content,
      edited: true,
      editedAt: message.editedAt,
    });

    res.status(200).json({
      success: true,
      message: "Message updated successfully.",
      data: { message },
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
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
      {
        $addToSet: { readBy: req.user._id },
      },
    );

    await Notification.deleteMany({
      user: req.user._id,
      type: "message",
      relatedEntity: conversation._id,
    });

    res.status(200).json({
      success: true,
      message: "Conversation marked as read.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
