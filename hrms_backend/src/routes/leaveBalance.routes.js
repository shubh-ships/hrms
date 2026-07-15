import express from "express";
import {
  getLeaveBalance,
  updateLeaveBalance,
  initializeLeaveBalance,
} from "../controllers/leaveBalance.controller.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.post("/initialize", initializeLeaveBalance);
router.get("/:employeeId", getLeaveBalance);
router.put("/:employeeId", updateLeaveBalance);

export default router;
