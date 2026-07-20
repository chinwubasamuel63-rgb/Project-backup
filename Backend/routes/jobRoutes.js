import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import { checkAccountStatus } from "../middleware/accountStatusMiddleware.js";

import {
  createJob,
  getJobs,
  getJobById,
  getMyJobs,
  getProjectJobs,
  updateJob,
  closeJob,
  deleteJob,
} from "../controllers/jobController.js";

const router = express.Router();

router.get("/", getJobs);
router.get("/my/jobs", protect, getMyJobs);
router.get("/project/:projectId", getProjectJobs);
router.get("/:jobId", getJobById);

router.post("/", protect, checkAccountStatus, createJob);
router.patch("/:jobId", protect, checkAccountStatus, updateJob);
router.patch("/:jobId/close", protect, checkAccountStatus, closeJob);
router.delete("/:jobId", protect, checkAccountStatus, deleteJob);

export default router;
