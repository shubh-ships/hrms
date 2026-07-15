"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    MoveLeft,
    ChevronLeft,
    ChevronRight,
    Download,
    CalendarDays,
    ChevronDown,
    Clock,
    User,
    CircleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { X, Calendar as CalendarIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import * as XLSX from 'xlsx';
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { fetchMonthlyAttendanceSummary, selectMonthlyAttendanceSummary, selectNewAttendanceLoading, fetchAttendanceByDate, selectSelectedDateAttendance, selectDateLoading, markAttendance, removeLeave, fetchLeaveBalance, selectLeaveBalance, createFine, createOvertime } from "@/features/newAttendance/newAttendanceSlice";
import { toast } from "sonner";

interface AttendanceEntry {
    date: string;
    day: string;
    fullDate?: string; // e.g. "2026-03-01"
    status: "Present" | "Absent" | "Half Day" | "Not Marked" | "Leave" | "Fine" | "Overtime" | "Holiday" | "Week Off";
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
    isPending?: boolean;
    shiftId?: string;
    attendanceId?: string;
    penalties?: any[];
    earnings?: any[];
}

const statusMap: Record<string, AttendanceEntry["status"]> = {
    "PRESENT": "Present",
    "ABSENT": "Absent",
    "HALF_DAY": "Half Day",
    "LEAVE": "Leave",
    "NOT_MARKED": "Not Marked",
    "WEEK_OFF": "Weekly Off",
    "HOLIDAY": "Holiday",
};

const statusToType: Record<string, string> = {
    "Present": "PRESENT",
    "Absent": "ABSENT",
    "Half Day": "HALF_DAY",
    "Leave": "LEAVE",
    "Not Marked": "NOT_MARKED",
};

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
    if (diff < 0) diff += 1440; // Add 24 hours if end is before start (overnight)

    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}:${m.toString().padStart(2, '0')} Hrs`;
};

export default function EmployeeAttendance({ id }: { id: string }) {
    const router = useRouter();
    const dispatch: any = useDispatch();
    const monthlySummary = useSelector(selectMonthlyAttendanceSummary);
    const isLoadingSummary = useSelector(selectNewAttendanceLoading);
    const selectedDateAttendance = useSelector(selectSelectedDateAttendance);
    const isDateLoading = useSelector(selectDateLoading);
    const leaveBalanceRedux = useSelector(selectLeaveBalance);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Current date by default
    const [employeeName, setEmployeeName] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [shiftId, setShiftId] = useState("");
    const [organizationId, setOrganizationId] = useState("");
    const [sendSms, setSendSms] = useState(false);
    const [leaveType, setLeaveType] = useState("All");

    // Mock data for attendance
    const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);

    const [isNotePopupOpen, setIsNotePopupOpen] = useState(false);
    const [isLogsPopupOpen, setIsLogsPopupOpen] = useState(false);
    const [isDownloadPopupOpen, setIsDownloadPopupOpen] = useState(false);
    const [selectedEntryIdx, setSelectedEntryIdx] = useState<number | null>(null);
    const [isPresentPopupOpen, setIsPresentPopupOpen] = useState(false);
    const [isFineOvertimeErrorPopupOpen, setIsFineOvertimeErrorPopupOpen] = useState(false);
    const [isFineEntryPopupOpen, setIsFineEntryPopupOpen] = useState(false);
    const [isOvertimeEntryPopupOpen, setIsOvertimeEntryPopupOpen] = useState(false);
    const [isCustomMultiplierPopupOpen, setIsCustomMultiplierPopupOpen] = useState(false);
    const [customMultiplierValue, setCustomMultiplierValue] = useState("");

    const [errorPopupType, setErrorPopupType] = useState<"Fine" | "Overtime">("Fine");
    const [markingStatus, setMarkingStatus] = useState<"Present" | "Half Day">("Present");

    const [fineSections, setFineSections] = useState({
        lateEntry: { enabled: true, actual: "00:00", target: "00:00", multiplier: "1x Salary", amountPerHr: 0.01 },
        earlyOut: { enabled: true, actual: "00:00", target: "00:00", multiplier: "1x Salary", amountPerHr: 0.01 },
        excessBreaks: { enabled: true, actual: "00:00", target: "00:00", multiplier: "1x Salary", amountPerHr: 0.01 },
    });

    const [overtimeSections, setOvertimeSections] = useState({
        afterShift: { enabled: true, target: "00:00", multiplier: "1x Salary", amountPerHr: 0.01 },
        beforeShift: { enabled: true, target: "00:00", multiplier: "1x Salary", amountPerHr: 0.01 },
    });

    const [multipliers, setMultipliers] = useState(["Fixed Amount", "Half Day", "Full Day", "Pardon", "1x Salary", "1.5x Salary", "2x Salary", "4x Salary", "10x Salary"]);
    const [fineSendSms, setFineSendSms] = useState(false);
    const [overtimeSendSms, setOvertimeSendSms] = useState(false);

    const [currentNote, setCurrentNote] = useState("");
    const [selectedEntryIndex, setSelectedEntryIndex] = useState<number | null>(null);
    const [isDeactivated, setIsDeactivated] = useState(false);
    const [deactivatedDate, setDeactivatedDate] = useState("16 Jan 2026");
    const [isAllApproved, setIsAllApproved] = useState(false);

    const [tempInTime, setTempInTime] = useState("");
    const [tempOutTime, setTempOutTime] = useState("");
    const [showOutTimeError, setShowOutTimeError] = useState(false);
    const [isLeavePopupOpen, setIsLeavePopupOpen] = useState(false);
    const [selectedLeaveType, setSelectedLeaveType] = useState<string>("");
    const [leaveBalances, setLeaveBalances] = useState<any[]>([]);

    const [isHalfDayOptionPopupOpen, setIsHalfDayOptionPopupOpen] = useState(false);
    const [selectedHfLeaveType, setSelectedHfLeaveType] = useState<string>("Unpaid");
    const [selectedHfSession, setSelectedHfSession] = useState<string>("Session 1");
    const [selectedLeaveSession, setSelectedLeaveSession] = useState<"Full Day" | "Session 1" | "Session 2">("Full Day");
    const [pendingDates, setPendingDates] = useState<string[]>([]);
    const [isRemoveLeavePopupOpen, setIsRemoveLeavePopupOpen] = useState(false);

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(selectedDate),
        to: endOfMonth(selectedDate),
    });

    useEffect(() => {
        if (id) {
            dispatch(fetchMonthlyAttendanceSummary({
                employeeId: id,
                month: selectedDate.getMonth() + 1,
                year: selectedDate.getFullYear()
            }));
            dispatch(fetchLeaveBalance(id));
        }
    }, [dispatch, id, selectedDate]);

    useEffect(() => {
        if (leaveBalanceRedux && leaveBalanceRedux.leaveCategories) {
            setLeaveBalances(leaveBalanceRedux.leaveCategories);
            if (leaveBalanceRedux.leaveCategories.length > 0 && !selectedLeaveType) {
                const casual = leaveBalanceRedux.leaveCategories.find((c: any) => c.categoryName.toLowerCase().includes("casual"));
                setSelectedLeaveType(casual ? casual.categoryId : leaveBalanceRedux.leaveCategories[0].categoryId);
            }
        }
    }, [leaveBalanceRedux, selectedLeaveType]);

    // Generate entries for the selected month and LOAD from monthlySummary
    useEffect(() => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const now = new Date();
        const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
        const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

        const entriesMap: Record<string, AttendanceEntry> = {};

        // 1. Pre-generate ALL days in the month as "Not Marked"
        for (let i = 1; i <= totalDaysInMonth; i++) {
            const dateObj = new Date(year, month, i);
            const fullDateStr = format(dateObj, "yyyy-MM-dd");
            entriesMap[fullDateStr] = {
                date: format(dateObj, "d MMMM"),
                day: format(dateObj, "EEE"),
                fullDate: fullDateStr,
                status: "Not Marked",
                isPending: false,
                shiftId: shiftId
            };
        }

        // 2. Overlay actual API data (Only for the selected month/year)
        if (monthlySummary?.items) {
            monthlySummary.items.forEach((item: any) => {
                const dateParts = item.attendanceDate.split('-');
                const itemYear = parseInt(dateParts[0]);
                const itemMonth = parseInt(dateParts[1]) - 1; // 0-indexed
                const itemDay = parseInt(dateParts[2]);

                // STRICT FILTER: Only accept items that belong to the selected month and year
                if (itemYear !== year || itemMonth !== month) return;

                const dateObj = new Date(itemYear, itemMonth, itemDay);
                const fullDateStr = item.attendanceDate;
                const status = statusMap[item.attendanceType] || "Not Marked";

                let timeStr = "";
                let durationStr = "";
                let hfLeaveType = undefined;
                let hfSession = undefined;
                let entryShiftId = undefined;

                // Handle both array (legacy) and object (current) formats for item.attendance
                const attendanceData = Array.isArray(item.attendance) ? item.attendance[0] : item.attendance;

                if (attendanceData) {
                    const workSession = Array.isArray(item.attendance)
                        ? item.attendance.find((a: any) => a.inTime && a.outTime)
                        : (attendanceData.inTime ? attendanceData : null);

                    if (workSession) {
                        const inT = format(new Date(workSession.inTime), "hh:mm a");
                        const outT = format(new Date(workSession.outTime), "hh:mm a");
                        timeStr = `${inT} - ${outT}`;
                        durationStr = calculateDuration(inT, outT);
                    }
                    entryShiftId = attendanceData.shiftId;

                    // Look specifically for the leave session in a half-day scenario
                    const sessions = attendanceData.sessions || [];
                    const leaveSession = sessions.find((a: any) => a.session && (a.type === "LEAVE" || a.type === "UNPAID" || a.type === "WEEK_OFF"));
                    const workSessionHalf = sessions.find((a: any) => a.session && a.type === "HALF_DAY");

                    if (leaveSession) {
                        const rawType = leaveSession.leaveName || leaveSession.leaveType || undefined;
                        hfLeaveType = (rawType && rawType !== "..." && rawType !== "-") ? rawType : "Leave";
                        hfSession = leaveSession.session === "SESSION_1" ? "Session 1" : "Session 2";
                    } else if (workSessionHalf) {
                        hfSession = workSessionHalf.session === "SESSION_1" ? "Session 1" : "Session 2";
                    }
                }

                entriesMap[fullDateStr] = {
                    date: format(dateObj, "d MMMM"),
                    day: format(dateObj, "EEE"),
                    fullDate: fullDateStr,
                    status: status,
                    time: timeStr,
                    duration: durationStr,
                    fineValue: item.fine?.minutes > 0 ? `${Math.floor(item.fine.minutes / 60)}:${(item.fine.minutes % 60).toString().padStart(2, '0')}` : undefined,
                    overtimeValue: item.overtimes?.minutes > 0 ? `${Math.floor(item.overtimes.minutes / 60)}:${(item.overtimes.minutes % 60).toString().padStart(2, '0')}` : undefined,
                    leaveType: (item.leaveName && item.leaveName !== "..." && item.leaveName !== "-") ? item.leaveName : (status === "Leave" ? "Leave" : undefined),
                    hfLeaveType: hfLeaveType,
                    hfSession: hfSession,
                    shiftId: entryShiftId || entriesMap[fullDateStr]?.shiftId || shiftId,
                    isPending: false,
                    attendance: attendanceData?.punches || [],
                    attendanceId: item.attendanceId,
                    penalties: item.penalties || [],
                    earnings: item.earnings || []
                };
            });
        }

        const todayStr = format(now, "yyyy-MM-dd");
        const finalEntries = Object.values(entriesMap)
            .filter(entry => {
                // Hide any days from adjacent months and respect the 'today' limit for current month
                if (isCurrentMonth) {
                    return (entry.fullDate || "") <= todayStr;
                }
                return true;
            })
            .sort((a, b) => (b.fullDate || "").localeCompare(a.fullDate || ""));

        setAttendanceEntries(finalEntries);
        setDateRange({ from: startOfMonth(selectedDate), to: endOfMonth(selectedDate) });
    }, [selectedDate, id, monthlySummary, shiftId]);

    useEffect(() => {
        if (monthlySummary?.sections?.[0]?.employee?.[0]) {
            const emp = monthlySummary.sections[0].employee[0];
            setEmployeeName(emp.name?.replace(/\bundefined\b/g, "").trim() || "");
            setEmployeeId(emp.employeeCode || emp.id || "DE1303");
            setShiftId(emp.shift || "");
            setOrganizationId(emp.organizationId || "");
            return;
        }

        const storedUsers = sessionStorage.getItem("actualStaffEntries");
        if (storedUsers) {
            try {
                const parsed = JSON.parse(storedUsers);
                const found = parsed.find((u: any) => u.id.toString() === id);
                if (found) {
                    setEmployeeName(found.name?.replace(/\bundefined\b/g, "").trim() || "");
                    setEmployeeId(found.employeeCode || found.empId || "DE1303");
                }
            } catch (e) {
                console.error("Error parsing stored users", e);
            }
        }
    }, [id, monthlySummary]);

    useEffect(() => {
        if (selectedDateAttendance && selectedDateAttendance.attendances) {
            const att = selectedDateAttendance.attendances[0]; // Take first session
            if (att.inTime) setTempInTime(format(new Date(att.inTime), "hh:mm a"));
            else setTempInTime("");

            if (att.outTime) setTempOutTime(format(new Date(att.outTime), "hh:mm a"));
            else setTempOutTime("");

            // Handle other fields if necessary
        }
    }, [selectedDateAttendance]);

    // Helper to Sync changes of ONE employee back to the DATE-BASED sessionStorage
    const syncToLocalStorage = (updatedEntry: AttendanceEntry) => {
        if (!updatedEntry.fullDate) return;
        const dateKey = `attendance_${updatedEntry.fullDate}`;
        const actualStaffRaw = sessionStorage.getItem("actualStaffEntries");
        const savedAttendanceRaw = sessionStorage.getItem(dateKey);

        let dayEntries: any[] = [];

        if (savedAttendanceRaw) {
            try {
                dayEntries = JSON.parse(savedAttendanceRaw);
            } catch (e) {
                console.error("Error parsing existing entries", e);
            }
        } else if (actualStaffRaw) {
            try {
                const parsedStaff = JSON.parse(actualStaffRaw);
                dayEntries = parsedStaff.map((s: any) => ({
                    id: s.id?.toString() || s.name,
                    name: s.name,
                    employeeCode: s.employeeCode || s.empId || s.id || "N/A",
                    status: "Not Marked"
                }));
            } catch (e) {
                console.error("Error generating base entries", e);
            }
        }

        // Find and update our specific employee
        const existingIdx = dayEntries.findIndex((e: any) => e.id?.toString() === id);
        const { date, day, fullDate, ...statusOnlyData } = updatedEntry;

        const dataToSave = {
            id: id,
            name: employeeName,
            employeeCode: employeeId,
            ...statusOnlyData
        };

        if (existingIdx !== -1) {
            dayEntries[existingIdx] = dataToSave;
        } else {
            dayEntries.push(dataToSave);
        }

        sessionStorage.setItem(dateKey, JSON.stringify(dayEntries));
    };

    const handleStatusChange = (index: number, newStatus: AttendanceEntry["status"]) => {
        const currentEntry = attendanceEntries[index];
        const dateStr = currentEntry.fullDate;
        if (!dateStr || !id) return;

        if (newStatus === "Leave") {
            setSelectedEntryIndex(index);
            if (currentEntry.status === "Leave") {
                setIsRemoveLeavePopupOpen(true);
                return;
            }

            // Initialize popup state with current entry data
            const matchedCat = leaveBalances.find(c => c.categoryName === currentEntry.leaveType || c.categoryName === currentEntry.hfLeaveType);
            setSelectedLeaveType(matchedCat ? matchedCat.categoryId : (leaveBalances[0]?.categoryId || ""));
            setSelectedLeaveSession("Full Day");
            setIsLeavePopupOpen(true);
            return;
        }

        if (newStatus === "Present" || newStatus === "Half Day") {
            setSelectedEntryIndex(index);
            if (currentEntry.status === newStatus) {
                if (newStatus === "Half Day") {
                    setIsRemoveLeavePopupOpen(true);
                } else {
                    dispatch(markAttendance({
                        employeeId: id,
                        date: dateStr,
                        type: "ABSENT",
                        shiftId: currentEntry.shiftId || shiftId
                    })).then(() => {
                        dispatch(fetchLeaveBalance(id));
                    });
                }
                return;
            }
            setMarkingStatus(newStatus);
            dispatch(fetchAttendanceByDate({ employeeId: id, date: dateStr }));
            setIsPresentPopupOpen(true);
            return;
        }

        if (newStatus === "Absent" || newStatus === "Holiday" || newStatus === "Week Off") {
            const typeMap: Record<string, string> = { "Absent": "ABSENT", "Holiday": "HOLIDAY", "Week Off": "WEEK_OFF" };
            dispatch(markAttendance({
                employeeId: id,
                date: dateStr,
                type: typeMap[newStatus],
                shiftId: currentEntry.shiftId || shiftId
            })).then(() => {
                dispatch(fetchLeaveBalance(id));
                dispatch(fetchMonthlyAttendanceSummary({
                    employeeId: id,
                    month: selectedDate.getMonth() + 1,
                    year: selectedDate.getFullYear(),
                    organizationId: organizationId
                }));
            });
            return;
        }

        if (id && currentEntry.fullDate && currentEntry.status !== newStatus) {
            dispatch(markAttendance({
                employeeId: id,
                date: currentEntry.fullDate,
                type: statusToType[newStatus] || "ABSENT"
            }));
        }

        setAttendanceEntries(prev => {
            const next = [...prev];
            if (next[index].status === newStatus) return prev;
            next[index].status = newStatus;
            return next;
        });

        const attendanceDate = attendanceEntries[index].fullDate;
        if (attendanceDate) {
            setPendingDates(prev => prev.includes(attendanceDate) ? prev : [...prev, attendanceDate]);
        }
    };

    const handleFineOvertimeClick = (index: number, type: "Fine" | "Overtime") => {
        const entry = attendanceEntries[index];
        const status = entry.status;
        if (status === "Not Marked" || status === "Absent" || status === "Leave") {
            setErrorPopupType(type);
            setSelectedEntryIndex(index);
            setIsFineOvertimeErrorPopupOpen(true);
            return;
        }

        setSelectedEntryIndex(index);
        const formatMin = (m: number) => {
            const hrs = Math.floor(m / 60);
            const mins = m % 60;
            return `${hrs}:${mins.toString().padStart(2, "0")}`;
        };

        if (type === "Fine") {
            const sections = {
                lateEntry: { enabled: true, actual: "00:00", target: "00:00", multiplier: "1x Salary", amountPerHr: 0.10 },
                earlyOut: { enabled: true, actual: "00:00", target: "00:00", multiplier: "1x Salary", amountPerHr: 0.10 },
                excessBreaks: { enabled: true, actual: "00:00", target: "00:00", multiplier: "1x Salary", amountPerHr: 0.10 },
            };

            if (entry.penalties && entry.penalties.length > 0) {
                entry.penalties.forEach((p: any) => {
                    const s = p.snapshot;
                    if (!s) return;
                    if (s.type === "LATE") {
                        sections.lateEntry = { enabled: true, actual: formatMin(s.minutes), target: formatMin(s.minutes), multiplier: "Fixed Amount", amountPerHr: s.amount };
                    } else if (s.type === "EARLY_EXIT") {
                        sections.earlyOut = { enabled: true, actual: formatMin(s.minutes), target: formatMin(s.minutes), multiplier: "Fixed Amount", amountPerHr: s.amount };
                    } else if (s.type === "BREAK") {
                        sections.excessBreaks = { enabled: true, actual: formatMin(s.minutes), target: formatMin(s.minutes), multiplier: "Fixed Amount", amountPerHr: s.amount };
                    }
                });
            } else if (entry.fineValue) {
                sections.lateEntry = { enabled: true, actual: entry.fineValue, target: entry.fineValue, multiplier: "1x Salary", amountPerHr: 0.10 };
            }

            setFineSections(sections);
            setIsFineEntryPopupOpen(true);
        } else if (type === "Overtime") {
            const sections = {
                afterShift: { enabled: true, target: "00:00", multiplier: "1x Salary", amountPerHr: 0.10 },
                beforeShift: { enabled: true, target: "00:00", multiplier: "1x Salary", amountPerHr: 0.10 },
            };

            if (entry.earnings && entry.earnings.length > 0) {
                entry.earnings.forEach((e: any) => {
                    const s = e.snapshot;
                    if (!s) return;
                    if (s.type === "LATE_OVERTIME") {
                        sections.afterShift = { enabled: true, target: formatMin(s.minutes), multiplier: "Fixed Amount", amountPerHr: s.amount };
                    } else if (s.type === "EARLY_OVERTIME") {
                        sections.beforeShift = { enabled: true, target: formatMin(s.minutes), multiplier: "Fixed Amount", amountPerHr: s.amount };
                    }
                });
            } else if (entry.overtimeValue) {
                sections.afterShift = { enabled: true, target: entry.overtimeValue, multiplier: "1x Salary", amountPerHr: 0.10 };
            }

            setOvertimeSections(sections);
            setIsOvertimeEntryPopupOpen(true);
        }
    };

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

    const handleDeleteFine = () => {
        if (selectedEntryIndex !== null) {
            setAttendanceEntries(prev => {
                const next = [...prev];
                next[selectedEntryIndex] = {
                    ...next[selectedEntryIndex],
                    fineValue: undefined,
                    fineAmount: undefined
                };
                return next;
            });
            setFineSections({
                lateEntry: { enabled: true, actual: "00:00", target: "00:00", multiplier: "1x Salary", amountPerHr: 0.01 },
                earlyOut: { enabled: true, actual: "00:00", target: "00:00", multiplier: "1x Salary", amountPerHr: 0.01 },
                excessBreaks: { enabled: true, actual: "00:00", target: "00:00", multiplier: "1x Salary", amountPerHr: 0.01 },
            });
        }
        setIsFineEntryPopupOpen(false);
    };

    const handleDeleteOvertime = () => {
        if (selectedEntryIndex !== null) {
            setAttendanceEntries(prev => {
                const next = [...prev];
                next[selectedEntryIndex] = {
                    ...next[selectedEntryIndex],
                    overtimeValue: undefined,
                    overtimeAmount: undefined
                };
                return next;
            });
            setOvertimeSections({
                afterShift: { enabled: true, target: "00:00", multiplier: "1x Salary", amountPerHr: 0.01 },
                beforeShift: { enabled: true, target: "00:00", multiplier: "1x Salary", amountPerHr: 0.01 },
            });
        }
        setIsOvertimeEntryPopupOpen(false);
    };

    const handleDeleteFineSection = (key: string) => {
        setFineSections(prev => ({
            ...prev,
            [key]: { ...prev[key as keyof typeof fineSections], target: "00:00", enabled: false }
        }));
    };

    const handleDeleteOvertimeSection = (key: string) => {
        setOvertimeSections(prev => ({
            ...prev,
            [key]: { ...prev[key as keyof typeof overtimeSections], target: "00:00", enabled: false }
        }));
    };

    const totalFine = Object.values(fineSections).reduce((acc, section) => {
        return acc + (section.enabled ? calculateFine(section.target, section.multiplier, section.amountPerHr) : 0);
    }, 0);

    const handleApplyFine = async () => {
        if (selectedEntryIndex !== null) {
            const entry = attendanceEntries[selectedEntryIndex];
            const attendanceId = entry.attendanceId;
            if (!attendanceId) {
                toast.error("No attendance record found to apply fine.");
                return;
            }

            try {
                const typeMap: Record<string, string> = {
                    lateEntry: "LATE",
                    earlyOut: "EARLY_EXIT",
                    excessBreaks: "BREAK"
                };

                for (const key in fineSections) {
                    const section = fineSections[key as keyof typeof fineSections];
                    if (section.enabled) {
                        const [hours, minutes] = section.target.split(':').map(Number);
                        const totalMinutes = (hours || 0) * 60 + (minutes || 0);
                        const amount = calculateFine(section.target, section.multiplier, section.amountPerHr);

                        await dispatch(createFine({
                            attendanceId,
                            type: typeMap[key] || key.toUpperCase(),
                            minutes: totalMinutes,
                            amount
                        })).unwrap();
                    }
                }

                toast.success("Fine applied successfully!");
                dispatch(fetchMonthlyAttendanceSummary({
                    employeeId: id!,
                    month: selectedDate.getMonth() + 1,
                    year: selectedDate.getFullYear(),
                    organizationId: organizationId
                }));
            } catch (error: any) {
                toast.error(error?.message || "Failed to apply fine");
            }
        }
        setIsFineEntryPopupOpen(false);
    };

    const handleApplyOvertime = async () => {
        if (selectedEntryIndex !== null) {
            const entry = attendanceEntries[selectedEntryIndex];
            const attendanceId = entry.attendanceId;
            if (!attendanceId) {
                toast.error("No attendance record found to apply overtime.");
                return;
            }

            try {
                const typeMap: Record<string, string> = {
                    afterShift: "LATE_OVERTIME",
                    beforeShift: "EARLY_OVERTIME"
                };

                for (const key in overtimeSections) {
                    const section = overtimeSections[key as keyof typeof overtimeSections];
                    if (section.enabled) {
                        const [hours, minutes] = section.target.split(':').map(Number);
                        const totalMinutes = (hours || 0) * 60 + (minutes || 0);
                        const amount = calculateFine(section.target, section.multiplier, section.amountPerHr);

                        await dispatch(createOvertime({
                            attendanceId,
                            type: typeMap[key] || "OVERTIME",
                            overtimeMinutes: totalMinutes,
                            payableMinutes: totalMinutes,
                            amount
                        })).unwrap();
                    }
                }

                toast.success("Overtime applied successfully!");
                dispatch(fetchMonthlyAttendanceSummary({
                    employeeId: id!,
                    month: selectedDate.getMonth() + 1,
                    year: selectedDate.getFullYear(),
                    organizationId: organizationId
                }));
            } catch (error: any) {
                toast.error(error?.message || "Failed to apply overtime");
            }
        }
        setIsOvertimeEntryPopupOpen(false);
    };

    const handleSavePresent = () => {
        if (!tempInTime || !tempOutTime) {
            if (tempInTime && !tempOutTime) {
                setShowOutTimeError(true);
            }
            return;
        }
        if (selectedEntryIndex !== null) {
            const entry = attendanceEntries[selectedEntryIndex];
            const dateStr = entry.fullDate;
            if (dateStr && id) {
                const parseTimeToUTC = (timeStr: string) => {
                    if (!timeStr) return null;
                    const dateObj = new Date(dateStr);
                    const [time, modifier] = timeStr.split(' ');
                    let [hours, minutes] = time.split(':').map(Number);
                    if (modifier === 'PM' && hours < 12) hours += 12;
                    if (modifier === 'AM' && hours === 12) hours = 0;
                    dateObj.setHours(hours, minutes, 0, 0);
                    return dateObj.toISOString();
                };

                dispatch(markAttendance({
                    employeeId: id,
                    date: dateStr,
                    type: markingStatus === "Present" ? "PRESENT" : "HALF_DAY",
                    shiftId: entry.shiftId || shiftId,
                    inTime: parseTimeToUTC(tempInTime),
                    outTime: parseTimeToUTC(tempOutTime),
                    sessions: markingStatus === "Half Day" ? [
                        { session: "SESSION_1", type: "HALF_DAY", inTime: parseTimeToUTC(tempInTime), outTime: parseTimeToUTC(tempOutTime) },
                        { session: "SESSION_2", type: "ABSENT", isPaid: false }
                    ] : undefined
                })).then(() => {
                    dispatch(fetchMonthlyAttendanceSummary({
                        employeeId: id,
                        month: selectedDate.getMonth() + 1,
                        year: selectedDate.getFullYear(),
                        organizationId: organizationId
                    }));
                });

                if (markingStatus === "Half Day") {
                    // Initialize Half Day Option popup with current entry data if it exists
                    if (entry.status === "Leave" && entry.isHalfDayLeave) {
                        setSelectedHfLeaveType(entry.leaveType || "Other");
                        setSelectedHfSession(entry.hfSession || "Session 1");
                    } else if (entry.status === "Half Day") {
                        setSelectedHfLeaveType(entry.hfLeaveType || "Other");
                        setSelectedHfSession(entry.hfSession || "Session 1");
                    } else {
                        setSelectedHfLeaveType("Other");
                        setSelectedHfSession("Session 1");
                    }
                    setIsHalfDayOptionPopupOpen(true);
                }

                // Add to pending
                if (dateStr) {
                    setPendingDates(prev => prev.includes(dateStr!) ? prev : [...prev, dateStr!]);
                }
            }
        }
        setIsPresentPopupOpen(false);
        setShowOutTimeError(false);
        setIsAllApproved(false);
    };

    const handleSaveNote = () => {
        if (selectedEntryIndex !== null) {
            setAttendanceEntries(prev => {
                const next = [...prev];
                const updated = {
                    ...next[selectedEntryIndex],
                    note: currentNote
                };
                next[selectedEntryIndex] = updated;
                syncToLocalStorage(updated as any);
                if (updated.fullDate) {
                    setPendingDates(prev => prev.includes(updated.fullDate!) ? prev : [...prev, updated.fullDate!]);
                }
                return next;
            });
        }
        setIsNotePopupOpen(false);
        setCurrentNote("");
    };

    const handleSaveLeave = () => {
        if (selectedEntryIndex !== null && selectedLeaveType && id) {
            const entry = attendanceEntries[selectedEntryIndex];
            const dateStr = entry.fullDate;
            if (dateStr) {
                const isHoliday = selectedLeaveType === "HOLIDAY";
                const selectedCat = leaveBalances.find(c => c.categoryId === selectedLeaveType);
                const isWeeklyOff = selectedCat?.categoryName === "Weekly Off";

                dispatch(markAttendance({
                    employeeId: id,
                    date: dateStr,
                    type: isHoliday ? "HOLIDAY" : (isWeeklyOff ? "WEEK_OFF" : "LEAVE"),
                    shiftId: entry.shiftId || shiftId,
                    leaveCategoryId: (isHoliday || isWeeklyOff) ? undefined : selectedLeaveType
                })).then(() => {
                    dispatch(fetchLeaveBalance(id));
                });

                if (dateStr) {
                    setPendingDates(prev => prev.includes(dateStr!) ? prev : [...prev, dateStr!]);
                }
            }
        }
        setIsLeavePopupOpen(false);
        setIsAllApproved(false);
    };

    const handleSaveHalfDayOption = () => {
        if (selectedEntryIndex !== null && id) {
            const entry = attendanceEntries[selectedEntryIndex];
            const dateStr = entry.fullDate;
            if (dateStr) {
                const parseTimeToUTC = (timeStr: string) => {
                    if (!timeStr) return null;
                    const dateObj = new Date(dateStr);
                    const [time, modifier] = timeStr.split(' ');
                    let [hours, minutes] = time.split(':').map(Number);
                    if (modifier === 'PM' && hours < 12) hours += 12;
                    if (modifier === 'AM' && hours === 12) hours = 0;
                    dateObj.setHours(hours, minutes, 0, 0);
                    return dateObj.toISOString();
                };

                const hfSessionBackend = selectedHfSession === "Session 1" ? "SESSION_1" : "SESSION_2";
                const workSessionBackend = hfSessionBackend === "SESSION_1" ? "SESSION_2" : "SESSION_1";
                const workSessionFrontend = selectedHfSession === "Session 1" ? "Session 2" : "Session 1";

                const sessions = [
                    {
                        session: workSessionBackend,
                        type: "HALF_DAY",
                        inTime: parseTimeToUTC(tempInTime),
                        outTime: parseTimeToUTC(tempOutTime)
                    },
                    {
                        session: hfSessionBackend,
                        type: selectedHfLeaveType === "Unpaid" ? "UNPAID" : (selectedHfLeaveType === "Week Off" ? "WEEK_OFF" : "LEAVE"),
                        leaveCategoryId: !["Unpaid", "Week Off", "Other"].includes(selectedHfLeaveType) ? selectedHfLeaveType : undefined,
                        isPaid: selectedHfLeaveType !== "Unpaid"
                    }
                ];

                dispatch(markAttendance({
                    employeeId: id,
                    date: dateStr,
                    type: "HALF_DAY",
                    shiftId: entry.shiftId || shiftId,
                    sessions: sessions
                })).then(() => {
                    dispatch(fetchLeaveBalance(id));
                    dispatch(fetchMonthlyAttendanceSummary({
                        employeeId: id,
                        month: selectedDate.getMonth() + 1,
                        year: selectedDate.getFullYear(),
                        organizationId: organizationId
                    }));
                });

                if (dateStr) {
                    setPendingDates(prev => prev.includes(dateStr!) ? prev : [...prev, dateStr!]);
                }
            }
        }
        setIsHalfDayOptionPopupOpen(false);
        setIsAllApproved(false);
    };

    const prevMonth = () => setSelectedDate(prev => subMonths(prev, 1));
    const nextMonth = () => {
        const today = new Date();
        const next = addMonths(selectedDate, 1);
        if (next <= today || (next.getMonth() === today.getMonth() && next.getFullYear() === today.getFullYear())) {
            setSelectedDate(next);
        }
    };

    // Dynamic stats calculation
    const stats = {
        days: attendanceEntries.length,
        present: monthlySummary?.summary?.present ?? attendanceEntries.filter(e => e.status === "Present").length,
        absent: monthlySummary?.summary?.absent ?? attendanceEntries.filter(e => e.status === "Absent").length,
        halfDay: monthlySummary?.summary?.halfDay ?? attendanceEntries.filter(e => e.status === "Half Day" || (e.status === "Leave" && e.isHalfDayLeave)).length,
        notMarked: monthlySummary?.summary?.notMarked ?? attendanceEntries.filter(e => e.status === "Not Marked").length,
        leave: monthlySummary?.summary?.leaveCount ?? attendanceEntries.filter(e => e.status === "Leave" || (e.status === "Half Day" && e.hfLeaveType && !["Unpaid", "Other"].includes(e.hfLeaveType))).length,
        punchedIn: monthlySummary?.summary?.punchSummary?.punchIn ?? attendanceEntries.filter(e => e.status === "Present" || e.status === "Half Day" || (e.status === "Leave" && e.isHalfDayLeave)).length,
        punchedOut: monthlySummary?.summary?.punchSummary?.punchOut ?? attendanceEntries.filter(e => (e.status === "Present" || e.status === "Half Day" || (e.status === "Leave" && e.isHalfDayLeave)) && e.time?.includes("-")).length,
    };

    const handleDownloadReport = () => {
        const worksheet = XLSX.utils.json_to_sheet(attendanceEntries);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

        // Finalize export
        const fileName = `Attendance_Report_${employeeName}_${format(dateRange?.from || new Date(), 'dd_MMM_yy')}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        setIsDownloadPopupOpen(false);
    };

    const formattedMonth = format(selectedDate, "LLL yyyy");

    return (
        <div className="bg-[#F8FAFC] min-h-screen px-[40px] pt-[24px] pb-[100px] font-sans flex flex-col w-full">
            {/* Top Navigation Row */}
            <div className="flex items-center justify-between mb-[12px]">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-[6px] text-[#3F5A54] hover:text-black transition-colors w-fit"
                >
                    <MoveLeft className="w-[18px]" />
                    <span className="text-[14px] font-medium font-sans">Back</span>
                </button>
            </div>

            {/* Employee Header Row */}
            <div className="flex items-center justify-between mb-[20px]">
                <div className="flex items-baseline gap-[12px]">
                    <h1 className="text-[#1F2937] text-[20px] font-semibold">{employeeName}</h1>
                    <span className="text-[#6B7280] text-[14px] font-medium">{employeeId}</span>
                </div>

                <Button
                    onClick={() => handleDownloadReport()}
                    variant="outline"
                    className="h-[37px] border-[#3F5A54] bg-[#F0FDF4] text-[#3F5A54] hover:bg-[#F0FDF4] hover:text-[#3F5A54] font-medium rounded-[10px] px-4 text-[14px]"
                >
                    Download Report
                </Button>
            </div>

            {/* Attendance Summary Card */}
            <Card className="bg-white border-[#E5E7EB] rounded-2xl shadow-sm px-[32px] py-[16px] mb-[24px]">
                <div className="flex items-center justify-between mb-[16px]">
                    {/* Date Navigation */}
                    <div className="flex items-center justify-center h-[32px] min-w-[160px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[8px] px-[10px]">
                        <Popover>
                            <PopoverTrigger asChild>
                                <CalendarDays className="h-[14px] w-[14px] text-[#4B5563] cursor-pointer hover:text-black transition-colors" />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <CalendarUI
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => date && setSelectedDate(date)}
                                    disabled={{ after: new Date() }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <div className="flex items-center gap-[8px] flex-1 justify-center ml-2">
                            <ChevronLeft onClick={prevMonth} className="h-[12px] w-[12px] text-[#4B5563] cursor-pointer hover:text-black transition-colors" />
                            <span className="text-[12px] font-medium text-[#1F2937] px-2 text-center min-w-[70px]">{formattedMonth}</span>
                            {addMonths(selectedDate, 1) <= new Date() ? (
                                <ChevronRight
                                    onClick={nextMonth}
                                    className="h-[12px] w-[12px] text-[#4B5563] cursor-pointer hover:text-black transition-colors"
                                />
                            ) : (
                                <div className="w-[12px]" />
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-[24px]">
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="flex items-center justify-between w-full">
                    <TooltipProvider>
                        <div className="flex gap-[78px]">
                            {[
                                {
                                    label: "Days",
                                    value: stats.days.toString(),
                                    tooltip: "The total number of days marked as present within the calendar month"
                                },
                                {
                                    label: "Present",
                                    value: stats.present.toString(),
                                    tooltip: "Number of days marked present as per attendance rules"
                                },
                                {
                                    label: "Absent",
                                    value: stats.absent.toString(),
                                    tooltip: "Number of days marked absent as per attendance rules"
                                },
                                {
                                    label: "Half Day",
                                    value: stats.halfDay.toString(),
                                    tooltip: "Number of days marked for half-day attendance"
                                },
                                {
                                    label: "Leave",
                                    value: stats.leave.toString(),
                                    tooltip: "Number of days with approved leave"
                                },
                                {
                                    label: "Punched In",
                                    value: stats.punchedIn.toString(),
                                    tooltip: "Number of days where punch-in are approved and successfully recorded\nPending for approval: 0"
                                },
                                {
                                    label: "Punched Out",
                                    value: stats.punchedOut.toString(),
                                    tooltip: "Number of days where punch-out are approved and successfully recorded\nPending for approval: 0"
                                },
                            ].map((stat, idx) => (
                                <div key={idx} className="flex flex-col gap-[6px]">
                                    <div className="flex items-center gap-[4px]">
                                        <p className="text-[10px] text-[#4B5563] font-normal">{stat.label}</p>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <span className="text-[10px] text-[#9CA3AF] cursor-default hover:text-[#3F5A54] transition-colors">ⓘ</span>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                side="top"
                                                className="bg-[#1F2937] text-white text-[10px] px-3 py-2 border-none rounded-[6px] max-w-[250px]"
                                            >
                                                {stat.tooltip.split('\n').map((line, i) => (
                                                    <div key={i}>{line}</div>
                                                ))}
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <p className="text-[14px] font-bold text-[#1F2937]">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </TooltipProvider>

                    {pendingDates.length === 0 ? (
                        <div className="flex items-center gap-[8px] bg-[#EBF5F3] text-[#05b14f] px-[12px] py-[6px] rounded-full text-[12px] font-bold">
                            <div className="w-[6px] h-[6px] bg-[#05b14f] rounded-full" />
                            All Approved
                        </div>
                    ) : (
                        <div className="flex items-center gap-[16px]">
                            <div className="flex items-center gap-[6px]">
                                <div className="w-[8px] h-[8px] bg-[#FABE24] rounded-full" />
                                <span className="text-[12px] font-medium text-[#1F2937]">Total Pending for Approval : {pendingDates.length}</span>
                            </div>
                            <Button
                                onClick={() => {
                                    setPendingDates([]);
                                }}
                                className="h-[32px] px-[16px] bg-[#3F5A54] text-white hover:bg-[#344b46] rounded-[6px] font-medium text-[13px] border-none shadow-none"
                            >
                                Confirm Approval
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Daily Attendance List */}
            <div className="flex flex-col gap-[16px]">
                {attendanceEntries.map((entry, idx) => (
                    <Card key={idx} className="bg-white border-[#E5E7EB] rounded-2xl shadow-sm px-[32px] py-[24px] flex flex-row items-center justify-between transition-all hover:shadow-md w-full">
                        {/* Left Side: Date, Status, Navigation */}
                        <div className="flex flex-col gap-[12px] min-w-[200px]">
                            <div className="flex flex-col">
                                <h3 className="text-[14px] font-bold text-[#1F2937] leading-tight flex items-center gap-1">
                                    {entry.date} <span className="text-[#9CA3AF] font-normal">| {entry.day}</span>
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
                                            1 Shift (s) <span className="w-[12px] h-[12px] border border-[#9CA3AF] rounded-full flex items-center justify-center text-[8px] text-[#9CA3AF] italic">i</span>
                                        </p>
                                    </>
                                )}
                                {entry.status === "Absent" && (
                                    <p className="text-[12px] text-red-500 font-semibold mt-[4px]">Absent</p>
                                )}
                                {entry.status === "Not Marked" && (
                                    <p className="text-[12px] text-red-500 font-semibold mt-[4px]">Not Marked</p>
                                )}
                                {(entry.status === "Leave" || entry.status === "Holiday") && (
                                    <p className={cn(
                                        "text-[12px] font-semibold mt-[4px]",
                                        entry.status === "Holiday" ? "text-orange-500" : "text-[#6B7280]"
                                    )}>
                                        {entry.status === "Holiday" ? "Holiday" : (entry.leaveType || "Leave")}
                                    </p>
                                )}
                            </div>

                            <div className="mt-auto flex items-center gap-[6px] text-[10px] text-[#3F5A54] font-normal">
                                <button
                                    onClick={() => {
                                        setSelectedEntryIndex(idx);
                                        setCurrentNote(entry.note || "");
                                        setIsNotePopupOpen(true);
                                    }}
                                    className="hover:underline transition-all"
                                >
                                    Add Note
                                </button>
                                <span className="text-[#3F5A54] opacity-30">-</span>
                                <button
                                    onClick={() => {
                                        setSelectedEntryIdx(idx);
                                        setIsLogsPopupOpen(true);
                                        if (id && entry.fullDate) {
                                            dispatch(fetchAttendanceByDate({ employeeId: id, date: entry.fullDate }));
                                        }
                                    }}
                                    className="hover:underline transition-all"
                                >
                                    Logs
                                </button>
                            </div>
                        </div>

                        {/* Right Side: Status Grid Buttons */}
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
                                label={(entry.status === "Leave" || entry.status === "Holiday" || (entry.status === "Half Day" && entry.hfLeaveType))
                                    ? (entry.status === "Leave"
                                        ? (entry.leaveType && entry.leaveType !== "..." && entry.leaveType !== "-" ? entry.leaveType : "Leave")
                                        : (entry.status === "Holiday" ? "Holiday" : (entry.hfLeaveType && entry.hfLeaveType !== "..." && entry.hfLeaveType !== "-" ? entry.hfLeaveType : "Leave")))
                                    : "Leave"}
                                short={(entry.status === "Leave" && entry.leaveType === "Weekly Off") ? "WO" : (entry.status === "Holiday" ? "H" : "L")}
                                active={!!(entry.status === "Leave" || entry.status === "Holiday" || (entry.status === "Half Day" && entry.hfLeaveType && !["Unpaid", "Other"].includes(entry.hfLeaveType)))}
                                type="Leave"
                                onClick={() => handleStatusChange(idx, "Leave")}
                            />
                        </div>
                    </Card>
                ))}
            </div>

            {/* Remove Leave Confirmation Popup */}
            <Dialog open={isRemoveLeavePopupOpen} onOpenChange={setIsRemoveLeavePopupOpen}>
                <DialogContent showCloseButton={false} className="w-fit p-0 border-none bg-transparent shadow-none focus:outline-none flex items-center justify-center">
                    <div className="bg-white rounded-[12px] w-[360px] p-[28px] flex flex-col relative shadow-2xl border border-gray-100 items-center text-center">
                        <div className="w-[48px] h-[48px] bg-red-50 rounded-full flex items-center justify-center mb-[16px]">
                            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-[18px] font-bold text-[#1F2937] mb-[8px]">Remove Leave?</DialogTitle>
                        </DialogHeader>
                        <p className="text-[14px] text-[#6B7280] mb-[24px]">Are you sure you want to remove this leave record? This action cannot be undone.</p>

                        <div className="flex gap-[12px] w-full">
                            <Button
                                variant="outline"
                                onClick={() => setIsRemoveLeavePopupOpen(false)}
                                className="flex-1 h-[42px] border border-[#3F5A54] text-[#3F5A54] rounded-[10px] font-medium"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    if (selectedEntryIndex !== null && id) {
                                        const entry = attendanceEntries[selectedEntryIndex];
                                        dispatch(removeLeave({ employeeId: id, date: entry.fullDate })).then(() => {
                                            dispatch(fetchLeaveBalance(id));
                                            dispatch(fetchMonthlyAttendanceSummary({
                                                employeeId: id,
                                                month: selectedDate.getMonth() + 1,
                                                year: selectedDate.getFullYear(),
                                                organizationId: organizationId
                                            }));
                                            setIsRemoveLeavePopupOpen(false);
                                        });
                                    }
                                }}
                                className="flex-1 h-[42px] bg-red-500 text-white hover:bg-red-600 rounded-[10px] font-medium border-none"
                            >
                                Remove
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Note Popup */}
            <Dialog open={isNotePopupOpen} onOpenChange={setIsNotePopupOpen}>
                <DialogContent showCloseButton={false} className="w-fit p-0 border-none bg-transparent shadow-none focus:outline-none flex items-center justify-center">
                    <div className="bg-white rounded-[8px] w-[340px] h-[380px] p-[28px] flex flex-col relative shadow-xl border border-gray-100">
                        {/* Header */}
                        <div className="flex flex-col gap-[4px] mb-[24px]">
                            <DialogHeader>
                                <DialogTitle className="text-[22px] font-semibold text-[#1F2937]">Add Note</DialogTitle>
                            </DialogHeader>
                            <p className="text-[15px] text-[#9CA3AF] font-normal">{employeeName}</p>
                        </div>

                        {/* Custom Close Button */}
                        <DialogClose className="absolute top-[28px] right-[28px] bg-[#F3F4F6] hover:bg-[#E5E7EB] rounded-[8px] p-[6px] transition-colors border-none outline-none">
                            <X className="w-[18px] h-[18px] text-[#1F2937]" />
                        </DialogClose>

                        {/* Textarea */}
                        <Textarea
                            value={currentNote}
                            onChange={(e) => setCurrentNote(e.target.value)}
                            placeholder="Write here"
                            className="flex-1 resize-none border-gray-200 focus:border-[#3F5A54] focus-visible:ring-0 rounded-[12px] p-[16px] text-[15px] text-[#4B5563] placeholder:text-[#9CA3AF] mb-[28px]"
                        />

                        {/* Footer Buttons */}
                        <div className="flex gap-[12px]">
                            <Button
                                variant="outline"
                                onClick={() => setIsNotePopupOpen(false)}
                                className="flex-1 h-[42px] border border-[#3F5A54] text-[#3F5A54] rounded-[12px] font-medium text-[16px] hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveNote}
                                className="flex-1 h-[42px] bg-[#3F5A54] text-white hover:bg-[#344b46] rounded-[12px] font-medium text-[16px] transition-colors"
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>


            {/* Mark Present Popup */}
            <Dialog open={isPresentPopupOpen} onOpenChange={setIsPresentPopupOpen}>
                <DialogContent showCloseButton={false} className="w-fit p-0 border-none bg-transparent shadow-none focus:outline-none flex items-center justify-center">
                    <div className="bg-white rounded-[16px] w-[500px] p-[32px] flex flex-col relative shadow-2xl border border-gray-100">
                        {/* Header */}
                        <div className="flex flex-col gap-[4px] mb-[28px]">
                            <DialogHeader>
                                <DialogTitle className="text-[22px] font-bold text-[#1F2937]">{markingStatus} | <span className="text-[#9CA3AF] font-normal text-[18px]">{selectedEntryIndex !== null && attendanceEntries[selectedEntryIndex].date} {selectedDate.getFullYear()}</span></DialogTitle>
                            </DialogHeader>
                        </div>

                        {/* Custom Close Button */}
                        <DialogClose className="absolute top-[28px] right-[28px] bg-[#F3F4F6] hover:bg-[#E5E7EB] rounded-[8px] p-[6px] transition-colors border-none outline-none">
                            <X className="w-[18px] h-[18px] text-[#1F2937]" />
                        </DialogClose>

                        {/* Time Slots Area */}
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

                        {showOutTimeError && (
                            <div className="flex items-center gap-[6px] text-[#F97316] text-[12px] mb-[28px]">
                                <span className="w-[14px] h-[14px] border border-current rounded-full flex items-center justify-center text-[10px] italic font-serif">i</span>
                                Out time is mandatory to mark present
                            </div>
                        )}

                        {/* Footer Buttons */}
                        <div className={cn("flex gap-[16px]", !showOutTimeError && "mt-[28px]")}>
                            <Button
                                variant="outline"
                                onClick={() => setIsPresentPopupOpen(false)}
                                className="flex-1 h-[48px] border border-[#3F5A54] text-[#3F5A54] rounded-[10px] font-medium text-[16px] hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSavePresent}
                                className="flex-1 h-[48px] bg-[#3F5A54] text-white hover:bg-[#344b46] rounded-[10px] font-medium text-[16px] transition-colors"
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Logs Popup */}
            <Dialog open={isLogsPopupOpen} onOpenChange={setIsLogsPopupOpen}>
                <DialogContent showCloseButton={false} className="w-fit p-0 border-none bg-transparent shadow-none">
                    <DialogTitle className="sr-only">Activity Logs</DialogTitle>
                    {selectedEntryIdx !== null && (() => {
                        const entry = attendanceEntries[selectedEntryIdx];
                        const logs = entry.attendance || [];
                        return (
                            <div className="bg-white rounded-[16px] w-[400px] p-[32px] flex flex-col relative shadow-2xl border border-gray-100">
                                <DialogHeader className="mb-[24px]">
                                    <div className="flex flex-col gap-[8px]">
                                        <DialogTitle className="text-[22px] font-bold text-[#1F2937] leading-tight">
                                            {employeeName.replace(" undefined", "")}
                                        </DialogTitle>
                                        <div className="flex items-center gap-[8px] text-[13px] text-[#9CA3AF]">
                                            <span>{entry.date} | {entry.day}</span>
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
                                <DialogClose className="absolute top-[32px] right-[32px] bg-[#F3F4F6] p-[6px] rounded-[8px]"><X className="w-[18px] h-[18px] text-[#4B5563]" /></DialogClose>

                                <div className="flex-1 max-h-[300px] overflow-y-auto pr-1">
                                    {logs.length === 0 ? (
                                        <div className="py-10 flex flex-col items-center justify-center text-gray-400 gap-3">
                                            <CircleAlert className="w-10 h-10 opacity-20" />
                                            <span className="text-[14px] italic">No logs recorded for this day.</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 pt-2 ml-1">
                                            {logs.map((punch: any, pIdx: number) => {
                                                const punchTime = new Date(punch.time);
                                                const isOut = punch.type === "OUT";
                                                return (
                                                    <div key={pIdx} className="flex items-start gap-4">
                                                        <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 shrink-0", "bg-[#3F5A54]")} />
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
            <Dialog open={isDownloadPopupOpen} onOpenChange={setIsDownloadPopupOpen}>
                <DialogContent showCloseButton={false} className="w-fit p-0 border-none bg-transparent shadow-none focus:outline-none flex items-center justify-center">
                    <div className="bg-white rounded-[12px] w-[420px] h-[260px] p-[32px] flex flex-col relative shadow-2xl border border-gray-100">
                        {/* Header */}
                        <div className="flex flex-col gap-[6px] mb-[24px]">
                            <DialogHeader>
                                <DialogTitle className="text-[22px] font-bold text-[#1F2937]">Attendance Report</DialogTitle>
                            </DialogHeader>
                            <p className="text-[14px] text-[#6B7280] font-normal">Download report for the selected month</p>
                        </div>

                        {/* Custom Close Button */}
                        <DialogClose className="absolute top-[32px] right-[32px] bg-transparent hover:bg-[#F3F4F6] rounded-[6px] p-[4px] transition-colors border-none outline-none">
                            <X className="w-[20px] h-[20px] text-[#1F2937]" />
                        </DialogClose>

                        {/* Selected Date Range Display (Read Only) */}
                        <div className="flex-1 mb-[28px]">
                            <div className="flex items-center justify-between px-[16px] h-[48px] border border-gray-100 bg-gray-50 rounded-[10px] text-[#4B5563]">
                                <span className="text-[14px] font-medium">
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "dd MMM ''yy")} - {format(dateRange.to, "dd MMM ''yy")}
                                            </>
                                        ) : (
                                            format(dateRange.from, "dd MMM ''yy")
                                        )
                                    ) : (
                                        "No range selected"
                                    )}
                                </span>
                                <CalendarIcon className="w-[18px] h-[18px] text-[#9CA3AF]" />
                            </div>
                        </div>

                        {/* Action Component */}
                        <div className="flex">
                            <Button
                                onClick={handleDownloadReport}
                                className="w-full h-[42px] bg-[#0066FF] text-white hover:bg-[#0052CC] rounded-[10px] font-bold text-[16px] transition-colors shadow-lg shadow-blue-200"
                            >
                                Download Report
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Fine Entry Detailed Popup */}
            <Dialog open={isFineEntryPopupOpen} onOpenChange={setIsFineEntryPopupOpen}>
                <DialogContent showCloseButton={false} className="w-fit p-0 border-none bg-transparent shadow-none focus:outline-none flex items-center justify-center">
                    <div className="bg-white rounded-[16px] w-[560px] p-[20px] flex flex-col relative shadow-2xl border border-gray-100">
                        {/* Header */}
                        <div className="flex flex-col gap-[2px] mb-[16px]">
                            <DialogHeader>
                                <DialogTitle className="text-[18px] font-bold text-[#1F2937]">Fine</DialogTitle>
                            </DialogHeader>
                            <p className="text-[14px] text-[#9CA3AF] font-normal">{employeeName.split(' ')[0]}</p>
                        </div>

                        <button
                            onClick={handleDeleteFine}
                            className="absolute top-[28px] right-[60px] text-red-400 hover:text-red-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                        <DialogClose className="absolute top-[28px] right-[28px] text-gray-300 hover:text-gray-500 transition-colors">
                            <X className="w-5 h-5" />
                        </DialogClose>

                        {/* Sections Wrapper */}
                        <div className="flex flex-col gap-[10px] mb-[20px]">
                            {[
                                { key: 'lateEntry', label: 'Late Entry' },
                                { key: 'earlyOut', label: 'Early Out' },
                                { key: 'excessBreaks', label: 'Excess Breaks' }
                            ].map((section) => {
                                const data = fineSections[section.key as keyof typeof fineSections];
                                return (
                                    <div key={section.key} className="bg-[#EFF0FE] rounded-[10px] p-[12px] relative">
                                        <div className="flex items-center justify-between mb-[10px]">
                                            <h4 className="text-[13px] font-bold text-[#1F2937]">{section.label}</h4>
                                            <button
                                                onClick={() => handleDeleteFineSection(section.key)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="flex gap-[10px] items-end">
                                            <div className="flex flex-col gap-[4px]">
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
                                                                    // Sync target with actual if target is zero or matches previous actual
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

                                            <div className="flex flex-col gap-[4px]">
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

                                            <div className="flex flex-col gap-[4px] flex-1">
                                                <label className="text-[11px] text-gray-400 font-medium">{data.multiplier === "Fixed Amount" ? "Total Amount" : "Fine Amount"}</label>
                                                <div className="flex gap-1.5">
                                                    <select
                                                        className="h-[36px] flex-1 bg-white rounded-[6px] border border-gray-100 text-[13px] px-2.5 outline-none appearance-none cursor-pointer"
                                                        value={data.multiplier}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val === "ADD_NEW") {
                                                                setIsCustomMultiplierPopupOpen(true);
                                                            } else {
                                                                setFineSections(prev => ({
                                                                    ...prev,
                                                                    [section.key]: { ...prev[section.key as keyof typeof fineSections], multiplier: val }
                                                                }));
                                                            }
                                                        }}
                                                    >
                                                        {multipliers.map(m => <option key={m} value={m}>{m}</option>)}
                                                        <option value="ADD_NEW" className="text-blue-500 font-bold">Add Salary Multiplier</option>
                                                    </select>
                                                    <div className="h-[36px] w-[140px] bg-white rounded-[6px] border border-gray-100 flex items-center px-2.5 gap-1.5">
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
                                        <div className="mt-[6px]">
                                            <p className="text-[11px] text-gray-400 font-medium">Amount: ₹ {calculateFine(data.target, data.multiplier, data.amountPerHr).toFixed(2)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Total & Summary Area */}
                        <div className="flex flex-col gap-[16px]">
                            <h3 className="text-[16px] font-bold text-[#1F2937]">Total Amount: ₹ {totalFine.toFixed(2)}</h3>

                            <div className="flex items-center gap-[10px]">
                                <input
                                    type="checkbox"
                                    id="fineSms"
                                    className="w-4 h-4 rounded border-gray-300 text-[#3F5A54] focus:ring-[#3F5A54]"
                                    checked={fineSendSms}
                                    onChange={(e) => setFineSendSms(e.target.checked)}
                                />
                                <label htmlFor="fineSms" className="text-[14px] text-gray-600 font-medium">Send SMS to Staff</label>
                            </div>

                            <Button
                                onClick={handleApplyFine}
                                className="w-full h-[48px] bg-[#3F5A54] text-white hover:bg-[#344b46] rounded-[8px] font-semibold text-[16px]"
                            >
                                Apply Fine
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Overtime Entry Detailed Popup */}
            <Dialog open={isOvertimeEntryPopupOpen} onOpenChange={setIsOvertimeEntryPopupOpen}>
                <DialogContent showCloseButton={false} className="w-fit p-0 border-none bg-transparent shadow-none focus:outline-none flex items-center justify-center">
                    <div className="bg-white rounded-[16px] w-[535px] p-[20px] flex flex-col relative shadow-2xl border border-gray-100">
                        {/* Header */}
                        <div className="flex flex-col gap-[2px] mb-[16px]">
                            <DialogHeader>
                                <DialogTitle className="text-[18px] font-bold text-[#1F2937]">Overtime</DialogTitle>
                            </DialogHeader>
                            <p className="text-[14px] text-[#9CA3AF] font-normal">
                                {employeeName.split(' ')[0]} | {selectedEntryIndex !== null && attendanceEntries[selectedEntryIndex].date.split(' ')[0]} {format(selectedDate, "LLL")}
                            </p>
                        </div>

                        <button
                            onClick={handleDeleteOvertime}
                            className="absolute top-[28px] right-[60px] text-red-400 hover:text-red-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                        <DialogClose className="absolute top-[28px] right-[28px] text-gray-300 hover:text-gray-500 transition-colors">
                            <X className="w-5 h-5" />
                        </DialogClose>

                        {/* Sections Wrapper */}
                        <div className="flex flex-col gap-[12px] mb-[24px]">
                            {[
                                { key: 'afterShift', label: 'Overtime | after the shift ends' },
                                { key: 'beforeShift', label: 'Early Overtime | before the shift begins' }
                            ].map((section) => {
                                const data = overtimeSections[section.key as keyof typeof overtimeSections];
                                return (
                                    <div key={section.key} className="bg-[#EFF0FE] rounded-[10px] p-[16px] relative">
                                        <div className="flex items-center justify-between mb-[12px]">
                                            <h4 className="text-[13px] font-bold text-[#1F2937]">{section.label}</h4>
                                            <button
                                                onClick={() => handleDeleteOvertimeSection(section.key)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="flex gap-[10px] items-end">
                                            <div className="flex flex-col gap-[4px]">
                                                <label className="text-[11px] text-gray-400 font-medium">Hours</label>
                                                <div className="h-[36px] w-[130px] bg-white rounded-[6px] border border-gray-100 flex items-center px-2.5 gap-1.5">
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

                                            <div className="flex flex-col gap-[4px] flex-1">
                                                <label className="text-[11px] text-gray-400 font-medium">Overtime Amount</label>
                                                <div className="flex gap-1.5">
                                                    <select
                                                        className="h-[36px] flex-1 bg-white rounded-[6px] border border-gray-100 text-[13px] px-2.5 outline-none appearance-none cursor-pointer"
                                                        value={data.multiplier}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val === "ADD_NEW") {
                                                                setIsCustomMultiplierPopupOpen(true);
                                                            } else {
                                                                setOvertimeSections(prev => ({
                                                                    ...prev,
                                                                    [section.key]: { ...prev[section.key as keyof typeof overtimeSections], multiplier: val }
                                                                }));
                                                            }
                                                        }}
                                                    >
                                                        {multipliers.map(m => <option key={m} value={m}>{m}</option>)}
                                                        <option value="ADD_NEW" className="text-blue-500 font-bold">Add Salary Multiplier</option>
                                                    </select>
                                                    <div className="h-[36px] w-[160px] bg-white rounded-[6px] border border-gray-100 flex items-center px-2.5 gap-1.5 focus-within:border-[#3F5A54] transition-colors">
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
                                        <div className="mt-[6px]">
                                            <p className="text-[11px] text-gray-400 font-medium">Amount: ₹ {calculateFine(data.target, data.multiplier, data.amountPerHr).toFixed(2)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Total & Summary Area */}
                        <div className="flex flex-col gap-[16px]">
                            <h3 className="text-[16px] font-bold text-[#1F2937]">Total Amount: ₹ {
                                Object.values(overtimeSections).reduce((acc, sec) => acc + calculateFine(sec.target, sec.multiplier, sec.amountPerHr), 0).toFixed(2)
                            }</h3>

                            <div className="flex items-center gap-[10px]">
                                <input
                                    type="checkbox"
                                    id="overtimeSms"
                                    className="w-4 h-4 rounded border-gray-300 text-[#3F5A54] focus:ring-[#3F5A54]"
                                    checked={overtimeSendSms}
                                    onChange={(e) => setOvertimeSendSms(e.target.checked)}
                                />
                                <label htmlFor="overtimeSms" className="text-[14px] text-gray-600 font-medium">Send SMS to Staff</label>
                            </div>

                            <Button
                                onClick={handleApplyOvertime}
                                className="w-full h-[48px] bg-[#3F5A54] text-white hover:bg-[#344b46] rounded-[8px] font-semibold text-[16px]"
                            >
                                Apply Fine
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Custom Multiplier Popup */}
            <Dialog open={isCustomMultiplierPopupOpen} onOpenChange={setIsCustomMultiplierPopupOpen}>
                <DialogContent showCloseButton={false} className="w-fit p-0 border-none bg-transparent shadow-none focus:outline-none flex items-center justify-center">
                    <div className="bg-white rounded-[16px] w-[350px] p-[28px] flex flex-col relative shadow-2xl border border-gray-100">
                        <DialogHeader className="mb-[20px]">
                            <DialogTitle className="text-[18px] font-bold text-[#1F2937]">Add Custom Salary Multiplier</DialogTitle>
                        </DialogHeader>

                        <div className="flex flex-col gap-[8px] mb-[20px]">
                            <label className="text-[12px] text-gray-400 font-medium">Multiplier</label>
                            <input
                                type="text"
                                value={customMultiplierValue}
                                onChange={(e) => setCustomMultiplierValue(e.target.value)}
                                placeholder="Enter Multiplier"
                                className="h-[44px] w-full border border-gray-200 rounded-[10px] px-4 text-[14px] outline-none focus:border-[#3F5A54]"
                            />
                        </div>

                        <ul className="text-[11px] text-gray-400 space-y-3 mb-[28px]">
                            <li>The Fine Rate will become X times the salary of each staff</li>
                            <li className="bg-gray-50 p-3 rounded-lg border border-gray-100 leading-relaxed italic">
                                The calculation is based on the salary. Please note that the Fine Rate will change if the salary changes.
                            </li>
                        </ul>

                        <div className="flex gap-[12px]">
                            <Button
                                variant="outline"
                                onClick={() => setIsCustomMultiplierPopupOpen(false)}
                                className="flex-1 h-[40px] border border-[#3F5A54] text-[#3F5A54] rounded-[8px] font-bold"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    if (customMultiplierValue) {
                                        setMultipliers(prev => [...prev, `${customMultiplierValue}x Salary`]);
                                        setIsCustomMultiplierPopupOpen(false);
                                        setCustomMultiplierValue("");
                                    }
                                }}
                                className={cn(
                                    "flex-1 h-[40px] rounded-[8px] font-bold transition-colors",
                                    customMultiplierValue
                                        ? "bg-[#3F5A54] text-white hover:bg-[#344b46]"
                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                )}
                                disabled={!customMultiplierValue}
                            >
                                Add Multiplier
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Fine/Overtime Error Popup */}
            <Dialog open={isFineOvertimeErrorPopupOpen} onOpenChange={setIsFineOvertimeErrorPopupOpen}>
                <DialogContent showCloseButton={false} className="w-fit p-0 border-none bg-transparent shadow-none focus:outline-none flex items-center justify-center">
                    <div className="bg-white rounded-[12px] w-[488px] h-[130px] p-[24px] flex flex-col relative shadow-2xl border border-gray-100">
                        <div className="flex flex-col gap-[4px] mb-[16px]">
                            <DialogHeader>
                                <DialogTitle className="text-[18px] font-semibold text-[#1F2937]">{errorPopupType}</DialogTitle>
                            </DialogHeader>
                            <p className="text-[14px] text-[#9CA3AF] font-normal">{employeeName.split(' ')[0]}</p>
                        </div>
                        <DialogClose className="absolute top-[24px] right-[24px] bg-[#F3F4F6] hover:bg-[#E5E7EB] rounded-[6px] p-[4px] transition-colors border-none outline-none">
                            <X className="w-[16px] h-[16px] text-[#1F2937]" />
                        </DialogClose>
                        <p className="text-[16px] text-[#1F2937] font-medium">Please mark the attendance first to add a {errorPopupType} entry</p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Deduct Leave Popup */}
            <Dialog open={isLeavePopupOpen} onOpenChange={setIsLeavePopupOpen}>
                <DialogContent showCloseButton={false} className="w-fit p-0 border-none bg-transparent shadow-none focus:outline-none flex items-center justify-center">
                    <div className="bg-white rounded-[16px] w-[380px] p-[28px] flex flex-col relative shadow-2xl border border-gray-100">
                        {/* Header */}
                        <div className="flex flex-col gap-[4px] mb-[24px]">
                            <DialogHeader>
                                <DialogTitle className="text-[20px] font-bold text-[#1F2937]">Deduct Leave</DialogTitle>
                            </DialogHeader>
                            <p className="text-[16px] text-[#9CA3AF] font-bold tracking-tight opacity-70">{employeeName.toUpperCase()}</p>
                        </div>



                        {/* Leave Options */}
                        <div className="flex flex-col gap-[10px] mb-[28px]">
                            {leaveBalances.map((category) => {
                                const { categoryId: id, categoryName: type, leaveBalance: balance } = category;
                                const isDisabled = balance === 0 && !["Weekly Off", "Other"].includes(type);
                                return (
                                    <button
                                        key={id}
                                        disabled={isDisabled}
                                        onClick={() => setSelectedLeaveType(id)}
                                        className={cn(
                                            "h-[46px] w-full rounded-[10px] border px-[16px] flex items-center justify-between transition-all outline-none",
                                            selectedLeaveType === id
                                                ? "border-[#2563EB] bg-[#EFF6FF]"
                                                : "border-gray-100 bg-white hover:border-gray-200",
                                            isDisabled && "opacity-50 grayscale cursor-not-allowed bg-gray-50 border-gray-100 hover:border-gray-200"
                                        )}
                                    >
                                        <div className="flex items-center gap-[12px]">
                                            <div className={cn(
                                                "w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center transition-all",
                                                selectedLeaveType === id ? "border-[#2563EB]" : "border-gray-200",
                                                isDisabled && "border-gray-300"
                                            )}>
                                                {selectedLeaveType === id && <div className="w-[10px] h-[10px] rounded-full bg-[#2563EB]" />}
                                            </div>
                                            <span className={cn(
                                                "text-[14px] font-medium transition-colors",
                                                isDisabled ? "text-gray-400" : "text-[#1F2937]"
                                            )}>{type}</span>
                                        </div>
                                        {type === "Weekly Off" ? (
                                            <span className="text-[14px] font-medium text-[#1F2937]">Available</span>
                                        ) : balance > 0 ? (
                                            <span className="text-[14px] font-medium text-[#1F2937]">{balance.toFixed(2)} Left</span>
                                        ) : balance === 0 && !["Weekly Off", "Other"].includes(type) ? (
                                            <span className="text-[11px] font-bold text-red-400 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Out of Leave</span>
                                        ) : null}
                                    </button>
                                );
                            })}

                            {/* Holiday Option */}
                            <button
                                onClick={() => setSelectedLeaveType("HOLIDAY")}
                                className={cn(
                                    "h-[46px] w-full rounded-[10px] border px-[16px] flex items-center justify-between transition-all outline-none",
                                    selectedLeaveType === "HOLIDAY"
                                        ? "border-[#2563EB] bg-[#EFF6FF]"
                                        : "border-gray-100 bg-white hover:border-gray-200"
                                )}
                            >
                                <div className="flex items-center gap-[12px]">
                                    <div className={cn(
                                        "w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center transition-all",
                                        selectedLeaveType === "HOLIDAY" ? "border-[#2563EB]" : "border-gray-200"
                                    )}>
                                        {selectedLeaveType === "HOLIDAY" && <div className="w-[10px] h-[10px] rounded-full bg-[#2563EB]" />}
                                    </div>
                                    <span className="text-[14px] font-medium text-[#1F2937]">Holiday</span>
                                </div>
                                <span className="text-[14px] font-medium text-[#1F2937]">Mark as Holiday</span>
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-[16px]">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsLeavePopupOpen(false);
                                    setSelectedEntryIndex(null);
                                }}
                                className="flex-1 h-[48px] border border-[#2563EB] text-[#2563EB] hover:bg-blue-50 rounded-[12px] font-bold text-[16px]"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveLeave}
                                className="flex-1 h-[48px] bg-[#2563EB] text-white hover:bg-[#1d4ed8] rounded-[12px] font-bold text-[16px] transition-colors"
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Half Day Option Popup */}
            <Dialog open={isHalfDayOptionPopupOpen} onOpenChange={setIsHalfDayOptionPopupOpen}>
                <DialogContent showCloseButton={false} className="w-fit p-0 border-none bg-transparent shadow-none focus:outline-none flex items-center justify-center">
                    <div className="bg-white rounded-[16px] w-[380px] p-[28px] flex flex-col relative shadow-2xl border border-gray-100">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-[20px]">
                            <div className="flex flex-col gap-[4px]">
                                <DialogHeader>
                                    <DialogTitle className="text-[20px] font-bold text-[#1F2937]">Half Day Option</DialogTitle>
                                </DialogHeader>
                                <p className="text-[16px] text-[#9CA3AF] font-bold tracking-tight opacity-70">{employeeName.toUpperCase()}</p>
                            </div>
                            <DialogClose className="bg-[#F3F4F6] hover:bg-[#E5E7EB] rounded-[6px] p-[4px] transition-colors">
                                <X className="w-[18px] h-[18px] text-[#1F2937]" />
                            </DialogClose>
                        </div>

                        <p className="text-[14px] text-[#4B5563] leading-relaxed mb-[24px] font-medium">
                            Choose if you want to give a paid/unpaid leave for the remaining half day
                        </p>

                        {/* Leave Selection Dropdown */}
                        <div className="relative mb-[24px]">
                            <select
                                value={selectedHfLeaveType}
                                onChange={(e) => setSelectedHfLeaveType(e.target.value)}
                                className="w-full h-[48px] border border-blue-200 rounded-[10px] px-[16px] text-[15px] font-medium text-[#1F2937] bg-white appearance-none outline-none focus:border-[#2563EB]"
                            >
                                <option value="Unpaid">Unpaid</option>
                                <option value="Week Off">Week Off</option>
                                {leaveBalances.map((c: any) => (
                                    <option key={c.categoryId} value={c.categoryId}>
                                        {c.categoryName} ({c.leaveBalance} Left)
                                    </option>
                                ))}
                                <option value="Other">Other</option>
                            </select>
                            <ChevronDown className="absolute right-[16px] top-[14px] w-[20px] h-[20px] text-gray-400 pointer-events-none" />
                        </div>

                        {/* Session Selection */}
                        <div className="flex flex-col gap-[12px] mb-[28px]">
                            <span className="text-[14px] font-medium text-gray-400">Choose Session</span>
                            <div className="flex gap-[12px]">
                                {["Session 1", "Session 2"].map(session => (
                                    <button
                                        key={session}
                                        onClick={() => setSelectedHfSession(session)}
                                        className={cn(
                                            "flex-1 h-[48px] rounded-[10px] border px-[16px] flex items-center gap-[12px] transition-all",
                                            selectedHfSession === session
                                                ? "border-[#2563EB] bg-[#EFF6FF]"
                                                : "border-gray-100 bg-white hover:border-gray-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all",
                                            selectedHfSession === session ? "border-[#2563EB]" : "border-gray-200"
                                        )}>
                                            {selectedHfSession === session && <div className="w-[8px] h-[8px] rounded-full bg-[#2563EB]" />}
                                        </div>
                                        <span className={cn(
                                            "text-[14px] font-bold transition-colors",
                                            selectedHfSession === session ? "text-[#2563EB]" : "text-[#4B5563]"
                                        )}>{session}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex gap-[16px]">
                            <Button
                                variant="outline"
                                onClick={() => setIsHalfDayOptionPopupOpen(false)}
                                className="flex-1 h-[48px] border border-[#2563EB] text-[#2563EB] hover:bg-blue-50 rounded-[12px] font-bold text-[16px]"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveHalfDayOption}
                                className="flex-1 h-[48px] bg-[#2563EB] text-white hover:bg-[#1d4ed8] rounded-[12px] font-bold text-[16px] transition-colors"
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function TimePicker({ value, onChange }: { value: string, onChange: (val: string) => void }) {
    return (
        <div className="relative">
            <input
                type="time"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                    "w-full px-[16px] h-[48px] bg-white border border-gray-200 rounded-[10px] text-[14px] font-medium outline-none transition-all",
                    "focus:border-[#3F5A54] focus:ring-1 focus:ring-[#3F5A54] [appearance:none]"
                )}
            />
        </div>
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
                "h-[39px] w-[160px] rounded-[6px] flex items-center px-[12px] border transition-all",
                styles
            )}
        >
            <div className="flex items-center gap-[6px] w-full">
                <span className="text-[12px] font-bold shrink-0">{short}</span>
                <span className="h-[12px] w-[1px] bg-current opacity-20"></span>
                <span className="text-[10px] font-normal truncate flex-1 text-left">{label}</span>
            </div>
        </button>
    );
}
