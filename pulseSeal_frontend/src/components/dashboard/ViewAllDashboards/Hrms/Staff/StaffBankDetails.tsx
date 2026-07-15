"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Download, UploadCloud, ArrowLeft, MoveLeft } from "lucide-react";
import * as XLSX from "xlsx";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchEmployees, selectEmployees, updateEmployee } from "@/features/employee/employeeSlice";

const BANK_STAFF_DATA: any[] = [];

export default function StaffBankDetails() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const employees = useAppSelector(selectEmployees);

    const [staffList, setStaffList] = useState<any[]>([]);
    const [filledCount, setFilledCount] = useState(0);
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [manualBankData, setManualBankData] = useState<Record<string, any>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        dispatch(fetchEmployees({}));
    }, [dispatch]);

    // Initialize staff data from Redux + selection
    useEffect(() => {
        if (employees && employees.length > 0) {
            const selectedIdsRaw = sessionStorage.getItem("bulk_selected_staff");
            const selectedIds = selectedIdsRaw ? JSON.parse(selectedIdsRaw) : [];

            const filteredEmployees = employees.filter((u: any) =>
                selectedIds.length === 0 || selectedIds.includes(u._id)
            );

            const mappedUsers = filteredEmployees.map((u: any) => ({
                id: u._id,
                name: u.name || (u.personal?.lastName ? `${u.personal.firstName} ${u.personal.lastName}` : (u.personal?.firstName || "Unknown")),
                number: u.personal?.email || u.email || "N/A",
                initials: [u.personal?.firstName?.[0], u.personal?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?",
                colorClass: "bg-blue-100 text-blue-600",
                raw: u
            }));

            setStaffList(mappedUsers);

            // Initialize manualBankData with existing values
            const initialData: Record<string, any> = {};
            filteredEmployees.forEach((s: any) => {
                const bank = s.bank || {};
                if (bank.accountNumber) {
                    initialData[s._id] = {
                        accountHolder: bank.accountHolderName || "",
                        accountNumber: bank.accountNumber || "",
                        confirmAccountNumber: bank.accountNumber || "",
                        ifscCode: bank.ifsc || "",
                        bankName: bank.bankName || ""
                    };
                }
            });
            setManualBankData(initialData);
            updateFilledCount(initialData);
        }
    }, [employees]);

    const updateFilledCount = (data: Record<string, any>) => {
        const count = Object.values(data).filter(details =>
            details.accountHolder &&
            details.accountNumber &&
            details.ifscCode &&
            details.accountNumber === details.confirmAccountNumber
        ).length;
        setFilledCount(count);
    };

    const handleInputChange = (staffId: string, field: string, value: string) => {
        setManualBankData(prev => {
            const newData = {
                ...prev,
                [staffId]: {
                    ...(prev[staffId] || {
                        accountHolder: "",
                        accountNumber: "",
                        confirmAccountNumber: "",
                        ifscCode: "",
                        bankName: ""
                    }),
                    [field]: value
                }
            };
            updateFilledCount(newData);
            return newData;
        });
    };

    const handleManualSave = async () => {
        setIsSaving(true);
        const toastId = toast.loading("Saving bank details...");

        try {
            const updatePromises = Object.entries(manualBankData)
                .filter(([_, details]) =>
                    details.accountNumber &&
                    details.accountNumber === details.confirmAccountNumber
                )
                .map(([staffId, details]) => {
                    const employeeData = {
                        bank: {
                            bankName: details.bankName,
                            accountNumber: details.accountNumber,
                            accountHolderName: details.accountHolder,
                            ifsc: details.ifscCode
                        }
                    };
                    return dispatch(updateEmployee({ employeeId: staffId, employeeData: employeeData as any }));
                });

            if (updatePromises.length === 0) {
                toast.dismiss(toastId);
                toast.error("No valid details to save");
                setIsSaving(false);
                return;
            }

            await Promise.all(updatePromises);

            toast.dismiss(toastId);
            toast.success("Bank details saved successfully!");
            router.push("/dashboard/admin/hrms/staff");
        } catch (err) {
            console.error("Manual save failed", err);
            toast.dismiss(toastId);
            toast.error("Failed to save bank details.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadTemplate = () => {
        const sampleData = staffList.map(s => ({
            "Staff ID": s.id,
            "Staff Name": s.name,
            "Bank Name": "",
            "Account Holder Name": "",
            "Account Number": "",
            "IFSC Code": ""
        }));

        if (sampleData.length === 0) {
            sampleData.push({
                "Staff ID": "DE0804",
                "Staff Name": "Rohit Kumar",
                "Bank Name": "HDFC Bank",
                "Account Holder Name": "Rohit Kumar",
                "Account Number": "1234567890",
                "IFSC Code": "HDFC0001234"
            });
        }

        const ws = XLSX.utils.json_to_sheet(sampleData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bank Details");
        XLSX.writeFile(wb, "Staff_Bank_Details_Template.xlsx");
    };

    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setUploadedFile(acceptedFiles[0]);
        }
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
                        const match = jsonData.find(row => {
                            const staffIdFromRow = String(row["Staff ID"] || row["Employee Code"] || "").trim();
                            return staffIdFromRow === String(staff.id) ||
                                staffIdFromRow === String(staff.employeeCode) ||
                                staffIdFromRow === String(staff.empId);
                        });
                        if (match) {
                            return {
                                ...staff,
                                hasBankDetails: true,
                                bankName: match["Bank Name"] || "-",
                                accountHolder: match["Account Holder Name"] || match["Full Name"] || staff.name,
                                accountNumber: String(match["Account Number"] || ""),
                                ifscCode: match["IFSC Code"] || ""
                            };
                        }
                        return staff;
                    });

                    sessionStorage.setItem("actualStaffEntries", JSON.stringify(updatedStaff));
                    toast.success("Bank details updated successfully!");
                    router.push("/dashboard/admin/hrms/staff");
                }
            } catch (err) {
                console.error("Failed to process bank details update", err);
                toast.error("Error processing file. Please use the provided template.");
            }
        };
        reader.readAsArrayBuffer(uploadedFile);
    };

    if (showBulkUpload) {
        return (
            <div className="flex flex-col w-full min-h-screen relative pb-[80px] bg-[#F8FAFC]">
                {/* Top Back Button */}
                <div className="flex mt-[24px] ml-[40px] h-fit">
                    <button
                        onClick={() => setShowBulkUpload(false)}
                        className="flex items-center gap-[10px] text-[#3F5A54] hover:text-black transition-colors"
                    >
                        <ArrowLeft className="w-[20px]" />
                        <span className="text-[14px] font-medium uppercase tracking-wider">Back</span>
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex flex-col items-center justify-center flex-1 w-full max-w-[800px] mx-auto px-4">
                    <div className="flex flex-col items-center text-center mb-10">
                        <h1 className="text-[24px] font-bold text-[#1F2937] mb-2 leading-none">Add Staff Bank Accounts in Bulk</h1>
                        <div className="flex items-center gap-1 text-[12px]">
                            <button
                                onClick={handleDownloadTemplate}
                                className="flex items-center text-[#3B82F6] font-medium hover:underline"
                            >
                                Utilize Our XLSX Template <Download className="w-[14px] h-[14px] ml-1" />
                            </button>
                            <span className="text-[#9CA3AF]">and simultaneously add multiple bank accounts</span>
                        </div>
                    </div>

                    {/* Drag and Drop Zone */}
                    <div
                        {...getRootProps()}
                        className={cn(
                            "flex flex-col items-center justify-center w-[546px] h-[222px] bg-[#EEF2FF]/60 border-[1.5px] border-dashed border-[#BCCAE0] rounded-xl cursor-pointer transition-colors hover:bg-[#EEF2FF]",
                            isDragActive && "border-[#3B82F6] bg-[#EEF2FF]"
                        )}
                    >
                        <input {...getInputProps()} />
                        {uploadedFile ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-[64px] h-[64px] rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <UploadCloud className="w-[32px] h-[32px] text-[#3B82F6]" />
                                </div>
                                <p className="text-[14px] font-medium text-[#1F2937]">{uploadedFile.name}</p>
                                <p className="text-[10px] text-[#9CA3AF]">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        ) : (
                            <>
                                <div className="w-[64px] h-[64px] flex items-center justify-center mb-0">
                                    <UploadCloud className="w-[48px] h-[48px] text-[#4B5563] opacity-40" strokeWidth={1} />
                                </div>
                                <h3 className="text-[16px] font-medium text-[#1F2937]">
                                    Drag & drop files or <span className="font-bold">Upload file</span>
                                </h3>
                                <div className="mt-2 text-center">
                                    <p className="text-[10px] text-[#9CA3AF]">[Supported formats: JPEG, PNG, GIF, MP4, PDF, PSD, AI, Word, PPT]</p>
                                    <p className="text-[10px] text-[#9CA3AF]">Maximum upload file size is 20 MB.</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="fixed bottom-0 right-0 h-[80px] bg-[#F8FAFC] border-t border-gray-100 flex items-center justify-end px-[40px] z-10 w-full sm:w-[calc(100%-260px)]">
                    <Button
                        onClick={handleBulkValidate}
                        disabled={!uploadedFile}
                        className={cn(
                            "h-[42px] w-[170px] rounded-xl font-bold text-[15px] transition-all flex items-center justify-center shadow-lg",
                            uploadedFile
                                ? "bg-[#3F5A54] hover:bg-[#2c4440] text-white hover:shadow-xl active:scale-95 shadow-[#3F5A54]/20"
                                : "bg-gray-100 text-[#9CA3AF] cursor-not-allowed border-none"
                        )}
                    >
                        VALIDATE
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full min-h-screen relative pb-24">
            {/* Top Back Button */}
            <div className="flex mt-[24px] ml-[40px] h-[69px]">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-[10px] text-[#3F5A54] hover:text-black transition-colors h-fit"
                >
                    <MoveLeft className="w-[20px]" />
                    <span className="text-[14px] font-medium text-[#3F5A54] w-[35px]">Back</span>
                </button>
            </div>

            <div className="px-[40px] w-full max-w-[1440px] mx-auto">
                {/* Header Sequence */}
                <div className="flex items-center justify-between">
                    <h1 className="text-[20px] h-[30px] w-[283px] font-semibold text-[#1F2937]">Add Staff Account Numbers</h1>
                    <Button
                        variant="outline"
                        onClick={() => setShowBulkUpload(true)}
                        className="border-[#3F5A54] text-[#3F5A54] font-medium h-[43px] w-[146px]"
                    >
                        <p className="text-[14px] font-medium h-[21px] w-[123px]">Excel Bulk Upload</p>
                    </Button>
                </div>

                {/* Table Header Row */}
                <div className="flex gap-4 items-center mt-[30px] px-[20px] h-[39px] bg-[#F0F0F0] rounded-sm">
                    <span className="w-1/6 text-[10px] font-medium text-[#000000]">Staff Details</span>
                    <span className="w-1/6 text-[10px] font-medium text-[#000000]">Bank Name</span>
                    <span className="w-1/6 text-[10px] font-medium text-[#000000]">Account Holder Name</span>
                    <span className="w-1/6 text-[10px] font-medium text-[#000000]">Account Number</span>
                    <span className="w-1/6 text-[10px] font-medium text-[#000000]">Confirm Account Number</span>
                    <span className="w-1/6 text-[10px] font-medium text-[#000000]">IFSC Code</span>
                </div>

                <div className="mb-4">
                    <h2 className="text-[16px] h-[24px] font-medium text-[#4B5563] mt-[20px]">Employee Account Details</h2>

                    {/* Input Grid Form Container */}
                    <div className="border border-gray-200 mt-[18px] rounded-xl overflow-hidden shadow-sm">
                        {staffList.map((staff, index) => (
                            <div
                                key={staff.id}
                                className={cn(
                                    "flex gap-4 p-4 items-center bg-white",
                                    index !== staffList.length - 1 && "border-b border-gray-100"
                                )}
                            >
                                {/* Core Details Col */}
                                <div className="flex items-center gap-3 w-1/6">
                                    <div className={cn("flex shrink-0 items-center justify-center w-8 h-8 rounded-full text-[12px] font-semibold", staff.colorClass)}>
                                        {staff.initials}
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-[13px] font-medium text-[#1F2937] leading-tight truncate">{staff.name}</span>
                                        <span className="text-[10px] text-[#6B7280]">{staff.number}</span>
                                    </div>
                                </div>

                                {/* Inputs */}
                                <div className="w-1/6">
                                    <Input
                                        placeholder="Bank Name"
                                        className="h-[36px] w-full p-[10px] text-[10px] border-[#E5E7EB] placeholder:text-[#9CA3AF]"
                                        value={manualBankData[staff.id]?.bankName || ""}
                                        onChange={(e) => handleInputChange(staff.id, "bankName", e.target.value)}
                                    />
                                </div>
                                <div className="w-1/6">
                                    <Input
                                        placeholder="Account Holder Name"
                                        className="h-[36px] w-full p-[10px] text-[10px] border-[#E5E7EB] placeholder:text-[#9CA3AF]"
                                        value={manualBankData[staff.id]?.accountHolder || ""}
                                        onChange={(e) => handleInputChange(staff.id, "accountHolder", e.target.value)}
                                    />
                                </div>
                                <div className="w-1/6">
                                    <Input
                                        placeholder="Account Number"
                                        className="h-[36px] w-full p-[10px] text-[10px] border-[#E5E7EB] placeholder:text-[#9CA3AF]"
                                        value={manualBankData[staff.id]?.accountNumber || ""}
                                        onChange={(e) => handleInputChange(staff.id, "accountNumber", e.target.value)}
                                    />
                                </div>
                                <div className="w-1/6">
                                    <Input
                                        placeholder="Confirm Account Number"
                                        className={cn(
                                            "h-[36px] w-full p-[10px] text-[10px] border-[#E5E7EB] placeholder:text-[#9CA3AF]",
                                            manualBankData[staff.id]?.confirmAccountNumber && manualBankData[staff.id]?.confirmAccountNumber !== manualBankData[staff.id]?.accountNumber && "border-red-300 bg-red-50 focus:border-red-500"
                                        )}
                                        value={manualBankData[staff.id]?.confirmAccountNumber || ""}
                                        onChange={(e) => handleInputChange(staff.id, "confirmAccountNumber", e.target.value)}
                                    />
                                </div>
                                <div className="w-1/6">
                                    <Input
                                        placeholder="IFSC Code"
                                        className="h-[36px] w-full p-[10px] text-[10px] border-[#E5E7EB] placeholder:text-[#9CA3AF]"
                                        value={manualBankData[staff.id]?.ifscCode || ""}
                                        onChange={(e) => handleInputChange(staff.id, "ifscCode", e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Sticky Bottom Footer */}
            <div className="fixed bottom-0 right-0 h-[80px] bg-white border-t border-gray-200 flex items-center justify-between px-[40px] z-10 w-[calc(100%-80px)]">
                <p className="text-[16px] font-medium text-[#1F2937]">
                    Valid account details filled for <span className="font-semibold">{filledCount}</span> staff
                </p>
                <div className="flex items-center gap-[30px]">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/dashboard/admin/hrms/staff")}
                        className="h-[42px] w-[170px] border-[1.5px] border-[#3F5A54] text-[#3F5A54] hover:bg-emerald-50 rounded-xl transition-all font-bold flex items-center justify-center"
                    >
                        <span className="text-[14px]">Go to staff list</span>
                    </Button>
                    <Button
                        disabled={filledCount === 0}
                        onClick={handleManualSave}
                        className={cn(
                            "h-[42px] w-[170px] flex items-center justify-center transition-all rounded-xl shadow-lg",
                            filledCount > 0
                                ? "bg-[#3F5A54] hover:bg-[#2d4540] text-white font-bold text-[15px] hover:shadow-xl active:scale-95 shadow-[#3F5A54]/20"
                                : "bg-gray-100 text-[#9CA3AF] cursor-not-allowed border-none"
                        )}
                    >
                        SAVE & VALIDATE
                    </Button>
                </div>
            </div>

        </div>
    );
}
