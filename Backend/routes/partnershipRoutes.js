import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { checkAccountStatus } from "../middleware/accountStatusMiddleware.js";
import {
  createPartnershipRequest,
  getProjectRequests,
  acceptRequest,
  rejectRequest,
  withdrawRequest,
  getMyPartnershipRequests,
  getMyProjectRequest,
} from "../controllers/partnershipController.js";

const router = express.Router();

router.post(
  "/:projectId",
  protect,
  checkAccountStatus,
  createPartnershipRequest,
);
router.get("/my-requests", protect, getMyPartnershipRequests);
router.get("/project/:projectId/my-request", protect, getMyProjectRequest);
router.get("/project/:projectId", protect, getProjectRequests);
router.patch("/accept/:requestId", protect, checkAccountStatus, acceptRequest);
router.patch("/reject/:requestId", protect, checkAccountStatus, rejectRequest);
router.delete("/:requestId", protect, checkAccountStatus, withdrawRequest);

export default router;
