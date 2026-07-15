"use client";

import React, { useState } from "react";
import { X, Calendar } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BroadcastFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (date: Date | undefined) => {
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  return `${day} ${month} '${year}`;
};

export default function BroadcastFilterModal({ isOpen, onClose }: BroadcastFilterModalProps) {
  const [selectedRange, setSelectedRange] = useState("This Month");
  const [selectedSort, setSelectedSort] = useState("Newest to Oldest (Newest First)");
  
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  
  const [fromCalendarOpen, setFromCalendarOpen] = useState(false);
  const [toCalendarOpen, setToCalendarOpen] = useState(false);

  const sortOptions = [
    "Newest to Oldest (Newest First)",
    "Oldest to Newest (Oldest First)",
    "Unread First",
    "By Sender Name (A to Z)"
  ];

  const handleRangeSelect = (range: string) => {
    setSelectedRange(range);
    const today = new Date();
    
    if (range === "Today") {
      setFromDate(today);
      setToDate(today);
    } else if (range === "This week") {
      const dayOfWeek = today.getDay() || 7;
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek + 1);
      
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (7 - dayOfWeek));
      
      setFromDate(startOfWeek);
      setToDate(endOfWeek);
    } else if (range === "This Month") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setFromDate(startOfMonth);
      setToDate(endOfMonth);
    }
  };

  const handleClear = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setSelectedRange("");
    setSelectedSort("Newest to Oldest (Newest First)");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[20px] shadow-xl w-full max-w-[500px] flex flex-col overflow-visible animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 bg-white rounded-t-[20px]">
          <h2 className="text-[18px] font-bold text-slate-800">Filter By</h2>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-slate-500"
          >
            <X size={20} className="stroke-[2.5px]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-7 bg-white flex flex-col gap-8">
          
          {/* Date Range Section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[14px] font-semibold text-slate-600">Date Range</h3>
            
            <div className="flex gap-4">
              <div className="flex flex-col gap-2 flex-1 group cursor-pointer">
                <label className="text-[13px] font-semibold text-slate-500 cursor-pointer group-hover:text-slate-700 transition-colors">From</label>
                <Popover open={fromCalendarOpen} onOpenChange={setFromCalendarOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Select Date" 
                        value={formatDate(fromDate)}
                        readOnly
                        className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-[14px] font-semibold text-slate-800 group-hover:border-[#3f5a54] transition-all bg-white cursor-pointer outline-none focus:border-[#3f5a54]"
                      />
                      <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-[#3f5a54] transition-colors" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[110]" align="start">
                    <CalendarUI
                      mode="single"
                      selected={fromDate}
                      onSelect={(date) => {
                        if (date) {
                          setFromDate(date);
                          setFromCalendarOpen(false);
                          setSelectedRange("");
                        }
                      }}
                      initialFocus
                      className="[&_[data-selected-single=true]]:bg-[#3f5a54] [&_[data-selected-single=true]]:text-white hover:[&_[data-selected-single=true]]:bg-[#2c403b] [&_[data-selected-single=true]:focus]:bg-[#3f5a54] [&_[data-selected-single=true]:focus]:text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-2 flex-1 group cursor-pointer">
                <label className="text-[13px] font-semibold text-slate-500 cursor-pointer group-hover:text-slate-700 transition-colors">To</label>
                <Popover open={toCalendarOpen} onOpenChange={setToCalendarOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Select Date" 
                        value={formatDate(toDate)}
                        readOnly
                        className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-[14px] font-semibold text-slate-800 group-hover:border-[#3f5a54] transition-all bg-white cursor-pointer outline-none focus:border-[#3f5a54]"
                      />
                      <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-[#3f5a54] transition-colors" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[110]" align="end">
                    <CalendarUI
                      mode="single"
                      selected={toDate}
                      onSelect={(date) => {
                        if (date) {
                          setToDate(date);
                          setToCalendarOpen(false);
                          setSelectedRange("");
                        }
                      }}
                      initialFocus
                      className="[&_[data-selected-single=true]]:bg-[#3f5a54] [&_[data-selected-single=true]]:text-white hover:[&_[data-selected-single=true]]:bg-[#2c403b] [&_[data-selected-single=true]:focus]:bg-[#3f5a54] [&_[data-selected-single=true]:focus]:text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Quick Select Pills */}
            <div className="flex items-center gap-3 mt-1 pl-0.5">
              {["Today", "This week", "This Month"].map(range => (
                <button
                  key={range}
                  onClick={() => handleRangeSelect(range)}
                  className={`px-5 py-1.5 rounded-full text-[13px] font-semibold transition-all border ${
                    selectedRange === range 
                    ? 'bg-[#3f5a54] text-white border-[#3f5a54]' 
                    : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full h-px bg-gray-100"></div>

          {/* Sort By Section */}
          <div className="flex flex-col gap-3">
            <h3 className="text-[14px] font-semibold text-slate-600">Sort By</h3>
            
            <Select value={selectedSort} onValueChange={setSelectedSort}>
              <SelectTrigger className="w-full border-gray-200 rounded-xl px-4 py-6 text-[14px] font-semibold text-slate-800 bg-white ring-0 focus:ring-0 focus:ring-offset-0 focus:border-[#3f5a54] hover:border-[#3f5a54] transition-all">
                <SelectValue placeholder="Select sorting option" />
              </SelectTrigger>
              <SelectContent className="z-[110] rounded-xl border border-gray-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1)]">
                {sortOptions.map(option => (
                  <SelectItem 
                    key={option} 
                    value={option}
                    className={`py-3.5 px-5 text-[14px] font-semibold cursor-pointer focus:bg-[#3f5a54]/5 focus:text-[#3f5a54] ${selectedSort === option ? 'text-[#3f5a54]' : 'text-slate-700'}`}
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
        </div>

        {/* Footer */}
        <div className="px-7 py-6 border-t border-gray-100 bg-white rounded-b-[20px] flex items-center justify-between gap-5 relative z-10">
          <button 
            onClick={handleClear}
            className="flex-1 py-3.5 border-2 border-gray-200 text-[#3f5a54] rounded-xl text-[14.5px] font-bold hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            Clear Filter
          </button>
          <button 
            onClick={onClose}
            className="flex-1 py-3.5 bg-[#3f5a54] text-white rounded-xl text-[14.5px] font-bold hover:bg-[#2c403b] shadow-sm transition-all shadow-[#3f5a54]/20"
          >
            Apply Filter
          </button>
        </div>

      </div>
    </div>
  );
}
