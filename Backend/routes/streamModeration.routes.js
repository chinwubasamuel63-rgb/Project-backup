import express from "express";
import {
  getAllStreams,
  getStreamDetails,
  forceEndStream,
  suspendStreamHost,
} from "../controllers/streamModeration.controller.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/admin/role.middleware.js";

const router = express.Router();

router.use(protect, authorizeRoles("admin"));

router.get("/", getAllStreams);
router.get("/:streamId", getStreamDetails);
router.patch("/:streamId/end", forceEndStream);
router.patch("/:streamId/suspend-host", suspendStreamHost);

export default router;
