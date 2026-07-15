import * as teamService from '../services/team.Services.js';
import  asyncHandler  from '../middlewares/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

export const createTeam = asyncHandler(async(req,res)=>{
    const result = await teamService.createTeam(req.body);
    return successResponse(res, 'Team created successfully', result, 201);
})
export const updateTeam = asyncHandler(async(req,res)=>{
    const {id} = req.params;
    const result = await teamService.updateTeam(id,req.body);
    return successResponse(res, 'Team updated successfully', result, 201);
})
export const getTeamsForOrganization = asyncHandler(async(req,res)=>{
    const {organizationId} = req.user;
    const result = await teamService.getTeamsForOrganization(organizationId);
    return successResponse(res, 'Teams fetched successfully', result, 201);
})
export const getTeamsForDepartment = asyncHandler(async(req,res)=>{
    const {departmentId} = req.params;
    const result = await teamService.getTeamsForDepartment(departmentId);
    return successResponse(res, 'Teams fetched successfully', result, 201);
})