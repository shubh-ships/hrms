export interface User {
  _id: string
  name: string
  email: string
  phoneNumber: string
  role: "ADMIN" | "MANAGER" | "MEMBER"
  department?: {
    _id: string
    name: string
    alias: string
  }
  status?: "Active" | "Inactive" | "Pending"
  [key: string]: any
}
 
export interface CreateUserRequest {
  name: string
  email: string
  phoneNumber: string
  role: "ADMIN" | "MANAGER" | "MEMBER"
  departmentId: string
}
 
export interface UpdateUserRequest {
  name?: string
  email?: string
  phoneNumber?: string
  role?: "ADMIN" | "MANAGER" | "MEMBER"
  departmentId?: string
  status?: "Active" | "Inactive" | "Pending"
  isActive?: boolean
  user_id?: string
}
 
export interface UserResponse {
  data: {
    user: User
  }
  message?: string
}
 
export interface UsersResponse {
  data: {
    users: User[]
  }
  message?: string
}
 
 