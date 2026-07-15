"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Clock,
  FileText,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  CalendarDays,
  Minus,
  Plus,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  applyForLeave,
  getLeaveBalances,
  selectLeaveBalances,
  selectApplyLoading,
  selectBalanceLoading,
  selectLeaveError,
  clearLeaveError,
} from "@/features/leave/leaveSlice";

export default function LeaveApplicationComponent() {
  const dispatch = useAppDispatch();
  const leaveBalances = useAppSelector(selectLeaveBalances);
  const applyLoading = useAppSelector(selectApplyLoading);
  const balanceLoading = useAppSelector(selectBalanceLoading);
  const error = useAppSelector(selectLeaveError);

  const [formData, setFormData] = useState<{
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    durationType: "fullDay" | "halfDay";
  }>({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    durationType: "fullDay",
  });

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    dispatch(getLeaveBalances());
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

  // Updated metrics calculation with remaining balance
  const metrics = useMemo(() => {
    const balances = Array.isArray(leaveBalances) ? leaveBalances : [];
    
    return {
      totalAllocated: balances.reduce((sum, balance) => sum + (balance.balance || 0), 0),
      totalTaken: balances.reduce((sum, balance) => sum + (balance.leaveTaken || 0), 0),
      totalRemaining: balances.reduce((sum, balance) => {
        const remaining = (balance.balance || 0) - (balance.leaveTaken || 0);
        return sum + Math.max(0, remaining);
      }, 0),
      leaveTypes: balances.length,
    };
  }, [leaveBalances]);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const clearForm = () => {
    setFormData({
      leaveType: "",
      startDate: "",
      endDate: "",
      reason: "",
      durationType: "fullDay",
    });
    toast.success('Form cleared successfully');
  };

  const calculateTotalDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return formData.durationType === "halfDay" && totalDays === 1 ? 0.5 : totalDays;
    }
    return 0;
  };

  // Updated function to get remaining balance
  const getRemainingBalance = (leaveType: string) => {
    if (!Array.isArray(leaveBalances)) return 0;
    const balance = leaveBalances.find(b => b.leaveType === leaveType);
    if (!balance) return 0;
    const remaining = (balance.balance || 0) - (balance.leaveTaken || 0);
    return Math.max(0, remaining);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalDays = calculateTotalDays();
    const remainingBalance = getRemainingBalance(formData.leaveType);
    
    if (totalDays > remainingBalance) {
      toast.error(`Insufficient leave balance. Remaining: ${remainingBalance} days`);
      return;
    }

    try {
      await dispatch(applyForLeave(formData)).unwrap();
      toast.success("Leave application submitted successfully!");
      setShowSuccess(true);
      clearForm();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      toast.error(err || "Failed to apply for leave");
    }
  };

  const safeLeaveBalances = Array.isArray(leaveBalances) ? leaveBalances : [];
  const isFormValid = formData.leaveType && formData.startDate && formData.endDate && formData.reason.trim();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1e2939] py-8 px-4 overflow-x-hidden">
      <div className="max-w-6xl mx-auto bg-ba">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 ">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Leave Application</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Apply for leave and manage your current balance
            </p>
          </div>
          <Badge variant="outline" className="px-4 py-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <User className="h-4 w-4 mr-2" />
            Employee Portal
          </Badge>
        </div>

        {/* Balance Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: CalendarDays,
              title: metrics.totalRemaining,
              label: "Remaining Balance",
              color: "text-green-600",
              bgColor: "bg-green-50 dark:bg-green-900/20"
            },
            {
              icon: Minus,
              title: metrics.totalTaken,
              label: "Leave Taken",
              color: "text-red-600",
              bgColor: "bg-red-50 dark:bg-red-900/20"
            },
            {
              icon: Plus,
              title: metrics.totalAllocated,
              label: "Total Allocated",
              color: "text-blue-600",
              bgColor: "bg-blue-50 dark:bg-blue-900/20"
            },
            {
              icon: TrendingUp,
              title: metrics.leaveTypes,
              label: "Leave Types",
              color: "text-purple-600",
              bgColor: "bg-purple-50 dark:bg-purple-900/20"
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Leave Balance Details */}
          <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <User className="h-5 w-5 mr-2" />
                Current Leave Balance
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your available leave balance by type
              </p>
            </CardHeader>
            <CardContent>
              {balanceLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Loading balances...</span>
                </div>
              ) : safeLeaveBalances.length > 0 ? (
                <div className="space-y-4">
                  {safeLeaveBalances.map((balance) => {
                    const remaining = Math.max(0, (balance.balance || 0) - (balance.leaveTaken || 0));
                    const taken = balance.leaveTaken || 0;
                    const allocated = balance.balance || 0;
                    const usagePercentage = allocated > 0 ? (taken / allocated) * 100 : 0;
                    
                    return (
                      <div
                        key={balance._id}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                            {balance.leaveType.replace(/([A-Z])/g, ' $1').trim()}
                          </h3>
                          <div className="text-right">
                            <div className="text-xl font-bold text-green-600">
                              {remaining}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">remaining</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Allocated</span>
                            <p className="font-medium text-gray-900 dark:text-white">{allocated}</p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Taken</span>
                            <p className="font-medium text-red-600">{taken}</p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Available</span>
                            <p className="font-medium text-green-600">{remaining}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                          <span>{balance.frequency} • {balance.period}</span>
                          <span>{usagePercentage.toFixed(0)}% used</span>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No leave balances found</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Contact HR to set up your leave entitlements</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leave Application Form */}
          <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Apply for Leave
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Submit your leave request with details
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearForm}
                  disabled={!formData.leaveType && !formData.startDate && !formData.endDate && !formData.reason}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showSuccess && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center">
                  <CheckCircle className="text-green-600 mr-3" size={20} />
                  <span className="text-green-800 dark:text-green-200">Leave application submitted successfully!</span>
                </div>
              )}

              {safeLeaveBalances.length > 0 ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Leave Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.leaveType}
                        onValueChange={(value) => handleInputChange("leaveType", value)}
                      >
                        <SelectTrigger className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                          <SelectValue placeholder="Select Leave Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {safeLeaveBalances.map((balance) => {
                            const remaining = Math.max(0, (balance.balance || 0) - (balance.leaveTaken || 0));
                            return (
                              <SelectItem key={balance.leaveType} value={balance.leaveType}>
                                {balance.leaveType.charAt(0).toUpperCase() + balance.leaveType.slice(1)} 
                                ({remaining} days remaining)
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Duration Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.durationType}
                        onValueChange={(value) => handleInputChange("durationType", value)}
                      >
                        <SelectTrigger className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fullDay">Full Day</SelectItem>
                          <SelectItem value="halfDay">Half Day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <Calendar className="mr-1" size={16} />
                        Start Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange("startDate", e.target.value)}
                        className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <Calendar className="mr-1" size={16} />
                        End Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange("endDate", e.target.value)}
                        min={formData.startDate}
                        className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                        required
                      />
                    </div>
                  </div>

                  {formData.startDate && formData.endDate && (
                    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Clock className="text-blue-600 mr-2" size={20} />
                            <span className="text-blue-800 dark:text-blue-200 font-medium">
                              Total Days: {calculateTotalDays()} days
                            </span>
                          </div>
                          {formData.leaveType && (
                            <div className="text-sm text-blue-700 dark:text-blue-300">
                              Remaining: {getRemainingBalance(formData.leaveType)} days
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Reason <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      value={formData.reason}
                      onChange={(e) => handleInputChange("reason", e.target.value)}
                      placeholder="Please provide a reason for your leave request..."
                      className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 resize-none"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={!isFormValid || applyLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {applyLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Leave Application'
                      )}
                    </Button>
                  </div>
                  
                  {!isFormValid && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                      Please fill in all required fields to submit your leave application
                    </p>
                  )}
                </form>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">Cannot apply for leave</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">No leave types are configured. Please contact HR.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Calendar,
//   Clock,
//   FileText,
//   User,
//   CheckCircle,
//   AlertCircle,
//   Loader2,
//   CalendarDays,
// } from "lucide-react";
// import { toast } from "sonner";
// import { useAppDispatch, useAppSelector } from "@/store/hooks";
// import {
//   applyForLeave,
//   getLeaveBalances,
//   selectLeaveBalances,
//   selectApplyLoading,
//   selectBalanceLoading,
//   selectLeaveError,
//   clearLeaveError,
// } from "@/features/leave/leaveSlice";

// export default function LeaveApplicationComponent() {
//   const dispatch = useAppDispatch();
//   const leaveBalances = useAppSelector(selectLeaveBalances);
//   const applyLoading = useAppSelector(selectApplyLoading);
//   const balanceLoading = useAppSelector(selectBalanceLoading);
//   const error = useAppSelector(selectLeaveError);

//   const [formData, setFormData] = useState<{
//     leaveType: string;
//     startDate: string;
//     endDate: string;
//     reason: string;
//     durationType: "fullDay" | "halfDay";
//   }>({
//     leaveType: "",
//     startDate: "",
//     endDate: "",
//     reason: "",
//     durationType: "fullDay",
//   });

//   const [showSuccess, setShowSuccess] = useState(false);

//   useEffect(() => {
//     dispatch(getLeaveBalances());
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

//   // Fixed metrics calculation with proper array checking
//   const metrics = useMemo(() => {
//     // Ensure leaveBalances is an array before using reduce
//     const balances = Array.isArray(leaveBalances) ? leaveBalances : [];
    
//     return {
//       totalBalance: balances.reduce((sum, balance) => sum + (balance.balance || 0), 0),
//       leaveTypes: balances.length,
//       yearlyBalance: balances
//         .filter(b => b.frequency === 'yearly')
//         .reduce((sum, balance) => sum + (balance.balance || 0), 0),
//       monthlyBalance: balances
//         .filter(b => b.frequency === 'monthly')
//         .reduce((sum, balance) => sum + (balance.balance || 0), 0),
//     };
//   }, [leaveBalances]);

//   const handleInputChange = (name: string, value: string) => {
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const calculateTotalDays = () => {
//     if (formData.startDate && formData.endDate) {
//       const start = new Date(formData.startDate);
//       const end = new Date(formData.endDate);
//       const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
//       return formData.durationType === "halfDay" && totalDays === 1 ? 0.5 : totalDays;
//     }
//     return 0;
//   };

//   const getAvailableBalance = (leaveType: string) => {
//     if (!Array.isArray(leaveBalances)) return 0;
//     const balance = leaveBalances.find(b => b.leaveType === leaveType);
//     return balance ? balance.balance : 0;
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const totalDays = calculateTotalDays();
//     const availableBalance = getAvailableBalance(formData.leaveType);
    
//     if (totalDays > availableBalance) {
//       toast.error(`Insufficient leave balance. Available: ${availableBalance} days`);
//       return;
//     }

//     try {
//       await dispatch(applyForLeave(formData)).unwrap();
//       toast.success("Leave application submitted successfully!");
//       setShowSuccess(true);
//       setFormData({
//         leaveType: "",
//         startDate: "",
//         endDate: "",
//         reason: "",
//         durationType: "fullDay",
//       });
//       setTimeout(() => setShowSuccess(false), 3000);
//     } catch (err: any) {
//       toast.error(err || "Failed to apply for leave");
//     }
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//     });
//   };

//   // Safe array access for rendering
//   const safeLeaveBalances = Array.isArray(leaveBalances) ? leaveBalances : [];

//   return (
//     <div className="p-6 space-y-6 bg-background text-foreground">
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-xl font-semibold">Leave Application</h1>
//           <p className="text-sm text-muted-foreground mt-1">
//             Apply for leave and view your current balance
//           </p>
//         </div>
//         <Badge variant="outline" className="px-3 py-1">
//           <User className="h-4 w-4 mr-1" />
//           Employee Portal
//         </Badge>
//       </div>

//       {/* Balance Metrics Cards */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//         {[
//           {
//             icon: CalendarDays,
//             title: metrics.totalBalance,
//             label: "Total Balance",
//             color: "text-blue-600"
//           },
//           {
//             icon: Clock,
//             title: metrics.leaveTypes,
//             label: "Leave Types",
//             color: "text-green-600"
//           },
//           {
//             icon: Calendar,
//             title: metrics.yearlyBalance,
//             label: "Yearly Balance",
//             color: "text-purple-600"
//           },
//           {
//             icon: FileText,
//             title: metrics.monthlyBalance,
//             label: "Monthly Balance",
//             color: "text-orange-600"
//           },
//         ].map(({ icon: Icon, title, label, color }, index) => (
//           <Card key={index} className="bg-card border-border">
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
//               <Icon className={`h-4 w-4 ${color}`} />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-foreground">{title}</div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       {/* Leave Balance Details */}
//       <Card className="bg-card border-border">
//         <CardHeader>
//           <CardTitle className="text-lg font-semibold text-foreground flex items-center">
//             <User className="h-5 w-5 mr-2" />
//             Current Leave Balance
//           </CardTitle>
//           <p className="text-sm text-muted-foreground">
//             Your available leave balance by type
//           </p>
//         </CardHeader>
//         <CardContent>
//           {balanceLoading ? (
//             <div className="flex items-center justify-center py-8">
//               <Loader2 className="h-8 w-8 animate-spin text-primary" />
//               <span className="ml-2 text-muted-foreground">Loading balances...</span>
//             </div>
//           ) : safeLeaveBalances.length > 0 ? (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {safeLeaveBalances.map((balance) => (
//                 <div
//                   key={balance._id}
//                   className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800"
//                 >
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <h3 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
//                         {balance.leaveType.replace(/([A-Z])/g, ' $1').trim()}
//                       </h3>
//                       <p className="text-sm text-gray-600 dark:text-gray-400">
//                         {balance.frequency} • {balance.period}
//                       </p>
//                     </div>
//                     <div className="text-right">
//                       <div className="text-2xl font-bold text-blue-600">
//                         {balance.balance || 0}
//                       </div>
//                       <div className="text-xs text-gray-500">days</div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="text-center py-8">
//               <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
//               <p className="text-gray-600">No leave balances found</p>
//               <p className="text-sm text-gray-500 mt-1">Contact HR to set up your leave entitlements</p>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Leave Application Form */}
//       <Card className="bg-card border-border">
//         <CardHeader>
//           <CardTitle className="text-lg font-semibold text-foreground flex items-center">
//             <FileText className="h-5 w-5 mr-2" />
//             Apply for Leave
//           </CardTitle>
//           <p className="text-sm text-muted-foreground">
//             Submit your leave request with details
//           </p>
//         </CardHeader>
//         <CardContent>
//           {showSuccess && (
//             <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
//               <CheckCircle className="text-green-600 mr-2" size={20} />
//               <span className="text-green-800">Leave application submitted successfully!</span>
//             </div>
//           )}

//           {safeLeaveBalances.length > 0 ? (
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
//                     Leave Type *
//                   </label>
//                   <Select
//                     value={formData.leaveType}
//                     onValueChange={(value) => handleInputChange("leaveType", value)}
//                   >
//                     <SelectTrigger className="w-full">
//                       <SelectValue placeholder="Select Leave Type" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {safeLeaveBalances.map((balance) => (
//                         <SelectItem key={balance.leaveType} value={balance.leaveType}>
//                           {balance.leaveType.charAt(0).toUpperCase() + balance.leaveType.slice(1)} 
//                           ({balance.balance || 0} days available)
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
//                     Duration Type *
//                   </label>
//                   <Select
//                     value={formData.durationType}
//                     onValueChange={(value) => handleInputChange("durationType", value)}
//                   >
//                     <SelectTrigger className="w-full">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="fullDay">Full Day</SelectItem>
//                       <SelectItem value="halfDay">Half Day</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
//                     <Calendar className="mr-1" size={16} />
//                     Start Date *
//                   </label>
//                   <Input
//                     type="date"
//                     value={formData.startDate}
//                     onChange={(e) => handleInputChange("startDate", e.target.value)}
//                     className="w-full"
//                     required
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
//                     <Calendar className="mr-1" size={16} />
//                     End Date *
//                   </label>
//                   <Input
//                     type="date"
//                     value={formData.endDate}
//                     onChange={(e) => handleInputChange("endDate", e.target.value)}
//                     min={formData.startDate}
//                     className="w-full"
//                     required
//                   />
//                 </div>
//               </div>

//               {formData.startDate && formData.endDate && (
//                 <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
//                   <CardContent className="p-4">
//                     <div className="flex items-center">
//                       <Clock className="text-blue-600 mr-2" size={20} />
//                       <span className="text-blue-800 dark:text-blue-200 font-medium">
//                         Total Days: {calculateTotalDays()} days
//                       </span>
//                     </div>
//                   </CardContent>
//                 </Card>
//               )}

//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
//                   Reason *
//                 </label>
//                 <Textarea
//                   value={formData.reason}
//                   onChange={(e) => handleInputChange("reason", e.target.value)}
//                   placeholder="Please provide a reason for your leave request..."
//                   className="w-full"
//                   rows={4}
//                   required
//                 />
//               </div>

//               <Button
//                 type="submit"
//                 disabled={applyLoading || !formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason}
//                 className="w-full"
//               >
//                 {applyLoading ? (
//                   <>
//                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                     Submitting...
//                   </>
//                 ) : (
//                   'Submit Leave Application'
//                 )}
//               </Button>
//             </form>
//           ) : (
//             <div className="text-center py-8">
//               <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
//               <p className="text-gray-600">Cannot apply for leave</p>
//               <p className="text-sm text-gray-500 mt-1">No leave types are configured. Please contact HR.</p>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
