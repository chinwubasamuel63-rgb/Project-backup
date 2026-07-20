import mongoose from "mongoose";

const projectActivitySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      required: true,
      enum: [
        "PROJECT_CREATED",
        "PROJECT_UPDATED",
        "MEMBER_JOINED",
        "MEMBER_LEFT",
        "MEMBER_REMOVED",
        "PARTNERSHIP_ACCEPTED",
        "JOB_CREATED",
        "JOB_CLOSED",
        "IMAGE_UPLOADED",
        "IMAGE_DELETED",
      ],
    },

    message: {
      type: String,
      required: true,
      maxlength: 300,
    },
  },
  {
    timestamps: true,
  }
);

projectActivitySchema.index({
  project: 1,
  createdAt: -1,
});

const ProjectActivity = mongoose.model(
  "ProjectActivity",
  projectActivitySchema
);

export default ProjectActivity;