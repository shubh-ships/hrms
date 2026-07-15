import  asyncHandler  from '../middlewares/asyncHandler.js';
import * as submissionService from '../services/submission.service.js';
import { successResponse } from '../utils/apiResponse.js';

export const makeSubmission = asyncHandler(async (req, res) => {
  const result = await submissionService.makeSubmission(req);
  return successResponse(res, 'Submission made successfully', result, 201);
});

export const getSubmissionById = asyncHandler(async (req, res) => {
  const result = await submissionService.getSubmissionById(req);
  return successResponse(res, 'Task retrieved successfully', result);
});

export const getSubmissionsByUserId = asyncHandler(async (req, res) => {
  const result = await submissionService.getSubmissionsByUserId(req);
  return successResponse(res, 'Tasks retrieved successfully', result);
});

export const getSubmissionByTaskAssignId = asyncHandler(async (req, res) => {
  const result = await submissionService.getSubmissionByTaskAssignId(req);
  return successResponse(res, 'Tasks retrieved successfully', result);
});

export const getDepartmentAllSubmissions = asyncHandler(async (req, res) => {
  const result = await submissionService.getDepartmentAllSubmissions(req);
  return successResponse(res, 'Tasks retrieved successfully', result);
});

export const updateSubmission = asyncHandler(async (req, res) => {
  const result = await submissionService.updateSubmission(req);
  return successResponse(res, 'Task updated successfully', result);
});

export const deleteSubmission = asyncHandler(async (req, res) => {
  await submissionService.deleteSubmission(req);
  return successResponse(res, 'Task deleted successfully');
});