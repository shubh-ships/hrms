import InterestPreset from '../models/LoanInterestPreset.Model.js';
import ApiError from '../utils/apiError.js';
import { successResponse } from '../utils/apiResponse.js';
import asyncHandler from '../middlewares/asyncHandler.js';

export const createInterestPreset = asyncHandler(async (req, res) => {
  const { name, interestRate, interestType } = req.body;
  const {organizationId} = req.user;
  
  const existingPreset = await InterestPreset.findOne({ name });
  if (existingPreset) {
    throw new ApiError(400, 'Interest preset with this name already exists');
  }

  const preset = await InterestPreset.create({
    name,
    organizationId,
    interestRate,
    interestType,
    createdBy: req.user._id
  });

  successResponse(res, 'Interest preset created successfully', preset);
});

// Get all interest presets
export const getInterestPresets = asyncHandler(async (req, res) => {
  const {organizationId} = req.user;
  const presets = await InterestPreset.find({ isActive: true,organizationId })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  successResponse(res, 'Interest presets fetched successfully', presets);
});

// Update interest preset (Admin only)
export const updateInterestPreset = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const preset = await InterestPreset.findById(id);
  if (!preset) {
    throw new ApiError(404, 'Interest preset not found');
  }

  if (updateData.name && updateData.name !== preset.name) {
    const existingPreset = await InterestPreset.findOne({ 
      name: updateData.name, 
      _id: { $ne: id } 
    });
    if (existingPreset) {
      throw new ApiError(400, 'Interest preset with this name already exists');
    }
  }

  Object.assign(preset, updateData);
  await preset.save();

  successResponse(res, 'Interest preset updated successfully', preset);
});

// Delete interest preset (Admin only - soft delete)
export const deleteInterestPreset = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const preset = await InterestPreset.findById(id);
  if (!preset) {
    throw new ApiError(404, 'Interest preset not found');
  }

  preset.isActive = false;
  await preset.save();

  successResponse(res, 'Interest preset deleted successfully');
});