import test from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeMessageContent,
  validateAttachmentFile,
  normalizeApiMessageResponse,
} from "../utils/messageSecurity.js";

test("sanitizeMessageContent removes scripts and javascript links", () => {
  const input =
    "<script>alert(1)</script> Hello <img src=x onerror=alert(2)> javascript:alert(1)";
  const output = sanitizeMessageContent(input);

  assert.equal(output.includes("<script"), false);
  assert.equal(output.includes("javascript:"), false);
  assert.equal(output.includes("alert(1)"), false);
});

test("validateAttachmentFile rejects executable files and MIME mismatches", () => {
  const invalidMime = validateAttachmentFile({
    originalname: "payload.exe",
    mimetype: "application/octet-stream",
    size: 1024,
  });

  assert.equal(invalidMime.valid, false);

  const invalidExtension = validateAttachmentFile({
    originalname: "image.png",
    mimetype: "text/plain",
    size: 1024,
  });

  assert.equal(invalidExtension.valid, false);

  const validPdf = validateAttachmentFile({
    originalname: "file.pdf",
    mimetype: "application/pdf",
    size: 1024,
  });

  assert.equal(validPdf.valid, true);

  const browserFallbackImage = validateAttachmentFile({
    originalname: "thumbnail.png",
    mimetype: "application/octet-stream",
    size: 1024,
  });

  assert.equal(browserFallbackImage.valid, true);

  const blankMimeFallbackImage = validateAttachmentFile({
    originalname: "982573.jpg",
    mimetype: "",
    size: 1024,
  });

  assert.equal(blankMimeFallbackImage.valid, true);

  const missingSizeFallbackImage = validateAttachmentFile({
    originalname: "photo.webp",
    mimetype: "",
    size: undefined,
  });

  assert.equal(missingSizeFallbackImage.valid, true);
});

test("normalizeApiMessageResponse returns the nested message payload", () => {
  const payload = {
    success: true,
    message: "Created",
    data: {
      message: {
        _id: "msg_1",
        content: "Hello",
      },
    },
  };

  assert.deepStrictEqual(normalizeApiMessageResponse(payload), {
    _id: "msg_1",
    content: "Hello",
  });
});
