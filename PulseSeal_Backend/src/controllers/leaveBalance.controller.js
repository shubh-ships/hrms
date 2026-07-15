import asyncHandler from "../middlewares/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import leaveBalanceService from "../services/leaveBalance.service.js";

export const getLeaveBalance = asyncHandler(async (req, res) => {
  const result = await leaveBalanceService.getBalance(req);
  return successResponse(res, "Leave balance fetched successfully", result);
});

export const updateLeaveBalance = asyncHandler(async (req, res) => {
  const result = await leaveBalanceService.updateBalance(req);
  return successResponse(res, "Leave balance updated successfully", result);
});

export const initializeLeaveBalance = asyncHandler(async (req, res) => {
  const result = await leaveBalanceService.initializeBalance(req);
  return successResponse(
    res,
    "Leave balance initialized successfully",
    result,
    201,
  );
});
