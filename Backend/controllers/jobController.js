import Job from "../models/Jobs.js";
import Project from "../models/Project.js";
import Application from "../models/Application.js";
import { createProjectActivity } from "../utils/createProjectActivity.js";
import mongoose from "mongoose";

export const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      projectId,
      roleType,
      requiredSkills,
      location,
      isRemote,
      expiresAt,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only project owners can create jobs",
      });
    }

    const job = await Job.create({
      title,
      description,
      project: project._id,
      owner: req.user._id,
      roleType,
      requiredSkills,
      location,
      isRemote,
      expiresAt,
    });

    await createProjectActivity({
      project: project._id,
      user: req.user._id,
      action: "JOB_CREATED",
      message: `${req.user.username} created a new job opening: ${job.title}.`,
    });

    res.status(201).json({
      success: true,
      job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({
      status: "Open",
    })
      .populate("project", "name")
      .populate("owner", "username")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getJobById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID",
      });
    }

    const job = await Job.findById(req.params.jobId)
      .populate("project")
      .populate("owner", "username email");

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({
      owner: req.user._id,
    })
      .populate("project", "name")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateJob = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID",
      });
    }
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the owner can update this job",
      });
    }

    const allowedUpdates = [
      "title",
      "description",
      "roleType",
      "requiredSkills",
      "location",
      "isRemote",
      "expiresAt",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    });

    await job.save();

    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const closeJob = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID",
      });
    }

    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the owner can close this job",
      });
    }

    if (job.status === "Closed") {
      return res.status(400).json({
        success: false,
        message: "Job is already closed",
      });
    }

    job.status = "Closed";

    await job.save();

    await createProjectActivity({
      project: job.project,
      user: req.user._id,
      action: "JOB_CLOSED",
      message: `${req.user.username} closed a hiring post`,
    });

    res.status(200).json({
      success: true,
      message: "Job closed successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteJob = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID",
      });
    }
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the owner can delete this job",
      });
    }

    await Application.deleteMany({
      job: job._id,
    });

    await job.deleteOne();

    await createProjectActivity({
      project: job.project,
      user: req.user._id,
      action: "JOB_DELETED",
      message: `${req.user.username} deleted a hiring post`,
    });

    res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProjectJobs = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const jobs = await Job.find({
      project: req.params.projectId,
    })
      .populate("owner", "username avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
