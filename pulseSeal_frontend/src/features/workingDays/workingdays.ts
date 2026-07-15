import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from '../../lib/api/client';
import { RootState } from '@/store';

interface WorkingDay {
  _id: string;
  month: string;
  year: number;
  totalWorkingDays: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkingDaysState {
  workingDays: WorkingDay[];
  currentMonthWorkingDays: WorkingDay | null;
  loading: boolean;
  error: string | null;
  createStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  updateStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: WorkingDaysState = {
  workingDays: [],
  currentMonthWorkingDays: null,
  loading: false,
  error: null,
  createStatus: 'idle',
  updateStatus: 'idle',
};

export const createWorkingDays = createAsyncThunk(
  'workingDays/create',
  async (workingDaysData: { month: string; year: number; totalWorkingDays: number }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axiosClient.post('/working-days/decide', workingDaysData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create working days');
    }
  }
);

export const updateWorkingDays = createAsyncThunk(
  'workingDays/update',
  async (workingDaysData: { id: string; month: string; year: number; totalWorkingDays: number }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const { id, ...updateData } = workingDaysData;
      const response = await axiosClient.patch(`/working-days/decide/${id}`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update working days');
    }
  }
);

export const fetchWorkingDays = createAsyncThunk(
  'workingDays/fetchAll',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axiosClient.get('/working-days/show', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
      });
      return response.data.data.workingday as WorkingDay[];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch working days');
    }
  }
);

export const fetchWorkingDaysByMonth = createAsyncThunk(
  'workingDays/fetchByMonth',
  async (params: { month: string; year: number }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axiosClient.get(`/working-days/show?month=${params.month}&year=${params.year}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
      });
      return response.data as WorkingDay;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch working days by month');
    }
  }
);

const workingDaysSlice = createSlice({
  name: 'workingDays',
  initialState,
  reducers: {
    clearWorkingDaysError: (state) => {
      state.error = null;
    },
    resetCreateStatus: (state) => {
      state.createStatus = 'idle';
    },
    resetUpdateStatus: (state) => {
      state.updateStatus = 'idle';
    },
    setCurrentMonthWorkingDays: (state, action) => {
      state.currentMonthWorkingDays = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      
      .addCase(createWorkingDays.pending, (state) => {
        state.createStatus = 'loading';
        state.error = null;
      })
      .addCase(createWorkingDays.fulfilled, (state, action) => {
        state.createStatus = 'succeeded';
        const existingIndex = state.workingDays.findIndex(
          wd => wd.month === action.payload.month && wd.year === action.payload.year
        );
        if (existingIndex >= 0) {
          state.workingDays[existingIndex] = action.payload;
        } else {
          state.workingDays = [action.payload, ...state.workingDays];
        }
        state.currentMonthWorkingDays = action.payload;
      })
      .addCase(createWorkingDays.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.error = action.payload as string;
      })

      
      .addCase(updateWorkingDays.pending, (state) => {
        state.updateStatus = 'loading';
        state.error = null;
      })
      .addCase(updateWorkingDays.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded';
        const existingIndex = state.workingDays.findIndex(wd => wd._id === action.payload._id);
        if (existingIndex >= 0) {
          state.workingDays[existingIndex] = action.payload;
        }
        if (state.currentMonthWorkingDays && state.currentMonthWorkingDays._id === action.payload._id) {
          state.currentMonthWorkingDays = action.payload;
        }
      })
      .addCase(updateWorkingDays.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.error = action.payload as string;
      })
      
    
      .addCase(fetchWorkingDays.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkingDays.fulfilled, (state, action) => {
        state.loading = false;
       
        state.workingDays = Array.isArray(action.payload) 
          ? action.payload 
          : [action.payload];
      })
      .addCase(fetchWorkingDays.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      
      .addCase(fetchWorkingDaysByMonth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkingDaysByMonth.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMonthWorkingDays = action.payload;
      })
      .addCase(fetchWorkingDaysByMonth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearWorkingDaysError, 
  resetCreateStatus,
  resetUpdateStatus,
  setCurrentMonthWorkingDays 
} = workingDaysSlice.actions;

export const selectWorkingDays = (state: RootState) => state.workingDays.workingDays;
export const selectCurrentMonthWorkingDays = (state: RootState) => state.workingDays.currentMonthWorkingDays;
export const selectWorkingDaysLoading = (state: RootState) => state.workingDays.loading;
export const selectWorkingDaysError = (state: RootState) => state.workingDays.error;
export const selectCreateStatus = (state: RootState) => state.workingDays.createStatus;
export const selectUpdateStatus = (state: RootState) => state.workingDays.updateStatus;

export default workingDaysSlice.reducer;

