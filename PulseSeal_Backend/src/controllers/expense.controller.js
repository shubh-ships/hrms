import { Expense } from "../models/expense.Model.js";
import { uploadToCloudinary } from "../middlewares/cloudinary.js";
import ApiError from "../utils/apiError.js";
import { successResponse } from "../utils/apiResponse.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import Employee from "../models/employee.Model.js";

export const createExpenseRequest = asyncHandler(async (req, res) => {
  const { expenseType, expenseDate, billNumber, amount, description } = req.body;
  const userId = req.user._id;

  // Find employee linked to this user
  const employee = await Employee.findOne({ userId }).select('_id');
  if (!employee) {
    throw new ApiError(404, 'Employee record not found for this user');
  }

  if (!expenseType || !expenseDate || !amount || !description) {
    throw new ApiError(400, "All fields are required");
  }

  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "At least one proof file is required");
  }

  const uploadPromises = req.files.map((file) => uploadToCloudinary(file));
  const uploadedFiles = await Promise.all(uploadPromises);

  const proofs = uploadedFiles.map((file) => ({
    public_id: file.public_id,
    url: file.public_url,
  }));

  const expenseRequest = await Expense.create({
    employee: employee._id,   // store employee ID
    expenseType,
    expenseDate,
    billNumber,
    amount: parseFloat(amount),
    description,
    proofs,
  });

  successResponse(res, "Expense request submitted successfully", expenseRequest);
});

export const getUserExpenseRequests = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10, status } = req.query;

  const employee = await Employee.findOne({ userId }).select('_id');
  if (!employee) {
    throw new ApiError(404, 'Employee record not found for this user');
  }

  const filter = { employee: employee._id };
  if (status) filter.status = status;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: { path: "handledBy", select: "name email" },
  };

  const expenseRequests = await Expense.paginate(filter, options);
  successResponse(res, "Expense requests fetched successfully", expenseRequests);
});

export const getExpenseRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const employee = await Employee.findOne({ userId }).select('_id');
  if (!employee) {
    throw new ApiError(404, 'Employee record not found for this user');
  }

  const expenseRequest = await Expense.findOne({
    _id: id,
    employee: employee._id,
  }).populate("handledBy", "name email");

  if (!expenseRequest) {
    throw new ApiError(404, "Expense request not found");
  }

  successResponse(res, "Expense request fetched successfully", expenseRequest);
});

export const getAllExpenseRequests = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    employee,      // now expects employee ID
    expenseType,
    startDate,
    endDate,
  } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (employee) filter.employee = employee;
  if (expenseType) filter.expenseType = expenseType;
  if (startDate || endDate) {
    filter.expenseDate = {};
    if (startDate) filter.expenseDate.$gte = new Date(startDate);
    if (endDate) filter.expenseDate.$lte = new Date(endDate);
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      {
        path: "employee",
        select: "personal.firstName personal.lastName employment.employeeCode employment.departmentId userId",
        populate: { path: "userId", select: "name email" } // include user email if needed
      },
      { path: "handledBy", select: "name email" }
    ]
  };

  const expenseRequests = await Expense.paginate(filter, options);
  successResponse(res, "Expense requests fetched successfully", expenseRequests);
});

export const updateExpenseRequestStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, rejectedReason } = req.body;
  const adminId = req.user._id;

  if (!status || !["Approved", "Rejected"].includes(status)) {
    throw new ApiError(400, "Valid status is required (Approved/Rejected)");
  }

  if (status === "Rejected" && !rejectedReason) {
    throw new ApiError(400, "Rejection reason is required when rejecting an expense");
  }

  const expenseRequest = await Expense.findById(id);
  if (!expenseRequest) {
    throw new ApiError(404, "Expense request not found");
  }

  if (expenseRequest.status !== "Pending") {
    throw new ApiError(400, "Expense request has already been processed");
  }

  const updateData = {
    status,
    handledBy: adminId,
    handledAt: new Date(),
  };

  if (status === "Rejected") {
    updateData.rejectedReason = rejectedReason;
  } else {
    updateData.rejectedReason = null;
  }

  const updatedExpense = await Expense.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate({
      path: "employee",
      select: "personal.firstName personal.lastName employment.employeeCode employment.departmentId userId",
      populate: { path: "userId", select: "name email" }
    })
    .populate("handledBy", "name email");

  successResponse(res, `Expense request ${status.toLowerCase()} successfully`, updatedExpense);
});

export const getExpenseStats = asyncHandler(async (req, res) => {
  const stats = await Expense.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  const totalStats = await Expense.aggregate([
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
        approvedAmount: {
          $sum: {
            $cond: [{ $eq: ["$status", "Approved"] }, "$amount", 0],
          },
        },
        pendingAmount: {
          $sum: {
            $cond: [{ $eq: ["$status", "Pending"] }, "$amount", 0],
          },
        },
      },
    },
  ]);

  const result = {
    statusStats: stats,
    overallStats: totalStats[0] || {},
  };

  successResponse(res, "Expense statistics fetched successfully", result);
});

export const createEmpExpense = asyncHandler(async (req, res) => {
  const { expenseType, expenseDate, billNumber, amount, description } = req.body;
  const { employeeId } = req.params;

  if (!expenseType || !expenseDate || !amount || !description) {
    throw new ApiError(400, "All fields are required");
  }

  if (!employeeId) {
    throw new ApiError(400, "Employee ID is required");
  }

  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "At least one proof file is required");
  }

  const uploadPromises = req.files.map((file) => uploadToCloudinary(file));
  const uploadedFiles = await Promise.all(uploadPromises);

  const proofs = uploadedFiles.map((file) => ({
    public_id: file.public_id,
    url: file.public_url,
  }));

  const expenseRequest = await Expense.create({
    employee: employeeId,    // directly use employee ID
    expenseType,
    expenseDate,
    billNumber,
    amount: parseFloat(amount),
    description,
    proofs,
  });

  successResponse(res, "Expense request submitted successfully", expenseRequest);
});

export const deleteExpenseRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const expense = await Expense.findById(id);

  if (!expense) {
    throw new ApiError(404, "Expense request not found");
  }

  await expense.deleteOne();

  successResponse(res, "Expense request deleted successfully");
});
