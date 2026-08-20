import api from "./api";

export const getUnreadNotificationCount = async () => {
  const { data } = await api.get("/notifications/unread-count");
  return data;
};

export const getMyConversations = async () => {
  const { data } = await api.get("/messages/conversations/my");
  const payload = data?.data || data || {};

  return {
    ...data,
    conversations: payload.conversations || data?.conversations || [],
  };
};
