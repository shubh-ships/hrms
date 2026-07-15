import asyncHandler from "../middlewares/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import leaveApplicationService from "../services/leaveApplication.service.js";

export const applyLeave = asyncHandler(async (req, res) => {
  const result = await leaveApplicationService.applyLeave(req);
  return successResponse(
    res,
    "Leave application submitted successfully",
    result,
    201,
  );
});

export const getApplications = asyncHandler(async (req, res) => {
  const result = await leaveApplicationService.getApplications(req);
  return successResponse(
    res,
    "Leave applications fetched successfully",
    result,
  );
});

export const getApplicationById = asyncHandler(async (req, res) => {
  const result = await leaveApplicationService.getApplicationById(req);
  return successResponse(res, "Leave application fetched successfully", result);
});

export const updateApplication = asyncHandler(async (req, res) => {
  const result = await leaveApplicationService.updateApplication(req);
  return successResponse(res, "Leave application updated successfully", result);
});

export const cancelApplication = asyncHandler(async (req, res) => {
  const result = await leaveApplicationService.cancelApplication(req);
  return successResponse(
    res,
    "Leave application cancelled successfully",
    result,
  );
});

export const approveApplication = asyncHandler(async (req, res) => {
  const result = await leaveApplicationService.approveApplication(req);
  return successResponse(
    res,
    "Leave application approved successfully",
    result,
  );
});

export const rejectApplication = asyncHandler(async (req, res) => {
  const result = await leaveApplicationService.rejectApplication(req);
  return successResponse(
    res,
    "Leave application rejected successfully",
    result,
  );
});

export const markLeave = asyncHandler(async (req, res) => {
  const result = await leaveApplicationService.markLeave(req);
  return successResponse(res, "Leave marked successfully", result, 201);
});
