import mongoose from 'mongoose';

const {Schema,model,Types}= mongoose;

const teamSchema=new Schema({
    name:{
        type:String,
        required:true,
        minlength: [3, "Username must be at least 3 characters long"],
        maxlength: [20, "Username cannot exceed 20 characters"],
        trim: true
    },
    department:{
        type:Types.ObjectId,
        ref:'Department',
        required:'true'
    },
    organizationId:{
        type:Types.ObjectId,
        ref:'Organization',
        required:'true'
    }

})

const Team=model('Team',teamSchema)

export default Team