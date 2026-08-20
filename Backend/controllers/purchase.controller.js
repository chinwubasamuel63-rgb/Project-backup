import Purchase from "../models/Purchase.js";
import Product from "../models/Product.js";
import SellerWallet from "../models/SellerWallet.js";
import { createNotification } from "../utils/createNotification.js";
import User from "../models/User.js";
import { sendEmail } from "../services/email.service.js";
import {
  purchaseSuccessfulEmail,
  productSoldEmail,
} from "../templates/emails/marketplaceEmail.js";
import mongoose from "mongoose";
import crypto from "crypto";

export const createPurchase = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot purchase your own product",
      });
    }

    if (product.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Product is not available",
      });
    }

    const existingPurchase = await Purchase.findOne({
      product: product._id,
      buyer: req.user._id,
      status: "Completed",
    });

    if (existingPurchase) {
      return res.status(400).json({
        success: false,
        message: "You already own this product",
      });
    }

    const purchase = await Purchase.create({
      product: product._id,
      buyer: req.user._id,
      seller: product.seller,
      amount: product.price,
      paymentReference: `DEVSTREAM-${crypto.randomUUID()}`,
    });

    res.status(201).json({
      success: true,
      purchase,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyPurchase = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.purchaseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase ID",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    session.startTransaction();

    const purchase = await Purchase.findById(
      req.params.purchaseId,
    ).session(session);

    if (!purchase) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    if (purchase.status === "Completed") {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Purchase already verified",
      });
    }

    const product = await Product.findById(
      purchase.product,
    )
      .populate("seller", "username email")
      .session(session);

    if (!product) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const platformFee = Number(
      (purchase.amount * 0.1).toFixed(2),
    );

    const sellerAmount = Number(
      (purchase.amount - platformFee).toFixed(2),
    );

    purchase.status = "Completed";
    purchase.platformFee = platformFee;
    purchase.sellerAmount = sellerAmount;
    purchase.purchasedAt = new Date();

    await purchase.save({ session });

    if (
      !product.buyers.some(
        (buyer) =>
          buyer.toString() === purchase.buyer.toString(),
      )
    ) {
      product.buyers.push(purchase.buyer);
    }

    product.salesCount += 1;

    await product.save({ session });

    let wallet = await SellerWallet.findOne({
      user: purchase.seller,
    }).session(session);

    if (!wallet) {
      wallet = await SellerWallet.create(
        [
          {
            user: purchase.seller,
          },
        ],
        { session },
      );

      wallet = wallet[0];
    }

    wallet.availableBalance += sellerAmount;
    wallet.totalEarnings += sellerAmount;

    await wallet.save({ session });

    await session.commitTransaction();

    try {
      await createNotification({
        user: purchase.seller,
        type: "product_sale",
        title: "New Product Sale",
        message: "You made a new sale",
        relatedEntity: purchase.product,
        relatedEntityType: "Product",
      });
    } catch (error) {
      ;
    }

    try {
      await createNotification({
        user: purchase.buyer,
        type: "purchase_successful",
        title: "Purchase Successful",
        message: "You now own this product",
        relatedEntity: purchase.product,
        relatedEntityType: "Product",
      });
    } catch (error) {
      ;
    }

    try {
      if (product.seller?.email) {
        await sendEmail({
          to: product.seller.email,
          subject: "New Product Sale",
          html: productSoldEmail(
            product.title,
            sellerAmount,
          ),
        });
      }
    } catch (error) {
      ;
    }

    try {
      const buyer = await User.findById(purchase.buyer);

      if (buyer?.email) {
        await sendEmail({
          to: buyer.email,
          subject: "Purchase Successful",
          html: purchaseSuccessfulEmail(product.title),
        });
      }
    } catch (error) {
      ;
    }

    res.status(200).json({
      success: true,
      purchase,
    });
  } catch (error) {
    await session.abortTransaction();

    res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

export const getMyPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find({
      buyer: req.user._id,
      status: "Completed",
    })
      .populate("product", "title price")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: purchases.length,
      purchases,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMySales = async (req, res) => {
  try {
    const sales = await Purchase.find({
      seller: req.user._id,
      status: "Completed",
    })
      .populate("product", "title")
      .populate("buyer", "username")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: sales.length,
      sales,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
