
export interface ExpenseProof {
  public_id: string;
  url: string;
}


export enum ExpenseStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}


export enum ExpenseType {
  TRAVEL = 'Travel',
  FOOD = 'Food',
  OTHERS = 'Others'
}


export interface UserInfo {
  _id: string;
  name: string;
  email: string;
  employeeId?: string;
  department?: string;
}


export interface Expense {
  _id: string;
  employee: string | UserInfo; 
  expenseType: ExpenseType;
  expenseDate: string | Date;
  billNumber?: string;
  amount: number;
  description: string;
  proofs: ExpenseProof[];
  status: ExpenseStatus;
  rejectedReason?: string | null;
  handledBy?: string | UserInfo | null;
  handledAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateExpenseRequest {
  expenseType: ExpenseType;
  expenseDate: string | Date;
  billNumber?: string;
  amount: number;
  description: string;
  proofFiles: File[]; 
}

export interface UpdateExpenseStatus {
  status: ExpenseStatus.APPROVED | ExpenseStatus.REJECTED;
  rejectedReason?: string;
}


export interface ExpenseFilters {
  page?: number;
  limit?: number;
  status?: ExpenseStatus;
  employee?: string;
  expenseType?: ExpenseType;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedExpenseResponse {
  docs: Expense[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

export interface ExpenseStatusStats {
  _id: ExpenseStatus;
  count: number;
  totalAmount: number;
}

export interface ExpenseOverallStats {
  totalRequests: number;
  totalAmount: number;
  approvedAmount: number;
  pendingAmount: number;
}

export interface ExpenseStats {
  statusStats: ExpenseStatusStats[];
  overallStats: ExpenseOverallStats;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ExpenseState {
  expenses: Expense[];
  currentExpense: Expense | null;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalDocs: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null;
  filters: ExpenseFilters;
  stats: ExpenseStats | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface ExpenseFormData {
  expenseType: ExpenseType;
  expenseDate: string;
  billNumber: string;
  amount: string;
  description: string;
  proofs: File[];
}