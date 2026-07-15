"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Settings,
  ListRestart,
  ArrowLeft,
  ChevronRight as ChevronRightIcon,
  Calendar as CalendarIcon,
  Clock,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subMonths, addMonths } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  fetchMonthlyAttendanceSummary,
  selectMonthlyAttendanceSummary,
  selectNewAttendanceLoading,
  selectNewAttendanceError,
  fetchAttendanceByDate,
  selectSelectedDateAttendance,
  selectDateLoading
} from "@/features/newAttendance/newAttendanceSlice";
import { fetchEmployees, selectEmployees } from "@/features/employee/employeeSlice";

/**
 * AttendancePage Component
 * 
 * Displays the monthly attendance summary, statistics, and daily logs.
 * Integrated with NewAttendance Redux APIs.
 */
const AttendancePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Get current user and attendance data from Redux
  const { user } = useSelector((state: RootState) => state.auth);
  const monthlyData = useSelector(selectMonthlyAttendanceSummary);
  const loading = useSelector(selectNewAttendanceLoading);
  const error = useSelector(selectNewAttendanceError);

  const employees = useSelector(selectEmployees);
  const selectedDateAttendance = useSelector(selectSelectedDateAttendance);
  const dateLoading = useSelector(selectDateLoading);

  // Resolve employeeId (User ID != Employee ID for some staff)
  const employeeId = React.useMemo(() => {
    if (!user || !employees?.length) return null;
    
    // Try matching by multiple identity fields
    const me = employees.find(emp => 
      emp.email === user.email || // The getEmployees API returns a flattened 'email' field
      emp.userId === user.id || 
      emp.userId === user._id ||
      emp.userId?._id === user.id || 
      emp.user?.id === user.id ||
      emp.user?._id === user.id ||
      emp._id === user.id ||
      emp.personal?.email === user.email
    );

    return me?._id || me?.id || null;
  }, [employees, user]);

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  // Fetch monthly summary when ID or month changes
  useEffect(() => {
    if (employeeId) {
      dispatch(fetchMonthlyAttendanceSummary({
        employeeId,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        organizationId: user?.organizationId
      }));
    }
  }, [dispatch, currentDate, employeeId, user?.organizationId]);

  // Fetch detailed attendance when a specific date is selected
  useEffect(() => {
    if (selectedRecord?.raw?.attendanceDate && employeeId) {
      dispatch(fetchAttendanceByDate({
        employeeId,
        date: selectedRecord.raw.attendanceDate
      }));
    }
  }, [dispatch, selectedRecord, employeeId]);

  // Loading state for ID resolution
  if (!employeeId && !loading && employees?.length === 0) {
    // Still waiting for employees to load or none found
  }

  // Statistics derived from API summary
  // Statistics derived from API summary
  const stats = [
    { label: "Present", value: monthlyData?.summary?.present?.toString() || "0" },
    { label: "Absent", value: monthlyData?.summary?.absent?.toString() || "0" },
    { label: "Half Day", value: monthlyData?.summary?.halfDay?.toString() || "0" },
    { label: "Leaves", value: monthlyData?.summary?.onLeave?.toString() || "0" },
    { label: "Fine", value: monthlyData?.summary?.fine?.minutes > 0 ? `${Math.floor(monthlyData.summary.fine.minutes / 60)}:${(monthlyData.summary.fine.minutes % 60).toString().padStart(2, '0')}` : "0:00" },
    { label: "Overtime", value: monthlyData?.summary?.overTime?.minutes > 0 ? `${Math.floor(monthlyData.summary.overTime.minutes / 60)}:${(monthlyData.summary.overTime.minutes % 60).toString().padStart(2, '0')}` : "0:00" },
  ];

  // Map API items to UI list format (Matching Admin skeleton logic)
  const attendanceData = React.useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const entries: any[] = [];

    // 1. Create skeleton for all days up to today (or end of month)
    const limit = (year === today.getFullYear() && month === today.getMonth()) ? today.getDate() : totalDays;

    const todayStr = format(new Date(), "yyyy-MM-dd");

    for (let i = 1; i <= limit; i++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const dateObj = new Date(year, month, i);
      
      entries.push({
        date: format(dateObj, "dd MMM | EEE"),
        day: format(dateObj, "EEEE"),
        status: "Not Marked",
        time: "",
        variance: "",
        statusColor: "text-[#9CA3AF]",
        varianceColor: "text-gray-400",
        isToday,
        raw: { attendanceDate: dateStr, attendanceType: "NOT_MARKED" }
      });
    }

    // 2. Overlay actual API data
    if (monthlyData?.items) {
      monthlyData.items.forEach((item: any) => {
        // Use split to avoid UTC shift
        const parts = item.attendanceDate.split('-');
        const d = parseInt(parts[2]);
        const m = parseInt(parts[1]) - 1;
        const y = parseInt(parts[0]);

        if (y !== year || m !== month) return;

        const entryIdx = entries.findIndex(e => parseInt(e.date.split(' ')[0]) === d);
        if (entryIdx === -1) return;

        const mainAtt = item.attendance?.[0];
        
        // IST Time Format Helper
        const formatIST = (dateStr: string) => {
          if (!dateStr) return "";
          return format(new Date(dateStr), "hh:mm a");
        };

        let statusText = item.attendanceType === 'PRESENT' ? 'Present' :
          item.attendanceType === 'ABSENT' ? 'Absent' :
          item.attendanceType === 'HALF_DAY' ? 'Half Day' :
          item.attendanceType === 'WEEK_OFF' ? 'Weekly Off' :
          item.attendanceType === 'HOLIDAY' ? 'Paid Holiday' :
          item.attendanceType === 'LEAVE' ? `Leave | ${item.leaveName || ''}` : 'Not Marked';

        let timeText = "";
        if (mainAtt?.inTime) {
          timeText = `${formatIST(mainAtt.inTime)} - ${mainAtt.outTime ? formatIST(mainAtt.outTime) : ""}`;
        }

        let varianceText = "";
        if (item.overtimes?.minutes > 0) {
          varianceText = `[+ ${Math.floor(item.overtimes.minutes / 60)}:${(item.overtimes.minutes % 60).toString().padStart(2, '0')} Hrs]`;
        } else if (item.fine?.minutes > 0) {
          varianceText = `[- ${Math.floor(item.fine.minutes / 60)}:${(item.fine.minutes % 60).toString().padStart(2, '0')} Hrs]`;
        }

        let statusColor = "text-[#1F2937]"; // Default dark for Present/Leave
        if (item.attendanceType === 'ABSENT') statusColor = "text-red-500 font-bold";
        if (item.attendanceType === 'WEEK_OFF' || item.attendanceType === 'NOT_MARKED') statusColor = "text-[#9CA3AF]";

        // Identification if item is actually "Today" for highlighting
        const itemDateStr = item.attendanceDate;
        const todayStr = format(new Date(), "yyyy-MM-dd");
        const isToday = itemDateStr === todayStr;

        entries[entryIdx] = {
          ...entries[entryIdx],
          status: statusText,
          time: timeText,
          variance: varianceText,
          statusColor,
          varianceColor: item.overtimes?.minutes > 0 ? "text-gray-400 font-medium" : "text-orange-500 font-bold",
          isToday,
          raw: item
        };
      });
    }

    // Sort descending (latest first)
    return entries.sort((a, b) => b.raw.attendanceDate.localeCompare(a.raw.attendanceDate));
  }, [monthlyData, currentDate]);

  if (loading && !monthlyData) {
    return (
      <div className="w-full min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F2937]"></div>
      </div>
    );
  }

  if (selectedRecord) {
    const rawData = selectedRecord.raw;
    const isOutPending = rawData?.attendanceType === "NOT_MARKED" && selectedRecord.time.endsWith("- ");
    const isNotMarked = rawData?.attendanceType === "NOT_MARKED" && !isOutPending;
    const isWeeklyOff = rawData?.attendanceType === "WEEK_OFF";

    const generateLogs = () => {
      const logs: any[] = [];
      if (rawData?.attendance?.[0]?.punches) {
        rawData.attendance[0].punches.forEach((p: any) => {
          const punchTime = new Date(p.punchTime);
          logs.push({
            title: `Punched ${p.punchType === "IN" ? "In" : "Out"} at ${format(punchTime, "hh:mm a")}`,
            sub: `By ${user?.name || 'System'} on ${format(punchTime, "dd MMM, hh:mm a")}`
          });
        });
      } else if (rawData?.attendance?.[0]?.inTime) {
        const main = rawData.attendance[0];
        const inT = new Date(main.inTime);
        logs.push({ title: `Punched In at ${format(inT, "hh:mm a")}`, sub: `On ${format(inT, "dd MMM")}` });
        if (main.outTime) {
          const outT = new Date(main.outTime);
          logs.push({ title: `Punched Out at ${format(outT, "hh:mm a")}`, sub: `On ${format(outT, "dd MMM")}` });
        }
      }

      if (rawData?.overtimes?.minutes > 0) logs.push({ title: `Added Overtime | ${Math.floor(rawData.overtimes.minutes / 60)} hr ${(rawData.overtimes.minutes % 60).toString().padStart(2, '0')} min`, sub: `Calculated by System` });
      if (rawData?.fine?.minutes > 0) logs.push({ title: `Added Late Fine | ${Math.floor(rawData.fine.minutes / 60)} hr ${(rawData.fine.minutes % 60).toString().padStart(2, '0')} min`, sub: `Calculated by System` });
      if (rawData?.attendanceType === "ABSENT") logs.push({ title: "Marked Absent as Per settings", sub: `System recorded` });

      return logs;
    };

    const dynamicLogs = generateLogs();

    return (
      <div className="w-full min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans">
        <div className="max-w-[1400px] mx-auto">
          <button onClick={() => setSelectedRecord(null)} className="flex items-center gap-2 text-[14px] text-[#4B5563] mb-6 group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back
          </button>

          <div className="bg-white rounded-[8px] border border-[#E5E7EB] p-4 mb-4 shadow-sm">
            <h2 className="text-[16px] font-medium text-[#1F2937]">Attendance Detail</h2>
            <p className="text-[12px] text-[#1F2937] mt-1">{selectedRecord.date}</p>
          </div>

          {rawData?.attendanceType === "HOLIDAY" && (
            <div className="bg-white rounded-[8px] border border-[#E5E7EB] p-6 mb-4 flex items-center justify-between">
              <span className="text-[14px] font-medium text-[#1F2937]">Paid Holiday</span>
              <span className="text-[12px] text-[#9CA3AF]">Paid Holiday</span>
            </div>
          )}

          {isNotMarked ? (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <span className="text-[20px] font-semibold text-[#1F2937]">No Entries Available</span>
            </div>
          ) : (
            <div className="bg-white rounded-[8px] border border-[#E5E7EB] overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-[#E5E7EB]">
                <h3 className="text-[16px] font-medium text-[#1F2937]">Log</h3>
              </div>
              <div className="px-6 py-5">
                {dateLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (selectedDateAttendance?.attendances || []).length > 0 ? (
                  <div className="space-y-6">
                    {selectedDateAttendance.attendances.map((att: any, idx: number) => (
                      <div key={idx} className={`${idx !== 0 ? 'border-t border-gray-50 pt-6' : ''}`}>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[12px] font-bold text-gray-900 uppercase tracking-tight">
                            {att.attendanceType} {att.session ? `| Session ${att.session}` : ''}
                          </span>
                          {att.inTime && (
                            <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {format(new Date(att.inTime), "hh:mm a")} - {att.outTime ? format(new Date(att.outTime), "hh:mm a") : "Active"}
                            </span>
                          )}
                        </div>

                        <div className="space-y-4">
                          {att.punches?.length > 0 ? (
                            att.punches.map((p: any, pIdx: number) => (
                              <div key={pIdx} className="flex gap-3 items-start">
                                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${p.punchType === 'IN' ? 'bg-green-500' : 'bg-red-500'}`} />
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[11px] font-bold text-[#1F2937]">
                                    Punched {p.punchType === 'IN' ? 'In' : 'Out'}
                                  </span>
                                  <span className="text-[10px] text-[#9CA3AF]">
                                    {format(new Date(p.punchTime), "hh:mm a")} | {format(new Date(p.punchTime), "dd MMM yyyy")}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="flex gap-3 items-start italic text-gray-400">
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-200 shrink-0" />
                              <span className="text-[11px]">No punch details recorded</span>
                            </div>
                          )}
                        </div>

                        {att.leaveName && (
                          <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-100">
                            <span className="text-[11px] text-blue-700 font-medium">Leave Category: {att.leaveName}</span>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add variance/fine logs at the bottom if any */}
                    {rawData?.overtimes?.minutes > 0 && (
                      <div className="flex gap-3 items-start pt-4 border-t border-dashed border-gray-100">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-bold text-green-700">Extra Hours Added</span>
                          <span className="text-[10px] text-gray-500">{Math.floor(rawData.overtimes.minutes / 60)} hr {rawData.overtimes.minutes % 60} min of overtime recorded</span>
                        </div>
                      </div>
                    )}
                    {rawData?.fine?.minutes > 0 && (
                      <div className="flex gap-3 items-start pt-4 border-t border-dashed border-gray-100">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-bold text-orange-700">Late Fine Penalty</span>
                          <span className="text-[10px] text-gray-500">{Math.floor(rawData.fine.minutes / 60)} hr {rawData.fine.minutes % 60} min of late entry/early exit penalty</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ListRestart className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-[12px] text-gray-400">No activity logs recorded for this day.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const pendingCount = monthlyData?.summary?.pendingApprovals || 0;

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-[24px]">
          <h1 className="text-[20px] font-semibold text-[#1F2937]">Attendance</h1>
          <div className="flex flex-wrap items-center gap-4 md:gap-8">
            <button className="flex items-center gap-2 text-[14px] font-medium text-[#3F5A54]"><ListRestart className="w-4 h-4 text-gray-400" /> Unprocessed Logs</button>
            <button className="flex items-center gap-2 text-[14px] font-medium text-[#3F5A54]"><MessageSquare className="w-4 h-4 text-gray-400" /> Message</button>
            <button className="flex items-center gap-2 text-[14px] font-medium text-[#3F5A54]"><Settings className="w-4 h-4 text-gray-400" /> Settings</button>
          </div>
        </div>

        <div className="bg-white rounded-[8px] border border-[#E5E7EB] h-auto lg:h-[149px] mb-[24px] shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-[14px]">
            <div className="flex items-center justify-center bg-[#F9FAFB] rounded-[8px] h-[30px] w-[130px] gap-2 border border-[#E5E7EB]">
              <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 text-[#9CA3AF]"><ChevronLeft className="w-3 h-3" /></button>
              <span className="text-[10px] font-semibold uppercase tracking-wide">{format(currentDate, "MMM yyyy")}</span>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 text-[#9CA3AF]"><ChevronRight className="w-3 h-3" /></button>
            </div>
            <div className="flex items-center gap-2 pr-2">
              <div className="relative">
                <div className={`w-2 h-2 rounded-full ${pendingCount > 0 ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                {pendingCount > 0 && <div className="absolute inset-0 w-2 h-2 rounded-full bg-red-500 animate-ping"></div>}
              </div>
              <span className="text-[12px] font-medium text-[#1F2937]">{pendingCount} Approval pending</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 px-4 pb-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-[#F9FAFB] p-3 rounded-[4px] border border-gray-100 flex flex-col justify-center min-w-[120px]">
                <span className="text-[11px] text-[#4B5563] uppercase tracking-wider">{stat.label}</span>
                <span className="text-[13px] font-semibold text-black">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-[20px] font-semibold text-[#1F2937]">Attendance Summary</h2>
          <div className="flex flex-col gap-px bg-gray-100 rounded-[10px] overflow-hidden border border-[#E5E7EB]">
            {attendanceData.map((item, idx) => (
              <div key={idx} onClick={() => setSelectedRecord(item)} className="group flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0 bg-white">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-[#1F2937]">{item.date}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-400 capitalize">{item.day}</span>
                </div>
                <div className="flex flex-row items-center gap-6 md:gap-10">
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[12px] font-medium ${item.statusColor}`}>{item.status}</span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-[#9CA3AF]">{item.time}</span>
                      {item.variance && <span className={item.varianceColor}>{item.variance}</span>}
                    </div>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-gray-300 group-hover:text-gray-900 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
