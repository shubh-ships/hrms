import mongoose from 'mongoose';
const { Schema, model,Types } = mongoose;

const efficiencySchema = new Schema({
    userId:{
        type:Types.ObjectId,
        ref:'User',
        required:true
    },
    loginTime:{
        type:Date
    },
    logoutTime:{
        type:Date
    },
    attendance:{
        type:Boolean,
        default:false,

    },
    sealTime:{
        type:Date,
    }
    
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
  
const Efficiency = model('efficiency',efficiencySchema);

export default Efficiency;