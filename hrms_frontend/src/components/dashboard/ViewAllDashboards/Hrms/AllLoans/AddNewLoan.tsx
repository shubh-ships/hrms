"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowLeft, Plus, ChevronDown, Calendar as CalendarIcon, Search, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchEmployees, selectEmployees } from "@/features/employee/employeeSlice";
import { getLoanPresets } from "@/features/loanInterestPreset/loanPresetSlice";
import { createLoanRequest, approveLoan, disburseLoan } from "@/features/loan/loanSlice";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useSidebar } from "@/components/ui/sidebar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface AddNewLoanProps {
    onBack: () => void;
}

const calculateEMI = (principal: number, annualRate: number, tenure: number, interestType: string) => {
    if (!principal || !annualRate || !tenure || !interestType) return 0;
    const monthlyRate = annualRate / 12 / 100;

    if (interestType === "simple") {
        const totalInterest = principal * monthlyRate * tenure;
        return (principal + totalInterest) / tenure;
    } else {
        // Compound / EMI formula
        return (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
            (Math.pow(1 + monthlyRate, tenure) - 1);
    }
};

export default function AddNewLoan({ onBack }: AddNewLoanProps) {
    const dispatch = useAppDispatch();
    const employees = useAppSelector(selectEmployees);
    const { presets } = useAppSelector((state: any) => state.loanPreset);

    const [formData, setFormData] = useState({
        staffId: "",
        loanName: "",
        description: "",
        interestPreset: "custom",
        principal: "",
        tenure: "",
        interestRate: "",
        interestType: "", // Changed to empty for placeholder
        disbursementDate: format(new Date(), "yyyy-MM-dd"),
        installmentMonth: format(new Date(), "yyyy-MM-01"),
    });

    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";

    useEffect(() => {
        dispatch(fetchEmployees({}));
        dispatch(getLoanPresets(undefined));
    }, [dispatch]);

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePresetChange = (presetId: string) => {
        if (presetId === "custom") {
            setFormData(prev => ({ ...prev, interestPreset: "custom" }));
            return;
        }
        const preset = presets.find((p: any) => p._id === presetId);
        if (preset) {
            setFormData(prev => ({
                ...prev,
                interestPreset: presetId,
                interestRate: preset.interestRate.toString(),
                interestType: preset.interestType,
            }));
        }
    };

    const emi = calculateEMI(
        parseFloat(formData.principal),
        parseFloat(formData.interestRate),
        parseInt(formData.tenure),
        formData.interestType
    );

    const handleSubmit = async () => {
        if (!formData.staffId || !formData.loanName || !formData.principal || !formData.tenure) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            const loanData = {
                employeeId: formData.staffId, // Use the selected staffID
                loanName: formData.loanName,
                description: formData.description,
                principalAmount: parseFloat(formData.principal),
                disbursementDate: formData.disbursementDate,
                repaymentStartMonth: formData.installmentMonth,
                interestPreset: formData.interestPreset !== "custom" ? formData.interestPreset : undefined,
                interestRate: parseFloat(formData.interestRate),
                interestType: formData.interestType as "simple" | "compound",
                tenure: parseInt(formData.tenure),
            };

            const response = await dispatch(createLoanRequest(loanData)).unwrap();
            
            // Re-fetch all loans to ensure we have the latest
            if (response && response._id) {
                // Automated activation for admin-created loans to match "Open" status
                // On this server configuration, approveLoan already performs disbursement
                await dispatch(approveLoan(response._id)).unwrap();
            }

            toast.success("Loan created and activated successfully");
            onBack();
        } catch (error: any) {
            toast.error(error?.message || error?.toString() || "Failed to create loan");
        }
    };

    return (
        <div className="flex flex-col w-full h-full bg-[#F9FAFB] font-sans overflow-hidden">
            {/* Header */}
            <div className="flex flex-col px-[40px] pt-[30px] pb-4 gap-6 shrink-0 bg-[#F9FAFB] z-10">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-[#4B5563] hover:text-[#1F2937] transition-colors w-fit"
                >
                    <ArrowLeft size={18} />
                    <span className="text-[14px] font-medium">Back</span>
                </button>

                <h1 className="text-[20px] font-semibold text-[#1F2937]">New Loan</h1>
            </div>

            {/* Main Content */}
            <div className="flex gap-8 px-[40px] mt-4 flex-1 overflow-y-auto pb-[20px]">
                {/* Left: Form Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex-1 max-w-[830px] h-fit">
                    <div className="grid grid-cols-3 gap-x-6 gap-y-6">
                        {/* Staff */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-regular text-[#6B7280]">Staff</label>
                            <div className="relative">
                                <select
                                    value={formData.staffId}
                                    onChange={(e) => handleInputChange("staffId", e.target.value)}
                                    className="w-full h-[36px] border border-gray-200 rounded-lg px-4 text-[10px] outline-none appearance-none bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all text-[#9CA3AF] shadow-none"
                                >
                                    <option value="" disabled>Select Staff</option>
                                    {employees.map((emp) => (
                                        <option key={emp._id} value={emp._id}>
                                            {emp.personal?.firstName || emp.name || "Unknown"} {emp.personal?.lastName || ""}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                            </div>
                        </div>

                        {/* Loan Name */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[7px] font-medium text-[#6B7280]">Loan Name</label>
                            <input
                                type="text"
                                placeholder="Enter Loan Name"
                                value={formData.loanName}
                                onChange={(e) => handleInputChange("loanName", e.target.value)}
                                className="h-[36px] w-full border border-gray-200 rounded-lg px-4 text-[10px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all placeholder:text-[#9CA3AF]"
                            />
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[7px] font-medium text-[#6B7280]">Description</label>
                            <input
                                type="text"
                                placeholder="Enter Description"
                                value={formData.description}
                                onChange={(e) => handleInputChange("description", e.target.value)}
                                className="h-[36px] w-full border border-gray-200 rounded-lg px-4 text-[10px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all placeholder:text-[#9CA3AF]"
                            />
                        </div>

                        {/* Loan Interest Preset */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[7px] font-regular text-[#6B7280]">Loan Interest Preset</label>
                            <div className="relative">
                                <select
                                    value={formData.interestPreset}
                                    onChange={(e) => handlePresetChange(e.target.value)}
                                    className="w-full h-[36px] border border-gray-200 rounded-lg px-4 text-[10px] outline-none appearance-none bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all text-[#1F2937] shadow-none"
                                >
                                    <option value="custom">Custom</option>
                                    {presets.map((preset: any) => (
                                        <option key={preset._id} value={preset._id}>
                                            {preset.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                            </div>
                        </div>

                        {/* Principal */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[7px] font-regular text-[#6B7280]">Principal</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1F2937] text-[10px]">₹</span>
                                <input
                                    type="number"
                                    placeholder="Enter Principal"
                                    value={formData.principal}
                                    onChange={(e) => handleInputChange("principal", e.target.value)}
                                    className="w-full h-[36px] border border-gray-200 rounded-lg pl-8 pr-4 text-[10px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all placeholder:text-[#9CA3AF] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                        </div>

                        {/* Tenure */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[7px] font-regular text-[#6B7280]">Tenure</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Enter Tenure"
                                    value={formData.tenure}
                                    onChange={(e) => handleInputChange("tenure", e.target.value)}
                                    className="w-full h-[36px] border border-gray-200 rounded-lg px-4 text-[10px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all placeholder:text-[#9CA3AF] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4B5563] text-[10px]">month(s)</span>
                            </div>
                        </div>

                        {/* Annual Interest Rate */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[7px] font-regular text-[#6B7280]">Annual Interest Rate</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Enter Annual Interest Rate"
                                    value={formData.interestRate}
                                    onChange={(e) => handleInputChange("interestRate", e.target.value)}
                                    className="w-full h-[36px] border border-gray-200 rounded-lg px-4 text-[10px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all placeholder:text-[#9CA3AF] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-[14px]">%</span>
                            </div>
                        </div>

                        {/* Interest Type */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[7px] font-regular text-[#6B7280]">Interest Type</label>
                            <div className="relative">
                                <Select
                                    value={formData.interestType}
                                    onValueChange={(value) => handleInputChange("interestType", value)}
                                >
                                    <SelectTrigger className="w-full h-[36px] border border-gray-200 rounded-lg px-4 text-[10px] outline-none focus:ring-0 focus:ring-offset-0 focus:border-blue-400 bg-white text-[#9CA3AF] shadow-none">
                                        <div className="flex justify-between items-center w-full">
                                            <SelectValue placeholder="Select Interest Type" className="placeholder:text-[#9CA3AF] " />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="border-gray-100 shadow-xl rounded-xl">
                                        <SelectItem value="simple">Simple Interest</SelectItem>
                                        <SelectItem value="compound">Compound Interest</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Disbursement Date */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[7px] font-regular text-[#6B7280]">Disbursement Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full h-[36px] justify-between text-left font-normal border-gray-200 rounded-lg px-4 text-[10px] shadow-none hover:bg-white active:scale-100",
                                            !formData.disbursementDate && "text-[#9CA3AF]"
                                        )}
                                    >
                                        <span className={cn(formData.disbursementDate ? "text-[#1F2937]" : "text-[#9CA3AF]")}>
                                            {formData.disbursementDate ? format(new Date(formData.disbursementDate), "dd MMM yyyy") : "Pick a date"}
                                        </span>
                                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 border-gray-100 shadow-2xl rounded-2xl overflow-hidden" align="start">
                                    <CalendarComponent
                                        mode="single"
                                        selected={new Date(formData.disbursementDate)}
                                        onSelect={(date) => {
                                            if (date) {
                                                handleInputChange("disbursementDate", format(date, "yyyy-MM-dd"));
                                            }
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Instalment Start Month */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[7px] font-regular text-[#6B7280]">Instalment Start Month</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full h-[36px] justify-between text-left font-normal border-gray-200 rounded-lg px-4 text-[10px] shadow-none hover:bg-white active:scale-100",
                                            !formData.installmentMonth && "text-[#9CA3AF]"
                                        )}
                                    >
                                        <span className={cn(formData.installmentMonth ? "text-[#1F2937]" : "text-[#9CA3AF]")}>
                                            {formData.installmentMonth ? format(new Date(formData.installmentMonth), "MMMM yyyy") : "Pick a month"}
                                        </span>
                                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[280px] p-4 flex flex-col gap-4 border-gray-100 shadow-2xl rounded-2xl overflow-hidden" align="start">
                                    <div className="flex flex-col gap-2 h-[200px] overflow-y-auto pr-2">
                                        {Array.from({ length: 24 }).map((_, i) => {
                                            const d = new Date();
                                            d.setMonth(d.getMonth() + i);
                                            d.setDate(1);
                                            const monthStr = format(d, "yyyy-MM-dd");
                                            return (
                                                <Button
                                                    key={monthStr}
                                                    variant="ghost"
                                                    className={cn(
                                                        "justify-start text-[10px] h-8 rounded-md transition-all",
                                                        formData.installmentMonth === monthStr
                                                            ? "bg-[#F1F2FF] text-blue-600 font-medium"
                                                            : "text-gray-600 hover:bg-gray-50"
                                                    )}
                                                    onClick={() => handleInputChange("installmentMonth", monthStr)}
                                                >
                                                    {format(d, "MMMM yyyy")}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>

                {/* Right: Preview Card */}
                <div className="flex flex-col gap-6 w-[400px]">
                    <div className="bg-[#F1F2FF] rounded-xl p-8 flex flex-col gap-6 shadow-sm min-h-[250px] relative">
                        <h3 className="text-[16px] font-medium text-[#1F2937]">Monthly Instalment Preview</h3>

                        {emi > 0 ? (
                            <div className="flex flex-col gap-6 mt-4">
                                <div className="flex justify-between items-center text-[14px]">
                                    <span className="text-gray-500">Principal Amount</span>
                                    <span className="font-bold text-[#1F2937]">₹ {parseFloat(formData.principal).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-[14px]">
                                    <span className="text-gray-500">Tenure</span>
                                    <span className="font-bold text-[#1F2937]">{formData.tenure} Month</span>
                                </div>
                                <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                                    <span className="text-[16px] font-bold text-[#1F2937]">Monthly Instalment</span>
                                    <span className="text-[16px] font-bold text-[#1F2937]">₹ {Math.round(emi).toLocaleString()}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center flex-1 py-8 opacity-90 bg-white/40 border border-dashed border-[#3F5A54] rounded-xl">
                                <Image src="/assets/dashicons/cloud.png" alt="preview" width={85} height={85} />
                                <p className="text-[9px] text-gray-500 mt-2">No preview to show</p>
                            </div>
                        )}

                        {emi > 0 && (
                            <p className="text-[11px] text-gray-400 mt-4">
                                Based on a loan amount of ₹ {formData.principal} and an interest rate of {formData.interestRate}% the following calculation applies for {formData.interestType} interest
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div
                className={cn(
                    "fixed bottom-0 right-0 h-[80px] bg-white border-t border-[#B1B1B14D] flex justify-end items-center px-[40px] z-50 transition-all duration-300",
                    isCollapsed ? "left-[80px] w-[calc(100%-80px)]" : "left-[256px] w-[calc(100%-256px)]"
                )}
            >
                <button
                    onClick={handleSubmit}
                    className="bg-[#3F5A54] hover:bg-[#2c4440] text-white px-8 h-[37px] w-[146px] rounded-lg font-medium text-[14px] transition-all active:scale-95 shadow-lg shadow-gray-200"
                >
                    Create Loan
                </button>
            </div>
        </div>
    );
}
