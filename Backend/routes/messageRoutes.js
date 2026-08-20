import express from "express";
import {
  createConversation,
  sendMessage,
  getMessages,
  getMyConversations,
  deleteMessage,
  deleteConversation,
  editMessage,
  markConversationAsRead,
} from "../controllers/messageController.js";
import { checkAccountStatus } from "../middleware/accountStatusMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  attachmentUpload,
  handleMulterError,
} from "../middleware/upload.middleware.js";

const router = express.Router();

router.post("/conversations", protect, checkAccountStatus, createConversation);
router.post(
  "/send",
  protect,
  checkAccountStatus,
  attachmentUpload.array("attachments", 5),
  handleMulterError,
  sendMessage,
);
router.get(
  "/conversations/my",
  protect,
  checkAccountStatus,
  getMyConversations,
);
router.get(
  "/conversation/:conversationId",
  protect,
  checkAccountStatus,
  getMessages,
);
router.patch(
  "/read/:conversationId",
  protect,
  checkAccountStatus,
  markConversationAsRead,
);
router.patch(
  "/message/:messageId/edit",
  protect,
  checkAccountStatus,
  editMessage,
);
router.delete(
  "/message/:messageId",
  protect,
  checkAccountStatus,
  deleteMessage,
);
router.patch(
  "/conversation/:conversationId/delete",
  protect,
  checkAccountStatus,
  deleteConversation,
);

export default router;
