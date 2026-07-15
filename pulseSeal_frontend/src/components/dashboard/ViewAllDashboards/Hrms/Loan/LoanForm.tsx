// "use client"
// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { AppDispatch, RootState } from '@/store';
// import {
//   createLoanRequest,
//   getEmployeeLoans,
//   updateLoanRequest,
//   clearError,
//   clearSuccess,
//   setCurrentLoan
// } from '@/features/loan/loanSlice';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// import { Plus, Edit, Eye, Calendar, DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
// import { toast } from 'sonner';

// interface CreateLoanFormData {
//   loanName: string;
//   description: string;
//   principalAmount: string;
//   disbursementDate: string;
//   repaymentStartMonth: string;
//   interestRate: string;
//   interestType: 'simple' | 'compound';
//   tenure: string;
// }

// const LoanForm: React.FC = () => {
//   const dispatch = useDispatch<AppDispatch>();
//   const { myLoans, loading, error, success } = useSelector((state: RootState) => state.loan);

//   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [selectedLoan, setSelectedLoan] = useState<any>(null);
//   const [formData, setFormData] = useState<CreateLoanFormData>({
//     loanName: '',
//     description: '',
//     principalAmount: '',
//     disbursementDate: '',
//     repaymentStartMonth: '',
//     interestRate: '',
//     interestType: 'simple',
//     tenure: '',
//   });

//   useEffect(() => {
//     dispatch(getEmployeeLoans({}));
//   }, [dispatch]);

//   useEffect(() => {
//     if (success) {
//       toast.success('Operation completed successfully!');
//       setIsCreateModalOpen(false);
//       setIsEditModalOpen(false);
//       resetForm();
//       dispatch(clearSuccess());
//     }
//   }, [success, dispatch]);

//   useEffect(() => {
//     if (error) {
//       toast.error(error);
//       dispatch(clearError());
//     }
//   }, [error, dispatch]);

//   const resetForm = () => {
//     setFormData({
//       loanName: '',
//       description: '',
//       principalAmount: '',
//       disbursementDate: '',
//       repaymentStartMonth: '',
//       interestRate: '',
//       interestType: 'simple',
//       tenure: '',
//     });
//   };

//   const handleInputChange = (field: keyof CreateLoanFormData, value: string) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//   };

//   const handleCreateLoan = async () => {
//     try {
//       const loanData = {
//         loanName: formData.loanName,
//         description: formData.description || undefined,
//         principalAmount: parseFloat(formData.principalAmount),
//         disbursementDate: formData.disbursementDate,
//         repaymentStartMonth: formData.repaymentStartMonth,
//         interestRate: parseFloat(formData.interestRate),
//         interestType: formData.interestType,
//         tenure: parseInt(formData.tenure),
//       };

//       await dispatch(createLoanRequest(loanData)).unwrap();
//     } catch (error) {
//       console.error('Failed to create loan:', error);
//     }
//   };

//   const handleEditLoan = async () => {
//     if (!selectedLoan) return;

//     try {
//       const updateData = {
//         loanName: formData.loanName,
//         description: formData.description || undefined,
//         principalAmount: parseFloat(formData.principalAmount),
//         disbursementDate: formData.disbursementDate,
//         repaymentStartMonth: formData.repaymentStartMonth,
//         interestRate: parseFloat(formData.interestRate),
//         interestType: formData.interestType,
//         tenure: parseInt(formData.tenure),
//       };

//       await dispatch(updateLoanRequest({ id: selectedLoan._id, updateData })).unwrap();
//     } catch (error) {
//       console.error('Failed to update loan:', error);
//     }
//   };

//   const openEditModal = (loan: any) => {
//     setSelectedLoan(loan);
//     setFormData({
//       loanName: loan.loanName,
//       description: loan.description || '',
//       principalAmount: loan.principalAmount.toString(),
//       disbursementDate: loan.disbursementDate.split('T')[0],
//       repaymentStartMonth: loan.repaymentStartMonth,
//       interestRate: loan.interestRate.toString(),
//       interestType: loan.interestType,
//       tenure: loan.tenure.toString(),
//     });
//     setIsEditModalOpen(true);
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

//   const canEditLoan = (status: string) => {
//     return status === 'pending';
//   };

//   return (
//     <div className="p-6 space-y-6">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold">My Loans</h1>
//           <p className="text-muted-foreground">Manage your loan applications</p>
//         </div>
//         <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
//           <DialogTrigger asChild>
//             <Button onClick={() => resetForm()}>
//               <Plus className="w-4 h-4 mr-2" />
//               Request New Loan
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="max-w-2xl">
//             <DialogHeader>
//               <DialogTitle>Create Loan Request</DialogTitle>
//             </DialogHeader>
//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="loanName">Loan Name *</Label>
//                 <Input
//                   id="loanName"
//                   value={formData.loanName}
//                   onChange={(e) => handleInputChange('loanName', e.target.value)}
//                   placeholder="Enter loan name"
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="principalAmount">Principal Amount *</Label>
//                 <Input
//                   id="principalAmount"
//                   type="number"
//                   value={formData.principalAmount}
//                   onChange={(e) => handleInputChange('principalAmount', e.target.value)}
//                   placeholder="Enter amount"
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="disbursementDate">Disbursement Date *</Label>
//                 <Input
//                   id="disbursementDate"
//                   type="date"
//                   value={formData.disbursementDate}
//                   onChange={(e) => handleInputChange('disbursementDate', e.target.value)}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="repaymentStartMonth">Repayment Start Month *</Label>
//                 <Input
//                   id="repaymentStartMonth"
//                   type="month"
//                   value={formData.repaymentStartMonth}
//                   onChange={(e) => handleInputChange('repaymentStartMonth', e.target.value)}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="interestRate">Interest Rate (%) *</Label>
//                 <Input
//                   id="interestRate"
//                   type="number"
//                   step="0.01"
//                   value={formData.interestRate}
//                   onChange={(e) => handleInputChange('interestRate', e.target.value)}
//                   placeholder="Enter interest rate"
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="interestType">Interest Type *</Label>
//                 <Select value={formData.interestType} onValueChange={(value) => handleInputChange('interestType', value)}>
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="simple">Simple Interest</SelectItem>
//                     <SelectItem value="compound">Compound Interest</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="tenure">Tenure (Months) *</Label>
//                 <Input
//                   id="tenure"
//                   type="number"
//                   value={formData.tenure}
//                   onChange={(e) => handleInputChange('tenure', e.target.value)}
//                   placeholder="Enter tenure in months"
//                 />
//               </div>
//               <div className="space-y-2 col-span-2">
//                 <Label htmlFor="description">Description</Label>
//                 <Textarea
//                   id="description"
//                   value={formData.description}
//                   onChange={(e) => handleInputChange('description', e.target.value)}
//                   placeholder="Enter loan description (optional)"
//                   rows={3}
//                 />
//               </div>
//             </div>
//             <div className="flex justify-end space-x-2 mt-4">
//               <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
//                 Cancel
//               </Button>
//               <Button onClick={handleCreateLoan} disabled={loading}>
//                 {loading ? 'Creating...' : 'Create Loan Request'}
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       </div>

//       {/* Loans Grid */}
//       {loading && !myLoans.length ? (
//         <div className="flex justify-center items-center h-64">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
//             <p>Loading your loans...</p>
//           </div>
//         </div>
//       ) : myLoans.length === 0 ? (
//         <div className="text-center py-12">
//           <div className="w-24 h-24 mx-auto mb-4 text-muted-foreground">
//             <DollarSign className="w-full h-full" />
//           </div>
//           <h3 className="text-lg font-semibold mb-2">No loans found</h3>
//           <p className="text-muted-foreground mb-4">You haven't applied for any loans yet.</p>
//           <Button onClick={() => setIsCreateModalOpen(true)}>
//             <Plus className="w-4 h-4 mr-2" />
//             Request Your First Loan
//           </Button>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {myLoans.map((loan) => (
//             <Card key={loan._id} className="hover:shadow-lg transition-shadow">
//               <CardHeader className="pb-3">
//                 <div className="flex justify-between items-start">
//                   <CardTitle className="text-lg">{loan.loanName}</CardTitle>
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
//                 </div>

//                 {loan.rejectionReason && (
//                   <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
//                     <p className="text-sm text-destructive font-medium">Rejection Reason:</p>
//                     <p className="text-sm text-destructive">{loan.rejectionReason}</p>
//                   </div>
//                 )}

//                 <div className="flex space-x-2">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => dispatch(setCurrentLoan(loan))}
//                     className="flex-1"
//                   >
//                     <Eye className="w-4 h-4 mr-1" />
//                     View
//                   </Button>
//                   {canEditLoan(loan.status) && (
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => openEditModal(loan)}
//                       className="flex-1"
//                     >
//                       <Edit className="w-4 h-4 mr-1" />
//                       Edit
//                     </Button>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}

//       {/* Edit Modal */}
//       <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>Edit Loan Request</DialogTitle>
//           </DialogHeader>
//           <div className="grid grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="editLoanName">Loan Name *</Label>
//               <Input
//                 id="editLoanName"
//                 value={formData.loanName}
//                 onChange={(e) => handleInputChange('loanName', e.target.value)}
//                 placeholder="Enter loan name"
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="editPrincipalAmount">Principal Amount *</Label>
//               <Input
//                 id="editPrincipalAmount"
//                 type="number"
//                 value={formData.principalAmount}
//                 onChange={(e) => handleInputChange('principalAmount', e.target.value)}
//                 placeholder="Enter amount"
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="editDisbursementDate">Disbursement Date *</Label>
//               <Input
//                 id="editDisbursementDate"
//                 type="date"
//                 value={formData.disbursementDate}
//                 onChange={(e) => handleInputChange('disbursementDate', e.target.value)}
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="editRepaymentStartMonth">Repayment Start Month *</Label>
//               <Input
//                 id="editRepaymentStartMonth"
//                 type="month"
//                 value={formData.repaymentStartMonth}
//                 onChange={(e) => handleInputChange('repaymentStartMonth', e.target.value)}
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="editInterestRate">Interest Rate (%) *</Label>
//               <Input
//                 id="editInterestRate"
//                 type="number"
//                 step="0.01"
//                 value={formData.interestRate}
//                 onChange={(e) => handleInputChange('interestRate', e.target.value)}
//                 placeholder="Enter interest rate"
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="editInterestType">Interest Type *</Label>
//               <Select value={formData.interestType} onValueChange={(value) => handleInputChange('interestType', value)}>
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="simple">Simple Interest</SelectItem>
//                   <SelectItem value="compound">Compound Interest</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="editTenure">Tenure (Months) *</Label>
//               <Input
//                 id="editTenure"
//                 type="number"
//                 value={formData.tenure}
//                 onChange={(e) => handleInputChange('tenure', e.target.value)}
//                 placeholder="Enter tenure in months"
//               />
//             </div>
//             <div className="space-y-2 col-span-2">
//               <Label htmlFor="editDescription">Description</Label>
//               <Textarea
//                 id="editDescription"
//                 value={formData.description}
//                 onChange={(e) => handleInputChange('description', e.target.value)}
//                 placeholder="Enter loan description (optional)"
//                 rows={3}
//               />
//             </div>
//           </div>
//           <div className="flex justify-end space-x-2 mt-4">
//             <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
//               Cancel
//             </Button>
//             <Button onClick={handleEditLoan} disabled={loading}>
//               {loading ? 'Updating...' : 'Update Loan Request'}
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default LoanForm;
"use client"
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import {
  createLoanRequest,
  getEmployeeLoans,
  updateLoanRequest,
  clearError,
  clearSuccess,
  setCurrentLoan
} from '@/features/loan/loanSlice';
import { getLoanPresets } from '@/features/loanInterestPreset/loanPresetSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Eye, Calendar, DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CreateLoanFormData {
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

const LoanForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { myLoans, loading, error, success } = useSelector((state: RootState) => state.loan);
  const { presets } = useSelector((state: RootState) => state.loanPreset);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [formData, setFormData] = useState<CreateLoanFormData>({
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
    dispatch(getEmployeeLoans({}));
    dispatch(getLoanPresets());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      toast.success('Operation completed successfully!');
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      resetForm();
      dispatch(clearSuccess());
    }
  }, [success, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const resetForm = () => {
    setFormData({
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
    setSelectedLoan(null);
  };

  const handleInputChange = (field: keyof CreateLoanFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePresetChange = (presetId: string) => {
    const preset = presets.find((p: any) => p._id === presetId);
    setFormData(prev => ({
      ...prev,
      interestPreset: presetId,
      interestRate: preset ? preset.interestRate.toString() : '',
      interestType: preset ? preset.interestType : 'simple',
    }));
  };

  const handleCreateLoan = async () => {
    try {
      const loanData = {
        loanName: formData.loanName,
        description: formData.description || undefined,
        principalAmount: parseFloat(formData.principalAmount),
        disbursementDate: formData.disbursementDate,
        repaymentStartMonth: formData.repaymentStartMonth,
        interestPreset: formData.interestPreset || undefined,
        interestRate: parseFloat(formData.interestRate),
        interestType: formData.interestType,
        tenure: parseInt(formData.tenure),
      };
      await dispatch(createLoanRequest(loanData)).unwrap();
    } catch {
      toast.error('Failed to create loan');
    }
  };

  const handleEditLoan = async () => {
    if (!selectedLoan) return;
    try {
      const updateData = {
        loanName: formData.loanName,
        description: formData.description || undefined,
        principalAmount: parseFloat(formData.principalAmount),
        disbursementDate: formData.disbursementDate,
        repaymentStartMonth: formData.repaymentStartMonth,
        interestPreset: formData.interestPreset || undefined,
        interestRate: parseFloat(formData.interestRate),
        interestType: formData.interestType,
        tenure: parseInt(formData.tenure),
      };
      await dispatch(updateLoanRequest({ id: selectedLoan._id, updateData })).unwrap();
    } catch {
      toast.error('Failed to update loan');
    }
  };

  const openEditModal = (loan: any) => {
    // Parse dates for input fields
    const disbursementDate = loan.disbursementDate
      ? loan.disbursementDate.slice(0, 10)
      : '';
    // For input type="month", we want yyyy-MM
    const repaymentStartMonth = loan.repaymentStartMonth
      ? new Date(loan.repaymentStartMonth).toISOString().slice(0, 7)
      : '';

    setSelectedLoan(loan);
    setFormData({
      loanName: loan.loanName || '',
      description: loan.description || '',
      principalAmount: loan.principalAmount ? loan.principalAmount.toString() : '',
      disbursementDate,
      repaymentStartMonth,
      interestPreset: loan.interestPreset?._id || '',
      interestRate: loan.interestRate?.toString() || '',
      interestType: loan.interestType || 'simple',
      tenure: loan.tenure ? loan.tenure.toString() : '',
    });
    setIsEditModalOpen(true);
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

  const canEditLoan = (status: string) => status === 'pending';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Loans</h1>
          <p className="text-muted-foreground">Manage your loan applications</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Request New Loan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Loan Request</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              {/* Loan Type (Preset) */}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="presetType">Loan Type *</Label>
                <Select
                  value={formData.interestPreset || ''}
                  onValueChange={handlePresetChange}
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
                <Label htmlFor="loanName">Loan Name *</Label>
                <Input
                  id="loanName"
                  value={formData.loanName}
                  onChange={e => handleInputChange('loanName', e.target.value)}
                  placeholder="Enter loan name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="principalAmount">Principal Amount *</Label>
                <Input
                  id="principalAmount"
                  type="number"
                  value={formData.principalAmount}
                  onChange={e => handleInputChange('principalAmount', e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disbursementDate">Disbursement Date *</Label>
                <Input
                  id="disbursementDate"
                  type="date"
                  value={formData.disbursementDate}
                  onChange={e => handleInputChange('disbursementDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repaymentStartMonth">Repayment Start Month *</Label>
                <Input
                  id="repaymentStartMonth"
                  type="month"
                  value={formData.repaymentStartMonth}
                  onChange={e => handleInputChange('repaymentStartMonth', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate (%) *</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  value={formData.interestRate}
                  onChange={e => handleInputChange('interestRate', e.target.value)}
                  placeholder="Enter interest rate"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interestType">Interest Type *</Label>
                <Select value={formData.interestType} onValueChange={value => handleInputChange('interestType', value)}>
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
                <Label htmlFor="tenure">Tenure (Months) *</Label>
                <Input
                  id="tenure"
                  type="number"
                  value={formData.tenure}
                  onChange={e => handleInputChange('tenure', e.target.value)}
                  placeholder="Enter tenure in months"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  placeholder="Enter loan description (optional)"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateLoan} disabled={loading}>
                {loading ? 'Creating...' : 'Create Loan Request'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loans Grid */}
      {loading && !myLoans.length ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading your loans...</p>
          </div>
        </div>
      ) : myLoans.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 text-muted-foreground">
            <DollarSign className="w-full h-full" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No loans found</h3>
          <p className="text-muted-foreground mb-4">You haven't applied for any loans yet.</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Request Your First Loan
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myLoans.map((loan) => (
            <Card key={loan._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{loan.loanName}</CardTitle>
                  {getStatusBadge(loan.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Principal</p>
                      <p className="font-medium">₹{loan.principalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
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
                    <p className="text-muted-foreground">Repayment Start Month</p>
                    <p className="font-medium">
                      {loan.repaymentStartMonth
                        ? new Date(loan.repaymentStartMonth).toISOString().slice(0, 7)
                        : '—'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Loan Type</p>
                    {loan.interestPreset ? (
                      <p className="font-medium">
                        {loan.interestPreset.name} ({loan.interestPreset.interestRate}% {loan.interestPreset.interestType})
                      </p>
                    ) : (
                      <p className="text-muted-foreground">—</p>
                    )}
                  </div>
                </div>

                {loan.rejectionReason && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive font-medium">Rejection Reason:</p>
                    <p className="text-sm text-destructive">{loan.rejectionReason}</p>
                  </div>
                )}

                <div className="flex space-x-2">

                  {canEditLoan(loan.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(loan)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Loan Request</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {/* Loan Type (Preset) */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="editPresetType">Loan Type *</Label>
              <Select
                value={formData.interestPreset || ''}
                onValueChange={handlePresetChange}
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
            {/* All other fields, same logic as Create */}
            <div className="space-y-2">
              <Label htmlFor="editLoanName">Loan Name *</Label>
              <Input
                id="editLoanName"
                value={formData.loanName}
                onChange={e => handleInputChange('loanName', e.target.value)}
                placeholder="Enter loan name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPrincipalAmount">Principal Amount *</Label>
              <Input
                id="editPrincipalAmount"
                type="number"
                value={formData.principalAmount}
                onChange={e => handleInputChange('principalAmount', e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDisbursementDate">Disbursement Date *</Label>
              <Input
                id="editDisbursementDate"
                type="date"
                value={formData.disbursementDate}
                onChange={e => handleInputChange('disbursementDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRepaymentStartMonth">Repayment Start Month *</Label>
              <Input
                id="editRepaymentStartMonth"
                type="month"
                value={formData.repaymentStartMonth}
                onChange={e => handleInputChange('repaymentStartMonth', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editInterestRate">Interest Rate (%) *</Label>
              <Input
                id="editInterestRate"
                type="number"
                step="0.01"
                value={formData.interestRate}
                onChange={e => handleInputChange('interestRate', e.target.value)}
                placeholder="Enter interest rate"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editInterestType">Interest Type *</Label>
              <Select value={formData.interestType} onValueChange={value => handleInputChange('interestType', value)}>
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
                value={formData.tenure}
                onChange={e => handleInputChange('tenure', e.target.value)}
                placeholder="Enter tenure in months"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                placeholder="Enter loan description (optional)"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditLoan} disabled={loading}>
              {loading ? 'Updating...' : 'Update Loan Request'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoanForm;
