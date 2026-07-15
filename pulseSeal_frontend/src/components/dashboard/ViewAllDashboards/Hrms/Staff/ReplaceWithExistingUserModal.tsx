"use client";

import React, { useState } from "react";
import { X, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReplaceWithExistingUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    allUsers: any[];
    onReplace: (targetUserId: number, replacementUser: any) => void;
}

export default function ReplaceWithExistingUserModal({ 
    isOpen, 
    onClose, 
    user, 
    allUsers,
    onReplace 
}: ReplaceWithExistingUserModalProps) {
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    if (!isOpen) return null;

    // Filter out the user being replaced and filter by search term
    const availableUsers = allUsers.filter(u => 
        u.id !== user?.id && 
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleReplace = () => {
        if (!selectedUser) return;
        onReplace(user.id, selectedUser);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-[640px] min-h-[420px] flex flex-col relative overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between p-[32px] pb-[20px]">
                    <div>
                        <h2 className="text-[22px] font-semibold text-[#111827]">Replace User</h2>
                        <p className="text-[15px] text-[#6B7280] mt-1">
                            Select a user to replace <span className="font-semibold text-[#111827]">{user?.name}</span> in their current role.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#111827] transition-colors p-2">
                        <X className="w-[22px] h-[22px]" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="px-[32px] flex-1 flex flex-col gap-[10px] pb-[40px]">
                    <label className="text-[12px] font-medium text-[#374151]">
                        Select Replacement User
                    </label>
                    <div className="relative">
                        <div 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full h-[40px] border border-[#E5E7EB] rounded-lg px-[12px] flex items-center justify-between cursor-pointer bg-white hover:border-[#3B82F6] transition-colors"
                        >
                            <span className={cn("text-[13px]", selectedUser ? "text-[#111827]" : "text-[#9CA3AF]")}>
                                {selectedUser ? `${selectedUser.name} (${selectedUser.email})` : "Choose a user"}
                            </span>
                            <ChevronDown className={cn("w-[16px] h-[16px] text-[#9CA3AF] transition-transform", isDropdownOpen && "rotate-180")} />
                        </div>

                        {isDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                <div className="absolute top-[44px] left-1/2 -translate-x-1/2 w-[440px] bg-white border border-[#E5E7EB] rounded-lg shadow-[0px_8px_32px_rgba(0,0,0,0.15)] z-20 overflow-hidden flex flex-col">
                                    {/* Search Input in Dropdown */}
                                    <div className="p-3 border-b border-[#F3F4F6]">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#9CA3AF]" />
                                            <input 
                                                autoFocus
                                                type="text"
                                                placeholder="Search users..."
                                                className="w-full h-[36px] pl-[36px] pr-[12px] text-[13px] border border-[#E5E7EB] rounded-md outline-none focus:border-[#3B82F6] bg-[#F9FAFB]"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="max-h-[180px] overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-200">
                                        {availableUsers.length > 0 ? (
                                            availableUsers.map((u) => (
                                                <div
                                                    key={u.id}
                                                    onClick={() => {
                                                        setSelectedUser(u);
                                                        setIsDropdownOpen(false);
                                                        setSearchTerm("");
                                                    }}
                                                    className="px-[16px] py-[10px] text-[13px] text-[#374151] hover:bg-[#F3F4F6] cursor-pointer transition-colors border-b border-[#F9FAFB] last:border-0"
                                                >
                                                    <span className="font-medium text-[#111827]">{u.name}</span>
                                                    <span className="text-[#6B7280] ml-2 text-[12px]">({u.email})</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-[16px] py-[24px] text-[13px] text-[#9CA3AF] text-center italic">
                                                No users found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-[32px] py-[20px] border-t border-[#F3F4F6] flex items-center justify-end gap-[12px] bg-white mt-auto">
                    <button 
                        onClick={onClose}
                        className="w-[100px] h-[36px] rounded-lg border border-[#3F5A54] text-[14px] font-medium text-[#3F5A54] hover:bg-[#F9FAFB] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleReplace}
                        disabled={!selectedUser}
                        className={cn(
                            "w-[120px] h-[36px] rounded-lg text-[14px] font-medium transition-colors",
                            selectedUser 
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
