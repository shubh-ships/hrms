'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  Info,
  ArrowLeft,
  Users,
  Search,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchUserYearlyPulseEfficiency,
  fetchUserMonthlyPulseEfficiency,
  clearError,
  clearSelectedUserData,
  downloadPulseEfficiencyCSV,
} from '@/features/efficiencyReport/pulseEfficiencySlice';
import {
  fetchUserHierarchy,
  selectHierarchyUsers,
  selectHierarchyLoading,
  selectUsersError
} from '@/features/user/userSlice';
import { toast } from 'sonner';
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const KPICard = ({
  title,
  value,
  unit,
  change,
  isPositive,
  icon: Icon,
  maxValue = 100,
  showBar = true,
}: {
  title: string;
  value: string | number;
  unit?: string;
  change: string;
  isPositive: boolean;
  icon?: React.ElementType;
  maxValue?: number;
  showBar?: boolean;
}) => {
  const numericValue =
    typeof value === 'string' ? Number.parseFloat(value) : value;
  const percentage = showBar
    ? Math.min((numericValue / maxValue) * 100, 100)
    : 85;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? value.toFixed(1) : value}
          {unit && (
            <span className="text-lg font-normal text-gray-500 ml-1">
              {unit}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1 mt-2">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span
            className={`text-sm ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {change}
          </span>
          <span className="text-sm text-muted-foreground">
            vs previous period
          </span>
        </div>
        {showBar && (
          <div className="w-full bg-muted rounded-full h-3 mt-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                percentage >= 80
                  ? 'bg-green-500'
                  : percentage >= 60
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const HierarchyUsersList = ({ 
  users, 
  onUserSelect, 
  loading 
}: { 
  users: any[], 
  onUserSelect: (userId: string, userName: string) => void,
  loading: boolean 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users);

  useEffect(() => {
    if (Array.isArray(users)) {
      const filtered = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchTerm]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Team Members</span>
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search team members..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2 text-gray-600">Loading team members...</span>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredUsers.map(user => (
              <div
                key={user.userId}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={() => onUserSelect(user.userId, user.name)}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {user.name
                        ?.split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {user.email}
                    </p>
                    {user.role && (
                      <Badge variant="secondary" className="text-xs">
                        {user.role}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    View Report
                  </Button>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                <div className="h-12 w-12 mx-auto mb-2 opacity-50 flex items-center justify-center">
                  <Users className="h-8 w-8" />
                </div>
                <p>No team members found</p>
                {searchTerm && (
                  <p className="text-sm mt-1">Try adjusting your search term</p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

function EfficiencyReportManager() {
  const dispatch = useAppDispatch();

  const pulseEfficiencyState = useAppSelector(state => state.pulseEfficiency);
  const hierarchyUsers = useAppSelector(selectHierarchyUsers);
  const hierarchyLoading = useAppSelector(selectHierarchyLoading);
  const hierarchyError = useAppSelector(selectUsersError);

  const {
    selectedUserData = { weekly: [], monthly: [], yearly: [] },
    loading = false,
    error = null,
    downloadLoading = false,
  } = pulseEfficiencyState || {};

  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [selectedMonthYear, setSelectedMonthYear] = useState(formatCurrentMonth());
  const [viewMode, setViewMode] = useState<'list' | 'report'>('list');
  const [selectedUser, setSelectedUser] = useState<{
    userId: string;
    userName: string;
  } | null>(null);

  function formatCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  const generateMonthOptions = () => {
    const currentYear = new Date().getFullYear();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    return months.map((month, index) => {
      const monthNum = String(index + 1).padStart(2, '0');
      const value = `${currentYear}-${monthNum}`;
      return { label: month, value };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(fetchUserHierarchy()).unwrap();
        
        if (viewMode === 'report' && selectedUser) {
          await dispatch(
            fetchUserYearlyPulseEfficiency({
              userId: selectedUser.userId,
              year: selectedYear,
            })
          );
          await dispatch(
            fetchUserMonthlyPulseEfficiency({
              userId: selectedUser.userId,
              monthYear: selectedMonthYear,
            })
          );
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, [dispatch, selectedYear, selectedMonthYear, viewMode, selectedUser]);

  const handleDownloadCSV = async () => {
    try {
      await dispatch(downloadPulseEfficiencyCSV(selectedMonthYear)).unwrap();
      toast.success('CSV downloaded successfully');
    } catch (error) {
      toast.error('Failed to download CSV');
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (hierarchyError) {
      toast.error('Failed to load team hierarchy: ' + hierarchyError);
    }
  }, [hierarchyError]);

  const handleUserSelect = (userId: string, userName: string) => {
    setSelectedUser({ userId, userName });
    setViewMode('report');
    dispatch(clearSelectedUserData());
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedUser(null);
    dispatch(clearSelectedUserData());
  };

  const calculateKPIs = () => {
    const defaultKPIs = {
      tasksCompletedOnTime: 0,
      averageAttendance: 0,
      pulseScore: 0,
      changes: {
        tasksCompletedOnTime: 0,
        averageAttendance: 0,
        pulseScore: 0,
      },
    };

    if (!selectedUserData?.monthly?.[0]) {
      return defaultKPIs;
    }

    const currentMonthData = selectedUserData.monthly[0];
    const yearlyDataArray = Array.isArray(selectedUserData?.yearly)
      ? selectedUserData.yearly
      : [];

    const currentMonth = new Date(selectedMonthYear + '-01').getMonth();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousMonthData = yearlyDataArray.find(item => {
      const itemMonth = new Date(`${item.year}-${item.month}-01`).getMonth();
      return itemMonth === previousMonth;
    });

    const tasksCompletedOnTime = Math.round(currentMonthData.sealSubmissionRate || 0);
    const averageAttendance = Math.round(currentMonthData.attendanceAverage || 0);
    const pulseScore = Math.round(currentMonthData.efficiency || 0);

    const changes = {
      tasksCompletedOnTime:
        previousMonthData && previousMonthData.sealSubmissionRate > 0
          ? Math.round(((currentMonthData.sealSubmissionRate - previousMonthData.sealSubmissionRate) / previousMonthData.sealSubmissionRate) * 100)
          : 0,
      averageAttendance:
        previousMonthData && previousMonthData.attendanceAverage > 0
          ? Math.round(((currentMonthData.attendanceAverage - previousMonthData.attendanceAverage) / previousMonthData.attendanceAverage) * 100)
          : 0,
      pulseScore:
        previousMonthData && previousMonthData.efficiency > 0
          ? Math.round(((currentMonthData.efficiency - previousMonthData.efficiency) / previousMonthData.efficiency) * 100)
          : 0,
    };

    return {
      tasksCompletedOnTime,
      averageAttendance,
      pulseScore,
      changes,
    };
  };

  const efficiencyTrendData = Array.isArray(selectedUserData?.yearly)
    ? selectedUserData.yearly.map(item => ({
        month: item.month?.substring(0, 3) ?? '',
        efficiency: Math.round(item.efficiency ?? 0),
      }))
    : [];

  const kpis = calculateKPIs();

  if (viewMode === 'list') {
    return (
      <div className="p-6 space-y-6 min-h-screen">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Team Efficiency Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              View efficiency reports for your team members
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-gray-600">
              {hierarchyLoading 
                ? 'Loading team members...' 
                : `${hierarchyUsers.length} team members available`
              }
            </span>
          </div>
        </div>
        
        <HierarchyUsersList
          users={hierarchyUsers}
          onUserSelect={handleUserSelect}
          loading={hierarchyLoading}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Team
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Efficiency Report - {selectedUser?.userName}
            </h1>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedMonthYear} onValueChange={setSelectedMonthYear}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {generateMonthOptions().map(month => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadCSV}
            disabled={downloadLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            {downloadLoading ? 'Downloading...' : 'Export CSV'}
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Key Performance Indicators
        </h2>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <KPICard
              title="Tasks Completed on Time"
              value={kpis.tasksCompletedOnTime}
              unit="%"
              change={`${kpis.changes?.tasksCompletedOnTime >= 0 ? '↑' : '↓'} ${Math.abs(kpis.changes?.tasksCompletedOnTime || 0)}%`}
              isPositive={(kpis.changes?.tasksCompletedOnTime || 0) >= 0}
              icon={Info}
              maxValue={100}
              showBar={true}
            />
            <KPICard
              title="Average Attendance"
              value={kpis.averageAttendance}
              unit="%"
              change={`${kpis.changes?.averageAttendance >= 0 ? '↑' : '↓'} ${Math.abs(kpis.changes?.averageAttendance || 0)}%`}
              isPositive={(kpis.changes?.averageAttendance || 0) >= 0}
              icon={Info}
              maxValue={100}
              showBar={true}
            />
            <KPICard
              title="Pulse Score"
              value={kpis.pulseScore}
              unit=""
              change={`${kpis.changes?.pulseScore >= 0 ? '↑' : '↓'} ${Math.abs(kpis.changes?.pulseScore || 0)}%`}
              isPositive={(kpis.changes?.pulseScore || 0) >= 0}
              icon={Info}
              maxValue={200}
              showBar={false}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Green Tasks</p>
                <p className="text-2xl font-bold text-green-900">
                  {selectedUserData?.monthly?.[0]?.greenCount || 0}
                </p>
                <p className="text-xs text-green-600 mt-1">Successfully completed</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Yellow Tasks</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {selectedUserData?.monthly?.[0]?.yellowCount || 0}
                </p>
                <p className="text-xs text-yellow-600 mt-1">In progress/warning</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Red Tasks</p>
                <p className="text-2xl font-bold text-red-900">
                  {selectedUserData?.monthly?.[0]?.redCount || 0}
                </p>
                <p className="text-xs text-red-600 mt-1">Delayed/issues</p>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Tasks</p>
                <p className="text-2xl font-bold text-blue-900">
                  {selectedUserData?.monthly?.[0]?.totalTasks || 0}
                </p>
                <p className="text-xs text-blue-600 mt-1">All assigned tasks</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pulse Efficiency Trend</CardTitle>
          <p className="text-sm text-gray-600">
            Monthly efficiency score over the last year.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <ChartContainer
              config={{
                efficiency: {
                  label: 'Efficiency',
                  color: 'hsl(var(--chart-1))',
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={efficiencyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="efficiency"
                    stroke="var(--color-efficiency)"
                    strokeWidth={3}
                    dot={{
                      fill: 'var(--color-efficiency)',
                      strokeWidth: 2,
                      r: 4,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default EfficiencyReportManager;
