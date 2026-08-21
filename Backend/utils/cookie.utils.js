export const refreshCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};