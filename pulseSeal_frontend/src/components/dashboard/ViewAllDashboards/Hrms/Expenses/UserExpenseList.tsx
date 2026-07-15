"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import {
  getUserExpenses,
  setFilters,
  clearError,
} from "@/features/expenseBalance/expenseSlice";
import {
  ExpenseType,
  ExpenseStatus,
  Expense,
  ExpenseFilters,
} from "@/lib/types/api/expenses";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  ExternalLink,
} from "lucide-react";

const UserExpenseList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { expenses, loading, error, pagination, filters } = useSelector(
    (state: RootState) => state.expense
  );

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
  
    loadExpenses();
  }, [filters]);

  const loadExpenses = () => {
  
    dispatch(getUserExpenses(filters));
  };

  const handleFilterChange = (newFilters: Partial<ExpenseFilters>) => {
    dispatch(setFilters({ ...filters, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    dispatch(setFilters({ ...filters, page }));
  };

  const getStatusVariant = (status: ExpenseStatus) => {
    switch (status) {
      case ExpenseStatus.APPROVED:
        return "default";
      case ExpenseStatus.REJECTED:
        return "destructive";
      case ExpenseStatus.PENDING:
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const clearFilters = () => {
    dispatch(
      setFilters({
        page: 1,
        limit: 10,
      })
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>My Expenses</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </CardHeader>

        {showFilters && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) =>
                    handleFilterChange({
                      status:
                        value === "all" ? undefined : (value as ExpenseStatus),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value={ExpenseStatus.PENDING}>
                      Pending
                    </SelectItem>
                    <SelectItem value={ExpenseStatus.APPROVED}>
                      Approved
                    </SelectItem>
                    <SelectItem value={ExpenseStatus.REJECTED}>
                      Rejected
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={filters.expenseType || "all"}
                  onValueChange={(value) =>
                    handleFilterChange({
                      expenseType:
                        value === "all" ? undefined : (value as ExpenseType),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value={ExpenseType.FOOD}>Food</SelectItem>
                    <SelectItem value={ExpenseType.TRAVEL}>Travel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-3 flex justify-end">
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        )}

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch(clearError())}
                className="mt-2"
              >
                Dismiss
              </Button>
            </Alert>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                {/* FIXED: Proper table structure with simple button */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense._id}>
                        <TableCell>{formatDate(expense.expenseDate)}</TableCell>
                        <TableCell>{expense.expenseType}</TableCell>
                        <TableCell className="font-medium">
                          {formatAmount(expense.amount)}
                        </TableCell>
                        <TableCell
                          className="max-w-xs truncate"
                          title={expense.description}
                        >
                          {expense.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(expense.status)}>
                            {expense.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {/* FIXED: Simple button instead of DropdownMenu */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedExpense(expense)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {expenses.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No expenses found. Create your first expense!
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-gray-700">
                    Page {pagination.page} of {pagination.totalPages}(
                    {pagination.totalDocs} total items)
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrevPage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNextPage}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Expense Detail Dialog */}
      <Dialog
        open={!!selectedExpense}
        onOpenChange={() => setSelectedExpense(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
            <DialogDescription>
              Complete information about your expense request
            </DialogDescription>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm">{selectedExpense.expenseType}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm">
                    {formatDate(selectedExpense.expenseDate)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-sm font-semibold">
                    {formatAmount(selectedExpense.amount)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={getStatusVariant(selectedExpense.status)}>
                    {selectedExpense.status}
                  </Badge>
                </div>
                {selectedExpense.billNumber && (
                  <div>
                    <Label className="text-sm font-medium">Bill Number</Label>
                    <p className="text-sm">{selectedExpense.billNumber}</p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm mt-1">{selectedExpense.description}</p>
              </div>

              {selectedExpense.rejectedReason && (
                <div>
                  <Label className="text-sm font-medium">
                    Rejection Reason
                  </Label>
                  <p className="text-sm mt-1 text-red-600">
                    {selectedExpense.rejectedReason}
                  </p>
                </div>
              )}

              {selectedExpense.proofs && selectedExpense.proofs.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Proof Files</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {selectedExpense.proofs.map((proof, index) => (
                      <Button key={index} variant="outline" size="sm" asChild>
                        <a
                          href={proof.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Proof {index + 1}
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserExpenseList;
