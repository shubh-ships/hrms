"use client";

import React, { useState } from "react";
import { MoveLeft, ChevronDown, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AssignSalaryTemplate() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userId = searchParams.get("userId");

    const [template, setTemplate] = useState("Standard");
    const [staffType, setStaffType] = useState("Regular");
    const [salaryType, setSalaryType] = useState("Monthly");
    const [monthlyAmount, setMonthlyAmount] = useState<number>(0);
    const [basicAmount, setBasicAmount] = useState<number>(0);
    const [showPreview, setShowPreview] = useState(false);

    const yearlyAmount = monthlyAmount * 12;
    const specialAllowance = Math.max(0, monthlyAmount - basicAmount);

    const handleMonthlyChange = (val: string) => {
        const num = parseFloat(val) || 0;
        setMonthlyAmount(num);
        // Default split: 50% Basic
        setBasicAmount(num * 0.5);
    };

    const handleBasicChange = (val: string) => {
        const num = parseFloat(val) || 0;
        if (num <= monthlyAmount) {
            setBasicAmount(num);
        }
    };

    const handleSubmit = () => {
        console.log("Submitting salary for user:", userId);
        // Retrieve users from session storage
        const existingRaw = sessionStorage.getItem("actualStaffEntries");
        if (existingRaw) {
            const users = JSON.parse(existingRaw);
            console.log("Existing users found:", users.length);

            // Update the specific user if we have a userId
            const updatedUsers = users.map((u: any) => {
                // Check against both number and string ID
                if (u.id.toString() === userId?.toString()) {
                    console.log("Found user to update salary status:", u.name);
                    return {
                        ...u,
                        hasSalaryDetails: true,
                        salaryDetails: {
                            monthlyCTC: monthlyAmount,
                            yearlyCTC: yearlyAmount,
                            basic: basicAmount,
                            specialAllowance: specialAllowance
                        }
                    };
                }
                return u;
            });
            sessionStorage.setItem("actualStaffEntries", JSON.stringify(updatedUsers));
        }

        // Redirect to Staff Dashboard
        router.push("/dashboard/admin/hrms/staff");
    };

    const inputStyle =
        "h-[40px] w-full border border-[#E5E7EB] rounded-lg px-[12px] text-[13px] outline-none focus:border-[#E5E7EB] placeholder-[#9CA3AF] bg-white appearance-none transition-all";

    const labelStyle = "text-[12px] font-medium text-[#4B5563] mb-[6px]";

    return (
        <div className="bg-[#F8FAFC] min-h-[calc(100vh-140px)] mt-[30px] font-sans flex flex-col w-full">
            {/* HEADER */}
            <div className="mx-[40px]">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-[8px] text-[#4B5563] hover:text-[#1F2937] transition-colors"
                >
                    <MoveLeft className="w-[16px] h-[16px]" />
                    <span className="text-[14px] font-medium">Back</span>
                </button>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="mb-[40px] mt-[23px]">
                <div className="bg-white border-[1.5px] border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm p-[32px] max-w-[1128px] mx-auto min-h-[498px]">
                    <h2 className="text-[20px] font-semibold text-[#1F2937] mb-[32px]">
                        Assign Salary Template
                    </h2>

                    {/* Template Selection */}
                    <div className="mb-[24px] border-b border-[#E5E7EB] pb-[24px]">
                        <label className={labelStyle}>Template</label>
                        <div className="relative">
                            <select
                                value={template}
                                onChange={(e) => setTemplate(e.target.value)}
                                className={inputStyle}
                            >
                                <option value="">Select Template</option>
                                <option value="Standard">Standard Template</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-[20px] mb-[32px]">
                        {/* Staff Type */}
                        <div className="flex flex-col relative">
                            <label className={labelStyle}>Staff Type</label>
                            <div className="relative">
                                <select
                                    value={staffType}
                                    onChange={(e) => setStaffType(e.target.value)}
                                    className={inputStyle}
                                >
                                    <option value="Regular">Regular</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                            </div>
                        </div>

                        {/* Type */}
                        <div className="flex flex-col relative">
                            <label className={labelStyle}>Type</label>
                            <div className="relative">
                                <select
                                    value={salaryType}
                                    onChange={(e) => setSalaryType(e.target.value)}
                                    className={inputStyle}
                                >
                                    <option value="Monthly">Monthly</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                            </div>
                        </div>

                        {/* Monthly Amount */}
                        <div className="flex flex-col relative">
                            <label className={labelStyle}>Monthly Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1F2937] text-[13px]">₹</span>
                                <input
                                    type="number"
                                    value={monthlyAmount || ""}
                                    onChange={(e) => handleMonthlyChange(e.target.value)}
                                    placeholder="0"
                                    className={`${inputStyle} pl-7`}
                                />
                            </div>
                        </div>

                        {/* Yearly Amount */}
                        <div className="flex flex-col relative">
                            <label className={labelStyle}>Yearly Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1F2937] text-[13px]">₹</span>
                                <input
                                    type="text"
                                    value={yearlyAmount.toLocaleString()}
                                    readOnly
                                    className={`${inputStyle} pl-7 bg-[#F9FAFB] cursor-not-allowed`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* TABLE AREA */}
                    <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                        <div className="grid grid-cols-4 bg-[#F8FAFC] py-[12px] px-[20px] border-b border-[#E5E7EB]">
                            <span className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wider">COMPONENTS</span>
                            <span className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wider text-center">CALCULATION</span>
                            <span className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wider text-center">MONTHLY AMOUNT</span>
                            <span className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wider text-center">YEARLY AMOUNT</span>
                        </div>

                        {/* Earnings Section */}
                        <div className="bg-white">
                            <div className="px-[20px] py-[10px]">
                                <span className="text-[13px] text-[#4B5563]">Earnings</span>
                            </div>

                            {/* Basic */}
                            <div className="grid grid-cols-4 px-[20px] py-[10px] items-center">
                                <span className="text-[13px] text-[#4B5563]">Basic</span>
                                <span className="text-[13px] text-[#4B5563] text-center">Fixed Amount</span>
                                <div className="px-4">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1F2937] text-[13px]">₹</span>
                                        <input
                                            type="number"
                                            value={basicAmount || ""}
                                            onChange={(e) => handleBasicChange(e.target.value)}
                                            className="h-[36px] w-full border border-[#E5E7EB] rounded px-7 text-[13px] outline-none focus:border-[#E5E7EB]"
                                        />
                                    </div>
                                </div>
                                <span className="text-[13px] text-[#4B5563] text-center">₹ {(basicAmount * 12).toLocaleString()}</span>
                            </div>

                            {/* Special Allowance */}
                            <div className="grid grid-cols-4 px-[20px] py-[10px] items-center">
                                <span className="text-[13px] text-[#4B5563]">Special Allowance</span>
                                <span className="text-[13px] text-[#4B5563] text-center">Fixed Amount</span>
                                <div className="px-4">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1F2937] text-[13px]">₹</span>
                                        <input
                                            type="text"
                                            value={specialAllowance.toFixed(2)}
                                            readOnly
                                            className="h-[36px] w-full border border-[#E5E7EB] rounded px-7 bg-[#F9FAFB] text-[13px] outline-none"
                                        />
                                    </div>
                                </div>
                                <span className="text-[13px] text-[#4B5563] text-center">₹ {(specialAllowance * 12).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* CTC ROW */}
                        <div className="grid grid-cols-4 bg-[#F2F4F7] py-[20px] px-[20px] border-t border-[#E5E7EB]">
                            <div className="col-span-1"></div>
                            <span className="text-[16px] font-medium text-[#1F2937] text-center">CTC</span>
                            <span className="text-[16px] font-medium text-[#1F2937] text-center">₹ {monthlyAmount.toLocaleString()}</span>
                            <span className="text-[16px] font-medium text-[#1F2937] text-center">₹ {yearlyAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SPACER TO PUSH FOOTER DOWN */}
            <div className="flex-1"></div>

            {/* STICKY FOOTER */}
            <div className="sticky bottom-[-16px] z-50 bg-white border-t border-[#E5E7EB] flex justify-end px-[40px] h-[72px] items-center gap-[30px] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] -mx-4 w-[calc(100%+32px)]">
                <button
                    onClick={() => router.back()}
                    className="w-[146px] h-[37px] flex mt-[20px] items-center justify-center border border-[#3F5A54] text-[#3F5A54] rounded-lg text-[15px] font-medium hover:bg-[#F9FAFB] transition-all"
                >
                    Back
                </button>

                <button
                    onClick={() => setShowPreview(true)}
                    disabled={monthlyAmount <= 0}
                    className={`w-[146px] h-[37px] border border-[#D1D5DB] mt-[20px] items-center justify-center rounded-lg text-[15px] font-medium transition-all shadow-sm ${monthlyAmount > 0
                        ? "bg-[#3F5A54] text-white hover:bg-[#2d4540]"
                        : "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"
                        }`}
                >
                    Preview
                </button>
            </div>

            {/* PREVIEW MODAL */}
            {showPreview && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#eff6ff] w-[600px] h-[562px] rounded-[18px] p-8 shadow-2xl relative flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-[24px] font-semibold text-[#1e293b]">Salary Structure Preview</h2>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="w-[36px] h-[36px] flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                                <X size={20} className="text-[#1e293b]" />
                            </button>
                        </div>

                        <div className="bg-white rounded-3xl p-10 mb-8 shadow-sm">
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-[18px] font-bold text-[#1e293b]">Earning Components</span>
                                <span className="text-[14px] font-medium text-gray-500 uppercase">Monthly</span>
                            </div>

                            <div className="space-y-6 mb-10">
                                <div className="flex justify-between items-center text-[18px]">
                                    <span className="text-gray-600 font-medium">Basic</span>
                                    <span className="font-bold text-[#1e293b]">₹ {basicAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-[18px]">
                                    <span className="text-gray-600 font-medium">Special Allowance</span>
                                    <span className="font-bold text-[#1e293b]">₹ {specialAllowance.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="bg-[#f1f5f9] rounded-2xl p-4 flex justify-between items-center">
                                <span className="text-[18px] font-bold text-[#1e293b] tracking-wide">CTC</span>
                                <span className="text-[18px] font-bold text-[#1e293b]">₹ {monthlyAmount.toLocaleString()}</span>
                            </div>

                            <div className="border-t border-dashed border-gray-400 mt-[16px]"></div>

                            <div className="flex gap-6 mt-[26px]">
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="flex-1 h-[50px] border border-[#3B82F6] text-[#3B82F6] rounded-xl font-medium text-[16px] hover:bg-white transition-all bg-white"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 h-[50px]  bg-[#3B82F6] text-white rounded-xl font-medium text-[16px] hover:bg-[#2563EB] shadow-lg shadow-blue-200 transition-all"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>


                    </div>
                </div>
            )}
        </div>
    );
}
