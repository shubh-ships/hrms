import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosClient from "../../lib/api/client";
import { RootState } from "@/store";

interface User {
  _id: string;
  user_id: {
    _id: string;
    name: string;
    email: string;
    phoneNumber: number;
    isActive: boolean;
    isFreezed: boolean;
    is_organizer: boolean;
    is_superuser: boolean;
    id: string;
  };
  roleDefinitionId: {
    _id: string;
    roleName: string;
    hierarchyLevel: number;
    organizationId: string;
    permissions: string[];
    createdAt: string;
    updatedAt: string;
  };
  departments: Array<{
    _id: string;
    name: string;
    alias: string;
  }>;
  parentRoleId?: {
    _id: string;
    user_id: {
      _id: string;
      name: string;
      email: string;
      id: string;
    };
    roleDefinitionId: {
      _id: string;
      roleName: string;
    };
  } | null;
  status: string;
  history: any[];
}

interface Department {
  _id: string;
  name: string;
  alias: string;
}

interface HierarchyUser {
  userId: string;
  name: string;
  email: string;
  departments: Department[];
  departmentId?: string;
  role: string;
  hierarchyLevel: number;
  parentRoleId?: string;
}

interface UserState {
  users: User[];
  currentUser: User | null;
  hierarchyUsers: HierarchyUser[];
  loading: boolean;
  hierarchyLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: [],
  currentUser: null,
  hierarchyUsers: [],
  loading: false,
  hierarchyLoading: false,
  error: null,
};


export const loginUser = createAsyncThunk(
  "users/login",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosClient.post("/users/login", credentials);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const getProfile = createAsyncThunk(
  "users/profile",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');

      const response = await axiosClient.get("/users/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch profile"
      );
    }
  }
);

export const updateProfile = createAsyncThunk(
  "users/updateProfile",
  async (updateData: FormData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');

      const response = await axiosClient.put("/users/profile", updateData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Update failed");
    }
  }
);



export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');

      const response = await axiosClient.get("/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data.users;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch users"
      );
    }
  }
);

export const createUser = createAsyncThunk(
  "users/create",
  async (
    userData: {
      name: string;
      email: string;
      phoneNumber: string;
      role: string;
      departmentId: string;
    },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');

      const response = await axiosClient.post("/users/register", userData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "User creation failed"
      );
    }
  }
);

export const updateUserStatus = createAsyncThunk(
  'users/updateStatus',
  async ({ id, isActive }: { id: string; isActive: boolean }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');

      const response = await axiosClient.put(`/users/edit/${id}`, { 
        updateUserData: { isActive } 
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Status update failed');
    }
  }
);

export const updateUser = createAsyncThunk(
  "users/updateUser",
  async (
    {
      id,
      updateUserData,
      updateRollData
    }: {
      id: string;
      updateUserData?: any;
      updateRollData?: any;
    },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      const requestData: {
        updateUserData?: Partial<User>;
        updateRollData?: any;
      } = {};

      if (updateUserData) {
        requestData.updateUserData = updateUserData;
      }

      if (updateRollData) {
        requestData.updateRollData = updateRollData;
      }

      const response = await axiosClient.put(`/users/edit/${id}`, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update user"
      );
    }
  }
);


export const fetchUserHierarchy = createAsyncThunk(
  "users/fetchHierarchy",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');

      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axiosClient.get("/users/hierarchy", {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
      });

      return response.data.data as HierarchyUser[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch user hierarchy"
      );
    }
  }
);

export const deleteUser = createAsyncThunk(
  "users/delete",
  async (userId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      const response = await axiosClient.delete(`/users/delete/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "User deletion failed"
      );
    }
  }
);

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    updateUserInState: (
      state,
      action: { payload: { id: string; updates: Partial<User> } }
    ) => {
      const index = state.users.findIndex(
        (u) =>
          u._id === action.payload.id || (u as any)._id === action.payload.id
      );
      if (index !== -1) {
        state.users[index] = {
          ...state.users[index],
          ...action.payload.updates,
        };
      }
    },
    clearHierarchyUsers: (state) => {
      state.hierarchyUsers = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(getProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        // The service returns the standard successResponse format: { success, message, data: { user } }
        const userDoc = action.payload.data?.user;
        if (userDoc && userDoc._id) {
            const index = state.users.findIndex(u => u._id === userDoc._id);
            if (index !== -1) {
                // Update the user record in place for instant UI reflection
                state.users[index] = { ...state.users[index], ...userDoc };
            }
        }
      })
      .addCase(updateUserStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        state.loading = false;
        // Backend returns standard nesting: { success, data: { user } }
        const updatedUser = action.payload.data?.user;
        if (updatedUser && updatedUser._id) {
            const index = state.users.findIndex(u => u._id === updatedUser._id);
            if (index !== -1) {
                state.users[index] = { ...state.users[index], ...updatedUser };
            }
        }
      })
      .addCase(updateUserStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(fetchUserHierarchy.pending, (state) => {
        state.hierarchyLoading = true;
        state.error = null;
      })
      .addCase(fetchUserHierarchy.fulfilled, (state, action) => {
        state.hierarchyLoading = false;
        state.hierarchyUsers = action.payload || [];
      })
      .addCase(fetchUserHierarchy.rejected, (state, action) => {
        state.hierarchyLoading = false;
        state.error = action.payload as string;
        state.hierarchyUsers = [];
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        const deletedId = action.meta.arg;
        // Filter out any role entries that belong to the deleted user
        state.users = state.users.filter(u => 
            u._id !== deletedId && 
            (u.user_id?._id || u.user_id) !== deletedId
        );
      });
  },
});

export const selectUsers = (state: RootState) => state.users.users;
export const selectCurrentUser = (state: RootState) => state.users.currentUser;
export const selectUsersLoading = (state: RootState) => state.users.loading;
export const selectUsersError = (state: RootState) => state.users.error;
export const selectHierarchyUsers = (state: RootState) => state.users.hierarchyUsers;
export const selectHierarchyLoading = (state: RootState) => state.users.hierarchyLoading;

export const { clearUserError, updateUserInState, clearHierarchyUsers } = userSlice.actions;
export default userSlice.reducer;
