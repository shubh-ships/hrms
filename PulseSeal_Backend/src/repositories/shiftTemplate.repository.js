import mongoose from "mongoose";
import ShiftTemplate from "../models/ShiftTemplate.model.js";
import Employee from "../models/employee.Model.js";
import ApiError from "../utils/apiError.js";

class ShiftTemplateRepository {
  /**
   * Create a new shift template
   */
  async createShiftTemplate(data) {
    try {
      const shiftTemplate = await ShiftTemplate.create(data);
      return shiftTemplate;
    } catch (error) {
      if (error.code === 11000) {
        throw new ApiError(
          409,
          "A shift template with this shift code already exists",
        );
      }
      throw new ApiError(500, error.message);
    }
  }

  /**
   * Fetch all shift templates
   */
  async findAllShiftTemplates(query = {}) {
    try {
      const templates = await ShiftTemplate.find(query).lean();

      return templates;
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  /**
   * Fetch single shift template
   */
  async findShiftTemplateById(id) {
    try {
      const shiftTemplate = await ShiftTemplate.findById(id).lean();

      if (!shiftTemplate) {
        throw new ApiError(404, "Shift template not found");
      }

      return shiftTemplate;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }

  /**
   * Update shift template
   */
  async updateShiftTemplate(id, data) {
    try {
      const template = await ShiftTemplate.findById(id);

      if (!template) {
        throw new ApiError(404, "Shift template not found");
      }

      Object.assign(template, data);
      template.updatedAt = new Date();

      await template.save(); // ✅ full validation works here

      return template;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }

  /**
   * Delete shift template
   */
  async deleteShiftTemplate(id) {
    try {
      const deleted = await ShiftTemplate.findByIdAndDelete(id).lean();

      if (!deleted) {
        throw new ApiError(404, "Shift template not found");
      }

      return deleted;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }

  /**
   * Find shift by shiftCode
   */
  async findShiftByCode(shiftCode, excludeId = null) {
    try {
      const query = { shiftCode: shiftCode.toUpperCase() };

      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      return await ShiftTemplate.findOne(query).lean();
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
          { shiftTemplateId: { $exists: false } },
          { shiftTemplateId: null },
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
        shiftTemplateId: templateId,
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
   * Assign employees to shift template
   */
  async assignEmployeesToShift(shiftTemplateId, employeeIds) {
    try {
      const objectIds = employeeIds.map(
        (id) => new mongoose.Types.ObjectId(id),
      );
      // Set ShiftTemplateId for employees
      const updatedEmployees = await Employee.updateMany(
        { _id: { $in: objectIds } },
        { $set: { shiftTemplateId: shiftTemplateId } },
      );

      const employees = await Employee.find({
        _id: { $in: objectIds },
      })
        .populate("shiftTemplateId")
        .lean();

      return {
        message: "Employees assigned successfully",
        modifiedCount: updatedEmployees.modifiedCount,
        employees,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }

  /**
   * Remove employees from shift
   */
  async removeEmployeesFromShift(shiftTemplateId, employeeIds) {
    try {
      const objectIds = employeeIds.map(
        (id) => new mongoose.Types.ObjectId(id),
      );

      const updatedEmployees = await Employee.updateMany(
        { _id: { $in: objectIds }, shiftTemplateId: shiftTemplateId },
        { $set: { shiftTemplateId: null } },
      );

      const employees = await Employee.find({
        _id: { $in: objectIds },
      })
        .populate("shiftTemplateId")
        .lean();

      return {
        message: "Employees removed from shift successfully",
        modifiedCount: updatedEmployees.modifiedCount,
        employees,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }
}

export default new ShiftTemplateRepository();
