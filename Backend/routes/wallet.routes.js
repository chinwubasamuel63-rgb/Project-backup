import express from "express";
import { getWallet } from "../controllers/wallet.controller.js";
import { protect }from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getWallet);

export default router;
