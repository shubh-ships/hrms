import express from 'express';
import { createRole } from '../controllers/roleDefination.controller.js';
import { hasPermissionAndAssignableUsers } from '../middlewares/hasDynamicPermission.js';

const router = express.Router();

router.post('/role',hasPermissionAndAssignableUsers(["CREATE_USER"]),createRole);

export default router;
