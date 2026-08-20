import { FunnelIcon } from "../../data/InstructorData";
import "./support.css";

export default function SupportActivityCard({ activityFeed, loading = false }) {
  return (
    <div className="support-instructor-side-card glass-card support-instructor-activity-card">
      <h3>Recent Activity</h3>
      <div className="support-instructor-activity-list">
        {loading ? (
          <div
            className="support-skeleton-list support-skeleton-list-compact"
            aria-live="polite"
          >
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`activity-skeleton-${index}`}
                className="support-skeleton-row"
              >
                <div className="support-skeleton-avatar support-skeleton-avatar-small" />
                <div className="support-skeleton-body">
                  <div className="support-skeleton-line support-skeleton-line-md" />
                  <div className="support-skeleton-line support-skeleton-line-sm" />
                </div>
              </div>
            ))}
          </div>
        ) : activityFeed.length === 0 ? (
          <div className="support-empty-state support-empty-state-inline">
            <div className="support-empty-icon">✦</div>
            <h3>No recent activity</h3>
            <p>
              Workflow updates will appear here as tickets move through the
              queue.
            </p>
          </div>
        ) : (
          activityFeed.map((item, index) => (
            <div
              key={`${item.ticketNumber}-${item.createdAt}-${index}`}
              className="support-instructor-activity-item"
            >
              <div className="support-instructor-activity-icon">
                <FunnelIcon />
              </div>
              <div className="support-instructor-activity-copy">
                <div className="support-instructor-activity-title">
                  #{item.ticketNumber} · {item.ticketTitle}
                </div>
                <div className="support-instructor-activity-meta">
                  Status changed to {item.status} for {item.student}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
