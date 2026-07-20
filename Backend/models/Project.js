import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    tagline: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      enum: [
        "Web",
        "Mobile",
        "AI/ML",
        "Game Dev",
        "Desktop",
        "DevOps",
        "Cybersecurity",
        "Blockchain",
        "Other",
      ],
      default: "Other",
    },

    description: {
      type: String,
      default: "",
    },

    images: [
      {
        publicId: {
          type: String,
          default: "",
        },
        url: {
          type: String,
          default: "",
        },
      },
    ],

    logo: {
      publicId: {
        type: String,
        default: "",
      },
      url: {
        type: String,
        default: "",
      },
    },

    coverImage: {
      publicId: {
        type: String,
        default: "",
      },
      url: {
        type: String,
        default: "",
      },
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    coOwners: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    technologies: [String],

    status: {
      type: String,
      enum: ["Idea", "Building", "Testing", "Launched", "Paused", "Archived"],
      default: "Idea",
    },

    visibility: {
      type: String,
      enum: ["Public", "Private"],
      default: "Public",
    },

    lookingForPartners: {
      type: Boolean,
      default: false,
    },

    lookingForTalent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

projectSchema.index({
  name: "text",
  tagline: "text",
  description: "text",
});

const Project = mongoose.model("Project", projectSchema);

export default Project;
