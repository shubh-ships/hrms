import { successResponse } from "../utils/apiResponse.js";
import asyncHandler from "../middlewares/asyncHandler.js";

import {
  createAttendanceTemplateService,
  updateAttendanceTemplateService,
  deleteAttendanceTemplateService,
  getAllAttendanceTemplatesService,
  getAttendanceTemplateByIdService,
  assignTemplateToEmployeesService,
  removeTemplateFromEmployeesService,
  getTemplateEmployees
} from "../services/attendanceOnWeeklyOffTemplate.service.js";

export const createAttendanceOnWeekOffTemplate = asyncHandler(
  async (req, res) => {
    //  console.log("Controller hit");
    //  console.log("Body:", req.body);
    const result = await createAttendanceTemplateService(req);
    // console.log("RESULT:", result);

    return successResponse(
      res,
      "Attendance weekly off template created successfully",
      result,
    );
  },
);

export const updateAttendanceOnWeekOffTemplate = asyncHandler(
  async (req, res) => {
    const result = await updateAttendanceTemplateService(req);

    return successResponse(
      res,
      "Attendance weekly off template updated successfully",
      result,
    );
  },
);

export const deleteAttendanceOnWeekOffTemplate = asyncHandler(
  async (req, res) => {
    const result = await deleteAttendanceTemplateService(req);

    return successResponse(
      res,
      "Attendance weekly off template deleted successfully",
      result,
    );
  },
);

export const getAllAttendanceOnWeekOffTemplates = asyncHandler(
  async (req, res) => {
    const result = await getAllAttendanceTemplatesService(req);

    return successResponse(
      res,
      "Attendance weekly off templates fetched successfully",
      result,
    );
  },
);

export const getAttendanceOnWeekOffTemplateById = asyncHandler(
  async (req, res) => {
    const result = await getAttendanceTemplateByIdService(req);

    return successResponse(
      res,
      "Attendance weekly off template fetched successfully",
      result,
    );
  },
);

export const getAOWTemplateEmployees = asyncHandler(async (req, res) => {
  const result = await getTemplateEmployees(req);
  const message =
    req.query.unassignedStaff === "true"
      ? "Unassigned employees fetched successfully"
      : "Assigned employees fetched successfully";
  return successResponse(res, message, result);
});

export const assignAttendanceOnWeekOffTemplateToEmployees = asyncHandler(
  async (req, res) => {
    const result = await assignTemplateToEmployeesService(req);

    return successResponse(
      res,
      "Template assigned to employees successfully",
      result,
    );
  },
);

export const removeAttendanceOnWeekOffTemplateFromEmployees = asyncHandler(
  async (req, res) => {
    const result = await removeTemplateFromEmployeesService(req);

    return successResponse(
      res,
      "Template removed from employees successfully",
      result,
    );
  },
);
