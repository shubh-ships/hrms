import express from 'express';
import * as taskAssignmentController from '../controllers/taskAssignment.controller.js';
import { protect } from '../middlewares/auth.js';
// import { userHasDepartmentRoles } from '../middlewares/roles.js';
import { upload } from '../middlewares/multer.js';
import {hasPermissionAndAssignableUsers} from "../middlewares/hasDynamicPermission.js"

const router = express.Router()

router.post("/assign",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT"]),taskAssignmentController.createTaskAssignment);
router.get("/list",protect,hasPermissionAndAssignableUsers(["CREATE_USER","CREATE_DEPARTMENT"]),taskAssignmentController.getAllTaskAssignments);
router.get("/task/:id",protect,hasPermissionAndAssignableUsers(["TASK_VIEW"]),taskAssignmentController.getTaskAssignmentById);
router.get("/user-assignment",protect,hasPermissionAndAssignableUsers(["TASK_VIEW"]),taskAssignmentController.getTaskAssignmentsByUserId);
router.get("/user-daily-assignments",protect,hasPermissionAndAssignableUsers(["TASK_VIEW"]),taskAssignmentController.getTodayTaskAssignmentsByUserId);
router.get("/user-daily-assignments/:id",protect,hasPermissionAndAssignableUsers(["CREATE_USER","CREATE_DEPARTMENT","TASK_ASSIGNMENT"]),taskAssignmentController.getTodayTaskAssignmentsByGivenUserId);
router.get("/assignedBy-assignment",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT"]),taskAssignmentController.getTaskAssignmentByAssignedById);
// router.get("/department-assignments/:id",protect,taskAssignmentController.getDepartmentTaskAssignments);
router.patch("/change-timer-status/:id",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT","TASK_VIEW"]),taskAssignmentController.changeTimerStatus);
router.post("/stuck-status-request/:id",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT","TASK_VIEW"]),taskAssignmentController.stuckStatusRequest);
router.post("/acceptRejectStuckRequest/:id",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT"]),taskAssignmentController.acceptOrRejectStuckRequest);
router.get("/list-stuck-request",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT"]),taskAssignmentController.listStuckRequests);
router.patch("/convertToInProgress/:id",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT"]),taskAssignmentController.convertStuckToInProgress);
router.put("/edit/:id",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT"]),taskAssignmentController.updateTaskAssignment);
router.delete("/delete/:id",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT"]),taskAssignmentController.deleteTaskAssignment);
router.get("/daily",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT","TASK_VIEW"]),taskAssignmentController.getUserDailyTasksController);
router.patch("/changeDeadline/:id",protect,hasPermissionAndAssignableUsers(["TASK_ASSIGNMENT"]),taskAssignmentController.changeDeadline);

router.post("/bulk-task-assignments",protect,hasPermissionAndAssignableUsers(["CREATE_USER","CREATE_DEPARTMENT","TASK_ASSIGNMENT"]),upload.single('taskFile'),taskAssignmentController.bulkTaskAssignments);
router.get("/get-previous-tasks",protect,hasPermissionAndAssignableUsers(["CREATE_USER","CREATE_DEPARTMENT","TASK_ASSIGNMENT"]),taskAssignmentController.getPreviousTasks)


export default router;