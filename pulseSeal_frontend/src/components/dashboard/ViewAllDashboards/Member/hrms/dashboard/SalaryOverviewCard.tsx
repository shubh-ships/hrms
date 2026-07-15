"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, CalendarDays } from "lucide-react";
import Link from "next/link";
import CustomDropdown from "./CustomDropdown";

export default function SalaryOverviewCard() {
  const [expandedSection, setExpandedSection] = useState<string | null>("Earnings");
  const [selectedMonth, setSelectedMonth] = useState("January, 2026");

  const monthOptions = [
    { label: "January, 2026", value: "January, 2026" },
    { label: "February, 2026", value: "February, 2026" },
    { label: "December, 2025", value: "December, 2025" }
  ];

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col w-full h-full">
      <div className="p-5 border-b border-gray-100 flex items-center gap-3">
        <div className="bg-orange-100 p-2 rounded-lg text-orange-500">
          <CalendarDays size={20} />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Salary Overview</h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-[34px]">
          <div className="col-span-1 md:col-span-1 min-w-[130px]">
            <CustomDropdown
              value={selectedMonth}
              options={monthOptions}
              onChange={setSelectedMonth}
              triggerClassName="font-semibold text-gray-900 border-none bg-transparent hover:opacity-80 p-0 h-auto"
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Due Amount</p>
            <p className="font-semibold text-gray-900 text-sm">₹ 0</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Net Receivable</p>
            <p className="font-semibold text-gray-900 text-sm">₹ 0</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Date Range</p>
            <p className="font-semibold text-gray-900 text-sm">01 Jan&apos;26 - 21 Jan&apos;26</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Payable Days</p>
            <p className="font-semibold text-gray-900 text-sm">0</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          <SectionBox
            title="Earnings"
            amount="₹ 0"
            isExpanded={expandedSection !== "Earnings"}
            onClick={() => toggleSection("Earnings")}
            details={<div className="flex justify-between items-center text-sm"><span className="text-gray-600">Basic</span><span className="text-gray-400">₹ 0</span></div>}
          />
          <SectionBox
            title="Deductions"
            amount="₹ 0"
            isExpanded={false}
          />
          <SectionBox
            title="Payments"
            amount="₹ 0"
            isExpanded={false}
          />
          <SectionBox
            title="Adjustments"
            amount="₹ 0"
            isExpanded={false}
          />
        </div>
      </div>
    </div>
  );
}

function SectionBox({ title, amount, isExpanded, onClick, details }: { title: string, amount: string, isExpanded: boolean, onClick?: () => void, details?: React.ReactNode }) {
  return (
    <div className={`rounded-lg border-b transition-all duration-200 ${isExpanded ? 'bg-gray-100/50 border-gray-200' : `bg-gray-100 border-transparent ${onClick ? 'hover:bg-gray-200/50' : ''}`}`}>
      <div
        className={`px-4 py-4 flex justify-between items-center select-none ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">{amount}</span>
          {onClick && (isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />)}
        </div>
      </div>

      {isExpanded && details && (
        <div className="px-4 pb-3 pt-1 border-t border-gray-200/50 mt-1">
          {details}
          <div className="mt-4 text-right">
            <Link href="/dashboard/dynamic/hrms/salary-overview">
              <button className="text-sm font-medium text-[#3f5a54] hover:text-black">View Detail</button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
