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
} from "../services/attendanceOnHolidayTemplate.service.js";

export const createAttendanceOnHolidayTemplate = asyncHandler(
  async (req, res) => {
    const result = await createAttendanceTemplateService(req);

    return successResponse(
      res,
      "Attendance holiday template created successfully",
      result,
    );
  },
);

export const updateAttendanceOnHolidayTemplate = asyncHandler(
  async (req, res) => {
    const result = await updateAttendanceTemplateService(req);

    return successResponse(
      res,
      "Attendance holiday template updated successfully",
      result,
    );
  },
);

export const deleteAttendanceOnHolidayTemplate = asyncHandler(
  async (req, res) => {
    const result = await deleteAttendanceTemplateService(req);

    return successResponse(
      res,
      "Attendance holiday template deleted successfully",
      result,
    );
  },
);

export const getAllAttendanceOnHolidayTemplates = asyncHandler(
  async (req, res) => {
    const result = await getAllAttendanceTemplatesService(req);

    return successResponse(
      res,
      "Attendance holiday templates fetched successfully",
      result,
    );
  },
);

export const getAttendanceOnHolidayTemplateById = asyncHandler(
  async (req, res) => {
    const result = await getAttendanceTemplateByIdService(req);

    return successResponse(
      res,
      "Attendance holiday template fetched successfully",
      result,
    );
  },
);

export const getAOHTemplateEmployees = asyncHandler(async (req, res) => {
  const result = await getTemplateEmployees(req);
  const message =
    req.query.unassignedStaff === "true"
      ? "Unassigned employees fetched successfully"
      : "Assigned employees fetched successfully";
  return successResponse(res, message, result);
});

export const assignAttendanceOnHolidayTemplateToEmployees = asyncHandler(
  async (req, res) => {
    const result = await assignTemplateToEmployeesService(req);

    return successResponse(
      res,
      "Holiday template assigned to employees successfully",
      result,
    );
  },
);

export const removeAttendanceOnHolidayTemplateFromEmployees = asyncHandler(
  async (req, res) => {
    const result = await removeTemplateFromEmployeesService(req);

    return successResponse(
      res,
      "Holiday template removed from employees successfully",
      result,
    );
  },
);
