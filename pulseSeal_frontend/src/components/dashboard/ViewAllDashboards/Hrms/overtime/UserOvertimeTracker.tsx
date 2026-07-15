"use client";
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store';
import {
  fetchMonthlyOvertime,
  selectOvertime,
  selectOvertimeLoading,
  selectOvertimeError,
  clearOvertime,
  clearError
} from '@/features/overtime/overtimeSlice';
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
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  Clock,
  TrendingUp,
  RefreshCw,
  Loader2,
  AlertCircle,
  Timer,
  CalendarDays
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const UserOvertimeTracker = () => {
  const dispatch = useDispatch<AppDispatch>();
  const overtime = useSelector(selectOvertime);
  const loading = useSelector(selectOvertimeLoading);
  const error = useSelector(selectOvertimeError);

  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

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

  // Set current month and year as default
  useEffect(() => {
    const now = new Date();
    setSelectedMonth((now.getMonth() + 1).toString());
    setSelectedYear(now.getFullYear().toString());
  }, []);

  // Fetch overtime when month/year changes
  useEffect(() => {
    if (selectedMonth && selectedYear) {
      handleFetchOvertime();
    }
  }, [selectedMonth, selectedYear]);

  const handleFetchOvertime = () => {
    if (!selectedMonth || !selectedYear) {
      alert('Please select month and year');
      return;
    }

    dispatch(clearError());
    dispatch(fetchMonthlyOvertime({
      month: parseInt(selectedMonth),
      year: parseInt(selectedYear)
    }));
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

  return (
    <div className="min-h-screen dark:bg-[#101828] bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <Timer className="w-10 h-10 text-blue-600" />
            My Overtime Tracker
          </h1>
          <p className="text-muted-foreground">
            Track your overtime hours and work patterns
          </p>
        </div>

        {/* Controls */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Select Period</CardTitle>
            <CardDescription>
              Choose month and year to view your overtime data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="space-y-2 w-full lg:w-48">
                <Label htmlFor="month-select">Month</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger id="month-select">
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
                <Label htmlFor="year-select">Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="year-select">
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

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={handleFetchOvertime}
                  disabled={loading || !selectedMonth || !selectedYear}
                >
                  {loading ? (
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

        {/* Summary Cards */}
        {overtime && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Overtime</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatTime(overtime.totalOverTimeHours.hours, overtime.totalOverTimeHours.minutes)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Less Time</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatTime(overtime.totalLessTimeHours.hours, overtime.totalLessTimeHours.minutes)}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Days Worked</p>
                    <p className="text-2xl font-bold">{overtime.daysWorked}</p>
                  </div>
                  <CalendarDays className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Period</p>
                    <p className="text-lg font-bold">
                      {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Daily Breakdown */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              Daily Breakdown
            </CardTitle>
            <CardDescription>
              Detailed view of your daily work hours and overtime
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="mt-4 text-muted-foreground">Loading overtime data...</p>
              </div>
            ) : !overtime ? (
              <div className="text-center py-12">
                <Timer className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No overtime data found</h3>
                <p className="text-muted-foreground">
                  {selectedMonth && selectedYear 
                    ? 'No data available for the selected period' 
                    : 'Please select month and year to view data'
                  }
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
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
                    {overtime.dailyBreakdown.map((day, index) => (
                      <TableRow key={index} className="hover:bg-muted/50">
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
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserOvertimeTracker;
