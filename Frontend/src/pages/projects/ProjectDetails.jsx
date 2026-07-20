import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./project.css";
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
  const fileInputRef = useRef(null);

  const isOwner = user?._id === project?.owner?._id;

  const isCoOwner = project?.coOwners?.some(
    (coOwner) => coOwner._id === user?._id,
  );

  const isMember = project?.members?.some((member) => member._id === user?._id);

  const isPublicVisitor = !isOwner && !isCoOwner && !isMember;

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    if (activeTab === "partnerships" && isOwner) {
      loadPartnerships();
    }
  }, [activeTab, isOwner]);

  useEffect(() => {
    if (activeTab === "hiring") {
      loadJobs();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "activity") {
      loadActivities();
    }
  }, [activeTab]);

  useEffect(() => {
    if (project && isPublicVisitor) {
      loadMyRequest();
    }
  }, [project, isPublicVisitor]);

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

  const loadProject = async () => {
    try {
      setLoading(true);

      const data = await getProject(projectId);

      setProject(data.project);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadPartnerships = async () => {
    try {
      setLoadingPartnerships(true);

      const data = await getProjectPartnershipRequests(projectId);

      setPartnerships(data.requests);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPartnerships(false);
    }
  };

  const loadJobs = async () => {
    try {
      setLoadingJobs(true);

      const data = await getProjectJobs(projectId);

      setJobs(data.jobs || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadActivities = async () => {
    try {
      setLoadingActivities(true);

      const data = await getProjectActivity(projectId);

      setActivities(data.activities || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const loadMyRequest = async () => {
    try {
      const data = await getMyProjectRequest(projectId);

      setMyRequest(data.request);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="page-wrap">
        <div className="glass-card">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page-wrap">
        <div className="glass-card">Project not found.</div>
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
      alert("You can upload a maximum of 5 images.");
      return;
    }

    for (const file of files) {
      if (file.size > MAX_SIZE) {
        alert(`${file.name} exceeds the 5MB limit.`);
        return;
      }
    }

    const formData = new FormData();

    files.forEach((file) => {
      formData.append("images", file);
    });

    try {
      await uploadProjectImages(project._id, formData);

      await loadProject();

      e.target.value = "";
    } catch (error) {
      console.error(error);
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

  return (
    <div className="page-wrap project-details-page">
      {/* Top bar */}

      <div className="project-topbar">
        <button
          className="project-back-link"
          onClick={() => navigate("/projects")}
        >
          ← Back to Projects
        </button>

        <div className="project-topbar-actions">
          {(isOwner || isMember || isCoOwner) && (
            <div className="project-menu-wrapper">
              <button
                className="btn-icon"
                onClick={() => setShowMenu((prev) => !prev)}
              >
                ⋯
              </button>

              {showMenu && (
                <div className="project-menu">
                  {/* OWNER ONLY */}
                  {isOwner && (
                    <>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          navigate(`/projects/${project._id}/edit`);
                        }}
                      >
                        ✏️ Edit Project
                      </button>

                      <button onClick={() => setActiveTab("gallery")}>
                        🖼️ Manage Images
                      </button>

                      <button onClick={() => setActiveTab("team")}>
                        👥 Manage Team
                      </button>

                      <button
                        onClick={() => {
                          setShowMenu(false);
                          navigate(`/jobs/create?projectId=${project._id}`);
                        }}
                      >
                        💼 Create Job
                      </button>

                      <div className="menu-divider" />

                      <button
                        className="danger-btn"
                        onClick={() => {
                          setShowDeleteModal(true);
                          setShowMenu(false);
                        }}
                      >
                        🗑️ Delete Project
                      </button>
                    </>
                  )}

                  {/* MEMBER / CO-OWNER */}
                  {!isOwner && (
                    <button
                      className="danger-btn"
                      onClick={() => setShowLeaveModal(true)}
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

      {/* Hero */}

      <div className="project-hero-wrapper">
        {project.coverImage?.url && (
          <div className="project-cover">
            <img src={project.coverImage.url} alt={project.name} />
          </div>
        )}

        <div className="glass-card project-hero">
          <div className="project-hero-left">
            <div className="project-icon">
              {project.logo?.url ? (
                <img
                  src={project.logo.url}
                  alt={project.name}
                  className="project-logo-img"
                />
              ) : (
                project.name?.charAt(0)?.toUpperCase()
              )}
            </div>

            <div>
              <h1>{project.name}</h1>

              <p>{project.tagline}</p>

              <div className="project-badges">
                {project.status && (
                  <span className="badge badge-idea">
                    <span className="badge-dot" />
                    {project.status}
                  </span>
                )}

                {project.category && (
                  <span className="badge badge-category">
                    <span className="badge-dot" />
                    {project.category}
                  </span>
                )}

                {project.visibility && (
                  <span className="badge badge-visibility">
                    <span className="badge-dot" />
                    {project.visibility}
                  </span>
                )}

                <div className="project-meta">
                  <span className="badge-meta">
                    👥 {project.members?.length || 0} Members
                  </span>

                  <span className="badge-meta">
                    📅 Created{" "}
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>

                  <span className="badge-meta">
                    🤝 {project.partnershipCount || 0} Requests
                  </span>

                  <span className="badge-meta">
                    💼 {project.hiringCount || 0} Jobs
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs (display only, Overview always active) */}

      <div className="project-tabs">
        <button
          className={`project-tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>

        <button
          className={`project-tab ${activeTab === "team" ? "active" : ""}`}
          onClick={() => setActiveTab("team")}
        >
          Team
        </button>

        <button
          className={`project-tab ${activeTab === "gallery" ? "active" : ""}`}
          onClick={() => setActiveTab("gallery")}
        >
          Gallery
          {project.images?.length > 0 && (
            <span className="project-tab-count">{project.images.length}</span>
          )}
        </button>

        {(isOwner || isMember || project.lookingForPartners) && (
          <button
            className={`project-tab ${
              activeTab === "partnerships" ? "active" : ""
            }`}
            onClick={() => setActiveTab("partnerships")}
          >
            Partnerships
            {isOwner && project.partnershipCount > 0 && (
              <span className="project-tab-count">
                {project.partnershipCount}
              </span>
            )}
          </button>
        )}

        <button
          className={`project-tab ${activeTab === "hiring" ? "active" : ""}`}
          onClick={() => setActiveTab("hiring")}
        >
          Hiring
          {project.hiringCount > 0 && (
            <span className="project-tab-count">{project.hiringCount}</span>
          )}
        </button>

        <button
          className={`project-tab ${activeTab === "activity" ? "active" : ""}`}
          onClick={() => setActiveTab("activity")}
        >
          Activity
        </button>
      </div>

      {/* Main Layout */}
      {activeTab === "overview" && (
        <div className="project-layout">
          {/* Left Column */}

          <div className="project-main">
            <div className="glass-card project-section">
              <h3>About Project</h3>

              <p>{project.description || "No description provided."}</p>
            </div>

            <div className="glass-card project-section">
              <h3>Technologies</h3>

              <div className="tech-grid">
                {project.technologies?.map((tech) => (
                  <span key={tech} className="tech-pill">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass-card project-section">
              <h3>Project Stats</h3>

              <div className="stats-grid">
                <div className="stat-card">
                  <h2>{project.members?.length || 0}</h2>
                  <span>Members</span>
                </div>

                <div className="stat-card">
                  <h2>{project.coOwners?.length || 0}</h2>
                  <span>Co-Owners</span>
                </div>

                <div className="stat-card">
                  <h2>{project.lookingForPartners ? "Yes" : "No"}</h2>
                  <span>Partners</span>
                </div>

                <div className="stat-card">
                  <h2>{project.lookingForTalent ? "Yes" : "No"}</h2>
                  <span>Talent</span>
                </div>
              </div>
            </div>

            <div className="glass-card project-section">
              <h3>Project Actions</h3>

              <div className="project-actions-grid">
                {(isOwner || isCoOwner) && (
                  <div
                    className="action-card"
                    onClick={() => navigate(`/projects/${project._id}/edit`)}
                  >
                    <div className="action-card-icon icon-amber">✎</div>
                    <h4>Edit Project</h4>
                    <p>Update project details, technologies, and settings.</p>
                    <span className="action-card-arrow">→</span>
                  </div>
                )}

                <div
                  className="action-card"
                  onClick={() => setActiveTab("partnerships")}
                >
                  {project.partnershipCount > 0 && (
                    <span className="action-card-badge">
                      {project.partnershipCount}
                    </span>
                  )}
                  <div className="action-card-icon icon-pink">🤝</div>
                  <h4>Partnership Requests</h4>
                  <p>Review and manage partnership requests.</p>
                  <span className="action-card-arrow">→</span>
                </div>

                <div
                  className="action-card"
                  onClick={() => setActiveTab("hiring")}
                >
                  {project.hiringCount > 0 && (
                    <span className="action-card-badge">
                      {project.hiringCount}
                    </span>
                  )}
                  <div className="action-card-icon icon-blue">✉</div>
                  <h4>Hiring Posts</h4>
                  <p>Manage your job posts and applications.</p>
                  <span className="action-card-arrow">→</span>
                </div>

                <div
                  className="action-card"
                  onClick={() => setActiveTab("activity")}
                >
                  <div className="action-card-icon icon-cyan">⟳</div>
                  <h4>Project Activity</h4>
                  <p>View recent updates and activity.</p>
                  <span className="action-card-arrow">→</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}

          <div className="project-sidebar">
            <div className="glass-card project-section">
              <h3>Project Owner</h3>

              <div className="member-card">
                <div className="member-avatar">
                  {project.owner?.avatar?.url ? (
                    <img
                      src={project.owner.avatar.url}
                      alt={project.owner.username}
                    />
                  ) : (
                    project.owner?.username?.charAt(0)?.toUpperCase()
                  )}
                </div>

                <span>
                  <strong>{project.owner?.username}</strong>
                  <span className="member-username">
                    @{project.owner?.username}
                  </span>
                </span>

                <button className="member-mail-btn">✉</button>
              </div>
            </div>

            <div className="glass-card project-section">
              <h3>Co-Owners ({project.coOwners?.length || 0})</h3>

              {project.coOwners?.length ? (
                project.coOwners.map((member) => (
                  <div className="member-card" key={member._id}>
                    <div className="member-avatar">
                      {member.avatar?.url ? (
                        <img src={member.avatar.url} alt={member.username} />
                      ) : (
                        member.username?.charAt(0)?.toUpperCase()
                      )}
                    </div>

                    <span>
                      <strong>{member.username}</strong>
                      <span className="member-username">
                        @{member.username}
                      </span>
                    </span>

                    <button className="member-mail-btn">✉</button>
                  </div>
                ))
              ) : (
                <div className="member-card-empty">No co-owners yet.</div>
              )}
            </div>

            <div className="glass-card project-section">
              <h3>Members ({project.members?.length || 0})</h3>

              {project.members?.length ? (
                project.members.map((member) => (
                  <div className="member-card" key={member._id}>
                    <div className="member-avatar">
                      {member.avatar?.url ? (
                        <img src={member.avatar.url} alt={member.username} />
                      ) : (
                        member.username?.charAt(0)?.toUpperCase()
                      )}
                    </div>

                    <span>
                      <strong>{member.username}</strong>
                      <span className="member-username">
                        @{member.username}
                      </span>
                    </span>
                  </div>
                ))
              ) : (
                <div className="member-card-empty">No members yet.</div>
              )}

              {project.members?.length > 0 && (
                <button
                  className="sidebar-section-footer"
                  onClick={() => setActiveTab("team")}
                >
                  View All Members
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {activeTab === "team" && (
        <div className="glass-card project-section">
          <h3>Project Team</h3>

          <div className="team-grid">
            <div className="team-group">
              <h4>
                Owner <span>1</span>
              </h4>

              <div className="member-card">
                <div className="member-avatar">
                  {project.owner?.username?.charAt(0)?.toUpperCase()}
                </div>

                <span>{project.owner?.username}</span>
              </div>
            </div>

            <div className="team-group">
              <h4>
                Co-Owners <span>{project.coOwners?.length || 0}</span>
              </h4>

              {project.coOwners?.length ? (
                project.coOwners.map((member) => (
                  <div key={member._id} className="member-card">
                    <div className="member-avatar">
                      {member.username?.charAt(0)?.toUpperCase()}
                    </div>

                    <span>{member.username}</span>
                  </div>
                ))
              ) : (
                <p>No co-owners yet.</p>
              )}
            </div>

            <div className="team-group">
              <h4>
                Members
                <span>
                  {project.members?.filter(
                    (member) => member._id !== project.owner?._id,
                  ).length || 0}
                </span>
              </h4>

              {project.members
                ?.filter((member) => member._id !== project.owner?._id)
                .map((member) => (
                  <div
                    key={member._id}
                    className="member-card member-card-manage"
                  >
                    <div className="member-avatar">
                      {member.avatar?.url ? (
                        <img src={member.avatar.url} alt={member.username} />
                      ) : (
                        member.username?.charAt(0)?.toUpperCase()
                      )}
                    </div>

                    <span>{member.username}</span>

                    {isOwner && (
                      <button
                        className="remove-member-btn"
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

      {activeTab === "gallery" && (
        <div className="glass-card project-section">
          <div className="section-header">
            <h3>Project Gallery ({project.images?.length || 0})</h3>

            {(isOwner || isCoOwner) && (
              <button
                className="btn-primary"
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
            style={{ display: "none" }}
            onChange={handleImageUpload}
          />

          {project.images?.length === 0 ? (
            <div className="empty-state">
              <h4>No Images Yet</h4>
              <p>This project hasn't uploaded any screenshots yet.</p>
            </div>
          ) : (
            <div className="project-gallery-grid">
              {project.images?.map((image, index) => (
                <div
                  key={image.publicId}
                  className="project-gallery-item"
                  onClick={() => {
                    setSelectedImage(index);
                    setShowGallery(true);
                  }}
                >
                  <img
                    src={image.url}
                    alt={`Project ${index + 1}`}
                    className="project-gallery-image"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "partnerships" && (
        <div className="glass-card project-section">
          {/* OWNER VIEW */}

          {isOwner && (
            <>
              <h3>Partnership Requests ({partnerships.length})</h3>

              {loadingPartnerships ? (
                <p>Loading requests...</p>
              ) : partnerships.length === 0 ? (
                <p>No partnership requests yet.</p>
              ) : (
                <div className="request-list">
                  {partnerships.map((request) => (
                    <div key={request._id} className="request-card">
                      <div className="request-user">
                        <div className="member-avatar">
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

                        <div>
                          <h4>{request.applicant?.username}</h4>

                          <p>{request.message || "No message provided"}</p>

                          <span className="request-status">
                            {request.status}
                          </span>
                        </div>
                      </div>

                      {request.status === "Pending" && (
                        <div className="request-actions">
                          <button
                            className="accept-btn"
                            onClick={() => handleAccept(request._id)}
                          >
                            Accept
                          </button>

                          <button
                            className="reject-btn"
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

          {/* MEMBER VIEW */}

          {isMember && !isOwner && (
            <div className="project-empty-state">
              <h3>Partnerships</h3>

              <p>You are already a member of this project.</p>
            </div>
          )}

          {/* PUBLIC VISITOR VIEW */}

          {isPublicVisitor && project.lookingForPartners && (
            <div className="partner-opportunity-card">
              <div className="partner-opportunity-header">
                <span className="partner-opportunity-badge">
                  Looking For Partners
                </span>
              </div>

              <h3>Become a Project Partner</h3>

              <p>
                This team is actively looking for collaborators. Submit a
                partnership request and tell the owner how you can contribute.
              </p>

              {!myRequest ? (
                <button
                  className="btn-primary"
                  onClick={() => setShowPartnershipModal(true)}
                >
                  Apply For Partnership
                </button>
              ) : (
                <div className="request-status-box">
                  Request Status: {myRequest.status}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "hiring" && (
        <div className="glass-cards project-section">
          <div className="section-header">
            <h3>Hiring Posts ({jobs.length})</h3>

            {isOwner && (
              <button
                className="btn-primary"
                onClick={() =>
                  navigate(`/jobs/create?projectId=${project._id}`)
                }
              >
                Create Job
              </button>
            )}
          </div>

          {loadingJobs ? (
            <p>Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💼</div>

              <h4>No hiring posts yet</h4>

              <p>
                Create your first job posting and start recruiting contributors.
              </p>
            </div>
          ) : (
            <div className="job-list">
              {jobs.map((job) => (
                <div key={job._id} className="job-card">
                  <div className="job-card-header">
                    <div>
                      <h4>{job.title}</h4>

                      <span className="job-role">{job.roleType}</span>
                    </div>

                    <span
                      className={`job-status ${
                        job.status === "Open" ? "open" : "closed"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <p className="job-description">{job.description}</p>

                  {job.requiredSkills?.length > 0 && (
                    <div className="job-skills">
                      {job.requiredSkills.map((skill) => (
                        <span key={skill} className="skill-pill">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="job-meta">
                    <span>👥 {job.applicationCount || 0} Applications</span>

                    <span>📍 {job.location}</span>

                    <span>{job.isRemote ? "🌍 Remote" : "🏢 On-site"}</span>

                    <span>
                      🕒 {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="job-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => navigate(`/jobs/${job._id}`)}
                    >
                      View
                    </button>

                    {isOwner && (
                      <div className="job-menu-wrapper">
                        <button
                          className="job-menu-btn"
                          onClick={() =>
                            setOpenJobMenu(
                              openJobMenu === job._id ? null : job._id,
                            )
                          }
                        >
                          ⋮
                        </button>

                        {openJobMenu === job._id && (
                          <div className="job-dropdown">
                            <button
                              onClick={() =>
                                navigate(`/jobs/${job._id}/applications`)
                              }
                            >
                              Applicants
                            </button>

                            <button
                              onClick={() => navigate(`/jobs/${job._id}/edit`)}
                            >
                              Edit Job
                            </button>

                            {job.status === "Open" && (
                              <button onClick={() => handleCloseJob(job._id)}>
                                Close Job
                              </button>
                            )}

                            <button
                              className="danger"
                              onClick={() => {
                                setSelectedJob(job);
                                setShowDeleteJobModal(true);
                                setOpenJobMenu(null);
                              }}
                            >
                              Delete Job
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

      {activeTab === "activity" && (
        <div className="glass-card project-section">
          <h3>Project Activity</h3>

          {loadingActivities ? (
            <p>Loading activity...</p>
          ) : activities.length === 0 ? (
            <p>No activity yet.</p>
          ) : (
            <div className="activity-list">
              {activities.map((activity) => (
                <div key={activity._id} className="activity-card">
                  <div className="activity-icon">⚡</div>

                  <div className="activity-content">
                    <h4>{activity.action}</h4>

                    <p>{activity.message}</p>

                    <span>{new Date(activity.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showPartnershipModal && (
        <div className="modal-overlay">
          <div className="glass-card partnership-modal">
            <h2>Partnership Request</h2>

            <p>
              Tell the project owner why you would like to join this project.
            </p>

            <textarea
              value={partnershipMessage}
              onChange={(e) => setPartnershipMessage(e.target.value)}
              placeholder="Describe your skills, experience, and how you can contribute..."
              rows={6}
            />

            <div className="modal-actions">
              <button
                className="btn-ghost"
                onClick={() => setShowPartnershipModal(false)}
              >
                Cancel
              </button>

              <button
                className="btn-primary"
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
        <div className="modal-overlay">
          <div className="glass-card delete-modal">
            <h2>Delete Project</h2>

            <p>
              Are you sure you want to delete
              <strong> {project.name}</strong>? This action cannot be undone.
            </p>

            <div className="modal-actions">
              <button
                className="btn-ghost"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>

              <button
                className="btn-danger"
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
        <div className="modal-overlay">
          <div className="glass-card confirmation-modal">
            <div className="confirmation-icon">🚪</div>

            <h2>Leave Project?</h2>

            <p>
              Are you sure you want to leave
              <strong> {project.name}</strong>? You will lose access to this
              project and will need another invitation or accepted partnership
              request to join again.
            </p>

            <div className="modal-actions">
              <button
                className="btn-ghost"
                onClick={() => setShowLeaveModal(false)}
              >
                Cancel
              </button>

              <button
                className="btn-danger"
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
        <div className="modal-overlay">
          <div className="glass-card delete-modal">
            <h2>Remove Member</h2>

            <p>
              Are you sure you want to remove
              <strong> {selectedMember.username}</strong>
              from <strong>{project.name}</strong>?
            </p>

            <div className="modal-actions">
              <button
                className="btn-ghost"
                onClick={() => {
                  setShowRemoveModal(false);
                  setSelectedMember(null);
                }}
              >
                Cancel
              </button>

              <button
                className="btn-danger"
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
        <div className="gallery-overlay">
          <button
            className="gallery-close"
            onClick={() => setShowGallery(false)}
          >
            ✕
          </button>

          {project.images?.length > 1 && (
            <button
              className="gallery-prev"
              onClick={() =>
                setSelectedImage((prev) =>
                  prev === 0 ? project.images.length - 1 : prev - 1,
                )
              }
            >
              ←
            </button>
          )}
          {currentImage && (
            <img className="gallery-image" src={currentImage.url} alt="" />
          )}

          {(isOwner || isCoOwner) && (
            <button
              className="gallery-delete"
              onClick={() =>
                handleDeleteImage(project.images?.[selectedImage].publicId)
              }
            >
              Delete Image
            </button>
          )}

          {project.images?.length > 1 && (
            <button
              className="gallery-next"
              onClick={() =>
                setSelectedImage((prev) =>
                  prev === project.images.length - 1 ? 0 : prev + 1,
                )
              }
            >
              →
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
