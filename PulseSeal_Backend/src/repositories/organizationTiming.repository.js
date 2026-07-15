import {Office} from '../models/organizationTiming.Model.js'


export const getOfficeTimingByOrgId=async(organizationId)=>{
    const officeTiming=await Office.findOne({organizationId})
    return officeTiming
}

export const createOfficeTiming=async(data)=>{
    const officeTiming=await Office.create(data)
    return officeTiming
}

export const updateOfficeTiming = async (organizationId, data) => {
  const office = await Office.findOne({ organizationId });
  if (!office) throw new Error("Office not found");
    console.log(data)
  data.shifts.forEach((updatedShift) => {
    if (updatedShift._id) {
      const shift = office.shifts.id(updatedShift._id);
      if (shift) {
        shift.name = updatedShift.name ?? shift.name;
        shift.startTime = updatedShift.startTime ?? shift.startTime;
        shift.endTime = updatedShift.endTime ?? shift.endTime;
        if (updatedShift.breaks) {
          shift.breaks = updatedShift.breaks;
        }
      }
    } else {
      office.shifts.push(updatedShift);
    }
  });

  await office.save();
  return office;
};