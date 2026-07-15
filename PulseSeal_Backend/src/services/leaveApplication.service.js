// services/leaveApplication.service.js
import leaveApplicationRepository from "../repositories/leaveApplication.repository.js";
import leaveBalanceRepository from "../repositories/leaveBalance.repository.js";
import leaveTemplateRepository from "../repositories/leaveTemplate.repository.js";
import Employee from "../models/employee.Model.js";
import ApiError from "../utils/apiError.js";
import mongoose from "mongoose";

class LeaveApplicationService {
  // ---------- Helper: calculate leave days (supports half-day) ----------
  // Helper: calculate leave days with session support for ranges
  calculateLeaveDays(startDate, endDate, fromSession, toSession) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Normalize to midnight for date difference
    const startDay = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
    );
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const dayDiff = (endDay - startDay) / (1000 * 60 * 60 * 24); // days between (e.g., 1 for day1 to day2)

    // Session offsets: start time (0 = start of day, 0.5 = noon) and end time (0.5 = noon, 1 = end of day)
    const sessionStart = { SESSION_1: 0, SESSION_2: 0.5 };
    const sessionEnd = { SESSION_1: 0.5, SESSION_2: 1 };

    // Default values: if no session provided, assume full day (start at 0, end at 1)
    const startOffset = fromSession ? sessionStart[fromSession] : 0;
    const endOffset = toSession ? sessionEnd[toSession] : 1;

    // For a single day, validate that fromOffset <= toOffset
    if (dayDiff === 0 && startOffset > endOffset) {
      throw new ApiError(
        400,
        "Invalid session combination: fromSession cannot be after toSession on the same day",
      );
    }

    // Total days = days between + (end offset - start offset)
    return dayDiff + (endOffset - startOffset);
  }

  // ---------- Helper: validate leave balance ----------
  async validateBalance(employeeId, organizationId, categoryId, requiredDays) {
    const balance = await leaveBalanceRepository.findByEmployee(
      employeeId,
      organizationId,
    );
    if (!balance) {
      throw new ApiError(400, "Leave balance not found for this employee");
    }
    const category = balance.leaveCategories.find(
      (c) => c.categoryId.toString() === categoryId.toString(),
    );
    if (!category) {
      throw new ApiError(400, "Leave category not found in employee balance");
    }
    if (category.leaveBalance < requiredDays) {
      throw new ApiError(
        400,
        `Insufficient leave balance. Available: ${category.leaveBalance}, Required: ${requiredDays}`,
      );
    }
    return { balance, category };
  }

  // ---------- Apply for leave ----------
  async applyLeave(req) {
    const {
      employeeId,
      leaveTemplateId,
      leaveCategoryId,
      startDate,
      endDate,
      fromSession,
      toSession,
      description,
      isCompOffLeave,
      shiftId,
      attachments,
    } = req.body;
    const { organizationId } = req.user;
    const appliedBy = req.user.id;

    // ----- Required fields (common) -----
    if (
      !organizationId ||
      !employeeId ||
      !startDate ||
      !endDate ||
      !fromSession ||
      !toSession
    ) {
      throw new ApiError(400, "Missing required fields");
    }

    // ----- Validate dates -----
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      throw new ApiError(400, "Start date cannot be after end date");
    }

    // ----- Verify employee exists -----
    const employee = await Employee.findOne({
      _id: employeeId,
      organizationId,
      isDeleted: false,
    });
    if (!employee) {
      throw new ApiError(404, "Employee not found");
    }

    // ----- Calculate number of days (always needed) -----
    const leavesAvailed = this.calculateLeaveDays(
      startDate,
      endDate,
      fromSession,
      toSession,
    );

    // ----- Handle based on leave type -----
    let leaveCategoryName = "";
    let leaveCategoryIdToStore = null;
    let isUnpaid = false;

    if (isCompOffLeave) {
      // ---------- Compensatory Off Leave ----------
      // Must have leaveCategoryId (the ID of the comp‑off category in the balance)
      if (!leaveCategoryId) {
        throw new ApiError(
          400,
          "leaveCategoryId is required for comp‑off leave",
        );
      }

      // Fetch employee's leave balance (must exist, even if no template)
      const balance = await leaveBalanceRepository.findByEmployee(
        employeeId,
        organizationId,
      );
      if (!balance) {
        throw new ApiError(404, "Leave balance not found for this employee");
      }

      // Find the specific comp‑off category
      const compOffCat = balance.leaveCategories.find(
        (c) =>
          c.categoryId.toString() === leaveCategoryId.toString() &&
          c.isCompOffLeave === true,
      );
      if (!compOffCat) {
        throw new ApiError(
          400,
          "Comp‑off category not found in employee's balance",
        );
      }

      // Validate sufficient balance (optional – if you want to enforce)
      if (compOffCat.leaveBalance < leavesAvailed) {
        throw new ApiError(
          400,
          `Insufficient comp‑off balance. Available: ${compOffCat.leaveBalance}, Required: ${leavesAvailed}`,
        );
      }

      leaveCategoryName = compOffCat.categoryName;
      leaveCategoryIdToStore = compOffCat.categoryId;
    } else {
      // ---------- Paid or Unpaid Leave ----------
      if (!leaveTemplateId) {
        throw new ApiError(
          400,
          "leaveTemplateId is required for paid or unpaid leave",
        );
      }

      // Check employee has this template
      if (
        !employee.leaveTemplateId ||
        employee.leaveTemplateId.toString() !== leaveTemplateId
      ) {
        throw new ApiError(
          400,
          "Employee is not assigned to the provided leave template",
        );
      }

      // Determine if unpaid
      isUnpaid = !leaveCategoryId; // no category provided => unpaid

      if (!isUnpaid) {
        // Paid leave: validate category exists in template and balance
        const template = await leaveTemplateRepository.findOne({
          _id: leaveTemplateId,
          organizationId,
          status: "ACTIVE",
        });
        if (!template) {
          throw new ApiError(404, "Active leave template not found");
        }
        const templateCategory = template.leaveCategories.find(
          (c) => c._id.toString() === leaveCategoryId.toString(),
        );
        if (!templateCategory) {
          throw new ApiError(400, "Leave category not found in template");
        }
        leaveCategoryName = templateCategory.categoryName;
        leaveCategoryIdToStore = templateCategory._id;

        // Validate balance
        await this.validateBalance(
          employeeId,
          organizationId,
          leaveCategoryId,
          leavesAvailed,
        );
      } else {
        // Unpaid leave
        leaveCategoryName = "Unpaid";
        leaveCategoryIdToStore = null;
      }
    }

    // ----- Build daily records -----
    const records = [];
    const current = new Date(start);
    while (current <= end) {
      records.push({
        leaveDate: new Date(current),
        session: startDate === endDate ? fromSession || toSession : null,
        leaveType: "leave",
        leaveCategoryId: leaveCategoryIdToStore,
        leaveCategoryName,
      });
      current.setDate(current.getDate() + 1);
    }

    // ----- Create application -----
    const applicationData = {
      organizationId,
      employeeId,
      leaveTemplateId: isCompOffLeave ? null : leaveTemplateId, // null for comp‑off
      leaveCategoryId: leaveCategoryIdToStore,
      leaveCategoryName,
      startDate: start,
      endDate: end,
      fromSession,
      toSession,
      description,
      isCompOffLeave: !!isCompOffLeave,
      shiftId,
      attachments: attachments || [],
      appliedBy,
      leavesAvailed,
      unpaidLeaveCount: isUnpaid ? leavesAvailed : 0,
      records,
      status: "PENDING",
    };

    const application =
      await leaveApplicationRepository.create(applicationData);
    return application;
  }

  // ---------- Approve application ----------
  async approveApplication(req) {
    const { id } = req.params;
    const approverId = req.user.id; // current user

    const application = await leaveApplicationRepository.findById(id);
    if (!application) {
      throw new ApiError(404, "Leave application not found");
    }
    if (application.status !== "PENDING") {
      throw new ApiError(400, "Only pending applications can be approved");
    }

    // Update application status
    application.status = "APPROVED";
    application.approvedBy = approverId;
    application.approvedAt = new Date();

    // Update leave balance
    await this.updateBalanceOnApproval(application);

    // Save application
    const updated = await leaveApplicationRepository.update(id, {
      status: "APPROVED",
      approvedBy: approverId,
      approvedAt: new Date(),
    });

    return updated;
  }

  // ---------- Reject application ----------
  async rejectApplication(req) {
    const { id } = req.params;
    // optional reason could be passed, but schema doesn't have it

    const application = await leaveApplicationRepository.findById(id);
    if (!application) {
      throw new ApiError(404, "Leave application not found");
    }
    if (application.status !== "PENDING") {
      throw new ApiError(400, "Only pending applications can be rejected");
    }

    const updated = await leaveApplicationRepository.update(id, {
      status: "REJECTED",
    });
    return updated;
  }

  // ---------- Cancel application (only if pending) ----------
  async cancelApplication(req) {
    const { id } = req.params;

    const application = await leaveApplicationRepository.findById(id);
    if (!application) {
      throw new ApiError(404, "Leave application not found");
    }
    if (application.status !== "PENDING") {
      throw new ApiError(400, "Only pending applications can be cancelled");
    }

    const updated = await leaveApplicationRepository.update(id, {
      status: "CANCELLED",
    });
    return updated;
  }

  // ---------- Get all applications with filters ----------
  async getApplications(req) {
    const { organizationId } = req.user;
    const {
      employeeId,
      status,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
    } = req.query;

    if (!organizationId) {
      throw new ApiError(400, "Organization ID is required");
    }

    const query = { organizationId };
    if (employeeId) query.employeeId = employeeId;
    if (status) query.status = status;
    if (fromDate || toDate) {
      query.startDate = {};
      if (fromDate) query.startDate.$gte = new Date(fromDate);
      if (toDate) query.startDate.$lte = new Date(toDate);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
    };

    return await leaveApplicationRepository.findAll(query, options);
  }

  // ---------- Get single application ----------
  async getApplicationById(req) {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Application ID required");
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new ApiError(400, "Invalid ID format");

    return await leaveApplicationRepository.findById(id);
  }

  // ---------- Update application (edit) – only allowed if pending ----------
  async updateApplication(req) {
    const { id } = req.params;
    const updateData = req.body;

    const application = await leaveApplicationRepository.findById(id);
    if (!application) {
      throw new ApiError(404, "Leave application not found");
    }
    if (application.status !== "PENDING") {
      throw new ApiError(400, "Only pending applications can be edited");
    }

    // Recalculate leavesAvailed if dates/sessions changed
    if (
      updateData.startDate ||
      updateData.endDate ||
      updateData.fromSession !== undefined ||
      updateData.toSession !== undefined
    ) {
      const start = updateData.startDate || application.startDate;
      const end = updateData.endDate || application.endDate;
      const fromSession =
        updateData.fromSession !== undefined
          ? updateData.fromSession
          : application.fromSession;
      const toSession =
        updateData.toSession !== undefined
          ? updateData.toSession
          : application.toSession;
      updateData.leavesAvailed = this.calculateLeaveDays(
        start,
        end,
        fromSession,
        toSession,
      );
    }

    // Regenerate records if dates changed (simplified – you may want to rebuild all records)
    if (updateData.startDate || updateData.endDate) {
      // For simplicity, we skip regenerating records here. In production, you'd rebuild.
    }

    const updated = await leaveApplicationRepository.update(id, updateData);
    return updated;
  }

  // services/leaveApplication.service.js – add markLeave

  async markLeave(req) {
    const {
      employeeId,
      leaveTemplateId,
      leaveCategoryId,
      startDate,
      endDate,
      fromSession,
      toSession,
      description,
      isCompOffLeave,
      shiftId,
      attachments,
    } = req.body;
    const { organizationId } = req.user;
    const markedBy = req.user.id;

    // ----- Required fields -----
    if (
      !organizationId ||
      !employeeId ||
      !startDate ||
      !endDate ||
      !fromSession ||
      !toSession
    ) {
      throw new ApiError(400, "Missing required fields");
    }

    // ----- Validate dates -----
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      throw new ApiError(400, "Start date cannot be after end date");
    }

    // ----- Verify employee exists -----
    const employee = await Employee.findOne({
      _id: employeeId,
      organizationId,
      isDeleted: false,
    });
    if (!employee) {
      throw new ApiError(404, "Employee not found");
    }

    // ----- Calculate days -----
    const leavesAvailed = this.calculateLeaveDays(
      startDate,
      endDate,
      fromSession,
      toSession,
    );

    // ----- Handle based on leave type -----
    let leaveCategoryName = "";
    let leaveCategoryIdToStore = null;
    let isUnpaid = false;

    if (isCompOffLeave) {
      // Comp‑off
      if (!leaveCategoryId) {
        throw new ApiError(
          400,
          "leaveCategoryId is required for comp‑off leave",
        );
      }
      const balance = await leaveBalanceRepository.findByEmployee(
        employeeId,
        organizationId,
      );
      if (!balance) {
        throw new ApiError(404, "Leave balance not found for this employee");
      }
      const compOffCat = balance.leaveCategories.find(
        (c) =>
          c.categoryId.toString() === leaveCategoryId.toString() &&
          c.isCompOffLeave === true,
      );
      if (!compOffCat) {
        throw new ApiError(
          400,
          "Comp‑off category not found in employee's balance",
        );
      }
      // Optional balance check (admin may override, but we can still warn)
      if (compOffCat.leaveBalance < leavesAvailed) {
        throw new ApiError(
          400,
          `Insufficient comp‑off balance. Available: ${compOffCat.leaveBalance}, Required: ${leavesAvailed}`,
        );
      }
      leaveCategoryName = compOffCat.categoryName;
      leaveCategoryIdToStore = compOffCat.categoryId;
    } else {
      // Paid or unpaid
      if (!leaveTemplateId) {
        throw new ApiError(
          400,
          "leaveTemplateId is required for paid or unpaid leave",
        );
      }
      if (
        !employee.leaveTemplateId ||
        employee.leaveTemplateId.toString() !== leaveTemplateId
      ) {
        throw new ApiError(
          400,
          "Employee is not assigned to the provided leave template",
        );
      }
      isUnpaid = !leaveCategoryId;
      if (!isUnpaid) {
        const template = await leaveTemplateRepository.findOne({
          _id: leaveTemplateId,
          organizationId,
          status: "ACTIVE",
        });
        if (!template) {
          throw new ApiError(404, "Active leave template not found");
        }
        const templateCategory = template.leaveCategories.find(
          (c) => c._id.toString() === leaveCategoryId.toString(),
        );
        if (!templateCategory) {
          throw new ApiError(400, "Leave category not found in template");
        }
        leaveCategoryName = templateCategory.categoryName;
        leaveCategoryIdToStore = templateCategory._id;
        // Validate balance
        await this.validateBalance(
          employeeId,
          organizationId,
          leaveCategoryId,
          leavesAvailed,
        );
      } else {
        leaveCategoryName = "Unpaid";
        leaveCategoryIdToStore = null;
      }
    }

    // ----- Overlap check (optional) -----
    const overlapping = await leaveApplicationRepository.findOne({
      employeeId,
      status: { $in: ["PENDING", "APPROVED"] },
      $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
    });
    if (overlapping) {
      throw new ApiError(
        400,
        "Employee already has a leave application for this period",
      );
    }

    // ----- Build records -----
    const records = [];
    const current = new Date(start);
    while (current <= end) {
      records.push({
        leaveDate: new Date(current),
        session: startDate === endDate ? fromSession || toSession : null,
        leaveType: "leave",
        leaveCategoryId: leaveCategoryIdToStore,
        leaveCategoryName,
      });
      current.setDate(current.getDate() + 1);
    }

    // ----- Create application (immediately approved) -----
    const applicationData = {
      organizationId,
      employeeId,
      leaveTemplateId: isCompOffLeave ? null : leaveTemplateId,
      leaveCategoryId: leaveCategoryIdToStore,
      leaveCategoryName,
      startDate: start,
      endDate: end,
      fromSession,
      toSession,
      description,
      isCompOffLeave: !!isCompOffLeave,
      shiftId,
      attachments: attachments || [],
      appliedBy: markedBy,
      approvedBy: markedBy,
      approvedAt: new Date(),
      leavesAvailed,
      unpaidLeaveCount: isUnpaid ? leavesAvailed : 0,
      records,
      status: "APPROVED",
    };

    const application =
      await leaveApplicationRepository.create(applicationData);

    // ----- Update balance (skip unpaid, update paid/comp‑off) -----
    if (!isUnpaid) {
      await this.updateBalanceOnApproval(application);
    }

    return application;
  }

  // ---------- Private: update leave balance on approval ----------
  async updateBalanceOnApproval(application) {
    const {
      employeeId,
      organizationId,
      leaveCategoryId,
      leavesAvailed,
      isCompOffLeave,
    } = application;

    const balance = await leaveBalanceRepository.findByEmployee(
      employeeId,
      organizationId,
    );
    if (!balance) {
      throw new ApiError(404, "Leave balance not found for employee");
    }

    if (isCompOffLeave) {
      // Find comp‑off category
      const catIndex = balance.leaveCategories.findIndex(
        (c) =>
          c.categoryId.toString() === leaveCategoryId.toString() &&
          c.isCompOffLeave === true,
      );
      if (catIndex === -1)
        throw new ApiError(400, "Comp‑off category not found");
      balance.leaveCategories[catIndex].availedLeaves += leavesAvailed;
      balance.leaveCategories[catIndex].leaveBalance -= leavesAvailed;
    } else {
      // Normal leave category
      const catIndex = balance.leaveCategories.findIndex(
        (c) =>
          c.categoryId.toString() === leaveCategoryId.toString() &&
          !c.isCompOffLeave,
      );
      if (catIndex === -1) throw new ApiError(400, "Leave category not found");
      balance.leaveCategories[catIndex].availedLeaves += leavesAvailed;
      balance.leaveCategories[catIndex].leaveBalance -= leavesAvailed;
    }

    // Recalculate totals
    const totalAvailed = balance.leaveCategories.reduce(
      (sum, c) => sum + c.availedLeaves,
      0,
    );
    const totalBalance = balance.leaveCategories.reduce(
      (sum, c) => sum + c.leaveBalance,
      0,
    );

    // Save updated balance
    await leaveBalanceRepository.update(employeeId, organizationId, {
      leaveCategories: balance.leaveCategories,
      totalAvailedLeaves: totalAvailed,
      totalBalancedLeaves: totalBalance,
    });
  }
}

export default new LeaveApplicationService();
