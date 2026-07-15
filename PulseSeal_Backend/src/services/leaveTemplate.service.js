import leaveTemplateRepository from "../repositories/leaveTemplate.repository.js";
import Employee from "../models/employee.Model.js";
import ApiError from "../utils/apiError.js";
import mongoose from "mongoose";
import leaveBalanceRepository from "../repositories/leaveBalance.repository.js";
import leaveBalanceService from "./leaveBalance.service.js";

class LeaveTemplateService {
  async createLeaveTemplate(req) {
    const { organizationId } = req.user;
    const { name, cycleType, startDate, endDate, leaveCategories } = req.body;

    // Validate required fields
    if (!organizationId || !name || !cycleType || !startDate || !endDate) {
      throw new ApiError(
        400,
        "Missing required fields: organizationId, name, cycleType, startDate, endDate",
      );
    }

    // Check if template with same name exists in organization
    const existingTemplate = await leaveTemplateRepository.findOne({
      organizationId,
      name,
      status: "ACTIVE",
    });

    if (existingTemplate) {
      throw new ApiError(
        409,
        "Leave template with this name already exists in your organization",
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      throw new ApiError(400, "Start date cannot be greater than end date");
    }

    // Validate cycle type specific rules
    if (cycleType === "YEARLY") {
      // Check if it's a full year
      const oneYearLater = new Date(start);
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      oneYearLater.setDate(oneYearLater.getDate() - 1); // Dec 31 for Jan 1 start

      if (end.toDateString() !== oneYearLater.toDateString()) {
        throw new ApiError(
          400,
          "For yearly cycle, end date must be exactly one year minus one day from start date",
        );
      }
    } else if (cycleType === "MONTHLY") {
      // Check if it's a full month
      const oneMonthLater = new Date(start);
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      oneMonthLater.setDate(oneMonthLater.getDate() - 1);

      if (end.toDateString() !== oneMonthLater.toDateString()) {
        throw new ApiError(
          400,
          "For monthly cycle, end date must be exactly one month minus one day from start date",
        );
      }
    }

    // Validate leave categories
    if (leaveCategories && leaveCategories.length > 0) {
      this.validateLeaveCategories(leaveCategories, cycleType);
    }

    const leaveTemplateData = {
      organizationId,
      name,
      cycleType,
      startDate: start,
      endDate: end,
      leaveCategories: leaveCategories || [],
      status: "ACTIVE",
    };

    const leaveTemplate =
      await leaveTemplateRepository.create(leaveTemplateData);
    return leaveTemplate;
  }

  async getLeaveTemplateById(req) {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Leave template ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid leave template ID format");
    }

    const leaveTemplate = await leaveTemplateRepository.findById(id);
    return leaveTemplate;
  }

  async getAllLeaveTemplates(req) {
    const { organizationId } = req.user;
    const { page = 1, limit = 10, status } = req.query;

    if (!organizationId) {
      throw new ApiError(400, "Organization ID is required");
    }

    const query = { organizationId };
    if (status) {
      query.status = status;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
    };

    const result = await leaveTemplateRepository.findAll(query, options);
    return result;
  }

  async updateLeaveTemplate(req) {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      throw new ApiError(400, "Leave template ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid leave template ID format");
    }

    const existingTemplate = await leaveTemplateRepository.findById(id);

    if (!existingTemplate) {
      throw new ApiError(404, "Leave template not found");
    }

    // 🔹 Duplicate name check
    if (updateData.name && updateData.name !== existingTemplate.name) {
      const duplicateTemplate = await leaveTemplateRepository.findOne({
        organizationId: existingTemplate.organizationId,
        name: updateData.name,
        status: "ACTIVE",
        _id: { $ne: id },
      });

      if (duplicateTemplate) {
        throw new ApiError(
          409,
          "Leave template with this name already exists in your organization",
        );
      }
    }

    // 🔹 Date validation
    if (updateData.startDate || updateData.endDate) {
      const start = new Date(
        updateData.startDate || existingTemplate.startDate,
      );
      const end = new Date(updateData.endDate || existingTemplate.endDate);

      if (start > end) {
        throw new ApiError(400, "Start date cannot be greater than end date");
      }

      const cycleType = updateData.cycleType || existingTemplate.cycleType;

      if (cycleType === "YEARLY") {
        const oneYearLater = new Date(start);
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
        oneYearLater.setDate(oneYearLater.getDate() - 1);

        if (end.toDateString() !== oneYearLater.toDateString()) {
          throw new ApiError(
            400,
            "For yearly cycle, end date must be exactly one year minus one day from start date",
          );
        }
      } else if (cycleType === "MONTHLY") {
        const oneMonthLater = new Date(start);
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
        oneMonthLater.setDate(oneMonthLater.getDate() - 1);

        if (end.toDateString() !== oneMonthLater.toDateString()) {
          throw new ApiError(
            400,
            "For monthly cycle, end date must be exactly one month minus one day from start date",
          );
        }
      }
    }

    // 🔹 Validate leave categories
    if (updateData.leaveCategories) {
      const cycleType = updateData.cycleType || existingTemplate.cycleType;
      this.validateLeaveCategories(updateData.leaveCategories, cycleType);
    }

    // 🔥 ONLY UPDATE TEMPLATE (NO BALANCE CHANGE)
    const updatedTemplate = await leaveTemplateRepository.update(
      id,
      updateData,
    );

    return updatedTemplate;
  }

  async deleteLeaveTemplate(req) {
    const { id } = req.params;
    const { permanent } = req.query;
    const { organizationId } = req.user;

    if (!id) {
      throw new ApiError(400, "Leave template ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid leave template ID format");
    }

    // 🔥 STEP 1: CHECK IF TEMPLATE EXISTS
    const template = await leaveTemplateRepository.findOne({
      _id: id,
      organizationId,
    });

    if (!template) {
      throw new ApiError(404, "Leave template not found");
    }

    // 🔥 STEP 2: CHECK IF ANY EMPLOYEE IS ASSIGNED
    const assignedEmployees = await Employee.find({
      organizationId,
      leaveTemplateId: id,
    }).select("_id personal.firstName employment.employeeCode");

    if (assignedEmployees.length > 0) {
      throw new ApiError(
        400,
        `${assignedEmployees.length} employees are still assigned to this template`,
      );
    }

    // 🔥 STEP 3: DELETE TEMPLATE
    if (permanent === "true") {
      return await leaveTemplateRepository.delete(id);
    } else {
      return await leaveTemplateRepository.softDelete(id);
    }
  }

  async activateLeaveTemplate(req) {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Leave template ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid leave template ID format");
    }

    const updatedTemplate = await leaveTemplateRepository.update(id, {
      status: "ACTIVE",
      updatedAt: Date.now(),
    });

    return updatedTemplate;
  }

  async getTemplateEmployees(req) {
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
    const template = await leaveTemplateRepository.findOne({
      _id: templateId,
      organizationId,
    });
    if (!template) {
      throw new ApiError(404, "Leave template not found in this organization");
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
    };

    if (unassignedStaff === "true") {
      // Get employees not assigned to this template
      return await leaveTemplateRepository.findUnassignedToTemplate(
        templateId,
        organizationId,
        options,
      );
    } else {
      // Get employees assigned to this template
      return await leaveTemplateRepository.findAssignedToTemplate(
        templateId,
        organizationId,
        options,
      );
    }
  }

  async assignEmployeesToTemplate(req) {
    const { templateId } = req.params;
    const { staffIds } = req.body;
    const { organizationId } = req.user;

    if (!templateId) {
      throw new ApiError(400, "Template ID is required");
    }

    if (!staffIds || !Array.isArray(staffIds) || staffIds.length === 0) {
      throw new ApiError(400, "Staff IDs array is required");
    }

    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      throw new ApiError(400, "Invalid template ID format");
    }

    const template = await leaveTemplateRepository.findOne({
      _id: templateId,
      organizationId,
    });

    if (!template) {
      throw new ApiError(404, "Leave template not found in this organization");
    }

    await leaveTemplateRepository.validateStaffIds(staffIds, organizationId);

    // 🔥 STEP 1: CHECK IF EMPLOYEE ALREADY HAS TEMPLATE
    const alreadyAssignedEmployees = await Employee.find({
      _id: { $in: staffIds },
      organizationId,
      leaveTemplateId: { $ne: null },
    }).select("_id personal.firstName employment.employeeCode");

    if (alreadyAssignedEmployees.length > 0) {
      const employeeNames = alreadyAssignedEmployees.map(
        (emp) =>
          `${emp.personal?.firstName || ""} (${emp.employment?.employeeCode || ""})`,
      );

      throw new ApiError(
        400,
        `Some employees already have a leave template assigned: ${employeeNames.join(
          ", ",
        )}`,
      );
    }

    // 🔥 STEP 2: ASSIGN TEMPLATE TO EMPLOYEES
    const result = await leaveTemplateRepository.assignTemplateToEmployees(
      templateId,
      staffIds,
    );

    // 🔥 STEP 3: INITIALIZE LEAVE BALANCES USING SERVICE
    for (const employeeId of staffIds) {
      await leaveBalanceService.initializeLeaveBalances(
        organizationId,
        employeeId,
        templateId,
      );
    }

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }

  async removeEmployeesFromTemplate(req) {
    const { templateId } = req.params;
    const { staffIds } = req.body;
    const { organizationId } = req.user;

    if (!templateId) {
      throw new ApiError(400, "Template ID is required");
    }

    if (!staffIds || !Array.isArray(staffIds) || staffIds.length === 0) {
      throw new ApiError(400, "Staff IDs array is required");
    }

    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      throw new ApiError(400, "Invalid template ID format");
    }

    const template = await leaveTemplateRepository.findOne({
      _id: templateId,
      organizationId,
    });

    if (!template) {
      throw new ApiError(404, "Leave template not found in this organization");
    }

    await leaveTemplateRepository.validateStaffIds(staffIds, organizationId);

    // 🔥 STEP 1: Find employees who actually have this template
    const employees = await Employee.find({
      _id: { $in: staffIds },
      organizationId,
      leaveTemplateId: templateId,
    }).select("_id");

    if (!employees.length) {
      return {
        matchedCount: 0,
        modifiedCount: 0,
      };
    }

    const validEmployeeIds = employees.map((emp) => emp._id);

    // 🔥 STEP 2: Remove template from ONLY those employees
    const result = await Employee.updateMany(
      {
        _id: { $in: validEmployeeIds },
      },
      {
        $set: { leaveTemplateId: null },
      },
    );

    // 🔥 STEP 3: Delete leave balances ONLY for those employees
    await leaveBalanceRepository.deleteLeaveBalancesBulk(
      organizationId,
      validEmployeeIds,
    );

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }

  // Helper method to validate leave categories
  validateLeaveCategories(categories, cycleType) {
    if (!Array.isArray(categories)) {
      throw new ApiError(400, "Leave categories must be an array");
    }

    const categoryNames = new Set();

    categories.forEach((category, index) => {
      // Required fields validation
      if (!category.categoryName) {
        throw new ApiError(
          400,
          `Category name is required for category at index ${index}`,
        );
      }

      if (!category.leaveCount || category.leaveCount < 0) {
        throw new ApiError(
          400,
          `Valid leave count is required for category ${category.categoryName}`,
        );
      }

      if (!category.unusedLeaveRuleType) {
        throw new ApiError(
          400,
          `Unused leave rule type is required for category ${category.categoryName}`,
        );
      }

      if (!category.type) {
        throw new ApiError(
          400,
          `Type is required for category ${category.categoryName}`,
        );
      }

      // Check for duplicate category names
      if (categoryNames.has(category.categoryName)) {
        throw new ApiError(
          400,
          `Duplicate category name: ${category.categoryName}`,
        );
      }
      categoryNames.add(category.categoryName);

      // Validate unusedLeaveCount based on rule type
      if (
        category.unusedLeaveRuleType !== "LAPSE" &&
        !category.unusedLeaveCount
      ) {
        throw new ApiError(
          400,
          `Unused leave count is required for ${category.categoryName} when rule type is ${category.unusedLeaveRuleType}`,
        );
      }
    });
  }
}

export default new LeaveTemplateService();
