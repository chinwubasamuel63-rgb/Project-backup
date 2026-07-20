import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    paymentReference: {
      type: String,
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Refunded"],
      default: "Pending",
    },

    purchasedAt: {
      type: Date,
    },

    platformFee: {
      type: Number,
      default: 0,
    },

    sellerAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

purchaseSchema.index({
  buyer: 1,
});

purchaseSchema.index({
  seller: 1,
});

purchaseSchema.index({
  product: 1,
});

export default mongoose.model("Purchase", purchaseSchema);
