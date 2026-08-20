import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { globalSearch } from "../../services/searchService";
import { ROLE_META } from "../../data/roleMeta";
import { useAuth } from "../../hooks/useAuth";

import {
  getUnreadNotificationCount,
  getMyConversations,
} from "../../services/topNavService";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../services/notificationService";

import "./top-nav.css";

export default function TopNav({ role, onLogout }) {
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [isCompactNav, setIsCompactNav] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 768,
  );
  const [isTabletNav, setIsTabletNav] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 1024,
  );

  // Logout confirmation modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const menuRef = useRef(null);
  const searchRef = useRef(null);

  const navigate = useNavigate();

  const { user } = useAuth();

  const meta = ROLE_META[role] || ROLE_META.student;

  const displayName = user?.username || "User";

  const getAvatarUrl = (avatar) => {
    if (!avatar) return "";
    if (typeof avatar === "string") return avatar;
    return avatar.url || avatar.secure_url || "";
  };

  const avatarUrl = getAvatarUrl(user?.avatar);

  const getNotificationDestination = (item) => {
    const id = item?.relatedEntity;
    if (!id) return "/notifications";
    if (item.relatedEntityType === "SupportTicket" || item.type === "support") {
      return role === "admin" ? `/admin/support/${id}` : `/support/${id}`;
    }
    if (item.relatedEntityType === "Project") {
      return role === "admin" ? `/admin/projects/${id}` : `/projects/${id}`;
    }
    if (item.relatedEntityType === "User") {
      return role === "admin" ? `/admin/users/${id}` : `/profile/${id}`;
    }
    return "/notifications";
  };

  const loadRecentNotifications = async () => {
    try {
      const response = await getNotifications();
      setRecentNotifications((response?.notifications || []).slice(0, 4));
    } catch (error) {
      console.error("TopNav recent notifications error:", error);
    }
  };

  const getNotificationDisplayName = (item) => {
    if (!item) return "Notification";

    if (item.sender?.username) return item.sender.username;
    if (item.relatedUser?.username) return item.relatedUser.username;
    if (item.title && item.title !== "Notification") return item.title;
    if (item.type === "support") return "Support team";
    if (item.type === "message") return "Inbox";
    if (item.type === "project") return "Project update";

    return "System";
  };

  const handleNotificationClick = async (item, destination) => {
    if (item?._id && !item.isRead) {
      try {
        await markNotificationAsRead(item._id);
        const unreadResponse = await getUnreadNotificationCount();
        setNotificationCount(unreadResponse.unreadCount || 0);
        setRecentNotifications((items) =>
          items.map((entry) =>
            entry._id === item._id ? { ...entry, isRead: true } : entry,
          ),
        );
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    setNoticeOpen(false);
    navigate(destination);
  };

  const handleBellClick = async () => {
    if (notificationCount > 0) {
      try {
        await markAllNotificationsAsRead();
        setNotificationCount(0);
        setRecentNotifications((items) =>
          items.map((item) => ({ ...item, isRead: true })),
        );
      } catch (error) {
        console.error("Failed to mark all notifications as read:", error);
      }
    }

    setNoticeOpen((open) => !open);
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setMenuOpen(false);
  };

  const handleConfirmLogout = async () => {
    try {
      setLoggingOut(true);
      await onLogout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  };

  const handleSearch = async (e) => {
    const value = e.target.value;

    setSearchValue(value);

    if (value.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    try {
      const results = await globalSearch(value);

      setSearchResults(results.results);
      setSearchOpen(true);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const loadTopNavData = async () => {
      try {
        const notificationData = await getUnreadNotificationCount();

        setNotificationCount(notificationData.unreadCount || 0);

        const conversationData = await getMyConversations();

        setMessageCount(conversationData.count || 0);
      } catch (error) {
        console.error("TopNav load error:", error);
      }
    };

    const timerId = window.setTimeout(() => {
      void loadTopNavData();
      void loadRecentNotifications();
    }, 0);
    return () => window.clearTimeout(timerId);
  }, []);

  useEffect(() => {
    if (noticeOpen) {
      const timerId = window.setTimeout(() => {
        void loadRecentNotifications();
      }, 0);
      return () => window.clearTimeout(timerId);
    }
  }, [noticeOpen]);

  useEffect(() => {
    const handleResize = () => {
      setIsCompactNav(window.innerWidth <= 768);
      setIsTabletNav(window.innerWidth <= 1024);
    };

    const handleNotificationsUpdated = async (event) => {
      const nextUnreadCount = event?.detail?.unreadCount ?? 0;
      setNotificationCount(nextUnreadCount);

      try {
        const unreadResponse = await getUnreadNotificationCount();
        setNotificationCount(unreadResponse.unreadCount || 0);
      } catch (error) {
        console.error("TopNav notification sync error:", error);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener(
      "devstream:notifications-updated",
      handleNotificationsUpdated,
    );

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener(
        "devstream:notifications-updated",
        handleNotificationsUpdated,
      );
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderSearchResults = (isMobileResults = false) => {
    if (!searchResults) return null;

    return (
      <div
        className={`search-dropdown${isMobileResults ? " mobile-search-results" : ""}`}
      >
        <div className="search-section">
          <div className="search-heading">Projects</div>

          {searchResults.projects?.map((project) => (
            <button
              key={project._id}
              className="search-item"
              onClick={() => navigate(`/projects/${project._id}`)}
            >
              {project.name}
            </button>
          ))}
        </div>

        <div className="search-section">
          <div className="search-heading">Jobs</div>

          {searchResults.jobs?.map((job) => (
            <button
              key={job._id}
              className="search-item"
              onClick={() => navigate(`/jobs/${job._id}`)}
            >
              {job.title}
            </button>
          ))}
        </div>

        {searchResults.users?.length > 0 && (
          <div className="search-section">
            <div className="search-heading">Users</div>

            {searchResults.users.map((u) => {
              const avatarUrl = getAvatarUrl(u.avatar);
              const isValidAvatar =
                avatarUrl &&
                (avatarUrl.startsWith("http") ||
                  avatarUrl.startsWith("/") ||
                  avatarUrl.startsWith("blob"));

              return (
                <button
                  key={u._id}
                  className="search-item user-search-item"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchValue("");
                    navigate(`/profile/${u._id}`);
                  }}
                >
                  <div className="search-user-avatar">
                    {isValidAvatar ? (
                      <img src={avatarUrl} alt={u.username} />
                    ) : (
                      <span>{u.username?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="search-user-info">
                    <span className="search-username">@{u.username}</span>
                    <span className="search-user-role">
                      {u.role || "student"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {searchResults &&
          searchResults.users?.length === 0 &&
          searchResults.projects?.length === 0 &&
          searchResults.jobs?.length === 0 &&
          searchResults.products?.length === 0 &&
          searchResults.streams?.length === 0 && (
            <div className="search-empty">No results found</div>
          )}
      </div>
    );
  };

  return (
    <>
      <header className={`top-nav role-${role}`}>
        <div className="brand-lockup">
          <div className="brand-cube">
            <svg viewBox="0 0 48 48" className="brand-hex-logo">
              <polygon
                points="24,3 43,14 43,34 24,45 5,34 5,14"
                fill="none"
                stroke="url(#sidebarBrandGrad)"
                strokeWidth="2.6"
              />
              <path
                d="M16 32V16l16 16V16"
                fill="none"
                stroke="url(#sidebarBrandGrad)"
                strokeWidth="3.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient
                  id="sidebarBrandGrad"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div>
            <div className="brand-title">
              DEVSTREAM
              <br />
              NEXUS
            </div>
          </div>
        </div>

        {!isCompactNav && (
          <div className="top-search-wrap" ref={searchRef}>
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              width="16"
              height="16"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M20 20l-3.2-3.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>

            <input
              type="text"
              className="top-search-input"
              placeholder="Search projects, people, jobs..."
              value={searchValue}
              onChange={handleSearch}
            />
            {searchOpen && renderSearchResults()}

            <kbd className="search-kbd">Ctrl K</kbd>
          </div>
        )}

        <div className="top-actions">
          {isCompactNav && (
            <button
              className="icon-btn mobile-search-btn"
              onClick={() => setSearchOpen((v) => !v)}
              title="Search"
              aria-label="Open search"
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <circle
                  cx="11"
                  cy="11"
                  r="6.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M16 16l4.5 4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
          <button
            className="icon-btn"
            onClick={handleBellClick}
            title="Notifications"
          >
            <svg viewBox="0 0 24 24" width="19" height="19">
              <path
                d="M6 16V11a6 6 0 1112 0v5l1.6 2.4H4.4L6 16z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9.5 20.5a2.5 2.5 0 005 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>

            {notificationCount > 0 && (
              <span className="icon-badge notice-badge">
                {notificationCount}
              </span>
            )}
          </button>

          {!isTabletNav && (
            <button
              className="icon-btn"
              onClick={() => navigate("/messages")}
              title="Messages"
            >
              <svg viewBox="0 0 24 24" width="19" height="19">
                <path
                  d="M4 5.5h16v10H9.5L5 19v-3.5H4v-10z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {messageCount > 0 && (
                <span className="icon-badge message-badge">{messageCount}</span>
              )}
            </button>
          )}

          {!isCompactNav && (
            <div className="avatar-menu-wrap" ref={menuRef}>
              <button
                className="avatar-trigger"
                onClick={() => setMenuOpen((v) => !v)}
                title="Account"
              >
                <div className="avatar-orb">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="avatar-orb-image"
                    />
                  ) : (
                    <span>{displayName.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                <svg
                  className={`chevron ${menuOpen ? "chevron-up" : ""}`}
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {menuOpen && (
                <div className="account-popover">
                  <div className="account-popover-header">
                    <div className="avatar-orb avatar-orb-sm">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="avatar-orb-image"
                        />
                      ) : (
                        <span>{displayName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>

                    <div>
                      <div className="account-name">{displayName}</div>

                      <div className="account-role">{meta.label}</div>
                    </div>
                  </div>

                  <button
                    className="account-popover-item"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/profile");
                    }}
                  >
                    Settings
                  </button>

                  <button
                    className="account-popover-item logout-item"
                    onClick={handleLogoutClick}
                  >
                    <svg viewBox="0 0 24 24" width="15" height="15">
                      <path
                        d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isCompactNav && searchOpen && (
          <div className="mobile-search-sheet" ref={searchRef}>
            <div className="mobile-search-panel">
              <div className="mobile-search-header">
                <span>Search</span>
                <button
                  type="button"
                  className="mobile-search-close"
                  onClick={() => setSearchOpen(false)}
                >
                  ×
                </button>
              </div>

              <div className="mobile-search-field">
                <svg
                  className="search-icon"
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M20 20l-3.2-3.2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  type="text"
                  value={searchValue}
                  onChange={handleSearch}
                  autoFocus
                  placeholder="Search projects, people, jobs..."
                />
              </div>

              {searchOpen && renderSearchResults(true)}
            </div>
          </div>
        )}

        {noticeOpen && (
          <div className="notice-popover">
            <span className="eyebrow">LIVE SIGNALS</span>

            {recentNotifications.length === 0 ? (
              <div className="notice-empty">No recent notifications</div>
            ) : (
              recentNotifications.map((item) => {
                const destination = getNotificationDestination(item);
                const displayName = getNotificationDisplayName(item);

                return (
                  <button
                    key={item._id}
                    className={`notice-item ${item.isRead ? "is-read" : ""}`}
                    onClick={() => handleNotificationClick(item, destination)}
                  >
                    <div className="notice-copy">
                      <span className="notice-title">{displayName}</span>
                      <small>{item.message || "New update"}</small>
                    </div>
                    <small className="notice-time">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : "Now"}
                    </small>
                  </button>
                );
              })
            )}

            <button
              className="notice-center-link"
              onClick={() => {
                setNoticeOpen(false);
                navigate("/notifications");
              }}
            >
              <span>View all</span>
              <small>{notificationCount} unread</small>
            </button>
          </div>
        )}
      </header>

      {showLogoutModal && (
        <div
          className="topnav-logout-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(2, 3, 10, 0.75)",
            backdropFilter: "blur(6px)",
          }}
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="topnav-logout-modal"
            style={{
              position: "relative",
              width: "min(440px, calc(100vw - 24px))",
              maxWidth: "440px",
              background: "rgba(13, 17, 34, 0.98)",
              border: "1px solid rgba(140, 160, 220, 0.15)",
              borderRadius: 20,
              padding: "40px 36px 32px",
              textAlign: "center",
              boxShadow:
                "0 0 0 1px rgba(248, 113, 113, 0.08), 0 40px 80px -20px rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(18px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="topnav-logout-modal-icon">🚪</div>
            <h2 className="topnav-logout-modal-title">Logout</h2>
            <p className="topnav-logout-modal-body">
              Are you sure you want to logout? You'll need to sign in again to
              access your account.
            </p>
            <div className="topnav-logout-modal-actions">
              <button
                className="topnav-logout-btn-ghost"
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
              >
                Cancel
              </button>
              <button
                className="topnav-logout-btn-danger"
                onClick={handleConfirmLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
