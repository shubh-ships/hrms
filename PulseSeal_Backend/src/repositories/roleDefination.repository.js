import RoleDefinition from '../models/roleDefine.Model.js';

export const createRoleDefinition = async (data) => {
  const role = await RoleDefinition.create(data);
  return role;
};

export const getRoleById = async (roleId) => {
  return RoleDefinition.findById(roleId);
};

export const getAllRoles = async () => {
  return RoleDefinition.find();
};


