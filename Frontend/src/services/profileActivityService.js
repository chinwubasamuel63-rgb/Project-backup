import api from "./api";

export const getProfileActivity = async () => {
  const { data } = await api.get("/profile/activity/me");

  return data;
};
