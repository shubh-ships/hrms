import mongoose from "mongoose";
import moment from "moment";
import * as dailyRepo from "../repositories/dailyscan.repository.js";
import Employee from "../models/employee.Model.js";
import { Office } from "../models/organizationTiming.Model.js";
import DailyAttendance from "../models/dailyscanAttendance.js";
import ApiError from "../utils/apiError.js";
import User from "../models/user.Model.js";
import { searchFace } from "../utils/awsRecogination.js";
import { Leave } from "../models/leave.Model.js";
import Department from "../models/department.Model.js";
import {
  getShiftMinutesForEmployee,
  timeToMinutes,
  getOrCreateDailyRecord,
  calculateWorkMinutes,
  getEmployeeShift,
  takeShiftSnapshot,
  calculateAttendanceMetrics,
  autoEvaluateAttendance,
  getShiftMinutes,
  getAttendanceRecordsForDate,
  getApprovedLeavesForDate,
  getUpcomingLeaves,
  computeFineMinutes,
  enrichWithEmployeeDetails,
  getEmployeeIdFromUserId,
  getLeavePeriod,
  deductLeaveBalance,
  addBackLeaveBalance,
  createLeaveRecord,
  cancelLeaveRecord,
  getDatesInMonth,
} from "../helper/dailyAttendanceServiceHelpers.js";

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
// export const createEmployeeManualAttendance = async (data, approverId) => {
//   const {
//     userId,
//     organizationId,
//     date,
//     status,
//     loginTime,
//     logoutTime,
//     remarks,
//     fineAmount = 0,
//     overtimePayMinutes = 0,
//   } = data;

//   // Validation
//   if (!userId || !organizationId || !date || !status) {
//     throw new ApiError(400, "Missing required fields");
//   }

//   // Validate status
//   const validStatuses = [
//     "PRESENT",
//     "HALF_DAY",
//     "ABSENT",
//     "WEEKLY_OFF",
//     "HOLIDAY",
//     "COMPENSATORY_OFF",
//     "PAID_LEAVE",
//   ];

//   if (!validStatuses.includes(status)) {
//     throw new ApiError(
//       400,
//       "Invalid status. Allowed: " + validStatuses.join(", "),
//     );
//   }

//   // For present/half day, validate login/logout times
//   if (
//     (status === "PRESENT" || status === "HALF_DAY") &&
//     (!loginTime || !logoutTime)
//   ) {
//     throw new ApiError(
//       400,
//       "Login and logout time required for present/half day",
//     );
//   }

//   // Check for existing record
//   const startOfDay = moment(date).startOf("day").toDate();
//   const endOfDay = moment(date).endOf("day").toDate();

//   let record = await DailyAttendance.findOne({
//     userId,
//     date: { $gte: startOfDay, $lte: endOfDay },
//   });

//   // Base record data
//   const baseRecord = {
//     userId,
//     organizationId,
//     date: startOfDay,
//     status,
//     approvalType: "MANUAL",
//     approvedBy: approverId, // Assuming user id from auth middleware
//     approvedAt: new Date(),
//     approvalRemarks: remarks,
//     isFinalized: true,
//     scans: [],
//     officeTotalWorkingMinutes: 0,
//     totalWorkMinutes: 0,
//     totalBreakMinutes: 0,
//     isLateLogin: false,
//     lateLoginMinutes: 0,
//     isEarlyLogout: false,
//     earlyLogoutMinutes: 0,
//     isOvertime: false,
//     totalOvertimeMinutes: 0,
//     shiftSnapshot: null,
//   };

//   // Handle different status types
//   if (status === "PRESENT" || status === "HALF_DAY") {
//     // Add punches
//     baseRecord.scans = [
//       {
//         scanTime: moment.utc(loginTime).toDate(),
//         type: "IN",
//         sessionMinutes: moment
//           .utc(logoutTime)
//           .diff(moment.utc(loginTime), "minutes"),
//       },
//       {
//         scanTime: moment.utc(logoutTime).toDate(),
//         type: "OUT",
//       },
//     ];

//     // Calculate work minutes
//     const workMinutes = moment
//       .utc(logoutTime)
//       .diff(moment.utc(loginTime), "minutes");
//     baseRecord.totalWorkMinutes = workMinutes;
//     baseRecord.officeTotalWorkingMinutes = workMinutes;

//     // Get shift snapshot for reporting
//     try {
//       const employeeShift = await getEmployeeShift(userId);
//       if (employeeShift) {
//         baseRecord.shiftSnapshot = {
//           shiftName: employeeShift.name,
//           shiftStart: employeeShift.startTime,
//           shiftEnd: employeeShift.endTime,
//           minFullDayMinutes: employeeShift.minFullDayMinutes,
//           minHalfDayMinutes: employeeShift.minHalfDayMinutes,
//           lateGraceMinutes: employeeShift.lateGraceMinutes,
//           earlyGraceMinutes: employeeShift.earlyGraceMinutes,
//         };

//         // Calculate late/early for reporting only
//         const shiftStart = moment.utc(
//           `${moment(date).format("YYYY-MM-DD")}T${employeeShift.startTime}:00Z`,
//         );
//         const shiftEnd = moment.utc(
//           `${moment(date).format("YYYY-MM-DD")}T${employeeShift.endTime}:00Z`,
//         );
//         const loginMoment = moment.utc(loginTime);
//         const logoutMoment = moment.utc(logoutTime);

//         const lateThreshold = shiftStart
//           .clone()
//           .add(employeeShift.lateGraceMinutes, "minutes");
//         baseRecord.isLateLogin = loginMoment.isAfter(lateThreshold);
//         baseRecord.lateLoginMinutes = baseRecord.isLateLogin
//           ? Math.max(0, loginMoment.diff(lateThreshold, "minutes"))
//           : 0;

//         const earlyThreshold = shiftEnd
//           .clone()
//           .subtract(employeeShift.earlyGraceMinutes, "minutes");
//         baseRecord.isEarlyLogout = logoutMoment.isBefore(earlyThreshold);
//         baseRecord.earlyLogoutMinutes = baseRecord.isEarlyLogout
//           ? Math.max(0, earlyThreshold.diff(logoutMoment, "minutes"))
//           : 0;
//       }
//     } catch (error) {
//       // Shift not found - still create record without shift data
//       console.warn("Shift not found for manual attendance:", error.message);
//     }
//   }

//   // Set salary impact
//   let payableFraction = 0;
//   if (
//     ["PRESENT", "WEEKLY_OFF", "HOLIDAY", "COMPENSATORY_OFF", "PAID_LEAVE"].includes(
//       status,
//     )
//   ) {
//     payableFraction = 1;
//   } else if (status === "HALF_DAY") {
//     payableFraction = 0.5;
//   }

//   baseRecord.salaryImpact = {
//     payableFraction,
//     fineAmount,
//     overtimePayMinutes,
//     isPaidLeaveUsed: false,
//   };

//   // Update or create record
//   if (record) {
//     Object.assign(record, baseRecord);
//     await record.save();
//   } else {
//     record = await DailyAttendance.create(baseRecord);
//   }

//   return {
//     id: record._id,
//     userId: record.userId,
//     date: record.date,
//     status: record.status,
//     approvalType: record.approvalType,
//     isFinalized: record.isFinalized,
//     salaryImpact: record.salaryImpact,
//   };
// };

export const createEmployeeManualAttendance = async (data, approverId) => {
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
    leaveType, // new for PAID_LEAVE
    durationType = "fullDay", // new for PAID_LEAVE (fullDay/halfDay)
  } = data;

  // Validation
  if (!userId || !organizationId || !date || !status) {
    throw new ApiError(400, "Missing required fields");
  }

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

  // For PAID_LEAVE, leaveType is required
  if (status === "PAID_LEAVE" && !leaveType) {
    throw new ApiError(400, "leaveType is required for PAID_LEAVE status");
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

  // Get employeeId for leave balance operations (if needed)
  const employeeId =
    status === "PAID_LEAVE" ? await getEmployeeIdFromUserId(userId) : null;

  const startOfDay = moment(date).startOf("day").toDate();
  const endOfDay = moment(date).endOf("day").toDate();
  const period = getLeavePeriod(date); // year string

  // Use a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find existing attendance record
    let record = await DailyAttendance.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).session(session);

    // If record exists and is finalized, prevent modification
    if (record && record.isFinalized) {
      throw new ApiError(
        400,
        "Record is already finalized and cannot be modified",
      );
    }

    // Determine previous status and linked leave (if any)
    const previousStatus = record ? record.status : null;
    const previousLeaveId = record ? record.linkedLeaveId : null;
    const previousLeaveType = record ? record.leaveType : null; // we may store this? Alternatively we can fetch from Leave

    // Handle leave balance adjustments based on status change
    if (previousStatus === "PAID_LEAVE" && previousLeaveId) {
      // We are changing from a PAID_LEAVE to something else
      // Fetch the linked leave record to get the leaveType and days
      const previousLeave =
        await Leave.findById(previousLeaveId).session(session);
      if (previousLeave) {
        // Add back the previously deducted balance
        await addBackLeaveBalance(
          previousLeave.employeeId,
          previousLeave.leaveType,
          previousLeave.totalDays,
          organizationId,
          period,
          session,
        );
        // Cancel the old leave record
        await cancelLeaveRecord(previousLeaveId, session);
      }
    }

    // If new status is PAID_LEAVE, deduct balance and create leave record
    let newLeaveId = null;
    if (status === "PAID_LEAVE") {
      // Deduct leave balance
      const daysToDeduct = durationType === "fullDay" ? 1 : 0.5;
      await deductLeaveBalance(
        employeeId,
        leaveType,
        daysToDeduct,
        organizationId,
        period,
        session,
      );

      // Create leave record
      const leaveRecord = await createLeaveRecord(
        employeeId,
        leaveType,
        date,
        durationType,
        approverId,
        remarks,
        organizationId,
        session,
      );
      newLeaveId = leaveRecord._id;
    }

    // Build base record data (same as before, but include linkedLeaveId)
    const baseRecord = {
      userId,
      organizationId,
      date: startOfDay,
      status,
      approvalType: "MANUAL",
      approvedBy: approverId,
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
      linkedLeaveId: newLeaveId, // store reference
      // Optionally store leaveType/duration for quick access? Not necessary but helpful
    };

    // Handle PRESENT/HALF_DAY (same as before)
    if (status === "PRESENT" || status === "HALF_DAY") {
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

      const workMinutes = moment
        .utc(logoutTime)
        .diff(moment.utc(loginTime), "minutes");
      baseRecord.totalWorkMinutes = workMinutes;
      baseRecord.officeTotalWorkingMinutes = workMinutes;

      // Get shift snapshot (optional)
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
        console.warn("Shift not found for manual attendance:", error.message);
      }
    }

    // Set salary impact (same logic)
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
      isPaidLeaveUsed: status === "PAID_LEAVE", // mark that leave was used
    };

    // Update or create record
    if (record) {
      Object.assign(record, baseRecord);
      await record.save({ session });
    } else {
      record = await DailyAttendance.create([baseRecord], { session });
      record = record[0]; // because create returns array when passing array
    }

    await session.commitTransaction();
    session.endSession();

    return {
      id: record._id,
      userId: record.userId,
      date: record.date,
      status: record.status,
      approvalType: record.approvalType,
      isFinalized: record.isFinalized,
      salaryImpact: record.salaryImpact,
      linkedLeaveId: record.linkedLeaveId,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
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
  console.log(targetDate);
  console.log(moment(date).endOf("day").toDate());
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
      userId: emp.userId?._id,
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

export const createManualRecord = async (
  userId,
  organizationId,
  loginTime,
  logoutTime,
) => {
  if (!userId || !organizationId || !loginTime || !logoutTime) {
    throw new Error(
      "Missing required fields: userId, organizationId, loginTime, logoutTime",
    );
  }

  const loginMoment = moment.utc(loginTime);
  const logoutMoment = moment.utc(logoutTime);

  if (!logoutMoment.isAfter(loginMoment)) {
    throw new Error("Logout time must be after login time");
  }

  const startOfDayUTC = loginMoment.clone().startOf("day").toDate();
  const endOfDayUTC = loginMoment.clone().endOf("day").toDate();

  let dailyRecord = await DailyAttendance.findOne({
    userId,
    date: { $gte: startOfDayUTC, $lte: endOfDayUTC },
  });

  if (!dailyRecord) {
    dailyRecord = await dailyRepo.createDailyRecord({
      userId,
      organizationId,
      date: startOfDayUTC,
      month: loginMoment.format("MMMM"),
      year: loginMoment.format("YYYY"),
      scans: [],
    });
  }

  dailyRecord.scans = [
    { scanTime: loginMoment.toDate(), type: "IN" },
    { scanTime: logoutMoment.toDate(), type: "OUT" },
  ];

  const sessionMinutes = logoutMoment.diff(loginMoment, "minutes");
  dailyRecord.scans[0].sessionMinutes = sessionMinutes;
  dailyRecord.totalWorkMinutes = sessionMinutes;

  const employeeShift = await getEmployeeShift(userId);

  let shiftData = null;

  if (employeeShift) {
    shiftData = await getShiftMinutesForEmployee(
      organizationId,
      employeeShift.name,
    );
  }

  if (shiftData) {
    dailyRecord.officeTotalWorkingMinutes = shiftData.shiftMinutes;
  } else if (employeeShift) {
    const shiftStart = timeToMinutes(employeeShift.startTime);
    const shiftEnd = timeToMinutes(employeeShift.endTime);
    let totalBreakMinutesShift = 0;
    (employeeShift.breaks || []).forEach((b) => {
      totalBreakMinutesShift +=
        timeToMinutes(b.endTime) - timeToMinutes(b.startTime);
    });
    dailyRecord.officeTotalWorkingMinutes =
      shiftEnd - shiftStart - totalBreakMinutesShift;
  } else {
    dailyRecord.officeTotalWorkingMinutes = 0;
  }

  if (employeeShift) {
    const dateStr = loginMoment.format("YYYY-MM-DD");
    const shiftStart = moment.utc(`${dateStr}T${employeeShift.startTime}:00Z`);

    const shiftEnd = moment.utc(`${dateStr}T${employeeShift.endTime}:00Z`);

    dailyRecord.isLateLogin = loginMoment.isAfter(shiftStart);
    dailyRecord.lateLoginMinutes = dailyRecord.isLateLogin
      ? loginMoment.diff(shiftStart, "minutes")
      : 0;

    dailyRecord.isEarlyLogout = logoutMoment.isBefore(shiftEnd);
    dailyRecord.earlyLogoutMinutes = dailyRecord.isEarlyLogout
      ? shiftEnd.diff(logoutMoment, "minutes")
      : 0;

    const standardWorkMinutes = shiftEnd.diff(shiftStart, "minutes");
    dailyRecord.isOvertime = sessionMinutes > standardWorkMinutes;
    dailyRecord.totalOvertimeMinutes = dailyRecord.isOvertime
      ? sessionMinutes - standardWorkMinutes
      : 0;
  } else {
    // dailyRecord.isLateLogin = false;
    // dailyRecord.lateLoginMinutes = 0;
    // dailyRecord.isEarlyLogout = false;
    // dailyRecord.earlyLogoutMinutes = 0;
    // dailyRecord.isOvertime = false;
    // dailyRecord.totalOvertimeMinutes = 0;

    throw new ApiError(
      404,
      "Employee shift not found, please assign shift to employee first",
    );
  }

  await dailyRepo.updateDailyRecord(dailyRecord._id, dailyRecord);
  return dailyRecord;
};

export const recordScan = async (userId, organizationId, scanTime) => {
  const scanMoment = moment.utc(scanTime);
  const dateStr = scanMoment.format("YYYY-MM-DD");
  let dailyRecord = await dailyRepo.getDailyRecord(userId, dateStr);

  if (!dailyRecord) {
    dailyRecord = await dailyRepo.createDailyRecord({
      userId,
      date: dateStr,
      month: scanMoment.format("MMMM"),
      year: scanMoment.format("YYYY"),
      organizationId,
      scans: [],
    });
  }
  dailyRecord.scans.push({ scanTime: scanMoment.toDate() });
  dailyRecord.scans.sort((a, b) => new Date(a.scanTime) - new Date(b.scanTime));
  dailyRecord.scans.forEach((scan, index) => {
    scan.type = index % 2 === 0 ? "IN" : "OUT";
  });

  let totalWorkMinutes = 0;
  let totalBreakMinutes = 0;
  const scans = dailyRecord.scans;

  for (let i = 0; i < scans.length; i += 2) {
    const inScan = moment.utc(scans[i].scanTime);
    const outScan = scans[i + 1] ? moment.utc(scans[i + 1].scanTime) : null;
    if (!outScan) break;
    const sessionMinutes = outScan.diff(inScan, "minutes");
    scans[i].sessionMinutes = sessionMinutes;
    totalWorkMinutes += sessionMinutes;
    if (i + 2 < scans.length) {
      const nextIn = moment.utc(scans[i + 2].scanTime);
      const breakMinutes = nextIn.diff(outScan, "minutes");
      scans[i + 1].breakMinutes = breakMinutes;
      totalBreakMinutes += breakMinutes;
    }
  }

  dailyRecord.totalWorkMinutes = totalWorkMinutes + totalBreakMinutes;
  dailyRecord.totalBreakMinutes = totalBreakMinutes;

  const employeeShift = await getEmployeeShift(userId);
  let shiftData = null;
  if (employeeShift) {
    shiftData = await getShiftMinutesForEmployee(
      organizationId,
      employeeShift.name,
    );
  }

  if (shiftData) {
    dailyRecord.officeTotalWorkingMinutes = shiftData.shiftMinutes;
  } else if (employeeShift) {
    const shiftStart = timeToMinutes(employeeShift.startTime);
    const shiftEnd = timeToMinutes(employeeShift.endTime);
    let totalBreakMinutesShift = 0;
    (employeeShift.breaks || []).forEach((b) => {
      totalBreakMinutesShift +=
        timeToMinutes(b.endTime) - timeToMinutes(b.startTime);
    });
    dailyRecord.officeTotalWorkingMinutes =
      shiftEnd - shiftStart - totalBreakMinutesShift;
  } else {
    dailyRecord.officeTotalWorkingMinutes = 0;
  }

  if (employeeShift) {
    const shiftStart = moment.utc(`${dateStr}T${employeeShift.startTime}:00Z`);
    const shiftEnd = moment.utc(`${dateStr}T${employeeShift.endTime}:00Z`);
    const firstScan = moment.utc(scans[0].scanTime);
    const lastScan = moment.utc(scans[scans.length - 1].scanTime);

    dailyRecord.isLateLogin = firstScan.isAfter(shiftStart);
    dailyRecord.lateLoginMinutes = dailyRecord.isLateLogin
      ? firstScan.diff(shiftStart, "minutes")
      : 0;

    dailyRecord.isEarlyLogin = firstScan.isBefore(shiftStart);
    dailyRecord.earlyLoginMinutes = dailyRecord.isEarlyLogin
      ? shiftStart.diff(firstScan, "minutes")
      : 0;

    dailyRecord.isEarlyLogout = lastScan.isBefore(shiftEnd);
    dailyRecord.earlyLogoutMinutes = dailyRecord.isEarlyLogout
      ? shiftEnd.diff(lastScan, "minutes")
      : 0;

    const standardWorkMinutes = shiftEnd.diff(shiftStart, "minutes");
    if (totalWorkMinutes > standardWorkMinutes) {
      dailyRecord.totalOvertimeMinutes =
        totalWorkMinutes + totalBreakMinutes - standardWorkMinutes;
      dailyRecord.isOvertime = true;
    } else {
      dailyRecord.totalOvertimeMinutes = 0;
      dailyRecord.isOvertime = false;
    }
  } else {
    throw new ApiError(
      404,
      "Employee shift not found, please assign shift to employee first",
    );
  }

  await dailyRepo.updateDailyRecord(dailyRecord._id, dailyRecord);
  return dailyRecord;
};

export const getMonthlyReport = async (userId, month, year) => {
  const dailyRecords = await dailyRepo.getMonthlyAttendance(
    userId,
    month,
    year,
  );

  const formatMinutes = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}h ${m}m`;
  };

  const parseMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hoursPart, minutesPart] = timeStr.split(" ");
    const hours = parseInt(hoursPart.replace("h", "")) || 0;
    const minutes = parseInt(minutesPart.replace("m", "")) || 0;
    return hours * 60 + minutes;
  };

  const dailyWithFormatted = dailyRecords.map((day) => ({
    date: day.date,
    totalWork: formatMinutes(day.totalWorkMinutes),
    totalBreak: formatMinutes(day.totalBreakMinutes),
    totalOvertime: formatMinutes(day.totalOvertimeMinutes),
    lateLoginMinutes: formatMinutes(day.lateLoginMinutes),
    earlyLogoutMinutes: formatMinutes(day.earlyLogoutMinutes),
    officeTotalWorkingMinutes: formatMinutes(day.officeTotalWorkingMinutes),
    scans: day.scans.map((scan) => ({
      type: scan.type,
      scanTime: scan.scanTime,
      sessionMinutes: scan.sessionMinutes
        ? formatMinutes(scan.sessionMinutes)
        : null,
      breakMinutes: scan.breakMinutes ? formatMinutes(scan.breakMinutes) : null,
    })),
  }));

  let totalWorkMinutes = 0;
  let totalBreakMinutes = 0;
  let totalOvertimeMinutes = 0;
  let totalLateMinutes = 0;
  let totalEarlyLogoutMinutes = 0;

  let totalWorkingDays = 0;
  let fullDayCount = 0;
  let halfDayCount = 0;

  dailyWithFormatted.forEach((day) => {
    const workMinutes = parseMinutes(day.totalWork);
    const officeMinutes = parseMinutes(day.officeTotalWorkingMinutes);

    totalWorkMinutes += workMinutes;
    totalBreakMinutes += parseMinutes(day.totalBreak);
    totalOvertimeMinutes += parseMinutes(day.totalOvertime);
    totalLateMinutes += parseMinutes(day.lateLoginMinutes);
    totalEarlyLogoutMinutes += parseMinutes(day.earlyLogoutMinutes);

    if (workMinutes > 0) {
      totalWorkingDays++;
      if (workMinutes >= officeMinutes) {
        fullDayCount++;
      } else if (workMinutes >= officeMinutes / 2) {
        halfDayCount++;
      }
    }
  });

  const summaryFormatted = {
    totalWork: formatMinutes(totalWorkMinutes),
    totalBreak: formatMinutes(totalBreakMinutes),
    totalOvertime: formatMinutes(totalOvertimeMinutes),
    totalLate: formatMinutes(totalLateMinutes),
    totalEarlyLogout: formatMinutes(totalEarlyLogoutMinutes),
    totalWorkingDays,
    fullDayCount,
    halfDayCount,
  };

  return {
    dailyRecords: dailyWithFormatted,
    monthlySummary: summaryFormatted,
  };
};

export const updateDailyScan = async (dailyRecordId, scans) => {
  const dailyRecord = await dailyRepo.findDailyById(dailyRecordId);
  if (!dailyRecord) {
    throw new Error("Daily record not found");
  }

  dailyRecord.scans = scans
    .map((scan) => ({
      scanTime: moment.utc(scan).toDate(),
    }))
    .sort((a, b) => new Date(a.scanTime) - new Date(b.scanTime));

  dailyRecord.scans.forEach((scan, index) => {
    scan.type = index % 2 === 0 ? "IN" : "OUT";
  });

  let totalWorkMinutes = 0;
  let totalBreakMinutes = 0;

  for (let i = 0; i < dailyRecord.scans.length; i += 2) {
    const inScan = moment.utc(dailyRecord.scans[i].scanTime);
    const outScan = dailyRecord.scans[i + 1]
      ? moment.utc(dailyRecord.scans[i + 1].scanTime)
      : null;

    if (!outScan) {
      dailyRecord.scans[i].sessionMinutes = 0;
      continue;
    }

    const sessionMinutes = outScan.diff(inScan, "minutes");
    dailyRecord.scans[i].sessionMinutes = sessionMinutes;
    totalWorkMinutes += sessionMinutes;

    if (i + 2 < dailyRecord.scans.length) {
      const nextIn = moment.utc(dailyRecord.scans[i + 2].scanTime);
      const breakMinutes = nextIn.diff(outScan, "minutes");
      dailyRecord.scans[i + 1].breakMinutes = breakMinutes;
      totalBreakMinutes += breakMinutes;
    }
  }

  dailyRecord.totalWorkMinutes = totalWorkMinutes;
  dailyRecord.totalBreakMinutes = totalBreakMinutes;

  const shift = await getEmployeeShift(dailyRecord.userId);
  if (shift) {
    const dateStr = moment.utc(dailyRecord.date).format("YYYY-MM-DD");
    const shiftStart = moment.utc(`${dateStr}T${shift.startTime}:00Z`);
    const shiftEnd = moment.utc(`${dateStr}T${shift.endTime}:00Z`);

    const firstScan = moment.utc(dailyRecord.scans[0].scanTime);
    const lastScan = moment.utc(
      dailyRecord.scans[dailyRecord.scans.length - 1].scanTime,
    );

    if (firstScan.isAfter(shiftStart)) {
      dailyRecord.isLateLogin = true;
      dailyRecord.lateLoginMinutes = firstScan.diff(shiftStart, "minutes");
    } else {
      dailyRecord.isLateLogin = false;
      dailyRecord.lateLoginMinutes = 0;
    }

    if (firstScan.isBefore(shiftStart)) {
      dailyRecord.isEarlyLogin = true;
      dailyRecord.earlyLoginMinutes = shiftStart.diff(firstScan, "minutes");
    } else {
      dailyRecord.isEarlyLogin = false;
      dailyRecord.earlyLoginMinutes = 0;
    }

    if (lastScan.isBefore(shiftEnd)) {
      dailyRecord.isEarlyLogout = true;
      dailyRecord.earlyLogoutMinutes = shiftEnd.diff(lastScan, "minutes");
    } else {
      dailyRecord.isEarlyLogout = false;
      dailyRecord.earlyLogoutMinutes = 0;
    }

    const standardWorkMinutes = shiftEnd.diff(shiftStart, "minutes");
    if (totalWorkMinutes > standardWorkMinutes) {
      dailyRecord.totalOvertimeMinutes = totalWorkMinutes - standardWorkMinutes;
      dailyRecord.isOvertime = true;
    } else {
      dailyRecord.totalOvertimeMinutes = 0;
      dailyRecord.isOvertime = false;
    }
  }

  return await dailyRepo.updateDailyRecord(dailyRecord._id, dailyRecord);
};

export const getDailyRecord = async (userId, date) => {
  const dailyData = await dailyRepo.getDailyRecordForUser(userId, date);
  return dailyData;
};

export const liveFaceScan = async (organizationId, imageBuffer) => {
  const faceMatch = await searchFace(imageBuffer);
  if (!faceMatch) throw new Error("Face not recognized");

  const rekognitionFaceId = faceMatch.faceId;

  // const user = await User.findOne({rekognitionFaceIds: rekognitionFaceId,organizationId,}).select('+rekognitionFaceIds');
  const user = await User.findOne({
    recognitionFaceIds: { $in: [rekognitionFaceId] },
  }).select("+recognitionFaceIds");

  if (!user) throw new Error("User not registered for this organization");

  const scanTime = new Date();
  // const dailyRecord = await recordScan(user._id, user.organizationId, scanTime);
  const dailyRecord = await userDailyScan(
    user._id,
    user.organizationId,
    scanTime,
  );

  return { user, dailyRecord };
};

export const deleteAttendanceRecord = async (userId, date, organizationId) => {
  const day = moment.utc(date);
  if (!day.isValid()) throw new ApiError(400, "Invalid date format");

  const startOfDayUTC = day.clone().startOf("day").toDate();
  const endOfDayUTC = day.clone().endOf("day").toDate();

  const query = { userId, date: { $gte: startOfDayUTC, $lte: endOfDayUTC } };
  if (organizationId) query.organizationId = organizationId;

  const result = await DailyAttendance.deleteOne(query);

  if (!result.deletedCount) {
    throw new ApiError(404, "No attendance record found to delete");
  }

  return result;
};

// controllers/attendance/getEmployeeMonthlyAttendance.js

export const getEmpMonthlyAttendance = async (userId, month, year) => {
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  if (monthNum < 1 || monthNum > 12) {
    throw new ApiError(400, "Month must be between 1 and 12");
  }

  const employee = await Employee.findOne({ userId }).lean();
  if (!employee) {
    throw new ApiError(404, "Employee not found for this user");
  }

  // Generate start and end dates
  const startDate = moment(`${yearNum}-${monthNum}-01`, "YYYY-M-D")
    .startOf("day")
    .toDate();
  const endDate = moment(startDate).endOf("month").endOf("day").toDate();

  // Fetch attendance records for the user in that month
  const attendanceRecords = await DailyAttendance.find({
    userId: new mongoose.Types.ObjectId(userId),
    date: { $gte: startDate, $lte: endDate },
  })
    .populate("linkedLeaveId") // optionally populate leave details
    .populate("userId", "name")
    .lean();

  // Create a map for quick lookup by date string
  const recordMap = {};
  attendanceRecords.forEach((rec) => {
    const dateStr = moment(rec.date).format("YYYY-MM-DD");
    recordMap[dateStr] = rec;
  });

  // Get all dates in the month
  const dates = getDatesInMonth(yearNum, monthNum);

  // Initialize summary counters
  let presentCount = 0;
  let absentCount = 0;
  let halfdayCount = 0;
  let notMarkedCount = 0;
  let paidLeaveCount = 0;
  let punchInCount = 0;
  let punchOutCount = 0;
  let pendingCount = 0; // not in summary but can be used
  let totalOvertimeMinutes = 0;
  let totalFineMinutes = 0; // late + early minutes

  const dailyDetails = [];

  dates.forEach((dateStr) => {
    const record = recordMap[dateStr];
    const dateObj = moment(dateStr, "YYYY-MM-DD").toDate();
    const dayName = moment(dateStr, "YYYY-MM-DD").format("dddd");

    let status = "NOT_MARKED";
    let totalWorkMinutes = 0;
    let scans = [];
    let isFineApplied = false;
    let isOvertimeApplied = false;
    let isPending = false;
    let leaveType = null;
    let linkedLeave = null;
    let overtimeMinutes = 0;
    let fineMinutes = 0;

    if (record) {
      status = record.status;
      totalWorkMinutes = record.totalWorkMinutes || 0;
      scans = record.scans || [];
      if (record.salaryImpact) {
        isFineApplied = record.salaryImpact.fineAmount > 0;
        isOvertimeApplied = record.salaryImpact.overtimePayMinutes > 0;
      }
      if (record.totalOvertimeMinutes > 0) {
        isOvertimeApplied = true; // also consider this
      }
      isPending = status === "PENDING_APPROVAL";
      if (status === "PAID_LEAVE" && record.linkedLeaveId) {
        linkedLeave = record.linkedLeaveId;
        leaveType = linkedLeave?.leaveType;
      }

      // Accumulate totals
      totalOvertimeMinutes += overtimeMinutes;
      totalFineMinutes += fineMinutes;
    }

    // Update counters based on status
    if (status === "PRESENT") presentCount++;
    else if (status === "ABSENT") absentCount++;
    else if (status === "HALF_DAY") halfdayCount++;
    else if (status === "NOT_MARKED") notMarkedCount++;
    else if (
      ["WEEKLY_OFF", "HOLIDAY", "COMPENSATORY_OFF", "PAID_LEAVE"].includes(
        status,
      )
    ) {
      paidLeaveCount++;
    }

    // Count punch in/out
    if (scans.some((s) => s.type === "IN")) punchInCount++;
    if (scans.some((s) => s.type === "OUT")) punchOutCount++;

    if (status === "PENDING_APPROVAL") pendingCount++;

    // Determine punch in/out times (first IN, last OUT)
    let punchInTime = null;
    let punchOutTime = null;
    if (scans.length > 0) {
      const inScans = scans
        .filter((s) => s.type === "IN")
        .map((s) => s.scanTime);
      const outScans = scans
        .filter((s) => s.type === "OUT")
        .map((s) => s.scanTime);
      if (inScans.length > 0) punchInTime = inScans[0];
      if (outScans.length > 0) punchOutTime = outScans[outScans.length - 1];
    }

    dailyDetails.push({
      date: dateStr,
      dayName,
      status,
      totalWorkMinutes,
      punchInTime,
      punchOutTime,
      scans, // optionally include full scans
      isFineApplied,
      fineMinutes,
      isOvertimeApplied,
      overtimeMinutes,
      isPending,
      leaveType,
      // also include any other flags needed for highlighting
    });
  });

  // Summary object
  const summary = {
    name: attendanceRecords[0]?.userId?.name || "Employee",
    employeeId: employee._id,
    employeeCode: employee?.employment?.employeeCode || null,
    totalDays: dates.length,
    present: presentCount,
    absent: absentCount,
    halfDay: halfdayCount,
    notMarked: notMarkedCount,
    paidLeave: paidLeaveCount,
    punchIn: punchInCount,
    punchOut: punchOutCount,
    pending: pendingCount,
    overtime: {
      hours: Math.floor(totalOvertimeMinutes / 60),
      minutes: totalOvertimeMinutes % 60,
    },
    fine: {
      hours: Math.floor(totalFineMinutes / 60),
      minutes: totalFineMinutes % 60,
    },
  };

  return {
    summary,
    dailyDetails,
  };
};
