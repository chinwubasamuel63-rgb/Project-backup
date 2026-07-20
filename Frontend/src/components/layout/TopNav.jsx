import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { globalSearch } from "../../services/searchService";
import { ROLE_META } from "../../data/roleMeta";
import { useAuth } from "../../hooks/useAuth";

import {
  getUnreadNotificationCount,
  getMyConversations,
} from "../../services/topNavService";

import "./top-nav.css";

export default function TopNav({ role, onLogout }) {
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  const menuRef = useRef(null);
  const searchRef = useRef(null);

  const navigate = useNavigate();

  const { user } = useAuth();

  const meta = ROLE_META[role] || ROLE_META.student;

  const displayName = user?.username || "User";

  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const handleLogoutClick = async () => {
    await onLogout();
    navigate("/login");
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

    loadTopNavData();
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

  return (
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
              <linearGradient id="sidebarBrandGrad" x1="0" y1="0" x2="1" y2="1">
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

      <div className="top-search-wrap" ref={searchRef}>
        <svg className="search-icon" viewBox="0 0 24 24" width="16" height="16">
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
        {searchOpen && searchResults && (
          <div className="search-dropdown">
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
                <button key={job._id} className="search-item">
                  {job.title}
                </button>
              ))}
            </div>

            {searchResults.users?.length > 0 && (
              <div className="search-section">
                <div className="search-heading">Users</div>

                {searchResults.users.map((user) => (
                  <button key={user._id} className="search-item">
                    <span>{user.username}</span>
                  </button>
                ))}
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
        )}

        <kbd className="search-kbd">Ctrl K</kbd>
      </div>

      <div className="top-actions">
        <button
          className="icon-btn"
          onClick={() => setNoticeOpen(!noticeOpen)}
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
            <span className="icon-badge notice-badge">{notificationCount}</span>
          )}
        </button>

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

        <div className="avatar-menu-wrap" ref={menuRef}>
          <button
            className="avatar-trigger"
            onClick={() => setMenuOpen((v) => !v)}
            title="Account"
          >
            <div className="avatar-orb">
              {displayName.charAt(0).toUpperCase()}
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
                  {displayName.charAt(0).toUpperCase()}
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
                onClick={() => {
                  setMenuOpen(false);
                  handleLogoutClick();
                }}
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
      </div>

      {noticeOpen && (
        <div className="notice-popover">
          <span className="eyebrow">LIVE SIGNALS</span>

          <button onClick={() => navigate("/notifications")}>
            Notification center
            <small>{notificationCount} unread</small>
          </button>
        </div>
      )}
    </header>
  );
}
