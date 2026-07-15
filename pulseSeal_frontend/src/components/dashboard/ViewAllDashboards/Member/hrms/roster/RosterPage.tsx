"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarDays } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, subMonths, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, subDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

type LayoutView = "Day" | "Week" | "Month";

export default function RosterPage() {
  const [view, setView] = useState<LayoutView>("Month");
  // Set initial date to match exactly with the mockups
  const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 19)); 

  const nextDate = () => {
    if (view === "Day") setCurrentDate(addDays(currentDate, 1));
    if (view === "Week") setCurrentDate(addDays(currentDate, 7));
    if (view === "Month") setCurrentDate(addMonths(currentDate, 1));
  };

  const prevDate = () => {
    if (view === "Day") setCurrentDate(addDays(currentDate, -1));
    if (view === "Week") setCurrentDate(addDays(currentDate, -7));
    if (view === "Month") setCurrentDate(subMonths(currentDate, 1));
  };

  const renderDateLabel = () => {
    if (view === "Day") {
      return format(currentDate, "dd MMM yyyy");
    } else if (view === "Week") {
      const start = currentDate;
      const end = addDays(start, 6);
      return `${format(start, "dd MMM yyyy")} - ${format(end, "dd MMM yyyy")}`;
    } else if (view === "Month") {
      return format(currentDate, "MMM yyyy");
    }
  };

  const renderDayView = () => {
    const times = [
      "09:30 AM", "10:30 AM", "11:30 AM", "12:30 PM", 
      "01:30 PM", "02:30 PM", "03:30 PM", "04:30 PM", 
      "05:30 PM", "06:30 PM"
    ];

    return (
      <div className="w-full bg-white rounded-[12px] border border-gray-200 p-6 flex flex-col gap-8 shadow-sm">
        {times.map((time, index) => (
          <div key={index} className="flex flex-row items-center w-full group">
            <span className="text-[11px] font-medium text-gray-500 w-[70px] flex-shrink-0">
              {time}
            </span>
            <div className="flex-1 border-t border-gray-200 mt-[2px] ml-4 group-hover:border-gray-300 transition-colors" />
          </div>
        ))}
      </div>
    );
  };

  const renderWeekView = () => {
    const times = [
      "09:30 AM", "10:30 AM", "11:30 AM", "12:30 PM", 
      "01:30 PM", "02:30 PM", "03:30 PM", "04:30 PM", 
      "05:30 PM", "06:30 PM"
    ];

    const dynamicDays = Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(currentDate, i);
      return {
        name: format(date, "EEEE"),
        date: format(date, "dd"),
      };
    });

    return (
      <div className="w-full bg-white rounded-[12px] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Header Row */}
        <div className="flex flex-row bg-[#F8FAFC] border-b border-gray-200">
          <div className="w-[120px] shrink-0 border-r border-gray-200 p-4 flex items-center justify-center">
            <span className="text-[11px] text-gray-500 font-medium">Date & Time</span>
          </div>
          {dynamicDays.map((day, idx) => (
            <div key={idx} className="flex-1 min-w-[100px] border-r last:border-r-0 border-gray-200 p-4 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 text-[11px] text-gray-500">
                <span>{day.name}</span>
                <span className="font-medium text-gray-700">{day.date}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Time Rows */}
        {times.map((time, timeIdx) => (
          <div key={timeIdx} className="flex flex-row border-b last:border-b-0 border-gray-200">
            <div className="w-[120px] shrink-0 border-r border-gray-200 p-4 flex items-center justify-center">
              <span className="text-[11px] text-gray-500 font-medium">{time}</span>
            </div>
            {dynamicDays.map((_, dayIdx) => (
              <div 
                key={dayIdx} 
                className="flex-1 min-w-[100px] border-r last:border-r-0 border-gray-200 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                style={{ height: "60px" }} // Give it some cell height
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "dd";
    const days = eachDayOfInterval({
      start: startDate,
      end: endDate
    });

    const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    return (
      <div className="w-full bg-white rounded-[12px] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Header Row */}
        <div className="grid grid-cols-7 bg-[#F8FAFC] border-b border-gray-200">
          {weekDays.map((day, idx) => (
            <div key={idx} className="p-4 border-r last:border-r-0 border-gray-200 text-[11px] text-gray-500 font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            return (
              <div 
                key={idx} 
                className={`min-h-[140px] p-4 border-r border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors
                  ${idx % 7 === 6 ? 'border-r-0' : ''}
                  ${idx >= days.length - 7 ? 'border-b-0' : ''}
                `}
              >
                <div className="flex flex-col">
                  <span className={`text-[12px] font-medium ${isCurrentMonth ? 'text-gray-900' : 'text-gray-300'}`}>
                    {format(day, dateFormat)}
                  </span>
                  {/* Events will go here */}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 lg:p-8">
      <div className="max-w-[1400px] mx-auto w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Roster</h1>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
          {/* View Tabs */}
          <div className="flex items-center p-1 bg-white border border-gray-100 rounded-[12px] w-fit shadow-sm">
            {(["Day", "Week", "Month"] as LayoutView[]).map((t) => (
              <button
                key={t}
                onClick={() => setView(t)}
                className={`px-6 py-2 rounded-[8px] text-[13px] transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none appearance-none select-none border
                  ${view === t ? "bg-white font-semibold text-gray-900 shadow-sm border-gray-100" : "border-transparent text-gray-500 font-medium hover:text-gray-700"}
                `}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Date Picker (Mockup matching) */}
          <div className="flex items-center bg-white border border-gray-100 rounded-[12px] px-2 py-1.5 shadow-sm w-fit gap-1.5">
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-1 hover:bg-gray-100 rounded-md transition-colors cursor-pointer">
                  <CalendarDays className="w-4 h-4 text-gray-500" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                {view === "Month" ? (
                  <div className="p-3 w-fit">
                    <div className="flex justify-between items-center mb-4 px-2">
                       <button onClick={() => setCurrentDate(subMonths(currentDate, 12))} className="p-1 hover:bg-gray-100 rounded-md outline-none focus:outline-none">
                         <ChevronLeft className="w-4 h-4 text-gray-500" />
                       </button>
                       <span className="text-sm font-medium">{format(currentDate, "yyyy")}</span>
                       <button onClick={() => setCurrentDate(addMonths(currentDate, 12))} className="p-1 hover:bg-gray-100 rounded-md outline-none focus:outline-none">
                         <ChevronRight className="w-4 h-4 text-gray-500" />
                       </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => {
                        const isSelected = i === currentDate.getMonth();
                        return (
                          <button
                            key={m}
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), i, 1))}
                            className={`px-3 py-2 text-sm rounded-md transition-colors outline-none focus:outline-none ${isSelected ? 'bg-[#3f5a54] text-white hover:bg-[#3f5a54]/90' : 'hover:bg-gray-100 text-gray-700'}`}
                          >
                            {m}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={(date) => date && setCurrentDate(date)}
                    initialFocus
                    className="[&_[data-selected-single=true]]:bg-[#3f5a54] [&_[data-selected-single=true]]:text-white [&_[data-selected-single=true]:hover]:bg-[#3f5a54]/90"
                  />
                )}
              </PopoverContent>
            </Popover>
            <button onClick={prevDate} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-[13px] font-medium text-gray-700 px-1 text-center hover:text-gray-900 transition-colors py-1 cursor-pointer">
                  {renderDateLabel()}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                {view === "Month" ? (
                  <div className="p-3 w-fit">
                    <div className="flex justify-between items-center mb-4 px-2">
                       <button onClick={() => setCurrentDate(subMonths(currentDate, 12))} className="p-1 hover:bg-gray-100 rounded-md outline-none focus:outline-none">
                         <ChevronLeft className="w-4 h-4 text-gray-500" />
                       </button>
                       <span className="text-sm font-medium">{format(currentDate, "yyyy")}</span>
                       <button onClick={() => setCurrentDate(addMonths(currentDate, 12))} className="p-1 hover:bg-gray-100 rounded-md outline-none focus:outline-none">
                         <ChevronRight className="w-4 h-4 text-gray-500" />
                       </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => {
                        const isSelected = i === currentDate.getMonth();
                        return (
                          <button
                            key={m}
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), i, 1))}
                            className={`px-3 py-2 text-sm rounded-md transition-colors outline-none focus:outline-none ${isSelected ? 'bg-[#3f5a54] text-white hover:bg-[#3f5a54]/90' : 'hover:bg-gray-100 text-gray-700'}`}
                          >
                            {m}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={(date) => date && setCurrentDate(date)}
                    initialFocus
                    className="[&_[data-selected-single=true]]:bg-[#3f5a54] [&_[data-selected-single=true]]:text-white [&_[data-selected-single=true]:hover]:bg-[#3f5a54]/90"
                  />
                )}
              </PopoverContent>
            </Popover>
            <button onClick={nextDate} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="w-full mt-4">
          {view === "Day" && renderDayView()}
          {view === "Week" && renderWeekView()}
          {view === "Month" && renderMonthView()}
        </div>

      </div>
    </div>
  );
}
