import api from "./api";

export const getMyConversations = async () => {
  const { data } = await api.get("/messages/conversations/my");

  return data;
};