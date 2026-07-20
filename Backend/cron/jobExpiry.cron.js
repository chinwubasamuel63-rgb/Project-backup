import cron from "node-cron";
import Job from "../models/Jobs.js";

cron.schedule("0 * * * *", async () => {
  try {
    const result = await Job.updateMany(
      {
        status: "Open",
        expiresAt: {
          $ne: null,
          $lte: new Date(),
        },
      },
      {
        $set: {
          status: "Closed",
        },
      },
    );

    if (result.modifiedCount > 0) {
      console.log(
        `[CRON] Closed ${result.modifiedCount} expired jobs`,
      );
    }
  } catch (error) {
    console.error(
      "[CRON] Job expiration error:",
      error.message,
    );
  }
});

export default null;