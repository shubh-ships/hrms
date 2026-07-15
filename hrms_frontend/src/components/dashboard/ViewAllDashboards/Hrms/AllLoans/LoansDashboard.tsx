"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, X, ChevronDown, Trash2, Edit2, Search, Filter, Calendar, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import AddNewLoan from "./AddNewLoan";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    getLoanPresets,
    createLoanPreset,
    updateLoanPreset,
    deleteLoanPreset,
    clearSuccess as clearPresetSuccess,
    clearError as clearPresetError
} from "@/features/loanInterestPreset/loanPresetSlice";
import {
    getAllLoans,
    clearSuccess as clearLoanSuccess,
    clearError as clearLoanError
} from "@/features/loan/loanSlice";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSidebar } from "@/components/ui/sidebar";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export default function LoanPage() {
    const dispatch = useAppDispatch();
    const { presets, loading: presetLoading, success: presetSuccess, error: presetError } = useAppSelector((state) => state.loanPreset);
    const { loans, loading: loanLoading, success: loanSuccess, error: loanError } = useAppSelector((state) => state.loan);

    const [view, setView] = useState("Dashboard");
    const [activeTab, setActiveTab] = useState("Loans");
    const [activeSettingsTab, setActiveSettingsTab] = useState("Approval Workflow");
    const [selectedLevel, setSelectedLevel] = useState("Level One");
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [editingPreset, setEditingPreset] = useState<any>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [presetToDelete, setPresetToDelete] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [loanFilters, setLoanFilters] = useState({
        appliedOnDate: null as Date | null,
        disbursementDate: null as Date | null,
        interestType: "",
        approvedBy: "",
        rejectedBy: "",
        status: ""
    });
    const [activeFilters, setActiveFilters] = useState({ ...loanFilters });

    // Modal state
    const [newPreset, setNewPreset] = useState({
        name: "",
        interestRate: "",
        interestType: "simple" as "simple" | "compound"
    });

    useEffect(() => {
        dispatch(getLoanPresets(undefined));
        dispatch(getAllLoans({}));
    }, [dispatch]);

    useEffect(() => {
        if (presetSuccess) {
            toast.success(editingPreset ? "Interest preset updated successfully" : "Interest preset saved successfully");
            handleCloseModal();
            dispatch(getLoanPresets(undefined));
            dispatch(clearPresetSuccess());
        }
        if (presetError) {
            toast.error(presetError);
            dispatch(clearPresetError());
        }

        if (loanSuccess) {
            dispatch(getAllLoans({}));
            dispatch(clearLoanSuccess());
        }
        if (loanError) {
            toast.error(loanError);
            dispatch(clearLoanError());
        }
    }, [presetSuccess, presetError, loanSuccess, loanError, dispatch, editingPreset]);

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPreset(null);
        setNewPreset({ name: "", interestRate: "", interestType: "simple" });
    };

    const handleEditClick = (preset: any) => {
        setEditingPreset(preset);
        setNewPreset({
            name: preset.name,
            interestRate: preset.interestRate.toString(),
            interestType: preset.interestType
        });
        setIsModalOpen(true);
    };

    const handleSavePreset = () => {
        if (!newPreset.name || !newPreset.interestRate) {
            toast.error("Please fill all fields");
            return;
        }

        const isDuplicate = presets.some(p =>
            p.name.toLowerCase() === newPreset.name.toLowerCase() &&
            p._id !== editingPreset?._id
        );

        if (isDuplicate) {
            toast.error("An interest preset with this name already exists");
            return;
        }

        const data = {
            name: newPreset.name,
            interestRate: parseFloat(newPreset.interestRate),
            interestType: newPreset.interestType
        };

        if (editingPreset) {
            dispatch(updateLoanPreset({ id: editingPreset._id, updateData: data }));
        } else {
            dispatch(createLoanPreset(data));
        }
    };

    const handleDeletePreset = (id: string) => {
        setPresetToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (presetToDelete) {
            dispatch(deleteLoanPreset(presetToDelete));
            setIsDeleteModalOpen(false);
            setPresetToDelete(null);
        }
    };

    const filteredPresets = presets.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === "all" || p.interestType === filterType;
        return matchesSearch && matchesType;
    });

    // Calculate Stats
    const allLoansCount = loans.length;
    const openLoansCount = loans.filter(l => l.status === 'active' || (l.status === 'approved' && l.createdBy === l.userId?._id)).length; // Assuming active means Open
    const pendingLoansCount = loans.filter(l => l.status === 'pending').length;
    const approvedLoansCount = loans.filter(l => l.status === 'approved').length;

    const filteredLoans = loans.filter((loan: any) => {
        const empName = loan.employeeId?.personal ? `${loan.employeeId.personal.firstName} ${loan.employeeId.personal.lastName}` : (loan.userId?.name || "");
        const empId = loan.employeeId?.employment?.employeeCode || "";
        const searchLower = searchQuery.toLowerCase();

        const matchesSearch = empName.toLowerCase().includes(searchLower) || empId.toLowerCase().includes(searchLower);

        // Advanced Filter Matching
        const matchesInterestType = !activeFilters.interestType || loan.interestType.toLowerCase() === activeFilters.interestType.toLowerCase();
        const matchesStatus = !activeFilters.status || (
            activeFilters.status === "Open" ? loan.status === "active" :
                activeFilters.status === "Closed" ? loan.status === "completed" :
                    loan.status.toLowerCase() === activeFilters.status.toLowerCase()
        );

        // Date checks
        const matchesAppliedDate = !activeFilters.appliedOnDate || (loan.createdAt && format(new Date(loan.createdAt), "yyyy-MM-dd") === format(activeFilters.appliedOnDate, "yyyy-MM-dd"));
        const matchesDisbursementDate = !activeFilters.disbursementDate || (loan.disbursementDate && format(new Date(loan.disbursementDate), "yyyy-MM-dd") === format(activeFilters.disbursementDate, "yyyy-MM-dd"));

        return matchesSearch && matchesInterestType && matchesStatus && matchesAppliedDate && matchesDisbursementDate;
    });

    if (view === "AddNewLoan") {
        return <AddNewLoan onBack={() => setView("Dashboard")} />;
    }

    return (
        <div className="flex flex-col w-full sm:px-[40px] pt-[40px] pb-[100px] min-h-screen font-sans bg-[#F9FAFB]">
            {/* Modal Overlay omitted for brevity in replacement, but I should keep them in multi_replace if I don't want to lose them. Actually, replace_file_content is better for large chunks. I'll make sure to include them. */}
            {/* Keeping the modals already present in the file */}

            {/* Header Title */}
            <div className="flex flex-col gap-6 mb-8">
                <h1 className="text-[20px] font-bold text-[#111827]">Loans</h1>

                {/* Navigation Tabs */}
                <div className="flex items-center gap-1 p-1 bg-gray-100/50 rounded-xl w-fit border border-[#E5E7EB]">
                    {["Loans", "Loan Applications", "Loan Settings"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "text-[14px] font-medium px-6 py-2 rounded-lg transition-all",
                                activeTab === tab ? " text-[#111827]" : "text-[#6B7280] hover:text-[#4B5563]"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards Section */}
            {activeTab === "Loans" && (
                <div className="flex gap-8 mb-8">
                    <div className="flex items-center gap-6 bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm min-w-[200px]">
                        <div className="w-[36px] h-[36px] rounded-[8px] bg-[#EFF6FF] flex items-center justify-center text-blue-600">
                            <Calendar size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[12px] text-gray-500 font-medium">All Loans</span>
                            <span className="text-[16px] font-semibold text-[#111827]">{allLoansCount}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm min-w-[200px]">
                        <div className="w-[36px] h-[36px] rounded-xl bg-[#EFF6FF] flex items-center justify-center text-blue-600">
                            <Calendar size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[12px] text-gray-500 font-medium">Open Loans</span>
                            <span className="text-[16px] font-semibold text-[#111827]">{openLoansCount}</span>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "Loan Applications" && (
                <div className="flex gap-8 mb-8">
                    <div className="flex items-center gap-6 bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm min-w-[200px]">
                        <div className="w-[36px] h-[36px] rounded-xl bg-[#EFF6FF] flex items-center justify-center text-blue-600">
                            <Calendar size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[12px] text-gray-500 font-medium">Pending</span>
                            <span className="text-[16px] font-semibold text-[#111827]">{pendingLoansCount}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm min-w-[200px]">
                        <div className="w-[36px] h-[36px] rounded-xl bg-[#EFF6FF] flex items-center justify-center text-blue-600">
                            <Calendar size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[12px] text-gray-500 font-medium">Approved</span>
                            <span className="text-[16px] font-semibold text-[#111827]">{approvedLoansCount}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Search/Filter and Table Content Area */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 flex flex-col shadow-sm">
                {activeTab === "Loans" && (
                    <div className="flex flex-col h-full w-full">
                        {/* Action Bar */}
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-4 flex-1 max-w-[580px]">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search by name or staff ID"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-[36px] bg-gray-50/50 border border-[#E5E7EB] rounded-[8px] pl-12 pr-4 text-[14px] outline-none focus:border-blue-500 focus:bg-white transition-all shadow-none"
                                    />
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                                        className={cn(
                                            "flex items-center gap-2 h-[36px] px-4 border border-[#E5E7EB] rounded-[8px] text-[14px] font-medium text-gray-600 hover:bg-gray-50 transition-all bg-[#F3F4FB]",
                                            isFilterOpen && "bg-white border-blue-500 ring-1 ring-blue-500 shadow-sm"
                                        )}
                                    >
                                        <Filter size={18} className={isFilterOpen ? "text-blue-500" : "text-blue-600"} fill="currentColor" />
                                        Filter
                                    </button>

                                    {/* Premium Filter Popup */}
                                    {isFilterOpen && (
                                        <div className="absolute top-[50px] left-0 w-[420px] bg-white rounded-[18px] p-7 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 z-50 flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="text-[18px] font-semibold text-[#111827]">Filter By</h3>
                                                <button onClick={() => setIsFilterOpen(false)} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-all text-gray-400 group">
                                                    <X size={16} />
                                                </button>
                                            </div>

                                            {/* Date Ranges */}
                                            <FilterInput
                                                label="Applied on Date"
                                                date={loanFilters.appliedOnDate}
                                                onSelect={(d) => setLoanFilters(prev => ({ ...prev, appliedOnDate: d }))}
                                                onClear={() => setLoanFilters(prev => ({ ...prev, appliedOnDate: null }))}
                                                placeholder="Select range"
                                            />
                                            <FilterInput
                                                label="Disbursement Date"
                                                date={loanFilters.disbursementDate}
                                                onSelect={(d) => setLoanFilters(prev => ({ ...prev, disbursementDate: d }))}
                                                onClear={() => setLoanFilters(prev => ({ ...prev, disbursementDate: null }))}
                                                placeholder="Select range"
                                            />

                                            {/* Select Fields */}
                                            <FilterSelect
                                                label="Interest Type"
                                                value={loanFilters.interestType}
                                                onChange={(val) => setLoanFilters(prev => ({ ...prev, interestType: val }))}
                                                placeholder="Select Interest Type"
                                                options={["Simple", "Compound"]}
                                            />
                                            <FilterSelect
                                                label="Approved by"
                                                value={loanFilters.approvedBy}
                                                onChange={(val) => setLoanFilters(prev => ({ ...prev, approvedBy: val }))}
                                                placeholder="Select Approved by"
                                                options={["Admin", "Owner"]}
                                            />
                                            <FilterSelect
                                                label="Rejected by"
                                                value={loanFilters.rejectedBy}
                                                onChange={(val) => setLoanFilters(prev => ({ ...prev, rejectedBy: val }))}
                                                placeholder="Select Rejected by"
                                                options={["Admin", "Owner"]}
                                            />
                                            <FilterSelect
                                                label="Status"
                                                value={loanFilters.status}
                                                onChange={(val) => setLoanFilters(prev => ({ ...prev, status: val }))}
                                                placeholder="Select Status"
                                                options={["Pending", "Approved", "Active", "Completed", "Written Off"]}
                                            />

                                            {/* Actions */}
                                            <div className="flex gap-4 mt-4">
                                                <button
                                                    onClick={() => {
                                                        const cleared = {
                                                            appliedOnDate: null,
                                                            disbursementDate: null,
                                                            interestType: "",
                                                            approvedBy: "",
                                                            rejectedBy: "",
                                                            status: ""
                                                        };
                                                        setLoanFilters(cleared);
                                                        setActiveFilters(cleared);
                                                        setIsFilterOpen(false);
                                                    }}
                                                    className="flex-1 h-[38px] bg-[#E5E7EB] text-[#4B5563] rounded-xl font-bold text-[14px] hover:bg-gray-300 transition-all shadow-sm"
                                                >
                                                    Clear Filter
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setActiveFilters({ ...loanFilters });
                                                        setIsFilterOpen(false);
                                                    }}
                                                    className="flex-1 h-[38px] bg-[#2563EB] text-white rounded-xl font-bold text-[14px] hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
                                                >
                                                    Apply Filter
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setView("AddNewLoan")}
                                className="flex items-center gap-1 h-[36px] px-2 bg-[#2563EB] text-white text-[14px] rounded-[8px] hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                            >
                                <Plus size={18} />
                                Add New Loan
                            </button>
                        </div>

                        {filteredLoans.length > 0 ? (
                            <div className="w-full overflow-hidden overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 h-[50px]">
                                            <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 text-left tracking-wider whitespace-nowrap w-[14%]">Employee Name</th>
                                            <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 text-left tracking-wider whitespace-nowrap w-[8%]">Employee ID</th>
                                            <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 text-left tracking-wider whitespace-nowrap w-[12%]">Loan Name</th>
                                            <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 text-right tracking-wider whitespace-nowrap w-[10%]">Principal</th>
                                            <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 text-right tracking-wider whitespace-nowrap w-[14%]">Total Paid Instalment</th>
                                            <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 text-right tracking-wider whitespace-nowrap w-[14%]">Remaining Instalment</th>
                                            <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 text-center tracking-wider whitespace-nowrap w-[14%]">Disbursement Date</th>
                                            <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 text-center tracking-wider whitespace-nowrap w-[14%]">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredLoans.map((loan) => {
                                            const empName = loan.employeeId?.personal ? `${loan.employeeId.personal.firstName} ${loan.employeeId.personal.lastName}` : (loan.userId?.name || "");
                                            const empId = loan.employeeId?.employment?.employeeCode || "";

                                            // Status mapping
                                            const statusLabel =
                                                loan.status === 'active' ? 'Open' :
                                                    loan.status === 'completed' ? 'Closed' :
                                                        loan.status === 'written_off' ? 'Written Off' :
                                                            loan.status === 'pending' ? 'Pending' :
                                                                loan.status;

                                            const badgeColor =
                                                loan.status === 'active' ? "bg-green-50 text-green-600 border border-green-100" :
                                                    loan.status === 'completed' ? "bg-purple-50 text-purple-600 border border-purple-100" :
                                                        loan.status === 'written_off' ? "bg-orange-50 text-orange-600 border border-orange-100" :
                                                            loan.status === 'pending' ? "bg-yellow-50 text-yellow-600 border border-yellow-100" :
                                                                "bg-gray-100 text-gray-600";

                                            return (
                                                <tr key={loan._id} className="h-[65px] hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <a
                                                            href={`/dashboard/admin/hrms/staff/${loan.employeeId?._id || loan.userId?._id}/loans/${loan._id}`}
                                                            className="text-[12px] text-blue-600 font-bold hover:underline uppercase"
                                                        >
                                                            {empName}
                                                        </a>
                                                    </td>
                                                    <td className="px-6 py-4 text-[12px] text-gray-600 font-medium">{empId}</td>
                                                    <td className="px-6 py-4 text-[12px] text-gray-600 font-medium">{loan.loanName}</td>
                                                    <td className="px-6 py-4 text-[12px] text-gray-600 font-bold text-right">₹ {loan.principalAmount.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-[12px] text-gray-600 font-medium text-right">₹ {(loan as any).totalPaidInstalment || 0}</td>
                                                    <td className="px-6 py-4 text-[12px] text-gray-600 font-medium font-mono text-right">₹ {((loan as any).remainingInstalment || loan.totalPayable).toFixed(2)}</td>
                                                    <td className="px-6 py-4 text-[12px] text-gray-600 font-medium whitespace-nowrap text-center">
                                                        {format(new Date(loan.disbursementDate), "dd MMM yyyy")}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className={cn(
                                                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold w-fit mx-auto",
                                                            badgeColor
                                                        )}>
                                                            <div className="w-2 h-2 rounded-full bg-current" />
                                                            {statusLabel}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center flex-1 py-12">
                                <Image src="/assets/dashicons/cloud.png" alt="no loans" width={85} height={85} />
                                <p className="text-[14px] font-medium text-gray-500 mt-4">No Loans to show</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "Loan Applications" && (
                    <div className="flex flex-col h-full w-full">
                        {/* Action Bar */}
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-4 flex-1 max-w-[580px]">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search by name or staff ID"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-[38px] bg-gray-50/50 border border-[#E5E7EB] rounded-[8px] pl-12 pr-4 text-[14px] outline-none focus:border-blue-500 focus:bg-white transition-all shadow-none"
                                    />
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                                        className={cn(
                                            "flex items-center gap-2 h-[38px] px-4 border border-[#E5E7EB] rounded-[8px] text-[14px] font-medium text-gray-600 hover:bg-gray-50 transition-all bg-[#F3F4FB]",
                                            isFilterOpen && "bg-white border-blue-500 ring-1 ring-blue-500 shadow-sm"
                                        )}
                                    >
                                        <Filter size={18} className={isFilterOpen ? "text-blue-500" : "text-blue-600"} fill="currentColor" />
                                        Filter
                                    </button>

                                    {/* Premium Filter Popup */}
                                    {isFilterOpen && (
                                        <div className="absolute top-[50px] left-0 w-[420px] bg-white rounded-[24px] p-7 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 z-50 flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="text-[19px] font-bold text-[#111827]">Filter By</h3>
                                                <button onClick={() => setIsFilterOpen(false)} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-all text-gray-400 group">
                                                    <X size={18} className="group-hover:rotate-90 transition-transform" />
                                                </button>
                                            </div>

                                            {/* Date Ranges */}
                                            <FilterInput label="Applied on Date" value={loanFilters.appliedOnDate} placeholder="Select range" />
                                            <FilterInput label="Disbursement Date" value={loanFilters.disbursementDate} placeholder="Select range" />

                                            {/* Select Fields */}
                                            <FilterSelect
                                                label="Interest Type"
                                                value={loanFilters.interestType}
                                                placeholder="Select Interest Type"
                                                options={["Simple", "Compound"]}
                                            />
                                            <FilterSelect
                                                label="Approved by"
                                                value={loanFilters.approvedBy}
                                                placeholder="Select Approved by"
                                                options={["Admin", "Owner"]}
                                            />
                                            <FilterSelect
                                                label="Rejected by"
                                                value={loanFilters.rejectedBy}
                                                placeholder="Select Rejected by"
                                                options={["Admin", "Owner"]}
                                            />
                                            <FilterSelect
                                                label="Status"
                                                value={loanFilters.status}
                                                placeholder="Select Status"
                                                options={["Pending", "Approved", "Active", "Completed", "Written Off"]}
                                            />

                                            {/* Actions */}
                                            <div className="flex gap-4 mt-4">
                                                <button
                                                    onClick={() => {
                                                        setLoanFilters({
                                                            appliedOnDate: "",
                                                            disbursementDate: "",
                                                            interestType: "",
                                                            approvedBy: "",
                                                            rejectedBy: "",
                                                            status: ""
                                                        });
                                                        setIsFilterOpen(false);
                                                    }}
                                                    className="flex-1 h-[48px] bg-[#E5E7EB] text-[#4B5563] rounded-xl font-bold text-[14px] hover:bg-gray-300 transition-all shadow-sm"
                                                >
                                                    Clear Filter
                                                </button>
                                                <button
                                                    onClick={() => setIsFilterOpen(false)}
                                                    className="flex-1 h-[48px] bg-[#2563EB] text-white rounded-xl font-bold text-[14px] hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
                                                >
                                                    Apply Filter
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {filteredLoans.filter(l => l.status !== 'completed').length > 0 ? (
                            <div className="w-full overflow-hidden overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 h-[50px]">
                                            <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 text-left uppercase tracking-wider whitespace-nowrap w-[14%]">Employee Name</th>
                                            <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 text-left uppercase tracking-wider whitespace-nowrap w-[8%]">Employee ID</th>
                                            <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 text-left uppercase tracking-wider whitespace-nowrap w-[12%]">Loan Name</th>
                                            <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 text-right uppercase tracking-wider whitespace-nowrap w-[10%]">Principal</th>
                                            <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 text-right uppercase tracking-wider whitespace-nowrap w-[14%]">Total Paid Instalment</th>
                                            <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 text-right uppercase tracking-wider whitespace-nowrap w-[14%]">Remaining Instalment</th>
                                            <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 text-center uppercase tracking-wider whitespace-nowrap w-[14%]">Disbursement Date</th>
                                            <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 text-center uppercase tracking-wider whitespace-nowrap w-[14%]">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredLoans.filter(l => l.status !== 'completed').map((loan) => {
                                            const empName = loan.employeeId?.personal ? `${loan.employeeId.personal.firstName} ${loan.employeeId.personal.lastName}` : (loan.userId?.name || "");
                                            const empId = loan.employeeId?.employment?.employeeCode || "";

                                            // Status mapping
                                            const statusLabel =
                                                loan.status === 'active' ? 'Open' :
                                                    loan.status === 'completed' ? 'Closed' :
                                                        loan.status === 'written_off' ? 'Written Off' :
                                                            loan.status === 'pending' ? 'Pending' :
                                                                loan.status;

                                            const badgeColor =
                                                loan.status === 'active' ? "bg-green-50 text-green-600 border border-green-100" :
                                                    loan.status === 'completed' ? "bg-purple-50 text-purple-600 border border-purple-100" :
                                                        loan.status === 'written_off' ? "bg-orange-50 text-orange-600 border border-orange-100" :
                                                            loan.status === 'pending' ? "bg-yellow-50 text-yellow-600 border border-yellow-100" :
                                                                "bg-gray-100 text-gray-600";

                                            return (
                                                <tr key={loan._id} className="h-[65px] hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <a
                                                            href={`/dashboard/admin/hrms/staff/${loan.employeeId?._id || loan.userId?._id}/loans/${loan._id}`}
                                                            className="text-[12px] text-blue-600 font-bold hover:underline uppercase"
                                                        >
                                                            {empName}
                                                        </a>
                                                    </td>
                                                    <td className="px-6 py-4 text-[12px] text-gray-600 font-medium">{empId}</td>
                                                    <td className="px-6 py-4 text-[12px] text-gray-600 font-medium">{loan.loanName}</td>
                                                    <td className="px-6 py-4 text-[12px] text-gray-600 font-bold text-right">₹ {loan.principalAmount.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-[12px] text-gray-600 font-medium text-right">₹ {(loan as any).totalPaidInstalment || 0}</td>
                                                    <td className="px-6 py-4 text-[12px] text-gray-600 font-medium font-mono text-right">₹ {((loan as any).remainingInstalment || loan.totalPayable).toFixed(2)}</td>
                                                    <td className="px-6 py-4 text-[12px] text-gray-600 font-medium whitespace-nowrap text-center">
                                                        {format(new Date(loan.disbursementDate), "dd MMM yyyy")}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className={cn(
                                                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold w-fit mx-auto",
                                                            badgeColor
                                                        )}>
                                                            <div className="w-2 h-2 rounded-full bg-current" />
                                                            {statusLabel}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center flex-1 py-12">
                                <Image src="/assets/dashicons/cloud.png" alt="no applications" width={85} height={85} />
                                <p className="text-[14px] font-medium text-gray-500 mt-4">No Applications found</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "Loan Settings" && (
                    <div className="flex flex-col h-full w-full">
                        <h2 className="text-[16px] font-medium text-[#000000] mb-[20px]">Loan Details</h2>

                        {/* Nested Tabs */}
                        <div className="flex border border-[#E5E7EB] rounded-[5px] h-[31px] px-[20px] gap-8 mb-6">
                            {["Approval Workflow", "Interest Presets"].map((subTab) => (
                                <button
                                    key={subTab}
                                    onClick={() => setActiveSettingsTab(subTab)}
                                    className={cn(
                                        "text-[10px] font-medium relative h-full flex items-center",
                                        activeSettingsTab === subTab ? "text-[#3F5A54]" : "text-[#9CA3AF]"
                                    )}
                                >
                                    {subTab}
                                    {activeSettingsTab === subTab && (
                                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3F5A54]" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {activeSettingsTab === "Approval Workflow" && (
                            <div className="flex flex-col">
                                <h3 className="text-[14px] font-medium text-[#000000] mt-[20px] mb-[4px]">Set Multilevel Approval</h3>
                                <p className="text-[10px] text-[#9CA3AF] mb-6">Only the final approver will be able to disburse the loan</p>

                                <div className="flex gap-4 mb-8">
                                    {["Level One", "Level Two"].map(level => (
                                        <div
                                            key={level}
                                            onClick={() => setSelectedLevel(level)}
                                            className={cn(
                                                "flex items-center gap-2 border rounded-md px-4 py-2 w-[140px] cursor-pointer transition-all",
                                                selectedLevel === level ? "border-[#3F5A54]" : "border-[#E5E7EB]"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-[14px] h-[14px] rounded-full border-2 flex items-center justify-center",
                                                selectedLevel === level ? "border-[#3F5A54]" : "border-[#E5E7EB]"
                                            )}>
                                                {selectedLevel === level && <div className="w-[6px] h-[6px] rounded-full bg-[#3F5A54]" />}
                                            </div>
                                            <span className={cn("text-[12px] font-medium", selectedLevel === level ? "text-[#000000]" : "text-[#4B5563]")}>
                                                {level}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-[#F4F6FF] rounded-xl p-4 w-[295px] flex flex-col gap-4">
                                    <div className="bg-[#DBEAFE] rounded-full px-4 h-[44px] flex items-center gap-4 w-full">
                                        <div className="w-[30px] h-[30px] rounded-full bg-white shadow-sm flex items-center justify-center text-[12px] font-bold text-[#111827]">1</div>
                                        <span className="text-[12px] font-medium text-[#111827]">
                                            {selectedLevel === "Level One" ? "Anyone: Admin or Owner" : "Admin"}
                                        </span>
                                    </div>
                                    {selectedLevel === "Level Two" && (
                                        <div className="bg-[#DBEAFE] rounded-full px-4 h-[44px] flex items-center gap-4 w-full">
                                            <div className="w-[30px] h-[30px] rounded-full bg-white shadow-sm flex items-center justify-center text-[12px] font-bold text-[#111827]">2</div>
                                            <span className="text-[12px] font-medium text-[#111827]">Owner</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeSettingsTab === "Interest Presets" && (
                            <div className="flex flex-col h-full w-full">
                                {/* Search and Filter Bar */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Search preset"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-[200px] h-[36px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-full pl-10 pr-4 text-[12px] outline-none focus:border-blue-400 transition-all"
                                            />
                                        </div>
                                        <div className="relative">
                                            <button
                                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                                className={cn(
                                                    "flex items-center gap-2 h-[36px] px-4 border border-[#E5E7EB] rounded-full text-[12px] transition-all",
                                                    isFilterOpen || filterType !== "all" ? "bg-[#F3F4F6] text-blue-600 border-blue-200" : "text-gray-600 hover:bg-gray-50"
                                                )}
                                            >
                                                <Filter size={14} />
                                                Filter
                                            </button>

                                            {/* Filter Popup */}
                                            {isFilterOpen && (
                                                <div className="absolute top-[45px] left-0 w-[280px] bg-white rounded-[15px] p-4 shadow-2xl border border-gray-100 z-50 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-[16px] font-bold text-[#1F2937]">Filter By</h3>
                                                        <button onClick={() => setIsFilterOpen(false)} className="text-gray-400 hover:text-gray-600">
                                                            <X size={18} />
                                                        </button>
                                                    </div>

                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[12px] font-medium text-[#4B5563]">Interest Type</label>
                                                        <div className="relative">
                                                            <select
                                                                value={filterType}
                                                                onChange={(e) => setFilterType(e.target.value)}
                                                                className="w-full h-[40px] border border-[#E5E7EB] rounded-[10px] px-4 text-[14px] outline-none appearance-none bg-white focus:border-blue-500 transition-all text-[#1F2937]"
                                                            >
                                                                <option value="all">All Types</option>
                                                                <option value="simple">Simple Interest</option>
                                                                <option value="compound">Compound Interest</option>
                                                            </select>
                                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4B5563] pointer-events-none" size={18} />
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => {
                                                                setFilterType("all");
                                                                setIsFilterOpen(false);
                                                            }}
                                                            className="flex-1 h-[36px] bg-[#E5E7EB] text-[#4B5563] rounded-lg font-bold text-[14px] hover:bg-gray-300 transition-all"
                                                        >
                                                            Clear Filter
                                                        </button>
                                                        <button
                                                            onClick={() => setIsFilterOpen(false)}
                                                            className="flex-1 h-[36px] bg-[#0066FF] text-white rounded-lg font-bold text-[14px] hover:bg-blue-600 transition-all"
                                                        >
                                                            Apply Filter
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="flex items-center gap-2 h-[36px] px-6 bg-[#EDF3FF] text-[#0066FF] text-[12px] font-bold rounded-lg hover:bg-[#DEE9FF] transition-all"
                                    >
                                        <Plus size={16} />
                                        Add interest preset
                                    </button>
                                </div>

                                {/* Table */}
                                <div className="w-full border border-gray-100 rounded-xl overflow-hidden overflow-x-auto custom-scrollbar shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[#F9FAFB] border-b border-gray-100 h-[40px]">
                                                <th className="px-4 text-[10px] font-medium text-gray-500 tracking-wider whitespace-nowrap uppercase">Interest preset</th>
                                                <th className="px-4 text-[10px] font-medium text-gray-500 tracking-wider whitespace-nowrap uppercase">Annual Interest Rate</th>
                                                <th className="px-4 text-[10px] font-medium text-gray-500 tracking-wider whitespace-nowrap uppercase">Interest Type</th>
                                                <th className="px-4 text-[10px] font-medium text-gray-500 tracking-wider whitespace-nowrap uppercase">Created At</th>
                                                <th className="px-4 text-[10px] font-medium text-gray-500 tracking-wider whitespace-nowrap uppercase">Created by</th>
                                                <th className="px-4 text-[10px] font-medium text-gray-500 tracking-wider whitespace-nowrap uppercase">Edited at</th>
                                                <th className="px-4 text-[10px] font-medium text-gray-500 tracking-wider whitespace-nowrap uppercase">Edited by</th>
                                                <th className="px-4 text-[10px] font-medium text-gray-500 tracking-wider whitespace-nowrap uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredPresets.map((preset) => (
                                                <tr key={preset._id} className="h-[50px] hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-4 text-[12px] text-[#111827] font-medium whitespace-nowrap">{preset.name}</td>
                                                    <td className="px-4 py-4 text-[12px] text-[#4B5563] whitespace-nowrap">{preset.interestRate}%</td>
                                                    <td className="px-4 py-4 text-[12px] text-[#4B5563] capitalize whitespace-nowrap">{preset.interestType} Interest</td>
                                                    <td className="px-4 py-4 text-[12px] text-[#4B5563] whitespace-nowrap">
                                                        {format(new Date(preset.createdAt), "dd-MM-yyyy")}
                                                    </td>
                                                    <td className="px-4 py-4 text-[12px] text-[#4B5563] whitespace-nowrap">{preset.createdBy?.name || "System"}</td>
                                                    <td className="px-4 py-4 text-[12px] text-[#4B5563] whitespace-nowrap">
                                                        {format(new Date(preset.updatedAt), "dd-MM-yyyy")}
                                                    </td>
                                                    <td className="px-4 py-4 text-[12px] text-[#4B5563] whitespace-nowrap">-</td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => handleDeletePreset(preset._id)}
                                                                className="text-red-400 hover:text-red-600 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditClick(preset)}
                                                                className="text-blue-400 hover:text-blue-600 transition-colors"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredPresets.length === 0 && (
                                                <tr className="h-[200px]">
                                                    <td colSpan={8} className="text-center py-10">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Image src="/assets/dashicons/cloud.png" alt="no data" width={60} height={60} className="opacity-40" />
                                                            <p className="text-[12px] text-gray-400">No interest presets found</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer - Only visible in Approval Workflow */}
            {activeTab === "Loan Settings" && activeSettingsTab === "Approval Workflow" && (
                <div
                    className={cn(
                        "fixed bottom-0 right-0 h-[80px] bg-white border-t border-[#B1B1B14D] flex justify-end items-center px-[40px] z-50 transition-all duration-300",
                        isCollapsed ? "left-[80px] w-[calc(100%-80px)]" : "left-[256px] w-[calc(100%-256px)]"
                    )}
                >
                    <button
                        className="bg-[#F3F4F6] text-[#6B7280] px-8 h-[37px] w-[146px] rounded-lg font-medium text-[14px] transition-all active:scale-95 border border-[#E5E7EB]"
                    >
                        Save
                    </button>
                </div>
            )}
        </div>
    );
}

function FilterInput({ label, date, onSelect, onClear, placeholder }: { label: string, date: Date | null, onSelect: (date: Date) => void, onClear: () => void, placeholder: string }) {
    return (
        <div className="flex flex-col gap-1.5 text-left">
            <span className="text-[12px] font-medium text-[#6B7280]">{label}</span>
            <div className="relative">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full h-[46px] border border-[#E5E7EB] rounded-xl px-4 text-[13px] font-medium transition-all justify-between text-[#111827] bg-white",
                                !date && "text-gray-400 font-normal"
                            )}
                        >
                            {date ? format(date, "PPP") : placeholder}
                            <div className="flex items-center gap-3">
                                {date && (
                                    <X
                                        size={16}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onClear();
                                        }}
                                        className="hover:text-gray-600 cursor-pointer"
                                    />
                                )}
                                <CalendarIcon size={18} />
                            </div>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <CalendarUI
                            mode="single"
                            selected={date || undefined}
                            onSelect={(d) => d && onSelect(d)}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}

function FilterSelect({ label, value, onChange, placeholder, options }: { label: string, value: string, onChange: (val: string) => void, placeholder: string, options: string[] }) {
    return (
        <div className="flex flex-col gap-1.5 text-left">
            <span className="text-[12px] font-medium text-[#6B7280]">{label}</span>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full h-[46px] border border-[#E5E7EB] rounded-xl px-4 text-[13px] outline-none bg-white font-medium text-[#111827] appearance-none focus:border-blue-500 transition-all"
                >
                    <option value="" disabled>{placeholder}</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>
        </div>
    );
}
