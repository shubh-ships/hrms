import mongoose from "mongoose";
const { Schema, model } = mongoose;

const salaryTemplateSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    staffType: {
      type: String,
      enum: ["REGULAR", "CONTRACTUAL"],
      default: "REGULAR",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default model("SalaryTemplate", salaryTemplateSchema);