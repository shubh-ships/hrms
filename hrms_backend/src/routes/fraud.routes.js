import express from 'express';
import * as fraudController from '../controllers/fraud.controller.js';
import { protect } from '../middlewares/auth.js';
import { userHasDepartmentRoles } from '../middlewares/roles.js';
import { hasPermissionAndAssignableUsers } from '../middlewares/hasDynamicPermission.js';

const router = express.Router();

router.get("/list/:org_id",protect,hasPermissionAndAssignableUsers(["CREATE_DEPARTMENT","CREATE_USER"]),fraudController.listAllFrauds);
router.get("/department/",protect,hasPermissionAndAssignableUsers(["CREATE_DEPARTMENT","CREATE_USER","TASK_ASSIGNMENT","WORKING_DAYS"]),fraudController.departmentFrauds);
router.patch("/clean/:fraud_id",protect,hasPermissionAndAssignableUsers(["CREATE_DEPARTMENT","CREATE_USER"]),fraudController.cleanFraud);
router.get("/detail/:fraud_id",protect,hasPermissionAndAssignableUsers(["CREATE_DEPARTMENT","CREATE_USER"]),fraudController.fraudDetail)


export default router;