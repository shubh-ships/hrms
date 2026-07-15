import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosClient from "@/lib/api/client";
import { RootState } from "@/store";

interface Installment {
  _id: string;
  loan: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: 'due' | 'paid' | 'overdue';
  paidAmount: number;
  paidDate?: string;
  principalComponent?: number;
  interestComponent?: number;
  createdAt: string;
  updatedAt: string;
}

interface InstallmentSummary {
  totalInstallments: number;
  paidInstallments: number;
  dueInstallments: number;
  totalPaid: Array<{ _id: null; total: number }>;
  totalDue: Array<{ _id: null; total: number }>;
}

interface InstallmentData {
  installments: Installment[];
  summary: InstallmentSummary;
}

interface MarkPaidData {
  paidAmount?: number;
  paidDate?: string;
}

interface InstallmentFilters {
  status?: 'due' | 'paid' | 'overdue';
}

interface LoanInstallmentState {
  installments: Installment[];
  paymentHistory: Installment[];
  summary: InstallmentSummary | null;
  currentInstallment: Installment | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export const getLoanInstallments = createAsyncThunk(
  "loanInstallment/getLoanInstallments",
  async (
    { loanId, filters = {} }: { loanId: string; filters?: InstallmentFilters },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

    
      
      const response = await axiosClient.get(
        `/loan-installments/loan/${loanId}?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

    
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error fetching loan installments:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch loan installments"
      );
    }
  }
);

export const markInstallmentPaid = createAsyncThunk(
  "loanInstallment/markInstallmentPaid",
  async (
    { installmentId, paidData }: { installmentId: string; paidData: MarkPaidData },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

    
      
      const response = await axiosClient.post(
        `/loan-installments/${installmentId}/pay`,
        paidData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      console.error('❌ Mark installment paid error:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to mark installment as paid"
      );
    }
  }
);

export const getPaymentHistory = createAsyncThunk(
  "loanInstallment/getPaymentHistory",
  async (loanId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      
      
      const response = await axiosClient.get(
        `/loan-installments/loan/${loanId}/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

    
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error fetching payment history:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch payment history"
      );
    }
  }
);

const initialState: LoanInstallmentState = {
  installments: [],
  paymentHistory: [],
  summary: null,
  currentInstallment: null,
  loading: false,
  error: null,
  success: false,
};

const loanInstallmentSlice = createSlice({
  name: "loanInstallment",
  initialState,
  reducers: {
    clearCurrentInstallment: (state) => {
      state.currentInstallment = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    setCurrentInstallment: (state, action: PayloadAction<Installment>) => {
      state.currentInstallment = action.payload;
    },
    clearInstallments: (state) => {
      state.installments = [];
      state.summary = null;
    },
    clearPaymentHistory: (state) => {
      state.paymentHistory = [];
    },
    resetInstallmentState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getLoanInstallments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLoanInstallments.fulfilled, (state, action: PayloadAction<InstallmentData>) => {
        state.loading = false;
        state.installments = action.payload.installments;
        state.summary = action.payload.summary;
      })
      .addCase(getLoanInstallments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(markInstallmentPaid.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(markInstallmentPaid.fulfilled, (state, action: PayloadAction<Installment>) => {
        state.loading = false;
        state.success = true;
        
        const index = state.installments.findIndex(
          installment => installment._id === action.payload._id
        );
        if (index !== -1) {
          state.installments[index] = action.payload;
        }
        
        if (state.currentInstallment && state.currentInstallment._id === action.payload._id) {
          state.currentInstallment = action.payload;
        }
        
        if (state.summary && action.payload.status === 'paid') {
          state.summary.paidInstallments += 1;
          state.summary.dueInstallments = Math.max(0, state.summary.dueInstallments - 1);
        }
      })
      .addCase(markInstallmentPaid.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })

      .addCase(getPaymentHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPaymentHistory.fulfilled, (state, action: PayloadAction<Installment[]>) => {
        state.loading = false;
        state.paymentHistory = action.payload;
      })
      .addCase(getPaymentHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearCurrentInstallment,
  clearError,
  clearSuccess,
  setCurrentInstallment,
  clearInstallments,
  clearPaymentHistory,
  resetInstallmentState,
} = loanInstallmentSlice.actions;

export default loanInstallmentSlice.reducer;
