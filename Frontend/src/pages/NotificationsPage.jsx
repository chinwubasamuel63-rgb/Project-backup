import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService";
import { useAuth } from "../hooks/useAuth";
import "./notifications.css";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const { user } = useAuth();

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await getNotifications();
      setNotifications(response?.notifications || []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    const handleRealtimeNotification = (event) => {
      const notification = event.detail?.notification;
      if (!notification?._id) return;
      setNotifications((items) => [
        notification,
        ...items.filter((item) => item._id !== notification._id),
      ]);
    };

    const handleNotificationRead = (event) => {
      const notificationId = event.detail?.notificationId;
      if (!notificationId) return;
      setNotifications((items) =>
        items.map((item) =>
          item._id === notificationId ? { ...item, isRead: true } : item,
        ),
      );
    };

    const handleAllNotificationsRead = () => {
      setNotifications((items) =>
        items.map((item) => ({ ...item, isRead: true })),
      );
    };

    const handleNotificationDeleted = (event) => {
      const notificationId = event.detail?.notificationId;
      if (!notificationId) return;
      setNotifications((items) =>
        items.filter((item) => item._id !== notificationId),
      );
    };

    window.addEventListener(
      "devstream:notification-received",
      handleRealtimeNotification,
    );
    window.addEventListener(
      "devstream:notification-read",
      handleNotificationRead,
    );
    window.addEventListener(
      "devstream:notifications-read-all",
      handleAllNotificationsRead,
    );
    window.addEventListener(
      "devstream:notification-deleted",
      handleNotificationDeleted,
    );

    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener(
        "devstream:notification-received",
        handleRealtimeNotification,
      );
      window.removeEventListener(
        "devstream:notification-read",
        handleNotificationRead,
      );
      window.removeEventListener(
        "devstream:notifications-read-all",
        handleAllNotificationsRead,
      );
      window.removeEventListener(
        "devstream:notification-deleted",
        handleNotificationDeleted,
      );
    };
  }, []);

  const getNotificationDestination = (notification) => {
    const id = notification?.relatedEntity;
    if (!id) return "/notifications";

    if (
      notification.relatedEntityType === "SupportTicket" ||
      notification.type === "support"
    ) {
      return user?.role === "admin" ? `/admin/support/${id}` : `/support/${id}`;
    }
    if (notification.relatedEntityType === "Project") {
      return user?.role === "admin"
        ? `/admin/projects/${id}`
        : `/projects/${id}`;
    }
    if (notification.relatedEntityType === "User") {
      return user?.role === "admin" ? `/admin/users/${id}` : `/profile/${id}`;
    }
    return "/notifications";
  };

  const handleOpenNotification = async (notification) => {
    const destination = getNotificationDestination(notification);

    if (notification?._id && !notification.isRead) {
      try {
        await markNotificationAsRead(notification._id);
        setNotifications((items) =>
          items.map((item) =>
            item._id === notification._id ? { ...item, isRead: true } : item,
          ),
        );
      } catch (error) {
        setActionError(
          error.response?.data?.message ||
            "Unable to mark notification as read.",
        );
      }
    }

    navigate(destination);
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionError("");
      await markAllNotificationsAsRead();
      setNotifications((items) =>
        items.map((item) => ({ ...item, isRead: true })),
      );
    } catch (error) {
      setActionError(
        error.response?.data?.message ||
          "Unable to mark notifications as read.",
      );
    }
  };

  return (
    <div className="page-wrap">
      <div className="glass-card notifications-card">
        <div className="panel-header notifications-header">
          <h3>Notifications</h3>
          <button
            type="button"
            className="notifications-mark-all"
            onClick={handleMarkAllAsRead}
            disabled={!notifications.some((item) => !item.isRead)}
          >
            Mark all as read
          </button>
        </div>

        {actionError && <div className="empty-row">{actionError}</div>}

        {loading ? (
          <div className="empty-row">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="empty-row">No notifications yet.</div>
        ) : (
          <div className="list-rows">
            {notifications.map((notification) => (
              <button
                key={notification._id}
                type="button"
                className={`notif-row ${notification.isRead ? "is-read" : ""}`}
                onClick={() => handleOpenNotification(notification)}
              >
                <div className="notif-icon">
                  <span>🔔</span>
                </div>
                <div className="notif-row-body">
                  <div className="notif-title">
                    {notification.title || "Notification"}
                  </div>
                  <div className="notif-sub">
                    {notification.message || "No details available"}
                  </div>
                </div>
                <div className="notif-time">
                  {notification.createdAt
                    ? new Date(notification.createdAt).toLocaleDateString()
                    : "Now"}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
