"use client";

import React from "react";
import { useAppSelector } from "@/store/hooks";
import SalaryOverviewCard from "./SalaryOverviewCard";
import YtdStatementCard from "./YtdStatementCard";
import BroadcastMessagesCard from "./BroadcastMessagesCard";
import QuickActionCards from "./QuickActionCards";

export default function EmployeeHrmsOverview() {
  const { user } = useAppSelector((state) => state.auth);

  // Clean up user name presentation or fallback to "Employee"
  const firstName = user?.name ? user.name.split(' ')[0] : 'Employee';

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 lg:p-8">
      <div className="max-w-[1400px] mx-auto w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Hello, {firstName}</h1>

        <div className="flex flex-col gap-6 w-full">
          
          {/* Top Row containing Salary Overview and Quick Actions */}
          <div className="flex flex-col xl:flex-row gap-6 w-full items-start">
            <div className="flex-1 w-full">
              <SalaryOverviewCard />
            </div>
            
            <div className="w-full xl:w-[320px] flex-shrink-0">
              <QuickActionCards />
            </div>
          </div>
          
          {/* Bottom Row taking Full Width */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            <YtdStatementCard />
            <BroadcastMessagesCard />
          </div>
          
        </div>
      </div>
    </div>
  );
}
