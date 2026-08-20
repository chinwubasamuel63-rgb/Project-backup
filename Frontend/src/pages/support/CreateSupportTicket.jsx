import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSupportTicket } from "../../services/supportService";
import { ChevronIcon } from "../../data/MockSupportData";
import "./supports.css"

export function CreateSupportTicket({ notify }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    course: "",
    lesson: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const result = await createSupportTicket(formData);
      notify("Support ticket created successfully");
      navigate(`/support/${result.ticket._id}`);
    } catch (error) {
      notify(error.response?.data?.message || "Failed creating ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="support-create-container">
      <button onClick={() => navigate(-1)} className="support-back-btn">
        <span className="support-back-icon">
          <ChevronIcon />
        </span>{" "}
        Back to Support
      </button>

      <div className="card support-create-card">
        <h1 className="support-create-title">Create Support Ticket</h1>
        <p className="support-create-subtitle">
          Provide details about your blocker so our instructors can assist you
          effectively.
        </p>

        <form onSubmit={handleSubmit} className="support-form">
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              required
              placeholder="e.g., Error deploying React application in Lesson 4"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Course</label>
              <input
                type="text"
                placeholder="e.g., Fullstack Web Development"
                value={formData.course}
                onChange={(e) =>
                  setFormData({ ...formData, course: e.target.value })
                }
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Lesson/Module</label>
              <input
                type="text"
                placeholder="e.g., Lesson 4: Routing"
                value={formData.lesson}
                onChange={(e) =>
                  setFormData({ ...formData, lesson: e.target.value })
                }
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value })
              }
              className="form-input form-select"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              required
              rows={6}
              placeholder="Describe your issue clearly. Include steps to reproduce or error messages if applicable."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="form-input form-textarea"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary submit-btn"
            >
              {loading ? "Submitting..." : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
