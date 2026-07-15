"use client";

import React, { useState } from "react";
import { X, ChevronDown, Check, UploadCloud, Eye, Download as DownloadIcon, Calendar } from "lucide-react";
import CustomDropdown from "./CustomDropdown";

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApplyLeaveModal({ isOpen, onClose }: ApplyLeaveModalProps) {
  const [leaveType, setLeaveType] = useState("");
  const [date, setDate] = useState("");
  const [sessionDisplay, setSessionDisplay] = useState("Not Selected");
  const [description, setDescription] = useState("");
  
  const [isSessionBoxOpen, setIsSessionBoxOpen] = useState(false);
  const [session1Start, setSession1Start] = useState(false);
  const [session2Start, setSession2Start] = useState(false);
  const [session1End, setSession1End] = useState(false);
  const [session2End, setSession2End] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-[500px] my-auto relative flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-7 pb-4 shrink-0">
          <h2 className="text-[24px] font-bold text-[#1f2937]">Apply Leave</h2>
          <button onClick={onClose} className="p-1.5 bg-gray-100/80 hover:bg-gray-200 rounded-lg transition-colors text-slate-800">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="px-7 py-2 overflow-y-auto flex-1 flex flex-col gap-6">
          
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-semibold text-slate-500">Select Leave Type</label>
            <CustomDropdown
               value={leaveType}
               options={[{label: "Sick Leave", value: "Sick Leave"}, {label: "Casual Leave", value: "Casual Leave"}]}
               onChange={setLeaveType}
               triggerClassName="w-full bg-white border border-[#e5e7eb] text-slate-400 text-[14px] font-medium rounded-[10px] h-[48px] px-4 focus:border-gray-300"
               placeholder="Not Selected"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-semibold text-slate-500">Select Date</label>
            <div className="relative w-full">
              <input 
                type={date ? "date" : "text"}
                value={date}
                placeholder="Not Selected"
                onFocus={(e) => { e.target.type = 'date'; e.target.showPicker && e.target.showPicker(); }}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-[#e5e7eb] text-slate-400 placeholder-slate-400 text-[14px] font-medium rounded-[10px] h-[48px] px-4 outline-none focus:border-gray-300 appearance-none pr-10"
              />
              {!date && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Calendar size={20} strokeWidth={2} />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 relative">
            <label className="text-[12px] font-semibold text-slate-500">Select Session</label>
            <button
               onClick={() => setIsSessionBoxOpen(!isSessionBoxOpen)}
               className="w-full flex items-center justify-between border border-[#e5e7eb] rounded-[10px] h-[48px] px-4 bg-[#f8f9fa] hover:border-gray-300 transition-colors"
            >
               <span className="text-[14px] font-medium text-slate-400">{sessionDisplay}</span>
               <ChevronDown size={20} strokeWidth={2.5} className={`text-slate-400 transition-transform ${isSessionBoxOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Session Selection Box */}
            {isSessionBoxOpen && (
              <div className="mt-2 bg-[#f4f5f7] border border-gray-200 rounded-xl p-4 flex flex-col gap-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                <p className="text-[14px] font-semibold text-slate-700">Select session for start date and end date</p>
                
                <div className="flex flex-col gap-2">
                  <p className="text-[14px] font-semibold text-slate-800">Start Date: 13 Feb, 2026</p>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <label className="flex items-center justify-between px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50">
                      <span className="text-[14px] text-slate-700">Session 1</span>
                      <input type="checkbox" checked={session1Start} onChange={(e) => setSession1Start(e.target.checked)} className="w-4 h-4 accent-[#3f5a54]" />
                    </label>
                    <label className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50">
                      <span className="text-[14px] text-slate-700">Session 2</span>
                      <input type="checkbox" checked={session2Start} onChange={(e) => setSession2Start(e.target.checked)} className="w-4 h-4 accent-[#3f5a54]" />
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-[14px] font-semibold text-slate-800">End Date: 13 Feb, 2026</p>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <label className="flex items-center justify-between px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50">
                      <span className="text-[14px] text-slate-700">Session 1</span>
                      <input type="checkbox" checked={session1End} onChange={(e) => setSession1End(e.target.checked)} className="w-4 h-4 accent-[#3f5a54]" />
                    </label>
                    <label className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50">
                      <span className="text-[14px] text-slate-700">Session 2</span>
                      <input type="checkbox" checked={session2End} onChange={(e) => setSession2End(e.target.checked)} className="w-4 h-4 accent-[#3f5a54]" />
                    </label>
                  </div>
                </div>

                <button 
                  onClick={() => setIsSessionBoxOpen(false)}
                  className="w-full bg-[#d0d3db] hover:bg-[#b0b3bf] text-slate-800 font-bold py-3 rounded-lg mt-2 transition-colors"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-semibold text-slate-500">Enter Description</label>
            <input 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter Description"
              className="w-full bg-white border border-[#e5e7eb] placeholder-slate-400 text-slate-800 text-[14px] font-medium rounded-[10px] h-[48px] px-4 outline-none focus:border-gray-300"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-semibold text-slate-500">Attachment</span>
            
            <div className="border-[1.5px] border-dashed border-[#556977] bg-[#f0f4ff] rounded-[8px] flex flex-col items-center justify-center py-7 hover:bg-[#e6ebf7] transition-colors cursor-pointer">
              <UploadCloud size={30} className="text-[#556977] mb-2" strokeWidth={1} />
              <p className="text-[15px] font-medium text-[#1f2937] mb-1">Drag & drop files or <span className="font-semibold text-[#556977]">Upload file</span></p>
              <p className="text-[10px] text-slate-400 text-center max-w-[300px] leading-[1.6]">
                [Supported formates: JPEG, PNG, GIF, MP4, PDF, PSD, AI, Word, PPT]<br/>
                Maximum upload file size is 20 MB.
              </p>
            </div>

            {/* Dummy Attachment Items */}
            <div className="flex flex-col gap-2 mt-3">
              <div className="flex items-center justify-between bg-[#f4f5f7] border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded text-blue-500 flex items-center justify-center shrink-0 font-bold border border-blue-200">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-800 leading-tight mb-0.5">Account Details Pagar.xlsx</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">600 KB of 600 KB</span>
                      <span className="text-[10px] text-[#22c55e] font-semibold">Uploaded</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <button className="p-1 hover:text-gray-800 transition-colors"><Eye size={18} /></button>
                  <button className="p-1 hover:text-gray-800 transition-colors"><DownloadIcon size={18} /></button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-1 mt-2 mb-2">
            <span className="text-[14px] font-semibold text-gray-400">Leave Duration</span>
            <span className="text-[14px] font-bold text-slate-800">1 Day</span>
          </div>

          <div className="flex flex-col gap-1 mb-2">
            <span className="text-[14px] font-semibold text-gray-400">Leave Summary</span>
            <span className="text-[14px] font-bold text-slate-800 flex items-center before:content-['•'] before:mr-2 before:text-lg">1 Sick Leave</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-6 border-t border-gray-100 shrink-0">
          <button 
            type="button"
            className="w-full bg-[#f1f5f9] text-[#94a3b8] font-bold text-[16px] py-4 rounded-[10px] hover:bg-[#e2e8f0] transition-colors"
          >
            Send for Approval
          </button>
        </div>

      </div>
    </div>
  );
}
