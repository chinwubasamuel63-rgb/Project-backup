import express from "express";

import { protect } from "../../middleware/authMiddleware.js";

import { adminOnly } from "../../middleware/admin/adminMiddleware.js";

import {
  getAllSupportTickets,
  getSupportTicketByIdAdmin,
  getSupportAssignees,
  assignSupportTicketAdmin,
} from "../../controllers/admin/support.admin.controller.js";

const router = express.Router();

router.get("/", protect, adminOnly, getAllSupportTickets);

router.get("/assignees", protect, adminOnly, getSupportAssignees);

router.patch("/:ticketId/assign", protect, adminOnly, assignSupportTicketAdmin);

router.get("/:ticketId", protect, adminOnly, getSupportTicketByIdAdmin);

export default router;
