import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const holidaySchema = new Schema(
  {
    holidayDate: {
      type: Date,
      required: true,
    },
    holidayName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true },
);

const holidayTemplateSchema = new mongoose.Schema(
  {
    organizationId: {
      type: Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    name: {
      type: String,
      requried: true,
      trim: true,
    },
    StartDate: {
      type: Date,
      requried: true,
    },
    endDate: {
      type: Date,
      requried: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    holidays: [holidaySchema],
  },
  {
    timestamps: true,
  },
);
export const holidayTemplate = model("holidayTemplate", holidayTemplateSchema);
export const Holiday = model("Holiday", holidaySchema);
