import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const leaveCategorySchema = new Schema(
  {
    categoryName: { type: String, required: true }, // Casual, Sick etc.
    leaveCount: { type: Number, required: true, min: 0 }, // 12
    unusedLeaveRuleType: {
      type: String,
      enum: ["LAPSE", "CARRY", "ENCASH"],
      required: true,
    },
    unusedLeaveCount: Number, // it is carryforward and encashable leave count when type lapse then it will be null
    type: {
      type: String, // LEAVE
      required: true,
    },
  },
  { _id: true },
);

const leaveTemplateSchema = new Schema(
  {
    organizationId: {
      type: Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: { type: String, required: true }, // "Standard Leave Template"
    cycleType: {
      type: String,
      enum: ["YEARLY", "MONTHLY"],
      required: true,
    },
    startDate: { type: Date, required: true }, // for year (2026-01-01) or for month (2026-01-01)
    endDate: { type: Date, required: true }, // for year (2026-12-31) or for month (2026-01-31)
    leaveCategories: [leaveCategorySchema],
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

leaveTemplateSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export const LeaveTemplate = model("LeaveTemplate", leaveTemplateSchema);
