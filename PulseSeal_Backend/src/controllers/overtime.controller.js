import {calculateOvertimeForDay} from "../services/overtime.service.js";
import {successResponse,errorResponse} from "../utils/apiResponse.js";
import  asyncHandler from "../middlewares/asyncHandler.js";

export const fetchMonthlyOvertime = asyncHandler (async(req, res) => {
    const { month, year } = req.body;
    const{ organizationId,_id }=req.user;
    if(!month || !year||!organizationId ||!_id) {
        return errorResponse(res, "Month, year, organizationId and userId are required", 400);
    }
    const data = await calculateOvertimeForDay(_id, month, year,organizationId);
    return successResponse(res, data, "Monthly overtime fetched successfully");
});
// export const fetchMonthlyOvertimeByUserId = asyncHandler (async(req, res) => {
//     const { month, year } = req.body;
//     const{ organizationId}=req.user;
//     const _id=req.params.id;
//     if(!month || !year||!organizationId ||!_id) {
//         return errorResponse(res, "Month, year, organizationId and userId are required", 400);
//     }
//     const data = await calculateOvertimeForDay(_id, month, year,organizationId);
//     return successResponse(res, data, "Monthly overtime fetched successfully");
// });