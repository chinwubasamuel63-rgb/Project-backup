import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getMyProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  uploadCoverImage,
} from "../../services/profileService";

import "./editProfile.css";

export default function EditProfile() {
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [cover, setCover] = useState("");
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMyProfile();
        const user = data.user;

        setForm({
          displayName:
            user.displayName ||
            user.username ||
            `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          bio: user.bio || "",
          primaryTrack: user.primaryTrack || "",
          role: user.role || "student",
          skills: user.skills?.join(", ") || "",
          experienceLevel: user.experienceLevel || "beginner",
          portfolioUrl: user.portfolioUrl || "",
          githubUrl: user.githubUrl || "",
          linkedinUrl: user.linkedinUrl || "",
        });

        setAvatar(user.avatar?.url || "");
        setCover(user.coverImage?.url || "");
      } catch (error) {
        console.error("Profile loading failed", error);
      }
    };

    load();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setAvatarLoading(true);
      const formData = new FormData();
      formData.append("image", file);
      const data = await uploadAvatar(formData);
      setAvatar(data.avatar?.url || data.user?.avatar?.url || "");
    } catch (error) {
      console.error("Avatar upload failed", error);
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleAvatarDelete = async () => {
    try {
      setAvatarLoading(true);
      await deleteAvatar();
      setAvatar("");
    } catch (error) {
      console.error("Avatar delete failed", error);
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setCoverLoading(true);
      const formData = new FormData();
      formData.append("image", file);
      const data = await uploadCoverImage(formData);
      setCover(data.coverImage?.url || data.user?.coverImage?.url || "");
    } catch (error) {
      console.error("Cover upload failed", error);
    } finally {
      setCoverLoading(false);
    }
  };

  const submit = async () => {
    try {
      setSaving(true);
      await updateProfile({
        ...form,
        skills: form.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
      });
      navigate("/profile");
    } catch (error) {
      console.error("Profile update failed", error);
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return (
      <div className="edit-profile-page">
        <div className="edit-loading">
          <div className="loading-spinner" />
          Loading dashboard settings...
        </div>
      </div>
    );
  }

  return (
    <div className="edit-profile-page">
      <div className="dashboard-container">
        {/* Top Header Bar */}
        <header className="dashboard-header">
          <div>
            <h1>Account Settings</h1>
            <p>Customize your developer persona and professional details</p>
          </div>
          <div className="header-actions">
            <button className="btn-ghost" onClick={() => navigate("/profile")}>
              Cancel
            </button>
            <button className="btn-primary" onClick={submit} disabled={saving}>
              {saving ? "Saving Changes..." : "Save Profile"}
            </button>
          </div>
        </header>

        {/* Main Dashboard Layout */}
        <div className="dashboard-grid">
          {/* Left Sidebar Navigation & Live Preview */}
          <aside className="dashboard-sidebar">
            <div className="live-preview-card">
              <div
                className="preview-cover"
                style={{ backgroundImage: cover ? `url(${cover})` : undefined }}
              >
                <div className="preview-avatar">
                  {avatar ? (
                    <img src={avatar} alt="avatar" />
                  ) : (
                    <span>
                      {(form.displayName || "User").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="preview-details">
                <h3>{form.displayName || "Developer"}</h3>
                <span>
                  {form.role
                    ? form.role.charAt(0).toUpperCase() + form.role.slice(1)
                    : "Student"}
                </span>
              </div>
            </div>

            <nav className="dashboard-nav-tabs">
              <button
                className={
                  activeTab === "general" ? "nav-tab active" : "nav-tab"
                }
                onClick={() => setActiveTab("general")}
              >
                <span className="tab-icon">👤</span> General Information
              </button>
              <button
                className={activeTab === "media" ? "nav-tab active" : "nav-tab"}
                onClick={() => setActiveTab("media")}
              >
                <span className="tab-icon">🖼️</span> Cover & Avatar
              </button>
              <button
                className={
                  activeTab === "social" ? "nav-tab active" : "nav-tab"
                }
                onClick={() => setActiveTab("social")}
              >
                <span className="tab-icon">🌐</span> Links & Skills
              </button>
            </nav>
          </aside>

          {/* Right Content Panels */}
          <main className="dashboard-content">
            {activeTab === "general" && (
              <div className="content-panel">
                <div className="panel-header">
                  <h2>General Information</h2>
                  <p>
                    Update your personal identity, professional track, and bio
                    summary.
                  </p>
                </div>

                <div className="form-stack">
                  <div className="field-group">
                    <label>Display Name</label>
                    <input
                      name="displayName"
                      value={form.displayName}
                      onChange={handleChange}
                      placeholder="e.g. Alex Developer"
                    />
                  </div>

                  <div className="field-group">
                    <label>Primary Track / Role</label>
                    <input
                      name="primaryTrack"
                      value={form.primaryTrack}
                      onChange={handleChange}
                      placeholder="e.g. Full-Stack Engineer"
                    />
                  </div>

                  <div className="field-group">
                    <label>Experience Level</label>
                    <select
                      name="experienceLevel"
                      value={form.experienceLevel}
                      onChange={handleChange}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>

                  <div className="field-group full">
                    <label>Professional Bio</label>
                    <textarea
                      name="bio"
                      value={form.bio}
                      onChange={handleChange}
                      placeholder="Write a short summary about your background, goals, and tech stack..."
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "media" && (
              <div className="content-panel">
                <div className="panel-header">
                  <h2>Cover & Avatar Management</h2>
                  <p>
                    Upload high-resolution images to match your dashboard theme.
                  </p>
                </div>

                <div className="media-manager-grid">
                  {/* Cover Manager */}
                  <div className="media-box">
                    <label className="media-box-label">Cover Banner</label>
                    <div className="cover-preview-box">
                      {cover ? (
                        <img src={cover} alt="Cover preview" />
                      ) : (
                        <span>No cover uploaded</span>
                      )}
                      <label className="action-pill-btn">
                        {coverLoading ? "Uploading..." : "Change Cover"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverUpload}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Avatar Manager */}
                  <div className="media-box">
                    <label className="media-box-label">Profile Avatar</label>
                    <div className="avatar-preview-box">
                      <div className="large-avatar-preview">
                        {avatar ? (
                          <img src={avatar} alt="Avatar preview" />
                        ) : (
                          <span>
                            {(form.displayName || "User")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="avatar-action-row">
                        <label className="action-pill-btn">
                          {avatarLoading ? "Uploading..." : "Upload New"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                          />
                        </label>
                        {avatar && (
                          <button
                            className="delete-pill-btn"
                            onClick={handleAvatarDelete}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "social" && (
              <div className="content-panel">
                <div className="panel-header">
                  <h2>Web Links & Technical Stack</h2>
                  <p>
                    Connect your portfolio, GitHub, LinkedIn, and core skills.
                  </p>
                </div>

                <div className="form-stack">
                  <div className="field-group full">
                    <label>Skills (Comma-separated)</label>
                    <input
                      name="skills"
                      placeholder="React, Node.js, TypeScript, PostgreSQL"
                      value={form.skills}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="field-group">
                    <label>Portfolio Website</label>
                    <input
                      name="portfolioUrl"
                      placeholder="https://yourportfolio.dev"
                      value={form.portfolioUrl}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="field-group">
                    <label>GitHub Profile</label>
                    <input
                      name="githubUrl"
                      placeholder="https://github.com/username"
                      value={form.githubUrl}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="field-group full">
                    <label>LinkedIn Profile</label>
                    <input
                      name="linkedinUrl"
                      placeholder="https://linkedin.com/in/username"
                      value={form.linkedinUrl}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
