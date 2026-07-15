import * as workingDaysServices from '../services/workingDays.service.js';
import { successResponse } from '../utils/apiResponse.js';
import  asyncHandler  from '../middlewares/asyncHandler.js';
 
 
export const createWorkingDays=asyncHandler(async(req,res)=>{
    const data = req.body;
    const {organizationId} = req.user
    const createWorkingDay=await workingDaysServices.workingDays(data,organizationId);
    return successResponse(res,"working days created successfully",createWorkingDay,200)
})
export const updateWorkingDays=asyncHandler(async(req,res)=>{
    const data = req.body;
        const { id } = req.params;
    const updateWorkingDay=await workingDaysServices.updateWorkingDays(data,id);
    return successResponse(res,"working days created successfully",updateWorkingDay,200)
})
 
 
export const getWorkingDays=asyncHandler(async(req,res)=>{
    const {organizationId}= req.user;
    const getAllUsers=await workingDaysServices.getWorkingDays(organizationId);
    return successResponse(res,"get user sucessfully",getAllUsers,200)
})
