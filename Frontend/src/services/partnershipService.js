import api from "./api";

export const acceptPartnershipRequest = async (requestId) => {
  const { data } = await api.patch(`/partnerships/accept/${requestId}`);

  return data;
};

export const rejectPartnershipRequest = async (requestId) => {
  const { data } = await api.patch(`/partnerships/reject/${requestId}`);

  return data;
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
