import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getOpenTickets,
  getAssignedTickets,
  getInstructorSupportOverview,
  getInstructorSupportActivity,
  claimSupportTicket,
} from "../../services/supportService";
import { COLORS } from "../../data/colors";
import SupportTicketList from "./SupportTicketList";
import SupportOverviewCard from "./SupportOverviewCard";
import SupportActivityCard from "./SupportActivityCard";
import "./support.css";

const TABS = ["Open Queue", "Assigned to Me", "Resolved"];

export function SupportInstructor({ notify }) {
  const showNotify = useMemo(
    () => (typeof notify === "function" ? notify : () => {}),
    [notify],
  );
  const [tab, setTab] = useState("Open Queue");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activityFeed, setActivityFeed] = useState([]);
  const [overview, setOverview] = useState({
    open: 0,
    assigned: 0,
    inProgress: 0,
    waitingForStudent: 0,
    resolved: 0,
  });
  const navigate = useNavigate();

  const overviewData = useMemo(() => {
    const total =
      (overview.open || 0) +
        (overview.inProgress || 0) +
        (overview.waitingForStudent || 0) +
        (overview.resolved || 0) || 1;

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

  const openCount = overview.open || 0;
  const assignedCount = overview.assigned || 0;
  const resolvedCount = overview.resolved || 0;

  const handleTabClick = (t) => setTab(t);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);

      const ticketsPromise =
        tab === "Assigned to Me"
          ? getAssignedTickets({
              limit: 5,
              status: ["Claimed", "In Progress", "Waiting For Student"],
            })
          : tab === "Resolved"
            ? getAssignedTickets({
                limit: 5,
                status: ["Resolved", "Closed"],
              })
            : getOpenTickets({ limit: 5 });

      const [ticketsResponse, overviewDataResponse, activityResponse] =
        await Promise.all([
          ticketsPromise,
          getInstructorSupportOverview(),
          getInstructorSupportActivity({ limit: 4 }),
        ]);

      setTickets(ticketsResponse.tickets || []);
      setOverview((current) => overviewDataResponse.overview || current);
      setActivityFeed(activityResponse.activityFeed || []);
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

  return (
    <div className="support-instructor-shell">
      <div className="support-hero">
        <div className="support-hero-content">
          <h1>Support Dashboard</h1>
          <p>
            Manage student support requests, claim tickets, and resolve blockers
            efficiently.
          </p>
        </div>

        <div className="support-hero-stats">
          <div className="hero-stat">
            <span>Open Queue</span>
            <strong>{openCount}</strong>
          </div>

          <div className="hero-stat">
            <span>Assigned</span>
            <strong>{assignedCount}</strong>
          </div>

          <div className="hero-stat">
            <span>Resolved</span>
            <strong>{resolvedCount}</strong>
          </div>
        </div>
      </div>

      {/* Tabs + Filters */}
      <div className="support-toolbar">
        <div className="support-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => handleTabClick(t)}
              className={`support-tab ${tab === t ? "active" : ""}`}
            >
              <span>{t}</span>

              <span className="support-tab-count">
                {t === "Open Queue"
                  ? openCount
                  : t === "Assigned to Me"
                    ? assignedCount
                    : resolvedCount}
              </span>
            </button>
          ))}
        </div>

        <div className="support-toolbar-actions">
          {tab !== "Open Queue" && (
            <button
              className="support-toolbar-link"
              onClick={() =>
                navigate(
                  `/support-instructor/all?tab=${encodeURIComponent(tab)}`,
                )
              }
            >
              View all
            </button>
          )}
        </div>
      </div>

      <div className="support-instructor-layout">
        <div className="support-instructor-main-col">
          <section className="support-ticket-grid">
            <SupportTicketList
              tickets={tickets}
              loading={loading}
              emptyMessage="No tickets match this queue yet. New requests will appear here as they come in."
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
          <SupportActivityCard activityFeed={activityFeed} loading={loading} />
        </aside>
      </div>
    </div>
  );
}
