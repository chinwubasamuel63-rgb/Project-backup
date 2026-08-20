import mongoose from "mongoose";
import Project from "../../models/Project.js";
import createAuditLog from "../../utils/createAuditLog.js";

export const getAllProjects = async (req, res) => {
  try {
    const {
      search = "",
      category,
      status,
      visibility,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (search.trim()) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      query.name = {
        $regex: escapedSearch,
        $options: "i",
      };
    }

    if (category) query.category = category;
    if (status) query.status = status;
    if (visibility) query.visibility = visibility;

    const pageNumber = Math.max(1, Number(page));

    const pageLimit = Math.min(Math.max(1, Number(limit)), 100);

    const totalProjects = await Project.countDocuments(query);

    const projects = await Project.find(query)
      .select(
        "name tagline category owner status visibility lookingForPartners lookingForTalent createdAt updatedAt",
      )
      .populate("owner", "username email avatar")
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
      message: "Unable to process admin project request",
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
      .populate("owner", "username email role avatar bio")
      .populate("coOwners", "username email role avatar")
      .populate("members", "username email role avatar");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      project,
      statistics: {
        memberCount: project.members.length,
        coOwnerCount: project.coOwners.length,
        technologyCount: project.technologies.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to process admin project request",
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

    await createAuditLog({
      admin: req.user._id,
      action: "PROJECT_DELETED",
      details: `Project deleted: ${project.name} (${project._id})`,
    });

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to process admin project request",
    });
  }
};
