"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import MoveBackIcon from "@/assets/Dashicons/move-back-icon.png";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getLoanInstallments, clearInstallments } from "@/features/loanInstallment/loanInstallmentSlice";
import { getEmployeeLoans } from "@/features/loan/loanSlice";

export default function LoanDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const { myLoans } = useAppSelector((state) => state.loan);
  const { installments } = useAppSelector((state) => state.loanInstallment);

  useEffect(() => {
    if (myLoans.length === 0) {
      dispatch(getEmployeeLoans({}));
    }
    dispatch(getLoanInstallments({ loanId: id }));

    return () => {
      dispatch(clearInstallments());
    };
  }, [dispatch, id, myLoans.length]);

  const rawLoan = myLoans.find(l => l._id.toString() === id);

  if (!rawLoan) {
    return <div className="p-8 text-center text-gray-500">Loading loan details...</div>;
  }

  const sortedInstallments = [...installments].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const dueInstallments = sortedInstallments.filter(i => i.status === 'due');
  const paidInstallmentsArray = sortedInstallments.filter(i => i.status === 'paid');

  const loan = {
    applicantName: rawLoan.userId?.name || "Employee",
    status: rawLoan.status,
    approvedBy: rawLoan.approvedBy?.name || "-",
    disbursementDate: rawLoan.disbursementDate ? new Date(rawLoan.disbursementDate).toLocaleDateString() : "-",
    loanName: rawLoan.loanName,
    principal: `₹${rawLoan.principalAmount}`,
    interestType: rawLoan.interestType === 'simple' ? 'Simple Interest' : 'Compound Interest',
    annualInterestRate: `${rawLoan.interestRate}%`,
    totalRepayment: `₹${rawLoan.totalPayable}`,
    tenure: `${rawLoan.tenure} Months`,
    completion: `${paidInstallmentsArray.length}/${rawLoan.tenure}`,
    remainingPrincipal: `₹${rawLoan.principalAmount}`, 
    remainingInstalment: `₹${rawLoan.totalPayable - paidInstallmentsArray.reduce((acc, curr) => acc + curr.amount, 0)}`,
    closeDate: "-",
    description: rawLoan.description || "-"
  };

  const mapInstalment = (i: any) => ({
    id: i._id,
    date: new Date(i.dueDate).toLocaleDateString(),
    amount: `₹${i.amount.toFixed(2)}`,
    closingPrincipal: "-",
    principalRepaid: `₹${i.principalComponent?.toFixed(2) || 0}`,
    closingInstalment: "-"
  });

  const nextInstalment = dueInstallments[0] ? mapInstalment(dueInstallments[0]) : null;
  const paidInstalments = paidInstallmentsArray.map(mapInstalment);

  const renderStatusPill = (status: string) => {
    switch(status.toLowerCase()) {
      case 'open':
      case 'approved':
        return <span className="px-2.5 py-1 bg-[#ecfdf5] text-[#10b981] rounded-full text-[11px] font-bold tracking-wide">{status}</span>;
      case 'closed':
        return <span className="px-2.5 py-1 bg-[#f3e8ff] text-[#9333ea] rounded-full text-[11px] font-bold tracking-wide">{status}</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-[11px] font-bold tracking-wide">{status}</span>;
    }
  };

  const renderInstalmentCard = (instalment: any, prefixText: string) => (
    <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 w-full p-5 lg:p-6 mb-4">
      <div className="flex items-center gap-2 mb-5 pb-5 border-b border-gray-100">
        <span className="text-[14px] font-medium text-slate-500">Installment Date:</span>
        <span className="text-[14px] font-bold text-slate-800 tracking-tight">{instalment.date}</span>
      </div>
      <div className="grid grid-cols-2 gap-y-6 gap-x-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-gray-400">Installment Amount</span>
          <span className="text-[14px] font-[600] text-gray-800">{instalment.amount}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-gray-400">Closing Principal Balance</span>
          <span className="text-[14px] font-[600] text-gray-800">{instalment.closingPrincipal}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-gray-400">Principal Repaid in Instalment</span>
          <span className="text-[14px] font-[600] text-gray-800">{instalment.principalRepaid}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-gray-400">Closing Instalment Balance</span>
          <span className="text-[14px] font-[600] text-gray-800">{instalment.closingInstalment}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-[#fcfcfc] p-4 lg:p-8 relative">
      <div className="max-w-[1400px] mx-auto w-full">
        
        {/* Header Area */}
        <div className="mb-8 flex flex-col items-start gap-6">
          <button onClick={() => router.back()} className="inline-block hover:opacity-80 transition-opacity">
            <Image src={MoveBackIcon} alt="Back" className="w-[80px] h-auto object-contain" />
          </button>
          <div className="flex items-center w-full">
            <h1 className="text-[22px] font-bold text-slate-800">Loan Detail</h1>
          </div>
        </div>

        {/* Loan Information Card */}
        <div className="bg-white rounded-[16px] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] border border-[#f1f1f1] w-full pt-6 pb-8 px-6 sm:px-8 mb-10">
          <h2 className="text-[16px] font-bold text-slate-800 mb-6">Loan Information</h2>
          
          <div className="flex items-center gap-3 mb-8">
            <h3 className="text-[17px] font-bold text-gray-900 uppercase tracking-tight">{loan.applicantName}</h3>
            {renderStatusPill(loan.status)}
          </div>

          <div className="grid grid-cols-2 gap-y-7 gap-x-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-gray-400">Approved By</span>
              <span className="text-[14px] font-[600] text-gray-800">{loan.approvedBy}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-gray-400">Disbursement Date</span>
              <span className="text-[14px] font-[600] text-gray-800">{loan.disbursementDate}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-gray-400">Loan Name</span>
              <span className="text-[14px] font-[600] text-gray-800">{loan.loanName}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-gray-400">Principal</span>
              <span className="text-[14px] font-[600] text-gray-800">{loan.principal}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-gray-400">Interest Type</span>
              <span className="text-[14px] font-[600] text-gray-800">{loan.interestType}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-gray-400">Annual Interest Rate</span>
              <span className="text-[14px] font-[600] text-gray-800">{loan.annualInterestRate}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-gray-400">Total Repayment</span>
              <span className="text-[14px] font-[600] text-gray-800">{loan.totalRepayment}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-gray-400">Tenure</span>
              <span className="text-[14px] font-[600] text-gray-800">{loan.tenure}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-gray-400">Completion</span>
              <span className="text-[14px] font-[600] text-gray-800">
                <span className="text-[#10b981]">{loan.completion.split('/')[0]}</span>/{loan.completion.split('/')[1]}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-gray-400">Remaining Principal</span>
              <span className="text-[14px] font-[600] text-gray-800">{loan.remainingPrincipal}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-gray-400">Remaining Instalment</span>
              <span className="text-[14px] font-[600] text-gray-800">{loan.remainingInstalment}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-gray-400">Close Date</span>
              <span className="text-[14px] font-[600] text-gray-800">{loan.closeDate}</span>
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <span className="text-[13px] font-semibold text-gray-400">Description</span>
              <span className="text-[14px] font-[600] text-gray-800">{loan.description}</span>
            </div>
          </div>
        </div>

        {/* Instalment Summary Container */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[16px] font-bold text-slate-800">Instalment Summary</h2>
        </div>

        {/* Next Instalment */}
        {nextInstalment && (
          <div className="mb-8">
            <h3 className="text-[15px] font-semibold text-slate-500 mb-4 tracking-tight">Next Instalment</h3>
            {renderInstalmentCard(nextInstalment, 'Next')}
          </div>
        )}

        {/* Paid Instalments */}
        {paidInstalments && paidInstalments.length > 0 && (
          <div className="mb-8">
            <h3 className="text-[15px] font-semibold text-slate-500 mb-4 tracking-tight">Paid Instalments</h3>
            {paidInstalments.map(inst => (
              <React.Fragment key={inst.id}>
                {renderInstalmentCard(inst, 'Paid')}
              </React.Fragment>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
