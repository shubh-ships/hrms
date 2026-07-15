import Employee from "../models/employee.Model.js";
import mongoose from "mongoose";

//TODO:-  take all employee api logics in this service file and call these functions in controller file

/**
 * Get employees whose joinDate falls within a given date range.
 * @param {string} organizationId
 * @param {Date} startDate - start of range (inclusive)
 * @param {Date} endDate - end of range (inclusive)
 * @returns {Promise<Array>}
 */
export const getUpcomingNewJoiners = async (
  organizationId,
  startDate,
  endDate,
) => {
  // Default to today through month end if range not provided
  if (!startDate || !endDate) {
    const today = new Date();
    startDate = today;
    endDate = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      ),
    );
  }

  // Ensure we have inclusive boundaries for the day
  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59, 999);

  const pipeline = [
    {
      $match: {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        isDeleted: false,
        "employment.status": "active",
        "employment.joinDate": {
          $gte: start,
          $lte: end,
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
    // Lookup user role table
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
        joiningDate: "$employment.joinDate",
        photo: "$profile.profilePicture.url",
      },
    },
    // Optionally sort by joinDate ascending
    { $sort: { joiningDate: 1 } },
  ];

  return await Employee.aggregate(pipeline);
};

export const updateEmployeeBankDetailsService = async (
  organizationId,
  employeeCodes,
  accountHolderName,
  accountNumber,
  confirmAccountNumber,
  ifsc,
) => {
  if (!Array.isArray(employeeCodes) || employeeCodes.length === 0) {
    const err = new Error("Employee codes array cannot be empty");
    err.statusCode = 400;
    throw err;
  }

  if (!accountHolderName || !accountNumber || !confirmAccountNumber || !ifsc) {
    const err = new Error("All bank details fields are required");
    err.statusCode = 400;
    throw err;
  }

  if (accountNumber !== confirmAccountNumber) {
    const err = new Error(
      "Account number and confirm account number do not match",
    );
    err.statusCode = 400;
    throw err;
  }

  const employees = await employeeRepository.findEmployeesByCodes(
    organizationId,
    employeeCodes,
  );

  if (!employees || employees.length === 0) {
    const err = new Error("No employees found with given employee codes");
    err.statusCode = 404;
    throw err;
  }

  const updateData = {
    accountHolderName,
    accountNumber,
    ifsc,
  };

  const updatedEmployees = await employeeRepository.updateBankDetails(
    organizationId,
    employeeCodes,
    updateData,
  );

  return updatedEmployees;
};

export const updateBulkEmployeeBankDetailsService = async (
  organizationId,
  employeeCodes,
  accountHolderName,
  accountNumber,
  confirmAccountNumber,
  ifsc,
) => {
  try {
    // Validate employeeCodes
    if (!Array.isArray(employeeCodes) || employeeCodes.length === 0) {
      const err = new Error("Employee codes array cannot be empty");
      err.statusCode = 400;
      throw err;
    }

    // Validate required fields
    if (
      !accountHolderName ||
      !accountNumber ||
      !confirmAccountNumber ||
      !ifsc
    ) {
      const err = new Error("All bank details fields are required");
      err.statusCode = 400;
      throw err;
    }

    // Validate account number match
    if (accountNumber !== confirmAccountNumber) {
      const err = new Error(
        "Account number and confirm account number do not match",
      );
      err.statusCode = 400;
      throw err;
    }

    // Optional IFSC validation
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifsc)) {
      const err = new Error("Invalid IFSC code");
      err.statusCode = 400;
      throw err;
    }

    // Find employees
    const employees = await Employee.find({
      organizationId,
      "employment.employeeCode": { $in: employeeCodes },
      isDeleted: false,
    });

    if (!employees || employees.length === 0) {
      const err = new Error(
        "No employees found with the provided employee codes",
      );
      err.statusCode = 404;
      throw err;
    }

    // Update bank details
    const result = await Employee.updateMany(
      {
        organizationId,
        "employment.employeeCode": { $in: employeeCodes },
        isDeleted: false,
      },
      {
        $set: {
          "bank.accountHolderName": accountHolderName,
          "bank.accountNumber": accountNumber,
          "bank.ifsc": ifsc,
          updatedAt: new Date(),
        },
      },
    );

    return result;
  } catch (error) {
    console.error("Service Error:", error);

    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = "Error while updating bank details";
    }

    throw error;
  }
};
