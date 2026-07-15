import mongoose from 'mongoose';

const {Schema,model,Types}=mongoose;

const orgUserRoleSchema = new Schema({
  access_type: {
    type: String,
    enum: ['ADMIN', 'MODERATOR','GUEST'],
    default: 'ADMIN',
  },
  org_id: {
    type: Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  user_id: {
    type: Types.ObjectId,
    ref: 'User',
    required: true
  },
  user_profile_id: {
    type: Types.ObjectId,
    ref: 'UserProfile'
  }
}, { timestamps: true });

const OrgUserRole = model('OrgUserRole', orgUserRoleSchema);

export default OrgUserRole;
