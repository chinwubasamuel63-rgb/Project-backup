import mongoose from "mongoose";
import PartnershipRequest from "../models/PartnershipRequest.js";
import Project from "../models/Project.js";
import { createNotification } from "../utils/createNotification.js";
import User from "../models/User.js";
import { sendEmail } from "../services/email.service.js";
import {
  partnershipRequestReceivedEmail,
  partnershipAcceptedEmail,
  partnershipRejectedEmail,
} from "../templates/emails/partnershipRequestEmail.js";

export const createPartnershipRequest = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const { message } = req.body;

    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!project.lookingForPartners) {
      return res.status(400).json({
        success: false,
        message: "This project is not accepting partnership requests",
      });
    }

    const isMember = project.members.some(
      (member) => member.toString() === req.user._id.toString(),
    );

    if (isMember) {
      return res.status(400).json({
        success: false,
        message: "You are already a member of this project",
      });
    }

    if (project.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot apply to your own project",
      });
    }

    const existingRequest = await PartnershipRequest.findOne({
      project: project._id,
      applicant: req.user._id,
      status: {
        $in: ["Pending", "Accepted"],
      },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Partnership request already exists",
      });
    }

    const recentRequest = await PartnershipRequest.findOne({
      project: project._id,
      applicant: req.user._id,
      status: {
        $in: ["Rejected", "Withdrawn"],
      },
    }).sort({
      statusChangedAt: -1,
    });

    if (recentRequest) {
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      const timeSinceLastDecision =
        Date.now() - new Date(recentRequest.statusChangedAt).getTime();

      if (timeSinceLastDecision < sevenDays) {
        return res.status(400).json({
          success: false,
          message: "You must wait 7 days before applying again",
        });
      }
    }

    const request = await PartnershipRequest.create({
      project: project._id,
      applicant: req.user._id,
      message: message?.trim() || "",
    });

    await createNotification({
      user: project.owner,
      type: "partnership_request",
      title: "New Partnership Request",
      message: `${req.user.username} wants to join your project.`,
      relatedEntity: request._id,
      relatedEntityType: "PartnershipRequest",
    });

    try {
      const owner = await User.findById(project.owner).select("email");

      if (owner?.email) {
        await sendEmail({
          to: owner.email,
          subject: "New Partnership Request",
          html: partnershipRequestReceivedEmail(
            req.user.username,
            project.name,
          ),
        });
      }
    } catch (error) {
      console.error("Partnership request email failed:", error.message);
    }

    res.status(201).json({
      success: true,
      message: "Partnership request submitted",
      request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProjectRequests = async (req, res) => {
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

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const requests = await PartnershipRequest.find({
      project: project._id,
    })
      .populate("applicant", "username email avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const acceptRequest = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID",
      });
    }

    const request = await PartnershipRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    const project = await Project.findById(request.project);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be accepted",
      });
    }

    request.status = "Accepted";
    request.statusChangedAt = Date.now();

    await request.save();

    await createNotification({
      user: request.applicant,
      type: "partnership_accepted",
      title: "Request Accepted",
      message: "Your partnership request has been accepted.",
      relatedEntity: project._id,
      relatedEntityType: "Project",
    });

    await createProjectActivity({
      project: project._id,
      user: applicant._id,
      action: "MEMBER_JOINED",
      message: `${applicant.username} joined the project`,
    });

    try {
      const applicant = await User.findById(request.applicant).select("email");

      if (applicant?.email) {
        await sendEmail({
          to: applicant.email,
          subject: "Partnership Request Accepted",
          html: partnershipAcceptedEmail(project.name),
        });
      }
    } catch (error) {
      console.error("Partnership accepted email failed:", error.message);
    }

    const alreadyMember = project.members.some(
      (member) => member.toString() === request.applicant.toString(),
    );

    if (!alreadyMember) {
      project.members.push(request.applicant);
      await project.save();
    }

    res.status(200).json({
      success: true,
      message: "Request accepted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID",
      });
    }

    const request = await PartnershipRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    const project = await Project.findById(request.project);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be rejected",
      });
    }

    request.status = "Rejected";
    request.statusChangedAt = Date.now();

    await request.save();

    await createNotification({
      user: request.applicant,
      type: "partnership_rejected",
      title: "Request Rejected",
      message: "Your partnership request has been rejected.",
      relatedEntity: project._id,
      relatedEntityType: "Project",
    });

    try {
      const applicant = await User.findById(request.applicant).select("email");

      if (applicant?.email) {
        await sendEmail({
          to: applicant.email,
          subject: "Partnership Request Rejected",
          html: partnershipRejectedEmail(project.title),
        });
      }
    } catch (error) {
      console.error("Partnership rejected email failed:", error.message);
    }

    res.status(200).json({
      success: true,
      message: "Request rejected",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const withdrawRequest = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID",
      });
    }

    const request = await PartnershipRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    if (request.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to withdraw this request",
      });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be withdrawn",
      });
    }

    request.status = "Withdrawn";
    request.statusChangedAt = Date.now();

    await request.save();

    res.status(200).json({
      success: true,
      message: "Partnership request withdrawn successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyPartnershipRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    // Projects owned by current user
    const projects = await Project.find({
      owner: userId,
    }).select("_id");

    const projectIds = projects.map((project) => project._id);

    const requests = await PartnershipRequest.find({
      project: { $in: projectIds },
      status: "Pending",
    })
      .populate("applicant", "name username email")
      .populate("project", "name");

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyProjectRequest = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const request = await PartnershipRequest.findOne({
      project: req.params.projectId,
      applicant: req.user._id,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
