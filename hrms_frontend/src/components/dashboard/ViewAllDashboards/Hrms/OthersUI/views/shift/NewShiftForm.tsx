"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, Minus, ChevronDown, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import axiosClient from "@/lib/api/client";

// ─── Edit-mode helper: minutes → { hours, minutes } strings ──────────────────
const minsToHM = (total: number) => ({
  h: String(Math.floor(total / 60)).padStart(2, "0"),
  m: String(total % 60).padStart(2, "0"),
});

// ─── Types ────────────────────────────────────────────────────────────────────

type ShiftType = "Fixed Shift" | "Open Shift" | "Flexible Shift";

interface BreakRow {
  id: string;
  startTime: string;
  endTime: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const genId = () => Math.random().toString(36).slice(2);

const SHIFT_TYPES: ShiftType[] = ["Fixed Shift", "Open Shift"];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

// ─── Custom Dropdown ──────────────────────────────────────────────────────────

const Dropdown = ({
  value,
  options,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg h-11 px-3 focus:outline-none focus:border-[#3f5a54] ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className={`text-[15px] truncate pr-2 ${value ? "text-slate-800" : "text-gray-400"}`}>
          {value || placeholder || "Select"}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-xl overflow-y-auto py-1 max-h-[250px]">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className="w-full flex items-center justify-start py-2 px-3 hover:bg-gray-50 text-left relative"
            >
              <div className="flex items-center gap-2 w-full">
                {value === opt ? (
                  <div className="w-1.5 h-1.5 bg-[#3f5a54] rounded-full shrink-0" />
                ) : (
                  <div className="w-1.5 h-1.5 shrink-0" />
                )}
                <span className={`text-[14px] truncate ${value === opt ? "text-slate-800 font-medium" : "text-slate-600"}`}>
                  {opt}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Work Hours Dropdown ──────────────────────────────────────────────────────

const WorkHoursDropdown = ({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative w-full max-w-[70px]" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg h-11 px-2.5 focus:outline-none focus:border-[#3f5a54] transition-colors"
      >
        <span className={`text-[15px] truncate pr-1 ${value ? "text-slate-800" : "text-gray-400"}`}>
          {value || "00"}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-[80px] bg-white border border-gray-100 rounded-lg shadow-xl py-1 max-h-[200px] overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className="w-full flex items-center justify-start py-2 px-3 hover:bg-gray-50 text-left relative"
            >
              <div className="flex items-center gap-2 w-full">
                {value === opt ? (
                  <div className="w-1.5 h-1.5 bg-[#3f5a54] rounded-full shrink-0" />
                ) : (
                  <div className="w-1.5 h-1.5 shrink-0" />
                )}
                <span className={`text-[14px] truncate ${value === opt ? "text-slate-800 font-medium" : "text-slate-600"}`}>
                  {opt}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Time Input ───────────────────────────────────────────────────────────────

const TimeInput = ({
  label,
  required,
  value,
  onChange,
  disabled,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) => (
  <div className="flex-1 flex flex-col gap-1">
    <label className="text-[11px] text-gray-500 font-medium">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <input
        type="time"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border border-gray-200 rounded-lg h-10 px-3 pr-9 text-[13px] text-slate-800 focus:outline-none focus:border-gray-300 transition-colors bg-white [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-1 [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:z-10 ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 pointer-events-none z-20' : ''}`}
        style={{ colorScheme: 'light' }}
      />
      <Clock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-0" />
    </div>
  </div>
);

// ─── Break Row ────────────────────────────────────────────────────────────────

const BreakRowItem = ({
  row,
  onRemove,
  onChange,
}: {
  row: BreakRow;
  onRemove: () => void;
  onChange: (field: "startTime" | "endTime", value: string) => void;
}) => (
  <div className="flex items-end gap-3 mb-3">
    <TimeInput
      label="Start Time"
      required
      value={row.startTime}
      onChange={(v) => onChange("startTime", v)}
    />
    <TimeInput
      label="End Time"
      required
      value={row.endTime}
      onChange={(v) => onChange("endTime", v)}
    />
    <button
      type="button"
      onClick={onRemove}
      className="mb-0.5 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0 hover:bg-red-600 transition-colors"
    >
      <Minus size={16} className="text-white" strokeWidth={3} />
    </button>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const NewShiftForm = () => {
  const router = useRouter();

  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  // ── Edit mode: ID is set when sessionStorage has "editShiftTemplateId" ─────
  const [editId, setEditId] = useState<string | null>(null);

  // Auto-dismiss error toast
  useEffect(() => {
    if (!saveError) return;
    const t = setTimeout(() => setSaveError(null), 5000);
    return () => clearTimeout(t);
  }, [saveError]);

  const [shiftType, setShiftType] = useState<ShiftType>("Fixed Shift");
  const [name, setName] = useState("");
  const [shiftCode, setShiftCode] = useState("");

  // Fixed Shift fields
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Open Shift → Work Hours
  const [workHours, setWorkHours] = useState("00");
  const [workMinutes, setWorkMinutes] = useState("00");

  // Open Shift → Additional Fields
  const [minFullDayHours, setMinFullDayHours] = useState("00");
  const [minFullDayMinutes, setMinFullDayMinutes] = useState("00");

  const [minHalfDayHours, setMinHalfDayHours] = useState("00");
  const [minHalfDayMinutes, setMinHalfDayMinutes] = useState("00");

  const [breakDurationHours, setBreakDurationHours] = useState("00");
  const [breakDurationMinutes, setBreakDurationMinutes] = useState("00");

  // Breaks
  const [breaks, setBreaks] = useState<BreakRow[]>([]);

  // ── On mount: detect edit mode → fetch template → pre-populate fields ──────
  useEffect(() => {
    const storedId = sessionStorage.getItem("editShiftTemplateId");
    if (!storedId) return; // create mode — nothing to do

    setEditId(storedId);
    setIsLoadingTemplate(true);

    axiosClient
      .get(`/shift-template/${storedId}`)
      .then((res) => {
        const t = res.data?.data;
        if (!t) return;

        // Common fields
        setName(t.name || "");
        setShiftCode(t.shiftCode || "");

        if (t.shiftType === "OPEN_SHIFT") {
          setShiftType("Open Shift");

          // totalWorkingMinutes → workHours / workMinutes dropdowns
          if (t.totalWorkingMinutes != null) {
            const wk = minsToHM(t.totalWorkingMinutes);
            setWorkHours(wk.h);
            setWorkMinutes(wk.m);
          }
          // minFullDayMinutes
          if (t.minFullDayMinutes != null) {
            const fd = minsToHM(t.minFullDayMinutes);
            setMinFullDayHours(fd.h);
            setMinFullDayMinutes(fd.m);
          }
          // minHalfDayMinutes
          if (t.minHalfDayMinutes != null) {
            const hd = minsToHM(t.minHalfDayMinutes);
            setMinHalfDayHours(hd.h);
            setMinHalfDayMinutes(hd.m);
          }
          // breakDuration
          if (t.breakDuration != null) {
            const bd = minsToHM(t.breakDuration);
            setBreakDurationHours(bd.h);
            setBreakDurationMinutes(bd.m);
          }
        } else {
          // FIXED_SHIFT
          setShiftType("Fixed Shift");
          setStartTime(t.startTime || "");
          setEndTime(t.endTime || "");
          if (Array.isArray(t.breaks)) {
            setBreaks(
              t.breaks.map((b: { startTime: string; endTime: string }) => ({
                id: genId(),
                startTime: b.startTime,
                endTime: b.endTime,
              }))
            );
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load template for editing:", err);
        setSaveError("Failed to load template data. Please try again.");
      })
      .finally(() => setIsLoadingTemplate(false));
  }, []); // runs once on mount only

  const addBreak = () => {
    setBreaks((prev) => [...prev, { id: genId(), startTime: "", endTime: "" }]);
  };

  const removeBreak = (id: string) => {
    setBreaks((prev) => prev.filter((b) => b.id !== id));
  };

  const updateBreak = (id: string, field: "startTime" | "endTime", value: string) => {
    setBreaks((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  const clearAllBreaks = () => setBreaks([]);

  const isOpenShift = shiftType === "Open Shift";

  // ── Build the payload — same shape for POST and PUT ───────────────────────
  const buildPayload = (): Record<string, any> => {
    const mTotal = parseInt(workHours || "0") * 60 + parseInt(workMinutes || "0");
    const mFullDay = parseInt(minFullDayHours || "0") * 60 + parseInt(minFullDayMinutes || "0");
    const mHalfDay = parseInt(minHalfDayHours || "0") * 60 + parseInt(minHalfDayMinutes || "0");
    const mBreak = parseInt(breakDurationHours || "0") * 60 + parseInt(breakDurationMinutes || "0");

    return {
      name: name || shiftType,
      shiftCode: shiftCode.trim().toUpperCase(),
      shiftType: isOpenShift ? "OPEN_SHIFT" : "FIXED_SHIFT",
      // Fixed Shift only
      startTime: isOpenShift ? undefined : startTime,
      endTime: isOpenShift ? undefined : endTime,
      breaks: isOpenShift
        ? undefined
        : breaks.map((b) => ({ startTime: b.startTime, endTime: b.endTime })),
      // Open Shift only
      totalWorkingMinutes: isOpenShift ? mTotal : undefined,
      minFullDayMinutes: isOpenShift ? mFullDay : undefined,
      minHalfDayMinutes: isOpenShift ? mHalfDay : undefined,
      breakDuration: isOpenShift ? mBreak : undefined,
      isActive: true,
    };
  };

  const handleSave = async () => {
    const payload = buildPayload();

    // Frontend validation (Open Shift only)
    if (isOpenShift) {
      const tw = payload.totalWorkingMinutes ?? 0;
      const fd = payload.minFullDayMinutes ?? 0;
      const hd = payload.minHalfDayMinutes ?? 0;
      if (tw <= 0) { setSaveError("Total working hours must be greater than 0."); return; }
      if (fd <= 0) { setSaveError("Minimum full day hours must be greater than 0."); return; }
      if (hd <= 0) { setSaveError("Minimum half day hours must be greater than 0."); return; }
      if (fd <= hd) { setSaveError("Minimum full day must be greater than minimum half day."); return; }
      if (tw < fd) { setSaveError("Total working hours must be ≥ minimum full day hours."); return; }
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      if (editId) {
        // ── EDIT MODE: PUT /shift-template/:editId ─────────────────────────
        await axiosClient.put(`/shift-template/${editId}`, payload);
        sessionStorage.removeItem("editShiftTemplateId"); // clean up after update
      } else {
        // ── CREATE MODE: POST /shift-template ─────────────────────────────
        await axiosClient.post("/shift-template", payload);
      }
      router.push("/dashboard/admin/hrms/others/shift");
    } catch (err: any) {
      console.error("Failed to save template:", err);
      setSaveError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save template. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const isSaveEnabled =
    name.trim() !== "" &&
    shiftCode.trim() !== "" &&
    !isSaving &&
    !isLoadingTemplate &&
    (isOpenShift || (startTime !== "" && endTime !== ""));

  return (
    <div className="flex flex-col h-full bg-[#f4f6f9] pb-32">
      {/* ── Form Card ─────────────────────────────────────────────── */}
      <div className="flex-1 p-0">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 relative">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">
              {editId ? "Edit Shift Configuration" : "Shift Configuration"}
            </h2>
            <p className="text-[12px] text-gray-400 mt-0.5 font-medium">
              {editId
                ? "Update the fields below. Shift type cannot be changed after creation."
                : "Configure your shift here. Set names, start and end times, buffer minutes and more."}
            </p>
          </div>

          {/* Loading skeleton while fetching template in edit mode */}
          {isLoadingTemplate && (
            <div className="absolute inset-0 bg-white/70 rounded-2xl z-10 flex items-center justify-center">
              <p className="text-[13px] text-gray-400 font-medium animate-pulse">Loading template…</p>
            </div>
          )}

          {/* Row 1: Shift Type | Name | Shift Code */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-500 font-medium">
                Shift Type <span className="text-red-500">*</span>
              </label>
              <Dropdown
                value={shiftType}
                options={SHIFT_TYPES}
                onChange={(v) => setShiftType(v as ShiftType)}
                disabled={!!editId}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-500 font-medium">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-gray-200 rounded-lg h-10 px-3 text-[13px] text-slate-800 placeholder-gray-300 focus:outline-none focus:border-gray-300 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-500 font-medium">Shift Code</label>
              <input
                type="text"
                placeholder="Enter Shift Code"
                value={shiftCode}
                onChange={(e) => setShiftCode(e.target.value)}
                className="border border-gray-200 rounded-lg h-10 px-3 text-[13px] text-slate-800 placeholder-gray-300 focus:outline-none focus:border-gray-300 transition-colors"
              />
            </div>
          </div>

          {/* Conditional: Open Shift → Work Hours, Minimum full day minutes, Minimum half day mintues, Break duration */}
          {isOpenShift && (
            <div className="grid grid-cols-4 gap-4 mb-5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-500 font-medium block truncate">
                  Work Hours
                </label>
                <div className="flex items-center gap-1.5">
                  <WorkHoursDropdown value={workHours} options={HOURS} onChange={setWorkHours} />
                  <span className="text-[12px] text-gray-400 font-medium">:</span>
                  <WorkHoursDropdown value={workMinutes} options={MINUTES} onChange={setWorkMinutes} />
                  <span className="text-[11px] text-gray-400 font-medium ml-0.5 whitespace-nowrap">hh:mm</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-500 font-medium block truncate">
                  Minimum full day minutes
                </label>
                <div className="flex items-center gap-1.5">
                  <WorkHoursDropdown value={minFullDayHours} options={HOURS} onChange={setMinFullDayHours} />
                  <span className="text-[12px] text-gray-400 font-medium">:</span>
                  <WorkHoursDropdown value={minFullDayMinutes} options={MINUTES} onChange={setMinFullDayMinutes} />
                  <span className="text-[11px] text-gray-400 font-medium ml-0.5 whitespace-nowrap">hh:mm</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-500 font-medium block truncate">
                  Minimum half day mintues
                </label>
                <div className="flex items-center gap-1.5">
                  <WorkHoursDropdown value={minHalfDayHours} options={HOURS} onChange={setMinHalfDayHours} />
                  <span className="text-[12px] text-gray-400 font-medium">:</span>
                  <WorkHoursDropdown value={minHalfDayMinutes} options={MINUTES} onChange={setMinHalfDayMinutes} />
                  <span className="text-[11px] text-gray-400 font-medium ml-0.5 whitespace-nowrap">hh:mm</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-500 font-medium block truncate">
                  Break duration
                </label>
                <div className="flex items-center gap-1.5">
                  <WorkHoursDropdown value={breakDurationHours} options={HOURS} onChange={setBreakDurationHours} />
                  <span className="text-[12px] text-gray-400 font-medium">:</span>
                  <WorkHoursDropdown value={breakDurationMinutes} options={MINUTES} onChange={setBreakDurationMinutes} />
                  <span className="text-[11px] text-gray-400 font-medium ml-0.5 whitespace-nowrap">hh:mm</span>
                </div>
              </div>
            </div>
          )}

          {/* Conditional: Fixed / Flexible Shift → Shift Time */}
          {!isOpenShift && (
            <div className="mb-6">
              <h3 className="text-[14px] font-bold text-slate-800 mb-3">Shift Time</h3>
              <div className="flex items-end gap-4 max-w-[620px]">
                <TimeInput
                  label="Start Time"
                  required
                  value={startTime}
                  onChange={setStartTime}
                  disabled={!!editId}
                />
                <TimeInput
                  label="End Time"
                  required
                  value={endTime}
                  onChange={setEndTime}
                  disabled={!!editId}
                />
              </div>
            </div>
          )}

          {/* Break Section — appears when breaks are added */}
          {!isOpenShift && breaks.length > 0 && (
            <div className="border border-gray-100 bg-white shadow-[0_1px_5px_rgba(0,0,0,0.02)] rounded-xl p-5 mb-5 mt-6 relative">
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <h3 className="text-[14px] font-bold text-slate-800">Break</h3>
                <button
                  type="button"
                  onClick={clearAllBreaks}
                  className="text-[12px] text-red-500 font-semibold hover:text-red-600 transition-colors"
                >
                  Clear All
                </button>
              </div>
              {breaks.map((row) => (
                <BreakRowItem
                  key={row.id}
                  row={row}
                  onRemove={() => removeBreak(row.id)}
                  onChange={(field, value) => updateBreak(row.id, field, value)}
                />
              ))}
            </div>
          )}

          {/* Add Break? row */}
          {!isOpenShift && (
            <div className="flex items-center justify-between pt-4 pb-2 border-t border-gray-100 mt-6">
              <span className="text-[15px] font-bold text-slate-800">Add Break?</span>
              <button
                type="button"
                onClick={addBreak}
                className="flex items-center gap-2 bg-[#3e554d] text-white px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-[#344641] transition-all shadow-sm"
              >
                <Plus size={16} strokeWidth={2.5} />
                Add Break
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Error Toast ─────────────────────────────────────────────── */}
      {saveError && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] bg-red-500 text-white text-[13px] font-semibold px-5 py-3 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-[420px] text-center">
          {saveError}
        </div>
      )}

      {/* ── Sticky Footer ──────────────────────────────────────────── */}
      <div className="w-full fixed bottom-0 right-0 bg-[#f4f6f9] border-t border-gray-200 px-8 py-4 flex justify-end z-[30]">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isSaveEnabled}
          className={`px-8 py-2.5 rounded-lg text-[14px] font-bold transition-all shadow-sm ${isSaveEnabled
            ? "bg-[#3e554d] text-white hover:bg-[#344641] cursor-pointer"
            : "bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed"
            }`}
        >
          {isLoadingTemplate
            ? "Loading…"
            : isSaving
              ? editId ? "Updating…" : "Saving…"
              : editId ? "Update" : "Save"}
        </button>
      </div>
    </div>
  );
};

export default NewShiftForm;
