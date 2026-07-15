import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axiosClient from '../../lib/api/client';
import { RootState } from '@/store/index';

interface User {
  _id: string;
  email: string;
  name: string;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  recipient: string;
  sender: User;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface NotificationState {
  notifications: Notification[];
    previousNotifications: Notification[]; 
  loading: boolean;
  error: string | null;
  unreadCount: number;
}

const initialState: NotificationState = {
  notifications: [],
   previousNotifications: [],
  loading: false,
  error: null,
  unreadCount: 0,
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axiosClient.get('/notification/', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axiosClient.patch(`/notification/${id}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return { id, data: response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to mark notification as read');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    resetNotificationState: () => initialState,
    updateUnreadCount: (state) => {
      state.unreadCount = state.notifications.filter(notification => !notification.isRead).length;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<Notification[]>) => {
        state.loading = false;
        state.previousNotifications = state.notifications;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter(notification => !notification.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(markNotificationAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.loading = false;
        const { id } = action.payload;
        
        const notificationIndex = state.notifications.findIndex(n => n._id === id);
        if (notificationIndex !== -1) {
          state.notifications[notificationIndex].isRead = true;
        }
        
        state.unreadCount = state.notifications.filter(notification => !notification.isRead).length;
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetNotificationState, updateUnreadCount } = notificationSlice.actions;

export const selectNotifications = (state: RootState) => state.notifications.notifications;
export const selectNotificationLoading = (state: RootState) => state.notifications.loading;
export const selectNotificationError = (state: RootState) => state.notifications.error;
export const selectUnreadCount = (state: RootState) => state.notifications.unreadCount;
export const selectUnreadNotifications = (state: RootState) => 
  state.notifications.notifications.filter(notification => !notification.isRead);
export const selectPreviousNotifications = (state: RootState) => state.notifications.previousNotifications;

export default notificationSlice.reducer;
