import DailyAttendance from "../models/dailyscanAttendance.js";
import moment from "moment";

export const getDailyRecord = async (userId, date) => {
  return DailyAttendance.findOne({ userId, date });
};

export const getDailyRecordForUser = async (userId, date) => {
  const targetDate = moment(date).startOf("day").toDate();
  // const dateUTC = moment.utc(date).startOf("day").toDate();
  // console.log(dateUTC)
  const dailyData = await DailyAttendance.find({
    userId,
    date: { $gte: targetDate, $lte: moment(date).endOf("day").toDate() },
  });
  return dailyData;
};
export const findDailyById = async (userId, date) => {
  return DailyAttendance.findById(userId);
};

export const createDailyRecord = async (data) => {
  return DailyAttendance.create(data);
};

export const updateDailyRecord = async (id, data) => {
  return DailyAttendance.findByIdAndUpdate(id, data, { new: true });
};

export const getMonthlyAttendance = async (userId, month, year) => {
  const startOfMonth = moment
    .utc(`${year}-${month}-01`)
    .startOf("month")
    .toDate();
  const endOfMonth = moment.utc(startOfMonth).endOf("month").toDate();

  return DailyAttendance.find({
    userId,
    date: { $gte: startOfMonth, $lte: endOfMonth },
  }).sort({ date: 1 });
};

export const getMonthlySummary = async (userId, month, year) => {
  const result = await DailyAttendance.aggregate([
    { $match: { userId, month, year } },
    {
      $group: {
        _id: "$userId",
        totalWorkMinutes: { $sum: "$totalWorkMinutes" },
        totalBreakMinutes: { $sum: "$totalBreakMinutes" },
        totalOvertimeMinutes: { $sum: "$totalOvertimeMinutes" },
        totalLateMinutes: { $sum: "$lateLoginMinutes" },
        totalEarlyLogoutMinutes: { $sum: "$earlyLogoutMinutes" },
        totalBreakExceededMinutes: { $sum: "$breakExceededMinutes" },
      },
    },
  ]);
  return result[0] || {};
};
export const getDailyRecordsByDate = async (organizationId, date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return DailyAttendance.find({
    organizationId,
    date: { $gte: start, $lte: end },
  }).populate("userId");
};
