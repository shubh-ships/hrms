import  asyncHandler  from '../middlewares/asyncHandler.js';
import * as organizationService from '../services/organization.service.js';
import { successResponse } from '../utils/apiResponse.js';

export const createOrganization = asyncHandler(async (req, res) => {
  const result = await organizationService.createOrganization(req);
  return successResponse(res, 'Organization created successfully', result, 201);
});

export const getOrganization = asyncHandler(async (req, res) => {
  const { alias } = req.params;
  const result = await organizationService.getOrganization(alias);
  return successResponse(res, 'Organization fetched successfully', result, 200);
});

export const updateOrganization = asyncHandler(async (req, res) => {
  const result = await organizationService.updateOrganization(req);
  return successResponse(res, 'Organization updated successfully', result, 200);
});

export const deleteOrganization = asyncHandler(async (req, res) => {
  const { alias } = req.params;
  const result = await organizationService.deleteOrganization(alias);
  return successResponse(res, 'Organization deleted successfully', result, 200);
});

export const listOrganizations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, ...filters } = req.query;

  const result = await organizationService.listOrganizations(filters, {
    page: parseInt(page),
    limit: parseInt(limit),
  });

  return successResponse(res, 'Organizations fetched successfully', result, 200);
});

export const editOrganizationMembers = asyncHandler(async (req, res) => {
    const {alias} = req.params;
    const { add: usersToAdd = [], remove: usersToRemove = [] } = req.body;
    const result = await organizationService.editOrganizationMembers(alias, usersToAdd, usersToRemove,req);
    return successResponse(res, 'Organization members updated successfully', result, 200);
});

export const getOrganizationMembers = asyncHandler(async (req, res) => {
    const { alias } = req.params;
    const result = await organizationService.getOrganizationMembers(alias);
    return successResponse(res, 'Organization members fetched successfully', result, 200);
});

export const getOrganizationManagers = asyncHandler(async (req, res) => {
  const { organization } = req;
  const result = await organizationService.getOrganizationManagers(organization);
  return successResponse(res, 'Department members fetched successfully', result, 200);
});
