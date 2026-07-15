import cron from "node-cron";
import moment from "moment";
import newAttendanceService from "../services/newAttendance.service.js";
import attendanceRepo from "../repositories/newAttendance.repository.js";
import Employee from "../models/employee.Model.js";
import { getUTCMidnight } from "../utils/dateUtils.js";
import newAttendanceHelper from "../helper/newAttendanceHelper.js";

const TIMEZONE = "Asia/Kolkata";

/**
 * 🟢 START OF DAY → ONLY HOLIDAY / WEEKOFF
 */
const startDayAttendance = async () => {
  const todayIST = moment().tz(TIMEZONE).format("YYYY-MM-DD");
  const dateUTC = getUTCMidnight(todayIST, TIMEZONE);

  // 🔥 get all organizations
  const orgIds = await Employee.distinct("organizationId");

  for (const orgId of orgIds) {
    // 🔥 get employees of this org
    const employees =
      await attendanceRepo.findAllEmployeesByOrganization(orgId);

    for (const emp of employees) {
      // 🔍 check existing attendance
      const existing = await attendanceRepo.findByEmployeeAndDate(
        emp._id,
        dateUTC,
        orgId
      );

      if (existing) {
        console.log("⚠️ Attendance already exists:", emp._id);
        continue;
      }

      // 🔥 get day context
      const dayContext = await newAttendanceHelper.getDayContext(
        emp,
        dateUTC,
        orgId,
        TIMEZONE
      );

      // console.log(`🧠 Day Context for ${emp._id}:`, dayContext);

      // 🟢 PRIORITY 1 → HOLIDAY
      if (dayContext.isHoliday) {
        await newAttendanceService.markAttendance({
          employeeId: emp._id,
          date: todayIST,
          type: "HOLIDAY",
          shiftId: emp.shiftTemplateId,
          organizationId: orgId,
        });

        // console.log(`✅ HOLIDAY marked for ${emp._id}`);
        continue;
      }

      // 🟡 PRIORITY 2 → WEEK OFF
      if (dayContext.isWeekOff) {
        await newAttendanceService.markAttendance({
          employeeId: emp._id,
          date: todayIST,
          type: "WEEK_OFF",
          shiftId: emp.shiftTemplateId,
          organizationId: orgId,
        });

        // console.log(`✅ WEEK_OFF marked for ${emp._id}`);
        continue;
      }

      // console.log(`ℹ️ Working day for ${emp._id}`);
    }
  }

  console.log("🟢 Start Day Attendance Done");
};

/**
 * 🔴 END OF DAY → MARK ABSENT
 */
const endDayAttendance = async () => {
  const todayIST = moment().tz(TIMEZONE).format("YYYY-MM-DD");
  const dateUTC = getUTCMidnight(todayIST, TIMEZONE);

  const orgIds = await Employee.distinct("organizationId");

  for (const orgId of orgIds) {
    const employees =
      await attendanceRepo.findAllEmployeesByOrganization(orgId);

    for (const emp of employees) {
      const existing = await attendanceRepo.findByEmployeeAndDate(
        emp._id,
        dateUTC,
        orgId
      );

      // ✅ ONLY mark absent if nothing exists
      if (existing) continue;

      await newAttendanceService.markAttendance({
        employeeId: emp._id,
        date: todayIST,
        type: "ABSENT",
        organizationId: orgId,
        createdBy: "SYSTEM_AUTO_END",
      });
    }
  }

  console.log("🔴 End Day Attendance Done");
};


/**
 * 🟢 CRON → 00:01 AM IST
 */
cron.schedule(
  "01 00 * * *",
  async () => {
    await startDayAttendance();
  },
  { timezone: TIMEZONE }
);


/**
 * 🔴 CRON → 11:59 PM IST
 */
cron.schedule(
  "59 23 * * *",
  async () => {
    await endDayAttendance();
  },
  { timezone: TIMEZONE }
);
