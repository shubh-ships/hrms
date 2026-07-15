import { getFileSize, isImageBlank, hashURL } from '../utils/fraudUtils.js';
import { FraudRepo, listFraudsbyOrgId,listDepartmentFrauds,cleanFraudByFraudId,fraudDetailById,removeFraudFlagBytaskAssignId, fraudDetailBytaskAssignId } from '../repositories/fraud.repository.js';
import FraudDetection from '../models/fraudDetection.Model.js';
import Submission from '../models/submission.Model.js';
import ApiError from '../utils/apiError.js';
import TaskAssignment from '../models/taskAssignment.Model.js';

// export async function checkFraud(userId, proofs, assignmentId,department_id,organization_id) {
//     for (const proof of proofs) {
//         const isLink = proof.proof_type === 'url' && proof.url.startsWith('https');
//       console.log(proof.url.startsWith('https'),'proof url')
//     if (isLink) {
//       const hash = hashURL(proof.url);  
//       const fraudType = `Link Used: ${hash}`;

//       const alreadyUsed = await FraudDetection.findOne({ fraudType });
     
//       const isDuplicate=await Submission.findOne({'submission_data.url':proof.url})
     
//       if (alreadyUsed||isDuplicate) {
//           const flagged = await FraudRepo.logFraud(userId, fraudType, assignmentId,department_id,organization_id);
//           return { 
//               isFraud: flagged ? true : false, 
//               status: flagged.status,
//               reason: 'Duplicate link used'
//             };
//         }
//     //   await FraudRepo.logFraud(userId, fraudType, assignmentId,department_id,organization_id);
//       continue; 
//     }
//     // const size = await getFileSize(proof.size);
//     if (proof?.size < 200 * 1024) {
//       const flagged = await FraudRepo.logFraud(userId, 'File Size < 10KB', assignmentId,department_id,organization_id);
//       return { 
//         isFraud: flagged ? true : false,
//         status: flagged.status,
//         reason: 'File too small' 
//     };
//     }
//     const blank = await isImageBlank(proof.url);
//     if (blank) {
//       const flagged = await FraudRepo.logFraud(userId, 'Image is Blank (White or Black)', assignmentId,department_id,organization_id);

//       return { 
//         isFraud: true, 
//         status: flagged.status,
//         reason: 'Blank image'
//      };
//     }
//   }

//   return { isFraud: false };
// }

function normalizeUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    let hostname = url.hostname.replace(/^www\./, '').toLowerCase();
    // Remove both trailing and duplicate slashes, ignore query, fragment
    let pathname = url.pathname.replace(/\/+$/, '');
    return `${url.protocol.toLowerCase()}//${hostname}${pathname}`;
  } catch (error) {
    return rawUrl; // fallback for invalid URLs
  }
}

export async function checkFraud(userId, proofs, assignmentId, organization_id) {
  // Fetch all submissions for the organization
  const submissions = await Submission.find({
    organizationId: organization_id,
    task_assign_id: { $ne: assignmentId },
  }).select("submission_data");

  // Combine all submission_data arrays into one
  const allSubmissionData = submissions.flatMap(sub => sub.submission_data ?? []);

  for (const proof of proofs) {
    const isLink = proof.proof_type === 'url' && proof.url?.startsWith('https');
    if (isLink) {
      const normalizedProofUrl = normalizeUrl(proof.url);
      const isDuplicateLink = allSubmissionData.some(
        sub =>
          sub.proof_type === 'url' &&
          normalizeUrl(sub.url) === normalizedProofUrl
      );

      if (isDuplicateLink) {
        const fraudType = `Link Used: ${proof.url}`;
        const flagged = await FraudRepo.logFraud(
          userId,
          fraudType,
          assignmentId,
          organization_id
        );
        return {
          isFraud: !!flagged,
          status: flagged.status,
          reason: 'Duplicate link used',
        };
      }
      continue;
    }

    if (proof?.size < 10 * 1024) {
      const flagged = await FraudRepo.logFraud(
        userId,
        'File Size < 10KB',
        assignmentId,
        organization_id
      );
      return {
        isFraud: !!flagged,
        status: flagged.status,
        reason: 'File too small',
      };
    }

    const blank = await isImageBlank(proof.url);
    if (blank) {
      const flagged = await FraudRepo.logFraud(
        userId,
        'Image is Blank (White or Black)',
        assignmentId,
        organization_id
      );
      return {
        isFraud: true,
        status: flagged.status,
        reason: 'Blank image',
      };
    }
  }

  return { isFraud: false };
}


export const removeFraudFlag = async(taskAssignId)=>{
  // const fraud = await fraudDetailBytaskAssignId(taskAssignId);
  // if(!fraud){
  //   throw new ApiError(404,"No fraud found for this task assignment")
  // }
  const removed = await removeFraudFlagBytaskAssignId(taskAssignId);
  return removed;
}

export const listAllFrauds = async(req)=>{
    const id = req.params.org_id;

    if(!id){
        throw new ApiError(400,"organization id is required")
    }

    const frauds = await listFraudsbyOrgId(id);

    return frauds;
}

export const departmentFrauds = async(req,res)=>{
    const { assignableUsers, organizationId } = req.user;

  if (!assignableUsers || assignableUsers.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No assignable users found",
      data: [],
    });
  }

  const assignableUserIds = assignableUsers.map(user => user._id);

  const frauds = await listDepartmentFrauds(assignableUserIds, organizationId);

  return frauds;
}

export const cleanFraud = async(req)=>{
    const id = req.params.fraud_id;
    const {status} = req.body;

    const cleaned = await cleanFraudByFraudId(id,{status})

    return cleaned;
}

export const fraudDetail = async(req)=>{
    const id = req.params.fraud_id;

    const fraud = await fraudDetailById(id);

    return fraud;
}





