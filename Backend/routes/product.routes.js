import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  getMyProducts,
  updateProduct,
  deactivateProduct,
  deleteProduct,
  activateProduct,
  downloadProduct,
  uploadProductImages,
} from "../controllers/product.controller.js";
import { protect } from "../middleware/authMiddleware.js";
import { checkAccountStatus } from "../middleware/accountStatusMiddleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.post("/", protect, checkAccountStatus, createProduct);
router.get("/", getProducts);
router.get("/my/products", protect, getMyProducts);
router.get("/:productId/download", protect, downloadProduct);
router.get("/:productId", getProductById);
router.patch("/:productId", protect, checkAccountStatus, updateProduct);
router.patch(
  "/:productId/deactivate",
  protect,
  checkAccountStatus,
  deactivateProduct,
);
router.patch(
  "/:productId/activate",
  protect,
  checkAccountStatus,
  activateProduct,
);
router.delete("/:productId", protect, checkAccountStatus, deleteProduct);
router.patch(
  "/:productId/images",
  protect,
  upload.array("images", 5),
  uploadProductImages,
);

export default router;
