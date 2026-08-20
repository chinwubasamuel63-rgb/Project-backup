import test from "node:test";
import assert from "node:assert/strict";
import { TrackSource } from "livekit-server-sdk";

import {
  calculateParticipantRole,
  getParticipantPublishingSources,
  buildLivekitGrant,
  validateStreamAccessForLivekit,
} from "../services/livekit.service.js";

test("host role always gets full publishing capabilities", () => {
  const participant = {
    role: "host",
    microphoneEnabled: false,
    cameraEnabled: false,
    screenShareEnabled: false,
  };

  assert.equal(calculateParticipantRole(participant), "host");
  assert.deepEqual(getParticipantPublishingSources(participant), [
    "microphone",
    "camera",
    "screen_share",
  ]);
});

test("viewer role receives no publishing sources", () => {
  const participant = {
    role: "viewer",
    microphoneEnabled: false,
    cameraEnabled: false,
    screenShareEnabled: false,
  };

  assert.equal(calculateParticipantRole(participant), "viewer");
  assert.deepEqual(getParticipantPublishingSources(participant), []);
});

test("speaker role gets only approved publishing sources", () => {
  const participant = {
    role: "viewer",
    microphoneEnabled: true,
    cameraEnabled: false,
    screenShareEnabled: true,
  };

  assert.equal(calculateParticipantRole(participant), "speaker");
  assert.deepEqual(getParticipantPublishingSources(participant), [
    "microphone",
    "screen_share",
  ]);
});

test("token grant uses LiveKit TrackSource enum values", () => {
  const participant = {
    role: "viewer",
    microphoneEnabled: true,
    cameraEnabled: false,
    screenShareEnabled: false,
  };

  const grant = buildLivekitGrant(participant, "stream_test");

  assert.equal(grant.canPublish, true);
  assert.deepEqual(grant.canPublishSources, [TrackSource.MICROPHONE]);
  assert.equal(grant.canSubscribe, true);
});

test("rejects invalid stream ids before querying the stream store", async () => {
  await assert.rejects(
    () =>
      validateStreamAccessForLivekit({
        streamId: "not-a-valid-object-id",
        user: { _id: "64f0d1c2a4b2e3f4d5c6b7a8" },
      }),
    /Invalid stream id/,
  );
});
