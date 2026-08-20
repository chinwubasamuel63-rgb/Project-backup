import api from "./api";

export const getNotifications = async () => {
  const { data } = await api.get("/notifications");

  return data;
};

export const markNotificationAsRead = async (notificationId) => {
  const { data } = await api.patch(`/notifications/${notificationId}/read`);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("devstream:notification-read", {
        detail: { notificationId: notificationId },
      }),
    );
    window.dispatchEvent(
      new CustomEvent("devstream:notifications-updated", {
        detail: {
          unreadCount: data?.unreadCount ?? 0,
        },
      }),
    );
  }

  return data;
};

export const markAllNotificationsAsRead = async () => {
  const { data } = await api.patch("/notifications/read-all");

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("devstream:notifications-read-all"));
    window.dispatchEvent(
      new CustomEvent("devstream:notifications-updated", {
        detail: {
          unreadCount: data?.unreadCount ?? 0,
        },
      }),
    );
  }

  return data;
};
