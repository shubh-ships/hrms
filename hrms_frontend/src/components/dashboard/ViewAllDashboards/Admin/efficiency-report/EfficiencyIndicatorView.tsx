"use client";
import React from 'react';
import { 
  ArrowLeft, 
  ChevronDown, 
  CalendarDays, 
  Download, 
  ArrowUp,
  Grip
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Import local assets
import averageAttendanceIcon from '@/assets/Dashicons/average-attendance.png';
import taskCompleteIcon from '@/assets/Dashicons/task-complete.png';
import teamPulseScoreIcon from '@/assets/Dashicons/team-pulse-score.png';
import movebackIcon from '@/assets/Dashicons/move-back-icon.png';

const EfficiencyIndicatorView = () => {
  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6 bg-[#f8f9fa] min-h-screen">
      
      {/* Top Header & Navigation */}
      <Link href="/dashboard/admin/efficiency_report">
        <Image src={movebackIcon} alt="back" className="w-[80px] my-6" />
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-[22px] font-bold text-slate-800">Key Performance Indicator</h1>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <select className="pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-md text-[13px] font-medium appearance-none focus:outline-none focus:border-[#3f5a54] text-slate-700 h-[38px] min-w-[180px]">
              <option>All Departments</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-md text-[13px] font-medium text-slate-700 h-[38px] hover:bg-slate-50">
            <CalendarDays className="w-4 h-4 text-slate-500" />
            March 2026
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-[#425b55] text-white rounded-md text-[13px] font-medium h-[38px] hover:bg-[#324541] transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Primary KPI Cards (Top Row) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
        
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-slate-400">Tasks Completed on Time</span>
            <div className="w-10 h-10 flex items-center justify-center">
              <Image src={taskCompleteIcon} alt="Task Complete" className="w-10 h-10 object-contain" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[28px] font-bold text-slate-800 flex items-baseline gap-1">
              100.0 <span className="text-[16px] font-semibold text-slate-400">%</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] mt-1">
              <span className="flex items-center text-[#22c55e] font-semibold">
                <ArrowUp className="w-3 h-3 mr-0.5" /> 0%
              </span>
              <span className="text-slate-400">vs previous period</span>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-5 overflow-hidden">
            <div className="h-full bg-[#22c55e] rounded-full w-[100%]"></div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-slate-400">Average Attendance</span>
            <div className="w-10 h-10 flex items-center justify-center">
              <Image src={averageAttendanceIcon} alt="Average Attendance" className="w-10 h-10 object-contain" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[28px] font-bold text-slate-800 flex items-baseline gap-1">
              8.0 <span className="text-[16px] font-semibold text-slate-400">%</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] mt-1">
              <span className="flex items-center text-[#22c55e] font-semibold">
                <ArrowUp className="w-3 h-3 mr-0.5" /> 0%
              </span>
              <span className="text-slate-400">vs previous period</span>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-5 overflow-hidden">
            <div className="h-full bg-[#eab308] rounded-full w-[8%]"></div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-slate-400">Team Pulse Score</span>
            <div className="w-10 h-10 flex items-center justify-center">
              <Image src={teamPulseScoreIcon} alt="Team Pulse Score" className="w-10 h-10 object-contain" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[28px] font-bold text-slate-800 flex items-baseline gap-1">
              118.0
            </div>
            <div className="flex items-center gap-2 text-[12px] mt-1">
              <span className="flex items-center text-[#22c55e] font-semibold">
                <ArrowUp className="w-3 h-3 mr-0.5" /> 0%
              </span>
              <span className="text-slate-400">vs previous period</span>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-5 overflow-hidden">
            <div className="h-full bg-[#a855f7] rounded-full w-[75%]"></div>
          </div>
        </div>
      </div>

      {/* Secondary Cards (Middle Row) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* Green Tasks */}
        <div className="bg-[#f0fdf4] p-5 rounded-xl border border-green-100/50 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[12px] font-bold text-[#22c55e] mb-1">Green Tasks</div>
              <div className="text-[24px] font-bold text-slate-800 leading-tight">3</div>
            </div>
            <div className="w-10 h-10 border-4 border-[#22c55e] border-opacity-80 rounded-full border-r-transparent rotate-45"></div>
          </div>
          <div className="text-[12px] text-slate-400 mt-2 font-medium">Successfully completed</div>
        </div>

        {/* Yellow Tasks */}
        <div className="bg-[#fefce8] p-5 rounded-xl border border-yellow-100/50 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[12px] font-bold text-[#eab308] mb-1">Yellow Tasks</div>
              <div className="text-[24px] font-bold text-slate-800 leading-tight">0</div>
            </div>
            <div className="w-10 h-10 border-4 border-[#eab308] rounded-full"></div>
          </div>
          <div className="text-[12px] text-slate-400 mt-2 font-medium">In progress/warning</div>
        </div>

        {/* Red Tasks */}
        <div className="bg-[#fef2f2] p-5 rounded-xl border border-red-100/50 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[12px] font-bold text-[#ef4444] mb-1">Red Tasks</div>
              <div className="text-[24px] font-bold text-slate-800 leading-tight">0</div>
            </div>
            <div className="w-10 h-10 border-4 border-[#ef4444] rounded-full"></div>
          </div>
          <div className="text-[12px] text-slate-400 mt-2 font-medium">Delayed/issues</div>
        </div>

        {/* Total Tasks */}
        <div className="bg-[#f8fafc] p-5 rounded-xl border border-slate-200/50 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[12px] font-bold text-[#3b82f6] mb-1">Total Tasks</div>
              <div className="text-[24px] font-bold text-slate-800 leading-tight">0</div>
            </div>
            <div className="w-10 h-10 bg-[#e0f0ff] text-[#60a5fa] rounded-full flex items-center justify-center">
              <Grip className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[12px] text-slate-400 mt-2 font-medium">All assigned tasks</div>
        </div>
      </div>

      {/* Performance Breakdown Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="p-6 pb-4 border-b border-slate-100">
          <h2 className="text-[18px] font-bold text-slate-800">March 2026 Performance Breakdown</h2>
          <p className="text-[13px] text-slate-400 mt-0.5">Comprehensive view of all performance metrics</p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 border-b border-slate-100">
          
          {/* Column 1: Task Distribution */}
          <div className="space-y-5">
            <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">Task Distribution</h3>
            <div className="flex justify-between items-center text-[14px]">
              <span className="text-slate-600 font-medium">Success Rate:</span>
              <span className="font-bold text-[#22c55e]">100%</span>
            </div>
            <div className="flex justify-between items-center text-[14px]">
              <span className="text-slate-600 font-medium">Warning Rate:</span>
              <span className="font-bold text-[#eab308]">0%</span>
            </div>
            <div className="flex justify-between items-center text-[14px]">
              <span className="text-slate-600 font-medium">Issue Rate:</span>
              <span className="font-bold text-[#ef4444]">0%</span>
            </div>
          </div>

          {/* Column 2: Submission & Approval */}
          <div className="space-y-5">
            <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">Submission & Approval</h3>
            <div className="flex justify-between items-center text-[14px]">
              <span className="text-slate-600 font-medium">Submission Rate:</span>
              <span className="font-bold text-[#3b82f6]">100%</span>
            </div>
            <div className="flex justify-between items-center text-[14px]">
              <span className="text-slate-600 font-medium">Approved Tasks:</span>
              <span className="font-bold text-[#22c55e]">3 / 3</span>
            </div>
            <div className="flex justify-between items-center text-[14px]">
              <span className="text-slate-600 font-medium">Approval Rate:</span>
              <span className="font-bold text-[#22c55e]">100%</span>
            </div>
          </div>

          {/* Column 3: Attendance & Efficiency */}
          <div className="space-y-5">
            <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">Attendance & Efficiency</h3>
            <div className="flex justify-between items-center text-[14px]">
              <span className="text-slate-600 font-medium">Attendance:</span>
              <span className="font-bold text-[#ef4444]">8%</span>
            </div>
            <div className="flex justify-between items-center text-[14px]">
              <span className="text-slate-600 font-medium">Efficiency Score:</span>
              <span className="font-bold text-[#a855f7]">118</span>
            </div>
            <div className="flex justify-between items-center text-[14px]">
              <span className="text-slate-600 font-medium">Performance Grade:</span>
              <span className="px-3 py-1 bg-[#e0f0ff] text-[#3b82f6] text-[12px] font-bold rounded-md">
                Good
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bars Region */}
        <div className="p-6 space-y-6">
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[13px] font-semibold text-slate-700">
              <span>Task Completion Progress</span>
              <span className="text-slate-400">3 / 3</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#22c55e] rounded-full w-[100%]"></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-[13px] font-semibold text-slate-700">
              <span>Attendance Level</span>
              <span className="text-slate-400">8%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#ef4444] rounded-full w-[8%]"></div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default EfficiencyIndicatorView;