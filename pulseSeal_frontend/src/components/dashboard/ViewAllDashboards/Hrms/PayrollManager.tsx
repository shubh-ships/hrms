// components/admin/PayrollManager.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calculator,
  Play,
  Check,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  FileText,
  RefreshCw,
  Search,
  Filter,
  PlayCircle,
  CheckCircle2,
  IndianRupee ,
  User
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  createPayrollRun,
  completePayrollRun,
  fetchPayrollRuns,
  clearError,
  setSelectedPayrollRun
} from '@/features/payroll/payrollSlice';

const PayrollManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { 
    payrollRuns, 
    selectedPayrollRun,
    loading, 
    createLoading,
    completeLoading,
    error
  } = useAppSelector((state) => state.payroll);

  // Form state
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    dispatch(fetchPayrollRuns());
  }, [dispatch]);

  const handleCreatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMonth || !selectedYear) {
      toast.error('Please select both month and year');
      return;
    }

    try {
      await dispatch(createPayrollRun({
        month: selectedMonth,
        year: selectedYear
      })).unwrap();

      toast.success(`Payroll run created successfully for ${getMonthName(selectedMonth)} ${selectedYear}`);
      setIsCreateDialogOpen(false);

    } catch (error: any) {
      toast.error(error || 'Failed to create payroll run');
    }
  };

  const handleCompletePayroll = async () => {
    if (!selectedPayrollRun) return;

    try {
      await dispatch(completePayrollRun(selectedPayrollRun._id)).unwrap();
      toast.success('Payroll run completed successfully');
      setIsCompleteDialogOpen(false);
      dispatch(setSelectedPayrollRun(null));
    } catch (error: any) {
      toast.error(error || 'Failed to complete payroll run');
    }
  };

  const getMonthName = (month: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950/30">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      case 'processed':
        return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/30">
          <Calculator className="h-3 w-3 mr-1" />
          Processed
        </Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-orange-600 dark:text-orange-400';
      case 'processed':
        return 'text-blue-600 dark:text-blue-400';
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Filter payroll runs
  const filteredPayrollRuns = Array.isArray(payrollRuns) ? payrollRuns.filter(run => {
    const matchesSearch = `${getMonthName(run.month)} ${run.year}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || run.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];

  // Calculate summary statistics
  const totalRuns = filteredPayrollRuns.length;
  const completedRuns = filteredPayrollRuns.filter(run => run.status === 'completed').length;
  const pendingRuns = filteredPayrollRuns.filter(run => run.status === 'pending').length;
  const processedRuns = filteredPayrollRuns.filter(run => run.status === 'processed').length;
  const totalAmountPaid = filteredPayrollRuns
    .filter(run => run.status === 'completed')
    .reduce((sum, run) => sum + run.totalAmount, 0);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: getMonthName(i + 1) }));

  return (
    <div className="space-y-6">
      {/* Header with Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Total Runs
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {totalRuns}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              All payroll runs
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Completed
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {completedRuns}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Successfully completed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  In Progress
                </p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {pendingRuns + processedRuns}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              Pending & Processed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  Total Paid
                </p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  ₹{totalAmountPaid.toLocaleString()}
                </p>
                
              </div>
              <IndianRupee className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              Completed payrolls
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Management Card */}
      <Card className="shadow-sm border-border bg-card">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Calculator className="h-5 w-5 text-primary" />
            Payroll Management
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Create, process, and manage employee payroll runs for your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search payroll runs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-input"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-background border-input">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Play className="mr-2 h-4 w-4" />
                    Create Payroll Run
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-background border-border">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Create New Payroll Run</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Select the month and year to create a new payroll run for all employees
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreatePayroll} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Month</Label>
                        <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                          <SelectTrigger className="bg-background border-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {months.map((month) => (
                              <SelectItem key={month.value} value={month.value.toString()}>
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Year</Label>
                        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                          <SelectTrigger className="bg-background border-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {years.map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
                      <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertDescription className="text-blue-800 dark:text-blue-200">
                        This will generate salary slips for all active employees in your organization for{' '}
                        <strong>{getMonthName(selectedMonth)} {selectedYear}</strong>
                      </AlertDescription>
                    </Alert>

                    <div className="flex gap-2 pt-4">
                      <Button 
                        type="submit"
                        disabled={createLoading}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {createLoading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Create Payroll Run
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                        className="flex-1 bg-background border-input hover:bg-accent"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Button 
                variant="outline" 
                onClick={() => dispatch(fetchPayrollRuns())}
                disabled={loading}
                className="bg-background border-input hover:bg-accent"
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Error Alert */}
          {error && (
            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Payroll Runs List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Payroll Runs</h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading payroll runs...</span>
              </div>
            ) : filteredPayrollRuns.length === 0 ? (
              <Card className="bg-muted/50">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    {searchTerm ? 'No payroll runs found matching your search.' : 'No payroll runs found.'}
                  </p>
                  {!searchTerm && (
                    <Button 
                      className="mt-4" 
                      onClick={() => setIsCreateDialogOpen(true)}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Create Your First Payroll Run
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredPayrollRuns.map((payrollRun) => (
                  <Card key={payrollRun._id} className="hover:shadow-md transition-shadow border-border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Calculator className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground text-lg">
                              {getMonthName(payrollRun.month)} {payrollRun.year}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              Created on {format(parseISO(payrollRun.generatedAt), 'MMM dd, yyyy HH:mm')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <User className="h-3 w-3 inline mr-1" />
                              Initiated by {payrollRun.initiatedBy?.name} ({payrollRun.initiatedBy?.email})
                            </p>
                            {payrollRun.completedAt && (
                              <p className="text-sm text-muted-foreground">
                                <CheckCircle className="h-3 w-3 inline mr-1" />
                                Completed on {format(parseISO(payrollRun.completedAt), 'MMM dd, yyyy HH:mm')}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Employees</p>
                            <p className="text-lg font-semibold text-foreground">
                              {payrollRun.totalEmployees}
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Total Amount</p>
                            <p className="text-lg font-semibold text-foreground">
                              ₹{payrollRun.totalAmount.toLocaleString()}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {getStatusBadge(payrollRun.status)}
                            
                            {payrollRun.status === 'processed' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  dispatch(setSelectedPayrollRun(payrollRun));
                                  setIsCompleteDialogOpen(true);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Complete Payroll Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Complete Payroll Run
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to mark this payroll run as completed? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayrollRun && (
            <div className="space-y-4">
              <Card className="bg-muted/50 border-border">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-foreground">Period:</p>
                      <p className="text-muted-foreground">
                        {getMonthName(selectedPayrollRun.month)} {selectedPayrollRun.year}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Total Employees:</p>
                      <p className="text-muted-foreground">{selectedPayrollRun.totalEmployees}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Total Amount:</p>
                      <p className="text-muted-foreground">₹{selectedPayrollRun.totalAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Status:</p>
                      <p className="text-muted-foreground">{getStatusBadge(selectedPayrollRun.status)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="font-medium text-foreground">Initiated By:</p>
                      <p className="text-muted-foreground">
                        {selectedPayrollRun.initiatedBy?.name} ({selectedPayrollRun.initiatedBy?.email})
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleCompletePayroll}
                  disabled={completeLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {completeLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Complete Payroll
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCompleteDialogOpen(false)}
                  disabled={completeLoading}
                  className="flex-1 bg-background border-input hover:bg-accent"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayrollManager;
