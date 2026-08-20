import mongoose from "mongoose";
import Project from "../models/Project.js";
import PartnershipRequest from "../models/PartnershipRequest.js";
import Job from "../models/Jobs.js";
import User from "../models/User.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import { createProjectActivity } from "../utils/createProjectActivity.js";
import { v2 as cloudinary } from "cloudinary";
import ProjectActivity from "../models/ProjectActivity.js";

/* ---------------- CREATE PROJECT ---------------- */
export const createProject = async (req, res) => {
  try {
    const {
      name,
      tagline,
      description,
      category,
      technologies,
      status,
      visibility,
      lookingForPartners,
      lookingForTalent,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project name is required",
      });
    }
    let parsedTechnologies = [];

    if (technologies) {
      try {
        parsedTechnologies = JSON.parse(technologies);

        if (!Array.isArray(parsedTechnologies)) {
          throw new Error();
        }
      } catch {
        return res.status(400).json({
          success: false,
          message: "Technologies must be an array",
        });
      }
    }

    let logo = {
      publicId: "",
      url: "",
    };

    let coverImage = {
      publicId: "",
      url: "",
    };

    // Upload project profile image if provided
    // Upload project logo
    if (req.files?.logo?.[0]) {
      const uploaded = await uploadToCloudinary(
        req.files.logo[0].buffer,
        "devstream-nexus/projects/profile-images",
      );

      logo = {
        publicId: uploaded.public_id,
        url: uploaded.secure_url,
      };
    }

    // Upload cover image if provided
    if (req.files?.coverImage?.[0]) {
      const uploaded = await uploadToCloudinary(
        req.files.coverImage[0].buffer,
        "devstream-nexus/projects/covers",
      );

      coverImage = {
        publicId: uploaded.public_id,
        url: uploaded.secure_url,
      };
    }

    const project = await Project.create({
      name: name.trim(),
      tagline: tagline?.trim() || "",
      description: description?.trim() || "",
      category: category || "",
      technologies: parsedTechnologies,
      status,
      visibility,

      lookingForPartners: lookingForPartners === "true",

      lookingForTalent: lookingForTalent === "true",

      owner: req.user._id,
      members: [],
      logo,
      coverImage,
    });

    await createProjectActivity({
      project: project._id,
      user: req.user._id,
      action: "PROJECT_CREATED",
      message: `${req.user.username} created project ${project.name}`,
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- GET ALL PROJECTS ---------------- */
export const getProjects = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const filter = {
      visibility: "Public",
    };

    const totalProjects = await Project.countDocuments(filter);

    const projects = await Project.find(filter)
      .populate("owner", "username avatar")
      .populate("members", "username avatar")
      .populate("coOwners", "username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: projects.length,
      totalProjects,
      totalPages: Math.ceil(totalProjects / limit),
      currentPage: page,
      projects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- GET PROJECT BY ID ---------------- */
export const getProjectById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const project = await Project.findById(req.params.id)
      .populate("owner", "username avatar")
      .populate("members", "username avatar")
      .populate("coOwners", "username avatar");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const [partnershipCount, hiringCount] = await Promise.all([
      PartnershipRequest.countDocuments({
        project: project._id,
        status: "Pending",
      }),

      Job.countDocuments({
        project: project._id,
        status: "Open",
      }),
    ]);

    res.status(200).json({
      success: true,
      project: {
        ...project.toObject(),
        partnershipCount,
        hiringCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- UPDATE PROJECT ---------------- */
export const updateProject = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this project",
      });
    }

    // Parse technologies from FormData
    if (req.body.technologies) {
      try {
        req.body.technologies = JSON.parse(req.body.technologies);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid technologies format",
        });
      }
    }

    if (
      req.body.technologies !== undefined &&
      !Array.isArray(req.body.technologies)
    ) {
      return res.status(400).json({
        success: false,
        message: "Technologies must be an array",
      });
    }

    if (req.body.name !== undefined && !req.body.name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project name cannot be empty",
      });
    }

    /*
    =========================================
    REMOVE EXISTING LOGO
    =========================================
    */

    if (req.body.removeLogo === "true") {
      if (project.logo?.publicId) {
        await cloudinary.uploader.destroy(project.logo.publicId);
      }

      project.logo = {
        publicId: "",
        url: "",
      };
    }

    if (req.body.removeCoverImage === "true") {
      if (project.coverImage?.publicId) {
        await cloudinary.uploader.destroy(project.coverImage.publicId);
      }

      project.coverImage = {
        publicId: "",
        url: "",
      };
    }

    const allowedUpdates = [
      "name",
      "tagline",
      "description",
      "category",
      "technologies",
      "status",
      "visibility",
      "lookingForPartners",
      "lookingForTalent",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });

    /*
    =========================================
    UPLOAD NEW LOGO
    =========================================
    */

    if (req.files?.logo?.[0]) {
      // delete old logo first
      if (project.logo?.publicId) {
        await cloudinary.uploader.destroy(project.logo.publicId);
      }

      const uploaded = await uploadToCloudinary(
        req.files.logo[0].buffer,
        "devstream-nexus/projects/profile-images",
      );

      project.logo = {
        publicId: uploaded.public_id,
        url: uploaded.secure_url,
      };
    }

    if (req.files?.coverImage?.[0]) {
      if (project.coverImage?.publicId) {
        await cloudinary.uploader.destroy(project.coverImage.publicId);
      }

      const uploaded = await uploadToCloudinary(
        req.files.coverImage[0].buffer,
        "devstream-nexus/projects/covers",
      );

      project.coverImage = {
        publicId: uploaded.public_id,
        url: uploaded.secure_url,
      };
    }

    await project.save();

    await createProjectActivity({
      project: project._id,
      user: req.user._id,
      action: "PROJECT_UPDATED",
      message: `${req.user.username} updated the project.`,
    });

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- DELETE PROJECT ---------------- */
export const deleteProject = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this project",
      });
    }

    await Promise.allSettled(
      (project.images || [])
        .filter((image) => image.publicId)
        .map((image) => cloudinary.uploader.destroy(image.publicId)),
    );

    await Promise.all([
      PartnershipRequest.deleteMany({
        project: project._id,
      }),
      Job.deleteMany({
        project: project._id,
      }),
      ProjectActivity.deleteMany({
        project: project._id,
      }),
    ]);

    await Promise.allSettled([
      ...(project.logo?.publicId
        ? [cloudinary.uploader.destroy(project.logo.publicId)]
        : []),

      ...(project.coverImage?.publicId
        ? [cloudinary.uploader.destroy(project.coverImage.publicId)]
        : []),
    ]);

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

/* ---------------- LEAVE PROJECT ---------------- */
export const leaveProject = async (req, res) => {
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

    if (project.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Project owner cannot leave their own project",
      });
    }

    const isMember =
      project.members.some(
        (member) => member.toString() === req.user._id.toString(),
      ) ||
      project.coOwners.some(
        (coOwner) => coOwner.toString() === req.user._id.toString(),
      );

    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: "You are not a member of this project",
      });
    }

    project.members = project.members.filter(
      (member) => member.toString() !== req.user._id.toString(),
    );

    project.coOwners = project.coOwners.filter(
      (coOwner) => coOwner.toString() !== req.user._id.toString(),
    );

    await project.save();

    await createProjectActivity({
      project: project._id,
      user: req.user._id,
      action: "MEMBER_LEFT",
      message: `${req.user.username} left the project.`,
    });

    res.status(200).json({
      success: true,
      message: "You have left the project",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- REMOVE MEMBER ---------------- */
export const removeMember = async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const project = await Project.findById(projectId);
    const removedUser = await User.findById(userId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner can remove members",
      });
    }

    if (project.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "Project owner cannot be removed",
      });
    }

    const isMember =
      project.members.some((member) => member.toString() === userId) ||
      project.coOwners.some((coOwner) => coOwner.toString() === userId);

    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: "User is not part of this project",
      });
    }

    project.members = project.members.filter(
      (member) => member.toString() !== userId,
    );

    project.coOwners = project.coOwners.filter(
      (coOwner) => coOwner.toString() !== userId,
    );

    await project.save();

    await createProjectActivity({
      project: project._id,
      user: req.user._id,
      action: "MEMBER_REMOVED",
      message: `${
        removedUser?.username || "A member"
      } was removed from the project.`,
    });

    res.status(200).json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- UPLOAD PROJECT IMAGES ---------------- */
export const uploadProjectImages = async (req, res) => {
  const uploadedPublicIds = [];

  try {
    const { projectId } = req.params;

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

    const canManage =
      project.owner.toString() === req.user._id.toString() ||
      project.coOwners.some(
        (coOwner) => coOwner.toString() === req.user._id.toString(),
      );

    if (!canManage) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one image",
      });
    }

    if ((project.images?.length || 0) + req.files.length > 5) {
      return res.status(400).json({
        success: false,
        message: "Maximum of 5 project images allowed",
      });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    for (const file of req.files) {
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Only JPG, PNG and WEBP images are allowed",
        });
      }
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const result = await uploadToCloudinary(
        file.buffer,
        "devstream-nexus/projects",
      );

      uploadedPublicIds.push(result.public_id);

      uploadedImages.push({
        publicId: result.public_id,
        url: result.secure_url,
      });
    }

    project.images = [...(project.images || []), ...uploadedImages];

    await project.save();

    await createProjectActivity({
      project: project._id,
      user: req.user._id,
      action: "IMAGE_UPLOADED",
      message: `${req.user.username} uploaded ${
        uploadedImages.length
      } image${uploadedImages.length > 1 ? "s" : ""}.`,
    });

    res.status(200).json({
      success: true,
      count: uploadedImages.length,
      images: project.images,
    });
  } catch (error) {
    for (const publicId of uploadedPublicIds) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (cleanupError) {}
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ---------------- DELETE PROJECT IMAGE ---------------- */
export const deleteProjectImage = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { publicId } = req.body;

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

    const canManage =
      project.owner.toString() === req.user._id.toString() ||
      project.coOwners.some(
        (coOwner) => coOwner.toString() === req.user._id.toString(),
      );

    if (!canManage) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "publicId is required",
      });
    }

    const imageExists = project.images.some(
      (image) => image.publicId === publicId,
    );

    if (!imageExists) {
      return res.status(404).json({
        success: false,
        message: "Image not found in project",
      });
    }

    await cloudinary.uploader.destroy(publicId);

    project.images = project.images.filter(
      (image) => image.publicId !== publicId,
    );

    await project.save();

    await createProjectActivity({
      project: project._id,
      user: req.user._id,
      action: "IMAGE_DELETED",
      message: `${req.user.username} deleted an image.`,
    });

    res.status(200).json({
      success: true,
      message: "Project image removed successfully",
      images: project.images,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { members: req.user._id },
        { coOwners: req.user._id },
      ],
    })
      .populate("owner", "name username avatar")
      .populate("members", "name username avatar")
      .populate("coOwners", "name username avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserProjects = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const projects = await Project.find({
      visibility: "Public",
      $or: [{ owner: userId }, { members: userId }, { coOwners: userId }],
    })
      .populate("owner", "name username avatar")
      .populate("members", "name username avatar")
      .populate("coOwners", "name username avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
