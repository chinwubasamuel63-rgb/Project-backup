import api from "./api";

export const getNotifications = async () => {
  const { data } = await api.get("/notifications");

  return data;
};