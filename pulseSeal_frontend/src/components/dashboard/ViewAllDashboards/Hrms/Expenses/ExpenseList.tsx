"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import {
  getAllExpenses,
  updateExpenseStatus,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Eye,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  ExternalLink,
  User,
} from "lucide-react";

const AdminExpenseList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { expenses, loading, error, pagination, filters } = useSelector(
    (state: RootState) => state.expense
  );

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<{
    id: string;
    status: string;
    rejectedReason?: string;
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, [filters]);

  const loadExpenses = () => {
    dispatch(getAllExpenses(filters));
  };

  const handleFilterChange = (newFilters: Partial<ExpenseFilters>) => {
    dispatch(setFilters({ ...filters, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    dispatch(setFilters({ ...filters, page }));
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdate) return;

    try {
      const updateData = {
        status: statusUpdate.status,
        ...(statusUpdate.rejectedReason && {
          rejectedReason: statusUpdate.rejectedReason,
        }),
      };

      await dispatch(
        updateExpenseStatus({
          id: statusUpdate.id,
          updateData,
        })
      ).unwrap();

      setStatusUpdate(null);
      loadExpenses();
    } catch (error) {
      console.error("Failed to update expense status:", error);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Approved":
        return "default";
      case "Rejected":
        return "destructive";
      case "Pending":
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

  const getEmployeeName = (expense: Expense) => {
    if (!expense.employee) return "Unknown Employee";
    if (typeof expense.employee === "object" && expense.employee.name) {
      return expense.employee.name;
    }
    return "Unknown Employee";
  };

  const getEmployeeEmail = (expense: Expense) => {
    if (!expense.employee) return "";
    if (typeof expense.employee === "object" && expense.employee.email) {
      return expense.employee.email;
    }
    return "";
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
          <CardTitle>All Expense Requests</CardTitle>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) =>
                    handleFilterChange({
                      status: value === "all" ? undefined : (value as ExpenseStatus),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={filters.expenseType || "all"}
                  onValueChange={(value) =>
                    handleFilterChange({
                      expenseType: value === "all" ? undefined : (value as ExpenseType),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) =>
                    handleFilterChange({
                      startDate: e.target.value || undefined,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) =>
                    handleFilterChange({ endDate: e.target.value || undefined })
                  }
                />
              </div>

              <div className="md:col-span-4 flex justify-end">
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Employee</TableHead>
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
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span>{getEmployeeName(expense)}</span>
                          </div>
                          {getEmployeeEmail(expense) && (
                            <div className="text-xs text-gray-500 mt-1">
                              {getEmployeeEmail(expense)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedExpense(expense)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {expense.status === "Pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setStatusUpdate({
                                      id: expense._id,
                                      status: "Approved",
                                    })
                                  }
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setStatusUpdate({
                                      id: expense._id,
                                      status: "Rejected",
                                    })
                                  }
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {expenses.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No expenses found matching your criteria.
                </div>
              )}

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

      <Dialog
        open={!!selectedExpense}
        onOpenChange={() => setSelectedExpense(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
            <DialogDescription>
              Complete information about this expense request
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
                <div>
                  <Label className="text-sm font-medium">Employee</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">
                        {getEmployeeName(selectedExpense)}
                      </p>
                      {getEmployeeEmail(selectedExpense) && (
                        <p className="text-xs text-gray-500">
                          {getEmployeeEmail(selectedExpense)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
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

      <AlertDialog
        open={!!statusUpdate}
        onOpenChange={() => setStatusUpdate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusUpdate?.status === "Approved" ? "Approve" : "Reject"}{" "}
              Expense
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {statusUpdate?.status.toLowerCase()} this
              expense request?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {statusUpdate?.status === "Rejected" && (
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={statusUpdate.rejectedReason || ""}
                onChange={(e) =>
                  setStatusUpdate({
                    ...statusUpdate,
                    rejectedReason: e.target.value,
                  })
                }
                placeholder="Please provide a reason for rejection"
                className="resize-none"
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusUpdate}
              disabled={
                statusUpdate?.status === "Rejected" &&
                !statusUpdate.rejectedReason?.trim()
              }
              className={
                statusUpdate?.status === "Approved"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              Confirm {statusUpdate?.status}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminExpenseList;
