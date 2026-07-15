import Attendance from "../models/dailyscanAttendance.js";
import Employee from "../models/employee.Model.js";
import { StaffLeaveBalance } from "../models/leaveBalance.Model.js";
import { LeaveApplication } from "../models/leaveApplication.Model.js";
import { EmployeeAutomationAssignment } from "../models/automationEmployeeAssign.Model.js";
import { AutomationRuleTemplate } from "../models/automationRuleTemplate.Model.js";
import ApiError from "../utils/apiError.js";
import mongoose from "mongoose";
import ShiftTemplate from "../models/ShiftTemplate.model.js";
import Department from "../models/department.Model.js";

class AttendanceRepository {
  async findById(id) {
    try {
      const attendance = await Attendance.findById(id).lean();
      if (!attendance) throw new ApiError(404, "Attendance record not found");
      return attendance;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }

  async findByEmployeeAndDate(employeeId, date) {
    try {
      return await Attendance.findOne({
        employeeId: new mongoose.Types.ObjectId(employeeId),
        date,
      }).lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async create(data) {
    try {
      const attendance = new Attendance(data);
      await attendance.save();
      return attendance.toObject();
    } catch (error) {
      if (error.code === 11000) {
        throw new ApiError(409, "Attendance already exists for this date");
      }
      throw new ApiError(500, error.message);
    }
  }

  async updateById(id, data) {
    try {
      const updated = await Attendance.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      }).lean();
      if (!updated) throw new ApiError(404, "Attendance record not found");
      return updated;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }

  async deleteById(id) {
    try {
      const deleted = await Attendance.findByIdAndDelete(id);
      if (!deleted) throw new ApiError(404, "Attendance record not found");
      return deleted;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }

  async AttendanceFindByEmployeeAndDateRange(employeeId, startDate, endDate) {
    try {
      return await Attendance.find({
        employeeId: new mongoose.Types.ObjectId(employeeId),
        date: { $gte: startDate, $lte: endDate },
      }).lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async getSummary(employeeId, startDate, endDate) {
    try {
      return await Attendance.aggregate([
        {
          $match: {
            employeeId: new mongoose.Types.ObjectId(employeeId),
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalPresent: {
              $sum: { $cond: [{ $eq: ["$finalStatus", "PRESENT"] }, 1, 0] },
            },
            totalAbsent: {
              $sum: { $cond: [{ $eq: ["$finalStatus", "ABSENT"] }, 1, 0] },
            },
            totalLeave: {
              $sum: { $cond: [{ $eq: ["$finalStatus", "LEAVE"] }, 1, 0] },
            },
            totalHalfDay: {
              $sum: { $cond: [{ $eq: ["$finalStatus", "HALF_DAY"] }, 1, 0] },
            },
            totalWeekOff: {
              $sum: { $cond: [{ $eq: ["$finalStatus", "WEEK_OFF"] }, 1, 0] },
            },
            totalHoliday: {
              $sum: { $cond: [{ $eq: ["$finalStatus", "HOLIDAY"] }, 1, 0] },
            },
            totalWorkMinutes: { $sum: "$work.totalWorkedMinutes" },
            totalLateMinutes: { $sum: "$work.lateByMinutes" },
            totalEarlyExitMinutes: { $sum: "$work.earlyExitMinutes" },
            totalOvertimeMinutes: {
              $sum: {
                $add: [
                  "$work.afterOvertimeMinutes",
                  "$work.earlyOvertimeMinutes",
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            presentDays: "$totalPresent",
            absentDays: "$totalAbsent",
            leaveDays: "$totalLeave",
            halfDays: "$totalHalfDay",
            weekOffDays: "$totalWeekOff",
            holidayDays: "$totalHoliday",
            totalWorkMinutes: 1,
            lateMinutes: "$totalLateMinutes",
            earlyExitMinutes: "$totalEarlyExitMinutes",
            overtimeMinutes: "$totalOvertimeMinutes",
          },
        },
      ]);
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async getDailyRecords(employeeId, startDate, endDate) {
    try {
      return await Attendance.find(
        { employeeId, date: { $gte: startDate, $lte: endDate } },
        {
          date: 1,
          finalStatus: 1,
          "work.totalWorkedMinutes": 1,
          sessions: 1,
          punches: 1,
        },
      )
        .sort({ date: 1 })
        .lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async findLastPunchForDate(userId, date) {
    try {
      const employee = await Employee.findOne(userId).select("_id");
      const attendance = await this.findByEmployeeAndDate(employee._id, date);
      if (!attendance || !attendance.punches.length) return null;
      const sorted = [...attendance.punches].sort((a, b) => b.time - a.time);
      return sorted[0];
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  //Employee
  async EmployeeFindById(id) {
    try {
      const employee = await Employee.findById(id)
        .populate(
          "shiftTemplateId leaveTemplateId weeklyOffTemplateId attendanceOnWeeklyOffTemplateId attendanceOnHolidayTemplateId",
        )
        .lean();
      if (!employee) throw new ApiError(404, "Employee not found");
      return employee;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }

  async findWithPopulatedTemplates(id) {
    return this.findById(id); // already populated in findById
  }

  //Leave Balance
  async findByEmployee(employeeId) {
    try {
      const balance = await StaffLeaveBalance.findOne({ employeeId }).lean();
      if (!balance)
        throw new ApiError(404, "Leave balance not found for this employee");
      return balance;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }

  async updateBalance(employeeId, categoryId, days, isDeduction) {
    try {
      const balance = await StaffLeaveBalance.findOne({ employeeId });
      if (!balance) throw new ApiError(404, "Leave balance not found");

      const category = balance.leaveCategories.find(
        (c) => c.categoryId.toString() === categoryId.toString(),
      );
      if (!category)
        throw new ApiError(404, "Leave category not found in balance");

      const change = isDeduction ? days : -days;
      category.availedLeaves += change;
      category.leaveBalance =
        category.templateLeaveCount - category.availedLeaves;

      // Update totals
      balance.totalAvailedLeaves = balance.leaveCategories.reduce(
        (sum, c) => sum + c.availedLeaves,
        0,
      );
      balance.totalBalancedLeaves = balance.leaveCategories.reduce(
        (sum, c) => sum + c.leaveBalance,
        0,
      );

      await balance.save();
      return balance.toObject();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }

  //Leave Application
  async createLeaveApplication(data) {
    try {
      const leaveApp = new LeaveApplication(data);
      await leaveApp.save();
      return leaveApp.toObject();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async deleteLeaveApplicationById(id) {
    try {
      const deleted = await LeaveApplication.findByIdAndDelete(id);
      if (!deleted) throw new ApiError(404, "Leave application not found");
      return deleted;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }

  async findByEmployeeAndDateRange(employeeId, startDate, endDate) {
    try {
      return await LeaveApplication.find({
        employeeId,
        $or: [{ startDate: { $lte: endDate }, endDate: { $gte: startDate } }],
      }).lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  //for dashboard
  async findLeaveApplicationsByEmployeeIdsAndDateRange(
    employeeIds,
    startDate,
    endDate,
  ) {
    try {
      return await LeaveApplication.find({
        employeeId: { $in: employeeIds },
        startDate: { $gte: startDate, $lte: endDate },
        status: "APPROVED",
      }).lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async findLeaveApplicationById(id) {
    try {
      const leaveApp = await LeaveApplication.findById(id).lean();
      if (!leaveApp) throw new ApiError(404, "Leave application not found");
      return leaveApp;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, error.message);
    }
  }

  //upcoming leave applications for dashboard get api
  async findDistinctEmployeeIdsByOrganizationAndDateRange(
    organizationId,
    startDate,
  ) {
    try {
      const results = await LeaveApplication.distinct("employeeId", {
        organizationId,
        status: "APPROVED",
        startDate: { $gte: startDate },
      });
      return results;
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  //automation
  async getAssignmentsForEmployee(employeeId) {
    try {
      const assignments = await EmployeeAutomationAssignment.find({
        employeeId,
      })
        .populate("templateId")
        .lean();
      return assignments.map((a) => a.templateId);
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  //for dashboard get apis

  async findAllEmployeesByOrganization(organizationId) {
    try {
      const employees = await Employee.find({
        organizationId,
        isDeleted: false,
        "employment.status": "active",
      }).lean();
      return employees;
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async findByEmployeeIdsAndDate(employeeIds, date) {
    try {
      return await Attendance.find({
        employeeId: { $in: employeeIds },
        date,
      }).lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async findByEmployeeIdsAndDateRange(employeeIds, startDate, endDate) {
    try {
      return await Attendance.find({
        employeeId: { $in: employeeIds },
        date: { $gte: startDate, $lte: endDate },
      }).lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async findShiftsByIds(ids) {
    try {
      return await ShiftTemplate.find({ _id: { $in: ids } }).lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async findDepartmentsByIds(ids) {
    try {
      return await Department.find({ _id: { $in: ids } }).lean();
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  async getPayrollSummary(employeeId, startDate, endDate) {
    try {
      const records = await this.AttendanceFindByEmployeeAndDateRange(
        employeeId,
        startDate,
        endDate
      );

      let payableDays = 0;
      let overtimeAmount = 0;
      let fineAmount = 0;

      for (const day of records) {
        // 🟢 payable days
        payableDays += day.pay?.payableDays || 0;

        // 🟢 overtime (earnings)
        if (day.earnings?.length) {
          for (const e of day.earnings) {
            overtimeAmount += e.snapshot?.amount || 0;
          }
        }

        // 🔴 fines (penalties)
        if (day.penalties?.length) {
          for (const p of day.penalties) {
            fineAmount += p.snapshot?.amount || 0;
          }
        }
      }

      return {
        payableDays,
        overtimeAmount,
        fineAmount,
      };
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }
  async lockAttendance(employeeId, startDate, endDate) {
    try {
      return await Attendance.updateMany(
        {
          employeeId,
          date: { $gte: startDate, $lte: endDate },
        },
        {
          $set: { isLocked: true },
        }
      );
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }
}

export default new AttendanceRepository();
