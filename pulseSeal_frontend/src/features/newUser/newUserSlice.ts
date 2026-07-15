import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosClient from "@/lib/api/client";
import { RootState } from "@/store";


export interface AdminUser {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phoneNumber: string;
  organizationId: string;
  departmentId: string[];
  isAdmin?: boolean;
  isActive?: boolean;
}

interface CreateAdminPayload {
  name: string;
  email: string;
  password?: string;
  phoneNumber: string;
  departmentId?: string[];
}

interface AdminState {
  admins: AdminUser[];
  currentAdmin: AdminUser | null;
  loading: boolean;
  createAdminLoading: boolean;
  error: string | null;
}


export const getAdminUsers = createAsyncThunk(
  "newUser/getAdminUsers",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.get("/newuser/admin", {
        headers: {
          Authorization: `Bearer ${token}`,
          "cache-control": "no-cache",
        },
      });

      const adminUsers = response.data.data.user;

      const adminUsersWithFlag = Array.isArray(adminUsers)
        ? adminUsers.map((admin: any) => ({ ...admin, isAdmin: true }))
        : [];

      return adminUsersWithFlag;
    } catch (error: any) {
      console.error("Error fetching admin users:", error);
      return rejectWithValue(
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch admin users"
      );
    }
  }
);

export const createAdmin = createAsyncThunk(
  "newUser/createAdmin",
  async (adminData: CreateAdminPayload, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.post("/newuser/admin", adminData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return response.data.data.user;
    } catch (error: any) {
      console.error("Error creating admin:", error);
      return rejectWithValue(
        error.response?.data?.message ||
        error.message ||
        "Failed to create admin"
      );
    }
  }
);

export const updateAdmin = createAsyncThunk(
  "newUser/updateAdmin",
  async ({ id, adminData }: { id: string, adminData: Partial<CreateAdminPayload> & { isActive?: boolean } }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      // Backend expects { updateUserData: { ... } }
      const response = await axiosClient.put(`/users/edit/${id}`, { updateUserData: adminData }, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return response.data.data.user;
    } catch (error: any) {
      console.error("Error updating admin:", error);
      return rejectWithValue(
        error.response?.data?.message ||
        error.message ||
        "Failed to update admin"
      );
    }
  }
);

export const deleteAdmin = createAsyncThunk(
  "newUser/deleteAdmin",
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.delete(`/users/delete/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return id;
    } catch (error: any) {
      console.error("Error deleting admin:", error);
      return rejectWithValue(
        error.response?.data?.message ||
        error.message ||
        "Failed to delete admin"
      );
    }
  }
);

export const replaceUserRole = createAsyncThunk(
  "newUser/replaceUserRole",
  async (payload: { 
    oldUserId: string, 
    newUserId?: string, 
    mode?: "replace" | "newuserreplace" | "leave",
    userData?: any,
    newRoleDefId?: string 
  }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.patch("/newuser/update-user-role", payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        "Failed to replace user"
      );
    }
  }
);

const initialState: AdminState = {
  admins: [],
  currentAdmin: null,
  loading: false,
  createAdminLoading: false,
  error: null,
};

const newUserSlice = createSlice({
  name: "newUser",
  initialState,
  reducers: {
    clearCurrentAdmin: (state) => {
      state.currentAdmin = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentAdmin: (state, action: PayloadAction<AdminUser>) => {
      state.currentAdmin = action.payload;
    },
    resetAdminState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAdminUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAdminUsers.fulfilled, (state, action: PayloadAction<AdminUser[]>) => {
        state.loading = false;
        state.admins = action.payload;
      })
      .addCase(getAdminUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createAdmin.pending, (state) => {
        state.createAdminLoading = true;
        state.error = null;
      })
      .addCase(createAdmin.fulfilled, (state, action: PayloadAction<AdminUser>) => {
        state.createAdminLoading = false;
        if (action.payload) {
          state.admins.push({ ...action.payload, isAdmin: true });
        }
      })
      .addCase(createAdmin.rejected, (state, action) => {
        state.createAdminLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateAdmin.pending, (state) => {
        state.createAdminLoading = true;
        state.error = null;
      })
      .addCase(updateAdmin.fulfilled, (state, action) => {
        state.createAdminLoading = false;
        const index = state.admins.findIndex(a => a._id === action.payload._id);
        if (index !== -1) {
          state.admins[index] = { ...action.payload, isAdmin: true };
        }
      })
      .addCase(updateAdmin.rejected, (state, action) => {
        state.createAdminLoading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteAdmin.pending, (state) => {
        state.createAdminLoading = true;
        state.error = null;
      })
      .addCase(deleteAdmin.fulfilled, (state, action) => {
        state.createAdminLoading = false;
        state.admins = state.admins.filter(a => a._id !== action.payload);
      })
      .addCase(deleteAdmin.rejected, (state, action) => {
        state.createAdminLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearCurrentAdmin,
  clearError,
  setCurrentAdmin,
  resetAdminState,
} = newUserSlice.actions;

export const selectAdmins = (state: RootState) => state.newUser.admins;
export const selectAdminLoading = (state: RootState) => state.newUser.loading;
export const selectAdminError = (state: RootState) => state.newUser.error;
export const selectCreateAdminLoading = (state: RootState) => state.newUser.createAdminLoading;

export default newUserSlice.reducer;
