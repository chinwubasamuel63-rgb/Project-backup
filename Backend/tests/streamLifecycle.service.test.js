import test from "node:test";
import assert from "node:assert/strict";

import { buildStreamEndedPayload } from "../services/streamLifecycle.service.js";

test("builds a stream-ended payload with default reason", () => {
  const payload = buildStreamEndedPayload({
    _id: "64f0d1c2a4b2e3f4d5c6b7a8",
    title: "Demo stream",
    host: "64f0d1c2a4b2e3f4d5c6b7a9",
  });

  assert.equal(payload.streamId, "64f0d1c2a4b2e3f4d5c6b7a8");
  assert.equal(payload.title, "Demo stream");
  assert.equal(payload.reason, "ended");
  assert.ok(payload.endedAt);
});

test("allows explicit reasons in the stream-ended payload", () => {
  const payload = buildStreamEndedPayload(
    {
      _id: "64f0d1c2a4b2e3f4d5c6b7a8",
      title: "Demo stream",
      host: "64f0d1c2a4b2e3f4d5c6b7a9",
    },
    { reason: "host-left", endedAt: new Date("2024-01-01T00:00:00.000Z") },
  );

  assert.equal(payload.reason, "host-left");
  assert.equal(payload.endedAt.toISOString(), "2024-01-01T00:00:00.000Z");
});
