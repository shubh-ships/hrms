import * as TeamRepository from '../repositories/team.repository.js';
import ApiError from '../utils/apiError.js';

export const createTeam=async(data)=>{
    return await TeamRepository.createTeam(data);
} 

export const updateTeam=async(teamId,data)=>{
    const team=await TeamRepository.getTeamById(teamId);
    if(!team){
        throw new ApiError("Team not found");
    }
    return await TeamRepository.updateTeam(teamId,data);
}   

export const getTeamsForOrganization=async(organizationId)=>{
    return await TeamRepository.getTeamsForOrganization(organizationId);
}
export const getTeamsForDepartment=async(departmentId)=>{
    return await TeamRepository.getTeamsForDepartment(departmentId);
}