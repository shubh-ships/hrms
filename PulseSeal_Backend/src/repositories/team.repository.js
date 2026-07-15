import Team from "../models/team.Model.js";



export const createTeam=async(data)=>{
    return await Team.create(data); 
}
export const updateTeam=async(teamId,data)=>{
    return await Team.findByIdAndUpdate(teamId,data); 
}
export const getTeamsForOrganization=async(organizationId)=>{
    return await Team.find({organizationId}).populate("organizationId","name"); 
}
export const getTeamsForDepartment=async(departmentId)=>{
    return await Team.find({departmentId}).populate("departmentId","name"); 
}