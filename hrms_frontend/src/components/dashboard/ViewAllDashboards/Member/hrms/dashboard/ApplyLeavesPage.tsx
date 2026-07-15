"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import movebackIcon from '@/assets/Dashicons/move-back-icon.png';
import CloudIcon from "@/assets/Dashicons/Cloud.png";
import ApplyLeaveModal from "./ApplyLeaveModal";
import LeaveDetailsModal from "./LeaveDetailsModal";

export default function LeavesPage() {
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);

  const leaveBalances = [
    { type: "Casual Leave", balance: "4 Left" },
    { type: "Comp Off Leave", balance: "0 Left" }
  ];

  const upcomingLeaves = [
    {
      id: "u1",
      dateStr: "13 Feb, Fri (S1 - S2)",
      durationStr: "1 Day | Sick Leave",
      description: "I want a Sick Leave because i have fever",
      status: "Approved"
    },
    {
      id: "u2",
      dateStr: "14 Feb, Fri (S1 - S2)",
      durationStr: "1 Day | Masti Leave",
      description: "I want a Msasti Leave because i want to go for masti",
      status: "Pending"
    }
  ];

  const leaveHistoryGroups = [
    {
      month: "Feb, 2026",
      totalDays: "2 Day",
      leaves: [
        {
          id: "h1",
          dateStr: "13 Feb, Fri (S1 - S2)",
          durationStr: "1 Day | Sick Leave",
          description: "I want a Sick Leave because i have fever",
          status: "Approved"
        },
        {
          id: "h2",
          dateStr: "14 Feb, Fri (S1 - S2)",
          durationStr: "1 Day | Masti Leave",
          description: "I want a Msasti Leave because i want to go for masti",
          status: "Approved"
        }
      ]
    }
  ];

  const renderStatusPill = (status: string) => {
    if (status === "Approved") {
      return <span className="px-3.5 py-1 bg-[#e0f8e9] text-[#22c55e] rounded-full text-[11px] font-medium tracking-wide">Approved</span>;
    }
    if (status === "Pending") {
      return <span className="px-3.5 py-1 bg-[#fdf2d0] text-[#fcd34d] rounded-full text-[11px] font-medium tracking-wide">Pending</span>;
    }
    return <span className="px-3.5 py-1 bg-gray-50 text-gray-500 rounded-full text-[11px] font-medium tracking-wide">{status}</span>;
  };

  return (
    <div className="w-full min-h-screen bg-[#fcfcfc] p-4 lg:p-8 relative pb-32">
      <div className="max-w-[1400px] mx-auto w-full">
        
        {/* Header Area */}
        <div className="mb-8 flex flex-col items-start gap-6">
          <Link href="/dashboard/dynamic/hrms/dashboard" className="inline-block hover:opacity-80 transition-opacity">
            <Image src={movebackIcon} alt="Back" className="w-[80px] h-auto object-contain" />
          </Link>
          <h1 className="text-[22px] font-bold text-slate-800">Leaves</h1>
        </div>

        {/* Leave Balance Card */}
        <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] border border-[#f1f1f1] overflow-hidden w-full mb-10">
          <div className="px-6 py-5 border-b border-[#f1f1f1]">
            <p className="text-[12px] font-medium text-gray-400 mb-1">Leave Balance</p>
            <h2 className="text-[18px] font-bold text-slate-800">4 Leaves</h2>
          </div>
          
          <div className="px-6 py-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Leave Type</span>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Balance</span>
            </div>
            {leaveBalances.map((leave, idx) => (
              <div key={idx} className="flex justify-between items-center py-0.5">
                <span className="text-[13px] font-medium text-slate-700">{leave.type}</span>
                <span className={`text-[13px] ${leave.balance === '0 Left' ? 'text-gray-400 font-medium' : 'text-slate-600 font-semibold'} `}>
                  {leave.balance}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#f1f1f1] px-6 py-5 flex justify-between items-center">
            <span className="text-[13px] font-medium text-slate-700">Leaves Used</span>
            <span className="text-[13px] font-bold text-slate-800">0 Days</span>
          </div>
        </div>

        {/* Upcoming Leaves List */}
        {upcomingLeaves.length > 0 && (
          <div className="mb-10">
            <h3 className="text-[15px] font-semibold text-slate-600 mb-4">Upcoming Leaves</h3>
            <div className="bg-white border border-[#f1f1f1] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] rounded-xl overflow-hidden flex flex-col">
              {upcomingLeaves.map((leave, idx) => (
                <div key={leave.id} onClick={() => setSelectedLeave(leave)} className={`py-5 px-6 grid grid-cols-[60%_1fr_24px] items-center gap-4 hover:bg-gray-50/50 transition-colors cursor-pointer group ${idx !== upcomingLeaves.length - 1 ? 'border-b border-[#f1f1f1]' : ''}`}>
                   <div className="flex flex-col w-full pr-4">
                     <h4 className="text-[13px] font-bold text-slate-800">{leave.dateStr}</h4>
                     <p className="text-[12px] font-medium text-gray-400 mt-1">{leave.durationStr}</p>
                     <p className="text-[11px] text-gray-300 mt-1.5 truncate">{leave.description}</p>
                   </div>
                   <div className="flex items-center justify-start">
                     {renderStatusPill(leave.status)}
                   </div>
                   <div className="flex items-center justify-end">
                     <ChevronRight strokeWidth={1.5} size={18} className="text-gray-400 group-hover:text-slate-600 transition-colors" />
                   </div>
                 </div>
              ))}
            </div>
          </div>
        )}

        {/* Leave History List */}
        {leaveHistoryGroups.length > 0 ? (
          <div className="mb-10">
            <h3 className="text-[15px] font-semibold text-slate-600 mb-4">Leave History</h3>
            
            <div className="bg-white border border-[#f1f1f1] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] rounded-xl overflow-hidden">
              {leaveHistoryGroups.map((group, gIdx) => (
                <div key={gIdx} className="flex flex-col">
                  <div className="flex items-center justify-between px-6 py-5 border-b border-[#f1f1f1]">
                    <h4 className="text-[15px] text-slate-800 font-semibold">{group.month}</h4>
                    <span className="text-[15px] font-semibold text-slate-800">{group.totalDays}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    {group.leaves.map((leave, lIdx) => (
                      <div key={leave.id} onClick={() => setSelectedLeave(leave)} className={`py-5 px-6 grid grid-cols-[60%_1fr_24px] items-center gap-4 hover:bg-gray-50/50 transition-colors cursor-pointer group ${lIdx !== group.leaves.length - 1 || gIdx !== leaveHistoryGroups.length - 1 ? 'border-b border-[#f1f1f1]' : ''}`}>
                        <div className="flex flex-col w-full pr-4">
                          <h4 className="text-[13px] font-bold text-slate-800">{leave.dateStr}</h4>
                          <p className="text-[12px] font-medium text-gray-400 mt-1">{leave.durationStr}</p>
                          <p className="text-[11px] text-gray-300 mt-1.5 truncate">{leave.description}</p>
                        </div>
                        <div className="flex items-center justify-start">
                          {renderStatusPill(leave.status)}
                        </div>
                        <div className="flex items-center justify-end">
                          <ChevronRight strokeWidth={1.5} size={18} className="text-gray-400 group-hover:text-slate-600 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center mt-24">
            <Image src={CloudIcon} alt="No data found" className="w-[110px] h-auto object-contain opacity-80 mb-6" />
            <p className="text-[13px] text-gray-400 font-medium">No data found</p>
          </div>
        )}

      </div>

      {/* Sticky Footer Action Bar */}
      <div className="w-full fixed bottom-0 left-0 right-0 bg-[#fcfcfc]/90 backdrop-blur-sm border-t border-[#f1f1f1] px-8 py-4 flex justify-end z-[30]">
        <button
          onClick={() => setIsApplyModalOpen(true)}
          type="button"
          className="px-8 py-2.5 rounded-lg text-[14px] font-medium tracking-wide transition-all shadow-sm bg-[#516358] text-white hover:bg-[#3e4d44] cursor-pointer"
        >
          Apply New Leave
        </button>
      </div>

      {/* Modal Dialog Overlay */}
      <ApplyLeaveModal 
        isOpen={isApplyModalOpen} 
        onClose={() => setIsApplyModalOpen(false)} 
      />

      <LeaveDetailsModal
        isOpen={!!selectedLeave}
        leave={selectedLeave}
        onClose={() => setSelectedLeave(null)}
      />
    </div>
  );
}
