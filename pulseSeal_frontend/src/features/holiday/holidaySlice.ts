import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';
import axiosClient from '../../lib/api/client';
import { RootState } from '../../store';

interface Holiday {
  _id: string;
  organizationId: string;
  name: string;
  description?: string;
  date: string;
  isRecurring: boolean;
  type: 'national' | 'festival' | 'optional';
  createdAt: string;
  updatedAt: string;
}

interface CreateHolidayData {
  name: string;
  description?: string;
  date: string;
  isRecurring?: boolean;
  type?: 'national' | 'festival' | 'optional';
}

interface UpdateHolidayData extends Partial<CreateHolidayData> {
  _id: string;
}

interface HolidayState {
  holidays: Holiday[];
  loading: boolean;
  error: string | null;
  createLoading: boolean;
  updateLoading: boolean;
}

const getOrganizationId = (state: RootState): string | null => {
  if (state.auth.user?.organizationId) {
    return state.auth.user.organizationId;
  }
  
  const token = state.auth.token || localStorage.getItem('token');
  if (token) {
    try {
      const decodedToken: any = jwtDecode(token);
      return decodedToken.user?.organizationId || null;
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }
  
  return null;
};

const initialState: HolidayState = {
  holidays: [],
  loading: false,
  error: null,
  createLoading: false,
  updateLoading: false,
};

export const createHoliday = createAsyncThunk(
  'holiday/create',
  async (holidayData: CreateHolidayData | CreateHolidayData[], { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      const organizationId = getOrganizationId(state);
      
      if (!organizationId) {
        return rejectWithValue('Organization ID not found');
      }

      let processedHolidayData;
      if (Array.isArray(holidayData)) {
        processedHolidayData = holidayData.map(holiday => ({
          ...holiday,
          organizationId
        }));
      } else {
        processedHolidayData = {
          ...holidayData,
          organizationId
        };
      }
      
      const response = await axiosClient.post('/holiday', processedHolidayData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create holiday');
    }
  }
);

export const getHolidays = createAsyncThunk(
  'holiday/getAll',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      const organizationId = getOrganizationId(state);
      
      if (!organizationId) {
        return rejectWithValue('Organization ID not found');
      }
      
      const response = await axiosClient.get('/holiday', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
        params: {
          organizationId 
        }
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch holidays');
    }
  }
);

export const updateHoliday = createAsyncThunk(
  'holiday/update',
  async ({ id, ...updateData }: UpdateHolidayData & { id: string }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      const organizationId = getOrganizationId(state);
      
      if (!organizationId) {
        return rejectWithValue('Organization ID not found');
      }

      const processedUpdateData = {
        ...updateData,
        organizationId
      };
      
      const response = await axiosClient.put(`/holiday/${id}`, processedUpdateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update holiday');
    }
  }
);

export const deleteHoliday = createAsyncThunk(
  'holiday/delete',
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      
      const response = await axiosClient.delete(`/holiday/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
      });
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete holiday');
    }
  }
);

const holidaySlice = createSlice({
  name: 'holiday',
  initialState,
  reducers: {
    clearHolidayError: (state) => {
      state.error = null;
    },
    resetHolidayState: (state) => {
      state.holidays = [];
      state.error = null;
      state.loading = false;
      state.createLoading = false;
      state.updateLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createHoliday.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createHoliday.fulfilled, (state, action: PayloadAction<Holiday | Holiday[]>) => {
        state.createLoading = false;
        if (Array.isArray(action.payload)) {
          state.holidays.push(...action.payload);
        } else {
          state.holidays.push(action.payload);
        }
      })
      .addCase(createHoliday.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload as string;
      })

      // Get Holidays
      .addCase(getHolidays.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getHolidays.fulfilled, (state, action: PayloadAction<Holiday[]>) => {
        state.loading = false;
        state.holidays = action.payload;
      })
      .addCase(getHolidays.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(updateHoliday.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateHoliday.fulfilled, (state, action: PayloadAction<Holiday>) => {
        state.updateLoading = false;
        const index = state.holidays.findIndex(holiday => holiday._id === action.payload._id);
        if (index !== -1) {
          state.holidays[index] = action.payload;
        }
      })
      .addCase(updateHoliday.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload as string;
      })

      .addCase(deleteHoliday.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteHoliday.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.holidays = state.holidays.filter(holiday => holiday._id !== action.payload);
      })
      .addCase(deleteHoliday.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearHolidayError, resetHolidayState } = holidaySlice.actions;
export default holidaySlice.reducer;
