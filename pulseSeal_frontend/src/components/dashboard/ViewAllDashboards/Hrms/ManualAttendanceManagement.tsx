'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CalendarIcon, 
  Clock, 
  User, 
  Plus, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Trash2, 
  Edit2, 
  ArrowRight,
  Timer,
  Coffee,
  LogIn,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUsers } from '@/features/user/userSlice';
import { 
  fetchUserAttendance, 
  updateDailyScans, 
  createManualAttendance ,
  deleteAttendanceRecord
} from '@/features/hrmsattendance/hrmsAttendanceSlice';

interface AttendanceRecord {
  _id: string;
  userId: string;
  organizationId: string;
  date: string;
  scans: Array<{
    scanTime: string;
    type: 'IN' | 'OUT';
    sessionMinutes?: number;
    breakMinutes?: number;
    _id: string;
  }>;
  officeTotalWorkingMinutes: number;
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  isLateLogin: boolean;
  lateLoginMinutes: number;
  isEarlyLogout: boolean;
  earlyLogoutMinutes: number;
  isOvertime: boolean;
  totalOvertimeMinutes: number;
  __v: number;
}

interface ScanEntry {
  id: string;
  time: string;
  type: 'IN' | 'OUT';
  isNew?: boolean;
  isModified?: boolean;
}

// HELPER FUNCTIONS FOR PROPER TIMEZONE AND ISO STRING CONVERSION
const createLocalISOFromDateTime = (date: Date, timeString: string): string => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const localDateTime = new Date(date);
  localDateTime.setHours(hours, minutes, 0, 0);
  return localDateTime.toISOString();
};

const getCurrentISOTime = (): string => {
  return new Date().toISOString();
};

const extractLocalTimeFromISO = (isoString: string): string => {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const createScanISOString = (selectedDate: Date, timeString: string): string => {
  return createLocalISOFromDateTime(selectedDate, timeString);
};

const ManualAttendanceManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { users, loading: usersLoading } = useAppSelector((state) => state.users);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const { loading: attendanceLoading, deleteLoading  } = useAppSelector((state) => state.hrmsAttendance);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loginTime, setLoginTime] = useState<string>('09:00');
  const [logoutTime, setLogoutTime] = useState<string>('18:00');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Enhanced scan management state
  const [scanEntries, setScanEntries] = useState<ScanEntry[]>([]);
  const [isAddingScan, setIsAddingScan] = useState(false);
  const [newScanTime, setNewScanTime] = useState<string>('');
  const [newScanType, setNewScanType] = useState<'IN' | 'OUT'>('IN');
  const [editingScan, setEditingScan] = useState<string | null>(null);
  const [editTime, setEditTime] = useState<string>('');
  const [editType, setEditType] = useState<'IN' | 'OUT'>('IN');

  // Attendance data
  const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord | null>(null);
  const [hasExistingRecord, setHasExistingRecord] = useState<boolean>(false);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (selectedUserId && selectedDate) {
      handleFetchAttendance();
    }
  }, [selectedUserId, selectedDate]);

  const handleFetchAttendance = async () => {
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const result = await dispatch(fetchUserAttendance({ 
        userId: selectedUserId,
        date: dateString 
      })).unwrap();

      const attendanceRecord = Array.isArray(result) ? result[0] : result;

      if (attendanceRecord && attendanceRecord._id) {
        setExistingAttendance(attendanceRecord);
        
        // Convert UTC scans from API back to local time for display
        const scans: ScanEntry[] = attendanceRecord.scans?.map((scan: any, index: number): ScanEntry => {
          const localTime = extractLocalTimeFromISO(scan.scanTime);
          
          return {
            id: scan._id || `scan-${index}`,
            time: localTime,
            type: scan.type,
            isNew: false,
            isModified: false
          };
        }) || [];
        
        setScanEntries(scans);
        setHasExistingRecord(true);
        
        // Set existing times converted from UTC to local
        const inScans = attendanceRecord.scans?.filter((scan: any) => scan.type === 'IN') || [];
        const outScans = attendanceRecord.scans?.filter((scan: any) => scan.type === 'OUT') || [];
        
        if (inScans.length > 0) {
          setLoginTime(extractLocalTimeFromISO(inScans[0].scanTime));
        }
        if (outScans.length > 0) {
          setLogoutTime(extractLocalTimeFromISO(outScans[outScans.length - 1].scanTime));
        }
      } else {
        setExistingAttendance(null);
        setScanEntries([]);
        setHasExistingRecord(false);
        setLoginTime('09:00');
        setLogoutTime('18:00');
      }
    } catch (error) {
      setExistingAttendance(null);
      setScanEntries([]);
      setHasExistingRecord(false);
     
    }
  };

  const handleAddScan = () => {
    if (!newScanTime) {
      toast.error('Please enter a scan time');
      return;
    }

    const isDuplicate = scanEntries.some(scan => scan.time === newScanTime);
    if (isDuplicate) {
      toast.error('This scan time already exists');
      return;
    }

    const newScan: ScanEntry = {
      id: `new-${Date.now()}`,
      time: newScanTime,
      type: newScanType,
      isNew: true,
      isModified: false
    };

    const updatedScans = [...scanEntries, newScan].sort((a, b) => a.time.localeCompare(b.time));
    setScanEntries(updatedScans);
    setNewScanTime('');
    setIsAddingScan(false);
    toast.success('Scan time added');
  };

  const handleEditScan = (scanId: string) => {
    const scan = scanEntries.find(s => s.id === scanId);
    if (scan) {
      setEditingScan(scanId);
      setEditTime(scan.time);
      setEditType(scan.type);
    }
  };

  const handleSaveEdit = () => {
    if (!editTime || !editingScan) return;

    const isDuplicate = scanEntries.some(scan => 
      scan.id !== editingScan && scan.time === editTime
    );
    if (isDuplicate) {
      toast.error('This scan time already exists');
      return;
    }

    const updatedScans = scanEntries.map(scan => 
      scan.id === editingScan 
        ? { ...scan, time: editTime, type: editType, isModified: !scan.isNew }
        : scan
    ).sort((a, b) => a.time.localeCompare(b.time));

    setScanEntries(updatedScans);
    setEditingScan(null);
    setEditTime('');
    toast.success('Scan updated');
  };

  const handleRemoveScan = (scanId: string) => {
    const updatedScans = scanEntries.filter(scan => scan.id !== scanId);
    setScanEntries(updatedScans);
    toast.success('Scan time removed');
  };

  const handleDeleteAttendance = async () => {
  if (!selectedUserId || !selectedDate) {
    toast.error('Please select a user and date first');
    return;
  }

  if (!window.confirm('Are you sure you want to delete the attendance for this day? This action cannot be undone.')) {
    return;
  }

  try {
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    await dispatch(deleteAttendanceRecord({ userId: selectedUserId, date: dateString })).unwrap();
    toast.success('Attendance record deleted successfully.');

    // Reset state to clear current data
    setExistingAttendance(null);
    setScanEntries([]);
    setHasExistingRecord(false);
    setLoginTime('09:00');
    setLogoutTime('18:00');
  } catch (error: any) {
    toast.error(error || 'Failed to delete attendance record');
  }
};


  const getScanIcon = (type: 'IN' | 'OUT') => {
    return type === 'IN' ? <LogIn className="h-3 w-3" /> : <LogOut className="h-3 w-3" />;
  };

  const getScanColor = (scan: ScanEntry) => {
    if (scan.isNew) {
      return 'bg-green-50 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800';
    }
    if (scan.isModified) {
      return 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800';
    }
    return scan.type === 'IN' 
      ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800' 
      : 'bg-gray-50 text-gray-800 border-gray-200 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-800';
  };

  const getWorkingSummary = () => {
    if (!existingAttendance) return null;
    
    const hours = Math.floor(existingAttendance.totalWorkMinutes / 60);
    const minutes = existingAttendance.totalWorkMinutes % 60;
    
    return {
      totalWork: `${hours}h ${minutes}m`,
      breakTime: `${Math.floor(existingAttendance.totalBreakMinutes / 60)}h ${existingAttendance.totalBreakMinutes % 60}m`,
      isLate: existingAttendance.isLateLogin,
      lateMinutes: existingAttendance.lateLoginMinutes,
      isOvertime: existingAttendance.isOvertime,
      overtimeMinutes: existingAttendance.totalOvertimeMinutes
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    if (!loginTime || !logoutTime) {
      toast.error('Please set both login and logout times');
      return;
    }

    try {
      const loginDateTime = createLocalISOFromDateTime(selectedDate, loginTime);
      const logoutDateTime = createLocalISOFromDateTime(selectedDate, logoutTime);

      if (hasExistingRecord && existingAttendance) {
        const finalScans = scanEntries.length > 0 
          ? scanEntries.map(scan => createScanISOString(selectedDate, scan.time))
          : [loginDateTime, logoutDateTime];
        
        await dispatch(updateDailyScans({
          dailyRecordId: existingAttendance._id,
          scans: finalScans
        })).unwrap();

        toast.success('Attendance record updated successfully');
      } else {
        await dispatch(createManualAttendance({
          userId: selectedUserId,
          organizationId: currentUser?.organizationId || '',
          loginTime: loginDateTime,
          logoutTime: logoutDateTime
        })).unwrap();

        toast.success('Manual attendance record created successfully');
      }

      // Reset form
      setSelectedUserId('');
      setSelectedDate(new Date());
      setLoginTime('09:00');
      setLogoutTime('18:00');
      setScanEntries([]);
      setExistingAttendance(null);
      setHasExistingRecord(false);
      setIsDialogOpen(false);

    } catch (error: any) {
      toast.error(error || 'Failed to process attendance record');
    }
  };

  const selectedUserData = users.find(user => user.user_id._id === selectedUserId);
  const workingSummary = getWorkingSummary();

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-border bg-card">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Clock className="h-5 w-5 text-primary" />
            Manual Attendance Management
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Create or update attendance records for employees with precise scan management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user-select" className="text-sm font-medium text-foreground">
              Select Employee
            </Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="bg-background border-input hover:bg-accent hover:text-accent-foreground">
                <SelectValue placeholder="Choose an employee" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {users.map((user) => (
                  <SelectItem 
                    key={user._id} 
                    value={user.user_id._id}
                    className="hover:bg-accent hover:text-accent-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{user.user_id.name}</span>
                      <span className="text-muted-foreground">- {user.user_id.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Select Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-background border-input hover:bg-accent hover:text-accent-foreground",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover border-border">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className="rounded-md"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Attendance Status */}
          {selectedUserId && (
            <Alert className={cn(
              "border transition-colors",
              hasExistingRecord 
                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30" 
                : "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30"
            )}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {hasExistingRecord ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  )}
                  <div>
                    <h4 className="font-medium text-foreground">
                      {hasExistingRecord ? 'Existing Record Found' : 'No Record Found'}
                    </h4>
                    {selectedUserData && (
                      <p className="text-sm text-muted-foreground">
                        {selectedUserData.user_id.name} - {format(selectedDate, "PPP")}
                      </p>
                    )}
                  </div>
                </div>
                {hasExistingRecord && workingSummary && (
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs border-current">
                      <Timer className="h-3 w-3 mr-1" />
                      {workingSummary.totalWork}
                    </Badge>
                    <Badge variant="outline" className="text-xs border-current">
                      <Coffee className="h-3 w-3 mr-1" />
                      {workingSummary.breakTime}
                    </Badge>
                  </div>
                )}
              </div>
            </Alert>
          )}

          <Separator className="bg-border" />

          {/* Time Management */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="login-time" className="text-sm font-medium text-foreground">
                Login Time
              </Label>
              <Input
                id="login-time"
                type="time"
                value={loginTime}
                onChange={(e) => setLoginTime(e.target.value)}
                className="bg-background border-input focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logout-time" className="text-sm font-medium text-foreground">
                Logout Time
              </Label>
              <Input
                id="logout-time"
                type="time"
                value={logoutTime}
                onChange={(e) => setLogoutTime(e.target.value)}
                className="bg-background border-input focus:ring-ring"
              />
            </div>
          </div>

          {/* Enhanced Scan Management */}
          {hasExistingRecord && (
            <>
              <Separator className="bg-border" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Face Scan Timeline</h4>
                    <p className="text-sm text-muted-foreground">
                      Manage employee face scan entries for this date
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingScan(true)}
                    disabled={isAddingScan}
                    className="bg-background border-input hover:bg-accent hover:text-accent-foreground"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Scan
                  </Button>
                </div>

                {/* Add New Scan Form */}
                {isAddingScan && (
                  <Card className="border-dashed border-2 border-green-300 bg-green-50/50 dark:border-green-700 dark:bg-green-950/20">
                    <CardContent className="pt-4">
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-foreground">Scan Time</Label>
                          <Input
                            type="time"
                            value={newScanTime}
                            onChange={(e) => setNewScanTime(e.target.value)}
                            placeholder="HH:MM"
                            className="bg-background border-input focus:ring-ring"
                          />
                        </div>
                        <div className="w-24">
                          <Label className="text-sm font-medium text-foreground">Type</Label>
                          <Select value={newScanType} onValueChange={(value: 'IN' | 'OUT') => setNewScanType(value)}>
                            <SelectTrigger className="bg-background border-input hover:bg-accent">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              <SelectItem value="IN" className="hover:bg-accent">IN</SelectItem>
                              <SelectItem value="OUT" className="hover:bg-accent">OUT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          onClick={handleAddScan} 
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setIsAddingScan(false);
                            setNewScanTime('');
                          }}
                          className="bg-background border-input hover:bg-accent"
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Scan Entries Timeline */}
                {scanEntries.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded bg-green-500"></div>
                        New
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded bg-yellow-500"></div>
                        Modified
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded bg-blue-500"></div>
                        IN Scan
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded bg-gray-500"></div>
                        OUT Scan
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {scanEntries.map((scan, index) => (
                        <div key={scan.id} className="flex items-center gap-2">
                          {/* Timeline connector */}
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              "w-3 h-3 rounded-full",
                              scan.type === 'IN' ? 'bg-blue-500' : 'bg-gray-500'
                            )}></div>
                            {index < scanEntries.length - 1 && (
                              <div className="w-px h-8 bg-border mt-1"></div>
                            )}
                          </div>
                          
                          {/* Scan Entry Card */}
                          <Card className={cn("flex-1 border transition-colors", getScanColor(scan))}>
                            <CardContent className="py-3 px-4">
                              {editingScan === scan.id ? (
                                <div className="flex gap-2 items-center">
                                  <Input
                                    type="time"
                                    value={editTime}
                                    onChange={(e) => setEditTime(e.target.value)}
                                    className="w-24 h-8 bg-background border-input"
                                  />
                                  <Select value={editType} onValueChange={(value: 'IN' | 'OUT') => setEditType(value)}>
                                    <SelectTrigger className="w-16 h-8 bg-background border-input">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border">
                                      <SelectItem value="IN">IN</SelectItem>
                                      <SelectItem value="OUT">OUT</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button size="sm" onClick={handleSaveEdit} className="h-8 px-2 bg-primary hover:bg-primary/90">
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => setEditingScan(null)}
                                    className="h-8 px-2 bg-background border-input hover:bg-accent"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {getScanIcon(scan.type)}
                                    <span className="font-medium">{scan.time}</span>
                                    <Badge variant="outline" className="border-current">
                                      {scan.type}
                                    </Badge>
                                    {scan.isNew && (
                                      <Badge className="bg-green-600 hover:bg-green-700 text-white">
                                        NEW
                                      </Badge>
                                    )}
                                    {scan.isModified && (
                                      <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white">
                                        MODIFIED
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditScan(scan.id)}
                                      className="h-7 w-7 p-0 hover:bg-accent"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleRemoveScan(scan.id)}
                                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Working Hours Summary */}
                {existingAttendance && workingSummary && (
                  <Card className="bg-muted/50 border-border">
                    <CardContent className="pt-4">
                      <h5 className="font-medium mb-3 flex items-center gap-2 text-foreground">
                        <Timer className="h-4 w-4" />
                        Working Hours Analysis
                      </h5>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-medium text-lg text-foreground">{workingSummary.totalWork}</p>
                          <p className="text-muted-foreground">Total Work</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-lg text-foreground">{workingSummary.breakTime}</p>
                          <p className="text-muted-foreground">Break Time</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-lg text-foreground">{scanEntries.length}</p>
                          <p className="text-muted-foreground">Total Scans</p>
                        </div>
                      </div>
                      
                      {(workingSummary.isLate || workingSummary.isOvertime) && (
                        <div className="flex gap-2 mt-3">
                          {workingSummary.isLate && (
                            <Badge variant="destructive" className="text-xs">
                              Late by {workingSummary.lateMinutes}m
                            </Badge>
                          )}
                          {workingSummary.isOvertime && (
                            <Badge variant="secondary" className="text-xs">
                              Overtime: {workingSummary.overtimeMinutes}m
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" 
                  disabled={!selectedUserId || usersLoading || attendanceLoading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {hasExistingRecord ? 'Update Record' : 'Create Record'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                
              </DialogTrigger>
              <DialogContent className="bg-background border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Confirm Attendance Action</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    {hasExistingRecord 
                      ? 'Review and confirm the attendance record updates below.' 
                      : 'Review and confirm the new attendance record details below.'
                    }
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Card className="bg-muted/50 border-border">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-foreground">
                          <strong>Employee:</strong> {selectedUserData?.user_id.name}
                        </div>
                        <div className="text-foreground">
                          <strong>Date:</strong> {format(selectedDate, "PPP")}
                        </div>
                        <div className="text-foreground">
                          <strong>Login:</strong> {loginTime}
                        </div>
                        <div className="text-foreground">
                          <strong>Logout:</strong> {logoutTime}
                        </div>
                        {hasExistingRecord && (
                          <>
                            <div className="text-foreground">
                              <strong>Total Scans:</strong> {scanEntries.length}
                            </div>
                            <div className="text-foreground">
                              <strong>Changes:</strong> {
                                scanEntries.filter(s => s.isNew || s.isModified).length
                              } modifications
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSubmit}
                      disabled={attendanceLoading}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {attendanceLoading ? 'Processing...' : 'Confirm Changes'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1 bg-background border-input hover:bg-accent"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="outline" 
              onClick={handleFetchAttendance}
              disabled={!selectedUserId || usersLoading}
              className="bg-background border-input hover:bg-accent hover:text-accent-foreground"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>

              <Button
    variant="destructive"
    onClick={handleDeleteAttendance}
    disabled={!hasExistingRecord || deleteLoading}
    className="bg-red-600 hover:bg-red-700 text-white flex-1"
  >
    {deleteLoading ? 'Deleting...' : 'Delete Attendance'}
    <Trash2 className="ml-2 h-4 w-4" />
  </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManualAttendanceManager;
