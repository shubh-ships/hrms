import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axiosClient from '@/lib/api/client';
import { RootState } from '../../store';

interface SalaryActionPayload {
  employeeId: string;
  type: string;
  category: string;
  amount: number;
  month: number;
  year: number;
  description?: string;
}

interface SalaryState {
  actions: any[];
  payrollOverview: any | null;
  history: any[];
  templates: any[];
  templateComponents: any[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

const initialState: SalaryState = {
  actions: [],
  payrollOverview: null,
  history: [],
  templates: [],
  templateComponents: [],
  loading: false,
  actionLoading: false,
  error: null,
};

export const fetchSalaryActions = createAsyncThunk(
  'salary/fetchSalaryActions',
  async ({ employeeId, month, year }: { employeeId: string; month?: number; year?: number }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      const params: any = { employeeId };
      if (month) params.month = month;
      if (year) params.year = year;

      const response = await axiosClient.get('/salary/actions', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch salary actions');
    }
  }
);

export const addSalaryAction = createAsyncThunk(
  'salary/addSalaryAction',
  async (payload: SalaryActionPayload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      const response = await axiosClient.post('/salary/actions', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add salary action');
    }
  }
);

export const deleteSalaryAction = createAsyncThunk(
  'salary/deleteSalaryAction',
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      await axiosClient.delete(`/salary/actions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete salary action');
    }
  }
);

export const fetchPayrollOverview = createAsyncThunk(
  'salary/fetchPayrollOverview',
  async ({ employeeId, month, year }: { employeeId: string; month: number; year: number }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      const response = await axiosClient.get('/salary/payroll/overview', {
        headers: { Authorization: `Bearer ${token}` },
        params: { employeeId, month, year }
      });
      // response.data.data has { payroll, breakdown, isPreview }
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payroll overview');
    }
  }
);

export const fetchEmployeePayrollHistory = createAsyncThunk(
  'salary/fetchEmployeePayrollHistory',
  async (employeeId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      const response = await axiosClient.get(`/salary/payroll/history/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payroll history');
    }
  }
);

export const editSalary = createAsyncThunk(
  'salary/editSalary',
  async ({ employeeId, basic, monthlyCTC }: { employeeId: string; basic: number; monthlyCTC: number }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      const response = await axiosClient.put('/salary/edit', { employeeId, basic, monthlyCTC }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to edit salary');
    }
  }
);

export const reviseSalary = createAsyncThunk(
  'salary/reviseSalary',
  async (payload: { employeeId: string, percent?: number, newCTC?: number, newBasic: number }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      const response = await axiosClient.post('/salary/revise', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to revise salary');
    }
  }
);

export const assignSalary = createAsyncThunk(
  'salary/assignSalary',
  async (payload: { employeeId: string, templateId: string, monthlyCTC: number, basic: number }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      const response = await axiosClient.post('/salary/assign', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign salary');
    }
  }
);

export const fetchSalaryTemplates = createAsyncThunk(
  'salary/fetchSalaryTemplates',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      const response = await axiosClient.get('/salary/template', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch templates');
    }
  }
);

export const fetchTemplateComponents = createAsyncThunk(
  'salary/fetchTemplateComponents',
  async (templateId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      const response = await axiosClient.get(`/salary/template/${templateId}/components`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch template components');
    }
  }
);


const salarySlice = createSlice({
  name: 'salary',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Actions
      .addCase(fetchSalaryActions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalaryActions.fulfilled, (state, action) => {
        state.loading = false;
        state.actions = action.payload;
      })
      .addCase(fetchSalaryActions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add Action
      .addCase(addSalaryAction.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(addSalaryAction.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actions.push(action.payload);
      })
      .addCase(addSalaryAction.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Payroll Overview
      .addCase(fetchPayrollOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayrollOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.payrollOverview = action.payload;
      })
      .addCase(fetchPayrollOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // history
      .addCase(fetchEmployeePayrollHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      })
      // Templates
      .addCase(fetchSalaryTemplates.fulfilled, (state, action) => {
        state.templates = action.payload;
      })
      .addCase(fetchTemplateComponents.fulfilled, (state, action) => {
        state.templateComponents = action.payload;
      });
  },
});

export const { clearError } = salarySlice.actions;
export const selectSalaryActions = (state: RootState) => state.salary.actions;
export const selectPayrollOverview = (state: RootState) => state.salary.payrollOverview;
export const selectSalaryTemplates = (state: RootState) => state.salary.templates;
export const selectTemplateComponents = (state: RootState) => state.salary.templateComponents;
export const selectSalaryLoading = (state: RootState) => state.salary.loading;
export const selectSalaryActionLoading = (state: RootState) => state.salary.actionLoading;

export default salarySlice.reducer;
