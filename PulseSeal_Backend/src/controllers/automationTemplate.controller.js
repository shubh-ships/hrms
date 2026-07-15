import asyncHandler from "../middlewares/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import automationRuleService from "../services/automationTemplate.service.js";

export const createAutomationRule = asyncHandler(async (req, res) => {
  const result = await automationRuleService.createAutomationRule(req);
  return successResponse(res, "Automation rule created successfully", result);
});

export const updateAutomationRule = asyncHandler(async (req, res) => {
  const result = await automationRuleService.updateAutomationRule(req);
  return successResponse(res, "Automation rule updated successfully", result);
});

export const deleteAutomationRule = asyncHandler(async (req, res) => {
  await automationRuleService.deleteAutomationRule(req);
  return successResponse(res, "Automation rule deleted successfully");
});

export const getAutomationRule = asyncHandler(async (req, res) => {
  const result = await automationRuleService.getAutomationRule(req);
  return successResponse(res, "Automation rule fetched successfully", result);
});

export const getAutomationRulesByType = asyncHandler(async (req, res) => {
  const result = await automationRuleService.getAutomationRulesByType(req);
  return successResponse(res, "Automation rules fetched successfully", result);
});

export const assignTemplate = asyncHandler(async (req, res) => {
  const result = await automationRuleService.assignTemplate(req);
  return successResponse(res, "Template assigned successfully", result);
});

export const unassignTemplate = asyncHandler(async (req, res) => {
  const result = await automationRuleService.unassignTemplate(req);
  return successResponse(res, "Assignment removed successfully", result);
});

export const getAssignmentsByEmployee = asyncHandler(async (req, res) => {
  const result = await automationRuleService.getAssignmentsByEmployee(req);
  return successResponse(res, "Assignments fetched successfully", result);
});

export const getAllAssignments = asyncHandler(async (req, res) => {
  const result = await automationRuleService.getAllAssignments(req);
  return successResponse(res, "All assignments fetched successfully", result);
});

export const getTemplateAssignmentStatus = asyncHandler(async (req, res) => {
  const result = await automationRuleService.getTemplateAssignmentStatus(req);
  return successResponse(res, "Template assignment status fetched successfully", result);
});

export const getAutomationRulesEmployees = asyncHandler(async (req, res) => {
  const result = await automationRuleService.getTemplateEmployees(req);
  const message =
    req.query.unassignedStaff === 'true'
      ? 'Unassigned employees fetched successfully'
      : 'Assigned employees fetched successfully';
  return successResponse(res, message, result);
});