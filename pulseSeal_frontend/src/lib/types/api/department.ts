 
// export interface Department {
//   _id: string
//   name: string
//   alias: string
//   description?: string
//   category?: string
//   is_active: boolean
//   is_verified: boolean
//   organization_id: string
//   admin_id: string
//   createdAt: string
//   updatedAt: string
//   __v?: number
//

// ADDED: A specific type for the user object inside a member
interface PopulatedUserInMember {
  _id: string;
  name: string;
  email: string;
  departmentId: string;
}

export interface Department {
  _id: string;
  name: string;
  alias: string;
  description?: string;
  category?: string;
  is_active: boolean;
  is_verified: boolean;
  organization_id: string;
  admin_id: string;
  createdAt: string;
  updatedAt: string;
  userCount?: number;
  members?: DepartmentMember[];
  departmentId?:DepartmentID[];
  
}

 
export interface CreateDepartmentRequest {
  name: string
  alias: string
  description?: string
  category?: string
  is_active?: boolean
  is_verified?: boolean
}
 
export interface UpdateDepartmentRequest {
  name?: string
  description?: string
  category?: string
  is_active?: boolean
  is_verified?: boolean
}

export interface DepartmentID {
  departmentId: string;
}
 
export interface DepartmentMember {
  email: any;
  _id: string
  user_id: PopulatedUserInMember;
  role: string
  dep_id: string
 
  organization_id: string
  createdAt: string
  updatedAt: string
}
 
export interface EditDepartmentMembersRequest {
  add?: Array<{
    user_id: string
    role: string
  }>
  remove?: string[]
}
 
export interface DepartmentListResponse {
  success: boolean
  message: string
  data: {
    data: Department[]
    totalCount: number
    page: number
    limit: number
  }
}
 
export interface DepartmentResponse {
  success: boolean
  message: string
  data: Department
}
 
 