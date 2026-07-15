import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from '@/lib/api/client';
import { RootState } from '../../store';

interface PayrollRun {
  _id: string;
  organizationId: string;
  month: number;
  year: number;
  initiatedBy: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'pending' | 'processed' | 'completed';
  totalEmployees: number;
  totalAmount: number;
  generatedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface PayrollState {
  payrollRuns: PayrollRun[];
  selectedPayrollRun: PayrollRun | null;
  loading: boolean;
  error: string | null;
  createLoading: boolean;
  completeLoading: boolean;
}

const initialState: PayrollState = {
  payrollRuns: [],
  selectedPayrollRun: null,
  loading: false,
  error: null,
  createLoading: false,
  completeLoading: false,
};

export const createPayrollRun = createAsyncThunk(
  'payroll/createPayrollRun',
  async ({ month, year }: { month: number; year: number }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axiosClient.post('/payroll/create', {
        month,
        year
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      
      return response.data.payroll;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create payroll run');
    }
  }
);

export const completePayrollRun = createAsyncThunk(
  'payroll/completePayrollRun',
  async (payrollRunId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axiosClient.post(`/payroll/complete/${payrollRunId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      
      return response.data.payroll;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to complete payroll run');
    }
  }
);

export const fetchPayrollRuns = createAsyncThunk(
  'payroll/fetchPayrollRuns',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axiosClient.get('/payroll/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch payroll runs');
    }
  }
);

const payrollSlice = createSlice({
  name: 'payroll',
  initialState,
  reducers: {
    resetPayrollState: () => initialState,
    clearError: (state) => {
      state.error = null;
    },
    setSelectedPayrollRun: (state, action) => {
      state.selectedPayrollRun = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPayrollRun.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createPayrollRun.fulfilled, (state, action) => {
        state.createLoading = false;
        state.payrollRuns.unshift(action.payload);
      })
      .addCase(createPayrollRun.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload as string;
      })
      .addCase(completePayrollRun.pending, (state) => {
        state.completeLoading = true;
        state.error = null;
      })
      .addCase(completePayrollRun.fulfilled, (state, action) => {
        state.completeLoading = false;
        const index = state.payrollRuns.findIndex(run => run._id === action.payload._id);
        if (index !== -1) {
          state.payrollRuns[index] = action.payload;
        }
        if (state.selectedPayrollRun?._id === action.payload._id) {
          state.selectedPayrollRun = action.payload;
        }
      })
      .addCase(completePayrollRun.rejected, (state, action) => {
        state.completeLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPayrollRuns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayrollRuns.fulfilled, (state, action) => {
        state.loading = false;
        state.payrollRuns = action.payload;
      })
      .addCase(fetchPayrollRuns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  resetPayrollState, 
  clearError, 
  setSelectedPayrollRun 
} = payrollSlice.actions;

export const selectPayrollRuns = (state: RootState) => 
  state.payroll?.payrollRuns || [];

export const selectSelectedPayrollRun = (state: RootState) => 
  state.payroll?.selectedPayrollRun || null;

export const selectPayrollLoading = (state: RootState) => 
  state.payroll?.loading || false;

export const selectCreateLoading = (state: RootState) => 
  state.payroll?.createLoading || false;

export const selectCompleteLoading = (state: RootState) => 
  state.payroll?.completeLoading || false;

export const selectPayrollError = (state: RootState) => 
  state.payroll?.error || null;

export default payrollSlice.reducer;
