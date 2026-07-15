export interface LeaveRule {
  leaveType: string;
  quota: number;
  carryForward: boolean;
  encashable: boolean;
  maxCarryForwardLimit: number;
  applicableTo: string[];
  frequency: "monthly" | "quarterly" | "yearly";
}

export interface CreateLeavePolicyRequest {
  name: string;
  description?: string;
  rules: LeaveRule[];
  weekOffs: WeekOff[];
}

export interface WeekOff {
  _id?: string;
  day: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
  occurrence: number[];
}

export interface LeavePolicy {
  _id: string;
  organizationId: string;
  name: string;
  description?: string;
  rules: LeaveRule[];
  weekOffs: WeekOff[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateLeavePolicyRequest {
  name?: string;
  description?: string;
  rules?: LeaveRule[];
  weekOffs?: WeekOff[];
}

export interface LeavePolicyState {
  policies: LeavePolicy[];
  currentPolicy: LeavePolicy | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}