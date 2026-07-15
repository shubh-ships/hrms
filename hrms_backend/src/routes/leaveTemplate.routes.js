import express from "express";
import {
  createLeaveTemplate,
  getLeaveTemplateById,
  getAllLeaveTemplates,
  updateLeaveTemplate,
  deleteLeaveTemplate,
  activateLeaveTemplate,
  getTemplateEmployees,
  assignEmployeesToTemplate,
  removeEmployeesFromTemplate,
} from "../controllers/leaveTemplate.controller.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.post("/", createLeaveTemplate);
router.get("/", getAllLeaveTemplates);
router.get("/:id", getLeaveTemplateById);
router.put("/:id", updateLeaveTemplate);
router.delete("/:id", deleteLeaveTemplate);
router.patch("/:id/activate", activateLeaveTemplate);

// Staff assignment routes
router.get("/:templateId/staff", getTemplateEmployees);
router.post("/:templateId/staff", assignEmployeesToTemplate);
router.delete("/:templateId/staff", removeEmployeesFromTemplate);

export default router;
