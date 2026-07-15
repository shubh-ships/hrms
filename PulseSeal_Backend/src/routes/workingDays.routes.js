import express from 'express';
import * as workingDaysController from '../controllers/workingDays.controller.js';
import { protect } from '../middlewares/auth.js';
import { userHasDepartmentRoles } from '../middlewares/roles.js';
import { hasPermissionAndAssignableUsers } from '../middlewares/hasDynamicPermission.js';

const router = express.Router();

router.post("/decide",protect,hasPermissionAndAssignableUsers(["WORKING_DAYS","CREATE_USER"]),workingDaysController.createWorkingDays);
router.patch("/decide/:id",protect,hasPermissionAndAssignableUsers(["WORKING_DAYS","CREATE_USER"]),workingDaysController.updateWorkingDays);
router.get("/show",protect,hasPermissionAndAssignableUsers(["WORKING_DAYS","CREATE_USER","COMMON_PERMISSION"]),workingDaysController.getWorkingDays);


export default router;