import cron from "node-cron";
import { sweepStaleStreams } from "../services/staleStreamSweeper.service.js";

// Runs every minute. Cheap query (indexed on status + hostPresenceLastSeen
// is worth adding if this table grows -- see Stream.js schema indexes) and
// each run is a no-op unless a stream has actually gone stale.
//
// NOTE: this assumes node-cron, matching the likely pattern of your other
// *.cron.js files. If jobExpiry.cron.js / suspensionExpiry.cron.js use a
// different scheduler (node-schedule, agenda, etc), swap this to match --
// the actual logic lives in sweepStaleStreams() and doesn't care how it's
// invoked.
cron.schedule("* * * * *", async () => {
  await sweepStaleStreams();
});