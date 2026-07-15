"use client";

import React, { useState, useEffect } from "react";
import {
    ArrowLeft,
    Download,
    ChevronLeft,
    ChevronDown,
    Trash2,
    X,
    CheckCircle2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import CloudIcon from "@/assets/Dashicons/Cloud.png";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { 
    getLeavesHistoryByOrganization, 
    selectOrganizationLeaveHistory, 
    selectLeaveLoading,
    getLeavesForApprovalByOrganization,
    selectOrganizationLeavesForApproval
} from "@/features/leave/leaveSlice";
import { fetchEmployees, selectEmployees } from "@/features/employee/employeeSlice";

interface Leave {
    id: string;
    staffName: string;
    type: string;
    leavesAvailed: string;
    dates: string;
    status: string;
    [key: string]: any;
}

export default function LeaveDashboard() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const organiationHistory = useAppSelector(selectOrganizationLeaveHistory);
    const organizationApprovals = useAppSelector(selectOrganizationLeavesForApproval);
    const employees = useAppSelector(selectEmployees);
    const loading = useAppSelector(selectLeaveLoading);

    const [activeTab, setActiveTab] = useState("Upcoming Leaves");
    const [isDownloadPopoverOpen, setIsDownloadPopoverOpen] = useState(false);
    const [viewDetailsLeave, setViewDetailsLeave] = useState<any>(null);

    const safeFormat = (date: any, formatStr: string, fallback: string = "N/A") => {
        if (!date) return fallback;
        const d = new Date(date);
        return isNaN(d.getTime()) ? fallback : format(d, formatStr);
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.text(`Leave Balance Report`, 14, 15);
        autoTable(doc, {
            startY: 20,
            head: [['Staff Name', 'Type', 'Leaves Availed', 'Dates', 'Status']],
            body: allLeaves.map(e => [e.staffName, e.type, e.leavesAvailed, e.dates, e.status]),
        });
        doc.save(`Leave_Balance_Report_${safeFormat(new Date(), "yyyyMMdd")}.pdf`);
        setIsDownloadPopoverOpen(false);
    };

    const handleDownloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(allLeaves.map(e => ({
            "Staff Name": e.staffName,
            Type: e.type,
            "Leaves Availed": e.leavesAvailed,
            Dates: e.dates,
            Status: e.status
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Leaves");
        XLSX.writeFile(workbook, `Leave_Balance_Report_${safeFormat(new Date(), "yyyyMMdd")}.xlsx`);
        setIsDownloadPopoverOpen(false);
    };

    useEffect(() => {
        dispatch(getLeavesHistoryByOrganization());
        dispatch(getLeavesForApprovalByOrganization());
        dispatch(fetchEmployees());
    }, [dispatch]);

    const allLeaves: Leave[] = React.useMemo(() => {
        const getEmpName = (l: any) => {
            // Check if already populated by backend
            if (typeof l.employeeId === 'object' && l.employeeId !== null) {
                return (l.employeeId.name || `${l.employeeId.personal?.firstName || ""} ${l.employeeId.personal?.lastName || ""}`).trim();
            }
            // Frontend lookup
            const empId = l.employeeId?.toString();
            const emp = employees.find(e => (e._id || e.id)?.toString() === empId);
            if (emp) {
                return (emp.name || `${emp.personal?.firstName || ""} ${emp.personal?.lastName || ""}`).trim();
            }
            return "Unknown";
        };

        const history = organiationHistory.map((l: any) => {
            const empName = getEmpName(l);
            
            const startS = l.durationType === 'halfDay' ? "S1" : "S1";
            const endS = l.durationType === 'halfDay' ? "S1" : "S2";
            const formattedDates = `${safeFormat(l.startDate, "dd MMM")} (${startS}) - ${safeFormat(l.endDate, "dd MMM")} (${endS})`;
 
            return {
                id: l._id,
                staffName: empName,
                type: l.leaveType,
                leavesAvailed: `${l.totalDays} Day${l.totalDays > 1 ? 's' : ''}`,
                dates: formattedDates,
                status: l.status.charAt(0).toUpperCase() + l.status.slice(1),
                startDate: l.startDate,
                duration: l.totalDays,
                reason: l.reason,
                appliedOn: safeFormat(l.createdAt, "dd MMM ''yy, hh:mm a"),
                approvedOn: l.approvalHistory?.[l.approvalHistory.length-1]?.date ? safeFormat(l.approvalHistory[l.approvalHistory.length-1].date, "dd MMM ''yy, hh:mm a") : "-",
                approvedBy: l.approvalHistory?.[l.approvalHistory.length-1]?.approverId?.name || "System"
            };
        });

        // Add pending leaves if they should be in the "Upcoming" view
        const pending = organizationApprovals.map((l: any) => {
            const empName = getEmpName(l);
            
            const startS = l.durationType === 'halfDay' ? "S1" : "S1";
            const endS = l.durationType === 'halfDay' ? "S1" : "S2";
            const formattedDates = `${safeFormat(l.startDate, "dd MMM")} (${startS}) - ${safeFormat(l.endDate, "dd MMM")} (${endS})`;

            return {
                id: l._id,
                staffName: empName,
                type: l.leaveType,
                leavesAvailed: `${l.totalDays} Day${l.totalDays > 1 ? 's' : ''}`,
                dates: formattedDates,
                status: "Pending",
                startDate: l.startDate,
                duration: l.totalDays,
                reason: l.reason,
                appliedOn: safeFormat(l.createdAt, "dd MMM ''yy, hh:mm a"),
                approvedOn: "-",
                approvedBy: "-"
            };
        });

        return [...history, ...pending];
    }, [organiationHistory, organizationApprovals, employees]);

    const currentYear = new Date().getFullYear();
    const currentYearShort = currentYear.toString().slice(-2);
    const dateRange = `(Jan '${currentYearShort} - Dec '${currentYearShort})`;

    const tabs = ["Upcoming Leaves", "Previous Leaves", "Leave Calendar"];

    const parseLeaveStartDate = (leave: Leave): Date | null => {
        // Supports a few common formats:
        // - dates: "25 Dec - 26 Dec"
        // - startDate: ISO string
        // - date: ISO string
        const anyLeave = leave as any;
        const iso = anyLeave.startDate || anyLeave.date;
        if (iso) {
            const d = new Date(iso);
            return isNaN(d.getTime()) ? null : d;
        }

        if (typeof leave.dates === "string") {
            const left = leave.dates.split("-")[0]?.trim(); // "25 Dec"
            if (left) {
                const candidate = new Date(`${left} ${currentYear}`);
                return isNaN(candidate.getTime()) ? null : candidate;
            }
        }

        return null;
    };

    const displayedLeaves = React.useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (activeTab === "Upcoming Leaves") {
            return allLeaves.filter((l) => {
                const start = parseLeaveStartDate(l);
                return !start || start >= today;
            });
        }

        if (activeTab === "Previous Leaves") {
            return allLeaves.filter((l) => {
                const start = parseLeaveStartDate(l);
                return !!start && start < today;
            });
        }

        // Leave Calendar handled separately in UI
        return [];
    }, [activeTab, allLeaves]);

    return (
        <div className="p-[40px] min-h-screen bg-[#F8FAFC]">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[#4B5563] hover:text-[#1F2937] transition-colors mb-8 w-fit"
            >
                <ArrowLeft size={16} />
                <span className="text-[12px] font-medium">Back</span>
            </button>

            {/* Content Area */}
            <Card className="bg-white border border-gray-100 shadow-sm rounded-2xl px-[20px] overflow-hidden">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-[8px]">
                        <h1 className="text-[16px] font-medium text-[#1F2937]">Leave(s)</h1>
                        <span className="text-[10px] text-[#6B7280] font-regular mt-1.5">{dateRange}</span>
                    </div>

                    <div className="flex items-center gap-[16px]">
                        <Popover open={isDownloadPopoverOpen} onOpenChange={setIsDownloadPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-[30px] w-[187px] border-[#3F5A54] text-[#3F5A54] text-[14px] font-medium rounded-[10px] flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
                                >
                                    Leave Balance Report
                                    <Download size={15} className="text-[#3F5A54]" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-2 flex flex-col gap-1 rounded-[12px] border-none shadow-[0px_4px_24px_rgba(0,0,0,0.08)] bg-white" align="end">
                                <button
                                    onClick={handleDownloadExcel}
                                    className="w-full text-left px-4 py-2.5 text-[14px] text-[#4B5563] hover:bg-gray-50 rounded-[8px] transition-colors font-medium"
                                >
                                    EXCEL Report
                                </button>
                                <button
                                    onClick={handleDownloadPDF}
                                    className="w-full text-left px-4 py-2.5 text-[14px] text-[#4B5563] hover:bg-gray-50 rounded-[8px] transition-colors font-medium"
                                >
                                    PDF Report
                                </button>
                            </PopoverContent>
                        </Popover>
                        <Button
                            onClick={() => router.push("/dashboard/admin/hrms/attendence/leaves/bulk-encash")}
                            className="h-[30px] w-[146px] bg-[#3F5A54] hover:bg-[#2c4440] text-white text-[14px] font-medium rounded-[10px] shadow-sm transition-all"
                        >
                            Bulk Encash Leave
                        </Button>
                    </div>
                </div>

                {/* Sub-tabs */}
                <div className="bg-white rounded-[8px] h-[31px] w-full flex items-stretch gap-[20px] px-[20px] border border-[#E5E7EB]">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-[4px] text-[10px] font-semibold transition-all relative h-full",
                                activeTab === tab
                                    ? "text-[#3F5A54] after:content-[''] after:absolute after:-bottom-px after:left-0 after:right-0 after:h-[2px] after:bg-[#3F5A54]"
                                    : "text-[#6B7280] hover:text-[#4B5563]"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Table / Calendar / Empty State */}
                <div className="border border-[#E5E7EB] rounded-[8px] h-[322px] overflow-hidden shadow-sm flex flex-col">
                    {activeTab === "Leave Calendar" ? (
                        <div className="flex-1 flex flex-col items-center justify-center bg-white">
                            <div className="transform transition-transform hover:scale-105 duration-300 mb-2">
                                <Image
                                    src={CloudIcon}
                                    alt="No data"
                                    width={85}
                                    height={85}
                                    className="object-contain"
                                />
                            </div>
                            <p className="text-[#9CA3AF] text-[7px] font-bold tracking-[0.2em] uppercase">
                                No Data Found!
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Table Header */}
                            <div className="grid grid-cols-12 items-center bg-[#F0F0F0] h-[39px] border-b border-gray-100 shrink-0 px-[20px]">
                                <span className="col-span-2 text-[10px] font-medium text-[#4B5563] tracking-wider">Staff Name</span>
                                <span className="col-span-2 text-[10px] font-medium text-[#4B5563] tracking-wider">Type</span>
                                <span className="col-span-2 text-[10px] font-medium text-[#4B5563] tracking-wider">Leaves Availed</span>
                                <span className="col-span-3 text-[10px] font-medium text-[#4B5563] tracking-wider">Dates</span>
                                <span className="col-span-2 text-[10px] font-medium text-[#4B5563] tracking-wider">Status</span>
                                <span className="col-span-1 text-[10px] font-medium text-[#4B5563] tracking-wider text-right">View</span>
                            </div>

                            {/* Table Body */}
                            <div className="flex-1 flex flex-col bg-white overflow-y-auto">
                                {loading ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <span className="text-[14px] text-[#6B7280] font-medium animate-pulse">Loading leave data...</span>
                                    </div>
                                ) : displayedLeaves.length > 0 ? (
                                    displayedLeaves.map((leave, idx) => (
                                        <div key={leave.id || idx} className="grid grid-cols-12 items-center px-[20px] py-3 border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50/50 transition-colors group">
                                            <span className="col-span-2 text-[10px] font-semibold text-[#1F2937]">{leave.staffName}</span>
                                            <span className="col-span-2 text-[10px] text-[#4B5563]">{leave.type}</span>
                                            <span className="col-span-2 text-[10px] text-[#4B5563]">{leave.leavesAvailed}</span>
                                            <span className="col-span-3 text-[10px] text-[#4B5563] font-medium">{leave.dates}</span>
                                            <div className="col-span-2 flex items-center">
                                                <div className={cn(
                                                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                                    leave.status === "Approved"
                                                        ? "bg-green-50 text-green-600 border-green-100"
                                                        : "bg-yellow-50 text-yellow-600 border-yellow-100"
                                                )}>
                                                    {leave.status}
                                                </div>
                                            </div>
                                            <div className="col-span-1 flex justify-end items-center">
                                                <button
                                                    onClick={() => setViewDetailsLeave(leave)}
                                                    className="text-[#3F5A54] hover:underline text-[10px] font-semibold transition-all"
                                                >
                                                    View
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center">
                                        <div className="transform transition-transform hover:scale-105 duration-300 mb-2">
                                            <Image
                                                src={CloudIcon}
                                                alt="No data"
                                                width={85}
                                                height={85}
                                                className="object-contain"
                                            />
                                        </div>
                                        <p className="text-[#9CA3AF] text-[7px] font-bold tracking-[0.2em] uppercase">
                                            No Data Found!
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </Card>

            {/* Leave Details Slide-in Modal */}
            <Dialog open={!!viewDetailsLeave} onOpenChange={(open) => { if (!open) setViewDetailsLeave(null); }}>
                <DialogContent
                    showCloseButton={false}
                    className="fixed right-4 top-4 left-auto translate-x-0 translate-y-0 w-[500px] max-w-[500px] m-0 p-[32px] rounded-[24px] bg-white border-none shadow-[0_10px_50px_rgba(0,0,0,0.15)] flex flex-col focus-visible:outline-none h-fit"
                >
                    {viewDetailsLeave && (() => {
                        const status = viewDetailsLeave.status || "Approved";
                        const isApproved = status.toLowerCase() === "approved";
                        const applyDate = viewDetailsLeave.appliedOn || safeFormat(new Date(), "dd MMM 'yy, hh:mm a");
                        const rangeStr = viewDetailsLeave.dates || "N/A";

                        return (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {/* Header Area */}
                                <div className="flex items-start justify-between mb-[24px] shrink-0">
                                    <div className="flex flex-col gap-1.5">
                                        <DialogTitle className="text-[18px] font-bold text-[#1F2937] uppercase tracking-wide">Leave Details</DialogTitle>
                                        <div className={cn(
                                            "px-2 py-0.5 rounded-full flex items-center gap-1 border w-fit",
                                            isApproved 
                                                ? "bg-green-50 text-green-600 border-green-100" 
                                                : "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]/30"
                                        )}>
                                            <div className={cn(
                                                "w-[5px] h-[5px] rounded-full",
                                                isApproved ? "bg-green-600" : "bg-[#D97706] animate-pulse"
                                            )} />
                                            <span className="text-[9px] font-bold uppercase tracking-wider">{status}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <button className="w-[32px] h-[32px] flex items-center justify-center text-[#EF4444] hover:bg-red-50 rounded-full transition-colors border border-transparent hover:border-red-100">
                                            <Trash2 size={18} />
                                        </button>
                                        <DialogClose asChild>
                                            <button className="w-[32px] h-[32px] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors bg-[#F9FAFB] rounded-full border border-gray-100">
                                                <X size={18} />
                                            </button>
                                        </DialogClose>
                                    </div>
                                </div>

                                {/* Details Content */}
                                <div className="pr-2">
                                    <div className="grid grid-cols-3 gap-y-[24px] gap-x-[16px] mb-8">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] text-[#9CA3AF] font-medium">Staff Name</span>
                                            <span className="text-[13px] text-[#1F2937] font-bold uppercase tracking-tight">{viewDetailsLeave.staffName}</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] text-[#9CA3AF] font-medium">Leave Applied on</span>
                                            <span className="text-[13px] text-[#1F2937] font-bold">{applyDate}</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] text-[#9CA3AF] font-medium">Leave On</span>
                                            <span className="text-[13px] text-[#1F2937] font-bold uppercase tracking-tight">{rangeStr}</span>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] text-[#9CA3AF] font-medium">Leave Duration</span>
                                            <span className="text-[13px] text-[#1F2937] font-bold">{viewDetailsLeave.duration || viewDetailsLeave.totalDays || 0} day(s)</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] text-[#9CA3AF] font-medium">Leaves Availed</span>
                                            <span className="text-[13px] text-[#1F2937] font-bold uppercase">{viewDetailsLeave.leavesAvailed || viewDetailsLeave.totalDays || 0} DAYS</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] text-[#9CA3AF] font-medium">Leave Type</span>
                                            <span className="text-[13px] text-[#1F2937] font-bold uppercase tracking-tight">{viewDetailsLeave.type}</span>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] text-[#9CA3AF] font-medium">Approved by</span>
                                            <span className="text-[13px] text-[#1F2937] font-bold uppercase tracking-tight">{viewDetailsLeave.approvedBy || "DELIZIA"}</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] text-[#9CA3AF] font-medium">Approved on</span>
                                            <span className="text-[13px] text-[#1F2937] font-bold">{viewDetailsLeave.approvedOn || "19 Mar '25, 10:53 AM"}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5 mb-6">
                                        <span className="text-[11px] text-[#9CA3AF] font-medium">Leave Summary</span>
                                        <span className="text-[13px] text-[#1F2937] font-bold">{viewDetailsLeave.duration || viewDetailsLeave.totalDays || 0} {viewDetailsLeave.type}</span>
                                    </div>

                                    <div className="flex flex-col gap-1.5 mb-8">
                                        <span className="text-[11px] text-[#9CA3AF] font-medium">Description</span>
                                        <p className="text-[13px] text-[#1F2937] font-medium leading-relaxed">{viewDetailsLeave.description || viewDetailsLeave.reason || "No description provided."}</p>
                                    </div>

                                    <div className="flex flex-col gap-2 mb-8">
                                        <span className="text-[11px] text-[#9CA3AF] font-medium">Attachments</span>
                                        <div className="w-[60px] h-[60px] bg-[#F9FAFB] rounded-[10px] flex items-center justify-center text-[#9CA3AF] text-[10px] font-bold border border-dashed border-gray-200">
                                            N/A
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </div>
    );
}
