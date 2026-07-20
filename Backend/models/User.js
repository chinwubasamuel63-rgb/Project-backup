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
