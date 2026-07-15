export interface TaskAssignment {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'stuck';
  assignedTo: string;
  assignedBy: string;
  departmentId: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskAssignmentDto {
  title: string;
  description: string;
  assignedTo: string;
  departmentId: string;
  dueDate: string;
}

export interface UpdateTaskAssignmentDto extends Partial<CreateTaskAssignmentDto> {
  status?: 'pending' | 'in_progress' | 'completed' | 'stuck';
}