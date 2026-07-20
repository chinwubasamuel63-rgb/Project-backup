import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", protect, getMyNotifications);

router.get("/unread-count", protect, getUnreadNotificationCount);

router.patch("/:notificationId/read", protect, markNotificationAsRead);

router.patch("/read-all", protect, markAllNotificationsAsRead);

router.delete("/:notificationId", protect, deleteNotification);


export default router;
