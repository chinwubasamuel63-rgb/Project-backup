import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { checkAccountStatus } from "../middleware/accountStatusMiddleware.js";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from "../controllers/userFollow.controller.js";

const router = express.Router();

router.post("/:userId/follow", protect, checkAccountStatus, followUser);
router.delete("/:userId/follow", protect, checkAccountStatus, unfollowUser);
router.get("/:userId/followers", getFollowers);
router.get("/:userId/following", getFollowing);

export default router;
