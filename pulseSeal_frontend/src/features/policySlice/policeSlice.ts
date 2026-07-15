
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosClient from "../../lib/api/client";
import { RootState } from "@/store";


export interface DeductionRule {
  _id?: string;
  lateHours: number;
  lateMinutes: number;
  deductionType: "fixed" | "multiplier";
  amount: number;
}

export interface OccurrenceRule {
  isActive: boolean;
  count?: number;
  hours?: number;
}

export interface PenliteRule {
  _id?: string;
  ruleName: string;
  ruleType: "salary_deduction" | "half_day_deduct" | "full_day_deduct";
  lateHoursThreshold?: number;
  lateMinutesThreshold?: number;
  deductions?: DeductionRule[];
  occurrence: OccurrenceRule;
  isActive: boolean;
}

export interface OvertimePayRule {
  _id?: string;
  hours: number;
  minutes: number;
  overtimeType: "fixed" | "multiplier" | "fixed_per_hour";
  amount: number;
}

export interface OvertimeRule {
  _id?: string;
  ruleName: string;
  ruleType: "salary_pay" | "half_day_pay" | "full_day_pay";
  hoursThreshold?: number;
  minutesThreshold?: number;
  overtimePay?: OvertimePayRule[];
  isActive: boolean;
}

export interface Policy {
  _id: string;
  name: "late_entry" | "early_leave" | "breaks" | "overtime" | "early_overtime";
  penliteRules?: PenliteRule[];
  overtimeRules?: OvertimeRule[];
  calculationType?: "post_payable_hours" | "post_payable_hours_and_shift_end" | "post_payable_hours_or_shift_end" | "shift_end";
  addGraceMinutesToOvertime?: boolean;
  includeEarlyOTFromStartTime?: boolean;
  description?: string;
  organizationId: string | { _id: string; name: string };
  createdBy: string | { _id: string; name: string };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePolicyData {
  name: "late_entry" | "early_leave" | "breaks" | "overtime" | "early_overtime";
  penliteRules?: Omit<PenliteRule, '_id'>[];
  overtimeRules?: Omit<OvertimeRule, '_id'>[];
  calculationType?: "post_payable_hours" | "post_payable_hours_and_shift_end" | "post_payable_hours_or_shift_end" | "shift_end";
  addGraceMinutesToOvertime?: boolean;
  includeEarlyOTFromStartTime?: boolean;
  description?: string;
}

export interface UpdatePolicyData extends Partial<CreatePolicyData> {
  _id?: string;
}

export interface AttendanceResponse {
  _id: string;
  status: string;
  deductions?: any[];
  overtimePayments?: any[];
  earlyOvertimePayments?: any[];
}

interface PolicyState {
  policies: Policy[];
  currentPolicy: Policy | null;
  loading: boolean;
  error: string | null;
}

const initialState: PolicyState = {
  policies: [],
  currentPolicy: null,
  loading: false,
  error: null,
};


export const fetchPolicies = createAsyncThunk(
  "policy/fetchPolicies",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.get("/policy/organization", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch policies"
      );
    }
  }
);


export const fetchPolicyById = createAsyncThunk(
  "policy/fetchPolicyById",
  async (policyId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.get(`/policy/${policyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch policy"
      );
    }
  }
);


export const createOrUpdatePolicy = createAsyncThunk(
  "policy/createOrUpdatePolicy",
  async (policyData: CreatePolicyData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.post("/policy", policyData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create/update policy"
      );
    }
  }
);

export const togglePolicyStatus = createAsyncThunk(
  "policy/togglePolicyStatus",
  async ({ policyId, isActive }: { policyId: string; isActive: boolean }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.patch(`/policy/${policyId}/active-deactivate`, 
        { isActive },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to toggle policy status"
      );
    }
  }
);

export const applyLateEntryPolicy = createAsyncThunk(
  "policy/applyLateEntryPolicy",
  async (attendanceId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.post(`/policy/apply/late-entry/${attendanceId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.attendance;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to apply late entry policy"
      );
    }
  }
);

export const applyOvertimePolicy = createAsyncThunk(
  "policy/applyOvertimePolicy",
  async (attendanceId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.post(`/policy/apply/overtime/${attendanceId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.attendance;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to apply overtime policy"
      );
    }
  }
);

export const applyEarlyOvertimePolicy = createAsyncThunk(
  "policy/applyEarlyOvertimePolicy",
  async (attendanceId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      const response = await axiosClient.post(`/policy/apply/early-overtime/${attendanceId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.attendance;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to apply early overtime policy"
      );
    }
  }
);

const policySlice = createSlice({
  name: "policy",
  initialState,
  reducers: {
    clearPolicies: (state) => {
      state.policies = [];
      state.currentPolicy = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentPolicy: (state, action: PayloadAction<Policy | null>) => {
      state.currentPolicy = action.payload;
    },
    clearCurrentPolicy: (state) => {
      state.currentPolicy = null;
    },
    addPenliteRule: (state, action: PayloadAction<{ policyId: string; rule: Omit<PenliteRule, '_id'> }>) => {
      const { policyId, rule } = action.payload;
      const newRule: PenliteRule = {
        ...rule,
        _id: `temp_${Date.now()}`, 
      };
      
      const policyIndex = state.policies.findIndex(policy => policy._id === policyId);
      if (policyIndex !== -1) {
        if (!state.policies[policyIndex].penliteRules) {
          state.policies[policyIndex].penliteRules = [];
        }
        state.policies[policyIndex].penliteRules!.push(newRule);
      }
      
      if (state.currentPolicy?._id === policyId) {
        if (!state.currentPolicy.penliteRules) {
          state.currentPolicy.penliteRules = [];
        }
        state.currentPolicy.penliteRules.push(newRule);
      }
    },
    updatePenliteRule: (state, action: PayloadAction<{ 
      policyId: string; 
      ruleId: string; 
      ruleData: Partial<PenliteRule> 
    }>) => {
      const { policyId, ruleId, ruleData } = action.payload;
      
      const policyIndex = state.policies.findIndex(policy => policy._id === policyId);
      if (policyIndex !== -1 && state.policies[policyIndex].penliteRules) {
        const ruleIndex = state.policies[policyIndex].penliteRules!.findIndex(rule => rule._id === ruleId);
        if (ruleIndex !== -1) {
          state.policies[policyIndex].penliteRules![ruleIndex] = {
            ...state.policies[policyIndex].penliteRules![ruleIndex],
            ...ruleData
          };
        }
      }
      
      if (state.currentPolicy?._id === policyId && state.currentPolicy.penliteRules) {
        const ruleIndex = state.currentPolicy.penliteRules.findIndex(rule => rule._id === ruleId);
        if (ruleIndex !== -1) {
          state.currentPolicy.penliteRules[ruleIndex] = {
            ...state.currentPolicy.penliteRules[ruleIndex],
            ...ruleData
          };
        }
      }
    },
    removePenliteRule: (state, action: PayloadAction<{ policyId: string; ruleId: string }>) => {
      const { policyId, ruleId } = action.payload;
      
      const policyIndex = state.policies.findIndex(policy => policy._id === policyId);
      if (policyIndex !== -1 && state.policies[policyIndex].penliteRules) {
        state.policies[policyIndex].penliteRules = state.policies[policyIndex].penliteRules!.filter(
          rule => rule._id !== ruleId
        );
      }
      
      if (state.currentPolicy?._id === policyId && state.currentPolicy.penliteRules) {
        state.currentPolicy.penliteRules = state.currentPolicy.penliteRules.filter(
          rule => rule._id !== ruleId
        );
      }
    },
    addOvertimeRule: (state, action: PayloadAction<{ policyId: string; rule: Omit<OvertimeRule, '_id'> }>) => {
      const { policyId, rule } = action.payload;
      const newRule: OvertimeRule = {
        ...rule,
        _id: `temp_${Date.now()}`, 
      };
      
      const policyIndex = state.policies.findIndex(policy => policy._id === policyId);
      if (policyIndex !== -1) {
        if (!state.policies[policyIndex].overtimeRules) {
          state.policies[policyIndex].overtimeRules = [];
        }
        state.policies[policyIndex].overtimeRules!.push(newRule);
      }
      
      if (state.currentPolicy?._id === policyId) {
        if (!state.currentPolicy.overtimeRules) {
          state.currentPolicy.overtimeRules = [];
        }
        state.currentPolicy.overtimeRules.push(newRule);
      }
    },
    updateOvertimeRule: (state, action: PayloadAction<{ 
      policyId: string; 
      ruleId: string; 
      ruleData: Partial<OvertimeRule> 
    }>) => {
      const { policyId, ruleId, ruleData } = action.payload;
      
      const policyIndex = state.policies.findIndex(policy => policy._id === policyId);
      if (policyIndex !== -1 && state.policies[policyIndex].overtimeRules) {
        const ruleIndex = state.policies[policyIndex].overtimeRules!.findIndex(rule => rule._id === ruleId);
        if (ruleIndex !== -1) {
          state.policies[policyIndex].overtimeRules![ruleIndex] = {
            ...state.policies[policyIndex].overtimeRules![ruleIndex],
            ...ruleData
          };
        }
      }
      
      if (state.currentPolicy?._id === policyId && state.currentPolicy.overtimeRules) {
        const ruleIndex = state.currentPolicy.overtimeRules.findIndex(rule => rule._id === ruleId);
        if (ruleIndex !== -1) {
          state.currentPolicy.overtimeRules[ruleIndex] = {
            ...state.currentPolicy.overtimeRules[ruleIndex],
            ...ruleData
          };
        }
      }
    },
    removeOvertimeRule: (state, action: PayloadAction<{ policyId: string; ruleId: string }>) => {
      const { policyId, ruleId } = action.payload;
      
      const policyIndex = state.policies.findIndex(policy => policy._id === policyId);
      if (policyIndex !== -1 && state.policies[policyIndex].overtimeRules) {
        state.policies[policyIndex].overtimeRules = state.policies[policyIndex].overtimeRules!.filter(
          rule => rule._id !== ruleId
        );
      }
      
      if (state.currentPolicy?._id === policyId && state.currentPolicy.overtimeRules) {
        state.currentPolicy.overtimeRules = state.currentPolicy.overtimeRules.filter(
          rule => rule._id !== ruleId
        );
      }
    },
    addDeductionToRule: (state, action: PayloadAction<{ 
      policyId: string; 
      ruleId: string; 
      deduction: Omit<DeductionRule, '_id'> 
    }>) => {
      const { policyId, ruleId, deduction } = action.payload;
      const newDeduction: DeductionRule = {
        ...deduction,
        _id: `temp_${Date.now()}`,
      };
      
      const policyIndex = state.policies.findIndex(policy => policy._id === policyId);
      if (policyIndex !== -1 && state.policies[policyIndex].penliteRules) {
        const ruleIndex = state.policies[policyIndex].penliteRules!.findIndex(rule => rule._id === ruleId);
        if (ruleIndex !== -1) {
          if (!state.policies[policyIndex].penliteRules![ruleIndex].deductions) {
            state.policies[policyIndex].penliteRules![ruleIndex].deductions = [];
          }
          state.policies[policyIndex].penliteRules![ruleIndex].deductions!.push(newDeduction);
        }
      }
      
      if (state.currentPolicy?._id === policyId && state.currentPolicy.penliteRules) {
        const ruleIndex = state.currentPolicy.penliteRules.findIndex(rule => rule._id === ruleId);
        if (ruleIndex !== -1) {
          if (!state.currentPolicy.penliteRules[ruleIndex].deductions) {
            state.currentPolicy.penliteRules[ruleIndex].deductions = [];
          }
          state.currentPolicy.penliteRules[ruleIndex].deductions!.push(newDeduction);
        }
      }
    },
    addOvertimePayToRule: (state, action: PayloadAction<{ 
      policyId: string; 
      ruleId: string; 
      overtimePay: Omit<OvertimePayRule, '_id'> 
    }>) => {
      const { policyId, ruleId, overtimePay } = action.payload;
      const newOvertimePay: OvertimePayRule = {
        ...overtimePay,
        _id: `temp_${Date.now()}`,
      };
      
      const policyIndex = state.policies.findIndex(policy => policy._id === policyId);
      if (policyIndex !== -1 && state.policies[policyIndex].overtimeRules) {
        const ruleIndex = state.policies[policyIndex].overtimeRules!.findIndex(rule => rule._id === ruleId);
        if (ruleIndex !== -1) {
          if (!state.policies[policyIndex].overtimeRules![ruleIndex].overtimePay) {
            state.policies[policyIndex].overtimeRules![ruleIndex].overtimePay = [];
          }
          state.policies[policyIndex].overtimeRules![ruleIndex].overtimePay!.push(newOvertimePay);
        }
      }
      
      if (state.currentPolicy?._id === policyId && state.currentPolicy.overtimeRules) {
        const ruleIndex = state.currentPolicy.overtimeRules.findIndex(rule => rule._id === ruleId);
        if (ruleIndex !== -1) {
          if (!state.currentPolicy.overtimeRules[ruleIndex].overtimePay) {
            state.currentPolicy.overtimeRules[ruleIndex].overtimePay = [];
          }
          state.currentPolicy.overtimeRules[ruleIndex].overtimePay!.push(newOvertimePay);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPolicies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPolicies.fulfilled, (state, action) => {
        state.loading = false;
        state.policies = action.payload || [];
      })
      .addCase(fetchPolicies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(fetchPolicyById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPolicyById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPolicy = action.payload;
      })
      .addCase(fetchPolicyById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(createOrUpdatePolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrUpdatePolicy.fulfilled, (state, action) => {
        state.loading = false;
        const policy = action.payload;
        
        const existingIndex = state.policies.findIndex(p => p._id === policy._id);
        if (existingIndex !== -1) {
          state.policies[existingIndex] = policy;
        } else {
          state.policies.push(policy);
        }
        
        if (state.currentPolicy && state.currentPolicy._id === policy._id) {
          state.currentPolicy = policy;
        }
      })
      .addCase(createOrUpdatePolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(togglePolicyStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(togglePolicyStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedPolicy = action.payload;
        const index = state.policies.findIndex(policy => policy._id === updatedPolicy._id);
        if (index !== -1) {
          state.policies[index] = updatedPolicy;
        }
        if (state.currentPolicy && state.currentPolicy._id === updatedPolicy._id) {
          state.currentPolicy = updatedPolicy;
        }
      })
      .addCase(togglePolicyStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(applyLateEntryPolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyLateEntryPolicy.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(applyLateEntryPolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(applyOvertimePolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyOvertimePolicy.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(applyOvertimePolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(applyEarlyOvertimePolicy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyEarlyOvertimePolicy.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(applyEarlyOvertimePolicy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearPolicies,
  clearError,
  setCurrentPolicy,
  clearCurrentPolicy,
  addPenliteRule,
  updatePenliteRule,
  removePenliteRule,
  addOvertimeRule,
  updateOvertimeRule,
  removeOvertimeRule,
  addDeductionToRule,
  addOvertimePayToRule,
} = policySlice.actions;

export const selectPolicies = (state: RootState) => state.policy.policies;
export const selectCurrentPolicy = (state: RootState) => state.policy.currentPolicy;
export const selectPolicyLoading = (state: RootState) => state.policy.loading;
export const selectPolicyError = (state: RootState) => state.policy.error;

export const selectPolicyById = (policyId: string) => (state: RootState) =>
  state.policy.policies.find(policy => policy._id === policyId);

export const selectPoliciesByName = (name: string) => (state: RootState) =>
  state.policy.policies.filter(policy => policy.name === name);

export const selectActivePolicies = (state: RootState) =>
  state.policy.policies.filter(policy => policy.isActive);

export const selectPolicyByName = (policyName: string) => (state: RootState) =>
  state.policy.policies.find(policy => policy.name === policyName && policy.isActive);

export const selectLateEntryPolicies = (state: RootState) =>
  state.policy.policies.filter(policy => 
    policy.name === 'late_entry' && policy.isActive
  );

export const selectOvertimePolicies = (state: RootState) =>
  state.policy.policies.filter(policy => 
    (policy.name === 'overtime' || policy.name === 'early_overtime') && policy.isActive
  );

export const selectPolicyRules = (policyId: string) => (state: RootState) => {
  const policy = state.policy.policies.find(p => p._id === policyId);
  return {
    penliteRules: policy?.penliteRules || [],
    overtimeRules: policy?.overtimeRules || [],
  };
};

export const selectFormattedPolicies = (state: RootState) =>
  state.policy.policies.map(policy => ({
    ...policy,
    penliteRulesCount: policy.penliteRules?.length || 0,
    overtimeRulesCount: policy.overtimeRules?.length || 0,
    activeRulesCount: [
      ...(policy.penliteRules?.filter(rule => rule.isActive) || []),
      ...(policy.overtimeRules?.filter(rule => rule.isActive) || [])
    ].length,
    statusText: policy.isActive ? 'Active' : 'Inactive',
  }));

export default policySlice.reducer;
