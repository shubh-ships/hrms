import Employee from "../models/employee.Model.js";
import { LeaveTemplate } from "../models/leaveTemplate.Model.js";
import ApiError from "../utils/apiError.js";
import { StaffLeaveBalance } from "../models/leaveBalance.Model.js";

class LeaveTemplateRepository {
  async create(data) {
    try {
      const leaveTemplate = await LeaveTemplate.create(data);
      return leaveTemplate;
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async findAll(query = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
      const skip = (page - 1) * limit;

      const leaveTemplates = await LeaveTemplate.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await LeaveTemplate.countDocuments(query);

      return {
        data: leaveTemplates,
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
      const leaveTemplate = await LeaveTemplate.findById(id).lean();
      if (!leaveTemplate) {
        throw new ApiError(404, "Leave template not found");
      }
      return leaveTemplate;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }

  async findOne(query) {
    try {
      return await LeaveTemplate.findOne(query).lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async update(id, data) {
    try {
      const leaveTemplate = await LeaveTemplate.findByIdAndUpdate(
        id,
        { ...data, updatedAt: Date.now() },
        { new: true, runValidators: true },
      ).lean();

      if (!leaveTemplate) {
        throw new ApiError(404, "Leave template not found");
      }
      return leaveTemplate;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }

  async delete(id) {
    try {
      const leaveTemplate = await LeaveTemplate.findByIdAndDelete(id).lean();
      if (!leaveTemplate) {
        throw new ApiError(404, "Leave template not found");
      }
      return leaveTemplate;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }

  async softDelete(id) {
    try {
      const leaveTemplate = await LeaveTemplate.findByIdAndUpdate(
        id,
        { status: "INACTIVE", updatedAt: Date.now() },
        { new: true },
      ).lean();

      if (!leaveTemplate) {
        throw new ApiError(404, "Leave template not found");
      }
      return leaveTemplate;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }

  async findByOrganization(organizationId, options = {}) {
    try {
      return await this.findAll({ organizationId, status: "ACTIVE" }, options);
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
          { leaveTemplateId: { $exists: false } },
          { leaveTemplateId: null },
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
        leaveTemplateId: templateId,
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
        { $set: { leaveTemplateId: templateId } },
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
        { $set: { leaveTemplateId: null } },
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
  async getLeaveBalancesByTemplate(templateId) {
    return StaffLeaveBalance.find({
      leaveTemplateId: templateId,
    });
  }

  // UPDATE LEAVE CATEGORIES
  async updateLeaveCategories(balanceId, updatedCategories) {
    return StaffLeaveBalance.updateOne(
      { _id: balanceId },
      {
        leaveCategories: updatedCategories,
        updatedAt: new Date(),
      },
    );
  }

  // GET EXISTING BALANCES FOR EMPLOYEES
  async getExistingBalancesByEmployeeIds(staffIds) {
    return StaffLeaveBalance.find({
      employeeId: { $in: staffIds },
    });
  }

  // CREATE NEW LEAVE BALANCE
  async createLeaveBalance(data) {
    return StaffLeaveBalance.create(data);
  }

  // UPDATE EMPLOYEE LEAVE BALANCE
  async updateEmployeeLeaveBalance(employeeId, templateId, updatedCategories) {
    return StaffLeaveBalance.updateOne(
      { employeeId },
      {
        leaveTemplateId: templateId,
        leaveCategories: updatedCategories,
        updatedAt: new Date(),
      },
    );
  }

  // CLEAR LEAVE BALANCE WHEN TEMPLATE REMOVED
  async clearLeaveBalanceForEmployees(staffIds) {
    return StaffLeaveBalance.updateMany(
      { employeeId: { $in: staffIds } },
      {
        $set: {
          leaveTemplateId: null,
          leaveCategories: [],
          totalAvailedLeaves: 0,
          totalBalancedLeaves: 0,
          updatedAt: new Date(),
        },
      },
    );
  }
}

export default new LeaveTemplateRepository();
