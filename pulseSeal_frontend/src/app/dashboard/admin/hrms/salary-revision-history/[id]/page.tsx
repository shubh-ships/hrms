"use client"

import React, { useState, useEffect } from "react";
import { ArrowLeft, MoveUp, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function SalaryRevisionDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const historyId = params.id as string;
    const [revision, setRevision] = useState<any>(null);

    useEffect(() => {
        const historyRaw = sessionStorage.getItem("salaryRevisionHistory");
        if (historyRaw) {
            const history = JSON.parse(historyRaw);
            const found = history.find((item: any) => item.id.toString() === historyId);
            setRevision(found);
        }
    }, [historyId]);

    const handleDownloadReport = () => {
        if (!revision) return;

        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(18);
        doc.setTextColor(31, 41, 55);
        doc.text("Salary Revision Details", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text(`Staff Name: ${revision.name}`, 14, 30);
        doc.text(`Staff ID: ${revision.empId}`, 14, 35);
        doc.text(`Effective Date: ${revision.effectiveDate}`, 14, 40);

        // Summary Table
        const difference = revision.revisedSalary - revision.previousSalary;
        autoTable(doc, {
            startY: 50,
            head: [['Previous Salary', 'Revised Salary', 'Difference', '% Change', 'Status']],
            body: [[
                `INR ${revision.previousSalary.toLocaleString()}`,
                `INR ${revision.revisedSalary.toLocaleString()}`,
                `INR ${difference.toLocaleString()}`,
                `${revision.percentChange}%`,
                'Approved'
            ]],
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [75, 85, 99], fontSize: 8 },
            bodyStyles: { fontSize: 10 }
        });

        // Components Table
        doc.setFontSize(12);
        doc.setTextColor(31, 41, 55);
        doc.text("Earnings Components", 14, (doc as any).lastAutoTable.finalY + 15);

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 20,
            head: [['COMPONENTS', 'PREVIOUS AMOUNT', 'REVISED AMOUNT', '% CHANGE', 'DIFFERENCE']],
            body: [[
                'Basic',
                `INR ${revision.previousSalary.toLocaleString()}`,
                `INR ${revision.revisedSalary.toLocaleString()}`,
                `${revision.percentChange}%`,
                `INR ${difference.toLocaleString()}`
            ]],
            theme: 'striped',
            headStyles: { fillColor: [249, 250, 251], textColor: [107, 114, 128], fontSize: 8 },
            bodyStyles: { fontSize: 9 }
        });

        doc.save(`Salary_Revision_${revision.empId}.pdf`);
    };

    if (!revision) {
        return <div className="p-8">Loading details...</div>;
    }

    const difference = revision.revisedSalary - revision.previousSalary;

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
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-[20px] font-semibold text-[#1F2937]">Salary Revision Details</h1>
                    <Button 
                        onClick={handleDownloadReport}
                        variant="outline" 
                        className="h-[36px] px-4 py-2 border-[#3B82F6] text-[#3B82F6] text-[12px] font-medium bg-white hover:bg-blue-50 transition-all rounded-lg flex items-center gap-2"
                    >
                        <Download size={14} />
                        Download Report
                    </Button>
                </div>

                {/* Summary Table Card */}
                <div className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden mb-6 shadow-sm">
                    {/* Summary Header */}
                    <div className="h-[39px] bg-[#F0F0F0]/50 border-b border-gray-100 flex items-center px-8">
                        <div className="w-[14%] text-[10px] font-medium text-[#9CA3AF] uppercase">Previous Salary</div>
                        <div className="w-[14%] text-[10px] font-medium text-[#9CA3AF] uppercase">Revised Salary</div>
                        <div className="w-[14%] text-[10px] font-medium text-[#9CA3AF] uppercase text-center">Difference</div>
                        <div className="w-[14%] text-[10px] font-medium text-[#9CA3AF] uppercase text-center">% Change</div>
                        <div className="w-[14%] text-[10px] font-medium text-[#9CA3AF] uppercase text-center">Effective Date</div>
                        <div className="w-[14%] text-[10px] font-medium text-[#9CA3AF] uppercase text-center">Payout Month</div>
                        <div className="w-[14%] text-[10px] font-medium text-[#9CA3AF] uppercase text-right">Status</div>
                    </div>

                    {/* Summary Body */}
                    <div className="h-[60px] flex items-center px-8">
                        <div className="w-[14%] text-[12px] font-medium text-[#1F2937]">₹ {revision.previousSalary.toLocaleString()}</div>
                        <div className="w-[14%] text-[12px] font-medium text-[#1F2937]">₹ {revision.revisedSalary.toLocaleString()}</div>
                        <div className="w-[14%] text-[12px] font-medium text-[#1F2937] text-center">₹ {difference.toLocaleString()}</div>
                        <div className="w-[14%] flex items-center justify-center gap-1">
                            <div className="flex items-center gap-1 text-[#10B981] font-semibold text-[12px]">
                                <MoveUp size={12} strokeWidth={3} />
                                <span>{revision.percentChange} %</span>
                            </div>
                        </div>
                        <div className="w-[14%] text-[12px] text-[#4B5563] text-center">{revision.effectiveDate}</div>
                        <div className="w-[14%] text-[12px] text-[#4B5563] text-center">{revision.effectiveDate.split(' ')[1]} {revision.effectiveDate.split(' ')[2]}</div>
                        <div className="w-[14%] flex justify-end">
                            <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-[10px] font-semibold">
                                Approved
                            </span>
                        </div>
                    </div>
                </div>

                {/* Components Table Card */}
                <div className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm relative">
                    {/* Table Header */}
                    <div className="h-[48px] bg-gray-50/50 border-b border-gray-100 flex items-center px-16">
                        <div className="w-[30%] text-[11px] font-semibold text-[#6B7280] uppercase">COMPONENTS</div>
                        <div className="w-[17.5%] text-[11px] font-semibold text-[#6B7280] uppercase text-right">PREVIOUS AMOUNT</div>
                        <div className="w-[17.5%] text-[11px] font-semibold text-[#6B7280] uppercase text-right">REVISED AMOUNT</div>
                        <div className="w-[17.5%] text-[11px] font-semibold text-[#6B7280] uppercase text-right">% CHANGE</div>
                        <div className="w-[17.5%] text-[11px] font-semibold text-[#6B7280] uppercase text-right">DIFFERENCE</div>
                    </div>

                    {/* Table Body */}
                    <div className="flex flex-col px-16 py-8">
                        <h4 className="text-[12px] font-bold text-[#1F2937] mb-6">Earnings</h4>
                        
                        <div className="flex items-center">
                            <div className="w-[30%] text-[12px] font-medium text-[#6B7280]">Basic</div>
                            <div className="w-[17.5%] text-[12px] font-semibold text-[#1F2937] text-right">₹ {revision.previousSalary.toLocaleString()}</div>
                            <div className="w-[17.5%] text-[12px] font-semibold text-[#1F2937] text-right">₹ {revision.revisedSalary.toLocaleString()}</div>
                            <div className="w-[17.5%] text-[12px] font-medium text-[#4B5563] text-right">0 %</div>
                            <div className="w-[17.5%] text-[12px] font-semibold text-[#1F2937] text-right">₹ 0</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
