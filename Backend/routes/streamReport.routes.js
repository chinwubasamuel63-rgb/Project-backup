import express from "express";

import {
  createStreamReport,
  getAllReports,
  reviewReport,
  dismissReport,
} from "../controllers/streamReport.controller.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/admin/role.middleware.js";

const router = express.Router();

router.post("/:streamId", protect, createStreamReport);

router.get("/admin", protect, authorizeRoles("admin"), getAllReports);

router.patch(
  "/admin/:reportId/review",
  protect,
  authorizeRoles("admin"),
  reviewReport,
);

router.patch(
  "/admin/:reportId/dismiss",
  protect,
  authorizeRoles("admin"),
  dismissReport,
);

export default router;
