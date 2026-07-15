"use client"

import React, { useState } from "react";
import { ArrowLeft, ChevronDown, AlertCircle } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { SalaryPreviewModal } from "@/components/dashboard/ViewAllDashboards/Hrms/Staff/SalaryPreviewModal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { 
    fetchPayrollOverview, 
    editSalary, 
    fetchSalaryTemplates, 
    selectSalaryTemplates,
    fetchTemplateComponents
} from "@/features/salary/salarySlice";

export default function EditSalaryPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { state } = useSidebar();

    const [formState, setFormState] = useState({
        staffType: "Contractual",
        wageRate: "Monthly",
        template: "Select Template",
        effectiveCycle: "Dec 2025",
        currentCTC: "22000",
        monthlyAmount: "22000"
    });

    const dispatch = useAppDispatch();
    const templates = useAppSelector(selectSalaryTemplates);
    const [staffName, setStaffName] = useState("Staff");
    const [selectedTemplateId, setSelectedTemplateId] = useState("");

    React.useEffect(() => {
        dispatch(fetchSalaryTemplates());
        const fetchCurrent = async () => {
            try {
                const today = new Date();
                const res = await dispatch(fetchPayrollOverview({ 
                    employeeId: id, 
                    month: today.getMonth() + 1, 
                    year: today.getFullYear() 
                })).unwrap();
                if (res && res.payroll) {
                    setFormState(prev => ({
                        ...prev,
                        currentCTC: res.payroll.monthlyCTC?.toString() || "0",
                        monthlyAmount: res.payroll.basic?.toString() || "0",
                        template: res.payroll.templateName || "Select Template"
                    }));
                }
            } catch (e) {
                console.error("Failed to fetch current salary", e);
            }
        };
        fetchCurrent();
    }, [id, dispatch]);

    const handleTemplateSelect = async (t: any) => {
        setFormState({ ...formState, template: t.name });
        setSelectedTemplateId(t._id);
        
        // Fetch components for this template
        try {
            const components = await dispatch(fetchTemplateComponents(t._id)).unwrap();
            // If there's a basic component, we could update it. 
            // For now, let's just trigger a re-calc or something.
            // Usually, basic is 50% of CTC in many Indian payrolls.
            const ctc = parseFloat(formState.currentCTC) || 0;
            const basic = ctc * 0.5; // Default assumption if not defined
            setFormState(prev => ({
                ...prev,
                monthlyAmount: basic.toFixed(2)
            }));
        } catch (e) {
            console.error("Failed to fetch template components", e);
        }
    };

    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const handleCTCChange = (ctc: string) => {
        setFormState({
            ...formState,
            currentCTC: ctc
        });
    };

    const handleAmountChange = (amount: string) => {
        setFormState({
            ...formState,
            monthlyAmount: amount
        });
    };

    const handleFinalSubmit = async () => {
        try {
            const basic = parseFloat(formState.monthlyAmount) || 0;
            const ctc = parseFloat(formState.currentCTC) || 0;
            await dispatch(editSalary({
                employeeId: id,
                basic,
                monthlyCTC: ctc
            })).unwrap();
            
            router.push(`/dashboard/admin/hrms/staff/${id}?tab=Salary Structure`);
        } catch (e) {
            console.error("Failed to update salary", e);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F9FAFB] font-sans">
            <div className="p-[40px] flex-1 flex flex-col">
                {/* Header / Back */}
                <button
                    onClick={() => router.push(`/dashboard/admin/hrms/staff/${id}?tab=Salary Structure`)}
                    className="flex items-center gap-2 text-[#4B5563] hover:text-[#1F2937] transition-colors mb-6 w-fit"
                >
                    <ArrowLeft size={16} />
                    <span className="text-[12px] font-medium">Back</span>
                </button>

                {/* Title Section */}
                <div className="bg-white border border-gray-200 rounded-xl p-8 mb-6 shadow-sm max-w-[1128px]">
                    <h1 className="text-[20px] font-semibold text-[#1F2937] mb-8">Edit Salary Structure</h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="flex flex-col gap-1.5 w-[256px]">
                            <label className="text-[7px] font-regular text-[#4B5563] uppercase tracking-tight">Staff Type</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value="Contractual"
                                    readOnly
                                    className="w-full h-[36px] bg-[#EEF2FF] border border-gray-200 rounded-lg px-4 text-[10px] text-[#4B5563] outline-none cursor-not-allowed"
                                />
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 w-[256px]">
                            <label className="text-[7px] font-regular text-[#4B5563] uppercase tracking-tight">Wage Rate</label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="w-full h-[36px] bg-white border border-gray-200 rounded-lg px-4 text-[10px] text-[#1F2937] flex items-center justify-between outline-none">
                                        {formState.wageRate}
                                        <ChevronDown size={14} className="text-[#9CA3AF]" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[256px] bg-white rounded-xl shadow-xl border-gray-100 p-1">
                                    {["Monthly", "Daily", "Hourly"].map((rate) => (
                                        <DropdownMenuItem
                                            key={rate}
                                            onClick={() => setFormState({ ...formState, wageRate: rate })}
                                            className="flex items-center gap-3 px-4 py-2 text-[10px] text-[#4B5563] cursor-pointer hover:bg-gray-50 rounded-lg"
                                        >
                                            <div className={cn("w-1.5 h-1.5 rounded-full", formState.wageRate === rate ? "bg-[#3B82F6]" : "bg-transparent")} />
                                            {rate}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex flex-col gap-1.5 w-[256px]">
                            <label className="text-[7px] font-regular text-[#4B5563] uppercase tracking-tight">Template</label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="w-full h-[36px] bg-white border border-gray-200 rounded-lg px-4 text-[10px] text-[#1F2937] flex items-center justify-between outline-none">
                                        {formState.template || "Select Template"}
                                        <ChevronDown size={14} className="text-[#9CA3AF]" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[256px] bg-white rounded-xl shadow-xl border-gray-100 p-1">
                                    {templates.length > 0 ? (
                                        templates.map((t: any) => (
                                            <DropdownMenuItem
                                                key={t._id}
                                                onClick={() => handleTemplateSelect(t)}
                                                className="flex items-center gap-3 px-4 py-2 text-[10px] text-[#4B5563] cursor-pointer hover:bg-gray-50 rounded-lg"
                                            >
                                                <div className={cn("w-1.5 h-1.5 rounded-full", formState.template === t.name ? "bg-[#3B82F6]" : "bg-transparent")} />
                                                {t.name}
                                            </DropdownMenuItem>
                                        ))
                                    ) : (
                                        <div className="p-4 text-[10px] text-gray-400">No templates found</div>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex flex-col gap-1.5 w-[256px]">
                            <label className="text-[7px] font-regular text-[#4B5563] uppercase tracking-tight">Effective Cycle</label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="w-full h-[36px] bg-white border border-gray-200 rounded-lg px-4 text-[10px] text-[#1F2937] flex items-center justify-between outline-none">
                                        {formState.effectiveCycle}
                                        <ChevronDown size={14} className="text-[#9CA3AF]" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[256px] bg-white rounded-xl shadow-xl border-gray-100 p-1 max-h-[300px] overflow-y-auto">
                                    {["Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026"].map((cycle) => (
                                        <DropdownMenuItem
                                            key={cycle}
                                            onClick={() => setFormState({ ...formState, effectiveCycle: cycle })}
                                            className="flex items-center gap-3 px-4 py-2 text-[10px] text-[#4B5563] cursor-pointer hover:bg-gray-50 rounded-lg"
                                        >
                                            <div className={cn("w-1.5 h-1.5 rounded-full", formState.effectiveCycle === cycle ? "bg-[#3B82F6]" : "bg-transparent")} />
                                            {cycle}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {/* Content Table Area */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm max-w-[1128px]">
                    {/* Top Section with Employee Salary CTC */}
                    <div className="p-8 pb-10 flex items-start gap-32">
                        <div className="text-[12px] font-semibold text-[#1F2937] pt-2">Employee Salary CTC</div>
                        
                        <div className="flex flex-col gap-1.5 w-[256px]">
                            <label className="text-[7px] font-regular text-[#4B5563] uppercase tracking-tight">{formState.wageRate} Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#1F2937]">₹</span>
                                <input
                                    type="text"
                                    value={formState.currentCTC}
                                    onChange={(e) => handleCTCChange(e.target.value)}
                                    className="w-full h-[36px] bg-white border border-gray-200 rounded-lg pl-6 pr-4 text-[10px] text-[#1F2937] outline-none focus:border-[#3B82F6]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table Header Row */}
                    <div className="h-[39px] bg-[#F0F0F0] border-y border-gray-200 flex items-center px-8">
                        <span className="text-[10px] font-medium text-[#1F2937] uppercase tracking-wider w-[40%]">COMPONENTS</span>
                        <span className="text-[10px] font-medium text-[#1F2937] uppercase tracking-wider w-[20%] pl-4">CALCULATION</span>
                        <span className="text-[10px] font-medium text-[#1F2937] uppercase tracking-wider w-[20%] pl-6">{formState.wageRate} AMOUNT</span>
                        {formState.wageRate === "Monthly" && (
                            <span className="text-[10px] font-medium text-[#1F2937] uppercase tracking-wider w-[20%] pl-6">YEARLY AMOUNT</span>
                        )}
                    </div>

                    {/* Earnings Section */}
                    <div className="p-8 border-b border-gray-100">
                        <h4 className="text-[10px] font-bold text-[#1F2937] uppercase tracking-wider mb-8">Earnings</h4>

                        <div className="flex flex-col gap-8 pb-4">
                            {/* Basic Row */}
                            <div className="flex items-center">
                                <span className="text-[10px] font-medium text-[#4B5563] w-[40%]">Basic</span>
                                <span className="text-[10px] font-medium text-[#4B5563] w-[20%] pl-4">Fixed Amount</span>
                                <div className="w-[20%] px-4">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#1F2937]">₹</span>
                                        <input
                                            type="text"
                                            value={formState.monthlyAmount}
                                            onChange={(e) => handleAmountChange(e.target.value)}
                                            placeholder="22,000"
                                            className="w-full h-[36px] bg-white border border-gray-200 rounded-lg pl-6 pr-4 text-[10px] text-[#1F2937] outline-none focus:border-[#3B82F6]"
                                        />
                                    </div>
                                </div>
                                <div className="w-[20%] px-4">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#1F2937]">₹</span>
                                        <input
                                            type="text"
                                            readOnly
                                            value={(parseFloat(formState.monthlyAmount) * 12).toFixed(2)}
                                            className="w-full h-[36px] bg-gray-50 border border-gray-200 rounded-lg pl-6 pr-4 text-[10px] text-[#1F2937] outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                             {/* Special Allowance Row */}
                             <div className="flex items-center">
                                 <div className="text-[10px] font-medium text-[#4B5563] w-[40%] flex items-center gap-2">
                                     Special Allowance <AlertCircle size={10} className="text-[#9CA3AF] cursor-help" />
                                 </div>
                                 <span className="text-[10px] font-medium text-[#4B5563] w-[20%] pl-4">Fixed Amount</span>
                                 <div className="w-[20%] px-4">
                                     <div className="relative">
                                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#1F2937]">₹</span>
                                         <input
                                             type="text"
                                             readOnly
                                             value={Math.max(0, (parseFloat(formState.currentCTC) || 0) - (parseFloat(formState.monthlyAmount) || 0)).toFixed(2)}
                                             className="w-full h-[36px] bg-gray-50 border border-gray-200 rounded-lg pl-6 pr-4 text-[10px] text-[#1F2937] outline-none cursor-not-allowed"
                                         />
                                     </div>
                                 </div>
                                 <div className="w-[20%] px-4">
                                     <div className="relative">
                                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#1F2937]">₹</span>
                                         <input
                                             type="text"
                                             readOnly
                                             value={(Math.max(0, (parseFloat(formState.currentCTC) || 0) - (parseFloat(formState.monthlyAmount) || 0)) * 12).toFixed(2)}
                                             className="w-full h-[36px] bg-gray-50 border border-gray-200 rounded-lg pl-6 pr-4 text-[10px] text-[#1F2937] outline-none cursor-not-allowed"
                                         />
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </div>

                    {/* CTC Row - 64px, 16px text, bg-[#F0F0F0]/60 */}
                    <div className="h-[64px] bg-[#F0F0F0]/60 flex items-center px-8 border-b border-white">
                        <span className="text-[16px] font-medium text-[#1F2937] w-[40%] uppercase">TOTAL</span>
                        <div className="w-[20%]"></div>
                        <div className={cn("w-[20%] text-center pl-2", formState.wageRate !== "Monthly" && "w-[40%] text-right pr-12")}>
                            <span className="text-[16px] font-medium text-[#1F2937]">₹ {formState.currentCTC}</span>
                        </div>
                        {formState.wageRate === "Monthly" && (
                            <div className="w-[20%] text-right pr-6">
                                <span className="text-[16px] font-medium text-[#1F2937]">₹ {(parseFloat(formState.currentCTC) * 12).toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Spacer for Fixed Footer */}
            <div className="h-[120px] w-full shrink-0"></div>

            {/* Fixed Footer - Responsive to Sidebar State */}
            <footer 
                className={cn(
                    "fixed bottom-0 right-0 h-[80px] bg-white border-t border-gray-200 flex items-center justify-end px-[40px] gap-4 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] transition-[left] duration-200 ease-linear",
                    state === "expanded" ? "left-[16rem]" : "left-[5rem]"
                )}
            >
                <Button
                    variant="outline"
                    onClick={() => router.push(`/dashboard/admin/hrms/staff/${id}?tab=Salary Structure`)}
                    className="w-[146px] h-[37px] border border-gray-300 text-[#1F2937] text-[14px] font-medium rounded-lg hover:bg-gray-50 bg-white"
                >
                    Back
                </Button>
                <Button
                    onClick={() => setIsPreviewOpen(true)}
                    className="w-[146px] h-[37px] bg-[#3F5A54] text-white text-[14px] font-medium rounded-lg hover:bg-[#2c4440]"
                >
                    Preview
                </Button>
            </footer>

            <SalaryPreviewModal 
                isOpen={isPreviewOpen} 
                onClose={() => setIsPreviewOpen(false)} 
                monthlyAmount={formState.monthlyAmount}
                totalCTC={formState.currentCTC}
                onSubmit={handleFinalSubmit}
            />
        </div>
    );
}
