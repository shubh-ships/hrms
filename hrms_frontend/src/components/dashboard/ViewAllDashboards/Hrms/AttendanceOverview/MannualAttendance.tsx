"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Save } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AttendanceProps {
  users: any[];
  onMarkManualAttendance: (data: any) => Promise<void>;
  getUserId: (user: any) => string | null;
  getUserName: (user: any) => string;
}

export const ManualAttendance: React.FC<AttendanceProps> = ({
  users,
  onMarkManualAttendance,
  getUserId,
  getUserName,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loginTime, setLoginTime] = useState("09:00");
  const [logoutTime, setLogoutTime] = useState("18:00");
  const [status, setStatus] = useState("PRESENT");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    setIsLoading(true);
    try {
      const attendanceData = {
        userId: selectedUserId,
        date: format(selectedDate, "yyyy-MM-dd"),
        loginTime: new Date(
          `${format(selectedDate, "yyyy-MM-dd")}T${loginTime}`
        ).toISOString(),
        logoutTime: new Date(
          `${format(selectedDate, "yyyy-MM-dd")}T${logoutTime}`
        ).toISOString(),
        status,
        month: format(selectedDate, "MMMM yyyy"),
      };

      await onMarkManualAttendance(attendanceData);
      toast.success("Attendance marked successfully");

      // Reset form
      setSelectedUserId("");
      setLoginTime("09:00");
      setLogoutTime("18:00");
      setStatus("PRESENT");
    } catch (error) {
      console.error("Failed to mark attendance:", error);
      toast.error("Failed to mark attendance");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mark Manual Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {/* User Selection */}
          <div className="grid gap-2">
            <Label htmlFor="user">Select User</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => {
                  const userId = getUserId(user);
                  return (
                    <SelectItem key={userId} value={userId || ""}>
                      {getUserName(user)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="loginTime">Login Time</Label>
              <Input
                id="loginTime"
                type="time"
                value={loginTime}
                onChange={(e) => setLoginTime(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="logoutTime">Logout Time</Label>
              <Input
                id="logoutTime"
                type="time"
                value={logoutTime}
                onChange={(e) => setLogoutTime(e.target.value)}
              />
            </div>
          </div>

          {/* Status Selection */}
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRESENT">Present</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
                <SelectItem value="LATE">Late</SelectItem>
                <SelectItem value="HALF_DAY">Half Day</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !selectedUserId}
            className="mt-4"
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Marking Attendance..." : "Mark Attendance"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
