"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Plus, MoreVertical, X, Search, Filter, User, ChevronDown, Loader2 } from "lucide-react";
import cloudIcon from "../../../../../../assets/Dashicons/Cloud.png";
import { useRouter } from "next/navigation";
import axiosClient from "@/lib/api/client";

// ---- Defensive array extractor ----
const extractArray = (responseData: any): any[] => {
  if (!responseData) return [];
  const d = responseData.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(responseData)) return responseData;
  return [];
};

// ---- Filter Options ----
const SALARY_TYPES = ["Monthly", "Daily", "Work Basis", "Hourly", "Monthly Regular"];
const SHIFT_OPTIONS = ["Office Shift 2", "Office Shift", "Break Shift", "fixed shift 10.30 hours"];

// ---- Multi-Select Dropdown ----
const MultiSelectDropdown = ({
  label, placeholder, options, selected, onChange,
}: { label: string; placeholder: string; options: string[]; selected: Set<string>; onChange: (next: Set<string>) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const allSelected = selected.size === options.length;
  const someSelected = selected.size > 0 && !allSelected;
  const toggle = (opt: string) => { const next = new Set(selected); if (next.has(opt)) next.delete(opt); else next.add(opt); onChange(next); };
  const toggleAll = () => { if (allSelected) onChange(new Set()); else onChange(new Set(options)); };
  const displayLabel = selected.size === 0 ? null : selected.size === 1 ? [...selected][0] : `${[...selected][0]} & ${selected.size - 1} More`;

  return (
    <div className="mb-5" ref={ref}>
      <p className="text-[12px] font-semibold text-slate-600 mb-2">{label}</p>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-white text-[13px] hover:border-gray-300 transition-colors focus:outline-none">
        <span className={displayLabel ? "text-slate-800 font-medium" : "text-gray-400"}>{displayLabel || placeholder}</span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-[10] relative">
          <div onClick={toggleAll} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100">
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${allSelected || someSelected ? "bg-[#3f5a54] border-[#3f5a54]" : "border-gray-300 bg-white"}`}>
              {allSelected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              {someSelected && !allSelected && <div className="w-2 h-0.5 bg-white rounded" />}
            </div>
            <span className="text-[13px] font-semibold text-slate-700">Select All</span>
          </div>
          {options.map(opt => (
            <div key={opt} onClick={() => toggle(opt)} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-0">
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${selected.has(opt) ? "bg-[#3f5a54] border-[#3f5a54]" : "border-gray-300 bg-white"}`}>
                {selected.has(opt) && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              <span className="text-[13px] text-slate-700 font-medium">{opt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---- Filter Modal ----
const FilterModal = ({ onClose, onApply }: { onClose: () => void; onApply: (s: Set<string>, sh: Set<string>) => void }) => {
  const [salaryTypes, setSalaryTypes] = useState<Set<string>>(new Set());
  const [shifts, setShifts] = useState<Set<string>>(new Set());
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-[480px] rounded-2xl shadow-2xl p-7 relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[20px] font-bold text-slate-900">Filter By</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X size={18} className="text-gray-500" /></button>
        </div>
        <MultiSelectDropdown label="Salary Type" placeholder="Select salary type" options={SALARY_TYPES} selected={salaryTypes} onChange={setSalaryTypes} />
        <MultiSelectDropdown label="Shifts" placeholder="Select Shift" options={SHIFT_OPTIONS} selected={shifts} onChange={setShifts} />
        <div className="flex items-center gap-4 mt-6">
          <button onClick={() => { setSalaryTypes(new Set()); setShifts(new Set()); }}
            className="flex-1 py-3 rounded-xl border-2 border-[#3f5a54] text-[#3f5a54] text-[14px] font-bold hover:bg-[#f3f6f5] transition-colors">Clear Filter</button>
          <button onClick={() => { onApply(salaryTypes, shifts); onClose(); }}
            className="flex-1 py-3 rounded-xl bg-[#3e554d] text-white text-[14px] font-bold hover:bg-[#344641] transition-colors shadow-sm">Apply Filter</button>
        </div>
      </div>
    </div>
  );
};

// ---- Staff List Modal — API-connected (Both template types) ----
const StaffListModal = ({
  isOpen, onClose, templateId, templateType, onDone,
}: { isOpen: boolean; onClose: () => void; templateId: string | null; templateType: "Weekly Off" | "Attendance On Weekly Off"; onDone: () => void }) => {
  const [activeStaffTab, setActiveStaffTab] = useState<"Selected" | "Unselected">("Selected");
  const [search, setSearch] = useState("");
  const [assignedStaff, setAssignedStaff] = useState<any[]>([]);
  const [unassignedStaff, setUnassignedStaff] = useState<any[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [operating, setOperating] = useState(false);

  const loadStaff = useCallback(async (tid: string) => {
    setLoading(true);
    try {
      const isAttendance = templateType === "Attendance On Weekly Off";

      let aRes, uRes;
      if (isAttendance) {
        // Uses GET /:templateId/staff?unassignedStaff=false|true
        [aRes, uRes] = await Promise.all([
          axiosClient.get(`/attendanceonweeklyoff/templates/${tid}/staff`, { params: { unassignedStaff: false } }),
          axiosClient.get(`/attendanceonweeklyoff/templates/${tid}/staff`, { params: { unassignedStaff: true } }),
        ]);
      } else {
        [aRes, uRes] = await Promise.all([
          axiosClient.get(`/weekly-off/templates/${tid}/staff`),
          axiosClient.get(`/weekly-off/templates/${tid}/staff`, { params: { unassignedStaff: true } }),
        ]);
      }

      const mapEmp = (emp: any) => ({
        id: String(emp._id),
        name: emp.name || `${emp.personal?.firstName || ""} ${emp.personal?.lastName || ""}`.trim() || "Unknown",
        employeeCode: emp.employeeCode || emp.employment?.employeeCode || "N/A",
        location: emp.employment?.location || emp.location || "—",
      });
      setAssignedStaff(extractArray(aRes.data).map(mapEmp));
      setUnassignedStaff(extractArray(uRes.data).map(mapEmp));
    } catch (err) {
      console.error("Failed to load staff:", err);
    } finally {
      setLoading(false);
    }
  }, [templateType]);

  useEffect(() => {
    if (isOpen && templateId) {
      setActiveStaffTab("Selected");
      setCheckedIds(new Set());
      setSearch("");
      loadStaff(templateId);
    }
  }, [isOpen, templateId, loadStaff]);

  if (!isOpen) return null;

  const staffPool = activeStaffTab === "Unselected" ? unassignedStaff : assignedStaff;
  const filtered = staffPool.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.employeeCode.toLowerCase().includes(search.toLowerCase())
  );
  const allChecked = filtered.length > 0 && filtered.every(s => checkedIds.has(s.id));
  const toggleCheck = (id: string) => { const n = new Set(checkedIds); if (n.has(id)) n.delete(id); else n.add(id); setCheckedIds(n); };
  const toggleAll = () => {
    const n = new Set(checkedIds);
    if (allChecked) { filtered.forEach(s => n.delete(s.id)); } else { filtered.forEach(s => n.add(s.id)); }
    setCheckedIds(n);
  };

  const handleMoveToSelected = async () => {
    if (!templateId || checkedIds.size === 0) return;
    setOperating(true);
    try {
      if (templateType === "Attendance On Weekly Off") {
        await axiosClient.put("/attendanceonweeklyoff/templates/assign", { templateId, employeeIds: Array.from(checkedIds) });
      } else {
        await axiosClient.post(`/weekly-off/templates/${templateId}/staff`, { staffIds: Array.from(checkedIds) });
      }
      setCheckedIds(new Set());
      await loadStaff(templateId);
      onDone();
    } catch (err: any) {
      console.error("Assign failed:", err?.response?.data?.message || err.message);
    } finally {
      setOperating(false);
    }
  };

  const handleMoveToUnselected = async () => {
    if (!templateId || checkedIds.size === 0) return;
    setOperating(true);
    try {
      if (templateType === "Attendance On Weekly Off") {
        await axiosClient.put("/attendanceonweeklyoff/templates/remove", { employeeIds: Array.from(checkedIds) });
      } else {
        await axiosClient.delete(`/weekly-off/templates/${templateId}/staff`, { data: { staffIds: Array.from(checkedIds) } });
      }
      setCheckedIds(new Set());
      await loadStaff(templateId);
      onDone();
    } catch (err: any) {
      console.error("Remove failed:", err?.response?.data?.message || err.message);
    } finally {
      setOperating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" onClick={onClose}>
      <div className="bg-white border border-gray-200 h-[calc(100%-32px)] my-4 mr-4 w-full max-w-[560px] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-[20px] font-bold text-slate-900">Staff List</h2>
              <p className="text-[12px] text-gray-400 font-medium mt-0.5">Check staff assigned and unassigned to this template</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors mt-0.5"><X size={18} className="text-gray-500" /></button>
          </div>
          <div className="flex items-center w-fit bg-[#f4f5f7] rounded-[8px] p-1 mt-4 border border-gray-100">
            {(["Selected", "Unselected"] as const).map(tab => (
              <button key={tab} onClick={() => { setActiveStaffTab(tab); setCheckedIds(new Set()); }}
                className={`px-4 py-1.5 rounded-[6px] text-[12px] font-medium transition-all ${activeStaffTab === tab ? "bg-white text-slate-800 font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.07)]" : "text-slate-500 hover:text-slate-700"}`}>
                {tab} Staff
              </button>
            ))}
          </div>
        </div>

        {/* Search + Filter */}
        <div className="px-6 py-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by name or staff ID" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-gray-300 transition-colors placeholder-gray-400" />
          </div>
          <button onClick={() => setShowFilter(true)}
            className="flex items-center gap-1.5 bg-[#eef2f1] text-[#3f5a54] border border-[#c8d5d2] px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#dce8e5] transition-colors">
            <Filter size={13} /> Filter
          </button>
        </div>

        {showFilter && <FilterModal onClose={() => setShowFilter(false)} onApply={() => { }} />}

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-6">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-[#3e554d]" /></div>
          ) : (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[40px_1fr_120px_120px] items-center bg-gray-50 border-b border-gray-100 px-2 py-2.5">
                <div className="flex justify-center">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-3.5 h-3.5 accent-[#3f5a54] cursor-pointer rounded" />
                </div>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Name</span>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Staff ID</span>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Base Location</span>
              </div>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Image src={cloudIcon} alt="No data" className="w-[90px] h-auto object-contain mb-4 opacity-80" />
                  <p className="text-[13px] text-gray-400 font-medium">No Data</p>
                </div>
              ) : (
                filtered.map(staff => (
                  <div key={staff.id} onClick={() => toggleCheck(staff.id)}
                    className="grid grid-cols-[40px_1fr_120px_120px] items-center px-2 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60 cursor-pointer transition-colors">
                    <div className="flex justify-center">
                      <input type="checkbox" checked={checkedIds.has(staff.id)} onChange={() => { }} className="w-3.5 h-3.5 accent-[#3f5a54] cursor-pointer rounded pointer-events-none" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0"><User size={14} className="text-gray-400" /></div>
                      <span className="text-[13px] font-medium text-slate-700">{staff.name}</span>
                    </div>
                    <span className="text-[13px] font-semibold text-[#3f5a54]">#{staff.employeeCode}</span>
                    <span className="text-[13px] text-gray-500">{staff.location}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-100 flex justify-end">
          {activeStaffTab === "Unselected" ? (
            <button onClick={handleMoveToSelected} disabled={checkedIds.size === 0 || operating}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${checkedIds.size > 0 && !operating ? "bg-[#3e554d] text-white hover:bg-[#344641] shadow-sm" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
              {operating && <Loader2 size={13} className="animate-spin" />} Move to Selected
            </button>
          ) : (
            <button onClick={handleMoveToUnselected} disabled={checkedIds.size === 0 || operating}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${checkedIds.size > 0 && !operating ? "bg-[#3e554d] text-white hover:bg-[#344641] shadow-sm" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
              {operating && <Loader2 size={13} className="animate-spin" />} Move to Unselected
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ---- Attendance type label ----
const attendanceTypeLabel = (t: string) => {
  if (t === "OVERTIME") return "Overtime";
  if (t === "COMP_OFF") return "Comp-Off";
  return "Regular Payable Day";
};

// ---- Main View ----
const WeeklyHolidaysView = () => {
  const [activeTab, setActiveTab] = useState<"Weekly Off" | "Attendance On Weekly Off">("Weekly Off");
  const router = useRouter();
  const [weeklyOffTemplates, setWeeklyOffTemplates] = useState<any[]>([]);
  const [attendanceTemplates, setAttendanceTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"Weekly Off" | "Attendance On Weekly Off">("Weekly Off");
  const [assignStaffTemplateId, setAssignStaffTemplateId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(null), 5000);
    return () => clearTimeout(t);
  }, [errorMsg]);

  const fetchAll = useCallback(async () => {
    try {
      const [wRes, aRes] = await Promise.all([
        axiosClient.get("/weekly-off/templates"),
        axiosClient.get("/attendanceonweeklyoff/templates"),
      ]);
      const rawW = extractArray(wRes.data);
      setWeeklyOffTemplates(rawW.map((t: any) => ({
        id: String(t._id),
        templateName: t.name,
        rulesCount: (t.rules || []).length,
        assignedStaff: 0,
      })));
      const rawA = extractArray(aRes.data);
      setAttendanceTemplates(rawA.map((t: any) => ({
        id: String(t._id),
        templateName: t.name,
        attendanceType: attendanceTypeLabel(t.attendanceOnWeekOffType),
      })));
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || "Failed to load templates.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load assigned staff counts for both types of templates
  useEffect(() => {
    if (weeklyOffTemplates.length === 0 && attendanceTemplates.length === 0) return;

    const loadCounts = async () => {
      if (weeklyOffTemplates.length > 0) {
        const updated = await Promise.all(
          weeklyOffTemplates.map(async (t) => {
            try {
              const res = await axiosClient.get(`/weekly-off/templates/${t.id}/staff`);
              return { ...t, assignedStaff: extractArray(res.data).length };
            } catch {
              return t;
            }
          })
        );
        setWeeklyOffTemplates(updated);
      }

      if (attendanceTemplates.length > 0) {
        const updatedAtt = await Promise.all(
          attendanceTemplates.map(async (t) => {
            try {
              // GET /:templateId/staff?unassignedStaff=false → returns assigned employees
              const res = await axiosClient.get(`/attendanceonweeklyoff/templates/${t.id}/staff`, { params: { unassignedStaff: false } });
              const data = res.data?.data?.data ?? res.data?.data ?? [];
              const count = Array.isArray(data) ? data.length : (res.data?.data?.total ?? 0);
              return { ...t, assignedStaff: count };
            } catch {
              return t;
            }
          })
        );
        setAttendanceTemplates(updatedAtt);
      }
    };
    loadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeklyOffTemplates.length, attendanceTemplates.length]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null); };
    if (openMenuId !== null) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenuId]);

  const handleDelete = async () => {
    if (!deleteModalId) return;
    try {
      if (deleteType === "Weekly Off") {
        await axiosClient.delete(`/weekly-off/templates/${deleteModalId}`);
        setWeeklyOffTemplates(prev => prev.filter(t => t.id !== deleteModalId));
      } else {
        await axiosClient.delete(`/attendanceonweeklyoff/templates/${deleteModalId}`);
        setAttendanceTemplates(prev => prev.filter(t => t.id !== deleteModalId));
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || "Failed to delete template.");
    }
    setDeleteModalId(null);
  };

  const handleNewTemplateClick = () => {
    sessionStorage.removeItem("editWeeklyOffId");
    if (activeTab === "Weekly Off") {
      router.push("/dashboard/admin/hrms/others/weekly-holidays/weekly-off-template");
    } else {
      router.push("/dashboard/admin/hrms/others/weekly-holidays/weekly-off-attendance-template");
    }
  };

  const handleEdit = (template: any) => {
    sessionStorage.setItem("editWeeklyOffId", template.id);
    setOpenMenuId(null);
    if (activeTab === "Weekly Off") {
      router.push("/dashboard/admin/hrms/others/weekly-holidays/weekly-off-template");
    } else {
      router.push("/dashboard/admin/hrms/others/weekly-holidays/weekly-off-attendance-template");
    }
  };

  const displayedTemplates = activeTab === "Weekly Off" ? weeklyOffTemplates : attendanceTemplates;

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfcfc] px-4 py-3">
      {/* Tabs */}
      <div className="flex items-center w-fit bg-[#f4f5f7] rounded-[8px] p-1 mb-6 border border-gray-200">
        {(["Weekly Off", "Attendance On Weekly Off"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-[6px] text-[13px] font-medium transition-all duration-200 ${activeTab === tab ? "text-black font-semibold" : "text-slate-400 hover:text-slate-700 hover:bg-white/50"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] p-8 flex flex-col min-h-[500px]">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#3e554d]" /></div>
        ) : displayedTemplates.length === 0 ? (
          // Empty State
          <>
            <div className="mb-[140px]">
              <h3 className="text-[16px] font-bold text-slate-800 mb-1 tracking-tight">
                {activeTab === "Weekly Off" ? "Weekly Off Template" : "Attendance on Weekly Off Templates"}
              </h3>
              <p className="text-[12px] text-gray-500 font-medium tracking-tight">
                {activeTab === "Weekly Off" ? "Create templates for weekly off management" : "Create templates to mark attendance on weekly off"}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center -mt-6">
              <div className="mb-4"><Image src={cloudIcon} alt="No templates found" className="w-[120px] h-auto object-contain" /></div>
              <p className="text-[10px] font-medium text-gray-400 mb-6 tracking-wide text-center">
                {activeTab === "Weekly Off"
                  ? "No templates found. Create a Weekly Off template by clicking on the +New Template button"
                  : "No templates found. Create an Attendance on Weekly Off template by clicking on the +New Template button"}
              </p>
              <button onClick={handleNewTemplateClick}
                className="flex items-center gap-1.5 bg-[#f0f4f8] text-slate-700 px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-slate-200 transition-colors">
                New Template <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>
          </>
        ) : (
          // List State
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-[18px] font-bold text-slate-900 leading-tight">
                  {activeTab === "Weekly Off" ? "Weekly Off Templates" : "Attendance on Weekly Off Templates"}
                </h3>
                <p className="text-[12px] text-gray-400 mt-1 font-medium opacity-80">
                  {activeTab === "Weekly Off" ? "Manage your weekly off templates" : "Manage your attendance on weekly off templates"}
                </p>
              </div>
              <button onClick={handleNewTemplateClick}
                className="flex items-center gap-2 bg-[#3e554d] text-white px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-[#344641] transition-all shadow-md cursor-pointer">
                <Plus size={18} strokeWidth={2.5} /> New Template
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {displayedTemplates.map((template) => (
                <div key={template.id}
                  className="group flex items-center justify-between p-5 border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all bg-white">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-[15px] font-bold text-slate-800 tracking-tight">{template.templateName}</h4>
                    {activeTab === "Attendance On Weekly Off" && (
                      <p className="text-[12px] text-gray-400 font-medium">{template.attendanceType}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-8 text-[13px] font-semibold text-gray-500">
                    <div
                      onClick={() => { setAssignStaffTemplateId(template.id); setOpenMenuId(null); }}
                      className="tracking-tight opacity-80 cursor-pointer hover:text-[#3e554d] hover:underline transition-colors">
                      Assigned Staff: {template.assignedStaff ?? 0}
                    </div>
                    <div className="relative">
                      <button onClick={() => setOpenMenuId(openMenuId === template.id ? null : template.id)}
                        className={`p-1.5 rounded-lg transition-colors ${openMenuId === template.id ? "bg-gray-100 text-[#3e554d]" : "text-gray-400 hover:bg-gray-50"}`}>
                        <MoreVertical size={18} />
                      </button>
                      {openMenuId === template.id && (
                        <div ref={menuRef} className="absolute right-0 mt-2 w-[140px] bg-white border border-gray-100 rounded-[10px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-50 py-1 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                          <button onClick={() => handleEdit(template)}
                            className="flex items-center px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors text-left font-medium w-full">
                            Edit
                          </button>
                          <button onClick={() => { setAssignStaffTemplateId(template.id); setOpenMenuId(null); }}
                            className="flex items-center px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors text-left font-medium w-full border-t border-gray-50">
                            Assign staff
                          </button>
                          <button onClick={() => { setDeleteType(activeTab); setDeleteModalId(template.id); setOpenMenuId(null); }}
                            className="flex items-center px-4 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors text-left font-medium w-full">
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Error Toast */}
      {errorMsg && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] bg-red-500 text-white text-[13px] font-semibold px-5 py-3 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-[420px] text-center">
          {errorMsg}
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalId !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[400px] rounded-[12px] shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 mt-2">
              <h3 className="text-[17px] font-bold text-slate-800">Delete</h3>
              <button onClick={() => setDeleteModalId(null)} className="p-1 hover:bg-slate-100 text-slate-500 rounded-[6px] transition-colors -mr-2 -mt-2">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <p className="text-[13.5px] text-slate-500 mb-8 leading-relaxed font-medium">
              Are you sure you want to delete this template? This action cannot be reversed.
            </p>
            <div className="flex items-center justify-between gap-4">
              <button onClick={() => setDeleteModalId(null)}
                className="flex-1 py-[9px] rounded-[8px] text-[13.5px] font-bold border border-[#3f5a54] text-[#3f5a54] hover:bg-[#f3f6f5] transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-[9px] rounded-[8px] text-[13.5px] font-bold bg-[#ef4444] text-white hover:bg-red-600 transition-colors shadow-sm cursor-pointer">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff List Panel (Weekly Off templates only) */}
      <StaffListModal
        isOpen={assignStaffTemplateId !== null}
        onClose={() => setAssignStaffTemplateId(null)}
        templateId={assignStaffTemplateId}
        templateType={activeTab}
        onDone={() => fetchAll()}
      />
    </div>
  );
};

export default WeeklyHolidaysView;