"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    fetchUserHierarchy,
    selectHierarchyUsers,
    selectHierarchyLoading,
    selectUsersError
} from '@/features/user/userSlice';
import {
    fetchTodayTaskAssignmentsByUserId,
    deleteTaskAssignment,
    updateTaskAssignment,
    selectDailyTaskAssignments,
    selectTaskAssignmentLoading,
    TaskAssignment
} from "@/features/taskAssignments/taskAssignmentSlice";
import { toast } from "sonner";
import { format, isToday, parseISO, isSameDay } from "date-fns";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
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
    FileText,
    Image as ImageIcon,
    Link as LinkIcon,
    Clock,
    Users,
    CheckCircle,
    ArrowLeft,
    Search,
    Calendar,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Types
interface HierarchyUser {
    userId: string;
    name: string;
    email: string;
    departmentId?: string;
    role: string;
    hierarchyLevel: number;
    parentRoleId?: string;
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

const TasksAssigned = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const hierarchyUsers = useAppSelector(selectHierarchyUsers);
    const hierarchyLoading = useAppSelector(selectHierarchyLoading);
    const hierarchyError = useAppSelector(selectUsersError);

    const memberTasks = useAppSelector(selectDailyTaskAssignments);
    const tasksLoading = useAppSelector(selectTaskAssignmentLoading);

    const [selectedUser, setSelectedUser] = useState<HierarchyUser | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
    const [showOnlyToday, setShowOnlyToday] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [filteredUsers, setFilteredUsers] = useState<HierarchyUser[]>([]);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editedTask, setEditedTask] = useState<Partial<TaskAssign>>({});
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

    useEffect(() => {
        if (hierarchyUsers) {
            const filtered = hierarchyUsers.filter(user =>
                user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.role?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredUsers(filtered);
        }
    }, [hierarchyUsers, searchTerm]);

    useEffect(() => {
        dispatch(fetchUserHierarchy());
    }, [dispatch]);

    useEffect(() => {
        if (selectedUser) {
            dispatch(fetchTodayTaskAssignmentsByUserId(selectedUser.userId));
        }
    }, [selectedUser, dispatch]);

    useEffect(() => {
        if (hierarchyError) {
            toast.error(`Failed to load hierarchy users: ${hierarchyError}`);
        }
    }, [hierarchyError]);

    const getFilteredAssignments = () => {
        if (!memberTasks) return [];

        let filtered = memberTasks as TaskAssign[];
        if (selectedDate && !showOnlyToday) {
            filtered = memberTasks.filter((assignment: TaskAssign) => {
                const taskDate = new Date(assignment.createdAt);
                return isSameDay(taskDate, selectedDate);
            }) as TaskAssign[];
        } else if (showOnlyToday) {
            filtered = memberTasks.filter((assignment: TaskAssign) => {
                const taskDate = new Date(assignment.createdAt);
                return isToday(taskDate);
            }) as TaskAssign[];
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

    const getHierarchyLevelColor = (level: number) => {
        switch (level) {
            case 1:
            case 2:
                return "bg-purple-100 text-purple-800";
            case 3:
            case 4:
                return "bg-blue-100 text-blue-800";
            case 5:
            case 6:
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const handleDeleteTask = async () => {
        if (!taskToDelete) return;

        try {
            await dispatch(deleteTaskAssignment(taskToDelete)).unwrap();
            toast.success("Task deleted successfully");
            setDeleteDialogOpen(false);
            setTaskToDelete(null);

            // Refresh tasks after deletion
            if (selectedUser) {
                dispatch(fetchTodayTaskAssignmentsByUserId(selectedUser.userId));
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
            if (selectedUser) {
                dispatch(fetchTodayTaskAssignmentsByUserId(selectedUser.userId));
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
                        className="p-4 bg-blue-50 dark:bg-[#101828]  rounded-lg border border-blue-100 mb-3"
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
                            <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
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
                            <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
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

    if (hierarchyLoading && !selectedUser) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading hierarchy users...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen dark:bg-[#101828] bg-gray-50 p-4">
            <div className="w-full max-w-7xl mx-auto">
                {!selectedUser && (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                Team Hierarchy
                            </h1>
                            <p className="text-muted-foreground">
                                {filteredUsers.length} users found in your hierarchy
                            </p>
                        </div>

                        <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Hierarchy Users</CardTitle>
                                <CardDescription>
                                    Select a user to view their tasks and assignments
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Level</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((user) => (
                                            <TableRow key={user.userId}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar>
                                                            <AvatarFallback>
                                                                {user.name.split(' ').map(n => n[0]).join('')}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium">{user.name}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{user.role}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        className={getHierarchyLevelColor(user.hierarchyLevel)}
                                                    >
                                                        Level {user.hierarchyLevel}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => setSelectedUser(user)}
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Tasks
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {filteredUsers.length === 0 && !hierarchyLoading && (
                                    <div className="text-center py-8">
                                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {searchTerm ? 'Try adjusting your search term' : 'No users available in your hierarchy'}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {selectedUser && (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedUser(null)}
                                className="mb-4"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Hierarchy
                            </Button>
                            <div className="flex items-center gap-4 mb-2">
                                <h1 className="text-4xl font-bold text-gray-900">
                                    {selectedUser.name}'s Tasks
                                </h1>
                                <Badge
                                    variant="secondary"
                                    className={getHierarchyLevelColor(selectedUser.hierarchyLevel)}
                                >
                                    {selectedUser.role} - Level {selectedUser.hierarchyLevel}
                                </Badge>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <p className="text-muted-foreground">
                                    {getFilteredAssignments().length} tasks found
                                    {showOnlyToday
                                        ? " (Today)"
                                        : selectedDate && !showOnlyToday
                                            ? ` (${format(selectedDate, "MMM dd, yyyy")})`
                                            : ""}
                                </p>

                                <div className="flex items-center gap-3">
                                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className="w-[240px] justify-start text-left font-normal"
                                                disabled={showOnlyToday}
                                            >
                                                <Calendar className="mr-2 h-4 w-4" />
                                                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <CalendarUI
                                                mode="single"
                                                selected={selectedDate}
                                                onSelect={(date) => {
                                                    setSelectedDate(date);
                                                    setCalendarOpen(false);
                                                    setShowOnlyToday(false);
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    <Button
                                        variant={showOnlyToday ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                            setShowOnlyToday(!showOnlyToday);
                                            if (!showOnlyToday) {
                                                setSelectedDate(new Date());
                                            }
                                        }}
                                    >
                                        {showOnlyToday ? (
                                            <>
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Today Only
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="h-4 w-4 mr-2" />
                                                Show Today
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <Card className="shadow-lg">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Task Queue</CardTitle>
                                        <CardDescription>
                                            Tasks assigned to {selectedUser.name}
                                            {showOnlyToday
                                                ? " (Today)"
                                                : selectedDate && ` (${format(selectedDate, "MMM dd, yyyy")})`}
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => dispatch(fetchTodayTaskAssignmentsByUserId(selectedUser.userId))}
                                        className="ml-auto"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Refresh
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                <ScrollArea className="h-[600px]">
                                    <div className="space-y-0">
                                        {tasksLoading ? (
                                            <div className="flex justify-center items-center py-8">
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                                <span className="ml-2">Loading tasks...</span>
                                            </div>
                                        ) : getFilteredAssignments().length > 0 ? (
                                            getFilteredAssignments().map((assignment: TaskAssign, index: number) => {
                                                const isEditing = editingTaskId === assignment._id;

                                                return (
                                                    <div key={assignment._id}>
                                                        <div className="p-6">
                                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                                                                <div className="flex-1">
                                                                    {isEditing ? (
                                                                        <Input
                                                                            value={editedTask.title || ""}
                                                                            onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
                                                                            className="mb-2"
                                                                            placeholder="Task Title"
                                                                        />
                                                                    ) : (
                                                                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                                                                            {assignment.title || "No Title"}
                                                                        </h3>
                                                                    )}

                                                                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                                                        <div className="flex items-center gap-1">
                                                                            <Users className="h-4 w-4" />
                                                                            <span>Assigned by: {assignment.assigned_by_user_id?.name || "Unknown"}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <Clock className="w-4 h-4" />
                                                                            <span>Created: {format(new Date(assignment.createdAt), "MMM dd, h:mm a")}</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex flex-row items-center gap-4 mt-2">
                                                                        <Badge variant="outline" className="text-blue-600 text-xs">
                                                                            Original TAT: {assignment.previous_TAT?.[0] ?? assignment.TAT} mins
                                                                        </Badge>

                                                                        <div className="flex flex-row items-center gap-2 text-xs font-semibold text-red-600">
                                                                            <span>Stuck Records:</span>
                                                                            {assignment.previous_TAT && assignment.previous_TAT.length > 0 ? (
                                                                                assignment.previous_TAT.map((value: number, idx: number) => (
                                                                                    <span key={idx} className="ml-1">• {value} mins</span>
                                                                                ))
                                                                            ) : (
                                                                                <span>None</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-3">
                                                                    <Badge variant={getStatusVariant(assignment.status)}>
                                                                        Status: {assignment.status}
                                                                    </Badge>
                                                                    <Badge variant={getStatusVariant(assignment.timer_status)}>
                                                                        Timer: {assignment.timer_status}
                                                                    </Badge>

                                                                    <div className="flex items-center gap-1">
                                                                        {isEditing ? (
                                                                            <>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={() => handleSaveEdit(assignment._id)}
                                                                                    className="h-8"
                                                                                >
                                                                                    <Save className="h-4 w-4" />
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={handleCancelEdit}
                                                                                    className="h-8"
                                                                                >
                                                                                    <X className="h-4 w-4" />
                                                                                </Button>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={() => handleEditTask(assignment)}
                                                                                    className="h-8"
                                                                                >
                                                                                    <Edit className="h-4 w-4" />
                                                                                </Button>

                                                                                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                                                                                    <DialogTrigger asChild>
                                                                                        <Button
                                                                                            size="sm"
                                                                                            variant="outline"
                                                                                            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                                            onClick={() => setTaskToDelete(assignment._id)}
                                                                                        >
                                                                                            <Trash2 className="h-4 w-4" />
                                                                                        </Button>
                                                                                    </DialogTrigger>
                                                                                    <DialogContent>
                                                                                        <DialogHeader>
                                                                                            <DialogTitle>Delete Task</DialogTitle>
                                                                                            <DialogDescription>
                                                                                                Are you sure you want to delete this task? This action cannot be undone.
                                                                                            </DialogDescription>
                                                                                        </DialogHeader>
                                                                                        <DialogFooter>
                                                                                            <Button
                                                                                                variant="outline"
                                                                                                onClick={() => {
                                                                                                    setDeleteDialogOpen(false);
                                                                                                    setTaskToDelete(null);
                                                                                                }}
                                                                                            >
                                                                                                Cancel
                                                                                            </Button>
                                                                                            <Button
                                                                                                variant="destructive"
                                                                                                onClick={handleDeleteTask}
                                                                                            >
                                                                                                Delete Task
                                                                                            </Button>
                                                                                        </DialogFooter>
                                                                                    </DialogContent>
                                                                                </Dialog>
                                                                            </>
                                                                        )}

                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => toggleCard(assignment._id)}
                                                                            className="p-1 h-8 w-8"
                                                                        >
                                                                            {expandedCards.has(assignment._id) ? (
                                                                                <ChevronUp className="w-4 h-4" />
                                                                            ) : (
                                                                                <ChevronDown className="w-4 h-4" />
                                                                            )}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mb-4">
                                                                <div className="flex flex-col sm:flex-row gap-4 text-sm mb-3">
                                                                    {isEditing ? (
                                                                        <>
                                                                            <div className="space-y-2">
                                                                                <Label htmlFor="tat">TAT (minutes)</Label>
                                                                                <Input
                                                                                    id="tat"
                                                                                    type="number"
                                                                                    value={editedTask.TAT || ""}
                                                                                    onChange={(e) => setEditedTask({...editedTask, TAT: parseInt(e.target.value) || 0})}
                                                                                    placeholder="Task TAT"
                                                                                />
                                                                            </div>
                                                                            <div className="space-y-2">
                                                                                <Label htmlFor="deadline">Deadline</Label>
                                                                                <Input
                                                                                    id="deadline"
                                                                                    type="datetime-local"
                                                                                    value={editedTask.deadline ? format(new Date(editedTask.deadline), "yyyy-MM-dd'T'HH:mm") : ""}
                                                                                    onChange={(e) => setEditedTask({...editedTask, deadline: e.target.value})}
                                                                                />
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <div className="flex gap-2">
                                                                                <span className="text-muted-foreground">TAT:</span>
                                                                                <span className="font-medium">
                                          {assignment.TAT ? `${assignment.TAT} mins` : "N/A"}
                                        </span>
                                                                            </div>
                                                                            <div className="flex gap-2">
                                                                                <span className="text-muted-foreground">Deadline:</span>
                                                                                <span className="font-medium">
                                          {assignment.deadline
                                              ? format(new Date(assignment.deadline), "MMM dd, yyyy h:mm a")
                                              : "N/A"}
                                        </span>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>

                                                                <Card className="bg-muted/30">
                                                                    <CardContent className="p-3">
                                                                        {isEditing ? (
                                                                            <Textarea
                                                                                value={editedTask.description || ""}
                                                                                onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
                                                                                placeholder="Task Description"
                                                                                rows={3}
                                                                            />
                                                                        ) : (
                                                                            <p className="text-sm leading-relaxed">
                                                                                {assignment.description || "No description provided"}
                                                                            </p>
                                                                        )}
                                                                    </CardContent>
                                                                </Card>
                                                            </div>

                                                            {expandedCards.has(assignment._id) && (
                                                                <div className="space-y-4">
                                                                    <Separator />

                                                                    {assignment.proof?.length > 0 && (
                                                                        <div>
                                                                            <div className="flex items-center gap-2 mb-3">
                                                                                <ImageIcon className="w-4 h-4 text-blue-600" />
                                                                                <h4 className="font-medium text-sm">
                                                                                    Task Proof Requirements:
                                                                                </h4>
                                                                            </div>

                                                                            <div className="space-y-3">
                                                                                {renderProof(assignment.proof)}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {index < getFilteredAssignments().length - 1 && (
                                                            <Separator />
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-8">
                                                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                                <p className="text-muted-foreground mt-2">
                                                    {showOnlyToday
                                                        ? "No tasks found for today"
                                                        : selectedDate
                                                            ? `No tasks found for ${format(selectedDate, "MMM dd, yyyy")}`
                                                            : "No tasks found for this user"}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TasksAssigned;
// "use client";
// import React, { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { useAppDispatch, useAppSelector } from "@/store/hooks";
// import {
//   fetchUserHierarchy,
//   selectHierarchyUsers,
//   selectHierarchyLoading,
//   selectUsersError
// } from '@/features/user/userSlice';
// import { fetchTodayTaskAssignmentsByUserId } from "@/features/taskAssignments/taskAssignmentSlice";
// import { toast } from "sonner";
// import { format, isToday, parseISO, isSameDay } from "date-fns";
//
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
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
//   FileText,
//   Image as ImageIcon,
//   Link as LinkIcon,
//   Clock,
//   Users,
//   CheckCircle,
//   ArrowLeft,
//   Search,
//   Calendar,
// } from "lucide-react";
// import { Separator } from "@/components/ui/separator";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Input } from "@/components/ui/input";
// import { Loader2 } from "lucide-react";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { Calendar as CalendarUI } from "@/components/ui/calendar";
//
// // Types
// interface HierarchyUser {
//   userId: string;
//   name: string;
//   email: string;
//   departmentId?: string;
//   role: string;
//   hierarchyLevel: number;
//   parentRoleId?: string;
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
//   description: string;
//   TAT: number;
//   deadline: string;
//   previous_TAT?: number[];
//   proof: ProofItem[];
//   assigned_by_user_id: any;
//   assigned_to_employee_id: any;
//   status: 'Pending' | 'Overdue' | 'Completed';
//   timer_status: 'Todo' | 'InProgress' | 'Stuck' | 'Done';
// }
//
// const TasksAssigned = () => {
//   const router = useRouter();
//   const dispatch = useAppDispatch();
//
//   const hierarchyUsers = useAppSelector(selectHierarchyUsers);
//   const hierarchyLoading = useAppSelector(selectHierarchyLoading);
//   const hierarchyError = useAppSelector(selectUsersError);
//
//   const { dailyAssignments: memberTasks, loading: tasksLoading } = useAppSelector(
//     (state) => state.taskAssignments
//   );
//
//   const [selectedUser, setSelectedUser] = useState<HierarchyUser | null>(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
//   const [showOnlyToday, setShowOnlyToday] = useState(false);
//   const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
//   const [calendarOpen, setCalendarOpen] = useState(false);
//   const [filteredUsers, setFilteredUsers] = useState<HierarchyUser[]>([]);
//
//   useEffect(() => {
//     if (hierarchyUsers) {
//       const filtered = hierarchyUsers.filter(user =>
//         user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         user.role?.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//       setFilteredUsers(filtered);
//     }
//   }, [hierarchyUsers, searchTerm]);
//
//   useEffect(() => {
//     dispatch(fetchUserHierarchy());
//   }, [dispatch]);
//
//   useEffect(() => {
//     if (selectedUser) {
//       dispatch(fetchTodayTaskAssignmentsByUserId(selectedUser.userId));
//     }
//   }, [selectedUser, dispatch]);
//
//   useEffect(() => {
//     if (hierarchyError) {
//       toast.error(`Failed to load hierarchy users: ${hierarchyError}`);
//     }
//   }, [hierarchyError]);
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
//   const getHierarchyLevelColor = (level: number) => {
//     switch (level) {
//       case 1:
//       case 2:
//         return "bg-purple-100 text-purple-800";
//       case 3:
//       case 4:
//         return "bg-blue-100 text-blue-800";
//       case 5:
//       case 6:
//         return "bg-green-100 text-green-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };
//
//   const renderProof = (proofItems: any[] = []) => {
//     return proofItems.map((item, idx) => {
//       if (item.field_name) {
//         return (
//           <div
//             key={idx}
//             className="p-4 bg-blue-50 dark:bg-[#101828]  rounded-lg border border-blue-100 mb-3"
//           >
//             <div className="flex items-start gap-3">
//               {item.proof_type === "url" ? (
//                 <LinkIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
//               ) : (
//                 <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
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
//               <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
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
//   if (hierarchyLoading && !selectedUser) {
//     return (
//       <div className="flex justify-center items-center min-h-screen">
//         <Loader2 className="h-8 w-8 animate-spin" />
//         <span className="ml-2">Loading hierarchy users...</span>
//       </div>
//     );
//   }
//
//   return (
//     <div className="min-h-screen dark:bg-[#101828] bg-gray-50 p-4">
//       <div className="w-full max-w-7xl mx-auto">
//         {!selectedUser && (
//           <div className="space-y-6">
//             <div className="mb-6">
//               <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
//                 Team Hierarchy
//               </h1>
//               <p className="text-muted-foreground">
//                 {filteredUsers.length} users found in your hierarchy
//               </p>
//             </div>
//
//             <div className="relative max-w-sm">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
//               <Input
//                 placeholder="Search users..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="pl-10"
//               />
//             </div>
//
//             <Card className="shadow-lg">
//               <CardHeader>
//                 <CardTitle>Hierarchy Users</CardTitle>
//                 <CardDescription>
//                   Select a user to view their tasks and assignments
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>User</TableHead>
//                       <TableHead>Email</TableHead>
//                       <TableHead>Role</TableHead>
//                       <TableHead>Level</TableHead>
//                       <TableHead className="text-right">Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {filteredUsers.map((user) => (
//                       <TableRow key={user.userId}>
//                         <TableCell>
//                           <div className="flex items-center gap-3">
//                             <Avatar>
//                               <AvatarFallback>
//                                 {user.name.split(' ').map(n => n[0]).join('')}
//                               </AvatarFallback>
//                             </Avatar>
//                             <div>
//                               <p className="font-medium">{user.name}</p>
//                             </div>
//                           </div>
//                         </TableCell>
//                         <TableCell>{user.email}</TableCell>
//                         <TableCell>
//                           <Badge variant="outline">{user.role}</Badge>
//                         </TableCell>
//                         <TableCell>
//                           <Badge
//                             variant="secondary"
//                             className={getHierarchyLevelColor(user.hierarchyLevel)}
//                           >
//                             Level {user.hierarchyLevel}
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
//                 {filteredUsers.length === 0 && !hierarchyLoading && (
//                   <div className="text-center py-8">
//                     <Users className="mx-auto h-12 w-12 text-gray-400" />
//                     <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
//                     <p className="mt-1 text-sm text-gray-500">
//                       {searchTerm ? 'Try adjusting your search term' : 'No users available in your hierarchy'}
//                     </p>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>
//         )}
//
//         {selectedUser && (
//           <div className="space-y-6">
//             <div className="mb-6">
//               <Button
//                 variant="outline"
//                 onClick={() => setSelectedUser(null)}
//                 className="mb-4"
//               >
//                 <ArrowLeft className="h-4 w-4 mr-2" />
//                 Back to Hierarchy
//               </Button>
//               <div className="flex items-center gap-4 mb-2">
//                 <h1 className="text-4xl font-bold text-gray-900">
//                   {selectedUser.name}'s Tasks
//                 </h1>
//                 <Badge
//                   variant="secondary"
//                   className={getHierarchyLevelColor(selectedUser.hierarchyLevel)}
//                 >
//                   {selectedUser.role} - Level {selectedUser.hierarchyLevel}
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
//                     <FileText className="w-5 h-5 text-blue-600" />
//                   </div>
//                   <div>
//                     <CardTitle className="text-xl">Task Queue</CardTitle>
//                     <CardDescription>
//                       Tasks assigned to {selectedUser.name}
//                       {showOnlyToday
//                         ? " (Today)"
//                         : selectedDate && ` (${format(selectedDate, "MMM dd, yyyy")})`}
//                     </CardDescription>
//                   </div>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => dispatch(fetchTodayTaskAssignmentsByUserId(selectedUser.userId))}
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
//                                   <h3 className="text-base font-semibold text-gray-900 mb-1">
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
//                                   <div className="flex flex-row items-center gap-4 mt-2">
//   {/* Original TAT Badge */}
//   <Badge variant="outline" className="text-blue-600 text-xs">
//     Original TAT: {assignment.previous_TAT?.[0] ?? assignment.TAT} mins
//   </Badge>
//
//   {/* Stuck Records Label and Values - horizontal */}
//   <div className="flex flex-row items-center gap-2 text-xs font-semibold text-red-600">
//     <span>Stuck Records:</span>
//     {assignment.previous_TAT && assignment.previous_TAT.length > 0 ? (
//       assignment.previous_TAT.map((value: number | string, index: number) => (
//         <span key={index} className="ml-1">• {value} mins</span>
//       ))
//     ) : (
//       <span>None</span>
//     )}
//   </div>
//
// </div>
//
//                                 </div>
//
//
//
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
//                         <FileText className="mx-auto h-12 w-12 text-gray-400" />
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
// export default TasksAssigned;
