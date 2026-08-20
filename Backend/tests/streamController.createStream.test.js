import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeCreateStreamInput,
  normalizeStreamThumbnail,
  buildParticipantJoinUpdate,
  getDefaultJoinPermissions,
} from "../controllers/streamController.js";

test("derive host from authenticated user and strip client-supplied host", () => {
  const payload = normalizeCreateStreamInput(
    {
      title: "  Live stream  ",
      description: "  Product demo  ",
      visibility: "private",
      project: "project-123",
      host: "malicious-user-456",
    },
    { _id: "auth-user-123" },
  );

  assert.deepEqual(payload, {
    title: "Live stream",
    description: "Product demo",
    visibility: "private",
    project: "project-123",
    host: "auth-user-123",
  });
});

test("default visibility and description are normalized for a public stream", () => {
  const payload = normalizeCreateStreamInput(
    {
      title: "  Morning standup  ",
      host: "malicious-user-456",
    },
    { _id: "auth-user-456" },
  );

  assert.deepEqual(payload, {
    title: "Morning standup",
    description: "",
    visibility: "public",
    project: null,
    host: "auth-user-456",
  });
});

test("buildParticipantJoinUpdate avoids conflicting MongoDB update paths", () => {
  const update = buildParticipantJoinUpdate({
    role: "viewer",
    leftAt: null,
    joinedAt: new Date("2024-01-01T00:00:00.000Z"),
  });

  assert.ok(update.$set);
  assert.equal(update.$set.role, "viewer");
  assert.equal(update.$set.leftAt, null);
  assert.equal(update.$setOnInsert.role, undefined);
  assert.equal(update.$setOnInsert.leftAt, undefined);
  assert.equal(update.$setOnInsert.joinCount, 1);
  assert.equal(
    update.$setOnInsert.joinedAt.getTime(),
    new Date("2024-01-01T00:00:00.000Z").getTime(),
  );
  assert.equal(update.$inc, undefined);
});

test("host joins with active media by default while guests start muted until approved", () => {
  const hostDefaults = getDefaultJoinPermissions({ isHost: true });
  const guestDefaults = getDefaultJoinPermissions({ isHost: false });

  assert.deepEqual(hostDefaults, {
    microphoneEnabled: true,
    cameraEnabled: true,
    screenShareEnabled: false,
  });

  assert.deepEqual(guestDefaults, {
    microphoneEnabled: false,
    cameraEnabled: false,
    screenShareEnabled: false,
  });
});

test("stream thumbnail is normalized across Cloudinary field naming variants", () => {
  const normalized = normalizeStreamThumbnail({
    public_id: "streams/demo",
    secure_url: "https://res.cloudinary.com/demo/image/upload.jpg",
  });

  assert.deepEqual(normalized, {
    publicId: "streams/demo",
    url: "https://res.cloudinary.com/demo/image/upload.jpg",
    secure_url: "https://res.cloudinary.com/demo/image/upload.jpg",
  });
});
