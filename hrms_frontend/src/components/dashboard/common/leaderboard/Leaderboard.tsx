
"use client";
import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchOrganizationLeaderboard,
  selectLeaderboard,
  selectLeaderboardLoading,
  selectLeaderboardError,
} from "@/features/leaderBoard/leaderboardSlice";
import {
  fetchUserDepartments,
  selectUserDepartments,
  selectDepartmentLoading,
} from "@/features/departments/departmentSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Building2, Users } from "lucide-react";
import dayjs from "dayjs";

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

const Leaderboard = () => {
  const dispatch = useAppDispatch();

  const apiResponse = useAppSelector(selectLeaderboard);
  const leaderboardLoading = useAppSelector(selectLeaderboardLoading);
  const leaderboardError = useAppSelector(selectLeaderboardError);

  const userDepartments = useAppSelector(selectUserDepartments);
  const departmentLoading = useAppSelector(selectDepartmentLoading);

  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    dayjs().format("MM")
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    dayjs().format("YYYY")
  );
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);

  useEffect(() => {
    const currentYear = dayjs().year();
    const years = [
      String(currentYear),
      String(currentYear - 1),
      String(currentYear - 2),
    ];
    setAvailableYears(years);
  }, []);

  useEffect(() => {
    dispatch(fetchUserDepartments());
  }, [dispatch]);

  useEffect(() => {
    if (selectedDepartment && showLeaderboard) {
      const monthYear = `${selectedYear}-${selectedMonth}`;
      dispatch(
        fetchOrganizationLeaderboard({
          monthYear,
          departmentId: selectedDepartment,
        })
      );
    }
  }, [
    dispatch,
    selectedDepartment,
    selectedMonth,
    selectedYear,
    showLeaderboard,
  ]);

  const handleDepartmentSelect = (departmentId: string) => {
    setSelectedDepartment(departmentId);
    setShowLeaderboard(true);
  };

  const handleBackToDepartments = () => {
    setShowLeaderboard(false);
    setSelectedDepartment(null);
  };

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value.padStart(2, "0"));
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
  };

  
  if (departmentLoading) {
    return (
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
  }

  if (!showLeaderboard) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Leaderboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Select a department to view its performance leaderboard
            </p>
          </div>

          {userDepartments.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Departments Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You don't have access to any departments yet.
                </p>
                <Button
                  variant="outline"
                  onClick={() => dispatch(fetchUserDepartments())}
                >
                  Refresh
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userDepartments.map((department) => (
                <Card
                  key={department._id}
                  className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50"
                  onClick={() => handleDepartmentSelect(department._id)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          {department.name}
                        </CardTitle>
                        <CardDescription>
                          {department.description || "Department"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{department.members?.length || 0} members</span>
                      </div>
                      <Button variant="outline" size="sm">
                        View Leaderboard
                      </Button>
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

  if (leaderboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center space-x-4 mb-6">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  const currentDepartment = userDepartments.find(
    (dept) => dept._id === selectedDepartment
  );

  const leaderboardData: MonthlyLeaderboard[] = Array.isArray(apiResponse)
    ? apiResponse
    : (apiResponse as any)?.data ?? [];
  const currentMonthData = leaderboardData[0] || null;

  if (leaderboardError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="ghost" onClick={handleBackToDepartments}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Departments
            </Button>
          </div>

          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle>Error loading leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">{leaderboardError}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() =>
                  selectedDepartment &&
                  dispatch(
                    fetchOrganizationLeaderboard({
                      monthYear: `${selectedYear}-${selectedMonth}`,
                      departmentId: selectedDepartment,
                    })
                  )
                }
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (
    !currentMonthData ||
    !currentMonthData.leaderboard ||
    currentMonthData.leaderboard.length === 0
  ) {
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
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Select value={selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = String(i + 1).padStart(2, "0");
                    return (
                      <SelectItem key={month} value={month}>
                        {dayjs(`2023-${month}-01`).format("MMMM")}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>No leaderboard data available</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                There is no leaderboard data to display for{" "}
                {currentDepartment?.name} in the selected period.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() =>
                  selectedDepartment &&
                  dispatch(
                    fetchOrganizationLeaderboard({
                      monthYear: `${selectedYear}-${selectedMonth}`,
                      departmentId: selectedDepartment,
                    })
                  )
                }
              >
                Refresh
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const topUsers = currentMonthData.leaderboard.slice(0, 3);
  const otherUsers = currentMonthData.leaderboard.slice(3);

  const TopUserCard = ({
    user,
    bgColor,
    position,
  }: {
    user: LeaderboardUser;
    bgColor: string;
    position: number;
  }) => (
    <Card
      className={`${bgColor} border-0 relative overflow-hidden h-52 rounded-lg`}
    >
      <CardContent className="p-4 h-full flex flex-col">
        <Badge
          variant="secondary"
          className="absolute top-3 left-3 w-6 h-6 p-0 bg-black/30 text-white border-0 rounded-full flex items-center justify-center text-sm font-bold"
        >
          {position}
        </Badge>

        <div className="flex-1 flex flex-col items-center justify-center text-center mt-2">
          <Avatar className="w-16 h-16 mb-2 border-4 border-[#EBEBEA]">
            <AvatarFallback className="bg-white/20 text-gray-700 font-semibold text-sm">
              {user.userName
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "US"}
            </AvatarFallback>
          </Avatar>

          <h3 className="text-gray-800 font-semibold text-sm mb-1">
            {user.userName || "Unknown User"}
          </h3>
          <Badge
            variant="secondary"
            className="bg-white/20 text-white/90 text-xs border-0 mb-2"
          >
            Score: {user.efficiency?.toFixed(2) || "0.00"}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Tasks: {user.totalTasks || 0}</span>
            <span>Approved: {user.approvedCount || 0}</span>
          </div>
          <div className="relative">
            <div className="h-2 bg-white/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full"
                style={{ width: `${Math.min(user.efficiency || 0, 100)}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-green-600">{user.greenCount || 0}G</span>
            <span className="text-yellow-600">{user.yellowCount || 0}Y</span>
            <span className="text-red-600">{user.redCount || 0}R</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const UserTableRow = ({
    user,
    rank,
  }: {
    user: LeaderboardUser;
    rank: number;
  }) => (
    <TableRow className="hover:bg-muted/50 border-b border-border/40">
      <TableCell className="py-4 pl-6">
        <span className="text-sm font-medium text-muted-foreground">
          {rank}
        </span>
      </TableCell>
      <TableCell className="py-4">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs font-medium">
            {user.userName
              ?.split(" ")
              .map((n) => n[0])
              .join("") || "US"}
          </AvatarFallback>
        </Avatar>
      </TableCell>
      <TableCell className="py-4">
        <div>
          <div className="font-medium text-sm">
            {user.userName || "Unknown User"}
          </div>
        </div>
      </TableCell>
      <TableCell className="py-4">
        <Badge variant="outline" className="text-xs">
          {user.attendanceAverage?.toFixed(2) || "0.00"}% Attendance
        </Badge>
      </TableCell>
      <TableCell className="py-4 text-right">
        <span className="text-sm font-medium">
          {user.efficiency?.toFixed(2) || "0.00"}
        </span>
      </TableCell>
      <TableCell className="py-4 text-right">
        <div className="flex gap-1 justify-end">
          <span className="text-green-600 text-sm">
            {user.greenCount || 0}G
          </span>
          <span className="text-yellow-600 text-sm">
            {user.yellowCount || 0}Y
          </span>
          <span className="text-red-600 text-sm">{user.redCount || 0}R</span>
        </div>
      </TableCell>
      <TableCell className="py-4 pr-6">
        <div className="w-16">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400"
              style={{ width: `${Math.min(user.efficiency || 0, 100)}%` }}
            />
          </div>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
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
                Performance rankings for{" "}
                {dayjs(`${selectedYear}-${selectedMonth}-01`).format(
                  "MMMM YYYY"
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = String(i + 1).padStart(2, "0");
                  return (
                    <SelectItem key={month} value={month}>
                      {dayjs(`2023-${month}-01`).format("MMMM")}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {topUsers.length > 0 ? (
              topUsers.map((user, index) => (
                <TopUserCard
                  key={user.userId || index}
                  user={user}
                  bgColor={
                    index === 0
                      ? "bg-[#dfd29e]"
                      : index === 1
                      ? "bg-[#ccced1]"
                      : "bg-[#d6bc9e]"
                  }
                  position={index + 1}
                />
              ))
            ) : (
              <Card className="h-52 flex items-center justify-center">
                <p className="text-muted-foreground">No top performers data</p>
              </Card>
            )}
          </div>

          <div className="lg:col-span-3">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">
                  Performance Leaderboard
                </CardTitle>
                <CardDescription>
                  Showing results for{" "}
                  {dayjs(`${selectedYear}-${selectedMonth}-01`).format(
                    "MMMM YYYY"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/40">
                      <TableHead className="pl-6 text-xs font-medium text-muted-foreground">
                        Rank
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground">
                        User
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground">
                        Name
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground">
                        Attendance
                      </TableHead>
                      <TableHead className="text-right text-xs font-medium text-muted-foreground">
                        Efficiency
                      </TableHead>
                      <TableHead className="text-right text-xs font-medium text-muted-foreground">
                        Pulses
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground">
                        Score
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {otherUsers.length > 0 ? (
                      otherUsers.map((user, index) => (
                        <UserTableRow
                          key={user.userId || index}
                          user={user}
                          rank={index + 4}
                        />
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No other users to display
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
