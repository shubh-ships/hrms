import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosClient from "../../lib/api/client";
import { RootState } from "@/store";

export interface BreakTime {
  _id?: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface Shift {
  _id?: string;
  name: string;
  startTime: string;
  endTime: string;
  breaks: BreakTime[];
}

export interface OfficeTiming {
  _id: string;
  organizationId: string | { _id: string; name: string };
  shifts: Shift[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOfficeTimingData {
  shifts: Omit<Shift, '_id'>[];
}

export interface UpdateOfficeTimingData {
  shifts: Shift[];
}

interface OrganizationTimingState {
  officeTiming: OfficeTiming | null;
  shifts: Shift[];
  loading: boolean;
  error: string | null;
}

const initialState: OrganizationTimingState = {
  officeTiming: null,
  shifts: [],
  loading: false,
  error: null,
};

export const fetchOfficeTiming = createAsyncThunk(
  "organizationTiming/fetchOfficeTiming",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.get("/organization-timing/getOfficeTiming", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch office timing"
      );
    }
  }
);

export const createOfficeTiming = createAsyncThunk(
  "organizationTiming/createOfficeTiming",
  async (officeTimingData: CreateOfficeTimingData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.post("/organization-timing/createOfficeTiming", officeTimingData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create office timing"
      );
    }
  }
);

export const updateOfficeTiming = createAsyncThunk(
  "organizationTiming/updateOfficeTiming",
  async (officeTimingData: UpdateOfficeTimingData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.put("/organization-timing/updateOfficeTiming", officeTimingData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update office timing"
      );
    }
  }
);

const organizationTimingSlice = createSlice({
  name: "organizationTiming",
  initialState,
  reducers: {
    clearOfficeTiming: (state) => {
      state.officeTiming = null;
      state.shifts = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    addShift: (state, action: PayloadAction<Omit<Shift, '_id'>>) => {
      const newShift: Shift = {
        ...action.payload,
        _id: `temp_${Date.now()}`, 
      };
      state.shifts.push(newShift);
      if (state.officeTiming) {
        state.officeTiming.shifts.push(newShift);
      }
    },
    updateShift: (state, action: PayloadAction<{ shiftId: string; shiftData: Partial<Shift> }>) => {
      const { shiftId, shiftData } = action.payload;
      
      const shiftIndex = state.shifts.findIndex(shift => shift._id === shiftId);
      if (shiftIndex !== -1) {
        state.shifts[shiftIndex] = { ...state.shifts[shiftIndex], ...shiftData };
      }
      
      if (state.officeTiming) {
        const officeShiftIndex = state.officeTiming.shifts.findIndex(shift => shift._id === shiftId);
        if (officeShiftIndex !== -1) {
          state.officeTiming.shifts[officeShiftIndex] = { 
            ...state.officeTiming.shifts[officeShiftIndex], 
            ...shiftData 
          };
        }
      }
    },
    removeShift: (state, action: PayloadAction<string>) => {
      const shiftId = action.payload;
      
      state.shifts = state.shifts.filter(shift => shift._id !== shiftId);
      
      if (state.officeTiming) {
        state.officeTiming.shifts = state.officeTiming.shifts.filter(shift => shift._id !== shiftId);
      }
    },
    addBreakToShift: (state, action: PayloadAction<{ shiftId: string; breakData: BreakTime }>) => {
      const { shiftId, breakData } = action.payload;
      
      const shiftIndex = state.shifts.findIndex(shift => shift._id === shiftId);
      if (shiftIndex !== -1) {
        state.shifts[shiftIndex].breaks.push(breakData);
      }
      
      if (state.officeTiming) {
        const officeShiftIndex = state.officeTiming.shifts.findIndex(shift => shift._id === shiftId);
        if (officeShiftIndex !== -1) {
          state.officeTiming.shifts[officeShiftIndex].breaks.push(breakData);
        }
      }
    },
    updateBreakInShift: (state, action: PayloadAction<{ 
      shiftId: string; 
      breakIndex: number; 
      breakData: Partial<BreakTime> 
    }>) => {
      const { shiftId, breakIndex, breakData } = action.payload;
      
      const shiftIndex = state.shifts.findIndex(shift => shift._id === shiftId);
      if (shiftIndex !== -1 && state.shifts[shiftIndex].breaks[breakIndex]) {
        state.shifts[shiftIndex].breaks[breakIndex] = {
          ...state.shifts[shiftIndex].breaks[breakIndex],
          ...breakData
        };
      }
      
      if (state.officeTiming) {
        const officeShiftIndex = state.officeTiming.shifts.findIndex(shift => shift._id === shiftId);
        if (officeShiftIndex !== -1 && state.officeTiming.shifts[officeShiftIndex].breaks[breakIndex]) {
          state.officeTiming.shifts[officeShiftIndex].breaks[breakIndex] = {
            ...state.officeTiming.shifts[officeShiftIndex].breaks[breakIndex],
            ...breakData
          };
        }
      }
    },
    removeBreakFromShift: (state, action: PayloadAction<{ shiftId: string; breakIndex: number }>) => {
      const { shiftId, breakIndex } = action.payload;
      
      const shiftIndex = state.shifts.findIndex(shift => shift._id === shiftId);
      if (shiftIndex !== -1) {
        state.shifts[shiftIndex].breaks.splice(breakIndex, 1);
      }
      
      if (state.officeTiming) {
        const officeShiftIndex = state.officeTiming.shifts.findIndex(shift => shift._id === shiftId);
        if (officeShiftIndex !== -1) {
          state.officeTiming.shifts[officeShiftIndex].breaks.splice(breakIndex, 1);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOfficeTiming.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOfficeTiming.fulfilled, (state, action) => {
        state.loading = false;
        state.officeTiming = action.payload;
        state.shifts = action.payload?.shifts || [];
      })
      .addCase(fetchOfficeTiming.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(createOfficeTiming.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOfficeTiming.fulfilled, (state, action) => {
        state.loading = false;
        state.officeTiming = action.payload;
        state.shifts = action.payload.shifts;
      })
      .addCase(createOfficeTiming.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(updateOfficeTiming.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOfficeTiming.fulfilled, (state, action) => {
        state.loading = false;
        state.officeTiming = action.payload;
        state.shifts = action.payload.shifts;
      })
      .addCase(updateOfficeTiming.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearOfficeTiming,
  clearError,
  addShift,
  updateShift,
  removeShift,
  addBreakToShift,
  updateBreakInShift,
  removeBreakFromShift,
} = organizationTimingSlice.actions;

export const selectOfficeTiming = (state: RootState) => state.organizationTiming.officeTiming;
export const selectShifts = (state: RootState) => state.organizationTiming.shifts;
export const selectOrganizationTimingLoading = (state: RootState) => state.organizationTiming.loading;
export const selectOrganizationTimingError = (state: RootState) => state.organizationTiming.error;

export const selectShiftById = (shiftId: string) => (state: RootState) =>
  state.organizationTiming.shifts.find(shift => shift._id === shiftId);

export const selectShiftsByName = (name: string) => (state: RootState) =>
  state.organizationTiming.shifts.filter(shift => 
    shift.name.toLowerCase().includes(name.toLowerCase())
  );

export const selectActiveShifts = (state: RootState) =>
  state.organizationTiming.shifts.filter(shift => shift._id && !shift._id.startsWith('temp_'));

export const selectShiftBreaks = (shiftId: string) => (state: RootState) => {
  const shift = state.organizationTiming.shifts.find(shift => shift._id === shiftId);
  return shift?.breaks || [];
};

export const selectFormattedShifts = (state: RootState) =>
  state.organizationTiming.shifts.map(shift => ({
    ...shift,
    formattedTime: `${shift.startTime} - ${shift.endTime}`,
    breakCount: shift.breaks.length,
    totalBreakDuration: shift.breaks.reduce((total, breakTime) => {
      const start = new Date(`1970-01-01T${breakTime.startTime}:00`);
      const end = new Date(`1970-01-01T${breakTime.endTime}:00`);
      return total + (end.getTime() - start.getTime()) / (1000 * 60); 
    }, 0)
  }));

export default organizationTimingSlice.reducer;
