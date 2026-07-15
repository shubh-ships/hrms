"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import axiosClient from "@/lib/api/client";

const attendanceTypeOptions = ["Assign Overtime", "Assign Regular Payable Day", "Assign Comp-Off"];
const rateTypeOptions = ["Salary Multiplier", "Fixed Rate"];

// --- Mapping helpers ---
const typeToApi = (t: string) => t === "Assign Overtime" ? "OVERTIME" : t === "Assign Comp-Off" ? "COMP_OFF" : "REGULAR_PAYABLE_DAY";
const typeFromApi = (t: string) => t === "OVERTIME" ? "Assign Overtime" : t === "COMP_OFF" ? "Assign Comp-Off" : "Assign Regular Payable Day";
const rateToApi = (r: string) => r === "Fixed Rate" ? "FIXED_AMOUNT" : "SALARY_MULTIPLIER";
const rateFromApi = (r: string) => r === "FIXED_AMOUNT" ? "Fixed Rate" : "Salary Multiplier";

// --- Custom Dropdown ---
const FormDropdown = ({
  label, value, options, onChange, className = "max-w-[460px]",
}: { label?: string; value: string; options: string[]; onChange: (val: string) => void; className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  return (
    <div className={`relative w-full ${className}`} ref={ref}>
      {label && <label className="block text-[11px] font-medium text-slate-600 mb-2">{label} <span className="text-red-500">*</span></label>}
      <button type="button" onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-[13px] text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all hover:border-gray-300">
        <span className={value ? "text-slate-700" : "text-gray-400"}>{value || "Select Option"}</span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] py-2 w-full animate-in fade-in zoom-in-95 duration-200">
          {options.map((opt) => (
            <button key={opt} type="button" onClick={() => { onChange(opt); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
              <div className={`w-2 h-2 rounded-full shrink-0 ${value === opt ? "bg-[#3e554d]" : "bg-transparent"}`} />
              <span className={`text-[13.5px] ${value === opt ? "text-slate-800 font-semibold" : "text-slate-700 font-medium"}`}>{opt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main Component ---
const WeeklyOffAttendanceFormView = () => {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [attendanceType, setAttendanceType] = useState("Assign Regular Payable Day");
  const [compensationRateType, setCompensationRateType] = useState("Salary Multiplier");
  const [compensationValue, setCompensationValue] = useState("1");
  const [ignoreAutomationRules, setIgnoreAutomationRules] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!saveError) return;
    const t = setTimeout(() => setSaveError(null), 5000);
    return () => clearTimeout(t);
  }, [saveError]);

  // Load for edit mode
  useEffect(() => {
    const id = sessionStorage.getItem("editWeeklyOffId");
    if (!id) return;
    setEditingId(id);

    const load = async () => {
      try {
        const res = await axiosClient.get(`/attendanceonweeklyoff/templates/${id}`);
        const t = res.data?.data;
        if (!t) return;
        setTemplateName(t.name || "");
        setAttendanceType(typeFromApi(t.attendanceOnWeekOffType || "REGULAR_PAYABLE_DAY"));
        if (t.compensationType) setCompensationRateType(rateFromApi(t.compensationType));
        if (t.compensationValue != null) setCompensationValue(String(t.compensationValue));
        setIgnoreAutomationRules(!!t.disableAutomationRules);
      } catch (err: any) {
        setSaveError(err?.response?.data?.message || "Failed to load template.");
      }
    };
    load();
  }, []);

  const isOvertime = attendanceType === "Assign Overtime";

  const handleSave = async () => {
    if (!templateName.trim()) return;
    const apiType = typeToApi(attendanceType);
    const payload: Record<string, any> = {
      name: templateName.trim(),
      attendanceOnWeekOffType: apiType,
      disableAutomationRules: ignoreAutomationRules,
    };
    if (apiType === "OVERTIME") {
      payload.compensationType = rateToApi(compensationRateType);
      payload.compensationValue = parseFloat(compensationValue) || 1;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      if (editingId) {
        await axiosClient.put(`/attendanceonweeklyoff/templates/${editingId}`, payload);
        sessionStorage.removeItem("editWeeklyOffId");
      } else {
        await axiosClient.post("/attendanceonweeklyoff/templates", payload);
      }
      router.push("/dashboard/admin/hrms/others/weekly-holidays");
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || err?.message || "Failed to save template.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <div className="p-4 md:p-6 max-w-[1400px] w-full mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] p-6">
          <h2 className="text-[17px] font-bold text-slate-800 mb-6">Attendance on weekly off configuration</h2>

          {/* Name */}
          <div className="max-w-[660px] mb-8">
            <label className="block text-[12px] font-medium text-slate-600 mb-2">Name <span className="text-red-500">*</span></label>
            <input type="text" placeholder="Provide a Template Name" value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-[13px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder-gray-300 transition-all font-medium" />
          </div>

          {/* Attendance Type */}
          <div className="max-w-[660px] bg-[#f8f9fa] rounded-xl border border-gray-100 p-5 mt-6">
            <p className="text-[13px] font-semibold text-slate-800 mb-1">Attendance Type</p>
            <p className="text-[11px] text-gray-500 font-medium mb-5">Choose the attendance type to assign for working on a weekly off</p>
            <FormDropdown label="Type" value={attendanceType} options={attendanceTypeOptions} onChange={setAttendanceType} />
          </div>

          {/* Overtime-only fields */}
          {isOvertime && (
            <>
              <div className="max-w-[660px] bg-white rounded-xl border border-gray-100 mt-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
                <div className="p-5 border-b border-gray-50">
                  <p className="text-[14px] font-bold text-slate-800 mb-1">Weekly Off Compensation</p>
                  <p className="text-[11px] text-gray-500 font-medium">Configure compensation structure for working on weekly off days</p>
                </div>
                <div className="p-5 bg-[#f8f9fa] grid grid-cols-2 gap-4">
                  <div>
                    <FormDropdown label="Rate" value={compensationRateType} options={rateTypeOptions}
                      onChange={(val) => { setCompensationRateType(val); setCompensationValue(val === "Fixed Rate" ? "0" : "1"); }}
                      className="w-full" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-2">
                      {compensationRateType === "Fixed Rate" ? "Amount" : "Multiplier"} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400 font-medium">
                        {compensationRateType === "Fixed Rate" ? "₹" : "x"}
                      </span>
                      <input type="number" value={compensationValue} onChange={(e) => setCompensationValue(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg pl-8 pr-4 py-2.5 text-[13px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-300 font-medium" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Ignore automation toggle */}
              <div className="mt-8 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <button onClick={() => setIgnoreAutomationRules(!ignoreAutomationRules)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${ignoreAutomationRules ? "bg-[#3e554d]" : "bg-gray-200"}`}>
                  <div className={`absolute w-5 h-5 bg-white rounded-full shadow-sm transition-all ${ignoreAutomationRules ? "left-[22px]" : "left-[2px]"} flex items-center justify-center`}>
                    {ignoreAutomationRules && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="text-[#3e554d]">
                        <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </button>
                <div className="flex items-center gap-2 relative">
                  <span className="text-[14px] text-slate-800 font-medium tracking-tight">Ignore automation rules on week offs</span>
                  <div className="cursor-pointer" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-gray-400 hover:text-gray-600 transition-colors">
                      <circle cx="7" cy="7" r="6.25" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M7 4.5V4.505M7 6.5V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  {showTooltip && (
                    <div className="absolute bottom-full mb-2 left-[120px] -translate-x-1/2 w-[240px] bg-[#2d3748] text-white text-[11px] p-3 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-150 z-50 leading-relaxed">
                      Automation rules will not apply on Week Offs; working hours will be entirely calculated as overtime
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#2d3748]" />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error Toast */}
      {saveError && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] bg-red-500 text-white text-[13px] font-semibold px-5 py-3 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-[420px] text-center">
          {saveError}
        </div>
      )}

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[30] bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-end shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard/admin/hrms/others/weekly-holidays")}
            className="px-8 py-2.5 bg-white border border-gray-300 text-slate-700 font-semibold rounded-lg text-sm hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!templateName.trim() || isSaving}
            className={`flex items-center gap-2 px-10 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${!templateName.trim() || isSaving ? "bg-[#f1f5f9] text-gray-400 cursor-not-allowed border border-gray-100" : "bg-[#3e554d] text-white hover:bg-[#344641] border border-[#344641]"}`}>
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeeklyOffAttendanceFormView;