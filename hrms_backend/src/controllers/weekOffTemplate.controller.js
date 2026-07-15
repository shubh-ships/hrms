import asyncHandler from "../middlewares/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import weeklyOffTemplateService from "../services/weekOffTemplate.service.js";

export const createWeeklyOffTemplate = asyncHandler(async (req, res) => {
  const result = await weeklyOffTemplateService.createWeeklyOffTemplate(req);
  return successResponse(
    res,
    "Weekly off template created successfully",
    result,
    201,
  );
});

export const getWeeklyOffTemplateById = asyncHandler(async (req, res) => {
  const result = await weeklyOffTemplateService.getWeeklyOffTemplateById(req);
  return successResponse(
    res,
    "Weekly off template fetched successfully",
    result,
  );
});

export const getAllWeeklyOffTemplates = asyncHandler(async (req, res) => {
  const result = await weeklyOffTemplateService.getAllWeeklyOffTemplates(req);
  return successResponse(
    res,
    "Weekly off templates fetched successfully",
    result,
  );
});

export const updateWeeklyOffTemplate = asyncHandler(async (req, res) => {
  const result = await weeklyOffTemplateService.updateWeeklyOffTemplate(req);
  return successResponse(
    res,
    "Weekly off template updated successfully",
    result,
  );
});

export const deleteWeeklyOffTemplate = asyncHandler(async (req, res) => {
  const result = await weeklyOffTemplateService.deleteWeeklyOffTemplate(req);
  return successResponse(
    res,
    "Weekly off template deleted successfully",
    result,
  );
});

export const getTemplateEmployees = asyncHandler(async (req, res) => {
  const result = await weeklyOffTemplateService.getTemplateEmployees(req);
  const message =
    req.query.unassignedStaff === "true"
      ? "Unassigned employees fetched successfully"
      : "Assigned employees fetched successfully";
  return successResponse(res, message, result);
});

export const assignEmployeesToTemplate = asyncHandler(async (req, res) => {
  const result = await weeklyOffTemplateService.assignEmployeesToTemplate(req);
  return successResponse(
    res,
    "Employees assigned to template successfully",
    result,
  );
});

export const removeEmployeesFromTemplate = asyncHandler(async (req, res) => {
  const result =
    await weeklyOffTemplateService.removeEmployeesFromTemplate(req);
  return successResponse(
    res,
    "Employees removed from template successfully",
    result,
  );
});
