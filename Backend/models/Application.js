import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    coverLetter: {
      type: String,
      trim: true,
      maxlength: 5000,
    },

    portfolioUrl: {
      type: String,
      trim: true,
    },

    resumeUrl: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Withdrawn"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  },
);

applicationSchema.index({
  job: 1,
});

applicationSchema.index({
  applicant: 1,
});

applicationSchema.index({
  status: 1,
});

applicationSchema.index(
  {
    job: 1,
    applicant: 1,
  },
  {
    unique: true,
  },
);

const Application = mongoose.model("Application", applicationSchema);

export default Application;
