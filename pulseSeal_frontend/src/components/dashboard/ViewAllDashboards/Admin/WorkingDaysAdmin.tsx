"use client";
import React, { useState, useEffect, useRef } from "react";
import { Calendar, Edit2, X, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { 
  fetchWorkingDays, 
  createWorkingDays, 
  updateWorkingDays, 
  selectWorkingDays 
} from "@/features/workingDays/workingdays";

interface WorkingDay {
  _id: string;
  month: string;
  year: number;
  totalWorkingDays: number;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());

const MONTH_OPTIONS = MONTHS.map(m => ({ label: m, value: m }));
const YEAR_OPTIONS = YEARS.map(y => ({ label: y, value: y }));
const DAYS_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  label: (i + 1).toString(),
  value: (i + 1).toString()
}));

const CustomCloseButton = ({ onClose }: { onClose: () => void }) => (
  <button
    onClick={onClose}
    className="absolute right-4 top-4 rounded-md bg-slate-100 p-1.5 opacity-70 transition-opacity hover:opacity-100 hover:bg-slate-200"
  >
    <X className="h-4 w-4 text-slate-700" />
    <span className="sr-only">Close</span>
  </button>
);

const CustomDropdown = ({ value, placeholder, options, onChange, disabled, dropdownHeightClass = "max-h-[250px]" }: any) => {
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
        className={`w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg h-11 px-3 focus:outline-none focus:border-[#3f5a54] ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className={`text-[15px] truncate pr-2 ${selectedOption ? "text-slate-800" : "text-gray-400"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {isOpen && !disabled && (
        <div className={`absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-xl overflow-y-auto py-1 ${dropdownHeightClass}`}>
          {options.length > 0 ? options.map((opt: any) => (
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

const WorkingDaysAdmin = () => {
  const dispatch = useDispatch<AppDispatch>();
  const workingDays = useSelector(selectWorkingDays) || [];

  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [daysInput, setDaysInput] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editMonth, setEditMonth] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editDays, setEditDays] = useState("");

  useEffect(() => {
    dispatch(fetchWorkingDays());
  }, [dispatch]);

  const handleSetWorkingDays = async () => {
    if (!selectedMonth || !selectedYear || !daysInput) return;
    
    // Convert array objects to our expected Workday type safely even if TS infers it
    const existingRecord = workingDays.find(
      (d: any) => d.month === selectedMonth && String(d.year) === selectedYear
    );

    if (existingRecord) {
      await dispatch(updateWorkingDays({
        id: existingRecord._id,
        month: selectedMonth,
        year: parseInt(selectedYear, 10),
        totalWorkingDays: parseInt(daysInput, 10)
      }));
    } else {
      await dispatch(createWorkingDays({
        month: selectedMonth,
        year: parseInt(selectedYear, 10),
        totalWorkingDays: parseInt(daysInput, 10)
      }));
    }
    
    dispatch(fetchWorkingDays());
    setDaysInput("");
    setSelectedMonth("");
  };

  const handleEditClick = (month: string, year: string, existingRecord?: any) => {
    setEditMonth(month);
    setEditYear(year);
    if (existingRecord) {
      setEditId(existingRecord._id);
      setEditDays(existingRecord.totalWorkingDays.toString());
    } else {
      setEditId(null);
      setEditDays("");
    }
    setIsModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editMonth || !editYear || !editDays) return;
    
    if (editId) {
      await dispatch(updateWorkingDays({
        id: editId,
        month: editMonth,
        year: parseInt(editYear, 10),
        totalWorkingDays: parseInt(editDays, 10)
      }));
    } else {
      await dispatch(createWorkingDays({
        month: editMonth,
        year: parseInt(editYear, 10),
        totalWorkingDays: parseInt(editDays, 10)
      }));
    }
    
    dispatch(fetchWorkingDays());
    setIsModalOpen(false);
  };

  const currentMonthData = workingDays.find(
    (d: any) => d.month === selectedMonth && String(d.year) === selectedYear
  );

  const currentSchedule = currentMonthData || workingDays.find(
    (d: any) => d.month === MONTHS[new Date().getMonth()] && String(d.year) === currentYear.toString()
  );

  const tableData = MONTHS.map(month => {
    const record = workingDays.find((d: any) => d.month === month && String(d.year) === selectedYear);
    return {
      month,
      year: selectedYear,
      days: record ? record.totalWorkingDays : "-",
      status: record ? "Active" : "Not Set",
      record
    };
  });

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-8 bg-[#f8f9fa] min-h-screen">
      <h1 className="text-2xl font-bold text-slate-800">Working Days Management</h1>

      {/* Set Working Days Card */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-[16px] font-bold text-slate-800">Set Working Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-end gap-6 w-full">
            <div className="flex-1 w-full space-y-1">
              <Label className="text-[13px] text-slate-400 font-normal">Select Month</Label>
              <CustomDropdown
                value={selectedMonth}
                placeholder="Select Month"
                options={MONTH_OPTIONS}
                onChange={setSelectedMonth}
              />
            </div>
            
            <div className="flex-1 w-full space-y-1">
              <Label className="text-[13px] text-slate-400 font-normal">Select Year</Label>
              <CustomDropdown
                value={selectedYear}
                placeholder="Select Year"
                options={YEAR_OPTIONS}
                onChange={setSelectedYear}
              />
            </div>
            
            <div className="flex-1 w-full space-y-1">
              <Label className="text-[13px] text-slate-400 font-normal">Total Working Days (1-31)</Label>
              <Input 
                type="number" 
                min="1" 
                max="31" 
                placeholder="Enter Working Days" 
                value={daysInput}
                onChange={e => setDaysInput(e.target.value)}
                className="bg-white border-gray-200 shadow-none h-11 w-full rounded-lg outline-none ring-0 focus-visible:ring-0 text-[15px]"
              />
            </div>
            
            <div className="flex-shrink-0 w-full md:w-auto h-11">
              <Button 
                onClick={handleSetWorkingDays}
                className="bg-[#3f5a54] hover:bg-[#2c3e3a] text-white w-full h-full rounded-lg px-6 shadow-none font-medium text-[15px]"
              >
                Set Working Days
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Schedule Card */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-0 pt-5 pr-5">
          <CardTitle className="text-[14px] font-medium text-slate-500">Active Schedule</CardTitle>
          <div className="text-[11px] font-semibold px-2.5 py-1 border border-slate-200 bg-white rounded text-slate-500 pointer-events-none">
            CURRENT
          </div>
        </CardHeader>
        <CardContent className="pt-2 pb-6">
          {currentSchedule ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-[15px]">
                <Calendar className="w-[18px] h-[18px] text-slate-600" />
                {currentSchedule.month} {currentSchedule.year}
              </div>
              <div className="text-[28px] font-semibold flex items-baseline gap-2 text-slate-800">
                {currentSchedule.totalWorkingDays} <span className="text-[14px] font-normal text-slate-400">Working Days</span>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-sm mt-2">No active schedule set.</div>
          )}
        </CardContent>
      </Card>

      {/* All Months Working Days Card */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-xl overflow-hidden">
        <CardHeader className="border-b border-gray-100 bg-white px-6 py-5">
          <CardTitle className="text-[16px] font-bold text-slate-800">
            All Months Working Days - {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#fcfdfd]">
              <TableRow className="border-b border-gray-100 hover:bg-transparent">
                <TableHead className="font-semibold text-[13px] text-slate-800 h-12 px-6 w-[20%]">Month</TableHead>
                <TableHead className="font-semibold text-[13px] text-slate-800 h-12 w-[20%]">Year</TableHead>
                <TableHead className="font-semibold text-[13px] text-slate-800 h-12 w-[20%]">Days</TableHead>
                <TableHead className="font-semibold text-[13px] text-slate-800 h-12 w-[20%]">Status</TableHead>
                <TableHead className="font-semibold text-[13px] text-slate-800 h-12 px-6 w-[20%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row) => (
                <TableRow key={row.month} className="border-b border-gray-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium text-slate-600 text-[13px] px-6 py-4">{row.month}</TableCell>
                  <TableCell className="text-slate-600 text-[13px]">{row.year}</TableCell>
                  <TableCell className="text-slate-600 text-[13px]">{row.days}</TableCell>
                  <TableCell>
                    <span className={row.status === 'Active' ? 'text-[#22C55E] font-medium text-[13px]' : 'text-[#FACC15] font-medium text-[13px]'}>
                      {row.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right px-6 text-[13px]">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 h-8 w-8 ml-auto disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                      onClick={() => handleEditClick(row.month, row.year, row.record)}
                      disabled={!row.record}
                      title={!row.record ? "Please set working days first" : "Edit working days"}
                    >
                      <Edit2 className="w-[15px] h-[15px]" fill="currentColor"/>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Update Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 gap-0 bg-white" showCloseButton={false}>
          <CustomCloseButton onClose={() => setIsModalOpen(false)} />
          <DialogHeader className="px-6 py-5 border-b-0 mt-2">
            <DialogTitle className="text-xl font-semibold text-slate-800 mb-2">Update Working Days</DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-6">
            <div className="space-y-5 mb-8">
              <div className="space-y-2">
                <Label className="text-sm text-slate-600 font-normal">Month</Label>
                <CustomDropdown
                  value={editMonth}
                  placeholder="Select Month"
                  options={MONTH_OPTIONS}
                  onChange={setEditMonth}
                  dropdownHeightClass="max-h-[160px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-slate-600 font-normal">Year</Label>
                <CustomDropdown
                  value={editYear}
                  placeholder="Select Year"
                  options={YEAR_OPTIONS}
                  onChange={setEditYear}
                  dropdownHeightClass="max-h-[160px]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-slate-600 font-normal">Total Working Days (1-31)</Label>
                <CustomDropdown
                  value={editDays}
                  placeholder="Choose Working Days"
                  options={DAYS_OPTIONS}
                  onChange={setEditDays}
                  dropdownHeightClass="max-h-[160px]"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 flex gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 h-11 rounded-lg border-[#3f5a54] text-[#3f5a54] hover:bg-[#3f5a54]/5 font-medium text-[15px]"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleUpdate}
                className="flex-1 h-11 rounded-lg bg-[#3f5a54] hover:bg-[#2c3e3a] text-white font-medium text-[15px]"
              >
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkingDaysAdmin;
