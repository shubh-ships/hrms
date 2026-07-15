
export interface InterestPreset {
  _id: string;
  name: string;
  organizationId: string;
  interestRate: number;
  interestType: 'simple' | 'compound';
  description?: string;
  isEditable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  department?: string;
  designation?: string;
}

export interface Loan {
  _id: string;
 
  userId: string | User;
  organizationId: string;
  department?: string;
  designation?: string;
  
 
  loanType: string;
  description?: string;
  principalAmount: number;
  disbursementDate: string;
  repaymentStartMonth: string;
  interestPresetId: string | InterestPreset;
  interestRate?: number;
  interestType: 'simple' | 'compound';
  tenureMonths: number;
  

  approvedBy?: string | User;
  approvedPrincipal?: number;
  approvedInterestRate?: number;
  approvedInterestType?: 'simple' | 'compound';
  approvedTenure?: number;
  approvedRepaymentStartMonth?: string;
  approvedDisbursementDate?: string;
  emiAmount?: number;
  totalPayable?: number;
  
  
  status: 'Pending Review' | 'Approved' | 'Rejected' | 'Active' | 'Closed';
  adminRemarks?: string;
  remainingBalance?: number;
  
  
  requestDate: string;
  closedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInterestPresetData {
  name: string;
  organizationId: string;
  interestRate: number;
  interestType: 'simple' | 'compound';
  description?: string;
  isEditable?: boolean;
}

export interface UpdateInterestPresetData extends Partial<CreateInterestPresetData> {}

export interface CreateLoanData {
  department?: string;
  designation?: string;
  loanType: string;
  description?: string;
  principalAmount: number;
  disbursementDate: string;
  repaymentStartMonth: string;
  interestPresetId: string;
  tenureMonths: number;
  userId?: string;
}

export interface UpdateLoanData {
  loanType?: string;
  description?: string;
  principalAmount?: number;
  disbursementDate?: string;
  repaymentStartMonth?: string;
  interestPresetId?: string;
  interestRate?: number;
  interestType?: 'simple' | 'compound';
  tenureMonths?: number;
  adminRemarks?: string;
}

export interface ActivateLoanData {
  approvedPrincipal: number;
  approvedInterestRate: number;
  approvedInterestType: 'simple' | 'compound';
  approvedTenure: number;
  approvedRepaymentStartMonth: string;
  approvedDisbursementDate: string;
  emiAmount: number;
  totalPayable: number;
  remainingBalance: number;
}

export interface UpdateLoanBalanceData {
  remainingBalance: number;
}

export interface LoanApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface LoansResponse {
  loans: Loan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface InterestPresetState {
  presets: InterestPreset[];
  currentPreset: InterestPreset | null;
  loading: boolean;
  error: string | null;
}

export interface LoanState {
  loans: Loan[];
  employeeLoans: Loan[];
  currentLoan: Loan | null;
  loading: boolean;
  error: string | null;
}