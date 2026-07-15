import attendanceRepo from "../repositories/newAttendance.repository.js";
import { getUTCMidnight } from "../utils/dateUtils.js";
import ApiError from "../utils/apiError.js";
import newAttendanceHelper from "../helper/newAttendanceHelper.js";
import moment from "moment";

class AttendanceService {
  //employee service
  async getEmployeeDetails(employeeId) {
    return await attendanceRepo.EmployeeFindById(employeeId);
  }

  //attendance services
  async markAttendance(payload) {
    const {
      employeeId,
      date: dateStr,
      type,
      shiftId,
      inTime,
      outTime,
      leaveCategoryId,
      isPresent, // 🆕 Mode 2: mark presence on existing week-off/holiday
      isHalfDay,
      sessions,
      organizationId,
    } = payload;

    // 1. Validation Logic: Permit isPresent/isHalfDay as alternative to type
    if (!type && !isPresent) {
      throw new ApiError(400, "Attendance type or presence is required");
    }
    if (!dateStr) throw new ApiError(400, "Date is required");
    if (!employeeId) throw new ApiError(400, "Employee ID is required");

    const timezone = await newAttendanceHelper.getOrgTimezone(organizationId);
    const date = getUTCMidnight(dateStr, timezone);

    // 2. Fetch Existing Attendance Early
    let existing = await attendanceRepo.findByEmployeeAndDate(employeeId, date);

    // Fetch employee with all templates
    const employee = await attendanceRepo.EmployeeFindById(employeeId);
    if (!employee) throw new ApiError(404, "Employee not found");

    // --- MODE 2: USER (PRESENT) ON EXISTING WEEK_OFF / HOLIDAY ---
    if (existing && !type && isPresent) {
      const dayContext = {
        isPresent: !!isPresent,
        isHalfDay: !!isHalfDay,
        isWeekOff: existing.finalStatus === "WEEK_OFF",
        isHoliday: existing.finalStatus === "HOLIDAY",
      };

      // Trigger compensation logic only if it's currently a WEEK_OFF or HOLIDAY
      if (
        (dayContext.isWeekOff || dayContext.isHoliday) &&
        dayContext.isPresent
      ) {
        await newAttendanceHelper.applyWeekOffHolidayCompensation(
          existing,
          employee,
          dayContext,
          organizationId,
        );
      }

      // After potentially updating the record via compensation, return the updated record
      const updatedRecord = await attendanceRepo.findByEmployeeAndDate(employeeId, date);
      const summary = await this.getMonthlyAttendanceSummary(
        employeeId,
        new Date().getMonth() + 1,
        new Date().getFullYear(),
        organizationId,
      );
      return { attendance: updatedRecord, summary };
    }

    // --- MODE 1: SYSTEM (CRON) or INITIAL CREATION ---
    // If we're here, either 'type' is provided or no 'existing' was found

    // Determine shift template to use
    const shiftTemplateId = shiftId || employee.shiftTemplateId;
    if (!shiftTemplateId) throw new ApiError(400, "Shift template is required");

    // Fetch shift template details
    const shiftTemplate =
      await newAttendanceHelper.getShiftTemplate(shiftTemplateId);
    if (!shiftTemplate) throw new ApiError(404, "Shift template not found");

    // Determine day context (week-off, holiday)
    const dayContext = await newAttendanceHelper.getDayContext(
      employee,
      date,
      organizationId,
      timezone,
    );

    let expectedTotalMinutes = 0;
    if (shiftTemplate.shiftType === "FIXED_SHIFT") {
      const start = moment.tz(shiftTemplate.startTime, "HH:mm", timezone);
      const end = moment.tz(shiftTemplate.endTime, "HH:mm", timezone);
      expectedTotalMinutes = end.diff(start, "minutes");
    } else if (shiftTemplate.shiftType === "OPEN_SHIFT") {
      expectedTotalMinutes = shiftTemplate.totalWorkingMinutes || 0;
    }

    // Build attendance document (if not existing or explicitly overwriting)
    let attendanceDoc = {
      organizationId,
      employeeId,
      date,
      dayContext,
      shift: {
        shiftId: shiftTemplate._id,
        type: shiftTemplate.shiftType,
        startTime: shiftTemplate.startTime
          ? newAttendanceHelper.convertTimeToDate(
            date,
            shiftTemplate.startTime,
            timezone,
          )
          : null,
        endTime: shiftTemplate.endTime
          ? newAttendanceHelper.convertTimeToDate(
            date,
            shiftTemplate.endTime,
            timezone,
          )
          : null,
        breakAllowedMinutes:
          newAttendanceHelper.calculateBreakAllowedMinutes(shiftTemplate),
        totalWorkingMinutes: shiftTemplate.totalWorkingMinutes,
        minHalfDayMinutes: shiftTemplate.minHalfDayMinutes,
        minFullDayMinutes: shiftTemplate.minFullDayMinutes,
      },
      punches: [],
      sessions: [],
      finalStatus: type || "ABSENT", // default if needed
      work: {
        totalWorkingMinutes: expectedTotalMinutes,
        totalWorkedMinutes: 0,
        lateByMinutes: 0,
        earlyExitMinutes: 0,
        extraBreakMinutes: 0,
        earlyOvertimeMinutes: 0,
        afterOvertimeMinutes: 0,
      },
      penalties: [],
      earnings: [],
      pay: { payableDays: 0, payType: null },
      decisionSource: (dayContext.isWeekOff || dayContext.isHoliday) ? "AUTO_PUNCH" : "MANUAL_OVERRIDE",
    };

    // Handle different types (SYSTEM Mode)
    switch (type) {
      case "PRESENT":
        if (!inTime || !outTime)
          throw new ApiError(400, "In and out times required for present");
        attendanceDoc.punches = [
          { type: "IN", time: new Date(inTime), sequence: 1, source: "MANUAL" },
          {
            type: "OUT",
            time: new Date(outTime),
            sequence: 2,
            source: "MANUAL",
          },
        ];
        attendanceDoc.sessions = newAttendanceHelper.buildSessions(
          "PRESENT",
          null,
          null,
          false,
        );
        await newAttendanceHelper.computeWorkAndAutomation(
          attendanceDoc,
          employee,
          shiftTemplate,
          dayContext,
          organizationId,
        );

        // If it's a WeekOff/Holiday, we preserve the system status and use compensation
        if (dayContext.isWeekOff || dayContext.isHoliday) {
          attendanceDoc.finalStatus = dayContext.isWeekOff
            ? "WEEK_OFF"
            : "HOLIDAY";
          
          const totalWorkedMinutes = attendanceDoc.work?.totalWorkedMinutes || 0;
          const minFullDay = attendanceDoc.shift?.minFullDayMinutes || 0;
          
          const compensationContext = {
            isPresent: true,
            isHalfDay: totalWorkedMinutes < minFullDay,
            isWeekOff: dayContext.isWeekOff,
            isHoliday: dayContext.isHoliday,
          };

          await newAttendanceHelper.applyWeekOffHolidayCompensation(
            attendanceDoc,
            employee,
            compensationContext,
            organizationId,
          );
        } else {
          newAttendanceHelper.calculatePay(attendanceDoc);
        }
        break;

      case "ABSENT":
        attendanceDoc.sessions = newAttendanceHelper.buildSessions(
          "ABSENT",
          null,
          null,
          false,
        );
        newAttendanceHelper.calculatePay(attendanceDoc);
        break;

      case "LEAVE": {
        if (!leaveCategoryId)
          throw new ApiError(400, "Leave category required");
        // Fetch actual leave category name from balance
        const leaveBalance = await attendanceRepo.findByEmployee(employeeId);
        const leaveCategory = leaveBalance.leaveCategories.find(
          (c) => c.categoryId.toString() === leaveCategoryId.toString(),
        );
        const resolvedCategoryName = leaveCategory?.categoryName || "Unknown";
        await attendanceRepo.updateBalance(
          employeeId,
          leaveCategoryId,
          1,
          true,
        );
        // Create leave application
        const leaveApp = await attendanceRepo.createLeaveApplication({
          organizationId,
          employeeId,
          leaveTemplateId: employee.leaveTemplateId,
          leaveCategoryId,
          leaveCategoryName: resolvedCategoryName,
          startDate: date,
          endDate: date,
          status: "APPROVED",
          appliedBy: payload.createdBy,
          appliedAt: new Date(),
          leavesAvailed: 1,
        });
        attendanceDoc.leaveApplicationId = leaveApp._id;
        attendanceDoc.sessions = newAttendanceHelper.buildSessions(
          "LEAVE",
          null,
          leaveCategoryId,
          false,
        );
        newAttendanceHelper.calculatePay(attendanceDoc);
        break;
      }

      case "WEEK_OFF":
        attendanceDoc.sessions = newAttendanceHelper.buildSessions(
          "WEEK_OFF",
          null,
          null,
          false,
        );
        newAttendanceHelper.calculatePay(attendanceDoc);
        break;

      case "HOLIDAY":
        attendanceDoc.sessions = newAttendanceHelper.buildSessions(
          "HOLIDAY",
          null,
          null,
          false,
        );
        newAttendanceHelper.calculatePay(attendanceDoc);
        break;

      case "HALF_DAY":
        if (!sessions || sessions.length !== 2)
          throw new ApiError(400, "Two sessions required for half day");
        for (const sess of sessions) {
          if (sess.type === "HALF_DAY") {
            if (!sess.inTime || !sess.outTime)
              throw new ApiError(400, "In/out times required for work session");
            attendanceDoc.punches.push(
              {
                type: "IN",
                time: new Date(sess.inTime),
                sequence: 1,
                source: "MANUAL",
              },
              {
                type: "OUT",
                time: new Date(sess.outTime),
                sequence: 2,
                source: "MANUAL",
              },
            );
            let sessionType = "HALF_DAY";
            if (dayContext.isWeekOff) sessionType = "WEEK_OFF";
            else if (dayContext.isHoliday) sessionType = "HOLIDAY";
            attendanceDoc.sessions.push({
              session: sess.session,
              type: sessionType,
              isPaid: true,
              source: "MANUAL",
            });
          } else if (sess.type === "LEAVE") {
            if (!sess.leaveCategoryId)
              throw new ApiError(400, "Leave category required for leave session");
            // Fetch actual leave category name from balance
            const halfDayLeaveBalance = await attendanceRepo.findByEmployee(employeeId);
            const halfDayLeaveCategory = halfDayLeaveBalance.leaveCategories.find(
              (c) => c.categoryId.toString() === sess.leaveCategoryId.toString(),
            );
            const halfDayCategoryName = halfDayLeaveCategory?.categoryName || "Unknown";
            await attendanceRepo.updateBalance(
              employeeId,
              sess.leaveCategoryId,
              0.5,
              true,
            );
            const halfLeaveApp = await attendanceRepo.createLeaveApplication({
              organizationId,
              employeeId,
              leaveTemplateId: employee.leaveTemplateId,
              leaveCategoryId: sess.leaveCategoryId,
              leaveCategoryName: halfDayCategoryName,
              startDate: date,
              endDate: date,
              fromSession: sess.session === "SESSION_1" ? "SESSION_1" : null,
              toSession: sess.session === "SESSION_2" ? "SESSION_2" : null,
              status: "APPROVED",
              appliedBy: payload.createdBy,
              appliedAt: new Date(),
              leavesAvailed: 0.5,
            });
            attendanceDoc.leaveApplicationId = halfLeaveApp._id;
            attendanceDoc.sessions.push({
              session: sess.session,
              type: "LEAVE",
              leaveCategoryId: sess.leaveCategoryId,
              isPaid: true,
              source: "MANUAL",
            });
          } else if (sess.type === "UNPAID") {
            attendanceDoc.sessions.push({
              session: sess.session,
              type: "HALF_DAY",
              isPaid: false,
              source: "MANUAL",
            });
          } else if (sess.type === "HOLIDAY") {
            attendanceDoc.sessions.push({
              session: sess.session,
              type: "HOLIDAY",
              isPaid: true,
              source: "MANUAL",
            });
          } else if (sess.type === "WEEK_OFF") {
            attendanceDoc.sessions.push({
              session: sess.session,
              type: "WEEK_OFF",
              isPaid: true,
              source: "MANUAL",
            });
          }
        }
        if (dayContext.isWeekOff) attendanceDoc.finalStatus = "WEEK_OFF";
        else if (dayContext.isHoliday) attendanceDoc.finalStatus = "HOLIDAY";
        else attendanceDoc.finalStatus = "HALF_DAY";
        await newAttendanceHelper.computeWorkAndAutomation(
          attendanceDoc,
          employee,
          shiftTemplate,
          dayContext,
          organizationId,
        );
        newAttendanceHelper.calculatePay(attendanceDoc);
        break;

      default:
        throw new ApiError(400, "Invalid attendance type");
    }

    let savedAttendance;
    if (existing) {
      savedAttendance = await attendanceRepo.updateById(
        existing._id,
        attendanceDoc,
      );
    } else {
      savedAttendance = await attendanceRepo.create(attendanceDoc);
    }

    // After saving, fetch updated summary
    const currentDate = new Date();
    const summary = await this.getMonthlyAttendanceSummary(
      employeeId,
      currentDate.getMonth() + 1,
      currentDate.getFullYear(),
      organizationId,
    );

    // Enrich response with leave details when applicable
    let leaveCategoryName = null;
    let leaveType = null;

    if (type === "LEAVE" || type === "HALF_DAY") {
      if (savedAttendance.leaveApplicationId) {
        const leaveAppDetails = await attendanceRepo.findLeaveApplicationById(
          savedAttendance.leaveApplicationId,
        );
        leaveCategoryName = leaveAppDetails?.leaveCategoryName || null;
      }
      leaveType = type === "LEAVE" ? "fullDay" : "halfDay";
    }

    return {
      attendance: savedAttendance,
      summary,
      ...(leaveCategoryName && { leaveCategoryName }),
      ...(leaveType && { leaveType }),
    };
  }

  async removeLeave(employeeId, dateStr, organizationId) {
    const timezone = await newAttendanceHelper.getOrgTimezone(organizationId);
    const date = getUTCMidnight(dateStr, timezone);
    const attendance = await attendanceRepo.findByEmployeeAndDate(
      employeeId,
      date,
    );
    if (!attendance) throw new ApiError(404, "Attendance record not found");

    // Check if it's a leave or half-day with leave
    if (attendance.finalStatus === "LEAVE") {
      // Revert leave balance
      const leaveSession = attendance.sessions.find((s) => s.type === "LEAVE");
      if (leaveSession && leaveSession.leaveCategoryId) {
        await attendanceRepo.updateBalance(
          employeeId,
          leaveSession.leaveCategoryId,
          1,
          false,
        );
      }
      // Delete leave application
      if (attendance.leaveApplicationId) {
        await attendanceRepo.deleteLeaveApplicationById(
          attendance.leaveApplicationId,
        );
      }
      // Delete attendance record
      await attendanceRepo.deleteById(attendance._id);
    } else if (attendance.finalStatus === "HALF_DAY") {
      // Revert leave sessions (half-day leaves)
      const leaveSessions = attendance.sessions.filter(
        (s) => s.type === "LEAVE",
      );
      for (const sess of leaveSessions) {
        await attendanceRepo.updateBalance(
          employeeId,
          sess.leaveCategoryId,
          0.5,
          false,
        );
        // Delete associated leave application (if any) – we need to track which leave application corresponds to which session
        // In our half-day logic, we created a leave application for each leave session; we stored the ID in attendance.leaveApplicationId? That only stores one. Better to store an array of leaveApplicationIds in a separate field.
        // For simplicity, we assume the leave application ID is stored in the session itself (we didn't). We'll need to extend the schema to store leaveApplicationId in session.
        // For now, we'll assume we can find the leave application by employeeId and date and session.
        const leaveApp = await attendanceRepo.findByEmployeeAndDateRange(
          employeeId,
          date,
          date,
        );
        if (leaveApp.length) {
          // Delete the one matching session
          for (const app of leaveApp) {
            if (
              (app.fromSession === sess.session &&
                app.toSession === sess.session) ||
              app.startDate.getTime() === date.getTime()
            ) {
              await attendanceRepo.deleteLeaveApplicationById(app._id);
              break;
            }
          }
        }
      }
      // Delete attendance record
      await attendanceRepo.deleteById(attendance._id);
    } else {
      throw new ApiError(
        400,
        "Only leave or half-day attendance can be removed",
      );
    }

    // Fetch updated summary
    const currentDate = new Date();
    const summary = await this.getMonthlyAttendanceSummary(
      employeeId,
      currentDate.getMonth() + 1,
      currentDate.getFullYear(),
      organizationId,
    );
    return { summary };
  }

  async getLeaveBalance(employeeId) {
    return await attendanceRepo.findByEmployee(employeeId);
  }

  async getAttendanceForDate(employeeId, dateStr, organizationId) {
    const timezone = await newAttendanceHelper.getOrgTimezone(organizationId);
    const date = getUTCMidnight(dateStr, timezone);

    // Fetch employee details
    const employee = await attendanceRepo.EmployeeFindById(employeeId);
    if (!employee) throw new ApiError(404, "Employee not found");

    // Fetch attendance record
    const attendance = await attendanceRepo.findByEmployeeAndDate(
      employeeId,
      date,
    );

    // Prepare employee object (adjust field names to your schema)
    const employeeObj = {
      id: employee.employment?.employeeCode, // adjust to your actual field
      name: `${employee.personal.firstName} ${employee.personal.lastName}`,
      organizationId: employee.organizationId, // or company code if you have it
      salaryType: employee.salaryType || "MONTHLY_REGULAR", // default if missing
    };

    // If no attendance exists, return "not marked"
    if (!attendance) {
      return {
        employee: employeeObj,
        attendances: [
          {
            id: null,
            shiftId: null,
            attendanceType: "NOT_MARKED",
            punches: [],
            session: null,
          },
        ],
      };
    }

    // Build attendance objects per session
    const attendances = [];

    for (const session of attendance.sessions) {
      const attObj = {
        id:
          attendance._id ||
          newAttendanceHelper.generateNumericId(attendance._id),
        shiftId: attendance.shift?.shiftId || null,
        attendanceType: newAttendanceHelper.mapSessionToLeaveType(session.type),
        punches: [],
        session: session.session || null,
        inTime: null,
        outTime: null,
        leaveName: null,
      };

      // Add punches and in/out times for present or half‑day sessions
      if (session.type === "PRESENT" || session.type === "HALF_DAY") {
        // Find if we have any punches and haven't added them yet to another session
        const punchesAlreadyAdded = attendances.some(a => a.punches && a.punches.length > 0);
        if (!punchesAlreadyAdded && attendance.punches.length) {
          const sortedPunches = [...attendance.punches].sort(
            (a, b) => a.time - b.time,
          );
          attObj.punches = sortedPunches.map((p) => ({
            punchType: p.type,
            punchTime: p.time,
          }));
          attObj.inTime = sortedPunches[0].time;
          attObj.outTime = sortedPunches[sortedPunches.length - 1].time;
        }
      }

      // For leave sessions, fetch leave category name
      if (session.type === "LEAVE") {
        if (attendance.leaveApplicationId) {
          const leaveApp = await attendanceRepo.findLeaveApplicationById(
            attendance.leaveApplicationId,
          );
          attObj.leaveName = leaveApp?.leaveCategoryName || null;
        }
      }

      attendances.push(attObj);
    }

    // If for some reason there are no sessions, fallback to "not marked"
    if (attendances.length === 0) {
      attendances.push({
        id:
          attendance._id ||
          newAttendanceHelper.generateNumericId(attendance._id),
        shiftId: null,
        attendanceType: "NOT_MARKED",
        punches: [],
        session: null,
        partialPresentWeight: null,
      });
    }

    return {
      employee: employeeObj,
      attendances,
    };
  }

  async getMonthlyAttendanceSummary(employeeId, month, year, organizationId) {
    const timezone = await newAttendanceHelper.getOrgTimezone(organizationId);
    const startMoment = moment
      .tz({ year, month: month - 1, day: 1 }, timezone)
      .startOf("day");
    const endMoment = startMoment.clone().endOf("month");
    const todayMoment = moment.tz(timezone).startOf("day");

    // If month is current, end at today; otherwise end at month end
    const actualEndMoment =
      year === todayMoment.year() && month === todayMoment.month() + 1
        ? todayMoment
        : endMoment;

    const startDate = startMoment.utc().toDate();
    const endDate = actualEndMoment.clone().endOf("day").utc().toDate();

    // Fetch attendance records
    const attendances =
      await attendanceRepo.AttendanceFindByEmployeeAndDateRange(
        employeeId,
        startDate,
        endDate,
      );

    // Generate all dates in range
    const dateList = [];
    let current = startMoment.clone();
    while (current <= actualEndMoment) {
      dateList.push(current.clone());
      current.add(1, "day");
    }

    // Fetch employee details
    const employee = await attendanceRepo.EmployeeFindById(employeeId);
    if (!employee) throw new ApiError(404, "Employee not found");

    // Helper to map finalStatus to day-level leaveType
    const mapFinalStatus = (status) => {
      const map = {
        PRESENT: "PRESENT",
        ABSENT: "ABSENT",
        LEAVE: "LEAVE",
        WEEK_OFF: "WEEK_OFF",
        HOLIDAY: "HOLIDAY",
        HALF_DAY: "HALF_DAY",
      };
      return map[status] || "NOT_MARKED";
    };

    const items = [];

    for (const dateMoment of dateList) {
      const localDateStr = dateMoment.format("YYYY-MM-DD");
      const attendance = attendances.find(
        (a) =>
          moment.tz(a.date, timezone).format("YYYY-MM-DD") === localDateStr,
      );

      let dayItem = {
        employeeId: employee.employment?.employeeCode,
        organizationId: employee.organizationId,
        attendanceType: "NOT_MARKED",
        leaveName: null,
        attendanceDate: localDateStr,
        workedMinutes: 0,
        attendance: [],
        fine: {
          minutes: 0,
          actualMinutes: 0,
          pendingForApproval: false,
        },
        overtimes: {
          minutes: 0,
          pendingForApproval: false,
        },
        break: {
          id: null,
          breakMinutes: null,
          pendingForApproval: null,
          breakDetails: null,
        },
        comment: { id: null, comment: null, commentUpdatedAt: null },
        attendanceId: null, // Will be set if attendance exists
      };

      if (attendance) {
        dayItem.attendanceId = attendance._id;
        dayItem.attendanceType = mapFinalStatus(attendance.finalStatus);
        dayItem.workedMinutes = attendance.work?.totalWorkedMinutes || 0;

        // Process sessions
        for (const session of attendance.sessions) {
          const attRecord = {
            id:
              attendance._id ||
              newAttendanceHelper.generateNumericId(attendance._id),
            attendanceType: newAttendanceHelper.mapSessionToLeaveType(
              session.type,
            ),
            leaveName: null,
            inTime: null,
            outTime: null,
            attendanceMarkedTime: attendance.createdAt,
            shiftId: attendance.shift?.shiftId,
            workedMinutes: 0,
            overtimeMinutes: 0,
            fineMinutes: 0,
            session: session.session || null,
            punches:attendance.punches || [],
          };

          // For work sessions, assign punches and times
          if (session.type === "PRESENT" || session.type === "HALF_DAY") {
            // Check if punches were already added to a previous session in this dayItem
            const punchesAdded = dayItem.attendance.some(a => a.inTime || a.outTime);
            if (!punchesAdded && attendance.punches.length) {
              const sortedPunches = [...attendance.punches].sort(
                (a, b) => a.time - b.time,
              );
              attRecord.inTime = sortedPunches[0].time;
              attRecord.outTime = sortedPunches[sortedPunches.length - 1].time;
              attRecord.workedMinutes =
                attendance.work?.totalWorkedMinutes || 0;
            }
          }

          // For leave sessions, fetch leave name
          if (session.type === "LEAVE" && attendance.leaveApplicationId) {
            const leaveApp = await attendanceRepo.findLeaveApplicationById(
              attendance.leaveApplicationId,
            );
            attRecord.leaveName = leaveApp?.leaveCategoryName;
            // Also set day-level leaveName
            dayItem.leaveName = leaveApp?.leaveCategoryName;
          }

          dayItem.attendance.push(attRecord);
        }

        // If no sessions (should not happen), fallback
        if (dayItem.attendance.length === 0) {
          dayItem.attendance.push({
            id:
              attendance._id ||
              newAttendanceHelper.generateNumericId(attendance._id),
            attendanceType: "NOT_MARKED",
            // ... other fields default
          });
        }

        // Calculate fines and overtimes from penalties/earnings
        let totalFineMinutes = 0;
        for (const penalty of attendance.penalties) {
          totalFineMinutes += penalty.snapshot?.minutes || 0;
        }
        dayItem.fine.minutes = totalFineMinutes;
        dayItem.fine.actualMinutes = totalFineMinutes;

        let totalOvertimeMinutes = 0;
        for (const earning of attendance.earnings) {
          totalOvertimeMinutes += earning.snapshot?.minutes || 0;
        }
        dayItem.overtimes.minutes = totalOvertimeMinutes;
      } else {
        // No attendance – neutral day with one neutral attendance entry
        dayItem.attendance = [
          {
            id: null,
            attendanceType: "NOT_MARKED",
            leaveName: null,
            inTime: null,
            outTime: null,
            attendanceMarkedTime: null,
            shiftId: null,
            workedMinutes: 0,
            overtimeMinutes: 0,
            fineMinutes: 0,
            session: null,
          },
        ];
      }

      items.push(dayItem);
    }

    // Compute summary
    const summary = newAttendanceHelper.computeSummary(items);

    // Build staff section
    const sections = [
      {
        name: "Employee",
        employee: [
          {
            id: employee.employment?.employeeCode,
            name: `${employee.personal.firstName} ${employee.personal.lastName}`,
            phone: employee.personal.phone,
            organizationId: employee.organizationId,
            startDate: moment
              .tz(employee.employment?.joinDate, timezone)
              .format("YYYY-MM-DD"),
            cycleStartDay: 1,
            isDeleted: false,
            staffType: employee.employment?.employeeType,
            salaryType: employee.salaryType || "MONTHLY_REGULAR",
            shift: employee.shiftTemplateId, // placeholder, could compute from shift template
            leaves: employee.leaveTemplateId,
            employeeCode: employee.employment.employeeCode,
          },
        ],
        count: 1,
      },
    ];

    items.sort(
      (a, b) => new Date(b.attendanceDate) - new Date(a.attendanceDate),
    );

    return { items, summary, sections };
  }

  async addPunch(
    employeeId,
    organizationId,
    punchTime,
    punchType,
    source = "SELF",
  ) {
    const timezone = await newAttendanceHelper.getOrgTimezone(organizationId);
    const punchMoment = moment.tz(punchTime, timezone);
    const date = punchMoment.clone().startOf("day").utc().toDate();

    // Fetch employee
    const employee = await attendanceRepo.EmployeeFindById(employeeId);
    if (!employee) throw new ApiError(404, "Employee not found");

    // Get shift template
    const shiftTemplateId = employee.shiftTemplateId;
    if (!shiftTemplateId)
      throw new ApiError(400, "Shift template not assigned");

    const shiftTemplate =
      await newAttendanceHelper.getShiftTemplate(shiftTemplateId);
    if (!shiftTemplate) throw new ApiError(404, "Shift template not found");

    const dayContext = await newAttendanceHelper.getDayContext(
      employee,
      date,
      organizationId,
      timezone,
    );

    // Get or create attendance record
    let attendance = await attendanceRepo.findByEmployeeAndDate(
      employeeId,
      date,
    );
    const isNew = !attendance;

    if (isNew) {
      // Build base attendance doc
      let expectedTotalMinutes = 0;
      if (shiftTemplate.shiftType === "FIXED_SHIFT") {
        const start = moment.tz(shiftTemplate.startTime, "HH:mm", timezone);
        const end = moment.tz(shiftTemplate.endTime, "HH:mm", timezone);
        expectedTotalMinutes = end.diff(start, "minutes");
      } else if (shiftTemplate.shiftType === "OPEN_SHIFT") {
        expectedTotalMinutes = shiftTemplate.totalWorkingMinutes || 0;
      }

      attendance = {
        organizationId,
        employeeId,
        date,
        dayContext,
        shift: {
          shiftId: shiftTemplate._id,
          type: shiftTemplate.shiftType,
          startTime: shiftTemplate.startTime
            ? newAttendanceHelper.convertTimeToDate(
              date,
              shiftTemplate.startTime,
              timezone,
            )
            : null,
          endTime: shiftTemplate.endTime
            ? newAttendanceHelper.convertTimeToDate(
              date,
              shiftTemplate.endTime,
              timezone,
            )
            : null,
          breakAllowedMinutes:
            newAttendanceHelper.calculateBreakAllowedMinutes(shiftTemplate),
          totalWorkingMinutes: shiftTemplate.totalWorkingMinutes,
          minHalfDayMinutes: shiftTemplate.minHalfDayMinutes,
          minFullDayMinutes: shiftTemplate.minFullDayMinutes,
        },
        punches: [],
        sessions: (dayContext.isWeekOff || dayContext.isHoliday)
          ? newAttendanceHelper.buildSessions(dayContext.isWeekOff ? "WEEK_OFF" : "HOLIDAY", null, null, false)
          : [],
        finalStatus: dayContext.isWeekOff ? "WEEK_OFF" : dayContext.isHoliday ? "HOLIDAY" : "NOT_MARKED",
        work: {
          totalWorkingMinutes: expectedTotalMinutes,
          totalWorkedMinutes: 0,
          lateByMinutes: 0,
          earlyExitMinutes: 0,
          extraBreakMinutes: 0,
          earlyOvertimeMinutes: 0,
          afterOvertimeMinutes: 0,
        },
        penalties: [],
        earnings: [],
        pay: { payableDays: 0, payType: null },
        decisionSource: (dayContext.isWeekOff || dayContext.isHoliday) ? "AUTO_PUNCH" : (source === "SELF" ? "AUTO_PUNCH" : "MANUAL_OVERRIDE"),
      };

      // Initial pay calculation for system days
      if (dayContext.isWeekOff || dayContext.isHoliday) {
        newAttendanceHelper.calculatePay(attendance);
      }
    }

    // Determine next sequence number
    const nextSeq = attendance.punches.length + 1;

    // Add the new punch
    attendance.punches.push({
      type: punchType,
      time: punchMoment.toDate(),
      sequence: nextSeq,
      source,
    });

    // If this is an OUT punch and we have at least one IN punch, finalize the day
    let finalizationDone = false;
    if (
      punchType === "OUT" &&
      attendance.punches.some((p) => p.type === "IN")
    ) {
      // Compute total worked minutes and break minutes from punches
      const { totalWorkedMinutes, breakMinutes } =
        newAttendanceHelper.computeWorkAndBreakFromPunches(attendance.punches);
      attendance.work.totalWorkedMinutes = totalWorkedMinutes;
      attendance.work.extraBreakMinutes = Math.max(
        0,
        breakMinutes - (attendance.shift.breakAllowedMinutes || 0),
      );

      // Evaluate automation (fines/overtime, does NOT change finalStatus)
      await newAttendanceHelper.computeWorkAndAutomation(
        attendance,
        employee,
        shiftTemplate,
        dayContext,
        organizationId,
      );

      // Determine finalStatus based on work minutes and shift thresholds
      const minFullDay = attendance.shift.minFullDayMinutes || 0;
      const minHalfDay = attendance.shift.minHalfDayMinutes || 0;
      const isSystemDay =
        attendance.dayContext?.isWeekOff || attendance.dayContext?.isHoliday;

      // If they worked at least half-day
      if (totalWorkedMinutes >= minHalfDay) {
        if (isSystemDay) {
          // MODE 2: Presence on System Day
          const compensationContext = {
            isPresent: true,
            isHalfDay: totalWorkedMinutes < minFullDay,
            isWeekOff: attendance.dayContext?.isWeekOff,
            isHoliday: attendance.dayContext?.isHoliday,
          };
          await newAttendanceHelper.applyWeekOffHolidayCompensation(
            attendance,
            employee,
            compensationContext,
            organizationId,
          );
        } else if (totalWorkedMinutes >= minFullDay) {
          // MODE 1: Standard PRESENT Day
          attendance.finalStatus = "PRESENT";
          attendance.sessions = [
            {
              session: "BOTH",
              type: "PRESENT",
              isPaid: true,
              source: source === "SELF" ? "SELF" : "MANUAL",
            },
          ];
        } else {
          // MODE 1: Standard HALF_DAY
          attendance.finalStatus = "HALF_DAY";
          // Determine which half was worked
          let workedSession = "SESSION_1";
          const shiftStart = attendance.shift.startTime;
          const shiftEnd = attendance.shift.endTime;
          if (shiftStart && shiftEnd) {
            const shiftMid = moment(shiftStart).add(moment(shiftEnd).diff(moment(shiftStart), "minutes") / 2, "minutes");
            const inTime = attendance.punches.find((p) => p.type === "IN")?.time;
            if (inTime && moment(inTime).isAfter(shiftMid)) workedSession = "SESSION_2";
          }
          attendance.sessions = [];
          if (workedSession === "SESSION_1") {
            attendance.sessions.push({ session: "SESSION_1", type: "HALF_DAY", isPaid: true, source: source === "SELF" ? "SELF" : "MANUAL" });
            attendance.sessions.push({ session: "SESSION_2", type: "HALF_DAY", isPaid: false, source: source === "SELF" ? "SELF" : "MANUAL" });
          } else {
            attendance.sessions.push({ session: "SESSION_1", type: "HALF_DAY", isPaid: false, source: source === "SELF" ? "SELF" : "MANUAL" });
            attendance.sessions.push({ session: "SESSION_2", type: "HALF_DAY", isPaid: true, source: source === "SELF" ? "SELF" : "MANUAL" });
          }
        }
      } else if (!isSystemDay) {
        // Standard Day - Not enough worked minutes -> ABSENT
        attendance.finalStatus = "ABSENT";
        attendance.sessions = [
          {
            session: "BOTH",
            type: "ABSENT",
            isPaid: false,
            source: source === "SELF" ? "SELF" : "MANUAL",
          },
        ];
      }

      // Calculate pay based on sessions
      newAttendanceHelper.calculatePay(attendance);

      finalizationDone = true;
    } else {
      // For IN punch only, mark status accordingly (unless it's a WeekOff/Holiday)
      const isSystemDay =
        attendance.dayContext?.isWeekOff || attendance.dayContext?.isHoliday;
      if (!isSystemDay) {
        attendance.finalStatus = "PUNCHED_IN";
      }
    }

    // Save
    let savedAttendance;
    if (isNew) {
      savedAttendance = await attendanceRepo.create(attendance);
    } else {
      savedAttendance = await attendanceRepo.updateById(
        attendance._id,
        attendance,
      );
    }

    return {
      id: savedAttendance._id,
      employeeId,
      date: punchMoment.format("YYYY-MM-DD"),
      status: savedAttendance.finalStatus,
      scanType: punchType,
      scanTime: punchMoment.toISOString(),
      isFinalized: finalizationDone,
      attendance: savedAttendance, // optional
    };
  }

  //for dashboard get apis

  async getEmployeesAttendanceByDate(organizationId, dateStr) {
    const timezone = await newAttendanceHelper.getOrgTimezone(organizationId);
    const date = getUTCMidnight(dateStr, timezone);

    // Fetch all employees
    const employees =
      await attendanceRepo.findAllEmployeesByOrganization(organizationId);
    const employeeIds = employees.map((e) => e._id);

    // Fetch all attendances for these employees on the date
    const attendances = await attendanceRepo.findByEmployeeIdsAndDate(
      employeeIds,
      date,
    );
    const attendanceMap = new Map(
      attendances.map((a) => [a.employeeId.toString(), a]),
    );

    const items = [];

    for (const employee of employees) {
      const attendance = attendanceMap.get(employee._id.toString());
      const item = {
        employeeId: employee._id,
        employeeName: `${employee.personal.firstName} ${employee.personal.lastName}`,
        departmentName: employee.employment?.departmentId
          ? await newAttendanceHelper.getDepartmentName(
            employee.employment.departmentId,
          )
          : null,
        shiftDetails: await newAttendanceHelper.getShiftDetails(
          employee.shiftTemplateId,
          timezone,
        ),
        attendanceType: "NOT_MARKED",
        leaveName: null,
        leavePendingForApproval: false,
        inTime: null,
        outTime: null,
        overtime: 0,
        fine: 0,
        attendanceId: null, // Will be set if attendance exists
      };

      if (attendance) {
        item.attendanceId = attendance._id;
        const statusMap = {
          PRESENT: "PRESENT",
          ABSENT: "ABSENT",
          LEAVE: "LEAVE",
          WEEK_OFF: "WEEK_OFF",
          HOLIDAY: "HOLIDAY",
          HALF_DAY: "HALF_DAY",
          NOT_MARKED: "NOT_MARKED",
          PUNCHED_IN: "PUNCHED_IN",
        };
        item.attendanceType = statusMap[attendance.finalStatus] || "NOT_MARKED";

        // Get inTime/outTime from punches (first IN and last OUT)
        if (attendance.punches?.length) {
          const sortedPunches = [...attendance.punches].sort(
            (a, b) => a.time - b.time,
          );
          const firstIn = sortedPunches.find((p) => p.type === "IN");
          const lastOut = sortedPunches.filter((p) => p.type === "OUT").pop();
          item.inTime = firstIn?.time || null;
          item.outTime = lastOut?.time || null;
        }

        // Leave name if leave session exists
        const leaveSession = attendance.sessions.find(
          (s) => s.type === "LEAVE",
        );
        if (leaveSession && attendance.leaveApplicationId) {
          const leaveApp = await attendanceRepo.findLeaveApplicationById(
            attendance.leaveApplicationId,
          );
          item.leaveName = leaveApp?.leaveCategoryName;
        }

        // Sum overtime minutes from earnings
        let totalOvertime = 0;
        for (const earning of attendance.earnings) {
          totalOvertime += earning.snapshot?.minutes || 0;
        }
        item.overtime = totalOvertime;

        // Sum fine minutes from penalties
        let totalFine = 0;
        for (const penalty of attendance.penalties) {
          totalFine += penalty.snapshot?.minutes || 0;
        }
        item.fine = totalFine;
        item.inTime = attendance.punches.find((p) => p.type === "IN")?.time || null;
        item.outTime = attendance.punches.filter((p) => p.type === "OUT").pop()?.time || null;

        // leavePendingForApproval could be computed if needed; default false
      }

      items.push(item);
    }

    // Sort by staff name for consistent output
    items.sort((a, b) => a.employeeName.localeCompare(b.employeeName));

    return { items };
  }

  async getAttendanceSummaryByShift(organizationId, dateStr) {
    const timezone = await newAttendanceHelper.getOrgTimezone(organizationId);
    const date = getUTCMidnight(dateStr, timezone);

    // Fetch all employees
    const employees =
      await attendanceRepo.findAllEmployeesByOrganization(organizationId);
    const employeeIds = employees.map((e) => e._id);

    // Fetch all attendances for these employees on the date
    const attendances = await attendanceRepo.findByEmployeeIdsAndDate(
      employeeIds,
      date,
    );
    const attendanceMap = new Map(
      attendances.map((a) => [a.employeeId.toString(), a]),
    );

    // Group by shift template
    const shiftGroups = new Map(); // key: shiftId string, value: counts
    const shiftIds = new Set();

    for (const employee of employees) {
      const shiftId = employee.shiftTemplateId
        ? employee.shiftTemplateId.toString()
        : "unassigned";
      shiftIds.add(shiftId);

      if (!shiftGroups.has(shiftId)) {
        shiftGroups.set(shiftId, {
          present: 0,
          absent: 0,
          halfDay: 0,
          notMarked: 0,
          onLeave: 0,
          fineMinutes: 0,
          overtimeMinutes: 0,
        });
      }
      const group = shiftGroups.get(shiftId);
      const attendance = attendanceMap.get(employee._id.toString());

      if (attendance) {
        const status = attendance.finalStatus;
        switch (status) {
          case "PRESENT":
            group.present++;
            break;
          case "ABSENT":
            group.absent++;
            break;
          case "HALF_DAY":
            group.halfDay++;
            break;
          case "LEAVE":
            group.onLeave++;
            break;
          default:
            group.notMarked++;
        }

        // Sum fines and overtime minutes
        let totalFine = 0;
        for (const penalty of attendance.penalties) {
          totalFine += penalty.snapshot?.minutes || 0;
        }
        group.fineMinutes += totalFine;

        let totalOvertime = 0;
        for (const earning of attendance.earnings) {
          totalOvertime += earning.snapshot?.minutes || 0;
        }
        group.overtimeMinutes += totalOvertime;
      } else {
        group.notMarked++;
      }
    }

    // Fetch shift template names for non-unassigned IDs
    const templateIds = [...shiftIds].filter((id) => id !== "unassigned");
    const templates = templateIds.length
      ? await attendanceRepo.findShiftsByIds(templateIds)
      : [];
    const templateMap = new Map(
      templates.map((t) => [t._id.toString(), t.name]),
    );

    // Build result items
    const items = [];
    for (const [shiftId, group] of shiftGroups.entries()) {
      let name;
      if (shiftId === "unassigned") {
        name = "Unassigned Shift";
      } else {
        name = templateMap.get(shiftId) || "Unknown Shift";
      }
      items.push({
        name,
        present: group.present,
        absent: group.absent,
        halfDay: group.halfDay,
        notMarked: group.notMarked,
        onLeave: group.onLeave,
        fine: group.fineMinutes,
        overTime: group.overtimeMinutes,
      });
    }

    // Sort by name
    items.sort((a, b) => a.name.localeCompare(b.name));

    return { items };
  }

  async getAttendanceSummaryByDepartment(organizationId, dateStr) {
    const timezone = await newAttendanceHelper.getOrgTimezone(organizationId);
    const date = getUTCMidnight(dateStr, timezone);

    // Fetch all employees
    const employees =
      await attendanceRepo.findAllEmployeesByOrganization(organizationId);
    const employeeIds = employees.map((e) => e._id);

    // Fetch all attendances for these employees on the date
    const attendances = await attendanceRepo.findByEmployeeIdsAndDate(
      employeeIds,
      date,
    );
    const attendanceMap = new Map(
      attendances.map((a) => [a.employeeId.toString(), a]),
    );

    // Group by shift template
    const departmentGroups = new Map(); // key: shiftId string, value: counts
    const departmentIds = new Set();

    for (const employee of employees) {
      const departmentId = employee.employment.departmentId
        ? employee.employment.departmentId.toString()
        : "unassigned";
      departmentIds.add(departmentId);

      if (!departmentGroups.has(departmentId)) {
        departmentGroups.set(departmentId, {
          present: 0,
          absent: 0,
          halfDay: 0,
          notMarked: 0,
          onLeave: 0,
          fineMinutes: 0,
          overtimeMinutes: 0,
        });
      }
      const group = departmentGroups.get(departmentId);
      const attendance = attendanceMap.get(employee._id.toString());

      if (attendance) {
        const status = attendance.finalStatus;
        switch (status) {
          case "PRESENT":
            group.present++;
            break;
          case "ABSENT":
            group.absent++;
            break;
          case "HALF_DAY":
            group.halfDay++;
            break;
          case "LEAVE":
            group.onLeave++;
            break;
          default:
            group.notMarked++;
        }

        // Sum fines and overtime minutes
        let totalFine = 0;
        for (const penalty of attendance.penalties) {
          totalFine += penalty.snapshot?.minutes || 0;
        }
        group.fineMinutes += totalFine;

        let totalOvertime = 0;
        for (const earning of attendance.earnings) {
          totalOvertime += earning.snapshot?.minutes || 0;
        }
        group.overtimeMinutes += totalOvertime;
      } else {
        group.notMarked++;
      }
    }

    // Fetch shift template names for non-unassigned IDs
    const templateIds = [...departmentIds].filter((id) => id !== "unassigned");
    const templates = templateIds.length
      ? await attendanceRepo.findDepartmentsByIds(templateIds)
      : [];
    const templateMap = new Map(
      templates.map((t) => [t._id.toString(), t.name]),
    );

    // Build result items
    const items = [];
    for (const [departmentId, group] of departmentGroups.entries()) {
      let name;
      if (departmentId === "unassigned") {
        name = "Unassigned Department";
      } else {
        name = templateMap.get(departmentId) || "Unknown Department";
      }
      items.push({
        name,
        present: group.present,
        absent: group.absent,
        halfDay: group.halfDay,
        notMarked: group.notMarked,
        onLeave: group.onLeave,
        fine: group.fineMinutes,
        overTime: group.overtimeMinutes,
      });
    }

    // Sort by name
    items.sort((a, b) => a.name.localeCompare(b.name));

    return { items };
  }

  async getAttendanceSummaryByDate(organizationId, dateStr) {
    const timezone = await newAttendanceHelper.getOrgTimezone(organizationId);
    const date = getUTCMidnight(dateStr, timezone);

    // Fetch all employees (including deactivated)
    const employees =
      await attendanceRepo.findAllEmployeesByOrganization(organizationId);
    const employeeIds = employees.map((e) => e._id);

    // Fetch all attendances for this date
    const attendances = await attendanceRepo.findByEmployeeIdsAndDate(
      employeeIds,
      date,
    );
    const attendanceMap = new Map(
      attendances.map((a) => [a.employeeId.toString(), a]),
    );

    // Fetch upcoming leaves (approved leaves with startDate >= today)
    const today = moment.tz(timezone).startOf("day").toDate();
    const upcomingLeaves =
      await attendanceRepo.findDistinctEmployeeIdsByOrganizationAndDateRange(
        organizationId,
        today,
      );

    let present = 0,
      absent = 0,
      halfDay = 0,
      notMarked = 0,
      onLeave = 0;
    let overtimeMinutes = 0,
      overtimeStaffCount = 0;
    let fineMinutes = 0,
      fineStaffCount = 0;
    let punchInCount = 0,
      punchOutCount = 0;
    let deactivatedCount = 0;

    for (const emp of employees) {
      // Check deactivated
      if (
        emp.isDeleted ||
        (emp.employment?.status && emp.employment.status !== "active")
      ) {
        deactivatedCount++;
        continue; // Do not count them in other metrics
      }

      const attendance = attendanceMap.get(emp._id.toString());
      if (attendance) {
        switch (attendance.finalStatus) {
          case "PRESENT":
            present++;
            break;
          case "ABSENT":
            absent++;
            break;
          case "HALF_DAY":
            halfDay++;
            break;
          case "LEAVE":
            onLeave++;
            break;
          case "WEEK_OFF":
          case "HOLIDAY":
            // Treat as present for count
            present++;
            break;
          default:
            notMarked++;
        }

        // Sum fines and overtime
        let empOvertime = 0;
        for (const earning of attendance.earnings) {
          empOvertime += earning.snapshot?.minutes || 0;
        }
        if (empOvertime > 0) {
          overtimeStaffCount++;
          overtimeMinutes += empOvertime;
        }

        let empFine = 0;
        for (const penalty of attendance.penalties) {
          empFine += penalty.snapshot?.minutes || 0;
        }
        if (empFine > 0) {
          fineStaffCount++;
          fineMinutes += empFine;
        }

        // Count punches
        for (const punch of attendance.punches) {
          if (punch.type === "IN") punchInCount++;
          else if (punch.type === "OUT") punchOutCount++;
        }
      } else {
        notMarked++;
      }
    }

    return {
      present,
      absent,
      halfDay,
      notMarked,
      onLeave,
      overTime: {
        staff: overtimeStaffCount,
        minutes: overtimeMinutes,
      },
      fine: {
        staff: fineStaffCount,
        minutes: fineMinutes,
      },
      deactivated: deactivatedCount,
      upcomingLeaves: upcomingLeaves.length,
      punchSummary: {
        punchIn: punchInCount,
        punchOut: punchOutCount,
      },
    };
  }

  //TODO:- muster roll api remaining

  //
}

export default new AttendanceService();
