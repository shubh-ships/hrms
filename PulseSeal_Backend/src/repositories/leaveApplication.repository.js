// repositories/leaveApplication.repository.js
import { LeaveApplication } from "../models/leaveApplication.Model.js";
import ApiError from "../utils/apiError.js";
import mongoose from "mongoose";

class LeaveApplicationRepository {
  async create(data) {
    try {
      const application = await LeaveApplication.create(data);
      return application;
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async findById(id) {
    try {
      const app = await LeaveApplication.findById(id)
        .populate("employeeId", "name email employeeCode")
        .populate("leaveTemplateId", "name cycleType")
        .populate("appliedBy", "name email")
        .populate("approvedBy", "name email")
        .lean();
      if (!app) {
        throw new ApiError(404, "Leave application not found");
      }
      return app;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }

  async findAll(query = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
      const skip = (page - 1) * limit;

      const applications = await LeaveApplication.find(query)
        .populate("employeeId", "name email employeeCode")
        .populate("leaveTemplateId", "name")
        .populate("appliedBy", "name email")
        .populate("approvedBy", "name email")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await LeaveApplication.countDocuments(query);

      return {
        data: applications,
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

  async findOne(query) {
    try {
      return await LeaveApplication.findOne(query).lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async update(id, data) {
    try {
      const app = await LeaveApplication.findByIdAndUpdate(
        id,
        { ...data, updatedAt: Date.now() },
        { new: true, runValidators: true },
      )
        .populate("employeeId", "name email employeeCode")
        .populate("leaveTemplateId", "name")
        .lean();

      if (!app) {
        throw new ApiError(404, "Leave application not found");
      }
      return app;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }

  async delete(id) {
    try {
      const app = await LeaveApplication.findByIdAndDelete(id).lean();
      if (!app) {
        throw new ApiError(404, "Leave application not found");
      }
      return app;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }
}

export default new LeaveApplicationRepository();
