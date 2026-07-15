import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from '@/lib/api/client';
import { RootState } from '../../store';
import { jwtDecode } from 'jwt-decode';

interface ScanEntry {
  scanTime: string;
  type: 'IN' | 'OUT';
  sessionMinutes?: number;
  breakMinutes?: number;
}

interface DailyRecord {
  _id: string;
  userId: string;
  organizationId: string;
  date: string;
  month: string;
  year: string;
  scans: ScanEntry[];
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  totalOvertimeMinutes: number;
  lateLoginMinutes: number;
  earlyLogoutMinutes: number;
  officeTotalWorkingMinutes: number;
  isLateLogin: boolean;
  isEarlyLogin: boolean;
  isEarlyLogout: boolean;
  isOvertime: boolean;
  earlyLoginMinutes: number;
}

interface MonthlyReport {
  dailyRecords: Array<{
    date: string;
    totalWork: string;
    totalBreak: string;
    totalOvertime: string;
    lateLoginMinutes: string;
    earlyLogoutMinutes: string;
    officeTotalWorkingMinutes: string;
    scans: Array<{
      type: 'IN' | 'OUT';
      scanTime: string;
      sessionMinutes: string | null;
      breakMinutes: string | null;
    }>;
  }>;
  monthlySummary: {
    totalWork: string;
    totalBreak: string;
    totalOvertime: string;
    totalLate: string;
    totalEarlyLogout: string;
    totalWorkingDays: number;
    fullDayCount: number;
    halfDayCount: number;
  };
}

interface HrmsAttendanceState {
  dailyRecord: DailyRecord | null;
  monthlyReport: MonthlyReport | null;
  loading: boolean;
   deleteLoading: boolean;
  error: string | null;
  scanLoading: boolean;
  updateLoading: boolean;
}

const initialState: HrmsAttendanceState = {
  dailyRecord: null,
  monthlyReport: null,
  loading: false,
  deleteLoading: false,
  error: null,
  scanLoading: false,
  updateLoading: false,
};

interface DecodedToken {
  user: {
    _id: string;
    organizationId: string;
    id: string;
  };
  userRole: string;
  iat: number;
  exp: number;
}

export const recordFaceScan = createAsyncThunk(
  'hrmsAttendance/recordFaceScan',
  async (scanTime: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axiosClient.post('/facescan/scan', 
        { scanTime },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to record scan');
    }
  }
);

export const createManualAttendance = createAsyncThunk(
  'hrmsAttendance/createManualAttendance',
  async ({ userId, organizationId, loginTime, logoutTime }: {
    userId: string;
    organizationId: string;
    loginTime: string;
    logoutTime: string;
  }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/facescan/manual-attendance', {
        userId,
        organizationId,
        loginTime,
        logoutTime
      });
      
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create manual attendance');
    }
  }
);

export const fetchMonthlyReport = createAsyncThunk(
  'hrmsAttendance/fetchMonthlyReport',
  async ({ userId, month, year }: { userId?: string; month?: string; year?: string }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      let url = '/facescan/monthly-report';
      if (userId) {
        url = `/facescan/monthly-report/${userId}`;
      }

      const params = new URLSearchParams();
      if (month) params.append('month', month);
      if (year) params.append('year', year);

      const response = await axiosClient.get(`${url}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch monthly report');
    }
  }
);

export const fetchUserAttendance = createAsyncThunk(
  'hrmsAttendance/fetchUserAttendance',
  async ({ userId, date }: { userId: string; date: string }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axiosClient.get(`/facescan/user/${userId}?date=${date}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch user attendance');
    }
  }
);

export const updateDailyScans = createAsyncThunk(
  'hrmsAttendance/updateDailyScans',
  async ({ dailyRecordId, scans }: { dailyRecordId: string; scans: string[] }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axiosClient.patch('/facescan/update', 
        { dailyRecordId, scans },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update daily scans');
    }
  }
);

export const deleteAttendanceRecord = createAsyncThunk(
  'hrmsAttendance/deleteAttendanceRecord',
  async ({ userId, date }: { userId: string; date: string }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');

      const response = await axiosClient.delete('/facescan/delete-record', {
        data: { userId, date },
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete attendance record');
    }
  }
);


const hrmsAttendanceSlice = createSlice({
  name: 'hrmsAttendance',
  initialState,
  reducers: {
    resetHrmsAttendanceState: () => initialState,
    clearError: (state) => {
      state.error = null;
    },
    setDailyRecord: (state, action) => {
      state.dailyRecord = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(recordFaceScan.pending, (state) => {
        state.scanLoading = true;
        state.error = null;
      })
      .addCase(recordFaceScan.fulfilled, (state, action) => {
        state.scanLoading = false;
        state.dailyRecord = action.payload;
      })
      .addCase(recordFaceScan.rejected, (state, action) => {
        state.scanLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createManualAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createManualAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.dailyRecord = action.payload;
      })
      .addCase(createManualAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMonthlyReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMonthlyReport.fulfilled, (state, action) => {
        state.loading = false;
        state.monthlyReport = action.payload;
      })
      .addCase(fetchMonthlyReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUserAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.dailyRecord = action.payload;
      })
      .addCase(fetchUserAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateDailyScans.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateDailyScans.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.dailyRecord = action.payload;
      })
      .addCase(updateDailyScans.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteAttendanceRecord.pending, (state) => {
    state.deleteLoading = true;
    state.error = null;
  })
  .addCase(deleteAttendanceRecord.fulfilled, (state, action) => {
    state.deleteLoading = false;
    // Optionally clear dailyRecord if matches deleted record
    if (state.dailyRecord && state.dailyRecord.userId === action.meta.arg.userId && state.dailyRecord.date === action.meta.arg.date) {
      state.dailyRecord = null;
    }
  })
  .addCase(deleteAttendanceRecord.rejected, (state, action) => {
    state.deleteLoading = false;
    state.error = action.payload as string;
  });
  },
});



export const { resetHrmsAttendanceState, clearError, setDailyRecord } = hrmsAttendanceSlice.actions;

export const selectDailyRecord = (state: RootState) => 
  state.hrmsAttendance?.dailyRecord || null;

export const selectMonthlyReport = (state: RootState) => 
  state.hrmsAttendance?.monthlyReport || null;

export const selectHrmsAttendanceLoading = (state: RootState) => 
  state.hrmsAttendance?.loading || false;

export const selectScanLoading = (state: RootState) => 
  state.hrmsAttendance?.scanLoading || false;

export const selectUpdateLoading = (state: RootState) => 
  state.hrmsAttendance?.updateLoading || false;

export const selectHrmsAttendanceError = (state: RootState) => 
  state.hrmsAttendance?.error || null;

export const selectDeleteLoading = (state: RootState) =>
  state.hrmsAttendance?.deleteLoading || false;


export default hrmsAttendanceSlice.reducer;
