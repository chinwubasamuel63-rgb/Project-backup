import crypto from "crypto";

const BLOCKED_EXTENSIONS = new Set([
  "exe",
  "msi",
  "bat",
  "cmd",
  "scr",
  "dll",
  "ps1",
  "vbs",
  "com",
  "apk",
]);

const ALLOWED_MIME_TYPES = new Map([
  ["image/jpeg", ["jpg", "jpeg"]],
  ["image/jpg", ["jpg", "jpeg"]],
  ["image/png", ["png"]],
  ["image/gif", ["gif"]],
  ["image/webp", ["webp"]],
  ["image/avif", ["avif"]],
  ["image/heic", ["heic"]],
  ["image/heif", ["heif"]],
  ["image/bmp", ["bmp"]],
  ["image/x-icon", ["ico"]],
  ["image/vnd.microsoft.icon", ["ico"]],
  ["image/svg+xml", ["svg"]],
  ["application/pdf", ["pdf"]],
  ["text/plain", ["txt", "md"]],
  ["application/json", ["json"]],
  ["application/xml", ["xml"]],
  ["text/xml", ["xml"]],
  ["application/zip", ["zip"]],
  ["application/x-zip-compressed", ["zip"]],
  ["application/x-zip", ["zip"]],
  ["application/x-rar-compressed", ["rar"]],
  ["application/vnd.rar", ["rar"]],
  ["application/x-7z-compressed", ["7z"]],
  ["application/msword", ["doc"]],
  [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ["docx"],
  ],
  ["application/vnd.ms-excel", ["xls"]],
  [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ["xlsx"],
  ],
  ["application/vnd.ms-powerpoint", ["ppt"]],
  [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ["pptx"],
  ],
  ["text/csv", ["csv"]],
  ["application/javascript", ["js", "ts", "jsx", "tsx", "cjs", "mjs"]],
  ["text/javascript", ["js", "ts", "jsx", "tsx", "cjs", "mjs"]],
  ["text/css", ["css", "scss"]],
  ["text/html", ["html"]],
  ["application/x-yaml", ["yaml", "yml"]],
  ["application/x-sh", ["sh"]],
  ["application/x-php", ["php"]],
  ["application/x-java-archive", ["jar"]],
  ["text/x-java", ["java"]],
  ["text/x-python", ["py"]],
  ["text/x-c", ["c"]],
  ["text/x-c++", ["cpp"]],
  ["text/x-csharp", ["cs"]],
  ["text/x-go", ["go"]],
  ["text/x-php", ["php"]],
  ["text/x-swift", ["swift"]],
  ["text/x-kotlin", ["kt"]],
  ["application/sql", ["sql"]],
  ["application/x-sql", ["sql"]],
]);

const XSS_PATTERNS = [
  /<script[^>]*>/gi,
  /javascript:/gi,
  /on\w+=/gi,
  /<iframe[^>]*>/gi,
  /<object[^>]*>/gi,
  /<embed[^>]*>/gi,
  /<svg[^>]*>/gi,
  /\b(alert|eval|setTimeout|setInterval)\s*\(/gi,
];

export const sanitizeMessageContent = (value = "") => {
  if (typeof value !== "string") {
    return "";
  }

  let sanitized = value.replace(/\r\n/g, "\n").trim();

  XSS_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });

  sanitized = sanitized.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  sanitized = sanitized.replace(/\s{2,}/g, " ");

  return sanitized;
};

export const validateAttachmentFile = (file, options = {}) => {
  if (!file || typeof file !== "object") {
    return { valid: false, message: "Invalid file payload" };
  }

  const originalName = String(file.originalname || "").trim();
  const mimeType = String(file.mimetype || "").toLowerCase();
  const normalizedMimeType =
    mimeType === "image/svg" ? "image/svg+xml" : mimeType;
  const allowUnknownSize = options.allowUnknownSize === true;
  const hasSize = file.size !== undefined && file.size !== null;
  const rawSize = Number(file.size ?? 0);
  const size = Number.isFinite(rawSize) ? rawSize : 0;

  if (!originalName) {
    return { valid: false, message: "File name is required" };
  }

  const extension = originalName.split(".").pop()?.toLowerCase() || "";

  if (!extension || BLOCKED_EXTENSIONS.has(extension)) {
    return { valid: false, message: "Unsupported file type" };
  }

  const commonImageExtensions = new Set([
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "avif",
    "heic",
    "heif",
    "bmp",
    "ico",
    "svg",
  ]);

  const browserFallbackMime =
    !normalizedMimeType || normalizedMimeType === "application/octet-stream";
  const browserFallbackImage =
    browserFallbackMime && commonImageExtensions.has(extension);

  if (
    !allowUnknownSize &&
    (!hasSize || !Number.isFinite(rawSize) || size <= 0)
  ) {
    if (browserFallbackImage) {
      return { valid: true };
    }

    return { valid: false, message: "Selected file is empty or unreadable" };
  }

  if (!allowUnknownSize && size > 10 * 1024 * 1024) {
    return { valid: false, message: "File size must be between 1 and 10MB" };
  }

  const allowedMimeTypes = ALLOWED_MIME_TYPES.get(normalizedMimeType);

  if (!allowedMimeTypes) {
    if (browserFallbackImage) {
      return { valid: true };
    }

    return { valid: false, message: "Unsupported MIME type" };
  }

  if (!allowedMimeTypes.includes(extension)) {
    if (browserFallbackImage) {
      return { valid: true };
    }

    return { valid: false, message: "File extension does not match MIME type" };
  }

  return { valid: true };
};

export const buildMessagePagination = (cursor, limit = 50) => {
  const pageLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

  if (!cursor) {
    return { limit: pageLimit };
  }

  const parsedCursor = Number(cursor);
  if (!Number.isFinite(parsedCursor)) {
    return { limit: pageLimit };
  }

  return { createdAt: { $lt: new Date(parsedCursor) }, limit: pageLimit };
};

export const normalizeApiMessageResponse = (payload) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if (
    payload?.data &&
    typeof payload.data === "object" &&
    payload.data.message
  ) {
    return payload.data.message;
  }

  if (payload?.message && typeof payload.message === "object") {
    return payload.message;
  }

  return payload;
};

export const createSafeMessageId = () => crypto.randomBytes(8).toString("hex");
