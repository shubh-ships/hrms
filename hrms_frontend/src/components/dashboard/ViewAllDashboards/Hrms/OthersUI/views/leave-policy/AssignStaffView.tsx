"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Check, Loader2 } from "lucide-react";
import axiosClient from "@/lib/api/client";

type Staff = {
  id: string;
  name: string;
  employeeCode: string;
  email?: string;
};

type LeaveCategory = {
  _id: string;
  categoryName: string;
  leaveCount: number;
};

const AssignStaffView = () => {
  const [activeTab, setActiveTab] = useState<'assigned' | 'unassigned'>('unassigned');
  const [search, setSearch] = useState('');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [categories, setCategories] = useState<LeaveCategory[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [assignedStaff, setAssignedStaff] = useState<Staff[]>([]);
  const [unassignedStaff, setUnassignedStaff] = useState<Staff[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [operating, setOperating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-dismiss error
  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(null), 4000);
    return () => clearTimeout(t);
  }, [errorMsg]);

  const fetchStaff = useCallback(async (tid: string) => {
    try {
      const [assignedRes, unassignedRes] = await Promise.all([
        axiosClient.get(`/leave/templates/${tid}/staff`),
        axiosClient.get(`/leave/templates/${tid}/staff?unassignedStaff=true`),
      ]);

      const mapEmp = (emp: any): Staff => ({
        id: String(emp._id),
        name: emp.name || `${emp.personal?.firstName || ''} ${emp.personal?.lastName || ''}`.trim() || 'Unknown',
        employeeCode: emp.employeeCode || emp.employment?.employeeCode || 'N/A',
        email: emp.email || emp.personal?.email,
      });

      setAssignedStaff((assignedRes.data?.data?.data || assignedRes.data?.data || []).map(mapEmp));
      setUnassignedStaff((unassignedRes.data?.data?.data || unassignedRes.data?.data || []).map(mapEmp));
    } catch (err: any) {
      console.error("Failed to fetch staff:", err);
      setErrorMsg(err?.response?.data?.message || "Failed to load staff list.");
    }
  }, []);

  // Load template + staff on mount
  useEffect(() => {
    const tid = sessionStorage.getItem('assignStaffPolicyId');
    if (!tid) return;
    setTemplateId(tid);

    const loadAll = async () => {
      try {
        const templateRes = await axiosClient.get(`/leave/templates/${tid}`);
        const t = templateRes.data?.data;
        if (t) {
          setTemplateName(t.name || '');
          setCategories(t.leaveCategories || []);
        }
        await fetchStaff(tid);
      } catch (err: any) {
        console.error("Failed to fetch template:", err);
        setErrorMsg(err?.response?.data?.message || "Failed to load template.");
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [fetchStaff]);

  const currentList = activeTab === 'assigned' ? assignedStaff : unassignedStaff;
  const filteredStaff = currentList.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const isAllSelected = filteredStaff.length > 0 && filteredStaff.every(s => selectedIds.has(s.id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set(selectedIds);
      filteredStaff.forEach(s => next.add(s.id));
      setSelectedIds(next);
    }
  };

  const handleMove = async () => {
    if (!templateId || selectedIds.size === 0) return;
    const staffIds = Array.from(selectedIds);
    setOperating(true);
    try {
      if (activeTab === 'unassigned') {
        // Assign selected staff to this template
        await axiosClient.post(`/leave/templates/${templateId}/staff`, { staffIds });
      } else {
        // Remove selected staff from this template
        // axios delete with body requires { data: ... }
        await axiosClient.delete(`/leave/templates/${templateId}/staff`, { data: { staffIds } });
      }
      setSelectedIds(new Set());
      await fetchStaff(templateId);
    } catch (err: any) {
      console.error("Failed to update staff assignment:", err);
      setErrorMsg(err?.response?.data?.message || "Failed to update staff assignment.");
    } finally {
      setOperating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#3e554d]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 py-8 pb-32">
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 6px; }
      `}} />

      {/* Outer Card */}
      <div className="bg-white rounded-[12px] border border-gray-200 py-6 px-8 shadow-sm">

        {/* Header */}
        {templateName && (
          <div className="mb-6">
            <h2 className="text-[18px] font-bold text-slate-800">{templateName}</h2>
            <p className="text-[12px] text-gray-400 mt-0.5 font-medium">Assign and manage staff for this leave policy</p>
          </div>
        )}

        {/* Tabs */}
        <div className="inline-flex bg-[#f1f5f9] border border-gray-100 rounded-[8px] p-1 mb-8">
          <button
            onClick={() => { setActiveTab('assigned'); setSelectedIds(new Set()); setSearch(''); }}
            className={`px-8 py-2.5 rounded-[6px] text-[13px] font-bold transition-all ${activeTab === 'assigned' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Assigned Staff
            <span className="ml-2 text-[11px] font-bold bg-[#eef2f1] text-[#3f5a54] px-2 py-0.5 rounded-full">{assignedStaff.length}</span>
          </button>
          <button
            onClick={() => { setActiveTab('unassigned'); setSelectedIds(new Set()); setSearch(''); }}
            className={`px-8 py-2.5 rounded-[6px] text-[13px] font-bold transition-all ${activeTab === 'unassigned' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Unassigned Staff
            <span className="ml-2 text-[11px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{unassignedStaff.length}</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, staff ID or email"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-[340px] border border-gray-200 rounded-[8px] h-[40px] pl-9 pr-4 text-[13px] text-slate-800 font-medium focus:outline-none focus:border-[#3f5a54] focus:ring-1 focus:ring-[#3f5a54]/30 placeholder-slate-300 transition-all"
          />
        </div>

        {/* Table Container */}
        <div className="border border-gray-100 rounded-[10px] bg-white overflow-hidden flex flex-col">

          {/* Table Area (Scrollable) */}
          <div className="w-full overflow-x-auto custom-scrollbar">

            {/* Headers row */}
            <div className="flex items-center min-w-max border-b border-gray-50 bg-[#fafafa] py-3.5 shrink-0">
              {/* Checkbox Header */}
              <div className="w-[50px] flex justify-center shrink-0">
                <div
                  onClick={toggleSelectAll}
                  className={`w-[16px] h-[16px] rounded-[4px] border flex items-center justify-center cursor-pointer transition-colors ${isAllSelected ? "bg-[#3f5a54] border-[#3f5a54]" : "bg-white border-gray-300 hover:bg-gray-50"}`}
                >
                  {isAllSelected && <div className="w-[8px] h-[2px] bg-white rounded-full"></div>}
                </div>
              </div>

              {/* Fixed Columns */}
              <div className="w-[280px] shrink-0 text-[11.5px] font-bold text-gray-400 uppercase tracking-wide">Name</div>
              <div className="w-[160px] shrink-0 text-[11.5px] font-bold text-gray-400 uppercase tracking-wide">Staff ID</div>
              <div className="w-[220px] shrink-0 text-[11.5px] font-bold text-gray-400 uppercase tracking-wide">Email</div>

              {/* Dynamic Leave Category Columns */}
              {categories.map((cat) => (
                <div key={cat._id} className="flex-1 min-w-[180px] shrink-0 text-[11.5px] font-bold text-gray-400 uppercase tracking-wide">
                  {cat.categoryName}
                  <span className="ml-1 text-[10px] font-normal text-gray-300">({cat.leaveCount} days)</span>
                </div>
              ))}
            </div>

            {/* Body rows */}
            <div className="flex flex-col min-w-max">
              {filteredStaff.map(s => {
                const isSelected = selectedIds.has(s.id);
                return (
                  <div key={s.id} className="flex items-center py-3.5 border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    {/* Checkbox */}
                    <div className="w-[50px] flex justify-center shrink-0">
                      <div
                        onClick={() => toggleSelect(s.id)}
                        className={`w-[16px] h-[16px] rounded-[4px] border flex items-center justify-center cursor-pointer transition-colors ${isSelected ? "bg-[#3f5a54] border-[#3f5a54]" : "bg-white border-gray-300 hover:bg-gray-50"}`}
                      >
                        {isSelected && <Check size={12} strokeWidth={4} className="text-white" />}
                      </div>
                    </div>

                    {/* Fixed Info */}
                    <div className="w-[280px] shrink-0 text-[12px] font-bold text-slate-600">{s.name}</div>
                    <div className="w-[160px] shrink-0 text-[12px] font-bold text-[#3f5a54]">#{s.employeeCode}</div>
                    <div className="w-[220px] shrink-0 text-[12px] text-gray-400 font-medium">{s.email || '—'}</div>

                    {/* Leave category leave count display */}
                    {categories.map((cat) => (
                      <div key={cat._id} className="flex-1 min-w-[180px] shrink-0 pr-4">
                        <span className="text-[12px] font-semibold text-slate-700">{cat.leaveCount} days</span>
                      </div>
                    ))}
                  </div>
                );
              })}

              {filteredStaff.length === 0 && (
                <div className="flex justify-center items-center py-12 text-slate-400 text-[13px] font-medium">
                  {search ? "No staff found matching your search." : `No ${activeTab} staff for this policy.`}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Error Toast */}
      {errorMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] bg-red-500 text-white text-[13px] font-semibold px-5 py-3 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-[420px] text-center">
          {errorMsg}
        </div>
      )}

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[30] bg-white border-t border-gray-100 px-8 py-4 flex items-center justify-between shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
        <span className="text-[14px] font-medium text-gray-500 ml-20">
          Selected Staff: <span className="font-bold text-slate-800">{selectedIds.size}</span>
        </span>
        <button
          onClick={handleMove}
          disabled={selectedIds.size === 0 || operating}
          className="flex items-center gap-2 bg-[#3e554d] text-white px-10 py-2.5 rounded-lg text-sm font-bold hover:bg-[#344641] transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {operating && <Loader2 size={14} className="animate-spin" />}
          {activeTab === 'unassigned' ? "Assign to Policy" : "Remove from Policy"}
        </button>
      </div>

    </div>
  );
};

export default AssignStaffView;
