

import mongoose from "mongoose";
 
const { Schema,model,Types } = mongoose;
 
const leaveRuleSchema = new Schema({
  leaveType: { type: String,enum:["Casual Leave","Sick Leave","Privilege Leave","Maternity Leave","Paternity Leave","Marriage Leave","Compensatory Off","Bereavement Leave"],required:true },                 
  quota: { type: Number,required:true },                 
  carryForward: { type: Boolean,default:false },          
  encashable: { type: Boolean,default:false },         
  maxCarryForwardLimit: { type: Number,default:0 },      
  applicableTo: [{ type: String, enum: ["Full-Time","Intern","Probation","Notice"],default:"Probation"}],                         
  frequency: { type: String, enum: ["monthly", "yearly"],default:"yearly"},
}, { _id: false }); 

const weekOffSchema = new Schema(
  {
    day: {
      type: String,
      enum: [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday"
      ],
      required: true
    },
    occurrence: {
      type: [Number]
    }
  },
  { _id: false }
);

const leavePolicySchema = new Schema({
  organizationId: {
    type: Types.ObjectId,
    ref: "Organization",
    required: true,
    index: true
  },
  name: { type: String, required: true },
  description: { type: String },
  rules: [leaveRuleSchema],
  weekOffs: [weekOffSchema],
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
 
leavePolicySchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});
 
export const LeavePolicy = model("LeavePolicy", leavePolicySchema);