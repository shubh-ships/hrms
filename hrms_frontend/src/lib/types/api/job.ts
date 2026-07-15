export interface SalaryRange {
  min?: number;
  max?: number;
  currency?: string;
}

export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
export type ExperienceLevel = 'Entry' | 'Mid' | 'Senior' | 'Executive';
export type JobStatus = 'Active' | 'Closed' | 'Draft';
export type ApplicationStatus = 'Applied' | 'Shortlisted' | 'Rejected' | 'Interview' | 'Hired';

export interface Organization {
  _id: string;
  name: string;
  description?: string;
  org_alias: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobBasicInfo {
  title: string;
  description: string;
  location: string;
  employmentType: EmploymentType;
  department?: string;
  experienceLevel?: ExperienceLevel;
}

export interface JobDetails {
  requirements: string[];
  skillsRequired: string[];
  salaryRange?: SalaryRange;
  numberOfOpenings: number;
  applicationDeadline?: string;
}

export interface JobPublish {
  status: JobStatus;
}

export interface Job extends JobBasicInfo, JobDetails, JobPublish {
  _id: string;
  organizationId: string | Organization;
  postedBy: string;
  views: number;
  createdAt: string;
  updatedAt: string;
  organization?: Organization;
}

export interface CreateJobRequest extends JobBasicInfo, JobDetails, JobPublish {}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {}

export interface JobResponse {
  success: boolean;
  data: Job;
}

export interface JobsResponse {
  success: boolean;
  data: Job[];
  total: number;
  page: number;
  pages: number;
}

export interface OrganizationJobsResponse {
  success: boolean;
  data: {
    organization: Organization;
    jobs: Job[];
    totalJobs: number;
  };
}

export interface CandidateInfo {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  portfolio?: string;
  linkedin?: string;
  github?: string;
}

export interface Resume {
  public_id: string;
  url: string;
}

export interface Application {
  _id: string;
  job: Job;
  candidate: CandidateInfo;
  resume: Resume;
  coverLetter?: string;
  status: ApplicationStatus;
  applicationDate: string;
  interviewDate?: string;
  interviewNotes?: string;
  rating?: number;
  notes?: string;
  organizationId: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationCreateRequest {
  jobId: string;
  candidate: CandidateInfo;
  resume?: File;
  coverLetter?: string;
}

export interface ApplicationStatusUpdate {
  status: ApplicationStatus;
  interviewDate?: string;
  interviewNotes?: string;
  rating?: number;
  notes?: string;
}

export interface ApplicationStats {
  total: number;
  applied: number;
  shortlisted: number;
  rejected: number;
  interview: number;
  hired: number;
}

export interface OrganizationApplicationsResponse {
  organization: Organization;
  applications: Application[];
  applicationsCount: number;
}

export interface JobApplicationsResponse {
  Job: Job;
  applications: Application[];
  applicationsCount: number;
}

export interface JobState {
  currentJob: Job | null;
  jobs: Job[];
  applications: Application[];
  organizationApplications: Application[];
  jobApplications: Application[] ;
  stats: ApplicationStats | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  step: number;
  jobDraft: Partial<CreateJobRequest>;
  totalJobs: number;
  currentPage: number;
  totalPages: number;
  currentOrganization: Organization | null;
  organizationApplicationsCount: number;
  jobApplicationsCount: number;
}

export interface BaseResponse {
  success: boolean;
  message?: string;
}

export interface ApplicationResponse extends BaseResponse {
  data: Application;
}

export interface ApplicationsResponse extends BaseResponse {
  data: {
    applications: Application[];
    total: number;
    page: number;
    pages: number;
  };
}
