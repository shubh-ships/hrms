// import mongoose from "mongoose";
// const { Schema, model, Types } = mongoose;

// const ATTENDANCE_STATUS = [
//   "NOT_MARKED",
//   "PUNCHED_IN",
//   "PUNCHED_OUT",
//   "PRESENT",
//   "HALF_DAY",
//   "WEEKLY_OFF",
//   "HOLIDAY",
//   "COMPENSATORY_OFF",
//   "PAID_LEAVE",
//   "ABSENT",
//   "PENDING_APPROVAL",
// ];

// const APPROVAL_TYPE = ["AUTO", "MANUAL"];

// const dailyAttendanceSchema = new Schema(
//   {
//     userId: { type: Types.ObjectId, ref: "User", required: true },
//     organizationId: {
//       type: Types.ObjectId,
//       ref: "Organization",
//       required: true,
//     },

//     date: { type: Date, required: true },

//     // ======================
//     // Punches
//     // ======================
//     scans: [
//       {
//         scanTime: { type: Date, required: true },
//         type: { type: String, enum: ["IN", "OUT"], required: true },
//         sessionMinutes: Number,
//         breakMinutes: Number,
//       },
//     ],

//     // ======================
//     // Calculated Time
//     // ======================
//     officeTotalWorkingMinutes: { type: Number, default: 0 },
//     totalWorkMinutes: { type: Number, default: 0 },
//     totalBreakMinutes: { type: Number, default: 0 },

//     // ======================
//     // Late / Early / OT
//     // ======================
//     isLateLogin: { type: Boolean, default: false },
//     lateLoginMinutes: { type: Number, default: 0 },

//     isEarlyLogout: { type: Boolean, default: false },
//     earlyLogoutMinutes: { type: Number, default: 0 },

//     isOvertime: { type: Boolean, default: false },
//     totalOvertimeMinutes: { type: Number, default: 0 },

//     // ======================
//     // 🔥 ATTENDANCE ENGINE
//     // ======================
//     status: {
//       type: String,
//       enum: ATTENDANCE_STATUS,
//       default: "NOT_MARKED",
//     },

//     approvalType: {
//       type: String,
//       enum: APPROVAL_TYPE,
//       default: "AUTO",
//     },

//     approvedBy: {
//       type: Types.ObjectId,
//       ref: "User",
//     },

//     approvedAt: Date,

//     approvalRemarks: String,

//     // ======================
//     // Shift snapshot (VERY IMPORTANT)
//     // ======================
//     shiftSnapshot: {
//       shiftName: String,
//       shiftStart: String, // "09:00"
//       shiftEnd: String, // "19:30"
//       minFullDayMinutes: Number,
//       minHalfDayMinutes: Number,
//       lateGraceMinutes: Number,
//       earlyGraceMinutes: Number,
//     },

//     // ======================
//     // Salary impact snapshot
//     // ======================
//     salaryImpact: {
//       payableFraction: {
//         type: Number,
//         enum: [0, 0.5, 1],
//         default: 0,
//       },
//       isPaidLeaveUsed: { type: Boolean, default: false },
//       fineAmount: { type: Number, default: 0 },
//       overtimePayMinutes: { type: Number, default: 0 },
//     },

//     linkedLeaveId: { type: Types.ObjectId, ref: "Leave" },

//     // ======================
//     // Locking
//     // ======================
//     isFinalized: { type: Boolean, default: false },
//   },
//   { timestamps: true },
// );

// dailyAttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

// export default model("DailyAttendance", dailyAttendanceSchema);

import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

/**
 * ENUMS
 */
const ATTENDANCE_DAY_TYPE = [
  "PRESENT",
  "ABSENT",
  "HALF_DAY",
  "LEAVE",
  "WEEK_OFF",
  "HOLIDAY",
  "PUNCHED_IN",
  "NOT_MARKED",
  "PUNCHED_OUT"
];

const SESSION_TYPE = ["BOTH", "SESSION_1", "SESSION_2"];

const SOURCE_TYPE = [
  "AUTO", // system generated
  "MANUAL", // HR/Admin
  "SELF", // employee marked
];

const PAY_TYPE = ["REGULAR", "OVERTIME", "COMPOFF", "UNPAID"];

const PENALTY_TYPE = ["LATE", "EARLY_EXIT", "BREAK"];

const penaltySchema = new Schema(
  {
    type: {
      type: String,
      enum: PENALTY_TYPE,
    },

    minutes: Number,
    amount: Number,

    ruleId: {
      type: Types.ObjectId,
      ref: "AutomationRule",
    },

    // ✅ NEW
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    appliedAt: Date,
  }
);

/**
 * OVERTIME / BENEFITS
 */
const earningSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["OVERTIME", "EARLY_OVERTIME"],
    },

    minutes: Number,
    amount: Number,
    multiplier: Number,

    isWeekOff: {
      type: Boolean,
      default: false,
    },

    isHoliday: {
      type: Boolean,
      default: false,
    },

    ruleId: {
      type: Types.ObjectId,
      ref: "AutomationRule",
    },

    // ✅ NEW
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    appliedAt: Date,
  }
);

/**
 * SESSION SUB-DOCUMENT
 * (Handles half-day + leave combos)
 */
const sessionSchema = new Schema(
  {
    session: {
      type: String,
      enum: SESSION_TYPE,
      required: true,
    },

    type: {
      type: String,
      enum: ATTENDANCE_DAY_TYPE,
      required: true,
    },

    leaveCategoryId: {
      type: Types.ObjectId,
      ref: "LeaveCategory",
    },

    isPaid: {
      type: Boolean,
      default: true,
    },

    source: {
      type: String,
      enum: SOURCE_TYPE,
      default: "AUTO",
    },
  },
  { _id: false },
);

/**
 * TIMELINE (RAW PUNCHES)
 */
const punchSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["IN", "OUT"],
      required: true,
    },

    time: {
      type: Date,
      required: true,
    },

    sequence: {
      type: Number,
      required: true,
    },

    source: {
      type: String,
      enum: SOURCE_TYPE,
      default: "SELF",
    },
  },
  { _id: false },
);

/**
 * MAIN ATTENDANCE SCHEMA
 */
const attendanceSchema = new Schema(
  {
    organizationId: {
      type: Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    employeeId: {
      type: Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    /**
     * DAY CLASSIFICATION (SYSTEM LEVEL)
     */
    dayContext: {
      isWeekOff: Boolean,
      isHoliday: Boolean,
      holidayId: {
        type: Types.ObjectId,
        ref: "Holiday",
      },
      holidayType: {
        type: String,
        enum: ["FULL_DAY", "HALF_DAY"],
      },
      weekOffId: {
        type: Types.ObjectId,
        ref: "WeekOffTemplate",
      },
      weekOffType: {
        type: String,
        enum: ["FULL_DAY", "HALF_DAY"],
      },
    },

    /**
     * SHIFT SNAPSHOT (VERY IMPORTANT)
     */
    shift: {
      shiftId: {
        type: Types.ObjectId,
        ref: "Shift",
      },
      type: {
        type: String,
        enum: ["FIXED_SHIFT", "OPEN_SHIFT"],
      },

      startTime: Date,
      endTime: Date,

      breakAllowedMinutes: Number,

      totalWorkingMinutes: Number,
      minHalfDayMinutes: Number,
      minFullDayMinutes: Number,
    },

    /**
     * RAW PUNCH DATA
     */
    punches: [punchSchema],

    /**
     * SESSION BASED RESULT
     */
    sessions: [sessionSchema],

    /**
     * FINAL DAY RESULT (DERIVED)
     */
    finalStatus: {
      type: String,
      enum: ATTENDANCE_DAY_TYPE,
    },

    /**
     * WORK CALCULATION
     */
    work: {
      totalWorkedMinutes: Number,
      totalWorkingMinutes: Number,

      lateByMinutes: Number,
      earlyExitMinutes: Number,
      extraBreakMinutes: Number,
      earlyOvertimeMinutes: Number,
      afterOvertimeMinutes: Number,
    },

    /**
     * PENALTIES
     */
    penalties: [
      {
        fineId: {
          type: Types.ObjectId,
          ref: "Fine",
        },
        snapshot: penaltySchema,
      },
    ],

    /**
     * EARNINGS (OT / COMPOFF)
     */
    earnings: [
      {
        overtimeId: {
          type: Types.ObjectId,
          ref: "Overtime",
        },
        snapshot: earningSchema,
      },
    ],

    /**
     * PAY LOGIC
     */
    pay: {
      payableDays: {
        type: Number, // 1, 0.5, 0
      },

      payType: {
        type: String,
        enum: PAY_TYPE,
      },
    },

    /**
     * LINKING
     */
    leaveApplicationId: {
      type: Types.ObjectId,
      ref: "LeaveApplication",
    },

    decisionSource: {
      type: String,
      enum: [
        "AUTO_PUNCH",
        "AUTO_LEAVE",
        "AUTO_WEEKOFF",
        "AUTO_HOLIDAY",
        "AUTO_ABSENT",
        "MANUAL_OVERRIDE",
      ],
    },

    isLocked: {
      type: Boolean,
      default: false,
    },

    isProcessed: {
      type: Boolean,
      default: false,
    },

    remark: String,

    /**
     * AUDIT
     */
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

/**
 * UNIQUE CONSTRAINT
 */
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default model("DailyAttendance", attendanceSchema);
