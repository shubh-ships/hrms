"use client";

import React, { useState } from "react";
import { X, ChevronDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReplaceWithNewUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    onReplace: (newUser: any) => void;
}

export default function ReplaceWithNewUserModal({ isOpen, onClose, user, onReplace }: ReplaceWithNewUserModalProps) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [contact, setContact] = useState("");
    const [department, setDepartment] = useState("");
    const [isDeptOpen, setIsDeptOpen] = useState(false);

    const departments = [
        "Development & Product",
        "Community & Programs",
        "HUMAN RESOURCE",
        "Founders Office"
    ];

    if (!isOpen) return null;

    const handleReplace = () => {
        if (!fullName || !email || !contact || !department) return;

        const newUser = {
            ...user, // Keep ID and other metadata like userType, role, etc.
            name: fullName,
            email: email,
            phone: contact,
            department: department,
            // You might want to update status or other fields if needed
        };

        onReplace(newUser);
        onClose();
    };

    const isFormValid = fullName && email && contact && department;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-[16px] shadow-2xl w-[600px] flex flex-col relative overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between p-[24px]">
                    <div>
                        <h2 className="text-[20px] font-semibold text-[#111827]">Replace with New User</h2>
                        <p className="text-[14px] text-[#6B7280] mt-1">
                            Create a new user to replace <span className="font-semibold text-[#111827]">{user?.name}</span> in their current role.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#111827] transition-colors">
                        <X className="w-[20px] h-[20px]" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="px-[24px] pb-[24px] flex flex-col gap-[20px]">
                    <div className="flex gap-[20px]">
                        {/* Full Name */}
                        <div className="flex flex-col flex-1 gap-[6px]">
                            <label className="text-[12px] font-medium text-[#374151]">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter Name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full h-[44px] border border-[#E5E7EB] rounded-lg px-[12px] text-[14px] text-[#111827] outline-none focus:border-[#3B82F6] placeholder:text-[#9CA3AF]"
                            />
                        </div>
                        {/* Email Address */}
                        <div className="flex flex-col flex-1 gap-[6px]">
                            <label className="text-[12px] font-medium text-[#374151]">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                placeholder="example@hackingly.in"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-[44px] border border-[#E5E7EB] rounded-lg px-[12px] text-[14px] text-[#111827] outline-none focus:border-[#3B82F6] placeholder:text-[#9CA3AF]"
                            />
                        </div>
                    </div>

                    {/* Contact Number */}
                    <div className="flex flex-col w-1/2 gap-[6px] pr-[10px]">
                        <label className="text-[12px] font-medium text-[#374151]">
                            Contact Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter Number"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            className="w-full h-[44px] border border-[#E5E7EB] rounded-lg px-[12px] text-[14px] text-[#111827] outline-none focus:border-[#3B82F6] placeholder:text-[#9CA3AF]"
                        />
                    </div>

                    {/* Departments */}
                    <div className="flex flex-col gap-[6px] relative">
                        <label className="text-[12px] font-medium text-[#374151]">
                            Departments <span className="text-red-500">*</span>
                        </label>
                        <div 
                            onClick={() => setIsDeptOpen(!isDeptOpen)}
                            className="w-full h-[44px] border border-[#E5E7EB] rounded-lg px-[12px] flex items-center justify-between cursor-pointer bg-white hover:border-[#3B82F6] transition-colors"
                        >
                            <span className={cn("text-[14px]", department ? "text-[#111827]" : "text-[#9CA3AF]")}>
                                {department || "Select Department"}
                            </span>
                            <ChevronDown className={cn("w-[20px] h-[20px] text-[#9CA3AF] transition-transform", isDeptOpen && "rotate-180")} />
                        </div>

                        {isDeptOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsDeptOpen(false)} />
                                <div className="absolute top-[75px] left-0 w-full bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-20 py-1 overflow-hidden">
                                    {departments.map((dept) => (
                                        <div
                                            key={dept}
                                            onClick={() => {
                                                setDepartment(dept);
                                                setIsDeptOpen(false);
                                            }}
                                            className="px-[12px] py-[10px] text-[14px] text-[#374151] hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                                        >
                                            {dept}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="bg-[#FFFBEB] border-l-4 border-[#FBBF24] p-[16px] rounded-r-lg flex items-start gap-[12px]">
                        <AlertCircle className="w-[20px] h-[20px] text-[#F59E0B] mt-0.5" />
                        <p className="text-[14px] text-[#92400E] leading-relaxed">
                            The new user will be assigned the same role (<span className="font-semibold">{user?.role}</span>) with a default password <span className="font-semibold">"12345678"</span>.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-[24px] py-[16px] border-t border-[#F3F4F6] flex justify-end gap-[12px] bg-white">
                    <button 
                        onClick={onClose}
                        className="px-[20px] h-[36px] rounded-lg border border-[#3F5A54] text-[13px] font-medium text-[#3F5A54] hover:bg-[#F9FAFB] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleReplace}
                        disabled={!isFormValid}
                        className={cn(
                            "px-[20px] h-[36px] rounded-lg text-[13px] font-medium transition-colors",
                            isFormValid 
                                ? "bg-[#3F5A54] text-white hover:bg-[#2d4540]" 
                                : "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"
                        )}
                    >
                        Replace User
                    </button>
                </div>
            </div>
        </div>
    );
}
