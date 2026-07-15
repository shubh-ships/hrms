"use client";

import React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Filter,
  Download,
  Share,
  TrendingUp,
  TrendingDown,
  Info,
  ArrowLeft,
  Users,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchWeeklyPulseEfficiency,
  fetchMonthlyPulseEfficiency,
  fetchYearlyPulseEfficiency,
  fetchUserYearlyPulseEfficiency,
  fetchUserMonthlyPulseEfficiency,
  fetchLeaderboard,
  clearError,
  clearSelectedUserData,
  downloadPulseEfficiencyCSV,
} from "@/features/efficiencyReport/pulseEfficiencySlice";
import { listDepartmentFrauds } from "@/features/fraud1/fraudSlice1";
import { fetchDepartments } from "@/features/departments/departmentSlice";
import { toast } from "sonner";
import UsersList from "@/components/dashboard/common/usersList";
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

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
    typeof value === "string" ? Number.parseFloat(value) : value;
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
          {typeof value === "number" ? value.toFixed(1) : value}
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
              isPositive ? "text-green-600" : "text-red-600"
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
                  ? "bg-green-500"
                  : percentage >= 60
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const CalendarHeatmap = ({ data }: { data: any[] }) => {
  const getStatusColor = (
    greenCount: number,
    yellowCount: number,
    redCount: number
  ) => {
    const total = greenCount + yellowCount + redCount;
    if (total === 0) return "bg-muted";
    const greenRatio = greenCount / total;
    const redRatio = redCount / total;
    if (greenRatio >= 0.7) return "bg-green-500";
    if (redRatio >= 0.5) return "bg-red-500";
    return "bg-yellow-500";
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const generateCalendarGrid = () => {
    if (!Array.isArray(data)) return [];
    const grid = [];
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    for (let i = 0; i < 35; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const matchingData = data.find((item) => {
        const itemMonth = new Date(
          item.year,
          getMonthNumber(item.month) - 1,
          1
        );
        return (
          itemMonth.getMonth() === date.getMonth() &&
          itemMonth.getFullYear() === date.getFullYear()
        );
      });

      grid.push({
        date: date.toISOString().split("T")[0],
        day: date.getDate(),
        dayOfWeek: date.getDay(),
        greenCount: matchingData?.greenCount || 0,
        yellowCount: matchingData?.yellowCount || 0,
        redCount: matchingData?.redCount || 0,
      });
    }
    return grid;
  };

  const getMonthNumber = (monthName: string) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months.indexOf(monthName) + 1;
  };

  const calendarGrid = generateCalendarGrid();

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center font-medium">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarGrid.map((item, index) => (
          <div
            key={index}
            className={`w-8 h-8 rounded ${getStatusColor(
              item.greenCount,
              item.yellowCount,
              item.redCount
            )} flex items-center justify-center text-xs text-white font-medium`}
            title={`${item.date}: Green: ${item.greenCount}, Yellow: ${item.yellowCount}, Red: ${item.redCount}`}
          >
            {item.day}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center space-x-4 mt-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Good</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>Average</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Poor</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-gray-300 rounded"></div>
          <span>No Data</span>
        </div>
      </div>
    </div>
  );
};

interface EfficiencyReportProps {
  role: "ADMIN" | "MANAGER" | "MEMBER";
}

function EfficiencyReport({ role }: EfficiencyReportProps) {
  const dispatch = useAppDispatch();

  const pulseEfficiencyState = useAppSelector((state) => state.pulseEfficiency);
  const fraudState = useAppSelector((state) => state.fraud);
  const departmentState = useAppSelector((state) => state.departments);

  const {
    yearlyData = [],
    weeklyData = [],
    monthlyData = [],
    selectedUserData = { weekly: [], monthly: [], yearly: [] },
    loading = false,
    error = null,
    downloadLoading = false,
  } = pulseEfficiencyState || {};

  const { departmentFrauds = [] } = fraudState || {};
  const { departments = [] } = departmentState || {};

  const [shareWeeklySummary, setShareWeeklySummary] = useState(true);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [selectedMonth, setSelectedMonth] = useState(formatCurrentMonth());
  const [viewMode, setViewMode] = useState<"list" | "report">(
    role === "MEMBER" ? "report" : "list"
  );
  const [selectedUser, setSelectedUser] = useState<{
    userId: string;
    userName: string;
  } | null>(null);
  const [selectedMonthYear, setSelectedMonthYear] = useState(
    formatCurrentMonth()
  );
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");

  const generateMonthOptions = () => {
    const currentYear = new Date().getFullYear();
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return months.map((month, index) => {
      const monthNum = String(index + 1).padStart(2, "0");
      const value = `${currentYear}-${monthNum}`;
      return { label: month, value };
    });
  };

  function formatCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }

  const { departmentMembers = [] } = departmentState || {};

  useEffect(() => {
    const initializeDepartments = async () => {
      try {
        await dispatch(fetchDepartments({})).unwrap();
      } catch (error) {
        console.error("Failed to fetch departments:", error);
        toast.error("Failed to load departments");
      }
    };

    initializeDepartments();
  }, [dispatch]);

  useEffect(() => {
    if (departments.length > 0 && !selectedDepartment) {
      const salesDept = departments.find(
        (d: any) => d.name.toLowerCase() === "sales"
      );
      setSelectedDepartment(salesDept ? salesDept._id : departments[0]._id);
    }
  }, [departments, selectedDepartment]);

  useEffect(() => {
    if (role === "MEMBER" || (viewMode === "report" && !selectedUser)) {
      dispatch(fetchYearlyPulseEfficiency(selectedYear));
      dispatch(fetchWeeklyPulseEfficiency());
      dispatch(fetchMonthlyPulseEfficiency(selectedMonthYear));
    } else if (viewMode === "report" && selectedUser) {
      dispatch(
        fetchUserYearlyPulseEfficiency({
          userId: selectedUser.userId,
          year: selectedYear,
        })
      );
      dispatch(
        fetchUserMonthlyPulseEfficiency({
          userId: selectedUser.userId,
          monthYear: selectedMonthYear,
        })
      );
    }

    if (role !== "MEMBER" && selectedDepartment) {
      dispatch(fetchLeaderboard(selectedDepartment));
    }

    dispatch(listDepartmentFrauds());
  }, [
    dispatch,
    selectedYear,
    selectedMonthYear,
    role,
    viewMode,
    selectedUser,
    selectedDepartment,
  ]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleUserSelect = (userId: string, userName: string) => {
    setSelectedUser({ userId, userName });
    setViewMode("report");
    dispatch(clearSelectedUserData());
  };

  const handleDownloadCSV = async () => {
    try {
      await dispatch(downloadPulseEfficiencyCSV(selectedMonthYear)).unwrap();
      toast.success("CSV downloaded successfully");
    } catch (error) {
      toast.error("Failed to download CSV");
    }
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedUser(null);
    dispatch(clearSelectedUserData());
  };

  const calculateKPIs = () => {
    const defaultKPIs = {
      tasksCompletedOnTime: 0,
      averageAttendance: 0,
      teamPulseScore: 0,
      changes: {
        tasksCompletedOnTime: 0,
        averageAttendance: 0,
        teamPulseScore: 0,
      },
    };

    const currentMonthData = selectedUser
      ? Array.isArray(selectedUserData?.monthly) &&
        selectedUserData.monthly.length > 0
        ? selectedUserData.monthly[0]
        : null
      : Array.isArray(monthlyData) && monthlyData.length > 0
      ? monthlyData[0]
      : null;

    const yearlyDataArray = selectedUser
      ? Array.isArray(selectedUserData?.yearly)
        ? selectedUserData.yearly
        : []
      : Array.isArray(yearlyData)
      ? yearlyData
      : [];

    if (!currentMonthData) {
      return defaultKPIs;
    }

    const currentMonth = new Date(selectedMonthYear + "-01").getMonth();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousMonthData = yearlyDataArray.find((item) => {
      const itemMonth = new Date(`${item.year}-${item.month}-01`).getMonth();
      return itemMonth === previousMonth;
    });

    const tasksCompletedOnTime = Math.round(
      currentMonthData.sealSubmissionRate || 0
    );
    const averageAttendance = Math.round(
      currentMonthData.attendanceAverage || 0
    );
    const teamPulseScore = Math.round(currentMonthData.efficiency || 0);

    const changes = {
      tasksCompletedOnTime:
        previousMonthData && previousMonthData.sealSubmissionRate > 0
          ? Math.round(
              ((currentMonthData.sealSubmissionRate -
                previousMonthData.sealSubmissionRate) /
                previousMonthData.sealSubmissionRate) *
                100
            )
          : 0,
      averageAttendance:
        previousMonthData && previousMonthData.attendanceAverage > 0
          ? Math.round(
              ((currentMonthData.attendanceAverage -
                previousMonthData.attendanceAverage) /
                previousMonthData.attendanceAverage) *
                100
            )
          : 0,
      teamPulseScore:
        previousMonthData && previousMonthData.efficiency > 0
          ? Math.round(
              ((currentMonthData.efficiency - previousMonthData.efficiency) /
                previousMonthData.efficiency) *
                100
            )
          : 0,
    };

    return {
      tasksCompletedOnTime,
      averageAttendance,
      teamPulseScore,
      changes,
    };
  };

  const dataSource = selectedUser
    ? Array.isArray(selectedUserData?.yearly)
      ? selectedUserData.yearly
      : []
    : Array.isArray(yearlyData)
    ? yearlyData
    : [];

  const efficiencyTrendData = dataSource.map((item) => ({
    month: item.month?.substring(0, 3) ?? "",
    efficiency: Math.round(item.efficiency ?? 0),
  }));

  const taskDelayData = React.useMemo(() => {
    if (!Array.isArray(departmentFrauds)) return [];

    const fraudTypeCounts = departmentFrauds.reduce(
      (acc: Record<string, number>, fraud: any) => {
        const fraudType = fraud.fraudType || "Unknown";
        acc[fraudType] = (acc[fraudType] || 0) + 1;
        return acc;
      },
      {}
    );

    return Object.entries(fraudTypeCounts)
      .map(([fraudType, count]) => ({
        reason: fraudType,
        count: count as number,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [departmentFrauds]);

  const kpis = calculateKPIs();

  if (role !== "MEMBER" && viewMode === "list") {
    return (
      <div className="p-6 space-y-6  min-h-screen">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Efficiency Reports
            </h1>

            <p className="text-muted-foreground mt-1">
              {role === "ADMIN"
                ? "View efficiency reports for all users"
                : "View efficiency reports for your department members"}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-muted-foreground" />

            <span className="text-sm text-gray-600">
              Select a user to view their report
            </span>
          </div>
        </div>
        <UsersList onUserSelect={handleUserSelect} role={role} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6  min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-4">
          {role !== "MEMBER" && selectedUser && (
            <Button variant="outline" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          )}
          
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          {role !== "MEMBER" && (
            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept: any) => (
                  <SelectItem key={dept._id} value={dept._id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

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

          <Select
            value={selectedMonthYear}
            onValueChange={setSelectedMonthYear}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {generateMonthOptions().map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCSV}
              disabled={downloadLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              {downloadLoading ? "Downloading..." : "Export CSV"}
            </Button>
          </div>
        
        </div>
      </div>

      
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Key Performance Indicator
        </h2>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <KPICard
                title="Tasks Completed on Time"
                value={kpis.tasksCompletedOnTime}
                unit="%"
                change={`${
                  kpis.changes?.tasksCompletedOnTime >= 0 ? "↑" : "↓"
                } ${Math.abs(kpis.changes?.tasksCompletedOnTime || 0)}%`}
                isPositive={(kpis.changes?.tasksCompletedOnTime || 0) >= 0}
                icon={Info}
                maxValue={100}
                showBar={true}
              />
              <KPICard
                title="Average Attendance"
                value={kpis.averageAttendance}
                unit="%"
                change={`${
                  kpis.changes?.averageAttendance >= 0 ? "↑" : "↓"
                } ${Math.abs(kpis.changes?.averageAttendance || 0)}%`}
                isPositive={(kpis.changes?.averageAttendance || 0) >= 0}
                icon={Info}
                maxValue={100}
                showBar={true}
              />
              <KPICard
                title="Team Pulse Score"
                value={kpis.teamPulseScore}
                unit=""
                change={`${
                  kpis.changes?.teamPulseScore >= 0 ? "↑" : "↓"
                } ${Math.abs(kpis.changes?.teamPulseScore || 0)}%`}
                isPositive={(kpis.changes?.teamPulseScore || 0) >= 0}
                icon={Info}
                maxValue={200}
                showBar={false}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">
                        Green Tasks
                      </p>
                      <p className="text-2xl font-bold text-green-900">
                        {(selectedUser
                          ? selectedUserData?.monthly?.[0]
                          : monthlyData[0]
                        )?.greenCount || 0}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Successfully completed
                      </p>
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
                      <p className="text-sm font-medium text-yellow-700">
                        Yellow Tasks
                      </p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {(selectedUser
                          ? selectedUserData?.monthly?.[0]
                          : monthlyData[0]
                        )?.yellowCount || 0}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        In progress/warning
                      </p>
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
                      <p className="text-sm font-medium text-red-700">
                        Red Tasks
                      </p>
                      <p className="text-2xl font-bold text-red-900">
                        {(selectedUser
                          ? selectedUserData?.monthly?.[0]
                          : monthlyData[0]
                        )?.redCount || 0}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Delayed/issues
                      </p>
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
                      <p className="text-sm font-medium text-blue-700">
                        Total Tasks
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        {(selectedUser
                          ? selectedUserData?.monthly?.[0]
                          : monthlyData[0]
                        )?.totalTasks || 0}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        All assigned tasks
                      </p>
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
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {
                    (selectedUser
                      ? selectedUserData?.monthly?.[0]
                      : monthlyData[0]
                    )?.month
                  }{" "}
                  {
                    (selectedUser
                      ? selectedUserData?.monthly?.[0]
                      : monthlyData[0]
                    )?.year
                  }{" "}
                  Performance Breakdown
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Comprehensive view of all performance metrics
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700">
                      Task Distribution
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Success Rate:</span>
                        <span className="font-semibold text-green-600">
                          {Math.round(
                            ((selectedUser
                              ? selectedUserData?.monthly?.[0]
                              : monthlyData[0]
                            )?.greenCount /
                              (selectedUser
                                ? selectedUserData?.monthly?.[0]
                                : monthlyData[0]
                              )?.totalTasks) *
                              100
                          ) || 0}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Warning Rate:</span>
                        <span className="font-semibold text-yellow-600">
                          {Math.round(
                            ((selectedUser
                              ? selectedUserData?.monthly?.[0]
                              : monthlyData[0]
                            )?.yellowCount /
                              (selectedUser
                                ? selectedUserData?.monthly?.[0]
                                : monthlyData[0]
                              )?.totalTasks) *
                              100
                          ) || 0}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Issue Rate:</span>
                        <span className="font-semibold text-red-600">
                          {Math.round(
                            ((selectedUser
                              ? selectedUserData?.monthly?.[0]
                              : monthlyData[0]
                            )?.redCount /
                              (selectedUser
                                ? selectedUserData?.monthly?.[0]
                                : monthlyData[0]
                              )?.totalTasks) *
                              100
                          ) || 0}
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700">
                      Submission & Approval
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Submission Rate:</span>
                        <span className="font-semibold text-blue-600">
                          {(selectedUser
                            ? selectedUserData?.monthly?.[0]
                            : monthlyData[0]
                          )?.sealSubmissionRate || 0}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Approved Tasks:</span>
                        <span className="font-semibold text-green-600">
                          {(selectedUser
                            ? selectedUserData?.monthly?.[0]
                            : monthlyData[0]
                          )?.approvedCount || 0}{" "}
                          /{" "}
                          {(selectedUser
                            ? selectedUserData?.monthly?.[0]
                            : monthlyData[0]
                          )?.totalTasks || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Approval Rate:</span>
                        <span className="font-semibold text-green-600">
                          {Math.round(
                            ((selectedUser
                              ? selectedUserData?.monthly?.[0]
                              : monthlyData[0]
                            )?.approvedCount /
                              (selectedUser
                                ? selectedUserData?.monthly?.[0]
                                : monthlyData[0]
                              )?.totalTasks) *
                              100
                          ) || 0}
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700">
                      Attendance & Efficiency
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Attendance:</span>
                        <span
                          className={`font-semibold ${
                            (selectedUser
                              ? selectedUserData?.monthly?.[0]
                              : monthlyData[0]
                            )?.attendanceAverage >= 70
                              ? "text-green-600"
                              : (selectedUser
                                  ? selectedUserData?.monthly?.[0]
                                  : monthlyData[0]
                                )?.attendanceAverage >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {Math.round(
                            (selectedUser
                              ? selectedUserData?.monthly?.[0]
                              : monthlyData[0]
                            )?.attendanceAverage || 0
                          )}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Efficiency Score:</span>
                        <span className="font-semibold text-purple-600">
                          {Math.round(
                            (selectedUser
                              ? selectedUserData?.monthly?.[0]
                              : monthlyData[0]
                            )?.efficiency || 0
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Performance Grade:</span>
                        <span
                          className={`font-semibold ${
                            (selectedUser
                              ? selectedUserData?.monthly?.[0]
                              : monthlyData[0]
                            )?.efficiency >= 150
                              ? "text-green-600"
                              : (selectedUser
                                  ? selectedUserData?.monthly?.[0]
                                  : monthlyData[0]
                                )?.efficiency >= 100
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {(selectedUser
                            ? selectedUserData?.monthly?.[0]
                            : monthlyData[0]
                          )?.efficiency >= 150
                            ? "Excellent"
                            : (selectedUser
                                ? selectedUserData?.monthly?.[0]
                                : monthlyData[0]
                              )?.efficiency >= 100
                            ? "Good"
                            : "Needs Improvement"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">
                        Task Completion Progress
                      </span>
                      <span className="text-sm text-gray-600">
                        {(selectedUser
                          ? selectedUserData?.monthly?.[0]
                          : monthlyData[0]
                        )?.greenCount || 0}{" "}
                        /{" "}
                        {(selectedUser
                          ? selectedUserData?.monthly?.[0]
                          : monthlyData[0]
                        )?.totalTasks || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="flex h-3 rounded-full overflow-hidden">
                        <div
                          className="bg-green-500"
                          style={{
                            width: `${
                              ((selectedUser
                                ? selectedUserData?.monthly?.[0]
                                : monthlyData[0]
                              )?.greenCount /
                                (selectedUser
                                  ? selectedUserData?.monthly?.[0]
                                  : monthlyData[0]
                                )?.totalTasks) *
                                100 || 0
                            }%`,
                          }}
                        ></div>
                        <div
                          className="bg-yellow-500"
                          style={{
                            width: `${
                              ((selectedUser
                                ? selectedUserData?.monthly?.[0]
                                : monthlyData[0]
                              )?.yellowCount /
                                (selectedUser
                                  ? selectedUserData?.monthly?.[0]
                                  : monthlyData[0]
                                )?.totalTasks) *
                                100 || 0
                            }%`,
                          }}
                        ></div>
                        <div
                          className="bg-red-500"
                          style={{
                            width: `${
                              ((selectedUser
                                ? selectedUserData?.monthly?.[0]
                                : monthlyData[0]
                              )?.redCount /
                                (selectedUser
                                  ? selectedUserData?.monthly?.[0]
                                  : monthlyData[0]
                                )?.totalTasks) *
                                100 || 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">
                        Attendance Level
                      </span>
                      <span className="text-sm text-gray-600">
                        {Math.round(
                          (selectedUser
                            ? selectedUserData?.monthly?.[0]
                            : monthlyData[0]
                          )?.attendanceAverage || 0
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${
                          (selectedUser
                            ? selectedUserData?.monthly?.[0]
                            : monthlyData[0]
                          )?.attendanceAverage >= 70
                            ? "bg-green-500"
                            : (selectedUser
                                ? selectedUserData?.monthly?.[0]
                                : monthlyData[0]
                              )?.attendanceAverage >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{
                          width: `${
                            (selectedUser
                              ? selectedUserData?.monthly?.[0]
                              : monthlyData[0]
                            )?.attendanceAverage || 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    label: "Efficiency",
                    color: "hsl(var(--chart-1))",
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
                        fill: "var(--color-efficiency)",
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

        <Card>
          <CardHeader>
            <CardTitle>Task Delay Reasons</CardTitle>
            <p className="text-sm text-gray-600">
              Top fraud types causing delays in the current period.
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
                  count: {
                    label: "Count",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taskDelayData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="reason" type="category" width={100} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="count"
                      fill="var(--color-count)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      
    </div>
  );
}

export default EfficiencyReport;
