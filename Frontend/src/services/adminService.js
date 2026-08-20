import api from "./api";

const unwrap = (response) => response.data;

export const getAdminStats = () => api.get("/admin/stats").then(unwrap);
export const getAdminOverview = () =>
  api.get("/admin/analytics/overview").then(unwrap);
export const getAdminGrowth = () =>
  api.get("/admin/analytics/growth").then(unwrap);
export const getAdminOperationalAnalytics = (params = {}) =>
  api.get("/admin/analytics/operational", { params }).then(unwrap);

export const getAdminUsers = (params = {}) =>
  api.get("/admin/users/users", { params }).then(unwrap);
export const getAdminUser = (userId) =>
  api.get(`/admin/users/${userId}`).then(unwrap);
export const updateAdminUserRole = (userId, role) =>
  api.patch(`/admin/users/users/${userId}/role`, { role }).then(unwrap);
export const performAdminUserAction = (userId, action, payload = {}) =>
  api
    .patch(`/admin/users/${userId}/action`, { action, ...payload })
    .then(unwrap);

export const getAdminProjects = (params = {}) =>
  api.get("/admin/projects", { params }).then(unwrap);
export const getAdminProject = (projectId) =>
  api.get(`/admin/projects/${projectId}`).then(unwrap);
export const deleteAdminProject = (projectId) =>
  api.delete(`/admin/projects/${projectId}`).then(unwrap);

export const getAdminSupportTickets = (params = {}) =>
  api.get("/admin/support", { params }).then(unwrap);
export const getAdminSupportTicket = (ticketId) =>
  api.get(`/admin/support/${ticketId}`).then(unwrap);
export const getAdminSupportAssignees = () =>
  api.get("/admin/support/assignees").then(unwrap);
export const assignAdminSupportTicket = (ticketId, instructorId) =>
  api.patch(`/admin/support/${ticketId}/assign`, { instructorId }).then(unwrap);
export const claimAdminSupportTicket = (ticketId) =>
  api.patch(`/support/${ticketId}/claim`).then(unwrap);
export const updateAdminSupportStatus = (ticketId, status) =>
  api.patch(`/support/${ticketId}/status`, { status }).then(unwrap);

export const getAdminAuditLogs = (params = {}) =>
  api.get("/admin/audit-logs", { params }).then(unwrap);

export const getAdminDashboardData = async () => {
  const [stats, overview, users, projects, support, audit] = await Promise.all([
    getAdminStats(),
    getAdminOverview(),
    getAdminUsers({ limit: 10, sort: "newest" }),
    getAdminProjects({ limit: 10 }),
    getAdminSupportTickets({ limit: 10 }),
    getAdminAuditLogs({ limit: 10 }),
  ]);

  return { stats, overview, users, projects, support, audit };
};
