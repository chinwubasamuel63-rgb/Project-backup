import Stream from "../models/Stream.js";
import StreamParticipant from "../models/StreamParticipant.js";
import { emitToStream } from "../sockets/index.js";
import { finalizeStreamLifecycle } from "../services/streamLifecycle.service.js";
import {
  verifyLivekitWebhook,
  streamIdFromRoomName,
} from "../services/livekit.service.js";

/**
 * Handles LiveKit server webhooks so DB state stays correct even when a
 * client never gets the chance to call POST /streams/:id/leave -- crashed
 * tab, killed app, phone died, network dropped mid-call, etc. Without this,
 * a participant's StreamParticipant.leftAt can stay null forever, which
 * quietly inflates your "active participant" count (and, combined with the
 * MAX_ACTIVE_PARTICIPANTS cap, could eventually make a room look full when
 * it isn't).
 *
 * Configure this URL in your LiveKit project/server config as the webhook
 * endpoint, e.g. https://your-api.com/api/webhooks/livekit
 *
 * CRITICAL: this route must receive the RAW request body, not JSON-parsed.
 * See streamWebhook.routes.js for the express.raw() setup.
 */
export const handleLivekitWebhook = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    // req.body is a Buffer here because this route uses express.raw()
    // receiver.receive() is async - awaiting is required, not optional.
    const event = await verifyLivekitWebhook(req.body, authHeader);

    switch (event.event) {
      case "participant_left": {
        const streamId = streamIdFromRoomName(event.room?.name);
        const userId = event.participant?.identity;

        if (streamId && userId) {
          const updated = await StreamParticipant.findOneAndUpdate(
            { stream: streamId, user: userId, leftAt: null },
            { $set: { leftAt: new Date() } },
            { new: true },
          );

          // Only emit if this webhook actually changed something -- if the
          // client already called /leave first (the common path), this is a
          // no-op and we don't want to spam a duplicate UI update.
          if (updated) {
            const activeParticipants = await StreamParticipant.find({
              stream: streamId,
              leftAt: null,
            })
              .populate("user", "username firstName lastName profilePicture")
              .sort({ joinedAt: 1 });

            emitToStream(
              streamId,
              "stream:participants-updated",
              activeParticipants,
            );
          }
        }
        break;
      }

      case "room_finished": {
        const streamId = streamIdFromRoomName(event.room?.name);

        if (streamId) {
          const stream = await Stream.findById(streamId);

          // Only finalize if it's still marked "started" in our DB -- e.g.
          // the room disappeared (host force-closed, server restart, LiveKit
          // idle timeout) without the app's normal endStream flow running.
          // finalizeStreamLifecycle is already idempotent, so this is safe
          // even if it races with a normal end.
          if (stream && stream.status === "started") {
            await finalizeStreamLifecycle(stream, {
              reason: "livekit-room-finished",
              endedAt: new Date(),
            });
          }
        }
        break;
      }

      // Other events (room_started, track_published, etc) are available if
      // you want them later, but aren't needed for basic state consistency.
      default:
        break;
    }

    // LiveKit expects a 200 to consider the webhook delivered. Returning
    // non-2xx will cause it to retry, which is fine, but errors below are
    // caught so a transient DB hiccup doesn't cause a retry storm.
    res.status(200).json({ received: true });
  } catch (error) {
    // Signature verification failures land here too -- don't leak details.
    res.status(400).json({ received: false });
  }
};
