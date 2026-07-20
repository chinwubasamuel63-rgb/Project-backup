export const roleChangedEmail = (role) => `
  <h2>Role Updated</h2>

  <p>
    Your DevStream Nexus role has been updated.
  </p>

  <p>
    New Role:
    <strong>${role}</strong>
  </p>
`;

export const accountSuspendedEmail = (
  reason,
  expiresAt
) => `
  <h2>Account Suspended</h2>

  <p>
    Your account has been suspended.
  </p>

  <p>
    Reason:
    <strong>${reason || "Not specified"}</strong>
  </p>

  <p>
    Expires:
    <strong>${expiresAt}</strong>
  </p>
`;

export const accountRestoredEmail = () => `
  <h2>Account Restored</h2>

  <p>
    Your account suspension has been removed.
  </p>
`;

export const accountBannedEmail = (
  reason
) => `
  <h2>Account Banned</h2>

  <p>
    Your account has been permanently banned.
  </p>

  <p>
    Reason:
    <strong>${reason || "Not specified"}</strong>
  </p>
`;

export const accountUnbannedEmail = () => `
  <h2>Account Restored</h2>

  <p>
    Your account ban has been removed.
  </p>
`;