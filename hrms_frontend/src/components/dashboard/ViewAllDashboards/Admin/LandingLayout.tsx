"use client";

import React, { useState, useMemo, useEffect } from "react";
import { format, subDays, addDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  LayoutGrid,
  ShieldCheck,
  Activity,
  Users,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileX,
  UserCheck,
  Building2,
  Trophy,
  ClipboardList,
  Target,
  CircleAlert,
  CalendarDays,
  CircleCheck,
  UserPlus,
  AlignLeft,
  ScanSearch,
  ChartLine,
  Layers,
  Hourglass,
  ShieldAlert,
  Flag,
  Crown,
  LogIn,
  LogOut,
  ChartNoAxesColumn,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import axiosClient from "@/lib/api/client";

import {
  fetchTaskAssignments,
  selectAllTaskAssignments,
} from "@/features/taskAssignments/taskAssignmentSlice";
import {
  listAllFrauds,
  selectAllFrauds,
  getWeeklyFraudSummary,
  selectWeeklySummary,
} from "@/features/fraud1/fraudSlice1";
import {
  fetchDashboardSummary,
  selectDashboardSummary,
} from "@/features/dailyAttendance/dailyAttendanceSlice";
import {
  fetchDepartments,
  selectDepartments,
} from "@/features/departments/departmentSlice";
import {
  fetchUsers,
  selectUsers,
} from "@/features/user/userSlice";
import {
  getAdminUsers,
  selectAdmins,
} from "@/features/newUser/newUserSlice";
import { getOrgIdFromToken } from "@/lib/authHelpers";
import { formatDateToYYYYMMDD } from "@/lib/utils";

export default function AdminDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const assignments = useAppSelector(selectAllTaskAssignments);
  const frauds = useAppSelector(selectAllFrauds);
  const dashSummary = useAppSelector(selectDashboardSummary);
  const departments = useAppSelector(selectDepartments);
  const weeklyFraudSummary = useAppSelector(selectWeeklySummary);
  const users = useAppSelector(selectUsers);
  const admins = useAppSelector(selectAdmins);

  const [attendanceDate, setAttendanceDate] = useState<Date>(new Date());
  const [todayDashSummary, setTodayDashSummary] = useState<any>(null);

  useEffect(() => {
    const fetchTodaySummary = async () => {
      const todayStr = formatDateToYYYYMMDD(new Date());
      try {
        const response = await axiosClient.get(`/newAttendance/summary/date/${todayStr}`);
        if (response.data?.success && response.data?.data) {
          setTodayDashSummary(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch today's summary:", error);
      }
    };
    fetchTodaySummary();
  }, []);

  useEffect(() => {
    dispatch(fetchTaskAssignments());
    dispatch(fetchDepartments({ limit: 4 }));
    dispatch(getWeeklyFraudSummary());
    dispatch(fetchUsers());
    dispatch(getAdminUsers());
    const orgId = getOrgIdFromToken();
    if (orgId) {
      dispatch(listAllFrauds(orgId));
    }
  }, [dispatch]);

  const userStats = useMemo(() => {
    // Deduplicate by User document ID or Email to count unique people
    const personMap = new Map();

    // Process Regular Users
    (users || []).forEach(u => {
      const userData = u.user_id;
      if (userData && (userData.name || userData.email)) {
        // Use ID first, then Email as fallback/alias
        const key = userData._id || userData.id || userData.email;
        if (key && !personMap.has(key)) {
          personMap.set(key, { is_active: !!userData.isActive });
        }
      }
    });

    // Process Admins
    (admins || []).forEach(a => {
      if (a && (a.name || a.email)) {
        const key = a._id || a.id || a.email;
        // If an admin is already in the map (as a staff member), 
        // the map keeps them as 1 unique person.
        if (key && !personMap.has(key)) {
          personMap.set(key, { is_active: a.isActive !== false });
        }
      }
    });

    const uniquePeople = Array.from(personMap.values());

    return {
      total: uniquePeople.length,
      active: uniquePeople.filter(p => p.is_active).length
    };
  }, [users, admins]);

  const adminList = useMemo(() => {
    return (admins || [])
      .map(admin => ({
        id: admin._id || admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phoneNumber || "N/A",
        status: admin.isActive === false ? "Inactive" : "Active"
      }));
  }, [admins]);

  useEffect(() => {
    const dateStr = formatDateToYYYYMMDD(attendanceDate);
    dispatch(fetchDashboardSummary(dateStr));
  }, [dispatch, attendanceDate]);

  const taskStats = useMemo(() => ({
    completed: assignments.filter((t) => t.timer_status === "Done").length,
    inProgress: assignments.filter((t) => t.timer_status === "InProgress").length,
    pending: assignments.filter((t) => t.timer_status === "Todo").length,
    overdue: assignments.filter((t) => t.status === "Overdue" || (t.deadline && new Date(t.deadline) < new Date() && t.status !== "Completed")).length,
    fraud: frauds.length,
  }), [assignments, frauds]);

  const attendanceStats = useMemo(() => {
    return {
      login: dashSummary?.punchedIn ?? 0,
      logout: dashSummary?.punchedOut ?? 0,
      inProgress: dashSummary?.present ?? 0,
      completed: dashSummary?.punchedOut ?? 0 // Assuming completed means punched out for the overview
    };
  }, [dashSummary]);

  const monthNames = useMemo(() => [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ], []);

  const flagMonths = useMemo(() => {
    const months = [];
    const date = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      months.push({ value: label, label });
    }
    return months;
  }, [monthNames]);

  const [selectedFlagMonth, setSelectedFlagMonth] = useState(flagMonths[0].value);

  const filteredFraudsByMonth = useMemo(() => {
    return frauds.filter((f) => {
      const date = new Date(f.createdAt);
      const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      return label === selectedFlagMonth;
    });
  }, [frauds, selectedFlagMonth, monthNames]);

  const handlePrevDay = () => setAttendanceDate(prev => subDays(prev, 1));
  const handleNextDay = () => setAttendanceDate(prev => addDays(prev, 1));
  return (
    <div className="p-[40px] flex flex-col gap-10 min-h-screen text-[#1E293B]">
      {/* Row 1 */}
      <div className="flex gap-6">
        {/* Actions Section */}
        <Card className="w-[406px] h-[360px] bg-white border-0 shadow-sm overflow-hidden gap-0 py-0">
          <div>
            <div className="flex items-center m-[20px] gap-[16px] h-[36px] w-[113px]">
              <div className="w-[36px] h-[36px] rounded-[8px] bg-[#DCFCE7] flex items-center justify-center shrink-0">
                <AlignLeft className="text-[#22C55E] w-[16px] h-[16px]" />
              </div>
              <h3 className="text-[16px] font-medium text-[#1F2937]">Actions</h3>
            </div>
          </div>
          <div className="border-b border-[#B1B1B1] w-full" />

          <CardContent className="p-0 flex flex-col">
            <ActionItem
              icon={<ScanSearch className="text-[#EC6D31] w-[16px] h-[16px]" />}
              bg="bg-[#FDE6DA]"
              title="Fraud Detection"
              desc={`Total ${frauds.length} Fraud Detected`}
              showBorder={true}
              onClick={() => router.push("/dashboard/admin/fraud_detection")}
            />
            <ActionItem
              icon={<ChartLine className="text-[#551FF8] w-[16px] h-[16px]" />}
              bg="bg-[#E2D3FF]"
              title="Pulse Analytics"
              desc="Advanced analytics and insights will be available here"
              showBorder={true}
              onClick={() => router.push("/dashboard/admin/pulse_analytics")}
            />
            <ActionItem
              icon={<Users className="text-[#3B82F6] w-[16px] h-[16px]" />}
              bg="bg-[#DBEAFE]"
              title="User Overview"
              desc="View and manage all users and administrators"
              showBorder={false}
              onClick={() => router.push("/dashboard/admin/user_admin_overview")}
            />
          </CardContent>
        </Card>

        {/* Stack: Attendance + Total Tasks */}
        <div className="flex flex-col gap-6 w-[549px]">
          {/* Attendance Overview */}
          <Card className="h-[151px] bg-white border-0 p-0 gap-0 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center p-[20px]">
              <div className="flex items-center gap-[16px]">
                <div className="w-[36px] h-[36px] rounded-[8px] bg-[#DCDDFD] flex items-center justify-center">
                  <User className="text-[#6366F1] w-[16px] h-[16px]" />
                </div>
                <h3
                  className="text-[16px] font-medium text-[#1F2937] flex items-center gap-1 cursor-pointer"
                  onClick={() => router.push("/dashboard/admin/attendance_overview")}
                >
                  Attendance Overview <ChevronRight className="w-5 h-5 mt-1 text-[#4B5563] group-hover:translate-x-1 transition-transform" />
                </h3>
              </div>
              <div className="flex items-center justify-center h-[28px] px-1 border border-[#E5E7EB] rounded-[8px] text-[10px] text-[#4B5563] bg-[#F9FAFB] shadow-sm min-w-[140px]">
                <button onClick={handlePrevDay} className="p-1 hover:bg-gray-200/50 rounded-md transition-colors">
                  <ChevronLeft className="w-3 h-3" />
                </button>

                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1.5 font-medium hover:bg-gray-200/50 px-1.5 h-[22px] rounded-md transition-colors">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>{format(attendanceDate, "dd MMM yyyy")}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white border-none shadow-md rounded-lg" align="center">
                    <CalendarComponent
                      mode="single"
                      selected={attendanceDate}
                      onSelect={(date) => date && setAttendanceDate(date)}
                      initialFocus
                      className="scale-90 origin-top"
                    />
                  </PopoverContent>
                </Popover>

                <button onClick={handleNextDay} className="p-1 hover:bg-gray-200/50 rounded-md transition-colors">
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="border-b border-[#B1B1B1] w-full" />
            <div className="flex justify-between items-center p-[20px] pr-[60px]">
              <StatItem label="Login" value={attendanceStats.login.toString()} />
              <StatItem label="Logout" value={attendanceStats.logout.toString()} />
              <StatItem label="In progress" value={attendanceStats.inProgress.toString()} />
              <StatItem label="Completed" value={attendanceStats.completed.toString()} />
            </div>
          </Card>

          {/* Total Tasks */}
          <Card className="h-[189px] bg-white border-0 gap-0 shadow-sm p-0">
            <div className="flex items-center gap-[16px] p-[20px]">
              <div className="w-[36px] h-[36px] rounded-[8px] bg-[#DBEAFE] flex items-center justify-center">
                <Layers className="text-[#3B82F6] w-[16px] h-[16px]" />
              </div>
              <h3 className="font-medium text-[#1F2937] text-[16px]">Total Tasks</h3>
            </div>
            <div className="border-b border-[#B1B1B1] w-full" />
            <div className="flex justify-between items-center p-[20px] px-[20px]">
              <TaskBox
                icon={<CircleCheck className="text-[#22C55E] w-[18px] h-[18px]" />}
                value={taskStats.completed.toString()}
                label="Completed"
              />
              <TaskBox
                icon={<Clock className="text-[#3B82F6] w-[18px] h-[18px]" />}
                value={taskStats.inProgress.toString()}
                label="In Progress"
              />
              <TaskBox
                icon={<Hourglass className="text-[#EAB308] w-[18px] h-[18px]" />}
                value={taskStats.pending.toString()}
                label="Pending"
              />
              <TaskBox
                icon={<ShieldAlert className="text-[#F97316] w-[18px] h-[18px]" />}
                value={taskStats.overdue.toString()}
                label="Overdue"
              />
              <TaskBox
                icon={<AlertTriangle className="text-[#EF4444] w-[18px] h-[18px]" />}
                value={taskStats.fraud.toString()}
                label="Fraud"
              />
            </div>
          </Card>
        </div>

        {/* Flags Section */}
        <Card className="w-[332px] h-[360px] bg-white border-0  gap-0 shadow-sm p-0">
          <div className="flex justify-between items-center p-[20px]">
            <div className="flex items-center gap-3">
              <div className="w-[36px] h-[36px] rounded-lg bg-[#FFE1AE] flex items-center justify-center">
                <Flag className="text-[#F59E0B] w-[16px] h-[16px]" />
              </div>
              <h3 className="font-medium text-[#1F2937] text-[16px]">Flags</h3>
            </div>
            <Select value={selectedFlagMonth} onValueChange={setSelectedFlagMonth}>
              <SelectTrigger className="w-[100px] h-[30px] text-[12px] font-medium border rounded gap-1 text-[#3F5A54] bg-transparent focus:ring-0">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {flagMonths.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="text-[12px]">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="border-b border-[#B1B1B1] w-full" />
          <div className="flex flex-col gap-[12px] p-[20px]">
            <FlagRow
              icon={<Flag className="w-[16px] h-[16px] text-[#3D3D3D]" />}
              label="Total Flags"
              value={filteredFraudsByMonth.length.toString()}
              bg="bg-[#00000014]"
              textColor="text-[#3D3D3D]"
            />
            <FlagRow
              icon={<Flag className="w-[16px] h-[16px] text-[#22C55E]" />}
              label="Green Flags"
              value={filteredFraudsByMonth.filter(f => f.status === "Clean").length.toString()}
              bg="bg-[#DCFCE7]"
              textColor="text-[#22C55E]"
            />
            <FlagRow
              icon={<Flag className="w-[16px] h-[16px] text-[#FACC15]" />}
              label="Yellow Flags"
              value={filteredFraudsByMonth.filter(f => f.status === "Suspicious").length.toString()}
              bg="bg-[#FEF3C7]"
              textColor="text-[#FACC15]"
            />
            <FlagRow
              icon={<Flag className="w-[16px] h-[16px] text-[#EF4444]" />}
              label="Red Flags"
              value={filteredFraudsByMonth.filter(f => f.status === "Flagged").length.toString()}
              bg="bg-[#FEE2E2]"
              textColor="text-[#EF4444]"
            />
          </div>
        </Card>
      </div>

      {/* Row 2 */}
      <div className="flex gap-6">
        {/* Regular Users */}
        <Card className="w-[328px] h-[191px] bg-white border-0 gap-0 shadow-sm p-0">
          <h3 className="font-medium text-[16px] text-[#1F2937] p-[20px]">Regular Users</h3>
          <div className="border-b border-[#B1B1B1] w-full" />
          <div className="flex justify-between items-center p-[20px]">
            <div className="bg-[#DCFCE7] h-[87px] w-[130px] p-[12px] rounded-lg flex flex-col gap-1">
              <Users className="text-[#22C55E] w-[20px] h-[20px] mb-1" />
              <span className="text-[14px] font-medium text-[#22C55E]">{userStats.total}</span>
              <span className="text-[10px] text-[#1F2937]">Total Users</span>
            </div>
            <div className="bg-[#DBEAFE] h-[87px] w-[130px] p-[12px] rounded-lg flex flex-col gap-1">
              <UserCheck className="text-[#3B82F6] w-[20px] h-[20px] mb-1" />
              <span className="text-[14px] font-medium text-[#3B82F6]">{userStats.active}</span>
              <span className="text-[10px] text-[#1F2937]">Active Users</span>
            </div>
          </div>
        </Card>

        {/* Daily Log */}
        <Card className="w-[328px] h-[191px] bg-white border-0 shadow-sm p-0 gap-0">
          <div className="flex justify-between items-center p-[20px]">
            <h3 className="font-medium text-[16px] text-[#1F2937]">Daily Log</h3>
            <span className="text-[10px] font-medium text-[#4B5563] bg-[#F0F0F0B2] h-[19px] px-2 rounded-[4px] flex items-center justify-center">
              {format(new Date(), "dd MMM, yyyy")}
            </span>
          </div>
          <div className="border-b border-[#B1B1B1] w-full" />
          <div className="flex justify-between items-center p-[20px]">
            <div className="bg-[#ECFDF5] h-[87px] w-[130px] p-[12px] rounded-lg flex flex-col gap-1">
              <LogIn className="text-[#10B981] w-[16px] h-[16px] mb-1" />
              <span className="text-[14px] font-medium text-[#22C55E]">
                {todayDashSummary?.punchSummary?.punchIn ?? 0}
              </span>
              <span className="text-[10px] text-[#1F2937]">Total Login</span>
            </div>
            <div className="bg-[#DBEAFE] h-[87px] w-[130px] p-[12px] rounded-lg flex flex-col gap-1">
              <LogOut className="text-[#3B82F6] w-[16px] h-[16px] mb-1 rotate-180" />
              <span className="text-[14px] font-medium text-[#3B82F6]">
                {todayDashSummary?.punchSummary?.punchOut ?? 0}
              </span>
              <span className="text-[10px] text-[#1F2937]">Total Logout</span>
            </div>
          </div>
        </Card>

        {/* Admins */}
        <Card className="w-[626px] h-[191px] bg-white border-0 shadow-sm p-0 gap-0 flex flex-col">
          <div className="p-[20px] border-b border-[#B1B1B1] flex items-center justify-between">
            <h3 className="font-medium text-[16px] text-[#1F2937]">Admins</h3>
            <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{adminList.length} Total</span>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left relative">
              <thead className="bg-[#F0F0F099] h-[39px] text-[#4B5563] text-[10px] font-medium border-b border-[#B1B1B1] sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-[20px] py-[10px]">Name</th>
                  <th className="px-[20px] py-[10px]">Email</th>
                  <th className="px-[20px] py-[10px]">Phone</th>
                  <th className="px-[20px] py-[10px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[12px]">
                {adminList && adminList.length > 0 ? (
                  adminList.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50 transition">
                      <td className="px-[20px] py-[10px]">
                        <div className="flex items-center gap-2">
                          <Crown className="w-3 h-3 text-[#D4AF37]" /> {admin.name}
                        </div>
                      </td>
                      <td className="px-[20px] py-[10px] text-gray-500">{admin.email}</td>
                      <td className="px-[20px] py-[10px] text-gray-500">{admin.phone}</td>
                      <td className="px-[20px] py-[10px]">
                        <span className={cn(
                          "px-2 py-0.5 rounded-[10px] text-[10px]",
                          admin.status === "Active" ? "bg-[#ECFDF5] text-[#10B981]" : "bg-red-50 text-red-500"
                        )}>
                          {admin.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-4 text-center text-gray-400">No admins found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Row 3 */}
      <div className="flex gap-6">
        {/* Departments */}
        <Card className="w-[328px] h-[360px] bg-white border-0 shadow-sm p-0 gap-0">
          <div className="flex items-center gap-3 p-[20px]">
            <div className="w-[36px] h-[36px] rounded-lg bg-[#F3F4F6] flex items-center justify-center">
              <Building2 className="text-[#6B7280] w-[16px] h-[16px]" />
            </div>
            <h3 className="font-medium text-[16px] text-[#1F2937]">Departments</h3>
          </div>
          <div className="border-b border-[#B1B1B1] w-full" />
          <div className="flex flex-col gap-[12px] p-[20px]">
            <DeptRow 
              icon={<Building2 className="text-[#3B82F6] w-4 h-4" />} 
              bg="bg-[#DBEAFE]" 
              label="Total" 
              count={departments.length.toString()} 
              textColor="text-[#3B82F6]" 
            />
            <DeptRow 
              icon={<CheckCircle2 className="text-[#22C55E] w-4 h-4" />} 
              bg="bg-[#ECFDF5]" 
              label="Active" 
              count={departments.filter(d => d.is_active).length.toString()} 
              textColor="text-[#22C55E]" 
            />
            <DeptRow 
              icon={<Hourglass className="text-[#FACC15] w-4 h-4" />} 
              bg="bg-[#FEF3C7]" 
              label="Pending" 
              count={departments.filter(d => !d.is_verified).length.toString()} 
              textColor="text-[#FACC15]" 
            />
          </div>
        </Card>

        {/* Leaderboard */}
        <Card className="w-[328px] h-[360px] bg-white border-0 shadow-sm p-0 gap-0">
          <div className="flex items-center gap-3 p-[20px]">
            <div className="w-[36px] h-[36px] rounded-lg bg-blue-50 flex items-center justify-center">
              <ChartNoAxesColumn className="text-blue-500 w-[16px] h-[16px]" />
            </div>
            <h3 className="font-medium text-[16px] text-[#1F2937]">Leaderboard</h3>
          </div>
          <div className="border-b border-[#B1B1B1] w-full" />
          <div className="flex flex-col gap-[12px] p-[20px]">
            {departments && departments.length > 0 ? (
              departments
                .filter(d => d.is_active)
                .slice(0, 4)
                .map((dept, idx) => (
                  <LeaderItem
                    key={dept._id}
                    icon={
                      idx === 0 ? <Crown className="text-[#D4AF37] w-4 h-4" /> :
                        idx < 3 ? <Trophy className="text-[#9CA3AF] w-4 h-4" /> :
                          <Building2 className="text-[#9CA3AF] w-4 h-4" />
                    }
                    label={dept.name}
                    onClick={() => router.push(`/dashboard/admin/leaderboard?dept=${encodeURIComponent(dept.name)}&deptId=${dept._id}`)}
                  />
                ))
            ) : (
              <div className="flex flex-col gap-4 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-[52px] bg-gray-50 rounded-[10px]" />
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Weekly Summary */}
        <Card className="w-[626px] h-[360px] bg-white border-0 shadow-sm p-0 flex flex-col gap-0 border-b-none">
          <div className="p-[20px] flex items-center justify-between">
            <div className="flex items-center gap-[16px]">
              <div className="w-[36px] h-[36px] rounded-lg bg-[#F5E6FF] flex items-center justify-center">
                <Activity className="text-[#9900FF] w-[16px] h-[16px]" />
              </div>
              <h3 className="font-medium text-[16px] text-[#1F2937]">Weekly Summary</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-[14px] text-[#4B5563] font-medium border-[#3F5A54] rounded-[8px] h-[30px] w-[146px] bg-white hover:bg-gray-50"
              onClick={() => router.push("/dashboard/admin/weekly_summary")}
            >
              View full Report
            </Button>
          </div>
          <div className="border-b border-[#B1B1B1] w-full" />
          <div className="flex flex-col flex-1 p-[20px] gap-[12px] overflow-auto">
            <SummaryRow
              label="Approval within 30 seconds"
              cases={`${weeklyFraudSummary?.["Approval within 30 seconds"] || 0} Cases`}
            />
            <SummaryRow
              label="Blank File Uploads"
              cases={`${weeklyFraudSummary?.["Blank File Uploads"] || 0} Cases`}
            />
            <SummaryRow
              label="File Size Issues"
              cases={`${weeklyFraudSummary?.["File Size Issues"] || 0} Cases`}
            />
            <SummaryRow
              label="Duplicate Links"
              cases={`${weeklyFraudSummary?.["Link Used"] || 0} Cases`}
            />
            <SummaryRow
              label="Manual Frauds"
              cases={`${weeklyFraudSummary?.["Manual Frauds"] || 0} Cases`}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function ActionItem({ icon, bg, title, desc, showBorder, onClick }: { icon: React.ReactNode, bg: string, title: string, desc: string, showBorder?: boolean, onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-[16px] px-[20px] py-[14px] transition cursor-pointer group hover:bg-gray-50",
        showBorder && "border-b border-[#E5E7EB]"
      )}>
      <div className={cn("rounded-[8px] flex items-center justify-center shrink-0 w-[36px] h-[36px]", bg)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[16px] font-medium text-[#4B5563] truncate leading-tight">{title}</h4>
        <p className="text-[10px] font-normal text-[#4B5563] truncate mt-1">{desc}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-[#4B5563] group-hover:text-gray-700 transition" />
    </div>
  );
}

function StatItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col p-1">
      <span className="text-[12px] text-[#4B5563] font-regular">{label}</span>
      <span className="text-[12px] font-medium">{value}</span>
    </div>
  );
}

function TaskBox({ icon, value, label }: { icon: React.ReactNode, value: string, label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 w-[71px] h-[73px] rounded-[8px] bg-[#F0F0F080] border-0">
      <div className="mb-0.5">
        {icon}
      </div>
      <span className="text-[10px] font-medium text-[#000000] leading-none mt-1">{value}</span>
      <span className="text-[10px] font-normal text-[#9CA3AF] leading-none mt-1 text-center whitespace-nowrap">{label}</span>
    </div>
  );
}

function FlagRow({ icon, label, value, bg, textColor }: { icon: React.ReactNode, label: string, value: string, bg: string, textColor: string }) {
  return (
    <div className="flex items-center justify-between px-3 w-full h-[52px] rounded-[10px] bg-[#FBFBFB]">
      <div className="flex items-center gap-3">
        <div className={cn("w-[36px] h-[36px] rounded-lg flex items-center justify-center", bg)}>
          {icon}
        </div>
        <span className="text-[10px] font-medium text-[#4B5563]">{label}</span>
      </div>
      <span className={cn("text-[14px] font-bold", textColor)}>{value}</span>
    </div>
  );
}

function DeptRow({ icon, bg, label, count, textColor }: { icon: React.ReactNode, bg: string, label: string, count: string, textColor: string }) {
  return (
    <div className="flex items-center justify-between px-3 w-full h-[52px] rounded-[10px] bg-[#FBFBFB]">
      <div className="flex items-center gap-3">
        <div className={cn("w-[36px] h-[36px] rounded-[4px] flex items-center justify-center", bg)}>
          {icon}
        </div>
        <span className="text-[10px] font-medium text-[#000000]">{label}</span>
      </div>
      <span className={cn("text-[14px] font-bold", textColor)}>{count}</span>
    </div>
  );
}

function LeaderItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <div className="flex items-center justify-between px-3 w-full h-[52px] rounded-[10px] bg-[#FBFBFB]">
      <div className="flex items-center gap-3">
        <div className="w-[36px] h-[36px] rounded-[4px] bg-[#F3F4F6] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <span className="text-[10px] font-medium text-[#000000] truncate max-w-[150px]">{label}</span>
      </div>
      <span
        className="text-[14px] text-[#3F5A54] cursor-pointer font-medium hover:text-[#1E293B]"
        onClick={onClick}
      >
        View
      </span>
    </div>
  );
}

function SummaryRow({ label, cases }: { label: string, cases: string }) {
  return (
    <div className="flex items-center justify-between pl-[12px] pr-[30px] w-full h-[52px] rounded-[10px] bg-[#FBFBFB]">
      <span className="text-[10px] font-medium text-[#000000]">{label}</span>
      <div className="flex items-center gap-18">
        <span className={cn(
          "text-[10px] text-white px-3 py-1 rounded-full w-[65px] h-[19px] flex items-center justify-center",
          cases === '0 Cases' ? 'bg-orange-500' : 'bg-[#EF4444]'
        )}>
          {cases}
        </span>
        <span className="text-[14px] text-[#3F5A54] cursor-pointer font-medium">View</span>
      </div>
    </div>
  );
}
