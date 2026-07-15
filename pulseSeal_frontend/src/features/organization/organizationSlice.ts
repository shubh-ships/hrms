import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from '../../lib/api/client';
import { RootState } from '@/store';

interface Organization {
  _id: string;
  name: string;
  org_alias: string;
  description?: string;
  organizationPicture?: string;
  email?: string;
  phone_number?: string;
  is_active: boolean;
  is_verified: boolean;
  city?: string;
  state?: string;
  country?: string;
  social_links?: Array<{ [key: string]: string }>;
  createdAt: string;
  updatedAt: string;
}
interface Manager {
  _id: string;
  role: string;
  user_id: {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    isActive: boolean;
    isFreezed: boolean;
    is_superuser: boolean;
    is_organizer: boolean;
    departmentId?: string;
  };
  dep_id?: {
    _id: string;
    name: string;
    alias: string;
  };
}

interface OrganizationState {
  organizations: Organization[];
  currentOrganization: Organization | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
  managers: Manager[];
  managersLoading: boolean;
  managersError: string | null
}

const initialState: OrganizationState = {
  organizations: [],
  currentOrganization: null,
  loading: false,
  error: null,
  totalCount: 0,
  managers: [],
  managersLoading: false,
  managersError: null
};

export const createOrganization = createAsyncThunk(
  'organizations/create',
  async (organizationData: FormData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/organizations/create', organizationData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create organization');
    }
  }
);

export const fetchOrganizations = createAsyncThunk(
  'organizations/fetchAll',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');

      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axiosClient.get('/organizations', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
      });

      return {
        organizations: response.data.data.data,
        totalCount: response.data.data.totalCount
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch organizations');
    }
  }
);


export const deleteOrganization = createAsyncThunk(
  'organizations/delete',
  async (alias: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.delete(`/organizations/delete/${alias}`);
      return { alias, message: response.data.message };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete organization');
    }
  }
);

export const updateOrganization = createAsyncThunk(
  'organizations/update',
  async ({ alias, updateData }: { alias: string; updateData: FormData }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(`/organizations/edit/${alias}`, updateData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update organization');
    }
  }
);

export const fetchOrganizationManagers = createAsyncThunk(
  'organizations/fetchManagers',
  async (alias: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');

      if (!token) {
        throw new Error('Authentication token not found');
      }
      const response = await axiosClient.get(`/organizations/org-managers`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch organization managers');
    }
  }
);

const organizationSlice = createSlice({
  name: 'organizations',
  initialState,
  reducers: {
    setCurrentOrganization: (state, action) => {
      state.currentOrganization = action.payload;
    },
    clearOrganizationError: (state) => {
      state.error = null;
    },
    clearManagers: (state) => {
      state.managers = [];
      state.managersLoading = false;
      state.managersError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrganization.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrganization.fulfilled, (state, action) => {
        state.loading = false;
        state.organizations.push(action.payload);
      })
      .addCase(createOrganization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchOrganizations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrganizations.fulfilled, (state, action) => {
        state.loading = false;
        state.organizations = Array.isArray(action.payload.organizations)
          ? action.payload.organizations
          : [];
        state.totalCount = action.payload.totalCount || 0;
      })
      .addCase(fetchOrganizations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteOrganization.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteOrganization.fulfilled, (state, action) => {
        state.loading = false;
        state.organizations = state.organizations.filter(org => org.org_alias !== action.payload.alias);
      })
      .addCase(deleteOrganization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchOrganizationManagers.pending, (state) => {
        state.managersLoading = true;
        state.managersError = null;
      })
      .addCase(fetchOrganizationManagers.fulfilled, (state, action) => {
        state.managersLoading = false;
        state.managers = action.payload;
      })
      .addCase(fetchOrganizationManagers.rejected, (state, action) => {
        state.managersLoading = false;
        state.managersError = action.payload as string;
      })

      .addCase(updateOrganization.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrganization.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.organizations.findIndex(o => o.org_alias === action.payload.alias);
        if (index !== -1) {
          state.organizations[index] = action.payload;
        }
        if (state.currentOrganization?.org_alias === action.payload.alias) {
          state.currentOrganization = action.payload;
        }
      })
      .addCase(updateOrganization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentOrganization, clearOrganizationError } = organizationSlice.actions;
export const { clearManagers } = organizationSlice.actions;
export default organizationSlice.reducer;