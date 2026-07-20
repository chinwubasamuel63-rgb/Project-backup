import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { createJob } from "../../services/jobService";
import { getMyProjects } from "../../services/projectService";

import "./jobs.css";

const CreateJob = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const projectIdFromUrl = searchParams.get("projectId");

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [skillInput, setSkillInput] = useState("");

  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    roleType: "",
    requiredSkills: [],
    location: "Remote",
    isRemote: true,
    expiresAt: "",
    projectId: projectIdFromUrl || "",
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);

      const data = await getMyProjects();

      setProjects(data.projects || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const addSkill = () => {
    const value = skillInput.trim();

    if (!value) return;

    if (formData.requiredSkills.includes(value)) {
      setSkillInput("");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      requiredSkills: [...prev.requiredSkills, value],
    }));

    setSkillInput("");
  };

  const removeSkill = (skill) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((s) => s !== skill),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await createJob(formData);

      if (formData.projectId) {
        navigate(`/projects/${formData.projectId}`);
      } else {
        navigate("/jobs");
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to create job");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrap">
      <form className="glass-card create-job-form" onSubmit={handleSubmit}>
        <div className="page-header">
          <div>
            <h1>Create Job</h1>
            <p>Find developers and talent for your project.</p>
          </div>

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Creating..." : "Create Job"}
          </button>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Project</label>

            <select
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              disabled={!!projectIdFromUrl || loadingProjects}
            >
              <option value="">Select Project</option>

              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Role Title</label>

            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Frontend Developer"
              required
            />
          </div>

          <div className="form-group">
            <label>Role Type</label>

            <input
              type="text"
              name="roleType"
              value={formData.roleType}
              onChange={handleChange}
              placeholder="React Developer"
              required
            />
          </div>

          <div className="form-group">
            <label>Location</label>

            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          <div className="form-group form-group-full">
            <label>Description</label>

            <textarea
              rows={7}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the role..."
              required
            />
          </div>

          <div className="form-group form-group-full">
            <label>Required Skills</label>

            <div className="tech-input-row">
              <input
                type="text"
                value={skillInput}
                placeholder="React"
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />

              <button type="button" className="btn-primary" onClick={addSkill}>
                Add
              </button>
            </div>

            <div className="tech-chip-grid">
              {formData.requiredSkills.map((skill) => (
                <div key={skill} className="tech-chip">
                  <span>{skill}</span>

                  <button type="button" onClick={() => removeSkill(skill)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="isRemote"
                checked={formData.isRemote}
                onChange={handleChange}
              />
              Remote Position
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateJob;