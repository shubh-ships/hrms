import express from "express";
import {
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  getAutomationRule,
  getAutomationRulesByType,
  assignTemplate,
  unassignTemplate,
  getAssignmentsByEmployee,
  getAllAssignments,
  getTemplateAssignmentStatus,
  getAutomationRulesEmployees
} from "../controllers/automationTemplate.controller.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.get("/getAssignments", getAllAssignments); 

router.post("/", createAutomationRule);
router.put("/:id", updateAutomationRule);
router.delete("/:id", deleteAutomationRule);
router.get("/:id", getAutomationRule);
router.get("/", getAutomationRulesByType);

router.get('/:templateId/staff', protect, getAutomationRulesEmployees);
router.post("/assign", assignTemplate);
router.delete("/unassign/:id", unassignTemplate);
router.get("/employee/:employeeId", getAssignmentsByEmployee);

router.get("/:templateId/status", getTemplateAssignmentStatus);

export default router;