"use client";

import Image from "next/image";
import image1 from "@/assets/AuthIcons/Image1.png";
import React, { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import SidebarSection from "../sidebar/SidebarSection";
import {
  getSidebarItemsByTab,
  getAvailableTabs,
  getDefaultActiveTab,
  getModuleStatus,
  TabType,
} from "@/components/config/navigation";
import { useAppSelector } from "@/store/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardSidebarWithTabsProps {
  dashboardType: "admin" | "dynamic";
  orgPermissions: {
    isHRMS_enabled: boolean;
    isTaskManagement_enabled: boolean;
  };
}

function DashboardSidebarWithTabs({
  dashboardType,
  orgPermissions,
}: DashboardSidebarWithTabsProps) {
  const { permissions, hrmsPermissions, user, role, isOrganizer } =
    useAppSelector((state) => state.auth);

  const { isHRMS_enabled, isTaskManagement_enabled } = orgPermissions;
  const isAdmin = isOrganizer || role?.toLowerCase() === "admin";

  const availableTabs = getAvailableTabs(
    isTaskManagement_enabled,
    isHRMS_enabled,
    permissions || [],
    dashboardType === "admin"
  );

  const [activeTab, setActiveTab] = useState<TabType>(() =>
    getDefaultActiveTab(availableTabs)
  );
  const [isTabLoading, setIsTabLoading] = useState(false);

  useEffect(() => {
    if (
      availableTabs.length > 0 &&
      !availableTabs.find((tab) => tab.key === activeTab)
    ) {
      setActiveTab(getDefaultActiveTab(availableTabs));
    }
  }, [availableTabs, activeTab]);

  const handleTabChange = (tabKey: TabType) => {
    if (tabKey === activeTab) return;

    setIsTabLoading(true);
    setTimeout(() => {
      setActiveTab(tabKey);
      setTimeout(() => setIsTabLoading(false), 250);
    }, 100);
  };

  const sidebarItems = getSidebarItemsByTab(
    dashboardType,
    activeTab,
    isTaskManagement_enabled,
    isHRMS_enabled,
    permissions || []
  );

  const moduleStatus = getModuleStatus(
    isTaskManagement_enabled,
    isHRMS_enabled,
    dashboardType === "admin",
    permissions || []
  );

  const basePath =
    dashboardType === "admin" ? "dashboard/admin" : "dashboard/dynamic";

  const getSectionTitle = () => {
    if (dashboardType === "admin") return "ADMIN PANEL";
    return user?.role?.toUpperCase() || "DASHBOARD";
  };

  const getActiveTabInfo = () => {
    const tab = availableTabs.find((t) => t.key === activeTab);
    return (
      tab || {
        key: activeTab,
        label: "Dashboard",
        count: sidebarItems.length - 1,
      }
    );
  };

  const activeTabInfo = getActiveTabInfo();

  return (
    <Sidebar collapsible="icon" className="border-r shadow-sm border-gray-300 bg-background z-50">
      <SidebarHeader className="border-b shadow-sm border-gray-300 bg-muted/30 px-4 py-5">
        <div className="flex flex-col gap-4">

          {/* <div className="flex items-center justify-center">
            <div className="relative">
              <h2 className="text-base font-semibold text-foreground tracking-tight">
                {getSectionTitle()}
              </h2>
              <Image src="/assets/image1.png" alt="Logo" width={30} height={30} />
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
            </div>
          </div> */}
          <div className="flex items-center justify-start gap-2 py-0.1 group-data-[collapsible=icon]:justify-center">
            <div className="relative flex justify-start pl-0 items-center group-data-[collapsible=icon]:hidden">
              <Image
                src={image1}
                alt="PulseSeal Logo"
                width={50}
                height={50}
                className="object-contain"
                priority
              />
              <span className="text-2xl font-bold text-foreground ml-3">PulseSeal</span>
            </div>
            <div className="hidden group-data-[collapsible=icon]:flex justify-center items-center">
              <Image
                src={image1}
                alt="PulseSeal Logo"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
          </div>


          {availableTabs.length > 1 && (
            <div className="relative rounded-lg ">
              <div className="grid grid-cols-1 gap-4 mt-2 place-items-start group-data-[collapsible=icon]:place-items-center">
                {availableTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;

                  return (
                    <button
                      key={tab.key}
                      onClick={() => handleTabChange(tab.key)}
                      disabled={isTabLoading}
                      // className={cn(
                      //   "relative flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2",
                      //   "focus:outline-none focus:ring-2 focus:ring-primary/20",
                      //   isActive
                      //     ? "bg-primary text-primary-foreground shadow-sm"
                      //     : "text-muted-foreground hover:text-foreground hover:bg-background/80",
                      //   isTabLoading && "opacity-60 "
                      // )}
                      className={cn(
                        "relative flex items-center justify-start group-data-[collapsible=icon]:justify-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-all duration-200 w-full",
                        "group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:mx-auto",
                        isActive
                          ? "bg-[#325B54] text-white shadow-sm border border-[#294B45]"
                          : "bg-[#ffff] text-[#6B7280] hover:bg-[#ECEFF3] hover:text-[#1F2937] border border-[#294B45]",
                        isTabLoading && "opacity-60"
                      )}

                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 flex transition-transform duration-200 shrink-0",
                          isActive && "scale-110"
                        )}
                      />
                      <span className="group-data-[collapsible=icon]:hidden">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}


          {availableTabs.length === 1 && (
            <div className="flex items-center justify-between px-3 py-20 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                {"icon" in activeTabInfo && activeTabInfo.icon && (
                  <activeTabInfo.icon className="h-4 w-4 text-primary" />
                )}
                {/* <span className="text-sm font-medium text-foreground">
                  {activeTabInfo.label}
                </span> */}
              </div>
              {activeTabInfo.count && (
                <Badge variant="secondary" className="text-xs">
                  {activeTabInfo.count}
                </Badge>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <div className="h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {isTabLoading ? (
                <SidebarSkeleton />
              ) : (
                <SidebarSection
                  title=""
                  items={sidebarItems}
                  basePath={basePath}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}


function SidebarSkeleton() {
  return (
    <div className="space-y-1.5 px-2">
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <Skeleton className="h-5 w-5 rounded-md shrink-0" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}

export default React.memo(DashboardSidebarWithTabs);
