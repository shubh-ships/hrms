
"use client";

import React, { useState } from "react";
import ExpenseForm from "@/components/dashboard/ViewAllDashboards/Hrms/Expenses/ExpenseForm";
import UserExpenseList from "@/components/dashboard/ViewAllDashboards/Hrms/Expenses/UserExpenseList";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, List } from "lucide-react";

const UserExpensesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("list");

  const handleExpenseCreated = () => {
    setActiveTab("list");
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">My Expenses</h1>
        <p className="text-muted-foreground">
          Submit and track your expense requests
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            My Expenses
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Expense
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <UserExpenseList />
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <ExpenseForm
            onSuccess={handleExpenseCreated}
            onCancel={() => setActiveTab("list")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserExpensesPage;