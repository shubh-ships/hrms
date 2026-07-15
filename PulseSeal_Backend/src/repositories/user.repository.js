import User from '../models/user.Model.js';
import userProfileModel from '../models/userProfile.Model.js';
import UserRoleTable from '../models/userRole.Model.js';

export const createUser = async (userData) => {
  return await User.create(userData);
};

export const createUserProfile = async (profileData)=>{
  return await userProfileModel.create(profileData);
}

export const getUserByEmail = async (email) => {
  return await User.findOne({ email }).select('id password otp name email is_superuser is_organizer departmentId organizationId isActive isFreezed');
};

export const getUserRoleByUserId = async (user_id) => {
  return await UserRoleTable.findOne({user_id}).populate('roleDefinitionId')
}

export const getUsers = async (org_id) => {

  return await UserRoleTable.find({organizationId:org_id})
  .select("status history")
  // .populate("organizationId")
  .populate("departments","name alias")
  .populate("user_id","name email phoneNumber isActive isActive isFreezed is_superuser is_organizer")
  .populate("roleDefinitionId")
  .populate({
      path: "parentRoleId",
      select: "user_id", 
      populate: {
        path: "user_id roleDefinitionId",
        select: "name email roleName", 
      },
      
  })
  .sort({ createdAt: -1 });
};

export const getUserById = async (id) => {
  return await User.findById(id).select('id password otp name email organizationId departmentId');
};

export const getUserProfileById = async (id) => {
  return await userProfileModel.findOne({userId: id})
    .select('-password -otp')
    .populate('userId');
};

export const updateUserById = async (id, updateData) => {
  return await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

export const updateUserProfileById = async (id, updateData) => {
  return await userProfileModel.findOneAndUpdate({userId: id}, updateData, {
    new: true,
    runValidators: true,
});
};


export const deleteUserById = async (id) => {
  return await User.findByIdAndDelete(id);
};

export const deleteUserProfileById = async (id) => {
  return await userProfileModel.findOneAndDelete({userId: id});
};

export const getAdmin = async (organizationId) => {
  return await  User.find({ organizationId, is_organizer: true }).select('id name email phoneNumber organizationId departmentId isActive');
}


export const addRekognitionFaceId = async (userId, faceId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (!user.recognitionFaceIds) user.recognitionFaceIds = [];
  user.recognitionFaceIds.push(faceId);

  return await user.save();
};

export const getUsersByOrganization = async (organizationId) => {
  return await User.find({ organizationId });
};




export const addFaceDataToUser = async (userId, faceImageUrl, faceIds) => {
  if (!faceIds || faceIds.length !== 1) {
    throw new Error("Exactly one face must be provided for the user");
  }

  const user = await User.findById(userId).select('+recognitionFaceIds');
  if (!user) throw new Error("User not found");

  user.faceImages.push(faceImageUrl);
  user.recognitionFaceIds.push(faceIds[0]);



  return await user.save();
};

export const fetchUsers = async () => {
  const users = await User.find({
  $or: [
    { recognitionFaceIds: { $exists: false } },
    { recognitionFaceIds: { $size: 0 } },
    { recognitionFaceIds: { $all: [""] } },
  ],
}).select('+rekognitionFaceIds');


  return users;
}