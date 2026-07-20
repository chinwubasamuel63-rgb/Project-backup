import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    thumbnail: {
      publicId: {
        type: String,
        default: "",
      },
      url: {
        type: String,
        default: "",
      },
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

    files: [
      {
        type: String,
      },
    ],
    buyers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    salesCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
  },
);

productSchema.index({
  seller: 1,
});

productSchema.index({
  category: 1,
});

productSchema.index({
  status: 1,
});

productSchema.index({
  title: "text",
  description: "text",
  category: "text",
});

export default mongoose.model("Product", productSchema);
