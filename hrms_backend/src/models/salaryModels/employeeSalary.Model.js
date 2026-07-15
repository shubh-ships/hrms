import mongoose from "mongoose";
const { Schema, model } = mongoose;

const employeeSalarySchema = new Schema(
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

    templateId: {
      type: Schema.Types.ObjectId,
      ref: "SalaryTemplate",
      required: true,
    },

    monthlyCTC: {
      type: Number,
      required: true,
    },

    basic: {
      type: Number,
      required: true,
    },

    specialAllowance: {
      type: Number,
      required: true,
    },

    effectiveFrom: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Only one active salary per employee
employeeSalarySchema.index(
  { employeeId: 1, isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

export const EmployeeSalary = model(
  "EmployeeSalary",
  employeeSalarySchema
);