"use client";

import React, { useState } from "react";
import { Search, Filter, X, ChevronDown, Calendar as CalendarIcon, Check, ArrowLeft, MoreVertical, IndianRupee, Clock, Trash2, SquarePen, BanknoteArrowDown, PiggyBank } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    getAllExpenses,
    getExpenseStats,
    updateExpenseStatus,
    createExpense,
    createEmployeeExpense,
    deleteExpense,
    setFilters as setExpenseFilters
} from "@/features/expenseBalance/expenseSlice";
import { fetchEmployees } from "@/features/employee/employeeSlice";
import { useEffect } from "react";
import { toast } from "sonner";
import { ExpenseStatus } from "@/lib/types/api/expenses";

export default function ReimbursementsPage() {
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";

    const [activeTab, setActiveTab] = useState("Dashboard");
    const [view, setView] = useState("main"); // 'main', 'templates', 'create-template', or 'edit-claim'
    const [selectedClaim, setSelectedClaim] = useState<any>(null);
    const [isApprovalExpanded, setIsApprovalExpanded] = useState(false);
    const [openTemplateMenu, setOpenTemplateMenu] = useState<string | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [isAddClaimOpen, setIsAddClaimOpen] = useState(false);
    const [isItemiseOpen, setIsItemiseOpen] = useState(false);
    const [itemisedBills, setItemisedBills] = useState<any[]>([{ billNumber: "", amount: "" }]);
    const [addClaimStep, setAddClaimStep] = useState<'staff-selection' | 'form-details'>('staff-selection');
    const [selectedStaff, setSelectedStaff] = useState<any[]>([]);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [claimToDeleteId, setClaimToDeleteId] = useState<string | null>(null);

    // Frontend Helpers to Resolve Missing Names
    const getStaffName = (expense: any) => {
        if (!expense) return "N/A";
        
        // 1. Try populated object from backend
        const emp = expense.employee;
        if (emp && typeof emp === 'object') {
            if (emp.personal) {
                return `${emp.personal.firstName} ${emp.personal.lastName}`.trim();
            }
            if (emp.name) return emp.name;
        }

        // 2. Fallback: Search in global employees list by ID (emp can be an ID string or an object with _id)
        const empId = typeof emp === 'string' ? emp : emp?._id;
        if (!empId) return "N/A";

        const found = employees.find(e => 
            e._id === empId || 
            (typeof e.userId === 'object' ? e.userId?._id === empId : e.userId === empId)
        );

        if (found) {
            return found.name || (found.personal ? `${found.personal.firstName} ${found.personal.lastName}` : "N/A");
        }
        
        return "N/A";
    };

    const getStaffCode = (expense: any) => {
        if (!expense) return "N/A";
        
        const emp = expense.employee;
        if (emp && typeof emp === 'object' && emp.employment) {
            return emp.employment.employeeCode;
        }

        const empId = typeof emp === 'string' ? emp : emp?._id;
        if (!empId) return "N/A";

        const found = employees.find(e => 
            e._id === empId || 
            (typeof e.userId === 'object' ? e.userId?._id === empId : e.userId === empId)
        );
        
        return found ? found.empCode : "N/A";
    };

    const dispatch = useAppDispatch();
    const { employees } = useAppSelector((state) => state.employee);
    const {
        expenses,
        stats,
        loading: expenseLoading,
        filters: expenseFilters,
        success: expenseSuccess,
        error: expenseError
    } = useAppSelector((state) => state.expense);

    useEffect(() => {
        dispatch(getExpenseStats());
        dispatch(getAllExpenses(expenseFilters));
        dispatch(fetchEmployees());
    }, [dispatch, expenseFilters]);

    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [formData, setFormData] = useState({
        expenseType: "",
        dateRange: { from: undefined, to: undefined } as DateRange | undefined,
        billNumber: "",
        amount: "",
        description: "",
        proofs: [] as File[]
    });

    const handleSubmitClaim = async () => {
        if (!formData.expenseType || !formData.dateRange?.from || !formData.amount) {
            toast.error("Please fill all required fields");
            return;
        }

        const submitData = new FormData();
        submitData.append("expenseType", formData.expenseType === "travel" ? "Travel" : "Food");
        submitData.append("expenseDate", formData.dateRange.from.toISOString());
        submitData.append("amount", formData.amount);
        submitData.append("billNumber", formData.billNumber);
        submitData.append("description", formData.description);

        formData.proofs.forEach((file) => {
            submitData.append("proofs", file);
        });

        try {
            // Use the Admin-specific thunk to create for a specific employee
            const result = await dispatch(createEmployeeExpense({
                employeeId: selectedStaff[0]._id,
                expenseData: submitData
            })).unwrap();

            // Auto-approve the claim since it was created by an Admin
            if (result && result._id) {
                await dispatch(updateExpenseStatus({
                    id: result._id,
                    updateData: { status: 'Approved' }
                })).unwrap();

                toast.success("Claim submitted successfully");
            } else {
                toast.success("Claim submitted successfully");
            }

            setIsAddClaimOpen(false);
            setAddClaimStep('staff-selection');
            setSelectedStaff([]);
            dispatch(getExpenseStats());
            dispatch(getAllExpenses(expenseFilters));
            setFormData({
                expenseType: "",
                dateRange: { from: undefined, to: undefined },
                billNumber: "",
                amount: "",
                description: "",
                proofs: []
            });
        } catch (error: any) {
            toast.error(error || "Failed to submit claim");
        }
    };

    const handleSaveItemisedBills = () => {
        const totalAmount = itemisedBills.reduce((sum, bill) => sum + (parseFloat(bill.amount) || 0), 0);
        const billNumbers = itemisedBills.map(b => b.billNumber).filter(Boolean).join(", ");

        setSelectedClaim({
            ...selectedClaim,
            amount: totalAmount,
            billNumber: billNumbers
        });

        setIsItemiseOpen(false);
        toast.success("Bills itemised and total amount updated!");
    };

    const handleUpdateClaimStatus = async (id: string, status: 'Approved' | 'Rejected', reason?: string) => {
        try {
            await dispatch(updateExpenseStatus({ id, updateData: { status, rejectedReason: reason } })).unwrap();
            toast.success(`Claim ${status} successfully`);
            dispatch(getExpenseStats());
            dispatch(getAllExpenses(expenseFilters));
            setView('main');
        } catch (error: any) {
            toast.error(error || `Failed to ${status.toLowerCase()} claim`);
        }
    };

    const handleDeleteClaim = async () => {
        if (!claimToDeleteId) return;

        try {
            await dispatch(deleteExpense(claimToDeleteId)).unwrap();
            toast.success("Claim deleted permanently!");
            dispatch(getExpenseStats());
            setIsDeleteModalOpen(false);
            setClaimToDeleteId(null);
        } catch (error: any) {
            toast.error(error || "Failed to delete claim");
        }
    };

    const [filters, setFilters] = useState({
        expenseTypes: [] as string[],
        statuses: [] as string[],
        salaryType: "",
        monthRange: ""
    });

    const templateExpenseTypes = [
        { type: "Travel Expense", cat: "Travel" },
        { type: "Food Expense", cat: "Food" }
    ];
    const [selectedExpenseTypes, setSelectedExpenseTypes] = useState<string[]>([]);

    const expenseTypes = ["Travel", "Food", "Others"];
    const statuses = ["Pending", "Approved", "Rejected"];

    const toggleFilter = (category: 'expenseTypes' | 'statuses', value: string) => {
        setFilters(prev => {
            const current = prev[category];
            if (value === "Select All") {
                const allSelected = category === 'expenseTypes' ? expenseTypes : statuses;
                return { ...prev, [category]: current.length === allSelected.length ? [] : allSelected };
            }
            const updated = current.includes(value)
                ? current.filter(t => t !== value)
                : [...current, value];
            return { ...prev, [category]: updated };
        });
    };

    if (activeTab === "Settings" && view === "templates") {
        return (
            <div className="p-[40px] flex flex-col gap-6">
                {/* Back Button */}
                <button
                    onClick={() => setView("main")}
                    className="flex items-center gap-2 text-[14px] font-medium text-[#38514A] hover:opacity-80 transition-opacity w-fit"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                {/* Templates Card */}
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 min-h-[600px] shadow-sm">
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-[16px] font-medium text-[#1F2937]">Reimbursement Templates</h2>
                            <p className="text-[10px] text-[#4B5563]">Configure reimbursement templates, assign to staff, and more.</p>
                        </div>
                        <button
                            onClick={() => setView("create-template")}
                            className="flex items-center gap-2 px-4 h-[30px] w-[140px] bg-[#3F5A54] text-white rounded-[6px] text-[14px] font-medium hover:bg-[#2F443F] transition-colors"
                        >
                            <span className="text-[14px] font-light">+</span> New Template
                        </button>
                    </div>

                    {/* Template List */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between h-[78px] w-full px-[20px] border border-[#E5E7EB] rounded-xl hover:border-gray-300 transition-colors group relative">
                            <div className="flex flex-col gap-2">
                                <h3 className="text-[14px] font-medium text-[#1F2937]">Default Template</h3>
                                <div className="flex items-center text-[10px] text-[#9CA3AF] gap-1">
                                    <span>Created by: <span className="text-gray-500 font-medium">Hardik</span></span>
                                    <span className="mx-1">|</span>
                                    <span>Updated by: <span className="text-gray-500 font-medium">Hardik</span></span>
                                    <span className="mx-1">|</span>
                                    <span>Assigned Staff: <span className="text-gray-500 font-medium">2 Staffs</span></span>
                                </div>
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setOpenTemplateMenu(openTemplateMenu === "template-1" ? null : "template-1")}
                                    className="p-2 text-[#9CA3AF] hover:text-gray-600 transition-colors"
                                >
                                    <MoreVertical size={20} />
                                </button>

                                {/* Action Popup */}
                                {openTemplateMenu === "template-1" && (
                                    <div className="absolute top-[30px] right-0 w-[140px] bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200">
                                        {["Edit", "Assign Staff", "Clone", "Manage Rule", "Delete"].map((item) => (
                                            <button
                                                key={item}
                                                className={cn(
                                                    "w-full text-left px-4 py-2 text-[14px] transition-colors",
                                                    item === "Delete" ? "text-red-500 hover:bg-red-50" : "text-[#4B5563] hover:bg-gray-50"
                                                )}
                                                onClick={() => setOpenTemplateMenu(null)}
                                            >
                                                {item}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (activeTab === "Settings" && view === "create-template") {
        return (
            <div className="p-[40px] flex flex-col gap-6 relative min-h-screen pb-[120px]">
                {/* Back Button */}
                <button
                    onClick={() => setView("templates")}
                    className="flex items-center gap-2 text-[14px] font-medium text-[#38514A] hover:opacity-80 transition-opacity w-fit"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                {/* Create Template Card */}
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 h-[666px] shadow-sm flex flex-col gap-8 overflow-y-auto">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-[16px] font-medium text-[#1F2937]">Create Reimbursement Template</h2>
                        <p className="text-[10px] text-[#4B5563]">Create reimbursement templates from this page. Create expense types and disbursal settings.</p>
                    </div>

                    {/* Name Input */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-medium text-[#1F2937]">Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            placeholder="Provide a Template Name"
                            className="w-full h-[40px] px-3 border border-[#E5E7EB] rounded-lg text-[12px] outline-none focus:border-[#3F5A54] transition-colors"
                        />
                    </div>

                    {/* Select Expense Type Section */}
                    <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                        <div className="p-4 flex items-center justify-between border-b border-[#E5E7EB]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#F3F4F6] rounded-lg">
                                    <BanknoteArrowDown size={18} className="text-[#4B5563]" />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-[13px] font-medium text-[#1F2937]">Select Expense Type</h3>
                                    <p className="text-[10px] text-[#4B5563]">Select expense types for this template. Default expense types can be edited, but cannot be deleted.</p>
                                </div>
                            </div>
                            <button className="flex items-center gap-2 px-3 h-[32px] border border-[#E5E7EB] rounded-lg text-[12px] font-medium text-[#4B5563] bg-[#EEF0FF] hover:bg-gray-50 transition-colors">
                                <span className="text-[#3F5A54] text-[16px] font-light">+</span> Add Expense Type
                            </button>
                        </div>

                        <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-6 h-[40px] flex items-center justify-between text-[10px] font-medium text-[#9CA3AF] tracking-wider">
                            <span className="flex-1">Expense Type</span>
                            <span className="flex-1">Expense Category</span>
                            <div className="w-[200px] flex justify-between items-center pr-4">
                                <span>Actions</span>
                                <input
                                    type="checkbox"
                                    className="w-[16px] h-[16px] rounded border-[#E5E7EB] cursor-pointer"
                                    checked={selectedExpenseTypes.length === templateExpenseTypes.length}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedExpenseTypes(templateExpenseTypes.map(t => t.type));
                                        } else {
                                            setSelectedExpenseTypes([]);
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            {templateExpenseTypes.map((item, idx) => (
                                <div key={idx} className="px-6 h-[38px] flex items-center justify-between text-[10px] text-[#1F2937]">
                                    <span className="flex-1">{item.type}</span>
                                    <span className="flex-1">{item.cat}</span>
                                    <div className="w-[200px] flex justify-between items-center pr-4">
                                        <div className="flex items-center gap-2">
                                            <button className="text-[#F87171] hover:text-red-600 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                            <button className="text-[#60A5FA] hover:text-blue-600 transition-colors">
                                                <SquarePen size={16} />
                                            </button>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-[#E5E7EB] accent-[#3F5A54] cursor-pointer"
                                            checked={selectedExpenseTypes.includes(item.type)}
                                            onChange={() => {
                                                setSelectedExpenseTypes(prev =>
                                                    prev.includes(item.type)
                                                        ? prev.filter(t => t !== item.type)
                                                        : [...prev, item.type]
                                                );
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Disbursal Settings Section */}
                    <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                        <div className="p-4 flex items-center gap-3 border-b border-[#E5E7EB]">
                            <div className="p-2 bg-[#F3F4F6] rounded-lg">
                                <PiggyBank size={18} className="text-[#4B5563]" />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-[13px] font-medium text-[#1F2937]">Disbursal Settings</h3>
                                <p className="text-[10px] text-[#4B5563]">Choose how reimbursements should be disbursed.</p>
                            </div>
                        </div>
                        <div className="p-6 flex flex-col gap-4 bg-[#F8F9FD]">
                            <div className="flex items-center gap-3">
                                <button className="h-[29px] px-6 rounded-lg border border-[#3F5A54] bg-[#3F5A54]/5 text-[#3F5A54] text-[12px] font-medium flex items-center gap-2">
                                    <div className="w-3.5 h-3.5 rounded-full border-4 border-[#3F5A54]" />
                                    Separate
                                </button>
                                <button className="h-[29px] px-6 rounded-lg border border-[#E5E7EB] text-[#4B5563] text-[12px] font-medium flex items-center gap-2">
                                    <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />
                                    Process with Salary
                                </button>
                            </div>
                            <div className="bg-[#EDF0FFB2] p-4 rounded-lg flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full border border-blue-600 flex items-center justify-center text-blue-600 text-[10px] font-bold">i</div>
                                <p className="text-[11px] text-[#4B5563]">Reimbursement amount will be processed separately. It won't be attached to the salary processing.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Section - Fixed at bottom */}
                <div className={cn(
                    "fixed bottom-0 right-0 h-[80px] bg-white border-t border-[#E5E7EB] px-[40px] flex items-center justify-end gap-4 z-50 transition-all duration-300",
                    isCollapsed ? "left-[80px] w-[calc(100%-80px)]" : "left-[256px] w-[calc(100%-256px)]"
                )}>
                    <button
                        onClick={() => setView("templates")}
                        className="w-[146px] h-[37px] border border-[#E5E7EB] rounded-lg text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button className="w-[146px] h-[37px] bg-[#3F5A54] text-white rounded-lg text-[14px] font-medium hover:bg-[#2F443F] transition-colors">
                        Save
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'edit-claim' && selectedClaim) {
        return (
            <div className="flex flex-col h-full bg-[#FAFBFF]">
                {/* Back Button */}
                <div className="p-10 pb-0">
                    <button
                        onClick={() => setView('main')}
                        className="flex items-center gap-2 text-[14px] font-medium text-[#38514A] hover:opacity-80 transition-opacity w-fit"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>
                </div>

                <div className="p-10 flex flex-col gap-6">
                    {/* Title Section */}
                    <div className="flex items-center gap-2">
                        <h2 className="text-[18px] font-semibold text-[#1F2937]">Edit Claim</h2>
                        <span className="text-gray-300">|</span>
                        <span className="text-[#3F5A54] uppercase font-bold text-[16px]">
                            {selectedClaim.employee && typeof selectedClaim.employee === 'object'
                                ? `${selectedClaim.employee.personal.firstName} ${selectedClaim.employee.personal.lastName}`
                                : 'Expense Detail'}
                        </span>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm flex flex-col gap-8 min-h-[600px]">
                        {/* Grid Layout for Form Fields */}
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            {/* Expense Type */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-medium text-[#1F2937]">Expense Type <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select
                                        value={selectedClaim.expenseType}
                                        onChange={(e) => setSelectedClaim({ ...selectedClaim, expenseType: e.target.value })}
                                        className="w-full h-[40px] px-3 border border-[#E5E7EB] rounded-lg text-[12px] bg-[#F3F4F6] text-[#4B5563] outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Travel">Travel</option>
                                        <option value="Food">Food</option>
                                        <option value="Others">Others</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                                </div>
                            </div>

                            {/* Expense Date */}
                            <div className="flex flex-col gap-1.5 relative">
                                <label className="text-[11px] font-medium text-[#1F2937]">Expense Date <span className="text-red-500">*</span></label>
                                <div
                                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                                    className="relative cursor-pointer group"
                                >
                                    <input
                                        type="text"
                                        readOnly
                                        value={selectedClaim.expenseDate ? format(new Date(selectedClaim.expenseDate), "dd MMM, yyyy") : ""}
                                        className="w-full h-[40px] px-3 border border-[#E5E7EB] rounded-lg text-[12px] outline-none focus:border-[#3F5A54] transition-colors cursor-pointer"
                                    />
                                    <CalendarIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />

                                    {isDatePickerOpen && (
                                        <div className="absolute top-full left-0 mt-2 z-50 bg-white shadow-2xl rounded-2xl border border-gray-100 p-2 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                                            <Calendar
                                                mode="single"
                                                selected={selectedClaim.expenseDate ? new Date(selectedClaim.expenseDate) : undefined}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        setSelectedClaim({ ...selectedClaim, expenseDate: date.toISOString() });
                                                        setIsDatePickerOpen(false);
                                                    }
                                                }}
                                                initialFocus
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bill Number */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-medium text-[#1F2937]">Bill Number</label>
                                <input
                                    type="text"
                                    value={selectedClaim.billNumber || ""}
                                    onChange={(e) => setSelectedClaim({ ...selectedClaim, billNumber: e.target.value })}
                                    className="w-full h-[40px] px-3 border border-[#E5E7EB] rounded-lg text-[12px] outline-none focus:border-[#3F5A54] transition-colors"
                                />
                            </div>

                            {/* Amount */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-medium text-[#1F2937]">Amount <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    value={selectedClaim.amount}
                                    onChange={(e) => setSelectedClaim({ ...selectedClaim, amount: Number(e.target.value) })}
                                    className="w-full h-[40px] px-3 border border-[#E5E7EB] rounded-lg text-[12px] outline-none focus:border-[#3F5A54] transition-colors"
                                />
                            </div>

                            {/* Description */}
                            <div className="flex flex-col gap-1.5 col-span-2">
                                <label className="text-[11px] font-medium text-[#1F2937]">Description</label>
                                <textarea
                                    value={selectedClaim.description || "No description provided."}
                                    onChange={(e) => setSelectedClaim({ ...selectedClaim, description: e.target.value })}
                                    className="w-full h-[80px] p-3 border border-[#E5E7EB] rounded-lg text-[12px] outline-none focus:border-[#3F5A54] transition-colors resize-none"
                                />
                            </div>
                        </div>

                        {/* Attachments Section */}
                        <div className="flex flex-col gap-4 mt-4">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-medium text-[#1F2937]">Attachments <span className="text-red-500">*</span></label>
                            </div>

                            {/* Dynamic Attachments List */}
                            <div className="flex flex-wrap gap-6">
                                {(selectedClaim.proofs && selectedClaim.proofs.length > 0) ? (
                                    selectedClaim.proofs.map((proof: any, idx: number) => (
                                        <div key={idx} className="w-[350px] aspect-video bg-linear-to-br from-[#242424] to-[#121212] rounded-xl relative overflow-hidden group border border-gray-800 shadow-xl">
                                            {/* Top Bar */}
                                            <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between bg-black/10 backdrop-blur-sm z-10">
                                                <span className="text-[10px] text-gray-400 font-medium truncate">{proof.name || `attachment_${idx + 1}.jpg`}</span>
                                                <button
                                                    onClick={() => {
                                                        const newProofs = selectedClaim.proofs.filter((_: any, i: number) => i !== idx);
                                                        setSelectedClaim({ ...selectedClaim, proofs: newProofs });
                                                    }}
                                                    className="text-red-500 hover:text-red-400 p-1 transition-colors"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>

                                            {/* Preview Content */}
                                            <div className="w-full h-full flex items-center justify-center">
                                                <div className="w-full h-full bg-linear-to-t from-black/60 to-transparent" />
                                            </div>

                                            {/* Bottom Controls */}
                                            <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
                                                <label className="flex items-center gap-2 px-3 h-[28px] bg-white text-[#1F2937] text-[10px] font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-lg cursor-pointer">
                                                    <BanknoteArrowDown size={14} className="text-gray-600" />
                                                    Upload more
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const files = Array.from(e.target.files || []);
                                                            const newProofs = [...(selectedClaim.proofs || []), ...files.map(f => ({ name: f.name }))];
                                                            setSelectedClaim({ ...selectedClaim, proofs: newProofs });
                                                        }}
                                                    />
                                                </label>
                                                <button className="w-[28px] h-[28px] bg-white flex items-center justify-center rounded-lg shadow-lg hover:bg-gray-100 transition-colors">
                                                    <div className="w-3 h-3 rounded-full border border-blue-600 flex items-center justify-center text-blue-600 text-[8px] font-bold italic">i</div>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    /* Empty State / Upload Area */
                                    <div className="w-full">
                                        <input
                                            type="file"
                                            id="edit-proof-upload"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files || []);
                                                setSelectedClaim({
                                                    ...selectedClaim,
                                                    proofs: files.map(f => ({ name: f.name }))
                                                });
                                            }}
                                        />
                                        <label
                                            htmlFor="edit-proof-upload"
                                            className="w-full h-[200px] border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 flex flex-col items-center justify-center gap-4 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer group"
                                        >
                                            <div className="p-3 bg-white rounded-2xl shadow-sm text-[#3F5A54] group-hover:scale-110 transition-all border border-gray-100">
                                                <SquarePen size={24} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[14px] text-gray-700 font-semibold mb-1">Upload single or multiple proofs</p>
                                                <p className="text-[12px] text-gray-400 font-medium">Supporting PDF, JPEG or JPG (Max 5MB each)</p>
                                            </div>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Only show Approve/Reject for Pending claims */}
                <div className={cn(
                    "fixed bottom-0 right-0 h-[80px] bg-white border-t border-[#E5E7EB] px-[40px] flex items-center justify-end gap-3 z-50 transition-all duration-300",
                    isCollapsed ? "left-[80px] w-[calc(100%-80px)]" : "left-[256px] w-[calc(100%-256px)]"
                )}>
                    {selectedClaim.status === 'Pending' ? (
                        <>
                            <button
                                onClick={() => handleUpdateClaimStatus(selectedClaim._id, 'Rejected', 'Reason not specified')}
                                className="w-[146px] h-[37px] border border-[#E5E7EB] rounded-lg text-[14px] font-medium text-[#4B5563] hover:bg-gray-50 transition-colors"
                            >
                                Rejected
                            </button>
                            <button
                                onClick={() => handleUpdateClaimStatus(selectedClaim._id, 'Approved')}
                                className="w-[146px] h-[37px] bg-[#3F5A54] text-white rounded-lg text-[14px] font-medium hover:bg-[#2F443F] transition-colors"
                            >
                                Approve
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">Status:</span>
                            <div className={cn(
                                "px-6 py-2 rounded-full text-[13px] font-bold uppercase tracking-widest border",
                                selectedClaim.status === 'Approved'
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                            )}>
                                {selectedClaim.status}
                            </div>
                        </div>
                    )}
                </div>


            </div>
        );
    }

    return (
        <div className="p-[40px]">
            {/* Title */}
            <h1 className="text-[20px] font-semibold text-black">
                Reimbursements
            </h1>

            {/* Tabs */}
            <div className="flex items-center gap-2 mt-[24px] h-[31px] border border-[#E5E7EB] rounded-[6px] w-full">
                <button
                    onClick={() => {
                        setActiveTab("Dashboard");
                        setView("main");
                    }}
                    className={cn(
                        "text-[10px] px-[20px] relative h-full transition-colors",
                        activeTab === "Dashboard" ? "text-[#3F5A54] font-medium" : "text-[#4B5563]"
                    )}
                >
                    Dashboard
                    {activeTab === "Dashboard" && <div className="absolute bottom-0 left-0 right-0 h-[1px] w-[48px] ml-[20px] bg-[#3F5A54]" />}
                </button>
                <button
                    onClick={() => {
                        setActiveTab("Settings");
                        setView("main");
                    }}
                    className={cn(
                        "text-[10px] px-[20px] relative h-full transition-colors",
                        activeTab === "Settings" ? "text-[#3F5A54] font-medium" : "text-[#4B5563]"
                    )}
                >
                    Settings
                    {activeTab === "Settings" && <div className="absolute bottom-0 left-0 right-0 h-[1px] w-[48px] ml-[20px] bg-[#3F5A54]" />}
                </button>
            </div>

            {/* Main Content Area */}
            <div className="mt-[24px] p-[20px] bg-white border border-[#E5E7EB] rounded-xl relative">
                {activeTab === "Dashboard" ? (
                    view === 'main' ? (
                        <>
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <h2 className="text-[16px] font-medium text-black">
                                    Dashboard
                                </h2>

                                <div className="flex items-center gap-[24px]">
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                                            className="flex items-center justify-between px-2 h-[30px] w-[70px] border border-[#EEF0FF] bg-[#EEF0FF] rounded-[6px] text-[14px] font-medium text-[#4B5563]"
                                        >
                                            <Filter size={14} />
                                            Filter
                                        </button>

                                        {/* Filter Popup */}
                                        {isFilterOpen && (
                                            <div className="absolute top-[35px] right-0 w-[280px] bg-white rounded-lg p-5 shadow-xl border border-gray-100 z-50 flex flex-col gap-5">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-[16px] font-bold text-black">Filter By</h3>
                                                    <button onClick={() => setIsFilterOpen(false)} className="text-gray-400">
                                                        <X size={16} />
                                                    </button>
                                                </div>

                                                <div className="flex flex-col gap-4">
                                                    {/* Expense Type */}
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[12px] text-[#4B5563]">Expense Type</label>
                                                        <div className="relative">
                                                            <div className="w-full h-[40px] border border-[#E5E7EB] rounded-[6px] px-3 flex items-center justify-between text-[12px] text-gray-400 bg-white">
                                                                <span>{filters.expenseTypes.length > 0 ? `${filters.expenseTypes.length} Selected` : "Select Expense Type"}</span>
                                                                <button
                                                                    onClick={() => setOpenDropdown(openDropdown === 'expense' ? null : 'expense')}
                                                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                                >
                                                                    <ChevronDown size={14} />
                                                                </button>
                                                            </div>
                                                            {openDropdown === 'expense' && (
                                                                <div className="absolute top-full left-0 w-full bg-white border border-gray-100 rounded-md shadow-lg mt-1 flex-col z-10 py-1">
                                                                    <div
                                                                        onClick={() => toggleFilter('expenseTypes', 'Select All')}
                                                                        className="px-3 py-1.5 hover:bg-gray-50 text-[11px] flex items-center gap-2 cursor-pointer"
                                                                    >
                                                                        <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center", filters.expenseTypes.length === expenseTypes.length ? "bg-blue-600 border-blue-600" : "border-gray-300")}>
                                                                            {filters.expenseTypes.length === expenseTypes.length && <Check size={8} className="text-white" />}
                                                                        </div>
                                                                        Select All
                                                                    </div>
                                                                    {expenseTypes.map(type => (
                                                                        <div
                                                                            key={type}
                                                                            onClick={() => toggleFilter('expenseTypes', type)}
                                                                            className="px-3 py-1.5 hover:bg-gray-50 text-[11px] flex items-center gap-2 cursor-pointer"
                                                                        >
                                                                            <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center", filters.expenseTypes.includes(type) ? "bg-blue-600 border-blue-600" : "border-gray-300")}>
                                                                                {filters.expenseTypes.includes(type) && <Check size={8} className="text-white" />}
                                                                            </div>
                                                                            {type}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Status */}
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[12px] text-[#4B5563]">Status</label>
                                                        <div className="relative">
                                                            <div className="w-full h-[40px] border border-[#E5E7EB] rounded-[6px] px-3 flex items-center justify-between text-[12px] text-gray-400 bg-white">
                                                                <span>{filters.statuses.length > 0 ? `${filters.statuses.length} Selected` : "Select Status"}</span>
                                                                <button
                                                                    onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                                                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                                >
                                                                    <ChevronDown size={14} />
                                                                </button>
                                                            </div>
                                                            {openDropdown === 'status' && (
                                                                <div className="absolute top-full left-0 w-full bg-white border border-gray-100 rounded-md shadow-lg mt-1 flex-col z-10 py-1">
                                                                    <div
                                                                        onClick={() => toggleFilter('statuses', 'Select All')}
                                                                        className="px-3 py-1.5 hover:bg-gray-50 text-[11px] flex items-center gap-2 cursor-pointer"
                                                                    >
                                                                        <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center", filters.statuses.length === statuses.length ? "bg-blue-600 border-blue-600" : "border-gray-300")}>
                                                                            {filters.statuses.length === statuses.length && <Check size={8} className="text-white" />}
                                                                        </div>
                                                                        Select All
                                                                    </div>
                                                                    {statuses.map(status => (
                                                                        <div
                                                                            key={status}
                                                                            onClick={() => toggleFilter('statuses', status)}
                                                                            className="px-3 py-1.5 hover:bg-gray-50 text-[11px] flex items-center gap-2 cursor-pointer"
                                                                        >
                                                                            <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center", filters.statuses.includes(status) ? "bg-blue-600 border-blue-600" : "border-gray-300")}>
                                                                                {filters.statuses.includes(status) && <Check size={8} className="text-white" />}
                                                                            </div>
                                                                            {status}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Salary Type */}
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[12px] text-[#4B5563]">Salary Type</label>
                                                        <select className="w-full h-[40px] border border-[#E5E7EB] rounded-[6px] px-3 text-[12px] outline-none bg-white text-[#4B5563]">
                                                            <option>Select salary type</option>
                                                        </select>
                                                    </div>

                                                    {/* Month Range */}
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[12px] text-[#4B5563]">Month Range</label>
                                                        <div className="w-full h-[40px] border border-[#E5E7EB] rounded-[6px] px-3 flex items-center justify-between text-[12px] text-gray-400 bg-white">
                                                            <span>Select Month Range</span>
                                                            <CalendarIcon size={14} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => {
                                                            setFilters({ expenseTypes: [], statuses: [], salaryType: "", monthRange: "" });
                                                            dispatch(setExpenseFilters({ expenseType: undefined, status: undefined }));
                                                            setIsFilterOpen(false);
                                                        }}
                                                        className="flex-1 h-[36px] border border-blue-600 text-blue-600 rounded-lg text-[13px] font-medium"
                                                    >
                                                        Clear Filter
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            dispatch(setExpenseFilters({
                                                                expenseType: filters.expenseTypes[0] as any,
                                                                status: filters.statuses[0] as any
                                                            }));
                                                            setIsFilterOpen(false);
                                                        }}
                                                        className="flex-1 h-[36px] bg-[#0066FF] text-white rounded-lg text-[13px] font-medium"
                                                    >
                                                        Apply Filter
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <select className="flex items-center px-2 h-[36px] w-[120px] border border-[#E5E7EB] bg-white rounded-[8px] text-[12px] font-medium text-[#4B5563] outline-none">
                                        <option>FY 2024 - 2025</option>
                                        <option>FY 2025 - 2026</option>

                                    </select>

                                    <button
                                        onClick={() => setIsAddClaimOpen(true)}
                                        className="flex items-center gap-1 px-2 h-[30px] bg-[#EEF0FF] rounded-[8px] text-[12px] font-medium text-[#4B5563] hover:opacity-90 transition-opacity"
                                    >
                                        <span className="text-[16px] font-light">+</span> Add Claim
                                    </button>
                                </div>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-3 gap-[20px] mt-[24px]">
                                {/* Approved */}
                                <div className="bg-[#DCFCE7] h-[140px] w-full p-[24px] rounded-2xl flex flex-col justify-between relative">
                                    <div className="flex justify-between items-start">
                                        <p className="text-[14px] font-medium text-[#4B5563]">
                                            Reimbursements Approved
                                        </p>
                                        <div className="w-[32px] h-[32px] border border-[#22C55E] rounded-[6px] flex items-center justify-center text-[#22C55E]">
                                            <Check size={18} />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <h3 className="text-[24px] font-semibold text-black">₹ {stats?.overallStats?.approvedAmount || 0}</h3>
                                        <p className="text-[12px] font-medium text-[#4B5563]">
                                            Claims: {stats?.statusStats.find(s => s._id === 'Approved')?.count || 0}
                                        </p>
                                    </div>
                                </div>

                                {/* Pending */}
                                <div className="bg-[#FEF3C7] h-[140px] w-full p-[24px] rounded-2xl flex flex-col justify-between relative">
                                    <div className="flex justify-between items-start">
                                        <p className="text-[14px] font-medium text-[#4B5563]">
                                            Reimbursements Pending
                                        </p>
                                        <div className="w-[32px] h-[32px] border border-[#FACC15] rounded-[6px] flex items-center justify-center text-[#FACC15]">
                                            <Clock size={18} />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <h3 className="text-[24px] font-semibold text-black">₹ {stats?.overallStats?.pendingAmount || 0}</h3>
                                        <p className="text-[12px] font-medium text-[#4B5563]">
                                            Claims: {stats?.statusStats.find(s => s._id === 'Pending')?.count || 0}
                                        </p>
                                    </div>
                                </div>

                                {/* Rejected */}
                                <div className="bg-[#F3F0FF] h-[140px] w-full p-[24px] rounded-2xl flex flex-col justify-between relative">
                                    <div className="flex justify-between items-start">
                                        <p className="text-[14px] font-medium text-[#4B5563]">
                                            Reimbursements Rejected
                                        </p>
                                        <div className="w-[32px] h-[32px] border border-red-500 rounded-[6px] flex items-center justify-center text-red-500">
                                            <X size={18} />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <h3 className="text-[24px] font-semibold text-black">
                                            ₹ {stats?.statusStats.find(s => s._id === 'Rejected')?.totalAmount || 0}
                                        </h3>
                                        <p className="text-[12px] font-medium text-[#4B5563]">
                                            Claims: {stats?.statusStats.find(s => s._id === 'Rejected')?.count || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Table Section */}
                            <div className="mt-8 border border-[#E5E7EB] rounded-lg overflow-x-auto">
                                {/* Search */}
                                <div className="p-4 bg-white border-b border-[#E5E7EB]">
                                    <div className="flex items-center border border-[#E5E7EB] rounded-[12px] h-[44px] w-[367px] pl-[20px] bg-white">
                                        <Search size={18} className="text-[#9CA3AF]" />
                                        <input
                                            type="text"
                                            placeholder="Search by Name, ID"
                                            className="ml-[12px] outline-none text-[13px] w-full placeholder:text-[#9CA3AF]"
                                        />
                                    </div>
                                </div>

                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] h-[45px]">
                                            <th className="px-6 py-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap w-[12%]">Expense Type</th>
                                            <th className="px-6 py-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap w-[15%]">Staff Name</th>
                                            <th className="px-6 py-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap w-[8%]">Staff ID</th>
                                            <th className="px-6 py-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap w-[11%]">Exp. Date</th>
                                            <th className="px-6 py-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap w-[8%]">Bill No.</th>
                                            <th className="px-6 py-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap w-[10%] text-right">Amount</th>
                                            <th className="px-6 py-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap w-[10%] text-center">Status</th>
                                            <th className="px-6 py-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap w-[12%] text-right">Approved Amount</th>
                                            <th className="px-6 py-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap w-[9%] text-center">Approved By</th>
                                            <th className="px-6 py-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap w-[5%] text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {expenses.length > 0 ? (
                                            expenses.map((item) => (
                                                <tr key={item._id} className="h-[65px] hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 text-[12px] text-[#4B5563]">{item.expenseType}</td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-[12px] font-semibold text-gray-700">{getStaffName(item)}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-[12px] text-gray-500">{getStaffCode(item)}</td>
                                                    <td className="px-6 py-4 text-[12px] font-medium text-gray-600 whitespace-nowrap">
                                                        {format(new Date(item.expenseDate), "dd MMM, yyyy")}
                                                    </td>
                                                    <td className="px-6 py-4 text-[12px] text-gray-500 truncate max-w-[100px]" title={item.billNumber}>
                                                        {item.billNumber || "N/A"}
                                                    </td>
                                                    <td className="px-6 py-4 text-[12px] font-bold text-gray-900 text-right">₹ {item.amount.toLocaleString()}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-center">
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap border",
                                                                item.status === 'Pending' ? "bg-yellow-50 text-yellow-600 border-yellow-200" :
                                                                item.status === 'Approved' ? "bg-green-50 text-green-600 border-green-200" :
                                                                "bg-red-50 text-red-600 border-red-200"
                                                            )}>
                                                                ● {item.status}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-[12px] text-gray-700 text-right font-medium">
                                                        {item.status === 'Approved' ? `₹ ${item.amount.toLocaleString()}` : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-[12px] text-[#4B5563] text-center truncate">
                                                        {typeof item.handledBy === 'object' && item.handledBy ? item.handledBy.name : 'Pending'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedClaim(item);
                                                                    setView("edit-claim");
                                                                }}
                                                                className="text-blue-500 hover:bg-blue-50 p-1 rounded-md transition-colors"
                                                            >
                                                                <SquarePen size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setClaimToDeleteId(item._id);
                                                                    setIsDeleteModalOpen(true);
                                                                }}
                                                                className="text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={10} className="py-20 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <Image src="/assets/dashicons/cloud.png" alt="no data" width={85} height={85} />
                                                        <p className="text-[12px] text-[#9CA3AF] mt-4 font-medium">No Reimbursements found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : view === "settings" ? (
                        <div className="flex flex-col h-[349px]">
                            <h2 className="text-[16px] font-medium text-[#1F2937] mb-1">Reimbursement Settings</h2>
                            <p className="text-[10px] text-[#9CA3AF] mb-8">Access reimbursement based settings here.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-[349px]">
                            <h2 className="text-[16px] font-medium text-[#1F2937] mb-1">Reimbursement Settings</h2>
                            <p className="text-[10px] text-[#9CA3AF] mb-8">Access reimbursement based settings here.</p>

                            <div className="flex flex-col gap-4">
                                {/* Reimbursement Templates */}
                                <button
                                    onClick={() => setView("templates")}
                                    className="flex items-center justify-between w-full h-[78px] p-[20px] border border-[#E5E7EB] rounded-[10px] hover:bg-gray-50 transition-colors text-left group"
                                >
                                    <div className="flex flex-col gap-1">
                                        <h4 className="text-[14px] font-medium text-[#1F2937]">Reimbursement Templates</h4>
                                        <p className="text-[10px] text-[#9CA3AF]">Configure reimbursement templates, assign to staff, and more.</p>
                                    </div>
                                    <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                                        <ChevronDown size={20} className="-rotate-90 transition-transform" />
                                    </div>
                                </button>

                                {/* Approval Setting */}
                                <div className={cn(
                                    "flex flex-col border border-[#E5E7EB] rounded-[10px] transition-all duration-300",
                                    isApprovalExpanded ? "min-h-[400px]" : "h-[78px]"
                                )}>
                                    <button
                                        onClick={() => setIsApprovalExpanded(!isApprovalExpanded)}
                                        className="flex items-center justify-between w-full h-[78px] p-[20px] hover:bg-gray-50 transition-colors text-left group"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <h4 className="text-[14px] font-medium text-[#1F2937]">Approval Setting</h4>
                                            <p className="text-[10px] text-[#9CA3AF]">Choose admins who will be approving staff reimbursement requests</p>
                                        </div>
                                        <div className={cn("text-gray-400 group-hover:text-gray-600 transition-transform", isApprovalExpanded ? "rotate-0" : "-rotate-90")}>
                                            <ChevronDown size={20} />
                                        </div>
                                    </button>

                                    {isApprovalExpanded && (
                                        <div className="flex-1 flex flex-col items-center justify-center border-t border-[#E5E7EB]">
                                            <div className="w-[85px] h-[85px] relative mb-4">
                                                <Image
                                                    src="/assets/dashicons/cloud.png"
                                                    alt="no admins"
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                            <p className="text-[7px] text-[#9CA3AF] text-center max-w-[280px]">
                                                No Admins found. You can add admin from the Settings.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col h-[349px]">
                        <h2 className="text-[16px] font-medium text-[#1F2937] mb-1">Reimbursement Settings</h2>
                        <p className="text-[10px] text-[#9CA3AF] mb-8">Access reimbursement based settings here.</p>
                    </div>
                )}
            </div>

            {/* Add Claim Form - Side Drawer with Backdrop */}
            {isAddClaimOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-90 animate-in fade-in duration-300"
                        onClick={() => {
                            setIsAddClaimOpen(false);
                            setAddClaimStep('staff-selection');
                            setSelectedStaff([]);
                        }}
                    />

                    <div className="fixed top-4 right-4 bottom-4 w-[450px] bg-white border border-gray-100 rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15)] z-[100] flex flex-col animate-in slide-in-from-right duration-500 ease-out overflow-hidden">
                        {/* Header */}
                        <div className="px-8 h-[80px] flex items-center justify-between border-b border-gray-50 bg-gray-50/30">
                            <h2 className="text-[20px] font-semibold text-gray-900">
                                {addClaimStep === 'staff-selection' ? "Select Staff" : "Add Expense Claim"}
                            </h2>
                            <button
                                onClick={() => {
                                    setIsAddClaimOpen(false);
                                    setAddClaimStep('staff-selection');
                                    setSelectedStaff([]);
                                }}
                                className="transition-all text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {addClaimStep === 'staff-selection' ? (
                            <>
                                {/* Staff Selection Content */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    {/* Search Staff */}
                                    <div className="p-4 pb-6">
                                        <div className="relative group">
                                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#3F5A54] transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Search staff name, id..."
                                                className="w-full h-[40px] pl-10 pr-4 bg-gray-50 border border-gray-100 rounded-xl text-[13px] outline-none focus:bg-white focus:border-[#3F5A54] transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Table Header */}
                                    <div className="px-8 py-3 flex items-center justify-between text-[12px] font-semibold text-gray-500 uppercase tracking-wider bg-[#F0F0F0]">
                                        <div className="flex-2">Staff Name</div>
                                        <div className="flex-1">Staff ID</div>
                                        <div className="w-[40px] flex justify-end">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-gray-300 accent-[#3F5A54]"
                                                checked={selectedStaff.length === employees.length && employees.length > 0}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedStaff(employees);
                                                    else setSelectedStaff([]);
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Staff List */}
                                    <div className="px-4 py-3">
                                        <div className="flex flex-col gap-3">
                                            {employees.map((staff) => (
                                                <div
                                                    key={staff._id}
                                                    className={cn(
                                                        "flex items-center justify-between p-3 rounded-xl transition-all border cursor-pointer",
                                                        selectedStaff.some(s => s._id === staff._id)
                                                            ? "bg-[#3F5A54]/5 border-[#3F5A54]/20 shadow-sm"
                                                            : "bg-white border-transparent hover:bg-gray-50/80"
                                                    )}
                                                    onClick={() => {
                                                        const isSelected = selectedStaff.some(s => s._id === staff._id);
                                                        if (isSelected) {
                                                            setSelectedStaff(prev => prev.filter(s => s._id !== staff._id));
                                                        } else {
                                                            setSelectedStaff(prev => [...prev, staff]);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex-2 flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-600 border border-white shadow-sm">
                                                            {staff.name ? staff.name[0] : "?"}
                                                        </div>
                                                        <span className="text-[13px] font-medium text-gray-700">{staff.name || "Unknown"}</span>
                                                    </div>
                                                    <div className="flex-1 text-[12px] font-medium text-gray-400">
                                                        {staff.empCode || "N/A"}
                                                    </div>
                                                    <div className="w-[40px] flex justify-end">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded border-gray-300 accent-[#3F5A54]"
                                                            checked={selectedStaff.some(s => s._id === staff._id)}
                                                            readOnly
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                {selectedStaff.length > 0 && (
                                    <div className="p-6 border-t border-gray-50 bg-white animate-in slide-in-from-bottom duration-300">
                                        <button
                                            onClick={() => setAddClaimStep('form-details')}
                                            className="w-full h-[48px] bg-[#3F5A54] text-white rounded-xl text-[14px] font-semibold hover:bg-[#2F443F] shadow-lg shadow-[#3F5A54]/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            Continue
                                            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">
                                                {selectedStaff.length}
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Form Content */}
                                <div className="flex-1 px-8 py-6 flex flex-col gap-6 overflow-y-auto scrollbar-hide">
                                    {/* Selected Staff Summary */}
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Selected Staff</span>
                                            <p className="text-[13px] font-bold text-gray-900">
                                                {selectedStaff.length === 1
                                                    ? selectedStaff[0].name
                                                    : `${selectedStaff.length} Employees Selected`}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setAddClaimStep('staff-selection')}
                                            className="text-[12px] font-semibold text-[#3F5A54] hover:underline"
                                        >
                                            Change
                                        </button>
                                    </div>

                                    {/* Expense Type */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
                                            Expense Type <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative group">
                                            <select
                                                value={formData.expenseType}
                                                onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })}
                                                className="w-full h-[40px] border border-gray-200 rounded-xl px-4 text-[13px] text-gray-800 appearance-none bg-white focus:border-[#3F5A54] focus:ring-1 focus:ring-[#3F5A54]/20 outline-none transition-all group-hover:border-gray-300"
                                            >
                                                <option value="">Select Expense Type</option>
                                                <option value="travel">Travel Expense</option>
                                                <option value="food">Food Expense</option>
                                            </select>
                                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" />
                                        </div>
                                    </div>

                                    {/* Expense Date */}
                                    <div className="flex flex-col gap-1.5 relative">
                                        <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
                                            Expense Date <span className="text-red-400">*</span>
                                        </label>
                                        <div
                                            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                                            className="relative group cursor-pointer"
                                        >
                                            <input
                                                type="text"
                                                readOnly
                                                placeholder="Select Date Range"
                                                value={formData.dateRange?.from ? (
                                                    formData.dateRange.to
                                                        ? `${format(formData.dateRange.from, "dd LLL")} - ${format(formData.dateRange.to, "dd LLL")}`
                                                        : format(formData.dateRange.from, "dd LLL")
                                                ) : ""}
                                                className="w-full h-[40px] border border-gray-200 rounded-xl px-4 text-[13px] text-gray-800 focus:border-[#3F5A54] focus:ring-1 focus:ring-[#3F5A54]/20 outline-none transition-all group-hover:border-gray-300 cursor-pointer pointer-events-none"
                                            />
                                            <CalendarIcon size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                        </div>

                                        {isDatePickerOpen && (
                                            <div className="absolute top-[calc(100%+8px)] left-0 z-110 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 animate-in fade-in slide-in-from-top-2">
                                                <Calendar
                                                    initialFocus
                                                    mode="range"
                                                    defaultMonth={formData.dateRange?.from}
                                                    selected={formData.dateRange}
                                                    onSelect={(range) => {
                                                        setFormData({ ...formData, dateRange: range });
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Bill Number & Amount */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">Bill Number</label>
                                            <input
                                                type="text"
                                                placeholder="Enter"
                                                value={formData.billNumber}
                                                onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                                                className="w-full h-[40px] border border-gray-200 rounded-xl px-4 text-[13px] text-gray-800 focus:border-[#3F5A54] outline-none transition-all hover:border-gray-300"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
                                                Amount <span className="text-red-400">*</span>
                                            </label>
                                            <div className="relative group">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-gray-500 font-medium group-focus-within:text-[#3F5A54]">₹</span>
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={formData.amount}
                                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                    className="w-full h-[40px] border border-gray-200 rounded-xl pl-9 pr-4 text-[13px] text-gray-800 focus:border-[#3F5A54] outline-none transition-all group-hover:border-gray-300"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">Description</label>
                                        <textarea
                                            placeholder="Add any additional details here..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full h-[100px] border border-gray-200 rounded-xl px-4 py-3 text-[13px] text-gray-800 focus:border-[#3F5A54] outline-none transition-all hover:border-gray-300 resize-none"
                                        />
                                    </div>

                                    {/* Proofs Section */}
                                    <div className="mt-2 text-left">
                                        <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider block mb-3">Proofs</label>
                                        <input
                                            type="file"
                                            id="proof-upload"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files || []);
                                                setFormData(prev => ({ ...prev, proofs: [...prev.proofs, ...files] }));
                                            }}
                                        />
                                        <label
                                            htmlFor="proof-upload"
                                            className="border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50 p-8 flex flex-col items-center justify-center gap-4 hover:bg-gray-50 hover:border-gray-200 transition-all cursor-pointer group"
                                        >
                                            <div className="p-2 bg-white rounded-2xl shadow-sm text-[#3F5A54] group-hover:scale-110 transition-all">
                                                <SquarePen size={20} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[13px] text-gray-700 font-semibold mb-1">Upload single or multiple proofs</p>
                                                <p className="text-[11px] text-gray-400 font-medium">Supporting PDF, JPEG or JPG (Max 5MB each)</p>
                                            </div>
                                        </label>

                                        {/* Uploaded Files List */}
                                        {formData.proofs.length > 0 && (
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {formData.proofs.map((file, index) => (
                                                    <div key={index} className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg text-[12px] text-gray-700">
                                                        <span className="truncate max-w-[150px]">{file.name}</span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    proofs: prev.proofs.filter((_, i) => i !== index)
                                                                }));
                                                            }}
                                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="px-8 py-6 border-t border-gray-50 bg-gray-50/30 flex gap-4">
                                    <button
                                        onClick={() => {
                                            setIsAddClaimOpen(false);
                                            setAddClaimStep('staff-selection');
                                            setSelectedStaff([]);
                                        }}
                                        className="flex-1 h-[44px] border border-gray-200 text-gray-600 rounded-xl text-[14px] font-semibold hover:bg-white transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmitClaim}
                                        className="flex-1 h-[44px] bg-[#3F5A54] text-white rounded-xl text-[14px] font-semibold hover:bg-[#2F443F] shadow-md shadow-[#3F5A54]/10 transition-all"
                                    >
                                        Submit Claim
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}

            {/* Custom Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300"
                        onClick={() => setIsDeleteModalOpen(false)}
                    />

                    {/* Modal Card */}
                    <div className="relative w-full max-w-[340px] bg-white rounded-3xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)] p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-300 border border-gray-100">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mb-5 shadow-sm border border-red-100">
                            <Trash2 size={22} />
                        </div>

                        <h3 className="text-[20px] font-bold text-gray-900 mb-2">Delete Claim?</h3>
                        <p className="text-[14px] text-gray-500 mb-8 px-2 leading-relaxed font-medium">
                            Are you sure you want to delete this claim? This action cannot be undone.
                        </p>

                        <div className="flex w-full gap-3">
                            <button
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setClaimToDeleteId(null);
                                }}
                                className="flex-1 h-[38px] border border-gray-200 rounded-xl text-[14px] font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-xs"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteClaim}
                                className="flex-1 h-[38px] bg-blue-500 text-white rounded-xl text-[14px] font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-200"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}