import api from "./api";

export const getMyProjects = async () => {
  const { data } = await api.get("/projects/my-projects");
  return data;
};

export const getMyPartnershipRequests = async () => {
  const { data } = await api.get("/partnerships/my-requests");
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

export const getNotifications = async () => {
  const { data } = await api.get("/notifications");
  return data;
};

export const getMyTickets = async () => {
  const { data } = await api.get("/support/my-tickets");
  return data;
};

export const getAssignedTickets = async () => {
  const { data } = await api.get("/support/assigned");
  return data;
};

export const getStreams = async () => {
  const { data } = await api.get("/streams");
  return data;
};
