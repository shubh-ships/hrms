import mongoose from 'mongoose';

const {Schema,model,Types}= mongoose;

const departmentSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  is_verified: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
  },
  organizationId: {
    type: Types.ObjectId,
    ref: 'Organization',
  },
  // admin_id: {
  //   type: Types.ObjectId,
  //   ref: 'User',
  // },
  alias: {
    type: String,
    required: [true, 'Department alias is required'],
    unique: true,
  },
  category: {
    type: String,
  },
}, { timestamps: true });

const Department = model('Department', departmentSchema);

export default Department;