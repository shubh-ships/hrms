"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, Share2 } from "lucide-react";
import movebackIcon from '@/assets/Dashicons/move-back-icon.png';
import CustomDropdown from "./CustomDropdown";

export default function SalarySlipPage() {
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState("January");

  const yearOptions = [
    { label: "2026", value: "2026" },
    { label: "2025", value: "2025" },
  ];

  const monthOptions = [
    { label: "January", value: "January" },
    { label: "February", value: "February" },
    { label: "March", value: "March" },
    { label: "April", value: "April" },
    { label: "May", value: "May" },
    { label: "June", value: "June" },
    { label: "July", value: "July" },
    { label: "August", value: "August" },
    { label: "September", value: "September" },
    { label: "October", value: "October" },
    { label: "November", value: "November" },
    { label: "December", value: "December" },
  ];

  return (
    <div className="w-full min-h-screen bg-[#fcfcfc] p-4 lg:p-8">
      <div className="max-w-[1400px] mx-auto w-full">
        
        {/* Header Area */}
        <div className="mb-8">
          <Link href="/dashboard/dynamic/hrms/dashboard" className="inline-block mb-8 hover:opacity-80 transition-opacity">
            <Image src={movebackIcon} alt="Back" className="w-[80px]" />
          </Link>
          <h1 className="text-[22px] font-bold text-slate-800">Salary Slip</h1>
        </div>

        {/* Action Bar Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:px-6 md:py-4 w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Left Side: Selectors */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex flex-col gap-1.5 w-full md:w-[160px]">
              <label className="text-[11px] font-medium text-gray-500 tracking-wide px-1">Select Year</label>
              <CustomDropdown
                value={selectedYear}
                options={yearOptions}
                onChange={setSelectedYear}
                triggerClassName="bg-white border border-gray-200 text-gray-600 text-[13px] font-medium rounded-lg h-[38px] px-3 focus:outline-none focus:border-[#3f5a54] hover:bg-gray-50/50"
              />
            </div>
            <div className="flex flex-col gap-1.5 w-full md:w-[160px]">
              <label className="text-[11px] font-medium text-gray-500 tracking-wide px-1">Select Month</label>
              <CustomDropdown
                value={selectedMonth}
                options={monthOptions}
                onChange={setSelectedMonth}
                triggerClassName="bg-white border border-gray-200 text-gray-600 text-[13px] font-medium rounded-lg h-[38px] px-3 focus:outline-none focus:border-[#3f5a54] hover:bg-gray-50/50"
              />
            </div>
          </div>

          {/* Right Side: Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#3e554d] text-white px-5 py-2 rounded-[8px] text-[13px] font-semibold hover:bg-[#344641] shadow-sm transition-colors mt-2 md:mt-4">
              <Download size={16} strokeWidth={2.5} className="mr-0.5" /> Download
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-slate-700 border border-gray-300 px-5 py-2 rounded-[8px] text-[13px] font-semibold hover:bg-gray-50 transition-colors mt-2 md:mt-4">
              <Share2 size={16} strokeWidth={2.5} className="mr-0.5 text-gray-500" /> Share
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
