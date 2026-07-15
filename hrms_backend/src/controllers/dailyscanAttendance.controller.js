import * as dailyService from "../services/dailyscan.service.js";
import fs from "fs";
import { logout } from "./user.Controller.js";
import ApiError from "../utils/apiError.js";
import attendanceService from "../services/newAttendance.service.js";
import attendanceRepo from "../repositories/newAttendance.repository.js";
import User from "../models/user.Model.js";
import { getUTCMidnight } from "../utils/dateUtils.js";
import moment from "moment-timezone";

export const recordScan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    const { scanTime } = req.body;

    // const record = await dailyService.recordScan(userId,organizationId, scanTime);

    const record = await dailyService.userDailyScan(
      userId,
      organizationId,
      scanTime,
    );

    res.status(200).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

// export const liveFaceScan = async (organizationId, imageBuffer) => {
//   const faceMatch = await searchFace(imageBuffer);
//   if (!faceMatch) throw new Error("Face not recognized");

//   const rekognitionFaceId = faceMatch.faceId;
//   const user = await User.findOne({ rekognitionFaceId, organizationId });
//   if (!user) throw new Error("User not registered for this organization");

//   const scanTime = new Date();
//   const dailyRecord = await recordScan(user._id, organizationId, scanTime);

//   return { user, dailyRecord };
// };


export const liveFaceScanController = async (req, res, next) => {
  try {
    const { organizationId } = req.body;
    const localFilePath = req.file.path;
    const fileBuffer = fs.readFileSync(localFilePath);

    // 1. Face recognition
    const faceMatch = await searchFace(fileBuffer);
    if (!faceMatch) throw new Error("Face not recognized");
    const rekognitionFaceId = faceMatch.faceId;
    const user = await User.findOne({
      recognitionFaceIds: { $in: [rekognitionFaceId] },
    });
    if (!user) throw new Error("User not registered for this organization");

    // 2. Determine punch type based on last punch of the day
    const scanTime = new Date();
    const scanMoment = moment(scanTime);
    const timezone = await attendanceService.getOrgTimezone(organizationId);
    const date = getUTCMidnight(scanMoment.format("YYYY-MM-DD"), timezone);

    const lastPunch = await attendanceRepo.findLastPunchForDate(user._id, date);
    const punchType = !lastPunch || lastPunch.type === "OUT" ? "IN" : "OUT";

    // 3. Record the punch
    const result = await attendanceService.addPunch(
      user._id,
      organizationId,
      scanTime,
      punchType,
      "SELF",
    );

    // Clean up uploaded file
    fs.unlinkSync(localFilePath);

    res.json({
      success: true,
      message: "Face scan complete",
      data: result,
    });
  } catch (error) {
    console.error(error);
    // Clean up file on error
    if (req.file?.path) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createManualAttendance = async (req, res, next) => {
  try {
    // const record = await dailyService.createManualAttendance(req.body);
    const record = await dailyService.createEmployeeManualAttendance(
      req.body,
      req.user.id,
    );
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

export const getMonthlyReport = async (req, res, next) => {
  try {
    let userId = req.user.id;
    if (!userId) {
      userId = req.params.id;
    }
    if (!userId) {
      res.status(404).json({ message: "User Not Found" });
    }
    const { month, year } = req.query;

    const report = await dailyService.getMonthlyReport(userId, month, year);
    res.status(200).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};
export const getMonthlyReportById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      res.status(404).json({ message: "User Not Found" });
    }
    const { month, year } = req.query;

    const report = await dailyService.getMonthlyReport(userId, month, year);
    res.status(200).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

export const patchDailyScan = async (req, res) => {
  try {
    const { dailyRecordId, scans } = req.body;

    if (
      !dailyRecordId ||
      !scans ||
      !Array.isArray(scans) ||
      scans.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "dailyRecordId and a non-empty scans array are required",
      });
    }

    const updatedRecord = await dailyService.updateDailyScan(
      dailyRecordId,
      scans,
    );

    return res.status(200).json({
      success: true,
      message: "Daily scan record updated successfully",
      data: updatedRecord,
    });
  } catch (error) {
    console.error("PATCH Daily Scan Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getScanAttendance = async (req, res) => {
  const date = req.query.date;
  const userId = req.params.id;
  if (!date || !userId) {
    res.status(404).json({ message: "user Not Found" });
  }

  const userdata = await dailyService.getDailyRecord(userId, date);
  res.status(200).json({
    success: true,
    data: userdata,
  });
};

export const deleteAttendance = async (req, res) => {
  const { userId, date } = req.body;
  const organizationId = req.user?.organizationId;

  if (!userId || !date) {
    throw new ApiError(400, "Missing required fields: userId and date");
  }

  const result = await dailyService.deleteAttendanceRecord(
    userId,
    date,
    organizationId,
  );

  return res.status(200).json({
    success: true,
    message: "Attendance record deleted",
    data: result,
  });
};

export const getPendingApprovals = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const {
      startDate,
      endDate,
      userIds,
      status = "PENDING_APPROVAL",
    } = req.query;

    const approvals = await dailyService.getPendingEmpApprovals(
      organizationId,
      startDate,
      endDate,
      userIds,
      status,
    );

    res.status(200).json({
      success: true,
      data: approvals,
    });
  } catch (error) {
    next(error);
  }
};

export const approveAttendance = async (req, res, next) => {
  try {
    const { recordId } = req.params;
    const {
      status,
      remarks,
      fineAmount = 0,
      overtimePayMinutes = 0,
    } = req.body;
    const approverId = req.user.id;

    const record = await dailyService.approveEmpAttendance(
      recordId,
      status,
      remarks,
      fineAmount,
      overtimePayMinutes,
      approverId,
    );
    res.status(200).json({
      success: true,
      message: "Attendance approved successfully",
      data: record,
    });
  } catch (err) {
    next(err);
  }
};

export const rejectAttendance = async (req, res, next) => {
  try {
    const { recordId } = req.params;
    const { remarks, fineAmount = 0 } = req.body;
    const approverId = req.user.id;

    const record = await dailyService.rejectEmpAttendance(
      recordId,
      approverId,
      remarks,
      fineAmount,
    );
    res.status(200).json({
      success: true,
      message: "Attendance rejected and marked as absent",
      data: record,
    });
  } catch (err) {
    next(err);
  }
};

export const getDashboardSummary = async (req, res, next) => {
  try {
    const { organizationId } = req.user;
    let { date } = req.query;

    if (!organizationId) throw new ApiError(400, "organizationId is required");

    if (!date) date = moment().format("YYYY-MM-DD");

    const summary = await dailyService.getEmpDashboardSummary(
      organizationId,
      date,
    );

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err) {
    next(err);
  }
};

export const getDepartmentWiseAttendance = async (req, res, next) => {
  try {
    const { organizationId } = req.user;
    let { date } = req.query;
    if (!organizationId) throw new ApiError(400, "organizationId is required");

    if (!date) date = moment().format("YYYY-MM-DD");

    const result = await dailyService.getEmpDepartmentWiseAttendance(
      organizationId,
      date,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getShiftWiseAttendance = async (req, res, next) => {
  try {
    const { organizationId } = req.user;
    let { date } = req.query;
    if (!organizationId) throw new ApiError(400, "organizationId is required");

    if (!date) date = moment().format("YYYY-MM-DD");

    const result = await dailyService.getEmpShiftWiseAttendance(
      organizationId,
      date,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getDetailedAttendance = async (req, res, next) => {
  try {
    const { organizationId } = req.user;
    let { date } = req.query;
    if (!organizationId) throw new ApiError(400, "organizationId is required");

    if (!date) date = moment().format("YYYY-MM-DD");

    const details = await dailyService.getEmpDetailedAttendance(
      organizationId,
      date,
    );

    res.status(200).json({
      success: true,
      data: details,
    });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyAttendance = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    if (!userId || !month || !year) {
      throw new ApiError(400, "userId, month, and year are required");
    }

    const { summary, dailyDetails } =
      await dailyService.getEmpMonthlyAttendance(userId, month, year);

    res.status(200).json({
      success: true,
      data: {
        summary,
        dailyDetails,
      },
    });
  } catch (error) {
    next(error);
  }
};
