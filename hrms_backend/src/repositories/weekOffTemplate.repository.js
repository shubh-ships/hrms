// repositories/weeklyOffTemplate.repository.js
import { WeeklyOffTemplate } from "../models/weekOffTemplate.Model.js";
import Employee from "../models/employee.Model.js";
import ApiError from "../utils/apiError.js";

class WeeklyOffTemplateRepository {
  async create(data) {
    try {
      const weeklyOffTemplate = await WeeklyOffTemplate.create(data);
      return weeklyOffTemplate;
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async findAll(query = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
      const skip = (page - 1) * limit;

      const weeklyOffTemplates = await WeeklyOffTemplate.find(query)
        .populate("creator", "name email")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await WeeklyOffTemplate.countDocuments(query);

      return {
        data: weeklyOffTemplates,
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

  async findById(id) {
    try {
      const weeklyOffTemplate = await WeeklyOffTemplate.findById(id)
        .populate("creator", "name email")
        .lean();

      if (!weeklyOffTemplate) {
        throw new ApiError(404, "Weekly off template not found");
      }
      return weeklyOffTemplate;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }

  async findOne(query) {
    try {
      return await WeeklyOffTemplate.findOne(query)
        .populate("creator", "name email")
        .lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async update(id, data) {
    try {
      const weeklyOffTemplate = await WeeklyOffTemplate.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true },
      )
        .populate("creator", "name email")
        .lean();

      if (!weeklyOffTemplate) {
        throw new ApiError(404, "Weekly off template not found");
      }
      return weeklyOffTemplate;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }

  async delete(id) {
    try {
      const weeklyOffTemplate =
        await WeeklyOffTemplate.findByIdAndDelete(id).lean();
      if (!weeklyOffTemplate) {
        throw new ApiError(404, "Weekly off template not found");
      }
      return weeklyOffTemplate;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }

  async findByOrganization(organizationId, options = {}) {
    try {
      return await this.findAll({ organizationId }, options);
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async findByNameAndOrganization(name, organizationId, excludeId = null) {
    try {
      const query = { name, organizationId };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }
      return await WeeklyOffTemplate.findOne(query).lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async findUnassignedToTemplate(templateId, organizationId, options = {}) {
    try {
      const { page = 1, limit = 10, search = "" } = options;
      const skip = (page - 1) * limit;

      const query = {
        organizationId,
        $or: [
          { weeklyOffTemplateId: { $exists: false } },
          { weeklyOffTemplateId: null },
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

  async findAssignedToTemplate(templateId, organizationId, options = {}) {
    try {
      const { page = 1, limit = 10, search = "" } = options;
      const skip = (page - 1) * limit;

      const query = {
        organizationId,
        weeklyOffTemplateId: templateId,
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

  async assignTemplateToEmployees(templateId, staffIds) {
    try {
      const result = await Employee.updateMany(
        { _id: { $in: staffIds } },
        { $set: { weeklyOffTemplateId: templateId } },
      );
      return result;
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async removeTemplateFromEmployees(staffIds) {
    try {
      const result = await Employee.updateMany(
        { _id: { $in: staffIds } },
        { $set: { weeklyOffTemplateId: null } },
      );
      return result;
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async validateStaffIds(staffIds, organizationId) {
    try {
      const employees = await Employee.find({
        _id: { $in: staffIds },
        organizationId,
      })
        .select("_id")
        .lean();

      if (employees.length !== staffIds.length) {
        const foundIds = employees.map((e) => e._id.toString());
        const invalidIds = staffIds.filter(
          (id) => !foundIds.includes(id.toString()),
        );
        throw new ApiError(400, `Invalid staff IDs: ${invalidIds.join(", ")}`);
      }
      return true;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }
}

export default new WeeklyOffTemplateRepository();
