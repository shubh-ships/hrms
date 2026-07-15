import * as attendanceRepository from "../repositories/attendance.repository.js";
import * as workingDaysRepository from "../repositories/workingDays.repository.js";
import ApiError from "../utils/apiError.js";
import { calculateOvertimeForDay } from "./overtime.service.js";
import { getDailyRecordsByDate } from "../repositories/dailyscan.repository.js";
import { Holiday } from "../models/holidays.Model.js";
import ExcelJS from "exceljs";
export const createAttendance = async (attendanceData) => {
  if (!attendanceData.userId || !attendanceData.month) {
    throw new ApiError(400, "all fields are required ");
  }
  const attendance = await attendanceRepository.findTodayAttendance(
    attendanceData.userId,
  );
  if (!attendance) {
    const createAttendanceData =
      await attendanceRepository.createAttendance(attendanceData);
    return {
      createAttendanceData,
    };
  } else {
    return {
      attendance,
    };
  }
};
export const createManualAttendance = async (attendanceData) => {
  if (!attendanceData.userId || !attendanceData.month) {
    throw new ApiError(400, "all fields are required ");
  }

  const attendance = await attendanceRepository.findTodayAttendance(
    attendanceData.userId,
  );
  if (!attendance) {
    const createAttendanceData =
      await attendanceRepository.createManualAttendance(attendanceData);
    if (attendanceData.logoutTime) {
      await calculateOvertimeForDay(createAttendanceData._id);
    }
    return {
      createAttendanceData,
    };
  } else {
    return {
      attendance,
    };
  }
};
export const getAttendance = async (userId) => {
  const createAttendanceData = await attendanceRepository.getAttendance(userId);
  return {
    createAttendanceData,
  };
};
export const updateAttendance = async (attendanceId, data) => {
  if (!attendanceId) {
    throw new ApiError(400, "attendanceId is  required ");
  }
  const createAttendanceData = await attendanceRepository.updateAttendance(
    attendanceId,
    data,
  );
  return {
    createAttendanceData,
  };
};
export const calculateAttendanceAverage = async (userId, monthId) => {
  const presentDays = await attendanceRepository.getUserMonthlyAttendance(
    userId,
    monthId,
  );

  const monthDoc = await workingDaysRepository.getTotalWorkingDays(monthId);

  if (!monthDoc) {
    throw new Error("Month record not found.");
  }

  const totalWorkingDays = monthDoc.totalWorkingDays || 0;
  const monthStr = monthDoc.month;

  const monthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
  }).format(new Date(`${monthStr}-01`));

  const attendanceAverage =
    totalWorkingDays === 0
      ? 0
      : ((presentDays / totalWorkingDays) * 100).toFixed(2);

  return {
    month: monthName,
    presentDays,
    totalWorkingDays,
    attendanceAverage,
  };
};
export const getMonthlyAttendance = async (userId) => {
  if (!userId) {
    throw new ApiError("UserId is required");
  }
  const monthlyAttendance =
    await attendanceRepository.getMonthlyAttendance(userId);
  return monthlyAttendance;
};
export const handleLogout = async (userId) => {
  const attendance = await attendanceRepository.findTodayAttendance(userId);

  if (!attendance) {
    throw new ApiError("No login record found for today.");
  }

  if (attendance.logoutTime) {
    throw new ApiError("Already logged out today.");
  }

  const updated = await attendanceRepository.updateLogoutTime(attendance);
  console.log("Updated Attendance:", updated);
  return updated;
};

export const generateDailyScanReport = async (organizationId, date) => {
  const records = await getDailyRecordsByDate(organizationId, date);

  const workbook = new ExcelJS.Workbook();

  const summarySheet = workbook.addWorksheet("Summary");
  const detailsSheet = workbook.addWorksheet("Details");
  const punchSheet = workbook.addWorksheet("Punch Logs");

  summarySheet.columns = [
    { header: "Total Staff", key: "totalStaff", width: 15 },
    { header: "Present", key: "present", width: 12 },
    { header: "Half Day", key: "halfDay", width: 12 },
    { header: "Absent", key: "absent", width: 12 },
    { header: "Approval Pending", key: "pending", width: 18 },
    { header: "Not Marked", key: "notMarked", width: 15 },
    { header: "Weekly Offs", key: "weeklyOff", width: 15 },
    { header: "Holidays", key: "holidays", width: 12 },
    { header: "Leave", key: "leave", width: 10 },
    { header: "Total Work (Min)", key: "work", width: 18 },
    { header: "Overtime (Min)", key: "overtime", width: 18 },
    { header: "Fine (Min)", key: "fine", width: 15 },
  ];

  detailsSheet.columns = [
    { header: "S.N.", key: "sn", width: 8 },
    { header: "Staff Name", key: "name", width: 25 },
    { header: "Staff Type", key: "staffType", width: 15 },
    { header: "Salary Type", key: "salaryType", width: 15 },
    { header: "Attendance", key: "attendance", width: 15 },
    { header: "Shift 1", key: "shift", width: 15 },
    { header: "In-Time", key: "inTime", width: 15 },
    { header: "Out-Time", key: "outTime", width: 15 },
    { header: "Total Work (Min)", key: "work", width: 18 },
    { header: "Overtime (Min)", key: "overtime", width: 18 },
    { header: "Fine (Min)", key: "fine", width: 15 },
    { header: "Comments", key: "comments", width: 20 },
  ];

  punchSheet.columns = [
    { header: "S.N.", key: "sn", width: 8 },
    { header: "Staff Name", key: "name", width: 25 },
    { header: "Staff Type", key: "staffType", width: 15 },
    { header: "Salary Type", key: "salaryType", width: 15 },
    { header: "Attendance", key: "attendance", width: 15 },
    { header: "Estimated Break Duration (Min)", key: "break", width: 25 },
    { header: "Estimated Break Error", key: "error", width: 25 },
  ];

  let present = 0;
  let halfDay = 0;
  let absent = 0;
  let pending = 0;
  let notMarked = 0;
  let weeklyOff = 0;
  let holidays = 0;
  let leave = 0;

  let totalWork = 0;
  let overtime = 0;
  let fine = 0;

  let index = 1;

  for (const record of records) {
    switch (record.status) {
      case "PRESENT":
        present++;
        break;
      case "HALF_DAY":
        halfDay++;
        break;
      case "ABSENT":
        absent++;
        break;
      case "PENDING_APPROVAL":
        pending++;
        break;
      case "NOT_MARKED":
        notMarked++;
        break;
      case "WEEKLY_OFF":
        weeklyOff++;
        break;
      case "HOLIDAY":
        holidays++;
        break;
      case "PAID_LEAVE":
        leave++;
        break;
    }

    totalWork += record.totalWorkMinutes || 0;
    overtime += record.totalOvertimeMinutes || 0;
    fine += record.salaryImpact?.fineAmount || 0;

    const inTime = record.scans?.length
      ? moment(record.scans[0].scanTime).format("HH:mm")
      : "-";

    const outTime = record.scans?.length
      ? moment(record.scans[record.scans.length - 1].scanTime).format("HH:mm")
      : "-";

    detailsSheet.addRow({
      sn: index,
      name: record.userId?.name || "-",
      staffType: record.userId?.staffType || "-",
      salaryType: record.userId?.salaryType || "-",
      attendance: record.status,
      shift: record.shiftSnapshot?.shiftName || "-",
      inTime,
      outTime,
      work: record.totalWorkMinutes || 0,
      overtime: record.totalOvertimeMinutes || 0,
      fine: record.salaryImpact?.fineAmount || 0,
      comments: record.approvalRemarks || "",
    });

    punchSheet.addRow({
      sn: index,
      name: record.userId?.name || "-",
      staffType: record.userId?.staffType || "-",
      salaryType: record.userId?.salaryType || "-",
      attendance: record.status,
      break: record.totalBreakMinutes || 0,
      error: record.scans?.length < 2 ? "Insufficient punch data" : "",
    });

    index++;
  }

  summarySheet.addRow({
    totalStaff: records.length,
    present,
    halfDay,
    absent,
    pending,
    notMarked,
    weeklyOff,
    holidays,
    leave,
    work: totalWork,
    overtime,
    fine,
  });

  return await workbook.xlsx.writeBuffer();
};
