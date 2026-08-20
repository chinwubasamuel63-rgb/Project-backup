import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

import "./edit-project.css";

import {
  getProject,
  updateProject,
  uploadProjectImages,
  deleteProjectImage,
} from "../../services/projectService";

const EditProject = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [techInput, setTechInput] = useState("");
  const [imageError, setImageError] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deletingImage, setDeletingImage] = useState("");
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const fileInputRef = useRef(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [removeCoverImage, setRemoveCoverImage] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const coverInputRef = useRef(null);

  // snapshot of server values — used by Discard to reset without re-fetching
  const [originalData, setOriginalData] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    description: "",
    category: "Other",
    technologies: [],
    status: "Idea",
    visibility: "Public",
    lookingForPartners: false,
    lookingForTalent: false,
  });

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getProject(projectId);

      setProject(data.project);

      const snapshot = {
        name: data.project.name || "",
        tagline: data.project.tagline || "",
        description: data.project.description || "",
        category: data.project.category || "Other",
        technologies: data.project.technologies || [],
        status: data.project.status || "Idea",
        visibility: data.project.visibility || "Public",
        lookingForPartners: data.project.lookingForPartners || false,
        lookingForTalent: data.project.lookingForTalent || false,
      };

      setOriginalData(snapshot);

      setFormData(snapshot);
    } catch (error) {
      console.error(error);
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (authLoading || !user) return;

    const timerId = window.setTimeout(() => {
      void loadProject();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [authLoading, loadProject, user]);

  const isOwner =
    user &&
    project &&
    String(project.owner?._id) === String(user._id || user.id);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDiscard = useCallback(() => {
    if (!originalData) {
      navigate(`/projects/${projectId}`);
      return;
    }
    // reset form to server snapshot
    setFormData({ ...originalData });
    // clear any pending logo/cover changes
    setLogo(null);
    setLogoPreview("");
    setRemoveLogo(false);
    setCoverImage(null);
    setCoverPreview("");
    setRemoveCoverImage(false);
    setTechInput("");
  }, [originalData, projectId, navigate]);

  // Check if form has changes
  const hasFormChanges = useCallback(() => {
    if (!originalData) return false;

    // Check each form field
    for (const key in originalData) {
      if (key === "technologies") {
        // Compare arrays
        const original = originalData[key] || [];
        const current = formData[key] || [];
        if (original.length !== current.length) return true;
        for (let i = 0; i < original.length; i++) {
          if (original[i] !== current[i]) return true;
        }
      } else if (originalData[key] !== formData[key]) {
        return true;
      }
    }

    return false;
  }, [formData, originalData]);

  // Check if there are any pending changes (form or media)
  const hasChanges =
    hasFormChanges() || logo || removeLogo || coverImage || removeCoverImage;

  const addTechnology = () => {
    const value = techInput.trim();

    if (!value) return;

    if (formData.technologies.includes(value)) {
      setTechInput("");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      technologies: [...prev.technologies, value],
    }));

    setTechInput("");
  };

  const removeTechnology = (tech) => {
    setFormData((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((t) => t !== tech),
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);

    if (!files.length) return;

    const remainingSlots = 5 - (project.images?.length || 0);

    if (files.length > remainingSlots) {
      setImageError(
        `You can upload only ${remainingSlots} more image${
          remainingSlots === 1 ? "" : "s"
        }.`,
      );

      e.target.value = "";
      return;
    }

    setImageError("");

    try {
      setUploadingImages(true);

      const data = await uploadProjectImages(projectId, files);

      setProject((prev) => ({
        ...prev,
        images: data.images,
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  };

  const handleDeleteImage = async (publicId) => {
    try {
      setDeletingImage(publicId);

      const data = await deleteProjectImage(projectId, publicId);

      setProject((prev) => ({
        ...prev,
        images: data.images,
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingImage("");
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setCoverImage(file);
    setRemoveCoverImage(false);

    const reader = new FileReader();

    reader.onloadend = () => {
      setCoverPreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const projectData = new FormData();

      projectData.append("name", formData.name);
      projectData.append("tagline", formData.tagline);
      projectData.append("description", formData.description);
      projectData.append("category", formData.category);
      projectData.append("status", formData.status);
      projectData.append("visibility", formData.visibility);

      projectData.append("technologies", JSON.stringify(formData.technologies));

      projectData.append("lookingForPartners", formData.lookingForPartners);

      projectData.append("lookingForTalent", formData.lookingForTalent);

      if (logo) {
        projectData.append("logo", logo);
      }

      if (removeLogo) {
        projectData.append("removeLogo", "true");
      }

      if (coverImage) {
        projectData.append("coverImage", coverImage);
      }

      if (removeCoverImage) {
        projectData.append("removeCoverImage", "true");
      }

      await updateProject(projectId, projectData);

      navigate(`/projects/${projectId}`);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  /* ── guard states ── */

  if (authLoading) {
    return (
      <div className="ep-page">
        <div className="ep-state-card">Loading user...</div>
      </div>
    );
  }

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

  if (!isOwner) {
    return (
      <div className="ep-page">
        <div className="ep-denied-card">
          <div className="ep-denied-icon">🔒</div>
          <h2>Access Denied</h2>
          <p>
            Only the owner of this project can edit its settings, images,
            members, and opportunities.
          </p>
          <button
            className="ep-btn-primary"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            Back To Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ep-page">
      <form onSubmit={handleSubmit} className="ep-form">
        {/* ── sticky top bar ── */}
        <div className="ep-topbar">
          <button
            type="button"
            className="ep-btn-back"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Project
          </button>

          <div className="ep-topbar-right">
            {hasChanges && (
              <button
                type="button"
                className="ep-btn-ghost"
                onClick={handleDiscard}
              >
                Discard
              </button>
            )}
            <button type="submit" className="ep-btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <span className="ep-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    <path d="M17 21v-8H7v8M7 3v5h8" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        <div className="ep-body">
          {/* ── 🎨 BRANDING ── */}
          <section className="ep-section">
            <div className="ep-section-header">
              <span className="ep-section-emoji">🎨</span>
              <div>
                <div className="ep-section-title">Branding</div>
                <div className="ep-section-sub">
                  Cover image, logo and visual identity
                </div>
              </div>
            </div>

            {/* cover */}
            <div className="ep-cover-wrap">
              <div className="ep-cover-canvas">
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Cover"
                    className="ep-cover-img"
                  />
                ) : project.coverImage?.url ? (
                  <img
                    src={project.coverImage.url}
                    alt="Cover"
                    className="ep-cover-img"
                  />
                ) : (
                  <div className="ep-cover-empty">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.4"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                    <span>No Cover Image</span>
                  </div>
                )}

                {/* logo overlaid bottom-left of cover */}
                <div className="ep-logo-badge">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="ep-logo-img" />
                  ) : project.logo?.url ? (
                    <img
                      src={project.logo.url}
                      alt="Logo"
                      className="ep-logo-img"
                    />
                  ) : (
                    <span className="ep-logo-initial">
                      {formData.name?.charAt(0)?.toUpperCase() || "🚀"}
                    </span>
                  )}
                </div>
              </div>

              <div className="ep-branding-actions">
                <div className="ep-branding-col">
                  <span className="ep-branding-col-label">Cover Image</span>
                  <div className="ep-branding-btns">
                    <button
                      type="button"
                      className="ep-btn-upload"
                      onClick={() => coverInputRef.current.click()}
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
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Upload Cover
                    </button>
                    {(coverPreview || project.coverImage?.url) && (
                      <button
                        type="button"
                        className="ep-btn-remove"
                        onClick={() => {
                          setCoverImage(null);
                          setCoverPreview("");
                          setRemoveCoverImage(true);
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    ref={coverInputRef}
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                  />
                </div>

                <div className="ep-branding-divider" />

                <div className="ep-branding-col">
                  <span className="ep-branding-col-label">Project Logo</span>
                  <div className="ep-branding-btns">
                    <button
                      type="button"
                      className="ep-btn-upload"
                      onClick={() => fileInputRef.current?.click()}
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
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Upload Logo
                    </button>
                    {(logoPreview || project.logo?.url) && (
                      <button
                        type="button"
                        className="ep-btn-remove"
                        onClick={() => {
                          setLogo(null);
                          setLogoPreview("");
                          setProject((prev) => ({
                            ...prev,
                            logo: { publicId: "", url: "" },
                          }));
                          setRemoveLogo(true);
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleLogoChange}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── 📝 GENERAL INFORMATION ── */}
          <section className="ep-section">
            <div className="ep-section-header">
              <span className="ep-section-emoji">📝</span>
              <div>
                <div className="ep-section-title">General Information</div>
                <div className="ep-section-sub">
                  Name, tagline and description
                </div>
              </div>
            </div>

            <div className="ep-field-grid">
              <div className="ep-field">
                <label className="ep-label">Project Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Project Name"
                  className="ep-input"
                />
              </div>

              <div className="ep-field">
                <label className="ep-label">Tagline</label>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  placeholder="One-line pitch for your project"
                  className="ep-input"
                />
              </div>

              <div className="ep-field ep-field-full">
                <label className="ep-label">Description</label>
                <textarea
                  rows={6}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell people about your project — what it does, why it matters, and who it's for."
                  className="ep-textarea"
                />
              </div>
            </div>
          </section>

          {/* ── ⚙ PROJECT CONFIGURATION ── */}
          <section className="ep-section">
            <div className="ep-section-header">
              <span className="ep-section-emoji">⚙️</span>
              <div>
                <div className="ep-section-title">Project Configuration</div>
                <div className="ep-section-sub">
                  Category, status, visibility and tech stack
                </div>
              </div>
            </div>

            <div className="ep-field-grid">
              <div className="ep-field">
                <label className="ep-label">Category</label>
                <div className="ep-select-wrap">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="ep-select"
                  >
                    <option>Web</option>
                    <option>Mobile</option>
                    <option>AI/ML</option>
                    <option>Game Dev</option>
                    <option>Desktop</option>
                    <option>DevOps</option>
                    <option>Cybersecurity</option>
                    <option>Blockchain</option>
                    <option>Other</option>
                  </select>
                  <svg
                    className="ep-select-chevron"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>

              <div className="ep-field">
                <label className="ep-label">Status</label>
                <div className="ep-select-wrap">
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="ep-select"
                  >
                    <option>Idea</option>
                    <option>Building</option>
                    <option>Testing</option>
                    <option>Launched</option>
                    <option>Paused</option>
                    <option>Archived</option>
                  </select>
                  <svg
                    className="ep-select-chevron"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>

              <div className="ep-field">
                <label className="ep-label">Visibility</label>
                <div className="ep-select-wrap">
                  <select
                    name="visibility"
                    value={formData.visibility}
                    onChange={handleChange}
                    className="ep-select"
                  >
                    <option>Public</option>
                    <option>Private</option>
                  </select>
                  <svg
                    className="ep-select-chevron"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>

              <div className="ep-field ep-field-full">
                <label className="ep-label">Technologies</label>
                <div className="ep-tech-row">
                  <input
                    type="text"
                    value={techInput}
                    placeholder="Type a technology and press Enter or Add"
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTechnology();
                      }
                    }}
                    className="ep-input"
                  />
                  <button
                    type="button"
                    className="ep-btn-add"
                    onClick={addTechnology}
                  >
                    Add
                  </button>
                </div>

                <div className="ep-chip-grid">
                  {formData.technologies.map((tech) => (
                    <div key={tech} className="ep-chip">
                      <span>{tech}</span>
                      <button
                        type="button"
                        className="ep-chip-remove"
                        onClick={() => removeTechnology(tech)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── 🤝 COLLABORATION ── */}
          <section className="ep-section">
            <div className="ep-section-header">
              <span className="ep-section-emoji">🤝</span>
              <div>
                <div className="ep-section-title">Collaboration</div>
                <div className="ep-section-sub">
                  Let others know how they can contribute
                </div>
              </div>
            </div>

            <div className="ep-collab-grid">
              <label
                className={`ep-collab-card ${formData.lookingForPartners ? "ep-collab-card-active" : ""}`}
              >
                <input
                  type="checkbox"
                  name="lookingForPartners"
                  checked={formData.lookingForPartners}
                  onChange={handleChange}
                  className="ep-collab-checkbox"
                />
                <div
                  className={`ep-collab-check ${formData.lookingForPartners ? "ep-collab-check-active" : ""}`}
                >
                  {formData.lookingForPartners && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </div>
                <div className="ep-collab-icon">👥</div>
                <div>
                  <div className="ep-collab-title">Looking for Partners</div>
                  <div className="ep-collab-desc">
                    Find co-founders and collaborators who want to build
                    together.
                  </div>
                </div>
              </label>

              <label
                className={`ep-collab-card ${formData.lookingForTalent ? "ep-collab-card-active" : ""}`}
              >
                <input
                  type="checkbox"
                  name="lookingForTalent"
                  checked={formData.lookingForTalent}
                  onChange={handleChange}
                  className="ep-collab-checkbox"
                />
                <div
                  className={`ep-collab-check ${formData.lookingForTalent ? "ep-collab-check-active" : ""}`}
                >
                  {formData.lookingForTalent && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </div>
                <div className="ep-collab-icon">🛠️</div>
                <div>
                  <div className="ep-collab-title">Looking for Talent</div>
                  <div className="ep-collab-desc">
                    Hire developers and experts to join your project.
                  </div>
                </div>
              </label>
            </div>
          </section>

          {/* ── 🖼 GALLERY ── */}
          <section className="ep-section">
            <div className="ep-section-header">
              <span className="ep-section-emoji">🖼️</span>
              <div>
                <div className="ep-section-title">Gallery</div>
                <div className="ep-section-sub">
                  Screenshots and project visuals (max 5)
                </div>
              </div>
            </div>

            <div className="ep-gallery-grid">
              {project.images?.map((image) => (
                <div className="ep-gallery-item" key={image.publicId}>
                  <img
                    src={image.url}
                    alt="project screenshot"
                    className="ep-gallery-img"
                  />
                  <button
                    type="button"
                    className="ep-gallery-delete"
                    disabled={deletingImage === image.publicId}
                    onClick={() => handleDeleteImage(image.publicId)}
                  >
                    {deletingImage === image.publicId ? (
                      <span className="ep-spinner ep-spinner-sm" />
                    ) : (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}

              {(project.images?.length ?? 0) < 5 && (
                <label className="ep-gallery-upload">
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageUpload}
                    hidden
                  />
                  {uploadingImages ? (
                    <>
                      <span className="ep-spinner" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Add Screenshots
                    </>
                  )}
                </label>
              )}
            </div>

            {imageError && <div className="ep-image-error">{imageError}</div>}
            <p className="ep-image-hint">JPG, PNG or WEBP · Max 5 images</p>
          </section>

          {/* ── ⚠ DANGER ZONE ── */}
          <section className="ep-section ep-danger-section">
            <div className="ep-section-header">
              <span className="ep-section-emoji">⚠️</span>
              <div>
                <div className="ep-section-title ep-danger-title">
                  Danger Zone
                </div>
                <div className="ep-section-sub">
                  Irreversible actions — proceed with caution
                </div>
              </div>
            </div>

            <div className="ep-danger-row">
              <div>
                <div className="ep-danger-action-title">Delete Project</div>
                <div className="ep-danger-action-desc">
                  Permanently remove this project and all its data. This cannot
                  be undone.
                </div>
              </div>

              <button
                type="button"
                className="ep-btn-danger"
                onClick={() => setConfirmDelete(true)}
              >
                Delete Project
              </button>
            </div>
          </section>
        </div>
      </form>

      {/* ── Delete confirmation modal ── */}
      {confirmDelete && (
        <div
          className="ep-modal-overlay"
          onClick={() => setConfirmDelete(false)}
        >
          <div className="ep-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ep-modal-icon">🗑️</div>
            <h2 className="ep-modal-title">Delete Project</h2>
            <p className="ep-modal-body">
              Are you sure you want to delete{" "}
              <strong>{formData.name || "this project"}</strong>? This action
              cannot be undone.
            </p>
            <div className="ep-modal-actions">
              <button
                type="button"
                className="ep-btn-ghost"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ep-btn-danger-solid"
                onClick={() => navigate(`/projects`)}
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProject;
