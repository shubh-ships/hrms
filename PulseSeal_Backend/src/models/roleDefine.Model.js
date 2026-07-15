import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const roleDefinitionSchema = new Schema({
  roleName: { type: String, required: true, },   
  hierarchyLevel: { type: Number },    
  hierarchyLevel: { type: Number },    
  organizationId:{type:Types.ObjectId,
    ref:'Organization',
    require:true
  },        
    permissions: [{
    type: String,
    enum: [
      "TASK_ASSIGNMENT",
      "TASK_VIEW",
      "WORKING_DAYS",
      "CREATE_USER",
      "CREATE_DEPARTMENT",
      "COMMON_PERMISSION" ,
      "BASIC_HRMS",
      "APPROVAL_LEAVE",
      "OFFICE_MANAGEMENT"
    ]
  }]
}, { timestamps: true });

roleDefinitionSchema.index(
  { roleName: 1, organizationId: 1 },
  { unique: true }
);

const RoleDefinition = model('RoleDefinition', roleDefinitionSchema);

export default RoleDefinition;
