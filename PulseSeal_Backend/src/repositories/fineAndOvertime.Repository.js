import DailyAttendance from "../models/dailyscanAttendance.js";

class FineAndOvertimeRepository {
  async findById(attendanceId) {
    return DailyAttendance.findById(attendanceId);
  }
  async save(attendance) {
    return attendance.save();
  }
}

export default new FineAndOvertimeRepository();
