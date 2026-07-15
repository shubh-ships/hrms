// import { salaryslipService } from "../services/salaryslip.services.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import { salaryslipService } from "../services/sallaryslip.service.js";

export const generateSalarySlip = async (req, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) throw new ApiError(400, "Month and Year are required");

    const userId = req.user._id;
    const salarySlipData = await salaryslipService({
      userId,
      month,
      year,
      organizationId: req.user.organizationId,
    });

    successResponse(res, "Salary Slip generated successfully", salarySlipData);
  } catch (error) {
    errorResponse(res, error);
  }
};

// export const generateSalarySlipInParams = async (req, res) => {
//   try {
//     const { month, year } = req.body;
//     if (!month || !year) throw new ApiError(400, "Month and Year are required");

//     const userId = req.params.id;
//     const organizationId = req.user.organizationId;
//     const salarySlipData = await salaryslipService({
//       userId,
//       month,
//       year,
//       organizationId,
//     });

//     successResponse(res, "Salary Slip generated successfully", salarySlipData);
//   } catch (error) {
//     errorResponse(res, error);
//   }
// };

export const generateSalarySlipInParams = asyncHandler(async (req, res) => {
  try {
    const { month, year } = req.body;
    const userId = req.params.id;
    const organizationId = req.user.organizationId;

    // Validate required fields
    if (!userId || !month || !year || !organizationId) {
      throw new ApiError(
        400,
        "Missing required fields: userId, month, year, organizationId",
      );
    }

    // Validate month is a number (1-12)
    const monthNum = parseInt(month);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new ApiError(
        400,
        "Invalid month. Month must be a number between 1-12",
      );
    }

    // Validate year format
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      throw new ApiError(
        400,
        "Invalid year. Year must be a number between 2000-2100",
      );
    }

    // Call the salary slip service
    const salarySlip = await salaryslipService({
      userId,
      month: monthNum, // Pass as number
      year: yearNum, // Pass as number
      organizationId,
    });

    // console.log(salarySlip,"salarySlipsalarySlipsalarySlip");

    // Send success response
    return successResponse(
      res,
      "Salary slip generated successfully",
      salarySlip,
    );
  } catch (error) {
    console.error("Error generating salary slip:", error);

    if (error instanceof ApiError) {
      return errorResponse(res, error.message, error.statusCode);
    }

    return errorResponse(
      res,
      "Internal server error while generating salary slip",
      500,
    );
  }
});
