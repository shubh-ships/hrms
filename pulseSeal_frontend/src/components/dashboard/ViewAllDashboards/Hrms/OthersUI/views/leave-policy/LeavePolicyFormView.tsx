"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash, CalendarFold, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import axiosClient from "@/lib/api/client";

type LeaveCategory = {
  name: string;
  count: string;
  rule: string;
  limit: string;
};

type DropdownOption = {
  label: string;
  description?: string;
  value: string;
};

// --- Custom Dropdown Modal ---
const CustomDropdown = ({
  options,
  value,
  onChange,
  className = "",
  dropdownWidth = "w-[300px]",
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
        className={`flex items-center justify-between border rounded-[6px] h-[40px] px-4 bg-white transition-all select-none ${disabled ? "bg-gray-50 opacity-60 cursor-not-allowed border-gray-100" :
            isOpen ? "border-[#3f5a54] ring-1 ring-[#3f5a54]/30 cursor-pointer" : "border-gray-200 hover:border-gray-300 cursor-pointer"
          }`}
      >
        <span className="text-[13px] text-[#202b36] font-medium">{selectedOption?.label || "Select"}</span>
        <div className="text-slate-400">
          {isOpen ? <ChevronUp size={18} strokeWidth={1.5} /> : <ChevronDown size={18} strokeWidth={1.5} />}
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
                className="flex items-start gap-3 p-3 rounded-[8px] hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="mt-1.5 flex-shrink-0 w-2 h-2 flex justify-center items-center">
                  {isActive && <div className="w-[8px] h-[8px] rounded-full bg-[#3f5a54]" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[13.5px] text-[#202b36] font-medium leading-tight">{option.label}</span>
                  {option.description && (
                    <span className="text-[12px] text-slate-500 mt-1 leading-snug">{option.description}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- Custom MonthPicker Modal ---
const MonthPicker = ({ value, onChange, onClose }: { value: string; onChange: (val: string) => void; onClose: () => void }) => {
  const [currentYear, setCurrentYear] = useState(value && value.includes('-') ? parseInt(value.split("-")[0]) : new Date().getFullYear());
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="absolute top-[44px] left-0 z-[100] mt-1 bg-white border border-gray-100 shadow-xl rounded-[10px] p-4 w-[280px] animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-4 px-1">
        <button onClick={(e) => { e.stopPropagation(); setCurrentYear(currentYear - 1); }} className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-slate-600">
          <ChevronLeft size={16} />
        </button>
        <span className="font-bold text-slate-800 text-[14px]">{currentYear}</span>
        <button onClick={(e) => { e.stopPropagation(); setCurrentYear(currentYear + 1); }} className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-slate-600">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {months.map((m, i) => {
          const monthVal = (i + 1).toString().padStart(2, "0");
          const fullVal = `${currentYear}-${monthVal}`;
          const isActive = value === fullVal;
          return (
            <button
              key={m}
              onClick={(e) => {
                e.stopPropagation();
                onChange(fullVal);
                onClose();
              }}
              className={`py-2 text-[13px] font-semibold rounded-[6px] transition-all cursor-pointer ${isActive ? "bg-[#3e554d] text-white shadow-sm" : "text-slate-600 hover:bg-gray-50 hover:text-slate-900"
                }`}
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- Data & Helpers ---
const monthsList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatYearlyDisplay = (val: string) => {
  if (!val || !val.includes("-")) return val;
  const [y, m] = val.split("-");
  return `${monthsList[parseInt(m) - 1]}, ${y}`;
};

const cycleOptions: DropdownOption[] = [
  { label: "Monthly", value: "Monthly" },
  { label: "Yearly", value: "Yearly" }
];

const unusedLeaveRuleOptions: DropdownOption[] = [
  { label: "Lapse", value: "Lapse", description: "Leaves will be cancelled after the cycle ends" },
  { label: "Carry Forward", value: "Carry Forward", description: "Leaves will be added to the next cycle" },
  { label: "Encash", value: "Encash", description: "Leaves can be encashed at the end of the cycle" }
];

// ── Mapping helpers ─────────────────────────────────────────────────────────

/** Frontend rule name → backend enum */
const ruleToApi = (rule: string): "LAPSE" | "CARRY" | "ENCASH" => {
  if (rule === "Carry Forward") return "CARRY";
  if (rule === "Encash") return "ENCASH";
  return "LAPSE";
};

/** Backend enum → frontend rule name */
const ruleFromApi = (apiRule: string): string => {
  if (apiRule === "CARRY") return "Carry Forward";
  if (apiRule === "ENCASH") return "Encash";
  return "Lapse";
};

/**
 * Build ISO date string for the 1st of a given "YYYY-MM" month string.
 * e.g. "2026-01" → "2026-01-01"
 */
const toStartDate = (ym: string): string => `${ym}-01`;

/**
 * Build end date string without using toISOString() (avoids UTC timezone shift in IST).
 * For YEARLY: end = start + 1 year - 1 day.
 * For MONTHLY: end = last day of start month.
 * Uses getDate() on a local Date only to know the last day of a month — safe because
 * we only read the day number, not convert to a string via UTC.
 */
const toEndDate = (startYm: string, cycleType: "YEARLY" | "MONTHLY"): string => {
  const [y, m] = startYm.split("-").map(Number);

  if (cycleType === "YEARLY") {
    // end = (start + 1 year) - 1 day = last day of month (m-1) in year (y+1)
    // Special case: m=1 (Jan) → last day of Dec in year y
    let endYear: number, endMonth: number;
    if (m === 1) {
      endYear = y;
      endMonth = 12;
    } else {
      endYear = y + 1;
      endMonth = m - 1;
    }
    const endDay = new Date(endYear, endMonth, 0).getDate(); // day-0 trick for last day
    return `${endYear}-${String(endMonth).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
  } else {
    // MONTHLY: last day of the same start month
    const endDay = new Date(y, m, 0).getDate();
    return `${y}-${String(m).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
  }
};

/** Convert a Date or ISO string to "YYYY-MM" */
const dateToYM = (dateStr: string): string => {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${y}-${m}`;
};

// ──────────────────────────────────────────────────────────────────────────────

const LeavePolicyFormView = () => {
  const router = useRouter();

  // Main State
  const [templateName, setTemplateName] = useState("Leave Policy");

  // Custom Logic States
  const [leavePolicyCycle, setLeavePolicyCycle] = useState("Yearly");
  const [leaveFrom, setLeaveFrom] = useState("2026-01");
  const [leaveTo, setLeaveTo] = useState("2026-12");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!saveError) return;
    const t = setTimeout(() => setSaveError(null), 5000);
    return () => clearTimeout(t);
  }, [saveError]);

  // Table Data State
  const [categories, setCategories] = useState<LeaveCategory[]>([
    { name: "Casual Leave", count: "", rule: "Lapse", limit: "" },
    { name: "Sick Leave", count: "", rule: "Carry Forward", limit: "" },
    { name: "Annual Leave", count: "", rule: "Encash", limit: "" },
  ]);

  // Handle Edit Hydration — fetch from API
  useEffect(() => {
    const editId = sessionStorage.getItem('editLeavePolicyId');
    if (!editId) return;

    setIsEditing(true);
    setEditingId(editId);

    const fetchTemplate = async () => {
      try {
        const res = await axiosClient.get(`/leave/templates/${editId}`);
        const t = res.data?.data;
        if (!t) return;

        setTemplateName(t.name || "Leave Policy");
        setLeavePolicyCycle(t.cycleType === "MONTHLY" ? "Monthly" : "Yearly");

        if (t.startDate) {
          const fromYM = dateToYM(t.startDate);
          setLeaveFrom(fromYM);
        }
        if (t.endDate) {
          const toYM = dateToYM(t.endDate);
          setLeaveTo(toYM);
        }

        if (t.leaveCategories?.length > 0) {
          setCategories(
            t.leaveCategories.map((c: any) => ({
              name: c.categoryName || "",
              count: String(c.leaveCount ?? ""),
              rule: ruleFromApi(c.unusedLeaveRuleType),
              limit: c.unusedLeaveCount != null ? String(c.unusedLeaveCount) : "",
            }))
          );
        }
      } catch (err: any) {
        console.error("Failed to fetch leave template:", err);
        setSaveError(err?.response?.data?.message || "Failed to load template for editing.");
      }
    };

    fetchTemplate();
  }, []);

  // Handle Monthly vs Yearly logic
  useEffect(() => {
    if (leavePolicyCycle === "Monthly") {
      const now = new Date();
      const y = now.getFullYear();
      const m = (now.getMonth() + 1).toString().padStart(2, "0");
      // Store as YYYY-MM so toStartDate/toEndDate work correctly for the API
      setLeaveFrom(`${y}-${m}`);
      setLeaveTo(`${y}-${m}`);
      setPickerOpen(false);
    } else {
      if (!leaveFrom.includes("-")) {
        setLeaveFrom("2026-01");
        setLeaveTo("2026-12");
      }
    }
  }, [leavePolicyCycle]);

  // Handle 1 year minus 1 month layout for UI selection
  const handleYearlyMonthSelect = (selectedMonth: string) => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const d = new Date(parseInt(yearStr), parseInt(monthStr) - 1);
    d.setFullYear(d.getFullYear() + 1);
    d.setMonth(d.getMonth() - 1);
    const endYear = d.getFullYear();
    const endMonth = (d.getMonth() + 1).toString().padStart(2, '0');
    setLeaveFrom(selectedMonth);
    setLeaveTo(`${endYear}-${endMonth}`);
  };

  const addCategory = () => {
    setCategories([...categories, { name: "", count: "", rule: "Lapse", limit: "" }]);
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (index: number, field: keyof LeaveCategory, value: string) => {
    setCategories(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // When rule switches to Lapse, clear the limit — backend expects null for unusedLeaveCount
      if (field === "rule" && value === "Lapse") {
        updated[index].limit = "";
      }
      return updated;
    });
  };

  const totalLeaves = categories.reduce((sum, cat) => {
    const val = parseInt(cat.count);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const handleSave = async () => {
    if (!templateName.trim()) return;

    const cycleType: "YEARLY" | "MONTHLY" = leavePolicyCycle === "Monthly" ? "MONTHLY" : "YEARLY";

    // --- Frontend validation for categories ---
    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      const label = cat.name || `Category ${i + 1}`;
      if (!cat.name.trim()) { setSaveError(`Category ${i + 1}: name is required.`); return; }
      const count = parseInt(cat.count);
      if (isNaN(count) || count <= 0) { setSaveError(`"${label}": Leave Count must be a number greater than 0.`); return; }
      if (cat.rule !== "Lapse") {
        const limit = parseInt(cat.limit);
        if (isNaN(limit) || limit <= 0) { setSaveError(`"${label}": Limit is required for ${cat.rule}.`); return; }
      }
    }

    // Build backend-compatible leaveCategories
    const leaveCategories = categories.map(cat => {
      const rule = ruleToApi(cat.rule);
      return {
        categoryName: cat.name,
        leaveCount: parseInt(cat.count) || 0,
        unusedLeaveRuleType: rule,
        unusedLeaveCount: rule === "LAPSE" ? null : (parseInt(cat.limit) || null),
        type: "LEAVE",
      };
    });

    const payload = {
      name: templateName.trim(),
      cycleType,
      startDate: leaveFrom.includes("-") ? toStartDate(leaveFrom) : toStartDate("2026-01"),
      endDate: leaveFrom.includes("-")
        ? toEndDate(leaveFrom, cycleType)
        : toEndDate("2026-01", cycleType),
      leaveCategories,
    };

    setIsSaving(true);
    setSaveError(null);
    try {
      if (isEditing && editingId) {
        await axiosClient.put(`/leave/templates/${editingId}`, payload);
        sessionStorage.removeItem('editLeavePolicyId');
      } else {
        await axiosClient.post("/leave/templates", payload);
      }
      router.push("/dashboard/admin/hrms/others/leave-policy");
    } catch (err: any) {
      console.error("Failed to save leave template:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save template. Please try again.";
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col px-4 py-8 pb-32">
      <h2 className="text-[20px] font-extrabold text-[#202b36] mb-8 font-sans tracking-tight">
        {isEditing ? "Edit Leave Template" : "Create Leave Template"}
      </h2>

      {/* Main Container */}
      <div className="bg-white rounded-[10px] border border-gray-200 p-8 ">

        {/* Template Settings Section */}
        <h3 className="text-[17px] font-bold text-[#202b36] mb-8 font-sans">Template Settings</h3>

        {/* Template Name */}
        <div className="mb-8 relative z-10">
          <label className="block text-[11px] font-medium text-slate-500 mb-2 font-sans">
            Template Name
          </label>
          <input
            type="text"
            placeholder="Template Name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full max-w-[550px] border border-gray-200 rounded-[6px] h-[40px] px-4 text-[13px] text-[#202b36] focus:outline-none focus:border-gray-300 placeholder-slate-400 font-medium transition-all"
          />
        </div>

        {/* Dynamic Selectors: Leave Policy Cycle & Leave Period Container */}
        <div className="grid grid-cols-2 gap-8 mb-12 w-full max-w-[650px] relative z-20" style={{ zIndex: 30 }}>

          {/* Leave Policy Cycle */}
          <div className="flex flex-col gap-2 relative">
            <label className="text-[11px] text-slate-500 font-medium">Leave Policy Cycle</label>
            <CustomDropdown
              options={cycleOptions}
              value={leavePolicyCycle}
              onChange={(val) => setLeavePolicyCycle(val)}
              className="w-full"
              dropdownWidth="w-full"
              disabled={isEditing}
            />
          </div>

          {/* Leave Period */}
          {leavePolicyCycle === "Yearly" && (
            <div className="flex flex-col gap-2 relative">
              <label className="text-[11px] text-slate-500 font-medium">Leave Period</label>

              <div
                onClick={() => !isEditing && setPickerOpen(!pickerOpen)}
                className={`relative flex items-center border border-gray-200 rounded-[6px] h-[40px] transition-all select-none ${isEditing ? "bg-gray-50 opacity-60 cursor-not-allowed border-gray-100" :
                    "bg-white hover:border-gray-300 cursor-pointer focus-within:ring-1 focus-within:ring-[#3f5a54]/30 focus-within:border-[#3f5a54]"
                  }`}
              >
                <div className="flex-1 h-full pl-4 pr-10 text-[13px] text-[#202b36] bg-transparent focus:outline-none font-medium flex items-center select-none truncate">
                  {leaveFrom && leaveFrom.includes("-") ? `${formatYearlyDisplay(leaveFrom)} - ${formatYearlyDisplay(leaveTo)}` : "Select Month"}
                </div>
                <div className="absolute right-3 pointer-events-none text-slate-400">
                  <CalendarFold size={16} strokeWidth={1.5} />
                </div>
              </div>

              {pickerOpen && (
                <MonthPicker
                  value={leaveFrom}
                  onChange={handleYearlyMonthSelect}
                  onClose={() => setPickerOpen(false)}
                />
              )}
            </div>
          )}

        </div>

        {/* Leave Categories Container */}
        <div className="border border-gray-200 rounded-[10px] bg-white relative z-10">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-white rounded-t-[10px]">
            <h3 className="text-[16px] font-bold text-[#202b36]">Leave Categories</h3>
            <button
              onClick={addCategory}
              className="flex items-center gap-1.5 bg-[#f1f5f9] text-[#334155] px-3.5 py-1.5 rounded-[6px] text-[13px] font-semibold hover:bg-[#e2e8f0] transition-colors"
            >
              <Plus size={16} strokeWidth={2.5} className="text-[#334155]" />
              Add Leave Categories
            </button>
          </div>

          <div className="px-6 border-t border-gray-100"></div>

          {/* Table Content */}
          <div className="px-6 pt-5 pb-10 bg-[#F8F9FD] rounded-b-[10px]">

            {/* Headers */}
            <div className="grid grid-cols-[1.5fr_1.5fr_1.5fr_1.5fr_40px] gap-6 mb-4 px-1 pb-4 border-b border-gray-100">
              <div className="text-[11.5px] font-normal text-slate-500 tracking-wide">Leave Category Name</div>
              <div className="text-[11.5px] font-normal text-slate-500 tracking-wide">Leave Count</div>
              <div className="text-[11.5px] font-normal text-slate-500 tracking-wide">Unused Leave Rule</div>
              <div className="text-[11.5px] font-normal text-slate-500 tracking-wide">Encashment/Carry Forward Limit</div>
              <div></div>
            </div>

            {/* Rows */}
            <div className="flex flex-col gap-6">
              {categories.map((category, index) => (
                <div key={index} className="grid grid-cols-[1.5fr_1.5fr_1.5fr_1.5fr_40px] gap-6 items-center relative" style={{ zIndex: categories.length - index }}>

                  {/* Category Name */}
                  <input
                    type="text"
                    placeholder="Leave Category Name"
                    value={category.name}
                    onChange={(e) => handleCategoryChange(index, "name", e.target.value)}
                    className="w-full border border-gray-200 rounded-[6px] h-[40px] px-4 text-[13px] text-[#202b36] focus:outline-none focus:border-gray-300 placeholder-slate-300 font-medium transition-all bg-white"
                  />

                  {/* Leave Count */}
                  <input
                    type="text"
                    placeholder="Leave Count"
                    value={category.count}
                    onChange={(e) => handleCategoryChange(index, "count", e.target.value)}
                    className=" bg-white w-full border border-gray-200 rounded-[6px] h-[40px] px-4 text-[13px] text-[#202b36] focus:outline-none focus:border-gray-300 placeholder-slate-300 font-medium transition-all"
                  />

                  {/* Unused Leave Rule */}
                  <div className="w-full relative">
                    <CustomDropdown
                      options={unusedLeaveRuleOptions}
                      value={category.rule}
                      onChange={(val) => handleCategoryChange(index, "rule", val)}
                      className="w-full"
                      dropdownWidth="w-[300px]"
                    />
                  </div>

                  {/* Encashment Limit — disabled when Lapse */}
                  {(() => {
                    const isLapse = category.rule === "Lapse";
                    return (
                      <div className={`relative flex items-center border rounded-[6px] h-[40px] transition-all w-full ${
                        isLapse
                          ? "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed"
                          : "border-gray-200 bg-[#fafafa] focus-within:bg-white focus-within:border-gray-300"
                      }`}>
                        <input
                          type="text"
                          placeholder={isLapse ? "Not applicable" : "Encashment/Carry"}
                          value={category.limit}
                          disabled={isLapse}
                          onChange={(e) => handleCategoryChange(index, "limit", e.target.value)}
                          className="w-full h-full pl-4 pr-12 text-[13px] font-medium text-[#202b36] bg-transparent focus:outline-none placeholder-slate-300 rounded-[6px] disabled:cursor-not-allowed"
                        />
                        {!isLapse && (
                          <div className="absolute right-4 text-[12px] font-medium text-slate-600 pointer-events-none bg-inherit pb-[1px]">
                            Days
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Delete Button */}
                  <div className="flex justify-center items-center">
                    <button
                      type="button"
                      onClick={() => removeCategory(index)}
                      className="p-1 px-[2px] text-red-400 hover:text-red-500 rounded-[4px] transition-colors"
                      disabled={categories.length <= 1}
                    >
                      <Trash size={18} strokeWidth={1.5} />
                    </button>
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

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[10] bg-white border-t border-gray-100 px-8 py-4 flex items-center justify-between shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
        <span className="text-[14px] font-medium text-[#4b5563] ml-20">
          Total Leaves: {totalLeaves}
        </span>
        <button
          onClick={handleSave}
          disabled={!templateName.trim() || isSaving}
          className="bg-[#3e554d] text-white px-8 py-2.5 rounded-[6px] text-[14px] font-medium hover:bg-[#32453e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mr-8"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>

    </div>
  );
};

export default LeavePolicyFormView;
