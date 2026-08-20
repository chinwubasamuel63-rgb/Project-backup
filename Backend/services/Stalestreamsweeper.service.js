import Stream from "../models/Stream.js";
import { finalizeStreamLifecycle } from "./streamLifecycle.service.js";

/**
 * Nothing in the codebase currently *reads* hostPresenceLastSeen -- it gets
 * written on start and on every "host:presence" heartbeat (see sockets/index.js),
 * but a host whose tab crashes, phone dies, or network drops without a clean
 * socket disconnect just leaves the stream sitting in "started" forever.
 *
 * That's not just a data-accuracy problem: a "started" stream with a dead
 * host still has a live LiveKit room behind it, which keeps costing
 * connection-minutes/bandwidth against your free tier for no reason, and it
 * keeps counting toward MAX_ACTIVE_PARTICIPANTS.
 *
 * This function finds streams whose host has been silent past a grace
 * period and force-ends them via the same idempotent
 * finalizeStreamLifecycle() the admin force-end path uses. It's designed to
 * be called on a schedule by your existing cron system (see
 * cron/staleStream.cron.js) rather than run its own interval loop.
 */

// How long a host can go without a heartbeat before we consider the stream
// abandoned. Your socket layer's "host:presence" is sent periodically by the
// client -- set this comfortably above that interval so normal network
// hiccups don't trigger a false end. Adjust to match your actual client
// heartbeat frequency.
export const STALE_HOST_GRACE_MS = 2 * 60 * 1000; // 2 minutes

export const sweepStaleStreams = async () => {
  const cutoff = new Date(Date.now() - STALE_HOST_GRACE_MS);

  try {
    // Only streams that are actually "started" and have a recorded presence
    // timestamp older than the cutoff. A stream that never got a single
    // heartbeat after start() would also have an old hostPresenceLastSeen
    // (set once at start time), so this still catches "host started then
    // immediately vanished" too.
    const staleStreams = await Stream.find({
      status: "started",
      hostPresenceLastSeen: { $lt: cutoff },
    });

    if (!staleStreams.length) return { checked: 0, ended: 0 };

    let ended = 0;

    await Promise.all(
      staleStreams.map(async (stream) => {
        try {
          await finalizeStreamLifecycle(stream, {
            reason: "host-inactive",
            endedAt: new Date(),
          });
          ended += 1;
        } catch (error) {
          // Don't let one bad stream stop the rest of the sweep.
          console.error(
            `Stale stream sweep failed for stream ${stream._id}:`,
            error?.message || error,
          );
        }
      }),
    );

    return { checked: staleStreams.length, ended };
  } catch (error) {
    console.error("Stale stream sweep query failed:", error?.message || error);
    return { checked: 0, ended: 0, error: true };
  }
};