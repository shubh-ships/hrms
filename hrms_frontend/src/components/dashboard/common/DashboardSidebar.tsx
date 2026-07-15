"use client";

import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import SidebarSection from "../sidebar/SidebarSection";
import {
  sidebarNavItems,
  getModuleStatus,
} from "@/components/config/navigation";
import { useAppSelector } from "@/store/hooks";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import DashboardSidebarWithTabs from "./DashboardSidebarWithTabs";

interface DashboardSidebarProps {
  dashboardType: "super_admin" | "admin" | "dynamic";
  orgPermissions: {
    isHRMS_enabled: boolean;
    isTaskManagement_enabled: boolean;
  };
}

function DashboardSidebar({
  dashboardType,
  orgPermissions,
}: DashboardSidebarProps) {
  const { user, role } = useAppSelector((state) => state.auth);

  if (dashboardType === "admin" || dashboardType === "dynamic") {
    return (
      <DashboardSidebarWithTabs
        dashboardType={dashboardType}
        orgPermissions={orgPermissions}
      />
    );
  }

  let items: Array<{ title: string; url: string; icon: any }> = [];
  let basePath = "";
  let sectionTitle = "";
  let footerText = "";

  if (dashboardType === "super_admin") {
    items = sidebarNavItems.super_admin;
    basePath = "dashboard/super_admin";
    sectionTitle = "SUPER ADMIN";
    footerText = "System Administration";
  }

  return (
    <Sidebar className="border-r z-50">
      <SidebarHeader className="border-b">
        <div className="flex flex-col items-center py-4 px-2">
          <div className="text-center w-full">
            <h2 className="text-lg font-bold text-foreground mb-2">
              {sectionTitle}
            </h2>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="h-full">
          <div className="py-2">
            <SidebarSection title="" items={items} basePath={basePath} />
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <div className="p-4">
          <div className="text-center text-sm font-medium text-foreground mb-3">
            {footerText}
          </div>

          <div className="text-center text-xs text-muted-foreground mt-3 pt-2 border-t border-border/30">
            System v1.0
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default React.memo(DashboardSidebar);
