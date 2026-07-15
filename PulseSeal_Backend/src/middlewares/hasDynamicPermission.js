// // middlewares/hasHierarchyPermission.js
// import User from '../models/User.js';
// import RoleDefinition from '../models/RoleDefinition.js';
// import UserRoleTable from '../models/UserRoleTable.js';

// async function getSubtreeUserRoleIds(userRoleId) {
//   const result = [];
  
//   async function recurse(ids) {
//     result.push(...ids);

//     const children = await UserRoleTable.find({
//       parentRoleId: { $in: ids },
//     }).select('_id');

//     if (children.length) {
//       const childIds = children.map(c => c._id);
//       await recurse(childIds);
//     }
//   }

//   await recurse([userRoleId]);
//   return result;
// }

// async function getAssignableUsersByUserRoleId(userRoleId) {
//   const subtreeIds = await getSubtreeUserRoleIds(userRoleId);

//   const userRoles = await UserRoleTable.find({
//     _id: { $in: subtreeIds.filter(id => id.toString() !== userRoleId.toString()) },
//   }).populate('user_id', '_id name email');

//   return userRoles.map(ur => ur.user_id?._id?.toString());
// }

// async function getAssignableUsersByUserId(userId) {
//   const userRole = await UserRoleTable.findOne({ user_id: userId });
//   if (!userRole) return [];
//   return getAssignableUsersByUserRoleId(userRole._id);
// }

// export const hasHierarchyPermission = (requiredPermission, checkHierarchy = true) => {
//   return async (req, res, next) => {
//     try {
//       const currentUserId = req.user._id; 
//       const targetUserId = req.body.assigned_to_employee_id || req.params.assigned_to_employee_id;

//       if (!targetUserId) {
//         return res.status(400).json({ message: 'assigned_to_employee_id is required' });
//       }



//       if (checkHierarchy && targetUserId) {
//         const allowedUserIds = await getAssignableUsersByUserId(currentUserId);

//         if (!allowedUserIds.includes(targetUserId.toString())) {
//           return res.status(403).json({
//             message: `Forbidden: You cannot perform '${requiredPermission}' for user ${targetUserId}, outside your hierarchy.`,
//           });
//         }
//       }


//       next();
//     } catch (err) {
//       console.error('Hierarchy permission error:', err);
//       res.status(500).json({ message: 'Internal server error in hierarchy check.' });
//     }
//   };
// };

















import UserRoleTable from '../models/userRole.Model.js';

async function getSubtreeUserRoleIds(userRoleId) {
  const result = [];
  async function recurse(ids) {
    result.push(...ids);
    const children = await UserRoleTable.find({
      parentRoleId: { $in: ids },
    }).select('_id');
    if (children.length) {
      const childIds = children.map(c => c._id);
      await recurse(childIds);
    }
  }
  await recurse([userRoleId]);
  return result;
}

async function getAssignableUsersByUserRoleId(userRoleId) {
  const subtreeIds = await getSubtreeUserRoleIds(userRoleId);
  const userRoles = await UserRoleTable.find({
    _id: { $in: subtreeIds.filter(id => id.toString() !== userRoleId.toString()) },
  }).populate('user_id', '_id name email departmentId organizationId');
  return userRoles.map(ur => ur.user_id);
}

async function getAssignableUsersByUserId(userId) {
  const userRole = await UserRoleTable.findOne({ user_id: userId });
  if (!userRole) return [];
  return getAssignableUsersByUserRoleId(userRole._id);
}

export const  hasPermissionAndAssignableUsers = (requiredPermission) => {

  return async (req, res, next) => {
    try {

      if(req.user.is_organizer || req.user.is_superuser){
        return next();
      }

      const currentUserId = req.user._id;
      const currentUserRole = await UserRoleTable.findOne({ user_id: currentUserId })
        .populate('roleDefinitionId');

      if (!currentUserRole) {
        return res.status(403).json({ message: 'No role assigned. Access denied.' });
      }
      const rolePermissions = currentUserRole.roleDefinitionId?.permissions || [];
      const hasAnyPermission = requiredPermission.some(permission =>
        rolePermissions.includes(permission)
      );

      if (!hasAnyPermission) {
        return res.status(403).json({
          message: `Forbidden: You need one of these permissions [${requiredPermission.join(", ")}].`,
        });
      }
      const assignableUsers = await getAssignableUsersByUserId(currentUserId);
      req.user.assignableUsers = assignableUsers;

      next();
    } catch (err) {
      console.error('Permission/Hierarchy middleware error:', err);
      res.status(500).json({ message: 'Internal server error in permission/hierarchy check.' });
    }
  };
};
