import React, { useState } from "react";
import { Hourglass, ChevronRight, ChevronDown } from "lucide-react";
import Image from "next/image";
import CloudIcon from "@/assets/Dashicons/Cloud.png";
import CustomDropdown from "./CustomDropdown";

export default function YtdStatementCard() {
  const [activeTab, setActiveTab] = useState("YTD Statement");
  const [selectedYear, setSelectedYear] = useState("2025 - 2026");

  const yearOptions = [
    { label: "2025 - 2026", value: "2025 - 2026" },
    { label: "2024 - 2025", value: "2024 - 2025" }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full min-h-[350px]">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600">
            <Hourglass size={20} />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">YTD Statement</h2>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-10">
          <div className="flex border border-gray-200 rounded-lg p-1 w-max">
            <button 
              className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${activeTab === 'YTD Statement' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-800'}`}
              onClick={() => setActiveTab('YTD Statement')}
            >
              YTD Statement
            </button>
            <button 
              className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${activeTab === 'PF YTD Statement' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-800'}`}
              onClick={() => setActiveTab('PF YTD Statement')}
            >
              PF YTD Statement
            </button>
          </div>
          <div className="relative w-[140px]">
            <CustomDropdown
              value={selectedYear}
              options={yearOptions}
              onChange={setSelectedYear}
              triggerClassName="bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg h-[34px] px-3 focus:border-[#3f5a54]"
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center pt-8 pb-4">
          <div className="relative mb-3">
            <Image src={CloudIcon} alt="No data found" className="h-[72px] w-auto object-contain" />
          </div>
          <p className="text-xs text-gray-400 font-medium">No data found</p>
        </div>
      </div>
    </div>
  );
}
