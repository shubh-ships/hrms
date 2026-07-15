"use client";
import React, { useState, useEffect, useCallback } from "react";
import { X, Search, Loader2 } from "lucide-react";
import axiosClient from "@/lib/api/client";

interface StaffItem {
  empId: string;
  assignmentId?: string; // only for assigned employees
  name: string;
  shiftName: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  templateId: string | null;
  onDone: () => void;
}

const groupByShift = (items: StaffItem[]) => {
  const map: Record<string, StaffItem[]> = {};
  items.forEach((s) => {
    const key = s.shiftName || "No Shift Assigned";
    if (!map[key]) map[key] = [];
    map[key].push(s);
  });
  return Object.entries(map);
};

export default function AutomationStaffModal({ isOpen, onClose, templateId, onDone }: Props) {
  const [tab, setTab] = useState<"Selected" | "Unselected">("Selected");
  const [search, setSearch] = useState("");
  const [assigned, setAssigned] = useState<StaffItem[]>([]);
  const [unassigned, setUnassigned] = useState<StaffItem[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [operating, setOperating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  const loadData = useCallback(async (tid: string) => {
    setLoading(true);
    try {
      const [allRes, assignedRes, unassignedRes] = await Promise.all([
        axiosClient.get("/automation/templates/getAssignments"),
        axiosClient.get(`/automation/templates/${tid}/staff?limit=1000`),
        axiosClient.get(`/automation/templates/${tid}/staff?unassignedStaff=true&limit=1000`),
      ]);
      const allAssignments: any[] = Array.isArray(allRes.data?.data)
        ? allRes.data.data : [];
      const forTemplate = allAssignments.filter(
        (a) => String(a.templateId?._id || a.templateId) === String(tid)
      );

      const assignedEmps = Array.isArray(assignedRes.data?.data?.data) ? assignedRes.data.data.data : [];
      const unassignedEmps = Array.isArray(unassignedRes.data?.data?.data) ? unassignedRes.data.data.data : [];
      const allEmps: any[] = [...assignedEmps, ...unassignedEmps];
      const assignedIds = new Set(forTemplate.map(a => String(a.employeeId?._id || a.employeeId)));

      const assignedList: StaffItem[] = [];
      const unassignedList: StaffItem[] = [];

      allEmps.forEach(emp => {
        const empId = String(emp._id);
        const name = emp.name || (emp.personal ? `${emp.personal.firstName} ${emp.personal.lastName || ''}`.trim() : "Unknown");
        // safely extract shift name if populated, otherwise fallback text based on existence of ID
        const shiftName = emp.shift?.name || emp.shiftTemplateId?.name || (emp.shiftTemplateId ? "Shift Assigned" : "No Shift Assigned");

        if (assignedIds.has(empId)) {
          const assignment = forTemplate.find(a => String(a.employeeId?._id || a.employeeId) === empId);
          if (assignment) assignedList.push({ empId, assignmentId: String(assignment._id), name, shiftName });
        } else {
          // only show active employees in unassigned
          if (emp.employment?.status === "active" || emp.status === "active" || !emp.employment) {
            unassignedList.push({ empId, name, shiftName });
          }
        }
      });
      setAssigned(assignedList);
      setUnassigned(unassignedList);
    } catch (err) {
      console.error("AutomationStaffModal: failed to load data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && templateId) {
      setTab("Selected");
      setChecked(new Set());
      setSearch("");
      setErrorMsg(null);
      setValidationMsg(null);
      loadData(templateId);
    }
  }, [isOpen, templateId, loadData]);

  if (!isOpen) return null;

  const pool = tab === "Selected" ? assigned : unassigned;
  const filtered = pool.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );
  const groups = groupByShift(filtered);
  const allFilteredKeys = filtered.map((s) => (tab === "Selected" ? s.assignmentId! : s.empId));
  const isAllChecked = allFilteredKeys.length > 0 && allFilteredKeys.every((k) => checked.has(k));

  const toggle = (key: string) => {
    const n = new Set(checked);
    n.has(key) ? n.delete(key) : n.add(key);
    setChecked(n);
  };
  const toggleAll = () => {
    const n = new Set(checked);
    if (isAllChecked) allFilteredKeys.forEach((k) => n.delete(k));
    else allFilteredKeys.forEach((k) => n.add(k));
    setChecked(n);
  };
  const getKey = (s: StaffItem) => tab === "Selected" ? s.assignmentId! : s.empId;

  const handleAssign = async () => {
    if (!templateId || checked.size === 0) return;
    setOperating(true);
    setErrorMsg(null);
    setValidationMsg(null);
    try {
      await Promise.all(
        [...checked].map((empId) =>
          axiosClient.post("/automation/templates/assign", { employeeId: empId, templateId })
        )
      );
      setChecked(new Set());
      await loadData(templateId);
      onDone();
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to assign staff.";
      if (status === 409) {
        // Known business rule — show as inline validation, not an error
        setValidationMsg(msg);
      } else {
        setErrorMsg(msg);
        console.error("Assign failed:", err);
      }
    } finally {
      setOperating(false);
    }
  };

  const handleUnassign = async () => {
    if (!templateId || checked.size === 0) return;
    setOperating(true);
    setErrorMsg(null);
    try {
      await Promise.all(
        [...checked].map((assignmentId) =>
          axiosClient.delete(`/automation/templates/unassign/${assignmentId}`)
        )
      );
      setChecked(new Set());
      await loadData(templateId);
      onDone();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err.message || "Failed to unassign staff.");
      console.error("Unassign failed:", err);
    } finally {
      setOperating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 animate-in fade-in duration-300 p-4 items-center" onClick={onClose}>
      <div className="bg-white h-full max-h-[calc(100vh-32px)] w-full max-w-[450px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[18px] font-bold text-slate-800">Staff List</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          <p className="text-[12px] text-gray-500">Note: Applicable for Non-Hourly Staff with Shift Assigned</p>
          {/* Tabs */}
          <div className="flex items-center w-fit bg-[#f4f5f7] rounded-[8px] p-1 mt-4 border border-gray-100">
            {(["Selected", "Unselected"] as const).map((t) => (
              <button key={t} onClick={() => { setTab(t); setChecked(new Set()); }}
                className={`px-4 py-1.5 rounded-[6px] text-[12px] font-medium transition-all ${tab === t ? "bg-white text-slate-800 font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.07)]" : "text-slate-500 hover:text-slate-700"}`}>
                {t} Staff
              </button>
            ))}
          </div>
          {validationMsg && (
            <div className="mt-3 flex items-start gap-2 text-[12px] font-medium text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
              {/* <span className="mt-0.5 shrink-0">⚠️</span> */}
              <span>{validationMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="mt-3 text-[12px] font-medium text-red-500 bg-red-50 p-2 rounded border border-red-100">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="px-6 py-4 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Search by Staff Name" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#3f5a54] transition-colors" />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-[#3e554d]" />
            </div>
          ) : (
            <div className="border border-gray-100 rounded-xl overflow-hidden flex flex-col">
              <div className="grid grid-cols-[45px_1fr] items-center py-2.5 bg-gray-50/50 border-b border-gray-100 shrink-0">
                <div className="flex justify-center">
                  <input type="checkbox" checked={isAllChecked} onChange={toggleAll}
                    className="w-3.5 h-3.5 rounded border-gray-300 accent-[#3f5a54] cursor-pointer" />
                </div>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Staff Name</span>
              </div>
              <div className="overflow-y-auto custom-scrollbar">
                <style>{`.custom-scrollbar::-webkit-scrollbar{width:4px}.custom-scrollbar::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}`}</style>
                {groups.length === 0 ? (
                  <div className="py-10 text-center text-[13px] text-gray-400">No staff found</div>
                ) : groups.map(([shift, employees]) => (
                  <div key={shift}>
                    <div className="grid grid-cols-[45px_1fr] items-center py-3 bg-gray-50/30 border-b border-gray-50">
                      <div className="flex justify-center">
                        <input type="checkbox"
                          checked={employees.every((s) => checked.has(getKey(s)))}
                          onChange={() => {
                            const n = new Set(checked);
                            const all = employees.every((s) => n.has(getKey(s)));
                            employees.forEach((s) => all ? n.delete(getKey(s)) : n.add(getKey(s)));
                            setChecked(n);
                          }}
                          className="w-3.5 h-3.5 rounded border-gray-300 accent-[#3f5a54] cursor-pointer" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 leading-tight pr-2">{shift}</span>
                    </div>
                    {employees.map((staff) => (
                      <div key={getKey(staff)} onClick={() => toggle(getKey(staff))}
                        className="grid grid-cols-[45px_1fr] items-center py-2.5 hover:bg-gray-50 transition-colors cursor-pointer border-b last:border-b-0 border-gray-50">
                        <div className="flex justify-center">
                          <input type="checkbox" checked={checked.has(getKey(staff))} onChange={() => { }}
                            className="w-3.5 h-3.5 rounded border-gray-300 accent-[#3f5a54] cursor-pointer" />
                        </div>
                        <span className="text-[13px] text-slate-600 font-medium ml-3">{staff.name}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex items-center gap-3 shrink-0">
          {tab === "Unselected" ? (
            <button onClick={handleAssign} disabled={checked.size === 0 || operating}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${checked.size > 0 && !operating ? "bg-[#3f5a54] text-white hover:bg-[#3f5a54]/90 shadow-sm" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
              {operating && <Loader2 size={14} className="animate-spin" />} Assign Staff
            </button>
          ) : (
            <button onClick={handleUnassign} disabled={checked.size === 0 || operating}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${checked.size > 0 && !operating ? "bg-red-500 text-white hover:bg-red-600 shadow-sm" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
              {operating && <Loader2 size={14} className="animate-spin" />} Unassign Selected
            </button>
          )}
          <button onClick={() => { setChecked(new Set()); onClose(); }}
            className="flex-1 bg-white border border-gray-300 text-slate-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
