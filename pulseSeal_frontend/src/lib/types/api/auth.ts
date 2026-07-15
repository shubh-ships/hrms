export interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  departmentId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  department?: {
    name: string;
    alias: string;
  };
  profile?: {
    firstName: string;
    lastName?: string;
    role?: string;
  };
  role?: string;
  status?: "Active" | "Inactive" | "Pending";
  lastLogin?: string;
  efficiency?: string;
  fraudFlag?: "Flagged" | "Clean" | null;
}
 
export interface CreateUserRequest {
  name: string;
  email: string;
  phoneNumber: string;
  departmentId: string;
  role: string;
}
 
export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phoneNumber?: string;
  departmentId?: string;
  role?: string;
}
 
export interface UserListResponse {
  success: boolean;
  message: string;
  data: {
    users: User[];
    totalCount: number;
    page: number;
    limit: number;
  };
}
 
export interface UserResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token?: string;
  };
}
 
export interface UsersResponse {
  success: boolean;
  message: string;
  data: {
    users: User[];
  };
}
 
 