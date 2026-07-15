import Policy from "../models/policy.Model.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";

export const createOrUpdatePolicy = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;
  const {
    name,
    penliteRules,
    overtimeRules,
    calculationType,
    addGraceMinutesToOvertime,
    includeEarlyOTFromStartTime,
    description,
  } = req.body;

  const validPolicies = [
    "late_entry",
    "early_leave",
    "breaks",
    "overtime",
    "early_overtime",
  ];
  
  if (!validPolicies.includes(name)) {
    throw new ApiError(400, "Invalid policy name");
  }

  if (["late_entry", "early_leave", "breaks"].includes(name)) {
    if (
      !penliteRules ||
      !Array.isArray(penliteRules) ||
      penliteRules.length === 0
    ) {
      throw new ApiError(400, "Penlite rules are required for this policy type");
    }
  } else if (["overtime", "early_overtime"].includes(name)) {
    if (
      !overtimeRules ||
      !Array.isArray(overtimeRules) ||
      overtimeRules.length === 0
    ) {
      throw new ApiError(400, "Overtime rules are required for this policy type");
    }
  }

  if (name === "overtime" && !calculationType) {
    throw new ApiError(400, "Calculation type is required for overtime policy");
  }

  let policyData = {
    name,
    organizationId,
    description: description || "",
    createdBy: req.user._id,
    isActive: true,
  };

  if (["late_entry", "early_leave", "breaks"].includes(name)) {
    policyData.penliteRules = penliteRules;
  } else if (name === "overtime") {
    policyData.overtimeRules = overtimeRules;
    policyData.calculationType = calculationType;
    policyData.addGraceMinutesToOvertime = addGraceMinutesToOvertime || false;
  } else if (name === "early_overtime") {
    policyData.overtimeRules = overtimeRules;
    policyData.includeEarlyOTFromStartTime = includeEarlyOTFromStartTime || false;
  }

  let policy = await Policy.findOne({
    name,
    organizationId,
  });

  if (policy) {
    policy = await Policy.findByIdAndUpdate(
      policy._id,
      { $set: policyData },
      { new: true, runValidators: true }
    );
  } else {
    policy = new Policy(policyData);
    await policy.save();
  }

  successResponse(res, "Policy saved successfully", policy);
});

export const getPolicy = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;
  const { id } = req.params;

  const policy = await Policy.findOne({
    _id: id,
    organizationId,
    isActive: true,
  });

  if (!policy) {
    throw new ApiError(404, "Policy not found");
  }

  successResponse(res, "Policy fetched successfully", policy);
});

export const getOrganizationPolicies = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;

  const policies = await Policy.find({
    organizationId,
    isActive: true,
  });

  successResponse(res, "Policies fetched successfully", policies);
});

export const togglePolicyStatus = asyncHandler(async (req, res) => {
  const { policyId } = req.params;
  const { isActive } = req.body;

  const policy = await Policy.findByIdAndUpdate(
    policyId,
    { isActive },
    { new: true }
  );

  if (!policy) {
    throw new ApiError(404, "Policy not found");
  }

  successResponse(res, "Policy status updated successfully", policy);
});