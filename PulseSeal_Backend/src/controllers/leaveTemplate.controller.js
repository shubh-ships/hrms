import asyncHandler from "../middlewares/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import leaveTemplateService from "../services/leaveTemplate.service.js";

export const createLeaveTemplate = asyncHandler(async (req, res) => {
  const result = await leaveTemplateService.createLeaveTemplate(req);
  return successResponse(res, "Leave template created successfully", result);
});

export const getLeaveTemplateById = asyncHandler(async (req, res) => {
  const result = await leaveTemplateService.getLeaveTemplateById(req);
  return successResponse(res, "Leave template fetched successfully", result);
});

export const getAllLeaveTemplates = asyncHandler(async (req, res) => {
  const result = await leaveTemplateService.getAllLeaveTemplates(req);
  return successResponse(res, "Leave templates fetched successfully", result);
});

export const updateLeaveTemplate = asyncHandler(async (req, res) => {
  const result = await leaveTemplateService.updateLeaveTemplate(req);
  return successResponse(res, "Leave template updated successfully", result);
});

export const deleteLeaveTemplate = asyncHandler(async (req, res) => {
  const result = await leaveTemplateService.deleteLeaveTemplate(req);
  const message =
    req.query.permanent === "true"
      ? "Leave template permanently deleted"
      : "Leave template deactivated successfully";
  return successResponse(res, message, result);
});

export const activateLeaveTemplate = asyncHandler(async (req, res) => {
  const result = await leaveTemplateService.activateLeaveTemplate(req);
  return successResponse(res, "Leave template activated successfully", result);
});

export const getTemplateEmployees = asyncHandler(async (req, res) => {
  const result = await leaveTemplateService.getTemplateEmployees(req);
  const message =
    req.query.unassignedStaff === "true"
      ? "Unassigned employees fetched successfully"
      : "Assigned employees fetched successfully";
  return successResponse(res, message, result);
});

export const assignEmployeesToTemplate = asyncHandler(async (req, res) => {
  const result = await leaveTemplateService.assignEmployeesToTemplate(req);
  return successResponse(
    res,
    "Employees assigned to template successfully",
    result,
  );
});

export const removeEmployeesFromTemplate = asyncHandler(async (req, res) => {
  const result = await leaveTemplateService.removeEmployeesFromTemplate(req);
  return successResponse(
    res,
    "Employees removed from template successfully",
    result,
  );
});
