import * as taskAssignmentRepository from "../repositories/taskAssignment.repository.js";
import TaskAssignment from "../models/taskAssignment.Model.js";
import ApiError from "../utils/apiError.js";
import XLSX from "xlsx";
import fs from "fs";
import { sendNotification } from "../utils/notification.js";

export const createTaskAssignment = async (req) => {
  const assigned_by_user_id = req.user.id;
  const {
    title,
    assigned_to_employee_id,
    proof,
    TAT,
    deadline,
    department_id
  } = req.body;

  if (
    !title ||
    !assigned_to_employee_id ||
    !assigned_by_user_id ||
    !TAT ||
    !deadline ||
    !department_id ||
    proof.length === 0
  ) {
    throw new ApiError(
      400,
      "Task ID, assigned employee ID, start date, and end date are required"
    );
  }

  const dataToCreate = {
    ...req.body,
    assigned_by_user_id,
  };

  const result = await taskAssignmentRepository.createTaskAssignment(
    dataToCreate
  );

  if (!result) {
    throw new ApiError(400, "Task assignment failed");
  }

  let notifError = null;

  try {
    await sendNotification({
      recipient: result.assigned_to_employee_id,
      sender: result.assigned_by_user_id,
      type: "TASK_ASSIGNED",
      message: `New task assigned: ${title}`,
      meta: { taskId: result._id, TAT: result.TAT, deadline: result.deadline, priority: result.priority },
    });
  } catch (err) {
    notifError = err.message || "Error in sending notification";
  }

  return { result, notifError };
};

//all users tasks for admin
export const getDepartmentTaskAssignments = async (req) => {
  const department_id = req.params.id;
  if (!department_id) {
    throw new ApiError(400, "Department ID is required");
  }

  const taskAssignments =
    await taskAssignmentRepository.getDepartmentTaskAssignments(department_id);
  return taskAssignments;
};

//all users tasks for perticular user
export const getTaskAssignmentsByUserId = async (req) => {
  const userId = req.user.id;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const taskAssignments =
    await taskAssignmentRepository.getTaskAssignmentsByUserId(userId);
  return taskAssignments;
};

export const getTodayTaskAssignmentsByUserId = async (req) => {
  const userId = req.user.id;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const taskAssignments =
    await taskAssignmentRepository.getTodayTaskAssignmentsByUserId(
      userId,
      startOfDay,
      endOfDay
    );
  return taskAssignments;
};
export const getTodayTaskAssignmentsByGivenUserId = async (req) => {
  const userId = req.params.id;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const taskAssignments =
    await taskAssignmentRepository.getTodayTaskAssignmentsByGivenUserId(userId);
  return taskAssignments;
};

//all users tasks for manager
export const getTaskAssignmentByAssignedById = async (req) => {
  const userId = req.user.id;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const taskAssignments =
    await taskAssignmentRepository.getTaskAssignmentByAssignedById(userId);
  return taskAssignments;
};

export const getAllTaskAssignments = async () => {
  const taskAssignments =
    await taskAssignmentRepository.getAllTaskAssignments();
  return taskAssignments;
};

//get one task in detail
export const getTaskAssignmentById = async (id) => {
  if (!id) {
    throw new ApiError(400, "Task Assignment ID is required");
  }

  const taskAssignment = await taskAssignmentRepository.getTaskAssignmentById(
    id
  );
  if (!taskAssignment) {
    throw new ApiError(404, "Task Assignment not found");
  }
  return taskAssignment;
};

export const updateTaskAssignment = async (req) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, "Task Assignment ID is required");
  }

  const taskAssignment = await taskAssignmentRepository.getTaskAssignmentById(
    id
  );
  if (!taskAssignment) {
    throw new ApiError(404, "Task Assignment not found");
  }

  const updatedTaskAssignment =
    await taskAssignmentRepository.updateTaskAssignment(id, req.body);
  if (!updatedTaskAssignment) {
    throw new ApiError(404, "Task Assignment not found");
  }

  return updatedTaskAssignment;
};

export const deleteTaskAssignment = async (id) => {
  if (!id) {
    throw new ApiError(400, "Task Assignment ID is required");
  }

  const taskAssignment = await taskAssignmentRepository.getTaskAssignmentById(
    id
  );
  if (!taskAssignment) {
    throw new ApiError(404, "Task Assignment not found");
  }

  await taskAssignmentRepository.deleteTaskAssignment(id);
  return { message: "Task Assignment deleted successfully" };
};

export const changeTimerStatus = async (req) => {
  const updatedData = req.body;
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Task Assignment id is not provided");
  }

  if (!updatedData.timer_status) {
    throw new ApiError(404, "Timer Status not provided");
  }

  if (updatedData.timer_status === "InProgress") {
    updatedData.timerStartTime = new Date();
  }

  const changed = await taskAssignmentRepository.updateTaskAssignment(
    id,
    updatedData
  );

  return changed;
};

export const stuckStatusRequest = async (req) => {
  const requestedData = req.body;

  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Task Assignment id is not provided");
  }

  if (!requestedData.stuck_request || !requestedData.stuck_reason) {
    throw new ApiError(400, "stuck request or reason not provided");
  }

  const requested = await taskAssignmentRepository.updateTaskAssignment(id, {
    ...requestedData,
    updatedAt: new Date(),
  });

  return requested;
};

export const acceptOrRejectStuckRequest = async (req) => {
  const requestedData = req.body;
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Task Assignment id is not provided");
  }

  if (requestedData.stuck_request === true) {
    requestedData.timer_status = "Stuck";

    const assignment = await taskAssignmentRepository.getTaskAssignmentById(id);

    if (!assignment) {
      throw new ApiError(400, "assignment not found");
    }

    const start = new Date(assignment.timerStartTime);
    const stuckTime = new Date(assignment.updatedAt);

    if (isNaN(start.getTime()) || isNaN(stuckTime.getTime())) {
      throw new ApiError(400, "Invalid timerStartTime or updatedAt date");
    }

    // Calculate elapsed minutes (rounded down)
    const elapsedMs = stuckTime.getTime() - start.getTime();
    const elapsedMinutes = Math.max(0, Math.floor(elapsedMs / 60000)); // minutes spent before getting stuck

    // Current task TAT (in minutes) — make sure it exists and is numeric
    const currentTAT = Number(assignment.TAT) || 0;

    // New remaining TAT after reducing elapsed minutes
    const newRemainingTAT = Math.max(0, currentTAT - elapsedMinutes);

    const previous_TAT = Array.isArray(assignment.previous_TAT)
      ? [...assignment.previous_TAT]
      : [];

    // push old TAT value
    previous_TAT.push(currentTAT);

    requestedData.previous_TAT = previous_TAT;
    requestedData.TAT = newRemainingTAT;
  }

  const acceptedOrRejected =
    await taskAssignmentRepository.updateTaskAssignment(id, requestedData);

  return acceptedOrRejected;
};

export const listStuckRequests = async (id) => {
  if (!id) {
    throw new ApiError(400, "assigned by Id is required");
  }

  const stuckrequests = await taskAssignmentRepository.listStuckRequests(id);

  return stuckrequests;
};

export const convertStuckToInProgress = async (req) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Task Assignment id is not provided");
  }

  const assignment = await taskAssignmentRepository.getTaskAssignmentById(id);

  if (assignment.timer_status === "Stuck") {
    const updated = await taskAssignmentRepository.updateTaskAssignment(id, {
      timer_status: "InProgress",
      timerStartTime: new Date(),
    });
    return updated;
  }
};

export const getUserDailyTasksService = async (userId) => {
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const tasksByDay = await taskAssignmentRepository.getUserDailyTasks(userId);

  if (!tasksByDay || tasksByDay.length === 0) {
    throw new ApiError(404, "No tasks found for this user");
  }

  return tasksByDay;
};

export const changeDeadline = async (req) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Task Assignment id is not provided");
  }

  const assignment = await taskAssignmentRepository.getTaskAssignmentById(id);

  if (!assignment) {
    throw new ApiError(400, "assignment not found");
  }

  const newDeadline = new Date(
    assignment.deadline.getTime() + 24 * 60 * 60 * 1000
  );
  const newCreatedAt = new Date(
    assignment.createdAt.getTime() + 24 * 60 * 60 * 1000
  );
  const newUpdatedAt = new Date(
    assignment.updatedAt.getTime() + 24 * 60 * 60 * 1000
  );

  const updated = await taskAssignmentRepository.changeDeadline(id, {
    deadline: newDeadline,
    createdAt: newCreatedAt,
    updatedAt: newUpdatedAt,
    timer_status: "Todo",
    stuck_request: false,
  });
  return updated;
};

export const taskLength = async (userId) => {
  if (!userId) {
    throw new ApiError(404, "userId required ");
  }

  const taskLength = await taskAssignmentRepository.getLengthTodayTask(userId);
  return taskLength;
};

export const bulkTaskAssignments = async (req, res, next) => {
  try {
    if (!req.file || !req.file.path) {
      return res
        .status(400)
        .json({ success: false, message: "Task file is required" });
    }

    const { assigned_to_employee_id, department_id } = req.body;
    const assigned_by_user_id = req.user.id;

    if (!assigned_to_employee_id || !department_id) {
      return res.status(400).json({
        success: false,
        message: "Assigned employee ID and department ID are required",
      });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (sheetData.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Excel file is empty" });
    }

    const deadlineFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;

    const tasks = [];
    for (let i = 0; i < sheetData.length; i++) {
      const row = sheetData[i];

      if (
        !row.title ||
        !row.description ||
        !row.TAT ||
        !row.deadline ||
        !row.priority ||
        row.proof?.length === 0
      ) {
        // return res.status(400).json({
        //   success: false,
        //   message: `Row ${
        //     i + 2
        //   } is missing required fields. Required: title, description, TAT, deadline`,
        // });
        throw new ApiError(
          400,
          "missing required fields"
        );
      }

      if (!deadlineFormat.test(row.deadline)) {
        throw new ApiError(
          400,
          `Deadline must be ISO format with timezone (e.g. 2026-01-03T18:30:00+05:30)`
        );
      }

      const parsedDeadline = new Date(row.deadline);
      if (isNaN(parsedDeadline.getTime())) {
        throw new ApiError(400, `Invalid deadline at row ${i + 2}`);
      }

      tasks.push({
        title: row.title,
        description: row.description,
        proof: row.proof ? JSON.parse(row.proof) : [],
        TAT: row.TAT,
        deadline: parsedDeadline,
        createdAt: new Date(),
        updatedAt: new Date(),
        assigned_by_user_id,
        assigned_to_employee_id,
        department_id,
        status: "Pending",
        timer_status: "Todo",
        priority: row.priority
      });
    }

    const createdTasks = await TaskAssignment.insertMany(tasks);

    if (createdTasks) {
      fs.unlinkSync(req.file.path);
    }

    return createdTasks;
  } catch (error) {
    console.error("Bulk Task Assignment Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getPreviousTasks = async (req, res, next) => {
  const { query } = req.query;
  const userId = req.user.id;

  if (!query || query.trim() === "") {
    throw new ApiError(400, "Search title is required");
  }

  const normalizedQuery = query.toLowerCase().replace(/\s+/g, "");

  const tasks = await TaskAssignment.find({
    assigned_by_user_id: userId,
    $expr: {
      $regexMatch: {
        input: {
          $replaceAll: {
            input: { $toLower: "$title" },
            find: " ",
            replacement: "",
          },
        },
        regex: normalizedQuery,
        options: "i",
      },
    },
  }).sort({ createdAt: -1 });

  return tasks;
};
