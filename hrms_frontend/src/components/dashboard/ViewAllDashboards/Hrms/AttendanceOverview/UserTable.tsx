'use client';
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Calendar, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface User {
  id?: string;
  _id?: string;
  user_id?: { _id: string; name: string; email: string };
  name?: string;
  email?: string;
  roleDefinitionId?: { roleName: string };
  departments?: Array<{ name: string }>;
  parentRoleId?: { user_id: { name: string; email: string } };
}

interface DropdownOption {
  label: string;
  value: string;
}

const CustomDropdown = ({
  options,
  value,
  onChange,
  className = "",
  dropdownWidth = "w-full",
  disabled = false,
}: {
  options: DropdownOption[];
  value: string;
  onChange: (val: string) => void;
  className?: string;
  dropdownWidth?: string;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between border rounded-[8px] h-[42px] px-4 bg-white transition-all select-none ${disabled ? "bg-gray-50 opacity-60 cursor-not-allowed border-gray-100" :
            isOpen ? "border-[#3f5a54] ring-1 ring-[#3f5a54]/30 cursor-pointer" : "border-gray-200 hover:border-gray-300 cursor-pointer"
          }`}
      >
        <span className="text-[13px] text-gray-700 font-medium">{selectedOption?.label || "Select"}</span>
        <div className="text-slate-400">
          {isOpen ? <ChevronUp size={16} strokeWidth={1.5} /> : <ChevronDown size={16} strokeWidth={1.5} />}
        </div>
      </div>

      {isOpen && !disabled && (
        <div className={`absolute top-full left-0 z-[100] mt-1 ${dropdownWidth} bg-white border border-gray-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-[12px] p-2 animate-in fade-in zoom-in-95 duration-200`}>
          {options.map((option) => {
            const isActive = value === option.value;
            return (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="flex items-start gap-3 p-2.5 rounded-[8px] hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="mt-1 flex-shrink-0 w-2 h-2 flex justify-center items-center">
                  {isActive && <div className="w-[8px] h-[8px] rounded-full bg-[#3f5a54]" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[13.5px] text-[#202b36] font-medium leading-tight">{option.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface UserTableProps {
  users: User[];
  selectedUserId: string | null;
  loadingAttendance: boolean;
  onViewAttendance: (user: User) => void;
  quickMarkDate: Date;
  onSetQuickMarkDate: (date: Date) => void;
  getUserId: (user: User) => string | null;
  getUserName: (user: User) => string;
  getUserEmail: (user: User) => string;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  selectedUserId,
  loadingAttendance,
  onViewAttendance,
  // onQuickMarkAttendance,
  quickMarkDate,
  onSetQuickMarkDate,
  getUserId,
  getUserName,
  getUserEmail
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Memoized filtered users for performance
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchTerm === '' || 
        getUserName(user).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getUserEmail(user).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === '' || 
        user.roleDefinitionId?.roleName === roleFilter;
      
      const matchesDepartment = departmentFilter === '' || 
        user.departments?.some(dept => 
          dept.name.toLowerCase().includes(departmentFilter.toLowerCase())
        );

      return matchesSearch && matchesRole && matchesDepartment;
    });
  }, [users, searchTerm, roleFilter, departmentFilter, getUserName, getUserEmail]);

  // Get unique roles and departments for filters
  const uniqueRoles = useMemo(() => {
    const roles = users.map(user => user.roleDefinitionId?.roleName).filter(Boolean);
    return Array.from(new Set(roles)) as string[];
  }, [users]);

  const uniqueDepartments = useMemo(() => {
    const departments = users.flatMap(user => 
      user.departments?.map(dept => dept.name) || []
    ).filter(Boolean);
    return Array.from(new Set(departments)) as string[];
  }, [users]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleRoleFilterChange = useCallback((value: string) => {
    setRoleFilter(value);
  }, []);

  const handleDepartmentFilterChange = useCallback((value: string) => {
    setDepartmentFilter(value);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setRoleFilter('');
    setDepartmentFilter('');
  }, []);

  // Accessibility: Keyboard navigation support
  const handleKeyPress = useCallback((e: React.KeyboardEvent, user: User, action: 'view' | 'quickMark') => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (action === 'view') {
        onViewAttendance(user);
      } else {
      
      }
    }
  }, [onViewAttendance, quickMarkDate]);

  // Helper to extract initials
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Filter & Search Options Box */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#111827] mb-4">
          Filter & Search Options
        </h3>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-1/3">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Search Users
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by username or email"
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-9 min-h-[42px] rounded-lg border-gray-200 focus:ring-[#3f5a54] focus:border-[#3f5a54]"
                aria-label="Search users by name or email"
              />
            </div>
          </div>

          <div className="w-full md:w-1/4">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Department
            </label>
            <CustomDropdown
              options={[
                { label: "All Departments", value: "" },
                ...uniqueDepartments.map(dept => ({ label: dept, value: dept }))
              ]}
              value={departmentFilter}
              onChange={(val) => handleDepartmentFilterChange(val)}
              className="w-full"
            />
          </div>

          <div className="w-full md:w-1/4">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Role Filter
            </label>
            <CustomDropdown
              options={[
                { label: "All Roles", value: "" },
                ...uniqueRoles.map(role => ({ label: role, value: role }))
              ]}
              value={roleFilter}
              onChange={(val) => handleRoleFilterChange(val)}
              className="w-full"
            />
          </div>

          <div className="w-full md:w-auto">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full md:w-auto min-h-[42px] px-6 rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50"
              aria-label="Clear all filters"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-white">
          <p className="text-sm font-medium text-gray-400">
            Showing {filteredUsers.length} of {users.length} Users
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent border-b border-gray-100">
                <TableHead className="font-semibold text-gray-600 h-12">Name</TableHead>
                <TableHead className="font-semibold text-gray-600 h-12">Email</TableHead>
                <TableHead className="font-semibold text-gray-600 h-12">Role</TableHead>
                <TableHead className="font-semibold text-gray-600 h-12">Department</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-12 text-gray-500"
                  >
                    No users found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user, index) => {
                  const userId = getUserId(user);
                  const userName = getUserName(user);
                  const userEmail = getUserEmail(user);
                  const initials = getInitials(userName);
                  const departmentsText =
                    user.departments?.map((dept: any) => dept.name).join(", ") ||
                    "No department";
                  const roleText =
                    user.roleDefinitionId?.roleName || "No role";

                  return (
                    <TableRow
                      key={`${userId || 'user'}-${index}`}
                      onClick={() => onViewAttendance(user)}
                      className="cursor-pointer transition-colors hover:bg-gray-50/80 group border-b border-gray-50 last:border-0"
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-700 shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all border border-gray-200/60">
                            {initials}
                          </div>
                          <span className="font-medium text-gray-900">
                            {userName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 py-4">
                        {userEmail}
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#f1f5f9] text-[#475569]">
                          {roleText.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#e0f2fe] text-[#0284c7]">
                          {departmentsText}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};