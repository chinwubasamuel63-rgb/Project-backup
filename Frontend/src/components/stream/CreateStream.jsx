import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as streamService from "../../services/streamService";
import { getMyProjects } from "../../services/projectService";
import "./liveRoom.css";

const getUserFacingError = (serverMessage = "") => {
  const normalized = String(serverMessage || "").trim();

  if (!normalized) {
    return "We could not create the stream right now. Please review the details and try again.";
  }

  const lower = normalized.toLowerCase();

  if (
    lower.includes("already have an active stream") ||
    lower.includes("duplicate active stream")
  ) {
    return "You already have an active stream. End it before creating a new one.";
  }

  if (
    lower.includes("private streams require a project") ||
    lower.includes("project not found")
  ) {
    return "Select a valid project for this private stream.";
  }

  if (
    lower.includes("only project owners") ||
    lower.includes("co-owners") ||
    lower.includes("unauthorized")
  ) {
    return "Only project owners or co-owners can create private streams.";
  }

  if (lower.includes("title") && lower.includes("required")) {
    return "Please add a stream title before starting the room.";
  }

  if (
    lower.includes("invalid visibility") ||
    lower.includes("visibility type")
  ) {
    return "Choose a valid visibility option for this stream.";
  }

  if (
    lower.includes("network") ||
    lower.includes("failed to fetch") ||
    lower.includes("request failed")
  ) {
    return "Network error. Please check your connection and try again.";
  }

  if (lower.includes("thumbnail")) {
    return "The stream was created, but the thumbnail could not be uploaded. You can add one from the room.";
  }

  return "We could not create the stream right now. Please review the details and try again.";
};

const ChevronLeft = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

// Cloudinary's free tier caps storage/bandwidth -- an unbounded upload here
// is the easiest way to quietly blow through it. 5MB is generous for a
// thumbnail and keeps everyone on the same page before it ever reaches Cloudinary.
const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;

const ImageIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

const LiveBadgeIcon = () => (
  <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
    <defs>
      <linearGradient id="badgeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="50%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#6d28d9" />
      </linearGradient>

      <linearGradient id="badgeGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#38bdf8" />
      </linearGradient>

      <filter id="badgeGlow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="badgeShadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow
          dx="0"
          dy="8"
          stdDeviation="6"
          floodOpacity="0.3"
          floodColor="#a855f7"
        />
      </filter>

      <style>{`
        @keyframes pulse-ring {
          0% { 
            r: 70; 
            opacity: 0.8; 
            stroke-width: 1;
          }
          100% { 
            r: 85; 
            opacity: 0;
            stroke-width: 0.5;
          }
        }
        
        @keyframes pulse-dot {
          0%, 100% { 
            r: 11; 
            opacity: 1;
          }
          50% { 
            r: 13; 
            opacity: 0.8;
          }
        }
        
        @keyframes rotate-badge {
          0% { 
            transform: rotate(0deg); 
          }
          100% { 
            transform: rotate(360deg); 
          }
        }
        
        .live-pulse-ring {
          animation: pulse-ring 2s infinite;
        }
        
        .live-pulse-dot {
          animation: pulse-dot 1.5s ease-in-out infinite;
        }
        
        .live-rotate {
          transform-origin: 70px 70px;
          animation: rotate-badge 20s linear infinite;
        }
      `}</style>
    </defs>

    {/* Outer rotating ring */}
    <circle
      cx="70"
      cy="70"
      r="65"
      fill="none"
      stroke="url(#badgeGrad1)"
      strokeWidth="2"
      opacity="0.3"
      className="live-rotate"
      filter="url(#badgeShadow)"
    />

    {/* Pulsing outer ring */}
    <circle
      cx="70"
      cy="70"
      r="70"
      fill="none"
      stroke="url(#badgeGrad2)"
      strokeWidth="1"
      opacity="0.4"
      className="live-pulse-ring"
    />

    {/* Main badge circle */}
    <circle
      cx="70"
      cy="70"
      r="55"
      fill="url(#badgeGrad1)"
      filter="url(#badgeShadow)"
    />

    {/* Inner ring */}
    <circle
      cx="70"
      cy="70"
      r="55"
      fill="none"
      stroke="rgba(255, 255, 255, 0.15)"
      strokeWidth="1.5"
    />

    {/* Pulsing red dot (live indicator) */}
    <circle
      cx="70"
      cy="70"
      r="11"
      fill="#ff4444"
      className="live-pulse-dot"
      filter="url(#badgeGlow)"
    />

    {/* Broadcast wave effect */}
    <g opacity="0.6" strokeLinecap="round" strokeLinejoin="round">
      <circle
        cx="70"
        cy="70"
        r="30"
        fill="none"
        stroke="url(#badgeGrad2)"
        strokeWidth="1"
        opacity="0.4"
      />
      <circle
        cx="70"
        cy="70"
        r="42"
        fill="none"
        stroke="url(#badgeGrad2)"
        strokeWidth="0.8"
        opacity="0.2"
      />
    </g>
  </svg>
);

export default function CreateStream({ notify }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [fetchingProjects, setFetchingProjects] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    visibility: "public",
    project: "",
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [error, setError] = useState("");
  const [thumbnailUploadWarning, setThumbnailUploadWarning] = useState("");

  // State for post-creation flow
  const [createdStream, setCreatedStream] = useState(null);
  const [startingStream, setStartingStream] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setFetchingProjects(true);
        setError("");
        const response = await getMyProjects();
        const projectList = Array.isArray(response?.projects)
          ? response.projects
          : [];
        setProjects(projectList);

        if (form.visibility === "private" && form.project) {
          const selectedProjectStillExists = projectList.some(
            (project) => String(project._id) === String(form.project),
          );

          if (!selectedProjectStillExists) {
            setForm((current) => ({ ...current, project: "" }));
          }
        }
      } catch {
        setError(
          "Unable to load your projects right now. Please refresh and try again.",
        );
      } finally {
        setFetchingProjects(false);
      }
    };

    loadProjects();
    // Only refetch when visibility flips (e.g. into "private", where the
    // project list actually matters). This used to also depend on
    // form.project, which meant every single dropdown selection re-fetched
    // the entire project list from the server -- wasted API calls and a
    // flicker on every click.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.visibility]);

  useEffect(() => {
    if (!thumbnail) {
      const timerId = window.setTimeout(() => setThumbnailPreview(null), 0);
      return () => window.clearTimeout(timerId);
    }
    const url = URL.createObjectURL(thumbnail);
    const timerId = window.setTimeout(() => setThumbnailPreview(url), 0);
    return () => {
      window.clearTimeout(timerId);
      URL.revokeObjectURL(url);
    };
  }, [thumbnail]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
    setError("");
  };

  const setVisibility = (value) => {
    setForm((current) => ({ ...current, visibility: value }));
    setError("");
  };

  const handleStartStream = async () => {
    if (startingStream || !createdStream?._id) return;

    try {
      setStartingStream(true);
      setError("");

      const response = await streamService.startStream(createdStream._id);
      const nextStream = response?.stream || response;
      const startedStreamId =
        nextStream?._id || nextStream?.id || createdStream._id;

      if (!startedStreamId) {
        throw new Error("Stream start did not return a valid stream id.");
      }

      if (nextStream?.status && nextStream.status !== "started") {
        // keep silent; user-facing UI handles the start state
      }

      navigate(`/live/${startedStreamId}`);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "";
      setError(getUserFacingError(message));
    } finally {
      setStartingStream(false);
    }
  };

  const handleBackFromPreLive = () => {
    setCreatedStream(null);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      setError("Please add a stream title before starting the room.");
      return;
    }

    if (trimmedTitle.length < 3) {
      setError("Stream titles should be at least 3 characters long.");
      return;
    }

    if (form.visibility === "private") {
      if (!projects.length) {
        setError(
          "You do not have any valid project options for a private stream.",
        );
        return;
      }

      if (!form.project) {
        setError(
          "Private streams require a valid project. Please select one to continue.",
        );
        return;
      }

      const selectedProjectExists = projects.some(
        (project) => String(project._id) === String(form.project),
      );

      if (!selectedProjectExists) {
        setError("The selected project is not valid for this private stream.");
        return;
      }
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        title: trimmedTitle,
        description: form.description.trim(),
        visibility: form.visibility,
        ...(form.visibility === "private" ? { project: form.project } : {}),
      };

      const response = await streamService.createStream(payload);
      const stream = response?.stream || response;
      const streamId = stream?._id || stream?.id;

      if (!streamId) {
        throw new Error("Stream creation did not return a stream id.");
      }

      const normalizedStatus =
        stream?.status === "started"
          ? "started"
          : stream?.status === "ended"
            ? "ended"
            : "scheduled";

      if (!stream?.title) {
        throw new Error("Invalid stream response from server.");
      }

      // Try to upload thumbnail if provided (non-blocking)
      if (thumbnail) {
        try {
          await streamService.uploadThumbnail(streamId, thumbnail);
          setThumbnailUploadWarning("");
        } catch (uploadError) {
          // Show warning to user but don't block stream creation
          const errorMsg =
            uploadError?.response?.data?.message ||
            uploadError?.message ||
            "Could not upload thumbnail";
          setThumbnailUploadWarning(
            "⚠️ Thumbnail upload failed: " +
              errorMsg +
              ". Your stream was created successfully, but you can add a thumbnail later.",
          );
          notify?.("Thumbnail upload failed, but the stream was created.");
        }
      }

      notify?.("Stream created successfully.");

      // Stream created successfully - show pre-live configuration screen
      setCreatedStream({
        ...stream,
        _id: streamId,
        status: normalizedStatus,
      });
      setError("");
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "";
      setError(getUserFacingError(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cs-shell">
      {createdStream ? (
        <div className="cs-pre-live">
          <div className="cs-pre-live-card">
            {error ? <div className="banner-msg cs-error">{error}</div> : null}
            {thumbnailUploadWarning ? (
              <div className="banner-msg cs-warning">
                {thumbnailUploadWarning}
              </div>
            ) : null}

            <LiveBadgeIcon />

            <h2 className="cs-pre-live-title">Test live</h2>

            <div className="cs-live-name">
              {createdStream?.title || "Live test"}
            </div>

            <div className="cs-live-status-panel">
              <div className="cs-live-status-row">
                <span>Visibility</span>
                <strong>{createdStream?.visibility || "public"}</strong>
              </div>
              <div className="cs-live-status-row">
                <span>Status</span>
                <strong>{createdStream?.status || "scheduled"}</strong>
              </div>
            </div>

            <div className="cs-live-actions">
              <button
                className="btn-accent-pill cs-large-btn"
                onClick={handleStartStream}
                disabled={startingStream}
              >
                {startingStream ? "Starting…" : "Start Stream"}
              </button>
              <button
                className="btn-ghost-pill cs-large-btn"
                onClick={handleBackFromPreLive}
                disabled={startingStream}
              >
                Back
              </button>
            </div>

            <p className="cs-pre-live-note">
              Ensure your camera and microphone are ready before starting.
            </p>
          </div>
        </div>
      ) : (
        // Stream creation form
        <>
          <header className="cs-header">
            <button
              className="cs-back-button"
              onClick={() => navigate("/live")}
              aria-label="Back to live rooms"
            >
              <ChevronLeft />
              <span>Back</span>
            </button>
            <div className="cs-header-copy">
              <p className="cs-kicker">Creator studio</p>
              <h1>Create stream</h1>
            </div>
          </header>

          <div className="cs-body">
            <form className="cs-card" onSubmit={handleSubmit} noValidate>
              {error ? (
                <div className="banner-msg cs-error">{error}</div>
              ) : null}

              <div className="cs-field">
                <label className="cs-label" htmlFor="stream-title">
                  Stream title
                </label>
                <input
                  id="stream-title"
                  className="cs-input"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Morning standup stream"
                  aria-invalid={Boolean(error && !form.title.trim())}
                  required
                />
              </div>

              <div className="cs-field">
                <label className="cs-label" htmlFor="stream-description">
                  Description
                </label>
                <textarea
                  id="stream-description"
                  className="cs-textarea"
                  rows="4"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Tell people what this stream is about"
                />
              </div>

              <div className="cs-field">
                <label className="cs-label">Visibility</label>
                <div
                  className="cs-segmented"
                  role="radiogroup"
                  aria-label="Visibility"
                >
                  <button
                    type="button"
                    className={form.visibility === "public" ? "is-active" : ""}
                    onClick={() => setVisibility("public")}
                    role="radio"
                    aria-checked={form.visibility === "public"}
                  >
                    Public
                  </button>
                  <button
                    type="button"
                    className={form.visibility === "private" ? "is-active" : ""}
                    onClick={() => setVisibility("private")}
                    role="radio"
                    aria-checked={form.visibility === "private"}
                  >
                    Private
                  </button>
                </div>
              </div>

              {form.visibility === "private" ? (
                <div className="cs-field">
                  <label className="cs-label" htmlFor="stream-project">
                    Project
                  </label>
                  <select
                    id="stream-project"
                    className="cs-select"
                    name="project"
                    value={form.project}
                    onChange={handleChange}
                    disabled={fetchingProjects || !projects.length}
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.name || project.title || "Project"}
                      </option>
                    ))}
                  </select>
                  <small className="cs-hint">
                    Only authorized project members can access a private stream.
                    The backend remains the source of truth.
                  </small>
                </div>
              ) : null}

              <div className="cs-field">
                <label className="cs-label" htmlFor="stream-thumbnail">
                  Thumbnail
                </label>
                <label className="cs-file-field" htmlFor="stream-thumbnail">
                  {thumbnailPreview ? (
                    <img
                      src={thumbnailPreview}
                      alt=""
                      className="cs-file-preview"
                    />
                  ) : (
                    <span className="cs-file-icon">
                      <ImageIcon />
                    </span>
                  )}
                  <span className="cs-file-text">
                    <span className="cs-file-trigger">Choose file</span>
                    <span className="cs-file-name">
                      {thumbnail ? thumbnail.name : "No file chosen — optional"}
                    </span>
                  </span>
                  <input
                    id="stream-thumbnail"
                    className="cs-file-input"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;

                      if (!file) {
                        setThumbnail(null);
                        return;
                      }

                      if (file.size <= 0) {
                        setError(
                          "This file is empty or unreadable. Please choose a valid image file.",
                        );
                        event.target.value = "";
                        return;
                      }

                      const looksLikeImage =
                        file.type.startsWith("image/") ||
                        /\.(png|jpe?g|gif|webp|avif|heic|heif|bmp|svg|ico)$/i.test(
                          file.name || "",
                        );

                      if (!looksLikeImage) {
                        setError(
                          "Please choose an image file for the thumbnail.",
                        );
                        event.target.value = "";
                        return;
                      }

                      if (file.size > MAX_THUMBNAIL_BYTES) {
                        setError(
                          "Thumbnail is too large. Please choose an image under 5MB.",
                        );
                        event.target.value = "";
                        return;
                      }

                      setError("");
                      setThumbnail(file);
                    }}
                  />
                </label>
              </div>

              <div className="cs-actions">
                <button
                  className="btn-accent-pill"
                  type="submit"
                  disabled={loading || fetchingProjects}
                >
                  {loading ? "Creating…" : "Create stream"}
                </button>
                <button
                  type="button"
                  className="btn-ghost-pill"
                  onClick={() => navigate("/live")}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
