
import { assignRoleToUser, getUserRolesWithDetails,reassignRole } from "../services/userRole.sevice.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import {successResponse} from "../utils/apiResponse.js";
import { modelNames } from "mongoose";

export const assignRoleController = asyncHandler(async (req, res) => {
  const { user_id, roleDefinitionId, parentRoleId } = req.body;
 
  const userRole = await assignRoleToUser(user_id, roleDefinitionId, parentRoleId);
  successResponse(res, "Role assigned to user", userRole);
});

export const getUserRolesController = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const roles = await getUserRolesWithDetails(userId);
  res.status(200).json(new successResponse(200, roles, "User roles fetched"));
});

export const replaceUserController = asyncHandler(async (req, res) => {
  const { oldUserId, newUserId,userData,mode,newRoleDefId } = req.body;

  const updatedRole = await reassignRole(oldUserId,newUserId,mode,newRoleDefId,userData);

  res.status(200).json({
    success: true,
    message: 'User replaced successfully in the role',
    data: updatedRole
  });
});
