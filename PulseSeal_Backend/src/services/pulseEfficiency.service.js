import * as pulseEfficiencyRepository from "../repositories/pulseEfficiency.repository.js";
import * as workingDaysRepository from '../repositories/workingDays.repository.js';
import * as attendanceServices from './attendance.service.js';
import ApiError from "../utils/apiError.js";
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';
dayjs.extend(isoWeek);
dayjs.extend(advancedFormat);



export const getPulseEfficiencyServiceWeekly = async (userId) => {
  if (!userId) {
    throw new ApiError(400, "user id is required");
  }
  return await pulseEfficiencyRepository.getPulseEfficiencyWeekly(userId);
};
export const getPulseEfficiencyServiceMonthly = async (userId,currentMonthYear) => {
  if (!userId ||!currentMonthYear) {
    throw new ApiError(400, "user id or monthYear is required");
  }
  return await pulseEfficiencyRepository.getPulseEfficiencyMonthly(userId,currentMonthYear);
};

export const getPulseEfficiencyServiceYearly = async (userId, year) => {
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }
  if (!year) {
    throw new ApiError(400, "Year is required");
  }

  return await pulseEfficiencyRepository.getPulseEfficiencyYearly(userId, year);
};


export const getOrganizationLeaderboard = async (departmentId,monthYear) => {
  if(!departmentId||!monthYear){
     throw new ApiError(400,'departmentId or monthYear is required')
  }
  const data = await pulseEfficiencyRepository.aggregatePulseEfficiencyByUser(departmentId,monthYear);
  const enrichedData = await Promise.all(
    data.map(async (item) => {
      const userId = item._id.userId;
      const [yearStr, monthNumStr] =monthYear.split('-');
      const year = Number(yearStr);
      const monthNum = Number(monthNumStr);
      const month = dayjs(`${year}-${monthNum}`).format('MMMM');

      const monthDoc = await workingDaysRepository.getMonthByName(month);
      const monthId = monthDoc?._id;

      const response = await attendanceServices.calculateAttendanceAverage(userId, monthId);
      const attendanceAverage = Number(response?.attendanceAverage || 0);

          const totalTasks = item.totalTasks || 0;
      
      const greenRatio = totalTasks ? item.greenCount / totalTasks : 0;
      const yellowRatio = totalTasks ? item.yellowCount / totalTasks : 0;
      const redRatio = totalTasks ? item.redCount / totalTasks : 0;

      const efficiency =
         greenRatio * 10 +        
         yellowRatio * 5 -        
         redRatio * 10 +
        item.sealSubmissionRate +
        attendanceAverage;

      // const efficiency =
      //   item.greenCount * 10 +
      //   item.yellowCount * 5 -
      //   item.redCount * 10 +
      //   item.sealSubmissionRate +
      //   attendanceAverage;

      return {
        userId,
        month,
        year,
        efficiency: Number(efficiency.toFixed(2)),
        attendanceAverage,
        ...item
      };
    })
  );

  const leaderboardMap = {};

  for (const entry of enrichedData) {
    const key = `${entry.month}-${entry.year}`;
    if (!leaderboardMap[key]) leaderboardMap[key] = [];

    leaderboardMap[key].push(entry);
  }

  const monthlyLeaderboards = Object.entries(leaderboardMap).map(([monthYear, users]) => {
    const sorted = users.sort((a, b) => b.efficiency - a.efficiency);
    return {
      monthYear,
      leaderboard: sorted,
      topper: sorted[0]
    };
  });

  return monthlyLeaderboards;
};