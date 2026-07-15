import asyncHandler from "../middlewares/asyncHandler.js";
import * as approvalService from "../services/approval.service.js";
import { successResponse } from "../utils/apiResponse.js";

export const requestForApproval = asyncHandler(async (req, res) => {
  const result = await approvalService.requestForApproval(req);
  try {
    const io = req.app && req.app.get && req.app.get("io");
    const assignBy = req.body.assignBy;
    if (io && assignBy && result) {
      io.to(`user_${assignBy}`).emit("approval_requested", {
        taskAssignIds: req.body.taskAssignIds,
        from: req.user.id,
      });
    }
  } catch (err) {
    console.error("Socket emit error (requestForApproval):", err.message);
  }
  return successResponse(res, "Approval requests processed", result, 201);
});

export const approvalById = asyncHandler(async (req, res) => {
  const result = await approvalService.approvalById(req);
  return successResponse(res, "Approval fetched successfully", result, 201);
});

export const approvalsByUserId = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const result = await approvalService.approvalsByUserId(id);
  return successResponse(res, "Approvals fetched successfully", result, 201);
});

export const approvalsByUserParamsId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await approvalService.approvalsByUserId(id);
  return successResponse(res, "Approvals fetched successfully", result, 201);
});

export const approvalsByAssignedById = asyncHandler(async (req, res) => {
  const result = await approvalService.approvalsByAssignedById(req);
  return successResponse(res, "Approvals fetched successfully", result, 201);
});

export const departmentAllApprovals = asyncHandler(async (req, res) => {
  const result = await approvalService.departmentAllApprovals(req);
  return successResponse(
    res,
    "Department Approvals fetched successfully",
    result,
    201
  );
});

export const allApprovals = asyncHandler(async (req, res) => {
  const result = await approvalService.allApprovals(req);
  return successResponse(res, "Approvals fetched successfully", result, 201);
});

export const approvalBySubmissionId = asyncHandler(async (req, res) => {
  const result = await approvalService.approvalBySubmissionId(req);
  return successResponse(res, "Approval fetched successfully", result, 201);
});

export const updateApproval = asyncHandler(async (req, res) => {
  const result = await approvalService.updateApproval(req);
  try {
    const io = req.app && req.app.get && req.app.get("io");
    if (io && result && result.approval) {
      const approval = result.approval;

      const assignToId =
        approval.assignTo?._id?.toString() || approval.assignTo?.toString();

      const taskId =
        approval.taskAssignId?._id?.toString() ||
        approval.taskAssignId?.toString();

      const payload = {
        approvalId: approval._id,
        status: approval.status,
        taskAssignId: taskId,
        signalColor: approval.signalColor,
      };

      if (assignToId) {
        io.to(`user_${assignToId}`).emit("approval_updated", payload);
      }
      if (taskId) {
        io.to(`task_${taskId}`).emit("approval_updated", payload);
      }
    }
  } catch (err) {
    console.error("Socket emit error (updateApproval):", err.message);
  }
  return successResponse(res, "Approval updated successfully", result, 201);
});

export const deleteApproval = asyncHandler(async (req, res) => {
  const result = await approvalService.deleteApproval(req);
  try {
    const io = req.app && req.app.get && req.app.get("io");
    if (io && result) {
      const approval = result; 

      const assignToId =
        approval.assignTo?._id?.toString() || approval.assignTo?.toString();
      const taskId =
        approval.taskAssignId?._id?.toString() ||
        approval.taskAssignId?.toString();

      const payload = { approvalId: approval._id, taskAssignId: taskId };

      if (assignToId) {
        io.to(`user_${assignToId}`).emit("approval_deleted", payload);
      }
      if (taskId) {
        io.to(`task_${taskId}`).emit("approval_deleted", payload);
      }
    }
  } catch (err) {
    console.error("Socket emit error (deleteApproval):", err.message);
  }

  return successResponse(res, "Task deleted approved", result, 201);
});

export const overrideDecision = asyncHandler(async (req, res) => {
  const result = await approvalService.overrideDecision(req);
  try {
    const io = req.app && req.app.get && req.app.get("io");
    if (io && result) {
      const approval = result;

      const assignToId =
        approval.assignTo?._id?.toString() || approval.assignTo?.toString();
      const taskId =
        approval.taskAssignId?._id?.toString() ||
        approval.taskAssignId?.toString();

      const payload = {
        approvalId: approval._id,
        status: approval.status,
        taskAssignId: taskId,
        signalColor: approval.signalColor,
        overridden: true,
      };

      if (assignToId) {
        io.to(`user_${assignToId}`).emit("approval_updated", payload);
      }
      if (taskId) {
        io.to(`task_${taskId}`).emit("approval_updated", payload);
      }
    }
  } catch (err) {
    console.error("Socket emit error (overrideDecision):", err.message);
  }

  return successResponse(res, "Decision override successfully", result, 201);
});
