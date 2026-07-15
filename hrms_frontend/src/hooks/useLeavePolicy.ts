import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { 
  createLeavePolicy, 
  fetchLeavePolicies, 
  fetchLeavePolicyById, 
  updateLeavePolicy, 
  deleteLeavePolicy,
  clearLeavePolicyError,
  clearCurrentPolicy,
  clearLeavePolicies,
  clearSuccess,
  resetLeavePolicyState
} from '../features/leavePolicy/leavePolicySlice';

import { CreateLeavePolicyRequest, UpdateLeavePolicyRequest } from '@/lib/types/api/leavePolicy';

export const useLeavePolicy = () => {
  const dispatch = useDispatch<AppDispatch>();
  const leavePolicyState = useSelector((state: RootState) => state.leavePolicy);

  const handleCreateLeavePolicy = useCallback((policyData: CreateLeavePolicyRequest) => {
    return dispatch(createLeavePolicy(policyData));
  }, [dispatch]);

  const handleFetchLeavePolicies = useCallback(() => {
    return dispatch(fetchLeavePolicies());
  }, [dispatch]);

  const handleFetchLeavePolicyById = useCallback((policyId: string) => {
    return dispatch(fetchLeavePolicyById(policyId));
  }, [dispatch]);

  const handleUpdateLeavePolicy = useCallback((policyId: string, policyData: UpdateLeavePolicyRequest) => {
    return dispatch(updateLeavePolicy({ policyId, policyData }));
  }, [dispatch]);

  const handleDeleteLeavePolicy = useCallback((policyId: string) => {
    return dispatch(deleteLeavePolicy(policyId));
  }, [dispatch]);

  const handleClearError = useCallback(() => {
    dispatch(clearLeavePolicyError());
  }, [dispatch]);

  const handleClearPolicies = useCallback(() => {
    dispatch(clearLeavePolicies());
  }, [dispatch]);

  const handleClearCurrentPolicy = useCallback(() => {
    dispatch(clearCurrentPolicy());
  }, [dispatch]);

  const handleResetState = useCallback(() => {
    dispatch(resetLeavePolicyState());
  }, [dispatch]);

  const handleClearSuccess = useCallback(() => {
    dispatch(clearSuccess());
  }, [dispatch]);

  return {
    ...leavePolicyState,
    createLeavePolicy: handleCreateLeavePolicy,
    fetchLeavePolicies: handleFetchLeavePolicies,
    fetchLeavePolicyById: handleFetchLeavePolicyById,
    updateLeavePolicy: handleUpdateLeavePolicy,
    deleteLeavePolicy: handleDeleteLeavePolicy,
    clearError: handleClearError,
    clearSuccess: handleClearSuccess,
    clearLeavePolicyError: handleClearError,
    clearPolicies: handleClearPolicies,
    clearCurrentPolicy: handleClearCurrentPolicy,
    resetState: handleResetState
  };
};