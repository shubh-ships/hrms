// services/leaveBalance.service.js
import Employee from "../models/employee.Model.js";
import { LeaveTemplate } from "../models/leaveTemplate.Model.js";
import leaveBalanceRepository from "../repositories/leaveBalance.repository.js";
import leaveTemplateRepository from "../repositories/leaveTemplate.repository.js"; // reuse from leave template
// import employeeRepository from "../repositories/employee.repository.js"; // assume exists
import ApiError from "../utils/apiError.js";
import mongoose from "mongoose";

class LeaveBalanceService {
  async getBalance(req) {
    const { employeeId } = req.params;
    const { organizationId } = req.user; // or from req.user

    if (!employeeId || !organizationId) {
      throw new ApiError(400, "Employee ID and Organization ID are required");
    }

    if (
      !mongoose.Types.ObjectId.isValid(employeeId) ||
      !mongoose.Types.ObjectId.isValid(organizationId)
    ) {
      throw new ApiError(400, "Invalid ID format");
    }

    const balance = await leaveBalanceRepository.findByEmployee(
      employeeId,
      organizationId,
    );
    if (!balance) {
      throw new ApiError(404, "Leave balance not found for this employee");
    }

    return balance;
  }

  // services/leaveBalance.service.js – updated updateBalance

  async updateBalance(req) {
    const { employeeId } = req.params;
    const { organizationId } = req.user; // from authenticated user
    const { leaveCategories: payloadCategories } = req.body;

    // ----- Basic validations -----
    if (!employeeId || !organizationId) {
      throw new ApiError(400, "Employee ID and Organization ID are required");
    }
    if (
      !mongoose.Types.ObjectId.isValid(employeeId) ||
      !mongoose.Types.ObjectId.isValid(organizationId)
    ) {
      throw new ApiError(400, "Invalid ID format");
    }

    // Verify employee exists
    const employee = await Employee.findOne({
      _id: employeeId,
      organizationId,
    });
    if (!employee) {
      throw new ApiError(404, "Employee not found in this organization");
    }

    // Validate payload structure
    if (!Array.isArray(payloadCategories)) {
      throw new ApiError(400, "leaveCategories must be an array");
    }

    // Fetch current leave balance – may be null
    let balance = await leaveBalanceRepository.findByEmployee(
      employeeId,
      organizationId,
    );

    // ----- If no balance exists, check if we can create one (only comp off allowed) -----
    if (!balance) {
      // Verify that all items are comp off and have positive deltas
      const allCompOff = payloadCategories.every(
        (item) => item.isCompOffLeave === true,
      );
      const allPositive = payloadCategories.every(
        (item) => item.overrideLeaves > 0,
      );
      if (!allCompOff) {
        throw new ApiError(
          400,
          "Cannot update normal leave categories because employee has no leave template/balance. Only compensatory off leaves can be added.",
        );
      }
      if (!allPositive) {
        throw new ApiError(
          400,
          "When creating a new compensatory off balance, all overrideLeaves must be positive.",
        );
      }

      // Create a new balance record with only comp off categories
      const newCompOffCategories = payloadCategories.map((item) => ({
        categoryId: new mongoose.Types.ObjectId(),
        categoryName: "Comp Off Leave",
        isCompOffLeave: true,
        leaveBalance: item.overrideLeaves,
        availedLeaves: 0,
        encashableLeaves: 0,
        templateLeaveCount: 0,
      }));

      balance = {
        organizationId,
        employeeId,
        leaveTemplateId: null, // no template
        leaveCategories: newCompOffCategories,
        totalAvailedLeaves: 0,
        totalBalancedLeaves: newCompOffCategories.reduce(
          (sum, c) => sum + c.leaveBalance,
          0,
        ),
        updatedAt: new Date(),
      };

      // Save the new balance using repository (create method)
      balance = await leaveBalanceRepository.create(balance);
      return balance; // no further processing needed
    }

    // ----- Existing balance exists – process deltas as before -----
    for (const item of payloadCategories) {
      const { leaveCategoryId, overrideLeaves, isCompOffLeave } = item;

      if (typeof overrideLeaves !== "number" || isNaN(overrideLeaves)) {
        throw new ApiError(400, "overrideLeaves must be a number");
      }

      if (isCompOffLeave) {
        const compOffIndex = balance.leaveCategories.findIndex(
          (c) => c.isCompOffLeave === true,
        );
        if (compOffIndex >= 0) {
          const newBalance =
            balance.leaveCategories[compOffIndex].leaveBalance + overrideLeaves;
          if (newBalance < 0) {
            throw new ApiError(
              400,
              "Comp off leave balance cannot become negative",
            );
          }
          balance.leaveCategories[compOffIndex].leaveBalance = newBalance;
        } else {
          if (overrideLeaves > 0) {
            const newCompOff = {
              categoryId: new mongoose.Types.ObjectId(),
              categoryName: "Comp Off Leave",
              isCompOffLeave: true,
              leaveBalance: overrideLeaves,
              availedLeaves: 0,
              encashableLeaves: 0,
              templateLeaveCount: 0,
            };
            balance.leaveCategories.push(newCompOff);
          } else if (overrideLeaves < 0) {
            throw new ApiError(
              400,
              "Cannot decrease non‑existent comp off leave",
            );
          }
        }
      } else {
        // Normal category
        if (!leaveCategoryId) {
          throw new ApiError(
            400,
            "leaveCategoryId is required for non‑comp‑off categories",
          );
        }
        if (!mongoose.Types.ObjectId.isValid(leaveCategoryId)) {
          throw new ApiError(400, "Invalid leaveCategoryId format");
        }

        const categoryIndex = balance.leaveCategories.findIndex(
          (c) =>
            c.categoryId.toString() === leaveCategoryId.toString() &&
            !c.isCompOffLeave,
        );
        if (categoryIndex === -1) {
          throw new ApiError(
            404,
            `Leave category with id ${leaveCategoryId} not found in employee's balance`,
          );
        }

        const newBalance =
          balance.leaveCategories[categoryIndex].leaveBalance + overrideLeaves;
        if (newBalance < 0) {
          throw new ApiError(
            400,
            `Leave balance for category ${balance.leaveCategories[categoryIndex].categoryName} cannot become negative`,
          );
        }
        balance.leaveCategories[categoryIndex].leaveBalance = newBalance;
      }
    }

    // ----- Recalculate totals -----
    balance.totalAvailedLeaves = balance.leaveCategories.reduce(
      (sum, cat) => sum + (cat.availedLeaves || 0),
      0,
    );
    balance.totalBalancedLeaves = balance.leaveCategories.reduce(
      (sum, cat) => sum + (cat.leaveBalance || 0),
      0,
    );
    balance.updatedAt = new Date();

    // ----- Save the updated balance -----
    const updatedBalance = await leaveBalanceRepository.update(
      employeeId,
      organizationId,
      {
        leaveCategories: balance.leaveCategories,
        totalAvailedLeaves: balance.totalAvailedLeaves,
        totalBalancedLeaves: balance.totalBalancedLeaves,
        updatedAt: balance.updatedAt,
      },
    );

    return updatedBalance;
  }
  async initializeBalance(req) {
    const { employeeId, leaveTemplateId, organizationId } = req.body;

    if (!employeeId || !leaveTemplateId || !organizationId) {
      throw new ApiError(
        400,
        "employeeId, leaveTemplateId, and organizationId are required",
      );
    }

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(employeeId) ||
      !mongoose.Types.ObjectId.isValid(leaveTemplateId) ||
      !mongoose.Types.ObjectId.isValid(organizationId)
    ) {
      throw new ApiError(400, "Invalid ID format");
    }

    // Check if employee exists
    const employee = await employeeRepository.findOne({
      _id: employeeId,
      organizationId,
    });
    if (!employee) {
      throw new ApiError(404, "Employee not found");
    }

    // Fetch leave template
    const template = await leaveTemplateRepository.findOne({
      _id: leaveTemplateId,
      organizationId,
      status: "ACTIVE",
    });
    if (!template) {
      throw new ApiError(404, "Active leave template not found");
    }

    // Check if balance already exists
    const existing = await leaveBalanceRepository.findByEmployee(
      employeeId,
      organizationId,
    );
    if (existing) {
      throw new ApiError(409, "Leave balance already exists for this employee");
    }

    // Build leaveCategories from template
    const leaveCategories = template.leaveCategories.map((cat) => ({
      categoryId: cat._id,
      categoryName: cat.categoryName,
      templateLeaveCount: cat.leaveCount,
      availedLeaves: 0,
      leaveBalance: cat.leaveCount, // initial balance equals leaveCount (assuming no accrual yet)
      encashableLeaves:
        cat.unusedLeaveRuleType === "ENCASH" ? cat.leaveCount : 0,
      isCompOffLeave: false,
    }));

    const totalAvailed = 0;
    const totalBalance = leaveCategories.reduce(
      (sum, cat) => sum + cat.leaveBalance,
      0,
    );

    const balanceData = {
      organizationId,
      employeeId,
      leaveTemplateId,
      leaveCategories,
      totalAvailedLeaves: totalAvailed,
      totalBalancedLeaves: totalBalance,
    };

    const newBalance = await leaveBalanceRepository.create(balanceData);
    return newBalance;
  }

  // Initialize leave balances for a new employee
  async initializeLeaveBalances(organizationId, employeeId, leaveTemplateId) {
    // Fetch the leave template
    const template = await LeaveTemplate.findOne({
      _id: leaveTemplateId,
      organizationId,
      status: "ACTIVE",
    });
    if (!template) {
      throw new ApiError(400, "Leave template not found or inactive");
    }

    // Build balance categories from template leaveCategories
    const leaveCategories = template.leaveCategories.map((cat) => ({
      categoryId: cat._id,
      categoryName: cat.categoryName,
      templateLeaveCount: cat.leaveCount,
      availedLeaves: 0,
      leaveBalance: cat.leaveCount, // initial balance
      encashableLeaves:
        cat.unusedLeaveRuleType === "ENCASH" ? cat.unusedLeaveCount : 0,
      isCompOffLeave: false,
    }));

    const totalAvailed = 0;
    const totalBalance = leaveCategories.reduce(
      (sum, c) => sum + c.leaveBalance,
      0,
    );

    await leaveBalanceRepository.create({
      organizationId,
      employeeId,
      leaveTemplateId,
      leaveCategories,
      totalAvailedLeaves: totalAvailed,
      totalBalancedLeaves: totalBalance,
    });
  }

  // Reinitialize (overwrite) leave balances when template changes
  async reinitializeLeaveBalances(
    organizationId,
    employeeId,
    newLeaveTemplateId,
  ) {
    // Delete existing balance (or archive)
    await leaveBalanceRepository.deleteOne({ organizationId, employeeId }); // or soft delete

    // Create new balance
    await this.initializeLeaveBalances(
      organizationId,
      employeeId,
      newLeaveTemplateId,
    );
  }
}

export default new LeaveBalanceService();
