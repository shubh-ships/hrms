import express from "express";
import {
  applyForLeave,
  getLeavesForApproval,
  processLeaveApproval,
  getLeavesHistory,
  getLeavesForApprovalByOrg,
  getLeavesHistoryByOrg,
  markLeave,
} from "../controllers/leave.controller.js";
import { bulkUpdateLeaveBalanceFromExcel } from "../controllers/leaveBalanceManager.js";
import { protect } from "../middlewares/auth.js";
import { hasPermissionAndAssignableUsers } from "../middlewares/hasDynamicPermission.js";
import {
  getEmployeeLeaveBalances,
  listCurrentLeaveBalances,
  triggerRollover,
  updateEmployeeLeaveBalance,
} from "../controllers/leaveBalanceManager.js";
const router = express.Router();
import { upload, uploadExcel } from "../middlewares/multer.js";
router.post(
  "/apply",
  protect,
  hasPermissionAndAssignableUsers([
    "BASIC_HRMS",
    "HOLIDAY_MANAGEMENT",
    "LEAVE_MANAGEMENT",
  ]),
  applyForLeave,
);
router.get(
  "/approval-list",
  protect,
  hasPermissionAndAssignableUsers(["APPROVAL_LEAVE"]),
  getLeavesForApproval,
);
router.get("/approval-listByOrganization", protect, getLeavesForApprovalByOrg);
router.get(
  "/leave-history",
  protect,
  hasPermissionAndAssignableUsers(["APPROVAL_LEAVE"]),
  getLeavesHistory,
);
router.get("/leave-historyByOrganization", protect, getLeavesHistoryByOrg);
router.patch(
  "/:leaveId/approve",
  protect,
  hasPermissionAndAssignableUsers(["APPROVAL_LEAVE"]),
  processLeaveApproval,
);
router.get(
  "/currentBalance",
  protect,
  hasPermissionAndAssignableUsers([
    "BASIC_HRMS",
    "HOLIDAY_MANAGEMENT",
    "APPROVAL_LEAVE",
  ]),
  listCurrentLeaveBalances,
);

router.post(
  "/markLeave",
  protect,
  hasPermissionAndAssignableUsers(["APPROVAL_LEAVE"]),
  markLeave,
);
router.get(
  "/getEmpLeaveBalance/:employeeId",
  protect,
  hasPermissionAndAssignableUsers(["APPROVAL_LEAVE"]),
  getEmployeeLeaveBalances,
);
router.put(
  "/updateEmpLeaveBalance/:employeeId",
  protect,
  hasPermissionAndAssignableUsers(["APPROVAL_LEAVE"]),
  updateEmployeeLeaveBalance,
);
router.post(
  "/bulk-edit-balance",
  protect,
  uploadExcel.single("file"),
  bulkUpdateLeaveBalanceFromExcel,
);

router.post("/trigger", triggerRollover);

export default router;
