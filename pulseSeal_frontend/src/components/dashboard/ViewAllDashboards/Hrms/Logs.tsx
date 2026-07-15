"use client";

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store';
import { 
  fetchMonthlyReport, 
  selectMonthlyReport, 
  selectHrmsAttendanceLoading, 
  selectHrmsAttendanceError 
} from '@/features/hrmsattendance/hrmsAttendanceSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight,
  Timer,
  CalendarDays
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import dayjs from 'dayjs';

interface WeeklyAttendanceViewProps {
  userId?: string;
}

const Logs: React.FC<WeeklyAttendanceViewProps> = ({ userId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const monthlyReport = useSelector(selectMonthlyReport);
  const loading = useSelector(selectHrmsAttendanceLoading);
  const error = useSelector(selectHrmsAttendanceError);

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);

  // Generate dynamic years (10 years back to 10 years forward)
  const generateYears = () => {
    const currentYear = dayjs().year();
    const years = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  };

  // Generate months using Day.js
  const generateMonths = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: dayjs().month(i).format('MMMM')
    }));
  };

  const years = generateYears();
  const months = generateMonths();

  // Get days in selected month
  const getDaysInMonth = () => {
    const startOfMonth = selectedDate.startOf('month');
    const endOfMonth = selectedDate.endOf('month');
    const daysInMonth = endOfMonth.date();

    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = startOfMonth.date(i);
      days.push({
        date: date,
        dayName: date.format('dddd'),
        dayNumber: i,
        fullDate: date.format('YYYY-MM-DD'),
        isToday: date.isSame(dayjs(), 'day')
      });
    }
    return days;
  };

  const daysInMonth = getDaysInMonth();

  // Fetch data when selected date changes
  useEffect(() => {
    const params = {
      month: (selectedDate.month() + 1).toString(),
      year: selectedDate.year().toString(),
      ...(userId && { userId })
    };
    dispatch(fetchMonthlyReport(params));
  }, [selectedDate, userId, dispatch]);

  // Navigation functions using Day.js
  const goToPreviousMonth = () => setSelectedDate(prev => prev.subtract(1, 'month'));
  const goToNextMonth = () => setSelectedDate(prev => prev.add(1, 'month'));
  const goToCurrentMonth = () => setSelectedDate(dayjs());

  // Handle month/year change
  const handleMonthChange = (month: number) => setSelectedDate(prev => prev.month(month));
  const handleYearChange = (year: number) => setSelectedDate(prev => prev.year(year));

  // Get attendance data for a specific date
  const getAttendanceForDate = (dateStr: string) => {
    if (!monthlyReport?.dailyRecords) return null;
    return monthlyReport.dailyRecords.find(record => 
      dayjs(record.date).format('YYYY-MM-DD') === dateStr
    );
  };

  // Status badge styling
  const getAttendanceStatus = (attendance: any) => {
    if (!attendance || attendance.scans.length === 0) {
      return { status: 'Absent', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: XCircle };
    }
    const totalWorkHours = parseFloat(attendance.totalWork.split('h')[0]);
    const requiredHours = parseFloat(attendance.officeTotalWorkingMinutes.split('h')[0] || '8');
    if (totalWorkHours >= requiredHours) {
      return { status: 'Present', color: 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200', icon: CheckCircle };
    } else if (totalWorkHours >= requiredHours / 2) {
      return { status: 'Half Day', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200', icon: AlertTriangle };
    } else {
      return { status: 'Partial', color: 'bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-200', icon: AlertTriangle };
    }
  };

  // Format time for display
  const formatTime = (dateString: string) => dayjs(dateString).format('hh:mm A');
  // Get first and last scan times
  const getWorkingHours = (attendance: any) => {
    if (!attendance || attendance.scans.length === 0) return null;
    const firstScan = attendance.scans[0];
    const lastScan = attendance.scans[attendance.scans.length - 1];
    return {
      checkIn: formatTime(firstScan.scanTime),
      checkOut: lastScan.type === 'OUT' ? formatTime(lastScan.scanTime) : 'Not checked out',
      totalScans: attendance.scans.length
    };
  };

  return (
    <div className="max-w-6xl mx-auto p-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1e2032] dark:to-[#1e2032] transition-colors">
      {/* Header with Month/Year Selection */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Logs</h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Monthly attendance tracking</p>
            </div>
          </div>
        </div>
        {/* Month/Year Selector */}
        <Card className="mb-6 bg-white dark:bg-[#232c40] shadow-sm dark:shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToPreviousMonth}
                  className="hover:bg-blue-50 dark:hover:bg-blue-900"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3">
                  <Select 
                    value={selectedDate.month().toString()} 
                    onValueChange={(value) => handleMonthChange(parseInt(value))}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select 
                    value={selectedDate.year().toString()} 
                    onValueChange={(value) => handleYearChange(parseInt(value))}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToNextMonth}
                  className="hover:bg-blue-50 dark:hover:bg-blue-900"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToCurrentMonth}
                  className="hover:bg-green-50 dark:hover:bg-green-900 border-green-200"
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Current Month
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {selectedDate.format('MMMM YYYY')}
              </h2>
              {monthlyReport?.monthlySummary && (
                <p className="text-blue-600 dark:text-blue-300 font-semibold mt-1">
                  Monthly Total: {monthlyReport.monthlySummary.totalWork}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {/* Loading State */}
      {loading && (
        <Card className="mb-6">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600 dark:text-gray-300">Loading attendance data...</span>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Daily Attendance List */}
      {!loading && (
        <div className="space-y-4">
          {daysInMonth.map((day) => {
            const attendance = getAttendanceForDate(day.fullDate);
            const status = getAttendanceStatus(attendance);
            const workingHours = getWorkingHours(attendance);
            const StatusIcon = status.icon;

            return (
              <Card 
                key={day.fullDate}
                className={
                  `transition-all duration-200 hover:shadow-lg
                  ${day.isToday ? 'ring-2 ring-blue-500 shadow-md dark:ring-blue-300 bg-blue-50/30 dark:bg-blue-950' : 'bg-white dark:bg-[#232c40]'}
                  ${attendance ? 'border-l-4 border-l-blue-500 dark:border-l-blue-300' : 'border-l-4 border-l-gray-300 dark:border-l-gray-700'}`
                }
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    {/* Day Info and Status */}
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {day.dayName}
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {day.dayNumber}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {selectedDate.format('MMM YYYY')}
                        </div>
                      </div>
                      <div className="h-12 w-px bg-gray-200 dark:bg-gray-800"></div>
                      <Badge className={`${status.color} px-3 py-1 text-sm font-semibold`}>
                        <StatusIcon className="h-4 w-4 mr-2" />
                        {status.status}
                      </Badge>
                    </div>
                    {/* Quick Stats */}
                    {attendance && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                          {attendance.totalWork}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total Work</div>
                      </div>
                    )}
                  </div>
                  {/* Details Grid */}
                  {attendance ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Time Details */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          Working Hours
                        </h4>
                        {workingHours && (
                          <div className="space-y-2 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-300">Check In:</span>
                              <span className="font-semibold text-green-700 dark:text-green-300">{workingHours.checkIn}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-300">Check Out:</span>
                              <span className="font-semibold text-red-700 dark:text-red-300">{workingHours.checkOut}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-800">
                              <span className="text-sm text-gray-600 dark:text-gray-300">Total Scans:</span>
                              <Badge variant="secondary" className="text-xs">
                                {workingHours.totalScans}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Work Summary */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                          <Timer className="h-4 w-4 text-blue-600" />
                          Summary
                        </h4>
                        <div className="space-y-2 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Work:</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-300">{attendance.totalWork}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Break:</span>
                            <span className="font-medium text-amber-600 dark:text-amber-300">{attendance.totalBreak}</span>
                          </div>
                          {attendance.totalOvertime !== '0h 0m' && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-300">Overtime:</span>
                              <span className="font-semibold text-purple-600 dark:text-purple-300">{attendance.totalOvertime}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Alerts & Issues */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-blue-600" />
                          Alerts
                        </h4>
                        <div className="space-y-2">
                          {attendance.lateLoginMinutes !== '0h 0m' && (
                            <div className="bg-orange-50 dark:bg-orange-900 p-2 rounded-lg flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-3 w-3 text-orange-600" />
                                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Late Login</span>
                              </div>
                              <span className="text-sm font-semibold text-orange-600 dark:text-orange-300">
                                {attendance.lateLoginMinutes}
                              </span>
                            </div>
                          )}
                          {attendance.earlyLogoutMinutes !== '0h 0m' && (
                            <div className="bg-red-50 dark:bg-red-900 p-2 rounded-lg flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-3 w-3 text-red-600" />
                                <span className="text-sm font-medium text-red-700 dark:text-red-300">Early Logout</span>
                              </div>
                              <span className="text-sm font-semibold text-red-600 dark:text-red-300">
                                {attendance.earlyLogoutMinutes}
                              </span>
                            </div>
                          )}
                          {attendance.lateLoginMinutes === '0h 0m' && attendance.earlyLogoutMinutes === '0h 0m' && (
                            <div className="bg-green-50 dark:bg-green-900 p-2 rounded-lg text-center">
                              <span className="text-sm text-green-700 dark:text-green-200 font-medium">No Issues</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <XCircle className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-300 font-medium">No attendance recorded</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Employee was absent on this day</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {/* Monthly Summary */}
      {monthlyReport?.monthlySummary && !loading && (
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#263759] dark:to-[#222b3f] border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-blue-800 dark:text-blue-200">
              <Timer className="h-5 w-5" />
              Monthly Summary - {selectedDate.format('MMMM YYYY')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white dark:bg-[#232c40] rounded-xl border border-blue-100 dark:border-blue-800 shadow-sm dark:shadow-none">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-300 mb-1">
                  {monthlyReport.monthlySummary.totalWorkingDays}
                </div>
                <div className="text-sm font-medium text-blue-700 dark:text-blue-200">Working Days</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-[#232c40] rounded-xl border border-green-100 dark:border-green-800 shadow-sm dark:shadow-none">
                <div className="text-2xl font-bold text-green-600 dark:text-green-200 mb-1">
                  {monthlyReport.monthlySummary.fullDayCount}
                </div>
                <div className="text-sm font-medium text-green-700 dark:text-green-200">Full Days</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-[#232c40] rounded-xl border border-yellow-100 dark:border-yellow-800 shadow-sm dark:shadow-none">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-200 mb-1">
                  {monthlyReport.monthlySummary.halfDayCount}
                </div>
                <div className="text-sm font-medium text-yellow-700 dark:text-yellow-200">Half Days</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-[#232c40] rounded-xl border border-purple-100 dark:border-purple-800 shadow-sm dark:shadow-none">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-200 mb-1">
                  {monthlyReport.monthlySummary.totalOvertime}
                </div>
                <div className="text-sm font-medium text-purple-700 dark:text-purple-200">Overtime</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Logs;

// "use client"
// import React, { useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { AppDispatch } from '@/store';
// import { 
//   fetchMonthlyReport, 
//   selectMonthlyReport, 
//   selectHrmsAttendanceLoading, 
//   selectHrmsAttendanceError 
// } from '@/features/hrmsattendance/hrmsAttendanceSlice';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { 
//   Calendar, 
//   Clock, 
//   CheckCircle, 
//   XCircle, 
//   AlertTriangle, 
//   ChevronLeft, 
//   ChevronRight,
//   Timer,
//   CalendarDays
// } from 'lucide-react';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import dayjs from 'dayjs';

// interface WeeklyAttendanceViewProps {
//   userId?: string;
// }

// const Logs: React.FC<WeeklyAttendanceViewProps> = ({ userId }) => {
//   const dispatch = useDispatch<AppDispatch>();
//   const monthlyReport = useSelector(selectMonthlyReport);
//   const loading = useSelector(selectHrmsAttendanceLoading);
//   const error = useSelector(selectHrmsAttendanceError);

//   // Use Day.js for better date handling
//   const [selectedDate, setSelectedDate] = useState(dayjs());
//   const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);

//   // Generate dynamic years (10 years back to 10 years forward)
//   const generateYears = () => {
//     const currentYear = dayjs().year();
//     const years = [];
//     for (let i = currentYear - 10; i <= currentYear + 10; i++) {
//       years.push(i);
//     }
//     return years;
//   };

//   // Generate months using Day.js
//   const generateMonths = () => {
//     return Array.from({ length: 12 }, (_, i) => ({
//       value: i,
//       label: dayjs().month(i).format('MMMM')
//     }));
//   };

//   const years = generateYears();
//   const months = generateMonths();

//   // Get days in selected month
//   const getDaysInMonth = () => {
//     const startOfMonth = selectedDate.startOf('month');
//     const endOfMonth = selectedDate.endOf('month');
//     const daysInMonth = endOfMonth.date();
    
//     const days = [];
//     for (let i = 1; i <= daysInMonth; i++) {
//       const date = startOfMonth.date(i);
//       days.push({
//         date: date,
//         dayName: date.format('dddd'),
//         dayNumber: i,
//         fullDate: date.format('YYYY-MM-DD'),
//         isToday: date.isSame(dayjs(), 'day')
//       });
//     }
//     return days;
//   };

//   const daysInMonth = getDaysInMonth();

//   // Fetch data when selected date changes
//   useEffect(() => {
//     const params = {
//       month: (selectedDate.month() + 1).toString(),
//       year: selectedDate.year().toString(),
//       ...(userId && { userId })
//     };

//     dispatch(fetchMonthlyReport(params));
//   }, [selectedDate, userId, dispatch]);

//   // Navigation functions using Day.js
//   const goToPreviousMonth = () => {
//     setSelectedDate(prev => prev.subtract(1, 'month'));
//   };

//   const goToNextMonth = () => {
//     setSelectedDate(prev => prev.add(1, 'month'));
//   };

//   const goToCurrentMonth = () => {
//     setSelectedDate(dayjs());
//   };

//   // Handle month/year change
//   const handleMonthChange = (month: number) => {
//     setSelectedDate(prev => prev.month(month));
//   };

//   const handleYearChange = (year: number) => {
//     setSelectedDate(prev => prev.year(year));
//   };

//   // Get attendance data for a specific date
//   const getAttendanceForDate = (dateStr: string) => {
//     if (!monthlyReport?.dailyRecords) return null;
    
//     return monthlyReport.dailyRecords.find(record => 
//       dayjs(record.date).format('YYYY-MM-DD') === dateStr
//     );
//   };

//   // Get attendance status
//   const getAttendanceStatus = (attendance: any) => {
//     if (!attendance || attendance.scans.length === 0) {
//       return { status: 'Absent', color: 'bg-gray-100 text-gray-700', icon: XCircle };
//     }

//     const totalWorkHours = parseFloat(attendance.totalWork.split('h')[0]);
//     const requiredHours = parseFloat(attendance.officeTotalWorkingMinutes.split('h')[0] || '8');

//     if (totalWorkHours >= requiredHours) {
//       return { status: 'Present', color: 'bg-green-100 text-green-700', icon: CheckCircle };
//     } else if (totalWorkHours >= requiredHours / 2) {
//       return { status: 'Half Day', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle };
//     } else {
//       return { status: 'Partial', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle };
//     }
//   };

//   // Format time for display
//   const formatTime = (dateString: string) => {
//     return dayjs(dateString).format('hh:mm A');
//   };

//   // Get first and last scan times
//   const getWorkingHours = (attendance: any) => {
//     if (!attendance || attendance.scans.length === 0) return null;
    
//     const firstScan = attendance.scans[0];
//     const lastScan = attendance.scans[attendance.scans.length - 1];
    
//     return {
//       checkIn: formatTime(firstScan.scanTime),
//       checkOut: lastScan.type === 'OUT' ? formatTime(lastScan.scanTime) : 'Not checked out',
//       totalScans: attendance.scans.length
//     };
//   };

//   return (
//     <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
//       {/* Header with Month/Year Selection */}
//       <div className="mb-8">
//         <div className="flex items-center justify-between mb-6">
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-blue-600 rounded-lg">
//               <Calendar className="h-6 w-6 text-white" />
//             </div>
//             <div>
//               <h1 className="text-2xl font-bold text-gray-900">Attendance Logs</h1>
//               <p className="text-gray-600 text-sm">Monthly attendance tracking</p>
//             </div>
//           </div>
//         </div>

//         {/* Month/Year Selector */}
//         <Card className="mb-6 bg-white shadow-sm">
//           <CardContent className="p-6">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-4">
//                 <Button 
//                   variant="outline" 
//                   size="sm" 
//                   onClick={goToPreviousMonth}
//                   className="hover:bg-blue-50"
//                 >
//                   <ChevronLeft className="h-4 w-4" />
//                 </Button>

//                 <div className="flex items-center gap-3">
//                   <Select 
//                     value={selectedDate.month().toString()} 
//                     onValueChange={(value) => handleMonthChange(parseInt(value))}
//                   >
//                     <SelectTrigger className="w-[140px]">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {months.map((month) => (
//                         <SelectItem key={month.value} value={month.value.toString()}>
//                           {month.label}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>

//                   <Select 
//                     value={selectedDate.year().toString()} 
//                     onValueChange={(value) => handleYearChange(parseInt(value))}
//                   >
//                     <SelectTrigger className="w-[100px]">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent className="max-h-[300px]">
//                       {years.map((year) => (
//                         <SelectItem key={year} value={year.toString()}>
//                           {year}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <Button 
//                   variant="outline" 
//                   size="sm" 
//                   onClick={goToNextMonth}
//                   className="hover:bg-blue-50"
//                 >
//                   <ChevronRight className="h-4 w-4" />
//                 </Button>
//               </div>

//               <div className="flex items-center gap-2">
//                 <Button 
//                   variant="outline" 
//                   size="sm" 
//                   onClick={goToCurrentMonth}
//                   className="hover:bg-green-50 border-green-200"
//                 >
//                   <CalendarDays className="h-4 w-4 mr-2" />
//                   Current Month
//                 </Button>
//               </div>
//             </div>

//             <div className="mt-4 text-center">
//               <h2 className="text-xl font-bold text-gray-800">
//                 {selectedDate.format('MMMM YYYY')}
//               </h2>
//               {monthlyReport?.monthlySummary && (
//                 <p className="text-blue-600 font-semibold mt-1">
//                   Monthly Total: {monthlyReport.monthlySummary.totalWork}
//                 </p>
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Error Display */}
//       {error && (
//         <Alert variant="destructive" className="mb-6">
//           <XCircle className="h-4 w-4" />
//           <AlertDescription>{error}</AlertDescription>
//         </Alert>
//       )}

//       {/* Loading State */}
//       {loading && (
//         <Card className="mb-6">
//           <CardContent className="flex items-center justify-center py-12">
//             <div className="flex flex-col items-center gap-3">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//               <span className="text-gray-600">Loading attendance data...</span>
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {/* Daily Attendance List */}
//       {!loading && (
//         <div className="space-y-4">
//           {daysInMonth.map((day) => {
//             const attendance = getAttendanceForDate(day.fullDate);
//             const status = getAttendanceStatus(attendance);
//             const workingHours = getWorkingHours(attendance);
//             const StatusIcon = status.icon;

//             return (
//               <Card 
//                 key={day.fullDate}
//                 className={`transition-all duration-200 hover:shadow-lg ${
//                   day.isToday ? 'ring-2 ring-blue-500 shadow-md bg-blue-50/30' : 'bg-white'
//                 } ${attendance ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-gray-300'}`}
//               >
//                 <CardContent className="p-6">
//                   <div className="flex items-center justify-between mb-4">
//                     {/* Day Info */}
//                     <div className="flex items-center gap-4">
//                       <div className="text-center">
//                         <div className="text-sm font-medium text-gray-600">
//                           {day.dayName}
//                         </div>
//                         <div className="text-3xl font-bold text-gray-900">
//                           {day.dayNumber}
//                         </div>
//                         <div className="text-xs text-gray-500 font-medium">
//                           {selectedDate.format('MMM YYYY')}
//                         </div>
//                       </div>
                      
//                       <div className="h-12 w-px bg-gray-200"></div>
                      
//                       {/* Status */}
//                       <Badge className={`${status.color} px-3 py-1 text-sm font-semibold`}>
//                         <StatusIcon className="h-4 w-4 mr-2" />
//                         {status.status}
//                       </Badge>
//                     </div>

//                     {/* Quick Stats */}
//                     {attendance && (
//                       <div className="text-right">
//                         <div className="text-2xl font-bold text-blue-600">
//                           {attendance.totalWork}
//                         </div>
//                         <div className="text-sm text-gray-500">Total Work</div>
//                       </div>
//                     )}
//                   </div>

//                   {attendance ? (
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                       {/* Time Details */}
//                       <div className="space-y-3">
//                         <h4 className="font-semibold text-gray-800 flex items-center gap-2">
//                           <Clock className="h-4 w-4 text-blue-600" />
//                           Working Hours
//                         </h4>
//                         {workingHours && (
//                           <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
//                             <div className="flex justify-between items-center">
//                               <span className="text-sm text-gray-600">Check In:</span>
//                               <span className="font-semibold text-green-700">{workingHours.checkIn}</span>
//                             </div>
//                             <div className="flex justify-between items-center">
//                               <span className="text-sm text-gray-600">Check Out:</span>
//                               <span className="font-semibold text-red-700">{workingHours.checkOut}</span>
//                             </div>
//                             <div className="flex justify-between items-center pt-2 border-t">
//                               <span className="text-sm text-gray-600">Total Scans:</span>
//                               <Badge variant="secondary" className="text-xs">
//                                 {workingHours.totalScans}
//                               </Badge>
//                             </div>
//                           </div>
//                         )}
//                       </div>

//                       {/* Work Summary */}
//                       <div className="space-y-3">
//                         <h4 className="font-semibold text-gray-800 flex items-center gap-2">
//                           <Timer className="h-4 w-4 text-blue-600" />
//                           Summary
//                         </h4>
//                         <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
//                           <div className="flex justify-between items-center">
//                             <span className="text-sm text-gray-600">Work:</span>
//                             <span className="font-semibold text-blue-600">{attendance.totalWork}</span>
//                           </div>
//                           <div className="flex justify-between items-center">
//                             <span className="text-sm text-gray-600">Break:</span>
//                             <span className="font-medium text-amber-600">{attendance.totalBreak}</span>
//                           </div>
//                           {attendance.totalOvertime !== '0h 0m' && (
//                             <div className="flex justify-between items-center">
//                               <span className="text-sm text-gray-600">Overtime:</span>
//                               <span className="font-semibold text-purple-600">{attendance.totalOvertime}</span>
//                             </div>
//                           )}
//                         </div>
//                       </div>

//                       {/* Alerts & Issues */}
//                       <div className="space-y-3">
//                         <h4 className="font-semibold text-gray-800 flex items-center gap-2">
//                           <AlertTriangle className="h-4 w-4 text-blue-600" />
//                           Alerts
//                         </h4>
//                         <div className="space-y-2">
//                           {attendance.lateLoginMinutes !== '0h 0m' && (
//                             <div className="bg-orange-50 p-2 rounded-lg flex items-center justify-between">
//                               <div className="flex items-center gap-2">
//                                 <AlertTriangle className="h-3 w-3 text-orange-600" />
//                                 <span className="text-sm font-medium text-orange-700">Late Login</span>
//                               </div>
//                               <span className="text-sm font-semibold text-orange-600">
//                                 {attendance.lateLoginMinutes}
//                               </span>
//                             </div>
//                           )}
//                           {attendance.earlyLogoutMinutes !== '0h 0m' && (
//                             <div className="bg-red-50 p-2 rounded-lg flex items-center justify-between">
//                               <div className="flex items-center gap-2">
//                                 <AlertTriangle className="h-3 w-3 text-red-600" />
//                                 <span className="text-sm font-medium text-red-700">Early Logout</span>
//                               </div>
//                               <span className="text-sm font-semibold text-red-600">
//                                 {attendance.earlyLogoutMinutes}
//                               </span>
//                             </div>
//                           )}
//                           {attendance.lateLoginMinutes === '0h 0m' && attendance.earlyLogoutMinutes === '0h 0m' && (
//                             <div className="bg-green-50 p-2 rounded-lg text-center">
//                               <span className="text-sm text-green-700 font-medium">No Issues</span>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="text-center py-8 bg-gray-50 rounded-lg">
//                       <XCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
//                       <p className="text-gray-600 font-medium">No attendance recorded</p>
//                       <p className="text-gray-500 text-sm">Employee was absent on this day</p>
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             );
//           })}
//         </div>
//       )}

//       {/* Monthly Summary */}
//       {monthlyReport?.monthlySummary && !loading && (
//         <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
//               <Timer className="h-5 w-5" />
//               Monthly Summary - {selectedDate.format('MMMM YYYY')}
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//               <div className="text-center p-4 bg-white rounded-xl border border-blue-100 shadow-sm">
//                 <div className="text-2xl font-bold text-blue-600 mb-1">
//                   {monthlyReport.monthlySummary.totalWorkingDays}
//                 </div>
//                 <div className="text-sm font-medium text-blue-700">Working Days</div>
//               </div>
//               <div className="text-center p-4 bg-white rounded-xl border border-green-100 shadow-sm">
//                 <div className="text-2xl font-bold text-green-600 mb-1">
//                   {monthlyReport.monthlySummary.fullDayCount}
//                 </div>
//                 <div className="text-sm font-medium text-green-700">Full Days</div>
//               </div>
//               <div className="text-center p-4 bg-white rounded-xl border border-yellow-100 shadow-sm">
//                 <div className="text-2xl font-bold text-yellow-600 mb-1">
//                   {monthlyReport.monthlySummary.halfDayCount}
//                 </div>
//                 <div className="text-sm font-medium text-yellow-700">Half Days</div>
//               </div>
//               <div className="text-center p-4 bg-white rounded-xl border border-purple-100 shadow-sm">
//                 <div className="text-2xl font-bold text-purple-600 mb-1">
//                   {monthlyReport.monthlySummary.totalOvertime}
//                 </div>
//                 <div className="text-sm font-medium text-purple-700">Overtime</div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// };

// export default Logs;
