import dotenv from "dotenv";
import express from "express";
import http from "http";
import { initializeSocket } from "./sockets/index.js";
import cors from "cors";
import passport from "./config/passport.js";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import partnershipRoutes from "./routes/partnershipRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import streamRoutes from "./routes/streamRoutes.js";
import livekitWebhookRoutes from "./routes/livekitWebhook.routes.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationRoutes from "./routes/application.routes.js";
import productRoutes from "./routes/product.routes.js";
import purchaseRoutes from "./routes/purchase.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import withdrawalRoutes from "./routes/withdrawal.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import streamModerationRoutes from "./routes/streamModeration.routes.js";
import streamReportRoutes from "./routes/streamReport.routes.js";
import analyticsRoutes from "./routes/admin/analytics.routes.js";
import userFollowRoutes from "./routes/userFollow.routes.js";
import searchRoutes from "./routes/search.routes.js";
import projectActivityRoutes from "./routes/projectActivityRoutes.js";
import "./cron/index.js";
import auditRoutes from "./routes/admin/audit.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import userProfileRoutes from "./routes/userProfile.routes.js";
import profileActivityRoutes from "./routes/profileActivity.routes.js";
import { errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();
connectDB();

const app = express();

const server = http.createServer(app);
initializeSocket(server);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

// LiveKit webhooks MUST be mounted before express.json(). LiveKit signs the
// raw request body, and this route uses express.raw() internally to receive
// it unparsed -- if express.json() runs first, the body arrives already
// parsed into an object and signature verification will always fail.
app.use("/api/webhooks/livekit", livekitWebhookRoutes);

app.use(express.json());
app.use(passport.initialize());
app.use(express.urlencoded({ extended: true }));
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DevStream Nexus API Running",
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/partnerships", partnershipRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/streams", streamRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/products", productRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin/streams", streamModerationRoutes);
app.use("/api/stream-reports", streamReportRoutes);
app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api/users", userFollowRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/admin/audit-logs", auditRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/profile", userProfileRoutes);
app.use("/api/project-activity", projectActivityRoutes);
app.use("/api/profile/activity", profileActivityRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});