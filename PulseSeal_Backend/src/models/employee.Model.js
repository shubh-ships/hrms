import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
    index: true,
  },
  shiftTemplateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ShiftTemplate",
    required: true,
  },
  holidayTemplateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "holidayTemplate",
  },
  leaveTemplateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LeaveTemplate",
  },
  weeklyOffTemplateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WeeklyOffTemplate",
  },
  attendanceOnWeeklyOffTemplateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AttendanceOnWeeklyOffTemplate",
  },
  attendanceOnHolidayTemplateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AttendanceOnHolidayTemplate",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  personal: {
    firstName: { type: String, required: true },
    lastName: { type: String },
    dob: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    maritalStatus: { type: String, enum: ["single", "married", "divorced"] },
    phone: { type: String, required: true },
    email: { type: String },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
    },
  },

  employment: {
    employeeCode: { type: String, required: true, index: true },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    userRoleTableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserRoleTable",
      required: true,
    },
    joinDate: { type: Date, required: true },
    exitDate: { type: Date },
    status: {
      type: String,
      enum: ["active", "inactive", "terminated"],
      default: "active",
    },
    employeeType: {
      type: String,
      enum: ["REGULAR", "CONTRACTUAL"],
      required: true,
    },
    workLocation: { type: String },
    workType: {
      type: String,
      enum: ["Full-Time", "Intern", "Probation", "Notice"],
      default: "Probation",
    },
  },

  bank: {
    accountHolderName: String,
    accountNumber: String,
    ifsc: String,
    bankName: String,
    branch: String,
  },

  documents: [
    {
      type: {
        type: String,
        enum: ["aadhaar", "pan", "passport", "others"],
        required: true,
      },
      name: String,
      number: String,
      proof: {
        public_id: String,
        url: String,
      },
      verified: { type: Boolean, default: false },
      updatedAt: { type: Date, default: Date.now },
    },
  ],
  salary: [
    {
      type: {
        type: String,
        enum: ["basic", "hra", "allowance", "deduction"],
        required: true,
      },
      label: { type: String, required: true },
      amount: { type: Number, required: true },
    },
  ],
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

employeeSchema.index({ organizationId: 1, employeeCode: 1 });
employeeSchema.index({ organizationId: 1, userId: 1 });

export default mongoose.model("Employee", employeeSchema);
