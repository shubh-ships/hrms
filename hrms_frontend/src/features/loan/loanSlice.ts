import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosClient from "@/lib/api/client";
import { RootState } from "@/store";

interface User {
  _id: string;
  name: string;
  email: string;
  userId?: string;
  personal?: {
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  employment?: {
    employeeCode: string;
  };
}

interface InterestPreset {
  _id: string;
  name: string;
  interestRate: number;
  interestType: 'simple' | 'compound';
}

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
}

interface Loan {
  _id: string;
  loanName: string;
  description?: string;
  userId: User;
  employeeId?: User; // Add this since backend populates employeeId
  organizationId: string;
  principalAmount: number;
  disbursementDate: string;
  repaymentStartMonth: string;
  interestPreset?: InterestPreset;
  interestRate: number;
  interestType: 'simple' | 'compound';
  tenure: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'written_off';
  monthlyInstallment: number;
  totalPayable: number;
  createdBy: string;
  approvedBy?: User;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateLoanData {
  loanName: string;
  description?: string;
  principalAmount: number;
  disbursementDate: string;
  repaymentStartMonth: string;
  interestPreset?: string;
  interestRate?: number;
  interestType?: 'simple' | 'compound';
  tenure: number;
}

interface UpdateLoanData extends Partial<CreateLoanData> {
  status?: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'written_off';
}

interface LoanFilters {
  status?: string;
  userId?: string;
}

interface DisburseResponse {
  loan: Loan;
  installments: Installment[];
}

interface LoanState {
  loans: Loan[];
  myLoans: Loan[];
  currentLoan: Loan | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export const createLoanRequest = createAsyncThunk(
  "loan/createLoanRequest",
  async (loanData: CreateLoanData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");



      const response = await axiosClient.post("/loans/request", loanData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Create loan request error:', error);
      return rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || error.message || "Failed to create loan request"
      );
    }
  }
);

export const getEmployeeLoans = createAsyncThunk(
  "loan/getEmployeeLoans",
  async (filters: LoanFilters = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });



      const response = await axiosClient.get(`/loans/my-loans?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });


      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching employee loans:', error);
      return rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || error.message || "Failed to fetch employee loans"
      );
    }
  }
);

export const getAllLoans = createAsyncThunk(
  "loan/getAllLoans",
  async (filters: LoanFilters = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });



      const response = await axiosClient.get(`/loans?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });


      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching all loans:', error);
      return rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || error.message || "Failed to fetch all loans"
      );
    }
  }
);

export const updateLoanRequest = createAsyncThunk(
  "loan/updateLoanRequest",
  async (
    { id, updateData }: { id: string; updateData: UpdateLoanData },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");



      const response = await axiosClient.put(`/loans/${id}`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Update loan request error:', error);
      return rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || error.message || "Failed to update loan request"
      );
    }
  }
);

export const approveLoan = createAsyncThunk(
  "loan/approveLoan",
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");



      const response = await axiosClient.patch(`/loans/${id}/approve`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Approve loan error:', error);
      return rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || error.message || "Failed to approve loan"
      );
    }
  }
);

export const rejectLoan = createAsyncThunk(
  "loan/rejectLoan",
  async (
    { id, rejectionReason }: { id: string; rejectionReason: string },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");


      const response = await axiosClient.post(`/loans/${id}/reject`,
        { rejectionReason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      console.error('Reject loan error:', error);
      return rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || error.message || "Failed to reject loan"
      );
    }
  }
);

export const disburseLoan = createAsyncThunk(
  "loan/disburseLoan",
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");



      const response = await axiosClient.post(`/loans/${id}/disburse`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Disburse loan error:', error);
      return rejectWithValue(
        error.response?.data?.message || error.response?.data?.error || error.message || "Failed to disburse loan"
      );
    }
  }
);

const initialState: LoanState = {
  loans: [],
  myLoans: [],
  currentLoan: null,
  loading: false,
  error: null,
  success: false,
};

const loanSlice = createSlice({
  name: "loan",
  initialState,
  reducers: {
    clearCurrentLoan: (state) => {
      state.currentLoan = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    setCurrentLoan: (state, action: PayloadAction<Loan>) => {
      state.currentLoan = action.payload;
    },
    resetLoanState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createLoanRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createLoanRequest.fulfilled, (state, action: PayloadAction<Loan>) => {
        state.loading = false;
        state.success = true;
        state.myLoans.unshift(action.payload);
        state.loans.unshift(action.payload);
      })
      .addCase(createLoanRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })

      .addCase(getEmployeeLoans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEmployeeLoans.fulfilled, (state, action: PayloadAction<Loan[]>) => {
        state.loading = false;
        state.myLoans = action.payload;
      })
      .addCase(getEmployeeLoans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(getAllLoans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllLoans.fulfilled, (state, action: PayloadAction<Loan[]>) => {
        state.loading = false;
        state.loans = action.payload;
      })
      .addCase(getAllLoans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(updateLoanRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateLoanRequest.fulfilled, (state, action: PayloadAction<Loan>) => {
        state.loading = false;
        state.success = true;

        const loanIndex = state.loans.findIndex(loan => loan._id === action.payload._id);
        if (loanIndex !== -1) {
          state.loans[loanIndex] = action.payload;
        }

        const myLoanIndex = state.myLoans.findIndex(loan => loan._id === action.payload._id);
        if (myLoanIndex !== -1) {
          state.myLoans[myLoanIndex] = action.payload;
        }

        if (state.currentLoan && state.currentLoan._id === action.payload._id) {
          state.currentLoan = action.payload;
        }
      })
      .addCase(updateLoanRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })

      .addCase(approveLoan.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(approveLoan.fulfilled, (state, action: PayloadAction<Loan>) => {
        state.loading = false;
        state.success = true;

        const updateLoanInArray = (loans: Loan[]) => {
          const index = loans.findIndex(loan => loan._id === action.payload._id);
          if (index !== -1) {
            loans[index] = action.payload;
          }
        };

        updateLoanInArray(state.loans);
        updateLoanInArray(state.myLoans);

        if (state.currentLoan && state.currentLoan._id === action.payload._id) {
          state.currentLoan = action.payload;
        }
      })
      .addCase(approveLoan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })

      .addCase(rejectLoan.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(rejectLoan.fulfilled, (state, action: PayloadAction<Loan>) => {
        state.loading = false;
        state.success = true;

        const updateLoanInArray = (loans: Loan[]) => {
          const index = loans.findIndex(loan => loan._id === action.payload._id);
          if (index !== -1) {
            loans[index] = action.payload;
          }
        };

        updateLoanInArray(state.loans);
        updateLoanInArray(state.myLoans);

        if (state.currentLoan && state.currentLoan._id === action.payload._id) {
          state.currentLoan = action.payload;
        }
      })
      .addCase(rejectLoan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      })

      .addCase(disburseLoan.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(disburseLoan.fulfilled, (state, action: PayloadAction<DisburseResponse>) => {
        state.loading = false;
        state.success = true;

        const updatedLoan = action.payload.loan;

        const updateLoanInArray = (loans: Loan[]) => {
          const index = loans.findIndex(loan => loan._id === updatedLoan._id);
          if (index !== -1) {
            loans[index] = updatedLoan;
          }
        };

        updateLoanInArray(state.loans);
        updateLoanInArray(state.myLoans);

        if (state.currentLoan && state.currentLoan._id === updatedLoan._id) {
          state.currentLoan = updatedLoan;
        }
      })
      .addCase(disburseLoan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });
  },
});

export const {
  clearCurrentLoan,
  clearError,
  clearSuccess,
  setCurrentLoan,
  resetLoanState,
} = loanSlice.actions;

export default loanSlice.reducer;