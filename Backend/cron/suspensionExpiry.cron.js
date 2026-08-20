import cron from "node-cron";
import User from "../models/User.js";

cron.schedule("0 * * * *", async () => {
  try {
    const result = await User.updateMany(
      {
        isSuspended: true,
        suspensionExpiresAt: {
          $ne: null,
          $lte: new Date(),
        },
      },
      {
        $set: {
          isSuspended: false,
          suspensionReason: "",
          suspensionExpiresAt: null,
        },
      },
    );

    if (result.modifiedCount > 0) {
      // Intentionally silent; avoids noisy cron output in terminal.
    }
  } catch (error) {}
});

export default null;
