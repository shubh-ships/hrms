import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import axiosClient from "@/lib/api/client"
import type { RootState } from "../../store"

interface Fraud {
  _id: string
  user_id: {
    _id: string
    name: string
    avatar?: string
  }
  fraudType: string
  assignmentId: {
    _id: string
    title: string
  }
  departmentId: string
  organization_id: string
  status: "Flagged" | "Suspicious" | "Clean"
  createdAt: string
  updatedAt: string
}

interface FraudState {
  allFrauds: Fraud[];
  departmentFrauds: Fraud[];
  weeklySummary: any;
  currentFraud: Fraud | null;
  loading: boolean;
  error: string | null;
}

const initialState: FraudState = {
  allFrauds: [],
  departmentFrauds: [],
  weeklySummary: null,
  currentFraud: null,
  loading: false,
  error: null,
}

export const listAllFrauds = createAsyncThunk(
  "fraud/listAllFrauds",
  async (orgId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState
      const token = state.auth.token || localStorage.getItem("token")

      if (!token) {
        throw new Error("Authentication token not found")
      }

      const response = await axiosClient.get(`/fraud/list/${orgId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch frauds")
    }
  },
)

export const listDepartmentFrauds = createAsyncThunk(
  "fraud/listDepartmentFrauds",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState
      const token = state.auth.token || localStorage.getItem("token")

      if (!token) {
        throw new Error("Authentication token not found")
      }

      const response = await axiosClient.get(`/fraud/department`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      })

      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch department frauds")
    }
  },
)

export const getFraudDetail = createAsyncThunk(
  "fraud/getFraudDetail",
  async (fraudId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState
      const token = state.auth.token || localStorage.getItem("token")

      if (!token) {
        throw new Error("Authentication token not found")
      }

      const response = await axiosClient.get(`/fraud/detail/${fraudId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch fraud details")
    }
  },
)

export const cleanFraud = createAsyncThunk(
  "fraud/cleanFraud",
  async ({ fraudId, status }: { fraudId: string; status: string }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState
      const token = state.auth.token || localStorage.getItem("token")

      if (!token) {
        throw new Error("Authentication token not found")
      }

      const response = await axiosClient.patch(
        `/fraud/clean/${fraudId}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to clean fraud")
    }
  },
)

export const getWeeklyFraudSummary = createAsyncThunk(
  "fraud/getWeeklySummary",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState
      const token = state.auth.token || localStorage.getItem("token")
      const response = await axiosClient.get("/fraud/summary/week", {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch weekly summary")
    }
  }
)

export const getFraudListByType = createAsyncThunk(
  "fraud/getFraudListByType",
  async ({ fraudType, page = 1, limit = 50 }: { fraudType?: string; page?: number; limit?: number }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState
      const token = state.auth.token || localStorage.getItem("token")
      const queryParams = new URLSearchParams();
      if (fraudType) queryParams.append("fraudType", fraudType);
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());

      const response = await axiosClient.get(`/fraud/list?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch fraud list")
    }
  }
)

const fraudSlice = createSlice({
  name: "fraud",
  initialState,
  reducers: {
    resetFraudState: () => initialState,
    clearCurrentFraud: (state) => {
      state.currentFraud = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listAllFrauds.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(listAllFrauds.fulfilled, (state, action) => {
        state.loading = false
        state.allFrauds = action.payload
      })
      .addCase(listAllFrauds.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      .addCase(listDepartmentFrauds.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(listDepartmentFrauds.fulfilled, (state, action) => {
        state.loading = false
        state.departmentFrauds = action.payload
      })
      .addCase(listDepartmentFrauds.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      .addCase(getFraudDetail.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getFraudDetail.fulfilled, (state, action) => {
        state.loading = false
        state.currentFraud = action.payload
      })
      .addCase(getFraudDetail.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(cleanFraud.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(cleanFraud.fulfilled, (state, action) => {
        state.loading = false
        state.allFrauds = state.allFrauds.map((fraud: Fraud) =>
          fraud._id === action.payload._id ? action.payload : fraud,
        )
        state.departmentFrauds = state.departmentFrauds.map((fraud: Fraud) =>
          fraud._id === action.payload._id ? action.payload : fraud,
        )
        if (state.currentFraud?._id === action.payload._id) {
          state.currentFraud = action.payload
        }
      })
      .addCase(cleanFraud.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(getWeeklyFraudSummary.pending, (state) => {
        state.loading = true
      })
      .addCase(getWeeklyFraudSummary.fulfilled, (state, action) => {
        state.loading = false
        state.weeklySummary = action.payload
      })
      .addCase(getWeeklyFraudSummary.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(getFraudListByType.pending, (state) => {
        state.loading = true
      })
      .addCase(getFraudListByType.fulfilled, (state, action) => {
        state.loading = false
        state.allFrauds = action.payload.allFrauds || action.payload
      })
      .addCase(getFraudListByType.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { resetFraudState, clearCurrentFraud } = fraudSlice.actions

export const selectAllFrauds = (state: RootState) => state.fraud1.allFrauds;
export const selectDepartmentFrauds = (state: RootState) => state.fraud1.departmentFrauds;
export const selectWeeklySummary = (state: RootState) => state.fraud1.weeklySummary;
export const selectCurrentFraud = (state: RootState) => state.fraud1.currentFraud;
export const selectFraudLoading = (state: RootState) => state.fraud1.loading;
export const selectFraudError = (state: RootState) => state.fraud1.error;

export default fraudSlice.reducer

export type { Fraud }
export type FraudStatus = "Flagged" | "Suspicious" | "Clean"
