import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosClient from "../../lib/api/client";
import { RootState } from "@/store";

export interface EmployeeAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

export interface EmployeePersonal {
  firstName: string;
  lastName?: string;
  dob?: string;
  gender?: "male" | "female" | "other";
  maritalStatus?: "single" | "married" | "divorced";
  phone: string;
  email?: string;
  address?: EmployeeAddress;
}

export interface EmployeeEmployment {
  employeeCode: string;
  departmentId: string;
  userRoleTableId: string;
  joinDate: string;
  exitDate?: string;
  status: "active" | "inactive" | "terminated";
  workLocation?: string;
  workType: "Full-Time" | "Intern" | "Probation" | "Notice";
  employeeType: "REGULAR" | "CONTRACTOR" | "OTHER";
}

export interface EmployeeBankDetails {
  accountHolderName?: string;
  accountNumber?: string;
  ifsc?: string;
  bankName?: string;
  branch?: string;
}

export interface EmployeeDocument {
  _id?: string;
  type: "aadhaar" | "pan" | "passport" | "others";
  name?: string;
  number?: string;
  proof?: {
    public_id: string;
    url: string;
  };
  verified: boolean;
  uploadedAt?: string;
}

export interface EmployeeSalary {
  type: "basic" | "hra" | "allowance" | "deduction";
  label: string;
  amount: number;
}

export interface Employee {
  id: string; // Backend changed _id to id
  _id?: string; // Keep for compatibility if needed
  organization?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    isActive?: boolean;
    isFreezed?: boolean;
  };
  personal: EmployeePersonal;
  employment: EmployeeEmployment & {
    department?: {
      id: string;
      name: string;
      isActive?: boolean;
      isVerified?: boolean;
    };
    role?: {
      id: string;
      name: string;
      permissions?: string[];
    };
  };
  bank?: EmployeeBankDetails;
  documents?: EmployeeDocument[];
  salary?: EmployeeSalary[];
  templates?: {
    leaveTemplate?: { id: string; name: string };
    shiftTemplate?: { id: string; name: string };
    weeklyOffTemplate?: { id: string; name: string };
    holidayTemplate?: { id: string; name: string };
    attendanceOnWeeklyOff?: { id: string; name: string };
    attendanceOnHoliday?: { id: string; name: string };
  };
  createdAt: string;
  updatedAt: string;
  
  // Flat fields (used by getEmployees list API)
  empCode?: string;
  name?: string;
  departmentName?: string;
  roleName?: string;
  status?: string;
  workType?: string;
  employeeType?: string;
  leaveTemplateName?: string;
  shiftTemplateName?: string;
}

export interface CreateEmployeeData {
  personal: EmployeePersonal;
  employment: EmployeeEmployment;
  bank?: EmployeeBankDetails;
  documents?: EmployeeDocument[];
  salary?: EmployeeSalary[];
  leaveTemplateId?: string; // Changed from leavePolicyId
  userId: string;
  shiftTemplateId?: string; // Changed from shiftId
  holidayTemplateId?: string;
  weeklyOffTemplateId?: string;
  attendanceOnHolidayTemplateId?: string;
  attendanceOnWeeklyOffTemplateId?: string;
}

export interface UpdateEmployeeData extends Partial<CreateEmployeeData> {
  id?: string;
  _id?: string;
}

export interface EmployeeFilters {
  departmentId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface EmployeeState {
  employees: Employee[];
  currentEmployee: Employee | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  upcomingNewJoiners: Employee[];
}

const initialState: EmployeeState = {
  employees: [],
  currentEmployee: null,
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  upcomingNewJoiners: [],
};

export const createEmployee = createAsyncThunk(
  "employee/create",
  async (
    { employeeData, files }: { employeeData: CreateEmployeeData; files?: FormData },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const formData = new FormData();

      Object.keys(employeeData).forEach(key => {
        const value = employeeData[key as keyof CreateEmployeeData];
        if (value !== undefined) {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      });

      if (files) {
        for (const [key, value] of files.entries()) {
          formData.append(key, value);
        }
      }

      const response = await axiosClient.post("/employee", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data.data.employee || response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create employee"
      );
    }
  }
);

export const fetchEmployees = createAsyncThunk(
  "employee/fetchAll",
  async (filters: EmployeeFilters = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof EmployeeFilters];
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });

      const response = await axiosClient.get(`/employee?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch employees"
      );
    }
  }
);

export const fetchEmployeeById = createAsyncThunk(
  "employee/fetchById",
  async (employeeId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.get(`/employee/${employeeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch employee"
      );
    }
  }
);

export const updateEmployee = createAsyncThunk(
  "employee/update",
  async (
    {
      employeeId,
      employeeData,
      files
    }: {
      employeeId: string;
      employeeData: UpdateEmployeeData;
      files?: FormData
    },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const formData = new FormData();

      Object.keys(employeeData).forEach(key => {
        const value = employeeData[key as keyof UpdateEmployeeData];
        if (value !== undefined) {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      });

      if (files) {
        for (const [key, value] of files.entries()) {
          formData.append(key, value);
        }
      }

      const response = await axiosClient.put(`/employee/${employeeId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data.data.employee || response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update employee"
      );
    }
  }
);

export const deleteEmployee = createAsyncThunk(
  "employee/delete",
  async (employeeId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.delete(`/employee/${employeeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return { employeeId, message: response.data.message };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete employee"
      );
    }
  }
);

export const fetchEmployeesByOrganization = createAsyncThunk(
  "employee/fetchByOrganization",
  async (
    { organizationId, filters }: { organizationId: string; filters?: EmployeeFilters },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const params = new URLSearchParams();
      if (filters) {
        Object.keys(filters).forEach(key => {
          const value = filters[key as keyof EmployeeFilters];
          if (value !== undefined) {
            params.append(key, String(value));
          }
        });
      }

      const response = await axiosClient.get(
        `/employee/organization/${organizationId}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch employees by organization"
      );
    }
  }
);

export const addEmployeeDocument = createAsyncThunk(
  "employee/addDocument",
  async (
    {
      employeeId,
      documentData,
      file,
    }: {
      employeeId: string;
      documentData: { type: string; name?: string; number?: string; verified?: boolean };
      file: File;
    },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const formData = new FormData();
      formData.append("type", documentData.type);
      formData.append("name", documentData.name || "");
      formData.append("number", documentData.number || "");
      formData.append("verified", String(documentData.verified || false));
      formData.append("document", file);

      const response = await axiosClient.post(
        `/employee/${employeeId}/documents`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return { employeeId, document: response.data.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add document"
      );
    }
  }
);

export const removeEmployeeDocument = createAsyncThunk(
  "employee/removeDocument",
  async (
    { employeeId, documentId }: { employeeId: string; documentId: string },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.delete(
        `/employee/${employeeId}/documents/${documentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return { employeeId, documentId, message: response.data.message };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove document"
      );
    }
  }
);

export const fetchUpcomingNewJoiners = createAsyncThunk(
  "employee/fetchUpcomingNewJoiners",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.get("/employee/upcoming-joiners", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch upcoming new joiners"
      );
    }
  }
);

const employeeSlice = createSlice({
  name: "employee",
  initialState,
  reducers: {
    clearCurrentEmployee: (state) => {
      state.currentEmployee = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearEmployees: (state) => {
      state.employees = [];
      state.totalCount = 0;
      state.currentPage = 1;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.employees.unshift(action.payload);
        state.totalCount += 1;
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload)) {
          state.employees = action.payload;
          state.totalCount = action.payload.length;
        } else {
          state.employees = action.payload.docs || action.payload;
          state.totalCount = action.payload.totalDocs || action.payload.length;
          state.currentPage = action.payload.page || 1;
        }
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchEmployeeById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEmployee = action.payload;
      })
      .addCase(fetchEmployeeById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(updateEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.loading = false;
        const updatedEmployee = action.payload;
        const index = state.employees.findIndex(emp => emp._id === updatedEmployee._id);
        if (index !== -1) {
          state.employees[index] = updatedEmployee;
        }
        if (state.currentEmployee?._id === updatedEmployee._id) {
          state.currentEmployee = updatedEmployee;
        }
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(deleteEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.loading = false;
        const { employeeId } = action.payload;
        state.employees = state.employees.filter(emp => emp._id !== employeeId);
        state.totalCount -= 1;
        if (state.currentEmployee?._id === employeeId) {
          state.currentEmployee = null;
        }
      })
      .addCase(deleteEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchEmployeesByOrganization.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeesByOrganization.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload)) {
          state.employees = action.payload;
          state.totalCount = action.payload.length;
        } else {
          state.employees = action.payload.docs || action.payload;
          state.totalCount = action.payload.totalDocs || action.payload.length;
          state.currentPage = action.payload.page || 1;
        }
      })
      .addCase(fetchEmployeesByOrganization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(addEmployeeDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addEmployeeDocument.fulfilled, (state, action) => {
        state.loading = false;
        const { employeeId, document } = action.payload;

        const employeeIndex = state.employees.findIndex(emp => emp._id === employeeId);
        if (employeeIndex !== -1) {
          if (!state.employees[employeeIndex].documents) {
            state.employees[employeeIndex].documents = [];
          }
          state.employees[employeeIndex].documents!.push(document);
        }

        if (state.currentEmployee?._id === employeeId) {
          if (!state.currentEmployee.documents) {
            state.currentEmployee.documents = [];
          }
          state.currentEmployee.documents.push(document);
        }
      })
      .addCase(addEmployeeDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(removeEmployeeDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeEmployeeDocument.fulfilled, (state, action) => {
        state.loading = false;
        const { employeeId, documentId } = action.payload;

        const employeeIndex = state.employees.findIndex(emp => emp._id === employeeId);
        if (employeeIndex !== -1 && state.employees[employeeIndex].documents) {
          state.employees[employeeIndex].documents = state.employees[employeeIndex].documents!.filter(
            doc => doc._id !== documentId
          );
        }

        if (state.currentEmployee?._id === employeeId && state.currentEmployee.documents) {
          state.currentEmployee.documents = state.currentEmployee.documents.filter(
            doc => doc._id !== documentId
          );
        }
      })
      .addCase(removeEmployeeDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchUpcomingNewJoiners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUpcomingNewJoiners.fulfilled, (state, action) => {
        state.loading = false;
        state.upcomingNewJoiners = action.payload;
      })
      .addCase(fetchUpcomingNewJoiners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearCurrentEmployee,
  clearError,
  clearEmployees,
  setCurrentPage
} = employeeSlice.actions;

export const selectEmployees = (state: RootState) => state.employee.employees;
export const selectCurrentEmployee = (state: RootState) => state.employee.currentEmployee;
export const selectEmployeeLoading = (state: RootState) => state.employee.loading;
export const selectEmployeeError = (state: RootState) => state.employee.error;
export const selectEmployeeTotalCount = (state: RootState) => state.employee.totalCount;
export const selectEmployeeCurrentPage = (state: RootState) => state.employee.currentPage;
export const selectUpcomingNewJoiners = (state: RootState) => state.employee.upcomingNewJoiners;

export const selectEmployeeById = (employeeId: string) => (state: RootState) =>
  state.employee.employees.find(emp => emp._id === employeeId);

export const selectEmployeesByDepartment = (departmentId: string) => (state: RootState) =>
  state.employee.employees.filter(emp =>
    typeof emp.employment.departmentId === 'string'
      ? emp.employment.departmentId === departmentId
      : (
        emp.employment.departmentId &&
        typeof emp.employment.departmentId === 'object' &&
        '_id' in emp.employment.departmentId &&
        (emp.employment.departmentId as { _id: string })._id === departmentId
      )
  );

export const selectEmployeesByShift = (shiftId: string) => (state: RootState) =>
  state.employee.employees.filter(emp =>
    typeof emp.shiftId === 'string'
      ? emp.shiftId === shiftId
      : (
        emp.shiftId &&
        typeof emp.shiftId === 'object' &&
        '_id' in emp.shiftId &&
        (emp.shiftId as { _id: string })._id === shiftId
      )
  );

export const selectActiveEmployees = (state: RootState) =>
  state.employee.employees.filter(emp => emp.employment.status === 'active');

export default employeeSlice.reducer;
