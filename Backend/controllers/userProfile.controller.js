import User from "../models/User.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import { v2 as cloudinary } from "cloudinary";

export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.avatar?.publicId) {
      await cloudinary.uploader.destroy(user.avatar.publicId);
    }

    const result = await uploadToCloudinary(
      req.file.buffer,
      "devstream-nexus/avatars"
    );

    user.avatar = {
      publicId: result.public_id,
      url: result.secure_url,
    };

    await user.save();

    res.status(200).json({
      success: true,
      avatar: user.avatar,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.avatar?.publicId) {
      return res.status(400).json({
        success: false,
        message: "No avatar to delete",
      });
    }

    await cloudinary.uploader.destroy(user.avatar.publicId);

    user.avatar = {
      publicId: "",
      url: "",
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Avatar removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};