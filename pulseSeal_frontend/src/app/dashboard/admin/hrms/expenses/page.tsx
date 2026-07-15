
"use client";

import React, { useState } from 'react';

import AdminExpenseList from '@/components/dashboard/ViewAllDashboards/Hrms/Expenses/ExpenseList';
import ExpenseStats from '@/components/dashboard/ViewAllDashboards/Hrms/Expenses/ExpenseStats';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, BarChart3 } from 'lucide-react';

const AdminExpensesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('list');

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Expense Management</h1>
        <p className="text-muted-foreground">
          Manage and approve employee expense requests
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            All Expenses
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <AdminExpenseList />
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <ExpenseStats />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminExpensesPage;