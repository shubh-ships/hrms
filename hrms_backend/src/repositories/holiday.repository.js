import { Holiday, holidayTemplate } from "../models/holidays.Model.js";
import Employee from "../models/employee.Model.js";
import mongoose from "mongoose";
import ApiError from "../utils/apiError.js";

export const createHoliday = async (holidayData, organizationId) => {
  try {
    if (Array.isArray(holidayData)) {
      const holidays = holidayData.map((h) => ({
        ...h,
        organizationId,
      }));
      return await Holiday.insertMany(holidays);
    }
    return await Holiday.create({
      ...holidayData,
      organizationId,
    });
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};
export const findAllHolidaytemplate = async (query = {}) => {
  try {
    console.log(query);
    const templates = await holidayTemplate.find({ organizationId: query });
    console.log(templates);

    return templates;
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};
export const getHolidaysByOrgId = async (organizationId) => {
  const holidays = await Holiday.find({ organizationId });
  return holidays;
};

export const updateHolidayById = async (id, data) => {
  const holiday = await Holiday.findByIdAndUpdate(id, data, { new: true });
  return holiday;
};

export const createTemplateRepo = async (data) => {
  return await holidayTemplate.create(data);
};

export const getTemplatesRepo = async (organizationId) => {
  return await holidayTemplate.find({ organizationId });
};

export const assignHolidayTemplateRepo = async (
  employeeIds,
  templateId,
  organizationId,
) => {
  const objectEmployeeIds = employeeIds.map(
    (id) => new mongoose.Types.ObjectId(id),
  );

  const templateObjectId = new mongoose.Types.ObjectId(templateId);
  return await Employee.updateMany(
    {
      _id: { $in: objectEmployeeIds },
      organizationId: new mongoose.Types.ObjectId(organizationId),
    },
    { $set: { holidayTemplateId: templateObjectId } },
  );
};

export const updateHolidayTemplate = async (id, data) => {
  try {
    const template = await holidayTemplate
      .findByIdAndUpdate(id, data, { new: true, runValidators: true })

      .lean();

    if (!template) {
      throw new ApiError(404, "Holiday template not found");
    }

    return template;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error.message);
  }
};

export const deleteHolidayTemplate = async (id) => {
  try {
    const template = await holidayTemplate.findByIdAndDelete(id).lean();

    if (!template) {
      throw new ApiError(404, "Holiday template not found");
    }

    return template;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error.message);
  }
};

export const findHolidayTemplatesByOrganization = async (
  organizationId,
  options = {},
) => {
  try {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

    const skip = (page - 1) * limit;

    const templates = await holidayTemplate
      .find({ organizationId })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await holidayTemplate.countDocuments({ organizationId });

    return {
      data: templates,
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
};
export const findUnassignedToTemplate = async (
  templateId,
  organizationId,
  options = {},
) => {
  try {
    const { page = 1, limit = 10, search = "" } = options;
    const skip = (page - 1) * limit;

    const query = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      holidayTemplateId: { $ne: new mongoose.Types.ObjectId(templateId) },
    };
    if (search) {
      query.$or = [
        { "personal.firstName": { $regex: search, $options: "i" } },
        { "personal.email": { $regex: search, $options: "i" } },
        { "employment.employeeCode": { $regex: search, $options: "i" } },
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
};

export const findAssignedToTemplate = async (templateId, organizationId) => {
  try {
    const query = {
      organizationId,
      holidayTemplateId: templateId,
    };

    const employees = await Employee.find(query)
      .select(
        "personal.firstName personal.lastName personal.email employment.employeeCode",
      )
      .sort({ createdAt: -1 })
      .lean();

    const formattedEmployees = employees.map((emp) => ({
      _id: emp._id,
      name: `${emp.personal.firstName} ${emp.personal.lastName || ""}`.trim(),
      email: emp.personal.email,
      employeeCode: emp.employment.employeeCode,
    }));

    return {
      data: formattedEmployees,
      total: formattedEmployees.length,
    };
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};
export const removeTemplateFromEmployees = async (staffIds) => {
  try {
    const ids = staffIds.map((id) => new mongoose.Types.ObjectId(id));
    const result = await Employee.updateMany(
      { _id: { $in: ids } },
      { $set: { holidayTemplateId: null } },
    );

    return result;
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

export const getHolidayTemplateByIdRepo = async (id) => {
  try {
    const template = await holidayTemplate.findById(id).lean();

    if (!template) {
      throw new ApiError(404, "Holiday template not found");
    }
    return template;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error.message);
  }
};
