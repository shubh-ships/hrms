import { addUser,addAdmin,getAdmin } from "../services/newUser.service.js";
import { assignRoleToUser } from "../services/userRole.sevice.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import {successResponse} from "../utils/apiResponse.js";


export const createUserController = asyncHandler(async (req, res) => {
  const organizationId=req.user.organizationId;
  const data = { ...req.body, organizationId };
 
  const user = await addUser(data);
  console.log("Request Body:", user); 
  const { roleDefinitionId, parentRoleId } = req.body;
  const userRole = await assignRoleToUser(user._id, roleDefinitionId, parentRoleId,user.organizationId,user.departmentId);

   successResponse(res,"User created successfully",{
    user,
    userRole
   });
});
export const createAdminController = asyncHandler(async (req, res) => {
  const organizationId=req.user.organizationId;
  const password=req.body.password||"12345678" 
  const data = { ...req.body, organizationId,password };
  const user = await addAdmin(data);

   successResponse(res,"User created successfully",{
    user
   });
});
export const getAdminController = asyncHandler(async (req, res) => {
  const organizationId=req.user.organizationId;
  const user = await getAdmin(organizationId);

   successResponse(res,"User created successfully",{
    user
   });
});
