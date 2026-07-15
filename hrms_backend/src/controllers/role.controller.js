import { addRole,getAllRoles,updateRole } from "../services/role.sevices.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import {successResponse} from "../utils/apiResponse.js";

export const createRoleController = asyncHandler(async (req, res) => {
  const {organizationId}=req.user
  const data ={...req.body,organizationId}

  const role = await addRole(data);
   successResponse(res,"Role created successfully", role,);
});
export const updateRoleController = asyncHandler(async (req, res) => {
  const {id}=req.params;
  const data = req.body;

  const role = await updateRole(id,data);
   successResponse(res,"Role created successfully", role,);
});


export const getRoleContoller=asyncHandler(async(req,res)=>{
  
  const {organizationId}=req.user
  console.log("Organization ID in Controller:", organizationId); 
  const role =await  getAllRoles(organizationId)
  successResponse(res,"Roles fetched successfully", role,);
})