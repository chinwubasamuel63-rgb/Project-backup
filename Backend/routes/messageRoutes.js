import express from "express";
import {
  createConversation,
  sendMessage,
  getMessages,
  getMyConversations,
  deleteMessage,
  markConversationAsRead,
} from "../controllers/messageController.js";
import { checkAccountStatus } from "../middleware/accountStatusMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/conversations", protect, checkAccountStatus, createConversation);
router.post("/send", protect, checkAccountStatus, sendMessage);
router.get("/conversations/my", protect, getMyConversations);
router.get("/conversation/:conversationId", protect, getMessages);
router.patch("/read/:conversationId", protect, markConversationAsRead);
router.delete(
  "/message/:messageId",
  protect,
  checkAccountStatus,
  deleteMessage,
);

export default router;
