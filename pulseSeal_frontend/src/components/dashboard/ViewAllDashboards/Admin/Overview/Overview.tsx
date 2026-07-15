"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Users,
  UserCheck,
  UserCog,
  User,
  Edit,
  Loader2,
  UserX,
  LogOut,
  UserMinus,
  Settings,
  ChevronDown,
  UserPlus,
  X,
  Building2,
  Eye,
  Plus,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchUsers,
  updateUserStatus,
  clearUserError,
  updateUserInState,
} from "@/features/user/userSlice";
import { fetchDepartments } from "@/features/departments/departmentSlice";
import {
  getAllRoles,
  replaceUserRole,
  selectRoles,
  selectReplaceUserLoading,
  selectNewUserReplaceLoading,
} from "@/features/role/roleSlice";
import {
  fetchEmployees,
  selectEmployees,
} from "@/features/employee/employeeSlice";
import { getAdminUsers } from "@/features/newUser/newUserSlice";
import EditUserModal from "./EditUserModal";
import EmployeeModal from "./EmployeeModel";

export default function UserOverviewPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  // Tab state
  const [activeTab, setActiveTab] = useState("regular");
  
  // State management with proper initialization
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Role management state
  const [roleActionUserId, setRoleActionUserId] = useState<string | null>(null);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [selectedUserForReplace, setSelectedUserForReplace] = useState<any>(null);
  const [replacementUserId, setReplacementUserId] = useState<string>("");

  // New User Replacement state
  const [showNewUserReplaceModal, setShowNewUserReplaceModal] = useState(false);
  const [selectedUserForNewUserReplace, setSelectedUserForNewUserReplace] = useState<any>(null);
  const [newUserReplaceForm, setNewUserReplaceForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    departmentId: [] as string[]
  });
  const [newUserDepartmentPopoverOpen, setNewUserDepartmentPopoverOpen] = useState(false);

  // Employee Modal State
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employeeModalMode, setEmployeeModalMode] = useState<'create' | 'view' | 'edit'>('create');
  const [selectedUserForEmployee, setSelectedUserForEmployee] = useState<any>(null);

  // Redux selectors
  const { users, loading, error } = useAppSelector((state) => state.users);
  const { admins, loading: adminsLoading } = useAppSelector((state) => state.newUser);
  const isOrganizer = useAppSelector((state) => state.auth.isOrganizer);
  const isSuperUser = useAppSelector((state) => state.auth.isSuperUser);
  const userRole = useAppSelector((state) => state.auth.role);
  const orgPermissions = useAppSelector((state) => state.auth.orgPermissions);
  const hrmsPermissions = useAppSelector((state) => state.auth.hrmsPermissions);
  const { departments } = useAppSelector((state) => state.departments);
  const roles = useAppSelector(selectRoles);
  const roleUpdateLoading = useAppSelector(selectReplaceUserLoading);
  const newUserReplaceLoading = useAppSelector(selectNewUserReplaceLoading);
  const employees = useAppSelector(selectEmployees);

  // 🔥 CRITICAL FIX: Simplified HRMS check - only check if HRMS is enabled
  const isHRMSEnabled = orgPermissions?.isHRMS_enabled || false;
  
  // 🔥 CRITICAL FIX: Employee management should be visible whenever HRMS is enabled
  // Remove complex permission checks that were restricting visibility
  const canCreateEmployee = isHRMSEnabled;

  // 🔥 CRITICAL FIX: Global body scroll restoration for ALL modals
  useEffect(() => {
    const restoreBodyScroll = () => {
      const anyModalOpen = showEmployeeModal || showNewUserReplaceModal || showReplaceModal || isEditModalOpen;
      
      if (!anyModalOpen) {
        // Force restore scroll with multiple approaches
        setTimeout(() => {
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
          document.body.style.pointerEvents = '';
          document.body.removeAttribute('data-scroll-locked');
          
          // Also check for radix-ui specific attributes
          document.body.removeAttribute('data-radix-scroll-locked');
          document.body.style.removeProperty('--removed-body-scroll-bar-size');
        }, 150);
      }
    };

    restoreBodyScroll();
  }, [showEmployeeModal, showNewUserReplaceModal, showReplaceModal, isEditModalOpen]);

  // 🔥 CRITICAL FIX: Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');
      document.body.removeAttribute('data-radix-scroll-locked');
    };
  }, []);

  // Initial data fetching
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await Promise.all([
          dispatch(fetchUsers()),
          dispatch(fetchDepartments({})),
          dispatch(getAllRoles()),
          dispatch(getAdminUsers())
        ]);
        
        if (isHRMSEnabled) {
          await dispatch(fetchEmployees({}));
        }
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };

    fetchInitialData();
  }, [dispatch, isHRMSEnabled]);

  useEffect(() => {
    if (isHRMSEnabled && employees.length === 0) {
      dispatch(fetchEmployees({}));
    }
  }, [isHRMSEnabled, dispatch, employees.length]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearUserError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearUserError());
    };
  }, [dispatch]);

  // Combine users and admins into separate lists with proper structure
  const combinedUsersList = useMemo(() => {
    const regularUsers = users.map(user => ({
      ...user,
      userType: 'regular',
      displayName: user.user_id?.name || 'N/A',
      displayEmail: user.user_id?.email || 'N/A',
      displayPhone: user.user_id?.phoneNumber || 'N/A',
      isActive: user.user_id?.isActive !== false && user.status === 'active'
    }));
    
    const adminUsers = admins.map(admin => ({
      _id: admin._id,
      user_id: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        phoneNumber: admin.phoneNumber || 'N/A',
        isActive: admin.isActive !== false
      },
      userType: 'admin',
      displayName: admin.name,
      displayEmail: admin.email,
      displayPhone: admin.phoneNumber || 'N/A',
      isActive: admin.isActive !== false,
      status: admin.isActive !== false ? 'active' : 'inactive',
      roleDefinitionId: {
        roleName: 'ADMIN',
        hierarchyLevel: 0
      },
      departments: [],
      parentRoleId: null
    }));
    
    return { regularUsers, adminUsers, allUsers: [...regularUsers, ...adminUsers] };
  }, [users, admins]);

  // Memoized helper functions
  const getCreateRoute = useCallback(() => {
    if (isOrganizer || userRole?.toLowerCase() === "admin") {
      return "/dashboard/admin/user_overview/create";
    } else {
      return "/dashboard/dynamic/user_overview/create";
    }
  }, [isOrganizer, userRole]);

  const hasEmployeeProfile = useCallback((userId: string) => {
    return employees.some((employee: any) => 
      employee.userId === userId || employee.userId?._id === userId
    );
  }, [employees]);

  // Employee Modal Functions with FIX
  const openCreateEmployeeModal = useCallback((user: any) => {
    // Allow employee creation for both admin and regular users
    const userWithExistingRole = {
      ...user,
      isExistingUser: true,
      existingRoleDefinitionId: user.roleDefinitionId?._id || null,
      existingRoleName: user.roleDefinitionId?.roleName || "Unknown Role"
    };
    setSelectedUserForEmployee(userWithExistingRole);
    setEmployeeModalMode('create');
    setShowEmployeeModal(true);
  }, []);

  const openViewEmployeeModal = useCallback((user: any) => {
    setSelectedUserForEmployee(user);
    setEmployeeModalMode('view');
    setShowEmployeeModal(true);
  }, []);

  const openEditEmployeeModal = useCallback((user: any) => {
    setSelectedUserForEmployee(user);
    setEmployeeModalMode('edit');
    setShowEmployeeModal(true);
  }, []);

  // 🔥 CRITICAL FIX: Enhanced close handler with forced scroll restoration
  const closeEmployeeModal = useCallback(() => {
    setShowEmployeeModal(false);
    setSelectedUserForEmployee(null);
    setEmployeeModalMode('create');
    
    // Force restore scroll immediately
    setTimeout(() => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');
      document.body.removeAttribute('data-radix-scroll-locked');
    }, 100);
  }, []);

  const handleEmployeeSave = useCallback(() => {
    dispatch(fetchUsers());
    if (isHRMSEnabled) {
      dispatch(fetchEmployees({}));
    }
  }, [dispatch, isHRMSEnabled]);

  // Metrics calculation
  const metrics = useMemo(
    () => ({
      total: combinedUsersList.allUsers.length,
      active: combinedUsersList.allUsers.filter(u => u.isActive).length,
      managers: combinedUsersList.allUsers.filter(
        (u: any) =>
          u.roleDefinitionId?.roleName === "MANAGER" ||
          u.roleDefinitionId?.roleName === "TL" ||
          (u.roleDefinitionId?.hierarchyLevel && u.roleDefinitionId.hierarchyLevel <= 3)
      ).length,
      members: combinedUsersList.allUsers.filter(
        (u: any) =>
          u.roleDefinitionId?.roleName === "Associate" ||
          (u.roleDefinitionId?.hierarchyLevel && u.roleDefinitionId.hierarchyLevel > 3)
      ).length,
      admins: combinedUsersList.adminUsers.length,
      regularUsers: combinedUsersList.regularUsers.length,
    }),
    [combinedUsersList]
  );

  // Filtering with tab support
  const getFilteredUsers = useCallback((userList: any[]) => {
    return userList.filter((user: any) => {
      const name = user.displayName || "";
      const email = user.displayEmail || "";
      return (
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [searchTerm]);

  const filteredRegularUsers = useMemo(() => getFilteredUsers(combinedUsersList.regularUsers), [getFilteredUsers, combinedUsersList.regularUsers]);
  const filteredAdminUsers = useMemo(() => getFilteredUsers(combinedUsersList.adminUsers), [getFilteredUsers, combinedUsersList.adminUsers]);
  const filteredAllUsers = useMemo(() => getFilteredUsers(combinedUsersList.allUsers), [getFilteredUsers, combinedUsersList.allUsers]);

  const getDepartmentNames = useCallback((user: any) => {
    if (user.userType === 'admin') {
      return [{ name: 'All Departments', alias: 'ALL' }];
    }
    
    let userDepartments = [];

    if (user.departments && user.departments.length > 0) {
      userDepartments = user.departments;
    }
    else if (
      user.user_id?.departmentId &&
      user.user_id.departmentId.length > 0 &&
      departments.length > 0
    ) {
      userDepartments = user.user_id.departmentId
        .map((deptId: string) => {
          const department = departments.find((dept: any) => dept._id === deptId);
          return department
            ? { name: department.name, alias: department.alias }
            : null;
        })
        .filter(Boolean);
    }

    return userDepartments;
  }, [departments]);

  const getReportingManager = useCallback((user: any) => {
    if (user.userType === 'admin') {
      return "N/A";
    }
    
    if (user.parentRoleId?.user_id?.name) {
      return user.parentRoleId.user_id.name;
    }
    
    if (admins && admins.length > 0) {
      if (admins.length === 1) {
        return (
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200">
              Admin
            </Badge>
            <span className="text-xs">{admins[0].name}</span>
          </div>
        );
      } else {
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-800 text-xs">
                View Admins ({admins.length})
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Organization Admins</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {admins.map((admin) => (
                    <div key={admin._id} className="flex items-center justify-between p-1 hover:bg-muted rounded">
                      <span className="text-sm">{admin.name}</span>
                      <span className="text-xs text-muted-foreground truncate ml-2">{admin.email}</span>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        );
      }
    }
    
    return "N/A";
  }, [admins]);

  const getRoleName = useCallback((user: any) => {
    if (user.userType === 'admin') {
      return 'ADMIN';
    }
    return user.roleDefinitionId?.roleName || "Member";
  }, []);

  const getStatusColor = useCallback((isActive: boolean) => {
    return isActive
      ? "bg-green-500/20 text-green-600 dark:bg-green-500/30 dark:text-green-400 border-green-500/50"
      : "bg-red-500/20 text-red-600 dark:bg-red-500/30 dark:text-red-400 border-red-500/50";
  }, []);

  const isUserActive = useCallback((user: any) => {
    return user.isActive;
  }, []);

  const handleEditUser = useCallback((user: any) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  }, []);

  const handleToggleActive = useCallback(async (user: any) => {
    if (!user?.user_id?._id) return;

    const userId = user.user_id._id;
    const currentStatus = isUserActive(user);
    const newStatus = !currentStatus;

    setUpdatingUserId(userId);

    try {
      if (user.userType === 'admin') {
        toast.info("Admin status toggle functionality will be implemented based on your admin API");
        dispatch(getAdminUsers());
        return;
      }

      await dispatch(
        updateUserStatus({
          id: userId,
          isActive: newStatus,
        })
      ).unwrap();

      toast.success(
        `User ${currentStatus ? "deactivated" : "activated"} successfully`
      );
      dispatch(fetchUsers());
    } catch (error: any) {
      dispatch(
        updateUserInState({
          id: userId,
          updates: { status: currentStatus ? "active" : "inactive" },
        })
      );
      toast.error(error || "Failed to update user status");
    } finally {
      setUpdatingUserId(null);
    }
  }, [dispatch, isUserActive]);

  // 🔥 CRITICAL FIX: Enhanced save/close handlers
  const handleSaveUser = useCallback((updatedUser: any) => {
    setEditingUser(null);
    setIsEditModalOpen(false);
    dispatch(fetchUsers());
    dispatch(getAdminUsers());
    
    setTimeout(() => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.body.style.pointerEvents = '';
    }, 100);
  }, [dispatch]);

  const handleCloseModal = useCallback(() => {
    setEditingUser(null);
    setIsEditModalOpen(false);
    
    setTimeout(() => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.body.style.pointerEvents = '';
    }, 100);
  }, []);

  // Role management functions with FIX
  const handleReplaceUser = useCallback(async () => {
    if (!selectedUserForReplace?.user_id?._id || !replacementUserId) return;

    if (selectedUserForReplace.userType === 'admin') {
      toast.error("Admin users cannot be replaced");
      return;
    }

    setRoleActionUserId(selectedUserForReplace.user_id._id);

    try {
      await dispatch(
        replaceUserRole({
          oldUserId: selectedUserForReplace.user_id._id,
          newUserId: replacementUserId,
          mode: "replace",
        })
      ).unwrap();

      toast.success("User replaced successfully!");
      dispatch(fetchUsers());
      setShowReplaceModal(false);
      setSelectedUserForReplace(null);
      setReplacementUserId("");
      
      setTimeout(() => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }, 100);
    } catch (error: any) {
      toast.error(error || "Failed to replace user");
    } finally {
      setRoleActionUserId(null);
    }
  }, [dispatch, selectedUserForReplace, replacementUserId]);

  const handleNewUserReplaceInputChange = useCallback((field: string, value: string | string[]) => {
    setNewUserReplaceForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleNewUserReplaceDepartmentToggle = useCallback((departmentId: string, checked: boolean) => {
    setNewUserReplaceForm(prev => ({
      ...prev,
      departmentId: checked 
        ? [...prev.departmentId, departmentId]
        : prev.departmentId.filter(id => id !== departmentId)
    }));
  }, []);

  const handleSelectAllNewUserReplaceDepartments = useCallback((checked: boolean) => {
    const departmentsArray = Array.isArray(departments) ? departments : [];
    setNewUserReplaceForm(prev => ({
      ...prev,
      departmentId: checked ? departmentsArray.map(dept => dept._id) : []
    }));
  }, [departments]);

  const openNewUserReplaceModal = useCallback((user: any) => {
    if (user.userType === 'admin') {
      toast.error("Admin users cannot be replaced");
      return;
    }
    setSelectedUserForNewUserReplace(user);
    setShowNewUserReplaceModal(true);
    setNewUserReplaceForm({
      name: "",
      email: "",
      phoneNumber: "",
      departmentId: []
    });
  }, []);

  const closeNewUserReplaceModal = useCallback(() => {
    setShowNewUserReplaceModal(false);
    setSelectedUserForNewUserReplace(null);
    setNewUserReplaceForm({
      name: "",
      email: "",
      phoneNumber: "",
      departmentId: []
    });
    
    setTimeout(() => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }, 100);
  }, []);

  const handleReplaceWithNewUser = useCallback(async () => {
    if (!newUserReplaceForm.name.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!newUserReplaceForm.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!newUserReplaceForm.phoneNumber.trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (newUserReplaceForm.departmentId.length === 0) {
      toast.error("At least one department is required");
      return;
    }

    if (!selectedUserForNewUserReplace?.user_id?._id) return;

    setRoleActionUserId(selectedUserForNewUserReplace.user_id._id);

    try {
      const userData = {
        name: newUserReplaceForm.name,
        email: newUserReplaceForm.email,
        phoneNumber: newUserReplaceForm.phoneNumber,
        departmentId: newUserReplaceForm.departmentId,
        password: "12345678",
        roleDefinitionId: selectedUserForNewUserReplace.roleDefinitionId._id
      };

      await dispatch(
        replaceUserRole({
          oldUserId: selectedUserForNewUserReplace.user_id._id,
          newUserId: "",
          mode: "newuserreplace",
          newRoleDefId: selectedUserForNewUserReplace.roleDefinitionId._id,
          userData: userData,
        })
      ).unwrap();

      toast.success("User replaced with new user successfully!");
      dispatch(fetchUsers());
      closeNewUserReplaceModal();
    } catch (error: any) {
      toast.error(error || "Failed to replace user with new user");
    } finally {
      setRoleActionUserId(null);
    }
  }, [dispatch, newUserReplaceForm, selectedUserForNewUserReplace, closeNewUserReplaceModal]);

  const handleUserLeave = useCallback(async (user: any) => {
    if (!user?.user_id?._id) return;

    if (user.userType === 'admin') {
      toast.error("Admin users cannot be removed");
      return;
    }

    setRoleActionUserId(user.user_id._id);

    try {
      await dispatch(
        replaceUserRole({
          oldUserId: user.user_id._id,
          newUserId: "",
          mode: "leave",
        })
      ).unwrap();

      toast.success("User removed from role successfully!");
      dispatch(fetchUsers());
    } catch (error: any) {
      toast.error(error || "Failed to remove user from role");
    } finally {
      setRoleActionUserId(null);
    }
  }, [dispatch]);

  const openReplaceModal = useCallback((user: any) => {
    if (user.userType === 'admin') {
      toast.error("Admin users cannot be replaced");
      return;
    }
    setSelectedUserForReplace(user);
    setShowReplaceModal(true);
  }, []);

  const closeReplaceModal = useCallback(() => {
    setShowReplaceModal(false);
    setSelectedUserForReplace(null);
    setReplacementUserId("");
    
    setTimeout(() => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }, 100);
  }, []);

  const getAvailableUsers = useCallback(() => {
    return combinedUsersList.allUsers.filter(
      (user: any) =>
        user.user_id?._id !== selectedUserForReplace?.user_id?._id &&
        user.userType !== 'admin' &&
        isUserActive(user)
    );
  }, [combinedUsersList.allUsers, selectedUserForReplace, isUserActive]);

  const departmentsArray = useMemo(() => Array.isArray(departments) ? departments : [], [departments]);
  const selectedNewUserDepartments = useMemo(() => 
    departmentsArray.filter(dept => 
      newUserReplaceForm.departmentId.includes(dept._id)
    ), [departmentsArray, newUserReplaceForm.departmentId]
  );
  const allNewUserDepartmentsSelected = useMemo(() => 
    departmentsArray.length > 0 && 
    newUserReplaceForm.departmentId.length === departmentsArray.length,
    [departmentsArray, newUserReplaceForm.departmentId]
  );

  // Render user table rows
  const renderUserRow = useCallback((user: any, index: number) => {
    const isUpdating = updatingUserId === user.user_id?._id;
    const isRoleUpdating = roleActionUserId === user.user_id?._id;
    const userIsActive = isUserActive(user);
    const userDepartments = getDepartmentNames(user);
    const userHasEmployeeProfile = isHRMSEnabled && user.userType !== 'admin' ? hasEmployeeProfile(user.user_id?._id) : false;
    
    return (
      <TableRow
        key={`${user._id}-${user.user_id?._id}-${index}`}
        className={`border-border hover:bg-muted/50 ${
          user.userType === 'admin' ? 'bg-red-50/50 dark:bg-red-900/10' : ''
        }`}
      >
        <TableCell className="text-foreground w-[15%]">
          <div className="flex items-center gap-2">
            {user.userType === 'admin' && (
              <Crown className="h-4 w-4 text-red-600" />
            )}
            <div
              className="truncate"
              title={user.displayName || "N/A"}
            >
              {user.displayName || "N/A"}
            </div>
          </div>
        </TableCell>
        <TableCell className="text-foreground w-[18%]">
          <div
            className="truncate"
            title={user.displayEmail || "N/A"}
          >
            {user.displayEmail || "N/A"}
          </div>
        </TableCell>
        <TableCell className="text-foreground w-[12%]">
          {user.displayPhone || "N/A"}
        </TableCell>
        <TableCell className="text-foreground w-[15%]">
          {userDepartments.length > 0 ? (
            <div
              className="flex flex-col gap-1 max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-1"
            >
              {userDepartments.map((dept: any, deptIndex: number) => (
                <Badge
                  key={deptIndex}
                  variant="secondary"
                  className={`text-xs px-2 py-1 w-fit flex-shrink-0 ${
                    user.userType === 'admin' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-700'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700'
                  }`}
                  title={dept.name}
                >
                  <span className="truncate max-w-[80px]">
                    {dept.name}
                  </span>
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">N/A</span>
          )}
        </TableCell>
        <TableCell className="w-[10%]">
          <Badge
            variant="outline"
            className={`capitalize border-border text-foreground text-xs ${
              user.userType === 'admin' 
                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200'
                : 'bg-muted'
            }`}
            title={getRoleName(user)}
          >
            <span className="truncate max-w-[60px]">
              {getRoleName(user).toLowerCase()}
            </span>
          </Badge>
        </TableCell>
        <TableCell className="text-foreground w-[12%]">
          <div className="truncate">
            {getReportingManager(user)}
          </div>
        </TableCell>
        
        <TableCell className="w-[8%]">
          <Badge
            variant="outline"
            className={`${getStatusColor(userIsActive)} text-xs`}
          >
            {userIsActive ? "Active" : "Inactive"}
          </Badge>
        </TableCell>
        <TableCell className="w-[10%]">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditUser(user)}
              disabled={loading}
              className="text-foreground hover:bg-muted p-1 h-8 w-8"
              title={user.userType === 'admin' ? 'Edit Admin User' : 'Edit User'}
            >
              <Edit className="h-3 w-3" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm" 
                  disabled={isRoleUpdating || roleUpdateLoading || newUserReplaceLoading}
                  className="text-xs px-2 py-1 h-8 flex items-center gap-1"
                >
                  {isRoleUpdating || roleUpdateLoading || newUserReplaceLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <Settings className="h-3 w-3" />
                      <ChevronDown className="h-3 w-3" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  {user.userType === 'admin' ? 'Admin Actions' : 'User Actions'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* 🔥 CRITICAL FIX: Employee Management Section - Always show when HRMS is enabled */}
                {isHRMSEnabled && user.userType !== 'admin' && (
                  <>
                    <DropdownMenuLabel className="text-blue-600 dark:text-blue-400 text-xs">
                      Employee Management
                    </DropdownMenuLabel>
                    
                    {userHasEmployeeProfile ? (
                      <>
                        <DropdownMenuItem
                          onClick={() => openViewEmployeeModal(user)}
                          className="text-blue-600 focus:text-blue-600"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Employee Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openEditEmployeeModal(user)}
                          className="text-green-600 focus:text-green-600"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Employee Profile
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => openCreateEmployeeModal(user)}
                        className="text-green-600 focus:text-green-600"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Employee Profile
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                  </>
                )}

                {user.userType !== 'admin' && (
                  <>
                    <DropdownMenuLabel className="text-xs">Role Actions</DropdownMenuLabel>
                    
                    <DropdownMenuItem
                      onClick={() => openNewUserReplaceModal(user)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Replace with New User
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => openReplaceModal(user)}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Replace with Existing User
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleUserLeave(user)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Remove from Role
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem
                  onClick={() => handleToggleActive(user)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : userIsActive ? (
                    <UserMinus className="h-4 w-4 mr-2" />
                  ) : (
                    <UserCheck className="h-4 w-4 mr-2" />
                  )}
                  {user.userType === 'admin' 
                    ? (userIsActive ? "Deactivate Admin" : "Activate Admin")
                    : (userIsActive ? "Deactivate" : "Activate")
                  }
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
    );
  }, [
    updatingUserId,
    roleActionUserId,
    isUserActive,
    getDepartmentNames,
    isHRMSEnabled,
    hasEmployeeProfile,
    loading,
    roleUpdateLoading,
    newUserReplaceLoading,
    getRoleName,
    getReportingManager,
    getStatusColor,
    handleEditUser,
    openViewEmployeeModal,
    openEditEmployeeModal,
    openCreateEmployeeModal,
    openNewUserReplaceModal,
    openReplaceModal,
    handleUserLeave,
    handleToggleActive
  ]);

  return (
    <div className="p-6 space-y-6 bg-background text-foreground">
      <h1 className="text-xl font-semibold">User Overview</h1>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, title: metrics.total, label: "Total Users", color: "text-blue-600" },
          { icon: UserCheck, title: metrics.active, label: "Active Users", color: "text-green-600" },
          { icon: Crown, title: metrics.admins, label: "Admins", color: "text-red-600" },
          { icon: User, title: metrics.regularUsers, label: "Regular Users", color: "text-purple-600" },
        ].map(({ icon: Icon, title, label, color }, index) => (
          <Card key={index} className="bg-card border-border">
            <CardHeader className="items-center flex justify-center flex-col">
              <Icon className={`${color} h-6 w-6`} />
              <CardTitle className="text-foreground">{title}</CardTitle>
              <p className="text-sm text-muted-foreground">{label}</p>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <Input
          placeholder="Search by name or email..."
          className="md:w-1/3 bg-input text-foreground border-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-2">
          <Button
            variant="default"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => router.push(getCreateRoute())}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            New User
          </Button>
        </div>
      </div>

      {/* Tabs for Users */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">
            User Management
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            View and manage all users and administrators
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="regular">
                Regular Users ({filteredRegularUsers.length})
              </TabsTrigger>
              <TabsTrigger value="admins">
                Admins ({filteredAdminUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="regular" className="mt-4">
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-muted/50">
                      <TableHead className="text-foreground w-[15%]">Name</TableHead>
                      <TableHead className="text-foreground w-[18%]">Email</TableHead>
                      <TableHead className="text-foreground w-[12%]">Phone</TableHead>
                      <TableHead className="text-foreground w-[15%]">Department(s)</TableHead>
                      <TableHead className="text-foreground w-[10%]">Role</TableHead>
                      <TableHead className="text-foreground w-[12%]">Reports To</TableHead>
                      <TableHead className="text-foreground w-[8%]">Status</TableHead>
                      <TableHead className="text-foreground w-[10%]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRegularUsers.length > 0 ? (
                      filteredRegularUsers.map((user: any, index: number) => renderUserRow(user, index))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          {loading ? "Loading users..." : "No regular users found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="admins" className="mt-4">
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-muted/50">
                      <TableHead className="text-foreground w-[15%]">Name</TableHead>
                      <TableHead className="text-foreground w-[18%]">Email</TableHead>
                      <TableHead className="text-foreground w-[12%]">Phone</TableHead>
                      <TableHead className="text-foreground w-[15%]">Department(s)</TableHead>
                      <TableHead className="text-foreground w-[10%]">Role</TableHead>
                      <TableHead className="text-foreground w-[12%]">Reports To</TableHead>
                      <TableHead className="text-foreground w-[8%]">Status</TableHead>
                      <TableHead className="text-foreground w-[10%]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdminUsers.length > 0 ? (
                      filteredAdminUsers.map((user: any, index: number) => renderUserRow(user, index))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          {adminsLoading ? "Loading admins..." : "No admin users found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Employee Modal - Now visible in both admin and dynamic dashboard when HRMS is enabled */}
      {showEmployeeModal && (
        <EmployeeModal
          key={`employee-modal-${selectedUserForEmployee?.user_id?._id || 'new'}`}
          isOpen={showEmployeeModal}
          onClose={closeEmployeeModal}
          mode={employeeModalMode}
          selectedUser={selectedUserForEmployee}
          onSave={handleEmployeeSave}
        />
      )}

      {/* 🔥 FIX: Enhanced Dialog with manual close handling */}
      <Dialog 
        open={showNewUserReplaceModal} 
        onOpenChange={(open) => {
          if (!open) {
            closeNewUserReplaceModal();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Replace with New User</DialogTitle>
            <DialogDescription>
              Create a new user to replace{" "}
              <strong>{selectedUserForNewUserReplace?.user_id?.name}</strong> in their
              current role.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-user-name">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="new-user-name"
                  placeholder="Enter full name"
                  value={newUserReplaceForm.name}
                  onChange={(e) => handleNewUserReplaceInputChange("name", e.target.value)}
                  disabled={newUserReplaceLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="new-user-email"
                  type="email"
                  placeholder="example@company.com"
                  value={newUserReplaceForm.email}
                  onChange={(e) => handleNewUserReplaceInputChange("email", e.target.value)}
                  disabled={newUserReplaceLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-user-phone">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-user-phone"
                placeholder="1234567890"
                value={newUserReplaceForm.phoneNumber}
                onChange={(e) => handleNewUserReplaceInputChange("phoneNumber", e.target.value)}
                disabled={newUserReplaceLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Departments <span className="text-destructive">*</span>
              </Label>
              <Popover open={newUserDepartmentPopoverOpen} onOpenChange={setNewUserDepartmentPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={newUserDepartmentPopoverOpen}
                    className="w-full justify-between"
                    disabled={newUserReplaceLoading}
                  >
                    <div className="flex items-center gap-1 overflow-hidden">
                      {selectedNewUserDepartments.length === 0 ? (
                        <span className="text-muted-foreground">Select departments...</span>
                      ) : selectedNewUserDepartments.length === 1 ? (
                        <span>{selectedNewUserDepartments[0].name}</span>
                      ) : (
                        <span>{selectedNewUserDepartments.length} departments selected</span>
                      )}
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <div className="max-h-60 overflow-y-auto">
                    <div className="flex items-center space-x-2 px-3 py-2 border-b hover:bg-muted">
                      <Checkbox
                        id="select-all-new-user"
                        checked={allNewUserDepartmentsSelected}
                        onCheckedChange={handleSelectAllNewUserReplaceDepartments}
                      />
                      <label
                        htmlFor="select-all-new-user"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Select All
                      </label>
                    </div>

                    {departmentsArray.map((dept) => (
                      <div
                        key={dept._id}
                        className="flex items-center space-x-2 px-3 py-2 hover:bg-muted"
                      >
                        <Checkbox
                          id={`new-user-${dept._id}`}
                          checked={newUserReplaceForm.departmentId.includes(dept._id)}
                          onCheckedChange={(checked) => 
                            handleNewUserReplaceDepartmentToggle(dept._id, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={`new-user-${dept._id}`}
                          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          {dept.name} ({dept.alias})
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {selectedNewUserDepartments.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedNewUserDepartments.map((dept) => (
                    <div
                      key={dept._id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
                    >
                      <span>{dept.name}</span>
                      <button
                        type="button"
                        onClick={() => handleNewUserReplaceDepartmentToggle(dept._id, false)}
                        className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
                        disabled={newUserReplaceLoading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              <strong>Note:</strong> The new user will be assigned the same role as the current user 
              ({selectedUserForNewUserReplace?.roleDefinitionId?.roleName || "Unknown Role"}) 
              with a default password "12345678".
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeNewUserReplaceModal}>
              Cancel
            </Button>
            <Button
              onClick={handleReplaceWithNewUser}
              disabled={
                !newUserReplaceForm.name || 
                !newUserReplaceForm.email || 
                !newUserReplaceForm.phoneNumber ||
                newUserReplaceForm.departmentId.length === 0 ||
                newUserReplaceLoading
              }
            >
              {newUserReplaceLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Create & Replace User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Replace User Modal */}
      <Dialog 
        open={showReplaceModal} 
        onOpenChange={(open) => {
          if (!open) closeReplaceModal();
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Replace User</DialogTitle>
            <DialogDescription>
              Select a user to replace{" "}
              <strong>{selectedUserForReplace?.user_id?.name}</strong> in their
              current role.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="replacement-user">Select Replacement User</Label>
              <Select
                value={replacementUserId}
                onValueChange={setReplacementUserId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableUsers().map((user: any) => (
                    <SelectItem
                      key={user.user_id._id}
                      value={user.user_id._id}
                    >
                      {user.user_id.name} ({user.user_id.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeReplaceModal}>
              Cancel
            </Button>
            <Button
              onClick={handleReplaceUser}
              disabled={!replacementUserId || roleUpdateLoading}
            >
              {roleUpdateLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Replace User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <EditUserModal
          key={`edit-modal-${editingUser?.user_id?._id || 'new'}`}
          user={editingUser}
          isOpen={isEditModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}

// "use client";

// import { useState, useEffect, useMemo, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import {
//   Users,
//   UserCheck,
//   UserCog,
//   User,
//   Edit,
//   Loader2,
//   UserX,
//   LogOut,
//   UserMinus,
//   Settings,
//   ChevronDown,
//   UserPlus,
//   X,
//   Building2,
//   Eye,
//   Plus,
//   Crown,
// } from "lucide-react";
// import { toast } from "sonner";
// import { useAppDispatch, useAppSelector } from "@/store/hooks";
// import {
//   fetchUsers,
//   updateUserStatus,
//   clearUserError,
//   updateUserInState,
// } from "@/features/user/userSlice";
// import { fetchDepartments } from "@/features/departments/departmentSlice";
// import {
//   getAllRoles,
//   replaceUserRole,
//   selectRoles,
//   selectReplaceUserLoading,
//   selectNewUserReplaceLoading,
// } from "@/features/role/roleSlice";
// import {
//   fetchEmployees,
//   selectEmployees,
// } from "@/features/employee/employeeSlice";
// import { getAdminUsers } from "@/features/newUser/newUserSlice";
// import EditUserModal from "./EditUserModal";
// import EmployeeModal from "./EmployeeModel";

// export default function UserOverviewPage() {
//   const router = useRouter();
//   const dispatch = useAppDispatch();
  
//   // Tab state
//   const [activeTab, setActiveTab] = useState("regular");
  
//   // State management with proper initialization
//   const [searchTerm, setSearchTerm] = useState("");
//   const [editingUser, setEditingUser] = useState<any>(null);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

//   // Role management state
//   const [roleActionUserId, setRoleActionUserId] = useState<string | null>(null);
//   const [showReplaceModal, setShowReplaceModal] = useState(false);
//   const [selectedUserForReplace, setSelectedUserForReplace] = useState<any>(null);
//   const [replacementUserId, setReplacementUserId] = useState<string>("");

//   // New User Replacement state
//   const [showNewUserReplaceModal, setShowNewUserReplaceModal] = useState(false);
//   const [selectedUserForNewUserReplace, setSelectedUserForNewUserReplace] = useState<any>(null);
//   const [newUserReplaceForm, setNewUserReplaceForm] = useState({
//     name: "",
//     email: "",
//     phoneNumber: "",
//     departmentId: [] as string[]
//   });
//   const [newUserDepartmentPopoverOpen, setNewUserDepartmentPopoverOpen] = useState(false);

//   // Employee Modal State
//   const [showEmployeeModal, setShowEmployeeModal] = useState(false);
//   const [employeeModalMode, setEmployeeModalMode] = useState<'create' | 'view' | 'edit'>('create');
//   const [selectedUserForEmployee, setSelectedUserForEmployee] = useState<any>(null);

//   // Redux selectors
//   const { users, loading, error } = useAppSelector((state) => state.users);
//   const { admins, loading: adminsLoading } = useAppSelector((state) => state.newUser);
//   const isOrganizer = useAppSelector((state) => state.auth.isOrganizer);
//   const isSuperUser = useAppSelector((state) => state.auth.isSuperUser);
//   const userRole = useAppSelector((state) => state.auth.role);
//   const orgPermissions = useAppSelector((state) => state.auth.orgPermissions);
//   const hrmsPermissions = useAppSelector((state) => state.auth.hrmsPermissions);
//   const { departments } = useAppSelector((state) => state.departments);
//   const roles = useAppSelector(selectRoles);
//   const roleUpdateLoading = useAppSelector(selectReplaceUserLoading);
//   const newUserReplaceLoading = useAppSelector(selectNewUserReplaceLoading);
//   const employees = useAppSelector(selectEmployees);

//   // Check if HRMS is enabled and user has permissions
//   const isHRMSEnabled = orgPermissions?.isHRMS_enabled || false;
//   const canCreateEmployee = isHRMSEnabled && (
//     isSuperUser || 
//     isOrganizer || 
//     hrmsPermissions?.includes('create_employee') || 
//     hrmsPermissions?.includes('manage_employees')
//   );

//   // 🔥 CRITICAL FIX: Global body scroll restoration for ALL modals
//   useEffect(() => {
//     const restoreBodyScroll = () => {
//       const anyModalOpen = showEmployeeModal || showNewUserReplaceModal || showReplaceModal || isEditModalOpen;
      
//       if (!anyModalOpen) {
//         // Force restore scroll with multiple approaches
//         setTimeout(() => {
//           document.body.style.overflow = '';
//           document.body.style.paddingRight = '';
//           document.body.style.pointerEvents = '';
//           document.body.removeAttribute('data-scroll-locked');
          
//           // Also check for radix-ui specific attributes
//           document.body.removeAttribute('data-radix-scroll-locked');
//           document.body.style.removeProperty('--removed-body-scroll-bar-size');
//         }, 150);
//       }
//     };

//     restoreBodyScroll();
//   }, [showEmployeeModal, showNewUserReplaceModal, showReplaceModal, isEditModalOpen]);

//   // 🔥 CRITICAL FIX: Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       document.body.style.overflow = '';
//       document.body.style.paddingRight = '';
//       document.body.style.pointerEvents = '';
//       document.body.removeAttribute('data-scroll-locked');
//       document.body.removeAttribute('data-radix-scroll-locked');
//     };
//   }, []);

//   // Initial data fetching
//   useEffect(() => {
//     const fetchInitialData = async () => {
//       try {
//         await Promise.all([
//           dispatch(fetchUsers()),
//           dispatch(fetchDepartments({})),
//           dispatch(getAllRoles()),
//           dispatch(getAdminUsers())
//         ]);
        
//         if (isHRMSEnabled) {
//           await dispatch(fetchEmployees({}));
//         }
//       } catch (error) {
//         console.error("Failed to fetch initial data:", error);
//       }
//     };

//     fetchInitialData();
//   }, [dispatch, isHRMSEnabled]);

//   useEffect(() => {
//     if (isHRMSEnabled && employees.length === 0) {
//       dispatch(fetchEmployees({}));
//     }
//   }, [isHRMSEnabled, dispatch, employees.length]);

//   useEffect(() => {
//     if (error) {
//       toast.error(error);
//       dispatch(clearUserError());
//     }
//   }, [error, dispatch]);

//   useEffect(() => {
//     return () => {
//       dispatch(clearUserError());
//     };
//   }, [dispatch]);

//   // Combine users and admins into separate lists with proper structure
//   const combinedUsersList = useMemo(() => {
//     const regularUsers = users.map(user => ({
//       ...user,
//       userType: 'regular',
//       displayName: user.user_id?.name || 'N/A',
//       displayEmail: user.user_id?.email || 'N/A',
//       displayPhone: user.user_id?.phoneNumber || 'N/A',
//       isActive: user.user_id?.isActive !== false && user.status === 'active'
//     }));
    
//     const adminUsers = admins.map(admin => ({
//       _id: admin._id,
//       user_id: {
//         _id: admin._id,
//         name: admin.name,
//         email: admin.email,
//         phoneNumber: admin.phoneNumber || 'N/A',
//         isActive: admin.isActive !== false
//       },
//       userType: 'admin',
//       displayName: admin.name,
//       displayEmail: admin.email,
//       displayPhone: admin.phoneNumber || 'N/A',
//       isActive: admin.isActive !== false,
//       status: admin.isActive !== false ? 'active' : 'inactive',
//       roleDefinitionId: {
//         roleName: 'ADMIN',
//         hierarchyLevel: 0
//       },
//       departments: [],
//       parentRoleId: null
//     }));
    
//     return { regularUsers, adminUsers, allUsers: [...regularUsers, ...adminUsers] };
//   }, [users, admins]);

//   // Memoized helper functions
//   const getCreateRoute = useCallback(() => {
//     if (isOrganizer || userRole?.toLowerCase() === "admin") {
//       return "/dashboard/admin/user_overview/create";
//     } else {
//       return "/dashboard/dynamic/user_overview/create";
//     }
//   }, [isOrganizer, userRole]);

//   const hasEmployeeProfile = useCallback((userId: string) => {
//     return employees.some((employee: any) => 
//       employee.userId === userId || employee.userId?._id === userId
//     );
//   }, [employees]);

//   // Employee Modal Functions with FIX
//   const openCreateEmployeeModal = useCallback((user: any) => {
//     if (user.userType === 'admin') {
//       toast.error("Cannot create employee profile for admin users");
//       return;
//     }
    
//     const userWithExistingRole = {
//       ...user,
//       isExistingUser: true,
//       existingRoleDefinitionId: user.roleDefinitionId?._id || null,
//       existingRoleName: user.roleDefinitionId?.roleName || "Unknown Role"
//     };
//     setSelectedUserForEmployee(userWithExistingRole);
//     setEmployeeModalMode('create');
//     setShowEmployeeModal(true);
//   }, []);

//   const openViewEmployeeModal = useCallback((user: any) => {
//     setSelectedUserForEmployee(user);
//     setEmployeeModalMode('view');
//     setShowEmployeeModal(true);
//   }, []);

//   const openEditEmployeeModal = useCallback((user: any) => {
//     setSelectedUserForEmployee(user);
//     setEmployeeModalMode('edit');
//     setShowEmployeeModal(true);
//   }, []);

//   // 🔥 CRITICAL FIX: Enhanced close handler with forced scroll restoration
//   const closeEmployeeModal = useCallback(() => {
//     setShowEmployeeModal(false);
//     setSelectedUserForEmployee(null);
//     setEmployeeModalMode('create');
    
//     // Force restore scroll immediately
//     setTimeout(() => {
//       document.body.style.overflow = '';
//       document.body.style.paddingRight = '';
//       document.body.style.pointerEvents = '';
//       document.body.removeAttribute('data-scroll-locked');
//       document.body.removeAttribute('data-radix-scroll-locked');
//     }, 100);
//   }, []);

//   const handleEmployeeSave = useCallback(() => {
//     dispatch(fetchUsers());
//     if (isHRMSEnabled) {
//       dispatch(fetchEmployees({}));
//     }
//   }, [dispatch, isHRMSEnabled]);

//   // Metrics calculation
//   const metrics = useMemo(
//     () => ({
//       total: combinedUsersList.allUsers.length,
//       active: combinedUsersList.allUsers.filter(u => u.isActive).length,
//       managers: combinedUsersList.allUsers.filter(
//         (u: any) =>
//           u.roleDefinitionId?.roleName === "MANAGER" ||
//           u.roleDefinitionId?.roleName === "TL" ||
//           (u.roleDefinitionId?.hierarchyLevel && u.roleDefinitionId.hierarchyLevel <= 3)
//       ).length,
//       members: combinedUsersList.allUsers.filter(
//         (u: any) =>
//           u.roleDefinitionId?.roleName === "Associate" ||
//           (u.roleDefinitionId?.hierarchyLevel && u.roleDefinitionId.hierarchyLevel > 3)
//       ).length,
//       admins: combinedUsersList.adminUsers.length,
//       regularUsers: combinedUsersList.regularUsers.length,
//     }),
//     [combinedUsersList]
//   );

//   // Filtering with tab support
//   const getFilteredUsers = useCallback((userList: any[]) => {
//     return userList.filter((user: any) => {
//       const name = user.displayName || "";
//       const email = user.displayEmail || "";
//       return (
//         name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         email.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     });
//   }, [searchTerm]);

//   const filteredRegularUsers = useMemo(() => getFilteredUsers(combinedUsersList.regularUsers), [getFilteredUsers, combinedUsersList.regularUsers]);
//   const filteredAdminUsers = useMemo(() => getFilteredUsers(combinedUsersList.adminUsers), [getFilteredUsers, combinedUsersList.adminUsers]);
//   const filteredAllUsers = useMemo(() => getFilteredUsers(combinedUsersList.allUsers), [getFilteredUsers, combinedUsersList.allUsers]);

//   const getDepartmentNames = useCallback((user: any) => {
//     if (user.userType === 'admin') {
//       return [{ name: 'All Departments', alias: 'ALL' }];
//     }
    
//     let userDepartments = [];

//     if (user.departments && user.departments.length > 0) {
//       userDepartments = user.departments;
//     }
//     else if (
//       user.user_id?.departmentId &&
//       user.user_id.departmentId.length > 0 &&
//       departments.length > 0
//     ) {
//       userDepartments = user.user_id.departmentId
//         .map((deptId: string) => {
//           const department = departments.find((dept: any) => dept._id === deptId);
//           return department
//             ? { name: department.name, alias: department.alias }
//             : null;
//         })
//         .filter(Boolean);
//     }

//     return userDepartments;
//   }, [departments]);

//   const getReportingManager = useCallback((user: any) => {
//     if (user.userType === 'admin') {
//       return "N/A";
//     }
    
//     if (user.parentRoleId?.user_id?.name) {
//       return user.parentRoleId.user_id.name;
//     }
    
//     if (admins && admins.length > 0) {
//       if (admins.length === 1) {
//         return (
//           <div className="flex items-center gap-1">
//             <Badge variant="outline" className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200">
//               Admin
//             </Badge>
//             <span className="text-xs">{admins[0].name}</span>
//           </div>
//         );
//       } else {
//         return (
//           <Popover>
//             <PopoverTrigger asChild>
//               <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-800 text-xs">
//                 View Admins ({admins.length})
//               </Button>
//             </PopoverTrigger>
//             <PopoverContent className="w-80">
//               <div className="space-y-2">
//                 <h4 className="font-medium text-sm">Organization Admins</h4>
//                 <div className="space-y-1 max-h-40 overflow-y-auto">
//                   {admins.map((admin) => (
//                     <div key={admin._id} className="flex items-center justify-between p-1 hover:bg-muted rounded">
//                       <span className="text-sm">{admin.name}</span>
//                       <span className="text-xs text-muted-foreground truncate ml-2">{admin.email}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </PopoverContent>
//           </Popover>
//         );
//       }
//     }
    
//     return "N/A";
//   }, [admins]);

//   const getRoleName = useCallback((user: any) => {
//     if (user.userType === 'admin') {
//       return 'ADMIN';
//     }
//     return user.roleDefinitionId?.roleName || "Member";
//   }, []);

//   const getStatusColor = useCallback((isActive: boolean) => {
//     return isActive
//       ? "bg-green-500/20 text-green-600 dark:bg-green-500/30 dark:text-green-400 border-green-500/50"
//       : "bg-red-500/20 text-red-600 dark:bg-red-500/30 dark:text-red-400 border-red-500/50";
//   }, []);

//   const isUserActive = useCallback((user: any) => {
//     return user.isActive;
//   }, []);

//   const handleEditUser = useCallback((user: any) => {
//     setEditingUser(user);
//     setIsEditModalOpen(true);
//   }, []);

//   const handleToggleActive = useCallback(async (user: any) => {
//     if (!user?.user_id?._id) return;

//     const userId = user.user_id._id;
//     const currentStatus = isUserActive(user);
//     const newStatus = !currentStatus;

//     setUpdatingUserId(userId);

//     try {
//       if (user.userType === 'admin') {
//         toast.info("Admin status toggle functionality will be implemented based on your admin API");
//         dispatch(getAdminUsers());
//         return;
//       }

//       await dispatch(
//         updateUserStatus({
//           id: userId,
//           isActive: newStatus,
//         })
//       ).unwrap();

//       toast.success(
//         `User ${currentStatus ? "deactivated" : "activated"} successfully`
//       );
//       dispatch(fetchUsers());
//     } catch (error: any) {
//       dispatch(
//         updateUserInState({
//           id: userId,
//           updates: { status: currentStatus ? "active" : "inactive" },
//         })
//       );
//       toast.error(error || "Failed to update user status");
//     } finally {
//       setUpdatingUserId(null);
//     }
//   }, [dispatch, isUserActive]);

//   // 🔥 CRITICAL FIX: Enhanced save/close handlers
//   const handleSaveUser = useCallback((updatedUser: any) => {
//     setEditingUser(null);
//     setIsEditModalOpen(false);
//     dispatch(fetchUsers());
//     dispatch(getAdminUsers());
    
//     setTimeout(() => {
//       document.body.style.overflow = '';
//       document.body.style.paddingRight = '';
//       document.body.style.pointerEvents = '';
//     }, 100);
//   }, [dispatch]);

//   const handleCloseModal = useCallback(() => {
//     setEditingUser(null);
//     setIsEditModalOpen(false);
    
//     setTimeout(() => {
//       document.body.style.overflow = '';
//       document.body.style.paddingRight = '';
//       document.body.style.pointerEvents = '';
//     }, 100);
//   }, []);

//   // Role management functions with FIX
//   const handleReplaceUser = useCallback(async () => {
//     if (!selectedUserForReplace?.user_id?._id || !replacementUserId) return;

//     if (selectedUserForReplace.userType === 'admin') {
//       toast.error("Admin users cannot be replaced");
//       return;
//     }

//     setRoleActionUserId(selectedUserForReplace.user_id._id);

//     try {
//       await dispatch(
//         replaceUserRole({
//           oldUserId: selectedUserForReplace.user_id._id,
//           newUserId: replacementUserId,
//           mode: "replace",
//         })
//       ).unwrap();

//       toast.success("User replaced successfully!");
//       dispatch(fetchUsers());
//       setShowReplaceModal(false);
//       setSelectedUserForReplace(null);
//       setReplacementUserId("");
      
//       setTimeout(() => {
//         document.body.style.overflow = '';
//         document.body.style.paddingRight = '';
//       }, 100);
//     } catch (error: any) {
//       toast.error(error || "Failed to replace user");
//     } finally {
//       setRoleActionUserId(null);
//     }
//   }, [dispatch, selectedUserForReplace, replacementUserId]);

//   const handleNewUserReplaceInputChange = useCallback((field: string, value: string | string[]) => {
//     setNewUserReplaceForm(prev => ({ ...prev, [field]: value }));
//   }, []);

//   const handleNewUserReplaceDepartmentToggle = useCallback((departmentId: string, checked: boolean) => {
//     setNewUserReplaceForm(prev => ({
//       ...prev,
//       departmentId: checked 
//         ? [...prev.departmentId, departmentId]
//         : prev.departmentId.filter(id => id !== departmentId)
//     }));
//   }, []);

//   const handleSelectAllNewUserReplaceDepartments = useCallback((checked: boolean) => {
//     const departmentsArray = Array.isArray(departments) ? departments : [];
//     setNewUserReplaceForm(prev => ({
//       ...prev,
//       departmentId: checked ? departmentsArray.map(dept => dept._id) : []
//     }));
//   }, [departments]);

//   const openNewUserReplaceModal = useCallback((user: any) => {
//     if (user.userType === 'admin') {
//       toast.error("Admin users cannot be replaced");
//       return;
//     }
//     setSelectedUserForNewUserReplace(user);
//     setShowNewUserReplaceModal(true);
//     setNewUserReplaceForm({
//       name: "",
//       email: "",
//       phoneNumber: "",
//       departmentId: []
//     });
//   }, []);

//   const closeNewUserReplaceModal = useCallback(() => {
//     setShowNewUserReplaceModal(false);
//     setSelectedUserForNewUserReplace(null);
//     setNewUserReplaceForm({
//       name: "",
//       email: "",
//       phoneNumber: "",
//       departmentId: []
//     });
    
//     setTimeout(() => {
//       document.body.style.overflow = '';
//       document.body.style.paddingRight = '';
//     }, 100);
//   }, []);

//   const handleReplaceWithNewUser = useCallback(async () => {
//     if (!newUserReplaceForm.name.trim()) {
//       toast.error("Full name is required");
//       return;
//     }
//     if (!newUserReplaceForm.email.trim()) {
//       toast.error("Email is required");
//       return;
//     }
//     if (!newUserReplaceForm.phoneNumber.trim()) {
//       toast.error("Phone number is required");
//       return;
//     }
//     if (newUserReplaceForm.departmentId.length === 0) {
//       toast.error("At least one department is required");
//       return;
//     }

//     if (!selectedUserForNewUserReplace?.user_id?._id) return;

//     setRoleActionUserId(selectedUserForNewUserReplace.user_id._id);

//     try {
//       const userData = {
//         name: newUserReplaceForm.name,
//         email: newUserReplaceForm.email,
//         phoneNumber: newUserReplaceForm.phoneNumber,
//         departmentId: newUserReplaceForm.departmentId,
//         password: "12345678",
//         roleDefinitionId: selectedUserForNewUserReplace.roleDefinitionId._id
//       };

//       await dispatch(
//         replaceUserRole({
//           oldUserId: selectedUserForNewUserReplace.user_id._id,
//           newUserId: "",
//           mode: "newuserreplace",
//           newRoleDefId: selectedUserForNewUserReplace.roleDefinitionId._id,
//           userData: userData,
//         })
//       ).unwrap();

//       toast.success("User replaced with new user successfully!");
//       dispatch(fetchUsers());
//       closeNewUserReplaceModal();
//     } catch (error: any) {
//       toast.error(error || "Failed to replace user with new user");
//     } finally {
//       setRoleActionUserId(null);
//     }
//   }, [dispatch, newUserReplaceForm, selectedUserForNewUserReplace, closeNewUserReplaceModal]);

//   const handleUserLeave = useCallback(async (user: any) => {
//     if (!user?.user_id?._id) return;

//     if (user.userType === 'admin') {
//       toast.error("Admin users cannot be removed");
//       return;
//     }

//     setRoleActionUserId(user.user_id._id);

//     try {
//       await dispatch(
//         replaceUserRole({
//           oldUserId: user.user_id._id,
//           newUserId: "",
//           mode: "leave",
//         })
//       ).unwrap();

//       toast.success("User removed from role successfully!");
//       dispatch(fetchUsers());
//     } catch (error: any) {
//       toast.error(error || "Failed to remove user from role");
//     } finally {
//       setRoleActionUserId(null);
//     }
//   }, [dispatch]);

//   const openReplaceModal = useCallback((user: any) => {
//     if (user.userType === 'admin') {
//       toast.error("Admin users cannot be replaced");
//       return;
//     }
//     setSelectedUserForReplace(user);
//     setShowReplaceModal(true);
//   }, []);

//   const closeReplaceModal = useCallback(() => {
//     setShowReplaceModal(false);
//     setSelectedUserForReplace(null);
//     setReplacementUserId("");
    
//     setTimeout(() => {
//       document.body.style.overflow = '';
//       document.body.style.paddingRight = '';
//     }, 100);
//   }, []);

//   const getAvailableUsers = useCallback(() => {
//     return combinedUsersList.allUsers.filter(
//       (user: any) =>
//         user.user_id?._id !== selectedUserForReplace?.user_id?._id &&
//         user.userType !== 'admin' &&
//         isUserActive(user)
//     );
//   }, [combinedUsersList.allUsers, selectedUserForReplace, isUserActive]);

//   const departmentsArray = useMemo(() => Array.isArray(departments) ? departments : [], [departments]);
//   const selectedNewUserDepartments = useMemo(() => 
//     departmentsArray.filter(dept => 
//       newUserReplaceForm.departmentId.includes(dept._id)
//     ), [departmentsArray, newUserReplaceForm.departmentId]
//   );
//   const allNewUserDepartmentsSelected = useMemo(() => 
//     departmentsArray.length > 0 && 
//     newUserReplaceForm.departmentId.length === departmentsArray.length,
//     [departmentsArray, newUserReplaceForm.departmentId]
//   );

//   // Render user table rows
//   const renderUserRow = useCallback((user: any, index: number) => {
//     const isUpdating = updatingUserId === user.user_id?._id;
//     const isRoleUpdating = roleActionUserId === user.user_id?._id;
//     const userIsActive = isUserActive(user);
//     const userDepartments = getDepartmentNames(user);
//     const userHasEmployeeProfile = isHRMSEnabled && user.userType !== 'admin' ? hasEmployeeProfile(user.user_id?._id) : false;
    
//     return (
//       <TableRow
//         key={`${user._id}-${user.user_id?._id}-${index}`}
//         className={`border-border hover:bg-muted/50 ${
//           user.userType === 'admin' ? 'bg-red-50/50 dark:bg-red-900/10' : ''
//         }`}
//       >
//         <TableCell className="text-foreground w-[15%]">
//           <div className="flex items-center gap-2">
//             {user.userType === 'admin' && (
//               <Crown className="h-4 w-4 text-red-600" />
//             )}
//             <div
//               className="truncate"
//               title={user.displayName || "N/A"}
//             >
//               {user.displayName || "N/A"}
//             </div>
//           </div>
//         </TableCell>
//         <TableCell className="text-foreground w-[18%]">
//           <div
//             className="truncate"
//             title={user.displayEmail || "N/A"}
//           >
//             {user.displayEmail || "N/A"}
//           </div>
//         </TableCell>
//         <TableCell className="text-foreground w-[12%]">
//           {user.displayPhone || "N/A"}
//         </TableCell>
//         <TableCell className="text-foreground w-[15%]">
//           {userDepartments.length > 0 ? (
//             <div
//               className="flex flex-col gap-1 max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-1"
//             >
//               {userDepartments.map((dept: any, deptIndex: number) => (
//                 <Badge
//                   key={deptIndex}
//                   variant="secondary"
//                   className={`text-xs px-2 py-1 w-fit flex-shrink-0 ${
//                     user.userType === 'admin' 
//                       ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-700'
//                       : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700'
//                   }`}
//                   title={dept.name}
//                 >
//                   <span className="truncate max-w-[80px]">
//                     {dept.name}
//                   </span>
//                 </Badge>
//               ))}
//             </div>
//           ) : (
//             <span className="text-muted-foreground">N/A</span>
//           )}
//         </TableCell>
//         <TableCell className="w-[10%]">
//           <Badge
//             variant="outline"
//             className={`capitalize border-border text-foreground text-xs ${
//               user.userType === 'admin' 
//                 ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200'
//                 : 'bg-muted'
//             }`}
//             title={getRoleName(user)}
//           >
//             <span className="truncate max-w-[60px]">
//               {getRoleName(user).toLowerCase()}
//             </span>
//           </Badge>
//         </TableCell>
//         <TableCell className="text-foreground w-[12%]">
//           <div className="truncate">
//             {getReportingManager(user)}
//           </div>
//         </TableCell>
        
//         <TableCell className="w-[8%]">
//           <Badge
//             variant="outline"
//             className={`${getStatusColor(userIsActive)} text-xs`}
//           >
//             {userIsActive ? "Active" : "Inactive"}
//           </Badge>
//         </TableCell>
//         <TableCell className="w-[10%]">
//           <div className="flex gap-1">
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={() => handleEditUser(user)}
//               disabled={loading}
//               className="text-foreground hover:bg-muted p-1 h-8 w-8"
//               title={user.userType === 'admin' ? 'Edit Admin User' : 'Edit User'}
//             >
//               <Edit className="h-3 w-3" />
//             </Button>

//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <Button
//                   variant="outline"
//                   size="sm" 
//                   disabled={isRoleUpdating || roleUpdateLoading || newUserReplaceLoading}
//                   className="text-xs px-2 py-1 h-8 flex items-center gap-1"
//                 >
//                   {isRoleUpdating || roleUpdateLoading || newUserReplaceLoading ? (
//                     <Loader2 className="h-3 w-3 animate-spin" />
//                   ) : (
//                     <>
//                       <Settings className="h-3 w-3" />
//                       <ChevronDown className="h-3 w-3" />
//                     </>
//                   )}
//                 </Button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent align="end" className="w-56">
//                 <DropdownMenuLabel>
//                   {user.userType === 'admin' ? 'Admin Actions' : 'User Actions'}
//                 </DropdownMenuLabel>
//                 <DropdownMenuSeparator />

//                 {isHRMSEnabled && canCreateEmployee && user.userType !== 'admin' && (
//                   <>
//                     <DropdownMenuLabel className="text-blue-600 dark:text-blue-400 text-xs">
//                       Employee Management
//                     </DropdownMenuLabel>
                    
//                     {userHasEmployeeProfile ? (
//                       <>
//                         <DropdownMenuItem
//                           onClick={() => openViewEmployeeModal(user)}
//                           className="text-blue-600 focus:text-blue-600"
//                         >
//                           <Eye className="h-4 w-4 mr-2" />
//                           View Employee Details
//                         </DropdownMenuItem>
//                         <DropdownMenuItem
//                           onClick={() => openEditEmployeeModal(user)}
//                           className="text-green-600 focus:text-green-600"
//                         >
//                           <Edit className="h-4 w-4 mr-2" />
//                           Edit Employee Profile
//                         </DropdownMenuItem>
//                       </>
//                     ) : (
//                       <DropdownMenuItem
//                         onClick={() => openCreateEmployeeModal(user)}
//                         className="text-green-600 focus:text-green-600"
//                       >
//                         <Plus className="h-4 w-4 mr-2" />
//                         Create Employee Profile
//                       </DropdownMenuItem>
//                     )}
                    
//                     <DropdownMenuSeparator />
//                   </>
//                 )}

//                 {user.userType !== 'admin' && (
//                   <>
//                     <DropdownMenuLabel className="text-xs">Role Actions</DropdownMenuLabel>
                    
//                     <DropdownMenuItem
//                       onClick={() => openNewUserReplaceModal(user)}
//                     >
//                       <UserPlus className="h-4 w-4 mr-2" />
//                       Replace with New User
//                     </DropdownMenuItem>

//                     <DropdownMenuItem
//                       onClick={() => openReplaceModal(user)}
//                     >
//                       <UserX className="h-4 w-4 mr-2" />
//                       Replace with Existing User
//                     </DropdownMenuItem>

//                     <DropdownMenuItem
//                       onClick={() => handleUserLeave(user)}
//                       className="text-red-600 focus:text-red-600"
//                     >
//                       <LogOut className="h-4 w-4 mr-2" />
//                       Remove from Role
//                     </DropdownMenuItem>

//                     <DropdownMenuSeparator />
//                   </>
//                 )}

//                 <DropdownMenuItem
//                   onClick={() => handleToggleActive(user)}
//                   disabled={isUpdating}
//                 >
//                   {isUpdating ? (
//                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                   ) : userIsActive ? (
//                     <UserMinus className="h-4 w-4 mr-2" />
//                   ) : (
//                     <UserCheck className="h-4 w-4 mr-2" />
//                   )}
//                   {user.userType === 'admin' 
//                     ? (userIsActive ? "Deactivate Admin" : "Activate Admin")
//                     : (userIsActive ? "Deactivate" : "Activate")
//                   }
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </div>
//         </TableCell>
//       </TableRow>
//     );
//   }, [
//     updatingUserId,
//     roleActionUserId,
//     isUserActive,
//     getDepartmentNames,
//     isHRMSEnabled,
//     hasEmployeeProfile,
//     loading,
//     roleUpdateLoading,
//     newUserReplaceLoading,
//     canCreateEmployee,
//     getRoleName,
//     getReportingManager,
//     getStatusColor,
//     handleEditUser,
//     openViewEmployeeModal,
//     openEditEmployeeModal,
//     openCreateEmployeeModal,
//     openNewUserReplaceModal,
//     openReplaceModal,
//     handleUserLeave,
//     handleToggleActive
//   ]);

//   return (
//     <div className="p-6 space-y-6 bg-background text-foreground">
//       <h1 className="text-xl font-semibold">User Overview</h1>

//       {/* Metrics */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//         {[
//           { icon: Users, title: metrics.total, label: "Total Users", color: "text-blue-600" },
//           { icon: UserCheck, title: metrics.active, label: "Active Users", color: "text-green-600" },
//           { icon: Crown, title: metrics.admins, label: "Admins", color: "text-red-600" },
//           { icon: User, title: metrics.regularUsers, label: "Regular Users", color: "text-purple-600" },
//         ].map(({ icon: Icon, title, label, color }, index) => (
//           <Card key={index} className="bg-card border-border">
//             <CardHeader className="items-center flex justify-center flex-col">
//               <Icon className={`${color} h-6 w-6`} />
//               <CardTitle className="text-foreground">{title}</CardTitle>
//               <p className="text-sm text-muted-foreground">{label}</p>
//             </CardHeader>
//           </Card>
//         ))}
//       </div>

//       {/* Search and Actions */}
//       <div className="flex flex-col md:flex-row justify-between gap-4">
//         <Input
//           placeholder="Search by name or email..."
//           className="md:w-1/3 bg-input text-foreground border-input"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//         <div className="flex gap-2">
//           <Button
//             variant="default"
//             className="bg-primary text-primary-foreground hover:bg-primary/90"
//             onClick={() => router.push(getCreateRoute())}
//           >
//             <UserPlus className="h-4 w-4 mr-2" />
//             New User
//           </Button>
//         </div>
//       </div>

//       {/* Tabs for Users */}
//       <Card className="bg-card border-border">
//         <CardHeader>
//           <CardTitle className="text-xl font-semibold text-foreground">
//             User Management
//           </CardTitle>
//           <p className="text-sm text-muted-foreground">
//             View and manage all users and administrators
//           </p>
//         </CardHeader>
//         <CardContent>
//           <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//             <TabsList className="grid w-full grid-cols-2">
//               <TabsTrigger value="regular">
//                 Regular Users ({filteredRegularUsers.length})
//               </TabsTrigger>
//               <TabsTrigger value="admins">
//                 Admins ({filteredAdminUsers.length})
//               </TabsTrigger>
//             </TabsList>

//             <TabsContent value="regular" className="mt-4">
//               <div className="w-full overflow-x-auto">
//                 <Table>
//                   <TableHeader>
//                     <TableRow className="border-border hover:bg-muted/50">
//                       <TableHead className="text-foreground w-[15%]">Name</TableHead>
//                       <TableHead className="text-foreground w-[18%]">Email</TableHead>
//                       <TableHead className="text-foreground w-[12%]">Phone</TableHead>
//                       <TableHead className="text-foreground w-[15%]">Department(s)</TableHead>
//                       <TableHead className="text-foreground w-[10%]">Role</TableHead>
//                       <TableHead className="text-foreground w-[12%]">Reports To</TableHead>
//                       <TableHead className="text-foreground w-[8%]">Status</TableHead>
//                       <TableHead className="text-foreground w-[10%]">Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {filteredRegularUsers.length > 0 ? (
//                       filteredRegularUsers.map((user: any, index: number) => renderUserRow(user, index))
//                     ) : (
//                       <TableRow>
//                         <TableCell colSpan={8} className="text-center py-4">
//                           {loading ? "Loading users..." : "No regular users found"}
//                         </TableCell>
//                       </TableRow>
//                     )}
//                   </TableBody>
//                 </Table>
//               </div>
//             </TabsContent>

//             <TabsContent value="admins" className="mt-4">
//               <div className="w-full overflow-x-auto">
//                 <Table>
//                   <TableHeader>
//                     <TableRow className="border-border hover:bg-muted/50">
//                       <TableHead className="text-foreground w-[15%]">Name</TableHead>
//                       <TableHead className="text-foreground w-[18%]">Email</TableHead>
//                       <TableHead className="text-foreground w-[12%]">Phone</TableHead>
//                       <TableHead className="text-foreground w-[15%]">Department(s)</TableHead>
//                       <TableHead className="text-foreground w-[10%]">Role</TableHead>
//                       <TableHead className="text-foreground w-[12%]">Reports To</TableHead>
//                       <TableHead className="text-foreground w-[8%]">Status</TableHead>
//                       <TableHead className="text-foreground w-[10%]">Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {filteredAdminUsers.length > 0 ? (
//                       filteredAdminUsers.map((user: any, index: number) => renderUserRow(user, index))
//                     ) : (
//                       <TableRow>
//                         <TableCell colSpan={8} className="text-center py-4">
//                           {adminsLoading ? "Loading admins..." : "No admin users found"}
//                         </TableCell>
//                       </TableRow>
//                     )}
//                   </TableBody>
//                 </Table>
//               </div>
//             </TabsContent>
//           </Tabs>
//         </CardContent>
//       </Card>

//       {/* Employee Modal */}
//       {showEmployeeModal && (
//         <EmployeeModal
//           key={`employee-modal-${selectedUserForEmployee?.user_id?._id || 'new'}`}
//           isOpen={showEmployeeModal}
//           onClose={closeEmployeeModal}
//           mode={employeeModalMode}
//           selectedUser={selectedUserForEmployee}
//           onSave={handleEmployeeSave}
//         />
//       )}

//       {/* 🔥 FIX: Enhanced Dialog with manual close handling */}
//       <Dialog 
//         open={showNewUserReplaceModal} 
//         onOpenChange={(open) => {
//           if (!open) {
//             closeNewUserReplaceModal();
//           }
//         }}
//       >
//         <DialogContent className="sm:max-w-[500px]">
//           <DialogHeader>
//             <DialogTitle>Replace with New User</DialogTitle>
//             <DialogDescription>
//               Create a new user to replace{" "}
//               <strong>{selectedUserForNewUserReplace?.user_id?.name}</strong> in their
//               current role.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="grid gap-4 py-4">
//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="new-user-name">
//                   Full Name <span className="text-destructive">*</span>
//                 </Label>
//                 <Input
//                   id="new-user-name"
//                   placeholder="Enter full name"
//                   value={newUserReplaceForm.name}
//                   onChange={(e) => handleNewUserReplaceInputChange("name", e.target.value)}
//                   disabled={newUserReplaceLoading}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="new-user-email">
//                   Email <span className="text-destructive">*</span>
//                 </Label>
//                 <Input
//                   id="new-user-email"
//                   type="email"
//                   placeholder="example@company.com"
//                   value={newUserReplaceForm.email}
//                   onChange={(e) => handleNewUserReplaceInputChange("email", e.target.value)}
//                   disabled={newUserReplaceLoading}
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="new-user-phone">
//                 Phone Number <span className="text-destructive">*</span>
//               </Label>
//               <Input
//                 id="new-user-phone"
//                 placeholder="1234567890"
//                 value={newUserReplaceForm.phoneNumber}
//                 onChange={(e) => handleNewUserReplaceInputChange("phoneNumber", e.target.value)}
//                 disabled={newUserReplaceLoading}
//               />
//             </div>

//             <div className="space-y-2">
//               <Label>
//                 Departments <span className="text-destructive">*</span>
//               </Label>
//               <Popover open={newUserDepartmentPopoverOpen} onOpenChange={setNewUserDepartmentPopoverOpen}>
//                 <PopoverTrigger asChild>
//                   <Button
//                     variant="outline"
//                     role="combobox"
//                     aria-expanded={newUserDepartmentPopoverOpen}
//                     className="w-full justify-between"
//                     disabled={newUserReplaceLoading}
//                   >
//                     <div className="flex items-center gap-1 overflow-hidden">
//                       {selectedNewUserDepartments.length === 0 ? (
//                         <span className="text-muted-foreground">Select departments...</span>
//                       ) : selectedNewUserDepartments.length === 1 ? (
//                         <span>{selectedNewUserDepartments[0].name}</span>
//                       ) : (
//                         <span>{selectedNewUserDepartments.length} departments selected</span>
//                       )}
//                     </div>
//                     <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-full p-0" align="start">
//                   <div className="max-h-60 overflow-y-auto">
//                     <div className="flex items-center space-x-2 px-3 py-2 border-b hover:bg-muted">
//                       <Checkbox
//                         id="select-all-new-user"
//                         checked={allNewUserDepartmentsSelected}
//                         onCheckedChange={handleSelectAllNewUserReplaceDepartments}
//                       />
//                       <label
//                         htmlFor="select-all-new-user"
//                         className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
//                       >
//                         Select All
//                       </label>
//                     </div>

//                     {departmentsArray.map((dept) => (
//                       <div
//                         key={dept._id}
//                         className="flex items-center space-x-2 px-3 py-2 hover:bg-muted"
//                       >
//                         <Checkbox
//                           id={`new-user-${dept._id}`}
//                           checked={newUserReplaceForm.departmentId.includes(dept._id)}
//                           onCheckedChange={(checked) => 
//                             handleNewUserReplaceDepartmentToggle(dept._id, checked as boolean)
//                           }
//                         />
//                         <label
//                           htmlFor={`new-user-${dept._id}`}
//                           className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
//                         >
//                           {dept.name} ({dept.alias})
//                         </label>
//                       </div>
//                     ))}
//                   </div>
//                 </PopoverContent>
//               </Popover>

//               {selectedNewUserDepartments.length > 0 && (
//                 <div className="flex flex-wrap gap-1 mt-2">
//                   {selectedNewUserDepartments.map((dept) => (
//                     <div
//                       key={dept._id}
//                       className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
//                     >
//                       <span>{dept.name}</span>
//                       <button
//                         type="button"
//                         onClick={() => handleNewUserReplaceDepartmentToggle(dept._id, false)}
//                         className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
//                         disabled={newUserReplaceLoading}
//                       >
//                         <X className="h-3 w-3" />
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
//               <strong>Note:</strong> The new user will be assigned the same role as the current user 
//               ({selectedUserForNewUserReplace?.roleDefinitionId?.roleName || "Unknown Role"}) 
//               with a default password "12345678".
//             </div>
//           </div>
          
//           <div className="flex justify-end gap-2">
//             <Button variant="outline" onClick={closeNewUserReplaceModal}>
//               Cancel
//             </Button>
//             <Button
//               onClick={handleReplaceWithNewUser}
//               disabled={
//                 !newUserReplaceForm.name || 
//                 !newUserReplaceForm.email || 
//                 !newUserReplaceForm.phoneNumber ||
//                 newUserReplaceForm.departmentId.length === 0 ||
//                 newUserReplaceLoading
//               }
//             >
//               {newUserReplaceLoading ? (
//                 <Loader2 className="h-4 w-4 animate-spin mr-2" />
//               ) : null}
//               Create & Replace User
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>

//       {/* Replace User Modal */}
//       <Dialog 
//         open={showReplaceModal} 
//         onOpenChange={(open) => {
//           if (!open) closeReplaceModal();
//         }}
//       >
//         <DialogContent className="sm:max-w-[425px]">
//           <DialogHeader>
//             <DialogTitle>Replace User</DialogTitle>
//             <DialogDescription>
//               Select a user to replace{" "}
//               <strong>{selectedUserForReplace?.user_id?.name}</strong> in their
//               current role.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="grid gap-4 py-4">
//             <div className="grid gap-2">
//               <Label htmlFor="replacement-user">Select Replacement User</Label>
//               <Select
//                 value={replacementUserId}
//                 onValueChange={setReplacementUserId}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Choose a user..." />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {getAvailableUsers().map((user: any) => (
//                     <SelectItem
//                       key={user.user_id._id}
//                       value={user.user_id._id}
//                     >
//                       {user.user_id.name} ({user.user_id.email})
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
//           <div className="flex justify-end gap-2">
//             <Button variant="outline" onClick={closeReplaceModal}>
//               Cancel
//             </Button>
//             <Button
//               onClick={handleReplaceUser}
//               disabled={!replacementUserId || roleUpdateLoading}
//             >
//               {roleUpdateLoading ? (
//                 <Loader2 className="h-4 w-4 animate-spin mr-2" />
//               ) : null}
//               Replace User
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>

//       {/* Edit User Modal */}
//       {isEditModalOpen && (
//         <EditUserModal
//           key={`edit-modal-${editingUser?.user_id?._id || 'new'}`}
//           user={editingUser}
//           isOpen={isEditModalOpen}
//           onClose={handleCloseModal}
//           onSave={handleSaveUser}
//         />
//       )}
//     </div>
//   );
// }
// "use client";

// import { useState, useEffect, useMemo, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import {
//   Users,
//   UserCheck,
//   UserCog,
//   User,
//   Edit,
//   Loader2,
//   UserX,
//   LogOut,
//   UserMinus,
//   Settings,
//   ChevronDown,
//   UserPlus,
//   X,
//   Building2,
//   Eye,
//   Plus,
//   Crown,
// } from "lucide-react";
// import { toast } from "sonner";
// import { useAppDispatch, useAppSelector } from "@/store/hooks";
// import {
//   fetchUsers,
//   updateUserStatus,
//   clearUserError,
//   updateUserInState,
// } from "@/features/user/userSlice";
// import { fetchDepartments } from "@/features/departments/departmentSlice";
// import {
//   getAllRoles,
//   replaceUserRole,
//   selectRoles,
//   selectReplaceUserLoading,
//   selectNewUserReplaceLoading,
// } from "@/features/role/roleSlice";
// import {
//   fetchEmployees,
//   selectEmployees,
// } from "@/features/employee/employeeSlice";
// // Import admin slice
// import { getAdminUsers } from "@/features/newUser/newUserSlice";
// import EditUserModal from "./EditUserModal";
// import EmployeeModal from "./EmployeeModel";

// export default function UserOverviewPage() {
//   const router = useRouter();
//   const dispatch = useAppDispatch();
  
//   // State management with proper initialization
//   const [searchTerm, setSearchTerm] = useState("");
//   const [editingUser, setEditingUser] = useState<any>(null);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

//   // Role management state
//   const [roleActionUserId, setRoleActionUserId] = useState<string | null>(null);
//   const [showReplaceModal, setShowReplaceModal] = useState(false);
//   const [selectedUserForReplace, setSelectedUserForReplace] = useState<any>(null);
//   const [replacementUserId, setReplacementUserId] = useState<string>("");

//   // New User Replacement state
//   const [showNewUserReplaceModal, setShowNewUserReplaceModal] = useState(false);
//   const [selectedUserForNewUserReplace, setSelectedUserForNewUserReplace] = useState<any>(null);
//   const [newUserReplaceForm, setNewUserReplaceForm] = useState({
//     name: "",
//     email: "",
//     phoneNumber: "",
//     departmentId: [] as string[]
//   });
//   const [newUserDepartmentPopoverOpen, setNewUserDepartmentPopoverOpen] = useState(false);

//   // Employee Modal State
//   const [showEmployeeModal, setShowEmployeeModal] = useState(false);
//   const [employeeModalMode, setEmployeeModalMode] = useState<'create' | 'view' | 'edit'>('create');
//   const [selectedUserForEmployee, setSelectedUserForEmployee] = useState<any>(null);

//   // Redux selectors - ADD admin state
//   const { users, loading, error } = useAppSelector((state) => state.users);
//   const { admins, loading: adminsLoading } = useAppSelector((state) => state.newUser);
//   const isOrganizer = useAppSelector((state) => state.auth.isOrganizer);
//   const isSuperUser = useAppSelector((state) => state.auth.isSuperUser);
//   const userRole = useAppSelector((state) => state.auth.role);
//   const orgPermissions = useAppSelector((state) => state.auth.orgPermissions);
//   const hrmsPermissions = useAppSelector((state) => state.auth.hrmsPermissions);
//   const { departments } = useAppSelector((state) => state.departments);
//   const roles = useAppSelector(selectRoles);
//   const roleUpdateLoading = useAppSelector(selectReplaceUserLoading);
//   const newUserReplaceLoading = useAppSelector(selectNewUserReplaceLoading);
//   const employees = useAppSelector(selectEmployees);

//   // Check if HRMS is enabled and user has permissions
//   const isHRMSEnabled = orgPermissions?.isHRMS_enabled || false;
//   const canCreateEmployee = isHRMSEnabled && (
//     isSuperUser || 
//     isOrganizer || 
//     hrmsPermissions?.includes('create_employee') || 
//     hrmsPermissions?.includes('manage_employees')
//   );

//   // MODIFIED: Single useEffect for initial data fetching - ADD getAdminUsers
//   useEffect(() => {
//     const fetchInitialData = async () => {
//       try {
//         await Promise.all([
//           dispatch(fetchUsers()),
//           dispatch(fetchDepartments({})),
//           dispatch(getAllRoles()),
//           dispatch(getAdminUsers()) // Fetch admin users
//         ]);
        
//         // Fetch employees only if HRMS is enabled
//         if (isHRMSEnabled) {
//           await dispatch(fetchEmployees({}));
//         }
//       } catch (error) {
//         console.error("Failed to fetch initial data:", error);
//       }
//     };

//     fetchInitialData();
//   }, [dispatch]);

//   // FIXED: Separate useEffect for HRMS-related data
//   useEffect(() => {
//     if (isHRMSEnabled && employees.length === 0) {
//       dispatch(fetchEmployees({}));
//     }
//   }, [isHRMSEnabled, dispatch, employees.length]);

//   // FIXED: Error handling effect
//   useEffect(() => {
//     if (error) {
//       toast.error(error);
//       dispatch(clearUserError());
//     }
//   }, [error, dispatch]);

//   // FIXED: Cleanup effect
//   useEffect(() => {
//     return () => {
//       dispatch(clearUserError());
//     };
//   }, [dispatch]);

//   // NEW: Combine users and admins into a single list
//   const combinedUsersList = useMemo(() => {
//     const combinedList = [];
    
//     // Add regular users
//     const regularUsers = users.map(user => ({
//       ...user,
//       userType: 'regular',
//       displayName: user.user_id?.name || 'N/A',
//       displayEmail: user.user_id?.email || 'N/A',
//       displayPhone: user.user_id?.phoneNumber || 'N/A',
//       isActive: user.user_id?.isActive !== false && user.status === 'active'
//     }));
    
//     // Add admin users with proper structure
//     const adminUsers = admins.map(admin => ({
//       _id: admin._id,
//       user_id: {
//         _id: admin._id,
//         name: admin.name,
//         email: admin.email,
//         phoneNumber: 'N/A', // Admins might not have phone in the response
//         isActive: admin.isActive !== false
//       },
//       userType: 'admin',
//       displayName: admin.name,
//       displayEmail: admin.email,
//       displayPhone: 'N/A',
//       isActive: admin.isActive !== false,
//       status: admin.isActive !== false ? 'active' : 'inactive',
//       roleDefinitionId: {
//         roleName: 'ADMIN',
//         hierarchyLevel: 0
//       },
//       departments: [], // Admins might not have specific departments
//       parentRoleId: null // Admins don't report to anyone
//     }));
    
//     combinedList.push(...regularUsers, ...adminUsers);
    
//     return combinedList;
//   }, [users, admins]);

//   // Memoized helper functions to prevent recreations
//   const getCreateRoute = useCallback(() => {
//     if (isOrganizer || userRole?.toLowerCase() === "admin") {
//       return "/dashboard/admin/user_overview/create";
//     } else {
//       return "/dashboard/dynamic/user_overview/create";
//     }
//   }, [isOrganizer, userRole]);

//   // Helper function to check if user has employee profile
//   const hasEmployeeProfile = useCallback((userId: string) => {
//     return employees.some((employee: any) => 
//       employee.userId === userId || employee.userId?._id === userId
//     );
//   }, [employees]);

//   // Employee Modal Functions - FIXED with useCallback
//   const openCreateEmployeeModal = useCallback((user: any) => {
//     // Don't allow employee creation for admin users
//     if (user.userType === 'admin') {
//       toast.error("Cannot create employee profile for admin users");
//       return;
//     }
    
//     const userWithExistingRole = {
//       ...user,
//       isExistingUser: true,
//       existingRoleDefinitionId: user.roleDefinitionId?._id || null,
//       existingRoleName: user.roleDefinitionId?.roleName || "Unknown Role"
//     };
//     setSelectedUserForEmployee(userWithExistingRole);
//     setEmployeeModalMode('create');
//     setShowEmployeeModal(true);
//   }, []);

//   const openViewEmployeeModal = useCallback((user: any) => {
//     setSelectedUserForEmployee(user);
//     setEmployeeModalMode('view');
//     setShowEmployeeModal(true);
//   }, []);

//   const openEditEmployeeModal = useCallback((user: any) => {
//     setSelectedUserForEmployee(user);
//     setEmployeeModalMode('edit');
//     setShowEmployeeModal(true);
//   }, []);

//   const closeEmployeeModal = useCallback(() => {
//     setShowEmployeeModal(false);
//     setSelectedUserForEmployee(null);
//     setEmployeeModalMode('create');
//   }, []);

//   const handleEmployeeSave = useCallback(() => {
//     // Refresh users data after employee operations
//     dispatch(fetchUsers());
//     if (isHRMSEnabled) {
//       dispatch(fetchEmployees({}));
//     }
//   }, [dispatch, isHRMSEnabled]);

//   // MODIFIED: Metrics calculation with combined users
//   const metrics = useMemo(
//     () => ({
//       total: combinedUsersList.length,
//       active: combinedUsersList.filter(u => u.isActive).length,
//       managers: combinedUsersList.filter(
//         (u: any) =>
//           u.roleDefinitionId?.roleName === "MANAGER" ||
//           u.roleDefinitionId?.roleName === "TL" ||
//           (u.roleDefinitionId?.hierarchyLevel && u.roleDefinitionId.hierarchyLevel <= 3)
//       ).length,
//       members: combinedUsersList.filter(
//         (u: any) =>
//           u.roleDefinitionId?.roleName === "Associate" ||
//           (u.roleDefinitionId?.hierarchyLevel && u.roleDefinitionId.hierarchyLevel > 3)
//       ).length,
//       admins: combinedUsersList.filter(u => u.userType === 'admin').length,
//     }),
//     [combinedUsersList]
//   );

//   // MODIFIED: Filtering with combined users
//   const filteredUsers = useMemo(
//     () =>
//       combinedUsersList.filter((user: any) => {
//         const name = user.displayName || "";
//         const email = user.displayEmail || "";
//         return (
//           name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           email.toLowerCase().includes(searchTerm.toLowerCase())
//         );
//       }),
//     [combinedUsersList, searchTerm]
//   );

//   // FIXED: Memoized helper functions
//   const getDepartmentNames = useCallback((user: any) => {
//     // For admin users, return empty array or "All Departments"
//     if (user.userType === 'admin') {
//       return [{ name: 'All Departments', alias: 'ALL' }];
//     }
    
//     let userDepartments = [];

//     if (user.departments && user.departments.length > 0) {
//       userDepartments = user.departments;
//     }
//     else if (
//       user.user_id?.departmentId &&
//       user.user_id.departmentId.length > 0 &&
//       departments.length > 0
//     ) {
//       userDepartments = user.user_id.departmentId
//         .map((deptId: string) => {
//           const department = departments.find((dept: any) => dept._id === deptId);
//           return department
//             ? { name: department.name, alias: department.alias }
//             : null;
//         })
//         .filter(Boolean);
//     }

//     return userDepartments;
//   }, [departments]);

//   // MODIFIED: Updated getReportingManager function
//   const getReportingManager = useCallback((user: any) => {
//     // For admin users, always return "N/A"
//     if (user.userType === 'admin') {
//       return "N/A";
//     }
    
//     // Check if regular user has a parent role
//     if (user.parentRoleId?.user_id?.name) {
//       return user.parentRoleId.user_id.name;
//     }
    
//     // For regular users without parent role, show admins
//     if (admins && admins.length > 0) {
//       if (admins.length === 1) {
//         return (
//           <div className="flex items-center gap-1">
//             <Badge variant="outline" className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200">
//               Admin
//             </Badge>
//             <span className="text-xs">{admins[0].name}</span>
//           </div>
//         );
//       } else {
//         return (
//           <Popover>
//             <PopoverTrigger asChild>
//               <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-800 text-xs">
//                 View Admins ({admins.length})
//               </Button>
//             </PopoverTrigger>
//             <PopoverContent className="w-80">
//               <div className="space-y-2">
//                 <h4 className="font-medium text-sm">Organization Admins</h4>
//                 <div className="space-y-1 max-h-40 overflow-y-auto">
//                   {admins.map((admin) => (
//                     <div key={admin._id} className="flex items-center justify-between p-1 hover:bg-muted rounded">
//                       <span className="text-sm">{admin.name}</span>
//                       <span className="text-xs text-muted-foreground truncate ml-2">{admin.email}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </PopoverContent>
//           </Popover>
//         );
//       }
//     }
    
//     return "N/A";
//   }, [admins]);

//   const getRoleName = useCallback((user: any) => {
//     if (user.userType === 'admin') {
//       return 'ADMIN';
//     }
//     return user.roleDefinitionId?.roleName || "Member";
//   }, []);

//   const getStatusColor = useCallback((isActive: boolean) => {
//     return isActive
//       ? "bg-green-500/20 text-green-600 dark:bg-green-500/30 dark:text-green-400 border-green-500/50"
//       : "bg-red-500/20 text-red-600 dark:bg-red-500/30 dark:text-red-400 border-red-500/50";
//   }, []);

//   const isUserActive = useCallback((user: any) => {
//     return user.isActive;
//   }, []);

//   // MODIFIED: Allow editing admin users
//   const handleEditUser = useCallback((user: any) => {
//     setEditingUser(user);
//     setIsEditModalOpen(true);
//   }, []);

//   // MODIFIED: Handle toggle active for both regular users and admins
//   const handleToggleActive = useCallback(async (user: any) => {
//     if (!user?.user_id?._id) return;

//     const userId = user.user_id._id;
//     const currentStatus = isUserActive(user);
//     const newStatus = !currentStatus;

//     setUpdatingUserId(userId);

//     try {
//       if (user.userType === 'admin') {
//         // For admin users, you might need a different API call
//         // For now, we'll show a message that admin status toggle is not fully implemented
//         toast.info("Admin status toggle functionality will be implemented based on your admin API");
//         // You might want to call a different API here for admin users
//         // await dispatch(updateAdminStatus({ id: userId, isActive: newStatus })).unwrap();
        
//         // Refresh admin data
//         dispatch(getAdminUsers());
//         return;
//       }

//       await dispatch(
//         updateUserStatus({
//           id: userId,
//           isActive: newStatus,
//         })
//       ).unwrap();

//       toast.success(
//         `User ${currentStatus ? "deactivated" : "activated"} successfully`
//       );
//       dispatch(fetchUsers());
//     } catch (error: any) {
//       dispatch(
//         updateUserInState({
//           id: userId,
//           updates: { status: currentStatus ? "active" : "inactive" },
//         })
//       );
//       toast.error(error || "Failed to update user status");
//     } finally {
//       setUpdatingUserId(null);
//     }
//   }, [dispatch, isUserActive]);

//   const handleSaveUser = useCallback((updatedUser: any) => {
//     setEditingUser(null);
//     setIsEditModalOpen(false);
    
//     // Refresh both regular users and admin users
//     dispatch(fetchUsers());
//     dispatch(getAdminUsers());
//   }, [dispatch]);

//   const handleCloseModal = useCallback(() => {
//     setEditingUser(null);
//     setIsEditModalOpen(false);
//   }, []);

//   // MODIFIED: Role management functions - exclude admins
//   const handleReplaceUser = useCallback(async () => {
//     if (!selectedUserForReplace?.user_id?._id || !replacementUserId) return;

//     if (selectedUserForReplace.userType === 'admin') {
//       toast.error("Admin users cannot be replaced");
//       return;
//     }

//     setRoleActionUserId(selectedUserForReplace.user_id._id);

//     try {
//       await dispatch(
//         replaceUserRole({
//           oldUserId: selectedUserForReplace.user_id._id,
//           newUserId: replacementUserId,
//           mode: "replace",
//         })
//       ).unwrap();

//       toast.success("User replaced successfully!");
//       dispatch(fetchUsers());
//       setShowReplaceModal(false);
//       setSelectedUserForReplace(null);
//       setReplacementUserId("");
//     } catch (error: any) {
//       toast.error(error || "Failed to replace user");
//     } finally {
//       setRoleActionUserId(null);
//     }
//   }, [dispatch, selectedUserForReplace, replacementUserId]);

//   // Rest of the handlers remain the same but add admin checks...
//   const handleNewUserReplaceInputChange = useCallback((field: string, value: string | string[]) => {
//     setNewUserReplaceForm(prev => ({ ...prev, [field]: value }));
//   }, []);

//   const handleNewUserReplaceDepartmentToggle = useCallback((departmentId: string, checked: boolean) => {
//     setNewUserReplaceForm(prev => ({
//       ...prev,
//       departmentId: checked 
//         ? [...prev.departmentId, departmentId]
//         : prev.departmentId.filter(id => id !== departmentId)
//     }));
//   }, []);

//   const handleSelectAllNewUserReplaceDepartments = useCallback((checked: boolean) => {
//     const departmentsArray = Array.isArray(departments) ? departments : [];
//     setNewUserReplaceForm(prev => ({
//       ...prev,
//       departmentId: checked ? departmentsArray.map(dept => dept._id) : []
//     }));
//   }, [departments]);

//   const openNewUserReplaceModal = useCallback((user: any) => {
//     if (user.userType === 'admin') {
//       toast.error("Admin users cannot be replaced");
//       return;
//     }
//     setSelectedUserForNewUserReplace(user);
//     setShowNewUserReplaceModal(true);
//     setNewUserReplaceForm({
//       name: "",
//       email: "",
//       phoneNumber: "",
//       departmentId: []
//     });
//   }, []);

//   const closeNewUserReplaceModal = useCallback(() => {
//     setShowNewUserReplaceModal(false);
//     setSelectedUserForNewUserReplace(null);
//     setNewUserReplaceForm({
//       name: "",
//       email: "",
//       phoneNumber: "",
//       departmentId: []
//     });
//   }, []);

//   const handleReplaceWithNewUser = useCallback(async () => {
//     // Validation
//     if (!newUserReplaceForm.name.trim()) {
//       toast.error("Full name is required");
//       return;
//     }
//     if (!newUserReplaceForm.email.trim()) {
//       toast.error("Email is required");
//       return;
//     }
//     if (!newUserReplaceForm.phoneNumber.trim()) {
//       toast.error("Phone number is required");
//       return;
//     }
//     if (newUserReplaceForm.departmentId.length === 0) {
//       toast.error("At least one department is required");
//       return;
//     }

//     if (!selectedUserForNewUserReplace?.user_id?._id) return;

//     setRoleActionUserId(selectedUserForNewUserReplace.user_id._id);

//     try {
//       const userData = {
//         name: newUserReplaceForm.name,
//         email: newUserReplaceForm.email,
//         phoneNumber: newUserReplaceForm.phoneNumber,
//         departmentId: newUserReplaceForm.departmentId,
//         password: "12345678",
//         roleDefinitionId: selectedUserForNewUserReplace.roleDefinitionId._id
//       };

//       await dispatch(
//         replaceUserRole({
//           oldUserId: selectedUserForNewUserReplace.user_id._id,
//           newUserId: "",
//           mode: "newuserreplace",
//           newRoleDefId: selectedUserForNewUserReplace.roleDefinitionId._id,
//           userData: userData,
//         })
//       ).unwrap();

//       toast.success("User replaced with new user successfully!");
//       dispatch(fetchUsers());
//       closeNewUserReplaceModal();
//     } catch (error: any) {
//       toast.error(error || "Failed to replace user with new user");
//     } finally {
//       setRoleActionUserId(null);
//     }
//   }, [dispatch, newUserReplaceForm, selectedUserForNewUserReplace, closeNewUserReplaceModal]);

//   const handleUserLeave = useCallback(async (user: any) => {
//     if (!user?.user_id?._id) return;

//     if (user.userType === 'admin') {
//       toast.error("Admin users cannot be removed");
//       return;
//     }

//     setRoleActionUserId(user.user_id._id);

//     try {
//       await dispatch(
//         replaceUserRole({
//           oldUserId: user.user_id._id,
//           newUserId: "",
//           mode: "leave",
//         })
//       ).unwrap();

//       toast.success("User removed from role successfully!");
//       dispatch(fetchUsers());
//     } catch (error: any) {
//       toast.error(error || "Failed to remove user from role");
//     } finally {
//       setRoleActionUserId(null);
//     }
//   }, [dispatch]);

//   const openReplaceModal = useCallback((user: any) => {
//     if (user.userType === 'admin') {
//       toast.error("Admin users cannot be replaced");
//       return;
//     }
//     setSelectedUserForReplace(user);
//     setShowReplaceModal(true);
//   }, []);

//   const closeReplaceModal = useCallback(() => {
//     setShowReplaceModal(false);
//     setSelectedUserForReplace(null);
//     setReplacementUserId("");
//   }, []);

//   // Get available users for replacement (excluding the current user and admins)
//   const getAvailableUsers = useCallback(() => {
//     return combinedUsersList.filter(
//       (user: any) =>
//         user.user_id?._id !== selectedUserForReplace?.user_id?._id &&
//         user.userType !== 'admin' &&
//         isUserActive(user)
//     );
//   }, [combinedUsersList, selectedUserForReplace, isUserActive]);

//   // Helper functions for new user replacement modal - memoized
//   const departmentsArray = useMemo(() => Array.isArray(departments) ? departments : [], [departments]);
//   const selectedNewUserDepartments = useMemo(() => 
//     departmentsArray.filter(dept => 
//       newUserReplaceForm.departmentId.includes(dept._id)
//     ), [departmentsArray, newUserReplaceForm.departmentId]
//   );
//   const allNewUserDepartmentsSelected = useMemo(() => 
//     departmentsArray.length > 0 && 
//     newUserReplaceForm.departmentId.length === departmentsArray.length,
//     [departmentsArray, newUserReplaceForm.departmentId]
//   );

//   return (
//     <div className="p-6 space-y-6 bg-background text-foreground">
//       <h1 className="text-xl font-semibold">User Overview</h1>

//       {/* MODIFIED: Metrics with admin count */}
//       <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//         {[
//           { icon: Users, title: metrics.total, label: "Total Users", color: "text-blue-600" },
//           { icon: UserCheck, title: metrics.active, label: "Active Users", color: "text-green-600" },
//           { icon: Crown, title: metrics.admins, label: "Admins", color: "text-red-600" },
//           { icon: UserCog, title: metrics.managers, label: "Managers/TLs", color: "text-purple-600" },
//           { icon: User, title: metrics.members, label: "Associates", color: "text-gray-600" },
//         ].map(({ icon: Icon, title, label, color }, index) => (
//           <Card key={index} className="bg-card border-border">
//             <CardHeader className="items-center flex justify-center flex-col">
//               <Icon className={`${color} h-6 w-6`} />
//               <CardTitle className="text-foreground">{title}</CardTitle>
//               <p className="text-sm text-muted-foreground">{label}</p>
//             </CardHeader>
//           </Card>
//         ))}
//       </div>

//       {/* Search and Actions */}
//       <div className="flex flex-col md:flex-row justify-between gap-4">
//         <Input
//           placeholder="Search by name or email..."
//           className="md:w-1/3 bg-input text-foreground border-input"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//         <div className="flex gap-2">
//           <Button
//             variant="default"
//             className="bg-primary text-primary-foreground hover:bg-primary/90"
//             onClick={() => router.push(getCreateRoute())}
//           >
//             <UserPlus className="h-4 w-4 mr-2" />
//             New User
//           </Button>
//         </div>
//       </div>

//       {/* Users Table */}
//       <Card className="bg-card border-border">
//         <CardHeader>
//           <div className="flex justify-between items-center">
//             <div>
//               <CardTitle className="text-xl font-semibold text-foreground">
//                 All Users & Admins
//               </CardTitle>
//               <p className="text-sm text-muted-foreground">
//                 Overview of all users including administrators
//               </p>
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="w-full">
//             <Table>
//               <TableHeader>
//                 <TableRow className="border-border hover:bg-muted/50">
//                   <TableHead className="text-foreground w-[15%]">Name</TableHead>
//                   <TableHead className="text-foreground w-[18%]">Email</TableHead>
//                   <TableHead className="text-foreground w-[12%]">Phone</TableHead>
//                   <TableHead className="text-foreground w-[15%]">
//                     Department(s)
//                   </TableHead>
//                   <TableHead className="text-foreground w-[10%]">Role</TableHead>
//                   <TableHead className="text-foreground w-[12%]">
//                     Reports To
//                   </TableHead>
//                   <TableHead className="text-foreground w-[8%]">Status</TableHead>
//                   <TableHead className="text-foreground w-[10%]">Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredUsers.length > 0 ? (
//                   filteredUsers.map((user: any, index: number) => {
//                     const isUpdating = updatingUserId === user.user_id?._id;
//                     const isRoleUpdating = roleActionUserId === user.user_id?._id;
//                     const userIsActive = isUserActive(user);
//                     const userDepartments = getDepartmentNames(user);
//                     const userHasEmployeeProfile = isHRMSEnabled && user.userType !== 'admin' ? hasEmployeeProfile(user.user_id?._id) : false;
                    
//                     return (
//                       <TableRow
//                         key={`${user._id}-${user.user_id?._id}-${index}`}
//                         className={`border-border hover:bg-muted/50 ${
//                           user.userType === 'admin' ? 'bg-red-50/50 dark:bg-red-900/10' : ''
//                         }`}
//                       >
//                         <TableCell className="text-foreground w-[15%]">
//                           <div className="flex items-center gap-2">
//                             {user.userType === 'admin' && (
//                               <Crown className="h-4 w-4 text-red-600" />
//                             )}
//                             <div
//                               className="truncate"
//                               title={user.displayName || "N/A"}
//                             >
//                               {user.displayName || "N/A"}
//                             </div>
//                           </div>
//                         </TableCell>
//                         <TableCell className="text-foreground w-[18%]">
//                           <div
//                             className="truncate"
//                             title={user.displayEmail || "N/A"}
//                           >
//                             {user.displayEmail || "N/A"}
//                           </div>
//                         </TableCell>
//                         <TableCell className="text-foreground w-[12%]">
//                           {user.displayPhone || "N/A"}
//                         </TableCell>
//                         <TableCell className="text-foreground w-[15%]">
//                           {userDepartments.length > 0 ? (
//                             <div
//                               className="flex flex-col gap-1 max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-1"
//                             >
//                               {userDepartments.map((dept: any, deptIndex: number) => (
//                                 <Badge
//                                   key={deptIndex}
//                                   variant="secondary"
//                                   className={`text-xs px-2 py-1 w-fit flex-shrink-0 ${
//                                     user.userType === 'admin' 
//                                       ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-700'
//                                       : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700'
//                                   }`}
//                                   title={dept.name}
//                                 >
//                                   <span className="truncate max-w-[80px]">
//                                     {dept.name}
//                                   </span>
//                                 </Badge>
//                               ))}
//                             </div>
//                           ) : (
//                             <span className="text-muted-foreground">N/A</span>
//                           )}
//                         </TableCell>
//                         <TableCell className="w-[10%]">
//                           <Badge
//                             variant="outline"
//                             className={`capitalize border-border text-foreground text-xs ${
//                               user.userType === 'admin' 
//                                 ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200'
//                                 : 'bg-muted'
//                             }`}
//                             title={getRoleName(user)}
//                           >
//                             <span className="truncate max-w-[60px]">
//                               {getRoleName(user).toLowerCase()}
//                             </span>
//                           </Badge>
//                         </TableCell>
//                         {/* MODIFIED: Reports To column */}
//                         <TableCell className="text-foreground w-[12%]">
//                           <div className="truncate">
//                             {getReportingManager(user)}
//                           </div>
//                         </TableCell>
                        
//                         <TableCell className="w-[8%]">
//                           <Badge
//                             variant="outline"
//                             className={`${getStatusColor(userIsActive)} text-xs`}
//                           >
//                             {userIsActive ? "Active" : "Inactive"}
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="w-[10%]">
//                           <div className="flex gap-1">
//                             {/* MODIFIED: Allow editing for both regular users and admins */}
//                             <Button
//                               variant="ghost"
//                               size="sm"
//                               onClick={() => handleEditUser(user)}
//                               disabled={loading}
//                               className="text-foreground hover:bg-muted p-1 h-8 w-8"
//                               title={user.userType === 'admin' ? 'Edit Admin User' : 'Edit User'}
//                             >
//                               <Edit className="h-3 w-3" />
//                             </Button>

//                             {/* Settings Dropdown - Modified for admins */}
//                             <DropdownMenu>
//                               <DropdownMenuTrigger asChild>
//                                 <Button
//                                   variant="outline"
//                                   size="sm" 
//                                   disabled={isRoleUpdating || roleUpdateLoading || newUserReplaceLoading}
//                                   className="text-xs px-2 py-1 h-8 flex items-center gap-1"
//                                 >
//                                   {isRoleUpdating || roleUpdateLoading || newUserReplaceLoading ? (
//                                     <Loader2 className="h-3 w-3 animate-spin" />
//                                   ) : (
//                                     <>
//                                       <Settings className="h-3 w-3" />
//                                       <ChevronDown className="h-3 w-3" />
//                                     </>
//                                   )}
//                                 </Button>
//                               </DropdownMenuTrigger>
//                               <DropdownMenuContent align="end" className="w-56">
//                                 <DropdownMenuLabel>
//                                   {user.userType === 'admin' ? 'Admin Actions' : 'User Actions'}
//                                 </DropdownMenuLabel>
//                                 <DropdownMenuSeparator />

//                                 {/* HRMS Employee Management Section - Only for regular users */}
//                                 {isHRMSEnabled && canCreateEmployee && user.userType !== 'admin' && (
//                                   <>
//                                     <DropdownMenuLabel className="text-blue-600 dark:text-blue-400 text-xs">
//                                       Employee Management
//                                     </DropdownMenuLabel>
                                    
//                                     {userHasEmployeeProfile ? (
//                                       <>
//                                         <DropdownMenuItem
//                                           onClick={() => openViewEmployeeModal(user)}
//                                           className="text-blue-600 focus:text-blue-600"
//                                         >
//                                           <Eye className="h-4 w-4 mr-2" />
//                                           View Employee Details
//                                         </DropdownMenuItem>
//                                         <DropdownMenuItem
//                                           onClick={() => openEditEmployeeModal(user)}
//                                           className="text-green-600 focus:text-green-600"
//                                         >
//                                           <Edit className="h-4 w-4 mr-2" />
//                                           Edit Employee Profile
//                                         </DropdownMenuItem>
//                                       </>
//                                     ) : (
//                                       <DropdownMenuItem
//                                         onClick={() => openCreateEmployeeModal(user)}
//                                         className="text-green-600 focus:text-green-600"
//                                       >
//                                         <Plus className="h-4 w-4 mr-2" />
//                                         Create Employee Profile
//                                       </DropdownMenuItem>
//                                     )}
                                    
//                                     <DropdownMenuSeparator />
//                                   </>
//                                 )}

//                                 {/* Role Management Section - Only for regular users */}
//                                 {user.userType !== 'admin' && (
//                                   <>
//                                     <DropdownMenuLabel className="text-xs">Role Actions</DropdownMenuLabel>
                                    
//                                     <DropdownMenuItem
//                                       onClick={() => openNewUserReplaceModal(user)}
//                                     >
//                                       <UserPlus className="h-4 w-4 mr-2" />
//                                       Replace with New User
//                                     </DropdownMenuItem>

//                                     <DropdownMenuItem
//                                       onClick={() => openReplaceModal(user)}
//                                     >
//                                       <UserX className="h-4 w-4 mr-2" />
//                                       Replace with Existing User
//                                     </DropdownMenuItem>

//                                     <DropdownMenuItem
//                                       onClick={() => handleUserLeave(user)}
//                                       className="text-red-600 focus:text-red-600"
//                                     >
//                                       <LogOut className="h-4 w-4 mr-2" />
//                                       Remove from Role
//                                     </DropdownMenuItem>

//                                     <DropdownMenuSeparator />
//                                   </>
//                                 )}

//                                 {/* MODIFIED: Status toggle - Allow for admins with different behavior */}
//                                 <DropdownMenuItem
//                                   onClick={() => handleToggleActive(user)}
//                                   disabled={isUpdating}
//                                 >
//                                   {isUpdating ? (
//                                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                                   ) : userIsActive ? (
//                                     <UserMinus className="h-4 w-4 mr-2" />
//                                   ) : (
//                                     <UserCheck className="h-4 w-4 mr-2" />
//                                   )}
//                                   {user.userType === 'admin' 
//                                     ? (userIsActive ? "Deactivate Admin" : "Activate Admin")
//                                     : (userIsActive ? "Deactivate" : "Activate")
//                                   }
//                                 </DropdownMenuItem>
//                               </DropdownMenuContent>
//                             </DropdownMenu>
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     );
//                   })
//                 ) : (
//                   <TableRow>
//                     <TableCell colSpan={8} className="text-center py-4">
//                       {loading || adminsLoading ? "Loading users..." : "No users found"}
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Employee Modal */}
//       {showEmployeeModal && (
//         <EmployeeModal
//           key={`employee-modal-${selectedUserForEmployee?.user_id?._id || 'new'}`}
//           isOpen={showEmployeeModal}
//           onClose={closeEmployeeModal}
//           mode={employeeModalMode}
//           selectedUser={selectedUserForEmployee}
//           onSave={handleEmployeeSave}
//         />
//       )}

//       {/* Replace with New User Modal */}
//       {showNewUserReplaceModal && (
//         <Dialog open={showNewUserReplaceModal} onOpenChange={setShowNewUserReplaceModal}>
//           <DialogContent className="sm:max-w-[500px]">
//             <DialogHeader>
//               <DialogTitle>Replace with New User</DialogTitle>
//               <DialogDescription>
//                 Create a new user to replace{" "}
//                 <strong>{selectedUserForNewUserReplace?.user_id?.name}</strong> in their
//                 current role.
//               </DialogDescription>
//             </DialogHeader>
//             <div className="grid gap-4 py-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="new-user-name">
//                     Full Name <span className="text-destructive">*</span>
//                   </Label>
//                   <Input
//                     id="new-user-name"
//                     placeholder="Enter full name"
//                     value={newUserReplaceForm.name}
//                     onChange={(e) => handleNewUserReplaceInputChange("name", e.target.value)}
//                     disabled={newUserReplaceLoading}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="new-user-email">
//                     Email <span className="text-destructive">*</span>
//                   </Label>
//                   <Input
//                     id="new-user-email"
//                     type="email"
//                     placeholder="example@company.com"
//                     value={newUserReplaceForm.email}
//                     onChange={(e) => handleNewUserReplaceInputChange("email", e.target.value)}
//                     disabled={newUserReplaceLoading}
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="new-user-phone">
//                   Phone Number <span className="text-destructive">*</span>
//                 </Label>
//                 <Input
//                   id="new-user-phone"
//                   placeholder="1234567890"
//                   value={newUserReplaceForm.phoneNumber}
//                   onChange={(e) => handleNewUserReplaceInputChange("phoneNumber", e.target.value)}
//                   disabled={newUserReplaceLoading}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label>
//                   Departments <span className="text-destructive">*</span>
//                 </Label>
//                 <Popover open={newUserDepartmentPopoverOpen} onOpenChange={setNewUserDepartmentPopoverOpen}>
//                   <PopoverTrigger asChild>
//                     <Button
//                       variant="outline"
//                       role="combobox"
//                       aria-expanded={newUserDepartmentPopoverOpen}
//                       className="w-full justify-between"
//                       disabled={newUserReplaceLoading}
//                     >
//                       <div className="flex items-center gap-1 overflow-hidden">
//                         {selectedNewUserDepartments.length === 0 ? (
//                           <span className="text-muted-foreground">Select departments...</span>
//                         ) : selectedNewUserDepartments.length === 1 ? (
//                           <span>{selectedNewUserDepartments[0].name}</span>
//                         ) : (
//                           <span>{selectedNewUserDepartments.length} departments selected</span>
//                         )}
//                       </div>
//                       <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                     </Button>
//                   </PopoverTrigger>
//                   <PopoverContent className="w-full p-0" align="start">
//                     <div className="max-h-60 overflow-y-auto">
//                       <div className="flex items-center space-x-2 px-3 py-2 border-b hover:bg-muted">
//                         <Checkbox
//                           id="select-all-new-user"
//                           checked={allNewUserDepartmentsSelected}
//                           onCheckedChange={handleSelectAllNewUserReplaceDepartments}
//                         />
//                         <label
//                           htmlFor="select-all-new-user"
//                           className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
//                         >
//                           Select All
//                         </label>
//                       </div>

//                       {departmentsArray.map((dept) => (
//                         <div
//                           key={dept._id}
//                           className="flex items-center space-x-2 px-3 py-2 hover:bg-muted"
//                         >
//                           <Checkbox
//                             id={`new-user-${dept._id}`}
//                             checked={newUserReplaceForm.departmentId.includes(dept._id)}
//                             onCheckedChange={(checked) => 
//                               handleNewUserReplaceDepartmentToggle(dept._id, checked as boolean)
//                             }
//                           />
//                           <label
//                             htmlFor={`new-user-${dept._id}`}
//                             className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
//                           >
//                             {dept.name} ({dept.alias})
//                           </label>
//                         </div>
//                       ))}
//                     </div>
//                   </PopoverContent>
//                 </Popover>

//                 {selectedNewUserDepartments.length > 0 && (
//                   <div className="flex flex-wrap gap-1 mt-2">
//                     {selectedNewUserDepartments.map((dept) => (
//                       <div
//                         key={dept._id}
//                         className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
//                       >
//                         <span>{dept.name}</span>
//                         <button
//                           type="button"
//                           onClick={() => handleNewUserReplaceDepartmentToggle(dept._id, false)}
//                           className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
//                           disabled={newUserReplaceLoading}
//                         >
//                           <X className="h-3 w-3" />
//                         </button>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
//                 <strong>Note:</strong> The new user will be assigned the same role as the current user 
//                 ({selectedUserForNewUserReplace?.roleDefinitionId?.roleName || "Unknown Role"}) 
//                 with a default password "12345678".
//               </div>
//             </div>
            
//             <div className="flex justify-end gap-2">
//               <Button variant="outline" onClick={closeNewUserReplaceModal}>
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleReplaceWithNewUser}
//                 disabled={
//                   !newUserReplaceForm.name || 
//                   !newUserReplaceForm.email || 
//                   !newUserReplaceForm.phoneNumber ||
//                   newUserReplaceForm.departmentId.length === 0 ||
//                   newUserReplaceLoading
//                 }
//               >
//                 {newUserReplaceLoading ? (
//                   <Loader2 className="h-4 w-4 animate-spin mr-2" />
//                 ) : null}
//                 Create & Replace User
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       )}

//       {/* Replace User Modal */}
//       {showReplaceModal && (
//         <Dialog open={showReplaceModal} onOpenChange={setShowReplaceModal}>
//           <DialogContent className="sm:max-w-[425px]">
//             <DialogHeader>
//               <DialogTitle>Replace User</DialogTitle>
//               <DialogDescription>
//                 Select a user to replace{" "}
//                 <strong>{selectedUserForReplace?.user_id?.name}</strong> in their
//                 current role.
//               </DialogDescription>
//             </DialogHeader>
//             <div className="grid gap-4 py-4">
//               <div className="grid gap-2">
//                 <Label htmlFor="replacement-user">Select Replacement User</Label>
//                 <Select
//                   value={replacementUserId}
//                   onValueChange={setReplacementUserId}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Choose a user..." />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {getAvailableUsers().map((user: any) => (
//                       <SelectItem
//                         key={user.user_id._id}
//                         value={user.user_id._id}
//                       >
//                         {user.user_id.name} ({user.user_id.email})
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
//             <div className="flex justify-end gap-2">
//               <Button variant="outline" onClick={closeReplaceModal}>
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleReplaceUser}
//                 disabled={!replacementUserId || roleUpdateLoading}
//               >
//                 {roleUpdateLoading ? (
//                   <Loader2 className="h-4 w-4 animate-spin mr-2" />
//                 ) : null}
//                 Replace User
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       )}

//       {/* Edit Modal - Now allows editing admin users */}
//       {isEditModalOpen && (
//         <EditUserModal
//           key={`edit-modal-${editingUser?.user_id?._id || 'new'}`}
//           user={editingUser}
//           isOpen={isEditModalOpen}
//           onClose={handleCloseModal}
//           onSave={handleSaveUser}
//         />
//       )}
//     </div>
//   );
// }

// "use client";

// import { useState, useEffect, useMemo, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import {
//   Users,
//   UserCheck,
//   UserCog,
//   User,
//   Edit,
//   Loader2,
//   UserX,
//   LogOut,
//   UserMinus,
//   Settings,
//   ChevronDown,
//   UserPlus,
//   X,
//   Building2,
//   Eye,
//   Plus,
//   Crown,
// } from "lucide-react";
// import { toast } from "sonner";
// import { useAppDispatch, useAppSelector } from "@/store/hooks";
// import {
//   fetchUsers,
//   updateUserStatus,
//   clearUserError,
//   updateUserInState,
// } from "@/features/user/userSlice";
// import { fetchDepartments } from "@/features/departments/departmentSlice";
// import {
//   getAllRoles,
//   replaceUserRole,
//   selectRoles,
//   selectReplaceUserLoading,
//   selectNewUserReplaceLoading,
// } from "@/features/role/roleSlice";
// import {
//   fetchEmployees,
//   selectEmployees,
// } from "@/features/employee/employeeSlice";
// // Import admin slice
// import { getAdminUsers } from "@/features/newUser/newUserSlice";
// import EditUserModal from "./EditUserModal";
// import EmployeeModal from "./EmployeeModel";

// export default function UserOverviewPage() {
//   const router = useRouter();
//   const dispatch = useAppDispatch();
  
//   // State management with proper initialization
//   const [searchTerm, setSearchTerm] = useState("");
//   const [editingUser, setEditingUser] = useState<any>(null);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

//   // Role management state
//   const [roleActionUserId, setRoleActionUserId] = useState<string | null>(null);
//   const [showReplaceModal, setShowReplaceModal] = useState(false);
//   const [selectedUserForReplace, setSelectedUserForReplace] = useState<any>(null);
//   const [replacementUserId, setReplacementUserId] = useState<string>("");

//   // New User Replacement state
//   const [showNewUserReplaceModal, setShowNewUserReplaceModal] = useState(false);
//   const [selectedUserForNewUserReplace, setSelectedUserForNewUserReplace] = useState<any>(null);
//   const [newUserReplaceForm, setNewUserReplaceForm] = useState({
//     name: "",
//     email: "",
//     phoneNumber: "",
//     departmentId: [] as string[]
//   });
//   const [newUserDepartmentPopoverOpen, setNewUserDepartmentPopoverOpen] = useState(false);

//   // Employee Modal State
//   const [showEmployeeModal, setShowEmployeeModal] = useState(false);
//   const [employeeModalMode, setEmployeeModalMode] = useState<'create' | 'view' | 'edit'>('create');
//   const [selectedUserForEmployee, setSelectedUserForEmployee] = useState<any>(null);

//   // Redux selectors - ADD admin state
//   const { users, loading, error } = useAppSelector((state) => state.users);
//   const { admins, loading: adminsLoading } = useAppSelector((state) => state.newUser);
//   const isOrganizer = useAppSelector((state) => state.auth.isOrganizer);
//   const isSuperUser = useAppSelector((state) => state.auth.isSuperUser);
//   const userRole = useAppSelector((state) => state.auth.role);
//   const orgPermissions = useAppSelector((state) => state.auth.orgPermissions);
//   const hrmsPermissions = useAppSelector((state) => state.auth.hrmsPermissions);
//   const { departments } = useAppSelector((state) => state.departments);
//   const roles = useAppSelector(selectRoles);
//   const roleUpdateLoading = useAppSelector(selectReplaceUserLoading);
//   const newUserReplaceLoading = useAppSelector(selectNewUserReplaceLoading);
//   const employees = useAppSelector(selectEmployees);

//   // Check if HRMS is enabled and user has permissions
//   const isHRMSEnabled = orgPermissions?.isHRMS_enabled || false;
//   const canCreateEmployee = isHRMSEnabled && (
//     isSuperUser || 
//     isOrganizer || 
//     hrmsPermissions?.includes('create_employee') || 
//     hrmsPermissions?.includes('manage_employees')
//   );

//   // MODIFIED: Single useEffect for initial data fetching - ADD getAdminUsers
//   useEffect(() => {
//     const fetchInitialData = async () => {
//       try {
//         await Promise.all([
//           dispatch(fetchUsers()),
//           dispatch(fetchDepartments({})),
//           dispatch(getAllRoles()),
//           dispatch(getAdminUsers()) // Fetch admin users
//         ]);
        
//         // Fetch employees only if HRMS is enabled
//         if (isHRMSEnabled) {
//           await dispatch(fetchEmployees({}));
//         }
//       } catch (error) {
//         console.error("Failed to fetch initial data:", error);
//       }
//     };

//     fetchInitialData();
//   }, [dispatch]);

//   // FIXED: Separate useEffect for HRMS-related data
//   useEffect(() => {
//     if (isHRMSEnabled && employees.length === 0) {
//       dispatch(fetchEmployees({}));
//     }
//   }, [isHRMSEnabled, dispatch, employees.length]);

//   // FIXED: Error handling effect
//   useEffect(() => {
//     if (error) {
//       toast.error(error);
//       dispatch(clearUserError());
//     }
//   }, [error, dispatch]);

//   // FIXED: Cleanup effect
//   useEffect(() => {
//     return () => {
//       dispatch(clearUserError());
//     };
//   }, [dispatch]);

//   // NEW: Combine users and admins into a single list
//   const combinedUsersList = useMemo(() => {
//     const combinedList = [];
    
//     // Add regular users
//     const regularUsers = users.map(user => ({
//       ...user,
//       userType: 'regular',
//       displayName: user.user_id?.name || 'N/A',
//       displayEmail: user.user_id?.email || 'N/A',
//       displayPhone: user.user_id?.phoneNumber || 'N/A',
//       isActive: user.user_id?.isActive !== false && user.status === 'active'
//     }));
    
//     // Add admin users with proper structure
//     const adminUsers = admins.map(admin => ({
//       _id: admin._id,
//       user_id: {
//         _id: admin._id,
//         name: admin.name,
//         email: admin.email,
//         phoneNumber: 'N/A', // Admins might not have phone in the response
//         isActive: admin.isActive !== false
//       },
//       userType: 'admin',
//       displayName: admin.name,
//       displayEmail: admin.email,
//       displayPhone: 'N/A',
//       isActive: admin.isActive !== false,
//       status: admin.isActive !== false ? 'active' : 'inactive',
//       roleDefinitionId: {
//         roleName: 'ADMIN',
//         hierarchyLevel: 0
//       },
//       departments: [], // Admins might not have specific departments
//       parentRoleId: null // Admins don't report to anyone
//     }));
    
//     combinedList.push(...regularUsers, ...adminUsers);
    
//     return combinedList;
//   }, [users, admins]);

//   // Memoized helper functions to prevent recreations
//   const getCreateRoute = useCallback(() => {
//     if (isOrganizer || userRole?.toLowerCase() === "admin") {
//       return "/dashboard/admin/user_overview/create";
//     } else {
//       return "/dashboard/dynamic/user_overview/create";
//     }
//   }, [isOrganizer, userRole]);

//   // Helper function to check if user has employee profile
//   const hasEmployeeProfile = useCallback((userId: string) => {
//     return employees.some((employee: any) => 
//       employee.userId === userId || employee.userId?._id === userId
//     );
//   }, [employees]);

//   // Employee Modal Functions - FIXED with useCallback
//   const openCreateEmployeeModal = useCallback((user: any) => {
//     // Don't allow employee creation for admin users
//     if (user.userType === 'admin') {
//       toast.error("Cannot create employee profile for admin users");
//       return;
//     }
    
//     const userWithExistingRole = {
//       ...user,
//       isExistingUser: true,
//       existingRoleDefinitionId: user.roleDefinitionId?._id || null,
//       existingRoleName: user.roleDefinitionId?.roleName || "Unknown Role"
//     };
//     setSelectedUserForEmployee(userWithExistingRole);
//     setEmployeeModalMode('create');
//     setShowEmployeeModal(true);
//   }, []);

//   const openViewEmployeeModal = useCallback((user: any) => {
//     setSelectedUserForEmployee(user);
//     setEmployeeModalMode('view');
//     setShowEmployeeModal(true);
//   }, []);

//   const openEditEmployeeModal = useCallback((user: any) => {
//     setSelectedUserForEmployee(user);
//     setEmployeeModalMode('edit');
//     setShowEmployeeModal(true);
//   }, []);

//   const closeEmployeeModal = useCallback(() => {
//     setShowEmployeeModal(false);
//     setSelectedUserForEmployee(null);
//     setEmployeeModalMode('create');
//   }, []);

//   const handleEmployeeSave = useCallback(() => {
//     // Refresh users data after employee operations
//     dispatch(fetchUsers());
//     if (isHRMSEnabled) {
//       dispatch(fetchEmployees({}));
//     }
//   }, [dispatch, isHRMSEnabled]);

//   // MODIFIED: Metrics calculation with combined users
//   const metrics = useMemo(
//     () => ({
//       total: combinedUsersList.length,
//       active: combinedUsersList.filter(u => u.isActive).length,
//       managers: combinedUsersList.filter(
//         (u: any) =>
//           u.roleDefinitionId?.roleName === "MANAGER" ||
//           u.roleDefinitionId?.roleName === "TL" ||
//           u.roleDefinitionId?.hierarchyLevel <= 3
//       ).length,
//       members: combinedUsersList.filter(
//         (u: any) =>
//           u.roleDefinitionId?.roleName === "Associate" ||
//           u.roleDefinitionId?.hierarchyLevel > 3
//       ).length,
//       admins: combinedUsersList.filter(u => u.userType === 'admin').length,
//     }),
//     [combinedUsersList]
//   );

//   // MODIFIED: Filtering with combined users
//   const filteredUsers = useMemo(
//     () =>
//       combinedUsersList.filter((user: any) => {
//         const name = user.displayName || "";
//         const email = user.displayEmail || "";
//         return (
//           name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           email.toLowerCase().includes(searchTerm.toLowerCase())
//         );
//       }),
//     [combinedUsersList, searchTerm]
//   );

//   // FIXED: Memoized helper functions
//   const getDepartmentNames = useCallback((user: any) => {
//     // For admin users, return empty array or "All Departments"
//     if (user.userType === 'admin') {
//       return [{ name: 'All Departments', alias: 'ALL' }];
//     }
    
//     let userDepartments = [];

//     if (user.departments && user.departments.length > 0) {
//       userDepartments = user.departments;
//     }
//     else if (
//       user.user_id?.departmentId &&
//       user.user_id.departmentId.length > 0 &&
//       departments.length > 0
//     ) {
//       userDepartments = user.user_id.departmentId
//         .map((deptId: string) => {
//           const department = departments.find((dept: any) => dept._id === deptId);
//           return department
//             ? { name: department.name, alias: department.alias }
//             : null;
//         })
//         .filter(Boolean);
//     }

//     return userDepartments;
//   }, [departments]);

//   // MODIFIED: Updated getReportingManager function
//   const getReportingManager = useCallback((user: any) => {
//     // For admin users, always return "N/A"
//     if (user.userType === 'admin') {
//       return "N/A";
//     }
    
//     // Check if regular user has a parent role
//     if (user.parentRoleId?.user_id?.name) {
//       return user.parentRoleId.user_id.name;
//     }
    
//     // For regular users without parent role, show admins
//     if (admins && admins.length > 0) {
//       if (admins.length === 1) {
//         return (
//           <div className="flex items-center gap-1">
//             <Badge variant="outline" className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200">
//               Admin
//             </Badge>
//             <span className="text-xs">{admins[0].name}</span>
//           </div>
//         );
//       } else {
//         return (
//           <Popover>
//             <PopoverTrigger asChild>
//               <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-800 text-xs">
//                 View Admins ({admins.length})
//               </Button>
//             </PopoverTrigger>
//             <PopoverContent className="w-80">
//               <div className="space-y-2">
//                 <h4 className="font-medium text-sm">Organization Admins</h4>
//                 <div className="space-y-1 max-h-40 overflow-y-auto">
//                   {admins.map((admin) => (
//                     <div key={admin._id} className="flex items-center justify-between p-1 hover:bg-muted rounded">
//                       <span className="text-sm">{admin.name}</span>
//                       <span className="text-xs text-muted-foreground truncate ml-2">{admin.email}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </PopoverContent>
//           </Popover>
//         );
//       }
//     }
    
//     return "N/A";
//   }, [admins]);

//   const getRoleName = useCallback((user: any) => {
//     if (user.userType === 'admin') {
//       return 'ADMIN';
//     }
//     return user.roleDefinitionId?.roleName || "Member";
//   }, []);

//   const getStatusColor = useCallback((isActive: boolean) => {
//     return isActive
//       ? "bg-green-500/20 text-green-600 dark:bg-green-500/30 dark:text-green-400 border-green-500/50"
//       : "bg-red-500/20 text-red-600 dark:bg-red-500/30 dark:text-red-400 border-red-500/50";
//   }, []);

//   const isUserActive = useCallback((user: any) => {
//     return user.isActive;
//   }, []);

//   // MODIFIED: Handle toggle active for both regular users and admins
//   const handleToggleActive = useCallback(async (user: any) => {
//     if (!user?.user_id?._id) return;
    
//     // For admin users, show a message that they can't be deactivated
//     if (user.userType === 'admin') {
//       toast.error("Admin users cannot be deactivated from this interface");
//       return;
//     }

//     const userId = user.user_id._id;
//     const currentStatus = isUserActive(user);
//     const newStatus = !currentStatus;

//     setUpdatingUserId(userId);

//     try {
//       await dispatch(
//         updateUserStatus({
//           id: userId,
//           isActive: newStatus,
//         })
//       ).unwrap();

//       toast.success(
//         `User ${currentStatus ? "deactivated" : "activated"} successfully`
//       );
//       dispatch(fetchUsers());
//     } catch (error: any) {
//       dispatch(
//         updateUserInState({
//           id: userId,
//           updates: { status: currentStatus ? "active" : "inactive" },
//         })
//       );
//       toast.error(error || "Failed to update user status");
//     } finally {
//       setUpdatingUserId(null);
//     }
//   }, [dispatch, isUserActive]);

//   const handleEditUser = useCallback((user: any) => {
//     // Don't allow editing admin users
//     if (user.userType === 'admin') {
//       toast.error("Admin users cannot be edited from this interface");
//       return;
//     }
//     setEditingUser(user);
//     setIsEditModalOpen(true);
//   }, []);

//   const handleSaveUser = useCallback((updatedUser: any) => {
//     setEditingUser(null);
//     setIsEditModalOpen(false);
//     dispatch(fetchUsers());
//   }, [dispatch]);

//   const handleCloseModal = useCallback(() => {
//     setEditingUser(null);
//     setIsEditModalOpen(false);
//   }, []);

//   // MODIFIED: Role management functions - exclude admins
//   const handleReplaceUser = useCallback(async () => {
//     if (!selectedUserForReplace?.user_id?._id || !replacementUserId) return;

//     if (selectedUserForReplace.userType === 'admin') {
//       toast.error("Admin users cannot be replaced");
//       return;
//     }

//     setRoleActionUserId(selectedUserForReplace.user_id._id);

//     try {
//       await dispatch(
//         replaceUserRole({
//           oldUserId: selectedUserForReplace.user_id._id,
//           newUserId: replacementUserId,
//           mode: "replace",
//         })
//       ).unwrap();

//       toast.success("User replaced successfully!");
//       dispatch(fetchUsers());
//       setShowReplaceModal(false);
//       setSelectedUserForReplace(null);
//       setReplacementUserId("");
//     } catch (error: any) {
//       toast.error(error || "Failed to replace user");
//     } finally {
//       setRoleActionUserId(null);
//     }
//   }, [dispatch, selectedUserForReplace, replacementUserId]);

//   // Rest of the handlers remain the same but add admin checks...
//   const handleNewUserReplaceInputChange = useCallback((field: string, value: string | string[]) => {
//     setNewUserReplaceForm(prev => ({ ...prev, [field]: value }));
//   }, []);

//   const handleNewUserReplaceDepartmentToggle = useCallback((departmentId: string, checked: boolean) => {
//     setNewUserReplaceForm(prev => ({
//       ...prev,
//       departmentId: checked 
//         ? [...prev.departmentId, departmentId]
//         : prev.departmentId.filter(id => id !== departmentId)
//     }));
//   }, []);

//   const handleSelectAllNewUserReplaceDepartments = useCallback((checked: boolean) => {
//     const departmentsArray = Array.isArray(departments) ? departments : [];
//     setNewUserReplaceForm(prev => ({
//       ...prev,
//       departmentId: checked ? departmentsArray.map(dept => dept._id) : []
//     }));
//   }, [departments]);

//   const openNewUserReplaceModal = useCallback((user: any) => {
//     if (user.userType === 'admin') {
//       toast.error("Admin users cannot be replaced");
//       return;
//     }
//     setSelectedUserForNewUserReplace(user);
//     setShowNewUserReplaceModal(true);
//     setNewUserReplaceForm({
//       name: "",
//       email: "",
//       phoneNumber: "",
//       departmentId: []
//     });
//   }, []);

//   const closeNewUserReplaceModal = useCallback(() => {
//     setShowNewUserReplaceModal(false);
//     setSelectedUserForNewUserReplace(null);
//     setNewUserReplaceForm({
//       name: "",
//       email: "",
//       phoneNumber: "",
//       departmentId: []
//     });
//   }, []);

//   const handleReplaceWithNewUser = useCallback(async () => {
//     // Validation
//     if (!newUserReplaceForm.name.trim()) {
//       toast.error("Full name is required");
//       return;
//     }
//     if (!newUserReplaceForm.email.trim()) {
//       toast.error("Email is required");
//       return;
//     }
//     if (!newUserReplaceForm.phoneNumber.trim()) {
//       toast.error("Phone number is required");
//       return;
//     }
//     if (newUserReplaceForm.departmentId.length === 0) {
//       toast.error("At least one department is required");
//       return;
//     }

//     if (!selectedUserForNewUserReplace?.user_id?._id) return;

//     setRoleActionUserId(selectedUserForNewUserReplace.user_id._id);

//     try {
//       const userData = {
//         name: newUserReplaceForm.name,
//         email: newUserReplaceForm.email,
//         phoneNumber: newUserReplaceForm.phoneNumber,
//         departmentId: newUserReplaceForm.departmentId,
//         password: "12345678",
//         roleDefinitionId: selectedUserForNewUserReplace.roleDefinitionId._id
//       };

//       await dispatch(
//         replaceUserRole({
//           oldUserId: selectedUserForNewUserReplace.user_id._id,
//           newUserId: "",
//           mode: "newuserreplace",
//           newRoleDefId: selectedUserForNewUserReplace.roleDefinitionId._id,
//           userData: userData,
//         })
//       ).unwrap();

//       toast.success("User replaced with new user successfully!");
//       dispatch(fetchUsers());
//       closeNewUserReplaceModal();
//     } catch (error: any) {
//       toast.error(error || "Failed to replace user with new user");
//     } finally {
//       setRoleActionUserId(null);
//     }
//   }, [dispatch, newUserReplaceForm, selectedUserForNewUserReplace, closeNewUserReplaceModal]);

//   const handleUserLeave = useCallback(async (user: any) => {
//     if (!user?.user_id?._id) return;

//     if (user.userType === 'admin') {
//       toast.error("Admin users cannot be removed");
//       return;
//     }

//     setRoleActionUserId(user.user_id._id);

//     try {
//       await dispatch(
//         replaceUserRole({
//           oldUserId: user.user_id._id,
//           newUserId: "",
//           mode: "leave",
//         })
//       ).unwrap();

//       toast.success("User removed from role successfully!");
//       dispatch(fetchUsers());
//     } catch (error: any) {
//       toast.error(error || "Failed to remove user from role");
//     } finally {
//       setRoleActionUserId(null);
//     }
//   }, [dispatch]);

//   const openReplaceModal = useCallback((user: any) => {
//     if (user.userType === 'admin') {
//       toast.error("Admin users cannot be replaced");
//       return;
//     }
//     setSelectedUserForReplace(user);
//     setShowReplaceModal(true);
//   }, []);

//   const closeReplaceModal = useCallback(() => {
//     setShowReplaceModal(false);
//     setSelectedUserForReplace(null);
//     setReplacementUserId("");
//   }, []);

//   // Get available users for replacement (excluding the current user and admins)
//   const getAvailableUsers = useCallback(() => {
//     return combinedUsersList.filter(
//       (user: any) =>
//         user.user_id?._id !== selectedUserForReplace?.user_id?._id &&
//         user.userType !== 'admin' &&
//         isUserActive(user)
//     );
//   }, [combinedUsersList, selectedUserForReplace, isUserActive]);

//   // Helper functions for new user replacement modal - memoized
//   const departmentsArray = useMemo(() => Array.isArray(departments) ? departments : [], [departments]);
//   const selectedNewUserDepartments = useMemo(() => 
//     departmentsArray.filter(dept => 
//       newUserReplaceForm.departmentId.includes(dept._id)
//     ), [departmentsArray, newUserReplaceForm.departmentId]
//   );
//   const allNewUserDepartmentsSelected = useMemo(() => 
//     departmentsArray.length > 0 && 
//     newUserReplaceForm.departmentId.length === departmentsArray.length,
//     [departmentsArray, newUserReplaceForm.departmentId]
//   );

//   return (
//     <div className="p-6 space-y-6 bg-background text-foreground">
//       <h1 className="text-xl font-semibold">User Overview</h1>

//       {/* MODIFIED: Metrics with admin count */}
//       <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//         {[
//           { icon: Users, title: metrics.total, label: "Total Users", color: "text-blue-600" },
//           { icon: UserCheck, title: metrics.active, label: "Active Users", color: "text-green-600" },
//           { icon: Crown, title: metrics.admins, label: "Admins", color: "text-red-600" },
//           { icon: UserCog, title: metrics.managers, label: "Managers/TLs", color: "text-purple-600" },
//           { icon: User, title: metrics.members, label: "Associates", color: "text-gray-600" },
//         ].map(({ icon: Icon, title, label, color }, index) => (
//           <Card key={index} className="bg-card border-border">
//             <CardHeader className="items-center flex justify-center flex-col">
//               <Icon className={`${color} h-6 w-6`} />
//               <CardTitle className="text-foreground">{title}</CardTitle>
//               <p className="text-sm text-muted-foreground">{label}</p>
//             </CardHeader>
//           </Card>
//         ))}
//       </div>

//       {/* Search and Actions */}
//       <div className="flex flex-col md:flex-row justify-between gap-4">
//         <Input
//           placeholder="Search by name or email..."
//           className="md:w-1/3 bg-input text-foreground border-input"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//         <div className="flex gap-2">
//           <Button
//             variant="default"
//             className="bg-primary text-primary-foreground hover:bg-primary/90"
//             onClick={() => router.push(getCreateRoute())}
//           >
//             <UserPlus className="h-4 w-4 mr-2" />
//             New User
//           </Button>
//         </div>
//       </div>

//       {/* Users Table */}
//       <Card className="bg-card border-border">
//         <CardHeader>
//           <div className="flex justify-between items-center">
//             <div>
//               <CardTitle className="text-xl font-semibold text-foreground">
//                 All Users & Admins
//               </CardTitle>
//               <p className="text-sm text-muted-foreground">
//                 Overview of all users including administrators
//               </p>
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="w-full">
//             <Table>
//               <TableHeader>
//                 <TableRow className="border-border hover:bg-muted/50">
//                   <TableHead className="text-foreground w-[15%]">Name</TableHead>
//                   <TableHead className="text-foreground w-[18%]">Email</TableHead>
//                   <TableHead className="text-foreground w-[12%]">Phone</TableHead>
//                   <TableHead className="text-foreground w-[15%]">
//                     Department(s)
//                   </TableHead>
//                   <TableHead className="text-foreground w-[10%]">Role</TableHead>
//                   <TableHead className="text-foreground w-[12%]">
//                     Reports To
//                   </TableHead>
//                   <TableHead className="text-foreground w-[8%]">Status</TableHead>
//                   <TableHead className="text-foreground w-[10%]">Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredUsers.length > 0 ? (
//                   filteredUsers.map((user: any, index: number) => {
//                     const isUpdating = updatingUserId === user.user_id?._id;
//                     const isRoleUpdating = roleActionUserId === user.user_id?._id;
//                     const userIsActive = isUserActive(user);
//                     const userDepartments = getDepartmentNames(user);
//                     const userHasEmployeeProfile = isHRMSEnabled && user.userType !== 'admin' ? hasEmployeeProfile(user.user_id?._id) : false;
                    
//                     return (
//                       <TableRow
//                         key={`${user._id}-${user.user_id?._id}-${index}`}
//                         className={`border-border hover:bg-muted/50 ${
//                           user.userType === 'admin' ? 'bg-red-50/50 dark:bg-red-900/10' : ''
//                         }`}
//                       >
//                         <TableCell className="text-foreground w-[15%]">
//                           <div className="flex items-center gap-2">
//                             {user.userType === 'admin' && (
//                               <Crown className="h-4 w-4 text-red-600" />
//                             )}
//                             <div
//                               className="truncate"
//                               title={user.displayName || "N/A"}
//                             >
//                               {user.displayName || "N/A"}
//                             </div>
//                           </div>
//                         </TableCell>
//                         <TableCell className="text-foreground w-[18%]">
//                           <div
//                             className="truncate"
//                             title={user.displayEmail || "N/A"}
//                           >
//                             {user.displayEmail || "N/A"}
//                           </div>
//                         </TableCell>
//                         <TableCell className="text-foreground w-[12%]">
//                           {user.displayPhone || "N/A"}
//                         </TableCell>
//                         <TableCell className="text-foreground w-[15%]">
//                           {userDepartments.length > 0 ? (
//                             <div
//                               className="flex flex-col gap-1 max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-1"
//                             >
//                               {userDepartments.map((dept: any, deptIndex: number) => (
//                                 <Badge
//                                   key={deptIndex}
//                                   variant="secondary"
//                                   className={`text-xs px-2 py-1 w-fit flex-shrink-0 ${
//                                     user.userType === 'admin' 
//                                       ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-700'
//                                       : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700'
//                                   }`}
//                                   title={dept.name}
//                                 >
//                                   <span className="truncate max-w-[80px]">
//                                     {dept.name}
//                                   </span>
//                                 </Badge>
//                               ))}
//                             </div>
//                           ) : (
//                             <span className="text-muted-foreground">N/A</span>
//                           )}
//                         </TableCell>
//                         <TableCell className="w-[10%]">
//                           <Badge
//                             variant="outline"
//                             className={`capitalize border-border text-foreground text-xs ${
//                               user.userType === 'admin' 
//                                 ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200'
//                                 : 'bg-muted'
//                             }`}
//                             title={getRoleName(user)}
//                           >
//                             <span className="truncate max-w-[60px]">
//                               {getRoleName(user).toLowerCase()}
//                             </span>
//                           </Badge>
//                         </TableCell>
//                         {/* MODIFIED: Reports To column */}
//                         <TableCell className="text-foreground w-[12%]">
//                           <div className="truncate">
//                             {getReportingManager(user)}
//                           </div>
//                         </TableCell>
                        
//                         <TableCell className="w-[8%]">
//                           <Badge
//                             variant="outline"
//                             className={`${getStatusColor(userIsActive)} text-xs`}
//                           >
//                             {userIsActive ? "Active" : "Inactive"}
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="w-[10%]">
//                           <div className="flex gap-1">
//                             <Button
//                               variant="ghost"
//                               size="sm"
//                               onClick={() => handleEditUser(user)}
//                               disabled={loading || user.userType === 'admin'}
//                               className="text-foreground hover:bg-muted p-1 h-8 w-8"
//                               title={user.userType === 'admin' ? 'Admin users cannot be edited' : 'Edit User'}
//                             >
//                               <Edit className="h-3 w-3" />
//                             </Button>

//                             {/* Settings Dropdown - Modified for admins */}
//                             <DropdownMenu>
//                               <DropdownMenuTrigger asChild>
//                                 <Button
//                                   variant="outline"
//                                   size="sm" 
//                                   disabled={isRoleUpdating || roleUpdateLoading || newUserReplaceLoading}
//                                   className="text-xs px-2 py-1 h-8 flex items-center gap-1"
//                                 >
//                                   {isRoleUpdating || roleUpdateLoading || newUserReplaceLoading ? (
//                                     <Loader2 className="h-3 w-3 animate-spin" />
//                                   ) : (
//                                     <>
//                                       <Settings className="h-3 w-3" />
//                                       <ChevronDown className="h-3 w-3" />
//                                     </>
//                                   )}
//                                 </Button>
//                               </DropdownMenuTrigger>
//                               <DropdownMenuContent align="end" className="w-56">
//                                 <DropdownMenuLabel>
//                                   {user.userType === 'admin' ? 'Admin Actions' : 'User Actions'}
//                                 </DropdownMenuLabel>
//                                 <DropdownMenuSeparator />

//                                 {/* HRMS Employee Management Section - Only for regular users */}
//                                 {isHRMSEnabled && canCreateEmployee && user.userType !== 'admin' && (
//                                   <>
//                                     <DropdownMenuLabel className="text-blue-600 dark:text-blue-400 text-xs">
//                                       Employee Management
//                                     </DropdownMenuLabel>
                                    
//                                     {userHasEmployeeProfile ? (
//                                       <>
//                                         <DropdownMenuItem
//                                           onClick={() => openViewEmployeeModal(user)}
//                                           className="text-blue-600 focus:text-blue-600"
//                                         >
//                                           <Eye className="h-4 w-4 mr-2" />
//                                           View Employee Details
//                                         </DropdownMenuItem>
//                                         <DropdownMenuItem
//                                           onClick={() => openEditEmployeeModal(user)}
//                                           className="text-green-600 focus:text-green-600"
//                                         >
//                                           <Edit className="h-4 w-4 mr-2" />
//                                           Edit Employee Profile
//                                         </DropdownMenuItem>
//                                       </>
//                                     ) : (
//                                       <DropdownMenuItem
//                                         onClick={() => openCreateEmployeeModal(user)}
//                                         className="text-green-600 focus:text-green-600"
//                                       >
//                                         <Plus className="h-4 w-4 mr-2" />
//                                         Create Employee Profile
//                                       </DropdownMenuItem>
//                                     )}
                                    
//                                     <DropdownMenuSeparator />
//                                   </>
//                                 )}

//                                 {/* Role Management Section - Only for regular users */}
//                                 {user.userType !== 'admin' && (
//                                   <>
//                                     <DropdownMenuLabel className="text-xs">Role Actions</DropdownMenuLabel>
                                    
//                                     <DropdownMenuItem
//                                       onClick={() => openNewUserReplaceModal(user)}
//                                     >
//                                       <UserPlus className="h-4 w-4 mr-2" />
//                                       Replace with New User
//                                     </DropdownMenuItem>

//                                     <DropdownMenuItem
//                                       onClick={() => openReplaceModal(user)}
//                                     >
//                                       <UserX className="h-4 w-4 mr-2" />
//                                       Replace with Existing User
//                                     </DropdownMenuItem>

//                                     <DropdownMenuItem
//                                       onClick={() => handleUserLeave(user)}
//                                       className="text-red-600 focus:text-red-600"
//                                     >
//                                       <LogOut className="h-4 w-4 mr-2" />
//                                       Remove from Role
//                                     </DropdownMenuItem>

//                                     <DropdownMenuSeparator />
//                                   </>
//                                 )}

//                                 {/* Status toggle - Different behavior for admins */}
//                                 <DropdownMenuItem
//                                   onClick={() => handleToggleActive(user)}
//                                   disabled={isUpdating || user.userType === 'admin'}
//                                   className={user.userType === 'admin' ? 'opacity-50' : ''}
//                                 >
//                                   {isUpdating ? (
//                                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                                   ) : userIsActive ? (
//                                     <UserMinus className="h-4 w-4 mr-2" />
//                                   ) : (
//                                     <UserCheck className="h-4 w-4 mr-2" />
//                                   )}
//                                   {user.userType === 'admin' 
//                                     ? 'Cannot modify admin status'
//                                     : userIsActive ? "Deactivate" : "Activate"
//                                   }
//                                 </DropdownMenuItem>
//                               </DropdownMenuContent>
//                             </DropdownMenu>
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     );
//                   })
//                 ) : (
//                   <TableRow>
//                     <TableCell colSpan={8} className="text-center py-4">
//                       {loading || adminsLoading ? "Loading users..." : "No users found"}
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         </CardContent>
//       </Card>

//       {/* All existing modals remain the same... */}
//       {/* Employee Modal */}
//       {showEmployeeModal && (
//         <EmployeeModal
//           key={`employee-modal-${selectedUserForEmployee?.user_id?._id || 'new'}`}
//           isOpen={showEmployeeModal}
//           onClose={closeEmployeeModal}
//           mode={employeeModalMode}
//           selectedUser={selectedUserForEmployee}
//           onSave={handleEmployeeSave}
//         />
//       )}

//       {/* Replace with New User Modal */}
//       {showNewUserReplaceModal && (
//         <Dialog open={showNewUserReplaceModal} onOpenChange={setShowNewUserReplaceModal}>
//           <DialogContent className="sm:max-w-[500px]">
//             <DialogHeader>
//               <DialogTitle>Replace with New User</DialogTitle>
//               <DialogDescription>
//                 Create a new user to replace{" "}
//                 <strong>{selectedUserForNewUserReplace?.user_id?.name}</strong> in their
//                 current role.
//               </DialogDescription>
//             </DialogHeader>
//             <div className="grid gap-4 py-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="new-user-name">
//                     Full Name <span className="text-destructive">*</span>
//                   </Label>
//                   <Input
//                     id="new-user-name"
//                     placeholder="Enter full name"
//                     value={newUserReplaceForm.name}
//                     onChange={(e) => handleNewUserReplaceInputChange("name", e.target.value)}
//                     disabled={newUserReplaceLoading}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="new-user-email">
//                     Email <span className="text-destructive">*</span>
//                   </Label>
//                   <Input
//                     id="new-user-email"
//                     type="email"
//                     placeholder="example@company.com"
//                     value={newUserReplaceForm.email}
//                     onChange={(e) => handleNewUserReplaceInputChange("email", e.target.value)}
//                     disabled={newUserReplaceLoading}
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="new-user-phone">
//                   Phone Number <span className="text-destructive">*</span>
//                 </Label>
//                 <Input
//                   id="new-user-phone"
//                   placeholder="1234567890"
//                   value={newUserReplaceForm.phoneNumber}
//                   onChange={(e) => handleNewUserReplaceInputChange("phoneNumber", e.target.value)}
//                   disabled={newUserReplaceLoading}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label>
//                   Departments <span className="text-destructive">*</span>
//                 </Label>
//                 <Popover open={newUserDepartmentPopoverOpen} onOpenChange={setNewUserDepartmentPopoverOpen}>
//                   <PopoverTrigger asChild>
//                     <Button
//                       variant="outline"
//                       role="combobox"
//                       aria-expanded={newUserDepartmentPopoverOpen}
//                       className="w-full justify-between"
//                       disabled={newUserReplaceLoading}
//                     >
//                       <div className="flex items-center gap-1 overflow-hidden">
//                         {selectedNewUserDepartments.length === 0 ? (
//                           <span className="text-muted-foreground">Select departments...</span>
//                         ) : selectedNewUserDepartments.length === 1 ? (
//                           <span>{selectedNewUserDepartments[0].name}</span>
//                         ) : (
//                           <span>{selectedNewUserDepartments.length} departments selected</span>
//                         )}
//                       </div>
//                       <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                     </Button>
//                   </PopoverTrigger>
//                   <PopoverContent className="w-full p-0" align="start">
//                     <div className="max-h-60 overflow-y-auto">
//                       <div className="flex items-center space-x-2 px-3 py-2 border-b hover:bg-muted">
//                         <Checkbox
//                           id="select-all-new-user"
//                           checked={allNewUserDepartmentsSelected}
//                           onCheckedChange={handleSelectAllNewUserReplaceDepartments}
//                         />
//                         <label
//                           htmlFor="select-all-new-user"
//                           className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
//                         >
//                           Select All
//                         </label>
//                       </div>

//                       {departmentsArray.map((dept) => (
//                         <div
//                           key={dept._id}
//                           className="flex items-center space-x-2 px-3 py-2 hover:bg-muted"
//                         >
//                           <Checkbox
//                             id={`new-user-${dept._id}`}
//                             checked={newUserReplaceForm.departmentId.includes(dept._id)}
//                             onCheckedChange={(checked) => 
//                               handleNewUserReplaceDepartmentToggle(dept._id, checked as boolean)
//                             }
//                           />
//                           <label
//                             htmlFor={`new-user-${dept._id}`}
//                             className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
//                           >
//                             {dept.name} ({dept.alias})
//                           </label>
//                         </div>
//                       ))}
//                     </div>
//                   </PopoverContent>
//                 </Popover>

//                 {selectedNewUserDepartments.length > 0 && (
//                   <div className="flex flex-wrap gap-1 mt-2">
//                     {selectedNewUserDepartments.map((dept) => (
//                       <div
//                         key={dept._id}
//                         className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
//                       >
//                         <span>{dept.name}</span>
//                         <button
//                           type="button"
//                           onClick={() => handleNewUserReplaceDepartmentToggle(dept._id, false)}
//                           className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
//                           disabled={newUserReplaceLoading}
//                         >
//                           <X className="h-3 w-3" />
//                         </button>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
//                 <strong>Note:</strong> The new user will be assigned the same role as the current user 
//                 ({selectedUserForNewUserReplace?.roleDefinitionId?.roleName || "Unknown Role"}) 
//                 with a default password "12345678".
//               </div>
//             </div>
            
//             <div className="flex justify-end gap-2">
//               <Button variant="outline" onClick={closeNewUserReplaceModal}>
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleReplaceWithNewUser}
//                 disabled={
//                   !newUserReplaceForm.name || 
//                   !newUserReplaceForm.email || 
//                   !newUserReplaceForm.phoneNumber ||
//                   newUserReplaceForm.departmentId.length === 0 ||
//                   newUserReplaceLoading
//                 }
//               >
//                 {newUserReplaceLoading ? (
//                   <Loader2 className="h-4 w-4 animate-spin mr-2" />
//                 ) : null}
//                 Create & Replace User
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       )}

//       {/* Replace User Modal */}
//       {showReplaceModal && (
//         <Dialog open={showReplaceModal} onOpenChange={setShowReplaceModal}>
//           <DialogContent className="sm:max-w-[425px]">
//             <DialogHeader>
//               <DialogTitle>Replace User</DialogTitle>
//               <DialogDescription>
//                 Select a user to replace{" "}
//                 <strong>{selectedUserForReplace?.user_id?.name}</strong> in their
//                 current role.
//               </DialogDescription>
//             </DialogHeader>
//             <div className="grid gap-4 py-4">
//               <div className="grid gap-2">
//                 <Label htmlFor="replacement-user">Select Replacement User</Label>
//                 <Select
//                   value={replacementUserId}
//                   onValueChange={setReplacementUserId}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Choose a user..." />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {getAvailableUsers().map((user: any) => (
//                       <SelectItem
//                         key={user.user_id._id}
//                         value={user.user_id._id}
//                       >
//                         {user.user_id.name} ({user.user_id.email})
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
//             <div className="flex justify-end gap-2">
//               <Button variant="outline" onClick={closeReplaceModal}>
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleReplaceUser}
//                 disabled={!replacementUserId || roleUpdateLoading}
//               >
//                 {roleUpdateLoading ? (
//                   <Loader2 className="h-4 w-4 animate-spin mr-2" />
//                 ) : null}
//                 Replace User
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       )}

//       {/* Edit Modal */}
//       {isEditModalOpen && (
//         <EditUserModal
//           key={`edit-modal-${editingUser?.user_id?._id || 'new'}`}
//           user={editingUser}
//           isOpen={isEditModalOpen}
//           onClose={handleCloseModal}
//           onSave={handleSaveUser}
//         />
//       )}
//     </div>
//   );
// }

// "use client";

// import { useState, useEffect, useMemo, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import {
//   Users,
//   UserCheck,
//   UserCog,
//   User,
//   Edit,
//   Loader2,
//   UserX,
//   LogOut,
//   UserMinus,
//   Settings,
//   ChevronDown,
//   UserPlus,
//   X,
//   Building2,
//   Eye,
//   Plus,
// } from "lucide-react";
// import { toast } from "sonner";
// import { useAppDispatch, useAppSelector } from "@/store/hooks";
// import {
//   fetchUsers,
//   updateUserStatus,
//   clearUserError,
//   updateUserInState,
// } from "@/features/user/userSlice";
// import { fetchDepartments } from "@/features/departments/departmentSlice";
// import {
//   getAllRoles,
//   replaceUserRole,
//   selectRoles,
//   selectReplaceUserLoading,
//   selectNewUserReplaceLoading,
// } from "@/features/role/roleSlice";
// import {
//   fetchEmployees,
//   selectEmployees,
// } from "@/features/employee/employeeSlice";
// // ADD: Import admin slice
// import { getAdminUsers } from "@/features/newUser/newUserSlice";
// import EditUserModal from "./EditUserModal";
// import EmployeeModal from "./EmployeeModel";

// export default function UserOverviewPage() {
//   const router = useRouter();
//   const dispatch = useAppDispatch();
  
//   // State management with proper initialization
//   const [searchTerm, setSearchTerm] = useState("");
//   const [editingUser, setEditingUser] = useState<any>(null);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

//   // Role management state
//   const [roleActionUserId, setRoleActionUserId] = useState<string | null>(null);
//   const [showReplaceModal, setShowReplaceModal] = useState(false);
//   const [selectedUserForReplace, setSelectedUserForReplace] = useState<any>(null);
//   const [replacementUserId, setReplacementUserId] = useState<string>("");

//   // New User Replacement state
//   const [showNewUserReplaceModal, setShowNewUserReplaceModal] = useState(false);
//   const [selectedUserForNewUserReplace, setSelectedUserForNewUserReplace] = useState<any>(null);
//   const [newUserReplaceForm, setNewUserReplaceForm] = useState({
//     name: "",
//     email: "",
//     phoneNumber: "",
//     departmentId: [] as string[]
//   });
//   const [newUserDepartmentPopoverOpen, setNewUserDepartmentPopoverOpen] = useState(false);

//   // Employee Modal State
//   const [showEmployeeModal, setShowEmployeeModal] = useState(false);
//   const [employeeModalMode, setEmployeeModalMode] = useState<'create' | 'view' | 'edit'>('create');
//   const [selectedUserForEmployee, setSelectedUserForEmployee] = useState<any>(null);

//   // Redux selectors - ADD admin state
//   const { users, loading, error } = useAppSelector((state) => state.users);
//   const { admins, loading: adminsLoading } = useAppSelector((state) => state.newUser); // ADD this line
//   const isOrganizer = useAppSelector((state) => state.auth.isOrganizer);
//   const isSuperUser = useAppSelector((state) => state.auth.isSuperUser);
//   const userRole = useAppSelector((state) => state.auth.role);
//   const orgPermissions = useAppSelector((state) => state.auth.orgPermissions);
//   const hrmsPermissions = useAppSelector((state) => state.auth.hrmsPermissions);
//   const { departments } = useAppSelector((state) => state.departments);
//   const roles = useAppSelector(selectRoles);
//   const roleUpdateLoading = useAppSelector(selectReplaceUserLoading);
//   const newUserReplaceLoading = useAppSelector(selectNewUserReplaceLoading);
//   const employees = useAppSelector(selectEmployees);

//   // Check if HRMS is enabled and user has permissions
//   const isHRMSEnabled = orgPermissions?.isHRMS_enabled || false;
//   const canCreateEmployee = isHRMSEnabled && (
//     isSuperUser || 
//     isOrganizer || 
//     hrmsPermissions?.includes('create_employee') || 
//     hrmsPermissions?.includes('manage_employees')
//   );

//   // MODIFIED: Single useEffect for initial data fetching - ADD getAdminUsers
//   useEffect(() => {
//     const fetchInitialData = async () => {
//       try {
//         await Promise.all([
//           dispatch(fetchUsers()),
//           dispatch(fetchDepartments({})),
//           dispatch(getAllRoles()),
//           dispatch(getAdminUsers()) // ADD this line
//         ]);
        
//         // Fetch employees only if HRMS is enabled
//         if (isHRMSEnabled) {
//           await dispatch(fetchEmployees({}));
//         }
//       } catch (error) {
//         console.error("Failed to fetch initial data:", error);
//       }
//     };

//     fetchInitialData();
//   }, [dispatch]);

//   // FIXED: Separate useEffect for HRMS-related data
//   useEffect(() => {
//     if (isHRMSEnabled && employees.length === 0) {
//       dispatch(fetchEmployees({}));
//     }
//   }, [isHRMSEnabled, dispatch, employees.length]);

//   // FIXED: Error handling effect
//   useEffect(() => {
//     if (error) {
//       toast.error(error);
//       dispatch(clearUserError());
//     }
//   }, [error, dispatch]);

//   // FIXED: Cleanup effect
//   useEffect(() => {
//     return () => {
//       dispatch(clearUserError());
//     };
//   }, [dispatch]);

//   // Memoized helper functions to prevent recreations
//   const getCreateRoute = useCallback(() => {
//     if (isOrganizer || userRole?.toLowerCase() === "admin") {
//       return "/dashboard/admin/user_overview/create";
//     } else {
//       return "/dashboard/dynamic/user_overview/create";
//     }
//   }, [isOrganizer, userRole]);

//   // Helper function to check if user has employee profile
//   const hasEmployeeProfile = useCallback((userId: string) => {
//     return employees.some((employee: any) => 
//       employee.userId === userId || employee.userId?._id === userId
//     );
//   }, [employees]);

//   // Employee Modal Functions - FIXED with useCallback
//   const openCreateEmployeeModal = useCallback((user: any) => {
//     const userWithExistingRole = {
//       ...user,
//       isExistingUser: true,
//       existingRoleDefinitionId: user.roleDefinitionId?._id || null,
//       existingRoleName: user.roleDefinitionId?.roleName || "Unknown Role"
//     };
//     setSelectedUserForEmployee(userWithExistingRole);
//     setEmployeeModalMode('create');
//     setShowEmployeeModal(true);
//   }, []);

//   const openViewEmployeeModal = useCallback((user: any) => {
//     setSelectedUserForEmployee(user);
//     setEmployeeModalMode('view');
//     setShowEmployeeModal(true);
//   }, []);

//   const openEditEmployeeModal = useCallback((user: any) => {
//     setSelectedUserForEmployee(user);
//     setEmployeeModalMode('edit');
//     setShowEmployeeModal(true);
//   }, []);

//   const closeEmployeeModal = useCallback(() => {
//     setShowEmployeeModal(false);
//     setSelectedUserForEmployee(null);
//     setEmployeeModalMode('create');
//   }, []);

//   const handleEmployeeSave = useCallback(() => {
//     // Refresh users data after employee operations
//     dispatch(fetchUsers());
//     if (isHRMSEnabled) {
//       dispatch(fetchEmployees({}));
//     }
//   }, [dispatch, isHRMSEnabled]);

//   // Metrics calculation - memoized to prevent recalculations
//   const metrics = useMemo(
//     () => ({
//       total: users.length,
//       active: users.filter(
//         (u: any) =>
//           u.user_id?.isActive !== false || u.status === "active"
//       ).length,
//       managers: users.filter(
//         (u: any) =>
//           u.roleDefinitionId?.roleName === "MANAGER" ||
//           u.roleDefinitionId?.roleName === "TL" ||
//           u.roleDefinitionId?.hierarchyLevel <= 3
//       ).length,
//       members: users.filter(
//         (u: any) =>
//           u.roleDefinitionId?.roleName === "Associate" ||
//           u.roleDefinitionId?.hierarchyLevel > 3
//       ).length,
//     }),
//     [users]
//   );

//   // Filtering - memoized
//   const filteredUsers = useMemo(
//     () =>
//       users.filter((user: any) => {
//         const name = user.user_id?.name || "";
//         const email = user.user_id?.email || "";
//         return (
//           name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           email.toLowerCase().includes(searchTerm.toLowerCase())
//         );
//       }),
//     [users, searchTerm]
//   );

//   // FIXED: Memoized helper functions
//   const getDepartmentNames = useCallback((user: any) => {
//     let userDepartments = [];

//     if (user.departments && user.departments.length > 0) {
//       userDepartments = user.departments;
//     }
//     else if (
//       user.user_id?.departmentId &&
//       user.user_id.departmentId.length > 0 &&
//       departments.length > 0
//     ) {
//       userDepartments = user.user_id.departmentId
//         .map((deptId: string) => {
//           const department = departments.find((dept: any) => dept._id === deptId);
//           return department
//             ? { name: department.name, alias: department.alias }
//             : null;
//         })
//         .filter(Boolean);
//     }

//     return userDepartments;
//   }, [departments]);

//   // MODIFIED: Updated getReportingManager function to show admins instead of N/A
//   const getReportingManager = useCallback((user: any) => {
//     // Check if user has a regular parent role
//     if (user.parentRoleId?.user_id?.name) {
//       return user.parentRoleId.user_id.name;
//     }
    
//     // If no regular parent role, show admins instead of "N/A"
//     if (admins && admins.length > 0) {
//       if (admins.length === 1) {
//         return (
//           <div className="flex items-center gap-1">
//             <Badge variant="outline" className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200">
//               Admin
//             </Badge>
//             <span className="text-xs">{admins[0].name}</span>
//           </div>
//         );
//       } else {
//         return (
//           <Popover>
//             <PopoverTrigger asChild>
//               <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-800 text-xs">
//                 View Admins ({admins.length})
//               </Button>
//             </PopoverTrigger>
//             <PopoverContent className="w-80">
//               <div className="space-y-2">
//                 <h4 className="font-medium text-sm">Organization Admins</h4>
//                 <div className="space-y-1 max-h-40 overflow-y-auto">
//                   {admins.map((admin) => (
//                     <div key={admin._id} className="flex items-center justify-between p-1 hover:bg-muted rounded">
//                       <span className="text-sm">{admin.name}</span>
//                       <span className="text-xs text-muted-foreground truncate ml-2">{admin.email}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </PopoverContent>
//           </Popover>
//         );
//       }
//     }
    
//     return "N/A";
//   }, [admins]);

//   const getRoleName = useCallback((user: any) => {
//     return user.roleDefinitionId?.roleName || "Member";
//   }, []);

//   const getStatusColor = useCallback((isActive: boolean) => {
//     return isActive
//       ? "bg-green-500/20 text-green-600 dark:bg-green-500/30 dark:text-green-400 border-green-500/50"
//       : "bg-red-500/20 text-red-600 dark:bg-red-500/30 dark:text-red-400 border-red-500/50";
//   }, []);

//   const isUserActive = useCallback((user: any) => {
//     return user.user_id?.isActive !== false && user.status === "active";
//   }, []);

//   // FIXED: All handlers with useCallback to prevent recreations
//   const handleToggleActive = useCallback(async (user: any) => {
//     if (!user?.user_id?._id) return;

//     const userId = user.user_id._id;
//     const currentStatus = isUserActive(user);
//     const newStatus = !currentStatus;

//     setUpdatingUserId(userId);

//     try {
//       await dispatch(
//         updateUserStatus({
//           id: userId,
//           isActive: newStatus,
//         })
//       ).unwrap();

//       toast.success(
//         `User ${currentStatus ? "deactivated" : "activated"} successfully`
//       );
//       dispatch(fetchUsers());
//     } catch (error: any) {
//       dispatch(
//         updateUserInState({
//           id: userId,
//           updates: { status: currentStatus ? "active" : "inactive" },
//         })
//       );
//       toast.error(error || "Failed to update user status");
//     } finally {
//       setUpdatingUserId(null);
//     }
//   }, [dispatch, isUserActive]);

//   const handleEditUser = useCallback((user: any) => {
//     setEditingUser(user);
//     setIsEditModalOpen(true);
//   }, []);

//   const handleSaveUser = useCallback((updatedUser: any) => {
//     setEditingUser(null);
//     setIsEditModalOpen(false);
//     dispatch(fetchUsers());
//   }, [dispatch]);

//   const handleCloseModal = useCallback(() => {
//     setEditingUser(null);
//     setIsEditModalOpen(false);
//   }, []);

//   // FIXED: Rest of the handlers with proper dependencies
//   const handleReplaceUser = useCallback(async () => {
//     if (!selectedUserForReplace?.user_id?._id || !replacementUserId) return;

//     setRoleActionUserId(selectedUserForReplace.user_id._id);

//     try {
//       await dispatch(
//         replaceUserRole({
//           oldUserId: selectedUserForReplace.user_id._id,
//           newUserId: replacementUserId,
//           mode: "replace",
//         })
//       ).unwrap();

//       toast.success("User replaced successfully!");
//       dispatch(fetchUsers());
//       setShowReplaceModal(false);
//       setSelectedUserForReplace(null);
//       setReplacementUserId("");
//     } catch (error: any) {
//       toast.error(error || "Failed to replace user");
//     } finally {
//       setRoleActionUserId(null);
//     }
//   }, [dispatch, selectedUserForReplace, replacementUserId]);

//   // FIXED: New User Replacement Handler Functions
//   const handleNewUserReplaceInputChange = useCallback((field: string, value: string | string[]) => {
//     setNewUserReplaceForm(prev => ({ ...prev, [field]: value }));
//   }, []);

//   const handleNewUserReplaceDepartmentToggle = useCallback((departmentId: string, checked: boolean) => {
//     setNewUserReplaceForm(prev => ({
//       ...prev,
//       departmentId: checked 
//         ? [...prev.departmentId, departmentId]
//         : prev.departmentId.filter(id => id !== departmentId)
//     }));
//   }, []);

//   const handleSelectAllNewUserReplaceDepartments = useCallback((checked: boolean) => {
//     const departmentsArray = Array.isArray(departments) ? departments : [];
//     setNewUserReplaceForm(prev => ({
//       ...prev,
//       departmentId: checked ? departmentsArray.map(dept => dept._id) : []
//     }));
//   }, [departments]);

//   const openNewUserReplaceModal = useCallback((user: any) => {
//     setSelectedUserForNewUserReplace(user);
//     setShowNewUserReplaceModal(true);
//     // Reset form
//     setNewUserReplaceForm({
//       name: "",
//       email: "",
//       phoneNumber: "",
//       departmentId: []
//     });
//   }, []);

//   const closeNewUserReplaceModal = useCallback(() => {
//     setShowNewUserReplaceModal(false);
//     setSelectedUserForNewUserReplace(null);
//     setNewUserReplaceForm({
//       name: "",
//       email: "",
//       phoneNumber: "",
//       departmentId: []
//     });
//   }, []);

//   const handleReplaceWithNewUser = useCallback(async () => {
//     // Validation
//     if (!newUserReplaceForm.name.trim()) {
//       toast.error("Full name is required");
//       return;
//     }
//     if (!newUserReplaceForm.email.trim()) {
//       toast.error("Email is required");
//       return;
//     }
//     if (!newUserReplaceForm.phoneNumber.trim()) {
//       toast.error("Phone number is required");
//       return;
//     }
//     if (newUserReplaceForm.departmentId.length === 0) {
//       toast.error("At least one department is required");
//       return;
//     }

//     if (!selectedUserForNewUserReplace?.user_id?._id) return;

//     setRoleActionUserId(selectedUserForNewUserReplace.user_id._id);

//     try {
//       const userData = {
//         name: newUserReplaceForm.name,
//         email: newUserReplaceForm.email,
//         phoneNumber: newUserReplaceForm.phoneNumber,
//         departmentId: newUserReplaceForm.departmentId,
//         password: "12345678",
//         roleDefinitionId: selectedUserForNewUserReplace.roleDefinitionId._id
//       };

//       await dispatch(
//         replaceUserRole({
//           oldUserId: selectedUserForNewUserReplace.user_id._id,
//           newUserId: "",
//           mode: "newuserreplace",
//           newRoleDefId: selectedUserForNewUserReplace.roleDefinitionId._id,
//           userData: userData,
//         })
//       ).unwrap();

//       toast.success("User replaced with new user successfully!");
//       dispatch(fetchUsers());
//       closeNewUserReplaceModal();
//     } catch (error: any) {
//       toast.error(error || "Failed to replace user with new user");
//     } finally {
//       setRoleActionUserId(null);
//     }
//   }, [dispatch, newUserReplaceForm, selectedUserForNewUserReplace, closeNewUserReplaceModal]);

//   const handleUserLeave = useCallback(async (user: any) => {
//     if (!user?.user_id?._id) return;

//     setRoleActionUserId(user.user_id._id);

//     try {
//       await dispatch(
//         replaceUserRole({
//           oldUserId: user.user_id._id,
//           newUserId: "",
//           mode: "leave",
//         })
//       ).unwrap();

//       toast.success("User removed from role successfully!");
//       dispatch(fetchUsers());
//     } catch (error: any) {
//       toast.error(error || "Failed to remove user from role");
//     } finally {
//       setRoleActionUserId(null);
//     }
//   }, [dispatch]);

//   const openReplaceModal = useCallback((user: any) => {
//     setSelectedUserForReplace(user);
//     setShowReplaceModal(true);
//   }, []);

//   const closeReplaceModal = useCallback(() => {
//     setShowReplaceModal(false);
//     setSelectedUserForReplace(null);
//     setReplacementUserId("");
//   }, []);

//   // Get available users for replacement (excluding the current user)
//   const getAvailableUsers = useCallback(() => {
//     return users.filter(
//       (user: any) =>
//         user.user_id?._id !== selectedUserForReplace?.user_id?._id &&
//         isUserActive(user)
//     );
//   }, [users, selectedUserForReplace, isUserActive]);

//   // Helper functions for new user replacement modal - memoized
//   const departmentsArray = useMemo(() => Array.isArray(departments) ? departments : [], [departments]);
//   const selectedNewUserDepartments = useMemo(() => 
//     departmentsArray.filter(dept => 
//       newUserReplaceForm.departmentId.includes(dept._id)
//     ), [departmentsArray, newUserReplaceForm.departmentId]
//   );
//   const allNewUserDepartmentsSelected = useMemo(() => 
//     departmentsArray.length > 0 && 
//     newUserReplaceForm.departmentId.length === departmentsArray.length,
//     [departmentsArray, newUserReplaceForm.departmentId]
//   );

//   return (
//     <div className="p-6 space-y-6 bg-background text-foreground">
//       <h1 className="text-xl font-semibold">User Overview</h1>

//       {/* Metrics */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//         {[
//           { icon: Users, title: metrics.total, label: "Total Users" },
//           { icon: UserCheck, title: metrics.active, label: "Active Users" },
//           { icon: UserCog, title: metrics.managers, label: "Managers/TLs" },
//           { icon: User, title: metrics.members, label: "Associates" },
//         ].map(({ icon: Icon, title, label }, index) => (
//           <Card key={index} className="bg-card border-border">
//             <CardHeader className="items-center flex justify-center flex-col">
//               <Icon className="text-muted-foreground" />
//               <CardTitle className="text-foreground">{title}</CardTitle>
//               <p className="text-sm text-muted-foreground">{label}</p>
//             </CardHeader>
//           </Card>
//         ))}
//       </div>

//       {/* Search and Actions */}
//       <div className="flex flex-col md:flex-row justify-between gap-4">
//         <Input
//           placeholder="Search by name or email..."
//           className="md:w-1/3 bg-input text-foreground border-input"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//         <div className="flex gap-2">
//           <Button
//             variant="default"
//             className="bg-primary text-primary-foreground hover:bg-primary/90"
//             onClick={() => router.push(getCreateRoute())}
//           >
//             <UserPlus className="h-4 w-4 mr-2" />
//             New User
//           </Button>
//         </div>
//       </div>

//       {/* Users Table */}
//       <Card className="bg-card border-border">
//         <CardHeader>
//           <div className="flex justify-between items-center">
//             <div>
//               <CardTitle className="text-xl font-semibold text-foreground">
//                 All Users
//               </CardTitle>
//               <p className="text-sm text-muted-foreground">
//                 Overview of all registered users with role hierarchy
//               </p>
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="w-full">
//             <Table>
//               <TableHeader>
//                 <TableRow className="border-border hover:bg-muted/50">
//                   <TableHead className="text-foreground w-[15%]">Name</TableHead>
//                   <TableHead className="text-foreground w-[18%]">Email</TableHead>
//                   <TableHead className="text-foreground w-[12%]">Phone</TableHead>
//                   <TableHead className="text-foreground w-[15%]">
//                     Department(s)
//                   </TableHead>
//                   <TableHead className="text-foreground w-[10%]">Role</TableHead>
//                   <TableHead className="text-foreground w-[12%]">
//                     Reports To
//                   </TableHead>
//                   <TableHead className="text-foreground w-[8%]">Status</TableHead>
//                   <TableHead className="text-foreground w-[10%]">Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredUsers.length > 0 ? (
//                   filteredUsers.map((user: any, index: number) => {
//                     const isUpdating = updatingUserId === user.user_id?._id;
//                     const isRoleUpdating = roleActionUserId === user.user_id?._id;
//                     const userIsActive = isUserActive(user);
//                     const userDepartments = getDepartmentNames(user);
//                     const userHasEmployeeProfile = isHRMSEnabled ? hasEmployeeProfile(user.user_id?._id) : false;

//                     return (
//                       <TableRow
//                         key={`${user._id}-${user.user_id?._id}-${index}`}
//                         className="border-border hover:bg-muted/50"
//                       >
//                         <TableCell className="text-foreground w-[15%]">
//                           <div
//                             className="truncate"
//                             title={user.user_id?.name || "N/A"}
//                           >
//                             {user.user_id?.name || "N/A"}
//                           </div>
//                         </TableCell>
//                         <TableCell className="text-foreground w-[18%]">
//                           <div
//                             className="truncate"
//                             title={user.user_id?.email || "N/A"}
//                           >
//                             {user.user_id?.email || "N/A"}
//                           </div>
//                         </TableCell>
//                         <TableCell className="text-foreground w-[12%]">
//                           {user.user_id?.phoneNumber || "N/A"}
//                         </TableCell>
//                         <TableCell className="text-foreground w-[15%]">
//                           {userDepartments.length > 0 ? (
//                             <div
//                               className="flex flex-col gap-1 max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-1"
//                               style={{
//                                 scrollbarWidth: "thin",
//                                 scrollbarColor: "rgb(209 213 219) transparent",
//                               }}
//                             >
//                               {userDepartments.map((dept: any, deptIndex: number) => (
//                                 <Badge
//                                   key={deptIndex}
//                                   variant="secondary"
//                                   className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700 w-fit flex-shrink-0"
//                                   title={dept.name}
//                                 >
//                                   <span className="truncate max-w-[80px]">
//                                     {dept.name}
//                                   </span>
//                                 </Badge>
//                               ))}
//                             </div>
//                           ) : (
//                             <span className="text-muted-foreground">N/A</span>
//                           )}
//                         </TableCell>
//                         <TableCell className="w-[10%]">
//                           <Badge
//                             variant="outline"
//                             className="capitalize border-border text-foreground bg-muted text-xs"
//                             title={getRoleName(user)}
//                           >
//                             <span className="truncate max-w-[60px]">
//                               {getRoleName(user).toLowerCase()}
//                             </span>
//                           </Badge>
//                         </TableCell>
//                         {/* MODIFIED: Reports To column with admin display */}
//                         <TableCell className="text-foreground w-[12%]">
//                           <div className="truncate">
//                             {getReportingManager(user)}
//                           </div>
//                         </TableCell>
                        
//                         <TableCell className="w-[8%]">
//                           <Badge
//                             variant="outline"
//                             className={`${getStatusColor(userIsActive)} text-xs`}
//                           >
//                             {userIsActive ? "Active" : "Inactive"}
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="w-[10%]">
//                           <div className="flex gap-1">
//                             <Button
//                               variant="ghost"
//                               size="sm"
//                               onClick={() => handleEditUser(user)}
//                               disabled={loading}
//                               className="text-foreground hover:bg-muted p-1 h-8 w-8"
//                               title="Edit User"
//                             >
//                               <Edit className="h-3 w-3" />
//                             </Button>

//                             {/* Settings Dropdown */}
//                             <DropdownMenu>
//                               <DropdownMenuTrigger asChild>
//                                 <Button
//                                   variant="outline"
//                                   size="sm" 
//                                   disabled={isRoleUpdating || roleUpdateLoading || newUserReplaceLoading}
//                                   className="text-xs px-2 py-1 h-8 flex items-center gap-1"
//                                 >
//                                   {isRoleUpdating || roleUpdateLoading || newUserReplaceLoading ? (
//                                     <Loader2 className="h-3 w-3 animate-spin" />
//                                   ) : (
//                                     <>
//                                       <Settings className="h-3 w-3" />
//                                       <ChevronDown className="h-3 w-3" />
//                                     </>
//                                   )}
//                                 </Button>
//                               </DropdownMenuTrigger>
//                               <DropdownMenuContent align="end" className="w-56">
//                                 <DropdownMenuLabel>User Actions</DropdownMenuLabel>
//                                 <DropdownMenuSeparator />

//                                 {/* HRMS Employee Management Section */}
//                                 {isHRMSEnabled && canCreateEmployee && (
//                                   <>
//                                     <DropdownMenuLabel className="text-blue-600 dark:text-blue-400 text-xs">
//                                       Employee Management
//                                     </DropdownMenuLabel>
                                    
//                                     {userHasEmployeeProfile ? (
//                                       <>
//                                         <DropdownMenuItem
//                                           onClick={() => openViewEmployeeModal(user)}
//                                           className="text-blue-600 focus:text-blue-600"
//                                         >
//                                           <Eye className="h-4 w-4 mr-2" />
//                                           View Employee Details
//                                         </DropdownMenuItem>
//                                         <DropdownMenuItem
//                                           onClick={() => openEditEmployeeModal(user)}
//                                           className="text-green-600 focus:text-green-600"
//                                         >
//                                           <Edit className="h-4 w-4 mr-2" />
//                                           Edit Employee Profile
//                                         </DropdownMenuItem>
//                                       </>
//                                     ) : (
//                                       <DropdownMenuItem
//                                         onClick={() => openCreateEmployeeModal(user)}
//                                         className="text-green-600 focus:text-green-600"
//                                       >
//                                         <Plus className="h-4 w-4 mr-2" />
//                                         Create Employee Profile
//                                       </DropdownMenuItem>
//                                     )}
                                    
//                                     <DropdownMenuSeparator />
//                                   </>
//                                 )}

//                                 {/* Role Management Section */}
//                                 <DropdownMenuLabel className="text-xs">Role Actions</DropdownMenuLabel>
                                
//                                 <DropdownMenuItem
//                                   onClick={() => openNewUserReplaceModal(user)}
//                                 >
//                                   <UserPlus className="h-4 w-4 mr-2" />
//                                   Replace with New User
//                                 </DropdownMenuItem>

//                                 <DropdownMenuItem
//                                   onClick={() => openReplaceModal(user)}
//                                 >
//                                   <UserX className="h-4 w-4 mr-2" />
//                                   Replace with Existing User
//                                 </DropdownMenuItem>

//                                 <DropdownMenuItem
//                                   onClick={() => handleUserLeave(user)}
//                                   className="text-red-600 focus:text-red-600"
//                                 >
//                                   <LogOut className="h-4 w-4 mr-2" />
//                                   Remove from Role
//                                 </DropdownMenuItem>

//                                 <DropdownMenuSeparator />

//                                 <DropdownMenuItem
//                                   onClick={() => handleToggleActive(user)}
//                                   disabled={isUpdating}
//                                 >
//                                   {isUpdating ? (
//                                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                                   ) : userIsActive ? (
//                                     <UserMinus className="h-4 w-4 mr-2" />
//                                   ) : (
//                                     <UserCheck className="h-4 w-4 mr-2" />
//                                   )}
//                                   {userIsActive ? "Deactivate" : "Activate"}
//                                 </DropdownMenuItem>
//                               </DropdownMenuContent>
//                             </DropdownMenu>
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     );
//                   })
//                 ) : (
//                   <TableRow>
//                     <TableCell colSpan={8} className="text-center py-4">
//                       {loading ? "Loading users..." : "No users found"}
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Employee Modal - FIXED: Stable key and props */}
//       {showEmployeeModal && (
//         <EmployeeModal
//           key={`employee-modal-${selectedUserForEmployee?.user_id?._id || 'new'}`}
//           isOpen={showEmployeeModal}
//           onClose={closeEmployeeModal}
//           mode={employeeModalMode}
//           selectedUser={selectedUserForEmployee}
//           onSave={handleEmployeeSave}
//         />
//       )}

//       {/* Replace with New User Modal - FIXED: Conditional rendering */}
//       {showNewUserReplaceModal && (
//         <Dialog open={showNewUserReplaceModal} onOpenChange={setShowNewUserReplaceModal}>
//           <DialogContent className="sm:max-w-[500px]">
//             <DialogHeader>
//               <DialogTitle>Replace with New User</DialogTitle>
//               <DialogDescription>
//                 Create a new user to replace{" "}
//                 <strong>{selectedUserForNewUserReplace?.user_id?.name}</strong> in their
//                 current role.
//               </DialogDescription>
//             </DialogHeader>
//             <div className="grid gap-4 py-4">
//               {/* Form content remains the same but wrapped in conditional */}
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="new-user-name">
//                     Full Name <span className="text-destructive">*</span>
//                   </Label>
//                   <Input
//                     id="new-user-name"
//                     placeholder="Enter full name"
//                     value={newUserReplaceForm.name}
//                     onChange={(e) => handleNewUserReplaceInputChange("name", e.target.value)}
//                     disabled={newUserReplaceLoading}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="new-user-email">
//                     Email <span className="text-destructive">*</span>
//                   </Label>
//                   <Input
//                     id="new-user-email"
//                     type="email"
//                     placeholder="example@company.com"
//                     value={newUserReplaceForm.email}
//                     onChange={(e) => handleNewUserReplaceInputChange("email", e.target.value)}
//                     disabled={newUserReplaceLoading}
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="new-user-phone">
//                   Phone Number <span className="text-destructive">*</span>
//                 </Label>
//                 <Input
//                   id="new-user-phone"
//                   placeholder="1234567890"
//                   value={newUserReplaceForm.phoneNumber}
//                   onChange={(e) => handleNewUserReplaceInputChange("phoneNumber", e.target.value)}
//                   disabled={newUserReplaceLoading}
//                 />
//               </div>

//               {/* Department selection remains the same */}
//               <div className="space-y-2">
//                 <Label>
//                   Departments <span className="text-destructive">*</span>
//                 </Label>
//                 <Popover open={newUserDepartmentPopoverOpen} onOpenChange={setNewUserDepartmentPopoverOpen}>
//                   <PopoverTrigger asChild>
//                     <Button
//                       variant="outline"
//                       role="combobox"
//                       aria-expanded={newUserDepartmentPopoverOpen}
//                       className="w-full justify-between"
//                       disabled={newUserReplaceLoading}
//                     >
//                       <div className="flex items-center gap-1 overflow-hidden">
//                         {selectedNewUserDepartments.length === 0 ? (
//                           <span className="text-muted-foreground">Select departments...</span>
//                         ) : selectedNewUserDepartments.length === 1 ? (
//                           <span>{selectedNewUserDepartments[0].name}</span>
//                         ) : (
//                           <span>{selectedNewUserDepartments.length} departments selected</span>
//                         )}
//                       </div>
//                       <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                     </Button>
//                   </PopoverTrigger>
//                   <PopoverContent className="w-full p-0" align="start">
//                     <div className="max-h-60 overflow-y-auto">
//                       <div className="flex items-center space-x-2 px-3 py-2 border-b hover:bg-muted">
//                         <Checkbox
//                           id="select-all-new-user"
//                           checked={allNewUserDepartmentsSelected}
//                           onCheckedChange={handleSelectAllNewUserReplaceDepartments}
//                         />
//                         <label
//                           htmlFor="select-all-new-user"
//                           className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
//                         >
//                           Select All
//                         </label>
//                       </div>

//                       {departmentsArray.map((dept) => (
//                         <div
//                           key={dept._id}
//                           className="flex items-center space-x-2 px-3 py-2 hover:bg-muted"
//                         >
//                           <Checkbox
//                             id={`new-user-${dept._id}`}
//                             checked={newUserReplaceForm.departmentId.includes(dept._id)}
//                             onCheckedChange={(checked) => 
//                               handleNewUserReplaceDepartmentToggle(dept._id, checked as boolean)
//                             }
//                           />
//                           <label
//                             htmlFor={`new-user-${dept._id}`}
//                             className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
//                           >
//                             {dept.name} ({dept.alias})
//                           </label>
//                         </div>
//                       ))}
//                     </div>
//                   </PopoverContent>
//                 </Popover>

//                 {selectedNewUserDepartments.length > 0 && (
//                   <div className="flex flex-wrap gap-1 mt-2">
//                     {selectedNewUserDepartments.map((dept) => (
//                       <div
//                         key={dept._id}
//                         className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
//                       >
//                         <span>{dept.name}</span>
//                         <button
//                           type="button"
//                           onClick={() => handleNewUserReplaceDepartmentToggle(dept._id, false)}
//                           className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
//                           disabled={newUserReplaceLoading}
//                         >
//                           <X className="h-3 w-3" />
//                         </button>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
//                 <strong>Note:</strong> The new user will be assigned the same role as the current user 
//                 ({selectedUserForNewUserReplace?.roleDefinitionId?.roleName || "Unknown Role"}) 
//                 with a default password "12345678".
//               </div>
//             </div>
            
//             <div className="flex justify-end gap-2">
//               <Button variant="outline" onClick={closeNewUserReplaceModal}>
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleReplaceWithNewUser}
//                 disabled={
//                   !newUserReplaceForm.name || 
//                   !newUserReplaceForm.email || 
//                   !newUserReplaceForm.phoneNumber ||
//                   newUserReplaceForm.departmentId.length === 0 ||
//                   newUserReplaceLoading
//                 }
//               >
//                 {newUserReplaceLoading ? (
//                   <Loader2 className="h-4 w-4 animate-spin mr-2" />
//                 ) : null}
//                 Create & Replace User
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       )}

//       {/* Replace User Modal - FIXED: Conditional rendering */}
//       {showReplaceModal && (
//         <Dialog open={showReplaceModal} onOpenChange={setShowReplaceModal}>
//           <DialogContent className="sm:max-w-[425px]">
//             <DialogHeader>
//               <DialogTitle>Replace User</DialogTitle>
//               <DialogDescription>
//                 Select a user to replace{" "}
//                 <strong>{selectedUserForReplace?.user_id?.name}</strong> in their
//                 current role.
//               </DialogDescription>
//             </DialogHeader>
//             <div className="grid gap-4 py-4">
//               <div className="grid gap-2">
//                 <Label htmlFor="replacement-user">Select Replacement User</Label>
//                 <Select
//                   value={replacementUserId}
//                   onValueChange={setReplacementUserId}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Choose a user..." />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {getAvailableUsers().map((user: any) => (
//                       <SelectItem
//                         key={user.user_id._id}
//                         value={user.user_id._id}
//                       >
//                         {user.user_id.name} ({user.user_id.email})
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
//             <div className="flex justify-end gap-2">
//               <Button variant="outline" onClick={closeReplaceModal}>
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleReplaceUser}
//                 disabled={!replacementUserId || roleUpdateLoading}
//               >
//                 {roleUpdateLoading ? (
//                   <Loader2 className="h-4 w-4 animate-spin mr-2" />
//                 ) : null}
//                 Replace User
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       )}

//       {/* Edit Modal - FIXED: Conditional rendering */}
//       {isEditModalOpen && (
//         <EditUserModal
//           key={`edit-modal-${editingUser?.user_id?._id || 'new'}`}
//           user={editingUser}
//           isOpen={isEditModalOpen}
//           onClose={handleCloseModal}
//           onSave={handleSaveUser}
//         />
//       )}
//     </div>
//   );
// }

// "use client";

// import { useState, useEffect, useMemo, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import {
//   Users,
//   UserCheck,
//   UserCog,
//   User,
//   Edit,
//   Loader2,
//   UserX,
//   LogOut,
//   UserMinus,
//   Settings,
//   ChevronDown,
//   UserPlus,
//   X,
//   Building2,
//   Eye,
//   Plus,
// } from "lucide-react";
// import { toast } from "sonner";
// import { useAppDispatch, useAppSelector } from "@/store/hooks";
// import {
//   fetchUsers,
//   updateUserStatus,
//   clearUserError,
//   updateUserInState,
// } from "@/features/user/userSlice";
// import { fetchDepartments } from "@/features/departments/departmentSlice";
// import {
//   getAllRoles,
//   replaceUserRole,
//   selectRoles,
//   selectReplaceUserLoading,
//   selectNewUserReplaceLoading,
// } from "@/features/role/roleSlice";
// import {
//   fetchEmployees,
//   selectEmployees,
// } from "@/features/employee/employeeSlice";
// import EditUserModal from "./EditUserModal";
// import EmployeeModal from "./EmployeeModel";

// export default function UserOverviewPage() {
//   const router = useRouter();
//   const dispatch = useAppDispatch();
  
//   // State management with proper initialization
//   const [searchTerm, setSearchTerm] = useState("");
//   const [editingUser, setEditingUser] = useState<any>(null);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

//   // Role management state
//   const [roleActionUserId, setRoleActionUserId] = useState<string | null>(null);
//   const [showReplaceModal, setShowReplaceModal] = useState(false);
//   const [selectedUserForReplace, setSelectedUserForReplace] = useState<any>(null);
//   const [replacementUserId, setReplacementUserId] = useState<string>("");

//   // New User Replacement state
//   const [showNewUserReplaceModal, setShowNewUserReplaceModal] = useState(false);
//   const [selectedUserForNewUserReplace, setSelectedUserForNewUserReplace] = useState<any>(null);
//   const [newUserReplaceForm, setNewUserReplaceForm] = useState({
//     name: "",
//     email: "",
//     phoneNumber: "",
//     departmentId: [] as string[]
//   });
//   const [newUserDepartmentPopoverOpen, setNewUserDepartmentPopoverOpen] = useState(false);

//   // Employee Modal State
//   const [showEmployeeModal, setShowEmployeeModal] = useState(false);
//   const [employeeModalMode, setEmployeeModalMode] = useState<'create' | 'view' | 'edit'>('create');
//   const [selectedUserForEmployee, setSelectedUserForEmployee] = useState<any>(null);

//   // Redux selectors
//   const { users, loading, error } = useAppSelector((state) => state.users);
//   const isOrganizer = useAppSelector((state) => state.auth.isOrganizer);
//   const isSuperUser = useAppSelector((state) => state.auth.isSuperUser);
//   const userRole = useAppSelector((state) => state.auth.role);
//   const orgPermissions = useAppSelector((state) => state.auth.orgPermissions);
//   const hrmsPermissions = useAppSelector((state) => state.auth.hrmsPermissions);
//   const { departments } = useAppSelector((state) => state.departments);
//   const roles = useAppSelector(selectRoles);
//   const roleUpdateLoading = useAppSelector(selectReplaceUserLoading);
//   const newUserReplaceLoading = useAppSelector(selectNewUserReplaceLoading);
//   const employees = useAppSelector(selectEmployees);

//   // Check if HRMS is enabled and user has permissions
//   const isHRMSEnabled = orgPermissions?.isHRMS_enabled || false;
//   const canCreateEmployee = isHRMSEnabled && (
//     isSuperUser || 
//     isOrganizer || 
//     hrmsPermissions?.includes('create_employee') || 
//     hrmsPermissions?.includes('manage_employees')
//   );

//   // FIXED: Single useEffect for initial data fetching
//   useEffect(() => {
//     const fetchInitialData = async () => {
//       try {
//         await Promise.all([
//           dispatch(fetchUsers()),
//           dispatch(fetchDepartments({})),
//           dispatch(getAllRoles())
//         ]);
        
//         // Fetch employees only if HRMS is enabled
//         if (isHRMSEnabled) {
//           await dispatch(fetchEmployees({}));
//         }
//       } catch (error) {
//         console.error("Failed to fetch initial data:", error);
//       }
//     };

//     fetchInitialData();
//   }, [dispatch]); // Removed isHRMSEnabled from dependencies to prevent infinite loop

//   // FIXED: Separate useEffect for HRMS-related data
//   useEffect(() => {
//     if (isHRMSEnabled && employees.length === 0) {
//       dispatch(fetchEmployees({}));
//     }
//   }, [isHRMSEnabled, dispatch, employees.length]);

//   // FIXED: Error handling effect
//   useEffect(() => {
//     if (error) {
//       toast.error(error);
//       dispatch(clearUserError());
//     }
//   }, [error, dispatch]);

//   // FIXED: Cleanup effect
//   useEffect(() => {
//     return () => {
//       dispatch(clearUserError());
//     };
//   }, [dispatch]);

//   // Memoized helper functions to prevent recreations
//   const getCreateRoute = useCallback(() => {
//     if (isOrganizer || userRole?.toLowerCase() === "admin") {
//       return "/dashboard/admin/user_overview/create";
//     } else {
//       return "/dashboard/dynamic/user_overview/create";
//     }
//   }, [isOrganizer, userRole]);

//   // Helper function to check if user has employee profile
//   const hasEmployeeProfile = useCallback((userId: string) => {
//     return employees.some((employee: any) => 
//       employee.userId === userId || employee.userId?._id === userId
//     );
//   }, [employees]);

//   // Employee Modal Functions - FIXED with useCallback
//   const openCreateEmployeeModal = useCallback((user: any) => {
//     const userWithExistingRole = {
//       ...user,
//       isExistingUser: true,
//       existingRoleDefinitionId: user.roleDefinitionId?._id || null,
//       existingRoleName: user.roleDefinitionId?.roleName || "Unknown Role"
//     };
//     setSelectedUserForEmployee(userWithExistingRole);
//     setEmployeeModalMode('create');
//     setShowEmployeeModal(true);
//   }, []);

//   const openViewEmployeeModal = useCallback((user: any) => {
//     setSelectedUserForEmployee(user);
//     setEmployeeModalMode('view');
//     setShowEmployeeModal(true);
//   }, []);

//   const openEditEmployeeModal = useCallback((user: any) => {
//     setSelectedUserForEmployee(user);
//     setEmployeeModalMode('edit');
//     setShowEmployeeModal(true);
//   }, []);

//   const closeEmployeeModal = useCallback(() => {
//     setShowEmployeeModal(false);
//     setSelectedUserForEmployee(null);
//     setEmployeeModalMode('create');
//   }, []);

//   const handleEmployeeSave = useCallback(() => {
//     // Refresh users data after employee operations
//     dispatch(fetchUsers());
//     if (isHRMSEnabled) {
//       dispatch(fetchEmployees({}));
//     }
//   }, [dispatch, isHRMSEnabled]);

//   // Metrics calculation - memoized to prevent recalculations
//   const metrics = useMemo(
//     () => ({
//       total: users.length,
//       active: users.filter(
//         (u: any) =>
//           u.user_id?.isActive !== false || u.status === "active"
//       ).length,
//       managers: users.filter(
//         (u: any) =>
//           u.roleDefinitionId?.roleName === "MANAGER" ||
//           u.roleDefinitionId?.roleName === "TL" ||
//           u.roleDefinitionId?.hierarchyLevel <= 3
//       ).length,
//       members: users.filter(
//         (u: any) =>
//           u.roleDefinitionId?.roleName === "Associate" ||
//           u.roleDefinitionId?.hierarchyLevel > 3
//       ).length,
//     }),
//     [users]
//   );

//   // Filtering - memoized
//   const filteredUsers = useMemo(
//     () =>
//       users.filter((user: any) => {
//         const name = user.user_id?.name || "";
//         const email = user.user_id?.email || "";
//         return (
//           name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           email.toLowerCase().includes(searchTerm.toLowerCase())
//         );
//       }),
//     [users, searchTerm]
//   );

//   // FIXED: Memoized helper functions
//   const getDepartmentNames = useCallback((user: any) => {
//     let userDepartments = [];

//     if (user.departments && user.departments.length > 0) {
//       userDepartments = user.departments;
//     }
//     else if (
//       user.user_id?.departmentId &&
//       user.user_id.departmentId.length > 0 &&
//       departments.length > 0
//     ) {
//       userDepartments = user.user_id.departmentId
//         .map((deptId: string) => {
//           const department = departments.find((dept: any) => dept._id === deptId);
//           return department
//             ? { name: department.name, alias: department.alias }
//             : null;
//         })
//         .filter(Boolean);
//     }

//     return userDepartments;
//   }, [departments]);

//   const getReportingManager = useCallback((user: any) => {
//     return user.parentRoleId?.user_id?.name || "N/A";
//   }, []);

//   const getRoleName = useCallback((user: any) => {
//     return user.roleDefinitionId?.roleName || "Member";
//   }, []);

//   const getStatusColor = useCallback((isActive: boolean) => {
//     return isActive
//       ? "bg-green-500/20 text-green-600 dark:bg-green-500/30 dark:text-green-400 border-green-500/50"
//       : "bg-red-500/20 text-red-600 dark:bg-red-500/30 dark:text-red-400 border-red-500/50";
//   }, []);

//   const isUserActive = useCallback((user: any) => {
//     return user.user_id?.isActive !== false && user.status === "active";
//   }, []);

//   // FIXED: All handlers with useCallback to prevent recreations
//   const handleToggleActive = useCallback(async (user: any) => {
//     if (!user?.user_id?._id) return;

//     const userId = user.user_id._id;
//     const currentStatus = isUserActive(user);
//     const newStatus = !currentStatus;

//     setUpdatingUserId(userId);

//     try {
//       await dispatch(
//         updateUserStatus({
//           id: userId,
//           isActive: newStatus,
//         })
//       ).unwrap();

//       toast.success(
//         `User ${currentStatus ? "deactivated" : "activated"} successfully`
//       );
//       dispatch(fetchUsers());
//     } catch (error: any) {
//       dispatch(
//         updateUserInState({
//           id: userId,
//           updates: { status: currentStatus ? "active" : "inactive" },
//         })
//       );
//       toast.error(error || "Failed to update user status");
//     } finally {
//       setUpdatingUserId(null);
//     }
//   }, [dispatch, isUserActive]);

//   const handleEditUser = useCallback((user: any) => {
//     setEditingUser(user);
//     setIsEditModalOpen(true);
//   }, []);

//   const handleSaveUser = useCallback((updatedUser: any) => {
//     setEditingUser(null);
//     setIsEditModalOpen(false);
//     dispatch(fetchUsers());
//   }, [dispatch]);

//   const handleCloseModal = useCallback(() => {
//     setEditingUser(null);
//     setIsEditModalOpen(false);
//   }, []);

//   // FIXED: Rest of the handlers with proper dependencies
//   const handleReplaceUser = useCallback(async () => {
//     if (!selectedUserForReplace?.user_id?._id || !replacementUserId) return;

//     setRoleActionUserId(selectedUserForReplace.user_id._id);

//     try {
//       await dispatch(
//         replaceUserRole({
//           oldUserId: selectedUserForReplace.user_id._id,
//           newUserId: replacementUserId,
//           mode: "replace",
//         })
//       ).unwrap();

//       toast.success("User replaced successfully!");
//       dispatch(fetchUsers());
//       setShowReplaceModal(false);
//       setSelectedUserForReplace(null);
//       setReplacementUserId("");
//     } catch (error: any) {
//       toast.error(error || "Failed to replace user");
//     } finally {
//       setRoleActionUserId(null);
//     }
//   }, [dispatch, selectedUserForReplace, replacementUserId]);

//   // FIXED: New User Replacement Handler Functions
//   const handleNewUserReplaceInputChange = useCallback((field: string, value: string | string[]) => {
//     setNewUserReplaceForm(prev => ({ ...prev, [field]: value }));
//   }, []);

//   const handleNewUserReplaceDepartmentToggle = useCallback((departmentId: string, checked: boolean) => {
//     setNewUserReplaceForm(prev => ({
//       ...prev,
//       departmentId: checked 
//         ? [...prev.departmentId, departmentId]
//         : prev.departmentId.filter(id => id !== departmentId)
//     }));
//   }, []);

//   const handleSelectAllNewUserReplaceDepartments = useCallback((checked: boolean) => {
//     const departmentsArray = Array.isArray(departments) ? departments : [];
//     setNewUserReplaceForm(prev => ({
//       ...prev,
//       departmentId: checked ? departmentsArray.map(dept => dept._id) : []
//     }));
//   }, [departments]);

//   const openNewUserReplaceModal = useCallback((user: any) => {
//     setSelectedUserForNewUserReplace(user);
//     setShowNewUserReplaceModal(true);
//     // Reset form
//     setNewUserReplaceForm({
//       name: "",
//       email: "",
//       phoneNumber: "",
//       departmentId: []
//     });
//   }, []);

//   const closeNewUserReplaceModal = useCallback(() => {
//     setShowNewUserReplaceModal(false);
//     setSelectedUserForNewUserReplace(null);
//     setNewUserReplaceForm({
//       name: "",
//       email: "",
//       phoneNumber: "",
//       departmentId: []
//     });
//   }, []);

//   const handleReplaceWithNewUser = useCallback(async () => {
//     // Validation
//     if (!newUserReplaceForm.name.trim()) {
//       toast.error("Full name is required");
//       return;
//     }
//     if (!newUserReplaceForm.email.trim()) {
//       toast.error("Email is required");
//       return;
//     }
//     if (!newUserReplaceForm.phoneNumber.trim()) {
//       toast.error("Phone number is required");
//       return;
//     }
//     if (newUserReplaceForm.departmentId.length === 0) {
//       toast.error("At least one department is required");
//       return;
//     }

//     if (!selectedUserForNewUserReplace?.user_id?._id) return;

//     setRoleActionUserId(selectedUserForNewUserReplace.user_id._id);

//     try {
//       const userData = {
//         name: newUserReplaceForm.name,
//         email: newUserReplaceForm.email,
//         phoneNumber: newUserReplaceForm.phoneNumber,
//         departmentId: newUserReplaceForm.departmentId,
//         password: "12345678",
//         roleDefinitionId: selectedUserForNewUserReplace.roleDefinitionId._id
//       };

//       await dispatch(
//         replaceUserRole({
//           oldUserId: selectedUserForNewUserReplace.user_id._id,
//           newUserId: "",
//           mode: "newuserreplace",
//           newRoleDefId: selectedUserForNewUserReplace.roleDefinitionId._id,
//           userData: userData,
//         })
//       ).unwrap();

//       toast.success("User replaced with new user successfully!");
//       dispatch(fetchUsers());
//       closeNewUserReplaceModal();
//     } catch (error: any) {
//       toast.error(error || "Failed to replace user with new user");
//     } finally {
//       setRoleActionUserId(null);
//     }
//   }, [dispatch, newUserReplaceForm, selectedUserForNewUserReplace, closeNewUserReplaceModal]);

//   const handleUserLeave = useCallback(async (user: any) => {
//     if (!user?.user_id?._id) return;

//     setRoleActionUserId(user.user_id._id);

//     try {
//       await dispatch(
//         replaceUserRole({
//           oldUserId: user.user_id._id,
//           newUserId: "",
//           mode: "leave",
//         })
//       ).unwrap();

//       toast.success("User removed from role successfully!");
//       dispatch(fetchUsers());
//     } catch (error: any) {
//       toast.error(error || "Failed to remove user from role");
//     } finally {
//       setRoleActionUserId(null);
//     }
//   }, [dispatch]);

//   const openReplaceModal = useCallback((user: any) => {
//     setSelectedUserForReplace(user);
//     setShowReplaceModal(true);
//   }, []);

//   const closeReplaceModal = useCallback(() => {
//     setShowReplaceModal(false);
//     setSelectedUserForReplace(null);
//     setReplacementUserId("");
//   }, []);

//   // Get available users for replacement (excluding the current user)
//   const getAvailableUsers = useCallback(() => {
//     return users.filter(
//       (user: any) =>
//         user.user_id?._id !== selectedUserForReplace?.user_id?._id &&
//         isUserActive(user)
//     );
//   }, [users, selectedUserForReplace, isUserActive]);

//   // Helper functions for new user replacement modal - memoized
//   const departmentsArray = useMemo(() => Array.isArray(departments) ? departments : [], [departments]);
//   const selectedNewUserDepartments = useMemo(() => 
//     departmentsArray.filter(dept => 
//       newUserReplaceForm.departmentId.includes(dept._id)
//     ), [departmentsArray, newUserReplaceForm.departmentId]
//   );
//   const allNewUserDepartmentsSelected = useMemo(() => 
//     departmentsArray.length > 0 && 
//     newUserReplaceForm.departmentId.length === departmentsArray.length,
//     [departmentsArray, newUserReplaceForm.departmentId]
//   );

//   return (
//     <div className="p-6 space-y-6 bg-background text-foreground">
//       <h1 className="text-xl font-semibold">User Overview</h1>

//       {/* Metrics */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//         {[
//           { icon: Users, title: metrics.total, label: "Total Users" },
//           { icon: UserCheck, title: metrics.active, label: "Active Users" },
//           { icon: UserCog, title: metrics.managers, label: "Managers/TLs" },
//           { icon: User, title: metrics.members, label: "Associates" },
//         ].map(({ icon: Icon, title, label }, index) => (
//           <Card key={index} className="bg-card border-border">
//             <CardHeader className="items-center flex justify-center flex-col">
//               <Icon className="text-muted-foreground" />
//               <CardTitle className="text-foreground">{title}</CardTitle>
//               <p className="text-sm text-muted-foreground">{label}</p>
//             </CardHeader>
//           </Card>
//         ))}
//       </div>

//       {/* Search and Actions */}
//       <div className="flex flex-col md:flex-row justify-between gap-4">
//         <Input
//           placeholder="Search by name or email..."
//           className="md:w-1/3 bg-input text-foreground border-input"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//         <div className="flex gap-2">
//           <Button
//             variant="default"
//             className="bg-primary text-primary-foreground hover:bg-primary/90"
//             onClick={() => router.push(getCreateRoute())}
//           >
//             <UserPlus className="h-4 w-4 mr-2" />
//             New User
//           </Button>
//         </div>
//       </div>

//       {/* Users Table */}
//       <Card className="bg-card border-border">
//         <CardHeader>
//           <div className="flex justify-between items-center">
//             <div>
//               <CardTitle className="text-xl font-semibold text-foreground">
//                 All Users
//               </CardTitle>
//               <p className="text-sm text-muted-foreground">
//                 Overview of all registered users with role hierarchy
//               </p>
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="w-full">
//             <Table>
//               <TableHeader>
//                 <TableRow className="border-border hover:bg-muted/50">
//                   <TableHead className="text-foreground w-[15%]">Name</TableHead>
//                   <TableHead className="text-foreground w-[18%]">Email</TableHead>
//                   <TableHead className="text-foreground w-[12%]">Phone</TableHead>
//                   <TableHead className="text-foreground w-[15%]">
//                     Department(s)
//                   </TableHead>
//                   <TableHead className="text-foreground w-[10%]">Role</TableHead>
//                   <TableHead className="text-foreground w-[12%]">
//                     Reports To
//                   </TableHead>
//                   <TableHead className="text-foreground w-[8%]">Status</TableHead>
//                   <TableHead className="text-foreground w-[10%]">Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredUsers.length > 0 ? (
//                   filteredUsers.map((user: any, index: number) => {
//                     const isUpdating = updatingUserId === user.user_id?._id;
//                     const isRoleUpdating = roleActionUserId === user.user_id?._id;
//                     const userIsActive = isUserActive(user);
//                     const userDepartments = getDepartmentNames(user);
//                     const userHasEmployeeProfile = isHRMSEnabled ? hasEmployeeProfile(user.user_id?._id) : false;

//                     return (
//                       <TableRow
//                         key={`${user._id}-${user.user_id?._id}-${index}`}
//                         className="border-border hover:bg-muted/50"
//                       >
//                         <TableCell className="text-foreground w-[15%]">
//                           <div
//                             className="truncate"
//                             title={user.user_id?.name || "N/A"}
//                           >
//                             {user.user_id?.name || "N/A"}
//                           </div>
//                         </TableCell>
//                         <TableCell className="text-foreground w-[18%]">
//                           <div
//                             className="truncate"
//                             title={user.user_id?.email || "N/A"}
//                           >
//                             {user.user_id?.email || "N/A"}
//                           </div>
//                         </TableCell>
//                         <TableCell className="text-foreground w-[12%]">
//                           {user.user_id?.phoneNumber || "N/A"}
//                         </TableCell>
//                         <TableCell className="text-foreground w-[15%]">
//                           {userDepartments.length > 0 ? (
//                             <div
//                               className="flex flex-col gap-1 max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-1"
//                               style={{
//                                 scrollbarWidth: "thin",
//                                 scrollbarColor: "rgb(209 213 219) transparent",
//                               }}
//                             >
//                               {userDepartments.map((dept: any, deptIndex: number) => (
//                                 <Badge
//                                   key={deptIndex}
//                                   variant="secondary"
//                                   className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700 w-fit flex-shrink-0"
//                                   title={dept.name}
//                                 >
//                                   <span className="truncate max-w-[80px]">
//                                     {dept.name}
//                                   </span>
//                                 </Badge>
//                               ))}
//                             </div>
//                           ) : (
//                             <span className="text-muted-foreground">N/A</span>
//                           )}
//                         </TableCell>
//                         <TableCell className="w-[10%]">
//                           <Badge
//                             variant="outline"
//                             className="capitalize border-border text-foreground bg-muted text-xs"
//                             title={getRoleName(user)}
//                           >
//                             <span className="truncate max-w-[60px]">
//                               {getRoleName(user).toLowerCase()}
//                             </span>
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="text-foreground w-[12%]">
//                           <div
//                             className="truncate"
//                             title={getReportingManager(user)}
//                           >
//                             {getReportingManager(user)}
//                           </div>
//                         </TableCell>
                        
//                         <TableCell className="w-[8%]">
//                           <Badge
//                             variant="outline"
//                             className={`${getStatusColor(userIsActive)} text-xs`}
//                           >
//                             {userIsActive ? "Active" : "Inactive"}
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="w-[10%]">
//                           <div className="flex gap-1">
//                             <Button
//                               variant="ghost"
//                               size="sm"
//                               onClick={() => handleEditUser(user)}
//                               disabled={loading}
//                               className="text-foreground hover:bg-muted p-1 h-8 w-8"
//                               title="Edit User"
//                             >
//                               <Edit className="h-3 w-3" />
//                             </Button>

//                             {/* Settings Dropdown */}
//                             <DropdownMenu>
//                               <DropdownMenuTrigger asChild>
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   disabled={isRoleUpdating || roleUpdateLoading || newUserReplaceLoading}
//                                   className="text-xs px-2 py-1 h-8 flex items-center gap-1"
//                                 >
//                                   {isRoleUpdating || roleUpdateLoading || newUserReplaceLoading ? (
//                                     <Loader2 className="h-3 w-3 animate-spin" />
//                                   ) : (
//                                     <>
//                                       <Settings className="h-3 w-3" />
//                                       <ChevronDown className="h-3 w-3" />
//                                     </>
//                                   )}
//                                 </Button>
//                               </DropdownMenuTrigger>
//                               <DropdownMenuContent align="end" className="w-56">
//                                 <DropdownMenuLabel>User Actions</DropdownMenuLabel>
//                                 <DropdownMenuSeparator />

//                                 {/* HRMS Employee Management Section */}
//                                 {isHRMSEnabled && canCreateEmployee && (
//                                   <>
//                                     <DropdownMenuLabel className="text-blue-600 dark:text-blue-400 text-xs">
//                                       Employee Management
//                                     </DropdownMenuLabel>
                                    
//                                     {userHasEmployeeProfile ? (
//                                       <>
//                                         <DropdownMenuItem
//                                           onClick={() => openViewEmployeeModal(user)}
//                                           className="text-blue-600 focus:text-blue-600"
//                                         >
//                                           <Eye className="h-4 w-4 mr-2" />
//                                           View Employee Details
//                                         </DropdownMenuItem>
//                                         <DropdownMenuItem
//                                           onClick={() => openEditEmployeeModal(user)}
//                                           className="text-green-600 focus:text-green-600"
//                                         >
//                                           <Edit className="h-4 w-4 mr-2" />
//                                           Edit Employee Profile
//                                         </DropdownMenuItem>
//                                       </>
//                                     ) : (
//                                       <DropdownMenuItem
//                                         onClick={() => openCreateEmployeeModal(user)}
//                                         className="text-green-600 focus:text-green-600"
//                                       >
//                                         <Plus className="h-4 w-4 mr-2" />
//                                         Create Employee Profile
//                                       </DropdownMenuItem>
//                                     )}
                                    
//                                     <DropdownMenuSeparator />
//                                   </>
//                                 )}

//                                 {/* Role Management Section */}
//                                 <DropdownMenuLabel className="text-xs">Role Actions</DropdownMenuLabel>
                                
//                                 <DropdownMenuItem
//                                   onClick={() => openNewUserReplaceModal(user)}
//                                 >
//                                   <UserPlus className="h-4 w-4 mr-2" />
//                                   Replace with New User
//                                 </DropdownMenuItem>

//                                 <DropdownMenuItem
//                                   onClick={() => openReplaceModal(user)}
//                                 >
//                                   <UserX className="h-4 w-4 mr-2" />
//                                   Replace with Existing User
//                                 </DropdownMenuItem>

//                                 <DropdownMenuItem
//                                   onClick={() => handleUserLeave(user)}
//                                   className="text-red-600 focus:text-red-600"
//                                 >
//                                   <LogOut className="h-4 w-4 mr-2" />
//                                   Remove from Role
//                                 </DropdownMenuItem>

//                                 <DropdownMenuSeparator />

//                                 <DropdownMenuItem
//                                   onClick={() => handleToggleActive(user)}
//                                   disabled={isUpdating}
//                                 >
//                                   {isUpdating ? (
//                                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                                   ) : userIsActive ? (
//                                     <UserMinus className="h-4 w-4 mr-2" />
//                                   ) : (
//                                     <UserCheck className="h-4 w-4 mr-2" />
//                                   )}
//                                   {userIsActive ? "Deactivate" : "Activate"}
//                                 </DropdownMenuItem>
//                               </DropdownMenuContent>
//                             </DropdownMenu>
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     );
//                   })
//                 ) : (
//                   <TableRow>
//                     <TableCell colSpan={8} className="text-center py-4">
//                       {loading ? "Loading users..." : "No users found"}
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Employee Modal - FIXED: Stable key and props */}
//       {showEmployeeModal && (
//         <EmployeeModal
//           key={`employee-modal-${selectedUserForEmployee?.user_id?._id || 'new'}`}
//           isOpen={showEmployeeModal}
//           onClose={closeEmployeeModal}
//           mode={employeeModalMode}
//           selectedUser={selectedUserForEmployee}
//           onSave={handleEmployeeSave}
//         />
//       )}

//       {/* Replace with New User Modal - FIXED: Conditional rendering */}
//       {showNewUserReplaceModal && (
//         <Dialog open={showNewUserReplaceModal} onOpenChange={setShowNewUserReplaceModal}>
//           <DialogContent className="sm:max-w-[500px]">
//             <DialogHeader>
//               <DialogTitle>Replace with New User</DialogTitle>
//               <DialogDescription>
//                 Create a new user to replace{" "}
//                 <strong>{selectedUserForNewUserReplace?.user_id?.name}</strong> in their
//                 current role.
//               </DialogDescription>
//             </DialogHeader>
//             <div className="grid gap-4 py-4">
//               {/* Form content remains the same but wrapped in conditional */}
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="new-user-name">
//                     Full Name <span className="text-destructive">*</span>
//                   </Label>
//                   <Input
//                     id="new-user-name"
//                     placeholder="Enter full name"
//                     value={newUserReplaceForm.name}
//                     onChange={(e) => handleNewUserReplaceInputChange("name", e.target.value)}
//                     disabled={newUserReplaceLoading}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="new-user-email">
//                     Email <span className="text-destructive">*</span>
//                   </Label>
//                   <Input
//                     id="new-user-email"
//                     type="email"
//                     placeholder="example@company.com"
//                     value={newUserReplaceForm.email}
//                     onChange={(e) => handleNewUserReplaceInputChange("email", e.target.value)}
//                     disabled={newUserReplaceLoading}
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="new-user-phone">
//                   Phone Number <span className="text-destructive">*</span>
//                 </Label>
//                 <Input
//                   id="new-user-phone"
//                   placeholder="1234567890"
//                   value={newUserReplaceForm.phoneNumber}
//                   onChange={(e) => handleNewUserReplaceInputChange("phoneNumber", e.target.value)}
//                   disabled={newUserReplaceLoading}
//                 />
//               </div>

//               {/* Department selection remains the same */}
//               <div className="space-y-2">
//                 <Label>
//                   Departments <span className="text-destructive">*</span>
//                 </Label>
//                 <Popover open={newUserDepartmentPopoverOpen} onOpenChange={setNewUserDepartmentPopoverOpen}>
//                   <PopoverTrigger asChild>
//                     <Button
//                       variant="outline"
//                       role="combobox"
//                       aria-expanded={newUserDepartmentPopoverOpen}
//                       className="w-full justify-between"
//                       disabled={newUserReplaceLoading}
//                     >
//                       <div className="flex items-center gap-1 overflow-hidden">
//                         {selectedNewUserDepartments.length === 0 ? (
//                           <span className="text-muted-foreground">Select departments...</span>
//                         ) : selectedNewUserDepartments.length === 1 ? (
//                           <span>{selectedNewUserDepartments[0].name}</span>
//                         ) : (
//                           <span>{selectedNewUserDepartments.length} departments selected</span>
//                         )}
//                       </div>
//                       <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                     </Button>
//                   </PopoverTrigger>
//                   <PopoverContent className="w-full p-0" align="start">
//                     <div className="max-h-60 overflow-y-auto">
//                       <div className="flex items-center space-x-2 px-3 py-2 border-b hover:bg-muted">
//                         <Checkbox
//                           id="select-all-new-user"
//                           checked={allNewUserDepartmentsSelected}
//                           onCheckedChange={handleSelectAllNewUserReplaceDepartments}
//                         />
//                         <label
//                           htmlFor="select-all-new-user"
//                           className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
//                         >
//                           Select All
//                         </label>
//                       </div>

//                       {departmentsArray.map((dept) => (
//                         <div
//                           key={dept._id}
//                           className="flex items-center space-x-2 px-3 py-2 hover:bg-muted"
//                         >
//                           <Checkbox
//                             id={`new-user-${dept._id}`}
//                             checked={newUserReplaceForm.departmentId.includes(dept._id)}
//                             onCheckedChange={(checked) => 
//                               handleNewUserReplaceDepartmentToggle(dept._id, checked as boolean)
//                             }
//                           />
//                           <label
//                             htmlFor={`new-user-${dept._id}`}
//                             className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
//                           >
//                             {dept.name} ({dept.alias})
//                           </label>
//                         </div>
//                       ))}
//                     </div>
//                   </PopoverContent>
//                 </Popover>

//                 {selectedNewUserDepartments.length > 0 && (
//                   <div className="flex flex-wrap gap-1 mt-2">
//                     {selectedNewUserDepartments.map((dept) => (
//                       <div
//                         key={dept._id}
//                         className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
//                       >
//                         <span>{dept.name}</span>
//                         <button
//                           type="button"
//                           onClick={() => handleNewUserReplaceDepartmentToggle(dept._id, false)}
//                           className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
//                           disabled={newUserReplaceLoading}
//                         >
//                           <X className="h-3 w-3" />
//                         </button>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
//                 <strong>Note:</strong> The new user will be assigned the same role as the current user 
//                 ({selectedUserForNewUserReplace?.roleDefinitionId?.roleName || "Unknown Role"}) 
//                 with a default password "12345678".
//               </div>
//             </div>
            
//             <div className="flex justify-end gap-2">
//               <Button variant="outline" onClick={closeNewUserReplaceModal}>
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleReplaceWithNewUser}
//                 disabled={
//                   !newUserReplaceForm.name || 
//                   !newUserReplaceForm.email || 
//                   !newUserReplaceForm.phoneNumber ||
//                   newUserReplaceForm.departmentId.length === 0 ||
//                   newUserReplaceLoading
//                 }
//               >
//                 {newUserReplaceLoading ? (
//                   <Loader2 className="h-4 w-4 animate-spin mr-2" />
//                 ) : null}
//                 Create & Replace User
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       )}

//       {/* Replace User Modal - FIXED: Conditional rendering */}
//       {showReplaceModal && (
//         <Dialog open={showReplaceModal} onOpenChange={setShowReplaceModal}>
//           <DialogContent className="sm:max-w-[425px]">
//             <DialogHeader>
//               <DialogTitle>Replace User</DialogTitle>
//               <DialogDescription>
//                 Select a user to replace{" "}
//                 <strong>{selectedUserForReplace?.user_id?.name}</strong> in their
//                 current role.
//               </DialogDescription>
//             </DialogHeader>
//             <div className="grid gap-4 py-4">
//               <div className="grid gap-2">
//                 <Label htmlFor="replacement-user">Select Replacement User</Label>
//                 <Select
//                   value={replacementUserId}
//                   onValueChange={setReplacementUserId}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Choose a user..." />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {getAvailableUsers().map((user: any) => (
//                       <SelectItem
//                         key={user.user_id._id}
//                         value={user.user_id._id}
//                       >
//                         {user.user_id.name} ({user.user_id.email})
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
//             <div className="flex justify-end gap-2">
//               <Button variant="outline" onClick={closeReplaceModal}>
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleReplaceUser}
//                 disabled={!replacementUserId || roleUpdateLoading}
//               >
//                 {roleUpdateLoading ? (
//                   <Loader2 className="h-4 w-4 animate-spin mr-2" />
//                 ) : null}
//                 Replace User
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       )}

//       {/* Edit Modal - FIXED: Conditional rendering */}
//       {isEditModalOpen && (
//         <EditUserModal
//           key={`edit-modal-${editingUser?.user_id?._id || 'new'}`}
//           user={editingUser}
//           isOpen={isEditModalOpen}
//           onClose={handleCloseModal}
//           onSave={handleSaveUser}
//         />
//       )}
//     </div>
//   );
// }
