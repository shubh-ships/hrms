"use client";
import React, { useState, useEffect } from "react";
import { Bell, AlertTriangle, TrendingUp, Users, Clock, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dayjs from "dayjs";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchOrganizationLeaderboard,
  selectLeaderboard,
  selectLeaderboardLoading,
} from "@/features/leaderBoard/leaderboardSlice";
import { listDepartmentFrauds, selectDepartmentFrauds, selectFraudLoading } from "@/features/fraud1/fraudSlice1";
import {
  fetchNotifications,
  selectNotifications,
  selectNotificationLoading,
  selectNotificationError,
} from "@/features/notifications/notificationSlice";
import { useRouter } from "next/navigation";


// --- Types ---
interface LeaderboardUser {
  userId: string;
  userName: string;
  efficiency: number;
  attendanceAverage: number;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  approvedCount: number;
  totalTasks: number;
}

interface MonthlyLeaderboard {
  monthYear: string;
  leaderboard: LeaderboardUser[];
}

interface LeaderboardResponse {
  data: MonthlyLeaderboard[];
}

interface Fraud {
  _id: string;
  user?: { name?: string };
  fraudType: string;
  createdAt: string;
  status: string;
}

const TeamInsightsSidebar: React.FC = () => {
  const router = useRouter();

  const dispatch = useAppDispatch();
  const [expandedFrauds, setExpandedFrauds] = useState(false);

  // Leaderboard
  const apiResponse = useAppSelector(selectLeaderboard) as unknown as LeaderboardResponse;
  const leaderboardLoading = useAppSelector(selectLeaderboardLoading);

  // Fraud
  const departmentFrauds = (useAppSelector(selectDepartmentFrauds) ?? []) as Fraud[];
  const fraudLoading = useAppSelector(selectFraudLoading);

  // Notifications
  const notifications = useAppSelector(selectNotifications);
  const notificationsLoading = useAppSelector(selectNotificationLoading);
  const notificationsError = useAppSelector(selectNotificationError);

  // Month/year filtering
  const [selectedMonth, setSelectedMonth] = useState<string>(dayjs().format("MM"));
  const [selectedYear, setSelectedYear] = useState<string>(dayjs().format("YYYY"));
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  useEffect(() => {
    const currentYear = dayjs().year();
    setAvailableYears([String(currentYear), String(currentYear - 1), String(currentYear - 2)]);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const monthYear = `${selectedYear}-${selectedMonth}`;
        await dispatch(fetchOrganizationLeaderboard({ monthYear, departmentId: "" }));
        await dispatch(listDepartmentFrauds());
        await dispatch(fetchNotifications());
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [dispatch, selectedMonth, selectedYear]);
  
  const handleMonthChange = (value: string) => setSelectedMonth(value.padStart(2, "0"));
  const handleYearChange = (value: string) => setSelectedYear(value);

  // Leaderboard preview
  const currentMonthData = apiResponse?.data?.[0];
  const leaderboardUsers = currentMonthData?.leaderboard || [];
  const sidebarLeaderboardData = leaderboardUsers.slice(0, 5).map((user: LeaderboardUser) => ({
    name: user.userName || "Unknown User",
    value: user.efficiency || 0,
    unit: "%",
    ...user,
  }));

  // --- Fraud formatting ---
  const formatFraudAlert = (fraud: Fraud) => {
    const userName = fraud.user?.name || "A team member";
    let fraudMessage = `${userName} flagged for `;
    switch (fraud.fraudType) {
      case "Approval within 30 seconds":
        fraudMessage += "quick approval (potential rubber-stamping)";
        break;
      case "File Size < 10KB":
        fraudMessage += "submitting suspiciously small files";
        break;
      case "Image is Blank (White or Black)":
        fraudMessage += "submitting blank images";
        break;
      default:
        if (fraud.fraudType.startsWith("Link Used:")) {
          fraudMessage += "reusing submission links";
        } else {
          fraudMessage += fraud.fraudType.toLowerCase();
        }
    }
    return fraudMessage;
  };

  const formatTimeSince = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const getFraudSeverity = (fraudType: string) => {
    if (fraudType.includes("Blank") || fraudType.includes("Link Used")) return "high";
    if (fraudType.includes("File Size") || fraudType.includes("Approval within")) return "medium";
    return "low";
  };

  const toggleFraudExpansion = () => setExpandedFrauds(!expandedFrauds);
  const visibleFrauds = expandedFrauds ? departmentFrauds : departmentFrauds.slice(0, 4);

  // --- Notifications formatting ---
  const mapNotificationType = (notification: any): "critical" | "warning" | "info" => {
    if (
      notification.title?.toLowerCase().includes("critical") ||
      notification.title?.toLowerCase().includes("breach") ||
      notification.title?.toLowerCase().includes("fraud")
    ) return "critical";
    if (
      notification.title?.toLowerCase().includes("rejected") ||
      notification.title?.toLowerCase().includes("warning")
    ) return "warning";
    return "info";
  };
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  // Only show most recent 5 notifications for sidebar preview
  const sidebarNotifications = notifications.slice(0, 5);

  return (
    <div className="w-80 border-l border-border h-full flex flex-col">
      <ScrollArea className="flex-1 bg-background dark:bg-[#101828] p-4">
        <div className="space-y-6">
          <div className="pb-1 border-b">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Team Insights</h2>
            </div>
          </div>

          {/* FRAUD ALERTS BLOCK */}
          <Card className="border-red-200 bg-red-50/50 dark:bg-red-900/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <CardTitle className="text-sm">Fraud Alerts</CardTitle>
                {!fraudLoading && (departmentFrauds?.length ?? 0) > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {departmentFrauds.length ?? 0}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {fraudLoading ? (
                  [...Array(3)].map((_, i) => (
                    <Card key={i} className="bg-red-100 border-red-200 dark:bg-red-800/30 dark:border-red-800">
                      <CardContent className="p-3">
                        <Skeleton className="h-4 w-full" />
                      </CardContent>
                    </Card>
                  ))
                ) : (departmentFrauds?.length ?? 0) > 0 ? (
                  visibleFrauds.map((fraud) => (
                    <Card
                      key={fraud._id}
                      className={`border-red-200 dark:border-red-800 ${
                        getFraudSeverity(fraud.fraudType) === "high"
                          ? "bg-red-100 dark:bg-red-800/30"
                          : "bg-orange-50 dark:bg-orange-800/20"
                      }`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle
                            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                              getFraudSeverity(fraud.fraudType) === "high"
                                ? "text-red-500"
                                : "text-orange-500"
                            }`}
                          />
                          <div className="flex-1">
                            <p className="text-xs text-red-800 dark:text-red-200 leading-relaxed">
                              {formatFraudAlert(fraud)}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-300">
                                <Clock className="w-3 h-3" />
                                {formatTimeSince(fraud.createdAt)}
                              </div>
                              {fraud.status === "pending" ? (
                                <Badge variant="destructive" className="text-xs">Needs Review</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Reviewed</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                    <CardContent className="p-3">
                      <p className="text-xs text-green-800 dark:text-green-200 leading-relaxed">
                        No fraud alerts detected in your department
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
              {(departmentFrauds?.length ?? 0) > 4 && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1"
                  onClick={toggleFraudExpansion}
                >
                  {expandedFrauds ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      See All Fraud Alerts ({departmentFrauds.length ?? 0})
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* LEADERBOARD PREVIEW */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Leaderboard Preview
                </CardTitle>
                <div className="flex gap-2">
                  <Select value={selectedMonth} onValueChange={handleMonthChange}>
                    <SelectTrigger className="w-[100px] h-8 text-xs">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => {
                        const month = String(i + 1).padStart(2, "0");
                        return (
                          <SelectItem key={month} value={month} className="text-xs">
                            {dayjs(`2023-${month}-01`).format("MMM")}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Select value={selectedYear} onValueChange={handleYearChange}>
                    <SelectTrigger className="w-[80px] h-8 text-xs">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year} className="text-xs">
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {currentMonthData?.monthYear && (
                  <CardDescription className="text-xs">
                    {dayjs(currentMonthData.monthYear).format("MMMM YYYY")}
                  </CardDescription>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {leaderboardLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-6 h-6 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-4 w-8" />
                      </div>
                    ))}
                  </div>
                ) : sidebarLeaderboardData.length > 0 ? (
                  sidebarLeaderboardData.map((user, index) => (
                    <div
                      key={user.userId || index}
                      className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-10">
                        <Badge
                          variant="outline"
                          className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                          {index + 1}
                        </Badge>
                        <span className="text-sm items-center">{user.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {user.value.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No leaderboard data available
                  </div>
                )}
              </div>
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-xs text-blue-600 dark:text-blue-400"
                onClick={() => {
    router.push("/dashboard/dynamic/leaderboard");
  }}
              >
                See Full Leaderboard
              </Button>
            </CardContent>
          </Card>

          {/* NOTIFICATION PREVIEW BLOCK (from API) */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-500" />
                  Notifications
                </CardTitle>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-xs text-muted-foreground"
                  onClick={() => dispatch(fetchNotifications())}
                >
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                {notificationsLoading ? (
                  <div className="text-center py-10 text-muted-foreground">Loading...</div>
                ) : notificationsError ? (
                  <div className="text-center py-4 text-red-500">{notificationsError}</div>
                ) : sidebarNotifications.length > 0 ? (
                  sidebarNotifications.map((notification: any) => {
                    const type = mapNotificationType(notification);
                    return (
                      <Card
                        key={notification._id}
                        className={`
                          relative transition-colors hover:bg-muted/50
                          ${type === "critical" 
                            ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                            : type === "warning"
                              ? "bg-orange-50 border-orange-200 dark:bg-orange-800/20 dark:border-orange-800"
                              : "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                          }
                        `}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            {getNotificationIcon(type)}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium mb-1">{notification.title}</h4>
                              <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(notification.createdAt)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No notifications found
                  </div>
                )}
              </div>
              <Button
                className="w-full"
                size="sm"
                 onClick={() => {
    router.push("/dashboard/dynamic/notification");
  }}
              >
                View All Notifications
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

export default TeamInsightsSidebar;
