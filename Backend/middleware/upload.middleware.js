import multer from "multer";
import path from "path";
import { validateAttachmentFile } from "../utils/messageSecurity.js";

const storage = multer.memoryStorage();

const allowedExtensions = new Set([
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
  "pdf",
  "txt",
  "md",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "csv",
  "zip",
  "rar",
  "7z",
  "json",
  "xml",
  "js",
  "ts",
  "jsx",
  "tsx",
  "css",
  "scss",
  "html",
  "java",
  "py",
  "c",
  "cpp",
  "cs",
  "go",
  "php",
  "swift",
  "kt",
  "sql",
  "sh",
  "yaml",
  "yml",
]);

const fileFilter = (req, file, cb) => {
  const extension = path
    .extname(file.originalname || "")
    .slice(1)
    .toLowerCase();
  const mimetype = (file.mimetype || "").toLowerCase();

  if (!allowedExtensions.has(extension)) {
    cb(new Error("Unsupported attachment type"), false);
    return;
  }

  if (
    mimetype &&
    (mimetype.includes("script") || mimetype.includes("javascript"))
  ) {
    cb(new Error("Unsupported attachment type"), false);
    return;
  }

  const validation = validateAttachmentFile(
    {
      originalname: file.originalname,
      mimetype: mimetype || "application/octet-stream",
      size: file.size,
    },
    { allowUnknownSize: true },
  );

  if (!validation.valid) {
    cb(new Error(validation.message), false);
    return;
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
  },
});

export const attachmentUpload = upload;

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "FILE_TOO_LARGE") {
      return res.status(400).json({
        success: false,
        message: "File size must be between 1 and 10MB",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || "File upload error",
    });
  }

  if (err instanceof Error) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next(err);
};

export default upload;
export { handleMulterError };
