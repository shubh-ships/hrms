import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: {
      type: Types.ObjectId,
      ref: "User", 
      required: true,
    },
    sender: {
      type: Types.ObjectId,
      ref: "User", 
    },
    type: {
      type: String,
      enum: [
        "LOGIN",
        "LOGOUT",
        "TASK_ASSIGNED",
        "TASK_SUBMITTED",
        "TASK_OVERDUE",
        "TASK_APPROVED",
        "TASK_REJECTED",
        "DAY_END_SUBMISSION",
        "FRAUD_FLAGGED",
      ],
      required: true,
    },
    message: {
      type: String, 
      required: true,
    },
    meta: {
      type: Object, 
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Notification = model("Notification", notificationSchema);
export default Notification;
