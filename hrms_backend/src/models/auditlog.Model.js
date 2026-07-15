import mongoose from "mongoose";

const { Schema,Types,model } = mongoose;

const auditLogSchema = new Schema({
  organizationId: {
    type: Types.ObjectId,
    ref: "Organization",
    required: true,
    index: true
  },
  entity: {
    type: String,
    required: true,
    enum: ["Employee", "Payroll", "Leave", "SalarySlip"]
  },
  entityId: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: ["create", "update", "delete"]
  },
  changedBy: {
    type: Types.ObjectId,
    ref: "User",
    required: true
  },
  oldValue: {
    type: Types.Mixed 
  },
  newValue: {
    type: Types.Mixed 
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

auditLogSchema.index({ organizationId: 1, entity: 1, entityId: 1, timestamp: -1 });

export const AuditLog = model("AuditLog", auditLogSchema);
