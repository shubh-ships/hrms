import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosClient from "@/lib/api/client";
import { RootState } from "@/store/index";
import { jwtDecode } from "jwt-decode";
import {
  Department,
  DepartmentMember,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  EditDepartmentMembersRequest,
  DepartmentID,
} from "@/lib/types/api/department";

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

interface DepartmentState {
  departments: Department[];
  currentDepartment: Department | null;
  departmentMembers: DepartmentMember[];
  departmentId: DepartmentID[];
  userDepartments: Department[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  page: number;
  limit: number;
}

const initialState: DepartmentState = {
  departments: [],
  currentDepartment: null,
  departmentMembers: [],
  userDepartments: [],
  departmentId: [],
  loading: false,
  error: null,
  totalCount: 0,
  page: 1,
  limit: 10,
};

export const fetchDepartments = createAsyncThunk(
  "departments/fetchAll",
  async (
    params: { page?: number; limit?: number; filters?: any } = {},
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value as string);
        });
      }

      const response = await axiosClient.get(
        `/departments?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
          },
        }
      );
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch departments"
      );
    }
  }
);

export const fetchDepartmentMembers = createAsyncThunk(
  "departments/fetchMembers",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const decoded = jwtDecode<DecodedToken>(token);
      const departmentId = decoded.user.departmentId;

      if (!departmentId) {
        throw new Error("Department ID not found in token");
      }

      const response = await axiosClient.get(`/departments/members`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });

      return {
        members: response.data.data as DepartmentMember[],
        departmentId,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch department members"
      );
    }
  }
);

export const fetchDepartmentMembersById = createAsyncThunk(
  "departmentMembers/fetchById",
  async (departmentId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      if (!departmentId) {
        throw new Error("Department ID not provided");
      }

      const response = await axiosClient.get(
        `/departments/members/${departmentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
          },
        }
      );

      return {
        members: response.data.data as DepartmentMember[],
        departmentId,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch department members"
      );
    }
  }
);

export const createDepartment = createAsyncThunk(
  "departments/create",
  async (data: CreateDepartmentRequest, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axiosClient.post("/departments/create", data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data as Department;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create department"
      );
    }
  }
);

export const getDepartment = createAsyncThunk(
  "departments/getByAlias",
  async (alias: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axiosClient.get(`/departments/${alias}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data as Department;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch department"
      );
    }
  }
);

export const fetchUserDepartments = createAsyncThunk(
  "departments/fetchUserDepartments",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axiosClient.get("/departments/user-departments", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });

      return response.data.data as Department[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch user departments"
      );
    }
  }
);

export const updateDepartment = createAsyncThunk(
  "departments/update",
  async (
    { alias, data }: { alias: string; data: UpdateDepartmentRequest },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axiosClient.put(
        `/departments/edit/${alias}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.data as Department;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update department"
      );
    }
  }
);

export const deleteDepartment = createAsyncThunk(
  "departments/delete",
  async (alias: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      await axiosClient.delete(`/departments/delete/${alias}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return alias;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete department"
      );
    }
  }
);

export const getDepartmentMembers = createAsyncThunk(
  "departments/getMembers",
  async (alias: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axiosClient.get(`/departments/${alias}/members`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data as DepartmentMember[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch department members"
      );
    }
  }
);

export const editDepartmentMembers = createAsyncThunk(
  "departments/editMembers",
  async (
    { alias, data }: { alias: string; data: EditDepartmentMembersRequest },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axiosClient.patch(
        `/departments/${alias}/members`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.data as DepartmentMember[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to edit department members"
      );
    }
  }
);

export const addDepartmentMember = createAsyncThunk(
  "departments/addMember",
  async (
    { departmentId, userId }: { departmentId: string; userId: string },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axiosClient.post(
        `/department/${departmentId}/add-member`,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.data as DepartmentMember;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add member"
      );
    }
  }
);

const departmentSlice = createSlice({
  name: "departments",
  initialState,
  reducers: {
    setCurrentDepartment: (state, action: PayloadAction<string>) => {
      const department = state.departments.find(
        (d) => d._id === action.payload
      );
      if (department) {
        state.currentDepartment = department;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentDepartment: (state) => {
      state.currentDepartment = null;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setLimit: (state, action: PayloadAction<number>) => {
      state.limit = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = action.payload.data;
        state.totalCount = action.payload.totalCount;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchDepartmentMembersById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartmentMembersById.fulfilled, (state, action) => {
        state.loading = false;
        state.departmentMembers = action.payload.members;
      })
      .addCase(fetchDepartmentMembersById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchUserDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.userDepartments = action.payload;
      })
      .addCase(fetchUserDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchDepartmentMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartmentMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.departmentMembers = action.payload.members;

        const departmentIndex = state.departments.findIndex(
          (d) => d._id === action.payload.departmentId
        );
        if (departmentIndex !== -1) {
          state.departments[departmentIndex].members = action.payload.members;
        }
      })
      .addCase(fetchDepartmentMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.departments.unshift(action.payload);
        state.totalCount += 1;
      })
      .addCase(createDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(getDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDepartment = action.payload;
      })
      .addCase(getDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(updateDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.departments.findIndex(
          (dept) => dept._id === action.payload._id
        );
        if (index !== -1) {
          state.departments[index] = action.payload;
        }
        if (state.currentDepartment?._id === action.payload._id) {
          state.currentDepartment = action.payload;
        }
      })
      .addCase(updateDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(deleteDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = state.departments.filter(
          (dept) => dept.alias !== action.payload
        );
        state.totalCount -= 1;
        if (state.currentDepartment?.alias === action.payload) {
          state.currentDepartment = null;
        }
      })
      .addCase(deleteDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(getDepartmentMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDepartmentMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.departmentMembers = action.payload;
      })
      .addCase(getDepartmentMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(editDepartmentMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editDepartmentMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.departmentMembers = action.payload;
      })
      .addCase(editDepartmentMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(addDepartmentMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addDepartmentMember.fulfilled, (state, action) => {
        state.loading = false;
        state.departmentMembers.push(action.payload);

        if (state.currentDepartment) {
          state.currentDepartment = {
            ...state.currentDepartment,
            members: [
              ...(state.currentDepartment.members || []),
              action.payload,
            ],
          };
        }
      })
      .addCase(addDepartmentMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentDepartment,
  clearError,
  clearCurrentDepartment,
  setPage,
  setLimit,
} = departmentSlice.actions;

export const selectDepartments = (state: RootState) =>
  state.departments.departments;
export const selectCurrentDepartment = (state: RootState) =>
  state.departments.currentDepartment;
export const selectDepartmentMembers = (state: RootState) =>
  state.departments.departmentMembers;
export const selectDepartmentLoading = (state: RootState) =>
  state.departments.loading;
export const selectDepartmentError = (state: RootState) =>
  state.departments.error;
export const selectUserDepartments = (state: RootState) =>
  state.departments.userDepartments;

export const selectDepartmentPagination = (state: RootState) => ({
  page: state.departments.page,
  limit: state.departments.limit,
  totalCount: state.departments.totalCount,
});

export default departmentSlice.reducer;
