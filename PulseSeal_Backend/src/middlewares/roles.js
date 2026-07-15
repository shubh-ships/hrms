import * as departmentRepository from '../repositories/department.repository.js';
import * as organizationRepository from '../repositories/organization.repository.js';

export const userIsSuperuser = (req,res,next)=>{
    if(req.user.is_superuser){
        return next();
    }
    return res.status(403).json({error:"Forbidden, user is not superuser!"});
};

export const userIsOrganizationAdmin = async (req,res,next)=>{
    const {organizationId} = req.user;
    // const userId = req.user.id;

    if(!req.user){
        return res.status(400).json({error:"user not found"})
    }

    if(!organizationId) {
        return res.status(400).json({error:"Bad Request, Organization id is required!"
        });
    }

    try{

    const organization = await organizationRepository.getOrganizationById(organizationId);

    if(!organization) {
        return res.status(404).json({error:"Not Found, Organization not found!"});
    }

    req.organization = organization;

    // const organizationMember = await organizationRepository.getOrganizationMember(organization._id, userId);

    if(req.user.is_organizer) {
        return next();
    }

    if(req.user.is_superuser) {
        return next();
    }

    return res.status(403).json({error:"Forbidden, user is not organization admin!"});
}
    catch (error) {
        console.error("Error in userIsOrganizationAdmin middleware:", error);
        return res.status(500).json({error:"Internal Server Error, please try again later!"});
    }
};

export const userHasDepartmentRoles = (allowedRoles = []) => {
    return async (req, res, next) => {
        const departmentId = req.user.departmentId;

        if (!departmentId && req.userRole !== "ADMIN") {
            return res.status(400).json({ error: "Bad Request, Department id is required!" });
        }

        try {
            const department = await departmentRepository.getDepartmentById(departmentId);

            if (!department && req.userRole !== "ADMIN") {
                return res.status(404).json({ error: "Department not found!" });
            }

            req.department = department;

            let departmentMember;
            if(department){
                departmentMember = await departmentRepository.getDepartmentMember(department._id, req.user.id);
            }else{
                departmentMember = {
                    role: req.userRole
                }
            }

            if (departmentMember && allowedRoles.includes(departmentMember.role)) {
                return next();
            }

            const organizationMember = await organizationRepository.getOrganizationMember(department.organization_id, req.user.id);

            if (organizationMember && organizationMember.access_type === 'ADMIN') {
                return next();
            }

            if (req.user.is_superuser) {
                return next();
            }

            return res.status(403).json({ error: "Forbidden, you do not have the required role!" });
        } catch (error) {
            console.error("Error in userHasDepartmentRoles middleware:", error);
            return res.status(500).json({ error: "Internal Server Error!" });
        }
    };
};


























// import UserRoleTable from '../models/userRole.Model.js';

// export const userHasPermission = (requiredPermissions = []) => {
//   return async (req, res, next) => {
//     try {
//       const { id: userId, is_superuser } = req.user;

//       if (is_superuser) return next();

//       const userRoles = await UserRoleTable.find({
//         user_id: userId,
//         organizationId: req.user.organizationId,
//       }).populate('dep_id');

//       if (!userRoles.length) {
//         return res.status(403).json({ error: "Forbidden, no roles assigned!" });
//       }

//       const hasPermission = userRoles.some(role =>
//         role.permissions.some(p => requiredPermissions.includes(p))
//       );

//       if (!hasPermission) {
//         return res.status(403).json({ error: "Forbidden, missing required permission!" });
//       }

//       req.userRoles = userRoles;

//       next();
//     } catch (error) {
//       console.error("Error in userHasPermission middleware:", error);
//       return res.status(500).json({ error: "Internal Server Error!" });
//     }
//   };
// };
