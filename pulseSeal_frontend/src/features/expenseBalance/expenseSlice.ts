import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosClient from "@/lib/api/client";
import { RootState } from "@/store";
import {
  Expense,
  ExpenseState,
  ExpenseFilters,
  ExpenseStats,
  PaginatedExpenseResponse,
  ExpenseStatus,
  ExpenseType,
} from "@/lib/types/api/expenses";

export const createExpense = createAsyncThunk(
  "expense/createExpense",
  async (expenseData: FormData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.post("/expense", expenseData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Create expense error:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to create expense"
      );
    }
  }
);

// New Thunk for Admin to create expense for a specific employee
export const createEmployeeExpense = createAsyncThunk(
  "expense/createEmployeeExpense",
  async (
    { employeeId, expenseData }: { employeeId: string; expenseData: FormData },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.post(`/expense/createExpense/${employeeId}`, expenseData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Create employee expense error:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to create employee expense"
      );
    }
  }
);

export const getUserExpenses = createAsyncThunk(
  "expense/getUserExpenses",
  async (filters: ExpenseFilters = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });


      const response = await axiosClient.get(`/expense?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });


      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching user expenses:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch expenses"
      );
    }
  }
);

export const getUserAllExpenses = createAsyncThunk(
  "expense/getUserAllExpenses",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");



      const response = await axiosClient.get("/expense/get/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching user all expenses:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch user expenses"
      );
    }
  }
);

export const getExpenseById = createAsyncThunk(
  "expense/getExpenseById",
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.get(`/expense/get/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch expense"
      );
    }
  }
);

export const getAllExpenses = createAsyncThunk(
  "expense/getAllExpenses",
  async (filters: ExpenseFilters = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });



      const response = await axiosClient.get(`/expense/all?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });


      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching all expenses:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch all expenses"
      );
    }
  }
);

export const updateExpenseStatus = createAsyncThunk(
  "expense/updateExpenseStatus",
  async (
    { id, updateData }: { id: string; updateData: { status: string; rejectedReason?: string } },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.put(`/expense/${id}/status`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to update expense status"
      );
    }
  }
);

export const deleteExpense = createAsyncThunk(
  "expense/deleteExpense",
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.delete(`/expense/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return id; // Return the ID of the deleted expense
    } catch (error: any) {
      console.error('Delete expense error:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to delete expense"
      );
    }
  }
);

export const getExpenseStats = createAsyncThunk(
  "expense/getExpenseStats",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.get("/expense/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch expense stats"
      );
    }
  }
);

const initialState: ExpenseState = {
  expenses: [],
  currentExpense: null,
  pagination: null,
  filters: {
    page: 1,
    limit: 50,
  },
  stats: null,
  loading: false,
  error: null,
  success: false,
};

const expenseSlice = createSlice({
  name: "expense",
  initialState,
  reducers: {
    clearCurrentExpense: (state) => {
      state.currentExpense = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    setFilters: (state, action: PayloadAction<Partial<ExpenseFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        page: 1,
        limit: 50,
      };
    },
    resetExpenseState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createExpense.fulfilled, (state, action: PayloadAction<Expense>) => {
        state.loading = false;
        state.success = true;
        state.expenses.unshift(action.payload);
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })

      .addCase(createEmployeeExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createEmployeeExpense.fulfilled, (state, action: PayloadAction<Expense>) => {
        state.loading = false;
        state.success = true;
        state.expenses.unshift(action.payload);
      })
      .addCase(createEmployeeExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })

      .addCase(getUserExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserExpenses.fulfilled, (state, action: PayloadAction<PaginatedExpenseResponse>) => {
        state.loading = false;
        state.expenses = action.payload.docs;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          totalPages: action.payload.totalPages,
          totalDocs: action.payload.totalDocs,
          hasNextPage: action.payload.hasNextPage,
          hasPrevPage: action.payload.hasPrevPage,
        };
      })
      .addCase(getUserExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(getAllExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllExpenses.fulfilled, (state, action: PayloadAction<PaginatedExpenseResponse>) => {
        state.loading = false;
        state.expenses = action.payload.docs;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          totalPages: action.payload.totalPages,
          totalDocs: action.payload.totalDocs,
          hasNextPage: action.payload.hasNextPage,
          hasPrevPage: action.payload.hasPrevPage,
        };
      })
      .addCase(getAllExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(updateExpenseStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateExpenseStatus.fulfilled, (state, action: PayloadAction<Expense>) => {
        state.loading = false;
        state.success = true;
        const index = state.expenses.findIndex(
          (expense) => expense._id === action.payload._id
        );
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
        if (state.currentExpense && state.currentExpense._id === action.payload._id) {
          state.currentExpense = action.payload;
        }
      })
      .addCase(updateExpenseStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })

      .addCase(deleteExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(deleteExpense.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;

        // Find the expense to update stats before removing it
        const expenseToDelete = state.expenses.find(e => e._id === action.payload);
        if (expenseToDelete && state.stats) {
          const status = expenseToDelete.status;
          const amount = Number(expenseToDelete.amount) || 0;

          // Update Status-specific Stats (this controls the cards)
          const statusIdx = state.stats.statusStats.findIndex(s => s._id === status);
          if (statusIdx !== -1) {
            state.stats.statusStats[statusIdx].count = Math.max(0, state.stats.statusStats[statusIdx].count - 1);
            state.stats.statusStats[statusIdx].totalAmount = Math.max(0, state.stats.statusStats[statusIdx].totalAmount - amount);
          }

          // Update overall stats if they exist
          if (state.stats.overallStats) {
            state.stats.overallStats.totalRequests = Math.max(0, (state.stats.overallStats.totalRequests || 0) - 1);
            state.stats.overallStats.totalAmount = Math.max(0, (state.stats.overallStats.totalAmount || 0) - amount);

            if (status === 'Approved') {
              state.stats.overallStats.approvedAmount = Math.max(0, (state.stats.overallStats.approvedAmount || 0) - amount);
            } else if (status === 'Pending') {
              state.stats.overallStats.pendingAmount = Math.max(0, (state.stats.overallStats.pendingAmount || 0) - amount);
            }
          }
        }

        state.expenses = state.expenses.filter((expense) => expense._id !== action.payload);
        state.success = true;
      })

      .addCase(deleteExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(getExpenseStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getExpenseStats.fulfilled, (state, action: PayloadAction<ExpenseStats>) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(getExpenseStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearCurrentExpense,
  clearError,
  clearSuccess,
  setFilters,
  clearFilters,
  resetExpenseState,
} = expenseSlice.actions;

export default expenseSlice.reducer;