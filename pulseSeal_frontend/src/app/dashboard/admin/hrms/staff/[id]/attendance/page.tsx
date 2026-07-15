"use client"

import React from "react";
import EmployeeAttendance from "@/components/dashboard/ViewAllDashboards/Hrms/Staff/EmployeeAttendance";
import { useParams } from "next/navigation";

export default function Page() {
    const params = useParams();
    const id = params.id as string;

    if (!id) return null;

    return <EmployeeAttendance id={id} />;
}
