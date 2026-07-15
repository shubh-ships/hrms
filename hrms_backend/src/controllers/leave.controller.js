import { Leave } from "../models/leave.Model.js";
// import LeaveBalance from "../models/leaveBalance.Model.js";
import { LeavePolicy } from "../models/leavePolicy.Model.js";
import Employee from "../models/employee.Model.js";
import { successResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../middlewares/asyncHandler.js";
// import { AuditLog } from "../models/auditlog.Model.js";
import { StaffLeaveBalance } from "../models/leaveBalance.Model.js";
export const applyForLeave = asyncHandler(async (req, res) => {
  const { organizationId, _id } = req.user;
  const {
    leaveType,
    startDate,
    endDate,
    reason,
    durationType = "fullDay",
  } = req.body;

  const employee = await Employee.findOne({ userId: _id, organizationId });

  if (!employee) {
    throw new ApiError(404, "Employee record not found");
  }

  const employeeId = employee._id;

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate total days (including handling for half days)
  let totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  // Adjust for half-day requests
  if (durationType === "halfDay") {
    // If it's a single day half-day request
    if (totalDays === 1) {
      totalDays = 0.5;
    } else {
      throw new ApiError(
        400,
        "Half-day leave can only be requested for a single day",
      );
    }
  }

  // const leavePolicy = await LeavePolicy.findOne({
  //   organizationId,
  //   isDeleted: false,
  // });

  // const leaveRule = leavePolicy.rules.find(
  //   (rule) => rule.leaveType === leaveType,
  // );

  // if (!leaveRule) {
  //   throw new ApiError(400, "Leave type not found in policy");
  // }

  // let availableBalance = 0;
  // let totalBalance = 0;
  // let totalTaken = 0;
  // let frequency = "yearly";

  // if (leaveRule.frequency === "monthly") {
  //   frequency = "monthly";
  //   const currentDate = new Date();
  //   const currentMonth = currentDate.getMonth() + 1;
  //   const currentYear = currentDate.getFullYear();
  //   const currentPeriod = `${currentYear}-${currentMonth.toString().padStart(2, "0")}`;

  //   const leaveBalance = await  StaffLeaveBalance.findOne({
  //     organizationId,
  //     employeeId,
  //     leaveType,
  //     period: currentPeriod,
  //     frequency: "monthly",
  //   });

  //   totalBalance = leaveBalance ? leaveBalance.balance : 0;

  //   totalTaken = leaveBalance ? leaveBalance.leaveTaken : 0;

  //   availableBalance = totalBalance - totalTaken;
  // } else {
  //   const currentYear = new Date().getFullYear().toString();
  //   const leaveBalance = await LeaveBalance.findOne({
  //     organizationId,
  //     employeeId,
  //     leaveType,
  //     period: currentYear,
  //     frequency: "yearly",
  //   });

  //   totalBalance = leaveBalance ? leaveBalance.balance : 0;

  //   totalTaken = leaveBalance ? leaveBalance.leaveTaken : 0;

  //   availableBalance = totalBalance - totalTaken;
  // }
  const balanceDoc = await StaffLeaveBalance.findOne({
    organizationId,
    employeeId,

  });
  if (!balanceDoc) {
    throw new ApiError(404, "Leave balance not found");
  }
  const category = balanceDoc.leaveCategories.find(c => c.categoryName === leaveType);
  if (!category) {
    throw new ApiError(400, "leave balance category not found")
  }
  const availableBalance = category.leaveBalance;
  if (availableBalance < totalDays) {
    throw new ApiError(400, "Insufficient leave balance");
  }

  const leave = new Leave({
    organizationId,
    employeeId,
    leaveType,
    startDate: start,
    endDate: end,
    totalDays,
    reason,
    durationType,
    status: "pending",
    approvalHistory: [
      {
        approverId: req.user._id,
        status: "pending",
        date: new Date(),
      },
    ],
  });

  await leave.save();
  successResponse(res, "Leave applied successfully", leave, 201);
});

export const getLeavesForApproval = asyncHandler(async (req, res) => {
  const { assignableUsers, organizationId } = req.user;

  if (!assignableUsers || assignableUsers.length === 0) {
    successResponse(res, "No assignable users found", []);
  }

  const assignableUserIds = assignableUsers.map((user) => user._id);

  const teamEmployees = await Employee.find({
    userId: { $in: assignableUserIds },
    organizationId,
    "employment.status": "active",
  });

  const teamEmployeeIds = teamEmployees.map((emp) => emp._id);

  const leaves = await Leave.find({
    organizationId,
    employeeId: { $in: teamEmployeeIds },
    status: "pending",
  }).populate(
    "employeeId",
    "personal.firstName personal.lastName employment.departmentId employment.userRoleTableId",
  );

  successResponse(res, "Leaves for approval fetched successfully", leaves);
});

export const processLeaveApproval = asyncHandler(async (req, res) => {
  const { leaveId } = req.params;
  const approverId = req.user._id;
  const { status, remarks } = req.body;

  const leave = await Leave.findById(leaveId);
  if (!leave) {
    throw new ApiError(404, "Leave not found");
  }

  // Update leave status and add to approval history
  leave.status = status;
  leave.approvalHistory.push({
    approverId,
    status,
    remarks,
    date: new Date(),
  });

  // If approved, deduct from leave balance
  if (status === "approved") {
    // let period;
    // let frequency = "yearly";

    // // Determine the period based on leave policy frequency
    // const leavePolicy = await LeavePolicy.findOne({
    //   organizationId: leave.organizationId,
    //   isDeleted: false,
    // });

    // const leaveRule = leavePolicy.rules.find(
    //   (rule) => rule.leaveType === leave.leaveType,
    // );

    // if (leaveRule && leaveRule.frequency === "monthly") {
    //   const currentDate = new Date();
    //   const currentMonth = currentDate.getMonth() + 1;
    //   const currentYear = currentDate.getFullYear();
    //   period = `${currentYear}-${currentMonth.toString().padStart(2, "0")}`;
    //   frequency = "monthly";
    // } else {
    //   period = new Date().getFullYear().toString();
    // }

    await StaffLeaveBalance.findOneAndUpdate(
      {
        organizationId: leave.organizationId,
        employeeId: leave.employeeId,
        "leaveCategories.categoryName": leave.leaveType,
      },
      {
        $inc: {
          "leaveCategories.$.availedLeaves": leave.totalDays,
          "leaveCategories.$.leaveBalance": -leave.totalDays
        }
      },
    );
  }

  await leave.save();

  successResponse(res, "Leave approval processed successfully", leave);
});

export const getLeavesHistory = asyncHandler(async (req, res) => {
  const { assignableUsers, organizationId } = req.user;

  if (!assignableUsers || assignableUsers.length === 0) {
    successResponse(res, "No assignable users found", []);
  }

  const assignableUserIds = assignableUsers.map((user) => user._id);
  const leaves = await Leave.find({
    organizationId,
    approvalHistory: { $elemMatch: { approverId: { $in: assignableUserIds } } },
  }).populate("approvalHistory.approverId", "name email isActive");

  successResponse(res, "Leave history fetched successfully", leaves);
});

export const getLeavesHistoryByOrg = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;

  if (!organizationId) {
    throw new ApiError(400, "organizationId is required");
  }

  const leaves = await Leave.find({
    organizationId,
  }).populate("approvalHistory.approverId", "name email isActive");

  successResponse(res, "Leave history fetched successfully", leaves);
});

export const getLeavesForApprovalByOrg = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;

  if (!organizationId) {
    throw new ApiError(400, "organizationId is required");
  }

  const leaves = await Leave.find({
    organizationId,
    status: "pending",
  }).populate(
    "employeeId",
    "personal.firstName personal.lastName employment.departmentId employment.userRoleTableId",
  );

  successResponse(res, "Leave approval fetched successfully", leaves);
});

export const markLeave = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;
  const adminId = req.user._id || req.user.id;
  const {
    employeeId,
    leaveType,
    startDate,
    endDate,
    reason,
    durationType = "fullDay",
  } = req.body;

  // Validate required fields
  if (!employeeId || !leaveType || !startDate || !endDate) {
    throw new ApiError(
      400,
      "Missing required fields: employeeId, leaveType, startDate, endDate",
    );
  }

  // Find employee and verify they belong to the admin's organization
  const employee = await Employee.findOne({ _id: employeeId, organizationId });
  if (!employee) {
    throw new ApiError(404, "Employee not found in your organization");
  }

  // Parse dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ApiError(400, "Invalid date format");
  }
  if (start > end) {
    throw new ApiError(400, "Start date cannot be after end date");
  }

  // Calculate total days (including half‑day handling)
  let totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  if (durationType === "halfDay") {
    if (totalDays === 1) {
      totalDays = 0.5;
    } else {
      throw new ApiError(
        400,
        "Half-day leave can only be requested for a single day",
      );
    }
  }

  // Retrieve the active leave policy for the organization
  // const leavePolicy = await LeavePolicy.findOne({
  //   organizationId,
  //   isDeleted: false,
  // });
  // if (!leavePolicy) {
  //   throw new ApiError(
  //     404,
  //     "No active leave policy found for this organization",
  //   );
  // }

  // // Find the rule for the requested leave type
  // const leaveRule = leavePolicy.rules.find(
  //   (rule) => rule.leaveType === leaveType,
  // );
  // if (!leaveRule) {
  //   throw new ApiError(
  //     400,
  //     `Leave type "${leaveType}" is not defined in the policy`,
  //   );
  // }

  // // Determine period based on the leave start date and rule frequency
  // let period, frequency;
  // const startYear = start.getFullYear();
  // if (leaveRule.frequency === "monthly") {
  //   const startMonth = start.getMonth() + 1; // 1‑based
  //   period = `${startYear}-${startMonth.toString().padStart(2, "0")}`;
  //   frequency = "monthly";

  //   // Ensure leave does not cross month boundaries (simplification)
  //   const endYear = end.getFullYear();
  //   const endMonth = end.getMonth() + 1;
  //   if (startYear !== endYear || startMonth !== endMonth) {
  //     throw new ApiError(400, "Monthly leave cannot span multiple months");
  //   }
  // } else {
  //   // yearly
  //   period = startYear.toString();
  //   frequency = "yearly";
  // }

  // Fetch or create the leave balance record for the correct period
  // let leaveBalance = await LeaveBalance.findOne({
  //   organizationId,
  //   employeeId,
  //   leaveType,
  //   period,
  //   frequency,
  // });

  // if (!leaveBalance) {
  //   // If no balance exists, we could either create one with default balance (0) or throw an error.
  //   // Typically balances are pre‑allocated, so we throw an error to indicate missing allocation.
  //   throw new ApiError(
  //     404,
  //     `No leave balance found for ${leaveType} in period ${period}`,
  //   );
  // }

  // // Calculate available balance
  // const availableBalance =
  //   leaveBalance.balance - (leaveBalance.leaveTaken || 0);
  // if (availableBalance < totalDays) {
  //   throw new ApiError(
  //     400,
  //     `Insufficient leave balance. Available: ${availableBalance}, Requested: ${totalDays}`,
  //   );
  // }

  let leaveBalanceDoc = await StaffLeaveBalance.findOne({
    organizationId,
    employeeId,
  });

  if (!leaveBalanceDoc) {
    throw new ApiError(
      404,
      `No leave balance found for this employee`,
    );
  }

  // Find the specific category in the array
  const categoryIndex = leaveBalanceDoc.leaveCategories.findIndex(c => c.categoryName === leaveType);

  if (categoryIndex === -1) {
    throw new ApiError(
      404,
      `Leave balance category "${leaveType}" not found for this employee`,
    );
  }

  const category = leaveBalanceDoc.leaveCategories[categoryIndex];
  const availableBalance = category.leaveBalance;
  if (availableBalance < totalDays) {
    throw new ApiError(
      400,
      `Insufficient leave balance. Available: ${availableBalance}, Requested: ${totalDays}`,
    );
  }

  // Create the leave record with immediate approval
  const leave = new Leave({
    organizationId,
    employeeId,
    leaveType,
    startDate: start,
    endDate: end,
    totalDays,
    reason,
    durationType,
    status: "approved", // Directly approved
    approvedBy: adminId, // Optional: track who marked it
    approvalHistory: [
      {
        approverId: adminId,
        status: "approved",
        remarks: reason || "Marked by admin",
        date: new Date(),
      },
    ],
  });

  await leave.save();

  // Deduct the leave days from the balance category
  leaveBalanceDoc.leaveCategories[categoryIndex].availedLeaves += totalDays;
  leaveBalanceDoc.leaveCategories[categoryIndex].leaveBalance -= totalDays;
  await leaveBalanceDoc.save();

  successResponse(res, "Leave marked successfully", leave, 201);
});