import express from "express";
import {
  applyLeave,
  getApplications,
  getApplicationById,
  updateApplication,
  cancelApplication,
  approveApplication,
  rejectApplication,
  markLeave
} from "../controllers/leaveApplication.controller.js";
import {protect} from "../middlewares/auth.js"

const router = express.Router();

router.use(protect);

router.post("/", applyLeave);
router.get("/", getApplications);
router.get("/:id", getApplicationById);
router.put("/:id", updateApplication);
router.delete("/:id", cancelApplication);
router.patch("/:id/approve", approveApplication);
router.patch("/:id/reject", rejectApplication);
router.post("/mark", markLeave);

export default router;
