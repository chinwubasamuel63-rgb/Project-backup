import SupportTicketCard from "./SupportTicketCard";
import "./support.css";

export default function SupportTicketList({
  tickets,
  loading,
  emptyMessage,
  onTicketClick,
  onClaimTicket,
}) {
  if (loading) {
    return (
      <div
        className="support-skeleton-list"
        aria-live="polite"
        aria-label="Loading tickets"
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`ticket-skeleton-${index}`}
            className="support-skeleton-card"
          >
            <div className="support-skeleton-avatar" />
            <div className="support-skeleton-body">
              <div className="support-skeleton-line support-skeleton-line-lg" />
              <div className="support-skeleton-line support-skeleton-line-md" />
              <div className="support-skeleton-line support-skeleton-line-sm" />
            </div>
            <div className="support-skeleton-actions">
              <div className="support-skeleton-pill" />
              <div className="support-skeleton-pill" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!tickets.length) {
    return (
      <div className="support-empty-state">
        <div className="support-empty-icon">✦</div>
        <h3>No tickets to show</h3>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {tickets.map((ticket, index) => (
        <SupportTicketCard
          key={ticket._id}
          ticket={ticket}
          index={index}
          onTicketClick={onTicketClick}
          onClaimTicket={onClaimTicket}
        />
      ))}
    </>
  );
}
