import User from "../models/user.Model.js";


export const findUsersWithOrgId = async (organizationId) => {
  return await User.countDocuments({ 
    organizationId,
     isActive: true,
  });
}

export const createUser = async (data) => {
  return await User.create(data);
};
export const createAdmin = async (data) => {
  const adminData = { ...data, is_organizer: true };
  return await User.create(adminData);
};

export const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};


export const deActivateUserById = async (userId) => {
  return await  User.findByIdAndUpdate(userId, { isActive: false }, { new: true });
}