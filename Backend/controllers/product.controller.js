import Product from "../models/Product.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

export const createProduct = async (req, res) => {
  let uploadedThumbnail = null;

  try {
    const { title, description, price, category, files } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product title is required",
      });
    }

    if (!description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product description is required",
      });
    }

    if (!category?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product category is required",
      });
    }

    if (price === undefined || isNaN(price) || Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid product price is required",
      });
    }

    if (files && !Array.isArray(files)) {
      return res.status(400).json({
        success: false,
        message: "Files must be an array",
      });
    }

    let thumbnail = {
      publicId: "",
      url: "",
    };

    if (req.file) {
      uploadedThumbnail = await uploadToCloudinary(
        req.file.buffer,
        "devstream-nexus/products/thumbnails",
      );

      thumbnail = {
        publicId: uploadedThumbnail.public_id,
        url: uploadedThumbnail.secure_url,
      };
    }

    const product = await Product.create({
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      category: category.trim(),
      thumbnail,
      files: files || [],
      seller: req.user._id,
    });

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    if (uploadedThumbnail?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadedThumbnail.public_id);
      } catch (cleanupError) {}
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- GET ALL PRODUCTS ---------------- */
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: "Active" })
      .populate("seller", "username")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- GET SINGLE PRODUCT ---------------- */
export const getProductById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(req.params.productId).populate(
      "seller",
      "username",
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- MY PRODUCTS ---------------- */
export const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({
      seller: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserProducts = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }

    const products = await Product.find({
      seller: req.params.userId,
      status: "Active",
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ---------------- UPDATE PRODUCT ---------------- */
export const updateProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the seller can update this product",
      });
    }

    if (
      req.body.price !== undefined &&
      (isNaN(req.body.price) || Number(req.body.price) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product price",
      });
    }

    if (req.body.files !== undefined && !Array.isArray(req.body.files)) {
      return res.status(400).json({
        success: false,
        message: "Files must be an array",
      });
    }

    const oldThumbnailPublicId = product.thumbnail?.publicId;

    const allowedUpdates = [
      "title",
      "description",
      "price",
      "category",
      "thumbnail",
      "files",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();

    if (
      req.body.thumbnail &&
      oldThumbnailPublicId &&
      oldThumbnailPublicId !== req.body.thumbnail.publicId
    ) {
      try {
        await cloudinary.uploader.destroy(oldThumbnailPublicId);
      } catch (cleanupError) {}
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- DELETE PRODUCT ---------------- */
export const deleteProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the seller can delete this product",
      });
    }

    if (product.thumbnail?.publicId) {
      await cloudinary.uploader.destroy(product.thumbnail.publicId);
    }

    await Promise.all(
      (product.images || [])
        .filter((image) => image.publicId)
        .map((image) => cloudinary.uploader.destroy(image.publicId)),
    );

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- ACTIVATE / DEACTIVATE ---------------- */
export const deactivateProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the seller can manage this product",
      });
    }

    product.status = "Inactive";

    await product.save();

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const activateProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the seller can manage this product",
      });
    }

    product.status = "Active";

    await product.save();

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- DOWNLOAD PRODUCT FILES ---------------- */
export const downloadProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
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

    const isBuyer = product.buyers.some(
      (buyer) => buyer.toString() === req.user._id.toString(),
    );

    const isAdmin = req.user.role === "admin";

    if (!isSeller && !isBuyer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this product",
      });
    }

    res.status(200).json({
      success: true,
      files: product.files,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const uploadProductImages = async (req, res) => {
  const uploadedPublicIds = [];

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images uploaded",
      });
    }

    if ((product.images?.length || 0) + req.files.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 product images allowed",
      });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    for (const file of req.files) {
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Only JPG, PNG and WEBP images are allowed",
        });
      }
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const result = await uploadToCloudinary(
        file.buffer,
        "devstream-nexus/products",
      );

      uploadedPublicIds.push(result.public_id);

      uploadedImages.push({
        publicId: result.public_id,
        url: result.secure_url,
      });
    }

    product.images = [...(product.images || []), ...uploadedImages];

    await product.save();

    res.status(200).json({
      success: true,
      images: product.images,
    });
  } catch (error) {
    for (const publicId of uploadedPublicIds) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (cleanupError) {}
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
