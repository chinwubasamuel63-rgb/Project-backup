import express from "express";

import {
  createReview,
  getProductReviews,
  deleteReview,
} from "../controllers/review.controller.js";

import { protect } from "../middleware/authMiddleware.js";
import { checkAccountStatus } from "../middleware/accountStatusMiddleware.js";

const router = express.Router();

router.post("/products/:productId", protect, checkAccountStatus, createReview);

router.get("/products/:productId", getProductReviews);

router.delete("/:reviewId", protect, deleteReview);

export default router;
