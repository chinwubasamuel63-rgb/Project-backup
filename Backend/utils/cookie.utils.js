export const refreshCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};