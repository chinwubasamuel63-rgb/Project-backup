import api from "./api";

export const acceptPartnershipRequest = async (requestId) => {
  const { data } = await api.patch(`/partnerships/accept/${requestId}`);

  return data;
};

export const rejectPartnershipRequest = async (requestId) => {
  const { data } = await api.patch(`/partnerships/reject/${requestId}`);

  return data;
};

const handleAccept = async (requestId) => {
  try {
    await acceptPartnershipRequest(requestId);

    setPartnerships((prev) => prev.filter((p) => p._id !== requestId));
  } catch (error) {
    console.error(error);
  }
};

const handleReject = async (requestId) => {
  try {
    await rejectPartnershipRequest(requestId);

    setPartnerships((prev) => prev.filter((p) => p._id !== requestId));
  } catch (error) {
    console.error(error);
  }
};

export const getProjectPartnershipRequests = async (projectId) => {
  const { data } = await api.get(`/partnerships/project/${projectId}`);

  return data;
};

export const getMyProjectRequest = async (projectId) => {
  const { data } = await api.get(
    `/partnerships/project/${projectId}/my-request`,
  );

  return data;
};

export const createPartnershipRequest = async (projectId, message) => {
  const { data } = await api.post(`/partnerships/${projectId}`, { message });

  return data;
};
