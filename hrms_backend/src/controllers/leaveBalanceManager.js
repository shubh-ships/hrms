import { StaffLeaveBalance } from "../models/leaveBalance.Model.js";
import { LeavePolicy } from "../models/leavePolicy.Model.js";
import Employee from "../models/employee.Model.js";
import { successResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import { syncEmployeeLeaveBalances } from "./leavePolicy.controller.js";
// import leaveBalanceModel from "../models/leaveBalance.Model.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import ExcelJs from "exceljs";
//TODO:- integrate asynchandler in all api's

export const listCurrentLeaveBalances = async (req, res) => {
  try {
    const { organizationId, _id } = req.user;

    const employee = await Employee.findOne({ userId: _id, organizationId });
    if (!employee) {
      throw new ApiError(400, "Employee record not found");
    }
    const employeeId = employee._id;
    const gender = (employee.personal?.gender || "").toLowerCase();

    const balanceDoc = await StaffLeaveBalance.findOne({
      organizationId,
      employeeId,
    });

    if (!balanceDoc) {
      return successResponse(res, "No leave balance found", [], 200);
    }

    const formattedBalances = balanceDoc.leaveCategories
      .map((cat) => {
        const leaveType = cat.categoryName;

        // Gender-based filtering
        if (leaveType.includes("Maternity Leave") && gender === "male") return null;
        if (leaveType.includes("Paternity Leave") && gender === "female") return null;

        return {
          ...cat.toObject(),
          _id: cat.categoryId,
          leaveType: cat.categoryName,
          balance: cat.leaveBalance,
          leaveTaken: cat.availedLeaves || 0,
          employeeName: `${employee.personal?.firstName || ""} ${employee.personal?.lastName || ""}`.trim(),
          gender,
        };
      })
      .filter(Boolean);

    return successResponse(
      res,
      "current balance fetched successfully",
      formattedBalances,
      200,
    );
  } catch (error) {
    console.error("Error fetching leave balances:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

export const initializeLeaveBalances = async (organizationId, employee) => {
  try {
    // const employeeId = employee._id;

    const leavePolicy = await LeavePolicy.findOne({
      organizationId,
      isDeleted: false,
    });

    if (!leavePolicy) {
      throw new Error(400, "No leave policy found for organization");
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear().toString();
    const currentMonth = currentDate.getMonth() + 1;
    const currentPeriod = `${currentYear}-${currentMonth
      .toString()
      .padStart(2, "0")}`;

    await syncEmployeeLeaveBalances(
      organizationId,
      employee,
      leavePolicy,
      currentYear,
      currentPeriod,
    );
  } catch (error) {
    console.error("Error initializing leave balances:", error);
    throw error;
  }
};

export const monthlyLeaveRollover = async (organizationId) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const currentPeriod = `${currentYear}-${currentMonth
      .toString()
      .padStart(2, "0")}`;

    console.log(
      `Starting monthly leave rollover for organization: ${organizationId}, period: ${currentPeriod}`,
    );

    const leavePolicy = await LeavePolicy.findOne({
      organizationId,
      isDeleted: false,
    });

    if (!leavePolicy) {
      throw new Error("No leave policy found for organization");
    }

    const employees = await Employee.find({
      organizationId,
      "employment.status": "active",
      isDeleted: false,
    }).populate({
      path: "employment.userRoleTableId",
      populate: {
        path: "roleDefinitionId",
        select: "roleName",
      },
    });

    let processedCount = 0;
    let errorCount = 0;

    for (const employee of employees) {
      try {
        await processEmployeeMonthlyRollover(
          organizationId,
          employee,
          leavePolicy,
          currentPeriod,
        );
        processedCount++;
      } catch (error) {
        console.error(`Error processing employee ${employee._id}:`, error);
        errorCount++;
      }
    }

    console.log(
      `Monthly rollover completed. Processed: ${processedCount}, Errors: ${errorCount}`,
    );

    return {
      success: true,
      processedCount,
      errorCount,
      period: currentPeriod,
    };
  } catch (error) {
    console.error("Error in monthly leave rollover:", error);
    throw error;
  }
};

const processEmployeeMonthlyRollover = async (
  organizationId,
  employee,
  leavePolicy,
  currentPeriod,
) => {
  const monthlyLeaveRules = leavePolicy.rules.filter(
    (rule) => rule.frequency === "monthly",
  );

  for (const rule of monthlyLeaveRules) {
    if (rule.applicableTo && rule.applicableTo.length > 0) {
      const employeeWorkType = employee.employment.workType;
      if (!rule.applicableTo.includes(employeeWorkType)) {
        continue;
      }
    }

    await StaffLeaveBalance.findOneAndUpdate(
      {
        organizationId,
        employeeId: employee._id,
        leaveType: rule.leaveType,
        period: currentPeriod,
        frequency: "monthly",
      },
      {
        balance: rule.quota,
        leaveTaken: 0,
        carryForward: leavePolicy.maxCarryForwardLimit || 0,
        updatedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
      },
    );

    // Log the rollover action
    // const auditLog = new AuditLog({
    //   organizationId,
    //   entity: "LeaveBalance",
    //   entityId: employee._id,
    //   action: "update",
    //   changedBy: "system",
    //   newValue: {
    //     employeeId: employee._id,
    //     leaveType: rule.type,
    //     period: currentPeriod,
    //     balance: rule.quota,
    //     carryForward: 0
    //   }
    // });
    // await auditLog.save();

    console.log(
      `Reset ${rule.type} leave balance for employee ${employee._id}: ${rule.quota}`,
    );
  }
};

export const yearlyLeaveRollover = async (organizationId) => {
  try {
    const currentYear = new Date().getFullYear();
    const previousYear = (currentYear - 1).toString();
    const newYear = currentYear.toString();

    console.log(
      `Starting yearly leave rollover for organization: ${organizationId}, year: ${newYear}`,
    );

    const employees = await Employee.find({
      organizationId,
      "employment.status": "active",
      isDeleted: false,
    });

    const leavePolicy = await LeavePolicy.findOne({
      organizationId,
      isDeleted: false,
    });

    let processedCount = 0;
    let errorCount = 0;

    for (const employee of employees) {
      try {
        for (const rule of leavePolicy.rules) {
          if (rule.frequency === "yearly") {
            if (rule.applicableTo && rule.applicableTo.length > 0) {
              const employeeWorkType = employee.employment.workType;
              if (!rule.applicableTo.includes(employeeWorkType)) {
                continue; // Skip if rule doesn't apply to employee's work type
              }
            }

            if (rule.carryForward) {
              const prevBalance = await StaffLeaveBalance.findOne({
                organizationId,
                employeeId: employee._id,
                leaveType: rule.leaveType,
                period: previousYear,
                frequency: "yearly",
              });

              const remainingBalance = prevBalance
                ? prevBalance.balance - prevBalance.leaveTaken
                : 0;

              const carryForward = prevBalance
                ? Math.min(remainingBalance, rule.maxCarryForwardLimit || 0)
                : 0;

              const newBalance = new StaffLeaveBalance({
                organizationId,
                employeeId: employee._id,
                leaveType: rule.leaveType,
                balance: rule.quota + carryForward,
                leaveTaken: 0,
                carryForward,
                period: newYear,
                frequency: "yearly",
              });

              await newBalance.save();
            } else {
              const newBalance = new StaffLeaveBalance({
                organizationId,
                employeeId: employee._id,
                leaveType: rule.leaveType,
                balance: rule.quota,
                leaveTaken: 0,
                carryForward: 0,
                period: newYear,
                frequency: "yearly",
              });

              await newBalance.save();
            }
          }
        }
        processedCount++;
      } catch (error) {
        console.error(`Error processing employee ${employee._id}:`, error);
        errorCount++;
      }
    }

    console.log(
      `Yearly rollover completed. Processed: ${processedCount}, Errors: ${errorCount}`,
    );

    return {
      success: true,
      processedCount,
      errorCount,
      year: newYear,
    };
  } catch (error) {
    console.error("Error in yearly leave rollover:", error);
    throw error;
  }
};

export const triggerRollover = async (req, res) => {
  try {
    const { organizationId, type } = req.body;

    let result;
    if (type === "monthly") {
      result = await monthlyLeaveRollover(organizationId);
    } else if (type === "yearly") {
      result = await yearlyLeaveRollover(organizationId);
    } else {
      return res.status(400).json({
        success: false,
        error: "Invalid rollover type. Use 'monthly' or 'yearly'",
      });
    }

    res.json({
      success: true,
      message: `${type} leave rollover completed successfully`,
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const createBalancesForLeaveTypes = async (
  organizationId,
  employeeId,
  leaveTypes,
  leavePolicy,
  employee,
) => {
  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonth = (now.getMonth() + 1).toString().padStart(2, "0");
  const currentPeriodMonthly = `${currentYear}-${currentMonth}`;

  // Build required entries for leaveTypes (respecting each rule's frequency)
  const requiredEntries = [];
  for (const rule of leavePolicy.rules || []) {
    if (!leaveTypes.includes(rule.leaveType)) continue;

    // Only include rules that actually apply to this employee (double-check)
    if (
      rule.applicableTo &&
      rule.applicableTo.length > 0 &&
      !rule.applicableTo.includes(employee.employment?.workType)
    ) {
      continue;
    }

    if (rule.frequency === "monthly") {
      requiredEntries.push({
        leaveType: rule.leaveType,
        period: currentPeriodMonthly,
        frequency: "monthly",
        quota: rule.quota,
        carryForward: rule.maxCarryForwardLimit || 0,
      });
    } else {
      requiredEntries.push({
        leaveType: rule.leaveType,
        period: currentYear,
        frequency: rule.frequency || "yearly",
        quota: rule.quota,
        carryForward: rule.maxCarryForwardLimit || 0,
      });
    }
  }

  if (requiredEntries.length === 0) return;

  // Query existing balances for these leaveType+period combos
  const orFilters = requiredEntries.map((e) => ({
    leaveType: e.leaveType,
    period: e.period,
  }));
  const existingBalances = await StaffLeaveBalance
    .find({
      organizationId,
      employeeId,
      isDeleted: false,
      $or: orFilters,
    })
    .select("leaveType period");

  const existingSet = new Set(
    existingBalances.map((b) => `${b.leaveType}::${b.period}`),
  );

  const bulkOps = [];
  for (const entry of requiredEntries) {
    const key = `${entry.leaveType}::${entry.period}`;
    if (existingSet.has(key)) continue;

    const doc = {
      organizationId,
      employeeId,
      leaveType: entry.leaveType,
      balance: entry.quota,
      leaveTaken: 0,
      period: entry.period,
      frequency: entry.frequency,
      carryForward: entry.carryForward,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    bulkOps.push({ insertOne: { document: doc } });
  }

  if (bulkOps.length === 0) return;

  try {
    await StaffLeaveBalance.bulkWrite(bulkOps, { ordered: false });
  } catch (err) {
    if (err && err.code === 11000) {
      // Duplicate key due to race — safe to ignore
      console.warn(
        "Duplicate key during leave balance bulk insert (race). Ignoring.",
      );
    } else {
      throw err;
    }
  }
};

export const deactivateBalancesForLeaveTypes = async (
  organizationId,
  employeeId,
  leaveTypes,
) => {
  if (!leaveTypes || leaveTypes.length === 0) return;

  // Mark all existing (non-deleted) leave balances for these leaveTypes as isDeleted = true
  await StaffLeaveBalance.updateMany(
    {
      organizationId,
      employeeId,
      leaveType: { $in: leaveTypes },
      isDeleted: false,
    },
    {
      $set: { isDeleted: true, updatedAt: new Date() },
    },
  );
};

export const getEmployeeLeaveBalances = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;
  const { employeeId } = req.params;
  // const { period } = req.query; // optional: YYYY or YYYY-MM

  // Verify that the employee belongs to the admin's organization
  const employee = await Employee.findOne({ _id: employeeId, organizationId });
  if (!employee) {
    throw new ApiError(404, "Employee not found in your organization");
  }
  const employeeGender = (employee.personal?.gender || "").toLowerCase(); // "male" / "female"

  // Determine which periods and frequencies to query
  // let periods = [];
  // let frequencies = [];

  // if (!period) {
  //   // Default: current year (yearly) and current month (monthly)
  //   const now = new Date();
  //   const currentYear = now.getFullYear().toString();
  //   const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
  //   periods = [currentYear, currentMonth];
  //   frequencies = ["yearly", "monthly"];
  // } else if (/^\d{4}$/.test(period)) {
  //   // Year filter: only yearly balances for that year
  //   periods = [period];
  //   frequencies = ["yearly"];
  // } else if (/^\d{4}-\d{2}$/.test(period)) {
  //   // Month filter: only monthly balances for that month
  //   periods = [period];
  //   frequencies = ["monthly"];
  // } else {
  //   throw new ApiError(400, "Invalid period format. Use YYYY or YYYY-MM");
  // }
  const balanceDoc = await StaffLeaveBalance.findOne({
    organizationId,
    employeeId,

  })
  if (!balanceDoc) {
    throw new ApiError(404, "Leave balance not found");
  }

  // Build the query to fetch all relevant leave balances
  // const query = {
  //   organizationId,
  //   employeeId,
  //   isDeleted: false,
  //   $or: periods.map((p, index) => ({
  //     period: p,
  //     frequency: frequencies[index],
  //   })),
  // };

  // const balances = await LeaveBalance.find(query);
  // console.log(balances);

  // Enrich with employee details and filter by gender
  const formattedBalances = balanceDoc.leaveCategories
    .map((balance) => {
      const leaveType = balance.categoryName;

      // Gender-based filtering
      if (leaveType === "Maternity Leave" && employeeGender !== "female")
        return null;
      if (leaveType === "Paternity Leave" && employeeGender !== "male")
        return null;

      return {
        _id: balance.categoryId,
        leaveType: balance.categoryName,
        frequency: "yearly",
        period: new Date().getFullYear().toString(),
        balance: balance.leaveBalance,
        leaveTaken: balance.availedLeaves || 0,
        employeeName:
          `${employee.personal?.firstName || ""} ${employee.personal?.lastName || ""}`.trim(),
        gender: employeeGender,
      };
    })
    .filter(Boolean);

  successResponse(
    res,
    "Employee leave balances fetched successfully",
    formattedBalances,
    200,
  );
});

export const updateEmployeeLeaveBalance = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;
  const { employeeId } = req.params; // or from body – adjust as needed
  const { leaveType, frequency, period, balance, leaveTaken } = req.body;

  // Validate required fields
  if (!employeeId || !leaveType || !frequency || !period) {
    throw new ApiError(
      400,
      "Missing required fields: employeeId, leaveType, frequency, period",
    );
  }
  if (balance === undefined && leaveTaken === undefined) {
    throw new ApiError(
      400,
      "At least one of 'balance' or 'leaveTaken' must be provided",
    );
  }

  // Verify that the employee belongs to the same organisation
  const employee = await Employee.findOne({ _id: employeeId, organizationId });
  if (!employee) {
    throw new ApiError(404, "Employee not found in your organisation");
  }

  // Optionally, validate that the leave type exists in the organisation's policy
  const leavePolicy = await LeavePolicy.findOne({
    organizationId,
    isDeleted: false,
  });
  if (!leavePolicy) {
    throw new ApiError(
      404,
      "No active leave policy found for this organization",
    );
  }
  const ruleExists = leavePolicy.rules.some(
    (rule) => rule.leaveType === leaveType,
  );
  if (!ruleExists) {
    throw new ApiError(
      400,
      `Leave type "${leaveType}" is not defined in the policy`,
    );
  }

  // Validate period format (basic check)
  if (frequency === "yearly" && !/^\d{4}$/.test(period)) {
    throw new ApiError(
      400,
      "Yearly period must be a 4‑digit year (e.g., 2025)",
    );
  }
  if (frequency === "monthly" && !/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
    throw new ApiError(
      400,
      "Monthly period must be in YYYY-MM format (e.g., 2025-03)",
    );
  }

  // Prepare update object (only provided fields)
  const updateData = {};
  if (balance !== undefined) {
    if (typeof balance !== "number" || balance < 0) {
      throw new ApiError(400, "Balance must be a non‑negative number");
    }
    updateData.balance = balance;
  }
  if (leaveTaken !== undefined) {
    if (typeof leaveTaken !== "number" || leaveTaken < 0) {
      throw new ApiError(400, "Leave taken must be a non‑negative number");
    }
    updateData.leaveTaken = leaveTaken;
  }

  // Use findOneAndUpdate with upsert to create or update the balance record
  const updatedBalance = await StaffLeaveBalance.findOneAndUpdate(
    {
      organizationId,
      employeeId,
      leaveType,
      frequency,
      period,
    },
    { $set: updateData },
    { new: true, upsert: true, runValidators: true },
  );

  successResponse(
    res,
    "Leave balance updated successfully",
    updatedBalance,
    200,
  );
});

export const bulkUpdateLeaveBalanceFromExcel = asyncHandler(
  async (req, res) => {
    const { organizationId } = req.user;

    if (!req.file) {
      throw new ApiError(400, "Excel file is required");
    }

    const workbook = new ExcelJs.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new ApiError(400, "Excel sheet not found");
    }

    const rows = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      const employeeCodeRaw = row.getCell(1).value;
      const casualLeaveRaw = row.getCell(2).value;

      // Handle ExcelJS object values
      const employeeCode =
        employeeCodeRaw?.text || employeeCodeRaw?.result || employeeCodeRaw;

      const casualLeaveBalance =
        casualLeaveRaw?.result || casualLeaveRaw?.text || casualLeaveRaw;

      const balance = Number(casualLeaveBalance);

      if (!employeeCode || isNaN(balance)) return;

      rows.push({
        employeeCode: employeeCode.toString().trim(),
        balance,
      });
    });

    if (!rows.length) {
      throw new ApiError(400, "No valid rows found in Excel");
    }

    // ✅ FIXED: correct schema path
    const employees = await Employee.find({
      organizationId,
      "employment.employeeCode": { $in: rows.map((r) => r.employeeCode) },
    }).select("_id employment.employeeCode");

    const employeeMap = new Map();

    employees.forEach((emp) => {
      employeeMap.set(emp.employment.employeeCode, emp._id);
    });

    // Validate Leave Policy
    const leavePolicy = await LeavePolicy.findOne({
      organizationId,
      isDeleted: false,
    });

    if (!leavePolicy) {
      throw new ApiError(
        404,
        "No active leave policy found for this organization"
      );
    }

    const leaveType = "Casual Leave";

    const ruleExists = leavePolicy.rules.some(
      (rule) => rule.leaveType === leaveType
    );

    if (!ruleExists) {
      throw new ApiError(
        400,
        `Leave type "${leaveType}" not defined in policy`
      );
    }

    const period = new Date().getFullYear().toString();
    const frequency = "yearly";

    const operations = [];

    rows.forEach((row) => {
      const employeeId = employeeMap.get(row.employeeCode);

      if (!employeeId) return;

      operations.push({
        updateOne: {
          filter: {
            organizationId,
            employeeId,
            "leaveCategories.categoryName": leaveType,
          },
          update: {
            $set: {
              "leaveCategories.$.leaveBalance": row.balance,
              updatedAt: new Date(),
            },
          },
        },
      });
    });

    if (!operations.length) {
      throw new ApiError(400, "No matching employees found to update");
    }

    const result = await StaffLeaveBalance.bulkWrite(operations);

    return successResponse(
      res,
      "Bulk leave balance updated successfully",
      {
        matchedEmployees: operations.length,
        totalRows: rows.length,
        result,
      },
      200
    );
  }
);