import mongoose from "mongoose";

const { Types, Schema, model } = mongoose;

const ShiftSchema = new Schema({
  name: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  breaks: [
    {
      name: { type: String, required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
    },
  ],
  minFullDayMinutes: { type: Number, required: true },
  minHalfDayMinutes: { type: Number, required: true },
  lateGraceMinutes: { type: Number, required: true },
  earlyGraceMinutes: { type: Number, required: true },
});

const OfficeSchema = new Schema(
  {
    organizationId: {
      type: Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    shifts: [ShiftSchema],
  },
  { timestamps: true },
);

export const Office = model("Office", OfficeSchema);
