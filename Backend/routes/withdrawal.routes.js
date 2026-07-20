import express from "express";
import {
  requestWithdrawal,
  getMyWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  markWithdrawalPaid,
  getAllWithdrawals,
} from "../controllers/withdrawal.controller.js";
import { authorizeRoles } from "../middleware/admin/role.middleware.js";
import { protect } from "../middleware/authMiddleware.js";
import { checkAccountStatus } from "../middleware/accountStatusMiddleware.js";

const router = express.Router();

router.post("/", protect, checkAccountStatus, requestWithdrawal);
router.get("/my", protect, getMyWithdrawals);
router.get("/admin", protect, authorizeRoles("admin"), getAllWithdrawals);
router.patch(
  "/:withdrawalId/approve",
  protect,
  authorizeRoles("admin"),
  approveWithdrawal,
);
router.patch(
  "/:withdrawalId/reject",
  protect,
  authorizeRoles("admin"),
  rejectWithdrawal,
);
router.patch(
  "/:withdrawalId/paid",
  protect,
  authorizeRoles("admin"),
  markWithdrawalPaid,
);

export default router;
