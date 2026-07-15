"use client";

import type React from "react";
import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Search,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn, formatDateToYYYYMMDD } from "@/lib/utils";
import { format, isValid, parseISO } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { 
  fetchDetailedAttendance, 
  selectDetailedAttendance,
  fetchDashboardSummary,
  selectDashboardSummary 
} from "@/features/dailyAttendance/dailyAttendanceSlice";

// --- Sub-components ---

const formatDisplayTime = (timeString: string | null | undefined) => {
  if (!timeString || timeString === "-" || timeString === "N/A") return "-";
  
  // Handle HH:mm format
  if (/^\d{1,2}:\d{2}$/.test(timeString)) {
    return timeString;
  }

  try {
    const date = parseISO(timeString);
    if (isValid(date)) {
      return format(date, "hh:mm a");
    }
  } catch (e) {
    // console.error("Error formatting time:", e);
  }
  
  return timeString;
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = status.toLowerCase();
  const isPresent = s === "present" || s === "punched_in" || s === "punched_out";
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full text-[10px] font-medium px-3 py-1",
        isPresent
          ? "bg-[#334155] text-white"
          : "bg-[#D1D5DB] text-[#475569]"
      )}
    >
      {status.replace('_', ' ')}
    </div>
  );
};

const AttendanceOverview: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const detailedAttendance = useAppSelector(selectDetailedAttendance);
  const summary = useAppSelector(selectDashboardSummary);
  const loading = useAppSelector((state) => state.dailyAttendance.loading);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    const dateStr = formatDateToYYYYMMDD(selectedDate);
    dispatch(fetchDetailedAttendance(dateStr));
    dispatch(fetchDashboardSummary(dateStr));
  }, [dispatch, selectedDate]);

  const filteredData = useMemo(() => {
    if (!detailedAttendance) return [];
    return detailedAttendance.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [detailedAttendance, searchTerm]);

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] p-[40px] space-y-8 font-sans">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#3F5A54] hover:text-[#1E293B] transition-colors w-fit group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[16px] font-medium">Back</span>
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-semibold text-[#1F2937] tracking-tight">
            Attendance Overview
          </h1>

          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative w-[580px] h-[34px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input
                placeholder="Search Staff"
                className="pl-10 bg-white border-[#E5E7EB] rounded-lg text-[10px] focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none h-full shadow-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Date Picker */}
            <div className="flex items-center justify-center h-[34px] px-1 border border-[#E5E7EB] rounded-lg text-[10px] text-[#4B5563] bg-[#F9FAFB] shadow-sm min-w-[170px]">
              <button
                onClick={handlePrevDay}
                className="p-1.5 hover:bg-gray-200/50 rounded-md transition-colors"
                disabled={loading}
              >
                <ChevronLeft className="w-3 h-3" />
              </button>

              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex-1 flex items-center justify-center gap-2 font-semibold hover:bg-gray-200/50 h-[26px] px-2 rounded-md transition-colors">
                    <CalendarDays className="w-3.5 h-3.5 text-[#4B5563]" />
                    <span>{format(selectedDate, "dd MMM yyyy")}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border-none shadow-md rounded-lg" align="center" side="bottom">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className="scale-90 origin-top"
                  />
                </PopoverContent>
              </Popover>

              <button
                onClick={handleNextDay}
                className="p-1.5 hover:bg-gray-200/50 rounded-md transition-colors"
                disabled={loading}
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary row */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard label="Total Employees" value={summary?.totalEmployees ?? 0} />
        <StatCard label="Present" value={summary?.present ?? 0} />
        <StatCard label="Absent" value={summary?.absent ?? 0} />
        <StatCard 
          label="Avg. Attendance" 
          value={
            summary?.totalEmployees 
              ? `${Math.round((summary.present / summary.totalEmployees) * 100)}%`
              : "0%"
          } 
        />
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-[8px] shadow-sm border border-[#F0F0F0] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="table-fixed w-full">
              <TableHeader className="bg-[#F0F0F0] text-[12px] font-medium text-[#4B5563] border-none">
                <TableRow className="h-[39px] border-none hover:bg-transparent">
                  <TableHead className="border-none w-1/4 px-6">Name</TableHead>
                  <TableHead className="border-none w-1/4 px-6">Login Time</TableHead>
                  <TableHead className="border-none w-1/4 px-6">Logout Time</TableHead>
                  <TableHead className="border-none w-1/4 px-6 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <TableRow
                      key={item.employeeId}
                      className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <TableCell className="py-[10px] px-6 border-none">
                        <span className="text-[12px] font-regular text-[#1F2937] truncate block">
                          {item.name}
                        </span>
                      </TableCell>
                      <TableCell className="py-[10px] px-6 border-none">
                        <span className="text-[12px] text-[#1F2937] font-medium truncate block">
                          {formatDisplayTime(item.inTime)}
                        </span>
                      </TableCell>
                      <TableCell className="py-[10px] px-6 border-none">
                        <span className="text-[12px] text-[#1F2937] font-medium truncate block">
                          {formatDisplayTime(item.outTime)}
                        </span>
                      </TableCell>
                      <TableCell className="py-[10px] px-6 border-none text-center">
                        <StatusBadge status={item.attendance} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                      No attendance records found for this date.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <Card className="bg-white border-[#F0F0F0] shadow-none flex flex-col p-4">
    <span className="text-[12px] text-[#64748B] mb-1">{label}</span>
    <span className="text-[20px] font-semibold text-[#1E293B]">{value}</span>
  </Card>
);

export default AttendanceOverview;
