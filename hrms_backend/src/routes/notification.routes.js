import express from 'express';
import { protect } from '../middlewares/auth.js';
import { userHasDepartmentRoles } from '../middlewares/roles.js';
import { changeIsRead, listNotifications } from '../controllers/notification.controller.js';
import { hasPermissionAndAssignableUsers } from '../middlewares/hasDynamicPermission.js';

const router = express.Router();

router.get("/",protect,hasPermissionAndAssignableUsers(["COMMON_PERMISSION"]),listNotifications);
router.patch("/:id",protect,hasPermissionAndAssignableUsers(["COMMON_PERMISSION"]),changeIsRead);

export default router;