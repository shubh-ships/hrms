import * as holidayService from "../services/holiday.service.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import { holidayTemplate } from "../models/holidays.Model.js";
import ApiError from "../utils/apiError.js";
import mongoose from "mongoose";

export const createHoliday = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;
  if (!organizationId) {
    return errorResponse(res, 400, "Organization ID is required");
  }
  const holidayData = req.body;
  const holiday = await holidayService.createHoliday(
    holidayData,
    organizationId,
  );
  successResponse(res, 201, holiday);
});
export const getHolidaysByOrgId = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;
  if (!organizationId) {
    return errorResponse(res, 400, "Organization ID is required");
  }
  const holiday = await holidayService.getHolidaysByOrgId(organizationId);
  successResponse(res, 200, holiday);
});

export const updateHolidayById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  if (!id) {
    return errorResponse(res, 400, "Holiday ID is required");
  }
  if (Object.keys(data).length === 0) {
    return errorResponse(
      res,
      400,
      "At least one field must be provided for update",
    );
  }
  const holiday = await holidayService.updateHolidayById(id, data);
  successResponse(res, 200, holiday);
});

export const createHolidayTemplate = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;
  if (!organizationId) {
    return errorResponse(res, 400, "Organization ID is required");
  }
  const payload = {
    ...req.body,
    organizationId,
    holidays: req.body.holidays || [],
  };
  if (!payload.holidays.length) {
    return errorResponse(
      res,
      400,
      "At least one holiday must be included in the template",
    );
  }
  const result = await holidayService.createHolidaytemplateService(payload);
  return successResponse(res, 201, result);
});
export const assignHolidayTemplate = asyncHandler(async (req, res) => {
  const { templateId, employeeIds } = req.body;
  const { organizationId } = req.user;
  if (
    !templateId ||
    !employeeIds ||
    !Array.isArray(employeeIds) ||
    employeeIds.length === 0
  ) {
    return errorResponse(
      res,
      400,
      "Template ID and a non-empty array of employee IDs are required",
    );
  }
  if (!organizationId) {
    return errorResponse(res, 400, "Organization ID is required");
  }
  const result = await holidayService.assignHolidayTemplateService(
    employeeIds,
    templateId,
    organizationId,
  );
  return successResponse(res, "Holiday template assigned successfully", result);
});
export const getHolidayTemplates = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;
  if (!organizationId) {
    return errorResponse(res, 400, "Organization ID is required");
  }
  const result =
    await holidayService.getHolidayTemplatesService(organizationId);
  return successResponse(res, "Holiday Templates fetched successfully", result);
});

export const findholidayTemplateById = async (id) => {
  try {
    if (!id) {
      throw new ApiError(400, "Template ID is required");
    }
    const template = await holidayTemplate.findById(id).lean();
    if (!template) {
      throw new ApiError(404, "Holiday template not found");
    }
    return template;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(500, error.message);
    }
  }
};
export const findOneHolidayTemplate = async (query) => {
  try {
    if (!query) {
      throw new ApiError(400, "Query parameter is required");
    }
    return await holidayTemplate.findOne(query).lean();
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

export const getHolidayByTemplateId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return errorResponse(res, 400, "Template ID is required");
  }
  const template = await holidayService.getHolidayTemplateByIdService(id);
  if (!template) {
    return errorResponse(res, 404, "Holiday template not found");
  }
  return successResponse(res, 200, template);
});
export const updateHolidayTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return errorResponse(res, 400, "Template ID is required");
  }
  if (Object.keys(req.body).length === 0) {
    return errorResponse(
      res,
      400,
      "At least one field must be provided for update",
    );
  }
  const updatedTemplate = await holidayService.updateHolidayTemplateService(
    id,
    req.body,
  );

  return successResponse(res, 200, updatedTemplate);
});
export const deleteHolidayTemplate = asyncHandler(async (req, res) => {
  if (!req.params.id) {
    return errorResponse(res, 400, "Template ID is required");
  }
  const { id } = req.params;

  const deletedTemplate = await holidayService.deleteHolidayTemplateService(id);

  return successResponse(res, 200, deletedTemplate);
});
export const getUnassignedEmployees = asyncHandler(async (req, res) => {
  if (!req.params.templateId) {
    return errorResponse(res, 400, "Template ID is required");
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.templateId)) {
    return errorResponse(res, 400, "Invalid template ID format");
  }
  const result = await holidayService.findUnassignedEmployeesToTemplate(req);

  return successResponse(
    res,
    "Unassigned employees fetched successfully",
    result,
  );
});

export const getAssignedEmployees = asyncHandler(async (req, res) => {
  if (!req.params.templateId) {
    return errorResponse(res, 400, "Template ID is required");
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.templateId)) {
    return errorResponse(res, 400, "Invalid template ID format");
  }
  const result = await holidayService.findAssignedEmployeesToTemplate(req);

  return successResponse(
    res,
    "Assigned employees fetched successfully",
    result,
  );
});

export const removeEmployeesFromTemplate = asyncHandler(async (req, res) => {
  if (!req.params.templateId) {
    return errorResponse(res, 400, "Template ID is required");
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.templateId)) {
    return errorResponse(res, 400, "Invalid template ID format");
  }
  const result = await holidayService.removeTemplateFromEmployees(req);

  return successResponse(
    res,
    "Employees removed from template successfully",
    result,
  );
});
