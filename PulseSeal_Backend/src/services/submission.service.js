import * as submissionRepository from "../repositories/submission.repository.js";
import * as taskAssignmentRepository from "../repositories/taskAssignment.repository.js";
import { calculateETAT } from "../utils/timer.js";
import ApiError from "../utils/apiError.js";
import { checkFraudLogicEmployee } from "../controllers/fraud.controller.js";
import { uploadOnCloudinary } from "../middlewares/cloudinary.js";
import { sendNotification } from "../utils/notification.js";

//this api is not handling error which occured after submission
// export const makeSubmission = async (req) => {
//   const { user} = req;
//   const { assignmentId, comment, reason } = req.body;
//   // console.log(user,"user")
//   // return;

//   const urlProofsFromRequest = req.body;

//   if (!assignmentId) {
//     throw new ApiError(400, "Assignment ID is required");
//   }

//   const assignment = await taskAssignmentRepository.getTaskAssignmentById(
//     assignmentId
//   );

//   if (!assignment) {
//     throw new ApiError(404, "Assignment not found");
//   }

//   if (await submissionRepository.getSubmissionByAssignmentId(assignmentId)) {
//     throw new ApiError(400, "Submission already exists for this assignment");
//   }

//   if (!["Done", "Stuck"].includes(assignment.timer_status)) {
//     throw new ApiError(
//       400,
//       "Task is not in a submittable state (Done or Stuck)"
//     );
//   }

//   const now = new Date();
//   if (
//     assignment.deadline &&
//     new Date(assignment.deadline) < now &&
//     assignment.timer_status !== "Stuck"
//   ) {
//     throw new ApiError(
//       400,
//       "Your task is overdue, so you cannot submit it now"
//     );
//   }

//   const processedSubmissionData = [];
//   const requiredProofs = assignment.proof || [];
//   const filesUploaded = req.files || [];

//   await Promise.all(
//     requiredProofs.map(async (proofSpec) => {
//       const { fieldName, type } = proofSpec;

//       if (type === "url") {
//         if (urlProofsFromRequest[fieldName]) {
//           processedSubmissionData.push({
//             field_name: fieldName,
//             proof_type: "url",
//             url: urlProofsFromRequest[fieldName],
//             original_name: "URL Link",
//           });
//         }
//       } else {
//         const file = filesUploaded.find((f) => f.fieldname === fieldName);
//         if (file) {
//           const localFilePath = file.path;
//           const resourceType =
//             type === "image" ? "image" : type === "video" ? "video" : "auto";

//           const uploadResult = await uploadOnCloudinary(
//             localFilePath,
//             resourceType
//           );

//           if (!uploadResult || uploadResult.error) {
//             console.error(
//               `Cloudinary upload failed for ${fieldName}:`,
//               uploadResult.error
//             );
//             throw new ApiError(500, `Failed to upload ${fieldName}.`);
//           }

//           processedSubmissionData.push({
//             field_name: fieldName,
//             proof_type: type,
//             url: uploadResult.secure_url,
//             public_id: uploadResult.public_id,
//             original_name: file.originalname,
//             size: file.size,
//           });
//         }
//       }
//     })
//   );

//   if (Object.keys(processedSubmissionData).length !== requiredProofs.length) {
//     throw new ApiError(
//       400,
//       "A required proof was not submitted. Please provide all proofs."
//     );
//   }

//   const ETAT = calculateETAT(assignment.timerStartTime, assignment.TAT);

  
//   const submissionPayload = {
//       organizationId: user.organizationId,
//       submitted_by_user_id: user.id,
//       task_assign_id: assignmentId,
//       submission_data: processedSubmissionData,
//       comment,
//       ETAT,
//   }

//   let notifError = null;

//   if (ETAT > 0) {
//     if (!reason) {
//       throw new ApiError(400, "A reason is required when the task is overdue.");
//     }
//     submissionPayload.reason = { message: reason };
//     const updated = await taskAssignmentRepository.updateTaskAssignment(
//       assignmentId,
//       {
//         status: "Overdue",
//       }
//     );
//     if (updated && updated.status === "Overdue") {
//       try {
//         await sendNotification({
//           recipient: updated.assigned_by_user_id,
//           sender: updated.assigned_to_employee_id,
//           type: "TASK_OVERDUE",
//           message: `Task "${updated.title}" is overdue`,
//           meta: {
//             taskId: updated._id,
//             TAT: updated.TAT,
//             deadline: updated.deadline,
//           },
//         });
//       } catch (err) {
//         notifError = err.message || "Error in sending notification";
//       }
//     }
//   } else {
//     await taskAssignmentRepository.updateTaskAssignment(assignmentId, {
//       status: "Completed",
//     });
//   }

//   const submitted = await submissionRepository.createSubmission(
//     submissionPayload
//   );
//   if (submitted && user.is_organizer === false) {
//     const result = await checkFraudLogicEmployee(
//       submitted.submitted_by_user_id,
//       submitted.submission_data,
//       submitted.task_assign_id,
//       user.organizationId
//     );

//     if (result && result.fraud) {
//       try {
//         await sendNotification({
//           recipient: submitted.submitted_by_user_id,
//           sender: assignment.assigned_by_user_id,
//           type: "FRAUD_FLAGGED",
//           message: `Your activity was flagged as fraud due to (${result.reason})`,
//           meta: { fraud:result.fraud, status: result.status, }
//         });
//       } catch (err) {
//         notifError = err.message || "Error in sending notification";
//       }
//     }
//   }

//   if (!submitted) {
//     throw new ApiError(400, "Error in submitting task");
//   }

//   try {
//     await sendNotification({
//       recipient: assignment.assigned_by_user_id,
//       sender: submitted.submitted_by_user_id,
//       type: "TASK_SUBMITTED",
//       message: `${user.name} submitted task: ${assignment.title}`,
//       meta: { submissionId: submitted._id },
//     });
//   } catch (err) {
//     notifError = err.message || "Error in sending notification";
//   }

//   return { submitted, notifError };
// };

//this api is with proper side error handling
export const makeSubmission = async (req) => {
  const { user } = req;
  const { assignmentId, comment, reason } = req.body;
  const urlProofsFromRequest = req.body;
  const filesUploaded = req.files || [];

  if (!assignmentId) {
    throw new ApiError(400, "Assignment ID is required");
  }

  // fetch assignment
  const assignment = await taskAssignmentRepository.getTaskAssignmentById(
    assignmentId
  );
  if (!assignment) {
    throw new ApiError(404, "Assignment not found");
  }

  // duplicate submission guard
  if (await submissionRepository.getSubmissionByAssignmentId(assignmentId)) {
    throw new ApiError(400, "Submission already exists for this assignment");
  }

  if (!["Done", "Stuck"].includes(assignment.timer_status)) {
    throw new ApiError(
      400,
      "Task is not in a submittable state (Done or Stuck)"
    );
  }

  const now = new Date();
  if (
    assignment.deadline &&
    new Date(assignment.deadline) < now &&
    assignment.timer_status !== "Stuck"
  ) {
    throw new ApiError(
      400,
      "Your task is overdue, so you cannot submit it now"
    );
  }

  // === Prepare proofs (upload files / read URLs) ===
  const requiredProofs = assignment.proof || [];
  const processedSubmissionData = [];

  // Upload files sequentially (or in parallel if you prefer) but fail early if upload fails.
  for (const proofSpec of requiredProofs) {
    const { fieldName, type } = proofSpec;

    if (type === "url") {
      const urlValue = urlProofsFromRequest[fieldName];
      if (!urlValue) {
        throw new ApiError(400, `Missing required URL proof: ${fieldName}`);
      }
      processedSubmissionData.push({
        field_name: fieldName,
        proof_type: "url",
        url: urlValue,
        original_name: "URL Link",
      });
      continue;
    }

    // file-based proof
    const file = filesUploaded.find((f) => f.fieldname === fieldName);
    if (!file) {
      throw new ApiError(400, `Missing required file proof: ${fieldName}`);
    }

    // Decide resource type for cloudinary
    const resourceType =
      type === "image" ? "image" : type === "video" ? "video" : "auto";

    // Upload to cloudinary (still critical — we need URL to save)
    let uploadResult;
    try {
      uploadResult = await uploadOnCloudinary(file.path, resourceType);
    } catch (err) {
      console.error(`Cloudinary upload error for ${fieldName}`, err);
      throw new ApiError(500, `Failed to upload ${fieldName}.`);
    }

    if (!uploadResult || uploadResult.error) {
      console.error(
        `Cloudinary upload failed for ${fieldName}:`,
        uploadResult && uploadResult.error
      );
      throw new ApiError(500, `Failed to upload ${fieldName}.`);
    }

    // push processed proof
    processedSubmissionData.push({
      field_name: fieldName,
      proof_type: type,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      original_name: file.originalname,
      size: file.size,
    });

    // cleanup local file if any (best-effort)
    try {
      if (file && file.path) {
        const fs = require("fs").promises;
        await fs.unlink(file.path).catch(() => {});
      }
    } catch (e) {
      // non-critical clean-up failure, just log
      console.warn("Failed to delete temp file:", file?.path, e);
    }
  } // end for requiredProofs

  if (processedSubmissionData.length !== requiredProofs.length) {
    // defensive check (shouldn't happen because we throw above), kept for safety
    throw new ApiError(
      400,
      "A required proof was not submitted. Please provide all proofs."
    );
  }

  // === Build submission payload ===
  const ETAT = calculateETAT(assignment.timerStartTime, assignment.TAT);
  const submissionPayload = {
    organizationId: user.organizationId,
    submitted_by_user_id: user.id,
    task_assign_id: assignmentId,
    submission_data: processedSubmissionData,
    comment,
    ETAT,
  };

  if (ETAT > 0) {
    if (!reason) {
      throw new ApiError(400, "A reason is required when the task is overdue.");
    }
    submissionPayload.reason = { message: reason };
  }

  // === Create submission (CRITICAL) ===
  const submitted = await submissionRepository.createSubmission(submissionPayload);
  if (!submitted) {
    throw new ApiError(400, "Error in submitting task");
  }

  // === Do non-critical side-effects. Any errors here must NOT fail the API ===
  const sideEffectErrors = [];

  // 1) Update assignment status (best-effort)
  try {
    if (ETAT > 0) {
      const updated = await taskAssignmentRepository.updateTaskAssignment(
        assignmentId,
        { status: "Overdue" }
      );
      // attempt to send overdue notification (best-effort)
      try {
        if (updated && updated.status === "Overdue") {
          await sendNotification({
            recipient: updated.assigned_by_user_id,
            sender: updated.assigned_to_employee_id,
            type: "TASK_OVERDUE",
            message: `Task "${updated.title}" is overdue`,
            meta: {
              taskId: updated._id,
              TAT: updated.TAT,
              deadline: updated.deadline,
            },
          });
        }
      } catch (err) {
        console.error("Overdue notification failed:", err);
        sideEffectErrors.push({
          area: "notify_overdue",
          message: err.message || String(err),
        });
      }
    } else {
      // mark completed (best-effort)
      try {
        await taskAssignmentRepository.updateTaskAssignment(assignmentId, {
          status: "Completed",
        });
      } catch (err) {
        console.error("Marking assignment completed failed:", err);
        sideEffectErrors.push({
          area: "update_assignment_status",
          message: err.message || String(err),
        });
      }
    }
  } catch (err) {
    console.error("Updating task assignment (non-critical) failed:", err);
    sideEffectErrors.push({
      area: "update_task_assignment",
      message: err.message || String(err),
    });
  }

  // 2) Fraud check (best-effort for non-organizers)
  if (submitted && user.is_organizer === false) {
    try {
      const result = await checkFraudLogicEmployee(
        submitted.submitted_by_user_id,
        submitted.submission_data,
        submitted.task_assign_id,
        user.organizationId
      );

      if (result && result.fraud) {
        try {
          await sendNotification({
            recipient: submitted.submitted_by_user_id,
            sender: assignment.assigned_by_user_id,
            type: "FRAUD_FLAGGED",
            message: `Your activity was flagged as fraud due to (${result.reason})`,
            meta: { fraud: result.fraud, status: result.status },
          });
        } catch (err) {
          console.error("Fraud notification failed:", err);
          sideEffectErrors.push({
            area: "notify_fraud",
            message: err.message || String(err),
          });
        }
      }
    } catch (err) {
      console.error("Fraud check failed (non-critical):", err);
      sideEffectErrors.push({
        area: "fraud_check",
        message: err.message || String(err),
      });
    }
  }

  // 3) Task-submitted notification (best-effort)
  try {
    await sendNotification({
      recipient: assignment.assigned_by_user_id,
      sender: submitted.submitted_by_user_id,
      type: "TASK_SUBMITTED",
      message: `${user.name} submitted task: ${assignment.title}`,
      meta: { submissionId: submitted._id },
    });
  } catch (err) {
    console.error("Task submitted notification failed:", err);
    sideEffectErrors.push({
      area: "notify_task_submitted",
      message: err.message || String(err),
    });
  }

  // Return success + any non-critical side-effect errors (do not throw)
  return { submitted, sideEffectErrors };
};


export const getSubmissionById = async (req) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(404, "user id not found");
  }

  const submission = await submissionRepository.getSubmissionById(id);

  return submission;
};

export const getSubmissionsByUserId = async (req) => {
  const userId = req.user.id;

  if (!userId) {
    throw new ApiError(404, "user id not found");
  }

  const submissions = await submissionRepository.getSubmissionsByUserId(userId);

  return submissions;
};

export const getSubmissionByTaskAssignId = async (req) => {
  const taskAssignId = req.params.id;

  if (!taskAssignId) {
    throw new ApiError(404, "task assign id not provided");
  }

  const submissions = await submissionRepository.getSubmissionByAssignmentId(
    taskAssignId
  );

  return submissions;
};

export const getDepartmentAllSubmissions = async (req) => {
  const dep_id = req.params.id;

  if (!dep_id) {
    throw new ApiError(404, "department id not provided");
  }

  const submissions = await submissionRepository.getDepartmentAllSubmissions(
    dep_id
  );

  return submissions;
};

export const updateSubmission = async (req) => {
  const { id } = req.params;
  const updatedData = req.body;

  const updatedSubmission = await submissionRepository.updateSubmission(
    id,
    updatedData
  );

  if (!updatedSubmission) {
    throw new ApiError(404, "submission not found");
  }

  return updatedSubmission;
};

export const deleteSubmission = async (req) => {
  const { id } = req.params;

  const submission = await submissionRepository.getSubmissionsById(id);

  if (!submission) {
    throw new ApiError(404, "submission not found");
  }

  await submissionRepository.deleteSubmission(id);

  return { message: "Submission deleted successfully" };
};
