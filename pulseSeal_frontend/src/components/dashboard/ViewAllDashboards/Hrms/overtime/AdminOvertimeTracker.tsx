"use client";
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store';
import {
  fetchMonthlyOvertimeByUserId,
  selectOvertime,
  selectOvertimeLoading,
  selectOvertimeError,
  clearOvertime,
  clearError
} from '@/features/overtime/overtimeSlice';
import { selectUsers, fetchUsers, selectUsersLoading } from '@/features/user/userSlice';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Calendar,
  Clock,
  Timer,
  TrendingUp,
  Users,
  RefreshCw,
  Loader2,
  AlertCircle,
  CalendarDays,
  Eye
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserData {
  _id: string;
  user_id: {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: number;
    isActive: boolean;
  };
  roleDefinitionId: {
    _id: string;
    roleName: string;
  };
  departments: Array<{
    _id: string;
    name: string;
    alias: string;
  }>;
  status: string;
}

const AdminOvertimeManager = () => {
  const dispatch = useDispatch<AppDispatch>();
  const users = useSelector(selectUsers) as UserData[];
  const usersLoading = useSelector(selectUsersLoading);
  const overtime = useSelector(selectOvertime);
  const loading = useSelector(selectOvertimeLoading);
  const error = useSelector(selectOvertimeError);

  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const months = [
    { value: "1", label: 'January' },
    { value: "2", label: 'February' },
    { value: "3", label: 'March' },
    { value: "4", label: 'April' },
    { value: "5", label: 'May' },
    { value: "6", label: 'June' },
    { value: "7", label: 'July' },
    { value: "8", label: 'August' },
    { value: "9", label: 'September' },
    { value: "10", label: 'October' },
    { value: "11", label: 'November' },
    { value: "12", label: 'December' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const filteredUsers = users?.filter(user =>
    user?.user_id?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user?.user_id?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user?.roleDefinitionId?.roleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user?.departments?.some(dept => 
      dept?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept?.alias?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const handleUserClick = (user: UserData) => {
    setSelectedUser(user);
    if (selectedMonth && selectedYear) {
      fetchOvertimeForUser(user.user_id._id);
    } else {
      alert('Please select month and year first');
    }
  };

  const fetchOvertimeForUser = (userId: string) => {
    if (!selectedMonth || !selectedYear) {
      alert('Please select month and year first');
      return;
    }

    dispatch(clearError());
    dispatch(fetchMonthlyOvertimeByUserId({
      userId,
      month: parseInt(selectedMonth),
      year: parseInt(selectedYear)
    }));
    setIsModalOpen(true);
  };

  const formatTime = (hours: number, minutes: number) => {
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTimeOnly = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Safe function to handle null totalWorkedMinutes
  const formatWorkedTime = (totalWorkedMinutes: number | null) => {
    if (totalWorkedMinutes === null || totalWorkedMinutes === undefined) {
      return "N/A";
    }
    const hours = Math.floor(totalWorkedMinutes / 60);
    const minutes = totalWorkedMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  // Safe function to format overtime/less time
  const formatTimeWithSign = (timeInMinutes: number, isOvertime: boolean) => {
    if (timeInMinutes <= 0) {
      return <span className="text-muted-foreground">-</span>;
    }
    
    const hours = Math.floor(timeInMinutes / 60);
    const minutes = timeInMinutes % 60;
    const timeString = `${hours}h ${minutes}m`;
    
    if (isOvertime) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          +{timeString}
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
          -{timeString}
        </Badge>
      );
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    dispatch(clearOvertime());
    setSelectedUser(null);
  };

  return (
    <div className="min-h-screen dark:bg-[#101828] bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <Timer className="w-10 h-10 text-blue-600" />
            Overtime Management
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage employee overtime - {filteredUsers.length} employees found
          </p>
        </div>

        {/* Controls */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Filters & Controls</CardTitle>
            <CardDescription>
              Select month and year, then search and select an employee to view their overtime
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="space-y-2 w-full lg:w-48">
                <Label htmlFor="filter-month">Month</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger id="filter-month">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 w-full lg:w-32">
                <Label htmlFor="filter-year">Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="filter-year">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex-1 max-w-sm">
                <Label htmlFor="search-users">Search Employees</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="search-users"
                    placeholder="Search by name, email, role, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => dispatch(fetchUsers())}
                  disabled={usersLoading}
                >
                  {usersLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Users Table */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b dark:from-blue-950/20 dark:to-indigo-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-blue-600" />
                <div>
                  <CardTitle className="text-2xl">Employee Directory</CardTitle>
                  <CardDescription>Select an employee to view their overtime data</CardDescription>
                </div>
              </div>
              <Badge variant="secondary">
                {filteredUsers.length} employees
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {usersLoading ? (
              <div className="flex flex-col justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="mt-4 text-muted-foreground">Loading employees...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No employees found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search criteria' : 'No employees available'}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user._id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                {user?.user_id?.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user?.user_id?.name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{user?.user_id?.email || 'No email'}</p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline">
                            {user?.roleDefinitionId?.roleName || 'No role'}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {user?.departments?.length > 0 ? (
                              user.departments.map((dept) => (
                                <Badge key={dept._id} variant="secondary" className="text-xs">
                                  {dept.name}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                No department
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={user.status === 'active' ? 'default' : 'secondary'}
                            className="capitalize"
                          >
                            {user.status || 'Unknown'}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleUserClick(user)}
                            disabled={!selectedMonth || !selectedYear || (loading && selectedUser?._id === user._id)}
                          >
                            {loading && selectedUser?._id === user._id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 mr-2" />
                                View Overtime
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

    
        <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
          <DialogContent  className="max-w-[98vw] w-[98vw] max-h-[98vh] overflow-hidden sm:max-w-[90vw] sm:w-[90vw] lg:max-w-[85vw] lg:w-[85vw]"
            style={{ width: '98vw', maxWidth: '98vw' }}>
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Timer className="w-6 h-6 text-blue-600" />
                Overtime Details
              </DialogTitle>
              {selectedUser && (
                <p className="text-sm text-muted-foreground">
                  {selectedUser.user_id.name} - {' '}
                  {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                </p>
              )}
            </DialogHeader>

            <ScrollArea className="max-h-[75vh]">
              {loading ? (
                <div className="flex flex-col justify-center items-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="mt-4 text-muted-foreground">Loading overtime data...</p>
                </div>
              ) : overtime ? (
                <div className="p-6 space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Overtime</p>
                            <p className="text-xl font-bold text-green-600">
                              {overtime?.totalOverTimeHours ? 
                                formatTime(overtime.totalOverTimeHours.hours, overtime.totalOverTimeHours.minutes) : 
                                '0h 0m'
                              }
                            </p>
                          </div>
                          <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Less Time</p>
                            <p className="text-xl font-bold text-red-600">
                              {overtime?.totalLessTimeHours ? 
                                formatTime(overtime.totalLessTimeHours.hours, overtime.totalLessTimeHours.minutes) : 
                                '0h 0m'
                              }
                            </p>
                          </div>
                          <Clock className="h-6 w-6 text-red-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Days Worked</p>
                            <p className="text-xl font-bold">{overtime?.daysWorked || 0}</p>
                          </div>
                          <CalendarDays className="h-6 w-6 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Employee</p>
                            <p className="text-sm font-bold">{selectedUser?.user_id?.name || 'Unknown'}</p>
                          </div>
                          <Users className="h-6 w-6 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Daily Breakdown Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Daily Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Login Time</TableHead>
                            <TableHead>Logout Time</TableHead>
                            <TableHead>Total Worked</TableHead>
                            <TableHead>Overtime</TableHead>
                            <TableHead>Less Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {overtime?.dailyBreakdown?.map((day, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {formatDate(day.date)}
                              </TableCell>
                              <TableCell>
                                {formatTimeOnly(day.loginTime)}
                              </TableCell>
                              <TableCell>
                                {day.logoutTime === "pending" ? (
                                  <Badge variant="outline" className="text-yellow-600 border-yellow-600 dark:text-yellow-400 dark:border-yellow-400">
                                    Pending
                                  </Badge>
                                ) : (
                                  formatTimeOnly(day.logoutTime)
                                )}
                              </TableCell>
                              <TableCell>
                                {formatWorkedTime(day.totalWorkedMinutes)}
                              </TableCell>
                              <TableCell>
                                {formatTimeWithSign(day.overTime, true)}
                              </TableCell>
                              <TableCell>
                                {formatTimeWithSign(day.lessTime, false)}
                              </TableCell>
                            </TableRow>
                          )) || (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No daily breakdown data available
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-16">
                  <Timer className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No overtime data found</h3>
                  <p className="text-muted-foreground">No data available for the selected period</p>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminOvertimeManager;
