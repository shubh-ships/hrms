import * as holidayRepository from "../repositories/holiday.repository.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import { Holiday, holidayTemplate } from "../models/holidays.Model.js";
import mongoose from "mongoose";
import moment from "moment-timezone";

export const getUTCMidnight = (dateString, timezone) => {
  return moment
    .tz(dateString, "YYYY-MM-DD", timezone)
    .startOf("day")
    .utc()
    .toDate();
};

export const createHoliday = async (holidayData, organizationId) => {
  const holiday = await holidayRepository.createHoliday(
    holidayData,
    organizationId,
  );
  return holiday;
};
export const getHolidaysByOrgId = async (organizationId) => {
  const holidays = await holidayRepository.getHolidaysByOrgId(organizationId);
  return holidays;
};

export const updateHolidayById = async (id, data) => {
  const holiday = await holidayRepository.updateHolidayById(id, data);
  return holiday;
};
export const createHolidaytemplateService = async (payload) => {
  const timezone = "Asia/Kolkata";

  const startDateRaw = payload.StartDate || payload.startDate;
  const endDateRaw = payload.endDate;

  if (startDateRaw > endDateRaw) {
    throw new ApiError(400, "Start date cannot be greater than end date");
  }

  // 🔥 Convert ALL dates here
  const formattedData = {
    ...payload,

    StartDate: getUTCMidnight(startDateRaw, timezone),
    endDate: getUTCMidnight(endDateRaw, timezone),

    holidays: payload.holidays.map((h) => ({
      ...h,
      holidayDate: getUTCMidnight(h.holidayDate, timezone),
    })),
  };

  const template = await holidayRepository.createTemplateRepo(formattedData);

  return template;
};

export const assignHolidayTemplateService = async (
  employeeIds,
  templateId,
  organizationId,
) => {
  if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
    throw new Error("Employee list cannot be empty");
  }

  // Validate template exists before assignment
  const template =
    await holidayRepository.getHolidayTemplateByIdRepo(templateId);
  if (!template) {
    throw new ApiError(404, "Holiday template not found");
  }

  // Assign template to employees
  const result = await holidayRepository.assignHolidayTemplateRepo(
    employeeIds,
    templateId,
    organizationId,
  );

  console.log("Template fetched:", template);
  // Return the template with holidays array
  return template;
};
export const getHolidayTemplatesService = async (Query) => {
  try {
    return await holidayRepository.findAllHolidaytemplate(Query);
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};
export const getHolidayTemplateByIdService = async (id) => {
  try {
    return await holidayRepository.getHolidayTemplateByIdRepo(id);
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};
export const updateHolidayTemplateService = async (id, payload) => {
  try {  const timezone = "Asia/Kolkata";

  const startDateRaw = payload.StartDate || payload.startDate;
  const endDateRaw = payload.endDate;

  if (startDateRaw > endDateRaw) {
    throw new ApiError(400, "Start date cannot be greater than end date");
  }

  // 🔥 Convert ALL dates here
  const formattedData = {
    ...payload,

    StartDate: getUTCMidnight(startDateRaw, timezone),
    endDate: getUTCMidnight(endDateRaw, timezone),

    holidays: payload.holidays.map((h) => ({
      ...h,
      holidayDate: getUTCMidnight(h.holidayDate, timezone),
    })),
  };
    return await holidayRepository.updateHolidayTemplate(id, formattedData);
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};
export const deleteHolidayTemplateService = async (id) => {
  try {
    return await holidayRepository.deleteHolidayTemplate(id);
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

export const getHolidayTemplatesByOrganizationService = async (
  organizationId,
  options,
) => {
  try {
    return await holidayRepository.findHolidayTemplatesByOrganization(
      organizationId,
      options,
    );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};
export const findUnassignedEmployeesToTemplate = async (req) => {
  const { templateId } = req.params;
  const { page = 1, limit = 10, search } = req.query;
  const { organizationId } = req.user;

  if (!templateId) {
    throw new ApiError(400, "Template ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(templateId)) {
    throw new ApiError(400, "Invalid template ID format");
  }

  if (!organizationId) {
    throw new ApiError(400, "Organization ID is required");
  }

  // verify template exists in organization
  const template = await holidayTemplate.findOne({
    _id: templateId,
    organizationId,
  });

  if (!template) {
    throw new ApiError(404, "Holiday template not found in this organization");
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    search,
  };

  return await holidayRepository.findUnassignedToTemplate(
    templateId,
    organizationId,
    options,
  );
};

export const findAssignedEmployeesToTemplate = async (req) => {
  const { templateId } = req.params;

  const { organizationId } = req.user;

  if (!templateId) {
    throw new ApiError(400, "Template ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(templateId)) {
    throw new ApiError(400, "Invalid template ID format");
  }

  if (!organizationId) {
    throw new ApiError(400, "Organization ID is required");
  }

  // verify template exists
  const template = await holidayTemplate.findOne({
    _id: templateId,
    organizationId,
  });

  if (!template) {
    throw new ApiError(404, "Holiday template not found in this organization");
  }

  return await holidayRepository.findAssignedToTemplate(
    templateId,
    organizationId,
  );
};

export const removeTemplateFromEmployees = async (req) => {
  const { templateId } = req.params;
  const { staffIds } = req.body;
  const { organizationId } = req.user;

  if (!templateId) {
    throw new ApiError(400, "Template ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(templateId)) {
    throw new ApiError(400, "Invalid template ID format");
  }

  if (!staffIds || !Array.isArray(staffIds) || staffIds.length === 0) {
    throw new ApiError(400, "Staff IDs array is required");
  }

  if (!organizationId) {
    throw new ApiError(400, "Organization ID is required");
  }

  // verify template exists
  const template = await holidayTemplate.findOne({
    _id: templateId,
    organizationId,
  });

  if (!template) {
    throw new ApiError(404, "Holiday template not found in this organization");
  }

  // validate staff belong to organization

  const result = await holidayRepository.removeTemplateFromEmployees(staffIds);

  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
};
