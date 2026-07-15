import  asyncHandler  from '../middlewares/asyncHandler.js';
import * as userService from '../services/user.Service.js';
import { successResponse } from '../utils/apiResponse.js';
import { getHierarchyUsersByUserId } from '../services/user.Service.js';
import fs from "fs";

export const registerUser = asyncHandler(async (req, res) => {
  const result = await userService.registerUser(req.body,req.organization._id);
  return successResponse(res, 'User registered successfully', result, 201);
});

export const loginUser = asyncHandler(async (req, res) => {
  const result = await userService.loginUser(req.body,res);
  console.log(req.user);
  return successResponse(res, 'Login successful', result, 200);
  
});

export const getAllUsers=asyncHandler(async(req,res)=>{
    const org_id = req.user.organizationId
    const result =await userService.getAllUsers(org_id);
    return successResponse(res,"users Fetched successfully",result,200)
})

export const getProfile = asyncHandler(async (req, res) => {
  const result = await userService.getProfile(req.user.id); 
  return successResponse(res, 'Profile fetched successfully', result, 200);
});

export const updateProfile=asyncHandler(async(req,res)=>{
    const result = await userService.updateProfile(req);
    return(successResponse(res,"Profile updated successfully",result,200))
})

export const updateUser=asyncHandler(async(req,res)=>{
    const result = await userService.updateUser(req.params.id,req.body);
    return(successResponse(res,"User updated successfully",result,200))
})

export const deleteProfile=asyncHandler(async(req,res)=>{
    const result = await userService.deleteUser(req.params.id);
    return(successResponse(res,"Profile deleted successfully",result,200))
})

export const changePassword=asyncHandler(async(req,res)=>{
    const result = await userService.changePassword(req.user.id,req.body);
    return(successResponse(res,"Password changed successfully",result,200))
})

export const forgetPassword=asyncHandler(async(req,res)=>{
    const result = await userService.forgetPassword(req.body);
    return(successResponse(res,"Otp sent to your email",result,200))
})

export const resetPassword=asyncHandler(async(req,res)=>{
    const result = await userService.resetPassword(req.body);
    return(successResponse(res,"Password reset successfully",result,200))
})

export const verifyOtp=asyncHandler(async(req,res)=>{
    const result = await userService.verifyOtp(req.body);
    return(successResponse(res,"Email Verified successfully",result,200))
})

export const searchUsers=asyncHandler(async(req,res)=>{
    const result = await userService.searchUsers(req.query);
    return(successResponse(res,"User fetched successfully",result,200))
})

export const logout = asyncHandler(async(req,res)=>{
    const result = await userService.logout(req,res);

    return (successResponse(res,"User logout successfully",result,200))
})


export const getUserHierarchy = asyncHandler(async (req, res) => {
  const id  = req.user._id; 
  const result = await getHierarchyUsersByUserId(id);
  return successResponse(res, 'Hierarchy fetched successfully', result, 200);
});


export const addFaceScanController = async (req, res) => {
  try {
    const { userId } = req.body;
    const localFilePath = req.file.path; 

    const result = await userService.addUserFaceScan(userId, localFilePath);

    res.status(200).json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const fetchUsers = asyncHandler(async (req, res) => {
  const result = await userService.fetchUsers();
  return successResponse(res, 'Users fetched successfully', result, 200);
});

export const loginAdmin = asyncHandler(async (req, res) => {
  const result = await userService.loginAdmin(req.body,res);
  return successResponse(res, 'Admin Login successful', result, 200);
});
