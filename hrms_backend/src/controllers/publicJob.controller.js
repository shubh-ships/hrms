import asyncHandler from "../middlewares/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import Job from "../models/job.Model.js";
import Application from "../models/application.Model.js";
import Organization from "../models/organization.Model.js";
import { sendEmail } from "../utils/emailService.js";
import { uploadToCloudinary } from "../middlewares/cloudinary.js";

export const createJob = asyncHandler(async (req, res) => {
    const jobData = {
      ...req.body,
      organizationId: req.user.organizationId,
      postedBy: req.user._id
    };

    const job = await Job.create(jobData);
    
    successResponse(res, 'Job posted successfully', job, 201);
});

export const updateJob = asyncHandler(async (req, res) => {
    const job = await Job.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!job) {
      throw new ApiError(404, 'Job not found');
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    successResponse(res, 'Job updated successfully', updatedJob);
});

export const toggleJobActiveStatus = asyncHandler(async (req, res) => {
    const job = await Job.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });
    if (!job) {
      throw new ApiError(404, 'Job not found');
    }

    const updatedJob = await Job.findByIdAndUpdate(
  req.params.id,
  { 
    status: job.status === 'Active' ? 'Closed' : 'Active'
  },
  { new: true, runValidators: true }
);

    if (updatedJob.status === "Closed") {
      await notifyApplicantsAboutJobClosure(job._id);
    }

    successResponse(
      res, 
      `Job ${updatedJob.status === 'Active' ? 'activated' : 'deactivated'} successfully`, 
      {
        id: updatedJob._id,
        status: updatedJob.status
      }
    );
});


export const getActiveJobs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 12, search, location, department } = req.query;
    
    const filter = { status: 'Active' };
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skillsRequired: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    
    if (department) {
      filter.department = { $regex: department, $options: 'i' };
    }

    const jobs = await Job.find(filter)
      .populate('organizationId', 'name description org_alias')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-notes'); // Exclude sensitive fields

    const total = await Job.countDocuments(filter);

    successResponse(res, 'Active jobs retrieved successfully', {
      jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
});

export const jobDetails = asyncHandler(async (req, res) => {
    const job = await Job.findOne({ 
      _id: req.params.id, 
      status: 'Active' 
    }).populate('organizationId', 'name description org_alias');

    if (!job) {
      throw new ApiError(404, 'Job not found or no longer active');
    }

    // Increment view count
    await Job.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    successResponse(res, 'Job details retrieved successfully', job);
});


export const getOrganizationActiveJobs = asyncHandler(async (req, res) => {
    const organization = await Organization.findOne({org_alias:req.params.org_alias})
      .select('name description org_alias');

    if (!organization) {
      throw new ApiError(404, 'Organization not found');
    }

    const jobs = await Job.find({ 
      organizationId: organization._id,
      status: 'Active'
    }).select(" -notes ")

    successResponse(res, 'Organization active jobs retrieved successfully', {
      organization,
      jobs,
      totalJobs: jobs.length
    });
});

export const getOrganizationAllJobs = asyncHandler(async (req, res) => {
    const organization = await Organization.findById(req.user.organizationId)
      .select('name description org_alias');

    if (!organization) {
      throw new ApiError(404, 'Organization not found');
    }

    const jobs = await Job.find({ 
      organizationId: organization._id,
    }).select(" -notes ")

    successResponse(res, 'Organization all jobs retrieved successfully', {
      organization,
      jobs,
      totalJobs: jobs.length
    });
});

export const listOrgApplications = asyncHandler(async(req,res)=>{
  const organization = await Organization.findById(req.user.organizationId)
      .select('name description org_alias');

    if (!organization) {
      throw new ApiError(404, 'Organization not found');
    }

    const applications = await Application.find({ 
      organizationId: organization._id,
    })

    successResponse(res, 'Organization applications retrieved successfully', {
      organization,
      applications,
      applicationsCount: applications.length
    });
})

export const listJobApplications = asyncHandler(async(req,res)=>{
  const job = await Job.findById(req.params.jobId)

    if (!job) {
      throw new ApiError(404, 'Job not found');
    }

    const applications = await Application.find({ 
      job: req.params.jobId,
    })

    successResponse(res, 'Job applications retrieved successfully', {
      job,
      applications,
      applicationsCount: applications.length
    });
})



export const applyForJob = asyncHandler(async (req, res) => {
 
    const job = await Job.findOne({ 
      _id: req.params.id, 
      status: 'Active' 
    }).populate('organizationId', 'name description org_alias');

    if (!job) {
      throw new ApiError(404, 'Job not found or no longer accepting applications');
    }

    // Check if application deadline has passed
    if (job.applicationDeadline && new Date() > job.applicationDeadline) {
      throw new ApiError(400, 'Application deadline has passed');
    }

    const { name, email, phone, location, portfolio, linkedin, github,coverLetter } = req.body;

    // Check if candidate has already applied for this job
    const existingApplication = await Application.findOne({
      job: req.params.id,
      'candidate.email': email
    });

    if (existingApplication) {
      throw new ApiError(400, 'You have already applied for this job');
    }

    // Handle file upload (resume)
    let resumeData = {};
    if (req.file) {
      console.log(req.file)
    const cloudinaryResult = await uploadToCloudinary(req.file);

    if (!cloudinaryResult) {
        throw new ApiError(500, 'Error uploading resume file');
      }
      resumeData = {
        public_id: cloudinaryResult.public_id,
        url: cloudinaryResult.secure_url 
      };
    }

    const applicationData = {
      job: req.params.id,
      candidate: {
        name,
        email,
        phone,
        location,
        portfolio,
        linkedin,
        github
      },
      coverLetter,
      resume: resumeData,
      organizationId: job.organizationId
    };

    const application = await Application.create(applicationData);

    // Send confirmation email to candidate
    await sendApplicationConfirmation(application, job);

    successResponse(res, 'Application submitted successfully', application, 201);
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
    const { 
        status, 
        interviewDate, 
        interviewNotes, 
        notes, 
        rating 
    } = req.body;

    if (!status) {
        throw new ApiError(400, 'Status is required');
    }
    
    const application = await Application.findOne({
        _id: req.params.id,
        organizationId: req.user.organizationId
    }).populate('job').populate('organizationId', 'name description org_alias');

    if (!application) {
        throw new ApiError(404, 'Application not found or you do not have permission to update it');
    }

    const updateData = { status };
    
    if (interviewDate) {
        updateData.interviewDate = new Date(interviewDate);
    }
    if (interviewNotes !== undefined) {
        updateData.interviewNotes = interviewNotes;
    }
    if (notes !== undefined) {
        updateData.notes = notes;
    }
    if (rating !== undefined) {
        updateData.rating = rating;
    }

    const updatedApplication = await Application.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    ).populate('job');

    if (!updatedApplication) {
        throw new ApiError(500, 'Failed to update application');
    }

    try {
        await sendStatusEmail(application, status, interviewDate);
    } catch (emailError) {
        console.error('Email sending failed:', emailError);
    }

    successResponse(res, `Application ${status.toLowerCase()} successfully`, updatedApplication);
});

export const getApplicationStats = asyncHandler(async (req, res) => {
    const stats = await Application.aggregate([
      {
        $match: {
          organization: req.user.organization._id || req.user.organization
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalApplications = await Application.countDocuments({
      organization: req.user.organization
    });

    successResponse(res, 'Application stats retrieved successfully', {
      stats,
      total: totalApplications
    });
});

export const generateJobListingPage = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const { alias } = req.body;

    // Validate organization exists and user has access
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new ApiError(404, 'Organization not found');
    }

    // Check if alias is provided and valid
    if (!alias) {
      throw new ApiError(400, 'Organization alias is required');
    }

    // Validate alias format
    const aliasRegex = /^[a-z0-9-]+$/;
    if (!aliasRegex.test(alias)) {
      throw new ApiError(400, 'Alias can only contain lowercase letters, numbers, and hyphens');
    }

    // Check if alias is already taken
    const existingOrg = await Organization.findOne({ 
      alias: alias.toLowerCase(),
      _id: { $ne: organizationId }
    });
    
    if (existingOrg) {
      throw new ApiError(400, 'This alias is already taken');
    }

    // Generate page URL
    const baseUrl = process.env.BASE_URL || 'https://pulseseal.in';
    const pageUrl = `${baseUrl}/jobs/${alias.toLowerCase()}`;

    // Update organization with alias and page info
    organization.alias = alias.toLowerCase();
    organization.publicJobPage = {
      isActive: true,
      generatedAt: new Date(),
      pageUrl: pageUrl
    };

    await organization.save();

    successResponse(res, 'Job listing page generated successfully', {
      pageUrl: pageUrl,
      alias: organization.alias,
      generatedAt: organization.publicJobPage.generatedAt
    });
});

async function sendApplicationConfirmation(application, job) {
  const emailData = {
    to: application.candidate.email,
    subject: `Application Received - ${job.title}`,
    template: 'applicationConfirmation',
    context: {
      candidateName: application.candidate.name,
      jobTitle: job.title,
      companyName: job.organizationId.name,
      applicationDate: new Date().toLocaleDateString()
    }
  };

  await sendEmail(emailData);
}

async function sendStatusEmail(application, status, interviewDate = null) {
  const emailTemplates = {
    Shortlisted: {
      subject: 'Application Shortlisted - Next Steps',
      template: 'shortlisted'
    },
    Rejected: {
      subject: 'Update on Your Job Application',
      template: 'rejected'
    },
    Interview: {
      subject: 'Interview Invitation',
      template: 'interview'
    },
    Hired: {
      subject: 'Job Offer - Congratulations!',
      template: 'hired'
    }
  };

  const template = emailTemplates[status];
  if (!template) return;

  const emailData = {
    to: application.candidate.email,
    subject: template.subject,
    template: template.template,
    context: {
      candidateName: application.candidate.name,
      jobTitle: application.job.title,
      companyName: application.organizationId.name,
      interviewDate: interviewDate,
      notes: application.notes
    }
  };

  await sendEmail(emailData);
}

async function notifyApplicantsAboutJobClosure(jobId) {
  try {
    const applications = await Application.find({ 
      job: jobId,
      status: { $in: ['Applied', 'Shortlisted', 'Interview'] }
    }).populate("organizationId","name").populate('job',"title");

    for (const application of applications) {
      const emailData = {
        to: application.candidate.email,
        subject: `Update on Your Application - ${application.job.title}`,
        template: 'jobClosedNotification',
        context: {
          candidateName: application.candidate.name,
          jobTitle: application.job.title,
          companyName: application.organizationId.name
        }
      };

      await sendEmail(emailData);
    }
    } catch (error) {
    console.error('Error notifying applicants:', error);
    // Don't throw error to avoid affecting the main API response
  }
}