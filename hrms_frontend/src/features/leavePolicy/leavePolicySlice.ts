import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  LeavePolicy, 
  LeavePolicyState, 
  CreateLeavePolicyRequest, 
  UpdateLeavePolicyRequest,
} from '../../lib/types/api/leavePolicy';
import axiosClient from '@/lib/api/client';

const initialState: LeavePolicyState = {
  policies: [],
  currentPolicy: null,
  loading: false,
  error: null,
  success: false,
};

export const createLeavePolicy = createAsyncThunk(
  'leavePolicy/create',
  async (policyData: CreateLeavePolicyRequest, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/leave-policy', policyData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create leave policy'
      );
    }
  }
);

export const fetchLeavePolicies = createAsyncThunk(
  'leavePolicy/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get('/leave-policy/organization', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to fetch leave policies'
      );
    }
  }
);

export const fetchLeavePolicyById = createAsyncThunk(
  'leavePolicy/fetchById',
  async (policyId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/leave-policy/${policyId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to fetch leave policy'
      );
    }
  }
);

export const updateLeavePolicy = createAsyncThunk(
  'leavePolicy/update',
  async ({ policyId, policyData }: { policyId: string; policyData: UpdateLeavePolicyRequest }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(`/leave-policy/${policyId}`, policyData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update leave policy'
      );
    }
  }
);

export const deleteLeavePolicy = createAsyncThunk(
  'leavePolicy/delete',
  async (policyId: string, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`/leave-policy/${policyId}`);
      return policyId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to delete leave policy'
      );
    }
  }
);

const leavePolicySlice = createSlice({
  name: 'leavePolicy',
  initialState,
  reducers: {
    setCurrentPolicy: (state, action: PayloadAction<LeavePolicy | null>) => {
      state.currentPolicy = action.payload;
    },
    clearLeavePolicyError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    clearCurrentPolicy: (state) => {
      state.currentPolicy = null;
    },
    clearLeavePolicies: (state) => {
      state.policies = [];
    },
    resetLeavePolicyState: () => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(createLeavePolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createLeavePolicy.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.policies.push(action.payload.data);
      })
      .addCase(createLeavePolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(fetchLeavePolicies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeavePolicies.fulfilled, (state, action) => {
        state.loading = false;
        state.policies = action.payload.data || action.payload;
      })
      .addCase(fetchLeavePolicies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(fetchLeavePolicyById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeavePolicyById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPolicy = action.payload.data || action.payload;
      })
      .addCase(fetchLeavePolicyById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(updateLeavePolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateLeavePolicy.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const updatedPolicy = action.payload.data || action.payload;
        const index = state.policies.findIndex(policy => policy._id === updatedPolicy._id);
        if (index !== -1) {
          state.policies[index] = updatedPolicy;
        }
        if (state.currentPolicy && state.currentPolicy._id === updatedPolicy._id) {
          state.currentPolicy = updatedPolicy;
        }
      })
      .addCase(updateLeavePolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(deleteLeavePolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteLeavePolicy.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.policies = state.policies.filter(policy => policy._id !== action.payload);
        if (state.currentPolicy && state.currentPolicy._id === action.payload) {
          state.currentPolicy = null;
        }
      })
      .addCase(deleteLeavePolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setCurrentPolicy, 
  clearLeavePolicyError,
  clearSuccess,
  clearCurrentPolicy,
  clearLeavePolicies,
  resetLeavePolicyState
} = leavePolicySlice.actions;

export default leavePolicySlice.reducer;