import express from "express";
import {
  // getAttendanceSummary,
  getAttendanceByDate,
  markAttendance,
  removeLeave,
  getLeaveBalance,
  getMonthlyAttendanceSummary,
  addPunch,
  getEmployeesAttendanceByDate,
  getAttendanceSummaryByShift,
  getAttendanceSummaryByDepartment,
  getAttendanceSummaryByDate
} from "../controllers/newAttendance.controller.js";
import { protect } from "../middlewares/auth.js";
import { upload } from "../middlewares/multer.js";

const router = express.Router();

router.use(protect);

router.get("/monthly-summary", getMonthlyAttendanceSummary);
router.get("/by-date", getAttendanceByDate);
router.post("/mark", markAttendance);
router.delete("/leave", removeLeave);
router.get("/leave-balance", getLeaveBalance);

router.post('/punch', addPunch);

//for dashboard get apis 

router.get('/date/:date', getEmployeesAttendanceByDate);
router.get('/shift-summary/:date', getAttendanceSummaryByShift);
router.get('/department-summary/:date', getAttendanceSummaryByDepartment)
router.get('/summary/date/:date', getAttendanceSummaryByDate);

//TODO:- muster roll api remaining

export default router;
