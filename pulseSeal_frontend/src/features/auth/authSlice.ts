import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';
import axiosClient from '../../lib/api/client';
import { RootState } from '../../store';

interface UserRole {
  _id: string;
  roleName: string;
  hierarchyLevel: number;
  organizationId: string;
  permissions: string[];
  hrmsPermissions?: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface DecodedToken {
  user: {
    _id: string;
    name: string;
    email: string;
    organizationId: string;
    departmentId: string[];
    is_superuser: boolean;
    is_organizer: boolean;
    isActive: boolean;
    isFreezed: boolean;
    id: string;
  };
  userRole?: UserRole;
   org_permission: {
    isHRMS_enabled: boolean;
    isTaskManagement_enabled: boolean;
  };
  iat: number;
  exp: number;
}

interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
  phoneNumber:string;
  address:string;
  city:string,
  country:string,
  linkedin:string,
  pincode:string;
   departmentId: string;
}

interface PopulatedDepartment {
  _id: string;
  name: string;
}

interface User {
  _id: string;
  role: string;
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  coverPicture?: string;
  departmentId?: string[];
  organizationId?: string;
  dep_id?: PopulatedDepartment;
  userId?: PopulatedUser;
  user_id?: PopulatedUser;
}


interface AuthState {
  user: User | null;
  token: string | null;
  isSuperUser: boolean;
  isOrganizer: boolean;
  role: string | null;
  permissions: string[];
  loading: boolean;
  error: string | null;
  users: User[];
  searchResults: User[];
   hrmsPermissions: string[];

  orgPermissions: {
    isHRMS_enabled: boolean;
    isTaskManagement_enabled: boolean;
  };
  
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

interface ResetPasswordData {
  otp: string;
  newPassword: string;
  email:string;
}

interface ForgotPasswordData {
  email: string;
}

interface VerifyOtpData {
  email: string;
  otp: string;
}

interface UpdateProfileData {
  name?: string;
  profilePicture?: File;
  coverPicture?: File;
}


const getInitialState = (): AuthState => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (token) {
      const decodedToken = jwtDecode<DecodedToken>(token);

      if (decodedToken.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        return { 
          user: null, 
          isSuperUser: false,
          isOrganizer: false,
          token: null, 
          role: null, 
          permissions: [],
             hrmsPermissions: [],
          orgPermissions: {
            isHRMS_enabled: false,
            isTaskManagement_enabled: false,
          },
          loading: false, 
          error: null,
          users: [],
          searchResults: []
        };
      }

      const isSuperUser = decodedToken.user.is_superuser;
      const isOrganizer = decodedToken.user.is_organizer;
      let userRole: string;

      if (isSuperUser) {
        userRole = 'SUPER_ADMIN';
      } else if (isOrganizer) {
        userRole = 'ADMIN';
      } else {
        userRole = decodedToken.userRole?.roleName || 'MEMBER';
      }

      const permissions = !isSuperUser && !isOrganizer ? (decodedToken.userRole?.permissions || []) : [];
        const hrmsPermissions = !isSuperUser && !isOrganizer ? (decodedToken.userRole?.hrmsPermissions || []) : [];
         const orgPermissions = {
        isHRMS_enabled: decodedToken.org_permission?.isHRMS_enabled || false,
        isTaskManagement_enabled: decodedToken.org_permission?.isTaskManagement_enabled || false,
      };

      return {
        user: {
          id: decodedToken.user.id,
          name: decodedToken.user.name,
          email: decodedToken.user.email,
          _id: decodedToken.user.id,
          role: userRole,
          profilePicture: undefined,
          coverPicture: undefined,
          departmentId: decodedToken.user.departmentId,
          organizationId: decodedToken.user.organizationId,
        },
        token: token,
        role: userRole,
              hrmsPermissions: hrmsPermissions,
        orgPermissions: orgPermissions,
        isSuperUser: isSuperUser,
        isOrganizer: isOrganizer,
        permissions: permissions,
        loading: false,
        error: null,
        users: [],
        searchResults: []
      };
    }
  } catch (error) {
    console.error("Failed to parse token from localStorage", error);
    localStorage.removeItem('token');
  }

  return {
    user: null,
    token: null,
    role: null,
    isSuperUser: false,
    isOrganizer: false,
    permissions: [],
    hrmsPermissions: [],
    orgPermissions: {
      isHRMS_enabled: false,
      isTaskManagement_enabled: false,
    },
    loading: false,
    error: null,
    users: [],
    searchResults: []
  };
};

const initialState: AuthState = getInitialState();

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/users/login', credentials);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/users/register', userData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue,  getState }) => {
    try {
      const state = getState() as RootState;
        const token = state.auth.token || localStorage.getItem('token');
      const response = await axiosClient.get('/users/profile',
         {
        headers: {
          'Content-Type': 'multipart/form-data',
           Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache'
        },
      }
      );
      
      return response.data.data.userProfile as User;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const getAllUsers = createAsyncThunk(
  'auth/getAllUsers',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
        const token = state.auth.token || localStorage.getItem('token');
      const response = await axiosClient.get('/users/',
         {
        headers: {
          'Content-Type': 'multipart/form-data',
           Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache'
        },
      });
   
      return response.data.data.users as User[];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (updateData: FormData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put('/users/profile/edit/:id', updateData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const deleteProfile = createAsyncThunk(
  'auth/deleteProfile',
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`/users/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete profile');
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData: ChangePasswordData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.patch('/users/change-password', passwordData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to change password');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (emailData: ForgotPasswordData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/users/forget-password', emailData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send reset link');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (resetData: ResetPasswordData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/users/reset-password', resetData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reset password');
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (otpData: VerifyOtpData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.patch('/users/verify', otpData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to verify OTP');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'auth/searchUsers',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get('/users/search', { params: { query } });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search users');
    }
  }
);


export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      
      const response = await axiosClient.post('/users/logout');

      dispatch(authSlice.actions.resetAuthState()); 
      localStorage.removeItem('token'); 
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

export const simpleLogout = createAsyncThunk(
  'auth/simpleLogout',
  async (_, { dispatch }) => {
    dispatch(authSlice.actions.resetAuthState());
    localStorage.removeItem('token');
    return { success: true };
  }
);


const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
 

resetAuthState: (state) => {
  state.user = null;
  state.token = null;
  state.role = null;
  state.isSuperUser = false;
  state.isOrganizer = false;
  state.permissions = [];
     state.hrmsPermissions = [];
      state.orgPermissions = {
        isHRMS_enabled: false,
        isTaskManagement_enabled: false,
      };
  state.users = [];
  state.searchResults = [];
},
    clearAuthError: (state) => {
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    }
  },
  extraReducers: (builder) => {
    builder
      
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })


.addCase(loginUser.fulfilled, (state, action) => {
  const { token, user } = action.payload.data;
  const decodedToken = jwtDecode<DecodedToken>(token);

  const isSuperUser = decodedToken.user.is_superuser;
  const isOrganizer = decodedToken.user.is_organizer;
  let userRole: string;

  if (isSuperUser) {
    userRole = 'SUPER_ADMIN';
  } else if (isOrganizer) {
    userRole = 'ADMIN';
  } else {
    userRole = decodedToken.userRole?.roleName || 'MEMBER';
  }

  const permissions = !isSuperUser && !isOrganizer ? (decodedToken.userRole?.permissions || []) : [];
    const hrmsPermissions = !isSuperUser && !isOrganizer ? (decodedToken.userRole?.hrmsPermissions || []) : [];

        const orgPermissions = {
          isHRMS_enabled: decodedToken.org_permission?.isHRMS_enabled || false,
          isTaskManagement_enabled: decodedToken.org_permission?.isTaskManagement_enabled || false,
        };

  state.loading = false;
  state.user = {
    ...user,
    id: decodedToken.user.id,
    _id: decodedToken.user.id,
    role: userRole,
    departmentId: decodedToken.user.departmentId,
    organizationId: decodedToken.user.organizationId,
  };
  state.token = token;
  state.role = userRole;
  state.isSuperUser = isSuperUser;
  state.isOrganizer = isOrganizer;
  state.permissions = permissions;
  state.hrmsPermissions = hrmsPermissions;
        state.orgPermissions = orgPermissions;
  localStorage.setItem('token', token);
  
})
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.user = null;
        state.token = null;
        state.role = null;
      })

    
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

  
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action: PayloadAction<User>)  => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })


      .addCase(getAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllUsers.fulfilled, (state, action: PayloadAction<User[]>)=> {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { ...state.user, ...action.payload };
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

    
      .addCase(deleteProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter(user => user.id !== action.payload);
      })
      .addCase(deleteProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

    
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

          .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
     
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

    
      .addCase(searchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  resetAuthState, 
  clearAuthError,
  clearSearchResults
} = authSlice.actions;

export default authSlice.reducer;