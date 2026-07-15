import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from '../../lib/api/client';

interface ProofItem {
  type?: string;
  fieldName?: string;
  proof_type?: string;
  url?: string;
  text?: string;
  original_name?: string;
  field_name?: string;
}

interface SubmissionData {
  _id: string;
  title?: string;
  description?: string;
  proof?: ProofItem[];
  submission_data?: any[] | ProofItem[];
  createdAt: string;
  ETAT?: number;
  reason?: {
    isValid: boolean;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  departmentId?: string;
  organizationId?: string;
  phoneNumber?: number;
  isActive?: boolean;
  isFreezed?: boolean;
  is_organizer?: boolean;
  is_superuser?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

interface TaskAssign {
  _id: string;
  title: string;
  description: string;
  TAT: number;
  deadline: string;
  proof: ProofItem[];
    assigned_to_employee_id?: string; // Added for reversal
    department_id?: string; // Added for reversal
}

interface Approval {
  _id: string;
  department_id: string;
  submitted_by_user_id: string;
  task_assign_id: string | TaskAssign;
  taskAssignId?: TaskAssign; 
  submissionId?: SubmissionData; 
  submission_data: SubmissionData;
  reason?: string;
  ETAT?: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
  status?: 'Pending' | 'Approved' | 'Rejected' | 'Fraud'| 'Reversed';
  assignBy?: User | string;
  assignTo?: User; 
  comment?: string;
  signalColor?: 'Green' | 'Yellow' | 'Red';
  isValid?: boolean;
}

interface ApprovalState {
  approvals: Approval[];
  userApprovals: Approval[];
  managerApprovals: Approval[];
  departmentApprovals: Approval[];
  currentApproval: Approval | null;
  loading: boolean;
  error: string | null;
}

const initialState: ApprovalState = {
  approvals: [],
  userApprovals: [],
  managerApprovals: [],
  departmentApprovals: [],
  currentApproval: null,
  loading: false,
  error: null,
};


// In approvalSlice.ts
export const requestApproval = createAsyncThunk(
    'approvals/request',
    async (approvalData: { taskAssignId: string; assignBy: string }, { rejectWithValue }) => {
        try {
            // Send single task ID
            const response = await axiosClient.post('/approval/request', {
                taskAssignId: approvalData.taskAssignId,
                assignBy: approvalData.assignBy
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to request approval');
        }
    }
);


export const fetchApprovalsByUserId = createAsyncThunk(
  'approvals/fetchByUserId',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/user/approvals/${userId}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user approvals');
    }
  }
);

export const fetchApprovalById = createAsyncThunk(
  'approvals/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/approval/approve/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch approval');
    }
  }
);

export const fetchUserApprovals = createAsyncThunk(
  'approvals/fetchUserApprovals',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get('/approval/user/approvals', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user approvals');
    }
  }
);

export const fetchManagerApprovals = createAsyncThunk(
  'approvals/fetchManagerApprovals',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get('/approval/manager/approvals', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch manager approvals');
    }
  }
);

export const fetchDepartmentApprovals = createAsyncThunk(
  'approvals/fetchDepartmentApprovals',
  async (departmentId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/approval/department/${departmentId}/approvals`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch department approvals');
    }
  }
);

export const fetchUserApprovalsById = createAsyncThunk(
  'approvals/fetchUserApprovalsById',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/approval/user/approvals/${userId}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user approvals');
    }
  }
);

export const fetchAllApprovals = createAsyncThunk(
  'approvals/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get('/approval/list');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch all approvals');
    }
  }
);

export const fetchApprovalBySubmissionId = createAsyncThunk(
  'approvals/fetchBySubmissionId',
  async (submissionId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/approval/submission/${submissionId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch approval by submission');
    }
  }
);

// 3. Update the updateApproval thunk to support reversal data
export const updateApproval = createAsyncThunk(
    'approvals/update',
    async ({
               id,
               updateData
           }: {
        id: string;
        updateData: {
            status: 'Approved' | 'Rejected' | 'Fraud' | 'Reversed'; // Added 'Reversed'
            comment?: string;
            reason?: string;
            isValid?: boolean;
            title?: string; // Added for reversal
            description?: string; // Added for reversal
            TAT?: number; // Added for reversal
            deadline?: string; // Added for reversal
            assigned_to_employee_id?: string; // Added for reversal
            department_id?: string; // Added for reversal
            proof?: ProofItem[]; // Added for reversal
        }
    }, { rejectWithValue }) => {
        try {
            const response = await axiosClient.put(`/approval/edit/${id}`, updateData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update approval');
        }
    }
);

// 4. Update overrideApprovalDecision thunk to include 'Reversed' status
export const overrideApprovalDecision = createAsyncThunk(
    'approvals/override',
    async ({
               id,
               status,
               reason,
               isValid
           }: {
               id: string;
               status: 'Approved' | 'Rejected' | 'Fraud' | 'Reversed'; // Added 'Reversed'
               reason?: string;
               isValid?: boolean;
           },
           { rejectWithValue }) => {
        try {
            const response = await axiosClient.patch(`/approval/override/${id}`, {
                status,
                reason,
                isValid
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to override approval decision');
        }
    }
);

// export const updateApproval = createAsyncThunk(
//   'approvals/update',
//   async ({
//     id,
//     updateData
//   }: {
//     id: string;
//     updateData: {
//       status: 'Approved' | 'Rejected' | 'Fraud';
//       comment?: string;
//       reason?: string;
//       isValid?: boolean;
//     }
//   }, { rejectWithValue }) => {
//     try {
//       const response = await axiosClient.put(`/approval/edit/${id}`, updateData);
//       return response.data;
//     } catch (error: any) {
//       return rejectWithValue(error.response?.data?.message || 'Failed to update approval');
//     }
//   }
// );
//
//
//
// export const overrideApprovalDecision = createAsyncThunk(
//   'approvals/override',
//   async ({
//     id,
//     status,
//     reason,
//     isValid
//   }: {
//     id: string;
//     status: 'Approved' | 'Rejected' | 'Fraud';
//     reason?: string;
//     isValid?: boolean;
//   },
//   { rejectWithValue }) => {
//     try {
//       const response = await axiosClient.patch(`/approval/override/${id}`, {
//         status,
//         reason,
//         isValid
//       });
//       return response.data;
//     } catch (error: any) {
//       return rejectWithValue(error.response?.data?.message || 'Failed to override approval decision');
//     }
//   }
// );

export const deleteApproval = createAsyncThunk(
  'approvals/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`/approval/delete/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete approval');
    }
  }
);

const approvalSlice = createSlice({
  name: 'approvals',
  initialState,
  reducers: {
    setCurrentApproval: (state, action) => {
      state.currentApproval = action.payload;
    },
    clearApprovalError: (state) => {
      state.error = null;
    },
    clearCurrentApproval: (state) => {
      state.currentApproval = null;
    },
    clearApprovals: (state) => {
      state.approvals = [];
      state.userApprovals = [];
      state.managerApprovals = [];
      state.departmentApprovals = [];
    },
    resetApprovalState: () => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestApproval.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestApproval.fulfilled, (state, action) => {
        state.loading = false;
        state.userApprovals = [action.payload, ...state.userApprovals];
      })
      .addCase(requestApproval.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchApprovalById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApprovalById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentApproval = action.payload;
      })
      .addCase(fetchApprovalById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUserApprovals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserApprovals.fulfilled, (state, action) => {
        state.loading = false;
        state.userApprovals = action.payload;
      })
      .addCase(fetchUserApprovals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUserApprovalsById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserApprovalsById.fulfilled, (state, action) => {
        state.loading = false;
        state.userApprovals = action.payload;
      })
      .addCase(fetchUserApprovalsById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchManagerApprovals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchManagerApprovals.fulfilled, (state, action) => {
        state.loading = false;
        state.managerApprovals = action.payload.data || [];
      })
      .addCase(fetchManagerApprovals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchDepartmentApprovals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartmentApprovals.fulfilled, (state, action) => {
        state.loading = false;
        state.departmentApprovals = action.payload;
      })
      .addCase(fetchDepartmentApprovals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchAllApprovals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllApprovals.fulfilled, (state, action) => {
        state.loading = false;
        state.approvals = action.payload;
      })
      .addCase(fetchAllApprovals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchApprovalBySubmissionId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApprovalBySubmissionId.fulfilled, (state, action) => {
        state.loading = false;
        state.currentApproval = action.payload;
      })
      .addCase(fetchApprovalBySubmissionId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      
      .addCase(updateApproval.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateApproval.fulfilled, (state, action) => {
        state.loading = false;
        
        [state.approvals, state.userApprovals, state.managerApprovals, state.departmentApprovals].forEach(list => {
          const index = list.findIndex(a => a._id === action.payload._id);
          if (index !== -1) {
            list[index] = action.payload;
          }
        });
        if (state.currentApproval?._id === action.payload._id) {
          state.currentApproval = action.payload;
        }
      })
      .addCase(updateApproval.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(overrideApprovalDecision.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(overrideApprovalDecision.fulfilled, (state, action) => {
        state.loading = false;
        
        [state.approvals, state.userApprovals, state.managerApprovals, state.departmentApprovals].forEach(list => {
          const index = list.findIndex(a => a._id === action.payload._id);
          if (index !== -1) {
            list[index] = action.payload;
          }
        });
        if (state.currentApproval?._id === action.payload._id) {
          state.currentApproval = action.payload;
        }
      })
      .addCase(overrideApprovalDecision.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(deleteApproval.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteApproval.fulfilled, (state, action) => {
        state.loading = false;
        state.approvals = state.approvals.filter(a => a._id !== action.payload);
        state.userApprovals = state.userApprovals.filter(a => a._id !== action.payload);
        state.managerApprovals = state.managerApprovals.filter(a => a._id !== action.payload);
        state.departmentApprovals = state.departmentApprovals.filter(a => a._id !== action.payload);
        if (state.currentApproval?._id === action.payload) {
          state.currentApproval = null;
        }
      })
      .addCase(deleteApproval.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setCurrentApproval, 
  clearApprovalError,
  clearCurrentApproval,
  clearApprovals,
  resetApprovalState
} = approvalSlice.actions;

export default approvalSlice.reducer;