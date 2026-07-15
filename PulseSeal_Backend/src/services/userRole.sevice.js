
import { createUserRole, findUserRoles,findByUserId,updateUserIdInRole,pushHistory,deactivateRole } from "../repositories/userRole.repository.js";
import ApiError from "../utils/apiError.js";
import { createUser } from "../repositories/newUser.repository.js";
import mongoose from "mongoose";

export const assignRoleToUser = async (user_id, roleDefinitionId, parentRoleId = null,organizationId,departmentId) => {
   
  return await createUserRole({ user_id, roleDefinitionId,parentRoleId,organizationId,departments:departmentId });
};

export const getUserRolesWithDetails = async (userId) => {
  return await findUserRoles(userId);
};

export const reassignRole = async (oldUserId, newUserId,mode ="replace",newRoleDefId,userData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const roleNode = await findByUserId(oldUserId, session);
    if (!roleNode) throw new Error("User role not found");

    if (mode === "replace") {
      await updateUserIdInRole(roleNode._id, newUserId, session);
      await pushHistory(roleNode._id, {
        action: "replaced",
        user_id: newUserId
      }, session);

    } else if (mode === "newuserreplace") {
      await deactivateRole(roleNode._id, session);
      await deActivateUserById(oldUserId);
      const newUser=await createUser(userData);

      await createUserRole({
        user_id: newUser._id,
        roleDefinitionId: newRoleDefId, 
        parentRoleId: roleNode.parentRoleId,
        organizationId: roleNode.organizationId,
        departments: newUser.departmentId,
        status: "active",
        history: [{ action: "Added", user_id: newUser._id }]
      });
    } else if (mode === "leave") {
      await deactivateRole(roleNode._id, session);
      await pushHistory(roleNode._id, {
        action: "left",
        user_id: oldUserId
      }, session);
    }

    await session.commitTransaction();
    return roleNode;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};


// export const replaceUserIdRole= async(oldUserId,newUserId)=>{
//   const session= await mongoose.startSession();
//    session.startTransaction();
//    try {
//     const roleNode = await findByUserId(oldUserId, session);
//     if (!roleNode) throw new Error('User role not found');

//     await updateUserIdInRole(roleNode._id, newUserId, session);

//     await pushHistory(roleNode._id, {
//       action: 'replaced',
//       user_id: newUserId
//     }, session);

//     await session.commitTransaction();
    
//     return roleNode;

//     } catch (err) {
//     await session.abortTransaction();
//     throw err;
//   } finally {
//     session.endSession();
//   }
// };