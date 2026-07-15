"use client";

import React from "react";
import { X, Download as DownloadIcon } from "lucide-react";

export default function LeaveDetailsModal({ isOpen, onClose, leave }: any) {
  if (!isOpen || !leave) return null;

  // Derive structured values based selectively on the mocked string combinations where possible
  const durationParts = leave.durationStr ? leave.durationStr.split("|") : ["1 Day", "Casual Leave"];
  const duration = durationParts[0]?.trim() || "1 Day";
  const type = leave.type || durationParts[1]?.trim() || "Casual Leave";

  const renderStatusPill = (status: string) => {
    if (status === "Approved") {
      return <span className="px-3.5 py-1 bg-[#e0f8e9] text-[#22c55e] rounded-full text-[11px] font-bold tracking-wide">Approved</span>;
    }
    if (status === "Pending") {
      return <span className="px-3.5 py-1 bg-[#fdf2d0] text-[#fcd34d] rounded-full text-[11px] font-bold tracking-wide">Pending</span>;
    }
    return <span className="px-3.5 py-1 bg-gray-50 text-gray-500 rounded-full text-[11px] font-bold tracking-wide">{status}</span>;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-[700px] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-8 pt-8 pb-5 border-b border-gray-100 shrink-0 bg-white relative z-10">
          <div>
            <h2 className="text-[26px] font-bold text-[#1f2937]">Leave Details</h2>
            <p className="text-[13px] font-bold text-gray-400 tracking-widest mt-1.5 uppercase">{leave.userName || "CHIRAG"}</p>
          </div>
          <button onClick={onClose} className="p-1.5 bg-gray-100/80 hover:bg-gray-200 rounded-lg transition-colors text-slate-800 shrink-0">
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-8 py-8 overflow-y-auto flex-col flex gap-8">
          
          {/* Main Info Grid */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-7">
            
            {/* Status Row */}
            <div className="flex flex-col gap-2 col-span-2">
              <span className="text-[13px] font-semibold text-slate-500">Status</span>
              <div className="flex items-center gap-3">
                {renderStatusPill(leave.status)}
              </div>
              {leave.status === "Approved" && (
                <span className="text-[12px] text-gray-500 font-medium tracking-wide mt-1">
                  • Approved by {leave.approver || "Delizia"} at {leave.approvedAt || "12:23 PM | 13 Feb, 2026"}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-slate-500">Leave Applied On</span>
              <span className="text-[15px] font-bold text-[#2A374E]">{leave.appliedOn || "13 Feb, 2026 | 12:19 PM"}</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-slate-500">Leave Duration</span>
              <span className="text-[15px] font-bold text-[#2A374E]">{leave.dateStr}</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-slate-500">Total Leaves Availed</span>
              <span className="text-[15px] font-bold text-[#2A374E]">{duration}</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-slate-500">Leave Type</span>
              <span className="text-[15px] font-bold text-[#2A374E]">{type}</span>
            </div>

            <div className="flex flex-col gap-1.5 col-span-2">
              <span className="text-[13px] font-semibold text-slate-500">Leave Summary</span>
              <span className="text-[15px] font-bold text-[#2A374E] flex items-center before:content-['•'] before:mr-2 before:text-lg">
                {duration} {type}
              </span>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Description Section */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[13px] font-semibold text-slate-500">Description</span>
            <p className="text-[14px] font-medium text-[#2A374E] leading-relaxed bg-[#f8f9fa] p-5 rounded-xl border border-gray-100 whitespace-pre-wrap">
              {leave.description}
            </p>
          </div>

          {/* Attachments Section */}
          <div className="flex flex-col gap-3">
            <span className="text-[13px] font-semibold text-slate-500">Attachments</span>
            <div className="flex items-center justify-between border border-gray-200 rounded-xl p-3.5 w-full max-w-[450px] shadow-sm bg-white">
              <div className="flex items-center gap-3 w-full pr-4">
                <div className="w-[42px] h-[42px] bg-black rounded-lg shrink-0 flex items-center justify-center overflow-hidden">
                   {/* Dummy image representation */}
                </div>
                <div className="flex flex-col min-w-0 w-full">
                  <p className="text-[13px] font-bold text-slate-800 truncate" title="07kqtj3gma_capture_177096536494445764913022401136231895237157366696239.jpg">
                    07kqtj3gma_capture_1770965364944457...
                  </p>
                  <p className="text-[11px] font-medium text-gray-400 mt-0.5">2.4 MB</p>
                </div>
              </div>
              <button className="p-2 text-gray-500 hover:text-slate-800 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
                <DownloadIcon size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
