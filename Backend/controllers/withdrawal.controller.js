import Withdrawal from "../models/Withdrawal.js";
import SellerWallet from "../models/SellerWallet.js";
import { createNotification } from "../utils/createNotification.js";

export const requestWithdrawal = async (req, res) => {
  try {
    const { amount, bankName, accountNumber, accountName } = req.body;

    const wallet = await SellerWallet.findOne({
      user: req.user._id,
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    if (amount > wallet.availableBalance) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    const withdrawal = await Withdrawal.create({
      seller: req.user._id,
      amount,
      bankName,
      accountNumber,
      accountName,
    });

    wallet.availableBalance -= amount;

    wallet.pendingBalance += amount;

    await wallet.save();

    res.status(201).json({
      success: true,
      withdrawal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({
      seller: req.user._id,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: withdrawals.length,
      withdrawals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find()
      .populate("seller", "username email")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: withdrawals.length,
      withdrawals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const approveWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.withdrawalId);

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal not found",
      });
    }

    if (withdrawal.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Withdrawal already processed",
      });
    }

    withdrawal.status = "Approved";

    withdrawal.processedBy = req.user._id;

    await withdrawal.save();

    await createNotification({
      user: withdrawal.seller,
      type: "withdrawal_approved",
      title: "Withdrawal Approved",
      message: "Your withdrawal request has been approved",
    });

    res.status(200).json({
      success: true,
      withdrawal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const rejectWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.withdrawalId);

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal not found",
      });
    }

    if (withdrawal.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Withdrawal already processed",
      });
    }

    const wallet = await SellerWallet.findOne({
      user: withdrawal.seller,
    });

    wallet.pendingBalance -= withdrawal.amount;

    wallet.availableBalance += withdrawal.amount;

    await wallet.save();

    withdrawal.status = "Rejected";

    withdrawal.processedBy = req.user._id;

    await withdrawal.save();

    await createNotification({
      user: withdrawal.seller,
      type: "withdrawal_rejected",
      title: "Withdrawal Rejected",
      message: "Your withdrawal request was rejected",
    });

    res.status(200).json({
      success: true,
      withdrawal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const markWithdrawalPaid = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.withdrawalId);

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal not found",
      });
    }

    if (withdrawal.status !== "Approved") {
      return res.status(400).json({
        success: false,
        message: "Withdrawal must be approved first",
      });
    }

    const wallet = await SellerWallet.findOne({
      user: withdrawal.seller,
    });

    wallet.pendingBalance -= withdrawal.amount;

    wallet.totalWithdrawn += withdrawal.amount;

    await wallet.save();

    withdrawal.status = "Paid";

    await withdrawal.save();

    await createNotification({
      user: withdrawal.seller,
      type: "withdrawal_paid",
      title: "Withdrawal Paid",
      message: "Your withdrawal has been processed",
    });

    res.status(200).json({
      success: true,
      withdrawal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
