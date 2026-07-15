"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUsers } from '@/features/user/userSlice';
import { fetchDepartments } from '@/features/departments/departmentSlice';
import {
    fetchTodayTaskAssignmentsByUserId,
    deleteTaskAssignment,
    updateTaskAssignment,
    selectDailyTaskAssignments,
    selectTaskAssignmentLoading,
    TaskAssignment
} from "@/features/taskAssignments/taskAssignmentSlice";
import { toast } from "sonner";
import { format, isToday, isSameDay } from "date-fns";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Eye,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    File,
    Image as ImageIcon,
    Link as LinkIcon,
    Clock,
    Users,
    CheckCircle,
    ArrowLeft,
    Search,
    Calendar,
    Filter,
    Trash2,
    Edit,
    Save,
    X
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from '@/components/ui/label';
import movebackIcon from '@/assets/Dashicons/move-back-icon.png';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface User {
    _id: string;
    user_id: {
        _id: string;
        name: string;
        email: string;
        phoneNumber: number;
        isActive: boolean;
        id: string;
    };
    roleDefinitionId: {
        _id: string;
        roleName: string;
        hierarchyLevel: number;
    };
    departments: Array<{
        _id: string;
        name: string;
        alias: string;
    }>;
    status: string;
}

interface TaskAssign {
    stuck_request_status: string;
    _id: string;
    title: string;
    remainingTAT: number;
    description: string;
    assigned_by_user_id: any;
    assigned_to_employee_id: any;
    proof: Array<{
        type: string;
        url: string;
        fieldName: string;
    }>;
    TAT: number;
    deadline: string;
    status: 'Pending' | 'Overdue' | 'Completed';
    timer_status: 'Todo' | 'InProgress' | 'Stuck' | 'Done';
    department_id: any;
    previous_TAT?: number[];
    createdAt: string;
    updatedAt: string;
    __v: number;
    stuck_request?: boolean;
    stuck_reason?: string;
    timerStartTime?: string;
}

const MembersTasks = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const { users, loading: usersLoading } = useAppSelector(state => state.users);
    const { departments, loading: departmentsLoading } = useAppSelector(state => state.departments);
    const memberTasks = useAppSelector(selectDailyTaskAssignments);
    const tasksLoading = useAppSelector(selectTaskAssignmentLoading);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
    const [showOnlyToday, setShowOnlyToday] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editedTask, setEditedTask] = useState<Partial<TaskAssign>>({});
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

    // Fetch all users and departments on component mount
    useEffect(() => {
        dispatch(fetchUsers());
        dispatch(fetchDepartments({}));
    }, [dispatch]);

    // Filter users based on search term and department
    useEffect(() => {
        if (users.length > 0) {
            let filtered = [...users];

            // Filter by department
            if (selectedDepartment && selectedDepartment !== 'all') {
                filtered = filtered.filter(user =>
                    user.departments.some(dept => dept._id === selectedDepartment)
                );
            }

            // Filter by search term
            if (searchTerm) {
                const lowerSearch = searchTerm.toLowerCase();
                filtered = filtered.filter(user =>
                    (user.user_id?.name || '').toLowerCase().includes(lowerSearch) ||
                    (user.user_id?.email || '').toLowerCase().includes(lowerSearch) ||
                    (user.roleDefinitionId?.roleName || '').toLowerCase().includes(lowerSearch) ||
                    user.departments?.some(dept =>
                        dept.name.toLowerCase().includes(lowerSearch)
                    )
                );
            }

            setFilteredUsers(filtered);
        }
    }, [users, searchTerm, selectedDepartment]);

    // Fetch tasks when a user is selected
    useEffect(() => {
        if (selectedUser?.user_id?._id) {
            dispatch(fetchTodayTaskAssignmentsByUserId(selectedUser.user_id._id));
        }
    }, [selectedUser, dispatch]);

    const getFilteredAssignments = () => {
        let baseTasks = (memberTasks || []) as TaskAssign[];

        let filtered = baseTasks;
        if (selectedDate && !showOnlyToday) {
            filtered = baseTasks.filter((assignment) => {
                if (!assignment.deadline) return false;
                const taskDate = new Date(assignment.deadline);
                return isSameDay(taskDate, selectedDate);
            });
        } else if (showOnlyToday) {
            filtered = baseTasks.filter((assignment) => {
                if (!assignment.deadline) return false;
                const taskDate = new Date(assignment.deadline);
                return isToday(taskDate);
            });
        }

        return filtered;
    };

    const toggleCard = (assignmentId: string) => {
        const newExpanded = new Set(expandedCards);
        if (newExpanded.has(assignmentId)) {
            newExpanded.delete(assignmentId);
        } else {
            newExpanded.add(assignmentId);
        }
        setExpandedCards(newExpanded);
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "Pending":
            case "Todo":
                return "secondary";
            case "Completed":
            case "Done":
                return "default";
            case "Overdue":
            case "Stuck":
                return "destructive";
            case "InProgress":
                return "outline";
            default:
                return "outline";
        }
    };

    const getDepartmentsText = (departments: Array<{name: string}>) => {
        return departments.map(dept => dept.name).join(', ');
    };

    const getSelectedDepartmentName = () => {
        if (selectedDepartment === 'all') return 'All Departments';
        const dept = departments.find((d: any) => d._id === selectedDepartment);
        return dept?.name || 'Unknown Department';
    };

    const handleDeleteTask = async () => {
        if (!taskToDelete) return;

        try {
            await dispatch(deleteTaskAssignment(taskToDelete)).unwrap();
            toast.success("Task deleted successfully");
            setDeleteDialogOpen(false);
            setTaskToDelete(null);

            // Refresh tasks after deletion
            if (selectedUser?.user_id?._id) {
                dispatch(fetchTodayTaskAssignmentsByUserId(selectedUser.user_id._id));
            }
        } catch (error: any) {
            toast.error(`Failed to delete task: ${error.message}`);
        }
    };

    const handleEditTask = (task: TaskAssign) => {
        setEditingTaskId(task._id);
        setEditedTask({
            title: task.title,
            description: task.description,
            TAT: task.TAT,
            deadline: task.deadline,
        });
    };

    const handleSaveEdit = async (taskId: string) => {
        try {
            // Create properly typed update data matching TaskAssignment interface
            const updateData: Partial<TaskAssignment> = {
                title: editedTask.title,
                description: editedTask.description,
                TAT: editedTask.TAT,
                deadline: editedTask.deadline,
            };

            // Remove undefined values
            const cleanUpdateData = Object.fromEntries(
                Object.entries(updateData).filter(([_, v]) => v !== undefined)
            );

            await dispatch(updateTaskAssignment({
                id: taskId,
                data: cleanUpdateData
            })).unwrap();

            toast.success("Task updated successfully");
            setEditingTaskId(null);
            setEditedTask({});

            // Refresh tasks after update
            if (selectedUser?.user_id?._id) {
                dispatch(fetchTodayTaskAssignmentsByUserId(selectedUser.user_id._id));
            }
        } catch (error: any) {
            toast.error(`Failed to update task: ${error.message}`);
        }
    };

    const handleCancelEdit = () => {
        setEditingTaskId(null);
        setEditedTask({});
    };

    const renderProof = (proofItems: TaskAssign['proof'] = []) => {
        if (!proofItems || proofItems.length === 0) return null;

        return proofItems.map((item, idx) => {
            if (item.type === "url" || item.type === "URL") {
                return (
                    <div
                        key={idx}
                        className="p-4 bg-blue-50 dark:bg-[#101828] rounded-lg border border-blue-100 mb-3"
                    >
                        <div className="flex items-start gap-3">
                            <LinkIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-sm mb-1">
                                    {item.fieldName || "URL Proof"} - URL Proof
                                </p>
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-sm break-all"
                                >
                                    {item.url}
                                </a>
                            </div>
                        </div>
                    </div>
                );
            } else if (item.type === "file" || item.type === "File") {
                return (
                    <div
                        key={idx}
                        className="p-4 bg-blue-50 dark:bg-[#101828] rounded-lg border border-blue-100 mb-3"
                    >
                        <div className="flex items-start gap-3">
                            <File className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-sm mb-1">
                                    {item.fieldName || "File Proof"} - File Proof
                                </p>
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-sm break-all"
                                >
                                    View File
                                </a>
                            </div>
                        </div>
                    </div>
                );
            } else {
                return (
                    <div
                        key={idx}
                        className="p-4 bg-blue-50 dark:bg-[#101828] rounded-lg border border-blue-100 mb-3"
                    >
                        <div className="flex items-start gap-3">
                            <File className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-sm mb-1">
                                    {item.fieldName || "Text Proof"}
                                </p>
                                <p className="text-sm whitespace-pre-line">
                                    {item.url || JSON.stringify(item)}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            }
        });
    };

    if (usersLoading && !selectedUser) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading users...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen dark:bg-[#101828] bg-gray-50 p-4">
            <div className="w-full max-w-7xl mx-auto">
                {/* All Users View */}
                {!selectedUser && (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                All Members Task
                            </h1>
                            <p className="text-sm text-gray-500">
                                {filteredUsers.length} users found
                            </p>
                        </div>

                        {/* Filters */}
                        <Card className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
                            <CardHeader className="py-4 px-6 border-b border-gray-100">
                                <CardTitle className="text-base font-semibold text-gray-800">Filter & Search Options</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex-1 w-full space-y-1.5">
                                        <Label htmlFor="search-users" className="text-xs text-gray-500 font-medium">
                                            Search Users
                                        </Label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <Input
                                                id="search-users"
                                                placeholder="Search by username or email"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-9 bg-gray-50/50 border-gray-200 shadow-none h-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="w-full md:w-[320px] space-y-1.5">
                                        <Label htmlFor="department-filter" className="text-xs text-gray-500 font-medium">
                                            Filter by Department
                                        </Label>
                                        <Select
                                            value={selectedDepartment}
                                            onValueChange={setSelectedDepartment}
                                            disabled={departmentsLoading || departments.length === 0}
                                        >
                                            <SelectTrigger id="department-filter" className="bg-white border-gray-200 shadow-none h-10">
                                                <SelectValue placeholder="Select Department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Departments</SelectItem>
                                                {departments.map((dept: any) => (
                                                    <SelectItem key={dept._id} value={dept._id}>
                                                        {dept.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button
                                        variant="outline"
                                        className="h-10 px-6 border-gray-200 text-gray-700 hover:bg-gray-50 shadow-none"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setSelectedDepartment('all');
                                        }}
                                    >
                                        Clear Filters
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden mt-6">
                            <CardHeader className="py-4 px-6 border-b border-gray-100">
                                <CardTitle className="text-base font-semibold text-gray-800">All Users</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-gray-50/50">
                                        <TableRow className="hover:bg-transparent border-gray-100">
                                            <TableHead className="py-3 px-6 font-medium text-xs text-gray-500 h-auto">Staff Name</TableHead>
                                            <TableHead className="py-3 px-6 font-medium text-xs text-gray-500 h-auto">Email</TableHead>
                                            <TableHead className="py-3 px-6 font-medium text-xs text-gray-500 h-auto">Role</TableHead>
                                            <TableHead className="py-3 px-6 font-medium text-xs text-gray-500 h-auto">Departments</TableHead>
                                            <TableHead className="py-3 px-6 font-medium text-xs text-gray-500 h-auto">Status</TableHead>
                                            <TableHead className="py-3 px-6 font-medium text-xs text-gray-500 h-auto text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((user) => (
                                            <TableRow key={user._id} className="border-gray-100 hover:bg-gray-50/50 transition-colors">
                                                <TableCell className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8 bg-gray-100 text-gray-700 font-semibold text-xs border border-gray-200">
                                                            <AvatarFallback className="bg-transparent text-gray-700">
                                                                {user.user_id?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium text-sm text-gray-900">{user.user_id?.name || 'Unknown User'}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-sm text-gray-500">{user.user_id?.email || 'N/A'}</TableCell>
                                                <TableCell className="py-4 px-6">
                                                    <Badge variant="secondary" className="bg-gray-100 text-gray-600 font-normal hover:bg-gray-100 rounded-full px-2.5 py-0.5 shadow-none">
                                                        {user.roleDefinitionId?.roleName || 'N/A'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-4 px-6">
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.departments.length > 0 ? (
                                                            user.departments.map(dept => (
                                                                <Badge key={dept._id} variant="secondary" className="bg-blue-50/80 text-blue-600 font-normal hover:bg-blue-50 rounded-full px-2.5 py-0.5 shadow-none">
                                                                    {dept.name}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <Badge variant="secondary" className="bg-blue-50/80 text-blue-600 font-normal hover:bg-blue-50 rounded-full px-2.5 py-0.5 shadow-none">
                                                                All Departments
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-6">
                                                    <Badge 
                                                        variant="secondary" 
                                                        className={user.status === 'active' 
                                                            ? "bg-[#E6F4EA] text-[#1E8E3E] font-medium hover:bg-[#E6F4EA] rounded-full px-3 py-0.5 shadow-none text-xs" 
                                                            : "bg-gray-100 text-gray-600 font-medium hover:bg-gray-100 rounded-full px-3 py-0.5 shadow-none text-xs"}
                                                    >
                                                        {user.status === 'active' ? 'Active' : user.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-4 px-6">
                                                    <div className="flex justify-center">
                                                        <Button
                                                            variant="outline"
                                                            className="h-8 rounded-md px-4 border-gray-300 text-gray-600 font-medium text-xs hover:bg-gray-50 shadow-none bg-white"
                                                            onClick={() => setSelectedUser(user)}
                                                        >
                                                            View Tasks
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {filteredUsers.length === 0 && !usersLoading && (
                                    <div className="text-center py-12">
                                        <Users className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                                        <h3 className="text-sm font-medium text-gray-900">No users found</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {searchTerm || selectedDepartment !== 'all'
                                                ? 'Try adjusting your filters or search term'
                                                : 'No users available'
                                            }
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* User Tasks View */}
                {selectedUser && (
                    <div className="space-y-6">
                        <div className="flex items-center mb-2 mt-4">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="focus:outline-none hover:opacity-80 transition-opacity"
                            >
                                <Image src={movebackIcon} alt="back" className="w-[80px]" />
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {selectedUser.user_id?.name || 'Unknown User'}'s Tasks
                                    </h1>
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-500 font-normal hover:bg-gray-100 rounded-md px-2 shadow-none text-[10px]">
                                        {selectedUser.roleDefinitionId?.roleName || 'N/A'}
                                    </Badge>
                                </div>
                                <p className="text-xs text-gray-400 font-medium tracking-wide">
                                    {getFilteredAssignments().length} tasks found 
                                    {showOnlyToday
                                        ? " (Today)"
                                        : selectedDate && !showOnlyToday
                                            ? ` (${format(selectedDate, "MMM dd, yyyy")})`
                                            : ""}
                                </p>
                            </div>

                            <div className="flex items-center justify-between gap-1 border border-gray-200 rounded-lg px-3 py-1.5 bg-white shadow-sm w-auto">
                                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <button className="flex items-center focus:outline-none p-1">
                                            <Calendar className="mr-1 h-[14px] w-[14px] text-gray-400" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="end">
                                        <CalendarUI
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={(date) => {
                                                if (date) {
                                                    setSelectedDate(date);
                                                    setCalendarOpen(false);
                                                    setShowOnlyToday(false);
                                                }
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                
                                <button  
                                    className="p-1 hover:bg-gray-50 rounded"
                                    onClick={() => {
                                        if (selectedDate) {
                                            const prevDay = new Date(selectedDate);
                                            prevDay.setDate(prevDay.getDate() - 1);
                                            setSelectedDate(prevDay);
                                            setShowOnlyToday(false);
                                        }
                                    }}
                                >
                                    <ChevronDown className="h-[14px] w-[14px] rotate-[90deg] text-gray-400" />
                                </button>
                                
                                <span className="text-xs font-semibold text-gray-800 tracking-wide px-1">
                                    {selectedDate ? format(selectedDate, "dd MMM yyyy") : "Date"}
                                </span>

                                <button  
                                    className="p-1 hover:bg-gray-50 rounded"
                                    onClick={() => {
                                        if (selectedDate) {
                                            const nextDay = new Date(selectedDate);
                                            nextDay.setDate(nextDay.getDate() + 1);
                                            setSelectedDate(nextDay);
                                            setShowOnlyToday(false);
                                        }
                                    }}
                                >
                                    <ChevronDown className="h-[14px] w-[14px] rotate-[-90deg] text-gray-400" />
                                </button>
                            </div>
                        </div>

                        <div className="bg-[#fafafa] border border-gray-100 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900 text-[15px]">Task Queue</span>
                            <span className="text-[13px] text-[#94a3b8] font-medium ml-1">
                                Task Assigned to {selectedUser.user_id?.name || 'Unknown'} {selectedDate ? `(${format(selectedDate, "MMMM dd,yyyy")})` : ""}
                            </span>
                        </div>

                        <div className="mt-2 pb-12">
                            {tasksLoading ? (
                                <div className="flex justify-center items-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                    <span className="ml-2 text-gray-500">Loading tasks...</span>
                                </div>
                            ) : getFilteredAssignments().length > 0 ? (
                                <div className="space-y-4">
                                {getFilteredAssignments().map((assignment: TaskAssign) => {
                                    const isEditing = editingTaskId === assignment._id;
                                    const isExpanded = expandedCards.has(assignment._id);

                                    return (
                                        <Card key={assignment._id} className="bg-white shadow-none border border-gray-200 rounded-xl overflow-hidden">
                                            <CardContent className="p-6">
                                                {/* Top Layer */}
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                                                    <div className="flex-1 pr-4">
                                                        <h3 className="text-base text-gray-800 leading-snug">
                                                            <span className="font-bold text-gray-900">title:</span> {assignment.title || "No Title"}
                                                        </h3>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <Badge className="bg-[#E6F4EA] text-[#1E8E3E] font-medium hover:bg-[#E6F4EA] rounded-full px-3 py-1 shadow-none tracking-[0.03em] text-[10px] uppercase">
                                                            STATUS: {assignment.status}
                                                        </Badge>
                                                        <Badge className="bg-gray-100 text-gray-600 font-medium hover:bg-gray-100 rounded-full px-3 py-1 shadow-none tracking-[0.03em] text-[10px] uppercase">
                                                            TIMER: {assignment.timer_status}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-400 mb-6 font-medium">
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="h-3.5 w-3.5" />
                                                        <span>Assigned by: {assignment.assigned_by_user_id?.name?.toUpperCase() || "UNKNOWN"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        <span>{format(new Date(assignment.createdAt), "MMM dd, yyyy HH:mm")}</span>
                                                    </div>
                                                </div>
                                                {/* Metrics grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 border border-gray-100 rounded-lg bg-[rgb(250,250,250)] mb-5 p-4">
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 mb-1">TAT</p>
                                                        {isEditing ? (
                                                            <Input
                                                                type="number"
                                                                value={editedTask.TAT || ""}
                                                                onChange={(e) => setEditedTask({...editedTask, TAT: parseInt(e.target.value) || 0})}
                                                                className="h-8 max-w-[120px] bg-white text-sm"
                                                            />
                                                        ) : (
                                                            <p className="font-medium text-gray-900 text-[13px]">{assignment.TAT ? `${assignment.TAT} mins` : "N/A"}</p>
                                                        )}
                                                        <p className="text-[10px] text-[#3b82f6] font-medium mt-1">
                                                            Original TAT: {assignment.previous_TAT?.[0] ?? assignment.TAT} mins
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 mb-1">Deadline</p>
                                                        {isEditing ? (
                                                            <div className="flex items-center gap-2 bg-white rounded-md border border-gray-200 focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden pr-2">
                                                                <div className="pl-3 py-1.5 border-r border-gray-200 bg-gray-50 flex items-center">
                                                                    <Calendar className="h-4 w-4 text-gray-500" />
                                                                </div>
                                                                <Input
                                                                    type="datetime-local"
                                                                    value={editedTask.deadline ? format(new Date(editedTask.deadline), "yyyy-MM-dd'T'HH:mm") : ""}
                                                                    onChange={(e) => setEditedTask({...editedTask, deadline: e.target.value})}
                                                                    className="h-8 border-none focus-visible:ring-0 shadow-none text-xs"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                {assignment.deadline ? (
                                                                    <p className="font-medium text-gray-900 text-[13px]">
                                                                        {format(new Date(assignment.deadline), "MMM dd, h:mm a")}
                                                                    </p>
                                                                ) : (
                                                                    <p className="font-medium text-gray-900 text-sm">N/A</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 mb-1">Stuck Records</p>
                                                        <div className="flex flex-col gap-1">
                                                            {assignment.previous_TAT && assignment.previous_TAT.length > 0 ? (
                                                                assignment.previous_TAT.map((value: number, idx: number) => (
                                                                    <span key={idx} className="font-medium text-[#ef4444] text-[13px]">{value} mins</span>
                                                                ))
                                                            ) : (
                                                                <span className="font-medium text-[#ef4444] text-[13px]">None</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions Row */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        {isEditing ? (
                                                            <>
                                                                <button 
                                                                    onClick={handleCancelEdit}
                                                                    className="flex items-center gap-1.5 text-[13px] font-medium text-[#9ca3af] hover:text-gray-700 focus:outline-none transition-colors"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                    Cancel
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleSaveEdit(assignment._id)}
                                                                    className="flex items-center gap-1.5 text-[13px] font-medium text-blue-500 hover:text-blue-600 focus:outline-none transition-colors"
                                                                >
                                                                    <Save className="w-4 h-4" />
                                                                    Save
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleEditTask(assignment)}
                                                                className="flex items-center gap-1.5 text-[13px] font-medium text-[#9ca3af] hover:text-gray-700 focus:outline-none transition-colors"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                                Edit
                                                            </button>
                                                        )}

                                                        <Dialog open={deleteDialogOpen && taskToDelete === assignment._id} onOpenChange={(open) => {
                                                            setDeleteDialogOpen(open);
                                                            if (!open) setTaskToDelete(null);
                                                        }}>
                                                            <DialogTrigger asChild>
                                                                <button 
                                                                    onClick={() => setTaskToDelete(assignment._id)}
                                                                    className="flex items-center gap-1.5 text-[13px] font-medium text-[#ef4444] hover:text-red-600 focus:outline-none transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                    Delete
                                                                </button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>Delete Task</DialogTitle>
                                                                    <DialogDescription>
                                                                        Are you sure you want to delete this task? This action cannot be undone.
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <DialogFooter>
                                                                    <Button variant="outline" onClick={() => {
                                                                        setDeleteDialogOpen(false);
                                                                        setTaskToDelete(null);
                                                                    }}>Cancel</Button>
                                                                    <Button variant="destructive" onClick={handleDeleteTask}>Delete Task</Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>

                                                    <button 
                                                        onClick={() => toggleCard(assignment._id)}
                                                        className="p-1 text-[#9ca3af] hover:text-gray-600 focus:outline-none rounded-full transition-colors"
                                                    >
                                                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                    </button>
                                                </div>

                                                {/* Expanded Proof Section */}
                                                {isExpanded && (
                                                    <div className="mt-5 pt-5 border-t border-gray-100">
                                                        <h4 className="text-sm text-gray-700 mb-3">
                                                            Task Proof Requiremnets:
                                                        </h4>
                                                        
                                                        {assignment.proof?.length > 0 ? (
                                                            <div className="space-y-3">
                                                                {assignment.proof.map((item, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between p-4 bg-[#fbfbfb] rounded-lg border border-gray-200">
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="w-10 h-10 bg-[#e5e7eb] rounded flex items-center justify-center shrink-0">
                                                                                <File className="w-5 h-5 text-gray-500" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[13px] text-gray-900 mb-0.5">
                                                                                    <span className="font-semibold">{item.fieldName || "Screenshot - File"}</span> Proof
                                                                                </p>
                                                                                <p className="text-[10px] text-[#9ca3af]">
                                                                                    Type: {item.type === "url" || item.type === "URL" ? "URL" : "Image"}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        {item.url && (
                                                                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors bg-transparent border-0 pl-4 py-2">
                                                                                View File
                                                                                <Eye className="w-4 h-4 ml-0.5" />
                                                                            </a>
                                                                        )}
                                                                    </div> 
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-gray-400 italic">No proof requirements added for this task.</p>
                                                        )}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
                                    <File className="mx-auto h-12 w-12 text-gray-300" />
                                    <h3 className="mt-4 text-sm font-medium text-gray-900">No tasks found</h3>
                                    <p className="text-gray-500 mt-1 text-sm">
                                        {showOnlyToday
                                            ? "No tasks assigned for today."
                                            : selectedDate
                                                ? `No tasks assigned for ${format(selectedDate, "MMM dd, yyyy")}.`
                                                : "No tasks found for this user."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MembersTasks;

// "use client";
// import React, { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { useAppDispatch, useAppSelector } from "@/store/hooks";
// import { fetchUsers } from '@/features/user/userSlice';
// import { fetchDepartments } from '@/features/departments/departmentSlice';
// import { fetchTodayTaskAssignmentsByUserId } from "@/features/taskAssignments/taskAssignmentSlice";
// import { toast } from "sonner";
// import { format, isToday, isSameDay } from "date-fns";
//
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import {
//   Eye,
//   RefreshCw,
//   ChevronDown,
//   ChevronUp,
//   File,
//   Image as ImageIcon,
//   Link as LinkIcon,
//   Clock,
//   Users,
//   CheckCircle,
//   ArrowLeft,
//   Search,
//   Calendar,
//   Filter,
// } from "lucide-react";
// import { Separator } from "@/components/ui/separator";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Input } from "@/components/ui/input";
// import { Loader2 } from "lucide-react";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { Label } from '@/components/ui/label';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { Calendar as CalendarUI } from "@/components/ui/calendar";
//
// interface User {
//   _id: string;
//   user_id: {
//     _id: string;
//     name: string;
//     email: string;
//     phoneNumber: number;
//     isActive: boolean;
//     id: string;
//   };
//   roleDefinitionId: {
//     _id: string;
//     roleName: string;
//     hierarchyLevel: number;
//   };
//   departments: Array<{
//     _id: string;
//     name: string;
//     alias: string;
//   }>;
//   status: string;
// }
//
// interface ProofItem {
//   type?: string;
//   fieldName?: string;
//   proof_type?: string;
//   url?: string;
//   text?: string;
//   original_name?: string;
//   field_name?: string;
// }
//
// interface TaskAssign {
//   createdAt: string | number | Date;
//   _id: string;
//   title: string;
//   previous_TAT?: number[];
//   description: string;
//   TAT: number;
//   deadline: string;
//   proof: ProofItem[];
//   assigned_by_user_id: any;
//   assigned_to_employee_id: any;
//   status: 'Pending' | 'Overdue' | 'Completed';
//   timer_status: 'Todo' | 'InProgress' | 'Stuck' | 'Done';
// }
//
// const MembersTasks = () => {
//   const router = useRouter();
//   const dispatch = useAppDispatch();
//
//   // Use users and departments from their respective slices
//   const { users, loading: usersLoading } = useAppSelector(state => state.users);
//   const { departments, loading: departmentsLoading } = useAppSelector(state => state.departments);
//   const { dailyAssignments: memberTasks, loading: tasksLoading } = useAppSelector(
//     (state) => state.taskAssignments
//   );
//
//   const [selectedUser, setSelectedUser] = useState<User | null>(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
//   const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
//   const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
//   const [showOnlyToday, setShowOnlyToday] = useState(false);
//   const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
//   const [calendarOpen, setCalendarOpen] = useState(false);
//
//   // Fetch all users and departments on component mount
//   useEffect(() => {
//     dispatch(fetchUsers());
//     dispatch(fetchDepartments({}));
//   }, [dispatch]);
//
//   // Filter users based on search term and department
//   useEffect(() => {
//     if (users.length > 0) {
//       let filtered = [...users];
//
//       // Filter by department
//       if (selectedDepartment && selectedDepartment !== 'all') {
//         filtered = filtered.filter(user =>
//           user.departments.some(dept => dept._id === selectedDepartment)
//         );
//       }
//
//       // Filter by search term
//       if (searchTerm) {
//         filtered = filtered.filter(user =>
//           user.user_id.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           user.user_id.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           user.roleDefinitionId.roleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           user.departments.some(dept =>
//             dept.name.toLowerCase().includes(searchTerm.toLowerCase())
//           )
//         );
//       }
//
//       setFilteredUsers(filtered);
//     }
//   }, [users, searchTerm, selectedDepartment]);
//
//   // Fetch tasks when a user is selected
//   useEffect(() => {
//     if (selectedUser) {
//       dispatch(fetchTodayTaskAssignmentsByUserId(selectedUser.user_id._id));
//     }
//   }, [selectedUser, dispatch]);
//
//   const getFilteredAssignments = () => {
//     if (!memberTasks) return [];
//
//     let filtered = memberTasks;
//     if (selectedDate && !showOnlyToday) {
//       filtered = memberTasks.filter((assignment: TaskAssign) => {
//         const taskDate = new Date(assignment.createdAt);
//         return isSameDay(taskDate, selectedDate);
//       });
//     } else if (showOnlyToday) {
//       filtered = memberTasks.filter((assignment: TaskAssign) => {
//         const taskDate = new Date(assignment.createdAt);
//         return isToday(taskDate);
//       });
//     }
//
//     return filtered;
//   };
//
//   const toggleCard = (assignmentId: string) => {
//     const newExpanded = new Set(expandedCards);
//     if (newExpanded.has(assignmentId)) {
//       newExpanded.delete(assignmentId);
//     } else {
//       newExpanded.add(assignmentId);
//     }
//     setExpandedCards(newExpanded);
//   };
//
//   const getStatusVariant = (status: string) => {
//     switch (status) {
//       case "Pending":
//       case "Todo":
//         return "secondary";
//       case "Completed":
//       case "Done":
//         return "default";
//       case "Overdue":
//       case "Stuck":
//         return "destructive";
//       case "InProgress":
//         return "outline";
//       default:
//         return "outline";
//     }
//   };
//
//   const getDepartmentsText = (departments: Array<{name: string}>) => {
//     return departments.map(dept => dept.name).join(', ');
//   };
//
//   const getSelectedDepartmentName = () => {
//     if (selectedDepartment === 'all') return 'All Departments';
//     const dept = departments.find((d: any) => d._id === selectedDepartment);
//     return dept?.name || 'Unknown Department';
//   };
//
//   const renderProof = (proofItems: any[] = []) => {
//     return proofItems.map((item, idx) => {
//       if (item.field_name) {
//         return (
//           <div
//             key={idx}
//             className="p-4 bg-blue-50 dark:bg-[#101828] rounded-lg border border-blue-100 mb-3"
//           >
//             <div className="flex items-start gap-3">
//               {item.proof_type === "url" ? (
//                 <LinkIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
//               ) : (
//                 <File className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
//               )}
//               <div>
//                 <p className="font-medium text-sm mb-1">
//                   {item.field_name} -{" "}
//                   {item.proof_type === "url" ? "URL Proof" : "File Proof"}
//                 </p>
//                 {item.proof_type === "url" ? (
//                   <a
//                     href={item.url}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="text-blue-600 hover:underline text-sm break-all"
//                   >
//                     {item.url}
//                   </a>
//                 ) : (
//                   <>
//                     <p className="text-sm mb-1">{item.original_name}</p>
//                     <a
//                       href={item.url}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-blue-600 hover:underline text-sm break-all"
//                     >
//                       View File
//                     </a>
//                   </>
//                 )}
//               </div>
//             </div>
//           </div>
//         );
//       } else if (item.type === "URL" || item.type === "url") {
//         return (
//           <div
//             key={idx}
//             className="p-4 bg-blue-50 dark:bg-[#101828] rounded-lg border border-blue-100 mb-3"
//           >
//             <div className="flex items-start gap-3">
//               <LinkIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
//               <div>
//                 <p className="font-medium text-sm mb-1">URL Proof</p>
//                 <a
//                   href={item.url}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="text-blue-600 hover:underline text-sm break-all"
//                 >
//                   {item.url}
//                 </a>
//               </div>
//             </div>
//           </div>
//         );
//       } else {
//         return (
//           <div
//             key={idx}
//             className="p-4 bg-blue-50 dark:bg-[#101828] rounded-lg border border-blue-100 mb-3"
//           >
//             <div className="flex items-start gap-3">
//               <File className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
//               <div>
//                 <p className="font-medium text-sm mb-1">Text Proof</p>
//                 <p className="text-sm whitespace-pre-line">
//                   {item.text || JSON.stringify(item)}
//                 </p>
//               </div>
//             </div>
//           </div>
//         );
//       }
//     });
//   };
//
//   if (usersLoading && !selectedUser) {
//     return (
//       <div className="flex justify-center items-center min-h-screen">
//         <Loader2 className="h-8 w-8 animate-spin" />
//         <span className="ml-2">Loading users...</span>
//       </div>
//     );
//   }
//
//   return (
//     <div className="min-h-screen dark:bg-[#101828] bg-gray-50 p-4">
//       <div className="w-full max-w-7xl mx-auto">
//         {/* All Users View */}
//         {!selectedUser && (
//           <div className="space-y-6">
//             <div className="mb-6">
//               <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
//                 All Users
//               </h1>
//               <p className="text-muted-foreground">
//                 {filteredUsers.length} users found
//                 {selectedDepartment !== 'all' && ` in ${getSelectedDepartmentName()}`}
//               </p>
//             </div>
//
//             {/* Filters */}
//             <div className="flex flex-col md:flex-row gap-4">
//               <div className="w-full md:w-[250px]">
//                 <Label htmlFor="department-filter" className="text-sm font-medium">
//                   Filter by Department
//                 </Label>
//                 <Select
//                   value={selectedDepartment}
//                   onValueChange={setSelectedDepartment}
//                   disabled={departmentsLoading || departments.length === 0}
//                 >
//                   <SelectTrigger id="department-filter" className="mt-1">
//                     <Filter className="h-4 w-4 mr-2" />
//                     <SelectValue placeholder="Select Department" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">All Departments</SelectItem>
//                     {departments.map((dept: any) => (
//                       <SelectItem key={dept._id} value={dept._id}>
//                         {dept.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//
//               <div className="relative max-w-sm flex-1">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
//                 <Input
//                   placeholder="Search users..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-10 mt-6"
//                 />
//               </div>
//             </div>
//
//             <Card className="shadow-lg">
//               <CardHeader>
//                 <CardTitle>All Users</CardTitle>
//                 <CardDescription>
//                   Select a user to view their tasks
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>User</TableHead>
//                       <TableHead>Email</TableHead>
//                       <TableHead>Role</TableHead>
//                       <TableHead>Departments</TableHead>
//                       <TableHead>Status</TableHead>
//                       <TableHead className="text-right">Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {filteredUsers.map((user) => (
//                       <TableRow key={user._id}>
//                         <TableCell>
//                           <div className="flex items-center gap-3">
//                             <Avatar>
//                               <AvatarFallback>
//                                 {user.user_id.name.split(' ').map(n => n[0]).join('')}
//                               </AvatarFallback>
//                             </Avatar>
//                             <div>
//                               <p className="font-medium">{user.user_id.name}</p>
//                             </div>
//                           </div>
//                         </TableCell>
//                         <TableCell>{user.user_id.email}</TableCell>
//                         <TableCell>
//                           <Badge variant="outline">{user.roleDefinitionId.roleName}</Badge>
//                         </TableCell>
//                         <TableCell>
//                           <div className="flex flex-wrap gap-1">
//                             {user.departments.map(dept => (
//                               <Badge key={dept._id} variant="secondary" className="text-xs">
//                                 {dept.name}
//                               </Badge>
//                             ))}
//                           </div>
//                         </TableCell>
//                         <TableCell>
//                           <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
//                             {user.status}
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="text-right">
//                           <Button
//                             size="sm"
//                             onClick={() => setSelectedUser(user)}
//                           >
//                             <Eye className="h-4 w-4 mr-2" />
//                             View Tasks
//                           </Button>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//
//                 {filteredUsers.length === 0 && !usersLoading && (
//                   <div className="text-center py-8">
//                     <Users className="mx-auto h-12 w-12 text-gray-400" />
//                     <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
//                     <p className="mt-1 text-sm text-gray-500">
//                       {searchTerm || selectedDepartment !== 'all'
//                         ? 'Try adjusting your filters'
//                         : 'No users available'
//                       }
//                     </p>
//                     {selectedDepartment !== 'all' && (
//                       <Button
//                         variant="link"
//                         onClick={() => setSelectedDepartment('all')}
//                         className="mt-2"
//                       >
//                         Show all departments
//                       </Button>
//                     )}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>
//         )}
//
//         {/* User Tasks View */}
//         {selectedUser && (
//           <div className="space-y-6">
//             <div className="mb-6">
//               <Button
//                 variant="outline"
//                 onClick={() => setSelectedUser(null)}
//                 className="mb-4"
//               >
//                 <ArrowLeft className="h-4 w-4 mr-2" />
//                 Back to Users
//               </Button>
//               <div className="flex items-center gap-4 mb-2">
//                 <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
//                   {selectedUser.user_id.name}'s Tasks
//                 </h1>
//                 <Badge variant="secondary">
//                   {selectedUser.roleDefinitionId.roleName}
//                 </Badge>
//               </div>
//               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//                 <p className="text-muted-foreground">
//                   {getFilteredAssignments().length} tasks found
//                   {showOnlyToday
//                     ? " (Today)"
//                     : selectedDate && !showOnlyToday
//                       ? ` (${format(selectedDate, "MMM dd, yyyy")})`
//                       : ""}
//                 </p>
//
//                 <div className="flex items-center gap-3">
//                   <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
//                     <PopoverTrigger asChild>
//                       <Button
//                         variant={"outline"}
//                         className="w-[240px] justify-start text-left font-normal"
//                         disabled={showOnlyToday}
//                       >
//                         <Calendar className="mr-2 h-4 w-4" />
//                         {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-auto p-0" align="start">
//                       <CalendarUI
//                         mode="single"
//                         selected={selectedDate}
//                         onSelect={(date) => {
//                           setSelectedDate(date);
//                           setCalendarOpen(false);
//                           setShowOnlyToday(false);
//                         }}
//                         initialFocus
//                       />
//                     </PopoverContent>
//                   </Popover>
//
//                   <Button
//                     variant={showOnlyToday ? "default" : "outline"}
//                     size="sm"
//                     onClick={() => {
//                       setShowOnlyToday(!showOnlyToday);
//                       if (!showOnlyToday) {
//                         setSelectedDate(new Date());
//                       }
//                     }}
//                   >
//                     {showOnlyToday ? (
//                       <>
//                         <CheckCircle className="h-4 w-4 mr-2" />
//                         Today Only
//                       </>
//                     ) : (
//                       <>
//                         <Clock className="h-4 w-4 mr-2" />
//                         Show Today
//                       </>
//                     )}
//                   </Button>
//                 </div>
//               </div>
//             </div>
//
//             <Card className="shadow-lg">
//               <CardHeader className="pb-4">
//                 <div className="flex items-center gap-3">
//                   <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
//                     <File className="w-5 h-5 text-blue-600" />
//                   </div>
//                   <div>
//                     <CardTitle className="text-xl">Task Queue</CardTitle>
//                     <CardDescription>
//                       Tasks assigned to {selectedUser.user_id.name}
//                       {showOnlyToday
//                         ? " (Today)"
//                         : selectedDate && ` (${format(selectedDate, "MMM dd, yyyy")})`}
//                     </CardDescription>
//                   </div>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => dispatch(fetchTodayTaskAssignmentsByUserId(selectedUser.user_id._id))}
//                     className="ml-auto"
//                   >
//                     <RefreshCw className="h-4 w-4 mr-2" />
//                     Refresh
//                   </Button>
//                 </div>
//               </CardHeader>
//
//               <CardContent className="p-0">
//                 <ScrollArea className="h-[600px]">
//                   <div className="space-y-0">
//                     {tasksLoading ? (
//                       <div className="flex justify-center items-center py-8">
//                         <Loader2 className="h-6 w-6 animate-spin" />
//                         <span className="ml-2">Loading tasks...</span>
//                       </div>
//                     ) : getFilteredAssignments().length > 0 ? (
//                       getFilteredAssignments().map((assignment: TaskAssign, index: number) => {
//                         return (
//                           <div key={assignment._id}>
//                             <div className="p-6">
//                               <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
//                                 <div className="flex-1">
//                                   <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
//                                     {assignment.title || "No Title"}
//                                   </h3>
//                                   <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
//                                     <div className="flex items-center gap-1">
//                                       <Users className="h-4 w-4" />
//                                       <span>Assigned by: {assignment.assigned_by_user_id?.name || "Unknown"}</span>
//                                     </div>
//                                     <div className="flex items-center gap-1">
//                                       <Clock className="w-4 h-4" />
//                                       <span>Created: {format(new Date(assignment.createdAt), "MMM dd, h:mm a")}</span>
//                                     </div>
//                                   </div>
//                                               <div className="flex flex-row items-center gap-4 mt-2">
//                                     {/* Original TAT Badge */}
//                                     <Badge variant="outline" className="text-blue-600 text-xs">
//                                       Original TAT: {assignment.previous_TAT?.[0] ?? assignment.TAT} mins
//                                     </Badge>
//
//                                     {/* Stuck Records Label and Values - horizontal */}
//                                     <div className="flex flex-row items-center gap-2 text-xs font-semibold text-red-600">
//                                       <span>Stuck Records:</span>
//                                       {assignment.previous_TAT && assignment.previous_TAT.length > 0 ? (
//                                         assignment.previous_TAT.map((value: number | string, index: number) => (
//                                           <span key={index} className="ml-1">• {value} mins</span>
//                                         ))
//                                       ) : (
//                                         <span>None</span>
//                                       )}
//                                     </div>
//
//                                   </div>
//                                 </div>
//
//                                 <div className="flex items-center gap-3">
//                                   <Badge variant={getStatusVariant(assignment.status)}>
//                                     Status: {assignment.status}
//                                   </Badge>
//                                   <Badge variant={getStatusVariant(assignment.timer_status)}>
//                                     Timer: {assignment.timer_status}
//                                   </Badge>
//                                   <Button
//                                     variant="ghost"
//                                     size="sm"
//                                     onClick={() => toggleCard(assignment._id)}
//                                     className="p-1 h-8 w-8"
//                                   >
//                                     {expandedCards.has(assignment._id) ? (
//                                       <ChevronUp className="w-4 h-4" />
//                                     ) : (
//                                       <ChevronDown className="w-4 h-4" />
//                                     )}
//                                   </Button>
//                                 </div>
//                               </div>
//
//                               <div className="mb-4">
//                                 <div className="flex flex-col sm:flex-row gap-4 text-sm mb-3">
//                                   <div className="flex gap-2">
//                                     <span className="text-muted-foreground">
//                                       Task Title:
//                                     </span>
//                                     <span className="font-medium">
//                                       {assignment.title || "N/A"}
//                                     </span>
//                                   </div>
//                                   <div className="flex gap-2">
//                                     <span className="text-muted-foreground">
//                                       TAT:
//                                     </span>
//                                     <span className="font-medium">
//                                       {assignment.TAT
//                                         ? `${assignment.TAT} mins`
//                                         : "N/A"}
//                                     </span>
//                                   </div>
//                                   <div className="flex gap-2">
//                                     <span className="text-muted-foreground">
//                                       Deadline:
//                                     </span>
//                                     <span className="font-medium">
//                                       {assignment.deadline
//                                         ? format(new Date(assignment.deadline), "MMM dd, yyyy")
//                                         : "N/A"}
//                                     </span>
//                                   </div>
//                                 </div>
//                                 <Card className="bg-muted/30">
//                                   <CardContent className="p-3">
//                                     <p className="text-sm leading-relaxed">
//                                       {assignment.description || "No description provided"}
//                                     </p>
//                                   </CardContent>
//                                 </Card>
//                               </div>
//
//                               {expandedCards.has(assignment._id) && (
//                                 <div className="space-y-4">
//                                   <Separator />
//
//                                   {assignment.proof?.length > 0 && (
//                                     <div>
//                                       <div className="flex items-center gap-2 mb-3">
//                                         <ImageIcon className="w-4 h-4 text-blue-600" />
//                                         <h4 className="font-medium text-sm">
//                                           Task Proof Requirements:
//                                         </h4>
//                                       </div>
//
//                                       <div className="space-y-3">
//                                         {renderProof(assignment.proof)}
//                                       </div>
//                                     </div>
//                                   )}
//                                 </div>
//                               )}
//                             </div>
//                             {index < getFilteredAssignments().length - 1 && (
//                               <Separator />
//                             )}
//                           </div>
//                         );
//                       })
//                     ) : (
//                       <div className="text-center py-8">
//                         <File className="mx-auto h-12 w-12 text-gray-400" />
//                         <p className="text-muted-foreground mt-2">
//                           {showOnlyToday
//                             ? "No tasks found for today"
//                             : selectedDate
//                               ? `No tasks found for ${format(selectedDate, "MMM dd, yyyy")}`
//                               : "No tasks found for this user"}
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 </ScrollArea>
//               </CardContent>
//             </Card>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };
//
// export default MembersTasks;
