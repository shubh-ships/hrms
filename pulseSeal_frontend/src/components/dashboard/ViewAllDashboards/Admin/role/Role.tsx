'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { 
  createRole, 
  getAllRoles, 
  updateRole,
  selectRoles, 
  selectRoleLoading, 
  selectRoleError,
  clearError
} from '@/features/role/roleSlice';
import { useAppSelector } from '@/store/hooks'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Eye, Shield, Users, Edit, X, Check, ChevronDown } from 'lucide-react';

const TASK_PERMISSIONS = [
  { value: 'TASK_ASSIGNMENT', label: 'Task Assignment', description: 'Assign tasks to team members and manage deadlines.' },
  { value: 'TASK_VIEW', label: 'Task View', description: 'Full read access to all tasks and project details.' },
  { value: 'WORKING_DAYS', label: 'Working Days', description: 'Manage operational hours and global schedules.' },
  { value: 'CREATE_USER', label: 'Create User', description: 'Provision new user accounts and basic profiles.' },
  { value: 'CREATE_DEPARTMENT', label: 'Create Department', description: 'Define and structure new business departments.' },
  { value: 'COMMON_PERMISSION', label: 'Common Permission', description: 'Standard base access across all platform modules.' }
];

const HRMS_PERMISSIONS = [
  { value: 'BASIC_HRMS', label: 'Basic HRMS', description: 'Standard access to HR dashboard and self-service portal.' },
  { value: 'APPROVAL_LEAVE', label: 'Approval Leave', description: 'Approve or reject leave requests for subordinates.' },
  { value: 'OFFICE_MANAGEMENT', label: 'Office Management', description: 'Manage office infrastructure and physical resources.' }
];

interface CreateRoleForm {
  roleName: string;
  hierarchyLevel: number;
  permissions: string[];
}

interface Role {
  _id?: string;
  roleName: string;
  hierarchyLevel: number;
  parentRoleId?: string | null;
  permissions: string[];
  departments: string[];
  organizationId?: string;
}

const CustomDropdown = ({
  value,
  options,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between bg-white border border-[#d1d5db] rounded-lg h-11 px-3 focus:outline-none focus:border-[#3f5a54] ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className={`text-[15px] truncate pr-2 ${value ? "text-[#1f2937] font-medium" : "text-gray-400"}`}>
          {value || placeholder || "Select"}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={2.5}/>
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-xl overflow-y-auto py-1 max-h-[250px]">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className="w-full flex items-center justify-start py-2.5 px-3 hover:bg-gray-50 text-left relative"
            >
              <div className="flex items-center gap-2 w-full">
                {value === opt ? (
                  <div className="w-1.5 h-1.5 bg-[#3f5a54] rounded-full shrink-0" />
                ) : (
                  <div className="w-1.5 h-1.5 shrink-0" />
                )}
                <span className={`text-[14px] truncate ${value === opt ? "text-slate-800 font-bold" : "text-slate-600 font-medium"}`}>
                  {opt}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const RoleComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const roles = useAppSelector(selectRoles);
  const loading = useAppSelector(selectRoleLoading);
  const error = useAppSelector(selectRoleError);

  const { orgPermissions } = useAppSelector((state) => state.auth);

  const { isHRMS_enabled, isTaskManagement_enabled } = orgPermissions || { 
    isHRMS_enabled: false, 
    isTaskManagement_enabled: false 
  };

  const [activeTab, setActiveTab] = useState('create');
  const [formData, setFormData] = useState<CreateRoleForm>({
    roleName: '',
    hierarchyLevel: 1,
    permissions: []
  });

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  // Edit state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<CreateRoleForm>({
    roleName: '',
    hierarchyLevel: 1,
    permissions: []
  });
  const [editSelectedPermissions, setEditSelectedPermissions] = useState<string[]>([]);

  const getAvailablePermissions = () => {
    let availablePermissions: { value: string; label: string; description: string }[] = [];
    if (isTaskManagement_enabled) {
      availablePermissions = [...availablePermissions, ...TASK_PERMISSIONS];
    }
    if (isHRMS_enabled) {
      availablePermissions = [...availablePermissions, ...HRMS_PERMISSIONS];
    }
    return availablePermissions;
  };

  const AVAILABLE_PERMISSIONS = getAvailablePermissions();

  useEffect(() => {
    dispatch(getAllRoles());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleInputChange = (field: keyof CreateRoleForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePermissionToggle = (permission: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permission) ? prev.filter(p => p !== permission) : [...prev, permission]
    );
  };

  const handleEditInputChange = (field: keyof CreateRoleForm, value: any) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleEditPermission = (permission: string) => {
    setEditSelectedPermissions(prev => 
      prev.includes(permission) ? prev.filter(p => p !== permission) : [...prev, permission]
    );
  };

  const openEditModal = (role: Role) => {
    setEditingRoleId(role._id || null);
    setEditFormData({
      roleName: role.roleName,
      hierarchyLevel: role.hierarchyLevel,
      permissions: role.permissions
    });
    setEditSelectedPermissions(role.permissions);
    setIsEditModalOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!editingRoleId || !editFormData.roleName.trim() || editSelectedPermissions.length === 0) {
      return;
    }
    const roleData = {
      ...editFormData,
      permissions: editSelectedPermissions,
      departments: []
    };
    try {
      await dispatch(updateRole({ id: editingRoleId, roleData })).unwrap();
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roleName.trim() || selectedPermissions.length === 0) {
      return;
    }
    const roleData = {
      ...formData,
      permissions: selectedPermissions,
      departments: []
    };
    try {
      await dispatch(createRole(roleData)).unwrap();
      setFormData({ roleName: '', hierarchyLevel: 1, permissions: [] });
      setSelectedPermissions([]);
      setActiveTab('view');
    } catch (err) {
      console.error('Failed to create role:', err);
    }
  };

  const getDynamicPastelColor = (permission: string) => {
    const colorMap: { [key: string]: string } = {
      'TASK_VIEW': 'bg-[#e5faef] text-[#299557]',
      'APPROVAL_LEAVE': 'bg-[#f5eafc] text-[#813ec7]',
      'CREATE_DEPARTMENT': 'bg-[#fdeded] text-[#d64545]',
      'COMMON_PERMISSION': 'bg-[#e8f1ff] text-[#336ee3]',
      'WORKING_DAYS': 'bg-[#f1e9f9] text-[#714f9d]',
      'BASIC_HRMS': 'bg-[#dbfafe] text-[#1b9a9d]',
      'OFFICE_MANAGEMENT': 'bg-[#fceef6] text-[#c13f87]',
      'TASK_ASSIGNMENT': 'bg-[#f6ebff] text-[#8637df]',
      'CREATE_USER': 'bg-[#fdf2e4] text-[#cc781d]',
    };
    return colorMap[permission] || 'bg-gray-100 text-gray-700';
  };

  const getPermissionLabel = (permission: string) => {
    const perm = AVAILABLE_PERMISSIONS.find(p => p.value === permission);
    return perm ? perm.label : permission;
  };

  if (!isTaskManagement_enabled && !isHRMS_enabled) {
    return (
      <div className="w-full p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-gray-400" />
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Modules Enabled</h3>
            <p className="text-gray-500 mb-4">
              No task management or HRMS modules are enabled for your organization. 
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#fafbfc] px-6 py-6 flex flex-col items-center mb-15">
      <div className="w-full max-w-[1500px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[24px] font-bold text-[#1f2937] tracking-tight">Role Management</h1>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isTaskManagement_enabled ? 'bg-[#10b981]' : 'bg-gray-300'}`}></div>
              <span className={`text-[13px] font-semibold ${isTaskManagement_enabled ? 'text-[#4b5563]' : 'text-gray-400'}`}>
                 Task Management
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isHRMS_enabled ? 'bg-[#10b981]' : 'bg-gray-300'}`}></div>
              <span className={`text-[13px] font-semibold ${isHRMS_enabled ? 'text-[#4b5563]' : 'text-gray-400'}`}>
                 HRMS
              </span>
            </div>
          </div>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50 mb-6">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full bg-[#f0f2f5] p-1.5 rounded-xl h-14 space-x-2 mb-6 shadow-inner">
            <TabsTrigger 
              value="create" 
              className="flex-1 data-[state=active]:bg-white data-[state=active]:text-[#111827] data-[state=active]:shadow text-[#6b7280] rounded-lg py-2.5 font-bold text-[14px] transition-all"
            >
              Create New Role
            </TabsTrigger>
            <TabsTrigger 
              value="view" 
              className="flex-1 data-[state=active]:bg-white data-[state=active]:text-[#111827] data-[state=active]:shadow text-[#6b7280] rounded-lg py-2.5 font-bold text-[14px] transition-all"
            >
              View All Roles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="focus:outline-none">
            <div className="bg-white rounded-[16px] border border-[#eaedf1] shadow-sm relative overflow-hidden flex flex-col">
              <div className="p-8">
                <h2 className="text-[16px] font-bold text-[#1f2937] flex items-center mb-8">
                  <Plus className="h-5 w-5 mr-2 text-[#4f5c6b]" strokeWidth={2.5} />
                  Create New Role
                </h2>
                
                <form id="createRoleForm" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    <div>
                      <Label htmlFor="roleName" className="text-[13px] font-bold text-[#4b5563] mb-2.5 block">
                        Role Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="roleName"
                        type="text"
                        placeholder="Enter Name"
                        value={formData.roleName}
                        onChange={(e) => handleInputChange('roleName', e.target.value)}
                        className="rounded-lg border-[#d1d5db] text-[14px] h-11 focus-visible:ring-1 focus-visible:ring-[#3f5a54]"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-end mb-2.5">
                         <Label htmlFor="hierarchyLevel" className="text-[13px] font-bold text-[#4b5563]">Hierarchy Level</Label>
                         <span className="text-[11px] font-medium text-[#9ca3af]">Higher numbers indicate higher hierarchy levels</span>
                      </div>
                      <Input
                        id="hierarchyLevel"
                        type="number"
                        min="1"
                        max="10"
                        placeholder="1"
                        value={formData.hierarchyLevel}
                        onChange={(e) => handleInputChange('hierarchyLevel', parseInt(e.target.value) || 1)}
                        className="rounded-lg border-[#d1d5db] text-[14px] h-11 focus-visible:ring-1 focus-visible:ring-[#3f5a54]"
                      />
                    </div>
                  </div>

                  <div className="mb-6 flex items-center">
                     <span className="font-bold text-[#1f2937] text-[15px]">Permissions <span className="text-red-500">*</span></span>
                     <span className="text-[#8e9bb3] text-[13px] font-medium ml-2">(Select at least one)</span>
                  </div>

                  <div className="space-y-8">
                     {isTaskManagement_enabled && (
                       <div>
                         <div className="bg-[#fdf6f9] text-[#1f2937] font-bold px-4 py-3 rounded-lg mb-4 text-[13px]">
                           Task Management Permissions
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                           {TASK_PERMISSIONS.map(p => {
                              const isSelected = selectedPermissions.includes(p.value);
                              return (
                                <div 
                                  key={p.value}
                                  onClick={() => handlePermissionToggle(p.value)}
                                  className={`border rounded-xl p-5 cursor-pointer transition-all duration-200 bg-white ${
                                    isSelected 
                                      ? 'border-[#3f5a54] bg-[#f9fafb] shadow-sm' 
                                      : 'border-[#eaedf1] hover:border-[#d1d5db]'
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <span className={`font-bold text-[14px] ${isSelected ? 'text-[#1f2937]' : 'text-[#4b5563]'}`}>{p.label}</span>
                                    <div className={`w-[22px] h-[22px] rounded-[4px] flex items-center justify-center border transition-all ${
                                      isSelected ? 'bg-[#3f5a54] border-[#3f5a54]' : 'border-[#d1d5db] bg-white'
                                    }`}>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3.5px]" />}
                                    </div>
                                  </div>
                                  <p className="text-[#9ca3af] text-[12px] font-medium leading-[18px] pr-8">{p.description}</p>
                                </div>
                              );
                           })}
                         </div>
                       </div>
                     )}
                     
                     {isHRMS_enabled && (
                       <div>
                         <div className="bg-[#e9fdf3] text-[#1f2937] font-bold px-4 py-3 rounded-lg mb-4 text-[13px]">
                           HRMS Permissions
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                           {HRMS_PERMISSIONS.map(p => {
                              const isSelected = selectedPermissions.includes(p.value);
                              return (
                                <div 
                                  key={p.value}
                                  onClick={() => handlePermissionToggle(p.value)}
                                  className={`border rounded-xl p-5 cursor-pointer transition-all duration-200 bg-white ${
                                    isSelected 
                                      ? 'border-[#3f5a54] bg-[#f9fafb] shadow-sm' 
                                      : 'border-[#eaedf1] hover:border-[#d1d5db]'
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <span className={`font-bold text-[14px] ${isSelected ? 'text-[#1f2937]' : 'text-[#4b5563]'}`}>{p.label}</span>
                                    <div className={`w-[22px] h-[22px] rounded-[4px] flex items-center justify-center border transition-all ${
                                      isSelected ? 'bg-[#3f5a54] border-[#3f5a54]' : 'border-[#d1d5db] bg-white'
                                    }`}>
                                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3.5px]" />}
                                    </div>
                                  </div>
                                  <p className="text-[#9ca3af] text-[12px] font-medium leading-[18px] pr-8">{p.description}</p>
                                </div>
                              );
                           })}
                         </div>
                       </div>
                     )}
                  </div>

                  <div className="mt-8 bg-[#ebf4fd] p-4 rounded-lg flex items-center">
                     <span className="font-bold text-[#1e3a5f] mr-2 text-[14px]">Selected Permissions:</span>
                     <span className="text-[#3b5981] text-[14px] font-medium">{selectedPermissions.map(getPermissionLabel).join(', ') || 'None'}</span>
                  </div>
                </form>
               </div>
               
               {/* Fixed bottom footer */}
               <div className="fixed bottom-0 right-0 w-full z-[10] bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-end space-x-4 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)]">
                  <Button 
                     variant="outline" 
                     type="button" 
                     className="h-[44px] px-8 rounded-lg font-bold border-[#d1d5db] text-[#4b5563] hover:bg-gray-50 text-[14px]"
                     onClick={() => {
                       setFormData({ roleName: '', hierarchyLevel: 1, permissions: [] });
                       setSelectedPermissions([]);
                     }}
                  >
                    Reset Form
                  </Button>
                  <Button 
                     type="submit"
                     form="createRoleForm"
                     disabled={loading || !formData.roleName.trim() || selectedPermissions.length === 0}
                     className="h-[44px] px-10 bg-[#3f5a54] hover:bg-[#324541] text-white rounded-lg font-bold text-[14px]"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Role
                  </Button>
               </div>
            </div>
          </TabsContent>

          <TabsContent value="view" className="focus:outline-none">
            <div>
              {/* All Roles Header Block */}
              <div className="bg-[#F5F8F7] rounded-[16px] p-3 mb-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3">
                  <Users className="h-[22px] w-[22px] text-[#4b5563]" />
                  <span className="text-[16px] font-bold text-[#1f2937]">All Roles</span>
                </div>
                <div className="px-4 py-1.5 rounded-lg border border-[#eaedf1] text-[13px] font-bold text-[#4b5563] bg-[#f9fafc]">
                  {roles.length} roles
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20 bg-white rounded-[16px] border border-[#eaedf1] shadow-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-[#3f5a54]" />
                </div>
              ) : roles.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[16px] border border-[#eaedf1] shadow-sm">
                  <Shield className="h-14 w-14 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-[18px] font-bold text-gray-900 mb-2">No roles found</h3>
                  <p className="text-gray-500 mb-6 font-medium">Create your first role to get started.</p>
                  <Button onClick={() => setActiveTab('create')} className="bg-[#3f5a54] hover:bg-[#324541] font-bold px-8 h-11">
                    Create Role
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {roles.map((role) => (
                    <div key={role._id} className="bg-white rounded-[16px] border border-[#eaedf1] p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-5 relative">
                        <h3 className="font-bold text-[20px] text-[#1f2937] leading-tight pr-24">{role.roleName}</h3>
                        <div className="flex items-center space-x-3 absolute right-0 top-0">
                          <span className="bg-[#f3f4f6] text-[#6b7280] border border-[#e5e7eb] px-3 py-0.5 rounded-full text-[11px] font-bold">
                            Level {role.hierarchyLevel}
                          </span>
                          <button 
                            onClick={() => openEditModal(role)} 
                            className="text-[#3f5a54] hover:text-[#2c403b] transition-colors bg-white p-1 rounded-md"
                          >
                            <Edit className="h-[18px] w-[18px]" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-3 text-[13px] font-bold text-[#6b7280]">Permissions:</div>
                      <div className="flex flex-wrap content-start items-start gap-2.5 mb-8 flex-grow">
                        {role.permissions.map(p => (
                          <div key={p} className={`${getDynamicPastelColor(p)} inline-flex w-fit items-center justify-center rounded-full px-3.5 py-1.5 text-[12px] font-bold tracking-tight border border-transparent leading-none sm:max-h-8`}>
                            {getPermissionLabel(p)}
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t border-[#f3f4f6] pt-4 mt-auto">
                        <span className="text-[#9ca3af] text-[12px] font-semibold">ID: {role._id?.slice(-8) || 'unknown'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Role Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[550px] p-0 rounded-2xl overflow-hidden border border-gray-100 shadow-2xl bg-white focus:outline-none [&>button]:hidden">
             
             <div className="px-8 py-5 flex items-center justify-between border-b border-[#f3f4f6]">
               <DialogTitle className="text-[20px] font-bold text-[#1f2937]">Edit Role</DialogTitle>
               <button onClick={() => setIsEditModalOpen(false)} className="bg-[#f3f4f6] hover:bg-[#e5e7eb] p-1.5 rounded-[6px] transition-colors">
                 <X className="h-4 w-4 text-[#6b7280] stroke-[2.5px]" />
               </button>
             </div>
             
             <div className="px-8 py-7 space-y-7">
               <div>
                  <Label className="text-[13px] font-bold text-[#6b7280] mb-2 block">
                    Role Name <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                     value={editFormData.roleName} 
                     onChange={(e) => handleEditInputChange('roleName', e.target.value)}
                     className="rounded-lg border-[#d1d5db] text-[#1f2937] font-medium h-11 focus-visible:ring-1 focus-visible:ring-[#3f5a54]"
                  />
               </div>
               <div>
                  <Label className="text-[13px] font-bold text-[#6b7280] mb-2 block">Hierarchy Level</Label>
                  <CustomDropdown 
                    value={editFormData.hierarchyLevel.toString()}
                    options={['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']}
                    onChange={(val) => handleEditInputChange('hierarchyLevel', parseInt(val) || 1)}
                    placeholder="Select level"
                  />
               </div>
               
               <div>
                  <Label className="text-[13px] font-bold text-[#6b7280] mb-3 block">
                    Permissions <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-x-3 gap-y-3">
                     {AVAILABLE_PERMISSIONS.map(p => {
                        const isSelected = editSelectedPermissions.includes(p.value);
                        return (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => toggleEditPermission(p.value)}
                            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-all duration-200 ${
                              isSelected 
                                ? getDynamicPastelColor(p.value) 
                                : 'bg-[#f0f2f5] text-[#6b7280] border border-transparent hover:bg-gray-200'
                            } leading-none`}
                          >
                            <span>{p.label}</span>
                            {isSelected 
                              ? <X className="h-3.5 w-3.5 opacity-80 shrink-0" strokeWidth={2.5} /> 
                              : <Plus className="h-3.5 w-3.5 opacity-80 shrink-0" strokeWidth={2.5} />
                            }
                          </button>
                        );
                     })}
                  </div>
               </div>
             </div>

             <div className="px-8 py-5 border-t border-[#f3f4f6] flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-full max-w-[150px] rounded-lg font-bold border-[#3f5a54] text-[#3f5a54] hover:bg-[#3f5a54] hover:text-[#3f5a54] hover:bg-opacity-5 h-11"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateRole} 
                  className="w-full max-w-[150px] bg-[#3f5a54] hover:bg-[#2c403b] text-white rounded-lg font-bold h-11 shadow-sm"
                  disabled={loading || !editFormData.roleName.trim() || editSelectedPermissions.length === 0}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update
                </Button>
             </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RoleComponent;
