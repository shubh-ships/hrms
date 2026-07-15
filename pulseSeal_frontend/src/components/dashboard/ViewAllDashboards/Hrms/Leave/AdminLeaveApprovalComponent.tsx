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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  FileText,
  MessageSquare,
  Loader2,
  AlertCircle,
  History,
  Shield,
  Building,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getLeavesForApprovalByOrganization, // New import
  processLeaveApproval,
  getLeavesHistoryByOrganization,
  selectOrganizationLeavesForApproval, // New import
  selectOrganizationLeaveHistory,
  selectApprovalLoading,
  selectOrganizationApprovalLoading, // New import
  selectOrganizationHistoryLoading,
  selectLeaveError,
  clearLeaveError,
  removeLeaveFromOrganizationApprovalList, // New import
} from "@/features/leave/leaveSlice";

export default function AdminLeaveApprovalComponent() {
  const dispatch = useAppDispatch();
  const organizationLeavesForApproval = useAppSelector(selectOrganizationLeavesForApproval);
  const organizationLeaveHistory = useAppSelector(selectOrganizationLeaveHistory);
  const approvalLoading = useAppSelector(selectApprovalLoading);
  const orgApprovalLoading = useAppSelector(selectOrganizationApprovalLoading);
  const historyLoading = useAppSelector(selectOrganizationHistoryLoading);
  const error = useAppSelector(selectLeaveError);

  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [remarks, setRemarks] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<"approved" | "rejected">("approved");
  const [activeTab, setActiveTab] = useState("approvals");

  useEffect(() => {
    dispatch(getLeavesForApprovalByOrganization());
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

  // Safe array handling
  const safeOrganizationLeavesForApproval = Array.isArray(organizationLeavesForApproval) ? organizationLeavesForApproval : [];
  const safeOrganizationLeaveHistory = Array.isArray(organizationLeaveHistory) ? organizationLeaveHistory : [];

  // Metrics calculation
  const metrics = useMemo(() => ({
    totalApprovals: safeOrganizationLeavesForApproval.length,
    pending: safeOrganizationLeavesForApproval.filter(l => l.status === 'pending').length,
    thisWeek: safeOrganizationLeavesForApproval.filter(l => {
      const startDate = new Date(l.startDate);
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      return startDate >= weekStart;
    }).length,
    urgent: safeOrganizationLeavesForApproval.filter(l => {
      const startDate = new Date(l.startDate);
      const daysUntil = Math.ceil((startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 3;
    }).length,
    // History metrics
    totalHistory: safeOrganizationLeaveHistory.length,
    approved: safeOrganizationLeaveHistory.filter(l => l.status === 'approved').length,
    rejected: safeOrganizationLeaveHistory.filter(l => l.status === 'rejected').length,
  }), [safeOrganizationLeavesForApproval, safeOrganizationLeaveHistory]);

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

  const getEmployeeName = (employee: any) => {
    if (typeof employee === 'object' && employee.personal) {
      return `${employee.personal.firstName} ${employee.personal.lastName}`;
    }
    return 'Employee';
  };

  // Get employee name from approval history for history tab
  const getEmployeeNameFromHistory = (leave: any) => {
    if (leave.approvalHistory && leave.approvalHistory.length > 0) {
      const applicant = leave.approvalHistory.find((history: any) => history.status === 'pending');
      if (applicant && applicant.approverId && applicant.approverId.name) {
        return applicant.approverId.name;
      }
    }
    return 'Employee';
  };

  const handleApprovalAction = (leave: any, action: "approved" | "rejected") => {
    setSelectedLeave(leave);
    setActionType(action);
    setShowModal(true);
  };

  const confirmApproval = async () => {
    if (!selectedLeave) return;

    try {
      await dispatch(processLeaveApproval({
        leaveId: selectedLeave._id,
        status: actionType,
        remarks,
      })).unwrap();

      dispatch(removeLeaveFromOrganizationApprovalList(selectedLeave._id));
      dispatch(getLeavesHistoryByOrganization()); // Refresh history after approval
      toast.success(`Leave request ${actionType} successfully`);
      setShowModal(false);
      setSelectedLeave(null);
      setRemarks("");
    } catch (err: any) {
      toast.error(err || "Failed to process leave approval");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} border`}>
        <IconComponent size={12} className="mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getUrgencyBadge = (startDate: string) => {
    const daysUntil = Math.ceil((new Date(startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 1) {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Urgent</Badge>;
    } else if (daysUntil <= 3) {
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Soon</Badge>;
    }
    return null;
  };

  const showLeaveDetails = (leave: any) => {
    setSelectedLeave(leave);
    setShowModal(true);
  };

  return (
    <div className="p-6 space-y-6 bg-background text-foreground">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">Organization Leave Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve leave requests across the entire organization
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Shield className="h-4 w-4 mr-1" />
          Admin Portal
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="approvals">Organization Approvals</TabsTrigger>
          <TabsTrigger value="history">Organization History</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-6">
          {/* Approval Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: Building,
                title: metrics.totalApprovals,
                label: "Total Requests",
                color: "text-blue-600"
              },
              {
                icon: Clock,
                title: metrics.pending,
                label: "Pending",
                color: "text-yellow-600"
              },
              {
                icon: Calendar,
                title: metrics.thisWeek,
                label: "This Week",
                color: "text-green-600"
              },
              {
                icon: AlertCircle,
                title: metrics.urgent,
                label: "Urgent",
                color: "text-red-600"
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

          {/* Organization Leave Approval Table */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                <Building className="mr-2" />
                Organization Pending Approvals ({metrics.pending})
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Review and approve leave requests from all employees across the organization
              </p>
            </CardHeader>
            <CardContent>
              {orgApprovalLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading organization leave requests...</span>
                </div>
              ) : safeOrganizationLeavesForApproval.length === 0 ? (
                <div className="text-center py-12">
                  <Clock size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No pending approvals
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    All organization leave requests have been processed.
                  </p>
                </div>
              ) : (
                <div className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-muted/50">
                        <TableHead className="text-foreground w-[20%]">Employee</TableHead>
                        <TableHead className="text-foreground w-[15%]">Leave Type</TableHead>
                        <TableHead className="text-foreground w-[20%]">Duration</TableHead>
                        <TableHead className="text-foreground w-[12%]">Status</TableHead>
                        <TableHead className="text-foreground w-[25%]">Reason</TableHead>
                        <TableHead className="text-foreground w-[8%]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {safeOrganizationLeavesForApproval.map((leave) => (
                        <TableRow
                          key={leave._id}
                          className="border-border hover:bg-muted/50"
                        >
                          <TableCell className="w-[20%]">
                            <div className="flex items-center space-x-2">
                              <User className="text-gray-400" size={16} />
                              <div>
                                <p className="font-medium text-foreground">
                                  {getEmployeeName(leave.employeeId)}
                                </p>
                                <div className="flex space-x-1">
                                  {getUrgencyBadge(leave.startDate)}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="w-[15%]">
                            <div>
                              <p className="font-medium capitalize text-foreground">
                                {leave.leaveType}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {leave.durationType}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="w-[20%]">
                            <div className="space-y-1">
                              <p className="text-sm flex items-center text-foreground">
                                <Calendar size={14} className="mr-1" />
                                {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {leave.totalDays} days
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="w-[12%]">
                            {getStatusBadge(leave.status)}
                          </TableCell>
                          <TableCell className="w-[25%]">
                            <div className="truncate max-w-xs" title={leave.reason}>
                              {leave.reason}
                            </div>
                          </TableCell>
                          <TableCell className="w-[8%]">
                            {leave.status === 'pending' && (
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleApprovalAction(leave, 'approved')}
                                  disabled={approvalLoading}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle size={14} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleApprovalAction(leave, 'rejected')}
                                  disabled={approvalLoading}
                                >
                                  <XCircle size={14} />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* History Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                icon: History,
                title: metrics.totalHistory,
                label: "Total Processed",
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

          {/* Organization History Table */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                <History className="mr-2" />
                Organization Approval History ({metrics.totalHistory})
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Complete history of processed leave requests across the organization
              </p>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading organization history...</span>
                </div>
              ) : safeOrganizationLeaveHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No approval history
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No organization leave requests have been processed yet.
                  </p>
                </div>
              ) : (
                <div className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-muted/50">
                        <TableHead className="text-foreground w-[18%]">Employee</TableHead>
                        <TableHead className="text-foreground w-[15%]">Leave Type</TableHead>
                        <TableHead className="text-foreground w-[20%]">Duration</TableHead>
                        <TableHead className="text-foreground w-[12%]">Status</TableHead>
                        <TableHead className="text-foreground w-[15%]">Applied Date</TableHead>
                        <TableHead className="text-foreground w-[12%]">Total Days</TableHead>
                        <TableHead className="text-foreground w-[8%]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {safeOrganizationLeaveHistory.slice(0, 100).map((leave) => (
                        <TableRow
                          key={leave._id}
                          className="border-border hover:bg-muted/50"
                        >
                          <TableCell className="w-[18%]">
                            <div className="flex items-center space-x-2">
                              <User className="text-gray-400" size={16} />
                              <span className="font-medium text-foreground">
                                {getEmployeeNameFromHistory(leave)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="w-[15%]">
                            <div>
                              <p className="font-medium capitalize text-foreground">
                                {leave.leaveType}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {leave.durationType}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="w-[20%]">
                            <div className="space-y-1">
                              <p className="text-sm flex items-center text-foreground">
                                <Calendar size={14} className="mr-1" />
                                {formatDate(leave.startDate)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                to {formatDate(leave.endDate)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="w-[12%]">
                            {getStatusBadge(leave.status)}
                          </TableCell>
                          <TableCell className="w-[15%] text-sm text-muted-foreground">
                            {formatDate(leave.createdAt)}
                          </TableCell>
                          <TableCell className="w-[12%]">
                            <span className="font-medium text-foreground">
                              {leave.totalDays} days
                            </span>
                          </TableCell>
                          <TableCell className="w-[8%]">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => showLeaveDetails(leave)}
                            >
                              <FileText size={14} className="mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Responsive Approval/Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b border-border bg-muted/50">
            <DialogTitle className="text-lg font-semibold">
              {selectedLeave && activeTab === 'approvals' ? 
                `${actionType === 'approved' ? 'Approve' : 'Reject'} Leave Request` : 
                'Leave Request Details'
              }
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[calc(90vh-4rem)]">
            <div className="p-4 space-y-4">
              {selectedLeave && (
                <>
                  {/* Employee and Leave Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Employee</label>
                      <p className="font-medium text-foreground">
                        {activeTab === 'approvals' ? 
                          getEmployeeName(selectedLeave.employeeId) : 
                          getEmployeeNameFromHistory(selectedLeave)
                        }
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Leave Type</label>
                      <p className="font-medium capitalize text-foreground">{selectedLeave.leaveType}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Duration</label>
                      <p className="font-medium text-foreground">
                        {formatDate(selectedLeave.startDate)} - {formatDate(selectedLeave.endDate)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">Total Days</label>
                      <p className="font-medium text-foreground">
                        {selectedLeave.totalDays} days ({selectedLeave.durationType})
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Reason</label>
                    <div className="p-3 bg-muted rounded-md border">
                      <p className="text-foreground text-sm">{selectedLeave.reason}</p>
                    </div>
                  </div>

                  {activeTab === 'approvals' && selectedLeave.status === 'pending' ? (
                    // Approval Form
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center">
                          <MessageSquare size={14} className="mr-1" />
                          Remarks (Optional)
                        </label>
                        <Textarea
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Add any comments or reasons..."
                          rows={3}
                        />
                      </div>

                      <div className="flex space-x-3 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setShowModal(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={confirmApproval}
                          disabled={approvalLoading}
                          className={`flex-1 ${
                            actionType === 'approved' 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-red-600 hover:bg-red-700'
                          } text-white`}
                        >
                          {approvalLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            `Confirm ${actionType === 'approved' ? 'Approval' : 'Rejection'}`
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    // View Only - Show approval history if available
                    selectedLeave.approvalHistory && selectedLeave.approvalHistory.length > 0 && (
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground">Approval History</label>
                        <div className="space-y-2">
                          {selectedLeave.approvalHistory.map((approval: any, index: number) => (
                            <div key={index} className="p-3 bg-muted rounded-md border-l-4 border-l-blue-500">
                              <div className="flex items-center justify-between mb-2">
                                {getStatusBadge(approval.status)}
                                <span className="text-xs text-muted-foreground">
                                  {formatDateTime(approval.date)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <UserCheck size={14} className="text-gray-500" />
                                <div>
                                  <p className="text-sm font-medium text-foreground">
                                    {approval.approverId?.name || 'Unknown User'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {approval.approverId?.email || 'No email'}
                                  </p>
                                </div>
                              </div>
                              {approval.remarks && (
                                <div className="mt-2 p-2 bg-background rounded border-dashed border">
                                  <p className="text-sm text-foreground">"{approval.remarks}"</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
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
