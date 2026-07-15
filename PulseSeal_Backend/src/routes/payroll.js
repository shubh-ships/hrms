import express from "express";
import { protect } from "../middlewares/auth.js";
import * as payrollController from "../controllers/payroll.controller.js";

const router = express.Router();

router.post("/create", protect, payrollController.createPayrollRun);
router.get("/list", protect, payrollController.listPayroll);
router.post("/complete/:id", protect, payrollController.completePayrollRun);
export default router;
