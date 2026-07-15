import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import userReducer from "@/features/user/userSlice";
import taskAssignmentReducer from "../features/taskAssignments/taskAssignmentSlice";
import departmentReducer from "../features/departments/departmentSlice";
import organizationReducer from "../features/organization/organizationSlice";
import submissionReducer from "../features/submissions/submissionSlice";
import approvalReducer from "../features/approvals/approvalSlice";
import leaderboardReducer from "../features/leaderBoard/leaderboardSlice";
import fraudReducer from "../features/fraud1/fraudSlice1";
import fraudReducer1 from "../features/fraud1/fraudSlice1";
import pulseEfficiencyReducer from "@/features/efficiencyReport/pulseEfficiencySlice";
import workingDaysReducer from "@/features/workingDays/workingdays";
import emailReducer from "@/features/EmailTat/emailSlice";
import notificationReducer from "@/features/notifications/notificationSlice";
import roleReducer from "@/features/role/roleSlice";

import holidayReducer from "@/features/holiday/holidaySlice";
import leaveReducer from "@/features/leave/leaveSlice";

import attendanceReducer from "@/features/attendance/attendanceSlice";
import leavePolicyReducer from "@/features/leavePolicy/leavePolicySlice";
import salaryReducerOld from "@/features/salarySlip/salarySlip";
import salaryReducer from "@/features/salary/salarySlice";
import overtimeReducer from "@/features/overtime/overtimeSlice";
import employeeReducer from "@/features/employee/employeeSlice";
import organizationTimingReducer from "@/features/organizationTiming/organizationTimingSlice";
import policyReducer from "@/features/policySlice/policeSlice";
import hrmsAttendanceReducer from "@/features/hrmsattendance/hrmsAttendanceSlice";
import JobPortalReducer from "@/features/job/jobPortalSlice";
import accountBalanceReducer from "@/features/accountBalance/accountBalanceSlice";
import payrollReducer from "@/features/payroll/payrollSlice";
import expenseReducer from "@/features/expenseBalance/expenseSlice";
import loanReducer from "@/features/loan/loanSlice";
import loanInterestPreset from "@/features/loanInterestPreset/loanPresetSlice";
import loanInstallmentReducer from "@/features/loanInstallment/loanInstallmentSlice";
import newUserReducer from "@/features/newUser/newUserSlice";
import approvePunchesReducer from "@/features/approvePunches/approvePunchesSlice";
import celebrationsReducer from '@/features/celebrations/celebrationsSlice';
import newJoineesReducer from "@/features/newJoinees/newJoineesSlice";
import musterRollReducer from "@/features/musterRollTable/musterRollTableSlice";
import dailyAttendanceReducer from "@/features/dailyAttendance/dailyAttendanceSlice";
import templateReducer from "@/features/employee/templateSlice";
import newAttendanceReducer from "@/features/newAttendance/newAttendanceSlice";



export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      users: userReducer,
      taskAssignments: taskAssignmentReducer,
      departments: departmentReducer,
      organizations: organizationReducer,
      submissions: submissionReducer,
      approvals: approvalReducer,
      leaderboard: leaderboardReducer,
      fraud1: fraudReducer1,
      fraud: fraudReducer,
      holiday: holidayReducer,
      leave: leaveReducer,
      employee: employeeReducer,
      roles: roleReducer,
      salarySlip: salaryReducerOld,
      salary: salaryReducer,
      overtime: overtimeReducer,
      policy: policyReducer,
      pulseEfficiency: pulseEfficiencyReducer,
      organizationTiming: organizationTimingReducer,
      hrmsAttendance: hrmsAttendanceReducer,
      workingDays: workingDaysReducer,
      notifications: notificationReducer,
      attendance: attendanceReducer,
      leavePolicy: leavePolicyReducer,
      jobPortal: JobPortalReducer,
      accountBalance: accountBalanceReducer,
      payroll: payrollReducer,
      expense: expenseReducer,
      loan: loanReducer,
      loanPreset: loanInterestPreset,
      loanInstallment: loanInstallmentReducer,
      newUser: newUserReducer,
      approvePunches: approvePunchesReducer,
      celebrations: celebrationsReducer,
      newJoinees: newJoineesReducer,
      musterRoll: musterRollReducer,
      dailyAttendance: dailyAttendanceReducer,
      templates: templateReducer,
      newAttendance: newAttendanceReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
    devTools: process.env.NODE_ENV !== "production",
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
