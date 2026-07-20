import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.middleware.js";
import { uploadImage } from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/image", protect, upload.single("image"), uploadImage);

export default router;
