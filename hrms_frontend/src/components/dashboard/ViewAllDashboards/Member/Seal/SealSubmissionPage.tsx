"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    ChartColumn,
    CheckCircle2,
    AlertTriangle,
    Users,
    AlertCircle,
    Lock,
    LayoutList,
    Upload,
    X,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useDropzone } from 'react-dropzone';
import { toast, Toaster } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchUserDailyTaskAssignments,
} from '@/features/taskAssignments/taskAssignmentSlice';
import { createSubmission } from '@/features/submissions/submissionSlice';
import { requestApproval } from '@/features/approvals/approvalSlice';
import { getProfile } from '@/features/auth/authSlice';
import Image from 'next/image';
import dayjs from 'dayjs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { fetchMonthlyPulseEfficiency } from '@/features/efficiencyReport/pulseEfficiencySlice';
import { useRouter } from 'next/navigation';

type TaskStatus = 'Todo' | 'InProgress' | 'Stuck' | 'Done';

interface FileWithPreview extends File {
    preview: string;
}

// Interface for task approval status tracking
interface TaskApprovalStatus {
    [taskId: string]: {
        isSubmitted: boolean;
        submittedDate: string | null;
    };
}

const SealSubmissionPage = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { dailyAssignments, loading } = useAppSelector((state) => state.taskAssignments);
    const { user } = useAppSelector((state) => state.auth);

    const [proofLinks, setProofLinks] = useState<Record<string, string>>({});
    const [proofComment, setProofComment] = useState("");
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [openProofDialog, setOpenProofDialog] = useState(false);
    const [currentTask, setCurrentTask] = useState<any>(null);
    const [progressValues, setProgressValues] = useState<Record<string, number>>({});
    const [timeElapsed, setTimeElapsed] = useState<Record<string, number>>({});
    const [pulseEfficiencyData, setPulseEfficiencyData] = useState<any>(null);
    const [sealSubmitted, setSealSubmitted] = useState(false);
    const [isSubmittingSeal, setIsSubmittingSeal] = useState(false);

    // Track individual task approval status
    const [taskApprovalStatus, setTaskApprovalStatus] = useState<TaskApprovalStatus>({});

    const { getRootProps, getInputProps } = useDropzone({
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
            'application/pdf': ['.pdf'],
            'text/plain': ['.txt'],
        },
        maxFiles: 5,
        onDrop: (acceptedFiles) => {
            const filesWithPreview = acceptedFiles.map(file =>
                Object.assign(file, {
                    preview: URL.createObjectURL(file)
                })
            );
            setFiles(filesWithPreview);
        },
    });

    useEffect(() => {
        dispatch(fetchUserDailyTaskAssignments());
        dispatch(getProfile());

        // Initialize task approval status from localStorage
        const today = new Date().toDateString();
        const storedApprovalStatus = localStorage.getItem("taskApprovalStatus");

        const storedSealDate = localStorage.getItem('lastSealSubmittedDate');
        if (storedSealDate === today) {
            setSealSubmitted(true);
        }

        if (storedApprovalStatus) {
            const parsedStatus: TaskApprovalStatus = JSON.parse(storedApprovalStatus);

            // Filter out yesterday's approvals
            const todayStatus: TaskApprovalStatus = {};
            Object.keys(parsedStatus).forEach(taskId => {
                if (parsedStatus[taskId].submittedDate === today) {
                    todayStatus[taskId] = parsedStatus[taskId];
                }
            });

            setTaskApprovalStatus(todayStatus);
        }
    }, [dispatch]);

    // Save task approval status to localStorage whenever it changes
    useEffect(() => {
        if (Object.keys(taskApprovalStatus).length > 0) {
            localStorage.setItem("taskApprovalStatus", JSON.stringify(taskApprovalStatus));
        }
    }, [taskApprovalStatus]);

    useEffect(() => {
        const initialProgress: Record<string, number> = {};
        const initialTime: Record<string, number> = {};

        dailyAssignments.forEach(task => {
            initialProgress[task._id] = getInitialProgressValue(task);
            initialTime[task._id] = task.timerStartTime
                ? (Date.now() - new Date(task.timerStartTime).getTime()) / 1000
                : 0;
        });

        setProgressValues(initialProgress);
        setTimeElapsed(initialTime);
    }, [dailyAssignments]);

    useEffect(() => {
        const fetchPulseEfficiency = async () => {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            const monthYear = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

            try {
                const result = await dispatch(fetchMonthlyPulseEfficiency(monthYear)).unwrap();
                setPulseEfficiencyData(result[0]);
            } catch (error) {
                console.error("Failed to fetch pulse efficiency:", error);
                setPulseEfficiencyData(null);
            }
        };

        fetchPulseEfficiency();
    }, [dispatch]);

    const getInitialProgressValue = (task: any) => {
        if (task.timer_status === 'Done') return 100;
        if (task.timer_status === 'Stuck') return 25;
        if (task.timer_status === 'Todo') return 0;

        if (task.timerStartTime) {
            const elapsedSeconds = (Date.now() - new Date(task.timerStartTime).getTime()) / 1000;
            const tatSeconds = (task.TAT || 480) * 60;
            return Math.min((elapsedSeconds / tatSeconds) * 100, 100);
        }

        return 0;
    };

    const getStatusStyles = (status: TaskStatus): string => {
        switch (status) {
            case 'Todo':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'InProgress':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Stuck':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'Done':
                return 'bg-gray-100 text-gray-600 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const isTaskOverdue = (task: any) => {
        return task.status === 'Overdue';
    };

    const isTaskCompleted = (task: any) => {
        return task.status === 'Completed' || task.timer_status === 'Done';
    };

    const submitProof = async () => {
        if (!currentTask?._id) return;

        try {
            const proofs: Record<string, { type: 'url' | 'file'; value: string | File }> = {};

            if (files.length > 0) {
                const fileProofs = currentTask.proof.filter((p: any) => p.type === 'file');
                if (fileProofs.length > 0) {
                    fileProofs.forEach((proof: any, index: number) => {
                        if (files[index]) {
                            proofs[proof.fieldName] = {
                                type: 'file',
                                value: files[index]
                            };
                        }
                    });
                }
            }

            currentTask.proof.forEach((proof: any) => {
                if (proof.type === 'url' && proofLinks[proof.fieldName]) {
                    proofs[proof.fieldName] = {
                        type: 'url',
                        value: proofLinks[proof.fieldName]
                    };
                }
            });

            const submissionData = {
                assignmentId: currentTask._id,
                proofs,
                comment: proofComment,
                reason: ""
            };

            await dispatch(createSubmission(submissionData)).unwrap();

            setFiles([]);
            setProofLinks({});
            setProofComment("");
            setOpenProofDialog(false);

            toast.success("Submission created", {
                description: "Your task proof has been successfully submitted.",
            });
        } catch (error) {
            toast.error("Error", {
                description: "Failed to create submission.",
            });
        }
    };

    // Modified: Submit individual task for approval
    const submitTaskForApproval = async (taskId: string) => {
        const task = dailyAssignments.find((t) => t._id === taskId);
        if (!task) {
            toast.error("Task not found");
            return;
        }

        // Check if task is already submitted for approval today
        const today = new Date().toDateString();
        if (taskApprovalStatus[taskId]?.submittedDate === today) {
            toast.info("Task already submitted", {
                description: "This task has already been submitted for approval today.",
            });
            return;
        }

        // Check if task is in Done status
        if (task.timer_status !== "Done") {
            toast.warning("Task not completed", {
                description: "Please complete the task before submitting for approval.",
            });
            return;
        }

        try {
            // Get assigner ID from the task
            let assignerId: string;

            if (typeof task.assigned_by_user_id === 'string') {
                assignerId = task.assigned_by_user_id;
            } else if (task.assigned_by_user_id && typeof task.assigned_by_user_id === 'object') {
                // It's a User object, get the _id from it
                assignerId = (task.assigned_by_user_id as any)._id ||
                    (task.assigned_by_user_id as any).id;
            } else {
                throw new Error("Task assigner information not found");
            }

            if (!assignerId) {
                throw new Error("Could not extract assigner ID");
            }

            // Send single task ID (not as array)
            const result = await dispatch(
                requestApproval({
                    taskAssignId: taskId, // Send as string, not array
                    assignBy: assignerId,
                })
            ).unwrap();

            // Update task approval status
            setTaskApprovalStatus(prev => ({
                ...prev,
                [taskId]: {
                    isSubmitted: true,
                    submittedDate: today
                }
            }));

            toast.success("Task submitted for approval", {
                description: `"${task.title}" has been sent for approval.`,
            });

        } catch (error: any) {
            console.error("Approval submission error:", error);
            toast.error("Failed to submit task for approval", {
                description: error?.message || "Please try again.",
            });
        }
    };

    const removeFile = (file: FileWithPreview) => {
        setFiles(files.filter(f => f.name !== file.name));
        URL.revokeObjectURL(file.preview);
    };

    const handleProofLinkChange = (fieldName: string, value: string) => {
        setProofLinks(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const getTimeRemaining = (task: any) => {
        if (task.timer_status !== 'InProgress' || !task.timerStartTime) return null;

        const tatSeconds = (task.TAT || 480) * 60;
        const elapsed = timeElapsed[task._id] || 0;
        const remaining = tatSeconds - elapsed;

        if (remaining <= 0) return "Overdue!";

        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = Math.floor(remaining % 60);

        return `${hours}h ${minutes}m ${seconds}s remaining`;
    };

    const renderProofInputs = (task: any) => {
        if (!task || !task.proof || task.proof.length === 0) {
            return (
                <div>
                    <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50">
                        <input {...getInputProps()} />
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            Drag & drop files here, or click to select files
                        </p>
                    </div>
                </div>
            );
        }

        return task.proof.map((proof: any) => {
            if (proof.type === 'url') {
                return (
                    <div key={proof.fieldName} className="space-y-2">
                        <label className="text-sm font-medium">{proof.fieldName}</label>
                        <Input
                            placeholder={`Enter ${proof.fieldName} URL`}
                            value={proofLinks[proof.fieldName] || ''}
                            onChange={(e) => handleProofLinkChange(proof.fieldName, e.target.value)}
                        />
                    </div>
                );
            } else if (proof.type === 'file') {
                return (
                    <div key={proof.fieldName} className="space-y-2">
                        <label className="text-sm font-medium">{proof.fieldName}</label>
                        <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50">
                            <input {...getInputProps()} />
                            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                Drag & drop files here, or click to select files
                            </p>
                        </div>
                    </div>
                );
            }
            return null;
        });
    };

    const completedTasksCount = dailyAssignments?.filter(task =>
        task.status === 'Completed' || task.timer_status === 'Done'
    ).length || 0;

    const overdueTasksCount = dailyAssignments?.filter(task =>
        task.status === 'Overdue'
    ).length || 0;

    const inProgressTasksCount = dailyAssignments?.filter(task =>
        task.timer_status === 'InProgress'
    ).length || 0;

    const stuckTasksCount = dailyAssignments?.filter(task =>
        task.timer_status === 'Stuck'
    ).length || 0;

    const todoTasksCount = dailyAssignments?.filter(task =>
        task.timer_status === 'Todo'
    ).length || 0;

    const totalTasks = dailyAssignments?.length || 0;

    const DailyPulseScore = () => (
        <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                    Monthly Pulse Score
                </CardTitle>
                <span className="text-xs text-yellow-600">ⓘ</span>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">
                    {pulseEfficiencyData ? `${pulseEfficiencyData.efficiency.toFixed(1)}` : 'Loading...'}
                </div>
                <p className="text-xs text-gray-500">Your performance for tasks</p>
            </CardContent>
        </Card>
    );

    const DailyTaskProgress = () => (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Daily Task/Progress Overview</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="w-full h-3 flex rounded-full overflow-hidden my-2">
                    <div className="bg-green-500" style={{ width: `${(completedTasksCount / totalTasks) * 100}%` }}></div>
                    <div className="bg-yellow-400" style={{ width: `${(inProgressTasksCount / totalTasks) * 100}%` }}></div>
                    <div className="bg-red-500" style={{ width: `${(stuckTasksCount / totalTasks) * 100}%` }}></div>
                    <div className="bg-gray-300" style={{ width: `${(todoTasksCount / totalTasks) * 100}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <div>
                        <span className="font-semibold text-black">Completed:</span> {completedTasksCount}
                    </div>
                    <div>
                        <span className="font-semibold text-black">In-Progress:</span> {inProgressTasksCount}
                    </div>
                    <div>
                        <span className="font-semibold text-black">Stuck:</span> {stuckTasksCount}
                    </div>
                    <div>
                        <span className="font-semibold text-black">Todo:</span> {todoTasksCount}
                    </div>
                </div>
                {overdueTasksCount > 0 && (
                    <div className="mt-2 text-xs">
                        <span className="font-semibold text-red-500">Overdue:</span> {overdueTasksCount}
                    </div>
                )}
            </CardContent>
        </Card>
    );

    const QuickActions = () => {
        const userRole = user?.role?.toLowerCase();

        const handleViewReports = () => {
            router.push(`/dashboard/dynamic/report`);
        };

        const handleTaskView = () => {
            router.push(`/dashboard/dynamic/member`);
        };

        return (
            <Card>
                <CardHeader className="pb-1">
                    <CardTitle className="text-sm font-medium">QUICK ACTIONS</CardTitle>
                    <p className="text-xs text-gray-400">Accomplish your team checks</p>
                </CardHeader>
                <CardContent className="space-y-1">
                    <div
                        className="flex items-center text-sm cursor-pointer p-2 rounded transition-colors"
                        onClick={handleViewReports}
                    >
                        <ChartColumn className="w-4 h-4 mr-2" /> View Reports
                    </div>
                    <div
                        className="flex items-center text-sm cursor-pointer p-2 rounded transition-colors"
                        onClick={handleTaskView}
                    >
                        <LayoutList className="w-4 h-4 mr-2" /> Task View
                    </div>
                </CardContent>
            </Card>
        );
    };

    const TodaysInsights = () => (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Today's Insights</CardTitle>
                <p className="text-xs text-gray-400">Your daily performance summary</p>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
                <div className="flex items-center text-sm">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-green-500" />
                    <div>
                        <p className="font-semibold">{completedTasksCount}</p>
                        <p className="text-xs text-gray-500">Tasks Completed</p>
                    </div>
                </div>
                <div className="flex items-center text-sm">
                    <AlertTriangle className="w-5 h-5 mr-3 text-yellow-500" />
                    <div>
                        <p className="font-semibold">{inProgressTasksCount}</p>
                        <p className="text-xs text-gray-500">In Progress</p>
                    </div>
                </div>
                <div className="flex items-center text-sm">
                    <Users className="w-5 h-5 mr-3 text-red-500" />
                    <div>
                        <p className="font-semibold">{overdueTasksCount}</p>
                        <p className="text-xs text-gray-500">Overdue Tasks</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const TaskCard = ({ task }: { task: any }) => {
        const isLocked = task.timer_status !== 'Done';
        const isOverdue = isTaskOverdue(task);
        const isCompleted = isTaskCompleted(task);
        const isTaskSubmitted = taskApprovalStatus[task._id]?.isSubmitted || false;
        const today = new Date().toDateString();
        const canSubmitToday = taskApprovalStatus[task._id]?.submittedDate !== today;

        const getDisplayStatus = () => {
            if (task.status === 'Completed') return 'Completed';
            if (task.status === 'Overdue') return 'Overdue';
            return task.timer_status === 'InProgress' ? 'In Progress' : task.timer_status;
        };

        const getBadgeColor = () => {
            if (task.status === 'Completed') return 'bg-green-100 text-green-800 border-green-200';
            if (task.status === 'Overdue') return 'bg-red-100 text-red-800 border-red-200';
            return getStatusStyles(task.timer_status);
        };

        const handleSubmitForApproval = () => {
            submitTaskForApproval(task._id);
        };

        return (
            <Card className="flex flex-col justify-between">
                <div>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <CardTitle className="text-base font-semibold w-5/6">{task.title}</CardTitle>
                        <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline" className={`text-xs ${getBadgeColor()}`}>
                                {getDisplayStatus()}
                            </Badge>
                            {isTaskSubmitted && task.timer_status === 'Done' && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                    Submitted
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between text-sm mb-4">
                            <p className="font-medium">Status</p>
                            {isLocked && <Lock className="w-4 h-4 text-gray-400" />}
                        </div>

                        <div className="my-3">
                            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">
                  Progress: {Math.round(progressValues[task._id] || 0)}%
                </span>
                                <span className="text-xs text-muted-foreground">
                  TAT: {task.TAT || 480} mins
                </span>
                            </div>
                            <Progress
                                value={progressValues[task._id] || 0}
                                className={`h-2 ${
                                    progressValues[task._id] >= 100 ? "bg-red-500" :
                                        progressValues[task._id] > 80 ? "bg-orange-500" :
                                            progressValues[task._id] > 60 ? "bg-yellow-500" :
                                                "bg-blue-500"
                                }`}
                            />
                            {task.timer_status === 'InProgress' && (
                                <p className={`text-xs mt-1 ${
                                    progressValues[task._id] >= 100 ? "text-red-500 font-medium" :
                                        progressValues[task._id] > 80 ? "text-orange-500" :
                                            "text-muted-foreground"
                                }`}>
                                    {getTimeRemaining(task)}
                                </p>
                            )}
                        </div>

                        {task.proof?.length > 0 && (
                            <div className="mt-3">
                                <p className="text-xs font-medium text-gray-500 mb-2">Proof required</p>
                                {task.timer_status === 'Done' ? (
                                    <div className="text-xs text-green-500">Proof submitted</div>
                                ) : (
                                    <div className="text-xs text-gray-500">Locked until completed</div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </div>
                <div className="p-6 pt-0 space-y-3">
                    <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                            Due: {dayjs(task.deadline).format('MMM D, YYYY')}
                            {isOverdue && <span className="text-red-500 ml-2">(Overdue)</span>}
                        </p>

                        {task.timer_status === 'Done' && (
                            <Button
                                onClick={handleSubmitForApproval}
                                disabled={isTaskSubmitted && !canSubmitToday}
                                size="sm"
                                variant={isTaskSubmitted ? "outline" : "default"}
                                className="whitespace-nowrap bg-[#7F56D9] hover:bg-[#6941C6] text-white"
                            >
                                {isTaskSubmitted ? (
                                    canSubmitToday ? "Resubmit" : "Submitted"
                                ) : (
                                    "Submit Seal"
                                )}
                            </Button>
                        )}
                    </div>

                    {isCompleted && !isOverdue && (
                        <div className="text-xs text-green-500 mb-1 flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Task Completed
                        </div>
                    )}

                    {task.stuck_reason && (
                        <div className="flex items-start text-yellow-500 text-xs">
                            <AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5" />
                            <p>Stuck reason: {task.stuck_reason}</p>
                        </div>
                    )}
                </div>
            </Card>
        );
    };

    const tasksSubmittedForApprovalCount = Object.keys(taskApprovalStatus).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-transparent p-4 sm:p-6 lg:p-8 flex items-center justify-center">
                <div className="text-center">
                    <p>Loading your tasks...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-transparent p-4 sm:p-6 lg:p-8">
            <Toaster richColors />

            <div className="max-w-7xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold dark:text-white text-gray-900">
                        Seal Submission for {dayjs().format('MMMM D, YYYY')}
                    </h1>
                    <p className="text-sm text-gray-500">Welcome back, {user?.name || 'User'}</p>
                </header>

                <main>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                        <div className="lg:col-span-2 space-y-6">
                            <DailyPulseScore />
                            <DailyTaskProgress />
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            <QuickActions />
                            <TodaysInsights />
                        </div>
                    </div>

                    <section className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                Your Tasks Today ({totalTasks})
                            </h2>
                            <div className="text-sm text-gray-500">
                                Submitted for Approval: <span className="font-semibold">{tasksSubmittedForApprovalCount}</span>
                            </div>
                        </div>
                        {dailyAssignments?.length === 0 ? (
                            <div className="flex justify-center items-center h-40">
                                <p>No tasks assigned for today</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {dailyAssignments?.map((task) => (
                                    <TaskCard key={task._id} task={task} />
                                ))}
                            </div>
                        )}
                    </section>
                </main>
            </div>

            <Dialog open={openProofDialog} onOpenChange={setOpenProofDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Submit Proof of Completion</DialogTitle>
                        <DialogDescription>
                            Provide evidence that you've completed this task.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {currentTask && renderProofInputs(currentTask)}

                        {files.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <h4 className="text-sm font-medium">Selected files:</h4>
                                <div className="space-y-2">
                                    {files.map((file) => (
                                        <div key={file.name} className="flex items-center justify-between p-2 border rounded">
                                            <div className="flex items-center space-x-2">
                                                {file.type.startsWith('image/') ? (
                                                    <Image
                                                        src={file.preview}
                                                        alt={file.name}
                                                        width={40}
                                                        height={40}
                                                        className="object-cover rounded"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 flex items-center justify-center bg-muted rounded">
                                                        <span className="text-xs">{file.name.split('.').pop()}</span>
                                                    </div>
                                                )}
                                                <span className="text-sm truncate max-w-[180px]">{file.name}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-6 h-6"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeFile(file);
                                                }}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Textarea
                            placeholder="Additional comments (optional)"
                            value={proofComment}
                            onChange={(e) => setProofComment(e.target.value)}
                        />

                        <Button
                            onClick={submitProof}
                            disabled={
                                (currentTask?.proof?.some((p: any) => p.type === 'url') &&
                                    !currentTask.proof.some((p: any) => proofLinks[p.fieldName])) ||
                                (currentTask?.proof?.some((p: any) => p.type === 'file') && files.length === 0)
                            }
                        >
                            Submit Proof
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SealSubmissionPage;