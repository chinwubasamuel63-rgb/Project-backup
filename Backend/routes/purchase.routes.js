import express from "express";
import { authorizeRoles } from "../middleware/admin/role.middleware.js";
import {
  createPurchase,
  verifyPurchase,
  getMyPurchases,
  getMySales,
} from "../controllers/purchase.controller.js";

import { protect } from "../middleware/authMiddleware.js";
import { checkAccountStatus } from "../middleware/accountStatusMiddleware.js";

const router = express.Router();

router.post(
  "/products/:productId",
  protect,
  checkAccountStatus,
  createPurchase,
);

router.patch(
  "/:purchaseId/verify",
  protect,
  authorizeRoles("admin"),
  verifyPurchase,
);
router.get("/my/purchases", protect, getMyPurchases);

router.get("/my/sales", protect, getMySales);

export default router;
