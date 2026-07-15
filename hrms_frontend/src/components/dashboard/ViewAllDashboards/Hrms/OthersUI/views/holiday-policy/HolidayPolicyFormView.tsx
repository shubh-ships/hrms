"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, Pencil, CalendarFold, Trash, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import axiosClient from "@/lib/api/client";

// --- Types ---
type HolidayItem = {
  holidayName: string;
  holidayDate: string; // "YYYY-MM-DD"
};

// --- Date helpers (timezone-safe: no toISOString()) ---
const ymToFirstDay = (ym: string): string => `${ym}-01`;

const ymToLastDay = (ym: string): string => {
  const [y, m] = ym.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
};

const isoToYM = (iso: string): string => {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  return `${y}-${m}`;
};

const isoToYMD = (iso: string): string => {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = d.getUTCDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// --- Helper: Format Month Display ---
const formatMonthDisplay = (monthStr: string) => {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-");
  const d = new Date(parseInt(year), parseInt(month) - 1);
  return d.toLocaleString("default", { month: "short", year: "numeric" });
};

// --- Helper: Format Date Display ---
const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return "";
  // Parse as local date to avoid timezone shifts in display
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// --- Custom Month Picker ---
const MonthPicker = ({ value, onChange, onClose }: { value: string; onChange: (val: string) => void; onClose: () => void }) => {
  const [currentYear, setCurrentYear] = useState(parseInt(value.split("-")[0]) || 2026);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return (
    <div className="absolute z-50 mt-1 bg-white border border-gray-100 shadow-2xl rounded-xl p-4 w-[280px] animate-in fade-in zoom-in duration-200">
      <div className="flex items-center justify-between mb-4 px-1">
        <button onClick={() => setCurrentYear(currentYear - 1)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-slate-600"><ChevronLeft size={16} /></button>
        <span className="font-bold text-slate-800 text-[14px]">{currentYear}</span>
        <button onClick={() => setCurrentYear(currentYear + 1)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-slate-600"><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {months.map((m, i) => {
          const fullVal = `${currentYear}-${(i + 1).toString().padStart(2, "0")}`;
          return (
            <button key={m} onClick={() => { onChange(fullVal); onClose(); }}
              className={`py-2 text-[12px] font-semibold rounded-lg transition-all ${value === fullVal ? "bg-[#3e554d] text-white shadow-md" : "text-slate-600 hover:bg-gray-50"}`}>
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- Custom Date Picker ---
const DatePicker = ({ value, onChange, onClose }: { value: string; onChange: (val: string) => void; onClose: () => void }) => {
  const [viewDate, setViewDate] = useState(value ? new Date(value + "T00:00:00") : new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="absolute z-50 mt-1 bg-white border border-gray-100 shadow-2xl rounded-xl p-4 w-[300px] animate-in fade-in zoom-in duration-200">
      <div className="flex items-center justify-between mb-4 px-1">
        <button onClick={() => setViewDate(new Date(year, month - 1))} className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-slate-600"><ChevronLeft size={16} /></button>
        <div className="flex flex-col items-center">
          <span className="font-bold text-slate-800 text-[14px]">{months[month]}</span>
          <span className="text-[11px] text-gray-400 font-medium">{year}</span>
        </div>
        <button onClick={() => setViewDate(new Date(year, month + 1))} className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-slate-600"><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
          <span key={d} className="text-center text-[10px] uppercase font-bold text-gray-400 py-1">{d}</span>
        ))}
        {Array.from({ length: firstDay }, (_, i) => <div key={`p-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1;
          const dateVal = `${year}-${(month + 1).toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
          return (
            <button key={d} onClick={() => { onChange(dateVal); onClose(); }}
              className={`h-8 w-8 text-[12px] font-semibold rounded-lg flex items-center justify-center transition-all ${value === dateVal ? "bg-[#3e554d] text-white" : "text-slate-600 hover:bg-gray-50"}`}>
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- Main Component ---
const HolidayPolicyFormView = () => {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [startMonth, setStartMonth] = useState("2026-01");
  const [endMonth, setEndMonth] = useState("2026-12");
  const [holidayList, setHolidayList] = useState<HolidayItem[]>([{ holidayName: "", holidayDate: "" }]);
  const [openPicker, setOpenPicker] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!saveError) return;
    const t = setTimeout(() => setSaveError(null), 5000);
    return () => clearTimeout(t);
  }, [saveError]);

  // Load for edit mode
  useEffect(() => {
    const id = sessionStorage.getItem("editHolidayPolicyId");
    if (!id) return;
    setEditingId(id);

    const load = async () => {
      try {
        const res = await axiosClient.get(`/holiday/${id}`);
        const t = res.data?.data;
        if (!t) return;
        setTemplateName(t.name || "");
        if (t.StartDate) setStartMonth(isoToYM(t.StartDate));
        if (t.endDate) setEndMonth(isoToYM(t.endDate));
        if (t.holidays?.length) {
          setHolidayList(t.holidays.map((h: any) => ({
            holidayName: h.holidayName || "",
            holidayDate: h.holidayDate ? isoToYMD(h.holidayDate) : "",
          })));
        }
      } catch (err: any) {
        setSaveError(err?.response?.data?.message || "Failed to load template.");
      }
    };
    load();
  }, []);

  const addedCount = holidayList.filter(h => h.holidayName.trim() || h.holidayDate).length;

  const handleHolidayChange = (index: number, field: keyof HolidayItem, value: string) => {
    setHolidayList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addHoliday = () => setHolidayList(prev => [...prev, { holidayName: "", holidayDate: "" }]);
  const deleteHoliday = (index: number) => setHolidayList(prev => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!templateName.trim()) return;

    const payload = {
      name: templateName.trim(),
      StartDate: ymToFirstDay(startMonth),
      endDate: ymToLastDay(endMonth),
      holidays: holidayList
        .filter(h => h.holidayName.trim() && h.holidayDate)
        .map(h => ({ holidayName: h.holidayName.trim(), holidayDate: h.holidayDate })),
    };

    setIsSaving(true);
    setSaveError(null);
    try {
      if (editingId) {
        await axiosClient.put(`/holiday/${editingId}`, payload);
        sessionStorage.removeItem("editHolidayPolicyId");
      } else {
        await axiosClient.post("/holiday", payload);
      }
      router.push("/dashboard/admin/hrms/others/holiday-policy");
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || err?.message || "Failed to save template.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfcfc] px-4 py-3 pb-24">
      <style jsx global>{`
        input[type="month"]::-webkit-calendar-picker-indicator,
        input[type="date"]::-webkit-calendar-picker-indicator { display: none !important; }
      `}</style>

      <h2 className="text-[20px] font-bold text-slate-900 mb-5">
        {editingId ? "Edit Holiday Template" : "Holiday Templates"}
      </h2>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] p-8 mb-20">
        <div className="w-1/2 min-w-[420px]">
          <h3 className="text-[15px] font-bold text-slate-800 mb-0.5">Add Template</h3>
          <p className="text-[12px] text-gray-400 mb-8 tracking-tight">Curate holiday lists for specific employee groups</p>

          {/* Name */}
          <div className="mb-8">
            <label className="block text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">
              Name <span className="text-red-500">*</span>
            </label>
            <input type="text" placeholder="Enter Name" value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-[13px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder-gray-300 transition-all font-medium" />
          </div>

          {/* Annual Holiday Period */}
          <div className="mb-8">
            <p className="text-[11px] font-semibold text-gray-500 mb-4 uppercase tracking-wider">Annual Holiday Period</p>
            <div className="flex gap-6 w-full">
              {/* Start Month */}
              <div className="flex flex-col gap-2 flex-1 relative">
                <label className="text-[11px] text-gray-400 font-medium ml-1">Start Month</label>
                <div onClick={() => setOpenPicker(openPicker === "start" ? null : "start")}
                  className="relative flex items-center border border-gray-200 rounded-lg h-[40px] cursor-pointer hover:border-gray-300 transition-all">
                  <div className="flex-1 pl-4 text-[13px] font-medium text-slate-700">{formatMonthDisplay(startMonth) || "Select Month"}</div>
                  <div className="pr-3 text-gray-400"><CalendarFold size={14} /></div>
                </div>
                {openPicker === "start" && <MonthPicker value={startMonth} onChange={setStartMonth} onClose={() => setOpenPicker(null)} />}
              </div>
              {/* End Month */}
              <div className="flex flex-col gap-2 flex-1 relative">
                <label className="text-[11px] text-gray-400 font-medium ml-1">End Month</label>
                <div onClick={() => setOpenPicker(openPicker === "end" ? null : "end")}
                  className="relative flex items-center border border-gray-200 rounded-lg h-[40px] cursor-pointer hover:border-gray-300 transition-all">
                  <div className="flex-1 pl-4 text-[13px] font-medium text-slate-700">{formatMonthDisplay(endMonth) || "Select Month"}</div>
                  <div className="pr-3 text-gray-400"><CalendarFold size={14} /></div>
                </div>
                {openPicker === "end" && <MonthPicker value={endMonth} onChange={setEndMonth} onClose={() => setOpenPicker(null)} />}
              </div>
            </div>
          </div>

          {/* Holiday List */}
          <div className="mt-10">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-50/50">
              <p className="text-[14px] font-bold text-slate-800">List of Holiday</p>
              <button onClick={addHoliday}
                className="flex items-center gap-2 border border-slate-200 text-slate-700 px-4 py-1.5 rounded-lg text-[12px] font-semibold hover:bg-slate-50 transition-all shadow-sm">
                <Plus size={14} strokeWidth={2.5} /> Add Holiday
              </button>
            </div>
            <div className="flex flex-col gap-6">
              {holidayList.map((holiday, index) => (
                <div key={index} className="flex items-end gap-6">
                  <div className="flex gap-6 w-full">
                    <div className="flex flex-col gap-2 w-1/2">
                      <label className="text-[11px] text-gray-400 font-medium ml-1">Holiday Name</label>
                      <input type="text" placeholder="Enter Holiday Name" value={holiday.holidayName}
                        onChange={e => handleHolidayChange(index, "holidayName", e.target.value)}
                        className="border border-gray-200 rounded-lg h-[40px] px-4 text-[13px] font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder-gray-300 transition-all" />
                    </div>
                    <div className="flex flex-col gap-2 w-1/2 relative">
                      <label className="text-[11px] text-gray-400 font-medium ml-1">Holiday Date</label>
                      <div onClick={() => setOpenPicker(openPicker === `date-${index}` ? null : `date-${index}`)}
                        className="relative flex items-center border border-gray-200 rounded-lg h-[40px] cursor-pointer hover:border-gray-300 transition-all">
                        <div className="flex-1 pl-4 text-[13px] font-medium text-slate-800">{formatDateDisplay(holiday.holidayDate) || "Select Date"}</div>
                        <div className="pr-3 text-gray-400"><CalendarFold size={14} /></div>
                      </div>
                      {openPicker === `date-${index}` && (
                        <DatePicker value={holiday.holidayDate} onChange={val => handleHolidayChange(index, "holidayDate", val)} onClose={() => setOpenPicker(null)} />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 pb-1 ml-1">
                    <button type="button" className="p-2 text-[#4ade80] hover:bg-green-50 rounded-lg transition-colors"><Pencil size={17} /></button>
                    <button type="button" onClick={() => deleteHoliday(index)} className="p-2 text-[#f87171] hover:bg-red-50 rounded-lg transition-colors"><Trash size={17} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error Toast */}
      {saveError && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] bg-red-500 text-white text-[13px] font-semibold px-5 py-3 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-[420px] text-center">
          {saveError}
        </div>
      )}

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[30] bg-white border-t border-gray-100 px-8 py-4 flex items-center justify-between shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
        <span className="text-[14px] font-medium text-gray-500 ml-20">
          Holiday(s) Added: <span className="font-bold text-slate-800">{addedCount}</span>
        </span>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard/admin/hrms/others/holiday-policy")}
            className="px-8 py-2.5 bg-white border border-gray-300 text-slate-700 font-semibold rounded-lg text-sm hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!templateName.trim() || isSaving}
            className="flex items-center gap-2 bg-[#3e554d] text-white px-10 py-2.5 rounded-lg text-sm font-bold hover:bg-[#344641] transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed">
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HolidayPolicyFormView;
