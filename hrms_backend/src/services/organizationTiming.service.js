import * as organizationTimingRepository from '../repositories/organizationTiming.repository.js'



export const getOfficeTiming=async(organizationId)=>{
    const officeTiming=await organizationTimingRepository.getOfficeTimingByOrgId(organizationId)
    return officeTiming
}

export const createOfficeTiming=async(data)=>{
    const officeTiming=await organizationTimingRepository.createOfficeTiming(data)
    return officeTiming
}
export const updateOfficeTiming=async(organizationId,data)=>{
    const officeTiming=await organizationTimingRepository.updateOfficeTiming(organizationId,data)
    return officeTiming
}