import Application from "../models/Application.js";
import mongoose from "mongoose";
import Job from "../models/Jobs.js";
import Project from "../models/Project.js";
import { createNotification } from "../utils/createNotification.js";
import User from "../models/User.js";
import { sendEmail } from "../services/email.service.js";
import {
  applicationSubmittedEmail,
  applicationReceivedEmail,
  applicationAcceptedEmail,
  applicationRejectedEmail,
} from "../templates/emails/hiringEmail.js";

export const applyToJob = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID",
      });
    }

    const { coverLetter, portfolioUrl, resumeUrl } = req.body;

    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.status !== "Open") {
      return res.status(400).json({
        success: false,
        message: "Job is closed",
      });
    }

    if (job.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot apply to your own job",
      });
    }

    const existingApplication = await Application.findOne({
      job: job._id,
      applicant: req.user._id,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied",
      });
    }

    const application = await Application.create({
      job: job._id,
      applicant: req.user._id,
      coverLetter,
      portfolioUrl,
      resumeUrl,
    });

    await Job.findByIdAndUpdate(job._id, {
      $inc: {
        applicationCount: 1,
      },
    });

    await createNotification({
      user: job.owner,
      type: "job_application",
      title: "New Job Application",
      message: `${req.user.username} applied for ${job.title}`,
      relatedEntity: application._id,
      relatedEntityType: "Application",
    });

    try {
      const applicant = await User.findById(req.user._id);

      if (applicant?.email) {
        await sendEmail({
          to: applicant.email,
          subject: "Application Submitted",
          html: applicationSubmittedEmail(job.title),
        });
      }
    } catch (error) {
      console.error("Application submitted email failed:", error.message);
    }

    try {
      const owner = await User.findById(job.owner);

      if (owner?.email) {
        await sendEmail({
          to: owner.email,
          subject: "New Job Application",
          html: applicationReceivedEmail(req.user.username, job.title),
        });
      }
    } catch (error) {
      console.error("Application received email failed:", error.message);
    }

    res.status(201).json({
      success: true,
      application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getJobApplications = async (req, res) => {
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
        message: "Access denied",
      });
    }

    const applications = await Application.find({
      job: job._id,
    })
      .populate("applicant", "username email profilePicture")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({
      applicant: req.user._id,
    })
      .populate("job")
      .populate("applicant", "username")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const acceptApplication = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.applicationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const application = await Application.findById(req.params.applicationId)
      .populate("job")
      .populate("applicant", "username");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (application.job.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (application.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Application already processed",
      });
    }

    application.status = "Accepted";

    await application.save();

    if (application.job.project) {
      await Project.findByIdAndUpdate(application.job.project, {
        $addToSet: {
          members: application.applicant._id,
        },
      });
    }

    await createNotification({
      user: application.applicant._id,
      type: "application_accepted",
      title: "Application Accepted",
      message: `Your application for ${application.job.title} was accepted`,
      relatedEntity: application._id,
      relatedEntityType: "Application",
    });

    try {
      const applicant = await User.findById(application.applicant._id);

      if (applicant?.email) {
        await sendEmail({
          to: applicant.email,
          subject: "Application Accepted",
          html: applicationAcceptedEmail(application.job.title),
        });
      }
    } catch (error) {
      console.error("Application accepted email failed:", error.message);
    }

    res.status(200).json({
      success: true,
      application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const rejectApplication = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.applicationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const application = await Application.findById(req.params.applicationId)
      .populate("job")
      .populate("applicant", "username");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (application.job.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (application.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Application already processed",
      });
    }

    application.status = "Rejected";

    await application.save();

    await createNotification({
      user: application.applicant._id,
      type: "application_rejected",
      title: "Application Rejected",
      message: `Your application for ${application.job.title} was rejected`,
      relatedEntity: application._id,
      relatedEntityType: "Application",
    });

    try {
      const applicant = await User.findById(application.applicant._id);

      if (applicant?.email) {
        await sendEmail({
          to: applicant.email,
          subject: "Application Rejected",
          html: applicationRejectedEmail(application.job.title),
        });
      }
    } catch (error) {
      console.error("Application rejected email failed:", error.message);
    }

    res.status(200).json({
      success: true,
      application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const withdrawApplication = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.applicationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const application = await Application.findById(req.params.applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (application.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending applications can be withdrawn",
      });
    }

    application.status = "Withdrawn";

    await application.save();

    res.status(200).json({
      success: true,
      application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
