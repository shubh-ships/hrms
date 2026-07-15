"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface StaffLeaveData {
    id: string;
    name: string;
    staffType: string;
    encashableLeaves: number;
    encashCount: number;
    perDayCompensation: number;
}

export default function BulkEncashLeave() {
    const router = useRouter();
    const [staffData, setStaffData] = useState<StaffLeaveData[]>([]);

    useEffect(() => {
        // Mock data fetch, combining staff from session storage to mimic real environment
        const storedUsers = sessionStorage.getItem("actualStaffEntries");
        let initialData: StaffLeaveData[] = [];
        if (storedUsers) {
            try {
                const parsed = JSON.parse(storedUsers);
                initialData = parsed.map((user: any, index: number) => ({
                    id: user.id.toString(),
                    name: user.name,
                    staffType: user.staffType || (index % 2 === 0 ? "Regular" : "Contractual (monthly)"),
                    encashableLeaves: 0, // Mock leave available 
                    encashCount: 0,
                    perDayCompensation: index % 2 === 0 ? 709.68 : 0.03, // Mock values matching the image
                }));
            } catch (error) {
                console.error("Failed to parse localized staff data", error);
            }
        } else {
            // Fallback for demonstration
            initialData = [
                { id: "1", name: "CHIRAG", staffType: "Contractual (monthly)", encashableLeaves: 0, encashCount: 0, perDayCompensation: 0.03 },
                { id: "2", name: "Gopal Modak", staffType: "Regular", encashableLeaves: 0, encashCount: 0, perDayCompensation: 709.68 },
            ];
        }
        setStaffData(initialData);
    }, []);

    const groupedStaff = useMemo(() => {
        const groups: Record<string, StaffLeaveData[]> = {};
        staffData.forEach((staff) => {
            if (!groups[staff.staffType]) {
                groups[staff.staffType] = [];
            }
            groups[staff.staffType].push(staff);
        });
        return groups;
    }, [staffData]);

    const handleEncashCountChange = (id: string, value: string) => {
        const count = parseFloat(value) || 0;
        setStaffData((prev) =>
            prev.map((staff) =>
                staff.id === id ? { ...staff, encashCount: count } : staff
            )
        );
    };

    const handleCompChange = (id: string, value: string) => {
        const comp = parseFloat(value) || 0;
        setStaffData((prev) =>
            prev.map((staff) =>
                staff.id === id ? { ...staff, perDayCompensation: comp } : staff
            )
        );
    };

    const totalEncashAmount = useMemo(() => {
        return staffData.reduce(
            (total, staff) => total + staff.encashCount * staff.perDayCompensation,
            0
        );
    }, [staffData]);

    return (
        <div className="bg-[#F8FAFC] min-h-[calc(100vh-60px)] flex flex-col font-sans relative">
            {/* Header Section */}
            <div className="px-[40px] pt-[24px]">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-[8px] text-[#4B5563] hover:text-[#1F2937] transition-colors mb-[20px] w-fit"
                >
                    <ArrowLeft className="w-[16px] h-[16px]" />
                    <span className="text-[12px] font-medium">Back</span>
                </button>

                <div>
                    <h1 className="text-[20px] font-semibold text-[#1F2937] leading-tight">
                        Encash Unused Leave
                    </h1>
                    <p className="text-[12px] text-[#6B7280] font-normal mt-[4px]">
                        Encashed leave amount would be added to Staff's Salary
                    </p>
                </div>
            </div>

            {/* Main Content (Table) */}
            <div className="px-[40px] mt-[32px]">
                <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-sm">
                    {/* Table Headers */}
                    <div className="grid grid-cols-12 items-center bg-[#F8FAFC] px-[24px] py-[12px] border-b border-[#E5E7EB]">
                        <div className="col-span-3 text-[10px] font-medium text-[#4B5563] tracking-wider">
                            Staff Name
                        </div>
                        <div className="col-span-3 text-[10px] font-medium text-[#4B5563] tracking-wider">
                            Encashable Leaves
                        </div>
                        <div className="col-span-2 text-[10px] font-medium text-[#4B5563] tracking-wider">
                            Encash Count
                        </div>
                        <div className="col-span-2 text-[10px] font-medium text-[#4B5563] tracking-wider pl-[20px]">
                            Per Day Compensation
                        </div>
                        <div className="col-span-2 text-[10px] font-medium text-[#4B5563] tracking-wider text-right">
                            Total Compensation
                        </div>
                    </div>

                    {/* Grouped Data */}
                    <div className="flex flex-col">
                        {Object.entries(groupedStaff).map(([groupName, items]) => (
                            <React.Fragment key={groupName}>
                                {/* Group Header Row */}
                                <div className="bg-[#F0F4FA] px-[24px] py-[12px] border-b border-[#E5E7EB]">
                                    <span className="text-[13px] font-bold text-[#4B5563]">
                                        {groupName}
                                    </span>
                                </div>

                                {/* Items Rows */}
                                {items.map((staff, index) => {
                                    const isLastItem = index === items.length - 1;
                                    const totalComp = (staff.encashCount * staff.perDayCompensation).toFixed(2);
                                    
                                    return (
                                        <div
                                            key={staff.id}
                                            className={`grid grid-cols-12 items-center px-[24px] py-[16px] hover:bg-[#F9FAFB] transition-colors ${
                                                !isLastItem ? "border-b border-[#E5E7EB]" : ""
                                            }`}
                                        >
                                            {/* Staff Name */}
                                            <div className="col-span-3 text-[14px] font-medium text-[#4B5563] truncate pr-[10px] uppercase">
                                                {staff.name}
                                            </div>

                                            {/* Encashable Leaves */}
                                            <div className="col-span-3 flex items-center gap-[6px]">
                                                <span className="text-[13px] font-medium text-[#4B5563]">
                                                    {staff.encashableLeaves} Left
                                                </span>
                                                <Info className="w-[14px] h-[14px] text-[#9CA3AF] cursor-pointer" />
                                            </div>

                                            {/* Encash Count */}
                                            <div className="col-span-2 pr-[20px]">
                                                <input
                                                    type="number"
                                                    value={staff.encashCount}
                                                    onChange={(e) => handleEncashCountChange(staff.id, e.target.value)}
                                                    className="w-full h-[38px] px-[16px] border border-[#E5E7EB] rounded-[8px] text-[13px] font-medium text-[#4B5563] bg-[#F9FAFB] focus:bg-white outline-none focus:border-[#3B82F6] transition-all"
                                                />
                                            </div>

                                            {/* Per Day Compensation */}
                                            <div className="col-span-2 pl-[20px] pr-[50px]">
                                                <input
                                                    type="number"
                                                    value={staff.perDayCompensation}
                                                    onChange={(e) => handleCompChange(staff.id, e.target.value)}
                                                    className="w-full h-[38px] px-[16px] border border-[#E5E7EB] rounded-[8px] text-[13px] font-medium text-[#4B5563] bg-[#F9FAFB] focus:bg-white outline-none focus:border-[#3B82F6] transition-all"
                                                />
                                            </div>

                                            {/* Total Compensation */}
                                            <div className="col-span-2 text-[14px] font-semibold text-[#4B5563] text-right">
                                                ₹ {parseFloat(totalComp) === 0 ? "0" : totalComp}
                                            </div>
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}

                        {Object.keys(groupedStaff).length === 0 && (
                            <div className="px-[24px] py-[40px] text-center text-[14px] text-[#9CA3AF] font-medium">
                                No staff selected or available for leave encashment.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-[40px]"></div>

            {/* Sticky Bottom Footer */}
            <div className="sticky bottom-[-16px] -mx-4 -mb-4 w-[calc(100%+32px)] bg-white border-t border-[#E5E7EB] px-[40px] h-[72px] flex items-center justify-between z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] mt-[20px]">
                <div className="text-[16px] font-bold text-[#4B5563] flex-1">
                    Total Amount: ₹ {totalEncashAmount.toFixed(2).replace(/\.00$/, '')}
                </div>
                
                <div className="flex items-center">
                    <Button 
                        disabled={totalEncashAmount <= 0}
                        className={`h-[40px] px-[24px] rounded-[10px] text-[14px] font-medium transition-all ${
                            totalEncashAmount > 0 
                            ? "bg-[#3F5A54] hover:bg-[#2c4440] text-white" 
                            : "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed hover:bg-[#E5E7EB]"
                        }`}
                        onClick={() => {
                            if (totalEncashAmount > 0) {
                                alert("Bulk leaves encashment processed successfully!");
                                router.push("/dashboard/admin/hrms/attendence/leaves");
                            }
                        }}
                    >
                        Encash Leaves
                    </Button>
                </div>
            </div>
        </div>
    );
}
