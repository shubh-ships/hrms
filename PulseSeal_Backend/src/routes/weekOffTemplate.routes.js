// routes/weeklyOffTemplate.routes.js
import express from "express";
import {
  createWeeklyOffTemplate,
  getWeeklyOffTemplateById,
  getAllWeeklyOffTemplates,
  updateWeeklyOffTemplate,
  deleteWeeklyOffTemplate,
  getTemplateEmployees,
  assignEmployeesToTemplate,
  removeEmployeesFromTemplate,
} from "../controllers/weekOffTemplate.controller.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

// Basic CRUD routes
router.post("/", createWeeklyOffTemplate);
router.get("/", getAllWeeklyOffTemplates);
router.get("/:id", getWeeklyOffTemplateById);
router.put("/:id", updateWeeklyOffTemplate);
router.delete("/:id", deleteWeeklyOffTemplate);

// Staff assignment routes
router.get("/:templateId/staff", getTemplateEmployees);
router.post("/:templateId/staff", assignEmployeesToTemplate);
router.delete("/:templateId/staff", removeEmployeesFromTemplate);

export default router;
