import ProjectActivity from "../models/ProjectActivity.js";

export const createProjectActivity = async ({
  project,
  user,
  action,
  message,
}) => {
  await ProjectActivity.create({
    project,
    user,
    action,
    message,
  });

  // Keep only the latest 100 activities
  const latestActivities = await ProjectActivity.find({
    project,
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .select("_id");

  const keepIds = latestActivities.map((a) => a._id);

  await ProjectActivity.deleteMany({
    project,
    _id: {
      $nin: keepIds,
    },
  });
};
