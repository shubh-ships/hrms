"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPendingApprovals, selectPendingRecords } from "@/features/approvePunches/approvePunchesSlice";
import { getLeavesForApprovalByOrganization, selectOrganizationPendingLeavesCount } from "@/features/leave/leaveSlice";
import { fetchEmployees, selectEmployees } from "@/features/employee/employeeSlice";
import { 
    fetchEmployeesAttendanceByDate, 
    fetchAllAttendanceSummaryByDate,
    selectAllEmployeesAttendance,
    selectAllAttendanceSummary,
    markAttendance,
    createFine,
    createOvertime,
    selectNewAttendanceLoading,
    selectNewAttendanceError
} from "@/features/newAttendance/newAttendanceSlice";
import { toast } from "sonner";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Search,
    Settings as SettingsIcon,
    Download,
    ListFilter,
    Users,
    Briefcase,
    CircleAlert,
    Ship,
    ListPlus,
    X,
    Clock,
    Calendar as CalendarIcon
} from "lucide-react";
import { format, addDays, subDays, startOfMonth, endOfMonth } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface AttendanceEntry {
    id: string;
    name: string;
    employeeCode: string;
    status: "Present" | "Absent" | "Half Day" | "Not Marked" | "Leave" | "Fine" | "Overtime";
    time?: string;
    duration?: string;
    note?: string;
    fineValue?: string;
    fineAmount?: number;
    overtimeValue?: string;
    overtimeAmount?: number;
    leaveType?: string;
    hfLeaveType?: string;
    hfSession?: string;
    isHalfDayLeave?: boolean;
    attendanceId?: string;
}

const calculateDuration = (inTime: string, outTime: string): string => {
    if (!inTime || !outTime) return "0:00 Hrs";

    const parseTime = (timeStr: string) => {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
    };

    const start = parseTime(inTime);
    const end = parseTime(outTime);

    let diff = end - start;
    if (diff < 0) diff += 1440;

    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}:${m.toString().padStart(2, '0')} Hrs`;
};

const calculateTotalHoursAndMinutes = (entries: AttendanceEntry[], key: "fineValue" | "overtimeValue"): string => {
    let totalMinutes = 0;
    entries.forEach(entry => {
        const val = entry[key];
        if (val) {
            const parts = val.split(":");
            if (parts.length === 2) {
                const h = parseInt(parts[0]) || 0;
                const m = parseInt(parts[1]) || 0;
                totalMinutes += (h * 60) + m;
            } else if (parts.length === 1) {
                const h = parseInt(parts[0]) || 0;
                totalMinutes += (h * 60);
            }
        }
    });
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${mins}m`;
};

const INITIAL_STAFF_DATA: AttendanceEntry[] = [];

export default function AttendenceDashboard() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const pendingRecords = useAppSelector(selectPendingRecords);
    const pendingLeavesCount = useAppSelector(selectOrganizationPendingLeavesCount);
    const allAttendance = useAppSelector(selectAllEmployeesAttendance);
    const allSummary = useAppSelector(selectAllAttendanceSummary);
    const employees = useAppSelector(selectEmployees);
    const isLoading = useAppSelector(selectNewAttendanceLoading);

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Filtered Data based on Search
    const [searchQuery, setSearchQuery] = useState("");
    
    // Popup States
    const [isNotePopupOpen, setIsNotePopupOpen] = useState(false);
    const [isLogsPopupOpen, setIsLogsPopupOpen] = useState(false);
    const [isPresentPopupOpen, setIsPresentPopupOpen] = useState(false);
    const [isLeavePopupOpen, setIsLeavePopupOpen] = useState(false);
    const [isHalfDayOptionPopupOpen, setIsHalfDayOptionPopupOpen] = useState(false);
    const [isFineEntryPopupOpen, setIsFineEntryPopupOpen] = useState(false);
    const [isOvertimeEntryPopupOpen, setIsOvertimeEntryPopupOpen] = useState(false);
    const [isFineOvertimeErrorPopupOpen, setIsFineOvertimeErrorPopupOpen] = useState(false);

    // Editing State
    const [selectedStaffIndex, setSelectedStaffIndex] = useState<number | null>(null);
    const [markingStatus, setMarkingStatus] = useState<"Present" | "Half Day">("Present");
    const [tempInTime, setTempInTime] = useState("");
    const [tempOutTime, setTempOutTime] = useState("");
    const [showOutTimeError, setShowOutTimeError] = useState(false);
    const [currentNote, setCurrentNote] = useState("");
    const [errorPopupType, setErrorPopupType] = useState<"Fine" | "Overtime">("Fine");

    const [fineSections, setFineSections] = useState({
        lateEntry: { enabled: true, actual: "00:00", target: "00:00", multiplier: "1x Salary", amountPerHr: 0.01 },
        earlyOut: { enabled: true, actual: "00:00", target: "00:00", multiplier: "1x Salary", amountPerHr: 0.01 },
        excessBreaks: { enabled: true, actual: "00:00", target: "00:00", multiplier: "1x Salary", amountPerHr: 0.01 },
    });

    const [overtimeSections, setOvertimeSections] = useState({
        afterShift: { enabled: true, actual: "00:00", target: "00:00", multiplier: "1x Salary", amountPerHr: 0.10 },
        beforeShift: { enabled: true, actual: "00:00", target: "00:00", multiplier: "1x Salary", amountPerHr: 0.10 },
    });

    const [selectedLeaveType, setSelectedLeaveType] = useState<string>("Casual Leave");
    const [selectedHfLeaveType, setSelectedHfLeaveType] = useState<string>("Other");
    const [selectedHfSession, setSelectedHfSession] = useState<string>("Session 1");

    const [isDownloadPopoverOpen, setIsDownloadPopoverOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSmsEnabled, setIsSmsEnabled] = useState(false);
    const [isAllApproved, setIsAllApproved] = useState(false);

    useEffect(() => {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        dispatch(fetchEmployeesAttendanceByDate(dateStr));
        dispatch(fetchAllAttendanceSummaryByDate(dateStr));
        dispatch(fetchEmployees());
    }, [dispatch, selectedDate]);

    // Map the backend data to the local AttendanceEntry format
    const staffEntries = useMemo(() => {
        if (!allAttendance || !employees) return [];
        
        return employees.map(emp => {
            const employeeId = emp._id || emp.id;
            const att = allAttendance.find(a => a.employeeId?.toString() === employeeId?.toString());
            
            let status: AttendanceEntry["status"] = "Not Marked";
            let time = undefined;
            let duration = undefined;
            let leaveType = undefined;

            if (att) {
                const typeMap: Record<string, AttendanceEntry["status"]> = {
                    "PRESENT": "Present",
                    "ABSENT": "Absent",
                    "HALF_DAY": "Half Day",
                    "LEAVE": "Leave",
                    "WEEK_OFF": "Not Marked",
                    "HOLIDAY": "Not Marked",
                };
                status = typeMap[att.attendanceType] || "Not Marked";
                
                if (att.inTime && att.outTime) {
                    const inT = format(new Date(att.inTime), "hh:mm a");
                    const outT = format(new Date(att.outTime), "hh:mm a");
                    time = `${inT} - ${outT}`;
                    duration = calculateDuration(inT, outT);
                }
                leaveType = att.leaveName;
            }

            return {
                id: employeeId?.toString() || "",
                name: (emp.name || "Unknown").replace(/\bundefined\b/g, "").trim(),
                employeeCode: emp.empCode || "N/A",
                status,
                time,
                duration,
                leaveType,
                fineValue: att?.fine ? `${Math.floor(att.fine / 60)}:${(att.fine % 60).toString().padStart(2, '0')}` : undefined,
                overtimeValue: att?.overtime ? `${Math.floor(att.overtime / 60)}:${(att.overtime % 60).toString().padStart(2, '0')}` : undefined,
                note: att?.note || "",
                hfSession: att?.hfSession || "Session 1",
                hfLeaveType: att?.hfLeaveType || "Other",
                isHalfDayLeave: att?.attendanceType === "HALF_DAY",
                attendanceId: att?.attendanceId || att?.id || att?._id || undefined,
                attendance: att?.attendance || []
            };
        });
    }, [allAttendance, employees]);

    const filteredStaff = useMemo(() => {
        return staffEntries.filter(entry =>
            entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [staffEntries, searchQuery]);

    const calculateFine = (hoursStr: string, multiplier: string, rate: number) => {
        if (!hoursStr) return 0;
        const parts = hoursStr.split(':');
        const h = parseInt(parts[0]) || 0;
        const m = parseInt(parts[1]) || 0;
        const totalMinutes = h * 60 + m;

        let multiplierValue = 1;
        if (multiplier.includes('x Salary')) {
            multiplierValue = parseFloat(multiplier) || 0;
        } else if (multiplier === "Half Day") {
            multiplierValue = 0.5;
        } else if (multiplier === "Full Day") {
            multiplierValue = 1.0;
        } else if (multiplier === "Pardon") {
            multiplierValue = 0;
        } else if (multiplier === "Fixed Amount") {
            return rate;
        }

        return (totalMinutes / 60) * rate * multiplierValue;
    };

    const handleFineOvertimeClick = (index: number, type: "Fine" | "Overtime") => {
        const entry = filteredStaff[index];
        if (entry.status === "Not Marked" || entry.status === "Absent" || entry.status === "Leave") {
            setErrorPopupType(type);
            setSelectedStaffIndex(index);
            setIsFineOvertimeErrorPopupOpen(true);
        } else {
            setSelectedStaffIndex(index);
            if (type === "Fine") {
                setFineSections({
                    lateEntry: { enabled: true, actual: entry.fineValue || "00:00", target: entry.fineValue || "00:00", multiplier: "1x Salary", amountPerHr: 0.01 },
                    earlyOut: { enabled: true, actual: "00:00", target: "00:00", multiplier: "1x Salary", amountPerHr: 0.01 },
                    excessBreaks: { enabled: true, actual: "00:00", target: "00:00", multiplier: "1x Salary", amountPerHr: 0.01 },
                });
                setIsFineEntryPopupOpen(true);
            } else {
                setOvertimeSections({
                    afterShift: { enabled: true, actual: entry.overtimeValue || "00:00", target: entry.overtimeValue || "00:00", multiplier: "1x Salary", amountPerHr: 0.10 },
                    beforeShift: { enabled: true, actual: "00:00", target: "00:00", multiplier: "1x Salary", amountPerHr: 0.10 },
                });
                setIsOvertimeEntryPopupOpen(true);
            }
        }
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.text(`Attendance Report - ${format(selectedDate, "dd MMM yyyy")}`, 14, 15);
        autoTable(doc, {
            startY: 20,
            head: [['Name', 'Employee Code', 'Status', 'Time', 'Duration']],
            body: staffEntries.map(e => [e.name, e.employeeCode, e.status, e.time || '-', e.duration || '-']),
        });
        doc.save(`Attendance_Report_${format(selectedDate, "yyyyMMdd")}.pdf`);
        setIsDownloadPopoverOpen(false);
    };

    const handleDownloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(staffEntries.map(e => ({
            Name: e.name,
            "Employee Code": e.employeeCode,
            Status: e.status,
            Time: e.time || '-',
            Duration: e.duration || '-'
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
        XLSX.writeFile(workbook, `Attendance_Report_${format(selectedDate, "yyyyMMdd")}.xlsx`);
        setIsDownloadPopoverOpen(false);
    };

    const leaveBalances = {
        "Casual Leave": 9.00,
        "Sick Leave": 10.50,
        "Comp Off Leave": 1.00,
        "Weekly Off": 0,
        "Other": 0
    };

    const multipliers = ["Fixed Amount", "Half Day", "Full Day", "Pardon", "1x Salary", "1.5x Salary", "2x Salary", "4x Salary", "10x Salary"];

    const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
    const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));

    const handleStatusChange = (index: number, newStatus: AttendanceEntry["status"]) => {
        const currentEntry = filteredStaff[index];
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        if (!currentEntry.id) return;

        if (newStatus === "Leave") {
            setSelectedStaffIndex(index);
            setSelectedLeaveType(currentEntry.leaveType || "Casual Leave");
            setIsLeavePopupOpen(true);
            return;
        }

        if (newStatus === "Present" || newStatus === "Half Day") {
            setSelectedStaffIndex(index);
            setMarkingStatus(newStatus);
            if (currentEntry.time) {
                const [inT, outT] = currentEntry.time.split(" - ");
                setTempInTime(inT || "");
                setTempOutTime(outT || "");
            } else {
                setTempInTime("");
                setTempOutTime("");
            }
            setIsPresentPopupOpen(true);
            return;
        }

        const typeMap: Record<string, string> = {
            "Present": "PRESENT",
            "Absent": "ABSENT",
            "Half Day": "HALF_DAY",
            "Leave": "LEAVE",
            "Not Marked": "ABSENT" // Or a dedicated delete API
        };

        dispatch(markAttendance({
            employeeId: currentEntry.id,
            date: dateStr,
            type: typeMap[newStatus] || "ABSENT"
        })).then(() => {
            dispatch(fetchEmployeesAttendanceByDate(dateStr));
            dispatch(fetchAllAttendanceSummaryByDate(dateStr));
        });
    };

    const handleSavePresent = () => {
        if (!tempInTime || !tempOutTime) {
            if (tempInTime && !tempOutTime) setShowOutTimeError(true);
            return;
        }
        if (selectedStaffIndex !== null) {
            const entry = filteredStaff[selectedStaffIndex];
            const dateStr = format(selectedDate, "yyyy-MM-dd");

            const parseTimeToUTC = (timeStr: string) => {
                const dateObj = new Date(selectedDate);
                const [time, modifier] = timeStr.split(' ');
                let [hours, minutes] = time.split(':').map(Number);
                if (modifier === 'PM' && hours < 12) hours += 12;
                if (modifier === 'AM' && hours === 12) hours = 0;
                dateObj.setHours(hours, minutes, 0, 0);
                return dateObj.toISOString();
            };

            dispatch(markAttendance({
                employeeId: entry.id,
                date: dateStr,
                type: markingStatus === "Present" ? "PRESENT" : "HALF_DAY",
                inTime: parseTimeToUTC(tempInTime),
                outTime: parseTimeToUTC(tempOutTime)
            })).then(() => {
                dispatch(fetchEmployeesAttendanceByDate(dateStr));
                dispatch(fetchAllAttendanceSummaryByDate(dateStr));
            });

            if (markingStatus === "Half Day") {
                setIsHalfDayOptionPopupOpen(true);
            }
        }
        setIsPresentPopupOpen(false);
        setShowOutTimeError(false);
    };

    const handleSaveLeave = () => {
        if (selectedStaffIndex !== null) {
            const entry = filteredStaff[selectedStaffIndex];
            const dateStr = format(selectedDate, "yyyy-MM-dd");

            dispatch(markAttendance({
                employeeId: entry.id,
                date: dateStr,
                type: "LEAVE",
                leaveType: selectedLeaveType
            })).then(() => {
                dispatch(fetchEmployeesAttendanceByDate(dateStr));
                dispatch(fetchAllAttendanceSummaryByDate(dateStr));
            });
        }
        setIsLeavePopupOpen(false);
    };

    const handleSaveNote = () => {
        if (selectedStaffIndex !== null) {
             // Logic for notes if API supports it
        }
        setIsNotePopupOpen(false);
        setCurrentNote("");
    };

    const handleSaveHalfDayOption = () => {
        if (selectedStaffIndex !== null) {
            // Logic for half day options if API supports it
        }
        setIsHalfDayOptionPopupOpen(false);
    };

    const handleApplyFine = async () => {
        if (selectedStaffIndex !== null) {
            const entry = filteredStaff[selectedStaffIndex];
            const attendanceId = entry.attendanceId;
            
            if (!attendanceId) {
                toast.error("No attendance record found for this staff on this date");
                return;
            }

            try {
                let anyApplied = false;
                for (const [key, section] of Object.entries(fineSections)) {
                    if (section.enabled && section.target !== "00:00") {
                        const amount = calculateFine(section.target, section.multiplier, section.amountPerHr);
                        const [hours, minutes] = section.target.split(':').map(Number);
                        const totalMinutes = (hours || 0) * 60 + (minutes || 0);

                        const typeMap: Record<string, string> = {
                            lateEntry: "LATE",
                            earlyOut: "EARLY_EXIT",
                            excessBreaks: "BREAK"
                        };

                        await dispatch(createFine({
                            attendanceId,
                            type: typeMap[key] || key.toUpperCase(),
                            amount,
                            minutes: totalMinutes
                        })).unwrap();
                        anyApplied = true;
                    }
                }
                
                if (anyApplied) {
                    toast.success("Fine(s) applied successfully");
                    dispatch(fetchEmployeesAttendanceByDate(format(selectedDate, "yyyy-MM-dd")));
                }
            } catch (error: any) {
                toast.error(error || "Failed to apply fine");
            }
        }
        setIsFineEntryPopupOpen(false);
    };

    const handleApplyOvertime = async () => {
        if (selectedStaffIndex !== null) {
            const entry = filteredStaff[selectedStaffIndex];
            const attendanceId = entry.attendanceId;
            
            if (!attendanceId) {
                toast.error("No attendance record found for this staff on this date");
                return;
            }

            try {
                let anyApplied = false;
                for (const [key, section] of Object.entries(overtimeSections)) {
                    if (section.enabled && section.target !== "00:00") {
                        const amount = calculateFine(section.target, section.multiplier, section.amountPerHr);
                        const [hours, minutes] = section.target.split(':').map(Number);
                        const totalMinutes = (hours || 0) * 60 + (minutes || 0);

                        const typeMap: Record<string, string> = {
                            afterShift: "LATE_OVERTIME",
                            beforeShift: "EARLY_OVERTIME"
                        };

                        await dispatch(createOvertime({
                            attendanceId,
                            type: typeMap[key] || "OVERTIME",
                            overtimeMinutes: totalMinutes,
                            payableMinutes: totalMinutes,
                            amount
                        })).unwrap();
                        anyApplied = true;
                    }
                }
                
                if (anyApplied) {
                    toast.success("Overtime applied successfully");
                    dispatch(fetchEmployeesAttendanceByDate(format(selectedDate, "yyyy-MM-dd")));
                }
            } catch (error: any) {
                toast.error(error || "Failed to apply overtime");
            }
        }
        setIsOvertimeEntryPopupOpen(false);
    };

    return (
        <div className="p-[40px] min-h-screen bg-[#F8FAFC]">
            {/* Top Notifications */}
            {pendingLeavesCount > 0 && (
                <div className="bg-[#FEFCE8] border border-[#FEF08A] rounded-[8px] h-[48px] px-[24px] flex items-center justify-between mb-[24px] shadow-sm animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-[12px] text-[#A16207]">
                        <CircleAlert className="w-[18px] h-[18px]" />
                        <span className="text-[14px] font-semibold">{pendingLeavesCount} Leaves Pending Approval</span>
                    </div>
                    <button 
                        onClick={() => router.push("/dashboard/admin/hrms/attendence/leaves/pending-approval")}
                        className="text-[14px] font-bold text-[#374151] hover:underline"
                    >
                        View Details
                    </button>
                </div>
            )}

            {/* Header Row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-[16px]">
                    <h1 className="text-[20px] font-semibold text-foreground">Attendance Summary</h1>
                    {pendingRecords && pendingRecords.length > 0 && (
                        <div className="bg-[#FFEFEF] border border-[#FECACA] text-[#EF4444] rounded-[8px] h-[36px] px-[16px] flex items-center justify-between gap-[32px] animate-in fade-in zoom-in duration-300">
                            <div className="flex items-center gap-[8px]">
                                <CircleAlert className="w-[14px] h-[14px]" />
                                <span className="text-[12px] font-normal">Approval pending for other dates</span>
                            </div>
                            <button 
                                onClick={() => router.push("/dashboard/admin/hrms/approvePunches")}
                                className="text-[12px] font-medium text-[#1F2937] hover:underline"
                            >
                                View
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-[20px]">
                    <button className="flex items-center gap-1.5 text-[#3F5A54] text-[14px] font-medium hover:opacity-80 transition-opacity">
                        <span>Unprocessed Logs</span>
                        <ListFilter className="h-4 w-4" />
                    </button>
                    <div className="h-4 w-px bg-gray-200" />
                    <Popover open={isDownloadPopoverOpen} onOpenChange={setIsDownloadPopoverOpen}>
                        <PopoverTrigger asChild>
                            <button className="flex items-center gap-1.5 text-[#3F5A54] text-[14px] font-medium hover:opacity-80 transition-opacity">
                                <span>Daily Report</span>
                                <Download className="h-4 w-4" />
                            </button>
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
                    <div className="h-4 w-px bg-gray-200" />
                    <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                        <PopoverTrigger asChild>
                            <button className="flex items-center gap-1.5 text-[#3F5A54] text-[14px] font-medium hover:opacity-80 transition-opacity">
                                <span>Settings</span>
                                <SettingsIcon className="h-4 w-4" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[316px] p-[10px] border-none shadow-[0px_4px_24px_rgba(0,0,0,0.08)] bg-white rounded-[16px]" align="end">
                            <div className="flex flex-col">
                                <button className="w-full flex items-center justify-between px-[16px] py-[14px] hover:bg-gray-50/80 rounded-[10px] transition-all group">
                                    <span className="text-[14px] text-[#4B5563] font-medium">Daily Work Entry</span>
                                    <div className="flex items-center gap-[6px]">
                                        <span className="text-[14px] text-[#9CA3AF]">Disabled</span>
                                        <ChevronRight size={16} className="text-[#9CA3AF] group-hover:text-[#4B5563]" />
                                    </div>
                                </button>
                                <button className="w-full flex items-center justify-between px-[16px] py-[14px] hover:bg-gray-50/80 rounded-[10px] transition-all group">
                                    <span className="text-[14px] text-[#4B5563] font-medium">Weekly Holiday</span>
                                    <ChevronRight size={16} className="text-[#9CA3AF] group-hover:text-[#4B5563]" />
                                </button>
                                <div className="w-full flex items-center justify-between px-[16px] py-[14px]">
                                    <span className="text-[14px] text-[#4B5563] font-medium">Send SMS to Staff</span>
                                    <Switch
                                        checked={isSmsEnabled}
                                        onCheckedChange={setIsSmsEnabled}
                                        className="data-[state=checked]:bg-[#3F5A54] scale-[0.85] origin-right"
                                    />
                                </div>
                                <button className="w-full flex items-center justify-between px-[16px] py-[14px] hover:bg-gray-50/80 rounded-[10px] transition-all group">
                                    <span className="text-[14px] text-[#4B5563] font-medium">Device List</span>
                                    <div className="flex items-center gap-[6px]">
                                        <span className="text-[14px] text-[#9CA3AF]">Select</span>
                                        <ChevronRight size={16} className="text-[#9CA3AF] group-hover:text-[#4B5563]" />
                                    </div>
                                </button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Summary Box */}
            <Card className="h-[143px] mt-[37px] bg-white border border-gray-200 shadow-none flex flex-col">
                <div className="flex items-center justify-between mx-[20px]">
                    <div className="flex items-center border border-gray-200 rounded-md px-2 h-[28px] w-[141px] gap-2">
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                                <button className="hover:bg-slate-50 rounded-sm p-0.5">
                                    <CalendarDays className="h-3.5 w-3.5 text-gray-500" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => {
                                        if (date) setSelectedDate(date);
                                        setIsCalendarOpen(false);
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <div className="flex items-center gap-1 text-[10px] font-medium whitespace-nowrap text-gray-700">
                            <button onClick={handlePrevDay} className="hover:text-primary"><ChevronLeft className="h-3 w-3" /></button>
                            <span className="min-w-[70px] text-center">{format(selectedDate, "dd MMM yyyy")}</span>
                            <button onClick={handleNextDay} className="hover:text-primary"><ChevronRight className="h-3 w-3" /></button>
                        </div>
                    </div>

                    {isAllApproved ? (
                        <div className="flex items-center justify-center gap-1.5 bg-[#E6F9F0] text-[#12B76A] h-[23px] px-3 rounded-full">
                            <div className="h-1 w-1 rounded-full bg-[#12B76A]" />
                            <span className="text-[10px] font-bold">All Approved</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-[16px]">
                            <div className="flex items-center gap-[4px]">
                                <div className="w-[6px] h-[6px] bg-[#FABE24] rounded-full" />
                                <span className="text-[10px] font-medium text-[#1F2937]">Total Marked: {(allSummary?.present || 0) + (allSummary?.absent || 0) + (allSummary?.halfDay || 0) + (allSummary?.onLeave || 0)}</span>
                            </div>
                            <Button
                                onClick={() => setIsAllApproved(true)}
                                className="h-[24px] px-[12px] bg-[#3F5A54] text-white hover:bg-[#344b46] rounded-[4px] font-medium text-[10px] border-none shadow-none"
                            >
                                Confirm Approval
                            </Button>
                        </div>
                    )}
                </div>

                <TooltipProvider>
                    <div className="grid grid-cols-9 gap-2 mx-[20px] mt-auto mb-[20px]">
                        {[
                            { label: "Total Staff", value: (employees?.length || 0).toString(), tooltip: "Total number of staff members in the system" },
                            { label: "Present", value: (allSummary?.present || 0).toString(), tooltip: "Number of staff marked present today" },
                            { label: "Absent", value: (allSummary?.absent || 0).toString(), tooltip: "Number of staff marked absent today" },
                            { label: "Half Day", value: (allSummary?.halfDay || 0).toString(), tooltip: "Number of staff marked for half-day today" },
                            { label: "Overtime Hours", value: calculateTotalHoursAndMinutes(staffEntries, "overtimeValue"), tooltip: "Total extra working hours logged" },
                            { label: "Fine hours", value: calculateTotalHoursAndMinutes(staffEntries, "fineValue"), tooltip: "Total late entry/early exit penalty hours" },
                            { label: "Leave", value: (allSummary?.onLeave || 0).toString(), tooltip: "Number of staff on approved leave" },
                            { label: "Punched In", value: (allSummary?.punchSummary?.punchIn || 0).toString(), tooltip: "Total successful punch-in records" },
                            { label: "Punched Out", value: (allSummary?.punchSummary?.punchOut || 0).toString(), tooltip: "Total successful punch-out records" },
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-1">
                                    <span className="text-[#4B5563] text-[10px] font-normal">{stat.label}</span>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <span className="text-[10px] text-gray-400 cursor-default hover:text-[#3F5A54] transition-colors leading-none">ⓘ</span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-[#1F2937] text-white text-[10px] px-3 py-2 border-none rounded-[6px]">
                                            {stat.tooltip}
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <span className="text-[#000000] text-[10px] font-medium">{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </TooltipProvider>
            </Card>

            {/* Leaves Shortcut */}
            <div className="mt-[24px] h-[49px] bg-white border border-gray-100 rounded-lg flex items-center justify-end px-6">
                <button
                    onClick={() => router.push("/dashboard/admin/hrms/attendence/leaves")}
                    className="flex items-center gap-2 text-[#3F5A54] text-[14px] font-medium hover:text-primary transition-colors"
                >
                    <Ship className="h-4 w-4" />
                    <span>Leaves</span>
                </button>
            </div>

            {/* Search Box */}
            <div className="mt-6 relative h-[37px] bg-white text-[10px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Staff by Name, Phone Number or EmployeeID"
                    className="pl-10 h-full border-gray-200 text-[10px] font-normal placeholder:text-gray-400 rounded-lg focus-visible:ring-1 focus-visible:ring-[#3F5A54]"
                />
            </div>

            {/* Monthly Regular Section */}
            <div className="mt-8 flex items-center gap-2">
                <h2 className="text-[16px] font-semibold text-foreground">Monthly Regular</h2>
                <span className="bg-[#E5E7EB] text-[#4B5563] text-[12px] font-medium h-[20px] px-2 flex items-center justify-center rounded-full">{filteredStaff.length}</span>
            </div>

            {/* Staff List Cards */}
            <div className="mt-6 space-y-4 pb-12">
                {filteredStaff.map((entry, idx) => (
                    <Card key={entry.id} className="bg-white border-[#E5E7EB] rounded-2xl shadow-sm px-[32px] py-[24px] flex flex-row items-center justify-between transition-all hover:shadow-md w-full">
                        {/* Left Side: Name, Status */}
                        <div className="flex flex-col gap-[12px] min-w-[200px]">
                            <div className="flex flex-col">
                                <h3 className="text-[14px] font-bold text-[#1F2937] leading-tight">
                                    {entry.name} <span className="text-[#9CA3AF] font-normal ml-1">({entry.employeeCode})</span>
                                </h3>
                                {(entry.status === "Present" || entry.status === "Half Day") && (
                                    <>
                                        <p className={cn(
                                            "text-[12px] font-semibold mt-[4px]",
                                            entry.status === "Present" ? "text-[#22C55E]" : "text-[#3B82F6]"
                                        )}>
                                            {entry.status} {entry.duration && `| ${entry.duration}`}
                                        </p>
                                        <p className="text-[11px] text-[#4B5563] flex items-center gap-[4px] mt-[2px]">
                                            Fixed Shift: 9:00 hours <span className="w-[12px] h-[12px] border border-[#9CA3AF] rounded-full flex items-center justify-center text-[8px] text-[#9CA3AF] italic">i</span>
                                        </p>
                                    </>
                                )}
                                {entry.status === "Absent" && (
                                    <p className="text-[12px] text-red-500 font-semibold mt-[4px]">Absent</p>
                                )}
                                {entry.status === "Leave" && (
                                    <p className="text-[12px] text-purple-600 font-semibold mt-[4px]">{entry.leaveType}</p>
                                )}
                                {entry.status === "Not Marked" && (
                                    <p className="text-[12px] text-red-500 font-semibold mt-[4px]">Not Marked</p>
                                )}
                            </div>

                            <div className="flex items-center gap-[6px] text-[10px] text-[#3B82F6] font-normal mt-1">
                                <button
                                    onClick={() => {
                                        setSelectedStaffIndex(idx);
                                        setCurrentNote(entry.note || "");
                                        setIsNotePopupOpen(true);
                                    }}
                                    className="hover:underline transition-all"
                                >
                                    Add Note
                                </button>
                                <span className="text-[#3B82F6] opacity-30">-</span>
                                <button
                                    onClick={() => {
                                        setSelectedStaffIndex(idx);
                                        setIsLogsPopupOpen(true);
                                    }}
                                    className="hover:underline transition-all"
                                >
                                    Logs
                                </button>
                            </div>
                        </div>

                        {/* Right Side: Status Buttons */}
                        <div className="grid grid-cols-3 gap-x-[16px] gap-y-[12px]">
                            <StatusButton
                                label={entry.status === "Present" && entry.time ? entry.time : "Present"}
                                short="P"
                                active={entry.status === "Present"}
                                type="Present"
                                onClick={() => handleStatusChange(idx, "Present")}
                            />
                            <StatusButton
                                label={(entry.status === "Half Day" || (entry.status === "Leave" && entry.isHalfDayLeave)) && entry.hfSession
                                    ? `Session ${entry.hfSession === "Session 1" ? "2" : "1"}`
                                    : "Half Day"}
                                short="HD"
                                active={!!(entry.status === "Half Day" || (entry.status === "Leave" && entry.isHalfDayLeave))}
                                type="Half Day"
                                onClick={() => handleStatusChange(idx, "Half Day")}
                            />
                            <StatusButton
                                label="Absent"
                                short="A"
                                active={entry.status === "Absent"}
                                type="Absent"
                                onClick={() => handleStatusChange(idx, "Absent")}
                            />
                            <StatusButton
                                label={entry.fineValue ? `- ${entry.fineValue} Hrs` : "Fine"}
                                short="F"
                                active={!!entry.fineValue}
                                type="Fine"
                                onClick={() => handleFineOvertimeClick(idx, "Fine")}
                            />
                            <StatusButton
                                label={entry.overtimeValue ? `+ ${entry.overtimeValue} Hrs` : "Overtime"}
                                short="OT"
                                active={!!entry.overtimeValue}
                                type="Overtime"
                                onClick={() => handleFineOvertimeClick(idx, "Overtime")}
                            />
                            <StatusButton
                                label={(entry.status === "Leave" || (entry.status === "Half Day" && entry.hfLeaveType && !["Unpaid", "Other"].includes(entry.hfLeaveType)))
                                    ? `${entry.status === "Leave" ? entry.leaveType : entry.hfLeaveType}`
                                    : "Leave"}
                                short={(entry.status === "Leave" && entry.leaveType === "Weekly Off") ? "WO" : "L"}
                                active={!!(entry.status === "Leave" || (entry.status === "Half Day" && entry.hfLeaveType && !["Unpaid", "Other"].includes(entry.hfLeaveType)))}
                                type="Leave"
                                onClick={() => handleStatusChange(idx, "Leave")}
                            />
                        </div>
                    </Card>
                ))}
            </div>

            {/* Popups */}
            <Dialog open={isNotePopupOpen} onOpenChange={setIsNotePopupOpen}>
                <DialogContent showCloseButton={false} className="w-fit p-0 border-none bg-transparent shadow-none">
                    <div className="bg-white rounded-[8px] w-[340px] p-[28px] flex flex-col relative shadow-xl border border-gray-100">
                        <DialogHeader className="mb-[24px]">
                            <DialogTitle className="text-[22px] font-semibold text-[#1F2937]">Add Note</DialogTitle>
                            <p className="text-[15px] text-[#9CA3AF] font-normal">{selectedStaffIndex !== null && filteredStaff[selectedStaffIndex].name}</p>
                        </DialogHeader>
                        <DialogClose className="absolute top-[28px] right-[28px] bg-[#F3F4F6] hover:bg-[#E5E7EB] rounded-[8px] p-[6px]">
                            <X className="w-[18px] h-[18px] text-[#1F2937]" />
                        </DialogClose>
                        <Textarea
                            value={currentNote}
                            onChange={(e) => setCurrentNote(e.target.value)}
                            placeholder="Write here"
                            className="flex-1 min-h-[150px] resize-none border-gray-200 focus:border-[#3F5A54] rounded-[12px] p-[16px] text-[15px] mb-[28px]"
                        />
                        <div className="flex gap-[12px]">
                            <Button variant="outline" onClick={() => setIsNotePopupOpen(false)} className="flex-1 h-[42px] border-[#3F5A54] text-[#3F5A54] rounded-[12px]">Cancel</Button>
                            <Button onClick={handleSaveNote} className="flex-1 h-[42px] bg-[#3F5A54] text-white rounded-[12px]">Save</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isLogsPopupOpen} onOpenChange={setIsLogsPopupOpen}>
                <DialogContent showCloseButton={false} className="w-fit p-0 border-none bg-transparent">
                    <DialogTitle className="sr-only">Staff Logs</DialogTitle>
                    {selectedStaffIndex !== null && (() => {
                        const entry = filteredStaff[selectedStaffIndex];
                        // Group punches by IN/OUT pairs or individual attempts
                        const logs = entry.attendance || [];
                        
                        return (
                            <div className="bg-white rounded-[16px] w-[420px] p-[32px] flex flex-col relative shadow-2xl border border-gray-100">
                                <DialogHeader className="mb-[28px]">
                                    <div className="flex flex-col gap-[8px]">
                                        <DialogTitle className="text-[22px] font-bold text-[#1F2937] leading-tight">
                                            {entry.name.replace(" undefined", "")}
                                        </DialogTitle>
                                        <div className="flex items-center gap-[8px] text-[13px] text-[#9CA3AF]">
                                            <span>{format(selectedDate, "dd MMMM | EEE")}</span>
                                            {entry.duration && (
                                                <>
                                                    <span className="w-[4px] h-[4px] rounded-full bg-[#D1D5DB]" />
                                                    <div className="flex items-center gap-[4px] text-[#4B5563] font-medium">
                                                        <Clock size={14} />
                                                        <span>Worked: {entry.duration.replace(" Hrs", "")} Hrs</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </DialogHeader>
                                
                                <DialogClose className="absolute top-[32px] right-[32px] bg-[#F3F4F6] p-[6px] rounded-[8px] hover:bg-gray-200 transition-colors">
                                    <X className="w-[18px] h-[18px] text-[#4B5563]" />
                                </DialogClose>
                                
                                <div className="flex-1 max-h-[350px] overflow-y-auto pr-1">
                                    {logs.length === 0 ? (
                                        <div className="py-[40px] flex flex-col items-center justify-center text-gray-400 gap-[16px]">
                                            <div className="w-[48px] h-[48px] rounded-full bg-gray-50 flex items-center justify-center">
                                                <CircleAlert className="w-[24px] h-[24px] opacity-20" />
                                            </div>
                                            <span className="text-[14px] italic">No logs found for this date!</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 pt-2 ml-1">
                                            {logs.map((punch: any, pIdx: number) => {
                                                const punchTime = new Date(punch.time);
                                                const isOut = punch.type === "OUT";
                                                
                                                return (
                                                    <div key={pIdx} className="flex items-start gap-4">
                                                        <div className={cn(
                                                            "w-2.5 h-2.5 rounded-full mt-1.5 shrink-0",
                                                            isOut ? "bg-[#3F5A54]" : "bg-[#3F5A54]" // Using a consistent theme color from screenshot
                                                        )} />
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-[15px] font-bold text-[#1F2937]">Punched {isOut ? "Out" : "In"}</span>
                                                            <span className="text-[13px] text-[#4B5563]">At {format(punchTime, "hh:mm a")}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                
                                <Button 
                                    onClick={() => setIsLogsPopupOpen(false)} 
                                    className="mt-[32px] w-full h-[48px] bg-white border border-gray-200 text-[#3F5A54] hover:bg-gray-50 rounded-[10px] font-medium text-[16px] transition-all shadow-none"
                                >
                                    Done
                                </Button>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            <Dialog open={isPresentPopupOpen} onOpenChange={setIsPresentPopupOpen}>
                <DialogContent showCloseButton={false} className="w-fit p-0 border-none bg-transparent shadow-none">
                    <div className="bg-white rounded-[16px] w-[500px] p-[32px] flex flex-col relative shadow-2xl">
                        <DialogHeader className="mb-[28px]">
                            <DialogTitle className="text-[22px] font-bold text-[#1F2937]">{markingStatus} | <span className="text-[#9CA3AF] font-normal text-[18px]">{format(selectedDate, "dd MMM yyyy")}</span></DialogTitle>
                        </DialogHeader>
                        <DialogClose className="absolute top-[28px] right-[28px] bg-[#F3F4F6] p-[6px] rounded-[8px]"><X className="w-[18px] h-[18px]" /></DialogClose>
                        <div className="bg-[#f9fafb] rounded-[12px] p-[24px] mb-[16px]">
                            <div className="flex gap-[20px]">
                                <div className="flex-1 flex flex-col gap-[8px]">
                                    <label className="text-[14px] font-medium text-[#4B5563]">In Time</label>
                                    <TimePicker value={tempInTime} onChange={setTempInTime} />
                                </div>
                                <div className="flex-1 flex flex-col gap-[8px]">
                                    <label className="text-[14px] font-medium text-[#4B5563]">Out Time</label>
                                    <TimePicker value={tempOutTime} onChange={setTempOutTime} />
                                </div>
                            </div>
                        </div>
                        {showOutTimeError && <p className="text-orange-500 text-[12px] mb-4 flex items-center gap-1"><i>i</i> Out time is mandatory to mark present</p>}
                        <div className="flex gap-[16px] mt-4">
                            <Button variant="outline" onClick={() => setIsPresentPopupOpen(false)} className="flex-1 h-[48px] border-[#3F5A54] text-[#3F5A54] rounded-[12px]">Cancel</Button>
                            <Button onClick={handleSavePresent} className="flex-1 h-[48px] bg-[#3F5A54] text-white rounded-[12px]">Save</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isLeavePopupOpen} onOpenChange={setIsLeavePopupOpen}>
                <DialogContent showCloseButton={false} className="w-fit p-0 border-none bg-transparent">
                    <div className="bg-white rounded-[16px] w-[380px] p-[28px] flex flex-col relative shadow-2xl">
                        <DialogHeader className="mb-[24px]">
                            <DialogTitle className="text-[20px] font-bold text-[#1F2937]">Deduct Leave</DialogTitle>
                            <p className="text-[16px] text-[#9CA3AF] font-bold uppercase">{selectedStaffIndex !== null && filteredStaff[selectedStaffIndex].name}</p>
                        </DialogHeader>
                        <div className="flex flex-col gap-[10px] mb-[28px]">
                            {Object.entries(leaveBalances).map(([type, balance]) => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedLeaveType(type)}
                                    className={cn(
                                        "h-[46px] w-full rounded-[10px] border px-[16px] flex items-center justify-between transition-all",
                                        selectedLeaveType === type ? "border-[#2563EB] bg-[#EFF6FF]" : "border-gray-100 bg-white"
                                    )}
                                >
                                    <div className="flex items-center gap-[12px]">
                                        <div className={cn("w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center", selectedLeaveType === type ? "border-[#2563EB]" : "border-gray-200")}>
                                            {selectedLeaveType === type && <div className="w-[10px] h-[10px] rounded-full bg-[#2563EB]" />}
                                        </div>
                                        <span className="text-[14px] font-medium">{type}</span>
                                    </div>
                                    <span className="text-[14px] font-medium text-[#1F2937]">{balance} Left</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-[16px]">
                            <Button variant="outline" onClick={() => setIsLeavePopupOpen(false)} className="flex-1 h-[48px] border-[#2563EB] text-[#2563EB] rounded-[12px]">Cancel</Button>
                            <Button onClick={handleSaveLeave} className="flex-1 h-[48px] bg-[#2563EB] text-white rounded-[12px]">Save</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isHalfDayOptionPopupOpen} onOpenChange={setIsHalfDayOptionPopupOpen}>
                <DialogContent showCloseButton={false} className="w-fit p-0 border-none bg-transparent">
                    <div className="bg-white rounded-[16px] w-[380px] p-[28px] flex flex-col relative shadow-2xl">
                        <DialogHeader className="mb-[10px]">
                            <DialogTitle className="text-[20px] font-bold text-[#1F2937]">Half Day Option</DialogTitle>
                            <p className="text-[16px] text-[#9CA3AF] font-bold uppercase">{selectedStaffIndex !== null && filteredStaff[selectedStaffIndex].name}</p>
                        </DialogHeader>
                        <DialogClose className="absolute top-[28px] right-[28px] bg-[#F3F4F6] p-[4px] rounded-[6px]"><X className="w-[18px] h-[18px]" /></DialogClose>
                        <p className="text-[14px] text-[#4B5563] mb-[24px]">Choose if you want to give a paid/unpaid leave for the remaining half day</p>
                        <select
                            value={selectedHfLeaveType}
                            onChange={(e) => setSelectedHfLeaveType(e.target.value)}
                            className="w-full h-[48px] border border-blue-200 rounded-[10px] px-[16px] mb-6 outline-none"
                        >
                            <option value="Unpaid">Unpaid</option>
                            <option value="Other">Other</option>
                            <option value="Casual Leave">Casual Leave</option>
                            <option value="Sick Leave">Sick Leave</option>
                        </select>
                        <div className="flex flex-col gap-3 mb-8">
                            <span className="text-[14px] text-gray-400 font-medium">Choose Session</span>
                            <div className="flex gap-3">
                                {["Session 1", "Session 2"].map(s => (
                                    <button key={s} onClick={() => setSelectedHfSession(s)} className={cn("flex-1 h-[48px] rounded-[10px] border flex items-center justify-center font-bold", selectedHfSession === s ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]" : "border-gray-100")}>{s}</button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-[16px]">
                            <Button variant="outline" onClick={() => setIsHalfDayOptionPopupOpen(false)} className="flex-1 h-[48px] border-[#2563EB] text-[#2563EB] rounded-[12px]">Cancel</Button>
                            <Button onClick={handleSaveHalfDayOption} className="flex-1 h-[48px] bg-[#2563EB] text-white rounded-[12px]">Save</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isFineOvertimeErrorPopupOpen} onOpenChange={setIsFineOvertimeErrorPopupOpen}>
                <DialogContent showCloseButton={false} className="w-fit p-0 border-none bg-transparent">
                    <div className="bg-white rounded-[12px] w-[400px] p-[24px] flex flex-col relative shadow-2xl">
                        <DialogHeader className="mb-4">
                            <DialogTitle className="text-[18px] font-semibold">{errorPopupType}</DialogTitle>
                        </DialogHeader>
                        <DialogClose className="absolute top-[24px] right-[24px] bg-[#F3F4F6] p-[4px] rounded-[6px]"><X className="w-[16px] h-[16px]" /></DialogClose>
                        <p className="text-[16px] text-[#1F2937] font-medium">Please mark the attendance first to add a {errorPopupType} entry</p>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isFineEntryPopupOpen} onOpenChange={setIsFineEntryPopupOpen}>
                <DialogContent showCloseButton={false} className="w-fit p-0 border-none bg-transparent shadow-none focus:outline-none flex items-center justify-center">
                    <div className="bg-white rounded-[16px] w-[500px] pt-[20px] pb-[20px] px-[20px] flex flex-col relative shadow-2xl border border-gray-100">
                        <div className="flex flex-col gap-[2px] mb-[12px]">
                            <DialogHeader>
                                <DialogTitle className="text-[17px] font-bold text-[#1F2937]">Fine</DialogTitle>
                            </DialogHeader>
                            <p className="text-[13px] text-[#9CA3AF] font-normal">{selectedStaffIndex !== null && filteredStaff[selectedStaffIndex].name}</p>
                        </div>

                        <DialogClose className="absolute top-[28px] right-[28px] text-gray-300 hover:text-gray-500 transition-colors focus:outline-none">
                            <X className="w-5 h-5" />
                        </DialogClose>

                        <div className="flex flex-col gap-[12px] mb-[24px]">
                            {[
                                { key: 'lateEntry', label: 'Late Entry' },
                                { key: 'earlyOut', label: 'Early Out' },
                                { key: 'excessBreaks', label: 'Excess Breaks' }
                            ].map((section) => {
                                const data = fineSections[section.key as keyof typeof fineSections];
                                return (
                                    <div key={section.key} className="bg-[#EFF0FE] rounded-[8px] p-[10px] relative">
                                        <div className="flex items-center justify-between mb-[8px]">
                                            <h4 className="text-[12px] font-bold text-[#1F2937]">{section.label}</h4>
                                        </div>

                                        <div className="flex gap-[12px] items-end">
                                            <div className="flex flex-col gap-[6px]">
                                                <label className="text-[11px] text-gray-400 font-medium">Actual Hours</label>
                                                <div className="h-[36px] w-[95px] bg-white rounded-[6px] border border-gray-100 flex items-center px-2.5 gap-1.5 focus-within:border-[#3F5A54] transition-colors">
                                                    <input
                                                        type="text"
                                                        value={data.actual}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setFineSections(prev => ({
                                                                ...prev,
                                                                [section.key]: {
                                                                    ...prev[section.key as keyof typeof fineSections],
                                                                    actual: val,
                                                                    target: (prev[section.key as keyof typeof fineSections].target === "00:00" ||
                                                                        prev[section.key as keyof typeof fineSections].target === prev[section.key as keyof typeof fineSections].actual)
                                                                        ? val : prev[section.key as keyof typeof fineSections].target
                                                                }
                                                            }));
                                                        }}
                                                        className="text-[13px] font-medium text-[#1F2937] w-full bg-transparent outline-none"
                                                    />
                                                    <span className="text-[11px] text-gray-400">hrs</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-[6px]">
                                                <label className="text-[11px] text-gray-400 font-medium">Hours</label>
                                                <div className="h-[36px] w-[95px] bg-white rounded-[6px] border border-gray-100 flex items-center px-2.5 gap-1.5 focus-within:border-[#3F5A54] transition-colors">
                                                    <input
                                                        type="text"
                                                        value={data.target}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setFineSections(prev => ({
                                                                ...prev,
                                                                [section.key]: { ...prev[section.key as keyof typeof fineSections], target: val }
                                                            }));
                                                        }}
                                                        className="text-[13px] font-medium text-[#1F2937] w-full bg-transparent outline-none"
                                                    />
                                                    <span className="text-[11px] text-gray-400">hrs</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-[6px] flex-1">
                                                <label className="text-[11px] text-gray-400 font-medium">{data.multiplier === "Fixed Amount" ? "Total Amount" : "Fine Amount"}</label>
                                                <div className="flex gap-1.5">
                                                    <select
                                                        className="h-[36px] flex-1 bg-white rounded-[6px] border border-gray-100 text-[13px] px-2.5 outline-none appearance-none cursor-pointer"
                                                        value={data.multiplier}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setFineSections(prev => ({
                                                                ...prev,
                                                                [section.key]: { ...prev[section.key as keyof typeof fineSections], multiplier: val }
                                                            }));
                                                        }}
                                                    >
                                                        {multipliers.map(m => <option key={m} value={m}>{m}</option>)}
                                                    </select>
                                                    <div className="h-[36px] w-[140px] bg-white rounded-[6px] border border-gray-100 flex items-center px-2.5 gap-1.5 focus-within:border-[#3F5A54] transition-colors">
                                                        <span className="text-[13px]">₹</span>
                                                        <input
                                                            type="number"
                                                            value={data.amountPerHr}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value);
                                                                setFineSections(prev => ({
                                                                    ...prev,
                                                                    [section.key]: { ...prev[section.key as keyof typeof fineSections], amountPerHr: val || 0 }
                                                                }));
                                                            }}
                                                            className="text-[13px] font-medium text-[#1F2937] w-full bg-transparent outline-none"
                                                        />
                                                        <span className="text-[11px] text-gray-400">{data.multiplier === "Fixed Amount" ? "" : "/HR"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-[4px] flex items-center justify-between">
                                            <p className="text-[10px] text-gray-400 font-medium tracking-wide">CALCULATED VALUE</p>
                                            <p className="text-[11px] text-[#3F5A54] font-bold">₹ {calculateFine(data.target, data.multiplier, data.amountPerHr).toFixed(2)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex flex-col gap-[4px] mt-[4px] mb-[20px]">
                            <div className="flex items-center justify-between py-[8px] border-y border-gray-50">
                                <span className="text-[15px] font-bold text-[#1F2937]">Total Amount:</span>
                                <span className="text-[18px] font-bold text-[#1F2937]">₹ {
                                    Object.values(fineSections).reduce((total, section) => 
                                        total + calculateFine(section.target, section.multiplier, section.amountPerHr)
                                    , 0).toFixed(2)
                                }</span>
                            </div>

                            <div className="flex items-center gap-[8px] mt-[4px]">
                                <input 
                                    type="checkbox" 
                                    id="send-sms-fine" 
                                    checked={isSmsEnabled} 
                                    onChange={(e) => setIsSmsEnabled(e.target.checked)} 
                                    className="w-[16px] h-[16px] rounded border-gray-300 text-[#3F5A54] focus:ring-[#3F5A54] cursor-pointer"
                                />
                                <label htmlFor="send-sms-fine" className="text-[13px] text-[#4B5563] font-medium cursor-pointer select-none">Send SMS to Staff</label>
                            </div>
                        </div>

                        <Button onClick={handleApplyFine} className="w-full h-[48px] bg-[#3F5A54] text-white hover:bg-[#344b46] rounded-[8px] font-semibold text-[16px]">Apply Fine</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isOvertimeEntryPopupOpen} onOpenChange={setIsOvertimeEntryPopupOpen}>
                <DialogContent showCloseButton={false} className="w-fit p-0 border-none bg-transparent shadow-none focus:outline-none flex items-center justify-center">
                    <div className="bg-white rounded-[16px] w-[500px] pt-[20px] pb-[20px] px-[20px] flex flex-col relative shadow-2xl border border-gray-100">
                        <div className="flex flex-col gap-[2px] mb-[12px]">
                            <DialogHeader>
                                <DialogTitle className="text-[17px] font-bold text-[#1F2937]">Overtime</DialogTitle>
                            </DialogHeader>
                            <p className="text-[13px] text-[#9CA3AF] font-normal">{selectedStaffIndex !== null && filteredStaff[selectedStaffIndex].name}</p>
                        </div>

                        <DialogClose className="absolute top-[28px] right-[28px] text-gray-300 hover:text-gray-500 transition-colors focus:outline-none">
                            <X className="w-5 h-5" />
                        </DialogClose>

                        <div className="flex flex-col gap-[12px] mb-[24px]">
                            {[
                                { key: 'afterShift', label: 'Overtime | after the shift ends' },
                                { key: 'beforeShift', label: 'Early Overtime | before the shift begins' }
                            ].map((section) => {
                                const data = overtimeSections[section.key as keyof typeof overtimeSections];
                                return (
                                    <div key={section.key} className="bg-[#EFF0FE] rounded-[8px] p-[10px] relative">
                                        <div className="flex items-center justify-between mb-[8px]">
                                            <h4 className="text-[12px] font-bold text-[#1F2937]">{section.label}</h4>
                                        </div>

                                        <div className="flex gap-[12px] items-end">
                                            <div className="flex flex-col gap-[6px]">
                                                <label className="text-[11px] text-gray-400 font-medium">Actual Hours</label>
                                                <div className="h-[36px] w-[95px] bg-white rounded-[6px] border border-gray-100 flex items-center px-2.5 gap-1.5 focus-within:border-[#3F5A54] transition-colors">
                                                    <input
                                                        type="text"
                                                        value={data.actual}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setOvertimeSections(prev => ({
                                                                ...prev,
                                                                [section.key]: {
                                                                    ...prev[section.key as keyof typeof overtimeSections],
                                                                    actual: val,
                                                                    target: (prev[section.key as keyof typeof overtimeSections].target === "00:00" ||
                                                                        prev[section.key as keyof typeof overtimeSections].target === prev[section.key as keyof typeof overtimeSections].actual)
                                                                        ? val : prev[section.key as keyof typeof overtimeSections].target
                                                                }
                                                            }));
                                                        }}
                                                        className="text-[13px] font-medium text-[#1F2937] w-full bg-transparent outline-none"
                                                    />
                                                    <span className="text-[11px] text-gray-400">hrs</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-[6px]">
                                                <label className="text-[11px] text-gray-400 font-medium">Hours</label>
                                                <div className="h-[36px] w-[95px] bg-white rounded-[6px] border border-gray-100 flex items-center px-2.5 gap-1.5 focus-within:border-[#3F5A54] transition-colors">
                                                    <input
                                                        type="text"
                                                        value={data.target}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setOvertimeSections(prev => ({
                                                                ...prev,
                                                                [section.key]: { ...prev[section.key as keyof typeof overtimeSections], target: val }
                                                            }));
                                                        }}
                                                        className="text-[13px] font-medium text-[#1F2937] w-full bg-transparent outline-none"
                                                    />
                                                    <span className="text-[11px] text-gray-400">hrs</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-[6px] flex-1">
                                                <label className="text-[11px] text-gray-400 font-medium">{data.multiplier === "Fixed Amount" ? "Total Amount" : "Overtime Amount"}</label>
                                                <div className="flex gap-1.5">
                                                    <select
                                                        className="h-[36px] flex-1 bg-white rounded-[6px] border border-gray-100 text-[13px] px-2.5 outline-none appearance-none cursor-pointer"
                                                        value={data.multiplier}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setOvertimeSections(prev => ({
                                                                ...prev,
                                                                [section.key]: { ...prev[section.key as keyof typeof overtimeSections], multiplier: val }
                                                            }));
                                                        }}
                                                    >
                                                        {multipliers.map(m => <option key={m} value={m}>{m}</option>)}
                                                    </select>
                                                    <div className="h-[36px] w-[140px] bg-white rounded-[6px] border border-gray-100 flex items-center px-2.5 gap-1.5 focus-within:border-[#3F5A54] transition-colors">
                                                        <span className="text-[13px]">₹</span>
                                                        <input
                                                            type="number"
                                                            value={data.amountPerHr}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value);
                                                                setOvertimeSections(prev => ({
                                                                    ...prev,
                                                                    [section.key]: { ...prev[section.key as keyof typeof overtimeSections], amountPerHr: val || 0 }
                                                                }));
                                                            }}
                                                            className="text-[13px] font-medium text-[#1F2937] w-full bg-transparent outline-none"
                                                        />
                                                        <span className="text-[11px] text-gray-400">{data.multiplier === "Fixed Amount" ? "" : "/HR"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-[4px] flex items-center justify-between">
                                            <p className="text-[10px] text-gray-400 font-medium tracking-wide">CALCULATED VALUE</p>
                                            <p className="text-[11px] text-[#3F5A54] font-bold">₹ {calculateFine(data.target, data.multiplier, data.amountPerHr).toFixed(2)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex flex-col gap-[4px] mt-[4px] mb-[20px]">
                            <div className="flex items-center justify-between py-[8px] border-y border-gray-50">
                                <span className="text-[15px] font-bold text-[#1F2937]">Total Amount:</span>
                                <span className="text-[18px] font-bold text-[#1F2937]">₹ {
                                    Object.values(overtimeSections).reduce((total, section) => 
                                        total + calculateFine(section.target, section.multiplier, section.amountPerHr)
                                    , 0).toFixed(2)
                                }</span>
                            </div>

                            <div className="flex items-center gap-[8px] mt-[4px]">
                                <input 
                                    type="checkbox" 
                                    id="send-sms-overtime" 
                                    checked={isSmsEnabled} 
                                    onChange={(e) => setIsSmsEnabled(e.target.checked)} 
                                    className="w-[16px] h-[16px] rounded border-gray-300 text-[#3F5A54] focus:ring-[#3F5A54] cursor-pointer"
                                />
                                <label htmlFor="send-sms-overtime" className="text-[13px] text-[#4B5563] font-medium cursor-pointer select-none">Send SMS to Staff</label>
                            </div>
                        </div>

                        <Button onClick={handleApplyOvertime} className="w-full h-[48px] bg-[#3F5A54] text-white hover:bg-[#344b46] rounded-[8px] font-semibold text-[16px]">Apply Overtime</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function TimePicker({ value, onChange }: { value: string, onChange: (val: string) => void }) {
    return (
        <input
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-[16px] h-[48px] bg-white border border-gray-200 rounded-[10px] text-[14px] outline-none focus:border-[#3F5A54]"
        />
    );
}

function StatusButton({ label, short, active, type, onClick }: { label: string, short: string, active: boolean, type: string, onClick: () => void }) {
    let styles = "bg-[#F3F4F6] border-transparent text-[#4B5563]";

    if (active) {
        if (type === "Present") styles = "bg-[#22C55E] border-[#22C55E] text-white";
        else if (type === "Absent") styles = "bg-[#EF4444] border-[#EF4444] text-white";
        else if (type === "Fine") styles = "bg-[#EF4444] border-[#EF4444] text-white";
        else if (type === "Overtime") styles = "bg-[#22C55E] border-[#22C55E] text-white";
        else if (type === "Half Day") styles = "bg-[#F97316] border-[#F97316] text-white";
        else if (type === "Leave") styles = "bg-[#9333EA] border-[#9333EA] text-white";
        else styles = "bg-[#EFF6FF] border-[#3B82F6] text-[#1E40AF]";
    }

    return (
        <button
            onClick={onClick}
            className={cn(
                "h-[39px] w-[140px] rounded-[6px] flex items-center px-[12px] border transition-all",
                styles
            )}
        >
            <div className="flex items-center gap-[6px] w-full">
                <span className="text-[12px] font-bold shrink-0">{short}</span>
                <span className="h-[12px] w-px bg-current opacity-20"></span>
                <span className="text-[10px] font-normal truncate flex-1 text-left">{label}</span>
            </div>
        </button>
    );
}
