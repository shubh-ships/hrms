"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

export default function CustomDropdown({ value, placeholder, options, onChange, disabled, triggerClassName }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref]);

  const selectedOption = options?.find((opt: any) => opt.value === value);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between focus:outline-none ${triggerClassName || "bg-white border border-gray-200 rounded-lg h-9 px-3 focus:border-[#3f5a54]"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className={`truncate pr-2 ${selectedOption ? "text-slate-800" : "text-gray-400"} ${triggerClassName ? "" : "text-[14px] font-semibold"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`shrink-0 ${triggerClassName ? "" : "w-4 h-4 text-gray-400"}`} size={triggerClassName ? 16 : undefined} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 z-50 mt-1 min-w-full w-max bg-white border border-gray-100 rounded-lg shadow-xl overflow-y-auto py-1 max-h-[250px]">
          {options && options.length > 0 ? options.map((opt: any) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className="w-full flex items-center justify-start py-2 px-3 hover:bg-gray-50 text-left relative"
            >
              <div className="flex items-center gap-2 w-full">
                {value === opt.value ? (
                  <div className="w-1.5 h-1.5 bg-[#3f5a54] rounded-full shrink-0" />
                ) : (
                  <div className="w-1.5 h-1.5 shrink-0" />
                )}
                <span className={`text-[13px] whitespace-nowrap ${value === opt.value ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
                  {opt.label}
                </span>
              </div>
            </button>
          )) : (
            <div className="text-[14px] text-gray-500 px-3 py-2">No options available</div>
          )}
        </div>
      )}
    </div>
  );
}
