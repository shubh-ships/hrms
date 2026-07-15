import express from 'express';
import * as teamController from '../controllers/team.controller.js';
import { protect } from '../middlewares/auth.js';
import { hasPermissionAndAssignableUsers } from '../middlewares/hasDynamicPermission.js';

const router = express.Router();

router.post('/create',protect,hasPermissionAndAssignableUsers(["CREATE_USER"]),teamController.createTeam);
router.post('/update/:id',protect,hasPermissionAndAssignableUsers(["CREATE_USER"]),teamController.updateTeam);
router.post('/',protect,hasPermissionAndAssignableUsers(["CREATE_USER"]),teamController.getTeamsForOrganization);
router.post('/department/:departmentId',protect,hasPermissionAndAssignableUsers(["CREATE_USER"]),teamController.getTeamsForDepartment);

export default router;