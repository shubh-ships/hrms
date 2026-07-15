import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from '@/lib/api/client';
import { RootState } from '../../store';

// TYPES

export interface BirthdayRecord {
    id: string;
    name: string;
    role: string;
    team: string;
    date: string;
    status: string;
    isToday: boolean;
    avatar: string;
}

export interface AnniversaryRecord {
    id: string;
    name: string;
    role: string;
    team: string;
    joinDate: string;
    years: string;
    isToday: boolean;
    avatar: string;
}

interface CelebrationsState {
    birthdays: BirthdayRecord[];
    anniversaries: AnniversaryRecord[];
    loading: boolean;
    error: string | null;
}

const initialState: CelebrationsState = {
    birthdays: [],
    anniversaries: [],
    loading: false,
    error: null,
};

// THUNKS

export const fetchBirthdays = createAsyncThunk(
    'celebrations/fetchBirthdays',
    async (params: { startDate?: string; endDate?: string } = {}, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get('/celebrations/birthdays', { params });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to fetch birthdays'
            );
        }
    }
);

export const fetchAnniversaries = createAsyncThunk(
    'celebrations/fetchAnniversaries',
    async (params: { startDate?: string; endDate?: string } = {}, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get('/celebrations/anniversaries', { params });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to fetch anniversaries'
            );
        }
    }
);

// ─────────────────────────────────────────────
// SLICE
// ─────────────────────────────────────────────

const celebrationsSlice = createSlice({
    name: 'celebrations',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Birthdays
            .addCase(fetchBirthdays.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBirthdays.fulfilled, (state, action) => {
                state.loading = false;
                const rawData = Array.isArray(action.payload?.data)
                    ? action.payload.data
                    : Array.isArray(action.payload)
                        ? action.payload
                        : [];

                const today = new Date();
                const todayMMDD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

                state.birthdays = rawData.map((item: any) => {
                    const dob = item.birthday ? new Date(item.birthday) : null;
                    const dobMMDD = dob ? `${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}` : '';
                    const isToday = dobMMDD === todayMMDD;

                    return {
                        id: item._id || item.id || Math.random().toString(),
                        name: item.name || 'Unknown',
                        role: item.role || 'Employee',
                        team: item.department || '-',
                        date: dob ? dob.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-',
                        status: isToday ? 'Today' : 'Upcoming',
                        isToday,
                        avatar: item.photo,
                    };
                });
            })
            .addCase(fetchBirthdays.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Anniversaries
            .addCase(fetchAnniversaries.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAnniversaries.fulfilled, (state, action) => {
                state.loading = false;
                const rawData = Array.isArray(action.payload?.data)
                    ? action.payload.data
                    : Array.isArray(action.payload)
                        ? action.payload
                        : [];

                const today = new Date();
                const todayMMDD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

                state.anniversaries = rawData.map((item: any) => {
                    const jd = item.joinDate ? new Date(item.joinDate) : null;
                    const jdMMDD = jd ? `${String(jd.getMonth() + 1).padStart(2, '0')}-${String(jd.getDate()).padStart(2, '0')}` : '';
                    const isToday = jdMMDD === todayMMDD;

                    return {
                        id: item._id || item.id || Math.random().toString(),
                        name: item.name || 'Unknown',
                        role: item.role || 'Employee',
                        team: item.department || '-',
                        joinDate: jd ? jd.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-',
                        years: item.years ? `${item.years} ${item.years === 1 ? 'Year' : 'Years'}` : '0 Years',
                        isToday,
                        avatar: item.photo,
                    };
                });
            })
            .addCase(fetchAnniversaries.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

// SELECTORS

export const selectBirthdays = (state: RootState) => state.celebrations.birthdays;
export const selectAnniversaries = (state: RootState) => state.celebrations.anniversaries;
export const selectCelebrationsLoading = (state: RootState) => state.celebrations.loading;
export const selectCelebrationsError = (state: RootState) => state.celebrations.error;

export default celebrationsSlice.reducer;
