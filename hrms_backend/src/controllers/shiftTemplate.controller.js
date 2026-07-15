import asyncHandler from "../middlewares/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import shiftTemplateService from "../services/shiftTemplate.service.js";

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const createShiftTemplate = asyncHandler(async (req, res) => {
  const result = await shiftTemplateService.createShiftTemplate(req);
  return successResponse(
    res,
    "Shift template created successfully",
    result,
    201,
  );
});

export const getAllShiftTemplates = asyncHandler(async (req, res) => {
  const result = await shiftTemplateService.getAllShiftTemplates(req);
  return successResponse(res, "Shift templates fetched successfully", result);
});

export const getShiftTemplateById = asyncHandler(async (req, res) => {
  const result = await shiftTemplateService.getShiftTemplateById(req);
  return successResponse(res, "Shift template fetched successfully", result);
});

export const updateShiftTemplate = asyncHandler(async (req, res) => {
  const result = await shiftTemplateService.updateShiftTemplate(req);
  return successResponse(res, "Shift template updated successfully", result);
});

export const deleteShiftTemplate = asyncHandler(async (req, res) => {
  const result = await shiftTemplateService.deleteShiftTemplate(req);
  return successResponse(res, "Shift template deleted successfully", result);
});

// ─── Employee Assignment ───────────────────────────────────────────────────────

export const getTemplateEmployees = asyncHandler(async (req, res) => {
  const result = await shiftTemplateService.getTemplateEmployees(req);
  const message =
    req.query.unassignedStaff === "true"
      ? "Unassigned employees fetched successfully"
      : "Assigned employees fetched successfully";
  return successResponse(res, message, result);
});

export const assignEmployeesToShift = asyncHandler(async (req, res) => {
  const result = await shiftTemplateService.assignEmployeesToShift(req);
  return successResponse(
    res,
    "Employees assigned to shift template successfully",
    result,
  );
});

export const removeEmployeesFromShift = asyncHandler(async (req, res) => {
  const result = await shiftTemplateService.removeEmployeesFromShift(req);
  return successResponse(
    res,
    "Employees removed from shift template successfully",
    result,
  );
});
