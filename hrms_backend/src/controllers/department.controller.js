import  asyncHandler  from '../middlewares/asyncHandler.js';
import * as departmentService from '../services/department.service.js';
import { successResponse } from '../utils/apiResponse.js';

export const createDepartment = asyncHandler(async (req, res) => {
  const result = await departmentService.createDepartment(req.body,req.user.organizationId);
  return successResponse(res, 'Department created successfully', result, 201);
});

export const getDepartment = asyncHandler(async (req, res) => {
  const { alias } = req.params;
  const result = await departmentService.getDepartment(alias);
  return successResponse(res, 'Department fetched successfully', result, 200);
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const { alias } = req.params;
  const result = await departmentService.updateDepartment(alias, req.body);
  return successResponse(res, 'Department updated successfully', result, 200);
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  const { alias } = req.params;
  const result = await departmentService.deleteDepartment(alias);
  return successResponse(res, 'Department deleted successfully', result, 200);
});

export const listDepartments = asyncHandler(async (req, res) => {
  const {organizationId} = req.user;
  console.log(organizationId)
  const result = await departmentService.listDepartments(organizationId);

  return successResponse(res, 'Departments fetched successfully', result, 200);
});

export const getUserDepartments = asyncHandler(async (req, res) => {
  const {user} = req;
  const result = await departmentService.getUserDepartments(user);
  return successResponse(res, 'User departments fetched successfully', result, 200);
});

export const listDepartmentsByOrgId = asyncHandler(async (req, res) => {
  const organizationId = req.organization._id;
  const result = await departmentService.listDepartmentsByOrgId(organizationId);
  return successResponse(res, 'Departments by organization id fetched successfully', result, 200);
});

export const editDepartmentMembers = asyncHandler(async (req, res) => {
  const { alias } = req.params;
  const result = await departmentService.editDepartmentMembers(alias, req.body);
  return successResponse(res, 'Department members updated successfully', result, 200);
});

export const getDepartmentMembers = asyncHandler(async (req, res) => {
  const { departmentId } = req.user;
  const result = await departmentService.getDepartmentMembers(departmentId);
  return successResponse(res, 'Department members fetched successfully', result, 200);
});

export const getDepartmentMembersById = asyncHandler(async (req, res) => {
  const departmentId = req.params.id;
  const result = await departmentService.getDepartmentMembers(departmentId);
  return successResponse(res, 'Department members fetched successfully', result, 200);
});