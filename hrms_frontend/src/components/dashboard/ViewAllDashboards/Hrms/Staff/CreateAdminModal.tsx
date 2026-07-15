"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

interface CreateAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (adminData: any) => void;
}

export default function CreateAdminModal({ isOpen, onClose, onCreate }: CreateAdminModalProps) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [contact, setContact] = useState("");
    const [password, setPassword] = useState("12345678");

    if (!isOpen) return null;

    const handleCreate = () => {
        if (!fullName || !email || !contact) return;

        const newAdmin = {
            id: Date.now(),
            name: fullName,
            email: email,
            phone: contact,
            password: password, // Send the custom password
            userType: "Admins",
            department: "All Developments",
            departmentBg: "bg-[#FEF3C7]",
            departmentText: "text-[#F59E0B]",
            role: "Admin",
            reportsTo: "N/A",
            reportsToType: "text",
            status: "Active"
        };

        onCreate(newAdmin);
        setFullName("");
        setEmail("");
        setContact("");
        setPassword("12345678"); // Reset to default
        onClose();
    };

    const isFormValid = fullName && email && contact;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[550px] flex flex-col relative overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between p-[24px] pb-[20px]">
                    <div>
                        <h2 className="text-[20px] font-bold text-[#111827]">Create New Admin</h2>
                        <p className="text-[13px] text-[#6B7280] mt-1 font-medium">Add a new admin user to your organization.</p>
                    </div>
                    <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#111827] transition-colors p-1">
                        <X className="w-[20px] h-[20px]" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="px-[24px] pb-[24px] flex flex-col gap-[24px]">
                    {/* Basic Information */}
                    <div className="flex flex-col gap-[16px]">
                        <h3 className="text-[16px] font-bold text-[#111827]">Basic Information</h3>
                        
                        {/* Full Name */}
                        <div className="flex flex-col gap-[6px]">
                            <label className="text-[12px] font-semibold text-[#4B5563]">Full Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                placeholder="Enter Name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full h-[40px] border border-[#E5E7EB] rounded-lg px-[14px] text-[14px] text-[#111827] outline-none focus:border-[#3B82F6] placeholder:text-[#9CA3AF] bg-white transition-all"
                            />
                        </div>

                        {/* Email Address */}
                        <div className="flex flex-col gap-[6px]">
                            <label className="text-[12px] font-semibold text-[#4B5563]">Email Address <span className="text-red-500">*</span></label>
                            <input
                                type="email"
                                placeholder="example@hackingly.in"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-[40px] border border-[#E5E7EB] rounded-lg px-[14px] text-[14px] text-[#111827] outline-none focus:border-[#3B82F6] placeholder:text-[#9CA3AF] bg-white transition-all"
                            />
                        </div>

                        {/* Contact Number */}
                        <div className="flex flex-col gap-[6px]">
                            <label className="text-[12px] font-semibold text-[#4B5563]">Contact Number <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                placeholder="Enter Number"
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                                className="w-full h-[40px] border border-[#E5E7EB] rounded-lg px-[14px] text-[14px] text-[#111827] outline-none focus:border-[#3B82F6] placeholder:text-[#9CA3AF] bg-white transition-all"
                            />
                        </div>
                    </div>

                    {/* Account Security */}
                    <div className="flex flex-col gap-[16px]">
                        <h3 className="text-[16px] font-bold text-[#111827]">Account Security</h3>
                        <div className="flex flex-col gap-[6px]">
                            <label className="text-[12px] font-semibold text-[#4B5563]">Password <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    type="password"
                                    placeholder="********"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-[40px] border border-[#E5E7EB] rounded-lg px-[14px] text-[14px] text-[#111827] outline-none focus:border-[#3B82F6] placeholder:text-[#9CA3AF] bg-white transition-all"
                                />
                            </div>
                            <span className="text-[11px] text-[#6B7280] font-medium italic">At least 8 characters. Leave for default.</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-[24px] py-[16px] border-t border-[#F3F4F6] flex justify-end gap-[12px] bg-white">
                    <button 
                        onClick={onClose}
                        className="px-[24px] h-[38px] rounded-lg border border-[#3F5A54] text-[14px] font-bold text-[#3F5A54] hover:bg-[#F9FAFB] transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!isFormValid}
                        className={`px-[24px] h-[38px] rounded-lg text-[14px] font-bold transition-all ${
                            isFormValid 
                                ? "bg-[#3F5A54] text-white hover:bg-[#2F443F]" 
                                : "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"
                        }`}
                    >
                        Create Admin
                    </button>
                </div>
            </div>
        </div>
    );
}
