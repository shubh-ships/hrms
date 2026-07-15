"use client"

import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StaffMember {
    id: string;
    name: string;
    initials: string;
    empId: string;
    staffType: string;
    currentTemplate: string;
    newTemplate: string;
    colorClass: string;
}

export default function BulkReviseSalaryPage() {
    const router = useRouter();
    const { state } = useSidebar();
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sameTemplateForAll, setSameTemplateForAll] = useState(false);
    const [globalTemplate, setGlobalTemplate] = useState("Select Template");
    const [reviseByPercentage, setReviseByPercentage] = useState(false);

    const templates = [
        "HAcfafvjavfjerqe",
        "Default Template",
        "Senior Management",
        "Junior Staff",
        "Contractual Template"
    ];

    useEffect(() => {
        const stored = sessionStorage.getItem("actualStaffEntries");
        const selectedIdsRaw = sessionStorage.getItem("bulk_selected_staff");
        const selectedIds = selectedIdsRaw ? JSON.parse(selectedIdsRaw) : [];

        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                const mapped = parsed
                    .filter((u: any) => selectedIds.length === 0 || selectedIds.includes(u.id.toString()))
                    .map((u: any, index: number) => ({
                    id: u.id.toString(),
                    name: u.name,
                    initials: u.initials || u.name.split(" ").map((n: string) => n[0]).join("").toUpperCase(),
                    empId: u.employeeCode || u.empId || "N/A",
                    staffType: u.staffType || (index % 2 === 0 ? "Regular" : "Contractual (monthly)"),
                    currentTemplate: u.employeeCode || u.empId || "N/A", // Using empId as current template as seen in image
                    newTemplate: "HAcfafvjavfjerqe",
                    colorClass: u.colorClass || "bg-blue-100 text-blue-600"
                }));
                setStaffList(mapped);
            } catch (e) {
                console.error("Failed to load staff list", e);
            }
        }
    }, []);

    const handleNewTemplateChange = (id: string, template: string) => {
        setStaffList(prev => prev.map(staff => 
            staff.id === id ? { ...staff, newTemplate: template } : staff
        ));
    };

    const handleGlobalTemplateChange = (template: string) => {
        setGlobalTemplate(template);
        if (sameTemplateForAll) {
            setStaffList(prev => prev.map(staff => ({ ...staff, newTemplate: template })));
        }
    };

    const filteredStaff = staffList.filter(staff => 
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.empId.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                <div className="flex justify-between items-start mb-8">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-[20px] font-semibold text-[#1F2937] leading-none">Revise Salary</h1>
                        <p className="text-[10px] font-regular text-[#9CA3AF]">Revise salary of your selected employees all at once</p>
                    </div>
                    <Button 
                        variant="default"
                        onClick={() => router.push("/dashboard/admin/hrms/salary-revision-history")}
                        className="w-[160px] h-[37px] bg-[#3F5A54] hover:bg-[#2c4440] text-white text-[14px] font-medium rounded-lg"
                    >
                        View Revision History
                    </Button>
                </div>

                {/* Main Table Container */}
                <div className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm mr-[100px]">
                    {/* Table Filters Row */}
                    <div className="flex px-6 py-5 bg-white border-b border-[#E5E7EB]">
                        <div className="w-[80%] flex items-center justify-between pr-6">
                            <div className="relative w-[367px] h-[37px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                                <Input
                                    placeholder="Search Staff"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-[37px] border-gray-200 rounded-lg text-[14px] focus-visible:ring-1 focus-visible:ring-gray-300"
                                />
                            </div>

                            <div className="flex items-center gap-2 h-[21px]">
                                <Checkbox 
                                    id="sameTemplate" 
                                    checked={sameTemplateForAll}
                                    onCheckedChange={(checked) => setSameTemplateForAll(!!checked)}
                                    className="border-gray-300 rounded"
                                />
                                <label htmlFor="sameTemplate" className="text-[14px] font-medium text-[#1F2937] cursor-pointer whitespace-nowrap">
                                    Same Template for All
                                </label>
                            </div>
                        </div>

                        <div className="w-[20%] flex items-center">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        className="w-[200px] h-[37px] bg-[#F3F4F6] border-none text-[#1F2937] flex items-center justify-between px-4 hover:bg-gray-200"
                                    >
                                        <span className="text-[14px]">{globalTemplate}</span>
                                        <ChevronDown size={14} className="text-[#4B5563]" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[200px] bg-white rounded-lg shadow-lg border border-gray-100">
                                    {templates.map((template) => (
                                        <DropdownMenuItem 
                                            key={template}
                                            onClick={() => handleGlobalTemplateChange(template)}
                                            className="text-[14px] py-2 cursor-pointer hover:bg-gray-50"
                                        >
                                            {template}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Table Header */}
                    <div className="h-[39px] bg-[#F0F0F0] flex items-center px-6">
                        <div className="w-[30%] text-[7px] font-medium text-[#9CA3AF] uppercase">Name</div>
                        <div className="w-[15%] text-[7px] font-medium text-[#9CA3AF] uppercase">ID</div>
                        <div className="w-[15%] text-[7px] font-medium text-[#9CA3AF] uppercase">Staff Type</div>
                        <div className="w-[20%] text-[7px] font-medium text-[#9CA3AF] uppercase">Current Template</div>
                        <div className="w-[20%] text-[7px] font-medium text-[#9CA3AF] uppercase">New Template</div>
                    </div>

                    {/* Table Body */}
                    <div className="flex flex-col">
                        {filteredStaff.length > 0 ? (
                            filteredStaff.map((staff, idx) => (
                                <div 
                                    key={staff.id} 
                                    className={cn(
                                        "flex px-6 py-[14px] items-center border-b border-[#E5E7EB] last:border-b-0 bg-white"
                                    )}
                                >
                                    {/* Name Column */}
                                    <div className="w-[30%] flex items-center gap-3">
                                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold", staff.colorClass)}>
                                            {staff.initials}
                                        </div>
                                        <span className="text-[10px] font-regular text-[#1F2937]">{staff.name}</span>
                                    </div>

                                    {/* ID Column */}
                                    <div className="w-[15%] text-[10px] font-regular text-[#4B5563]">
                                        {staff.empId}
                                    </div>

                                    {/* Staff Type Column */}
                                    <div className="w-[15%] text-[10px] font-regular text-[#4B5563]">
                                        {staff.staffType}
                                    </div>

                                    {/* Current Template Column */}
                                    <div className="w-[20%] text-[10px] font-regular text-[#4B5563]">
                                        {staff.currentTemplate}
                                    </div>

                                    {/* New Template Column */}
                                    <div className="w-[20%]">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button 
                                                    variant="outline" 
                                                    className="w-[200px] h-[37px] border border-gray-200 rounded-lg text-[#1F2937] flex items-center justify-between px-3 hover:bg-gray-50"
                                                >
                                                    <span className="text-[10px] truncate max-w-[150px]">{staff.newTemplate}</span>
                                                    <ChevronDown size={14} className="text-[#9CA3AF]" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[180px] bg-white rounded-lg shadow-lg border border-gray-100">
                                                {templates.map((template) => (
                                                    <DropdownMenuItem 
                                                        key={template}
                                                        onClick={() => handleNewTemplateChange(staff.id, template)}
                                                        className="text-[10px] py-2 cursor-pointer hover:bg-gray-50"
                                                    >
                                                        {template}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center text-[14px] text-gray-500">
                                No staff found
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Fixed Footer */}
            <div 
                className={cn(
                    "fixed bottom-0 right-0 h-[80px] bg-white border-t border-gray-100 flex items-center justify-between px-[40px] z-50 transition-[left] duration-200 ease-linear",
                    state === "expanded" ? "left-64" : "left-20"
                )}
            >
                <div className="flex items-center gap-2">
                    <Checkbox 
                        id="reviseByPercentage" 
                        checked={reviseByPercentage}
                        onCheckedChange={(checked) => setReviseByPercentage(!!checked)}
                        className="w-4 h-4 border-gray-300 rounded"
                    />
                    <label htmlFor="reviseByPercentage" className="text-[10px] font-regular text-[#1F2937] cursor-pointer">
                        Revise Salary by Percentage
                    </label>
                </div>

                <div className="flex items-center gap-4">
                    <Button 
                        variant="outline" 
                        onClick={() => router.back()}
                        className="w-[146px] h-[37px] border-gray-300 text-[#1F2937] text-[14px] font-medium rounded-lg hover:bg-gray-50 px-0 flex items-center justify-center"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => router.push("/dashboard/admin/hrms/addBulk?type=salary")}
                        className="w-[146px] h-[37px] bg-[#3F5A54] hover:bg-[#2c4440] text-white text-[14px] font-medium rounded-lg px-0 flex items-center justify-center"
                    >
                        Continue
                    </Button>
                </div>
            </div>
        </div>
    );
}
