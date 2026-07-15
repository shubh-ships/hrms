import mongoose from "mongoose";
import Employee from "../models/employee.Model.js";

/**
 * Convert a Date to 'MM-DD' string (UTC based to avoid timezone issues)
 */
const formatMMDD = (date) => {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${month}-${day}`;
};

/**
 * Get employees whose birthday (month-day) falls within a given date range.
 * @param {string} organizationId
 * @param {Date} startDate - start of range
 * @param {Date} endDate - end of range (inclusive)
 * @returns {Promise<Array>}
 */
export const getBirthdayList = async (organizationId, startDate, endDate) => {
  // If no range provided, default to today through month end
  if (!startDate || !endDate) {
    const today = new Date();
    startDate = today;
    endDate = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0),
    );
  }

  const startMD = formatMMDD(startDate);
  const endMD = formatMMDD(endDate);

  const pipeline = [
    {
      $match: {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        isDeleted: false,
        "employment.status": "active",
        "personal.dob": { $exists: true, $ne: null },
      },
    },
    {
      $addFields: {
        birthdayMonthDay: {
          $dateToString: {
            format: "%m-%d",
            date: "$personal.dob",
            timezone: "UTC",
          },
        },
      },
    },
    {
      $match: {
        $expr: {
          $or: [
            // Case 1: range does NOT wrap around year end (startMD <= endMD)
            {
              $and: [
                { $lte: [startMD, endMD] },
                { $gte: ["$birthdayMonthDay", startMD] },
                { $lte: ["$birthdayMonthDay", endMD] },
              ],
            },
            // Case 2: range wraps around year end (startMD > endMD)
            {
              $and: [
                { $gt: [startMD, endMD] },
                {
                  $or: [
                    { $gte: ["$birthdayMonthDay", startMD] },
                    { $lte: ["$birthdayMonthDay", endMD] },
                  ],
                },
              ],
            },
          ],
        },
      },
    },
    // Lookup user profile for photo
    {
      $lookup: {
        from: "userprofiles",
        localField: "userId",
        foreignField: "userId",
        as: "profile",
      },
    },
    { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
    // Lookup department
    {
      $lookup: {
        from: "departments",
        localField: "employment.departmentId",
        foreignField: "_id",
        as: "dept",
      },
    },
    { $unwind: { path: "$dept", preserveNullAndEmptyArrays: true } },
    // Lookup user role table to get roleDefinitionId
    {
      $lookup: {
        from: "userroletables",
        localField: "employment.userRoleTableId",
        foreignField: "_id",
        as: "roleTable",
      },
    },
    { $unwind: { path: "$roleTable", preserveNullAndEmptyArrays: true } },
    // Lookup role definition for role name
    {
      $lookup: {
        from: "roledefinitions",
        localField: "roleTable.roleDefinitionId",
        foreignField: "_id",
        as: "roleDef",
      },
    },
    { $unwind: { path: "$roleDef", preserveNullAndEmptyArrays: true } },
    // Project final fields
    {
      $project: {
        name: {
          $concat: [
            "$personal.firstName",
            " ",
            { $ifNull: ["$personal.lastName", ""] },
          ],
        },
        role: "$roleDef.name",
        department: "$dept.name",
        birthday: "$personal.dob",
        photo: "$profile.profilePicture.url",
      },
    },
  ];

  return await Employee.aggregate(pipeline);
};

/**
 * Get employees whose work anniversary (month-day of joinDate) falls within a given date range.
 * Includes years of service.
 * @param {string} organizationId
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<Array>}
 */
export const getAnniversaryList = async (
  organizationId,
  startDate,
  endDate,
) => {
  // Default range if not provided
  if (!startDate || !endDate) {
    const today = new Date();
    startDate = today;
    endDate = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0),
    );
  }

  const startMD = formatMMDD(startDate);
  const endMD = formatMMDD(endDate);
  const currentYear = startDate.getUTCFullYear(); // use the range's year for year calculation

  const pipeline = [
    {
      $match: {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        isDeleted: false,
        "employment.status": "active",
        "employment.joinDate": { $exists: true, $ne: null },
      },
    },
    {
      $addFields: {
        anniversaryMonthDay: {
          $dateToString: {
            format: "%m-%d",
            date: "$employment.joinDate",
            timezone: "UTC",
          },
        },
        joinYear: { $year: { date: "$employment.joinDate", timezone: "UTC" } },
      },
    },
    {
      $match: {
        $expr: {
          $or: [
            // Non‑wrap case
            {
              $and: [
                { $lte: [startMD, endMD] },
                { $gte: ["$anniversaryMonthDay", startMD] },
                { $lte: ["$anniversaryMonthDay", endMD] },
              ],
            },
            // Wrap case
            {
              $and: [
                { $gt: [startMD, endMD] },
                {
                  $or: [
                    { $gte: ["$anniversaryMonthDay", startMD] },
                    { $lte: ["$anniversaryMonthDay", endMD] },
                  ],
                },
              ],
            },
          ],
        },
      },
    },
    {
      $addFields: {
        years: { $subtract: [currentYear, "$joinYear"] },
      },
    },
    // Lookups (same as birthday pipeline)
    {
      $lookup: {
        from: "userprofiles",
        localField: "userId",
        foreignField: "userId",
        as: "profile",
      },
    },
    { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "departments",
        localField: "employment.departmentId",
        foreignField: "_id",
        as: "dept",
      },
    },
    { $unwind: { path: "$dept", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "userroletables",
        localField: "employment.userRoleTableId",
        foreignField: "_id",
        as: "roleTable",
      },
    },
    { $unwind: { path: "$roleTable", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "roledefinitions",
        localField: "roleTable.roleDefinitionId",
        foreignField: "_id",
        as: "roleDef",
      },
    },
    { $unwind: { path: "$roleDef", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: {
          $concat: [
            "$personal.firstName",
            " ",
            { $ifNull: ["$personal.lastName", ""] },
          ],
        },
        role: "$roleDef.name",
        department: "$dept.name",
        joinDate: "$employment.joinDate",
        years: 1,
        photo: "$profile.profilePicture.url",
      },
    },
  ];

  return await Employee.aggregate(pipeline);
};
