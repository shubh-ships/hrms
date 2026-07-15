"use client";
import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Calendar, CalendarDays, Download } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { useAppDispatch } from "@/store/hooks";
import { fetchEmployeeMonthlyData } from "@/features/musterRollTable/musterRollTableSlice";

export interface DailyAttendance {
    date: number;
    day: string;
    workingHours: string;
    status: string;
    ot?: string;
    l?: string;
}

export interface MusterRollItem {
    id: string;
    staffName: string;
    staffInitials: string;
    staffImage: string;
    shift?: string; // Added for Daily Report PDF
    present: string | number;
    absent: string | number;
    halfDay: string | number;
    paidLeave: string | number;
    unmarked: string | number;
    overtime: string | number;
    fine: string | number;
    dailyAttendance: DailyAttendance[];
}

interface Props {
    data: MusterRollItem[];
    date: Date;
    onDateChange?: (date: Date) => void;
}

const avatarColors = [
    "bg-green-100 text-green-700",
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-orange-100 text-orange-700",
    "bg-pink-100 text-pink-700",
];

const MusterRollTable: React.FC<Props> = ({ data, date, onDateChange }) => {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [expandAll, setExpandAll] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const dispatch = useAppDispatch();

    // Re-fetch data for expanded rows when the month changes
    useEffect(() => {
        if (expandedRows.size > 0) {
            const year = date.getFullYear();
            const monthIdx = date.getMonth() + 1;
            expandedRows.forEach(id => {
                const item = data.find(d => d.id === id);
                if (item && (!item.dailyAttendance || item.dailyAttendance.length <= 1)) {
                    dispatch(fetchEmployeeMonthlyData({ userId: id, month: monthIdx, year }));
                }
            });
        }
    }, [date, dispatch, expandedRows.size]);

    const toggleRow = (id: string) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (!next.has(id)) {
                // Fetch full monthly details if we don't have them yet
                const item = data.find(d => d.id === id);
                if (item && (!item.dailyAttendance || item.dailyAttendance.length <= 1)) {
                    const year = date.getFullYear();
                    const monthIdx = date.getMonth() + 1;
                    dispatch(fetchEmployeeMonthlyData({ userId: id, month: monthIdx, year }));
                }
                next.add(id);
            } else {
                next.delete(id);
            }
            return next;
        });
    };

    const handleExpandAll = () => {
        if (expandAll) {
            setExpandedRows(new Set());
        } else {
            const allIds = data.map((d) => d.id);
            setExpandedRows(new Set(allIds));

            // Trigger fetch for all employees
            const year = date.getFullYear();
            const monthIdx = date.getMonth() + 1;
            allIds.forEach(id => {
                const item = data.find(d => d.id === id);
                if (item && (!item.dailyAttendance || item.dailyAttendance.length <= 1)) {
                    dispatch(fetchEmployeeMonthlyData({ userId: id, month: monthIdx, year }));
                }
            });
        }
        setExpandAll(!expandAll);
    };

    const columns = ["Staff Name", "Present", "Absent", "Half Day", "Paid Leave", "Unmarked", "Overtime", "Fine"];

    // Counts how many days have a specific status
    const countByStatus = (item: MusterRollItem, status: string): string | number => {
        const count = item.dailyAttendance.filter(d => d.status === status).length;
        return count === 0 ? "-" : count;
    };

    // Counts days that have no status assigned (status is "-")
    const countUnmarked = (item: MusterRollItem): string | number => {
        const count = item.dailyAttendance.filter(d => d.status === "-").length;
        return count === 0 ? "-" : count;
    };

    // Calculates total fine based on "L" (left time) values
    const calculateTotalFine = (dailyAttendance: DailyAttendance[]): string => {
        let totalMinutes = 0;
        dailyAttendance.forEach(d => {
            if (d.l && d.l !== "-") {
                // Remove "-" sign if present and split by ":"
                const timeStr = d.l.replace("-", "");
                const [hours, minutes] = timeStr.split(":").map(Number);
                if (!isNaN(hours) && !isNaN(minutes)) {
                    totalMinutes += (hours * 60) + minutes;
                }
            }
        });

        if (totalMinutes === 0) return "-";

        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} hrs`;
    };


    // Calculates total overtime based on "ot" values
    const calculateTotalOvertime = (dailyAttendance: DailyAttendance[]): string => {
        let totalMinutes = 0;
        dailyAttendance.forEach(d => {
            if (d.ot && d.ot !== "-") {
                // Remove "+" or "-" sign if present and split by ":"
                const timeStr = d.ot.replace(/[+-]/g, "");
                const [hours, minutes] = timeStr.split(":").map(Number);
                if (!isNaN(hours) && !isNaN(minutes)) {
                    totalMinutes += (hours * 60) + minutes;
                }
            }
        });

        if (totalMinutes === 0) return "-";

        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} hrs`;
    };

    const handleDownload = (format: string) => {
        const dateStr = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        const fileName = `Attendance_Muster_Roll_${dateStr.replace(/ /g, '_')}`;

        // Prepare data for export
        const exportData = data.map(item => ({
            "Staff Name": item.staffName,
            "Present": countByStatus(item, "P"),
            "Absent": countByStatus(item, "A"),
            "Half Day": countByStatus(item, "H"),
            "Paid Leave": countByStatus(item, "PL"),
            "Unmarked": countUnmarked(item),
            "Overtime": calculateTotalOvertime(item.dailyAttendance),
            "Fine": calculateTotalFine(item.dailyAttendance)
        }));

        if (format === 'Excel') {
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "MusterRoll");
            XLSX.writeFile(workbook, `${fileName}.xlsx`);
        } else if (format === 'PDF') {
            const doc = new jsPDF("p", "mm", "a4");
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 14;
            const availableWidth = pageWidth - (margin * 2);

            doc.setTextColor(0, 0, 0);

            // Header
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("Attendance Muster Roll", margin, 20);

            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text(`Report Period: ${formattedDisplayDate}`, margin, 32);

            // Table Setup
            const headers = ["Staff Name", "P", "A", "H", "PL", "U", "OT", "Fine"];
            const colWidth = (availableWidth) / headers.length;

            let y = 45;
            doc.setFont("helvetica", "bold");
            headers.forEach((header, i) => {
                const x = margin + (i * colWidth);
                doc.text(header, x, y);
            });

            doc.setLineWidth(0.3);
            doc.line(margin, y + 2, pageWidth - margin, y + 2);

            // Data Rows
            y += 10;
            doc.setFont("helvetica", "normal");
            data.forEach(item => {
                if (y > 270) { doc.addPage(); y = 20; }
                const row = [
                    item.staffName,
                    countByStatus(item, "P").toString(),
                    countByStatus(item, "A").toString(),
                    countByStatus(item, "H").toString(),
                    countByStatus(item, "PL").toString(),
                    countUnmarked(item).toString(),
                    calculateTotalOvertime(item.dailyAttendance),
                    calculateTotalFine(item.dailyAttendance)
                ];

                row.forEach((val, i) => {
                    const x = margin + (i * colWidth);
                    doc.text(String(val), x, y, { maxWidth: colWidth - 2 });
                });
                y += 8;
            });

            doc.save(`${fileName}.pdf`);
        }
        setIsDownloadOpen(false);
    };

    const formattedDisplayDate = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-medium text-[#1F2937]">Attendance Muster Roll</h2>

                <div className="flex items-center gap-[16px]">
                    <button
                        onClick={handleExpandAll}
                        className="text-[10px] h-[27px] w-[83px]  text-[#000000] bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        {expandAll ? "Collapse All" : "Expand All"}
                    </button>

                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                            <button className="flex items-center justify-center h-[27px] min-w-[122px] px-3 gap-[6px] text-[10px] text-[#000000] bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                                <CalendarDays className="h-[12px] w-[12px] text-[#4B5563]" />
                                {formattedDisplayDate}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <CalendarUI
                                mode="single"
                                selected={date}
                                onSelect={(d) => {
                                    if (d) {
                                        if (onDateChange) onDateChange(d);
                                        setIsCalendarOpen(false);
                                    }
                                }}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    <Popover open={isDownloadOpen} onOpenChange={setIsDownloadOpen}>
                        <PopoverTrigger asChild>
                            <button className="flex items-center justify-center gap-[6px] h-[27px] w-[83px] text-[10px] text-[#000000] bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                                <Download className="h-[12px] w-[12px] text-[#4B5563]" />
                                Download
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[120px] p-0" align="end">
                            <div className="flex flex-col">
                                <button
                                    onClick={() => handleDownload('PDF')}
                                    className="px-4 py-2 text-[12px] text-left hover:bg-gray-100 transition-colors border-b border-gray-100"
                                >
                                    PDF
                                </button>
                                <button
                                    onClick={() => handleDownload('Excel')}
                                    className="px-4 py-2 text-[12px] text-left hover:bg-gray-100 transition-colors"
                                >
                                    Excel
                                </button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-[30px]">
                <div className="pl-[20px] py-[20px] border-b border-gray-300 shadow-sm bg-white">
                    <span className="h-[24px] w-[64px] text-[16px] font-medium text-[#1F2937]">Regular</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse table-fixed">
                        <colgroup>
                            <col style={{ width: "280px" }} />
                            <col /><col /><col /><col /><col /><col /><col />
                        </colgroup>
                        <thead>
                            <tr className="border-b border-gray-200 bg-[#F0F0F0B2]">
                                {columns.map((col, colIdx) => (
                                    <th
                                        key={col}
                                        className={`text-[10px] py-[12px] font-medium text-[#4B5563] whitespace-nowrap ${colIdx === 0 ? "pl-[20px] text-left" : "text-center"
                                            }`}
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {data.map((item, idx) => {
                                const isExpanded = expandedRows.has(item.id);
                                const colorClass = avatarColors[idx % avatarColors.length];

                                return (
                                    <React.Fragment key={item.id}>
                                        <tr
                                            className="border-t border-gray-300 hover:bg-gray-50/50 transition-colors cursor-pointer"
                                            onClick={() => toggleRow(item.id)}
                                        >
                                            <td className="pl-[20px] py-3 text-[#4B5563]">
                                                <div className="flex items-center gap-2">
                                                    <span className="shrink-0">
                                                        {isExpanded
                                                            ? <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
                                                            : <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
                                                        }
                                                    </span>
                                                    <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${colorClass}`}>
                                                        {item.staffInitials}
                                                    </span>
                                                    <span className="text-[10px] text-[#000000] font-regular">{item.staffName}</span>
                                                </div>
                                            </td>

                                            <td className="py-3 text-[10px] text-[#4B5563] text-center">{countByStatus(item, "P")}</td>
                                            <td className="py-3 text-[10px] text-[#4B5563] text-center">{countByStatus(item, "A")}</td>
                                            <td className="py-3 text-[10px] text-[#4B5563] text-center">{countByStatus(item, "H")}</td>
                                            <td className="py-3 text-[10px] text-[#4B5563] text-center">{countByStatus(item, "PL")}</td>
                                            <td className="py-3 text-[10px] text-[#4B5563] text-center">{countUnmarked(item)}</td>
                                            <td className="py-3 text-[10px] text-[#4B5563] text-center">{calculateTotalOvertime(item.dailyAttendance)}</td>
                                            <td className="py-3 text-[10px] text-[#4B5563] text-center">{calculateTotalFine(item.dailyAttendance)}</td>
                                        </tr>

                                        {/* Expanded detail row — daily attendance grid */}
                                        {isExpanded && (
                                            <tr className="border-t border-gray-200 bg-white">
                                                <td colSpan={8} className="p-[10px] pb-[20px]">
                                                    <div className="w-full border border-gray-200 rounded-lg">
                                                        <table className="w-full border-collapse text-center text-[10px] table-fixed">
                                                            <tbody>
                                                                {/* Day names + dates */}
                                                                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                                                                    <td className="w-[50px] text-center bg-gray-100 py-[10px] font-medium text-[#4B5563] whitespace-nowrap">
                                                                        Days
                                                                    </td>
                                                                    {(() => {
                                                                        const year = date.getFullYear();
                                                                        const monthIdx = date.getMonth();
                                                                        const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

                                                                        return Array.from({ length: daysInMonth }, (_, i) => {
                                                                            const dDate = i + 1;
                                                                            const dayLabel = new Date(year, monthIdx, dDate).toLocaleDateString('en-US', { weekday: 'narrow' });

                                                                            return (
                                                                                <td key={dDate} className="py-[8px]">
                                                                                    <div className="flex flex-col items-center gap-[2px]">
                                                                                        <div className="text-[#4B5563] text-[9px] font-medium uppercase font-sans">
                                                                                            {dayLabel || '-'}
                                                                                        </div>
                                                                                        <div className="text-[#1F2937] text-[10px] font-medium">{dDate || '-'}</div>
                                                                                    </div>
                                                                                </td>
                                                                            );
                                                                        });
                                                                    })()}
                                                                </tr>
                                                                {/* Working Hours (WH) */}
                                                                <tr className="border-b border-[#E5E7EB]">
                                                                    <td className="w-[50px] text-center bg-gray-100 font-medium text-[#4B5563] whitespace-nowrap">
                                                                        WH
                                                                    </td>
                                                                    {(() => {
                                                                        const year = date.getFullYear();
                                                                        const monthIdx = date.getMonth();
                                                                        const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

                                                                        return Array.from({ length: daysInMonth }, (_, i) => {
                                                                            const dDate = i + 1;
                                                                            const attRecord = item.dailyAttendance.find(d => d.date === dDate);
                                                                            return (
                                                                                <td key={dDate} className="py-[10px] text-[#1F2937] text-[9px] font-normal truncate">
                                                                                    {attRecord && attRecord.workingHours && attRecord.workingHours !== "" ? attRecord.workingHours : "-"}
                                                                                </td>
                                                                            );
                                                                        });
                                                                    })()}
                                                                </tr>
                                                                {/* Status Row */}
                                                                <tr className="border-b border-[#E5E7EB] last:border-b-0">
                                                                    <td className="w-[50px] text-center bg-gray-100 font-medium text-[#4B5563]">
                                                                        Status
                                                                    </td>
                                                                    {(() => {
                                                                        const year = date.getFullYear();
                                                                        const monthIdx = date.getMonth();
                                                                        const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

                                                                        return Array.from({ length: daysInMonth }, (_, i) => {
                                                                            const dDate = i + 1;
                                                                            const attRecord = item.dailyAttendance.find(d => d.date === dDate);
                                                                            const status = attRecord?.status;
                                                                            return (
                                                                                <td key={dDate} className="py-[10px] text-[10px] font-medium">
                                                                                    <span className={status === 'A' ? 'text-[#EF4444]' : status === 'P' ? 'text-[#10B981]' : 'text-[#4B5563]'}>
                                                                                        {status && status !== "" ? status : "-"}
                                                                                    </span>
                                                                                </td>
                                                                            );
                                                                        });
                                                                    })()}
                                                                </tr>
                                                                {/* OT Row */}
                                                                {item.dailyAttendance.some(d => d.ot && d.ot !== "-") && (
                                                                    <tr className="border-b border-[#E5E7EB] last:border-b-0">
                                                                        <td className="w-[60px] px-[4px] py-[10px] text-left font-medium text-[#4B5563] whitespace-nowrap bg-white">
                                                                            OT
                                                                        </td>
                                                                        {(() => {
                                                                            const year = date.getFullYear();
                                                                            const monthIdx = date.getMonth();
                                                                            const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

                                                                            return Array.from({ length: daysInMonth }, (_, i) => {
                                                                                const dDate = i + 1;
                                                                                const attRecord = item.dailyAttendance.find(d => d.date === dDate);
                                                                                const ot = attRecord?.ot;
                                                                                return (
                                                                                    <td key={dDate} className="py-[10px] text-[#1F2937] text-[9px] font-normal truncate">
                                                                                        {ot && ot !== "" ? ot : "-"}
                                                                                    </td>
                                                                                );
                                                                            });
                                                                        })()}
                                                                    </tr>
                                                                )}
                                                                {/* L Row */}
                                                                {item.dailyAttendance.some(d => d.l && d.l !== "-") && (
                                                                    <tr className="last:border-b-0">
                                                                        <td className="w-[60px] px-[4px] py-[10px] text-left font-medium text-[#4B5563] whitespace-nowrap bg-white">
                                                                            L
                                                                        </td>
                                                                        {(() => {
                                                                            const year = date.getFullYear();
                                                                            const monthIdx = date.getMonth();
                                                                            const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

                                                                            return Array.from({ length: daysInMonth }, (_, i) => {
                                                                                const dDate = i + 1;
                                                                                const attRecord = item.dailyAttendance.find(d => d.date === dDate);
                                                                                const l = attRecord?.l;
                                                                                return (
                                                                                    <td key={dDate} className="py-[10px] text-[#1F2937] text-[9px] font-normal truncate">
                                                                                        {l && l !== "" ? l : "-"}
                                                                                    </td>
                                                                                );
                                                                            });
                                                                        })()}
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}

                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};

export default MusterRollTable;
