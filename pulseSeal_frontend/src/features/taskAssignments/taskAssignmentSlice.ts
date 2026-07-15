import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axiosClient from "../../lib/api/client";
import { RootState } from "@/store/index";
import { jwtDecode } from "jwt-decode";

export interface ProofRequirement {
  fieldName: string;
  type: "url" | "file";
}
interface SubmittedProof {
  type: string;
  url: string;
  fieldName: string;
}
interface User {
  _id: string;
  departmentId: string;
  organizationId: string;
  name: string;
  email: string;
  phoneNumber: number;
  isActive: boolean;
  isFreezed: boolean;
  is_organizer: boolean;
  is_superuser: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  id: string;
}

interface Department {
  _id: string;
  name: string;
  is_active: boolean;
  is_verified: boolean;
  description: string;
  organization_id: string;
  admin_id: string;
  alias: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface BulkTaskAssignmentData {
  assigned_to_employee_id: string;
  department_id?: string;
  taskFile: File;
  priority?: "Low" | "Medium" | "High"; 
}


export interface TaskAssignment {
    stuck_request_status: string;
    _id: string;
    title: string;
    remainingTAT: number;
    description: string;
    priority: 'Low' | 'Medium' | 'High';
    assigned_by_user_id: User;  
    assigned_to_employee_id: User;  
      proof: SubmittedProof[];
    TAT: number;
    deadline: string;
    status: 'Pending' | 'Overdue' | 'Completed';
    timer_status: 'Todo' | 'InProgress' | 'Stuck' | 'Done';
    department_id: Department; 
    previous_TAT?: number[]; 
    createdAt: string;
    updatedAt: string;
    __v: number;
    stuck_request?: boolean;
    stuck_reason?: string;
    timerStartTime?: string;
}
interface TaskAssignmentState {
  assignments: TaskAssignment[];
  dailyAssignments: TaskAssignment[];
  userAssignments: TaskAssignment[];
  assignedByMe: TaskAssignment[];
  previousTasks: TaskAssignment[];
  departmentAssignments: TaskAssignment[];
  stuckRequests: TaskAssignment[];
  tasksByDay: any[];
  loading: boolean;
  error: string | null;
  currentAssignment: TaskAssignment | null;
}

const initialState: TaskAssignmentState = {
  assignments: [],
  userAssignments: [],
  assignedByMe: [],
  dailyAssignments: [],
  stuckRequests: [],
  previousTasks: [],
  departmentAssignments: [],
  tasksByDay: [],
  loading: false,
  error: null,
  currentAssignment: null,
};

interface DecodedToken {
  user: {
    _id: string;
    departmentId: string;
    organizationId: string;
    name: string;
    email: string;
    id: string;
  };
  userRole: string;
  iat: number;
  exp: number;
}

export const fetchTaskAssignments = createAsyncThunk(
  "taskAssignments/fetchAll",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axiosClient.get(`/task-assignment/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch assignments"
      );
    }
  }
);

export const fetchUserDailyTaskAssignments = createAsyncThunk(
  "taskAssignments/fetchUserDailyAssignments",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axiosClient.get(
        `/task-assignment/user-daily-assignments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch daily assignments"
      );
    }
  }
);

export const fetchTodayTaskAssignmentsByUserId = createAsyncThunk(
  "taskAssignments/fetchTodayTaskAssignmentsByUserId",
  async (userId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axiosClient.get(
        `/task-assignment/user-daily-assignments/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch user daily assignments"
      );
    }
  }
);

export const fetchUserTaskAssignments = createAsyncThunk(
  "taskAssignments/fetchUserAssignments",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axiosClient.get(
        `/task-assignment/user-assignment`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch user assignments"
      );
    }
  }
);

export const fetchAssignedByMe = createAsyncThunk(
  "taskAssignments/fetchAssignedByMe",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axiosClient.get(
        `/task-assignment/assignedBy-assignment`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch assignments created by user"
      );
    }
  }
);
export const fetchDepartmentTaskAssignments = createAsyncThunk(
  "taskAssignments/fetchDepartmentAssignments",
  async (departmentId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axiosClient.get(
        `/task-assignment/department-assignments/${departmentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch department assignments"
      );
    }
  }
);

export const fetchStuckRequests = createAsyncThunk(
  "taskAssignments/fetchStuckRequests",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axiosClient.get(
        "/task-assignment/list-stuck-request",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch stuck requests"
      );
    }
  }
);

export const fetchTaskAssignmentById = createAsyncThunk(
  "taskAssignments/fetchById",
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axiosClient.get(`/task-assignment/task/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch assignment"
      );
    }
  }
);

interface CreateTaskAssignmentData {
  title: string;
  description?: string;
  assigned_to_employee_id: string;
  proof: ProofRequirement[];
  TAT: number;
  deadline: string;
  department_id?: string;
  priority?: "Low" | "Medium" | "High";
}

export const createTaskAssignment = createAsyncThunk(
    "taskAssignments/create",
    async (data: CreateTaskAssignmentData, { rejectWithValue, getState }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token || localStorage.getItem("token");

            if (!token) {
                throw new Error("Authentication token not found");
            }

            const decoded = jwtDecode<DecodedToken>(token);
            const departmentId = data.department_id || decoded.user.departmentId;

            if (!departmentId) {
                throw new Error("Department ID not found in token");
            }

            // Ensure deadline has proper format
            const ensureDeadlineFormat = (deadline: string): string => {
                if (!deadline) return '';

                // If it already has the full format, return as-is
                if (deadline.includes(':00+05:30')) {
                    return deadline;
                }

                // If it has timezone but missing seconds
                if (deadline.includes('+05:30') && !deadline.includes(':00+05:30')) {
                    return deadline.replace('+05:30', ':00+05:30');
                }

                // If it's just date-time (from form), add seconds and timezone
                return `${deadline}:00+05:30`;
            };

            const payload: CreateTaskAssignmentData = {
                ...data,
                priority: data.priority || "Low",
                department_id: departmentId,
                deadline: ensureDeadlineFormat(data.deadline), // Ensure proper format
            };

            console.log('Sending to API with deadline:', payload.deadline);

            const response = await axiosClient.post(
                "/task-assignment/assign",
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to create assignment"
            );
        }
    }
);

export const updateTaskAssignment = createAsyncThunk(
  "taskAssignments/update",
  async (
    { id, data }: { id: string; data: Partial<TaskAssignment> },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axiosClient.put(
        `/task-assignment/edit/${id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to update assignment"
      );
    }
  }
);

export const deleteTaskAssignment = createAsyncThunk(
  "taskAssignments/delete",
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      await axiosClient.delete(`/task-assignment/delete/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete assignment"
      );
    }
  }
);

export const changeTimerStatus = createAsyncThunk(
  "taskAssignments/changeTimerStatus",
  async (
    {
      id,
      timer_status,
    }: { id: string; timer_status: "Todo" | "InProgress" | "Stuck" | "Done" },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axiosClient.patch(
        `/task-assignment/change-timer-status/${id}`,
        { timer_status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to change timer status"
      );
    }
  }
);

export const requestStuckStatus = createAsyncThunk(
  "taskAssignments/requestStuckStatus",
  async (
    { id, stuck_reason }: { id: string; stuck_reason: string },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axiosClient.post(
        `/task-assignment/stuck-status-request/${id}`,
        {
          stuck_request: true,
          stuck_reason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to request stuck status"
      );
    }
  }
);

export const respondToStuckRequest = createAsyncThunk(
  "taskAssignments/respondToStuckRequest",
  async (
    { id, stuck_request }: { id: string; stuck_request: boolean },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axiosClient.post(
        `/task-assignment/acceptRejectStuckRequest/${id}`,
        {
          stuck_request,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to respond to stuck request"
      );
    }
  }
);

export const convertToInProgress = createAsyncThunk(
  "taskAssignments/convertToInProgress",
  async (id: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axiosClient.patch(
        `/task-assignment/convertToInProgress/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to convert to in progress"
      );
    }
  }
);

export const bulkTaskAssignments = createAsyncThunk(
  "taskAssignments/bulkUpload",
  async (data: BulkTaskAssignmentData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const formData = new FormData();
      formData.append("taskFile", data.taskFile);
      formData.append("assigned_to_employee_id", data.assigned_to_employee_id);
      if (data.department_id) {
        formData.append("department_id", data.department_id);
      }
      if (data.priority) {
         formData.append("priority", data.priority); 
      }


      const response = await axiosClient.post(
        "/task-assignment/bulk-task-assignments",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to upload bulk tasks"
      );
    }
  }
);

export const fetchPreviousTasks = createAsyncThunk(
  "taskAssignments/fetchPreviousTasks",
  async (query: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      if (!query || query.trim() === "") {
        throw new Error("Search title is required");
      }

      const response = await axiosClient.get(
        `/task-assignment/get-previous-tasks?query=${encodeURIComponent(
          query
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch previous tasks"
      );
    }
  }
);
export const changeDeadline = createAsyncThunk(
  "taskAssignments/changeDeadline",
  async ({ id }: { id: string }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axiosClient.patch(
        `/task-assignment/changeDeadline/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to change deadline"
      );
    }
  }
);

export const fetchUserDailyTasks = createAsyncThunk(
  "taskAssignments/fetchUserDailyTasks",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.token || localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axiosClient.get("/task-assignment/daily", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch daily grouped tasks"
      );
    }
  }
);

const taskAssignmentSlice = createSlice({
  name: "taskAssignments",
  initialState,
  reducers: {
    clearCurrentAssignment: (state: TaskAssignmentState) => {
      state.currentAssignment = null;
    },
    resetTaskAssignmentState: () => initialState,

    // upsertTask — typed and inside reducers
    upsertTask: (
      state: TaskAssignmentState,
      action: PayloadAction<TaskAssignment>
    ) => {
      const task = action.payload;
      if (!task || !task._id) return;

      const upsertIntoList = (list: TaskAssignment[]) => {
        const idx = list.findIndex((t) => t._id === task._id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...task };
        } else {
          // prepend so UI sees it quickly; change to push(...) if you prefer append
          list.unshift(task);
        }
      };

      upsertIntoList(state.assignments);
      upsertIntoList(state.userAssignments);
      upsertIntoList(state.assignedByMe);
      upsertIntoList(state.departmentAssignments);
      upsertIntoList(state.dailyAssignments);
      upsertIntoList(state.previousTasks);
      // keep stuckRequests in sync (same logic as upsertTask)
      const stuckIdx = state.stuckRequests.findIndex(
        (t) => t._id === action.payload._id
      );

      if (action.payload.stuck_request) {
        if (stuckIdx !== -1) {
          state.stuckRequests[stuckIdx] = action.payload;
        } else {
          state.stuckRequests.unshift(action.payload);
        }
      } else if (stuckIdx !== -1 && !action.payload.stuck_request) {
        state.stuckRequests.splice(stuckIdx, 1);
      }

      // update currentAssignment if it matches
      if (state.currentAssignment && state.currentAssignment._id === task._id) {
        state.currentAssignment = { ...state.currentAssignment, ...task };
      }
    },
  },

  extraReducers: (builder) => {
    builder

      .addCase(fetchTaskAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchTaskAssignments.fulfilled,
        (state, action: PayloadAction<TaskAssignment[]>) => {
          state.loading = false;
          state.assignments = action.payload;
        }
      )
      .addCase(fetchTaskAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchUserTaskAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchUserTaskAssignments.fulfilled,
        (state, action: PayloadAction<TaskAssignment[]>) => {
          state.loading = false;
          state.userAssignments = action.payload;
        }
      )
      .addCase(fetchUserTaskAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchAssignedByMe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAssignedByMe.fulfilled,
        (state, action: PayloadAction<TaskAssignment[]>) => {
          state.loading = false;
          state.assignedByMe = action.payload;
        }
      )
      .addCase(fetchAssignedByMe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchStuckRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchStuckRequests.fulfilled,
        (state, action: PayloadAction<TaskAssignment[]>) => {
          state.loading = false;
          state.stuckRequests = action.payload;
        }
      )
      .addCase(fetchStuckRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPreviousTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPreviousTasks.fulfilled,
        (state, action: PayloadAction<TaskAssignment[]>) => {
          state.loading = false;
          state.previousTasks = action.payload;
        }
      )
      .addCase(fetchPreviousTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(changeDeadline.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        changeDeadline.fulfilled,
        (state, action: PayloadAction<TaskAssignment>) => {
          state.loading = false;

          const assignmentIndex = state.assignments.findIndex(
            (a) => a._id === action.payload._id
          );
          if (assignmentIndex !== -1) {
            state.assignments[assignmentIndex] = action.payload;
          }

          const userAssignmentIndex = state.userAssignments.findIndex(
            (a) => a._id === action.payload._id
          );
          if (userAssignmentIndex !== -1) {
            state.userAssignments[userAssignmentIndex] = action.payload;
          }

          // update assignedByMe
          const assignedByMeIndex = state.assignedByMe.findIndex(
            (a) => a._id === action.payload._id
          );
          if (assignedByMeIndex !== -1) {
            state.assignedByMe[assignedByMeIndex] = action.payload;
          }

          // update departmentAssignments
          const departmentAssignmentIndex =
            state.departmentAssignments.findIndex(
              (a) => a._id === action.payload._id
            );
          if (departmentAssignmentIndex !== -1) {
            state.departmentAssignments[departmentAssignmentIndex] =
              action.payload;
          }

          if (
            state.currentAssignment &&
            state.currentAssignment._id === action.payload._id
          ) {
            state.currentAssignment = action.payload;
          }
        }
      )
      .addCase(changeDeadline.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchDepartmentTaskAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchDepartmentTaskAssignments.fulfilled,
        (state, action: PayloadAction<TaskAssignment[]>) => {
          state.loading = false;
          state.departmentAssignments = action.payload;
        }
      )
      .addCase(fetchDepartmentTaskAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUserDailyTaskAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchUserDailyTaskAssignments.fulfilled,
        (state, action: PayloadAction<TaskAssignment[]>) => {
          state.loading = false;
          state.dailyAssignments = action.payload;
        }
      )
      .addCase(fetchUserDailyTaskAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchTaskAssignmentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchTaskAssignmentById.fulfilled,
        (state, action: PayloadAction<TaskAssignment>) => {
          state.loading = false;
          state.currentAssignment = action.payload;
        }
      )
      .addCase(fetchTaskAssignmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchTodayTaskAssignmentsByUserId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchTodayTaskAssignmentsByUserId.fulfilled,
        (state, action: PayloadAction<TaskAssignment[]>) => {
          state.loading = false;
          state.dailyAssignments = action.payload;
        }
      )
      .addCase(fetchTodayTaskAssignmentsByUserId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createTaskAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createTaskAssignment.fulfilled,
        (state, action: PayloadAction<TaskAssignment>) => {
          state.loading = false;
          state.assignments.push(action.payload);
          state.assignedByMe.push(action.payload);
        }
      )
      .addCase(createTaskAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(updateTaskAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateTaskAssignment.fulfilled,
        (state, action: PayloadAction<TaskAssignment>) => {
          state.loading = false;

          const assignmentIndex = state.assignments.findIndex(
            (a) => a._id === action.payload._id
          );
          if (assignmentIndex !== -1) {
            state.assignments[assignmentIndex] = action.payload;
          }

          const userAssignmentIndex = state.userAssignments.findIndex(
            (a) => a._id === action.payload._id
          );
          if (userAssignmentIndex !== -1) {
            state.userAssignments[userAssignmentIndex] = action.payload;
          }

          const assignedByMeIndex = state.assignedByMe.findIndex(
            (a) => a._id === action.payload._id
          );
          if (assignedByMeIndex !== -1) {
            state.assignedByMe[assignedByMeIndex] = action.payload;
          }

          const departmentAssignmentIndex =
            state.departmentAssignments.findIndex(
              (a) => a._id === action.payload._id
            );
          if (departmentAssignmentIndex !== -1) {
            state.departmentAssignments[departmentAssignmentIndex] =
              action.payload;
          }

          if (
            state.currentAssignment &&
            state.currentAssignment._id === action.payload._id
          ) {
            state.currentAssignment = action.payload;
          }
        }
      )
      .addCase(updateTaskAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(deleteTaskAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteTaskAssignment.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.assignments = state.assignments.filter(
            (a) => a._id !== action.payload
          );
          state.userAssignments = state.userAssignments.filter(
            (a) => a._id !== action.payload
          );
          state.assignedByMe = state.assignedByMe.filter(
            (a) => a._id !== action.payload
          );
          state.departmentAssignments = state.departmentAssignments.filter(
            (a) => a._id !== action.payload
          );

          if (
            state.currentAssignment &&
            state.currentAssignment._id === action.payload
          ) {
            state.currentAssignment = null;
          }
        }
      )
      .addCase(deleteTaskAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(changeTimerStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        changeTimerStatus.fulfilled,
        (state, action: PayloadAction<TaskAssignment>) => {
          state.loading = false;

          const userAssignmentIndex = state.userAssignments.findIndex(
            (a) => a._id === action.payload._id
          );
          if (userAssignmentIndex !== -1) {
            state.userAssignments[userAssignmentIndex] = action.payload;
          }

          if (
            state.currentAssignment &&
            state.currentAssignment._id === action.payload._id
          ) {
            state.currentAssignment = action.payload;
          }
        }
      )
      .addCase(changeTimerStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(requestStuckStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        requestStuckStatus.fulfilled,
        (state, action: PayloadAction<TaskAssignment>) => {
          state.loading = false;

          const userAssignmentIndex = state.userAssignments.findIndex(
            (a) => a._id === action.payload._id
          );
          if (userAssignmentIndex !== -1) {
            state.userAssignments[userAssignmentIndex] = action.payload;
          }

          if (
            state.currentAssignment &&
            state.currentAssignment._id === action.payload._id
          ) {
            state.currentAssignment = action.payload;
          }
        }
      )
      .addCase(requestStuckStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(respondToStuckRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        respondToStuckRequest.fulfilled,
        (state, action: PayloadAction<TaskAssignment>) => {
          state.loading = false;

          const assignedByMeIndex = state.assignedByMe.findIndex(
            (a) => a._id === action.payload._id
          );
          if (assignedByMeIndex !== -1) {
            state.assignedByMe[assignedByMeIndex] = action.payload;
          }

          const departmentAssignmentIndex =
            state.departmentAssignments.findIndex(
              (a) => a._id === action.payload._id
            );
          if (departmentAssignmentIndex !== -1) {
            state.departmentAssignments[departmentAssignmentIndex] =
              action.payload;
          }
        }
      )
      .addCase(respondToStuckRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(bulkTaskAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        bulkTaskAssignments.fulfilled,
        (state, action: PayloadAction<TaskAssignment[]>) => {
          state.loading = false;
          state.assignments = [...state.assignments, ...action.payload];
          state.assignedByMe = [...state.assignedByMe, ...action.payload];
        }
      )
      .addCase(bulkTaskAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(convertToInProgress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        convertToInProgress.fulfilled,
        (state, action: PayloadAction<TaskAssignment>) => {
          state.loading = false;

          const userAssignmentIndex = state.userAssignments.findIndex(
            (a) => a._id === action.payload._id
          );
          if (userAssignmentIndex !== -1) {
            state.userAssignments[userAssignmentIndex] = action.payload;
          }

          if (
            state.currentAssignment &&
            state.currentAssignment._id === action.payload._id
          ) {
            state.currentAssignment = action.payload;
          }
        }
      )
      .addCase(convertToInProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUserDailyTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchUserDailyTasks.fulfilled,
        (state, action: PayloadAction<any[]>) => {
          state.loading = false;
          state.tasksByDay = action.payload;
        }
      )
      .addCase(fetchUserDailyTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentAssignment, resetTaskAssignmentState, upsertTask } =
  taskAssignmentSlice.actions;

export const selectAllTaskAssignments = (state: RootState) =>
  state.taskAssignments.assignments;
export const selectUserTaskAssignments = (state: RootState) =>
  state.taskAssignments.userAssignments;
export const selectAssignedByMe = (state: RootState) =>
  state.taskAssignments.assignedByMe;
export const selectDepartmentTaskAssignments = (state: RootState) =>
  state.taskAssignments.departmentAssignments;
export const selectTaskAssignmentLoading = (state: RootState) =>
  state.taskAssignments.loading;
export const selectTaskAssignmentError = (state: RootState) =>
  state.taskAssignments.error;
export const selectCurrentTaskAssignment = (state: RootState) =>
  state.taskAssignments.currentAssignment;
export const selectDailyTaskAssignments = (state: RootState) =>
  state.taskAssignments.dailyAssignments;
export const selectTodayTaskAssignmentsByUserId = (state: RootState) =>
  state.taskAssignments.dailyAssignments;
export const selectStuckRequests = (state: RootState) =>
  state.taskAssignments.stuckRequests;
export const selectChangeDeadlineLoading = (state: RootState) =>
  state.taskAssignments.loading;
export const selectPreviousTasks = (state: RootState) =>
  state.taskAssignments.previousTasks;
export const selectTasksByDay = (state: RootState) =>
  state.taskAssignments.tasksByDay;

export default taskAssignmentSlice.reducer;
