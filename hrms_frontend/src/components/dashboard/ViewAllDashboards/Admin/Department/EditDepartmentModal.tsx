"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { X, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch } from "@/store/hooks";
import { updateDepartment } from "@/features/departments/departmentSlice";
import type {
  Department,
  UpdateDepartmentRequest,
} from "@/lib/types/api/department";

interface EditDepartmentModalProps {
  department: Department;
  onClose: () => void;
  loading: boolean;
}

const CATEGORY_OPTIONS = [
  { label: "Business", value: "Business" },
  { label: "Technical", value: "Technical" },
  { label: "Operations", value: "Operations" },
  { label: "Support", value: "Support" },
  { label: "Finance", value: "Finance" },
  { label: "Human Resources", value: "HR" },
];

const CustomCloseButton = ({ onClose }: { onClose: () => void }) => (
  <button
    onClick={onClose}
    className="absolute right-5 top-5 rounded-md bg-slate-100 p-1.5 opacity-70 transition-opacity hover:opacity-100 hover:bg-slate-200 focus:outline-none"
  >
    <X className="h-4 w-4 text-slate-700" />
    <span className="sr-only">Close</span>
  </button>
);

const CustomDropdown = ({ value, placeholder, options, onChange, disabled, dropdownHeightClass = "max-h-[200px]" }: any) => {
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

  const selectedOption = options.find((opt: any) => opt.value === value);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-white border border-slate-200 rounded-lg h-12 px-4 focus:outline-none focus:border-[#48635c] shadow-sm ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className={`text-[15px] truncate pr-2 ${selectedOption ? "text-slate-800" : "text-[#8b98a5]"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="w-[18px] h-[18px] text-[#8b98a5] shrink-0" />
      </button>

      {isOpen && !disabled && (
        <div className={`absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-xl overflow-y-auto py-1 ${dropdownHeightClass}`}>
          {options.length > 0 ? options.map((opt: any) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className="w-full flex items-center justify-start py-2.5 px-3 hover:bg-slate-50 text-left relative"
            >
              <div className="flex items-center gap-2 w-full">
                {value === opt.value ? (
                  <div className="w-1.5 h-1.5 bg-[#48635c] rounded-full shrink-0" />
                ) : (
                  <div className="w-1.5 h-1.5 shrink-0" />
                )}
                <span className={`text-[14px] truncate ${value === opt.value ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
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
};

export default function EditDepartmentModal({
  department,
  onClose,
  loading,
}: EditDepartmentModalProps) {
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({
    name: department.name,
    alias: department.alias,
    description: department.description || "",
    category: department.category || "",
    is_active: department.is_active,
    is_verified: department.is_verified,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Department name is required");
      return;
    }

    try {
      const updateData: any = {
        name: formData.name,
        alias: formData.alias !== department.alias ? formData.alias : undefined,
        description: formData.description || undefined,
        category: formData.category || undefined,
        is_active: formData.is_active,
        is_verified: formData.is_verified,
      };

      await dispatch(
        updateDepartment({ alias: department.alias, data: updateData })
      ).unwrap();
      toast.success("Department updated successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to update department");
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[760px] p-0 bg-white gap-0 border border-slate-200 shadow-xl rounded-xl overflow-hidden"
        showCloseButton={false}
      >
        <CustomCloseButton onClose={onClose} />
        
        <DialogHeader className="pt-7 px-8 pb-5 border-0">
          <DialogTitle className="text-[20px] font-semibold text-[#2d3748]">
            Quick Edit Department
          </DialogTitle>
        </DialogHeader>

        <div className="px-8 pb-8 space-y-7">
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1 space-y-2.5">
              <Label htmlFor="name" className="text-[13px] text-[#8b98a5] font-normal">
                Department Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={loading}
                className="h-12 bg-white border-slate-200 rounded-lg text-[15px] text-[#2d3748] focus-visible:ring-0 shadow-sm"
              />
            </div>
            <div className="flex-1 space-y-2.5">
              <Label htmlFor="alias" className="text-[13px] text-[#8b98a5] font-normal">
                Department Alias
              </Label>
              <Input
                id="alias"
                value={formData.alias}
                onChange={(e) => handleInputChange("alias", e.target.value)}
                disabled={loading}
                className="h-12 bg-white border-slate-200 rounded-lg text-[15px] text-[#2d3748] focus-visible:ring-0 shadow-sm"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1 space-y-2.5">
              <Label className="text-[13px] text-[#8b98a5] font-normal">
                Category
              </Label>
              <CustomDropdown
                value={formData.category}
                placeholder="Select category"
                options={CATEGORY_OPTIONS}
                onChange={(val: string) => handleInputChange("category", val)}
                disabled={loading}
              />
            </div>
            <div className="flex-1 hidden md:block">
              {/* Empty column to match image half-width Category layout */}
            </div>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="description" className="text-[13px] text-[#8b98a5] font-normal">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter a brief description of the department's responsibilities..."
              rows={5}
              disabled={loading}
              className="resize-none bg-white border-slate-200 rounded-lg text-[15px] text-[#2d3748] focus-visible:ring-0 shadow-sm p-4 placeholder:text-[#8b98a5]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            <div className="flex items-center justify-between p-5 bg-[#F5F8F7] rounded-xl border border-transparent">
              <div>
                <Label htmlFor="is_active" className="font-semibold text-[15px] text-[#2d3748]">
                  Active Status
                </Label>
                <p className="text-[14px] text-[#8b98a5] mt-0.5">
                  Enable this department
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                disabled={loading}
                className="data-[state=checked]:bg-[#48635c]"
              />
            </div>
            
            <div className="flex items-center justify-between p-5 bg-[#F5F8F7] rounded-xl border border-transparent">
              <div>
                <Label htmlFor="is_verified" className="font-semibold text-[15px] text-[#2d3748]">
                  Verified Status
                </Label>
                <p className="text-[14px] text-[#8b98a5] mt-0.5">
                  Mark as verified
                </p>
              </div>
              <Switch
                id="is_verified"
                checked={formData.is_verified}
                onCheckedChange={(checked) => handleInputChange("is_verified", checked)}
                disabled={loading}
                className="data-[state=checked]:bg-[#48635c]"
              />
            </div>
          </div>
        </div>

        <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-4 bg-white">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="w-32 h-11 rounded-[6px] border border-[#d2d6dc] text-[#4a5568] hover:bg-slate-50 font-medium text-[15px] shadow-sm"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="w-40 h-11 rounded-[6px] bg-[#48635c] hover:bg-[#344a44] text-white font-medium text-[15px] shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}