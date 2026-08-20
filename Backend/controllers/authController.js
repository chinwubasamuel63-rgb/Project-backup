import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import RefreshToken from "../models/refreshToken.model.js";
import { sendEmail } from "../services/email.service.js";
import { welcomeEmail } from "../templates/emails/welcomeEmail.js";
import { passwordResetEmail } from "../templates/emails/passwordResetEmail.js";
import { refreshCookieOptions } from "../utils/cookie.utils.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/token.utils.js";
import crypto from "crypto";

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const cleanUsername = username.trim();

    const existingEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const existingUsername = await User.findOne({
      username: cleanUsername,
    });

    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const role =
      process.env.ADMIN_EMAIL &&
      normalizedEmail === process.env.ADMIN_EMAIL.toLowerCase()
        ? "admin"
        : "student";

    const user = await User.create({
      username: cleanUsername,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      authProvider: "local",
    });

    try {
      await sendEmail({
        to: user.email,
        subject: "Welcome to DevStream Nexus",
        html: welcomeEmail(user.username),
      });
    } catch (error) {
      ;
    }
    // AUTO LOGIN AFTER REGISTER
    const accessToken = generateAccessToken(user._id);

    const refreshToken = generateRefreshToken();

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt,
    });

    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        primaryTrack: user.primaryTrack,
        secondaryTracks: user.secondaryTracks,
        isSuspended: user.isSuspended,
        isBanned: user.isBanned,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    if (user.authProvider !== "local") {
      return res.status(400).json({
        success: false,
        message: `Please sign in using ${user.authProvider}`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Prevent banned users from logging in
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "Your account has been banned",
      });
    }

    // Track last successful login
    user.lastLoginAt = new Date();

    await user.save();

    const accessToken = generateAccessToken(user._id);

    const refreshToken = generateRefreshToken();

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt,
    });

    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.status(200).json({
      success: true,
      message: user.isSuspended
        ? "Login successful (account is currently suspended)"
        : "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        primaryTrack: user.primaryTrack,
        secondaryTracks: user.secondaryTracks,
        isSuspended: user.isSuspended,
        isBanned: user.isBanned,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (user.authProvider !== "local") {
      return res.status(400).json({
        success: false,
        message: `This account uses ${user.authProvider} sign in`,
      });
    }

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with that email, a password reset email has been sent",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;

    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "DevStream Nexus Password Reset",
      html: passwordResetEmail(resetUrl),
    });

    res.status(200).json({
      success: true,
      message:
        "If an account exists with that email, a password reset email has been sent",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    user.password = hashedPassword;

    user.resetPasswordToken = undefined;

    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
    }).populate("user");

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    if (!storedToken.user) {
      await storedToken.deleteOne();

      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    if (storedToken.expiresAt < new Date()) {
      await storedToken.deleteOne();

      return res.status(401).json({
        success: false,
        message: "Refresh token expired",
      });
    }

    const accessToken = generateAccessToken(storedToken.user._id);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await RefreshToken.deleteOne({
        token: refreshToken,
      });
    }

    res.clearCookie("refreshToken", refreshCookieOptions);

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
