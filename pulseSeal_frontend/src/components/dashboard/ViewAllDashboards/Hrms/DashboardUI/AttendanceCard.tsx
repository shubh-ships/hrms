"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { CalendarDays, ChevronLeft, ChevronRight, Eye, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";

interface Stat {
    label: string;
    value: string | number;
}

interface Props {
    stats: Stat[];
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    url?: string;
}

const AttendanceCard: React.FC<Props & { className?: string }> = ({ stats, selectedDate, onDateChange, url = "/dashboard/admin/hrms/detailedAttendence", className }) => {
    const router = useRouter();

    const prevDay = () => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 1);
        onDateChange(prev);
    };

    const nextDay = () => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);
        onDateChange(next);
    };

    const formattedDate = selectedDate.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <Card className={`bg-white p-0 rounded-xl shadow-sm border border-[#E5E7EB] overflow-hidden flex flex-col ${className || 'w-[825px] h-[159px]'}`}>

            <div className="flex items-center justify-between px-[20px] h-[72px] border-b border-[#E5E7EB]">
                <div className="flex items-center gap-[16px]">
                    <div className="h-[36px] w-[36px] rounded-[8px] bg-[#DCDDFD] flex items-center justify-center">
                        <User className="h-[20px] w-[20px] text-[#6366F1]" />
                    </div>
                    <h2 className="text-[16px] font-medium text-[#1F2937]">Attendance</h2>
                </div>

                <div className="flex items-center gap-[24px]">
                    <div className="flex items-center justify-center h-[28px] w-[141px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[8px] px-[10px]">
                        <Popover>
                            <PopoverTrigger asChild>
                                <CalendarDays className="h-[14px] w-[14px] text-[#4B5563] cursor-pointer" />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <CalendarUI
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(d) => d && onDateChange(d)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <div className="flex items-center gap-[6px] flex-1 justify-center">
                            <ChevronLeft className="h-[12px] w-[12px] text-[#4B5563] cursor-pointer" onClick={prevDay} />
                            <Popover>
                                <PopoverTrigger asChild>
                                    <span className="text-[10px] font-medium text-[#1F2937] w-[60px] text-center cursor-pointer hover:underline">{formattedDate}</span>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="center">
                                    <CalendarUI
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(d) => d && onDateChange(d)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <ChevronRight className="h-[12px] w-[12px] text-[#4B5563] cursor-pointer" onClick={nextDay} />
                        </div>
                    </div>


                    <button
                        onClick={() => router.push(url)}
                        className="flex items-center h-[30px] w-[150px] justify-center gap-[10px] text-[10px] font-medium text-[#374151] border border-[#374151] rounded-[8px] hover:bg-gray-50 transition-colors"
                    >
                        Detailed Attendance
                        <Eye className="h-[16px] w-[16px]" />
                    </button>
                </div>
            </div>

            <div className="flex items-center px-[20px]">
                <div className="flex w-full gap-[80px]">
                    {stats.map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-[8px]">
                            <p className="text-[10px] text-[#4B5563] font-normal flex items-center gap-[6px]">
                                {item.label}
                                <span className="text-[10px] text-[#4B5563]">ⓘ</span>
                            </p>
                            <p className="text-[10px] font-medium text-[#000000]">{item.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};

export default AttendanceCard;
