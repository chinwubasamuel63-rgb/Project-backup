import api from "./api";

// Get logged-in user's profile
export const getMyProfile = async () => {
  const response = await api.get("/profile/me");
  return response.data;
};

// Update profile information
export const updateProfile = async (data) => {
  const response = await api.patch("/profile/me", data);
  return response.data;
};

// Upload avatar
export const uploadAvatar = async (formData) => {
  const response = await api.patch("/profile/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Delete avatar
export const deleteAvatar = async () => {
  const response = await api.delete("/profile/avatar");
  return response.data;
};

// Get public profile
export const getUserProfile = async (userId) => {
  const response = await api.get(`/profile/${userId}`);
  return response.data;
};

// Upload cover image
export const uploadCoverImage = async (formData) => {
  const response = await api.patch("/profile/cover", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Delete cover image
export const deleteCoverImage = async () => {
  const response = await api.delete("/profile/cover");
  return response.data;
};

// Follow user
export const followUser = async (userId) => {
  const response = await api.post(`/users/${userId}/follow`);
  return response.data;
};

// Unfollow user
export const unfollowUser = async (userId) => {
  const response = await api.delete(`/users/${userId}/follow`);
  return response.data;
};

// Get user followers
export const getFollowers = async (userId) => {
  const response = await api.get(`/users/${userId}/followers`);
  return response.data;
};

// Get user following
export const getFollowing = async (userId) => {
  const response = await api.get(`/users/${userId}/following`);
  return response.data;
};
