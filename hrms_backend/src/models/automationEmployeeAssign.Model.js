import mongoose from "mongoose";

const { Schema, model } = mongoose;

const employeeAutomationAssignmentSchema = new Schema(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee", // adjust based on your employee model name
      required: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: "AutomationRule", // reference to your AutomationRuleTemplate model
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["late_fine", "early_out", "break", "overtime", "early_overtime"],
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// Ensure one employee cannot have two templates of the same type
employeeAutomationAssignmentSchema.index(
  { employeeId: 1, type: 1 },
  { unique: true },
);

// Pre-save hook to populate type from template and validate existence
employeeAutomationAssignmentSchema.pre("validate", async function (next) {
  if (this.isNew || this.isModified("templateId")) {
    const template = await mongoose
      .model("AutomationRule")
      .findById(this.templateId)
      .lean();
    if (!template) {
      return next(new Error("Template not found"));
    }
    // Set the denormalized type
    this.type = template.type;
  }
  next();
});

export const EmployeeAutomationAssignment = model(
  "EmployeeAutomationAssignment",
  employeeAutomationAssignmentSchema,
);
