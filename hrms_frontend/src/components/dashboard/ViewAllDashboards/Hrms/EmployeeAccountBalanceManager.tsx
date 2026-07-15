// components/admin/EmployeeAccountBalanceManager.tsx
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
  DollarSign, 
  Plus, 
  Minus,
  Save, 
  AlertCircle, 
  CheckCircle, 
  Trash2, 
  Edit2, 
  ArrowRight,
  History,
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUsers } from '@/features/user/userSlice';
import { 
  createTransaction,
  fetchEmployeeBalance,
  fetchOrganizationBalances,
  fetchTransactionHistory,
  clearError,
  setSelectedBalance
} from '@/features/accountBalance/accountBalanceSlice';

const EmployeeAccountBalanceManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { users, loading: usersLoading } = useAppSelector((state) => state.users);
  const { 
    balances, 
    selectedBalance, 
    transactions,
    loading, 
    transactionLoading,
    error,
    pagination
  } = useAppSelector((state) => state.accountBalance);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [transactionAmount, setTransactionAmount] = useState<string>('');
  const [operation, setOperation] = useState<'credit' | 'debit'>('credit');
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchOrganizationBalances({ page: currentPage, limit: 10 }));
  }, [dispatch, currentPage]);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast.error('Please select an employee');
      return;
    }

    if (!transactionAmount || parseFloat(transactionAmount) <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    try {
      await dispatch(createTransaction({
        userId: selectedUserId,
        amount: parseFloat(transactionAmount),
        operation
      })).unwrap();

      toast.success(`Transaction ${operation} of ₹${transactionAmount} processed successfully`);
      
      // Reset form
      setSelectedUserId('');
      setTransactionAmount('');
      setOperation('credit');
      setIsTransactionDialogOpen(false);

      // Refresh balances
      dispatch(fetchOrganizationBalances({ page: currentPage, limit: 10 }));

    } catch (error: any) {
      toast.error(error || 'Failed to process transaction');
    }
  };

  const handleViewHistory = async (userId: string) => {
    try {
      await dispatch(fetchTransactionHistory({ userId, page: 1, limit: 20 })).unwrap();
      setIsHistoryDialogOpen(true);
    } catch (error: any) {
      toast.error(error || 'Failed to fetch transaction history');
    }
  };

  const handleRefreshBalances = () => {
    dispatch(fetchOrganizationBalances({ page: currentPage, limit: 10 }));
  };

  const filteredBalances = balances.filter(balance =>
    balance.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    balance.userId.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUserData = users.find(user => user.user_id._id === selectedUserId);

  const getBalanceColor = (amount: number) => {
    if (amount > 0) return 'text-green-600 dark:text-green-400';
    if (amount < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getOperationIcon = (operation: 'credit' | 'debit') => {
    return operation === 'credit' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const getOperationColor = (operation: 'credit' | 'debit') => {
    return operation === 'credit' 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';
  };

  // Calculate summary statistics
  const totalPositiveBalance = filteredBalances
    .filter(balance => balance.totalAmount > 0)
    .reduce((sum, balance) => sum + balance.totalAmount, 0);
  
  const totalNegativeBalance = filteredBalances
    .filter(balance => balance.totalAmount < 0)
    .reduce((sum, balance) => sum + Math.abs(balance.totalAmount), 0);

  const employeesWithPositiveBalance = filteredBalances.filter(balance => balance.totalAmount > 0).length;
  const employeesWithNegativeBalance = filteredBalances.filter(balance => balance.totalAmount < 0).length;

  return (
    <div className="space-y-6">
      {/* Header with Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Positive Balance
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  ₹{totalPositiveBalance.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {employeesWithPositiveBalance} employees
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Negative Balance
                </p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  ₹{totalNegativeBalance.toLocaleString()}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {employeesWithNegativeBalance} employees
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Total Employees
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {filteredBalances.length}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Account holders
            </p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  Net Balance
                </p>
                <p className={cn(
                  "text-2xl font-bold",
                  getBalanceColor(totalPositiveBalance - totalNegativeBalance)
                )}>
                  ₹{(totalPositiveBalance - totalNegativeBalance).toLocaleString()}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              Organization total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Management Card */}
      <Card className="shadow-sm border-border bg-card">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <DollarSign className="h-5 w-5 text-primary" />
            Employee Account Balance Management
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage employee account balances, create transactions, and view transaction history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background border-input"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Transaction
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-background border-border">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Create New Transaction</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Add credit or debit transaction for an employee
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateTransaction} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="employee-select" className="text-sm font-medium text-foreground">
                        Select Employee
                      </Label>
                      <Select value={selectedUserId} onValueChange={setSelectedUserId} required>
                        <SelectTrigger className="bg-background border-input">
                          <SelectValue placeholder="Choose an employee" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {users.map((user) => (
                            <SelectItem key={user._id} value={user.user_id._id}>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-foreground">{user.user_id.name}</span>
                                <span className="text-muted-foreground">- {user.user_id.email}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount" className="text-sm font-medium text-foreground">
                          Amount (₹)
                        </Label>
                        <Input
                          id="amount"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={transactionAmount}
                          onChange={(e) => setTransactionAmount(e.target.value)}
                          placeholder="0.00"
                          className="bg-background border-input"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Transaction Type</Label>
                        <Select value={operation} onValueChange={(value: 'credit' | 'debit') => setOperation(value)}>
                          <SelectTrigger className="bg-background border-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="credit">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                Credit (+)
                              </div>
                            </SelectItem>
                            <SelectItem value="debit">
                              <div className="flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                                Debit (-)
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {selectedUserData && (
                      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
                        <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertDescription className="text-blue-800 dark:text-blue-200">
                          Transaction will be processed for: <strong>{selectedUserData.user_id.name}</strong>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button 
                        type="submit"
                        disabled={transactionLoading || !selectedUserId || !transactionAmount}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {transactionLoading ? 'Processing...' : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Create Transaction
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => setIsTransactionDialogOpen(false)}
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
                onClick={handleRefreshBalances}
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

          {/* Balances List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Employee Balances</h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading balances...</span>
              </div>
            ) : filteredBalances.length === 0 ? (
              <Card className="bg-muted/50">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    {searchTerm ? 'No employees found matching your search.' : 'No employee balances found.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredBalances.map((balance) => (
                  <Card key={balance._id} className="hover:shadow-md transition-shadow border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{balance.userId.name}</h4>
                            <p className="text-sm text-muted-foreground">{balance.userId.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Current Balance</p>
                            <p className={cn("text-lg font-semibold", getBalanceColor(balance.totalAmount))}>
                              ₹{balance.totalAmount.toLocaleString()}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {balance.history?.length || 0} transactions
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewHistory(balance.userId._id)}
                              className="bg-background border-input hover:bg-accent"
                            >
                              <History className="h-4 w-4 mr-1" />
                              History
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalRecords} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                  disabled={currentPage === pagination.totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-4xl bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <History className="h-5 w-5" />
              Transaction History
            </DialogTitle>
            {selectedBalance && (
              <DialogDescription className="text-muted-foreground">
                Transaction history for {selectedBalance.userId.name} - 
                Current Balance: <span className={cn("font-semibold", getBalanceColor(selectedBalance.totalAmount))}>
                  ₹{selectedBalance.totalAmount.toLocaleString()}
                </span>
              </DialogDescription>
            )}
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <History className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No transaction history available.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction, index) => (
                  <Card key={index} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-full",
                            transaction.operation === 'credit' 
                              ? 'bg-green-100 dark:bg-green-900/30' 
                              : 'bg-red-100 dark:bg-red-900/30'
                          )}>
                            {getOperationIcon(transaction.operation)}
                          </div>
                          <div>
                            <p className={cn("font-medium", getOperationColor(transaction.operation))}>
                              {transaction.operation === 'credit' ? 'Credit' : 'Debit'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {format(new Date(transaction.timestamp), 'MMM dd, yyyy HH:mm')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-lg font-semibold", getOperationColor(transaction.operation))}>
                            {transaction.operation === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeAccountBalanceManager;
