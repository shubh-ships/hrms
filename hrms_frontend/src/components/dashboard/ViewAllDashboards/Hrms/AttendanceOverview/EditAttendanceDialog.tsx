"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, Clock } from "lucide-react";

interface AttendanceDay {
  attendanceId: string;
  date: string;
  loginTime?: string;
  logoutTime?: string;
}

interface EditAttendanceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingDay: AttendanceDay | null;
  loginTime: string;
  onLoginTimeChange: (time: string) => void;
  logoutTime: string;
  onLogoutTimeChange: (time: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  onSaveChanges: () => void;
  formatDate: (dateString: string) => string;
}

export const EditAttendanceDialog: React.FC<EditAttendanceDialogProps> = ({
  isOpen,
  onOpenChange,
  editingDay,
  loginTime,
  onLoginTimeChange,
  logoutTime,
  onLogoutTimeChange,
  status,
  onStatusChange,
  onSaveChanges,
}) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(false);
    }
  }, [isOpen, editingDay]);

  if (!editingDay) return null;

  // Format date to "16 Jan 2026"
  let formattedDateString = "";
  try {
    const d = new Date(editingDay.date);
    const day = d.getDate();
    const month = d.toLocaleString('default', { month: 'short' });
    const year = d.getFullYear();
    formattedDateString = `${day} ${month} ${year}`;
  } catch {
    formattedDateString = editingDay.date;
  }

  const handleSave = () => {
    if (!loginTime) {
      setError(true);
      return;
    }
    setError(false);
    onSaveChanges();
  };

  const displayStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-8 rounded-[16px] border-gray-100 shadow-xl [&>button]:hidden">
        <DialogTitle className="sr-only">Edit {displayStatus} Attendance</DialogTitle>
        <div className="flex items-center gap-2.5 mb-6">
          <h2 className="text-[22px] font-semibold text-[#1e293b] tracking-tight">{displayStatus}</h2>
          <span className="text-[#1e293b] font-semibold text-[22px]">|</span>
          <span className="text-[20px] text-[#64748b]">{formattedDateString}</span>
        </div>

        <div className="bg-[#fcfdfd] border-none rounded-[12px] p-6 mb-5 flex flex-col sm:flex-row gap-5">
          <div className="flex-1 space-y-2">
            <Label className="text-[#64748b] font-medium text-[14px]">In Time</Label>
            <div className="relative flex items-center">
              <Input
                type="time"
                value={loginTime}
                onChange={(e) => {
                  onLoginTimeChange(e.target.value);
                  if (error && e.target.value) setError(false);
                }}
                className={`w-full pr-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-10 bg-white shadow-sm h-11 rounded-lg text-[#334155] font-medium transition-all ${error ? 'border-[#FF9933] focus-visible:ring-1 focus-visible:ring-[#FF9933]' : 'border-gray-200 focus-visible:ring-0 focus-visible:border-gray-300'}`}
              />
              <Clock className="w-[18px] h-[18px] text-gray-500 absolute right-3 pointer-events-none z-0" strokeWidth={1.5} />
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <Label className="text-[#64748b] font-medium text-[14px]">Out Time</Label>
            <div className="relative flex items-center">
              <Input
                type="time"
                value={logoutTime}
                onChange={(e) => onLogoutTimeChange(e.target.value)}
                className="w-full pr-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-10 bg-white border-gray-200 shadow-sm h-11 rounded-lg focus-visible:ring-0 focus-visible:border-gray-300 text-[#334155] font-medium transition-all"
              />
              <Clock className="w-[18px] h-[18px] text-gray-500 absolute right-3 pointer-events-none z-0" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 mb-6 px-1 text-[#f59e0b] animate-in fade-in slide-in-from-top-1">
            <Info className="w-[18px] h-[18px]" strokeWidth={1.5} />
            <span className="text-[14px] font-medium tracking-tight">In Time is mandatory to mark present</span>
          </div>
        )}

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-lg h-[46px] text-base font-medium transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-[#3f5a54] hover:bg-[#344b46] text-white rounded-lg h-[46px] text-base font-medium shadow-sm transition-all"
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
