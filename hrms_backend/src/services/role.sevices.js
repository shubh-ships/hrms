
import { createRole,getAllRole, findRoleByName,updateRoleRepository } from "../repositories/role.repository.js";
import ApiError from "../utils/apiError.js";

export const addRole = async (roleData) => {
  const existing = await findRoleByName(roleData.roleName,roleData.organizationId);
  
  if (existing) throw new ApiError(400, "Role already exists");
  return await createRole(roleData);
};
export const updateRole = async (roleData,id) => {
  return await updateRoleRepository(roleData,id);
};


export const getAllRoles= async(organizationId)=>{
  
  const allRoles= await getAllRole(organizationId)
  return allRoles
}
