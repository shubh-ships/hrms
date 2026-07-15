import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../lib/api/client";
import { MusterRollItem } from "@/components/dashboard/ViewAllDashboards/Hrms/DashboardUI/MusterRollTable";

interface MusterRollState {
  items: MusterRollItem[];
  loading: boolean;
  error: string | null;
}

const initialState: MusterRollState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchMonthlyMusterRoll = createAsyncThunk(
  "musterRoll/fetchMonthly",
  async ({ month, year, date }: { month: number; year: number; date?: string }, { rejectWithValue }) => {
    try {
      // Step 1: Get the list of all employees (with today's daily status)
      const dateStr = date || `${year}-${String(month).padStart(2, "0")}-01`;
      const response = await axiosClient.get(`/facescan/detail?date=${dateStr}`);
      let employees: any[] = response.data.data || [];

      // Deduplicate employees to resolve duplicate React keys
      const uniqueIds = new Set();
      employees = employees.filter((emp: any) => {
        const id = emp.userId || emp.employeeId;
        if (!id || uniqueIds.has(id)) return false;
        uniqueIds.add(id);
        return true;
      });

      // Step 2: Fetch monthly summaries for ALL employees in parallel
      // Use userId (User ObjectID), NOT employeeId — /facescan/monthly/:userId expects User ID
      // Skip employees with no userId (orphaned employee records)
      const monthlyResults = await Promise.allSettled(
        employees.map((emp: any) =>
          emp.userId
            ? axiosClient.get(`/facescan/monthly/${emp.userId}?month=${month}&year=${year}`)
            : Promise.resolve(null)   // no userId → skip, summary stays as "-"
        )
      );

      // Step 3: Build the final Muster Roll items with pre-filled monthly summary
      const transformedData: MusterRollItem[] = employees.map((emp: any, i: number) => {
        const result = monthlyResults[i];
        const summary =
          result.status === "fulfilled" && result.value
            ? result.value.data.data.summary
            : null;

        return {
          id: emp.userId || emp.employeeId,  // fallback to employeeId if userId is missing
          staffName: emp.name,
          staffInitials: emp.name
            ? emp.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
            : "?",
          staffImage: "",
          present: summary?.present ?? "-",
          absent: summary?.absent ?? "-",
          halfDay: summary?.halfDay ?? "-",
          paidLeave: summary?.paidLeave ?? "-",
          unmarked: summary?.notMarked ?? "-",
          overtime: summary?.overtime
            ? `${summary.overtime.hours}h ${summary.overtime.minutes}m`
            : "-",
          fine: summary?.fine
            ? `${summary.fine.hours}h ${summary.fine.minutes}m`
            : "-",
          dailyAttendance: [],
        };
      });

      return transformedData;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch Muster Roll");
    }
  }
);

export const fetchEmployeeMonthlyData = createAsyncThunk(
  "musterRoll/fetchEmployeeDetails",
  async ({ userId, month, year }: { userId: string, month: number, year: number }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get(`/facescan/monthly/${userId}?month=${month}&year=${year}`);
      const { summary, dailyDetails } = response.data.data;

      return {
        userId,
        summary,
        dailyDetails: dailyDetails.map((day: any) => ({
          date: new Date(day.date).getDate(),
          day: day.dayName?.charAt(0) || "-",
          workingHours: day.totalWorkMinutes > 0
            ? `${Math.floor(day.totalWorkMinutes / 60)}h ${day.totalWorkMinutes % 60}m`
            : "-",
          status: day.status === "PRESENT" ? "P" : (day.status === "ABSENT" ? "A" : (day.status === "HALF_DAY" ? "H" : (day.status === "PAID_LEAVE" ? "PL" : "-"))),
          ot: day.overtimeMinutes > 0 ? `${Math.floor(day.overtimeMinutes / 60)}:${(day.overtimeMinutes % 60).toString().padStart(2, '0')}` : "-",
          l: day.fineMinutes > 0 ? `${Math.floor(day.fineMinutes / 60)}:${(day.fineMinutes % 60).toString().padStart(2, '0')}` : "-"
        }))
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch employee details");
    }
  }
);

const musterRollSlice = createSlice({
  name: "musterRoll",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMonthlyMusterRoll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMonthlyMusterRoll.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchMonthlyMusterRoll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchEmployeeMonthlyData.fulfilled, (state, action) => {
        const { userId, summary, dailyDetails } = action.payload;
        const item = state.items.find((i) => i.id === userId);
        if (item) {
          item.dailyAttendance = dailyDetails;
          item.present = summary.present || "-";
          item.absent = summary.absent || "-";
          item.halfDay = summary.halfDay || "-";
          item.paidLeave = summary.paidLeave || "-";
          item.unmarked = summary.notMarked || "-";
          item.overtime = summary.overtime ? `${summary.overtime.hours}h ${summary.overtime.minutes}m` : "-";
          item.fine = summary.fine ? `${summary.fine.hours}h ${summary.fine.minutes}m` : "-";
        }
      });
  },
});

export default musterRollSlice.reducer;
