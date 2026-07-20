import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.middleware.js";
import {
  updateAvatar,
  deleteAvatar,
} from "../controllers/userProfile.controller.js";

const router = express.Router();

router.patch("/avatar", protect, upload.single("image"), updateAvatar);
router.delete("/avatar", protect, deleteAvatar);

export default router;
