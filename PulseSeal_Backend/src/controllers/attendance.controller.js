import * as attendanceServices from "../services/attendance.service.js";
import { successResponse } from "../utils/apiResponse.js";
import asyncHandler from "../middlewares/asyncHandler.js";

export const createAttendance = asyncHandler(async (req, res) => {
  const data = {
    ...req.body,
    userId: req.user.id,
  };
  const createAttendancedata = await attendanceServices.createAttendance(data);

  return successResponse(
    res,
    "attendance marks sucessfully ",
    createAttendancedata,
    200,
  );
});
export const createManualAttendance = asyncHandler(async (req, res) => {
  const data = {
    ...req.body,
  };
  const createAttendancedata =
    await attendanceServices.createManualAttendance(data);

  return successResponse(
    res,
    "attendance marks sucessfully ",
    createAttendancedata,
    200,
  );
});
export const updateAttendance = asyncHandler(async (req, res) => {
  const attendanceId = req.params.id;
  const data = req.body;
  const updateAttendancedata = await attendanceServices.updateAttendance(
    attendanceId,
    data,
  );

  return successResponse(
    res,
    "attendance marks sucessfully ",
    updateAttendancedata,
    200,
  );
});
export const getAttendance = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const getUserAttendance = await attendanceServices.getAttendance(userId);

  return successResponse(
    res,
    "attendance fetched sucessfully ",
    getUserAttendance,
    200,
  );
});
export const getAllAttendance = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;
  const getUserAttendance =
    await attendanceServices.getAttendance(organizationId);
  console.log(organizationId);
  return successResponse(
    res,
    "attendance fetched sucessfully ",
    getUserAttendance,
    200,
  );
});
export const getAttendanceAverage = asyncHandler(async (req, res) => {
  const monthId = req.params.id;
  const userId = req.user.id;
  const data = await attendanceServices.calculateAttendanceAverage(
    userId,
    monthId,
  );
  return successResponse(res, "Attendance fetch Successfully", data, 200);
});
export const getMonthlyAttendance = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const monthlyAttendancedata =
    await attendanceServices.getMonthlyAttendance(userId);

  return successResponse(
    res,
    "Attendance fetch Successfully",
    monthlyAttendancedata,
    200,
  );
});
export const markLogout = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const updatedAttendance = await attendanceServices.handleLogout(userId);
  successResponse(res, "Logout successful.", updatedAttendance, 200);
});

export const getOrganizationMonthlyAttendance = asyncHandler(
  async (req, res) => {
    const userId = req.params.id;
    const data = await attendanceServices.getMonthlyAttendance(userId);
    return successResponse(res, "Attendance fetch Successfully", data, 200);
  },
);

export const getDailyScanReport = async (req, res, next) => {
  try {
    console.log("===== DAILY SCAN REPORT CONTROLLER START =====");

    const { date } = req.query;
    const organizationId = req.user?.organizationId;

    console.log("Received Date:", date);
    console.log("Organization ID:", organizationId);

    // Validate organization
    if (!organizationId) {
      console.error("Organization ID missing in request user");
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Organization not found in user session",
      });
    }

    // Validate date presence
    if (!date) {
      console.error("Date parameter missing in query");
      return res.status(400).json({
        success: false,
        message: "Date query parameter is required",
      });
    }

    // Validate date format
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      console.error("Invalid date format received:", date);
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Please send a valid date.",
      });
    }

    console.log("Calling generateDailyScanReport service...");

    const excelBuffer = await attendanceServices.generateDailyScanReport(
      organizationId,
      date,
    );

    if (!excelBuffer) {
      console.error("Excel buffer generation failed");
      return res.status(500).json({
        success: false,
        message: "Failed to generate attendance report",
      });
    }

    console.log("Excel buffer generated successfully");

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=daily-attendance-${date}.xlsx`,
    );

    console.log("Sending Excel file to client");

    res.send(excelBuffer);

    console.log("===== DAILY SCAN REPORT CONTROLLER END =====");
  } catch (error) {
    console.error("ERROR IN DAILY SCAN REPORT CONTROLLER");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error while generating report",
      error: error.message,
    });
  }
};
