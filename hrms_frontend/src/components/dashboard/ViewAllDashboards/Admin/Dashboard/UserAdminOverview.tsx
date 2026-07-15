"use client";

import React, { useState } from "react";
import { MoveLeft, User, UserCheck, Crown, UserMinus, Search, Plus, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import EditUserModal from "../../Hrms/Staff/EditUserModal";
import ReplaceWithNewUserModal from "../../Hrms/Staff/ReplaceWithNewUserModal";
import ReplaceWithExistingUserModal from "../../Hrms/Staff/ReplaceWithExistingUserModal";
import CreateAdminModal from "../../Hrms/Staff/CreateAdminModal";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createAdmin, getAdminUsers, selectAdmins, selectAdminLoading, replaceUserRole } from "@/features/newUser/newUserSlice";
import { fetchEmployees, selectEmployees, selectEmployeeLoading } from "@/features/employee/employeeSlice";
import { fetchUsers, selectUsers, selectUsersLoading, updateUser, updateUserStatus, deleteUser } from "@/features/user/userSlice";

interface UserUI {
    id: string;
    userType: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    departmentBg: string;
    departmentText: string;
    role: string;
    roleId?: string;
    reportsTo: string;
    reportsToId?: string;
    reportsToType: string;
    status: string;
    initials: string;
    initialsBg: string;
    initialsText: string;
    employeeCode: string;
    empId: string;
    userId: string;
    userRoleId?: string;
    departments?: any[];
}

export default function AddStaff() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    // Redux state
    const admins = useAppSelector(selectAdmins);
    const employees = useAppSelector(selectEmployees);
    const regularUsers = useAppSelector(selectUsers);
    const isAdminLoading = useAppSelector(selectAdminLoading);
    const isEmployeeLoading = useAppSelector(selectEmployeeLoading);
    const isUsersLoading = useAppSelector(selectUsersLoading);

    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("Regular Users");
    const [openDropdownId, setOpenDropdownId] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
    const [replacingUser, setReplacingUser] = useState<any>(null);
    const [isExistingReplaceModalOpen, setIsExistingReplaceModalOpen] = useState(false);
    const [existingReplacingFromUser, setExistingReplacingFromUser] = useState<any>(null);
    const [isCreateAdminModalOpen, setIsCreateAdminModalOpen] = useState(false);

    // Fetch data on mount
    React.useEffect(() => {
        dispatch(getAdminUsers());
        dispatch(fetchEmployees({}));
        dispatch(fetchUsers(undefined as any));
    }, [dispatch]);

    // Resolve Manager Name (Frontend-Only Helper)
    const resolveReportsTo = (pObj: any) => {
        // Extract and normalize the ID into a string
        const pId = String(pObj?._id || (typeof pObj === 'string' ? pObj : ""));

        if (!pId || pId === "" || pId === "undefined" || pId === "null") return "N/A";

        // 1. Check Backend's pre-populated name first
        if (pObj?.user_id?.name) return pObj.user_id.name;

        // 2. Lookup in Administator list (Check by _id and id)
        const adminMatch = (admins || []).find(a => String(a._id || a.id) === pId);
        if (adminMatch?.name) return adminMatch.name;

        // 3. Lookup in Hierarchy by Role ID
        const hierarchyRoleMatch = (regularUsers || []).find(ru => String(ru._id) === pId);
        if (hierarchyRoleMatch?.user_id?.name) return hierarchyRoleMatch.user_id.name;

        // 4. Lookup in Hierarchy by User ID
        const hierarchyUserMatch = (regularUsers || []).find(ru => String(ru.user_id?._id || ru.user_id) === pId);
        if (hierarchyUserMatch?.user_id?.name) return hierarchyUserMatch.user_id.name;

        // 5. Lookup in Employees by ID
        const empMatch = (employees || []).find(e => {
            const userId = typeof e.user === 'object' ? (e.user as any)?.id || (e.user as any)?._id : e.user;
            return String(e._id || e.id) === pId || String(userId) === pId;
        });
        if (empMatch?.name) return empMatch.name;
        if (empMatch?.personal) return `${empMatch.personal.firstName} ${empMatch.personal.lastName || ''}`;

        return "N/A";
    };

    // Map Backend Admins to UI format
    const formattedAdmins: UserUI[] = (admins || []).map(admin => {
        const userId = admin._id || admin.id;
        // Search if this admin has a role entry to find their manager
        const adminRoleEntry = (regularUsers || []).find(ru => String(ru.user_id?._id || ru.user_id) === String(userId));
        return {
            id: String(userId || Date.now()),
            userType: "Admins",
            name: admin.name,
            email: admin.email,
            phone: (admin as any).phoneNumber || (admin as any).phone || (admin as any).contactNumber || "N/A",
            department: "All",
            departmentBg: "bg-[#FEF3C7]",
            departmentText: "text-[#F59E0B]",
            role: "Admin",
            reportsTo: resolveReportsTo(adminRoleEntry?.parentRoleId),
            reportsToId: String(adminRoleEntry?.parentRoleId?._id || adminRoleEntry?.parentRoleId || ""),
            reportsToType: "text",
            status: admin.isActive === false ? "Inactive" : "Active",
            initials: admin.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2),
            initialsBg: "bg-[#FEF3C7]",
            initialsText: "text-[#F59E0B]",
            employeeCode: userId ? `ADM-${userId.substring(userId.length - 4)}` : "ADM-NEW",
            empId: userId || "",
            userId: userId || ""
        };
    });

    // Map Backend Employees to UI format (Handles both Flattened and Nested API formats)
    const formattedEmployees: UserUI[] = (employees || [])
        .filter(emp => (emp as any).userId || (emp as any).name || (emp as any).email) // Filter out deleted/orphaned employees
        .map(emp => {
            const userIdFromEmp = typeof (emp as any).userId === 'object' ? (emp as any).userId?._id : (emp as any).userId;
            const roleTableId = (emp as any).employment?.userRoleTableId || (emp as any).roleId;

            // Find hierarchy entry for reportsTo lookup
            const entry = (regularUsers || []).find(ru => String(ru._id) === String(roleTableId) || String(ru.user_id?._id || ru.user_id) === String(userIdFromEmp));

            // Universal property extraction
            const name = (emp as any).name || ((emp as any).personal ? `${(emp as any).personal.firstName} ${(emp as any).personal.lastName || ""}` : "Unknown");
            const email = (emp as any).email || (emp as any).personal?.email || "N/A";
            const phone = (emp as any).phone || (emp as any).personal?.phone || (emp as any).personal?.phoneNumber || "N/A";
            const status = ((emp as any).status === "active" || (emp as any).employment?.status === "active") ? "Active" : "Inactive";
            const deptName = (emp as any).department || (emp as any).employment?.departmentId?.name || "General";
            const roleName = (emp as any).role || (emp as any).employment?.userRoleTableId?.roleName || "Staff";

            return {
                id: String(emp._id || Date.now()),
                userType: "Employee",
                name,
                email,
                phone,
                department: String(deptName),
                departmentBg: "bg-[#EBF0FF]",
                departmentText: "text-[#3B82F6]",
                role: String(roleName),
                reportsTo: resolveReportsTo(entry?.parentRoleId),
                reportsToId: String(entry?.parentRoleId?._id || entry?.parentRoleId || ""),
                reportsToType: "text",
                status,
                initials: name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2) || "?",
                initialsBg: "bg-[#EBF0FF]",
                initialsText: "text-[#3B82F6]",
                employeeCode: (emp as any).empCode || (emp as any).employeeCode || (emp as any).empId || (emp._id ? `PS-${String(emp._id).substring(String(emp._id).length - 4)}` : "PS-NEW"),
                empId: emp._id || "",
                userId: userIdFromEmp || ""
            };
        });

    // Map Backend Regular Users to UI format
    const formattedRegularUsers: UserUI[] = (regularUsers || [])
        .filter(entry => entry.user_id && (entry.user_id.name || entry.user_id.email)) // Filter out deleted/orphaned users
        .map(entry => {
            const u = entry.user_id || entry;
            const entryId = entry._id;
            const actualUserId = u._id || entryId;
            return {
                id: String(entryId || Date.now()),
                userType: "Regular Users",
                name: u.name || "Unknown",
                email: u.email || "N/A",
                phone: (u as any).phoneNumber || (u as any).phone || (u as any).contactNumber || "N/A",
                department: entry.departments?.length ? entry.departments.map((d: any) => d.name).join(", ") : "General",
                departmentBg: "bg-[#EBF0FF]",
                departmentText: "text-[#3B82F6]",
                role: entry.roleDefinitionId?.roleName || "User",
                roleId: entry.roleDefinitionId?._id,
                reportsTo: resolveReportsTo(entry.parentRoleId),
                reportsToId: String(entry.parentRoleId?._id || entry.parentRoleId || ""),
                reportsToType: "text",
                status: u.isActive === false ? "Inactive" : "Active",
                initials: (u.name || "?")[0].toUpperCase(),
                initialsBg: "bg-[#EBF0FF]",
                initialsText: "text-[#3B82F6]",
                employeeCode: actualUserId ? `USR-${String(actualUserId).substring(String(actualUserId).length - 4)}` : "USR-NEW",
                empId: String(entryId || ""),
                userId: actualUserId,
                userRoleId: entryId,
                departments: entry.departments || []
            };
        });

    const usersData: UserUI[] = [...formattedAdmins, ...formattedEmployees, ...formattedRegularUsers];

    const syncWithStorage = (updatedList: any[]) => {
        // Since we are now using Redux, we don't need to manually sync with storage for display,
        // but we'll leave this helper for compatibility if other components still use it.
        sessionStorage.setItem("systemUserEntries", JSON.stringify(updatedList));
    };

    const handleEditSave = async (updatedUser: any) => {
        try {
            // Map the flat UI object back to the backend's expected structure
            // We use userId for the actual User document update
            // Ensure parentRoleId is null if empty string to avoid backend CastError
            const parentRoleId = updatedUser.parentRoleId && updatedUser.parentRoleId !== ""
                ? updatedUser.parentRoleId
                : null;

            const payload = {
                id: updatedUser.userId,
                updateUserData: {
                    name: updatedUser.name,
                    email: updatedUser.email,
                    phoneNumber: updatedUser.phone
                },
                updateRollData: {
                    roleDefinitionId: updatedUser.roleId,
                    departments: updatedUser.departments,
                    parentRoleId: parentRoleId
                }
            };

            const resultAction = await dispatch(updateUser(payload));

            if (resultAction.meta.requestStatus === "fulfilled") {
                toast.success("User updated successfully");
                // Refresh lists
                dispatch(fetchUsers(undefined as any));
                dispatch(getAdminUsers());
                dispatch(fetchEmployees({}));
                setIsEditModalOpen(false);
            } else {
                toast.error(typeof resultAction.payload === 'string' ? resultAction.payload : "Failed to update user");
            }
        } catch (error) {
            console.error("Edit User Error:", error);
            toast.error("An unexpected error occurred");
        }
    };

    const handleReplaceSave = (newUser: any) => {
        const newList = usersData.map(u => String(u.id) === String(newUser.id) ? newUser : u);
        syncWithStorage(newList);
        toast.success("User replaced successfully");
    };

    const handleCreateAdminSave = async (adminData: any) => {
        try {
            const payload = {
                name: adminData.name,
                email: adminData.email,
                phoneNumber: adminData.phone,
                password: adminData.password || "12345678"
            };

            await dispatch(createAdmin(payload)).unwrap();
            toast.success("Admin created successfully");
            dispatch(getAdminUsers());
        } catch (error: any) {
            toast.error(error || "Failed to create admin");
        }
    };

    const handleExistingReplaceSave = async (targetUserId: any, replacementUser: any) => {
        try {
            // targetUserId is the .id of the user entry in the UI (UserRoleTable _id or User _id)
            // We need the User document ID (userId) for the old user
            const targetUserUI = (usersData as any).find((u: any) => String(u.id) === String(targetUserId));
            const oldUserId = targetUserUI?.userId;
            const newUserId = replacementUser?.userId;

            if (!oldUserId || !newUserId) {
                toast.error("Could not identify users for replacement");
                return;
            }

            const payload = {
                oldUserId: String(oldUserId),
                newUserId: String(newUserId),
                mode: "replace" as const
            };

            const resultAction = await dispatch(replaceUserRole(payload));

            if (resultAction.meta.requestStatus === "fulfilled") {
                toast.success(`${replacementUser.name || "User"} has replaced the previous user`);
                // Refresh all lists to reflect the change
                dispatch(fetchUsers(undefined as any));
                dispatch(getAdminUsers());
                dispatch(fetchEmployees({}));
                setOpenDropdownId(null);
            } else {
                toast.error(typeof resultAction.payload === 'string' ? resultAction.payload : "Failed to replace user");
            }
        } catch (error) {
            console.error("Replace User Error:", error);
            toast.error("An unexpected error occurred during replacement");
        }
    };

    const handleRemoveUser = async (listId: string, coreUserId: string) => {
        try {
            if (!coreUserId) {
                toast.error("User ID matching error");
                return;
            }
            // Trigger Delete API (DELETE /users/delete/:id)
            await dispatch(deleteUser(coreUserId)).unwrap();

            // Refresh all lists to ensure UI is in sync without manual reload
            dispatch(fetchUsers(undefined as any));
            dispatch(getAdminUsers());
            dispatch(fetchEmployees({}));

            toast.success("User and Role removed successfully");
            setOpenDropdownId(null);
        } catch (error: any) {
            console.error("Delete user error:", error);
            toast.error(error || "Deletion failed");
        }
    };

    const handleDeactivateUser = async (userId: string) => {
        try {
            const resultAction = await dispatch(updateUserStatus({ id: userId, isActive: false }));
            if (resultAction.meta.requestStatus === "fulfilled") {
                toast.warning(`User deactivated successfully`);
                dispatch(fetchUsers(undefined as any));
                dispatch(getAdminUsers());
                dispatch(fetchEmployees({}));
            } else {
                toast.error(typeof resultAction.payload === 'string' ? resultAction.payload : "Deactivation failed");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        }
        setOpenDropdownId(null);
    };

    const handleActivateUser = async (userId: string) => {
        try {
            const resultAction = await dispatch(updateUserStatus({ id: userId, isActive: true }));
            if (resultAction.meta.requestStatus === "fulfilled") {
                toast.success(`User activated successfully`);
                dispatch(fetchUsers(undefined as any));
                dispatch(getAdminUsers());
                dispatch(fetchEmployees({}));
            } else {
                toast.error(typeof resultAction.payload === 'string' ? resultAction.payload : "Activation failed");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        }
        setOpenDropdownId(null);
    };

    const filteredUsers = usersData.filter(u =>
        u.userType === activeTab &&
        (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.phone.includes(searchTerm))
    );

    // Dynamic stats
    const totalUsersCount = usersData.length;
    const activeUsersCount = usersData.filter(u => u.status === "Active").length;
    const adminsCount = usersData.filter(u => u.userType === "Admins").length;
    const regularUsersCount = usersData.filter(u => u.userType === "Regular Users").length;
    const employeeCountTotal = usersData.filter(u => u.userType === "Employee").length;

    return (
        <div className="bg-[#F8FAFC] px-[40px] pt-[24px] font-sans flex flex-col relative w-full min-h-[calc(100vh+200px)] pb-[80px]">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-[10px] text-[#3F5A54] hover:text-black transition-colors w-fit mb-8"
            >
                <MoveLeft className="w-[16px] h-[16px]" />
                <span className="text-[14px] font-medium text-[#4B5563]">Back</span>
            </button>

            {/* User Overview Section */}
            <div>
                <h2 className="text-[20px] font-semibold text-[#1F2937] h-[30px] w-[145px]">User Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-[24px] w-full mt-[24px]">
                    {/* Total Users Card */}
                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col shadow-sm h-[130px]">
                        <div className="w-[32px] h-[32px] bg-[#EBF0FF] rounded-lg flex items-center justify-center mb-4">
                            <User className="w-[16px] h-[16px] text-[#3B82F6]" />
                        </div>
                        <span className="text-[10px] text-[#64748B] font-regular mb-1">Total Users</span>
                        <span className="text-[14px] font-medium text-[#0F172A]">
                            {(() => {
                                const personMap = new Map();
                                (regularUsers || []).forEach(u => {
                                    const ud = u.user_id;
                                    if (ud && (ud.name || ud.email)) {
                                        const key = ud._id || ud.id || ud.email;
                                        if (key) personMap.set(key, true);
                                    }
                                });
                                (admins || []).forEach(a => {
                                    if (a && (a.name || a.email)) {
                                        const key = a._id || a.id || a.email;
                                        if (key) personMap.set(key, true);
                                    }
                                });
                                return personMap.size;
                            })()}
                        </span>
                    </div>

                    {/* Active Users Card */}
                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col shadow-sm h-[130px]">
                        <div className="w-[32px] h-[32px] bg-[#ECFDF5] rounded-lg flex items-center justify-center mb-4">
                            <UserCheck className="w-[16px] h-[16px] text-[#10B981]" />
                        </div>
                        <span className="text-[10px] text-[#64748B] font-regular mb-1">Active Users</span>
                        <span className="text-[14px] font-medium text-[#0F172A]">
                            {(() => {
                                const personMap = new Map();
                                (regularUsers || []).forEach(u => {
                                    const ud = u.user_id;
                                    if (ud && (ud.name || ud.email) && ud.isActive) {
                                        const key = ud._id || ud.id || ud.email;
                                        if (key) personMap.set(key, true);
                                    }
                                });
                                (admins || []).forEach(a => {
                                    if (a && (a.name || a.email) && a.isActive !== false) {
                                        const key = a._id || a.id || a.email;
                                        if (key) personMap.set(key, true);
                                    }
                                });
                                return personMap.size;
                            })()}
                        </span>
                    </div>

                    {/* Admins Card */}
                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col shadow-sm h-[130px]">
                        <div className="w-[32px] h-[32px] bg-[#FEF3C7] rounded-lg flex items-center justify-center mb-4">
                            <Crown className="w-[16px] h-[16px] text-[#F59E0B]" />
                        </div>
                        <span className="text-[10px] text-[#64748B] font-regular mb-1">Admins</span>
                        <span className="text-[14px] font-medium text-[#0F172A]">{adminsCount}</span>
                    </div>

                    {/* Regular Users Card */}
                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col shadow-sm h-[130px]">
                        <div className="w-[32px] h-[32px] bg-[#F3E8FF] rounded-lg flex items-center justify-center mb-4">
                            <UserMinus className="w-[16px] h-[16px] text-[#A855F7]" />
                        </div>
                        <span className="text-[10px] text-[#64748B] font-regular mb-1">Regular Users</span>
                        <span className="text-[14px] font-medium text-[#0F172A]">{regularUsersCount}</span>
                    </div>
                </div>
            </div>

            {/* User Management Section */}
            <div className="w-full flex flex-col">
                <div className="mt-[30px]">
                    <h2 className="text-[20px] font-semibold h-[30px] w-[189px] text-[#1F2937]">User Management</h2>
                    <p className="text-[#9CA3AF] h-[15px] w-[235px] text-[10px]">View and manage all users and administrators</p>
                </div>

                {/* Content Container */}
                <div className="bg-white mt-[24px] border-[1.5px] border-[#E5E7EB] rounded-xl shadow-sm flex flex-col">

                    {/* Top Action Bar */}
                    <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
                        <div className="relative flex-1 h-[44px] max-w-[580px]">
                            <Search className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#9CA3AF]" />
                            <input
                                type="text"
                                placeholder="Search Staff"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-[40px] pl-[36px] pr-[16px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[14px] text-[#1F2937] outline-none"
                            />
                        </div>
                        <button
                            onClick={() => {
                                if (activeTab === "Admins") {
                                    setIsCreateAdminModalOpen(true);
                                } else {
                                    router.push('/dashboard/admin/hrms/newUserForm');
                                }
                            }}
                            className="h-[30px] px-4 bg-[#3F5A54] hover:bg-[#2d4540] text-white rounded-lg flex items-center justify-center gap-2 text-[14px] font-medium transition-all min-w-[100px]"
                        >
                            <Plus className="w-[14px] h-[14px]" />
                            {activeTab === "Admins" ? "Create Admin" : "New User"}
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex px-4 border-b border-[#E5E7EB]">
                        <button
                            onClick={() => setActiveTab("Regular Users")}
                            className={`px-4 py-3 text-[12px] font-medium border-b-2 transition-all ${activeTab === "Regular Users" ? "border-[#3F5A54] text-[#3F5A54]" : "border-transparent text-[#6B7280] hover:text-[#374151]"
                                }`}
                        >
                            Regular Users ({regularUsersCount})
                        </button>
                        <button
                            onClick={() => setActiveTab("Admins")}
                            className={`px-4 py-3 text-[12px] font-medium border-b-2 transition-all ${activeTab === "Admins" ? "border-[#3F5A54] text-[#3F5A54]" : "border-transparent text-[#6B7280] hover:text-[#374151]"
                                }`}
                        >
                            Admins ({adminsCount})
                        </button>
                        {/* <button
                            onClick={() => setActiveTab("Employee")}
                            className={`px-4 py-3 text-[12px] font-medium border-b-2 transition-all ${activeTab === "Employee" ? "border-[#3F5A54] text-[#3F5A54]" : "border-transparent text-[#6B7280] hover:text-[#374151]"
                                }`}
                        >
                            Employee ({employeeCountTotal})
                        </button> */}
                    </div>

                    {/* Table Header */}
                    {activeTab === "Employee" ? (
                        <div className="flex items-center justify-between h-[40px] bg-[#F9FAFB] border-b border-[#E5E7EB] pl-[24px] pr-[96px]">
                            <div className="w-[180px] text-[10px] font-medium text-[#6B7280]">Name</div>
                            <div className="w-[180px] text-[10px] font-medium text-[#6B7280]">Employee Code</div>
                            <div className="w-[100px] text-[10px] font-medium text-[#6B7280]">Role</div>
                            <div className="w-[100px] text-[10px] font-medium text-[#6B7280] flex justify-end">Status</div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between h-[40px] bg-[#F9FAFB] border-b border-[#E5E7EB] pl-[24px] pr-[96px]">
                            <div className="w-[180px] text-[10px] font-medium text-[#6B7280]">Name</div>
                            <div className="w-[200px] text-[10px] font-medium text-[#6B7280]">Email</div>
                            <div className="w-[120px] text-[10px] font-medium text-[#6B7280]">Phone</div>
                            <div className="w-[140px] text-[10px] font-medium text-[#6B7280]">Department(s)</div>
                            <div className="w-[100px] text-[10px] font-medium text-[#6B7280]">Role</div>
                            <div className="w-[140px] text-[10px] font-medium text-[#6B7280]">Reports To</div>
                            <div className="w-[100px] text-[10px] font-medium text-[#6B7280]">Status</div>
                            <div className="w-[70px] text-[10px] font-medium text-[#6B7280] flex justify-center">Actions</div>
                        </div>
                    )}

                    {/* Table Rows */}
                    <div className="flex flex-col">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user, index) => {
                                const isBottomRow = index >= filteredUsers.length - 2 && filteredUsers.length > 2;

                                return (
                                    <div key={user.id} className={`flex items-center justify-between py-[10px] pl-[24px] pr-[96px] ${index !== filteredUsers.length - 1 ? 'border-b border-[#E5E7EB]' : ''}`}>
                                        {activeTab === "Employee" ? (
                                            <>
                                                <div className="w-[180px] text-[10px] font-regular text-[#1F2937] truncate pr-2 flex items-center gap-[10px]">
                                                    <div className={cn(
                                                        "w-[24px] h-[24px] rounded-full flex items-center justify-center font-medium",
                                                        user.initialsBg || "bg-[#EBF0FF]",
                                                        user.initialsText || "text-[#3B82F6]"
                                                    )}>
                                                        {user.initials || user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)}
                                                    </div>
                                                    {user.name}
                                                </div>
                                                <div className="w-[180px] text-[10px] text-[#6B7280] truncate pr-2">
                                                    {user.employeeCode || user.empId || `PS-${1000 + user.id}`}
                                                </div>
                                                <div className="w-[100px]">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#F3F4F6] text-[#4B5563]">
                                                        {user.role || "Staff"}
                                                    </span>
                                                </div>
                                                <div className="w-[100px] flex justify-end">
                                                    <span className={cn(
                                                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium",
                                                        user.status === "Active" ? "bg-[#ECFDF5] text-[#10B981]" : "bg-red-100 text-red-600"
                                                    )}>
                                                        {user.status || "Active"}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-[180px] text-[10px] font-regular text-[#1F2937] truncate pr-2 flex items-center">
                                                    {user.userType === "Admins" && (
                                                        <Crown className="w-[12px] h-[12px] text-[#F59E0B] mr-[6px]" />
                                                    )}
                                                    {user.name}
                                                </div>
                                                <div className="w-[200px] text-[10px] text-[#6B7280] truncate pr-2">{user.email}</div>
                                                <div className="w-[120px] text-[10px] text-[#6B7280] truncate pr-2">{user.phone}</div>
                                                <div className="w-[140px]">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${user.departmentBg} ${user.departmentText}`}>
                                                        {user.department}
                                                    </span>
                                                </div>
                                                <div className="w-[100px]">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#F3F4F6] text-[#4B5563]">
                                                        {user.role}
                                                    </span>
                                                </div>
                                                <div className="w-[140px] text-[10px] truncate pr-2">
                                                    {user.reportsToType === 'link' ? (
                                                        <span className="text-[#3B82F6] font-medium cursor-pointer hover:underline">{user.reportsTo}</span>
                                                    ) : (
                                                        <span className="text-[#1F2937] font-medium">{user.reportsTo}</span>
                                                    )}
                                                </div>
                                                <div className="w-[100px]">
                                                    <span className={cn(
                                                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium",
                                                        user.status === "Active" ? "bg-[#ECFDF5] text-[#10B981]" : "bg-red-100 text-red-600"
                                                    )}>
                                                        {user.status}
                                                    </span>
                                                </div>
                                                <div className="w-[70px] flex items-center justify-center relative">
                                                    <button
                                                        onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}
                                                        className="text-[#9CA3AF] hover:text-[#1F2937] transition-colors rounded-full p-1 hover:bg-[#F3F4F6]"
                                                    >
                                                        <MoreVertical className="w-[16px] h-[16px]" />
                                                    </button>

                                                    {openDropdownId === user.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />
                                                            <div className={cn(
                                                                "absolute right-[-20px] bg-white rounded-[12px] shadow-[0px_4px_24px_rgba(0,0,0,0.08)] border border-[#E5E7EB] z-50 py-[8px] flex flex-col transition-all",
                                                                isBottomRow ? 'bottom-[32px]' : 'top-[32px]',
                                                                user.status === "Active" ? "w-[205px]" : "w-[140px]"
                                                            )}>
                                                                {user.status === "Active" ? (
                                                                    <>
                                                                        <button
                                                                            onClick={() => { setEditingUser(user); setIsEditModalOpen(true); setOpenDropdownId(null); }}
                                                                            className="w-full text-left px-5 py-2.5 text-[11px] font-medium text-[#10B981] hover:bg-[#F9FAFB] transition-colors duration-200"
                                                                        >
                                                                            Edit User
                                                                        </button>

                                                                        {/* <button
                                                                            onClick={() => { router.push('/dashboard/admin/hrms/createEmployee'); }}
                                                                            className="w-full text-left px-5 py-2.5 text-[11px] font-medium text-[#3B82F6] hover:bg-[#F9FAFB] transition-colors duration-200">
                                                                            Create Employee
                                                                        </button> */}

                                                                        <button
                                                                            onClick={() => { setReplacingUser(user); setIsReplaceModalOpen(true); setOpenDropdownId(null); }}
                                                                            className="w-full text-left px-5 py-2.5 text-[11px] font-medium text-[#4B5563] hover:bg-[#F9FAFB] transition-colors duration-200"
                                                                        >
                                                                            Replace with New User
                                                                        </button>

                                                                        <button
                                                                            onClick={() => { setExistingReplacingFromUser(user); setIsExistingReplaceModalOpen(true); setOpenDropdownId(null); }}
                                                                            className="w-full text-left px-5 py-2.5 text-[11px] font-medium text-[#4B5563] hover:bg-[#F9FAFB] transition-colors duration-200"
                                                                        >
                                                                            Replace with Existing User
                                                                        </button>

                                                                        <button
                                                                            onClick={() => (handleRemoveUser as any)(user.id, user.userId)}
                                                                            className="w-full text-left px-5 py-2.5 text-[11px] font-medium text-[#EF4444] hover:bg-[#F9FAFB] transition-colors duration-200"
                                                                        >
                                                                            Remove from Role
                                                                        </button>

                                                                        <button
                                                                            onClick={() => handleDeactivateUser(user.userId)}
                                                                            className="w-full text-left px-5 py-2.5 text-[11px] font-medium text-[#4B5563] hover:bg-[#F9FAFB] transition-colors duration-200"
                                                                        >
                                                                            Deactivate
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleActivateUser(user.userId)}
                                                                        className="w-full text-left px-5 py-2.5 text-[11px] font-medium text-[#10B981] hover:bg-[#F9FAFB] transition-colors duration-200"
                                                                    >
                                                                        Activate User
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="h-[100px] flex items-center justify-center text-[#9CA3AF] text-[10px]">
                                No staff found matching your search.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit User Modal rendering layer */}
            {isEditModalOpen && (
                <EditUserModal
                    isOpen={isEditModalOpen}
                    user={editingUser}
                    onClose={() => { setIsEditModalOpen(false); setEditingUser(null); }}
                    onSave={handleEditSave}
                />
            )}
            {/* Replace User Modal rendering layer */}
            {isReplaceModalOpen && (
                <ReplaceWithNewUserModal
                    isOpen={isReplaceModalOpen}
                    user={replacingUser}
                    onClose={() => { setIsReplaceModalOpen(false); setReplacingUser(null); }}
                    onReplace={handleReplaceSave}
                />
            )}
            {/* Replace with Existing User Modal rendering layer */}
            {isExistingReplaceModalOpen && (
                <ReplaceWithExistingUserModal
                    isOpen={isExistingReplaceModalOpen}
                    user={existingReplacingFromUser}
                    allUsers={usersData}
                    onClose={() => { setIsExistingReplaceModalOpen(false); setExistingReplacingFromUser(null); }}
                    onReplace={(targetUserId: any, replacementUser: any) => handleExistingReplaceSave(targetUserId, replacementUser)}
                />
            )}
            {/* Create Admin Modal rendering layer */}
            {isCreateAdminModalOpen && (
                <CreateAdminModal
                    isOpen={isCreateAdminModalOpen}
                    onClose={() => setIsCreateAdminModalOpen(false)}
                    onCreate={handleCreateAdminSave}
                />
            )}
        </div>
    );
}

