import express from "express";
import { handleLivekitWebhook } from "../controllers/Livekitwebhook.controller.js";

const router = express.Router();

// No `protect` middleware here -- LiveKit's servers call this, not a logged
// in user. Authenticity is verified inside handleLivekitWebhook via the
// signed Authorization header instead.
//
// express.raw() is required (not express.json()) because LiveKit signs the
// exact raw bytes of the body; parsing it to an object first and
// re-serializing would produce a different byte sequence and always fail
// verification.
router.post(
  "/",
  express.raw({ type: "application/webhook+json" }),
  handleLivekitWebhook,
);

export default router;

// --- Mounting instructions ---
// In your main app file (e.g. index.js / app.js), mount this BEFORE any
// global express.json() middleware is applied to this path, or make sure
// your global json() middleware is scoped so it doesn't touch this route:
//
//   import livekitWebhookRoutes from "./routes/livekitWebhook.routes.js";
//   app.use("/api/webhooks/livekit", livekitWebhookRoutes);
//
// Then set that full URL (https://your-api.com/api/webhooks/livekit) as the
// webhook endpoint in your LiveKit project config (LiveKit Cloud dashboard,
// or the `webhook` section of your self-hosted livekit.yaml).