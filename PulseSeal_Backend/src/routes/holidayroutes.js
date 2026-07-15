import * as holidayController from "../controllers/holiday.controller.js";
import express from "express";
const router = express.Router();
import { protect } from "../middlewares/auth.js";
router.use(protect);
// router.post("/", protect, holidayController.createHoliday);
// router.get("/org", holidayController.getHolidaysByOrgId);
// router.put("/:id", protect, holidayController.updateHolidayById);

// Create Holiday Template

router.post("/", holidayController.createHolidayTemplate);

// Get All Templates
router.get("/", holidayController.getHolidayTemplates);

// Assign Template to Employees
router.post("/assign", protect, holidayController.assignHolidayTemplate);
// Remove Template From Employees
router.post(
  "/:templateId/remove",
  holidayController.removeEmployeesFromTemplate,
);
// Get Employees Assigned to Template
router.get("/:templateId/assigned", holidayController.getAssignedEmployees);

// Get Employees NOT Assigned to Template
router.get("/:templateId/unassigned", holidayController.getUnassignedEmployees);

// Get Template by ID
router.get("/:id", holidayController.getHolidayByTemplateId);

// Update Template
router.put("/:id", holidayController.updateHolidayTemplate);

// Delete Template
router.delete("/:id", holidayController.deleteHolidayTemplate);
export default router;
