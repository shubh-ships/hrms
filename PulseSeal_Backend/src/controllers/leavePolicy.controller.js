import asyncHandler from "../middlewares/asyncHandler.js";
import employeeModel from "../models/employee.Model.js";
// import leaveBalanceModel from "../models/leaveBalance.Model.js";
import { LeavePolicy } from "../models/leavePolicy.Model.js";
import ApiError from "../utils/apiError.js";
import { successResponse } from "../utils/apiResponse.js";

export const createLeavePolicy = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;
  const { name, description, rules, weekOffs } = req.body;

  if (!organizationId || !name) {
    throw new ApiError(400, "organizationId and name is required");
  }

  if (Array.isArray(rules) && rules.length > 0) {
    for (const rule of rules) {
      if (!rule.leaveType || rule.quota < 1) {
        throw new ApiError(400, "leave type and quota is required");
      }
    }
  } else {
    throw new ApiError(400, "At least one rule is required");
  }

  if (weekOffs.length < 1) {
    throw new ApiError(400, "At least one weekOff is required");
  }

  const newLeavePolicy = new LeavePolicy({
    organizationId,
    name,
    description,
    rules,
    weekOffs,
  });

  const savedPolicy = await newLeavePolicy.save();

  return successResponse(
    res,
    "Leave policy created successfully",
    savedPolicy,
    200,
  );
});

export const getLeavePoliciesByOrganization = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;

  if (!organizationId) {
    throw new ApiError(400, "organizationId is required");
  }

  const policies = await LeavePolicy.find({ organizationId, isDeleted: false });
  return successResponse(
    res,
    "Leave policies fetched successfully",
    policies,
    200,
  );
});

export const updateLeavePolicy = asyncHandler(async (req, res) => {
  const { policyId } = req.params;
  const { name, description, rules, weekOffs } = req.body;
  const { organizationId } = req.user;

  if (!policyId) {
    throw new ApiError(400, "policyId is required");
  }

  const policy = await LeavePolicy.findOne({ _id: policyId, isDeleted: false });
  if (!policy) {
    throw new ApiError(400, "Leave policy not found");
  }

  if (name) policy.name = name;
  if (description) policy.description = description;
  if (rules) policy.rules = rules;
  if (weekOffs) policy.weekOffs = weekOffs;
  policy.updatedAt = Date.now();

  const updatedPolicy = await policy.save();

  // Sync leave balances for all employees using this policy
  try {
    await syncLeaveBalancesWithPolicy(organizationId, policyId);
  } catch (syncError) {
    console.error("Failed to sync leave balances:", syncError);
    // Don't throw error here, just log it since policy update was successful
  }

  return successResponse(
    res,
    "Leave policy updated successfully",
    updatedPolicy,
    200,
  );
});

export const deleteLeavePolicy = asyncHandler(async (req, res) => {
  const { policyId } = req.params;
  if (!policyId) {
    throw new ApiError(400, "policyId is required");
  }
  const policy = await LeavePolicy.findOne({ _id: policyId, isDeleted: false });
  if (!policy) {
    throw new ApiError(404, "Leave policy not found");
  }
  policy.isDeleted = true;
  policy.updatedAt = Date.now();
  await policy.save();
  return successResponse(res, "Leave policy deleted successfully", [], 200);
});

export const getLeavePolicyById = asyncHandler(async (req, res) => {
  const { policyId } = req.params;
  if (!policyId) {
    throw new ApiError(400, "policyId is required");
  }
  const policy = await LeavePolicy.findOne({ _id: policyId, isDeleted: false });
  if (!policy) {
    throw new ApiError(404, "Leave policy not found");
  }
  return successResponse(res, "Leave policy fetched successfully", policy, 200);
});

export const syncLeaveBalancesWithPolicy = async (organizationId, policyId) => {
  try {
    const leavePolicy = await LeavePolicy.findOne({
      _id: policyId,
      organizationId,
      isDeleted: false,
    });

    if (!leavePolicy) {
      throw new Error("Leave policy not found");
    }

    // Get all active employees using this policy
    const employees = await employeeModel.find({
      organizationId,
      leavePolicyId: policyId,
      isDeleted: false,
      "employment.status": "active",
    });

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear().toString();
    const currentMonth = currentDate.getMonth() + 1;
    const currentPeriod = `${currentYear}-${currentMonth.toString().padStart(2, "0")}`;

    // Process each employee
    for (const employee of employees) {
      await syncEmployeeLeaveBalances(
        organizationId,
        employee,
        leavePolicy,
        currentYear,
        currentPeriod,
      );
    }

    return { success: true, employeesUpdated: employees.length };
  } catch (error) {
    console.error("Error syncing leave balances with policy:", error);
    throw error;
  }
};

export const syncEmployeeLeaveBalances = async (
  organizationId,
  employee,
  leavePolicy,
  currentYear,
  currentPeriod,
) => {
  try {
    const employeeId = employee._id;

    // Get existing leave balances for this employee
    const existingBalances = await leaveBalanceModel.find({
      organizationId,
      employeeId,
      isDeleted: false,
    });

    // Create a map of existing balances by leaveType and period
    const existingBalanceMap = new Map();
    existingBalances.forEach((balance) => {
      const key = `${balance.leaveType}-${balance.period}`;
      existingBalanceMap.set(key, balance);
    });

    const balanceOperations = [];

    // Process each rule in the updated policy
    for (const rule of leavePolicy.rules) {
      // Check if this rule applies to the employee's work type
      if (
        rule.applicableTo &&
        rule.applicableTo.length > 0 &&
        !rule.applicableTo.includes(employee.employment.workType)
      ) {
        continue; // Skip if rule doesn't apply to this employee
      }

      if (rule.frequency === "monthly") {
        const key = `${rule.leaveType}-${currentPeriod}`;
        const existingBalance = existingBalanceMap.get(key);

        if (existingBalance) {
          // Update existing balance with new quota
          existingBalance.balance = rule.quota;
          existingBalance.carryForward = rule.maxCarryForwardLimit;
          existingBalance.updatedAt = new Date();
          balanceOperations.push(existingBalance.save());
        } else {
          // Create new balance for this period
          const newBalance = new leaveBalanceModel({
            organizationId,
            employeeId,
            leaveType: rule.leaveType,
            balance: rule.quota,
            period: currentPeriod,
            frequency: rule.frequency,
            carryForward: rule.maxCarryForwardLimit,
          });
          balanceOperations.push(newBalance.save());
        }
      } else {
        // Yearly frequency
        const key = `${rule.leaveType}-${currentYear}`;
        const existingBalance = existingBalanceMap.get(key);

        if (existingBalance) {
          // Update existing balance with new quota
          existingBalance.balance = rule.quota;
          existingBalance.carryForward = rule.maxCarryForwardLimit;
          existingBalance.updatedAt = new Date();
          balanceOperations.push(existingBalance.save());
        } else {
          // Create new balance for this year
          const newBalance = new leaveBalanceModel({
            organizationId,
            employeeId,
            leaveType: rule.leaveType,
            balance: rule.quota,
            period: currentYear,
            frequency: rule.frequency,
            carryForward: rule.maxCarryForwardLimit,
          });
          balanceOperations.push(newBalance.save());
        }
      }
    }

    // Handle removal of leave types that no longer exist in policy
    const currentLeaveTypes = leavePolicy.rules.map((rule) => rule.leaveType);
    const balancesToDeactivate = existingBalances.filter(
      (balance) => !currentLeaveTypes.includes(balance.leaveType),
    );

    balancesToDeactivate.forEach((balance) => {
      balance.isDeleted = true;
      balance.updatedAt = new Date();
      balanceOperations.push(balance.save());
    });

    await Promise.all(balanceOperations);
  } catch (error) {
    console.error(
      `Error syncing leave balances for employee ${employee._id}:`,
      error,
    );
    throw error;
  }
};
