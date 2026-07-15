

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import {
    AlertCircleIcon,
    CheckCircleIcon,
    UploadIcon,
    XIcon,
    Volume2Icon,
    VolumeXIcon,
    Music,
    Hourglass,
    Clock,
    Calendar,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    changeTimerStatus,
    requestStuckStatus,
    fetchUserDailyTaskAssignments,
    upsertTask,
} from "@/features/taskAssignments/taskAssignmentSlice";
import { requestApproval } from "@/features/approvals/approvalSlice";
import { createSubmission } from "@/features/submissions/submissionSlice";
import { fetchMonthlyPulseEfficiency } from "@/features/efficiencyReport/pulseEfficiencySlice";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toaster, toast } from "sonner";
import { FileRejection, useDropzone } from "react-dropzone";
import { getProfile } from "@/features/auth/authSlice";
import Image from "next/image";
import dayjs from "dayjs";
import { sendTaskStatusEmail } from "@/features/EmailTat/emailSlice";
import { useAudioAlert } from "@/hooks/useAudioAlert";
import useSocket from "@/hooks/useSocket";

interface FileWithPreview extends File {
    preview: string;
}

// Separate component for file dropzone to fix hooks issue
const FileDropzone = ({
    fieldName,
    files,
    onFilesChange,
    onRemoveFile
}: {
    fieldName: string;
    files: FileWithPreview[];
    onFilesChange: (fieldName: string, newFiles: FileWithPreview[]) => void;
    onRemoveFile: (fieldName: string, file: FileWithPreview) => void;
}) => {
    const onDrop = (acceptedFiles: File[], fileRejections: FileRejection[]) => {
        if (fileRejections.length > 0) {
            toast.error("Invalid file type", {
                description: "Please upload only image, PDF, or text files.",
            });
            return;
        }

        const filesWithPreview = acceptedFiles.map(file =>
            Object.assign(file, {
                preview: URL.createObjectURL(file)
            })
        );

        onFilesChange(fieldName, filesWithPreview);
    };

    const { getRootProps, getInputProps } = useDropzone({
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
            'application/pdf': ['.pdf'],
            'text/plain': ['.txt'],
        },
        maxFiles: 5,
        onDrop,
    });

    return (
        <div className="space-y-2">
            <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50">
                <input {...getInputProps()} />
                <UploadIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                    Drag & drop files here, or click to select files for {fieldName}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    Accepted: images, PDFs, text files
                </p>
            </div>

            {/* Show files for this specific field */}
            {files.length > 0 && (
                <div className="mt-2 space-y-2">
                    <h4 className="text-sm font-medium">Files for {fieldName}:</h4>
                    <div className="space-y-2">
                        {files.map((file) => (
                            <div key={`${fieldName}-${file.name}`} className="flex items-center justify-between p-2 border rounded">
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
                                        onRemoveFile(fieldName, file);
                                    }}
                                >
                                    <XIcon className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};



// Interface for task approval status tracking
interface TaskApprovalStatus {
    [taskId: string]: {
        isSubmitted: boolean;
        submittedDate: string | null;
    };
}



export default function AdminTaskLayout() {
    const dispatch = useAppDispatch();

    const [error, setError] = useState("");
    const { dailyAssignments, loading } = useAppSelector(
        (state) => state.taskAssignments
    );
    const { user } = useAppSelector((state) => state.auth);

    const [stuckReason, setStuckReason] = useState("");
    const [overdueReason, setOverdueReason] = useState("");
    const [proofLinks, setProofLinks] = useState<Record<string, string>>({});
    const [proofComment, setProofComment] = useState("");
    const [files, setFiles] = useState<Record<string, FileWithPreview[]>>({});
    const [openStuckDialog, setOpenStuckDialog] = useState(false);
    const [openProofDialog, setOpenProofDialog] = useState(false);
    const [openOverdueDialog, setOpenOverdueDialog] = useState(false);
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
    const [currentTask, setCurrentTask] = useState<any>(null);
    const [progressValues, setProgressValues] = useState<Record<string, number>>({});
    const [timeElapsed, setTimeElapsed] = useState<Record<string, number>>({});

    const [tatAlerts, setTatAlerts] = useState<Record<string, boolean>>({});
    const [criticalAlerts, setCriticalAlerts] = useState<Record<string, boolean>>({});
    const [pulseEfficiencyData, setPulseEfficiencyData] = useState<any>(null);

    // Changed: Track individual task approval status
    const [taskApprovalStatus, setTaskApprovalStatus] = useState<TaskApprovalStatus>({});

    const {
        playAlert,
        isAudioEnabled,
        toggleAudio,
        hasPlayedAlert,
        isAudioReady,
        initializeAudio,
        resetAlerts,
    } = useAudioAlert();

    const { on: socketOn, joinUserRoom, joinTaskRoom } = useSocket();

    // Socket setup
    useEffect(() => {
        const resolvedUserId =
            (user as any)?._id ||
            (user as any)?.id ||
            (user as any)?.userId?._id ||
            (user as any)?.userId?.id;

        if (resolvedUserId) {
            joinUserRoom(resolvedUserId.toString());
        }

        dailyAssignments.forEach((task) => {
            if (task?._id) {
                joinTaskRoom(task._id.toString());
            }
        });
    }, [user, dailyAssignments, joinUserRoom, joinTaskRoom]);

    useEffect(() => {
        const offTaskUpdated = socketOn("task_updated", (payload: any) => {
            if (payload?.data) {
                dispatch(upsertTask(payload.data));
            } else if (payload?.task) {
                dispatch(upsertTask(payload.task));
            } else {
                dispatch(fetchUserDailyTaskAssignments());
            }
        });

        const offTaskCreated = socketOn("task_created", (payload: any) => {
            try {
                if (payload?.task) {
                    dispatch(upsertTask(payload.task));

                    toast.success("New task assigned", {
                        description: payload.task.title || "A new task has been assigned to you.",
                    });
                } else {
                    dispatch(fetchUserDailyTaskAssignments());
                }
            } catch (e) {
                console.error("task_created handler error", e);
                dispatch(fetchUserDailyTaskAssignments());
            }
        });

        const offStuckCreated = socketOn(
            "stuck_request_created",
            (_payload: any) => {
                dispatch(fetchUserDailyTaskAssignments());
            }
        );

        const offStuckResponse = socketOn(
            "stuck_request_response",
            (_payload: any) => {
                dispatch(fetchUserDailyTaskAssignments());
            }
        );

        const offTaskStatusChanged = socketOn(
            "task_status_changed",
            (_payload: any) => {
                dispatch(fetchUserDailyTaskAssignments());
            }
        );

        const offApprovalUpdated = socketOn(
            "approval_updated",
            (_payload: any) => {
                dispatch(fetchUserDailyTaskAssignments());
            }
        );

        const offApprovalRequested = socketOn(
            "approval_requested",
            (payload: any) => {
                console.log("approval_requested:", payload);
                toast.info("New approval request", {
                    description: "Someone submitted their day-end tasks for approval.",
                });
            }
        );

        return () => {
            offTaskUpdated?.();
            offStuckCreated?.();
            offStuckResponse?.();
            offTaskStatusChanged?.();
            offApprovalUpdated?.();
            offApprovalRequested?.();
            offTaskCreated?.();
        };
    }, [socketOn, dispatch]);

    useEffect(() => {
        if (isAudioEnabled && !isAudioReady) {
            resetAlerts();
        }
    }, [isAudioEnabled, isAudioReady, resetAlerts]);

    useEffect(() => {
        if (isAudioEnabled && !isAudioReady) {
            const initAudio = async () => {
                try {
                    await initializeAudio();
                } catch (error) {
                    console.error("Background audio initialization failed:", error);
                }
            };
            initAudio();
        }
    }, [isAudioEnabled, isAudioReady, initializeAudio]);

    // Initialize task approval status from localStorage
    useEffect(() => {
        const today = new Date().toDateString();
        const storedApprovalStatus = localStorage.getItem("taskApprovalStatus");

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
    }, []);

    // Save task approval status to localStorage whenever it changes
    useEffect(() => {
        if (Object.keys(taskApprovalStatus).length > 0) {
            localStorage.setItem("taskApprovalStatus", JSON.stringify(taskApprovalStatus));
        }
    }, [taskApprovalStatus]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                await dispatch(getProfile()).unwrap();
            } catch (err) {
                setError("Failed to fetch user data");
                console.error(err);
            }
        };

        fetchUserData();
    }, [dispatch]);

    useEffect(() => {
        const fetchPulseEfficiency = async () => {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            const monthYear = `${currentYear}-${String(currentMonth + 1).padStart(
                2,
                "0"
            )}`;

            try {
                const result = await dispatch(
                    fetchMonthlyPulseEfficiency(monthYear)
                ).unwrap();
                setPulseEfficiencyData(result[0]);
            } catch (error) {
                console.error("Failed to fetch pulse efficiency:", error);
                setPulseEfficiencyData(null);
            }
        };

        fetchPulseEfficiency();
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchUserDailyTaskAssignments());
    }, [dispatch]);

    // Cleanup file preview URLs
    useEffect(() => {
        return () => {
            Object.values(files).forEach(fileArray => {
                fileArray.forEach(file => URL.revokeObjectURL(file.preview));
            });
        };
    }, [files]);

    useEffect(() => {
        const initialProgress: Record<string, number> = {};
        const initialTime: Record<string, number> = {};

        dailyAssignments.forEach((task) => {
            initialProgress[task._id] = getInitialProgressValue(task);
            initialTime[task._id] = task.timerStartTime
                ? (Date.now() - new Date(task.timerStartTime).getTime()) / 1000
                : 0;
        });

        setProgressValues(initialProgress);
        setTimeElapsed(initialTime);
    }, [dailyAssignments]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const updatedProgress = { ...progressValues };
            const updatedTime = { ...timeElapsed };
            const newTatAlerts = { ...tatAlerts };
            const newCriticalAlerts = { ...criticalAlerts };

            dailyAssignments.forEach((task) => {
                if (task.timer_status === "InProgress" && task.timerStartTime) {
                    const startTime = new Date(task.timerStartTime).getTime();
                    const elapsedSeconds = (now - startTime) / 1000;
                    updatedTime[task._id] = elapsedSeconds;

                    const tatSeconds = (task.TAT || 480) * 60;
                    const progressPercentage = Math.min(
                        (elapsedSeconds / tatSeconds) * 100,
                        100
                    );
                    updatedProgress[task._id] = progressPercentage;

                    if (
                        progressPercentage >= 80 &&
                        progressPercentage < 100 &&
                        !tatAlerts[task._id]
                    ) {
                        newTatAlerts[task._id] = true;

                        if (!hasPlayedAlert(task._id)) {
                            playAlert(task._id);
                        }

                        const taskTitle = task.title || `Task ${task._id}` || "Unknown Task";

                        toast.warning(`TAT Warning for ${taskTitle}`, {
                            description:
                                "80% of time allocated for this task has been used. Only 20% remaining!",
                            duration: 10000,
                        });

                        dispatch(
                            sendTaskStatusEmail({
                                to: (user as any)?.userId?.email || (user as any)?.email || "",
                                name: (user as any)?.userId?.name || (user as any)?.name || "User",
                                taskName: taskTitle,
                                taskStatus: 80,
                            })
                        );
                    }

                    if (progressPercentage >= 100 && !criticalAlerts[task._id]) {
                        newCriticalAlerts[task._id] = true;

                        if (!hasPlayedAlert(`${task._id}_critical`)) {
                            playAlert(`${task._id}_critical`);
                        }

                        const taskTitle = task.title || `Task ${task._id}` || "Unknown Task";

                        toast.error(`Deadline Reached for ${taskTitle}`, {
                            description:
                                "The allocated time for this task has been exhausted!",
                            duration: 15000,
                        });
                    }
                }
            });

            setTatAlerts(newTatAlerts);
            setCriticalAlerts(newCriticalAlerts);
            setTimeElapsed(updatedTime);
            setProgressValues(updatedProgress);
        }, 1000);

        return () => clearInterval(interval);
    }, [
        dailyAssignments,
        progressValues,
        timeElapsed,
        tatAlerts,
        criticalAlerts,
        dispatch,
        user,
        playAlert,
        hasPlayedAlert,
    ]);

    const getInitialProgressValue = (task: any) => {
        if (task.timer_status === "Done") return 100;
        if (task.timer_status === "Stuck") return 25;
        if (task.timer_status === "Todo") return 0;

        if (task.timerStartTime) {
            const elapsedSeconds =
                (Date.now() - new Date(task.timerStartTime).getTime()) / 1000;
            const tatSeconds = (task.TAT || 480) * 60;
            return Math.min((elapsedSeconds / tatSeconds) * 100, 100);
        }

        return 0;
    };

    const getEfficiencyMessage = (score: number) => {
        if (score >= 200) return "Exceptional performance! Outstanding work!";
        if (score >= 150)
            return "Excellent performance! Maintaining high standards!";
        if (score >= 100) return "Great performance! Well above expectations!";
        if (score >= 90) return "Excellent performance! Keep it up!";
        if (score >= 80) return "Good progress, aim for higher efficiency.";
        if (score >= 70) return "Solid work, room for improvement.";
        if (score >= 60) return "Meeting expectations.";
        return "Consider reviewing your workflow for improvements.";
    };

    const handleStatusChange = async (
        taskId: string,
        newStatus: "Todo" | "InProgress" | "Stuck" | "Done"
    ) => {
        // Find task from daily assignments
        const task = dailyAssignments.find((t) => t._id === taskId);
        if (!task) return;

        try {
            if (newStatus === "Stuck") {
                setCurrentTaskId(taskId);
                setCurrentTask(task);
                setOpenStuckDialog(true);
                return;
            }

            if (newStatus === "Done") {
                const isOverdue = isTaskOverdue(task);
                if (isOverdue) {
                    setCurrentTaskId(taskId);
                    setCurrentTask(task);
                    setOpenOverdueDialog(true);
                    return;
                }
                setCurrentTaskId(taskId);
                setCurrentTask(task);
                setOpenProofDialog(true);
                return;
            }

            await dispatch(
                changeTimerStatus({
                    id: taskId,
                    timer_status: newStatus,
                })
            ).unwrap();

            await dispatch(fetchUserDailyTaskAssignments());

            setProgressValues((prev) => ({
                ...prev,
                [taskId]: newStatus === "Todo" ? 0 : prev[taskId] || 0,
            }));

            toast.success("Status updated", {
                description: `Task status changed to ${newStatus}`,
            });
        } catch (error) {
            console.error("Status change error:", error);
            toast.error("Error", {
                description: "Failed to update task status",
            });
        }
    };

    const isTaskOverdue = (task: any) => {
        if (!task.timerStartTime) return false;
        const tatSeconds = (task.TAT || 480) * 60;
        const elapsed =
            (Date.now() - new Date(task.timerStartTime).getTime()) / 1000;
        return elapsed > tatSeconds;
    };

    const submitStuckRequest = async () => {
        if (!currentTaskId || !stuckReason) return;

        try {
            await dispatch(
                requestStuckStatus({
                    id: currentTaskId,
                    stuck_reason: stuckReason,
                })
            ).unwrap();

            await dispatch(fetchUserDailyTaskAssignments());

            setProgressValues((prev) => ({
                ...prev,
                [currentTaskId]: 25,
            }));

            toast.info("Stuck request submitted", {
                description: "Your manager will review your request.",
            });
            setOpenStuckDialog(false);
            setStuckReason("");
        } catch (error) {
            toast.error("Error", {
                description: "Failed to submit stuck request.",
            });
        }
    };

    const submitOverdueTask = async () => {
        if (!currentTaskId || !overdueReason || !currentTask) return;

        try {
            const proofs: Record<string, { type: 'url' | 'file'; value: string | File }> = {};

            // Handle file proofs
            if (currentTask.proof) {
                currentTask.proof.forEach((proof: any) => {
                    if (proof.type === 'file' && files[proof.fieldName]?.length > 0) {
                        // Take the first file for each proof field
                        proofs[proof.fieldName] = {
                            type: 'file',
                            value: files[proof.fieldName][0]
                        };
                    } else if (proof.type === 'url' && proofLinks[proof.fieldName]) {
                        proofs[proof.fieldName] = {
                            type: 'url',
                            value: proofLinks[proof.fieldName]
                        };
                    }
                });
            }

            const submissionData = {
                assignmentId: currentTaskId,
                proofs,
                comment: proofComment,
                reason: overdueReason
            };

            await dispatch(changeTimerStatus({
                id: currentTaskId,
                timer_status: 'Done'
            })).unwrap();

            await dispatch(createSubmission(submissionData)).unwrap();

            await dispatch(fetchUserDailyTaskAssignments());

            setProgressValues(prev => ({ ...prev, [currentTaskId]: 100 }));
            setOverdueReason("");
            setFiles({});
            setProofLinks({});
            setProofComment("");
            setOpenOverdueDialog(false);

            toast.success("Overdue task submitted", {
                description: "Your overdue task has been submitted with proof and reason.",
            });
        } catch (error: any) {
            console.error("Overdue submission error:", error);
            toast.error("Error", {
                description: error?.message || "Failed to submit overdue task.",
            });
        }
    };

    const submitProof = async () => {
        if (!currentTaskId || !currentTask) return;

        try {
            const proofs: Record<string, { type: 'url' | 'file'; value: string | File }> = {};

            // Handle file proofs
            if (currentTask.proof) {
                currentTask.proof.forEach((proof: any) => {
                    if (proof.type === 'file' && files[proof.fieldName]?.length > 0) {
                        // Take the first file for each proof field
                        proofs[proof.fieldName] = {
                            type: 'file',
                            value: files[proof.fieldName][0]
                        };
                    } else if (proof.type === 'url' && proofLinks[proof.fieldName]) {
                        proofs[proof.fieldName] = {
                            type: 'url',
                            value: proofLinks[proof.fieldName]
                        };
                    }
                });
            }

            const submissionData = {
                assignmentId: currentTaskId,
                proofs,
                comment: proofComment,
                reason: ""
            };

            await dispatch(changeTimerStatus({
                id: currentTaskId,
                timer_status: 'Done'
            })).unwrap();

            await dispatch(createSubmission(submissionData)).unwrap();
            await dispatch(fetchUserDailyTaskAssignments());

            setProgressValues(prev => ({ ...prev, [currentTaskId]: 100 }));
            setFiles({});
            setProofLinks({});
            setProofComment("");
            setOpenProofDialog(false);

            toast.success("Submission created", {
                description: "Your task proof has been successfully submitted.",
            });
        } catch (error: any) {
            console.error("Submission error:", error);
            toast.error("Error", {
                description: error?.message || "Failed to create submission.",
            });
        }
    };

    // Modified: Send individual task for approval
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
            // Get assigner ID from the task - handle both string and User object
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
                    assignBy: assignerId, // Now definitely a string
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

    const handleFilesChange = (fieldName: string, newFiles: FileWithPreview[]) => {
        setFiles(prev => ({
            ...prev,
            [fieldName]: newFiles
        }));
    };

    const removeFile = (fieldName: string, file: FileWithPreview) => {
        setFiles(prev => ({
            ...prev,
            [fieldName]: (prev[fieldName] || []).filter(f => f.name !== file.name)
        }));
        URL.revokeObjectURL(file.preview);
    };

    const handleProofLinkChange = (fieldName: string, value: string) => {
        setProofLinks((prev) => ({
            ...prev,
            [fieldName]: value,
        }));
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "InProgress":
                return (
                    <Badge variant="outline" className="text-blue-600">
                        In Progress
                    </Badge>
                );
            case "Stuck":
                return (
                    <Badge variant="outline" className="text-yellow-600">
                        Stuck
                    </Badge>
                );
            case "Done":
                return (
                    <Badge variant="outline" className="text-green-600">
                        Done
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="text-gray-600">
                        Todo
                    </Badge>
                );
        }
    };

    const getTimeRemaining = (task: any) => {
        if (task.timer_status !== "InProgress" || !task.timerStartTime) return null;

        const tatSeconds = (task.TAT || 480) * 60;
        const elapsed = timeElapsed[task._id] || 0;
        const remaining = tatSeconds - elapsed;

        if (remaining <= 0) return "Overdue!";

        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = Math.floor(remaining % 60);

        return `${hours}h ${minutes}m ${seconds}s remaining`;
    };

    const hasRequiredProofs = (task: any) => {
        // Add null check for task
        if (!task || !task.proof || task.proof.length === 0) return true;

        return task.proof.every((proof: any) => {
            if (proof.type === 'url') {
                return !!proofLinks[proof.fieldName];
            } else if (proof.type === 'file') {
                return files[proof.fieldName]?.length > 0;
            }
            return true;
        });
    };

    const renderProofInputs = (task: any) => {
        // Add null check for task
        if (!task || !task.proof || task.proof.length === 0) {
            return (
                <div>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                        <UploadIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            No proof requirements for this task
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {task.proof.map((proof: any) => {
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
                                <FileDropzone
                                    fieldName={proof.fieldName}
                                    files={files[proof.fieldName] || []}
                                    onFilesChange={handleFilesChange}
                                    onRemoveFile={removeFile}
                                />
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        );
    };

    // Calculate counts
    const pendingApprovalsCount = dailyAssignments.filter(
        (task) => task.timer_status === "InProgress" || task.timer_status === "Todo"
    ).length;

    const tasksDoneCount = dailyAssignments.filter(
        (task) => task.timer_status === "Done"
    ).length;

    const tasksSubmittedForApprovalCount = Object.keys(taskApprovalStatus).length;


    const tasksToRender = dailyAssignments;

    return (
        <div className="p-[40px] dark:bg-slate-950 min-h-screen">
            <Toaster richColors />

            <div className="flex justify-between items-start mb-[24px]">
                <div>
                    <h1 className="text-[20px] font-semibold text-[#1F2937] dark:text-white">Tasks View</h1>
                    <p className="text-[12px] text-[#9CA3AF] dark:text-gray-400" suppressHydrationWarning>
                        {dayjs().format("dddd, MMMM D, YYYY")}
                    </p>
                </div>

                <Button
                    variant="outline"
                    onClick={async () => {
                        try {
                            if (!isAudioEnabled) {
                                toggleAudio();
                                await initializeAudio();
                                toast.success("Audio enabled");
                            } else {
                                toggleAudio();
                                toast.info("Audio disabled");
                            }
                        } catch (error) {
                            console.error("Audio toggle failed:", error);
                            if (!isAudioEnabled) {
                                toggleAudio();
                            }
                            toast.error("Failed to initialize audio");
                        }
                    }}
                    className="flex items-center gap-2 rounded-[8px] border-[#3F5A54] bg-white text-[#3F5A54] text-[14px] font-medium h-[29px] w-[103px] shadow-sm"
                >
                    {isAudioEnabled ? "Audio On" : "Audio Off"}
                    <Music className="w-[16px] h-[16px] text-[#3F5A54]" />
                </Button>
            </div>

            <div className="flex gap-[40px] items-center mb-[24px]">
                <Card className="rounded-[10px] w-[420px] border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.02)] bg-white dark:bg-slate-900 h-[100px] flex items-center justify-center">
                    <CardContent className="p-[20px] w-full flex items-center justify-between">
                        <div>
                            <p className="text-[14px] text-[#9CA3AF] mb-1">Tasks Due Today</p>
                            <p className="text-[16px] font-medium text-[#9333EA] leading-none">{tasksToRender.length}</p>
                        </div>
                        <div className="w-[36px] h-[36px] rounded-[8px] bg-[#FAF5FF] flex items-center justify-center">
                            <Clock className="w-[20px] h-[20px] text-[#9333EA]" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[10px] w-[420px] border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.02)] bg-white dark:bg-slate-900 h-[100px] flex items-center justify-center">
                    <CardContent className="p-[20px] w-full flex items-center justify-between">
                        <div>
                            <p className="text-[14px] text-[#9CA3AF] mb-1">Tasks Completed</p>
                            <p className="text-[16px] font-medium text-[#22C55E] leading-none">{tasksDoneCount}</p>
                        </div>
                        <div className="w-[36px] h-[36px] rounded-[8px] bg-[#DCFCE7] flex items-center justify-center">
                            <CheckCircleIcon className="w-[20px] h-[20px] text-[#22C55E]" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[10px] w-[420px] border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.02)] bg-white dark:bg-slate-900 h-[100px] flex items-center justify-center">
                    <CardContent className="p-[20px] w-full flex items-center justify-between">
                        <div>
                            <p className="text-[14px] text-[#9CA3AF] mb-1">Pending Approval</p>
                            <p className="text-[16px] font-medium text-[#FACC15] leading-none">{tasksSubmittedForApprovalCount}</p>
                        </div>
                        <div className="w-[36px] h-[36px] rounded-[8px] bg-[#FEF3C7] flex items-center justify-center">
                            <Hourglass className="w-[20px] h-[20px] text-[#FACC15]" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-[30px]">
                <div className="flex justify-between items-center mb-[20px]">
                    <h2 className="text-[20px] font-semibold text-[#1F2937] dark:text-white">Tasks View</h2>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <p>Loading tasks...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {tasksToRender.map((task) => {
                            const isTaskSubmitted = taskApprovalStatus[task._id]?.isSubmitted || false;
                            const today = new Date().toDateString();

                            // Re-calculate progress style safely
                            const progress = Math.round(progressValues[task._id] || 0);

                            return (
                                <Card key={task._id} className="rounded-[10px] border-[#E5E7EB] shadow-[0_2px_20px_rgba(0,0,0,0.03)] bg-white dark:bg-slate-900 overflow-hidden p-0 gap-0">
                                    <div className="p-0">
                                        {/* Card Header */}
                                        <div className="flex justify-between items-center p-6 mb-0">
                                            <h3 className="text-[18px] font-semibold text-[#1F2937] dark:text-white truncate max-w-[240px]">
                                                {task.title || "No Title"}
                                            </h3>

                                            <div className="flex items-center gap-4">
                                                <Badge className="bg-[#FFC107] hover:bg-[#FFC107] text-white text-[11px] font-medium rounded-full px-4 h-[24px]">
                                                    Medium
                                                </Badge>
                                                <span className="px-4 py-1 rounded-full bg-[#F3F4F6] text-[#4B5563] text-[12px] font-medium">
                                                    {task.timer_status === "Todo" ? "To Do" :
                                                        task.timer_status === "InProgress" ? "In progress" :
                                                            task.timer_status === "Done" ? "Done" : "Stuck"}
                                                </span>
                                                <div className="h-4 w-[1px] bg-[#E5E7EB] mx-1" />
                                                <div className="flex items-center gap-2 text-[#9CA3AF] text-[12px]">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>Due: {new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-[1px] w-full bg-[#F3F4F6] mb-6" />

                                        {/* Card Body */}
                                        <div className="flex items-center justify-between px-6 mb-1">
                                            <div className="flex-1 space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[14px] text-[#4B5563] dark:text-gray-400">Progress</span>
                                                    <span className="text-[14px] font-bold text-[#1F2937] dark:text-white">{progress}%</span>
                                                </div>
                                                <Progress
                                                    value={progress}
                                                    className="h-[8px] bg-[#F3F4F6] dark:bg-slate-800"
                                                    indicatorClassName={
                                                        progress >= 100 ? "bg-[#22C55E]" : "bg-[#3B82F6]"
                                                    }
                                                />
                                                {task.timer_status === "InProgress" && (
                                                    <p className="text-[11px] text-[#9CA3AF] mt-2">
                                                        {getTimeRemaining(task)}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="w-[1px] bg-[#F3F4F6] h-16 mx-10" />

                                            <div className="flex flex-col gap-3 min-w-[150px]">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[13px] text-[#9CA3AF]">Original TAT</span>
                                                    <span className="text-[13px] font-medium text-[#3B82F6]">{task.previous_TAT?.[0] ?? task.TAT} mins</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[13px] text-[#9CA3AF]">Current TAT</span>
                                                    <span className="text-[13px] font-medium text-[#1F2937] dark:text-white">{task.TAT} mins</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-[1px] w-full bg-[#F3F4F6] mb-6" />

                                        {/* Card Footer */}
                                        <div className="flex justify-between items-center p-6 mt-0">
                                            <div className="text-[14px] text-[#9CA3AF]">
                                                Stuck Records: <span className="text-[#EF4444] font-medium ml-1">
                                                    {task.previous_TAT && task.previous_TAT.length > 0
                                                        ? task.previous_TAT.map(t => `${t} mins`).join(", ")
                                                        : "None"}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {task.timer_status === "Done" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => !isTaskSubmitted && submitTaskForApproval(task._id)}
                                                        disabled={isTaskSubmitted}
                                                        className={`text-[12px] font-medium ${isTaskSubmitted ? "text-[#22C55E]" : "text-[#4B5563] hover:text-blue-600"} px-4 mr-2`}
                                                    >
                                                        {isTaskSubmitted ? "Submitted" : "Submit"}
                                                    </Button>
                                                )}

                                                <Select
                                                    value={task.timer_status}
                                                    onValueChange={(value: "Todo" | "InProgress" | "Stuck" | "Done") => handleStatusChange(task._id, value)}
                                                >
                                                    <SelectTrigger className="w-[146px] h-[37px] bg-[#3F5A54] hover:bg-[#324945] text-white border-none rounded-[8px] text-[14px] font-medium focus:ring-0 px-2 flex items-center justify-center gap-2 [&_svg]:text-white! [&_svg]:opacity-100!">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white border-none text-black">
                                                        <SelectItem value="Todo" disabled={task.timer_status !== "Todo"} className="focus:bg-[#88b2f5] focus:text-white">To do</SelectItem>
                                                        <SelectItem
                                                            value="InProgress"
                                                            disabled={task.timer_status === "Done"}
                                                            className="focus:bg-[#88b2f5] focus:text-white"
                                                        >
                                                            In Progress
                                                        </SelectItem>
                                                        <SelectItem
                                                            value="Stuck"
                                                            disabled={
                                                                task.timer_status === "Stuck" ||
                                                                task.timer_status === "Done" ||
                                                                task.timer_status !== "InProgress"
                                                            }
                                                            className="focus:bg-[#88b2f5] focus:text-white"
                                                        >
                                                            Stuck
                                                        </SelectItem>
                                                        <SelectItem
                                                            value="Done"
                                                            disabled={
                                                                task.timer_status === "Done" ||
                                                                task.timer_status !== "InProgress"
                                                            }
                                                            className="focus:bg-[#88b2f5] focus:text-white"
                                                        >
                                                            Done
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <Dialog open={openStuckDialog} onOpenChange={setOpenStuckDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Stuck Status</DialogTitle>
                        <DialogDescription>
                            Please explain why you're stuck on this task and need assistance.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Textarea
                            placeholder="Explain why you're stuck and need help..."
                            value={stuckReason}
                            onChange={(e) => setStuckReason(e.target.value)}
                        />
                        <Button onClick={submitStuckRequest} disabled={!stuckReason}>
                            Submit Request
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={openOverdueDialog} onOpenChange={setOpenOverdueDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Task Overdue</DialogTitle>
                        <DialogDescription>
                            Please explain why this task was completed after the deadline and provide proof.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Textarea
                            placeholder="Explain why this task is overdue..."
                            value={overdueReason}
                            onChange={(e) => setOverdueReason(e.target.value)}
                            className="min-h-[100px]"
                        />

                        {currentTask && renderProofInputs(currentTask)}

                        <Textarea
                            placeholder="Additional comments (optional)"
                            value={proofComment}
                            onChange={(e) => setProofComment(e.target.value)}
                        />

                        <Button
                            onClick={submitOverdueTask}
                            disabled={!overdueReason || (currentTask && !hasRequiredProofs(currentTask))}
                        >
                            Submit Overdue Task
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={openProofDialog} onOpenChange={setOpenProofDialog}>
                <DialogContent className="max-w-[500px] p-0 overflow-hidden rounded-[16px] border-none shadow-2xl">
                    <div className="p-8">
                        <DialogHeader className="mb-6 relative">
                            <DialogTitle className="text-[22px] font-bold text-[#1F2937]">Submit Proof of Completion</DialogTitle>
                            <DialogDescription className="text-[14px] text-[#6B7280]">
                                Provide evidence that you've completed this task.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Static screenshot label for UI match */}
                                <FileDropzone
                                    fieldName="screenshot"
                                    files={files["screenshot"] || []}
                                    onFilesChange={handleFilesChange}
                                    onRemoveFile={removeFile}
                                />

                            {/* Uploaded Files Section */}
                            {files["screenshot"]?.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-[15px] font-semibold text-[#111827]">Files for screenshot:</p>
                                    <div className="space-y-2">
                                        {files["screenshot"].map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-[10px] bg-white group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-[44px] h-[44px] rounded-[6px] overflow-hidden border border-[#F3F4F6]">
                                                        {file.type.startsWith('image/') ? (
                                                            <Image src={file.preview} alt={file.name} width={44} height={44} className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-[#F3F4F6] text-[10px] font-bold text-[#9CA3AF] uppercase">
                                                                {file.name.split('.').pop()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-[14px] text-[#374151] font-medium truncate max-w-[200px]">{file.name}</span>
                                                </div>
                                                <button
                                                    onClick={() => removeFile("screenshot", file)}
                                                    className="p-1.5 hover:bg-[#F3F4F6] rounded-full text-[#9CA3AF] hover:text-[#EF4444] transition-colors"
                                                >
                                                    <XIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Textarea
                                    placeholder="Additional comments (optional)"
                                    value={proofComment}
                                    onChange={(e) => setProofComment(e.target.value)}
                                    className="min-h-[100px] rounded-[10px] border-[#E5E7EB] placeholder:text-[#9CA3AF] resize-none focus:ring-[#3B82F6] focus:border-[#3B82F6]"
                                />
                            </div>

                            <Button
                                onClick={submitProof}
                                className="w-fit h-[44px] bg-[#323D4E] hover:bg-[#1E293B] text-white font-medium rounded-[8px] px-8 py-2 text-[14px] shadow-sm transition-all"
                            >
                                Submit Proof
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}




// "use client";
//
// import { Card, CardContent } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from "@/components/ui/select";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import {
//   BellIcon,
//   CalendarIcon,
//   AlertCircleIcon,
//   CheckCircleIcon,
//   UploadIcon,
//   XIcon,
//   Volume2Icon,
//   VolumeXIcon,
// } from "lucide-react";
// import { useEffect, useState } from "react";
// import { useAppDispatch, useAppSelector } from "@/store/hooks";
// import {
//   changeTimerStatus,
//   requestStuckStatus,
//   fetchUserDailyTaskAssignments,
//   selectDailyTaskAssignments
// } from "@/features/taskAssignments/taskAssignmentSlice";
// import { requestApproval } from "@/features/approvals/approvalSlice";
// import { createSubmission } from "@/features/submissions/submissionSlice";
// import { fetchMonthlyPulseEfficiency } from "@/features/efficiencyReport/pulseEfficiencySlice";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Toaster, toast } from "sonner";
// import { FileRejection, useDropzone } from "react-dropzone";
// // import { FileWithPreview } from "@/types";
// import {  getProfile } from '@/features/auth/authSlice';
// import Image from "next/image";
// import dayjs from "dayjs";
// import { sendTaskStatusEmail } from '@/features/EmailTat/emailSlice';
// import { useAudioAlert } from '@/hooks/useAudioAlert';
//
//
// interface FileWithPreview extends File {
//   preview: string;
// }
//
//
// export default function AdminTaskLayout() {
//   const dispatch = useAppDispatch();
//
//   const [error, setError] = useState('');
//     const { dailyAssignments, loading } = useAppSelector((state) => state.taskAssignments);
//
//   const [stuckReason, setStuckReason] = useState("");
//   const [overdueReason, setOverdueReason] = useState("");
//   const [proofLinks, setProofLinks] = useState<Record<string, string>>({});
//   const [proofComment, setProofComment] = useState("");
//   const [files, setFiles] = useState<FileWithPreview[]>([]);
//   const [openStuckDialog, setOpenStuckDialog] = useState(false);
//   const [openProofDialog, setOpenProofDialog] = useState(false);
//   const [openOverdueDialog, setOpenOverdueDialog] = useState(false);
//     // const [success, setSuccess] = useState('');
//   const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
//   const [currentTask, setCurrentTask] = useState<any>(null);
//   const [progressValues, setProgressValues] = useState<Record<string, number>>({});
//   const [timeElapsed, setTimeElapsed] = useState<Record<string, number>>({});
//
//   const [tatAlerts, setTatAlerts] = useState<Record<string, boolean>>({});
//   const [criticalAlerts, setCriticalAlerts] = useState<Record<string, boolean>>({});
// const [pulseEfficiencyData, setPulseEfficiencyData] = useState<any>(null);
//
// const [sealSubmitted, setSealSubmitted] = useState(false);
// const [isSubmittingSeal, setIsSubmittingSeal] = useState(false);
//
//   const { playAlert, isAudioEnabled, toggleAudio, hasPlayedAlert, isAudioReady, initializeAudio, resetAlerts } = useAudioAlert();
//
//    useEffect(() => {
//     if (isAudioEnabled && !isAudioReady) {
//       resetAlerts();
//     }
//   }, [isAudioEnabled, isAudioReady, resetAlerts]);
//
//
//
// useEffect(() => {
//   // Only initialize if audio is enabled and not ready
//   if (isAudioEnabled && !isAudioReady) {
//     const initAudio = async () => {
//       try {
//         await initializeAudio();
//       } catch (error) {
//         console.error("Background audio initialization failed:", error);
//       }
//     };
//     initAudio();
//   }
// }, [isAudioEnabled, isAudioReady, initializeAudio]);
//
//
// useEffect(() => {
//   const today = new Date().toDateString();
//   const lastSubmittedDate = localStorage.getItem('lastSealSubmittedDate');
//
//   if (lastSubmittedDate === today) {
//     setSealSubmitted(true);
//   }
// }, []);
//
//   const { user, role, loading: authLoading, error: authError } = useAppSelector((state) => state.auth);
//
//
//
//   const activityItems = [
//     {
//       icon: <CheckCircleIcon className="w-4 h-4 text-green-600" />,
//       message: 'Your "Website Redesign" seal was approved by John Doe.',
//       time: "2 hours ago",
//     },
//     {
//       icon: <BellIcon className="w-4 h-4 text-blue-600" />,
//       message: 'New task "Q3 Budget Review" assigned by Jane Smith.',
//       time: "Yesterday",
//     },
//     {
//       icon: <AlertCircleIcon className="w-4 h-4 text-red-600" />,
//       message: 'TAT warning: "Client Demo Prep" is approaching deadline.',
//       time: "3 hours ago",
//     },
//     {
//       icon: <CheckCircleIcon className="w-4 h-4 text-green-600" />,
//       message: "You moved up to #3 on the weekly leaderboard!",
//       time: "1 day ago",
//     },
//     {
//       icon: <AlertCircleIcon className="w-4 h-4 text-yellow-600" />,
//       message: 'Your "Blog Post Draft" seal was rejected. Check comments.',
//       time: "2 days ago",
//     },
//     {
//       icon: <CalendarIcon className="w-4 h-4 text-purple-600" />,
//       message: "Daily reminder: Submit your seal for today!",
//       time: "1 hour ago",
//     },
//   ];
//
//   useEffect(() => {
//       const fetchUserData = async () => {
//         try {
//           await dispatch(getProfile()).unwrap();
//
//         } catch (err) {
//           setError('Failed to fetch user data');
//
//           console.error(err);
//         }
//       };
//
//       fetchUserData();
//     }, [dispatch]);
//
//   const { getRootProps, getInputProps } = useDropzone({
//     accept: {
//       'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
//       'application/pdf': ['.pdf'],
//       'text/plain': ['.txt'],
//     },
//     maxFiles: 5,
//     onDrop: async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
//       if (fileRejections.length > 0) {
//         toast.error("Invalid file type", {
//           description: "Please upload only image, PDF, or text files.",
//         });
//         return;
//       }
//
//       const filesWithPreview = acceptedFiles.map(file =>
//         Object.assign(file, {
//           preview: URL.createObjectURL(file)
//         })
//       );
//
//       setFiles(filesWithPreview);
//     },
//   });
//
// useEffect(() => {
//   const fetchPulseEfficiency = async () => {
//     const currentDate = new Date();
//     const currentMonth = currentDate.getMonth();
//     const currentYear = currentDate.getFullYear();
//     const monthYear = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
//
//     try {
//       const result = await dispatch(fetchMonthlyPulseEfficiency(monthYear)).unwrap();
//       setPulseEfficiencyData(result[0]); // Store the first item of the array
//     } catch (error) {
//       console.error("Failed to fetch pulse efficiency:", error);
//       setPulseEfficiencyData(null);
//     }
//   };
//
//   fetchPulseEfficiency();
// }, [dispatch]);
//
//   useEffect(() => {
//     dispatch(fetchUserDailyTaskAssignments());
//   }, [dispatch]);
//
//   useEffect(() => {
//     return () => {
//       files.forEach(file => URL.revokeObjectURL(file.preview));
//     };
//   }, [files]);
//
//   useEffect(() => {
//     const initialProgress: Record<string, number> = {};
//     const initialTime: Record<string, number> = {};
//
//     dailyAssignments.forEach(task => {
//       initialProgress[task._id] = getInitialProgressValue(task);
//       initialTime[task._id] = task.timerStartTime
//         ? (Date.now() - new Date(task.timerStartTime).getTime()) / 1000
//         : 0;
//     });
//
//     setProgressValues(initialProgress);
//     setTimeElapsed(initialTime);
//   }, [dailyAssignments]);
//
//
//   useEffect(() => {
//     const interval = setInterval(() => {
//       const now = Date.now();
//       const updatedProgress = {...progressValues};
//       const updatedTime = {...timeElapsed};
//       const newTatAlerts = {...tatAlerts};
//       const newCriticalAlerts = {...criticalAlerts};
//
//       dailyAssignments.forEach(task => {
//         if (task.timer_status === 'InProgress' && task.timerStartTime) {
//           const startTime = new Date(task.timerStartTime).getTime();
//           const elapsedSeconds = (now - startTime) / 1000;
//           updatedTime[task._id] = elapsedSeconds;
//
//           const tatSeconds = (task.TAT || 480) * 60;
//           const progressPercentage = Math.min(
//             (elapsedSeconds / tatSeconds) * 100,
//             100
//           );
//           updatedProgress[task._id] = progressPercentage;
//
//           // FIXED: Safeguard task title and audio for 80% completion
//           if (progressPercentage >= 80 && progressPercentage < 100 && !tatAlerts[task._id]) {
//             newTatAlerts[task._id] = true;
//
//             // Play audio alert (only once per task)
//             if (!hasPlayedAlert(task._id)) {
//               playAlert(task._id);
//             }
//
//             // FIXED: Proper task title extraction
//             const taskTitle = task.title  || `Task ${task._id}` || 'Unknown Task';
//
//             toast.warning(`TAT Warning for ${taskTitle}`, {
//               description: `80% of time allocated for this task has been used. Only 20% remaining!`,
//               duration: 10000,
//             });
//
//             // Send email notification
//             dispatch(sendTaskStatusEmail({
//               to: user?.userId?.email || '',
//               name: user?.userId?.name || 'User',
//               taskName: taskTitle,
//               taskStatus: 80
//             }));
//           }
//
//           // FIXED: Safeguard task title and audio for 100% completion
//           if (progressPercentage >= 100 && !criticalAlerts[task._id]) {
//             newCriticalAlerts[task._id] = true;
//
//             // Play critical alert sound (different ID to allow both alerts)
//             if (!hasPlayedAlert(`${task._id}_critical`)) {
//               playAlert(`${task._id}_critical`);
//             }
//
//             // FIXED: Proper task title extraction
//             const taskTitle = task.title  || `Task ${task._id}` || 'Unknown Task';
//
//             toast.error(`Deadline Reached for ${taskTitle}`, {
//               description: `The allocated time for this task has been exhausted!`,
//               duration: 15000,
//             });
//           }
//         }
//       });
//
//       setTatAlerts(newTatAlerts);
//       setCriticalAlerts(newCriticalAlerts);
//       setTimeElapsed(updatedTime);
//       setProgressValues(updatedProgress);
//     }, 1000);
//
//     return () => clearInterval(interval);
//   }, [dailyAssignments, progressValues, timeElapsed, tatAlerts, criticalAlerts, dispatch, user, playAlert, hasPlayedAlert]);
//
//
//
//  const getInitialProgressValue = (task: any) => {
//     if (task.timer_status === 'Done') return 100;
//     if (task.timer_status === 'Stuck') return 25;
//     if (task.timer_status === 'Todo') return 0;
//
//     if (task.timerStartTime) {
//       const elapsedSeconds = (Date.now() - new Date(task.timerStartTime).getTime()) / 1000;
//       const tatSeconds = (task.TAT || 480) * 60; // Default 8 hours (480 minutes)
//       return Math.min((elapsedSeconds / tatSeconds) * 100, 100);
//     }
//
//     return 0;
//   };
//
// const getEfficiencyMessage = (score: number) => {
//   if (score >= 200) return 'Exceptional performance! Outstanding work!';
//   if (score >= 150) return 'Excellent performance! Maintaining high standards!';
//   if (score >= 100) return 'Great performance! Well above expectations!';
//   if (score >= 90) return 'Excellent performance! Keep it up!';
//   if (score >= 80) return 'Good progress, aim for higher efficiency.';
//   if (score >= 70) return 'Solid work, room for improvement.';
//   if (score >= 60) return 'Meeting expectations.';
//   return 'Consider reviewing your workflow for improvements.';
// };
//
//
// const handleStatusChange = async (taskId: string, newStatus: 'Todo' | 'InProgress' | 'Stuck' | 'Done') => {
//   const task = dailyAssignments.find(t => t._id === taskId);
//   if (!task) return;
//
//   try {
//     if (newStatus === 'Stuck') {
//       setCurrentTaskId(taskId);
//       setCurrentTask(task);
//       setOpenStuckDialog(true);
//       return;
//     }
//
//     if (newStatus === 'Done') {
//       const isOverdue = isTaskOverdue(task);
//       if (isOverdue) {
//         setCurrentTaskId(taskId);
//         setCurrentTask(task);
//         setOpenOverdueDialog(true);
//         return;
//       }
//       setCurrentTaskId(taskId);
//       setCurrentTask(task);
//       setOpenProofDialog(true);
//       return;
//     }
//
//     // For InProgress and Todo, change status and refresh data
//     await dispatch(changeTimerStatus({
//       id: taskId,
//       timer_status: newStatus
//     })).unwrap();
//
//     // Force refresh of daily assignments to get updated data
//     await dispatch(fetchUserDailyTaskAssignments());
//
//     // Update progress values based on new status
//     setProgressValues(prev => ({
//       ...prev,
//       [taskId]: newStatus === 'Todo' ? 0 : prev[taskId] || 0
//     }));
//
//     toast.success("Status updated", {
//       description: `Task status changed to ${newStatus}`,
//     });
//   } catch (error) {
//     console.error('Status change error:', error);
//     toast.error("Error", {
//       description: "Failed to update task status",
//     });
//   }
// };
//
//
//   const isTaskOverdue = (task: any) => {
//     if (!task.timerStartTime) return false;
// const tatSeconds = (task.TAT || 480) * 60;
//     const elapsed = (Date.now() - new Date(task.timerStartTime).getTime()) / 1000;
//     return elapsed > tatSeconds;
//   };
//
// const submitStuckRequest = async () => {
//   if (!currentTaskId || !stuckReason) return;
//
//   try {
//     await dispatch(requestStuckStatus({
//       id: currentTaskId,
//       stuck_reason: stuckReason
//     })).unwrap();
//
//     // Add data refresh here
//     await dispatch(fetchUserDailyTaskAssignments());
//
//     setProgressValues(prev => ({
//       ...prev,
//       [currentTaskId]: 25
//     }));
//
//     toast.info("Stuck request submitted", {
//       description: "Your manager will review your request.",
//     });
//     setOpenStuckDialog(false);
//     setStuckReason("");
//   } catch (error) {
//     toast.error("Error", {
//       description: "Failed to submit stuck request.",
//     });
//   }
// };
//
// const submitOverdueTask = async () => {
//   if (!currentTaskId || !overdueReason) return;
//
//   try {
//     // Prepare proofs object
//     const proofs: Record<string, { type: 'url' | 'file'; value: string | File }> = {};
//
//     // Process file proofs
//     if (files.length > 0) {
//       const fileProofs = currentTask.proof.filter((p: any) => p.type === 'file');
//       if (fileProofs.length > 0) {
//         fileProofs.forEach((proof: any, index: number) => {
//           if (files[index]) {
//             proofs[proof.fieldName] = {
//               type: 'file',
//               value: files[index]
//             };
//           }
//         });
//       }
//     }
//
//     // Process URL proofs
//     currentTask.proof.forEach((proof: any) => {
//       if (proof.type === 'url' && proofLinks[proof.fieldName]) {
//         proofs[proof.fieldName] = {
//           type: 'url',
//           value: proofLinks[proof.fieldName]
//         };
//       }
//     });
//
//     // Prepare submission data with reason for overdue task
//     const submissionData = {
//       assignmentId: currentTaskId,
//       proofs,
//       comment: proofComment,
//       reason: overdueReason
//     };
//
//     await dispatch(changeTimerStatus({
//       id: currentTaskId,
//       timer_status: 'Done'
//     })).unwrap();
//
//     await dispatch(createSubmission(submissionData)).unwrap();
//
//     // Add data refresh here
//     await dispatch(fetchUserDailyTaskAssignments());
//
//     // Reset state
//     setProgressValues(prev => ({ ...prev, [currentTaskId]: 100 }));
//     setOverdueReason("");
//     setFiles([]);
//     setProofLinks({});
//     setProofComment("");
//     setOpenOverdueDialog(false);
//
//     toast.success("Overdue task submitted", {
//       description: "Your overdue task has been submitted with proof and reason.",
//     });
//   } catch (error) {
//     toast.error("Error", {
//       description: "Failed to submit overdue task.",
//     });
//   }
// };
//
// const submitProof = async () => {
//   if (!currentTaskId || !currentTask) return;
//
//   try {
//     // First mark the task as done
//     await dispatch(changeTimerStatus({
//       id: currentTaskId,
//       timer_status: 'Done'
//     })).unwrap();
//
//     // Prepare proofs object
//     const proofs: Record<string, { type: 'url' | 'file'; value: string | File }> = {};
//
//     // Process file proofs
//     if (files.length > 0) {
//       const fileProofs = currentTask.proof.filter((p: any) => p.type === 'file');
//       if (fileProofs.length > 0) {
//         fileProofs.forEach((proof: any, index: number) => {
//           if (files[index]) {
//             proofs[proof.fieldName] = {
//               type: 'file',
//               value: files[index]
//             };
//           }
//         });
//       }
//     }
//
//     // Process URL proofs
//     currentTask.proof.forEach((proof: any) => {
//       if (proof.type === 'url' && proofLinks[proof.fieldName]) {
//         proofs[proof.fieldName] = {
//           type: 'url',
//           value: proofLinks[proof.fieldName]
//         };
//       }
//     });
//
//     // Prepare submission data
//     const submissionData = {
//       assignmentId: currentTaskId,
//       proofs,
//       comment: proofComment,
//       reason: "" // Add reason if needed
//     };
//
//
//     await dispatch(createSubmission(submissionData)).unwrap();
//
//     // Add data refresh here
//     await dispatch(fetchUserDailyTaskAssignments());
//
//     // Reset state
//     setProgressValues(prev => ({ ...prev, [currentTaskId]: 100 }));
//     setFiles([]);
//     setProofLinks({});
//     setProofComment("");
//     setOpenProofDialog(false);
//
//     toast.success("Submission created", {
//       description: "Your task proof has been successfully submitted.",
//     });
//   } catch (error) {
//     console.error("Submission error:", error);
//     toast.error("Error", {
//       description: "Failed to create submission.",
//     });
//   }
// };
//
//
// const submitSealForApproval = async () => {
//   const incompleteTasks = dailyAssignments.filter(
//     task => task.timer_status !== 'Done'
//   );
//
//   if (incompleteTasks.length > 0) {
//     toast.warning("Incomplete tasks", {
//       description: "Please complete all tasks before submitting for approval.",
//     });
//     return;
//   }
//
//   if (sealSubmitted) {
//     toast.info("Seal already submitted", {
//       description: "Your daily seal has already been submitted for approval.",
//     });
//     return;
//   }
//
//   setIsSubmittingSeal(true);
//
//   try {
//     const completedTasks = dailyAssignments.filter(task => task.timer_status === 'Done');
//
//     if (completedTasks.length === 0) {
//       toast.warning("No completed tasks", {
//         description: "You have no completed tasks to submit for approval.",
//       });
//       setIsSubmittingSeal(false);
//       return;
//     }
//
//     // Group tasks by assigner's user ID
//     const tasksByAssigner: Record<string, string[]> = {};
//     completedTasks.forEach(task => {
//       const assignerId = task.assigned_by_user_id._id;
//       if (!tasksByAssigner[assignerId]) {
//         tasksByAssigner[assignerId] = [];
//       }
//       tasksByAssigner[assignerId].push(task._id);
//     });
//
//     // Submit approval for each assigner
//     for (const [assignerId, taskIds] of Object.entries(tasksByAssigner)) {
//       await dispatch(requestApproval({
//         taskAssignIds: taskIds,
//         assignBy: assignerId,
//         // comments: "Daily seal submission for approval"
//       })).unwrap();
//     }
//
//     const today = new Date().toDateString();
//     localStorage.setItem('lastSealSubmittedDate', today);
//     setSealSubmitted(true);
//
//     toast.success("Tasks submitted for approval successfully", {
//       description: "Your daily seal has been submitted and cannot be submitted again today.",
//     });
//   } catch (error) {
//     toast.error("Failed to submit tasks for approval");
//     console.error("Approval submission error:", error);
//   } finally {
//     setIsSubmittingSeal(false);
//   }
// };
//
//
//   const pendingApprovalsCount = dailyAssignments.filter(
//     task => task.timer_status === 'InProgress' || task.timer_status === 'Todo'
//   ).length;
//
//   const sealsApprovedCount = dailyAssignments.filter(
//     task => task.timer_status === 'Done'
//   ).length;
//
//   const removeFile = (file: FileWithPreview) => {
//     setFiles(files.filter(f => f.name !== file.name));
//     URL.revokeObjectURL(file.preview);
//   };
//
//   const handleProofLinkChange = (fieldName: string, value: string) => {
//     setProofLinks(prev => ({
//       ...prev,
//       [fieldName]: value
//     }));
//   };
//
//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case 'InProgress':
//         return <Badge variant="outline" className="text-blue-600">In Progress</Badge>;
//       case 'Stuck':
//         return <Badge variant="outline" className="text-yellow-600">Stuck</Badge>;
//       case 'Done':
//         return <Badge variant="outline" className="text-green-600">Done</Badge>;
//       default:
//         return <Badge variant="outline" className="text-gray-600">Todo</Badge>;
//     }
//   };
//
//   const getTimeRemaining = (task: any) => {
//     if (task.timer_status !== 'InProgress' || !task.timerStartTime) return null;
//
//   const tatSeconds = (task.TAT || 480) * 60;
//     const elapsed = timeElapsed[task._id] || 0;
//     const remaining = tatSeconds - elapsed;
//
//     if (remaining <= 0) return "Overdue!";
//
//     const hours = Math.floor(remaining / 3600);
//     const minutes = Math.floor((remaining % 3600) / 60);
//     const seconds = Math.floor(remaining % 60);
//
//     return `${hours}h ${minutes}m ${seconds}s remaining`;
//   };
//
//   const renderProofInputs = (task: any) => {
//     if (!task || !task.proof || task.proof.length === 0) {
//       return (
//         <div>
//           <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50">
//             <input {...getInputProps()} />
//             <UploadIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
//             <p className="text-sm text-muted-foreground">
//               Drag & drop files here, or click to select files
//             </p>
//           </div>
//         </div>
//       );
//     }
//
//     return task.proof.map((proof: any) => {
//       if (proof.type === 'url') {
//         return (
//           <div key={proof.fieldName} className="space-y-2">
//             <label className="text-sm font-medium">{proof.fieldName}</label>
//             <Input
//               placeholder={`Enter ${proof.fieldName} URL`}
//               value={proofLinks[proof.fieldName] || ''}
//               onChange={(e) => handleProofLinkChange(proof.fieldName, e.target.value)}
//             />
//           </div>
//         );
//       } else if (proof.type === 'file') {
//         return (
//           <div key={proof.fieldName} className="space-y-2">
//             <label className="text-sm font-medium">{proof.fieldName}</label>
//             <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50">
//               <input {...getInputProps()} />
//               <UploadIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
//               <p className="text-sm text-muted-foreground">
//                 Drag & drop files here, or click to select files
//               </p>
//               <p className="text-xs text-muted-foreground mt-1">
//                 Accepted: images, PDFs, text files
//               </p>
//             </div>
//           </div>
//         );
//       }
//       return null;
//     });
//   };
//
//   return (
//     <div className="p-6 space-y-6">
//       <Toaster richColors />
//
//       {/* Header */}
//       <div>
//         <h1 className="text-2xl font-semibold">Welcome back, {user?.name }</h1>
//   <p className="text-sm text-muted-foreground" suppressHydrationWarning>
//   {dayjs().format('dddd, MMMM D, YYYY')}
// </p>
//
//   <div className="flex flex-col items-end gap-2">
//  <Button
//   variant="outline"
//   size="sm"
//   onClick={async () => {
//     try {
//       if (!isAudioEnabled) {
//         // Enable audio and initialize immediately
//         toggleAudio();
//         await initializeAudio();
//         toast.success("Audio enabled");
//       } else {
//         // Disable audio
//         toggleAudio();
//         toast.info("Audio disabled");
//       }
//     } catch (error) {
//       console.error("Audio toggle failed:", error);
//       // If initialization fails, revert the toggle
//       if (!isAudioEnabled) {
//         toggleAudio();
//       }
//       toast.error("Failed to initialize audio");
//     }
//   }}
//   className="flex items-center gap-2"
// >
//   {isAudioEnabled ? (
//     <Volume2Icon className="w-4 h-4" />
//   ) : (
//     <VolumeXIcon className="w-4 h-4" />
//   )}
//   {isAudioEnabled ? 'Audio On' : 'Audio Off'}
// </Button>
//
//         </div>
//       </div>
//
//
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//
//
//         <Card>
//           <CardContent className="p-6">
//             <p className="font-semibold">Tasks Due Today</p>
//             <p className="text-2xl">{dailyAssignments.length}</p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-6">
//             <p className="font-semibold">Seals Approved</p>
//               <p className="text-2xl">{sealsApprovedCount}</p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-6">
//             <p className="font-semibold">Pending Approvals</p>
//            <p className="text-2xl">{pendingApprovalsCount}</p>
//           </CardContent>
//         </Card>
//       </div>
//
//
//       <div className="grid">
//         <div className="lg:col-span-2">
//           <div className="flex justify-between items-center mb-4">
//             <h2 className="text-xl font-semibold">My Tasks</h2>
//        <Button
//   onClick={submitSealForApproval}
//   disabled={
//     loading ||
//     dailyAssignments.some(task => task.timer_status !== 'Done') ||
//     sealSubmitted ||
//     isSubmittingSeal
//   }
// >
//   {isSubmittingSeal ? (
//     <>
//       <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//       </svg>
//       Submitting...
//     </>
//   ) : sealSubmitted ? (
//     "Seal Submitted"
//   ) : (
//     "Submit Seal for Approval"
//   )}
// </Button>
//           </div>
//
//           {loading ? (
//             <div className="flex justify-center items-center h-40">
//               <p>Loading tasks...</p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
//               {dailyAssignments.map((task) => (
//                 <Card key={task._id}>
//                   <CardContent className="p-4">
//                     <div className="flex justify-between items-center mb-2">
//                       <h3 className="font-semibold">{task.title}</h3>
//                       {getStatusBadge(task.timer_status)}
//                     </div>
//                     <p className="text-sm text-muted-foreground">
//                       Due: {new Date(task.deadline).toLocaleDateString()}
//                     </p>
//                    <div className="my-3">
//                       <div className="flex justify-between mb-1">
//                         <span className="text-sm font-medium">
//                           Progress: {Math.round(progressValues[task._id] || 0)}%
//                         </span>
//                         <span className="text-xs text-muted-foreground">
//                           TAT: {task.TAT || 480} mins
//                         </span>
//                       </div>
//                       <Progress
//                         value={progressValues[task._id] || 0}
//                         className={`
//                           h-2
//                           ${progressValues[task._id] >= 100 ? "bg-red-500" :
//                             progressValues[task._id] > 80 ? "bg-orange-500" :
//                             progressValues[task._id] > 60 ? "bg-yellow-500" :
//                             "bg-blue-500"}
//                         `}
//                       />
//                       {task.timer_status === 'InProgress' && (
//                         <p className={`text-xs mt-1 ${
//                           progressValues[task._id] >= 100 ? "text-red-500 font-medium" :
//                           progressValues[task._id] > 80 ? "text-orange-500" :
//                           "text-muted-foreground"
//                         }`}>
//                           {getTimeRemaining(task)}
//                         </p>
//                       )}
//                     </div>
//                     {/* <Select
//                       value={task.timer_status}
//                       onValueChange={(value: 'Todo' | 'InProgress' | 'Stuck' | 'Done') =>
//                         handleStatusChange(task._id, value)
//                       }
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="Status" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="Todo">To Do</SelectItem>
//                         <SelectItem value="InProgress">In Progress</SelectItem>
//                         <SelectItem value="Stuck">Stuck</SelectItem>
//                         <SelectItem value="Done">Done</SelectItem>
//                       </SelectContent>
//                     </Select> */}
//
// <Select
//   value={task.timer_status}
//   onValueChange={(value: 'Todo' | 'InProgress' | 'Stuck' | 'Done') =>
//     handleStatusChange(task._id, value)
//   }
// >
//   <SelectTrigger>
//     <SelectValue placeholder="Status" />
//   </SelectTrigger>
//   <SelectContent>
//     <SelectItem
//       value="Todo"
//       disabled={task.timer_status !== 'Todo'}
//     >
//       To Do
//     </SelectItem>
//     <SelectItem
//       value="InProgress"
//       disabled={task.timer_status === 'Done' || task.timer_status === 'Stuck'}
//     >
//       In Progress
//     </SelectItem>
//     <SelectItem
//       value="Stuck"
//       disabled={task.timer_status === 'Stuck' || task.timer_status === 'Done'}
//     >
//       Stuck
//     </SelectItem>
//     <SelectItem
//       value="Done"
//       disabled={task.timer_status === 'Done'}
//     >
//       Done
//     </SelectItem>
//   </SelectContent>
// </Select>
//                     {task.timer_status === 'Done' && task.proof?.length > 0 && (
//                       <div className="mt-3 text-sm text-muted-foreground">
//                         Proof submitted: {task.proof[0].type}
//                       </div>
//                     )}
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           )}
//         </div>
//
//         {/* <div>
//           <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
//           <ScrollArea className="h-[400px] rounded-md border p-4">
//             <div className="space-y-4">
//               {activityItems.map((item, index) => (
//                 <div key={index} className="flex gap-3 items-start">
//                   {item.icon}
//                   <div>
//                     <p className="text-sm text-muted-foreground leading-snug">
//                       {item.message}
//                     </p>
//                     <p className="text-xs text-gray-400">{item.time}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </ScrollArea>
//         </div> */}
//       </div>
//
//       {/* Stuck Request Dialog */}
//       <Dialog open={openStuckDialog} onOpenChange={setOpenStuckDialog}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Request Stuck Status</DialogTitle>
//             <DialogDescription>
//               Please explain why you're stuck on this task and need assistance.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4">
//             <Textarea
//               placeholder="Explain why you're stuck and need help..."
//               value={stuckReason}
//               onChange={(e) => setStuckReason(e.target.value)}
//             />
//             <Button onClick={submitStuckRequest} disabled={!stuckReason}>
//               Submit Request
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//
//       {/* Overdue Task Dialog */}
//      <Dialog open={openOverdueDialog} onOpenChange={setOpenOverdueDialog}>
//   <DialogContent className="max-w-2xl">
//     <DialogHeader>
//       <DialogTitle>Task Overdue</DialogTitle>
//       <DialogDescription>
//         Please explain why this task was completed after the deadline and provide proof.
//       </DialogDescription>
//     </DialogHeader>
//     <div className="space-y-4">
//       <Textarea
//         placeholder="Explain why this task is overdue..."
//         value={overdueReason}
//         onChange={(e) => setOverdueReason(e.target.value)}
//         className="min-h-[100px]"
//       />
//
//       {/* Add proof submission section */}
//       {currentTask && renderProofInputs(currentTask)}
//
//       {files.length > 0 && (
//         <div className="mt-4 space-y-2">
//           <h4 className="text-sm font-medium">Selected files:</h4>
//           <div className="space-y-2">
//             {files.map((file) => (
//               <div key={file.name} className="flex items-center justify-between p-2 border rounded">
//                 <div className="flex items-center space-x-2">
//                   {file.type.startsWith('image/') ? (
//                     <Image
//                       src={file.preview}
//                       alt={file.name}
//                       width={40}
//                       height={40}
//                       className="object-cover rounded"
//                     />
//                   ) : (
//                     <div className="w-10 h-10 flex items-center justify-center bg-muted rounded">
//                       <span className="text-xs">{file.name.split('.').pop()}</span>
//                     </div>
//                   )}
//                   <span className="text-sm truncate max-w-[180px]">{file.name}</span>
//                 </div>
//                 <Button
//                   variant="ghost"
//                   size="icon"
//                   className="w-6 h-6"
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     removeFile(file);
//                   }}
//                 >
//                   <XIcon className="w-4 h-4" />
//                 </Button>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//
//       <Textarea
//         placeholder="Additional comments (optional)"
//         value={proofComment}
//         onChange={(e) => setProofComment(e.target.value)}
//       />
//
//       <Button
//         onClick={submitOverdueTask}
//         disabled={
//           !overdueReason ||
//           (currentTask?.proof?.some((p: any) => p.type === 'url') &&
//           !currentTask.proof.some((p: any) => proofLinks[p.fieldName])) ||
//           (currentTask?.proof?.some((p: any) => p.type === 'file') && files.length === 0)
//         }
//       >
//         Submit Overdue Task
//       </Button>
//     </div>
//   </DialogContent>
// </Dialog>
//
//       {/* Proof Submission Dialog */}
//       <Dialog open={openProofDialog} onOpenChange={setOpenProofDialog}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>Submit Proof of Completion</DialogTitle>
//             <DialogDescription>
//               Provide evidence that you've completed this task.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4">
//             {currentTask && renderProofInputs(currentTask)}
//
//             {files.length > 0 && (
//               <div className="mt-4 space-y-2">
//                 <h4 className="text-sm font-medium">Selected files:</h4>
//                 <div className="space-y-2">
//                   {files.map((file) => (
//                     <div key={file.name} className="flex items-center justify-between p-2 border rounded">
//                       <div className="flex items-center space-x-2">
//                         {file.type.startsWith('image/') ? (
//                           <Image
//                             src={file.preview}
//                             alt={file.name}
//                             width={40}
//                             height={40}
//                             className="object-cover rounded"
//                           />
//                         ) : (
//                           <div className="w-10 h-10 flex items-center justify-center bg-muted rounded">
//                             <span className="text-xs">{file.name.split('.').pop()}</span>
//                           </div>
//                         )}
//                         <span className="text-sm truncate max-w-[180px]">{file.name}</span>
//                       </div>
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         className="w-6 h-6"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           removeFile(file);
//                         }}
//                       >
//                         <XIcon className="w-4 h-4" />
//                       </Button>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//
//             <Textarea
//               placeholder="Additional comments (optional)"
//               value={proofComment}
//               onChange={(e) => setProofComment(e.target.value)}
//             />
//
//             <Button
//               onClick={submitProof}
//               disabled={
//                 (currentTask?.proof?.some((p: any) => p.type === 'url') &&
//                  !currentTask.proof.some((p: any) => proofLinks[p.fieldName])) ||
//                 (currentTask?.proof?.some((p: any) => p.type === 'file') && files.length === 0)
//               }
//             >
//               Submit Proof
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }
