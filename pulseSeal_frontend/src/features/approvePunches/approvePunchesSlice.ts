import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from '@/lib/api/client';
import { RootState } from '../../store';

// TYPES
export interface PendingRecord {
  id: string;
  _id?: string;
  userId: string;
  userName?: string;
  employeeId?: string;
  department?: string;
  date: string;
  status?: string;
  scans?: Array<{
    time: string;
    type: 'IN' | 'OUT';
    sessionMinutes?: number;
    breakMinutes?: number;
  }>;
  totalWorkMinutes?: number;
  totalBreakMinutes?: number;
  lateLoginMinutes?: number;
  earlyLogoutMinutes?: number;
  overtimeMinutes?: number;
  shiftSnapshot?: {
    shiftName?: string;
  } | null;
  approvalType?: string;
}

interface ApprovePunchesState {
  pendingRecords: PendingRecord[];
  loading: boolean;
  approveLoading: boolean;
  rejectLoading: boolean;
  error: string | null;
}

const initialState: ApprovePunchesState = {
  pendingRecords: [],
  loading: false,
  approveLoading: false,
  rejectLoading: false,
  error: null,
};

// THUNK 1: GET /daily/pending (Fetches all pending attendance records)

export const fetchPendingApprovals = createAsyncThunk(
  'approvePunches/fetchPending',
  async (
    params: {
      startDate?: string;
      endDate?: string;
      userIds?: string;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosClient.get('/facescan/pending', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch pending approvals'
      );
    }
  }
);

// THUNK 2: PUT /daily/approve/:recordId (Approves a single attendance record)

export const approveAttendanceRecord = createAsyncThunk(
  'approvePunches/approve',
  async (
    {
      recordId,
      status,
      remarks,
      fineAmount,
      overtimePayMinutes,
    }: {
      recordId: string;
      status: 'PRESENT' | 'HALF_DAY' | 'ABSENT';
      remarks?: string;
      fineAmount?: number;
      overtimePayMinutes?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosClient.put(`/facescan/approve/${recordId}`, {
        status,
        remarks,
        fineAmount,
        overtimePayMinutes,
      });
      return { recordId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to approve attendance'
      );
    }
  }
);

// THUNK 3: PUT /daily/reject/:recordId (Rejects a single attendance record)

export const rejectAttendanceRecord = createAsyncThunk(
  'approvePunches/reject',
  async (
    {
      recordId,
      remarks,
      fineAmount,
    }: {
      recordId: string;
      remarks?: string;
      fineAmount?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosClient.put(`/facescan/reject/${recordId}`, {
        remarks,
        fineAmount,
      });
      return { recordId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to reject attendance'
      );
    }
  }
);

// SLICE

const approvePunchesSlice = createSlice({
  name: 'approvePunches',
  initialState,
  reducers: {
    clearApprovePunchesError: (state) => {
      state.error = null;
    },
    resetApprovePunchesState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // ── fetchPendingApprovals ──
      .addCase(fetchPendingApprovals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingApprovals.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingRecords = Array.isArray(action.payload?.data?.records)
          ? action.payload.data.records
          : [];
      })
      .addCase(fetchPendingApprovals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      //  approveAttendanceRecord 
      .addCase(approveAttendanceRecord.pending, (state) => {
        state.approveLoading = true;
        state.error = null;
      })
      .addCase(approveAttendanceRecord.fulfilled, (state, action) => {
        state.approveLoading = false;
        // Remove the approved record from the pending list
        state.pendingRecords = state.pendingRecords.filter(
          (r) => r.id !== action.payload.recordId
        );
      })
      .addCase(approveAttendanceRecord.rejected, (state, action) => {
        state.approveLoading = false;
        state.error = action.payload as string;
      })

      // rejectAttendanceRecord 
      .addCase(rejectAttendanceRecord.pending, (state) => {
        state.rejectLoading = true;
        state.error = null;
      })
      .addCase(rejectAttendanceRecord.fulfilled, (state, action) => {
        state.rejectLoading = false;
        // Remove the rejected record from the pending list
        state.pendingRecords = state.pendingRecords.filter(
          (r) => r.id !== action.payload.recordId
        );
      })
      .addCase(rejectAttendanceRecord.rejected, (state, action) => {
        state.rejectLoading = false;
        state.error = action.payload as string;
      });
  },
});

// SELECTORS

export const selectPendingRecords = (state: RootState) =>
  state.approvePunches.pendingRecords;

export const selectApprovePunchesLoading = (state: RootState) =>
  state.approvePunches.loading;

export const selectApproveLoading = (state: RootState) =>
  state.approvePunches.approveLoading;

export const selectRejectLoading = (state: RootState) =>
  state.approvePunches.rejectLoading;

export const selectApprovePunchesError = (state: RootState) =>
  state.approvePunches.error;

// EXPORTS

export const { clearApprovePunchesError, resetApprovePunchesState } =
  approvePunchesSlice.actions;

export default approvePunchesSlice.reducer;
