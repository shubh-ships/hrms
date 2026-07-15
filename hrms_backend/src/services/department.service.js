import * as departmentRepository from '../repositories/department.repository.js';
import * as userRepository from '../repositories/user.repository.js';
import  ApiError  from '../utils/apiError.js';

export const createDepartment = async (departmentData,organizationId) => {
  departmentData.organizationId = organizationId

  if (!departmentData.alias) {
    throw new ApiError(400, 'Department alias is required');
  }

  const existingDepartment = await departmentRepository.getDepartmentByAlias(departmentData.alias);
  if (existingDepartment) {
    throw new ApiError(400, 'Department already exists with this alias');
  }

  // departmentData.admin_id = userId;
  const alias = departmentData.alias.trim()
  
  const department = await departmentRepository.createDepartment({...departmentData,alias});
  if (!department) {
    throw new ApiError(500, 'Department creation failed');
  }

  // await departmentRepository.addDepartmentAdmin({
  //   user_id: userId,
  //   role: 'ADMIN',
  //   dep_id: department._id,
  //   organization_id
  // });

  return department;
}

export const getDepartment = async (alias) => {
  if (!alias) {
    throw new ApiError(400, 'Department alias is required');
  }

  const department = await departmentRepository.getDepartmentByAlias(alias);
  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  return department;
}

export const updateDepartment = async (alias, updateData) => {
  if (!alias) {
    throw new ApiError(400, 'Department alias is required');
  }

  const department = await departmentRepository.getDepartmentByAlias(alias);
  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  Object.assign(department, updateData);
  await department.save();

  return department;
}

export const deleteDepartment = async (alias) => {
  if (!alias) {
    throw new ApiError(400, 'Department alias is required');
  }

  const department = await departmentRepository.getDepartmentByAlias(alias);
  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  await departmentRepository.deleteDepartmentByAlias(alias);
  return { message: 'Department deleted successfully' };
}

export const listDepartments = async (organizationId) => {

  const departments = await departmentRepository.listDepartments(organizationId);
  const totalCount = await departmentRepository.countDepartments(organizationId);

  return {
    data: departments,
    totalCount
  };
}

export const getUserDepartments = async (user) => {
  if (!user) {
    throw new ApiError(400, 'User ID is required');
  }

  const userDepartments = user.departmentId || [];
  const departments = await departmentRepository.getDepartmentsByIds(userDepartments);

  return departments;
}


export const listDepartmentsByOrgId = async (organizationId) => {
  const departments = await departmentRepository.listDepartmentsByOrgId(organizationId);
  if (!departments || departments.length === 0) {
    throw new ApiError(404, 'No departments found for this organization');
  }
  return departments;
}

export const editDepartmentMembers = async (alias, addOrRemove,newDepartmentId) => {
  const { add: usersToAdd = [], remove: usersToRemove = [] } = addOrRemove;

  if (!alias) {
    throw new ApiError(400, 'Department alias is required');
  }

  const department = await departmentRepository.getDepartmentByAlias(alias);
  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  for (const user of usersToAdd) {
    if(!user.user_id || !user.role) {
      throw new ApiError(400, 'User ID and role are required for adding members');
    }

    const fetchedUser = await userRepository.getUserById(user.user_id);

    if (!fetchedUser) {
      throw new ApiError(404, `User with ID ${user.user_id} not found`);
    }

    const existingDepartmentMember = await departmentRepository.getDepartmentMember(department._id, user.user_id);

    if (existingDepartmentMember) {
        await departmentRepository.editDepartmentMembers(existingDepartmentMember._id, user.role,fetchedUser.organizationId,newDepartmentId);
    }else{
        await departmentRepository.addDepartmentMember({
            user_id: user.user_id,
            role: user.role,
            dep_id: department._id,
            organizationId:fetchedUser.organizationId
        });
    }
  }

  if(usersToRemove.length > 0) {
    await departmentRepository.removeDepartmentMembers(department._id, usersToRemove);
  }

  const updatedMembers = await departmentRepository.getDepartmentMembers(department._id);

  return updatedMembers
}

export const getDepartmentMembers = async (departmentId) => {
  if (!departmentId) {
    throw new ApiError(400, 'Department alias is required');
  }
  const department = await departmentRepository.getDepartmentById(departmentId);
  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  const members = await departmentRepository.getDepartmentMembers(department._id);

  return members;
}