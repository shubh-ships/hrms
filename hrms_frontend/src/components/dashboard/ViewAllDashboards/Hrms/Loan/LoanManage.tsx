// "use client"
// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { AppDispatch, RootState } from '@/store';
// import {
//   getAllLoans,
//   approveLoan,
//   rejectLoan,
//   disburseLoan,
//   clearError,
//   clearSuccess,
//   setCurrentLoan,
// } from '@/features/loan/loanSlice';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// import { 
//   CheckCircle, 
//   XCircle, 
//   Eye, 
//   Calendar, 
//   DollarSign, 
//   Clock, 
//   AlertCircle, 
//   Users, 
//   TrendingUp,
//   Filter,
//   Search,
//   Send
// } from 'lucide-react';
// import { toast } from 'sonner';

// const LoanManage: React.FC = () => {
//   const dispatch = useDispatch<AppDispatch>();
//   const { loans, loading, error, success } = useSelector((state: RootState) => state.loan);
  
//   const [selectedLoan, setSelectedLoan] = useState<any>(null);
//   const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
//   const [rejectionReason, setRejectionReason] = useState('');
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [searchTerm, setSearchTerm] = useState('');

//   useEffect(() => {
//     dispatch(getAllLoans({}));
//   }, [dispatch]);

//   useEffect(() => {
//     if (success) {
//       toast.success('Operation completed successfully!');
//       setIsRejectModalOpen(false);
//       setRejectionReason('');
//       dispatch(clearSuccess());
//     }
//   }, [success, dispatch]);

//   useEffect(() => {
//     if (error) {
//       toast.error(error);
//       dispatch(clearError());
//     }
//   }, [error, dispatch]);

//   const handleApproveLoan = async (loanId: string) => {
//     try {
//       await dispatch(approveLoan(loanId)).unwrap();
//     } catch (error) {
//       console.error('Failed to approve loan:', error);
//     }
//   };

//   const handleRejectLoan = async () => {
//     if (!selectedLoan || !rejectionReason.trim()) {
//       toast.error('Please provide a rejection reason');
//       return;
//     }
    
//     try {
//       await dispatch(rejectLoan({ 
//         id: selectedLoan._id, 
//         rejectionReason: rejectionReason.trim() 
//       })).unwrap();
//     } catch (error) {
//       console.error('Failed to reject loan:', error);
//     }
//   };

//   const handleDisburseLoan = async (loanId: string) => {
//     try {
//       await dispatch(disburseLoan(loanId)).unwrap();
//     } catch (error) {
//       console.error('Failed to disburse loan:', error);
//     }
//   };

//   const openRejectModal = (loan: any) => {
//     setSelectedLoan(loan);
//     setIsRejectModalOpen(true);
//   };

//   const getStatusBadge = (status: string) => {
//     const statusConfig = {
//       pending: { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
//       approved: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
//       rejected: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
//       active: { variant: 'default' as const, icon: CheckCircle, color: 'text-blue-600' },
//       completed: { variant: 'outline' as const, icon: CheckCircle, color: 'text-gray-600' },
//     };

//     const config = statusConfig[status as keyof typeof statusConfig];
//     const Icon = config?.icon || AlertCircle;

//     return (
//       <Badge variant={config?.variant || 'secondary'}>
//         <Icon className={`w-3 h-3 mr-1 ${config?.color}`} />
//         {status.charAt(0).toUpperCase() + status.slice(1)}
//       </Badge>
//     );
//   };

//   const getStatusCounts = () => {
//     return loans.reduce((acc, loan) => {
//       acc[loan.status] = (acc[loan.status] || 0) + 1;
//       acc.total = (acc.total || 0) + 1;
//       return acc;
//     }, {} as Record<string, number>);
//   };

//   const filteredLoans = loans.filter(loan => {
//     const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
//     const matchesSearch = loan.loanName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          loan.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          loan.userId.email.toLowerCase().includes(searchTerm.toLowerCase());
//     return matchesStatus && matchesSearch;
//   });

//   const statusCounts = getStatusCounts();

//   const canApprove = (status: string) => status === 'pending';
//   const canReject = (status: string) => status === 'pending';
//   const canDisburse = (status: string) => status === 'approved';

//   return (
//     <div className="p-6 space-y-6">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold">Loan Management</h1>
//           <p className="text-muted-foreground">Manage and review loan applications</p>
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
//         <Card>
//           <CardContent className="p-4">
//             <div className="flex items-center space-x-2">
//               <Users className="w-8 h-8 text-blue-600" />
//               <div>
//                 <p className="text-sm text-muted-foreground">Total Loans</p>
//                 <p className="text-2xl font-bold">{statusCounts.total || 0}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-4">
//             <div className="flex items-center space-x-2">
//               <Clock className="w-8 h-8 text-yellow-600" />
//               <div>
//                 <p className="text-sm text-muted-foreground">Pending</p>
//                 <p className="text-2xl font-bold">{statusCounts.pending || 0}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-4">
//             <div className="flex items-center space-x-2">
//               <CheckCircle className="w-8 h-8 text-green-600" />
//               <div>
//                 <p className="text-sm text-muted-foreground">Approved</p>
//                 <p className="text-2xl font-bold">{statusCounts.approved || 0}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-4">
//             <div className="flex items-center space-x-2">
//               <TrendingUp className="w-8 h-8 text-blue-600" />
//               <div>
//                 <p className="text-sm text-muted-foreground">Active</p>
//                 <p className="text-2xl font-bold">{statusCounts.active || 0}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-4">
//             <div className="flex items-center space-x-2">
//               <XCircle className="w-8 h-8 text-red-600" />
//               <div>
//                 <p className="text-sm text-muted-foreground">Rejected</p>
//                 <p className="text-2xl font-bold">{statusCounts.rejected || 0}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Filters */}
//       <div className="flex flex-col sm:flex-row gap-4">
//         <div className="flex-1">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
//             <Input
//               placeholder="Search loans, employees..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pl-10"
//             />
//           </div>
//         </div>
//         <Select value={statusFilter} onValueChange={setStatusFilter}>
//           <SelectTrigger className="w-[180px]">
//             <Filter className="w-4 h-4 mr-2" />
//             <SelectValue placeholder="Filter by status" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">All Status</SelectItem>
//             <SelectItem value="pending">Pending</SelectItem>
//             <SelectItem value="approved">Approved</SelectItem>
//             <SelectItem value="rejected">Rejected</SelectItem>
//             <SelectItem value="active">Active</SelectItem>
//             <SelectItem value="completed">Completed</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       {/* Loans Grid */}
//       {loading && !loans.length ? (
//         <div className="flex justify-center items-center h-64">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
//             <p>Loading loans...</p>
//           </div>
//         </div>
//       ) : filteredLoans.length === 0 ? (
//         <div className="text-center py-12">
//           <div className="w-24 h-24 mx-auto mb-4 text-muted-foreground">
//             <DollarSign className="w-full h-full" />
//           </div>
//           <h3 className="text-lg font-semibold mb-2">No loans found</h3>
//           <p className="text-muted-foreground">No loans match your current filters.</p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
//           {filteredLoans.map((loan) => (
//             <Card key={loan._id} className="hover:shadow-lg transition-shadow">
//               <CardHeader className="pb-3">
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <CardTitle className="text-lg">{loan.loanName}</CardTitle>
//                     <p className="text-sm text-muted-foreground mt-1">
//                       {loan.userId.name} • {loan.userId.email}
//                     </p>
//                   </div>
//                   {getStatusBadge(loan.status)}
//                 </div>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <div className="grid grid-cols-2 gap-4 text-sm">
//                   <div className="flex items-center space-x-2">
//                     <DollarSign className="w-4 h-4 text-muted-foreground" />
//                     <div>
//                       <p className="text-muted-foreground">Principal</p>
//                       <p className="font-medium">₹{loan.principalAmount.toLocaleString()}</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <Calendar className="w-4 h-4 text-muted-foreground" />
//                     <div>
//                       <p className="text-muted-foreground">Tenure</p>
//                       <p className="font-medium">{loan.tenure} months</p>
//                     </div>
//                   </div>
//                   <div className="col-span-2">
//                     <p className="text-muted-foreground">Interest Rate</p>
//                     <p className="font-medium">{loan.interestRate}% ({loan.interestType})</p>
//                   </div>
//                   <div className="col-span-2">
//                     <p className="text-muted-foreground">Monthly EMI</p>
//                     <p className="font-medium">₹{loan.monthlyInstallment.toLocaleString()}</p>
//                   </div>
//                   <div className="col-span-2">
//                     <p className="text-muted-foreground">Total Payable</p>
//                     <p className="font-medium">₹{loan.totalPayable.toLocaleString()}</p>
//                   </div>
//                 </div>

//                 {loan.description && (
//                   <div className="p-3 bg-muted rounded-md">
//                     <p className="text-sm text-muted-foreground">Description:</p>
//                     <p className="text-sm">{loan.description}</p>
//                   </div>
//                 )}

//                 {loan.rejectionReason && (
//                   <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
//                     <p className="text-sm text-destructive font-medium">Rejection Reason:</p>
//                     <p className="text-sm text-destructive">{loan.rejectionReason}</p>
//                   </div>
//                 )}

//                 {loan.approvedBy && (
//                   <div className="p-3 bg-green-50 border border-green-200 rounded-md">
//                     <p className="text-sm text-green-700 font-medium">
//                       Approved by: {loan.approvedBy.name}
//                     </p>
//                     <p className="text-sm text-green-600">
//                       {new Date(loan.approvedAt!).toLocaleDateString()}
//                     </p>
//                   </div>
//                 )}

//                 <div className="flex flex-wrap gap-2">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => dispatch(setCurrentLoan(loan))}
//                     className="flex-1"
//                   >
//                     <Eye className="w-4 h-4 mr-1" />
//                     View
//                   </Button>
                  
//                   {canApprove(loan.status) && (
//                     <Button
//                       size="sm"
//                       onClick={() => handleApproveLoan(loan._id)}
//                       disabled={loading}
//                       className="flex-1 bg-green-600 hover:bg-green-700"
//                     >
//                       <CheckCircle className="w-4 h-4 mr-1" />
//                       Approve
//                     </Button>
//                   )}
                  
//                   {canReject(loan.status) && (
//                     <Button
//                       variant="destructive"
//                       size="sm"
//                       onClick={() => openRejectModal(loan)}
//                       disabled={loading}
//                       className="flex-1"
//                     >
//                       <XCircle className="w-4 h-4 mr-1" />
//                       Reject
//                     </Button>
//                   )}
                  
//                   {canDisburse(loan.status) && (
//                     <Button
//                       size="sm"
//                       onClick={() => handleDisburseLoan(loan._id)}
//                       disabled={loading}
//                       className="flex-1 bg-blue-600 hover:bg-blue-700"
//                     >
//                       <Send className="w-4 h-4 mr-1" />
//                       Disburse
//                     </Button>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}

//       {/* Reject Modal */}
//       <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Reject Loan Application</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div>
//               <p className="text-sm text-muted-foreground mb-2">
//                 You are about to reject the loan application for:
//               </p>
//               <p className="font-medium">{selectedLoan?.loanName}</p>
//               <p className="text-sm text-muted-foreground">{selectedLoan?.userId.name}</p>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="rejectionReason">Rejection Reason *</Label>
//               <Textarea
//                 id="rejectionReason"
//                 value={rejectionReason}
//                 onChange={(e) => setRejectionReason(e.target.value)}
//                 placeholder="Please provide a clear reason for rejection..."
//                 rows={4}
//               />
//             </div>
//           </div>
//           <div className="flex justify-end space-x-2 mt-4">
//             <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>
//               Cancel
//             </Button>
//             <Button 
//               variant="destructive" 
//               onClick={handleRejectLoan} 
//               disabled={loading || !rejectionReason.trim()}
//             >
//               {loading ? 'Rejecting...' : 'Reject Loan'}
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default LoanManage;
"use client"
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import {
  getAllLoans,
  approveLoan,
  rejectLoan,
  disburseLoan,
  updateLoanRequest,
  clearError,
  clearSuccess,
} from '@/features/loan/loanSlice';
import { getLoanPresets } from '@/features/loanInterestPreset/loanPresetSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle,
  Users,
  TrendingUp,
  Filter,
  Search,
  Edit,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

interface EditFormState {
  loanName: string;
  description: string;
  principalAmount: string;
  disbursementDate: string;
  repaymentStartMonth: string;
  interestPreset?: string;
  interestRate: string;
  interestType: 'simple' | 'compound';
  tenure: string;
}

const LoanManage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loans, loading, error, success } = useSelector((state: RootState) => state.loan);
  const { presets } = useSelector((state: RootState) => state.loanPreset);

  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    loanName: '',
    description: '',
    principalAmount: '',
    disbursementDate: '',
    repaymentStartMonth: '',
    interestPreset: '',
    interestRate: '',
    interestType: 'simple',
    tenure: '',
  });

  useEffect(() => {
    dispatch(getAllLoans({}));
    dispatch(getLoanPresets());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      toast.success('Operation completed successfully!');
      setIsRejectModalOpen(false);
      setIsEditModalOpen(false);
      setRejectionReason('');
      setSelectedLoan(null);
      dispatch(clearSuccess());
    }
  }, [success, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleApproveLoan = async (loanId: string) => {
    try {
      await dispatch(approveLoan(loanId)).unwrap();
    } catch {}
  };

  const handleRejectLoan = async () => {
    if (!selectedLoan || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      await dispatch(
        rejectLoan({ id: selectedLoan._id, rejectionReason: rejectionReason.trim() })
      ).unwrap();
    } catch {}
  };

  const handleDisburseLoan = async (loanId: string) => {
    try {
      await dispatch(disburseLoan(loanId)).unwrap();
    } catch {}
  };

  // ---- EDIT LOGIC ----
  const openEditModal = (loan: any) => {
    setSelectedLoan(loan);
    const disbursementDate = loan.disbursementDate ? loan.disbursementDate.slice(0, 10) : '';
    const repaymentStartMonth = loan.repaymentStartMonth
      ? new Date(loan.repaymentStartMonth).toISOString().slice(0, 7)
      : '';

    setEditForm({
      loanName: loan.loanName || '',
      description: loan.description || '',
      principalAmount: loan.principalAmount ? loan.principalAmount.toString() : '',
      disbursementDate,
      repaymentStartMonth,
      interestPreset: (
        loan.interestPreset
          ? (typeof loan.interestPreset === 'object' && loan.interestPreset._id
              ? loan.interestPreset._id
              : typeof loan.interestPreset === 'string'
                ? loan.interestPreset
                : ''
            )
          : ''
      ),
      interestRate: loan.interestRate?.toString() || '',
      interestType: loan.interestType || 'simple',
      tenure: loan.tenure ? loan.tenure.toString() : '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditInputChange = (field: keyof EditFormState, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleEditPresetChange = (presetId: string) => {
    const preset = presets.find((p: any) => p._id === presetId);
    setEditForm(prev => ({
      ...prev,
      interestPreset: presetId,
      interestRate: preset ? preset.interestRate.toString() : '',
      interestType: preset ? preset.interestType : 'simple',
    }));
  };

  const handleUpdateLoan = async () => {
    if (!selectedLoan) return;
    try {
      const updateData = {
        loanName: editForm.loanName,
        description: editForm.description || undefined,
        principalAmount: parseFloat(editForm.principalAmount),
        disbursementDate: editForm.disbursementDate,
        repaymentStartMonth: editForm.repaymentStartMonth,
        interestPreset: editForm.interestPreset || undefined,
        interestRate: parseFloat(editForm.interestRate),
        interestType: editForm.interestType,
        tenure: parseInt(editForm.tenure),
      };
      await dispatch(updateLoanRequest({ id: selectedLoan._id, updateData })).unwrap();
    } catch {}
  };

  const openRejectModal = (loan: any) => {
    setSelectedLoan(loan);
    setIsRejectModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      approved: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      rejected: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
      active: { variant: 'default' as const, icon: CheckCircle, color: 'text-blue-600' },
      completed: { variant: 'outline' as const, icon: CheckCircle, color: 'text-gray-600' },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || AlertCircle;
    return (
      <Badge variant={config?.variant || 'secondary'}>
        <Icon className={`w-3 h-3 mr-1 ${config?.color}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStatusCounts = () => {
    return loans.reduce((acc, loan) => {
      acc[loan.status] = (acc[loan.status] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const filteredLoans = loans.filter(loan => {
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    const matchesSearch =
      loan.loanName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.userId.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusCounts = getStatusCounts();
  const canApprove = (status: string) => status === 'pending';
  const canReject = (status: string) => status === 'pending';
  const canDisburse = (status: string) => status === 'approved';
  const canEdit = (status: string) => true;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Loan Management</h1>
          <p className="text-muted-foreground">Manage and review loan applications</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center space-x-2">
          <Users className="w-8 h-8 text-blue-600" /><div>
            <p className="text-sm text-muted-foreground">Total Loans</p>
            <p className="text-2xl font-bold">{statusCounts.total || 0}</p>
          </div>
        </div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center space-x-2">
          <Clock className="w-8 h-8 text-yellow-600" /><div>
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold">{statusCounts.pending || 0}</p>
          </div>
        </div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center space-x-2">
          <CheckCircle className="w-8 h-8 text-green-600" /><div>
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold">{statusCounts.approved || 0}</p>
          </div>
        </div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center space-x-2">
          <TrendingUp className="w-8 h-8 text-blue-600" /><div>
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold">{statusCounts.active || 0}</p>
          </div>
        </div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center space-x-2">
          <XCircle className="w-8 h-8 text-red-600" /><div>
            <p className="text-sm text-muted-foreground">Rejected</p>
            <p className="text-2xl font-bold">{statusCounts.rejected || 0}</p>
          </div>
        </div></CardContent></Card>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search loans, employees..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loans Grid */}
      {loading && !loans.length ? (
        <div className="flex justify-center items-center h-64"><div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading loans...</p>
        </div></div>
      ) : filteredLoans.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 text-muted-foreground">
            <DollarSign className="w-full h-full" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No loans found</h3>
          <p className="text-muted-foreground">No loans match your current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredLoans.map((loan) => (
            <Card key={loan._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{loan.loanName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {loan.userId.name} • {loan.userId.email}
                    </p>
                  </div>
                  {getStatusBadge(loan.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* General Data */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" /><div>
                      <p className="text-muted-foreground">Principal</p>
                      <p className="font-medium">₹{loan.principalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" /><div>
                      <p className="text-muted-foreground">Tenure</p>
                      <p className="font-medium">{loan.tenure} months</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Interest Rate</p>
                    <p className="font-medium">{loan.interestRate}% ({loan.interestType})</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Monthly EMI</p>
                    <p className="font-medium">₹{loan.monthlyInstallment.toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Total Payable</p>
                    <p className="font-medium">₹{loan.totalPayable.toLocaleString()}</p>
                  </div>
                </div>
                {/* Optional Fields */}
                {loan.description && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">Description:</p>
                    <p className="text-sm">{loan.description}</p>
                  </div>
                )}
                {loan.rejectionReason && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive font-medium">Rejection Reason:</p>
                    <p className="text-sm text-destructive">{loan.rejectionReason}</p>
                  </div>
                )}
                {loan.approvedBy && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700 font-medium">
                      Approved by: {loan.approvedBy.name}
                    </p>
                    <p className="text-sm text-green-600">
                      {new Date(loan.approvedAt!).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {/* Admin Actions */}
                <div className="flex flex-wrap gap-2">
                  {canApprove(loan.status) && (
                    <Button
                      size="sm"
                      onClick={() => handleApproveLoan(loan._id)}
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Approve
                    </Button>
                  )}
                  {canReject(loan.status) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openRejectModal(loan)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  )}
                  {canDisburse(loan.status) && (
                    <Button
                      size="sm"
                      onClick={() => handleDisburseLoan(loan._id)}
                      disabled={loading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4 mr-1" /> Disburse
                    </Button>
                  )}
                  {/* {canEdit(loan.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(loan)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  )} */}
                  {loan.status === 'pending' && (
  <Button
    variant="outline"
    size="sm"
    onClick={() => openEditModal(loan)}
    className="flex-1"
  >
    <Edit className="w-4 h-4 mr-1" /> Edit
  </Button>
)}

                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Loan</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="editPresetType">Loan Type *</Label>
              <Select
                value={editForm.interestPreset || ''}
                onValueChange={handleEditPresetChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select loan type" />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((preset: any) => (
                    <SelectItem key={preset._id} value={preset._id}>
                      {preset.name} ({preset.interestRate}% {preset.interestType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editLoanName">Loan Name *</Label>
              <Input
                id="editLoanName"
                value={editForm.loanName}
                onChange={e => handleEditInputChange('loanName', e.target.value)}
                placeholder="Enter loan name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPrincipalAmount">Principal Amount *</Label>
              <Input
                id="editPrincipalAmount"
                type="number"
                value={editForm.principalAmount}
                onChange={e => handleEditInputChange('principalAmount', e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDisbursementDate">Disbursement Date *</Label>
              <Input
                id="editDisbursementDate"
                type="date"
                value={editForm.disbursementDate}
                onChange={e => handleEditInputChange('disbursementDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRepaymentStartMonth">Repayment Start Month *</Label>
              <Input
                id="editRepaymentStartMonth"
                type="month"
                value={editForm.repaymentStartMonth}
                onChange={e => handleEditInputChange('repaymentStartMonth', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editInterestRate">Interest Rate (%) *</Label>
              <Input
                id="editInterestRate"
                type="number"
                step="0.01"
                value={editForm.interestRate}
                onChange={e => handleEditInputChange('interestRate', e.target.value)}
                placeholder="Enter interest rate"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editInterestType">Interest Type *</Label>
              <Select value={editForm.interestType} onValueChange={value => handleEditInputChange('interestType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple Interest</SelectItem>
                  <SelectItem value="compound">Compound Interest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editTenure">Tenure (Months) *</Label>
              <Input
                id="editTenure"
                type="number"
                value={editForm.tenure}
                onChange={e => handleEditInputChange('tenure', e.target.value)}
                placeholder="Enter tenure in months"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={editForm.description}
                onChange={e => handleEditInputChange('description', e.target.value)}
                placeholder="Enter loan description (optional)"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLoan} disabled={loading}>
              {loading ? 'Updating...' : 'Update Loan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Loan Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                You are about to reject the loan application for:
              </p>
              <p className="font-medium">{selectedLoan?.loanName}</p>
              <p className="text-sm text-muted-foreground">{selectedLoan?.userId.name}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Please provide a clear reason for rejection..."
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectLoan}
              disabled={loading || !rejectionReason.trim()}
            >
              {loading ? 'Rejecting...' : 'Reject Loan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoanManage;
