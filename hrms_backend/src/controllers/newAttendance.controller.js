import attendanceService from "../services/newAttendance.service.js";
import { successResponse } from "../utils/apiResponse.js";
import asyncHandler from "../middlewares/asyncHandler.js";

export const getMonthlyAttendanceSummary = asyncHandler(async (req, res) => {
  const { employeeId, month, year } = req.query;
  const organizationId = req.user.organizationId;
  const result = await attendanceService.getMonthlyAttendanceSummary(
    employeeId,
    parseInt(month),
    parseInt(year),
    organizationId,
  );
  return successResponse(res, "Monthly attendance summary fetched", result);
});

export const getAttendanceByDate = asyncHandler(async (req, res) => {
  const { employeeId, date } = req.query;
  const organizationId = req.user.organizationId;
  const result = await attendanceService.getAttendanceForDate(
    employeeId,
    date,
    organizationId,
  );
  return successResponse(res, "Attendance fetched", result);
});

export const markAttendance = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    createdBy: req.user._id,
    organizationId: req.user.organizationId,
  };
  const result = await attendanceService.markAttendance(payload);
  return successResponse(res, "Attendance marked successfully", result);
});

export const removeLeave = asyncHandler(async (req, res) => {
  const { employeeId, date } = req.body;
  const organizationId = req.user.organizationId;
  const result = await attendanceService.removeLeave(
    employeeId,
    date,
    organizationId,
  );
  return successResponse(res, "Leave removed successfully", result);
});

export const getLeaveBalance = asyncHandler(async (req, res) => {
  const { employeeId } = req.query;
  const balance = await attendanceService.getLeaveBalance(employeeId);
  return successResponse(res, "Leave balance fetched", balance);
});

//employee controller
export const getEmployeeDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const employee = await attendanceService.getEmployeeDetails(id);
  return successResponse(res, "Employee details fetched", employee);
});

export const addPunch = asyncHandler(async (req, res) => {
  const { employeeId, punchTime, punchType, source = "SELF" } = req.body;
  const organizationId = req.user.organizationId;
  const result = await attendanceService.addPunch(
    employeeId,
    organizationId,
    punchTime,
    punchType,
    source,
  );
  return successResponse(res, "Punch recorded successfully", result);
});

//for dashboard get apis 

export const getEmployeesAttendanceByDate = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const organizationId = req.user.organizationId;
  const result = await attendanceService.getEmployeesAttendanceByDate(organizationId, date);
  return successResponse(res, 'Employees attendance fetched', result);
});

export const getAttendanceSummaryByShift = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const organizationId = req.user.organizationId;
  const result = await attendanceService.getAttendanceSummaryByShift(organizationId, date);
  return successResponse(res, 'Attendance summary by shift fetched', result);
});

export const getAttendanceSummaryByDepartment = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const organizationId = req.user.organizationId;
  const result = await attendanceService.getAttendanceSummaryByDepartment(organizationId, date);
  return successResponse(res, 'Attendance summary by department fetched', result);
});

export const getAttendanceSummaryByDate = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const organizationId = req.user.organizationId;
  const result = await attendanceService.getAttendanceSummaryByDate(organizationId, date);
  return successResponse(res, 'Attendance summary by date fetched', result);
});
