import Withdrawal from "../models/Withdrawal.js";
import SellerWallet from "../models/SellerWallet.js";

export const getWallet = async (req, res) => {
  try {
    let wallet = await SellerWallet.findOne({
      user: req.user._id,
    });

    if (!wallet) {
      wallet = await SellerWallet.create({
        user: req.user._id,
      });
    }

    res.status(200).json({
      success: true,
      wallet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

