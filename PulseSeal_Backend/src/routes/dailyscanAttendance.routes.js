import express from "express";
import * as dailyController from "../controllers/dailyscanAttendance.controller.js";
import { protect } from "../middlewares/auth.js";
import { upload } from "../middlewares/multer.js";
import { body, param, query } from "express-validator";

const router = express.Router();

router.post(
  "/scaner",
  upload.single("faceImage"),
  dailyController.liveFaceScanController,
);

router.use(protect);

router.post("/scan", dailyController.recordScan);
router.post(
  "/manual-attendance",
  [
    body("userId").isMongoId().withMessage("Valid user ID is required"),
    body("organizationId")
      .isMongoId()
      .withMessage("Valid organization ID is required"),
    body("date").isISO8601().withMessage("Valid date is required"),
    body("status")
      .isIn([
        "PRESENT",
        "HALF_DAY",
        "ABSENT",
        "WEEKLY_OFF",
        "HOLIDAY",
        "COMPENSATORY_OFF",
        "PAID_LEAVE"
      ])
      .withMessage("Valid status is required"),
    body("loginTime").optional().isISO8601(),
    body("logoutTime").optional().isISO8601(),
    body("remarks").optional().isString(),
    body("fineAmount").optional().isNumeric(),
    body("overtimePayMinutes").optional().isNumeric(),
  ],
  dailyController.createManualAttendance,
);
router.patch("/update", dailyController.patchDailyScan);
router.get("/user/:id", dailyController.getScanAttendance);
router.get("/monthly-report", dailyController.getMonthlyReport);
router.get("/monthly-report/:id", dailyController.getMonthlyReportById);

router.delete("/delete-record", dailyController.deleteAttendance);

router.post(
  "/attendance/:attendanceId/approve",
  dailyController.approveAttendance,
);

// Approve Punches Routes (Admin only)
router.get(
  "/pending",
  [
    query("startDate").optional().isISO8601(),
    query("endDate").optional().isISO8601(),
    query("userIds").optional().isString(),
  ],
  dailyController.getPendingApprovals,
);

router.put(
  "/approve/:recordId",
  [
    param("recordId").isMongoId().withMessage("Valid record ID is required"),
    body("status")
      .isIn(["PRESENT", "HALF_DAY", "ABSENT"])
      .withMessage("Valid status is required"),
    body("remarks").optional().isString(),
    body("fineAmount").optional().isNumeric(),
    body("overtimePayMinutes").optional().isNumeric(),
  ],
  dailyController.approveAttendance,
);

router.put(
  "/reject/:recordId",
  [
    param("recordId").isMongoId().withMessage("Valid record ID is required"),
    body("remarks").optional().isString(),
    body("fineAmount").optional().isNumeric(),
  ],
  dailyController.rejectAttendance,
);

// User Daily Scan Routes

// router.post(
//   "/scan",
//   [
//     body("userId").isMongoId().withMessage("Valid user ID is required"),
//     body("organizationId").isMongoId().withMessage("Valid organization ID is required"),
//     body("scanTime").isISO8601().withMessage("Valid ISO8601 date is required")
//   ],
//   dailyController.userDailyScan
// );

// router.get(
//   "/today/:userId",
//   [param("userId").isMongoId().withMessage("Valid user ID is required")],
//   protect,
//   dailyController.getTodayAttendance,
// );

// Manual Attendance Routes (Admin only)
// router.post(
//   "/manual",
//   protect,
//   [
//     body("userId").isMongoId().withMessage("Valid user ID is required"),
//     body("organizationId").isMongoId().withMessage("Valid organization ID is required"),
//     body("date").isISO8601().withMessage("Valid date is required"),
//     body("status").isIn([
//       "PRESENT", "HALF_DAY", "ABSENT",
//       "WEEKLY_OFF","HOLIDAY","COMPENSATORY_OFF","PAID_LEAVE"
//     ]).withMessage("Valid status is required"),
//     body("loginTime").optional().isISO8601(),
//     body("logoutTime").optional().isISO8601(),
//     body("remarks").optional().isString(),
//     body("fineAmount").optional().isNumeric(),
//     body("overtimePayMinutes").optional().isNumeric()
//   ],
//   dailyController.createManualAttendance
// );

// router.post(
//   "/manual/bulk",
//   protect,
//   [
//     body("attendanceList")
//       .isArray()
//       .withMessage("attendanceList must be an array"),
//     body("attendanceList.*.userId").isMongoId(),
//     body("attendanceList.*.organizationId").isMongoId(),
//     body("attendanceList.*.date").isISO8601(),
//     body("attendanceList.*.status").isIn([
//       "PRESENT",
//       "HALF_DAY",
//       "ABSENT",
//       "WEEKLY_OFF","HOLIDAY","COMPENSATORY_OFF","PAID_LEAVE",
//     ]),
//   ],
//   dailyController.bulkManualAttendance,
// );

// router.post(
//   "/approve/bulk",
//   protect,
//   [
//     body("recordIds").isArray().withMessage("recordIds must be an array"),
//     body("recordIds.*").isMongoId(),
//     body("status").isIn(["PRESENT", "HALF_DAY", "ABSENT"]),
//     body("remarks").optional().isString(),
//     body("fineAmount").optional().isNumeric(),
//     body("overtimePayMinutes").optional().isNumeric(),
//   ],
//   dailyController.bulkApproveAttendance,
// );

// All dashboard APIs require authentication and org access

router.get(
  "/summary",
  [query("date").optional().isISO8601()],
  dailyController.getDashboardSummary,
);

router.get(
  "/department",
  [query("date").optional().isISO8601()],
  dailyController.getDepartmentWiseAttendance,
);

router.get(
  "/shift",
  [query("date").optional().isISO8601()],
  dailyController.getShiftWiseAttendance,
);

router.get(
  "/detail",
  [query("date").optional().isISO8601()],
  dailyController.getDetailedAttendance,
);

router.get("/monthly/:userId", dailyController.getMonthlyAttendance);

export default router;
