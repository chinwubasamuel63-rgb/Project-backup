import "./support.css";

function getPriorityClass(priority) {
  if (!priority) return "priority-medium";

  const normalized = String(priority).toLowerCase();

  if (normalized.includes("high")) return "priority-high";
  if (normalized.includes("low")) return "priority-low";

  return "priority-medium";
}

function getAvatarClass(index) {
  const avatarClasses = ["avatar-purple", "avatar-blue", "avatar-green"];
  return avatarClasses[index % avatarClasses.length];
}

export default function SupportTicketCard({
  ticket,
  index,
  onTicketClick,
  onClaimTicket,
}) {
  const priorityClass = `priority-pill ${getPriorityClass(ticket.priority)}`;
  const avatarClass = `ticket-avatar ${getAvatarClass(index)}`;

  const handleClaim = (event) => {
    event.stopPropagation();

    if (onClaimTicket) {
      onClaimTicket(ticket);
    }
  };

  return (
    <div
      className="support-ticket-card"
      onClick={() => onTicketClick?.(ticket)}
    >
      <div className="support-ticket-left">
        <div className={avatarClass}>
          {(ticket.student?.username || "U").charAt(0).toUpperCase()}
        </div>

        <div className="support-ticket-content">
          <div className="support-ticket-title-row">
            <h3>{ticket.title}</h3>
          </div>

          <div className="support-ticket-submeta">
            #{ticket.ticketNumber}
            <span>•</span>
            {ticket.student?.username || "Unknown"}
            <span>•</span>
            {ticket.course || "General"}
          </div>

          <p className="ticket-description">{ticket.description}</p>
        </div>
      </div>

      <div className="support-ticket-actions">
        <span className={priorityClass}>{ticket.priority}</span>
        <span className="status-pill">{ticket.status}</span>
        <span className="ticket-date">
          {new Date(ticket.createdAt).toLocaleDateString()}
        </span>

        {ticket.status === "Open" && (
          <button
            className="btn-primary ticket-claim-btn"
            onClick={handleClaim}
          >
            Claim
          </button>
        )}

        <span className="ticket-arrow">→</span>
      </div>
    </div>
  );
}
