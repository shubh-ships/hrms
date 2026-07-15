"use client";
import React from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import lateEntryIcon from '@/assets/Dashicons/late-entry-rules-icon.png';
import earlyExitIcon from '@/assets/Dashicons/early-exit-rules-icon.png';
import breaksIcon from '@/assets/Dashicons/breaks-rules-icon.png';
import overtimeIcon from '@/assets/Dashicons/overtime-rules-icon.png';
import earlyOvertimeIcon from '@/assets/Dashicons/early-overtime-rules-icon.png';

const rulesData = [
  {
    id: "late-entry-rules",
    title: 'Late Entry Rules',
    description: 'Automate late fine for employees who are coming late to work',
    icon: lateEntryIcon,
  },
  {
    id: "early-exit-rules",
    title: 'Early Exit Rules',
    description: 'Automate fine for employees who are leaving earlier than the shift out-time',
    icon: earlyExitIcon,
  },
  {
    id: "breaks-rules",
    title: 'Breaks Rules',
    description: 'Automate break rules for employees taking breaks more than the allotted time',
    icon: breaksIcon,
  },
  {
    id: "overtime-rules",
    title: 'Overtime Rules',
    description: 'Automate overtime for employees who are working extra after their shift hours',
    icon: overtimeIcon,
  },
  {
    id: "early-overtime-rules",
    title: 'Early Overtime Rules',
    description: 'Automate overtime for employees who are working extra before their shift hours',
    icon: earlyOvertimeIcon,
  },
];

export default function AutomationRulesView() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm min-h-[400px]">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-1">Automation Rules</h2>
        <p className="text-sm text-gray-500">
          Set rules for Late Entry, Early Exit, Breaks & Overtime based on punch-in and punch-out time. You just have to approve the fine/overtime entries.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {rulesData.map((rule, index) => {
          const { icon, id } = rule;

          return (
            <Link key={index} href={`/dashboard/admin/hrms/others/automation-rules/${id}`}>
              <div className="flex items-center justify-between p-5 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="text-slate-600 flex items-center justify-center">
                    <Image src={icon} alt={rule.title} width={24} height={24} className="w-7 h-7 object-contain" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-slate-800">{rule.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{rule.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-sm font-medium transition-colors">Create your first rule</span>
                  <ChevronRight size={24} className="group-hover:translate-x-1 group-hover: transition-all" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
