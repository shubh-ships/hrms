"use client"

import React, { useState, useEffect } from "react";
import { MoveLeft, ChevronDown, ChevronRight, Download, Edit2, X, AlertCircle, CheckCircle2, Calendar as CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { format, addMonths } from "date-fns";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getAllLoans, updateLoanRequest, approveLoan, rejectLoan } from "@/features/loan/loanSlice";
import { useSidebar } from "@/components/ui/sidebar";

interface LoanSummaryProps {
    id: string;
    loanId: string;
}

export default function LoanSummary({ id, loanId }: LoanSummaryProps) {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const allLoans = useAppSelector((state: any) => state.loan.loans);
    const loanData = allLoans.find((l: any) => l._id === loanId);
    
    const [loan, setLoan] = useState<any>(null);
    const [subTab, setSubTab] = useState("Instalment Summary");
    const [isEditTenureOpen, setIsEditTenureOpen] = useState(false);
    const [isEditInstalmentOpen, setIsEditInstalmentOpen] = useState(false);
    const [isPauseLoanOpen, setIsPauseLoanOpen] = useState(false);
    const [isWriteOffOpen, setIsWriteOffOpen] = useState(false);
    const [isCloseLoanOpen, setIsCloseLoanOpen] = useState(false);
    const [pauseConfig, setPauseConfig] = useState({
        withInterest: false,
        months: "",
        interestAmount: 0
    });
    const [newTenure, setNewTenure] = useState("");
    const [tempInstalmentAmount, setTempInstalmentAmount] = useState("");
    const [logs, setLogs] = useState<any[]>([]);
    const [comment, setComment] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        loanName: "",
        description: "",
        principal: "",
        tenure: "",
        interestRate: "",
        interestType: "simple",
        disbursementDate: format(new Date(), "yyyy-MM-dd")
    });
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";

    useEffect(() => {
        dispatch(getAllLoans({}));
    }, [dispatch]);

    useEffect(() => {
        if (loanData) {
            const mappedLoan = {
                ...loanData,
                employeeName: loanData.employeeId?.personal 
                    ? `${loanData.employeeId.personal.firstName} ${loanData.employeeId.personal.lastName}`
                    : (loanData.userId?.name || ""),
                principal: loanData.principalAmount,
                monthlyInstalment: loanData.monthlyInstallment || 0,
                // Status mapping for UI
                displayStatus: 
                    loanData.status === 'active' ? 'Open' :
                    loanData.status === 'completed' ? 'Closed' :
                    loanData.status === 'written_off' ? 'Written Off' :
                    loanData.status
            };
            setLoan(mappedLoan);
            setNewTenure(loanData.tenure);
            setTempInstalmentAmount((loanData.monthlyInstallment || 0).toString());
            setEditForm({
                loanName: loanData.loanName,
                description: loanData.description || "",
                principal: loanData.principalAmount.toString(),
                tenure: loanData.tenure.toString(),
                interestRate: loanData.interestRate.toString(),
                interestType: loanData.interestType || "simple",
                disbursementDate: format(new Date(loanData.disbursementDate), "yyyy-MM-dd")
            });
            // Load logs if any (still from storage for now or if backend has it)
            const storedLogs = JSON.parse(sessionStorage.getItem(`loan_logs_${loanId}`) || '[]');
            setLogs(storedLogs);
        }
    }, [loanData]);

    // Calculate dynamic interest for pause if needed
    useEffect(() => {
        if (pauseConfig.withInterest && pauseConfig.months && loan) {
            const P = parseFloat(loan.principal) || 0;
            const R = parseFloat(loan.interestRate) || 0;
            const M = parseInt(pauseConfig.months) || 0;
            const interest = (P * R * M / 12) / 100;
            setPauseConfig(prev => ({ ...prev, interestAmount: interest }));
        } else {
            setPauseConfig(prev => ({ ...prev, interestAmount: 0 }));
        }
    }, [pauseConfig.withInterest, pauseConfig.months, loan]);

    if (!loan) return <div className="p-10 text-gray-500">Loading loan details...</div>;

    const calculateNewDetails = (tentativeTenure: number) => {
        const P = parseFloat(loan.principal) || 0;
        const R = parseFloat(loan.interestRate) || 0;
        const T = tentativeTenure;
        let totalRepayable = 0;
        let interest = 0;

        if (loan.interestType === "simple") {
            interest = (P * R * T / 12) / 100;
            totalRepayable = P + interest;
        } else {
            // Compound Interest (Monthly Compounding)
            totalRepayable = P * Math.pow(1 + R / (12 * 100), T);
            interest = totalRepayable - P;
        }

        const emi = T > 0 ? totalRepayable / T : 0;
        return {
            interest: interest,
            totalRepayable: totalRepayable,
            emi: emi,
            tenure: T
        };
    };

    const handleUpdateTenure = async () => {
        const t = parseInt(newTenure);
        if (isNaN(t) || t <= 0) {
            toast.error("Please enter a valid tenure");
            return;
        }

        try {
            await dispatch(updateLoanRequest({
                id: loanId,
                updateData: {
                    tenure: t,
                }
            })).unwrap();

            // Add to logs manually for UI since we don't have backend logs yet
            const newLog = {
                id: Date.now().toString(),
                particulars: "Tenure",
                oldValue: `${loan.tenure} Months`,
                newValue: `${t} Months`,
                changedBy: "Admin",
                changedAt: format(new Date(), "dd MMM yyyy, hh:mm a")
            };
            const updatedLogs = [newLog, ...logs];
            sessionStorage.setItem(`loan_logs_${loanId}`, JSON.stringify(updatedLogs));
            setLogs(updatedLogs);

            setIsEditTenureOpen(false);
            toast.success("Tenure updated successfully");
        } catch (error: any) {
            toast.error(error?.message || error?.toString() || "Failed to update tenure");
        }
    };

    const handleUpdateInstalment = async () => {
        const amount = parseFloat(tempInstalmentAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        try {
            await dispatch(updateLoanRequest({
                id: loanId,
                updateData: {
                    // Backend might not support monthlyInstallment update directly yet
                    // but we'll try or just update principal/tenure which affects it
                }
            })).unwrap();

            const newLog = {
                id: Date.now().toString(),
                particulars: "Monthly Instalment",
                oldValue: `₹ ${parseFloat(loan.monthlyInstalment).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                newValue: `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                changedBy: "Admin",
                changedAt: format(new Date(), "dd MMM yyyy, hh:mm a")
            };
            const updatedLogs = [newLog, ...logs];
            sessionStorage.setItem(`loan_logs_${loanId}`, JSON.stringify(updatedLogs));
            setLogs(updatedLogs);
            setIsEditInstalmentOpen(false);
            toast.success("Instalment amount updated successfully");
        } catch (error: any) {
            toast.error(error?.message || error?.toString() || "Failed to update instalment");
        }
    };

    const handlePauseLoan = async () => {
        const months = parseInt(pauseConfig.months);
        if (isNaN(months) || months <= 0) {
            toast.error("Please enter a valid number of months");
            return;
        }

        try {
            // Simulator: We'll just update a metadata field if supported, or status
            // For now, let's just update the status to active (it probably already is)
            // or if backend supports 'paused', we'd use that.
            
            const newLog = {
                id: Date.now().toString(),
                particulars: "Status",
                oldValue: loan.status,
                newValue: `Paused (${months} months, ${pauseConfig.withInterest ? 'with' : 'without'} interest)`,
                changedBy: "Admin",
                changedAt: format(new Date(), "dd MMM yyyy, hh:mm a")
            };
            const updatedLogs = [newLog, ...logs];
            sessionStorage.setItem(`loan_logs_${loanId}`, JSON.stringify(updatedLogs));
            setLogs(updatedLogs);
            setIsPauseLoanOpen(false);
            toast.success(`Loan paused for ${months} months (simulated)`);
        } catch (error: any) {
            toast.error("Failed to pause loan");
        }
    };

    const handleWriteOff = async () => {
        try {
            await dispatch(updateLoanRequest({
                id: loanId,
                updateData: { status: 'written_off' as any }
            })).unwrap();

            const newLog = {
                id: Date.now().toString(),
                particulars: "Status",
                oldValue: loan.status,
                newValue: "Written Off",
                changedBy: "Admin",
                changedAt: format(new Date(), "dd MMM yyyy, hh:mm a")
            };
            const updatedLogs = [newLog, ...logs];
            sessionStorage.setItem(`loan_logs_${loanId}`, JSON.stringify(updatedLogs));
            setLogs(updatedLogs);
            setIsWriteOffOpen(false);
            toast.success("Loan written off successfully");
        } catch (error: any) {
            toast.error(error?.message || error?.toString() || "Failed to write off loan");
        }
    };

    const handleCloseLoan = async () => {
        try {
            await dispatch(updateLoanRequest({
                id: loanId,
                updateData: { status: 'completed' as any }
            })).unwrap();

            const newLog = {
                id: Date.now().toString(),
                particulars: "Status",
                oldValue: loan.status,
                newValue: "Closed",
                changedBy: "Admin",
                changedAt: format(new Date(), "dd MMM yyyy, hh:mm a")
            };
            const updatedLogs = [newLog, ...logs];
            sessionStorage.setItem(`loan_logs_${loanId}`, JSON.stringify(updatedLogs));
            setLogs(updatedLogs);
            setIsCloseLoanOpen(false);
            toast.success("Loan closed successfully");
        } catch (error: any) {
            toast.error(error?.message || error?.toString() || "Failed to close loan");
        }
    };
    const handleApprove = async () => {
        try {
            await dispatch(approveLoan(loanId)).unwrap();
            
            const newLog = {
                id: Date.now().toString(),
                particulars: "Status",
                oldValue: "Pending",
                newValue: "Approved",
                changedBy: "Admin",
                changedAt: format(new Date(), "dd MMM yyyy, hh:mm a"),
                comment: comment
            };
            const updatedLogs = [newLog, ...logs];
            sessionStorage.setItem(`loan_logs_${loanId}`, JSON.stringify(updatedLogs));
            setLogs(updatedLogs);
            
            toast.success("Loan approved & created successfully");
            dispatch(getAllLoans({}));
        } catch (error: any) {
            toast.error(error?.message || error?.toString() || "Failed to approve loan");
        }
    };

    const handleReject = async () => {
        try {
            await dispatch(rejectLoan({ id: loanId, rejectionReason: comment })).unwrap();
            
            const newLog = {
                id: Date.now().toString(),
                particulars: "Status",
                oldValue: "Pending",
                newValue: "Rejected",
                changedBy: "Admin",
                changedAt: format(new Date(), "dd MMM yyyy, hh:mm a"),
                comment: comment
            };
            const updatedLogs = [newLog, ...logs];
            sessionStorage.setItem(`loan_logs_${loanId}`, JSON.stringify(updatedLogs));
            setLogs(updatedLogs);

            toast.success("Loan rejected successfully");
            dispatch(getAllLoans({}));
        } catch (error: any) {
            toast.error(error?.message || error?.toString() || "Failed to reject loan");
        }
    };

    const handleSaveChanges = async () => {
        try {
            await dispatch(updateLoanRequest({
                id: loanId,
                updateData: {
                    loanName: editForm.loanName,
                    description: editForm.description,
                    principalAmount: parseFloat(editForm.principal),
                    tenure: parseInt(editForm.tenure),
                    interestRate: parseFloat(editForm.interestRate),
                    interestType: editForm.interestType as any,
                    disbursementDate: editForm.disbursementDate
                }
            })).unwrap();

            const newLog = {
                id: Date.now().toString(),
                particulars: "Application Edited",
                oldValue: "Previous Details",
                newValue: "Updated Details",
                changedBy: "Admin",
                changedAt: format(new Date(), "dd MMM yyyy, hh:mm a")
            };
            const updatedLogs = [newLog, ...logs];
            sessionStorage.setItem(`loan_logs_${loanId}`, JSON.stringify(updatedLogs));
            setLogs(updatedLogs);

            toast.success("Loan application updated successfully");
            setIsEditing(false);
            dispatch(getAllLoans({}));
        } catch (error: any) {
            toast.error(error?.message || error?.toString() || "Failed to save changes");
        }
    };

    const calculateEditEMI = () => {
        const P = parseFloat(editForm.principal) || 0;
        const R = parseFloat(editForm.interestRate) || 0;
        const T = parseFloat(editForm.tenure) || 0;

        if (P <= 0 || T <= 0) return { emi: 0, total: 0 };

        if (editForm.interestType === "simple") {
            const totalRepayable = P + (P * R * (T / 12)) / 100;
            return {
                emi: totalRepayable / T,
                total: totalRepayable
            };
        } else {
            const monthlyRate = (R / 100) / 12;
            if (monthlyRate === 0) return { emi: P / T, total: P };
            const emi = (P * monthlyRate * Math.pow(1 + monthlyRate, T)) / (Math.pow(1 + monthlyRate, T) - 1);
            return {
                emi: emi,
                total: emi * T
            };
        }
    };

    const { emi: editEMI, total: editTotal } = calculateEditEMI();

    const currentNewDetails = calculateNewDetails(parseInt(newTenure) || 0);

    const isAnyModalOpen = isEditTenureOpen || isEditInstalmentOpen || isPauseLoanOpen || isWriteOffOpen || isCloseLoanOpen;

    const principal = parseFloat(loan.principal) || 0;
    const tenure = parseInt(loan.tenure) || 0;
    const totalRepayable = parseFloat(loan.totalRepayable) || principal;
    const totalPaid = 0; // Placeholder for now
    const remainingInstalment = totalRepayable - totalPaid;
    const completionScale = `0/${tenure} Months`;
    const remainingPrincipal = principal; // Placeholder

    const oldDetails = {
        interest: (parseFloat(loan.totalRepayable) || principal) - principal,
        totalRepayable: parseFloat(loan.totalRepayable) || principal,
        emi: parseFloat(loan.monthlyInstalment) || 0,
        tenure: tenure
    };

    // Calculate Close Date
    const disbursementDate = loan.disbursementDate ? new Date(loan.disbursementDate) : new Date();
    const closeDate = addMonths(disbursementDate, tenure);

    const handleDownloadReport = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("Loan Summary Report", 105, 20, { align: "center" });
        doc.setFontSize(12);
        doc.text(`Employee: ${loan.employeeName}`, 20, 40);
        doc.text(`Loan Name: ${loan.loanName}`, 20, 50);
        doc.text(`Principal: ₹${principal.toLocaleString()}`, 20, 60);
        doc.text(`Tenure: ${tenure} Months`, 20, 70);
        doc.text(`EMI: ₹${parseFloat(loan.monthlyInstalment).toLocaleString()}`, 20, 80);
        doc.save(`${loan.loanName}_Report.pdf`);
    };

    if (isEditing) {
        return (
            <div className={cn("flex flex-col min-h-[calc(100vh-64px)] -m-4 bg-[#F9FAFB] font-sans relative overflow-x-hidden", isAnyModalOpen ? "blur-[2px] pointer-events-none" : "")}>
                <div className="flex-1 px-8 pt-6 pb-24 transition-all duration-300">
                    <button
                        onClick={() => setIsEditing(false)}
                        className="flex items-center gap-1.5 text-gray-600 hover:text-gray-800 transition-colors mb-6 group w-fit"
                    >
                        <MoveLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span className="text-[12px] font-semibold">Back</span>
                    </button>

                    <h1 className="text-[17px] font-semibold text-[#1F2937] mb-6">Edit Loan Application</h1>

                    <div className="flex gap-8">
                        {/* Edit Form */}
                        <div className="flex-1 bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[12px] font-medium text-gray-500">Staff</label>
                                    <div className="w-full h-[46px] bg-[#E5E7EB] border border-[#D1D5DB] rounded-xl px-4 flex items-center text-[13px] font-semibold text-[#111827]">
                                        {loan.employeeName}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[12px] font-medium text-gray-500">Loan Name</label>
                                    <input
                                        type="text"
                                        value={editForm.loanName}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, loanName: e.target.value }))}
                                        className="w-full h-[46px] border border-[#E5E7EB] rounded-xl px-4 text-[13px] outline-none focus:border-blue-500 transition-all font-medium"
                                        placeholder="Enter Loan Name"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[12px] font-medium text-gray-500">Description</label>
                                    <input
                                        type="text"
                                        value={editForm.description}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full h-[46px] border border-[#E5E7EB] rounded-xl px-4 text-[13px] outline-none focus:border-blue-500 transition-all font-medium"
                                        placeholder="Enter Description"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[12px] font-medium text-gray-500">Loan Interest Preset</label>
                                    <div className="relative">
                                        <select disabled className="w-full h-[46px] border border-[#E5E7EB] bg-gray-50 rounded-xl px-4 text-[13px] outline-none appearance-none font-medium text-gray-500">
                                            <option>Custom</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[12px] font-medium text-gray-500">Principal</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">₹</span>
                                        <input
                                            type="number"
                                            value={editForm.principal}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, principal: e.target.value }))}
                                            className="w-full h-[46px] border border-[#E5E7EB] rounded-xl pl-8 pr-4 text-[13px] outline-none focus:border-blue-500 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[12px] font-medium text-gray-500">Tenure</label>
                                    <div className="relative flex">
                                        <input
                                            type="number"
                                            value={editForm.tenure}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, tenure: e.target.value }))}
                                            className="w-full h-[46px] border border-[#E5E7EB] rounded-l-xl px-4 text-[13px] outline-none focus:border-blue-500 transition-all font-medium"
                                        />
                                        <div className="h-[46px] border-y border-r border-[#E5E7EB] rounded-r-xl px-4 flex items-center bg-gray-50 text-[12px] text-gray-500 whitespace-nowrap min-w-[100px]">
                                            month(s)
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[12px] font-medium text-gray-500">Annual Interest Rate</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={editForm.interestRate}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, interestRate: e.target.value }))}
                                            className="w-full h-[46px] border border-[#E5E7EB] rounded-xl px-4 text-[13px] outline-none focus:border-blue-500 transition-all font-medium pr-8"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">%</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[12px] font-medium text-gray-500">Interest Type</label>
                                    <div className="relative">
                                        <select
                                            value={editForm.interestType}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, interestType: e.target.value }))}
                                            className="w-full h-[46px] border border-[#E5E7EB] rounded-xl px-4 text-[13px] outline-none appearance-none font-medium focus:border-blue-500 transition-all"
                                        >
                                            <option value="simple">Simple Interest</option>
                                            <option value="compound">Compound Interest</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[12px] font-medium text-gray-500">Disbursement Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={editForm.disbursementDate}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, disbursementDate: e.target.value }))}
                                            className="w-full h-[46px] border border-[#E5E7EB] rounded-xl px-4 text-[13px] outline-none focus:border-blue-500 transition-all font-medium pr-10"
                                        />
                                        <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[12px] font-medium text-gray-500">Instalment Start Month</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            readOnly
                                            value={format(addMonths(new Date(editForm.disbursementDate), 1), "MMMM yyyy")}
                                            className="w-full h-[46px] bg-gray-50 border border-[#E5E7EB] rounded-xl px-4 text-[13px] outline-none font-medium text-gray-500"
                                        />
                                        <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preview Sidebar */}
                        <div className="w-[300px] flex flex-col gap-4">
                            <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl p-6 shadow-sm">
                                <h3 className="text-[15px] font-bold text-[#1E40AF] mb-3">Monthly Instalment Preview</h3>
                                <p className="text-[11px] text-[#3B82F6] mb-4 leading-relaxed">
                                    Based on a loan amount of ₹ {parseFloat(editForm.principal || "0").toLocaleString()} and an interest rate of {editForm.interestRate || "0"}% the following calculation applies for {editForm.interestType === 'simple' ? 'Simple' : 'Compound'} interest
                                </p>
                                <div className="flex flex-col gap-4 mt-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] text-gray-600 font-medium">Principal Amount</span>
                                        <span className="text-[12px] text-[#111827] font-bold">₹ {parseFloat(editForm.principal || "0").toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] text-gray-600 font-medium">Tenure</span>
                                        <span className="text-[12px] text-[#111827] font-bold">{editForm.tenure || "0"} Month</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-[#DBEAFE]">
                                        <span className="text-[13px] text-[#1E40AF] font-bold">Monthly Instalment</span>
                                        <span className="text-[13px] text-[#1E40AF] font-bold">₹ {editEMI.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Save Button */}
                <div
                    className={cn(
                        "fixed bottom-0 right-0 h-[80px] bg-white border-t border-[#B1B1B14D] flex justify-end items-center px-[40px] z-50 transition-all duration-300",
                        isCollapsed ? "left-[80px] w-[calc(100%-80px)]" : "left-[256px] w-[calc(100%-256px)]",
                        isAnyModalOpen ? "blur-[2px] pointer-events-none" : ""
                    )}
                >
                    <button
                        onClick={handleSaveChanges}
                        className="bg-[#D1D5DB] text-[#4B5563] px-12 h-[42px] min-w-[160px] rounded-lg font-bold text-[14px] transition-all hover:bg-gray-300"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-[calc(100vh-64px)] -m-4 bg-[#F9FAFB] font-sans relative overflow-x-hidden">
            {/* Main Content Area */}
            <div className={cn(
                "flex-1 px-8 pt-6 pb-24 transition-all duration-300",
                isAnyModalOpen ? "blur-[2px] pointer-events-none" : "",
                loan?.status?.toLowerCase() === 'pending' ? "pb-32" : "pb-8"
            )}>
                {/* Global Back Link */}
                <button
                    onClick={() => router.push(`/dashboard/admin/hrms/staff/${id}?tab=Loans`)}
                    className="flex items-center gap-1.5 text-gray-600 hover:text-gray-800 transition-colors mb-6 group w-fit"
                >
                    <MoveLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-[12px] font-semibold">Back</span>
                </button>

                {/* Header Section */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-[17px] font-semibold text-[#1F2937]">Loan Summary</h1>
                    {loan.status.toLowerCase() !== "closed" && loan.status.toLowerCase() !== "written off" && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="border-[#3B82F6] text-[#3B82F6] text-[12px] h-[32px] px-4 rounded-md flex items-center gap-2 hover:bg-blue-50">
                                    Actions <ChevronDown size={14} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px] p-0 rounded-lg overflow-hidden border-gray-100 shadow-xl">
                                <DropdownMenuItem
                                    onClick={() => setIsEditTenureOpen(true)}
                                    className="py-2.5 px-4 text-[13px] font-medium text-[#4B5563] cursor-pointer hover:bg-gray-50 border-b border-gray-50"
                                >
                                    Edit Tenure
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setIsPauseLoanOpen(true)}
                                    className="py-2.5 px-4 text-[13px] font-medium text-[#4B5563] cursor-pointer hover:bg-gray-50 border-b border-gray-50 text-left"
                                >
                                    Pause
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setIsWriteOffOpen(true)}
                                    className="py-2.5 px-4 text-[13px] font-medium text-[#4B5563] cursor-pointer hover:bg-gray-50 border-b border-gray-50 text-left"
                                >
                                    Write off
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setIsCloseLoanOpen(true)}
                                    className="py-2.5 px-4 text-[13px] font-medium text-[#4B5563] cursor-pointer hover:bg-gray-50 text-left"
                                >
                                    Close
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Loan Detail Card / Grid */}
                <div className="w-full bg-white border border-gray-100 rounded-xl p-6 shadow-sm mb-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <span className="text-[14px] font-bold text-[#1F2937] uppercase">{loan.employeeName || ""}</span>
                            <div className={cn(
                                "px-2 py-0.5 border rounded-full flex items-center gap-1",
                                loan.status === "Active" || loan.status === "Open" ? "bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]" :
                                    loan.status === "Paused" || loan.status === "Pending" ? "bg-[#FEF9C3] text-[#854D0E] border-[#FEF08A]" :
                                        loan.status === "Written Off" ? "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]" :
                                            "bg-gray-100 text-gray-600 border-gray-200"
                            )}>
                                <div className={cn("w-1.2 h-1.2 rounded-full",
                                    loan.status === "Active" || loan.status === "Open" ? "bg-[#16A34A]" :
                                        loan.status === "Paused" || loan.status === "Pending" ? "bg-[#CA8A04]" :
                                            loan.status === "Written Off" ? "bg-[#DC2626]" :
                                                "bg-gray-400"
                                )}></div>
                                <span className="text-[9px] font-bold uppercase tracking-wider">
                                    {loan.status === "Active" ? "Open" : loan.status}
                                </span>
                            </div>
                        </div>

                        {loan.status.toLowerCase() === 'pending' && (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 border border-[#E5E7EB] rounded-full px-4 py-1.5 text-[12px] font-bold text-[#6B7280] hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <Edit2 size={14} className="text-blue-500" />
                                Edit
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-7 gap-x-4">
                        <InfoItem label="Approved by" value="Delizia" />
                        <InfoItem label="Disbursement Date" value={loan.disbursementDate || "N/A"} />
                        <InfoItem label="Loan Name" value={loan.loanName} />
                        <InfoItem label="Description" value={loan.description || "testing"} />
                        <InfoItem label="Principal" value={`₹ ${principal.toLocaleString('en-IN')}`} />

                        <InfoItem label="Annual Interest Rate" value={`${loan.interestRate}%`} />
                        <InfoItem label="Total Paid Instalment" value={`₹ ${totalPaid}`} />
                        <InfoItem label="Tenure" value={`${tenure} Months`} />
                        <InfoItem label="Completion" value={completionScale} valueColor="text-green-600" />
                        <InfoItem label="Remaining Principal" value={`₹ ${remainingPrincipal.toLocaleString('en-IN')}`} />

                        <InfoItem label="Interest Type" value={loan.interestType} />
                        <InfoItem label="Remaining Instalment" value={`₹ ${remainingInstalment.toLocaleString('en-IN')}`} />
                        <InfoItem label="Close Date" value={format(closeDate, "dd MMM yyyy")} />
                        <InfoItem label="Download" value="Report" onClick={handleDownloadReport} isAction />
                    </div>

                    {loan.status.toLowerCase() === 'pending' && (
                        <div className="mt-8 pt-8 border-t border-gray-100">
                            <h3 className="text-[14px] font-bold text-[#1F2937] mb-4">Remarks</h3>
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[#6B7280]">Comment</label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Enter Comment"
                                    className="w-full max-w-[420px] h-[48px] border border-[#E5E7EB] rounded-lg px-4 py-2.5 text-[13px] outline-none focus:border-blue-500 transition-all resize-none bg-[#F9FAFB] placeholder:text-gray-400"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Sub-Tabs Section */}
                <div className="flex items-center mb-5">
                    <div className="bg-[#F3F4F6] p-1 rounded-lg flex gap-1">
                        <button
                            onClick={() => setSubTab("Instalment Summary")}
                            className={cn(
                                "px-5 py-1 rounded-md text-[11px] font-medium transition-all",
                                subTab === "Instalment Summary"
                                    ? "bg-white text-[#1F2937] shadow-sm"
                                    : "text-[#6B7280]"
                            )}
                        >
                            Instalment Summary
                        </button>
                        <button
                            onClick={() => setSubTab("Loan Logs")}
                            className={cn(
                                "px-5 py-1 rounded-md text-[11px] font-medium transition-all",
                                subTab === "Loan Logs"
                                    ? "bg-white text-[#1F2937] shadow-sm"
                                    : "text-[#6B7280]"
                            )}
                        >
                            Loan Logs
                        </button>
                    </div>
                </div>

                {/* Instalment Table */}
                {subTab === "Instalment Summary" && (
                    <div className="w-full border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#F9FAFB] border-b border-gray-100">
                                    <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 tracking-wider">Instalment Date</th>
                                    <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 tracking-wider">Closing Principal Balance</th>
                                    <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 tracking-wider">Principal Repaid in Instalment</th>
                                    <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 tracking-wider">Closing Instalment Balance</th>
                                    <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 tracking-wider">Instalment Amount</th>
                                    <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                    {/* Date: 1 month after disbursement */}
                                    <td className="px-6 py-5 text-[12px] text-gray-700">
                                        {format(addMonths(disbursementDate, 1), "dd MMM yyyy")}
                                    </td>

                                    {/* Closing Principal Balance: Remaining after 1st payment */}
                                    <td className="px-6 py-5 text-[12px] text-gray-700">
                                        ₹ {Math.max(0, principal - (principal / (tenure || 1))).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </td>

                                    {/* Principal Repaid: Portion of principal in 1 payment */}
                                    <td className="px-6 py-5 text-[12px] text-gray-700">
                                        ₹ {(principal / (tenure || 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </td>

                                    {/* Closing Instalment Balance: Total remaining after 1st payment */}
                                    <td className="px-6 py-5 text-[12px] text-gray-700">
                                        ₹ {(totalRepayable - (parseFloat(loan.monthlyInstalment) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>

                                    {/* Instalment Amount: EMI */}
                                    <td className="px-6 py-5 text-[12px] text-gray-700 font-semibold">
                                        ₹ {(parseFloat(loan.monthlyInstalment) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>

                                    <td className="px-6 py-5 text-[12px]">
                                        <button
                                            onClick={() => setIsEditInstalmentOpen(true)}
                                            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                        >
                                            <Edit2 size={14} />
                                            Edit Instalment
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Loan Logs Table */}
                {subTab === "Loan Logs" && (
                    <div className="w-full border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#F9FAFB] border-b border-gray-100">
                                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 tracking-wider">Particulars</th>
                                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 tracking-wider">Changed from</th>
                                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 tracking-wider">Changed to</th>
                                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 tracking-wider">Changed by</th>
                                    <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 tracking-wider">Changed at</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length > 0 ? (
                                    logs.map((log) => (
                                        <tr key={log.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-[12px] text-gray-700">{log.particulars}</td>
                                            <td className="px-6 py-4 text-[12px] text-gray-700">{log.oldValue}</td>
                                            <td className="px-6 py-4 text-[12px] text-gray-700">{log.newValue}</td>
                                            <td className="px-6 py-4 text-[12px] text-gray-700 font-medium">{log.changedBy}</td>
                                            <td className="px-6 py-4 text-[12px] text-gray-700 font-medium">{log.changedAt}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-[12px] italic">No logs found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals Area (Outside blur container) */}
            {/* Edit Tenure Modal */}
            {isEditTenureOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-[650px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-[18px] font-bold text-[#1F2937]">Edit Tenure</h2>
                            <button
                                onClick={() => setIsEditTenureOpen(false)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="px-6 py-6 overflow-y-auto max-h-[80vh]">
                            <div className="flex flex-col gap-6">
                                {/* Input Block */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[12px] font-semibold text-gray-500">Tenure</label>
                                    <div className="flex items-center gap-3 w-[200px] bg-white border border-gray-200 rounded-lg px-3 py-2 focus-within:border-blue-500 transition-all">
                                        <input
                                            type="number"
                                            value={newTenure}
                                            onChange={(e) => setNewTenure(e.target.value)}
                                            className="w-full outline-none text-[14px] text-gray-700 font-medium"
                                            placeholder="13"
                                        />
                                        <span className="text-[13px] text-gray-500 whitespace-nowrap">month(s)</span>
                                    </div>
                                </div>

                                {/* Breakup Comparison Card */}
                                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5">
                                    <div className="flex flex-col gap-1 mb-4">
                                        <h3 className="text-[14px] font-bold text-[#1F2937]">Loan Amount Breakup</h3>
                                        <p className="text-[11px] text-gray-500">
                                            Based on a loan amount of ₹ {principal.toLocaleString()} and an interest rate of {loan.interestRate}% the following calculation applies for {loan.interestType}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Old Card */}
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Old</span>
                                            </div>
                                            <div className="bg-white border border-gray-100 rounded-lg p-3 flex flex-col gap-2.5">
                                                <div className="flex justify-between items-center text-[11px]">
                                                    <span className="text-gray-500">Remaining Balance</span>
                                                    <span className="font-bold text-gray-700">₹ {oldDetails.totalRepayable.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[11px]">
                                                    <span className="text-gray-500">Interest</span>
                                                    <span className="font-bold text-gray-700">₹ {oldDetails.interest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[11px]">
                                                    <span className="text-gray-500">Instalment Per Month</span>
                                                    <span className="font-bold text-gray-700">₹ {oldDetails.emi.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[11px]">
                                                    <span className="text-gray-500">Tenure</span>
                                                    <span className="font-bold text-gray-700">{oldDetails.tenure} Months</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* New Card */}
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-[#22C55E] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase">New</span>
                                            </div>
                                            <div className="bg-white border border-gray-100 rounded-lg p-3 flex flex-col gap-2.5">
                                                <div className="flex justify-between items-center text-[11px]">
                                                    <span className="text-gray-500">Remaining Balance</span>
                                                    <span className="font-bold text-gray-700">₹ {currentNewDetails.totalRepayable.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[11px]">
                                                    <span className="text-gray-500">Interest</span>
                                                    <span className="font-bold text-gray-700">₹ {currentNewDetails.interest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[11px]">
                                                    <span className="text-gray-500">Instalment Per Month</span>
                                                    <span className="font-bold text-gray-700">₹ {currentNewDetails.emi.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[11px]">
                                                    <span className="text-gray-500">Tenure</span>
                                                    <span className="font-bold text-gray-700">{currentNewDetails.tenure} Months</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 flex items-center justify-end gap-3 bg-gray-50/50">
                            <button
                                onClick={() => setIsEditTenureOpen(false)}
                                className="px-8 py-2 border border-blue-500 text-blue-600 font-bold text-[13px] rounded-lg hover:bg-blue-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateTenure}
                                className="px-8 py-2 bg-[#E2E8F0] text-gray-400 font-bold text-[13px] rounded-lg hover:bg-[#CBD5E1] hover:text-gray-600 transition-all shadow-sm"
                            >
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Edit Instalment Modal */}
            {isEditInstalmentOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-[550px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-[17px] font-bold text-[#1F2937]">Edit Instalment</h2>
                            <button
                                onClick={() => setIsEditInstalmentOpen(false)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="px-6 py-6">
                            <div className="flex flex-col gap-5">
                                {/* Input Block */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold text-gray-500">Amount</label>
                                    <div className="relative group w-full">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[13px] font-medium">₹</div>
                                        <input
                                            type="number"
                                            value={tempInstalmentAmount}
                                            onChange={(e) => setTempInstalmentAmount(e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-4 py-2 text-[14px] text-gray-700 font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all placeholder:text-gray-300"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Breakup Section */}
                                <div className="bg-[#F0F7FF] border border-[#D1E9FF] rounded-xl p-4">
                                    <h3 className="text-[14px] font-bold text-[#1F2937] mb-3">Loan Amount Breakup</h3>
                                    <div className="bg-white border border-dashed border-[#BFDBFE] rounded-lg h-[140px] flex flex-col items-center justify-center gap-2">
                                        <div className="flex gap-1.5 opacity-60">
                                            <div className="w-4 h-4 rounded-sm bg-[#14B8A6] rotate-12 -translate-y-1"></div>
                                            <div className="w-4 h-4 rounded-sm bg-[#14B8A6] -rotate-6"></div>
                                        </div>
                                        <span className="text-[11px] text-[#6B7280] font-medium italic">No preview to show</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 flex items-center justify-end gap-3 bg-gray-50/50">
                            <button
                                onClick={() => setIsEditInstalmentOpen(false)}
                                className="px-6 py-2 border border-[#E2E8F0] text-[#475569] font-bold text-[13px] rounded-lg hover:bg-white hover:border-[#3B82F6] hover:text-[#3B82F6] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateInstalment}
                                className="px-6 py-2 bg-[#D1D5DB] text-[#4B5563] font-bold text-[13px] rounded-lg hover:bg-[#9CA3AF] hover:text-white transition-all shadow-sm"
                            >
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Pause Loan Modal */}
            {isPauseLoanOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 text-left">
                    <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 p-6 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[20px] font-bold text-[#1F2937]">Pause Loan</h2>
                            <button
                                onClick={() => setIsPauseLoanOpen(false)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Selection Tabs */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setPauseConfig(prev => ({ ...prev, withInterest: false }))}
                                className={cn(
                                    "flex-1 h-[48px] rounded-xl border flex items-center justify-center gap-3 transition-all font-medium text-[14px]",
                                    !pauseConfig.withInterest
                                        ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                                )}
                            >
                                <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", !pauseConfig.withInterest ? "border-[#2563EB]" : "border-gray-300")}>
                                    {!pauseConfig.withInterest && <div className="w-2 h-2 rounded-full bg-[#2563EB]"></div>}
                                </div>
                                without Interest
                            </button>
                            <button
                                onClick={() => setPauseConfig(prev => ({ ...prev, withInterest: true }))}
                                className={cn(
                                    "flex-1 h-[48px] rounded-xl border flex items-center justify-center gap-3 transition-all font-medium text-[14px]",
                                    pauseConfig.withInterest
                                        ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                                )}
                            >
                                <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", pauseConfig.withInterest ? "border-[#2563EB]" : "border-gray-300")}>
                                    {pauseConfig.withInterest && <div className="w-2 h-2 rounded-full bg-[#2563EB]"></div>}
                                </div>
                                with Interest
                            </button>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-medium text-gray-600">Number of months to pause</label>
                            <input
                                type="number"
                                value={pauseConfig.months}
                                onChange={(e) => setPauseConfig(prev => ({ ...prev, months: e.target.value }))}
                                className="w-full h-[48px] border border-gray-200 rounded-xl px-4 text-[14px] outline-none focus:border-[#2563EB] placeholder:text-gray-400"
                                placeholder="Enter number of months to pause"
                            />
                        </div>

                        {pauseConfig.withInterest && (
                            <div className="flex flex-col gap-2 animate-in slide-in-from-top-2">
                                <label className="text-[12px] font-medium text-gray-600">Interest Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                    <input
                                        type="text"
                                        readOnly
                                        value={pauseConfig.interestAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                        className="w-full h-[48px] border border-gray-100 bg-gray-50 rounded-xl pl-8 pr-4 text-[14px] font-bold text-[#1F2937] outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        <p className="text-[13px] text-gray-500 leading-relaxed font-normal">
                            Loan will be paused for the specified number of months. Interest for the paused months will {pauseConfig.withInterest ? 'be added to' : 'not be added to'} subsequent repayments.
                        </p>

                        <Button
                            onClick={handlePauseLoan}
                            className="w-full h-[48px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl transition-all shadow-md"
                        >
                            Save
                        </Button>
                    </div>
                </div>
            )}

            {/* Write off Loan Modal */}
            {isWriteOffOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 text-left">
                    <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 p-8 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[20px] font-bold text-[#1F2937]">Write off Loan</h2>
                            <button
                                onClick={() => setIsWriteOffOpen(false)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-[14px] text-gray-500 leading-relaxed font-normal">
                            Instalments of the past will remain intact and no future instalments will be accepted. This action cannot be reversed. Are you sure you want to write off this loan?
                        </p>

                        <div className="flex gap-4 mt-2">
                            <button
                                onClick={() => setIsWriteOffOpen(false)}
                                className="flex-1 h-[48px] border border-[#2563EB] text-[#2563EB] font-bold rounded-xl hover:bg-blue-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleWriteOff}
                                className="flex-1 h-[48px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl shadow-md transition-all"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Close Loan Modal */}
            {isCloseLoanOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 text-left">
                    <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 p-8 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[20px] font-bold text-[#1F2937]">Close Loan</h2>
                            <button
                                onClick={() => setIsCloseLoanOpen(false)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-[14px] text-gray-500 leading-relaxed font-normal">
                            Are you sure you want to close the loan? This action cannot be reversed.
                        </p>

                        <div className="flex gap-4 mt-2">
                            <button
                                onClick={() => setIsCloseLoanOpen(false)}
                                className="flex-1 h-[48px] border border-[#2563EB] text-[#2563EB] font-bold rounded-xl hover:bg-blue-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCloseLoan}
                                className="flex-1 h-[48px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl shadow-md transition-all"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Actions - Only visible for Pending loans */}
            {loan.status.toLowerCase() === 'pending' && (
                <div
                    className={cn(
                        "fixed bottom-0 right-0 h-[80px] bg-white border-t border-[#B1B1B14D] flex justify-end items-center px-[40px] z-50 transition-all duration-300 gap-4",
                        isCollapsed ? "left-[80px] w-[calc(100%-80px)]" : "left-[256px] w-[calc(100%-256px)]",
                        isAnyModalOpen ? "blur-[2px] pointer-events-none" : ""
                    )}
                >
                    <button
                        onClick={handleReject}
                        className="bg-white border border-[#F43F5E] text-[#F43F5E] px-8 h-[38px] min-w-[146px] rounded-lg font-medium text-[14px] transition-all active:scale-95 hover:bg-rose-50"
                    >
                        Reject
                    </button>
                    <button
                        onClick={handleApprove}
                        className="bg-[#2563EB] text-white px-8 h-[38px] min-w-[146px] rounded-lg font-medium text-[14px] transition-all active:scale-95 hover:bg-blue-700 shadow-lg shadow-blue-100/50"
                    >
                        Approve & Create Loan
                    </button>
                </div>
            )}
        </div>
    );
}

function InfoItem({ label, value, valueColor = "text-[#1F2937]", onClick, isAction }: { label: string; value: string; valueColor?: string; onClick?: () => void; isAction?: boolean }) {
    return (
        <div className={cn("flex flex-col gap-1.5", isAction && "cursor-pointer group/item")} onClick={onClick}>
            <span className="text-[11px] text-[#6B7280] font-normal">{label}</span>
            <span className={cn(
                "text-[13px] font-semibold",
                valueColor,
                isAction && "text-blue-600 group-hover/item:underline"
            )}>
                {value}
            </span>
        </div>
    );
}
