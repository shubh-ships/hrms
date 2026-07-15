"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import MoveBackIcon from "@/assets/Dashicons/move-back-icon.png";
import { mockApplications } from "./loansMockData";

export default function ApplicationDetailPage({ id }: { id: string }) {
  const router = useRouter();
  
  const application = mockApplications.find(app => app.id.toString() === id);

  if (!application) {
    return <div className="p-8 text-center text-gray-500">Application not found</div>;
  }

  const renderStatusPill = (status: string) => {
    switch(status.toLowerCase()) {
      case 'open':
      case 'approved':
        return <span className="px-2.5 py-1 bg-[#ecfdf5] text-[#10b981] rounded-full text-[11px] font-bold tracking-wide">{status}</span>;
      case 'rejected':
         return <span className="px-2.5 py-1 bg-red-50 text-red-500 rounded-full text-[11px] font-bold tracking-wide">{status}</span>;
      case 'expired':
      default:
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-[11px] font-bold tracking-wide">{status}</span>;
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#fcfcfc] p-4 lg:p-8 relative">
      <div className="max-w-[1400px] mx-auto w-full">
        
        {/* Header Area */}
        <div className="mb-8 flex flex-col items-start gap-6">
          <button onClick={() => router.back()} className="inline-block hover:opacity-80 transition-opacity">
            <Image src={MoveBackIcon} alt="Back" className="w-[80px] h-auto object-contain" />
          </button>
          <div className="flex items-center w-full">
            <h1 className="text-[22px] font-bold text-slate-800">Application Details</h1>
          </div>
        </div>

        {/* Loan Information Card */}
        <div className="bg-white rounded-[16px] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] border border-[#f1f1f1] w-full p-6 sm:p-8 mb-8">
          <h2 className="text-[16px] font-bold text-slate-800 mb-6">Loan Information</h2>
          
          <div className="flex items-center gap-3 mb-8">
            <h3 className="text-[17px] font-bold text-gray-900 uppercase tracking-tight">{application.applicantName}</h3>
            {renderStatusPill(application.status)}
          </div>

          <div className="grid grid-cols-2 gap-y-7 gap-x-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-gray-400">Applied On</span>
              <span className="text-[14px] font-[600] text-gray-800">{application.appliedOn}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-gray-400">Loan Name</span>
              <span className="text-[14px] font-[600] text-gray-800">{application.loanName}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-gray-400">Principal</span>
              <span className="text-[14px] font-[600] text-gray-800">{application.principal}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-gray-400">Tenure</span>
              <span className="text-[14px] font-[600] text-gray-800">{application.tenure}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-gray-400">Interest Rate</span>
              <span className="text-[14px] font-[600] text-gray-800">{application.interestRate}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-gray-400">Interest Type</span>
              <span className="text-[14px] font-[600] text-gray-800">{application.interestType}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-gray-400">Disbursement Date</span>
              <span className="text-[14px] font-[600] text-gray-800">{application.disbursementDate}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-gray-400">Repayment Start Month</span>
              <span className="text-[14px] font-[600] text-gray-800">{application.repaymentStartMonth}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-gray-400">Description</span>
              <span className="text-[14px] font-[600] text-gray-800">{application.description}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-gray-400">Remark (Employer)</span>
              <span className="text-[14px] font-[600] text-gray-800">{application.remark || "-"}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
