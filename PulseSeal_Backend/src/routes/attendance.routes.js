import express from "express";
import * as attendanceController from "../controllers/attendance.controller.js";
import { protect } from "../middlewares/auth.js";
// import { userHasDepartmentRoles } from '../middlewares/roles.js';
import { hasPermissionAndAssignableUsers } from "../middlewares/hasDynamicPermission.js";

const router = express.Router();

router.post(
  "/mark",
  protect,
  hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT", "WORKING_DAYS"]),
  attendanceController.createAttendance,
);
router.post(
  "/markmanual",
  protect,
  hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT", "WORKING_DAYS"]),
  attendanceController.createManualAttendance,
);
router.patch(
  "/updateattendance/:id",
  protect,
  hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT", "WORKING_DAYS"]),
  attendanceController.updateAttendance,
);
router.get(
  "/show",
  protect,
  hasPermissionAndAssignableUsers(["COMMON_PERMISSION"]),
  attendanceController.getAttendance,
);
router.get(
  "/monthly/:id",
  protect,
  hasPermissionAndAssignableUsers(["COMMON_PERMISSION"]),
  attendanceController.getOrganizationMonthlyAttendance,
);
router.get(
  "/average/:id",
  protect,
  hasPermissionAndAssignableUsers(["COMMON_PERMISSION"]),
  attendanceController.getAttendanceAverage,
);
router.get(
  "/monthly",
  protect,
  hasPermissionAndAssignableUsers(["COMMON_PERMISSION"]),
  attendanceController.getMonthlyAttendance,
);
router.post(
  "/mark-logout",
  protect,
  hasPermissionAndAssignableUsers(["COMMON_PERMISSION"]),
  attendanceController.markLogout,
);
router.get("/all", protect, attendanceController.getAllAttendance);
router.get("/daily-report", protect, attendanceController.getDailyScanReport);
export default router;
