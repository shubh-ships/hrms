import {
  ChartPie,
  UserRoundCog,
  ListChecks,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  Settings,
  Trophy,
  Bell,
  ClipboardCheck,
  Users,
  LayoutGrid,
  ChartNoAxesColumnIncreasing,
  ChartNoAxesColumn,
  CircleCheckBig,
  ListX,
  ListOrdered,
  SquareKanban,
  CalendarDays,
  BookCheck,
  Building2,
  ShieldUser,
  GitPullRequest,
  UserCheck,
  Clock,
  FileText,
  UserCog,
  Briefcase,
  HandCoins,
  Banknote,
  ShieldCheck,
  Wallet,
  IndianRupee,
  ReceiptIndianRupee,
  BadgeIndianRupee,
  Landmark,
  Coins,
  ListCheck,
  AlertCircle,
  FileCheck,
  CalendarCheck,
  CalendarClock,
  ScrollText,
  ClipboardPlus,
  CalendarCheck2,
  CalendarPlus,
  ChartScatter,
  ClipboardEdit,
  Slice,
  CreditCard,
  PiggyBank,
  UserRoundPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { file } from "zod";

export type Role = "admin" | "super_admin";
export type TabType = "task" | "hrms";

export const baseDashboardItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
];

export const dynamicBaseItems = [
  {
    title: "Dashboard",
    url: "hrms/dashboard",
    icon: ChartPie,
  },
  {
    title: "Attendance",
    url: "hrms/attendance",
    icon: UserCheck,
  },
  {
    title: "Roster",
    url: "hrms/roster",
    icon: ListChecks,
  },
  {
    title: "Loans",
    url: "hrms/loans",
    icon: CreditCard,
  },
  {
    title: "Employee Setting",
    url: "hrms/employee-setting",
    icon: Settings,
  },
];

export const sidebarNavItems: Record<
  Role,
  { title: string; url: string; icon: LucideIcon }[]
> = {
  super_admin: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }],
  admin: [],
};

export const HRMS_PERMISSIONS = [
  "APPROVAL_LEAVE",
  "BASIC_HRMS",
  "OFFICE_MANAGEMENT",
];

export const SHARED_COMPONENTS = [
  {
    title: "Role Management",
    url: "create_role",
    icon: UserCheck,
    category: "User Management",
  },
  // {
  //   title: "User Overview",
  //   url: "user_overview",
  //   icon: SquareKanban,
  //   category: "User Management",
  // },
  {
    title: "Department Management",
    url: "department",
    icon: Building2,
    category: "Organization",
  },
  {
    title: "Working Days",
    url: "workingday",
    icon: CalendarDays,
    category: "Organization",
  },
];


type PermissionItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  category?: string;
};
type AllPermissionsMapType = {
  [key: string]: PermissionItem[];
  TASK_ASSIGNMENT: PermissionItem[];
  TASK_VIEW: PermissionItem[];
  CREATE_USER: PermissionItem[];
  CREATE_DEPARTMENT: PermissionItem[];
  WORKING_DAYS: PermissionItem[];
  COMMON_PERMISSION: PermissionItem[];
  APPROVAL_LEAVE: PermissionItem[];
  BASIC_HRMS: PermissionItem[];
  OFFICE_MANAGEMENT: PermissionItem[];
};

export const ALL_PERMISSIONS_MAP: AllPermissionsMapType = {
  TASK_ASSIGNMENT: [
    { title: "Task Assignment", url: "assign", icon: ClipboardCheck },
    { title: "Pending Approval", url: "approval", icon: Clock },
    { title: "Stuck Request", url: "stuck_request", icon: AlertCircle },
    { title: "Assign Task View", url: "assign_task", icon: ListCheck },
  ],
  TASK_VIEW: [
    { title: "All Task View", url: "task", icon: ClipboardList },
    { title: "Seal Submission", url: "seal", icon: FileCheck },
    { title: "Today Tasks", url: "member", icon: CalendarClock },
  ],
  CREATE_USER: [
    { title: "Create Role", url: "create_role", icon: Users },
    { title: "User Overview", url: "user_overview", icon: SquareKanban },
  ],
  CREATE_DEPARTMENT: [
    { title: "Department", url: "department", icon: Building2 },
  ],
  WORKING_DAYS: [
    { title: "Working Days", url: "workingday", icon: CalendarDays },
  ],
  COMMON_PERMISSION: [
    { title: "Leaderboard", url: "leaderboard", icon: Trophy },
    { title: "Reports", url: "report", icon: ChartNoAxesColumn },
    { title: "Notifications", url: "notification", icon: Bell },
    { title: "Settings", url: "setting", icon: Settings },
    { title: "View Attendance", url: "/attendance", icon: CalendarCheck },
  ],
  APPROVAL_LEAVE: [
    { title: "Leave Management", url: "/hrms/leaveApprovals", icon: CircleCheckBig },
  ],
  BASIC_HRMS: [
    {
      title: "Leave Application",
      url: "/hrms/leaveApplication",
      icon: FileText,
    },
    { title: "View Holidays", url: "/hrms/viewHoliday", icon: CalendarDays },
    { title: "View Policy", url: "/hrms/leave_policy", icon: ScrollText },
    {
      title: "View SalarySlip ",
      url: "/hrms/salarySlip",
      icon: ReceiptIndianRupee,
    },
    { title: "Attendance Logs", url: "/hrms/logs", icon: ClipboardPlus },
    {
      title: "Expenses Management",
      url: "hrms/expenses",
      icon: IndianRupee,
      category: "Expenses",
    },

  ],
  OFFICE_MANAGEMENT: [
    { title: "Create Holiday", url: "/hrms/createHoliday", icon: CalendarPlus },
    { title: "Create Leave Policy", url: "hrms/create_leave_policy", icon: ClipboardEdit },
    { title: "Employees Salary Slip", url: "hrms/membersSalarySlip", icon: Slice },
    { title: "Policy Management", url: "hrms/policy", icon: ShieldUser },
    {
      title: "Time Management",
      url: "hrms/organizationTimming",
      icon: Clock,
    },
    //    {
    //   title: "OverTime Management",
    //   url: "hrms/overtime",
    //   icon: CalendarClock,
    //   category: "User Management",
    // },
    {
      title: "Attendance Management",
      url: "hrms/attendancemanual",
      icon: ChartScatter,
      category: "Attendance",
    },
  ],
};


export const ADMIN_LOAN_ITEMS = [
  { title: "Loan Management", url: "hrms/loan_management", icon: Coins },
  { title: "Loan Present", url: "hrms/loanPresent", icon: BadgeIndianRupee },
  { title: "Loan Installments", url: "hrms/loanInstallments", icon: Banknote },
];

export const DYNAMIC_LOAN_ITEMS = [
  { title: "Loan", url: "hrms/loan", icon: BadgeIndianRupee },
  { title: "Loan Installment", url: "hrms/loanInstallment", icon: Banknote },
];

export const taskManagementFeatures = {
  admin: [
    {
      title: "Create Admin",
      url: "create_admin",
      icon: UserRoundPlus,
      category: "User Management",
    },
    {
      title: "Task Management",
      url: "task_assignment",
      icon: UserCheck,
      category: "Task Management",
    },
    {
      title: "Approval Queue",
      url: "approval_queue",
      icon: ListX,
      category: "Task Management",
    },
    {
      title: "Task Approvals",
      url: "taskapprovals",
      icon: ListOrdered,
      category: "Task Management",
    },
    {
      title: "Task View",
      url: "TaskView",
      icon: BookCheck,
      category: "Task Management",
    },
    {
      title: "All Members Task",
      url: "membersTask",
      icon: ShieldUser,
      category: "Task Management",
    },
    {
      title: "Stuck Requests",
      url: "stuckrequest",
      icon: GitPullRequest,
      category: "Task Management",
    },
    // {
    //   title: "Fraud Detection",
    //   url: "fraud_detection",
    //   icon: ShieldUser,
    //   category: "Analytics",
    // },
    {
      title: "Efficiency Reports",
      url: "efficiency_report",
      icon: ChartNoAxesColumnIncreasing,
      category: "Analytics",
    },
    // {
    //   title: "Leaderboard",
    //   url: "leaderboard",
    //   icon: Trophy,
    //   category: "Analytics",
    // },
    {
      title: "Notifications",
      url: "notification",
      icon: Bell,
      category: "System",
    },
    {
      title: "Settings",
      url: "setting", icon: Settings,
      category: "System"
    },
    // {
    //   title: "Attendance Overview",
    //   url: "attendance_overview",
    //   icon: Users,
    //   category: "User Management",
    // },
  ],
  permissions: ALL_PERMISSIONS_MAP,
};

export const hrmsFeatures = {
  admin: [
    {
      title: "Dashboard",
      url: "hrms/dashboard",
      icon: ChartPie,
      category: "dashboard",
    },
    {
      title: "Staff",
      url: "hrms/staff",
      icon: Users,
      category: "Staff",
    },
    {
      title: "Attendance",
      url: "hrms/attendence",
      icon: UserCheck,
      category: "Attendance",
    },
    {
      title: "Reimbursements",
      url: "hrms/reimbursement",
      icon: PiggyBank,
      category: "Reimbursement",
    },
    {
      title: "Loans",
      url: "hrms/allLoans",
      icon: CreditCard,
      category: "Loans",
    },
    {
      title: "Others",
      url: "hrms/others",
      icon: LayoutGrid,
      category: "Others",
    },
    // {
    //   title: "Holiday",
    //   url: "hrms/holiday",
    //   icon: CalendarDays,
    //   category: "holiday",
    // },
    // {
    //   title: "Leave History",
    //   url: "hrms/leave",
    //   icon: ClipboardList,
    //   category: "Employee Management",
    // },
    // {
    //   title: "Leave Approvals",
    //   url: "hrms/LeaveApprovals",
    //   icon: ClipboardEdit,
    //   category: "Employee Management",
    // },

    // {
    //   title: "Leave Policy",
    //   url: "hrms/leave_policy",
    //   icon: FileText,
    //   category: "Employee Management",
    // },
    // {
    //   title: "Salary Slip",
    //   url: "hrms/salarySlip",
    //   icon: ReceiptIndianRupee,
    //   category: "User Management",
    // },
    // {
    //   title: "Job Portal",
    //   url: "hrms/job_portal",
    //   icon: Briefcase,
    //   category: "User Management",
    // },
    // {
    //   title: "Time Management",
    //   url: "hrms/organizationTimming",
    //   icon: Clock,
    //   category: "User Management",
    // },
    // {
    //   title: "overTime Management",
    //   url: "hrms/overtimeManagement",
    //   icon: CalendarClock,
    //   category: "User Management",
    // },
    // {
    //   title: "Policy",
    //   url: "hrms/policy",
    //   icon: ShieldCheck,
    //   category: "User Management",
    // },
    // {
    //   title: "Attendance Management",
    //   url: "hrms/attendancemanual",
    //   icon: Calendar,
    //   category: "Attendance",
    // },
    // {
    //   title: "Account Management",
    //   url: "hrms/accountBalance",
    //   icon: Wallet,
    //   category: "Attendance",
    // },
    // {
    //   title: "Payroll Management",
    //   url: "hrms/payroll",
    //   icon: HandCoins,
    //   category: "Attendance",
    // },
    // {
    //   title: "Expenses Management",
    //   url: "hrms/expenses",
    //   icon: IndianRupee,
    //   category: "Expenses",
    // },
  ],
  permissions: ALL_PERMISSIONS_MAP,
};

export const getSidebarItemsByTab = (
  dashboardType: "admin" | "dynamic",
  activeTab: TabType,
  isTaskEnabled: boolean,
  isHrmsEnabled: boolean,
  permissions: string[] = []
): {
  title: string;
  url: string;
  icon: LucideIcon;
  isDropdown?: boolean;
  dropdownItems?: { title: string; url: string; icon: LucideIcon }[];
}[] => {
  const items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isDropdown?: boolean;
    dropdownItems?: { title: string; url: string; icon: LucideIcon }[];
  }[] = activeTab === "hrms" ? [] : [...baseDashboardItems];

  if (dashboardType === "dynamic" && activeTab === "hrms") {
    items.push(...dynamicBaseItems);
  }

  if (activeTab === "task" && isTaskEnabled) {
    if (dashboardType === "admin") {

      items.push(
        ...taskManagementFeatures.admin.map((item) => ({
          title: item.title,
          url: item.url,
          icon: item.icon,
        }))
      );


      items.push(
        ...SHARED_COMPONENTS.map((item) => ({
          title: item.title,
          url: item.url,
          icon: item.icon,
        }))
      );
    } else {
      const taskPermissions = permissions.filter(
        (perm) => !HRMS_PERMISSIONS.includes(perm)
      );
      taskPermissions.forEach((permission) => {
        if (ALL_PERMISSIONS_MAP[permission]) {
          items.push(...ALL_PERMISSIONS_MAP[permission]);
        }
      });
    }
  } else if (activeTab === "hrms" && isHrmsEnabled) {
    if (dashboardType === "admin") {
      items.push(
        ...hrmsFeatures.admin.map((item) => ({
          title: item.title,
          url: item.url,
          icon: item.icon,
        }))
      );

      // if (ADMIN_LOAN_ITEMS.length > 0) {
      //   items.push({
      //     title: "Loan Management",
      //     url: "#",
      //     icon: Landmark,
      //     isDropdown: true,
      //     dropdownItems: ADMIN_LOAN_ITEMS,
      //   });
      // }


      if (!isTaskEnabled) {
        items.push(
          ...SHARED_COMPONENTS.map((item) => ({
            title: item.title,
            url: item.url,
            icon: item.icon,
          }))
        );
      }
    } else {
      const hrmsPermissions = permissions.filter((perm) =>
        HRMS_PERMISSIONS.includes(perm)
      );
      hrmsPermissions.forEach((permission) => {
        if (ALL_PERMISSIONS_MAP[permission]) {
          items.push(...ALL_PERMISSIONS_MAP[permission]);
        }
      });
      if (hrmsPermissions.length > 0 && DYNAMIC_LOAN_ITEMS.length > 0) {
        items.push({
          title: "Loan Management",
          url: "#",
          icon: Landmark,
          isDropdown: true,
          dropdownItems: DYNAMIC_LOAN_ITEMS,
        });
      }
    }
  }


  return items.filter(
    (item, index, self) =>
      index ===
      self.findIndex((t) => t.url === item.url && t.title === item.title)
  );
};


export const getAvailableTabs = (
  isTaskEnabled: boolean,
  isHrmsEnabled: boolean,
  permissions: string[] = [],
  isAdmin: boolean = false
) => {
  const tabs: {
    key: TabType;
    label: string;
    icon: LucideIcon;
    count?: number;
  }[] = [];

  if (isTaskEnabled) {
    const taskPermissions = permissions.filter(
      (perm) => !HRMS_PERMISSIONS.includes(perm)
    );
    let taskCount = 0;

    if (isAdmin) {
      taskCount =
        taskManagementFeatures.admin.length + SHARED_COMPONENTS.length;
    } else {
      taskCount = taskPermissions.reduce(
        (acc, perm) => acc + (ALL_PERMISSIONS_MAP[perm]?.length || 0),
        0
      );
    }

    tabs.push({
      key: "task",
      label: "Task",
      icon: ListChecks,
      count: taskCount,
    });
  }

  if (isHrmsEnabled) {
    const hrmsPermissions = permissions.filter((perm) =>
      HRMS_PERMISSIONS.includes(perm)
    );
    let hrmsCount = 0;

    if (isAdmin) {
      hrmsCount = hrmsFeatures.admin.length + 1;
      if (!isTaskEnabled) {
        hrmsCount += SHARED_COMPONENTS.length;
      }
    } else {
      hrmsCount = hrmsPermissions.reduce(
        (acc, perm) => acc + (ALL_PERMISSIONS_MAP[perm]?.length || 0),
        0
      );
      if (hrmsPermissions.length > 0) {
        hrmsCount += 1;
      }
    }

    tabs.push({
      key: "hrms",
      label: "HRMS",
      icon: UserRoundCog,
      count: hrmsCount,
    });
  }

  return tabs;
};

export const getDefaultActiveTab = (
  availableTabs: { key: TabType; label: string }[]
): TabType => {
  if (availableTabs.length === 0) return "task";
  if (availableTabs.find((tab) => tab.key === "task")) return "task";
  if (availableTabs.find((tab) => tab.key === "hrms")) return "hrms";
  return availableTabs[0].key;
};


export const hasHrmsAccess = (
  permissions: string[],
  isAdmin: boolean,
  isHrmsEnabled: boolean
) => {
  if (!isHrmsEnabled) return false;
  if (isAdmin) return true;
  return (
    permissions && permissions.some((perm) => HRMS_PERMISSIONS.includes(perm))
  );
};

export const hasTaskAccess = (
  permissions: string[],
  isAdmin: boolean,
  isTaskEnabled: boolean
) => {
  if (!isTaskEnabled) return false;
  if (isAdmin) return true;
  return (
    permissions && permissions.some((perm) => !HRMS_PERMISSIONS.includes(perm))
  );
};

export const getModuleStatus = (
  isTaskEnabled: boolean,
  isHrmsEnabled: boolean,
  isAdmin: boolean,
  permissions: string[]
) => {
  const taskPermissions = permissions.filter(
    (perm) => !HRMS_PERMISSIONS.includes(perm)
  );
  const hrmsPermissions = permissions.filter((perm) =>
    HRMS_PERMISSIONS.includes(perm)
  );

  const taskAccess = hasTaskAccess(permissions, isAdmin, isTaskEnabled);
  const hrmsAccess = hasHrmsAccess(permissions, isAdmin, isHrmsEnabled);

  return {
    taskManagement: {
      enabled: isTaskEnabled,
      hasAccess: taskAccess,
      permissionCount: taskPermissions.length,
    },
    hrms: {
      enabled: isHrmsEnabled,
      hasAccess: hrmsAccess,
      permissionCount: hrmsPermissions.length,
    },
    totalModules: (taskAccess ? 1 : 0) + (hrmsAccess ? 1 : 0),
  };
};

export const getDynamicTaskSidebarItems = (permissions: string[]) => {
  return getSidebarItemsByTab("dynamic", "task", true, false, permissions);
};

export const getDynamicHrmsSidebarItems = (permissions: string[]) => {
  return getSidebarItemsByTab("dynamic", "hrms", false, true, permissions);
};
