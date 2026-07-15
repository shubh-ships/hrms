import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import movebackIcon from '@/assets/Dashicons/move-back-icon.png';

interface AttendanceDay {
  attendanceId: string;
  date: string;
  loginTime?: string;
  logoutTime?: string;
  sealTime?: string | null;
}

interface MonthlyAttendance {
  month: string;
  totalDays: number;
  days: AttendanceDay[];
}

interface AttendanceTableProps {
  attendanceData: MonthlyAttendance[] | null;
  loading: boolean;
  onEditAttendance: (day: AttendanceDay) => void;
  onMarkLogout: (attendanceId: string) => void;
  formatDate: (dateString: string) => string;
  formatTime: (timeString?: string | null) => string;
  userName: string;
  onGoBack: () => void;
  onExport: () => void;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  attendanceData,
  loading,
  onEditAttendance,
  onMarkLogout,
  formatDate,
  formatTime,
  userName,
  onGoBack,
  onExport,
}) => {
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [smsToggle, setSmsToggle] = useState(false);

  const handlePrevMonth = () => {
    if (attendanceData && currentMonthIndex < attendanceData.length - 1) {
      setCurrentMonthIndex(prev => prev + 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex > 0) {
      setCurrentMonthIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-32 bg-gray-200 rounded"></div>
        <div className="h-64 bg-white rounded-xl border border-gray-200"></div>
      </div>
    );
  }

  if (!attendanceData || attendanceData.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-gray-200 text-center shadow-sm relative">
        <Image 
          src={movebackIcon} 
          alt="back" 
          className="w-[80px] my-6 cursor-pointer absolute top-4 left-6"
          onClick={onGoBack}
        />
        <div className="pt-20">
          <p className="text-gray-500">No attendance data found for {userName}.</p>
        </div>
      </div>
    );
  }

  const currentMonthData = attendanceData[currentMonthIndex];
  
  // Calculate approximate stats
  let presentDays = 0;
  let absentDays = 0;
  let notMarked = 0;
  let punchedIn = 0;
  
  currentMonthData.days.forEach(day => {
    if (day.logoutTime) {
      presentDays++;
    } else if (day.loginTime) {
      punchedIn++;
    } else if (!day.loginTime && !day.logoutTime) {
      absentDays++; 
    }
  });

  const formatDayLiteral = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = d.getDate();
      const month = d.toLocaleString('default', { month: 'short' });
      const weekday = d.toLocaleString('default', { weekday: 'short' });
      return `${day} ${month} | ${weekday}`;
    } catch {
      return formatDate(dateStr);
    }
  };

  return (
    <div className="">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <Image 
            src={movebackIcon} 
            alt="back" 
            className="w-[80px] my-2 cursor-pointer transition-opacity hover:opacity-80"
            onClick={onGoBack}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between bg-white/0 mb-6 px-1">
        <h2 className="text-[26px] font-bold text-[#1e293b] tracking-tight">{userName}</h2>
        <Button 
          variant="outline" 
          onClick={onExport}
          className="bg-white rounded-lg border-gray-300 shadow-sm text-gray-700 hover:bg-gray-50 font-medium px-5"
        >
          Download Report
        </Button>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-[14px] border border-gray-200 shadow-sm overflow-hidden mb-6">
        {/* Month Selector & Approved Badge */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
          <div className="flex items-center border border-gray-200 rounded-lg bg-white p-1 shadow-sm">
            <button 
               onClick={handlePrevMonth}
               disabled={currentMonthIndex === attendanceData.length - 1} 
               className={`p-1.5 rounded-md ${currentMonthIndex === attendanceData.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'} transition-colors`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-5 text-sm font-semibold text-gray-800 min-w-[120px] text-center">
              {currentMonthData.month}
            </span>
            <button 
               onClick={handleNextMonth}
               disabled={currentMonthIndex === 0} 
               className={`p-1.5 rounded-md ${currentMonthIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'} transition-colors`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#dcfce7] text-[#166534] rounded-[6px] text-xs font-semibold tracking-wide border border-[#bbf7d0]">
            <CheckCircle2 className="h-3.5 w-3.5" /> All Approved
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap items-center justify-between px-6 py-5 bg-[#fafafa]">
          <div className="flex gap-10 overflow-x-auto pb-2 md:pb-0 scrollbar-hide flex-grow transition-all">
             <div className="flex flex-col gap-1.5 shrink-0">
               <span className="text-[12px] text-gray-500 font-medium flex items-center gap-1">Days <span className="text-[10px] bg-white border border-gray-200 rounded-full w-3.5 h-3.5 flex items-center justify-center text-gray-400">i</span></span>
               <span className="text-sm font-bold text-gray-900">{currentMonthData.totalDays}</span>
             </div>
             <div className="flex flex-col gap-1.5 shrink-0">
               <span className="text-[12px] text-gray-500 font-medium flex items-center gap-1">Present <span className="text-[10px] bg-white border border-gray-200 rounded-full w-3.5 h-3.5 flex items-center justify-center text-gray-400">i</span></span>
               <span className="text-sm font-bold text-gray-900">{presentDays}</span>
             </div>
             <div className="flex flex-col gap-1.5 shrink-0">
               <span className="text-[12px] text-gray-500 font-medium flex items-center gap-1">Absent <span className="text-[10px] bg-white border border-gray-200 rounded-full w-3.5 h-3.5 flex items-center justify-center text-gray-400">i</span></span>
               <span className="text-sm font-bold text-gray-900">{absentDays}</span>
             </div>
             <div className="flex flex-col gap-1.5 shrink-0">
               <span className="text-[12px] text-gray-500 font-medium flex items-center gap-1">Half Day <span className="text-[10px] bg-white border border-gray-200 rounded-full w-3.5 h-3.5 flex items-center justify-center text-gray-400">i</span></span>
               <span className="text-sm font-bold text-gray-900">0</span>
             </div>
             <div className="flex flex-col gap-1.5 shrink-0">
               <span className="text-[12px] text-gray-500 font-medium flex items-center gap-1">Not Marked <span className="text-[10px] bg-white border border-gray-200 rounded-full w-3.5 h-3.5 flex items-center justify-center text-gray-400">i</span></span>
               <span className="text-sm font-bold text-gray-900">{notMarked}</span>
             </div>
             <div className="flex flex-col gap-1.5 shrink-0">
               <span className="text-[12px] text-gray-500 font-medium flex items-center gap-1">Punched In <span className="text-[10px] bg-white border border-gray-200 rounded-full w-3.5 h-3.5 flex items-center justify-center text-gray-400">i</span></span>
               <span className="text-sm font-bold text-gray-900">{punchedIn}</span>
             </div>
             <div className="flex flex-col gap-1.5 shrink-0">
               <span className="text-[12px] text-gray-500 font-medium flex items-center gap-1">Punched Out <span className="text-[10px] bg-white border border-gray-200 rounded-full w-3.5 h-3.5 flex items-center justify-center text-gray-400">i</span></span>
               <span className="text-sm font-bold text-gray-900">0</span>
             </div>
          </div>
          
          <div className="flex items-center gap-3 mt-4 md:mt-0 md:pl-6 md:border-l md:border-gray-200 shrink-0">
            <span className="text-[13px] font-semibold text-gray-700">Send Absent SMS to Staff</span>
            {/* Custom Toggle Switch */}
            <div 
              onClick={() => setSmsToggle(!smsToggle)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${smsToggle ? 'bg-[#3f5a54]' : 'bg-[#94a3b8]'}`}
            >
              <div 
                className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${smsToggle ? 'translate-x-5' : 'translate-x-0'}`}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Attendance Cards List */}
      <div className="space-y-4">
        {currentMonthData.days.map((day, idx) => {
           let statusText = "Not Marked";
           let statusColor = "text-[#ef4444]";
           
           if (day.logoutTime) {
              statusText = "Not Marked"; // Preserving UI textual style based on missing status in mocked image, but keeping logic
              statusColor = "text-[#ef4444]";
           } else if (day.loginTime) {
              statusText = "Not Marked"; 
              statusColor = "text-[#ef4444]";
           }
           
           const hasLogin = !!day.loginTime;
           const hasLogout = !!day.logoutTime;
           
           const timeStr = hasLogout 
              ? `${formatTime(day.loginTime)} - ${formatTime(day.logoutTime)}`
              : hasLogin 
                ? `${formatTime(day.loginTime)} - NA`
                : "Present";

           // Present Block Styles
           let presentStyles = "bg-[#f1f5f9] border-transparent text-[#475569] hover:bg-[#e2e8f0]";
           if (hasLogin && hasLogout) {
             presentStyles = "bg-[#22C55E] border-[#22C55E] text-white shadow-sm hover:bg-[#16a34a]";
           } else if (hasLogin && !hasLogout) {
             presentStyles = "bg-transparent border-[#22C55E] text-[#22C55E] hover:bg-[#f0fdf4]";
           }

           // Logout Block Styles
           let logoutStyles = "bg-[#f1f5f9] border-transparent text-[#475569] hover:bg-[#e2e8f0]";
           if (hasLogin && hasLogout) {
             logoutStyles = "bg-[#F59E0B] border-[#F59E0B] text-white shadow-sm hover:bg-[#d97706]";
           }

           // Absent Block Styles
           let absentStyles = (!hasLogin && !hasLogout) 
             ? "bg-[#EF4444] border-[#EF4444] text-white shadow-sm hover:bg-[#dc2626]" 
             : "bg-[#f1f5f9] border-transparent text-[#475569] hover:bg-[#e2e8f0]";
                
           return (
             <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all hover:border-gray-300 hover:shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
               <div className="flex flex-col ml-1">
                 <h4 className="text-[15px] font-bold text-[#1e293b]">{formatDayLiteral(day.date)}</h4>
                 <span className={`text-[12px] mt-1.5 font-medium ${statusColor}`}>{statusText}</span>
               </div>
               
               <div className="flex gap-3 w-full md:w-auto mt-2 md:mt-0">
                 {/* Present Button Block */}
                 <div 
                   className={`flex items-center px-[28px] py-[10px] min-w-[130px] rounded-md flex-1 md:flex-none justify-center border transition-all cursor-pointer ${presentStyles}`}
                   onClick={(e) => {
                     e.stopPropagation();
                     onEditAttendance(day);
                   }}
                 >
                   <span className="font-bold mr-2.5 text-[14px]">P</span> 
                   <span className="text-[10px] mr-2.5 opacity-40">|</span>
                   <span className="text-[13px] font-semibold tracking-tight whitespace-nowrap">{hasLogin ? timeStr : "Present"}</span>
                 </div>
                 
                 {/* Absent Button Block */}
                 <div 
                   className={`flex items-center px-[28px] py-[10px] min-w-[130px] rounded-md flex-1 md:flex-none justify-center border transition-all cursor-pointer ${absentStyles}`}
                   onClick={(e) => {
                     e.stopPropagation();
                     // Trigger absent dialog via a modified edit payload or via an onMarkAbsent specific prop mapped in parent later
                     onEditAttendance({...day, _markAbsentMode: true} as any);
                   }}
                 >
                   <span className="font-bold mr-2.5 text-[14px]">A</span> 
                   <span className="text-[10px] mr-2.5 opacity-40">|</span>
                   <span className="text-[13px] font-semibold tracking-tight whitespace-nowrap">Absent</span>
                 </div>
                 
                 {/* Logout Button Block */}
                 <div 
                   className={`flex items-center px-[28px] py-[10px] min-w-[130px] rounded-md flex-1 md:flex-none justify-center border transition-colors cursor-pointer ${logoutStyles}`}
                   onClick={(e) => {
                     e.stopPropagation();
                     if (hasLogin && !hasLogout) {
                       onMarkLogout(day.attendanceId);
                     } else if (hasLogin && hasLogout) {
                        onEditAttendance(day);
                     }
                   }}
                 >
                   <span className="font-bold mr-2.5 text-[14px]">LO</span> 
                   <span className="text-[10px] mr-2.5 opacity-40">|</span>
                   <span className="text-[13px] font-semibold tracking-tight whitespace-nowrap">Logout</span>
                 </div>
               </div>
             </div>
           );
        })}
      </div>
    </div>
  );
};
