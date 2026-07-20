import express from "express";
import { instructorOnly } from "../middleware/instructorMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import { checkAccountStatus } from "../middleware/accountStatusMiddleware.js";
import {
  createSupportTicket,
  getMyTickets,
  getTicketById,
  claimTicket,
  getOpenTickets,
  updateTicketStatus,
  getAssignedTickets,
} from "../controllers/supportController.js";

const router = express.Router();

router.post("/", protect, checkAccountStatus, createSupportTicket);
router.get("/my-tickets", protect, getMyTickets);
router.get("/open", protect, instructorOnly, getOpenTickets);
router.get("/assigned", protect, instructorOnly, getAssignedTickets);
router.get("/:ticketId", protect, getTicketById);
router.patch(
  "/:ticketId/claim",
  protect,
  checkAccountStatus,
  instructorOnly,
  claimTicket,
);
router.patch(
  "/:ticketId/status",
  protect,
  checkAccountStatus,
  instructorOnly,
  updateTicketStatus,
);

export default router;
