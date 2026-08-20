import test from "node:test";
import assert from "node:assert/strict";
import { buildInstructorSupportActivityFeed } from "../utils/supportActivity.js";

test("buildInstructorSupportActivityFeed returns the latest status changes sorted by recency", () => {
  const tickets = [
    {
      _id: "ticket-1",
      ticketNumber: "1001",
      title: "Login issue",
      student: { username: "studentA" },
      statusHistory: [
        { status: "Open", createdAt: "2024-01-01T00:00:00.000Z" },
        { status: "In Progress", createdAt: "2024-01-02T00:00:00.000Z" },
      ],
    },
    {
      _id: "ticket-2",
      ticketNumber: "1002",
      title: "Billing issue",
      student: { username: "studentB" },
      statusHistory: [
        {
          status: "Waiting For Student",
          createdAt: "2024-01-03T00:00:00.000Z",
        },
      ],
    },
  ];

  const feed = buildInstructorSupportActivityFeed(tickets, 10);

  assert.equal(feed.length, 3);
  assert.equal(feed[0].ticketNumber, "1002");
  assert.equal(feed[0].status, "Waiting For Student");
  assert.equal(feed[1].ticketNumber, "1001");
  assert.equal(feed[1].status, "In Progress");
});
