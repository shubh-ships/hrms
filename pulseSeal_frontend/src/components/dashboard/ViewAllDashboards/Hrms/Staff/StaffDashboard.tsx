"use client"

import React, { useState, useEffect } from "react";
import { Search, Filter, AlertCircle, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchEmployees, selectEmployees, selectEmployeeLoading } from "@/features/employee/employeeSlice";

// Avatar color pool for initials badges
const COLOR_CLASSES = [
    "bg-blue-100 text-blue-600",
    "bg-green-100 text-green-600",
    "bg-purple-100 text-purple-600",
    "bg-orange-100 text-orange-600",
    "bg-pink-100 text-pink-600",
    "bg-teal-100 text-teal-600",
];

// Work type → display label mapping
const WORK_TYPE_LABEL: Record<string, string> = {
    "Full-Time": "Regular",
    "Intern": "Internship",
    "Probation": "Contractual (monthly)",
    "Notice": "Notice Period",
};

// UI shape for StaffDashboard list items
interface StaffListItem {
    id: string;
    name: string;
    initials: string;
    empId: string;
    colorClass: string;
    hasBankDetails: boolean;
    hasSalaryDetails: boolean;
    status: string;
    staffType: string;
    shift: string;
}

export default function StaffDashboard() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const employees = useAppSelector(selectEmployees);
    const isLoading = useAppSelector(selectEmployeeLoading);

    // Fetch employees from backend on mount
    useEffect(() => {
        dispatch(fetchEmployees({}));
    }, [dispatch]);

    // Map backend Employee objects → UI StaffListItem shape
    const staffList: StaffListItem[] = employees
        .filter((emp) => emp && emp._id) // Just need an ID to attempt display
        .map((emp: any, index) => {
            // New Backend returns flattened fields: name, empCode, status, joinDate, various templates etc.
            const initials = [emp.name?.split(" ")[0]?.[0], (emp.name?.split(" ").slice(1).join(" ")?.[0] || "")].filter(Boolean).join("").toUpperCase() || "?";

            // Bank/Salary details flags (stay same for now unless backend added them too)
            const hasBankDetails = emp.hasBankDetails ?? !!(emp.bank?.accountNumber);
            const hasSalaryDetails = emp.hasSalaryDetails ?? !!(emp.salary && emp.salary.length > 0);

            // Status mapping from flat field
            const statusRaw = emp.status || "Active";
            const status = (statusRaw.toLowerCase() === "active") ? "Active"
                : (statusRaw.toLowerCase() === "inactive") ? "Inactive"
                    : (statusRaw.toLowerCase() === "terminated") ? "Terminated"
                        : "Active";

            // Staff type (Note: backend currently doesn't provide workType flat, so it falls back)
            const staffType = WORK_TYPE_LABEL[emp.workType] || emp.workType || "Regular";

            return {
                id: emp._id,
                name: emp.name || "Unknown",
                initials,
                empId: emp.empCode || "N/A",
                colorClass: COLOR_CLASSES[index % COLOR_CLASSES.length],
                hasBankDetails,
                hasSalaryDetails,
                status,
                staffType,
                shift: emp.shiftTemplate || "No Shift",
            };
        });

    // Alert state derived from staffList
    const [showMissingSalaryAlert, setShowMissingSalaryAlert] = useState(false);
    const [showMissingBankAlert, setShowMissingBankAlert] = useState(false);

    useEffect(() => {
        setShowMissingSalaryAlert(staffList.some((s) => !s.hasSalaryDetails));
        setShowMissingBankAlert(staffList.some((s) => !s.hasBankDetails));
    }, [employees]);

    // Search / filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<{
        staffTypes: string[];
        shifts: string[];
        groupBy: string;
    }>({
        staffTypes: [],
        shifts: [],
        groupBy: "None"
    });
    const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

    const toggleStaffSelection = (id: string) => {
        setSelectedStaffIds((prev) =>
            prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
        );
    };

    const toggleGroupSelection = (groupStaff: StaffListItem[]) => {
        const groupIds = groupStaff.map((s) => s.id);
        const allSelected = groupIds.every((id) => selectedStaffIds.includes(id));
        if (allSelected) {
            setSelectedStaffIds((prev) => prev.filter((id) => !groupIds.includes(id)));
        } else {
            setSelectedStaffIds((prev) => Array.from(new Set([...prev, ...groupIds])));
        }
    };

    const handleBulkAction = (path: string) => {
        if (selectedStaffIds.length === 0) return;
        // Store selected IDs for downstream bulk-action pages
        sessionStorage.setItem("bulk_selected_staff", JSON.stringify(selectedStaffIds));
        router.push(path);
    };

    // Filter staff based on search query and active filters
    const filteredStaff = staffList.filter((staff) => {
        const matchesSearch =
            staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            staff.empId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType =
            activeFilters.staffTypes.length === 0 ||
            activeFilters.staffTypes.includes(staff.staffType);
        const matchesShift =
            activeFilters.shifts.length === 0 ||
            activeFilters.shifts.includes(staff.shift);
        return matchesSearch && matchesType && matchesShift;
    });

    const handleApplyFilters = (filters: typeof activeFilters) => {
        setActiveFilters(filters);
        setIsFilterOpen(false);
    };

    // Calculate grouping
    const groupedStaff: Record<string, StaffListItem[]> = {};
    if (activeFilters.groupBy === "None") {
        groupedStaff["All Staff"] = filteredStaff;
    } else {
        filteredStaff.forEach((staff) => {
            const groupKey =
                activeFilters.groupBy === "Salary Type"
                    ? staff.staffType
                    : staff.shift || "No Shift";
            if (!groupedStaff[groupKey]) groupedStaff[groupKey] = [];
            groupedStaff[groupKey].push(staff);
        });
    }

    return (
        <div className="flex flex-col w-full sm:px-[40px] pt-[40px] pb-[100px] min-h-screen">
            {/* Filter Popup Component */}
            <FilterPopup
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApply={handleApplyFilters}
                initialFilters={activeFilters}
            />

            {/* Warning Alerts */}
            <div className="flex flex-col gap-4 mb-8">
                {showMissingSalaryAlert && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full bg-[#FFF9E6] border border-[#FDE08B] rounded-md p-4 gap-4">
                        <div className="flex items-center gap-3 text-[#B38D19] text-sm">
                            <AlertCircle className="h-5 w-5 text-[#F59E0B] shrink-0" />
                            <span className="font-medium text-[#7C6314]">Missing Salary details for some staff! Add Salary to process their payroll.</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/dashboard/admin/hrms/manageSalary")}
                            className="bg-[#3F5A54] hover:bg-[#2c4440] text-white font-medium border border-[#3F5A54] h-[32px] px-4 rounded-lg"
                        >
                            Add Salary Details
                        </Button>
                    </div>
                )}

                {showMissingBankAlert && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full bg-[#FFF9E6] border border-[#FDE08B] rounded-md p-4 gap-4">
                        <div className="flex items-center gap-3 text-[#B38D19] text-sm">
                            <AlertCircle className="h-5 w-5 text-[#F59E0B] shrink-0" />
                            <span className="font-medium text-[#7C6314]">Missing Bank Account details for some staff! Add Account to pay them online.</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                const missingBankIds = staffList
                                    .filter(s => !s.hasBankDetails)
                                    .map(s => s.id);
                                sessionStorage.setItem("bulk_selected_staff", JSON.stringify(missingBankIds));
                                router.push("/dashboard/admin/hrms/staffBankDetails");
                            }}
                            className="bg-[#FDECA6] hover:bg-[#FBE082] text-[#7C6314] font-medium border border-[#FBE082] ml-8 sm:ml-0"
                        >
                            Add Account Details
                        </Button>
                    </div>
                )}
            </div>

            {/* Header Area */}
            <div className="flex items-center justify-between">
                <h1 className="text-[20px] h-[30px] w-[86px] font-semibold tracking-tight text-[#1F2937]">Staff List</h1>
                <Button
                    variant="default"
                    className="bg-[#3F5A54] hover:bg-[#2c4440] text-white h-[37px] w-[146px]"
                    onClick={() => router.push("/dashboard/admin/hrms/addStaff")}
                >
                    Add Staff
                </Button>
            </div>

            {/* Table Container */}
            <div className="w-full border border-gray-200 rounded-lg overflow-hidden flex flex-col mt-[18px]">

                {/* Filters Row */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-[261px] h-[36px] max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[16px] w-[16px] text-[#9CA3AF]" />
                            <Input
                                placeholder="Search Staff"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-[36px] border-gray-200 rounded-md focus-visible:ring-1 focus-visible:ring-gray-300"
                            />
                        </div>

                        {/* Filter Button */}
                        <Button
                            variant="outline"
                            onClick={() => setIsFilterOpen(true)}
                            className="h-[30px] w-[70px] border-gray-200 bg-[#F4F5F7] text-[#3F5A54] gap-[6px] hover:bg-gray-100"
                        >
                            <Filter className="h-[14px] w-[14px]" />
                            <p className="text-[14px] font-medium h-[21px] w-[34px]">Filter</p>
                        </Button>
                    </div>

                    {/* Bulk Actions Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-[29px] w-[128px] border-none text-[#3F5A54] gap-2 shadow-sm">
                                <p className="text-[14px] font-medium h-[21px] w-[86px]">Bulk Actions</p>
                                <ChevronDown className="h-[24px] w-[24px] text-[#3F5A54]" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[205px] h-[231px] p-2 flex flex-col border-none shadow-xl">
                            <DropdownMenuItem
                                className="cursor-pointer py-2"
                                onClick={() => handleBulkAction("/dashboard/admin/hrms/bulk-revise-salary")}
                            >
                                Add Variable Components
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                className="cursor-pointer py-2"
                                onClick={() => handleBulkAction("/dashboard/admin/hrms/bulk-revise-salary")}
                            >
                                Revise Salary
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                className="cursor-pointer py-2"
                                onClick={() => handleBulkAction("/dashboard/admin/hrms/manageStaff")}
                            >
                                Change Staff Status
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                className="cursor-pointer py-2"
                                onClick={() => handleBulkAction("/dashboard/admin/hrms/staffBankDetails")}
                            >
                                Staff Bank Account Details
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                className="cursor-pointer py-2"
                                onClick={() => handleBulkAction("/dashboard/admin/hrms/editLeaveBalance")}
                            >Edit Leave Balance</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Staff List Data with Dynamic Grouping */}
                <div className="bg-white flex flex-col">
                    {/* Loading state */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-10 text-sm text-gray-400">
                            <svg className="animate-spin h-5 w-5 mr-2 text-[#3F5A54]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Loading staff...
                        </div>
                    )}

                    {/* Loaded state */}
                    {!isLoading && Object.entries(groupedStaff).map(([groupName, staffItems]) => (
                        <React.Fragment key={groupName}>
                            {/* Group Header */}
                            <div className="flex items-center justify-between h-[39px] px-[20px] bg-[#F4F5F7]">
                                <div className="flex items-center gap-[12px]">
                                    <span className="text-[16px] font-medium text-[#4B5563]">{groupName}</span>
                                    <Badge variant="secondary" className="bg-[#BABABA] rounded-xl text-[#1F2937] font-medium h-[24px] min-w-[28px] hover:bg-[#D1D5DB] flex justify-center items-center">
                                        {staffItems.length}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[12px] font-medium text-[#1F2937]">Select All</span>
                                    <Checkbox
                                        id={`select-all-${groupName}`}
                                        className="border-[#4B5563] data-[state=checked]:bg-[#4B5563] data-[state=checked]:border-[#4B5563]"
                                        checked={staffItems.length > 0 && staffItems.every((s) => selectedStaffIds.includes(s.id))}
                                        onCheckedChange={() => toggleGroupSelection(staffItems)}
                                    />
                                </div>
                            </div>

                            {/* Group Staff entries */}
                            {staffItems.map((staff) => (
                                <div
                                    key={staff.id}
                                    className="flex px-[20px] py-[12px] items-center border-b border-gray-100 last:border-b-0 hover:bg-slate-50 transition-colors cursor-pointer"
                                    onClick={() => router.push(`/dashboard/admin/hrms/staff/${staff.id}`)}
                                >
                                    <div className="flex items-center gap-[12px] flex-1 min-w-0">
                                        <div className={cn("flex shrink-0 items-center justify-center w-[24px] h-[24px] rounded-full text-xs font-semibold tracking-tight", staff.colorClass)}>
                                            {staff.initials}
                                        </div>
                                        <span className="text-[10px] font-regular text-[#1F2937]">{staff.name}</span>
                                        {staff.status && staff.status !== "Active" && (
                                            <Badge className="ml-2 text-[8px] h-4 px-1.5 bg-red-100 text-red-600 border-red-200 hover:bg-red-100 font-medium">
                                                {staff.status}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex-1 flex justify-center">
                                        <span className="text-[10px] font-regular text-[#4B5563]">{staff.empId}</span>
                                    </div>

                                    <div
                                        className="flex items-center justify-end gap-8 flex-1"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Checkbox
                                            className="border-[#4B5563] data-[state=checked]:bg-[#4B5563] data-[state=checked]:border-[#4B5563]"
                                            checked={selectedStaffIds.includes(staff.id)}
                                            onCheckedChange={() => toggleStaffSelection(staff.id)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </React.Fragment>
                    ))}

                    {/* Empty state */}
                    {!isLoading && filteredStaff.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                            <span className="text-[14px]">
                                {searchQuery ? `No staff found matching "${searchQuery}"` : "No staff members found."}
                            </span>
                            {!searchQuery && (
                                <span className="text-[12px] text-gray-300">Add staff using the button above.</span>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

// Filter Popup Component
function FilterPopup({
    isOpen,
    onClose,
    onApply,
    initialFilters
}: {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: { staffTypes: string[]; shifts: string[]; groupBy: string }) => void;
    initialFilters: { staffTypes: string[]; shifts: string[]; groupBy: string };
}) {
    const [activeTab, setActiveTab] = useState("Filter By");
    const [staffTypeOpen, setStaffTypeOpen] = useState(false);
    const [shiftOpen, setShiftOpen] = useState(false);

    const staffTypes = [
        "Contractual (monthly)",
        "Contractual (daily)",
        "Work Basis",
        "Contractual (hourly)",
        "Regular"
    ];

    const shiftTypes = [
        "No Shift",
        "Break Shift",
        "fixed shift 10.30 hours"
    ];

    const [selectedStaffTypes, setSelectedStaffTypes] = useState<string[]>([]);
    const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
    const [selectedGroupBy, setSelectedGroupBy] = useState<string>(initialFilters.groupBy);

    // Synchronize internal state with parent state when popup opens
    React.useEffect(() => {
        if (isOpen) {
            setSelectedStaffTypes(initialFilters.staffTypes);
            setSelectedShifts(initialFilters.shifts);
            setSelectedGroupBy(initialFilters.groupBy);
        }
    }, [isOpen, initialFilters]);

    const toggleStaffType = (type: string) => {
        if (type === "Select All") {
            if (selectedStaffTypes.length === staffTypes.length) {
                setSelectedStaffTypes([]);
            } else {
                setSelectedStaffTypes([...staffTypes]);
            }
            return;
        }
        setSelectedStaffTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const toggleShift = (type: string) => {
        if (type === "Select All") {
            if (selectedShifts.length === shiftTypes.length) {
                setSelectedShifts([]);
            } else {
                setSelectedShifts([...shiftTypes]);
            }
            return;
        }
        setSelectedShifts(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5">
            <div className="bg-white w-[400px] h-[600px] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header with Tabs */}
                <div className="relative pt-6 px-6 border-b border-gray-100">
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <div className="flex gap-8">
                        {["Filter By", "Group By"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "pb-4 text-[14px] font-bold transition-all relative",
                                    activeTab === tab ? "text-[#3B82F6]" : "text-[#1F2937]"
                                )}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3B82F6]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
                    {activeTab === "Filter By" ? (
                        <>
                            {/* Staff Type Section */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[12px] font-medium text-[#6B7280]">Staff Type</label>
                                <div className="relative">
                                    <button
                                        onClick={() => setStaffTypeOpen(!staffTypeOpen)}
                                        className="w-full h-[45px] border border-gray-200 rounded-lg px-4 flex items-center justify-between text-[14px] hover:border-gray-300 transition-all shadow-sm"
                                    >
                                        <span className={cn(selectedStaffTypes.length > 0 ? "text-[#1F2937] font-medium" : "text-gray-400")}>
                                            {selectedStaffTypes.length === 0
                                                ? "Select Staff Type"
                                                : selectedStaffTypes.length === 1
                                                    ? selectedStaffTypes[0]
                                                    : `${selectedStaffTypes.length} Selected`}
                                        </span>
                                        <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", staffTypeOpen && "rotate-180")} />
                                    </button>

                                    {staffTypeOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-20 p-2 flex flex-col gap-1 max-h-[300px] overflow-y-auto">
                                            <div
                                                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-md"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleStaffType("Select All");
                                                }}
                                            >
                                                <Checkbox checked={selectedStaffTypes.length === staffTypes.length} />
                                                <span className="text-[14px] text-[#1F2937]">Select All</span>
                                            </div>
                                            <div className="h-px bg-gray-50 my-1" />
                                            {staffTypes.map(type => (
                                                <div
                                                    key={type}
                                                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-md"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleStaffType(type);
                                                    }}
                                                >
                                                    <Checkbox checked={selectedStaffTypes.includes(type)} />
                                                    <span className="text-[14px] text-[#1F2937]">{type}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Shifts Section */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[12px] font-medium text-[#6B7280]">Shifts</label>
                                <div className="relative">
                                    <button
                                        onClick={() => setShiftOpen(!shiftOpen)}
                                        className="w-full h-[45px] border border-gray-200 rounded-lg px-4 flex items-center justify-between text-[14px] hover:border-gray-300 transition-all shadow-sm"
                                    >
                                        <span className={cn(selectedShifts.length > 0 ? "text-[#1F2937] font-medium" : "text-gray-400")}>
                                            {selectedShifts.length === 0
                                                ? "Select Shift Type"
                                                : selectedShifts.length === 1
                                                    ? selectedShifts[0]
                                                    : `${selectedShifts.length} Selected`}
                                        </span>
                                        <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", shiftOpen && "rotate-180")} />
                                    </button>

                                    {shiftOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-20 p-2 flex flex-col gap-1 overflow-visible">
                                            <div
                                                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-md"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleShift("Select All");
                                                }}
                                            >
                                                <Checkbox checked={selectedShifts.length === shiftTypes.length} />
                                                <span className="text-[14px] text-[#1F2937]">Select All</span>
                                            </div>
                                            <div className="h-px bg-gray-50 my-1" />
                                            {shiftTypes.map(type => (
                                                <div
                                                    key={type}
                                                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-md"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleShift(type);
                                                    }}
                                                >
                                                    <Checkbox checked={selectedShifts.includes(type)} />
                                                    <span className="text-[14px] text-[#1F2937]">{type}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {["Salary Type", "Shift Template", "None"].map((option) => (
                                <div
                                    key={option}
                                    onClick={() => setSelectedGroupBy(option)}
                                    className={cn(
                                        "h-[48px] border rounded-lg px-4 flex items-center gap-4 cursor-pointer transition-all",
                                        selectedGroupBy === option
                                            ? "border-[#3B82F6] bg-[#F0F7FF] border-2"
                                            : "border-gray-200 hover:border-gray-300"
                                    )}
                                >
                                    <div className={cn(
                                        "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all",
                                        selectedGroupBy === option ? "border-[#3B82F6]" : "border-gray-300"
                                    )}>
                                        {selectedGroupBy === option && (
                                            <div className="w-[10px] h-[10px] rounded-full bg-[#3B82F6]" />
                                        )}
                                    </div>
                                    <span className={cn(
                                        "text-[14px] transition-colors",
                                        selectedGroupBy === option ? "text-[#3B82F6] font-bold" : "text-[#1F2937] font-medium"
                                    )}>
                                        {option}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex gap-4 mt-auto">
                    <Button
                        variant="outline"
                        className="flex-1 h-[45px] border-[#3B82F6] text-[#3B82F6] hover:bg-blue-50 font-bold"
                        onClick={() => {
                            setSelectedStaffTypes([]);
                            setSelectedShifts([]);
                            setSelectedGroupBy("None");
                        }}
                    >
                        Clear Filter
                    </Button>
                    <Button
                        className="flex-1 h-[45px] bg-[#3B82F6] hover:bg-blue-700 text-white font-bold"
                        onClick={() => onApply({
                            staffTypes: selectedStaffTypes,
                            shifts: selectedShifts,
                            groupBy: selectedGroupBy
                        })}
                    >
                        Apply Filter
                    </Button>
                </div>
            </div>
        </div>
    );
}