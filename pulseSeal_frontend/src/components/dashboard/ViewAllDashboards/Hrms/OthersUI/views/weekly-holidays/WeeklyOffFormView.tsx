"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import axiosClient from "@/lib/api/client";

// --- Types ---
type WeekNumber = 1 | 2 | 3 | 4 | 5;

const daysOfWeek = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

// --- Conversion helpers ---
/** Frontend config → backend rules */
const configToRules = (config: Record<string, WeekNumber[]>) =>
  Object.entries(config)
    .filter(([, weeks]) => weeks.length > 0)
    .map(([dayName, weeks]) => ({
      day: daysOfWeek.indexOf(dayName),
      weekOffs: weeks.map((w) => ({ weekNumber: w, type: "FULL_DAY" })),
    }));

/** Backend rules → frontend config */
const rulesToConfig = (rules: any[]): Record<string, WeekNumber[]> => {
  const cfg: Record<string, WeekNumber[]> = {};
  daysOfWeek.forEach((d) => { cfg[d] = []; });
  (rules || []).forEach((rule) => {
    const dayName = daysOfWeek[rule.day];
    if (dayName) cfg[dayName] = (rule.weekOffs || []).map((w: any) => w.weekNumber as WeekNumber);
  });
  return cfg;
};

const initConfig = (): Record<string, WeekNumber[]> => {
  const initial: Record<string, WeekNumber[]> = {};
  daysOfWeek.forEach((day) => { initial[day] = day === "Sunday" ? [1, 2, 3, 4, 5] : []; });
  return initial;
};

const WeeklyOffFormView = () => {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [config, setConfig] = useState<Record<string, WeekNumber[]>>(initConfig);
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
        const res = await axiosClient.get(`/weekly-off/templates/${id}`);
        const t = res.data?.data;
        if (!t) return;
        setTemplateName(t.name || "");
        if (t.rules) setConfig(rulesToConfig(t.rules));
      } catch (err: any) {
        setSaveError(err?.response?.data?.message || "Failed to load template.");
      }
    };
    load();
  }, []);

  const toggleWeek = (day: string, week: WeekNumber) => {
    setConfig((prev) => {
      const cur = prev[day];
      return {
        ...prev,
        [day]: cur.includes(week) ? cur.filter((w) => w !== week) : [...cur, week].sort() as WeekNumber[],
      };
    });
  };

  const toggleSelectAll = (day: string) => {
    setConfig((prev) => ({
      ...prev,
      [day]: prev[day].length === 5 ? [] : ([1, 2, 3, 4, 5] as WeekNumber[]),
    }));
  };

  const handleSave = async () => {
    if (!templateName.trim()) return;
    const payload = { name: templateName.trim(), rules: configToRules(config) };

    setIsSaving(true);
    setSaveError(null);
    try {
      if (editingId) {
        await axiosClient.put(`/weekly-off/templates/${editingId}`, payload);
        sessionStorage.removeItem("editWeeklyOffId");
      } else {
        await axiosClient.post("/weekly-off/templates", payload);
      }
      router.push("/dashboard/admin/hrms/others/weekly-holidays");
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || err?.message || "Failed to save template.");
    } finally {
      setIsSaving(false);
    }
  };

  const isSaveDisabled = !templateName.trim() || isSaving;

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <div className="p-4 md:p-6 lg:padding-x-8 max-w-[1400px] w-full mx-auto">
        {/* Top Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] p-6 mb-6">
          <h2 className="text-[17px] font-bold text-slate-800 mb-6">Weekly Off Configuration</h2>
          <div className="max-w-[1000px]">
            <label className="block text-[12px] font-medium text-slate-600 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input type="text" placeholder="Provide a Template Name" value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-[13px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder-gray-300 transition-all font-medium" />
          </div>
        </div>

        <div className="mb-4 ml-1">
          <p className="text-[12px] text-gray-500 font-medium">Select day and frequency for weekly off</p>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {daysOfWeek.map((day) => {
            const selectedWeeks = config[day];
            const isAllSelected = selectedWeeks.length === 5;
            return (
              <div key={day} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-[0_2px_6px_-2px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#f8f9fa]">
                  <h3 className="text-[14px] font-bold text-slate-800">{day}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 font-medium cursor-pointer" onClick={() => toggleSelectAll(day)}>Select All</span>
                    <input type="checkbox" checked={isAllSelected} onChange={() => toggleSelectAll(day)}
                      className="w-[14px] h-[14px] rounded-[3px] border-gray-300 accent-[#3f5a54] cursor-pointer" />
                  </div>
                </div>
                <div className="px-4 py-5 flex items-center justify-between gap-2.5">
                  {([1, 2, 3, 4, 5] as WeekNumber[]).map((weekNum) => {
                    const isSelected = selectedWeeks.includes(weekNum);
                    return (
                      <button key={weekNum} onClick={() => toggleWeek(day, weekNum)}
                        className={`flex-1 py-1.5 rounded-[6px] text-[10px] font-semibold transition-all border ${isSelected ? "border-[#3f5a54] bg-[#f5f8f7] text-[#3f5a54]" : "border-gray-200 bg-white text-gray-400 hover:bg-gray-50/80 hover:text-gray-500"}`}>
                        {`${weekNum}${weekNum === 1 ? "st" : weekNum === 2 ? "nd" : weekNum === 3 ? "rd" : "th"} Week`}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
          <button onClick={handleSave} disabled={isSaveDisabled}
            className={`flex items-center gap-2 px-10 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${isSaveDisabled ? "bg-[#f1f5f9] text-gray-400 cursor-not-allowed border border-gray-100" : "bg-[#3e554d] text-white hover:bg-[#344641] border border-[#344641]"}`}>
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeeklyOffFormView;
