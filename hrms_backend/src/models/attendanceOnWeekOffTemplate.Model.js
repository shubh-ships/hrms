import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const attendanceOnWeeklyOffTemplateSchema = new Schema(
  {
    organizationId: {
      type: Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    attendanceOnWeekOffType: {
      type: String,
      enum: [
        "REGULAR_PAYABLE_DAY",
        "OVERTIME",
        "COMP_OFF",
      ],
      required: true,
    },
    compensationType: {
      type: String,
      enum: ["SALARY_MULTIPLIER", "FIXED_AMOUNT"], //null while comm off
    },
    compensationValue: Number, //null while comm off
    creator: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    disableAutomationRules: {
      type: Boolean,
      default: false,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

attendanceOnWeeklyOffTemplateSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export const AttendanceOnWeeklyOffTemplate = model(
  "AttendanceOnWeeklyOffTemplate",
  attendanceOnWeeklyOffTemplateSchema,
);
