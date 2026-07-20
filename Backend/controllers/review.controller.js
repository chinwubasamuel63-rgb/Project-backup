import mongoose from "mongoose";
import Review from "../models/Review.js";
import Product from "../models/Product.js";

const updateProductRating = async (productId) => {
  const reviews = await Review.find({
    product: productId,
  });

  let averageRating = 0;

  if (reviews.length > 0) {
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);

    averageRating = total / reviews.length;
  }

  await Product.findByIdAndUpdate(productId, {
    averageRating: Number(averageRating.toFixed(1)),
  });
};

/* ---------------- CREATE REVIEW ---------------- */
export const createReview = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const { rating, comment } = req.body;

    if (
      rating === undefined ||
      isNaN(rating) ||
      Number(rating) < 1 ||
      Number(rating) > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    if (comment && comment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot exceed 1000 characters",
      });
    }

    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const isSeller = product.seller.toString() === req.user._id.toString();

    if (isSeller) {
      return res.status(400).json({
        success: false,
        message: "Sellers cannot review their own products",
      });
    }

    const hasPurchased = product.buyers.some(
      (buyer) => buyer.toString() === req.user._id.toString(),
    );

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: "You must purchase this product before reviewing",
      });
    }

    const existingReview = await Review.findOne({
      product: product._id,
      user: req.user._id,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    const review = await Review.create({
      product: product._id,
      user: req.user._id,
      rating: Number(rating),
      comment: comment?.trim() || "",
    });

    await updateProductRating(product._id);

    res.status(201).json({
      success: true,
      review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- GET PRODUCT REVIEWS ---------------- */
export const getProductReviews = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const reviews = await Review.find({
      product: req.params.productId,
    })
      .populate("user", "username avatar")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- DELETE REVIEW ---------------- */
export const deleteReview = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const productId = review.product;

    await review.deleteOne();

    await updateProductRating(productId);

    res.status(200).json({
      success: true,
      message: "Review deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
