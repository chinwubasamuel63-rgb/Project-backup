import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { generateStreamToken } from "../controllers/livekitController.js";
import upload, { handleMulterError } from "../middleware/upload.middleware.js";
import {
  createStream,
  getStreams,
  getMyStreams,
  getUserStreams,
  getStreamById,
  startStream,
  endStream,
  joinStream,
  leaveStream,
  getParticipants,
  kickParticipant,
  banParticipant,
  unbanParticipant,
  getBannedUsers,
  requestPermission,
  getPendingRequests,
  approveRequest,
  rejectRequest,
  revokeCamera,
  revokeMicrophone,
  revokeScreenShare,
  uploadStreamThumbnail,
  deleteStreamThumbnail,
} from "../controllers/streamController.js";

const router = express.Router();

router.get("/", protect, getStreams);
router.get("/my", protect, getMyStreams);
router.get("/user/:userId", getUserStreams);
router.post("/", protect, createStream);
router.post("/:streamId/start", protect, startStream);
router.post("/:streamId/join", protect, joinStream);
router.post("/:streamId/leave", protect, leaveStream);
router.get("/:streamId/participants", protect, getParticipants);
router.post("/:streamId/ban/:userId", protect, banParticipant);
router.post("/:streamId/request", protect, requestPermission);
router.get("/:streamId/requests", protect, getPendingRequests);
router.patch("/:streamId/requests/:requestId/approve", protect, approveRequest);
router.patch("/:streamId/requests/:requestId/reject", protect, rejectRequest);
router.patch(
  "/:streamId/participants/:userId/revoke-microphone",
  protect,
  revokeMicrophone,
);

router.patch(
  "/:streamId/participants/:userId/revoke-camera",
  protect,
  revokeCamera,
);

router.patch(
  "/:streamId/participants/:userId/revoke-screen-share",
  protect,
  revokeScreenShare,
);
router.get("/:streamId/bans", protect, getBannedUsers);
router.delete("/:streamId/ban/:userId", protect, unbanParticipant);
router.post("/:streamId/token", protect, generateStreamToken);
router.get("/:streamId", protect, getStreamById);
router.delete("/:streamId/kick/:userId", protect, kickParticipant);
router.delete("/:streamId", protect, endStream);
router.patch(
  "/:streamId/thumbnail",
  protect,
  upload.single("thumbnail"),
  handleMulterError,
  uploadStreamThumbnail,
);
router.delete("/:streamId/thumbnail", protect, deleteStreamThumbnail);

export default router;
