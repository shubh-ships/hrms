"use client";

import React, { useEffect } from "react";
import { MoveLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import multipleUser from "@/assets/StaffIcon/multipleUser.jpg";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createEmployee } from "@/features/employee/employeeSlice";
import { fetchDepartments, selectDepartments } from "@/features/departments/departmentSlice";
import { getAllRoles, selectRoles } from "@/features/role/roleSlice";
import { fetchUsers, selectUsers } from "@/features/user/userSlice";
import { fetchAllTemplates } from "@/features/employee/templateSlice";
import { toast } from "sonner";

export default function CreateEmployee() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    // Redux data for dropdowns
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
    const authUser = useAppSelector((state) => state.auth.user);
    const isSubmitting = useAppSelector((state) => state.employee.loading);

    // Load necessary data on mount
    useEffect(() => {
        dispatch(fetchDepartments({}));
        dispatch(getAllRoles());
        dispatch(fetchUsers());
        dispatch(fetchAllTemplates());
    }, [dispatch]);

    // Form State (Aligned with backend)
    const [formData, setFormData] = React.useState({
        // Profile Info / IDs
        userId: "",
        firstName: "",
        lastName: "",
        email: "",
        departmentId: "",
        userRoleTableId: "",
        contactNumber: "",

        // General / Employment Info
        employeeCode: "",
        employeeType: "REGULAR", // REQUIRED
        joinDate: "",
        status: "active",
        workType: "Full-Time",
        workLocation: "",

        // Templates (Moved to General Info)
        shiftTemplateId: "",
        leaveTemplateId: "",
        holidayTemplateId: "",
        weeklyOffTemplateId: "",
        attendanceOnWeeklyOffTemplateId: "",
        attendanceOnHolidayTemplateId: "",

        // Salary Info (Matched with schema array)
        salary: [
            { type: "basic", label: "Basic Pay", amount: 0 },
            { type: "hra", label: "House Rent Allowance", amount: 0 },
            { type: "allowance", label: "Other Allowance", amount: 0 },
            { type: "deduction", label: "Statutory Deduction", amount: 0 },
        ],

        // Others
        gender: "Select",
        dob: "",
        maritalStatus: "Select",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
        // Document Info
        aadhar: "",
        pan: "",
        passport: "",
        otherDocName: "",
        otherDocNumber: "",

        doj: "",
        bankName: "",
        ifsc: "",
        accNumber: "",
        accHolder: "",
        bankBranch: "",
    });

    const [documentFiles, setDocumentFiles] = React.useState<{ [key: string]: File | null }>({
        aadhar: null,
        pan: null,
        passport: null,
        otherDoc: null,
    });

    const handleSalaryChange = (index: number, value: string) => {
        const newSalary = [...formData.salary];
        newSalary[index].amount = Number(value) || 0;
        setFormData(prev => ({ ...prev, salary: newSalary }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // ID Linking Logic for System Users
        if (name === "userId" && value) {
            const selectedUser = users.find((u: any) => u.user_id?._id === value || u._id === value);
            if (selectedUser) {
                setFormData(prev => ({
                    ...prev,
                    userId: selectedUser.user_id?._id || value, // Real User ID
                    userRoleTableId: selectedUser.roleDefinitionId?._id || prev.userRoleTableId, // Link correct Designation
                    departmentId: selectedUser.departments?.[0]?._id || prev.departmentId // Link correct Dept
                }));
                return;
            }
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            setDocumentFiles(prev => ({ ...prev, [name]: files[0] }));
        }
    };

    const handleSave = async () => {
        if (!formData.firstName || !formData.contactNumber || !formData.userId || !formData.departmentId || !formData.userRoleTableId || !formData.leaveTemplateId || !formData.employeeCode || !formData.joinDate || !formData.employeeType) {
            toast.error("Required fields: User, Name, Contact, Dept, Role, Leave Template, Emp Code, Type, and Join Date!");
            return;
        }

        const employeeData = {
            userId: formData.userId,
            // Templates at top level (matching backend controller destructuring)
            leaveTemplateId: formData.leaveTemplateId,
            shiftTemplateId: formData.shiftTemplateId || undefined,
            holidayTemplateId: formData.holidayTemplateId || undefined,
            weeklyOffTemplateId: formData.weeklyOffTemplateId || undefined,
            attendanceOnWeeklyOffTemplateId: formData.attendanceOnWeeklyOffTemplateId || undefined,
            attendanceOnHolidayTemplateId: formData.attendanceOnHolidayTemplateId || undefined,

            personal: {
                firstName: formData.firstName,
                lastName: formData.lastName || undefined,
                email: formData.email,
                phone: formData.contactNumber || "0000000000",
                dob: formData.dob || undefined,
                gender: (formData.gender !== "Select" ? formData.gender.toLowerCase() : undefined) as any,
                maritalStatus: (formData.maritalStatus !== "Select" ? formData.maritalStatus.toLowerCase() : undefined) as any,
                address: {
                    line1: formData.addressLine1 || undefined,
                    line2: formData.addressLine2 || undefined,
                    city: formData.city || undefined,
                    state: formData.state || undefined,
                    country: formData.country || undefined,
                    pincode: formData.pincode || undefined,
                }
            },
            employment: {
                employeeCode: formData.employeeCode,
                employeeType: formData.employeeType as any,
                departmentId: formData.departmentId,
                userRoleTableId: formData.userRoleTableId,
                joinDate: formData.joinDate,
                workType: formData.workType as any,
                status: formData.status as any,
                workLocation: formData.workLocation || undefined,
            },
            documents: [
                ...(formData.aadhar ? [{ type: "aadhaar" as const, number: formData.aadhar, verified: false }] : []),
                ...(formData.pan ? [{ type: "pan" as const, number: formData.pan, verified: false }] : []),
                ...(formData.passport ? [{ type: "passport" as const, number: formData.passport, verified: false }] : []),
                ...(formData.otherDocName ? [{ type: "others" as const, number: formData.otherDocNumber, verified: false }] : []),
            ],
            salary: formData.salary.filter(s => s.amount > 0),
            bank: (formData.accNumber) ? {
                bankName: formData.bankName || undefined,
                ifsc: formData.ifsc || undefined,
                accountNumber: formData.accNumber,
                accountHolderName: formData.accHolder || undefined,
                branch: formData.bankBranch || undefined,
            } : undefined,
        };

        const files = new FormData();
        const docTypes = [
            { id: "aadhar", type: "aadhaar" },
            { id: "pan", type: "pan" },
            { id: "passport", type: "passport" },
            { id: "otherDoc", type: "others" },
        ];

        docTypes.forEach((doc) => {
            if (documentFiles[doc.id]) {
                files.append(`documents[${doc.id === "otherDoc" ? formData.salary.length + 3 : docTypes.indexOf(doc)}][proof]`, documentFiles[doc.id]!);
            }
        });
        // WAIT, the file index mapping for documents is tricky in the backend because it relies on the index in the 'documents' array.
        // Let's re-calculate the index properly in docTypes loop.
        const activeDocs = [
            ...(formData.aadhar ? ["aadhar"] : []),
            ...(formData.pan ? ["pan"] : []),
            ...(formData.passport ? ["passport"] : []),
            ...(formData.otherDocName ? ["otherDoc"] : []),
        ];

        files.delete("documents"); // clear if any
        activeDocs.forEach((docId, index) => {
            if (documentFiles[docId]) {
                files.append(`documents[${index}][proof]`, documentFiles[docId]!);
            }
        });


        const result = await dispatch(createEmployee({ employeeData, files }));

        if (createEmployee.fulfilled.match(result)) {
            toast.success("Employee created successfully!");
            router.push("/dashboard/admin/hrms/staff");
        } else {
            const errMsg = result.payload as string || "Failed to create employee.";
            toast.error(errMsg);
        }
    };

    const inputStyle =
        "h-[40px] w-full border border-[#E5E7EB] rounded-lg px-[12px] text-[13px] outline-none focus:border-[#3B82F6] placeholder-[#9CA3AF]";

    const labelStyle = "text-[12px] font-medium text-[#4B5563] mb-[6px]";

    return (
        <div className="bg-[#F8FAFC] min-h-[calc(100vh-140px)] font-sans flex flex-col w-full">

            {/* HEADER */}
            <div className="mx-[40px] mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center mt-[20px] gap-[8px] text-[#4B5563] mb-6 hover:text-[#1F2937] transition-colors"
                >
                    <MoveLeft className="w-[16px] h-[16px]" />
                    <span className="text-[14px] font-medium">Back</span>
                </button>

                <h1 className="text-[20px] font-semibold text-[#1F2937]">
                    Create New Employee
                </h1>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex gap-[24px] mx-[40px] mb-[40px] items-start flex-1">

                {/* FORM SECTION */}
                <div className="flex-1 bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">

                    {/* PROFILE INFO */}
                    <div className="p-[24px] border-b border-[#E5E7EB]">
                        <h2 className="text-[16px] font-semibold text-[#1F2937] mb-[20px]">
                            Profile Information
                        </h2>

                        <div className="grid grid-cols-4 gap-[20px]">
                            <div className="flex flex-col">
                                <label className={labelStyle}>Select User <span className="text-red-500">*</span></label>
                                <select
                                    name="userId"
                                    value={formData.userId}
                                    onChange={handleChange}
                                    className={inputStyle}
                                >
                                    <option value="">Select User</option>
                                    {users.map((u: any) => (
                                        <option key={u._id} value={u.user_id?._id || u._id}>{u.user_id?.name || u.name} ({u.user_id?.email || u.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className={labelStyle}>First Name <span className="text-red-500">*</span></label>
                                <input
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="Enter First Name"
                                    className={inputStyle}
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className={labelStyle}>Last Name</label>
                                <input
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Enter Last Name"
                                    className={inputStyle}
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className={labelStyle}>Email</label>
                                <input
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter Email"
                                    className={inputStyle}
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className={labelStyle}>Employee Code <span className="text-red-500">*</span></label>
                                <input
                                    name="employeeCode"
                                    value={formData.employeeCode}
                                    onChange={handleChange}
                                    placeholder="e.g. EMP001"
                                    className={inputStyle}
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className={labelStyle}>Department <span className="text-red-500">*</span></label>
                                <select
                                    name="departmentId"
                                    value={formData.departmentId}
                                    onChange={handleChange}
                                    className={inputStyle}
                                >
                                    <option value="">Select Department</option>
                                    {departments.map((d: any) => (
                                        <option key={d._id} value={d._id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className={labelStyle}>Designation / Role <span className="text-red-500">*</span></label>
                                <select
                                    name="userRoleTableId"
                                    value={formData.userRoleTableId}
                                    onChange={handleChange}
                                    className={inputStyle}
                                >
                                    <option value="">Select Role</option>
                                    {roles.map((r: any) => (
                                        <option key={r._id} value={r._id}>{r.roleName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className={labelStyle}>Contact Number <span className="text-red-500">*</span></label>
                                <input
                                    name="contactNumber"
                                    value={formData.contactNumber}
                                    onChange={handleChange}
                                    placeholder="Enter Contact Number"
                                    className={inputStyle}
                                />
                            </div>
                        </div>
                    </div>

                    {/* GENERAL INFORMATION */}
                    <div className="p-[24px] border-b border-[#E5E7EB]">
                        <h2 className="text-[16px] font-semibold text-[#1F2937] mb-[20px]">
                            General Information
                        </h2>

                        <div className="grid grid-cols-4 gap-[20px]">
                            {/* START TEMPLATES */}
                            <div className="flex flex-col">
                                <label className={labelStyle}>Leave Template <span className="text-red-500">*</span></label>
                                <select
                                    name="leaveTemplateId"
                                    value={formData.leaveTemplateId}
                                    onChange={handleChange}
                                    className={inputStyle}
                                >
                                    <option value="">Select Template</option>
                                    {leaveTemplates.map((p: any) => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className={labelStyle}>Office Shift Template <span className="text-red-500">*</span></label>
                                <select
                                    name="shiftTemplateId"
                                    value={formData.shiftTemplateId}
                                    onChange={handleChange}
                                    className={inputStyle}
                                >
                                    <option value="">Select Shift</option>
                                    {shiftTemplates.map((s: any) => (
                                        <option key={s._id} value={s._id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className={labelStyle}>Holiday Template</label>
                                <select
                                    name="holidayTemplateId"
                                    value={formData.holidayTemplateId}
                                    onChange={handleChange}
                                    className={inputStyle}
                                >
                                    <option value="">Select Template</option>
                                    {holidayTemplates.map((h: any) => (
                                        <option key={h._id} value={h._id}>{h.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className={labelStyle}>Weekly Off Template</label>
                                <select
                                    name="weeklyOffTemplateId"
                                    value={formData.weeklyOffTemplateId}
                                    onChange={handleChange}
                                    className={inputStyle}
                                >
                                    <option value="">Select Template</option>
                                    {weeklyOffTemplates.map((w: any) => (
                                        <option key={w._id} value={w._id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className={labelStyle}>Weekly Off Attendance Template</label>
                                <select
                                    name="attendanceOnWeeklyOffTemplateId"
                                    value={formData.attendanceOnWeeklyOffTemplateId}
                                    onChange={handleChange}
                                    className={inputStyle}
                                >
                                    <option value="">Select Template</option>
                                    {attendanceOnWeekOffTemplates.map((a: any) => (
                                        <option key={a._id} value={a._id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className={labelStyle}>Holiday Attendance Template</label>
                                <select
                                    name="attendanceOnHolidayTemplateId"
                                    value={formData.attendanceOnHolidayTemplateId}
                                    onChange={handleChange}
                                    className={inputStyle}
                                >
                                    <option value="">Select Template</option>
                                    {attendanceOnHolidayTemplates.map((a: any) => (
                                        <option key={a._id} value={a._id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* PERSONAL INFO */}
                    <div className="p-[24px] border-b border-[#E5E7EB]">
                        <h2 className="text-[16px] font-semibold text-[#1F2937] mb-[20px]">
                            Personal Information
                        </h2>

                        <div className="grid grid-cols-4 gap-[20px]">
                            <div className="flex flex-col">
                                <label className={labelStyle}>Gender</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className={inputStyle}
                                >
                                    <option value="Select">Select</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className={labelStyle}>Date of Birth</label>
                                <input
                                    type="date"
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleChange}
                                    className={inputStyle}
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className={labelStyle}>Marital Status</label>
                                <select
                                    name="maritalStatus"
                                    value={formData.maritalStatus}
                                    onChange={handleChange}
                                    className={inputStyle}
                                >
                                    <option value="Select">Select</option>
                                    <option value="single">Single</option>
                                    <option value="married">Married</option>
                                    <option value="divorced">Divorced</option>
                                </select>
                            </div>
                        </div>

                        {/* ADDRESS FIELDS INSIDE PERSONAL SECTION */}
                        <h2 className="text-[16px] font-medium text-[#4B5563] mt-[24px] mb-[20px]">Address</h2>
                        <div className="grid grid-cols-4 gap-[20px]">
                            <div className="flex flex-col">
                                <label className={labelStyle}>Address Line 1</label>
                                <input
                                    name="addressLine1"
                                    value={formData.addressLine1}
                                    onChange={handleChange}
                                    placeholder="House No, Building"
                                    className={inputStyle}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className={labelStyle}>Address Line 2</label>
                                <input
                                    name="addressLine2"
                                    value={formData.addressLine2}
                                    onChange={handleChange}
                                    placeholder="Area, Landmark"
                                    className={inputStyle}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className={labelStyle}>City</label>
                                <input
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="City"
                                    className={inputStyle}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className={labelStyle}>State</label>
                                <input
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    placeholder="State"
                                    className={inputStyle}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className={labelStyle}>Country</label>
                                <input
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    placeholder="Country"
                                    className={inputStyle}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className={labelStyle}>Pincode</label>
                                <input
                                    name="pincode"
                                    value={formData.pincode}
                                    onChange={handleChange}
                                    placeholder="Pincode"
                                    className={inputStyle}
                                />
                            </div>
                        </div>
                    </div>

                    {/* EMPLOYMENT INFORMATION */}
                    <div className="p-[24px] border-b border-[#E5E7EB]">
                        <h2 className="text-[16px] font-semibold text-[#1F2937] mb-[20px]">
                            Employment Information
                        </h2>

                        <div className="grid grid-cols-4 gap-[20px]">
                            <div className="flex flex-col">
                                <label className={labelStyle}>Employee Type <span className="text-red-500">*</span></label>
                                <select
                                    name="employeeType"
                                    value={formData.employeeType}
                                    onChange={handleChange}
                                    className={inputStyle}
                                >
                                    <option value="REGULAR">Regular</option>
                                    <option value="CONTRACTUAL">Contractual</option>
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className={labelStyle}>Date of Joining <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    name="joinDate"
                                    value={formData.joinDate}
                                    onChange={handleChange}
                                    className={inputStyle}
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className={labelStyle}>Employment Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className={inputStyle}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="terminated">Terminated</option>
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className={labelStyle}>Work Type</label>
                                <select
                                    name="workType"
                                    value={formData.workType}
                                    onChange={handleChange}
                                    className={inputStyle}
                                >
                                    <option value="Full-Time">Full-Time</option>
                                    <option value="Intern">Intern</option>
                                    <option value="Probation">Probation</option>
                                    <option value="Notice">Notice</option>
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className={labelStyle}>Work Location</label>
                                <input
                                    name="workLocation"
                                    value={formData.workLocation}
                                    onChange={handleChange}
                                    placeholder="e.g. HQ, Remote"
                                    className={inputStyle}
                                />
                            </div>

                            {formData.salary.map((item, index) => (
                                <div key={item.type} className="flex flex-col">
                                    <label className={labelStyle}>{item.label}</label>
                                    <input
                                        type="number"
                                        value={item.amount || ""}
                                        onChange={(e) => handleSalaryChange(index, e.target.value)}
                                        placeholder={`Enter ${item.label}`}
                                        className={inputStyle}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* IDENTITY DOCUMENTS */}
                    <div className="p-[24px] border-b border-[#E5E7EB]">
                        <h2 className="text-[16px] font-semibold text-[#1F2937] mb-[20px]">
                            Identity Documents (Upload)
                        </h2>

                        <div className="flex flex-col gap-[20px]">
                            {/* Aadhar Row */}
                            <div className="grid grid-cols-2 gap-[20px]">
                                <div className="flex flex-col">
                                    <label className={labelStyle}>Aadhar Card Number</label>
                                    <input
                                        name="aadhar"
                                        value={formData.aadhar}
                                        onChange={handleChange}
                                        placeholder="0000 0000 0000"
                                        className={inputStyle}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className={labelStyle}>Upload Aadhar Card</label>
                                    <input
                                        type="file"
                                        name="aadhar"
                                        onChange={handleFileChange}
                                        className="h-[40px] w-full border border-[#E5E7EB] rounded-lg px-[12px] text-[13px] outline-none pt-[8px] file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#3F5A54] file:text-white hover:file:bg-[#2d4540]"
                                    />
                                </div>
                            </div>

                            {/* PAN Row */}
                            <div className="grid grid-cols-2 gap-[20px]">
                                <div className="flex flex-col">
                                    <label className={labelStyle}>PAN Card Number</label>
                                    <input
                                        name="pan"
                                        value={formData.pan}
                                        onChange={handleChange}
                                        placeholder="ABCDE1234F"
                                        className={inputStyle}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className={labelStyle}>Upload PAN Card</label>
                                    <input
                                        type="file"
                                        name="pan"
                                        onChange={handleFileChange}
                                        className="h-[40px] w-full border border-[#E5E7EB] rounded-lg px-[12px] text-[13px] outline-none pt-[8px] file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#3F5A54] file:text-white hover:file:bg-[#2d4540]"
                                    />
                                </div>
                            </div>

                            {/* Passport Row */}
                            <div className="grid grid-cols-2 gap-[20px]">
                                <div className="flex flex-col">
                                    <label className={labelStyle}>Passport Number</label>
                                    <input
                                        name="passport"
                                        value={formData.passport}
                                        onChange={handleChange}
                                        placeholder="Enter Passport No"
                                        className={inputStyle}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className={labelStyle}>Upload Passport</label>
                                    <input
                                        type="file"
                                        name="passport"
                                        onChange={handleFileChange}
                                        className="h-[40px] w-full border border-[#E5E7EB] rounded-lg px-[12px] text-[13px] outline-none pt-[8px] file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#3F5A54] file:text-white hover:file:bg-[#2d4540]"
                                    />
                                </div>
                            </div>

                            {/* Others Row */}
                            <div className="grid grid-cols-3 gap-[20px]">
                                <div className="flex flex-col">
                                    <label className={labelStyle}>Other Document Name</label>
                                    <input
                                        name="otherDocName"
                                        value={formData.otherDocName}
                                        onChange={handleChange}
                                        placeholder="e.g. Voter ID"
                                        className={inputStyle}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className={labelStyle}>Document Number</label>
                                    <input
                                        name="otherDocNumber"
                                        value={formData.otherDocNumber}
                                        onChange={handleChange}
                                        placeholder="Enter Number"
                                        className={inputStyle}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className={labelStyle}>Upload Document</label>
                                    <input
                                        type="file"
                                        name="otherDoc"
                                        onChange={handleFileChange}
                                        className="h-[40px] w-full border border-[#E5E7EB] rounded-lg px-[12px] text-[13px] outline-none pt-[8px] file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#3F5A54] file:text-white hover:file:bg-[#2d4540]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* BANK DETAILS */}
                    <div className="p-[24px]">
                        <h2 className="text-[16px] font-semibold text-[#1F2937] mb-[20px]">Bank Details</h2>
                        <div className="grid grid-cols-4 gap-[20px]">
                            <div className="flex flex-col">
                                <label className={labelStyle}>Bank Name</label>
                                <input
                                    name="bankName"
                                    value={formData.bankName}
                                    onChange={handleChange}
                                    placeholder="e.g. HDFC Bank"
                                    className={inputStyle}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className={labelStyle}>IFSC Code</label>
                                <input
                                    name="ifsc"
                                    value={formData.ifsc}
                                    onChange={handleChange}
                                    placeholder="HDFC0001234"
                                    className={inputStyle}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className={labelStyle}>Account Number</label>
                                <input
                                    name="accNumber"
                                    value={formData.accNumber}
                                    onChange={handleChange}
                                    placeholder="0123456789"
                                    className={inputStyle}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className={labelStyle}>Account Holder Name</label>
                                <input
                                    name="accHolder"
                                    value={formData.accHolder}
                                    onChange={handleChange}
                                    placeholder="Name as on Bank Passbook"
                                    className={inputStyle}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className={labelStyle}>Bank Branch</label>
                                <input
                                    name="bankBranch"
                                    value={formData.bankBranch}
                                    onChange={handleChange}
                                    placeholder="Branch Location"
                                    className={inputStyle}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE ACTION CARD */}
                <div className="w-[305px] bg-white border border-[#E5E7EB] rounded-xl p-[20px] shadow-sm shrink-0">
                    <div className="h-[173px] bg-[#F8FAFC] rounded-lg flex items-center justify-center mb-6 overflow-hidden">
                        <Image
                            src={multipleUser}
                            alt="Bulk Upload"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <h3 className="text-[16px] font-semibold text-[#1F2937]">Add Multiple Employees</h3>

                    <p className="text-[12px] text-[#4B5563] mt-2 mb-6 leading-relaxed">
                        Adding multiple employees can be done in just a few simple steps.
                    </p>

                    <button
                        onClick={() => router.push("/dashboard/admin/hrms/addBulk?type=employee")}
                        className="h-[40px] w-full border border-[#3F5A54] text-[#3F5A54] rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-[#F9FAFB] transition-all"
                    >
                        ADD Bulk <ArrowRight size={14} />
                    </button>
                </div>
            </div>

            {/* SPACER TO PUSH FOOTER DOWN */}
            <div className="flex-1"></div>

            {/* STICKY FOOTER */}
            <div className="sticky bottom-[-16px] z-50 bg-white border-t border-[#E5E7EB] flex justify-end px-[40px] h-[72px] items-center gap-[16px] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] -mx-4 w-[calc(100%+32px)]">
                <button
                    onClick={() => router.back()}
                    className="w-[146px] h-[37px] border border-[#3F5A54] text-[#3F5A54] rounded-lg text-[14px] font-medium hover:bg-[#F9FAFB] transition-all"
                >
                    Back
                </button>

                <button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="w-[146px] h-[37px] bg-[#3F5A54] text-white rounded-lg text-[14px] font-medium hover:bg-[#2d4540] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? "Saving..." : "Save & Proceed"}
                </button>
            </div>
        </div>
    );
}
