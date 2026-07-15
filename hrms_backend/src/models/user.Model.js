import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema, model,Types } = mongoose;

const userSchema = new Schema(
  {

    departmentId: [{
      type: Types.ObjectId,
      ref: 'Department',
      index: true,
    }],
    organizationId:{
      type: Types.ObjectId,
      ref: 'Organization',
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber:{
      type:Number,
      required:true
    },
    otp: {
      type: String,
      default: null,
      select: false, 
    },
    isActive:{
      type:Boolean,
      default:true
    },
    isFreezed:{
      type:Boolean,
      default:false
    },
    is_organizer:{
      type:Boolean,
      default:false
    },
    is_superuser:{
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    faceImages: {
      type: [String], 
      default: [],
    },
    recognitionFaceIds: {
      type: [String], 
      select: false,
      default: [],
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
);


// userSchema.index({ email: 1 }, { unique: true });


userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = model('User', userSchema);

export default User;
