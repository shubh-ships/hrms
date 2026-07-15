import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Loader2, Search, ChevronDown, User } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { 
  updateUser, 
  updateUserInState,
  fetchUsers 
} from "@/features/user/userSlice";
import { fetchDepartments } from "@/features/departments/departmentSlice";
import { 
  getAllRoles, 
  selectRoles,
  selectRoleLoading 
} from "@/features/role/roleSlice";

interface EditUserModalProps {
  user: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedUser: any) => void;
}

export default function EditUserModal({
  user,
  isOpen,
  onClose,
  onSave,
}: EditUserModalProps) {
  const dispatch = useAppDispatch();
  const { loading, users } = useAppSelector((state) => state.users);
  const { departments } = useAppSelector((state) => state.departments);
  const roles = useAppSelector(selectRoles);
  const roleLoading = useAppSelector(selectRoleLoading);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
  });
  
  const [roleData, setRoleData] = useState({
    roleDefinitionId: "",
    departments: [] as string[],
    parentRoleId: "",
  });

  const [departmentPopoverOpen, setDepartmentPopoverOpen] = useState(false);
  const [parentRoleSearch, setParentRoleSearch] = useState("");
  const [showParentRoleDropdown, setShowParentRoleDropdown] = useState(false);

  // 🔥 FIX: Restore body scroll when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        document.body.style.pointerEvents = '';
      }, 100);
    }
  }, [isOpen]);

  // Fetch required data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (!departments || departments.length === 0) {
        dispatch(fetchDepartments({}));
      }
      if (!roles || roles.length === 0) {
        dispatch(getAllRoles());
      }
      if (!users || users.length === 0) {
        dispatch(fetchUsers());
      }
    }
  }, [isOpen, departments, roles, users, dispatch]);

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      const userData = user.user_id || user;
      
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        phoneNumber: userData.phoneNumber ? String(userData.phoneNumber) : "",
      });

      // Handle role and department data
      const userDepartmentIds = user.departments?.map((dept: any) => dept._id) || [];
      
      setRoleData({
        roleDefinitionId: user.roleDefinitionId?._id || "",
        departments: userDepartmentIds,
        parentRoleId: user.parentRoleId?._id || "",
      });
    }
  }, [user]);

  // Filter available parent roles (users) based on search
  const availableParentRoles = useMemo(() => {
    if (!users.length) return [];
    
    return users
      .filter((roleUser) => {
        const isNotCurrentUser = roleUser._id !== (user?._id || user?.user_id?._id);
        const matchesSearch = roleUser.user_id?.name
          ?.toLowerCase()
          .includes(parentRoleSearch.toLowerCase()) || 
          roleUser.roleDefinitionId?.roleName
            ?.toLowerCase()
            .includes(parentRoleSearch.toLowerCase());
        const isActive = roleUser.status === "active" && roleUser.user_id?.isActive;
        
        return matchesSearch && isNotCurrentUser && isActive && roleUser.user_id?.name;
      })
      .sort((a, b) => {
        const aLevel = a.roleDefinitionId?.hierarchyLevel || 999;
        const bLevel = b.roleDefinitionId?.hierarchyLevel || 999;
        return aLevel - bLevel;
      });
  }, [users, parentRoleSearch, user]);

  const selectedParentRole = useMemo(() => {
    if (!roleData.parentRoleId) return null;
    return users.find(u => u._id === roleData.parentRoleId);
  }, [roleData.parentRoleId, users]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRoleChange = (field: string, value: string) => {
    setRoleData((prev) => ({ ...prev, [field]: value }));
  };

  // 🔥 CRITICAL FIX: Department toggle that prevents Popover close
  const handleDepartmentToggle = (departmentId: string, checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    setRoleData((prev) => ({
      ...prev,
      departments: isChecked
        ? [...prev.departments, departmentId]
        : prev.departments.filter(id => id !== departmentId)
    }));
  };

  const handleSelectAllDepartments = (checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    const departmentsArray = Array.isArray(departments) ? departments : [];
    setRoleData((prev) => ({
      ...prev,
      departments: isChecked ? departmentsArray.map(dept => dept._id) : []
    }));
  };

  const handleParentRoleSelect = (userRoleId: string) => {
    setRoleData(prev => ({ ...prev, parentRoleId: userRoleId }));
    setParentRoleSearch("");
    setShowParentRoleDropdown(false);
  };

  const handleSave = async () => {
    if (!user) return;

    // Validation
    if (!formData.name || !formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!formData.email || !formData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!formData.phoneNumber || !String(formData.phoneNumber).trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (!roleData.roleDefinitionId) {
      toast.error("Role is required");
      return;
    }

    const userId = user.user_id?._id || user._id;
    const departmentsArray = Array.isArray(departments) ? departments : [];

    // Optimistic update
    const optimisticUpdates = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phoneNumber: String(formData.phoneNumber).trim(),
      departments: departmentsArray.filter(dept => roleData.departments.includes(dept._id)),
    };

    dispatch(
      updateUserInState({
        id: userId,
        updates: optimisticUpdates,
      })
    );

    try {
      // Prepare update data according to backend structure
      const updateUserData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phoneNumber: String(formData.phoneNumber).trim(),
        departments: departmentsArray.filter(dept => roleData.departments.includes(dept._id)),
      };

      const updateRollData = {
        roleDefinitionId: roleData.roleDefinitionId,
        departments: roleData.departments,
        ...(roleData.parentRoleId && { parentRoleId: roleData.parentRoleId }),
      };

      const result = await dispatch(
        updateUser({ 
          id: userId, 
          updateUserData,
          updateRollData
        })
      ).unwrap();

      toast.success("User updated successfully");
      onSave(result.data?.user || result);
      onClose();
    } catch (error: any) {
      console.error("Update error:", error);

      // Revert optimistic update on error
      const userData = user.user_id || user;
      dispatch(
        updateUserInState({
          id: userId,
          updates: {
            user_id: userData.user_id || userData._id,
            departments: user.departments?.map((dept: any) => dept._id) || [],
          },
        })
      );

      toast.error(error || "Failed to update user");
    }
  };

  const handleCancel = () => {
    if (user) {
      const userData = user.user_id || user;
      const userDepartmentIds = user.departments?.map((dept: any) => dept._id) || [];
      
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        phoneNumber: userData.phoneNumber ? String(userData.phoneNumber) : "",
      });
      
      setRoleData({
        roleDefinitionId: user.roleDefinitionId?._id || "",
        departments: userDepartmentIds,
        parentRoleId: user.parentRoleId?._id || "",
      });
    }
    setParentRoleSearch("");
    setShowParentRoleDropdown(false);
    setDepartmentPopoverOpen(false);
    onClose();
  };

  if (!user) return null;

  const departmentsArray = Array.isArray(departments) ? departments : [];
  const sortedRoles = [...(roles || [])].sort((a, b) => a.hierarchyLevel - b.hierarchyLevel);
  
  const selectedDepartments = departmentsArray.filter(dept => 
    roleData.departments.includes(dept._id)
  );

  const allDepartmentsSelected = departmentsArray.length > 0 && 
    roleData.departments.length === departmentsArray.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-0 max-h-[90vh]">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Edit User Details
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Update user profile and role assignments.
              </p>
            </div>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <ScrollArea className="px-6 py-4 space-y-6 max-h-[70vh]">
          {/* User Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">User Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full bg-input text-foreground border-input"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full bg-input text-foreground border-input"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-foreground">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  className="w-full bg-input text-foreground border-input"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Role Assignment Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Role & Hierarchy Assignment</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="roleDefinitionId" className="text-foreground">
                  Role <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={roleData.roleDefinitionId}
                  onValueChange={(value) => handleRoleChange("roleDefinitionId", value)}
                  disabled={loading || roleLoading}
                >
                  <SelectTrigger className="bg-input text-foreground border-input">
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

              {/* 🔥 FIXED: Multi-Select Departments with proper event handling */}
              <div className="space-y-2">
                <Label className="text-foreground">
                  Departments <span className="text-destructive">*</span>
                </Label>
                <Popover 
                  open={departmentPopoverOpen} 
                  onOpenChange={setDepartmentPopoverOpen}
                  modal={true}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={departmentPopoverOpen}
                      className="w-full justify-between bg-input border-input text-foreground hover:bg-muted"
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
                  <PopoverContent 
                    className="w-[var(--radix-popover-trigger-width)] p-0" 
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <div className="max-h-60 overflow-y-auto">
                      {/* Select All Option */}
                      <div 
                        className="flex items-center space-x-2 px-3 py-2 border-b hover:bg-muted cursor-pointer"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          handleSelectAllDepartments(!allDepartmentsSelected);
                        }}
                      >
                        <Checkbox
                          id="select-all"
                          checked={allDepartmentsSelected}
                          onCheckedChange={handleSelectAllDepartments}
                          onPointerDown={(e) => e.stopPropagation()}
                        />
                        <label
                          htmlFor="select-all"
                          className="text-sm font-medium leading-none cursor-pointer flex-1"
                          onPointerDown={(e) => e.preventDefault()}
                        >
                          Select All
                        </label>
                      </div>

                      {/* Individual Department Options */}
                      {departmentsArray.map((dept) => {
                        const isChecked = roleData.departments.includes(dept._id);
                        return (
                          <div
                            key={dept._id}
                            className="flex items-center space-x-2 px-3 py-2 hover:bg-muted cursor-pointer"
                            onPointerDown={(e) => {
                              e.preventDefault();
                              handleDepartmentToggle(dept._id, !isChecked);
                            }}
                          >
                            <Checkbox
                              id={dept._id}
                              checked={isChecked}
                              onCheckedChange={(checked) => handleDepartmentToggle(dept._id, checked)}
                              onPointerDown={(e) => e.stopPropagation()}
                            />
                            <label
                              htmlFor={dept._id}
                              className="text-sm font-normal leading-none cursor-pointer flex-1"
                              onPointerDown={(e) => e.preventDefault()}
                            >
                              {dept.name} ({dept.alias})
                            </label>
                          </div>
                        );
                      })}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDepartmentToggle(dept._id, false);
                          }}
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
            </div>

            {/* Parent Role Selection with Search */}
            <div className="space-y-2">
              <Label className="text-foreground">
                Reports To (Parent Role) - Search Users
              </Label>
              
              {/* Selected Parent Role Display */}
              {selectedParentRole && (
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border">
                  <span className="text-sm font-medium">
                    Selected: {selectedParentRole.user_id?.name}
                  </span>
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                    {selectedParentRole.roleDefinitionId?.roleName}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRoleData(prev => ({ ...prev, parentRoleId: "" }))}
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
                  placeholder="Search for parent role by name or role..."
                  value={parentRoleSearch}
                  onChange={(e) => {
                    setParentRoleSearch(e.target.value);
                    setShowParentRoleDropdown(true);
                  }}
                  onFocus={() => setShowParentRoleDropdown(true)}
                  disabled={loading}
                  className="pl-10 bg-input border-input text-foreground"
                />
              </div>

              {/* Search Results Dropdown */}
              {showParentRoleDropdown && parentRoleSearch && (
                <div className="relative">
                  <div className="absolute top-1 left-0 right-0 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                    {availableParentRoles.length > 0 ? (
                      availableParentRoles.map((roleUser) => (
                        <button
                          key={roleUser._id}
                          type="button"
                          onClick={() => handleParentRoleSelect(roleUser._id)}
                          className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 border-b border-border last:border-b-0"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {roleUser.user_id?.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                {roleUser.roleDefinitionId?.roleName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Level {roleUser.roleDefinitionId?.hierarchyLevel}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-muted-foreground text-sm">
                        No users found matching "{parentRoleSearch}"
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Search and select a user who will be the parent role (manager) for this user
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="border-border text-foreground hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// // import { useState, useEffect, useMemo } from "react";
// // import {
// //   Dialog,
// //   DialogClose,
// //   DialogContent,
// //   DialogHeader,
// //   DialogTitle,
// // } from "@/components/ui/dialog";
// // import { Input } from "@/components/ui/input";
// // import { Label } from "@/components/ui/label";
// // import { Button } from "@/components/ui/button";
// // import {
// //   Select,
// //   SelectContent,
// //   SelectItem,
// //   SelectTrigger,
// //   SelectValue,
// // } from "@/components/ui/select";
// // import { Checkbox } from "@/components/ui/checkbox";
// // import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// // import { ScrollArea } from "@/components/ui/scroll-area";
// // import { X, Loader2, Search, ChevronDown, User } from "lucide-react";
// // import { toast } from "sonner";
// // import { useAppDispatch, useAppSelector } from "@/store/hooks";
// // import { 
// //   updateUser, 
// //   updateUserInState,
// //   fetchUsers 
// // } from "@/features/user/userSlice";
// // import { fetchDepartments } from "@/features/departments/departmentSlice";
// // import { 
// //   getAllRoles, 
// //   selectRoles,
// //   selectRoleLoading 
// // } from "@/features/role/roleSlice";

// // interface EditUserModalProps {
// //   user: any | null;
// //   isOpen: boolean;
// //   onClose: () => void;
// //   onSave: (updatedUser: any) => void;
// // }

// // export default function EditUserModal({
// //   user,
// //   isOpen,
// //   onClose,
// //   onSave,
// // }: EditUserModalProps) {
// //   const dispatch = useAppDispatch();
// //   const { loading, users } = useAppSelector((state) => state.users);
// //   const { departments } = useAppSelector((state) => state.departments);
// //   const roles = useAppSelector(selectRoles);
// //   const roleLoading = useAppSelector(selectRoleLoading);
  
// //   const [formData, setFormData] = useState({
// //     name: "",
// //     email: "",
// //     phoneNumber: "",
// //   });
  
// //   const [roleData, setRoleData] = useState({
// //     roleDefinitionId: "",
// //     departmentIds: [] as string[],
// //     parentRoleId: "",
// //   });

// //   const [departmentPopoverOpen, setDepartmentPopoverOpen] = useState(false);
// //   const [parentRoleSearch, setParentRoleSearch] = useState("");
// //   const [showParentRoleDropdown, setShowParentRoleDropdown] = useState(false);

// //   // Fetch required data when modal opens
// //   useEffect(() => {
// //     if (isOpen) {
// //       if (!departments || departments.length === 0) {
// //         dispatch(fetchDepartments({}));
// //       }
// //       if (!roles || roles.length === 0) {
// //         dispatch(getAllRoles());
// //       }
// //       if (!users || users.length === 0) {
// //         dispatch(fetchUsers());
// //       }
// //     }
// //   }, [isOpen, departments, roles, users, dispatch]);

// //   // Update form data when user changes
// //   useEffect(() => {
// //     if (user) {
// //       const userData = user.user_id || user;
      
// //       setFormData({
// //         name: userData.name || "",
// //         email: userData.email || "",
// //         phoneNumber: userData.phoneNumber ? String(userData.phoneNumber) : "",
// //       });

// //       // Handle role and department data
// //       const userDepartmentIds = user.departments?.map((dept: any) => dept._id) || [];
      
// //       setRoleData({
// //         roleDefinitionId: user.roleDefinitionId?._id || "",
// //         departmentIds: userDepartmentIds,
// //         parentRoleId: user.parentRoleId?._id || "",
// //       });
// //     }
// //   }, [user]);

// //   // Filter available parent roles (users) based on search
// //   const availableParentRoles = useMemo(() => {
// //     if (!users.length) return [];
    
// //     return users
// //       .filter((roleUser) => {
// //         const isNotCurrentUser = roleUser._id !== (user?._id || user?.user_id?._id);
// //         const matchesSearch = roleUser.user_id?.name
// //           ?.toLowerCase()
// //           .includes(parentRoleSearch.toLowerCase()) || 
// //           roleUser.roleDefinitionId?.roleName
// //             ?.toLowerCase()
// //             .includes(parentRoleSearch.toLowerCase());
// //         const isActive = roleUser.status === "active" && roleUser.user_id?.isActive;
        
// //         return matchesSearch && isNotCurrentUser && isActive && roleUser.user_id?.name;
// //       })
// //       .sort((a, b) => {
// //         const aLevel = a.roleDefinitionId?.hierarchyLevel || 999;
// //         const bLevel = b.roleDefinitionId?.hierarchyLevel || 999;
// //         return aLevel - bLevel;
// //       });
// //   }, [users, parentRoleSearch, user]);

// //   const selectedParentRole = useMemo(() => {
// //     if (!roleData.parentRoleId) return null;
// //     return users.find(u => u._id === roleData.parentRoleId);
// //   }, [roleData.parentRoleId, users]);

// //   const handleInputChange = (field: string, value: string) => {
// //     setFormData((prev) => ({ ...prev, [field]: value }));
// //   };

// //   const handleRoleChange = (field: string, value: string) => {
// //     setRoleData((prev) => ({ ...prev, [field]: value }));
// //   };

// //   const handleDepartmentToggle = (departmentId: string, checked: boolean) => {
// //     setRoleData((prev) => ({
// //       ...prev,
// //       departmentIds: checked
// //         ? [...prev.departmentIds, departmentId]
// //         : prev.departmentIds.filter(id => id !== departmentId)
// //     }));
// //   };

// //   const handleSelectAllDepartments = (checked: boolean) => {
// //     const departmentsArray = Array.isArray(departments) ? departments : [];
// //     setRoleData((prev) => ({
// //       ...prev,
// //       departmentIds: checked ? departmentsArray.map(dept => dept._id) : []
// //     }));
// //   };

// //   const handleParentRoleSelect = (userRoleId: string) => {
// //     setRoleData(prev => ({ ...prev, parentRoleId: userRoleId }));
// //     setParentRoleSearch("");
// //     setShowParentRoleDropdown(false);
// //   };

// //   const handleSave = async () => {
// //     if (!user) return;

// //     // Validation
// //     if (!formData.name || !formData.name.trim()) {
// //       toast.error("Name is required");
// //       return;
// //     }
// //     if (!formData.email || !formData.email.trim()) {
// //       toast.error("Email is required");
// //       return;
// //     }
// //     if (!formData.phoneNumber || !String(formData.phoneNumber).trim()) {
// //       toast.error("Phone number is required");
// //       return;
// //     }
// //     if (!roleData.roleDefinitionId) {
// //       toast.error("Role is required");
// //       return;
// //     }
// //     if (roleData.departmentIds.length === 0) {
// //       toast.error("At least one department must be selected");
// //       return;
// //     }

// //     const userId = user.user_id?._id || user._id;

// //     // Optimistic update
// //     const optimisticUpdates = {
// //       name: formData.name.trim(),
// //       email: formData.email.trim(),
// //       phoneNumber: String(formData.phoneNumber).trim(),
// //     };

// //     dispatch(
// //       updateUserInState({
// //         id: userId,
// //         updates: optimisticUpdates,
// //       })
// //     );

// //     try {
// //       // Prepare update data according to backend structure
// //       const updateUserData = {
// //         name: formData.name.trim(),
// //         email: formData.email.trim(),
// //         phoneNumber: String(formData.phoneNumber).trim(),
// //       };

// //       const updateRollData = {
// //         roleDefinitionId: roleData.roleDefinitionId,
// //         departmentIds: roleData.departmentIds,
// //         ...(roleData.parentRoleId && { parentRoleId: roleData.parentRoleId }),
// //       };

// //       const result = await dispatch(
// //         updateUser({ 
// //           id: userId, 
// //           updateUserData,
// //           updateRollData
// //         })
// //       ).unwrap();

// //       toast.success("User updated successfully");
// //       onSave(result.data?.user || result);
// //       onClose();
// //     } catch (error: any) {
// //       console.error("Update error:", error);

// //       // Revert optimistic update on error
// //       const userData = user.user_id || user;
// //       dispatch(
// //         updateUserInState({
// //           id: userId,
// //           updates: {
// //             name: userData.name,
// //             email: userData.email,
// //             phoneNumber: userData.phoneNumber,
// //           },
// //         })
// //       );

// //       toast.error(error || "Failed to update user");
// //     }
// //   };

// //   const handleCancel = () => {
// //     if (user) {
// //       const userData = user.user_id || user;
// //       const userDepartmentIds = user.departments?.map((dept: any) => dept._id) || [];
      
// //       setFormData({
// //         name: userData.name || "",
// //         email: userData.email || "",
// //         phoneNumber: userData.phoneNumber ? String(userData.phoneNumber) : "",
// //       });
      
// //       setRoleData({
// //         roleDefinitionId: user.roleDefinitionId?._id || "",
// //         departmentIds: userDepartmentIds,
// //         parentRoleId: user.parentRoleId?._id || "",
// //       });
// //     }
// //     setParentRoleSearch("");
// //     setShowParentRoleDropdown(false);
// //     setDepartmentPopoverOpen(false);
// //     onClose();
// //   };

// //   if (!user) return null;

// //   const departmentsArray = Array.isArray(departments) ? departments : [];
// //   const sortedRoles = [...(roles || [])].sort((a, b) => a.hierarchyLevel - b.hierarchyLevel);
  
// //   const selectedDepartments = departmentsArray.filter(dept => 
// //     roleData.departmentIds.includes(dept._id)
// //   );

// //   const allDepartmentsSelected = departmentsArray.length > 0 && 
// //     roleData.departmentIds.length === departmentsArray.length;

// //   return (
// //     <Dialog open={isOpen} onOpenChange={onClose}>
// //       <DialogContent className="sm:max-w-[700px] p-0 max-h-[90vh]">
// //         <DialogHeader className="px-6 py-4 border-b border-border">
// //           <div className="flex items-center justify-between">
// //             <div>
// //               <DialogTitle className="flex items-center gap-2">
// //                 <User className="h-5 w-5" />
// //                 Edit User Details
// //               </DialogTitle>
// //               <p className="text-sm text-muted-foreground mt-1">
// //                 Update user profile and role assignments.
// //               </p>
// //             </div>
// //             <DialogClose asChild>
// //               <Button
// //                 variant="ghost"
// //                 size="sm"
// //                 className="h-6 w-6 p-0 text-muted-foreground hover:bg-muted"
// //               >
// //                 <X className="h-4 w-4" />
// //               </Button>
// //             </DialogClose>
// //           </div>
// //         </DialogHeader>

// //         <ScrollArea className="px-6 py-4 space-y-6 max-h-[70vh]">
// //           {/* User Information Section */}
// //           <div className="space-y-4">
// //             <h3 className="text-lg font-semibold text-foreground">User Information</h3>
// //             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
// //               <div className="space-y-2">
// //                 <Label htmlFor="name" className="text-foreground">
// //                   Full Name <span className="text-destructive">*</span>
// //                 </Label>
// //                 <Input
// //                   id="name"
// //                   value={formData.name}
// //                   onChange={(e) => handleInputChange("name", e.target.value)}
// //                   className="w-full bg-input text-foreground border-input"
// //                   disabled={loading}
// //                 />
// //               </div>
// //               <div className="space-y-2">
// //                 <Label htmlFor="email" className="text-foreground">
// //                   Email ID <span className="text-destructive">*</span>
// //                 </Label>
// //                 <Input
// //                   id="email"
// //                   type="email"
// //                   value={formData.email}
// //                   onChange={(e) => handleInputChange("email", e.target.value)}
// //                   className="w-full bg-input text-foreground border-input"
// //                   disabled={loading}
// //                 />
// //               </div>
// //               <div className="space-y-2">
// //                 <Label htmlFor="phoneNumber" className="text-foreground">
// //                   Phone Number <span className="text-destructive">*</span>
// //                 </Label>
// //                 <Input
// //                   id="phoneNumber"
// //                   value={formData.phoneNumber}
// //                   onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
// //                   className="w-full bg-input text-foreground border-input"
// //                   disabled={loading}
// //                 />
// //               </div>
// //             </div>
// //           </div>

// //           {/* Role Assignment Section */}
// //           <div className="space-y-4">
// //             <h3 className="text-lg font-semibold text-foreground">Role & Hierarchy Assignment</h3>
            
// //             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //               {/* Role Selection */}
// //               <div className="space-y-2">
// //                 <Label htmlFor="roleDefinitionId" className="text-foreground">
// //                   Role <span className="text-destructive">*</span>
// //                 </Label>
// //                 <Select
// //                   value={roleData.roleDefinitionId}
// //                   onValueChange={(value) => handleRoleChange("roleDefinitionId", value)}
// //                   disabled={loading || roleLoading}
// //                 >
// //                   <SelectTrigger className="bg-input text-foreground border-input">
// //                     <SelectValue placeholder="Select role from hierarchy" />
// //                   </SelectTrigger>
// //                   <SelectContent className="bg-background border-border text-foreground max-h-60">
// //                     {sortedRoles.map((role) => (
// //                       <SelectItem key={role._id} value={role._id}>
// //                         <div className="flex items-center gap-2">
// //                           <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
// //                             L{role.hierarchyLevel}
// //                           </span>
// //                           <span>{role.roleName}</span>
// //                         </div>
// //                       </SelectItem>
// //                     ))}
// //                   </SelectContent>
// //                 </Select>
// //               </div>

// //               {/* Multi-Select Departments */}
// //               <div className="space-y-2">
// //                 <Label className="text-foreground">
// //                   Departments <span className="text-destructive">*</span>
// //                 </Label>
// //                 <Popover open={departmentPopoverOpen} onOpenChange={setDepartmentPopoverOpen}>
// //                   <PopoverTrigger asChild>
// //                     <Button
// //                       variant="outline"
// //                       role="combobox"
// //                       aria-expanded={departmentPopoverOpen}
// //                       className="w-full justify-between bg-input border-input text-foreground hover:bg-muted"
// //                       disabled={loading}
// //                     >
// //                       <div className="flex items-center gap-1 overflow-hidden">
// //                         {selectedDepartments.length === 0 ? (
// //                           <span className="text-muted-foreground">Select departments...</span>
// //                         ) : selectedDepartments.length === 1 ? (
// //                           <span>{selectedDepartments[0].name}</span>
// //                         ) : (
// //                           <span>{selectedDepartments.length} departments selected</span>
// //                         )}
// //                       </div>
// //                       <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
// //                     </Button>
// //                   </PopoverTrigger>
// //                   <PopoverContent className="w-full p-0" align="start">
// //                     <div className="max-h-60 overflow-y-auto">
// //                       {/* Select All Option */}
// //                       <div className="flex items-center space-x-2 px-3 py-2 border-b hover:bg-muted">
// //                         <Checkbox
// //                           id="select-all"
// //                           checked={allDepartmentsSelected}
// //                           onCheckedChange={handleSelectAllDepartments}
// //                         />
// //                         <label
// //                           htmlFor="select-all"
// //                           className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
// //                         >
// //                           Select All
// //                         </label>
// //                       </div>

// //                       {/* Individual Department Options */}
// //                       {departmentsArray.map((dept) => (
// //                         <div
// //                           key={dept._id}
// //                           className="flex items-center space-x-2 px-3 py-2 hover:bg-muted"
// //                         >
// //                           <Checkbox
// //                             id={dept._id}
// //                             checked={roleData.departmentIds.includes(dept._id)}
// //                             onCheckedChange={(checked) => 
// //                               handleDepartmentToggle(dept._id, checked as boolean)
// //                             }
// //                           />
// //                           <label
// //                             htmlFor={dept._id}
// //                             className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
// //                           >
// //                             {dept.name} ({dept.alias})
// //                           </label>
// //                         </div>
// //                       ))}
// //                     </div>
// //                   </PopoverContent>
// //                 </Popover>

// //                 {/* Selected Departments Display */}
// //                 {selectedDepartments.length > 0 && (
// //                   <div className="flex flex-wrap gap-1 mt-2">
// //                     {selectedDepartments.map((dept) => (
// //                       <div
// //                         key={dept._id}
// //                         className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
// //                       >
// //                         <span>{dept.name}</span>
// //                         <button
// //                           type="button"
// //                           onClick={() => handleDepartmentToggle(dept._id, false)}
// //                           className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
// //                           disabled={loading}
// //                         >
// //                           <X className="h-3 w-3" />
// //                         </button>
// //                       </div>
// //                     ))}
// //                   </div>
// //                 )}
// //               </div>
// //             </div>

// //             {/* Parent Role Selection with Search */}
// //             <div className="space-y-2">
// //               <Label className="text-foreground">
// //                 Reports To (Parent Role) - Search Users
// //               </Label>
              
// //               {/* Selected Parent Role Display */}
// //               {selectedParentRole && (
// //                 <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border">
// //                   <span className="text-sm font-medium">
// //                     Selected: {selectedParentRole.user_id?.name}
// //                   </span>
// //                   <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
// //                     {selectedParentRole.roleDefinitionId?.roleName}
// //                   </span>
// //                   <Button
// //                     type="button"
// //                     variant="ghost"
// //                     size="sm"
// //                     onClick={() => setRoleData(prev => ({ ...prev, parentRoleId: "" }))}
// //                     className="ml-auto h-6 w-6 p-0"
// //                   >
// //                     ×
// //                   </Button>
// //                 </div>
// //               )}
              
// //               {/* Search Input */}
// //               <div className="relative">
// //                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
// //                 <Input
// //                   placeholder="Search for parent role by name or role..."
// //                   value={parentRoleSearch}
// //                   onChange={(e) => {
// //                     setParentRoleSearch(e.target.value);
// //                     setShowParentRoleDropdown(true);
// //                   }}
// //                   onFocus={() => setShowParentRoleDropdown(true)}
// //                   disabled={loading}
// //                   className="pl-10 bg-input border-input text-foreground"
// //                 />
// //               </div>

// //               {/* Search Results Dropdown */}
// //               {showParentRoleDropdown && parentRoleSearch && (
// //                 <div className="relative">
// //                   <div className="absolute top-1 left-0 right-0 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
// //                     {availableParentRoles.length > 0 ? (
// //                       availableParentRoles.map((roleUser) => (
// //                         <button
// //                           key={roleUser._id}
// //                           type="button"
// //                           onClick={() => handleParentRoleSelect(roleUser._id)}
// //                           className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 border-b border-border last:border-b-0"
// //                         >
// //                           <div className="flex flex-col">
// //                             <span className="font-medium text-foreground">
// //                               {roleUser.user_id?.name}
// //                             </span>
// //                             <div className="flex items-center gap-2">
// //                               <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
// //                                 {roleUser.roleDefinitionId?.roleName}
// //                               </span>
// //                               <span className="text-xs text-muted-foreground">
// //                                 Level {roleUser.roleDefinitionId?.hierarchyLevel}
// //                               </span>
// //                             </div>
// //                           </div>
// //                         </button>
// //                       ))
// //                     ) : (
// //                       <div className="px-3 py-2 text-muted-foreground text-sm">
// //                         No users found matching "{parentRoleSearch}"
// //                       </div>
// //                     )}
// //                   </div>
// //                 </div>
// //               )}
              
// //               <p className="text-xs text-muted-foreground">
// //                 Search and select a user who will be the parent role (manager) for this user
// //               </p>
// //             </div>
// //           </div>
// //         </ScrollArea>

// //         <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
// //           <Button
// //             variant="outline"
// //             onClick={handleCancel}
// //             disabled={loading}
// //             className="border-border text-foreground hover:bg-muted"
// //           >
// //             Cancel
// //           </Button>
// //           <Button
// //             onClick={handleSave}
// //             className="bg-primary text-primary-foreground hover:bg-primary/90"
// //             disabled={loading}
// //           >
// //             {loading ? (
// //               <>
// //                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
// //                 Saving...
// //               </>
// //             ) : (
// //               "Save Changes"
// //             )}
// //           </Button>
// //         </div>
// //       </DialogContent>
// //     </Dialog>
// //   );
// // }


// import { useState, useEffect, useMemo } from "react";
// import {
//   Dialog,
//   DialogClose,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
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
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { X, Loader2, Search, ChevronDown, User } from "lucide-react";
// import { toast } from "sonner";
// import { useAppDispatch, useAppSelector } from "@/store/hooks";
// import { 
//   updateUser, 
//   updateUserInState,
//   fetchUsers 
// } from "@/features/user/userSlice";
// import { fetchDepartments } from "@/features/departments/departmentSlice";
// import { 
//   getAllRoles, 
//   selectRoles,
//   selectRoleLoading 
// } from "@/features/role/roleSlice";

// interface EditUserModalProps {
//   user: any | null;
//   isOpen: boolean;
//   onClose: () => void;
//   onSave: (updatedUser: any) => void;
// }

// export default function EditUserModal({
//   user,
//   isOpen,
//   onClose,
//   onSave,
// }: EditUserModalProps) {
//   const dispatch = useAppDispatch();
//   const { loading, users } = useAppSelector((state) => state.users);
//   const { departments } = useAppSelector((state) => state.departments);
//   const roles = useAppSelector(selectRoles);
//   const roleLoading = useAppSelector(selectRoleLoading);
  
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     phoneNumber: "",
//   });
  
//   const [roleData, setRoleData] = useState({
//     roleDefinitionId: "",
//     departments: [] as string[],
//     parentRoleId: "",
//   });

//   const [departmentPopoverOpen, setDepartmentPopoverOpen] = useState(false);
//   const [parentRoleSearch, setParentRoleSearch] = useState("");
//   const [showParentRoleDropdown, setShowParentRoleDropdown] = useState(false);

//   // Fetch required data when modal opens
//   useEffect(() => {
//     if (isOpen) {
//       if (!departments || departments.length === 0) {
//         dispatch(fetchDepartments({}));
//       }
//       if (!roles || roles.length === 0) {
//         dispatch(getAllRoles());
//       }
//       if (!users || users.length === 0) {
//         dispatch(fetchUsers());
//       }
//     }
//   }, [isOpen, departments, roles, users, dispatch]);

//   // Update form data when user changes
//   useEffect(() => {
//     if (user) {
//       const userData = user.user_id || user;
      
//       setFormData({
//         name: userData.name || "",
//         email: userData.email || "",
//         phoneNumber: userData.phoneNumber ? String(userData.phoneNumber) : "",
//       });

//       // Handle role and department data
//       const userDepartmentIds = user.departments?.map((dept: any) => dept._id) || [];
      
//       setRoleData({
//         roleDefinitionId: user.roleDefinitionId?._id || "",
//         departments: userDepartmentIds,
//         parentRoleId: user.parentRoleId?._id || "",
//       });
//     }
//   }, [user]);

//   // Filter available parent roles (users) based on search
//   const availableParentRoles = useMemo(() => {
//     if (!users.length) return [];
    
//     return users
//       .filter((roleUser) => {
//         const isNotCurrentUser = roleUser._id !== (user?._id || user?.user_id?._id);
//         const matchesSearch = roleUser.user_id?.name
//           ?.toLowerCase()
//           .includes(parentRoleSearch.toLowerCase()) || 
//           roleUser.roleDefinitionId?.roleName
//             ?.toLowerCase()
//             .includes(parentRoleSearch.toLowerCase());
//         const isActive = roleUser.status === "active" && roleUser.user_id?.isActive;
        
//         return matchesSearch && isNotCurrentUser && isActive && roleUser.user_id?.name;
//       })
//       .sort((a, b) => {
//         const aLevel = a.roleDefinitionId?.hierarchyLevel || 999;
//         const bLevel = b.roleDefinitionId?.hierarchyLevel || 999;
//         return aLevel - bLevel;
//       });
//   }, [users, parentRoleSearch, user]);

//   const selectedParentRole = useMemo(() => {
//     if (!roleData.parentRoleId) return null;
//     return users.find(u => u._id === roleData.parentRoleId);
//   }, [roleData.parentRoleId, users]);

//   const handleInputChange = (field: string, value: string) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleRoleChange = (field: string, value: string) => {
//     setRoleData((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleDepartmentToggle = (departmentId: string, checked: boolean) => {
//     setRoleData((prev) => ({
//       ...prev,
//       departments: checked
//         ? [...prev.departments, departmentId]
//         : prev.departments.filter(id => id !== departmentId)
//     }));
//   };

//   const handleSelectAllDepartments = (checked: boolean) => {
//     const departmentsArray = Array.isArray(departments) ? departments : [];
//     setRoleData((prev) => ({
//       ...prev,
//       departments: checked ? departmentsArray.map(dept => dept._id) : []
//     }));
//   };

//   const handleParentRoleSelect = (userRoleId: string) => {
//     setRoleData(prev => ({ ...prev, parentRoleId: userRoleId }));
//     setParentRoleSearch("");
//     setShowParentRoleDropdown(false);
//   };

//   const handleSave = async () => {
//     if (!user) return;

//     // Validation
//     if (!formData.name || !formData.name.trim()) {
//       toast.error("Name is required");
//       return;
//     }
//     if (!formData.email || !formData.email.trim()) {
//       toast.error("Email is required");
//       return;
//     }
//     if (!formData.phoneNumber || !String(formData.phoneNumber).trim()) {
//       toast.error("Phone number is required");
//       return;
//     }
//     if (!roleData.roleDefinitionId) {
//       toast.error("Role is required");
//       return;
//     }
//     // if (roleData.departments.length === 0) {
//     //   toast.error("At least one department must be selected");
//     //   return;
//     // }

//     const userId = user.user_id?._id || user._id;

//     // Optimistic update
//     const optimisticUpdates = {
//       name: formData.name.trim(),
//       email: formData.email.trim(),
//       phoneNumber: String(formData.phoneNumber).trim(),
//       departments: departmentsArray.filter(dept => roleData.departments.includes(dept._id)),
//     };

//     dispatch(
//       updateUserInState({
//         id: userId,
//         updates: optimisticUpdates,
//       })
//     );

//     try {
//       // Prepare update data according to backend structure
//       const updateUserData = {
//         name: formData.name.trim(),
//         email: formData.email.trim(),
//         phoneNumber: String(formData.phoneNumber).trim(),
//         departments: departmentsArray.filter(dept => roleData.departments.includes(dept._id)), // Map IDs to objects
//       };

//       const updateRollData = {
//         roleDefinitionId: roleData.roleDefinitionId,
//         departments: roleData.departments, // Include departments in updateRollData
//         ...(roleData.parentRoleId && { parentRoleId: roleData.parentRoleId }),
//       };

//       const result = await dispatch(
//         updateUser({ 
//           id: userId, 
//           updateUserData,
//           updateRollData
//         })
//       ).unwrap();

//       toast.success("User updated successfully");
//       onSave(result.data?.user || result);
//       onClose();
//     } catch (error: any) {
//       console.error("Update error:", error);

//       // Revert optimistic update on error
//       const userData = user.user_id || user;
//       dispatch(
//         updateUserInState({
//           id: userId,
//           updates: {
//             user_id: userData.user_id || userData._id,
//             departments: user.departments?.map((dept: any) => dept._id) || [],
//           },
//         })
//       );

//       toast.error(error || "Failed to update user");
//     }
//   };

//   const handleCancel = () => {
//     if (user) {
//       const userData = user.user_id || user;
//       const userDepartmentIds = user.departments?.map((dept: any) => dept._id) || [];
      
//       setFormData({
//         name: userData.name || "",
//         email: userData.email || "",
//         phoneNumber: userData.phoneNumber ? String(userData.phoneNumber) : "",
//       });
      
//       setRoleData({
//         roleDefinitionId: user.roleDefinitionId?._id || "",
//         departments: userDepartmentIds,
//         parentRoleId: user.parentRoleId?._id || "",
//       });
//     }
//     setParentRoleSearch("");
//     setShowParentRoleDropdown(false);
//     setDepartmentPopoverOpen(false);
//     onClose();
//   };

//   if (!user) return null;

//   const departmentsArray = Array.isArray(departments) ? departments : [];
//   const sortedRoles = [...(roles || [])].sort((a, b) => a.hierarchyLevel - b.hierarchyLevel);
  
//   const selectedDepartments = departmentsArray.filter(dept => 
//     roleData.departments.includes(dept._id)
//   );

//   const allDepartmentsSelected = departmentsArray.length > 0 && 
//     roleData.departments.length === departmentsArray.length;

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-[700px] p-0 max-h-[90vh]">
//         <DialogHeader className="px-6 py-4 border-b border-border">
//           <div className="flex items-center justify-between">
//             <div>
//               <DialogTitle className="flex items-center gap-2">
//                 <User className="h-5 w-5" />
//                 Edit User Details
//               </DialogTitle>
//               <p className="text-sm text-muted-foreground mt-1">
//                 Update user profile and role assignments.
//               </p>
//             </div>
//             <DialogClose asChild>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 className="h-6 w-6 p-0 text-muted-foreground hover:bg-muted"
//               >
//                 <X className="h-4 w-4" />
//               </Button>
//             </DialogClose>
//           </div>
//         </DialogHeader>

//         <ScrollArea className="px-6 py-4 space-y-6 max-h-[70vh]">
//           {/* User Information Section */}
//           <div className="space-y-4">
//             <h3 className="text-lg font-semibold text-foreground">User Information</h3>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="name" className="text-foreground">
//                   Full Name <span className="text-destructive">*</span>
//                 </Label>
//                 <Input
//                   id="name"
//                   value={formData.name}
//                   onChange={(e) => handleInputChange("name", e.target.value)}
//                   className="w-full bg-input text-foreground border-input"
//                   disabled={loading}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="email" className="text-foreground">
//                   Email ID <span className="text-destructive">*</span>
//                 </Label>
//                 <Input
//                   id="email"
//                   type="email"
//                   value={formData.email}
//                   onChange={(e) => handleInputChange("email", e.target.value)}
//                   className="w-full bg-input text-foreground border-input"
//                   disabled={loading}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="phoneNumber" className="text-foreground">
//                   Phone Number <span className="text-destructive">*</span>
//                 </Label>
//                 <Input
//                   id="phoneNumber"
//                   value={formData.phoneNumber}
//                   onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
//                   className="w-full bg-input text-foreground border-input"
//                   disabled={loading}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Role Assignment Section */}
//           <div className="space-y-4">
//             <h3 className="text-lg font-semibold text-foreground">Role & Hierarchy Assignment</h3>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {/* Role Selection */}
//               <div className="space-y-2">
//                 <Label htmlFor="roleDefinitionId" className="text-foreground">
//                   Role <span className="text-destructive">*</span>
//                 </Label>
//                 <Select
//                   value={roleData.roleDefinitionId}
//                   onValueChange={(value) => handleRoleChange("roleDefinitionId", value)}
//                   disabled={loading || roleLoading}
//                 >
//                   <SelectTrigger className="bg-input text-foreground border-input">
//                     <SelectValue placeholder="Select role from hierarchy" />
//                   </SelectTrigger>
//                   <SelectContent className="bg-background border-border text-foreground max-h-60">
//                     {sortedRoles.map((role) => (
//                       <SelectItem key={role._id ?? ""} value={role._id ?? ""}>
//                         <div className="flex items-center gap-2">
//                           <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
//                             L{role.hierarchyLevel}
//                           </span>
//                           <span>{role.roleName}</span>
//                         </div>
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               {/* Multi-Select Departments */}
//               <div className="space-y-2">
//                 <Label className="text-foreground">
//                   Departments <span className="text-destructive">*</span>
//                 </Label>
//                 <Popover open={departmentPopoverOpen} onOpenChange={setDepartmentPopoverOpen}>
//                   <PopoverTrigger asChild>
//                     <Button
//                       variant="outline"
//                       role="combobox"
//                       aria-expanded={departmentPopoverOpen}
//                       className="w-full justify-between bg-input border-input text-foreground hover:bg-muted"
//                       disabled={loading}
//                     >
//                       <div className="flex items-center gap-1 overflow-hidden">
//                         {selectedDepartments.length === 0 ? (
//                           <span className="text-muted-foreground">Select departments...</span>
//                         ) : selectedDepartments.length === 1 ? (
//                           <span>{selectedDepartments[0].name}</span>
//                         ) : (
//                           <span>{selectedDepartments.length} departments selected</span>
//                         )}
//                       </div>
//                       <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                     </Button>
//                   </PopoverTrigger>
//                   <PopoverContent className="w-full p-0" align="start">
//                     <div className="max-h-60 overflow-y-auto">
//                       {/* Select All Option */}
//                       <div className="flex items-center space-x-2 px-3 py-2 border-b hover:bg-muted">
//                         <Checkbox
//                           id="select-all"
//                           checked={allDepartmentsSelected}
//                           onCheckedChange={handleSelectAllDepartments}
//                         />
//                         <label
//                           htmlFor="select-all"
//                           className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
//                         >
//                           Select All
//                         </label>
//                       </div>

//                       {/* Individual Department Options */}
//                       {departmentsArray.map((dept) => (
//                         <div
//                           key={dept._id}
//                           className="flex items-center space-x-2 px-3 py-2 hover:bg-muted"
//                         >
//                           <Checkbox
//                             id={dept._id}
//                             checked={roleData.departments.includes(dept._id)}
//                             onCheckedChange={(checked) => 
//                               handleDepartmentToggle(dept._id, checked as boolean)
//                             }
//                           />
//                           <label
//                             htmlFor={dept._id}
//                             className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
//                           >
//                             {dept.name} ({dept.alias})
//                           </label>
//                         </div>
//                       ))}
//                     </div>
//                   </PopoverContent>
//                 </Popover>

//                 {/* Selected Departments Display */}
//                 {selectedDepartments.length > 0 && (
//                   <div className="flex flex-wrap gap-1 mt-2">
//                     {selectedDepartments.map((dept) => (
//                       <div
//                         key={dept._id}
//                         className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
//                       >
//                         <span>{dept.name}</span>
//                         <button
//                           type="button"
//                           onClick={() => handleDepartmentToggle(dept._id, false)}
//                           className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
//                           disabled={loading}
//                         >
//                           <X className="h-3 w-3" />
//                         </button>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Parent Role Selection with Search */}
//             <div className="space-y-2">
//               <Label className="text-foreground">
//                 Reports To (Parent Role) - Search Users
//               </Label>
              
//               {/* Selected Parent Role Display */}
//               {selectedParentRole && (
//                 <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border">
//                   <span className="text-sm font-medium">
//                     Selected: {selectedParentRole.user_id?.name}
//                   </span>
//                   <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
//                     {selectedParentRole.roleDefinitionId?.roleName}
//                   </span>
//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => setRoleData(prev => ({ ...prev, parentRoleId: "" }))}
//                     className="ml-auto h-6 w-6 p-0"
//                   >
//                     ×
//                   </Button>
//                 </div>
//               )}
              
//               {/* Search Input */}
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
//                 <Input
//                   placeholder="Search for parent role by name or role..."
//                   value={parentRoleSearch}
//                   onChange={(e) => {
//                     setParentRoleSearch(e.target.value);
//                     setShowParentRoleDropdown(true);
//                   }}
//                   onFocus={() => setShowParentRoleDropdown(true)}
//                   disabled={loading}
//                   className="pl-10 bg-input border-input text-foreground"
//                 />
//               </div>

//               {/* Search Results Dropdown */}
//               {showParentRoleDropdown && parentRoleSearch && (
//                 <div className="relative">
//                   <div className="absolute top-1 left-0 right-0 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
//                     {availableParentRoles.length > 0 ? (
//                       availableParentRoles.map((roleUser) => (
//                         <button
//                           key={roleUser._id}
//                           type="button"
//                           onClick={() => handleParentRoleSelect(roleUser._id)}
//                           className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 border-b border-border last:border-b-0"
//                         >
//                           <div className="flex flex-col">
//                             <span className="font-medium text-foreground">
//                               {roleUser.user_id?.name}
//                             </span>
//                             <div className="flex items-center gap-2">
//                               <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
//                                 {roleUser.roleDefinitionId?.roleName}
//                               </span>
//                               <span className="text-xs text-muted-foreground">
//                                 Level {roleUser.roleDefinitionId?.hierarchyLevel}
//                               </span>
//                             </div>
//                           </div>
//                         </button>
//                       ))
//                     ) : (
//                       <div className="px-3 py-2 text-muted-foreground text-sm">
//                         No users found matching "{parentRoleSearch}"
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )}
              
//               <p className="text-xs text-muted-foreground">
//                 Search and select a user who will be the parent role (manager) for this user
//               </p>
//             </div>
//           </div>
//         </ScrollArea>

//         <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
//           <Button
//             variant="outline"
//             onClick={handleCancel}
//             disabled={loading}
//             className="border-border text-foreground hover:bg-muted"
//           >
//             Cancel
//           </Button>
//           <Button
//             onClick={handleSave}
//             className="bg-primary text-primary-foreground hover:bg-primary/90"
//             disabled={loading}
//           >
//             {loading ? (
//               <>
//                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                 Saving...
//               </>
//             ) : (
//               "Save Changes"
//             )}
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }
