import mongoose from "mongoose";
import Stream from "../../models/Stream.js";
import StreamAnalytics from "../../models/StreamAnalytics.js";

export const getLiveStreamsAdmin = async (req, res) => {
  try {
    const streams = await Stream.find()
      .populate("host", "username email")
      .populate("project", "title")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: streams.length,
      streams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStreamAnalyticsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = Math.max(1, Number(page));

    const pageLimit = Math.min(Math.max(1, Number(limit)), 100);

    const totalAnalytics = await StreamAnalytics.countDocuments();

    const analytics = await StreamAnalytics.find()
      .populate("host", "username email")
      .populate("project", "title")
      .sort({
        createdAt: -1,
      })
      .skip((pageNumber - 1) * pageLimit)
      .limit(pageLimit);

    res.status(200).json({
      success: true,

      pagination: {
        page: pageNumber,
        limit: pageLimit,
        totalAnalytics,
        totalPages: Math.ceil(totalAnalytics / pageLimit),
      },

      analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStreamAnalyticsByIdAdmin = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid analytics ID",
      });
    }

    const analytics = await StreamAnalytics.findById(req.params.id)
      .populate("host", "username email")
      .populate("project", "title");

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: "Analytics record not found",
      });
    }

    res.status(200).json({
      success: true,
      analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
