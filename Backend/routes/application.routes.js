import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { checkAccountStatus } from "../middleware/accountStatusMiddleware.js";
import {
  applyToJob,
  getJobApplications,
  getMyApplications,
  acceptApplication,
  rejectApplication,
  withdrawApplication,
} from "../controllers/application.controller.js";

const router = express.Router();

router.post("/jobs/:jobId/apply", protect, checkAccountStatus, applyToJob);
router.get("/jobs/:jobId/applications", protect, getJobApplications);
router.get("/my", protect, getMyApplications);
router.patch("/:applicationId/accept", protect, acceptApplication);

router.patch("/:applicationId/reject", protect, rejectApplication);

router.patch("/:applicationId/withdraw", protect, withdrawApplication);

export default router;
