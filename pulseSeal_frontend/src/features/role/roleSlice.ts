import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '@/lib/api/client';
import { RootState } from '../../store';

interface Role {
  _id?: string;
  roleName: string;
  hierarchyLevel: number;
  parentRoleId?: string | null;
  permissions: string[];
  departments: string[];
  organizationId?: string;
}


interface Admin {
  _id?: string;
  name: string;
  email: string;
  phoneNumber: string;
  organizationId?: string;
  isActive?: boolean;
}


interface CreateAdminPayload {
  name: string;
  email: string;
  password?: string;
  phoneNumber: string;
}


interface UserRole {
  _id?: string;
  user_id: string;
  roleDefinitionId: string;
  parentRoleId?: string | null;
  organizationId?: string;
  departments?: string[];
}

interface AssignRolePayload {
  user_id: string;
  roleDefinitionId: string;
  parentRoleId?: string | null;
}


interface ReplaceUserPayload {
  oldUserId: string;
  newUserId: string;
  mode?: 'replace' | 'newuserreplace' | 'leave';
  newRoleDefId?: string;
  userData?: any;
}


interface RoleState {
  roles: Role[];
  userRoles: UserRole[];
  loading: boolean;
  error: string | null;
  promoteUserLoading: boolean;
  leaveUserLoading: boolean;
  newUserReplaceLoading: boolean;
  assignRoleLoading: boolean;
  replaceUserLoading: boolean;
  createAdminLoading: boolean;
  admins: Admin[];
  getAdminLoading: boolean;
  updateUserRoleLoading: boolean;
}

const initialState: RoleState = {
  roles: [],
  userRoles: [],
  loading: false,
  error: null,
  assignRoleLoading: false,
  replaceUserLoading: false,
  newUserReplaceLoading: false,
  admins: [],
  promoteUserLoading: false,
  leaveUserLoading: false,
  getAdminLoading: false,
  createAdminLoading: false,
  updateUserRoleLoading: false,
};

const getAuthHeaders = (getState: any) => {
  const state = getState() as RootState;
  const token = state.auth.token || localStorage.getItem('token');

  if (!token) {
    throw new Error('Authentication token not found');
  }

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};


export const createRole = createAsyncThunk(
  'roles/createRole',
  async (roleData: Role, { rejectWithValue, getState }) => {
    try {
      const headers = getAuthHeaders(getState);
      const response = await axiosClient.post('/newuser/roles', roleData, { headers });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create role');
    }
  }
);


export const getAllRoles = createAsyncThunk(
  'roles/getAllRoles',
  async (_, { rejectWithValue, getState }) => {
    try {
      const headers = getAuthHeaders(getState);
      const response = await axiosClient.get('/newuser/roles', { headers });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch roles');
    }
  }
);


export const assignRoleToUser = createAsyncThunk(
  'roles/assignRoleToUser',
  async (payload: AssignRolePayload, { rejectWithValue, getState }) => {
    try {
      const headers = getAuthHeaders(getState);
      const response = await axiosClient.post('/newuser/assign-role', payload, { headers });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to assign role');
    }
  }
);


export const getUserRoles = createAsyncThunk(
  'roles/getUserRoles',
  async (userId: string, { rejectWithValue, getState }) => {
    try {
      const headers = getAuthHeaders(getState);
      const response = await axiosClient.get(`/newuser/assign-role/${userId}`, { headers });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch user roles');
    }
  }
);


export const replaceUserRole = createAsyncThunk(
  'roles/replaceUserRole',
  async (payload: ReplaceUserPayload, { rejectWithValue, getState }) => {
    try {
      const headers = getAuthHeaders(getState);
      const response = await axiosClient.patch('/newuser/update-user-role', payload, { headers });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to replace user role');
    }
  }
);


export const getAdmin = createAsyncThunk(
  'roles/getAdmin',
  async (_, { rejectWithValue, getState }) => {
    try {
      const headers = getAuthHeaders(getState);
      const response = await axiosClient.get('/newuser/admin', { headers });
      return response.data.data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch admins');
    }
  }
);




export const createAdmin = createAsyncThunk(
  'roles/createAdmin',
  async (adminData: CreateAdminPayload, { rejectWithValue, getState }) => {
    try {
      const headers = getAuthHeaders(getState);
      const response = await axiosClient.post('/newuser/admin', adminData, { headers });
      return response.data.data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create admin');
    }
  }
);




export const createUserWithRole = createAsyncThunk(
  'roles/createUserWithRole',
  async (userData: any, { rejectWithValue, getState }) => {
    try {
      const headers = getAuthHeaders(getState);
      const response = await axiosClient.post('/newuser/users', userData, { headers });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create user');
    }
  }
);

export const updateRole = createAsyncThunk(
  'roles/updateRole',
  async ({ id, roleData }: { id: string; roleData: Partial<Role> }, { rejectWithValue, getState }) => {
    try {
      const headers = getAuthHeaders(getState);
      const response = await axiosClient.patch(`/newuser/roles/${id}`, roleData, { headers });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update role');
    }
  }
);


const roleSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    resetRoleState: () => initialState,
    clearError: (state) => {
      state.error = null;
    },
    clearUserRoles: (state) => {
      state.userRoles = [];
    },
    clearAdmins: (state) => {
      state.admins = [];
    },
    updateAdminInState: (state, action) => {
      const { id, updates } = action.payload;
      const adminIndex = state.admins.findIndex(admin => admin._id === id);
      if (adminIndex !== -1) {
        state.admins[adminIndex] = { ...state.admins[adminIndex], ...updates };
      }
    },
    removeAdminFromState: (state, action) => {
      state.admins = state.admins.filter(admin => admin._id !== action.payload);
    },
    updateRoleInState: (state, action) => {
      const { id, updates } = action.payload;
      const roleIndex = state.roles.findIndex(role => role._id === id);
      if (roleIndex !== -1) {
        state.roles[roleIndex] = { ...state.roles[roleIndex], ...updates };
      }
    },
    removeRoleFromState: (state, action) => {
      state.roles = state.roles.filter(role => role._id !== action.payload);
    },
    updateUserRoleInState: (state, action) => {
      const { id, updates } = action.payload;
      const userRoleIndex = state.userRoles.findIndex(userRole => userRole._id === id);
      if (userRoleIndex !== -1) {
        state.userRoles[userRoleIndex] = { ...state.userRoles[userRoleIndex], ...updates };
      }
    }
  },
  extraReducers: (builder) => {
    builder

      .addCase(createRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.loading = false;
        state.roles.push(action.payload);
      })
      .addCase(createRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(updateRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.loading = false;

        const roleIndex = state.roles.findIndex(role => role._id === action.payload._id);
        if (roleIndex !== -1) {
          state.roles[roleIndex] = action.payload;
        }
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })



      .addCase(getAllRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload;
      })
      .addCase(getAllRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createAdmin.pending, (state) => {
        state.createAdminLoading = true;
        state.error = null;
      })
      .addCase(createAdmin.fulfilled, (state, action) => {
        state.createAdminLoading = false;

        if (action.payload) {
          state.admins.push(action.payload);
        }
      })
      .addCase(createAdmin.rejected, (state, action) => {
        state.createAdminLoading = false;
        state.error = action.payload as string;
      })


      .addCase(getAdmin.pending, (state) => {
        state.getAdminLoading = true;
        state.error = null;
      })
      .addCase(getAdmin.fulfilled, (state, action) => {
        state.getAdminLoading = false;
        state.admins = Array.isArray(action.payload) ? action.payload : [action.payload];
      })
      .addCase(getAdmin.rejected, (state, action) => {
        state.getAdminLoading = false;
        state.error = action.payload as string;
      })


      .addCase(replaceUserRole.pending, (state, action) => {
        const { mode } = action.meta.arg;
        if (mode === 'newuserreplace') {
          state.newUserReplaceLoading = true;
        } else {
          state.replaceUserLoading = true;
        }
        state.error = null;
      })
      .addCase(replaceUserRole.fulfilled, (state, action) => {
        state.replaceUserLoading = false;
        state.newUserReplaceLoading = false;


        const { mode, oldUserId, newUserId } = action.meta.arg;

        if (mode === 'replace') {

          const index = state.userRoles.findIndex(ur => ur.user_id === oldUserId);
          if (index !== -1) {
            state.userRoles[index] = { ...state.userRoles[index], user_id: newUserId };
          }
        } else if (mode === 'newuserreplace') {

          state.userRoles = state.userRoles.filter(ur => ur.user_id !== oldUserId);
          if (action.payload) {
            state.userRoles.push(action.payload);
          }
        } else if (mode === 'leave') {

          state.userRoles = state.userRoles.filter(ur => ur.user_id !== oldUserId);
        }
      })
      .addCase(replaceUserRole.rejected, (state, action) => {
        state.replaceUserLoading = false;
        state.newUserReplaceLoading = false;
        state.error = action.payload as string;
      })



      .addCase(assignRoleToUser.pending, (state) => {
        state.assignRoleLoading = true;
        state.error = null;
      })
      .addCase(assignRoleToUser.fulfilled, (state, action) => {
        state.assignRoleLoading = false;

        const existingIndex = state.userRoles.findIndex(
          ur => ur.user_id === action.payload.user_id && ur.roleDefinitionId === action.payload.roleDefinitionId
        );
        if (existingIndex === -1) {
          state.userRoles.push(action.payload);
        } else {
          state.userRoles[existingIndex] = action.payload;
        }
      })
      .addCase(assignRoleToUser.rejected, (state, action) => {
        state.assignRoleLoading = false;
        state.error = action.payload as string;
      })


      .addCase(getUserRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.userRoles = Array.isArray(action.payload) ? action.payload : [action.payload];
      })
      .addCase(getUserRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })


      .addCase(createUserWithRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUserWithRole.fulfilled, (state, action) => {
        state.loading = false;

        if (action.payload.userRole) {
          state.userRoles.push(action.payload.userRole);
        }
      })
      .addCase(createUserWithRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addMatcher(
        (action) => action.type === 'users/updateUser/fulfilled' || action.type === 'users/updateStatus/fulfilled',
        (state, action: any) => {
          // If an admin was updated, we should reflect it in our local state too
          const updatedUser = action.payload.data?.user;
          if (updatedUser && updatedUser._id) {
            const index = state.admins.findIndex(a => a._id === updatedUser._id);
            if (index !== -1) {
              state.admins[index] = {
                ...state.admins[index],
                name: updatedUser.name || state.admins[index].name,
                email: updatedUser.email || state.admins[index].email,
                phoneNumber: updatedUser.phoneNumber || state.admins[index].phoneNumber,
                isActive: updatedUser.isActive !== undefined ? updatedUser.isActive : state.admins[index].isActive,
              };
            }
          }
        }
      );
  },
});

export const {
  resetRoleState,
  clearError,
  clearUserRoles,
  clearAdmins,
  updateAdminInState,
  removeAdminFromState,
  updateRoleInState,
  removeRoleFromState,
  updateUserRoleInState
} = roleSlice.actions;


export const selectRoles = (state: RootState) => state.roles.roles;
export const selectUserRoles = (state: RootState) => state.roles.userRoles;
export const selectRoleLoading = (state: RootState) => state.roles.loading;
export const selectAssignRoleLoading = (state: RootState) => state.roles.assignRoleLoading;
export const selectReplaceUserLoading = (state: RootState) => state.roles.replaceUserLoading;
export const selectRoleError = (state: RootState) => state.roles.error;
export const selectAdmins = (state: RootState) => state.roles.admins;
export const selectGetAdminLoading = (state: RootState) => state.roles.getAdminLoading;
export const selectAdminById = (adminId: string) => (state: RootState) =>
  state.roles.admins.find(admin => admin._id === adminId);

export const selectRolesByHierarchy = (state: RootState) =>
  state.roles.roles.slice().sort((a, b) => a.hierarchyLevel - b.hierarchyLevel);

export const selectUserRolesByUserId = (userId: string) => (state: RootState) =>
  state.roles.userRoles.filter(userRole => userRole.user_id === userId);
export const selectNewUserReplaceLoading = (state: RootState) => state.roles.newUserReplaceLoading;
export const selectLeaveUserLoading = (state: RootState) => state.roles.leaveUserLoading;


export const selectRoleById = (roleId: string) => (state: RootState) =>
  state.roles.roles.find(role => role._id === roleId);

export default roleSlice.reducer;
