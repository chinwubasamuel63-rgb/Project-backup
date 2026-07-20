import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { adminOnly } from "../../middleware/admin/adminMiddleware.js";
import { getAdminStats } from "../../controllers/admin/stats.admin.controller.js";

const router = express.Router();

router.get("/", protect, adminOnly, getAdminStats);

export default router;
