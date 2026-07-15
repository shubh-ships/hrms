import express from 'express';
import * as submissionController from '../controllers/submission.controller.js';
import { protect } from '../middlewares/auth.js';
// import { userHasDepartmentRoles } from '../middlewares/roles.js';
import  {upload}  from '../middlewares/multer.js';
import { hasPermissionAndAssignableUsers } from '../middlewares/hasDynamicPermission.js';

const router = express.Router();

router.post("/",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT","TASK_VIEW"]),upload.any(),submissionController.makeSubmission);
// router.get("/department/:id",userHasDepartmentRoles(["ADMIN","HR","SRMANAGER"]),submissionController.getDepartmentAllSubmissions);
router.get("/user",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT","TASK_VIEW"]),submissionController.getSubmissionsByUserId);
router.get("/sub/:id",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT","TASK_VIEW"]),submissionController.getSubmissionById);
router.get("/task-assignment/:id",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT"]),submissionController.getSubmissionByTaskAssignId);
router.put("/edit/:id",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT"]),submissionController.updateSubmission);
router.delete("/delete/:id",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT"]),submissionController.deleteSubmission);


export default router;

