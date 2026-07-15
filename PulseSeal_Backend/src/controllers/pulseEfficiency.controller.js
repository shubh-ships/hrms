import  asyncHandler  from '../middlewares/asyncHandler.js';
import * as pulseEfficiencyService from '../services/pulseEfficiency.service.js';
import { successResponse } from '../utils/apiResponse.js';
import { Parser } from 'json2csv';

export const getPulseEfficiencyControllerWeekly = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await pulseEfficiencyService.getPulseEfficiencyServiceWeekly(userId);
 
  return successResponse(res, 'Weekly Pulse efficiency report fetched successfully', result, 201);
});
export const getPulseEfficiencyControllerMonthly = asyncHandler(async (req, res) => {
  const userId = req.user.id;
   const { monthYear } = req.query;
   

  const result = await pulseEfficiencyService.getPulseEfficiencyServiceMonthly(userId,monthYear);
 
  return successResponse(res, 'Monthly Pulse efficiency report fetched successfully', result, 201);
});
export const getPulseEfficiencyControllerMonthlyByUserId = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  
   const { monthYear } = req.query;
   

  const result = await pulseEfficiencyService.getPulseEfficiencyServiceMonthly(userId,monthYear);
 
  return successResponse(res, 'Monthly Pulse efficiency report fetched successfully', result, 201);
});
export const getLeaderboardController = asyncHandler(async (req, res) => {
  const {departmentId, monthYear} = req.params;

  if (!departmentId ||!monthYear) {
    return res.status(400).json({ message: 'Organization ID is required' });
  }

  const leaderboard = await pulseEfficiencyService.getOrganizationLeaderboard(departmentId,monthYear);
   return successResponse(res, 'LeaderBoard fetched successfully', leaderboard, 201);
});
export const getPulseEfficiencyControllerYearly = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { year } = req.query;

  if (!year) {
    throw new ApiError(400, 'Year is required in format YYYY');
  }

  const result = await pulseEfficiencyService.getPulseEfficiencyServiceYearly(userId, year);
  return successResponse(res, {
    message: 'Yearly Pulse Efficiency Report',
    data: result,
  })
});
export const getPulseEfficiencyControllerYearlyByUserId = asyncHandler(async (req, res) => {
   const userId = req.params.userId;
  const { year } = req.query;

  if (!year) {
    throw new ApiError(400, 'Year is required in format YYYY');
  }

  const result = await pulseEfficiencyService.getPulseEfficiencyServiceYearly(userId, year);
  return successResponse(res, {
    message: 'Yearly Pulse Efficiency Report',
    data: result,
  })
});

export const downloadPulseEfficiencyCSV = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const monthYear = req.query.month;

    const result = await pulseEfficiencyService.getPulseEfficiencyServiceMonthly(userId, monthYear);

    const fields = [
      { label: 'Month', value: 'month' },
      { label: 'Year', value: 'year' },
      { label: 'Green Tasks', value: 'greenCount' },
      { label: 'Yellow Tasks', value: 'yellowCount' },
      { label: 'Red Tasks', value: 'redCount' },
      { label: 'Total Tasks', value: 'totalTasks' },
      { label: 'Approved Tasks', value: 'approvedCount' },
      { label: 'Seal Submission Rate (%)', value: 'sealSubmissionRate' },
      { label: 'Attendance Average (%)', value: 'attendanceAverage' },
      { label: 'Efficiency Score', value: 'efficiency' },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(result);

    res.header('Content-Type', 'text/csv');
    res.attachment(`pulse-efficiency-${monthYear}.csv`);
    res.send(csv);
  
});