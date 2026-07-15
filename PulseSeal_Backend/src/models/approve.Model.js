import mongoose from 'mongoose';

const {Schema,model,Types}=mongoose;


const approveSchema=new Schema({
    taskAssignId:{
        type: Types.ObjectId,
        ref:'TaskAssignment',
        required:true,
        unique:true
    },
    comment:{
        type:String,
    },
    reason:{
        type:String
    },
    signalColor:{
      type:String,
      enum:['Red','Yellow','Green']
    },
    status:{
        type:String,
        enum:['Approved','Rejected','Pending','Fraud','Reversed'],
        default:'Pending'
    },
    submissionId:{
        type: Types.ObjectId,
        ref:'Submission',
        required:true,
    },
    assignBy:{
        type: Types.ObjectId,
        ref:'User',
        required:true,
    },
    assignTo:{
        type: Types.ObjectId,
        ref:'User',
        required:true,
    },
  //   department_id: {
  //   type: Types.ObjectId,
  //   ref: 'Department',
  // },
  organizationId:{
    type:Types.ObjectId,
    ref:"Organization",
    required:true
  },
},
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, obj) => {
        delete obj.password;
        delete obj.otp;
        return obj;
      },
    },
    toObject: {
      virtuals: true,
    },
  }

)



const Approve =model('Approve',approveSchema);

export default Approve;
