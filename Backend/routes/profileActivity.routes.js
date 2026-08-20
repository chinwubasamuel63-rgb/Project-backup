import express from "express";
import { getProfileActivity } from "../controllers/profileActivity.controller.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getProfileActivity);
router.get("/user/:userId", getProfileActivity);

export default router;
