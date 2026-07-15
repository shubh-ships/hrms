import Attendance from '../models/attendance.Model.js';
import TotalWorkingDays from '../models/workingDays.Model.js';
import mongoose from 'mongoose';
import ApiError from '../utils/apiError.js';
export const createAttendance=async(attendanceData)=>{
  const today = new Date();
  today.setHours(0, 0, 0, 0)
  const month=await TotalWorkingDays.findOne({month:attendanceData.month})
  const allAttendanceData={
    userId:attendanceData.userId,
    monthId:month.id,
    loginTime: new Date(),
    date:today,
    }
    return await Attendance.create(allAttendanceData);
};
export const createManualAttendance=async(attendanceData)=>{
    const monthData =attendanceData.month.split(" ")[0];
  const year = attendanceData.month.split(" ")[1];
  attendanceData.month=monthData
  attendanceData.year=year
const loginTime= new Date(attendanceData.loginTime)
const logoutTime= new Date(attendanceData.logoutTime)
  const month=await TotalWorkingDays.findOne({month:attendanceData.month,year:attendanceData.year})
  const allAttendanceData={
    userId:attendanceData.userId,
    monthId:month.id,
    loginTime: loginTime,
    logoutTime: logoutTime,
    date:attendanceData.date
    }
    return await Attendance.create(allAttendanceData);
};
export const updateAttendance=async(attendanceId,data)=>{
  const updatedAttendance= await Attendance.findByIdAndUpdate(attendanceId,data)
   if (!updatedAttendance) {
        throw new ApiError(404, "Attendance not found");
    }
  return updatedAttendance
}
export const findTodayAttendance = async(userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
 
  return await Attendance.findOne({ userId, date: today });
};
export const updateLogoutTime = async(attendanceDoc) => {
  attendanceDoc.logoutTime = new Date();
  const AttendanceData=await attendanceDoc.save();
 
  return AttendanceData;
};
export const getAttendance= async(userId)=>{
    return await Attendance.findOne({userId})
};
export const getUserMonthlyAttendance = async(userId, monthId) => {
  return await Attendance.countDocuments({
    userId,
    monthId,
    logoutTime: { $ne: null }
  });
};

export const getMonthlyAttendance = async (userId) => {
  return await Attendance.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
        },
        days: {
          $push: {
            attendanceId: "$_id",
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$date",
                timezone: "Asia/Kolkata"
              }
            },
            loginTime: {
              $dateToString: {
                format: "%Y-%m-%dT%H:%M:%S%z",
                date: "$loginTime",
                timezone: "Asia/Kolkata"
              }
            },
            logoutTime: {
              $dateToString: {
                format: "%Y-%m-%dT%H:%M:%S%z",
                date: "$logoutTime",
                timezone: "Asia/Kolkata"
              }
            },
            sealTime: {
              $cond: {
                if: { $ne: ["$sealTime", null] },
                then: {
                  $dateToString: {
                    format: "%Y-%m-%dT%H:%M:%S%z",
                    date: "$sealTime",
                    timezone: "Asia/Kolkata"
                  }
                },
                else: null
              }
            }
          }
        },
        totalDays: { $sum: 1 }
      }
    },
    {
      $sort: {
        "_id.year": -1,
        "_id.month": -1
      }
    },
    {
      $project: {
        _id: 0,
        month: {
          $concat: [
            {
              $arrayElemAt: [
                [
                  "", "January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"
                ],
                "$_id.month"
              ]
            },
            " ",
            { $toString: "$_id.year" }
          ]
        },
        totalDays: 1,
        days: 1
      }
    }
  ]);
};



export const getAttendanceForMonth = async (userId, month, year) => {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  const attendanceRecords = await Attendance.find({
    userId: new mongoose.Types.ObjectId(userId),
    date: { $gte: monthStart, $lte: monthEnd },
  }).sort({ date: 1 }); 

  return attendanceRecords;
};
