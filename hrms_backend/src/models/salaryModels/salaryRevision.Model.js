import mongoose from "mongoose";
const { Schema, model } = mongoose;

const salaryRevisionSchema = new Schema(
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

    salaryId: {
      type: Schema.Types.ObjectId,
      ref: "EmployeeSalary",
    },

    oldCTC: Number,
    newCTC: Number,

    oldBasic: Number,
    newBasic: Number,

    oldSpecialAllowance: Number,
    newSpecialAllowance: Number,

    percentageChange: Number,

    effectiveFrom: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

export const SalaryRevision = model(
  "SalaryRevision",
  salaryRevisionSchema
);