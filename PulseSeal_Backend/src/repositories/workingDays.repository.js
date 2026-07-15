import TotalWorkingDays from "../models/workingDays.Model.js";
 
 
export const createWorkingDays=async(data)=>{
    return await TotalWorkingDays.create(data)
}
export const updateWorkingDays=async(id,data)=>{
  console.log("ID in Repository:", id); // Debugging line
  console.log("Data in Repository:", data); // Debugging line
    return await TotalWorkingDays.findByIdAndUpdate(id,data,{new:true})
}
export const getWorkingDays=async(organizationId)=>{
    return await TotalWorkingDays.find({organizationId})
}
export const getTotalWorkingDays = async (monthId) => {
  const month = await TotalWorkingDays.findById(monthId);
  return month;
};
export const getTotalWorkingDaysByID = async (id) => {
  const month = await TotalWorkingDays.findById(id).select("organizationId");
  return month;
};
export const getMonthByName = async (month) => {
  const monthData = await TotalWorkingDays.findOne({month:month});
  return monthData;
};

export const getWorkingDaysByMonthYearOrganization = async (month, year, organizationId) => {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
    if (month < 1 || month > 12) {
    throw new Error("Invalid month number. Must be between 1 and 12.");
  }
  const monthName = monthNames[month - 1]
  return await TotalWorkingDays.findOne({ month:monthName, year, organizationId });
}