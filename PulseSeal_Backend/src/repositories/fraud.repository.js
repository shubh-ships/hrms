import FraudDetection from '../models/fraudDetection.Model.js';

export const FraudRepo = {
  async isDuplicateEntry(userId, fraudType, assignmentId) {
    return await FraudDetection.findOne({
      user_id: userId,
      fraudType,
      assignmentId,
    });
  },
  async logFraud(userId, fraudType, assignmentId,organization_id) {
    const exists = await this.isDuplicateEntry(userId, fraudType, assignmentId);
    if (!exists) {
      return await FraudDetection.create({
        user_id: userId,
        fraudType,
        assignmentId,
        organization_id
      });
    }
    return exists;
  },
};

export const fraudDetailBytaskAssignId = async(taskAssignId) => {
    return await FraudDetection.findOne({assignmentId:taskAssignId});
}

export const removeFraudFlagBytaskAssignId = async(taskAssignId) => {
  return await FraudDetection.findOneAndDelete({assignmentId:taskAssignId});
};

export const listFraudsbyOrgId = async (id) => {
    return await FraudDetection.find({organization_id:id})
    .populate("user_id","name")
    .populate("assignmentId","title");
}

export const listDepartmentFrauds = async(assignableUserIds,organizationId)=>{
    return await FraudDetection.find({
    user_id: { $in: assignableUserIds },
    organization_id: organizationId, 
  })
    .populate("user_id", "name email")
    .populate("assignmentId", "title deadline TAT") 
    .lean();
}

export const cleanFraudByFraudId = async(id,data)=>{
    return await FraudDetection.findByIdAndUpdate(id,data);
}

export const fraudDetailById = async(id)=>{
    return await FraudDetection.findById(id);
}
