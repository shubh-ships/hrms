
export interface AttendanceDay {
  attendanceId: string;
  date: string;
  loginTime: string | null;
  logoutTime: string | null;
  sealTime: string | null;
}

export interface MonthlyAttendanceData {
  days: AttendanceDay[];
  totalDays: number;
  month: string;
}

export interface AttendanceResponse {
  success: boolean;
  message: string;
  data: MonthlyAttendanceData[];
}

export interface AttendanceStats {
  presentDays: number;
  totalWorkingDays: number;
  attendanceAverage: number;
  month: string;
}
export interface Attendance {
  id: string;
  userId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'holiday' | 'early-departure';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAttendanceRequest {
  userId: string;
  date: string;
  loginTime?: string;
  logoutTime?: string;
  status?: string;
}


export interface UpdateAttendanceRequest {

  loginTime?: string;
  logoutTime?: string;
  status?: string;
}

export interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  holiday: number;
  earlyDeparture: number;
  averageHours: number;
  totalWorkingDays: number;
  attendancePercentage: number;
}

export interface MonthlyUserAttendacne {
  month: string; // e.g., "September 2025"
  days: MonthlyAttendance[];
}

export interface MonthlyAttendance {
  date: string;
  attendance: Attendance | null;
}

export interface AttendanceState {
  attendance: Attendance | null;
  allAttendance: Attendance[];
  monthlyAttendance: MonthlyAttendance[];
  stats: AttendanceStats | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}