"use client"
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  fetchOrganizationLeaderboard, 
  selectLeaderboard, 
  selectLeaderboardLoading, 
  selectLeaderboardError,
  // clearLeaderboardError
} from '@/features/leaderBoard/leaderboardSlice';
import { 
  fetchDepartments,
  selectDepartments,
  selectDepartmentLoading,
  selectDepartmentError
} from '@/features/departments/departmentSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Building2, Users, Trophy, AlertCircle, RefreshCw } from 'lucide-react';
import dayjs from 'dayjs';
import { toast } from 'sonner';

// Types
interface LeaderboardUser {
  userId: string;
  userName: string;
  month: string;
  year: number;
  efficiency: number;
  attendanceAverage: number;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  sealSubmissionRate: number;
  approvedCount: number;
  totalTasks: number;
  _id: {
    departmentId: string;
    userId: string;
    monthYear: string;
  };
}

interface MonthlyLeaderboard {
  monthYear: string;
  leaderboard: LeaderboardUser[];
  topper: LeaderboardUser;
}

interface Department {
  _id: string;
  name: string;
  alias: string;
  description?: string;
  category?: string;
  is_active: boolean;
  is_verified: boolean;
  members?: any[];
  userCount?: number;
  createdAt: string;
}

// Constants
const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const month = String(i + 1).padStart(2, '0');
  return {
    value: month,
    label: dayjs(`2023-${month}-01`).format('MMMM')
  };
});

const PODIUM_COLORS = ['bg-gradient-to-br from-yellow-400 to-yellow-600', 'bg-gradient-to-br from-gray-300 to-gray-500', 'bg-gradient-to-br from-amber-600 to-amber-800'];

// Helper Components
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
    <div className="max-w-6xl mx-auto space-y-6">
      <Skeleton className="h-10 w-1/4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    </div>
  </div>
);

const ErrorCard = ({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) => (
  <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
    <AlertCircle className="h-4 w-4 text-red-600" />
    <AlertDescription className="text-red-800 dark:text-red-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm mt-1">{message}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry} className="ml-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    </AlertDescription>
  </Alert>
);

const EmptyState = ({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) => (
  <Card className="text-center py-12">
    <CardContent>
      <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {description}
      </p>
      {action}
    </CardContent>
  </Card>
);

// Main Component
const AdminLeaderboard = () => {
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const apiResponse = useAppSelector(selectLeaderboard);
  const leaderboardLoading = useAppSelector(selectLeaderboardLoading);
  const leaderboardError = useAppSelector(selectLeaderboardError);
  
  const departmentsData = useAppSelector(selectDepartments);
  const departmentLoading = useAppSelector(selectDepartmentLoading);
  const departmentError = useAppSelector(selectDepartmentError);
  
  // Local state
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(dayjs().format('MM'));
  const [selectedYear, setSelectedYear] = useState<string>(dayjs().format('YYYY'));
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);

  // Memoized values
  const availableYears = useMemo(() => {
    const currentYear = dayjs().year();
    return Array.from({ length: 3 }, (_, i) => String(currentYear - i));
  }, []);

 
  const allDepartments = useMemo((): Department[] => {
    if (!departmentsData) return [];
    
    // Handle different possible data structures
    if (Array.isArray(departmentsData)) {
      return departmentsData;
    }

    
    if (departmentsData && Array.isArray(departmentsData)) {
      return departmentsData;
    }
    
    if (departmentsData && Array.isArray(departmentsData)) {
      return departmentsData;
    }
    
    return [];
  }, [departmentsData]);

  const currentDepartment = useMemo(() => {
    return allDepartments.find(dept => dept._id === selectedDepartment);
  }, [allDepartments, selectedDepartment]);

  
  
  const leaderboardData = useMemo(() => {
    return (apiResponse || []) as MonthlyLeaderboard[];
  }, [apiResponse]);
 

  const currentMonthData = useMemo(() => {
    return leaderboardData[0] || null;
  }, [leaderboardData]);

  const { topUsers, otherUsers } = useMemo(() => {
    if (!currentMonthData?.leaderboard) {
      return { topUsers: [], otherUsers: [] };
    }
    
    return {
      topUsers: currentMonthData.leaderboard.slice(0, 3),
      otherUsers: currentMonthData.leaderboard.slice(3)
    };
  }, [currentMonthData]);

  // Effects
  useEffect(() => {
    dispatch(fetchDepartments({}));
  }, [dispatch]);

  useEffect(() => {
    if (departmentError) {
      toast.error(`Failed to fetch departments: ${departmentError}`);
    }
  }, [departmentError]);

  useEffect(() => {
    if (leaderboardError) {
      toast.error(`Failed to fetch leaderboard: ${leaderboardError}`);
    }
  }, [leaderboardError]);

  // Fetch leaderboard data
  const fetchLeaderboardData = useCallback(() => {
    if (selectedDepartment && showLeaderboard) {
      const monthYear = `${selectedYear}-${selectedMonth}`;

      
      dispatch(fetchOrganizationLeaderboard({ 
        monthYear, 
        departmentId: selectedDepartment 
      }));
    }
  }, [dispatch, selectedDepartment, selectedMonth, selectedYear, showLeaderboard]);

  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  // Event handlers
  const handleDepartmentSelect = useCallback((departmentId: string) => {
    setSelectedDepartment(departmentId);
    setShowLeaderboard(true);
    
    // Clear any previous errors
    // dispatch(clearLeaderboardError());
  }, [dispatch]);

  const handleBackToDepartments = useCallback(() => {
    setShowLeaderboard(false);
    setSelectedDepartment(null);
    // dispatch(clearLeaderboardError());
  }, [dispatch]);

  const handleMonthChange = useCallback((value: string) => {
    setSelectedMonth(value.padStart(2, '0'));
  }, []);

  const handleYearChange = useCallback((value: string) => {
    setSelectedYear(value);
  }, []);

  const handleRefreshDepartments = useCallback(() => {
    dispatch(fetchDepartments({}));
  }, [dispatch]);

  const handleRefreshLeaderboard = useCallback(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  // Component renderers
  const TopUserCard = ({ user, position }: { user: LeaderboardUser, position: number }) => (
    <Card className={`${PODIUM_COLORS[position - 1]} border-0 relative overflow-hidden h-64 rounded-lg shadow-lg`}>
      <CardContent className="p-6 h-full flex flex-col">
        <Badge 
          variant="secondary" 
          className="absolute top-3 left-3 w-8 h-8 p-0 bg-black/20 text-white border-0 rounded-full flex items-center justify-center text-lg font-bold"
        >
          {position}
        </Badge>
        
        {position === 1 && (
          <Trophy className="absolute top-3 right-3 w-6 h-6 text-yellow-300" />
        )}
        
        <div className="flex-1 flex flex-col items-center justify-center text-center mt-4">
          <Avatar className="w-20 h-20 mb-3 border-4 border-white/30 shadow-lg">
            <AvatarImage src="" alt={user.userName} />
            <AvatarFallback className="bg-white/20 text-white font-semibold text-lg">
              {user.userName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <h3 className="text-white font-semibold text-lg mb-2 line-clamp-1">
            {user.userName || 'Unknown User'}
          </h3>
          <Badge variant="secondary" className="bg-white/20 text-white text-sm border-0 mb-3">
            Score: {user.efficiency?.toFixed(2) || '0.00'}
          </Badge>
        </div>
        
        <div className="space-y-2 bg-black/10 rounded-lg p-3">
          <div className="flex justify-between text-sm text-white/90">
            <span>Tasks: {user.totalTasks || 0}</span>
            <span>Approved: {user.approvedCount || 0}</span>
          </div>
          <div className="flex justify-between text-sm text-white/90">
            <span>Attendance: {user.attendanceAverage?.toFixed(1) || '0.0'}%</span>
            <span>SEAL: {user.sealSubmissionRate?.toFixed(1) || '0.0'}%</span>
          </div>
          <div className="flex justify-center gap-3 text-sm">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              {user.greenCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              {user.yellowCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              {user.redCount || 0}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const UserTableRow = ({ user, rank }: { user: LeaderboardUser, rank: number }) => (
    <TableRow className="hover:bg-muted/50 transition-colors">
      <TableCell className="font-medium">
        <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
          {rank}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src="" alt={user.userName} />
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs font-medium">
              {user.userName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.userName || 'Unknown User'}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right font-medium">
        {user.efficiency?.toFixed(2) || '0.00'}
      </TableCell>
      <TableCell className="text-right">
        {user.attendanceAverage?.toFixed(1) || '0.0'}%
      </TableCell>
      <TableCell className="text-right">
        {user.totalTasks || 0}
      </TableCell>
      <TableCell className="text-right">
        {user.approvedCount || 0}
      </TableCell>
      <TableCell>
        <div className="flex justify-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {user.greenCount || 0}G
          </Badge>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            {user.yellowCount || 0}Y
          </Badge>
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            {user.redCount || 0}R
          </Badge>
        </div>
      </TableCell>
    </TableRow>
  );

  // Render logic
  if (departmentLoading) {
    return <LoadingSkeleton />;
  }

  if (departmentError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <ErrorCard
            title="Failed to load departments"
            message={departmentError}
            onRetry={handleRefreshDepartments}
          />
        </div>
      </div>
    );
  }

  // Department Selection View
  if (!showLeaderboard) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Admin Leaderboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Select a department to view its performance leaderboard
            </p>
          </div>

          {allDepartments.length === 0 ? (
            <EmptyState
              title="No Departments Found"
              description="No departments are available in the system."
              action={
                <Button variant="outline" onClick={handleRefreshDepartments}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allDepartments
                .filter(dept => dept.is_active) // Only show active departments
                .map((department) => (
                <Card 
                  key={department._id}
                  className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/50 group"
                  onClick={() => handleDepartmentSelect(department._id)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold line-clamp-1">
                          {department.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-1">
                          {department.description || department.category || 'Department'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{department.members?.length || department.userCount || 0} members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {department.is_verified && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                            Verified
                          </Badge>
                        )}
                        <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          View Leaderboard
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Leaderboard loading state
  if (leaderboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center space-x-4 mb-6">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))}
            </div>
            <div className="lg:col-span-3">
              <Skeleton className="h-96 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Leaderboard error state
  if (leaderboardError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="ghost" onClick={handleBackToDepartments}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Departments
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentDepartment?.name} Leaderboard
              </h1>
            </div>
          </div>
          
          <ErrorCard
            title="Error loading leaderboard"
            message={leaderboardError}
            onRetry={handleRefreshLeaderboard}
          />
        </div>
      </div>
    );
  }

  // No data state
  if (!currentMonthData || !currentMonthData.leaderboard || currentMonthData.leaderboard.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleBackToDepartments}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Departments
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentDepartment?.name} Leaderboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Performance rankings for {dayjs(`${selectedYear}-${selectedMonth}-01`).format('MMMM YYYY')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <EmptyState
            title="No leaderboard data available"
            description={`There is no leaderboard data to display for ${currentDepartment?.name} in ${dayjs(`${selectedYear}-${selectedMonth}-01`).format('MMMM YYYY')}.`}
            action={
              <Button variant="outline" onClick={handleRefreshLeaderboard}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  // Main leaderboard view
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={handleBackToDepartments} className="hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Departments
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {currentDepartment?.name} Leaderboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Performance rankings for {dayjs(`${selectedYear}-${selectedMonth}-01`).format('MMMM YYYY')} • {currentMonthData.leaderboard.length} participants
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={handleRefreshLeaderboard}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Top 3 Users - Podium */}
          <div className="lg:col-span-1 space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                🏆 Top Performers
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hall of Fame
              </p>
            </div>
            
            {topUsers.length > 0 ? (
              topUsers.map((user, index) => (
                <TopUserCard 
                  key={user.userId || index} 
                  user={user} 
                  position={index + 1}
                />
              ))
            ) : (
              <EmptyState
                title="No top performers"
                description="No data available for top performers"
              />
            )}
          </div>

          {/* Full Leaderboard Table */}
          <div className="lg:col-span-3">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
              <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      📊 Complete Leaderboard
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Detailed performance metrics for all participants
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {currentMonthData.leaderboard.length} Total
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                      <TableRow className="border-b border-gray-200 dark:border-gray-700">
                        <TableHead className="pl-6 py-4 font-semibold">Rank</TableHead>
                        <TableHead className="py-4 font-semibold">Participant</TableHead>
                        <TableHead className="text-right py-4 font-semibold">Efficiency Score</TableHead>
                        <TableHead className="text-right py-4 font-semibold">Attendance</TableHead>
                        <TableHead className="text-right py-4 font-semibold">Total Tasks</TableHead>
                        <TableHead className="text-right py-4 font-semibold">Approved</TableHead>
                        <TableHead className="text-center py-4 font-semibold">Performance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Show all users, including top 3 */}
                      {currentMonthData.leaderboard.map((user, index) => (
                        <UserTableRow 
                          key={user.userId || index} 
                          user={user} 
                          rank={index + 1} 
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLeaderboard;
