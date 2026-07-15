import Organization from "../models/organization.Model.js";
import OrgUserRole from "../models/organizationUserRole.js";
import UserRoleTable from "../models/userRole.Model.js";

export const createOrganization = async (orgData) => {
  return await Organization.create(orgData);
}

export const getOrganizationByAlias = async (alias) => {
  return await Organization.findOne({ org_alias: alias });
};

export const getOrganizationById = async (id) => {
  return await Organization.findById(id);
};

export const listOrganizations = async (filters = {}, skip = 0, limit = 10) => {
  return await Organization.find(filters).skip(skip).limit(limit);
};

export const countOrganizations = async (filters = {}) => {
  return await Organization.countDocuments(filters);
};

// export const updateOrganizationByAlias = async (alias, updateData) => {
//   return await Organization.findOneAndUpdate(
//     { org_alias: alias },
//     updateData,
//     {
//       new: true,
//       runValidators: true,
//     }
//   );
// };

export const deleteOrganizationByAlias = async (alias) => {
  return await Organization.findOneAndDelete({ org_alias: alias });
}

export const getOrganizationMember = async (org_id,user_id) => {
    return await OrgUserRole.findOne({org_id,user_id})
}

export const getOrganizationMembers = async (org_id) => {
    return await OrgUserRole.find({ org_id }).populate('user_id')
}

export const editOrganizationMembers = async (org_member_id,access_type) => {
    await OrgUserRole.findByIdAndUpdate(
    org_member_id,  
    { access_type },
    { new: true, runValidators: true }
  );
    
    return { message: 'Organization members updated successfully' };
}

export const getOrgManagers = async (org_id) => {
  return await UserRoleTable.find({
    organizationId: org_id,
    role: "MANAGER"
  })
    .select("role")
    .populate("user_id", "name email phoneNumber isActive isFreezed is_superuser is_organizer departmentId")
    .populate("dep_id", "name alias")
    .sort({ createdAt: -1 });
};

export const addOrganizationMember = async ({user_id, access_type,org_id}) => {
    return await OrgUserRole.create({ org_id, user_id, access_type });
}

export const removeOrganizationMembers = async (orgId, userIdsToRemove) => {
  return await OrgUserRole.deleteMany({
    org_id: orgId,
    user_id: { $in: userIdsToRemove }
  });
};
