
export interface User {
  _id: string;
  name: string;
  email: string;
  department_id: string;
}

export interface Department {
  _id: string;
  name: string;
  organization_id: string;
}

export interface TaskAssignment {
  _id: string;
  title: string;
  description?: string;
  assignedTo: string;
  assignedBy: string;
  department_id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  _id: string;
  task_assign_id: string;
  content: string;
  ETAT: number;
  reason?: {
    isValid: boolean;
    description: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PopulatedApproval {
  _id: string;
  taskAssignId: TaskAssignment;
  comment?: string;
  reason?: string;
  signalColor: "Red" | "Yellow" | "Green";
  status: "Approved" | "Rejected" | "Pending" | "Fraud";
  submissionId: Submission | string;
  assignBy: User;
  assignTo: User;
  department_id: Department;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalStats {
  totalRequests: number;
  pendingApprovals: number;
  approvedToday: number;
  rejectedThisWeek: number;
  fraudCases?: number;
}

export interface ApprovalFilters {
  search: string;
  manager: string;
  department: string;
  status?: "Approved" | "Rejected" | "Pending" | "Fraud";
}

export interface ApprovalActionRequest {
  approvalId: string;
  status: "Approved" | "Rejected" | "Fraud";
  comment?: string;
  reason?: string;
}

export interface OverrideDecisionRequest {
  approvalId: string;
  status: "Approved" | "Rejected" | "Fraud";
  reason?: string;
}

export interface RequestApprovalData {
  taskAssignIds: string[];
  assignBy: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
 

export interface GroupedApprovalUser {
  _id: string;
  name: string;
  email?: string;
  id: string;
  department_id?: string | { _id: string; name: string }; 
}

export interface GroupedApproval {
  user: GroupedApprovalUser
  approvals: Approval[]
}
 
interface Approval {
  id: string;
  taskAssignId: string;
  submissionId: string;
  assignBy: string;
  assignTo: string;
  department_id: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Fraud' | 'Reversed';
  comment?: string;
  reason?: string;
  signalColor?: 'Green' | 'Yellow' | 'Red';
  createdAt: string;
  updatedAt: string;
}


interface ApprovalState {
  approvals: PopulatedApproval[];
  selectedApproval: PopulatedApproval | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  filters: {
    search: string;
    manager: string;
    department: string;
    status?: string;
  };
  stats: any;
}

const initialState: ApprovalState = {
  approvals: [],
  selectedApproval: null,
  loading: false,
  actionLoading: false,
  error: null,
  filters: {
    search: "",
    manager: "",
    department: "",
    status: undefined,
  },
  stats: null,
};


export interface User {
  _id: string;
  name: string;
  email: string;
  department_id: string;
}