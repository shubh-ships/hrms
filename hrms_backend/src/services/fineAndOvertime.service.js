import fineAndOvertimeRepository from "../repositories/fineAndOvertime.Repository.js";
import Overtime from "../models/overtime.model.js";

class FineAndOvertimeService {

  /**
   * ============================
   * CREATE FINE
   * ============================
   */
  async createFine({ attendanceId, type, amount, minutes }) {
    const attendance = await fineAndOvertimeRepository.findById(attendanceId);

    if (!attendance) {
      throw new Error("Attendance not found");
    }

    attendance.penalties.push({
      snapshot: {
        type,
        amount,
        minutes,
        status: "PENDING",
      },
    });

    return await fineAndOvertimeRepository.save(attendance);
  }

  /**
   * ============================
   * CREATE OVERTIME
   * ============================
   */
  async createOvertime({
    attendanceId,
    overtimeMinutes,
    payableMinutes,
    amount,
    type,
    shiftTemplateId,
    ruleId,
  }) {
    const attendance = await fineAndOvertimeRepository.findById(attendanceId);

    if (!attendance) {
      throw new Error("Attendance not found");
    }

    const overtime = await Overtime.create({
      organizationId: attendance.organizationId,
      employeeId: attendance.employeeId,
      shiftTemplateId: attendance.shift?.shiftId || shiftTemplateId,
      type, // Now correctly receives LATE_OVERTIME or EARLY_OVERTIME from frontend
      overtimeMinutes,
      payableMinutes: payableMinutes || overtimeMinutes,
      calculationType: "FIXED_AMOUNT",
      amount: amount || 0,
      ruleId: ruleId || null, // Make ruleId optional for manual entries
      source: "MANUAL",
    });

    attendance.earnings.push({
      overtimeId: overtime._id,
      snapshot: {
        type, // Use the type as-is
        minutes: payableMinutes || overtimeMinutes,
        amount: amount || 0,
        status: "PENDING",
      },
    });

    return await fineAndOvertimeRepository.save(attendance);
  }

  /**
   * ============================
   * APPROVE / REJECT / EDIT
   * ============================
   */
  async handleAction({ attendanceId, type, itemId, action, data, user }) {
    const attendance = await fineAndOvertimeRepository.findById(attendanceId);

    if (!attendance) {
      throw new Error("Attendance record not found");
    }

    const now = new Date();
    let item;

    if (type === "FINE") {
      item = attendance.penalties.find(
        (p) => p?._id?.toString() === itemId
      );
    } else if (type === "OVERTIME") {
      item = attendance.earnings.find(
        (e) => e?._id?.toString() === itemId
      );
    } else {
      throw new Error("Invalid type");
    }

    if (!item) {
      throw new Error(`${type} item not found`);
    }

    // Prevent invalid actions
    if (action === "APPROVE" && item.snapshot.status === "APPROVED") {
      throw new Error(`${type} already approved`);
    }

    if (action === "REJECT" && item.snapshot.status === "REJECTED") {
      throw new Error(`${type} already rejected`);
    }

    switch (action) {
      case "APPROVE":
        if (type === "OVERTIME" && item.overtimeId) {
          const overtime = await Overtime.findById(item.overtimeId);

          if (!overtime) {
            throw new Error("Linked overtime not found");
          }

          overtime.status = "APPROVED";
          overtime.approvedBy = user._id;
          overtime.approvedAt = now;

          await overtime.save();
        }

        item.snapshot.status = "APPROVED";
        item.snapshot.appliedAt = now;
        break;

      case "REJECT":
        if (type === "OVERTIME" && item.overtimeId) {
          const overtime = await Overtime.findById(item.overtimeId);

          if (overtime) {
            overtime.status = "REJECTED";
            overtime.approvedBy = user._id;
            overtime.approvedAt = now;
            await overtime.save();
          }
        }

        item.snapshot.status = "REJECTED";
        item.snapshot.appliedAt = now;
        break;

      case "EDIT":
        if (item.snapshot.status === "APPROVED") {
          throw new Error("Cannot edit approved item");
        }

        const allowedFields = ["amount", "minutes", "multiplier"];

        if (data) {
          for (const field of allowedFields) {
            if (data[field] !== undefined) {
              item.snapshot[field] = data[field];
            }
          }
        }

        item.snapshot.status = "PENDING";
        item.snapshot.appliedAt = null;
        break;

      default:
        throw new Error("Invalid action");
    }

    return await fineAndOvertimeRepository.save(attendance);
  }
}

export default new FineAndOvertimeService();