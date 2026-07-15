import moment from "moment";
import Employee from "../models/employee.Model.js";
import { Office } from "../models/organizationTiming.Model.js";
import TotalWorkingDays from "../models/workingDays.Model.js";
import DailyAttendance from "../models/dailyscanAttendance.js";
import { Holiday } from "../models/holidays.Model.js";
import { Leave } from "../models/leave.Model.js";
import Policy from "../models/policy.Model.js";
import { LeavePolicy } from "../models/leavePolicy.Model.js";

const parseMinutes = timeStr => {
  if (!timeStr) return 0;
  if (typeof timeStr === "number") return timeStr;
  const h = timeStr.match(/(\d+)h/);
  const m = timeStr.match(/(\d+)m/);
  return (h ? parseInt(h[1]) : 0) * 60 + (m ? parseInt(m[1]) : 0);
};

const formatDate = date => new Date(date).toLocaleDateString("en-IN");

const getWeekOffCount = async (organizationId, month, year) => {
  const leavePolicy = await LeavePolicy.findOne({ organizationId }).lean();
  if (!leavePolicy || !leavePolicy.weekOffs?.length) return [];
  const startDate = moment({ year, month: month - 1, day: 1 });
  const endDate = moment(startDate).endOf("month");
  const weekOffDates = [];

  for (let day = startDate.clone(); day.isSameOrBefore(endDate); day.add(1, "day")) {
    const currentDayName = day.format("dddd").toLowerCase();
    const currentWeek = Math.ceil(day.date() / 7);
    leavePolicy.weekOffs.forEach(weekOff => {
      if (weekOff.day === currentDayName && weekOff.occurrence.includes(currentWeek)) {
        weekOffDates.push(day.toDate());
      }
    });
  }
  return weekOffDates;
};

const getHolidayCount = async (organizationId, month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  const holidays = await Holiday.find({
    organizationId,
    date: { $gte: startDate, $lte: endDate }
  }).lean();
  return holidays.map(h => new Date(h.date));
};

// export const salaryslipService = async ({ userId, month, year, organizationId }) => {
//   try {
//     if (!month || !year) throw new Error("Month and Year are required");

//     const employee = await Employee.findOne({ userId, organizationId })
//       .populate({ path: "organizationId", select: "name" })
//       .lean();
//     if (!employee) throw new Error("Employee not found");

//     const office = await Office.findOne({ organizationId }).lean();
//     const shift = office?.shifts?.find(s => s._id.toString() === employee.shiftId?.toString());
//     if (!shift) throw new Error("Shift not found for employee");

//     const shiftStart = moment(shift.startTime, "HH:mm");
//     const shiftEnd = moment(shift.endTime, "HH:mm");
//     const totalShiftMinutes = shiftEnd.diff(shiftStart, "minutes");

//     const baseSalaryObj = employee.salary?.find(s => s.type === "basic");
//     if (!baseSalaryObj) throw new Error("Base salary not found");
//     const baseSalary = baseSalaryObj.amount;

//     const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
//     const monthName = monthNames[month - 1];

//     const payableDaysObj = await TotalWorkingDays.findOne({
//       organizationId,
//       month: monthName,
//       year: year.toString()
//     }).lean();
//     if (!payableDaysObj) throw new Error("Total working days not found");

//     const holidays = await getHolidayCount(organizationId, month, year);
//     const weekOffs = payableDaysObj.isWeekOffIncludes
//       ? await getWeekOffCount(organizationId, month, year)
//       : [];
//     const uniquePaidDates = [
//       ...new Set([...holidays.map(d => d.toDateString()), ...weekOffs.map(d => d.toDateString())])
//     ];

//     const attendanceRecords = await DailyAttendance.find({
//       userId,
//       organizationId,
//       date: { $gte: new Date(`${year}-${month}-01`), $lte: new Date(`${year}-${month}-31`) }
//     }).lean();

//     const leaveRecords = await Leave.find({
//       employeeId: employee._id,
//       organizationId,
//       status: "rejected"
//     }).lean();

//     const policies = await Policy.find({ organizationId, isActive: true }).lean();

//     const dailySalary = baseSalary / payableDaysObj.totalWorkingDays;
//     const hourlySalary = (dailySalary / totalShiftMinutes) * 60;

//     let finalSalary = 0;
//     let totalWorkingDaysCount = 0;
//     let deductions = [];
//     let additions = [];
//     const occurrenceTracker = { late_entry: 0, early_leave: 0, breaks: 0 };
//     const deductedTracker = { late_entry: 0, early_leave: 0, breaks: 0 };

//     for (let day of attendanceRecords) {
//       totalWorkingDaysCount++;

//       const lateMinutes = parseMinutes(day.lateLoginMinutes);
//       const earlyMinutes = parseMinutes(day.earlyLogoutMinutes);
//       const breakMinutes = day.scans?.reduce((sum, s) => sum + parseMinutes(s.breakMinutes), 0) || 0;
//       const overtimeMinutes = day.totalOvertimeMinutes || 0;

//       const todayFlags = {
//         late_entry: lateMinutes > 0,
//         early_leave: earlyMinutes > 0,
//         breaks: breakMinutes > 0
//       };

//       for (const key of ["late_entry", "early_leave", "breaks"]) {
//         if (todayFlags[key]) occurrenceTracker[key]++;

//         const policy = policies.find(p => p.name === key);
//         if (!policy) continue;
//         const rule = policy.penliteRules?.find(r => r.isActive);
//         if (!rule) continue;

//         const threshold = rule.occurrence?.count || 0;
//         const extraDays = occurrenceTracker[key] - threshold - deductedTracker[key];

//         if (rule.ruleType === "salary_deduction" && extraDays > 0) {
//           rule.deductions?.forEach(d => {
//             const amount = d.deductionType === "fixed" 
//               ? d.amount 
//               : d.amount * hourlySalary * (key === "late_entry" ? lateMinutes/60 : key === "early_leave" ? earlyMinutes/60 : breakMinutes/60);
//             finalSalary -= amount;
//             deductions.push({
//               type: key,
//               rule: rule.ruleName,
//               amount: -amount,
//               description: `Deducted on ${formatDate(day.date)}`
//             });
//           });
//           deductedTracker[key] += extraDays;
//         } else if (["half_day_deduct","full_day_deduct"].includes(rule.ruleType) && occurrenceTracker[key] >= threshold + 1 && deductedTracker[key] < occurrenceTracker[key] - threshold) {
//           const amount = rule.ruleType === "half_day_deduct" ? dailySalary/2 : dailySalary;
//           finalSalary -= amount;
//           deductions.push({
//             type: key,
//             rule: rule.ruleName,
//             amount: -amount,
//             description: `Deducted on ${formatDate(day.date)}`
//           });
//           deductedTracker[key]++;
//         }
//       }

//       for (const policy of policies.filter(p => ["overtime","early_overtime"].includes(p.name))) {
//         const rule = policy.overtimeRules?.find(r => r.isActive);
//         if (!rule || overtimeMinutes <= 0) continue;

//         const thresholdMinutes = (rule.hoursThreshold || 0) * 60 + (rule.minutesThreshold || 0);
//         if (overtimeMinutes >= thresholdMinutes) {
//           let addAmount = 0;
//           if (rule.ruleType === "salary_pay") {
//             rule.overtimePay?.forEach(pay => {
//               if (pay.overtimeType === "fixed") {
//                 addAmount += pay.amount;
//                 console.log(`Fixed OT: ${pay.amount} applied on ${formatDate(day.date)}`);
//               } else if (pay.overtimeType === "multiplier") {
//                 const overtimeHours = overtimeMinutes / 60;
//                 const dailyAdd = hourlySalary * overtimeHours * pay.amount;
//                 addAmount += dailyAdd;
//                 console.log(`Multiplier OT: ${dailyAdd} applied on ${formatDate(day.date)}, hours: ${overtimeHours}, factor: ${pay.amount}`);
//               } else if (pay.overtimeType === "fixed_per_hour") {
//                 const dailyAdd = (overtimeMinutes / 60) * pay.amount;
//                 addAmount += dailyAdd;
//                 console.log(`Fixed per hour OT: ${dailyAdd} applied on ${formatDate(day.date)}`);
//               }
//             });
//           } else {
//             addAmount = rule.ruleType === "half_day_pay" ? dailySalary/2 : dailySalary;
//           }

//           if (addAmount > 0) {
//             finalSalary += addAmount;
//             additions.push({
//               type: policy.name,
//               rule: rule.ruleName,
//               amount: addAmount,
//               description: `Applied on ${formatDate(day.date)}`
//             });
//           }
//         }
//       }
//     }

//     for (let leave of leaveRecords) {
//       const leaveDeduct = leave.durationType === "halfDay" ? dailySalary/2 : dailySalary;
//       finalSalary -= leaveDeduct;
//       deductions.push({
//         type: "Rejected Leave",
//         rule: leave.leaveType,
//         amount: -leaveDeduct,
//         description: `Deducted on ${formatDate(leave.startDate)}`
//       });
//     }

//     finalSalary += dailySalary * totalWorkingDaysCount;
//     finalSalary += dailySalary * uniquePaidDates.length;

//     const totalDeductions = deductions.reduce((s, d) => s - d.amount, 0);

//     return {
//       success: true,
//       message: "Salary Slip generated successfully",
//       data: {
//         employeeInfo: {
//           employeeCode: employee.employment.employeeCode,
//           name: `${employee.personal.firstName} ${employee.personal.lastName || ""}`.trim(),
//           department: employee.employment.departmentId,
//           organization: employee.organizationId.name
//         },
//         period: {
//           month,
//           year,
//           payableDays: payableDaysObj.totalWorkingDays,
//           workingDays: totalWorkingDaysCount,
//           weekoffs: weekOffs,
//           holidays
//         },
//         earnings: [
//           { type: "Basic Salary", amount: baseSalary, description: `Based on ${totalWorkingDaysCount} days` },
//           ...additions
//         ],
//         deductions,
//         summary: {
//           grossSalary: finalSalary + totalDeductions,
//           totalDeductions,
//           netSalary: finalSalary
//         },
//         attendanceSummary: {
//           lateCount: occurrenceTracker.late_entry,
//           earlyCount: occurrenceTracker.early_leave,
//           breakCount: occurrenceTracker.breaks,
//           totalWorkingDays: totalWorkingDaysCount,
//           payableDays: payableDaysObj.totalWorkingDays
//         },
//         bankDetails: employee.bank
//       }
//     };

//   } catch (err) {
//     return { success: false, message: err.message || "Something went wrong" };
//   }
// };
























// For Each Month vikram's changes




export const salaryslipService = async ({ userId, month, year, organizationId }) => {
  try {
    if (!month || !year) throw new Error("Month and Year are required");

    const employee = await Employee.findOne({ userId, organizationId })
      .populate({ path: "organizationId", select: "name" })
      .lean();
    if (!employee) throw new Error("Employee not found");

    const office = await Office.findOne({ organizationId }).lean();
    const shift = office?.shifts?.find(s => s._id.toString() === employee.shiftId?.toString());
    if (!shift) throw new Error("Shift not found for employee");

    const shiftStart = moment(shift.startTime, "HH:mm");
    const shiftEnd = moment(shift.endTime, "HH:mm");
    const totalShiftMinutes = shiftEnd.diff(shiftStart, "minutes");

    const baseSalaryObj = employee.salary?.find(s => s.type === "basic");
    if (!baseSalaryObj) throw new Error("Base salary not found");
    const baseSalary = baseSalaryObj.amount;

    const monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];
    const monthName = monthNames[month - 1];

    const payableDaysObj = await TotalWorkingDays.findOne({
      organizationId,
      month: monthName,
      year: year.toString()
    }).lean();
    console.log(payableDaysObj,"1111")
    if (!payableDaysObj) throw new Error("Total working days not found");

    const holidays = await getHolidayCount(organizationId, month, year);
    console.log(holidays,"2222")
    const weekOffs = payableDaysObj.isWeekOffIncludes
      ? await getWeekOffCount(organizationId, month, year)
      : [];

      console.log(weekOffs,"3333")

    const uniquePaidDates = [
      ...new Set([...holidays.map(d => d.toDateString()), ...weekOffs.map(d => d.toDateString())])
    ];

    const attendanceRecords = await DailyAttendance.find({
      userId,
      organizationId,
      date: { $gte: new Date(`${year}-${month}-01`), $lte: new Date(`${year}-${month}-31`) }
    }).lean();

    const leaveRecords = await Leave.find({
      employeeId: employee._id,
      organizationId,
      status: "rejected"
    }).lean();

    const policies = await Policy.find({ organizationId, isActive: true }).lean();
    //TODO :- basesalary / 30
    const dailySalary = baseSalary / payableDaysObj.totalWorkingDays; 
    const hourlySalary = (dailySalary / totalShiftMinutes) * 60;
    console.log(dailySalary,hourlySalary,"7777")

    let finalSalary = 0;
    let totalWorkingDaysCount = 0;
    let deductions = [];
    let additions = [];

    let monthlyTracker = { late_entry: 0, early_leave: 0, breaks: 0 };
    let deductedTracker = { late_entry: 0, early_leave: 0, breaks: 0 };
    attendanceRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
    let currentMonth = null;
    console.log(attendanceRecords,"6666")
    for (let day of attendanceRecords) {
      const recordMonth = moment(day.date).month();

      if (currentMonth === null) currentMonth = recordMonth;

      if (recordMonth !== currentMonth) {
        monthlyTracker = { late_entry: 0, early_leave: 0, breaks: 0 };
        deductedTracker = { late_entry: 0, early_leave: 0, breaks: 0 };
        currentMonth = recordMonth;
      }

      totalWorkingDaysCount++;

      const lateMinutes = parseMinutes(day.lateLoginMinutes);
      const earlyMinutes = parseMinutes(day.earlyLogoutMinutes);
      const breakMinutes = day.scans?.reduce((sum, s) => sum + parseMinutes(s.breakMinutes), 0) || 0;
      const overtimeMinutes = day.totalOvertimeMinutes || 0;

      const todayFlags = {
        late_entry: lateMinutes > 0,
        early_leave: earlyMinutes > 0,
        breaks: breakMinutes > 0
      };

    
      for (const key of ["late_entry", "early_leave", "breaks"]) {
        if (todayFlags[key]) monthlyTracker[key]++;

        const policy = policies.find(p => p.name === key);
        if (!policy) continue;
        const rule = policy.penliteRules?.find(r => r.isActive);
        if (!rule) continue;

        const threshold = rule.occurrence?.count || 0;
        const extraDays = monthlyTracker[key] - threshold - deductedTracker[key];

        if (rule.ruleType === "salary_deduction" && extraDays > 0) {
          rule.deductions?.forEach(d => {
            const amount = d.deductionType === "fixed"
              ? d.amount
              : d.amount * hourlySalary * (
                key === "late_entry"
                  ? lateMinutes/60
                  : key === "early_leave"
                    ? earlyMinutes/60
                    : breakMinutes/60
              );

            finalSalary -= amount;
            deductions.push({
              type: key,
              rule: rule.ruleName,
              amount: -amount,
              description: `Deducted on ${formatDate(day.date)}`
            });
          });

          deductedTracker[key] += extraDays;
        }

        else if (
          ["half_day_deduct", "full_day_deduct"].includes(rule.ruleType) &&
          monthlyTracker[key] >= threshold + 1 &&
          deductedTracker[key] < monthlyTracker[key] - threshold
        ) {
          const amount = rule.ruleType === "half_day_deduct" ? dailySalary/2 : dailySalary;
          finalSalary -= amount;
          deductions.push({
            type: key,
            rule: rule.ruleName,
            amount: -amount,
            description: `Deducted on ${formatDate(day.date)}`
          });

          deductedTracker[key]++;
        }
      }

 
      for (const policy of policies.filter(p => ["overtime","early_overtime"].includes(p.name))) {
        const rule = policy.overtimeRules?.find(r => r.isActive);
        if (!rule || overtimeMinutes <= 0) continue;

        const thresholdMinutes = (rule.hoursThreshold || 0) * 60 + (rule.minutesThreshold || 0);

        if (overtimeMinutes >= thresholdMinutes) {
          let addAmount = 0;

          if (rule.ruleType === "salary_pay") {
            rule.overtimePay?.forEach(pay => {
              if (pay.overtimeType === "fixed") {
                addAmount += pay.amount;
              } else if (pay.overtimeType === "multiplier") {
                const overtimeHours = overtimeMinutes / 60;
                addAmount += hourlySalary * overtimeHours * pay.amount;
              } else if (pay.overtimeType === "fixed_per_hour") {
                addAmount += (overtimeMinutes / 60) * pay.amount;
              }
            });
          } else {
            addAmount = rule.ruleType === "half_day_pay" ? dailySalary/2 : dailySalary;
          }

          if (addAmount > 0) {
            finalSalary += addAmount;
            additions.push({
              type: policy.name,
              rule: rule.ruleName,
              amount: addAmount,
              description: `Applied on ${formatDate(day.date)}`
            });
          }
        }
      }
    }

 
    for (let leave of leaveRecords) {
      const leaveDeduct = leave.durationType === "halfDay" ? dailySalary/2 : dailySalary;
      finalSalary -= leaveDeduct;
      deductions.push({
        type: "Rejected Leave",
        rule: leave.leaveType,
        amount: -leaveDeduct,
        description: `Deducted on ${formatDate(leave.startDate)}`
      });
    }

    finalSalary += dailySalary * totalWorkingDaysCount;
    finalSalary += dailySalary * uniquePaidDates.length;

    const totalDeductions = deductions.reduce((s, d) => s - d.amount, 0);

    return {
      success: true,
      message: "Salary Slip generated successfully",
      data: {
        employeeInfo: {
          employeeCode: employee.employment.employeeCode,
          name: `${employee.personal.firstName} ${employee.personal.lastName || ""}`.trim(),
          department: employee.employment.departmentId,
          organization: employee.organizationId.name
        },
        period: {
          month,
          year,
          payableDays: payableDaysObj.totalWorkingDays,
          workingDays: totalWorkingDaysCount,
          weekoffs: weekOffs,
          holidays
        },
        earnings: [
          { type: "Basic Salary", amount: baseSalary, description: `Based on ${totalWorkingDaysCount} days` },
          ...additions
        ],
        deductions,
        summary: {
          grossSalary: finalSalary + totalDeductions,
          totalDeductions,
          netSalary: finalSalary
        },
        attendanceSummary: {
          lateCount: monthlyTracker.late_entry,
          earlyCount: monthlyTracker.early_leave,
          breakCount: monthlyTracker.breaks,
          totalWorkingDays: totalWorkingDaysCount,
          payableDays: payableDaysObj.totalWorkingDays
        },
        bankDetails: employee.bank
      }
    };

  } catch (err) {
    return { success: false, message: err.message || "Something went wrong" };
  }
};























