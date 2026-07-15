import React, { useState, useEffect } from "react";
import { X, Search, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getAllRoles, selectRoles, getAdmin, selectAdmins } from "@/features/role/roleSlice";
import { fetchDepartments, selectDepartments } from "@/features/departments/departmentSlice";
import { fetchUsers } from "@/features/user/userSlice";

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    onSave: (updatedUser: any) => void;
}


export default function EditUserModal({ isOpen, onClose, user, onSave }: EditUserModalProps) {
    const dispatch = useAppDispatch();
    const roles = useAppSelector(selectRoles);
    const departments = useAppSelector(selectDepartments);
    const admins = useAppSelector(selectAdmins);

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [contact, setContact] = useState("");
    const [roleId, setRoleId] = useState("");
    const [roleLabel, setRoleLabel] = useState("");
    const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
    const [parentRoleId, setParentRoleId] = useState("");
    const [parentRoleName, setParentRoleName] = useState("");
    const [searchReportsTo, setSearchReportsTo] = useState("");

    const [isRoleOpen, setIsRoleOpen] = useState(false);
    const [isDeptOpen, setIsDeptOpen] = useState(false);
    const [isReportsToOpen, setIsReportsToOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            dispatch(getAllRoles());
            dispatch(fetchDepartments({}));
            dispatch(getAdmin());
            dispatch(fetchUsers());
        }
    }, [isOpen, dispatch]);

    // Combine Hierarchy Users and Standalone Admins into a single staff pool for Reports To
    const usersList = (useAppSelector((state) => state.users.users) || []);

    // 1. Get those who have roles (from Hierarchy)
    const hierarchyPool = usersList
        .filter(entry => entry._id !== (user.userRoleId || user.id)) // Self check
        .map(entry => ({
            id: entry._id, // UserRoleTable ID
            name: entry.user_id?.name || "Unknown",
            userType: entry.user_id?.is_superuser || entry.user_id?.is_organizer ? "Admin" : "User"
        }));

    // 2. Get Standalone Admins (who might not have a role yet)
    const adminPool = (admins || [])
        .filter(admin => !usersList.some(u => u.user_id?._id === admin._id)) // Filter duplicates (if already in hierarchy)
        .filter(admin => admin._id !== user.userId) // Self check
        .map(admin => ({
            id: admin._id, // User ID (fallback)
            name: admin.name,
            userType: "Admin"
        }));

    const staffPool = [...hierarchyPool, ...adminPool];

    useEffect(() => {
        if (user && isOpen) {
            setFullName(user.name || "");
            setEmail(user.email || "");
            setContact(user.phone || "");

            // Try to match the role and dept from Incoming user data
            // Incoming user data from AddStaff mapping has names/labels usually
            const matchedRole = roles.find(r => r.roleName === user.role || r._id === user.role);
            if (matchedRole) {
                setRoleId(matchedRole._id || "");
                setRoleLabel(matchedRole.roleName || "");
            } else {
                setRoleLabel(user.role || "");
            }

            // For departments, we might have an array of IDs or names
            if (Array.isArray(user.departments)) {
                setSelectedDeptIds(user.departments.map((d: any) => d._id || d));
            } else if (typeof user.department === "string") {
                const names = user.department.split(", ");
                const matchedDepts = departments.filter(d => names.includes(d.name));
                setSelectedDeptIds(matchedDepts.map(d => d._id));
            }

            setParentRoleName(user.reportsTo || "");
            setParentRoleId(user.reportsToId || "");
        }
    }, [user, isOpen, roles, departments, admins]);

    if (!isOpen) return null;

    const toggleDept = (deptId: string) => {
        setSelectedDeptIds(prev =>
            prev.includes(deptId)
                ? prev.filter(d => d !== deptId)
                : [...prev, deptId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedDeptIds.length === (departments || []).length) {
            setSelectedDeptIds([]);
        } else {
            setSelectedDeptIds((departments || []).map(d => d._id));
        }
    };

    const getInitials = (name: string) => {
        return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    };

    const handleSave = () => {
        onSave({
            ...user,
            name: fullName,
            email: email,
            phone: contact,
            role: roleLabel, // legacy compatibility for display
            roleId: roleId,
            departments: selectedDeptIds,
            parentRoleId: parentRoleId,
            reportsTo: parentRoleName
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-[837px] h-auto flex flex-col relative overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between p-[24px] border-b border-[#F3F4F6]">
                    <div>
                        <h2 className="text-[18px] font-bold text-[#111827]">Edit User Details</h2>
                        <p className="text-[11px] text-[#6B7280] mt-0.5 font-medium tracking-tight">Update user profile and role assignments.</p>
                    </div>
                    <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#111827] transition-colors p-1">
                        <X className="w-[20px] h-[20px]" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="p-[24px] flex flex-col gap-[24px] overflow-y-auto max-h-[75vh]">

                    {/* User Information */}
                    <div>
                        <h3 className="text-[14px] font-bold text-[#111827] mb-[16px]">User Information</h3>
                        <div className="grid grid-cols-3 gap-[20px]">
                            <div className="flex flex-col gap-[8px]">
                                <label className="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">Full Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Enter Name"
                                    className="w-full h-[40px] border border-[#E5E7EB] rounded-lg px-[12px] text-[13px] text-[#111827] outline-none focus:border-[#3B82F6] placeholder:text-[#9CA3AF] bg-white transition-all focus:ring-4 focus:ring-blue-50"
                                />
                            </div>
                            <div className="flex flex-col gap-[8px]">
                                <label className="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">Email Address <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@mail.com"
                                    className="w-full h-[40px] border border-[#E5E7EB] rounded-lg px-[12px] text-[13px] text-[#111827] outline-none focus:border-[#3B82F6] placeholder:text-[#9CA3AF] bg-white transition-all focus:ring-4 focus:ring-blue-50"
                                />
                            </div>
                            <div className="flex flex-col gap-[8px]">
                                <label className="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">Contact Number <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    placeholder="Enter Number"
                                    className="w-full h-[40px] border border-[#E5E7EB] rounded-lg px-[12px] text-[13px] text-[#111827] outline-none focus:border-[#3B82F6] placeholder:text-[#9CA3AF] bg-white transition-all focus:ring-4 focus:ring-blue-50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Role & Hierarchy Assignment */}
                    <div className="border-t border-[#F3F4F6] pt-[24px]">
                        <h3 className="text-[14px] font-bold text-[#111827] mb-[16px]">Role & Hierarchy Assignment</h3>
                        <div className="flex items-center gap-[20px]">

                            {/* Role Dropdown */}
                            <div className="flex flex-col gap-[8px] flex-1 relative">
                                <label className="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">Role <span className="text-red-500">*</span></label>
                                <div
                                    onClick={() => setIsRoleOpen(!isRoleOpen)}
                                    className="w-full h-[40px] border border-[#E5E7EB] rounded-lg px-[12px] flex items-center justify-between cursor-pointer hover:border-[#3B82F6] bg-white transition-all"
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {roleLabel && (
                                            <span className="shrink-0 w-[20px] h-[20px] bg-[#EBF0FF] text-[#3B82F6] text-[9px] font-bold rounded flex items-center justify-center">
                                                L{roles.findIndex(opt => opt.roleName === roleLabel) + 1 || "L"}
                                            </span>
                                        )}
                                        <span className="text-[13px] text-[#111827] truncate font-medium">
                                            {roleLabel || "Select role from hierarchy"}
                                        </span>
                                    </div>
                                    <ChevronDown className={cn("w-[16px] h-[16px] text-[#9CA3AF] transition-transform", isRoleOpen && "rotate-180")} />
                                </div>

                                {isRoleOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsRoleOpen(false)} />
                                        <div className="absolute top-[72px] left-0 w-full bg-white border border-[#E5E7EB] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] z-20 py-2 overflow-hidden">
                                            <div className="max-h-[200px] overflow-y-auto px-1">
                                                {roles.map((r, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => { setRoleId(r._id || ""); setRoleLabel(r.roleName || ""); setIsRoleOpen(false); }}
                                                        className="px-[12px] py-[10px] flex items-center gap-3 text-[13px] text-[#374151] hover:bg-[#F9FAFB] cursor-pointer transition-colors rounded-lg group"
                                                    >
                                                        <span className="w-[24px] h-[24px] bg-[#EBF0FF] text-[#3B82F6] text-[10px] font-bold rounded flex items-center justify-center transition-transform group-hover:scale-110">
                                                            L{idx + 1}
                                                        </span>
                                                        <span className="font-medium group-hover:text-[#111827]">{r.roleName}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Department Dropdown */}
                            <div className="flex flex-col gap-[8px] flex-[1.5] relative">
                                <label className="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">Departments <span className="text-red-500">*</span></label>
                                <div
                                    onClick={() => setIsDeptOpen(!isDeptOpen)}
                                    className="w-full h-[40px] border border-[#E5E7EB] rounded-lg px-[12px] flex items-center justify-between cursor-pointer hover:border-[#3B82F6] bg-white transition-all"
                                >
                                    <span className="text-[13px] text-[#111827] truncate font-medium">
                                        {selectedDeptIds.length > 0
                                            ? departments.filter(d => selectedDeptIds.includes(d._id)).map(d => d.name).join(", ")
                                            : "Select departments..."}
                                    </span>
                                    <ChevronDown className={cn("w-[16px] h-[16px] text-[#9CA3AF] transition-transform", isDeptOpen && "rotate-180")} />
                                </div>

                                {isDeptOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsDeptOpen(false)} />
                                        <div className="absolute top-[72px] left-0 w-full bg-white border border-[#E5E7EB] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] z-20 py-2 overflow-hidden">
                                            <div className="max-h-[280px] overflow-y-auto px-1">
                                                {/* Select All */}
                                                <div
                                                    onClick={toggleSelectAll}
                                                    className="px-[12px] py-[10px] flex items-center gap-3 text-[13px] hover:bg-[#F9FAFB] cursor-pointer rounded-lg group"
                                                >
                                                    <div className={cn(
                                                        "w-[18px] h-[18px] border-2 rounded transition-all flex items-center justify-center",
                                                        selectedDeptIds.length === (departments || []).length ? "bg-[#3B82F6] border-[#3B82F6]" : "border-[#E5E7EB]"
                                                    )}>
                                                        {selectedDeptIds.length === (departments || []).length && <Check className="w-[12px] h-[12px] text-white stroke-[3px]" />}
                                                    </div>
                                                    <span className="font-bold text-[#111827]">Select All</span>
                                                </div>

                                                {departments.map(d => (
                                                    <div
                                                        key={d._id}
                                                        onClick={() => toggleDept(d._id)}
                                                        className="px-[12px] py-[10px] flex items-center gap-3 text-[13px] text-[#4B5563] hover:bg-[#F9FAFB] cursor-pointer rounded-lg group transition-colors"
                                                    >
                                                        <div className={cn(
                                                            "w-[18px] h-[18px] border-2 rounded transition-all flex items-center justify-center",
                                                            selectedDeptIds.includes(d._id) ? "bg-[#3B82F6] border-[#3B82F6]" : "border-[#E5E7EB]"
                                                        )}>
                                                            {selectedDeptIds.includes(d._id) && <Check className="w-[12px] h-[12px] text-white stroke-[3px]" />}
                                                        </div>
                                                        <span className="font-medium group-hover:text-[#111827]">
                                                            {d.name} ({d.alias})
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Reports To Section */}
                    <div className="border-t border-[#F3F4F6] pt-[24px]">
                        <h3 className="text-[14px] font-bold text-[#111827] mb-[16px]">Reports To (Parent Role) - Search Users</h3>

                        {/* Selected Manager Box */}
                        {parentRoleName && (
                            <div className="w-full h-[56px] bg-[#E8FFF0] border border-[#86EFAC] rounded-xl flex items-center justify-between px-[16px] mb-[16px] transition-all animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-[12px]">
                                    <div className="w-[34px] h-[34px] rounded-full bg-[#10B981] text-white flex items-center justify-center text-[12px] font-bold shadow-sm">
                                        {getInitials(parentRoleName)}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[14px] font-bold text-[#111827]">{parentRoleName}</span>
                                        <span className="text-[10px] font-bold text-[#10B981] bg-[#DCFCE7] px-2.5 py-1 rounded-full uppercase tracking-wider">Manager</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setParentRoleName(""); setParentRoleId(""); }}
                                    className="p-1.5 hover:bg-white/50 rounded-full transition-colors group"
                                >
                                    <X className="w-[18px] h-[18px] text-[#10B981] group-hover:text-red-500 transition-colors stroke-[2.5px]" />
                                </button>
                            </div>
                        )}

                        {/* Search Input */}
                        <div className="relative group">
                            <Search className="absolute left-[16px] top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#9CA3AF] group-focus-within:text-[#3B82F6] transition-colors" />
                            <input
                                type="text"
                                placeholder="Search Staff"
                                className="w-full h-[48px] pl-[48px] pr-[16px] bg-[#F9FAFB] border-none rounded-xl text-[14px] text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:ring-1 focus:ring-[#E5E7EB] transition-all"
                                value={searchReportsTo}
                                onChange={(e) => {
                                    setSearchReportsTo(e.target.value);
                                    setIsReportsToOpen(true);
                                }}
                                onFocus={() => setIsReportsToOpen(true)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && searchReportsTo) {
                                        setParentRoleName(searchReportsTo);
                                        setSearchReportsTo("");
                                        setIsReportsToOpen(false);
                                    }
                                }}
                            />
                            {isReportsToOpen && searchReportsTo.length > 0 && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsReportsToOpen(false)} />
                                    <div className="absolute top-[52px] left-0 w-full bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-20 py-2 max-h-[200px] overflow-y-auto mt-1">
                                        {staffPool.filter(s => s.name.toLowerCase().includes(searchReportsTo.toLowerCase())).length > 0 ? (
                                            staffPool.filter(s => s.name.toLowerCase().includes(searchReportsTo.toLowerCase())).map((staff, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        setParentRoleName(staff.name || "");
                                                        setParentRoleId(staff.id || "");
                                                        setSearchReportsTo("");
                                                        setIsReportsToOpen(false);
                                                    }}
                                                    className="px-4 py-2.5 hover:bg-[#F9FAFB] cursor-pointer flex items-center justify-between group transition-colors"
                                                >
                                                    <span className="text-[13px] text-[#4B5563] font-medium group-hover:text-[#111827]">{staff.name}</span>
                                                    <span className="text-[10px] text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                                                        {staff.userType === "Admin" ? "Admin" : "User"}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-2 text-[13px] text-[#9CA3AF]">No staff found</div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        <p className="text-[11px] text-[#9CA3AF] mt-2 font-medium italic">Search and select a user who will be the parent role (manager) for this user.</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-[24px] border-t border-[#F3F4F6] flex justify-end gap-[16px] bg-white">
                    <button
                        onClick={onClose}
                        className="px-[40px] py-[10px] rounded-lg border border-[#E5E7EB] text-[14px] font-bold text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827] transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-[40px] py-[10px] rounded-lg bg-[#3F5A54] text-white text-[14px] font-bold hover:bg-[#2F443F] shadow-lg shadow-emerald-900/10 transition-all hover:-translate-y-0.5"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
