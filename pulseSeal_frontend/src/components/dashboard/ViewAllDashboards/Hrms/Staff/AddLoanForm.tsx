"use client"

import React, { useState, useEffect } from "react";
import { MoveLeft, ChevronDown, Calendar as CalendarIcon, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CloudIcon from "@/assets/Dashicons/Cloud.png";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createLoanRequest, approveLoan, disburseLoan } from "@/features/loan/loanSlice";
import { fetchEmployees, selectEmployees } from "@/features/employee/employeeSlice";

interface AddLoanFormProps {
    id: string;
}

export default function AddLoanForm({ id }: AddLoanFormProps) {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const employees = useAppSelector(selectEmployees);

    const [form, setForm] = useState({
        employeeName: "",
        loanName: "",
        description: "",
        staffType: "Custom",
        principal: "",
        tenure: "",
        interestRate: "",
        interestType: "simple",
        disbursementDate: format(new Date(), "yyyy-MM-dd")
    });

    useEffect(() => {
        if (employees.length === 0) {
            dispatch(fetchEmployees({ status: "active", limit: 1000 }));
        }
    }, [dispatch, employees.length]);

    useEffect(() => {
        if (employees.length > 0) {
            const staff = employees.find((u: any) => u.id?.toString() === id || u._id?.toString() === id);
            if (staff && !form.employeeName) {
                const fullName = staff.name || `${staff.personal?.firstName || ""} ${staff.personal?.lastName || ""}`.trim();
                setForm(prev => ({ ...prev, employeeName: fullName }));
            }
        }
    }, [id, employees, form.employeeName]);

    const handleInputChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const calculateEMI = () => {
        const P = parseFloat(form.principal) || 0;
        const R = parseFloat(form.interestRate) || 0;
        const T = parseFloat(form.tenure) || 0;

        if (P <= 0 || T <= 0) return { emi: 0, total: 0 };

        if (form.interestType === "simple") {
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

    const { emi: monthlyInstalment, total: totalRepayable } = calculateEMI();

    const handleCreateLoan = async () => {
        if (!form.loanName || !form.principal || !form.tenure || !form.interestRate) {
            toast.error("Please fill required fields");
            return;
        }

        try {
            const loanData = {
                employeeId: id,
                loanName: form.loanName,
                description: form.description,
                principalAmount: parseFloat(form.principal),
                disbursementDate: form.disbursementDate,
                repaymentStartMonth: format(new Date(), "yyyy-MM-01"),
                interestRate: parseFloat(form.interestRate),
                interestType: form.interestType as "simple" | "compound",
                tenure: parseInt(form.tenure),
            };

            const response = await dispatch(createLoanRequest(loanData)).unwrap();
            
            if (response && response._id) {
                // Automated activation for admin-created loans
                // On this backend, approveLoan already performs disbursement
                await dispatch(approveLoan(response._id)).unwrap();
            }

            toast.success("Loan created and activated successfully");
            router.push(`/dashboard/admin/hrms/staff/${id}?tab=Loans`);
        } catch (error: any) {
            toast.error(error?.message || error?.toString() || "Failed to create loan");
        }
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-64px)] -m-4 bg-[#F9FAFB] font-sans relative overflow-x-hidden">
            {/* Main Content Area */}
            <div className="flex-1 px-10 pt-10 pb-10">
                {/* Header / Back */}
                <button
                    onClick={() => router.push(`/dashboard/admin/hrms/staff/${id}?tab=Loans`)}
                    className="flex items-center gap-2 text-[#4B5563] hover:text-[#1F2937] transition-colors mb-6 w-fit"
                >
                    <MoveLeft size={16} />
                    <span className="text-[12px] font-medium">Back</span>
                </button>

                <h1 className="text-[20px] font-semibold text-[#1F2937] mb-8">Add Loan</h1>

                <div className="flex flex-col lg:flex-row gap-[60px] items-start w-full">

                    {/* Left Side: Form Container */}
                    <div className="w-full lg:w-[880px] h-auto min-h-[284px] bg-white border border-gray-100 rounded-xl p-[24px] shadow-sm flex items-center shrink-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10 w-full">
                            {/* Row 1 */}
                            <FormInput 
                                label="Staff" 
                                value={form.employeeName} 
                                onChange={() => {}} 
                                placeholder="Employee Name" 
                                readOnly
                            />
                            <FormInput 
                                label="Loan Name" 
                                value={form.loanName} 
                                onChange={(v: string) => handleInputChange("loanName", v)} 
                                placeholder="Enter Loan Name" 
                            />
                            <FormInput 
                                label="Description" 
                                value={form.description} 
                                onChange={(v: string) => handleInputChange("description", v)} 
                                placeholder="Enter Description" 
                            />

                            {/* Row 2 */}
                            <FormInput 
                                label="Staff" 
                                value={form.staffType} 
                                onChange={(v: string) => handleInputChange("staffType", v)} 
                                options={["Custom", "Standard"]} 
                                placeholder="Select Option" 
                                isSelect 
                            />
                            <FormInput 
                                label="Principal" 
                                value={form.principal} 
                                onChange={(v: string) => handleInputChange("principal", v)} 
                                placeholder="Enter Principal" 
                                prefix="₹" 
                            />
                            <FormInput 
                                label="Tenure" 
                                value={form.tenure} 
                                onChange={(v: string) => handleInputChange("tenure", v)} 
                                placeholder="Enter Tenure" 
                                suffix="month(s)" 
                            />

                            {/* Row 3 */}
                            <FormInput 
                                label="Annual Interest Rate" 
                                value={form.interestRate} 
                                onChange={(v: string) => handleInputChange("interestRate", v)} 
                                placeholder="Enter Annual Interest Rate" 
                                suffix="%" 
                            />
                            <FormInput 
                                label="Interest Type" 
                                value={form.interestType} 
                                onChange={(v: string) => handleInputChange("interestType", v)} 
                                options={["simple", "compound"]} 
                                placeholder="Select Interest Type" 
                                isSelect 
                            />
                            <FormInput 
                                label="Disbursement Date" 
                                value={form.disbursementDate} 
                                onChange={(v: string) => handleInputChange("disbursementDate", v)} 
                                isDate 
                                placeholder="Enter PF Joining Date" 
                            />
                        </div>
                    </div>

                    {/* Right Side: Preview Card - Fixed Size 411x258 */}
                    <div className="w-[411px] h-[258px] bg-[#F1F2FF] border border-[#E0E7FF] rounded-xl p-5 shadow-sm flex flex-col shrink-0 overflow-hidden">
                        <h3 className="text-[16px] font-semibold text-[#1F2937] mb-3">Monthly Instalment Preview</h3>
                        
                        {(!form.principal || !form.tenure || !form.interestRate) ? (
                            /* Blank State */
                            <div className="flex-1 border border-dashed border-[#D1D5DB] rounded-lg flex flex-col items-center justify-center bg-white/40">
                                <Image
                                    src={CloudIcon}
                                    alt="No preview"
                                    width={50}
                                    height={50}
                                    className="object-contain opacity-90 mb-2"
                                />
                                <p className="text-[#9CA3AF] text-[7px] font-bold uppercase tracking-wider">No preview to show</p>
                            </div>
                        ) : (
                            /* Data State */
                            <div className="flex flex-col flex-1">
                                <p className="text-[11px] text-[#4B5563] mb-4 leading-normal">
                                    Based on a loan amount of <span className="font-semibold text-[#1F2937]">₹ {parseFloat(form.principal).toLocaleString('en-IN')}</span> and an interest rate of <span className="font-semibold text-[#1F2937]">{form.interestRate}%</span> the following calculation applies for <span className="font-semibold text-[#1F2937]">{form.interestType}</span>
                                </p>
                                
                                <div className="bg-white rounded-lg border border-[#E5E7EB] p-4 flex flex-col gap-3.5 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] text-[#6B7280]">Principal Amount</span>
                                        <span className="text-[11px] font-semibold text-[#1F2937]">₹ {parseFloat(form.principal).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] text-[#6B7280]">Tenure</span>
                                        <span className="text-[11px] font-semibold text-[#1F2937]">{form.tenure} Months</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                        <span className="text-[12px] font-semibold text-[#1F2937]">Monthly Instalment</span>
                                        <span className="text-[12px] font-bold text-[#1F2937]">₹ {monthlyInstalment.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="sticky bottom-0 w-full h-[72px] bg-white border-t border-[#E5E7EB] px-10 flex items-center justify-end z-20">
                <Button
                    className="bg-[#3F5A54] hover:bg-[#2d4540] text-white h-[37px] px-8 rounded-lg text-[14px] font-medium transition-all"
                    onClick={handleCreateLoan}
                >
                    Create Loan
                </Button>
            </div>
        </div>
    );
}

function FormInput({ label, value, onChange, placeholder, options = [], isSelect = false, isDate = false, prefix, suffix, readOnly = false }: any) {
    return (
        <div className="flex flex-col gap-1.5 w-[245px]">
            <label className="text-[7px] font-bold text-[#6B7280] uppercase tracking-tight ml-1">
                {label}
            </label>
            <div className={cn(
                "h-[36px] border border-gray-200 rounded-lg flex items-center px-3 transition-all relative",
                readOnly ? "bg-gray-100/50 cursor-default" : "bg-white focus-within:border-[#3F5A54]"
            )}>
                {prefix && <span className="text-[10px] text-[#9CA3AF] mr-2">{prefix}</span>}

                {isSelect && !readOnly ? (
                    <div className="flex-1 flex items-center justify-between cursor-pointer relative">
                        <select
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-full h-full bg-transparent text-[10px] font-medium text-[#1F2937] outline-none appearance-none cursor-pointer"
                        >
                            <option value="" disabled>{placeholder}</option>
                            {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <ChevronDown size={14} className="text-[#9CA3AF] pointer-events-none absolute right-0" />
                    </div>
                ) : isDate && !readOnly ? (
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="flex-1 h-full flex items-center justify-between outline-none">
                                <span className={cn(
                                    "text-[10px] font-medium",
                                    value ? "text-[#1F2937]" : "text-[#9CA3AF]"
                                )}>
                                    {value ? (format(new Date(value), "dd MMM yyyy")) : placeholder}
                                </span>
                                <CalendarIcon size={14} className="text-[#9CA3AF]" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <CalendarUI
                                mode="single"
                                selected={value ? new Date(value) : undefined}
                                onSelect={(date) => onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                ) : (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        readOnly={readOnly}
                        className={cn(
                            "w-full text-[10px] font-medium text-[#1F2937] outline-none placeholder:text-[#9CA3AF] bg-transparent",
                            readOnly && "cursor-default select-none"
                        )}
                    />
                )}

                {suffix && <span className="text-[8px] text-[#9CA3AF] ml-2 font-medium">{suffix}</span>}
            </div>
        </div>
    );
}


