import test from "node:test";
import assert from "node:assert/strict";

import { canAccessStream } from "../services/streamAccess.service.js";

test("allows public streams to be viewed by any authenticated user", () => {
  const stream = { visibility: "public" };
  const user = { _id: "user-1" };

  assert.equal(canAccessStream(stream, user, "read"), true);
});

test("allows project members to access private streams", () => {
  const stream = {
    visibility: "private",
    project: {
      owner: "owner-1",
      coOwners: ["co-owner-1"],
      members: ["member-1"],
    },
  };
  const user = { _id: "member-1" };

  assert.equal(canAccessStream(stream, user, "read"), true);
});

test("blocks unauthorized users from private streams", () => {
  const stream = {
    visibility: "private",
    project: {
      owner: "owner-1",
      coOwners: ["co-owner-1"],
      members: ["member-1"],
    },
  };
  const user = { _id: "stranger-1" };

  assert.equal(canAccessStream(stream, user, "read"), false);
});

test("allows admins to access private streams", () => {
  const stream = {
    visibility: "private",
    project: {
      owner: "owner-1",
      coOwners: ["co-owner-1"],
      members: ["member-1"],
    },
  };
  const user = { _id: "admin-1", role: "admin" };

  assert.equal(canAccessStream(stream, user, "read"), true);
});
