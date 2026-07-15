import React from 'react';
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Trash2, X, File, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Leave } from "@/features/leave/leaveSlice";

interface OnLeaveDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    leave: Leave & { displayName?: string };
}

export const OnLeaveDetailsModal: React.FC<OnLeaveDetailsModalProps> = ({
    open,
    onOpenChange,
    leave,
}) => {
    if (!leave) return null;

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);

        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('en-GB', { month: 'short' });
        const year = date.getFullYear().toString().slice(-2);

        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;

        return `${day} ${month}'${year}, ${hours}:${minutes}${ampm}`;
    };

    const getDayMonth = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short'
        });
    };

    const getFullDateWithDay = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('en-GB', { month: 'short' });
        const weekday = date.toLocaleString('en-GB', { weekday: 'short' });
        return `${day} ${month}, ${weekday}`;
    };

    const getApproverName = (history: any[]) => {
        if (history && history.length > 0) {
            const last = history[history.length - 1];
            if (last.approverId && typeof last.approverId === 'object') {
                return last.approverId.name;
            }
            return 'Manager';
        }
        return 'Pending';
    };

    const getApprovedOn = (history: any[]) => {
        if (history && history.length > 0) {
            return formatDate(history[history.length - 1].date);
        }
        return 'N/A';
    };

    const handleDelete = () => {
        // Frontend-only "delete" - close the modal and potentially we could show a toast
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="w-[700px] h-fit max-h-[649px] p-8 bg-white border-none shadow-2xl rounded-2xl gap-0 max-w-none flex flex-col overflow-hidden font-sans">
                {/* Header Section - All in one row */}
                <div className="flex items-center justify-between mb-8 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <h2 className="text-[18px] font-bold text-[#1F2937] tracking-tight">Leave Details</h2>
                        <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold",
                            leave.status === 'approved' ? "bg-[#EBFDF5] text-[#10B981]" :
                                leave.status === 'pending' ? "bg-[#FFFBEB] text-[#F59E0B]" :
                                    "bg-[#FEF2F2] text-[#EF4444]"
                        )}>
                            {leave.status === 'approved' ? (
                                <Check className="w-3.5 h-3.5 stroke-[3px]" />
                            ) : (
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    leave.status === 'pending' ? "bg-[#F59E0B]" : "bg-[#EF4444]"
                                )} />
                            )}
                            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div
                            onClick={handleDelete}
                            className="p-1.5 border border-[#F3F4F6] rounded-lg cursor-pointer hover:bg-rose-50 transition-colors"
                        >
                            <Trash2 className="w-4 h-4 text-[#EF4444]" />
                        </div>
                        <div
                            onClick={() => onOpenChange(false)}
                            className="p-1 cursor-pointer text-[#9CA3AF] hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden">
                    <div className="grid grid-cols-3 gap-x-4 gap-y-7 mb-7">
                        {/* Row 1 */}
                        <div className="space-y-0.5">
                            <p className="text-[11px] text-[#9CA3AF] font-medium leading-none">Staff Name</p>
                            <p className="text-[12px] font-medium text-[#1F2937] uppercase truncate">{leave.displayName || 'N/A'}</p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[11px] text-[#9CA3AF] font-medium leading-none">Leave Applied on</p>
                            <p className="text-[12px] font-medium text-[#1F2937] leading-tight">{formatDate(leave.createdAt)}</p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[11px] text-[#9CA3AF] font-medium leading-none">Leave On</p>
                            <p className="text-[12px] font-medium text-[#1F2937] leading-tight">
                                {getDayMonth(leave.startDate)} (S1) - {getDayMonth(leave.endDate)} (S2)
                            </p>
                        </div>

                        {/* Row 2 */}
                        <div className="space-y-0.5">
                            <p className="text-[11px] text-[#9CA3AF] font-medium leading-none">Leave Duration</p>
                            <p className="text-[12px] font-medium text-[#1F2937]">{leave.totalDays} day(s)</p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[11px] text-[#9CA3AF] font-medium leading-none">Leaves Availed</p>
                            <p className="text-[12px] font-medium text-[#1F2937]">{leave.totalDays} Day</p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[11px] text-[#9CA3AF] font-medium leading-none">Leave Type</p>
                            <p className="text-[12px] font-medium text-[#1F2937]">{leave.leaveType}</p>
                        </div>

                        {/* Row 3 - Approval */}
                        {leave.status !== 'pending' && (
                            <>
                                <div className="space-y-0.5">
                                    <p className="text-[11px] text-[#9CA3AF] font-medium leading-none">Approved by</p>
                                    <p className="text-[12px] font-medium text-[#1F2937] truncate">{getApproverName(leave.approvalHistory)}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[11px] text-[#9CA3AF] font-medium leading-none">Approved on</p>
                                    <p className="text-[12px] font-medium text-[#1F2937] leading-tight">{getApprovedOn(leave.approvalHistory)}</p>
                                </div>
                                <div />
                            </>
                        )}
                    </div>

                    {/* Summary & Description */}
                    <div className="space-y-7 mb-8">
                        <div className="space-y-0.5">
                            <p className="text-[11px] text-[#9CA3AF] font-medium leading-none">Leave Summary</p>
                            <p className="text-[12px] font-medium text-[#1F2937]">
                                {leave.totalDays} {leave.leaveType}({getFullDateWithDay(leave.startDate)})
                            </p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[11px] text-[#9CA3AF] font-medium leading-none">Description</p>
                            <p className="text-[12px] font-medium text-[#1F2937] leading-relaxed line-clamp-3">{leave.reason || 'i'}</p>
                        </div>
                    </div>

                    {/* Attachments Section */}
                    <div className="mt-auto space-y-2 pt-2">
                        <p className="text-[11px] text-[#9CA3AF] font-medium">Attachments</p>
                        <div className="flex items-center gap-4">
                            {leave.attachments && leave.attachments.length > 0 ? (
                                <>
                                    <div className="w-[56px] h-[48px] bg-[#1F2937] rounded-lg flex items-center justify-center flex-shrink-0">
                                        <File className="w-5 h-5 text-white/30" />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {leave.attachments.map((file, idx) => (
                                            <div key={idx} className="px-3 py-1 rounded-full border border-[#3B82F6] text-[#3B82F6] text-[11px] font-medium truncate max-w-[200px]">
                                                {typeof file === 'string' ? file.split('/').pop() : 'Attachment'}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="px-3 py-0.5 rounded-full border border-[#3B82F6] text-[#3B82F6] text-[11px] font-medium shadow-sm">
                                    No attachments
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
