import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import movebackIcon from '@/assets/Dashicons/move-back-icon.png';

import {
  LateEntryRulesView,
  EarlyExitRulesView,
  BreaksRulesView,
  OvertimeRulesView,
  EarlyOvertimeRulesView
} from "@/components/dashboard/ViewAllDashboards/Hrms/OthersUI/views/automation-rules";

import LeavePolicyFormView from "@/components/dashboard/ViewAllDashboards/Hrms/OthersUI/views/leave-policy/LeavePolicyFormView";
import AssignStaffView from "@/components/dashboard/ViewAllDashboards/Hrms/OthersUI/views/leave-policy/AssignStaffView";
import WeeklyOffFormView from "@/components/dashboard/ViewAllDashboards/Hrms/OthersUI/views/weekly-holidays/WeeklyOffFormView";
import WeeklyOffAttendanceFormView from "@/components/dashboard/ViewAllDashboards/Hrms/OthersUI/views/weekly-holidays/WeeklyOffAttendanceFormView";
import HolidayPolicyFormView from "@/components/dashboard/ViewAllDashboards/Hrms/OthersUI/views/holiday-policy/HolidayPolicyFormView";
import HolidayPolicyAttendanceView from "@/components/dashboard/ViewAllDashboards/Hrms/OthersUI/views/holiday-policy/HolidayPolicyAttendanceView";
import NewShiftForm from "@/components/dashboard/ViewAllDashboards/Hrms/OthersUI/views/shift/NewShiftForm";

interface Props {
  params: Promise<{
    settingId: string;
    ruleId: string;
  }>;
}

const ruleComponents: Record<string, React.ElementType> = {
  "late-entry-rules": LateEntryRulesView,
  "early-exit-rules": EarlyExitRulesView,
  "breaks-rules": BreaksRulesView,
  "overtime-rules": OvertimeRulesView,
  "early-overtime-rules": EarlyOvertimeRulesView,
  "new-template": LeavePolicyFormView,
  "assign-staff": AssignStaffView,
  "weekly-off-template": WeeklyOffFormView,
  "weekly-off-attendance-template": WeeklyOffAttendanceFormView,
  "holiday-policy-form": HolidayPolicyFormView,
  "holiday-policy-attendance": HolidayPolicyAttendanceView,
  "new-shift": NewShiftForm,
};

export default async function NestedRulePage({ params }: Props) {
  const { settingId, ruleId } = await params;

  // Format the ID back into a readable title
  const title = ruleId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  const ActiveComponent = ruleComponents[ruleId] || null;

  const isLeavePolicyForm = ActiveComponent === LeavePolicyFormView || ActiveComponent === AssignStaffView || ActiveComponent === WeeklyOffFormView || ActiveComponent === WeeklyOffAttendanceFormView || ActiveComponent === HolidayPolicyFormView || ActiveComponent === HolidayPolicyAttendanceView || ActiveComponent === NewShiftForm;
  const containerClass = isLeavePolicyForm 
    ? "" 
    : "bg-white rounded-xl border border-gray-200 p-6 shadow-sm min-h-[400px] mb-16";

  return (
    <div className="">
      <Link href={`/dashboard/admin/hrms/others/${settingId}`}>
        <Image src={movebackIcon} alt="back" className="w-[80px] my-6" />
      </Link>
      
      <div className={containerClass}>
        {ActiveComponent ? (
          <ActiveComponent />
        ) : (
          <div className="flex flex-col items-center justify-center text-center h-[300px]">
            <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
            <p className="text-gray-500 mb-6">
              This is the specific configuration page for `{ruleId}`.
            </p>
            <div className="p-10 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg text-center h-[200px] w-full">
              <p className="text-gray-400 font-medium">Under Construction</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
