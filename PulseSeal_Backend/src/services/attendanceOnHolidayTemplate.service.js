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
} from "../repositories/attendanceOnHolidayTemplate.repository.js";
import mongoose from "mongoose";
const validateAndPrepareCompensationData = (
  data,
  existingTemplate = null,
  isCreate = false,
) => {

  // If no data to process, return empty object
  if (!data || typeof data !== "object") {
    console.log("4. No valid data to process");
    return {};
  }

  // For CREATE operations, we need the type from data
  // For UPDATE operations, use new type if provided, otherwise use existing
  let targetType;
  if (isCreate) {
    targetType = data.attendanceOnHolidayType;

  } else {
    targetType =
      data.attendanceOnHolidayType || existingTemplate?.attendanceOnHolidayType;


  }

  // If we don't have a target type, return data as is
  if (!targetType) {

    return data;
  }



  // Handle different scenarios based on the target type
  switch (targetType) {
    case "REGULAR_PAYABLE_DAY":

      data.compensationType = "SALARY_MULTIPLIER";
      data.compensationValue = 1;

      break;

    case "COMP_OFF":

      data.compensationType = null;
      data.compensationValue = null;

      break;

    case "OVERTIME":

      // For CREATE: both fields are required
      if (isCreate) {

        if (!data.compensationType) {

          throw new Error("Compensation type is required for overtime");
        }
        if (!data.compensationValue) {

          throw new Error("Compensation value is required for overtime");
        }
      }
      // For UPDATE: check if fields are provided or exist in template
      else {


        // If compensationType is not provided in update, keep existing


        // If compensationValue is not provided in update, keep existing

        // Validate that we have compensation type either from update or existing
        if (
          data.compensationType === undefined &&
          !existingTemplate?.compensationType
        ) {

          throw new Error("Compensation type is required for overtime");
        }

        // Validate that we have compensation value either from update or existing
        if (
          data.compensationValue === undefined &&
          !existingTemplate?.compensationValue
        ) {

          throw new Error("Compensation value is required for overtime");
        }
      }

      // Validate compensation type if provided in update
      if (
        data.compensationType &&
        !["SALARY_MULTIPLIER", "FIXED_AMOUNT"].includes(data.compensationType)
      ) {

        throw new Error(
          "Compensation type must be either SALARY_MULTIPLIER or FIXED_AMOUNT",
        );
      }


      break;

    default:

      break;
  }

  console.log("9. Final data after validation:", JSON.stringify(data, null, 2));
  console.log("========== VALIDATION FUNCTION END ==========");
  return data;
};

export const createAttendanceTemplateService = async (req) => {
  try {
    console.log("\n========== CREATE SERVICE START ==========");

    if (!req) {
      throw new Error("Request object is required");
    }

    if (!req.user) {
      throw new Error("User not authenticated");
    }

    const { organizationId } = req.user;
    const data = req.body || {};

    console.log("1. Create service - organizationId:", organizationId);
    console.log("2. Create service - data:", JSON.stringify(data, null, 2));
    console.log("3. Create service - userId:", req.user.id);

    if (!organizationId) {
      throw new Error("OrganizationId is required");
    }

    if (!data.name) {
      throw new Error("Template name is required");
    }

    if (!data.attendanceOnHolidayType) {
      throw new Error("attendanceOnHolidayType is required");
    }

    // Validate attendanceOnHolidayType enum values
    const validTypes = ["REGULAR_PAYABLE_DAY", "OVERTIME", "COMP_OFF"];
    if (!validTypes.includes(data.attendanceOnHolidayType)) {
      throw new Error("Invalid attendanceOnHolidayType");
    }

    console.log("4. Calling validation function for CREATE...");
    validateAndPrepareCompensationData(data, null, true);

    data.organizationId = organizationId;
    data.creator = req.user.id;

    console.log("5. Final data for repository:", JSON.stringify(data, null, 2));
    console.log("6. Calling repository to create template...");

    const template = await createAttendanceTemplateRepo(data);

    console.log(
      "7. Template created successfully:",
      JSON.stringify(template, null, 2),
    );
    console.log("========== CREATE SERVICE END ==========\n");

    return template;
  } catch (error) {
    console.error("Create service error:", error);
    throw error;
  }
};

export const updateAttendanceTemplateService = async (req) => {
  try {
    console.log("\n========== UPDATE SERVICE START ==========");

    if (!req) {
      throw new Error("Request object is required");
    }

    const { templateId } = req.params || {};
    const data = req.body || {};

    console.log("1. Update request for template ID:", templateId);
    console.log("2. Request params:", req.params);
    console.log("3. Request body:", JSON.stringify(data, null, 2));
    console.log("4. Request user:", req.user?.id);

    if (!templateId) {
      throw new Error("Template ID is required");
    }

    console.log("5. Fetching existing template from repository...");
    const existingTemplate = await getAttendanceTemplateByIdRepo(templateId);

    if (!existingTemplate) {
      throw new Error("Attendance holiday template not found");
    }

    console.log(
      "6. Existing template found:",
      JSON.stringify(existingTemplate, null, 2),
    );

    // Create update object with only provided fields
    const updateData = {};

    // Only include fields that are provided in the request
    if (data.name !== undefined) {
      updateData.name = data.name;
      console.log("   - Including name in update:", data.name);
    }

    if (data.attendanceOnHolidayType !== undefined) {
      updateData.attendanceOnHolidayType = data.attendanceOnHolidayType;
      console.log(
        "   - Including attendanceOnHolidayType in update:",
        data.attendanceOnHolidayType,
      );
    }

    if (data.compensationType !== undefined) {
      updateData.compensationType = data.compensationType;
      console.log(
        "   - Including compensationType in update:",
        data.compensationType,
      );
    }

    if (data.compensationValue !== undefined) {
      updateData.compensationValue = data.compensationValue;
      console.log(
        "   - Including compensationValue in update:",
        data.compensationValue,
      );
    }

    if (data.disableAutomationRules !== undefined) {
      updateData.disableAutomationRules = data.disableAutomationRules;
      console.log(
        "   - Including disableAutomationRules in update:",
        data.disableAutomationRules,
      );
    }

    console.log(
      "7. Update data before validation:",
      JSON.stringify(updateData, null, 2),
    );

    // Validate and prepare the update data based on the target type
    if (Object.keys(updateData).length > 0) {
      console.log("8. Calling validation function for UPDATE...");
      validateAndPrepareCompensationData(updateData, existingTemplate, false);
    } else {
      console.log("8. No fields to update");
      throw new Error("No fields provided for update");
    }

    console.log(
      "9. Final update data after validation:",
      JSON.stringify(updateData, null, 2),
    );

    console.log("10. Performing database update...");
    const updatedTemplate = await updateAttendanceTemplateRepo(
      templateId,
      updateData,
    );

    console.log(
      "11. Updated template from DB:",
      JSON.stringify(updatedTemplate, null, 2),
    );
    console.log("========== UPDATE SERVICE END ==========\n");

    return updatedTemplate;
  } catch (error) {
    console.error("Update service error:", error);
    throw error;
  }
};

export const deleteAttendanceTemplateService = async (req) => {
  try {
    console.log("\n========== DELETE SERVICE START ==========");

    if (!req || !req.params) {
      throw new Error("Invalid request");
    }

    const { templateId } = req.params;

    console.log("1. Delete request for template ID:", templateId);

    if (!templateId) {
      throw new Error("Template ID is required");
    }

    console.log("2. Fetching template to verify existence...");
    const template = await getAttendanceTemplateByIdRepo(templateId);

    if (!template) {
      throw new Error("Template not found");
    }

    console.log("3. Template found, proceeding with deletion");
    console.log("4. Calling repository to delete template...");

    await deleteAttendanceTemplateRepo(templateId);

    console.log("5. Template deleted successfully");
    console.log("========== DELETE SERVICE END ==========\n");

    return { message: "Template deleted successfully" };
  } catch (error) {
    console.error("Delete service error:", error);
    throw error;
  }
};

export const getAllAttendanceTemplatesService = async (req) => {
  try {
    console.log("\n========== GET ALL SERVICE START ==========");

    if (!req || !req.user) {
      throw new Error("User not authenticated");
    }

    const { organizationId } = req.user;

    console.log("1. Get all templates for organization:", organizationId);

    if (!organizationId) {
      throw new Error("OrganizationId is required");
    }

    console.log("2. Calling repository to fetch templates...");
    const templates = await getAllAttendanceTemplatesRepo(organizationId);

    console.log(`3. Found ${templates.length} templates`);
    console.log("========== GET ALL SERVICE END ==========\n");

    return templates;
  } catch (error) {
    console.error("Get all service error:", error);
    throw error;
  }
};

export const getAttendanceTemplateByIdService = async (req) => {
  try {
    console.log("\n========== GET BY ID SERVICE START ==========");

    if (!req || !req.params) {
      throw new Error("Invalid request");
    }

    const { templateId } = req.params;

    console.log("1. Get template by ID:", templateId);

    if (!templateId) {
      throw new Error("Template ID is required");
    }

    console.log("2. Calling repository to fetch template...");
    const template = await getAttendanceTemplateByIdRepo(templateId);

    if (!template) {
      throw new Error("Template not found");
    }

    console.log("3. Template found:", JSON.stringify(template, null, 2));
    console.log("========== GET BY ID SERVICE END ==========\n");

    return template;
  } catch (error) {
    console.error("Get by ID service error:", error);
    throw error;
  }
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
      throw new ApiError(404, "Shift template not found in this organization");
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
  try {
    console.log("\n========== ASSIGN SERVICE START ==========");

    if (!req || !req.body) {
      throw new Error("Invalid request");
    }

    const { employeeIds, templateId } = req.body;

    console.log("1. Assign template:", templateId);
    console.log("2. To employees:", employeeIds);
    console.log(
      "3. Employee IDs type:",
      Array.isArray(employeeIds) ? "array" : typeof employeeIds,
    );
    console.log("4. Employee IDs length:", employeeIds?.length);

    if (!employeeIds || employeeIds.length === 0) {
      throw new Error("employeeIds are required");
    }

    if (!templateId) {
      throw new Error("templateId is required");
    }

    // Validate that employeeIds is an array
    if (!Array.isArray(employeeIds)) {
      throw new Error("employeeIds must be an array");
    }

    // Validate templateId format before passing to repository
    if (
      typeof templateId === "string" &&
      !mongoose.Types.ObjectId.isValid(templateId)
    ) {
      throw new Error("Invalid template ID format");
    }

    console.log("5. Verifying template exists...");

    // Try to find template and handle any cast errors
    let template;
    try {
      template = await getAttendanceTemplateByIdRepo(templateId);
    } catch (error) {
      console.log("Error fetching template:", error.message);
      if (
        error.name === "CastError" ||
        error.message.includes("Cast to ObjectId")
      ) {
        throw new Error("Template not found");
      }
      throw error;
    }

    if (!template) {
      throw new Error("Template not found");
    }

    console.log("6. Template found, verifying employees exist...");

    // Validate employee IDs format
    for (const id of employeeIds) {
      if (typeof id === "string" && !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid employee ID format: ${id}`);
      }
    }

    const employees = await getEmployeesByIdsRepo(employeeIds);

    console.log(
      `7. Found ${employees.length} out of ${employeeIds.length} employees`,
    );

    if (employees.length !== employeeIds.length) {
      // Find which employees weren't found
      const foundIds = employees.map((emp) => emp._id.toString());
      const notFoundIds = employeeIds.filter(
        (id) => !foundIds.includes(id.toString()),
      );
      console.log("8. Employees not found:", notFoundIds);
      throw new Error(`Some employees not found: ${notFoundIds.join(", ")}`);
    }

    console.log(
      `9. Found all ${employees.length} employees, proceeding with assignment...`,
    );
    const result = await assignTemplateToEmployeesRepo(employeeIds, templateId);

    console.log("10. Assignment result:", result);
    console.log("========== ASSIGN SERVICE END ==========\n");

    return result;
  } catch (error) {
    console.error("Assign service error:", error);
    // Re-throw the error with a clean message if it's a cast error
    if (
      error.name === "CastError" ||
      error.message.includes("Cast to ObjectId")
    ) {
      throw new Error("Template not found");
    }
    throw error;
  }
};

export const removeTemplateFromEmployeesService = async (req) => {
  try {
    console.log("\n========== REMOVE SERVICE START ==========");

    if (!req || !req.body || !req.user) {
      throw new Error("Invalid request");
    }

    const { employeeIds } = req.body;
    const { organizationId } = req.user;

    console.log("1. Remove template from employees:", employeeIds);
    console.log("2. Organization:", organizationId);
    console.log(
      "3. Employee IDs type:",
      Array.isArray(employeeIds) ? "array" : typeof employeeIds,
    );
    console.log("4. Employee IDs length:", employeeIds?.length);

    if (!employeeIds || employeeIds.length === 0) {
      throw new Error("employeeIds are required");
    }

    // Validate that employeeIds is an array
    if (!Array.isArray(employeeIds)) {
      throw new Error("employeeIds must be an array");
    }

    console.log("5. Verifying employees exist in organization...");
    const employees = await getEmployeesByIdsAndOrgRepo(
      employeeIds,
      organizationId,
    );

    console.log(
      `6. Found ${employees.length} out of ${employeeIds.length} employees in organization`,
    );

    if (employees.length !== employeeIds.length) {
      // Find which employees weren't found
      const foundIds = employees.map((emp) => emp._id.toString());
      const notFoundIds = employeeIds.filter(
        (id) => !foundIds.includes(id.toString()),
      );
      console.log("7. Employees not found in organization:", notFoundIds);
      throw new Error(
        `Some employees not found in this organization: ${notFoundIds.join(", ")}`,
      );
    }

    console.log(
      `8. Found all ${employees.length} employees, proceeding with removal...`,
    );
    const result = await removeTemplateFromEmployeesRepo(employeeIds);

    console.log("9. Removal result:", result);
    console.log("========== REMOVE SERVICE END ==========\n");

    return {
      modifiedEmployees: result.modifiedCount,
    };
  } catch (error) {
    console.error("Remove service error:", error);
    throw error;
  }
};
