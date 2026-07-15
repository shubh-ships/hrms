import mongoose from "mongoose";

const { Schema, model } = mongoose;

const overtimeResultSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    shiftTemplateId: {
      type: Schema.Types.ObjectId,
      ref: "ShiftTemplate",
      required: function() {
        return this.source === "AUTOMATION";
      },
    },
    type: {
      type: String,
      enum: ["EARLY_OVERTIME", "LATE_OVERTIME"],
      required: true,
    },
    isWeekOff: {
      type: Boolean,
      default: false,
    },
    isHoliday: {
      type: Boolean,
      default: false,
    },

    ruleId: {
      type: Schema.Types.ObjectId,
      ref: "AutomationRule",
      required: function() {
        return this.source === "AUTOMATION";
      },
    },

    overtimeMinutes: { type: Number, required: true },
    payableMinutes: { type: Number, required: true },

    calculationType: {
      type: String,
      required: true,
      enum: [
        "FIXED_AMOUNT",
        "AMOUNT_PER_HOUR",
        "SALARY_MULTIPLIER",
        "HALF_DAY",
        "FULL_DAY",
        "REGULARIZE",
      ],
    },
    multiplier: {
      type: Number,
      default: 1
    },

    amount: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: { type: Date, default: null },

    source: {
      type: String,
      enum: ["AUTOMATION", "MANUAL"],
      default: "AUTOMATION",
    },
  },
  { _id: true, timestamps: true },
);

export default mongoose.models.Overtime ||
  mongoose.model("Overtime", overtimeResultSchema);
