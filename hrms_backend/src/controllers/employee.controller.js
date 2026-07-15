import Employee from "../models/employee.Model.js";
import XLSX from "xlsx";
import {
  uploadOnCloudinary,
  deleteOnCloudinary,
} from "../middlewares/cloudinary.js";
import {
  createBalancesForLeaveTypes,
  deactivateBalancesForLeaveTypes,
  // initializeLeaveBalances,
} from "./leaveBalanceManager.js";
import { successResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import { LeavePolicy } from "../models/leavePolicy.Model.js";
import * as employeeService from "../services/employee.service.js";
import { parseDateParam } from "./celebration.controller.js";
import { Office } from "../models/organizationTiming.Model.js";
import leaveBalanceService from "../services/leaveBalance.service.js";
import User from "../models/user.Model.js";
import { error } from "console";
import { LeaveTemplate } from "../models/leaveTemplate.Model.js";
import shiftTemplate from "../models/ShiftTemplate.model.js";
import { holidayTemplate } from "../models/holidays.Model.js";
import { WeeklyOffTemplate } from "../models/weekOffTemplate.Model.js";
import { AttendanceOnWeeklyOffTemplate } from "../models/attendanceOnWeekOffTemplate.Model.js";
import { AttendanceOnHolidayTemplate } from "../models/attendanceOnHolidayTemplate.js";

const processDocuments = async (documents, files) => {
  const processedDocuments = [];

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    let proofData = null;

    const fileField = `documents[${i}][proof]`;
    if (files && files[fileField] && files[fileField][0]) {
      const file = files[fileField][0];
      const cloudinaryResponse = await uploadOnCloudinary(file.path);

      if (cloudinaryResponse) {
        proofData = {
          public_id: cloudinaryResponse.public_id,
          url: cloudinaryResponse.secure_url,
        };
      }
    }

    processedDocuments.push({
      type: doc.type,
      number: doc.number,
      proof: proofData || doc.proof,
      verified: doc.verified || false,
    });
  }

  return processedDocuments;
};

export const createEmployee = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;

  const {
    personal,
    employment,
    bank,
    documents,
    salary,
    leaveTemplateId,
    shiftTemplateId,
    holidayTemplateId,
    weeklyOffTemplateId,
    attendanceOnWeeklyOffTemplateId,
    attendanceOnHolidayTemplateId,
    userId,
  } = req.body;

  // Parse fields as before
  const parsedPersonal =
    typeof personal === "string" ? JSON.parse(personal) : personal;
  const parsedEmployment =
    typeof employment === "string" ? JSON.parse(employment) : employment;
  const parsedBank = bank && typeof bank === "string" ? JSON.parse(bank) : bank;
  const parsedDocuments =
    documents && typeof documents === "string"
      ? JSON.parse(documents)
      : documents;
  const parsedSalary =
    salary && typeof salary === "string" ? JSON.parse(salary) : salary;

  // Check duplicate employee code
  const existingEmployee = await Employee.findOne({
    organizationId,
    "employment.employeeCode": parsedEmployment.employeeCode,
    isDeleted: false,
  });
  if (existingEmployee) {
    throw new ApiError(
      400,
      "Employee with this employee code already exists in this organization",
    );
  }

  // Process documents (unchanged)
  let processedDocuments = [];
  if (parsedDocuments && Array.isArray(parsedDocuments)) {
    processedDocuments = await processDocuments(parsedDocuments, req.files);
  }

  // Process salary (unchanged)
  let processedSalary = [];
  if (parsedSalary && Array.isArray(parsedSalary)) {
    processedSalary = parsedSalary;
  }

  // Create employee (now using leaveTemplateId)
  const employee = new Employee({
    organizationId,
    userId,
    personal: parsedPersonal,
    employment: parsedEmployment,
    bank: parsedBank,
    documents: processedDocuments,
    salary: processedSalary,
    leaveTemplateId, // changed
    shiftTemplateId,
    holidayTemplateId,
    weeklyOffTemplateId,
    attendanceOnHolidayTemplateId,
    attendanceOnWeeklyOffTemplateId,
  });

  await employee.save();

  // Initialize leave balances using the new leave template
  if (leaveTemplateId) {
    await leaveBalanceService.initializeLeaveBalances(
      organizationId,
      employee._id,
      leaveTemplateId,
    );
  }

  // Populate response (replace leavePolicyId with leaveTemplateId)
  const populatedEmployee = await Employee.findById(employee._id)
    .populate("organizationId", "name")
    .populate("userId", "username email phoneNumber isActive isFreezed")
    .populate("employment.departmentId", "name")
    .populate("employment.userRoleTableId", "roleName")
    .populate("leaveTemplateId", "name");

  successResponse(res, "Employee created successfully", populatedEmployee, 201);
});

export const getEmployees = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;
  const { departmentId, status } = req.query;

  const filter = { isDeleted: false };

  if (organizationId) filter.organizationId = organizationId;
  if (departmentId) filter["employment.departmentId"] = departmentId;
  if (status) filter["employment.status"] = status;

  const options = {
    sort: { createdAt: -1 },
    populate: [
      { path: "organizationId", select: "name" },
      { path: "userId", select: "name username email" },
      { path: "employment.departmentId", select: "name" },
      { path: "employment.userRoleTableId", select: "roleName" },
      { path: "leaveTemplateId", select: "name" },
      { path: "shiftTemplateId", select: "name" },
      { path: "holidayTemplateId", select: "name" },
      { path: "weeklyOffTemplateId", select: "name" },
      { path: "attendanceOnWeeklyOffTemplateId", select: "name" },
      { path: "attendanceOnHolidayTemplateId", select: "name" },
    ],
  };

  const employees = await Employee.find(filter)
    .sort({ createdAt: -1 })
    .populate(options.populate);

  const employeeDetails = employees.map((emp) => ({
    _id: emp._id,
    name: emp.personal?.lastName
      ? emp.personal?.firstName + " " + emp.personal?.lastName
      : emp.personal?.firstName,
    empCode: emp.employment?.employeeCode,
    department: emp.employment?.departmentId?.name,
    role: emp.employment?.userRoleTableId?.roleName,
    email: emp.personal?.email,
    joinDate: emp.employment?.joinDate,
    status: emp.employment?.status,
    workType: emp.employment?.workType,
    employeeType: emp.employment?.employeeType,
    leaveTemplate: emp.leaveTemplateId?.name,
    shiftTemplate: emp.shiftTemplateId?.name,
    weeklyOffTemplate: emp.weeklyOffTemplateId?.name,
    holidayTemplate: emp.holidayTemplateId?.name,
    attendanceOnWeeklyOffTemplate: emp.attendanceOnWeeklyOffTemplateId?.name,
    attendanceOnHolidayTemplate: emp.attendanceOnHolidayTemplateId?.name,
  }));

  successResponse(res, "Employee fetched successfully", employeeDetails);
});

export const getEmployeeById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const employee = await Employee.findOne({
    _id: id,
    isDeleted: false,
  })
    .populate("organizationId", "name")
    .populate("userId", "name email phoneNumber isActive isFreezed ")
    .populate("employment.departmentId", "name is_active is_verified")
    .populate({
      path: "employment.userRoleTableId",
      populate: {
        path: "roleDefinitionId",
        select: "roleName permissions",
      },
    })
    .populate("leaveTemplateId", "name")
    .populate("shiftTemplateId", "name")
    .populate("weeklyOffTemplateId", "name")
    .populate("holidayTemplateId", "name")
    .populate("attendanceOnWeeklyOffTemplateId", "name")
    .populate("attendanceOnHolidayTemplateId", "name");

  if (!employee) {
    throw new ApiError(404, "Employee not found");
  }

  const formattedEmployee = {
    id: employee._id,

    organization: employee.organizationId && {
      id: employee.organizationId._id,
      name: employee.organizationId.name,
    },

    user: employee.userId && {
      id: employee.userId._id,
      name: employee.userId.name,
      email: employee.userId.email,
      phoneNumber: employee.userId.phoneNumber,
      isActive: employee.userId.isActive,
      isFreezed: employee.userId.isFreezed,
    },

    personal: {
      firstName: employee.personal?.firstName,
      lastName: employee.personal?.lastName,
      phone: employee.personal?.phone,
      email: employee.personal?.email,
      gender: employee.personal?.gender,
      dob: employee.personal?.dob,
      address: employee.personal?.address,
    },

    employment: {
      employeeCode: employee.employment?.employeeCode,
      joinDate: employee.employment?.joinDate,
      status: employee.employment?.status,
      employeeType: employee.employment?.employeeType,
      workType: employee.employment?.workType,
      workLocation: employee.employment?.workLocation,

      department: employee.employment?.departmentId && {
        id: employee.employment.departmentId._id,
        name: employee.employment.departmentId.name,
        isActive: employee.employment.departmentId.is_active,
        isVerified: employee.employment.departmentId.is_verified,
      },

      role: employee.employment?.userRoleTableId?.roleDefinitionId && {
        id: employee.employment.userRoleTableId.roleDefinitionId._id,
        name: employee.employment.userRoleTableId.roleDefinitionId.roleName,
        permissions:
          employee.employment.userRoleTableId.roleDefinitionId.permissions,
      },
    },

    templates: {
      leaveTemplate: employee.leaveTemplateId && {
        id: employee.leaveTemplateId._id,
        name: employee.leaveTemplateId.name,
      },
      shiftTemplate: employee.shiftTemplateId && {
        id: employee.shiftTemplateId._id,
        name: employee.shiftTemplateId.name,
      },
      weeklyOffTemplate: employee.weeklyOffTemplateId && {
        id: employee.weeklyOffTemplateId._id,
        name: employee.weeklyOffTemplateId.name,
      },
      holidayTemplate: employee.holidayTemplateId && {
        id: employee.holidayTemplateId._id,
        name: employee.holidayTemplateId.name,
      },
      attendanceOnWeeklyOff: employee.attendanceOnWeeklyOffTemplateId && {
        id: employee.attendanceOnWeeklyOffTemplateId._id,
        name: employee.attendanceOnWeeklyOffTemplateId.name,
      },
      attendanceOnHoliday: employee.attendanceOnHolidayTemplateId && {
        id: employee.attendanceOnHolidayTemplateId._id,
        name: employee.attendanceOnHolidayTemplateId.name,
      },
    },

    bank: employee.bank || {},

    documents: employee.documents?.map((doc) => ({
      id: doc._id,
      type: doc.type,
      number: doc.number,
      verified: doc.verified,
      proof: doc.proof,
    })),

    salary: employee.salary?.map((item) => ({
      type: item.type,
      label: item.label,
      amount: item.amount,
    })),

    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };

  successResponse(res, "Employee found successfully", formattedEmployee);
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // 🔹 Parse fields
  if (updates.personal && typeof updates.personal === "string") {
    updates.personal = JSON.parse(updates.personal);
  }
  if (updates.employment && typeof updates.employment === "string") {
    updates.employment = JSON.parse(updates.employment);
  }
  if (updates.bank && typeof updates.bank === "string") {
    updates.bank = JSON.parse(updates.bank);
  }
  if (updates.documents && typeof updates.documents === "string") {
    updates.documents = JSON.parse(updates.documents);
  }
  if (updates.salary && typeof updates.salary === "string") {
    updates.salary = JSON.parse(updates.salary);
  }

  const employee = await Employee.findOne({ _id: id, isDeleted: false });

  if (!employee) {
    throw new ApiError(404, "Employee not found");
  }

  // 🔹 Employee code uniqueness
  if (
    updates.employment?.employeeCode &&
    updates.employment.employeeCode !== employee.employment.employeeCode
  ) {
    const existingEmployee = await Employee.findOne({
      organizationId: employee.organizationId,
      "employment.employeeCode": updates.employment.employeeCode,
      _id: { $ne: id },
      isDeleted: false,
    });

    if (existingEmployee) {
      throw new ApiError(
        400,
        "Employee with this employee code already exists",
      );
    }
  }

  // 🔥 DOCUMENT PROCESSING (unchanged - already correct)
  if (updates.documents && Array.isArray(updates.documents)) {
    const existingDocIds = updates.documents
      .filter((doc) => doc._id)
      .map((doc) => doc._id.toString());

    const docsToRemove = employee.documents.filter(
      (doc) => !existingDocIds.includes(doc._id.toString()),
    );

    for (const doc of docsToRemove) {
      if (doc.proof?.public_id) {
        await deleteOnCloudinary(doc.proof.public_id);
      }
    }

    const updatedDocuments = await Promise.all(
      updates.documents.map(async (doc, index) => {
        let proofData = null;
        const fileField = `documents[${index}][proof]`;

        if (req.files?.[fileField]?.[0]) {
          const file = req.files[fileField][0];

          if (doc._id) {
            const existingDoc = employee.documents.id(doc._id);
            if (existingDoc?.proof?.public_id) {
              await deleteOnCloudinary(existingDoc.proof.public_id);
            }
          }

          const upload = await uploadOnCloudinary(file.path);
          proofData = {
            public_id: upload.public_id,
            url: upload.secure_url,
          };
        } else if (doc._id) {
          const existingDoc = employee.documents.id(doc._id);
          proofData = existingDoc?.proof || null;
        }

        return {
          _id: doc._id || undefined,
          type: doc.type,
          number: doc.number,
          proof: proofData,
          verified: doc.verified || false,
        };
      }),
    );

    employee.documents = updatedDocuments;
  }

  // 🔥 Capture OLD leave template BEFORE update
  const oldLeaveTemplateId = employee.leaveTemplateId?.toString();

  // 🔥 APPLY UPDATES CLEANLY

  if (updates.personal) {
    Object.assign(employee.personal, updates.personal);
    employee.markModified('personal');
  }

  if (updates.employment) {
    Object.assign(employee.employment, updates.employment);
    employee.markModified('employment');
  }

  if (updates.bank) {
    Object.assign(employee.bank, updates.bank);
    employee.markModified('bank');
  }

  if (updates.salary) {
    employee.salary = updates.salary;
  }

  // 🔥 IMPORTANT: HANDLE TEMPLATE FIELDS EXPLICITLY

  const templateFields = [
    "leaveTemplateId",
    "shiftTemplateId",
    "holidayTemplateId",
    "weeklyOffTemplateId",
    "attendanceOnWeeklyOffTemplateId",
    "attendanceOnHolidayTemplateId",
  ];

  templateFields.forEach((field) => {
    if (field in updates) {
      employee[field] = updates[field] || null;
    }
  });

  // Other direct fields (like userId etc.)
  if (updates.userId) {
    employee.userId = updates.userId;
  }

  employee.updatedAt = new Date();
  await employee.save();

  // 🔥 HANDLE LEAVE TEMPLATE CHANGE (CRITICAL)

  const newLeaveTemplateId = employee.leaveTemplateId?.toString();

  if (newLeaveTemplateId && oldLeaveTemplateId !== newLeaveTemplateId) {
    // 1️⃣ Delete old balances and Initialize new balances
    await leaveBalanceService.reinitializeLeaveBalances(
      req.user.organizationId,
      id,
      newLeaveTemplateId,
    );
  }

  // 🔥 POPULATE (FIXED ROLE ALSO)
  const updatedEmployee = await Employee.findById(id)
    .populate("organizationId", "name")
    .populate("userId", "name username email phoneNumber isActive isFreezed")
    .populate("employment.departmentId", "name")
    .populate({
      path: "employment.userRoleTableId",
      populate: {
        path: "roleDefinitionId",
        select: "roleName permissions",
      },
    })
    .populate("leaveTemplateId", "name")
    .populate("shiftTemplateId", "name")
    .populate("weeklyOffTemplateId", "name")
    .populate("holidayTemplateId", "name")
    .populate("attendanceOnWeeklyOffTemplateId", "name")
    .populate("attendanceOnHolidayTemplateId", "name");

  return successResponse(res, "Employee updated successfully", {
    employee: updatedEmployee,
  });
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const employee = await Employee.findOne({ _id: id, isDeleted: false });

  if (!employee) {
    throw new ApiError(404, "Employee not found");
  }

  if (employee.documents && employee.documents.length > 0) {
    for (const doc of employee.documents) {
      if (doc.proof && doc.proof.public_id) {
        await deleteOnCloudinary(doc.proof.public_id);
      }
    }
  }

  employee.isDeleted = true;
  employee.employment.status = "inactive";
  employee.updatedAt = new Date();
  await employee.save();

  successResponse(res, "Employee deleted successfully");
});

export const getEmployeesByOrganization = asyncHandler(async (req, res) => {
  const { organizationId } = req.params;
  const { departmentId, status, page = 1, limit = 10 } = req.query;

  const filter = {
    organizationId,
    isDeleted: false,
  };

  if (departmentId) filter["employment.departmentId"] = departmentId;
  if (status) filter["employment.status"] = status;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      { path: "userId", select: "username email" },
      { path: "employment.departmentId", select: "name" },
      { path: "employment.userRoleTableId", select: "roleName" },
    ],
  };

  const employees = await Employee.paginate(filter, options);

  successResponse(res, "Employee fetched successfully", employees);
});

export const getEmployeesByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const employee = await Employee.findOne({
    userId,
    isDeleted: false,
  })
    .populate("organizationId", "name")
    .populate("userId", "name email phoneNumber isActive isFreezed ")
    .populate("employment.departmentId", "name is_active is_verified")
    .populate({
      path: "employment.userRoleTableId",
      populate: {
        path: "roleDefinitionId",
        select: "roleName permissions",
      },
    })
    .populate("leaveTemplateId", "name")
    .populate("shiftTemplateId", "name")
    .populate("weeklyOffTemplateId", "name")
    .populate("holidayTemplateId", "name")
    .populate("attendanceOnWeeklyOffTemplateId", "name")
    .populate("attendanceOnHolidayTemplateId", "name");

  if (!employee) {
    throw new ApiError(404, "Employee not found");
  }

  const formattedEmployee = {
    id: employee._id,

    organization: employee.organizationId && {
      id: employee.organizationId._id,
      name: employee.organizationId.name,
    },

    user: employee.userId && {
      id: employee.userId._id,
      name: employee.userId.name,
      email: employee.userId.email,
      phoneNumber: employee.userId.phoneNumber,
      isActive: employee.userId.isActive,
      isFreezed: employee.userId.isFreezed,
    },

    personal: {
      firstName: employee.personal?.firstName,
      lastName: employee.personal?.lastName,
      phone: employee.personal?.phone,
      email: employee.personal?.email,
      gender: employee.personal?.gender,
      dob: employee.personal?.dob,
      address: employee.personal?.address,
    },

    employment: {
      employeeCode: employee.employment?.employeeCode,
      joinDate: employee.employment?.joinDate,
      status: employee.employment?.status,
      employeeType: employee.employment?.employeeType,
      workType: employee.employment?.workType,
      workLocation: employee.employment?.workLocation,

      department: employee.employment?.departmentId && {
        id: employee.employment.departmentId._id,
        name: employee.employment.departmentId.name,
        isActive: employee.employment.departmentId.is_active,
        isVerified: employee.employment.departmentId.is_verified,
      },

      role: employee.employment?.userRoleTableId?.roleDefinitionId && {
        id: employee.employment.userRoleTableId.roleDefinitionId._id,
        name: employee.employment.userRoleTableId.roleDefinitionId.roleName,
        permissions:
          employee.employment.userRoleTableId.roleDefinitionId.permissions,
      },
    },

    templates: {
      leaveTemplate: employee.leaveTemplateId && {
        id: employee.leaveTemplateId._id,
        name: employee.leaveTemplateId.name,
      },
      shiftTemplate: employee.shiftTemplateId && {
        id: employee.shiftTemplateId._id,
        name: employee.shiftTemplateId.name,
      },
      weeklyOffTemplate: employee.weeklyOffTemplateId && {
        id: employee.weeklyOffTemplateId._id,
        name: employee.weeklyOffTemplateId.name,
      },
      holidayTemplate: employee.holidayTemplateId && {
        id: employee.holidayTemplateId._id,
        name: employee.holidayTemplateId.name,
      },
      attendanceOnWeeklyOff: employee.attendanceOnWeeklyOffTemplateId && {
        id: employee.attendanceOnWeeklyOffTemplateId._id,
        name: employee.attendanceOnWeeklyOffTemplateId.name,
      },
      attendanceOnHoliday: employee.attendanceOnHolidayTemplateId && {
        id: employee.attendanceOnHolidayTemplateId._id,
        name: employee.attendanceOnHolidayTemplateId.name,
      },
    },

    bank: employee.bank || {},

    documents: employee.documents?.map((doc) => ({
      id: doc._id,
      type: doc.type,
      number: doc.number,
      verified: doc.verified,
      proof: doc.proof,
    })),

    salary: employee.salary?.map((item) => ({
      type: item.type,
      label: item.label,
      amount: item.amount,
    })),

    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
  successResponse(res, "Employee fetched successfully", formattedEmployee);
});

export const addEmployeeDocument = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const { type, number, verified, name } = req.body;

  if (!req.file) {
    throw new ApiError(400, "Document file is required");
  }

  const employee = await Employee.findOne({
    _id: employeeId,
    isDeleted: false,
  });

  if (!employee) {
    throw new ApiError(404, "Employee not found");
  }

  const cloudinaryResponse = await uploadOnCloudinary(req.file.path);

  if (!cloudinaryResponse) {
    throw new ApiError(500, "Error uploading document");
  }

  employee.documents.push({
    type: type || "others",
    name: name || "",
    number,
    proof: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
    verified: verified === "true" || verified === true,
  });

  employee.updatedAt = new Date();
  await employee.save();

  successResponse(
    res,
    "Document added successfully",
    employee.documents[employee.documents.length - 1],
  );
});

export const removeEmployeeDocument = asyncHandler(async (req, res) => {
  const { employeeId, documentId } = req.params;

  const employee = await Employee.findOne({
    _id: employeeId,
    isDeleted: false,
  });

  if (!employee) {
    throw new ApiError(404, "Employee not found");
  }

  const document = employee.documents.id(documentId);

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  if (document.proof && document.proof.public_id) {
    await deleteOnCloudinary(document.proof.public_id);
  }

  employee.documents.pull(documentId);
  employee.updatedAt = new Date();
  await employee.save();

  successResponse(res, "Document removed successfully");
});

/**
 * Main handler to create / delete leave balances when workType changes.
 * - create missing balances for rules that newly apply
 * - deactivate balances for rules that no longer apply
 */
export const handleWorkTypeChange = async (
  employee,
  oldWorkType,
  newWorkType,
) => {
  const organizationId = employee.organizationId;
  const employeeId = employee._id;

  const leavePolicy = await LeavePolicy.findOne({
    organizationId,
    isDeleted: false,
  });
  if (!leavePolicy) return;

  // Helper to compute set of leaveTypes that apply to a workType
  const applicableLeaveTypes = (workType) => {
    const set = new Set();
    for (const rule of leavePolicy.rules || []) {
      // Treat missing/empty applicableTo as "applies to all"
      if (
        !rule.applicableTo ||
        rule.applicableTo.length === 0 ||
        rule.applicableTo.includes(workType)
      ) {
        set.add(rule.leaveType);
      }
    }
    return set;
  };

  const oldSet = oldWorkType ? applicableLeaveTypes(oldWorkType) : new Set();
  const newSet = newWorkType ? applicableLeaveTypes(newWorkType) : new Set();

  // leaveTypes to create: in newSet but not already present in DB
  const toCreateTypes = [...newSet].filter((t) => !oldSet.has(t));

  // leaveTypes to deactivate: in oldSet but not in newSet
  const toDeactivateTypes = [...oldSet].filter((t) => !newSet.has(t));

  // Create missing balances (only for current period(s))
  if (toCreateTypes.length > 0) {
    await createBalancesForLeaveTypes(
      organizationId,
      employeeId,
      toCreateTypes,
      leavePolicy,
      employee,
    );
  }

  // Deactivate balances (mark isDeleted = true) for those leave types
  if (toDeactivateTypes.length > 0) {
    await deactivateBalancesForLeaveTypes(
      organizationId,
      employeeId,
      toDeactivateTypes,
    );
  }
};

/**
 * GET /api/employees/upcoming-joiners?organizationId=xxx&startDate=2026-02-04&endDate=2026-02-11
 * Returns list of employees who join within the given range (default: today to month-end).
 */
export const getUpcomingNewJoiners = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;
  const { startDate, endDate } = req.query;
  if (!organizationId) {
    throw new ApiError(400, "Organization ID is required");
  }

  let start = parseDateParam(startDate);
  let end = parseDateParam(endDate);

  // If any date param is provided, both must be valid
  if (startDate || endDate) {
    if (!start || !end) {
      throw new ApiError(
        400,
        "Both startDate and endDate must be valid dates (YYYY-MM-DD)",
      );
    }
    if (start > end) {
      throw new ApiError(400, "startDate must be before or equal to endDate");
    }
  }

  const result = await employeeService.getUpcomingNewJoiners(
    organizationId,
    start,
    end,
  );
  res.status(200).json({ success: true, data: result });
});

export const bulkCreateEmployees = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "File not uploaded",
    });
  }

  const { organizationId } = req.user;
  const { leavePolicyId, departmentId, userRoleTableId, shiftId } = req.body;

  const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const employees = [];

  const errors = [];

  /* Loop Employees */

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      // Find user by email

      const user = await User.findOne({
        email: row.email,
      });

      if (!user) {
        errors.push({
          row: i + 1,

          email: row.email,

          message: "User not found with this email",
        });

        continue;
      }

      // Create Employee Object

      const employee = new Employee({
        userId: user._id,
        organizationId,
        leavePolicyId,
        shiftId,
        departmentId,
        userRoleTableId,

        personal: {
          firstName: row.firstName,
          lastName: row.lastName,

          dob: row.dob ? new Date(row.dob) : null,

          gender: row.gender,

          maritalStatus: row.maritalStatus,

          phone: row.phone,

          email: row.email,

          address: {
            line1: row.line1,
            line2: row.line2,
            city: row.city,
            state: row.state,
            country: row.country,
            pincode: row.pincode,
          },
        },

        employment: {
          employeeCode: row.employeeCode,

          joinDate: new Date(row.joinDate),

          exitDate: row.exitDate ? new Date(row.exitDate) : null,

          status: row.status,

          workLocation: row.workLocation,

          workType: row.workType,
        },

        bank: {
          accountHolderName: row.accountHolderName,

          accountNumber: row.accountNumber,

          ifsc: row.ifsc,

          bankName: row.bankName,

          branch: row.branch,
        },
      });

      employees.push(employee);
    } catch (err) {
      errors.push({
        row: i + 1,

        email: row.email,

        message: err.message,
      });
    }
  }

  /* Insert Valid Employees */

  if (employees.length > 0) {
    await Employee.insertMany(employees);
  }

  res.json({
    success: true,

    inserted: employees.length,

    failed: errors.length,

    errors: errors,
  });
});
export const bulkUploadBankDetails = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "File not uploaded",
    });
  }

  const workbook = XLSX.read(req.file.buffer, { type: "buffer" });

  // ✅ FIXED
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const errors = [];
  const updates = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const email = row.email?.trim().toLowerCase();

    const employee = await Employee.findOne({
      "personal.email": { $regex: new RegExp(`^${email}$`, "i") },
    });

    if (!employee) {
      errors.push({
        row: i + 1,
        email,
        message: "Employee not found",
      });
      continue;
    }

    if (!row.accountNumber || !row.ifsc) {
      errors.push({
        row: i + 1,
        email,
        message: "Missing required bank details",
      });
      continue;
    }

    updates.push({
      updateOne: {
        filter: { _id: employee._id },
        update: {
          bank: {
            accountHolderName: row.accountHolderName,
            accountNumber: row.accountNumber,
            ifsc: row.ifsc,
            bankName: row.bankName,
            branch: row.branch,
          },
        },
      },
    });
  }

  if (updates.length > 0) {
    await Employee.bulkWrite(updates);
  }

  return res.status(200).json({
    success: true,
    message: "Bank details updated",
    updatedCount: updates.length,
    errorCount: errors.length,
    errors,
  });
});

export const bulkUpdateEmployeeStatus = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "File is required",
    });
  }

  // ✅ FIX HERE
  const workbook = XLSX.read(req.file.buffer, { type: "buffer" });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  const allowedStatus = ["active", "inactive", "terminated"];

  let success = [];
  let failed = [];

  for (const row of data) {
    const { email, status } = row;

    if (!allowedStatus.includes(status)) {
      failed.push({ email, reason: "Invalid status" });
      continue;
    }

    const employee = await Employee.findOne({
      "personal.email": email,
    });

    if (!employee) {
      failed.push({ email, reason: "Employee not found" });
      continue;
    }

    employee.employment.status = status;
    await employee.save();

    success.push(email);
  }

  res.status(200).json({
    message: "Bulk status update completed",
    successCount: success.length,
    failedCount: failed.length,
    failed,
  });
});
export const updatebulkEmployeeBankDetails = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const {
      employeeCodes,
      accountHolderName,
      accountNumber,
      confirmAccountNumber,
      ifsc,
    } = req.body;

    const result = await employeeService.updateBulkEmployeeBankDetailsService(
      organizationId,
      employeeCodes,
      accountHolderName,
      accountNumber,
      confirmAccountNumber,
      ifsc,
    );

    return res.status(200).json({
      success: true,
      message: "Bank details updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error updating bank details:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getEmployeeDocuments = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const { type } = req.query;

  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    throw new ApiError(400, "Invalid employeeId");
  }

  const employee = await Employee.findById(employeeId).select("documents");

  if (!employee) {
    throw new ApiError(404, "Employee not found");
  }

  let documents = employee.documents;

  // Optional filter
  if (type) {
    const allowedTypes = ["aadhaar", "pan", "passport", "others"];

    if (!allowedTypes.includes(type)) {
      throw new ApiError(400, "Invalid document type");
    }

    documents = documents.filter((doc) => doc.type === type);
  }

  return successResponse(res, "Documents fetched successfully", {
    count: documents.length,
    documents,
  });
});

export const getAllTemplates = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;
  if (!organizationId) {
    throw new ApiError(400, "Organization ID is required");
  }
  LeaveTemplate;

  const [
    shiftTemplates,
    leaveTemplates,
    weekOffTemplates,
    holidayTemplates,
    attendanceOnWeekOffTemplates,
    attendanceOnHolidayTemplates,
  ] = await Promise.all([
    await shiftTemplate.find({ organizationId }).lean(),
    await LeaveTemplate.find({ organizationId }).lean(),
    await WeeklyOffTemplate.find({ organizationId }).lean(),
    await holidayTemplate.find({ organizationId }).lean(),
    await AttendanceOnWeeklyOffTemplate.find({ organizationId }).lean(),
    await AttendanceOnHolidayTemplate.find({ organizationId }).lean(),
  ]);

  const result = {
    shiftTemplates,
    leaveTemplates,
    weekOffTemplates,
    holidayTemplates,
    attendanceOnWeekOffTemplates,
    attendanceOnHolidayTemplates,
  };
  return successResponse(res, "All templates fetched successfully", result);
});

// export const checkEmployeeTemplate = async (req, res) => {
//   const { employeeId } = req.params;

//   const employee = await Employee.findById(employeeId)
//     .select("personal.firstName attendanceOnWeeklyOffTemplateId");

//   return res.json({
//     success: true,
//     data: employee
//   });
// };
