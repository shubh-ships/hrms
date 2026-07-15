import express from 'express';
import { applyForJob, createJob, toggleJobActiveStatus, getActiveJobs, getOrganizationActiveJobs, jobDetails, updateJob, updateApplicationStatus, getApplicationStats, getOrganizationAllJobs,listOrgApplications,listJobApplications } from '../controllers/publicJob.controller.js';
import { protect } from '../middlewares/auth.js';
import { resumeUpload } from '../middlewares/multer.js';

const router = express.Router();

router.post("/",protect,createJob);

router.put("/:id",protect,updateJob);

router.patch("/:id",protect,toggleJobActiveStatus);

router.get('/jobs',getActiveJobs);

router.get('/jobs/:id', jobDetails);

router.post('/jobs/:id/apply',resumeUpload.single('resume'), applyForJob);

router.get('/organization/:org_alias',getOrganizationActiveJobs);

router.get('/organization',protect,getOrganizationAllJobs);

router.get("/organization/applications/list",protect,listOrgApplications)

router.get("/Job/:jobId",protect,listJobApplications)

router.put('/applications/:id/status',protect, updateApplicationStatus);

router.get('/stats/applications',protect, getApplicationStats);



export default router;