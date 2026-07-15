
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosClient from "../../lib/api/client";
import { RootState } from "@/store";

export interface SalarySlipData {
    success: boolean;
    message: string;
    data: {
        employeeDetails: {
            employeeId: string;
            employeeCode: string;
            name: string;
            joinDate: string;
            workType: string;
        };
        salaryPeriod: {
            month: string;
            monthNumber: number;
            year: number;
            fromDate: string;
            toDate: string;
        };
        attendanceSummary: {
            totalWorkingDays: number;
            presentDays: number;
            paidLeaves: number;
            unpaidLeaves: number;
        };
        earnings: {
            basic: number;
            hra: number;
            allowances: number;
            overtimePay: number;
            totalEarnings: number;
        };
        deductions: {
            salaryDeduction: number;
            policyDeductions: number;
            otherDeductions: number;
            totalDeductions: number;
        };
        policyDetails: {
            deductions: {
                summary: {
                    lateEntryDeductions: number;
                    earlyLeaveDeductions: number;
                    breakDeductions: number;
                    total: number;
                };
                dailyDetails: Array<{
                    date: string;
                    lateEntry: {
                        deduction: number;
                        ruleApplied: string | null;
                        violationMinutes: number;
                        occurrenceCount: number;
                        totalMinutes: number;
                        isOccurrenceRule: boolean;
                        occurrenceType: string;
                        occurrenceValue: number;
                    };
                    earlyLeave: {
                        deduction: number;
                        ruleApplied: string | null;
                        violationMinutes: number;
                        occurrenceCount: number;
                        totalMinutes: number;
                        isOccurrenceRule: boolean;
                        occurrenceType: string;
                        occurrenceValue: number;
                    };
                    breaks: {
                        deduction: number;
                        ruleApplied: string | null;
                        violationMinutes: number;
                        occurrenceCount: number;
                        totalMinutes: number;
                        isOccurrenceRule: boolean;
                        occurrenceType: string;
                        occurrenceValue: number;
                    };
                }>;
                occurrenceCounters: {
                    late_entry: Record<string, any>;
                    early_leave: Record<string, any>;
                    breaks: Record<string, any>;
                };
            };
            overtime: {
                summary: {
                    regularOvertimePay: number;
                    earlyOvertimePay: number;
                    total: number;
                };
                dailyDetails: any[];
                occurrenceCounters: {
                    overtime: Record<string, any>;
                    early_overtime: Record<string, any>;
                };
            };
        };
        calculation: {
            perDayRate: number;
            perDayFormula: string;
            workingDaysFormula: string;
        };
        netSalary: number;
        bankDetails: {
            accountHolderName: string;
            accountNumber: string;
            bankName: string;
            ifsc: string;
        };
        generatedAt: string;
        calculationNotes: string;
    };
}

interface SalarySlipState {
  salarySlip: SalarySlipData | null;
  loading: boolean;
  error: string | null;
}

const initialState: SalarySlipState = {
  salarySlip: null,
  loading: false,
  error: null,
};


export const generateSalarySlip = createAsyncThunk(
  "salaryslip/generate",
  async (
    { month, year }: { month: number; year: number },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.post(
        "/salaryslip/genrateSalarySlip",
        { month, year },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to generate salary slip"
      );
    }
  }
);


export const generateSalarySlipForUser = createAsyncThunk(
  "salaryslip/generateForUser",
  async (
    { userId, month, year }: { userId: string; month: number; year: number },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.post(
        `/salaryslip/genrateSalarySlip/${userId}`,
        { month, year },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to generate salary slip"
      );
    }
  }
);

const salarySlipSlice = createSlice({
  name: "salaryslip",
  initialState,
  reducers: {
    clearSalarySlip: (state) => {
      state.salarySlip = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
    
      .addCase(generateSalarySlip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateSalarySlip.fulfilled, (state, action) => {
        state.loading = false;
        state.salarySlip = action.payload;
      })
      .addCase(generateSalarySlip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(generateSalarySlipForUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateSalarySlipForUser.fulfilled, (state, action) => {
        state.loading = false;
        state.salarySlip = action.payload;
      })
      .addCase(generateSalarySlipForUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSalarySlip, clearError } = salarySlipSlice.actions;

export const selectSalarySlip = (state: RootState) => state.salarySlip.salarySlip;
export const selectSalarySlipLoading = (state: RootState) => state.salarySlip.loading;
export const selectSalarySlipError = (state: RootState) => state.salarySlip.error;

export default salarySlipSlice.reducer;