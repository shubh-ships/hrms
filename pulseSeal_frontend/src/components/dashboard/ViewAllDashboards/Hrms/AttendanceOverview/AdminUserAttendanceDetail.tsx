"use client";
import React, { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  getMonthlyAttendance,
  updateAttendance,
  markLogout,
} from "@/features/attendance/attendanceSlice";
import { fetchUsers } from "@/features/user/userSlice";
import { format } from "date-fns";
import { toast } from "sonner";
import { AttendanceTable } from "./AttendanceTable";
import { EditAttendanceDialog } from "./EditAttendanceDialog";
import { useRouter } from "next/navigation";

interface AttendanceDay {
  attendanceId: string;
  date: string;
  loginTime?: string;
  logoutTime?: string;
  sealTime?: string | null;
}

interface MonthlyAttendance {
  month: string;
  totalDays: number;
  days: AttendanceDay[];
}

export default function AdminUserAttendanceDetail({ userId }: { userId: string }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  const allUsers = useAppSelector((state) => state.users.users);
  const attendanceError = useAppSelector((state) => state.attendance.error);

  const [userAttendance, setUserAttendance] = useState<MonthlyAttendance[] | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<any>(null);
  const [loginTime, setLoginTime] = useState("");
  const [logoutTime, setLogoutTime] = useState("");
  const [status, setStatus] = useState("PRESENT");

  useEffect(() => {
    if (allUsers.length === 0) {
      dispatch(fetchUsers());
    }
  }, [allUsers.length, dispatch]);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoadingAttendance(true);
      try {
        const result = await dispatch(getMonthlyAttendance(userId)).unwrap();
        setUserAttendance(result);
      } catch (error) {
        console.error("Failed to fetch attendance:", error);
        toast.error("Failed to fetch attendance data");
      } finally {
        setLoadingAttendance(false);
      }
    };
    
    if (userId) {
      fetchAttendance();
    }
  }, [userId, dispatch]);

  const getUserId = (user: any): string | null => {
    if (!user) return null;
    if (user.user_id?._id) return user.user_id._id;
    return user._id || user.id || null;
  };

  const getUserName = (user: any): string => {
    if (!user) return "Unknown User";
    if (user.user_id?.name) return user.user_id.name;
    if (user.parentRoleId?.user_id?.name) return user.parentRoleId.user_id.name;
    return user.name || "Unknown User";
  };

  const currentUser = allUsers.find((u) => getUserId(u) === userId);
  const userName = getUserName(currentUser);

  const formatTime = (timeString?: string | null) => {
    if (!timeString) return "N/A";
    try {
      return format(new Date(timeString), "HH:mm");
    } catch {
      return "Invalid Time";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "yyyy-MM-dd");
    } catch {
      return "Invalid Date";
    }
  };

  const exportToCSV = () => {
    if (!userAttendance) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Month,Date,Login Time,Logout Time,Status\n";

    userAttendance.forEach((monthData: any) => {
      monthData.days.forEach((day: any) => {
        csvContent += `${monthData.month},${formatDate(day.date)},${formatTime(
          day.loginTime
        )},${formatTime(day.logoutTime)},${
          day.logoutTime
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
      `attendance_${userName}_${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMarkLogout = async (attendanceId: string) => {
    if (!attendanceId) {
      toast.error("No attendance record selected for logout");
      return;
    }

    try {
      await dispatch(markLogout()).unwrap();
      toast.success("Logout marked successfully");
      // Refresh
      const result = await dispatch(getMonthlyAttendance(userId)).unwrap();
      setUserAttendance(result);
    } catch (error) {
      console.error("Failed to mark logout:", error);
      toast.error("Failed to mark logout");
    }
  };

  const handleEditAttendance = async () => {
    if (!editingDay || !editingDay.attendanceId) {
      toast.error("No attendance record selected for editing");
      return;
    }

    try {
      const updatePayload = {
        attendanceId: editingDay.attendanceId,
        data: {
          loginTime: loginTime
            ? new Date(`${formatDate(editingDay.date)}T${loginTime}:00`).toISOString()
            : editingDay.loginTime,
          logoutTime: logoutTime
            ? new Date(`${formatDate(editingDay.date)}T${logoutTime}:00`).toISOString()
            : editingDay.logoutTime,
          status: status || (editingDay.logoutTime ? "PRESENT" : "ABSENT"),
        },
      };

      await dispatch(updateAttendance(updatePayload)).unwrap();
      toast.success("Attendance updated successfully");
      setIsEditDialogOpen(false);
      setEditingDay(null);
      // Refresh
      const result = await dispatch(getMonthlyAttendance(userId)).unwrap();
      setUserAttendance(result);
    } catch (error) {
      console.error("Failed to update attendance:", error);
      toast.error("Failed to update attendance");
    }
  };

  const handleDirectAbsent = async (day: any) => {
    try {
      const updatePayload = {
        attendanceId: day.attendanceId,
        data: {
          status: "ABSENT",
          loginTime: null,
          logoutTime: null,
        },
      };
      await dispatch(updateAttendance(updatePayload as any)).unwrap();
      toast.success("Marked as Absent successfully");
      const result = await dispatch(getMonthlyAttendance(userId)).unwrap();
      setUserAttendance(result);
    } catch (error) {
      console.error("Failed to mark absent:", error);
      toast.error("Failed to mark absent");
    }
  };

  const openEditDialog = (day: any) => {
    if (!day.attendanceId) {
      toast.error("Cannot edit: No attendance record ID found");
      return;
    }

    if (day._markAbsentMode) {
      handleDirectAbsent(day);
      return;
    }

    setEditingDay(day);
    setLoginTime(day.loginTime ? format(new Date(day.loginTime), "HH:mm") : "");
    setLogoutTime(day.logoutTime ? format(new Date(day.logoutTime), "HH:mm") : "");
    setStatus(day.logoutTime ? "PRESENT" : day.loginTime ? "IN_PROGRESS" : "ABSENT");
    setIsEditDialogOpen(true);
  };

  return (
    <div className="p-6 h-full bg-[#f8fafc] min-h-screen">
      <AttendanceTable
        attendanceData={userAttendance}
        loading={loadingAttendance}
        onEditAttendance={openEditDialog}
        onMarkLogout={handleMarkLogout}
        formatDate={formatDate}
        formatTime={formatTime}
        userName={userName}
        onGoBack={() => router.push("/dashboard/admin/attendance")}
        onExport={exportToCSV}
      />

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

      {attendanceError && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
          {attendanceError}
        </div>
      )}
    </div>
  );
}
