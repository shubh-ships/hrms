import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from '@/lib/api/client';
import { RootState } from '../../store';
import { jwtDecode } from 'jwt-decode';

interface LeaderboardEntry {
  userId: string;
  month: string;
  year: number;
  efficiency: number;
  attendanceAverage: number;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  sealSubmissionRate: number;
  name?: string;
  avatar?: string;
  department?: string;
}

interface MonthlyLeaderboard {
  monthYear: string;
  leaderboard: LeaderboardEntry[];
  topper: LeaderboardEntry;
}

interface LeaderboardState {
  data: MonthlyLeaderboard[];
  loading: boolean;
  error: string | null;
}

const initialState: LeaderboardState = {
  data: [],
  loading: false,
  error: null,
};

interface DecodedToken {
  user: {
    _id: string;
    departmentId: string;
    organizationId: string;
    name: string;
    email: string;
    id: string;
  };
  userRole: string;
  iat: number;
  exp: number;
}

export const fetchOrganizationLeaderboard = createAsyncThunk(
  'leaderboard/fetchOrganizationLeaderboard',
  async ({ monthYear, departmentId }: { monthYear: string; departmentId: string }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const decoded = jwtDecode<DecodedToken>(token);
      const orgId = decoded.user.organizationId;
      
      if (!orgId) {
        throw new Error('Organization ID not found in token');
      }
      
      const response = await axiosClient.get(`/pulse-efficiency/leaderboard/${departmentId}/${monthYear}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });
      
  
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch leaderboard');
    }
  }
);



const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    resetLeaderboardState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrganizationLeaderboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrganizationLeaderboard.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchOrganizationLeaderboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetLeaderboardState } = leaderboardSlice.actions;

export const selectLeaderboard = (state: RootState) => state.leaderboard.data;
export const selectLeaderboardLoading = (state: RootState) => state.leaderboard.loading;
export const selectLeaderboardError = (state: RootState) => state.leaderboard.error;

export default leaderboardSlice.reducer;