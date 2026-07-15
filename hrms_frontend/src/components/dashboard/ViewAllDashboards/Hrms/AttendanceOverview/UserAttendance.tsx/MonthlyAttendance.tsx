'use client';
import React, { useEffect, useState } from 'react';
import { useAttendance } from '@/hooks/useAttendance';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Download, User, TrendingUp, Clock, Target } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth } from 'date-fns';
import { toast } from 'sonner';

const getStatusColor = (hasLogin?: boolean, hasLogout?: boolean) => {
  if (hasLogin && hasLogout) return 'bg-green-500 text-white';
  if (hasLogin && !hasLogout) return 'bg-yellow-500 text-white';
  return 'bg-gray-200 text-gray-700';
};

const getStatusIcon = (hasLogin?: boolean, hasLogout?: boolean) => {
  if (hasLogin && hasLogout) return 'C'; // Complete
  if (hasLogin && !hasLogout) return 'P'; // Partial/In Progress
  return '-'; // No record
};

const MonthlyAttendance: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<any>(null);
  
  const attendanceHook: any = useAttendance();
  const {
    monthlyAttendance, // This contains the API response structure
    loading,
    error,
    fetchMonthlyUserAttendance,
    clearAttendanceError,
    currentUser,
  } = attendanceHook;

  useEffect(() => {
    if (currentUser?._id) {
      fetchMonthlyUserAttendance();
    }
    return () => {
      clearAttendanceError();
    };
  }, [currentUser, fetchMonthlyUserAttendance, clearAttendanceError]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const firstDayOfWeek = monthStart.getDay();
  const emptyCells = Array.from({ length: firstDayOfWeek }, (_, index) => index);

  // Get current month data from API response
  const getCurrentMonthData = () => {
    const targetMonth = format(currentDate, 'MMMM yyyy');
    
    if (!Array.isArray(monthlyAttendance) || monthlyAttendance.length === 0) {
      return null;
    }

    return monthlyAttendance.find(monthData => monthData.month === targetMonth);
  };

  const currentMonthData = getCurrentMonthData();

  // Get attendance for specific date
  const getAttendanceForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    
    if (!currentMonthData || !Array.isArray(currentMonthData.days)) {
      return null;
    }
    
    return currentMonthData.days.find((day: any) => day.date === dateString);
  };

  // Calculate monthly statistics
  const calculateDisplayedMonthStats = () => {
    if (!currentMonthData || !Array.isArray(currentMonthData.days)) {
      return { 
        complete: 0, 
        inProgress: 0, 
        absent: 0, 
        totalRecords: 0, 
        completionRate: 0 
      };
    }

    const complete = currentMonthData.days.filter((day: any) => 
      day.loginTime && day.logoutTime
    ).length;
    
    const inProgress = currentMonthData.days.filter((day: any) => 
      day.loginTime && !day.logoutTime
    ).length;
    
    const totalRecords = currentMonthData.totalDays;
    const completionRate = totalRecords > 0 ? (complete / totalRecords) * 100 : 0;
    
    return {
      complete,
      inProgress,
      absent: totalRecords - complete - inProgress,
      totalRecords,
      completionRate
    };
  };

  const displayedMonthStats = calculateDisplayedMonthStats();

  // Export to CSV
  const exportToCSV = () => {
    if (!currentMonthData || !Array.isArray(currentMonthData.days) || currentMonthData.days.length === 0) {
      toast.error('No data to export for this month');
      return;
    }
    
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Date,Day,Login Time,Logout Time,Status,Total Hours,Attendance ID\n";
      
      currentMonthData.days.forEach((day: any) => {
        const date = new Date(day.date);
        const dayName = format(date, 'EEEE');
        const loginTime = day.loginTime ? format(new Date(day.loginTime), 'HH:mm') : 'N/A';
        const logoutTime = day.logoutTime ? format(new Date(day.logoutTime), 'HH:mm') : 'N/A';
        const status = day.loginTime && day.logoutTime ? 'Complete' : 
                     day.loginTime ? 'In Progress' : 'Absent';
        
        let totalHours = 'N/A';
        if (day.loginTime && day.logoutTime) {
          const diffMs = new Date(day.logoutTime).getTime() - new Date(day.loginTime).getTime();
          const hours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
          totalHours = hours.toString();
        }
        
        csvContent += `${day.date},${dayName},${loginTime},${logoutTime},${status},${totalHours},${day.attendanceId}\n`;
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `attendance_${currentUser?.name?.replace(/\s+/g, '_')}_${format(currentDate, 'MMMM_yyyy')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Attendance data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    }
  };

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">Please log in to view your attendance.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto my-8 space-y-6">
      {/* User Info Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{currentUser.name}</h2>
                <p className="text-gray-600">Monthly Attendance Report</p>
              </div>
            </div>
            {currentMonthData && (
              <div className="text-right">
                <div className="text-sm text-gray-500">Month Data</div>
                <div className="text-lg font-semibold">{currentMonthData.month}</div>
                <div className="text-sm text-gray-500">Total Days: {currentMonthData.totalDays}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                <Target className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{displayedMonthStats.complete}</div>
                <p className="text-xs text-muted-foreground">Complete Days</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-yellow-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{displayedMonthStats.inProgress}</div>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {displayedMonthStats.completionRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">{displayedMonthStats.totalRecords}</div>
                <p className="text-xs text-muted-foreground">Total Days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Attendance Calendar
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevMonth}
                disabled={loading}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-lg font-semibold min-w-[160px] text-center">
                {format(currentDate, 'MMMM yyyy')}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                disabled={loading}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="ml-2"
                disabled={!currentMonthData || displayedMonthStats.totalRecords === 0}
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-500 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="font-medium">Error</div>
              <div className="text-sm">{error}</div>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              {/* Calendar Header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-3 text-center font-semibold text-gray-600 text-sm">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month starts */}
                {emptyCells.map(index => (
                  <div key={`empty-${index}`} className="p-2 h-24"></div>
                ))}
                
                {/* Days of the month */}
                {daysInMonth.map(day => {
                  const attendance = getAttendanceForDate(day);
                  const isCurrentDay = isToday(day);
                  const isCurrentMonthDay = isSameMonth(day, currentDate);
                  const hasLogin = attendance?.loginTime;
                  const hasLogout = attendance?.logoutTime;
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`
                        p-2 h-24 border rounded-lg cursor-pointer transition-all hover:shadow-md
                        ${isCurrentDay ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200'}
                        ${!isCurrentMonthDay ? 'opacity-50' : ''}
                        ${attendance ? 'hover:bg-gray-50' : 'bg-gray-50'}
                        ${selectedDay?.date === format(day, 'yyyy-MM-dd') ? 'ring-2 ring-purple-300 bg-purple-50' : ''}
                      `}
                      onClick={() => attendance && setSelectedDay({
                        date: format(day, 'yyyy-MM-dd'),
                        attendance
                      })}
                    >
                      <div className="flex flex-col h-full">
                        <div className="text-sm font-medium mb-1">
                          {format(day, 'd')}
                        </div>
                        {attendance && (
                          <div className="flex-1 space-y-1">
                            <Badge
                              className={`text-xs px-1 py-0 ${getStatusColor(hasLogin, hasLogout)}`}
                            >
                              {getStatusIcon(hasLogin, hasLogout)}
                            </Badge>
                            {hasLogin && (
                              <div className="text-xs text-gray-600 truncate">
                                In: {format(new Date(attendance.loginTime), 'HH:mm')}
                              </div>
                            )}
                            {hasLogout && (
                              <div className="text-xs text-gray-600 truncate">
                                Out: {format(new Date(attendance.logoutTime), 'HH:mm')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Selected Day Details */}
      {selectedDay && (
        <Card>
          <CardHeader>
            <CardTitle>
              Attendance Details - {format(new Date(selectedDay.date), 'EEEE, MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Attendance ID</label>
                <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {selectedDay.attendance.attendanceId}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Badge className={`w-fit ${getStatusColor(selectedDay.attendance.loginTime, selectedDay.attendance.logoutTime)} border`}>
                  {selectedDay.attendance.loginTime && selectedDay.attendance.logoutTime ? 'COMPLETE' : 
                   selectedDay.attendance.loginTime ? 'IN PROGRESS' : 'ABSENT'}
                </Badge>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Login Time</label>
                <div className="text-sm text-gray-900">
                  {selectedDay.attendance.loginTime 
                    ? format(new Date(selectedDay.attendance.loginTime), 'HH:mm:ss')
                    : 'Not marked'
                  }
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Logout Time</label>
                <div className="text-sm text-gray-900">
                  {selectedDay.attendance.logoutTime 
                    ? format(new Date(selectedDay.attendance.logoutTime), 'HH:mm:ss')
                    : 'Not marked'
                  }
                </div>
              </div>
            </div>
            
            {selectedDay.attendance.loginTime && selectedDay.attendance.logoutTime && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <label className="text-sm font-medium text-blue-800">Total Work Hours</label>
                <div className="text-lg font-bold text-blue-900">
                  {(() => {
                    const diffMs = new Date(selectedDay.attendance.logoutTime).getTime() - new Date(selectedDay.attendance.loginTime).getTime();
                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    return `${hours}h ${minutes}m`;
                  })()}
                </div>
              </div>
            )}

            {selectedDay.attendance.sealTime && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <label className="text-sm font-medium text-purple-800">Seal Time</label>
                <div className="text-purple-900">
                  {format(new Date(selectedDay.attendance.sealTime), 'HH:mm:ss')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span>Complete (C) - Both login & logout marked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span>In Progress (P) - Only login marked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-300"></div>
              <span>No Record (-) - No attendance data</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyAttendance;
