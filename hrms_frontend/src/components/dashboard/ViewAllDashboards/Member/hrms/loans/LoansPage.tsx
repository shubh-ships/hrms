"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Filter, Banknote, ChevronRight } from "lucide-react";
import CloudImage from "@/assets/Dashicons/Cloud.png";
import LoansFilterModal from "./LoansFilterModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getEmployeeLoans } from "@/features/loan/loanSlice";

type TabType = "Loans" | "Loan Applications";

export default function LoansPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("Loans");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const { myLoans, loading } = useAppSelector((state) => state.loan);

  useEffect(() => {
    dispatch(getEmployeeLoans({}));
  }, [dispatch]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchQuery("");
    setSelectedStatus([]);
    setSelectedInterest(null);
  };

  const renderStatusPill = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
      case 'approved':
        return <span className="px-2 py-0.5 bg-[#e0f8e9]/80 text-[#22c55e] rounded-full text-[10px] font-bold tracking-wide">{status}</span>;
      case 'closed':
        return <span className="px-2 py-0.5 bg-[#f3e8ff] text-[#9333ea] rounded-full text-[10px] font-bold tracking-wide">{status}</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 bg-red-50 text-red-500 rounded-full text-[10px] font-bold tracking-wide">{status}</span>;
      case 'expired':
      default:
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full text-[10px] font-bold tracking-wide">{status}</span>;
    }
  };

  const formattedLoans = myLoans.map(loan => ({
    id: loan._id,
    title: loan.loanName,
    loanName: loan.loanName,
    applicantName: loan.userId?.name || "Employee",
    principal: `₹${loan.principalAmount}`,
    tenure: `${loan.tenure} Months`,
    interestType: loan.interestType === 'simple' ? 'Simple Interest' : 'Compound Interest',
    status: loan.status,
    disbursementDate: loan.disbursementDate ? new Date(loan.disbursementDate).toLocaleDateString() : "-",
    appliedOn: loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : "-",
    approvedBy: loan.approvedBy?.name || "-",
  }));

  const uiLoans = formattedLoans.filter(loan => ['active', 'approved', 'completed'].includes(loan.status.toLowerCase()));
  const uiApplications = formattedLoans.filter(loan => ['pending', 'rejected'].includes(loan.status.toLowerCase()));

  const filteredLoans = uiLoans.filter(loan => {
    const matchesSearch =
      loan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.loanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.applicantName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus.length === 0 || selectedStatus.map(s => s.toLowerCase()).includes(loan.status.toLowerCase());
    const matchesInterest = !selectedInterest || loan.interestType === selectedInterest;
    return matchesSearch && matchesStatus && matchesInterest;
  });

  const filteredApplications = uiApplications.filter(app => {
    const matchesSearch =
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.loanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicantName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus.length === 0 || selectedStatus.map(s => s.toLowerCase()).includes(app.status.toLowerCase());
    const matchesInterest = !selectedInterest || app.interestType === selectedInterest;
    return matchesSearch && matchesStatus && matchesInterest;
  });

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 lg:p-8">
      <div className="max-w-[1400px] mx-auto w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Loans</h1>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
          {/* View Tabs */}
          <div className="flex items-center p-1 bg-gray-100/50 border border-gray-200/60 rounded-xl w-fit">
            {(["Loans", "Loan Applications"] as TabType[]).map((t) => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={`px-6 py-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none appearance-none select-none border
                  ${activeTab === t
                    ? "bg-white font-medium text-gray-900 shadow-sm border-gray-200"
                    : "border-transparent text-gray-500 font-medium hover:text-gray-700"
                  }
                `}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Action Button */}
          <Link href={`/dashboard/dynamic/hrms/loans/apply?type=${activeTab === 'Loans' ? 'loan' : 'application'}`}>
            <button className="bg-[#3f5a54] text-white px-5 py-2.5 rounded-[8px] text-[14px] font-medium hover:bg-[#3f5a54]/90 transition-colors shadow-sm">
              Apply New Loan
            </button>
          </Link>
        </div>

        {/* Content Area */}
        <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col p-6 min-h-[500px]">

          {/* Stats Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {activeTab === "Loans" ? (
              <>
                <div className="flex flex-col gap-2 p-5 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#E2E8F0]/50 rounded-lg">
                      <Banknote className="w-5 h-5 text-[#3f5a54]" />
                    </div>
                    <span className="text-sm text-gray-500 font-medium">Total Loan Amount</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900 ml-[52px]">₹ 0</span>
                </div>
                <div className="flex flex-col gap-2 p-5 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#E2E8F0]/50 rounded-lg">
                      <Banknote className="w-5 h-5 text-[#3f5a54]" />
                    </div>
                    <span className="text-sm text-gray-500 font-medium">Total Balance</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900 ml-[52px]">₹ 0</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-2 p-5 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#E2E8F0]/50 rounded-lg">
                      <Banknote className="w-5 h-5 text-[#3f5a54]" />
                    </div>
                    <span className="text-sm text-gray-500 font-medium">All Loans</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900 ml-[52px]">₹ 0</span>
                </div>
                <div className="flex flex-col gap-2 p-5 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#E2E8F0]/50 rounded-lg">
                      <Banknote className="w-5 h-5 text-[#3f5a54]" />
                    </div>
                    <span className="text-sm text-gray-500 font-medium">Approved</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900 ml-[52px]">₹ 0</span>
                </div>
              </>
            )}
          </div>

          {/* Search & Filter Row */}
          <div className="flex flex-col sm:flex-row gap-4 mb-5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by Applicant or Loan Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#3f5a54] focus:border-[#3f5a54] transition-colors"
              />
            </div>
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50/50 border border-blue-100 text-[#3f5a54] rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          {/* List Area */}
          <div className="flex flex-col gap-5">
            {activeTab === "Loans" && filteredLoans.length > 0 ? (
              filteredLoans.map((loan) => (
                <div
                  key={loan.id}
                  onClick={() => router.push(`/dashboard/dynamic/hrms/loans/${loan.id}`)}
                  className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-5 md:p-6 hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-[16px] font-bold text-gray-900">{loan.title}</h3>
                      {renderStatusPill(loan.status)}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" strokeWidth={2} />
                  </div>

                  <div className="grid grid-cols-4 gap-y-5 gap-x-4 mt-2">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[12px] font-semibold text-gray-400">Approved By</span>
                      <span className="text-[13px] sm:text-[14px] font-[600] text-gray-800 truncate">{loan.approvedBy}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[12px] font-semibold text-gray-400">Disbursement Date</span>
                      <span className="text-[13px] sm:text-[14px] font-[600] text-gray-800 truncate">{loan.disbursementDate}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[12px] font-semibold text-gray-400">Loan Name</span>
                      <span className="text-[13px] sm:text-[14px] font-[600] text-gray-800 truncate">{loan.loanName}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[12px] font-semibold text-gray-400">Principal</span>
                      <span className="text-[13px] sm:text-[14px] font-[600] text-gray-800 truncate">{loan.principal}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : activeTab === "Loan Applications" && filteredApplications.length > 0 ? (
              filteredApplications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => router.push(`/dashboard/dynamic/hrms/loans/application/${app.id}`)}
                  className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-5 md:p-6 hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-[16px] font-bold text-gray-900">{app.title}</h3>
                      {renderStatusPill(app.status)}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" strokeWidth={2} />
                  </div>

                  <div className="grid grid-cols-4 gap-y-5 gap-x-4 mt-2">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[12px] font-semibold text-gray-400">Applied On</span>
                      <span className="text-[13px] sm:text-[14px] font-[600] text-gray-800 truncate">{app.appliedOn}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[12px] font-semibold text-gray-400">Loan Name</span>
                      <span className="text-[13px] sm:text-[14px] font-[600] text-gray-800 truncate">{app.loanName}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[12px] font-semibold text-gray-400">Principal</span>
                      <span className="text-[13px] sm:text-[14px] font-[600] text-gray-800 truncate">{app.principal}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[12px] font-semibold text-gray-400">Tenure</span>
                      <span className="text-[13px] sm:text-[14px] font-[600] text-gray-800 truncate">{app.tenure}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 my-8">
                <div className="w-[120px] h-[120px] mb-4 relative opacity-80">
                  <Image
                    src={CloudImage}
                    alt="No loans found"
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">
                  {activeTab === "Loans" ? "Loans Not Found" : "Applications Not Found"}
                </p>
              </div>
            )}
          </div>

        </div>

        <LoansFilterModal
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          activeTab={activeTab}
          selectedStatus={selectedStatus}
          selectedInterest={selectedInterest}
          onApply={(status, interest) => {
            setSelectedStatus(status);
            setSelectedInterest(interest);
          }}
        />
      </div>
    </div>
  );
}
