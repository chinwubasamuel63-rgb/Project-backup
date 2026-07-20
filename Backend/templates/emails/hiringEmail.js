export const applicationSubmittedEmail = (jobTitle) => `
  <h2>Application Submitted</h2>

  <p>
    Your application for
    <strong>${jobTitle}</strong>
    has been submitted successfully.
  </p>
`;

export const applicationReceivedEmail = (applicantUsername, jobTitle) => `
  <h2>New Application Received</h2>

  <p>
    ${applicantUsername} has applied for:
  </p>

  <p>
    <strong>${jobTitle}</strong>
  </p>
`;

export const applicationAcceptedEmail = (jobTitle) => `
  <h2>Application Accepted</h2>

  <p>
    Congratulations!
  </p>

  <p>
    Your application for
    <strong>${jobTitle}</strong>
    has been accepted.
  </p>
`;

export const applicationRejectedEmail = (jobTitle) => `
  <h2>Application Rejected</h2>

  <p>
    Your application for
    <strong>${jobTitle}</strong>
    was not selected.
  </p>
`;
