import mongoose from "mongoose";

const deductionSchema = new mongoose.Schema({
  lateHours: {
    type: Number,
    default: 0,
  },
  lateMinutes: {
    type: Number,
    default: 0,
  },
  deductionType: {
    type: String,
    enum: ["fixed", "multiplier"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
});

const occurrenceSchema = new mongoose.Schema({
  isActive: {
    type: Boolean,
    default: false,
  },
  count: {
    type: Number,
    required: function () {
      return this.isActive && this.hours == null;
    },
  },
  hours: {
    type: Number,
    required: function () {
      return this.isActive && this.count == null;
    },
  },
});

const lateEntryRuleSchema = new mongoose.Schema({
  ruleName: {
    type: String,
    required: true,
  },
  ruleType: {
    type: String,
    enum: ["salary_deduction", "half_day_deduct", "full_day_deduct"],
    required: true,
  },
  lateHoursThreshold: {
    type: Number,
    required: function () {
      return ["half_day_deduct", "half_day_deduct"].includes(this.ruleType);
    },
  },
  lateMinutesThreshold: {
    type: Number,
    required: function () {
      return ["half_day_deduct", "half_day_deduct"].includes(this.ruleType);
    },
  },
  deductions: {
    type: [deductionSchema],
    required: function () {
      return this.ruleType === "salary_deduction";
    },
  },
  occurrence: {
    type: occurrenceSchema,
    default: () => ({}),
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const overtimePaySchema = new mongoose.Schema({
  hours: {
    type: Number,
    required: true,
  },
  minutes: {
    type: Number,
    required: true,
  },
  overtimeType: {
    type: String,
    enum: ["fixed", "multiplier", "fixed_per_hour"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
});

const overtimeRuleSchema = new mongoose.Schema({
  ruleName: {
    type: String,
    required: true,
  },
  ruleType: {
    type: String,
    enum: ["salary_pay", "half_day_pay", "full_day_pay"],
    required: true,
  },
  hoursThreshold: {
    type: Number,
    required: function () {
      return ["half_day_pay", "full_day_pay"].includes(this.ruleType);
    },
  },
  minutesThreshold: {
    type: Number,
    required: function () {
      return ["half_day_pay", "full_day_pay"].includes(this.ruleType);
    },
  },
  overtimePay: {
    type: [overtimePaySchema],
    required: function () {
      return this.ruleType === "salary_pay";
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const policySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: [
        "late_entry",
        "early_leave",
        "breaks",
        "overtime",
        "early_overtime",
      ],
    },
    penliteRules: {
      type: [lateEntryRuleSchema],
      required: function () {
        return ["late_entry", "early_leave", "breaks"].includes(this.name);
      },
    },
    overtimeRules: {
      type: [overtimeRuleSchema],
      required: function () {
        return ["overtime", "early_overtime"].includes(this.name);
      },
    },
    calculationType: {
      type: String,
      enum: [
        "post_payable_hours",
        "post_payable_hours_and_shift_end",
        "post_payable_hours_or_shift_end",
        "shift_end",
      ],
      required: function () {
        return this.name === "overtime";
      },
    },
    addGraceMinutesToOvertime: {
      type: Boolean,
      default: false,
    },
    includeEarlyOTFromStartTime: {
      type: Boolean,
      default: false,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Policy = mongoose.model("Policy", policySchema);

export default Policy;
