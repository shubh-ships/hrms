import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/lib/api/client';
import { RootState } from '../../store';


interface NewAttendanceState {
    monthlySummary: any | null;
    selectedDateAttendance: any | null;
    leaveBalance: any | null;
    allEmployeesAttendance: any[] | null;
    allAttendanceSummary: any | null;
    loading: boolean;
    dateLoading: boolean;
    error: string | null;
}

const initialState: NewAttendanceState = {
    monthlySummary: null,
    selectedDateAttendance: null,
    leaveBalance: null,
    allEmployeesAttendance: null,
    allAttendanceSummary: null,
    loading: false,
    dateLoading: false,
    error: null,
};

export const fetchMonthlyAttendanceSummary = createAsyncThunk(
    'newAttendance/fetchMonthlySummary',
    async ({ employeeId, month, year, organizationId }: { employeeId: string; month: number; year: number; organizationId?: string }, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(`/newAttendance/monthly-summary`, {
                params: { employeeId, month, year, organizationId }
            });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch monthly attendance summary');
        }
    }
);

export const fetchAttendanceByDate = createAsyncThunk(
    'newAttendance/fetchByDate',
    async ({ employeeId, date }: { employeeId: string; date: string }, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(`/newAttendance/by-date`, {
                params: { employeeId, date }
            });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance for date');
        }
    }
);

export const markAttendance = createAsyncThunk(
    'newAttendance/mark',
    async (payload: any, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post(`/newAttendance/mark`, payload);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to mark attendance');
        }
    }
);

export const removeLeave = createAsyncThunk(
    'newAttendance/removeLeave',
    async ({ employeeId, date }: { employeeId: string; date: string }, { rejectWithValue }) => {
        try {
            const response = await axiosClient.delete(`/newAttendance/leave`, {
                data: { employeeId, date }
            });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to remove leave');
        }
    }
);

export const fetchLeaveBalance = createAsyncThunk(
    'newAttendance/fetchLeaveBalance',
    async (employeeId: string, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(`/newAttendance/leave-balance`, {
                params: { employeeId }
            });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch leave balance');
        }
    }
);

export const fetchEmployeesAttendanceByDate = createAsyncThunk(
    'newAttendance/fetchEmployeesByDate',
    async (date: string, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(`/newAttendance/date/${date}`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch employees attendance');
        }
    }
);

export const fetchAllAttendanceSummaryByDate = createAsyncThunk(
    'newAttendance/fetchAllSummaryByDate',
    async (date: string, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(`/newAttendance/summary/date/${date}`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch all attendance summary');
        }
    }
);

export const createFine = createAsyncThunk(
    'newAttendance/createFine',
    async (payload: any, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post(`/fine-overtime/fine`, payload);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create fine');
        }
    }
);

export const createOvertime = createAsyncThunk(
    'newAttendance/createOvertime',
    async (payload: any, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post(`/fine-overtime/overtime`, payload);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create overtime');
        }
    }
);

export const handleFineOvertimeAction = createAsyncThunk(
    'newAttendance/handleFineOvertimeAction',
    async (payload: any, { rejectWithValue }) => {
        try {
            const response = await axiosClient.patch(`/fine-overtime/action`, payload);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to handle action');
        }
    }
);

const newAttendanceSlice = createSlice({
    name: 'newAttendance',
    initialState,
    reducers: {
        clearNewAttendanceError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMonthlyAttendanceSummary.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMonthlyAttendanceSummary.fulfilled, (state, action) => {
                state.loading = false;
                state.monthlySummary = action.payload;
            })
            .addCase(fetchMonthlyAttendanceSummary.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchAttendanceByDate.pending, (state) => {
                state.dateLoading = true;
                state.error = null;
            })
            .addCase(fetchAttendanceByDate.fulfilled, (state, action) => {
                state.dateLoading = false;
                state.selectedDateAttendance = action.payload;
            })
            .addCase(fetchAttendanceByDate.rejected, (state, action) => {
                state.dateLoading = false;
                state.error = action.payload as string;
            })
            .addCase(markAttendance.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(markAttendance.fulfilled, (state, action) => {
                state.loading = false;
                // If the API returns updated summary, we can merge or replace
                if (action.payload.summary) {
                    state.monthlySummary = action.payload.summary;
                }
            })
            .addCase(markAttendance.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(removeLeave.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(removeLeave.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.summary) {
                    state.monthlySummary = action.payload.summary;
                }
            })
            .addCase(removeLeave.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchEmployeesAttendanceByDate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEmployeesAttendanceByDate.fulfilled, (state, action) => {
                state.loading = false;
                state.allEmployeesAttendance = action.payload.items || action.payload || [];
            })
            .addCase(fetchEmployeesAttendanceByDate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchAllAttendanceSummaryByDate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllAttendanceSummaryByDate.fulfilled, (state, action) => {
                state.loading = false;
                state.allAttendanceSummary = action.payload;
            })
            .addCase(fetchAllAttendanceSummaryByDate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchLeaveBalance.fulfilled, (state, action) => {
                state.leaveBalance = action.payload;
            })
            .addCase(createFine.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createFine.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(createFine.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createOvertime.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createOvertime.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(createOvertime.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(handleFineOvertimeAction.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(handleFineOvertimeAction.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(handleFineOvertimeAction.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearNewAttendanceError } = newAttendanceSlice.actions;

export const selectMonthlyAttendanceSummary = (state: RootState) => state.newAttendance.monthlySummary;
export const selectSelectedDateAttendance = (state: RootState) => state.newAttendance.selectedDateAttendance;
export const selectLeaveBalance = (state: RootState) => state.newAttendance.leaveBalance;
export const selectAllEmployeesAttendance = (state: RootState) => state.newAttendance.allEmployeesAttendance;
export const selectAllAttendanceSummary = (state: RootState) => state.newAttendance.allAttendanceSummary;
export const selectNewAttendanceLoading = (state: RootState) => state.newAttendance.loading;
export const selectDateLoading = (state: RootState) => state.newAttendance.dateLoading;
export const selectNewAttendanceError = (state: RootState) => state.newAttendance.error;

export default newAttendanceSlice.reducer;
