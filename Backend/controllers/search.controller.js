import User from "../models/User.js";
import Project from "../models/Project.js";
import Job from "../models/Jobs.js";
import Product from "../models/Product.js";
import Stream from "../models/Stream.js";

export const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchRegex = new RegExp(q, "i");

    const [users, projects, jobs, products, streams] = await Promise.all([
      User.find({
        $or: [
          { username: searchRegex },
          { displayName: searchRegex },
          { email: searchRegex },
        ],
      })
        .select("username displayName avatar role primaryTrack")
        .limit(10),

      Project.find({
        $or: [
          { name: searchRegex },
          { tagline: searchRegex },
          { description: searchRegex },
        ],
      })
        .populate("owner", "username displayName avatar")
        .limit(10),

      Job.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { roleType: searchRegex },
        ],
      })
        .populate("owner", "username displayName avatar")
        .limit(10),

      Product.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { category: searchRegex },
        ],
      })
        .populate("seller", "username displayName avatar")
        .limit(10),

      Stream.find({
        title: searchRegex,
      })
        .populate("host", "username displayName avatar")
        .limit(10),
    ]);

    res.status(200).json({
      success: true,
      results: {
        users,
        projects,
        jobs,
        products,
        streams,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
