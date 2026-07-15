
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from '@/lib/api/client';
import { RootState } from '../../store';


interface Transaction {
  amount: number;
  operation: 'credit' | 'debit';
  timestamp: string;
}

interface AccountBalance {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  organizationId: string;
  totalAmount: number;
  history: Transaction[];
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
}

interface AccountBalanceState {
  balances: AccountBalance[];
  selectedBalance: AccountBalance | null;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  transactionLoading: boolean;
  pagination: PaginationInfo | null;
}

const initialState: AccountBalanceState = {
  balances: [],
  selectedBalance: null,
  transactions: [],
  loading: false,
  error: null,
  transactionLoading: false,
  pagination: null,
};


export const createTransaction = createAsyncThunk(
  'accountBalance/createTransaction',
  async ({ userId, amount, operation }: {
    userId: string;
    amount: number;
    operation: 'credit' | 'debit';
  }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axiosClient.post('/account/transaction', {
        userId,
        amount,
        operation
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create transaction');
    }
  }
);

export const fetchEmployeeBalance = createAsyncThunk(
  'accountBalance/fetchEmployeeBalance',
  async (userId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axiosClient.get(`/account/balance/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch employee balance');
    }
  }
);

export const fetchOrganizationBalances = createAsyncThunk(
  'accountBalance/fetchOrganizationBalances',
  async ({ page = 1, limit = 10 }: { page?: number; limit?: number } = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axiosClient.get(`/account/organization/${state.auth.user?.organizationId}?page=${page}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch organization balances');
    }
  }
);

export const fetchTransactionHistory = createAsyncThunk(
  'accountBalance/fetchTransactionHistory',
  async ({ userId, page = 1, limit = 20 }: { userId: string; page?: number; limit?: number }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axiosClient.get(`/account/history/${userId}?page=${page}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch transaction history');
    }
  }
);


const accountBalanceSlice = createSlice({
  name: 'accountBalance',
  initialState,
  reducers: {
    resetAccountBalanceState: () => initialState,
    clearError: (state) => {
      state.error = null;
    },
    setSelectedBalance: (state, action) => {
      state.selectedBalance = action.payload;
    },
    clearTransactions: (state) => {
      state.transactions = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTransaction.pending, (state) => {
        state.transactionLoading = true;
        state.error = null;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.transactionLoading = false;
        
        const balanceIndex = state.balances.findIndex(
          balance => balance.userId._id === action.meta.arg.userId
        );
        if (balanceIndex !== -1) {
          state.balances[balanceIndex].totalAmount = action.payload.data.newBalance;
          state.balances[balanceIndex].history.push(action.payload.data.transaction);
        }
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.transactionLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchEmployeeBalance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeBalance.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedBalance = action.payload;
      })
      .addCase(fetchEmployeeBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
     
      .addCase(fetchOrganizationBalances.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrganizationBalances.fulfilled, (state, action) => {
        state.loading = false;
        state.balances = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchOrganizationBalances.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchTransactionHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactionHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.history;
        state.selectedBalance = {
          ...state.selectedBalance,
          userId: action.payload.user,
          totalAmount: action.payload.currentBalance,
        } as AccountBalance;
      })
      .addCase(fetchTransactionHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  resetAccountBalanceState, 
  clearError, 
  setSelectedBalance,
  clearTransactions 
} = accountBalanceSlice.actions;

export const selectAccountBalances = (state: RootState) => 
  state.accountBalance?.balances || [];

export const selectSelectedBalance = (state: RootState) => 
  state.accountBalance?.selectedBalance || null;

export const selectTransactions = (state: RootState) => 
  state.accountBalance?.transactions || [];

export const selectAccountBalanceLoading = (state: RootState) => 
  state.accountBalance?.loading || false;

export const selectTransactionLoading = (state: RootState) => 
  state.accountBalance?.transactionLoading || false;

export const selectAccountBalanceError = (state: RootState) => 
  state.accountBalance?.error || null;

export const selectPagination = (state: RootState) => 
  state.accountBalance?.pagination || null;

export default accountBalanceSlice.reducer;
