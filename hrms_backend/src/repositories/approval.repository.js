import Approve from "../models/approve.Model.js";
import * as attendanceServices from '../services/attendance.service.js';

export const approveTask = async(approvalData)=>{
    return await Approve.create(approvalData);
}
export const approvalById = async(id)=>{
    return await Approve.findById(id)
    .populate('assignBy',"name")
    .populate('assignTo',"name")
    .populate('submissionId',"submission_data reason ETAT comment")
    .populate({
      path: "taskAssignId",
      select:"department_id title TAT status timer_status",
      populate: {
        path: "department_id",
        select: "name", 
      },
    })
}
export const approvalsByUserId = async(userId)=>{
    return await Approve.find({assignTo:userId})
    .populate('assignBy',"name")
    .populate('assignTo',"name")
    .populate('submissionId',"submission_data reason ETAT comment")
    .populate({
      path: "taskAssignId",
      select:"department_id title TAT status timer_status",
      populate: {
        path: "department_id",
        select: "name", 
      },
      
  })
}

export const todayApprovalsByUserId = async(userId,startOfDay,endOfDay)=>{
    return await Approve.find({
        assignTo:userId,
        createdAt: {
            $gte: startOfDay,
            $lte: endOfDay
        }
    })
    .populate('assignBy',"name")
    .populate('assignTo',"name")
    .populate('taskAssignId',"title")
}

export const approvalsByAssignedById = async(assignById)=>{
    return await Approve.find({assignBy:assignById})
    .populate('assignBy')
    .populate('assignTo')
    .populate('submissionId')
    .populate('taskAssignId');
}
export const departmentAllApprovals = async(dep_id)=>{
    return await Approve.find({department_id:dep_id})
    .populate('assignBy',"name")
    .populate('assignTo',"name")
    .populate('taskAssignId',"title")
    .populate('department_id',"name")
}
export const allApprovals = async()=>{
    return await Approve.find();
}
export const approvalBySubmissionId = async(sub_id)=>{
    return await Approve.findOne({submissionId:sub_id});
}
export const updateApproval = async(id,updatedData)=>{
    return await Approve.findByIdAndUpdate(id,updatedData);
}
export const deleteApproval = async(id)=>{
    return await Approve.findByIdAndDelete(id);
}
export const requestForApproval = async(approvalData)=>{
    return await Approve.create(approvalData);
}