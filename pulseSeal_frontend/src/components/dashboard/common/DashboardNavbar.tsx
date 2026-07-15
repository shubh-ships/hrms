"use client";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  Bell,
  Moon,
  Settings,
  Sun,
  Building,
  ClipboardList,
  Shield,
  Users,
  LayoutDashboard,
  Layers,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutUser, simpleLogout } from "@/features/auth/authSlice";
import { toast } from "sonner";
import { getModuleStatus } from "@/components/config/navigation";


interface DashboardNavbarProps {
  dashboardType: "super_admin" | "admin" | "dynamic";
  orgPermissions: {
    isHRMS_enabled: boolean;
    isTaskManagement_enabled: boolean;
  };
}

function DashboardNavbar({
  dashboardType,
  orgPermissions,
}: DashboardNavbarProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const {
    user,
    loading,
    isSuperUser,
    isOrganizer,
    role,
    permissions,
    hrmsPermissions,
  } = useAppSelector((state) => state.auth);

  const { isHRMS_enabled, isTaskManagement_enabled } = orgPermissions;


  const moduleStatus = getModuleStatus(
    isTaskManagement_enabled,
    isHRMS_enabled,
    dashboardType === "admin",
    permissions || []
  );

  const handleLogout = async () => {
    try {

      if (isSuperUser || isOrganizer) {
        await dispatch(simpleLogout()).unwrap();
      } else {
        await dispatch(logoutUser()).unwrap();
      }
      toast.success("Logged out successfully");
      router.push("/auth/Login");
    } catch (error) {
      toast.error("Logout failed. Please try again.");
      console.error("Logout error:", error);
    }
  };

  const userInitials = React.useMemo(() => {
    if (!user?.name) return "US";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }, [user?.name]);

  const userAvatar = React.useMemo(
    () => (
      <Avatar>
        <AvatarImage
          src={user?.profilePicture}
          alt="User profile"
          className="object-cover"
        />
        <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
          {userInitials}
        </AvatarFallback>
      </Avatar>
    ),
    [user?.profilePicture, userInitials]
  );

  const getDashboardTitle = () => {
    switch (dashboardType) {
      case "super_admin":
        return "Super Admin Panel";
      case "admin":
        return "Admin Dashboard";
      case "dynamic":
        return `${role || "User"} Dashboard`;
      default:
        return "Dashboard";
    }
  };

  const getDashboardSubtitle = () => {
    if (dashboardType === "super_admin") return "System Administration";

    const modules = [];
    if (moduleStatus.taskManagement.hasAccess) modules.push("Tasks");
    if (moduleStatus.hrms.hasAccess) modules.push("HRMS");

    if (modules.length === 0) return "No modules available";
    if (modules.length === 1) return modules[0];


  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-4 border-b shadow-sm border-gray-300 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex gap-3 items-center">
        {/* <SidebarTrigger /> */}

        <div className="hidden sm:block">
          <div className="flex items-center gap-3">
            <h1 className="text-xl ml-4 font-bold text-foreground tracking-tight">
              {getDashboardTitle()}
            </h1>
          </div>
        </div>
      </div>

      {/* <div className="flex gap-2 items-center">

        <div className="hidden lg:flex gap-2 items-center mr-2">

          {dashboardType === "super_admin" && (
            <div className="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Shield className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                Super Admin
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            className="data-[state=checked]:bg-green-500" // Custom green color
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Toggle theme">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>


        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              disabled={loading}
            >
              {userAvatar}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={10} className="w-72">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium leading-none">
                  {user?.name || "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || ""}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">Role:</span>
                  <span className="text-xs font-medium bg-secondary px-2 py-0.5 rounded">
                    {role || "N/A"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => {
                let settingsPath = "/dashboard/admin/setting";
                if (dashboardType === "dynamic") {
                  settingsPath = "/dashboard/dynamic/setting";
                } else if (dashboardType === "super_admin") {
                  settingsPath = "/dashboard/super_admin/setting";
                }
                router.push(settingsPath);
              }}
              className="cursor-pointer"
            >
              <Settings className="h-4 w-4 mr-2" />
              Setting
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/40 cursor-pointer"
              onClick={handleLogout}
              disabled={loading}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {loading ? "Logging out.." : "Logout"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div> */}
      <div className="flex gap-3 items-center">

        {/* Toggle Switch */}
        <div className="flex items-center h-full">
          <div className="flex flex-col gap-1">
            {/* <Switch
              checked={false}
              className="scale-75 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700 h-4 w-8"
            /> */}
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'dark')}
              className="scale-75 data-[state=checked]:bg-green-500 h-4 w-8"
            />
            <Switch
              checked={theme === 'light'}
              onCheckedChange={(checked) => setTheme(checked ? 'light' : 'dark')}
              className="scale-75 data-[state=checked]:bg-green-500 h-4 w-8"
            />
          </div>
        </div>

        <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 mx-[1px]"></div>

        {/* Notification Bell */}
        <div className="px-1">
          <Button variant="ghost" size="icon" className="rounded-full bg-gray-100 hover:bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400 h-10 w-10">
            <Bell className="h-5 w-5 text-yellow-300" />
          </Button>
        </div>

        <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 mx-[1px]"></div>

        {/*User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity mr-4">

              {/* Avatar Image */}
              <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                <AvatarImage
                  src={user?.profilePicture}
                  alt="User profile"
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {userInitials}
                </AvatarFallback>
              </Avatar>

              {/* Text Details*/}
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold">{user?.name || "User"}</span>
                <span className="text-sm text-muted-foreground capitalize">{role?.toLowerCase() || "Role"}</span>
              </div>
            </div>
          </DropdownMenuTrigger>

          {/* Dropdown Menu Items */}
          <DropdownMenuContent sideOffset={10} className="w-56" align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                let settingsPath = "/dashboard/admin/setting";
                if (dashboardType === "dynamic") settingsPath = "/dashboard/dynamic/setting";
                else if (dashboardType === "super_admin") settingsPath = "/dashboard/super_admin/setting";
                router.push(settingsPath);
              }}
              className="cursor-pointer"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/40 cursor-pointer"
              onClick={handleLogout}
              disabled={loading}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </header>
  );
}

export default React.memo(DashboardNavbar);
