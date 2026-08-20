import express from "express";

import {
  getMyProfile,
  updateProfile,
  getUserProfile,
  updateAvatar,
  deleteAvatar,
  updateCoverImage,
  deleteCoverImage,
} from "../controllers/userProfile.controller.js";

import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// Current logged-in user
router.get("/me", protect, getMyProfile);
// Update profile information
router.patch("/me", protect, updateProfile);
// Other users
router.get("/:userId", getUserProfile);

router.patch("/avatar", protect, upload.single("image"), updateAvatar);
router.patch("/cover", protect, upload.single("image"), updateCoverImage);

router.delete("/cover", protect, deleteCoverImage);

router.delete("/avatar", protect, deleteAvatar);

export default router;
