import mongoose from "mongoose";

const { Schema,Types,model } = mongoose;

const payrollRunSchema = new Schema({
  organizationId: {
    type: Types.ObjectId,
    ref: "Organization",
    required: true,
    index: true
  },
  month: {
    type: Number,
    min: 1,
    max: 12,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  initiatedBy: {
    type: Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "processed", "completed"],
    default: "pending"
  },
  totalEmployees: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

payrollRunSchema.pre("save", function(next) {
  if (this.isModified("status") && this.status === "completed") {
    this.completedAt = new Date();
  }
  next();
});

export const PayrollRun = model("PayrollRun", payrollRunSchema);
