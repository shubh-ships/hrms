"use client";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Bell, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import {
  fetchNotifications,
  markNotificationAsRead,
  selectNotifications,
  selectNotificationLoading,
  selectNotificationError,
  selectUnreadCount,
} from "@/features/notifications/notificationSlice";
import { AppDispatch, RootState } from "@/store/index";

interface NotificationCenterProps {
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  activeFilter = "All",
  onFilterChange,
  className = "",
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const notifications = useSelector(selectNotifications);
  const loading = useSelector(selectNotificationLoading);
  const error = useSelector(selectNotificationError);
  const unreadCount = useSelector(selectUnreadCount);

  const [currentFilter, setCurrentFilter] = React.useState(activeFilter);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const mapNotificationType = (
    notification: any
  ): "critical" | "warning" | "info" => {
    if (
      notification.title?.toLowerCase().includes("critical") ||
      notification.title?.toLowerCase().includes("breach") ||
      notification.title?.toLowerCase().includes("fraud")
    ) {
      return "critical";
    }
    if (
      notification.title?.toLowerCase().includes("rejected") ||
      notification.title?.toLowerCase().includes("warning")
    ) {
      return "warning";
    }
    return "info";
  };

  const mapNotificationCategory = (
    notification: any
  ): "critical" | "team" | "reminder" | "general" => {
    const title = notification.title?.toLowerCase() || "";
    if (
      title.includes("critical") ||
      title.includes("breach") ||
      title.includes("fraud")
    ) {
      return "critical";
    }
    if (
      title.includes("rejected") ||
      title.includes("approved") ||
      title.includes("assignment")
    ) {
      return "team";
    }
    if (title.includes("reminder") || title.includes("don't forget")) {
      return "reminder";
    }
    return "general";
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
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  const transformedNotifications = notifications.map((notification) => ({
    id: notification._id,
    title: notification.title,
    description: notification.message,
    time: formatTimeAgo(notification.createdAt),
    type: mapNotificationType(notification),
    category: mapNotificationCategory(notification),
    read: notification.isRead,
    originalNotification: notification,
  }));

  const filteredNotifications = transformedNotifications.filter(
    (notification) => {
      if (currentFilter === "All") return true;
      if (currentFilter === "Critical")
        return notification.category === "critical";
      if (currentFilter === "Team") return notification.category === "team";
      if (currentFilter === "Reminders")
        return notification.category === "reminder";
      return true;
    }
  );

  const filterCounts = {
    All: transformedNotifications.length,
    Critical: transformedNotifications.filter((n) => n.category === "critical")
      .length,
    Team: transformedNotifications.filter((n) => n.category === "team").length,
    Reminders: transformedNotifications.filter((n) => n.category === "reminder")
      .length,
  };

  const filters = [
    { label: "All", count: filterCounts["All"] },
    { label: "Critical", count: filterCounts["Critical"] },
    { label: "Team", count: filterCounts["Team"] },
    { label: "Reminders", count: filterCounts["Reminders"] },
  ];

  const handleFilterChange = (filter: string) => {
    setCurrentFilter(filter);
    onFilterChange?.(filter);
  };

  const handleMarkAsRead = (id: string) => {
    dispatch(markNotificationAsRead(id));
  };

  const handleMarkAllAsRead = () => {
    const unreadNotifications = transformedNotifications.filter((n) => !n.read);
    unreadNotifications.forEach((notification) => {
      dispatch(markNotificationAsRead(notification.id));
    });
  };

  const criticalAlerts = transformedNotifications.filter(
    (n) => n.category === "critical" && !n.read
  ).length;
  const todayNotifications = transformedNotifications.filter((n) => {
    const notificationDate = new Date(n.originalNotification.createdAt);
    const today = new Date();
    return notificationDate.toDateString() === today.toDateString();
  }).length;

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case "critical":
        return {
          badge: "bg-red-500 text-white",
          border:
            "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
          icon: "text-red-500",
        };
      case "warning":
        return {
          badge: "bg-orange-500 text-white",
          border:
            "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30",
          icon: "text-orange-500",
        };
      case "info":
        return {
          badge: "bg-blue-500 text-white",
          border:
            "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30",
          icon: "text-blue-500",
        };
      default:
        return {
          badge: "bg-gray-500 text-white",
          border:
            "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800",
          icon: "text-gray-500",
        };
    }
  };

  const getBadgeText = (type: string) => {
    switch (type) {
      case "critical":
        return "CRITICAL";
      case "warning":
        return "WARNING";
      case "info":
        return "INFO";
      default:
        return "INFO";
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div
        className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 ${className}`}
      >
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 ${className}`}
      >
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">
              Error loading notifications: {error}
            </p>
            <button
              onClick={() => dispatch(fetchNotifications())}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 ${className}`}
    >
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Notification Center
            </h1>
            <button
              onClick={() => dispatch(fetchNotifications())}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Unread Alerts
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {unreadCount}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Critical Alerts
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {criticalAlerts}
                  </p>
                </div>
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Today
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {todayNotifications}
                  </p>
                </div>
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.label}
                  onClick={() => handleFilterChange(filter.label)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentFilter === filter.label
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>

            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0 || loading}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark All As Read
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const style = getNotificationStyle(notification.type);
            return (
              <div
                key={notification.id}
                onClick={() =>
                  !notification.read && handleMarkAsRead(notification.id)
                }
                className={`bg-white dark:bg-gray-800 rounded-lg border p-4 transition-all cursor-pointer ${
                  style.border
                } ${
                  notification.read
                    ? "opacity-60"
                    : "hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0`}
                  >
                    {notification.type === "critical" ? (
                      <AlertTriangle className={`w-5 h-5 ${style.icon}`} />
                    ) : notification.type === "warning" ? (
                      <Bell className={`w-5 h-5 ${style.icon}`} />
                    ) : (
                      <TrendingUp className={`w-5 h-5 ${style.icon}`} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`font-medium text-sm sm:text-base ${
                              notification.read
                                ? "text-gray-500 dark:text-gray-400"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <p
                          className={`text-sm mt-1 leading-relaxed ${
                            notification.read
                              ? "text-gray-400 dark:text-gray-500"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {notification.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {notification.time}
                          </p>
                          {notification.originalNotification.sender && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              From:{" "}
                              {notification.originalNotification.sender.name}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${style.badge}`}
                      >
                        {getBadgeText(notification.type)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredNotifications.length === 0 && !loading && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
              No notifications found
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              {currentFilter === "All"
                ? "You're all caught up!"
                : `No ${currentFilter.toLowerCase()} notifications`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
