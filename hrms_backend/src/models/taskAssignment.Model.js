import mongoose from 'mongoose';


const {Schema,model,Types}=mongoose;

const taskAssignmentSchema = new Schema({
  title:{
    type:String,
    required:true
  },
  description:{
    type:String,
    required:true
  },
  assigned_by_user_id: {
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assigned_to_employee_id: {
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  },
  proof: {
    type: [Object],
    default: [],
  },
  TAT: {
    type: Number,
    required: true,
  },
  deadline: {
    type: Date,
    required: true,
  },
  timerStartTime:{
    type:Date
  },
  status: {
    type: String,
    enum:['Pending','Overdue','Completed','Reversed'],
    default: 'Pending',
  },
  timer_status: {
    type: String,
    enum: ['Todo', 'InProgress', 'Stuck', 'Done'],
    default: 'Todo',
  },
  priority:{
    type:String,
    enum:['High','Medium','Low'],
    default:'Low'
  },
  stuck_request:{
    type:Boolean,
    default:false
  },
  stuck_reason:{
    type:String
  },
  previous_TAT:[{
    type:Number
  }],
  department_id: {
    type: Types.ObjectId,
    ref: 'Department',
    required:true
  },
  createdAt:{
    type: Date,
    default: Date.now
  },
  updatedAt:{
    type: Date,
    default: Date.now
  }
});

const TaskAssignment = model('TaskAssignment', taskAssignmentSchema);

export default TaskAssignment;