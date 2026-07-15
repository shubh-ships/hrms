import Submission from "../models/submission.Model.js";

export const createSubmission = async (submissionData) => {
    const taskAssignment = new Submission(submissionData);
    return await taskAssignment.save();
}

export const getSubmissionsByUserId = async (userId) => {
    return await Submission.find({ submitted_by_user_id: userId })
}

export const getSubmissionByAssignmentId = async(assignId)=>{
    return await Submission.findOne({task_assign_id:assignId});
}

export const getDepartmentAllSubmissions = async (department_id) => {
    return await Submission.find({ department_id })
}

export const getSubmissionById = async (id) => {
    return await Submission.findById(id)  
}

export const updateSubmission = async (id, updateData) => {
    return await Submission.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
    }) 
}
export const deleteSubmission = async (id) => {
    return await Submission.findByIdAndDelete(id);
}
    



