import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyTickets } from "../../services/supportService";
import { useAuth } from "../../hooks/useAuth";
import { ChevronIcon, PlusIcon } from "../../data/MockSupportData";
import "./support.css";

// Matching inline SVGs designed for the dashboard
function FolderIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}

function DocumentIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  );
}

function SupportChatIcon({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}

function getStatusClassName(status) {
  if (!status) return "status-open";

  const normalized = String(status).toLowerCase();

  if (normalized.includes("progress")) return "status-progress";
  if (normalized.includes("waiting")) return "status-waiting";
  if (normalized.includes("resolved") || normalized.includes("closed")) {
    return "status-resolved";
  }

  return "status-open";
}

export function SupportStudent({ notify }) {
  const showNotify = useMemo(
    () => (typeof notify === "function" ? notify : () => {}),
    [notify],
  );
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  const navigate = useNavigate();
  const { socket } = useAuth();

  const loadTickets = useCallback(async () => {
    try {
      setLoadingTickets(true);
      const data = await getMyTickets();
      setTickets(data.tickets || []);
    } catch (error) {
      showNotify(error.response?.data?.message || "Failed loading tickets");
    } finally {
      setLoadingTickets(false);
    }
  }, [showNotify]);

  useEffect(() => {
    void loadTickets();

    const handleWindowFocus = () => {
      void loadTickets();
    };

    window.addEventListener("focus", handleWindowFocus);

    return () => window.removeEventListener("focus", handleWindowFocus);
  }, [loadTickets]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleStatusUpdate = (event) => {
      if (!event?.ticket?._id) return;

      setTickets((currentTickets) =>
        currentTickets.map((ticket) =>
          String(ticket._id) === String(event.ticket._id)
            ? event.ticket
            : ticket,
        ),
      );
    };

    socket.on("support:status-updated", handleStatusUpdate);

    return () => socket.off("support:status-updated", handleStatusUpdate);
  }, [socket]);

  const openTickets = tickets.filter(
    (ticket) => ticket.status === "Open",
  ).length;

  const resolvedTickets = tickets.filter(
    (ticket) => ticket.status === "Resolved" || ticket.status === "Closed",
  ).length;

  return (
    <div className="support-page">
      {/* Top Header */}
      <div className="support-top-header">
        <div>
          <h1>Student Support Center</h1>
          <p>Resolve blockers faster with help from your course instructors.</p>
        </div>
      </div>

      {/* Stats Row */}
      <section className="support-stats-grid">
        <div className="support-stat-pill">
          <div className="stat-pill-icon purple">
            <FolderIcon size={22} />
          </div>
          <div className="stat-pill-content">
            <span>Open Tickets</span>
            <strong>{openTickets}</strong>
          </div>
        </div>

        <div className="support-stat-pill">
          <div className="stat-pill-icon emerald">
            <FolderIcon size={22} />
          </div>
          <div className="stat-pill-content">
            <span>Resolved Tickets</span>
            <strong>{resolvedTickets}</strong>
          </div>
        </div>

        <div className="support-stat-pill">
          <div className="stat-pill-icon blue">
            <DocumentIcon size={22} />
          </div>
          <div className="stat-pill-content">
            <span>Total Requests</span>
            <strong>{tickets.length}</strong>
          </div>
        </div>
      </section>

      {/* Tickets Header */}
      <div className="support-section-header">
        <div>
          <h3>My Support Tickets</h3>
          <p>Track your support requests</p>
        </div>
        <span className="ticket-count">{tickets.length} Tickets</span>
      </div>

      {/* Tickets List Container */}
      <section className="support-ticket-list">
        {loadingTickets ? (
          <div className="support-empty">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="support-empty">
            <SupportChatIcon size={32} />
            <h3>No support tickets yet</h3>
            <p>Create a ticket when you need assistance.</p>
          </div>
        ) : (
          tickets.map((ticket) => {
            const initial = ticket.title
              ? ticket.title.charAt(0).toUpperCase()
              : "T";

            return (
              <div
                className="support-ticket-card"
                key={ticket._id}
                onClick={() => navigate(`/support/${ticket._id}`)}
              >
                <div className="ticket-avatar-box">{initial}</div>

                <div className="ticket-info">
                  <h4>{ticket.title}</h4>
                  <p>{ticket.description?.slice(0, 90)}</p>
                </div>

                <span
                  className={`ticket-status ${getStatusClassName(ticket.status)}`}
                >
                  {ticket.status}
                </span>

                <span className="ticket-date">
                  {ticket.createdAt
                    ? new Date(ticket.createdAt).toLocaleDateString()
                    : "Unknown"}
                </span>

                <ChevronIcon />
              </div>
            );
          })
        )}
      </section>

      {/* Create Ticket CTA Card */}
      <section className="support-create-card">
        <div className="support-create-icon">
          <SupportChatIcon size={24} />
        </div>

        <div className="support-create-text">
          <h3>Need Help?</h3>
          <p>Create a support ticket and our instructors will assist you.</p>
        </div>

        <button
          className="support-create-btn"
          onClick={() => navigate("/support/create")}
        >
          Create Ticket
          <PlusIcon />
        </button>
      </section>
    </div>
  );
}
