import Attendance from "../models/attendance.Model.js";
import Employee from "../models/employee.Model.js";
import { Office } from "../models/organizationTiming.Model.js";

const timeStrToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

export const calculateOvertimeForDay = async (attendanceId) => {
  const attendance = await Attendance.findById(attendanceId._id);
  // if (!attendance || !attendance.loginTime) return;
  
  console.log(attendance.userId,'id');
  const employee = await Employee.find({userId:attendance.userId});
  console.log(...employee,'employee');
  console.log(employee.shiftId,'employee');
  // if (!employee || !employee.shiftId) return;
  console.log(employee.shiftId,'link');

  const office = await Office.findOne({ organizationId: attendance.organizationId });
  if (!office) throw new Error("Office timings not set");

  const shift = office.shifts.find(s => s._id.toString() === employee.shiftId.toString());
  if (!shift) throw new Error("Shift not found for employee");

  const shiftStart = timeStrToMinutes(shift.startTime);
  const shiftEnd = timeStrToMinutes(shift.endTime);
  console.log(shiftStart,shiftEnd,'link2');

  let totalBreakMinutes = 0;
  shift.breaks?.forEach(b => {
    totalBreakMinutes += timeStrToMinutes(b.endTime) - timeStrToMinutes(b.startTime);
  });

  

  const login = new Date(attendance.loginTime);
  const logout = attendance.logoutTime ? new Date(attendance.logoutTime) : null;

  const loginMinutes = login.getUTCHours() * 60 + login.getUTCMinutes();
  const logoutMinutes = logout ? logout.getUTCHours() * 60 + logout.getUTCMinutes() : null;

  const lateLoginMinutes = loginMinutes > shiftStart ? loginMinutes - shiftStart : 0;
  const earlyLogoutMinutes = logoutMinutes && logoutMinutes < shiftEnd ? shiftEnd - logoutMinutes : 0;

  const earlyOvertimeMinutes = loginMinutes < shiftStart ? shiftStart - loginMinutes : 0;
  const lateOvertimeMinutes = logoutMinutes && logoutMinutes > shiftEnd ? logoutMinutes - shiftEnd : 0;

  let workedMinutes = logoutMinutes ? logoutMinutes - loginMinutes : 0;

  if (workedMinutes < 0) workedMinutes = 0;
console.log(totalBreakMinutes);
  const requiredShiftMinutes = shiftEnd - shiftStart - totalBreakMinutes;
  const lessTime = workedMinutes < requiredShiftMinutes ? requiredShiftMinutes - workedMinutes : 0;

  await Attendance.findByIdAndUpdate(attendanceId, {
    isLateLogin: lateLoginMinutes > 0,
    lateLoginMinutes,
    isEarlyLogout: earlyLogoutMinutes > 0,
    earlyLogoutMinutes,
    isOvertime: (earlyOvertimeMinutes + lateOvertimeMinutes) > 0,
    earlyOvertimeMinutes,
    lateOvertimeMinutes,
    totalOvertimeMinutes: earlyOvertimeMinutes + lateOvertimeMinutes,
    isLessTime: lessTime > 0,
    lessTimeMinutes: lessTime,
    totalWorkedMinutes: workedMinutes,
    totalWorkedHours: (workedMinutes / 60).toFixed(2)
  });
};
