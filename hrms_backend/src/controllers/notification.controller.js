import asyncHandler from "../middlewares/asyncHandler.js";
import Notification from "../models/notification.Model.js";
import ApiError from "../utils/apiError.js";
import { successResponse } from "../utils/apiResponse.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const notifications = await Notification.find({ recipient: userId })
    .populate("sender","email name")
    .sort({ createdAt: -1 })
    .limit(50);

  return successResponse(
    res,
    "notifications fetched successfully",
    notifications,
    200
  );
});

export const changeIsRead = asyncHandler(async (req,res)=>{
    const {id} = req.params;

    if(!id){
        throw new ApiError(400,"Notification id is required")
    }

    const changed = await Notification.findByIdAndUpdate(id,{isRead:true});

    if(!changed){
        throw new ApiError(400,"failed to change")
    }

    return successResponse(
        res,
        "changed successfully",
        changed,
        200
    )
});
