import { useEffect, useRef, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext.js";
import {
  getMyProfile,
  getUserProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from "../../services/profileService";
import { createConversation } from "../../services/messageService";
import { getMyProducts } from "../../services/productService";
import { getProfileActivity } from "../../services/profileActivityService";
import { getMyJobs } from "../../services/jobService";
import { getMyStreams } from "../../services/streamService";
import { getMyProjects } from "../../services/projectService";
import "./profile.css";

function useTilt(ref, strength = 10) {
  const onMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${-y * strength}deg) rotateY(${
      x * strength
    }deg) translateZ(6px)`;
  };

  const onMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform =
      "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
  };

  return { onMouseMove, onMouseLeave };
}

function TiltCard({ className = "", children, strength, ...rest }) {
  const ref = useRef(null);
  const tilt = useTilt(ref, strength);
  return (
    <div
      ref={ref}
      className={`tilt-card ${className}`}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      {...rest}
    >
      {children}
    </div>
  );
}

export default function Profile({ notify }) {
  const { userId } = useParams();
  const { socket, logout: logoutUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("About");
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [streams, setStreams] = useState([]);
  const [streamsLoading, setStreamsLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  // Modal State for Followers / Following
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState("followers");
  const [followUsersList, setFollowUsersList] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Logout Confirmation Modal State
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setProfile(null);
        let currentUserId = null;

        try {
          const myData = await getMyProfile();
          currentUserId = myData.user?._id || myData.user?.id;
        } catch {
          // User might not be logged in or session expired
        }

        if (userId) {
          const data = await getUserProfile(userId);
          const targetUser = data.user || data;
          setProfile(targetUser);

          setIsOwner(currentUserId && userId === currentUserId);

          if (currentUserId && targetUser.followers) {
            const amFollowing = targetUser.followers.some(
              (f) => (f._id || f).toString() === currentUserId.toString(),
            );
            setIsFollowing(amFollowing);
          }
        } else {
          const data = await getMyProfile();
          setProfile(data.user);
          setIsOwner(true);
        }
      } catch (error) {
        console.error("Profile error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  // Real-time socket listener for online/offline toggling
  useEffect(() => {
    if (!socket || !profile?._id) return;

    const targetId = profile._id.toString();

    const handleUserOnline = (onlineUserId) => {
      if (onlineUserId && onlineUserId.toString() === targetId) {
        setProfile((prev) => (prev ? { ...prev, isOnline: true } : prev));
      }
    };

    const handleUserOffline = (offlineUserId) => {
      if (offlineUserId && offlineUserId.toString() === targetId) {
        setProfile((prev) =>
          prev ? { ...prev, isOnline: false, lastSeen: new Date() } : prev,
        );
      }
    };

    socket.on("userOnline", handleUserOnline);
    socket.on("userOffline", handleUserOffline);

    return () => {
      socket.off("userOnline", handleUserOnline);
      socket.off("userOffline", handleUserOffline);
    };
  }, [socket, profile?._id]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setProjectsLoading(true);
        const data = userId
          ? await getMyProjects(userId)
          : await getMyProjects();
        setProjects(data.projects || []);
      } catch (error) {
        console.error("Projects loading failed", error);
      } finally {
        setProjectsLoading(false);
      }
    };

    loadProjects();
  }, [userId]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProductsLoading(true);
        const data = userId
          ? await getMyProducts(userId)
          : await getMyProducts();
        setProducts(data.products || []);
      } catch (error) {
        console.error("Products error:", error);
      } finally {
        setProductsLoading(false);
      }
    };

    loadProducts();
  }, [userId]);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setActivityLoading(true);
        const data = await getProfileActivity();
        setActivity(data.activity || []);
      } catch (error) {
        console.error("Activity error:", error);
      } finally {
        setActivityLoading(false);
      }
    };

    loadActivity();
  }, [userId]);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setJobsLoading(true);
        const data = userId ? await getMyJobs(userId) : await getMyJobs();
        setJobs(data.jobs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setJobsLoading(false);
      }
    };

    loadJobs();
  }, [userId]);

  useEffect(() => {
    const loadStreams = async () => {
      try {
        setStreamsLoading(true);
        const data = userId ? await getMyStreams(userId) : await getMyStreams();
        setStreams(data.streams || []);
      } catch (err) {
        console.error("Streams error:", err);
      } finally {
        setStreamsLoading(false);
      }
    };

    loadStreams();
  }, [userId]);

  const displayStreams = [...streams]
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
    .slice(0, 5);

  const displayActivity = [...activity]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const cleanUrl = (url) => {
    if (!url) return "";
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  };

  const safeUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) {
      return url;
    }
    return `https://${url}`;
  };

  const capitalize = (text) => {
    if (!text) return "—";
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const getCoverImageUrl = () => {
    if (!profile?.coverImage) return "";
    if (typeof profile.coverImage === "string") return profile.coverImage;
    return profile.coverImage.url || profile.coverImage.secure_url || "";
  };

  const getAvatarUrl = () => {
    if (!profile?.avatar) return "";
    if (typeof profile.avatar === "string") return profile.avatar;
    return profile.avatar.url || profile.avatar.secure_url || "";
  };

  const coverUrl = getCoverImageUrl();
  const avatarUrl = getAvatarUrl();
  const isValidAvatarUrl =
    avatarUrl &&
    (avatarUrl.startsWith("http") ||
      avatarUrl.startsWith("/") ||
      avatarUrl.startsWith("blob"));

  const handleStartConversation = async () => {
    if (!profile?._id || startingChat) return;

    try {
      setStartingChat(true);
      const response = await createConversation(profile._id);
      const conversationId =
        response?.conversation?._id || response?.conversation?.id;

      if (conversationId) {
        notify?.("Conversation started.");
        navigate(`/messages?conversationId=${conversationId}`, {
          state: { createdConversation: response.conversation },
        });
        return;
      }

      notify?.("Could not start a conversation right now.");
    } catch (error) {
      console.error("Could not start conversation:", error);
      notify?.(
        error?.response?.data?.message || "Could not start a conversation.",
      );
    } finally {
      setStartingChat(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!userId || followLoading) return;
    try {
      setFollowLoading(true);

      if (isFollowing) {
        await unfollowUser(userId);
        notify?.("User unfollowed.");
      } else {
        await followUser(userId);
        notify?.("User followed.");
      }

      setIsFollowing((prev) => {
        const nextState = !prev;
        setProfile((currProfile) => {
          if (!currProfile) return currProfile;
          const currentFollowers = currProfile.followers || [];
          return {
            ...currProfile,
            followers: nextState
              ? [...currentFollowers, userId]
              : currentFollowers.filter((f) => (f._id || f) !== userId),
          };
        });
        return nextState;
      });
    } catch (error) {
      console.error("Failed to follow/unfollow user:", error);
      notify?.(
        error?.response?.data?.message || "Could not update follow status.",
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    try {
      setLoggingOut(true);
      await logoutUser();
      notify?.("Logged out successfully.");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      notify?.("Logout failed. Please try again.");
      setLoggingOut(false);
    }
  };

  const fetchFollowList = async (type) => {
    try {
      setModalLoading(true);
      const targetId = userId || profile?._id;
      if (!targetId) return;

      const data =
        type === "followers"
          ? await getFollowers(targetId)
          : await getFollowing(targetId);

      setFollowUsersList(
        type === "followers" ? data.followers : data.following,
      );
    } catch (error) {
      console.error(`Failed to fetch ${type}:`, error);
    } finally {
      setModalLoading(false);
    }
  };

  const openFollowersModal = () => {
    setModalTab("followers");
    setModalOpen(true);
    fetchFollowList("followers");
  };

  const openFollowingModal = () => {
    setModalTab("following");
    setModalOpen(true);
    fetchFollowList("following");
  };

  if (loading) {
    return (
      <div className="page-wrap">
        <div className="glass-card">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-wrap">
        <div className="glass-card">Profile not found.</div>
      </div>
    );
  }

  const tabs = ["About", "Projects", "Marketplace", "Jobs", "Activity"];

  return (
    <div className="profile-page">
      {/* HERO */}
      <section className="profile-hero glass-card">
        {coverUrl ? (
          <div className="cover-image">
            <img src={coverUrl} alt="cover" />
          </div>
        ) : (
          <div className="hero-scene" aria-hidden="true">
            <div className="polyhedron">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        <div className="profile-hero-top">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar">
              {isValidAvatarUrl ? (
                <img src={avatarUrl} alt="avatar" />
              ) : (
                profile.username?.charAt(0).toUpperCase()
              )}
            </div>
            {/* Dynamically toggle or style the online dot based on profile.isOnline */}
            <span
              className={`online-dot ${profile.isOnline ? "active" : "offline"}`}
              title={profile.isOnline ? "Online" : "Offline"}
            />
          </div>

          <div className="profile-info">
            <h1>{profile.displayName || profile.username}</h1>
            <p className="username">@{profile.username}</p>
            {profile.isVerified === false && (
              <span className="profile-verification-warning">
                Email not verified
              </span>
            )}
            {profile.primaryTrack && (
              <span className="track-badge">{profile.primaryTrack}</span>
            )}

            <div className="hero-meta">
              {profile.location && <span>📍 {profile.location}</span>}
              {profile.createdAt && (
                <span>
                  🗓 Joined{" "}
                  {new Date(profile.createdAt).toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>

            <div className="socials">
              {profile.githubUrl && (
                <a href={profile.githubUrl} target="_blank" rel="noreferrer">
                  GitHub
                </a>
              )}
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">
                  LinkedIn
                </a>
              )}
              {profile.portfolioUrl && (
                <a href={profile.portfolioUrl} target="_blank" rel="noreferrer">
                  Portfolio
                </a>
              )}
            </div>
          </div>

          <div className="profile-actions">
            {!isOwner && (
              <>
                <button
                  className="btn-follow"
                  onClick={handleStartConversation}
                  disabled={startingChat}
                >
                  {startingChat ? "Starting..." : "Message"}
                </button>
                <button
                  className="btn-follow"
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                >
                  {followLoading
                    ? "Loading..."
                    : isFollowing
                      ? "Unfollow"
                      : "Follow"}
                </button>
              </>
            )}

            {isOwner && (
              <button
                className="btn-primary profile-edit"
                onClick={() => navigate("/profile/edit")}
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="profile-stats">
        <TiltCard
          className="glass-card stat clickable-stat"
          strength={8}
          onClick={openFollowersModal}
        >
          <h3>{profile.followers?.length || 0}</h3>
          <span>Followers</span>
        </TiltCard>

        <TiltCard
          className="glass-card stat clickable-stat"
          strength={8}
          onClick={openFollowingModal}
        >
          <h3>{profile.following?.length || 0}</h3>
          <span>Following</span>
        </TiltCard>

        <TiltCard className="glass-card stat" strength={8}>
          <h3>{capitalize(profile.role)}</h3>
          <span>Role</span>
        </TiltCard>

        <TiltCard className="glass-card stat" strength={8}>
          <h3>{capitalize(profile.experienceLevel)}</h3>
          <span>Experience</span>
        </TiltCard>

        <TiltCard className="glass-card stat">
          <h3>{projects.length}</h3>
          <span>Projects</span>
        </TiltCard>

        <TiltCard className="glass-card stat">
          <h3>{streams.length}</h3>
          <span>Streams</span>
        </TiltCard>
      </section>

      <div className="profile-body">
        {/* MAIN COLUMN */}
        <div className="profile-main">
          <div className="profile-tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? "active" : ""}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <TiltCard className="glass-card profile-content" strength={3}>
            {activeTab === "About" && (
              <>
                <h2>Professional Summary</h2>
                <p className="bio">
                  {profile.bio || "No biography added yet."}
                </p>

                <h2>Skills</h2>
                <div className="skills">
                  {profile.skills?.length ? (
                    profile.skills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))
                  ) : (
                    <p>No skills added</p>
                  )}
                </div>
              </>
            )}

            {activeTab === "Projects" && (
              <div className="card-grid">
                {projectsLoading ? (
                  <div className="empty-note">Loading projects...</div>
                ) : projects.length === 0 ? (
                  <div className="empty-note">No projects yet.</div>
                ) : (
                  projects.map((project) => (
                    <div key={project._id} className="mini-card">
                      {project.images?.length > 0 && (
                        <img
                          src={project.images[0].url}
                          alt={project.name}
                          className="project-thumb"
                        />
                      )}

                      <h4>{project.name}</h4>

                      <p>
                        {project.tagline ||
                          project.description?.slice(0, 120) ||
                          "No description available"}
                      </p>

                      <div className="tags">
                        {project.category && <span>{project.category}</span>}

                        {project.status && (
                          <span className="status-pill">{project.status}</span>
                        )}
                      </div>

                      <div className="mini-card-footer">
                        <span>👥 {project.members?.length || 0} members</span>

                        <button
                          className="view-project"
                          onClick={() => navigate(`/projects/${project._id}`)}
                        >
                          View Project
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "Marketplace" && (
              <div className="card-grid">
                {productsLoading ? (
                  <div className="empty-note">Loading products...</div>
                ) : products.length === 0 ? (
                  <div className="empty-note">No marketplace products yet.</div>
                ) : (
                  products.map((product) => (
                    <div key={product._id} className="mini-card">
                      {product.thumbnail?.url && (
                        <img
                          src={product.thumbnail.url}
                          alt={product.title}
                          className="project-thumb"
                        />
                      )}

                      <h4>{product.title}</h4>

                      <p>{product.description?.slice(0, 120)}</p>

                      <div className="tags">
                        <span>{product.category}</span>

                        <span className="status-pill">${product.price}</span>
                      </div>

                      <div className="mini-card-footer">
                        <span>Sales: {product.buyers?.length || 0}</span>

                        <button
                          className="view-project"
                          onClick={() => navigate("/shop")}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "Activity" && (
              <ul className="activity-list">
                {activityLoading ? (
                  <li className="empty-note">Loading activity...</li>
                ) : activity.length === 0 ? (
                  <li className="empty-note">No activity yet.</li>
                ) : (
                  activity.map((item, index) => (
                    <li key={index} className="activity-item">
                      <div className="activity-info">
                        <strong>
                          {item.type === "project" && "🚀 Project Created"}
                          {item.type === "product" && "🛒 Product Added"}
                          {item.type === "job" && "💼 Job Posted"}
                          {item.type === "stream" && "🎥 Stream Hosted"}
                        </strong>
                        <p>{item.title}</p>
                      </div>
                      <span className="activity-date">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            )}

            {activeTab === "Jobs" && (
              <div className="card-grid">
                {jobsLoading ? (
                  <div className="empty-note">Loading jobs...</div>
                ) : jobs.length === 0 ? (
                  <div className="empty-note">No jobs posted.</div>
                ) : (
                  jobs.map((job) => (
                    <div key={job._id} className="mini-card">
                      <h4>{job.title}</h4>

                      <p>{job.description.slice(0, 120)}</p>

                      <div className="tags">
                        <span>{job.roleType}</span>

                        <span className="status-pill">{job.status}</span>
                      </div>

                      <div className="mini-card-footer">
                        <span>{job.project?.name}</span>

                        <button
                          className="view-project"
                          onClick={() => navigate(`/jobs/${job._id}`)}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </TiltCard>
        </div>

        {/* SIDE COLUMN */}
        <aside className="profile-aside">
          <TiltCard className="glass-card aside-panel" strength={4}>
            <div className="panel-header">
              <h2>Recent Streams</h2>
            </div>

            {streamsLoading ? (
              <div className="empty-note">Loading streams...</div>
            ) : displayStreams.length === 0 ? (
              <div className="empty-note">No streams yet.</div>
            ) : (
              <ul>
                {displayStreams.map((stream) => (
                  <li key={stream._id}>
                    <div>
                      <strong>{stream.title}</strong>
                      <small>
                        {new Date(stream.startedAt).toLocaleDateString()}
                      </small>
                    </div>

                    <span
                      className={
                        stream.status === "live" ? "live-pill" : "ended-pill"
                      }
                    >
                      {stream.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </TiltCard>

          <TiltCard className="glass-card aside-panel" strength={4}>
            <div className="panel-header">
              <h2>Recent Activity</h2>
            </div>

            {activityLoading ? (
              <div className="empty-note">Loading activity...</div>
            ) : displayActivity.length === 0 ? (
              <div className="empty-note">No recent activity.</div>
            ) : (
              <ul className="activity-list-compact">
                {displayActivity.map((item, index) => (
                  <li key={`${item.type}-${item.title}-${index}`}>
                    <div className="activity-info">
                      <strong
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {item.type === "project" && (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                            <line x1="12" y1="22.08" x2="12" y2="12"></line>
                          </svg>
                        )}
                        {item.type === "product" && (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="8" cy="21" r="1"></circle>
                            <circle cx="19" cy="21" r="1"></circle>
                            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                          </svg>
                        )}
                        {item.type === "job" && (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect
                              width="20"
                              height="14"
                              x="2"
                              y="7"
                              rx="2"
                              ry="2"
                            ></rect>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                          </svg>
                        )}
                        {item.type === "stream" && (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polygon points="23 7 16 12 23 17 23 7"></polygon>
                            <rect
                              width="14"
                              height="12"
                              x="1"
                              y="6"
                              rx="2"
                              ry="2"
                            ></rect>
                          </svg>
                        )}
                        <span>
                          {item.type.charAt(0).toUpperCase() +
                            item.type.slice(1)}
                        </span>
                      </strong>

                      <p>{item.title}</p>
                    </div>

                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </TiltCard>

          <TiltCard className="glass-card aside-panel" strength={4}>
            <div className="panel-header">
              <h2>Contacts</h2>
            </div>

            <ul className="contacts-list">
              {profile.githubUrl && (
                <li>
                  <span className="contact-label">GitHub</span>

                  <a
                    href={safeUrl(profile.githubUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {cleanUrl(profile.githubUrl)}
                  </a>
                </li>
              )}

              {profile.linkedinUrl && (
                <li>
                  <span className="contact-label">LinkedIn</span>

                  <a
                    href={safeUrl(profile.linkedinUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {cleanUrl(profile.linkedinUrl)}
                  </a>
                </li>
              )}

              {profile.portfolioUrl && (
                <li>
                  <span className="contact-label">Portfolio</span>

                  <a
                    href={safeUrl(profile.portfolioUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {cleanUrl(profile.portfolioUrl)}
                  </a>
                </li>
              )}

              {profile.email && (
                <li>
                  <span className="contact-label">Email</span>

                  <a href={`mailto:${profile.email}`}>{profile.email}</a>
                </li>
              )}

              {!profile.githubUrl &&
                !profile.linkedinUrl &&
                !profile.portfolioUrl &&
                !profile.email && (
                  <p className="empty-note">No contact links added yet.</p>
                )}
            </ul>

            {isOwner && (
              <button
                className="profile-logout profile-logout-sidebar"
                onClick={handleLogout}
              >
                Logout
              </button>
            )}
          </TiltCard>
        </aside>
      </div>

      {modalOpen && (
        <div
          className="follow-modal-overlay"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="follow-modal-content glass-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="follow-modal-header">
              <div className="follow-modal-tabs">
                <button
                  className={modalTab === "followers" ? "active" : ""}
                  onClick={() => {
                    setModalTab("followers");
                    fetchFollowList("followers");
                  }}
                >
                  Followers ({profile.followers?.length || 0})
                </button>
                <button
                  className={modalTab === "following" ? "active" : ""}
                  onClick={() => {
                    setModalTab("following");
                    fetchFollowList("following");
                  }}
                >
                  Following ({profile.following?.length || 0})
                </button>
              </div>
              <button
                className="close-modal-btn"
                onClick={() => setModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="follow-modal-body">
              {modalLoading ? (
                <div className="empty-note">Loading...</div>
              ) : followUsersList.length === 0 ? (
                <div className="empty-note">No {modalTab} yet.</div>
              ) : (
                <ul className="follow-user-list">
                  {followUsersList.map((u) => {
                    const uId = u._id || u;
                    const uName =
                      u.displayName || u.username || u.name || "User";

                    const rawAvatar =
                      u?.avatar ||
                      u?.avatarUrl ||
                      u?.profilePicture ||
                      u?.profileImage ||
                      u?.photo ||
                      u?.image ||
                      u?.picture ||
                      u?.profile?.avatar ||
                      u?.profile?.profilePicture;

                    const uAvatar =
                      typeof rawAvatar === "string"
                        ? rawAvatar
                        : rawAvatar?.url || rawAvatar?.secure_url || "";

                    const uRole = u.role || "";

                    return (
                      <li
                        key={uId}
                        className="follow-user-item"
                        onClick={() => {
                          setModalOpen(false);
                          navigate(`/profile/${uId}`);
                        }}
                      >
                        <div className="follow-user-avatar">
                          {uAvatar ? (
                            <img src={uAvatar} alt={uName} />
                          ) : (
                            <span>{uName.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="follow-user-info">
                          <h4>{uName}</h4>
                          <span className="follow-user-username">
                            @{u.username || uName}
                          </span>
                          {uRole && (
                            <span className="follow-user-role">{uRole}</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div
          className="profile-logout-modal-overlay"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="profile-logout-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="profile-logout-modal-icon">🚪</div>
            <h2 className="profile-logout-modal-title">Logout</h2>
            <p className="profile-logout-modal-body">
              Are you sure you want to logout? You'll need to sign in again to
              access your account.
            </p>
            <div className="profile-logout-modal-actions">
              <button
                className="profile-logout-btn-ghost"
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
              >
                Cancel
              </button>
              <button
                className="profile-logout-btn-danger"
                onClick={handleConfirmLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
