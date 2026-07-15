import { AttendanceOnHolidayTemplate } from "../models/attendanceOnHolidayTemplate.js";
import mongoose from "mongoose";

const Employee = mongoose.model("Employee");

/**
 * Create Template
 */
export const createAttendanceTemplateRepo = async (data) => {
  try {
    const template = await AttendanceOnHolidayTemplate.create(data);
    return template;
  } catch (error) {
    console.error("Repository create error:", error);
    throw error;
  }
};

/**
 * Update Template
 */
export const updateAttendanceTemplateRepo = async (templateId, data) => {
  console.log("\n========== REPOSITORY UPDATE ==========");
  console.log("1. Template ID:", templateId);
  console.log("2. Update data:", JSON.stringify(data, null, 2));

  try {
    // Convert templateId to ObjectId if it's a string
    const templateObjectId =
      typeof templateId === "string" &&
      mongoose.Types.ObjectId.isValid(templateId)
        ? new mongoose.Types.ObjectId(templateId)
        : templateId;

    console.log("3. Converted template ObjectId:", templateObjectId);

    const updated = await AttendanceOnHolidayTemplate.findByIdAndUpdate(
      templateObjectId,
      data,
      {
        new: true,
        runValidators: true,
      },
    );

    console.log(
      "4. Repository update result:",
      JSON.stringify(updated, null, 2),
    );
    console.log("========== REPOSITORY UPDATE END ==========\n");

    return updated;
  } catch (error) {
    console.error("Repository update error:", error);
    throw error;
  }
};

/**
 * Delete Template
 */
export const deleteAttendanceTemplateRepo = async (templateId) => {
  console.log("\n========== REPOSITORY DELETE ==========");
  console.log("1. Template ID:", templateId);

  try {
    // Convert templateId to ObjectId if it's a string
    const templateObjectId =
      typeof templateId === "string" &&
      mongoose.Types.ObjectId.isValid(templateId)
        ? new mongoose.Types.ObjectId(templateId)
        : templateId;

    console.log("2. Converted template ObjectId:", templateObjectId);

    const result =
      await AttendanceOnHolidayTemplate.findByIdAndDelete(templateObjectId);
    console.log(
      "3. Delete result:",
      result ? "Template deleted" : "Template not found",
    );
    console.log("========== REPOSITORY DELETE END ==========\n");
    return result;
  } catch (error) {
    console.error("Repository delete error:", error);
    throw error;
  }
};

/**
 * Get All Templates (Organization wise)
 */
export const getAllAttendanceTemplatesRepo = async (organizationId) => {
  console.log("\n========== REPOSITORY GET ALL ==========");
  console.log("1. Organization ID:", organizationId);

  try {
    // Convert organizationId to ObjectId if it's a string
    const orgObjectId =
      typeof organizationId === "string" &&
      mongoose.Types.ObjectId.isValid(organizationId)
        ? new mongoose.Types.ObjectId(organizationId)
        : organizationId;

    console.log("2. Converted organization ObjectId:", orgObjectId);

    const templates = await AttendanceOnHolidayTemplate.find({
      organizationId: orgObjectId,
    });
    console.log(`3. Found ${templates.length} templates`);
    console.log("========== REPOSITORY GET ALL END ==========\n");
    return templates;
  } catch (error) {
    console.error("Repository get all error:", error);
    throw error;
  }
};

/**
 * Get Template By Id
 */
/**
 * Get Template By Id
 */
export const getAttendanceTemplateByIdRepo = async (templateId) => {
  console.log("\n========== REPOSITORY GET BY ID ==========");
  console.log("1. Template ID:", templateId);

  try {
    if (!templateId) {
      throw new Error("Template ID is required");
    }

    // First validate if it's a valid ObjectId format
    if (
      typeof templateId === "string" &&
      !mongoose.Types.ObjectId.isValid(templateId)
    ) {
      console.log("2. Invalid ObjectId format");
      return null; // Return null instead of throwing cast error
    }

    // Convert templateId to ObjectId if it's a string
    const templateObjectId =
      typeof templateId === "string" &&
      mongoose.Types.ObjectId.isValid(templateId)
        ? new mongoose.Types.ObjectId(templateId)
        : templateId;

    console.log("2. Converted template ObjectId:", templateObjectId);

    const template =
      await AttendanceOnHolidayTemplate.findById(templateObjectId);
    console.log(
      "3. Repository - Found template:",
      JSON.stringify(template, null, 2),
    );
    console.log("========== REPOSITORY GET BY ID END ==========\n");
    return template;
  } catch (error) {
    console.error("Repository get by ID error:", error);
    // Don't throw CastError, return null for invalid IDs
    if (
      error.name === "CastError" ||
      error.message.includes("Cast to ObjectId")
    ) {
      console.log("Cast error caught, returning null");
      return null;
    }
    throw error;
  }
};

/**
 * Get employees by ids
 */
export const getEmployeesByIdsRepo = async (employeeIds) => {
  console.log("\n========== REPOSITORY GET EMPLOYEES BY IDS ==========");
  console.log("1. Employee IDs (raw):", employeeIds);

  try {
    // Convert string IDs to ObjectIds if they're strings
    const objectIds = employeeIds.map((id) => {
      if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
        return new mongoose.Types.ObjectId(id);
      }
      return id;
    });

    console.log("2. Converted to ObjectIds:", objectIds);

    const employees = await Employee.find({
      _id: { $in: objectIds },
    });

    console.log(`3. Found ${employees.length} employees`);
    console.log(
      "4. Employee details:",
      employees.map((e) => ({ id: e._id, name: e.name })),
    );
    console.log("========== REPOSITORY GET EMPLOYEES BY IDS END ==========\n");
    return employees;
  } catch (error) {
    console.error("Repository get employees error:", error);
    throw error;
  }
};

/**
 * Get employees by ids and organization
 */
export const getEmployeesByIdsAndOrgRepo = async (
  employeeIds,
  organizationId,
) => {
  console.log(
    "\n========== REPOSITORY GET EMPLOYEES BY IDS AND ORG ==========",
  );
  console.log("1. Employee IDs (raw):", employeeIds);
  console.log("2. Organization ID:", organizationId);

  try {
    // Convert string IDs to ObjectIds if they're strings
    const objectIds = employeeIds.map((id) => {
      if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
        return new mongoose.Types.ObjectId(id);
      }
      return id;
    });

    // Convert organizationId to ObjectId if it's a string
    const orgObjectId =
      typeof organizationId === "string" &&
      mongoose.Types.ObjectId.isValid(organizationId)
        ? new mongoose.Types.ObjectId(organizationId)
        : organizationId;

    console.log("3. Converted employee ObjectIds:", objectIds);
    console.log("4. Converted organization ObjectId:", orgObjectId);

    const employees = await Employee.find({
      _id: { $in: objectIds },
      organizationId: orgObjectId,
    });

    console.log(`5. Found ${employees.length} employees in organization`);
    console.log(
      "6. Employee details:",
      employees.map((e) => ({
        id: e._id,
        name: e.name,
        org: e.organizationId,
      })),
    );
    console.log(
      "========== REPOSITORY GET EMPLOYEES BY IDS AND ORG END ==========\n",
    );
    return employees;
  } catch (error) {
    console.error("Repository get employees by org error:", error);
    throw error;
  }
};

  export const findUnassignedToTemplate = async(templateId, organizationId, options = {}) => {
    try {
      const { page = 1, limit = 10, search = "" } = options;
      const skip = (page - 1) * limit;

      const query = {
        organizationId,
        $or: [
          { attendanceOnHolidayTemplateId: { $exists: false } },
          { attendanceOnHolidayTemplateId: null },
        ],
      };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { employeeCode: { $regex: search, $options: "i" } },
        ];
      }
      const employees = await Employee.find(query)
        .select(
          "personal.firstName personal.lastName personal.email employment.employeeCode",
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Employee.countDocuments(query);

      const formattedEmployees = employees.map((emp) => ({
        _id: emp._id,
        name: `${emp.personal.firstName} ${emp.personal.lastName || ""}`.trim(),
        email: emp.personal.email,
        employeeCode: emp.employment.employeeCode,
      }));

      return {
        data: formattedEmployees,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  export const findAssignedToTemplate = async(templateId, organizationId, options = {}) => {
    try {
      const { page = 1, limit = 10, search = "" } = options;
      const skip = (page - 1) * limit;

      const query = {
        organizationId,
        attendanceOnHolidayTemplateId: templateId,
      };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { employeeCode: { $regex: search, $options: "i" } },
        ];
      }

      const employees = await Employee.find(query)
        .select(
          "personal.firstName personal.lastName personal.email employment.employeeCode",
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Employee.countDocuments(query);

      const formattedEmployees = employees.map((emp) => ({
        _id: emp._id,
        name: `${emp.personal.firstName} ${emp.personal.lastName || ""}`.trim(),
        email: emp.personal.email,
        employeeCode: emp.employment.employeeCode,
      }));

      return {
        data: formattedEmployees,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

/**
 * Assign template to employees
 */
export const assignTemplateToEmployeesRepo = async (
  employeeIds,
  templateId,
) => {

  try {
    // Convert string IDs to ObjectIds if they're strings
    const objectIds = employeeIds.map((id) => {
      if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
        return new mongoose.Types.ObjectId(id);
      }
      return id;
    });

    // Also convert templateId to ObjectId if it's a string
    const templateObjectId =
      typeof templateId === "string" &&
      mongoose.Types.ObjectId.isValid(templateId)
        ? new mongoose.Types.ObjectId(templateId)
        : templateId;

    const result = await Employee.updateMany(
      { _id: { $in: objectIds } },
      {
        $set: {
          attendanceOnHolidayTemplateId: templateObjectId,
        },
      },
    );
    return result;
  } catch (error) {
    console.error("Repository assign template error:", error);
    throw error;
  }
};

/**
 * Remove template from employees
 */
export const removeTemplateFromEmployeesRepo = async (employeeIds) => {

  try {
    // Convert string IDs to ObjectIds if they're strings
    const objectIds = employeeIds.map((id) => {
      if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
        return new mongoose.Types.ObjectId(id);
      }
      return id;
    });

    const result = await Employee.updateMany(
      { _id: { $in: objectIds } },
      {
        $set: {
          attendanceOnHolidayTemplateId: null,
        },
      },
    );
    return result;
  } catch (error) {
    console.error("Repository remove template error:", error);
    throw error;
  }
};
