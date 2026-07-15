"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MoveLeft, CalendarDays } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import groupDecor from "@/assets/Dashicons/groupDecor.png";
import Cloud from "@/assets/Dashicons/Cloud.png";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    fetchUpcomingJoiners,
    selectNewJoinees,
    selectNewJoineesLoading,
    selectNewJoineesError
} from "@/features/newJoinees/newJoineesSlice";
import { getInitials } from "@/lib/utils";

export default function NewJoinees() {
    const dispatch = useAppDispatch();
    const router = useRouter();

    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        const from = new Date();
        const to = new Date();
        to.setDate(to.getDate() + 15);
        return { from, to };
    });

    const joinees = useAppSelector(selectNewJoinees);
    const loading = useAppSelector(selectNewJoineesLoading);
    const error = useAppSelector(selectNewJoineesError);

    useEffect(() => {
        const params: any = {};
        if (dateRange?.from) {
            params.startDate = dateRange.from.toISOString().split('T')[0];
        }
        if (dateRange?.to) {
            params.endDate = dateRange.to.toISOString().split('T')[0];
        }

        dispatch(fetchUpcomingJoiners(params));
    }, [dispatch, dateRange]);

    const formatDate = (date?: Date) => {
        if (!date) return "";
        return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    };

    return (
        <div className="bg-[#F8FAFC] mx-[40px] mb-[150px] font-sans flex flex-col relative">

            <div className="flex mt-[24px] h-[69px] w-[24px]">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-[#4B5563] hover:text-[#1F2937] transition-colors text-[13px] font-medium"
                >
                    <MoveLeft className="h-4 w-4" />
                    <span>Back</span>
                </button>
            </div>

            {/* MAIN CARD */}
            <div className="flex mt-[20px] min-h-[728px] h-auto bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden relative">

                {/* HEADER */}
                <div className="absolute top-0 left-0 right-0 flex items-start justify-between px-[20px] pt-[24px]">
                    <div>
                        <h2 className="text-[16px] font-medium text-[#1F2937]">New Joinees</h2>
                        <p className="text-[10px] text-[#4B5563] mt-[4px]">New employees joining your firm or organisation</p>
                    </div>

                    {/* Date Range Picker */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg h-[28px] w-[180px] flex items-center justify-center gap-[9px] shadow-sm cursor-pointer hover:bg-gray-50 transition-all">
                                <CalendarDays className="h-[15px] w-[15px] text-[#4B5563] shrink-0" />
                                <span className="whitespace-nowrap text-[10px] h-[15px] w-[130px] font-regular text-[#000000]">
                                    {dateRange?.from
                                        ? dateRange.to
                                            ? `${dateRange.from.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - ${dateRange.to.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                                            : dateRange.from.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                        : 'Select range'}
                                </span>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <CalendarUI
                                mode="range"
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={1}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* CONTENT */}
                <div className="pt-[80px] w-full pb-10 overflow-y-auto flex-1 flex flex-col">
                    {loading ? (
                        <div className="flex-1 w-full flex flex-col items-center justify-center pt-20">
                            <span className="text-gray-400 text-sm">Loading new joinees...</span>
                        </div>
                    ) : error ? (
                        <div className="flex-1 w-full flex flex-col items-center justify-center pt-20 px-4 text-center">
                            <span className="text-red-500 text-sm">{error}</span>
                        </div>
                    ) : joinees.length > 0 ? (
                        joinees.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center mx-[24px] h-[64px] mt-[16px] rounded-2xl border border-[#E2E8F0] bg-white px-[20px]"
                            >
                                {/* Avatar + Name */}
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="h-[30px] w-[30px] shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-100 flex items-center justify-center text-[10px] font-bold text-[#3F5A54]">
                                        {item.avatar ? (
                                            <img src={item.avatar} alt={item.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <span>{getInitials(item.name)}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-[2px]">
                                        <p className="text-[12px] font-medium text-[#1F2937]">{item.name}</p>
                                        <p className="text-[10px] text-[#9CA3AF]">{item.role}</p>
                                    </div>
                                </div>

                                <div className="flex-1 text-left">
                                    <p className="text-[12px] text-[#3F5A54] font-medium">{item.team}</p>
                                </div>

                                <div className="w-[134px] text-left">
                                    <p className="text-[12px] text-[#000000] font-medium">Joined {item.joinDate}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        /* EMPTY STATE */
                        <div className="flex-1 w-full flex flex-col items-center justify-center select-none">
                            <div className="flex flex-col items-center justify-center -mt-20">
                                <Image src={Cloud} alt="no data" width={85} height={85} className="mb-2 opacity-50" priority />
                                <span className="text-[#9CA3AF] text-[7px] font-regular">No data found</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* DECORATION IMAGE */}
                <div className="absolute bottom-[50px] right-[81px] opacity-50 pointer-events-none">
                    <Image
                        src={groupDecor}
                        alt="decoration"
                        width={175}
                        height={122}
                        className="object-contain"
                    />
                </div>
            </div>
        </div>
    );
}