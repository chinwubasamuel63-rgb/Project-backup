import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import passport from "passport";
import RefreshToken from "../models/refreshToken.model.js";
import { generateRefreshToken } from "../utils/token.utils.js";
import { refreshCookieOptions } from "../utils/cookie.utils.js";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  logoutUser,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login`,
  }),
  async (req, res) => {
    const refreshToken = generateRefreshToken();

    await RefreshToken.create({
      user: req.user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    res.redirect(`${process.env.CLIENT_URL}/oauth-success`);
  },
);
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
  }),
);
router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login`,
  }),
  async (req, res) => {
    try {
      const refreshToken = generateRefreshToken();

      await RefreshToken.create({
        user: req.user._id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      res.cookie("refreshToken", refreshToken, refreshCookieOptions);

      res.redirect(`${process.env.CLIENT_URL}/oauth-success`);
    } catch (error) {
      console.error("GitHub OAuth error:", error);

      res.redirect(`${process.env.CLIENT_URL}/login`);
    }
  },
);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);
router.get("/me", protect, getCurrentUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
