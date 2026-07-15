"use client";

import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    fetchPendingApprovals,
    approveAttendanceRecord,
    rejectAttendanceRecord,
    selectPendingRecords,
    selectApprovePunchesLoading,
    selectApproveLoading,
    selectRejectLoading,
    selectApprovePunchesError,
} from "@/features/approvePunches/approvePunchesSlice";
import { useRouter } from "next/navigation";
import {
    MoveLeft,
    Search,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";


const ApprovePunches = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // ── Redux ──
    const dispatch = useAppDispatch();
    const pendingRecords = useAppSelector(selectPendingRecords);
    const loading = useAppSelector(selectApprovePunchesLoading);
    const approveLoading = useAppSelector(selectApproveLoading);
    const rejectLoading = useAppSelector(selectRejectLoading);
    const error = useAppSelector(selectApprovePunchesError);

    // Fetch pending records whenever the selected date changes
    useEffect(() => {
        let mounted = true;
        if (date && mounted) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            const dateStr = `${year}-${month}-${day}`;

            dispatch(
                fetchPendingApprovals({
                    startDate: dateStr,
                    endDate: dateStr,
                })
            );
        }
        return () => {
            mounted = false;
        };
    }, [date, dispatch]);

    const filteredData = Array.isArray(pendingRecords)
        ? pendingRecords.filter((record) =>
            record.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.userId?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
        : [];

    const handlePrevDay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (date) {
            const newDate = new Date(date);
            newDate.setDate(newDate.getDate() - 1);
            setDate(newDate);
        }
    };

    const handleNextDay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (date) {
            const newDate = new Date(date);
            newDate.setDate(newDate.getDate() + 1);
            setDate(newDate);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredData.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredData.map((r) => r.id));
        }
    };

    const toggleSelectStaff = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    // ── Approve all selected records ──
    const handleApproveSelected = async () => {
        try {
            for (const recordId of selectedIds) {
                await dispatch(
                    approveAttendanceRecord({
                        recordId,
                        status: "PRESENT",
                    })
                ).unwrap();
            }
            toast.success(`${selectedIds.length} records approved successfully`);

            if (date) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                const dateStr = `${year}-${month}-${day}`;
                dispatch(fetchPendingApprovals({ startDate: dateStr, endDate: dateStr }));
            } else {
                dispatch(fetchPendingApprovals({}));
            }
            setSelectedIds([]);
        } catch (err: any) {
            toast.error(err || "Failed to approve records");
        }
    };

    // ── Reject all selected records ──
    const handleRejectSelected = async () => {
        try {
            for (const recordId of selectedIds) {
                await dispatch(
                    rejectAttendanceRecord({ recordId })
                ).unwrap();
            }
            toast.success(`${selectedIds.length} records rejected successfully`);

            if (date) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                const dateStr = `${year}-${month}-${day}`;
                dispatch(fetchPendingApprovals({ startDate: dateStr, endDate: dateStr }));
            } else {
                dispatch(fetchPendingApprovals({}));
            }
            setSelectedIds([]);
        } catch (err: any) {
            toast.error(err || "Failed to reject records");
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#f8f9fa] font-sans px-[40px]">

            {/* MAIN SECTION */}
            <div className="flex-1">

                <div className="flex mt-[22px] h-[69px] w-[24px]">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-[10px] text-[#3F5A54] hover:text-black transition-colors"
                    >
                        <MoveLeft className="w-[20px]" />
                        <span className="text-[14px] font-medium text-[#3F5A54] w-[35px]">Back</span>
                    </button>
                </div>

                <h1 className="text-[##1F2937] text-[16px] font-medium">Attendance Pending for Approvals</h1>

                {/* Search + Date */}
                <div className="flex items-center justify-between mt-[30px] mb-[35px] gap-[30px]">
                    <div className="relative w-full h-[44px]">
                        <Search className="absolute ml-[20px] top-1/2 -translate-y-1/2 h-[16px] w-[16px] text-gray-400" />
                        <Input
                            placeholder="Search Staff"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 h-[44px] text-[16px] w-full bg-white border border-[#E2E8F0] rounded-lg placeholder:text-gray-400 shadow-sm focus-visible:ring-1 focus-visible:ring-purple-400"
                        />
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <div
                                className="bg-white border border-[#E2E8F0] rounded-lg h-[28px] w-[141px] flex items-center pl-[10px] pr-[8px] font-medium text-[#4A5568] shadow-sm cursor-pointer hover:bg-gray-50"
                            >
                                <CalendarDays className="h-[16px] w-[16px] text-gray-600 shrink-0" />
                                <div className="flex items-center ml-[3px] gap-[6px] flex-1">
                                    <ChevronLeft
                                        className="h-[12px] w-[12px] text-gray-600"
                                        onClick={handlePrevDay}
                                    />
                                    <span className="flex-1 text-center text-[12px] whitespace-nowrap">
                                        {date?.toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </span>
                                    <ChevronRight
                                        className="h-[12px] w-[12px] text-gray-600"
                                        onClick={handleNextDay}
                                    />
                                </div>
                            </div>
                        </PopoverTrigger>

                        <PopoverContent className="w-auto p-0" align="end">
                            <CalendarUI
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Table */}
                <div className="w-full bg-white border border-[#E2E8F0] shadow-sm rounded-xl overflow-hidden">

                    {/* Header */}
                    <div className="w-full px-[20px] py-[15px] border-b border-gray-400 bg-white">
                        <h2 className="text-[16px] font-medium text-[#1F2937] flex items-center">
                            {filteredData.length > 0 && filteredData[0].shiftSnapshot?.shiftName
                                ? filteredData[0].shiftSnapshot.shiftName
                                : filteredData.length > 0 ? "Shift Summary" : "No pending data"}
                        </h2>
                    </div>

                    {/* Column Titles */}
                    <div className="grid grid-cols-[40px_220px_1fr_1fr] bg-gray-100 border-b border-gray-400 px-[20px] h-[39px] items-center">
                        <div className="flex justify-center">
                            <Checkbox
                                className="h-[16px] w-[16px] border-[#4B5563]"
                                checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                                onCheckedChange={toggleSelectAll}
                            />
                        </div>
                        <div className="text-[10px] font-medium text-[#4B5563]">Staff Name</div>
                        <div className="text-[10px] font-medium text-[#4B5563]">Punch In</div>
                        <div className="text-[10px] font-medium text-[#4B5563]">Punch Out</div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="text-center py-10 text-gray-400 text-sm">
                            Loading pending approvals...
                        </div>
                    )}

                    {/* Error State */}
                    {!loading && error && (
                        <div className="text-center py-10 text-red-500 text-sm">
                            Error: {error}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !error && filteredData.length === 0 && (
                        <div className="text-center py-10 text-gray-400 text-sm">
                            No pending approvals for this date.
                        </div>
                    )}

                    {/* Rows */}
                    {!loading && !error && filteredData.map((record) => (
                        <div
                            key={record.id}
                            className="grid grid-cols-[40px_220px_1fr_1fr] px-[20px] py-[20px] border-b border-gray-300 items-center"
                        >
                            <div className="flex justify-center">
                                <Checkbox
                                    className="h-[16px] w-[16px] border-[#4B5563]"
                                    checked={selectedIds.includes(record.id)}
                                    onCheckedChange={() => toggleSelectStaff(record.id)}
                                />
                            </div>

                            <div className="flex flex-col gap-[2px]">
                                <span className="text-[10px] font-regular text-[##1F2937] leading-none">
                                    {record.userName ?? record.userId}
                                </span>
                                <span className="text-[10px] font-regular text-[##1F2937] leading-none">
                                    {record.totalWorkMinutes != null
                                        ? `${Math.floor(record.totalWorkMinutes / 60)}h ${record.totalWorkMinutes % 60}m`
                                        : "—"}
                                </span>
                            </div>

                            <div className="flex gap-[10px] items-center">
                                {record.scans?.find((s) => s.type === "IN") ? (
                                    <>
                                        <div className="w-8 h-8 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] font-bold text-[#1F2937] overflow-hidden">
                                            {record.scans.find((s) => s.type === "IN")?.image ? (
                                                <img
                                                    src={record.scans.find((s) => s.type === "IN")?.image}
                                                    className="w-full h-full object-cover"
                                                    alt="Punch In"
                                                />
                                            ) : (
                                                <span>{getInitials(record.userName || "Emp")}</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-px">
                                            <span className="text-[14px] font-medium text-[#1F2937]">
                                                {new Date(record.scans.find((s) => s.type === "IN")!.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                            <span className="text-[10px] text-gray-500 line-clamp-1">
                                                {record.scans.find((s) => s.type === "IN")?.location || "No location recorded"}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-gray-400">—</span>
                                )}
                            </div>

                            <div className="flex gap-[10px] items-center">
                                {record.scans?.find((s) => s.type === "OUT") ? (
                                    <>
                                        <div className="w-8 h-8 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] font-bold text-[#1F2937] overflow-hidden">
                                            {record.scans.find((s) => s.type === "OUT")?.image ? (
                                                <img
                                                    src={record.scans.find((s) => s.type === "OUT")?.image}
                                                    className="w-full h-full object-cover"
                                                    alt="Punch Out"
                                                />
                                            ) : (
                                                <span>{getInitials(record.userName || "Emp")}</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-px">
                                            <span className="text-[14px] font-medium text-[#1F2937]">
                                                {new Date(record.scans.find((s) => s.type === "OUT")!.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                            <span className="text-[10px] text-gray-500 line-clamp-1">
                                                {record.scans.find((s) => s.type === "OUT")?.location || "No location recorded"}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-gray-400">—</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FOOTER */}
            <div className="sticky bottom-0 -mx-[56px] h-[80px] bg-white border-t border-gray-200 px-8 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">

                <div className="flex-1">
                    {selectedIds.length > 0 && (
                        <div className="text-[16px] font-medium text-[#1F2937]">
                            {selectedIds.length} employees Selected
                        </div>
                    )}
                </div>

                <div className="flex gap-[30px]">
                    {selectedIds.length === 0 ? (
                        <>
                            <Button variant="outline" className="border-gray-300 text-[#9CA3AF] w-[146px] h-[37px] bg-[#D1D5DB]">
                                <div className=" text-[14px] font-medium flex items-center">Reject Selected</div>
                            </Button>
                            <Button variant="outline" className="border-gray-300 text-[#9CA3AF] w-[146px] h-[37px] bg-[#D1D5DB]">
                                <div className=" text-[14px] font-medium flex items-center">Approve Selected</div>
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                className="border-[#EF4444] text-[#EF4444] hover:bg-[#EF4410] hover:text-white w-[146px] h-[37px] transition-all"
                                onClick={handleRejectSelected}
                                disabled={rejectLoading}
                            >
                                <div className="text-[14px] font-medium flex items-center">
                                    {rejectLoading ? "Rejecting..." : "Reject Selected"}
                                </div>
                            </Button>
                            <Button
                                className="border-[#3F5A54] border hover:bg-[#2d3a4a] hover:bg-white hover:text-[#2d3a4a] text-white w-[146px] h-[37px] shadow-md transition-all"
                                onClick={handleApproveSelected}
                                disabled={approveLoading}
                            >
                                <div className="text-[14px] font-medium flex items-center">
                                    {approveLoading ? "Approving..." : "Approve Selected"}
                                </div>
                            </Button>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ApprovePunches;