import React from "react";
import Link from "next/link";
import { FileChartLine, Ship, Landmark, ChevronRight } from "lucide-react";

export default function QuickActionCards() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <ActionCard 
        title="Salary Slips" 
        subtitle="Download Salary Slip" 
        icon={<FileChartLine size={20} />} 
        bgColor="bg-green-50" 
        iconColor="text-green-500" 
        href="/dashboard/dynamic/hrms/salary-slip"
      />
      <ActionCard 
        title="Apply Leaves" 
        subtitle="Request for Leaves" 
        icon={<Ship size={20} />} 
        bgColor="bg-blue-50" 
        iconColor="text-blue-500" 
        href="/dashboard/dynamic/hrms/apply-leaves"
      />
      <ActionCard 
        title="Request Loan" 
        subtitle="Request for Loan" 
        icon={<Landmark size={20} />} 
        bgColor="bg-orange-50" 
        iconColor="text-orange-400"
        href="/dashboard/dynamic/hrms/loans"
      />
    </div>
  );
}

function ActionCard({ title, subtitle, icon, bgColor, iconColor, href }: { title: string, subtitle: string, icon: React.ReactNode, bgColor: string, iconColor: string, href?: string }) {
  const content = (
    <button className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between hover:shadow-md hover:border-gray-200 transition-all duration-200 group text-left w-full">
      <div className="flex items-center gap-4">
        <div className={`${bgColor} p-2.5 rounded-lg ${iconColor}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-gray-800 leading-tight mb-1">{title}</h3>
          <p className="text-[11px] text-gray-400 font-medium">{subtitle}</p>
        </div>
      </div>
      <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
        <ChevronRight size={18} strokeWidth={2} />
      </div>
    </button>
  );

  if (href) {
    return <Link href={href} className="w-full block">{content}</Link>;
  }

  return content;
}
