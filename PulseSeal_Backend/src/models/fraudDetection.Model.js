import mongoose from 'mongoose';
const {Schema,model,Types}=mongoose;


const fraudDetectionSchema = new Schema({
    user_id:{
        type:Types.ObjectId,
        ref:'User',
        required:true
    },
    fraudType:{
        type:String,
        required:true
    },
    status:{
        type:String,
        enum:['Flagged','Suspicious','Clean'],
        default:'Flagged'
    },
    assignmentId:{
        type:Types.ObjectId,
        ref:"TaskAssignment"
    },
    // departmentId:{
    //     type:Types.ObjectId,
    //     ref:"Department"
    // },
    organization_id:{
        type:Types.ObjectId,
        ref:"Organization",
        required:true
    }
}, {
    timestamps: true,
    versionKey: false,
  }

)


const FraudDetection=model("FraudDetection",fraudDetectionSchema);

export default FraudDetection;