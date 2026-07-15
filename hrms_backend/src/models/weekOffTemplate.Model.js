import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const weekOffRuleSchema = new Schema(
  {
    weekNumber: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    type: {
      type: String,
      enum: ["FULL_DAY", "HALF_DAY"],
      default: "FULL_DAY",
    },
  },
  { _id: false },
);

const ruleSchema = new Schema(
  {
    day: {
      type: Number,
      min: 0, // Sunday
      max: 6, // Saturday
      required: true,
    },
    weekOffs: [weekOffRuleSchema],
  },
  { _id: false },
);

const weeklyOffTemplateSchema = new Schema(
  {
    organizationId: {
      type: Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
    },

    rules: [ruleSchema],

    creator: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export const WeeklyOffTemplate = model(
  "WeeklyOffTemplate",
  weeklyOffTemplateSchema,
);
