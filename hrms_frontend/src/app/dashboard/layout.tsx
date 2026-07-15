import React from "react";
import { cookies } from "next/headers";
import DashboardClientLayout from "./dashboardClientLayout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <DashboardClientLayout defaultOpen={defaultOpen}>
      {children}
    </DashboardClientLayout>
  );
}
