import {
  checkFraudLogicManager,
  checkManualFraud,
  removeFraudFlag,
} from "../controllers/fraud.controller.js";
import Submission from "../models/submission.Model.js";
import TaskAssignment from "../models/taskAssignment.Model.js";
import * as approvalRepository from "../repositories/approval.repository.js";
import { fraudDetailBytaskAssignId } from "../repositories/fraud.repository.js";
import * as submissionRepository from "../repositories/submission.repository.js";
import ApiError from "../utils/apiError.js";
import { sendNotification } from "../utils/notification.js";
import * as taskAssignmentRepository from "../repositories/taskAssignment.repository.js";
import mongoose from "mongoose";

export const approveTask = async ({
  taskAssignId,
  assignTo,
  assignBy,
  organizationId,
  submission,
}) => {
  if (!assignTo) {
    throw new ApiError(400, "user id is required");
  }

  if (!taskAssignId || !assignBy || !submission) {
    throw new ApiError(400, "Please provide all required field");
  }

  let signalColor = "Green";

  if (submission.ETAT > 0) {
    signalColor = submission.reason?.isValid ? "Yellow" : "Red";
  }

  const data = approvalRepository.approveTask({
    assignBy,
    submissionId: submission._id,
    signalColor,
    taskAssignId,
    organizationId,
    assignTo,
  });

  return data;
};

export const approvalById = async (req) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "approval id is required");
  }

  const approval = await approvalRepository.approvalById(id);

  return approval;
};

export const approvalsByUserId = async (id) => {
  if (!id) {
    throw new ApiError(400, "user id is required");
  }

  const approval = await approvalRepository.approvalsByUserId(id);

  return approval;
};

export const approvalsByAssignedById = async (req) => {
  const { id } = req.user;

  if (!id) {
    throw new ApiError(400, "assigned by id is required");
  }

  const approvals = await approvalRepository.approvalsByAssignedById(id);

  return approvals;
};

export const departmentAllApprovals = async (req) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "department id is required");
  }

  const approvals = await approvalRepository.departmentAllApprovals(id);

  return approvals;
};

export const allApprovals = async (req) => {
  const approvals = await approvalRepository.allApprovals();

  return approvals;
};

export const approvalBySubmissionId = async (req) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "submission id is required");
  }

  const approvals = await approvalRepository.approvalBySubmissionId(id);

  return approvals;
};

// export const updateApproval = async (req) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   let approval; // we need it outside transaction for notification

//   try {
//     const { id } = req.params;
//     const {
//       status,
//       comment,
//       reason,
//       isValid,
//       title,
//       assigned_to_employee_id,
//       proof,
//       TAT,
//       deadline,
//       description,
//       department_id,
//     } = req.body;

//     if (!id) throw new ApiError(400, "Approval ID is required");
//     if (!status) throw new ApiError(400, "Status is required");

//     const needsReason = ["Rejected", "Fraud"];
//     if (needsReason.includes(status) && !reason) {
//       throw new ApiError(400, `Reason is required with ${status} status`);
//     }

//     // 🔁 UPDATE APPROVAL (WITH SESSION)
//     approval = await approvalRepository.updateApproval(
//       id,
//       { status, comment, reason },
//       { session }
//     );

//     if (!approval) throw new ApiError(404, "Approval not found");

//     const task =
//       typeof approval.taskAssignId === "object"
//         ? approval.taskAssignId
//         : await taskAssignmentRepository.getTaskAssignmentById(
//             approval.taskAssignId,
//             { session }
//           );

//     const { assignTo, assignBy, organizationId } = approval;

//     // ---------------- OVERDUE LOGIC ----------------
//     if (task?.status === "Overdue") {
//       if (isValid) {
//         await Promise.all([
//           Submission.findByIdAndUpdate(
//             approval.submissionId,
//             { "reason.isValid": true },
//             { session }
//           ),
//           approvalRepository.updateApproval(
//             id,
//             { signalColor: "Yellow" },
//             { session }
//           ),
//         ]);
//       } else {
//         await approvalRepository.updateApproval(
//           id,
//           { signalColor: "Red" },
//           { session }
//         );
//       }
//     }

//     // ---------------- REVERSED LOGIC ----------------
//     if (status === "Reversed") {
//       if (approval.status === "Reversed") {
//         throw new ApiError(400, "Approval already reversed");
//       }

//       const newTaskData = {
//         title: title ?? task.title,
//         assigned_to_employee_id:
//           assigned_to_employee_id ?? task.assigned_to_employee_id,
//         proof: proof ?? task.proof,
//         TAT: TAT ?? task.TAT,
//         deadline: deadline ?? task.deadline,
//         description: description ?? task.description,
//         department_id: department_id ?? task.department_id,
//         assigned_by_user_id: assignBy,
//         status: "Pending",
//         timer_status: "Todo",
//       };

//       await taskAssignmentRepository.createTaskAssignment(
//         newTaskData,
//         { session }
//       );
//     }

//     // ✅ COMMIT DB CHANGES
//     await session.commitTransaction();
//     session.endSession();

//     // ---------------- NON-CRITICAL SIDE EFFECTS ----------------
//     try {
//       if (status === "Fraud") {
//         const flagged = await checkManualFraud(
//           approval.assignTo,
//           task._id,
//           reason,
//           organizationId
//         );

//         await sendNotification({
//           recipient: approval.assignTo,
//           sender: approval.assignBy,
//           type: "FRAUD_FLAGGED",
//           message: `Your activity was flagged as fraud due to (${flagged.reason})`,
//           meta: { fraud: flagged.fraud, status: flagged.status },
//         });
//       } else if (status === "Rejected") {
//         await sendNotification({
//           recipient: approval.assignTo,
//           sender: approval.assignBy,
//           type: "TASK_REJECTED",
//           message: `Your task "${task.title}" was Rejected`,
//           meta: { approvalId: approval._id },
//         });
//       } else if (status === "Approved") {
//         await sendNotification({
//           recipient: approval.assignTo,
//           sender: approval.assignBy,
//           type: "TASK_APPROVED",
//           message: `Your task "${task.title}" was Approved`,
//           meta: { approvalId: approval._id },
//         });
//       } else if (status === "Reversed") {
//         await sendNotification({
//           recipient: approval.assignTo,
//           sender: approval.assignBy,
//           type: "TASK_REVERSAL",
//           message: `The approval decision for your task "${task.title}" has been reversed`,
//           meta: { approvalId: approval._id },
//         });
//       }
//     } catch (err) {
//       console.error("Notification failed:", err);
//     }

//     await checkFraudLogicManager(
//       approval.assignBy,
//       task._id,
//       approval.createdAt,
//       approval.updatedAt,
//       organizationId
//     );

//     return { approval };
//   } catch (error) {
//     // 🔥 ROLLBACK EVERYTHING
//     await session.abortTransaction();
//     session.endSession();
//     throw error;
//   }
// };


export const updateApproval = async (req) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  let approval;
  let task;

  try {
    const { id } = req.params;
    const {
      status,
      comment,
      reason,
      isValid,
      title,
      assigned_to_employee_id,
      proof,
      TAT,
      deadline,
      description,
      department_id,
    } = req.body;

    if (!id) throw new ApiError(400, "Approval ID is required");
    if (!status) throw new ApiError(400, "Status is required");

    const needsReason = ["Rejected", "Fraud"];
    if (needsReason.includes(status) && !reason) {
      throw new ApiError(400, `Reason is required with ${status} status`);
    }

    /* =====================================================
       1️⃣ READ CURRENT APPROVAL (NO WRITE YET)
    ===================================================== */
    const existingApproval = await approvalRepository.approvalById(id, {
      session,
    });

    if (!existingApproval) {
      throw new ApiError(404, "Approval not found");
    }

    /* =====================================================
       2️⃣ VALIDATION (BEFORE MUTATION)
    ===================================================== */
    if (status === "Reversed" && existingApproval.status === "Reversed") {
      throw new ApiError(400, "Approval already reversed");
    }

    /* =====================================================
       3️⃣ READ RELATED TASK
    ===================================================== */
    task =
      typeof existingApproval.taskAssignId === "object"
        ? existingApproval.taskAssignId
        : await taskAssignmentRepository.getTaskAssignmentById(
            existingApproval.taskAssignId,
            { session }
          );

    if (!task) {
      throw new ApiError(404, "Task assignment not found");
    }

    const { assignTo, assignBy, organizationId } = existingApproval;

    /* =====================================================
       4️⃣ APPLY ALL WRITES (ATOMIC)
    ===================================================== */

    // 4.1 Update approval
    approval = await approvalRepository.updateApproval(
      id,
      { status, comment, reason },
      { session }
    );

    // 4.2 Overdue logic
    if (task.status === "Overdue") {
      if (isValid) {
        await Promise.all([
          Submission.findByIdAndUpdate(
            approval.submissionId,
            { "reason.isValid": true },
            { session }
          ),
          approvalRepository.updateApproval(
            id,
            { signalColor: "Yellow" },
            { session }
          ),
        ]);
      } else {
        await approvalRepository.updateApproval(
          id,
          { signalColor: "Red" },
          { session }
        );
      }
    }

    // 4.3 Reversed → create NEW task
    if (status === "Reversed") {
      const newTaskData = {
        title: title ?? task.title,
        description: description ?? task.description,
        assigned_to_employee_id:
          assigned_to_employee_id ?? task.assigned_to_employee_id,
        proof: proof ?? task.proof,
        TAT: TAT ?? task.TAT,
        deadline: deadline ?? task.deadline,
        department_id: department_id ?? task.department_id,
        assigned_by_user_id: assignBy,
        status: "Pending",
        timer_status: "Todo",
      };

      await taskAssignmentRepository.createTaskAssignment(newTaskData, {
        session,
      });

      await taskAssignmentRepository.updateTaskAssignment(
        task._id,
        { status: "Reversed" },
        { session }
      );
    }

    /* =====================================================
       5️⃣ COMMIT (ALL OR NOTHING)
    ===================================================== */
    await session.commitTransaction();
    session.endSession();

    /* =====================================================
       6️⃣ NON-CRITICAL SIDE EFFECTS (AFTER COMMIT)
    ===================================================== */
    try {
      if (status === "Fraud") {
        const flagged = await checkManualFraud(
          assignTo,
          task._id,
          reason,
          organizationId
        );

        await sendNotification({
          recipient: assignTo,
          sender: assignBy,
          type: "FRAUD_FLAGGED",
          message: `Your activity was flagged as fraud due to (${flagged.reason})`,
          meta: { fraud: flagged.fraud, status: flagged.status },
        });
      } else if (status === "Rejected") {
        await sendNotification({
          recipient: assignTo,
          sender: assignBy,
          type: "TASK_REJECTED",
          message: `Your task "${task.title}" was Rejected`,
          meta: { approvalId: approval._id },
        });
      } else if (status === "Approved") {
        await sendNotification({
          recipient: assignTo,
          sender: assignBy,
          type: "TASK_APPROVED",
          message: `Your task "${task.title}" was Approved`,
          meta: { approvalId: approval._id },
        });
      } else if (status === "Reversed") {
        await sendNotification({
          recipient: assignTo,
          sender: assignBy,
          type: "TASK_REVERSAL",
          message: `The approval decision for your task "${task.title}" has been reversed`,
          meta: { approvalId: approval._id },
        });
      }
    } catch (err) {
      console.error("Notification failed:", err);
    }

    await checkFraudLogicManager(
      assignBy,
      task._id,
      approval.createdAt,
      approval.updatedAt,
      organizationId
    );

    return { approval };
  } catch (error) {
    /* =====================================================
       ❌ FULL ROLLBACK
    ===================================================== */
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const deleteApproval = async (req) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "approval id is required");
  }

  const approval = await approvalRepository.deleteApproval(id);

  return approval;
};

// export const requestForApproval = async (req) => {
//   const assignTo = req.user.id;
//   const { taskAssignIds, assignBy } = req.body;

//   if (!Array.isArray(taskAssignIds) || taskAssignIds.length === 0) {
//     throw new ApiError(400, "taskAssignIds must be a non-empty array");
//   }

//   if(!req.user.organizationId) throw new ApiError(400, "User organizationId is required");

//   let notifError = null;

//   try {
//     await sendNotification({
//       recipient: assignBy,
//       sender: assignTo,
//       type: "DAY_END_SUBMISSION",
//       message: `${req.user.name} submitted all tasks for today`,
//       meta: { taskAssignIds },
//     });
//   } catch (err) {
//     notifError = err.message || "Error in sending notification";
//   }

//   const approvalPromises = taskAssignIds.map(async (taskAssignId) => {
//     const submission = await submissionRepository.getSubmissionByAssignmentId(
//       taskAssignId
//     );

//     if (submission) {
//       return approveTask({
//         taskAssignId: submission.task_assign_id,
//         assignTo,
//         assignBy,
//         organizationId: submission.organizationId,
//         submission: submission,
//         notifError,
//       });
//     } else {
//       return null;
//     }
//   });

//   const results = await Promise.all(approvalPromises);

//   const approved = results.filter(Boolean);

//   return { approved, notifError };
// };

export const requestForApproval = async (req) => {
  const assignTo = req.user.id;
  const { taskAssignId, assignBy } = req.body;

  if (!taskAssignId || typeof taskAssignId !== "string") {
    throw new ApiError(400, "taskAssignId must be a valid string");
  }

  if (!req.user.organizationId) {
    throw new ApiError(400, "User organizationId is required");
  }

  let notifError = null;

  try {
    await sendNotification({
      recipient: assignBy,
      sender: assignTo,
      type: "DAY_END_SUBMISSION",
      message: `${req.user.name} submitted task for approval`,
      meta: { taskAssignId },
    });
  } catch (err) {
    notifError = err.message || "Error in sending notification";
  }

  const submission = await submissionRepository.getSubmissionByAssignmentId(
    taskAssignId
  );

  if (!submission) {
    return { approved: null, notifError };
  }

  const approved = await approveTask({
    taskAssignId: submission.task_assign_id,
    assignTo,
    assignBy,
    organizationId: submission.organizationId,
    submission,
    notifError,
  });

  return { approved, notifError };
};

export const overrideDecision = async (req) => {
  const { status, reason, isValid } = req.body;
  const { id } = req.params;

  if (!id) throw new ApiError(400, "Approval ID is required");
  if (!status) throw new ApiError(400, "Override status is required");

  const needsReason = ["Rejected", "Fraud"];
  if (needsReason.includes(status) && !reason) {
    throw new ApiError(400, `Reason is required with ${status} status`);
  }

  let approval = await approvalRepository.updateApproval(id, {
    status,
    reason,
  });

  approval = await approvalRepository.approvalById(id);

  if (!approval) throw new ApiError(404, "Approval not found");

  const { taskAssignId, submissionId, assignTo, assignBy, organizationId } = {
    taskAssignId: approval.taskAssignId,
    submissionId: approval.submissionId?.id,
    assignTo: approval.assignTo,
    assignBy: approval.assignBy,
    organizationId: approval.organizationId,
  };

  if (status === "Fraud") {
    await checkManualFraud(assignTo, taskAssignId, reason, organizationId);

    await approvalRepository.updateApproval(id, { signalColor: "Red" });
  } else if (status === "Rejected") {
    const fraud = await fraudDetailBytaskAssignId(taskAssignId);

    if (fraud) await removeFraudFlag(taskAssignId);

    await approvalRepository.updateApproval(id, { signalColor: "Red" });
  } else if (status === "Approved") {
    const fraud = await fraudDetailBytaskAssignId(taskAssignId);

    if (fraud) await removeFraudFlag(taskAssignId);

    if (taskAssignId?.status === "Overdue" && isValid === true) {
      await Promise.all([
        Submission.findByIdAndUpdate(submissionId, { "reason.isValid": true }),
        approvalRepository.updateApproval(id, { signalColor: "Yellow" }),
      ]);
    } else if (taskAssignId?.status === "Overdue" && isValid === false) {
      Submission.findByIdAndUpdate(submissionId, { "reason.isValid": false });
      await approvalRepository.updateApproval(id, { signalColor: "Red" });
    } else {
      await approvalRepository.updateApproval(id, { signalColor: "Green" });
    }
  }

  return approval;
};
