"use client"

import React from "react";
import LoanApplicationSummary from "@/components/dashboard/ViewAllDashboards/Hrms/Staff/LoanApplicationSummary";
import { useParams } from "next/navigation";

export default function LoanApplicationPage() {
    const params = useParams();
    const id = params.id as string;
    const loanId = params.loanId as string;

    return <LoanApplicationSummary id={id} loanId={loanId} />;
}
