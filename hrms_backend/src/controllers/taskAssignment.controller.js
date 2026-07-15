import asyncHandler from '../middlewares/asyncHandler.js';
import * as taskAssignmentService from '../services/taskAssignment.service.js';
import { successResponse } from '../utils/apiResponse.js';

export const createTaskAssignment = asyncHandler(async (req, res) => {
  const result = await taskAssignmentService.createTaskAssignment(req);

  try {
    const io = req.app && req.app.get && req.app.get('io');

    if (io && result) {
      const task = result.result || result;

      const assignedToId =
        task.assigned_to_employee_id?._id?.toString() ||
        task.assigned_to_employee_id?.toString();

      const payload = { task };

      if (assignedToId) {
        io.to(`user_${assignedToId}`).emit('task_created', payload);
      }
    }
  } catch (err) {
    console.error('Socket emit error (createTaskAssignment):', err.message);
  }

  return successResponse(
    res,
    'Task assignment created successfully',
    result,
    201
  );
});

export const getAllTaskAssignments = asyncHandler(async (req, res) => {
  const result = await taskAssignmentService.getAllTaskAssignments();
  return successResponse(res, 'Task assignments retrieved successfully', result);
});

export const getTaskAssignmentById = asyncHandler(async (req, res) => {
  const result = await taskAssignmentService.getTaskAssignmentById(
    req.params.id
  );
  return successResponse(res, 'Task assignment retrieved successfully', result);
});

export const getTaskAssignmentsByUserId = asyncHandler(async (req, res) => {
  const result = await taskAssignmentService.getTaskAssignmentsByUserId(req);
  return successResponse(res, 'Task assignments retrieved successfully', result);
});

export const getTodayTaskAssignmentsByUserId = asyncHandler(
  async (req, res) => {
    const result =
      await taskAssignmentService.getTodayTaskAssignmentsByUserId(req);
    return successResponse(
      res,
      'Task assignments retrieved successfully',
      result
    );
  }
);

export const getTodayTaskAssignmentsByGivenUserId = asyncHandler(
  async (req, res) => {
    const result =
      await taskAssignmentService.getTodayTaskAssignmentsByGivenUserId(req);
    return successResponse(
      res,
      'Task assignments retrieved successfully',
      result
    );
  }
);

export const getTaskAssignmentByAssignedById = asyncHandler(
  async (req, res) => {
    const result =
      await taskAssignmentService.getTaskAssignmentByAssignedById(req);
    return successResponse(
      res,
      'Task assignments retrieved successfully',
      result
    );
  }
);

export const getDepartmentTaskAssignments = asyncHandler(async (req, res) => {
  const result = await taskAssignmentService.getDepartmentTaskAssignments(req);
  return successResponse(
    res,
    'Department task assignments retrieved successfully',
    result
  );
});

export const updateTaskAssignment = asyncHandler(async (req, res) => {
  const result = await taskAssignmentService.updateTaskAssignment(req);

  try {
    const io = req.app && req.app.get && req.app.get('io');
    if (io && result) {
      const assignedToId =
        result.assigned_to_employee_id?._id?.toString() ||
        result.assigned_to_employee_id?.toString();

      const payload = {
        taskId: result._id,
        change: 'updated',
        data: result,
      };

      io.to(`task_${result._id}`).emit('task_updated', payload);

      if (assignedToId) {
        io.to(`user_${assignedToId}`).emit('task_updated', payload);
      }
    }
  } catch (err) {
    console.error('Socket emit error (updateTaskAssignment):', err.message);
  }

  return successResponse(res, 'Task assignment updated successfully', result);
});

export const deleteTaskAssignment = asyncHandler(async (req, res) => {
  const deleted = await taskAssignmentService.deleteTaskAssignment(
    req.params.id
  );

  try {
    const io = req.app && req.app.get && req.app.get('io');
    if (io && deleted) {
      const assignedToId =
        deleted.assigned_to_employee_id?._id?.toString() ||
        deleted.assigned_to_employee_id?.toString();

      const payload = { taskId: deleted._id };

      io.to(`task_${deleted._id}`).emit('task_deleted', payload);

      if (assignedToId) {
        io.to(`user_${assignedToId}`).emit('task_deleted', payload);
      }
    }
  } catch (err) {
    console.error('Socket emit error (deleteTaskAssignment):', err.message);
  }

  return successResponse(res, 'Task assignment deleted successfully');
});

export const changeTimerStatus = asyncHandler(async (req, res) => {
  const result = await taskAssignmentService.changeTimerStatus(req);
  try {
    const io = req.app && req.app.get && req.app.get('io');
    if (io && result) {
      const userId =
        result.assigned_to_employee_id?._id?.toString() ||
        result.assigned_to_employee_id?.toString();

      const payload = {
        taskId: result._id,
        change: 'timer_status',
        data: result,
      };

      io.to(`task_${result._id}`).emit('task_updated', payload);

      if (userId) {
        io.to(`user_${userId}`).emit('task_updated', payload);
      }
    }
  } catch (err) {
    console.error('Socket emit error (changeTimerStatus):', err.message);
  }
  return successResponse(res, 'Timer Status Changed', result);
});

export const stuckStatusRequest = asyncHandler(async (req, res) => {
  const result = await taskAssignmentService.stuckStatusRequest(req);
  try {
    const io = req.app && req.app.get && req.app.get('io');
    if (io && result) {
      const assignedToId =
        result.assigned_to_employee_id?._id?.toString() ||
        result.assigned_to_employee_id?.toString();

      const assignedById =
        result.assigned_by_user_id?._id?.toString() ||
        result.assigned_by_user_id?.toString();

      const payload = {
        taskId: result._id,
        assignedTo: assignedToId,
        assignedBy: assignedById,
        stuck_request: result.stuck_request,
        stuck_reason: result.stuck_reason,
      };

      if (assignedById) {
        io.to(`user_${assignedById}`).emit('stuck_request_created', payload);
      }

      io.to(`task_${result._id}`).emit('stuck_request_created', payload);
    }
  } catch (err) {
    console.error('Socket emit error (stuckStatusRequest):', err.message);
  }
  return successResponse(res, 'Request for stuck time', result);
});

export const acceptOrRejectStuckRequest = asyncHandler(async (req, res) => {
  const data = await taskAssignmentService.acceptOrRejectStuckRequest(req);
  try {
    const io = req.app && req.app.get && req.app.get('io');
    if (io && data) {
      const assignedToId =
        data.assigned_to_employee_id?._id?.toString() ||
        data.assigned_to_employee_id?.toString();
      const assignedById =
        data.assigned_by_user_id?._id?.toString() ||
        data.assigned_by_user_id?.toString();

      const payload = {
        taskId: data._id,
        assignedTo: assignedToId,
        assignedBy: assignedById,
        stuck_request: data.stuck_request,
        timer_status: data.timer_status,
      };

      if (assignedToId) {
        io.to(`user_${assignedToId}`).emit('stuck_request_response', payload);
      }

      io.to(`task_${data._id}`).emit('stuck_request_response', payload);
    }
  } catch (err) {
    console.error(
      'Socket emit error (acceptOrRejectStuckRequest):',
      err.message
    );
  }
  if (data.stuck_request === true) {
    return successResponse(res, 'Stuck Request Accepted', data);
  } else {
    return successResponse(res, 'Stuck Request Rejected', data);
  }
});

export const listStuckRequests = asyncHandler(async (req, res) => {
  const id = req.user._id;
  const data = await taskAssignmentService.listStuckRequests(id);
  return successResponse(res, 'Stuck Requests fetched successfully', data);
});

export const convertStuckToInProgress = asyncHandler(async (req, res) => {
  const data = await taskAssignmentService.convertStuckToInProgress(req);
  try {
    const io = req.app && req.app.get && req.app.get('io');
    if (io && data) {
      const assignedToId =
        data.assigned_to_employee_id?._id?.toString() ||
        data.assigned_to_employee_id?.toString();

      const payload = {
        taskId: data._id,
        assignedTo: assignedToId,
        timer_status: data.timer_status,
      };

      if (assignedToId) {
        io.to(`user_${assignedToId}`).emit('task_status_changed', payload);
      }

      io.to(`task_${data._id}`).emit('task_status_changed', payload);
    }
  } catch (err) {
    console.error(
      'Socket emit error (convertStuckToInProgress):',
      err.message
    );
  }
  return successResponse(res, 'Converted to In Progress', data);
});

export const getUserDailyTasksController = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const tasksByDay = await taskAssignmentService.getUserDailyTasksService(
    userId
  );

  res.status(200).json({
    success: true,
    count: tasksByDay.length,
    data: tasksByDay,
  });
});

export const changeDeadline = asyncHandler(async (req, res) => {
  const data = await taskAssignmentService.changeDeadline(req);

  try {
    const io = req.app && req.app.get && req.app.get('io');
    if (io && data) {
      const assignedToId =
        data.assigned_to_employee_id?._id?.toString() ||
        data.assigned_to_employee_id?.toString();

      const payload = {
        taskId: data._id,
        change: 'deadline_changed',
        data,
      };

      io.to(`task_${data._id}`).emit('task_updated', payload);
      if (assignedToId) {
        io.to(`user_${assignedToId}`).emit('task_updated', payload);
      }
    }
  } catch (err) {
    console.error('Socket emit error (changeDeadline):', err.message);
  }

  return successResponse(res, 'Deadline Changed successfully', data);
});

export const bulkTaskAssignments = asyncHandler(async (req, res) => {
  const result = await taskAssignmentService.bulkTaskAssignments(req);

  try {
    const io = req.app && req.app.get && req.app.get('io');
    if (io && Array.isArray(result)) {
      result.forEach((task) => {
        const assignedToId =
          task.assigned_to_employee_id?._id?.toString() ||
          task.assigned_to_employee_id?.toString();

        const payload = { task };

        if (assignedToId) {
          io.to(`user_${assignedToId}`).emit('task_created', payload);
        }
      });
    }
  } catch (err) {
    console.error('Socket emit error (bulkTaskAssignments):', err.message);
  }

  return successResponse(
    res,
    'Bulk task assignments created successfully',
    result,
    201
  );
});

export const getPreviousTasks = asyncHandler(async (req, res) => {
  const result = await taskAssignmentService.getPreviousTasks(req);
  return successResponse(res, 'Previous tasks fetched successfully', result, 201);
});
