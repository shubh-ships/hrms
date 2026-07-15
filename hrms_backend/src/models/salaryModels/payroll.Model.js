import mongoose from "mongoose";
const { Schema, model } = mongoose;

const payrollSchema = new Schema(
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
      index: true,
    },

    salaryId: {
      type: Schema.Types.ObjectId,
      ref: "EmployeeSalary",
      required: true,
    },

    month: {
      type: Number,
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    // FIXED SNAPSHOT
    monthlyCTC: Number,
    basic: Number,
    specialAllowance: Number,

    // ATTENDANCE BASED
    totalDays: Number,
    payableDays: Number,

    // VARIABLE
    overtimeAmount: {
      type: Number,
      default: 0,
    },

    fineAmount: {
      type: Number,
      default: 0,
    },

    // FINAL
    grossSalary: Number,
    totalDeductions: Number,
    netSalary: Number,

    status: {
      type: String,
      enum: ["DRAFT", "PROCESSED", "PAID"],
      default: "DRAFT",
    },

    processedAt: Date,
  },
  { timestamps: true }
);

// unique payroll per employee per month
payrollSchema.index(
  { employeeId: 1, month: 1, year: 1 },
  { unique: true }
);

export const Payroll = model("Payroll", payrollSchema);