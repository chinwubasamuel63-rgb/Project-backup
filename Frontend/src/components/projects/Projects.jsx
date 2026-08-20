import { useEffect, useMemo, useState, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { getProjects } from "../../services/projectService";
import "./projects.css";

function ProjectFilterDropdown({ value, setValue, options, open, setOpen }) {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useLayoutEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    }
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !menuRef.current || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current.offsetHeight;
    const bottomSpace = window.innerHeight - rect.bottom;

    if (bottomSpace < menuHeight + 12 && rect.top > menuHeight + 12) {
      setCoords((previous) => ({
        ...previous,
        top: rect.top - menuHeight - 6,
      }));
    }
  }, [open, coords.left, coords.width]);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutside = (event) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({ top: rect.bottom + 6, left: rect.left, width: rect.width });
      }
    };

    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open, setOpen]);

  return (
    <div className={`proj-select-shell ${open ? "is-open" : ""}`}>
      <button
        type="button"
        ref={triggerRef}
        className="proj-select-trigger"
        onClick={() => setOpen(!open)}
      >
        {value}
        <Icon name="chevronDown" size={14} />
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              className="proj-select-menu proj-select-menu-portal"
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                width: Math.max(coords.width, 160),
              }}
            >
              {options.map((option) => (
                <button
                  type="button"
                  key={option}
                  className="proj-select-option"
                  onClick={() => {
                    setValue(option);
                    setOpen(false);
                  }}
                >
                  {option}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export default function Projects({ notify }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [accessFilter, setAccessFilter] = useState("All Access");
  const [openDropdown, setOpenDropdown] = useState(null); // null | "category" | "status" | "access"
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 8;

  const stats = useMemo(() => {
    const openProjects = projects.filter(
      (p) =>
        p.status === "Idea" ||
        p.status === "Building" ||
        p.status === "Testing",
    );

    const collaborating = projects.filter((p) => p.members?.length > 0);

    return [
      {
        icon: "folder",
        value: projects.length,
        label: "Total Projects",
        color: "#a855f7",
      },
      {
        icon: "open",
        value: openProjects.length,
        label: "Active Projects",
        color: "#34d399",
      },
      {
        icon: "bell",
        value: collaborating.length,
        label: "Collaborating",
        color: "#f59e0b",
      },
      {
        icon: "user",
        value: projects.length,
        label: "My Projects",
        color: "#38bdf8",
      },
    ];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const searchMatch =
        !search ||
        project.name?.toLowerCase().includes(search.toLowerCase()) ||
        project.tagline?.toLowerCase().includes(search.toLowerCase()) ||
        project.description?.toLowerCase().includes(search.toLowerCase()) ||
        project.technologies?.some((tech) =>
          tech.toLowerCase().includes(search.toLowerCase()),
        );

      const statusMatch =
        statusFilter === "All Status" || project.status === statusFilter;

      const categoryMatch =
        categoryFilter === "All Categories" ||
        project.category === categoryFilter;

      const accessMatch =
        accessFilter === "All Access" || project.visibility === accessFilter;

      return searchMatch && categoryMatch && statusMatch && accessMatch;
    });
  }, [projects, search, categoryFilter, statusFilter, accessFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProjects.length / projectsPerPage),
  );
  const visiblePage = Math.min(currentPage, totalPages);
  const visibleProjects = filteredProjects.slice(
    (visiblePage - 1) * projectsPerPage,
    visiblePage * projectsPerPage,
  );

  const statusClass = {
    Idea: "status-open",
    Building: "status-progress",
    Testing: "status-progress",
    Launched: "status-open",
    Paused: "status-closed",
    Archived: "status-closed",
  };

  const accessClass = {
    Public: "access-public",
    Private: "access-private",
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("All Categories");
    setStatusFilter("All Status");
    setAccessFilter("All Access");
    setCurrentPage(1);
    notify && notify("Filters cleared.");
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);

        const response = await getProjects();

        if (response.success) {
          setProjects(response.projects);
        }
      } catch (error) {
        console.error(error);

        notify?.(error.response?.data?.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    const timerId = window.setTimeout(() => {
      void fetchProjects();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [notify]);

  if (loading) {
    return (
      <div className="page-wrap projects-page-v2">
        <div className="glass-card">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="page-wrap projects-page-v2">
      <div className="proj-header-row">
        <div className="proj-header-bar" />
        <div className="proj-header-text">
          <h1>Projects</h1>
          <p>Discover, collaborate, and build amazing projects</p>
        </div>
        <button
          className="btn-create-project"
          onClick={() => navigate("/projects/create")}
        >
          <Icon name="plus" size={15} /> Create Project
        </button>
      </div>

      <div className="glass-card proj-filter-bar">
        <div className="proj-search-wrap">
          <Icon name="search" size={15} style={{ color: "#6b7494" }} />
          <input
            type="text"
            placeholder="Search projects"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <ProjectFilterDropdown
          value={categoryFilter}
          setValue={(value) => {
            setCategoryFilter(value);
            setCurrentPage(1);
          }}
          options={[
            "All Categories",
            "Web",
            "Mobile",
            "AI/ML",
            "Game Dev",
            "Desktop",
            "DevOps",
            "Cybersecurity",
            "Blockchain",
          ]}
          open={openDropdown === "category"}
          setOpen={(next) => setOpenDropdown(next ? "category" : null)}
        />
        <ProjectFilterDropdown
          value={statusFilter}
          setValue={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
          options={[
            "All Status",
            "Idea",
            "Building",
            "Testing",
            "Launched",
            "Paused",
            "Archived",
          ]}
          open={openDropdown === "status"}
          setOpen={(next) => setOpenDropdown(next ? "status" : null)}
        />
        <ProjectFilterDropdown
          value={accessFilter}
          setValue={(value) => {
            setAccessFilter(value);
            setCurrentPage(1);
          }}
          options={["All Access", "Public", "Private"]}
          open={openDropdown === "access"}
          setOpen={(next) => setOpenDropdown(next ? "access" : null)}
        />
        <button className="btn-clear-filters" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      <div className="glass-card proj-stats-bar">
        {stats.map((s) => (
          <div className="proj-stat-item" key={s.label}>
            <div className="proj-stat-orb" style={{ background: s.color }}>
              <Icon name={s.icon} size={18} />
            </div>
            <div>
              <div className="proj-stat-value">{s.value}</div>
              <div className="proj-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card proj-list">
        {visibleProjects.length === 0 ? (
          <div className="empty-state">
            <h3>No Projects Found</h3>
            <p>Create a project or adjust your filters.</p>
          </div>
        ) : (
          visibleProjects.map((p) => (
            <div className="proj-row" key={p._id}>
              <div className="proj-row-icon">
                {p.logo?.url ? (
                  <img
                    src={p.logo.url}
                    alt={p.name}
                    className="proj-cover-image"
                  />
                ) : (
                  <div className="proj-default-icon">
                    {p.name?.charAt(0)?.toUpperCase() || "🚀"}
                  </div>
                )}
              </div>

              <div className="proj-row-main">
                <div className="proj-row-title">{p.name}</div>
                <div className="proj-row-desc">
                  {p.tagline || p.description}
                </div>
                <div className="proj-row-stack">
                  {(p.technologies || []).slice(0, 3).map((s) => (
                    <span className="stack-chip" key={s}>
                      {s}
                    </span>
                  ))}
                  {(p.technologies || []).length > 3 && (
                    <span className="stack-chip stack-chip-more">
                      +{p.technologies.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="proj-row-col">
                <div className="proj-col-label">Status</div>
                <span className={`proj-status-pill ${statusClass[p.status]}`}>
                  {p.status}
                </span>
              </div>

              <div className="proj-row-col">
                <div className="proj-col-label">Access</div>
                <span
                  className={`proj-access-pill ${accessClass[p.visibility]}`}
                >
                  {p.visibility}
                </span>
              </div>

              <div className="proj-row-col">
                <div className="proj-col-label">Created</div>
                <div className="proj-col-value">
                  {new Date(p.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="proj-row-col proj-row-members">
                <div className="proj-col-label">Members</div>

                <div className="avatar-stack">
                  {p.members?.slice(0, 3).map((member) => (
                    <div className="mini-avatar" key={member._id}>
                      {member.avatar?.url ? (
                        <img
                          src={member.avatar.url}
                          alt={member.username}
                          className="mini-avatar-img"
                        />
                      ) : (
                        member.username?.charAt(0)?.toUpperCase()
                      )}
                    </div>
                  ))}

                  {(p.members?.length || 0) > 3 && (
                    <span className="avatar-more">
                      +{(p.members?.length || 0) - 3}
                    </span>
                  )}
                </div>
              </div>

              <button
                className="btn-view-details"
                onClick={() => navigate(`/projects/${p._id}`)}
              >
                View Details
              </button>
            </div>
          ))
        )}
      </div>

      <div className="proj-pagination-row">
        <span className="proj-showing-label">
          Showing{" "}
          {filteredProjects.length === 0
            ? 0
            : (currentPage - 1) * projectsPerPage + 1}{" "}
          to {Math.min(currentPage * projectsPerPage, filteredProjects.length)}{" "}
          of {filteredProjects.length} projects
        </span>
        <div className="proj-pagination">
          <button
            className="page-arrow"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            aria-label="Previous projects page"
          >
            <Icon name="chevronLeft" size={14} />
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <button
                key={page}
                className={`page-num${currentPage === page ? " page-num-active" : ""}`}
                onClick={() => setCurrentPage(page)}
                aria-label={`Projects page ${page}`}
              >
                {page}
              </button>
            ),
          )}
          <button
            className="page-arrow"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
            aria-label="Next projects page"
          >
            <Icon name="chevronRight" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- icons ---------------- */

const ICON_PATHS = {
  folder: (
    <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
  ),
  open: (
    <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v1H6l-2 7H3V7z M6 12l-1.5 6.5A1.5 1.5 0 006 20.5h13a1.5 1.5 0 001.45-1.13L21.5 13H8" />
  ),
  bell: (
    <>
      <path d="M6 16V11a6 6 0 1112 0v5l1.6 2.4H4.4L6 16z" />
      <path d="M9.5 20.5a2.5 2.5 0 005 0" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.3" />
      <path d="M5 20c.8-3.6 3.3-5.6 7-5.6s6.2 2 7 5.6" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.2-3.2" />
    </>
  ),
  chevronDown: <path d="M6 9l6 6 6-6" />,
  chevronLeft: <path d="M15 18l-6-6 6-6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  AI: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </>
  ),
  leaf: (
    <path d="M19 4c-7 0-13 5-13 13 0 1.5.3 2.5.3 2.5S8 19 9 18C16 16 19 11 19 4z M6 19c2-4 5-7 9-9" />
  ),
  grad: (
    <>
      <path d="M12 4L2 9l10 5 10-5-10-5z" />
      <path d="M6 11.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" />
    </>
  ),
  game: (
    <>
      <rect x="3" y="8" width="18" height="9" rx="3" />
      <path d="M8 11v3M6.5 12.5h3" />
      <circle cx="16" cy="11.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="18" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
};

function Icon({ name, size = 18, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}
