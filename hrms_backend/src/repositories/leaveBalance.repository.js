import { StaffLeaveBalance } from "../models/leaveBalance.Model.js";
import ApiError from "../utils/apiError.js";
import mongoose from "mongoose";

class LeaveBalanceRepository {
  async create(data) {
    try {
      const balance = await StaffLeaveBalance.create(data);
      return balance;
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async findOne(query) {
    try {
      return await StaffLeaveBalance.findOne(query)
        .populate("employeeId", "name email employeeCode")
        .populate("leaveTemplateId", "name cycleType")
        .lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async findByEmployee(employeeId, organizationId) {
    try {
      return await StaffLeaveBalance.findOne({
        employeeId,
        organizationId,
      })
        .populate("employeeId", "name email employeeCode")
        .populate("leaveTemplateId", "name cycleType startDate endDate")
        .lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async update(employeeId, organizationId, updateData) {
    try {
      const balance = await StaffLeaveBalance.findOneAndUpdate(
        { employeeId, organizationId },
        { ...updateData, updatedAt: Date.now() },
        { new: true, runValidators: true },
      )
        .populate("employeeId", "name email employeeCode")
        .populate("leaveTemplateId", "name cycleType")
        .lean();

      if (!balance) {
        throw new ApiError(404, "Leave balance not found");
      }
      return balance;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }

  async upsert(employeeId, organizationId, data) {
    try {
      const balance = await StaffLeaveBalance.findOneAndUpdate(
        { employeeId, organizationId },
        { ...data, updatedAt: Date.now() },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        },
      )
        .populate("employeeId", "name email employeeCode")
        .populate("leaveTemplateId", "name cycleType")
        .lean();
      return balance;
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async updateCategoryBalance(
    employeeId,
    organizationId,
    categoryId,
    updateFields,
  ) {
    try {
      const balance = await StaffLeaveBalance.findOneAndUpdate(
        {
          employeeId,
          organizationId,
          "leaveCategories.categoryId": categoryId,
        },
        {
          $set: Object.keys(updateFields).reduce((acc, key) => {
            acc[`leaveCategories.$.${key}`] = updateFields[key];
            return acc;
          }, {}),
          updatedAt: Date.now(),
        },
        { new: true },
      )
        .populate("employeeId", "name email employeeCode")
        .lean();

      if (!balance) {
        throw new ApiError(404, "Leave balance or category not found");
      }
      return balance;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }

  async deleteOne({ organizationId, employeeId }) {
    try {
      return await StaffLeaveBalance.deleteOne({
        employeeId,
        organizationId,
      });
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async deleteLeaveBalancesBulk(organizationId, employeeIds) {
    try {
      await StaffLeaveBalance.deleteMany({
        organizationId,
        employeeId: { $in: employeeIds },
      });
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }
}

export default new LeaveBalanceRepository();
