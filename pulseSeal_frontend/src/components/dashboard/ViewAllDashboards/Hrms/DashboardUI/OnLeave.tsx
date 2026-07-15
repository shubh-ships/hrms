"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
    MoveLeft,
    Download,
    Eye,
} from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getLeavesHistoryByOrganization, selectOrganizationLeaveHistory, selectLeaveLoading, Leave } from "@/features/leave/leaveSlice";
import { Loader2 } from "lucide-react";
import { OnLeaveDetailsModal } from "./OnLeaveDetailsModal";

// ASSETS
import Cloud from "@/assets/Dashicons/Cloud.png";

const OnLeave = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [activeTab, setActiveTab] = useState("Upcoming Leaves");
    const [selectedLeave, setSelectedLeave] = useState<(Leave & { displayName?: string }) | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const leaveHistory = useAppSelector(selectOrganizationLeaveHistory);
    const loading = useAppSelector(selectLeaveLoading);

    React.useEffect(() => {
        dispatch(getLeavesHistoryByOrganization());
    }, [dispatch]);

    const leaveDateRange = React.useMemo(() => {
        if (!leaveHistory || leaveHistory.length === 0) {
            const now = new Date();
            const monthYear = now.toLocaleString('en-US', { month: 'short', year: '2-digit' }).replace(' ', " '");
            return `(${monthYear} - ${monthYear})`;
        }

        const startDates = leaveHistory.map(l => new Date(l.startDate).getTime());
        const endDates = leaveHistory.map(l => new Date(l.endDate).getTime());

        const minDate = new Date(Math.min(...startDates));
        const maxDate = new Date(Math.max(...endDates));

        const format = (date: Date) => date.toLocaleString('en-US', { month: 'short', year: '2-digit' }).replace(' ', " '");
        return `(${format(minDate)} - ${format(maxDate)})`;
    }, [leaveHistory]);

    const processedLeaves = React.useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        return leaveHistory.map(leave => {
            const employee = typeof leave.employeeId === 'object' ? leave.employeeId : null;
            const name = employee ? `${employee.personal.firstName} ${employee.personal.lastName || ''}` : "Unknown";
            const startDate = new Date(leave.startDate);
            const endDate = new Date(leave.endDate);

            return {
                ...leave,
                displayName: name,
                displayType: leave.leaveType,
                displayAvailed: `${leave.totalDays} Day${leave.totalDays === 1 ? '' : 's'}`,
                displayDates: `${startDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - ${endDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`,
                displayStatus: leave.status.charAt(0).toUpperCase() + leave.status.slice(1),
                isUpcoming: startDate >= now && leave.status === 'approved',
                isPrevious: endDate < now || leave.status === 'rejected' || leave.status === 'cancelled'
            };
        });
    }, [leaveHistory]);

    const upcomingLeaves = processedLeaves.filter(L => L.isUpcoming || (new Date(L.startDate) >= new Date() && L.status === 'pending'));
    const previousLeaves = processedLeaves.filter(L => L.isPrevious || (new Date(L.endDate) < new Date() && L.status === 'approved'));

    const handleViewDetails = (leave: any) => {
        setSelectedLeave(leave);
        setIsModalOpen(true);
    };

    const tabs = ["Upcoming Leaves", "Previous Leaves", "Leave Calendar"];

    return (
        <div className="bg-[#F8FAFC] mx-[40px] font-sans flex flex-col relative">
            <div className="flex mt-[24px] mb-[8px] h-[40px]">                <button
                onClick={() => router.back()}
                className="flex items-center gap-[10px] text-[#3F5A54] hover:text-black transition-colors"
            >
                <MoveLeft className="w-[20px]" />
                <span className="text-[14px] font-medium text-[#3F5A54] w-[35px]">Back</span>
            </button>
            </div>

            {/* MAIN CARD */}
            <div className="min-h-[460px] pb-[20px] border border-[#E5E7EB] shadow-sm bg-white flex flex-col p-0 rounded-[8px]">
                {/* CARD HEADER */}
                <div className="flex items-center justify-between px-[20px] py-[20px]">
                    <div className="flex items-baseline gap-[8px]">
                        <h1 className="text-[#1F2937] h-[24px] w-[72px] text-[16px] font-medium leading-none">Leave(s)</h1>
                        <span className="text-[#4B5563] h-[15px] text-[10px] font-regular">{leaveDateRange}</span>
                    </div>
                    <div className="flex items-center gap-[16px]">
                        <Button variant="outline" className="h-[30px] w-[200px] text-[#3F5A54] border-[#3F5A54] bg-white hover:bg-gray-50 gap-[6px] rounded-[6px]">
                            <p className="text-[14px] font-medium h-[21px] w-[153px]">Leave Balance Report</p>
                            <Download className="h-[16px] w-[16px]" />
                        </Button>

                        <Button variant="outline" className="h-[30px] w-[148px] text-[#3F5A54] border-[#3F5A54] bg-white hover:bg-gray-50 rounded-[6px]">
                            <p className="text-[14px] font-medium h-[21px] w-[129px]">Bulk Encash Leave</p>
                        </Button>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex items-stretch mx-[20px] border h-[32px] px-[20px] border-[#E5E7EB] rounded-[6px]">
                    <div className="flex gap-[20px]">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-[4px] text-[10px] font-medium transition-all relative h-full",
                                    activeTab === tab
                                        ? "text-[#3F5A54] after:content-[''] after:absolute after:-bottom-px after:left-0 after:right-0 after:h-px after:bg-[#3F5A54]"
                                        : "text-[#4B5563] hover:text-[#1F2937]"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* TABLE CONTENT */}
                <div className="flex-1 flex flex-col mt-[20px] mx-[20px] border border-[#E5E7EB] rounded-[6px] overflow-hidden">
                    {activeTab === "Leave Calendar" ? (
                        <div className="flex-1 flex items-center justify-center p-[40px]">
                            <p className="text-[#6B7280]">Leave Calendar coming soon...</p>
                        </div>
                    ) : (
                        <div className="w-full">
                            <table className="w-full table-fixed text-left">
                                <thead className="bg-[#F0F0F0]/40 border-b border-[#E5E7EB] text-[#9CA3AF] h-[39px]">
                                    <tr>
                                        <th className="w-[20%] pl-[30px] font-medium text-[10px]">Staff Name</th>
                                        <th className="w-[15%] font-medium text-[10px]">Type</th>
                                        <th className="w-[15%] font-medium text-[10px] text-center">Leaves Availed</th>
                                        <th className="w-[20%] font-medium text-[10px] text-center">Dates</th>
                                        <th className="w-[15%] font-medium text-[10px] text-center">Status</th>
                                        <th className="w-[15%] pr-[30px] font-medium text-[10px] text-right">View</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="py-[100px]">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Loader2 className="h-8 w-8 animate-spin text-[#3F5A54]" />
                                                    <p className="text-[10px] text-[#9CA3AF]">Loading leaves...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (activeTab === "Upcoming Leaves" ? upcomingLeaves : previousLeaves).length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-[100px]">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Image src={Cloud} alt="No data" width={85} height={85} />
                                                    <p className="text-[7px] text-[#9CA3AF]">No Leaves to Show</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        (activeTab === "Upcoming Leaves" ? upcomingLeaves : previousLeaves).map((row, idx) => (
                                            <tr key={idx} className="border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50 transition-all h-[40px] text-[#4B5563]">
                                                <td className="pl-[30px] text-[10px] font-medium">{row.displayName}</td>
                                                <td className="text-[10px] font-medium">{row.displayType}</td>
                                                <td className="text-[10px] font-medium text-center">{row.displayAvailed}</td>
                                                <td className="text-[10px] font-medium text-center">{row.displayDates}</td>
                                                <td className="text-center">
                                                    <span className={cn(
                                                        "inline-flex items-center px-[10px] py-[2px] rounded-full text-[10px] font-medium gap-1",
                                                        row.status === 'approved' ? "bg-[#EBFDF5] text-[#10B981]" :
                                                            row.status === 'pending' ? "bg-[#FFFBEB] text-[#F59E0B]" :
                                                                "bg-[#FEF2F2] text-[#EF4444]"
                                                    )}>
                                                        <span className={cn(
                                                            "w-[6px] h-[6px] rounded-full",
                                                            row.status === 'approved' ? "bg-[#10B981]" :
                                                                row.status === 'pending' ? "bg-[#F59E0B]" :
                                                                    "bg-[#EF4444]"
                                                        )} />
                                                        {row.displayStatus}
                                                    </span>
                                                </td>
                                                <td className="pr-[30px] text-right">
                                                    <button
                                                        onClick={() => handleViewDetails(row)}
                                                        className="inline-flex items-center gap-1 text-[#4F46E5] hover:text-[#4338CA] transition-colors text-[10px] font-medium ml-auto"
                                                    >
                                                        <Eye className="w-[14px] h-[14px]" />
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {selectedLeave && (
                <OnLeaveDetailsModal
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    leave={selectedLeave}
                />
            )}
        </div>
    );
};

export default OnLeave;
