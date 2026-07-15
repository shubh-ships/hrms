"use client";
import React, { useState, useEffect } from 'react';
import { Search, User as UserIcon, ChevronDown, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUsers } from '@/features/user/userSlice';
import { fetchDepartments } from '@/features/departments/departmentSlice';

interface User {
    _id: string;
    user_id?: {
        _id: string;
        name: string;
        email: string;
        isActive: boolean;
    };
    roleDefinitionId?: {
        roleName: string;
    };
    departments: Array<{
        _id: string;
        name: string;
    }>;
    status: string;
}

function EfficiencyReport() {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');

  const { users, loading: usersLoading } = useAppSelector(state => state.users);
  const { departments, loading: departmentsLoading } = useAppSelector(state => state.departments);

  useEffect(() => {
      dispatch(fetchUsers());
      dispatch(fetchDepartments({}));
  }, [dispatch]);

  // Filter the users based on both term and department
  const filteredUsers = users.filter((user: User) => {
    const userName = user.user_id?.name || '';
    const userEmail = user.user_id?.email || '';

    const matchesSearch = 
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = 
      selectedDepartment === 'All Departments' || 
      user.departments?.some(dept => dept._id === selectedDepartment);
      
    return matchesSearch && matchesDepartment;
  });

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('All Departments');
  };

  if (usersLoading && users.length === 0) {
      return (
          <div className="flex justify-center items-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
              <span className="ml-2 text-slate-500">Loading users...</span>
          </div>
      );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6 bg-[#f8f9fa] min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-slate-800">Efficiency Reports</h1>
        <p className="text-[13px] text-slate-400 mt-1">View efficiency reports for all users</p>
      </div>

      {/* Filter Options */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:px-6">
        <h2 className="text-[16px] font-semibold text-slate-800 mb-5">Filter & Search Options</h2>
        
        <div className="flex flex-col md:flex-row gap-5 items-end">
          <div className="flex-1 w-full space-y-1.5 flex-[2]">
            <label className="text-[11px] text-slate-400 font-medium tracking-wide">Search Users</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-[15px] w-[15px] text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by username or email"
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-medium placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-[#3f5a54] focus:ring-1 focus:ring-[#3f5a54] transition-colors h-[42px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 w-full space-y-1.5 md:max-w-[320px]">
            <label className="text-[11px] text-slate-400 font-medium tracking-wide">Filter by Department</label>
            <div className="relative">
              <select
                className="w-full pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-medium appearance-none focus:outline-none focus:border-[#3f5a54] focus:ring-1 focus:ring-[#3f5a54] transition-colors text-slate-700 h-[42px]"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="All Departments">All Departments</option>
                {departments.map((dept: any) => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="h-[15px] w-[15px] text-slate-400" />
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleClearFilters}
            className="px-5 py-2 border border-slate-200 rounded-lg text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors bg-white mt-4 md:mt-0 h-[42px] whitespace-nowrap"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Department Members */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-semibold text-slate-800">Department Members</h2>
          </div>
          <div className="text-[14px] text-slate-600 font-medium mt-2 md:mt-0">
            Total Users: {filteredUsers.length}
          </div>
        </div>
        
        <div className="divide-y divide-slate-100">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user: User) => (
              <div key={user._id} className="p-5 md:px-6 grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr] items-center gap-4 hover:bg-slate-50/50 transition-colors bg-white">
                {/* 1. Name and Role */}
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-100/80 flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-semibold text-slate-800 truncate">{user.user_id?.name || 'Unknown User'}</h3>
                    <div className="text-[11px] text-slate-500 mt-1 flex gap-1 items-center truncate">
                      <span className="font-semibold text-slate-600">Role:</span> 
                      <span className="truncate">{user.roleDefinitionId?.roleName || 'N/A'}</span>
                      <span className="text-slate-300 text-[16px] leading-[0] mx-0.5 flex-shrink-0">•</span> 
                      <span className="truncate">{user.user_id?.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                {/* 2. Department */}
                <div className="flex justify-center">
                  {user.departments && user.departments.length > 0 ? (
                      <div className="flex flex-wrap gap-1 justify-center max-w-[150px]">
                          {user.departments.map(dept => (
                              <span key={dept._id} className="px-3.5 py-1.5 bg-[#eaf2ff] text-[#558cf4] text-[10px] uppercase font-bold tracking-wider rounded-full text-center truncate">
                                  {dept.name}
                              </span>
                          ))}
                      </div>
                  ) : (
                      <span className="px-3.5 py-1.5 bg-[#eaf2ff] text-[#558cf4] text-[10px] uppercase font-bold tracking-wider rounded-full text-center">
                          All Departments
                      </span>
                  )}
                </div>
                
                {/* 3. Status */}
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 text-[13px] text-slate-400">
                    Status: 
                    <span className={`px-3 md:px-3 py-1 text-white text-[10px] uppercase font-bold tracking-wider rounded-full ${user.status === 'active' ? 'bg-[#3f5a54]' : 'bg-slate-400'}`}>
                      {user.status === 'active' ? 'Active' : user.status}
                    </span>
                  </div>
                </div>

                {/* 4. Action */}
                <div className="flex justify-end">
                  <Link href={`/dashboard/admin/efficiency_report/${user.user_id?._id}`}>
                    <button className="px-4 py-1.5 border border-slate-300 rounded-md text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors bg-white w-full md:w-auto">
                      View Report
                    </button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              {usersLoading ? 'Loading users...' : 'No department members found.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EfficiencyReport;