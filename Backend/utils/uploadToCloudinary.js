import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        allowed_formats: [
          "jpg",
          "jpeg",
          "png",
          "gif",
          "webp",
          "avif",
          "heic",
          "heif",
          "bmp",
          "svg",
          "ico",
        ],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      },
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

export default uploadToCloudinary;
