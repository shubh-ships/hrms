"use client";

import React, { useState, useRef } from "react";
import { MoveLeft, CloudUpload, Download } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import addBulkImg from "@/assets/StaffIcon/addBulk.jpg";

export default function AddBulk() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const uploadType = searchParams.get("type") || "employee"; // 'user' or 'employee' or 'salary'

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleValidate = () => {
        if (!selectedFile) {
            alert("Please upload a file first!");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Map items to structures based on uploadType
                const newItems = jsonData.map((row: any, index: number) => {
                    const baseInfo = {
                        id: Date.now() + index,
                        name: row["Full Name"] || "Unknown",
                        email: row["Email Address"] || "N/A",
                        phone: row["Contact Number"] || "N/A",
                        role: row["Role"] || "Staff",
                        status: "Active"
                    };

                    if (uploadType === "user") {
                        return {
                            ...baseInfo,
                            userType: row["User Type"] || "Regular Users",
                            department: row["Departments"] || "N/A",
                            departmentBg: "bg-[#EBF0FF]",
                            departmentText: "text-[#3B82F6]",
                            reportsTo: "N/A",
                            reportsToType: "text"
                        };
                    } else if (uploadType === "salary") {
                        // For Salary Bulk Upload
                        return {
                            empId: row["Employee Code"] || row["ID"],
                            name: row["Full Name"],
                            monthlyAmount: parseFloat(row["Monthly CTC"]) || 0,
                            basicAmount: parseFloat(row["Basic Amount"]) || 0,
                            hasSalaryDetails: true
                        };
                    } else {
                        // For Employee Staff List
                        return {
                            ...baseInfo,
                            employeeCode: row["Employee Code"] || `EP${Math.floor(1000 + Math.random() * 9000)}`,
                            initials: (row["Full Name"] || "U").split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2),
                            initialsBg: "bg-[#EBF0FF]",
                            initialsText: "text-[#3B82F6]",
                            hasBankDetails: false,
                            hasSalaryDetails: false
                        };
                    }
                });

                // Cache in the correct session storage key
                const storageKey = uploadType === "user" ? "systemUserEntries" : "actualStaffEntries";
                const existingRaw = sessionStorage.getItem(storageKey);
                const existingItems = existingRaw ? JSON.parse(existingRaw) : [];

                let updatedItems;
                if (uploadType === "salary") {
                    // Get existing history or init empty
                    const historyRaw = sessionStorage.getItem("salaryRevisionHistory");
                    const existingHistory = historyRaw ? JSON.parse(historyRaw) : [];
                    const newHistoryEntries: any[] = [];

                    // Update existing staff items with salary data
                    updatedItems = existingItems.map((item: any) => {
                        const salaryUpdate: any = newItems.find((s: any) => s.empId === (item.employeeCode || item.empId));
                        if (salaryUpdate) {
                            const monthly = salaryUpdate.monthlyAmount || 0;
                            const basic = salaryUpdate.basicAmount || 0;
                            
                            // History logic
                            const prevSalary = item.salaryDetails?.monthlyCTC || 0;
                            const percentChange = prevSalary > 0 ? ((monthly - prevSalary) / prevSalary) * 100 : 0;
                            
                            newHistoryEntries.push({
                                id: Date.now() + Math.random(),
                                empId: item.employeeCode || item.empId,
                                name: item.name,
                                initials: item.initials,
                                initialsBg: item.initialsBg || "bg-blue-100",
                                initialsText: item.initialsText || "text-blue-600",
                                staffType: item.role || "Staff",
                                previousSalary: prevSalary,
                                percentChange: percentChange.toFixed(2),
                                revisedSalary: monthly,
                                effectiveDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, ' '),
                                updatedBy: "Vijay Korjani", // Current user fallback
                                updatedOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, ' ')
                            });

                            // --- NEW: Individual Staff History & Structure Sync ---
                            const staffIdForStorage = item.id; 
                            
                            // 1. Update individual structure
                            const structureKey = `salary_structure_${staffIdForStorage}`;
                            sessionStorage.setItem(structureKey, JSON.stringify({
                                monthlyAmount: monthly.toString(),
                                wageRate: "Monthly"
                            }));

                            // 2. Update individual history
                            const indHistoryKey = `salary_history_${staffIdForStorage}`;
                            const prevIndHistoryRaw = sessionStorage.getItem(indHistoryKey);
                            const prevIndHistory = prevIndHistoryRaw ? JSON.parse(prevIndHistoryRaw) : [];
                            
                            const newIndEntry = {
                                id: Date.now() + Math.random(),
                                staffName: item.name,
                                staffId: item.employeeCode || item.empId,
                                entry: "Bulk Revision",
                                cycle: "Monthly",
                                entryDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                                amount: monthly.toLocaleString('en-IN'),
                                createdAt: new Date().toISOString()
                            };
                            
                            sessionStorage.setItem(indHistoryKey, JSON.stringify([newIndEntry, ...prevIndHistory]));
                            // --------------------------------------------------

                            return {
                                ...item,
                                hasSalaryDetails: true,
                                salaryDetails: {
                                    monthlyCTC: monthly,
                                    yearlyCTC: monthly * 12,
                                    basic: basic,
                                    specialAllowance: Math.max(0, monthly - basic)
                                }
                            };
                        }
                        return item;
                    });

                    // Save history
                    sessionStorage.setItem("salaryRevisionHistory", JSON.stringify([...newHistoryEntries, ...existingHistory]));
                } else {
                    updatedItems = [...existingItems, ...newItems];
                }

                sessionStorage.setItem(storageKey, JSON.stringify(updatedItems));

                console.log(`Successfully processed ${newItems.length} ${uploadType} items from:`, selectedFile.name);

                // Redirect appropriately
                if (uploadType === "user") {
                    router.push("/dashboard/admin/hrms/addStaff");
                } else if (uploadType === "salary") {
                    router.push("/dashboard/admin/hrms/salary-revision-history");
                } else {
                    router.push("/dashboard/admin/hrms/staff");
                }
            } catch (error) {
                console.error("Error parsing Excel file:", error);
                alert("Failed to read the file. Please ensure it is a valid XLSX template.");
            }
        };

        // Trigger the file read
        reader.readAsArrayBuffer(selectedFile);
    };

    const handleDownloadTemplate = () => {
        let templateData;
        let fileName = "Bulk_Add_Template.xlsx";

        if (uploadType === "salary") {
            templateData = [
                // Empty sample data
            ];
            fileName = "Bulk_Salary_Template.xlsx";
        } else {
            templateData = [
                { "Full Name": "John Doe", "Email Address": "john.doe@example.com", "Contact Number": "9876543210", "Role": "Intern", "Departments": "Development", "Employee Code": "EP1001" },
                { "Full Name": "Jane Smith", "Email Address": "jane.smith@example.com", "Contact Number": "1234567890", "Role": "Manager", "Departments": "Marketing", "Employee Code": "EP1002" }
            ];
        }

        // Create a new Excel workbook and worksheet
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, uploadType === "salary" ? "Salary_Template" : "Employees_Template");

        // Execute browser download
        XLSX.writeFile(wb, fileName);
    };

    const { state } = useSidebar();
    const isSidebarExpanded = state === "expanded";

    return (
        <div className="bg-[#F9FAFB] min-h-screen px-[40px] pt-[40px] pb-0 font-sans flex flex-col items-center w-full grow relative">
            {/* Header / Back Button */}
            <div className="w-full mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-[8px] text-[#4B5563] hover:text-[#111827] transition-colors w-fit"
                >
                    <MoveLeft className="w-[16px] h-[16px] text-[#9CA3AF]" />
                    <span className="text-[12px] font-medium text-[#4B5563]">Back</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="flex flex-col items-center mt-[40px] w-full max-w-[445px]">
                <h1 className="text-[18px] font-semibold text-[#1F2937] mb-1">
                   {uploadType === "salary" ? "Add Salary Details in Bulk" : "Add Multiple Employees"}
                </h1>

                <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2 text-[#4B5563] text-[12px] font-medium hover:text-[#1F2937] mb-8 transition-colors"
                >
                    Utilize Our XLSX Template <Download className="w-[14px] h-[14px]" />
                </button>

                {/* "No Remarks" Image Box */}
                <div className="w-[445px] h-[202px] border border-[#3B82F6] bg-white rounded-xl flex justify-center items-center py-[30px] mb-[30px]">
                    <div className="flex flex-col items-center justify-center">
                        <div className="relative w-[140px] h-[140px]">
                            <Image
                                src={addBulkImg}
                                alt="No remarks"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <span className="text-[8px] text-[#9CA3AF] mt-2">No remarks</span>
                    </div>
                </div>

                {/* Drag and Drop Box - 445x202 */}
                <div
                    className="w-[445px] h-[202px] bg-[#EEF2FF]/60 border-[1.5px] border-dashed border-[#BCCAE0] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-[#EEF2FF] transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <div className="w-[64px] h-[64px] rounded-full flex items-center justify-center mb-0">
                        <CloudUpload className="w-[48px] h-[48px] text-[#4B5563] opacity-60" strokeWidth={1} />
                    </div>

                    {selectedFile ? (
                        <p className="text-[14px] font-medium text-[#1F2937] mb-1">
                            {selectedFile.name}
                        </p>
                    ) : (
                        <div className="flex flex-col items-center gap-0">
                             <p className="text-[14px] font-medium text-[#1F2937] mb-1 text-center">
                                Drag & drop files or <span className="font-semibold text-[#1F2937]">Upload file</span>
                            </p>
                            <p className="text-[8px] text-[#9CA3AF] text-center max-w-[320px] mt-0">
                                [Supported formates: JPEG, PNG, GIF, MP4, PDF, PSD, AI, Word, PPT]
                            </p>
                            <p className="text-[8px] text-[#9CA3AF] text-center mt-0">
                                Maximum upload file size is 20 MB.
                            </p>
                        </div>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".xlsx,.xls,.csv"
                    />
                </div>
            </div>

            {/* Bottom Floating Action Bar */}
            <div className={cn(
                "fixed bottom-0 right-0 h-[80px] bg-white border-t border-[#B1B1B14D] px-[40px] flex items-center justify-end z-999 transition-all duration-300",
                isSidebarExpanded ? "left-64" : "left-20"
            )}>
                <Button
                    onClick={handleValidate}
                    disabled={!selectedFile}
                    className={cn(
                        "h-[30px] w-[146px] rounded-lg text-[14px] font-medium transition-all shadow-none border",
                        selectedFile
                            ? "bg-[#3F5A54] border-[#3F5A54] text-white hover:bg-[#2c4440]"
                            : "bg-[#F3F4F6] border-[#9CA3AF] text-[#9CA3AF] cursor-not-allowed"
                        )}
                >
                    validate
                </Button>
            </div>
            {/* Bottom Padding */}
             <div className="h-[100px] w-full grow-0 shrink-0"></div>
        </div>
    );
}