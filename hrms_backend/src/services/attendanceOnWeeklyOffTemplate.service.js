import {
  createAttendanceTemplateRepo,
  updateAttendanceTemplateRepo,
  deleteAttendanceTemplateRepo,
  getAllAttendanceTemplatesRepo,
  getAttendanceTemplateByIdRepo,
  assignTemplateToEmployeesRepo,
  removeTemplateFromEmployeesRepo,
  getEmployeesByIdsRepo,
  getEmployeesByIdsAndOrgRepo,
  findAssignedToTemplate,
  findUnassignedToTemplate
} from "../repositories/attendanceOnWeeklyOffTemplate.repository.js";
import mongoose from "mongoose";

const handleCompensationLogic = (data) => {
  if (data.attendanceOnWeekOffType === "REGULAR_PAYABLE_DAY") {
    data.compensationType = "SALARY_MULTIPLIER";
    data.compensationValue = 1;
  }

  if (data.attendanceOnWeekOffType === "COMP_OFF") {
    data.compensationType = null;
    data.compensationValue = null;
  }

  if (data.attendanceOnWeekOffType === "OVERTIME") {
    if (!data.compensationType) {
      throw new Error("Compensation type is required for overtime");
    }

    if (!data.compensationValue) {
      throw new Error("Compensation value is required for overtime");
    }
  }

  return data;
};

export const createAttendanceTemplateService = async (req) => {
  const { organizationId } = req.user;
  const data = req.body;

  if (!organizationId) {
    throw new Error("OrganizationId is required");
  }

  if (!data.name) {
    throw new Error("Template name is required");
  }

  if (!data.attendanceOnWeekOffType) {
    throw new Error("attendanceOnWeekOffType is required");
  }

  handleCompensationLogic(data);

  data.organizationId = organizationId;
  data.creator = req.user.id;

  const template = await createAttendanceTemplateRepo(data);

  return template;
};

export const updateAttendanceTemplateService = async (req) => {
  const { templateId } = req.params;
  const data = req.body;

  const existingTemplate = await getAttendanceTemplateByIdRepo(templateId);

  if (!existingTemplate) {
    throw new Error("Attendance weekly off template not found");
  }

  handleCompensationLogic(data);

  if (typeof data.disableAutomationRules === "undefined") {
    delete data.disableAutomationRules;
  }

  const updatedTemplate = await updateAttendanceTemplateRepo(templateId, data);

  return updatedTemplate;
};

export const deleteAttendanceTemplateService = async (req) => {
  const { templateId } = req.params;

  const template = await getAttendanceTemplateByIdRepo(templateId);

  if (!template) {
    throw new Error("Template not found");
  }

  await deleteAttendanceTemplateRepo(templateId);

  return { message: "Template deleted successfully" };
};

export const getAllAttendanceTemplatesService = async (req) => {
  const { organizationId } = req.user;

  if (!organizationId) {
    throw new Error("OrganizationId is required");
  }

  return getAllAttendanceTemplatesRepo(organizationId);
};

export const getAttendanceTemplateByIdService = async (req) => {
  const { templateId } = req.params;

  const template = await getAttendanceTemplateByIdRepo(templateId);

  if (!template) {
    throw new Error("Template not found");
  }

  return template;
};

export const getTemplateEmployees = async (req) => {
    const { templateId } = req.params;
    const { unassignedStaff, page = 1, limit = 10, search } = req.query;
    const { organizationId } = req.user; // assuming organizationId is passed in query or from user

    if (!templateId) {
      throw new ApiError(400, "Template ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      throw new ApiError(400, "Invalid template ID format");
    }
    if (!organizationId) {
      throw new ApiError(400, "Organization ID is required");
    }

    // Verify template exists and belongs to organization
    const template = await getAttendanceTemplateByIdRepo(templateId);
    if (!template) {
      throw new ApiError(404, "attendance on week off template not found in this organization");
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
    };

    if (unassignedStaff === "true") {
      // Get employees not assigned to this template
      return await findUnassignedToTemplate(
        templateId,
        organizationId,
        options,
      );
    } else {
      // Get employees assigned to this template
      return await findAssignedToTemplate(
        templateId,
        organizationId,
        options,
      );
    }
  }

export const assignTemplateToEmployeesService = async (req) => {
  const { employeeIds, templateId } = req.body;

  if (!employeeIds || employeeIds.length === 0) {
    throw new Error("employeeIds are required");
  }

  if (!templateId) {
    throw new Error("templateId is required");
  }

  const template = await getAttendanceTemplateByIdRepo(templateId);

  if (!template) {
    throw new Error("Template not found");
  }

  const employees = await getEmployeesByIdsRepo(employeeIds);

  if (employees.length !== employeeIds.length) {
    throw new Error("Some employees not found");
  }

  return assignTemplateToEmployeesRepo(employeeIds, templateId);
};

export const removeTemplateFromEmployeesService = async (req) => {
  const { employeeIds } = req.body;
  const { organizationId } = req.user;

  if (!employeeIds || employeeIds.length === 0) {
    throw new Error("employeeIds are required");
  }

  const employees = await getEmployeesByIdsAndOrgRepo(
    employeeIds,
    organizationId,
  );

  if (employees.length !== employeeIds.length) {
    throw new Error("Some employees not found in this organization");
  }

  const result = await removeTemplateFromEmployeesRepo(employeeIds);

  return {
    modifiedEmployees: result.modifiedCount,
  };
};
