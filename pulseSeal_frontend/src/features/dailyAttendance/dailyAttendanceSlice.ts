import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axiosClient from '@/lib/api/client';
import { RootState } from '../../store';

interface TimeValue {
    hours: number;
    minutes: number;
}

interface DashboardSummary {
    date: string;
    totalEmployees: number;
    present: number;
    absent: number;
    halfDay: number;
    notMarked: number;
    punchedIn: number;
    punchedOut: number;
    onLeave: number;
    upcomingLeave: number;
    workEntries: number;
    overtime: TimeValue;
    fine: TimeValue;
}

interface DepartmentAttendance {
    departmentId: string | null;
    departmentName: string;
    totalEmployees: number;
    present: number;
    absent: number;
    halfDay: number;
    notMarked: number;
    overtimeCount: number;
    fineCount: number;
    onLeave: number;
}

interface ShiftAttendance {
    shiftId: string | null;
    shiftName: string;
    totalEmployees: number;
    present: number;
    absent: number;
    halfDay: number;
    notMarked: number;
    overtimeCount: number;
    fineCount: number;
    onLeave: number;
}

interface DetailedAttendanceItem {
    employeeId: string;
    name: string;
    employeeCode: string;
    departmentId: string;
    department: string;
    attendance: string;
    inTime: string;
    outTime: string;
    totalWorkMinutes: number;
    overtime: TimeValue;
    fine: TimeValue;
}

interface MonthlySummary {
    name: string;
    employeeCode: string | null;
    totalDays: number;
    present: number;
    absent: number;
    halfDay: number;
    notMarked: number;
    paidLeave: number;
    punchIn: number;
    punchOut: number;
    pending: number;
    overtime: TimeValue;
    fine: TimeValue;
}

interface DailyDetail {
    date: string;
    dayName: string;
    status: string;
    totalWorkMinutes: number;
    punchInTime: string | null;
    punchOutTime: string | null;
    scans: any[];
    isFineApplied: boolean;
    fineMinutes: number;
    isOvertimeApplied: boolean;
    overtimeMinutes: number;
    isPending: boolean;
    leaveType: string | null;
}

interface DailyAttendanceState {
    summary: DashboardSummary | null;
    departments: DepartmentAttendance[];
    shifts: ShiftAttendance[];
    details: DetailedAttendanceItem[];
    monthly: {
        summary: MonthlySummary | null;
        dailyDetails: DailyDetail[];
    };
    deactivatedCount: number;
    loading: boolean;
    error: string | null;
}

const initialState: DailyAttendanceState = {
    summary: null,
    departments: [],
    shifts: [],
    details: [],
    monthly: {
        summary: null,
        dailyDetails: [],
    },
    deactivatedCount: 0,
    loading: false,
    error: null,
};

export const fetchDashboardSummary = createAsyncThunk(
    'dailyAttendance/fetchSummary',
    async (date: string, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(`/newAttendance/summary/date/${date}`);
            if (response.data?.success && response.data?.data) {
                const item = response.data.data;
                return {
                    date,
                    totalEmployees: (item.present || 0) + (item.absent || 0) + (item.halfDay || 0) + (item.notMarked || 0) + (item.onLeave || 0),
                    present: item.present || 0,
                    absent: item.absent || 0,
                    halfDay: item.halfDay || 0,
                    notMarked: item.notMarked || 0,
                    punchedIn: item.punchSummary?.punchIn || 0,
                    punchedOut: item.punchSummary?.punchOut || 0,
                    onLeave: item.onLeave || 0,
                    upcomingLeave: item.upcomingLeaves || 0,
                    workEntries: item.punchSummary?.punchIn || 0,
                    overtime: {
                        hours: Math.floor((item.overTime?.minutes || 0) / 60),
                        minutes: (item.overTime?.minutes || 0) % 60
                    },
                    fine: {
                        hours: Math.floor((item.fine?.minutes || 0) / 60),
                        minutes: (item.fine?.minutes || 0) % 60
                    }
                };
            }
            return null;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch summary');
        }
    }
);

export const fetchDepartmentAttendance = createAsyncThunk(
    'dailyAttendance/fetchDepartment',
    async (date: string, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(`/newAttendance/department-summary/${date}`);
            if (response.data?.success && response.data?.data?.items) {
                return response.data.data.items.map((item: any) => ({
                    departmentId: null,
                    departmentName: item.name,
                    totalEmployees: (item.present || 0) + (item.absent || 0) + (item.halfDay || 0) + (item.notMarked || 0) + (item.onLeave || 0),
                    present: item.present || 0,
                    absent: item.absent || 0,
                    halfDay: item.halfDay || 0,
                    notMarked: item.notMarked || 0,
                    overtimeCount: item.overTime || 0,
                    fineCount: item.fine || 0,
                    onLeave: item.onLeave || 0,
                }));
            }
            return [];
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch department attendance');
        }
    }
);

export const fetchShiftAttendance = createAsyncThunk(
    'dailyAttendance/fetchShift',
    async (date: string, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(`/newAttendance/shift-summary/${date}`);
            if (response.data?.success && response.data?.data?.items) {
                return response.data.data.items.map((item: any) => ({
                    shiftId: null,
                    shiftName: item.name,
                    totalEmployees: (item.present || 0) + (item.absent || 0) + (item.halfDay || 0) + (item.notMarked || 0) + (item.onLeave || 0),
                    present: item.present || 0,
                    absent: item.absent || 0,
                    halfDay: item.halfDay || 0,
                    notMarked: item.notMarked || 0,
                    overtimeCount: item.overTime || 0,
                    fineCount: item.fine || 0,
                    onLeave: item.onLeave || 0,
                }));
            }
            return [];
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch shift attendance');
        }
    }
);

export const fetchDetailedAttendance = createAsyncThunk(
    'dailyAttendance/fetchDetail',
    async (date: string, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(`/newAttendance/date/${date}`);
            if (response.data?.success && response.data?.data?.items) {
                return response.data.data.items.map((item: any) => ({
                    employeeId: item.employeeId,
                    name: item.employeeName,
                    employeeCode: '', // New API doesn't return employeeCode at root currently
                    departmentId: '', // New API doesn't return departmentId at root currently
                    department: item.departmentName || '-',
                    attendance: item.attendanceType,
                    inTime: item.inTime || '-',
                    outTime: item.outTime || '-',
                    totalWorkMinutes: 0,
                    overtime: {
                        hours: Math.floor((item.overtime || 0) / 60),
                        minutes: (item.overtime || 0) % 60
                    },
                    fine: {
                        hours: Math.floor((item.fine || 0) / 60),
                        minutes: (item.fine || 0) % 60
                    }
                }));
            }
            return [];
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch detailed attendance');
        }
    }
);

export const fetchMonthlyAttendance = createAsyncThunk(
    'dailyAttendance/fetchMonthly',
    async ({ userId, month, year }: { userId: string; month: number; year: number }, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(`/facescan/monthly/${userId}?month=${month}&year=${year}`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch monthly attendance');
        }
    }
);

export const fetchSummary = fetchDashboardSummary; // Alias for consistency

export const fetchDeactivatedCount = createAsyncThunk(
    'dailyAttendance/fetchDeactivated',
    async (_, { rejectWithValue }) => {
        try {
            // Fetch employees with status inactive
            const response = await axiosClient.get('/employee?status=inactive');
            // Assuming the list of employees is in response.data.data
            return response.data.data?.length || 0;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch deactivated count');
        }
    }
);

const dailyAttendanceSlice = createSlice({
    name: 'dailyAttendance',
    initialState,
    reducers: {
        clearDailyAttendanceError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Summary
            .addCase(fetchDashboardSummary.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
                state.loading = false;
                state.summary = action.payload;
            })
            .addCase(fetchDashboardSummary.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Department
            .addCase(fetchDepartmentAttendance.fulfilled, (state, action) => {
                state.departments = action.payload;
            })
            // Shift
            .addCase(fetchShiftAttendance.fulfilled, (state, action) => {
                state.shifts = action.payload;
            })
            // Detail
            .addCase(fetchDetailedAttendance.fulfilled, (state, action) => {
                state.details = action.payload;
            })
            // Monthly
            .addCase(fetchMonthlyAttendance.fulfilled, (state, action) => {
                state.monthly = action.payload;
            })
            // Deactivated
            .addCase(fetchDeactivatedCount.fulfilled, (state, action) => {
                state.deactivatedCount = action.payload;
            });
    },
});

export const { clearDailyAttendanceError } = dailyAttendanceSlice.actions;

export const selectDashboardSummary = (state: RootState) => state.dailyAttendance.summary;
export const selectDepartmentAttendance = (state: RootState) => state.dailyAttendance.departments;
export const selectShiftAttendance = (state: RootState) => state.dailyAttendance.shifts;
export const selectDetailedAttendance = (state: RootState) => state.dailyAttendance.details;
export const selectMonthlyAttendance = (state: RootState) => state.dailyAttendance.monthly;
export const selectDeactivatedCount = (state: RootState) => state.dailyAttendance.deactivatedCount;

export default dailyAttendanceSlice.reducer;
