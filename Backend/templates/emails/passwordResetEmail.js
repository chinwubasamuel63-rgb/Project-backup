export const passwordResetEmail = (resetUrl) => {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Password Reset Request</h2>

        <p>
          We received a request to reset your password.
        </p>

        <p>
          Click the link below to create a new password:
        </p>

        <p>
          <a href="${resetUrl}">
            Reset Password
          </a>
        </p>

        <p>
          This link will expire in 15 minutes.
        </p>

        <p>
          If you did not request this password reset,
          you can safely ignore this email.
        </p>

        <p>
          - DevStream Nexus Team
        </p>
      </body>
    </html>
  `;
};
