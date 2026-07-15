import mongoose from "mongoose";

const { Schema, Types } = mongoose;

const approvalHistorySchema = new Schema(
  {
    approverId: { type: Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      required: true,
    },
    date: { type: Date, default: Date.now },
    remarks: { type: String },
  },
  { _id: false },
);

const leaveSchema = new Schema({
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
  leaveType: {
    type: String,
    // enum: ["casual", "sick", "earned"],
    required: true,
  },
  durationType: {
    type: String,
    enum: ["fullDay", "halfDay"],
    default: "fullDay",
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number, required: true },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "cancelled"],
    default: "pending",
  },
  approvalHistory: [approvalHistorySchema],
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

leaveSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export const Leave = mongoose.model("Leave", leaveSchema);
