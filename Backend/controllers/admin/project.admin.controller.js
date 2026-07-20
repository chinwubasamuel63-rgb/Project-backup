import mongoose from "mongoose";
import Project from "../../models/Project.js";

export const getAllProjects = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const query = {};

    if (search.trim()) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      query.title = {
        $regex: escapedSearch,
        $options: "i",
      };
    }

    const pageNumber = Math.max(1, Number(page));

    const pageLimit = Math.min(Math.max(1, Number(limit)), 100);

    const totalProjects = await Project.countDocuments(query);

    const projects = await Project.find(query)
      .populate("owner", "username email")
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageLimit)
      .limit(pageLimit);

    res.status(200).json({
      success: true,

      pagination: {
        page: pageNumber,
        limit: pageLimit,
        totalProjects,
        totalPages: Math.ceil(totalProjects / pageLimit),
      },

      projects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProjectByIdAdmin = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const project = await Project.findById(req.params.projectId)
      .populate("owner", "username email profilePicture")
      .populate("members", "username email profilePicture");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteProjectAdmin = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
