import mongoose from "mongoose";
import moment from "moment";
import DailyAttendance from "../models/dailyscanAttendance.js";
import Employee from "../models/employee.Model.js";
import { Office } from "../models/organizationTiming.Model.js";
import ApiError from "../utils/apiError.js";
import { Leave } from "../models/leave.Model.js";
import Department from "../models/department.Model.js";

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

// Handle daily scan (punch in/out)
export const userDailyScan = async (userId, organizationId, scanTime) => {
  //   try {
  // const { userId, organizationId, scanTime } = req.body;

  // Validation
  if (!userId || !organizationId || !scanTime) {
    throw new ApiError(
      400,
      "Missing required fields: userId, organizationId, scanTime",
    );
  }

  const scanMoment = moment.utc(scanTime);
  const date = scanMoment.format("YYYY-MM-DD");

  // Get or create daily record
  let record = await getOrCreateDailyRecord(userId, organizationId, date);

  // Check if record is finalized
  if (record.isFinalized) {
    throw new ApiError(
      400,
      "Attendance record is already finalized and cannot be modified",
    );
  }

  // Check last scan to determine type
  const lastScan = record.scans[record.scans.length - 1];
  const scanType = !lastScan || lastScan.type === "OUT" ? "IN" : "OUT";

  // Add new scan
  record.scans.push({
    scanTime: scanMoment.toDate(),
    type: scanType,
  });

  // Update status based on scan type
  if (scanType === "IN") {
    record.status = "PUNCHED_IN";
  } else {
    record.status = "PUNCHED_OUT";
  }

  // If punched out, calculate everything
  if (scanType === "OUT" && record.scans.length >= 2) {
    // Calculate work minutes
    const { totalWorkMinutes, totalBreakMinutes, updatedScans } =
      calculateWorkMinutes(record.scans);
    record.scans = updatedScans;
    record.totalWorkMinutes = totalWorkMinutes;
    record.totalBreakMinutes = totalBreakMinutes;
    record.officeTotalWorkingMinutes = totalWorkMinutes + totalBreakMinutes;

    // Take shift snapshot
    record = await takeShiftSnapshot(record, userId);
    // Calculate late/early/overtime
    record = calculateAttendanceMetrics(record);
    // Auto evaluate attendance
    record = autoEvaluateAttendance(record);
  }

  // Save record
  await record.save();

  // Response
  // res.status(200).json({
  //   success: true,
  //   message: `Successfully ${scanType === "IN" ? "punched in" : "punched out"}`,
  //   data: {
  //     id: record._id,
  //     userId: record.userId,
  //     date: record.date,
  //     status: record.status,
  //     scanType,
  //     scanTime: scanMoment.toISOString(),
  //     isFinalized: record.isFinalized
  //   }
  // });

  return {
    id: record._id,
    userId: record.userId,
    date: record.date,
    status: record.status,
    scanType,
    scanTime: scanMoment.toISOString(),
    isFinalized: record.isFinalized,
  };

  //   } catch (error) {
  //     next(error);
  //   }
};

// Get today's attendance status
export const getTodayAttendance = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const today = moment().format("YYYY-MM-DD");

    const record = await DailyAttendance.findOne({
      userId,
      date: {
        $gte: moment(today).startOf("day").toDate(),
        $lte: moment(today).endOf("day").toDate(),
      },
    });

    if (!record) {
      return res.status(200).json({
        success: true,
        data: {
          status: "NOT_MARKED",
          lastPunch: null,
          nextAction: "IN",
          isFinalized: false,
        },
      });
    }

    const lastScan = record.scans[record.scans.length - 1];

    res.status(200).json({
      success: true,
      data: {
        id: record._id,
        status: record.status,
        lastPunch: lastScan
          ? {
              type: lastScan.type,
              time: lastScan.scanTime,
            }
          : null,
        nextAction: lastScan && lastScan.type === "IN" ? "OUT" : "IN",
        isFinalized: record.isFinalized,
        totalWorkMinutes: record.totalWorkMinutes,
        totalBreakMinutes: record.totalBreakMinutes,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create manual attendance
export const createEmployeeManualAttendance = async (data, approverId) => {
  //   try {
  const {
    userId,
    organizationId,
    date,
    status,
    loginTime,
    logoutTime,
    remarks,
    fineAmount = 0,
    overtimePayMinutes = 0,
  } = data;

  // Validation
  if (!userId || !organizationId || !date || !status) {
    throw new ApiError(400, "Missing required fields");
  }

  // Validate status
  const validStatuses = [
    "PRESENT",
    "HALF_DAY",
    "ABSENT",
    "WEEKLY_OFF",
    "HOLIDAY",
    "COMPENSATORY_OFF",
    "PAID_LEAVE",
  ];

  if (!validStatuses.includes(status)) {
    throw new ApiError(
      400,
      "Invalid status. Allowed: " + validStatuses.join(", "),
    );
  }

  // For present/half day, validate login/logout times
  if (
    (status === "PRESENT" || status === "HALF_DAY") &&
    (!loginTime || !logoutTime)
  ) {
    throw new ApiError(
      400,
      "Login and logout time required for present/half day",
    );
  }

  // Check for existing record
  const startOfDay = moment(date).startOf("day").toDate();
  const endOfDay = moment(date).endOf("day").toDate();

  let record = await DailyAttendance.findOne({
    userId,
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  // Base record data
  const baseRecord = {
    userId,
    organizationId,
    date: startOfDay,
    status,
    approvalType: "MANUAL",
    approvedBy: approverId, // Assuming user id from auth middleware
    approvedAt: new Date(),
    approvalRemarks: remarks,
    isFinalized: true,
    scans: [],
    officeTotalWorkingMinutes: 0,
    totalWorkMinutes: 0,
    totalBreakMinutes: 0,
    isLateLogin: false,
    lateLoginMinutes: 0,
    isEarlyLogout: false,
    earlyLogoutMinutes: 0,
    isOvertime: false,
    totalOvertimeMinutes: 0,
    shiftSnapshot: null,
  };

  // Handle different status types
  if (status === "PRESENT" || status === "HALF_DAY") {
    // Add punches
    baseRecord.scans = [
      {
        scanTime: moment.utc(loginTime).toDate(),
        type: "IN",
        sessionMinutes: moment
          .utc(logoutTime)
          .diff(moment.utc(loginTime), "minutes"),
      },
      {
        scanTime: moment.utc(logoutTime).toDate(),
        type: "OUT",
      },
    ];

    // Calculate work minutes
    const workMinutes = moment
      .utc(logoutTime)
      .diff(moment.utc(loginTime), "minutes");
    baseRecord.totalWorkMinutes = workMinutes;
    baseRecord.officeTotalWorkingMinutes = workMinutes;

    // Get shift snapshot for reporting
    try {
      const employeeShift = await getEmployeeShift(userId);
      if (employeeShift) {
        baseRecord.shiftSnapshot = {
          shiftName: employeeShift.name,
          shiftStart: employeeShift.startTime,
          shiftEnd: employeeShift.endTime,
          minFullDayMinutes: employeeShift.minFullDayMinutes,
          minHalfDayMinutes: employeeShift.minHalfDayMinutes,
          lateGraceMinutes: employeeShift.lateGraceMinutes,
          earlyGraceMinutes: employeeShift.earlyGraceMinutes,
        };

        // Calculate late/early for reporting only
        const shiftStart = moment.utc(
          `${moment(date).format("YYYY-MM-DD")}T${employeeShift.startTime}:00Z`,
        );
        const shiftEnd = moment.utc(
          `${moment(date).format("YYYY-MM-DD")}T${employeeShift.endTime}:00Z`,
        );
        const loginMoment = moment.utc(loginTime);
        const logoutMoment = moment.utc(logoutTime);

        const lateThreshold = shiftStart
          .clone()
          .add(employeeShift.lateGraceMinutes, "minutes");
        baseRecord.isLateLogin = loginMoment.isAfter(lateThreshold);
        baseRecord.lateLoginMinutes = baseRecord.isLateLogin
          ? Math.max(0, loginMoment.diff(lateThreshold, "minutes"))
          : 0;

        const earlyThreshold = shiftEnd
          .clone()
          .subtract(employeeShift.earlyGraceMinutes, "minutes");
        baseRecord.isEarlyLogout = logoutMoment.isBefore(earlyThreshold);
        baseRecord.earlyLogoutMinutes = baseRecord.isEarlyLogout
          ? Math.max(0, earlyThreshold.diff(logoutMoment, "minutes"))
          : 0;
      }
    } catch (error) {
      // Shift not found - still create record without shift data
      console.warn("Shift not found for manual attendance:", error.message);
    }
  }

  // Set salary impact
  let payableFraction = 0;
  if (
    [
      "PRESENT",
      "WEEKLY_OFF",
      "HOLIDAY",
      "COMPENSATORY_OFF",
      "PAID_LEAVE",
    ].includes(status)
  ) {
    payableFraction = 1;
  } else if (status === "HALF_DAY") {
    payableFraction = 0.5;
  }

  baseRecord.salaryImpact = {
    payableFraction,
    fineAmount,
    overtimePayMinutes,
    isPaidLeaveUsed: false,
  };

  // Update or create record
  if (record) {
    Object.assign(record, baseRecord);
    await record.save();
  } else {
    record = await DailyAttendance.create(baseRecord);
  }

  // Response
  // res.status(200).json({
  //   success: true,
  //   message: "Manual attendance created successfully",
  //   data: {
  //     id: record._id,
  //     userId: record.userId,
  //     date: record.date,
  //     status: record.status,
  //     approvalType: record.approvalType,
  //     isFinalized: record.isFinalized,
  //     salaryImpact: record.salaryImpact
  //   }
  // });

  return {
    id: record._id,
    userId: record.userId,
    date: record.date,
    status: record.status,
    approvalType: record.approvalType,
    isFinalized: record.isFinalized,
    salaryImpact: record.salaryImpact,
  };

  //   } catch (error) {
  //     next(error);
  //   }
};

// Bulk manual attendance
export const bulkManualAttendance = async (req, res, next) => {
  try {
    const { attendanceList } = req.body;

    if (!Array.isArray(attendanceList) || attendanceList.length === 0) {
      throw new ApiError(400, "attendanceList array is required");
    }

    const results = [];
    const errors = [];

    for (const item of attendanceList) {
      try {
        // Prepare request-like object for createManualAttendance logic
        const mockReq = {
          body: {
            userId: item.userId,
            organizationId: item.organizationId,
            date: item.date,
            status: item.status,
            loginTime: item.loginTime,
            logoutTime: item.logoutTime,
            remarks: item.remarks,
            fineAmount: item.fineAmount || 0,
            overtimePayMinutes: item.overtimePayMinutes || 0,
          },
          user: { id: req.user.id },
        };

        // We'll create a simplified version for bulk
        const startOfDay = moment(item.date).startOf("day").toDate();
        const endOfDay = moment(item.date).endOf("day").toDate();

        // Check for existing record
        let record = await DailyAttendance.findOne({
          userId: item.userId,
          date: { $gte: startOfDay, $lte: endOfDay },
        });

        const baseRecord = {
          userId: item.userId,
          organizationId: item.organizationId,
          date: startOfDay,
          status: item.status,
          approvalType: "MANUAL",
          approvedBy: req.user.id,
          approvedAt: new Date(),
          approvalRemarks: item.remarks,
          isFinalized: true,
          scans: [],
          salaryImpact: {
            payableFraction: [
              "PRESENT",
              "WEEKLY_OFF",
              "HOLIDAY",
              "COMPENSATORY_OFF",
              "PAID_LEAVE",
            ].includes(item.status)
              ? 1
              : item.status === "HALF_DAY"
                ? 0.5
                : 0,
            fineAmount: item.fineAmount || 0,
            overtimePayMinutes: item.overtimePayMinutes || 0,
            isPaidLeaveUsed: false,
          },
        };

        if (record) {
          Object.assign(record, baseRecord);
          await record.save();
        } else {
          record = await DailyAttendance.create(baseRecord);
        }

        results.push({
          userId: item.userId,
          date: item.date,
          status: item.status,
          recordId: record._id,
          success: true,
        });
      } catch (itemError) {
        errors.push({
          userId: item.userId,
          date: item.date,
          error: itemError.message,
          success: false,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Processed ${results.length} records successfully, ${errors.length} failed`,
      data: { results, errors },
    });
  } catch (error) {
    next(error);
  }
};

// Get pending approval records
export const getPendingEmpApprovals = async (
  organizationId,
  startDate,
  endDate,
  userIds,
  status = "PENDING_APPROVAL",
) => {
  // Build query
  const query = {
    organizationId,
    status,
    isFinalized: false,
  };

  // Date filter
  if (startDate && endDate) {
    query.date = {
      $gte: moment(startDate).startOf("day").toDate(),
      $lte: moment(endDate).endOf("day").toDate(),
    };
  }

  // User filter
  if (userIds) {
    const userIdArray = Array.isArray(userIds) ? userIds : userIds.split(",");
    query.userId = { $in: userIdArray };
  }

  // Get records
  const records = await DailyAttendance.find(query)
    .populate("userId", "name email employeeId department")
    .populate("approvedBy", "name email")
    .sort({ date: -1, createdAt: -1 });

  // Format response
  const formattedRecords = records.map((record) => ({
    id: record._id,
    userId: record.userId?._id,
    userName: record.userId?.name,
    employeeId: record.userId?.employeeId,
    department: record.userId?.department,
    date: record.date,
    status: record.status,
    approvalType: record.approvalType,
    scans: record.scans.map((scan) => ({
      time: scan.scanTime,
      type: scan.type,
      sessionMinutes: scan.sessionMinutes,
      breakMinutes: scan.breakMinutes,
    })),
    totalWorkMinutes: record.totalWorkMinutes,
    totalBreakMinutes: record.totalBreakMinutes,
    lateLoginMinutes: record.lateLoginMinutes,
    earlyLogoutMinutes: record.earlyLogoutMinutes,
    overtimeMinutes: record.totalOvertimeMinutes,
    shiftSnapshot: record.shiftSnapshot,
    createdAt: record.createdAt,
  }));

  return {
    records: formattedRecords,
    count: records.length,
    summary: {
      pending: records.filter((r) => r.status === "PENDING_APPROVAL").length,
      total: records.length,
    },
  };
};

// Approve single attendance record
export const approveEmpAttendance = async (
  recordId,
  status,
  remarks,
  fineAmount = 0,
  overtimePayMinutes = 0,
  approverId,
) => {
  // Validation
  if (
    !status ||
    ![
      "PRESENT",
      "HALF_DAY",
      "ABSENT",
      "WEEKLY_OFF",
      "HOLIDAY",
      "COMPENSATORY_OFF",
      "PAID_LEAVE",
    ].includes(status)
  ) {
    throw new ApiError(
      400,
      "Status must be PRESENT, HALF_DAY, WEEKLY_OFF, HOLIDAY, COMPENSATORY_OFF, or PAID_LEAVE",
    );
  }

  // Get record
  const record = await DailyAttendance.findById(recordId).populate(
    "userId",
    "name email",
  );

  if (!record) {
    throw new ApiError(404, "Attendance record not found");
  }

  if (record.isFinalized) {
    throw new ApiError(
      400,
      "Record is already finalized and cannot be modified",
    );
  }

  if (record.status !== "PENDING_APPROVAL") {
    throw new ApiError(400, "Only PENDING_APPROVAL records can be approved");
  }

  // Calculate payable fraction
  let payableFraction = 0;
  if (
    [
      "PRESENT",
      "WEEKLY_OFF",
      "HOLIDAY",
      "COMPENSATORY_OFF",
      "PAID_LEAVE",
    ].includes(status)
  )
    payableFraction = 1;
  else if (status === "HALF_DAY") payableFraction = 0.5;

  // Update record
  record.status = status;
  record.approvalType = "MANUAL";
  record.approvedBy = approverId;
  record.approvedAt = new Date();
  record.approvalRemarks = remarks;
  record.salaryImpact = {
    payableFraction,
    fineAmount: Number(fineAmount) || 0,
    overtimePayMinutes: Number(overtimePayMinutes) || 0,
    isPaidLeaveUsed: false,
  };
  record.isFinalized = true;

  await record.save();

  // Response
  return {
    id: record._id,
    userId: record.userId?._id,
    userName: record.userId?.name,
    date: record.date,
    status: record.status,
    approvalType: record.approvalType,
    approvedBy: approverId,
    approvedAt: record.approvedAt,
    salaryImpact: record.salaryImpact,
    isFinalized: record.isFinalized,
  };
};

// Bulk approve attendance records
export const bulkApproveAttendance = async (req, res, next) => {
  try {
    const {
      recordIds,
      status,
      remarks,
      fineAmount = 0,
      overtimePayMinutes = 0,
    } = req.body;

    // Validation
    if (!Array.isArray(recordIds) || recordIds.length === 0) {
      throw new ApiError(400, "recordIds array is required");
    }

    if (
      !status ||
      ![
        "PRESENT",
        "HALF_DAY",
        "ABSENT",
        "WEEKLY_OFF",
        "HOLIDAY",
        "COMPENSATORY_OFF",
        "PAID_LEAVE",
      ].includes(status)
    ) {
      throw new ApiError(
        400,
        "Status must be PRESENT, HALF_DAY, WEEKLY_OFF, HOLIDAY, COMPENSATORY_OFF, or PAID_LEAVE",
      );
    }

    // Calculate payable fraction
    let payableFraction = 0;
    if (
      [
        "PRESENT",
        "WEEKLY_OFF",
        "HOLIDAY",
        "COMPENSATORY_OFF",
        "PAID_LEAVE",
      ].includes(status)
    )
      payableFraction = 1;
    else if (status === "HALF_DAY") payableFraction = 0.5;

    // Update records
    const updateResult = await DailyAttendance.updateMany(
      {
        _id: { $in: recordIds },
        status: "PENDING_APPROVAL",
        isFinalized: false,
      },
      {
        $set: {
          status,
          approvalType: "MANUAL",
          approvedBy: req.user.id,
          approvedAt: new Date(),
          approvalRemarks: remarks,
          salaryImpact: {
            payableFraction,
            fineAmount: Number(fineAmount) || 0,
            overtimePayMinutes: Number(overtimePayMinutes) || 0,
            isPaidLeaveUsed: false,
          },
          isFinalized: true,
        },
      },
    );

    // Get updated records
    const updatedRecords = await DailyAttendance.find({
      _id: { $in: recordIds },
    }).populate("userId", "name email");

    res.status(200).json({
      success: true,
      message: `Approved ${updateResult.modifiedCount} records`,
      data: {
        matched: updateResult.matchedCount,
        modified: updateResult.modifiedCount,
        records: updatedRecords.map((record) => ({
          id: record._id,
          userId: record.userId?._id,
          userName: record.userId?.name,
          date: record.date,
          status: record.status,
          isFinalized: record.isFinalized,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Reject attendance (mark as absent)
export const rejectEmpAttendance = async (
  recordId,
  approverId,
  remarks,
  fineAmount = 0,
) => {
  // Get record
  const record = await DailyAttendance.findById(recordId).populate(
    "userId",
    "name email",
  );

  if (!record) {
    throw new ApiError(404, "Attendance record not found");
  }

  if (record.isFinalized) {
    throw new ApiError(400, "Record is already finalized");
  }

  // Update record as absent
  record.status = "ABSENT";
  record.approvalType = "MANUAL";
  record.approvedBy = approverId;
  record.approvedAt = new Date();
  record.approvalRemarks = remarks;
  record.salaryImpact = {
    payableFraction: 0,
    fineAmount: Number(fineAmount) || 0,
    overtimePayMinutes: 0,
    isPaidLeaveUsed: false,
  };
  record.isFinalized = true;

  await record.save();

  return {
    id: record._id,
    userId: record.userId?._id,
    userName: record.userId?.name,
    date: record.date,
    status: record.status,
    salaryImpact: record.salaryImpact,
    isFinalized: record.isFinalized,
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
 * GET /attendance/dashboard/summary
 * Query: organizationId, date (optional, default today)
 */
export const getEmpDashboardSummary = async (organizationId, date) => {
  const targetDate = moment(date).startOf("day").toDate();

  // 1. Total active employees in organization
  const totalEmployees = await Employee.countDocuments({
    organizationId,
    isActive: true, // assume such field exists
  });

  // 2. Attendance records for the day
  const attendanceRecords = await DailyAttendance.find({
    organizationId: new mongoose.Types.ObjectId(organizationId),
    date: { $gte: targetDate, $lte: moment(date).endOf("day").toDate() },
  }).lean();

  // 3. Approved leaves for the day
  const leavesOnLeave = await getApprovedLeavesForDate(organizationId, date);
  const upcomingLeaves = await getUpcomingLeaves(organizationId, date);
  const onLeaveEmployeeIds = leavesOnLeave.map((l) => l._id.toString());
  const upcomingLeaveEmployeeIds = upcomingLeaves.map((l) => l._id.toString());

  // 4. Compute counts
  let present = 0,
    absent = 0,
    halfDay = 0,
    notMarked = 0,
    punchedIn = 0,
    punchedOut = 0,
    totalOvertimeMinutes = 0,
    totalFineMinutes = 0;

  const processedUserIds = new Set();

  attendanceRecords.forEach((rec) => {
    processedUserIds.add(rec.userId.toString());
    const status = rec.status;
    if (status === "PRESENT") present++;
    else if (status === "HALF_DAY") halfDay++;
    else if (status === "ABSENT") absent++;
    else if (status === "NOT_MARKED") notMarked++;
    else if (status === "PUNCHED_IN") punchedIn++;
    else if (status === "PUNCHED_OUT") punchedOut++;

    totalOvertimeMinutes += rec.totalOvertimeMinutes || 0;
    totalFineMinutes += computeFineMinutes(rec);
  });

  // Employees with no record = NOT_MARKED
  const employeesWithRecord = await Employee.find({
    organizationId,
    userId: { $in: Array.from(processedUserIds) },
  }).distinct("userId");
  const allEmployeeIds = await Employee.find({ organizationId }).distinct(
    "userId",
  );
  const noRecordCount = allEmployeeIds.length - employeesWithRecord.length;
  notMarked += noRecordCount;

  // Absent = those not present and not on leave and have record? Actually absent is marked by system.
  // We trust the status "ABSENT" from records. Also we count employees on leave separately.
  // For "employees on leave", we need to count unique employees with approved leave.
  const onLeaveCount = onLeaveEmployeeIds.length;
  const upcomingLeaveCount = upcomingLeaveEmployeeIds.length;

  return {
    date: targetDate,
    totalEmployees,
    present,
    absent,
    halfDay,
    notMarked,
    punchedIn,
    punchedOut,
    onLeave: onLeaveCount,
    upcomingLeave: upcomingLeaveCount,
    overtime: {
      hours: Math.floor(totalOvertimeMinutes / 60),
      minutes: totalOvertimeMinutes % 60,
    },
    fine: {
      // late + early minutes
      hours: Math.floor(totalFineMinutes / 60),
      minutes: totalFineMinutes % 60,
    },
  };
};

/**
 * GET /attendance/dashboard/department
 * Query: organizationId, date (optional)
 */
export const getEmpDepartmentWiseAttendance = async (organizationId, date) => {
  //TODO:- fine is not in response
  const targetDate = moment(date).startOf("day").toDate();

  // 1. Get all departments of this organization
  const departments = await Department.find({ organizationId }).lean();
  const deptMap = {};
  departments.forEach((d) => {
    deptMap[d._id.toString()] = d.name;
  });

  // 2. Get all employees with department info
  const employees = await Employee.find({ organizationId, isDeleted: false })
    .select("userId employment.departmentId")
    .lean();

  const userToDept = {};
  const deptToUserIds = {};
  employees.forEach((emp) => {
    const userId = emp.userId.toString();
    const deptId = emp.employment.departmentId?.toString();
    userToDept[userId] = deptId;
    if (deptId) {
      if (!deptToUserIds[deptId]) deptToUserIds[deptId] = [];
      deptToUserIds[deptId].push(userId);
    }
  });

  // 3. Attendance records for the day
  const attendanceRecords = await DailyAttendance.find({
    organizationId: new mongoose.Types.ObjectId(organizationId),
    date: { $gte: targetDate, $lte: moment(date).endOf("day").toDate() },
  }).lean();

  // 4. Approved leaves for the day
  const leaves = await getApprovedLeavesForDate(organizationId, date);
  const onLeaveUserIds = leaves
    .map((l) => {
      const emp = employees.find((e) => e._id.toString() === l._id.toString());
      return emp ? emp.userId.toString() : null;
    })
    .filter((id) => id);

  // 5. Initialize department stats
  const deptStats = {};
  departments.forEach((d) => {
    deptStats[d._id.toString()] = {
      departmentId: d._id,
      departmentName: d.name,
      totalEmployees: deptToUserIds[d._id.toString()]?.length || 0,
      present: 0,
      absent: 0,
      halfDay: 0,
      notMarked: 0,
      overtimeCount: 0,
      onLeave: 0,
    };
  });

  // Add a placeholder for employees without department
  deptStats["unassigned"] = {
    departmentId: null,
    departmentName: "Unassigned",
    totalEmployees: 0,
    present: 0,
    absent: 0,
    halfDay: 0,
    notMarked: 0,
    overtimeCount: 0,
    onLeave: 0,
  };

  // Count employees per department
  Object.keys(userToDept).forEach((userId) => {
    const deptId = userToDept[userId] || "unassigned";
    if (!deptStats[deptId]) {
      deptStats[deptId] = {
        departmentId: deptId === "unassigned" ? null : deptId,
        departmentName:
          deptId === "unassigned" ? "Unassigned" : deptMap[deptId] || "Unknown",
        totalEmployees: 0,
        present: 0,
        absent: 0,
        halfDay: 0,
        notMarked: 0,
        overtimeCount: 0,
        onLeave: 0,
      };
    }
    deptStats[deptId].totalEmployees++;
  });

  // Process attendance records
  const processedUsers = new Set();
  attendanceRecords.forEach((rec) => {
    const userId = rec.userId.toString();
    processedUsers.add(userId);
    const deptId = userToDept[userId] || "unassigned";
    const stat = deptStats[deptId];
    if (!stat) return;

    const status = rec.status;
    if (status === "PRESENT") stat.present++;
    else if (status === "HALF_DAY") stat.halfDay++;
    else if (status === "ABSENT") stat.absent++;
    else if (status === "NOT_MARKED") stat.notMarked++;
    // punched_in/out are not counted in present/absent; they are "pending" states

    if (rec.totalOvertimeMinutes > 0) stat.overtimeCount++;
  });

  // Employees with no record = NOT_MARKED
  employees.forEach((emp) => {
    const userId = emp.userId.toString();
    if (!processedUsers.has(userId)) {
      const deptId = emp.employment.departmentId?.toString() || "unassigned";
      if (deptStats[deptId]) {
        deptStats[deptId].notMarked++;
      }
    }
  });

  // Employees on leave
  onLeaveUserIds.forEach((userId) => {
    const deptId = userToDept[userId] || "unassigned";
    if (deptStats[deptId]) {
      deptStats[deptId].onLeave++;
    }
  });

  // Convert to array and remove departments with zero employees
  return Object.values(deptStats).filter((d) => d.totalEmployees > 0);
};

export const getEmpShiftWiseAttendance = async (organizationId, date) => {
  //TODO:- have some issue not showing night shift in local and fine is also not in response
  const targetDate = moment(date).startOf("day").toDate();

  // 1. Get all shifts of the organization
  const office = await Office.findOne({ organizationId }).lean();
  const shifts = office?.shifts || [];
  const shiftMap = {};
  shifts.forEach((s) => {
    shiftMap[s._id.toString()] = s.name;
  });

  // 2. Get all employees with shift info
  const employees = await Employee.find({ organizationId, isDeleted: false })
    .select("userId shiftId")
    .lean();

  const userToShift = {};
  const shiftToUserIds = {};
  employees.forEach((emp) => {
    const userId = emp.userId.toString();
    const shiftId = emp.shiftId?.toString();
    userToShift[userId] = shiftId;
    if (shiftId) {
      if (!shiftToUserIds[shiftId]) shiftToUserIds[shiftId] = [];
      shiftToUserIds[shiftId].push(userId);
    }
  });

  // 3. Attendance records
  const attendanceRecords = await DailyAttendance.find({
    organizationId: new mongoose.Types.ObjectId(organizationId),
    date: { $gte: targetDate, $lte: moment(date).endOf("day").toDate() },
  }).lean();

  // 4. Leaves
  const leaves = await getApprovedLeavesForDate(organizationId, date);
  const onLeaveUserIds = leaves
    .map((l) => {
      const emp = employees.find((e) => e._id.toString() === l._id.toString());
      return emp ? emp.userId.toString() : null;
    })
    .filter((id) => id);

  // 5. Initialize shift stats
  const shiftStats = {};
  shifts.forEach((s) => {
    shiftStats[s._id.toString()] = {
      shiftId: s._id,
      shiftName: s.name,
      totalEmployees: shiftToUserIds[s._id.toString()]?.length || 0,
      present: 0,
      absent: 0,
      halfDay: 0,
      notMarked: 0,
      overtimeCount: 0,
      onLeave: 0,
    };
  });
  shiftStats["unassigned"] = {
    shiftId: null,
    shiftName: "Unassigned",
    totalEmployees: 0,
    present: 0,
    absent: 0,
    halfDay: 0,
    notMarked: 0,
    overtimeCount: 0,
    onLeave: 0,
  };

  // Count total employees per shift
  Object.keys(userToShift).forEach((userId) => {
    const shiftId = userToShift[userId] || "unassigned";
    if (!shiftStats[shiftId]) {
      shiftStats[shiftId] = {
        shiftId: shiftId === "unassigned" ? null : shiftId,
        shiftName:
          shiftId === "unassigned"
            ? "Unassigned"
            : shiftMap[shiftId] || "Unknown",
        totalEmployees: 0,
        present: 0,
        absent: 0,
        halfDay: 0,
        notMarked: 0,
        overtimeCount: 0,
        onLeave: 0,
      };
    }
    shiftStats[shiftId].totalEmployees++;
  });

  // Process attendance
  const processedUsers = new Set();
  attendanceRecords.forEach((rec) => {
    const userId = rec.userId.toString();
    processedUsers.add(userId);
    const shiftId = userToShift[userId] || "unassigned";
    const stat = shiftStats[shiftId];
    if (!stat) return;

    const status = rec.status;
    if (status === "PRESENT") stat.present++;
    else if (status === "HALF_DAY") stat.halfDay++;
    else if (status === "ABSENT") stat.absent++;
    else if (status === "NOT_MARKED") stat.notMarked++;

    if (rec.totalOvertimeMinutes > 0) stat.overtimeCount++;
  });

  // Not marked
  employees.forEach((emp) => {
    const userId = emp.userId.toString();
    if (!processedUsers.has(userId)) {
      const shiftId = emp.shiftId?.toString() || "unassigned";
      if (shiftStats[shiftId]) shiftStats[shiftId].notMarked++;
    }
  });

  // On leave
  onLeaveUserIds.forEach((userId) => {
    const shiftId = userToShift[userId] || "unassigned";
    if (shiftStats[shiftId]) shiftStats[shiftId].onLeave++;
  });

  return Object.values(shiftStats).filter((s) => s.totalEmployees > 0);
};

export const getEmpDetailedAttendance = async (organizationId, date) => {
  const targetDate = moment(date).startOf("day").toDate();

  // Get all active employees with department info
  const employees = await Employee.find({ organizationId, isDeleted: false })
    .populate("employment.departmentId", "name")
    .populate("userId", "name")
    .select("userId name employeeId employment.departmentId")
    .lean();

  // Get attendance records for the day
  const attendanceRecords = await DailyAttendance.find({
    organizationId: new mongoose.Types.ObjectId(organizationId),
    date: { $gte: targetDate, $lte: moment(date).endOf("day").toDate() },
  }).lean();

  const recordMap = {};
  attendanceRecords.forEach((rec) => {
    recordMap[rec.userId.toString()] = rec;
  });

  // Build detailed list
  const details = employees.map((emp) => {
    const userId = emp.userId?._id.toString();
    const record = recordMap[userId] || null;

    let status = "NOT_MARKED";
    let punchIn = null;
    let punchOut = null;
    let totalOvertimeMinutes = 0;
    let totalFineMinutes = 0;

    if (record) {
      status = record.status;
      // Get first IN and last OUT for simplicity (or all scans)
      const inScans = record.scans
        .filter((s) => s.type === "IN")
        .map((s) => s.scanTime);
      const outScans = record.scans
        .filter((s) => s.type === "OUT")
        .map((s) => s.scanTime);
      punchIn = inScans.length > 0 ? inScans[0] : null;
      punchOut = outScans.length > 0 ? outScans[outScans.length - 1] : null;
      totalOvertimeMinutes = record?.totalOvertimeMinutes || 0;
      totalFineMinutes = computeFineMinutes(record);
    }

    return {
      employeeId: emp._id,
      name: emp.userId?.name,
      employeeCode: emp.employeeId,
      departmentId: emp.employment.departmentId?._id,
      department: emp.employment.departmentId?.name || "-",
      attendance: status,
      inTime: punchIn || "-",
      outTime: punchOut || "-",
      totalWorkMinutes: record?.totalWorkMinutes || 0,
      overtime: {
        hours: Math.floor(totalOvertimeMinutes / 60),
        minutes: totalOvertimeMinutes % 60,
      },
      fine: {
        // late + early minutes
        hours: Math.floor(totalFineMinutes / 60),
        minutes: totalFineMinutes % 60,
      },
    };
  });

  return details;
};
