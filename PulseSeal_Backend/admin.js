import User from './src/models/user.Model.js'
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';


const createSuperAdmin =async()=>{
     await mongoose.connect('mongodb+srv://nileshpancholi07:nileshnilesh@mern-cluster.77sqg.mongodb.net/pulseseal4', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
    const hashedPassword = await bcrypt.hash("12345678", 10);

    await User.create({
      name: "Vikram Bundela",
      email: "vikram.b@hackingly.in",
      phoneNumber: "8209952296", 
      is_superuser: true,
      password: hashedPassword,
    });
    console.log("user created sucessfully")
}
createSuperAdmin();