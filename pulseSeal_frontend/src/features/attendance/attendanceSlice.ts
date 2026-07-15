import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  Attendance, 
  CreateAttendanceRequest, 
  UpdateAttendanceRequest, 
  AttendanceStats, 
  MonthlyAttendance,
  AttendanceState 
} from '../../lib/types/api/attendance';

export const createAttendance = createAsyncThunk(
  'attendance/mark',
  async (attendanceData: CreateAttendanceRequest, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(attendanceData)
      });
    
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to create attendance');
      }
      
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const CreateMannualAttendance = createAsyncThunk(
  'attendance/createManual',
  async (attendanceData: CreateAttendanceRequest, { rejectWithValue }) => {  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/attendance/markmanual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(attendanceData)
      });
      
      const result = await response.json();


      if (!response.ok) {
        return rejectWithValue(result.error || 'Failed to create manual attendance');
      }

      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);


export const updateAttendance = createAsyncThunk(
  'attendance/update',
  async (
    { attendanceId, data }: { attendanceId: string; data: UpdateAttendanceRequest },
    { rejectWithValue }: { rejectWithValue: (value: any) => any }
  ) => {


    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/attendance/updateattendance/${attendanceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      
      const result = await response.json();
   

      if (!response.ok) {
        return rejectWithValue(result.error || 'Failed to update attendance');
      }

      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const markLogout = createAsyncThunk(
  'attendance/markLogout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/attendance/mark-logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      
      const result = await response.json();
  
      
      if (!response.ok) {
        return rejectWithValue(result.error || 'Failed to mark logout');
      }
      
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);


export const getAllAttendance = createAsyncThunk(
  'attendance/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/attendance/show`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      
      
      if (!response.ok) {
        return rejectWithValue(result.error || 'Failed to fetch attendance');
      }
      
    
      return result.data.createAttendanceData || result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const getMonthlyUserAttendance = createAsyncThunk(
  'attendance/getMonthlyUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/attendance/monthly`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
   
      
      const result = await response.json();
      if (!response.ok) {
        return rejectWithValue(result.error || 'Failed to fetch all attendance records');
      }
      
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);


export const getMonthlyAttendance = createAsyncThunk(
  'attendance/getMonthly',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/attendance/monthly/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
 
      if (!response.ok) {
        return rejectWithValue(result.error || 'Failed to fetch monthly attendance');
      }
      
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const getAttendanceAverage = createAsyncThunk(
  'attendance/getAverage',
  async ({ userId, monthId }: { userId: string; monthId: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/attendance/average/${monthId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
   
      if (!response.ok) {
        return rejectWithValue(result.error || 'Failed to fetch attendance stats');
      }
      
      return result.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);


const initialState: AttendanceState = {
  attendance: null,
  allAttendance: [],
  monthlyAttendance: [],
  stats: null,
  loading: false,
  error: null,
  success: false
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    resetAttendance: (state) => {
      state.attendance = null;
      state.allAttendance = [];
      state.monthlyAttendance = [];
      state.stats = null;
      state.error = null;
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createAttendance.fulfilled, (state, action: PayloadAction<Attendance>) => {
        state.loading = false;
        state.attendance = action.payload;
        state.success = true;
      })
      .addCase(createAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })
  
      .addCase(updateAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAttendance.fulfilled, (state, action: PayloadAction<Attendance>) => {
        state.loading = false;
        state.attendance = action.payload;
        state.success = true;
      })
      .addCase(updateAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(markLogout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markLogout.fulfilled, (state, action: PayloadAction<Attendance>) => {
        state.loading = false;
        state.attendance = action.payload;
        state.success = true;
      })
      .addCase(markLogout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
    
      .addCase(getAllAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllAttendance.fulfilled, (state, action: PayloadAction<Attendance[]>) => {
        state.loading = false;
        state.allAttendance = action.payload;
      })
      .addCase(getAllAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      
      .addCase(getMonthlyUserAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
  
.addCase(getMonthlyUserAttendance.fulfilled, (state, action: PayloadAction<any>) => {
  state.loading = false;
  state.monthlyAttendance = action.payload;
})
      .addCase(getMonthlyUserAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
    
      .addCase(getMonthlyAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMonthlyAttendance.fulfilled, (state, action: PayloadAction<MonthlyAttendance[]>) => {
        state.loading = false;
        state.monthlyAttendance = action.payload;
      })
      .addCase(getMonthlyAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      
      .addCase(getAttendanceAverage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAttendanceAverage.fulfilled, (state, action: PayloadAction<AttendanceStats>) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(getAttendanceAverage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearError, clearSuccess, resetAttendance } = attendanceSlice.actions;
export default attendanceSlice.reducer;