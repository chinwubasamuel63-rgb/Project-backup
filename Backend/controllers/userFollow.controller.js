import User from "../models/User.js";
import { createNotification } from "../utils/createNotification.js";

export const followUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const currentUser = await User.findById(req.user._id);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const alreadyFollowing = currentUser.following.includes(targetUserId);

    if (alreadyFollowing) {
      return res.status(400).json({
        success: false,
        message: "Already following this user",
      });
    }

    currentUser.following.push(targetUserId);
    targetUser.followers.push(req.user._id);

    await currentUser.save();
    await targetUser.save();

    if (alreadyFollowing) {
      return res.status(400).json({
        success: false,
        message: "Already following this user",
      });
    }

    await createNotification({
      user: targetUser._id,
      type: "follow",
      title: "New Follower",
      message: `${req.user.username} started following you`,
      relatedEntity: req.user._id,
      relatedEntityType: "User",
    });

    res.status(200).json({
      success: true,
      message: "User followed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    const currentUser = await User.findById(req.user._id);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== targetUserId,
    );

    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== req.user._id.toString(),
    );

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: "User unfollowed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      "followers",
      "username avatar role",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      count: user.followers.length,
      followers: user.followers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      "following",
      "username avatar role",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      count: user.following.length,
      following: user.following,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
