import api from "./api";

export const getProfileActivity = async (userId) => {
  const endpoint = userId
    ? `/profile/activity/user/${userId}`
    : "/profile/activity/me";
  const { data } = await api.get(endpoint);

  return data;
};
