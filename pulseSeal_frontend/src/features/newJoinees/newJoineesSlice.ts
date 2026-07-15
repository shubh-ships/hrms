import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/lib/api/client';
import { RootState } from '@/store';

interface NewJoinee {
    id: string;
    name: string;
    role: string;
    team: string;
    joinDate: string;
    avatar: string | null;
}

interface NewJoineesState {
    data: NewJoinee[];
    loading: boolean;
    error: string | null;
}

const initialState: NewJoineesState = {
    data: [],
    loading: false,
    error: null,
};

// Async thunk to fetch upcoming joiners
export const fetchUpcomingJoiners = createAsyncThunk(
    'newJoinees/fetchUpcomingJoiners',
    async (params: { startDate?: string; endDate?: string }, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get('/employee/upcoming-joiners', { params });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch new joinees');
        }
    }
);

const newJoineesSlice = createSlice({
    name: 'newJoinees',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchUpcomingJoiners.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUpcomingJoiners.fulfilled, (state, action) => {
                state.loading = false;
                const rawData = action.payload.data || [];
                // Map backend fields to frontend model
                state.data = rawData.map((item: any) => ({
                    id: item._id,
                    name: item.name,
                    role: item.role || 'New Member',
                    team: item.department || 'General',
                    joinDate: item.joiningDate ? new Date(item.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-',
                    avatar: item.photo,
                }));
            })
            .addCase(fetchUpcomingJoiners.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const selectNewJoinees = (state: RootState) => state.newJoinees.data;
export const selectNewJoineesLoading = (state: RootState) => state.newJoinees.loading;
export const selectNewJoineesError = (state: RootState) => state.newJoinees.error;

export default newJoineesSlice.reducer;
