import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const leaveBalanceCategorySchema = new Schema(
  {
    categoryId: {
      type: Types.ObjectId,
      required: true,
    },

    categoryName: { type: String, required: true },

    templateLeaveCount: {
      type: Number,
      default: 0,
    },

    availedLeaves: {
      type: Number,
      default: 0,
    },

    leaveBalance: {
      type: Number,
      default: 0,
    },

    encashableLeaves: {
      type: Number,
      default: 0,
    },

    isCompOffLeave: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const LeaveBalanceSchema = new Schema({
  organizationId: {
    type: Types.ObjectId,
    ref: "Organization",
    required: true,
  },

  employeeId: {
    type: Types.ObjectId,
    ref: "Employee",
    required: true,
    index: true,
  },

  leaveTemplateId: {
    type: Types.ObjectId,
    ref: "LeaveTemplate",
    default: null,
  },

  leaveCategories: [leaveBalanceCategorySchema],

  // totalAccruedLeaves: { type: Number, default: 0 },
  totalAvailedLeaves: { type: Number, default: 0 },
  totalBalancedLeaves: { type: Number, default: 0 },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const StaffLeaveBalance = model("LeaveBalance", LeaveBalanceSchema);
