import api from "./api";

export const getStreams = async () => {
  const { data } = await api.get("/streams");
  return data;
};

export const getMyStreams = async () => {
  const { data } = await api.get("/streams/my");
  return data;
};

export const getUserStreams = async (userId) => {
  const { data } = await api.get(`/streams/user/${userId}`);

  return data;
};

export const createStream = async (payload = {}) => {
  const { data } = await api.post("/streams", payload);
  return data;
};

export const startStream = async (streamId) => {
  const { data } = await api.post(`/streams/${streamId}/start`);
  return data;
};

export const getStreamById = async (streamId) => {
  const { data } = await api.get(`/streams/${streamId}`);
  return data;
};

export const joinStream = async (streamId) => {
  const { data } = await api.post(`/streams/${streamId}/join`);
  return data;
};

export const leaveStream = async (streamId) => {
  const { data } = await api.post(`/streams/${streamId}/leave`);
  return data;
};

export const getParticipants = async (streamId) => {
  const { data } = await api.get(`/streams/${streamId}/participants`);
  return data;
};

export const endStream = async (streamId) => {
  const { data } = await api.delete(`/streams/${streamId}`);
  return data;
};

export const kickParticipant = async (streamId, userId) => {
  const { data } = await api.delete(`/streams/${streamId}/kick/${userId}`);
  return data;
};

export const banParticipant = async (streamId, userId, reason = "") => {
  const { data } = await api.post(`/streams/${streamId}/ban/${userId}`, {
    reason,
  });
  return data;
};

export const unbanParticipant = async (streamId, userId) => {
  const { data } = await api.delete(`/streams/${streamId}/ban/${userId}`);
  return data;
};

export const getBannedUsers = async (streamId) => {
  const { data } = await api.get(`/streams/${streamId}/bans`);
  return data;
};

export const requestPermission = async (streamId, requestType) => {
  const { data } = await api.post(`/streams/${streamId}/request`, {
    requestType,
  });
  return data;
};

export const getPendingRequests = async (streamId) => {
  const { data } = await api.get(`/streams/${streamId}/requests`);
  return data;
};

export const approveRequest = async (streamId, requestId) => {
  const { data } = await api.patch(
    `/streams/${streamId}/requests/${requestId}/approve`,
  );
  return data;
};

export const rejectRequest = async (streamId, requestId) => {
  const { data } = await api.patch(
    `/streams/${streamId}/requests/${requestId}/reject`,
  );
  return data;
};

export const revokeMicrophone = async (streamId, userId) => {
  const { data } = await api.patch(
    `/streams/${streamId}/participants/${userId}/revoke-microphone`,
  );
  return data;
};

export const revokeCamera = async (streamId, userId) => {
  const { data } = await api.patch(
    `/streams/${streamId}/participants/${userId}/revoke-camera`,
  );
  return data;
};

export const revokeScreenShare = async (streamId, userId) => {
  const { data } = await api.patch(
    `/streams/${streamId}/participants/${userId}/revoke-screen-share`,
  );
  return data;
};

export const generateStreamToken = async (streamId) => {
  const { data } = await api.post(`/streams/${streamId}/token`);
  return data;
};

export const uploadThumbnail = async (streamId, file) => {
  const formData = new FormData();
  formData.append("thumbnail", file);

  const { data } = await api.patch(`/streams/${streamId}/thumbnail`, formData);

  return data;
};

export const deleteThumbnail = async (streamId) => {
  const { data } = await api.delete(`/streams/${streamId}/thumbnail`);
  return data;
};

export const createStreamReport = async (streamId, payload = {}) => {
  const { data } = await api.post(`/stream-reports/${streamId}`, payload);
  return data;
};
