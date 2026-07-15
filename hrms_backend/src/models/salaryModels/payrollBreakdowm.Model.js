import mongoose from "mongoose";
const { Schema, model } = mongoose;

const payrollBreakdownSchema = new Schema({
  payrollId: {
    type: Schema.Types.ObjectId,
    ref: "Payroll",
  },

  type: {
    type: String,
    enum: ["EARNING", "DEDUCTION"],
  },

  code: String, // BASIC, OVERTIME, FINE
  name: String,

  amount: Number,
  description: String,

});

export const PayrollBreakdown = model(
  "PayrollBreakdown",
  payrollBreakdownSchema
);