// File path: src/components/dashboard/Dashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../../data/colors";
import { SupportInstructor } from "../support/Support";
import { getProducts } from "../../services/productService";
import { getJobs } from "../../services/jobService";
import { joinStream } from "../../services/streamService";
import {
  acceptPartnershipRequest,
  rejectPartnershipRequest,
} from "../../services/partnershipService";
import {
  getMyProjects,
  getMyPartnershipRequests,
  getMyConversations,
  getNotifications,
  getMyTickets,
  getStreams,
} from "../../services/dashboardService";
import "./dashboard.css";

/* ===========================================================
   Small shared bits
   =========================================================== */

const STAT_ICONS = {
  folder: (
    <path
      d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  partner: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="8.5" r="2.6" />
      <path d="M3.5 18c.6-2.8 2.7-4.4 5.5-4.4s4.9 1.6 5.5 4.4" />
      <circle cx="16.5" cy="9" r="2.1" />
      <path d="M15 13.8c2.2.2 3.8 1.6 4.3 4" />
    </g>
  ),
  chat: (
    <path
      d="M4 5.5h16v10H9.5L5 19v-3.5H4v-10z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  bell: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 16V11a6 6 0 1112 0v5l1.6 2.4H4.4L6 16z" />
      <path d="M9.5 20.5a2.5 2.5 0 005 0" />
    </g>
  ),
  ticket: (
    <path
      d="M4 8a2 2 0 012-2h12a2 2 0 012 2v1a2 2 0 000 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2v-1a2 2 0 000-4V8z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  team: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="2.6" />
      <circle cx="16" cy="8" r="2.6" />
      <path d="M2.5 19c.5-3 2.6-4.8 5.5-4.8s5 1.8 5.5 4.8" />
      <path d="M10.5 19c.5-3 2.6-4.8 5.5-4.8s5 1.8 5.5 4.8" />
    </g>
  ),
  wifi: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <path d="M8.5 13.2a5 5 0 017 0" />
      <path d="M5.8 10.4a9 9 0 0112.4 0" />
    </g>
  ),
  dots: (
    <circle
      cx="12"
      cy="12"
      r="9"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  ),
  video: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2.5" y="6.5" width="14" height="11" rx="2" />
      <path d="M16.5 10l5-3v10l-5-3" />
    </g>
  ),
  settings: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a7.97 7.97 0 000-2l2-1.5-2-3.4-2.3.6a8 8 0 00-1.7-1l-.4-2.4H9.9l-.4 2.4a8 8 0 00-1.7 1l-2.3-.6-2 3.4L5.5 11a7.97 7.97 0 000 2l-2 1.5 2 3.4 2.3-.6a8 8 0 001.7 1l.4 2.4h4.1l.4-2.4a8 8 0 001.7-1l2.3.6 2-3.4-2-1.5z" />
    </g>
  ),
  more: (
    <g fill="currentColor" stroke="none">
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </g>
  ),
  arrow: (
    <path
      d="M5 12h14M13 6l6 6-6 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  star: (
    <path
      d="M12 2.5l3.2 6.5 7.1.9-5.2 5 1.4 7-6.5-3.5-6.5 3.5 1.4-7-5.2-5 7.1-.9z"
      fill="currentColor"
      stroke="none"
    />
  ),
  eye: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 12S5.7 6 12 6s9.5 6 9.5 6-3.2 6-9.5 6-9.5-6-9.5-6z" />
      <circle cx="12" cy="12" r="2.6" />
    </g>
  ),
};

function Icon({ name, size = 18, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={style}
      aria-hidden="true"
    >
      {STAT_ICONS[name]}
    </svg>
  );
}

function Sparkline({ data, color }) {
  const w = 70,
    h = 24;
  if (!data || data.length < 2) return null;
  const max = Math.max(...data),
    min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  });
  const path = `M${pts.join(" L")}`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={h}
      preserveAspectRatio="none"
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Avatar({ name, size = 26 }) {
  if (!name) return null;
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  return (
    <div
      className="mini-avatar"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}

function ProjectArt({ variant }) {
  const variants = {
    nexus: (
      <>
        <defs>
          <linearGradient id="art-nexus" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <rect width="100" height="64" fill="#0c0f22" />
        <polygon
          points="50,16 76,29 76,49 50,62 24,49 24,29"
          fill="none"
          stroke="url(#art-nexus)"
          strokeWidth="2.4"
          className="art-shape-pulse"
        />
        <path
          d="M40 44V24l20 24V24"
          fill="none"
          stroke="url(#art-nexus)"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
    ai: (
      <>
        <defs>
          <linearGradient id="art-ai" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <rect width="100" height="64" fill="#0c1422" />
        <circle
          cx="50"
          cy="32"
          r="14"
          fill="none"
          stroke="url(#art-ai)"
          strokeWidth="2"
          className="art-shape-pulse"
        />
        <circle cx="50" cy="32" r="3" fill="url(#art-ai)" />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <line
            key={deg}
            x1="50"
            y1="32"
            x2={50 + 22 * Math.cos((deg * Math.PI) / 180)}
            y2={32 + 22 * Math.sin((deg * Math.PI) / 180)}
            stroke="url(#art-ai)"
            strokeWidth="1"
            opacity="0.6"
          />
        ))}
      </>
    ),
    mobile: (
      <>
        <defs>
          <linearGradient id="art-mobile" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <rect width="100" height="64" fill="#10122a" />
        <rect
          x="38"
          y="12"
          width="24"
          height="40"
          rx="4"
          fill="none"
          stroke="url(#art-mobile)"
          strokeWidth="2"
          className="art-shape-pulse"
        />
        <line
          x1="42"
          y1="22"
          x2="58"
          y2="22"
          stroke="url(#art-mobile)"
          strokeWidth="1.4"
          opacity="0.7"
        />
        <line
          x1="42"
          y1="28"
          x2="58"
          y2="28"
          stroke="url(#art-mobile)"
          strokeWidth="1.4"
          opacity="0.5"
        />
        <line
          x1="42"
          y1="34"
          x2="52"
          y2="34"
          stroke="url(#art-mobile)"
          strokeWidth="1.4"
          opacity="0.5"
        />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 100 64"
      className="project-art"
      preserveAspectRatio="xMidYMid slice"
    >
      {variants[variant] || variants.nexus}
    </svg>
  );
}

function StreamArt({ variant }) {
  return (
    <svg
      viewBox="0 0 100 64"
      className="project-art"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id={`stream-${variant}`} cx="50%" cy="50%" r="60%">
          <stop
            offset="0%"
            stopColor={variant === "orb" ? "#eafff5" : "#bdf5ff"}
            stopOpacity="0.95"
          />
          <stop
            offset="40%"
            stopColor={variant === "orb" ? "#a855f7" : "#34d399"}
            stopOpacity="0.7"
          />
          <stop offset="100%" stopColor="#0c0f22" stopOpacity="0.1" />
        </radialGradient>
      </defs>
      <rect width="100" height="64" fill="#0a0d1f" />
      <ellipse
        cx="50"
        cy="32"
        rx="40"
        ry="9"
        fill="none"
        stroke={variant === "orb" ? "#c084fc" : "#5ad6ff"}
        strokeWidth="1"
        opacity="0.45"
        className="art-ring-spin"
      />
      <circle
        cx="50"
        cy="32"
        r="16"
        fill={`url(#stream-${variant})`}
        className="art-shape-pulse"
      />
    </svg>
  );
}

// ===========================================================
// InstructorDashboard — Live Production Version
// ===========================================================
export function InstructorDashboard({ setView, notify }) {
  const [projects, setProjects] = useState([]);
  const [streams, setStreams] = useState([]);
  const [partnerships, setPartnerships] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [products, setProducts] = useState([]);
  const [tickets, setTickets] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const [
          resProjects,
          resPartnerships,
          resConversations,
          resNotifications,
          resTickets,
          resStreams,
          resJobs,
          resProducts,
        ] = await Promise.all([
          getMyProjects(),
          getMyPartnershipRequests(),
          getMyConversations(),
          getNotifications(),
          getMyTickets(),
          getStreams(),
          getJobs(),
          getProducts(),
        ]);

        if (isMounted) {
          // Defensive check: extract array if wrapped in an object (e.g., resProjects.data)
          const extractArray = (res) => {
            if (!res) return [];
            if (Array.isArray(res)) return res;
            if (res.data && Array.isArray(res.data)) return res.data;
            if (res.projects && Array.isArray(res.projects))
              return res.projects;
            return [];
          };

          setProjects(extractArray(resProjects));
          setPartnerships(extractArray(resPartnerships));
          setConversations(extractArray(resConversations));
          setNotifications(extractArray(resNotifications));
          setStreams(extractArray(resStreams));
          setJobs(extractArray(resJobs));
          setProducts(extractArray(resProducts));

          // Handle tickets object separately
          setTickets(
            resTickets?.data ||
              resTickets || { open: 0, awaiting: 0, resolved: 0 },
          );

          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load live dashboard ecosystem.");
          setLoading(false);
        }
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAcceptPartnership = async (id, requesterName) => {
    try {
      await acceptPartnershipRequest(id);
      setPartnerships((prev) => prev.filter((x) => x.id !== id));
      if (notify) notify(`Accepted ${requesterName}'s partnership request.`);
    } catch (err) {
      if (notify) notify(`Error accepting partnership: ${err.message}`);
    }
  };

  const handleRejectPartnership = async (id, requesterName) => {
    try {
      await rejectPartnershipRequest(id);
      setPartnerships((prev) => prev.filter((x) => x.id !== id));
      if (notify) notify(`Rejected ${requesterName}'s partnership request.`);
    } catch (err) {
      if (notify) notify(`Error rejecting partnership: ${err.message}`);
    }
  };

  const handleJoinStream = async (streamId) => {
    try {
      await joinStream(streamId);
      if (setView) setView("live");
    } catch (err) {
      if (notify) notify(`Could not join stream: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="page-wrap projects-page-v2">
        <div className="glass-card">Loading Dashboard</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-stage error-stage">
        <div className="error-box glass-card">
          <h4>Ecosystem Sync Failure</h4>
          <p>{error}</p>
          <button
            className="btn-go-live"
            onClick={() => window.location.reload()}
          >
            Retry Core Connection
          </button>
        </div>
      </div>
    );
  }

  // Derived aggregates matching the exact shape of your visual metrics cards
  const activeStats = [
    {
      label: "Total Projects",
      value: projects.length,
      sub: "Managed services",
      icon: "folder",
      color: COLORS.purple || "#a855f7",
      data: [0, 2, projects.length],
    },
    {
      label: "Partnerships",
      value: partnerships.length,
      sub: "Pending responses",
      icon: "partner",
      color: COLORS.blue || "#38bdf8",
      data: [0, 4, partnerships.length],
    },
    {
      label: "Conversations",
      value: conversations.length,
      sub: "Active channels",
      icon: "chat",
      color: COLORS.green || "#34d399",
      data: [0, 1, conversations.length],
    },
    {
      label: "Alerts",
      value: notifications.length,
      sub: "Unread alerts",
      icon: "bell",
      color: COLORS.orange || "#f97316",
      data: [0, 3, notifications.length],
    },
  ];

  return (
    <div className="dashboard-stage instructor-home-v2">
      <div className="page-wrap instructor-page-wrap">
        {/* ---- Live Production Stats Row ---- */}
        <section className="stat-row-v2">
          {activeStats.map((s) => (
            <div
              className="glass-card stat-card-v2"
              key={s.label}
              style={{ "--accent": s.color }}
            >
              <div className="stat-card-v2-top">
                <div
                  className="stat-icon-orb"
                  style={{ background: `${s.color}22`, color: s.color }}
                >
                  <Icon name={s.icon} size={20} />
                </div>
                <div>
                  <div className="stat-card-v2-value">{s.value}</div>
                  <div className="stat-card-v2-label">{s.label}</div>
                </div>
              </div>
              <div className="stat-card-v2-bottom">
                <span className="stat-card-v2-sub">{s.sub}</span>
                <Sparkline data={s.data} color={s.color} />
              </div>
            </div>
          ))}
        </section>

        {/* ---- My Projects + Live Streams ---- */}
        <section className="two-col-row">
          <div className="glass-card panel-block">
            <div className="panel-header">
              <h3>My Projects</h3>
              <button
                className="view-all-link"
                onClick={() => setView && setView("marketplace")}
              >
                View All
              </button>
            </div>
            <div className="manage-row-list">
              {projects.slice(0, 3).map((p) => (
                <div className="manage-row" key={p.id || p._id}>
                  <ProjectArt variant={p.art || "nexus"} />
                  <div className="manage-row-body">
                    <div className="manage-row-title">{p.name}</div>
                    <div className="manage-row-desc">
                      {p.desc || p.description}
                    </div>
                    <div className="avatar-stack">
                      {Array.from({
                        length: Math.min(
                          p.members?.length || p.members || 0,
                          3,
                        ),
                      }).map((_, i) => (
                        <Avatar key={i} name={p.name + i} size={20} />
                      ))}
                      {(p.members?.length || p.members || 0) > 3 && (
                        <span className="avatar-more">
                          +{(p.members?.length || p.members) - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="manage-row-stat">
                    <div className="manage-row-stat-value">
                      {p.members?.length || p.members || 0}
                    </div>
                    <div className="manage-row-stat-label">Members</div>
                  </div>
                  <div className="manage-row-stat">
                    <div className="manage-row-stat-value">{p.apps || 0}</div>
                    <div className="manage-row-stat-label">
                      Partnership Apps
                    </div>
                  </div>
                  <button
                    className="btn-manage"
                    onClick={() => setView && setView("marketplace")}
                  >
                    Manage
                  </button>
                  <button className="btn-row-more" title="More options">
                    <Icon name="more" size={16} />
                  </button>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="empty-row">
                  You haven't initialized any live projects yet.
                </div>
              )}
            </div>
          </div>

          <div className="glass-card panel-block">
            <div className="panel-header">
              <h3>Live Streams</h3>
              <div className="stream-toolbar">
                <button
                  className="btn-go-live"
                  onClick={() => setView && setView("live")}
                >
                  <Icon name="wifi" size={13} /> Go Live
                </button>
                <button
                  className="btn-stream-settings"
                  onClick={() => setView && setView("live")}
                >
                  <Icon name="settings" size={13} /> Stream Settings
                </button>
              </div>
            </div>
            <div className="stream-list">
              {streams.slice(0, 3).map((s) => (
                <div className="stream-row" key={s.id || s._id}>
                  <div className="stream-thumb-wrap">
                    <StreamArt variant={s.art || "orb"} />
                    <span className="live-chip">LIVE</span>
                  </div>
                  <div className="stream-row-body">
                    <div className="stream-title">{s.title}</div>
                    <div className="stream-desc">{s.desc || s.description}</div>
                    <div className="stream-host">
                      <Avatar name={s.host} size={18} /> {s.host}
                      <span className="stream-dot">•</span> {s.viewers || 0}{" "}
                      watching
                    </div>
                  </div>
                  <button
                    className="btn-manage-stream"
                    onClick={() => handleJoinStream(s.id || s._id)}
                  >
                    Join Stream
                  </button>
                  <button className="btn-row-more" title="More options">
                    <Icon name="more" size={16} />
                  </button>
                </div>
              ))}
              {streams.length === 0 && (
                <div className="empty-row">
                  No active streams on the network.
                </div>
              )}
            </div>
            <button
              className="btn-browse"
              onClick={() => setView && setView("live")}
            >
              View All Streams <Icon name="arrow" size={13} />
            </button>
          </div>
        </section>

        {/* ---- Partnerships / Messages / Hiring / Marketplace ---- */}
        <section className="four-col-row instructor-row-2">
          <div className="glass-card panel-block-sm">
            <div className="panel-header">
              <h3>Partnership Requests</h3>
              <button
                className="view-all-link"
                onClick={() => setView && setView("messages")}
              >
                View All
              </button>
            </div>
            <div className="list-rows-sm">
              {partnerships.slice(0, 2).map((p) => (
                <div className="partner-row-sm" key={p.id || p._id}>
                  <Avatar name={p.name} size={30} />
                  <div className="partner-row-sm-body">
                    <div className="partner-row-sm-name">{p.name}</div>
                    <div className="partner-row-sm-role">{p.role}</div>
                    <div className="partner-row-sm-meta">
                      <span>Requested Role: {p.role}</span>
                      <span>Project: {p.project}</span>
                    </div>
                    <div className="partner-row-sm-actions">
                      <button
                        className="btn-accept"
                        onClick={() =>
                          handleAcceptPartnership(p.id || p._id, p.name)
                        }
                      >
                        Accept
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() =>
                          handleRejectPartnership(p.id || p._id, p.name)
                        }
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {partnerships.length === 0 && (
                <div className="empty-row">No pending applications.</div>
              )}
            </div>
            <button
              className="btn-browse"
              onClick={() => setView && setView("messages")}
            >
              View All Requests <Icon name="arrow" size={13} />
            </button>
          </div>

          <div className="glass-card panel-block-sm">
            <div className="panel-header">
              <h3>Messages</h3>
              <button
                className="view-all-link"
                onClick={() => setView && setView("messages")}
              >
                View All
              </button>
            </div>
            <div className="list-rows-sm">
              {conversations.slice(0, 3).map((m) => (
                <button
                  className="message-row"
                  key={m.id || m._id}
                  onClick={() => setView && setView("messages")}
                  style={{
                    background: "none",
                    border: "none",
                    width: "100%",
                    textAlign: "left",
                  }}
                >
                  <Avatar name={m.name || m.participant} size={30} />
                  <div className="message-row-body">
                    <div className="message-name">
                      {m.name || m.participant}
                    </div>
                    <div className="message-text">
                      {m.text || m.lastMessage}
                    </div>
                  </div>
                  <div className="message-meta">
                    <span className="message-time">{m.time || "Recent"}</span>
                    {(m.unread || 0) > 0 && (
                      <span className="message-unread">{m.unread}</span>
                    )}
                  </div>
                </button>
              ))}
              {conversations.length === 0 && (
                <div className="empty-row">No active direct conversations.</div>
              )}
            </div>
            <button
              className="btn-browse"
              onClick={() => setView && setView("messages")}
            >
              Go to Messages <Icon name="arrow" size={13} />
            </button>
          </div>

          <div className="glass-card panel-block-sm">
            <div className="panel-header">
              <h3>Hiring Overview</h3>
              <button
                className="view-all-link"
                onClick={() => setView && setView("marketplace")}
              >
                View All
              </button>
            </div>
            <div className="overview-mini-grid">
              <div className="overview-mini-stat">
                <div className="overview-mini-value">{jobs.length}</div>
                <div className="overview-mini-label">Jobs Posted</div>
                <div className="overview-mini-sub">Active Openings</div>
              </div>
              <div className="overview-mini-stat">
                <div className="overview-mini-value">
                  {jobs.reduce(
                    (acc, curr) => acc + (curr.applications || 0),
                    0,
                  )}
                </div>
                <div className="overview-mini-label">Applications</div>
                <div className="overview-mini-sub">Total Received</div>
              </div>
            </div>
            <div className="overview-section-label">Recent Job Posts</div>
            <div className="list-rows-sm">
              {jobs.slice(0, 2).map((j) => (
                <div className="job-row" key={j.id || j._id}>
                  <div className="job-row-body">
                    <div className="job-title">{j.title}</div>
                    <div className="job-company">{j.type || j.department}</div>
                  </div>
                  <span className="job-app-count">
                    {j.applications || 0} Apps
                  </span>
                </div>
              ))}
              {jobs.length === 0 && (
                <div className="empty-row">No jobs listed on the platform.</div>
              )}
            </div>
            <button
              className="btn-browse"
              onClick={() => setView && setView("marketplace")}
            >
              Manage Jobs <Icon name="arrow" size={13} />
            </button>
          </div>

          <div className="glass-card panel-block-sm">
            <div className="panel-header">
              <h3>Marketplace</h3>
              <button
                className="view-all-link"
                onClick={() => setView && setView("marketplace")}
              >
                View All
              </button>
            </div>
            <div className="overview-mini-grid">
              <div className="overview-mini-stat">
                <div className="overview-mini-value">{products.length}</div>
                <div className="overview-mini-label">Services Listed</div>
                <div className="overview-mini-sub">Active Items</div>
              </div>
              <div className="overview-mini-stat">
                <div className="overview-mini-value">
                  {products.reduce(
                    (acc, curr) => acc + (curr.inquiries || 0),
                    0,
                  )}
                </div>
                <div className="overview-mini-label">Total Inquiries</div>
                <div className="overview-mini-sub">This Month</div>
              </div>
            </div>
            <div className="overview-section-label">Recent Services</div>
            <div className="list-rows-sm">
              {products.slice(0, 2).map((s) => (
                <div className="service-row" key={s.id || s._id}>
                  <div className="service-icon">
                    <Icon name="folder" size={14} />
                  </div>
                  <div className="job-row-body">
                    <div className="job-title">{s.title || s.name}</div>
                  </div>
                  <div className="service-meta">
                    <span className="service-price">${s.price || 0}</span>
                    <span className="service-inquiries">
                      {s.inquiries || 0} Inquiries
                    </span>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="empty-row">Marketplace offers are empty.</div>
              )}
            </div>
            <button
              className="btn-browse"
              onClick={() => setView && setView("marketplace")}
            >
              Manage Services <Icon name="arrow" size={13} />
            </button>
          </div>
        </section>

        {/* ---- Support Tickets + Notifications ---- */}
        <section className="two-col-row">
          <div className="glass-card panel-block-sm">
            <div className="panel-header">
              <h3>Support Tickets</h3>
              <button
                className="view-all-link"
                onClick={() => setView && setView("support-instructor")}
              >
                View All
              </button>
            </div>
            <div className="ticket-stat-row">
              <div className="ticket-stat ticket-stat-open">
                <div className="ticket-stat-icon">
                  <Icon name="ticket" size={16} />
                </div>
                <div className="ticket-stat-value">{tickets?.open || 0}</div>
                <div className="ticket-stat-label">Open Tickets</div>
                <div className="ticket-stat-sub">Need attention</div>
              </div>
              <div className="ticket-stat ticket-stat-awaiting">
                <div className="ticket-stat-icon">
                  <Icon name="bell" size={16} />
                </div>
                <div className="ticket-stat-value">
                  {tickets?.awaiting || 0}
                </div>
                <div className="ticket-stat-label">Awaiting Response</div>
                <div className="ticket-stat-sub">From support team</div>
              </div>
              <div className="ticket-stat ticket-stat-resolved">
                <div className="ticket-stat-icon">
                  <Icon name="folder" size={16} />
                </div>
                <div className="ticket-stat-value">
                  {tickets?.resolved || 0}
                </div>
                <div className="ticket-stat-label">Resolved</div>
                <div className="ticket-stat-sub">All good!</div>
              </div>
            </div>
            <button
              className="btn-browse"
              onClick={() => setView && setView("support-instructor")}
            >
              Go to Support <Icon name="arrow" size={13} />
            </button>
          </div>

          <div className="glass-card panel-block-sm">
            <div className="panel-header">
              <h3>Notifications</h3>
              <button
                className="view-all-link"
                onClick={() => setView && setView("messages")}
              >
                View All
              </button>
            </div>
            <div className="notif-grid-2col">
              {notifications.slice(0, 4).map((n) => (
                <div className="notif-row" key={n.id || n._id}>
                  <div className="notif-icon">
                    <Icon name={n.icon || "bell"} size={14} />
                  </div>
                  <div className="notif-row-body">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-sub">{n.sub || n.message}</div>
                  </div>
                  <div className="notif-time">{n.time || "Just Now"}</div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="empty-row">No new unread system events.</div>
              )}
            </div>
            <button
              className="btn-browse"
              onClick={() => setView && setView("messages")}
            >
              View All Notifications <Icon name="arrow" size={13} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
