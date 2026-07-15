"use client"

import React, { useState, useEffect } from "react";
import { MoveLeft, ChevronDown, CheckCircle2, MoreHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getAllLoans } from "@/features/loan/loanSlice";

interface LoanApplicationSummaryProps {
    id: string;
    loanId: string;
}

export default function LoanApplicationSummary({ id, loanId }: LoanApplicationSummaryProps) {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const allLoans = useAppSelector((state: any) => state.loan.loans);
    const loanData = allLoans.find((l: any) => l._id === loanId);
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        dispatch(getAllLoans({}));
    }, [dispatch]);

    if (!loanData) return <div className="p-10 text-gray-500">Loading application details...</div>;

    const loan = {
        ...loanData,
        employeeName: loanData.employeeId?.personal 
            ? `${loanData.employeeId.personal.firstName} ${loanData.employeeId.personal.lastName}`
            : (loanData.userId?.name || ""),
        principal: loanData.principalAmount,
    };

    const principal = parseFloat(loan.principal) || 0;
    
    // Calculate Instalment Start Month (usually 1 month after disbursement)
    const disbursementDate = loan.disbursementDate ? new Date(loan.disbursementDate) : new Date();
    const instalmentStart = format(new Date(disbursementDate.getFullYear(), disbursementDate.getMonth() + 1, 1), "MMM yyyy");

    return (
        <div className="flex flex-col min-h-[calc(100vh-64px)] -m-4 bg-[#F9FAFB] font-sans">
            <div className="flex-1 px-8 pt-6 pb-8">
                {/* Back Button */}
                <button
                    onClick={() => router.push(`/dashboard/admin/hrms/staff/${id}?tab=Loans`)}
                    className="flex items-center gap-1.5 text-gray-600 hover:text-gray-800 transition-colors mb-6 group w-fit"
                >
                    <MoveLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-[12px] font-semibold">Back</span>
                </button>

                {/* Title */}
                <h1 className="text-[17px] font-semibold text-[#1F2937] mb-6">Loan Summary</h1>

                {/* Application Detail Card */}
                <div className="w-full bg-white border border-gray-100 rounded-xl p-6 shadow-sm mb-8">
                    <div className="flex items-center gap-3 mb-8">
                        <span className="text-[14px] font-bold text-[#1F2937] uppercase">{loan.employeeName || ""}</span>
                        <div className={cn(
                            "px-2 py-0.5 rounded-full flex items-center gap-1 border",
                            loan.status === "Approved" || loan.status === "Active"
                                ? "bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]"
                                : "bg-[#FEF9C3] text-[#854D0E] border-[#FEF08A]"
                        )}>
                            <div className={cn("w-1.2 h-1.2 rounded-full", loan.status === "Approved" || loan.status === "Active" ? "bg-[#16A34A]" : "bg-[#CA8A04]")}></div>
                            <span className="text-[9px] font-bold uppercase tracking-wider">{loan.status === "Active" ? "Approved" : loan.status}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-y-8 gap-x-4">
                        <SummaryItem label="Applied on Date" value={loan.createdDate || "26 Feb 2026"} />
                        <SummaryItem label="Loan Name" value={loan.loanName} />
                        <SummaryItem label="Description" value={loan.description || "-"} />
                        <SummaryItem label="Principal" value={`₹ ${principal.toLocaleString()}`} />
                        <SummaryItem label="Tenure" value={`${loan.tenure} Months`} />
                        <SummaryItem label="Annual Interest Rate" value={`${loan.interestRate}%`} />

                        <SummaryItem label="Interest Type" value={loan.interestType} />
                        <SummaryItem label="Remarks by Admin" value="-" />
                        <SummaryItem label="Remarks by Owner" value="-" />
                        <SummaryItem label="Disbursement Date" value={loan.disbursementDate || "-"} />
                        <SummaryItem label="Instalment Start Month" value={instalmentStart} />
                        <SummaryItem label="Approved by" value="-" />
                    </div>
                </div>

                {/* Logs Section */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-[15px] font-semibold text-[#1F2937]">Logs</h2>
                    <div className="w-full border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#F9FAFB] border-b border-gray-100">
                                    <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 tracking-wider">Particulars</th>
                                    <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 tracking-wider">Changed from</th>
                                    <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 tracking-wider">Changed to</th>
                                    <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 tracking-wider">Changed by</th>
                                    <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 tracking-wider text-right">Changed at</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-5 text-[12px] text-gray-700">{log.particulars}</td>
                                        <td className="px-6 py-5 text-[12px] text-gray-700">{log.oldValue}</td>
                                        <td className="px-6 py-5 text-[12px] text-gray-700">{log.newValue}</td>
                                        <td className="px-6 py-5 text-[12px] text-gray-700">{log.changedBy}</td>
                                        <td className="px-6 py-5 text-[12px] text-gray-700 text-right">{log.changedAt}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-[11px] text-gray-500 font-normal">{label}</span>
            <span className="text-[13px] font-semibold text-[#1F2937]">{value}</span>
        </div>
    );
}
