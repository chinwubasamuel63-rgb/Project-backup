import { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./project-details.css";
import {
  getProject,
  deleteProject,
  removeProjectMember,
  uploadProjectImages,
  deleteProjectImage,
  leaveProject,
} from "../../services/projectService";
import { getProjectJobs } from "../../services/jobService";
import {
  getProjectPartnershipRequests,
  acceptPartnershipRequest,
  rejectPartnershipRequest,
  getMyProjectRequest,
  createPartnershipRequest,
} from "../../services/partnershipService";
import { getProjectActivity } from "../../services/projectActivityService";
import AlertModal from "../../components/ui/AlertModal";

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [partnerships, setPartnerships] = useState([]);
  const [loadingPartnerships, setLoadingPartnerships] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [myRequest, setMyRequest] = useState(null);
  const [showPartnershipModal, setShowPartnershipModal] = useState(false);
  const [partnershipMessage, setPartnershipMessage] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leavingProject, setLeavingProject] = useState(false);
  const [removingMember, setRemovingMember] = useState(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [openJobMenu, setOpenJobMenu] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const fileInputRef = useRef(null);

  const isOwner = user?._id === project?.owner?._id;

  const isCoOwner = project?.coOwners?.some(
    (coOwner) => coOwner._id === user?._id,
  );

  const isMember = project?.members?.some((member) => member._id === user?._id);

  const isPublicVisitor = !isOwner && !isCoOwner && !isMember;

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getProject(projectId);

      setProject(data.project);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadPartnerships = useCallback(async () => {
    try {
      setLoadingPartnerships(true);

      const data = await getProjectPartnershipRequests(projectId);

      setPartnerships(data.requests);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPartnerships(false);
    }
  }, [projectId]);

  const loadJobs = useCallback(async () => {
    try {
      setLoadingJobs(true);

      const data = await getProjectJobs(projectId);

      setJobs(data.jobs || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingJobs(false);
    }
  }, [projectId]);

  const loadActivities = useCallback(async () => {
    try {
      setLoadingActivities(true);

      const data = await getProjectActivity(projectId);

      setActivities(data.activities || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingActivities(false);
    }
  }, [projectId]);

  const loadMyRequest = useCallback(async () => {
    try {
      const data = await getMyProjectRequest(projectId);

      setMyRequest(data.request);
    } catch (error) {
      console.error(error);
    }
  }, [projectId]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadProject();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadProject]);

  useEffect(() => {
    if (activeTab === "partnerships" && isOwner) {
      const timerId = window.setTimeout(() => {
        void loadPartnerships();
      }, 0);

      return () => window.clearTimeout(timerId);
    }

    return undefined;
  }, [activeTab, isOwner, loadPartnerships]);

  useEffect(() => {
    if (activeTab === "hiring") {
      const timerId = window.setTimeout(() => {
        void loadJobs();
      }, 0);

      return () => window.clearTimeout(timerId);
    }

    return undefined;
  }, [activeTab, loadJobs]);

  useEffect(() => {
    if (activeTab === "activity") {
      const timerId = window.setTimeout(() => {
        void loadActivities();
      }, 0);

      return () => window.clearTimeout(timerId);
    }

    return undefined;
  }, [activeTab, loadActivities]);

  useEffect(() => {
    if (project && isPublicVisitor) {
      const timerId = window.setTimeout(() => {
        void loadMyRequest();
      }, 0);

      return () => window.clearTimeout(timerId);
    }

    return undefined;
  }, [isPublicVisitor, loadMyRequest, project]);

  useEffect(() => {
    if (!showGallery) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowGallery(false);
        return;
      }

      if (e.key === "ArrowRight") {
        setSelectedImage((prev) =>
          prev === (project?.images?.length || 1) - 1 ? 0 : prev + 1,
        );
      }

      if (e.key === "ArrowLeft") {
        setSelectedImage((prev) =>
          prev === 0 ? (project?.images?.length || 1) - 1 : prev - 1,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showGallery, project?.images?.length]);

  if (loading) {
    return (
      <div className="page-wrap">
        <div className="glass-card">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="pd-page">
        <div className="pd-state-card">Project not found.</div>
      </div>
    );
  }

  const currentImage = project.images?.[selectedImage];

  const handleAccept = async (requestId) => {
    try {
      await acceptPartnershipRequest(requestId);

      setPartnerships((prev) => prev.filter((p) => p._id !== requestId));

      loadProject();
    } catch (error) {
      console.error(error);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectPartnershipRequest(requestId);

      setPartnerships((prev) => prev.filter((p) => p._id !== requestId));
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmitRequest = async () => {
    try {
      setSubmittingRequest(true);

      const data = await createPartnershipRequest(
        projectId,
        partnershipMessage,
      );

      setMyRequest(data.request);

      setShowPartnershipModal(false);

      setPartnershipMessage("");

      loadProject();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      setDeleting(true);

      await deleteProject(project._id);

      navigate("/projects");
    } catch (error) {
      console.error(error);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleLeaveProject = async () => {
    try {
      setLeavingProject(true);

      await leaveProject(project._id);

      navigate("/projects");
    } catch (error) {
      console.error(error);
    } finally {
      setLeavingProject(false);
      setShowLeaveModal(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);

    if (!files.length) return;

    const MAX_SIZE = 5 * 1024 * 1024;
    const MAX_FILES = 5;

    if (files.length > MAX_FILES) {
      setAlertMessage("You can upload a maximum of 5 images.");
      return;
    }

    for (const file of files) {
      if (file.size > MAX_SIZE) {
        setAlertMessage(`${file.name} exceeds the 5MB limit.`);
        return;
      }
    }

    try {
      await uploadProjectImages(project._id, files);

      await loadProject();

      e.target.value = "";
    } catch (error) {
      console.error(error);
      setAlertMessage(
        error.response?.data?.message || "Unable to upload project images.",
      );
    }
  };

  const handleDeleteImage = async (publicId) => {
    try {
      await deleteProjectImage(project._id, publicId);

      await loadProject();

      setSelectedImage(0);

      if (project.images.length <= 1) {
        setShowGallery(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    try {
      setRemovingMember(true);

      await removeProjectMember(project._id, selectedMember._id);

      setProject((prev) => ({
        ...prev,
        members: prev.members.filter(
          (member) => member._id !== selectedMember._id,
        ),
      }));

      setShowRemoveModal(false);
      setSelectedMember(null);
    } catch (error) {
      console.error(error);
    } finally {
      setRemovingMember(false);
    }
  };

  const statusColor = {
    Idea: "#a855f7",
    Building: "#38bdf8",
    Testing: "#f59e0b",
    Launched: "#34d399",
    Paused: "#94a3b8",
    Archived: "#6b7494",
  };

  return (
    <div className="pd-page">
      <AlertModal message={alertMessage} onClose={() => setAlertMessage("")} />
      {/* ── sticky topbar: Back + menu ── */}
      <div className="pd-topbar">
        <button className="pd-btn-back" onClick={() => navigate("/projects")}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to Projects
        </button>

        <div className="pd-topbar-right">
          {isPublicVisitor && project.lookingForPartners && !myRequest && (
            <button
              className="pd-btn-primary"
              onClick={() => setShowPartnershipModal(true)}
            >
              Apply for Partnership
            </button>
          )}
          {isPublicVisitor && myRequest && (
            <span className="pd-request-status-badge">
              Request {myRequest.status}
            </span>
          )}

          {(isOwner || isMember || isCoOwner) && (
            <div className="pd-menu-wrap">
              <button
                className="pd-btn-menu"
                onClick={() => setShowMenu((prev) => !prev)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle
                    cx="12"
                    cy="5"
                    r="1.2"
                    fill="currentColor"
                    stroke="none"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="1.2"
                    fill="currentColor"
                    stroke="none"
                  />
                  <circle
                    cx="12"
                    cy="19"
                    r="1.2"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
              </button>

              {showMenu && (
                <div className="pd-menu">
                  {isOwner && (
                    <>
                      <button
                        className="pd-menu-item"
                        onClick={() => {
                          setShowMenu(false);
                          navigate(`/projects/${project._id}/edit`);
                        }}
                      >
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
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit Project
                      </button>
                      <button
                        className="pd-menu-item"
                        onClick={() => {
                          setActiveTab("gallery");
                          setShowMenu(false);
                        }}
                      >
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
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                        Manage Images
                      </button>
                      <button
                        className="pd-menu-item"
                        onClick={() => {
                          setActiveTab("team");
                          setShowMenu(false);
                        }}
                      >
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
                          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 00-3-3.87" />
                          <path d="M16 3.13a4 4 0 010 7.75" />
                        </svg>
                        Manage Team
                      </button>
                      <button
                        className="pd-menu-item"
                        onClick={() => {
                          setShowMenu(false);
                          navigate(`/jobs/create?projectId=${project._id}`);
                        }}
                      >
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
                          <rect x="2" y="7" width="20" height="14" rx="2" />
                          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                        </svg>
                        Create Job
                      </button>
                      <div className="pd-menu-divider" />
                      <button
                        className="pd-menu-item pd-menu-item-danger"
                        onClick={() => {
                          setShowDeleteModal(true);
                          setShowMenu(false);
                        }}
                      >
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
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                        </svg>
                        Delete Project
                      </button>
                    </>
                  )}
                  {!isOwner && (
                    <button
                      className="pd-menu-item pd-menu-item-danger"
                      onClick={() => {
                        setShowLeaveModal(true);
                        setShowMenu(false);
                      }}
                    >
                      🚪 Leave Project
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── cover ── */}
      <div className="pd-cover-wrap">
        {project.coverImage?.url ? (
          <img
            src={project.coverImage.url}
            alt={project.name}
            className="pd-cover-img"
          />
        ) : (
          <div className="pd-cover-empty" />
        )}
        <div className="pd-cover-gradient" />
      </div>

      {/* ── hero bar ── */}
      <div className="pd-hero">
        <div className="pd-hero-logo">
          {project.logo?.url ? (
            <img
              src={project.logo.url}
              alt={project.name}
              className="pd-logo-img"
            />
          ) : (
            <span className="pd-logo-initial">
              {project.name?.charAt(0)?.toUpperCase()}
            </span>
          )}
        </div>

        <div className="pd-hero-info">
          <div className="pd-hero-top">
            <h1 className="pd-project-name">{project.name}</h1>

            <div className="pd-badges">
              {project.status && (
                <span
                  className="pd-badge"
                  style={{
                    background: `${statusColor[project.status] || "#a855f7"}22`,
                    color: statusColor[project.status] || "#a855f7",
                    borderColor: `${statusColor[project.status] || "#a855f7"}44`,
                  }}
                >
                  <span
                    className="pd-badge-dot"
                    style={{
                      background: statusColor[project.status] || "#a855f7",
                    }}
                  />
                  {project.status}
                </span>
              )}
              {project.category && (
                <span className="pd-badge pd-badge-category">
                  {project.category}
                </span>
              )}
              {project.visibility && (
                <span className="pd-badge pd-badge-visibility">
                  {project.visibility === "Private" ? "🔒" : "🌐"}{" "}
                  {project.visibility}
                </span>
              )}
            </div>
          </div>

          <p className="pd-tagline">{project.tagline}</p>

          <div className="pd-meta-row">
            <span className="pd-meta-item">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
              {project.members?.length || 0} Members
            </span>
            <span className="pd-meta-item">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {new Date(project.createdAt).toLocaleDateString()}
            </span>
            <span className="pd-meta-item">
              🤝 {project.partnershipCount || 0} Requests
            </span>
            <span className="pd-meta-item">
              💼 {project.hiringCount || 0} Jobs
            </span>
          </div>
        </div>
      </div>

      {/* ── tabs ── */}
      <div className="pd-tabs">
        {[
          { key: "overview", label: "Overview" },
          { key: "team", label: "Team" },
          { key: "gallery", label: "Gallery", count: project.images?.length },
          ...(isOwner || isMember || project.lookingForPartners
            ? [
                {
                  key: "partnerships",
                  label: "Partnerships",
                  count:
                    isOwner && project.partnershipCount > 0
                      ? project.partnershipCount
                      : null,
                },
              ]
            : []),
          {
            key: "hiring",
            label: "Hiring",
            count: project.hiringCount > 0 ? project.hiringCount : null,
          },
          { key: "activity", label: "Activity" },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`pd-tab ${activeTab === tab.key ? "pd-tab-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.count > 0 && <span className="pd-tab-badge">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* ── tab content ── */}
      <div className="pd-content">
        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="pd-overview-layout">
            <div className="pd-overview-main">
              <div className="pd-card">
                <h3 className="pd-card-title">About</h3>
                <p className="pd-card-text">
                  {project.description || "No description provided."}
                </p>
              </div>

              <div className="pd-card">
                <h3 className="pd-card-title">Tech Stack</h3>
                <div className="pd-tech-grid">
                  {project.technologies?.length ? (
                    project.technologies.map((tech) => (
                      <span key={tech} className="pd-tech-pill">
                        {tech}
                      </span>
                    ))
                  ) : (
                    <p className="pd-empty-text">No technologies listed.</p>
                  )}
                </div>
              </div>

              <div className="pd-card">
                <h3 className="pd-card-title">Project Stats</h3>
                <div className="pd-stats-grid">
                  {[
                    {
                      label: "Members",
                      value: project.members?.length || 0,
                      color: "#a855f7",
                    },
                    {
                      label: "Co-Owners",
                      value: project.coOwners?.length || 0,
                      color: "#38bdf8",
                    },
                    {
                      label: "Partners",
                      value: project.lookingForPartners ? "Open" : "Closed",
                      color: "#34d399",
                    },
                    {
                      label: "Talent",
                      value: project.lookingForTalent ? "Open" : "Closed",
                      color: "#f59e0b",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="pd-stat-card"
                      style={{ "--stat-color": s.color }}
                    >
                      <div className="pd-stat-value">{s.value}</div>
                      <div className="pd-stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pd-card">
                <h3 className="pd-card-title">Quick Actions</h3>
                <div className="pd-actions-grid">
                  {(isOwner || isCoOwner) && (
                    <div
                      className="pd-action-card"
                      onClick={() => navigate(`/projects/${project._id}/edit`)}
                    >
                      <div
                        className="pd-action-icon"
                        style={{
                          background: "rgba(245,158,11,0.15)",
                          color: "#f59e0b",
                        }}
                      >
                        ✎
                      </div>
                      <h4>Edit Project</h4>
                      <p>Update details and settings</p>
                      <span className="pd-action-arrow">→</span>
                    </div>
                  )}
                  <div
                    className="pd-action-card"
                    onClick={() => setActiveTab("partnerships")}
                  >
                    {project.partnershipCount > 0 && (
                      <span className="pd-action-badge">
                        {project.partnershipCount}
                      </span>
                    )}
                    <div
                      className="pd-action-icon"
                      style={{
                        background: "rgba(168,85,247,0.15)",
                        color: "#a855f7",
                      }}
                    >
                      🤝
                    </div>
                    <h4>Partnerships</h4>
                    <p>Review requests</p>
                    <span className="pd-action-arrow">→</span>
                  </div>
                  <div
                    className="pd-action-card"
                    onClick={() => setActiveTab("hiring")}
                  >
                    {project.hiringCount > 0 && (
                      <span className="pd-action-badge">
                        {project.hiringCount}
                      </span>
                    )}
                    <div
                      className="pd-action-icon"
                      style={{
                        background: "rgba(56,189,248,0.15)",
                        color: "#38bdf8",
                      }}
                    >
                      ✉
                    </div>
                    <h4>Hiring Posts</h4>
                    <p>Manage job listings</p>
                    <span className="pd-action-arrow">→</span>
                  </div>
                  <div
                    className="pd-action-card"
                    onClick={() => setActiveTab("activity")}
                  >
                    <div
                      className="pd-action-icon"
                      style={{
                        background: "rgba(52,211,153,0.15)",
                        color: "#34d399",
                      }}
                    >
                      ⟳
                    </div>
                    <h4>Activity</h4>
                    <p>Recent updates</p>
                    <span className="pd-action-arrow">→</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pd-overview-sidebar">
              <div className="pd-card">
                <h3 className="pd-card-title">Owner</h3>
                <div className="pd-member-row">
                  <div className="pd-avatar">
                    {project.owner?.avatar?.url ? (
                      <img
                        src={project.owner.avatar.url}
                        alt={project.owner.username}
                      />
                    ) : (
                      project.owner?.username?.charAt(0)?.toUpperCase()
                    )}
                  </div>
                  <div className="pd-member-info">
                    <div className="pd-member-name">
                      {project.owner?.username}
                    </div>
                    <div className="pd-member-handle">
                      @{project.owner?.username}
                    </div>
                  </div>
                  {!isOwner && (
                    <button
                      className="pd-btn-icon-sm"
                      onClick={() =>
                        navigate(`/messages?user=${project.owner?._id}`)
                      }
                      title="Message owner"
                    >
                      ✉
                    </button>
                  )}
                </div>
              </div>

              {project.coOwners?.length > 0 && (
                <div className="pd-card">
                  <h3 className="pd-card-title">
                    Co-Owners{" "}
                    <span className="pd-card-count">
                      {project.coOwners.length}
                    </span>
                  </h3>
                  {project.coOwners.map((member) => (
                    <div className="pd-member-row" key={member._id}>
                      <div className="pd-avatar">
                        {member.avatar?.url ? (
                          <img src={member.avatar.url} alt={member.username} />
                        ) : (
                          member.username?.charAt(0)?.toUpperCase()
                        )}
                      </div>
                      <div className="pd-member-info">
                        <div className="pd-member-name">{member.username}</div>
                        <div className="pd-member-handle">
                          @{member.username}
                        </div>
                      </div>
                      {user?._id !== member._id && (
                        <button
                          className="pd-btn-icon-sm"
                          onClick={() =>
                            navigate(`/messages?user=${member._id}`)
                          }
                          title="Message co-owner"
                        >
                          ✉
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pd-card">
                <h3 className="pd-card-title">
                  Members{" "}
                  <span className="pd-card-count">
                    {project.members?.length || 0}
                  </span>
                </h3>
                {project.members?.length ? (
                  <>
                    {project.members.slice(0, 5).map((member) => (
                      <div className="pd-member-row" key={member._id}>
                        <div className="pd-avatar">
                          {member.avatar?.url ? (
                            <img
                              src={member.avatar.url}
                              alt={member.username}
                            />
                          ) : (
                            member.username?.charAt(0)?.toUpperCase()
                          )}
                        </div>
                        <div className="pd-member-info">
                          <div className="pd-member-name">
                            {member.username}
                          </div>
                          <div className="pd-member-handle">
                            @{member.username}
                          </div>
                        </div>
                      </div>
                    ))}
                    {project.members.length > 5 && (
                      <button
                        className="pd-view-all-btn"
                        onClick={() => setActiveTab("team")}
                      >
                        View all {project.members.length} members →
                      </button>
                    )}
                  </>
                ) : (
                  <p className="pd-empty-text">No members yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TEAM */}
        {activeTab === "team" && (
          <div className="pd-card pd-card-full">
            <h3 className="pd-card-title">Project Team</h3>
            <div className="pd-team-grid">
              <div className="pd-team-group">
                <div className="pd-team-group-header">
                  Owner <span>1</span>
                </div>
                <div className="pd-member-row">
                  <div className="pd-avatar">
                    {project.owner?.username?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="pd-member-info">
                    <div className="pd-member-name">
                      {project.owner?.username}
                    </div>
                    <div className="pd-member-role-badge">Owner</div>
                  </div>
                </div>
              </div>

              <div className="pd-team-group">
                <div className="pd-team-group-header">
                  Co-Owners <span>{project.coOwners?.length || 0}</span>
                </div>
                {project.coOwners?.length ? (
                  project.coOwners.map((member) => (
                    <div key={member._id} className="pd-member-row">
                      <div className="pd-avatar">
                        {member.username?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="pd-member-info">
                        <div className="pd-member-name">{member.username}</div>
                        <div className="pd-member-role-badge pd-role-coowner">
                          Co-Owner
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="pd-empty-text">No co-owners yet.</p>
                )}
              </div>

              <div className="pd-team-group">
                <div className="pd-team-group-header">
                  Members{" "}
                  <span>
                    {project.members?.filter(
                      (m) => m._id !== project.owner?._id,
                    ).length || 0}
                  </span>
                </div>
                {project.members
                  ?.filter((m) => m._id !== project.owner?._id)
                  .map((member) => (
                    <div key={member._id} className="pd-member-row">
                      <div className="pd-avatar">
                        {member.avatar?.url ? (
                          <img src={member.avatar.url} alt={member.username} />
                        ) : (
                          member.username?.charAt(0)?.toUpperCase()
                        )}
                      </div>
                      <div className="pd-member-info">
                        <div className="pd-member-name">{member.username}</div>
                        <div className="pd-member-role-badge pd-role-member">
                          Member
                        </div>
                      </div>
                      {isOwner && (
                        <button
                          className="pd-btn-remove"
                          onClick={() => {
                            setSelectedMember(member);
                            setShowRemoveModal(true);
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* GALLERY */}
        {activeTab === "gallery" && (
          <div className="pd-card pd-card-full">
            <div className="pd-card-header">
              <h3 className="pd-card-title">
                Gallery{" "}
                <span className="pd-card-count">
                  {project.images?.length || 0}
                </span>
              </h3>
              {(isOwner || isCoOwner) && (
                <button
                  className="pd-btn-primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  + Add Images
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              hidden
              onChange={handleImageUpload}
            />
            {project.images?.length === 0 ? (
              <div className="pd-empty-state">
                <div className="pd-empty-icon">🖼️</div>
                <h4>No Images Yet</h4>
                <p>No screenshots have been uploaded yet.</p>
              </div>
            ) : (
              <div className="pd-gallery-grid">
                {project.images?.map((image, index) => (
                  <div
                    key={image.publicId}
                    className="pd-gallery-item"
                    onClick={() => {
                      setSelectedImage(index);
                      setShowGallery(true);
                    }}
                  >
                    <img
                      src={image.url}
                      alt={`Screenshot ${index + 1}`}
                      className="pd-gallery-img"
                    />
                    <div className="pd-gallery-overlay">
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 1l22 22" />
                        <path d="M10.5 10.677a2 2 0 002.823 2.823" />
                        <path d="M7.362 7.561C5.68 8.74 4.279 10.42 3 12c1.889 2.991 5.282 6 9 6a9.08 9.08 0 003.96-.937" />
                        <path d="M12 6c3.796 0 7.143 3 9 6a15.66 15.66 0 01-1.38 1.898" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PARTNERSHIPS */}
        {activeTab === "partnerships" && (
          <div className="pd-card pd-card-full">
            {isOwner && (
              <>
                <h3 className="pd-card-title">
                  Partnership Requests{" "}
                  <span className="pd-card-count">{partnerships.length}</span>
                </h3>
                {loadingPartnerships ? (
                  <p className="pd-empty-text">Loading requests...</p>
                ) : partnerships.length === 0 ? (
                  <div className="pd-empty-state">
                    <div className="pd-empty-icon">🤝</div>
                    <h4>No Requests Yet</h4>
                    <p>Partnership requests will appear here.</p>
                  </div>
                ) : (
                  <div className="pd-request-list">
                    {partnerships.map((request) => (
                      <div key={request._id} className="pd-request-card">
                        <div className="pd-avatar pd-avatar-lg">
                          {request.applicant?.avatar?.url ? (
                            <img
                              src={request.applicant.avatar.url}
                              alt={request.applicant.username}
                            />
                          ) : (
                            request.applicant?.username
                              ?.charAt(0)
                              ?.toUpperCase()
                          )}
                        </div>
                        <div className="pd-request-body">
                          <div className="pd-request-name">
                            {request.applicant?.username}
                          </div>
                          <p className="pd-request-message">
                            {request.message || "No message provided"}
                          </p>
                          <span
                            className={`pd-request-status pd-request-status-${request.status?.toLowerCase()}`}
                          >
                            {request.status}
                          </span>
                        </div>
                        {request.status === "Pending" && (
                          <div className="pd-request-actions">
                            <button
                              className="pd-btn-accept"
                              onClick={() => handleAccept(request._id)}
                            >
                              Accept
                            </button>
                            <button
                              className="pd-btn-reject"
                              onClick={() => handleReject(request._id)}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {isMember && !isOwner && (
              <div className="pd-empty-state">
                <div className="pd-empty-icon">✅</div>
                <h4>You're a member</h4>
                <p>You are already part of this project.</p>
              </div>
            )}

            {isPublicVisitor && project.lookingForPartners && (
              <div className="pd-partner-cta">
                <span className="pd-partner-badge">Looking For Partners</span>
                <h3>Become a Project Partner</h3>
                <p>
                  This team is actively looking for collaborators. Submit a
                  request and tell the owner how you can contribute.
                </p>
                {!myRequest ? (
                  <button
                    className="pd-btn-primary"
                    onClick={() => setShowPartnershipModal(true)}
                  >
                    Apply For Partnership
                  </button>
                ) : (
                  <div className="pd-request-status-box">
                    Request Status: {myRequest.status}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* HIRING */}
        {activeTab === "hiring" && (
          <div className="pd-card pd-card-full">
            <div className="pd-card-header">
              <h3 className="pd-card-title">
                Hiring Posts{" "}
                <span className="pd-card-count">{jobs.length}</span>
              </h3>
              {isOwner && (
                <button
                  className="pd-btn-primary"
                  onClick={() =>
                    navigate(`/jobs/create?projectId=${project._id}`)
                  }
                >
                  Create Job
                </button>
              )}
            </div>
            {loadingJobs ? (
              <p className="pd-empty-text">Loading jobs...</p>
            ) : jobs.length === 0 ? (
              <div className="pd-empty-state">
                <div className="pd-empty-icon">💼</div>
                <h4>No Hiring Posts</h4>
                <p>Create a job posting to start recruiting.</p>
              </div>
            ) : (
              <div className="pd-job-list">
                {jobs.map((job) => (
                  <div key={job._id} className="pd-job-card">
                    <div className="pd-job-header">
                      <div>
                        <div className="pd-job-title">{job.title}</div>
                        <div className="pd-job-role">{job.roleType}</div>
                      </div>
                      <span
                        className={`pd-job-status ${job.status === "Open" ? "pd-job-open" : "pd-job-closed"}`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <p className="pd-job-desc">{job.description}</p>
                    {job.requiredSkills?.length > 0 && (
                      <div className="pd-job-skills">
                        {job.requiredSkills.map((skill) => (
                          <span key={skill} className="pd-tech-pill">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="pd-job-meta">
                      <span>👥 {job.applicationCount || 0} Applications</span>
                      <span>📍 {job.location}</span>
                      <span>{job.isRemote ? "🌍 Remote" : "🏢 On-site"}</span>
                      <span>
                        🕒 {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="pd-job-footer">
                      <button
                        className="pd-btn-secondary"
                        onClick={() => navigate(`/jobs/${job._id}`)}
                      >
                        View
                      </button>
                      {isOwner && (
                        <div className="pd-job-menu-wrap">
                          <button
                            className="pd-btn-icon-sm"
                            onClick={() =>
                              setOpenJobMenu(
                                openJobMenu === job._id ? null : job._id,
                              )
                            }
                          >
                            ⋮
                          </button>
                          {openJobMenu === job._id && (
                            <div className="pd-job-dropdown">
                              <button
                                onClick={() =>
                                  navigate(`/jobs/${job._id}/applications`)
                                }
                              >
                                Applicants
                              </button>
                              <button
                                onClick={() =>
                                  navigate(`/jobs/${job._id}/edit`)
                                }
                              >
                                Edit Job
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ACTIVITY */}
        {activeTab === "activity" && (
          <div className="pd-card pd-card-full">
            <h3 className="pd-card-title">Project Activity</h3>
            {loadingActivities ? (
              <p className="pd-empty-text">Loading activity...</p>
            ) : activities.length === 0 ? (
              <div className="pd-empty-state">
                <div className="pd-empty-icon">⚡</div>
                <h4>No Activity Yet</h4>
                <p>Project events will appear here.</p>
              </div>
            ) : (
              <div className="pd-activity-list">
                {activities.map((activity) => (
                  <div key={activity._id} className="pd-activity-item">
                    <div className="pd-activity-dot" />
                    <div className="pd-activity-content">
                      <div className="pd-activity-action">
                        {activity.action}
                      </div>
                      <p className="pd-activity-message">{activity.message}</p>
                      <span className="pd-activity-time">
                        {new Date(activity.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODALS ── */}

      {showPartnershipModal && (
        <div
          className="pd-modal-overlay"
          onClick={() => setShowPartnershipModal(false)}
        >
          <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pd-modal-icon">🤝</div>
            <h2 className="pd-modal-title">Partnership Request</h2>
            <p className="pd-modal-body">
              Tell the project owner why you'd like to join and how you can
              contribute.
            </p>
            <textarea
              className="pd-modal-textarea"
              value={partnershipMessage}
              onChange={(e) => setPartnershipMessage(e.target.value)}
              placeholder="Describe your skills, experience, and how you can contribute..."
              rows={5}
            />
            <div className="pd-modal-actions">
              <button
                className="pd-btn-ghost"
                onClick={() => setShowPartnershipModal(false)}
              >
                Cancel
              </button>
              <button
                className="pd-btn-primary"
                disabled={submittingRequest}
                onClick={handleSubmitRequest}
              >
                {submittingRequest ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div
          className="pd-modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pd-modal-icon">🗑️</div>
            <h2 className="pd-modal-title">Delete Project</h2>
            <p className="pd-modal-body">
              Are you sure you want to delete <strong>{project.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="pd-modal-actions">
              <button
                className="pd-btn-ghost"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="pd-btn-danger"
                onClick={handleDeleteProject}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLeaveModal && (
        <div
          className="pd-modal-overlay"
          onClick={() => setShowLeaveModal(false)}
        >
          <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pd-modal-icon">🚪</div>
            <h2 className="pd-modal-title">Leave Project?</h2>
            <p className="pd-modal-body">
              Are you sure you want to leave <strong>{project.name}</strong>?
              You'll need a new invitation to rejoin.
            </p>
            <div className="pd-modal-actions">
              <button
                className="pd-btn-ghost"
                onClick={() => setShowLeaveModal(false)}
              >
                Cancel
              </button>
              <button
                className="pd-btn-danger"
                onClick={handleLeaveProject}
                disabled={leavingProject}
              >
                {leavingProject ? "Leaving..." : "Leave Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRemoveModal && selectedMember && (
        <div
          className="pd-modal-overlay"
          onClick={() => {
            setShowRemoveModal(false);
            setSelectedMember(null);
          }}
        >
          <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pd-modal-icon">👤</div>
            <h2 className="pd-modal-title">Remove Member</h2>
            <p className="pd-modal-body">
              Remove <strong>{selectedMember.username}</strong> from{" "}
              <strong>{project.name}</strong>?
            </p>
            <div className="pd-modal-actions">
              <button
                className="pd-btn-ghost"
                onClick={() => {
                  setShowRemoveModal(false);
                  setSelectedMember(null);
                }}
              >
                Cancel
              </button>
              <button
                className="pd-btn-danger"
                onClick={handleRemoveMember}
                disabled={removingMember}
              >
                {removingMember ? "Removing..." : "Remove Member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGallery && (
        <div className="pd-lightbox">
          <button
            className="pd-lightbox-close"
            onClick={() => setShowGallery(false)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {project.images?.length > 1 && (
            <button
              className="pd-lightbox-prev"
              onClick={() =>
                setSelectedImage((prev) =>
                  prev === 0 ? project.images.length - 1 : prev - 1,
                )
              }
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}

          {currentImage && (
            <img className="pd-lightbox-img" src={currentImage.url} alt="" />
          )}

          {project.images?.length > 1 && (
            <button
              className="pd-lightbox-next"
              onClick={() =>
                setSelectedImage((prev) =>
                  prev === project.images.length - 1 ? 0 : prev + 1,
                )
              }
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}

          <div className="pd-lightbox-footer">
            <span className="pd-lightbox-counter">
              {selectedImage + 1} / {project.images?.length}
            </span>
            {(isOwner || isCoOwner) && (
              <button
                className="pd-lightbox-delete"
                onClick={() =>
                  handleDeleteImage(project.images?.[selectedImage].publicId)
                }
              >
                Delete Image
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
