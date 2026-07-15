import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosClient from "../../lib/api/client";
import { RootState } from "@/store";

export interface OvertimeData {
  totalOverTimeHours: {
    hours: number;
    minutes: number;
  };
  totalLessTimeHours: {
    hours: number;
    minutes: number;
  };
  daysWorked: number;
  dailyBreakdown: {
    date: string;
    loginTime: string;
    logoutTime: string | "pending";
    totalWorkedMinutes: number | null;
    overTime: number;
    lessTime: number;
  }[];
}

interface OvertimeState {
  overtime: OvertimeData | null;
  loading: boolean;
  error: string | null;
}

const initialState: OvertimeState = {
  overtime: null,
  loading: false,
  error: null,
};

export const fetchMonthlyOvertime = createAsyncThunk(
  "overtime/fetchMonthly",
  async (
    { month, year }: { month: number; year: number },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.post(
        "/overtime/monthly",
        { month, year },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      return response.data.message.message;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch monthly overtime"
      );
    }
  }
);

export const fetchMonthlyOvertimeByUserId = createAsyncThunk(
  "overtime/fetchMonthlyByUserId",
  async (
    { userId, month, year }: { userId: string; month: number; year: number },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.post(
        `/overtime/monthly/${userId}`,
        { month, year },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      return response.data.message.message;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch monthly overtime for user"
      );
    }
  }
);

const overtimeSlice = createSlice({
  name: "overtime",
  initialState,
  reducers: {
    clearOvertime: (state) => {
      state.overtime = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMonthlyOvertime.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMonthlyOvertime.fulfilled, (state, action) => {
        state.loading = false;
        state.overtime = action.payload;
      })
      .addCase(fetchMonthlyOvertime.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMonthlyOvertimeByUserId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMonthlyOvertimeByUserId.fulfilled, (state, action) => {
        state.loading = false;
        state.overtime = action.payload;
      })
      .addCase(fetchMonthlyOvertimeByUserId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearOvertime, clearError } = overtimeSlice.actions;

export const selectOvertime = (state: RootState) => state.overtime.overtime;
export const selectOvertimeLoading = (state: RootState) => state.overtime.loading;
export const selectOvertimeError = (state: RootState) => state.overtime.error;

export default overtimeSlice.reducer;
