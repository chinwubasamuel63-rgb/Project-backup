import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    roleType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    requiredSkills: [
      {
        type: String,
        trim: true,
      },
    ],

    location: {
      type: String,
      trim: true,
      default: "Remote",
    },

    isRemote: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: ["Open", "Closed"],
      default: "Open",
    },

    applicationCount: {
      type: Number,
      default: 0,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

jobSchema.index({
  project: 1,
});

jobSchema.index({
  owner: 1,
});

jobSchema.index({
  status: 1,
});

jobSchema.index({
  title: "text",
  description: "text",
  roleType: "text",
});

const Job = mongoose.model("Job", jobSchema);

export default Job;
