"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import movebackIcon from '@/assets/Dashicons/move-back-icon.png';

export default function SalaryOverviewDetail() {
  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 lg:p-8">
      <div className="max-w-[1400px] mx-auto w-full">
        
        {/* Header Area */}
        <div className="mb-6">
          <Link href="/dashboard/dynamic/hrms/dashboard" className="inline-block mb-6 hover:opacity-80 transition-opacity">
            <Image src={movebackIcon} alt="Back" className="w-[80px]" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Salary Overview</h1>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full">
          
          {/* Top Summary */}
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="col-span-1 md:col-span-1">
                <h3 className="font-semibold text-gray-900">January, 2026</h3>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Due Amount</p>
                <p className="font-semibold text-gray-900 text-sm">₹ 0</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Net Receivable</p>
                <p className="font-semibold text-gray-900 text-sm">₹ 0</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Date Range</p>
                <p className="font-semibold text-gray-900 text-sm">01 Jan&apos;26 - 21 Jan&apos;26</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Payable Days</p>
                <p className="font-semibold text-gray-900 text-sm">0</p>
              </div>
            </div>
          </div>

          {/* Detailed Table Box */}
          <div className="px-6 pb-6">
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              
              {/* Table Header */}
              <div className="flex bg-[#F4F5F6] border-b border-gray-200 text-sm font-semibold text-gray-700">
                <div className="grid grid-cols-3 w-[60%] border-r border-gray-200 p-4">
                  <div>Earnings</div>
                  <div className="text-center">Full</div>
                  <div className="text-right">Actual</div>
                </div>
                <div className="flex justify-between w-[40%] p-4">
                  <div>Deductions</div>
                  <div className="text-right">Actual</div>
                </div>
              </div>

              {/* Earnings & Deductions Body */}
              <div className="flex text-sm text-gray-600">
                <div className="grid grid-cols-3 w-[60%] border-r border-gray-200 px-4 py-4">
                  <div>Basic</div>
                  <div className="text-center text-gray-400">₹ 20,000</div>
                  <div className="text-right text-gray-400">₹ 0</div>
                </div>
                <div className="flex justify-between w-[40%] px-4 py-4">
                  <div></div>
                  <div></div>
                </div>
              </div>

              <div className="flex text-sm border-b border-gray-200">
                <div className="grid grid-cols-3 w-[60%] border-r border-gray-200 px-4 py-4 font-semibold text-gray-800">
                  <div>Gross Earnings</div>
                  <div className="text-center"></div>
                  <div className="text-right text-gray-400 font-normal">₹ 0</div>
                </div>
                <div className="flex justify-between w-[40%] px-4 py-4 font-semibold text-gray-800">
                  <div>Total Deductions</div>
                  <div className="text-right text-gray-400 font-normal">₹ 0</div>
                </div>
              </div>

              {/* Payments */}
              <div className="flex text-sm text-gray-600 border-b border-gray-200">
                <div className="w-[60%] px-4 py-4">
                  <div>Payments</div>
                </div>
                <div className="flex justify-between w-[40%] px-4 py-4">
                  <div className="text-gray-400">0 Payable Days</div>
                  <div className="text-right text-gray-400">₹ 0</div>
                </div>
              </div>

              {/* Adjustments */}
              <div className="flex items-center justify-between px-4 py-4 text-sm text-gray-600 border-gray-200">
                <div className="w-1/2">Adjustments</div>
                <div className="w-1/2 text-right text-gray-400">₹ 0</div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
