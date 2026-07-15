import mongoose from "mongoose";
const { Schema, model } = mongoose;

const salaryActionSchema = new Schema(
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

    type: {
      type: String,
      enum: ["EARNING", "DEDUCTION", "PAYMENT"], // PAYMENT for Advance Payment
      required: true,
    },

    category: {
      type: String,
      required: true,
      // Examples: Allowance, Bonus, Deduction, Advance
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      default: "",
    },

    entryDate: {
      type: Date,
      default: Date.now,
    },

    month: {
      type: Number,
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Index for fetching actions for a specific payroll month
salaryActionSchema.index({ employeeId: 1, month: 1, year: 1 });

export const SalaryAction = model("SalaryAction", salaryActionSchema);
