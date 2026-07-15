"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Trash, ChevronDown, Check, X, MoreVertical, Loader2 } from "lucide-react";
import axiosClient from "@/lib/api/client";
import { fromApiRulesDeduct, toApiRulesDeduct, defaultOccConfig, OccurrencesConfig } from "./automationApi";
import AutomationStaffModal from "./AutomationStaffModal";

const API_TYPE = "early_out";
const RULE_TITLE = "Early Exit Rules";
const RULE_DESC = "Automate fine for employees who are leaving earlier than the shift out-time";

const hoursOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutesOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

const getMinutesText = (h: string, m: string) => {
  const t = parseInt(h) * 60 + parseInt(m);
  return t === 0 ? "No fine for 0 mins" : `Not applicable upto ${t} mins`;
};

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const l = (e: MouseEvent | TouchEvent) => { if (!ref.current || ref.current.contains(e.target as Node)) return; handler(); };
    document.addEventListener("mousedown", l); document.addEventListener("touchstart", l);
    return () => { document.removeEventListener("mousedown", l); document.removeEventListener("touchstart", l); };
  }, [ref, handler]);
}

const CustomTimeSelect = ({ value, options, onChange, width = "70px", height = "290px" }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setIsOpen(false));
  return (
    <div className="relative" ref={ref} style={{ width }}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-md py-[7px] pl-3 pr-2 focus:outline-none focus:border-[#3f5a54] h-[34px]">
        <span className="text-[13px] text-slate-800">{value}</span><ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-100 rounded-lg shadow-xl overflow-y-auto py-2" style={{ width: "100%", maxHeight: height }}>
          {options.map((opt: string) => (
            <button key={opt} type="button" onClick={() => { onChange(opt); setIsOpen(false); }} className="w-full flex items-center justify-center py-[7px] px-3 hover:bg-gray-50 relative">
              <span className={`text-[13px] ${value === opt ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>{opt}</span>
              {value === opt && <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#3f5a54] rounded-full" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const CustomDeductionSelect = ({ value, onChange, width = "130px", height = "230px" }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setIsOpen(false));
  const [options, setOptions] = useState([
    { label: "Fixed Amount", removable: false }, { label: "1x Salary", removable: false },
    { label: "1.5x Salary", removable: false }, { label: "2x Salary", removable: false },
    { label: "4x Salary", removable: true }, { label: "10x Salary", removable: true }
  ]);
  return (
    <div className="relative" ref={ref} style={{ width }}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-md py-[7px] pl-3 pr-2 focus:outline-none focus:border-[#3f5a54] h-[34px]">
        <span className="text-[13px] text-slate-800 truncate pr-2">{value}</span><ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-100 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-y-auto py-2 w-max min-w-full" style={{ maxHeight: height }}>
          {options.map(opt => (
            <div key={opt.label} className="flex items-center justify-between w-full px-3 py-2.5 hover:bg-gray-50 cursor-pointer" onClick={() => { onChange(opt.label); setIsOpen(false); }}>
              <div className="flex items-center gap-2">
                {value === opt.label ? <div className="w-1.5 h-1.5 bg-[#3f5a54] rounded-full shrink-0" /> : <div className="w-1.5 h-1.5 shrink-0" />}
                <span className={`text-[13px] whitespace-nowrap ${value === opt.label ? 'text-slate-800' : 'text-slate-700'}`}>{opt.label}</span>
              </div>
              {opt.removable && (
                <button type="button" onClick={(e) => { e.stopPropagation(); if (value === opt.label) onChange("Fixed Amount"); setOptions(options.filter(o => o.label !== opt.label)); }} className="text-slate-500 hover:text-red-500 p-1 ml-4">
                  <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              )}
            </div>
          ))}
          <div className="px-5 py-3 mt-1 text-left"><button type="button" className="text-[#3f5a54] text-[13px] hover:underline whitespace-nowrap">Add Salary Multiplier</button></div>
        </div>
      )}
    </div>
  );
};

const CustomOccurrencesTypeSelect = ({ value, onChange, width = "110px" }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setIsOpen(false));
  return (
    <div className="relative" ref={ref} style={{ width }}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-md py-[7px] pl-3 pr-2 focus:outline-none focus:border-[#3f5a54] h-[34px]">
        <span className="text-[13px] text-slate-800">{value}</span><ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-100 rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden py-2 w-full">
          {["Count", "Hours"].map((opt) => (
            <button key={opt} type="button" onClick={() => { onChange(opt); setIsOpen(false); }} className="w-full flex items-center justify-start py-[7px] px-3 hover:bg-gray-50 relative text-left">
              <div className="flex items-center gap-2">
                {value === opt ? <div className="w-1.5 h-1.5 bg-[#3f5a54] rounded-full shrink-0" /> : <div className="w-1.5 h-1.5 shrink-0" />}
                <span className={`text-[13px] ${value === opt ? 'text-slate-800' : 'text-slate-700'}`}>{opt}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const TimeSelector = ({ hours, minutes, onChange }: { hours: string, minutes: string, onChange: (h: string, m: string) => void }) => (
  <div className="flex items-center gap-2">
    <CustomTimeSelect value={hours} options={hoursOptions} onChange={(h: string) => onChange(h, minutes)} />
    <span className="font-medium text-gray-500 mt-1">:</span>
    <CustomTimeSelect value={minutes} options={minutesOptions} onChange={(m: string) => onChange(hours, m)} />
    <span className="text-[11px] text-gray-500 ml-1 mt-1">hh:mm</span>
  </div>
);

const OccurrencesSection = ({ config, onChange }: { config: OccurrencesConfig, onChange: (c: OccurrencesConfig) => void }) => (
  <div className="pt-2">
    <label className="flex items-center gap-2 cursor-pointer w-fit mb-3">
      <input type="checkbox" checked={config.enabled} onChange={e => onChange({ ...config, enabled: e.target.checked })} className="w-4 h-4 cursor-pointer accent-teal-800 rounded border-gray-300" />
      <span className="text-xs font-medium text-slate-700">Set Occurrences</span>
    </label>
    {config.enabled && (
      <div className="ml-1">
        <div className="text-[11px] text-gray-600 mb-1.5">Minimum Occurrences (Exclusive)</div>
        <div className="flex items-center gap-3">
          <CustomOccurrencesTypeSelect value={config.type} onChange={(type: string) => onChange({ ...config, type })} />
          {config.type === "Count" ? (
            <div className="flex items-center border border-gray-200 rounded-md bg-white overflow-hidden w-[90px] h-[34px]">
              <input type="number" min="0" value={config.count} onChange={e => onChange({ ...config, count: e.target.value })} className="w-full py-1.5 px-2 text-[13px] text-slate-800 focus:outline-none text-center" />
              <span className="bg-gray-50 border-l border-gray-200 px-2 py-1.5 text-[11px] text-gray-500 font-medium whitespace-nowrap flex items-center justify-center h-full">Times</span>
            </div>
          ) : (
            <TimeSelector hours={config.hours} minutes={config.minutes} onChange={(h, m) => onChange({ ...config, hours: h, minutes: m })} />
          )}
        </div>
        <div className="text-[11px] text-gray-400 mt-2">
          {config.type === "Count" ? `Fine pardoned upto ${config.count || "0"} times` : `Fine pardoned upto ${config.hours}:${config.minutes} hrs`}
        </div>
      </div>
    )}
  </div>
);

type TimeRange = { id: string; hours: string; minutes: string; deductionType: string; fixedAmount: string; };

const RulesListView = ({
  rules, onAddButtonClick, onDeleteRule, onEditRule, onAssignStaff, assignedCounts,
}: {
  rules: any[]; onAddButtonClick: () => void; onDeleteRule: (id: string) => void;
  onEditRule: (rule: any) => void; onAssignStaff: (rule: any) => void; assignedCounts: Record<string, number>;
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setOpenMenuId(null));
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-800">{RULE_TITLE}</h2><p className="text-sm text-gray-500 mt-1">{RULE_DESC}</p></div>
        <button onClick={onAddButtonClick} className="flex items-center gap-2 bg-[#3f5a54] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"><Plus size={18} strokeWidth={2.5} />Add Rule</button>
      </div>
      <div className="flex flex-col gap-3">
        {rules.map((rule) => (
          <div key={rule._id} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow group">
            <div>
              <h3 className="text-[15px] font-semibold text-slate-800">{rule.name}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                <span>Grace Period: <span className="font-medium">0 mins</span></span>
                <span className="text-gray-300">|</span>
                <button onClick={() => onAssignStaff(rule)} className="hover:underline transition-all">
                  Assigned Staff: <span className="text-[#3f5a54] font-medium">{assignedCounts[rule._id] ?? 0} Staffs</span>
                </button>
              </div>
            </div>
            <div className="relative" ref={openMenuId === rule._id ? menuRef : null}>
              <button onClick={() => setOpenMenuId(openMenuId === rule._id ? null : rule._id)} className="text-gray-400 hover:text-[#3f5a54] p-2 rounded-full hover:bg-[#dfe8e5] transition-colors"><MoreVertical size={20} /></button>
              {openMenuId === rule._id && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-1 flex flex-col">
                  <button onClick={() => { onEditRule(rule); setOpenMenuId(null); }} className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-gray-50 transition-colors text-left font-medium">Edit</button>
                  <button onClick={() => { onAssignStaff(rule); setOpenMenuId(null); }} className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-gray-50 transition-colors text-left font-medium">Assign Rules</button>
                  <button onClick={() => { onDeleteRule(rule._id); setOpenMenuId(null); }} className="flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium">Delete</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function EarlyExitRulesView() {
  const [ruleName, setRuleName] = useState("");
  const [deductSalary, setDeductSalary] = useState(false);
  const [salaryRanges, setSalaryRanges] = useState<TimeRange[]>([{ id: "1", hours: "00", minutes: "00", deductionType: "Fixed Amount", fixedAmount: "0" }]);
  const [salaryOccConfig, setSalaryOccConfig] = useState<OccurrencesConfig>(defaultOccConfig());
  const [deductHalfDay, setDeductHalfDay] = useState(false);
  const [halfDayTime, setHalfDayTime] = useState({ hours: "00", minutes: "00" });
  const [halfDayOccConfig, setHalfDayOccConfig] = useState<OccurrencesConfig>(defaultOccConfig());
  const [deductFullDay, setDeductFullDay] = useState(false);
  const [fullDayTime, setFullDayTime] = useState({ hours: "00", minutes: "00" });
  const [fullDayOccConfig, setFullDayOccConfig] = useState<OccurrencesConfig>(defaultOccConfig());
  const [includeLateFine, setIncludeLateFine] = useState(false);

  const [rules, setRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [assignedCounts, setAssignedCounts] = useState<Record<string, number>>({});
  const [assignStaffTemplateId, setAssignStaffTemplateId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    setIsLoading(true);
    try {
      const [res, assignsRes] = await Promise.all([
        axiosClient.get(`/automation/templates?type=${API_TYPE}`),
        axiosClient.get(`/automation/templates/getAssignments`)
      ]);
      const list: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
      setRules(list);
      
      const allAssigns = Array.isArray(assignsRes.data?.data) ? assignsRes.data.data : [];
      const counts: Record<string, number> = {};
      list.forEach((r) => {
        counts[r._id] = allAssigns.filter((a: any) => String(a.templateId?._id || a.templateId) === String(r._id)).length;
      });
      setAssignedCounts(counts);
    } catch (err: any) { setError(err?.response?.data?.message || "Failed to load rules."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);
  useEffect(() => { if (!error) return; const t = setTimeout(() => setError(null), 5000); return () => clearTimeout(t); }, [error]);

  const handleEdit = (rule: any) => {
    const s = fromApiRulesDeduct(rule.rules);
    setRuleName(rule.name || "");
    setDeductSalary(s.deductSalary); setSalaryRanges(s.salaryRanges); setSalaryOccConfig(s.salaryOccConfig);
    setDeductHalfDay(s.deductHalfDay); setHalfDayTime(s.halfDayTime); setHalfDayOccConfig(s.halfDayOccConfig);
    setDeductFullDay(s.deductFullDay); setFullDayTime(s.fullDayTime); setFullDayOccConfig(s.fullDayOccConfig);
    setIncludeLateFine(s.includeLateFine);
    setEditingRuleId(rule._id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!ruleName.trim()) return;
    const state = { deductSalary, salaryRanges, salaryOccConfig, deductHalfDay, halfDayTime, halfDayOccConfig, deductFullDay, fullDayTime, fullDayOccConfig, includeLateFine };
    const payload = { type: API_TYPE, name: ruleName.trim(), rules: toApiRulesDeduct(state) };
    setIsSaving(true);
    try {
      if (editingRuleId) await axiosClient.put(`/automation/templates/${editingRuleId}`, payload);
      else await axiosClient.post("/automation/templates", payload);
      setShowForm(false); resetForm(); await fetchRules();
    } catch (err: any) { setError(err?.response?.data?.message || err.message || "Failed to save."); }
    finally { setIsSaving(false); }
  };

  const resetForm = () => {
    setRuleName(""); setDeductSalary(false);
    setSalaryRanges([{ id: "1", hours: "00", minutes: "00", deductionType: "Fixed Amount", fixedAmount: "0" }]);
    setSalaryOccConfig(defaultOccConfig()); setDeductHalfDay(false);
    setHalfDayTime({ hours: "00", minutes: "00" }); setHalfDayOccConfig(defaultOccConfig());
    setDeductFullDay(false); setFullDayTime({ hours: "00", minutes: "00" });
    setFullDayOccConfig(defaultOccConfig()); setIncludeLateFine(false); setEditingRuleId(null);
  };

  const handleCancel = () => { resetForm(); if (rules.length > 0) setShowForm(false); };
  const handleAddSalaryRange = () => setSalaryRanges(prev => [...prev, { id: Date.now().toString(), hours: "00", minutes: "00", deductionType: "Fixed Amount", fixedAmount: "0" }]);
  const handleRemoveSalaryRange = (id: string) => setSalaryRanges(prev => prev.filter(r => r.id !== id));
  const handleUpdateSalaryRange = (id: string, field: keyof TimeRange, value: string) => setSalaryRanges(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));

  const handleDeleteRule = async () => {
    if (!deleteTargetId) return;
    try { await axiosClient.delete(`/automation/templates/${deleteTargetId}`); setRules(prev => prev.filter(r => r._id !== deleteTargetId)); }
    catch (err: any) { setError(err?.response?.data?.message || "Failed to delete."); }
    finally { setDeleteTargetId(null); }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#3e554d]" /></div>;

  if (rules.length > 0 && !showForm) {
    return (
      <>
        {error && <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] bg-red-500 text-white text-[13px] font-semibold px-5 py-3 rounded-xl shadow-lg">{error}</div>}
        <RulesListView rules={rules} assignedCounts={assignedCounts} onAddButtonClick={() => setShowForm(true)}
          onDeleteRule={(id) => setDeleteTargetId(id)} onEditRule={handleEdit} onAssignStaff={(r) => setAssignStaffTemplateId(r._id)} />
        <AutomationStaffModal isOpen={assignStaffTemplateId !== null} onClose={() => setAssignStaffTemplateId(null)} templateId={assignStaffTemplateId} onDone={fetchRules} />
        {deleteTargetId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
            <div className="bg-white w-full max-w-[380px] rounded-xl shadow-2xl p-6">
              <h3 className="text-[16px] font-bold text-slate-800 mb-2">Delete Rule</h3>
              <p className="text-[13px] text-slate-500 mb-6">Are you sure? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTargetId(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-[13px] font-semibold text-slate-700 hover:bg-gray-50">Cancel</button>
                <button onClick={handleDeleteRule} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-[13px] font-semibold hover:bg-red-600">Delete</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col mt-4">
      <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar{width:4px}.custom-scrollbar::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}` }} />
      <div className="text-[16px] font-medium text-slate-800 mb-6">Create a {RULE_TITLE}</div>
      <div className="mb-8">
        <label className="block text-[11px] font-medium text-gray-700 mb-1.5">Rule Name <span className="text-red-500">*</span></label>
        <input type="text" placeholder="Enter Name" value={ruleName} onChange={e => setRuleName(e.target.value)} className="w-full max-w-[300px] border border-gray-200 rounded-md py-2 px-3 text-[13px] text-slate-800 focus:outline-none focus:border-[#3f5a54] placeholder-gray-400" />
      </div>
      {error && <div className="mb-4 text-[13px] text-red-500 font-medium">{error}</div>}

      <div className="flex flex-col gap-6">
        <div className="space-y-3 pb-4">
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input type="checkbox" checked={deductSalary} onChange={e => setDeductSalary(e.target.checked)} className="w-4 h-4 cursor-pointer accent-teal-800 rounded border-gray-300" />
            <span className="text-[13px] font-medium text-slate-700">Deduct salary if staff is late by more than</span>
          </label>
          {deductSalary && (
            <div className="bg-[#F8F9FA] p-5 rounded-xl border border-gray-100 flex flex-col gap-5">
              {salaryRanges.map((range) => (
                <div key={range.id} className="flex flex-wrap items-start gap-[18px]">
                  <div>
                    <div className="text-[11px] text-gray-600 mb-[7px]">If Staff is Late by</div>
                    <TimeSelector hours={range.hours} minutes={range.minutes} onChange={(h, m) => { handleUpdateSalaryRange(range.id, 'hours', h); handleUpdateSalaryRange(range.id, 'minutes', m); }} />
                    <div className="text-[10px] text-gray-400 mt-[5px]">{getMinutesText(range.hours, range.minutes)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-600 mb-[7px]">Deduction Type</div>
                    <CustomDeductionSelect value={range.deductionType} onChange={(v: string) => handleUpdateSalaryRange(range.id, 'deductionType', v)} />
                  </div>
                  {range.deductionType === "Fixed Amount" && (
                    <div>
                      <div className="text-[11px] text-gray-600 mb-[7px]">Fixed Amount</div>
                      <div className="flex items-center border border-gray-200 rounded-md bg-white overflow-hidden w-[140px] h-[34px]">
                        <span className="px-3 py-1.5 text-[13px] text-gray-500 bg-gray-50 border-r border-gray-100 font-medium">₹</span>
                        <input type="number" min="0" value={range.fixedAmount} onChange={e => handleUpdateSalaryRange(range.id, 'fixedAmount', e.target.value)} className="w-full py-1.5 px-3 text-[13px] text-slate-800 focus:outline-none" />
                      </div>
                    </div>
                  )}
                  {salaryRanges.length > 1 && (
                    <div className="pt-[21px]">
                      <button onClick={() => handleRemoveSalaryRange(range.id)} className="w-[34px] h-[34px] flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"><Trash className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              ))}
              <div><button onClick={handleAddSalaryRange} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-gray-100 hover:bg-gray-200 px-3 py-[7px] rounded-md transition-colors w-fit"><Plus className="w-3.5 h-3.5" strokeWidth={3} />Add Time Range</button></div>
              <OccurrencesSection config={salaryOccConfig} onChange={setSalaryOccConfig} />
            </div>
          )}
        </div>

        <div className="space-y-3 pb-4">
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input type="checkbox" checked={deductHalfDay} onChange={e => setDeductHalfDay(e.target.checked)} className="w-4 h-4 cursor-pointer accent-teal-800 rounded border-gray-300" />
            <span className="text-[13px] font-medium text-slate-700">Deduct half day salary if staff is late by more than</span>
          </label>
          {deductHalfDay && (
            <div className="bg-[#F8F9FA] p-5 rounded-xl border border-gray-100 flex flex-col gap-4">
              <div>
                <div className="text-[11px] text-gray-600 mb-[7px]">If Staff is Late by</div>
                <TimeSelector hours={halfDayTime.hours} minutes={halfDayTime.minutes} onChange={(h, m) => setHalfDayTime({ hours: h, minutes: m })} />
                <div className="text-[10px] text-gray-400 mt-[5px]">{getMinutesText(halfDayTime.hours, halfDayTime.minutes)}</div>
              </div>
              <OccurrencesSection config={halfDayOccConfig} onChange={setHalfDayOccConfig} />
            </div>
          )}
        </div>

        <div className="space-y-3 border-b border-gray-100 pb-8">
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input type="checkbox" checked={deductFullDay} onChange={e => setDeductFullDay(e.target.checked)} className="w-4 h-4 cursor-pointer accent-teal-800 rounded border-gray-300" />
            <span className="text-[13px] font-medium text-slate-700">Deduct full day salary if staff is late by more than</span>
          </label>
          {deductFullDay && (
            <div className="bg-[#F8F9FA] p-5 rounded-xl border border-gray-100 flex flex-col gap-4">
              <div>
                <div className="text-[11px] text-gray-600 mb-[7px]">If Staff is Late by</div>
                <TimeSelector hours={fullDayTime.hours} minutes={fullDayTime.minutes} onChange={(h, m) => setFullDayTime({ hours: h, minutes: m })} />
                <div className="text-[10px] text-gray-400 mt-[5px]">{getMinutesText(fullDayTime.hours, fullDayTime.minutes)}</div>
              </div>
              <OccurrencesSection config={fullDayOccConfig} onChange={setFullDayOccConfig} />
            </div>
          )}
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button type="button" onClick={() => setIncludeLateFine(!includeLateFine)} className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${includeLateFine ? "bg-[#3f5a54]" : "bg-gray-200"}`}>
            <div className={`absolute w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 flex items-center justify-center ${includeLateFine ? "translate-x-[22px]" : "translate-x-[2px]"}`}>
              {includeLateFine && <Check className="w-3 h-3 text-[#3f5a54]" strokeWidth={3} />}
            </div>
          </button>
          <span className="text-[13px] font-medium text-slate-600">Include late fine from start time of shift</span>
        </div>
      </div>
      <div className="h-24" />
      <div className="fixed bottom-0 right-0 w-full z-[10] bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-end gap-3 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)]">
        <button onClick={handleCancel} className="px-5 py-2 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={!ruleName.trim() || isSaving} className={`flex items-center gap-2 px-5 py-2 text-[13px] font-medium rounded-md transition-colors ${!ruleName.trim() || isSaving ? 'text-gray-400 bg-[#F1F5F9] border border-gray-200 cursor-not-allowed' : 'text-white bg-[#3f5a54] hover:bg-[#bed1ca] hover:text-[#3f5a54] shadow-sm border border-transparent'}`}>
          {isSaving && <Loader2 size={14} className="animate-spin" />} Save Rule
        </button>
      </div>
    </div>
  );
}
