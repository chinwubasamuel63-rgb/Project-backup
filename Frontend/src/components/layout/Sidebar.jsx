import { useNavigate, useLocation } from "react-router-dom";

import { navByRole } from "../../data/NavigationItems";
import { ROLE_META } from "../../data/roleMeta";
import { canAccess } from "../../data/viewRoles";
import "./sidebar.css";

export default function Sidebar({ role, assignedRoles }) {
  const navigate = useNavigate();

  const location = useLocation();

  const navigationItems = navByRole[role] || navByRole.student;

  const meta = ROLE_META[role] || ROLE_META.student;

  const handleNavigate = (path) => {
    if (canAccess(path, assignedRoles)) {
      navigate(path);
    }
  };

  return (
    <aside className="shell-sidebar">
      <div className="role-mini-panel">
        <div>
          <div className="mini-label">Active role</div>
          <div className="mini-value">{meta.label}</div>
        </div>

        <span style={{ background: meta.accent }} />
      </div>

      <nav className="side-nav">
        {navigationItems.map((item) => {
          const locked = !canAccess(item.id, assignedRoles);

          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`side-link ${
                location.pathname === item.id ? "active" : ""
              } ${locked ? "locked" : ""}`}
            >
              <span className="side-icon">{item.icon}</span>

              <span>{item.label}</span>

              {locked && <span className="lock-chip">LOCKED</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          className="btn-ghost"
          style={{ width: "100%" }}
          onClick={() => navigate("/profile")}
        >
          Settings
        </button>
      </div>
    </aside>
  );
}