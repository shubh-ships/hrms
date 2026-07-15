import express from 'express';
import * as approvalController from '../controllers/approval.controller.js';
import { protect } from '../middlewares/auth.js';
import { userHasDepartmentRoles} from '../middlewares/roles.js';
import { hasPermissionAndAssignableUsers } from '../middlewares/hasDynamicPermission.js';

const router = express.Router();

router.post("/request",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT","TASK_VIEW"]),approvalController.requestForApproval);
router.get("/approve/:id",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT"]),approvalController.approvalById);
router.get("/user/approvals",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT","TASK_VIEW"]),approvalController.approvalsByUserId);
router.get("/user/approvals/:id",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT","CREATE_USER","CREATE_DEPARTMENT"]),approvalController.approvalsByUserParamsId);
router.get("/manager/approvals",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT"]),approvalController.approvalsByAssignedById);
// router.get("/department/:id/approvals",protect,userHasDepartmentRoles(["ADMIN","HR",]),approvalController.departmentAllApprovals);
router.get("/list",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT","CREATE_USER"]),approvalController.allApprovals);
router.get("/submission/:id",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT","TASK_VIEW","CREATE_USER"]),approvalController.approvalBySubmissionId);
router.put("/edit/:id",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT"]),approvalController.updateApproval);
router.delete("/delete/:id",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT"]),approvalController.deleteApproval);
router.patch("/override/:id",protect,hasPermissionAndAssignableUsers(["CREATE_USER"]),approvalController.overrideDecision);

export default router;