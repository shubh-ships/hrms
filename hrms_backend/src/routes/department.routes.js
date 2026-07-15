import express from 'express';
import * as departmentController from '../controllers/department.controller.js';
import { protect } from '../middlewares/auth.js';
// import { userHasDepartmentRoles, userIsOrganizationAdmin } from '../middlewares/roles.js';
import { hasPermissionAndAssignableUsers } from '../middlewares/hasDynamicPermission.js';

const router = express.Router();

router.post('/create',protect,hasPermissionAndAssignableUsers(["CREATE_DEPARTMENT"]),departmentController.createDepartment);
router.get('/',protect,hasPermissionAndAssignableUsers(["CREATE_DEPARTMENT","CREATE_USER","TASK_ASSIGNMENT"]),departmentController.listDepartments);
router.get("/user-departments",protect,hasPermissionAndAssignableUsers(["CREATE_DEPARTMENT","CREATE_USER","TASK_ASSIGNMENT","TASK_VIEW","WORKING_DAYS","COMMON_PERMISSION"]),departmentController.getUserDepartments);
router.get('/department/:alias',protect,departmentController.getDepartment);
router.put('/edit/:alias',protect,hasPermissionAndAssignableUsers(["CREATE_DEPARTMENT"]),departmentController.updateDepartment);
router.delete('/delete/:alias',protect,hasPermissionAndAssignableUsers(["CREATE_DEPARTMENT"]),departmentController.deleteDepartment);
router.patch('/edit/:alias/members',hasPermissionAndAssignableUsers(["CREATE_DEPARTMENT","CREATE_USER","TASK_ASSIGNMENT"]),departmentController.editDepartmentMembers);
// router.get('/members',protect,userHasDepartmentRoles(["ADMIN","HR","SRMANAGER","MANAGER"]),departmentController.getDepartmentMembers);
router.get('/members/:id',protect,hasPermissionAndAssignableUsers(["CREATE_DEPARTMENT","CREATE_USER","TASK_ASSIGNMENT"]),departmentController.getDepartmentMembersById);

export default router;