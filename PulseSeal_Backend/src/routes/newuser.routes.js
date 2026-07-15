import express from "express";
import {
  createUserController,
  createAdminController,
  getAdminController
} from "../controllers/newUser.controller.js";
import {
   assignRoleController,
   getUserRolesController,
    replaceUserController
} from "../controllers/userRole.controller.js";
import {
    createRoleController,
    getRoleContoller,
    updateRoleController
} from "../controllers/role.controller.js";
import { hasPermissionAndAssignableUsers } from "../middlewares/hasDynamicPermission.js";
import { protect } from "../middlewares/auth.js";
import { userIsOrganizationAdmin, userIsSuperuser } from "../middlewares/roles.js";

const router = express.Router();


router.post("/roles",protect,hasPermissionAndAssignableUsers(["CREATE_USER"]),createRoleController);
router.get("/roles",protect,hasPermissionAndAssignableUsers(["CREATE_USER"]),getRoleContoller);
router.patch("/roles/:id",protect,hasPermissionAndAssignableUsers(["CREATE_USER"]),updateRoleController);



router.post("/users",protect,hasPermissionAndAssignableUsers(["CREATE_USER"]),createUserController);
router.post("/admin",protect,userIsOrganizationAdmin,createAdminController);
router.get("/admin",protect,getAdminController);


router.post("/assign-role",protect,hasPermissionAndAssignableUsers(["CREATE_USER"]),assignRoleController);
router.get("/assign-role",protect,hasPermissionAndAssignableUsers(["CREATE_USER"]),getUserRolesController);
router.patch("/update-user-role",protect,hasPermissionAndAssignableUsers(["CREATE_USER"]),replaceUserController);

export default router;
