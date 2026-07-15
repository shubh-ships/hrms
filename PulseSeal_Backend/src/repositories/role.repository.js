import Role from "../models/roleDefine.Model.js";

export const createRole = async (data) => {
  return await Role.create(data);
};
export const updateRoleRepository = async (id,data) => {
  return await Role.findByIdAndUpdate(id,data,{ new: true });
};

export const findRoleByName = async (name,organizationId) => {
  return await Role.findOne({ name,organizationId });
};


export const getAllRole=async(organizationId)=>{
  console.log("Organization ID in Repository:", organizationId); // Debugging line
  return await Role.find({organizationId})
}