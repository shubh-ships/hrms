import mongoose from 'mongoose';

const {Schema,model,Types}=mongoose;

const reasonSchema = new Schema({
  message: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  isValid: {
    type: Boolean,
    default: false
  }
}, { _id: false }); 


const submissionSchema = new Schema({
  // department_id: {
  //   type: Types.ObjectId,
  //   ref: 'Department',
  //   required:true
  // },
  organizationId:{
    type:Types.ObjectId,
    ref:"Organization",
    required:true
  },
  submitted_by_user_id: {
    type:Types.ObjectId,
    ref: 'User',
    required:true
  },
  task_assign_id: {
    type:Types.ObjectId,
    ref: 'TaskAssignment',
    required:true
  },
  // submission_data: {
  //   type: Object,
  // },
  submission_data: {
    type: Array, 
    default: [],
  },
  comment:{
    type:String
  },
  reason:{
    type:reasonSchema
  },
  ETAT:{
    type:Number,
    default:0
  }
}, { timestamps: true });

const Submission = model('Submission', submissionSchema);

export default Submission;