import express from "express";

import { protect } from "../../middleware/authMiddleware.js";
import { authorizeRoles } from "../../middleware/admin/role.middleware.js";

import { getAuditLogs } from "../../controllers/admin/audit.controller.js";

const router = express.Router();

router.get("/", protect, authorizeRoles("admin"), getAuditLogs);

export default router;
