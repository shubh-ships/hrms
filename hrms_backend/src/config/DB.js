import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB=async()=>{
    try{
        console.log()
        const MongoURI=process.env.MONGODB_URL||'mongodb://localhost:27017/pulseseal';
        await mongoose.connect(MongoURI)
        console.log('MongoDB connected successfully')

    }catch(e){
        console.log("mongo connection failed",e);
        process.exit(1)
    }
}


export default connectDB;
