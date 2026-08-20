import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { checkAccountStatus } from "../middleware/accountStatusMiddleware.js";
import upload, { handleMulterError } from "../middleware/upload.middleware.js";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  leaveProject,
  removeMember,
  uploadProjectImages,
  deleteProjectImage,
  getMyProjects,
} from "../controllers/projectController.js";

const router = express.Router();

router.post(
  "/",
  protect,
  checkAccountStatus,
  upload.fields([
    {
      name: "logo",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  createProject,
);
router.get("/", getProjects);
router.get("/my-projects", protect, getMyProjects);
router.delete(
  "/:projectId/members/:userId",
  protect,
  checkAccountStatus,
  removeMember,
);
router.get("/:id", getProjectById);
router.put(
  "/:id",
  protect,
  checkAccountStatus,
  upload.fields([
    {
      name: "logo",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),

  updateProject,
);
router.patch(
  "/:projectId/images",
  protect,
  upload.array("images", 5),
  handleMulterError,
  uploadProjectImages,
);
router.delete("/:projectId/images", protect, deleteProjectImage);
router.delete("/:id", protect, checkAccountStatus, deleteProject);
router.delete("/:projectId/leave", protect, checkAccountStatus, leaveProject);

export default router;
