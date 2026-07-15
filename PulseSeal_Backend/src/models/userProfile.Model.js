import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;


const educationSchema = new Schema(
  {
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    grade: { type: String },
    description: { type: String },
  },
  { _id: false } 
);

const jobSchema = new Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    location: { type: String },
    description: { type: String },
    isCurrent: { type: Boolean, default: false },
  },
  { _id: false }
);


const userProfileSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      required: [true, 'User ID is required'],
      ref: 'User',
      index: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      lowercase: true,
    },
    profilePicture: {
      type:{
        public_id:String,
        url:String
      },
      required:false
    },
    coverPicture: {
      type:{
        public_id:String,
        url:String
      },
      required:false
    },
    country: {
      type: String,
      default: null,
      trim: true,
    },
    city: {
      type: String,
      default: null,
      trim: true,
    },
    address: {
      type: String,
      default: null,
      trim: true,
    },
    pincode: {
      type: String,
      default: null,
      trim: true,
    },
    linkedin: {
      type: String,
      default: null,
      trim: true,
    },
    education: {
      type: [educationSchema],
      default: [],
    },
    jobs: {
      type: [jobSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default model('UserProfile', userProfileSchema);
