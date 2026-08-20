import { ROLE_META } from "../../data/roleMeta";

/**
 * AccessDenied Component - Role access gate UI
 * Displays when user tries to access unauthorized views
 */
export default function AccessDenied({
  attemptedRole,
  assignedRoles,
  setView,
}) {
  const meta = ROLE_META[attemptedRole] || ROLE_META.student;
  const fallback = ROLE_META[assignedRoles[0] || "student"].home;
  const displayName = meta.label || "User";

  return (
    <div className="access-denied">
      <div className="access-panel">
        <div className="shield-3d">
          <span>{displayName.charAt(0).toUpperCase()}</span>
        </div>
        <span className="eyebrow">ROLE GATE ACTIVE</span>
        <h1>{meta.label} access is not assigned to this account.</h1>
        <p>
          This dashboard is protected by role assignment. Ask an admin to grant{" "}
          {meta.label.toLowerCase()} permissions, or return to your assigned
          workspace.
        </p>
        <div className="assigned-list">
          {assignedRoles.map((r) => (
            <span key={r}>{ROLE_META[r].label}</span>
          ))}
        </div>
        <button className="btn-primary" onClick={() => setView(fallback)}>
          Return to assigned dashboard
        </button>
      </div>
    </div>
  );
}
