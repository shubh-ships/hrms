"use client"

import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import CloudIcon from "@/assets/Dashicons/Cloud.png";

export default function SalaryHistoryPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const storedHistory = JSON.parse(sessionStorage.getItem(`salary_history_${id}`) || "[]");
        setHistory(storedHistory);
    }, [id]);

    return (
        <div className="flex flex-col min-h-screen bg-[#F9FAFB] font-sans">
            <div className="p-[40px] flex-1 flex flex-col">
                {/* Header / Back */}
                <button
                    onClick={() => router.push(`/dashboard/admin/hrms/staff/${id}?tab=Salary Structure`)}
                    className="flex items-center gap-2 text-[#4B5563] hover:text-[#1F2937] transition-colors mb-6 w-fit"
                >
                    <ArrowLeft size={16} />
                    <span className="text-[12px] font-medium">Back</span>
                </button>

                {/* Title Section */}
                <h1 className="text-[20px] font-semibold text-[#1F2937] mb-8">Salary Revision History</h1>

                {/* Table Container */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm w-full max-w-[1255px]">
                    {/* Table Header */}
                    <div className="h-[39px] bg-[#F0F0F0] flex items-center px-8 border-b border-gray-100">
                        <span className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider w-[15%]">Staff Name</span>
                        <span className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider w-[10%]">Staff ID</span>
                        <span className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider w-[15%]">Entry</span>
                        <span className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider w-[15%]">Cycle</span>
                        <span className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider w-[15%]">Entry date</span>
                        <span className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider w-[15%]">Amount</span>
                        <span className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-wider w-[15%]">Created At</span>
                    </div>

                    {/* Table Body */}
                    {history.length > 0 ? (
                        <div className="flex flex-col">
                            {history.map((item) => (
                                <div key={item.id} className="h-[48px] border-b border-gray-100 flex items-center px-8 hover:bg-gray-50 transition-colors">
                                    <span className="text-[12px] font-medium text-[#1F2937] w-[15%]">{item.staffName}</span>
                                    <span className="text-[12px] text-[#4B5563] w-[10%]">{item.staffId}</span>
                                    <span className="text-[12px] text-[#4B5563] w-[15%]">{item.entry}</span>
                                    <span className="text-[12px] text-[#4B5563] w-[15%]">{item.cycle}</span>
                                    <span className="text-[12px] text-[#4B5563] w-[15%]">{item.entryDate}</span>
                                    <span className="text-[12px] font-semibold text-[#1F2937] w-[15%]">₹ {item.amount}</span>
                                    <span className="text-[12px] text-[#9CA3AF] w-[15%]">
                                        {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="mb-4">
                                <Image
                                    src={CloudIcon}
                                    alt="No data"
                                    width={85}
                                    height={85}
                                    className="object-contain opacity-80"
                                />
                            </div>
                            <p className="text-[#9CA3AF] text-[7px] font-regular uppercase tracking-widest">
                                No data found
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
