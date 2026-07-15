import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const userRoleTableSchema = new Schema(
  {
    user_id: { type: Types.ObjectId, ref: "User", required: true },
    roleDefinitionId: {
      type: Types.ObjectId,
      ref: "RoleDefinition",
      required: true,
    },
    departments: [{ type: Types.ObjectId, ref: "Department", required: true }],
    team: { type: Types.ObjectId, ref: "Team", default: null },
    parentRoleId: { type: Types.ObjectId, ref: "UserRoleTable", default: null },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    history: [
      {
        action: {
          type: String,
          enum: ["assigned", "replaced", "Added", "left"],
        },
        user_id: { type: Types.ObjectId, ref: "User" },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    organizationId: {
      type: Types.ObjectId,
      ref: "Organization",
      required: true,
    },
  },
  { timestamps: true },
);

const UserRoleTable = model("UserRoleTable", userRoleTableSchema);

export default UserRoleTable;
