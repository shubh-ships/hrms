"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
    MoveLeft,
    CalendarDays,
    Download,
    ChevronDown,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    X,
    Filter as FilterIcon,
    Search as SearchIcon
} from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet";
import { cn, formatDateToYYYYMMDD } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    fetchDepartmentAttendance,
    fetchShiftAttendance,
    fetchDetailedAttendance,
    selectDepartmentAttendance,
    selectShiftAttendance,
    selectDetailedAttendance
} from "@/features/dailyAttendance/dailyAttendanceSlice";

import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

// ASSETS
import Cloud from "@/assets/Dashicons/Cloud.png";

const DetailedAttendance = () => {
    const router = useRouter();
    const now = new Date();
    const [selectedDate, setSelectedDate] = useState<Date>(now);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isMounted, setIsMounted] = useState(false);

    const dispatch = useAppDispatch();
    const deptData = useAppSelector(selectDepartmentAttendance);
    const shiftData = useAppSelector(selectShiftAttendance);
    const dailyAttendance = useAppSelector(selectDetailedAttendance);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    React.useEffect(() => {
        if (isMounted) {
            const dateStr = formatDateToYYYYMMDD(selectedDate);
            dispatch(fetchDepartmentAttendance(dateStr));
            dispatch(fetchShiftAttendance(dateStr));
            dispatch(fetchDetailedAttendance(dateStr));
        }
    }, [dispatch, selectedDate, isMounted]);

    // Filter states
    const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
    const [appliedShifts, setAppliedShifts] = useState<string[]>([]);
    const [appliedStatus, setAppliedStatus] = useState<string[]>([]);

    const shiftsOptions = ["Select All", "fixed shift 10.30 hours", "Break Shift"];
    const statusOptions = ["Select All", "Present", "Absent", "Half Day", "Leave", "Not Marked", "Fine", "Overtime"];

    // Customisation states
    const [isCustomiseOpen, setIsCustomiseOpen] = useState(false);
    const customisableColumns = [
        "Serial No", "Staff Name", "Staff Phone", "Staff Email", "Staff Status",
        "Staff Type", "Staff Id", "Date Of Joining", "Designation", "Gender",
        "Blood Group", "Date Of Birth", "Marital Status", "Father Name"
    ];
    const [selectedCols, setSelectedCols] = useState<string[]>(["Serial No", "Staff Name"]);
    const [tempSelectedCols, setTempSelectedCols] = useState<string[]>(["Serial No", "Staff Name"]);

    const toggleColumn = (col: string) => {
        setTempSelectedCols(prev =>
            prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
        );
    };

    const handleUpdateColumns = () => {
        setSelectedCols(tempSelectedCols);
        setIsCustomiseOpen(false);
    };

    const toggleShift = (shift: string) => {
        if (shift === "Select All") {
            setSelectedShifts(selectedShifts.length === shiftsOptions.length - 1 ? [] : shiftsOptions.filter(o => o !== "Select All"));
        } else {
            setSelectedShifts(prev => prev.includes(shift) ? prev.filter(s => s !== shift) : [...prev, shift]);
        }
    };

    const toggleStatus = (status: string) => {
        if (status === "Select All") {
            setSelectedStatus(selectedStatus.length === statusOptions.length - 1 ? [] : statusOptions.filter(o => o !== "Select All"));
        } else {
            setSelectedStatus(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
        }
    };

    const handleApplyFilter = () => {
        setAppliedShifts(selectedShifts);
        setAppliedStatus(selectedStatus);
        setIsFilterOpen(false);
    };

    const handleClearFilter = () => {
        setSelectedShifts([]);
        setSelectedStatus([]);
        setAppliedShifts([]);
        setAppliedStatus([]);
        setIsFilterOpen(false);
    };

    const handleDownload = (format: string) => {
        console.log(`Downloading report in ${format} format...`);
        const fileName = `Daily_Attendance_Report_${formattedDate.replace(/ /g, '_')}`;

        // Prepare data for export: fixed columns + customised columns
        const exportData = filteredData.map(item => {
            const data: any = {
                "Staff Name": item.name || "-",
                "Department": item.department || "-",
                "Attendance": item.attendance || "-",
                "In Time": item.inTime !== "-" ? new Date(item.inTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-",
                "Out Time": item.outTime !== "-" ? new Date(item.outTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-",
                "Over Time": item.overtime ? `${item.overtime.hours}h ${item.overtime.minutes}m` : "-",
                "Fine": item.fine ? `${item.fine.hours}h ${item.fine.minutes}m` : "-"
            };

            // Add extra columns from Customise menu if not already present
            selectedCols.forEach(col => {
                if (!data[col]) {
                    data[col] = item[col as keyof typeof item] || "-";
                }
            });
            return data;
        });

        if (format === 'Excel') {
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
        } else if (format === 'PDF') {
            const doc = new jsPDF("l", "mm", "a4");
            const margin = 14;
            const pageWidth = doc.internal.pageSize.getWidth();
            const availableWidth = pageWidth - (margin * 2);

            doc.setFontSize(16);
            doc.text("Attendance Details Report", margin, 15);
            doc.setFontSize(10);
            doc.text(`Date: ${formattedDate}`, margin, 22);

            const headers = Object.keys(exportData[0] || {});
            const colCount = headers.length;

            // Dynamic spacing and font size
            const colWidth = availableWidth / colCount;
            const fontSize = colCount > 8 ? 7 : (colCount > 5 ? 8 : 10);
            doc.setFontSize(fontSize);

            let y = 32;
            doc.setFont("helvetica", "bold");

            // Draw Headers
            headers.forEach((header, i) => {
                const x = margin + (i * colWidth);
                // Manual truncation if text is too long for the column
                doc.text(header, x, y, { maxWidth: colWidth - 2 });
            });
            doc.line(margin, y + 2, pageWidth - margin, y + 2);

            // Draw Rows
            y += 10;
            doc.setFont("helvetica", "normal");
            exportData.forEach(row => {
                if (y > 185) {
                    doc.addPage();
                    y = 20;
                }
                headers.forEach((header, i) => {
                    const x = margin + (i * colWidth);
                    const val = String(row[header] || "-");
                    doc.text(val, x, y, { maxWidth: colWidth - 2 });
                });
                y += 8;
            });

            doc.save(`${fileName}.pdf`);
        }
    };

    // Unified filtering logic
    const filteredData = React.useMemo(() => {
        if (!dailyAttendance) return [];
        return dailyAttendance.filter(item => {
            const name = item.name || "";
            const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
            // Note: The backend detailed attendance doesn't seem to include shift string directly in the same way as mock
            // But we can filter by department or name. For now, matching shift if available or ignoring if not in data.
            const matchesShift = appliedShifts.length === 0; // || appliedShifts.includes(item.shift); 
            const matchesStatus = appliedStatus.length === 0 || appliedStatus.includes(item.attendance);
            return matchesSearch && matchesShift && matchesStatus;
        });
    }, [dailyAttendance, searchQuery, appliedShifts, appliedStatus]);

    const formattedDate = isMounted
        ? `${selectedDate.getDate()} ${selectedDate.toLocaleString('en-GB', { month: 'short' })} ${selectedDate.getFullYear()}`
        : "";

    const prevDay = () => {
        setSelectedDate(d => {
            const prev = new Date(d);
            prev.setDate(prev.getDate() - 1);
            return prev;
        });
    };

    const nextDay = () => {
        setSelectedDate(d => {
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            return next;
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="bg-[#F8FAFC] mx-4 sm:mx-6 md:mx-[40px] font-sans flex flex-col relative">

            <div className="flex mt-[24px] mb-[8px] h-[40px]">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-[10px] text-[#3F5A54] hover:text-black transition-colors"
                >
                    <MoveLeft className="w-[20px]" />
                    <span className="text-[14px] font-medium text-[#3F5A54] w-[35px]">Back</span>
                </button>
            </div>


            {/* HEADER */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-[24px]">
                <h1 className="text-[#1F2937] text-[16px] font-medium">Attendance Details</h1>
                <div className="flex flex-wrap items-center gap-[12px]">
                    {/* Date Picker */}
                    <div className="flex items-center px-[10px] gap-[8px] bg-gray-100 h-[28px] w-[141px] rounded-lg border border-gray-300">
                        <CalendarDays
                            className="h-[16px] w-[16px] text-[#4B5563] cursor-pointer"
                            onClick={() => setCalendarOpen(true)}
                        />
                        <button
                            onClick={prevDay}
                            className="flex items-center justify-center hover:text-gray-600 transition-colors"
                        >
                            <ChevronLeft className="h-[12px] w-[12px] text-[#4B5563]" />
                        </button>

                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                            <PopoverTrigger asChild>
                                <button
                                    onClick={() => setCalendarOpen(true)}
                                    className="text-[10px] font-normal text-[#000000] w-[60px] text-center hover:underline whitespace-nowrap"
                                >
                                    {formattedDate}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="center">
                                <CalendarUI
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(d) => {
                                        if (d) {
                                            setSelectedDate(d);
                                            setCalendarOpen(false);
                                        }
                                    }}
                                    month={selectedDate}
                                    onMonthChange={setSelectedDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        <button
                            onClick={nextDay}
                            className="flex items-center justify-center hover:text-gray-600 transition-colors"
                        >
                            <ChevronRight className="h-[12px] w-[12px] text-[#4B5563]" />
                        </button>
                    </div>

                    {/* Daily Report */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="h-[28px] w-[128px] text-[#3F5A54] border-[#1F2937] bg-white hover:bg-gray-50 text-[14px] font-medium px-[8px] gap-[4px] rounded-[6px]">
                                <Download className="h-[14px] w-[14px]" />
                                <span className="text-[12px] font-regular flex-1 text-left text-[#3F5A54]">
                                    Download
                                </span>
                                <ChevronDown className="h-[14px] w-[14px]" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[80px] p-[4px] bg-white border border-[#E5E7EB] rounded-[8px] shadow-lg mt-[4px]" align="end">
                            <div className="flex flex-col gap-[2px]">
                                <button
                                    onClick={() => handleDownload('PDF')}
                                    className="w-full text-left px-[12px] py-[6px] text-[12px] font-medium text-[#4B5563] hover:bg-gray-50 rounded-[4px] transition-colors"
                                >
                                    PDF
                                </button>
                                <button
                                    onClick={() => handleDownload('Excel')}
                                    className="w-full text-left px-[12px] py-[6px] text-[12px] font-medium text-[#4B5563] hover:bg-gray-50 rounded-[4px] transition-colors"
                                >
                                    Excel
                                </button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* SUMMARY CARDS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 mb-[30px] gap-[25px]">
                {/* Department Card */}
                <Card className="border border-[#E5E7EB] h-[222px] shadow-sm bg-white overflow-hidden flex flex-col p-0 gap-0">
                    <div className="bg-[#F0F0F066] border-b border-[#E5E7EB] h-[39px] flex items-center shrink-0">
                        <table className="w-full table-fixed">
                            <thead>
                                <tr>
                                    <th className="text-[10px] w-[180px] font-medium text-[#4B5563] text-left pl-[20px]">Department</th>
                                    <th className="text-[10px] font-medium text-[#4B5563] text-center">P</th>
                                    <th className="text-[10px] font-medium text-[#4B5563] text-center">A</th>
                                    <th className="text-[10px] font-medium text-[#4B5563] text-center">NM</th>
                                    <th className="text-[10px] font-medium text-[#4B5563] text-center">HD</th>
                                    <th className="text-[10px] font-medium text-[#4B5563] text-center">OT</th>
                                    <th className="text-[10px] font-medium text-[#4B5563] text-center">F</th>
                                    <th className="text-[10px] font-medium text-[#4B5563] text-center pr-[20px]">L</th>
                                </tr>
                            </thead>
                        </table>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {deptData.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center gap-1">
                                <Image src={Cloud} alt="No data" width={85} height={85} />
                                <p className="text-[10px] text-[#9CA3AF]">no data found</p>
                            </div>
                        ) : (
                            <table className="w-full table-fixed">
                                <tbody>
                                    {deptData.map((row, idx) => (
                                        <tr key={idx} className="border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50 transition-all h-[40px] p-0">
                                            <td className="w-[180px] text-[10px] text-[#4B5563] font-medium truncate pl-[20px]">{row.departmentName}</td>
                                            <td className="text-[10px] text-[#4B5563] text-center">{row.present}</td>
                                            <td className="text-[10px] text-[#4B5563] text-center">{row.absent}</td>
                                            <td className="text-[10px] text-[#4B5563] text-center">{row.notMarked}</td>
                                            <td className="text-[10px] text-[#4B5563] text-center">{row.halfDay}</td>
                                            <td className="text-[10px] text-[#4B5563] text-center">{row.overtimeCount}</td>
                                            <td className="text-[10px] text-[#4B5563] text-center">{row.fineCount}</td>
                                            <td className="text-[10px] text-[#4B5563] text-center pr-[20px]">{row.onLeave}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </Card>

                {/* Shift Card */}
                <Card className="border border-[#E5E7EB] h-[222px] shadow-sm bg-white overflow-hidden flex flex-col p-0 gap-0">
                    <div className="bg-[#F0F0F066] border-b border-[#E5E7EB] h-[39px] flex items-center shrink-0">
                        <table className="w-full table-fixed">
                            <thead>
                                <tr>
                                    <th className="text-[10px] w-[180px] font-medium text-[#4B5563] text-left pl-[20px]">Shift Name</th>
                                    <th className="text-[10px] font-medium text-[#4B5563] text-center">P</th>
                                    <th className="text-[10px] font-medium text-[#4B5563] text-center">A</th>
                                    <th className="text-[10px] font-medium text-[#4B5563] text-center">NM</th>
                                    <th className="text-[10px] font-medium text-[#4B5563] text-center pr-[10px]">HD</th>
                                    <th className="text-[10px] font-medium text-[#4B5563] text-center pr-[20px]">OT</th>
                                    <th className="text-[10px] font-medium text-[#4B5563] text-center pr-[20px]">F</th>
                                    <th className="text-[10px] font-medium text-[#4B5563] text-center pr-[30px]">L</th>
                                </tr>
                            </thead>
                        </table>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        <table className="w-full table-fixed">
                            <tbody>
                                {shiftData.map((row, idx) => (
                                    <tr key={idx} className="border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50 transition-all h-[40px]">
                                        <td className="w-[180px] text-[10px] text-[#4B5563] font-medium truncate pl-[20px]">{row.shiftName}</td>
                                        <td className="text-[10px] text-[#4B5563] text-center">{row.present}</td>
                                        <td className="text-[10px] text-[#4B5563] text-center">{row.absent}</td>
                                        <td className="text-[10px] text-[#4B5563] text-center">{row.notMarked}</td>
                                        <td className="text-[10px] text-[#4B5563] text-center">{row.halfDay}</td>
                                        <td className="text-[10px] text-[#4B5563] text-center">{row.overtimeCount}</td>
                                        <td className="text-[10px] text-[#4B5563] text-center">{row.fineCount}</td>
                                        <td className="text-[10px] text-[#4B5563] text-center">{row.onLeave}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* DAILY ATTENDANCE SECTION */}
            <div className="flex flex-col gap-[16px]">
                <h1 className="text-[#1F2937] text-[16px] font-medium">Daily Attendance</h1>
                <Card className="border border-[#E5E7EB] shadow-sm bg-white overflow-hidden flex flex-col p-0 gap-0">
                    {/* TOOLBAR */}
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between px-[20px] py-[12px] border-b border-[#E5E7EB] gap-4">
                        <div className="flex flex-col sm:flex-row items-center gap-[24px] lg:gap-[40px] w-full lg:w-auto">
                            <div className="flex items-center gap-[12px] h-[34px] w-full sm:w-[350px] border border-[#BABABA] rounded-[10px] px-[12px] bg-white">
                                <SearchIcon className="h-[16px] w-[16px] text-[#BABABA]" />
                                <Input
                                    placeholder="Search by Employee name"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="text-[14px] font-medium text-[#BABABA] border-0 focus-visible:ring-0 placeholder:text-[#BABABA] p-0"
                                />
                            </div>

                            <div className="flex items-center gap-[24px] w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                                {/* Filter */}
                                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="h-[30px] w-[70px] border-[#E5E7EB] gap-[8px] text-[#4B5563] bg-[#EEF0FF] text-[14px] cursor-pointer">
                                            <FilterIcon className="h-[11px] w-[11px]" />
                                            Filter
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] h-auto p-0 border-none rounded-[12px] shadow-lg bg-white overflow-hidden mt-[8px]" align="start" side="bottom">
                                        <div className="flex flex-col w-full h-full p-[24px]">
                                            {/* Header */}
                                            <div className="flex items-center justify-between mb-[20px]">
                                                <h2 className="text-[16px] font-medium text-[#1F2937]">Filter By</h2>
                                                <button onClick={() => setIsFilterOpen(false)} className="text-[#374151] hover:text-black">
                                                    <X className="h-[16px] w-[16px] bg-[#F0F0F066]" />
                                                </button>
                                            </div>

                                            {/* Form Fields */}
                                            <div className="flex flex-col gap-[16px] mb-[32px]">
                                                {/* Shifts */}
                                                <div className="flex flex-col gap-[8px]">
                                                    <Label className="text-[7px] font-regular">Shifts</Label>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                className="w-[360px] h-[28px] justify-between px-[16px] py-[10px] text-[#9CA3AF] font-regular text-[10px] border-[#E5E7EB] rounded-[8px]"
                                                            >
                                                                {selectedShifts.length > 0 ? `${selectedShifts.length} selected` : "Select Shift"}
                                                                <ChevronDown className="h-[16px] w-[16px] text-[#9CA3AF]" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[360px] p-0 bg-white border border-[#E5E7EB] rounded-[4px] shadow-sm" align="start">
                                                            <div className="flex flex-col">
                                                                {shiftsOptions.map((opt) => (
                                                                    <div
                                                                        key={opt}
                                                                        className="flex items-center gap-[12px] px-[16px] py-[12px] hover:bg-gray-50 border-b border-[#E5E7EB] last:border-0 cursor-pointer"
                                                                        onClick={() => toggleShift(opt)}
                                                                    >
                                                                        <Checkbox
                                                                            checked={opt === "Select All" ? selectedShifts.length === shiftsOptions.length - 1 : selectedShifts.includes(opt)}
                                                                            onCheckedChange={() => toggleShift(opt)}
                                                                            className="h-[18px] w-[18px] border-[#9CA3AF] rounded-[4px]"
                                                                        />
                                                                        <span className="text-[14px] font-regular text-[#1F2937]">{opt}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>

                                                {/* Attendance Status */}
                                                <div className="flex flex-col gap-[8px]">
                                                    <Label className="text-[7px] font-regular">Attendance Status</Label>                                                <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                className="w-[360px] h-[28px] justify-between px-[16px] py-[10px] text-[#9CA3AF] font-regular text-[10px] border-[#E5E7EB] rounded-[8px]"
                                                            >
                                                                {selectedShifts.length > 0 ? `${selectedShifts.length} selected` : "Select Attendance Status"}
                                                                <ChevronDown className="h-[16px] w-[16px] text-[#9CA3AF]" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[360px] p-0 bg-white border border-[#E5E7EB] rounded-[4px] shadow-sm" align="start">
                                                            <div className="flex flex-col max-h-[200px] overflow-y-auto">
                                                                {statusOptions.map((opt) => (
                                                                    <div
                                                                        key={opt}
                                                                        className="flex items-center gap-[12px] px-[16px] py-[12px] hover:bg-gray-50 border-b border-[#E5E7EB] last:border-0 cursor-pointer"
                                                                        onClick={() => toggleStatus(opt)}
                                                                    >
                                                                        <Checkbox
                                                                            checked={opt === "Select All" ? selectedStatus.length === statusOptions.length - 1 : selectedStatus.includes(opt)}
                                                                            onCheckedChange={() => toggleStatus(opt)}
                                                                            className="h-[18px] w-[18px] border-[#9CA3AF] rounded-[4px]"
                                                                        />
                                                                        <span className="text-[14px] font-regular text-[#1F2937]">{opt}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            </div>

                                            {/* Footer Buttons */}
                                            <div className="flex items-center justify-center gap-[24px]">
                                                <Button
                                                    variant="outline"
                                                    onClick={handleClearFilter}
                                                    className="h-[30px] w-[146px] border-[#3F5A54] text-[#3F5A54] hover:bg-gray-50 text-[10px] font-regular rounded-[8px]"
                                                >
                                                    Clear Filter
                                                </Button>
                                                <Button
                                                    onClick={handleApplyFilter}
                                                    className="h-[30px] w-[146px] bg-[#3F5A54] hover:bg-[#2F443E] text-white text-[14px] font-medium rounded-[8px]"
                                                >
                                                    Apply Filter
                                                </Button>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="flex items-center gap-[24px]">
                                <Sheet open={isCustomiseOpen} onOpenChange={(open) => {
                                    setIsCustomiseOpen(open);
                                    if (open) setTempSelectedCols(selectedCols);
                                }}>
                                    <SheetTrigger asChild>
                                        <Button variant="outline" className="h-[30px] w-[100px] border-[#3F5A54] text-[#3F5A54] bg-white text-[10px] font-medium rounded-[8px] cursor-pointer">
                                            Customise
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent className="sm:max-w-[480px] w-full h-full p-0 flex flex-col border-none shadow-xl">
                                        <div className="flex flex-col h-full bg-white relative">
                                            <div className="px-[30px] pt-[30px] pb-[10px]">
                                                <div className="flex items-center justify-between mb-[4px]">
                                                    <SheetTitle className="text-[20px] font-medium text-[#1F2937]">Daily Attendance Report Customisation</SheetTitle>
                                                </div>
                                                <p className="text-[12px] text-[#4B5563] font-regular">Select the columns you want to see in your Daily Attendance report</p>
                                            </div>

                                            <div className="flex-1 overflow-y-auto px-[30px] py-[20px] custom-scrollbar">
                                                <div className="flex flex-col gap-[20px]">
                                                    {customisableColumns.map((col) => (
                                                        <div key={col} className="flex items-center gap-[12px] group">
                                                            <Checkbox
                                                                id={col}
                                                                checked={tempSelectedCols.includes(col)}
                                                                onCheckedChange={() => toggleColumn(col)}
                                                                className="h-[20px] w-[20px] border-[#9CA3AF] rounded-[4px] data-[state=checked]:bg-[#3F5A54] data-[state=checked]:border-[#3F5A54]"
                                                            />
                                                            <label
                                                                htmlFor={col}
                                                                className="text-[14px] font-medium text-[#4B5563] cursor-pointer group-hover:text-black transition-colors"
                                                            >
                                                                {col}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-[30px] border-t border-[#E5E7EB]">
                                                <Button
                                                    onClick={handleUpdateColumns}
                                                    className="w-full h-[45px] bg-[#D1D5DB] hover:bg-[#9CA3AF] text-[#4B5563] text-[16px] font-semibold rounded-[8px] transition-all"
                                                >
                                                    Update
                                                </Button>
                                            </div>
                                        </div>
                                    </SheetContent>
                                </Sheet>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button className="h-[30px] w-[120px] bg-[#3F5A54] hover:bg-[#2F443E] text-white gap-[8px] text-[14px] font-medium rounded-[8px]">
                                            <Download className="h-[16px] w-[16px]" />
                                            <p className="text-[14px] font-medium">Download</p>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[100px] p-[4px] bg-white border border-[#E5E7EB] rounded-[8px] shadow-lg mt-[4px]" align="end">
                                        <div className="flex flex-col gap-[2px]">
                                            <button
                                                onClick={() => handleDownload('PDF')}
                                                className="w-full text-left px-[12px] py-[8px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 rounded-[4px] transition-colors"
                                            >
                                                PDF
                                            </button>
                                            <button
                                                onClick={() => handleDownload('Excel')}
                                                className="w-full text-left px-[12px] py-[8px] text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 rounded-[4px] transition-colors"
                                            >
                                                Excel
                                            </button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full min-w-[800px] lg:min-w-full table-fixed text-left text-[10px]">
                            <thead className="bg-[#F0F0F0]/40 border-b border-[#E5E7EB] text-[#4B5563] h-[25px] font-medium">
                                <tr>
                                    <th className="w-[18%] pl-[20px] font-medium text-[10px]">Name</th>
                                    <th className="w-[14%] text-center font-medium text-[10px]">Department</th>
                                    <th className="w-[14%] text-center font-medium text-[10px]">Attendance</th>
                                    <th className="w-[14%] text-center font-medium text-[10px]">In Time</th>
                                    <th className="w-[14%] text-center font-medium text-[10px]">Out Time</th>
                                    <th className="w-[14%] text-center font-medium text-[10px]">Over Time</th>
                                    <th className="w-[12%] text-center pr-[20px] font-medium text-[10px]">Fine</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((row, idx) => (
                                    <tr key={idx} className="border-b h-[35px] text-[#1F2937] border-[#E5E7EB] last:border-0 hover:bg-gray-50 transition-all">
                                        <td className="pl-[20px] text-[10px] font-regular">{row.name}</td>
                                        <td className="text-center text-[10px] font-regular">{row.department}</td>
                                        <td className="text-center text-[10px] font-regular">{row.attendance}</td>
                                        <td className="text-center text-[10px] font-regular">{row.inTime !== "-" ? new Date(row.inTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}</td>
                                        <td className="text-center text-[10px] font-regular">{row.outTime !== "-" ? new Date(row.outTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}</td>
                                        <td className="text-center text-[10px] font-regular">{row.overtime ? `${row.overtime.hours}h ${row.overtime.minutes}m` : "-"}</td>
                                        <td className="text-center text-[10px] font-regular pr-[20px]">{row.fine ? `${row.fine.hours}h ${row.fine.minutes}m` : "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default DetailedAttendance;