import { AttendanceOnWeeklyOffTemplate } from "../models/attendanceOnWeekOffTemplate.Model.js";
import mongoose from "mongoose";

const Employee = mongoose.model("Employee");

/**
 * Create Template
 */
export const createAttendanceTemplateRepo = async (data) => {
  return AttendanceOnWeeklyOffTemplate.create(data);
};

/**
 * Update Template
 */
export const updateAttendanceTemplateRepo = async (templateId, data) => {
  return AttendanceOnWeeklyOffTemplate.findByIdAndUpdate(templateId, data, {
    new: true,
    runValidators: true,
  });
};

/**
 * Delete Template
 */
export const deleteAttendanceTemplateRepo = async (templateId) => {
  return AttendanceOnWeeklyOffTemplate.findByIdAndDelete(templateId);
};

/**
 * Get All Templates (Organization wise)
 */
export const getAllAttendanceTemplatesRepo = async (organizationId) => {
  return AttendanceOnWeeklyOffTemplate.find({ organizationId });
};

/**
 * Get Template By Id
 */
export const getAttendanceTemplateByIdRepo = async (templateId) => {
  return AttendanceOnWeeklyOffTemplate.findById(templateId);
};

/**
 * Get employees by ids
 */
export const getEmployeesByIdsRepo = async (employeeIds) => {
  return Employee.find({
    _id: { $in: employeeIds },
  });
};

/**
 * Get employees by ids and organization
 */
export const getEmployeesByIdsAndOrgRepo = async (
  employeeIds,
  organizationId,
) => {
  return Employee.find({
    _id: { $in: employeeIds },
    organizationId,
  });
};

  export const findUnassignedToTemplate = async(templateId, organizationId, options = {}) => {
    try {
      const { page = 1, limit = 10, search = "" } = options;
      const skip = (page - 1) * limit;

      const query = {
        organizationId,
        $or: [
          { attendanceOnWeeklyOffTemplateId: { $exists: false } },
          { attendanceOnWeeklyOffTemplateId: null },
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
        attendanceOnWeeklyOffTemplateId: templateId,
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
  return Employee.updateMany(
    { _id: { $in: employeeIds } },
    {
      $set: {
        attendanceOnWeeklyOffTemplateId: templateId,
      },
    },
  );
};

/**
 * Remove template from employees
 */
export const removeTemplateFromEmployeesRepo = async (employeeIds) => {
  return Employee.updateMany(
    { _id: { $in: employeeIds } },
    {
      $set: {
        attendanceOnWeeklyOffTemplateId: null,
      },
    },
  );
};
