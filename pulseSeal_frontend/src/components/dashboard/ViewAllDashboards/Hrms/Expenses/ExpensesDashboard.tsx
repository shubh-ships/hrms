"use client";

import React, { useState } from "react";
import ExpenseForm from "./ExpenseForm";
import ExpenseList from "./ExpenseList";
import ExpenseStats from "./ExpenseStats";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Plus, List, BarChart3 } from "lucide-react";

interface ExpenseDashboardProps {
  isAdmin?: boolean;
}

const ExpenseDashboard: React.FC<ExpenseDashboardProps> = ({
  isAdmin = false,
}) => {
  const [activeTab, setActiveTab] = useState<string>("list");

  const handleExpenseCreated = () => {
    setActiveTab("list");
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Expense Management
        </h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Manage and approve employee expense requests"
            : "Submit and track your expense requests"}
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            {isAdmin ? "All Expenses" : "My Expenses"}
          </TabsTrigger>
          {!isAdmin && (
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Expense
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
          )}
        </TabsList>

        {/* <TabsContent value="list" className="space-y-6">
          <ExpenseList isAdmin={isAdmin} />
        </TabsContent> */}

        {!isAdmin && (
          <TabsContent value="create" className="space-y-6">
            <ExpenseForm
              onSuccess={handleExpenseCreated}
              onCancel={() => setActiveTab("list")}
            />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="stats" className="space-y-6">
            <ExpenseStats />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ExpenseDashboard;
