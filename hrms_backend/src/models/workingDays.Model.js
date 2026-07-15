import mongoose from "mongoose";
 
const {Schema,model,Types}=mongoose
 
const workingDaySchema=new Schema({
    totalWorkingDays:{
        type:Number,
        default:30
    },
    isWeekOffIncludes:{
        type:Boolean,
        default:true
    },
    month:{
        type:String,
        require:true
    },
    year:{
        type:String,
        require:true
    },
    organizationId:{
        type:Types.ObjectId,
         ref: 'Organization',
        require:true
    }
})

workingDaySchema.index({ organizationId: 1, month: 1, year: 1 }, { unique: true });
 
const TotalWorkingDays= model("TotalWorkingDays",workingDaySchema)
 
export default TotalWorkingDays