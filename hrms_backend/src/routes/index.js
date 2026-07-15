import express from "express";
import userRoutes from "./user.Routes.js";
import taskAssignmentRoutes from "./taskAssignment.routes.js";
import departmentRoutes from "./department.routes.js";
import organizationRoutes from "./organization.routes.js";
import submissionRoutes from "./submission.routes.js";
import approvalRoutes from "./approval.routes.js";
import fraudRoutes from "./fraud.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import pulseEfficiencyRoutes from "./pulseEfficiency.routes.js";
import workingDaysRoutes from "./workingDays.routes.js";
import notificationRoutes from "./notification.routes.js";
import sendTaskStatusEmailController from "../helper/emailHelper.js";
import createRole from "./roleDefination.routes.js";
import newUserRoutes from "./newuser.routes.js";
import test from "./test.routes.js";
import teamRoutes from "./team.routes.js";
import salaryslipRoutes from "./salaryslip.routes.js";
import organizationTimingRoutes from "./organizationTiming.routes.js";
import holidayRoutes from "./holidayroutes.js";
import overtimeRoutes from "./overtime.routes.js";
import employeeRoutes from "./employee.routes.js";
import leavePolicyRoutes from "./leavePolicy.routes.js";
import leaveRoutes from "./leave.routes.js";
import policyRoutes from "./policy.routes.js";
import careerRoutes from "./publicJobes.routes.js";
import dailyscanAttendanceRoutes from "./dailyscanAttendance.routes.js";
import accountBalanceRoutes from "./accountBalance.routes.js";
import payrollRoutes from "./payroll.js";
import expenseRoutes from "./expense.routes.js";
import loanRoutes from "./loan.routes.js";
import loanPresetRoutes from "./loanPreset.routes.js";
import loanInstallmentRoutes from "./loanInstallment.routes.js";
import celebrationRoutes from "./celebration.routes.js";
import leaveTemplateRoutes from "./leaveTemplate.routes.js";
import weeklyOffTemplateRoutes from "./weekOffTemplate.routes.js";
import leaveBalanceRoutes from "./leaveBalance.routes.js";
import leaveApplicationRoutes from "./leaveApplication.routes.js";
import automationTemplateRoutes from "./automationTemplate.routes.js";
import attendanceOnWeeklyOffTemplateRoutes from "./attendanceOnWeeklyOffTemplate.route.js";
import shiftTemplateRoutes from "./shiftTemplate.routes.js";
import attendanceOnHolidayTemplateRoutes from "./attendanceOnHolidayTemplate.route.js";
import fineAndOvertimeRoutes from "./fineAndOvertime.routes.js";
import newAttendanceRoutes from "../routes/newAttendance.routes.js"
import salaryRoutes from "./salary.routes.js"

const router = express.Router();

router.post("/role", test);
router.post("/api/send-task-email", sendTaskStatusEmailController);
router.use("/roles", createRole);
router.use("/users", userRoutes);
router.use("/task-assignment", taskAssignmentRoutes);
router.use("/departments", departmentRoutes);
router.use("/organizations", organizationRoutes);
router.use("/submission", submissionRoutes);
router.use("/approval", approvalRoutes);
router.use("/fraud", fraudRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/pulse-efficiency", pulseEfficiencyRoutes);
router.use("/working-days", workingDaysRoutes);
router.use("/newuser", newUserRoutes);
router.use("/notification", notificationRoutes);
router.use("/teams", teamRoutes);
router.use("/salaryslip", salaryslipRoutes);
router.use("/organization-timing", organizationTimingRoutes);
router.use("/holiday", holidayRoutes);
router.use("/overtime", overtimeRoutes);
router.use("/fine-overtime", fineAndOvertimeRoutes);
router.use("/facescan", dailyscanAttendanceRoutes);

router.use("/payroll", payrollRoutes);
router.use("/shift-template", shiftTemplateRoutes);
router.use("/employee", employeeRoutes);
router.use("/leave-policy", leavePolicyRoutes);
router.use("/leave", leaveRoutes);
router.use("/policy", policyRoutes);
router.use("/career", careerRoutes);
router.use("/account", accountBalanceRoutes);
router.use("/expense", expenseRoutes);
router.use("/loan-presets", loanPresetRoutes);
router.use("/loans", loanRoutes);
router.use("/loan-installments", loanInstallmentRoutes);

router.use("/celebrations", celebrationRoutes);
router.use("/leave/templates", leaveTemplateRoutes);
router.use("/weekly-off/templates", weeklyOffTemplateRoutes);
router.use("/leave/balances", leaveBalanceRoutes);
router.use("/leave/applications", leaveApplicationRoutes);
router.use("/automation/templates", automationTemplateRoutes);
router.use(
  "/attendanceonweeklyoff/templates",
  attendanceOnWeeklyOffTemplateRoutes,
);
router.use("/attendanceonholiday-templates", attendanceOnHolidayTemplateRoutes);
router.use("/newAttendance",newAttendanceRoutes);
router.use("/salary", salaryRoutes);
export default router;
