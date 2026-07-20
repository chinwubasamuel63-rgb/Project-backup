import express from "express";
import {
  getAllUsers,
  updateUserRole,
  adminUserAction,
} from "../../controllers/admin/user.admin.controller.js";

import { protect } from "../../middleware/authMiddleware.js";
import { adminOnly } from "../../middleware/admin/adminMiddleware.js";

const router = express.Router();

router.get("/users", protect, adminOnly, getAllUsers);
router.patch("/users/:userId/role", protect, adminOnly, updateUserRole);
router.patch("/:userId/action", protect, adminOnly, adminUserAction);

export default router;
