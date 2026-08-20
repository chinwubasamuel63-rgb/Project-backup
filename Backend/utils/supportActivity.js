export const buildInstructorSupportActivityFeed = (
  tickets = [],
  limit = 10,
) => {
  return (tickets || [])
    .flatMap((ticket) =>
      (ticket.statusHistory || []).map((entry) => ({
        ...entry,
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        ticketTitle: ticket.title,
        student: ticket.student?.username || "Unknown",
      })),
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
};
