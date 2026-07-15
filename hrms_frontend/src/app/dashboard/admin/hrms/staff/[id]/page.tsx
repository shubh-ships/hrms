"use client"

import React from "react";
import EmployeeProfile from "@/components/dashboard/ViewAllDashboards/Hrms/Staff/EmployeeProfile";
import { useParams } from "next/navigation";

export default function Page() {
    const params = useParams();
    const id = params.id as string;

    return <EmployeeProfile id={id} />;
}
