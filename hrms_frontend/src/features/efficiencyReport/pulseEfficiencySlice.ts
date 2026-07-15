 import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import axiosClient from "@/lib/api/client"
import type { RootState } from "@/store"
import { jwtDecode } from "jwt-decode"

interface PulseEfficiencyData {
  _id: string
  greenCount: number
  yellowCount: number
  redCount: number
  totalTasks: number
  approvedCount: number
  sealSubmissionRate: number
  attendanceAverage: number
  efficiency: number
  month: string
  year: number
}

interface LeaderboardUser {
  userId: string
  userName: string
  efficiency: number
  attendanceAverage: number
  greenCount: number
  yellowCount: number
  redCount: number
  totalTasks: number
}

interface LeaderboardData {
  monthYear: string
  leaderboard: LeaderboardUser[]
  topper: {
    userId: string
    userName: string
    efficiency: number
  }
}

interface PulseEfficiencyState {
  weeklyData: PulseEfficiencyData[]
  monthlyData: PulseEfficiencyData[]
  yearlyData: PulseEfficiencyData[]
  leaderboard: LeaderboardData[]
  usersList: LeaderboardUser[]
  selectedUserData: {
    weekly: PulseEfficiencyData[]
    monthly: PulseEfficiencyData[]
    yearly: PulseEfficiencyData[]
  }
  loading: boolean
  error: string | null
    downloadLoading: boolean
}

const initialState: PulseEfficiencyState = {
  weeklyData: [],
  monthlyData: [],
  yearlyData: [],
  leaderboard: [],
  usersList: [],
  selectedUserData: {
    weekly: [],
    monthly: [],
    yearly: [],
  },
  loading: false,
  error: null,
  downloadLoading: false,
}

interface DecodedToken {
  user: {
    _id: string
    departmentId: string
    organizationId: string
    name: string
    email: string
    id: string
  }
  userRole: string
  iat: number
  exp: number
}

const getAuthHeaders = (getState: () => unknown) => {
  const state = getState() as RootState
  const token = state.auth.token || localStorage.getItem("token")
  if (!token) throw new Error("Authentication token not found")
  const decoded = jwtDecode<DecodedToken>(token)
  return {
    token,
    departmentId: decoded.user.departmentId,
    orgId: decoded.user.organizationId,
  }
}

export const fetchWeeklyPulseEfficiency = createAsyncThunk(
  "pulseEfficiency/fetchWeekly",
  async (_, { rejectWithValue, getState }) => {
    try {
      const { token } = getAuthHeaders(getState)
      const response = await axiosClient.get("/pulse-efficiency/weekly", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch weekly data")
    }
  },
)

export const fetchMonthlyPulseEfficiency = createAsyncThunk(
  "pulseEfficiency/fetchMonthly",
  async (monthYear: string, { rejectWithValue, getState }) => {
    try {
      const { token } = getAuthHeaders(getState)
      const response = await axiosClient.get(`/pulse-efficiency/monthly?monthYear=${monthYear}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch monthly data")
    }
  },
)

export const fetchYearlyPulseEfficiency = createAsyncThunk(
  "pulseEfficiency/fetchYearly",
  async (year: string, { rejectWithValue, getState }) => {
    try {
      const { token } = getAuthHeaders(getState)
      const response = await axiosClient.get(`/pulse-efficiency/yearly?year=${year}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch yearly data")
    }
  },
)

export const fetchUserYearlyPulseEfficiency = createAsyncThunk(
  "pulseEfficiency/fetchUserYearly",
  async ({ userId, year }: { userId: string; year: string }, { rejectWithValue, getState }) => {
    try {
      const { token } = getAuthHeaders(getState)
      const response = await axiosClient.get(`/pulse-efficiency/yearly/${userId}?year=${year}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch user yearly data")
    }
  },
)

export const fetchUserMonthlyPulseEfficiency = createAsyncThunk(
  "pulseEfficiency/fetchUserMonthly",
  async ({ userId, monthYear }: { userId: string; monthYear: string }, { rejectWithValue, getState }) => {
    try {
      const { token } = getAuthHeaders(getState)
      const response = await axiosClient.get(`/pulse-efficiency/monthly/${userId}?monthYear=${monthYear}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch user monthly data")
    }
  },
)

export const fetchLeaderboard = createAsyncThunk(
  "pulseEfficiency/fetchLeaderboard",
  async (departmentId: string, { rejectWithValue, getState }) => {
    try {
      const { token } = getAuthHeaders(getState)
      const currentMonthYear = new Date().toISOString().slice(0, 7)
      if (!departmentId) throw new Error("Department ID is required")

      const response = await axiosClient.get(`/pulse-efficiency/leaderboard/${departmentId}/${currentMonthYear}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch leaderboard")
    }
  },
)

export const downloadPulseEfficiencyCSV = createAsyncThunk(
  "pulseEfficiency/downloadCSV",
  async (monthYear: string, { rejectWithValue, getState }) => {
    try {
      const { token } = getAuthHeaders(getState)
      const response = await axiosClient.get(`/pulse-efficiency/download-csv?month=${monthYear}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      })
      
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `pulse-efficiency-${monthYear}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      return { success: true, monthYear }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to download CSV")
    }
  },
) 

const pulseEfficiencySlice = createSlice({
  name: "pulseEfficiency",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearSelectedUserData: (state) => {
      state.selectedUserData = {
        weekly: [],
        monthly: [],
        yearly: [],
      }
    },
    setUsersListFromLeaderboard: (state, action) => {
      const usersMap = new Map()
      action.payload.forEach((monthData: LeaderboardData) => {
        monthData.leaderboard.forEach((user: LeaderboardUser) => {
          if (!usersMap.has(user.userId)) {
            usersMap.set(user.userId, { ...user })
          }
        })
      })
      state.usersList = Array.from(usersMap.values())
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWeeklyPulseEfficiency.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchWeeklyPulseEfficiency.fulfilled, (state, action) => {
        state.loading = false
        state.weeklyData = action.payload || []
      })
      .addCase(fetchWeeklyPulseEfficiency.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(fetchMonthlyPulseEfficiency.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMonthlyPulseEfficiency.fulfilled, (state, action) => {
        state.loading = false
        state.monthlyData = action.payload || []
      })
      .addCase(fetchMonthlyPulseEfficiency.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(fetchYearlyPulseEfficiency.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchYearlyPulseEfficiency.fulfilled, (state, action) => {
        state.loading = false
        state.yearlyData = action.payload || []
      })
      .addCase(fetchYearlyPulseEfficiency.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(fetchUserYearlyPulseEfficiency.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserYearlyPulseEfficiency.fulfilled, (state, action) => {
        state.loading = false
        state.selectedUserData.yearly = action.payload || []
      })
      .addCase(fetchUserYearlyPulseEfficiency.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
 .addCase(downloadPulseEfficiencyCSV.pending, (state) => {
  state.downloadLoading = true
  state.error = null
})
.addCase(downloadPulseEfficiencyCSV.fulfilled, (state) => {
  state.downloadLoading = false
})
.addCase(downloadPulseEfficiencyCSV.rejected, (state, action) => {
  state.downloadLoading = false
  state.error = action.payload as string
})
      .addCase(fetchUserMonthlyPulseEfficiency.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserMonthlyPulseEfficiency.fulfilled, (state, action) => {
        state.loading = false
        state.selectedUserData.monthly = action.payload || []
      })
      .addCase(fetchUserMonthlyPulseEfficiency.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(fetchLeaderboard.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.loading = false
        state.leaderboard = action.payload || []
        
        const usersMap = new Map()
        if (Array.isArray(action.payload)) {
          action.payload.forEach((monthData: LeaderboardData) => {
            if (monthData.leaderboard && Array.isArray(monthData.leaderboard)) {
              monthData.leaderboard.forEach((user: LeaderboardUser) => {
                if (!usersMap.has(user.userId)) {
                  usersMap.set(user.userId, { ...user })
                }
              })
            }
          })
        }
        state.usersList = Array.from(usersMap.values())
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError, clearSelectedUserData, setUsersListFromLeaderboard } = pulseEfficiencySlice.actions

export default pulseEfficiencySlice.reducer
