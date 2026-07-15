"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoveLeft, Eye } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    getLeavesForApprovalByOrganization,
    processLeaveApproval,
    selectOrganizationLeavesForApproval,
    selectOrganizationApprovalLoading
} from "@/features/leave/leaveSlice";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CheckCircle2, Trash2, X } from "lucide-react";

export default function PendingLeaveApprovals() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [viewDetailsLeave, setViewDetailsLeave] = useState<any>(null);

    const leaves = useAppSelector(selectOrganizationLeavesForApproval);
    const loading = useAppSelector(selectOrganizationApprovalLoading);

    // Filter pending only
    const pendingLeaves = leaves.filter(leave => leave.status === "pending");

    useEffect(() => {
        dispatch(getLeavesForApprovalByOrganization());
    }, [dispatch]);

    const toggleSelectAll = () => {
        if (selectedIds.length === pendingLeaves.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(pendingLeaves.map(l => l._id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleReject = async () => {
        if (selectedIds.length === 0) return;
        try {
            for (const id of selectedIds) {
                await dispatch(processLeaveApproval({ leaveId: id, status: "rejected" })).unwrap();
            }
            toast.success("Leaves rejected successfully");
            setSelectedIds([]);
            dispatch(getLeavesForApprovalByOrganization());
        } catch (err) {
            toast.error("Failed to reject leaves");
        }
    };

    const handleConfirmApprove = async () => {
        const idsToApprove = viewDetailsLeave ? [viewDetailsLeave._id] : selectedIds;
        if (idsToApprove.length === 0) return;
        try {
            for (const id of idsToApprove) {
                await dispatch(processLeaveApproval({ leaveId: id, status: "approved" })).unwrap();
            }
            toast.success("Leaves approved successfully");
            if (!viewDetailsLeave) setSelectedIds([]);
            setViewDetailsLeave(null);
            setIsConfirmOpen(false);
            dispatch(getLeavesForApprovalByOrganization());
        } catch (err) {
            toast.error("Failed to approve leaves");
        }
    };

    const handleSingleReject = async (leaveId: string) => {
        try {
            await dispatch(processLeaveApproval({ leaveId, status: "rejected" })).unwrap();
            toast.success("Leave rejected successfully");
            setViewDetailsLeave(null);
            dispatch(getLeavesForApprovalByOrganization());
        } catch (err) {
            toast.error("Failed to reject leave");
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans px-[40px]">
            <div className="flex-1">
                {/* Header Back Button */}
                <div className="flex mt-[22px] h-[69px] w-[24px]">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-[10px] text-[#3F5A54] hover:text-[#2d403c] transition-colors"
                    >
                        <MoveLeft className="w-[18px]" />
                        <span className="text-[14px] font-semibold text-[#3F5A54] w-[35px]">Back</span>
                    </button>
                </div>

                <h1 className="text-[#1F2937] text-[18px] font-bold mb-[24px]">Leave Pending Appproval</h1>

                {/* Table */}
                <div className="w-full bg-white border border-[#E2E8F0] shadow-sm rounded-xl overflow-hidden mt-[16px]">
                    {/* Columns */}
                    <div className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr_80px_60px] bg-[#F9FAFB] border-b border-gray-100 px-[24px] py-[16px] items-center">
                        <div className="text-[12px] font-semibold text-[#6B7280]">Name</div>
                        <div className="text-[12px] font-semibold text-[#6B7280]">Type</div>
                        <div className="text-[12px] font-semibold text-[#6B7280]">Leaves Availed</div>
                        <div className="text-[12px] font-semibold text-[#6B7280]">Dates</div>
                        <div className="text-[12px] font-semibold text-[#6B7280]">Status</div>
                        <div className="text-[12px] font-semibold text-[#6B7280]">View</div>
                        <div className="flex justify-end pr-[4px]">
                            <Checkbox
                                className="h-[18px] w-[18px] border-[#9CA3AF] data-[state=checked]:bg-[#3F5A54] data-[state=checked]:border-[#3F5A54]"
                                checked={selectedIds.length === pendingLeaves.length && pendingLeaves.length > 0}
                                onCheckedChange={toggleSelectAll}
                            />
                        </div>
                    </div>

                    {/* Rows */}
                    {pendingLeaves.length === 0 ? (
                        <div className="text-center py-[60px] text-gray-400 text-[14px] italic">
                            {loading ? "Loading..." : "No pending leave approvals found."}
                        </div>
                    ) : (
                        pendingLeaves.map(leave => {
                            const emp = typeof leave.employeeId === 'object' ? leave.employeeId as any : { personal: { firstName: 'Unknown', lastName: '' } };
                            const fullName = `${emp.personal?.firstName || ''} ${emp.personal?.lastName || ''}`.trim() || 'Unknown Employee';

                            // dates formatting
                            const start = new Date(leave.startDate);
                            const end = new Date(leave.endDate);
                            const isHalfDay = leave.durationType === "halfDay";
                            const rangeStr = `${format(start, "dd MMM")} ${isHalfDay ? "(S1)" : ""} - ${format(end, "dd MMM")} ${isHalfDay ? "(S2)" : ""}`;

                            return (
                                <div key={leave._id} className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr_80px_60px] px-[24px] py-[22px] border-b last:border-0 border-gray-100 items-center hover:bg-gray-50/50 transition-colors">
                                    <div className="text-[12px] font-medium text-[#374151]">{fullName}</div>
                                    <div className="text-[12px] font-medium text-[#4B5563]">{leave.leaveType}</div>
                                    <div className="text-[12px] font-medium text-[#4B5563]">{leave.totalDays} Day{leave.totalDays !== 1 ? 's' : ''}</div>
                                    <div className="text-[12px] font-medium text-[#4B5563]">{rangeStr}</div>
                                    <div className="flex items-center">
                                        <div className="inline-flex items-center justify-center bg-[#FEF9C3] text-[#CA8A04] text-[10px] font-semibold px-[12px] py-[4px] rounded-full">
                                            Pending
                                        </div>
                                    </div>
                                    <div>
                                        <button
                                            onClick={() => setViewDetailsLeave(leave)}
                                            className="flex items-center gap-[6px] text-[12px] font-bold text-[#374151] hover:text-[#3F5A54]"
                                        >
                                            View <Eye className="w-[14px] h-[14px]" />
                                        </button>
                                    </div>
                                    <div className="flex justify-end pr-[4px]">
                                        <Checkbox
                                            className="h-[18px] w-[18px] border-[#9CA3AF] data-[state=checked]:bg-[#3F5A54] data-[state=checked]:border-[#3F5A54]"
                                            checked={selectedIds.includes(leave._id)}
                                            onCheckedChange={() => toggleSelect(leave._id)}
                                        />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 -mx-[40px] px-[40px] h-[80px] bg-white border-t border-gray-100 flex justify-end items-center gap-[24px] shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)]">
                <Button
                    variant="outline"
                    onClick={handleReject}
                    disabled={selectedIds.length === 0 || loading}
                    className={cn(
                        "w-[124px] h-[40px] font-semibold transition-colors rounded-[8px]",
                        selectedIds.length > 0
                            ? "border border-[#EF4444] text-[#EF4444] bg-white hover:bg-red-50"
                            : "bg-[#F3F4F6] border-none text-[#4B5563] disabled:opacity-50"
                    )}
                >
                    Reject
                </Button>
                <Button
                    variant="outline"
                    onClick={() => setIsConfirmOpen(true)}
                    disabled={selectedIds.length === 0 || loading}
                    className={cn(
                        "w-[124px] h-[40px] font-semibold transition-colors rounded-[8px]",
                        selectedIds.length > 0
                            ? "bg-[#3F5A54] border-none text-white hover:bg-[#2d403c]"
                            : "bg-[#F3F4F6] border-none text-[#4B5563] disabled:opacity-50"
                    )}
                >
                    Approve
                </Button>
            </div>

            {/* Confirm Approval Modal */}
            <Dialog open={isConfirmOpen} onOpenChange={(open) => {
                setIsConfirmOpen(open);
                if (!open && viewDetailsLeave) setViewDetailsLeave(null);
            }}>
                <DialogContent showCloseButton={false} className="w-[380px] p-[28px] border-none bg-white rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                    <DialogHeader className="flex flex-row justify-between items-start mb-[16px]">
                        <DialogTitle className="text-[18px] font-extrabold text-[#1F2937]">Confirm Approval</DialogTitle>
                        <DialogClose className="rounded-[8px] bg-[#F3F4F6] p-[6px] hover:bg-[#E5E7EB] transition-colors">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.4998 3.5L3.49982 10.5M3.49982 3.5L10.4998 10.5" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </DialogClose>
                    </DialogHeader>
                    <p className="text-[14px] text-[#6B7280] mb-[28px] font-medium leading-[1.6]">
                        Are you sure you want to approve the selected {viewDetailsLeave ? 1 : selectedIds.length} leave application(s)?
                    </p>
                    <div className="flex gap-[16px]">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsConfirmOpen(false);
                                if (viewDetailsLeave) setViewDetailsLeave(null);
                            }}
                            className="flex-1 h-[44px] rounded-[10px] border-[#2563EB] text-[#2563EB] hover:bg-[#EFF6FF] font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmApprove}
                            className="flex-1 h-[44px] rounded-[10px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold transition-colors shadow-[0_2px_10px_rgba(37,99,235,0.2)]"
                        >
                            Confirm
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Leave Details Slide-in Modal */}
            <Dialog open={!!viewDetailsLeave} onOpenChange={(open) => { if (!open) setViewDetailsLeave(null); }}>
                <DialogContent
                    showCloseButton={false}
                    className="fixed right-4 top-4 left-auto translate-x-0 translate-y-0 w-[500px] max-w-[500px] m-0 p-[32px] rounded-[24px] bg-white border-none shadow-[0_10px_50px_rgba(0,0,0,0.15)] flex flex-col focus-visible:outline-none h-fit"
                >
                    {viewDetailsLeave && (() => {
                        const emp = typeof viewDetailsLeave.employeeId === 'object' ? viewDetailsLeave.employeeId as any : { personal: { firstName: 'Unknown', lastName: '' } };
                        const fullName = `${emp.personal?.firstName || ''} ${emp.personal?.lastName || ''}`.trim() || 'Unknown Employee';
                        const isHalfDay = viewDetailsLeave.durationType === "halfDay";
                        const start = new Date(viewDetailsLeave.startDate);
                        const end = new Date(viewDetailsLeave.endDate);
                        const rangeStr = `${format(start, "dd MMM")} ${isHalfDay ? "(S1)" : ""} - ${format(end, "dd MMM")} ${isHalfDay ? "(S2)" : ""}`;
                        const applyDate = viewDetailsLeave.createdAt ? format(new Date(viewDetailsLeave.createdAt), "dd MMM yy, hh:mm a") : format(new Date(), "dd MMM yy, hh:mm a");

                        return (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {/* Header Area */}
                                <div className="flex items-start justify-between mb-[24px] shrink-0">
                                    <div className="flex flex-col gap-1.5">
                                        <DialogTitle className="text-[18px] font-bold text-[#1F2937] uppercase tracking-wide">Leave Details</DialogTitle>
                                        <div className="px-2 py-0.5 bg-[#FEF3C7] text-[#D97706] rounded-full flex items-center gap-1 border border-[#FDE68A]/30 w-fit">
                                            <div className="w-[5px] h-[5px] rounded-full bg-[#D97706] animate-pulse" />
                                            <span className="text-[9px] font-bold uppercase tracking-wider">Pending</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <button className="w-[32px] h-[32px] flex items-center justify-center text-[#EF4444] hover:bg-red-50 rounded-full transition-colors border border-transparent hover:border-red-100">
                                            <Trash2 size={18} />
                                        </button>
                                        <DialogClose asChild>
                                            <button className="w-[32px] h-[32px] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors bg-[#F9FAFB] rounded-full border border-gray-100">
                                                <X size={18} />
                                            </button>
                                        </DialogClose>
                                    </div>
                                </div>

                                {/* Details Content */}
                                <div className="pr-2">
                                    <div className="grid grid-cols-3 gap-y-[24px] gap-x-[16px] mb-8">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] text-[#9CA3AF] font-medium">Staff Name</span>
                                            <span className="text-[13px] text-[#1F2937] font-bold uppercase tracking-tight">{fullName}</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] text-[#9CA3AF] font-medium">Leave Applied on</span>
                                            <span className="text-[13px] text-[#1F2937] font-bold">{applyDate}</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] text-[#9CA3AF] font-medium">Leave On</span>
                                            <span className="text-[13px] text-[#1F2937] font-bold uppercase tracking-tight">{rangeStr}</span>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] text-[#9CA3AF] font-medium">Leave Duration</span>
                                            <span className="text-[13px] text-[#1F2937] font-bold">{viewDetailsLeave.totalDays} day(s)</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] text-[#9CA3AF] font-medium">Leaves Availed</span>
                                            <span className="text-[13px] text-[#1F2937] font-bold uppercase">{viewDetailsLeave.totalDays} DAYS</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] text-[#9CA3AF] font-medium">Leave Type</span>
                                            <span className="text-[13px] text-[#1F2937] font-bold uppercase tracking-tight">{viewDetailsLeave.leaveType}</span>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] text-[#9CA3AF] font-medium">Approved by</span>
                                            <span className="text-[13px] text-[#9CA3AF] font-bold">—</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] text-[#9CA3AF] font-medium">Approved on</span>
                                            <span className="text-[13px] text-[#9CA3AF] font-bold">—</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5 mb-6">
                                        <span className="text-[11px] text-[#9CA3AF] font-medium">Leave Summary</span>
                                        <span className="text-[13px] text-[#1F2937] font-bold">{viewDetailsLeave.totalDays} {viewDetailsLeave.leaveType}</span>
                                    </div>

                                    <div className="flex flex-col gap-1.5 mb-8">
                                        <span className="text-[11px] text-[#9CA3AF] font-medium">Description</span>
                                        <p className="text-[13px] text-[#1F2937] font-medium leading-relaxed">{viewDetailsLeave.reason || "No description provided."}</p>
                                    </div>

                                    <div className="flex flex-col gap-2 mb-8">
                                        <span className="text-[11px] text-[#9CA3AF] font-medium">Attachments</span>
                                        {viewDetailsLeave.attachments && viewDetailsLeave.attachments.length > 0 ? (
                                            <div className="w-[60px] h-[60px] bg-gray-900 rounded-[10px] overflow-hidden border border-gray-100 flex items-center justify-center shadow-sm">
                                                <span className="text-white text-[9px] font-bold uppercase">File</span>
                                            </div>
                                        ) : (
                                            <div className="w-[60px] h-[60px] bg-[#F9FAFB] rounded-[10px] flex items-center justify-center text-[#9CA3AF] text-[10px] font-bold border border-dashed border-gray-200">
                                                N/A
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-auto pt-[24px] border-t border-gray-100 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-[8px]">
                                        <Checkbox className="w-[16px] h-[16px] border-gray-300 rounded-[4px] data-[state=checked]:bg-[#3F5A54] data-[state=checked]:border-[#3F5A54] transition-all" />
                                        <span className="text-[12px] font-semibold text-[#4B5563]">Send SMS to Staff</span>
                                    </div>
                                    <div className="flex items-center gap-[12px]">
                                        <Button
                                            variant="outline"
                                            onClick={() => handleSingleReject(viewDetailsLeave._id)}
                                            className="h-[38px] px-6 border-[#EF4444] text-[#EF4444] text-[13px] font-bold hover:bg-red-50 hover:text-[#EF4444] rounded-[8px] transition-all"
                                        >
                                            REJECT
                                        </Button>
                                        <Button
                                            onClick={() => setIsConfirmOpen(true)}
                                            className="h-[38px] px-6 bg-[#3F5A54] text-white text-[13px] font-bold hover:bg-[#2d403c] rounded-[8px] transition-all shadow-md"
                                        >
                                            APPROVE
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </div>
    );
}
