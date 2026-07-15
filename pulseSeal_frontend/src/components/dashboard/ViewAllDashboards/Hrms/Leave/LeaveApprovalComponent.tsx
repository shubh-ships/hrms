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
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getLeavesForApproval,
  processLeaveApproval,
  getLeavesHistory,
  selectLeavesForApproval,
  selectLeaveHistory,
  selectApprovalLoading,
  selectLeaveLoading,
  selectLeaveError,
  clearLeaveError,
  removeLeaveFromApprovalList,
} from "@/features/leave/leaveSlice";

export default function LeaveApprovalComponent() {
  const dispatch = useAppDispatch();
  const leavesForApproval = useAppSelector(selectLeavesForApproval);
  const leaveHistory = useAppSelector(selectLeaveHistory);
  const approvalLoading = useAppSelector(selectApprovalLoading);
  const loading = useAppSelector(selectLeaveLoading);
  const error = useAppSelector(selectLeaveError);

  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [remarks, setRemarks] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<"approved" | "rejected">("approved");
  const [activeTab, setActiveTab] = useState("approvals");

  useEffect(() => {
    dispatch(getLeavesForApproval());
    dispatch(getLeavesHistory());
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

  // Fix: Ensure arrays are always arrays before using array methods
  const safeLeavesForApproval = Array.isArray(leavesForApproval) ? leavesForApproval : [];
  const safeLeaveHistory = Array.isArray(leaveHistory) ? leaveHistory : [];

  // Metrics calculation with safe arrays
  const metrics = useMemo(() => ({
    totalApprovals: safeLeavesForApproval.length,
    pending: safeLeavesForApproval.filter(l => l.status === 'pending').length,
    thisWeek: safeLeavesForApproval.filter(l => {
      const startDate = new Date(l.startDate);
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      return startDate >= weekStart;
    }).length,
    urgent: safeLeavesForApproval.filter(l => {
      const startDate = new Date(l.startDate);
      const daysUntil = Math.ceil((startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 3;
    }).length,
    // History metrics
    totalHistory: safeLeaveHistory.length,
    approved: safeLeaveHistory.filter(l => l.status === 'approved').length,
    rejected: safeLeaveHistory.filter(l => l.status === 'rejected').length,
  }), [safeLeavesForApproval, safeLeaveHistory]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getEmployeeName = (employee: any) => {
    if (typeof employee === 'object' && employee.personal) {
      return `${employee.personal.firstName} ${employee.personal.lastName}`;
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

      dispatch(removeLeaveFromApprovalList(selectedLeave._id));
      dispatch(getLeavesHistory());
      toast.success(`Leave request ${actionType} successfully`);
      setShowModal(false);
      setSelectedLeave(null);
      setRemarks("");
    } catch (err: any) {
      toast.error(err || "Failed to process leave approval");
    }
  };

  // FIX: Add null check and default fallback for status
  const getStatusBadge = (status: string | null | undefined) => {
    // Provide a default status if undefined or null
    const safeStatus = status || 'pending';
    
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle }
    };

    const config = statusConfig[safeStatus as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} border`}>
        <IconComponent size={12} className="mr-1" />
        {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
      </Badge>
    );
  };

  const getUrgencyBadge = (startDate: string) => {
    if (!startDate) return null; // Add null check for startDate
    
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
    <div className="min-h-screen bg-gray-50 dark:bg-[#1e2939] py-8 px-4 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Leave Management</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Review and approve leave requests, view approval history
            </p>
          </div>
          <Badge variant="outline" className="px-4 py-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Manager Portal
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="approvals" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Pending Approvals
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Approval History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="approvals" className="space-y-8">
            {/* Approval Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  icon: FileText,
                  title: metrics.totalApprovals,
                  label: "Total Requests",
                  color: "text-blue-600",
                  bgColor: "bg-blue-50 dark:bg-blue-900/20"
                },
                {
                  icon: Clock,
                  title: metrics.pending,
                  label: "Pending",
                  color: "text-yellow-600",
                  bgColor: "bg-yellow-50 dark:bg-yellow-900/20"
                },
                {
                  icon: Calendar,
                  title: metrics.thisWeek,
                  label: "This Week",
                  color: "text-green-600",
                  bgColor: "bg-green-50 dark:bg-green-900/20"
                },
                {
                  icon: AlertCircle,
                  title: metrics.urgent,
                  label: "Urgent",
                  color: "text-red-600",
                  bgColor: "bg-red-50 dark:bg-red-900/20"
                },
              ].map(({ icon: Icon, title, label, color, bgColor }, index) => (
                <Card key={index} className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{title}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${bgColor}`}>
                        <Icon className={`h-6 w-6 ${color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Leave Approval Table */}
            <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <CheckCircle className="mr-2" />
                  Pending Approvals ({metrics.pending})
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Review and approve leave requests from your team
                </p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Loading leave requests...</span>
                  </div>
                ) : safeLeavesForApproval.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No pending approvals
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      All leave requests have been processed.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-200 dark:border-gray-700">
                          <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Employee</TableHead>
                          <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Leave Type</TableHead>
                          <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Duration</TableHead>
                          <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Status</TableHead>
                          <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Reason</TableHead>
                          <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {safeLeavesForApproval.map((leave) => (
                          <TableRow
                            key={leave._id}
                            className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                                  <User size={16} className="text-gray-600 dark:text-gray-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {getEmployeeName(leave.employeeId)}
                                  </p>
                                  <div className="flex space-x-1 mt-1">
                                    {getUrgencyBadge(leave.startDate)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium capitalize text-gray-900 dark:text-white">
                                  {leave.leaveType || 'Not specified'}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {leave.durationType || 'Full Day'}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm flex items-center text-gray-900 dark:text-white">
                                  <Calendar size={14} className="mr-1" />
                                  {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {leave.totalDays || 0} days
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(leave.status)}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                <p className="truncate text-gray-900 dark:text-white" title={leave.reason}>
                                  {leave.reason || 'No reason provided'}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {leave.status === 'pending' && (
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprovalAction(leave, 'approved')}
                                    disabled={approvalLoading}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <CheckCircle size={14} className="mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleApprovalAction(leave, 'rejected')}
                                    disabled={approvalLoading}
                                  >
                                    <XCircle size={14} className="mr-1" />
                                    Reject
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

          <TabsContent value="history" className="space-y-8">
            {/* History Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                {
                  icon: History,
                  title: metrics.totalHistory,
                  label: "Total Processed",
                  color: "text-blue-600",
                  bgColor: "bg-blue-50 dark:bg-blue-900/20"
                },
                {
                  icon: CheckCircle,
                  title: metrics.approved,
                  label: "Approved",
                  color: "text-green-600",
                  bgColor: "bg-green-50 dark:bg-green-900/20"
                },
                {
                  icon: XCircle,
                  title: metrics.rejected,
                  label: "Rejected",
                  color: "text-red-600",
                  bgColor: "bg-red-50 dark:bg-red-900/20"
                },
              ].map(({ icon: Icon, title, label, color, bgColor }, index) => (
                <Card key={index} className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{title}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${bgColor}`}>
                        <Icon className={`h-6 w-6 ${color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Leave History Table */}
            <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <History className="mr-2" />
                  Approval History ({metrics.totalHistory})
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  History of leave requests you have processed
                </p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Loading leave history...</span>
                  </div>
                ) : safeLeaveHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <History size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No approval history
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      No leave requests have been processed yet.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-200 dark:border-gray-700">
                          <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Employee</TableHead>
                          <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Leave Type</TableHead>
                          <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Duration</TableHead>
                          <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Status</TableHead>
                          <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Applied Date</TableHead>
                          <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Total Days</TableHead>
                          <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {safeLeaveHistory.slice(0, 50).map((leave) => (
                          <TableRow
                            key={leave._id}
                            className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                                  <User size={16} className="text-gray-600 dark:text-gray-400" />
                                </div>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {getEmployeeName(leave.employeeId)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium capitalize text-gray-900 dark:text-white">
                                  {leave.leaveType || 'Not specified'}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {leave.durationType || 'Full Day'}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm flex items-center text-gray-900 dark:text-white">
                                  <Calendar size={14} className="mr-1" />
                                  {formatDate(leave.startDate)}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  to {formatDate(leave.endDate)}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(leave.status)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(leave.createdAt)}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {leave.totalDays || 0} days
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => showLeaveDetails(leave)}
                                className="border-gray-300 dark:border-gray-600"
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

        {/* Approval Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">
                {actionType === 'approved' ? 'Approve' : 'Reject'} Leave Request
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to {actionType === 'approved' ? 'approve' : 'reject'} this leave request for{' '}
                <span className="font-medium text-gray-900 dark:text-white">
                  {getEmployeeName(selectedLeave?.employeeId)}
                </span>?
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center text-gray-700 dark:text-gray-300">
                  <MessageSquare size={14} className="mr-1" />
                  Remarks (Optional)
                </label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add any comments or reasons..."
                  rows={3}
                  className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border-gray-300 dark:border-gray-600"
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
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}



// "use client";

// import { useState, useEffect, useMemo } from "react";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import {
//   Tabs,
//   TabsContent,
//   TabsList,
//   TabsTrigger,
// } from "@/components/ui/tabs";
// import {
//   CheckCircle,
//   XCircle,
//   Clock,
//   User,
//   Calendar,
//   FileText,
//   MessageSquare,
//   Loader2,
//   AlertCircle,
//   History,
// } from "lucide-react";
// import { toast } from "sonner";
// import { useAppDispatch, useAppSelector } from "@/store/hooks";
// import {
//   getLeavesForApproval,
//   processLeaveApproval,
//   getLeavesHistory, // Add this import
//   selectLeavesForApproval,
//   selectLeaveHistory, // Add this import
//   selectApprovalLoading,
//   selectLeaveLoading,
//   selectLeaveError,
//   clearLeaveError,
//   removeLeaveFromApprovalList,
// } from "@/features/leave/leaveSlice";

// export default function LeaveApprovalComponent() {
//   const dispatch = useAppDispatch();
//   const leavesForApproval = useAppSelector(selectLeavesForApproval);
//   const leaveHistory = useAppSelector(selectLeaveHistory); // Add this
//   const approvalLoading = useAppSelector(selectApprovalLoading);
//   const loading = useAppSelector(selectLeaveLoading);
//   const error = useAppSelector(selectLeaveError);

//   const [selectedLeave, setSelectedLeave] = useState<any>(null);
//   const [remarks, setRemarks] = useState("");
//   const [showModal, setShowModal] = useState(false);
//   const [actionType, setActionType] = useState<"approved" | "rejected">("approved");
//   const [activeTab, setActiveTab] = useState("approvals"); // Add tab state

//   useEffect(() => {
//     dispatch(getLeavesForApproval());
//     dispatch(getLeavesHistory()); // Fetch leave history too
//   }, [dispatch]);

//   useEffect(() => {
//     return () => {
//       dispatch(clearLeaveError());
//     };
//   }, [dispatch]);

//   useEffect(() => {
//     if (error) {
//       toast.error(error);
//       dispatch(clearLeaveError());
//     }
//   }, [error, dispatch]);

//   // Fix: Ensure arrays are always arrays before using array methods
//   const safeLeavesForApproval = Array.isArray(leavesForApproval) ? leavesForApproval : [];
//   const safeLeaveHistory = Array.isArray(leaveHistory) ? leaveHistory : []; // Add this

//   // Metrics calculation with safe arrays
//   const metrics = useMemo(() => ({
//     totalApprovals: safeLeavesForApproval.length,
//     pending: safeLeavesForApproval.filter(l => l.status === 'pending').length,
//     thisWeek: safeLeavesForApproval.filter(l => {
//       const startDate = new Date(l.startDate);
//       const now = new Date();
//       const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
//       return startDate >= weekStart;
//     }).length,
//     urgent: safeLeavesForApproval.filter(l => {
//       const startDate = new Date(l.startDate);
//       const daysUntil = Math.ceil((startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
//       return daysUntil <= 3;
//     }).length,
//     // History metrics
//     totalHistory: safeLeaveHistory.length,
//     approved: safeLeaveHistory.filter(l => l.status === 'approved').length,
//     rejected: safeLeaveHistory.filter(l => l.status === 'rejected').length,
//   }), [safeLeavesForApproval, safeLeaveHistory]);

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//     });
//   };

//   const getEmployeeName = (employee: any) => {
//     if (typeof employee === 'object' && employee.personal) {
//       return `${employee.personal.firstName} ${employee.personal.lastName}`;
//     }
//     return 'Employee';
//   };

//   const handleApprovalAction = (leave: any, action: "approved" | "rejected") => {
//     setSelectedLeave(leave);
//     setActionType(action);
//     setShowModal(true);
//   };

//   const confirmApproval = async () => {
//     if (!selectedLeave) return;

//     try {
//       await dispatch(processLeaveApproval({
//         leaveId: selectedLeave._id,
//         status: actionType,
//         remarks,
//       })).unwrap();

//       dispatch(removeLeaveFromApprovalList(selectedLeave._id));
//       dispatch(getLeavesHistory()); // Refresh history after approval
//       toast.success(`Leave request ${actionType} successfully`);
//       setShowModal(false);
//       setSelectedLeave(null);
//       setRemarks("");
//     } catch (err: any) {
//       toast.error(err || "Failed to process leave approval");
//     }
//   };

//   const getStatusBadge = (status: string) => {
//     const statusConfig = {
//       pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
//       approved: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
//       rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle }
//     };

//     const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
//     const IconComponent = config.icon;

//     return (
//       <Badge className={`${config.color} border`}>
//         <IconComponent size={12} className="mr-1" />
//         {status.charAt(0).toUpperCase() + status.slice(1)}
//       </Badge>
//     );
//   };

//   const getUrgencyBadge = (startDate: string) => {
//     const daysUntil = Math.ceil((new Date(startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
//     if (daysUntil <= 1) {
//       return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Urgent</Badge>;
//     } else if (daysUntil <= 3) {
//       return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Soon</Badge>;
//     }
//     return null;
//   };

//   const showLeaveDetails = (leave: any) => {
//     setSelectedLeave(leave);
//     setShowModal(true);
//   };

//   return (
//     <div className="p-6 space-y-6 bg-background text-foreground">
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-xl font-semibold">Leave Management</h1>
//           <p className="text-sm text-muted-foreground mt-1">
//             Review and approve leave requests, view approval history
//           </p>
//         </div>
//         <Badge variant="outline" className="px-3 py-1">
//           <CheckCircle className="h-4 w-4 mr-1" />
//           Manager Portal
//         </Badge>
//       </div>

//       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//         <TabsList className="grid w-full grid-cols-2">
//           <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
//           <TabsTrigger value="history">Approval History</TabsTrigger>
//         </TabsList>

//         <TabsContent value="approvals" className="space-y-6">
//           {/* Approval Metrics Cards */}
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             {[
//               {
//                 icon: FileText,
//                 title: metrics.totalApprovals,
//                 label: "Total Requests",
//                 color: "text-blue-600"
//               },
//               {
//                 icon: Clock,
//                 title: metrics.pending,
//                 label: "Pending",
//                 color: "text-yellow-600"
//               },
//               {
//                 icon: Calendar,
//                 title: metrics.thisWeek,
//                 label: "This Week",
//                 color: "text-green-600"
//               },
//               {
//                 icon: AlertCircle,
//                 title: metrics.urgent,
//                 label: "Urgent",
//                 color: "text-red-600"
//               },
//             ].map(({ icon: Icon, title, label, color }, index) => (
//               <Card key={index} className="bg-card border-border">
//                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                   <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
//                   <Icon className={`h-4 w-4 ${color}`} />
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-2xl font-bold text-foreground">{title}</div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>

//           {/* Leave Approval Table */}
//           <Card className="bg-card border-border">
//             <CardHeader>
//               <CardTitle className="text-xl font-semibold text-foreground flex items-center">
//                 <CheckCircle className="mr-2" />
//                 Pending Approvals ({metrics.pending})
//               </CardTitle>
//               <p className="text-sm text-muted-foreground">
//                 Review and approve leave requests from your team
//               </p>
//             </CardHeader>
//             <CardContent>
//               {loading ? (
//                 <div className="flex items-center justify-center py-8">
//                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
//                   <span className="ml-2 text-muted-foreground">Loading leave requests...</span>
//                 </div>
//               ) : safeLeavesForApproval.length === 0 ? (
//                 <div className="text-center py-12">
//                   <Clock size={48} className="mx-auto text-gray-400 mb-4" />
//                   <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
//                     No pending approvals
//                   </h3>
//                   <p className="text-gray-600 dark:text-gray-400">
//                     All leave requests have been processed.
//                   </p>
//                 </div>
//               ) : (
//                 <div className="w-full">
//                   <Table>
//                     <TableHeader>
//                       <TableRow className="border-border hover:bg-muted/50">
//                         <TableHead className="text-foreground w-[20%]">Employee</TableHead>
//                         <TableHead className="text-foreground w-[15%]">Leave Type</TableHead>
//                         <TableHead className="text-foreground w-[20%]">Duration</TableHead>
//                         <TableHead className="text-foreground w-[12%]">Status</TableHead>
//                         <TableHead className="text-foreground w-[25%]">Reason</TableHead>
//                         <TableHead className="text-foreground w-[8%]">Actions</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {safeLeavesForApproval.map((leave) => (
//                         <TableRow
//                           key={leave._id}
//                           className="border-border hover:bg-muted/50"
//                         >
//                           <TableCell className="w-[20%]">
//                             <div className="flex items-center space-x-2">
//                               <User className="text-gray-400" size={16} />
//                               <div>
//                                 <p className="font-medium text-foreground">
//                                   {getEmployeeName(leave.employeeId)}
//                                 </p>
//                                 <div className="flex space-x-1">
//                                   {getUrgencyBadge(leave.startDate)}
//                                 </div>
//                               </div>
//                             </div>
//                           </TableCell>
//                           <TableCell className="w-[15%]">
//                             <div>
//                               <p className="font-medium capitalize text-foreground">
//                                 {leave.leaveType}
//                               </p>
//                               <p className="text-sm text-muted-foreground">
//                                 {leave.durationType}
//                               </p>
//                             </div>
//                           </TableCell>
//                           <TableCell className="w-[20%]">
//                             <div className="space-y-1">
//                               <p className="text-sm flex items-center text-foreground">
//                                 <Calendar size={14} className="mr-1" />
//                                 {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
//                               </p>
//                               <p className="text-sm text-muted-foreground">
//                                 {leave.totalDays} days
//                               </p>
//                             </div>
//                           </TableCell>
//                           <TableCell className="w-[12%]">
//                             {getStatusBadge(leave.status)}
//                           </TableCell>
//                           <TableCell className="w-[25%]">
//                             <div className="truncate max-w-xs" title={leave.reason}>
//                               {leave.reason}
//                             </div>
//                           </TableCell>
//                           <TableCell className="w-[8%]">
//                             {leave.status === 'pending' && (
//                               <div className="flex space-x-1">
//                                 <Button
//                                   size="sm"
//                                   onClick={() => handleApprovalAction(leave, 'approved')}
//                                   disabled={approvalLoading}
//                                   className="bg-green-600 hover:bg-green-700 text-white"
//                                 >
//                                   <CheckCircle size={14} />
//                                 </Button>
//                                 <Button
//                                   size="sm"
//                                   variant="destructive"
//                                   onClick={() => handleApprovalAction(leave, 'rejected')}
//                                   disabled={approvalLoading}
//                                 >
//                                   <XCircle size={14} />
//                                 </Button>
//                               </div>
//                             )}
//                           </TableCell>
//                         </TableRow>
//                       ))}
//                     </TableBody>
//                   </Table>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="history" className="space-y-6">
//           {/* History Metrics Cards */}
//           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//             {[
//               {
//                 icon: History,
//                 title: metrics.totalHistory,
//                 label: "Total Processed",
//                 color: "text-blue-600"
//               },
//               {
//                 icon: CheckCircle,
//                 title: metrics.approved,
//                 label: "Approved",
//                 color: "text-green-600"
//               },
//               {
//                 icon: XCircle,
//                 title: metrics.rejected,
//                 label: "Rejected",
//                 color: "text-red-600"
//               },
//             ].map(({ icon: Icon, title, label, color }, index) => (
//               <Card key={index} className="bg-card border-border">
//                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                   <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
//                   <Icon className={`h-4 w-4 ${color}`} />
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-2xl font-bold text-foreground">{title}</div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>

//           {/* Leave History Table */}
//           <Card className="bg-card border-border">
//             <CardHeader>
//               <CardTitle className="text-xl font-semibold text-foreground flex items-center">
//                 <History className="mr-2" />
//                 Approval History ({metrics.totalHistory})
//               </CardTitle>
//               <p className="text-sm text-muted-foreground">
//                 History of leave requests you have processed
//               </p>
//             </CardHeader>
//             <CardContent>
//               {loading ? (
//                 <div className="flex items-center justify-center py-8">
//                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
//                   <span className="ml-2 text-muted-foreground">Loading leave history...</span>
//                 </div>
//               ) : safeLeaveHistory.length === 0 ? (
//                 <div className="text-center py-12">
//                   <History size={48} className="mx-auto text-gray-400 mb-4" />
//                   <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
//                     No approval history
//                   </h3>
//                   <p className="text-gray-600 dark:text-gray-400">
//                     No leave requests have been processed yet.
//                   </p>
//                 </div>
//               ) : (
//                 <div className="w-full">
//                   <Table>
//                     <TableHeader>
//                       <TableRow className="border-border hover:bg-muted/50">
//                         <TableHead className="text-foreground w-[18%]">Employee</TableHead>
//                         <TableHead className="text-foreground w-[15%]">Leave Type</TableHead>
//                         <TableHead className="text-foreground w-[20%]">Duration</TableHead>
//                         <TableHead className="text-foreground w-[12%]">Status</TableHead>
//                         <TableHead className="text-foreground w-[15%]">Applied Date</TableHead>
//                         <TableHead className="text-foreground w-[12%]">Total Days</TableHead>
//                         <TableHead className="text-foreground w-[8%]">Actions</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {safeLeaveHistory.slice(0, 50).map((leave) => ( // Show recent 50 entries
//                         <TableRow
//                           key={leave._id}
//                           className="border-border hover:bg-muted/50"
//                         >
//                           <TableCell className="w-[18%]">
//                             <div className="flex items-center space-x-2">
//                               <User className="text-gray-400" size={16} />
//                               <span className="font-medium text-foreground">
//                                 {getEmployeeName(leave.employeeId)}
//                               </span>
//                             </div>
//                           </TableCell>
//                           <TableCell className="w-[15%]">
//                             <div>
//                               <p className="font-medium capitalize text-foreground">
//                                 {leave.leaveType}
//                               </p>
//                               <p className="text-sm text-muted-foreground">
//                                 {leave.durationType}
//                               </p>
//                             </div>
//                           </TableCell>
//                           <TableCell className="w-[20%]">
//                             <div className="space-y-1">
//                               <p className="text-sm flex items-center text-foreground">
//                                 <Calendar size={14} className="mr-1" />
//                                 {formatDate(leave.startDate)}
//                               </p>
//                               <p className="text-sm text-muted-foreground">
//                                 to {formatDate(leave.endDate)}
//                               </p>
//                             </div>
//                           </TableCell>
//                           <TableCell className="w-[12%]">
//                             {getStatusBadge(leave.status)}
//                           </TableCell>
//                           <TableCell className="w-[15%] text-sm text-muted-foreground">
//                             {formatDate(leave.createdAt)}
//                           </TableCell>
//                           <TableCell className="w-[12%]">
//                             <span className="font-medium text-foreground">
//                               {leave.totalDays} days
//                             </span>
//                           </TableCell>
//                           <TableCell className="w-[8%]">
//                             <Button
//                               size="sm"
//                               variant="outline"
//                               onClick={() => showLeaveDetails(leave)}
//                             >
//                               <FileText size={14} className="mr-1" />
//                               View
//                             </Button>
//                           </TableCell>
//                         </TableRow>
//                       ))}
//                     </TableBody>
//                   </Table>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>

//       {/* Approval Modal */}
//       <Dialog open={showModal} onOpenChange={setShowModal}>
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle>
//               {actionType === 'approved' ? 'Approve' : 'Reject'} Leave Request
//             </DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <p className="text-muted-foreground">
//               Are you sure you want to {actionType === 'approved' ? 'approve' : 'reject'} this leave request for{' '}
//               <span className="font-medium">{getEmployeeName(selectedLeave?.employeeId)}</span>?
//             </p>

//             <div className="space-y-2">
//               <label className="text-sm font-medium flex items-center">
//                 <MessageSquare size={14} className="mr-1" />
//                 Remarks (Optional)
//               </label>
//               <Textarea
//                 value={remarks}
//                 onChange={(e) => setRemarks(e.target.value)}
//                 placeholder="Add any comments or reasons..."
//                 rows={3}
//               />
//             </div>

//             <div className="flex space-x-3">
//               <Button
//                 variant="outline"
//                 onClick={() => setShowModal(false)}
//                 className="flex-1"
//               >
//                 Cancel
//               </Button>
//               <Button
//                 onClick={confirmApproval}
//                 disabled={approvalLoading}
//                 className={`flex-1 ${
//                   actionType === 'approved' 
//                     ? 'bg-green-600 hover:bg-green-700' 
//                     : 'bg-red-600 hover:bg-red-700'
//                 } text-white`}
//               >
//                 {approvalLoading ? (
//                   <>
//                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                     Processing...
//                   </>
//                 ) : (
//                   `Confirm ${actionType === 'approved' ? 'Approval' : 'Rejection'}`
//                 )}
//               </Button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }
