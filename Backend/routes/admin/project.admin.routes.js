import express from "express";

import { protect } from "../../middleware/authMiddleware.js";
import { adminOnly } from "../../middleware/admin/adminMiddleware.js";
import {
  getAllProjects,
  getProjectByIdAdmin,
  deleteProjectAdmin,
} from "../../controllers/admin/project.admin.controller.js";

const router = express.Router();

router.get("/", protect, adminOnly, getAllProjects);

router.get("/:projectId", protect, adminOnly, getProjectByIdAdmin);

router.delete("/:projectId", protect, adminOnly, deleteProjectAdmin);

export default router;
