import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';
import axiosClient from '../../lib/api/client';
import { RootState } from '../../store';

export interface Employee {
  _id: string;
  personal: {
    firstName: string;
    lastName: string;
  };
  employment: {
    departmentId: string;
    userRoleTableId: string;
  };
}

interface ApprovalHistory {
  approverId: {
    _id: string;
    name: string;
    email: string;
    isActive: boolean;
    id: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  date: string;
  remarks?: string;
}

export interface Leave {
  _id: string;
  organizationId: string;
  employeeId: string | Employee;
  leaveType: string;
  durationType: 'fullDay' | 'halfDay';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvalHistory: ApprovalHistory[];
  isDeleted: boolean;
  attachments?: string[];
  symptoms?: string[];
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

interface LeaveBalance {
  _id: string;
  organizationId: string;
  employeeId: string;
  leaveType: string;
  leaveTaken: number;
  balance: number;
  period: string;
  frequency: 'monthly' | 'yearly';
}

interface ApplyLeaveData {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  durationType?: 'fullDay' | 'halfDay';
}

interface ProcessLeaveApprovalData {
  leaveId: string;
  status: 'approved' | 'rejected';
  remarks?: string;
}

interface MarkLeaveData {
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  durationType?: 'fullDay' | 'halfDay';
}

interface UpdateBalanceData {
  employeeId: string;
  leaveType: string;
  frequency: 'monthly' | 'yearly';
  period: string;
  balance?: number;
  leaveTaken?: number;
}

interface LeaveState {
  leaves: Leave[];
  leavesForApproval: Leave[];
  organizationLeavesForApproval: Leave[];
  leaveHistory: Leave[];
  organizationLeaveHistory: Leave[];
  leaveBalances: LeaveBalance[];
  loading: boolean;
  error: string | null;
  applyLoading: boolean;
  approvalLoading: boolean;
  balanceLoading: boolean;
  organizationHistoryLoading: boolean;
  organizationApprovalLoading: boolean;
}

const getOrganizationId = (state: RootState): string | null => {
  if (state.auth.user?.organizationId) {
    return state.auth.user.organizationId;
  }

  const token = state.auth.token || localStorage.getItem('token');
  if (token) {
    try {
      const decodedToken: any = jwtDecode(token);
      return decodedToken.user?.organizationId || null;
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  return null;
};

const initialState: LeaveState = {
  leaves: [],
  leavesForApproval: [],
  organizationLeavesForApproval: [],
  leaveHistory: [],
  organizationLeaveHistory: [],
  leaveBalances: [],
  loading: false,
  error: null,
  applyLoading: false,
  approvalLoading: false,
  balanceLoading: false,
  organizationHistoryLoading: false,
  organizationApprovalLoading: false,
};

export const applyForLeave = createAsyncThunk(
  'leave/apply',
  async (leaveData: ApplyLeaveData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');

      if (!token) {
        return rejectWithValue('Authentication token not found');
      }

      const response = await axiosClient.post('/leave/apply', leaveData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
      });

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to apply for leave');
    }
  }
);

export const getLeavesForApproval = createAsyncThunk(
  'leave/getLeavesForApproval',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');

      if (!token) {
        return rejectWithValue('Authentication token not found');
      }

      const response = await axiosClient.get('/leave/approval-list', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch leaves for approval');
    }
  }
);

export const getLeavesForApprovalByOrganization = createAsyncThunk(
  'leave/getLeavesForApprovalByOrganization',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');

      if (!token) {
        return rejectWithValue('Authentication token not found');
      }

      const response = await axiosClient.get('/leave/approval-listByOrganization', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch organization leaves for approval');
    }
  }
);

export const processLeaveApproval = createAsyncThunk(
  'leave/processApproval',
  async ({ leaveId, status, remarks }: ProcessLeaveApprovalData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');

      if (!token) {
        return rejectWithValue('Authentication token not found');
      }

      const response = await axiosClient.patch(`/leave/${leaveId}/approve`, {
        status,
        remarks
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
      });

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to process leave approval');
    }
  }
);

export const getLeavesHistory = createAsyncThunk(
  'leave/getHistory',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');

      if (!token) {
        return rejectWithValue('Authentication token not found');
      }

      const response = await axiosClient.get('/leave/leave-history', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch leave history');
    }
  }
);

export const getLeavesHistoryByOrganization = createAsyncThunk(
  'leave/getHistoryByOrganization',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');

      if (!token) {
        return rejectWithValue('Authentication token not found');
      }

      const response = await axiosClient.get('/leave/leave-historyByOrganization', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch organization leave history');
    }
  }
);

export const getLeaveBalances = createAsyncThunk(
  'leave/getBalances',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');

      if (!token) {
        return rejectWithValue('Authentication token not found');
      }

      const response = await axiosClient.get('/leave/currentBalance', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch leave balances');
    }
  }
);

export const getEmployeeLeaveBalances = createAsyncThunk(
  'leave/getEmployeeBalances',
  async ({ employeeId, period }: { employeeId: string; period?: string }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');

      if (!token) {
        return rejectWithValue('Authentication token not found');
      }

      const response = await axiosClient.get(`/leave/getEmpLeaveBalance/${employeeId}`, {
        params: { period },
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch employee leave balances');
    }
  }
);

export const updateEmployeeLeaveBalance = createAsyncThunk(
  'leave/updateEmployeeBalance',
  async (data: UpdateBalanceData, { rejectWithValue, getState }) => {
    try {
      const { employeeId, ...updateData } = data;
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');

      if (!token) {
        return rejectWithValue('Authentication token not found');
      }

      const response = await axiosClient.put(`/leave/updateEmpLeaveBalance/${employeeId}`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update employee leave balance');
    }
  }
);

export const markLeave = createAsyncThunk(
  'leave/markLeave',
  async (leaveData: MarkLeaveData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');

      if (!token) {
        return rejectWithValue('Authentication token not found');
      }

      const response = await axiosClient.post('/leave/markLeave', leaveData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to mark leave');
    }
  }
);

const leaveSlice = createSlice({
  name: 'leave',
  initialState,
  reducers: {
    clearLeaveError: (state) => {
      state.error = null;
    },
    resetLeaveState: (state) => {
      state.leaves = [];
      state.leavesForApproval = [];
      state.organizationLeavesForApproval = [];
      state.leaveHistory = [];
      state.organizationLeaveHistory = [];
      state.leaveBalances = [];
      state.error = null;
      state.loading = false;
      state.applyLoading = false;
      state.approvalLoading = false;
      state.balanceLoading = false;
      state.organizationHistoryLoading = false;
      state.organizationApprovalLoading = false;
    },
    updateLeaveStatus: (state, action: PayloadAction<{ leaveId: string; status: string }>) => {
      const { leaveId, status } = action.payload;

      const updateInArray = (array: Leave[]) => {
        const index = array.findIndex(leave => leave._id === leaveId);
        if (index !== -1) {
          array[index].status = status as any;
        }
      };

      updateInArray(state.leaves);
      updateInArray(state.leavesForApproval);
      updateInArray(state.organizationLeavesForApproval);
      updateInArray(state.leaveHistory);
      updateInArray(state.organizationLeaveHistory);
    },
    removeLeaveFromApprovalList: (state, action: PayloadAction<string>) => {
      state.leavesForApproval = state.leavesForApproval.filter(
        leave => leave._id !== action.payload
      );
    },
    removeLeaveFromOrganizationApprovalList: (state, action: PayloadAction<string>) => {
      state.organizationLeavesForApproval = state.organizationLeavesForApproval.filter(
        leave => leave._id !== action.payload
      );
    },
    addLeaveToHistory: (state, action: PayloadAction<Leave>) => {
      const existsInHistory = state.leaveHistory.some(leave => leave._id === action.payload._id);
      if (!existsInHistory) {
        state.leaveHistory.unshift(action.payload);
      }

      const existsInOrgHistory = state.organizationLeaveHistory.some(leave => leave._id === action.payload._id);
      if (!existsInOrgHistory) {
        state.organizationLeaveHistory.unshift(action.payload);
      }
    },
    updateLeaveInHistory: (state, action: PayloadAction<Leave>) => {
      const historyIndex = state.leaveHistory.findIndex(leave => leave._id === action.payload._id);
      if (historyIndex !== -1) {
        state.leaveHistory[historyIndex] = action.payload;
      }

      const orgHistoryIndex = state.organizationLeaveHistory.findIndex(leave => leave._id === action.payload._id);
      if (orgHistoryIndex !== -1) {
        state.organizationLeaveHistory[orgHistoryIndex] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(applyForLeave.pending, (state) => {
        state.applyLoading = true;
        state.error = null;
      })
      .addCase(applyForLeave.fulfilled, (state, action: PayloadAction<Leave>) => {
        state.applyLoading = false;
        state.leaves.push(action.payload);
      })
      .addCase(applyForLeave.rejected, (state, action) => {
        state.applyLoading = false;
        state.error = action.payload as string;
      })

      .addCase(getLeavesForApproval.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLeavesForApproval.fulfilled, (state, action: PayloadAction<Leave[]>) => {
        state.loading = false;
        state.leavesForApproval = action.payload;
      })
      .addCase(getLeavesForApproval.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(getLeavesForApprovalByOrganization.pending, (state) => {
        state.organizationApprovalLoading = true;
        state.error = null;
      })
      .addCase(getLeavesForApprovalByOrganization.fulfilled, (state, action: PayloadAction<Leave[]>) => {
        state.organizationApprovalLoading = false;
        state.organizationLeavesForApproval = action.payload;
      })
      .addCase(getLeavesForApprovalByOrganization.rejected, (state, action) => {
        state.organizationApprovalLoading = false;
        state.error = action.payload as string;
      })

      .addCase(processLeaveApproval.pending, (state) => {
        state.approvalLoading = true;
        state.error = null;
      })
      .addCase(processLeaveApproval.fulfilled, (state, action: PayloadAction<Leave>) => {
        state.approvalLoading = false;

        const approvalIndex = state.leavesForApproval.findIndex(
          leave => leave._id === action.payload._id
        );
        if (approvalIndex !== -1) {
          state.leavesForApproval[approvalIndex] = action.payload;
        }

        const orgApprovalIndex = state.organizationLeavesForApproval.findIndex(
          leave => leave._id === action.payload._id
        );
        if (orgApprovalIndex !== -1) {
          state.organizationLeavesForApproval[orgApprovalIndex] = action.payload;
        }

        const leaveIndex = state.leaves.findIndex(
          leave => leave._id === action.payload._id
        );
        if (leaveIndex !== -1) {
          state.leaves[leaveIndex] = action.payload;
        }

        const existsInHistory = state.leaveHistory.some(leave => leave._id === action.payload._id);
        if (!existsInHistory) {
          state.leaveHistory.unshift(action.payload);
        }

        const existsInOrgHistory = state.organizationLeaveHistory.some(leave => leave._id === action.payload._id);
        if (!existsInOrgHistory) {
          state.organizationLeaveHistory.unshift(action.payload);
        }
      })
      .addCase(processLeaveApproval.rejected, (state, action) => {
        state.approvalLoading = false;
        state.error = action.payload as string;
      })

      .addCase(getLeavesHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLeavesHistory.fulfilled, (state, action: PayloadAction<Leave[]>) => {
        state.loading = false;
        state.leaveHistory = action.payload;
      })
      .addCase(getLeavesHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(getLeavesHistoryByOrganization.pending, (state) => {
        state.organizationHistoryLoading = true;
        state.error = null;
      })
      .addCase(getLeavesHistoryByOrganization.fulfilled, (state, action: PayloadAction<Leave[]>) => {
        state.organizationHistoryLoading = false;
        state.organizationLeaveHistory = action.payload;
      })
      .addCase(getLeavesHistoryByOrganization.rejected, (state, action) => {
        state.organizationHistoryLoading = false;
        state.error = action.payload as string;
      })

      .addCase(getLeaveBalances.pending, (state) => {
        state.balanceLoading = true;
        state.error = null;
      })
      .addCase(getLeaveBalances.fulfilled, (state, action: PayloadAction<LeaveBalance[]>) => {
        state.balanceLoading = false;
        state.leaveBalances = action.payload;
      })
      .addCase(getLeaveBalances.rejected, (state, action) => {
        state.balanceLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(getEmployeeLeaveBalances.pending, (state) => {
        state.balanceLoading = true;
        state.error = null;
      })
      .addCase(getEmployeeLeaveBalances.fulfilled, (state, action: PayloadAction<LeaveBalance[]>) => {
        state.balanceLoading = false;
        state.leaveBalances = action.payload;
      })
      .addCase(getEmployeeLeaveBalances.rejected, (state, action) => {
        state.balanceLoading = false;
        state.error = action.payload as string;
      })

      .addCase(updateEmployeeLeaveBalance.pending, (state) => {
        state.balanceLoading = true;
        state.error = null;
      })
      .addCase(updateEmployeeLeaveBalance.fulfilled, (state, action: PayloadAction<LeaveBalance>) => {
        state.balanceLoading = false;
        const index = state.leaveBalances.findIndex(b => b._id === action.payload._id);
        if (index !== -1) {
          state.leaveBalances[index] = action.payload;
        } else {
          state.leaveBalances.push(action.payload);
        }
      })
      .addCase(updateEmployeeLeaveBalance.rejected, (state, action) => {
        state.balanceLoading = false;
        state.error = action.payload as string;
      })

      .addCase(markLeave.pending, (state) => {
        state.applyLoading = true;
        state.error = null;
      })
      .addCase(markLeave.fulfilled, (state, action: PayloadAction<Leave>) => {
        state.applyLoading = false;
        state.leaves.push(action.payload);
        state.leaveHistory.unshift(action.payload);
      })
      .addCase(markLeave.rejected, (state, action) => {
        state.applyLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearLeaveError,
  resetLeaveState,
  updateLeaveStatus,
  removeLeaveFromApprovalList,
  removeLeaveFromOrganizationApprovalList,
  addLeaveToHistory,
  updateLeaveInHistory
} = leaveSlice.actions;

export default leaveSlice.reducer;

export const selectLeaves = (state: RootState) => state.leave.leaves;
export const selectLeavesForApproval = (state: RootState) => state.leave.leavesForApproval;
export const selectOrganizationLeavesForApproval = (state: RootState) => state.leave.organizationLeavesForApproval;
export const selectLeaveHistory = (state: RootState) => state.leave.leaveHistory;
export const selectOrganizationLeaveHistory = (state: RootState) => state.leave.organizationLeaveHistory;
export const selectLeaveBalances = (state: RootState) => state.leave.leaveBalances;
export const selectLeaveLoading = (state: RootState) => state.leave.loading;
export const selectLeaveError = (state: RootState) => state.leave.error;
export const selectApplyLoading = (state: RootState) => state.leave.applyLoading;
export const selectApprovalLoading = (state: RootState) => state.leave.approvalLoading;
export const selectBalanceLoading = (state: RootState) => state.leave.balanceLoading;
export const selectOrganizationHistoryLoading = (state: RootState) => state.leave.organizationHistoryLoading;
export const selectOrganizationApprovalLoading = (state: RootState) => state.leave.organizationApprovalLoading;

export const selectPendingLeavesCount = (state: RootState) =>
  state.leave.leavesForApproval.filter(leave => leave.status === 'pending').length;

export const selectOrganizationPendingLeavesCount = (state: RootState) =>
  state.leave.organizationLeavesForApproval.filter(leave => leave.status === 'pending').length;

export const selectTotalLeaveBalance = (state: RootState) =>
  state.leave.leaveBalances.reduce((total, balance) => total + balance.balance, 0);

export const selectLeaveBalanceByType = (state: RootState, leaveType: string) =>
  state.leave.leaveBalances.find(balance => balance.leaveType === leaveType)?.balance || 0;

export const selectUrgentLeaves = (state: RootState) => {
  const now = new Date();
  return state.leave.leavesForApproval.filter(leave => {
    const startDate = new Date(leave.startDate);
    const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 3 && leave.status === 'pending';
  });
};

export const selectOrganizationUrgentLeaves = (state: RootState) => {
  const now = new Date();
  return state.leave.organizationLeavesForApproval.filter(leave => {
    const startDate = new Date(leave.startDate);
    const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 3 && leave.status === 'pending';
  });
};

export const selectLeavesByStatus = (state: RootState, status: string) =>
  state.leave.leaveHistory.filter(leave => leave.status === status);

export const selectLeavesByDateRange = (state: RootState, startDate: string, endDate: string) =>
  state.leave.leaveHistory.filter(leave => {
    const leaveDate = new Date(leave.createdAt);
    return leaveDate >= new Date(startDate) && leaveDate <= new Date(endDate);
  });

export const selectLeaveStatistics = (state: RootState) => ({
  totalApplied: state.leave.leaves.length,
  totalForApproval: state.leave.leavesForApproval.length,
  totalOrgForApproval: state.leave.organizationLeavesForApproval.length,
  totalHistory: state.leave.leaveHistory.length,
  totalOrgHistory: state.leave.organizationLeaveHistory.length,
  totalBalance: state.leave.leaveBalances.reduce((sum, balance) => sum + balance.balance, 0),
  leaveTypes: state.leave.leaveBalances.length,
});
