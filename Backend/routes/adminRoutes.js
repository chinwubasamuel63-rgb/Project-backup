import express from "express";

import userRoutes from "./admin/user.admin.routes.js";
import statsRoutes from "./admin/stats.admin.routes.js";
import projectRoutes from "./admin/project.admin.routes.js";
import supportRoutes from "./admin/support.admin.routes.js";
import streamRoutes from "./admin/stream.admin.routes.js";

const router = express.Router();

router.use("/users", userRoutes);
router.use("/stats", statsRoutes);
router.use("/projects", projectRoutes);
router.use("/support", supportRoutes);
router.use("/streams", streamRoutes);

export default router;
