"use client"

import React, { useState, useEffect } from "react";
import {
    ArrowLeft,
    Edit2,
    ChevronDown,
    AlertCircle,
    Trash2,
    UserX,
    UserCheck,
    Wallet,
    ChevronRight,
    Search,
    Plus,
    History,
    ChevronUp,
    MoreHorizontal,
    X,
    Calendar,
    CheckCircle2,
    Eye,
    Filter,
    UploadCloud,
    Download,
    Lock,
    MinusCircle,
    FileText,
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays, endOfMonth } from "date-fns";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { SalarySlipTemplate } from "./SalarySlipTemplate";
import Image from "next/image";
import CloudIcon from "@/assets/Dashicons/Cloud.png";
import { useSidebar } from "@/components/ui/sidebar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchEmployeeById, selectCurrentEmployee, selectEmployeeLoading, updateEmployee, deleteEmployee, clearError, addEmployeeDocument, removeEmployeeDocument } from "@/features/employee/employeeSlice";
import { getAllLoans } from "@/features/loan/loanSlice";
import {
    getEmployeeLeaveBalances,
    updateEmployeeLeaveBalance,
    markLeave,
    getLeavesHistoryByOrganization,
    selectLeaveBalances,
    selectOrganizationLeaveHistory,
    selectBalanceLoading,
    selectApplyLoading
} from "@/features/leave/leaveSlice";
import {
    getAllExpenses,
    deleteExpense,
    createEmployeeExpense,
    updateExpenseStatus,
    clearError as clearExpenseError,
} from "@/features/expenseBalance/expenseSlice";
import { fetchDepartments, selectDepartments } from "@/features/departments/departmentSlice";
import { getAllRoles, selectRoles } from "@/features/role/roleSlice";
import { fetchUsers, selectUsers } from "@/features/user/userSlice";
import { fetchAllTemplates } from "@/features/employee/templateSlice";
import { fetchSalaryActions, addSalaryAction, deleteSalaryAction, fetchEmployeePayrollHistory, selectSalaryActions, fetchPayrollOverview } from "@/features/salary/salarySlice";


export interface StaffData {
    id: string;
    // Profile Info
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    contactNumber: string;
    departmentId: string;
    userRoleTableId: string;
    leavePolicyId: string;

    empId: string;
    joiningDate: string;
    status: string;
    staffType: string;
    workType: string;
    workLocation: string;

    // Templates (General Info)
    shiftTemplateId: string;
    leaveTemplateId: string;
    holidayTemplateId: string;
    weeklyOffTemplateId: string;
    attendanceOnWeeklyOffTemplateId: string;
    attendanceOnHolidayTemplateId: string;

    // Salary (Employment Info)
    salary: { type: string; label: string; amount: number }[];

    // Personal Info
    gender: string;
    dob: string;
    maritalStatus: string;

    // Address
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;
    pincode: string;

    // Identity Documents
    aadhar: string;
    pan: string;
    passport: string;
    otherDocName: string;
    otherDocNumber: string;

    // Bank Details
    bankName: string;
    ifscCode: string;
    accountNumber: string;
    accountHolder: string;
    bankBranch: string;

    // Meta
    initials: string;
}

// --- Helper Components moved outside to prevent re-render focus issues ---
const SectionHeader = ({
    title,
    sectionId,
    isEditing,
    toggleEdit,
    handleSave,
    handleDiscard
}: {
    title: string,
    sectionId: string,
    isEditing: boolean,
    toggleEdit: (s: string) => void,
    handleSave: (s: string) => void,
    handleDiscard: (s: string) => void
}) => {
    return (
        <div className="flex items-center justify-between mb-[20px]">
            <h2 className="text-[16px] font-semibold text-[#1F2937]">{title}</h2>
            <div className="flex items-center gap-2">
                {isEditing ? (
                    <>
                        <Button
                            variant="outline"
                            onClick={() => handleDiscard(sectionId)}
                            className="h-[28px] px-4 text-[10px] font-medium border-gray-200 text-[#4B5563] rounded-md hover:bg-gray-50"
                        >
                            Discard
                        </Button>
                        <Button
                            onClick={() => handleSave(sectionId)}
                            className="h-[28px] px-4 text-[10px] font-medium bg-[#3F5A54] text-white rounded-md hover:bg-[#2c4440]"
                        >
                            Save
                        </Button>
                    </>
                ) : (
                    <Button
                        variant="outline"
                        onClick={() => toggleEdit(sectionId)}
                        className="h-[28px] px-4 gap-2 text-[#4B5563] border-gray-200 rounded-md bg-white hover:bg-gray-50 flex items-center shadow-sm"
                    >
                        <span className="text-[10px] font-medium">Edit</span>
                        <Edit2 size={10} className="text-[#9CA3AF]" />
                    </Button>
                )}
            </div>
        </div>
    );
};

const FormInput = ({
    label,
    field,
    staff,
    isEditing,
    onInputChange,
    displayValue,
    required = false,
    type = "text",
    options = []
}: {
    label: string,
    field: keyof StaffData,
    staff: StaffData,
    isEditing: boolean,
    onInputChange: (f: keyof StaffData, v: string) => void,
    displayValue?: string,
    required?: boolean,
    type?: string,
    options?: (string | { label: string; value: string })[]
}) => {
    const value = staff[field] as string;

    const parseDate = (dateStr: string) => {
        if (!dateStr || dateStr === "-") return null;
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? null : d;
    };

    return (
        <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[12px] font-medium text-[#4B5563] flex items-center gap-0.5 mb-1">
                {label} {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className={cn(
                "h-[36px] border rounded-md flex items-center px-3 transition-all",
                isEditing ? "border-[#E5E7EB] bg-white focus-within:border-[#3F5A54]" : "border-gray-100 bg-[#F9FAFB]/30"
            )}>
                {isEditing ? (
                    options.length > 0 ? (
                        <select
                            value={value}
                            onChange={(e) => onInputChange(field, e.target.value)}
                            className="w-full h-full bg-transparent text-[13px] font-regular text-[#1F2937] outline-none cursor-pointer px-0.5"
                        >
                            <option value="">Select {label}</option>
                            {options.map((opt, index) => {
                                const optLabel = typeof opt === "string" ? opt : opt.label;
                                const optValue = typeof opt === "string" ? opt : opt.value;
                                return <option key={`${optValue}-${index}`} value={optValue}>{optLabel}</option>;
                            })}
                        </select>
                    ) : type === "date" ? (
                        <input
                            type="date"
                            value={value === "-" ? "" : value}
                            onChange={(e) => onInputChange(field, e.target.value)}
                            className="w-full h-full bg-transparent text-[13px] font-regular text-[#1F2937] outline-none"
                        />
                    ) : (
                        <input
                            type={type}
                            value={value === "-" ? "" : value}
                            onChange={(e) => onInputChange(field, e.target.value)}
                            placeholder={label}
                            className="w-full h-full bg-transparent text-[13px] font-regular text-[#1F2937] outline-none"
                        />
                    )
                ) : (
                    <p className="text-[13px] font-medium text-[#1F2937] leading-tight break-words">
                        {(() => {
                            if (displayValue) return displayValue;
                            if (!value || value === "-") return "-";

                            if (type === "date") {
                                try {
                                    const dateObj = new Date(value);
                                    if (!isNaN(dateObj.getTime())) {
                                        return format(dateObj, "dd MMM yyyy");
                                    }
                                } catch (e) {
                                    // Fallback to raw value if date is invalid
                                }
                            }

                            const foundOpt = options.find(opt => {
                                const optValue = String(typeof opt === "string" ? opt : opt.value).toLowerCase();
                                return optValue === String(value).toLowerCase();
                            });

                            if (foundOpt) {
                                return typeof foundOpt === "string" ? foundOpt : foundOpt.label;
                            }

                            if (label.toLowerCase().includes("email") || (String(value).includes("@") && String(value).includes("."))) {
                                return String(value);
                            }
                            return String(value)
                                .split(/[ _-]/)
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                .join(' ');
                        })()}
                    </p>
                )}
            </div>
        </div>
    );
};

export default function EmployeeProfile({ id }: { id: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get("tab") || "Profile";
    const [activeTab, setActiveTab] = useState(initialTab);
    const [staff, setStaff] = useState<StaffData | null>(null);
    const [originalStaff, setOriginalStaff] = useState<StaffData | null>(null);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deactivateDate, setDeactivateDate] = useState("2026-01-16");

    const dispatch = useAppDispatch();
    const currentEmployee = useAppSelector(selectCurrentEmployee);
    const isLoading = useAppSelector(selectEmployeeLoading);
    const error = useAppSelector((state) => state.employee.error);

    const departments = useAppSelector(selectDepartments);
    const roles = useAppSelector(selectRoles);
    const users = useAppSelector(selectUsers);
    const {
        leaveTemplates,
        shiftTemplates,
        holidayTemplates,
        weeklyOffTemplates,
        attendanceOnWeekOffTemplates,
        attendanceOnHolidayTemplates
    } = useAppSelector((state: any) => state.templates);

    // Edit states for sections
    const [editingSections, setEditingSections] = useState<Record<string, boolean>>({});
    const [upcomingLeaves, setUpcomingLeaves] = useState<any[]>([]);
    const [previousLeaves, setPreviousLeaves] = useState<any[]>([]);
    const [documentFiles, setDocumentFiles] = React.useState<{ [key: string]: File | null }>({
        aadhar: null,
        pan: null,
        passport: null,
    });
    const [removedDocuments, setRemovedDocuments] = React.useState<Set<string>>(new Set());

    const handleFileChange = (field: string, file: File | null) => {
        setDocumentFiles(prev => ({ ...prev, [field]: file }));
    };

    const handleRemoveDocument = (field: string) => {
        setRemovedDocuments(prev => {
            const next = new Set(prev);
            next.add(field);
            return next;
        });
        setDocumentFiles(prev => ({ ...prev, [field]: null }));
    };

    useEffect(() => {
        if (id) {
            dispatch(fetchEmployeeById(id));
            dispatch(fetchDepartments({}));
            dispatch(getAllRoles());
            dispatch(fetchUsers());
            dispatch(fetchAllTemplates());
        }
        // Cleanup on unmount set to clear employee
        return () => {
            dispatch({ type: "employee/clearCurrentEmployee" });
        };
    }, [id, dispatch]);

    useEffect(() => {
        if (currentEmployee) {
            const safeFormat = (dateStr: any) => {
                try {
                    if (!dateStr) return format(new Date(), "yyyy-MM-dd");
                    return format(new Date(dateStr), "yyyy-MM-dd");
                } catch (e) {
                    return format(new Date(), "yyyy-MM-dd");
                }
            };

            const initialData: StaffData = {
                id: currentEmployee.id || (currentEmployee as any)._id || "",
                userId: currentEmployee.user?.id || "",
                firstName: currentEmployee.personal?.firstName || "",
                lastName: currentEmployee.personal?.lastName || "",
                email: currentEmployee.personal?.email || "",
                contactNumber: currentEmployee.personal?.phone || "",
                departmentId: currentEmployee.employment?.department?.id || "",
                userRoleTableId: currentEmployee.employment?.role?.id || "",
                leavePolicyId: "", // Field no longer clearly present in the formatted response

                empId: currentEmployee.employment?.employeeCode || "N/A",
                joiningDate: safeFormat(currentEmployee.employment?.joinDate),
                status: currentEmployee.employment?.status || "active",
                staffType: currentEmployee.employment?.employeeType || "REGULAR",
                workType: currentEmployee.employment?.workType || "Full-Time",
                workLocation: currentEmployee.employment?.workLocation || "",

                // Templates (Handling both nested formatted structure and flat populated response)
                shiftTemplateId: currentEmployee.templates?.shiftTemplate?.id || (currentEmployee.shiftTemplateId as any)?._id || currentEmployee.shiftTemplateId || "",
                leaveTemplateId: currentEmployee.templates?.leaveTemplate?.id || (currentEmployee.leaveTemplateId as any)?._id || currentEmployee.leaveTemplateId || "",
                holidayTemplateId: currentEmployee.templates?.holidayTemplate?.id || (currentEmployee.holidayTemplateId as any)?._id || currentEmployee.holidayTemplateId || "",
                weeklyOffTemplateId: currentEmployee.templates?.weeklyOffTemplate?.id || (currentEmployee.weeklyOffTemplateId as any)?._id || currentEmployee.weeklyOffTemplateId || "",
                attendanceOnWeeklyOffTemplateId: currentEmployee.templates?.attendanceOnWeeklyOff?.id || (currentEmployee.attendanceOnWeeklyOffTemplateId as any)?._id || currentEmployee.attendanceOnWeeklyOffTemplateId || "",
                attendanceOnHolidayTemplateId: currentEmployee.templates?.attendanceOnHoliday?.id || (currentEmployee.attendanceOnHolidayTemplateId as any)?._id || currentEmployee.attendanceOnHolidayTemplateId || "",

                // Salary
                salary: currentEmployee.salary && currentEmployee.salary.length > 0
                    ? currentEmployee.salary
                    : [
                        { type: "basic", label: "Basic Pay", amount: 0 },
                        { type: "hra", label: "House Rent Allowance", amount: 0 },
                        { type: "allowance", label: "Other Allowance", amount: 0 },
                        { type: "deduction", label: "Statutory Deduction", amount: 0 },
                    ],

                gender: currentEmployee.personal?.gender?.toUpperCase() || "MALE",
                dob: safeFormat(currentEmployee.personal?.dob),
                maritalStatus: currentEmployee.personal?.maritalStatus || "",

                addressLine1: currentEmployee.personal?.address?.line1 || "",
                addressLine2: currentEmployee.personal?.address?.line2 || "",
                city: currentEmployee.personal?.address?.city || "",
                state: currentEmployee.personal?.address?.state || "",
                country: currentEmployee.personal?.address?.country || "India",
                pincode: currentEmployee.personal?.address?.pincode || "",

                aadhar: currentEmployee.documents?.find(d => d.type === "aadhaar")?.number || "",
                pan: currentEmployee.documents?.find(d => d.type === "pan")?.number || "",
                passport: currentEmployee.documents?.find(d => d.type === "passport")?.number || "",
                otherDocName: currentEmployee.documents?.find(d => d.type !== "aadhaar" && d.type !== "pan" && d.type !== "passport")?.type || "",
                otherDocNumber: currentEmployee.documents?.find(d => d.type !== "aadhaar" && d.type !== "pan" && d.type !== "passport")?.number || "",
                bankName: currentEmployee.bank?.bankName || "",
                ifscCode: currentEmployee.bank?.ifsc || "",
                accountNumber: currentEmployee.bank?.accountNumber || "",
                accountHolder: currentEmployee.bank?.accountHolderName || "",
                bankBranch: currentEmployee.bank?.branch || "",

                initials: [currentEmployee.personal?.firstName?.[0], currentEmployee.personal?.lastName?.[0]]
                    .filter(Boolean)
                    .join("")
                    .toUpperCase() || "?"
            };
            setStaff(initialData);
            setOriginalStaff(initialData);
        }
    }, [currentEmployee]);

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#F9FAFB] text-gray-400 gap-4">
            <svg className="animate-spin h-8 w-8 text-[#3F5A54]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm font-medium">Loading profile details...</p>
        </div>
    );

    if (error && !staff) return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#F9FAFB] text-gray-400 gap-4">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <div className="flex flex-col items-center gap-2">
                <p className="text-[16px] font-semibold text-[#1F2937]">Profile Error</p>
                <p className="text-sm">{error || "Could not load employee details."}</p>
            </div>
            <Button onClick={() => router.back()} className="mt-4 bg-[#3F5A54]">Go Back</Button>
        </div>
    );

    if (!staff) return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#F9FAFB] text-gray-400 gap-4">
            <Search className="h-10 w-10 text-gray-300" />
            <p className="text-sm font-medium">Employee not found.</p>
            <Button onClick={() => router.back()} className="mt-4 bg-[#3F5A54]">Go Back</Button>
        </div>
    );

    const sidebarItems = [
        { label: "Profile" },
        { label: "Attendance" },
        { label: "Salary Overview" },
        { label: "Salary Structure" },
        { label: "Loans" },
        { label: "Leave(s)" },
        { label: "Expense Claims" },
        { label: "Document Centre" },
    ];

    const toggleEdit = (section: string) => {
        setEditingSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleSave = async (section: string) => {
        if (!staff || !id) return;

        // Construct standard sub-objects to prevent backend spread-deletion
        const personal = staff ? {
            firstName: staff.firstName,
            lastName: staff.lastName || "",
            email: staff.email || "",
            phone: staff.contactNumber || "",
            gender: (staff.gender || "MALE").toLowerCase(),
            dob: staff.dob,
            maritalStatus: (staff.maritalStatus || "single").toLowerCase(),
            address: {
                line1: staff.addressLine1 || "",
                line2: staff.addressLine2 || "",
                city: staff.city || "",
                state: staff.state || "",
                country: staff.country || "India",
                pincode: staff.pincode || "",
            }
        } : null;

        const employment = staff ? {
            employeeCode: staff.empId,
            departmentId: staff.departmentId || undefined,
            userRoleTableId: staff.userRoleTableId || undefined,
            joinDate: staff.joiningDate,
            employeeType: staff.staffType as any,
            workType: staff.workType as any,
            status: (staff.status || "active").toLowerCase() as any,
            workLocation: staff.workLocation || "",
        } : null;

        const bank = staff ? {
            bankName: staff.bankName || "",
            ifsc: staff.ifscCode || "",
            accountNumber: staff.accountNumber || "",
            accountHolderName: staff.accountHolder || "",
            branch: staff.bankBranch || "",
        } : null;

        const docTypeMap: Record<string, string> = {
            aadhar: "aadhaar",
            pan: "pan",
            passport: "passport",
        };

        const documents = staff ? [
            ...(staff.aadhar && !removedDocuments.has("aadhar") ? [{ type: "aadhaar", number: staff.aadhar, verified: false, proof: currentEmployee?.documents?.find(d => d.type === "aadhaar")?.proof }] : []),
            ...(staff.pan && !removedDocuments.has("pan") ? [{ type: "pan", number: staff.pan, verified: false, proof: currentEmployee?.documents?.find(d => d.type === "pan")?.proof }] : []),
            ...(staff.passport && !removedDocuments.has("passport") ? [{ type: "passport", number: staff.passport, verified: false, proof: currentEmployee?.documents?.find(d => d.type === "passport")?.proof }] : []),
            ...(staff.otherDocName && staff.otherDocNumber && !removedDocuments.has("other") ? [{ type: staff.otherDocName, number: staff.otherDocNumber, verified: false, proof: currentEmployee?.documents?.find(d => d.type !== "aadhaar" && d.type !== "pan" && d.type !== "passport")?.proof }] : []),
        ] : [];

        const files = new FormData();
        if (section === "idInfo") {
            const docFields = ["aadhar", "pan", "passport", "other"];
            docFields.forEach((docId, index) => {
                if (documentFiles[docId]) {
                    files.append(`documents[${index}][proof]`, documentFiles[docId]!);
                }
            });
        }

        // Group data based on section to avoid touching irrelevant fields
        let employeeData: any = {};
        if (section === "profileInfo") {
            employeeData = { personal, employment: { ...employment, employeeCode: staff.empId }, userId: staff.userId || undefined };
        } else if (section === "employmentInfo") {
            employeeData = {
                employment: {
                    ...employment,
                },
                salary: staff.salary,
            };
        } else if (section === "generalInfo") {
            employeeData = {
                leaveTemplateId: typeof staff.leaveTemplateId === 'object' ? (staff.leaveTemplateId as any)?._id : staff.leaveTemplateId || undefined,
                shiftTemplateId: typeof staff.shiftTemplateId === 'object' ? (staff.shiftTemplateId as any)?._id : staff.shiftTemplateId || undefined,
                holidayTemplateId: typeof staff.holidayTemplateId === 'object' ? (staff.holidayTemplateId as any)?._id : staff.holidayTemplateId || undefined,
                weeklyOffTemplateId: typeof staff.weeklyOffTemplateId === 'object' ? (staff.weeklyOffTemplateId as any)?._id : staff.weeklyOffTemplateId || undefined,
                attendanceOnWeeklyOffTemplateId: typeof staff.attendanceOnWeeklyOffTemplateId === 'object' ? (staff.attendanceOnWeeklyOffTemplateId as any)?._id : staff.attendanceOnWeeklyOffTemplateId || undefined,
                attendanceOnHolidayTemplateId: typeof staff.attendanceOnHolidayTemplateId === 'object' ? (staff.attendanceOnHolidayTemplateId as any)?._id : staff.attendanceOnHolidayTemplateId || undefined,
            };
        } else if (section === "personalInfo" || section === "addressInfo") {
            employeeData = { personal };
        } else if (section === "bankInfo") {
            employeeData = { bank };
        } else if (section === "idInfo") {
            employeeData = { documents };
        }

        dispatch(clearError());
        const result = await dispatch(updateEmployee({ employeeId: id, employeeData, files: section === "idInfo" ? files : undefined }));

        if (updateEmployee.fulfilled.match(result)) {
            if (section === "idInfo") {
                setDocumentFiles({ aadhar: null, pan: null, passport: null });
                setRemovedDocuments(new Set());
            }
            const updatedStaff = {
                ...staff,
                initials: [(staff.firstName || "")[0], (staff.lastName || "")[0]].filter(Boolean).join("").toUpperCase() || "?"
            };
            setStaff(updatedStaff);
            setOriginalStaff(updatedStaff);
            toast.success(`${section} updated successfully`);
            toggleEdit(section);
        } else {
            toast.error(error || "Failed to update employee details.");
        }
    };

    const handleDiscard = (section: string) => {
        setEditingSections(prev => ({ ...prev, [section]: false }));
        if (originalStaff) setStaff({ ...originalStaff });
        if (section === "idInfo") {
            setDocumentFiles({ aadhar: null, pan: null, passport: null });
            setRemovedDocuments(new Set());
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        dispatch(clearError());
        const result = await dispatch(deleteEmployee(id));
        if (deleteEmployee.fulfilled.match(result)) {
            toast.success("Employee deleted successfully");
            router.push("/dashboard/admin/hrms/staff");
        } else {
            toast.error(error || "Failed to delete employee.");
        }
        setShowDeleteModal(false);
    };

    const handleInputChange = (field: keyof StaffData, value: string) => {
        setStaff(prev => prev ? ({ ...prev, [field]: value }) : null);
    };

    const handleUpdateStatus = async (newStatus: string) => {
        if (!staff || !id) return;

        dispatch(clearError());
        const employeeData = {
            employment: {
                status: newStatus.toLowerCase(),
            }
        };

        const result = await dispatch(updateEmployee({ employeeId: id, employeeData: employeeData as any }));

        if (updateEmployee.fulfilled.match(result)) {
            const updatedStaff = { ...staff, status: newStatus };
            setStaff(updatedStaff);
            setOriginalStaff(updatedStaff);
            toast.success(`Staff ${newStatus === "Active" ? "activated" : "deactivated"} successfully`);
            setShowDeactivateModal(false);
        } else {
            toast.error(error || "Failed to update status.");
        }
    };

    return (
        <div className="flex flex-col min-h-[1000px] bg-[#F9FAFB] p-[40px] pb-[80px] font-sans">
            {/* Header */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[#4B5563] hover:text-[#1F2937] transition-colors mb-6 w-fit"
            >
                <ArrowLeft size={16} />
                <span className="text-[12px] font-medium">Back</span>
            </button>

            {/* Profile Banner */}
            {originalStaff && (
                <div className="bg-white border border-gray-200 rounded-xl px-6 mb-8 flex items-center justify-between shadow-sm h-[101px]">
                    <div className="flex items-center gap-4">
                        <div className="w-[50px] h-[50px] rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center font-bold text-lg uppercase shadow-sm">
                            {originalStaff.initials}
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-[18px] font-bold text-[#1F2937] tracking-tight">
                                {originalStaff.firstName} {originalStaff.lastName}
                            </h1>
                            <div className="flex items-center gap-2 text-[11px] text-[#6B7280] font-medium mt-0.5">
                                <span>ID: {originalStaff.empId}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span>{originalStaff.staffType}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className={cn(
                                    "px-2 rounded-full",
                                    originalStaff.status.toLowerCase() === "active" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                                )}>
                                    {originalStaff.status.charAt(0).toUpperCase() + originalStaff.status.slice(1)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2 border-gray-200 bg-white text-[#1F2937] font-semibold h-[36px] px-4 rounded-lg hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                                    Actions <ChevronDown size={16} className="text-[#6B7280]" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px] p-1.5 rounded-xl border-gray-200 shadow-xl">
                                <DropdownMenuItem
                                    className="gap-3 py-2 cursor-pointer text-[#4B5563] font-medium text-[12px] hover:bg-slate-50"
                                    onClick={() => {
                                        if (staff?.status === "Inactive") {
                                            handleUpdateStatus("Active");
                                        } else {
                                            setShowDeactivateModal(true);
                                        }
                                    }}
                                >
                                    {staff?.status === "Inactive" ? (
                                        <UserCheck size={14} className="text-[#3B82F6]" />
                                    ) : (
                                        <UserX size={14} className="text-[#9CA3AF]" />
                                    )}
                                    {staff?.status === "Inactive" ? "Activate Staff" : "Deactivate Staff"}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-3 py-2 cursor-pointer text-red-600 font-medium text-[12px] hover:bg-red-50" onClick={() => setShowDeleteModal(true)}>
                                    <Trash2 size={14} /> Delete Staff
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-0 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="w-full lg:w-[180px] flex flex-col gap-1 p-5 shrink-0 bg-white border-r border-[#F3F4F6]">
                    {sidebarItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => {
                                if (item.label === "Attendance") {
                                    router.push(`/dashboard/admin/hrms/staff/${id}/attendance`);
                                } else {
                                    setActiveTab(item.label);
                                }
                            }}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-medium text-[11px] text-left",
                                activeTab === item.label ? "bg-[#EBF5F3] text-[#3F5A54]" : "text-[#6B7280] hover:bg-gray-50"
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 flex flex-col p-8 bg-white min-h-[600px]">
                    {activeTab === "Profile" ? (
                        <div className="flex flex-col max-w-[1200px]">
                            {/* Profile Information */}
                            <div className="flex flex-col gap-1.5 pb-8 border-b border-[#E5E7EB]">
                                <SectionHeader
                                    title="Profile Information"
                                    sectionId="profileInfo"
                                    isEditing={!!editingSections.profileInfo}
                                    toggleEdit={toggleEdit}
                                    handleSave={handleSave}
                                    handleDiscard={handleDiscard}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-12">
                                    <FormInput
                                        label="System User"
                                        field="userId"
                                        required
                                        staff={staff}
                                        isEditing={!!editingSections.profileInfo}
                                        onInputChange={handleInputChange}
                                        displayValue={(() => {
                                            const foundUser = users.find(u => u._id === staff.userId || u.user_id?._id === staff.userId);
                                            if (foundUser) return foundUser.user_id?.name || foundUser.name;

                                            const populated = currentEmployee?.user;
                                            if (populated && typeof populated === 'object') {
                                                return (populated as any).name || (populated as any).username || (populated as any).email;
                                            }
                                            return staff.userId || "Not Linked";
                                        })()}
                                        options={users.map(u => ({
                                            label: u.user_id?.name || u.name || "Unknown",
                                            value: u.user_id?._id || u._id
                                        }))}
                                    />
                                    <FormInput label="First Name" field="firstName" required staff={staff} isEditing={!!editingSections.profileInfo} onInputChange={handleInputChange} />
                                    <FormInput label="Last Name" field="lastName" staff={staff} isEditing={!!editingSections.profileInfo} onInputChange={handleInputChange} />
                                    <FormInput label="Email" field="email" staff={staff} isEditing={!!editingSections.profileInfo} onInputChange={handleInputChange} />
                                    <FormInput
                                        label="Department"
                                        field="departmentId"
                                        required
                                        staff={staff}
                                        isEditing={!!editingSections.profileInfo}
                                        onInputChange={handleInputChange}
                                        displayValue={departments.find(d => d._id === staff.departmentId)?.name}
                                        options={departments.map(d => ({ label: d.name, value: d._id }))}
                                    />
                                    <FormInput
                                        label="Role"
                                        field="userRoleTableId"
                                        required
                                        staff={staff}
                                        isEditing={!!editingSections.profileInfo}
                                        onInputChange={handleInputChange}
                                        displayValue={roles.find(r => r._id === staff.userRoleTableId)?.roleName}
                                        options={roles.map(r => ({ label: r.roleName, value: r._id }))}
                                    />
                                    <FormInput label="Contact Number" field="contactNumber" required staff={staff} isEditing={!!editingSections.profileInfo} onInputChange={handleInputChange} />
                                    <FormInput label="Employee Code" field="empId" required staff={staff} isEditing={!!editingSections.profileInfo} onInputChange={handleInputChange} />
                                </div>
                            </div>

                            {/* Employment Information */}
                            <div className="flex flex-col gap-1.5 pt-8 pb-8 border-b border-[#E5E7EB]">
                                <SectionHeader
                                    title="Employment Information"
                                    sectionId="employmentInfo"
                                    isEditing={!!editingSections.employmentInfo}
                                    toggleEdit={toggleEdit}
                                    handleSave={handleSave}
                                    handleDiscard={handleDiscard}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-12">
                                    <FormInput
                                        label="Employee Type"
                                        field="staffType"
                                        required
                                        staff={staff}
                                        isEditing={!!editingSections.employmentInfo}
                                        onInputChange={handleInputChange}
                                        options={[{ label: "Regular", value: "REGULAR" }, { label: "Contractual", value: "CONTRACTUAL" }]}
                                    />
                                    <FormInput label="Date of Joining" field="joiningDate" required type="date" staff={staff} isEditing={!!editingSections.employmentInfo} onInputChange={handleInputChange} />
                                    <FormInput
                                        label="Employment Status"
                                        field="status"
                                        staff={staff}
                                        isEditing={!!editingSections.employmentInfo}
                                        onInputChange={handleInputChange}
                                        options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }, { label: "Terminated", value: "terminated" }]}
                                    />
                                    <FormInput
                                        label="Work Type"
                                        field="workType"
                                        staff={staff}
                                        isEditing={!!editingSections.employmentInfo}
                                        onInputChange={handleInputChange}
                                        options={["Full-Time", "Intern", "Probation", "Notice"]}
                                    />
                                    <FormInput label="Work Location" staff={staff} field="workLocation" isEditing={!!editingSections.employmentInfo} onInputChange={handleInputChange} />

                                    {staff.salary.map((item, index) => (
                                        <div key={item.type} className="flex flex-col gap-1.5 w-full">
                                            <label className="text-[12px] font-medium text-[#4B5563] flex items-center gap-0.5 mb-1">
                                                {item.label}
                                            </label>
                                            <div className={cn(
                                                "h-[36px] border rounded-md flex items-center px-3 transition-all",
                                                editingSections.employmentInfo ? "border-[#E5E7EB] bg-white focus-within:border-[#3F5A54]" : "border-gray-100 bg-[#F9FAFB]/30"
                                            )}>
                                                {editingSections.employmentInfo ? (
                                                    <input
                                                        type="number"
                                                        value={item.amount || ""}
                                                        onChange={(e) => {
                                                            const newSalary = [...staff.salary];
                                                            newSalary[index] = { ...item, amount: Number(e.target.value) };
                                                            handleInputChange("salary" as any, newSalary as any);
                                                        }}
                                                        className="w-full h-full bg-transparent text-[13px] font-regular text-[#1F2937] outline-none"
                                                    />
                                                ) : (
                                                    <p className="text-[13px] font-medium text-[#1F2937] leading-tight">
                                                        {item.amount || 0}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* General Information (Templates) */}
                            <div className="flex flex-col gap-1.5 pt-8 pb-8 border-b border-[#E5E7EB]">
                                <SectionHeader
                                    title="General Information (Templates)"
                                    sectionId="generalInfo"
                                    isEditing={!!editingSections.generalInfo}
                                    toggleEdit={toggleEdit}
                                    handleSave={handleSave}
                                    handleDiscard={handleDiscard}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-12">
                                    <FormInput
                                        label="Leave Template"
                                        field="leaveTemplateId"
                                        required
                                        staff={staff}
                                        isEditing={!!editingSections.generalInfo}
                                        onInputChange={handleInputChange}
                                        displayValue={leaveTemplates.find((t: any) => t._id === staff.leaveTemplateId)?.name}
                                        options={leaveTemplates.map((t: any) => ({ label: t.name, value: t._id }))}
                                    />
                                    <FormInput
                                        label="Office Shift Template"
                                        field="shiftTemplateId"
                                        required
                                        staff={staff}
                                        isEditing={!!editingSections.generalInfo}
                                        onInputChange={handleInputChange}
                                        displayValue={shiftTemplates.find((t: any) => t._id === staff.shiftTemplateId)?.name}
                                        options={shiftTemplates.map((t: any) => ({ label: t.name, value: t._id }))}
                                    />
                                    <FormInput
                                        label="Holiday Template"
                                        field="holidayTemplateId"
                                        staff={staff}
                                        isEditing={!!editingSections.generalInfo}
                                        onInputChange={handleInputChange}
                                        displayValue={holidayTemplates.find((t: any) => t._id === staff.holidayTemplateId)?.name}
                                        options={holidayTemplates.map((t: any) => ({ label: t.name, value: t._id }))}
                                    />
                                    <FormInput
                                        label="Weekly Off Template"
                                        field="weeklyOffTemplateId"
                                        staff={staff}
                                        isEditing={!!editingSections.generalInfo}
                                        onInputChange={handleInputChange}
                                        displayValue={weeklyOffTemplates.find((t: any) => t._id === staff.weeklyOffTemplateId)?.name}
                                        options={weeklyOffTemplates.map((t: any) => ({ label: t.name, value: t._id }))}
                                    />
                                    <FormInput
                                        label="Weekly Off Attendance"
                                        field="attendanceOnWeeklyOffTemplateId"
                                        staff={staff}
                                        isEditing={!!editingSections.generalInfo}
                                        onInputChange={handleInputChange}
                                        displayValue={attendanceOnWeekOffTemplates.find((t: any) => t._id === staff.attendanceOnWeeklyOffTemplateId)?.name}
                                        options={attendanceOnWeekOffTemplates.map((t: any) => ({ label: t.name, value: t._id }))}
                                    />
                                    <FormInput
                                        label="Holiday Attendance"
                                        field="attendanceOnHolidayTemplateId"
                                        staff={staff}
                                        isEditing={!!editingSections.generalInfo}
                                        onInputChange={handleInputChange}
                                        displayValue={attendanceOnHolidayTemplates.find((t: any) => t._id === staff.attendanceOnHolidayTemplateId)?.name}
                                        options={attendanceOnHolidayTemplates.map((t: any) => ({ label: t.name, value: t._id }))}
                                    />
                                </div>
                            </div>

                            {/* Personal Information */}
                            <div className="flex flex-col gap-1.5 pt-8 pb-8 border-b border-[#E5E7EB]">
                                <SectionHeader
                                    title="Personal Information"
                                    sectionId="personalInfo"
                                    isEditing={!!editingSections.personalInfo}
                                    toggleEdit={toggleEdit}
                                    handleSave={handleSave}
                                    handleDiscard={handleDiscard}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-12">
                                    <FormInput label="Gender" field="gender" staff={staff} isEditing={!!editingSections.personalInfo} onInputChange={handleInputChange} options={[{ label: "Male", value: "male" }, { label: "Female", value: "female" }, { label: "Other", value: "other" }]} />
                                    <FormInput label="Date of Birth" field="dob" type="date" staff={staff} isEditing={!!editingSections.personalInfo} onInputChange={handleInputChange} />
                                    <FormInput label="Marital Status" field="maritalStatus" staff={staff} isEditing={!!editingSections.personalInfo} onInputChange={handleInputChange} options={[{ label: "Single", value: "single" }, { label: "Married", value: "married" }, { label: "Divorced", value: "divorced" }]} />
                                </div>
                            </div>

                            {/* Address Information */}
                            <div className="flex flex-col gap-1.5 pt-8 pb-8 border-b border-[#E5E7EB]">
                                <SectionHeader
                                    title="Address"
                                    sectionId="addressInfo"
                                    isEditing={!!editingSections.addressInfo}
                                    toggleEdit={toggleEdit}
                                    handleSave={handleSave}
                                    handleDiscard={handleDiscard}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-12">
                                    <FormInput label="Address Line 1" field="addressLine1" staff={staff} isEditing={!!editingSections.addressInfo} onInputChange={handleInputChange} />
                                    <FormInput label="Address Line 2" field="addressLine2" staff={staff} isEditing={!!editingSections.addressInfo} onInputChange={handleInputChange} />
                                    <FormInput label="City" field="city" staff={staff} isEditing={!!editingSections.addressInfo} onInputChange={handleInputChange} />
                                    <FormInput label="State" field="state" staff={staff} isEditing={!!editingSections.addressInfo} onInputChange={handleInputChange} />
                                    <FormInput label="Country" field="country" staff={staff} isEditing={!!editingSections.addressInfo} onInputChange={handleInputChange} />
                                    <FormInput label="Pincode" field="pincode" staff={staff} isEditing={!!editingSections.addressInfo} onInputChange={handleInputChange} />
                                </div>
                            </div>

                            {/* Identity Documents */}
                            <div className="flex flex-col gap-1.5 pt-8 pb-8 border-b border-[#E5E7EB]">
                                <SectionHeader
                                    title="Identity Documents (Upload)"
                                    sectionId="idInfo"
                                    isEditing={!!editingSections.idInfo}
                                    toggleEdit={toggleEdit}
                                    handleSave={handleSave}
                                    handleDiscard={handleDiscard}
                                />
                                <div className="flex flex-col gap-[30px]">
                                    {["aadhar", "pan", "passport", "other"].map((docId) => {
                                        const labelMap: Record<string, string> = {
                                            aadhar: "Aadhar Card",
                                            pan: "PAN Card",
                                            passport: "Passport",
                                            other: staff.otherDocName || "Other Document",
                                        };
                                        const docTypeMap: Record<string, string> = {
                                            aadhar: "aadhaar",
                                            pan: "pan",
                                            passport: "passport",
                                            other: staff.otherDocName || "other",
                                        };
                                        const existingProof = currentEmployee?.documents?.find(d => d.type === docTypeMap[docId])?.proof;

                                        return (
                                            <div key={docId} className={cn(
                                                "grid gap-[40px] items-end",
                                                docId === "other" && editingSections.idInfo ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
                                            )}>
                                                {docId === "other" && editingSections.idInfo && (
                                                    <div className="flex flex-col gap-1.5 w-full">
                                                        <label className="text-[12px] font-medium text-[#4B5563] flex items-center gap-0.5 mb-1">
                                                            Other Document Name
                                                        </label>
                                                        <input
                                                            value={staff.otherDocName}
                                                            onChange={(e) => handleInputChange("otherDocName", e.target.value)}
                                                            placeholder="e.g. Voter ID"
                                                            className="h-[36px] border border-[#E5E7EB] rounded-md px-3 text-[13px] outline-none focus:border-[#3F5A54]"
                                                        />
                                                    </div>
                                                )}
                                                <FormInput
                                                    label={docId === "other" && editingSections.idInfo ? "Document Number" : `${labelMap[docId]} Number`}
                                                    field={docId === "other" ? "otherDocNumber" : docId as keyof StaffData}
                                                    staff={staff}
                                                    isEditing={!!editingSections.idInfo}
                                                    onInputChange={handleInputChange}
                                                />
                                                <div className="flex flex-col gap-1.5 w-full">
                                                    <label className="text-[13px] font-medium text-[#4B5563] flex items-center gap-0.5 mb-1">
                                                        {docId === "other" && editingSections.idInfo ? "Upload Document" : `${labelMap[docId]} Proof`}
                                                    </label>
                                                    <div className={cn(
                                                        "h-[36px] border rounded-md flex items-center px-3 transition-all transition-colors",
                                                        editingSections.idInfo ? "border-[#E5E7EB] bg-white focus-within:border-[#3F5A54]" : "border-gray-100 bg-[#F9FAFB]/30"
                                                    )}>
                                                        {editingSections.idInfo ? (
                                                            (existingProof?.url && !removedDocuments.has(docId)) ? (
                                                                <div className="flex items-center justify-between w-full">
                                                                    <div className="flex items-center gap-2">
                                                                        <FileText size={14} className="text-[#6B7280]" />
                                                                        <span className="text-[13px] font-medium text-[#3F5A54] truncate max-w-[120px]">
                                                                            {existingProof.url.split('/').pop()?.split('?')[0] || "Document"}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <a
                                                                            href={existingProof.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="p-1.5 hover:bg-gray-100 rounded-md text-[#6B7280] hover:text-[#3F5A54] transition-all"
                                                                        >
                                                                            <Eye size={16} />
                                                                        </a>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveDocument(docId)}
                                                                            className="p-1.5 hover:bg-red-50 rounded-md text-[#6B7280] hover:text-red-500 transition-all"
                                                                        >
                                                                            <X size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <input
                                                                    type="file"
                                                                    onChange={(e) => handleFileChange(docId, e.target.files?.[0] || null)}
                                                                    className="w-full h-full bg-transparent text-[13px] font-regular text-[#1F2937] outline-none pt-1 file:mr-4 file:py-0 file:px-2 file:rounded-full file:border-0 file:text-[11px] file:font-semibold file:bg-[#3F5A54] file:text-white hover:file:bg-[#2d4540] cursor-pointer"
                                                                />
                                                            )
                                                        ) : (
                                                            existingProof?.url ? (
                                                                <a
                                                                    href={existingProof.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 text-[13px] font-medium text-[#3F5A54] hover:underline w-full h-full"
                                                                >
                                                                    <Eye size={16} />
                                                                    View Document
                                                                </a>
                                                            ) : (
                                                                <span className="text-[13px] font-medium text-gray-400">No Document Uploaded</span>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Bank Details */}
                            <div className="flex flex-col gap-1.5 pt-8 pb-8 border-b border-[#E5E7EB]">
                                <SectionHeader
                                    title="Bank Details"
                                    sectionId="bankInfo"
                                    isEditing={!!editingSections.bankInfo}
                                    toggleEdit={toggleEdit}
                                    handleSave={handleSave}
                                    handleDiscard={handleDiscard}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-12">
                                    <FormInput label="Bank Name" field="bankName" staff={staff} isEditing={!!editingSections.bankInfo} onInputChange={handleInputChange} />
                                    <FormInput label="IFSC Code" field="ifscCode" staff={staff} isEditing={!!editingSections.bankInfo} onInputChange={handleInputChange} />
                                    <FormInput label="Account Number" field="accountNumber" staff={staff} isEditing={!!editingSections.bankInfo} onInputChange={handleInputChange} />
                                    <FormInput label="Account Holder's Name" field="accountHolder" staff={staff} isEditing={!!editingSections.bankInfo} onInputChange={handleInputChange} />
                                    <FormInput label="Bank Branch" field="bankBranch" staff={staff} isEditing={!!editingSections.bankInfo} onInputChange={handleInputChange} />
                                </div>
                            </div>
                        </div>

                    ) : activeTab === "Salary Overview" ? (
                        <SalaryOverview staff={staff} />
                    ) : activeTab === "Salary Structure" ? (
                        <SalaryStructure staff={staff} id={id} />
                    ) : activeTab === "Loans" ? (
                        <LoansSection id={id} />
                    ) : activeTab === "Leave(s)" ? (
                        <LeavesSection id={id} staff={staff} />
                    ) : activeTab === "Expense Claims" ? (
                        <ExpenseClaimsSection id={id} staff={staff} />
                    ) : activeTab === "Document Centre" ? (
                        <DocumentCentreSection id={id} />
                    ) : (
                        <div className="bg-white p-24 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center shadow-sm">
                            <h3 className="text-[16px] font-bold text-[#1F2937] mb-2">{activeTab} Section</h3>
                            <p className="text-[11px] text-gray-400 max-w-[280px]">Coming soon.</p>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={showDeactivateModal} onOpenChange={setShowDeactivateModal}>
                <DialogContent className="sm:max-w-[380px] p-0 overflow-hidden rounded-2xl border-none shadow-xl">
                    <div className="p-6">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-[18px] font-bold text-[#1F2937]">Deactivate Staff</DialogTitle>
                            <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mt-1">Staff deactivated</p>
                        </DialogHeader>
                        <div className="space-y-4 text-left">
                            <label className="text-[11px] font-bold text-[#4B5563] uppercase">Date</label>
                            <input type="date" value={deactivateDate} onChange={(e) => setDeactivateDate(e.target.value)} className="h-[36px] w-full border border-gray-200 rounded-md px-3 text-[10px] outline-none" />
                        </div>
                    </div>
                    <div className="p-6 pt-0"><Button className="w-full h-[44px] bg-[#3B82F6] text-white font-bold rounded-xl" onClick={() => handleUpdateStatus("Inactive")}>Save</Button></div>
                </DialogContent>
            </Dialog>

            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-2xl border-none shadow-xl">
                    <div className="p-8 pb-4">
                        <DialogHeader className="mb-6 text-left">
                            <DialogTitle className="text-[20px] font-bold text-[#1F2937] mb-3">Delete Regular Staff</DialogTitle>
                            <p className="text-[#6B7280] text-sm leading-relaxed font-semibold">By deleting, you would lose the staff data from reports.</p>
                        </DialogHeader>
                    </div>
                    <div className="p-8 pt-4 flex gap-4 text-left">
                        <DialogClose asChild><Button variant="outline" className="flex-1 h-[48px] font-bold rounded-xl text-sm transition-all hover:bg-gray-50">Cancel</Button></DialogClose>
                        <Button className="flex-1 h-[48px] bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl text-sm transition-all" onClick={handleDelete}>Delete</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function SalaryOverview({ staff }: { staff: StaffData | null }) {
    const router = useRouter();
    const params = useParams();
    const id = params.id;
    const [isActionOpen, setIsActionOpen] = useState(false);
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState("Earnings");
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
    const dispatch = useAppDispatch();
    const salaryActions = useAppSelector(selectSalaryActions);

    // Form states for PDF generation
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState("Standard");
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownloadPDF = async () => {
        if (!staff || !selectedYear || !selectedMonth) return;

        setIsGenerating(true);
        const toastId = toast.loading("Processing salary slip PDF...");

        try {
            // Give time for hidden template to mount and populate
            await new Promise(resolve => setTimeout(resolve, 1500));

            const element = document.getElementById("salary-slip-pdf-hidden-container");
            if (!element) throw new Error("Template container missing");

            const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                logging: false,
                backgroundColor: "#FFFFFF",
                width: 800,
                onclone: (clonedDoc) => {
                    const clonedTarget = clonedDoc.getElementById("salary-slip-pdf-hidden-container");
                    if (!clonedTarget) return;

                    const head = clonedDoc.head;
                    while (head.firstChild) head.removeChild(head.firstChild);

                    const style = clonedDoc.createElement('style');
                    style.innerHTML = `
                        * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
                        body { background: white !important; margin: 0; padding: 0; }
                        #salary-slip-pdf-hidden-container { display: block !important; visibility: visible !important; opacity: 1 !important; position: static !important; width: 800px !important; }
                    `;
                    head.appendChild(style);

                    const body = clonedDoc.body;
                    while (body.firstChild) body.removeChild(body.firstChild);
                    body.appendChild(clonedTarget);
                }
            });

            const imgData = canvas.toDataURL("image/png");

            const pdfWidth = 595.28;
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "pt",
                format: "a4"
            });

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`SalarySlip_${(staff?.firstName || 'Employee').replace(/\s+/g, '_')}_${selectedMonth}_${selectedYear}.pdf`);

            toast.success("Salary slip downloaded successfully", { id: toastId });
            setIsGenerateOpen(false);
        } catch (error: any) {
            console.error("PDF Core Generation Error:", error);
            const msg = error.message?.includes("unsupported color")
                ? "Browser CSS Error - Applying safe-mode..."
                : error.message || "Unknown error";
            toast.error(`Generation failed: ${msg}`, { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    interface SalaryEntry {
        month: string;
        duration: string;
        dueAmount: string;
        earnings: { name: string; full?: string; actual: string; }[];
        deductions: { name: string; actual: string; }[];
        totalEarnings: string;
        totalDeductions: string;
        payableDays: string;
    }

    const [salaryData, setSalaryData] = useState<SalaryEntry[]>([]);
    const [showEarningsDialog, setShowEarningsDialog] = useState(false);
    const [earningType, setEarningType] = useState<"Allowance" | "Bonus">("Allowance");
    const [earningForm, setEarningForm] = useState({
        cycle: format(new Date(), "MMMM yyyy"),
        entryDate: format(new Date(), "yyyy-MM-dd"),
        amount: "",
        description: "",
        sendSMS: false
    });

    React.useEffect(() => {
        if(id) {
            dispatch(fetchSalaryActions({ employeeId: id }));
        }
    }, [id, dispatch, showEarningsDialog]);

    React.useEffect(() => {
        const fetchAllOverviews = async () => {
            if (!id) return;
            
            // Extract unique months strictly from salaryActions payload
            const uniqueMonths = new Map();
            if (salaryActions && salaryActions.length > 0) {
                salaryActions.forEach((action: any) => {
                    const monthKey = `${action.month}-${action.year}`;
                    if (!uniqueMonths.has(monthKey)) {
                        uniqueMonths.set(monthKey, { month: action.month, year: action.year });
                    }
                });
            }

            const activeMonths = Array.from(uniqueMonths.values());
            
            // Sort dynamically extracted months descending
            activeMonths.sort((a: any, b: any) => new Date(b.year, b.month - 1).getTime() - new Date(a.year, a.month - 1).getTime());

            try {
                const results = await Promise.all(
                    activeMonths.map(async ({ month, year }) => {
                        const mNum = parseInt(month, 10);
                        const yNum = parseInt(year, 10);
                        const dateObj = new Date(yNum, mNum - 1, 1);
                        
                        const baseMonthData = {
                            month: format(dateObj, "MMMM yyyy"),
                            duration: `01 ${format(dateObj, "MMMM yyyy")} - ${format(endOfMonth(dateObj), "dd MMMM yyyy")}`,
                            dueAmount: "₹ 0.00",
                            earnings: [],
                            deductions: [],
                            totalEarnings: "0",
                            totalDeductions: "0",
                            payableDays: "0"
                        };
                        
                        try {
                            const res = await dispatch(fetchPayrollOverview({ employeeId: id as string, month: mNum, year: yNum })).unwrap();
                            if (res && res.payroll) {
                                const { payroll, breakdown } = res;
                                
                                const newEarnings = breakdown.filter((b: any) => b.type === "EARNING").map((b: any) => ({
                                    name: b.name,
                                    actual: b.amount.toString(),
                                    full: b.code === "BASIC" ? payroll.monthlyCTC?.toString() : "-"
                                }));
                                
                                const newDeductions = breakdown.filter((b: any) => b.type === "DEDUCTION").map((b: any) => ({
                                    name: b.name,
                                    actual: b.amount.toString()
                                }));

                                return {
                                    ...baseMonthData,
                                    earnings: newEarnings,
                                    deductions: newDeductions,
                                    totalEarnings: payroll.grossSalary?.toString() || "0",
                                    totalDeductions: payroll.totalDeductions?.toString() || "0",
                                    dueAmount: `₹ ${Number(payroll.netSalary || 0).toFixed(2)}`,
                                    payableDays: payroll.payableDays?.toString() || "0"
                                };
                            }
                            return baseMonthData;
                        } catch(e) {
                            return baseMonthData;
                        }
                    })
                );
                setSalaryData(results);
            } catch (err) {
                console.error("Failed to fetch overviews", err);
            }
        };

        fetchAllOverviews();
    }, [id, dispatch, showEarningsDialog, salaryActions]);

    const handleEarningSubmit = async () => {
        const amount = parseFloat(earningForm.amount) || 0;
        if (amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        const dateObj = new Date(earningForm.cycle);
        const mNum = parseInt(format(dateObj, "MM"), 10);
        const yNum = parseInt(format(dateObj, "yyyy"), 10);

        try {
            await dispatch(addSalaryAction({
                employeeId: id as string,
                type: activeSubTab === "Earnings" ? "EARNING" : activeSubTab === "Deductions" ? "DEDUCTION" : "PAYMENT",
                category: earningType,
                amount: amount,
                month: mNum,
                year: yNum,
                description: earningForm.description || "-"
            })).unwrap();

            toast.success(`${earningType} added successfully`);
            setShowEarningsDialog(false);
            dispatch(fetchSalaryActions({ employeeId: id as string }));
            setEarningForm({
                cycle: format(new Date(), "MMMM yyyy"),
                entryDate: format(new Date(), "yyyy-MM-dd"),
                amount: "",
                description: "",
                sendSMS: false
            });
        } catch(e) {
            toast.error("Failed to add action");
        }
    };

    const actionTabs = ["Earnings", "Deductions", "Payments"];
    const subTabContent: any = {
        "Earnings": ["Allowance", "Bonus"],
        "Deductions": ["Deduction"],
        "Payments": ["Add Payment", "Recover Payment"]
    };

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-[16px] font-semibold text-[#1F2937]">Salary Overview</h2>
                <div className="flex items-center gap-3">
                    <Popover open={isActionOpen} onOpenChange={setIsActionOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "h-[36px] px-4 border-[#3B82F6] text-[#3B82F6] text-[11px] font-medium rounded-lg hover:bg-blue-50 transition-all",
                                    isActionOpen && "bg-white border-[#3B82F6]"
                                )}
                            >
                                Actions {isActionOpen ? <ChevronUp size={14} className="ml-2" /> : <ChevronDown size={14} className="ml-2" />}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-[280px] p-0 rounded-xl border-gray-100 shadow-2xl overflow-hidden">
                            <div className="flex flex-col">
                                {/* Tabs Header */}
                                <div className="flex border-b border-gray-100 px-3 pt-3">
                                    {actionTabs.map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveSubTab(tab)}
                                            className={cn(
                                                "px-3 py-2 text-[11px] font-medium transition-all relative",
                                                activeSubTab === tab ? "text-[#3B82F6]" : "text-[#4B5563] hover:text-[#1F2937]"
                                            )}
                                        >
                                            {tab}
                                            {activeSubTab === tab && (
                                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3B82F6]" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                <div className="p-4 flex flex-col gap-4 min-h-[120px]">
                                    {subTabContent[activeSubTab].map((item: string) => (
                                        <div
                                            key={item}
                                            className="text-[12px] font-medium text-[#4B5563] hover:text-[#1F2937] cursor-pointer pl-2"
                                            onClick={() => {
                                                if (item === "Allowance" || item === "Bonus" || item === "Deduction") {
                                                    setEarningType(item as any);
                                                    setShowEarningsDialog(true);
                                                    setIsActionOpen(false);
                                                }
                                            }}
                                        >
                                            {item}
                                        </div>
                                    ))}
                                </div>

                                {/* Footer Action */}
                                <div className="p-4 pt-0">
                                    <Button
                                        className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[10px] font-medium h-[32px] rounded-lg shadow-sm"
                                        onClick={() => setIsActionOpen(false)}
                                    >
                                        Continue
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Button variant="outline" className="h-[36px] px-4 border-[#1F2937] text-[#1F2937] text-[11px] font-medium rounded-lg hover:bg-gray-50">
                        Add Previous Month
                    </Button>
                    <Button
                        className="h-[36px] px-4 bg-[#3F5A54] text-white text-[11px] font-medium rounded-lg hover:bg-[#2c4440]"
                        onClick={() => setIsGenerateOpen(true)}
                    >
                        Generate Salary Slip
                    </Button>
                </div>
            </div>

            <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                <DialogContent className="sm:max-w-[400px] p-6 rounded-2xl border-none shadow-2xl">
                    <DialogHeader className="flex flex-row items-center justify-between mb-8">
                        <DialogTitle className="text-[20px] font-bold text-[#1F2937]">Generate Salary Slip</DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-medium text-[#4B5563]">Year <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="w-full h-[44px] bg-white border border-gray-200 rounded-xl px-4 text-[13px] text-[#1F2937] outline-none appearance-none cursor-pointer focus:border-[#3F5A54]"
                                >
                                    <option value="" disabled>Choose Year</option>
                                    {Array.from({ length: 5 }).map((_, i) => {
                                        const y = new Date().getFullYear() - i;
                                        return <option key={y} value={y.toString()}>{y}</option>;
                                    })}
                                </select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-medium text-[#4B5563]">Month <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full h-[44px] bg-white border border-gray-200 rounded-xl px-4 text-[13px] text-[#1F2937] outline-none appearance-none cursor-pointer focus:border-[#3F5A54]"
                                >
                                    <option value="" disabled>Choose Month</option>
                                    {[
                                        "January", "February", "March", "April", "May", "June",
                                        "July", "August", "September", "October", "November", "December"
                                    ].map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-medium text-[#4B5563]">Payslip template</label>
                            <div className="relative">
                                <select
                                    value={selectedTemplate}
                                    onChange={(e) => setSelectedTemplate(e.target.value)}
                                    className="w-full h-[44px] bg-white border border-gray-200 rounded-xl px-4 text-[13px] text-[#1F2937] outline-none appearance-none cursor-pointer focus:border-[#3F5A54]"
                                >
                                    <option value="Standard">Standard Template</option>
                                    <option value="Detailed">Detailed Template</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                            </div>
                        </div>

                        <Button
                            className={cn(
                                "w-full h-[48px] font-bold text-[14px] rounded-xl mt-4 transition-all",
                                selectedYear && selectedMonth
                                    ? "bg-[#3B82F6] text-white hover:bg-[#2563EB]"
                                    : "bg-[#D1D5DB] text-[#4B5563] cursor-not-allowed hover:bg-[#D1D5DB]"
                            )}
                            disabled={!selectedYear || !selectedMonth || isGenerating}
                            onClick={handleDownloadPDF}
                        >
                            {isGenerating ? "Generating..." : "Generate"}
                        </Button>
                    </div>

                    <div className="fixed inset-0 pointer-events-none opacity-0 z-[-10] overflow-auto">
                        <div id="salary-slip-pdf-hidden-container" className="inline-block bg-white">
                            {staff && selectedMonth && selectedYear && (
                                <SalarySlipTemplate
                                    staff={staff}
                                    month={selectedMonth}
                                    year={selectedYear}
                                />
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showEarningsDialog} onOpenChange={setShowEarningsDialog}>
                <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-2xl border-none shadow-xl">
                    <div className="p-6 text-left">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-[18px] font-bold text-[#1F2937]">{earningType}</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-[12px] font-medium text-[#6B7280]">Cycle</label>
                                <div className="relative">
                                    <select
                                        value={earningForm.cycle}
                                        onChange={(e) => setEarningForm({ ...earningForm, cycle: e.target.value })}
                                        className="w-full h-[44px] bg-white border border-gray-200 rounded-xl px-4 text-[13px] text-[#1F2937] outline-none appearance-none cursor-pointer focus:border-[#3B82F6]"
                                    >
                                        {Array.from({ length: 6 }).map((_, i) => {
                                            const d = new Date();
                                            d.setMonth(d.getMonth() - i);
                                            const val = format(d, "MMMM yyyy");
                                            return <option key={val} value={val}>{val}</option>;
                                        })}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[12px] font-medium text-[#6B7280]">Entry Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={earningForm.entryDate}
                                        onChange={(e) => setEarningForm({ ...earningForm, entryDate: e.target.value })}
                                        className="w-full h-[44px] bg-white border border-gray-200 rounded-xl px-4 text-[13px] text-[#1F2937] outline-none focus:border-[#3B82F6]"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[12px] font-medium text-[#6B7280]">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[13px]">₹</span>
                                    <input
                                        type="number"
                                        placeholder="Enter Amount"
                                        value={earningForm.amount}
                                        onChange={(e) => setEarningForm({ ...earningForm, amount: e.target.value })}
                                        className="w-full h-[44px] bg-white border border-gray-200 rounded-xl pl-8 pr-4 text-[13px] text-[#1F2937] outline-none focus:border-[#3B82F6]"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[12px] font-medium text-[#6B7280]">Description</label>
                                <input
                                    type="text"
                                    placeholder="Enter Description"
                                    value={earningForm.description}
                                    onChange={(e) => setEarningForm({ ...earningForm, description: e.target.value })}
                                    className="w-full h-[44px] bg-white border border-gray-200 rounded-xl px-4 text-[13px] text-[#1F2937] outline-none focus:border-[#3B82F6]"
                                />
                            </div>

                            <div className="flex items-center gap-3 py-2">
                                <input
                                    type="checkbox"
                                    id="sendSMS"
                                    checked={earningForm.sendSMS}
                                    onChange={(e) => setEarningForm({ ...earningForm, sendSMS: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-[#3B82F6] focus:ring-[#3B82F6] cursor-pointer"
                                />
                                <label htmlFor="sendSMS" className="text-[13px] font-medium text-[#1F2937] cursor-pointer">Send SMS to Staff</label>
                            </div>
                        </div>

                        <div className="mt-8">
                            <Button
                                onClick={handleEarningSubmit}
                                className="w-full h-[48px] bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl transition-all"
                            >
                                Continue
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="flex flex-col gap-4 mb-10">
                {salaryData.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-0">
                        <div
                            onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                            className="flex items-center justify-between p-5 border border-gray-100 rounded-xl hover:shadow-sm transition-all cursor-pointer group bg-white"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-[40px] h-[40px] bg-[#EEF2FF] rounded-lg flex items-center justify-center border border-[#E0E7FF]">
                                    <Wallet className="text-[#4F46E5] w-[18px]" />
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-[13px] font-semibold text-[#1F2937]">{item.month}</h4>
                                    <p className="text-[10px] text-[#9CA3AF] mt-0.5">Duration: {item.duration}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-[#9CA3AF] font-medium uppercase tracking-tighter">Due Amount</span>
                                    <span className="text-[13px] font-bold text-[#1F2937]">{item.dueAmount}</span>
                                </div>
                                <ChevronRight
                                    size={18}
                                    className={cn(
                                        "text-[#9CA3AF] group-hover:text-[#1F2937] transition-all",
                                        expandedIdx === idx && "rotate-90 text-[#1F2937]"
                                    )}
                                />
                            </div>
                        </div>

                        {expandedIdx === idx && (
                            <div className="border border-[#E5E7EB] rounded-xl overflow-hidden bg-white shadow-sm mt-4 mb-6">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-[#F9FAFB] border-b border-gray-100">
                                            <th className="text-left py-4 px-6 text-[11px] font-bold text-[#1F2937] w-[30%]">Staff Name</th>
                                            <th className="text-left py-4 px-6 text-[11px] font-bold text-[#1F2937] w-[20%]">Full</th>
                                            <th className="text-left py-4 px-6 text-[11px] font-bold text-[#1F2937] w-[15%]">Actual</th>
                                            <th className="text-left py-4 px-6 text-[11px] font-bold text-[#1F2937] w-[20%] border-l border-gray-100/50">Deductions</th>
                                            <th className="text-right py-4 px-6 text-[11px] font-bold text-[#1F2937] w-[15%]">Actual</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[11px] text-[#1F2937]">
                                        {Array.from({ length: Math.max(item.earnings.length, item.deductions.length) }).map((_, iIdx) => (
                                            <tr key={iIdx} className="border-b border-gray-50">
                                                {/* Earnings Column */}
                                                <td className="py-4 px-6 font-medium text-gray-500">{item.earnings[iIdx]?.name || ""}</td>
                                                <td className="py-4 px-6 font-medium text-gray-500">
                                                    {item.earnings[iIdx] ? (item.earnings[iIdx].full === "-" ? "-" : `₹ ${item.earnings[iIdx].full}`) : ""}
                                                </td>
                                                <td className="py-4 px-6 font-medium text-gray-500">
                                                    {item.earnings[iIdx] ? `₹ ${item.earnings[iIdx].actual}` : ""}
                                                </td>

                                                {/* Deductions Column */}
                                                <td className="py-4 px-6 border-l border-gray-100/30 font-medium text-gray-500">
                                                    {item.deductions[iIdx]?.name || ""}
                                                </td>
                                                <td className="py-4 px-6 text-right font-medium text-gray-500">
                                                    {item.deductions[iIdx] ? `₹ ${item.deductions[iIdx].actual}` : ""}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="border-b border-gray-50">
                                            <td className="py-4 px-6 font-bold text-[#1F2937]">Gross Earnings</td>
                                            <td className="py-4 px-6"></td>
                                            <td className="py-4 px-6 font-bold text-[#1F2937]">₹ {item.totalEarnings}</td>
                                            <td className="py-4 px-6 font-bold text-[#1F2937] border-l border-gray-100/30">Total Deductions</td>
                                            <td className="py-4 px-6 text-right font-bold text-[#1F2937]">₹ {item.totalDeductions}</td>
                                        </tr>
                                        <tr className="border-b border-gray-50">
                                            <td className="py-4 px-6 font-bold text-[#4B5563]">Net Payable Amount <span className="font-normal text-[#9CA3AF]">(Gross Earnings - Total Deductions)</span></td>
                                            <td className="py-4 px-6"></td>
                                            <td className="py-4 px-6"></td>
                                            <td className="py-4 px-6 font-bold text-[#4B5563] border-l border-gray-100/30">{item.payableDays} Payable Days</td>
                                            <td className="py-4 px-6 text-right font-bold text-[#4B5563]">₹ {(parseFloat(item.totalEarnings) - parseFloat(item.totalDeductions)).toFixed(2)}</td>
                                        </tr>
                                        <tr className="border-b border-gray-50">
                                            <td className="py-4 px-6 font-bold text-[#4B5563]">Adjustments</td>
                                            <td className="py-4 px-6"></td>
                                            <td className="py-4 px-6"></td>
                                            <td className="py-4 px-6 border-l border-gray-100/30"></td>
                                            <td className="py-4 px-6 text-right font-bold text-[#4B5563]">₹ 0</td>
                                        </tr>
                                        <tr className="border-b border-gray-50">
                                            <td className="py-4 px-6 font-bold text-[#4B5563]">Advance Payments</td>
                                            <td className="py-4 px-6"></td>
                                            <td className="py-4 px-6"></td>
                                            <td className="py-4 px-6 border-l border-gray-100/30"></td>
                                            <td className="py-4 px-6 text-right font-bold text-[#4B5563]">₹ 0</td>
                                        </tr>
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-[#F8FAF9]">
                                            <td className="py-4 px-6 font-bold text-[12px] text-[#4B5563]" colSpan={3}>Due Amount : {item.dueAmount}</td>
                                            <td className="py-4 px-6 text-right" colSpan={2}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/dashboard/admin/hrms/staff/${id}/salary-variables?name=${encodeURIComponent(staff?.name || "")}&month=${encodeURIComponent(item.month)}`);
                                                    }}
                                                    className="text-[#3F5A54] font-bold text-[13px] hover:underline"
                                                >
                                                    View Variables
                                                </button>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-auto flex items-center justify-end gap-6 pt-10 border-t border-gray-50">
                <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#6B7280]">Jump to previous months</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="w-[120px] h-[36px] border border-gray-200 rounded-lg flex items-center justify-between px-3 cursor-pointer hover:border-gray-300">
                                <span className="text-[11px] text-[#9CA3AF]">Select</span>
                                <ChevronDown size={14} className="text-[#9CA3AF]" />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[120px]">
                            {Array.from({ length: 3 }).map((_, i) => {
                                const yr = new Date().getFullYear() - (i + 1);
                                return <DropdownMenuItem key={yr} className="text-[11px]">{yr}</DropdownMenuItem>;
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <Button variant="outline" className="h-[36px] px-6 bg-[#F3F4F6] border-none text-[11px] font-bold text-[#4B5563] rounded-lg hover:bg-gray-200">
                    Load More
                </Button>
            </div>
        </div>
    );
}


function SalaryStructure({ staff, id }: { staff: StaffData | null; id: string }) {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [structure, setStructure] = useState({
        monthlyCTC: 0,
        basic: 0,
        specialAllowance: 0,
        templateName: "NA",
        wageRate: "Monthly"
    });

    useEffect(() => {
        const fetchStructure = async () => {
            const today = new Date();
            try {
                // Request the active salary structure evaluation generated natively on the backend
                const res = await dispatch(fetchPayrollOverview({ 
                    employeeId: id as string, 
                    month: today.getMonth() + 1, 
                    year: today.getFullYear() 
                })).unwrap();
                
                if (res && res.payroll) {
                    setStructure({
                        monthlyCTC: res.payroll.monthlyCTC || 0,
                        basic: res.payroll.basic || 0,
                        specialAllowance: res.payroll.specialAllowance || 0,
                        templateName: res.payroll.templateName || "NA",
                        wageRate: "Monthly"
                    });
                }
            } catch (err) {
                console.error("No active salary structure found", err);
            }
        };
        fetchStructure();
    }, [id, dispatch]);

    if (!staff) return null;

    return (
        <div className="flex flex-col w-full h-full">
            {/* Heading and Action Button */}
            <div className="flex items-center justify-between mb-[31px]">
                <h2 className="text-[16px] font-medium text-[#1F2937]">Salary Details</h2>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-[90px] h-[30px] border-gray-200 text-[#1F2937] text-[10px] font-medium rounded-md hover:bg-white flex items-center justify-between px-3 gap-2 shadow-sm">
                            Actions <ChevronDown size={14} className="text-[#6B7280]" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[110px] p-0 rounded-lg border-gray-100 shadow-xl overflow-hidden mt-1">
                        <DropdownMenuItem className="py-2.5 px-4 text-[11px] font-medium text-[#4B5563] cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-0" onClick={() => router.push(`/dashboard/admin/hrms/staff/${id}/revise-salary`)}>
                            Revise
                        </DropdownMenuItem>
                        <DropdownMenuItem className="py-2.5 px-4 text-[11px] font-medium text-[#4B5563] cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-0" onClick={() => router.push(`/dashboard/admin/hrms/staff/${id}/edit-salary`)}>
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="py-2.5 px-4 text-[11px] font-medium text-[#4B5563] cursor-pointer hover:bg-gray-50 last:border-0" onClick={() => router.push(`/dashboard/admin/hrms/staff/${id}/salary-history`)}>
                            History
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Salary Template Components Section */}
            <div className="flex items-center gap-2 mb-[26px]">
                <div className="w-[32px] h-[32px] bg-[#EEF2FF] rounded-xl flex items-center justify-center border border-[#E0E7FF]/50 shadow-sm">
                    <div className="border-[1.5px] border-[#4B5563] px-[3px] py-[1px] flex items-center justify-center">
                        <MoreHorizontal size={12} className="text-[#4B5563]" strokeWidth={3} />
                    </div>
                </div>
                <span className="text-[14px] font-medium text-[#1F2937]">Salary Template Components</span>
            </div>

            {/* Salary Template Details Container */}
            <div className="w-full max-w-[1018px] h-[68px] border border-gray-200 rounded-xl flex items-center px-10 mb-8 gap-x-20 bg-white">
                <div className="flex flex-col gap-2">
                    <span className="text-[7px] font-medium text-[#6B7280] uppercase tracking-wider">Salary Template</span>
                    <span className="text-[10px] font-medium text-[#1F2937]">{structure.templateName}</span>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-[7px] font-medium text-[#6B7280] uppercase tracking-wider">Flexi-Benefit Plan Template</span>
                    <span className="text-[10px] font-medium text-[#1F2937]">NA</span>
                </div>
            </div>

            {/* Separated Header Row */}
            <div className="w-full max-w-[1018px] h-[39px] bg-[#F0F0F0]/60 border border-[#E5E7EB] rounded-lg flex items-center px-8 mb-[20px]">
                <span className="text-[10px] font-medium text-[#1F2937] uppercase tracking-wider w-[40%]">COMPONENTS</span>
                <span className="text-[10px] font-medium text-[#1F2937] uppercase tracking-wider w-[20%] text-center">CALCULATION</span>
                <span className="text-[10px] font-medium text-[#1F2937] uppercase tracking-wider w-[20%] text-center">MONTHLY AMOUNT</span>
                <span className="text-[10px] font-medium text-[#1F2937] uppercase tracking-wider w-[20%] text-right">YEARLY AMOUNT</span>
            </div>

            {/* Main Components Card */}
            <div className="w-full max-w-[1018px] border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                <div className="p-8 pb-0">
                    <h4 className="text-[10px] font-bold text-[#1F2937] uppercase tracking-wider mb-8">Fixed Earnings</h4>

                    <div className="flex flex-col gap-8 pb-10">
                        <div className="flex items-center px-6">
                            <span className="text-[10px] font-medium text-[#4B5563] w-[40%]">Basic</span>
                            <span className="text-[10px] font-medium text-[#4B5563] w-[20%] text-center">Fixed</span>
                            <span className="text-[10px] font-medium text-[#4B5563] w-[20%] text-center">₹ {structure.basic.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] font-medium text-[#1F2937] w-[20%] text-right">₹ {(structure.basic * 12).toLocaleString('en-IN')}</span>
                        </div>

                        <div className="flex items-center px-6">
                            <div className="text-[10px] font-medium text-[#4B5563] w-[40%] flex items-center gap-2">
                                Special Allowance <AlertCircle size={10} className="text-[#9CA3AF] cursor-help" />
                            </div>
                            <span className="text-[10px] font-medium text-[#4B5563] w-[20%] text-center">Fixed</span>
                            <span className="text-[10px] font-medium text-[#4B5563] w-[20%] text-center">₹ {structure.specialAllowance.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] font-medium text-[#1F2937] w-[20%] text-right">₹ {(structure.specialAllowance * 12).toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                <div className="h-[39px] bg-[#EEF0FF] flex items-center px-10 border-t border-[#E5E7EB]">
                    <span className="text-[16px] font-medium text-[#000000] w-[40%]">CTC</span>
                    <div className="w-[20%]"></div>
                    <div className="w-[20%] text-center">
                        <span className="text-[16px] font-medium text-[#000000]">₹ {structure.monthlyCTC.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-[20%] text-right">
                        <span className="text-[16px] font-medium text-[#1F2937]">₹ {(structure.monthlyCTC * 12).toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>

            <div className="h-[166px] w-full mt-6"></div>
        </div>
    );
}

function LoansSection({ id }: { id: string }) {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [subTab, setSubTab] = useState("Loans");
    const allLoans = useAppSelector((state: any) => state.loan.loans);

    useEffect(() => {
        dispatch(getAllLoans({}));
    }, [dispatch]);

    // Filter loans for THIS specific staff member
    const loans = allLoans.filter((l: any) =>
        (l.employeeId === id) ||
        (typeof l.employeeId === 'object' && l.employeeId?._id === id) ||
        (l.userId === id) ||
        (typeof l.userId === 'object' && l.userId?._id === id)
    );

    const totalLoanAmount = loans.reduce((acc: number, loan: any) => acc + (parseFloat(loan.principalAmount) || 0), 0);
    const totalPaid = loans.reduce((acc: number, loan: any) => acc + (parseFloat(loan.totalPaidInstalment) || 0), 0);
    const loanBalance = totalLoanAmount - totalPaid;

    const handleDownloadReport = () => {
        if (loans.length === 0) {
            toast.error("No loans found to generate report");
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(37, 99, 235);
        doc.text("Loan Instalment Report", pageWidth / 2, 20, { align: "center" });

        // Employee Info
        doc.setFontSize(12);
        doc.setTextColor(31, 41, 55);
        doc.text(`Employee ID: ${id}`, 20, 35);
        doc.text(`Report Date: ${format(new Date(), "dd MMM yyyy")}`, 20, 42);

        doc.setLineWidth(0.5);
        doc.setDrawColor(229, 231, 235);
        doc.line(20, 48, pageWidth - 20, 48);

        // Table Header
        let y = 60;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Loan Name", 20, y);
        doc.text("Principal", 70, y);
        doc.text("Tenure", 100, y);
        doc.text("Rate", 130, y);
        doc.text("Monthly Instalment", 160, y);

        y += 5;
        doc.line(20, y, pageWidth - 20, y);
        y += 10;

        // Table Rows
        doc.setFont("helvetica", "normal");
        loans.forEach((loan: any) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            doc.text(loan.loanName || "N/A", 20, y);
            const principal = loan.principalAmount || 0;
            doc.text(`₹${principal.toLocaleString()}`, 70, y);
            doc.text(`${loan.tenure} Mon`, 100, y);
            doc.text(`${loan.interestRate}%`, 130, y);
            const emi = loan.monthlyInstalment || 0;
            doc.text(`₹${emi.toLocaleString()}`, 160, y);
            y += 10;
        });

        // Overall Summary
        y += 10;
        doc.setDrawColor(37, 99, 235);
        doc.line(20, y, pageWidth - 20, y);
        y += 10;
        doc.setFont("helvetica", "bold");
        doc.text(`Total Loan Amount: ₹${totalLoanAmount.toLocaleString()}`, 20, y);
        doc.text(`Total Balance: ₹${loanBalance.toLocaleString()}`, 120, y);

        doc.save(`Loan_Report_${id}.pdf`);
        toast.success("Instalment report downloaded successfully");
    };

    const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'completed' || l.status === 'written_off');
    const applicationLoans = loans.filter(l => l.status !== 'completed');

    return (
        <div className="flex flex-col w-full h-full">
            {/* Header Area with Sub-tabs and Buttons */}
            <div className="flex items-center justify-between mb-8">
                {/* Custom Tab Switcher */}
                <div className="bg-[#F3F4F6] p-1 rounded-lg flex gap-1">
                    <button
                        onClick={() => setSubTab("Loans")}
                        className={cn(
                            "px-6 py-1.5 rounded-md text-[12px] font-medium transition-all",
                            subTab === "Loans"
                                ? "bg-white text-[#1F2937] shadow-sm"
                                : "text-[#6B7280] hover:text-[#4B5563]"
                        )}
                    >
                        Loans
                    </button>
                    <button
                        onClick={() => setSubTab("Loan Applications")}
                        className={cn(
                            "px-6 py-1.5 rounded-md text-[12px] font-medium transition-all",
                            subTab === "Loan Applications"
                                ? "bg-white text-[#1F2937] shadow-sm"
                                : "text-[#6B7280] hover:text-[#4B5563]"
                        )}
                    >
                        Loan Applications
                    </button>
                </div>

                {/* Top Right Action Buttons */}
                <div className="flex items-center gap-3">
                    {subTab === "Loans" && activeLoans.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={handleDownloadReport}
                            className="border-[#D1D5DB] text-[#374151] text-[12px] font-semibold h-[36px] px-4 rounded-lg flex items-center gap-2 hover:bg-gray-50 bg-white shadow-sm"
                        >
                            <Download size={14} className="text-[#3B82F6]" />
                            Instalment report
                        </Button>
                    )}
                    <Button
                        onClick={() => router.push(`/dashboard/admin/hrms/staff/${id}/loans/add`)}
                        className="bg-[#3F5A54] hover:bg-[#2c4440] text-white text-[12px] font-bold h-[36px] px-6 rounded-lg shadow-sm transition-all"
                    >
                        Add Loan
                    </Button>
                </div>
            </div>

            {subTab === "Loans" && activeLoans.length > 0 ? (
                <div className="flex flex-col gap-10 w-full">
                    {/* Summary Statistics */}
                    <div className="flex gap-16 px-2">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[12px] font-medium text-[#6B7280]">Total Loan Amount</span>
                            <span className="text-[18px] font-bold text-[#111827]">₹ {totalLoanAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[12px] font-medium text-[#6B7280]">Total Payment</span>
                            <span className="text-[18px] font-bold text-[#111827]">₹ {totalPaid.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[12px] font-medium text-[#6B7280]">Loan Balance</span>
                            <span className="text-[18px] font-bold text-[#111827]">₹ {loanBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {/* Loan Card List */}
                    <div className="flex flex-col gap-4 w-full">
                        {activeLoans.map((loan: any, index: number) => {
                            const statusLabel =
                                loan.status === 'active' ? 'Open' :
                                    loan.status === 'completed' ? 'Closed' :
                                        loan.status === 'written_off' ? 'Written Off' :
                                            loan.status;

                            const badgeStyles =
                                loan.status === 'active' ? "bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]" :
                                    loan.status === 'completed' ? "bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]" :
                                        loan.status === 'written_off' ? "bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA]" :
                                            "bg-gray-100 text-gray-600 border-gray-200";

                            const dotColor =
                                loan.status === 'active' ? "bg-[#22C55E]" :
                                    loan.status === 'completed' ? "bg-[#A855F7]" :
                                        loan.status === 'written_off' ? "bg-[#F97316]" :
                                            "bg-gray-400";

                            return (
                                <div
                                    key={loan._id}
                                    className="w-full bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between hover:bg-gray-50/50 transition-all cursor-pointer group shadow-sm"
                                    onClick={() => router.push(`/dashboard/admin/hrms/staff/${id}/loans/${loan._id}`)}
                                >
                                    <div className="flex items-center gap-6">
                                        {/* Index Number */}
                                        <div className="w-[42px] h-[42px] rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6] font-bold text-[14px]">
                                            {index + 1}
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[14px] font-bold text-[#111827]">{loan.loanName}</span>
                                                <div className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 border", badgeStyles)}>
                                                    {loan.status === 'completed' ? (
                                                        <Lock size={10} className="text-[#6B21A8]" />
                                                    ) : (
                                                        <div className={cn("w-1.5 h-1.5 rounded-full", dotColor)}></div>
                                                    )}
                                                    <span className="tracking-tight uppercase">{statusLabel}</span>
                                                </div>
                                            </div>
                                            <div className="text-[12px] text-gray-500 font-medium">
                                                Principal: <span className="text-gray-900">₹ {parseFloat(loan.principalAmount || 0).toLocaleString()}</span>
                                                <span className="mx-2 text-gray-300">|</span>
                                                Annual Interest Rate: <span className="text-gray-900">{loan.interestRate}%</span>
                                                <span className="mx-2 text-gray-300">|</span>
                                                Interest Type: <span className="text-gray-900">{loan.interestType?.[0].toUpperCase() + loan.interestType?.slice(1) || "Simple"} Interest</span>
                                                <span className="mx-2 text-gray-300">|</span>
                                                Balance: <span className="text-gray-900">₹ {(parseFloat(loan.principalAmount || 0) - (parseFloat(loan.totalPaidInstalment) || 0)).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-500 transition-colors mr-2" />
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : subTab === "Loan Applications" && applicationLoans.length > 0 ? (
                <div className="flex flex-col gap-10 w-full">
                    {/* Summary Counts */}
                    <div className="flex gap-20 px-2">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[12px] font-medium text-[#6B7280]">Pending</span>
                            <span className="text-[18px] font-bold text-[#111827]">{applicationLoans.filter(l => l.status === "pending").length}</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[12px] font-medium text-[#6B7280]">Open</span>
                            <span className="text-[18px] font-bold text-[#111827]">{applicationLoans.filter(l => l.status === "approved" || l.status === "active").length}</span>
                        </div>
                    </div>

                    {/* Applications Card List */}
                    <div className="flex flex-col gap-4 w-full">
                        {applicationLoans.map((loan: any, index: number) => {
                            const statusLabel =
                                loan.status === 'pending' ? 'Pending' :
                                    (loan.status === 'approved' || loan.status === 'active') ? 'Open' :
                                        loan.status === 'rejected' ? 'Rejected' :
                                            loan.status === 'written_off' ? 'Written Off' :
                                                loan.status;

                            const badgeStyles =
                                loan.status === 'pending' ? "bg-[#FEF9C3] text-[#854D0E] border-[#FEF08A]" :
                                    (loan.status === 'approved' || loan.status === 'active') ? "bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]" :
                                        loan.status === 'rejected' ? "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]" :
                                            loan.status === 'written_off' ? "bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA]" :
                                                "bg-gray-100 text-gray-600 border-gray-200";

                            const dotColor =
                                loan.status === 'pending' ? "bg-[#EAB308]" :
                                    (loan.status === 'approved' || loan.status === 'active') ? "bg-[#22C55E]" :
                                        loan.status === 'rejected' ? "bg-[#EF4444]" :
                                            loan.status === 'written_off' ? "bg-[#F97316]" :
                                                "bg-gray-400";

                            return (
                                <div
                                    key={loan._id}
                                    className="w-full bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between hover:bg-gray-50/50 transition-all cursor-pointer group shadow-sm"
                                    onClick={() => router.push(
                                        (loan.status === 'active' || loan.status === 'written_off')
                                            ? `/dashboard/admin/hrms/staff/${id}/loans/${loan._id}`
                                            : `/dashboard/admin/hrms/staff/${id}/loans/application/${loan._id}`
                                    )}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-[42px] h-[42px] rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6] font-bold text-[14px]">
                                            {index + 1}
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[14px] font-bold text-[#111827]">{loan.loanName}</span>
                                                <div className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 border", badgeStyles)}>
                                                    {loan.status === 'rejected' ? (
                                                        <MinusCircle size={10} className="text-[#EF4444]" />
                                                    ) : (
                                                        <div className={cn("w-1.5 h-1.5 rounded-full", dotColor)}></div>
                                                    )}
                                                    <span className="tracking-tight uppercase">{statusLabel}</span>
                                                </div>
                                            </div>
                                            <div className="text-[12px] text-gray-500 font-medium">
                                                Applied on Date: <span className="text-gray-900">{loan.createdAt ? format(new Date(loan.createdAt), "dd MMM yyyy") : "N/A"}</span>
                                                <span className="mx-2 text-gray-300">|</span>
                                                Principal: <span className="text-gray-900">₹ {parseFloat(loan.principalAmount || 0).toLocaleString()}</span>
                                                <span className="mx-2 text-gray-300">|</span>
                                                Tenure: <span className="text-gray-900">{loan.tenure} Months</span>
                                            </div>
                                        </div>
                                    </div>

                                    <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-500 transition-colors mr-2" />
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-20 uppercase">
                    <div className="mb-2">
                        <Image
                            src={CloudIcon}
                            alt="No data"
                            width={85}
                            height={85}
                            className="object-contain opacity-100"
                        />
                    </div>
                    <p className="text-[#9CA3AF] text-[7px] font-semibold mb-6 tracking-wider">
                        {subTab === "Loans" ? "No Loans to Show" : "No Loan Applications to show"}
                    </p>
                    {subTab === "Loans" && (
                        <button
                            onClick={() => router.push(`/dashboard/admin/hrms/staff/${id}/loans/add`)}
                            className="bg-[#3F5A54] hover:bg-[#2c4440] text-white text-[10px] font-semibold w-[83px] h-[29px] rounded-lg shadow-sm transition-all"
                        >
                            Add Loan
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function LeavesSection({ id, staff }: { id: string; staff: StaffData | null }) {
    const dispatch = useAppDispatch();
    const leaveBalances = useAppSelector(selectLeaveBalances);
    const leaveHistory = useAppSelector(selectOrganizationLeaveHistory);
    const isBalanceLoading = useAppSelector(selectBalanceLoading);
    const isApplyLoading = useAppSelector(selectApplyLoading);

    const [subTab, setSubTab] = useState("Upcoming Leaves");
    const [showMarkLeaveDialog, setShowMarkLeaveDialog] = useState(false);
    const [showEditBalanceDialog, setShowEditBalanceDialog] = useState(false);
    const [showEncashDialog, setShowEncashDialog] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState<any>(null);
    const [showLeaveDetails, setShowLeaveDetails] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Form states
    const [balanceForm, setBalanceForm] = useState<Record<string, number>>({});

    const [encashForm, setEncashForm] = useState({
        amount: 0,
        rate: 709.68
    });

    // Form state for functionality
    const [leaveForm, setLeaveForm] = useState({
        type: "",
        description: "",
        startSession: "Session 1",
        endSession: "Session 2"
    });

    const [date, setDate] = useState<DateRange | undefined>({
        from: undefined,
        to: undefined,
    });

    const calculateDuration = () => {
        if (!date?.from) return 0;
        const fromDate = date.from;
        const toDate = date.to || date.from;

        if (fromDate.getTime() === toDate.getTime()) {
            return leaveForm.startSession === "Session 1" && leaveForm.endSession === "Session 2" ? 1 : 0.5;
        }

        let total = differenceInDays(toDate, fromDate) - 1; // Middle full days
        if (total < 0) total = 0;

        // Add start day
        total += leaveForm.startSession === "Session 1" ? 1 : 0.5;
        // Add end day
        total += leaveForm.endSession === "Session 2" ? 1 : 0.5;

        return total;
    };

    const handleSaveLeave = async () => {
        if (!leaveForm.type || !date?.from) {
            toast.error("Please select leave type and date range");
            return;
        }

        const fromDate = date.from;
        const toDate = date.to || date.from;

        const leaveData = {
            employeeId: id,
            leaveType: leaveForm.type,
            startDate: format(fromDate, "yyyy-MM-dd"),
            endDate: format(toDate, "yyyy-MM-dd"),
            reason: leaveForm.description || "Marked by admin",
            durationType: (fromDate.getTime() === toDate.getTime() && (leaveForm.startSession !== "Session 1" || leaveForm.endSession !== "Session 2")) ? "halfDay" as const : "fullDay" as const
        };

        try {
            const resultAction = await dispatch(markLeave(leaveData));
            if (markLeave.fulfilled.match(resultAction)) {
                toast.success("Leave marked successfully");
                setShowMarkLeaveDialog(false);
                setLeaveForm({ type: "", description: "", startSession: "Session 1", endSession: "Session 2" });
                setDate({ from: undefined, to: undefined });
                // Refresh data
                dispatch(getEmployeeLeaveBalances({ employeeId: id }));
            } else {
                toast.error(resultAction.payload as string || "Failed to mark leave");
            }
        } catch (error) {
            toast.error("An error occurred while marking leave");
        }
    };

    const handleSaveBalance = async () => {
        const now = new Date();
        const currentYear = now.getFullYear().toString();
        const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

        try {
            const updatePromises = Object.entries(balanceForm).map(([leaveType, balance]) => {
                const existingBalance = leaveBalances.find(b => b.leaveType === leaveType);
                const frequency = existingBalance?.frequency || 'yearly';
                const period = existingBalance?.period || (frequency === 'monthly' ? currentMonth : currentYear);

                return dispatch(updateEmployeeLeaveBalance({
                    employeeId: id,
                    leaveType,
                    frequency,
                    period,
                    balance
                }));
            });

            await Promise.all(updatePromises);
            toast.success("Leave balance updated");
            setShowEditBalanceDialog(false);
            dispatch(getEmployeeLeaveBalances({ employeeId: id }));
        } catch (error) {
            toast.error("Failed to update leave balance");
        }
    };

    const handleEncashLeaves = () => {
        if (encashForm.amount <= 0) return;
        toast.success(`${encashForm.amount} leaves encashed successfully`);
        setShowEncashDialog(false);
        setEncashForm({ ...encashForm, amount: 0 });
    };

    // Derived states from Redux
    const summary = leaveBalances.map(b => ({
        label: b.leaveType,
        total: b.balance,
        take: b.leaveTaken,
        key: b.leaveType
    }));

    const allLeaves = leaveHistory
        .filter((l: any) => {
            const empId = typeof l.employeeId === 'object' && l.employeeId !== null ? l.employeeId._id : l.employeeId;
            return String(empId) === String(id) || String(empId) === String(staff?.id);
        })
        .map((l: any) => {
            const startS = l.durationType === 'halfDay' ? "S1" : "S1";
            const endS = l.durationType === 'halfDay' ? "S1" : "S2";
            const formattedDates = `${format(new Date(l.startDate), "dd MMM")} (${startS}) - ${format(new Date(l.endDate), "dd MMM")} (${endS})`;

            const lastApproval = l.approvalHistory?.[l.approvalHistory.length - 1];

            return {
                id: l._id,
                startDate: new Date(l.startDate),
                endDate: new Date(l.endDate),
                dates: formattedDates,
                leaveOn: formattedDates,
                status: l.status.charAt(0).toUpperCase() + l.status.slice(1),
                leavesAvailed: `${l.totalDays} Day${l.totalDays > 1 ? 's' : ''}`,
                duration: l.totalDays,
                rawDuration: l.totalDays,
                type: l.leaveType,
                description: l.reason,
                appliedOn: format(new Date(l.createdAt), "dd MMM ''yy, hh:mm a"),
                approvedOn: lastApproval ? format(new Date(lastApproval.date), "dd MMM ''yy, hh:mm a") : "-",
                approvedBy: lastApproval?.approverId?.name || "System"
            };
        });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingLeaves = allLeaves.filter(l => l.startDate >= today);
    const previousLeaves = allLeaves.filter(l => l.startDate < today);

    // Calculate dynamic date range
    const currentYear = new Date().getFullYear();
    const currentYearShort = currentYear.toString().slice(-2);
    const dateRange = `(Jan '${currentYearShort} - Dec '${currentYearShort})`;

    const CustomCalendarIcon = ({ size = 16, className = "" }: { size?: number, className?: string }) => (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10l-4 4H6a2 2 0 0 1-2-2V6z" />
            <path d="M16 2v4M8 2v4M4 10h16" />
            <path d="M20 16h-4v4" />
        </svg>
    );

    useEffect(() => {
        if (id) {
            dispatch(getEmployeeLeaveBalances({ employeeId: id }));
            dispatch(getLeavesHistoryByOrganization());
        }
    }, [id, dispatch]);

    useEffect(() => {
        if (leaveBalances.length > 0) {
            const form: Record<string, number> = {};
            leaveBalances.forEach(b => {
                form[b.leaveType] = b.balance;
            });
            setBalanceForm(form);
        }
    }, [leaveBalances]);

    return (
        <div className="flex flex-col w-full h-full">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-[24px]">
                <div className="flex items-center gap-2">
                    <h2 className="text-[16px] font-medium text-[#1F2937]">Leave(s)</h2>
                    <span className="text-[10px] font-normal text-[#4B5563] mt-1">{dateRange}</span>
                </div>
                <div className="flex items-center gap-[24px]">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-[90px] h-[30px] border-[#3F5A54] text-[#3F5A54] text-[10px] font-medium rounded-md hover:bg-blue-50/30 flex items-center justify-between px-3 gap-2 shadow-sm">
                                Actions <ChevronDown size={14} className="text-[#3F5A54]" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[150px] p-0 rounded-lg border-gray-100 shadow-xl overflow-hidden mt-1">
                            <DropdownMenuItem
                                onClick={() => setShowEditBalanceDialog(true)}
                                className="py-2.5 px-4 text-[11px] font-medium text-[#4B5563] cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-0"
                            >
                                Edit Leave Balance
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setShowEncashDialog(true)}
                                className="py-2.5 px-4 text-[11px] font-medium text-[#4B5563] cursor-pointer hover:bg-gray-50 last:border-0"
                            >
                                Encash Leaves
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        onClick={() => setShowMarkLeaveDialog(true)}
                        className="w-[100px] h-[30px] bg-[#3F5A54] hover:bg-[#2c4440] text-white text-[10px] font-medium rounded-md shadow-sm"
                    >
                        Mark Leave
                    </Button>
                </div>
            </div>

            {/* Mark Leave Dialog */}
            <Dialog open={showMarkLeaveDialog} onOpenChange={setShowMarkLeaveDialog}>
                <DialogContent showCloseButton={false} className="fixed right-4 top-4 bottom-4 left-auto translate-x-0 translate-y-0 max-w-[500px] w-full h-[calc(100vh-32px)] p-0 border-none bg-white gap-0 rounded-[24px] shadow-2xl flex flex-col overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right duration-300">
                    <div className="flex-1 px-[32px] pt-[32px] overflow-y-auto scrollbar-hide">
                        {/* Header Area */}
                        <div className="flex items-center justify-between mb-[32px]">
                            <DialogTitle className="text-[18px] font-bold text-[#1F2937] border-none shadow-none uppercase tracking-wide">Mark Leave</DialogTitle>
                            <DialogClose asChild>
                                <button className="w-[24px] h-[24px] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 rounded-full">
                                    <X size={18} />
                                </button>
                            </DialogClose>
                        </div>

                        {/* Form Fields */}
                        <div className="flex flex-col gap-[28px]">
                            <div className="grid grid-cols-2 gap-[24px] w-full items-start">
                                {/* Leave Type */}
                                <div className="flex flex-col gap-[8px] flex-1 min-w-0">
                                    <div className="flex items-center">
                                        <span className="text-[7px] font-normal text-[#4B5563]">Leave Type</span>
                                        <span className="text-red-500 ml-0.5">*</span>
                                    </div>
                                    <div className="relative w-full">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="w-full h-[36px] border border-[#E5E7EB] rounded-[4px] px-3 text-[10px] font-normal text-[#1F2937] bg-white flex items-center justify-between outline-none focus:border-[#3F5A54]">
                                                    <span className={leaveForm.type ? "text-[#1F2937]" : "text-[#9CA3AF]"}>
                                                        {leaveForm.type || "Select Leave Type"}
                                                    </span>
                                                    <ChevronDown size={14} className="text-[#9CA3AF]" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] p-2 rounded-[12px] border-gray-100 shadow-xl">
                                                {summary.map((leave) => (
                                                    <DropdownMenuItem
                                                        key={leave.key}
                                                        onClick={() => setLeaveForm({ ...leaveForm, type: leave.key })}
                                                        className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-gray-50 rounded-lg group"
                                                    >
                                                        <span className="text-[14px] font-medium text-[#1F2937]">{leave.label}</span>
                                                        <span className="text-[12px] text-[#9CA3AF] group-hover:text-[#6B7280]">
                                                            {leave.total - leave.take} Left
                                                        </span>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Date Range */}
                                <div className="flex flex-col gap-[8px] flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <span className="text-[7px] font-normal text-[#4B5563]">Date Range</span>
                                            <span className="text-red-500 ml-0.5">*</span>
                                        </div>
                                        <span className="text-[7px] font-normal text-[#4B5563] whitespace-nowrap overflow-visible">Selected Duration: {calculateDuration()} day(s)</span>
                                    </div>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <div className="relative w-full h-[36px] cursor-pointer">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    placeholder="select Date"
                                                    value={date?.from ? (date.to ? `${format(date.from, "dd MMM")} - ${format(date.to, "dd MMM")}` : format(date.from, "dd MMM")) : ""}
                                                    className="w-full h-full border border-[#E5E7EB] rounded-[4px] px-3 text-[10px] font-normal text-[#1F2937] placeholder:text-[#9CA3AF] outline-none focus:border-[#3F5A54] cursor-pointer"
                                                />
                                                <CustomCalendarIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <CalendarUI
                                                initialFocus
                                                mode="range"
                                                defaultMonth={date?.from}
                                                selected={date}
                                                onSelect={setDate}
                                                numberOfMonths={1}
                                                className="[--cell-size:28px] p-2"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            {/* Session Selection */}
                            {date?.from && (
                                <div className="bg-[#F9FAFB] border border-gray-100 rounded-xl p-5 flex flex-col gap-5">
                                    {/* Start Date Session */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[14px] font-medium text-[#1F2937] uppercase">{format(date.from, "dd MMM, EEE")}</span>
                                        <div className="flex gap-6">
                                            {["Session 1", "Session 2"].map((session) => (
                                                <label key={session} className="flex items-center gap-2 cursor-pointer group">
                                                    <div
                                                        onClick={() => setLeaveForm({ ...leaveForm, startSession: session })}
                                                        className={cn(
                                                            "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                                                            leaveForm.startSession === session ? "border-[#3F5A54] bg-[#3F5A54]" : "border-gray-300 group-hover:border-[#3F5A54]"
                                                        )}
                                                    >
                                                        {leaveForm.startSession === session && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                    </div>
                                                    <span className="text-[13px] font-medium text-[#4B5563]">{session}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* End Date Session (if different) */}
                                    {date.to && date.to.getTime() !== date.from.getTime() && (
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                            <span className="text-[14px] font-medium text-[#1F2937] uppercase">{format(date.to, "dd MMM, EEE")}</span>
                                            <div className="flex gap-6">
                                                {["Session 1", "Session 2"].map((session) => (
                                                    <label key={session} className="flex items-center gap-2 cursor-pointer group">
                                                        <div
                                                            onClick={() => setLeaveForm({ ...leaveForm, endSession: session })}
                                                            className={cn(
                                                                "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                                                                leaveForm.endSession === session ? "border-[#3F5A54] bg-[#3F5A54]" : "border-gray-300 group-hover:border-[#3F5A54]"
                                                            )}
                                                        >
                                                            {leaveForm.endSession === session && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                        </div>
                                                        <span className="text-[13px] font-medium text-[#4B5563]">{session}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Description */}
                            <div className="flex flex-col gap-[8px] w-full">
                                <span className="text-[7px] font-normal text-[#4B5563]">Description</span>
                                <textarea
                                    placeholder="Write here"
                                    value={leaveForm.description}
                                    onChange={(e) => setLeaveForm({ ...leaveForm, description: e.target.value })}
                                    className="w-full h-[120px] border border-[#E5E7EB] rounded-[4px] p-3 text-[10px] font-normal text-[#1F2937] placeholder:text-[#9CA3AF] resize-none outline-none focus:border-[#3F5A54]"
                                />
                            </div>

                            {/* Leave Summary */}
                            {date?.from && leaveForm.type && (
                                <div className="bg-[#F9FAFB] border border-gray-100 rounded-xl p-5 flex flex-col gap-2">
                                    <span className="text-[12px] font-medium text-[#6B7280]">Leave Summary:</span>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[14px] font-semibold text-[#1F2937] uppercase">{calculateDuration()} {leaveForm.type}</p>
                                        {(() => {
                                            const start = date.from;
                                            const end = date.to || date.from;
                                            let sundayCount = 0;
                                            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                                                if (d.getDay() === 0) sundayCount++;
                                            }
                                            return sundayCount > 0 && <p className="text-[13px] font-medium text-[#6B7280]">{sundayCount} Weekly Off</p>;
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="w-full h-[80px] border-t border-[#B1B1B14D] flex items-center justify-end gap-[16px] px-[32px] bg-white shrink-0">
                        <Button
                            variant="outline"
                            onClick={() => setShowMarkLeaveDialog(false)}
                            className="w-[146px] h-[37px] border-[#3F5A54] text-[#3F5A54] text-[14px] font-medium rounded-[4px] bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
                        >
                            cancel
                        </Button>
                        <Button
                            onClick={handleSaveLeave}
                            className="w-[146px] h-[37px] bg-white border border-[#D1D5DB] text-[#9CA3AF] text-[14px] font-medium rounded-[4px] hover:bg-gray-50 hover:border-gray-400 shadow-none flex items-center justify-center transition-all"
                        >
                            save
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={showLeaveDetails} onOpenChange={setShowLeaveDetails}>
                <DialogContent showCloseButton={false} className="fixed right-4 top-4 bottom-4 left-auto translate-x-0 translate-y-0 max-w-[550px] w-full h-[calc(100vh-32px)] p-0 border-none bg-white gap-0 rounded-[24px] shadow-2xl flex flex-col overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right duration-300">
                    <div className="flex-1 px-[32px] pt-[32px] overflow-y-auto scrollbar-hide">
                        {/* Header Area */}
                        <div className="flex items-center justify-between mb-[32px]">
                            <div className="flex flex-col gap-1">
                                <DialogTitle className="text-[18px] font-bold text-[#1F2937] border-none shadow-none uppercase tracking-wide">Leave Details</DialogTitle>
                                <div className="flex items-center gap-2">
                                    <div className="px-2 py-0.5 bg-[#E1F9F0] text-[#10B981] rounded-full flex items-center gap-1 border border-[#BFF2E2]/30 w-fit">
                                        <CheckCircle2 size={10} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{selectedLeave?.status || "Approved"}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-[32px] h-[32px] flex items-center justify-center text-[#EF4444] hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <DialogClose asChild>
                                    <button className="w-[32px] h-[32px] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 rounded-full">
                                        <X size={20} />
                                    </button>
                                </DialogClose>
                            </div>
                        </div>

                        {/* Details Content */}
                        <div className="grid grid-cols-3 gap-y-8 mb-10">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[12px] text-[#9CA3AF] font-normal">Staff Name</span>
                                <span className="text-[14px] text-[#1F2937] font-semibold uppercase">{staff?.name}</span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[12px] text-[#9CA3AF] font-normal">Leave Applied on</span>
                                <span className="text-[14px] text-[#1F2937] font-semibold">{selectedLeave?.appliedOn}</span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[12px] text-[#9CA3AF] font-normal">Leave On</span>
                                <span className="text-[14px] text-[#1F2937] font-semibold uppercase">{selectedLeave?.dates}</span>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <span className="text-[12px] text-[#9CA3AF] font-normal">Leave Duration</span>
                                <span className="text-[14px] text-[#1F2937] font-semibold">{selectedLeave?.rawDuration || selectedLeave?.duration} day(s)</span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[12px] text-[#9CA3AF] font-normal">Leaves Availed</span>
                                <span className="text-[14px] text-[#1F2937] font-semibold uppercase">{selectedLeave?.leavesAvailed}</span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[12px] text-[#9CA3AF] font-normal">Leave Type</span>
                                <span className="text-[14px] text-[#1F2937] font-semibold uppercase">{selectedLeave?.type}</span>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <span className="text-[12px] text-[#9CA3AF] font-normal">Approved by</span>
                                <span className="text-[14px] text-[#1F2937] font-semibold uppercase">{selectedLeave?.approvedBy || "Delizia"}</span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[12px] text-[#9CA3AF] font-normal">Approved on</span>
                                <span className="text-[14px] text-[#1F2937] font-semibold uppercase">{selectedLeave?.approvedOn}</span>
                            </div>
                        </div>

                        {/* Leave Summary Section */}
                        <div className="flex flex-col gap-3 mb-10">
                            <span className="text-[12px] text-[#9CA3AF] font-normal">Leave Summary</span>
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[14px] text-[#1F2937] font-medium">
                                    {selectedLeave?.duration} {selectedLeave?.type}
                                </span>
                                {selectedLeave?.rawDuration > selectedLeave?.duration && (
                                    <span className="text-[14px] text-[#1F2937] font-medium">
                                        {Math.round(selectedLeave.rawDuration - selectedLeave.duration)} Weekly Off
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="flex flex-col gap-3">
                            <span className="text-[12px] text-[#9CA3AF] font-normal">Description</span>
                            <span className="text-[14px] text-[#1F2937] font-medium">{selectedLeave?.description}</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent showCloseButton={false} className="max-w-[400px] w-full p-8 border-none bg-white rounded-[12px] shadow-2xl flex flex-col gap-0">
                    <div className="flex items-center justify-between mb-4">
                        <DialogTitle className="text-[20px] font-bold text-[#1F2937]">Delete Leave Application</DialogTitle>
                        <DialogClose asChild>
                            <button className="text-gray-400 hover:text-gray-600 outline-none">
                                <X size={20} />
                            </button>
                        </DialogClose>
                    </div>
                    <p className="text-[15px] text-[#6B7280] mb-8 leading-relaxed">
                        Are you sure you want to delete this leave application? This action is irreversible.
                    </p>
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 h-[48px] border-[#2563EB] text-[#2563EB] text-[16px] font-semibold rounded-xl hover:bg-blue-50 transition-all"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                setUpcomingLeaves(prev => prev.filter(l => l.id !== selectedLeave?.id));
                                setPreviousLeaves(prev => prev.filter(l => l.id !== selectedLeave?.id));
                                setShowDeleteConfirm(false);
                                setShowLeaveDetails(false);
                                toast.success("Leave application deleted");
                            }}
                            className="flex-1 h-[48px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[16px] font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all"
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Leave Balance Dialog */}
            <Dialog open={showEditBalanceDialog} onOpenChange={setShowEditBalanceDialog}>
                <DialogContent showCloseButton={false} className="max-w-[400px] w-full p-6 border-none bg-white rounded-[12px] shadow-lg flex flex-col gap-0">
                    <div className="flex items-center justify-between mb-6">
                        <DialogTitle className="text-[18px] font-semibold text-[#1F2937]">Edit Leave Balance</DialogTitle>
                        <DialogClose asChild>
                            <button className="text-gray-400 hover:text-gray-600 outline-none w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                                <X size={18} />
                            </button>
                        </DialogClose>
                    </div>

                    <div className="flex flex-col gap-5 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                        {leaveBalances.map((balance) => (
                            <div key={balance.leaveType} className="flex flex-col gap-2">
                                <label className="text-[12px] font-medium text-[#4B5563] uppercase">{balance.leaveType}</label>
                                <input
                                    type="number"
                                    value={balanceForm[balance.leaveType] || 0}
                                    onChange={(e) => setBalanceForm({ ...balanceForm, [balance.leaveType]: Number(e.target.value) })}
                                    className="w-full h-[44px] border border-[#E5E7EB] rounded-lg px-4 text-[14px] outline-none focus:border-[#3F5A54]"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="mt-6">
                        <Button
                            onClick={handleSaveBalance}
                            disabled={isBalanceLoading}
                            className="w-full h-[48px] bg-[#3F5A54] hover:bg-[#2c4440] text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
                        >
                            {isBalanceLoading ? "Updating..." : "Update Balance"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Encash Leaves Dialog */}
            <Dialog open={showEncashDialog} onOpenChange={setShowEncashDialog}>
                <DialogContent showCloseButton={false} className="max-w-[360px] w-full p-6 border-none bg-white rounded-[12px] shadow-lg flex flex-col gap-0">
                    <div className="flex items-center justify-between mb-6">
                        <DialogTitle className="text-[18px] font-semibold text-[#1F2937]">Encash Leaves</DialogTitle>
                        <DialogClose asChild>
                            <button className="text-gray-400 hover:text-gray-600 outline-none w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                                <X size={18} />
                            </button>
                        </DialogClose>
                    </div>

                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-[12px] text-[#4B5563]">Number of leaves to encash <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                value={encashForm.amount}
                                onChange={(e) => setEncashForm({ ...encashForm, amount: Number(e.target.value) })}
                                className="w-full h-[44px] border border-[#E5E7EB] rounded-lg px-4 text-[14px] outline-none focus:border-blue-500"
                            />
                            <p className="text-[11px] text-[#64748B] flex items-center gap-1">
                                You can encash <span className="font-semibold text-[#1F2937]">{Math.max(0, balanceForm.casual + balanceForm.compOff)} Leave(s)</span> only
                                <AlertCircle size={12} className="inline text-gray-400" />
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[12px] text-[#4B5563]">Amount Per Leave <span className="text-red-500">*</span></label>
                            <div className="relative w-full">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                <input
                                    type="text"
                                    readOnly
                                    value={encashForm.rate}
                                    className="w-full h-[44px] border border-[#E5E7EB] rounded-lg pl-8 pr-4 text-[14px] bg-white font-medium text-[#1F2937]"
                                />
                            </div>
                        </div>

                        <div className="bg-[#F3F0FF] p-4 rounded-lg flex flex-col gap-1 border border-[#E0D7FF]">
                            <p className="text-[13px] text-[#1F2937] font-medium flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-[#8B5CF6]" />
                                Total Payout = ₹{(encashForm.amount * encashForm.rate).toLocaleString()}
                                <span className="text-[11px] text-[#64748B] font-normal ml-1">({encashForm.amount} * ₹{encashForm.rate})</span>
                            </p>
                            <p className="text-[11px] text-[#64748B] ml-6">Encashed leaves' amount added to staff salary</p>
                        </div>

                        <Button
                            onClick={handleEncashLeaves}
                            disabled={encashForm.amount <= 0 || encashForm.amount > (balanceForm.casual + balanceForm.compOff)}
                            className={cn(
                                "w-full h-[44px] font-medium rounded-lg mt-2 transition-colors",
                                encashForm.amount > 0 && encashForm.amount <= (balanceForm.casual + balanceForm.compOff)
                                    ? "bg-[#0085FF] hover:bg-[#0070D9] text-white border-none shadow-sm"
                                    : "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed shadow-none border-none hover:bg-[#E2E8F0]"
                            )}
                        >
                            Encash Leaves
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Summary Cards */}
            <div className="flex gap-[20px] mb-[24px]">
                {summary.map((card, idx) => (
                    <div key={idx} className="w-[79px] h-[69px] border border-[#E5E7EB] rounded-[4px] px-3 py-3 flex flex-col bg-white shadow-sm">
                        <span className="text-[7px] font-normal text-[#4B5563] mb-[10px] leading-tight">{card.label}</span>
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-[7px] font-normal text-[#4B5563] w-[22px]">Total</span>
                                    <span className="text-[7px] font-normal text-[#4B5563]">:</span>
                                </div>
                                <span className="text-[10px] font-medium text-[#1F2937]">{card.total}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-[7px] font-normal text-[#4B5563] w-[22px]">Take</span>
                                    <span className="text-[7px] font-normal text-[#4B5563]">:</span>
                                </div>
                                <span className="text-[10px] font-medium text-[#1F2937]">{card.take}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Sub-tabs Container */}
            <div className="h-[31px] border border-[#E5E7EB] rounded-[4px] flex items-center px-4 mb-8 bg-white overflow-hidden">
                <div className="flex items-center h-full gap-[20px]">
                    {["Upcoming Leaves", "Previous Leaves", "Leave Calendar"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setSubTab(tab)}
                            className={cn(
                                "h-full flex flex-col items-center justify-center px-1 text-[10px] font-normal transition-all relative",
                                subTab === tab ? "text-[#3F5A54]" : "text-[#6B7280] hover:text-[#1F2937]"
                            )}
                        >
                            <span className="relative z-10">{tab}</span>
                            {subTab === tab && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80px] h-px bg-[#3F5A54]" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            {subTab === "Previous Leaves" ? (
                <div className="w-full border border-[#E5E7EB] rounded-[8px] overflow-hidden bg-white min-h-[282px] flex flex-col">
                    <div className="h-[39px] bg-[#F0F0F0] flex items-center pl-[20px] pr-[100px] justify-between shrink-0">
                        <span className="text-[10px] font-medium text-[#9CA3AF] tracking-wider w-[110px]">Type</span>
                        <span className="text-[10px] font-medium text-[#9CA3AF] tracking-wider w-[100px]">Leaves Availed</span>
                        <span className="text-[10px] font-medium text-[#9CA3AF] tracking-wider w-[180px]">Leave Dates</span>
                        <span className="text-[10px] font-medium text-[#9CA3AF] tracking-wider w-[100px]">Status</span>
                        <span className="text-[10px] font-medium text-[#9CA3AF] tracking-wider w-[100px]">Created Date</span>
                        <span className="text-[10px] font-medium text-[#9CA3AF] tracking-wider w-[60px]">View</span>
                    </div>
                    {previousLeaves.length > 0 ? (
                        <div className="flex flex-col">
                            {previousLeaves.map((leave, idx) => (
                                <div key={idx} className="h-[47px] flex items-center pl-[20px] pr-[100px] justify-between border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50/50 transition-colors">
                                    <span className="text-[10px] font-normal text-[#1F2937] w-[110px] truncate">{leave.type}</span>
                                    <span className="text-[10px] font-normal text-[#1F2937] w-[100px]">{leave.leavesAvailed}</span>
                                    <span className="text-[10px] font-normal text-[#1F2937] w-[180px]">{leave.dates}</span>
                                    <div className="w-[100px] flex justify-start">
                                        <div className="px-1.5 py-0 bg-[#E1F9F0] text-[#10B981] rounded-full flex items-center gap-0.5 border border-[#BFF2E2]/30 shrink-0 h-[14px]">
                                            <CheckCircle2 size={6} />
                                            <span className="text-[7px] font-bold uppercase tracking-wider">{leave.status}</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-normal text-[#1F2937] w-[100px]">{leave.createdDate}</span>
                                    <div className="w-[60px] flex justify-end">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedLeave(leave);
                                                setShowLeaveDetails(true);
                                            }}
                                            className="text-[#9CA3AF] hover:text-[#1F2937] transition-all"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-10">
                            <div className="mb-[2px]">
                                <Image
                                    src={CloudIcon}
                                    alt="No data"
                                    width={85}
                                    height={85}
                                    className="object-contain opacity-90"
                                />
                            </div>
                            <p className="text-[#9CA3AF] text-[7px] font-normal tracking-wider uppercase">
                                No Leaves to Show
                            </p>
                        </div>
                    )}
                </div>
            ) : subTab === "Upcoming Leaves" ? (
                upcomingLeaves.length > 0 ? (
                    <div className="flex flex-col gap-4 w-full">
                        {upcomingLeaves.map((leave, idx) => (
                            <div key={idx} className="w-full h-[47px] border border-[#E5E7EB] rounded-[4px] bg-white flex items-center px-4 hover:shadow-sm transition-all cursor-pointer group">
                                <div className="w-[32px] h-[32px] bg-[#EEF2FF] rounded-[6px] flex items-center justify-center mr-4 shrink-0">
                                    <CustomCalendarIcon size={16} className="text-[#4F46E5]" />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-semibold text-[#1F2937]">{leave.dates}</span>
                                        <div className="px-1.5 py-0 bg-[#E1F9F0] text-[#10B981] rounded-full flex items-center gap-0.5 border border-[#BFF2E2]/30 h-[14px]">
                                            <CheckCircle2 size={6} />
                                            <span className="text-[7px] font-bold uppercase tracking-wider">{leave.status}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3.5 mt-0.5 overflow-hidden">
                                        <span className="text-[7px] text-[#6B7280] flex items-center gap-1 shrink-0">
                                            Leaves Availed: <span className="font-semibold text-[#1F2937] uppercase">{leave.leavesAvailed}</span>
                                        </span>
                                        <div className="w-px h-[8px] bg-gray-200" />
                                        <span className="text-[7px] text-[#6B7280] flex items-center gap-1 shrink-0">
                                            Type: <span className="font-semibold text-[#1F2937] uppercase">{leave.type}</span>
                                        </span>
                                        <div className="w-px h-[8px] bg-gray-200" />
                                        <span className="text-[7px] text-[#6B7280] flex items-center gap-1 truncate">
                                            Description: <span className="font-semibold text-[#1F2937] uppercase">{leave.description}</span>
                                        </span>
                                        <div className="w-[1px] h-[8px] bg-gray-200 shrink-0" />
                                        <span className="text-[7px] text-[#6B7280] flex items-center gap-1 shrink-0">
                                            Approved on: <span className="font-semibold text-[#1F2937] uppercase">{leave.approvedOn}</span>
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end ml-4">
                                    <ChevronRight
                                        size={16}
                                        className="text-[#9CA3AF] group-hover:text-[#1F2937] transition-all cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedLeave(leave);
                                            setShowLeaveDetails(true);
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-20">
                        <div className="mb-[2px]">
                            <Image
                                src={CloudIcon}
                                alt="No data"
                                width={85}
                                height={85}
                                className="object-contain opacity-90"
                            />
                        </div>
                        <p className="text-[#9CA3AF] text-[7px] font-normal tracking-wider uppercase">
                            No Leaves to Show
                        </p>
                    </div>
                )
            ) : (
                <div className="w-full h-[282px] bg-transparent" />
            )}
        </div>
    );
}

function ExpenseClaimsSection({ id, staff }: { id: string, staff: StaffData | null }) {
    const dispatch = useAppDispatch();
    const expenses = useAppSelector((state: any) => state.expense.expenses);
    const [searchQuery, setSearchQuery] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [showAddClaim, setShowAddClaim] = useState(false);
    const [selectedFY, setSelectedFY] = useState("FY 2025 - 2026");
    const [date, setDate] = useState<DateRange | undefined>({
        from: undefined,
        to: undefined,
    });
    const [filterData, setFilterData] = useState({
        expenseType: "",
        status: "",
        monthRange: ""
    });

    const [appliedFilters, setAppliedFilters] = useState({
        expenseType: "",
        status: "",
        monthRange: ""
    });

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [claimToDelete, setClaimToDelete] = useState<any>(null);

    useEffect(() => {
        if (id) {
            dispatch(getAllExpenses({ employee: id }));
        }
    }, [id, dispatch]);

    const handleDeleteClaim = async () => {
        if (!claimToDelete) return;

        const result = await dispatch(deleteExpense(claimToDelete._id));
        if (deleteExpense.fulfilled.match(result)) {
            toast.success("Expense claim deleted successfully");
        } else {
            toast.error("Failed to delete expense claim");
        }

        setShowDeleteConfirm(false);
        setClaimToDelete(null);
    };

    const filteredClaims = expenses.filter((claim: any) => {
        const matchesSearch = searchQuery === "" ||
            claim._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            claim.expenseType.toLowerCase().includes(searchQuery.toLowerCase()) ||
            claim.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = appliedFilters.expenseType === "" || claim.expenseType === appliedFilters.expenseType;
        const matchesStatus = appliedFilters.status === "" || claim.status === appliedFilters.status;

        const claimDate = new Date(claim.expenseDate);
        const year = claimDate.getFullYear();
        const month = claimDate.getMonth();

        let matchesFY = true;
        if (selectedFY) {
            const fyMatch = selectedFY.match(/FY (\d{4}) - (\d{4})/);
            if (fyMatch) {
                const startYear = parseInt(fyMatch[1]);
                const endYear = parseInt(fyMatch[2]);

                const isInFY = (year === startYear && month >= 3) || (year === endYear && month <= 2);
                matchesFY = isInFY;
            }
        }

        return matchesSearch && matchesType && matchesStatus && matchesFY;
    });

    const getProofUrl = (proof: any, isDownload = false) => {
        if (!proof) return "";
        let url = "";

        // If direct url is available, use it. Otherwise construct from public_id
        if (proof.url && proof.url.trim() !== "") {
            url = proof.url;
        } else if (proof.public_id) {
            url = `https://res.cloudinary.com/dusvarmgw/image/upload/${proof.public_id}`;
        }

        if (url && isDownload) {
            // Add fl_attachment to force download if it's a Cloudinary URL
            if (url.includes("res.cloudinary.com")) {
                if (url.includes("/upload/v")) {
                    url = url.replace("/upload/v", "/upload/fl_attachment/v");
                } else if (url.includes("/upload/")) {
                    url = url.replace("/upload/", "/upload/fl_attachment/");
                }
            }
        }
        return url;
    };

    const handleViewAttachment = (claim: any) => {
        const proofs = claim.proofs || [];
        if (proofs.length === 0) {
            toast.error("No attachments found for this claim");
            return;
        }
        const url = getProofUrl(proofs[0], false);
        if (url) {
            window.open(url, "_blank");
        } else {
            toast.error("Attachment URL not available");
        }
    };

    const handleDownloadAttachment = (claim: any) => {
        const proofs = claim.proofs || [];
        if (proofs.length === 0) {
            toast.error("No attachments found for this claim");
            return;
        }
        proofs.forEach((proof: any) => {
            const url = getProofUrl(proof, true);
            if (url) {
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `proof_${claim._id}`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        });
    };

    const fyOptions = ["FY 2024 - 2025", "FY 2025 - 2026"];

    if (showAddClaim) {
        return <AddExpenseClaimForm
            staff={staff}
            staffId={id}
            onBack={() => setShowAddClaim(false)}
        />;
    }

    return (
        <div className="flex flex-col w-full h-full">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-[30px]">
                <h2 className="text-[16px] font-medium text-[#1F2937]">Expense Claims</h2>
                <div className="flex items-center gap-[24px]">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-[119px] h-[30px] border-[#E5E7EB] text-[#1F2937] text-[10px] font-regular rounded-md hover:bg-gray-50 flex items-center justify-between px-3 outline-none whitespace-nowrap"
                            >
                                {selectedFY} <ChevronDown size={14} className="text-[#6B7280]" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-fit min-w-[160px] p-2 rounded-xl border-gray-100 shadow-xl mt-1">
                            {fyOptions.map((fy) => (
                                <DropdownMenuItem
                                    key={fy}
                                    onClick={() => setSelectedFY(fy)}
                                    className="flex items-center gap-3 py-2.5 px-3 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors outline-none"
                                >
                                    <div className="w-4 flex justify-center shrink-0">
                                        {selectedFY === fy && <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />}
                                    </div>
                                    <span className={cn(
                                        "text-[12px] font-medium whitespace-nowrap",
                                        selectedFY === fy ? "text-[#1F2937]" : "text-[#4B5563]"
                                    )}>
                                        {fy}
                                    </span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        onClick={() => setShowAddClaim(true)}
                        className="w-[100px] h-[30px] bg-[#3F5A54] hover:bg-[#2c4440] text-white text-[14px] font-medium rounded-md shadow-sm"
                    >
                        Add Claim
                    </Button>
                </div>
            </div>

            {/* Main Card */}
            <div className="w-full min-h-[324px] h-auto border border-[#E5E7EB] rounded-[12px] bg-white flex flex-col shadow-[0_2px_8px_rgba(0,0,0,0,04)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0,06)] overflow-hidden mb-[40px]">
                {/* Search and Filter Row */}
                <div className="p-[24px] flex items-center gap-[20px]">
                    <div className="relative w-[367px] group">
                        <Search
                            size={14}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] transition-colors group-focus-within:text-[#3F5A54]"
                        />
                        <input
                            type="text"
                            placeholder="Search by Name, ID"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-[37px] border border-[#E5E7EB] rounded-[6px] pl-10 pr-3 text-[10px] font-regular text-[#1F2937] placeholder:text-[#9CA3AF] outline-none transition-all focus:border-[#3F5A54] focus:ring-1 focus:ring-[#3F5A54]/10 bg-[#F9FAFB]/50 focus:bg-white"
                        />
                    </div>

                    <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-[85px] h-[32px] text-[#1F2937] text-[12px] font-medium rounded-lg border-none flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm",
                                    isFilterOpen ? "bg-[#e1e9ff]" : "bg-[#F0F5FF] hover:bg-[#e1e9ff]"
                                )}
                            >
                                <Filter size={14} className="text-[#3B82F6]" />
                                <span>Filter</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-[353px] p-0 border border-[#E5E7EB] rounded-[16px] shadow-[0_10px_40px_rgba(0,0,0,0.1)] overflow-hidden mt-3 animate-in fade-in zoom-in duration-200">
                            <div className="p-6 flex flex-col gap-5">
                                <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                                    <h3 className="text-[18px] font-bold text-[#1F2937] tracking-tight">Filter By</h3>
                                    <button onClick={() => setIsFilterOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-5 pt-1">
                                    {/* Expense Type */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Expense Type</label>
                                        <div className="relative group">
                                            <select
                                                value={filterData.expenseType}
                                                onChange={(e) => setFilterData({ ...filterData, expenseType: e.target.value })}
                                                className="w-full h-[44px] border border-[#E5E7EB] rounded-xl px-4 text-[13px] text-[#1F2937] outline-none appearance-none cursor-pointer focus:border-[#3F5A54] transition-all bg-white hover:bg-gray-50/50"
                                            >
                                                <option value="" className="text-gray-400">Select Expense Type</option>
                                                <option value="Travel">Travel</option>
                                                <option value="Food">Food</option>
                                            </select>
                                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none transition-transform group-hover:translate-y-[-40%]" />
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Status</label>
                                        <div className="relative group">
                                            <select
                                                value={filterData.status}
                                                onChange={(e) => setFilterData({ ...filterData, status: e.target.value })}
                                                className="w-full h-[44px] border border-[#E5E7EB] rounded-xl px-4 text-[13px] text-[#1F2937] outline-none appearance-none cursor-pointer focus:border-[#3F5A54] transition-all bg-white hover:bg-gray-50/50"
                                            >
                                                <option value="" className="text-gray-400">Select Status</option>
                                                <option value="Approved">Approved</option>
                                                <option value="Pending">Pending</option>
                                                <option value="Rejected">Rejected</option>
                                            </select>
                                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none transition-transform group-hover:translate-y-[-40%]" />
                                        </div>
                                    </div>

                                    {/* Month Range */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Month Range</label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <div className="relative h-[44px] group cursor-pointer">
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        placeholder="Select Month Range"
                                                        value={filterData.monthRange}
                                                        className="w-full h-full border border-[#E5E7EB] rounded-xl px-4 text-[13px] text-[#1F2937] outline-none cursor-pointer focus:border-[#3F5A54] transition-all bg-white hover:bg-gray-50/50"
                                                    />
                                                    <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none group-hover:text-[#3B82F6] transition-colors" />
                                                </div>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <CalendarUI
                                                    initialFocus
                                                    mode="range"
                                                    selected={date}
                                                    onSelect={(range) => {
                                                        setDate(range);
                                                        if (range?.from) {
                                                            const formatted = range.to
                                                                ? `${format(range.from, "MMM d")} - ${format(range.to, "MMM d")}`
                                                                : format(range.from, "MMM d");
                                                            setFilterData({ ...filterData, monthRange: formatted });
                                                        } else {
                                                            setFilterData({ ...filterData, monthRange: "" });
                                                        }
                                                    }}
                                                    numberOfMonths={1}
                                                    className="[--cell-size:28px] p-2"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>

                                {/* Footer Buttons */}
                                <div className="flex items-center gap-4 mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            const cleared = { expenseType: "", status: "", monthRange: "" };
                                            setFilterData(cleared);
                                            setAppliedFilters(cleared);
                                            setDate({ from: undefined, to: undefined });
                                            setIsFilterOpen(false);
                                        }}
                                        className="flex-1 h-[42px] border-[#E5E7EB] text-[#4B5563] text-[13px] font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                                    >
                                        Clear Filter
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setAppliedFilters(filterData);
                                            setIsFilterOpen(false);
                                        }}
                                        className="flex-1 h-[42px] bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[13px] font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                                    >
                                        Apply Filter
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Table Header */}
                <div className="h-[39px] bg-[#F0F0F0] flex items-center px-[20px] justify-between border-y border-[#3F5A54]/10 shrink-0">
                    <span className="text-[10px] font-medium text-[#9CA3AF] tracking-wider whitespace-nowrap w-[110px]">Expense Type</span>
                    <span className="text-[10px] font-medium text-[#9CA3AF] tracking-wider whitespace-nowrap w-[130px]">Staff Name</span>
                    <span className="text-[10px] font-medium text-[#9CA3AF] tracking-wider whitespace-nowrap w-[80px]">Staff ID</span>
                    <span className="text-[10px] font-medium text-[#9CA3AF] tracking-wider whitespace-nowrap w-[100px]">Expense Date</span>
                    <span className="text-[10px] font-medium text-[#9CA3AF] tracking-wider whitespace-nowrap w-[90px]">Bill No.</span>
                    <span className="text-[10px] font-medium text-[#9CA3AF] tracking-wider whitespace-nowrap w-[80px]">Amount</span>
                    <span className="text-[10px] font-medium text-[#9CA3AF] tracking-wider whitespace-nowrap w-[85px]">Status</span>
                    <span className="text-[10px] font-medium text-[#9CA3AF] tracking-wider whitespace-nowrap w-[100px]">Approved Amount</span>
                    <span className="text-[10px] font-medium text-[#9CA3AF] tracking-wider whitespace-nowrap w-[100px]">Approved by</span>
                    <span className="text-[10px] font-medium text-[#9CA3AF] tracking-wider whitespace-nowrap w-[70px]">Actions</span>
                </div>

                {/* Table Content */}
                <div className="flex-1 h-auto overflow-y-auto">
                    {filteredClaims.length > 0 ? (
                        <div className="flex flex-col">
                            {filteredClaims.map((claim: any, idx) => (
                                <div key={idx} className="h-[47px] flex items-center px-[20px] justify-between border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50/50 transition-colors">
                                    <span className="text-[10px] font-normal text-[#1F2937] w-[110px] truncate">{claim.expenseType}</span>
                                    <span className="text-[10px] font-normal text-[#1F2937] w-[130px] truncate">{(typeof claim.employee === 'object' && claim.employee !== null) ? `${claim.employee.personal?.firstName} ${claim.employee.personal?.lastName}` : staff?.name}</span>
                                    <span className="text-[10px] font-normal text-[#1F2937] w-[80px]">{(typeof claim.employee === 'object' && claim.employee !== null) ? claim.employee.employment?.employeeCode : staff?.empId}</span>
                                    <span className="text-[10px] font-normal text-[#1F2937] w-[100px]">{format(new Date(claim.expenseDate), "dd MMM ''yy")}</span>
                                    <span className="text-[10px] font-normal text-[#1F2937] w-[90px] truncate">{claim.billNumber || "-"}</span>
                                    <span className="text-[10px] font-normal text-[#1F2937] w-[80px]">₹ {claim.amount.toLocaleString('en-IN')}</span>
                                    <div className="w-[85px] flex justify-start">
                                        <div className={cn(
                                            "px-1.5 py-0 rounded-full flex items-center gap-0.5 border h-[14px]",
                                            claim.status === "Approved" ? "bg-[#E1F9F0] text-[#10B981] border-[#BFF2E2]/30" :
                                                claim.status === "Pending" ? "bg-[#FEF9C3] text-[#854D0E] border-[#FEF08A]/30" :
                                                    "bg-[#FEE2E2] text-[#EF4444] border-[#FECACA]/30"
                                        )}>
                                            {claim.status === "Approved" ? <CheckCircle2 size={6} /> : <AlertCircle size={6} />}
                                            <span className="text-[7px] font-bold uppercase tracking-wider">{claim.status}</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-normal text-[#1F2937] w-[100px]">₹ {claim.status === "Approved" ? claim.amount.toLocaleString('en-IN') : "0"}</span>
                                    <span className="text-[10px] font-normal text-[#1F2937] w-[100px] truncate">{claim.handledBy?.name || "-"}</span>
                                    <div className="w-[70px] flex items-center gap-2">
                                        <button
                                            onClick={() => handleViewAttachment(claim)}
                                            className="text-[#3B82F6] hover:scale-110 transition-transform"
                                        >
                                            <Eye size={12} />
                                        </button>
                                        <button
                                            onClick={() => handleDownloadAttachment(claim)}
                                            className="text-[#10B981] hover:scale-110 transition-transform"
                                        >
                                            <Download size={12} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setClaimToDelete(claim);
                                                setShowDeleteConfirm(true);
                                            }}
                                            className="text-[#EF4444] hover:scale-110 transition-transform"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-20">
                            <div className="mb-[15px]">
                                <Image
                                    src={CloudIcon}
                                    alt="No data"
                                    width={85}
                                    height={85}
                                    className="object-contain opacity-90"
                                />
                            </div>
                            <p className="text-[#9CA3AF] text-[7px] font-normal tracking-wider uppercase">
                                No Expense Claims to Show
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent showCloseButton={false} className="max-w-[340px] w-full p-6 border-none bg-white rounded-[12px] shadow-2xl flex flex-col gap-0">
                    <div className="flex items-center justify-between mb-4">
                        <DialogTitle className="text-[20px] font-bold text-[#1F2937]">Delete Expense Claim</DialogTitle>
                        <DialogClose asChild>
                            <button className="text-gray-400 hover:text-gray-600 outline-none">
                                <X size={20} />
                            </button>
                        </DialogClose>
                    </div>
                    <p className="text-[15px] text-[#6B7280] mb-8 leading-relaxed">
                        Are you sure you want to delete this expense claim? This action is irreversible.
                    </p>
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 h-[48px] border-[#2563EB] text-[#2563EB] text-[16px] font-semibold rounded-xl hover:bg-blue-50 transition-all"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteClaim}
                            className="flex-1 h-[48px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[16px] font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all"
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function AddExpenseClaimForm({ staff, staffId, onBack }: { staff: StaffData | null, staffId: string, onBack: () => void }) {
    const dispatch = useAppDispatch();
    const { state } = useSidebar();
    const [formData, setFormData] = useState({
        expenseType: "",
        expenseDate: undefined as Date | undefined,
        amount: "",
        billNumber: "",
        description: "",
    });
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const isSidebarExpanded = state === "expanded";
    const sidebarWidth = isSidebarExpanded ? "16rem" : "5rem";

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!formData.expenseType || !formData.expenseDate || !formData.amount || !formData.description || !formData.billNumber) {
            toast.error("Please fill all required fields");
            return;
        }

        if (attachments.length === 0) {
            toast.error("At least one proof file is required");
            return;
        }

        setIsSubmitting(true);
        try {
            const expenseData = new FormData();
            expenseData.append("expenseType", formData.expenseType);
            expenseData.append("expenseDate", formData.expenseDate ? formData.expenseDate.toISOString() : "");
            expenseData.append("amount", formData.amount);
            expenseData.append("billNumber", formData.billNumber);
            expenseData.append("description", formData.description);
            attachments.forEach((file) => {
                expenseData.append("proofs", file);
            });

            const result = await dispatch(createEmployeeExpense({ employeeId: staffId, expenseData })).unwrap();

            if (result && result._id) {
                // Auto-approve the claim since it was created by an Admin
                await dispatch(updateExpenseStatus({
                    id: result._id,
                    updateData: { status: 'Approved' }
                })).unwrap();

                toast.success("Expense claim created and approved successfully");
                dispatch(getAllExpenses({ employee: staffId }));
                onBack();
            } else {
                toast.success("Expense claim submitted successfully");
                dispatch(getAllExpenses({ employee: staffId }));
                onBack();
            }
        } catch (error) {
            console.error("Submission failed:", error);
            toast.error("Failed to submit claim. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveDraft = () => {
        toast.info("Save as draft coming soon");
    };

    return (
        <div className="flex flex-col w-full h-[calc(100vh-200px)] relative min-h-[calc(100vh-200px)] pb-[100px]">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-2 mb-6 cursor-pointer hover:opacity-80 transition-opacity w-fit" onClick={onBack}>
                <ArrowLeft size={16} className="text-[#3F5A54]" />
                <span className="text-[16px] font-medium text-[#3F5A54]">Back</span>
            </div>

            {/* Main Form Card */}
            <div className="w-full h-[377px] border border-[#3F5A54]/20 rounded-[8px] p-[30px] flex gap-[30px] bg-white shadow-sm overflow-hidden">
                {/* Left Side: Inputs */}
                <div className="flex flex-col gap-4">
                    <div className="flex gap-[30px]">
                        {/* Expense Type */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[7px] font-normal text-[#4B5563]">Expense Type <span className="text-red-500">*</span></label>
                            <div className="relative w-[245px] h-[36px]">
                                <select
                                    className="w-full h-full border border-[#E5E7EB] rounded-[4px] px-3 text-[10px] text-[#1F2937] outline-none appearance-none cursor-pointer focus:border-[#3F5A54]"
                                    value={formData.expenseType}
                                    onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })}
                                >
                                    <option value="">Select Expense Type</option>
                                    <option value="Travel">Travel</option>
                                    <option value="Food">Food</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                            </div>
                        </div>

                        {/* Expense Date */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[7px] font-normal text-[#4B5563]">Expense Date <span className="text-red-500">*</span></label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <div className="relative w-[245px] h-[36px] cursor-pointer group">
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.expenseDate ? format(formData.expenseDate, "dd/MM/yyyy") : ""}
                                            placeholder="Enter Expense Date"
                                            className="w-full h-full border border-[#E5E7EB] rounded-[4px] px-3 text-[10px] text-[#1F2937] outline-none cursor-pointer focus:border-[#3F5A54] placeholder:text-[#9CA3AF] bg-white group-hover:bg-gray-50/50"
                                        />
                                        <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none group-hover:text-[#3B82F6] transition-colors" />
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <CalendarUI
                                        mode="single"
                                        selected={formData.expenseDate}
                                        onSelect={(date) => setFormData({ ...formData, expenseDate: date })}
                                        initialFocus
                                        className="p-2"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="flex gap-[30px]">
                        {/* Bill No. */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[7px] font-normal text-[#4B5563]">Bill No. <span className="text-red-500">*</span></label>
                            <div className="relative w-[245px] h-[36px]">
                                <input
                                    type="text"
                                    placeholder="Enter bill number"
                                    value={formData.billNumber}
                                    onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                                    className="w-full h-full border border-[#E5E7EB] rounded-[4px] px-3 text-[10px] text-[#1F2937] outline-none focus:border-[#3F5A54] placeholder:text-[#9CA3AF]"
                                />
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[7px] font-normal text-[#4B5563]">Amount <span className="text-red-500">*</span></label>
                            <div className="w-[245px] h-[36px]">
                                <input
                                    type="text"
                                    placeholder="Enter amount"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full h-full border border-[#E5E7EB] rounded-[4px] px-3 text-[10px] text-[#1F2937] outline-none focus:border-[#3F5A54] placeholder:text-[#9CA3AF]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[7px] font-normal text-[#4B5563]">Description <span className="text-red-500">*</span></label>
                        <div className="w-[520px] h-[36px]">
                            <input
                                type="text"
                                placeholder="Enter Description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full h-full border border-[#E5E7EB] rounded-[4px] px-3 text-[10px] text-[#1F2937] outline-none focus:border-[#3F5A54] placeholder:text-[#9CA3AF]"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Side: Attachments */}
                <div className="w-[485px] shrink-0 flex flex-col gap-2.5">
                    <label className="text-[7px] font-normal text-[#4B5563]">Attachments <span className="text-red-500">*</span></label>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        multiple
                        onChange={handleFileSelect}
                    />
                    <div
                        className="flex-1 border-2 border-dashed border-[#3F5A54] rounded-[8px] bg-[#EEF0FF] flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-[#e6e8fc] transition-colors relative"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (e.dataTransfer.files) {
                                setAttachments(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
                            }
                        }}
                    >
                        {attachments.length > 0 ? (
                            <div className="flex flex-wrap gap-2 justify-center overflow-y-auto max-h-[200px] w-full p-2">
                                {attachments.map((file, idx) => (
                                    <div key={idx} className="bg-white border border-[#3F5A54]/20 rounded px-3 py-1.5 flex items-center gap-2 group/file">
                                        <span className="text-[10px] text-[#3F5A54] max-w-[150px] truncate">{file.name}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                            className="text-[#9CA3AF] hover:text-red-500"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <UploadCloud size={68} className="text-[#3F5A54] mb-4" strokeWidth={1} />
                                <p className="text-[16px] font-medium text-[#1F2937] mb-1 text-center">
                                    Drag & drop files or <span className="text-[#3F5A54] hover:underline">Upload file</span>
                                </p>
                                <p className="text-[10px] font-normal text-[#6B7280] text-center w-full px-2">
                                    [Supported formats: JPEG, PNG, GIF, MP4, PDF, PSD, AI, Word, PPT]
                                    <br />
                                    Maximum upload file size is 20 MB.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div
                className="fixed bottom-0 right-0 h-[80px] bg-white border-t border-gray-100 flex items-center justify-end px-10 gap-4 z-[50] transition-[left] duration-200 ease-linear"
                style={{ left: sidebarWidth }}
            >
                <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    className="w-[146px] h-[37px] border-[#3F5A54] text-[#3F5A54] text-[14px] font-medium rounded-[4px] hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                >
                    Save as Draft
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={cn(
                        "w-[146px] h-[37px] bg-[#3F5A54] hover:bg-[#2c4440] text-white text-[14px] font-medium rounded-[4px] shadow-sm transition-all active:scale-95",
                        isSubmitting && "opacity-70 cursor-not-allowed"
                    )}
                >
                    {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
            </div>
        </div>
    );
}

function DocumentCentreSection({ id }: { id: string }) {
    const dispatch = useAppDispatch();
    const currentEmployee = useAppSelector(selectCurrentEmployee);
    const isLoading = useAppSelector(selectEmployeeLoading);
    const [searchQuery, setSearchQuery] = useState("");
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [docToDelete, setDocToDelete] = useState<string | null>(null);
    const [docName, setDocName] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const documents = currentEmployee?.documents || [];

    const handleUpload = async () => {
        if (!docName || !selectedFile) {
            toast.error("Please provide both document name and file");
            return;
        }

        const documentData = {
            type: "others" as const,
            name: docName,
            number: docName,
            verified: false,
        };

        const result = await dispatch(addEmployeeDocument({
            employeeId: id,
            documentData,
            file: selectedFile
        }));

        if (addEmployeeDocument.fulfilled.match(result)) {
            toast.success("Document uploaded successfully!");
            setIsUploadOpen(false);
            setDocName("");
            setSelectedFile(null);
        } else {
            const errorMessage = (result.payload as string) || "Failed to upload document";
            toast.error(errorMessage);
        }
    };

    const handleDelete = async () => {
        if (docToDelete) {
            const result = await dispatch(removeEmployeeDocument({
                employeeId: id,
                documentId: docToDelete
            }));

            if (removeEmployeeDocument.fulfilled.match(result)) {
                toast.success("Document deleted successfully");
                setIsDeleteOpen(false);
                setDocToDelete(null);
            } else {
                const errorMessage = (result.payload as string) || "Failed to delete document";
                toast.error(errorMessage);
            }
        }
    };

    const handleDownload = async (doc: any) => {
        if (!doc.proof?.url) {
            toast.error("Document URL not found");
            return;
        }

        try {
            toast.success(`Downloading ${doc.name || doc.type}...`);
            const response = await fetch(doc.proof.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const fileName = doc.name || doc.type;
            const extension = doc.proof.url.split('.').pop() || 'pdf';
            link.setAttribute('download', `${fileName}.${extension}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
            toast.error("Failed to download document");
            // Fallback to window.open if blob download fails
            window.open(doc.proof.url, '_blank');
        }
    };

    const handleView = (doc: any) => {
        if (doc.proof?.url) {
            window.open(doc.proof.url, '_blank');
            toast.success(`Opening ${doc.name || doc.type} in new tab...`);
        } else {
            toast.error("Document URL not found");
        }
    };

    return (
        <div className="flex flex-col gap-[30px] w-full max-w-[1018px]">
            <h2 className="text-[16px] font-medium text-[#1F2937]">Document Centre</h2>

            {/* Main Card */}
            <div className="w-full h-[324px] border border-[#3F5A54]/20 rounded-[8px] flex flex-col bg-white shadow-sm overflow-hidden">
                {/* Header Actions */}
                <div className="p-[20px] flex items-center justify-between">
                    <div className="relative w-[367px] h-[37px]">
                        <Search size={14} className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                        <input
                            type="text"
                            placeholder="Search by Name, ID"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-full border border-[#E5E7EB] rounded-[4px] pl-[40px] pr-[15px] text-[10px] text-[#1F2937] outline-none placeholder:text-[#9CA3AF] transition-all focus:border-[#3F5A54]"
                        />
                    </div>

                    <Button
                        onClick={() => setIsUploadOpen(true)}
                        className="bg-[#3F5A54] hover:bg-[#2c4440] text-white text-[14px] font-medium w-[140px] h-[30px] rounded-[8px] shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        Upload Document
                    </Button>
                </div>

                {/* Table Header */}
                <div className="h-[39px] bg-[#F0F0F0] flex items-center shrink-0 border-y border-[#3F5A54]/10 px-[20px]">
                    <div className="flex-1 flex items-center">
                        <span className="text-[10px] font-medium text-[#9CA3AF] tracking-wider whitespace-nowrap">Name</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <span className="text-[10px] font-medium text-[#9CA3AF] tracking-wider whitespace-nowrap">Attachment</span>
                    </div>
                    <div className="flex-1 flex items-center justify-end">
                        <span className="text-[10px] font-medium text-[#9CA3AF] tracking-wider whitespace-nowrap pr-4">Actions</span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto">
                    {documents.length > 0 ? (
                        documents.filter(doc => (doc.name || doc.type).toLowerCase().includes(searchQuery.toLowerCase())).map((doc) => (
                            <div key={doc._id} className="h-[50px] border-b border-gray-100 flex items-center px-[20px] group hover:bg-gray-50/50 transition-colors">
                                <div className="flex-1 flex items-center">
                                    <span className="text-[11px] font-medium text-[#4B5563] whitespace-nowrap truncate pr-4">{doc.name || doc.type}</span>
                                </div>
                                <div className="flex-1 flex items-center justify-center">
                                    <div className={cn(
                                        "w-[22px] h-[28px] rounded-[3px] flex flex-col items-center justify-end pb-1 text-white relative shadow-sm scale-90",
                                        doc.proof?.url?.toLowerCase().endsWith('.pdf') ? "bg-[#EE1D23]" : "bg-[#3B82F6]"
                                    )}>
                                        <div className="text-[6px] font-bold leading-none tracking-tighter uppercase">
                                            {doc.proof?.url?.split('.').pop() || 'FILE'}
                                        </div>
                                        <div className="w-[8px] h-[8px] border-t-2 border-r-2 border-white absolute top-1 right-1 opacity-20"></div>
                                    </div>
                                </div>
                                <div className="flex-1 flex items-center gap-5 justify-end">
                                    <button
                                        onClick={() => handleView(doc)}
                                        className="text-[#3B82F6] hover:scale-110 transition-transform"
                                    >
                                        <Eye size={16} strokeWidth={2} />
                                    </button>

                                    <button onClick={() => handleDownload(doc)} className="text-[#3B82F6] hover:scale-110 transition-transform">
                                        <Download size={16} strokeWidth={2} />
                                    </button>
                                    <button onClick={() => {
                                        setDocToDelete(doc._id);
                                        setIsDeleteOpen(true);
                                    }} className="text-[#EE1D23] hover:scale-110 transition-transform">
                                        <Trash2 size={16} strokeWidth={2} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex-1 h-full flex flex-col items-center justify-center p-8">
                            <div className="mb-[15px]">
                                <Image
                                    src={CloudIcon}
                                    alt="No data"
                                    width={85}
                                    height={85}
                                    className="object-contain opacity-90"
                                    style={{ filter: 'invert(37%) sepia(93%) saturate(3000%) hue-rotate(205deg) brightness(100%) contrast(105%)' }}
                                />
                            </div>
                            <p className="text-[#9CA3AF] text-[7px] font-normal tracking-wider uppercase">
                                No Documents to Show
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Document Modal */}
            <Dialog open={isUploadOpen} onOpenChange={(open) => {
                setIsUploadOpen(open);
                if (!open) {
                    setDocName("");
                    setSelectedFile(null);
                }
            }}>
                <DialogContent className="sm:max-w-[376px] p-0 overflow-hidden rounded-[8px] border-none shadow-2xl">
                    <div className="p-6">
                        <DialogHeader className="mb-6 relative">
                            <DialogTitle className="text-[20px] font-bold text-[#1F2937]">Upload Document</DialogTitle>
                        </DialogHeader>

                        <div className="flex flex-col gap-5">
                            {/* Name of Document */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-medium text-[#6B7280]">Name of Document</label>
                                <input
                                    type="text"
                                    placeholder="Enter Name"
                                    value={docName}
                                    onChange={(e) => setDocName(e.target.value)}
                                    className="w-full h-[42px] border border-[#E5E7EB] rounded-[8px] px-4 text-[14px] text-[#1F2937] outline-none focus:border-[#3F5A54] placeholder:text-[#9CA3AF] transition-all"
                                />
                            </div>

                            {/* Image or Documents */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-medium text-[#6B7280]">Image or Documents</label>
                                <div className="relative h-[42px] flex items-center border border-[#E5E7EB] rounded-[8px] px-4 overflow-hidden group hover:border-[#3F5A54] transition-all cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    />
                                    <span className="text-[14px] text-[#9CA3AF] flex-1 truncate mr-2">
                                        {selectedFile ? selectedFile.name : ""}
                                    </span>
                                    {selectedFile ? (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedFile(null);
                                            }}
                                            className="w-[28px] h-[28px] flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all shrink-0"
                                        >
                                            <X size={16} />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="bg-[#E5E7EB] hover:bg-gray-300 text-[#4B5563] text-[10px] font-medium px-4 py-2 rounded-md transition-colors shrink-0"
                                        >
                                            Choose File
                                        </button>
                                    )}
                                </div>
                                <p className="text-[11px] text-[#9CA3AF] mt-1">Max size: 5 MB</p>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex gap-4 mt-10">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsUploadOpen(false);
                                    setDocName("");
                                    setSelectedFile(null);
                                }}
                                className="flex-1 h-[38px] border-[#3B82F6] text-[#3B82F6] hover:bg-blue-50 font-bold rounded-[8px] transition-all shadow-none"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={!docName || !selectedFile || isLoading}
                                className={cn(
                                    "flex-1 h-[38px] font-bold rounded-[8px] transition-all shadow-none",
                                    (docName && selectedFile && !isLoading)
                                        ? "bg-[#3F5A54] text-white hover:bg-[#2c4440]"
                                        : "bg-[#D1D5DB] text-[#3F5A54] cursor-not-allowed border-none"
                                )}
                            >
                                {isLoading ? "Uploading..." : "Save"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-[8px] border-none shadow-2xl">
                    <div className="p-8 flex flex-col gap-6">
                        <DialogHeader className="flex flex-row items-center justify-between pb-0">
                            <DialogTitle className="text-[20px] font-bold text-[#1F2937]">Delete Personal Document</DialogTitle>
                        </DialogHeader>

                        <p className="text-[#6B7280] text-[15px] font-medium leading-relaxed pr-4">
                            Are you sure you want to delete this document? This action is irreversible.
                        </p>

                        <div className="flex gap-4 mt-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsDeleteOpen(false)}
                                className="flex-1 h-[48px] border-[#3B82F6] text-[#3B82F6] hover:bg-blue-50 font-bold rounded-[8px] transition-all"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDelete}
                                disabled={isLoading}
                                className="flex-1 h-[48px] bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-[8px] transition-all"
                            >
                                {isLoading ? "Deleting..." : "Delete"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
