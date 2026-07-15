import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  createAttendanceOnWeekOffTemplate,
  updateAttendanceOnWeekOffTemplate,
  deleteAttendanceOnWeekOffTemplate,
  getAllAttendanceOnWeekOffTemplates,
  getAttendanceOnWeekOffTemplateById,
  assignAttendanceOnWeekOffTemplateToEmployees,
  removeAttendanceOnWeekOffTemplateFromEmployees,
  getAOWTemplateEmployees
  
} from "../controllers/attendanceOnWeeklyOffTemplate.controller.js";

const router = express.Router();

router.use(protect);

router.post("/", createAttendanceOnWeekOffTemplate);
router.put("/assign", assignAttendanceOnWeekOffTemplateToEmployees);
router.put("/remove", removeAttendanceOnWeekOffTemplateFromEmployees);
router.get("/:templateId/staff", getAOWTemplateEmployees);

router.put("/:templateId", updateAttendanceOnWeekOffTemplate);

router.delete("/:templateId", deleteAttendanceOnWeekOffTemplate);

router.get("/", getAllAttendanceOnWeekOffTemplates);

router.get("/:templateId", getAttendanceOnWeekOffTemplateById);

export default router;
