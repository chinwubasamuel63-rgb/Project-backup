import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { authorizeRoles } from "../../middleware/admin/role.middleware.js";
import {
  getDashboardOverview,
  getGrowthAnalytics,
} from "../../controllers/admin/analytics.controller.js";

const router = express.Router();

router.get("/overview", protect, authorizeRoles("admin"), getDashboardOverview);
router.get("/growth", protect, authorizeRoles("admin"), getGrowthAnalytics);

export default router;
