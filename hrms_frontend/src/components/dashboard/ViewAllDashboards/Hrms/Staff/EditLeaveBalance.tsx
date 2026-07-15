"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MoveLeft, Search, ChevronDown, Upload, Download } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useSidebar } from "@/components/ui/sidebar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

import Cloud from "@/assets/Dashicons/Cloud.png";

export default function EditLeaveBalance() {
    const router = useRouter();
    const { state } = useSidebar();
    const [step, setStep] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectAll, setSelectAll] = useState(false);
    const [leavePolicy, setLeavePolicy] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [staffList, setStaffList] = useState<{ name: string, displayId: string, id: string, type: string }[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem("actualStaffEntries");
        const selectedIdsRaw = sessionStorage.getItem("bulk_selected_staff");
        const selectedIds = selectedIdsRaw ? JSON.parse(selectedIdsRaw) : [];

        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                const filtered = parsed.filter((u: any) => selectedIds.length === 0 || selectedIds.includes(u.id.toString()));
                setStaffList(filtered.map((u: any) => ({
                    name: u.name,
                    displayId: u.employeeCode || u.empId || u.id || "N/A",
                    id: u.id.toString(),
                    type: u.staffType || "Regular"
                })));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    const handleContinue = () => {
        if (leavePolicy || selectAll) {
            setStep(2);
        } else {
            toast.warning("Please select a template first.");
        }
    };

    const handleDownloadTemplate = () => {
        const dummyData = staffList.map(s => ({ 
            "Staff ID": s.displayId, 
            "Name": s.name, 
            "Staff Type": s.type, 
            "Sick Leave": 0, 
            "Casual Leave": 0, 
            "Earned Leave": 0,
            "Unpaid Leave": 0
        }));

        if (dummyData.length === 0) {
            // Push empty or default if needed, or leave empty
        }

        const ws = XLSX.utils.json_to_sheet(dummyData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Leave Balance");
        XLSX.writeFile(wb, "Leave_Balance_Template.xlsx");
    };

    const handleBulkValidate = () => {
        if (!uploadedFile) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet);

                const storedRaw = sessionStorage.getItem("actualStaffEntries");
                if (storedRaw) {
                    const existingStaff = JSON.parse(storedRaw);
                    const updatedStaff = existingStaff.map((staff: any) => {
                        const match = jsonData.find(row => 
                            String(row["ID"] || row["Staff ID"] || row["Employee Code"]).trim() === String(staff.employeeCode || staff.empId || staff.id).trim()
                        );
                        if (match) {
                            return {
                                ...staff,
                                leaveBalance: {
                                    ...(staff.leaveBalance || {}),
                                    sickLeave: rowValue(match, "Sick Leave", staff.leaveBalance?.sickLeave),
                                    casualLeave: rowValue(match, "Casual Leave", staff.leaveBalance?.casualLeave),
                                    earnedLeave: rowValue(match, "Earned Leave", staff.leaveBalance?.earnedLeave),
                                    unpaidLeave: rowValue(match, "Unpaid Leave", staff.leaveBalance?.unpaidLeave),
                                }
                            };
                        }
                        return staff;
                    });

                    sessionStorage.setItem("actualStaffEntries", JSON.stringify(updatedStaff));
                    toast.success("Leave balances updated successfully!");
                    router.push("/dashboard/admin/hrms/staff");
                }
            } catch (err) {
                console.error("Failed to process leave balance update", err);
                toast.error("Error processing file. Please use the provided template.");
            }
        };
        reader.readAsArrayBuffer(uploadedFile);
    };

    function rowValue(row: any, key: string, fallback: any) {
        const val = row[key];
        return (val !== undefined && val !== null && val !== "") ? Number(val) : (fallback ?? 0);
    }

    if (step === 2) {
        return (
            <div className="bg-[#F8FAFC] min-h-screen px-[40px] pt-[24px] pb-[100px] font-sans flex flex-col relative w-full">
                {/* Back Button */}
                <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-[10px] text-[#3F5A54] hover:text-black transition-colors w-fit"
                >
                    <MoveLeft className="w-[20px]" />
                    <span className="text-[14px] font-medium text-[#3F5A54]">Back</span>
                </button>

                {/* Upload Section Center */}
                <div className="mt-[60px] flex flex-col items-center w-full max-w-[1000px] mx-auto">
                    <h1 className="text-[#1F2937] text-[24px] font-bold mb-3">Edit Leave Balance</h1>
                    <div className="flex items-center gap-1 text-[12px]">
                        <span
                            onClick={handleDownloadTemplate}
                            className="text-[#3B82F6] font-medium cursor-pointer hover:underline flex items-center gap-1"
                        >
                            Utilize Our XLSX Template <Download className="w-[12px] h-[12px]" />
                        </span>
                        <span className="text-[#9CA3AF] font-regular">and simultaneously edit leave balance</span>
                    </div>

                    {/* Boxes */}
                    <div className="flex items-stretch justify-center gap-[24px] mt-[40px] w-full">
                        {/* Box 1: File Upload */}
                        <div className="flex-1 h-[320px] border-[1.5px] border-dashed border-[#D1D5DB] rounded-xl flex flex-col items-center justify-center p-[40px] bg-white">
                            {uploadedFile ? (
                                <div className="flex flex-col items-center justify-center p-8 bg-[#F3F4F6] rounded-xl border border-[#E5E7EB] w-full max-w-[300px]">
                                    <div className="w-[50px] h-[50px] bg-white border border-[#3B82F6] rounded-lg flex items-center justify-center mb-4">
                                        <span className="text-[#3B82F6] font-bold text-[10px] uppercase">{uploadedFile.name.split('.').pop()}</span>
                                    </div>
                                    <span className="text-[#1F2937] font-bold text-[14px] text-center w-full truncate mb-1" title={uploadedFile.name}>
                                        {uploadedFile.name}
                                    </span>
                                    <span className="text-[#9CA3AF] text-[10px] font-medium mb-4">
                                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                    <button
                                        onClick={() => setUploadedFile(null)}
                                        className="text-[#EF4444] text-[12px] font-medium hover:underline transition-all"
                                    >
                                        Remove File
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="w-[80px] h-[80px] flex items-center justify-center mb-6">
                                        <div className="relative">
                                            <div className="w-[60px] h-[60px] bg-white border-[2px] border-[#3B82F6] rounded-xl flex items-center justify-center z-10 relative">
                                                <Upload className="w-[24px] h-[24px] text-[#3B82F6]" />
                                            </div>
                                            <div className="absolute top-2 -left-3 w-[40px] h-[50px] border-[2px] border-[#3B82F6] rounded-lg -rotate-12 opacity-50"></div>
                                            <div className="absolute top-2 -right-3 w-[40px] h-[50px] border-[2px] border-[#3B82F6] rounded-lg rotate-12 opacity-50"></div>
                                        </div>
                                    </div>
                                    <h2 className="text-[#1F2937] text-[14px] font-bold mb-1">Choose the file to be imported</h2>
                                    <p className="text-[#9CA3AF] text-[10px] font-regular">[only xls,xlsx and csv formats are supported.]</p>
                                    <p className="text-[#9CA3AF] text-[10px] font-regular mb-6">Maximum upload file size is 5 MB.</p>

                                    <input
                                        type="file"
                                        accept=".csv, .xls, .xlsx"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setUploadedFile(file);
                                                toast.success("File uploaded successfully");
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 bg-[#EBF0FF] text-[#3B82F6] px-6 py-2 rounded-lg font-bold text-[12px] hover:bg-[#dbe4ff] transition-all"
                                    >
                                        <Upload className="w-[14px] h-[14px]" /> Upload File
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Box 2: Remarks */}
                        <div className="flex-1 h-[320px] border-[1.5px] border-[#E5E7EB] rounded-xl flex flex-col items-center justify-center p-[40px] bg-white shadow-sm">
                            <span className="text-[#9CA3AF] text-[12px] font-medium">No remarks</span>
                        </div>
                    </div>
                </div>

                {/* Step 2 Footer */}
                <div className={`fixed bottom-0 right-0 h-[80px] bg-white border-t border-[#E5E7EB] flex items-center justify-end px-[40px] gap-[16px] z-10 transition-all duration-300 ${state === "collapsed" ? "left-[80px]" : "left-[260px]"}`}>
                    <button
                        onClick={() => {
                            setStep(1);
                            setUploadedFile(null);
                        }}
                        className="h-[37px] px-[32px] rounded-lg border border-[#3F5A54] text-[14px] font-bold text-[#3F5A54] hover:bg-gray-50 transition-all uppercase tracking-wider"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleBulkValidate}
                        disabled={!uploadedFile}
                        className={cn(
                            "h-[37px] px-[32px] rounded-lg text-[14px] font-bold uppercase tracking-wider transition-all shadow-sm",
                            uploadedFile 
                                ? "bg-[#3F5A54] text-white hover:bg-[#2d4540]" 
                                : "bg-gray-100 text-[#9CA3AF] cursor-not-allowed border-none shadow-none"
                        )}
                    >
                        Validate
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#F8FAFC] min-h-screen px-[40px] pt-[24px] pb-[100px] font-sans flex flex-col relative w-full">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-[10px] text-[#3F5A54] hover:text-black transition-colors w-fit"
            >
                <MoveLeft className="w-[20px]" />
                <span className="text-[14px] font-medium text-[#3F5A54]">Back</span>
            </button>

            {/* Header Section */}
            <div className="flex justify-between items-end mt-[20px] w-full">
                <div>
                    <h1 className="text-[#1F2937] text-[20px] font-semibold h-[30px] w-[190px]">Edit Leave Balance</h1>
                    <p className="text-[#9CA3AF] text-[10px] h-[15px] w-[288px] font-regular">
                        Edit leave balance of your selected employees all at once
                    </p>
                </div>

                {/* Templates Dropdown */}
                <div className="flex flex-col gap-[8px]">
                    <span className="text-[7px] font-regular text-[#4B5563] h-[11px] w-[83px]">Select Leave Templates</span>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="flex items-center justify-between w-[230px] h-[37px] px-[16px] border border-[#D1D5DB] rounded-lg text-left shadow-sm hover:border-[#D1D5DB] transition-all">
                                <span className={`text-[14px] h-[21px] w-[115px] truncate ${(leavePolicy || selectAll) ? "text-[#1F2937]" : "text-[#9CA3AF]"}`}>
                                    {leavePolicy ? "Leave Policy" : (selectAll ? "Select All" : "Select Template")}
                                </span>
                                <ChevronDown className="h-[16px] w-[16px] text-[#9CA3AF]" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[240px] p-[10px] bg-white border-[#E5E7EB] shadow-lg rounded-xl" align="end">
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-[10px] top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-[#9CA3AF]" />
                                    <input
                                        type="text"
                                        placeholder="Search Template"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full h-[40px] pl-[32px] pr-[10px] text-[12px] border border-[#3B82F6] rounded-lg outline-none text-[#1F2937]"
                                    />
                                </div>
                                <div className="space-y-3 px-1 mt-2">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="selectAll"
                                            checked={selectAll}
                                            onCheckedChange={(checked) => {
                                                const val = checked as boolean;
                                                setSelectAll(val);
                                                setLeavePolicy(val);
                                            }}
                                            className="border-[#D1D5DB] data-[state=checked]:bg-[#3F5A54] data-[state=checked]:border-[#3F5A54] rounded-[4px]"
                                        />
                                        <label htmlFor="selectAll" className="text-[12px] font-medium text-[#4B5563] cursor-pointer">
                                            Select All
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="leavePolicy"
                                            checked={leavePolicy}
                                            onCheckedChange={(checked) => {
                                                const val = checked as boolean;
                                                setLeavePolicy(val);
                                                if (!val) setSelectAll(false);
                                            }}
                                            className="border-[#D1D5DB] data-[state=checked]:bg-[#3F5A54] data-[state=checked]:border-[#3F5A54] rounded-[4px]"
                                        />
                                        <label htmlFor="leavePolicy" className="text-[12px] font-medium text-[#4B5563] cursor-pointer">
                                            Leave Policy
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Main Table Container */}
            <div className="mt-[24px] bg-white border-[1.5px] border-[#E5E7EB] rounded-xl overflow-hidden flex flex-col min-h-[400px]">
                {/* Table Header */}
                <div className="flex items-center h-[39px] bg-[#F3F4F6] border-b border-[#E5E7EB] pl-[20px] pr-[32px]">
                    <div className="w-[300px] text-[10px] h-[15px] font-medium text-[#9CA3AF]">Name</div>
                    <div className="w-[300px] text-[10px] h-[15px] font-medium text-[#9CA3AF]">ID</div>
                    <div className="w-[300px] text-[10px] h-[15px] font-medium text-[#9CA3AF]">Staff Type</div>
                    <div className="text-[10px] h-[15px] font-medium text-[#9CA3AF]">Template Name</div>
                </div>

                {/* Data or Empty State */}
                {(leavePolicy || selectAll) ? (
                    <div className="flex flex-col bg-white">
                        {staffList.map((s, idx) => (
                            <div key={idx} className="flex items-center h-[38px] pl-[20px] pr-[32px] border-b border-[#F1F5F9] last:border-0 hover:bg-gray-50/50">
                                <div className="w-[300px] text-[10px] h-[15px] font-regular text-[#1F2937]">{s.name}</div>
                                <div 
                                    className="w-[300px] text-[10px] h-[15px] font-medium text-[#3B82F6] cursor-pointer hover:underline transition-colors"
                                    onClick={() => router.push(`/dashboard/admin/hrms/staff/${s.id}`)}
                                >
                                    {s.displayId}
                                </div>
                                <div className="w-[300px] text-[10px] h-[15px] font-regular text-[#1F2937]">{s.type}</div>
                                <div className="text-[10px] h-[15px] font-regular text-[#1F2937] whitespace-nowrap">Leave Policy</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center pointer-events-none select-none my-[80px]">
                        <div className="flex flex-col items-center justify-center">
                            <Image src={Cloud} alt="no data" width={85} height={85} className="mb-2 opacity-100" priority />
                            <span className="text-[#9CA3AF] text-[7px] font-medium h-[11px] w-[50px]">No data found</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Fixed Bottom Action Bar */}
            <div className={`fixed bottom-0 right-0 h-[80px] bg-white border-t border-[#E5E7EB] flex items-center justify-end px-[40px] gap-[16px] z-10 transition-all duration-300 ${state === "collapsed" ? "left-[80px]" : "left-[260px]"}`}>
                <button
                    onClick={() => router.back()}
                    className="h-[37px] px-[32px] rounded-lg border border-[#3F5A54] text-[14px] font-medium text-[#3F5A54] hover:bg-gray-50 transition-all"
                >
                    Cancel
                </button>
                <button
                    onClick={handleContinue}
                    className="h-[37px] px-[32px] rounded-lg bg-[#3F5A54] text-[14px] font-medium text-white hover:bg-[#2d4540] transition-all"
                >
                    Continue
                </button>
            </div>
        </div>
    );
}