import * as fraudService from '../services/fraud.service.js';
import { FraudRepo } from '../repositories/fraud.repository.js';
import  asyncHandler  from '../middlewares/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

//TODO:- add clean fraud api for admin and get all frauds api

const isAfter30Seconds = (createdAt, updatedAt) => {
  return new Date(updatedAt) - new Date(createdAt) > 30 * 1000;
};

export async function checkFraudLogicEmployee( userId, proof, assignmentId,organization_id ) {

  const { isFraud, reason, status } = await fraudService.checkFraud(userId, proof, assignmentId,organization_id);

  return {
    fraud: isFraud,
    reason: reason || null,
    status,
    skipped: false,
  };
}

export async function checkFraudLogicManager(userId, assignmentId, createdAt, updatedAt,organization_id) {
  if (!createdAt || !updatedAt) {
    throw new Error('Missing required fields: createdAt, or updatedAt');
  }

  // const skip = !isAfter30Seconds(createdAt, updatedAt);
  if (!isAfter30Seconds(createdAt, updatedAt)) {
  const fraudType = 'Approval within 30 seconds';
  const flagged = await FraudRepo.logFraud(userId, fraudType, assignmentId,organization_id);

  return {
    fraud: flagged ? true : false,
    reason: flagged.fraudType,
    status: flagged.status,
    skipped: false,
  };
}
}

export async function checkManualFraud(userId,assignmentId,reason,organization_id){

   const flagged = await FraudRepo.logFraud(userId,reason,assignmentId,organization_id);

   return {
    fraud: flagged ? true : false,
    reason: flagged.fraudType,
    status: flagged.status,
    skipped: false,
  };
}

export const removeFraudFlag = asyncHandler(async(taskAssignId) => {
  const result = await fraudService.removeFraudFlag(taskAssignId);
  return successResponse(res, 'Fraud Removed successfully', result, 200);
})

export const listAllFrauds = asyncHandler(async (req, res) => {
  const result = await fraudService.listAllFrauds(req);
  return successResponse(res, 'All Frauds fetched successfully', result, 200);
});

export const departmentFrauds = asyncHandler(async (req, res) => {
  const result = await fraudService.departmentFrauds(req,res);
  return successResponse(res, 'department Frauds fetched successfully', result, 200);
});

export const cleanFraud = asyncHandler(async (req, res) => {
  const result = await fraudService.cleanFraud(req);
  return successResponse(res, 'Fraud cleaned successfully', result, 200);
});

export const fraudDetail = asyncHandler(async (req, res) => {
  const result = await fraudService.fraudDetail(req);
  return successResponse(res, 'Fraud fetched successfully', result, 200);
});
