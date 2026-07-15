"use client";

import React, { useEffect, useState } from "react";
import { useAttendance } from "@/hooks/useAttendance";
import { format, parseISO } from "date-fns";
import type {
  AttendanceDay,
  MonthlyAttendanceData,
  AttendanceResponse,
} from "@/lib/types/api/attendance";

const DailyAttendance: React.FC = () => {
  const { monthlyAttendance, fetchMonthlyUserAttendance, loading, error } =
    useAttendance();

  const [selectedMonth, setSelectedMonth] = useState<MonthlyAttendanceData | null>(null);
  const [currentDate] = useState(new Date());

  useEffect(() => {
    fetchMonthlyUserAttendance();
  }, [fetchMonthlyUserAttendance]);

  useEffect(() => {
    if (monthlyAttendance) {
      let attendanceData: MonthlyAttendanceData[] = [];
      
      const isAttendanceResponse = (val: any): val is AttendanceResponse =>
        val && typeof val === 'object' && 'data' in val && Array.isArray((val as any).data);

      if (isAttendanceResponse(monthlyAttendance)) {
        attendanceData = monthlyAttendance.data;
      } else if (Array.isArray(monthlyAttendance)) {
        const arr = monthlyAttendance as any[];
        // If items already match MonthlyAttendanceData shape, use directly, otherwise map to required shape
        if (arr.length > 0 && arr[0] && 'days' in arr[0] && 'totalDays' in arr[0] && 'month' in arr[0]) {
          attendanceData = arr as MonthlyAttendanceData[];
        } else {
          attendanceData = arr.map((item: any) => ({
            month: item.month ?? item.name ?? "",
            totalDays: item.totalDays ?? item.total_days ?? 0,
            days: item.days ?? item.attendances ?? [],
          })) as MonthlyAttendanceData[];
        }
      }
      
      if (attendanceData.length > 0) {
        const currentMonth =
          attendanceData.find(
            (month: MonthlyAttendanceData) => month.month === format(currentDate, "MMMM yyyy")
          ) || attendanceData[0];

        setSelectedMonth(currentMonth);
      }
    }
  }, [monthlyAttendance, currentDate]);

  const formatTime = (timeString: string | null): string => {
    if (!timeString) return "-";
    try {
      const normalizedTimeString = timeString.replace(/(\+|\-)(\d{2})(\d{2})$/, '$1$2:$3');
      const date = parseISO(normalizedTimeString);
      return format(date, "hh:mm a");
    } catch {
      return "-";
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), "EEEE, MMMM dd, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const getStatus = (day: AttendanceDay): string => {
    if (!day.loginTime) return "Absent";
    if (!day.logoutTime) return "Present (Not logged out)";
    return "Present";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-800";
      case "Present (Not logged out)":
        return "bg-yellow-100 text-yellow-800";
      case "Absent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading attendance data...</div>;
  }
  
  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }

  // Extract data properly for the condition check
      let attendanceData: MonthlyAttendanceData[] = [];
    
      const isAttendanceResponse = (val: any): val is AttendanceResponse =>
        val && typeof val === "object" && "data" in val && Array.isArray((val as any).data);
    
      if (monthlyAttendance) {
        if (isAttendanceResponse(monthlyAttendance)) {
          attendanceData = monthlyAttendance.data;
        } else if (Array.isArray(monthlyAttendance)) {
          const arr = monthlyAttendance as any[];
          // If items already match MonthlyAttendanceData shape, use directly, otherwise map to required shape
          if (
            arr.length > 0 &&
            arr[0] &&
            "days" in arr[0] &&
            "totalDays" in arr[0] &&
            "month" in arr[0]
          ) {
            attendanceData = arr as MonthlyAttendanceData[];
          } else {
            attendanceData = arr.map((item: any) => ({
              month: item.month ?? item.name ?? "",
              totalDays: item.totalDays ?? item.total_days ?? 0,
              days: item.days ?? item.attendances ?? [],
            })) as MonthlyAttendanceData[];
          }
        }
      }

  if (!attendanceData || attendanceData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No attendance records found for this period.
      </div>
    );
  }

return (
  <div className="container mx-auto p-4 transition-colors bg-gray-50 dark:bg-[#1e293b] min-h-screen">
    <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Task Monthly Attendance</h1>

    {selectedMonth && (
      <>
        <div className="rounded-lg shadow-md p-6 mb-6 bg-white dark:bg-[#222b3f] dark:shadow-none">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
            {selectedMonth.month}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-[#263759] p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Days</h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedMonth.totalDays}</p>
            </div>
            <div className="bg-green-50 dark:bg-[#254d40] p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Present Days</h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {selectedMonth.days.filter((day) => day.loginTime).length}
              </p>
            </div>
            <div className="bg-yellow-50 dark:bg-[#595226] p-4 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Incomplete Days</h3>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {selectedMonth.days.filter((day) => day.loginTime && !day.logoutTime).length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg shadow-md overflow-hidden bg-white dark:bg-[#222b3f] dark:shadow-none">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-[#29344a]">
                <tr>
                  {["Date", "Login Time", "Logout Time", "Status"].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#222b3f] divide-y divide-gray-200 dark:divide-gray-800">
                {selectedMonth.days.map((day) => {
                  const status = getStatus(day);
                  return (
                    <tr key={day.attendanceId} className="hover:bg-gray-50 dark:hover:bg-[#29344a]">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(day.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatTime(day.loginTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatTime(day.logoutTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )}

    {!selectedMonth && !loading && (
      <div className="text-center py-8 text-gray-500 dark:text-gray-300">
        No attendance records found for this period.
      </div>
    )}
  </div>
);

};

export default DailyAttendance;