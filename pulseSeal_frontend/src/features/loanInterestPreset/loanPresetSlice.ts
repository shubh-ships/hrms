import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosClient from "@/lib/api/client";
import { RootState } from "@/store";

interface LoanPreset {
  _id: string;
  name: string;
  organizationId: string;
  interestRate: number;
  interestType: 'simple' | 'compound';
  isActive: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateLoanPresetData {
  name: string;
  interestRate: number;
  interestType: 'simple' | 'compound';
}

interface UpdateLoanPresetData extends Partial<CreateLoanPresetData> {}

interface LoanPresetState {
  presets: LoanPreset[];
  currentPreset: LoanPreset | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export const createLoanPreset = createAsyncThunk(
  "loanPreset/createLoanPreset",
  async (presetData: CreateLoanPresetData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      
      
      const response = await axiosClient.post("/loan-presets", presetData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return response.data.data;
    } catch (error: any) {
      console.error('❌ Create loan preset error:', error);
      return rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || error.message || "Failed to create loan preset"
      );
    }
  }
);

export const getLoanPresets = createAsyncThunk(
  "loanPreset/getLoanPresets",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

     
      
      const response = await axiosClient.get("/loan-presets", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

     
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error fetching loan presets:', error);
      return rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || error.message || "Failed to fetch loan presets"
      );
    }
  }
);

export const updateLoanPreset = createAsyncThunk(
  "loanPreset/updateLoanPreset",
  async (
    { id, updateData }: { id: string; updateData: UpdateLoanPresetData },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      
      const response = await axiosClient.put(`/loan-presets/${id}`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return response.data.data;
    } catch (error: any) {
      console.error('❌ Update loan preset error:', error);
      return rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || error.message || "Failed to update loan preset"
      );
    }
  }
);

export const deleteLoanPreset = createAsyncThunk(
  "loanPreset/deleteLoanPreset",
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

     
      
      const response = await axiosClient.delete(`/loan-presets/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return { id, message: response.data.message };
    } catch (error: any) {
      console.error('❌ Delete loan preset error:', error);
      return rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || error.message || "Failed to delete loan preset"
      );
    }
  }
);

const initialState: LoanPresetState = {
  presets: [],
  currentPreset: null,
  loading: false,
  error: null,
  success: false,
};

const loanPresetSlice = createSlice({
  name: "loanPreset",
  initialState,
  reducers: {
    clearCurrentPreset: (state) => {
      state.currentPreset = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    setCurrentPreset: (state, action: PayloadAction<LoanPreset>) => {
      state.currentPreset = action.payload;
    },
    resetLoanPresetState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createLoanPreset.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createLoanPreset.fulfilled, (state, action: PayloadAction<LoanPreset>) => {
        state.loading = false;
        state.success = true;
        state.presets.unshift(action.payload);
      })
      .addCase(createLoanPreset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })

      .addCase(getLoanPresets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLoanPresets.fulfilled, (state, action: PayloadAction<LoanPreset[]>) => {
        state.loading = false;
        state.presets = action.payload;
      })
      .addCase(getLoanPresets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(updateLoanPreset.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateLoanPreset.fulfilled, (state, action: PayloadAction<LoanPreset>) => {
        state.loading = false;
        state.success = true;
        const index = state.presets.findIndex(
          (preset) => preset._id === action.payload._id
        );
        if (index !== -1) {
          state.presets[index] = action.payload;
        }
        if (state.currentPreset && state.currentPreset._id === action.payload._id) {
          state.currentPreset = action.payload;
        }
      })
      .addCase(updateLoanPreset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })

      .addCase(deleteLoanPreset.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteLoanPreset.fulfilled, (state, action: PayloadAction<{ id: string; message: string }>) => {
        state.loading = false;
        state.success = true;
        state.presets = state.presets.filter(
          (preset) => preset._id !== action.payload.id
        );
        if (state.currentPreset && state.currentPreset._id === action.payload.id) {
          state.currentPreset = null;
        }
      })
      .addCase(deleteLoanPreset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });
  },
});

export const {
  clearCurrentPreset,
  clearError,
  clearSuccess,
  setCurrentPreset,
  resetLoanPresetState,
} = loanPresetSlice.actions;

export default loanPresetSlice.reducer;
