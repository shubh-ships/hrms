import UserRole from "../models/userRole.Model.js";

export const createUserRole = async (data) => {
  return await UserRole.create(data);
};

export const findUserRoles = async (userId) => {
  return await UserRole.find({ user: userId }).populate("role");
};

export const findByUserId = async (userId,session = null) => {
  console.log(userId,"userId")
  return UserRole.findOne({ user_id: userId }).session(session);
};

export  const updateUserIdInRole=async(roleId,newUserId,session=null)=>{
  const updatedUserID= await UserRole.findByIdAndUpdate(
    roleId,
    {user_id:newUserId,
      status:"active"

    },
    {new:true,session}
  )
return updatedUserID;
}

export const pushHistory=async(roleId,historyEntry,session=null)=>{
   return UserRole.findByIdAndUpdate(
    roleId,
    { $push: { history: historyEntry } },
    { new: true, session }
  );
}

export const findChildren = async (parentIds) => {
  return UserRole.find({ parentRoleId: { $in: parentIds } }).lean();
};

export const findByIds = async (ids) => {
  return UserRole.find({ _id: { $in: ids } })
    .populate('user_id', 'name email phoneNumber')
    .populate('roleDefinitionId', 'roleName hierarchyLevel')
    .populate({path: 'departments',
      select: 'name description'}) 
    .lean();
};

export const deactivateRole = async (roleId, session = null) => {
  return UserRole.findByIdAndUpdate(
    roleId,
    { status: "inactive" },
    { new: true, session }
  );
};

export const editUserRoleByUserID=async(userId,updateData)=>{
  return UserRole.findOneAndUpdate(
    {user_id:userId},
    updateData,
    {new:true}
  )
}