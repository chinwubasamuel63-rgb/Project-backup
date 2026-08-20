import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStreams } from "../../services/streamService";
import "./liveRoom.css";

const SearchIcon = () => (
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
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const EyeIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const getStreamThumbnailUrl = (stream) => {
  const thumb = stream?.thumbnail;

  if (!thumb) return "";
  if (typeof thumb === "string") return thumb;

  return thumb.url || thumb.secure_url || thumb.src || "";
};

export default function LiveRooms({ notify }) {
  const navigate = useNavigate();
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("all");

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getStreams();
        const list = response?.streams || [];
        setStreams(list);
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          "Unable to load live streams right now.";
        setError(message);
        notify?.(message);
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();
  }, [notify]);

  const filteredStreams = useMemo(() => {
    return streams.filter((stream) => {
      const searchText = search.trim().toLowerCase();
      const matchesSearch =
        !searchText ||
        stream.title?.toLowerCase().includes(searchText) ||
        stream.description?.toLowerCase().includes(searchText) ||
        stream.host?.username?.toLowerCase().includes(searchText) ||
        stream.project?.name?.toLowerCase().includes(searchText);

      const matchesVisibility =
        visibilityFilter === "all" || stream.visibility === visibilityFilter;

      return matchesSearch && matchesVisibility;
    });
  }, [search, streams, visibilityFilter]);

  return (
    <div className="lr-shell">
      <header className="lr-header">
        <div className="lr-header-text">
          <h1>Live rooms</h1>
          <p>Browse active streams and join the room you want.</p>
        </div>
        <button
          className="btn-accent-pill"
          onClick={() => navigate("/live/create")}
        >
          Create stream
        </button>
      </header>

      <div className="lr-toolbar">
        <div className="lr-search">
          <SearchIcon />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, host, or project"
          />
        </div>

        <div className="cs-segmented lr-filter">
          {["all", "public", "private"].map((option) => (
            <button
              key={option}
              type="button"
              className={visibilityFilter === option ? "is-active" : ""}
              onClick={() => setVisibilityFilter(option)}
            >
              {option === "all"
                ? "All"
                : option === "public"
                  ? "Public"
                  : "Private"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="lr-state">
          <div className="lr-spinner" />
          <p>Loading live rooms…</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="lr-state lr-state-error">{error}</div>
      ) : null}

      {!loading && !error && filteredStreams.length === 0 ? (
        <div className="lr-state">
          <h3>No live rooms right now</h3>
          <p>There are no active streams that match your search.</p>
          <button
            className="btn-accent-pill"
            onClick={() => navigate("/live/create")}
          >
            Create a stream
          </button>
        </div>
      ) : null}

      {!loading && !error && filteredStreams.length > 0 ? (
        <div className="lr-grid">
          {filteredStreams.map((stream) => (
            <button
              key={stream._id}
              type="button"
              className="lr-card"
              onClick={() => navigate(`/live/${stream._id}`)}
            >
              <div className="lr-card-media">
                {getStreamThumbnailUrl(stream) ? (
                  <img src={getStreamThumbnailUrl(stream)} alt={stream.title} />
                ) : (
                  <div className="lr-card-placeholder">
                    <span>
                      {stream.title?.slice(0, 1)?.toUpperCase() || "L"}
                    </span>
                  </div>
                )}
                <span className="lr-pill-live">Live</span>
                <span className="lr-pill-viewers">
                  <EyeIcon /> {stream.totalViewers ?? stream.viewersCount ?? 0}
                </span>
              </div>

              <div className="lr-card-body">
                <div className="lr-card-header">
                  <h3>{stream.title || "Untitled stream"}</h3>
                  <span className={`lr-visibility ${stream.visibility}`}>
                    {stream.visibility || "public"}
                  </span>
                </div>

                {stream.description ? (
                  <p className="lr-card-desc">{stream.description}</p>
                ) : null}

                <div className="lr-card-footer">
                  <span className="lr-host">
                    <span className="lr-host-avatar">
                      {(stream.host?.username || "H").slice(0, 1).toUpperCase()}
                    </span>
                    {stream.host?.username || "Host"}
                  </span>
                  {stream.project?.name ? (
                    <span className="lr-project-tag">
                      {stream.project.name}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
