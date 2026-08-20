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
      "devstream-nexus/avatars",
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

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -resetPasswordToken -resetPasswordExpire",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      "displayName",
      "bio",
      "primaryTrack",
      "secondaryTracks",
      "skills",
      "experienceLevel",
      "portfolioUrl",
      "githubUrl",
      "linkedinUrl",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: updates,
      },
      {
        new: true,
        runValidators: true,
      },
    ).select("-password -resetPasswordToken -resetPasswordExpire");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCoverImage = async (req, res) => {
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

    if (user.coverImage?.publicId) {
      await cloudinary.uploader.destroy(user.coverImage.publicId);
    }

    const result = await uploadToCloudinary(
      req.file.buffer,
      "devstream-nexus/covers",
    );

    user.coverImage = {
      publicId: result.public_id,

      url: result.secure_url,
    };

    await user.save();

    res.json({
      success: true,

      coverImage: user.coverImage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteCoverImage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.coverImage?.publicId) {
      await cloudinary.uploader.destroy(user.coverImage.publicId);
    }

    user.coverImage = {
      publicId: "",
      url: "",
    };

    await user.save();

    res.json({
      success: true,

      message: "Cover removed",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      `
      username
      email
      displayName
      avatar
      coverImage
      bio
      role
      isVerified
      primaryTrack
      secondaryTracks
      skills
      experienceLevel
      portfolioUrl
      githubUrl
      linkedinUrl
      followers
      following
      isOnline
      lastSeen
      createdAt
      `,
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
