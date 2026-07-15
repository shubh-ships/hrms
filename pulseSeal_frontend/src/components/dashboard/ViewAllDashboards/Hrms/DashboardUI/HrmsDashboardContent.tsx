"use client"

import React from "react";
import { Fingerprint, Cake, UserPlus, CalendarFold, Hourglass, LayoutGrid } from "lucide-react";
import ActionListCard from "./ActionListCard";
import AttendanceCard from "./AttendanceCard";
import StatusCard from "./StatusCard";
import MusterRollTable, { MusterRollItem } from "./MusterRollTable";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPendingApprovals, selectPendingRecords } from "@/features/approvePunches/approvePunchesSlice";
import { fetchBirthdays, fetchAnniversaries, selectBirthdays, selectAnniversaries } from "@/features/celebrations/celebrationsSlice";
import { fetchMonthlyMusterRoll } from "@/features/musterRollTable/musterRollTableSlice";
import { fetchDashboardSummary, selectDashboardSummary, fetchDetailedAttendance, selectDetailedAttendance, fetchDeactivatedCount, selectDeactivatedCount } from "@/features/dailyAttendance/dailyAttendanceSlice";
import { 
    getLeavesForApprovalByOrganization, 
    selectOrganizationLeavesForApproval, 
    getLeavesHistoryByOrganization,
    selectOrganizationLeaveHistory
} from "@/features/leave/leaveSlice";

import { formatDateToYYYYMMDD } from "@/lib/utils";


const AdminDashboardContent = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const pendingRecords = useAppSelector(selectPendingRecords);
    const birthdays = useAppSelector(selectBirthdays);
    const anniversaries = useAppSelector(selectAnniversaries);
    const musterRollData = useAppSelector((state) => state.musterRoll.items);
    const dashboardSummary = useAppSelector(selectDashboardSummary);
    const dailyAttendance = useAppSelector(selectDetailedAttendance);
    const deactivatedCount = useAppSelector(selectDeactivatedCount);
    const organizationHistory = useAppSelector(selectOrganizationLeaveHistory);
    const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());



    const handleDateChange = (date: Date) => {
        setSelectedDate(date);
    };


    useEffect(() => {
        dispatch(fetchPendingApprovals({}));
        dispatch(fetchBirthdays({}));
        dispatch(fetchAnniversaries({}));
        dispatch(getLeavesHistoryByOrganization());

        const dateStr = formatDateToYYYYMMDD(selectedDate);
        dispatch(fetchMonthlyMusterRoll({
            month: selectedDate.getMonth() + 1,
            year: selectedDate.getFullYear(),
            date: dateStr
        }));
        dispatch(fetchDashboardSummary(dateStr));
        dispatch(fetchDetailedAttendance(dateStr));
        dispatch(fetchDeactivatedCount());
    }, [dispatch, selectedDate]);


    const attendanceCounts = React.useMemo(() => {
        const counts = {
            present: 0,
            absent: 0,
            halfDay: 0,
            notMarked: 0,
            punchedIn: 0,
            punchedOut: 0
        };

        if (dailyAttendance && dailyAttendance.length > 0) {
            dailyAttendance.forEach(item => {
                const status = item.attendance?.toUpperCase();
                if (status === "PRESENT") counts.present++;
                else if (status === "ABSENT") counts.absent++;
                else if (status === "HALF_DAY") counts.halfDay++;
                else if (status === "PUNCHED_IN") counts.punchedIn++;
                else if (status === "PUNCHED_OUT") counts.punchedOut++;
                else counts.notMarked++;
            });
            return counts;
        }

        // Fallback to dashboard summary if detailed data is not yet loaded
        return {
            present: dashboardSummary?.present ?? 0,
            absent: dashboardSummary?.absent ?? 0,
            halfDay: dashboardSummary?.halfDay ?? 0,
            notMarked: dashboardSummary?.notMarked ?? 0,
            punchedIn: dashboardSummary?.punchedIn ?? 0,
            punchedOut: dashboardSummary?.punchedOut ?? 0
        };
    }, [dailyAttendance, dashboardSummary]);


    const attendanceStats = [
        { label: "Present", value: attendanceCounts.present },
        { label: "Absent", value: attendanceCounts.absent },
        { label: "Half Day", value: attendanceCounts.halfDay },
        { label: "Not Marked", value: attendanceCounts.notMarked },
        { label: "Punched In", value: attendanceCounts.punchedIn },
        { label: "Punched Out", value: attendanceCounts.punchedOut },
    ];


    const actionItems = [
        {
            icon: <Fingerprint className="h-5 w-5 text-[#EC6D31]" />,
            label: "Approve Punches",
            subtext: pendingRecords.length > 0 ? `${pendingRecords.length} approval${pendingRecords.length === 1 ? '' : 's'} pending` : "No pending approvals",
            colorClass: "bg-[#FDE6DA]",
            path: "/dashboard/admin/hrms/approvePunches",
        },
        {
            icon: <Cake className="h-5 w-5 text-[#9333EA]" />,
            label: "Celebrations",
            subtext: (birthdays.length + anniversaries.length) > 0 ? `${birthdays.length + anniversaries.length} Celebration${birthdays.length + anniversaries.length === 1 ? '' : 's'} upcoming` : "No Celebrations in upcoming days",
            colorClass: "bg-[#E2D3FF]",
            path: "/dashboard/admin/hrms/celebrations",
        },
        {
            icon: <UserPlus className="h-5 w-5 text-[#007BFF]" />,
            label: "New Joinees",
            subtext: "No New Joinees in upcoming days",
            colorClass: "bg-[#DBEAFE]",
            path: "/dashboard/admin/hrms/newJoinees",
        },
    ];


    return (
        <div className="flex flex-col w-full pt-[40px] px-[40px] pb-[300px]">
            <div className="flex flex-col lg:flex-row items-start w-full gap-[24px]">
                <ActionListCard
                    title="Pending Actions"
                    items={actionItems}
                    className="w-[406px] h-[340px] shrink-0"
                />

                <div className="flex-1 flex flex-col min-w-0">
                    <AttendanceCard
                        stats={attendanceStats}
                        selectedDate={selectedDate}
                        onDateChange={handleDateChange}
                        className="w-full h-[159px]"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-[24px] mt-[24px]">
                        <StatusCard
                            icon={
                                <div className="h-[36px] w-[36px] rounded-lg flex items-center justify-center bg-[#FFE1AE]">
                                    <CalendarFold className="h-[20px] w-[20px] text-[#F59E0B]" />
                                </div>
                            }
                            title="On Leave"
                            items={[
                                { 
                                    label: "On Leave", 
                                    value: organizationHistory.filter(l => {
                                        const today = new Date();
                                        today.setHours(0,0,0,0);
                                        return l.status === 'approved' && new Date(l.startDate) <= today && new Date(l.endDate) >= today;
                                    }).length 
                                },
                                { 
                                    label: "Upcoming", 
                                    value: organizationHistory.filter(l => {
                                        const today = new Date();
                                        today.setHours(0,0,0,0);
                                        return l.status === 'approved' && new Date(l.startDate) > today;
                                    }).length 
                                },
                            ]}
                            url="/dashboard/admin/hrms/onLeave"
                            className="w-full h-[157px]"
                        />
                        <StatusCard
                            icon={
                                <div className="h-[36px] w-[36px] rounded-lg flex items-center justify-center bg-[#FEF3C7]">
                                    <Hourglass className="h-[20px] w-[20px] text-[#FACC15]" />
                                </div>

                            }
                            title="Overtime & Fines"
                            items={[
                                { label: "Overtime", value: dashboardSummary ? `${dashboardSummary.overtime?.hours ?? 0}h ${dashboardSummary.overtime?.minutes ?? 0}m` : "0h 0m" },
                                { label: "Fine Hours", value: dashboardSummary ? `${dashboardSummary.fine?.hours ?? 0}h ${dashboardSummary.fine?.minutes ?? 0}m` : "0h 0m" },
                            ]}
                            showChevron={false}
                            className="w-full h-[157px]"
                        />
                        <StatusCard
                            icon={
                                <div className="h-[36px] w-[36px] rounded-lg flex items-center justify-center bg-[#F3F4F6]">
                                    <LayoutGrid className="h-[20px] w-[20px] text-[#6B7280]" />
                                </div>
                            }
                            title="Other"
                            items={[
                                { label: "Deactivated", value: deactivatedCount || 0 },
                                { label: "Daily Work Entries", value: dashboardSummary?.workEntries ?? 0 },
                            ]}
                            showChevron={true}
                            className="w-full h-[157px]"
                        />
                    </div>
                </div>
            </div>

            <div className="w-full mt-[50px]">
                <div className="h-[190px] w-full">
                    <MusterRollTable
                        data={musterRollData}
                        date={selectedDate}
                        onDateChange={handleDateChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardContent;
