import * as roleRepo from '../repositories/roleDefination.repository.js';

export const createRole = async (roleData) => {
  const { roleName, hierarchyLevel, permissions, organizationId } = roleData;
  const existing = await roleRepo.getAllRoles();
  if (existing.some(r => r.roleName === roleName)) {
    throw new Error('Role with this name already exists');
  }

  const role = await roleRepo.createRoleDefinition({
    roleName,
    hierarchyLevel,
    // parentRoleId: parentRoleId || null,
    permissions,
    organizationId
  });

  return role;
};
