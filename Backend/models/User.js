import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      validate: {
        validator: function (value) {
          if (this.authProvider === "local") {
            return value && value.length >= 6;
          }

          return true;
        },
        message: "Password must be at least 6 characters",
      },
    },

    authProvider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },

    googleId: {
      type: String,
      default: "",
    },

    githubId: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
    },

    primaryTrack: {
      type: String,
      default: "",
    },

    secondaryTracks: [
      {
        type: String,
      },
    ],

    avatar: {
      type: {
        publicId: String,
        url: String,
      },
      default: {
        publicId: "",
        url: "",
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

    bio: {
      type: String,
      default: "",
    },

    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isVerified: {
      type: Boolean,
      default: false,
    },

    displayName: {
      type: String,
      default: "",
      trim: true,
    },

    skills: [
      {
        type: String,
        trim: true,
      },
    ],

    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert"],
      default: "beginner",
    },

    portfolioUrl: {
      type: String,
      default: "",
    },

    githubUrl: {
      type: String,
      default: "",
    },

    linkedinUrl: {
      type: String,
      default: "",
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
      default: null,
    },

    preferences: {
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },

        push: {
          type: Boolean,
          default: true,
        },
      },

      theme: {
        type: String,
        enum: ["dark", "light"],
        default: "dark",
      },
    },

    isSuspended: {
      type: Boolean,
      default: false,
    },

    suspendedAt: {
      type: Date,
      default: null,
    },

    suspensionExpiresAt: {
      type: Date,
      default: null,
    },

    suspensionReason: {
      type: String,
      default: "",
      trim: true,
    },

    isBanned: {
      type: Boolean,
      default: false,
    },

    bannedAt: {
      type: Date,
      default: null,
    },

    banReason: {
      type: String,
      default: "",
      trim: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    resetPasswordToken: {
      type: String,
    },

    resetPasswordExpire: {
      type: Date,
    },

    flags: {
      type: Number,
      default: 0,
    },

    adminNotes: [
      {
        note: {
          type: String,
          required: true,
          trim: true,
        },

        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    moderationHistory: [
      {
        action: {
          type: String,
          required: true,
        },

        reason: {
          type: String,
          default: "",
        },

        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

userSchema.index({ username: "text" });

userSchema.index({ followers: 1 });

userSchema.index({ following: 1 });

userSchema.index({ role: 1 });

userSchema.index({ isSuspended: 1 });

userSchema.index({ isBanned: 1 });

const User = mongoose.model("User", userSchema);

export default User;
