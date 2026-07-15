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

export default mongoose.models.SalaryTemplate ||
  mongoose.model("SalaryTemplate", salaryTemplateSchema);

const salaryTemplateComponentSchema = new Schema(
  {
    templateId: {
      type: Schema.Types.ObjectId,
      ref: "SalaryTemplate",
      required: true,
    },

    name: {
      type: String, // Basic, Special Allowance
      required: true,
    },

    code: {
      type: String, // BASIC, SPECIAL_ALLOWANCE
      required: true,
    },

    type: {
      type: String,
      enum: ["FIXED", "RESIDUAL"],
      required: true,
    },

    isEditable: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const SalaryTemplateComponent = model(
  "SalaryTemplateComponent",
  salaryTemplateComponentSchema
);