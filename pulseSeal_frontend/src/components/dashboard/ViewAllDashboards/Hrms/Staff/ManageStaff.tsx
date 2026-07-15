"use client";

import React, { useCallback } from "react";
import { MoveLeft, Download, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { useState } from "react";
import Image from "next/image";
import uploadIcon from "@/assets/StaffIcon/uploadIcon.png"

export default function ManageStaffStatus() {
    const router = useRouter();
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setUploadedFile(acceptedFiles[0]);
        }
    }, []);

    const handleDownloadTemplate = () => {
        // Prepare template with sample data from actual staff if available
        let sampleData: any[] = [];

        const stored = sessionStorage.getItem("actualStaffEntries");
        const selectedIdsRaw = sessionStorage.getItem("bulk_selected_staff");
        const selectedIds = selectedIdsRaw ? JSON.parse(selectedIdsRaw) : [];

        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                const filtered = parsed.filter((u: any) => selectedIds.length === 0 || selectedIds.includes(u.id.toString()));
                if (filtered.length > 0) {
                    sampleData = filtered.map((u: any) => ({
                        "Employee Code": u.employeeCode || u.empId || u.id,
                        "Full Name": u.name,
                        "Status": u.status || "Active",
                        "Change Reason": ""
                    }));
                }
            } catch (e) { console.error(e); }
        }

        const ws = XLSX.utils.json_to_sheet(sampleData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Staff Status");
        XLSX.writeFile(wb, "Manage_Staff_Status_Template.xlsx");
    };

    const handleValidate = () => {
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
                            String(row["Employee Code"]) === String(staff.employeeCode || staff.empId || staff.id)
                        );
                        if (match) {
                            return {
                                ...staff,
                                status: match["Status"] || staff.status,
                                statusChangeReason: match["Change Reason"] || staff.statusChangeReason
                            };
                        }
                        return staff;
                    });

                    sessionStorage.setItem("actualStaffEntries", JSON.stringify(updatedStaff));
                    console.log("Bulk status update successful");
                    router.push("/dashboard/admin/hrms/staff");
                }
            } catch (err) {
                console.error("Failed to process status update", err);
                alert("Error processing file. Please use the provided template.");
            }
        };
        reader.readAsArrayBuffer(uploadedFile);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv']
        }
    });

    return (
        <div className="flex flex-col w-full min-h-screen relative pb-[80px]">
            {/* Top Back Button */}
            <div className="flex mt-[24px] ml-[40px] h-[69px]">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-[10px] text-[#3F5A54] hover:text-black transition-colors"
                >
                    <MoveLeft className="w-[20px]" />
                    <span className="text-[14px] font-medium">Back</span>
                </button>
            </div>

            {/* Main Centered Content */}
            <div className="flex flex-col items-center justify-center flex-1 w-full max-w-[800px] mx-auto px-4">
                {/* Titles */}
                <div className="flex flex-col items-center text-center justify-center mb-8 space-y-2">
                    <h1 className="text-[20px] font-semibold text-[#1F2937]">Manage Staff Status</h1>
                    <div className="flex flex-col items-center gap-1">
                        <button
                            onClick={handleDownloadTemplate}
                            className="flex items-center text-[14px] text-[#3B82F6] font-medium hover:underline"
                        >
                            Utilize Our XLSX Template <Download className="w-[14px] h-[14px] ml-1" />
                        </button>
                        <span className="text-[#9CA3AF] text-[10px]">and change status of multiple staff at once</span>
                    </div>
                </div>

                {/* Drag and Drop Zone */}
                {uploadedFile ? (
                    <div className="flex flex-col items-center justify-center w-[546px] h-[222px] bg-[#EEF0FF] border border-[#3F5A54] rounded-[5px] p-6 shadow-sm">
                        <div className="w-[60px] h-[60px] bg-white border border-[#3B82F6] rounded-xl flex items-center justify-center mb-4 text-[#3B82F6] font-bold text-[12px] uppercase">
                            {uploadedFile.name.split('.').pop()}
                        </div>
                        <h3 className="text-[16px] font-bold text-[#1F2937] text-center w-full truncate mb-1">
                            {uploadedFile.name}
                        </h3>
                        <p className="text-[#9CA3AF] text-[12px] font-medium mb-4">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <button
                            onClick={() => setUploadedFile(null)}
                            className="text-[#EF4444] text-[12px] font-bold hover:underline"
                        >
                            Remove File
                        </button>
                    </div>
                ) : (
                    <div
                        {...getRootProps()}
                        className={`flex flex-col items-center justify-center w-[546px] h-[222px] bg-[#EEF0FF] border border-dashed rounded-[5px] cursor-pointer transition-all ${isDragActive ? "border-[#3F5A54] bg-[#eaf1f0]" : "border-[#3F5A54] hover:bg-[#eaf1f0]"}`}
                    >
                        <input {...getInputProps()} />
                        <div className="w-[83px] h-[72px] relative mb-4">
                            <Image src={uploadIcon} alt="Upload" fill className="object-contain opacity-80" />
                        </div>
                        <h3 className="text-[16px] font-medium text-[#1F2937]">
                            Drag & drop files or <span className="text-[#3F5A54] font-bold">Upload file</span>
                        </h3>
                        <div className="mt-3 text-center">
                            <p className="text-[10px] text-[#9CA3AF]">[Supported formats: .XLS, .XLSX, .CSV]</p>
                            <p className="text-[10px] text-[#9CA3AF]">Maximum upload file size is 20 MB.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Bottom Footer */}
            <div className="fixed bottom-0 right-0 h-[80px] bg-white border-t border-gray-200 flex items-center justify-end px-[40px] z-10 w-full sm:w-[calc(100%-260px)]">
                <button
                    onClick={handleValidate}
                    disabled={!uploadedFile}
                    className={`h-[37px] px-8 rounded-lg font-bold text-[14px] transition-all uppercase tracking-wider ${
                        uploadedFile 
                        ? "bg-transparent border border-[#3F5A54] text-[#3F5A54] hover:bg-gray-50" 
                        : "bg-gray-100 text-gray-400 cursor-not-allowed border-none"
                    }`}
                >
                    Validate
                </button>
            </div>
        </div>
    );
}

