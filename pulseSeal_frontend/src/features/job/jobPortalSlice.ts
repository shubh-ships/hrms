import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Job,
  Organization,
  CreateJobRequest,
  UpdateJobRequest,
  JobResponse,
  JobsResponse,
  ApplicationCreateRequest,
  ApplicationStatusUpdate,
  ApplicationStats,
  JobState,
  Application,
  OrganizationApplicationsResponse,
  JobApplicationsResponse,
} from '@/lib/types/api/job';
import axiosClient from '@/lib/api/client';

const getAuthHeaders = (getState: any) => {
  const state = getState();
  const token = state.auth?.token || localStorage.getItem('token');
  return {
    token,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Cache-Control': 'no-cache',
    }
  };
};

export const createJob = createAsyncThunk(
  'job/create',
  async (jobData: CreateJobRequest, { rejectWithValue, getState }) => {
    try {
      const { headers } = getAuthHeaders(getState);
      const response = await axiosClient.post('/career', jobData, { headers });
     
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating job:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Failed to create job');
    }
  }
);

export const updateJob = createAsyncThunk(
  'job/update',
  async (
    { jobId, data }: { jobId: string; data: UpdateJobRequest },
    { rejectWithValue, getState }
  ) => {
    try {
      const { headers } = getAuthHeaders(getState);
      const response = await axiosClient.put(`/career/${jobId}`, data, { headers });

      return response.data.data;
    } catch (error: any) {
      console.error('Error updating job:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Failed to update job');
    }
  }
);




export const toggleJobStatus = createAsyncThunk(
  'job/toggleStatus',
  async (jobId: string, { rejectWithValue, getState }) => {
    
    try {
      const { headers } = getAuthHeaders(getState);
     
      
      const response = await axiosClient.patch(`/career/${jobId}`, {}, { headers });
      
     
      
      if (!response.data?.success) {
        console.error('API returned success: false');
        return rejectWithValue(response.data?.message || 'API request failed');
      }
      
      return response.data.data;
    } catch (error: any) {
      
      if (error.response) {
        return rejectWithValue(
          error.response.data?.message || 
          `Server error: ${error.response.status}`
        );
      } else if (error.request) {
        return rejectWithValue('Network error: No response from server');
      } else {
        return rejectWithValue(error.message || 'Failed to toggle job status');
      }
    }
  }
);


export const getActiveJobs = createAsyncThunk(
  'job/getActive',
  async ({ page = 1, limit = 10, search = '' }: { page?: number; limit?: number; search?: string } = {}, { rejectWithValue }) => {
    try {
      const params = { page: page.toString(), limit: limit.toString(), ...(search && { search }) };
      const response = await axiosClient.get('/career/jobs', { params });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching active jobs:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch active jobs');
    }
  }
);

export const getJobDetails = createAsyncThunk(
  'job/getDetails',
  async (jobId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/career/jobs/${jobId}`);
     
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching job details:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch job details');
    }
  }
);

export const getJobDetailsBySlug = createAsyncThunk(
  'job/getDetailsBySlug',
  async ({ orgAlias, jobId }: { orgAlias: string; jobId: string }, { rejectWithValue }) => {

    try {
      const response = await axiosClient.get(`/career/jobs/${jobId}`);

      
      if (response.data.data.organizationId?.org_alias !== orgAlias) {
        return rejectWithValue('Job not found for this organization');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching job details by slug:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch job details');
    }
  }
);

export const getOrganizationJobs = createAsyncThunk(
  'job/getOrganizationJobs',
  async ({ orgAlias, page = 1, limit = 10 }: { orgAlias: string; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const params = { page: page.toString(), limit: limit.toString() };
      const response = await axiosClient.get(`/career/organization/${orgAlias}`, { params });
       
      
      return {
        jobs: response.data.data.jobs,
        organization: response.data.data.organization,
        totalJobs: response.data.data.totalJobs,
        page: page,
        pages: Math.ceil(response.data.data.totalJobs / limit)
      };
    } catch (error: any) {
      console.error('Error fetching organization jobs:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch organization jobs');
    }
  }
);

export const getOrganizationApplications = createAsyncThunk(
  'job/getOrganizationApplications',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { headers } = getAuthHeaders(getState);
      
      const response = await axiosClient.get('/career/organization/applications/list', { headers });
     
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching organization applications:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch organization applications');
    }
  }
);

export const getJobApplications = createAsyncThunk(
  'job/getJobApplications',
  async (jobId: string, { rejectWithValue, getState }) => {
    try {
      const { headers } = getAuthHeaders(getState);
     
      const response = await axiosClient.get(`/career/Job/${jobId}`, { headers });
     ;
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching job applications:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch job applications');
    }
  }
);

export const getOrganizationAllJobs = createAsyncThunk(
  'job/getOrganizationAllJobs',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { headers } = getAuthHeaders(getState);
       
      const response = await axiosClient.get('/career/organization', { headers });
   
      
      return {
        jobs: response.data.data.jobs,
        organization: response.data.data.organization,
        totalJobs: response.data.data.totalJobs,
        page: 1,
        pages: 1
      };
    } catch (error: any) {
      console.error('Error fetching organization jobs:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch organization jobs');
    }
  }
);

export const applyForJob = createAsyncThunk(
  'job/apply',
  async (applicationData: ApplicationCreateRequest, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      
      formData.append('name', applicationData.candidate.name);
      formData.append('email', applicationData.candidate.email);
      if (applicationData.candidate.phone) formData.append('phone', applicationData.candidate.phone);
      if (applicationData.candidate.location) formData.append('location', applicationData.candidate.location);
      if (applicationData.candidate.portfolio) formData.append('portfolio', applicationData.candidate.portfolio);
      if (applicationData.candidate.linkedin) formData.append('linkedin', applicationData.candidate.linkedin);
      if (applicationData.candidate.github) formData.append('github', applicationData.candidate.github);
      
      if (applicationData.coverLetter) formData.append('coverLetter', applicationData.coverLetter);
      
      if (applicationData.resume) {
        formData.append('resume', applicationData.resume );
      }
      
      const response = await axiosClient.post(`/career/jobs/${applicationData.jobId}/apply`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error applying for job:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Failed to apply for job');
    }
  }
);

export const updateApplicationStatus = createAsyncThunk(
  'job/updateApplicationStatus',
  async (
    { applicationId, statusData }: { applicationId: string; statusData: ApplicationStatusUpdate },
    { rejectWithValue, getState }
  ) => {
    try {
      const { headers } = getAuthHeaders(getState);
 
      
      const response = await axiosClient.put(`/career/applications/${applicationId}/status`, statusData, { headers });

      return response.data.data;
    } catch (error: any) {
      console.error('Error updating application status:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Failed to update application status');
    }
  }
);

export const getApplicationStats = createAsyncThunk(
  'job/getApplicationStats',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { headers } = getAuthHeaders(getState);
      const response = await axiosClient.get('/career/stats/applications', { headers });
   
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching application stats:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch application statistics');
    }
  }
);

const initialState: JobState = {
  currentJob: null,
  jobs: [],
  applications: [],
  organizationApplications: [],       
  jobApplications: [],                
  stats: null,
  loading: false,
  error: null,
  success: false,
  step: 1,
  jobDraft: {},
  totalJobs: 0,
  currentPage: 1,
  totalPages: 1,
  currentOrganization: null,
  organizationApplicationsCount: 0,   
  jobApplicationsCount: 0             
};

const jobSlice = createSlice({
  name: 'job',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    resetJob: (state) => {
      state.currentJob = null;
      state.error = null;
      state.success = false;
      state.step = 1;
      state.jobDraft = {};
    },
    setStep: (state, action: PayloadAction<number>) => {
      state.step = action.payload;
    },
    updateJobDraft: (state, action: PayloadAction<Partial<CreateJobRequest>>) => {
      state.jobDraft = { ...state.jobDraft, ...action.payload };
    },
    clearJobDraft: (state) => {
      state.jobDraft = {};
      state.step = 1;
    },
    setCurrentJob: (state, action: PayloadAction<Job | null>) => {
      state.currentJob = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createJob.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createJob.fulfilled, (state, action: PayloadAction<Job>) => {
        state.loading = false;
        state.currentJob = action.payload;
        state.jobs.unshift(action.payload);
        state.success = true;
        state.step = 1;
        state.jobDraft = {};
        state.totalJobs += 1;
      })
      .addCase(createJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })
      .addCase(updateJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateJob.fulfilled, (state, action: PayloadAction<Job>) => {
        state.loading = false;
        state.currentJob = action.payload;
        const index = state.jobs.findIndex(job => job._id === action.payload._id);
        if (index !== -1) {
          state.jobs[index] = action.payload;
        }
        state.success = true;
      })
      .addCase(updateJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(toggleJobStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleJobStatus.fulfilled, (state, action: PayloadAction<Job>) => {
        state.loading = false;
        const index = state.jobs.findIndex(job => job._id === action.payload._id);
        if (index !== -1) {
          state.jobs[index] = action.payload;
        }
        if (state.currentJob && state.currentJob._id === action.payload._id) {
          state.currentJob = action.payload;
        }
        state.success = true;
      })
      .addCase(toggleJobStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(getActiveJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getActiveJobs.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.jobs = action.payload.jobs || action.payload;
        state.totalJobs = action.payload.total || action.payload.length;
        state.currentPage = action.payload.page || 1;
        state.totalPages = action.payload.pages || 1;
      })
      .addCase(getActiveJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(getJobDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getJobDetails.fulfilled, (state, action: PayloadAction<Job>) => {
        state.loading = false;
        state.currentJob = action.payload;
      })
      .addCase(getJobDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(getJobDetailsBySlug.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getJobDetailsBySlug.fulfilled, (state, action: PayloadAction<Job>) => {
        state.loading = false;
        state.currentJob = action.payload;
      })
      .addCase(getJobDetailsBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(getOrganizationJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrganizationJobs.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.jobs = action.payload.jobs;
        state.totalJobs = action.payload.totalJobs;
        state.currentPage = action.payload.page;
        state.totalPages = action.payload.pages;
      })
      .addCase(getOrganizationJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(getOrganizationApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrganizationApplications.fulfilled, (state, action: PayloadAction<OrganizationApplicationsResponse>) => {
        state.loading = false;
        state.organizationApplications = action.payload.applications;
        state.currentOrganization = action.payload.organization;
        state.organizationApplicationsCount = action.payload.applicationsCount;
      })
      .addCase(getOrganizationApplications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(getJobApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getJobApplications.fulfilled, (state, action: PayloadAction<JobApplicationsResponse>) => {
        state.loading = false;
        state.jobApplications = action.payload.applications;
        state.currentJob = action.payload.Job || action.payload.Job;
        state.jobApplicationsCount = action.payload.applicationsCount;
      })
      .addCase(getJobApplications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(getOrganizationAllJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrganizationAllJobs.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.jobs = action.payload.jobs;
        state.totalJobs = action.payload.totalJobs;
        state.currentPage = action.payload.page;
        state.totalPages = action.payload.pages;
        state.currentOrganization = action.payload.organization;
      })
      .addCase(getOrganizationAllJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(applyForJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyForJob.fulfilled, (state, action: PayloadAction<Application>) => {
        state.loading = false;
        state.applications.push(action.payload);
        state.success = true;
      })
      .addCase(applyForJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(updateApplicationStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateApplicationStatus.fulfilled, (state, action: PayloadAction<Application>) => {
        state.loading = false;
        
        const index = state.applications.findIndex(app => app._id === action.payload._id);
        if (index !== -1) {
          state.applications[index] = action.payload;
        }
        
        const orgIndex = state.organizationApplications.findIndex(app => app._id === action.payload._id);
        if (orgIndex !== -1) {
          state.organizationApplications[orgIndex] = action.payload;
        }
        
        const jobIndex = state.jobApplications.findIndex(app => app._id === action.payload._id);
        if (jobIndex !== -1) {
          state.jobApplications[jobIndex] = action.payload;
        }
        
        state.success = true;
      })
      .addCase(updateApplicationStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(getApplicationStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getApplicationStats.fulfilled, (state, action: PayloadAction<ApplicationStats>) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(getApplicationStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
  }
});

export const {
  clearError,
  clearSuccess,
  resetJob,
  setStep,
  updateJobDraft,
  clearJobDraft,
  setCurrentJob
} = jobSlice.actions;

export default jobSlice.reducer;
