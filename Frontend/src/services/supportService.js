import api from "./api";

export const createSupportTicket = async (ticketData) => {
  const { data } = await api.post("/support", ticketData);

  return data;
};

export const getMyTickets = async () => {
  const { data } = await api.get("/support/my-tickets");

  return data;
};

export const getSupportTicket = async (ticketId) => {
  const { data } = await api.get(`/support/${ticketId}`);

  return data;
};

export const getInstructorSupportOverview = async () => {
  const { data } = await api.get("/support/overview");

  return data;
};

export const getInstructorSupportActivity = async ({ limit = 10 } = {}) => {
  const { data } = await api.get("/support/activity", {
    params: { limit },
  });

  return data;
};

export const getOpenTickets = async ({ limit = 0 } = {}) => {
  const { data } = await api.get("/support/open", {
    params: { limit },
  });

  return data;
};

export const getAssignedTickets = async ({ limit = 0, status = [] } = {}) => {
  const { data } = await api.get("/support/assigned", {
    params: {
      limit,
      status: Array.isArray(status) ? status.join(",") : status,
    },
  });

  return data;
};

export const claimSupportTicket = async (ticketId) => {
  const { data } = await api.patch(`/support/${ticketId}/claim`);

  return data;
};

export const updateTicketStatus = async (ticketId, status) => {
  const { data } = await api.patch(`/support/${ticketId}/status`, {
    status,
  });

  return data;
};
