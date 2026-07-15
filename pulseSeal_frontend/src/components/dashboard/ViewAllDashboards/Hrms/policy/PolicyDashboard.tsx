// components/policy/PolicyDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPolicies, selectPolicies, selectPolicyLoading, selectPolicyError } from "@/features/policySlice/policeSlice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Clock, UserX, Coffee, Timer, Sun } from "lucide-react";
import { toast } from "sonner";

// Import individual policy components
import LateEntryPolicyComponent from "./LateEntryPolicy";
import EarlyLeavePolicyComponent from "./EarlyLeavePolicy";
import BreaksPolicyComponent from "./BreaksPolicy";
import OvertimePolicyComponent from "./OvertimePolicy";
import EarlyOvertimePolicyComponent from "./EarlyOvertimePolicy";

const PolicyDashboard = () => {
  const dispatch = useAppDispatch();
  const policies = useAppSelector(selectPolicies);
  const loading = useAppSelector(selectPolicyLoading);
  const error = useAppSelector(selectPolicyError);
  
  const [activeTab, setActiveTab] = useState("late_entry");

  useEffect(() => {
    dispatch(fetchPolicies());
  }, [dispatch]);

  const policyTabs = [
    {
      value: "late_entry",
      label: "Late Entry",
      icon: Clock,
      description: "Manage late entry deduction policies"
    },
    {
      value: "early_leave", 
      label: "Early Leave",
      icon: UserX,
      description: "Manage early leave deduction policies"
    },
    {
      value: "breaks",
      label: "Breaks",
      icon: Coffee,
      description: "Manage break time policies"
    },
    {
      value: "overtime",
      label: "Overtime",
      icon: Timer,
      description: "Manage overtime payment policies"
    },
    {
      value: "early_overtime",
      label: "Early Overtime", 
      icon: Sun,
      description: "Manage early overtime policies"
    }
  ];

  const getPolicyStats = () => {
    return policyTabs.map(tab => {
      const policy = policies.find(p => p.name === tab.value);
      return {
        ...tab,
        exists: !!policy,
        isActive: policy?.isActive || false,
        rulesCount: (policy?.penliteRules?.length || 0) + (policy?.overtimeRules?.length || 0)
      };
    });
  };

  if (loading && policies.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading policies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            Error loading policies: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  const policyStats = getPolicyStats();

  return (
    <div className="space-y-6">
      {/* Policy Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {policyStats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.value} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab(stat.value)}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <IconComponent className="h-5 w-5 text-muted-foreground" />
                  <Badge variant={stat.isActive ? "default" : "secondary"}>
                    {stat.exists ? (stat.isActive ? "Active" : "Inactive") : "Not Set"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  <h3 className="font-medium text-sm">{stat.label}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {stat.description}
                  </p>
                  {stat.exists && (
                    <p className="text-xs text-muted-foreground">
                      {stat.rulesCount} rule{stat.rulesCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Policy Management Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Policy Management</CardTitle>
          <CardDescription>
            Configure attendance policies for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              {policyTabs.map((tab) => {
                const IconComponent = tab.icon;
                const policy = policies.find(p => p.name === tab.value);
                return (
                  <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {policy?.isActive && (
                      <div className="h-2 w-2 bg-green-500 rounded-full" />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="late_entry" className="mt-6">
              <LateEntryPolicyComponent />
            </TabsContent>

            <TabsContent value="early_leave" className="mt-6">
              <EarlyLeavePolicyComponent />
            </TabsContent>

            <TabsContent value="breaks" className="mt-6">
              <BreaksPolicyComponent />
            </TabsContent>

            <TabsContent value="overtime" className="mt-6">
              <OvertimePolicyComponent />
            </TabsContent>

            <TabsContent value="early_overtime" className="mt-6">
              <EarlyOvertimePolicyComponent />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PolicyDashboard;