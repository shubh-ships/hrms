"use client"

import React from "react";
import AddLoanForm from "@/components/dashboard/ViewAllDashboards/Hrms/Staff/AddLoanForm";
import { useParams } from "next/navigation";

export default function Page() {
    const params = useParams();
    const id = params.id as string;

    if (!id) return null;

    return <AddLoanForm id={id} />;
}
