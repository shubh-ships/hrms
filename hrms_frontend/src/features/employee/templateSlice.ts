import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "@/lib/api/client";

interface Template {
  _id: string;
  name: string;
}

interface TemplateState {
  leaveTemplates: Template[];
  shiftTemplates: Template[];
  holidayTemplates: Template[];
  weeklyOffTemplates: Template[];
  attendanceOnWeekOffTemplates: Template[];
  attendanceOnHolidayTemplates: Template[];
  loading: boolean;
  error: string | null;
}

const initialState: TemplateState = {
  leaveTemplates: [],
  shiftTemplates: [],
  holidayTemplates: [],
  weeklyOffTemplates: [],
  attendanceOnWeekOffTemplates: [],
  attendanceOnHolidayTemplates: [],
  loading: false,
  error: null,
};


export const fetchAllTemplates = createAsyncThunk(
  "templates/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get("/employee/all/templates");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue("Failed to fetch all templates");
    }
  }
);

const templateSlice = createSlice({
  name: "templates",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllTemplates.fulfilled, (state, action) => {
        state.loading = false;
        const {
          leaveTemplates,
          shiftTemplates,
          holidayTemplates,
          weekOffTemplates,
          attendanceOnWeekOffTemplates,
          attendanceOnHolidayTemplates,
        } = action.payload;

        state.leaveTemplates = leaveTemplates || [];
        state.shiftTemplates = shiftTemplates || [];
        state.holidayTemplates = holidayTemplates || [];
        state.weeklyOffTemplates = weekOffTemplates || [];
        state.attendanceOnWeekOffTemplates = attendanceOnWeekOffTemplates || [];
        state.attendanceOnHolidayTemplates = attendanceOnHolidayTemplates || [];
      })
      .addCase(fetchAllTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default templateSlice.reducer;
