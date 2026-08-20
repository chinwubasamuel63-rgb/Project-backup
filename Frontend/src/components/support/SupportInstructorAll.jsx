import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getOpenTickets,
  getAssignedTickets,
  getInstructorSupportOverview,
  claimSupportTicket,
} from "../../services/supportService";
import { COLORS } from "../../data/colors";
import SupportTicketList from "./SupportTicketList";
import SupportOverviewCard from "./SupportOverviewCard";
import "./support.css";

export default function SupportInstructorAll({ notify }) {
  const showNotify = useMemo(
    () => (typeof notify === "function" ? notify : () => {}),
    [notify],
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState({
    open: 0,
    assigned: 0,
    inProgress: 0,
    waitingForStudent: 0,
    resolved: 0,
  });
  const navigate = useNavigate();
  const tab = searchParams.get("tab") || "Assigned to Me";

  const overviewData = useMemo(() => {
    const total =
      overview.open +
        overview.inProgress +
        overview.waitingForStudent +
        overview.resolved || 1;

    return [
      {
        label: "Open",
        pct: Math.round((overview.open / total) * 100),
        color: COLORS.purple,
      },
      {
        label: "In Progress",
        pct: Math.round((overview.inProgress / total) * 100),
        color: "#60a5fa",
      },
      {
        label: "Waiting for Student",
        pct: Math.round((overview.waitingForStudent / total) * 100),
        color: "#f59e0b",
      },
      {
        label: "Resolved",
        pct: Math.round((overview.resolved / total) * 100),
        color: COLORS.green,
      },
    ];
  }, [overview]);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);

      const ticketsPromise =
        tab === "Resolved"
          ? getAssignedTickets({
              status: ["Resolved", "Closed"],
            })
          : tab === "Assigned to Me"
            ? getAssignedTickets()
            : getOpenTickets();

      const [ticketsResponse, overviewResponse] = await Promise.all([
        ticketsPromise,
        getInstructorSupportOverview(),
      ]);

      setTickets(ticketsResponse.tickets || []);
      setOverview((current) => overviewResponse.overview || current);
    } catch (error) {
      showNotify(error.response?.data?.message || "Failed loading tickets");
    } finally {
      setLoading(false);
    }
  }, [showNotify, tab]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadTickets();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadTickets]);

  const switchTab = (nextTab) => {
    setSearchParams({ tab: nextTab });
  };

  return (
    <div className="support-instructor-shell">
      <div className="support-all-topbar">
        <button
          className="support-all-back-btn"
          onClick={() => navigate("/support-instructor")}
        >
          Back to dashboard
        </button>
      </div>

      <div className="support-hero">
        <div className="support-hero-content">
          <h1>All Support Tickets</h1>
          <p>
            Browse the full instructor support queue for the currently selected
            tab.
          </p>
        </div>
      </div>

      <div className="support-toolbar">
        <div className="support-tabs">
          {["Assigned to Me", "Resolved"].map((option) => (
            <button
              key={option}
              onClick={() => switchTab(option)}
              className={`support-tab ${tab === option ? "active" : ""}`}
            >
              <span>{option}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="support-instructor-layout">
        <div className="support-instructor-main-col">
          <section className="support-ticket-grid">
            <SupportTicketList
              tickets={tickets}
              loading={loading}
              emptyMessage="No tickets match this queue yet. New requests will appear here when students submit them."
              onTicketClick={(ticket) => navigate(`/support/${ticket._id}`)}
              onClaimTicket={(ticket) => {
                claimSupportTicket(ticket._id)
                  .then(() => {
                    showNotify(`Ticket ${ticket.ticketNumber} claimed`);
                    loadTickets();
                  })
                  .catch((err) => {
                    showNotify(
                      err.response?.data?.message || "Unable to claim ticket",
                    );
                  });
              }}
            />
          </section>
        </div>

        <aside className="support-instructor-side-col">
          <SupportOverviewCard overviewData={overviewData} loading={loading} />
        </aside>
      </div>
    </div>
  );
}
