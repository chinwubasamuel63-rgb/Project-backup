import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createProject } from "../../services/projectService";
import AlertModal from "../../components/ui/AlertModal";
import "./project.css";

const CreateProject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [techInput, setTechInput] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    description: "",
    category: "Other",
    visibility: "Public",
    status: "Idea",
    technologies: [],
    lookingForPartners: false,
    lookingForTalent: false,
  });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTechKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && techInput.trim()) {
      e.preventDefault();
      const newTech = techInput.trim().replace(/,$/, "");
      if (newTech && !formData.technologies.includes(newTech)) {
        setFormData((prev) => ({
          ...prev,
          technologies: [...prev.technologies, newTech],
        }));
      }
      setTechInput("");
    }
  };

  const removeTech = (tech) => {
    setFormData((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((t) => t !== tech),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setAlertMessage("Project name is required");
      return;
    }

    try {
      setLoading(true);

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

      if (coverImage) {
        projectData.append("coverImage", coverImage);
      }

      const response = await createProject(projectData);

      if (response.success) {
        navigate(`/projects/${response.project._id}`);
      }
    } catch (error) {
      console.error(error);

      setAlertMessage(
        error.response?.data?.message || "Failed to create project",
      );
    } finally {
      setLoading(false);
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
    setCoverPreview(URL.createObjectURL(file));
  };

  const statusColors = {
    Idea: "#a78bfa",
    Building: "#34d399",
    Testing: "#fbbf24",
    Launched: "#60a5fa",
    Paused: "#f87171",
    Archived: "#9ca3af",
  };

  return (
    <div className="cp-page">
      <AlertModal message={alertMessage} onClose={() => setAlertMessage("")} />
      {/* Top bar */}
      <div className="cp-topbar">
        <div>
          <h1 className="cp-title">Create Project</h1>
          <p className="cp-subtitle">
            Launch your next big idea and build something amazing with the
            community.
          </p>
        </div>
        <button className="cp-back-btn" onClick={() => navigate("/projects")}>
          ← Back to Projects
        </button>
      </div>

      <div className="cp-layout">
        {/* LEFT: Form */}
        <form className="cp-form" onSubmit={handleSubmit}>
          {/* Project Information */}
          <div className="cp-section">
            <div className="cp-section-header">
              <span className="cp-section-icon">🗂</span>
              <span className="cp-section-label">Project Information</span>
            </div>

            <div className="cp-field">
              <label className="cp-label">
                Project Name <span className="cp-required">*</span>
              </label>
              <input
                className="cp-input"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="DevStream Nexus"
                required
              />
            </div>

            <div className="cp-field">
              <label className="cp-label">Tagline</label>
              <input
                className="cp-input"
                type="text"
                name="tagline"
                value={formData.tagline}
                onChange={handleChange}
                placeholder="Learn, Build, Stream"
              />
            </div>

            <div className="cp-field">
              <label className="cp-label">
                Description <span className="cp-required">*</span>
              </label>
              <textarea
                className="cp-textarea"
                rows="5"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your project..."
                maxLength={500}
              />
              <span className="cp-char-count">
                {formData.description.length}/500
              </span>
            </div>

            <div className="project-logo-section">
              <div className="project-logo-info">
                <h4>Project Logo</h4>
                <p>PNG, JPG or WEBP. Maximum size 5MB.</p>

                <button
                  type="button"
                  className="logo-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logo ? "Change Logo" : "Upload Logo"}
                </button>

                <input
                  ref={fileInputRef}
                  className="logo-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                />

                {logo && <span className="logo-selected">✓ {logo.name}</span>}
              </div>
            </div>

            <div className="project-cover-section">
              {coverPreview ? (
                <img src={coverPreview} className="project-cover-preview" />
              ) : (
                <div className="project-cover-placeholder">
                  Upload Cover Image
                </div>
              )}

              <button
                type="button"
                className="btn-primary-cover"
                onClick={() => coverInputRef.current?.click()}
              >
                Upload Cover
              </button>

              <input
                ref={coverInputRef}
                hidden
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
              />
            </div>

            <div className="cp-row">
              <div className="cp-field">
                <label className="cp-label">Category</label>
                <select
                  className="cp-select"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="Web">Web</option>
                  <option value="Mobile">Mobile</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="Game Dev">Game Dev</option>
                  <option value="Desktop">Desktop</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Blockchain">Blockchain</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="cp-field">
                <label className="cp-label">Status</label>
                <select
                  className="cp-select"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Idea">Idea</option>
                  <option value="Building">Building</option>
                  <option value="Testing">Testing</option>
                  <option value="Launched">Launched</option>
                  <option value="Paused">Paused</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div className="cp-field">
                <label className="cp-label">Visibility</label>
                <select
                  className="cp-select"
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleChange}
                >
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                </select>
              </div>
            </div>

            <div className="cp-field">
              <label className="cp-label">Technologies</label>
              <div className="cp-tech-wrap">
                {formData.technologies.map((tech) => (
                  <span key={tech} className="cp-tech-chip">
                    {tech}
                    <button
                      type="button"
                      className="cp-tech-remove"
                      onClick={() => removeTech(tech)}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  className="cp-tech-input"
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={handleTechKeyDown}
                  placeholder={
                    formData.technologies.length === 0
                      ? "Add technologies..."
                      : ""
                  }
                />
              </div>
            </div>
          </div>

          {/* Project Opportunities */}
          <div className="cp-section">
            <div className="cp-section-header">
              <span className="cp-section-icon">🤝</span>
              <span className="cp-section-label">Project Opportunities</span>
            </div>
            <p className="cp-section-desc">
              Let others know how they can contribute to your project.
            </p>

            <div className="cp-opportunity-row">
              <label
                className={`cp-opportunity-card ${formData.lookingForPartners ? "active" : ""}`}
              >
                <input
                  type="checkbox"
                  name="lookingForPartners"
                  checked={formData.lookingForPartners}
                  onChange={handleChange}
                  className="cp-opp-checkbox"
                />
                <div className="cp-opp-check">
                  {formData.lookingForPartners ? "✓" : ""}
                </div>
                <div className="cp-opp-icon">👥</div>
                <div>
                  <div className="cp-opp-title">Looking for Partners</div>
                  <div className="cp-opp-desc">
                    Find co-founders and collaborators who want to build
                    together.
                  </div>
                </div>
              </label>

              <label
                className={`cp-opportunity-card ${formData.lookingForTalent ? "active" : ""}`}
              >
                <input
                  type="checkbox"
                  name="lookingForTalent"
                  checked={formData.lookingForTalent}
                  onChange={handleChange}
                  className="cp-opp-checkbox"
                />
                <div className="cp-opp-check">
                  {formData.lookingForTalent ? "✓" : ""}
                </div>
                <div className="cp-opp-icon">🛠</div>
                <div>
                  <div className="cp-opp-title">Looking for Talent</div>
                  <div className="cp-opp-desc">
                    Hire developers and experts to join your project.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="cp-submit-btn" disabled={loading}>
            {loading ? "Creating..." : "Create Project"}
          </button>
        </form>

        {/* RIGHT: Live Preview */}
        <div className="cp-preview-col">
          <div className="cp-section cp-preview-section">
            <div className="cp-section-header">
              <span className="cp-section-icon">👁</span>
              <span className="cp-section-label">Live Preview</span>
            </div>
            <p className="cp-section-desc">
              See how your project will appear to others.
            </p>

            <div className="cp-preview-card">
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Project cover preview"
                  className="cp-preview-cover"
                />
              ) : null}

              {/* Project icon placeholder */}
              <div className="cp-preview-icon">
                {logoPreview ? (
                  <img src={logoPreview} alt="Project Logo" />
                ) : (
                  <span className="cp-preview-emoji">
                    {formData.name?.charAt(0)?.toUpperCase() || "🚀"}
                  </span>
                )}
              </div>

              <div
                className="cp-preview-status-badge"
                style={{ color: statusColors[formData.status] || "#a78bfa" }}
              >
                ● {formData.status || "Idea"}
              </div>

              <h2 className="cp-preview-name">
                {formData.name || "Project Name"}
              </h2>
              <p className="cp-preview-tagline">
                {formData.tagline || "Your tagline here"}
              </p>
              <p className="cp-preview-desc">
                {formData.description
                  ? formData.description.length > 100
                    ? formData.description.slice(0, 100) + "..."
                    : formData.description
                  : "Your project description will appear here."}
              </p>

              {formData.category && (
                <div className="cp-preview-meta">
                  <span className="cp-preview-meta-item">
                    🌐 {formData.category}
                  </span>
                  <span className="cp-preview-meta-item">
                    👁 {formData.visibility}
                  </span>
                </div>
              )}

              {formData.technologies.length > 0 && (
                <div className="cp-preview-tech-section">
                  <div className="cp-preview-tech-label">Technologies</div>
                  <div className="cp-preview-tech-list">
                    {formData.technologies.slice(0, 3).map((t) => (
                      <span key={t} className="cp-preview-tech-chip">
                        {t}
                      </span>
                    ))}
                    {formData.technologies.length > 3 && (
                      <span className="cp-preview-tech-chip">
                        +{formData.technologies.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {(formData.lookingForPartners || formData.lookingForTalent) && (
                <div className="cp-preview-looking">
                  <div className="cp-preview-tech-label">Looking for:</div>
                  <div className="cp-preview-looking-icons">
                    {formData.lookingForPartners && (
                      <span
                        className="cp-preview-looking-icon"
                        title="Partners"
                      >
                        👥
                      </span>
                    )}
                    {formData.lookingForTalent && (
                      <span className="cp-preview-looking-icon" title="Talent">
                        🛠
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
