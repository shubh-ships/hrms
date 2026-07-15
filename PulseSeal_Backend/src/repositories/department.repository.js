import Department from "../models/department.Model.js";
import UserRoleTable from "../models/userRole.Model.js";
import User from "../models/user.Model.js";

export const createDepartment = async (departmentData) => {
  return await Department.create(departmentData);
}

export const getDepartmentByAlias = async (alias) => {
  return await Department.findOne({ alias });
}

export const getDepartmentById = async (id) => {
  return await Department.findById(id);
}

export const updateDepartmentByAlias = async (alias, updateData) => {
  return await Department.findOneAndUpdate(
    { alias },
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );
}

export const deleteDepartmentByAlias = async (alias) => {
  return await Department.findOneAndDelete({ alias });
}

export const listDepartments = async (organizationId) => {
  const departments = await Department.find({organizationId}).lean();
  
  const departmentsWithCount = await Promise.all(departments.map(async (dept) => {
    const userCount = await User.countDocuments({ departmentId: dept._id });
    return { ...dept, userCount };
  }));

  return departmentsWithCount;
}

export const getDepartmentsByIds = async (ids) => {
  return await Department.find({ _id: { $in: ids } });
}

export const listDepartmentsByOrgId = async(organization_id) => {
  return await Department.find({ organization_id }).sort({ name: 1 });
}

export const countDepartments = async (organizationId) => {
  return await Department.countDocuments({organizationId});
}


export const getDepartmentMember = async (dep_id,user_id) => {
    return await UserRoleTable.findOne({ dep_id,user_id})
}

export const getDepartmentMembers = async (dep_id) => {
    return await UserRoleTable.find({ dep_id }).populate('user_id');
}

export const editDepartmentMembers = async (dep_member_id,role,organizationId,departmentId) => {
    const updatePayload = {
        role,
        organizationId
    };

    if (departmentId !== undefined && departmentId !== null) {
        updatePayload.dep_id = departmentId;
    }

    await UserRoleTable.findByIdAndUpdate(
        dep_member_id,
        updatePayload,
        { new: true, runValidators: true }
    );
    
    return { message: 'Department members updated successfully' };
}

export const addDepartmentMember = async ({user_id, role,dep_id,organizationId}) => {
    return await UserRoleTable.create({ dep_id, user_id, role,organizationId});
}

export const addDepartmentAdmin = async ({user_id, role,dep_id,organization_id}) => {
    return await UserRoleTable.create({ dep_id, user_id, role,organizationId:organization_id});
}

export const removeDepartmentMembers = async (dep_id, userIdsToRemove) => {
  return await UserRoleTable.deleteMany({
    dep_id: dep_id,
    user_id: { $in: userIdsToRemove }
  });
};