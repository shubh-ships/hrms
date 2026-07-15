import *  as workingDaysRepository  from '../repositories/workingDays.repository.js';
import  ApiError  from '../utils/apiError.js';
 
 
export const workingDays=async(workingDayData,organizationId)=>{
    if(!workingDayData.totalWorkingDays||!workingDayData.month||!organizationId||!workingDayData.year){
        new ApiError(400,"working days or month are required")
    }

    workingDayData["organizationId"] = organizationId;
    
    const workingday= await workingDaysRepository.createWorkingDays(workingDayData)
    return {
        workingday
    }
}
export const updateWorkingDays=async(workingDayData,id)=>{
    const workingDays=await(workingDaysRepository.getTotalWorkingDaysByID(id))
    if(workingDays){
        new ApiError(400,"working days doesn't exist")
    }
    // console.log("Organization ID in Service:", workingDays); // Debugging line
    // workingDays.organizationId = organizationId;
    
    const workingday= await workingDaysRepository.updateWorkingDays(id,workingDayData)
    return {
        workingday
    }
}
export const getWorkingDays=async(organizationId)=>{
    if(!organizationId){
        new ApiError (400,"organizationId is required")
    }
 
    const workingday= await workingDaysRepository.getWorkingDays(organizationId)
    return{
        workingday
    }
}