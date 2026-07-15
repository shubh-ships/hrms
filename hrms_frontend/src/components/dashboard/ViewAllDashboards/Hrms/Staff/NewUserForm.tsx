"use client";

import React, { useState, useEffect } from "react";
import { MoveLeft, Search, ChevronDown, ArrowRight, X, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import multipleUser from "@/assets/StaffIcon/multipleUser.jpg";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getAllRoles, selectRoles, createUserWithRole } from "@/features/role/roleSlice";
import { fetchDepartments, selectDepartments } from "@/features/departments/departmentSlice";
import { getAdminUsers, createAdmin, selectAdmins } from "@/features/newUser/newUserSlice";
import { fetchUsers, selectUsers } from "@/features/user/userSlice";
import { toast } from "sonner";

export default function NewUserForm() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    // Redux selectors
    const roles = useAppSelector(selectRoles);
    const departments = useAppSelector(selectDepartments);
    const admins = useAppSelector(selectAdmins);
    const users = useAppSelector(selectUsers);

    // Form inputs state
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [selectedRole, setSelectedRole] = useState<any>(null);
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [parentRole, setParentRole] = useState<any>(null);
    const [parentRoleSearch, setParentRoleSearch] = useState("");
    const [password, setPassword] = useState("12345678");

    // UI toggle state
    const [isRoleOpen, setIsRoleOpen] = useState(false);
    const [isDeptOpen, setIsDeptOpen] = useState(false);
    const [isReportsToOpen, setIsReportsToOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Load dependency data on mount
    useEffect(() => {
        dispatch(getAllRoles());
        dispatch(fetchDepartments({}));
        dispatch(getAdminUsers());
        dispatch(fetchUsers());
    }, [dispatch]);

    // Combine hierarchy entries and primary admins for a complete "Reports To" search pool
    const hierarchyStaff = (users || []).map(entry => ({
        id: entry._id, // UserRoleTable ID (required for parent linkage)
        coreUserId: entry.user_id?._id || entry.user_id,
        name: entry.user_id?.name || "Unknown",
        userType: entry.user_id?.is_superuser || entry.user_id?.is_organizer ? "Admin" : "User"
    }));

    const adminPool = (admins || []).map(admin => {
        // Find if this admin already has a hierarchy entry
        const existingNode = hierarchyStaff.find(s => String(s.coreUserId) === String(admin._id || admin.id));
        if (existingNode) return null; // Skip duplicate

        return {
            id: admin._id || admin.id, // Fallback to User ID if no role entry found
            coreUserId: admin._id || admin.id,
            name: admin.name,
            userType: "Admin"
        };
    }).filter(Boolean) as any[];

    const staffPool = [...hierarchyStaff, ...adminPool];

    const filteredStaffPool = staffPool.filter(s =>
        (s.name || "").toLowerCase().includes(parentRoleSearch.toLowerCase())
    );


    // Add User Simulation 
    const handleReset = () => {
        setFullName("");
        setEmail("");
        setContactNumber("");
        setSelectedRole(null);
        setSelectedDepartments([]);
        setParentRole(null);
        setParentRoleSearch("");
        setPassword("12345678");
    };

    const handleCreateAccount = async () => {
        if (!fullName || !selectedRole || !email) {
            toast.error("Please provide Full Name, Email and Role");
            return;
        }

        const userData = {
            name: fullName,
            email: email.toLowerCase().trim(),
            phoneNumber: contactNumber,
            password: password,
            departmentId: selectedDepartments,
            roleDefinitionId: selectedRole._id,
            parentRoleId: parentRole ? parentRole.id : null
        };

        try {
            if (selectedRole.roleName === "Admin") {
                await dispatch(createAdmin(userData)).unwrap();
            } else {
                await dispatch(createUserWithRole(userData)).unwrap();
            }
            toast.success("Account created successfully");
            router.push("/dashboard/admin/hrms/addStaff");
        } catch (error: any) {
            toast.error(error || "Failed to create account");
        }
    };


    // Toggle Department Selection
    const toggleDepartment = (dept: string) => {
        if (selectedDepartments.includes(dept)) {
            setSelectedDepartments(selectedDepartments.filter((d) => d !== dept));
        } else {
            setSelectedDepartments([...selectedDepartments, dept]);
        }
    };


    return (
        <div className="bg-[#F8FAFC] min-h-[140vh] px-[40px] pt-[24px] pb-0 font-sans flex flex-col relative w-full">
            {/* Header / Back Button */}
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-[8px] text-[#4B5563] hover:text-[#111827] transition-colors w-fit mb-4"
                >
                    <MoveLeft className="w-[16px] h-[16px]" />
                    <span className="text-[14px] font-medium">Back</span>
                </button>

                <h1 className="text-[20px] font-semibold text-[#1F2937] h-[30px] w-[209px]">Create New Account</h1>
                <p className="text-[#9CA3AF] text-[10px] h-[15px] w-[281px]">Fill in the details to add a new user with role assignment.</p>
            </div>

            {/* Main Content Layout */}
            <div className="flex gap-[24px] w-full items-start">

                {/* Left Side: Form Container */}
                <div className="flex-1 bg-white border border-[#E5E7EB] rounded-xl flex flex-col overflow-hidden">

                    {/* Basic Information Section */}
                    <div className="p-[24px] border-b border-[#E5E7EB]">
                        <h2 className="text-[16px] font-medium text-[#1F2937]">Basic Information</h2>

                        <div className="flex gap-[30px]">
                            {/* Full Name */}
                            <div className="flex flex-col mt-[21px] gap-[6px]">
                                <label className="text-[10px] font-medium text-[#4B5563]">
                                    Full Name <span className="text-[#EF4444]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Enter Name"
                                    className="h-[36px] w-[230px] text-[10px] px-3 bg-white border border-[#E5E7EB] rounded-lg text-[#1F2937] outline-none focus:border-[#3F5A54] transition-colors"
                                />
                            </div>

                            {/* Email Address */}
                            <div className="flex flex-col mt-[21px] gap-[6px]">
                                <label className="text-[10px] font-medium text-[#4B5563]">
                                    Email Address <span className="text-[#EF4444]">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@company.com"
                                    className="h-[36px] w-[230px] text-[10px] px-3 bg-white border border-[#E5E7EB] rounded-lg text-[#1F2937] outline-none focus:border-[#3F5A54] transition-colors"
                                />
                            </div>

                            {/* Contact Number */}
                            <div className="flex flex-col mt-[21px] gap-[6px]">
                                <label className="text-[10px] font-medium text-[#4B5563]">
                                    Contact Number <span className="text-[#EF4444]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={contactNumber}
                                    onChange={(e) => setContactNumber(e.target.value)}
                                    placeholder="Enter Phone Number"
                                    className="h-[36px] w-[230px] text-[10px] px-3 bg-white border border-[#E5E7EB] rounded-lg text-[#1F2937] outline-none focus:border-[#3F5A54] transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Role & Hierarchy Assignment Section */}
                    <div className="p-[24px] border-b border-[#E5E7EB]">
                        <h2 className="text-[16px] font-medium text-[#1F2937]">Role & Hierarchy Assignment</h2>

                        <div className="flex gap-[30px] items-start">
                            {/* Role Dropdown */}
                            <div className="flex flex-col mt-[21px] gap-[6px] relative">
                                <label className="text-[10px] font-medium text-[#4B5563]">
                                    Role <span className="text-[#EF4444]">*</span>
                                </label>
                                <div
                                    className="h-[36px] w-[230px] px-3 bg-white border border-[#E5E7EB] rounded-lg flex items-center justify-between cursor-pointer focus:border-[#3F5A54] transition-colors"
                                    onClick={() => setIsRoleOpen(!isRoleOpen)}
                                >
                                    <span className={`text-[10px] ${selectedRole ? 'text-[#1F2937]' : 'text-[#9CA3AF]'}`}>
                                        {selectedRole ? selectedRole.roleName : "Select role from hierarchy"}
                                    </span>
                                    <ChevronDown className="w-[16px] h-[16px] text-[#9CA3AF]" />
                                </div>

                                {isRoleOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsRoleOpen(false)} />
                                        <div className="absolute top-[64px] left-0 w-[230px] bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50 py-2">
                                            {(roles || []).map((role, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        setSelectedRole(role);
                                                        setIsRoleOpen(false);
                                                    }}
                                                    className="px-[12px] py-[8px] hover:bg-[#F9FAFB] cursor-pointer flex items-center gap-[8px]"
                                                >
                                                    <div className="h-[20px] w-[20px] rounded-[4px] bg-[#EBF0FF] text-[#3B82F6] flex items-center justify-center text-[10px] font-medium">
                                                        L{role.hierarchyLevel || idx + 1}
                                                    </div>
                                                    <span className="text-[11px] text-[#4B5563]">{role.roleName}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Departments Multi-Select */}
                            <div className="flex flex-col mt-[21px] gap-[6px] relative">
                                <label className="text-[10px] font-medium text-[#4B5563]">
                                    Departments <span className="text-[#EF4444]">*</span>
                                </label>
                                <div
                                    className="h-[36px] w-[327px] px-3 bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg flex items-center justify-between cursor-pointer focus:border-[#3F5A54] transition-colors"
                                    onClick={() => setIsDeptOpen(!isDeptOpen)}
                                >
                                    <span className={`text-[10px] ${selectedDepartments.length ? 'text-[#1F2937] font-medium' : 'text-[#9CA3AF]'}`}>
                                        {selectedDepartments.length ? `${selectedDepartments.length} departments selected` : "Select departments..."}
                                    </span>
                                    <ChevronDown className="w-[16px] h-[16px] text-[#9CA3AF]" />
                                </div>

                                {/* Selected Department Pills */}
                                {selectedDepartments.length > 0 && (
                                    <div className="flex flex-wrap gap-[8px] mt-[10px] w-[327px]">
                                        {selectedDepartments.map((deptId, index) => {
                                            const dept = departments.find(d => d._id === deptId);
                                            return (
                                                <div key={index} className="h-[25px] px-[10px] bg-[#EBF0FF] text-[#3B82F6] rounded-[6px] flex items-center gap-[6px] text-[10px] font-medium">
                                                    {dept?.name || "Dept"}
                                                    <X
                                                        className="w-[12px] h-[12px] cursor-pointer text-[#3B82F6] hover:text-[#2563EB]"
                                                        onClick={() => toggleDepartment(deptId)}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {isDeptOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsDeptOpen(false)} />
                                        <div className="absolute top-[64px] left-0 w-[327px] bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50 py-2">
                                            {/* Select All */}
                                            <div
                                                className="px-[16px] py-[8px] hover:bg-[#F9FAFB] cursor-pointer flex items-center gap-[12px]"
                                                onClick={() => {
                                                    if (selectedDepartments.length === (departments || []).length) {
                                                        setSelectedDepartments([]);
                                                    } else {
                                                        setSelectedDepartments((departments || []).map(d => d._id));
                                                    }
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDepartments.length === departments.length}
                                                    readOnly
                                                    className="w-[14px] h-[14px] rounded border-[#D1D5DB] accent-[#3F5A54] cursor-pointer"
                                                />
                                                <span className="text-[11px] font-medium text-[#1F2937]">Select All</span>
                                            </div>

                                            {(departments || []).map((dept, idx) => (
                                                <div
                                                    key={idx}
                                                    className="px-[16px] py-[8px] hover:bg-[#F9FAFB] cursor-pointer flex items-center gap-[12px]"
                                                    onClick={() => toggleDepartment(dept._id)}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDepartments.includes(dept._id)}
                                                        readOnly
                                                        className="w-[14px] h-[14px] rounded border-[#D1D5DB] accent-[#3F5A54] cursor-pointer"
                                                    />
                                                    <span className="text-[11px] text-[#4B5563]">{dept.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Reports To (Parent Role) */}
                        <div className="flex flex-col mt-[21px] gap-[6px] relative">
                            <label className="text-[10px] font-medium text-[#4B5563]">
                                Reports To (Parent Role) - <span className="text-[#9CA3AF]">Search Users & Admins</span>
                            </label>
                            <div className="relative w-[480px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[#9CA3AF]" />
                                <input
                                    type="text"
                                    value={parentRoleSearch}
                                    onChange={(e) => {
                                        setParentRoleSearch(e.target.value);
                                        setIsReportsToOpen(true);
                                    }}
                                    onFocus={() => setIsReportsToOpen(true)}
                                    placeholder="Search for Parent Role by name"
                                    className="w-[480px] h-[36px] pl-[34px] pr-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[10px] text-[#1F2937] outline-none focus:border-[#3F5A54] transition-colors"
                                />
                                {isReportsToOpen && parentRoleSearch.length > 0 && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsReportsToOpen(false)} />
                                        <div className="absolute top-[40px] left-0 w-full bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50 py-2 max-h-[200px] overflow-y-auto">
                                            {filteredStaffPool.length > 0 ? (
                                                filteredStaffPool.map((staff, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => {
                                                            setParentRole(staff);
                                                            setParentRoleSearch(staff.name);
                                                            setIsReportsToOpen(false);
                                                        }}
                                                        className="px-4 py-2 hover:bg-[#F9FAFB] cursor-pointer flex items-center justify-between"
                                                    >
                                                        <span className="text-[11px] text-[#4B5563]">{staff.name}</span>
                                                        <span className="text-[9px] text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded">
                                                            {staff.userType || "Staff"}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-2 text-[11px] text-[#9CA3AF]">No results found</div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Account Security Section */}
                    <div className="p-[24px]">
                        <h2 className="text-[16px] font-medium text-[#1F2937]">Account Security</h2>

                        <div className="flex gap-[30px]">
                            <div className="flex flex-col mt-[21px] gap-[6px] w-[230px]">
                                <label className="text-[10px] font-medium text-[#4B5563]">
                                    Password <span className="text-[#EF4444]">*</span>
                                </label>
                                <div className="relative w-[230px]">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-[36px] w-[230px] pl-3 pr-9 bg-white border border-[#E5E7EB] rounded-lg text-[10px] text-[#1F2937] outline-none focus:border-[#3F5A54] transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-[14px] h-[14px]" />
                                        ) : (
                                            <Eye className="w-[14px] h-[14px]" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-[10px] text-[#9CA3AF] mt-1">Default Password: "12345678"</p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Side: Add Bulk Info Card */}
                <div className="w-[284px] flex-shrink-0 bg-white border border-[#E5E7EB] rounded-xl flex flex-col p-[20px]">
                    <div className="w-[244px] h-[173px] bg-[#F8FAFC] rounded-lg mb-6 flex items-center justify-center overflow-hidden">
                        <Image src={multipleUser} alt="Bulk Upload" className="w-[244px] h-[173px] object-cover" />
                    </div>

                    <h3 className="text-[16px] font-medium text-[#1F2937]">Add Multiple User</h3>
                    <p className="text-[12px] w-[232px] h-[30px] text-[#4B5563] leading-relaxed mb-4">
                        Adding multiple user can be done in just a few simple steps.
                    </p>

                    <button className="h-[40px] w-full border border-[#3F5A54] text-[#3F5A54] text-[14px] font-medium rounded-lg flex justify-center items-center gap-2 hover:bg-[#F9FAFB] transition-all"
                        onClick={() => router.push("/dashboard/admin/hrms/addBulk?type=user")}
                    >
                        ADD Bulk <ArrowRight className="w-[14px] h-[14px]" />
                    </button>
                </div>

            </div>

            {/* Bottom Floating Action Bar */}
            <div className="sticky bottom-0 mt-auto -mx-[56px] h-[72px] bg-white border-t border-[#E5E7EB] px-[40px] flex items-center justify-end gap-[16px] z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button
                    onClick={handleReset}
                    className="h-[37px] mt-[20px] w-[146px] border border-[#3F5A54] text-[#3F5A54] rounded-lg text-[14px] font-medium hover:bg-[#F9FAFB] transition-all"
                >
                    Reset Form
                </button>
                <button
                    onClick={handleCreateAccount}
                    className="h-[37px] w-[146px] mt-[20px] bg-[#3F5A54] hover:bg-[#2d4540] text-white rounded-lg text-[14px] font-medium transition-all"
                >
                    Create Account
                </button>
            </div>

        </div>
    );
}

