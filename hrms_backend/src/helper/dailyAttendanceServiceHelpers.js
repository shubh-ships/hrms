import mongoose from "mongoose";
import moment from "moment";
import Employee from "../models/employee.Model.js";
import { Office } from "../models/organizationTiming.Model.js";
import DailyAttendance from "../models/dailyscanAttendance.js";
import ApiError from "../utils/apiError.js";
import { Leave } from "../models/leave.Model.js";
// import LeaveBalance from "../models/leaveBalance.Model.js";

export const getShiftMinutesForEmployee = async (organizationId, shiftName) => {
  const office = await Office.findOne({ organizationId }).lean();
  if (!office) return null;
  const shift = office.shifts.find((s) => s.name === shiftName);
  if (!shift) return null;
  const shiftStart = timeToMinutes(shift.startTime);
  const shiftEnd = timeToMinutes(shift.endTime);
  let totalShiftMinutes = shiftEnd - shiftStart;
  let totalBreakMinutes = 0;
  (shift.breaks || []).forEach((b) => {
    totalBreakMinutes += timeToMinutes(b.endTime) - timeToMinutes(b.startTime);
  });
  return {
    shiftMinutes: totalShiftMinutes,
    totalShiftMinutes,
    totalBreakMinutes,
    shift,
  };
};

// Convert time string to minutes
export const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

// Get or create daily record
export const getOrCreateDailyRecord = async (userId, organizationId, date) => {
  const startOfDay = moment(date).startOf("day").toDate();
  const endOfDay = moment(date).endOf("day").toDate();

  let record = await DailyAttendance.findOne({
    userId,
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  if (!record) {
    record = await DailyAttendance.create({
      userId,
      organizationId,
      date: startOfDay,
      status: "NOT_MARKED",
      approvalType: "AUTO",
      isFinalized: false,
    });
  }

  return record;
};

// Calculate work minutes from scans
export const calculateWorkMinutes = (scans) => {
  let totalWorkMinutes = 0;
  let totalBreakMinutes = 0;

  const sortedScans = [...scans].sort(
    (a, b) => new Date(a.scanTime) - new Date(b.scanTime),
  );

  for (let i = 0; i < sortedScans.length; i += 2) {
    const inScan = moment.utc(sortedScans[i].scanTime);
    const outScan = sortedScans[i + 1]
      ? moment.utc(sortedScans[i + 1].scanTime)
      : null;

    if (!outScan) break;

    const sessionMinutes = outScan.diff(inScan, "minutes");
    sortedScans[i].sessionMinutes = sessionMinutes;
    totalWorkMinutes += sessionMinutes;

    if (i + 2 < sortedScans.length) {
      const nextIn = moment.utc(sortedScans[i + 2].scanTime);
      const breakMinutes = nextIn.diff(outScan, "minutes");
      sortedScans[i + 1].breakMinutes = breakMinutes;
      totalBreakMinutes += breakMinutes;
    }
  }
  //TODO :- if want to add break also in total working minutes then add totalbreakminutes in total work minutes
  return { totalWorkMinutes, totalBreakMinutes, updatedScans: sortedScans };
};

// Get employee shift
export const getEmployeeShift = async (userId) => {
  const employee = await Employee.findOne({ userId });
  if (!employee) return null;

  const organizationId = employee.organizationId;
  const office = await Office.findOne({ organizationId }).lean();
  if (!office || !office.shifts) return null;

  const shift = office.shifts.find(
    (s) => s._id.toString() === employee.shiftId.toString(),
  );
  return shift || null;
};

// Take shift snapshot
export const takeShiftSnapshot = async (record, userId) => {
  const employeeShift = await getEmployeeShift(userId);

  if (!employeeShift) {
    throw new Error("Employee shift not found");
  }

  record.shiftSnapshot = {
    shiftName: employeeShift.name,
    shiftStart: employeeShift.startTime,
    shiftEnd: employeeShift.endTime,
    minFullDayMinutes: employeeShift.minFullDayMinutes,
    minHalfDayMinutes: employeeShift.minHalfDayMinutes,
    lateGraceMinutes: employeeShift.lateGraceMinutes,
    earlyGraceMinutes: employeeShift.earlyGraceMinutes,
  };

  return record;
};

// Calculate late/early/overtime
export const calculateAttendanceMetrics = (record) => {
  if (!record.shiftSnapshot || record.scans.length < 2) {
    return record;
  }

  const dateStr = moment(record.date).format("YYYY-MM-DD");
  const firstScan = moment.utc(record.scans[0].scanTime);
  const lastScan = moment.utc(record.scans[record.scans.length - 1].scanTime);

  const shiftStart = moment.utc(
    `${dateStr}T${record.shiftSnapshot.shiftStart}:00Z`,
  );
  const shiftEnd = moment.utc(
    `${dateStr}T${record.shiftSnapshot.shiftEnd}:00Z`,
  );

  // Late login calculation
  const lateThreshold = shiftStart
    .clone()
    .add(record.shiftSnapshot.lateGraceMinutes, "minutes");
  record.isLateLogin = firstScan.isAfter(lateThreshold);
  record.lateLoginMinutes = record.isLateLogin
    ? Math.max(0, firstScan.diff(lateThreshold, "minutes"))
    : 0;

  // Early logout calculation
  const earlyThreshold = shiftEnd
    .clone()
    .subtract(record.shiftSnapshot.earlyGraceMinutes, "minutes");
  record.isEarlyLogout = lastScan.isBefore(earlyThreshold);
  record.earlyLogoutMinutes = record.isEarlyLogout
    ? Math.max(0, earlyThreshold.diff(lastScan, "minutes"))
    : 0;

  // Overtime calculation
  const standardWorkMinutes = shiftEnd.diff(shiftStart, "minutes");
  record.isOvertime = record.totalWorkMinutes > standardWorkMinutes;
  record.totalOvertimeMinutes = record.isOvertime
    ? record.totalWorkMinutes - standardWorkMinutes
    : 0;

  return record;
};

// Auto evaluate attendance
export const autoEvaluateAttendance = (record) => {
  const { shiftSnapshot, totalWorkMinutes } = record;

  if (!shiftSnapshot) {
    record.status = "PENDING_APPROVAL";
    record.approvalType = "MANUAL";
    return record;
  }

  // Rule 1: Check for full day
  if (totalWorkMinutes >= shiftSnapshot.minFullDayMinutes) {
    const hasViolations = record.isLateLogin || record.isEarlyLogout;

    if (!hasViolations) {
      // Auto approve as full day
      record.status = "PRESENT";
      record.approvalType = "AUTO";
      record.salaryImpact = {
        payableFraction: 1,
        isPaidLeaveUsed: false,
        fineAmount: 0,
        overtimePayMinutes: record.totalOvertimeMinutes,
      };
      record.isFinalized = true;
      return record;
    } else {
      // Needs approval
      record.status = "PENDING_APPROVAL";
      record.approvalType = "MANUAL";
      return record;
    }
  }

  // Rule 2: Check for half day
  if (totalWorkMinutes >= shiftSnapshot.minHalfDayMinutes) {
    record.status = "PENDING_APPROVAL";
    record.approvalType = "MANUAL";
    return record;
  }

  // Rule 3: Less than half day
  record.status = "PENDING_APPROVAL";
  record.approvalType = "MANUAL";
  return record;
};

// Get shift minutes
export const getShiftMinutes = (shift) => {
  if (!shift) return null;

  const shiftStart = timeToMinutes(shift.startTime);
  const shiftEnd = timeToMinutes(shift.endTime);
  let totalShiftMinutes = shiftEnd - shiftStart;
  let totalBreakMinutes = 0;

  (shift.breaks || []).forEach((b) => {
    totalBreakMinutes += timeToMinutes(b.endTime) - timeToMinutes(b.startTime);
  });

  return {
    shiftMinutes: totalShiftMinutes - totalBreakMinutes,
    totalShiftMinutes,
    totalBreakMinutes,
  };
};

/**
 * Get attendance records for a specific date and organization,
 * optionally filtered by employee list.
 */
export const getAttendanceRecordsForDate = async (
  organizationId,
  date,
  employeeIds = null,
) => {
  const start = moment(date).startOf("day").toDate();
  const end = moment(date).endOf("day").toDate();

  const match = {
    organizationId: new mongoose.Types.ObjectId(organizationId),
    date: { $gte: start, $lte: end },
  };
  if (employeeIds) {
    match.userId = {
      $in: employeeIds.map((id) => new mongoose.Types.ObjectId(id)),
    };
  }

  return DailyAttendance.aggregate([
    { $match: match },
    // Optional: populate user/employee details later
  ]);
};

/**
 * Get approved leaves for a specific date and organization.
 */
export const getApprovedLeavesForDate = async (organizationId, date) => {
  const targetDate = moment(date).startOf("day").toDate();
  return Leave.aggregate([
    {
      $match: {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        status: "approved",
        startDate: { $lte: targetDate },
        endDate: { $gte: targetDate },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$employeeId",
        leaveType: { $first: "$leaveType" },
        durationType: { $first: "$durationType" },
      },
    },
  ]);
};

export const getUpcomingLeaves = async (organizationId, fromDate) => {
  const targetDate = moment(fromDate).startOf("day").toDate();
  return Leave.aggregate([
    {
      $match: {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        status: "approved",
        startDate: { $gt: targetDate },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$employeeId",
        leaveType: { $first: "$leaveType" },
        durationType: { $first: "$durationType" },
        startDate: { $first: "$startDate" },
      },
    },
    { $sort: { startDate: 1 } },
  ]);
};

/**
 * Compute "fine minutes" (late login + early logout) from attendance record.
 */
export const computeFineMinutes = (record) => {
  return (record.lateLoginMinutes || 0) + (record.earlyLogoutMinutes || 0);
};

/**
 * Enrich attendance record with user/employee details.
 */
export const enrichWithEmployeeDetails = async (records) => {
  const userIds = records.map((r) => r.userId);
  const employees = await Employee.find({ userId: { $in: userIds } })
    .populate("departmentId", "name")
    .populate("shiftId", "name")
    .lean();

  const empMap = {};
  employees.forEach((e) => {
    empMap[e.userId.toString()] = {
      employeeId: e._id,
      employeeName: e.name,
      departmentId: e.departmentId?._id,
      departmentName: e.departmentId?.name,
      shiftId: e.shiftId?._id,
      shiftName: e.shiftId?.name,
    };
  });

  return records.map((rec) => ({
    ...rec,
    employeeDetails: empMap[rec.userId.toString()] || null,
  }));
};

/**
 * Get employeeId from userId
 */
export const getEmployeeIdFromUserId = async (userId) => {
  const employee = await Employee.findOne({ userId }).select("_id");
  if (!employee) throw new ApiError(404, "Employee not found for this user");
  return employee._id;
};

/**
 * Calculate leave period (year) from date
 */
export const getLeavePeriod = (date) => {
  return new Date(date).getFullYear().toString();
};

/**
 * Deduct leave balance for a given employee, leave type, and days
 * Uses transaction session if provided
 */
export const deductLeaveBalance = async (
  employeeId,
  leaveType,
  days,
  organizationId,
  period,
  session = null,
) => {
  const balance = await LeaveBalance.findOne({
    employeeId,
    leaveType,
    period,
    organizationId,
    isDeleted: false,
  }).session(session);

  if (!balance) {
    throw new ApiError(
      400,
      `No leave balance found for ${leaveType} in period ${period}`,
    );
  }
  if (balance.balance < days) {
    throw new ApiError(
      400,
      `Insufficient ${leaveType} balance. Available: ${balance.balance}, Requested: ${days}`,
    );
  }

  balance.balance -= days;
  balance.leaveTaken += days;
  balance.updatedAt = new Date();
  await balance.save({ session });
  return balance;
};

/**
 * Add back leave balance (for reversal)
 */
export const addBackLeaveBalance = async (
  employeeId,
  leaveType,
  days,
  organizationId,
  period,
  session = null,
) => {
  const balance = await LeaveBalance.findOne({
    employeeId,
    leaveType,
    period,
    organizationId,
    isDeleted: false,
  }).session(session);

  if (!balance) {
    throw new ApiError(
      400,
      `No leave balance found for ${leaveType} in period ${period}`,
    );
  }

  balance.balance += days;
  balance.leaveTaken -= days;
  balance.updatedAt = new Date();
  await balance.save({ session });
  return balance;
};

/**
 * Create an approved leave record for a single day
 */
export const createLeaveRecord = async (
  employeeId,
  leaveType,
  date,
  durationType, // "fullDay" or "halfDay"
  approverId,
  remarks,
  organizationId,
  session = null,
) => {
  const totalDays = durationType === "fullDay" ? 1 : 0.5;

  const leave = new Leave({
    organizationId,
    employeeId,
    leaveType,
    durationType,
    startDate: new Date(date),
    endDate: new Date(date),
    totalDays,
    reason: remarks || "Manual attendance marked as paid leave",
    status: "approved",
    approvalHistory: [
      {
        approverId,
        status: "approved",
        date: new Date(),
        remarks: remarks || "Approved via manual attendance",
      },
    ],
    isDeleted: false,
  });

  await leave.save({ session });
  return leave;
};

/**
 * Cancel an existing leave record (revert balance already handled separately)
 */
export const cancelLeaveRecord = async (leaveId, session = null) => {
  const leave = await Leave.findById(leaveId).session(session);
  if (!leave) return null;
  leave.status = "cancelled";
  leave.updatedAt = new Date();
  await leave.save({ session });
  return leave;
};

export const getDatesInMonth = (year, month) => {
  const start = moment(`${year}-${month}-01`, "YYYY-M-D").startOf("month");
  const end = moment(start).endOf("month");
  const dates = [];
  let current = start.clone();
  while (current.isSameOrBefore(end, "day")) {
    dates.push(current.format("YYYY-MM-DD"));
    current.add(1, "day");
  }
  return dates;
};
