import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const attendanceSchema = new Schema({
  loginTime: {
    type: Date,
  },
  logoutTime: {
    type: Date,
  },
  sealTime: {
    type: Date,
  },
  userId: {
    type: Types.ObjectId,
    ref: "User",
    required: true,
  },
  monthId: {
    type: Types.ObjectId,
    ref: "TotalWorkingDays",
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
});

const Attendance = model("Attendance", attendanceSchema);

export default Attendance;
