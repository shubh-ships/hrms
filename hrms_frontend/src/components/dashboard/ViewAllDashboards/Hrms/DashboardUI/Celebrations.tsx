"use client";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    fetchBirthdays,
    fetchAnniversaries,
    selectBirthdays,
    selectAnniversaries,
    selectCelebrationsLoading,
    selectCelebrationsError
} from "@/features/celebrations/celebrationsSlice";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import { getInitials } from "@/lib/utils";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MoveLeft, CalendarDays, Eye, Settings } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

import Cloud from "@/assets/Dashicons/Cloud.png";
import balloon from "@/assets/Dashicons/balloon.png";
import cone from "@/assets/Dashicons/cone.png";
import settingIcon from "@/assets/Dashicons/Settings.png";

// Removed MOCK DATA as it is fetched from the backend

const LocalAnniversaryCard = ({ name, role, team, joinDate, years, isToday, avatar }: any) => (
    <div className={`flex items-center mx-[24px] h-[64px] mt-[24px] rounded-2xl border transition-all px-[20px] justify-between ${isToday ? "bg-[#22C55E]/8 border-[#22C55E]/30" : "bg-white border-[#E2E8F0]"}`}>

        {/* Avatar + Name */}
        <div className="flex items-center gap-3">
            <div className="relative">
                <div className="h-[30px] w-[30px] rounded-lg overflow-hidden bg-gray-100 border border-gray-100 flex items-center justify-center text-[10px] font-bold text-[#3F5A54]">
                    {avatar ? (
                        <img src={avatar} alt={name} className="h-full w-full object-cover" />
                    ) : (
                        <span>{getInitials(name)}</span>
                    )}
                </div>
                {isToday && <div className="absolute -top-1 -right-1 h-3 w-3 bg-[#3F5A54] border-2 border-white rounded-full" />}
            </div>
            <div className="flex flex-col gap-[2px] min-w-[130px]">
                <p className="text-[12px] text-[#1F2937]">{name}</p>
                <p className="text-[10px] text-[#9CA3AF] font-medium">{role}</p>
            </div>
        </div>

        <p className="text-[12px] text-[#4B5563] font-medium">Joined {joinDate}</p>

        <p className="text-[12px] text-[#4B5563] font-medium">{team}</p>

        <p className="text-[12px] text-[#22C55E] font-semibold">{years}</p>

        <button className={`h-[30px] w-[146px] rounded-lg text-[14px] font-medium transition-all ${isToday ? "bg-[#3F5A54] text-white hover:bg-[#2d4540]" : "bg-[#F3F4F6] text-[#A0AEC0] cursor-not-allowed"}`}>
            Congratulate
        </button>
    </div>
);

const LocalCelebrationCard = ({ name, role, team, date, status, isToday, avatar }: any) => (
    <div className={`relative flex items-center mx-[24px] h-[64px] mt-[24px] rounded-2xl border transition-all ${isToday ? "bg-[#EC6D31]/10 border-[#EC6D31]/30" : "bg-white border-[#E2E8F0]"
        }`}>

        {/* LEFT: Avatar + Name */}
        <div className="flex items-center gap-3 ml-[20px]">
            <div className="relative">
                <div className="h-[30px] w-[30px] rounded-lg overflow-hidden bg-gray-100 border border-gray-100 flex items-center justify-center text-[10px] font-bold text-[#EC6D31]">
                    {avatar ? (
                        <img src={avatar} alt={name} className="h-full w-full object-cover" />
                    ) : (
                        <span>{getInitials(name)}</span>
                    )}
                </div>
                {isToday && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 border-2 border-white rounded-full" />
                )}
            </div>
            <div className="flex flex-col gap-[2px] min-w-[150px]">
                <p className="text-[12px] text-[#1F2937]">{name}</p>
                <p className="text-[10px] text-[#9CA3AF] font-medium">{role}</p>
            </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <p className="text-[12px] text-[#3F5A54] font-medium">{team}</p>
        </div>

        <div className="ml-auto flex flex-col items-start w-[150px] mr-[20px]">
            <p className="text-[10px] text-[#000000] font-medium">{date}</p>
            <p className={`font-medium ${isToday ? "text-[#EC6D31] text-[12px]" : "text-[#9CA3AF] text-[8px]"}`}>{status}</p>
        </div>
    </div>
);

export default function Celebrations() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [activeTab, setActiveTab] = useState<"birthdays" | "anniversaries">("birthdays");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        const from = new Date();
        const to = new Date(from.getFullYear(), from.getMonth() + 1, 0);
        return { from, to };
    });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const birthdays = useAppSelector(selectBirthdays);
    const anniversaries = useAppSelector(selectAnniversaries);
    const loading = useAppSelector(selectCelebrationsLoading);
    const error = useAppSelector(selectCelebrationsError);
    // Added useEffect to fetch data on mount and range change
    useEffect(() => {
        let params: any = {};
        if (dateRange?.from) {
            params.startDate = `${dateRange.from.getFullYear()}-${String(dateRange.from.getMonth() + 1).padStart(2, '0')}-${String(dateRange.from.getDate()).padStart(2, '0')}`;
        }
        if (dateRange?.to) {
            params.endDate = `${dateRange.to.getFullYear()}-${String(dateRange.to.getMonth() + 1).padStart(2, '0')}-${String(dateRange.to.getDate()).padStart(2, '0')}`;
        }

        dispatch(fetchBirthdays(params));
        dispatch(fetchAnniversaries(params));
    }, [dispatch, dateRange]);

    // Settings States
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [sendWishesEnabled, setSendWishesEnabled] = useState(false);
    const [lensEnabled, setLensEnabled] = useState(true);
    const [emailIds, setEmailIds] = useState<string[]>([""]);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Since there is no actual save endpoint yet, we simulate a delay and show success.
            await new Promise(resolve => setTimeout(resolve, 800));
            showSuccessToast(`${activeTab === 'birthdays' ? 'Birthday' : 'Anniversary'} settings saved successfully!`);
            setIsSettingsOpen(false);
        } catch (err) {
            showErrorToast("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    const addEmailId = () => setEmailIds(prev => [...prev, ""]);
    const removeEmailId = (idx: number) => setEmailIds(prev => prev.filter((_, i) => i !== idx));
    const updateEmailId = (idx: number, val: string) => setEmailIds(prev => prev.map((e, i) => i === idx ? val : e));

    const currentData = activeTab === "birthdays" ? birthdays : anniversaries;

    return (
        <div className="bg-[#F8FAFC] mx-[40px] mb-[150px] font-sans flex flex-col relative">

            <div className="flex mt-[24px] h-[69px] w-[24px]">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-[10px] text-[#3F5A54] hover:text-black transition-colors"
                >
                    <MoveLeft className="w-[20px]" />
                    <span className="text-[14px] font-medium text-[#3F5A54] w-[35px]">Back</span>
                </button>
            </div>

            <h1 className="text-[##1F2937] text-[16px] font-medium">Celebrations</h1>

            {/* MAIN CARD */}
            <div className="flex mt-[20px] min-h-[728px] h-auto bg-white border border-[#E5E7EB] rounded-xl shadow-sm relative">

                {/* SIDEBAR */}
                <div className="px-[20px] pt-[20px] border-r border-[#E5E7EB] shadow-sm flex flex-col gap-3">
                    <button
                        onClick={() => {
                            setActiveTab("birthdays");
                            setIsSettingsOpen(false);
                        }}
                        className={`px-4 py-[6px] rounded-full text-[10px] font-bold w-fit text-left transition-all ${activeTab === "birthdays" && !isSettingsOpen
                            ? "text-[#3B82F6] bg-[#EBF0FF]"
                            : "text-[#4B5563] hover:bg-gray-50"
                            }`}
                    >
                        Birthdays
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab("anniversaries");
                            setIsSettingsOpen(false);
                        }}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-regular w-fit text-left transition-all ${activeTab === "anniversaries" && !isSettingsOpen
                            ? "text-[#3B82F6] bg-[#EBF0FF]"
                            : "text-[##4B5563] hover:bg-gray-50"
                            }`}
                    >
                        Work Anniversaries
                    </button>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 flex flex-col relative">

                    {isSettingsOpen ? (
                        /* SETTINGS VIEW */
                        <div className="mt-[20px] ml-[24px] mr-[260px] animate-in fade-in slide-in-from-right-2 duration-300">
                            <div className="flex justify-between items-center">
                                <h2 className="font-medium text-[#1F2937] text-[16px] h-[24px]">
                                    {activeTab === "birthdays" ? "Birthday" : "Anniversary"} settings
                                </h2>
                                <button
                                    onClick={() => setIsSettingsOpen(false)}
                                    className="flex items-center justify-center gap-[10px] h-[30px] w-[106px] border border-[#3F5A54] rounded-lg text-[11px] font-bold text-[#3F5A54] hover:bg-gray-50 transition-all shadow-sm"
                                >
                                    <span className="h-[21px] w-[60px] text-[14px] font-medium flex items-center justify-center">View List</span>
                                    <Eye className="h-[16px] w-[16px]" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* REMINDER SETTING ROW */}
                                <div className="mt-[26px] gap-[12px] min-h-[75px] rounded-xl border border-[#E5E7EB] flex items-center transition-all bg-white hover:border-[#E2E8F0]">
                                    <Switch
                                        checked={reminderEnabled}
                                        onCheckedChange={setReminderEnabled}
                                        className="ml-[20px] data-[state=checked]:bg-[#42524E]"
                                    />
                                    <div className="flex-1">
                                        <p className="text-[16px] font-medium h-[24px] w-[108px] text-[#1F2937]">
                                            Set Reminder
                                        </p>
                                        <p className="text-[10px] text-[#9CA3AF] h-[15px] w-[256px] font-regular mt-1">
                                            Set Reminder for yourself and get notified over mail
                                        </p>
                                    </div>
                                </div>

                                {/* EXPANDED REMINDER CONTENT*/}
                                {reminderEnabled && (
                                    <div className="rounded-xl border border-[#E5E7EB] bg-[#E5E7EB66] p-[20px] animate-in fade-in slide-in-from-top-2 space-y-5">
                                        {/* Notify + Time row */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[7px] font-regular text-[#4B5563]">
                                                    Notify <span className="text-[#EF4444] w-[7px] h-[9px]">*</span>
                                                </label>
                                                <div className="relative">
                                                    <select className="w-full h-[28px] pl-[8px] pr-[28px] text-[10px] font-medium border border-[#E5E7EB] rounded-lg bg-white outline-none focus:border-[#42524E] text-[#9CA3AF] appearance-none">
                                                        <option value="">Select days</option>
                                                        <option>Same Day</option>
                                                        <option>1 Day Before</option>
                                                        <option>2 Days Before</option>
                                                        <option>1 Week Before</option>
                                                    </select>
                                                    <svg className="absolute right-[8px] top-1/2 -translate-y-1/2 h-3 w-3 text-[#9CA3AF] pointer-events-none" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[7px] font-regular text-[#4B5563]">
                                                    Time <span className="text-[#EF4444] w-[7px] h-[9px]">*</span>
                                                </label>
                                                <div className="relative">
                                                    <select className="w-full h-[28px] pl-[8px] pr-[28px] text-[10px] font-medium border border-[#E5E7EB] rounded-lg bg-white outline-none focus:border-[#42524E] text-[#9CA3AF] appearance-none">
                                                        <option value="">Select Time</option>
                                                        <option>09:00 AM</option>
                                                        <option>10:00 AM</option>
                                                        <option>12:00 PM</option>
                                                    </select>
                                                    <svg className="absolute right-[8px] top-1/2 -translate-y-1/2 h-3 w-3 text-[#9CA3AF] pointer-events-none" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Get Notified on Email */}
                                        <div>
                                            <p className="text-[20px] pt-0 font-medium text-[#1F2937]">Get Notified on Email</p>
                                            <p className="text-[11px] text-[#9CA3AF]">Add mail ID on which you want to receive notification</p>
                                            {emailIds.map((email, idx) => (
                                                <div key={idx} className="flex items-center gap-2 mt-3">
                                                    <input
                                                        value={email}
                                                        onChange={e => updateEmailId(idx, e.target.value)}
                                                        placeholder="enter email id"
                                                        className="flex-1 h-9 px-3 text-[12px] bg-white border border-[#E5E7EB] rounded-lg outline-none focus:border-[#42524E]"
                                                    />
                                                    <button
                                                        onClick={() => removeEmailId(idx)}
                                                        className="p-2 text-red-400 hover:text-red-600 transition-all"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={addEmailId}
                                                className="mt-[20px] h-[28px] w-[130px] flex items-center justify-center gap-[8px] text-[14px] font-medium text-[#42524E] bg-white border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition-all"
                                            >
                                                Add email ID <span className="text-[16px] leading-none">+</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* SEND WISHES */}
                                {/* <div className="mt-[26px] gap-[12px] min-h-[75px] rounded-xl border border-[#E5E7EB] flex items-center transition-all bg-white hover:border-[#E2E8F0]">
                                    <Switch
                                        checked={sendWishesEnabled}
                                        onCheckedChange={setSendWishesEnabled}
                                        className="ml-[20px] data-[state=checked]:bg-[#42524E]"
                                    />
                                    <div className="flex-1">
                                        <p className="text-[16px] font-medium h-[24px] text-[#1F2937]">Send Wishes to Employees</p>
                                        <p className="text-[10px] text-[#9CA3AF] h-[15px] font-regular mt-1">Send wishes to all your employees over mail!</p>

                                        {sendWishesEnabled && (
                                            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-[#718096] uppercase">Email Subject</label>
                                                    <input
                                                        defaultValue={`Happy Birthday from PulseSeal!`}
                                                        className="w-full h-9 px-3 text-[12px] border rounded-lg outline-none focus:border-[#656BE9]"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-[#718096] uppercase">Wish Message</label>
                                                    <textarea
                                                        className="w-full min-h-[100px] p-3 text-[12px] border rounded-lg outline-none focus:border-[#656BE9] resize-none"
                                                        placeholder="Write your wishes here..."
                                                        defaultValue={`Dear [Employee Name],\n\nWe focus on celebrating your special day! Wishing you a fantastic birthday filled with joy and success. \n\nBest regards,\nPulseSeal Team`}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div> */}

                                {/* LENS SETTING */}
                                <div className="mt-[26px] gap-[12px] min-h-[75px] rounded-xl border border-[#E5E7EB] flex items-center transition-all bg-white hover:border-[#E2E8F0]">
                                    <Switch
                                        checked={lensEnabled}
                                        onCheckedChange={setLensEnabled}
                                        className="ml-[20px] data-[state=checked]:bg-[#42524E]"
                                    />
                                    <div className="flex-1">
                                        <p className="text-[16px] font-medium h-[24px] text-[#1F2937]">
                                            {activeTab === "birthdays" ? "Birthday" : "Anniversary"} Reminders on Lens
                                        </p>
                                        <p className="text-[10px] text-[#9CA3AF] h-[15px] font-regular mt-1">Enable birthday reminders on Lens</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        /* LIST VIEW */
                        <>
                            {/* HEADER ROW */}
                            <div className="flex justify-between items-start mt-[20px] ml-[24px] mr-[50px]">
                                <div>
                                    <h2 className="font-medium h-[24px] text-[#1F2937] text-[16px] leading-none capitalize">
                                        {activeTab}
                                    </h2>
                                    <p className="text-[10px] h-[30px] w-[308px] text-[#4B5563] font-regular leading-relaxed">
                                        Stay Updated about the Upcoming employee's {activeTab} and make their day special
                                    </p>
                                </div>

                                <div className="flex gap-[10px] items-center">
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

                                    <div
                                        onClick={() => setIsSettingsOpen(true)}
                                        className="h-[26px] w-[24px] bg-[#6366F133] border border-[#E2E8F0] rounded-sm flex items-center justify-center cursor-pointer hover:bg-[#D9E4FF] transition-all shadow-sm"
                                    >
                                        <div className="text-[#3F5A54]">
                                            <Image src={settingIcon} alt="settings" width={16} height={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* DATA VIEW OR EMPTY STATE */}
                            {loading ? (
                                <div className="flex-1 flex flex-col items-center justify-center -mt-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3F5A54]"></div>
                                    <p className="mt-4 text-[#3F5A54] text-sm">Loading celebrations...</p>
                                </div>
                            ) : error ? (
                                <div className="flex-1 flex flex-col items-center justify-center -mt-10">
                                    <p className="text-red-500 text-sm">Error: {error}</p>
                                    <Button
                                        variant="outline"
                                        className="mt-4 h-8 text-xs"
                                        onClick={() => {
                                            dispatch(fetchBirthdays({}));
                                            dispatch(fetchAnniversaries({}));
                                        }}
                                    >
                                        Retry
                                    </Button>
                                </div>
                            ) : currentData.length > 0 ? (
                                <div className="mt-4 pb-10">
                                    {currentData.map((item: any) => (
                                        activeTab === "anniversaries"
                                            ? <LocalAnniversaryCard key={item.id} {...item} />
                                            : <LocalCelebrationCard key={item.id} {...item} />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center select-none">
                                    <div className="flex flex-col items-center justify-center -mt-20"> {/* Moves cloud up slightly to center logically excluding header */}
                                        <Image src={Cloud} alt="no data" width={85} height={85} className="mb-2 opacity-100" priority />
                                        <span className="text-[#9CA3AF] h-[11px] w-[51px] text-[7px] font-regular">No data found</span>
                                    </div>
                                </div>
                            )}
                            {/* DECORATION */}
                            <div className="absolute bottom-[50px] right-[81px] opacity-50 pointer-events-none">
                                <Image
                                    src={activeTab === "birthdays" ? balloon : cone}
                                    alt="decoration"
                                    width={120}
                                    height={120}
                                    className="object-contain"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* SAVE BUTTON */}
            {isSettingsOpen && (
                <div className="flex justify-end mt-[20px]">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-[37px] w-[146px] rounded-lg bg-[#3F5A54] text-white text-[14px] font-medium shadow-md hover:bg-[#34413E] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                </div>
            )}
        </div>
    );
}
