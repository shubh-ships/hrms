import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from '../../lib/api/client';

interface Proof {
  field_name: string;
  proof_type: string;
  url: string;
  public_id?: string;
  original_name: string;
  size?: number;
}

interface Submission {
  id: string;
  department_id: string;
  submitted_by_user_id: string;
  task_assign_id: string;
  submission_data: Proof[];
  comment?: string;
 reason?: { message: string }; 
  ETAT: number;
  status: 'submitted' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface SubmissionState {
  submissions: Submission[];
  departmentSubmissions: Submission[];
  currentSubmission: Submission | null;
  loading: boolean;
  error: string | null;
}

const initialState: SubmissionState = {
  submissions: [],
  departmentSubmissions: [],
  currentSubmission: null,
  loading: false,
  error: null,
};

export const createSubmission = createAsyncThunk(
  'submissions/create',
  async (submissionData: {
    assignmentId: string;
    proofs: Record<string, { 
      type: 'url' | 'file';
      value: string | File;
    }>;
    comment?: string;
    reason?: string;
  }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      
      
      formData.append('assignmentId', submissionData.assignmentId);
      if (submissionData.comment) formData.append('comment', submissionData.comment);
    if (submissionData.reason) {
        formData.append('reason', submissionData.reason);
      }


    
      Object.entries(submissionData.proofs).forEach(([fieldName, proof]) => {
        if (proof.type === 'url') {
          
          formData.append(fieldName, proof.value as string);
        } else if (proof.type === 'file' && proof.value instanceof File) {
        
          formData.append(fieldName, proof.value);
        }
      });

      const response = await axiosClient.post('/submission', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        transformRequest: (data) => data,
      });

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create submission');
    }
  }
);

export const fetchSubmissionsByUser = createAsyncThunk(
  'submissions/fetchByUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get('/submission/user');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user submissions');
    }
  }
);

export const fetchDepartmentSubmissions = createAsyncThunk(
  'submissions/fetchDepartment',
  async (departmentId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/submission/department/${departmentId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch department submissions');
    }
  }
);

export const fetchSubmissionById = createAsyncThunk(
  'submissions/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/submission/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch submission');
    }
  }
);

export const fetchSubmissionByTaskAssignment = createAsyncThunk(
  'submissions/fetchByTaskAssignment',
  async (taskAssignmentId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/submission/task-assignment/${taskAssignmentId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch submission by task assignment');
    }
  }
);

export const updateSubmission = createAsyncThunk(
  'submissions/update',
  async ({ id, updateData }: { id: string; updateData: Partial<Submission> }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.put(`/submission/${id}`, updateData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update submission');
    }
  }
);

export const deleteSubmission = createAsyncThunk(
  'submissions/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`/submission/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete submission');
    }
  }
);

const submissionSlice = createSlice({
  name: 'submissions',
  initialState,
  reducers: {
    setCurrentSubmission: (state, action) => {
      state.currentSubmission = action.payload;
    },
    clearSubmissionError: (state) => {
      state.error = null;
    },
    clearCurrentSubmission: (state) => {
      state.currentSubmission = null;
    },
    clearSubmissions: (state) => {
      state.submissions = [];
      state.departmentSubmissions = [];
    }
  },
  extraReducers: (builder) => {
    builder
    
      .addCase(createSubmission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSubmission.fulfilled, (state, action) => {
        state.loading = false;
        state.submissions.unshift(action.payload);
      })
      .addCase(createSubmission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      
      .addCase(fetchSubmissionsByUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubmissionsByUser.fulfilled, (state, action) => {
        state.loading = false;
        state.submissions = action.payload;
      })
      .addCase(fetchSubmissionsByUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      
      .addCase(fetchDepartmentSubmissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartmentSubmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.departmentSubmissions = action.payload;
      })
      .addCase(fetchDepartmentSubmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      
      .addCase(fetchSubmissionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubmissionById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSubmission = action.payload;
      })
      .addCase(fetchSubmissionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      
      .addCase(fetchSubmissionByTaskAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubmissionByTaskAssignment.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSubmission = action.payload;
      })
      .addCase(fetchSubmissionByTaskAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      
      .addCase(updateSubmission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSubmission.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.submissions.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.submissions[index] = action.payload;
        }
        const deptIndex = state.departmentSubmissions.findIndex(s => s.id === action.payload.id);
        if (deptIndex !== -1) {
          state.departmentSubmissions[deptIndex] = action.payload;
        }
        if (state.currentSubmission?.id === action.payload.id) {
          state.currentSubmission = action.payload;
        }
      })
      .addCase(updateSubmission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      
      .addCase(deleteSubmission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSubmission.fulfilled, (state, action) => {
        state.loading = false;
        state.submissions = state.submissions.filter(s => s.id !== action.payload);
        state.departmentSubmissions = state.departmentSubmissions.filter(s => s.id !== action.payload);
        if (state.currentSubmission?.id === action.payload) {
          state.currentSubmission = null;
        }
      })
      .addCase(deleteSubmission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setCurrentSubmission, 
  clearSubmissionError,
  clearCurrentSubmission,
  clearSubmissions
} = submissionSlice.actions;

export default submissionSlice.reducer;