import Notification from "../models/Notification.js";
import { getIO, isUserOnline } from "../sockets/index.js";

export const createNotification = async ({
  user,
  type,
  title,
  message,
  relatedEntity,
  relatedEntityType,
}) => {
  const notification = await Notification.create({
    user,
    type,
    title,
    message,
    relatedEntity,
    relatedEntityType,
  });

  const userId = user.toString();

  if (isUserOnline(userId)) {
    const io = getIO();

    const unreadCount = await Notification.countDocuments({
      user,
      isRead: false,
    });

    io.to(userId).emit("notification", {
      notification,
      unreadCount,
    });
  }

  return notification;
};
