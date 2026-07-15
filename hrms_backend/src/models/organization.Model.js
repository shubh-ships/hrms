import mongoose from 'mongoose';

const {Schema,model}=mongoose;

const organizationSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: { 
    type: String,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  is_verified: {
    type: Boolean,
    default: false,
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  country: {
    type: String,
  },
  phone_number: {
    type: String,
  },
  email: {
    type: String,
  },
  website: {
    type: String,
  },
  social_links: {
  type: [Schema.Types.Mixed], // or simply [Object]
  default: []
  },
  org_photo: {
    type:{
        public_id:String,
        url:String
      },
    required:false
  },
  member_count: {
    type: Number,
    default: 1,
  },
  company_name:{
    type: String,
  },
  isHRMS_enabled: {
    type: Boolean,
    default: false,
  },
  isTaskManagement_enabled: {
    type: Boolean,
    default: false,
  },
  org_alias: {
    type: String,
    unique: true,
    required: [true, 'Organization alias is required'],
    trim: true,
  },
}, { timestamps: true });

const Organization = model('Organization', organizationSchema);

export default Organization;