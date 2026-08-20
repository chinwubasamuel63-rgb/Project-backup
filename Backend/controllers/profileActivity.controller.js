import Project from "../models/Project.js";
import Product from "../models/Product.js";
import Job from "../models/Jobs.js";
import Stream from "../models/Stream.js";

export const getProfileActivity = async (req, res) => {
  try {
    const userId = req.user._id;

    const [projects, products, jobs, streams] = await Promise.all([
      Project.find({ owner: userId })
        .select("name createdAt")
        .sort({ createdAt: -1 })
        .limit(5),

      Product.find({ seller: userId })
        .select("title createdAt")
        .sort({ createdAt: -1 })
        .limit(5),

      Job.find({ owner: userId })
        .select("title createdAt")
        .sort({ createdAt: -1 })
        .limit(5),

      Stream.find({ host: userId })
        .select("title createdAt startedAt")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const activity = [
      ...projects.map((project) => ({
        type: "project",
        title: project.name,
        date: project.createdAt,
      })),

      ...products.map((product) => ({
        type: "product",
        title: product.title,
        date: product.createdAt,
      })),

      ...jobs.map((job) => ({
        type: "job",
        title: job.title,
        date: job.createdAt,
      })),

      ...streams.map((stream) => ({
        type: "stream",
        title: stream.title,
        date: stream.startedAt || stream.createdAt,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({
      success: true,
      count: activity.length,
      activity,
    });
  } catch (error) {
    ;

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
