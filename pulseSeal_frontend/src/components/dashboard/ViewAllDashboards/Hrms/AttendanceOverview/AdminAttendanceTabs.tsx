"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchUsers } from "@/features/user/userSlice";
import {
  getMonthlyAttendance,
  updateAttendance,
  createAttendance,
  markLogout,
  CreateMannualAttendance,
} from "@/features/attendance/attendanceSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { UserTable } from "./UserTable";
import { AttendanceTable } from "./AttendanceTable";
import { EditAttendanceDialog } from "./EditAttendanceDialog";
import { ManualAttendance } from "./MannualAttendance";

const AdminAttendance: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const allUsers = useAppSelector((state) => state.users.users);
  const attendance = useAppSelector((state) => state.attendance);
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userAttendance, setUserAttendance] = useState<any>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<any>(null);
  const [loginTime, setLoginTime] = useState("");
  const [logoutTime, setLogoutTime] = useState("");
  const [status, setStatus] = useState("PRESENT");
  const [quickMarkDate, setQuickMarkDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState("users");

  const getUserId = useCallback((user: any): string | null => {
    if (!user) return null;
    if (user.user_id?._id) return user.user_id._id;
    return user._id || user.id || null;
  }, []);

  const getUserName = useCallback((user: any): string => {
    if (!user) return "Unknown User";
    if (user.user_id?.name) return user.user_id.name;
    if (user.parentRoleId?.user_id?.name) return user.parentRoleId.user_id.name;
    return user.name || "Unknown User";
  }, []);

  const getUserEmail = useCallback((user: any): string => {
    if (!user) return "No email";
    if (user.user_id?.email) return user.user_id.email;
    if (user.parentRoleId?.user_id?.email)
      return user.parentRoleId.user_id.email;
    return user.email || "No email";
  }, []);

  useEffect(() => {
    if (user?.id && isAdmin) {
      dispatch(fetchUsers());
    }
  }, [user, isAdmin, dispatch]);

  const handleViewAttendance = useCallback(
    async (user: any) => {
      const userId = getUserId(user);
      if (!userId) {
        console.error("No user ID found for user:", user);
        toast.error("Unable to fetch attendance: User ID not found");
        return;
      }

      setSelectedUserId(userId);
      setLoadingAttendance(true);
      setUserAttendance(null);

      try {
        const result = await dispatch(getMonthlyAttendance(userId)).unwrap();
        setUserAttendance(result);
      } catch (error) {
        console.error("Failed to fetch attendance:", error);
        toast.error("Failed to fetch attendance data");
      } finally {
        setLoadingAttendance(false);
      }
    },
    [dispatch, getUserId]
  );

  // Manual attendance handler
  const handleManualAttendance = useCallback(
    async (attendanceData: any) => {
      try {
        await dispatch(CreateMannualAttendance(attendanceData)).unwrap();
        toast.success("Manual attendance marked successfully");

        // Refresh attendance data if the user is currently selected
        if (selectedUserId === attendanceData.userId) {
          const user = allUsers.find(
            (u) => getUserId(u) === attendanceData.userId
          );
          if (user) {
            handleViewAttendance(user);
          }
        }
      } catch (error: any) {
        console.error("Failed to mark manual attendance:", error);
        throw new Error(error.message || "Failed to mark manual attendance");
      }
    },
    [dispatch, selectedUserId, allUsers, getUserId, handleViewAttendance]
  );

  // Quick mark attendance
  const handleQuickMarkAttendance = useCallback(
    async (user: any, specificDate?: Date) => {
      const userId = getUserId(user);
      if (!userId) {
        toast.error("Unable to mark attendance: User ID not found");
        return;
      }

      const dateToUse = specificDate || new Date();

      try {
        await dispatch(
          createAttendance({
            userId: userId,
            loginTime: new Date().toISOString(),
            date: dateToUse.toISOString().split("T")[0],
          })
        ).unwrap();

        toast.success(`Attendance marked for ${getUserName(user)}`);
        if (selectedUserId === userId) {
          handleViewAttendance(user);
        }
      } catch (error: any) {
        console.error("Failed to mark attendance:", error);
        toast.error(error.message || "Failed to mark attendance");
      }
    },
    [dispatch, getUserId, getUserName, selectedUserId, handleViewAttendance]
  );

  // Edit attendance functions
  const handleEditAttendance = useCallback(async () => {
    if (!editingDay || !editingDay.attendanceId) {
      toast.error("No attendance record selected for editing");
      return;
    }

    try {
      const updatePayload = {
        attendanceId: editingDay.attendanceId,
        data: {
          loginTime: loginTime
            ? new Date(
              `${formatDate(editingDay.date)}T${loginTime}:00`
            ).toISOString()
            : editingDay.loginTime,
          logoutTime: logoutTime
            ? new Date(
              `${formatDate(editingDay.date)}T${logoutTime}:00`
            ).toISOString()
            : editingDay.logoutTime,
          status: status || (editingDay.logoutTime ? "PRESENT" : "ABSENT"),
        },
      };

      await dispatch(updateAttendance(updatePayload)).unwrap();
      toast.success("Attendance updated successfully");
      setIsEditDialogOpen(false);
      setEditingDay(null);
      if (selectedUserId) {
        const user = allUsers.find((u) => getUserId(u) === selectedUserId);
        if (user) {
          handleViewAttendance(user);
        }
      }
    } catch (error) {
      console.error("Failed to update attendance:", error);
      toast.error("Failed to update attendance");
    }
  }, [
    dispatch,
    editingDay,
    loginTime,
    logoutTime,
    status,
    selectedUserId,
    allUsers,
    getUserId,
    handleViewAttendance,
  ]);

  const openEditDialog = useCallback((day: any) => {
    if (!day.attendanceId) {
      toast.error("Cannot edit: No attendance record ID found");
      return;
    }

    setEditingDay(day);
    setLoginTime(day.loginTime ? format(new Date(day.loginTime), "HH:mm") : "");
    setLogoutTime(
      day.logoutTime ? format(new Date(day.logoutTime), "HH:mm") : ""
    );
    setStatus(
      day.logoutTime ? "PRESENT" : day.loginTime ? "IN_PROGRESS" : "ABSENT"
    );
    setIsEditDialogOpen(true);
  }, []);

  // Utility functions
  const formatTime = useCallback((timeString?: string | null) => {
    if (!timeString) return "N/A";
    try {
      return format(new Date(timeString), "HH:mm");
    } catch {
      return "Invalid Time";
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    try {
      return format(new Date(dateString), "yyyy-MM-dd");
    } catch {
      return "Invalid Date";
    }
  }, []);

  const exportToCSV = useCallback(() => {
    if (!userAttendance) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Month,Date,Login Time,Logout Time,Status\n";

    userAttendance.forEach((monthData: any) => {
      monthData.days.forEach((day: any) => {
        csvContent += `${monthData.month},${formatDate(day.date)},${formatTime(
          day.loginTime
        )},${formatTime(day.logoutTime)},${day.logoutTime
            ? "Completed"
            : day.loginTime
              ? "In Progress"
              : "Absent"
          }\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `attendance_${getUserName(
        allUsers.find((u) => getUserId(u) === selectedUserId)
      )}_${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [
    userAttendance,
    formatDate,
    formatTime,
    getUserName,
    allUsers,
    getUserId,
    selectedUserId,
  ]);

  const handleMarkLogout = useCallback(
    async (attendanceId: string) => {
      if (!attendanceId) {
        toast.error("No attendance record selected for logout");
        return;
      }

      try {
        await dispatch(markLogout()).unwrap();
        toast.success("Logout marked successfully");
        if (selectedUserId) {
          const user = allUsers.find((u) => getUserId(u) === selectedUserId);
          if (user) {
            handleViewAttendance(user);
          }
        }
      } catch (error) {
        console.error("Failed to mark logout:", error);
        toast.error("Failed to mark logout");
      }
    },
    [dispatch, selectedUserId, allUsers, getUserId, handleViewAttendance]
  );

  if (!isAdmin) {
    return (
      <div
        className="flex justify-center items-center h-64"
        role="alert"
        aria-live="assertive"
      >
        <p className="text-red-600">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <div
      className="container mx-auto p-6 space-y-6"
      role="main"
      aria-label="Admin Attendance Management"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList aria-label="Attendance management sections">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="attendance" disabled={!selectedUserId}>
            Attendance
          </TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              <UserTable
                users={allUsers as any}
                selectedUserId={selectedUserId}
                loadingAttendance={loadingAttendance}
                onViewAttendance={(user) => {
                  handleViewAttendance(user);
                  setActiveTab("attendance");
                }}
                // @ts-ignore: onQuickMarkAttendance is not declared on UserTableProps; add to props interface if preferred
                onQuickMarkAttendance={handleQuickMarkAttendance}
                quickMarkDate={quickMarkDate}
                onSetQuickMarkDate={setQuickMarkDate}
                getUserId={getUserId}
                getUserName={getUserName}
                getUserEmail={getUserEmail}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          {selectedUserId && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  Attendance for{" "}
                  {getUserName(
                    allUsers.find((u) => getUserId(u) === selectedUserId)
                  )}
                </CardTitle>
                <Button
                  variant="outline"
                  onClick={exportToCSV}
                  aria-label="Export attendance data to CSV"
                >
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </CardHeader>
              <CardContent>
                <AttendanceTable
                  attendanceData={userAttendance}
                  loading={loadingAttendance}
                  onEditAttendance={openEditDialog}
                  onMarkLogout={handleMarkLogout}
                  formatDate={formatDate}
                  formatTime={formatTime}
                  userName={getUserName(
                    allUsers.find((u) => getUserId(u) === selectedUserId)
                  )}
                  onGoBack={() => setActiveTab("users")}
                  onExport={exportToCSV}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Manual Entry Tab */}
        <TabsContent value="manual">
          <ManualAttendance
            users={allUsers}
            onMarkManualAttendance={handleManualAttendance}
            getUserId={getUserId}
            getUserName={getUserName}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Attendance Dialog */}
      <EditAttendanceDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingDay={editingDay}
        loginTime={loginTime}
        onLoginTimeChange={setLoginTime}
        logoutTime={logoutTime}
        onLogoutTimeChange={setLogoutTime}
        status={status}
        onStatusChange={setStatus}
        onSaveChanges={handleEditAttendance}
        formatDate={formatDate}
      />

      {attendance.error && (
        <div
          className="mt-4 p-4 bg-red-100 text-red-700 rounded-md"
          role="alert"
          aria-live="assertive"
        >
          {attendance.error}
        </div>
      )}
    </div>
  );
};

export default AdminAttendance;
