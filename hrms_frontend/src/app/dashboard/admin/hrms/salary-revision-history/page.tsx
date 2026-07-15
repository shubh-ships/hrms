"use client"

import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, Calendar, ChevronDown, MoveUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

export default function SalaryRevisionHistoryPage() {
    const router = useRouter();
    const { state } = useSidebar();
    const [searchQuery, setSearchQuery] = useState("");
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const historyRaw = sessionStorage.getItem("salaryRevisionHistory");
        if (historyRaw) {
            setHistory(JSON.parse(historyRaw));
        }
    }, []);

    const filteredHistory = history.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.empId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-screen bg-[#F9FAFB] font-sans overflow-x-hidden">
            <div className="flex-1 flex flex-col p-[40px] pb-[100px]">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-[#4B5563] hover:text-[#1F2937] transition-colors mb-6 w-fit"
                >
                    <ArrowLeft size={16} className="text-[#9CA3AF]" />
                    <span className="text-[12px] font-medium text-[#4B5563]">Back</span>
                </button>

                {/* Header Section */}
                <div className="flex justify-between items-start mb-8">
                    <h1 className="text-[20px] font-semibold text-[#1F2937]">Salary Revision History</h1>
                </div>

                {/* Main Content Card */}
                <div className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm mr-[100px] min-h-[324px]">
                    {/* Filters Row */}
                    <div className="flex items-center gap-4 px-6 py-6 bg-white border-b border-[#E5E7EB]">
                        <div className="relative w-[340px] h-[37px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                            <Input
                                placeholder="Search by name or staff ID"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-[37px] border-gray-200 rounded-lg text-[14px] focus-visible:ring-1 focus-visible:ring-gray-300"
                            />
                        </div>

                        <div className="flex items-center gap-2 px-3 h-[37px] border border-gray-200 rounded-lg bg-gray-50/50 cursor-pointer hover:bg-gray-100 transition-colors">
                            <span className="text-[12px] font-medium text-[#1F2937] mr-2">2026</span>
                            <Calendar size={16} className="text-[#4B5563]" />
                        </div>
                    </div>

                    {/* Table Header */}
                    <div className="h-[39px] bg-[#F0F0F0] flex items-center px-6 border-b border-gray-200 uppercase">
                        <div className="w-[15%] text-[7px] font-medium text-[#9CA3AF]">Name</div>
                        <div className="w-[12%] text-[7px] font-medium text-[#9CA3AF]">Staff Type Changed</div>
                        <div className="w-[12%] text-[7px] font-medium text-[#9CA3AF] text-center">Previous Salary</div>
                        <div className="w-[12%] text-[7px] font-medium text-[#9CA3AF] text-center">% Change</div>
                        <div className="w-[12%] text-[7px] font-medium text-[#9CA3AF] text-center">Revised Salary</div>
                        <div className="w-[12%] text-[7px] font-medium text-[#9CA3AF] text-center">Effective Date</div>
                        <div className="w-[12%] text-[7px] font-medium text-[#9CA3AF] text-center">Updated by</div>
                        <div className="w-[12%] text-[7px] font-medium text-[#9CA3AF] text-center">Updated on</div>
                        <div className="w-[8%] text-[7px] font-medium text-[#9CA3AF] text-right">Actions</div>
                    </div>

                    {/* Table Body */}
                    <div className="flex flex-col">
                        {filteredHistory.length > 0 ? (
                            filteredHistory.map((item) => (
                                <div key={item.id} className="flex px-6 py-4 items-center border-b border-[#E5E7EB] last:border-b-0 hover:bg-gray-50 transition-colors">
                                    {/* Name */}
                                    <div className="w-[15%] flex items-center gap-3">
                                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-semibold bg-gray-100 text-gray-600", item.initialsBg, item.initialsText)}>
                                            {item.initials}
                                        </div>
                                        <span className="text-[10px] font-medium text-[#3B82F6] uppercase">{item.name}</span>
                                    </div>

                                    {/* Staff Type */}
                                    <div className="w-[12%] text-[10px] text-[#4B5563] text-center">-</div>

                                    {/* Previous Salary */}
                                    <div className="w-[12%] text-[10px] text-[#1F2937] text-center font-medium">₹ {item.previousSalary.toLocaleString()}</div>

                                    {/* % Change */}
                                    <div className="w-[12%] flex items-center justify-center gap-1">
                                        <div className="flex items-center gap-1 text-[#10B981] font-semibold text-[10px]">
                                            <MoveUp size={10} strokeWidth={3} />
                                            <span>{item.percentChange} %</span>
                                        </div>
                                    </div>

                                    {/* Revised Salary */}
                                    <div className="w-[12%] text-[10px] text-[#1F2937] text-center font-medium">₹ {item.revisedSalary.toLocaleString()}</div>

                                    {/* Effective Date */}
                                    <div className="w-[12%] text-[10px] text-[#4B5563] text-center">{item.effectiveDate}</div>

                                    {/* Updated By */}
                                    <div className="w-[12%] text-[10px] text-[#4B5563] text-center">{item.updatedBy}</div>

                                    {/* Updated On */}
                                    <div className="w-[12%] text-[10px] text-[#4B5563] text-center">{item.updatedOn}</div>

                                    {/* Actions */}
                                    <div
                                        className="w-[8%] text-right font-medium text-[10px] text-[#3B82F6] hover:underline cursor-pointer"
                                        onClick={() => router.push(`/dashboard/admin/hrms/salary-revision-history/${item.id}`)}
                                    >
                                        View Details
                                    </div>
                                </div>
                            ))
                        ) : (
                            /* Empty State Body */
                            <div className="flex-1 flex flex-col items-center justify-center min-h-[250px]">
                                <img
                                    src="/assets/dashicons/cloud.png"
                                    alt="No Data"
                                    className="w-[85px] h-[85px] object-contain"
                                />
                                <p className="text-[7px] font-medium text-[#9CA3AF] mt-0">No Data Found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
