"use client"

import React from "react";
import { X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SalaryPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    monthlyAmount: string; // Basic salary
    totalCTC?: string;
    onSubmit?: () => void;
}

export function SalaryPreviewModal({ isOpen, onClose, monthlyAmount, totalCTC, onSubmit }: SalaryPreviewModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[420px] p-0 overflow-hidden border-none rounded-2xl bg-[#F0F7FF]">
                <div className="p-6">
                    <DialogHeader className="mb-6 pr-8">
                        <DialogTitle className="text-[18px] font-semibold text-[#1F2937]">
                            Salary Structure Preview
                        </DialogTitle>
                    </DialogHeader>

                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[14px] font-semibold text-[#1F2937]">Earning Components</h3>
                            <span className="text-[12px] text-[#4B5563]">Monthly</span>
                        </div>

                        <div className="flex items-center justify-between mb-4 px-2">
                             <span className="text-[14px] text-[#4B5563]">Basic</span>
                             <span className="text-[14px] font-semibold text-[#1F2937]">₹ {monthlyAmount}</span>
                         </div>

                        <div className="flex items-center justify-between mb-6 px-2">
                             <span className="text-[14px] text-[#4B5563]">Special Allowance</span>
                             <span className="text-[14px] font-semibold text-[#1F2937]">₹ {(parseFloat(totalCTC || monthlyAmount) - parseFloat(monthlyAmount)).toFixed(2)}</span>
                         </div>

                         <div className="bg-[#F3F4F6] rounded-xl p-5 flex items-center justify-between">
                             <span className="text-[14px] font-semibold text-[#1F2937]">Total CTC</span>
                             <span className="text-[14px] font-semibold text-[#1F2937]">₹ {totalCTC || monthlyAmount}</span>
                         </div>
                    </div>

                    <div className="my-6 border-t border-dashed border-gray-300 w-full" />

                    <div className="flex gap-4 px-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 h-[42px] border-[#3B82F6] text-[#3B82F6] hover:bg-white hover:text-[#2563EB] text-[15px] font-semibold rounded-xl bg-white"
                        >
                            Edit
                        </Button>
                        <Button
                            onClick={onSubmit || onClose}
                            className="flex-1 h-[42px] bg-[#3B82F6] text-white hover:bg-[#2563EB] text-[15px] font-semibold rounded-xl shadow-sm"
                        >
                            Submit
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
