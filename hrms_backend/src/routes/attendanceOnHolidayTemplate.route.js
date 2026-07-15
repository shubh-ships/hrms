import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  createAttendanceOnHolidayTemplate,
  updateAttendanceOnHolidayTemplate,
  deleteAttendanceOnHolidayTemplate,
  getAllAttendanceOnHolidayTemplates,
  getAttendanceOnHolidayTemplateById,
  assignAttendanceOnHolidayTemplateToEmployees,
  removeAttendanceOnHolidayTemplateFromEmployees,
  getAOHTemplateEmployees
} from "../controllers/attendanceOnHolidayTemplate.controller.js";

const router = express.Router();

router.use(protect);

router.post("/", createAttendanceOnHolidayTemplate);
router.put("/assign", assignAttendanceOnHolidayTemplateToEmployees);
router.put("/remove", removeAttendanceOnHolidayTemplateFromEmployees);
router.get("/:templateId/staff", getAOHTemplateEmployees);
router.put("/:templateId", updateAttendanceOnHolidayTemplate);
router.delete("/:templateId", deleteAttendanceOnHolidayTemplate);
router.get("/", getAllAttendanceOnHolidayTemplates);
router.get("/:templateId", getAttendanceOnHolidayTemplateById);

export default router;
