import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
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

const getStreamThumbnailUrl = (stream) => {
  const thumb = stream?.thumbnail;

  if (!thumb) return "";
  if (typeof thumb === "string") return thumb;

  return thumb.url || thumb.secure_url || thumb.src || "";
};

function Sparkline({ data, color }) {
  const w = 70,
    h = 24;
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

function Avatar({ name = "User", avatar, size = 26 }) {
  const avatarUrl = typeof avatar === "string" ? avatar : avatar?.url;

  const initials = String(name || "User")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="mini-avatar"
        style={{
          width: size,
          height: size,
        }}
      />
    );
  }

  return (
    <div
      className="mini-avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
      }}
    >
      {initials}
    </div>
  );
}

function getConversationDisplayName(conversation, currentUserId) {
  const conversationType = String(
    conversation?.conversationType || conversation?.type || "",
  ).toLowerCase();

  // For support conversations, show the ticket number from the name field
  if (conversationType === "support" && conversation?.name?.trim()) {
    return conversation.name;
  }

  const participants = Array.isArray(conversation?.participants)
    ? conversation.participants
    : [];

  const otherParticipants = participants.filter(
    (participant) =>
      String(participant?._id || participant?.id || participant) !==
      String(currentUserId),
  );

  const preferredName =
    otherParticipants.find((participant) => participant?.username?.trim()) ||
    otherParticipants.find((participant) => participant?.name?.trim()) ||
    (conversation?.name?.trim() && conversation.name !== "Conversation"
      ? conversation.name
      : null);

  if (typeof preferredName === "object") {
    return preferredName.username || preferredName.name || "User";
  }

  return preferredName || "User";
}

function hasConversationMessage(conversation) {
  return Boolean(
    conversation?.lastMessage?.content?.trim() ||
    conversation?.lastMessage?.attachments?.length,
  );
}

/* generated placeholder art for project / stream thumbnails */
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

/* ===========================================================
   StudentDashboard — full 3D-animated rebuild
   =========================================================== */

export function StudentDashboard({ setView, notify }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [partnerships, setPartnerships] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [marketplaceProducts, setMarketplaceProducts] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [streams, setStreams] = useState([]);

  const [loading, setLoading] = useState(true);

  const handleJoinStream = async (stream) => {
    try {
      await joinStream(stream._id || stream.id);

      if (stream.role === "host" || stream.role === "speaker") {
        navigate(`/streams/${stream._id || stream.id}/studio`);
      } else {
        navigate(`/streams/${stream._id || stream.id}/watch`);
      }
    } catch (err) {
      if (notify) {
        notify(`Could not join stream: ${err.message}`);
      }
    }
  };

  const canManagePartnership = (project) => {
    if (!user || !project) return false;

    const userId = user._id;

    return (
      project.owner?._id === userId ||
      project.coOwners?.some((owner) => owner._id === userId)
    );
  };

  const handleAccept = async (id) => {
    try {
      await acceptPartnershipRequest(id);

      setPartnerships((prev) => prev.filter((request) => request._id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectPartnershipRequest(id);

      setPartnerships((prev) => prev.filter((request) => request._id !== id));
    } catch (error) {
      console.error(error);
    }
  };
  const stats = [
    {
      label: "Projects",
      value: projects.length,
      color: "#34d399",
      icon: "folder",
      sub: "Your active projects",
      data: [0, Math.ceil(projects.length / 2), projects.length],
    },
    {
      label: "Requests",
      value: partnerships.length,
      color: "#a855f7",
      icon: "partner",
      sub: "Pending partnership requests",
      data: [0, Math.ceil(partnerships.length / 2), partnerships.length],
    },
    {
      label: "Messages",
      value: messages.length,
      color: "#60a5fa",
      icon: "chat",
      sub: "Active conversations",
      data: [0, Math.ceil(messages.length / 2), messages.length],
    },
    {
      label: "Notifications",
      value: notifications.filter((n) => !n.isRead).length,
      color: "#ef4444",
      icon: "bell",
      sub: "Unread notifications",
      data: [
        0,
        Math.ceil(
          notifications.filter((notification) => !notification.isRead).length /
            2,
        ),
        notifications.filter((notification) => !notification.isRead).length,
      ],
    },
  ];

  useEffect(() => {
    const syncNotifications = async () => {
      try {
        const notificationData = await getNotifications();
        const sortedNotifications = (notificationData.notifications || [])
          .slice()
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);

        setNotifications(sortedNotifications);
      } catch (error) {
        console.error("Student dashboard notification sync error:", error);
      }
    };

    const loadDashboard = async () => {
      try {
        const [
          projectsData,
          partnershipData,
          streamData,
          messageData,
          notificationData,
          ticketData,
          productData,
          jobsData,
        ] = await Promise.all([
          getMyProjects(),
          getMyPartnershipRequests(),
          getStreams(),
          getMyConversations(),
          getNotifications(),
          getMyTickets(),
          getProducts(),
          getJobs(),
        ]);

        const sortedNotifications = (notificationData.notifications || [])
          .slice()
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);

        setProjects(projectsData.projects || []);

        setPartnerships(partnershipData.requests || []);

        setMessages(
          (messageData.conversations || []).filter(hasConversationMessage),
        );

        setNotifications(sortedNotifications);

        setTickets(ticketData.tickets || []);

        setMarketplaceProducts(productData.products || []);

        setJobs(jobsData.jobs || []);

        setStreams(
          (streamData.streams || []).filter((stream) => {
            const status = String(stream?.status || "").toLowerCase();
            return status === "live" || status === "started";
          }),
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const handleNotificationsUpdated = () => {
      syncNotifications();
    };

    loadDashboard();
    window.addEventListener(
      "devstream:notifications-updated",
      handleNotificationsUpdated,
    );

    return () => {
      window.removeEventListener(
        "devstream:notifications-updated",
        handleNotificationsUpdated,
      );
    };
  }, []);

  if (loading) {
    return (
      <div className="page-wrap student-home-v2">
        <div className="glass-card">Loading Dashboard</div>
      </div>
    );
  }

  return (
    <div className="page-wrap student-home-v2">
      {/* ---- stat row ---- */}
      <section className="stat-row-v2">
        {stats.map((s) => (
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

      {/* ---- recent projects + live streams ---- */}
      <section className="two-col-row">
        <div className="glass-card panel-block">
          <div className="panel-header">
            <h3>My Projects</h3>
            <button
              className="view-all-link"
              onClick={() => navigate("/projects")}
            >
              View All
            </button>
          </div>
          <div className="manage-row-list">
            {projects.slice(0, 3).map((p) => (
              <div
                className="manage-row project-clickable"
                key={p.id || p._id}
                onClick={() => navigate(`/projects/${p._id || p.id}`)}
              >
                <div className="project-card-image">
                  {p.images?.[0]?.url ? (
                    <img
                      src={p.coverImage?.url}
                      alt={p.name}
                      className="project-cover-image"
                    />
                  ) : (
                    <ProjectArt variant="nexus" />
                  )}
                </div>
                <div className="manage-row-body">
                  <div className="manage-row-title">{p.name}</div>
                  <div className="manage-row-desc">
                    {p.tagline || p.description || "No description available"}
                  </div>
                  <div className="avatar-stack">
                    {p.members?.slice(0, 3).map((member) => (
                      <Avatar
                        key={member._id}
                        name={member.username}
                        size={20}
                      />
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
                  <div className="manage-row-stat-value">
                    {p.partnershipCount || 0}
                  </div>
                  <div className="manage-row-stat-label">
                    Partnership Application
                  </div>
                </div>
                <button
                  className="btn-manage"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/projects/${p._id || p.id}`);
                  }}
                >
                  Manage
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
            <button className="view-all-link" onClick={() => navigate("/live")}>
              View All
            </button>
          </div>
          <div className="stream-list">
            {streams.length === 0 ? (
              <div className="empty-row">No live streams currently.</div>
            ) : (
              streams.slice(0, 5).map((stream) => (
                <div className="stream-row" key={stream._id}>
                  <div className="stream-thumb-wrap">
                    {getStreamThumbnailUrl(stream) ? (
                      <img
                        src={getStreamThumbnailUrl(stream)}
                        alt={stream.title || "Stream thumbnail"}
                        className="stream-thumbnail-image"
                      />
                    ) : (
                      <StreamArt variant="default" />
                    )}
                    <span className="live-chip">LIVE</span>
                    <span className="viewer-chip">
                      <Icon name="eye" size={11} /> {stream.totalViewers || 0}
                    </span>
                  </div>
                  <div className="stream-row-body">
                    <div className="stream-title">{stream.title}</div>
                    <div className="stream-host">
                      <Avatar
                        name={stream.host?.username || "Host"}
                        avatar={stream.host?.avatar?.url}
                        size={18}
                      />
                      {stream.host?.username || "Unknown Host"}
                    </div>
                    <div className="stream-watching">
                      {stream.totalViewers || 0} watching
                    </div>
                  </div>
                  <button
                    className="btn-join-stream"
                    onClick={() => handleJoinStream(stream._id)}
                  >
                    Join Stream
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ---- partnership requests + messages ---- */}
      <section className="two-col-row">
        <div className="glass-card panel-block">
          <div className="panel-header">
            <h3>Partnership Requests</h3>
            <button
              className="view-all-link"
              onClick={() => navigate("/projects")}
            >
              View All
            </button>
          </div>
          <div className="list-rows">
            {partnerships.map((request) => (
              <div className="request-row" key={request._id}>
                <Avatar
                  name={request.applicant?.username}
                  avatar={request.applicant?.avatar?.url}
                  size={34}
                />
                <div className="request-row-body">
                  <div className="request-name">
                    {request.applicant?.username}
                  </div>
                  <div className="request-role">{request.status}</div>
                  <div className="request-project">
                    {request.project?.name || "No project specified"}
                  </div>
                </div>
                {canManagePartnership(request.project) && (
                  <div className="request-actions">
                    <button
                      className="btn-accept"
                      onClick={() => handleAccept(request._id)}
                    >
                      Accept
                    </button>

                    <button
                      className="btn-reject"
                      onClick={() => handleReject(request._id)}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
            {partnerships.length === 0 && (
              <div className="empty-row">No pending requests.</div>
            )}
          </div>
        </div>

        <div className="glass-card panel-block">
          <div className="panel-header">
            <h3>Messages</h3>
            <button
              className="view-all-link"
              onClick={() => navigate("/messages")}
            >
              View All
            </button>
          </div>
          <div className="list-rows">
            {messages.length === 0 && (
              <div className="empty-row">No messages yet.</div>
            )}
            {messages.length > 0 &&
              messages.slice(0, 5).map((conversation) => {
                const displayName = getConversationDisplayName(
                  conversation,
                  user?._id,
                );

                return (
                  <button
                    className="message-row"
                    key={conversation._id}
                    onClick={() => setView && setView("messages")}
                  >
                    <Avatar name={displayName} size={34} />
                    <div className="message-row-body">
                      <div className="message-name">{displayName}</div>
                      <div className="message-text">
                        {conversation.lastMessage?.content ||
                          "Shared attachment"}
                      </div>
                    </div>
                    <div className="message-meta">
                      <span className="message-time">
                        {conversation.updatedAt
                          ? new Date(
                              conversation.updatedAt,
                            ).toLocaleDateString()
                          : ""}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <span className="message-unread">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      </section>

      {/* ---- marketplace / hiring / tickets / notifications ---- */}
      <section className="four-col-row">
        <div className="glass-card panel-block-sm">
          <div className="panel-header">
            <h3>Marketplace</h3>
            <button className="view-all-link" onClick={() => navigate("/shop")}>
              View All
            </button>
          </div>
          <div className="list-rows-sm">
            {marketplaceProducts.slice(0, 4).map((product) => (
              <div className="market-row" key={product._id}>
                <div className="market-icon">
                  <Icon name="folder" size={15} />
                </div>
                <div className="market-row-body">
                  <div className="market-title">{product.title}</div>
                  <div className="market-by">by {product.category}</div>
                </div>
                <div className="market-rating">
                  <Icon name="star" size={11} />{" "}
                  {product.averageRating?.toFixed(1) || "0.0"}
                </div>
              </div>
            ))}
          </div>
          <button className="btn-browse" onClick={() => navigate("/shop")}>
            Browse Marketplace <Icon name="arrow" size={13} />
          </button>
        </div>

        <div className="glass-card panel-block-sm">
          <div className="panel-header">
            <h3>Hiring Opportunities</h3>
            <button className="view-all-link" onClick={() => navigate("/hire")}>
              View All
            </button>
          </div>
          <div className="list-rows-sm">
            {jobs.slice(0, 4).map((job) => (
              <div className="job-row" key={job._id}>
                <div className="job-icon">
                  <Icon name="partner" size={15} />
                </div>
                <div className="job-row-body">
                  <div className="job-title">{job.title}</div>
                  <div className="job-company">
                    {job.location || "DevStream Nexus"}
                  </div>
                </div>
                <span
                  className={`job-type ${
                    job.isRemote ? "job-type-remote" : "job-type-onsite"
                  }`}
                >
                  {job.roleType}
                </span>
              </div>
            ))}
          </div>
          <button className="btn-browse" onClick={() => navigate("/hire")}>
            Browse All Jobs <Icon name="arrow" size={13} />
          </button>
        </div>

        <div className="glass-card panel-block-sm">
          <div className="panel-header">
            <h3>Support Tickets</h3>
            <button
              className="view-all-link"
              onClick={() => navigate("/support")}
            >
              View All
            </button>
          </div>
          <div className="list-rows-sm">
            {tickets.slice(0, 5).map((ticket) => (
              <div className="ticket-row" key={ticket._id}>
                <div className="ticket-row-body">
                  <div className="ticket-title">
                    #{ticket.ticketNumber} {ticket.subject}
                  </div>
                  <div className="ticket-time">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span
                  className={`ticket-status ticket-status-${ticket.status}`}
                >
                  {ticket.status}
                </span>
              </div>
            ))}
          </div>
          <button className="btn-browse" onClick={() => navigate("/support")}>
            Create New Ticket <Icon name="arrow" size={13} />
          </button>
        </div>

        <div className="glass-card panel-block-sm">
          <div className="panel-header">
            <h3>Notifications</h3>
            <button
              className="view-all-link"
              onClick={() => navigate("/notifications")}
            >
              View All
            </button>
          </div>
          <div className="list-rows-sm">
            {notifications.slice(0, 5).map((notification) => {
              const isSupportNotification =
                notification.type === "support" ||
                notification.relatedEntityType === "SupportTicket";
              const supportRoute =
                isSupportNotification && notification.relatedEntity
                  ? `/support/${notification.relatedEntity}`
                  : null;

              return (
                <div className="notif-row" key={notification._id}>
                  <div className="notif-icon">
                    <Icon name="bell" size={14} />
                  </div>
                  <div className="notif-row-body">
                    <div className="notif-title">
                      {notification.title || "Notification"}
                    </div>
                    <div className="notif-sub">{notification.message}</div>
                    {supportRoute && (
                      <div className="notif-action-row">
                        <button
                          type="button"
                          className="notif-action-btn"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(supportRoute);
                          }}
                        >
                          Open Ticket
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="notif-time">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
          <button
            className="btn-browse"
            onClick={() => navigate("/notifications")}
          >
            View All Notifications
            <Icon name="arrow" size={13} />
          </button>
        </div>
      </section>
    </div>
  );
}
