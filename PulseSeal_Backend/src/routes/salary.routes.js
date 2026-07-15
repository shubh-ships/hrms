import express from "express";
import * as controller from "../controllers/salary.controller.js";
import { protect } from '../middlewares/auth.js';
const router = express.Router();
router.use(protect);
// TEMPLATE
router.post("/template", controller.createTemplate);
router.get("/template", controller.getTemplates);


// COMPONENTS
router.post("/template/component", controller.createComponent);
router.get("/template/:templateId/components", controller.getComponents);
router.put("/template/:templateId/components", controller.replaceComponents);

// SALARY
router.post("/assign", controller.assignSalary);
router.put("/edit", controller.editSalary);
router.post("/revise", controller.reviseSalary);

// PAYROLL
router.post("/payroll/run", controller.runPayroll);
router.get("/payroll/overview", controller.getPayrollOverview);
router.get("/payroll/history/:employeeId", controller.getEmployeePayrollHistory);



// SALARY ACTIONS (Manual Bonus, Allowance, Deduction, Advance)
router.post("/actions", controller.addSalaryAction);
router.get("/actions", controller.getSalaryActions);
router.delete("/actions/:id", controller.deleteSalaryAction);


export default router;