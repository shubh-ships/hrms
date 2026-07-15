import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

// Sub-schema for daily leave records (denormalized for quick view)
const leaveRecordSchema = new Schema(
  {
    leaveDate: { type: Date, required: true },
    session: {
      type: String,
      enum: ["SESSION_1", "SESSION_2", null],
      default: null,
    },
    leaveType: { type: String, enum: ["leave", "sandwich"], default: "leave" },
    leaveCategoryId: { type: Types.ObjectId, required: true },
    leaveCategoryName: String,
  },
  { _id: true },
);

const leaveApplicationSchema = new Schema(
  {
    organizationId: {
      type: Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
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
      default: null
    },
    leaveCategoryId: {
      type: Types.ObjectId,
      default: null,
      // This refers to the _id of a leave category inside a LeaveTemplate
      // (assumes leave categories have _id enabled)
    },
    leaveCategoryName: { type: String, required: true }, // denormalized

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    fromSession: {
      type: String,
      enum: ["SESSION_1", "SESSION_2"],
      default: null,
    },
    toSession: {
      type: String,
      enum: ["SESSION_1", "SESSION_2"],
      default: null,
    },

    description: { type: String, default: "" },
    isCompOffLeave: { type: Boolean, default: false },
    shiftId: { type: Types.ObjectId, ref: "Shift", default: null },

    attachments: [
      {
        fileName: String,
        public_id: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
      default: "PENDING",
    },

    appliedBy: { type: Types.ObjectId, ref: "User", required: true },
    appliedAt: { type: Date, default: Date.now },

    approvedBy: { type: Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },

    // Calculated fields (could be set on save)
    leavesAvailed: { type: Number, default: 0 }, // number of leave days
    unpaidLeaveCount: { type: Number, default: 0 },

    // Daily breakdown records
    records: [leaveRecordSchema],
  },
  { timestamps: true }, // adds createdAt and updatedAt automatically
);

// Indexes for common queries
leaveApplicationSchema.index({ staffId: 1, startDate: -1 });
leaveApplicationSchema.index({ organizationId: 1, status: 1 });
leaveApplicationSchema.index({ approvedBy: 1 });

export const LeaveApplication = model(
  "LeaveApplication",
  leaveApplicationSchema,
);
