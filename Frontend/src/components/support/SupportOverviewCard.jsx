import { OverviewDonut } from "../../data/InstructorData";
import "./support.css";

function getOverviewDotClass(label) {
  if (!label) return "overview-dot-open";

  const normalized = String(label).toLowerCase();

  if (normalized.includes("progress")) return "overview-dot-progress";
  if (normalized.includes("waiting")) return "overview-dot-waiting";
  if (normalized.includes("resolved")) return "overview-dot-resolved";

  return "overview-dot-open";
}

export default function SupportOverviewCard({ overviewData, loading = false }) {
  return (
    <div className="support-instructor-side-card glass-card support-instructor-overview-card">
      <h3>Ticket Overview</h3>
      {loading ? (
        <div
          className="support-instructor-overview-body support-instructor-overview-body-loading"
          aria-live="polite"
        >
          <div className="support-skeleton-chart" />
          <div className="support-instructor-overview-list">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`overview-skeleton-${index}`}
                className="support-skeleton-row"
              >
                <div className="support-skeleton-line support-skeleton-line-sm" />
                <div className="support-skeleton-line support-skeleton-line-xs" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="support-instructor-overview-body">
          <OverviewDonut data={overviewData} />
          <div className="support-instructor-overview-list">
            {overviewData.map((d) => (
              <div key={d.label} className="support-instructor-overview-item">
                <span
                  className={`support-instructor-overview-dot ${getOverviewDotClass(d.label)}`}
                />
                <span className="support-instructor-overview-label">
                  {d.label}
                </span>
                <span className="support-instructor-overview-value">
                  {d.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
