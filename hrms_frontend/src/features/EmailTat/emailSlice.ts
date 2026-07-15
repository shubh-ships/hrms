import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from '@/lib/api/client';

interface EmailState {
  loading: boolean;
  error: string | null;
  lastSent: string | null;
}

const initialState: EmailState = {
  loading: false,
  error: null,
  lastSent: null,
};

export const sendTaskStatusEmail = createAsyncThunk(
  'email/sendTaskStatus',
  async ({ 
    to, 
    name, 
    taskName, 
    taskStatus 
  }: { 
    to: string; 
    name: string; 
    taskName: string; 
    taskStatus: number 
  }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/api/send-task-email', {
        to,
        name,
        taskName,
        taskStatus
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to send email');
    }
  }
);

const emailSlice = createSlice({
  name: 'email',
  initialState,
  reducers: {
    clearEmailError: (state) => {
      state.error = null;
    },
    resetEmailState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendTaskStatusEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendTaskStatusEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.lastSent = new Date().toISOString();
      })
      .addCase(sendTaskStatusEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearEmailError, resetEmailState } = emailSlice.actions;
export default emailSlice.reducer;