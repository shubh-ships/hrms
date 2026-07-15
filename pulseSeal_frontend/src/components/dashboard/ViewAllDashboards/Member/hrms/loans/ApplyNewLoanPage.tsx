"use client";

import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Eye, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import MoveBackIcon from "@/assets/Dashicons/move-back-icon.png";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import CustomDropdown from "@/components/dashboard/ViewAllDashboards/Member/hrms/dashboard/CustomDropdown";
import { useAppDispatch } from "@/store/hooks";
import { createLoanRequest } from "@/features/loan/loanSlice";

export default function ApplyNewLoanPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Basic standard states for UI
  const [disbursementDate, setDisbursementDate] = useState<Date | undefined>();
  const [repaymentStartMonth, setRepaymentStartMonth] = useState<Date | undefined>();
  const [monthPopoverOpen, setMonthPopoverOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  
  // Controlled fields for calculation
  const [loanName, setLoanName] = useState("");
  const [description, setDescription] = useState("");
  const [principal, setPrincipal] = useState("");
  const [interestPreset, setInterestPreset] = useState<string | "custom">("custom");
  const [interestRate, setInterestRate] = useState("");
  const [interestType, setInterestType] = useState<string | null>("simple");
  const [tenure, setTenure] = useState("");
  const [targetList, setTargetList] = useState<string>("application");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const type = urlParams.get('type');
      if (type === 'loan' || type === 'application') setTargetList(type);
    }
  }, []);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Calculation Logic
  const p = parseFloat(principal);
  const rAnnual = parseFloat(interestRate);
  const tMonths = parseInt(tenure);

  let emiStr = "0.00";
  let isCalculable = false;

  if (!isNaN(p) && !isNaN(rAnnual) && !isNaN(tMonths) && tMonths > 0 && interestType) {
    isCalculable = true;
    if (interestType === "simple") {
      const totalInterest = p * (rAnnual / 100) * (tMonths / 12);
      const totalAmount = p + totalInterest;
      emiStr = (totalAmount / tMonths).toFixed(2);
    } else if (interestType === "compound") {
      const rMonthly = rAnnual / 12 / 100;
      if (rMonthly === 0) {
          emiStr = (p / tMonths).toFixed(2);
      } else {
          const emi = p * rMonthly * Math.pow(1 + rMonthly, tMonths) / (Math.pow(1 + rMonthly, tMonths) - 1);
          emiStr = emi.toFixed(2);
      }
    }
  }

  const inputClassName = "w-full bg-white border border-[#e5e7eb] text-slate-800 placeholder-slate-400 text-[14px] font-medium rounded-[10px] h-[48px] px-4 outline-none focus:border-gray-300";

  const handleApplyLoan = async () => {
    if (!principal || !interestRate || !tenure || !disbursementDate || !repaymentStartMonth) {
      alert("Please fill all required fields");
      return;
    }

    try {
      await dispatch(createLoanRequest({
        loanName: loanName || "New Request",
        description: description,
        principalAmount: parseFloat(principal),
        disbursementDate: disbursementDate.toISOString(),
        repaymentStartMonth: repaymentStartMonth.toISOString(),
        interestPreset: interestPreset === 'custom' ? undefined : interestPreset,
        interestRate: parseFloat(interestRate),
        interestType: interestType as 'simple' | 'compound',
        tenure: parseInt(tenure)
      })).unwrap();

      router.push('/dashboard/dynamic/hrms/loans');
    } catch (error) {
      console.error(error);
      alert("Failed to create loan request");
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#fcfcfc] p-4 lg:p-8 relative pb-32">
      <div className="max-w-[1400px] mx-auto w-full">
        
        {/* Header Area */}
        <div className="mb-8 flex flex-col items-start gap-6">
          <button onClick={() => router.back()} className="inline-block hover:opacity-80 transition-opacity">
            <Image src={MoveBackIcon} alt="Back" className="w-[80px] h-auto object-contain" />
          </button>
          <h1 className="text-[22px] font-bold text-slate-800">Apply New Loan</h1>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] border border-[#f1f1f1] overflow-hidden w-full mb-10 p-6 xl:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-7 mb-10">
            {/* Row 1 */}
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-semibold text-slate-500">Loan Name</label>
              <input
                type="text"
                value={loanName}
                onChange={(e) => setLoanName(e.target.value)}
                placeholder="Enter Loan Name"
                className={inputClassName}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-semibold text-slate-500">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter Description"
                className={inputClassName}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-semibold text-slate-500">Principal Amount</label>
              <div className="relative w-full">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[14px] font-medium">₹</span>
                <input
                  type="text"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="Enter Amount"
                  className={`${inputClassName} pl-8`}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 relative">
              <label className="text-[12px] font-semibold text-slate-500">Disbursement Date <span className="text-red-500">*</span></label>
              <Popover>
                <PopoverTrigger asChild>
                  <button className={`${inputClassName} flex items-center justify-between hover:bg-[#f8f9fa] transition-colors`}>
                    <span className={disbursementDate ? "text-slate-800" : "text-slate-400"}>
                      {disbursementDate ? disbursementDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "Select Date"}
                    </span>
                    <CalendarIcon className="w-5 h-5 text-slate-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={disbursementDate}
                    onSelect={setDisbursementDate}
                    initialFocus
                    className="[&_[data-selected-single=true]]:bg-[#3f5a54] [&_[data-selected-single=true]]:text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Row 2 */}
            <div className="flex flex-col gap-2 relative">
              <label className="text-[12px] font-semibold text-slate-500">Repayment Start Month <span className="text-red-500">*</span></label>
              <Popover open={monthPopoverOpen} onOpenChange={setMonthPopoverOpen}>
                <PopoverTrigger asChild>
                  <button className={`${inputClassName} flex items-center justify-between hover:bg-[#f8f9fa] transition-colors`}>
                    <span className={repaymentStartMonth ? "text-slate-800" : "text-slate-400"}>
                      {repaymentStartMonth ? `${months[repaymentStartMonth.getMonth()]} ${repaymentStartMonth.getFullYear()}` : "Select Month"}
                    </span>
                    <CalendarIcon className="w-5 h-5 text-slate-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-fit p-3 bg-white border border-gray-100 shadow-md rounded-xl" align="start">
                  <div className="flex justify-between items-center mb-4 px-2">
                    <button onClick={(e) => { e.preventDefault(); setPickerYear(pickerYear - 1); }} className="p-1 hover:bg-gray-100 rounded-md outline-none focus:outline-none">
                      <ChevronLeft className="w-4 h-4 text-gray-500" />
                    </button>
                    <span className="text-sm font-medium">{pickerYear}</span>
                    <button onClick={(e) => { e.preventDefault(); setPickerYear(pickerYear + 1); }} className="p-1 hover:bg-gray-100 rounded-md outline-none focus:outline-none">
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {months.map((m, i) => {
                      const isSelected = repaymentStartMonth?.getMonth() === i && repaymentStartMonth?.getFullYear() === pickerYear;
                      return (
                        <button
                          key={m}
                          onClick={(e) => {
                            e.preventDefault();
                            setRepaymentStartMonth(new Date(pickerYear, i, 1));
                            setMonthPopoverOpen(false);
                          }}
                          className={`px-3 py-2 text-[13px] rounded-md transition-colors outline-none focus:outline-none ${isSelected ? 'bg-[#3f5a54] text-white hover:bg-[#3f5a54]/90' : 'hover:bg-gray-100 text-gray-700'}`}
                        >
                          {m}
                        </button>
                      )
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-semibold text-slate-500">Interest Preset</label>
              <CustomDropdown
                value={interestPreset}
                onChange={setInterestPreset}
                placeholder="Custom"
                options={[{ label: "Custom", value: "custom" }]}
                triggerClassName={inputClassName}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-semibold text-slate-500">Interest Rate <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="Enter Rate"
                className={inputClassName}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-semibold text-slate-500">Interest Type</label>
              <CustomDropdown
                value={interestType}
                onChange={setInterestType}
                placeholder="Select Interest Type"
                options={[
                  { label: "Simple Interest", value: "simple" },
                  { label: "Compound Interest", value: "compound" },
                ]}
                triggerClassName={inputClassName}
              />
            </div>

            {/* Row 3 */}
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-semibold text-slate-500">Tenure</label>
              <input
                type="text"
                value={tenure}
                onChange={(e) => setTenure(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Enter Tenure"
                className={inputClassName}
              />
            </div>
          </div>

          {/* Preview Calculations Section */}
          <div className="mt-8 pt-6 border-t border-[#f1f1f1] flex items-start">
            <Dialog>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 text-[13px] font-semibold text-slate-500 hover:text-slate-800 transition-colors focus:outline-none">
                  Preview Calculations
                  <Eye className="w-[16px] h-[16px]" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-[420px] p-0 rounded-2xl shadow-xl border-none overflow-hidden bg-white [&>button]:right-5 [&>button]:top-5 [&>button]:bg-gray-100/80 hover:[&>button]:bg-gray-200 [&>button]:rounded-lg [&>button]:p-1.5 [&>svg]:text-slate-800">
                <div className="p-7 bg-[#fcfcfc]">
                  <div className="flex justify-between items-center w-full mb-2">
                    <DialogTitle className="font-bold text-[20px] text-[#1f2937] tracking-tight">Calculation Preview</DialogTitle>
                  </div>

                  {isCalculable ? (
                    <>
                      <p className="text-[13px] text-slate-500 w-full text-left mb-6 leading-relaxed">
                        Calculation is based on a principal of ₹ {p} at {rAnnual}% {interestType === 'simple' ? 'Simple' : 'Compound'} Interest
                      </p>
                      
                      <div className="w-full bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                          <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide">Components</span>
                          <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide">Amount</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-[13px] text-slate-500 font-medium">Principal Amount</span>
                          <span className="text-[13px] text-slate-800 font-medium tracking-tight">₹ {p}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3">
                          <span className="text-[13px] text-slate-500 font-medium">Tenure</span>
                          <span className="text-[13px] text-slate-800 font-medium">{tMonths} Months</span>
                        </div>
                        <div className="w-full border-t border-gray-100 mb-3" />
                        <div className="flex justify-between items-center">
                          <span className="text-[14px] text-slate-900 font-bold">Monthly Instalment</span>
                          <span className="text-[14px] text-slate-900 font-bold tracking-tight">₹ {emiStr}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-[13px] text-slate-500 w-full text-left mb-6 leading-relaxed">
                        Calculation is based on a principal of ₹ 1 at 1.0% Simple Interest
                      </p>
                      <div className="w-full h-[220px] rounded-xl border border-[#e5e7eb] bg-white flex items-center justify-center">
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

      </div>

      {/* Sticky Footer Action Bar */}
      <div className="w-full fixed bottom-0 left-0 right-0 bg-[#fcfcfc]/90 backdrop-blur-sm border-t border-[#f1f1f1] px-8 py-4 flex justify-end z-[30]">
        <button 
          onClick={handleApplyLoan} 
          className="px-8 py-2.5 rounded-lg text-[14px] font-medium tracking-wide transition-all shadow-sm bg-[#516358] text-white hover:bg-[#3e4d44] cursor-pointer"
        >
          Apply New Loan
        </button>
      </div>

    </div>
  );
}
