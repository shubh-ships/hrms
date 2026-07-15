import attendanceRepo from "../repositories/newAttendance.repository.js";
import ApiError from "../utils/apiError.js";
import Fine from "../models/fine.model.js";
import Overtime from "../models/overTime.model.js";
import shiftTemplateRepository from "../repositories/shiftTemplate.repository.js";
import weekOffTemplateRepository from "../repositories/weekOffTemplate.repository.js";
import { getHolidayTemplateByIdRepo } from "../repositories/holiday.repository.js";
import Department from "../models/department.Model.js";
import moment from "moment";

class newAttendanceHelper {
  //automation services

  async evaluateRules(
    attendanceDoc,
    employee,
    shiftTemplate,
    dayContext,
    organizationId,
  ) {
    // Get automation rules assigned to employee
    const rules = await attendanceRepo.getAssignmentsForEmployee(employee._id);
    if (!rules.length) return;

    // Extract values from attendance document
    const punches = attendanceDoc.punches;
    const shiftStart = attendanceDoc.shift.startTime;
    const shiftEnd = attendanceDoc.shift.endTime;
    const breakAllowed = attendanceDoc.shift.breakAllowedMinutes;
    const actualWorkedMinutes = attendanceDoc.work.totalWorkedMinutes; // actual minutes worked (punch – breaks)
    const expectedWorkedMinutes = attendanceDoc.work.totalWorkingMinutes; // expected from shift

    // For fixed shift, compute late, early exit, break extra
    let lateMinutes = 0;
    let earlyExitMinutes = 0;
    let extraBreakMinutes = 0;
    let earlyOvertimeMinutes = 0;
    let afterOvertimeMinutes = 0;

    // Compute total break minutes from punches (if multiple IN/OUT pairs)
    const totalBreakMinutes = this.calculateTotalBreakMinutes(punches);

    if (shiftTemplate.shiftType === "FIXED_SHIFT") {
      const checkIn = punches.find((p) => p.type === "IN")?.time;
      const checkOut = punches.find((p) => p.type === "OUT")?.time;
      if (checkIn && shiftStart) {
        const diff = (checkIn - shiftStart) / 60000;
        lateMinutes = diff > 0 ? diff : 0;
        // Early overtime: if check-in before shift start
        earlyOvertimeMinutes = diff < 0 ? -diff : 0;
      }
      if (checkOut && shiftEnd) {
        const diff = (shiftEnd - checkOut) / 60000;
        earlyExitMinutes = diff > 0 ? diff : 0;
        // After overtime: if check-out after shift end
        afterOvertimeMinutes = diff < 0 ? -diff : 0;
      }
      // Break violation: break taken more than allowed
      extraBreakMinutes = Math.max(0, totalBreakMinutes - breakAllowed);
    }

    // For open shift, only overtime based on total worked minutes vs expected
    if (shiftTemplate.shiftType === "OPEN_SHIFT") {
      if (actualWorkedMinutes > expectedWorkedMinutes) {
        afterOvertimeMinutes = actualWorkedMinutes - expectedWorkedMinutes;
      }
      // Early overtime not applicable for open shift
    }

    // Store computed values
    attendanceDoc.work.lateByMinutes = lateMinutes;
    attendanceDoc.work.earlyExitMinutes = earlyExitMinutes;
    attendanceDoc.work.extraBreakMinutes = extraBreakMinutes;
    attendanceDoc.work.earlyOvertimeMinutes = earlyOvertimeMinutes;
    attendanceDoc.work.afterOvertimeMinutes = afterOvertimeMinutes;

    // Evaluate each rule
    // for (const rule of rules) {
    //   let violationMinutes = 0;
    //   let overtimeMinutes = 0;
    //   switch (rule.type) {
    //     case "late_fine":
    //       violationMinutes = lateMinutes;
    //       break;
    //     case "early_out":
    //       violationMinutes = earlyExitMinutes;
    //       break;
    //     case "break":
    //       violationMinutes = extraBreakMinutes;
    //       break;
    //     case "overtime":
    //       overtimeMinutes = afterOvertimeMinutes;
    //       break;
    //     case "early_overtime":
    //       overtimeMinutes = earlyOvertimeMinutes;
    //       break;
    //   }

    //   if (violationMinutes > 0 && attendanceDoc.finalStatus !== "HALF_DAY") {
    //     await this.applyFineRule(
    //       rule,
    //       violationMinutes,
    //       attendanceDoc,
    //       employee,
    //       shiftTemplate,
    //       organizationId,
    //     );
    //   }
    //   if (overtimeMinutes > 0) {
    //     await this.applyOvertimeRule(
    //       rule,
    //       overtimeMinutes,
    //       attendanceDoc,
    //       employee,
    //       shiftTemplate,
    //       dayContext,
    //       organizationId,
    //     );
    //   }
    // }
  }

  async applyFineRule(
    rule,
    violationMinutes,
    attendanceDoc,
    employee,
    shiftTemplate,
    organizationId,
  ) {
    const {
      deductSalaryRule,
      markHalfDayRule,
      markAbsentRule,
      includeGraceMinutes,
    } = rule.rules;
    let effectiveMinutes = violationMinutes;
    if (includeGraceMinutes) {
      // Grace minutes would be defined in the rule? Probably a separate field.
      // For now, we assume no grace.
    }
    // Determine fine amount using slabs
    let amount = 0;
    let calculationType = null;
    let calculationValue = 0;
    if (deductSalaryRule && deductSalaryRule.rules.length) {
      // Find applicable slab
      const slab = [...deductSalaryRule.rules]
        .reverse()
        .find((r) => effectiveMinutes >= r.minMinutes);
      if (slab) {
        calculationType = slab.calculationType;
        calculationValue = slab.calculationValue;
        switch (slab.calculationType) {
          case "FIXED_AMOUNT":
            amount = slab.calculationValue;
            break;
          case "AMOUNT_PER_MINUTE":
            amount = slab.calculationValue * effectiveMinutes;
            break;
          case "AMOUNT_PER_HOUR":
            amount = slab.calculationValue * (effectiveMinutes / 60);
            break;
        }
      }
    }
    // Check half-day/absent thresholds – these are not used to change attendance type
    // They could be used for other business logic if needed, but we don't modify the attendance record here.
    // Create fine document
    if (amount > 0) {
      const fineData = {
        organizationId,
        employeeId: employee._id,
        shiftTemplateId: shiftTemplate._id,
        type:
          rule.type === "late_fine"
            ? "LATE_ENTRY"
            : rule.type === "early_out"
              ? "EARLY_EXIT"
              : "BREAK_VIOLATION",
        ruleId: rule._id,
        violationMinutes: effectiveMinutes,
        calculationType,
        calculationValue,
        amount,
        status: "APPROVED",
        source: "AUTOMATION",
      };
      const fine = await Fine.create(fineData);
      attendanceDoc.penalties.push({
        fineId: fine._id,
        snapshot: {
          type: fine.type,
          minutes: fine.violationMinutes,
          amount: fine.amount,
          ruleId: fine.ruleId,
        },
      });
    }
  }

  async applyOvertimeRule(
    rule,
    overtimeMinutes,
    attendanceDoc,
    employee,
    shiftTemplate,
    dayContext,
    organizationId,
  ) {
    const { addSalaryRule, addHalfDaySalaryRule, addFullDaySalaryRule } =
      rule.rules;
    let amount = 0;
    let calculationType = null;
    let calculationValue = 0;
    let multiplier = null;
    let perHourAmount = null;
    // Use slabs from addSalaryRule
    if (addSalaryRule && addSalaryRule.rules.length) {
      const slab = [...addSalaryRule.rules]
        .reverse()
        .find((r) => overtimeMinutes >= r.minMinutes);
      if (slab) {
        calculationType = slab.calculationType;
        calculationValue = slab.calculationValue;
        switch (slab.calculationType) {
          case "FIXED_AMOUNT":
            amount = slab.calculationValue;
            break;
          case "AMOUNT_PER_MINUTE":
            amount = slab.calculationValue * overtimeMinutes;
            break;
          case "AMOUNT_PER_HOUR":
            amount = slab.calculationValue * (overtimeMinutes / 60);
            break;
          case "SALARY_MULTIPLIER":
            // Need employee salary to multiply; assume we have that in employee model
            const perDaySalary = await this.getPerDaySalary(employee._id);
            amount = perDaySalary * slab.calculationValue;
            multiplier = slab.calculationValue;
            break;
        }
      }
    }
    // Check half-day/full-day salary addition
    let halfDayOvertime = false,
      fullDayOvertime = false;
    if (
      addHalfDaySalaryRule &&
      overtimeMinutes >= addHalfDaySalaryRule.minMinutes
    ) {
      halfDayOvertime = true;
      // If rule has calculationValue (multiplier), we could add extra half day salary
    }
    if (
      addFullDaySalaryRule &&
      overtimeMinutes >= addFullDaySalaryRule.minMinutes
    ) {
      fullDayOvertime = true;
    }
    if (amount > 0 || halfDayOvertime || fullDayOvertime) {
      const overtimeData = {
        organizationId,
        employeeId: employee._id,
        shiftTemplateId: shiftTemplate._id,
        type: rule.type === "overtime" ? "LATE_OVERTIME" : "EARLY_OVERTIME",
        ruleId: rule._id,
        overtimeMinutes,
        payableMinutes: overtimeMinutes,
        calculationType,
        calculationValue,
        amount,
        multiplier,
        perHourAmount,
        isWeekOff: !!dayContext.isWeekOff,
        isHoliday: !!dayContext.isHoliday,
        status: "APPROVED",
        source: "AUTOMATION",
      };
      const overtime = await Overtime.create(overtimeData);
      attendanceDoc.earnings.push({
        overtimeId: overtime._id,
        snapshot: {
          type: overtime.type,
          minutes: overtime.overtimeMinutes,
          amount: overtime.amount,
          multiplier: overtime.multiplier,
          isWeekOff: overtime.isWeekOff,
          isHoliday: overtime.isHoliday,
          ruleId: overtime.ruleId,
        },
      });
    }
  }

  async getPerDaySalary(employeeId) {
    // Fetch employee's monthly salary and divide by working days
    // Placeholder
    return 1000;
  }

  //expected break and working minutes calculation logic
  calculateBreakAllowedMinutes(shiftTemplate) {
    if (
      shiftTemplate.shiftType === "FIXED_SHIFT" &&
      shiftTemplate.breaks &&
      shiftTemplate.breaks.length
    ) {
      return shiftTemplate.breaks.reduce((total, brk) => {
        const start = moment(brk.startTime, "HH:mm");
        const end = moment(brk.endTime, "HH:mm");
        const duration = end.diff(start, "minutes");
        return total + duration;
      }, 0);
    }
    return shiftTemplate.breakDuration || 0;
  }

  //total taken break logic
  calculateTotalBreakMinutes(punches) {
    if (!punches || punches.length <= 2) return 0;

    // Sort punches by time
    const sorted = [...punches].sort((a, b) => a.time - b.time);
    let breakMinutes = 0;

    // Process pairs: the sequence should be IN, OUT, IN, OUT, ...
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      if (current.type === "IN" && next.type === "OUT") {
        breakMinutes += (next.time - current.time) / 60000;
      }
    }
    return breakMinutes;
  }

  //session builder
  /**
   * Build sessions array based on attendance type and input data
   */
  buildSessions(type, sessionsInput, leaveCategoryId, isCompOff) {
    const sessions = [];
    if (type === "PRESENT") {
      sessions.push({
        session: "BOTH",
        type: "PRESENT",
        source: "MANUAL",
      });
    } else if (type === "ABSENT") {
      sessions.push({
        session: "BOTH",
        type: "ABSENT",
        isPaid: false,
        source: "MANUAL",
      });
    } else if (type === "LEAVE") {
      sessions.push({
        session: "BOTH",
        type: "LEAVE",
        leaveCategoryId,
        isPaid: true, // assume paid unless overridden
        source: "MANUAL",
      });
    } else if (type === "WEEK_OFF") {
      sessions.push({
        session: "BOTH",
        type: "WEEK_OFF",
        isPaid: true,
        source: "MANUAL",
      });
    } else if (type === "HOLIDAY") {
      sessions.push({
        session: "BOTH",
        type: "HOLIDAY",
        isPaid: true,
        source: "MANUAL",
      });
    } else if (
      type === "HALF_DAY" &&
      sessionsInput &&
      sessionsInput.length === 2
    ) {
      // sessionsInput already contains two session objects
      sessions.push(...sessionsInput);
    }
    return sessions;
  }

  //calculate pay
  calculatePay(attendanceDoc) {
    let totalPayableDays = 0;
    let hasPaid = false;

    for (const sess of attendanceDoc.sessions) {
      let days = 0;
      // Determine days based on session field
      const sessionDays = sess.session === "BOTH" ? 1 : 0.5;

      switch (sess.type) {
        case "PRESENT":
        case "WEEK_OFF":
        case "HOLIDAY":
          days = sessionDays;
          hasPaid = true;
          break;
        case "LEAVE":
          if (sess.isPaid) {
            days = sessionDays;
            hasPaid = true;
          }
          break;
        case "HALF_DAY":
          if (sess.isPaid) {
            days = sessionDays; // sessionDays is 0.5 for half-day
            hasPaid = true;
          }
          break;
        case "ABSENT":
          days = 0;
          break;
        default:
          days = 0;
      }
      totalPayableDays += days;
    }

    attendanceDoc.pay.payableDays = totalPayableDays;
    attendanceDoc.pay.payType = hasPaid ? "REGULAR" : "UNPAID";
  }

  // Helper methods
  async getOrgTimezone(organizationId) {
    // This should fetch from Organization model; for now assume 'Asia/Kolkata'
    return "Asia/Kolkata";
  }

  async getShiftTemplate(shiftId) {
    // Import ShiftTemplate model
    // const ShiftTemplate = (await import("../models/ShiftTemplate.model.js")).default;
    // return await ShiftTemplate.findById(shiftId).lean();

    return await shiftTemplateRepository.findShiftTemplateById(shiftId);
  }

  async getDayContext(employee, date, organizationId, timezone) {
    // Fetch week-off and holiday templates for employee
    // For week-off: fetch WeeklyOffTemplate, check rules
    // For holiday: fetch holidayTemplate, check if date in list

    // Get week-off template
    let isWeekOff = false,
      weekOffId = null,
      weekOffType = null;
    if (employee.weeklyOffTemplateId) {
      const weekOffTemplate = await weekOffTemplateRepository.findById(
        employee.weeklyOffTemplateId,
      );
      if (weekOffTemplate) {
        // Convert UTC date to local timezone to get correct day-of-week
        const localDate = moment.tz(date, timezone);
        const dayOfWeek = localDate.day(); // 0 = Sunday, 1 = Monday, etc.
        const rule = weekOffTemplate.rules.find((r) => r.day === dayOfWeek);
        if (rule) {
          // Get week number using local date's day of month
          const weekNumber = Math.ceil(localDate.date() / 7);
          const weekOffRule = rule.weekOffs.find(
            (wo) => wo.weekNumber === weekNumber,
          );
          if (weekOffRule) {
            isWeekOff = true;
            weekOffId = weekOffTemplate._id;
            weekOffType = weekOffRule.type;
          }
        }
      }
    }
    // Get holiday
    let isHoliday = false,
      holidayId = null,
      holidayType = null;
    if (employee.holidayTemplateId) {
      // const holidayTemp = await holidayTemplate
      //   .findById(employee.holidayTemplateId)
      //   .lean();
      const holidayTemp = await getHolidayTemplateByIdRepo(
        employee.holidayTemplateId,
      );
      if (holidayTemp) {
        const holiday = holidayTemp.holidays.find((h) => {
          const hDate = new Date(h.holidayDate);
          return (
            hDate.getUTCFullYear() === date.getUTCFullYear() &&
            hDate.getUTCMonth() === date.getUTCMonth() &&
            hDate.getUTCDate() === date.getUTCDate()
          );
        });
        if (holiday) {
          isHoliday = true;
          holidayId = holiday._id;
          holidayType = "FULL_DAY"; // could be half-day if defined
        }
      }
    }
    return {
      isWeekOff,
      weekOffId,
      weekOffType,
      isHoliday,
      holidayId,
      holidayType,
    };
  }

  async computeWorkAndAutomation(
    attendanceDoc,
    employee,
    shiftTemplate,
    dayContext,
    organizationId,
  ) {
    // 1. Compute total worked minutes from punches
    if (attendanceDoc.punches && attendanceDoc.punches.length >= 2) {
      // Sort punches by time
      const sortedPunches = [...attendanceDoc.punches].sort(
        (a, b) => a.time - b.time,
      );
      let totalMinutes = 0;
      let breakMinutes = 0;

      // Process pairs: IN → OUT pairs
      for (let i = 0; i < sortedPunches.length - 1; i++) {
        const current = sortedPunches[i];
        const next = sortedPunches[i + 1];
        if (current.type === "IN" && next.type === "OUT") {
          totalMinutes += (next.time - current.time) / 60000;
        }
      }

      // For simplicity, we treat any remaining unmatched IN as no break? Or we can assume breaks are the gaps between OUT and next IN
      // But if there are more than two punches, the gaps between OUT and next IN are breaks.
      // Let's calculate breaks as the intervals where there's an OUT followed by an IN (not the first pair)
      for (let i = 1; i < sortedPunches.length - 1; i++) {
        const prev = sortedPunches[i - 1];
        const curr = sortedPunches[i];
        const next = sortedPunches[i + 1];
        if (prev.type === "OUT" && curr.type === "IN") {
          // This is a break interval: from prev.out to curr.in
          breakMinutes += (curr.time - prev.time) / 60000;
        }
      }

      attendanceDoc.work.totalWorkedMinutes = totalMinutes;
      attendanceDoc.work.extraBreakMinutes = Math.max(
        0,
        breakMinutes - (attendanceDoc.shift.breakAllowedMinutes || 0),
      );

      // Determine isPresent and isHalfDay for dayContext
      const minHalf = attendanceDoc.shift.minHalfDayMinutes || 0;
      const minFull = attendanceDoc.shift.minFullDayMinutes || 0;

      if (totalMinutes >= minHalf) {
        dayContext.isPresent = true;
        dayContext.isHalfDay = totalMinutes < minFull;

        // Determine session (SESSION_1, SESSION_2, or BOTH)
        const shiftStart = attendanceDoc.shift.startTime;
        const shiftEnd = attendanceDoc.shift.endTime;

        if (dayContext.isHalfDay && shiftStart && shiftEnd) {
          const midPoint = (shiftStart.getTime() + shiftEnd.getTime()) / 2;
          const firstIn = sortedPunches.find((p) => p.type === "IN")?.time;

          if (firstIn && firstIn.getTime() >= midPoint) {
            dayContext.session = "SESSION_2";
          } else {
            dayContext.session = "SESSION_1";
          }
        } else {
          dayContext.session = "BOTH";
        }
      } else {
        dayContext.isPresent = false;
        dayContext.isHalfDay = false;
        dayContext.session = null;
      }
    } else {
      attendanceDoc.work.totalWorkedMinutes = 0;
      attendanceDoc.work.extraBreakMinutes = 0;
      dayContext.isPresent = false;
      dayContext.isHalfDay = false;
    }

    // 2. Delegate automation rule evaluation
    await this.evaluateRules(
      attendanceDoc,
      employee,
      shiftTemplate,
      dayContext,
      organizationId,
    );
  }

  async applyWeekOffHolidayCompensation(
    attendanceDoc,
    employee,
    dayContext,
    organizationId,
  ) {
    try {
      // 1. Determine source
      const isWeekOffWork = dayContext.isWeekOff;
      const isHolidayWork = dayContext.isHoliday;

      // 2. Fetch appropriate template from employee
      const template = isWeekOffWork
        ? employee.attendanceOnWeeklyOffTemplateId
        : employee.attendanceOnHolidayTemplateId;

      if (!template) {
        throw new ApiError(
          404,
          `Employee is not assigned an ${isWeekOffWork ? "AttendanceOnWeeklyOff" : "AttendanceOnHoliday"} template.`,
        );
      }

      // 2.1 Verify template type is REGULAR_PAYABLE_DAY
      const type = isWeekOffWork
        ? template.attendanceOnWeekOffType
        : template.attendanceOnHolidayType;

      if (type !== "REGULAR_PAYABLE_DAY") {
        throw new ApiError(
          400,
          `Employee's compensation template is set to '${type}' instead of 'REGULAR_PAYABLE_DAY'.`,
        );
      }

      // 3. Check for duplicate compensation session (source: AUTO / PRESENT/HALF_DAY)
      const existingComp = attendanceDoc.sessions.find(
        (s) => (s.type === "PRESENT" || s.type === "HALF_DAY") && s.source === "AUTO",
      );
      if (existingComp) return;

      // 4. Create compensation session
      // Payable days logic: Full day present = 1, Half day present = 0.5
      const compensationSession = {
        session: dayContext.session || (dayContext.isHalfDay ? "SESSION_1" : "BOTH"),
        type: dayContext.isHalfDay ? "HALF_DAY" : "PRESENT",
        isPaid: true,
        source: "AUTO",
      };

      attendanceDoc.sessions.push(compensationSession);

      // 5. Recalculate pay (Sums up all sessions)
      this.calculatePay(attendanceDoc);

      // 6. Update attendance record in database
      await attendanceRepo.updateById(attendanceDoc._id, attendanceDoc);
    } catch (error) {
      console.error("Error in applyWeekOffHolidayCompensation:", error);
    }
  }

  convertTimeToDate(date, timeStr, timezone) {
    const dateStr = moment(date).tz(timezone).format("YYYY-MM-DD");
    const combined = `${dateStr} ${timeStr}`;

    return moment.tz(combined, "YYYY-MM-DD HH:mm", timezone).utc().toDate();
  }

  /**
   * Convert MongoDB ObjectId to a numeric ID (you may want to use a different strategy)
   */
  generateNumericId(objectId) {
    if (!objectId) return null;
    // Simple conversion: use the timestamp part (first 4 bytes) as a numeric ID
    const timestamp = objectId.getTimestamp();
    return parseInt(timestamp.getTime().toString().slice(-9)); // naive example
  }

  /**
   * Map session type to the leaveType field expected by the UI
   */
  mapSessionToLeaveType(sessionType) {
    const map = {
      PRESENT: "PRESENT",
      ABSENT: "ABSENT",
      LEAVE: "LEAVE",
      WEEK_OFF: "WEEK_OFF",
      HOLIDAY: "HOLIDAY",
      HALF_DAY: "HALF_DAY",
    };
    return map[sessionType] || "PRESENT";
  }

  computeSummary(items) {
    let present = 0,
      absent = 0,
      halfDay = 0,
      notMarked = 0;
    let workedMinutes = 0,
      fineMinutes = 0,
      overTimeMinutes = 0;
    let leaveCount = 0,
      holiday = 0,
      weekOff = 0;
    let punchInCount = 0,
      punchOutCount = 0;

    for (const item of items) {
      const attendanceType = item.attendanceType;
      switch (attendanceType) {
        case "PRESENT":
          present++;
          break;
        case "ABSENT":
          absent++;
          break;
        case "HALF_DAY":
          halfDay++;
          break;
        case "HALF_DAY":
          halfDay++;
          break; // count as halfDay in summary? adjust as needed
        case "LEAVE":
          leaveCount++;
          break;
        case "WEEK_OFF":
          weekOff++;
          break;
        case "HOLIDAY":
          holiday++;
          break;
        default:
          notMarked++;
          break;
      }
      workedMinutes += item.workedMinutes;
      fineMinutes += item.fine.minutes;
      overTimeMinutes += item.overtimes.minutes;

      // Count punches from attendance entries
      for (const att of item.attendance) {
        if (att.inTime) punchInCount++;
        if (att.outTime) punchOutCount++;
      }
    }

    // You may also need to track pending approvals for fines/overtimes
    // For simplicity, we set totalPendingApprovals = 0

    return {
      present,
      absent,
      halfDay,
      notMarked,
      workedMinutes,
      fineMinutes,
      holiday,
      weekOff,
      overTimeMinutes,
      leaveCount,
      overTimeStaffCount: overTimeMinutes > 0 ? 1 : 0,
      fineStaffCount: fineMinutes > 0 ? 1 : 0,
      // leaveBreakup: {
      //   weekOff: weekOff,
      //   holiday: holiday,
      // },
      punchSummary: {
        punchIn: punchInCount,
        punchOut: punchOutCount,
      },
    };
  }

  computeWorkAndBreakFromPunches(punches) {
    const sorted = [...punches].sort((a, b) => a.time - b.time);
    let totalWork = 0;
    let totalBreak = 0;
    let i = 0;
    while (i < sorted.length - 1) {
      const current = sorted[i];
      const next = sorted[i + 1];
      if (current.type === "IN" && next.type === "OUT") {
        const duration = (next.time - current.time) / 60000;
        totalWork += duration;
        i += 2;
      } else if (current.type === "OUT" && next.type === "IN") {
        const duration = (next.time - current.time) / 60000;
        totalBreak += duration;
        i += 2;
      } else {
        i++; // skip unmatched (should not happen in valid data)
      }
    }
    return { totalWorkedMinutes: totalWork, breakMinutes: totalBreak };
  }

  //for dashboard get apis

  async getDepartmentName(departmentId) {
    if (!departmentId) return null;
    const dept = await Department.findById(departmentId).lean();
    return dept?.name || null;
  }

  async getShiftDetails(shiftTemplateId, timezone) {
    if (!shiftTemplateId) return { aggregatedShiftName: null, shifts: [] };
    const shiftTemplate = await this.getShiftTemplate(shiftTemplateId);
    if (!shiftTemplate) return { aggregatedShiftName: null, shifts: [] };
    const shiftName = shiftTemplate.name || "Shift";
    let startTime = null,
      endTime = null;
    if (shiftTemplate.shiftType === "FIXED_SHIFT") {
      startTime = shiftTemplate.startTime;
      endTime = shiftTemplate.endTime;
    }
    return {
      aggregatedShiftName: shiftName,
      shifts: [
        {
          id: shiftTemplate._id,
          shiftName,
          startTime: startTime || null,
          endTime: endTime || null,
        },
      ],
    };
  }
}

export default new newAttendanceHelper();
