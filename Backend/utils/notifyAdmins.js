import User from "../models/User.js";
import { createNotification } from "./createNotification.js";

const notifyAdmins = async (payload) => {
  const admins = await User.find({ role: "admin" }).select("_id");

  await Promise.all(
    admins.map((admin) =>
      createNotification({
        ...payload,
        user: admin._id,
      }),
    ),
  );
};

export default notifyAdmins;
