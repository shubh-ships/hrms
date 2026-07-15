"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area"; // Add this import
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp,
  BarChart3,
  UserCheck,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getLeavesHistoryByOrganization,
  selectOrganizationLeaveHistory,
  selectOrganizationHistoryLoading,
  selectLeaveError,
  clearLeaveError,
} from "@/features/leave/leaveSlice";

export default function AdminLeaveHistoryComponent() {
  const dispatch = useAppDispatch();
  const organizationLeaveHistory = useAppSelector(selectOrganizationLeaveHistory);
  const loading = useAppSelector(selectOrganizationHistoryLoading);
  const error = useAppSelector(selectLeaveError);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(getLeavesHistoryByOrganization());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearLeaveError());
    };
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearLeaveError());
    }
  }, [error, dispatch]);

  const safeOrganizationLeaveHistory = Array.isArray(organizationLeaveHistory) ? organizationLeaveHistory : [];

  // Metrics calculation with safe array
  const metrics = useMemo(() => ({
    total: safeOrganizationLeaveHistory.length,
    approved: safeOrganizationLeaveHistory.filter(l => l.status === 'approved').length,
    rejected: safeOrganizationLeaveHistory.filter(l => l.status === 'rejected').length,
    pending: safeOrganizationLeaveHistory.filter(l => l.status === 'pending').length,
    thisMonth: safeOrganizationLeaveHistory.filter(l => {
      const leaveDate = new Date(l.createdAt);
      const now = new Date();
      return leaveDate.getMonth() === now.getMonth() && leaveDate.getFullYear() === now.getFullYear();
    }).length,
  }), [safeOrganizationLeaveHistory]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Function to get employee name from the first approval history (applicant)
  const getEmployeeName = (leave: any) => {
    if (leave.approvalHistory && leave.approvalHistory.length > 0) {
      const applicant = leave.approvalHistory.find((history: any) => history.status === 'pending');
      if (applicant && applicant.approverId && applicant.approverId.name) {
        return applicant.approverId.name;
      }
    }
    return 'Employee';
  };

  // Function to get approver name from approval history
  const getApproverName = (leave: any) => {
    if (leave.approvalHistory && leave.approvalHistory.length > 1) {
      const approver = leave.approvalHistory.find((history: any) => 
        history.status === 'approved' || history.status === 'rejected'
      );
      if (approver && approver.approverId && approver.approverId.name) {
        return approver.approverId.name;
      }
    }
    return 'Not processed yet';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-300'
    };

    const statusIcon = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      cancelled: XCircle
    };

    const IconComponent = statusIcon[status as keyof typeof statusIcon] || Clock;

    return (
      <Badge className={`${statusConfig[status as keyof typeof statusConfig] || statusConfig.pending} border`}>
        <IconComponent size={12} className="mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredLeaves = useMemo(() => {
    return safeOrganizationLeaveHistory.filter(leave => {
      const employeeName = getEmployeeName(leave).toLowerCase();
      const approverName = getApproverName(leave).toLowerCase();
      const matchesSearch = employeeName.includes(searchTerm.toLowerCase()) || 
                           approverName.includes(searchTerm.toLowerCase()) ||
                           leave.leaveType.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || leave.status === statusFilter;
      const matchesLeaveType = leaveTypeFilter === 'all' || leave.leaveType === leaveTypeFilter;
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const leaveDate = new Date(leave.createdAt);
        const now = new Date();
        
        switch (dateFilter) {
          case 'thisMonth':
            matchesDate = leaveDate.getMonth() === now.getMonth() && 
                         leaveDate.getFullYear() === now.getFullYear();
            break;
          case 'lastMonth':
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
            matchesDate = leaveDate.getMonth() === lastMonth.getMonth() && 
                         leaveDate.getFullYear() === lastMonth.getFullYear();
            break;
          case 'thisYear':
            matchesDate = leaveDate.getFullYear() === now.getFullYear();
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesLeaveType && matchesDate;
    });
  }, [safeOrganizationLeaveHistory, searchTerm, statusFilter, leaveTypeFilter, dateFilter]);

  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeaves = filteredLeaves.slice(startIndex, startIndex + itemsPerPage);

  const leaveTypes = Array.from(new Set(safeOrganizationLeaveHistory.map(leave => leave.leaveType)));

  const exportToCSV = () => {
    if (filteredLeaves.length === 0) {
      toast.error("No data to export");
      return;
    }

    const csvContent = [
      ['Employee', 'Leave Type', 'Start Date', 'End Date', 'Total Days', 'Status', 'Applied Date', 'Approved By', 'Reason'].join(','),
      ...filteredLeaves.map(leave => [
        getEmployeeName(leave),
        leave.leaveType,
        formatDate(leave.startDate),
        formatDate(leave.endDate),
        leave.totalDays,
        leave.status,
        formatDate(leave.createdAt),
        getApproverName(leave),
        `"${leave.reason.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `organization-leave-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("CSV exported successfully!");
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setLeaveTypeFilter('all');
    setDateFilter('all');
    setCurrentPage(1);
  };

  const showLeaveDetails = (leave: any) => {
    setSelectedLeave(leave);
    setShowDetailsModal(true);
  };

  return (
    <div className="p-6 space-y-6 bg-background text-foreground">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">Organization Leave History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage all leave requests across the organization
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="px-3 py-1">
            <History className="h-4 w-4 mr-1" />
            Admin Portal
          </Badge>
          <Button onClick={exportToCSV} className="bg-blue-600 hover:bg-blue-700" disabled={safeOrganizationLeaveHistory.length === 0}>
            <Download size={16} className="mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            icon: BarChart3,
            title: metrics.total,
            label: "Total Requests",
            color: "text-blue-600"
          },
          {
            icon: CheckCircle,
            title: metrics.approved,
            label: "Approved",
            color: "text-green-600"
          },
          {
            icon: XCircle,
            title: metrics.rejected,
            label: "Rejected",
            color: "text-red-600"
          },
          {
            icon: Clock,
            title: metrics.pending,
            label: "Pending",
            color: "text-yellow-600"
          },
          {
            icon: TrendingUp,
            title: metrics.thisMonth,
            label: "This Month",
            color: "text-purple-600"
          },
        ].map(({ icon: Icon, title, label, color }, index) => (
          <Card key={index} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{title}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={16} />
              <Input
                placeholder="Search employee, approver or leave type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Leave Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leave Types</SelectItem>
                {leaveTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="thisYear">This Year</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={clearFilters} variant="outline" className="w-full">
              <Filter size={16} className="mr-2" />
              Clear Filters
            </Button>
          </div>

          <div className="mt-4 text-sm text-muted-foreground flex items-center justify-between">
            <span>{filteredLeaves.length} of {safeOrganizationLeaveHistory.length} requests</span>
          </div>
        </CardContent>
      </Card>

      {/* Leave History Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">
            All Organization Leave Requests
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Complete history of leave requests across the entire organization
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading organization leave history...</span>
            </div>
          ) : paginatedLeaves.length === 0 ? (
            <div className="text-center py-12">
              <History size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No leave history found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {safeOrganizationLeaveHistory.length === 0 ? "No leave requests have been made yet." : "Try adjusting your filters or search criteria."}
              </p>
            </div>
          ) : (
            <>
              <div className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-muted/50">
                      <TableHead className="text-foreground w-[16%]">Employee</TableHead>
                      <TableHead className="text-foreground w-[14%]">Leave Type</TableHead>
                      <TableHead className="text-foreground w-[18%]">Duration</TableHead>
                      <TableHead className="text-foreground w-[10%]">Status</TableHead>
                      <TableHead className="text-foreground w-[16%]">Approved By</TableHead>
                      <TableHead className="text-foreground w-[13%]">Applied Date</TableHead>
                      <TableHead className="text-foreground w-[8%]">Days</TableHead>
                      <TableHead className="text-foreground w-[5%]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLeaves.map((leave) => (
                      <TableRow
                        key={leave._id}
                        className="border-border hover:bg-muted/50"
                      >
                        <TableCell className="w-[16%]">
                          <div className="flex items-center space-x-2">
                            <User className="text-gray-400" size={16} />
                            <div>
                              <p className="font-medium text-foreground text-sm">
                                {getEmployeeName(leave)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="w-[14%]">
                          <div>
                            <p className="font-medium capitalize text-foreground text-sm">
                              {leave.leaveType}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {leave.durationType}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="w-[18%]">
                          <div className="space-y-1">
                            <p className="text-sm flex items-center text-foreground">
                              <Calendar size={12} className="mr-1" />
                              {formatDate(leave.startDate)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              to {formatDate(leave.endDate)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="w-[10%]">
                          {getStatusBadge(leave.status)}
                        </TableCell>
                        <TableCell className="w-[16%]">
                          <div className="flex items-center space-x-2">
                            <UserCheck className="text-gray-400" size={14} />
                            <div>
                              <p className="font-medium text-foreground text-sm">
                                {getApproverName(leave)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="w-[13%] text-xs text-muted-foreground">
                          {formatDate(leave.createdAt)}
                        </TableCell>
                        <TableCell className="w-[8%]">
                          <span className="font-medium text-foreground text-sm">
                            {leave.totalDays}
                          </span>
                        </TableCell>
                        <TableCell className="w-[5%]">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => showLeaveDetails(leave)}
                          >
                            <FileText size={12} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredLeaves.length)} of {filteredLeaves.length} results
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                        if (pageNum > totalPages) return null;
                        
                        return (
                          <Button
                            key={pageNum}
                            size="sm"
                            variant={currentPage === pageNum ? "default" : "outline"}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Responsive & Scrollable Leave Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b border-border bg-muted/50">
            <DialogTitle className="text-lg font-semibold">Leave Request Details</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[calc(90vh-4rem)]">
            <div className="p-4 space-y-6">
              {selectedLeave && (
                <>
                  {/* Basic Info Grid - Responsive */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Employee</label>
                      <p className="font-medium text-foreground">{getEmployeeName(selectedLeave)}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Leave Type</label>
                      <p className="font-medium capitalize text-foreground">{selectedLeave.leaveType}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Duration Type</label>
                      <p className="font-medium text-foreground">{selectedLeave.durationType}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                      <p className="font-medium text-foreground">{formatDate(selectedLeave.startDate)}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">End Date</label>
                      <p className="font-medium text-foreground">{formatDate(selectedLeave.endDate)}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Total Days</label>
                      <p className="font-medium text-foreground">{selectedLeave.totalDays} days</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedLeave.status)}</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Applied Date</label>
                      <p className="font-medium text-foreground">{formatDate(selectedLeave.createdAt)}</p>
                    </div>
                  </div>
                  
                  {/* Reason Section */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Reason</label>
                    <div className="p-3 bg-muted rounded-md border">
                      <p className="text-foreground text-sm leading-relaxed">{selectedLeave.reason}</p>
                    </div>
                  </div>

                  {/* Approval History Section */}
                  {selectedLeave.approvalHistory && selectedLeave.approvalHistory.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-muted-foreground">Approval History</label>
                      <div className="space-y-3">
                        {selectedLeave.approvalHistory.map((approval: any, index: number) => (
                          <div key={index} className="p-4 bg-muted rounded-lg border-l-4 border-l-blue-500">
                            <div className="space-y-3">
                              {/* Header with status and timestamp */}
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  {getStatusBadge(approval.status)}
                                  {approval.status === 'pending' && (
                                    <span className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded">
                                      📝 Application Submitted
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatDateTime(approval.date)}
                                </span>
                              </div>
                              
                              {/* User Info */}
                              <div className="flex items-start gap-3 p-3 bg-background rounded-md border">
                                <User size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-foreground text-sm">
                                    {approval.approverId?.name || 'Unknown User'}
                                  </p>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <Mail size={10} className="flex-shrink-0" />
                                    <span className="truncate">{approval.approverId?.email || 'No email'}</span>
                                  </div>
                                  
                                  {/* Role indicator */}
                                  <div className="mt-2">
                                    {approval.status === 'pending' ? (
                                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                        👤 Leave Applicant
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                        👨‍💼 Approving Manager
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Remarks */}
                              {(approval.status === 'approved' || approval.status === 'rejected') && approval.remarks && (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground">Manager's Remarks:</p>
                                  <div className="p-3 bg-background rounded-md border border-dashed">
                                    <p className="text-sm text-foreground leading-relaxed">
                                      "{approval.remarks}"
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
