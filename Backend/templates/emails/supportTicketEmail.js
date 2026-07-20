export const supportTicketCreatedEmail = (ticketNumber, title) => `
  <h2>Support Ticket Created</h2>

  <p>Your support request has been received.</p>

  <p><strong>Ticket:</strong> ${ticketNumber}</p>
  <p><strong>Title:</strong> ${title}</p>

  <p>
    Our team will review your request shortly.
  </p>
`;

export const supportTicketClaimedEmail = (ticketNumber) => `
  <h2>Support Ticket Claimed</h2>

  <p>
    Your support ticket is now being handled.
  </p>

  <p><strong>Ticket:</strong> ${ticketNumber}</p>
`;

export const supportTicketResolvedEmail = (ticketNumber) => `
  <h2>Support Ticket Resolved</h2>

  <p>
    Your support ticket has been resolved.
  </p>

  <p><strong>Ticket:</strong> ${ticketNumber}</p>
`;

export const supportTicketClosedEmail = (ticketNumber) => `
  <h2>Support Ticket Closed</h2>

  <p>
    Your support ticket has been closed.
  </p>

  <p><strong>Ticket:</strong> ${ticketNumber}</p>
`;
