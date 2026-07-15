import mongoose, { model } from "mongoose";

const { Schema } = mongoose;

const fineResultSchema = new Schema(
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
      required: true,
    },
    type: {
      type: String,
      enum: ["LATE_ENTRY", "EARLY_EXIT", "BREAK_VIOLATION"],
      required: true,
    },

    ruleId: {
      type: Schema.Types.ObjectId,
      ref: "AutomationRule",
      required: true,
    },

    violationMinutes: { type: Number, required: true }, // means how much time employee late depends on includegrace minute field if true then grace minute also include in this field if false then only above grace minutes come in this field  
    deductionMinutes : { type: Number, required: true }, // means how much time of employee amount will deduct

    calculationType: {
      type: String,
      required: true,
      enum: [
        "FIXED_AMOUNT",
        "AMOUNT_PER_MINUTE",
        "HALF_DAY",
        "FULL_DAY",
        "PARDON",
      ],
    },
    multiplier:{
      type:Number,
      default:1
    },

    amount: { type: Number, default: 0 }, // it is original amount which will be deduct according to calculation value and fixed amount also come in this directly

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

export default model("Fine", fineResultSchema);
