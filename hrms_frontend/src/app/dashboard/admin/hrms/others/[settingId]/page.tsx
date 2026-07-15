import React from "react";
import Link from "next/link";
import movebackIcon from '@/assets/Dashicons/move-back-icon.png'
import Image from "next/image";
import { 
  ShiftSettingsView,
  AutomationRulesView, 
  HolidayPolicyView,
  LeavePolicyView,
  WeeklyHolidaysView,
} from "@/components/dashboard/ViewAllDashboards/Hrms/OthersUI/views";

interface Props {
  params: Promise<{
    settingId: string;
  }>;
}

// Map settingId to actual React Components
const settingComponents: Record<string, React.ElementType> = {
  "shift": ShiftSettingsView,
  "automation-rules": AutomationRulesView,
  "holiday-policy": HolidayPolicyView,
  "leave-policy": LeavePolicyView,
  "weekly-holidays": WeeklyHolidaysView,
  // Add other mappings here as you create more views
};

const SettingDynamicPage = async ({ params }: Props) => {
  const { settingId } = await params;

  // Find the matching component
  const ActiveComponent = settingComponents[settingId] || null;

  return (
    <div className="">
      <Link href={`./`}>
      <Image src={movebackIcon} alt="back"  className="w-[80px] my-6"/>
        </Link>

      <div className="">
        {ActiveComponent ? (
          <ActiveComponent />
        ) : (
          <div className="flex flex-col items-center justify-center text-center h-[300px]">
            <h2 className="text-xl font-semibold text-slate-800">Under Construction</h2>
            <p className="text-gray-500 mt-2">
              Configuration options for <span className="font-medium text-slate-700">"{settingId.split("-").join(" ")}"</span> will be implemented here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingDynamicPage;
