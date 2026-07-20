import express from "express";

import { protect } from "../middleware/authMiddleware.js";

import { getProjectActivities } from "../controllers/projectActivityController.js";

const router = express.Router();

router.get("/:projectId", getProjectActivities);

export default router;
