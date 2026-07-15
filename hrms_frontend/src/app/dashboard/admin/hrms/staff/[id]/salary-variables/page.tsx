"use client"

import React, { useState } from "react";
import { 
    ArrowLeft, 
    ChevronDown, 
    ChevronUp,
    Search 
} from "lucide-react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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
    DialogClose
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchSalaryActions, addSalaryAction, deleteSalaryAction, selectSalaryActions } from "@/features/salary/salarySlice";

import Image from "next/image";
import CloudIcon from "@/assets/Dashicons/Cloud.png";

export default function SalaryVariablesPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params.id;
    const name = searchParams.get("name") || "";
    const month = searchParams.get("month") || "December 2025";
    
    const [activeTab, setActiveTab] = useState("Earnings");
    const [isActionOpen, setIsActionOpen] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState("Earnings");
    const tabs = ["Earnings", "Deductions", "Payment", "Adjustments"];

    const actionTabs = ["Earnings", "Deductions", "Payments"];
    const subTabContent: any = {
        "Earnings": ["Allowance", "Bonus"],
        "Deductions": ["Deduction"],
        "Payments": ["Add Payment", "Recover Payment"]
    };

    const [records, setRecords] = useState<any[]>([]);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [showEarningsDialog, setShowEarningsDialog] = useState(false);
    const [earningType, setEarningType] = useState<"Allowance" | "Bonus">("Allowance");
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [earningForm, setEarningForm] = useState({
        cycle: month,
        entryDate: new Date().toISOString().split('T')[0],
        amount: "",
        description: "",
        sendSMS: false
    });

    const dispatch = useAppDispatch();
    const salaryActions = useAppSelector(selectSalaryActions);

    React.useEffect(() => {
        if(id && month) {
            const dateObj = new Date(month);
            const mNum = dateObj.getMonth() + 1;
            const yNum = dateObj.getFullYear();
            dispatch(fetchSalaryActions({ employeeId: id as string, month: mNum, year: yNum }));
        }
    }, [id, month, dispatch]);

    React.useEffect(() => {
        let typeMatcher = "";
        if (activeTab === "Earnings") typeMatcher = "EARNING";
        if (activeTab === "Deductions") typeMatcher = "DEDUCTION";
        if (activeTab === "Payment" || activeTab === "Payments") typeMatcher = "PAYMENT";
        
        const filtered = (salaryActions || []).filter((v: any) => v.type === typeMatcher);
        const mappedRecords = filtered.map((v: any) => ({
            id: v._id,
            type: v.category,
            entryDate: new Date(v.entryDate || v.createdAt).toLocaleDateString('en-GB'),
            amount: `₹ ${v.amount}`,
            description: v.description || "-",
            createdAt: new Date(v.createdAt).toLocaleDateString('en-GB'),
            createdBy: "Admin",
            updatedAt: new Date(v.updatedAt).toLocaleDateString('en-GB'),
            updatedBy: "-",
            month: v.month,
            year: v.year,
            staffId: id
        }));
        setRecords(mappedRecords);
    }, [activeTab, salaryActions, id]);

    const handleDelete = async () => {
        if (itemToDelete === null) return;
        
        const deletedItem = records[itemToDelete];
        if (deletedItem.id) {
            try {
                await dispatch(deleteSalaryAction(deletedItem.id)).unwrap();
                const dateObj = new Date(month);
                dispatch(fetchSalaryActions({ employeeId: id as string, month: dateObj.getMonth() + 1, year: dateObj.getFullYear() }));
            } catch (err) {
                console.error("Failed to delete", err);
            }
        }
        setShowDeleteDialog(false);
        setItemToDelete(null);
    };

    const handleEarningSubmit = async () => {
        const amount = parseFloat(earningForm.amount) || 0;
        if (amount <= 0) return;

        const dateObj = new Date(month);
        const mNum = dateObj.getMonth() + 1;
        const yNum = dateObj.getFullYear();

        let typeMatcher = "EARNING";
        if (activeSubTab === "Deductions") typeMatcher = "DEDUCTION";
        if (activeSubTab === "Payments" || activeSubTab === "Payment") typeMatcher = "PAYMENT";

        if (editIndex !== null) {
            // Edit not supported natively via API endpoints, delete and readd
            const itemToUpdate = records[editIndex];
            if (itemToUpdate && itemToUpdate.id) {
                await dispatch(deleteSalaryAction(itemToUpdate.id)).unwrap();
            }
        }
        
        try {
            await dispatch(addSalaryAction({
                employeeId: id as string,
                type: typeMatcher,
                category: earningType,
                amount: amount,
                month: mNum,
                year: yNum,
                description: earningForm.description || "-"
            })).unwrap();

            dispatch(fetchSalaryActions({ employeeId: id as string, month: mNum, year: yNum }));
        } catch (e) {
            console.error("Failed to add action", e);
        }

        setShowEarningsDialog(false);
        setEditIndex(null);
        setEarningForm({
            cycle: month,
            entryDate: new Date().toISOString().split('T')[0],
            amount: "",
            description: "",
            sendSMS: false
        });
    };

    return (
        <div className="flex flex-col w-full h-full bg-[#FAFBFF] p-10 animate-in fade-in slide-in-from-right-4 duration-300 min-h-screen">
            <button 
                onClick={() => router.push(`/dashboard/admin/hrms/staff/${id}?tab=Salary Overview`)}
                className="flex items-center gap-2 text-[#3F5A54] hover:text-[#2c4440] transition-colors mb-6 text-[13px] font-medium w-fit"
            >
                <ArrowLeft size={16} /> Back to Salary Overview
            </button>

            <div className="flex items-center gap-3 mb-10">
                <h2 className="text-[20px] font-bold text-[#1F2937]">{name}</h2>
                <span className="text-[20px] text-gray-300">|</span>
                <span className="text-[20px] font-medium text-gray-400">{month}</span>
            </div>

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center px-1.5 bg-white border border-gray-100 rounded-2xl shadow-sm h-[52px]">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-6 py-2 text-[14px] font-medium transition-all relative h-[40px] flex items-center rounded-xl",
                                activeTab === tab 
                                    ? "text-[#1F2937] font-bold bg-[#F9FAFB]" 
                                    : "text-[#6B7280] hover:text-[#1F2937]"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <Popover open={isActionOpen} onOpenChange={setIsActionOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "h-[40px] px-6 border-[#3B82F6] text-[#3B82F6] text-[13px] font-medium rounded-xl hover:bg-blue-50 transition-all flex items-center gap-2",
                                isActionOpen && "bg-white border-[#3B82F6]"
                            )}
                        >
                            Actions {isActionOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-[300px] p-0 rounded-2xl border-gray-100 shadow-2xl overflow-hidden mt-2 bg-white">
                        <div className="flex flex-col">
                            {/* Tabs Header */}
                            <div className="flex border-b border-gray-100 px-4 pt-4">
                                {actionTabs.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveSubTab(tab)}
                                        className={cn(
                                            "px-4 py-3 text-[13px] font-medium transition-all relative",
                                            activeSubTab === tab ? "text-[#3B82F6]" : "text-[#4B5563] hover:text-[#1F2937]"
                                        )}
                                    >
                                        {tab}
                                        {activeSubTab === tab && (
                                            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#3B82F6] rounded-t-full" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="p-6 flex flex-col gap-5 min-h-[140px]">
                                {subTabContent[activeSubTab].map((item: string) => (
                                    <div 
                                        key={item} 
                                        className="text-[14px] font-medium text-[#1F2937] hover:bg-gray-50 cursor-pointer rounded-lg transition-colors p-2"
                                        onClick={() => {
                                            if (item === "Allowance" || item === "Bonus" || item === "Deduction") {
                                                setEarningType(item as any);
                                                setEditIndex(null);
                                                setShowEarningsDialog(true);
                                                setIsActionOpen(false);
                                            }
                                        }}
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>

                            {/* Footer Action */}
                            <div className="p-5 pt-0">
                                <Button
                                    className="w-full bg-[#0070F3] hover:bg-[#0060df] text-white text-[14px] font-bold h-[48px] rounded-xl shadow-md transition-all active:scale-[0.98]"
                                    onClick={() => setIsActionOpen(false)}
                                >
                                    Continue
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="border border-[#E5E7EB] rounded-[24px] overflow-hidden bg-white shadow-sm flex-1 min-h-[450px] flex flex-col">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-[#F9FAFB] border-b border-gray-50">
                            {[
                                "Action Type", "Entry Date", "Amount", "Description", 
                                "Created At", "Created by", "Last Updated At", 
                                "Last Updated By", "Actions"
                            ].map((header) => (
                                <th key={header} className="text-left py-4 px-6 text-[11px] font-bold text-[#9CA3AF] tracking-tight whitespace-nowrap">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {records.length > 0 ? (
                            records.map((item, index) => (
                                <tr key={index} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="py-4 px-6 text-[12px] font-medium text-[#1F2937]">{item.type}</td>
                                    <td className="py-4 px-6 text-[12px] text-[#1F2937]">{item.entryDate}</td>
                                    <td className="py-4 px-6 text-[12px] font-semibold text-[#1F2937]">{item.amount}</td>
                                    <td className="py-4 px-6 text-[12px] text-[#1F2937]">{item.description}</td>
                                    <td className="py-4 px-6 text-[12px] text-[#4B5563]">{item.createdAt}</td>
                                    <td className="py-4 px-6 text-[12px] text-[#4B5563]">{item.createdBy}</td>
                                    <td className="py-4 px-6 text-[12px] text-[#4B5563]">{item.updatedAt}</td>
                                    <td className="py-4 px-6 text-[12px] text-[#4B5563]">{item.updatedBy}</td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => {
                                                    const item = records[index];
                                                    setEarningType(item.type);
                                                    setEditIndex(index);
                                                    // Convert DD-MM-YY back to YYYY-MM-DD for input
                                                    const dateParts = item.entryDate.split('-');
                                                    const formattedDate = `20${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                                                    setEarningForm({
                                                        cycle: item.month,
                                                        entryDate: formattedDate,
                                                        amount: item.amount.replace('₹ ', ''),
                                                        description: item.description === "-" ? "" : item.description,
                                                        sendSMS: false
                                                    });
                                                    setShowEarningsDialog(true);
                                                }}
                                                className="p-1 hover:bg-blue-50 rounded-lg text-[#3B82F6] transition-all"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setItemToDelete(index);
                                                    setShowDeleteDialog(true);
                                                }}
                                                className="p-1 hover:bg-red-50 rounded-lg text-[#EF4444] transition-all"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : null}
                    </tbody>
                </table>
                {records.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center p-20">
                        <div className="w-[140px] h-[120px] relative mb-4 flex items-center justify-center">
                            <div className="w-24 h-24 pointer-events-none relative">
                                <Image src={CloudIcon} alt="No data" className="object-contain" fill />
                            </div>
                        </div>
                        <p className="text-[13px] font-medium text-[#9CA3AF]">No data found</p>
                    </div>
                )}
            </div>
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-[440px] p-8 rounded-3xl border-none shadow-2xl overflow-hidden bg-white">
                    <div className="flex flex-col gap-2">
                        <DialogTitle className="text-[24px] font-bold text-[#1F2937]">Delete Entry?</DialogTitle>
                        <p className="text-[16px] text-[#6B7280] font-medium mt-2">
                            Are you sure you want to delete the entry?
                        </p>
                    </div>

                    <div className="flex items-center gap-4 mt-8">
                        <DialogClose asChild>
                            <Button 
                                variant="outline" 
                                className="flex-1 h-[52px] border-[#3B82F6] text-[#3B82F6] font-bold text-[16px] rounded-xl hover:bg-blue-50 transition-all"
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button 
                            onClick={handleDelete}
                            className="flex-1 h-[52px] bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-[16px] rounded-xl shadow-lg shadow-blue-200 transition-all"
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showEarningsDialog} onOpenChange={setShowEarningsDialog}>
                <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-2xl border-none shadow-xl bg-white">
                    <div className="p-6 text-left">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-[18px] font-bold text-[#1F2937]">{earningType}</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-[12px] font-medium text-[#6B7280]">Cycle</label>
                                <div className="relative">
                                    <select
                                        value={earningForm.cycle}
                                        onChange={(e) => setEarningForm({ ...earningForm, cycle: e.target.value })}
                                        className="w-full h-[44px] bg-white border border-gray-200 rounded-xl px-4 text-[13px] text-[#1F2937] outline-none appearance-none cursor-pointer focus:border-[#3B82F6]"
                                    >
                                        <option value={month}>{month}</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[12px] font-medium text-[#6B7280]">Entry Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={earningForm.entryDate}
                                        onChange={(e) => setEarningForm({ ...earningForm, entryDate: e.target.value })}
                                        className="w-full h-[44px] bg-white border border-gray-200 rounded-xl px-4 text-[13px] text-[#1F2937] outline-none focus:border-[#3B82F6]"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[12px] font-medium text-[#6B7280]">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[13px]">₹</span>
                                    <input
                                        type="number"
                                        placeholder="Enter Amount"
                                        value={earningForm.amount}
                                        onChange={(e) => setEarningForm({ ...earningForm, amount: e.target.value })}
                                        className="w-full h-[44px] bg-white border border-gray-200 rounded-xl pl-8 pr-4 text-[13px] text-[#1F2937] outline-none focus:border-[#3B82F6]"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[12px] font-medium text-[#6B7280]">Description</label>
                                <input
                                    type="text"
                                    placeholder="Enter Description"
                                    value={earningForm.description}
                                    onChange={(e) => setEarningForm({ ...earningForm, description: e.target.value })}
                                    className="w-full h-[44px] bg-white border border-gray-200 rounded-xl px-4 text-[13px] text-[#1F2937] outline-none focus:border-[#3B82F6]"
                                />
                            </div>

                            <div className="flex items-center gap-3 py-2">
                                <input
                                    type="checkbox"
                                    id="sendSMS"
                                    checked={earningForm.sendSMS}
                                    onChange={(e) => setEarningForm({ ...earningForm, sendSMS: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-[#3B82F6] focus:ring-[#3B82F6] cursor-pointer"
                                />
                                <label htmlFor="sendSMS" className="text-[13px] font-medium text-[#1F2937] cursor-pointer">Send SMS to Staff</label>
                            </div>
                        </div>

                        <div className="mt-8">
                            <Button
                                onClick={handleEarningSubmit}
                                className="w-full h-[48px] bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl transition-all"
                            >
                                Continue
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
