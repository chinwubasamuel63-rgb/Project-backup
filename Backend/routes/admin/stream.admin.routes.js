import express from "express";

import { protect } from "../../middleware/authMiddleware.js";

import { adminOnly } from "../../middleware/admin/adminMiddleware.js";

import {
  getLiveStreamsAdmin,
  getStreamAnalyticsAdmin,
  getStreamAnalyticsByIdAdmin,
} from "../../controllers/admin/stream.admin.controller.js";

const router = express.Router();

router.get(
  "/live",
  protect,
  adminOnly,
  getLiveStreamsAdmin
);

router.get(
  "/analytics",
  protect,
  adminOnly,
  getStreamAnalyticsAdmin
);

router.get(
  "/analytics/:id",
  protect,
  adminOnly,
  getStreamAnalyticsByIdAdmin
);

export default router;