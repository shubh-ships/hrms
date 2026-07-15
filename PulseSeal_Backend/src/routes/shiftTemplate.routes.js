import express from "express";
import {
  createShiftTemplate,
  getAllShiftTemplates,
  getShiftTemplateById,
  updateShiftTemplate,
  deleteShiftTemplate,
  assignEmployeesToShift,
  removeEmployeesFromShift,
  getTemplateEmployees
} from "../controllers/shiftTemplate.controller.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

// ── Static action routes MUST be declared before /:id ────────────────────────
router.get("/:templateId/staff", getTemplateEmployees);
router.post("/assign", assignEmployeesToShift);
router.post("/remove-employee", removeEmployeesFromShift);

// ── CRUD routes ───────────────────────────────────────────────────────────────
router.post("/", createShiftTemplate);
router.get("/", getAllShiftTemplates);
router.get("/:id", getShiftTemplateById);
router.put("/:id", updateShiftTemplate);
router.delete("/:id", deleteShiftTemplate);

export default router;
