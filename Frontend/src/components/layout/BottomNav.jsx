import { useNavigate, useLocation } from "react-router-dom";
import { navByRole } from "../../data/NavigationItems";
import { canAccess } from "../../data/viewRoles";
import "./bottom-nav.css";

export default function BottomNav({ role, assignedRoles }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = navByRole[role] || navByRole.student;

  const handleNavigate = (path) => {
    if (canAccess(path, assignedRoles)) {
      navigate(path);
    }
  };

  // Get current active item
  const isActive = (itemPath) => location.pathname === itemPath;

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-container">
        {navigationItems.map((item) => {
          const locked = !canAccess(item.id, assignedRoles);
          const active = isActive(item.id);

          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`bottom-nav-item ${active ? "active" : ""} ${
                locked ? "locked" : ""
              }`}
              title={item.label}
              aria-label={item.label}
            >
              <span className="bottom-nav-icon">{item.icon}</span>
              <span className="bottom-nav-label">{item.label}</span>
              {locked && <span className="bottom-lock-indicator">🔒</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
