"use client"
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import {
  getLoanInstallments,
  markInstallmentPaid,
  getPaymentHistory,
  clearError,
  clearSuccess,
  setCurrentInstallment,
  clearInstallments,
  clearPaymentHistory
} from '@/features/loanInstallment/loanInstallmentSlice';
import { getAllLoans } from '@/features/loan/loanSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  History,
  CreditCard,
  Filter,
  Eye,
  Check,
  Search,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

interface MarkPaidFormData {
  paidAmount: string;
  paidDate: string;
}

const AdminLoanInstallmentDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { installments, paymentHistory, summary, loading, error, success } = useSelector(
    (state: RootState) => state.loanInstallment
  );
  const { loans } = useSelector((state: RootState) => state.loan);
  
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [isMarkPaidModalOpen, setIsMarkPaidModalOpen] = useState(false);
  const [formData, setFormData] = useState<MarkPaidFormData>({
    paidAmount: '',
    paidDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    dispatch(getAllLoans({}));
  }, [dispatch]);

  useEffect(() => {
    if (selectedLoanId) {
      const filters = statusFilter !== 'all' ? { status: statusFilter as any } : {};
      dispatch(getLoanInstallments({ loanId: selectedLoanId, filters }));
      dispatch(getPaymentHistory(selectedLoanId));
    } else {
      dispatch(clearInstallments());
      dispatch(clearPaymentHistory());
    }
  }, [selectedLoanId, statusFilter, dispatch]);

  useEffect(() => {
    if (success) {
      toast.success('Installment marked as paid successfully!');
      setIsMarkPaidModalOpen(false);
      resetForm();
      if (selectedLoanId) {
        const filters = statusFilter !== 'all' ? { status: statusFilter as any } : {};
        dispatch(getLoanInstallments({ loanId: selectedLoanId, filters }));
        dispatch(getPaymentHistory(selectedLoanId));
      }
      dispatch(clearSuccess());
    }
  }, [success, dispatch, selectedLoanId, statusFilter]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const resetForm = () => {
    setFormData({
      paidAmount: '',
      paidDate: new Date().toISOString().split('T')[0],
    });
    setSelectedInstallment(null);
  };

  const handleInputChange = (field: keyof MarkPaidFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMarkPaid = async () => {
    if (!selectedInstallment || !formData.paidAmount) {
      toast.error('Please enter paid amount');
      return;
    }

    try {
      const paidData = {
        paidAmount: parseFloat(formData.paidAmount),
        paidDate: formData.paidDate,
      };
      
      await dispatch(markInstallmentPaid({ 
        installmentId: selectedInstallment._id, 
        paidData 
      })).unwrap();
    } catch (error) {
      console.error('Failed to mark installment as paid:', error);
    }
  };

  const openMarkPaidModal = (installment: any) => {
    setSelectedInstallment(installment);
    setFormData({
      paidAmount: installment.amount.toString(),
      paidDate: new Date().toISOString().split('T')[0],
    });
    setIsMarkPaidModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      due: { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      paid: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      overdue: { variant: 'destructive' as const, icon: AlertTriangle, color: 'text-red-600' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || Clock;

    return (
      <Badge variant={config?.variant || 'secondary'}>
        <Icon className={`w-3 h-3 mr-1 ${config?.color}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const selectedLoan = loans.find(loan => loan._id === selectedLoanId);

  // Filter loans based on search
  const filteredLoans = loans.filter(loan => 
    loan.status === 'active' || loan.status === 'completed'
  ).filter(loan => {
    if (!searchTerm) return true;
    return loan.loanName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           loan.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           loan.userId.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredInstallments = installments.filter(installment => {
    if (statusFilter === 'all') return true;
    return installment.status === statusFilter;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Loan Installment Management</h1>
          <p className="text-muted-foreground">Manage loan installments and track payments</p>
        </div>
      </div>

      {/* Loan Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Loan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search loans, employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedLoanId} onValueChange={setSelectedLoanId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a loan to manage installments" />
            </SelectTrigger>
            <SelectContent>
              {filteredLoans.map((loan) => (
                <SelectItem key={loan._id} value={loan._id}>
                  {loan.loanName} - {loan.userId.name} - ₹{loan.principalAmount.toLocaleString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedLoanId && selectedLoan && (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{summary.totalInstallments}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Paid</p>
                      <p className="text-2xl font-bold">{summary.paidInstallments}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-8 h-8 text-yellow-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Due</p>
                      <p className="text-2xl font-bold">{summary.dueInstallments}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Paid</p>
                      <p className="text-lg font-bold">
                        ₹{summary.totalPaid?.[0]?.total?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-8 h-8 text-orange-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Due</p>
                      <p className="text-lg font-bold">
                        ₹{summary.totalDue?.[0]?.total?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Loan Details */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Loan Name</p>
                  <p className="font-medium">{selectedLoan.loanName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Employee</p>
                  <p className="font-medium">{selectedLoan.userId.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Principal Amount</p>
                  <p className="font-medium">₹{selectedLoan.principalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly EMI</p>
                  <p className="font-medium">₹{selectedLoan.monthlyInstallment.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedLoan.status === 'active' ? 'default' : 'outline'}>
                    {selectedLoan.status.charAt(0).toUpperCase() + selectedLoan.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="installments" className="space-y-4">
            <TabsList>
              <TabsTrigger value="installments">Installments</TabsTrigger>
              <TabsTrigger value="history">Payment History</TabsTrigger>
            </TabsList>

            <TabsContent value="installments" className="space-y-4">
              {/* Filter */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Installment Schedule</h3>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="due">Due</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Installments Grid */}
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredInstallments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No installments found</h3>
                  <p className="text-muted-foreground">No installments match your current filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredInstallments.map((installment) => (
                    <Card key={installment._id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              Installment #{installment.installmentNumber}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Due: {new Date(installment.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          {getStatusBadge(installment.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Amount</span>
                          <span className="font-medium">₹{installment.amount.toLocaleString()}</span>
                        </div>
                        
                        {installment.status === 'paid' && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Paid Amount</span>
                              <span className="font-medium text-green-600">
                                ₹{installment.paidAmount.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Paid Date</span>
                              <span className="font-medium">
                                {installment.paidDate 
                                  ? new Date(installment.paidDate).toLocaleDateString()
                                  : 'N/A'
                                }
                              </span>
                            </div>
                          </>
                        )}

                        {installment.principalComponent && installment.interestComponent && (
                          <div className="pt-2 border-t">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">Principal</span>
                              <span>₹{installment.principalComponent.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">Interest</span>
                              <span>₹{installment.interestComponent.toLocaleString()}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex space-x-2 pt-2">
                          {/* <Button
                            variant="outline"
                            size="sm"
                            onClick={() => dispatch(setCurrentInstallment(installment))}
                            className="flex-1"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button> */}
                          {installment.status !== 'paid' && (
                            <Button
                              size="sm"
                              onClick={() => openMarkPaidModal(installment)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <h3 className="text-lg font-semibold">Payment History</h3>
              
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No payment history</h3>
                  <p className="text-muted-foreground">No payments have been made yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentHistory.map((installment) => (
                    <Card key={installment._id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">Installment #{installment.installmentNumber}</p>
                              <p className="text-sm text-muted-foreground">
                                Paid on {installment.paidDate 
                                  ? new Date(installment.paidDate).toLocaleDateString()
                                  : 'N/A'
                                }
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-600">
                              ₹{installment.paidAmount.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Due: ₹{installment.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* No Loan Selected */}
      {!selectedLoanId && (
        <div className="text-center py-12">
          <Users className="w-24 h-24 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Select a Loan</h3>
          <p className="text-muted-foreground">
            Choose a loan from the dropdown above to manage its installments.
          </p>
        </div>
      )}

      {/* Mark Paid Modal */}
      <Dialog open={isMarkPaidModalOpen} onOpenChange={setIsMarkPaidModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Installment as Paid</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Installment #{selectedInstallment?.installmentNumber}
              </p>
              <p className="font-medium">
                Due Amount: ₹{selectedInstallment?.amount?.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Due Date: {selectedInstallment?.dueDate 
                  ? new Date(selectedInstallment.dueDate).toLocaleDateString()
                  : 'N/A'
                }
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paidAmount">Paid Amount *</Label>
              <Input
                id="paidAmount"
                type="number"
                step="0.01"
                value={formData.paidAmount}
                onChange={(e) => handleInputChange('paidAmount', e.target.value)}
                placeholder="Enter paid amount"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paidDate">Payment Date *</Label>
              <Input
                id="paidDate"
                type="date"
                value={formData.paidDate}
                onChange={(e) => handleInputChange('paidDate', e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsMarkPaidModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleMarkPaid} 
              disabled={loading || !formData.paidAmount}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Processing...' : 'Mark as Paid'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLoanInstallmentDashboard;
