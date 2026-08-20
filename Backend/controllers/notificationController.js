import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import { getIO } from "../sockets/index.js";

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await Notification.findById(req.params.notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
    }

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    const io = getIO();

    io.to(req.user._id.toString()).emit("notificationRead", {
      notificationId: notification._id,
      unreadCount,
    });

    res.status(200).json({
      success: true,
      notification,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        user: req.user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      },
    );

    const io = getIO();

    io.to(req.user._id.toString()).emit("allNotificationsRead", {
      notificationIds: "all",
      unreadCount: 0,
    });

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      unreadCount: 0,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await Notification.findById(req.params.notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    await notification.deleteOne();

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    const io = getIO();

    io.to(req.user._id.toString()).emit("notificationDeleted", {
      notificationId: notification._id,
      unreadCount,
    });

    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUnreadNotificationCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
