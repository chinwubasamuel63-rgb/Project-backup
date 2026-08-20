import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getAdminAuditLogs,
  getAdminDashboardData,
  deleteAdminProject,
  getAdminOperationalAnalytics,
  getAdminStats,
  getAdminUser,
  getAdminProject,
  getAdminProjects,
  getAdminSupportTicket,
  getAdminSupportAssignees,
  getAdminSupportTickets,
  getAdminUsers,
  performAdminUserAction,
  updateAdminUserRole,
  assignAdminSupportTicket,
  claimAdminSupportTicket,
  updateAdminSupportStatus,
} from "../../services/adminService";
import { sendConversationMessage } from "../../services/messageService";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";
import AlertModal from "../ui/AlertModal";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");
const formatCompactDate = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "-";

function PageState({ loading, error, empty, children }) {
  if (loading) return <div className="admin-state">Loading admin data...</div>;
  if (error)
    return <div className="admin-state admin-state-error">{error}</div>;
  if (empty) return <div className="admin-state">No records found.</div>;
  return children;
}

function useAdminQuery(load, emptyValue, requestKey = "default") {
  const [state, setState] = useState({
    data: emptyValue,
    loading: true,
    error: "",
  });
  const loadRef = useRef(load);
  const emptyValueRef = useRef(emptyValue);
  useEffect(() => {
    loadRef.current = load;
    emptyValueRef.current = emptyValue;
  }, [emptyValue, load]);
  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setState({ data: emptyValueRef.current, loading: true, error: "" });
      try {
        const data = await loadRef.current();
        if (active) setState({ data, loading: false, error: "" });
      } catch (error) {
        if (active) {
          setState({
            data: emptyValueRef.current,
            loading: false,
            error:
              error.response?.data?.message || "Unable to load admin data.",
          });
        }
      }
    };
    void loadData();
    return () => {
      active = false;
    };
  }, [requestKey]);
  return state;
}

function useAdminQueryWithRefresh(load, emptyValue, requestKey = "default") {
  const [refreshKey, setRefreshKey] = useState(0);
  const state = useAdminQuery(load, emptyValue, `${requestKey}-${refreshKey}`);
  return { ...state, refresh: () => setRefreshKey((value) => value + 1) };
}

function DashboardSkeleton() {
  return (
    <div className="admin-dashboard-skeleton" aria-label="Loading dashboard">
      <div className="admin-skeleton-stats">
        {Array.from({ length: 8 }, (_, index) => (
          <div className="admin-skeleton-block" key={index} />
        ))}
      </div>
      <div className="admin-skeleton-panels">
        <div className="admin-skeleton-block" />
        <div className="admin-skeleton-block" />
      </div>
    </div>
  );
}

function DashboardTable({
  title,
  viewPath,
  columns,
  rows,
  emptyLabel,
  renderRow,
}) {
  return (
    <section className="admin-panel dashboard-activity-panel">
      <div className="analytics-series-heading">
        <h2>{title}</h2>
        <div className="dashboard-panel-actions">
          <span>{rows.length} shown</span>
          <Link className="dashboard-view-all" to={viewPath}>
            View all
          </Link>
        </div>
      </div>
      {rows.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>{rows.map(renderRow)}</tbody>
          </table>
        </div>
      ) : (
        <div className="admin-state admin-state-compact">{emptyLabel}</div>
      )}
    </section>
  );
}

function DashboardContent({ data }) {
  const stats = data.stats;
  const overview = data.overview.analytics || {};
  const users = data.users.users || [];
  const tickets = data.support.tickets || [];
  const logs = data.audit.logs || [];
  const kpis = [
    ["Total users", stats.users?.total],
    ["Students", stats.users?.students],
    ["Instructors", stats.users?.instructors],
    ["Admins", stats.users?.admins],
    ["Total projects", stats.projects?.total],
    ["Active projects", stats.projects?.active],
    ["Support tickets", stats.support?.total],
    ["Open tickets", stats.support?.open],
    ["Active users", stats.users?.active],
    ["Active streams", stats.streams?.active],
    [
      "Marketplace revenue",
      `$${Number(overview.marketplace?.revenue || 0).toLocaleString()}`,
    ],
    ["Reports", overview.streaming?.reports],
  ];

  return (
    <>
      <div className="admin-stat-grid admin-dashboard-kpis">
        {kpis.map(([label, value]) => (
          <div className="admin-stat" key={label}>
            <span>{label}</span>
            <strong>{value ?? "-"}</strong>
            {value === "Not available" && (
              <small className="admin-stat-note">
                Backend metric unavailable
              </small>
            )}
          </div>
        ))}
      </div>
      <div className="dashboard-activity-grid">
        <DashboardTable
          title="Recent users"
          viewPath="/admin/users"
          columns={["User", "Role", "Created"]}
          rows={users}
          emptyLabel="No users returned."
          renderRow={(user) => (
            <tr key={user._id}>
              <td>
                {user.username || user.email}
                <small>{user.email}</small>
              </td>
              <td>{user.role}</td>
              <td>{formatDate(user.createdAt)}</td>
            </tr>
          )}
        />
        <DashboardTable
          title="Support tickets overview"
          viewPath="/admin/support"
          columns={["Ticket", "Status", "Created"]}
          rows={tickets}
          emptyLabel="No support tickets returned."
          renderRow={(ticket) => (
            <tr key={ticket._id}>
              <td>
                <Link to={`/admin/support/${ticket._id}`}>
                  {ticket.title || ticket.ticketNumber}
                </Link>
              </td>
              <td>{ticket.status}</td>
              <td>{formatDate(ticket.createdAt)}</td>
            </tr>
          )}
        />
        <DashboardTable
          title="Recent activity"
          viewPath="/admin/audit-logs"
          columns={["Action", "Admin", "Created"]}
          rows={logs}
          emptyLabel="No administrative activity recorded."
          renderRow={(log) => (
            <tr key={log._id}>
              <td>{log.action}</td>
              <td>{log.admin?.username || "-"}</td>
              <td>{formatDate(log.createdAt)}</td>
            </tr>
          )}
        />
      </div>
    </>
  );
}

function AdminDashboardError({ message, onRetry }) {
  return (
    <div className="admin-state admin-state-error">
      <p>{message}</p>
      <button className="admin-action-button" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

function Header({ eyebrow, title, description }) {
  return (
    <header className="admin-page-header">
      {eyebrow && <span className="admin-kicker">{eyebrow}</span>}
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

const monthLabel = (entry) => {
  if (!entry?._id) return "-";
  return new Date(entry._id.year, entry._id.month - 1, 1).toLocaleDateString(
    undefined,
    { month: "short", year: "numeric" },
  );
};

const seriesTotal = (entries = [], field = "count") =>
  entries.reduce((total, entry) => total + Number(entry[field] || 0), 0);

function GrowthChart({ title, entries = [], valueLabel }) {
  const width = 560;
  const height = 190;
  const padding = 28;
  const values = entries.map((entry) => Number(entry.count || 0));
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x =
      padding +
      (index * (width - padding * 2)) / Math.max(values.length - 1, 1);
    const y = height - padding - (value / max) * (height - padding * 2);
    return `${x},${y}`;
  });
  return (
    <section className="admin-panel analytics-chart-panel">
      <div className="analytics-series-heading">
        <h2>{title}</h2>
        <span>{valueLabel}</span>
      </div>
      {entries.length ? (
        <svg
          className="analytics-chart"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`${title} chart`}
        >
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            className="analytics-chart-axis"
          />
          <polyline
            points={points.join(" ")}
            className="analytics-chart-line"
          />
          {points.map((point, index) => {
            const [x, y] = point.split(",");
            return (
              <g
                key={`${entries[index]._id?.year}-${entries[index]._id?.month}`}
              >
                <circle cx={x} cy={y} r="4" className="analytics-chart-point" />
                <text
                  x={x}
                  y={height - 8}
                  textAnchor="middle"
                  className="analytics-chart-label"
                >
                  {monthLabel(entries[index])}
                </text>
              </g>
            );
          })}
        </svg>
      ) : (
        <div className="admin-state admin-state-compact">
          No data for this range.
        </div>
      )}
    </section>
  );
}

function DistributionChart({ title, entries = [] }) {
  const max = Math.max(...entries.map((entry) => Number(entry.count || 0)), 1);
  return (
    <section className="admin-panel analytics-distribution">
      <h2>{title}</h2>
      {entries.length ? (
        entries.map((entry) => (
          <div className="distribution-row" key={entry._id}>
            <div>
              <span>{entry._id}</span>
              <strong>{entry.count}</strong>
            </div>
            <svg
              className="distribution-track"
              viewBox="0 0 100 8"
              preserveAspectRatio="none"
              aria-label={`${entry._id}: ${entry.count}`}
            >
              <rect
                width="100"
                height="8"
                rx="4"
                className="distribution-track-bg"
              />
              <rect
                width={(entry.count / max) * 100}
                height="8"
                rx="4"
                className="distribution-track-fill"
              />
            </svg>
          </div>
        ))
      ) : (
        <div className="admin-state admin-state-compact">
          No data for this range.
        </div>
      )}
    </section>
  );
}

export function AdminDashboard() {
  const query = useAdminQueryWithRefresh(getAdminDashboardData, {});
  return (
    <>
      <Header
        eyebrow=""
        title="Dashboard"
        description="Overview of your platform's activity and performance."
      />
      <div className="admin-dashboard-toolbar">
        <span>Live data from admin services</span>
        <button
          className="admin-action-button"
          onClick={query.refresh}
          disabled={query.loading}
        >
          {query.loading ? "Refreshing..." : "Refresh data"}
        </button>
      </div>
      {query.loading && <DashboardSkeleton />}
      {!query.loading && query.error && (
        <AdminDashboardError message={query.error} onRetry={query.refresh} />
      )}
      {!query.loading && !query.error && <DashboardContent data={query.data} />}
    </>
  );
}

export function AdminUsers() {
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
    page: 1,
    limit: 10,
  });
  const params = {
    page: filters.page,
    limit: filters.limit,
    sort: "newest",
    ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
    ...(filters.role ? { role: filters.role } : {}),
    ...(filters.status === "active"
      ? { suspended: "false", banned: "false" }
      : {}),
    ...(filters.status === "suspended" ? { suspended: "true" } : {}),
    ...(filters.status === "banned" ? { banned: "true" } : {}),
  };
  const query = useAdminQuery(
    () => getAdminUsers(params),
    {},
    JSON.stringify(params),
  );
  const pagination = query.data.pagination || {};
  const updateFilter = (name, value) =>
    setFilters((current) => ({ ...current, [name]: value, page: 1 }));

  return (
    <>
      <div className="admin-users-heading">
        <Header
          eyebrow=""
          title="Users"
          description="Manage and monitor platform users."
        />
      </div>
      <div className="admin-filter-bar">
        <input
          aria-label="Search users"
          placeholder="Search username or email"
          value={filters.search}
          onChange={(event) => updateFilter("search", event.target.value)}
        />
        <select
          aria-label="Filter by role"
          value={filters.role}
          onChange={(event) => updateFilter("role", event.target.value)}
        >
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="instructor">Instructors</option>
          <option value="admin">Admins</option>
        </select>
        <select
          aria-label="Filter by account status"
          value={filters.status}
          onChange={(event) => updateFilter("status", event.target.value)}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>
      {query.loading && <div className="admin-state">Loading users...</div>}
      {!query.loading && query.error && (
        <div className="admin-state admin-state-error">{query.error}</div>
      )}
      {!query.loading && !query.error && !query.data.users?.length && (
        <div className="admin-state">No users match these filters.</div>
      )}
      {!query.loading && !query.error && query.data.users?.length > 0 && (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Verified</th>
                  <th>Last seen</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {query.data.users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <Link to={`/admin/users/${user._id}`}>
                        {user.displayName || user.username || user.email}
                      </Link>
                      <small>{user.email}</small>
                    </td>
                    <td>
                      <span className={`admin-role-badge role-${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`admin-status-badge status-${statusLabel(
                          user,
                        ).toLowerCase()}`}
                      >
                        {statusLabel(user)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`admin-verified-badge ${
                          user.isVerified ? "is-verified" : ""
                        }`}
                      >
                        {user.isVerified ? "Yes" : "No"}
                      </span>
                    </td>
                    <td>
                      {user.isOnline ? (
                        <span className="admin-online-label">Online</span>
                      ) : (
                        formatDate(user.lastSeen)
                      )}
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="admin-row-actions">
                        <Link
                          className="admin-icon-action"
                          to={`/admin/profile/${user._id}`}
                          aria-label={`View ${user.username || "user"}`}
                          title="View profile"
                        >
                          View
                        </Link>
                        <Link
                          className="admin-icon-action"
                          to={`/admin/users/${user._id}`}
                          aria-label={`Manage ${user.username || "user"}`}
                          title="Manage user"
                        >
                          Manage
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onChange={(page) => setFilters((current) => ({ ...current, page }))}
          />
        </>
      )}
    </>
  );
}

function Pagination({ page = 1, totalPages = 1, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="admin-pagination">
      <button
        className="admin-action-button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button
        className="admin-action-button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}

function AdminDeleteDialog({ project, saving, onCancel, onConfirm }) {
  if (!project) return null;

  return (
    <div className="admin-dialog-backdrop" role="presentation">
      <section
        className="admin-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-delete-title"
      >
        <h2 id="admin-delete-title">Delete project?</h2>
        <p>
          This will permanently delete <strong>{project.name}</strong>. This
          action cannot be undone.
        </p>
        <div className="admin-dialog-actions">
          <button
            className="admin-action-button"
            disabled={saving}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="admin-action-button admin-danger-button"
            disabled={saving}
            onClick={onConfirm}
          >
            {saving ? "Deleting..." : "Delete project"}
          </button>
        </div>
      </section>
    </div>
  );
}

const statusLabel = (user) =>
  user.isBanned ? "Banned" : user.isSuspended ? "Suspended" : "Active";

const actionErrorMessage = (error, fallback) => {
  const status = error.response?.status;
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You are not authorized to perform this action.";
  if (status === 404) return "The user could not be found.";
  if (status === 409) return "The user changed state. Refresh and try again.";
  return error.response?.data?.message || fallback;
};

export function AdminUserDetails() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const { notify } = useToast();
  const query = useAdminQueryWithRefresh(
    () => getAdminUser(userId),
    {},
    userId,
  );
  const adminStats = useAdminQuery(getAdminStats, {});
  const [actionState, setActionState] = useState({
    reason: "",
    expiresAt: "",
    note: "",
  });
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingRole, setPendingRole] = useState("");
  const [saving, setSaving] = useState(false);
  const user = query.data.user;
  const currentUserId = currentUser?._id || currentUser?.id;
  const isSelf =
    Boolean(currentUserId) && String(currentUserId) === String(userId);
  const isFinalAdmin =
    user?.role === "admin" && adminStats.data.users?.admins <= 1;

  const runAction = async (action) => {
    if (
      action === "suspend" &&
      (!actionState.reason.trim() || !actionState.expiresAt)
    ) {
      setActionError("Suspension reason and expiration are required.");
      return;
    }
    if (action === "ban" && !actionState.reason.trim()) {
      setActionError("A ban reason is required.");
      return;
    }
    if (action === "addNote" && !actionState.note.trim()) {
      setActionError("A note is required.");
      return;
    }
    try {
      setSaving(true);
      setActionError("");
      setActionSuccess("");
      await performAdminUserAction(
        userId,
        action,
        action === "addNote"
          ? { note: actionState.note }
          : { reason: actionState.reason, expiresAt: actionState.expiresAt },
      );
      setActionState({ reason: "", expiresAt: "", note: "" });
      setPendingAction(null);
      setActionSuccess(`${action} completed successfully.`);
      notify(`${action} completed successfully.`);
      query.refresh();
    } catch (error) {
      setActionError(
        actionErrorMessage(error, "Administrative action failed."),
      );
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (role) => {
    if (role === user.role) return;
    setPendingRole(role);
  };

  const confirmRoleChange = async () => {
    const role = pendingRole;
    setPendingRole("");
    if (!role) return;
    try {
      setSaving(true);
      setActionError("");
      setActionSuccess("");
      await updateAdminUserRole(userId, role);
      setActionSuccess(`Role changed to ${role}.`);
      notify(`Role changed to ${role}.`);
      query.refresh();
    } catch (error) {
      setActionError(actionErrorMessage(error, "Role update failed."));
    } finally {
      setSaving(false);
    }
  };

  const openActionDialog = (action) => {
    setActionError("");
    setActionSuccess("");
    setActionState((current) => ({ ...current, reason: "", expiresAt: "" }));
    setPendingAction(action);
  };

  const actionTitle = pendingAction
    ? `${pendingAction.charAt(0).toUpperCase()}${pendingAction.slice(1)} user`
    : "";
  const actionDescription = {
    suspend:
      "The user will be temporarily restricted until the expiration date.",
    unsuspend: "The user's suspension will be removed immediately.",
    ban: "The user will be persistently restricted until an admin unbans them.",
    unban: "The user's ban will be removed immediately.",
  }[pendingAction];

  return (
    <>
      <AlertModal
        message={
          pendingRole
            ? `Change ${user?.username || "this user's"} role to ${pendingRole}?`
            : ""
        }
        title="Change user role"
        onClose={() => setPendingRole("")}
        onConfirm={confirmRoleChange}
        confirmLabel="Change role"
      />
      <Header
        eyebrow="USER DETAIL"
        title={user?.displayName || user?.username || "User record"}
        description="Protected profile, relationships, activity, and moderation controls."
      />
      {query.loading && (
        <div className="admin-state">Loading user details...</div>
      )}
      {!query.loading && query.error && (
        <div className="admin-state admin-state-error">{query.error}</div>
      )}
      {!query.loading && !query.error && !user && (
        <div className="admin-state">User not found.</div>
      )}
      {!query.loading && !query.error && user && (
        <>
          <div className="admin-detail-grid admin-user-summary">
            <div>
              <span>Email</span>
              <strong>{user.email}</strong>
            </div>
            <div>
              <span>Role</span>
              <strong>{user.role}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{statusLabel(user)}</strong>
            </div>
            <div>
              <span>Verified</span>
              <strong>{user.isVerified ? "Yes" : "No"}</strong>
            </div>
            <div>
              <span>Online</span>
              <strong>
                {user.isOnline ? "Online" : formatDate(user.lastSeen)}
              </strong>
            </div>
            <div>
              <span>Created</span>
              <strong>{formatCompactDate(user.createdAt)}</strong>
            </div>
            <div>
              <span>Last login</span>
              <strong>{formatCompactDate(user.lastLoginAt)}</strong>
            </div>
            <div>
              <span>Auth provider</span>
              <strong>{user.authProvider}</strong>
            </div>
          </div>
          <section className="admin-panel admin-user-actions">
            <h2>Admin controls</h2>
            <div className="admin-form-grid">
              <label>
                Role
                <select
                  value={user.role}
                  disabled={saving || isSelf}
                  onChange={(event) => changeRole(event.target.value)}
                >
                  <option value="student" disabled={isFinalAdmin}>
                    Student
                  </option>
                  <option value="instructor" disabled={isFinalAdmin}>
                    Instructor
                  </option>
                  <option value="admin">Admin</option>
                </select>
                {isSelf && (
                  <small className="admin-field-note">
                    You cannot change your own role.
                  </small>
                )}
                {isFinalAdmin && (
                  <small className="admin-field-note">
                    The final admin cannot be demoted.
                  </small>
                )}
              </label>
              <label>
                Admin note
                <input
                  value={actionState.note}
                  disabled={saving}
                  onChange={(event) =>
                    setActionState((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                  placeholder="Add an internal note"
                />
              </label>
            </div>
            <div className="admin-action-row">
              {!isSelf && !user.isBanned && !user.isSuspended && (
                <button
                  className="admin-action-button"
                  disabled={saving}
                  onClick={() => openActionDialog("suspend")}
                >
                  Suspend
                </button>
              )}
              {!isSelf && user.isSuspended && !user.isBanned && (
                <button
                  className="admin-action-button"
                  disabled={saving}
                  onClick={() => openActionDialog("unsuspend")}
                >
                  Unsuspend
                </button>
              )}
              {!isSelf && !user.isBanned && (
                <button
                  className="admin-action-button admin-danger-button"
                  disabled={saving}
                  onClick={() => openActionDialog("ban")}
                >
                  Ban
                </button>
              )}
              {!isSelf && user.isBanned && (
                <button
                  className="admin-action-button"
                  disabled={saving}
                  onClick={() => openActionDialog("unban")}
                >
                  Unban
                </button>
              )}
              <button
                className="admin-action-button"
                disabled={saving}
                onClick={() => runAction("addFlag")}
              >
                Add flag
              </button>
              <button
                className="admin-action-button"
                disabled={saving || !user.flags}
                onClick={() => runAction("removeFlag")}
              >
                Remove flag
              </button>
              <button
                className="admin-action-button"
                disabled={saving}
                onClick={() => runAction("addNote")}
              >
                Add note
              </button>
            </div>
            {actionError && (
              <p className="admin-form-error" role="alert">
                {actionError}
              </p>
            )}
            {actionSuccess && (
              <p className="admin-form-success" role="status">
                {actionSuccess}
              </p>
            )}
          </section>
          {pendingAction && (
            <div
              className="admin-dialog-backdrop"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget && !saving) {
                  setPendingAction(null);
                }
              }}
            >
              <section
                className="admin-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-action-title"
              >
                <h2 id="admin-action-title">{actionTitle}</h2>
                <p>{actionDescription}</p>
                {["suspend", "ban"].includes(pendingAction) && (
                  <label>
                    Reason
                    <input
                      autoFocus
                      value={actionState.reason}
                      disabled={saving}
                      onChange={(event) =>
                        setActionState((current) => ({
                          ...current,
                          reason: event.target.value,
                        }))
                      }
                      placeholder={
                        pendingAction === "ban"
                          ? "Required ban reason"
                          : "Required suspension reason"
                      }
                    />
                  </label>
                )}
                {pendingAction === "suspend" && (
                  <div className="admin-date-time-field">
                    <span>Suspension expires</span>
                    <div className="admin-date-time-inputs">
                      <label>
                        Date
                        <input
                          type="date"
                          value={actionState.expiresAt.slice(0, 10)}
                          disabled={saving}
                          onChange={(event) =>
                            setActionState((current) => ({
                              ...current,
                              expiresAt: `${event.target.value}T${current.expiresAt.slice(11, 16) || "12:00"}`,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Time
                        <input
                          type="time"
                          value={actionState.expiresAt.slice(11, 16)}
                          disabled={saving}
                          onChange={(event) =>
                            setActionState((current) => ({
                              ...current,
                              expiresAt: `${current.expiresAt.slice(0, 10)}T${event.target.value}`,
                            }))
                          }
                        />
                      </label>
                    </div>
                    <small>
                      Choose when the temporary restriction should end.
                    </small>
                  </div>
                )}
                {actionError && (
                  <p className="admin-form-error" role="alert">
                    {actionError}
                  </p>
                )}
                <div className="admin-dialog-actions">
                  <button
                    className="admin-action-button"
                    disabled={saving}
                    onClick={() => setPendingAction(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="admin-action-button admin-danger-button"
                    disabled={saving}
                    onClick={() => runAction(pendingAction)}
                  >
                    {saving ? "Saving..." : "Confirm"}
                  </button>
                </div>
              </section>
            </div>
          )}
          <div className="admin-detail-grid admin-related-grid">
            <section className="admin-panel">
              <h2>Projects ({query.data.projects?.length || 0})</h2>
              {query.data.projects?.length ? (
                <ul className="admin-related-list">
                  {query.data.projects.map((project) => (
                    <li key={project._id}>
                      <Link to={`/admin/projects/${project._id}`}>
                        {project.name}
                      </Link>
                      <span>{project.status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="admin-state admin-state-compact">
                  No related projects.
                </div>
              )}
            </section>
            <section className="admin-panel">
              <h2>
                Support activity ({query.data.supportTickets?.length || 0})
              </h2>
              {query.data.supportTickets?.length ? (
                <ul className="admin-related-list">
                  {query.data.supportTickets.map((ticket) => (
                    <li key={ticket._id}>
                      <Link to={`/admin/support/${ticket._id}`}>
                        {ticket.title || ticket.ticketNumber}
                      </Link>
                      <span>{ticket.status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="admin-state admin-state-compact">
                  No related support activity.
                </div>
              )}
            </section>
          </div>
          <section className="admin-panel">
            <h2>Profile</h2>
            <p>{user.bio || "No bio provided."}</p>
            <div className="admin-detail-grid">
              <div>
                <span>Display name</span>
                <strong>{user.displayName || "-"}</strong>
              </div>
              <div>
                <span>Experience</span>
                <strong>{user.experienceLevel || "-"}</strong>
              </div>
              <div>
                <span>Primary track</span>
                <strong>{user.primaryTrack || "-"}</strong>
              </div>
              <div>
                <span>Flags</span>
                <strong>{user.flags || 0}</strong>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}

export function AdminProjects() {
  const { notify } = useToast();
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    status: "",
    visibility: "",
    page: 1,
    limit: 10,
  });
  const [actionError, setActionError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const params = {
    ...filters,
    ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
  };
  const query = useAdminQueryWithRefresh(
    () => getAdminProjects(params),
    {},
    JSON.stringify(params),
  );
  const pagination = query.data.pagination || {};
  const updateFilter = (name, value) =>
    setFilters((current) => ({ ...current, [name]: value, page: 1 }));
  const removeProject = async (project) => {
    if (!project) return;
    setDeleteTarget(project);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await deleteAdminProject(deleteTarget._id);
      setActionError("");
      setDeleteTarget(null);
      query.refresh();
      notify("Project deleted successfully.");
    } catch (error) {
      setActionError(
        error.response?.data?.message || "Project deletion failed.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const projects = query.data.projects || [];
  return (
    <>
      <Header
        eyebrow="PROJECT OVERSIGHT"
        title="Projects across the platform"
        description="Search and inspect projects using the protected admin service."
      />
      <div className="admin-filter-bar">
        <input
          aria-label="Search projects"
          placeholder="Search project names"
          value={filters.search}
          onChange={(event) => updateFilter("search", event.target.value)}
        />
        <select
          aria-label="Filter by category"
          value={filters.category}
          onChange={(event) => updateFilter("category", event.target.value)}
        >
          <option value="">All categories</option>
          {[
            "Web",
            "Mobile",
            "AI/ML",
            "Game Dev",
            "Desktop",
            "DevOps",
            "Cybersecurity",
            "Blockchain",
            "Other",
          ].map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by status"
          value={filters.status}
          onChange={(event) => updateFilter("status", event.target.value)}
        >
          <option value="">All statuses</option>
          {[
            "Idea",
            "Building",
            "Testing",
            "Launched",
            "Paused",
            "Archived",
          ].map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by visibility"
          value={filters.visibility}
          onChange={(event) => updateFilter("visibility", event.target.value)}
        >
          <option value="">All visibility</option>
          <option value="Public">Public</option>
          <option value="Private">Private</option>
        </select>
      </div>
      {actionError && (
        <div className="admin-state admin-state-error">{actionError}</div>
      )}
      {query.loading && <div className="admin-state">Loading projects...</div>}
      {!query.loading && query.error && (
        <div className="admin-state admin-state-error">{query.error}</div>
      )}
      {!query.loading && !query.error && !projects.length && (
        <div className="admin-state">No projects match these filters.</div>
      )}
      {!query.loading && !query.error && projects.length > 0 && (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Owner</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Visibility</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project._id}>
                    <td>
                      <Link to={`/admin/projects/${project._id}`}>
                        {project.name}
                      </Link>
                      <small>{project.tagline || "-"}</small>
                    </td>
                    <td>{project.owner?.username || "-"}</td>
                    <td>{project.category}</td>
                    <td>{project.status}</td>
                    <td>{project.visibility}</td>
                    <td>{formatDate(project.createdAt)}</td>
                    <td>
                      <button
                        className="admin-table-action admin-danger-button"
                        onClick={() => removeProject(project)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onChange={(page) => setFilters((current) => ({ ...current, page }))}
          />
        </>
      )}
      <AdminDeleteDialog
        project={deleteTarget}
        saving={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
export function AdminSupport() {
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    track: "",
    assignedInstructor: "",
    page: 1,
    limit: 10,
  });
  const params = {
    ...filters,
    ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
  };
  const query = useAdminQuery(
    () => getAdminSupportTickets(params),
    {},
    JSON.stringify(params),
  );
  const assignees = useAdminQuery(getAdminSupportAssignees, {
    instructors: [],
  });
  const tickets = query.data.tickets || [];
  const pagination = query.data.pagination || {};
  const updateFilter = (name, value) =>
    setFilters((current) => ({ ...current, [name]: value, page: 1 }));
  return (
    <>
      <Header
        eyebrow="SUPPORT OPERATIONS"
        title="Support ticket management"
        description="Review tickets and use the existing support workflow."
      />
      <div className="admin-filter-bar">
        <input
          aria-label="Search tickets"
          placeholder="Search title or ticket number"
          value={filters.search}
          onChange={(event) => updateFilter("search", event.target.value)}
        />
        <select
          aria-label="Filter by status"
          value={filters.status}
          onChange={(event) => updateFilter("status", event.target.value)}
        >
          <option value="">All statuses</option>
          {supportStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by priority"
          value={filters.priority}
          onChange={(event) => updateFilter("priority", event.target.value)}
        >
          <option value="">All priorities</option>
          {supportPriorities.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
        <input
          aria-label="Filter by track"
          placeholder="Track"
          value={filters.track}
          onChange={(event) => updateFilter("track", event.target.value)}
        />
        <select
          aria-label="Filter by assigned instructor"
          value={filters.assignedInstructor}
          onChange={(event) =>
            updateFilter("assignedInstructor", event.target.value)
          }
        >
          <option value="">All assignees</option>
          <option value="unassigned">Unassigned</option>
          {assignees.data.instructors?.map((instructor) => (
            <option key={instructor._id} value={instructor._id}>
              {instructor.username}
            </option>
          ))}
        </select>
      </div>
      {query.loading && (
        <div className="admin-state">Loading support tickets...</div>
      )}
      {!query.loading && query.error && (
        <div className="admin-state admin-state-error">{query.error}</div>
      )}
      {!query.loading && !query.error && !tickets.length && (
        <div className="admin-state">No tickets match these filters.</div>
      )}
      {!query.loading && !query.error && tickets.length > 0 && (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Track</th>
                  <th>Assigned</th>
                  <th>Last activity</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket._id}>
                    <td>
                      <Link to={`/admin/support/${ticket._id}`}>
                        {ticket.ticketNumber}
                      </Link>
                      <small>{ticket.title}</small>
                    </td>
                    <td>
                      {ticket.student?.username || ticket.student?.email || "-"}
                    </td>
                    <td>
                      <span
                        className={`support-status-badge status-${ticket.status.toLowerCase().replaceAll(" ", "-")}`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`support-priority-badge priority-${ticket.priority?.toLowerCase()}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td>{ticket.track || "-"}</td>
                    <td>
                      {ticket.assignedInstructor?.username || "Unassigned"}
                    </td>
                    <td>
                      {formatDate(ticket.lastActivityAt || ticket.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onChange={(page) => setFilters((current) => ({ ...current, page }))}
          />
        </>
      )}
    </>
  );
}

const supportStatuses = [
  "Open",
  "Claimed",
  "In Progress",
  "Waiting For Student",
  "Resolved",
  "Closed",
];
const supportPriorities = ["Low", "Medium", "High", "Urgent"];

export function AdminCollection({
  title,
  eyebrow,
  load,
  itemsKey,
  columns,
  renderRow,
}) {
  const query = useAdminQuery(load, {});
  const items = query.data[itemsKey] || [];
  return (
    <>
      <Header
        eyebrow={eyebrow}
        title={title}
        description="Records loaded from the protected admin endpoint."
      />
      <PageState
        loading={query.loading}
        error={query.error}
        empty={!items.length}
      >
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>{renderRow(item)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageState>
    </>
  );
}

export function AdminProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const query = useAdminQuery(() => getAdminProject(projectId), {}, projectId);
  const project = query.data.project;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const removeProject = async () => {
    if (!project) return;
    try {
      setDeleting(true);
      await deleteAdminProject(projectId);
      notify("Project deleted successfully.");
      navigate("/admin/projects", { replace: true });
    } catch (error) {
      setAlertMessage(
        error.response?.data?.message || "Project deletion failed.",
      );
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };
  return (
    <>
      <AlertModal message={alertMessage} onClose={() => setAlertMessage("")} />
      <Header
        eyebrow="PROJECT DETAIL"
        title={project?.name || "Project detail"}
        description="Cross-platform project information from the protected admin service."
      />
      {query.loading && (
        <div className="admin-state">Loading project details...</div>
      )}
      {!query.loading && query.error && (
        <div className="admin-state admin-state-error">{query.error}</div>
      )}
      {!query.loading && !query.error && !project && (
        <div className="admin-state">Project not found.</div>
      )}
      {!query.loading && !query.error && project && (
        <>
          <div className="admin-detail-grid admin-user-summary">
            <div>
              <span>Category</span>
              <strong>{project.category}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{project.status}</strong>
            </div>
            <div>
              <span>Visibility</span>
              <strong>{project.visibility}</strong>
            </div>
            <div>
              <span>Created</span>
              <strong>{formatDate(project.createdAt)}</strong>
            </div>
            <div>
              <span>Members</span>
              <strong>
                {query.data.statistics?.memberCount ??
                  project.members?.length ??
                  0}
              </strong>
            </div>
            <div>
              <span>Co-owners</span>
              <strong>
                {query.data.statistics?.coOwnerCount ??
                  project.coOwners?.length ??
                  0}
              </strong>
            </div>
            <div>
              <span>Technologies</span>
              <strong>
                {query.data.statistics?.technologyCount ??
                  project.technologies?.length ??
                  0}
              </strong>
            </div>
          </div>
          <section className="admin-panel admin-project-description">
            <div className="admin-detail-heading">
              <h2>{project.tagline || "Project overview"}</h2>
              <button
                className="admin-action-button admin-danger-button"
                onClick={() => setDeleteOpen(true)}
              >
                Delete project
              </button>
            </div>
            <p>{project.description || "No description provided."}</p>
            <div className="admin-project-tags">
              {project.technologies?.map((technology) => (
                <span key={technology}>{technology}</span>
              ))}
            </div>
          </section>
          <div className="admin-detail-grid admin-related-grid">
            <PersonList
              title="Owner"
              people={project.owner ? [project.owner] : []}
              emptyLabel="No owner information."
            />
            <PersonList
              title="Co-owners"
              people={project.coOwners || []}
              emptyLabel="No co-owners."
            />
            <PersonList
              title="Members"
              people={project.members || []}
              emptyLabel="No members."
            />
          </div>
        </>
      )}
      <AdminDeleteDialog
        project={deleteOpen ? project : null}
        saving={deleting}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={removeProject}
      />
    </>
  );
}

function PersonList({ title, people, emptyLabel }) {
  return (
    <section className="admin-panel">
      <h2>
        {title} ({people.length})
      </h2>
      {people.length ? (
        <ul className="admin-related-list">
          {people.map((person) => (
            <li key={person._id}>
              <span>{person.username || person.email}</span>
              <span>{person.role || "-"}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="admin-state admin-state-compact">{emptyLabel}</div>
      )}
    </section>
  );
}
export function AdminSupportDetails() {
  const { ticketId } = useParams();
  const { notify } = useToast();
  const query = useAdminQueryWithRefresh(
    () => getAdminSupportTicket(ticketId),
    {},
    ticketId,
  );
  const assignees = useAdminQuery(getAdminSupportAssignees, {
    instructors: [],
  });
  const ticket = query.data.ticket;
  const [reply, setReply] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const nextStatuses = supportStatusTransitions[ticket?.status] || [];
  const conversationId = ticket?.conversation?._id || ticket?.conversation;

  const runTicketAction = async (action, value) => {
    try {
      setSaving(true);
      setActionError("");
      if (action === "claim") await claimAdminSupportTicket(ticketId);
      if (action === "assign") await assignAdminSupportTicket(ticketId, value);
      if (action === "status") await updateAdminSupportStatus(ticketId, value);
      notify("Support ticket updated successfully.");
      query.refresh();
    } catch (error) {
      setActionError(error.response?.data?.message || "Support action failed.");
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (!reply.trim() || !conversationId) return;
    try {
      setSaving(true);
      setActionError("");
      await sendConversationMessage(conversationId, reply.trim());
      setReply("");
      notify("Reply sent successfully.");
      query.refresh();
    } catch (error) {
      setActionError(error.response?.data?.message || "Reply failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header
        eyebrow="SUPPORT TICKET"
        title={ticket?.ticketNumber || "Ticket detail"}
        description={
          ticket?.title ||
          "Protected support conversation and workflow controls."
        }
      />
      {query.loading && (
        <div className="admin-state">Loading ticket details...</div>
      )}
      {!query.loading && query.error && (
        <div className="admin-state admin-state-error">{query.error}</div>
      )}
      {!query.loading && !query.error && !ticket && (
        <div className="admin-state">Support ticket not found.</div>
      )}
      {!query.loading && !query.error && ticket && (
        <>
          <div className="admin-detail-grid admin-user-summary">
            <div>
              <span>Status</span>
              <strong>
                <span
                  className={`support-status-badge status-${ticket.status.toLowerCase().replaceAll(" ", "-")}`}
                >
                  {ticket.status}
                </span>
              </strong>
            </div>
            <div>
              <span>Priority</span>
              <strong>
                <span
                  className={`support-priority-badge priority-${ticket.priority?.toLowerCase()}`}
                >
                  {ticket.priority}
                </span>
              </strong>
            </div>
            <div>
              <span>Track</span>
              <strong>{ticket.track || "-"}</strong>
            </div>
            <div>
              <span>Created</span>
              <strong>{formatDate(ticket.createdAt)}</strong>
            </div>
            <div>
              <span>Last activity</span>
              <strong>{formatDate(ticket.lastActivityAt)}</strong>
            </div>
            <div>
              <span>Course</span>
              <strong>{ticket.course || "-"}</strong>
            </div>
          </div>
          <section className="admin-panel admin-support-actions">
            <h2>Workflow controls</h2>
            <div className="admin-action-row">
              {ticket.status === "Open" && !ticket.assignedInstructor && (
                <button
                  className="admin-action-button"
                  disabled={saving}
                  onClick={() => runTicketAction("claim")}
                >
                  Claim ticket
                </button>
              )}
              <select
                aria-label="Assign instructor"
                disabled={
                  saving ||
                  ticket.status !== "Open" ||
                  Boolean(ticket.assignedInstructor)
                }
                defaultValue=""
                onChange={(event) =>
                  event.target.value &&
                  runTicketAction("assign", event.target.value)
                }
              >
                <option value="">
                  {ticket.assignedInstructor
                    ? `Assigned to ${ticket.assignedInstructor.username}`
                    : "Assign instructor"}
                </option>
                {assignees.data.instructors?.map((instructor) => (
                  <option key={instructor._id} value={instructor._id}>
                    {instructor.username}
                  </option>
                ))}
              </select>
              {nextStatuses.map((status) => (
                <button
                  key={status}
                  className="admin-action-button"
                  disabled={saving}
                  onClick={() => runTicketAction("status", status)}
                >
                  Move to {status}
                </button>
              ))}
            </div>
            {actionError && <p className="admin-form-error">{actionError}</p>}
          </section>
          <div className="admin-detail-grid admin-related-grid">
            <section className="admin-panel">
              <h2>Student</h2>
              <div className="admin-detail-grid">
                <div>
                  <span>Username</span>
                  <strong>{ticket.student?.username || "-"}</strong>
                </div>
                <div>
                  <span>Email</span>
                  <strong>{ticket.student?.email || "-"}</strong>
                </div>
                <div>
                  <span>Online</span>
                  <strong>
                    {ticket.student?.isOnline
                      ? "Online"
                      : formatDate(ticket.student?.lastSeen)}
                  </strong>
                </div>
              </div>
            </section>
            <section className="admin-panel">
              <h2>Assigned instructor</h2>
              <div className="admin-detail-grid">
                <div>
                  <span>Username</span>
                  <strong>
                    {ticket.assignedInstructor?.username || "Unassigned"}
                  </strong>
                </div>
                <div>
                  <span>Email</span>
                  <strong>{ticket.assignedInstructor?.email || "-"}</strong>
                </div>
              </div>
            </section>
          </div>
          <section className="admin-panel">
            <h2>{ticket.title}</h2>
            <p className="admin-support-description">{ticket.description}</p>
          </section>
          <section className="admin-panel admin-conversation-panel">
            <div className="analytics-series-heading">
              <h2>Conversation</h2>
              <span>{query.data.messages?.length || 0} messages</span>
            </div>
            <div className="admin-message-thread">
              {query.data.messages?.length ? (
                query.data.messages.map((message) => (
                  <article className="admin-message" key={message._id}>
                    <div>
                      <strong>{message.sender?.username || "User"}</strong>
                      <time>{formatDate(message.createdAt)}</time>
                    </div>
                    <p>
                      {message.isDeletedForEveryone
                        ? "Message deleted"
                        : message.content}
                    </p>
                  </article>
                ))
              ) : (
                <div className="admin-state admin-state-compact">
                  No messages in this conversation.
                </div>
              )}
            </div>
            {conversationId && (
              <form className="admin-reply-form" onSubmit={sendReply}>
                <textarea
                  aria-label="Reply to support conversation"
                  value={reply}
                  disabled={saving}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Write a reply..."
                  rows="4"
                />
                <button
                  className="admin-action-button"
                  disabled={saving || !reply.trim()}
                >
                  {saving ? "Sending..." : "Send reply"}
                </button>
              </form>
            )}
          </section>
          <section className="admin-panel">
            <h2>Status history</h2>
            {ticket.statusHistory?.length ? (
              <div className="admin-status-history">
                {ticket.statusHistory.map((entry, index) => (
                  <div key={`${entry.createdAt}-${index}`}>
                    <strong>{entry.status}</strong>
                    <span>{entry.changedBy?.username || "System"}</span>
                    <time>{formatDate(entry.createdAt)}</time>
                    {entry.note && <p>{entry.note}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-state admin-state-compact">
                No status history.
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}

const supportStatusTransitions = {
  Open: ["Claimed"],
  Claimed: ["In Progress"],
  "In Progress": ["Waiting For Student", "Resolved"],
  "Waiting For Student": ["In Progress", "Resolved"],
  Resolved: ["Closed"],
  Closed: [],
};

export function AdminAuditLogs() {
  const [filters, setFilters] = useState({
    action: "",
    adminId: "",
    page: 1,
    limit: 20,
  });
  const params = {
    ...filters,
    ...(filters.action.trim() ? { action: filters.action.trim() } : {}),
    ...(filters.adminId.trim() ? { adminId: filters.adminId.trim() } : {}),
  };
  const query = useAdminQuery(
    () => getAdminAuditLogs(params),
    {},
    JSON.stringify(params),
  );
  const logs = query.data.logs || [];
  const updateFilter = (name, value) =>
    setFilters((current) => ({ ...current, [name]: value, page: 1 }));
  return (
    <>
      <Header
        eyebrow="AUDIT TRAIL"
        title="Administrative activity"
        description="Newest protected audit records from the backend."
      />
      <div className="admin-filter-bar">
        <input
          aria-label="Filter audit action"
          placeholder="Filter action, e.g. USER_BANNED"
          value={filters.action}
          onChange={(event) => updateFilter("action", event.target.value)}
        />
        <input
          aria-label="Filter audit admin ID"
          placeholder="Filter by admin ID"
          value={filters.adminId}
          onChange={(event) => updateFilter("adminId", event.target.value)}
        />
      </div>
      {query.loading && (
        <div className="admin-state">Loading audit records...</div>
      )}
      {!query.loading && query.error && (
        <div className="admin-state admin-state-error">{query.error}</div>
      )}
      {!query.loading && !query.error && !logs.length && (
        <div className="admin-state">No audit records match these filters.</div>
      )}
      {!query.loading && !query.error && logs.length > 0 && (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table audit-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Target / resource</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <strong>{log.action}</strong>
                    </td>
                    <td>
                      {log.admin?.username || log.admin?.email || "-"}
                      <small>{log.admin?.email || ""}</small>
                    </td>
                    <td>{auditTargetLabel(log)}</td>
                    <td>
                      <AuditDetails details={log.details} />
                    </td>
                    <td>{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={query.data.currentPage}
            totalPages={query.data.totalPages}
            onChange={(page) => setFilters((current) => ({ ...current, page }))}
          />
        </>
      )}
    </>
  );
}

function auditTargetLabel(log) {
  if (log.targetUser)
    return `User: ${log.targetUser.username || log.targetUser.email}`;
  if (log.targetStream)
    return `Stream: ${log.targetStream.title || log.targetStream._id}`;
  if (log.targetReport) return `Report: ${log.targetReport._id}`;
  return "System action";
}

function AuditDetails({ details }) {
  if (!details) return <span>-</span>;

  let parsedDetails;
  try {
    parsedDetails = JSON.parse(details);
  } catch {
    return <span className="audit-plain-details">{details}</span>;
  }

  const previous = parsedDetails.previous || {};
  const next = parsedDetails.next || {};
  const fields = Array.from(
    new Set([...Object.keys(previous), ...Object.keys(next)]),
  );

  return (
    <div className="audit-details">
      {fields.map((field) => (
        <div className="audit-change" key={field}>
          <span className="audit-change-label">{field}</span>
          <span className="audit-change-values">
            {formatAuditValue(previous[field])} -&gt;{" "}
            {formatAuditValue(next[field])}
          </span>
        </div>
      ))}
      {parsedDetails.reason && (
        <span className="audit-reason">Reason: {parsedDetails.reason}</span>
      )}
    </div>
  );
}

function formatAuditValue(value) {
  if (value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export function AdminAnalytics() {
  const [range, setRange] = useState({ from: "", to: "" });
  const [appliedRange, setAppliedRange] = useState({ from: "", to: "" });
  const query = useAdminQuery(
    () => getAdminOperationalAnalytics(appliedRange),
    {},
    JSON.stringify(appliedRange),
  );
  const users = query.data.growth?.users || [];
  const projects = query.data.growth?.projects || [];
  const supportActivity = query.data.growth?.supportActivity || [];
  const projectStatuses = query.data.distributions?.projectStatuses || [];
  const supportStatuses = query.data.distributions?.supportStatuses || [];
  const summary = query.data.summary || {};
  return (
    <>
      <Header
        eyebrow="ANALYTICS"
        title="Growth and platform signals"
        description="Operational trends calculated by protected MongoDB aggregations."
      />
      <form
        className="analytics-range-bar"
        onSubmit={(event) => {
          event.preventDefault();
          setAppliedRange(range);
        }}
      >
        <label>
          From
          <input
            type="date"
            value={range.from}
            onChange={(event) =>
              setRange((current) => ({ ...current, from: event.target.value }))
            }
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={range.to}
            onChange={(event) =>
              setRange((current) => ({ ...current, to: event.target.value }))
            }
          />
        </label>
        <button className="admin-action-button" disabled={query.loading}>
          Apply range
        </button>
      </form>
      {query.loading && <DashboardSkeleton />}
      {!query.loading && query.error && (
        <div className="admin-state admin-state-error">{query.error}</div>
      )}
      {!query.loading &&
        !query.error &&
        !users.length &&
        !projects.length &&
        !supportActivity.length && (
          <div className="admin-state">
            No analytics data for the selected range.
          </div>
        )}
      {!query.loading &&
      !query.error &&
      (users.length || projects.length || supportActivity.length) ? (
        <>
          <div className="admin-stat-grid analytics-stat-grid">
            <div className="admin-stat">
              <span>Active users · 30 days</span>
              <strong>{summary.activeUsers ?? "-"}</strong>
            </div>
            <div className="admin-stat">
              <span>Active projects</span>
              <strong>{summary.activeProjects ?? "-"}</strong>
            </div>
            <div className="admin-stat">
              <span>Users added</span>
              <strong>{seriesTotal(users).toLocaleString()}</strong>
            </div>
            <div className="admin-stat">
              <span>Support tickets</span>
              <strong>{summary.supportTotal ?? "-"}</strong>
            </div>
          </div>
          <div className="analytics-chart-grid">
            <GrowthChart
              title="User growth"
              entries={users}
              valueLabel="New users"
            />
            <GrowthChart
              title="Project growth"
              entries={projects}
              valueLabel="New projects"
            />
            <GrowthChart
              title="Support activity"
              entries={supportActivity}
              valueLabel="New tickets"
            />
          </div>
          <div className="analytics-distribution-grid">
            <DistributionChart
              title="Project status distribution"
              entries={projectStatuses}
            />
            <DistributionChart
              title="Support status distribution"
              entries={supportStatuses}
            />
          </div>
        </>
      ) : null}
    </>
  );
}
