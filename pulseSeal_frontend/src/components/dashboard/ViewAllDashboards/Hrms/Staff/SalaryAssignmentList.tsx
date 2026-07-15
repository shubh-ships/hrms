"use client";

import React, { useState, useEffect } from "react";
import { MoveLeft, Search, Filter, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchEmployees, selectEmployees } from "@/features/employee/employeeSlice";

interface Staff {
    id: string;
    name: string;
    empId: string;
    department: string;
    staffType: string;
    salaryTemplate: string;
    hasSalaryDetails: boolean;
}

export default function SalaryAssignmentList() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const employees = useAppSelector(selectEmployees);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        dispatch(fetchEmployees());
    }, [dispatch]);

    useEffect(() => {
        if (employees) {
            const mappedUsers: Staff[] = employees.map((u: any) => ({
                id: u._id,
                name: u.name || (u.personal?.lastName ? `${u.personal.firstName} ${u.personal.lastName}` : (u.personal?.firstName || "Unknown")),
                empId: u.empCode || u.employment?.employeeCode || "N/A",
                department: u.department || (typeof u.employment?.departmentId === 'object' ? u.employment.departmentId?.name : "General"),
                staffType: u.staffType || u.employment?.workType || "REGULAR",
                salaryTemplate: (u.hasSalaryDetails || (u.salary && u.salary.length > 0)) ? "Standard" : "Select Salary Template",
                hasSalaryDetails: u.hasSalaryDetails ?? (u.salary && u.salary.length > 0) ?? false,
            }));
            setStaffList(mappedUsers);
        }
    }, [employees]);

    const filteredStaff = staffList.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.empId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-[#F8FAFC] min-h-screen font-sans p-[40px] w-full">
            {/* BACK BUTTON */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-[8px] text-[#3F5A54] mb-8 hover:text-[#2563EB] transition-colors"
            >
                <MoveLeft className="w-[18px] h-[18px]" />
                <span className="text-[14px] font-medium uppercase tracking-tight">Back</span>
            </button>

            {/* MAIN CARD */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm p-[24px]">
                {/* TOOLBAR */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-[340px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                            <input
                                type="text"
                                placeholder="Search by name or staff ID"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-[44px] w-full pl-10 pr-4 border border-[#E5E7EB] rounded-lg text-[14px] outline-none focus:border-[#3B82F6] transition-all bg-[#F9FAFB]/50"
                            />
                        </div>
                        <button className="h-[44px] px-6 border border-[#EBF5FF] bg-[#EBF5FF] text-[#3B82F6] rounded-lg text-[14px] font-semibold flex items-center gap-2 hover:bg-[#DBEAFE] transition-all">
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                    </div>

                    <button 
                        onClick={() => router.push("/dashboard/admin/hrms/addBulk?type=salary")}
                        className="h-[44px] px-6 border border-[#3B82F6] text-[#3B82F6] rounded-lg text-[14px] font-bold hover:bg-[#F3F4F6] transition-all"
                    >
                        Add Salary Details in Bulk
                    </button>
                </div>

                {/* TABLE */}
                <div className="w-full">
                    <div className="grid grid-cols-[1.5fr_1fr_1fr_1.2fr_1.8fr_1.5fr] bg-[#F8FAFC] border-y border-[#E5E7EB] py-4 px-6 items-center">
                        <span className="text-[11px] font-bold text-[#9CA3AF] uppercase">Name</span>
                        <span className="text-[11px] font-bold text-[#9CA3AF] uppercase">ID</span>
                        <span className="text-[11px] font-bold text-[#9CA3AF] uppercase">Department</span>
                        <span className="text-[11px] font-bold text-[#9CA3AF] uppercase">Staff Type</span>
                        <span className="text-[11px] font-bold text-[#9CA3AF] uppercase text-center">Salary Template</span>
                        <span className="text-[11px] font-bold text-[#9CA3AF] uppercase text-right mr-4">Actions</span>
                    </div>

                    <div className="flex flex-col">
                        {filteredStaff.map((staff) => (
                            <div
                                key={staff.id}
                                className="grid grid-cols-[1.5fr_1fr_1fr_1.2fr_1.8fr_1.5fr] px-6 py-5 border-b border-[#F1F5F9] last:border-0 items-center hover:bg-[#F8FAFC]/50 transition-colors"
                            >
                                <span className="text-[12px] text-[#1e293b] font-medium">{staff.name}</span>
                                <span className="text-[12px] text-[#4b5563] font-medium">{staff.empId}</span>
                                <span className="text-[12px] text-[#4b5563]">{staff.department || "-"}</span>
                                <span className="text-[12px] text-[#4b5563] font-medium">{staff.staffType}</span>

                                <div className="flex justify-center px-4">
                                    <div className="relative w-full max-w-[220px]">
                                        <select
                                            value={staff.salaryTemplate}
                                            onChange={() => { }} // Local state update could be added
                                            className="h-[34px] w-full border border-[#E5E7EB] rounded-lg px-4 text-[12px] text-[#4b5563] outline-none appearance-none bg-white font-medium shadow-sm transition-all"
                                        >
                                            <option>{staff.salaryTemplate}</option>
                                            <option>Delizia</option>
                                            <option>Standard</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={() => router.push(`/dashboard/admin/hrms/assignSalaryTemplate?userId=${staff.id}`)}
                                        className="text-[#3B82F6] text-[12px] font-bold hover:underline"
                                    >
                                        {staff.hasSalaryDetails ? "Edit Salary" : "Add Salary Details"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
