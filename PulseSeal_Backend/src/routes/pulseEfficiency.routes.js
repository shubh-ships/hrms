import express from 'express';
import * as pulseEfficiencyController from '../controllers/pulseEfficiency.controller.js';
import { protect } from '../middlewares/auth.js';
import { userHasDepartmentRoles } from '../middlewares/roles.js';
import { hasPermissionAndAssignableUsers } from '../middlewares/hasDynamicPermission.js';

const router = express.Router();

router.get("/weekly",protect,hasPermissionAndAssignableUsers(["COMMON_PERMISSION"]),pulseEfficiencyController.getPulseEfficiencyControllerWeekly)
router.get("/monthly",protect,hasPermissionAndAssignableUsers(["COMMON_PERMISSION"]),pulseEfficiencyController.getPulseEfficiencyControllerMonthly)
router.get("/monthly/:userId",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT","CREATE_USER","CREATE_DEPARTMENT","WORKING_DAYS"]),pulseEfficiencyController.getPulseEfficiencyControllerMonthlyByUserId)
router.get("/leaderboard/:departmentId/:monthYear", protect, hasPermissionAndAssignableUsers(["COMMON_PERMISSION"]),pulseEfficiencyController.getLeaderboardController);
router.get('/yearly', protect, hasPermissionAndAssignableUsers(["COMMON_PERMISSION"]),pulseEfficiencyController.getPulseEfficiencyControllerYearly);
router.get('/yearly/:userId', protect, hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT","CREATE_USER","CREATE_DEPARTMENT","WORKING_DAYS"]),pulseEfficiencyController.getPulseEfficiencyControllerYearlyByUserId);

router.get('/download-csv', protect,hasPermissionAndAssignableUsers(["COMMON_PERMISSION"]),pulseEfficiencyController.downloadPulseEfficiencyCSV);




export default router;