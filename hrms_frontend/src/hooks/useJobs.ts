import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { RootState, AppDispatch } from '../store';
import {
  createJob,
  updateJob,
  toggleJobStatus,
  getActiveJobs,
  getJobDetails,
  getJobDetailsBySlug,
  getOrganizationJobs,
  getOrganizationAllJobs,
  getOrganizationApplications,
  getJobApplications,
  applyForJob,
  updateApplicationStatus,
  getApplicationStats,
  setStep,
  updateJobDraft,
  clearJobDraft,
  clearError,
  clearSuccess
} from '@/features/job/jobPortalSlice';
import { CreateJobRequest, UpdateJobRequest, ApplicationCreateRequest, ApplicationStatusUpdate } from '../lib/types/api/job';

export const useJobManagement = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    currentJob,
    jobs,
    applications,
    organizationApplications,
    jobApplications,
    stats,
    loading,
    error,
    success,
    step,
    jobDraft,
    totalJobs,
    currentPage,
    totalPages,
    currentOrganization,
    organizationApplicationsCount,
    jobApplicationsCount
  } = useSelector((state: RootState) => state.jobPortal);

  const createNewJob = useCallback(async (jobData: CreateJobRequest) => {
    const result = await dispatch(createJob(jobData));
    return result;
  }, [dispatch]);

  const updateExistingJob = useCallback(async (jobId: string, jobData: UpdateJobRequest) => {
    const result = await dispatch(updateJob({ jobId, data: jobData }));
    return result;
  }, [dispatch]);

  const toggleJobActiveStatus = useCallback(async (jobId: string) => {
    const result = await dispatch(toggleJobStatus(jobId));
    return result;
  }, [dispatch]);

  const fetchActiveJobs = useCallback(async (params?: { page?: number; limit?: number; search?: string }) => {
    const result = await dispatch(getActiveJobs(params || {}));
    return result;
  }, [dispatch]);

  const fetchJobDetails = useCallback(async (jobId: string) => {
    const result = await dispatch(getJobDetails(jobId));
    return result;
  }, [dispatch]);

  const fetchJobDetailsBySlug = useCallback(async (orgAlias: string, jobId: string) => {
    const result = await dispatch(getJobDetailsBySlug({ orgAlias, jobId }));
    return result;
  }, [dispatch]);

  const fetchOrganizationJobs = useCallback(async (orgAlias: string, params?: { page?: number; limit?: number }) => {
    const result = await dispatch(getOrganizationJobs({ orgAlias, ...params }));
    return result;
  }, [dispatch]);

  const fetchOrganizationAllJobs = useCallback(async () => {
    const result = await dispatch(getOrganizationAllJobs());
    return result;
  }, [dispatch]);

  const fetchOrganizationApplications = useCallback(async () => {
    const result = await dispatch(getOrganizationApplications());
    return result;
  }, [dispatch]);

  const fetchJobApplications = useCallback(async (jobId: string) => {
    const result = await dispatch(getJobApplications(jobId));
    return result;
  }, [dispatch]);

  const applyForJobPosition = useCallback(async (applicationData: ApplicationCreateRequest) => {
    const result = await dispatch(applyForJob(applicationData));
    return result;
  }, [dispatch]);

  const updateAppStatus = useCallback(async (applicationId: string, statusData: ApplicationStatusUpdate) => {
    const result = await dispatch(updateApplicationStatus({ applicationId, statusData }));
    return result;
  }, [dispatch]);

  const fetchApplicationStats = useCallback(async () => {
    const result = await dispatch(getApplicationStats());
    return result;
  }, [dispatch]);

  const goToStep = useCallback((stepNumber: number) => {
    dispatch(setStep(stepNumber));
  }, [dispatch]);

  const updateDraft = useCallback((draftData: Partial<CreateJobRequest>) => {
    dispatch(updateJobDraft(draftData));
  }, [dispatch]);

  const resetDraft = useCallback(() => {
    dispatch(clearJobDraft());
  }, [dispatch]);

  const clearErrors = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const clearSuccessState = useCallback(() => {
    dispatch(clearSuccess());
  }, [dispatch]);

  return {
    
    currentJob,
    jobs,
    applications,
    organizationApplications,
    jobApplications,
    stats,
    loading,
    error,
    success,
    step,
    jobDraft,
    totalJobs,
    currentPage,
    totalPages,
    currentOrganization,
    organizationApplicationsCount,
    jobApplicationsCount,
    
    
    createNewJob,
    updateExistingJob,
    toggleJobActiveStatus,
    fetchActiveJobs,
    fetchJobDetails,
    fetchJobDetailsBySlug,
    fetchOrganizationJobs,
    fetchOrganizationAllJobs,
    fetchOrganizationApplications,
    fetchJobApplications,
    applyForJobPosition,
    updateAppStatus,
    fetchApplicationStats,
    
    
    goToStep,
    updateDraft,
    resetDraft,
    
    
    clearErrors,
    clearSuccessState
  };
};
