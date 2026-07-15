
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Loader2, User, Search, ChevronDown, X } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUsers } from "@/features/user/userSlice";
import { fetchDepartments } from "@/features/departments/departmentSlice";
import { 
  createUserWithRole, 
  getAllRoles, 
  selectRoles,
  selectRoleLoading 
} from "@/features/role/roleSlice";
// Import the admin slice
import { getAdminUsers } from "@/features/newUser/newUserSlice";
import { getOrgIdFromToken } from "@/lib/authHelpers";

interface NewUserForm {
  name: string;
  email: string;
  phoneNumber: string;
  roleDefinitionId: string;
  departmentId: string[];
  parentRoleId: string;
  password: string;
}

export default function CreateNewAccountPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const { users, loading: usersLoading } = useAppSelector((state) => state.users);
  const { departments } = useAppSelector((state) => state.departments);
  // Add admin state
  const { admins, loading: adminsLoading } = useAppSelector((state) => state.newUser);
  const isOrganizer = useAppSelector((state) => state.auth.isOrganizer);
  const userRole = useAppSelector((state) => state.auth.role);
  const roles = useAppSelector(selectRoles);
  const roleLoading = useAppSelector(selectRoleLoading);

  const [formData, setFormData] = useState<NewUserForm>({
    name: "",
    email: "",
    phoneNumber: "",
    roleDefinitionId: "",
    departmentId: [],
    parentRoleId: "",
    password: "12345678",
  });

  const [departmentPopoverOpen, setDepartmentPopoverOpen] = useState(false);
  const [parentRoleSearch, setParentRoleSearch] = useState("");
  const [showParentRoleDropdown, setShowParentRoleDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const getCreateRoute = () => {
    if (isOrganizer || userRole?.toLowerCase() === 'admin') {
      return "/dashboard/admin/user_overview/";
    } else {
      return "/dashboard/dynamic/user_overview/";
    }
  };

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchDepartments({}));
    dispatch(getAllRoles());
    // Fetch admin users
    dispatch(getAdminUsers());
  }, [dispatch]);

  // Modified: Combine both regular users and admin users for parent role selection
  const availableParentRoles = useMemo(() => {
    const combinedParentOptions = [];

    // Add regular users
    if (users.length > 0) {
      const filteredUsers = users
        .filter((user) => {
          const isNotCurrentUser = user.user_id?.email !== formData.email;
          const matchesSearch = user.user_id?.name
            ?.toLowerCase()
            .includes(parentRoleSearch.toLowerCase()) || 
            user.roleDefinitionId?.roleName
              ?.toLowerCase()
              .includes(parentRoleSearch.toLowerCase());
          const isActive = user.status === "active" && user.user_id?.isActive;
          
          return matchesSearch && isNotCurrentUser && isActive && user.user_id?.name;
        })
        .map(user => ({
          ...user,
          type: 'user',
          displayName: user.user_id?.name,
          displayRole: user.roleDefinitionId?.roleName,
          hierarchyLevel: user.roleDefinitionId?.hierarchyLevel || 999
        }));
      
      combinedParentOptions.push(...filteredUsers);
    }

    // Add admin users
    if (admins.length > 0) {
      const filteredAdmins = admins
        .filter((admin) => {
          const isNotCurrentUser = admin.email !== formData.email;
          const matchesSearch = admin.name
            ?.toLowerCase()
            .includes(parentRoleSearch.toLowerCase());
          
          return matchesSearch && isNotCurrentUser && admin.name;
        })
        .map(admin => ({
          ...admin,
          type: 'admin',
          displayName: admin.name,
          displayRole: 'ADMIN',
          hierarchyLevel: 0 // Admins get highest priority
        }));
      
      combinedParentOptions.push(...filteredAdmins);
    }

    // Sort by hierarchy level (admins first, then by level)
    return combinedParentOptions.sort((a, b) => a.hierarchyLevel - b.hierarchyLevel);
  }, [users, admins, parentRoleSearch, formData.email]);

  // Modified: Find selected parent role from both users and admins
  const selectedParentRole = useMemo(() => {
    if (!formData.parentRoleId) return null;
    
    // Check in users first
    const userMatch = users.find(user => user._id === formData.parentRoleId);
    if (userMatch) {
      return {
        ...userMatch,
        type: 'user',
        displayName: userMatch.user_id?.name,
        displayRole: userMatch.roleDefinitionId?.roleName
      };
    }
    
    // Check in admins
    const adminMatch = admins.find(admin => admin._id === formData.parentRoleId);
    if (adminMatch) {
      return {
        ...adminMatch,
        type: 'admin',
        displayName: adminMatch.name,
        displayRole: 'ADMIN'
      };
    }
    
    return null;
  }, [formData.parentRoleId, users, admins]);

  const handleInputChange = (field: keyof NewUserForm, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleParentRoleSelect = (roleId: string) => {
    setFormData(prev => ({ ...prev, parentRoleId: roleId }));
    setParentRoleSearch("");
    setShowParentRoleDropdown(false);
  };

  const handleDepartmentToggle = (departmentId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      departmentId: checked 
        ? [...prev.departmentId, departmentId]
        : prev.departmentId.filter(id => id !== departmentId)
    }));
  };

  const handleSelectAllDepartments = (checked: boolean) => {
    const departmentsArray = Array.isArray(departments) ? departments : [];
    setFormData(prev => ({
      ...prev,
      departmentId: checked ? departmentsArray.map(dept => dept._id) : []
    }));
  };

  const handleResetForm = () => {
    setFormData({
      name: "",
      email: "",
      phoneNumber: "",
      roleDefinitionId: "",
      departmentId: [],
      parentRoleId: "",
      password: "12345678",
    });
    setParentRoleSearch("");
    setShowParentRoleDropdown(false);
  };

  const handleCreateAccount = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (!formData.roleDefinitionId) {
      toast.error("Role is required");
      return;
    }
    if (formData.departmentId.length === 0) {
      toast.error("At least one department is required");
      return;
    }
    if (!formData.password) {
      toast.error("Password is required");
      return;
    }

    setLoading(true);

    try {
      const { organizationId } = getOrgIdFromToken();
      
      // Check if selected parent is an admin
      const selectedParent = selectedParentRole;
      const isParentAdmin = selectedParent?.type === 'admin';
      
      // Safely derive parent email based on parent type:
      // - admin objects store email at the top level
      // - regular user objects store email under user_id.email
      const parentEmail = isParentAdmin
        ? (selectedParent as any)?.email ?? null
        : (selectedParent as any)?.user_id?.email ?? null;
      
      const userData = {
        name: formData.name,
        email: formData.email,
        phoneNumber: parseInt(formData.phoneNumber),
        roleDefinitionId: formData.roleDefinitionId,
        departmentId: formData.departmentId,
        // Modified: Handle admin vs regular user parent
        parentRoleId: isParentAdmin ? null : (formData.parentRoleId || null),
        isParentAdmin: isParentAdmin, // Flag to indicate parent is admin
        adminParentInfo: isParentAdmin ? {
          name: selectedParent?.displayName ?? parentEmail,
          email: parentEmail
        } : null,
        organizationId,
        password: formData.password,
      };

      await dispatch(createUserWithRole(userData)).unwrap();
      toast.success(
        isParentAdmin 
          ? "User created successfully with admin as parent role" 
          : "User created successfully with role assignment"
      );
      handleResetForm();

      router.push(getCreateRoute());
    } catch (error: any) {
      toast.error(error || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const departmentsArray = Array.isArray(departments) ? departments : [];
  const sortedRoles = [...roles].sort((a, b) => a.hierarchyLevel - b.hierarchyLevel);

  const selectedDepartments = departmentsArray.filter(dept => 
    formData.departmentId.includes(dept._id)
  );

  const allDepartmentsSelected = departmentsArray.length > 0 && 
    formData.departmentId.length === departmentsArray.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="px-4 mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            disabled={loading}
            className="text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Create New Account Form */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2 text-foreground">
              <User className="h-5 w-5" />
              Create New Account
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Fill in the details to add a new user with role assignment.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium mb-4 text-foreground">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    disabled={loading}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@company.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    disabled={loading}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-foreground">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    placeholder="1234567890"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    disabled={loading}
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Role & Department Assignment */}
            <div>
              <h3 className="text-lg font-medium mb-4 text-foreground">
                Role & Hierarchy Assignment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Primary Role Selection */}
                <div className="space-y-2">
                  <Label htmlFor="roleDefinitionId" className="text-foreground">
                    Role <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.roleDefinitionId}
                    onValueChange={(value) => handleInputChange("roleDefinitionId", value)}
                    disabled={loading || roleLoading}
                  >
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue placeholder="Select role from hierarchy" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border text-foreground max-h-60">
                      {sortedRoles.map((role) => (
                        <SelectItem key={role._id ?? ""} value={role._id ?? ""}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                              L{role.hierarchyLevel}
                            </span>
                            <span>{role.roleName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Multi-Select Departments */}
                <div className="space-y-2">
                  <Label className="text-foreground">
                    Departments <span className="text-destructive">*</span>
                  </Label>
                  <Popover open={departmentPopoverOpen} onOpenChange={setDepartmentPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={departmentPopoverOpen}
                        className="w-full justify-between bg-input border-border text-foreground hover:bg-muted"
                        disabled={loading}
                      >
                        <div className="flex items-center gap-1 overflow-hidden">
                          {selectedDepartments.length === 0 ? (
                            <span className="text-muted-foreground">Select departments...</span>
                          ) : selectedDepartments.length === 1 ? (
                            <span>{selectedDepartments[0].name}</span>
                          ) : (
                            <span>{selectedDepartments.length} departments selected</span>
                          )}
                        </div>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <div className="max-h-60 overflow-y-auto">
                        {/* Select All Option */}
                        <div className="flex items-center space-x-2 px-3 py-2 border-b hover:bg-muted">
                          <Checkbox
                            id="select-all"
                            checked={allDepartmentsSelected}
                            onCheckedChange={handleSelectAllDepartments}
                          />
                          <label
                            htmlFor="select-all"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            Select All
                          </label>
                        </div>

                        {/* Individual Department Options */}
                        {departmentsArray.map((dept) => (
                          <div
                            key={dept._id}
                            className="flex items-center space-x-2 px-3 py-2 hover:bg-muted"
                          >
                            <Checkbox
                              id={dept._id}
                              checked={formData.departmentId.includes(dept._id)}
                              onCheckedChange={(checked) => 
                                handleDepartmentToggle(dept._id, checked as boolean)
                              }
                            />
                            <label
                              htmlFor={dept._id}
                              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              {dept.name} ({dept.alias})
                            </label>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Selected Departments Display */}
                  {selectedDepartments.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedDepartments.map((dept) => (
                        <div
                          key={dept._id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
                        >
                          <span>{dept.name}</span>
                          <button
                            type="button"
                            onClick={() => handleDepartmentToggle(dept._id, false)}
                            className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
                            disabled={loading}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modified: Parent Role Selection with Combined Users and Admins */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-foreground">
                    Reports To (Parent Role) - Search Users & Admins
                  </Label>
                  
                  {/* Selected Parent Role Display */}
                  {selectedParentRole && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border">
                      <span className="text-sm font-medium">
                        Selected: {selectedParentRole.displayName}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        selectedParentRole.type === 'admin' 
                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      }`}>
                        {selectedParentRole.displayRole}
                      </span>
                   
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, parentRoleId: "" }))}
                        className="ml-auto h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  )}
                  
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search for parent role by name..."
                      value={parentRoleSearch}
                      onChange={(e) => {
                        setParentRoleSearch(e.target.value);
                        setShowParentRoleDropdown(true);
                      }}
                      onFocus={() => setShowParentRoleDropdown(true)}
                      disabled={loading || usersLoading || adminsLoading}
                      className="pl-10 bg-input border-border text-foreground"
                    />
                  </div>

                  {/* Search Results Dropdown */}
                  {showParentRoleDropdown && parentRoleSearch && (
                    <div className="relative">
                      <div className="absolute top-1 left-0 right-0 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                        {availableParentRoles.length > 0 ? (
                          availableParentRoles.map((parentOption) => (
                            <button
                              key={parentOption._id}
                              type="button"
                              onClick={() => handleParentRoleSelect(parentOption._id)}
                              className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 border-b border-border last:border-b-0"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium text-foreground">
                                  {parentOption.displayName}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    parentOption.type === 'admin'
                                      ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                      : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                  }`}>
                                    {parentOption.displayRole}
                                  </span>
                                  {parentOption.type === 'user' && (
                                    <span className="text-xs text-muted-foreground">
                                      Level {parentOption.hierarchyLevel}
                                    </span>
                                  )}
                                  {parentOption.type === 'admin' && (
                                    <span className="text-xs text-orange-600 dark:text-orange-400">
                                      (Admin)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-muted-foreground text-sm">
                            No users or admins found matching "{parentRoleSearch}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Search and select a user or admin who will be the parent role. 
                    {/* <span className="text-orange-600 dark:text-orange-400"> Admin selections won't send parent ID.</span> */}
                  </p>
                </div>
              </div>
            </div>

            {/* Password Section - Simplified */}
            <div>
              <h3 className="text-lg font-medium mb-4 text-foreground">
                Account Security
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    disabled={loading}
                    className="bg-input border-border text-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    Default password: "12345678"
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={handleResetForm}
                disabled={loading}
                className="border-border text-foreground hover:bg-muted"
              >
                Reset Form
              </Button>
              <Button
                onClick={handleCreateAccount}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4">
          © 2025 PulseSeal . All rights reserved.
        </div>
      </div>
    </div>
  );
}

// "use client";

// import { useState, useEffect, useMemo } from "react";
// import { useRouter } from "next/navigation";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { ArrowLeft, Loader2, User, Search, ChevronDown, X } from "lucide-react";
// import { toast } from "sonner";
// import { useAppDispatch, useAppSelector } from "@/store/hooks";
// import { fetchUsers } from "@/features/user/userSlice";
// import { fetchDepartments } from "@/features/departments/departmentSlice";
// import { 
//   createUserWithRole, 
//   getAllRoles, 
//   selectRoles,
//   selectRoleLoading 
// } from "@/features/role/roleSlice";
// import { getOrgIdFromToken } from "@/lib/authHelpers";

// interface NewUserForm {
//   name: string;
//   email: string;
//   phoneNumber: string;
//   roleDefinitionId: string;
//   departmentId: string[];
//   parentRoleId: string;
//   password: string;
// }

// export default function CreateNewAccountPage() {
//   const router = useRouter();
//   const dispatch = useAppDispatch();
  
//   const { users, loading: usersLoading } = useAppSelector((state) => state.users);
//   const { departments } = useAppSelector((state) => state.departments);
//   const isOrganizer = useAppSelector((state) => state.auth.isOrganizer);
//   const userRole = useAppSelector((state) => state.auth.role);
//   const roles = useAppSelector(selectRoles);
//   const roleLoading = useAppSelector(selectRoleLoading);

//   const [formData, setFormData] = useState<NewUserForm>({
//     name: "",
//     email: "",
//     phoneNumber: "",
//     roleDefinitionId: "",
//     departmentId: [],
//     parentRoleId: "",
//     password: "12345678", // Always default to this
//   });

//   const [departmentPopoverOpen, setDepartmentPopoverOpen] = useState(false);

//   const getCreateRoute = () => {
//     if (isOrganizer || userRole?.toLowerCase() === 'admin') {
//       return "/dashboard/admin/user_overview/";
//     } else {
//       return "/dashboard/dynamic/user_overview/";
//     }
//   };

//   const [parentRoleSearch, setParentRoleSearch] = useState("");
//   const [showParentRoleDropdown, setShowParentRoleDropdown] = useState(false);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     dispatch(fetchUsers());
//     dispatch(fetchDepartments({}));
//     dispatch(getAllRoles());
//   }, [dispatch]);

//   // Filter available parent roles (users) based on search and exclude current user
//   const availableParentRoles = useMemo(() => {
//     if (!users.length) return [];
    
//     return users
//       .filter((user) => {
//         const isNotCurrentUser = user.user_id?.email !== formData.email;
//         const matchesSearch = user.user_id?.name
//           ?.toLowerCase()
//           .includes(parentRoleSearch.toLowerCase()) || 
//           user.roleDefinitionId?.roleName
//             ?.toLowerCase()
//             .includes(parentRoleSearch.toLowerCase());
//         const isActive = user.status === "active" && user.user_id?.isActive;
        
//         return matchesSearch && isNotCurrentUser && isActive && user.user_id?.name;
//       })
//       .sort((a, b) => {
//         const aLevel = a.roleDefinitionId?.hierarchyLevel || 999;
//         const bLevel = b.roleDefinitionId?.hierarchyLevel || 999;
//         return aLevel - bLevel;
//       });
//   }, [users, parentRoleSearch, formData.email]);

//   const selectedParentRole = useMemo(() => {
//     if (!formData.parentRoleId) return null;
//     return users.find(user => user._id === formData.parentRoleId);
//   }, [formData.parentRoleId, users]);

//   const handleInputChange = (field: keyof NewUserForm, value: string | string[]) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleParentRoleSelect = (userRoleId: string) => {
//     setFormData(prev => ({ ...prev, parentRoleId: userRoleId }));
//     setParentRoleSearch("");
//     setShowParentRoleDropdown(false);
//   };

//   const handleDepartmentToggle = (departmentId: string, checked: boolean) => {
//     setFormData(prev => ({
//       ...prev,
//       departmentId: checked 
//         ? [...prev.departmentId, departmentId]
//         : prev.departmentId.filter(id => id !== departmentId)
//     }));
//   };

//   const handleSelectAllDepartments = (checked: boolean) => {
//     const departmentsArray = Array.isArray(departments) ? departments : [];
//     setFormData(prev => ({
//       ...prev,
//       departmentId: checked ? departmentsArray.map(dept => dept._id) : []
//     }));
//   };

//   const handleResetForm = () => {
//     setFormData({
//       name: "",
//       email: "",
//       phoneNumber: "",
//       roleDefinitionId: "",
//       departmentId: [],
//       parentRoleId: "",
//       password: "12345678", // Always reset to this default
//     });
//     setParentRoleSearch("");
//     setShowParentRoleDropdown(false);
//   };

//   const handleCreateAccount = async () => {
//     // Validation
//     if (!formData.name.trim()) {
//       toast.error("Full name is required");
//       return;
//     }
//     if (!formData.email.trim()) {
//       toast.error("Email is required");
//       return;
//     }
//     if (!formData.phoneNumber.trim()) {
//       toast.error("Phone number is required");
//       return;
//     }
//     if (!formData.roleDefinitionId) {
//       toast.error("Role is required");
//       return;
//     }
//     if (formData.departmentId.length === 0) {
//       toast.error("At least one department is required");
//       return;
//     }
//     if (!formData.password) {
//       toast.error("Password is required");
//       return;
//     }

//     setLoading(true);

//     try {
//       const { organizationId } = getOrgIdFromToken();
      
//       const userData = {
//         name: formData.name,
//         email: formData.email,
//         phoneNumber: parseInt(formData.phoneNumber),
//         roleDefinitionId: formData.roleDefinitionId,
//         departmentId: formData.departmentId,
//         parentRoleId: formData.parentRoleId || null,
//         organizationId,
//         password: formData.password,
//       };

//       await dispatch(createUserWithRole(userData)).unwrap();
//       toast.success("User created successfully with role assignment");
//       handleResetForm();

//       router.push(getCreateRoute());
//     } catch (error: any) {
//       toast.error(error || "Failed to create user");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const departmentsArray = Array.isArray(departments) ? departments : [];
//   const sortedRoles = [...roles].sort((a, b) => a.hierarchyLevel - b.hierarchyLevel);

//   const selectedDepartments = departmentsArray.filter(dept => 
//     formData.departmentId.includes(dept._id)
//   );

//   const allDepartmentsSelected = departmentsArray.length > 0 && 
//     formData.departmentId.length === departmentsArray.length;

//   return (
//     <div className="min-h-screen bg-background text-foreground">
//       <div className="px-4 mx-auto space-y-6">
//         {/* Header */}
//         <div className="flex items-center gap-4">
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={() => router.back()}
//             disabled={loading}
//             className="text-foreground hover:bg-muted"
//           >
//             <ArrowLeft className="h-4 w-4 mr-2" />
//             Back
//           </Button>
//         </div>

//         {/* Create New Account Form */}
//         <Card className="bg-card border-border">
//           <CardHeader>
//             <CardTitle className="text-xl font-semibold flex items-center gap-2 text-foreground">
//               <User className="h-5 w-5" />
//               Create New Account
//             </CardTitle>
//             <p className="text-sm text-muted-foreground">
//               Fill in the details to add a new user with role assignment.
//             </p>
//           </CardHeader>
//           <CardContent className="space-y-6">
//             {/* Basic Information */}
//             <div>
//               <h3 className="text-lg font-medium mb-4 text-foreground">
//                 Basic Information
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="name" className="text-foreground">
//                     Full Name <span className="text-destructive">*</span>
//                   </Label>
//                   <Input
//                     id="name"
//                     placeholder="Enter full name"
//                     value={formData.name}
//                     onChange={(e) => handleInputChange("name", e.target.value)}
//                     disabled={loading}
//                     className="bg-input border-border text-foreground"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="email" className="text-foreground">
//                     Email Address <span className="text-destructive">*</span>
//                   </Label>
//                   <Input
//                     id="email"
//                     type="email"
//                     placeholder="example@company.com"
//                     value={formData.email}
//                     onChange={(e) => handleInputChange("email", e.target.value)}
//                     disabled={loading}
//                     className="bg-input border-border text-foreground"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="phoneNumber" className="text-foreground">
//                     Phone Number <span className="text-destructive">*</span>
//                   </Label>
//                   <Input
//                     id="phoneNumber"
//                     placeholder="1234567890"
//                     value={formData.phoneNumber}
//                     onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
//                     disabled={loading}
//                     className="bg-input border-border text-foreground"
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Role & Department Assignment */}
//             <div>
//               <h3 className="text-lg font-medium mb-4 text-foreground">
//                 Role & Hierarchy Assignment
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {/* Primary Role Selection */}
//                 <div className="space-y-2">
//                   <Label htmlFor="roleDefinitionId" className="text-foreground">
//                     Role <span className="text-destructive">*</span>
//                   </Label>
//                   <Select
//                     value={formData.roleDefinitionId}
//                     onValueChange={(value) => handleInputChange("roleDefinitionId", value)}
//                     disabled={loading || roleLoading}
//                   >
//                     <SelectTrigger className="bg-input border-border text-foreground">
//                       <SelectValue placeholder="Select role from hierarchy" />
//                     </SelectTrigger>
//                     <SelectContent className="bg-background border-border text-foreground max-h-60">
//                       {sortedRoles.map((role) => (
//                         <SelectItem key={role._id ?? ""} value={role._id ?? ""}>
//                           <div className="flex items-center gap-2">
//                             <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
//                               L{role.hierarchyLevel}
//                             </span>
//                             <span>{role.roleName}</span>
//                           </div>
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 {/* Multi-Select Departments */}
//                 <div className="space-y-2">
//                   <Label className="text-foreground">
//                     Departments <span className="text-destructive">*</span>
//                   </Label>
//                   <Popover open={departmentPopoverOpen} onOpenChange={setDepartmentPopoverOpen}>
//                     <PopoverTrigger asChild>
//                       <Button
//                         variant="outline"
//                         role="combobox"
//                         aria-expanded={departmentPopoverOpen}
//                         className="w-full justify-between bg-input border-border text-foreground hover:bg-muted"
//                         disabled={loading}
//                       >
//                         <div className="flex items-center gap-1 overflow-hidden">
//                           {selectedDepartments.length === 0 ? (
//                             <span className="text-muted-foreground">Select departments...</span>
//                           ) : selectedDepartments.length === 1 ? (
//                             <span>{selectedDepartments[0].name}</span>
//                           ) : (
//                             <span>{selectedDepartments.length} departments selected</span>
//                           )}
//                         </div>
//                         <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-full p-0" align="start">
//                       <div className="max-h-60 overflow-y-auto">
//                         {/* Select All Option */}
//                         <div className="flex items-center space-x-2 px-3 py-2 border-b hover:bg-muted">
//                           <Checkbox
//                             id="select-all"
//                             checked={allDepartmentsSelected}
//                             onCheckedChange={handleSelectAllDepartments}
//                           />
//                           <label
//                             htmlFor="select-all"
//                             className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
//                           >
//                             Select All
//                           </label>
//                         </div>

//                         {/* Individual Department Options */}
//                         {departmentsArray.map((dept) => (
//                           <div
//                             key={dept._id}
//                             className="flex items-center space-x-2 px-3 py-2 hover:bg-muted"
//                           >
//                             <Checkbox
//                               id={dept._id}
//                               checked={formData.departmentId.includes(dept._id)}
//                               onCheckedChange={(checked) => 
//                                 handleDepartmentToggle(dept._id, checked as boolean)
//                               }
//                             />
//                             <label
//                               htmlFor={dept._id}
//                               className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
//                             >
//                               {dept.name} ({dept.alias})
//                             </label>
//                           </div>
//                         ))}
//                       </div>
//                     </PopoverContent>
//                   </Popover>

//                   {/* Selected Departments Display */}
//                   {selectedDepartments.length > 0 && (
//                     <div className="flex flex-wrap gap-1 mt-2">
//                       {selectedDepartments.map((dept) => (
//                         <div
//                           key={dept._id}
//                           className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
//                         >
//                           <span>{dept.name}</span>
//                           <button
//                             type="button"
//                             onClick={() => handleDepartmentToggle(dept._id, false)}
//                             className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
//                             disabled={loading}
//                           >
//                             <X className="h-3 w-3" />
//                           </button>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>

//                 {/* Parent Role Selection with Search */}
//                 <div className="space-y-2 md:col-span-2">
//                   <Label className="text-foreground">
//                     Reports To (Parent Role) - Search Users
//                   </Label>
                  
//                   {/* Selected Parent Role Display */}
//                   {selectedParentRole && (
//                     <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border">
//                       <span className="text-sm font-medium">
//                         Selected: {selectedParentRole.user_id?.name}
//                       </span>
//                       <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
//                         {selectedParentRole.roleDefinitionId?.roleName}
//                       </span>
//                       <Button
//                         type="button"
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => setFormData(prev => ({ ...prev, parentRoleId: "" }))}
//                         className="ml-auto h-6 w-6 p-0"
//                       >
//                         ×
//                       </Button>
//                     </div>
//                   )}
                  
//                   {/* Search Input */}
//                   <div className="relative">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
//                     <Input
//                       placeholder="Search for parent role by name or role..."
//                       value={parentRoleSearch}
//                       onChange={(e) => {
//                         setParentRoleSearch(e.target.value);
//                         setShowParentRoleDropdown(true);
//                       }}
//                       onFocus={() => setShowParentRoleDropdown(true)}
//                       disabled={loading || usersLoading}
//                       className="pl-10 bg-input border-border text-foreground"
//                     />
//                   </div>

//                   {/* Search Results Dropdown */}
//                   {showParentRoleDropdown && parentRoleSearch && (
//                     <div className="relative">
//                       <div className="absolute top-1 left-0 right-0 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
//                         {availableParentRoles.length > 0 ? (
//                           availableParentRoles.map((user) => (
//                             <button
//                               key={user._id}
//                               type="button"
//                               onClick={() => handleParentRoleSelect(user._id)}
//                               className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 border-b border-border last:border-b-0"
//                             >
//                               <div className="flex flex-col">
//                                 <span className="font-medium text-foreground">
//                                   {user.user_id?.name}
//                                 </span>
//                                 <div className="flex items-center gap-2">
//                                   <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
//                                     {user.roleDefinitionId?.roleName}
//                                   </span>
//                                   <span className="text-xs text-muted-foreground">
//                                     Level {user.roleDefinitionId?.hierarchyLevel}
//                                   </span>
//                                 </div>
//                               </div>
//                             </button>
//                           ))
//                         ) : (
//                           <div className="px-3 py-2 text-muted-foreground text-sm">
//                             No users found matching "{parentRoleSearch}"
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   )}
                  
//                   <p className="text-xs text-muted-foreground">
//                     Search and select a user who will be the parent role (manager) for this user
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Password Section - Simplified */}
//             <div>
//               <h3 className="text-lg font-medium mb-4 text-foreground">
//                 Account Security
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="password" className="text-foreground">
//                     Password <span className="text-destructive">*</span>
//                   </Label>
//                   <Input
//                     id="password"
//                     type="password"
//                     placeholder="Password"
//                     value={formData.password}
//                     onChange={(e) => handleInputChange("password", e.target.value)}
//                     disabled={loading}
//                     className="bg-input border-border text-foreground"
//                   />
//                   <p className="text-xs text-muted-foreground">
//                     Default password: "12345678"
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Action Buttons */}
//             <div className="flex justify-end gap-3 pt-4 border-t border-border">
//               <Button
//                 variant="outline"
//                 onClick={handleResetForm}
//                 disabled={loading}
//                 className="border-border text-foreground hover:bg-muted"
//               >
//                 Reset Form
//               </Button>
//               <Button
//                 onClick={handleCreateAccount}
//                 className="bg-primary text-primary-foreground hover:bg-primary/90"
//                 disabled={loading}
//               >
//                 {loading ? (
//                   <>
//                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                     Creating...
//                   </>
//                 ) : (
//                   "Create Account"
//                 )}
//               </Button>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Footer */}
//         <div className="text-center text-sm text-muted-foreground py-4">
//           © 2025 PulseSeal . All rights reserved.
//         </div>
//       </div>
//     </div>
//   );
// }
