export const partnershipRequestReceivedEmail = (
  applicantUsername,
  projectName,
) => `
  <h2>New Partnership Request</h2>

  <p>
    ${applicantUsername} wants to join your project.
  </p>

  <p>
    <strong>Project:</strong> ${projectName}
  </p>
`;

export const partnershipAcceptedEmail = (projectName) => `
  <h2>Partnership Request Accepted</h2>

  <p>
    Your request to join
    <strong>${projectName}</strong>
    has been accepted.
  </p>
`;

export const partnershipRejectedEmail = (projectName) => `
  <h2>Partnership Request Rejected</h2>

  <p>
    Your request to join
    <strong>${projectName}</strong>
    has been rejected.
  </p>
`;
