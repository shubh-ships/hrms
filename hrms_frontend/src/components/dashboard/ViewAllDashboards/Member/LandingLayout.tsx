

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
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

const PRIORITY_ORDER: Record<"High" | "Medium" | "Low", number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};


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

export default function LandingLayout() {
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

    const getPriorityBadge = (priority?: "Low" | "Medium" | "High") => {
  switch (priority) {
    case "High":
      return (
        <Badge className="bg-red-100 text-red-700 border border-red-300">
          High
        </Badge>
      );
    case "Medium":
      return (
        <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-300">
          Medium
        </Badge>
      );
    case "Low":
    default:
      return (
        <Badge className="bg-green-100 text-green-700 border border-green-300">
          Low
        </Badge>
      );
  }
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

    const sortedDailyAssignments = useMemo(() => {
  return [...dailyAssignments].sort((a, b) => {
    const priorityDiff =
      PRIORITY_ORDER[b.priority || "Low"] -
      PRIORITY_ORDER[a.priority || "Low"];

    if (priorityDiff !== 0) return priorityDiff;

    return (
      new Date(a.deadline).getTime() -
      new Date(b.deadline).getTime()
    );
  });
}, [dailyAssignments]);


    return (
        <div className="p-6 space-y-6">
            <Toaster richColors />

            <div>
                <h1 className="text-2xl font-semibold">Welcome back, {user?.name}</h1>
                <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                    {dayjs().format("dddd, MMMM D, YYYY")}
                </p>

                <div className="flex flex-col items-end gap-2">
                    <Button
                        variant="outline"
                        size="sm"
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
                        className="flex items-center gap-2"
                    >
                        {isAudioEnabled ? (
                            <Volume2Icon className="w-4 h-4" />
                        ) : (
                            <VolumeXIcon className="w-4 h-4" />
                        )}
                        {isAudioEnabled ? "Audio On" : "Audio Off"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold">
                            {pulseEfficiencyData ? `${pulseEfficiencyData.efficiency?.toFixed(1) || '0.0'}` : 'Loading...'}
                        </div>
                        <p>PulseEfficiency Score</p>
                        <p className="text-sm">
                            {pulseEfficiencyData !== null ?
                                getEfficiencyMessage(pulseEfficiencyData?.efficiency || [0]) :
                                'Fetching your efficiency data...'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <p className="font-semibold">Tasks Due Today</p>
                        <p className="text-2xl">{dailyAssignments.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="font-semibold">Tasks Completed</p>
                        <p className="text-2xl">{tasksDoneCount}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="font-semibold">Submitted for Approval</p>
                        <p className="text-2xl">{tasksSubmittedForApprovalCount}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid">
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">My Tasks</h2>
                        {/* Removed the "Submit Seal for Approval" button */}
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <p>Loading tasks...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {sortedDailyAssignments.map((task) => {
                                const isTaskSubmitted = taskApprovalStatus[task._id]?.isSubmitted || false;
                                const today = new Date().toDateString();
                                const canSubmitToday = taskApprovalStatus[task._id]?.submittedDate !== today;

                                return (
                                    <Card key={task._id}>
                                        <CardContent className="p-4">
                                           <div className="flex justify-between items-center mb-2">
  <h3 className="font-semibold">{task.title}</h3>

  <div className="flex items-center gap-2">
    {getPriorityBadge(task.priority)}
    {getStatusBadge(task.timer_status)}

    {isTaskSubmitted && (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
        Submitted
      </Badge>
    )}
  </div>
</div>

                                            <div className="flex justify-between items-center mt-2">
                                                <p className="text-sm text-muted-foreground mb-0">
                                                    Due: {new Date(task.deadline).toLocaleDateString()}
                                                </p>
                                                <Badge variant="outline" className="text-blue-600 text-xs">
                                                    Original TAT: {task.previous_TAT?.[0] ?? task.TAT} mins
                                                </Badge>
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
                                                    className={`
                            h-2
                            ${
                                                        progressValues[task._id] >= 100
                                                            ? "bg-red-500"
                                                            : progressValues[task._id] > 80
                                                                ? "bg-orange-500"
                                                                : progressValues[task._id] > 60
                                                                    ? "bg-yellow-500"
                                                                    : "bg-blue-500"
                                                    }
                          `}
                                                />
                                                {task.timer_status === "InProgress" && (
                                                    <p
                                                        className={`text-xs mt-1 ${
                                                            progressValues[task._id] >= 100
                                                                ? "text-red-500 font-medium"
                                                                : progressValues[task._id] > 80
                                                                    ? "text-orange-500"
                                                                    : "text-muted-foreground"
                                                        }`}
                                                    >
                                                        {getTimeRemaining(task)}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center gap-4 mt-4">
                                                {/* Left side: Status Select */}
                                                <Select
                                                    value={task.timer_status}
                                                    onValueChange={(
                                                        value: "Todo" | "InProgress" | "Stuck" | "Done"
                                                    ) => handleStatusChange(task._id, value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem
                                                            value="Todo"
                                                            disabled={task.timer_status !== "Todo"}
                                                        >
                                                            To Do
                                                        </SelectItem>
                                                        <SelectItem
                                                            value="InProgress"
                                                            disabled={
                                                                task.timer_status === "Done" ||
                                                                task.timer_status === "Stuck"
                                                            }
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
                                                        >
                                                            Stuck
                                                        </SelectItem>
                                                        <SelectItem
                                                            value="Done"
                                                            disabled={
                                                                task.timer_status === "Done" ||
                                                                task.timer_status !== "InProgress"
                                                            }
                                                        >
                                                            Done
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                {/* Right side: Submit for Approval button (only for Done tasks) */}
                                                {task.timer_status === "Done" && (
                                                    <Button
                                                        onClick={() => submitTaskForApproval(task._id)}
                                                        disabled={isTaskSubmitted && !canSubmitToday}
                                                        size="sm"
                                                        variant={isTaskSubmitted ? "outline" : "default"}
                                                        className="whitespace-nowrap"
                                                    >
                                                        {isTaskSubmitted ? (
                                                            canSubmitToday ? "Resubmit" : "Submitted"
                                                        ) : (
                                                            "Submit "
                                                        )}
                                                    </Button>
                                                )}

                                                {/* Right side: Stuck Records list */}
                                                <div className="flex flex-col text-right text-xs font-semibold text-red-600 space-y-1 max-w-[150px]">
                                                    <div>Stuck Records:</div>
                                                    {task.previous_TAT && task.previous_TAT.length > 0 ? (
                                                        task.previous_TAT.map((value: number | string, index: number) => (
                                                            <div key={index} className="whitespace-nowrap">
                                                                • {value} mins
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div>None</div>
                                                    )}
                                                </div>
                                            </div>

                                            {task.timer_status === "Done" &&
                                                task.proof?.length > 0 && (
                                                    <div className="mt-3 text-sm text-muted-foreground">
                                                        Proof submitted: {task.proof[0].type}
                                                    </div>
                                                )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
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
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Submit Proof of Completion</DialogTitle>
                        <DialogDescription>
                            Provide evidence that you've completed this task.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {currentTask && renderProofInputs(currentTask)}

                        <Textarea
                            placeholder="Additional comments (optional)"
                            value={proofComment}
                            onChange={(e) => setProofComment(e.target.value)}
                        />

                        <Button
                            onClick={submitProof}
                            disabled={currentTask && !hasRequiredProofs(currentTask)}
                        >
                            Submit Proof
                        </Button>
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
// import {
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
//   upsertTask,
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
// import { getProfile } from "@/features/auth/authSlice";
// import Image from "next/image";
// import dayjs from "dayjs";
// import { sendTaskStatusEmail } from "@/features/EmailTat/emailSlice";
// import { useAudioAlert } from "@/hooks/useAudioAlert";
// import useSocket from "@/hooks/useSocket";
//
// interface FileWithPreview extends File {
//   preview: string;
// }
//
// // Separate component for file dropzone to fix hooks issue
// const FileDropzone = ({
//   fieldName,
//   files,
//   onFilesChange,
//   onRemoveFile
// }: {
//   fieldName: string;
//   files: FileWithPreview[];
//   onFilesChange: (fieldName: string, newFiles: FileWithPreview[]) => void;
//   onRemoveFile: (fieldName: string, file: FileWithPreview) => void;
// }) => {
//   const onDrop = (acceptedFiles: File[], fileRejections: FileRejection[]) => {
//     if (fileRejections.length > 0) {
//       toast.error("Invalid file type", {
//         description: "Please upload only image, PDF, or text files.",
//       });
//       return;
//     }
//
//     const filesWithPreview = acceptedFiles.map(file =>
//       Object.assign(file, {
//         preview: URL.createObjectURL(file)
//       })
//     );
//
//     onFilesChange(fieldName, filesWithPreview);
//   };
//
//   const { getRootProps, getInputProps } = useDropzone({
//     accept: {
//       'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
//       'application/pdf': ['.pdf'],
//       'text/plain': ['.txt'],
//     },
//     maxFiles: 5,
//     onDrop,
//   });
//
//   return (
//     <div className="space-y-2">
//       <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50">
//         <input {...getInputProps()} />
//         <UploadIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
//         <p className="text-sm text-muted-foreground">
//           Drag & drop files here, or click to select files for {fieldName}
//         </p>
//         <p className="text-xs text-muted-foreground mt-1">
//           Accepted: images, PDFs, text files
//         </p>
//       </div>
//
//       {/* Show files for this specific field */}
//       {files.length > 0 && (
//         <div className="mt-2 space-y-2">
//           <h4 className="text-sm font-medium">Files for {fieldName}:</h4>
//           <div className="space-y-2">
//             {files.map((file) => (
//               <div key={`${fieldName}-${file.name}`} className="flex items-center justify-between p-2 border rounded">
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
//                     onRemoveFile(fieldName, file);
//                   }}
//                 >
//                   <XIcon className="w-4 h-4" />
//                 </Button>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
//
// export default function LandingLayout() {
//   const dispatch = useAppDispatch();
//
//   const [error, setError] = useState("");
//   const { dailyAssignments, loading } = useAppSelector(
//     (state) => state.taskAssignments
//   );
//   const { user } = useAppSelector((state) => state.auth);
//
//   const [stuckReason, setStuckReason] = useState("");
//   const [overdueReason, setOverdueReason] = useState("");
//   const [proofLinks, setProofLinks] = useState<Record<string, string>>({});
//   const [proofComment, setProofComment] = useState("");
//   const [files, setFiles] = useState<Record<string, FileWithPreview[]>>({});
//   const [openStuckDialog, setOpenStuckDialog] = useState(false);
//   const [openProofDialog, setOpenProofDialog] = useState(false);
//   const [openOverdueDialog, setOpenOverdueDialog] = useState(false);
//   const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
//   const [currentTask, setCurrentTask] = useState<any>(null);
//   const [progressValues, setProgressValues] = useState<Record<string, number>>({});
//   const [timeElapsed, setTimeElapsed] = useState<Record<string, number>>({});
//
//   const [tatAlerts, setTatAlerts] = useState<Record<string, boolean>>({});
//   const [criticalAlerts, setCriticalAlerts] = useState<Record<string, boolean>>({});
//   const [pulseEfficiencyData, setPulseEfficiencyData] = useState<any>(null);
//
//   const [sealSubmitted, setSealSubmitted] = useState(false);
//   const [isSubmittingSeal, setIsSubmittingSeal] = useState(false);
//
//   const {
//     playAlert,
//     isAudioEnabled,
//     toggleAudio,
//     hasPlayedAlert,
//     isAudioReady,
//     initializeAudio,
//     resetAlerts,
//   } = useAudioAlert();
//
//   const { on: socketOn, joinUserRoom, joinTaskRoom } = useSocket();
//
//   // Socket setup
//   useEffect(() => {
//     const resolvedUserId =
//       (user as any)?._id ||
//       (user as any)?.id ||
//       (user as any)?.userId?._id ||
//       (user as any)?.userId?.id;
//
//     if (resolvedUserId) {
//       joinUserRoom(resolvedUserId.toString());
//     }
//
//     dailyAssignments.forEach((task) => {
//       if (task?._id) {
//         joinTaskRoom(task._id.toString());
//       }
//     });
//   }, [user, dailyAssignments, joinUserRoom, joinTaskRoom]);
//
//   useEffect(() => {
//     const offTaskUpdated = socketOn("task_updated", (payload: any) => {
//       if (payload?.data) {
//         dispatch(upsertTask(payload.data));
//       } else if (payload?.task) {
//         dispatch(upsertTask(payload.task));
//       } else {
//         dispatch(fetchUserDailyTaskAssignments());
//       }
//     });
//
//     const offTaskCreated = socketOn("task_created", (payload: any) => {
//       try {
//         if (payload?.task) {
//           dispatch(upsertTask(payload.task));
//
//           toast.success("New task assigned", {
//             description: payload.task.title || "A new task has been assigned to you.",
//           });
//         } else {
//           dispatch(fetchUserDailyTaskAssignments());
//         }
//       } catch (e) {
//         console.error("task_created handler error", e);
//         dispatch(fetchUserDailyTaskAssignments());
//       }
//     });
//
//     const offStuckCreated = socketOn(
//       "stuck_request_created",
//       (_payload: any) => {
//         dispatch(fetchUserDailyTaskAssignments());
//       }
//     );
//
//     const offStuckResponse = socketOn(
//       "stuck_request_response",
//       (_payload: any) => {
//         dispatch(fetchUserDailyTaskAssignments());
//       }
//     );
//
//     const offTaskStatusChanged = socketOn(
//       "task_status_changed",
//       (_payload: any) => {
//         dispatch(fetchUserDailyTaskAssignments());
//       }
//     );
//
//     const offApprovalUpdated = socketOn(
//       "approval_updated",
//       (_payload: any) => {
//         dispatch(fetchUserDailyTaskAssignments());
//       }
//     );
//
//     const offApprovalRequested = socketOn(
//       "approval_requested",
//       (payload: any) => {
//         console.log("approval_requested:", payload);
//         toast.info("New approval request", {
//           description: "Someone submitted their day-end tasks for approval.",
//         });
//       }
//     );
//
//     return () => {
//       offTaskUpdated?.();
//       offStuckCreated?.();
//       offStuckResponse?.();
//       offTaskStatusChanged?.();
//       offApprovalUpdated?.();
//       offApprovalRequested?.();
//       offTaskCreated?.();
//     };
//   }, [socketOn, dispatch]);
//
//   useEffect(() => {
//     if (isAudioEnabled && !isAudioReady) {
//       resetAlerts();
//     }
//   }, [isAudioEnabled, isAudioReady, resetAlerts]);
//
//   useEffect(() => {
//     if (isAudioEnabled && !isAudioReady) {
//       const initAudio = async () => {
//         try {
//           await initializeAudio();
//         } catch (error) {
//           console.error("Background audio initialization failed:", error);
//         }
//       };
//       initAudio();
//     }
//   }, [isAudioEnabled, isAudioReady, initializeAudio]);
//
//   useEffect(() => {
//     const today = new Date().toDateString();
//     const lastSubmittedDate = localStorage.getItem("lastSealSubmittedDate");
//
//     if (lastSubmittedDate === today) {
//       setSealSubmitted(true);
//     }
//   }, []);
//
//   useEffect(() => {
//     const fetchUserData = async () => {
//       try {
//         await dispatch(getProfile()).unwrap();
//       } catch (err) {
//         setError("Failed to fetch user data");
//         console.error(err);
//       }
//     };
//
//     fetchUserData();
//   }, [dispatch]);
//
//   useEffect(() => {
//     const fetchPulseEfficiency = async () => {
//       const currentDate = new Date();
//       const currentMonth = currentDate.getMonth();
//       const currentYear = currentDate.getFullYear();
//       const monthYear = `${currentYear}-${String(currentMonth + 1).padStart(
//         2,
//         "0"
//       )}`;
//
//       try {
//         const result = await dispatch(
//           fetchMonthlyPulseEfficiency(monthYear)
//         ).unwrap();
//         setPulseEfficiencyData(result[0]);
//       } catch (error) {
//         console.error("Failed to fetch pulse efficiency:", error);
//         setPulseEfficiencyData(null);
//       }
//     };
//
//     fetchPulseEfficiency();
//   }, [dispatch]);
//
//   useEffect(() => {
//     dispatch(fetchUserDailyTaskAssignments());
//   }, [dispatch]);
//
//   // Cleanup file preview URLs
//   useEffect(() => {
//     return () => {
//       Object.values(files).forEach(fileArray => {
//         fileArray.forEach(file => URL.revokeObjectURL(file.preview));
//       });
//     };
//   }, [files]);
//
//   useEffect(() => {
//     const initialProgress: Record<string, number> = {};
//     const initialTime: Record<string, number> = {};
//
//     dailyAssignments.forEach((task) => {
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
//   useEffect(() => {
//     const interval = setInterval(() => {
//       const now = Date.now();
//       const updatedProgress = { ...progressValues };
//       const updatedTime = { ...timeElapsed };
//       const newTatAlerts = { ...tatAlerts };
//       const newCriticalAlerts = { ...criticalAlerts };
//
//       dailyAssignments.forEach((task) => {
//         if (task.timer_status === "InProgress" && task.timerStartTime) {
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
//           if (
//             progressPercentage >= 80 &&
//             progressPercentage < 100 &&
//             !tatAlerts[task._id]
//           ) {
//             newTatAlerts[task._id] = true;
//
//             if (!hasPlayedAlert(task._id)) {
//               playAlert(task._id);
//             }
//
//             const taskTitle = task.title || `Task ${task._id}` || "Unknown Task";
//
//             toast.warning(`TAT Warning for ${taskTitle}`, {
//               description:
//                 "80% of time allocated for this task has been used. Only 20% remaining!",
//               duration: 10000,
//             });
//
//             dispatch(
//               sendTaskStatusEmail({
//                 to: (user as any)?.userId?.email || (user as any)?.email || "",
//                 name: (user as any)?.userId?.name || (user as any)?.name || "User",
//                 taskName: taskTitle,
//                 taskStatus: 80,
//               })
//             );
//           }
//
//           if (progressPercentage >= 100 && !criticalAlerts[task._id]) {
//             newCriticalAlerts[task._id] = true;
//
//             if (!hasPlayedAlert(`${task._id}_critical`)) {
//               playAlert(`${task._id}_critical`);
//             }
//
//             const taskTitle = task.title || `Task ${task._id}` || "Unknown Task";
//
//             toast.error(`Deadline Reached for ${taskTitle}`, {
//               description:
//                 "The allocated time for this task has been exhausted!",
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
//   }, [
//     dailyAssignments,
//     progressValues,
//     timeElapsed,
//     tatAlerts,
//     criticalAlerts,
//     dispatch,
//     user,
//     playAlert,
//     hasPlayedAlert,
//   ]);
//
//   const getInitialProgressValue = (task: any) => {
//     if (task.timer_status === "Done") return 100;
//     if (task.timer_status === "Stuck") return 25;
//     if (task.timer_status === "Todo") return 0;
//
//     if (task.timerStartTime) {
//       const elapsedSeconds =
//         (Date.now() - new Date(task.timerStartTime).getTime()) / 1000;
//       const tatSeconds = (task.TAT || 480) * 60;
//       return Math.min((elapsedSeconds / tatSeconds) * 100, 100);
//     }
//
//     return 0;
//   };
//
//   const getEfficiencyMessage = (score: number) => {
//     if (score >= 200) return "Exceptional performance! Outstanding work!";
//     if (score >= 150)
//       return "Excellent performance! Maintaining high standards!";
//     if (score >= 100) return "Great performance! Well above expectations!";
//     if (score >= 90) return "Excellent performance! Keep it up!";
//     if (score >= 80) return "Good progress, aim for higher efficiency.";
//     if (score >= 70) return "Solid work, room for improvement.";
//     if (score >= 60) return "Meeting expectations.";
//     return "Consider reviewing your workflow for improvements.";
//   };
//
//   const handleStatusChange = async (
//     taskId: string,
//     newStatus: "Todo" | "InProgress" | "Stuck" | "Done"
//   ) => {
//     const task = dailyAssignments.find((t) => t._id === taskId);
//     if (!task) return;
//
//     try {
//       if (newStatus === "Stuck") {
//         setCurrentTaskId(taskId);
//         setCurrentTask(task);
//         setOpenStuckDialog(true);
//         return;
//       }
//
//       if (newStatus === "Done") {
//         const isOverdue = isTaskOverdue(task);
//         if (isOverdue) {
//           setCurrentTaskId(taskId);
//           setCurrentTask(task);
//           setOpenOverdueDialog(true);
//           return;
//         }
//         setCurrentTaskId(taskId);
//         setCurrentTask(task);
//         setOpenProofDialog(true);
//         return;
//       }
//
//       await dispatch(
//         changeTimerStatus({
//           id: taskId,
//           timer_status: newStatus,
//         })
//       ).unwrap();
//
//       await dispatch(fetchUserDailyTaskAssignments());
//
//       setProgressValues((prev) => ({
//         ...prev,
//         [taskId]: newStatus === "Todo" ? 0 : prev[taskId] || 0,
//       }));
//
//       toast.success("Status updated", {
//         description: `Task status changed to ${newStatus}`,
//       });
//     } catch (error) {
//       console.error("Status change error:", error);
//       toast.error("Error", {
//         description: "Failed to update task status",
//       });
//     }
//   };
//
//   const isTaskOverdue = (task: any) => {
//     if (!task.timerStartTime) return false;
//     const tatSeconds = (task.TAT || 480) * 60;
//     const elapsed =
//       (Date.now() - new Date(task.timerStartTime).getTime()) / 1000;
//     return elapsed > tatSeconds;
//   };
//
//   const submitStuckRequest = async () => {
//     if (!currentTaskId || !stuckReason) return;
//
//     try {
//       await dispatch(
//         requestStuckStatus({
//           id: currentTaskId,
//           stuck_reason: stuckReason,
//         })
//       ).unwrap();
//
//       await dispatch(fetchUserDailyTaskAssignments());
//
//       setProgressValues((prev) => ({
//         ...prev,
//         [currentTaskId]: 25,
//       }));
//
//       toast.info("Stuck request submitted", {
//         description: "Your manager will review your request.",
//       });
//       setOpenStuckDialog(false);
//       setStuckReason("");
//     } catch (error) {
//       toast.error("Error", {
//         description: "Failed to submit stuck request.",
//       });
//     }
//   };
//
//   const submitOverdueTask = async () => {
//     if (!currentTaskId || !overdueReason || !currentTask) return;
//
//     try {
//       const proofs: Record<string, { type: 'url' | 'file'; value: string | File }> = {};
//
//       // Handle file proofs
//       if (currentTask.proof) {
//         currentTask.proof.forEach((proof: any) => {
//           if (proof.type === 'file' && files[proof.fieldName]?.length > 0) {
//             // Take the first file for each proof field
//             proofs[proof.fieldName] = {
//               type: 'file',
//               value: files[proof.fieldName][0]
//             };
//           } else if (proof.type === 'url' && proofLinks[proof.fieldName]) {
//             proofs[proof.fieldName] = {
//               type: 'url',
//               value: proofLinks[proof.fieldName]
//             };
//           }
//         });
//       }
//
//       const submissionData = {
//         assignmentId: currentTaskId,
//         proofs,
//         comment: proofComment,
//         reason: overdueReason
//       };
//
//       await dispatch(changeTimerStatus({
//         id: currentTaskId,
//         timer_status: 'Done'
//       })).unwrap();
//
//       await dispatch(createSubmission(submissionData)).unwrap();
//
//       await dispatch(fetchUserDailyTaskAssignments());
//
//       setProgressValues(prev => ({ ...prev, [currentTaskId]: 100 }));
//       setOverdueReason("");
//       setFiles({});
//       setProofLinks({});
//       setProofComment("");
//       setOpenOverdueDialog(false);
//
//       toast.success("Overdue task submitted", {
//         description: "Your overdue task has been submitted with proof and reason.",
//       });
//     } catch (error: any) {
//       console.error("Overdue submission error:", error);
//       toast.error("Error", {
//         description: error?.message || "Failed to submit overdue task.",
//       });
//     }
//   };
//
//   const submitProof = async () => {
//     if (!currentTaskId || !currentTask) return;
//
//     try {
//       const proofs: Record<string, { type: 'url' | 'file'; value: string | File }> = {};
//
//       // Handle file proofs
//       if (currentTask.proof) {
//         currentTask.proof.forEach((proof: any) => {
//           if (proof.type === 'file' && files[proof.fieldName]?.length > 0) {
//             // Take the first file for each proof field
//             proofs[proof.fieldName] = {
//               type: 'file',
//               value: files[proof.fieldName][0]
//             };
//           } else if (proof.type === 'url' && proofLinks[proof.fieldName]) {
//             proofs[proof.fieldName] = {
//               type: 'url',
//               value: proofLinks[proof.fieldName]
//             };
//           }
//         });
//       }
//
//       const submissionData = {
//         assignmentId: currentTaskId,
//         proofs,
//         comment: proofComment,
//         reason: ""
//       };
//
//       await dispatch(changeTimerStatus({
//         id: currentTaskId,
//         timer_status: 'Done'
//       })).unwrap();
//
//       await dispatch(createSubmission(submissionData)).unwrap();
//       await dispatch(fetchUserDailyTaskAssignments());
//
//       setProgressValues(prev => ({ ...prev, [currentTaskId]: 100 }));
//       setFiles({});
//       setProofLinks({});
//       setProofComment("");
//       setOpenProofDialog(false);
//
//       toast.success("Submission created", {
//         description: "Your task proof has been successfully submitted.",
//       });
//     } catch (error: any) {
//       console.error("Submission error:", error);
//       toast.error("Error", {
//         description: error?.message || "Failed to create submission.",
//       });
//     }
//   };
//
//   const submitSealForApproval = async () => {
//     const incompleteTasks = dailyAssignments.filter(
//       (task) => task.timer_status !== "Done"
//     );
//
//     if (incompleteTasks.length > 0) {
//       toast.warning("Incomplete tasks", {
//         description: "Please complete all tasks before submitting for approval.",
//       });
//       return;
//     }
//
//     if (sealSubmitted) {
//       toast.info("Seal already submitted", {
//         description: "Your daily seal has already been submitted for approval.",
//       });
//       return;
//     }
//
//     setIsSubmittingSeal(true);
//
//     try {
//       const completedTasks = dailyAssignments.filter(
//         (task) => task.timer_status === "Done"
//       );
//
//       if (completedTasks.length === 0) {
//         toast.warning("No completed tasks", {
//           description: "You have no completed tasks to submit for approval.",
//         });
//         setIsSubmittingSeal(false);
//         return;
//       }
//
//       const tasksByAssigner: Record<string, string[]> = {};
//       completedTasks.forEach((task) => {
//         const assignerId = task.assigned_by_user_id._id;
//         if (!tasksByAssigner[assignerId]) {
//           tasksByAssigner[assignerId] = [];
//         }
//         tasksByAssigner[assignerId].push(task._id);
//       });
//
//       for (const [assignerId, taskIds] of Object.entries(tasksByAssigner)) {
//         await dispatch(
//           requestApproval({
//             taskAssignIds: taskIds,
//             assignBy: assignerId,
//           })
//         ).unwrap();
//       }
//
//       const today = new Date().toDateString();
//       localStorage.setItem("lastSealSubmittedDate", today);
//       setSealSubmitted(true);
//
//       toast.success("Tasks submitted for approval successfully", {
//         description:
//           "Your daily seal has been submitted and cannot be submitted again today.",
//       });
//     } catch (error) {
//       toast.error("Failed to submit tasks for approval");
//       console.error("Approval submission error:", error);
//     } finally {
//       setIsSubmittingSeal(false);
//     }
//   };
//
//   const pendingApprovalsCount = dailyAssignments.filter(
//     (task) => task.timer_status === "InProgress" || task.timer_status === "Todo"
//   ).length;
//
//   const sealsApprovedCount = dailyAssignments.filter(
//     (task) => task.timer_status === "Done"
//   ).length;
//
//   const handleFilesChange = (fieldName: string, newFiles: FileWithPreview[]) => {
//     setFiles(prev => ({
//       ...prev,
//       [fieldName]: newFiles
//     }));
//   };
//
//   const removeFile = (fieldName: string, file: FileWithPreview) => {
//     setFiles(prev => ({
//       ...prev,
//       [fieldName]: (prev[fieldName] || []).filter(f => f.name !== file.name)
//     }));
//     URL.revokeObjectURL(file.preview);
//   };
//
//   const handleProofLinkChange = (fieldName: string, value: string) => {
//     setProofLinks((prev) => ({
//       ...prev,
//       [fieldName]: value,
//     }));
//   };
//
//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case "InProgress":
//         return (
//           <Badge variant="outline" className="text-blue-600">
//             In Progress
//           </Badge>
//         );
//       case "Stuck":
//         return (
//           <Badge variant="outline" className="text-yellow-600">
//             Stuck
//           </Badge>
//         );
//       case "Done":
//         return (
//           <Badge variant="outline" className="text-green-600">
//             Done
//           </Badge>
//         );
//       default:
//         return (
//           <Badge variant="outline" className="text-gray-600">
//             Todo
//           </Badge>
//         );
//     }
//   };
//
//   const getTimeRemaining = (task: any) => {
//     if (task.timer_status !== "InProgress" || !task.timerStartTime) return null;
//
//     const tatSeconds = (task.TAT || 480) * 60;
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
//   const hasRequiredProofs = (task: any) => {
//     // Add null check for task
//     if (!task || !task.proof || task.proof.length === 0) return true;
//
//     return task.proof.every((proof: any) => {
//       if (proof.type === 'url') {
//         return !!proofLinks[proof.fieldName];
//       } else if (proof.type === 'file') {
//         return files[proof.fieldName]?.length > 0;
//       }
//       return true;
//     });
//   };
//
//   const renderProofInputs = (task: any) => {
//     // Add null check for task
//     if (!task || !task.proof || task.proof.length === 0) {
//       return (
//         <div>
//           <div className="border-2 border-dashed rounded-lg p-6 text-center">
//             <UploadIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
//             <p className="text-sm text-muted-foreground">
//               No proof requirements for this task
//             </p>
//           </div>
//         </div>
//       );
//     }
//
//     return (
//       <div className="space-y-4">
//         {task.proof.map((proof: any) => {
//           if (proof.type === 'url') {
//             return (
//               <div key={proof.fieldName} className="space-y-2">
//                 <label className="text-sm font-medium">{proof.fieldName}</label>
//                 <Input
//                   placeholder={`Enter ${proof.fieldName} URL`}
//                   value={proofLinks[proof.fieldName] || ''}
//                   onChange={(e) => handleProofLinkChange(proof.fieldName, e.target.value)}
//                 />
//               </div>
//             );
//           } else if (proof.type === 'file') {
//             return (
//               <div key={proof.fieldName} className="space-y-2">
//                 <label className="text-sm font-medium">{proof.fieldName}</label>
//                 <FileDropzone
//                   fieldName={proof.fieldName}
//                   files={files[proof.fieldName] || []}
//                   onFilesChange={handleFilesChange}
//                   onRemoveFile={removeFile}
//                 />
//               </div>
//             );
//           }
//           return null;
//         })}
//       </div>
//     );
//   };
//
//   return (
//     <div className="p-6 space-y-6">
//
//       <div>
//         <h1 className="text-2xl font-semibold">Welcome back, {user?.name}</h1>
//         <p className="text-sm text-muted-foreground" suppressHydrationWarning>
//           {dayjs().format("dddd, MMMM D, YYYY")}
//         </p>
//
//         <div className="flex flex-col items-end gap-2">
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={async () => {
//               try {
//                 if (!isAudioEnabled) {
//                   toggleAudio();
//                   await initializeAudio();
//                   toast.success("Audio enabled");
//                 } else {
//                   toggleAudio();
//                   toast.info("Audio disabled");
//                 }
//               } catch (error) {
//                 console.error("Audio toggle failed:", error);
//                 if (!isAudioEnabled) {
//                   toggleAudio();
//                 }
//                 toast.error("Failed to initialize audio");
//               }
//             }}
//             className="flex items-center gap-2"
//           >
//             {isAudioEnabled ? (
//               <Volume2Icon className="w-4 h-4" />
//             ) : (
//               <VolumeXIcon className="w-4 h-4" />
//             )}
//             {isAudioEnabled ? "Audio On" : "Audio Off"}
//           </Button>
//         </div>
//       </div>
//
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
//           <CardContent className="p-6">
//             <div className="text-3xl font-bold">
//               {pulseEfficiencyData ? `${pulseEfficiencyData.efficiency?.toFixed(1) || '0.0'}` : 'Loading...'}
//             </div>
//             <p>PulseEfficiency Score</p>
//             <p className="text-sm">
//               {pulseEfficiencyData !== null ?
//                 getEfficiencyMessage(pulseEfficiencyData?.efficiency || [0]) :
//                 'Fetching your efficiency data...'}
//             </p>
//           </CardContent>
//         </Card>
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
//             <p className="text-2xl">{sealsApprovedCount}</p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-6">
//             <p className="font-semibold">Pending Approvals</p>
//             <p className="text-2xl">{pendingApprovalsCount}</p>
//           </CardContent>
//         </Card>
//       </div>
//
//       <div className="grid">
//         <div className="lg:col-span-2">
//           <div className="flex justify-between items-center mb-4">
//             <h2 className="text-xl font-semibold">My Tasks</h2>
//             <Button
//               onClick={submitSealForApproval}
//               disabled={
//                 loading ||
//                 dailyAssignments.some(
//                   (task) => task.timer_status !== "Done"
//                 ) ||
//                 sealSubmitted ||
//                 isSubmittingSeal
//               }
//             >
//               {isSubmittingSeal ? (
//                 <>
//                   <svg
//                     className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                   >
//                     <circle
//                       className="opacity-25"
//                       cx="12"
//                       cy="12"
//                       r="10"
//                       stroke="currentColor"
//                       strokeWidth="4"
//                     ></circle>
//                     <path
//                       className="opacity-75"
//                       fill="currentColor"
//                       d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                     ></path>
//                   </svg>
//                   Submitting...
//                 </>
//               ) : sealSubmitted ? (
//                 "Seal Submitted"
//               ) : (
//                 "Submit Seal for Approval"
//               )}
//             </Button>
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
//                     <div className="flex justify-between items-center mt-2">
//                       <p className="text-sm text-muted-foreground mb-0">
//                         Due: {new Date(task.deadline).toLocaleDateString()}
//                       </p>
//                       <Badge variant="outline" className="text-blue-600 text-xs">
//                         Original TAT: {task.previous_TAT?.[0] ?? task.TAT} mins
//                       </Badge>
//                     </div>
//
//                     <div className="my-3">
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
//                           ${
//                             progressValues[task._id] >= 100
//                               ? "bg-red-500"
//                               : progressValues[task._id] > 80
//                               ? "bg-orange-500"
//                               : progressValues[task._id] > 60
//                               ? "bg-yellow-500"
//                               : "bg-blue-500"
//                           }
//                         `}
//                       />
//                       {task.timer_status === "InProgress" && (
//                         <p
//                           className={`text-xs mt-1 ${
//                             progressValues[task._id] >= 100
//                               ? "text-red-500 font-medium"
//                               : progressValues[task._id] > 80
//                               ? "text-orange-500"
//                               : "text-muted-foreground"
//                           }`}
//                         >
//                           {getTimeRemaining(task)}
//                         </p>
//                       )}
//                     </div>
//                     <div className="flex justify-between items-center gap-4 mt-4">
//                       {/* Left side: Status Select */}
//                       <Select
//                         value={task.timer_status}
//                         onValueChange={(
//                           value: "Todo" | "InProgress" | "Stuck" | "Done"
//                         ) => handleStatusChange(task._id, value)}
//                       >
//                         <SelectTrigger>
//                           <SelectValue placeholder="Status" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem
//                             value="Todo"
//                             disabled={task.timer_status !== "Todo"}
//                           >
//                             To Do
//                           </SelectItem>
//                           <SelectItem
//                             value="InProgress"
//                             disabled={
//                               task.timer_status === "Done" ||
//                               task.timer_status === "Stuck"
//                             }
//                           >
//                             In Progress
//                           </SelectItem>
//                           <SelectItem
//                             value="Stuck"
//                             disabled={
//                               task.timer_status === "Stuck" ||
//                               task.timer_status === "Done" ||
//                               task.timer_status !== "InProgress"
//                             }
//                           >
//                             Stuck
//                           </SelectItem>
//                           <SelectItem
//                             value="Done"
//                             disabled={
//                               task.timer_status === "Done" ||
//                               task.timer_status !== "InProgress"
//                             }
//                           >
//                             Done
//                           </SelectItem>
//                         </SelectContent>
//                       </Select>
//
//                       {/* Right side: Stuck Records list */}
//                       <div className="flex flex-col text-right text-xs font-semibold text-red-600 space-y-1 max-w-[150px]">
//                         <div>Stuck Records:</div>
//                         {task.previous_TAT && task.previous_TAT.length > 0 ? (
//                           task.previous_TAT.map((value: number | string, index: number) => (
//                             <div key={index} className="whitespace-nowrap">
//                               • {value} mins
//                             </div>
//                           ))
//                         ) : (
//                           <div>None</div>
//                         )}
//                       </div>
//                     </div>
//
//                     {task.timer_status === "Done" &&
//                       task.proof?.length > 0 && (
//                         <div className="mt-3 text-sm text-muted-foreground">
//                           Proof submitted: {task.proof[0].type}
//                         </div>
//                       )}
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//
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
//       <Dialog open={openOverdueDialog} onOpenChange={setOpenOverdueDialog}>
//         <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Task Overdue</DialogTitle>
//             <DialogDescription>
//               Please explain why this task was completed after the deadline and provide proof.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4">
//             <Textarea
//               placeholder="Explain why this task is overdue..."
//               value={overdueReason}
//               onChange={(e) => setOverdueReason(e.target.value)}
//               className="min-h-[100px]"
//             />
//
//             {currentTask && renderProofInputs(currentTask)}
//
//             <Textarea
//               placeholder="Additional comments (optional)"
//               value={proofComment}
//               onChange={(e) => setProofComment(e.target.value)}
//             />
//
//             <Button
//               onClick={submitOverdueTask}
//               disabled={!overdueReason || (currentTask && !hasRequiredProofs(currentTask))}
//             >
//               Submit Overdue Task
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//
//       <Dialog open={openProofDialog} onOpenChange={setOpenProofDialog}>
//         <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Submit Proof of Completion</DialogTitle>
//             <DialogDescription>
//               Provide evidence that you've completed this task.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4">
//             {currentTask && renderProofInputs(currentTask)}
//
//             <Textarea
//               placeholder="Additional comments (optional)"
//               value={proofComment}
//               onChange={(e) => setProofComment(e.target.value)}
//             />
//
//             <Button
//               onClick={submitProof}
//               disabled={currentTask && !hasRequiredProofs(currentTask)}
//             >
//               Submit Proof
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }
// "use client";

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
// import {
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
//   upsertTask,
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
// import { getProfile } from "@/features/auth/authSlice";
// import Image from "next/image";
// import dayjs from "dayjs";
// import { sendTaskStatusEmail } from "@/features/EmailTat/emailSlice";
// import { useAudioAlert } from "@/hooks/useAudioAlert";
// import useSocket from "@/hooks/useSocket";

// interface FileWithPreview extends File {
//   preview: string;
// }

// export default function LandingLayout() {
//   const dispatch = useAppDispatch();

//   const [error, setError] = useState("");
//   const { dailyAssignments, loading } = useAppSelector(
//     (state) => state.taskAssignments
//   );
//   const { user } = useAppSelector((state) => state.auth);

//   const [stuckReason, setStuckReason] = useState("");
//   const [overdueReason, setOverdueReason] = useState("");
//   const [proofLinks, setProofLinks] = useState<Record<string, string>>({});
//   const [proofComment, setProofComment] = useState("");
//   const [files, setFiles] = useState<FileWithPreview[]>([]);
//   const [openStuckDialog, setOpenStuckDialog] = useState(false);
//   const [openProofDialog, setOpenProofDialog] = useState(false);
//   const [openOverdueDialog, setOpenOverdueDialog] = useState(false);
//   const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
//   const [currentTask, setCurrentTask] = useState<any>(null);
//   const [progressValues, setProgressValues] = useState<Record<string, number>>(
//     {}
//   );
//   const [timeElapsed, setTimeElapsed] = useState<Record<string, number>>({});

//   const [tatAlerts, setTatAlerts] = useState<Record<string, boolean>>({});
//   const [criticalAlerts, setCriticalAlerts] = useState<
//     Record<string, boolean>
//   >({});
//   const [pulseEfficiencyData, setPulseEfficiencyData] = useState<any>(null);

//   const [sealSubmitted, setSealSubmitted] = useState(false);
//   const [isSubmittingSeal, setIsSubmittingSeal] = useState(false);

//   const {
//     playAlert,
//     isAudioEnabled,
//     toggleAudio,
//     hasPlayedAlert,
//     isAudioReady,
//     initializeAudio,
//     resetAlerts,
//   } = useAudioAlert();

//   const { on: socketOn, joinUserRoom, joinTaskRoom } = useSocket();

//   useEffect(() => {
//     const resolvedUserId =
//       (user as any)?._id ||
//       (user as any)?.id ||
//       (user as any)?.userId?._id ||
//       (user as any)?.userId?.id;

//     if (resolvedUserId) {
//       joinUserRoom(resolvedUserId.toString());
//     }

//     dailyAssignments.forEach((task) => {
//       if (task?._id) {
//         joinTaskRoom(task._id.toString());
//       }
//     });
//   }, [user, dailyAssignments, joinUserRoom, joinTaskRoom]);

//   useEffect(() => {
//     const offTaskUpdated = socketOn("task_updated", (payload: any) => {
//       if (payload?.data) {
//         dispatch(upsertTask(payload.data));
//       } else if (payload?.task) {
//         dispatch(upsertTask(payload.task));
//       } else {
//         dispatch(fetchUserDailyTaskAssignments());
//       }
//     });

//   const offTaskCreated = socketOn("task_created", (payload: any) => {
//     try {
//       if (payload?.task) {
//         dispatch(upsertTask(payload.task));

//         toast.success("New task assigned", {
//           description: payload.task.title || "A new task has been assigned to you.",
//         });
//       } else {
//         dispatch(fetchUserDailyTaskAssignments());
//       }
//     } catch (e) {
//       console.error("task_created handler error", e);
//       dispatch(fetchUserDailyTaskAssignments());
//     }
//   });


//     const offStuckCreated = socketOn(
//       "stuck_request_created",
//       (_payload: any) => {
//         dispatch(fetchUserDailyTaskAssignments());
//       }
//     );

//     const offStuckResponse = socketOn(
//       "stuck_request_response",
//       (_payload: any) => {
//         dispatch(fetchUserDailyTaskAssignments());
//       }
//     );

//     const offTaskStatusChanged = socketOn(
//       "task_status_changed",
//       (_payload: any) => {
//         dispatch(fetchUserDailyTaskAssignments());
//       }
//     );

//     const offApprovalUpdated = socketOn(
//       "approval_updated",
//       (_payload: any) => {
//         dispatch(fetchUserDailyTaskAssignments());
//       }
//     );

//     const offApprovalRequested = socketOn(
//       "approval_requested",
//       (payload: any) => {
//         console.log("approval_requested:", payload);
//         toast.info("New approval request", {
//           description: "Someone submitted their day-end tasks for approval.",
//         });
//       }
//     );

//     return () => {
//       offTaskUpdated?.();
//       offStuckCreated?.();
//       offStuckResponse?.();
//       offTaskStatusChanged?.();
//       offApprovalUpdated?.();
//       offApprovalRequested?.();
//       offTaskCreated?.();
//     };
//   }, [socketOn, dispatch]);

//   useEffect(() => {
//     if (isAudioEnabled && !isAudioReady) {
//       resetAlerts();
//     }
//   }, [isAudioEnabled, isAudioReady, resetAlerts]);

//   useEffect(() => {
//     if (isAudioEnabled && !isAudioReady) {
//       const initAudio = async () => {
//         try {
//           await initializeAudio();
//         } catch (error) {
//           console.error("Background audio initialization failed:", error);
//         }
//       };
//       initAudio();
//     }
//   }, [isAudioEnabled, isAudioReady, initializeAudio]);

//   useEffect(() => {
//     const today = new Date().toDateString();
//     const lastSubmittedDate = localStorage.getItem("lastSealSubmittedDate");

//     if (lastSubmittedDate === today) {
//       setSealSubmitted(true);
//     }
//   }, []);

//   useEffect(() => {
//     const fetchUserData = async () => {
//       try {
//         await dispatch(getProfile()).unwrap();
//       } catch (err) {
//         setError("Failed to fetch user data");
//         console.error(err);
//       }
//     };

//     fetchUserData();
//   }, [dispatch]);

//   const { getRootProps, getInputProps } = useDropzone({
//     accept: {
//       "image/*": [".jpeg", ".jpg", ".png", ".gif"],
//       "application/pdf": [".pdf"],
//       "text/plain": [".txt"],
//     },
//     maxFiles: 5,
//     onDrop: async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
//       if (fileRejections.length > 0) {
//         toast.error("Invalid file type", {
//           description: "Please upload only image, PDF, or text files.",
//         });
//         return;
//       }

//       const filesWithPreview = acceptedFiles.map((file) =>
//         Object.assign(file, {
//           preview: URL.createObjectURL(file),
//         })
//       );

//       setFiles(filesWithPreview);
//     },
//   });

//   useEffect(() => {
//     const fetchPulseEfficiency = async () => {
//       const currentDate = new Date();
//       const currentMonth = currentDate.getMonth();
//       const currentYear = currentDate.getFullYear();
//       const monthYear = `${currentYear}-${String(currentMonth + 1).padStart(
//         2,
//         "0"
//       )}`;

//       try {
//         const result = await dispatch(
//           fetchMonthlyPulseEfficiency(monthYear)
//         ).unwrap();
//         setPulseEfficiencyData(result[0]);
//       } catch (error) {
//         console.error("Failed to fetch pulse efficiency:", error);
//         setPulseEfficiencyData(null);
//       }
//     };

//     fetchPulseEfficiency();
//   }, [dispatch]);

//   useEffect(() => {
//     dispatch(fetchUserDailyTaskAssignments());
//   }, [dispatch]);

//   useEffect(() => {
//     return () => {
//       files.forEach((file) => URL.revokeObjectURL(file.preview));
//     };
//   }, [files]);

//   useEffect(() => {
//     const initialProgress: Record<string, number> = {};
//     const initialTime: Record<string, number> = {};

//     dailyAssignments.forEach((task) => {
//       initialProgress[task._id] = getInitialProgressValue(task);
//       initialTime[task._id] = task.timerStartTime
//         ? (Date.now() - new Date(task.timerStartTime).getTime()) / 1000
//         : 0;
//     });

//     setProgressValues(initialProgress);
//     setTimeElapsed(initialTime);
//   }, [dailyAssignments]);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       const now = Date.now();
//       const updatedProgress = { ...progressValues };
//       const updatedTime = { ...timeElapsed };
//       const newTatAlerts = { ...tatAlerts };
//       const newCriticalAlerts = { ...criticalAlerts };

//       dailyAssignments.forEach((task) => {
//         if (task.timer_status === "InProgress" && task.timerStartTime) {
//           const startTime = new Date(task.timerStartTime).getTime();
//           const elapsedSeconds = (now - startTime) / 1000;
//           updatedTime[task._id] = elapsedSeconds;

//           const tatSeconds = (task.TAT || 480) * 60;
//           const progressPercentage = Math.min(
//             (elapsedSeconds / tatSeconds) * 100,
//             100
//           );
//           updatedProgress[task._id] = progressPercentage;

//           if (
//             progressPercentage >= 80 &&
//             progressPercentage < 100 &&
//             !tatAlerts[task._id]
//           ) {
//             newTatAlerts[task._id] = true;

//             if (!hasPlayedAlert(task._id)) {
//               playAlert(task._id);
//             }

//             const taskTitle = task.title || `Task ${task._id}` || "Unknown Task";

//             toast.warning(`TAT Warning for ${taskTitle}`, {
//               description:
//                 "80% of time allocated for this task has been used. Only 20% remaining!",
//               duration: 10000,
//             });

//             dispatch(
//               sendTaskStatusEmail({
//                 to: (user as any)?.userId?.email || (user as any)?.email || "",
//                 name: (user as any)?.userId?.name || (user as any)?.name || "User",
//                 taskName: taskTitle,
//                 taskStatus: 80,
//               })
//             );
//           }

//           if (progressPercentage >= 100 && !criticalAlerts[task._id]) {
//             newCriticalAlerts[task._id] = true;

//             if (!hasPlayedAlert(`${task._id}_critical`)) {
//               playAlert(`${task._id}_critical`);
//             }

//             const taskTitle = task.title || `Task ${task._id}` || "Unknown Task";

//             toast.error(`Deadline Reached for ${taskTitle}`, {
//               description:
//                 "The allocated time for this task has been exhausted!",
//               duration: 15000,
//             });
//           }
//         }
//       });

//       setTatAlerts(newTatAlerts);
//       setCriticalAlerts(newCriticalAlerts);
//       setTimeElapsed(updatedTime);
//       setProgressValues(updatedProgress);
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [
//     dailyAssignments,
//     progressValues,
//     timeElapsed,
//     tatAlerts,
//     criticalAlerts,
//     dispatch,
//     user,
//     playAlert,
//     hasPlayedAlert,
//   ]);

//   const getInitialProgressValue = (task: any) => {
//     if (task.timer_status === "Done") return 100;
//     if (task.timer_status === "Stuck") return 25;
//     if (task.timer_status === "Todo") return 0;

//     if (task.timerStartTime) {
//       const elapsedSeconds =
//         (Date.now() - new Date(task.timerStartTime).getTime()) / 1000;
//       const tatSeconds = (task.TAT || 480) * 60;
//       return Math.min((elapsedSeconds / tatSeconds) * 100, 100);
//     }

//     return 0;
//   };

//   const getEfficiencyMessage = (score: number) => {
//     if (score >= 200) return "Exceptional performance! Outstanding work!";
//     if (score >= 150)
//       return "Excellent performance! Maintaining high standards!";
//     if (score >= 100) return "Great performance! Well above expectations!";
//     if (score >= 90) return "Excellent performance! Keep it up!";
//     if (score >= 80) return "Good progress, aim for higher efficiency.";
//     if (score >= 70) return "Solid work, room for improvement.";
//     if (score >= 60) return "Meeting expectations.";
//     return "Consider reviewing your workflow for improvements.";
//   };

//   const handleStatusChange = async (
//     taskId: string,
//     newStatus: "Todo" | "InProgress" | "Stuck" | "Done"
//   ) => {
//     const task = dailyAssignments.find((t) => t._id === taskId);
//     if (!task) return;

//     try {
//       if (newStatus === "Stuck") {
//         setCurrentTaskId(taskId);
//         setCurrentTask(task);
//         setOpenStuckDialog(true);
//         return;
//       }

//       if (newStatus === "Done") {
//         const isOverdue = isTaskOverdue(task);
//         if (isOverdue) {
//           setCurrentTaskId(taskId);
//           setCurrentTask(task);
//           setOpenOverdueDialog(true);
//           return;
//         }
//         setCurrentTaskId(taskId);
//         setCurrentTask(task);
//         setOpenProofDialog(true);
//         return;
//       }

//       await dispatch(
//         changeTimerStatus({
//           id: taskId,
//           timer_status: newStatus,
//         })
//       ).unwrap();

//       await dispatch(fetchUserDailyTaskAssignments());

//       setProgressValues((prev) => ({
//         ...prev,
//         [taskId]: newStatus === "Todo" ? 0 : prev[taskId] || 0,
//       }));

//       toast.success("Status updated", {
//         description: `Task status changed to ${newStatus}`,
//       });
//     } catch (error) {
//       console.error("Status change error:", error);
//       toast.error("Error", {
//         description: "Failed to update task status",
//       });
//     }
//   };

  

//   const isTaskOverdue = (task: any) => {
//     if (!task.timerStartTime) return false;
//     const tatSeconds = (task.TAT || 480) * 60;
//     const elapsed =
//       (Date.now() - new Date(task.timerStartTime).getTime()) / 1000;
//     return elapsed > tatSeconds;
//   };

//   const submitStuckRequest = async () => {
//     if (!currentTaskId || !stuckReason) return;

//     try {
//       await dispatch(
//         requestStuckStatus({
//           id: currentTaskId,
//           stuck_reason: stuckReason,
//         })
//       ).unwrap();

//       await dispatch(fetchUserDailyTaskAssignments());

//       setProgressValues((prev) => ({
//         ...prev,
//         [currentTaskId]: 25,
//       }));

//       toast.info("Stuck request submitted", {
//         description: "Your manager will review your request.",
//       });
//       setOpenStuckDialog(false);
//       setStuckReason("");
//     } catch (error) {
//       toast.error("Error", {
//         description: "Failed to submit stuck request.",
//       });
//     }
//   };

//   const submitOverdueTask = async () => {
//     if (!currentTaskId || !overdueReason) return;

//     try {
//       const proofs: Record<
//         string,
//         { type: "url" | "file"; value: string | File }
//       > = {};

//       if (files.length > 0) {
//         const fileProofs = currentTask.proof.filter(
//           (p: any) => p.type === "file"
//         );
//         if (fileProofs.length > 0) {
//           fileProofs.forEach((proof: any, index: number) => {
//             if (files[index]) {
//               proofs[proof.fieldName] = {
//                 type: "file",
//                 value: files[index],
//               };
//             }
//           });
//         }
//       }

//       currentTask.proof.forEach((proof: any) => {
//         if (proof.type === "url" && proofLinks[proof.fieldName]) {
//           proofs[proof.fieldName] = {
//             type: "url",
//             value: proofLinks[proof.fieldName],
//           };
//         }
//       });

//       const submissionData = {
//         assignmentId: currentTaskId,
//         proofs,
//         comment: proofComment,
//         reason: overdueReason,
//       };

//       await dispatch(
//         changeTimerStatus({
//           id: currentTaskId,
//           timer_status: "Done",
//         })
//       ).unwrap();

//       await dispatch(createSubmission(submissionData)).unwrap();

//       await dispatch(fetchUserDailyTaskAssignments());

//       setProgressValues((prev) => ({ ...prev, [currentTaskId]: 100 }));
//       setOverdueReason("");
//       setFiles([]);
//       setProofLinks({});
//       setProofComment("");
//       setOpenOverdueDialog(false);

//       toast.success("Overdue task submitted", {
//         description:
//           "Your overdue task has been submitted with proof and reason.",
//       });
//     } catch (error) {
//       toast.error("Error", {
//         description: "Failed to submit overdue task.",
//       });
//     }
//   };

//   const submitProof = async () => {
//     if (!currentTaskId || !currentTask) return;

//     try {
//       await dispatch(
//         changeTimerStatus({
//           id: currentTaskId,
//           timer_status: "Done",
//         })
//       ).unwrap();

//       const proofs: Record<
//         string,
//         { type: "url" | "file"; value: string | File }
//       > = {};

//       if (files.length > 0) {
//         const fileProofs = currentTask.proof.filter(
//           (p: any) => p.type === "file"
//         );
//         if (fileProofs.length > 0) {
//           fileProofs.forEach((proof: any, index: number) => {
//             if (files[index]) {
//               proofs[proof.fieldName] = {
//                 type: "file",
//                 value: files[index],
//               };
//             }
//           });
//         }
//       }

//       currentTask.proof.forEach((proof: any) => {
//         if (proof.type === "url" && proofLinks[proof.fieldName]) {
//           proofs[proof.fieldName] = {
//             type: "url",
//             value: proofLinks[proof.fieldName],
//           };
//         }
//       });

//       const submissionData = {
//         assignmentId: currentTaskId,
//         proofs,
//         comment: proofComment,
//         reason: "",
//       };

//       await dispatch(createSubmission(submissionData)).unwrap();

//       await dispatch(fetchUserDailyTaskAssignments());

//       setProgressValues((prev) => ({ ...prev, [currentTaskId]: 100 }));
//       setFiles([]);
//       setProofLinks({});
//       setProofComment("");
//       setOpenProofDialog(false);

//       toast.success("Submission created", {
//         description: "Your task proof has been successfully submitted.",
//       });
//     } catch (error) {
//       console.error("Submission error:", error);
//       toast.error("Error", {
//         description: "Failed to create submission.",
//       });
//     }
//   };

//   const submitSealForApproval = async () => {
//     const incompleteTasks = dailyAssignments.filter(
//       (task) => task.timer_status !== "Done"
//     );

//     if (incompleteTasks.length > 0) {
//       toast.warning("Incomplete tasks", {
//         description: "Please complete all tasks before submitting for approval.",
//       });
//       return;
//     }

//     if (sealSubmitted) {
//       toast.info("Seal already submitted", {
//         description: "Your daily seal has already been submitted for approval.",
//       });
//       return;
//     }

//     setIsSubmittingSeal(true);

//     try {
//       const completedTasks = dailyAssignments.filter(
//         (task) => task.timer_status === "Done"
//       );

//       if (completedTasks.length === 0) {
//         toast.warning("No completed tasks", {
//           description: "You have no completed tasks to submit for approval.",
//         });
//         setIsSubmittingSeal(false);
//         return;
//       }

//       const tasksByAssigner: Record<string, string[]> = {};
//       completedTasks.forEach((task) => {
//         const assignerId = task.assigned_by_user_id._id;
//         if (!tasksByAssigner[assignerId]) {
//           tasksByAssigner[assignerId] = [];
//         }
//         tasksByAssigner[assignerId].push(task._id);
//       });

//       for (const [assignerId, taskIds] of Object.entries(tasksByAssigner)) {
//         await dispatch(
//           requestApproval({
//             taskAssignIds: taskIds,
//             assignBy: assignerId,
//           })
//         ).unwrap();
//       }

//       const today = new Date().toDateString();
//       localStorage.setItem("lastSealSubmittedDate", today);
//       setSealSubmitted(true);

//       toast.success("Tasks submitted for approval successfully", {
//         description:
//           "Your daily seal has been submitted and cannot be submitted again today.",
//       });
//     } catch (error) {
//       toast.error("Failed to submit tasks for approval");
//       console.error("Approval submission error:", error);
//     } finally {
//       setIsSubmittingSeal(false);
//     }
//   };

//   const pendingApprovalsCount = dailyAssignments.filter(
//     (task) => task.timer_status === "InProgress" || task.timer_status === "Todo"
//   ).length;

//   const sealsApprovedCount = dailyAssignments.filter(
//     (task) => task.timer_status === "Done"
//   ).length;

//   const removeFile = (file: FileWithPreview) => {
//     setFiles(files.filter((f) => f.name !== file.name));
//     URL.revokeObjectURL(file.preview);
//   };

//   const handleProofLinkChange = (fieldName: string, value: string) => {
//     setProofLinks((prev) => ({
//       ...prev,
//       [fieldName]: value,
//     }));
//   };

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case "InProgress":
//         return (
//           <Badge variant="outline" className="text-blue-600">
//             In Progress
//           </Badge>
//         );
//       case "Stuck":
//         return (
//           <Badge variant="outline" className="text-yellow-600">
//             Stuck
//           </Badge>
//         );
//       case "Done":
//         return (
//           <Badge variant="outline" className="text-green-600">
//             Done
//           </Badge>
//         );
//       default:
//         return (
//           <Badge variant="outline" className="text-gray-600">
//             Todo
//           </Badge>
//         );
//     }
//   };

//   const getTimeRemaining = (task: any) => {
//     if (task.timer_status !== "InProgress" || !task.timerStartTime) return null;

//     const tatSeconds = (task.TAT || 480) * 60;
//     const elapsed = timeElapsed[task._id] || 0;
//     const remaining = tatSeconds - elapsed;

//     if (remaining <= 0) return "Overdue!";

//     const hours = Math.floor(remaining / 3600);
//     const minutes = Math.floor((remaining % 3600) / 60);
//     const seconds = Math.floor(remaining % 60);

//     return `${hours}h ${minutes}m ${seconds}s remaining`;
//   };

//   const renderProofInputs = (task: any) => {
//     if (!task || !task.proof || task.proof.length === 0) {
//       return (
//         <div>
//           <div
//             {...getRootProps()}
//             className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50"
//           >
//             <input {...getInputProps()} />
//             <UploadIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
//             <p className="text-sm text-muted-foreground">
//               Drag & drop files here, or click to select files
//             </p>
//           </div>
//         </div>
//       );
//     }

//     return task.proof.map((proof: any) => {
//       if (proof.type === "url") {
//         return (
//           <div key={proof.fieldName} className="space-y-2">
//             <label className="text-sm font-medium">{proof.fieldName}</label>
//             <Input
//               placeholder={`Enter ${proof.fieldName} URL`}
//               value={proofLinks[proof.fieldName] || ""}
//               onChange={(e) =>
//                 handleProofLinkChange(proof.fieldName, e.target.value)
//               }
//             />
//           </div>
//         );
//       } else if (proof.type === "file") {
//         return (
//           <div key={proof.fieldName} className="space-y-2">
//             <label className="text-sm font-medium">{proof.fieldName}</label>
//             <div
//               {...getRootProps()}
//               className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50"
//             >
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

//   return (
//     <div className="p-6 space-y-6">
//       <Toaster richColors />

//       <div>
//         <h1 className="text-2xl font-semibold">Welcome back, {user?.name}</h1>
//         <p className="text-sm text-muted-foreground" suppressHydrationWarning>
//           {dayjs().format("dddd, MMMM D, YYYY")}
//         </p>

//         <div className="flex flex-col items-end gap-2">
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={async () => {
//               try {
//                 if (!isAudioEnabled) {
//                   toggleAudio();
//                   await initializeAudio();
//                   toast.success("Audio enabled");
//                 } else {
//                   toggleAudio();
//                   toast.info("Audio disabled");
//                 }
//               } catch (error) {
//                 console.error("Audio toggle failed:", error);
//                 if (!isAudioEnabled) {
//                   toggleAudio();
//                 }
//                 toast.error("Failed to initialize audio");
//               }
//             }}
//             className="flex items-center gap-2"
//           >
//             {isAudioEnabled ? (
//               <Volume2Icon className="w-4 h-4" />
//             ) : (
//               <VolumeXIcon className="w-4 h-4" />
//             )}
//             {isAudioEnabled ? "Audio On" : "Audio Off"}
//           </Button>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
//           <CardContent className="p-6">
//             <div className="text-3xl font-bold">
//               {pulseEfficiencyData
//                 ? `${pulseEfficiencyData.efficiency.toFixed(1)}`
//                 : "Loading..."} 
//             </div>
//             <p>PulseEfficiency Score</p>
//             <p className="text-sm">
//               {pulseEfficiencyData !== null
//                 ? getEfficiencyMessage(pulseEfficiencyData?.efficiency || [0])
//                 : "Fetching your efficiency data..."}
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-6">
//             <p className="font-semibold">Tasks Due Today</p>
//             <p className="text-2xl">{dailyAssignments.length}</p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-6">
//             <p className="font-semibold">Seals Approved</p>
//             <p className="text-2xl">{sealsApprovedCount}</p>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-6">
//             <p className="font-semibold">Pending Approvals</p>
//             <p className="text-2xl">{pendingApprovalsCount}</p>
//           </CardContent>
//         </Card>
//       </div>

//       <div className="grid">
//         <div className="lg:col-span-2">
//           <div className="flex justify-between items-center mb-4">
//             <h2 className="text-xl font-semibold">My Tasks</h2>
//             <Button
//               onClick={submitSealForApproval}
//               disabled={
//                 loading ||
//                 dailyAssignments.some(
//                   (task) => task.timer_status !== "Done"
//                 ) ||
//                 sealSubmitted ||
//                 isSubmittingSeal
//               }
//             >
//               {isSubmittingSeal ? (
//                 <>
//                   <svg
//                     className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                   >
//                     <circle
//                       className="opacity-25"
//                       cx="12"
//                       cy="12"
//                       r="10"
//                       stroke="currentColor"
//                       strokeWidth="4"
//                     ></circle>
//                     <path
//                       className="opacity-75"
//                       fill="currentColor"
//                       d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                     ></path>
//                   </svg>
//                   Submitting...
//                 </>
//               ) : sealSubmitted ? (
//                 "Seal Submitted"
//               ) : (
//                 "Submit Seal for Approval"
//               )}
//             </Button>
//           </div>

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
//                     <div className="my-3">
//                       <div className="flex justify-between mb-1">
//                         <span className="text-sm font-medium">
//                           Progress:{" "}
//                           {Math.round(progressValues[task._id] || 0)}%
//                         </span>
//                         <span className="text-xs text-muted-foreground">
//                           TAT: {task.TAT || 480} mins
//                         </span>
//                       </div>
//                       <Progress
//                         value={progressValues[task._id] || 0}
//                         className={`
//                           h-2
//                           ${
//                             progressValues[task._id] >= 100
//                               ? "bg-red-500"
//                               : progressValues[task._id] > 80
//                               ? "bg-orange-500"
//                               : progressValues[task._id] > 60
//                               ? "bg-yellow-500"
//                               : "bg-blue-500"
//                           }
//                         `}
//                       />
//                       {task.timer_status === "InProgress" && (
//                         <p
//                           className={`text-xs mt-1 ${
//                             progressValues[task._id] >= 100
//                               ? "text-red-500 font-medium"
//                               : progressValues[task._id] > 80
//                               ? "text-orange-500"
//                               : "text-muted-foreground"
//                           }`}
//                         >
//                           {getTimeRemaining(task)}
//                         </p>
//                       )}
//                     </div>

//                     <Select
//                       value={task.timer_status}
//                       onValueChange={(
//                         value: "Todo" | "InProgress" | "Stuck" | "Done"
//                       ) => handleStatusChange(task._id, value)}
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="Status" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem
//                           value="Todo"
//                           disabled={task.timer_status !== "Todo"}
//                         >
//                           To Do
//                         </SelectItem>
//                         <SelectItem
//                           value="InProgress"
//                           disabled={
//                             task.timer_status === "Done" ||
//                             task.timer_status === "Stuck"
//                           }
//                         >
//                           In Progress
//                         </SelectItem>
//                         <SelectItem
//                           value="Stuck"
//                           disabled={
//                             task.timer_status === "Stuck" ||
//                             task.timer_status === "Done"
//                           }
//                         >
//                           Stuck
//                         </SelectItem>
//                         <SelectItem
//                           value="Done"
//                           disabled={task.timer_status === "Done"}
//                         >
//                           Done
//                         </SelectItem>
//                       </SelectContent>
//                     </Select>

//                     {task.timer_status === "Done" &&
//                       task.proof?.length > 0 && (
//                         <div className="mt-3 text-sm text-muted-foreground">
//                           Proof submitted: {task.proof[0].type}
//                         </div>
//                       )}
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

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

//       <Dialog open={openOverdueDialog} onOpenChange={setOpenOverdueDialog}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>Task Overdue</DialogTitle>
//             <DialogDescription>
//               Please explain why this task was completed after the deadline and
//               provide proof.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4">
//             <Textarea
//               placeholder="Explain why this task is overdue..."
//               value={overdueReason}
//               onChange={(e) => setOverdueReason(e.target.value)}
//               className="min-h-[100px]"
//             />

//             {currentTask && renderProofInputs(currentTask)}

//             {files.length > 0 && (
//               <div className="mt-4 space-y-2">
//                 <h4 className="text-sm font-medium">Selected files:</h4>
//                 <div className="space-y-2">
//                   {files.map((file) => (
//                     <div
//                       key={file.name}
//                       className="flex items-center justify-between p-2 border rounded"
//                     >
//                       <div className="flex items-center space-x-2">
//                         {file.type.startsWith("image/") ? (
//                           <Image
//                             src={file.preview}
//                             alt={file.name}
//                             width={40}
//                             height={40}
//                             className="object-cover rounded"
//                           />
//                         ) : (
//                           <div className="w-10 h-10 flex items-center justify-center bg-muted rounded">
//                             <span className="text-xs">
//                               {file.name.split(".").pop()}
//                             </span>
//                           </div>
//                         )}
//                         <span className="text-sm truncate max-w-[180px]">
//                           {file.name}
//                         </span>
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

//             <Textarea
//               placeholder="Additional comments (optional)"
//               value={proofComment}
//               onChange={(e) => setProofComment(e.target.value)}
//             />

//             <Button
//               onClick={submitOverdueTask}
//               disabled={
//                 !overdueReason ||
//                 (currentTask?.proof?.some((p: any) => p.type === "url") &&
//                   !currentTask.proof.some(
//                     (p: any) => proofLinks[p.fieldName]
//                   )) ||
//                 (currentTask?.proof?.some((p: any) => p.type === "file") &&
//                   files.length === 0)
//               }
//             >
//               Submit Overdue Task
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>

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

//             {files.length > 0 && (
//               <div className="mt-4 space-y-2">
//                 <h4 className="text-sm font-medium">Selected files:</h4>
//                 <div className="space-y-2">
//                   {files.map((file) => (
//                     <div
//                       key={file.name}
//                       className="flex items-center justify-between p-2 border rounded"
//                     >
//                       <div className="flex items-center space-x-2">
//                         {file.type.startsWith("image/") ? (
//                           <Image
//                             src={file.preview}
//                             alt={file.name}
//                             width={40}
//                             height={40}
//                             className="object-cover rounded"
//                           />
//                         ) : (
//                           <div className="w-10 h-10 flex items-center justify-center bg-muted rounded">
//                             <span className="text-xs">
//                               {file.name.split(".").pop()}
//                             </span>
//                           </div>
//                         )}
//                         <span className="text-sm truncate max-w-[180px]">
//                           {file.name}
//                         </span>
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

//             <Textarea
//               placeholder="Additional comments (optional)"
//               value={proofComment}
//               onChange={(e) => setProofComment(e.target.value)}
//             />

//             <Button
//               onClick={submitProof}
//               disabled={
//                 (currentTask?.proof?.some((p: any) => p.type === "url") &&
//                   !currentTask.proof.some(
//                     (p: any) => proofLinks[p.fieldName]
//                   )) ||
//                 (currentTask?.proof?.some((p: any) => p.type === "file") &&
//                   files.length === 0)
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


// "use client"
// import React, { useState, useEffect, useMemo, useRef } from 'react';
// import { useAppDispatch, useAppSelector } from '@/store/hooks';
// import { 
//   createTaskAssignment, 
//   ProofRequirement, 
//   bulkTaskAssignments,
//   fetchPreviousTasks,
//   selectPreviousTasks
// } from '@/features/taskAssignments/taskAssignmentSlice';

// import {
//   fetchUserHierarchy,
//   selectHierarchyUsers,
//   selectHierarchyLoading,
//   selectUsersError
// } from '@/features/user/userSlice';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { toast } from 'sonner';

// interface ProofField {
//   fieldName: string;
//   type: 'url' | 'file';
//   url?: string; 
// }

// interface CreateTaskFormData {
//   title: string;
//   description: string;
//   assigned_to_employee_id: string;
//   proof: ProofRequirement[];
//   TAT: number;
//   deadline: string;
//   department_id?: string;
// }

// interface BulkUploadData {
//   assigned_to_employee_id: string;
//   department_id?: string;
//   taskFile: File;
// }

// const TaskAssignmentForm = () => {
//   const dispatch = useAppDispatch();
  
//   const hierarchyUsers = useAppSelector(selectHierarchyUsers);
//   const hierarchyLoading = useAppSelector(selectHierarchyLoading);
//   const usersError = useAppSelector(selectUsersError);
//   const { loading, error: taskError } = useAppSelector((state) => state.taskAssignments);
//   const { user } = useAppSelector((state) => state.auth);
//   const previousTasks = useAppSelector(selectPreviousTasks);

//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const titleInputRef = useRef<HTMLInputElement>(null);
//   const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
//   const [selectedBulkAssignee, setSelectedBulkAssignee] = useState('');
//   const [selectedBulkDepartment, setSelectedBulkDepartment] = useState('');
//   const [isSearching, setIsSearching] = useState(false);
//   const [showSearchResults, setShowSearchResults] = useState(false);
//   const [isPreviousTaskSelected, setIsPreviousTaskSelected] = useState(false);

//   useEffect(() => {
//     dispatch(fetchUserHierarchy());
//   }, [dispatch]);

//   useEffect(() => {
//     if (usersError) {
//       toast.error('Failed to load assignees', {
//         description: usersError
//       });
//     }
//   }, [usersError]);

//   const sortedHierarchyUsers = useMemo(() => {
//     if (!hierarchyUsers || hierarchyUsers.length === 0) return [];
    
//     return [...hierarchyUsers].sort((a, b) => a.hierarchyLevel - b.hierarchyLevel);
//   }, [hierarchyUsers]);

//   const [formData, setFormData] = useState<CreateTaskFormData>({
//     title: '',
//     description: '',
//     assigned_to_employee_id: '',
//     proof: [],
//     TAT: 0,
//     deadline: '',
//   });

//   const [newProofField, setNewProofField] = useState<ProofField>({
//     fieldName: '',
//     type: 'url'
//   });

//   const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);

//   const timeOptions = [
//     { value: '15', label: '15 minutes' },
//     { value: '30', label: '30 minutes' },
//     { value: '60', label: '60 minutes' },
//     { value: '120', label: '120 minutes' },
//     { value: '240', label: '240 minutes' },
//     { value: '480', label: '480 minutes' },
//     { value: '1440', label: '1440 minutes' }
//   ];

//   const proofTypes = [
//     { value: 'url', label: 'URL' },
//     { value: 'file', label: 'File' }
//   ];

//   // FIXED: Improved department extraction logic
//   const getSelectedUserDepartments = () => {
//     if (!formData.assigned_to_employee_id) return [];

//     const selectedUser = hierarchyUsers.find(user => user.userId === formData.assigned_to_employee_id);
//     if (!selectedUser || !selectedUser.departments) return [];

//     console.log('Selected User Departments:', selectedUser.departments);

//     try {
//       let departmentsArray = selectedUser.departments;
      
//       // If departments is a string, parse it
//       if (typeof selectedUser.departments === 'string') {
//         departmentsArray = JSON.parse(selectedUser.departments);
//       }
      
//       // Ensure we have an array
//       if (!Array.isArray(departmentsArray)) {
//         console.error('Departments is not an array:', departmentsArray);
//         return [];
//       }

//       // Map departments with proper ID extraction
//       return departmentsArray.map((dept: any) => {
//         // Try multiple possible ID fields
//         const departmentId = dept._id || dept.id || dept.departmentId || '';
//         const departmentName = dept.name || dept.departmentName || 'Unknown Department';
        
//         return {
//           id: departmentId,
//           name: departmentName
//         };
//       }).filter(dept => dept.id && dept.name); // Filter out invalid departments

//     } catch (error) {
//       console.error('Error parsing departments:', error);
//       return [];
//     }
//   };

//   const getBulkUserDepartments = () => {
//     if (!selectedBulkAssignee) return [];
//     const selectedUser = hierarchyUsers.find(user => user.userId === selectedBulkAssignee);
//     if (!selectedUser || !selectedUser.departments) return [];

//     console.log('Bulk Selected User Departments:', selectedUser.departments);

//     try {
//       let departmentsArray = selectedUser.departments;
      
//       if (typeof selectedUser.departments === 'string') {
//         departmentsArray = JSON.parse(selectedUser.departments);
//       }
      
//       if (!Array.isArray(departmentsArray)) {
//         console.error('Bulk Departments is not an array:', departmentsArray);
//         return [];
//       }

//       return departmentsArray.map((dept: any) => {
//         const departmentId = dept._id || dept.id || dept.departmentId || '';
//         const departmentName = dept.name || dept.departmentName || 'Unknown Department';
        
//         return {
//           id: departmentId,
//           name: departmentName
//         };
//       }).filter(dept => dept.id && dept.name);

//     } catch (error) {
//       console.error('Error parsing bulk departments:', error);
//       return [];
//     }
//   };

//   const clearBulkUploadForm = () => {
//     setSelectedBulkAssignee('');
//     setSelectedBulkDepartment('');
//     setBulkUploadFile(null);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }
//     toast.success('Bulk upload form cleared');
//   };

//   const clearSingleTaskForm = () => {
//     setFormData({
//       title: '',
//       description: '',
//       assigned_to_employee_id: '',
//       proof: [],
//       TAT: 0,
//       deadline: '',
//     });
//     setNewProofField({
//       fieldName: '',
//       type: 'url'
//     });
//     setIsPreviousTaskSelected(false);
//     setShowSearchResults(false);
//     toast.success('Task form cleared');
//   };

//   const handleTitleChange = async (value: string) => {
//     setFormData(prev => ({
//       ...prev,
//       title: value
//     }));

//     if (isPreviousTaskSelected && value !== formData.title) {
//       setIsPreviousTaskSelected(false);
//       setFormData({
//         title: value,
//         description: '',
//         assigned_to_employee_id: '',
//         proof: [],
//         TAT: 0,
//         deadline: '',
//       });
//     }

//     if (value.trim().length > 2) {
//       setIsSearching(true);
//       try {
//         await dispatch(fetchPreviousTasks(value)).unwrap();
//         setShowSearchResults(true);
//       } catch (error) {
//         console.error('Failed to search previous tasks');
//       } finally {
//         setIsSearching(false);
//       }
//     } else {
//       setShowSearchResults(false);
//     }
//   };

//   const handleTaskSelect = (task: any) => {
//     setFormData({
//       title: task.title,
//       description: task.description || '',
//       assigned_to_employee_id: task.assigned_to_employee_id?._id || '',
//       proof: task.proof || [],
//       TAT: task.TAT || 0,
//       deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
//       department_id: task.department_id || '', 
//     });
    
//     setShowSearchResults(false);
//     setIsPreviousTaskSelected(true);
//     toast.success('Previous task loaded! You can edit details before submitting.');
//   };

//   const handleInputChange = (field: keyof CreateTaskFormData, value: string | number | ProofRequirement[]) => {
//     if (field === 'assigned_to_employee_id') {
//       setFormData(prev => ({
//         ...prev,
//         [field]: value as string, 
//         department_id: '' // Reset department when user changes
//       }));
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         [field]: value
//       }));
//     }
//   };

//   const handleProofFieldChange = (field: keyof ProofField, value: string) => {
//     setNewProofField(prev => ({
//       ...prev,
//       [field]: value
//     }));
//   };

//   const addProofField = () => {
//     if (!newProofField.fieldName.trim()) {
//       toast.error('Please enter a field name for the proof');
//       return;
//     }

//     setFormData(prev => ({
//       ...prev,
//       proof: [...prev.proof, newProofField]
//     }));

//     setNewProofField({
//       fieldName: '',
//       type: 'url'
//     });
//   };

//   const removeProofField = (index: number) => {
//     setFormData(prev => {
//       const newProof = [...prev.proof];
//       newProof.splice(index, 1);
//       return {
//         ...prev,
//         proof: newProof
//       };
//     });
//   };

//   const handleSubmit = async () => {
//     try {
//       if (!formData.title.trim()) {
//         throw new Error('Please enter a task title');
//       }
//       if (!formData.assigned_to_employee_id) {
//         throw new Error('Please select an assignee');
//       }
//       if (!formData.department_id) {
//         throw new Error('Please select a department');
//       }
//       if (!formData.TAT) {
//         throw new Error('Please select time to approval');
//       }
//       if (!formData.deadline) {
//         throw new Error('Please set a deadline');
//       }
//       if (formData.proof.length === 0) {
//         throw new Error('Please add at least one proof requirement');
//       }

//       const payload = {
//         ...formData,
//         TAT: Number(formData.TAT),
//         proof: formData.proof,
//         department_id: formData.department_id,
//       };

//       await dispatch(createTaskAssignment(payload)).unwrap();

//       toast.success('Task assigned successfully!', {
//         description: `"${formData.title}" has been assigned successfully.`
//       });

//       clearSingleTaskForm();

//     } catch (error: any) {
//       toast.error('Failed to assign task', {
//         description: error.message || 'Please try again.'
//       });
//     }
//   };

//   const downloadTemplate = () => {
//     const templateData = [
//       {
//         title: 'Prepare Sales Report',
//         description: 'Compile the monthly sales report with charts',
//         proof: JSON.stringify([{ fieldName: 'Github', type: 'url' }]),
//         TAT: 60,
//         deadline: '2025-08-22T18:30',
//         createdAt: '2025-08-22T18:30',
//         updatedAt: '2025-08-22T18:30'
//       },
//       {
//         title: 'Client Presentation',
//         description: 'Prepare slides for upcoming client meeting',
//         proof: JSON.stringify([{ fieldName: 'Drive', type: 'url' }]),
//         TAT: 120,
//         deadline: '2025-08-22T18:30',
//         createdAt: '2025-08-22T18:30',
//         updatedAt: '2025-08-22T18:30'
//       },
//       {
//         title: 'Website Bug Fix',
//         description: 'Resolve UI issues on homepage banner',
//         proof: JSON.stringify([{ fieldName: 'Image', type: 'file' }]),
//         TAT: 180,
//         deadline: '2025-08-22T18:30',
//       }
//     ];

//     const headers = ['title', 'description', 'proof', 'TAT', 'deadline'];
//     const csvContent = [
//       headers.join(','),
//       ...templateData.map(row => 
//         headers.map(header => {
//           const value = row[header as keyof typeof row];
//           const escapedValue = String(value).replace(/"/g, '""');
//           return String(value).includes(',') || String(value).includes('"') ? `"${escapedValue}"` : escapedValue;
//         }).join(',')
//       )
//     ].join('\n');

//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.setAttribute('href', url);
//     link.setAttribute('download', 'bulk_task_template.csv');
//     link.style.visibility = 'hidden';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
    
//     toast.success('Template downloaded successfully!', {
//       description: 'You can now fill in your task details and upload the file.'
//     });
//   };

//   const handleBulkFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const files = event.target.files;
//     if (!files || files.length === 0) return;

//     const file = files[0];
    
//     const validExtensions = ['.xlsx', '.csv', '.xls'];
//     const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
//     if (!validExtensions.includes(fileExtension)) {
//       toast.error('Invalid file type', {
//         description: 'Please select an Excel (.xlsx, .xls) or CSV file.'
//       });
//       if (fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//       return;
//     }

//     if (file.size > 10 * 1024 * 1024) {
//       toast.error('File too large', {
//         description: 'Please select a file smaller than 10MB.'
//       });
//       if (fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//       return;
//     }

//     if (!selectedBulkAssignee) {
//       toast.error('Assignee required', {
//         description: 'Please select an assignee for bulk upload first.'
//       });
//       if (fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//       return;
//     }

//     if (!selectedBulkDepartment) {
//       toast.error('Department required', {
//         description: 'Please select a department for bulk upload first.'
//       });
//       if (fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//       return;
//     }

//     setBulkUploadFile(file);
//     toast.success('File selected', {
//       description: `${file.name} is ready for upload.`
//     });
//   };

//   const handleBulkUpload = async () => {
//     if (!bulkUploadFile) {
//       toast.error('No file selected', {
//         description: 'Please select a file first.'
//       });
//       return;
//     }

//     if (!selectedBulkAssignee) {
//       toast.error('No assignee selected', {
//         description: 'Please select an assignee for bulk upload.'
//       });
//       return;
//     }

//     if (!selectedBulkDepartment) {
//       toast.error('No department selected', {
//         description: 'Please select a department for bulk upload.'
//       });
//       return;
//     }

//     setBulkUploadLoading(true);
    
//     const loadingToast = toast.loading('Uploading bulk tasks...');
    
//     try {
//       const bulkData: BulkUploadData = {
//         assigned_to_employee_id: selectedBulkAssignee,
//         department_id: selectedBulkDepartment,
//         taskFile: bulkUploadFile
//       };

//       const result = await dispatch(bulkTaskAssignments(bulkData)).unwrap();
      
//       toast.dismiss(loadingToast);
//       toast.success('Bulk tasks uploaded successfully!', {
//         description: `${result.length || 'Multiple'} tasks have been assigned successfully.`
//       });

//       clearBulkUploadForm();
      
//     } catch (error: any) {
//       toast.dismiss(loadingToast);
//       toast.error('Failed to upload bulk tasks', {
//         description: error.message || 'Please check your file format and try again.'
//       });
//     } finally {
//       setBulkUploadLoading(false);
//     }
//   };

//   const isFormValid = !!(formData.title.trim() && 
//                    formData.assigned_to_employee_id && 
//                    formData.department_id &&
//                    formData.TAT && 
//                    formData.deadline &&
//                    formData.proof.length > 0);

//   const isBulkFormValid = !!(selectedBulkAssignee && selectedBulkDepartment && bulkUploadFile);

//   const getSelectedUserInfo = () => {
//     if (!formData.assigned_to_employee_id) return { department: '', role: '' };
//     const selectedUser = hierarchyUsers.find(
//       user => user.userId === formData.assigned_to_employee_id
//     );
//     if (!selectedUser) return { department: '', role: '' };
    
//     // Get the selected department name
//     const userDepartments = getSelectedUserDepartments();
//     const selectedDepartment = userDepartments.find(
//       dept => dept.id === formData.department_id
//     );
    
//     return {
//       department: selectedDepartment ? selectedDepartment.name : 'No department selected',
//       role: selectedUser.role || ''
//     };
//   };

//   // Debug: Log department data
//   useEffect(() => {
//     if (formData.assigned_to_employee_id) {
//       console.log('User Departments:', getSelectedUserDepartments());
//       console.log('Form Department ID:', formData.department_id);
//     }
//   }, [formData.assigned_to_employee_id, formData.department_id]);

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-[#1e2939] py-8 px-4">
//       <div className="max-w-2xl mx-auto">
//         <Card className="shadow-sm">
//           <CardHeader className="pb-6">
//             <CardTitle className="text-2xl">Task Assignment</CardTitle>
//             <CardDescription>
//               Assign tasks to your team members efficiently
//             </CardDescription>
//           </CardHeader>
          
//           <CardContent>
//             <div className="space-y-6">
//               <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
//                 <div className="flex items-center justify-between">
//                   <h3 className="text-lg font-medium">Bulk Task Upload</h3>
//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="sm"
//                     onClick={clearBulkUploadForm}
//                     disabled={!selectedBulkAssignee && !selectedBulkDepartment && !bulkUploadFile}
//                     className="text-muted-foreground hover:text-foreground"
//                   >
//                     Clear
//                   </Button>
//                 </div>
//                 <p className="text-sm text-muted-foreground">
//                   Upload multiple tasks at once using an Excel template
//                 </p>
                
//                 <div className="flex flex-col gap-4 sm:flex-row">
//                   <Button 
//                     type="button" 
//                     variant="outline" 
//                     onClick={downloadTemplate}
//                     className="flex-1"
//                   >
//                     Download Template
//                   </Button>
                  
//                   <div className="flex-1 flex flex-col gap-2">
//                     <Select 
//                       value={selectedBulkAssignee} 
//                       onValueChange={(value) => {
//                         setSelectedBulkAssignee(value);
//                         setSelectedBulkDepartment(''); 
//                       }}
//                       disabled={hierarchyLoading || sortedHierarchyUsers.length === 0}
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select bulk assignee" />
//                       </SelectTrigger>
//                       {sortedHierarchyUsers.length > 0 && (
//                         <SelectContent>
//                           {sortedHierarchyUsers.map((user) => (
//                             <SelectItem key={user.userId} value={user.userId}>
//                               {user.name} ({user.email}) - {user.role} - Level {user.hierarchyLevel}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       )}
//                     </Select>

//                     {selectedBulkAssignee && getBulkUserDepartments().length > 0 && (
//                       <Select 
//                         value={selectedBulkDepartment} 
//                         onValueChange={setSelectedBulkDepartment}
//                       >
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select department" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           {getBulkUserDepartments().map((department) => (
//                             <SelectItem key={department.id} value={department.id}>
//                               {department.name}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     )}
                    
//                     {/* Debug info for bulk departments */}
//                     {selectedBulkAssignee && getBulkUserDepartments().length === 0 && (
//                       <p className="text-xs text-yellow-600">
//                         No departments found for this user or department data format issue.
//                       </p>
//                     )}
                    
//                     <div className="flex flex-col gap-2">
//                       <div className="flex gap-2">
//                         <Input
//                           ref={fileInputRef}
//                           type="file"
//                           accept=".xlsx,.csv,.xls"
//                           onChange={handleBulkFileSelect}
//                           className="flex-1"
//                           disabled={!selectedBulkAssignee || !selectedBulkDepartment || bulkUploadLoading}
//                         />
//                         <Button 
//                           onClick={handleBulkUpload}
//                           disabled={!isBulkFormValid || bulkUploadLoading}
//                           className="whitespace-nowrap"
//                         >
//                           {bulkUploadLoading ? 'Uploading...' : 'Upload File'}
//                         </Button>
//                       </div>
//                       {bulkUploadFile && (
//                         <div className="flex items-center justify-between">
//                           <p className="text-xs text-muted-foreground">
//                             Selected: {bulkUploadFile.name}
//                           </p>
//                           <Button
//                             type="button"
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => {
//                               setBulkUploadFile(null);
//                               if (fileInputRef.current) {
//                                 fileInputRef.current.value = '';
//                               }
//                               toast.info('File removed');
//                             }}
//                             className="text-red-500 hover:text-red-600 text-xs h-6"
//                           >
//                             Remove
//                           </Button>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="relative">
//                 <div className="absolute inset-0 flex items-center">
//                   <span className="w-full border-t" />
//                 </div>
//                 <div className="relative flex justify-center text-xs uppercase">
//                   <span className="bg-background px-2 text-muted-foreground">
//                     Or create single task
//                   </span>
//                 </div>
//               </div>
             
//               <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
//                 <div className="flex items-center justify-between">
//                   <h3 className="text-lg font-medium">Single Task Assignment</h3>
//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="sm"
//                     onClick={clearSingleTaskForm}
//                     disabled={!formData.title && !formData.assigned_to_employee_id}
//                     className="text-muted-foreground hover:text-foreground"
//                   >
//                     Clear
//                   </Button>
//                 </div>
                
//                 <div className="space-y-2">
//                   <Label htmlFor="title" className="text-sm font-medium">
//                     Task Title <span className="text-red-500">*</span>
//                   </Label>
//                   <div className="relative">
//                     <Input 
//                       id="title" 
//                       type="text" 
//                       value={formData.title} 
//                       onChange={(e) => handleTitleChange(e.target.value)}
//                       placeholder="Start typing to search previous tasks or enter a new title"
//                       className="transition-all duration-200 pr-10" 
//                       required 
//                       ref={titleInputRef}
//                     />
//                     {isSearching && (
//                       <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
//                       </div>
//                     )}
                    
//                     {showSearchResults && previousTasks.length > 0 && (
//                       <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
//                         {previousTasks.map((task) => (
//                           <div
//                             key={task._id}
//                             className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
//                             onClick={() => handleTaskSelect(task)}
//                           >
//                             <div className="font-medium">{task.title}</div>
//                             <div className="text-sm text-muted-foreground">
//                               Assigned to: {task.assigned_to_employee_id?.name || 'Unknown'}
//                             </div>
//                             <div className="text-xs text-muted-foreground">
//                               {new Date(task.createdAt).toLocaleDateString()}
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
                  
//                   {isPreviousTaskSelected && (
//                     <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md mt-2">
//                       <span className="text-xs text-blue-600">
//                         Loaded from previous task
//                       </span>
//                       <Button
//                         type="button"
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => {
//                           setFormData(prev => ({
//                             ...prev,
//                             description: '',
//                             assigned_to_employee_id: '',
//                             proof: [],
//                             TAT: 0,
//                             deadline: '',
//                             department_id: '',
//                           }));
//                           setIsPreviousTaskSelected(false);
//                           toast.info('Form partially cleared - title kept');
//                         }}
//                         className="text-blue-600 hover:text-blue-800 text-xs"
//                       >
//                         Clear Details
//                       </Button>
//                     </div>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="description" className="text-sm font-medium">
//                     Description
//                   </Label>
//                   <Textarea 
//                     id="description" 
//                     value={formData.description} 
//                     onChange={(e) => handleInputChange('description', e.target.value)} 
//                     placeholder="Provide detailed instructions for this task" 
//                     rows={4} 
//                     className="transition-all duration-200 resize-none" 
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium">
//                     Assignee <span className="text-red-500">*</span>
//                   </Label>
                
//                   <Select 
//                     value={formData.assigned_to_employee_id} 
//                     onValueChange={(value) => handleInputChange('assigned_to_employee_id', value)}
//                     required
//                     disabled={hierarchyLoading || sortedHierarchyUsers.length === 0}
//                   >
//                     <SelectTrigger className="transition-all duration-200">
//                       <SelectValue placeholder={
//                         hierarchyLoading
//                           ? "Loading assignees..." 
//                           : sortedHierarchyUsers.length === 0
//                             ? "No assignees available"
//                             : "Select a user"
//                       } />
//                     </SelectTrigger>
//                     {sortedHierarchyUsers.length > 0 && (
//                       <SelectContent>
//                         {sortedHierarchyUsers.map((user) => (
//                           <SelectItem 
//                             key={user.userId} 
//                             value={user.userId}
//                           >
//                             {user.name} ({user.email}) - {user.role} - Level {user.hierarchyLevel}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     )}
//                   </Select>
//                 </div>

//                 {formData.assigned_to_employee_id && getSelectedUserDepartments().length > 0 && (
//                   <div className="space-y-2">
//                     <Label className="text-sm font-medium">
//                       Department <span className="text-red-500">*</span>
//                     </Label>
//                     <Select 
//                       value={formData.department_id || ''} 
//                       onValueChange={(value) => handleInputChange('department_id', value)}
//                       required
//                     >
//                       <SelectTrigger className="transition-all duration-200">
//                         <SelectValue placeholder="Select a department" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {getSelectedUserDepartments().map((department) => (
//                           <SelectItem 
//                             key={department.id} 
//                             value={department.id}
//                           >
//                             {department.name}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 )}

//                 {/* Debug info for single task departments */}
//                 {formData.assigned_to_employee_id && getSelectedUserDepartments().length === 0 && (
//                   <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
//                     <p className="text-sm text-yellow-700">
//                       No departments found for this user. This may be due to:
//                     </p>
//                     <ul className="text-xs text-yellow-600 mt-1 list-disc list-inside">
//                       <li>User has no assigned departments</li>
//                       <li>Department data format issue</li>
//                       <li>Please check console for detailed error information</li>
//                     </ul>
//                   </div>
//                 )}

//                 {formData.assigned_to_employee_id && formData.department_id && (
//                   <div className="grid grid-cols-2 gap-4">
//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium">
//                         Selected Department
//                       </Label>
//                       <Input
//                         value={getSelectedUserInfo().department}
//                         readOnly
//                         className="transition-all duration-200"
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium">
//                         User Role
//                       </Label>
//                       <Input
//                         value={getSelectedUserInfo().role}
//                         readOnly
//                         className="transition-all duration-200"
//                       />
//                     </div>
//                   </div>
//                 )}

//                 <div className="space-y-2">
//                   <Label htmlFor="deadline" className="text-sm font-medium">
//                     Deadline <span className="text-red-500">*</span>
//                   </Label>
//                   <Input
//                     id="deadline"
//                     type="datetime-local"
//                     value={formData.deadline}
//                     onChange={(e) => handleInputChange('deadline', e.target.value)}
//                     className="transition-all duration-200"
//                     required
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="TAT" className="text-sm font-medium">
//                     Time to Approval (TAT) in minutes <span className="text-red-500">*</span>
//                   </Label>
//                   <div className="flex gap-2">
//                     <Select 
//                       value={formData.TAT.toString()}
//                       onValueChange={(value) => handleInputChange('TAT', value)}
//                     >
//                       <SelectTrigger className="flex-1 transition-all duration-200">
//                         <SelectValue placeholder="Select time" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {timeOptions.map((option) => (
//                           <SelectItem key={option.value} value={option.value}>
//                             {option.label}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                     <span className="text-sm text-muted-foreground self-center">or</span>
//                     <Input
//                       type="number"
//                       placeholder="Custom"
//                       value={formData.TAT}
//                       onChange={(e) => handleInputChange('TAT', e.target.value)}
//                       className="w-24 transition-all duration-200"
//                       min="1"
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-4">
//                   <Label className="text-sm font-medium">
//                     Required Proof Fields <span className="text-red-500">*</span>
//                   </Label>
                  
//                   {formData.proof.length > 0 ? (
//                     <div className="space-y-2">
//                       {formData.proof.map((proof, index) => (
//                         <div key={index} className="flex items-center gap-2">
//                           <div className="flex-1 grid grid-cols-2 gap-2">
//                             <div>
//                               <Label className="text-xs">Field Name</Label>
//                               <Input
//                                 value={proof.fieldName}
//                                 readOnly
//                                 className="text-sm"
//                               />
//                             </div>
//                             <div>
//                               <Label className="text-xs">Type</Label>
//                               <Input
//                                 value={proof.type}
//                                 readOnly
//                                 className="text-sm"
//                               />
//                             </div>
//                           </div>
//                           <Button
//                             type="button"
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => removeProofField(index)}
//                             className="text-red-500 hover:text-red-600"
//                           >
//                             Remove
//                           </Button>
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <p className="text-xs text-muted-foreground">
//                       No proof fields added yet
//                     </p>
//                   )}

//                   <div className="border-t pt-4">
//                     <div className="grid grid-cols-2 gap-2">
//                       <div>
//                         <Label className="text-xs">Field Name</Label>
//                         <Input
//                           value={newProofField.fieldName}
//                           onChange={(e) => handleProofFieldChange('fieldName', e.target.value)}
//                           placeholder="e.g. Screenshot, Report"
//                           className="text-sm"
//                         />
//                       </div>
//                       <div>
//                         <Label className="text-xs">Type</Label>
//                         <Select
//                           value={newProofField.type}
//                           onValueChange={(value: 'url' | 'file') => handleProofFieldChange('type', value)}
//                         >
//                           <SelectTrigger className="text-sm">
//                             <SelectValue placeholder="Select type" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             {proofTypes.map((type) => (
//                               <SelectItem key={type.value} value={type.value}>
//                                 {type.label}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                       </div>
//                     </div>
//                     <Button
//                       type="button"
//                       variant="outline"
//                       size="sm"
//                       onClick={addProofField}
//                       className="mt-2"
//                     >
//                       Add Proof Field
//                     </Button>
//                   </div>
//                 </div>

//                 <div className="pt-4">
//                   <Button 
//                     type="button"
//                     onClick={handleSubmit}
//                     className="w-full"
//                     disabled={!isFormValid || loading}
//                   >
//                     {loading ? 'Processing...' : 'Assign Task'}
//                   </Button>
//                 </div>
                
//                 {!isFormValid && (
//                   <p className="text-xs text-muted-foreground text-center">
//                     Please fill in all required fields to assign the task
//                   </p>
//                 )}
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default TaskAssignmentForm;
// "use client"
// import React, { useState, useEffect, useMemo, useRef } from 'react';
// import { useAppDispatch, useAppSelector } from '@/store/hooks';
// import { 
//   createTaskAssignment, 
//   ProofRequirement, 
//   bulkTaskAssignments,
//   fetchPreviousTasks,
//   selectPreviousTasks
// } from '@/features/taskAssignments/taskAssignmentSlice';

// import {
//   fetchUserHierarchy,
//   selectHierarchyUsers,
//   selectHierarchyLoading,
//   selectUsersError
// } from '@/features/user/userSlice';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { toast } from 'sonner';

// interface ProofField {
//   fieldName: string;
//   type: 'url' | 'file';
//   url?: string; 
// }

// interface CreateTaskFormData {
//   title: string;
//   description: string;
//   assigned_to_employee_id: string;
//   proof: ProofRequirement[];
//   TAT: number;
//   deadline: string;
//   department_id?: string;
// }

// interface BulkUploadData {
//   assigned_to_employee_id: string;
//   department_id?: string;
//   taskFile: File;
// }

// const TaskAssignmentForm = () => {
//   const dispatch = useAppDispatch();
  
//   const hierarchyUsers = useAppSelector(selectHierarchyUsers);
//   const hierarchyLoading = useAppSelector(selectHierarchyLoading);
//   const usersError = useAppSelector(selectUsersError);
//   const { loading, error: taskError } = useAppSelector((state) => state.taskAssignments);
//   const { user } = useAppSelector((state) => state.auth);
//   const previousTasks = useAppSelector(selectPreviousTasks);

//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const titleInputRef = useRef<HTMLInputElement>(null);
//   const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
//   const [selectedBulkAssignee, setSelectedBulkAssignee] = useState('');
//   const [selectedBulkDepartment, setSelectedBulkDepartment] = useState('');
//   const [isSearching, setIsSearching] = useState(false);
//   const [showSearchResults, setShowSearchResults] = useState(false);
//   const [isPreviousTaskSelected, setIsPreviousTaskSelected] = useState(false);

//   useEffect(() => {
//     dispatch(fetchUserHierarchy());
//   }, [dispatch]);

//   useEffect(() => {
//     if (usersError) {
//       toast.error('Failed to load assignees', {
//         description: usersError
//       });
//     }
//   }, [usersError]);

//   const sortedHierarchyUsers = useMemo(() => {
//     if (!hierarchyUsers || hierarchyUsers.length === 0) return [];
    
//     return [...hierarchyUsers].sort((a, b) => a.hierarchyLevel - b.hierarchyLevel);
//   }, [hierarchyUsers]);

//   const [formData, setFormData] = useState<CreateTaskFormData>({
//     title: '',
//     description: '',
//     assigned_to_employee_id: '',
//     proof: [],
//     TAT: 0,
//     deadline: '',
//   });

//   const [newProofField, setNewProofField] = useState<ProofField>({
//     fieldName: '',
//     type: 'url'
//   });

//   const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);

//   const timeOptions = [
//     { value: '15', label: '15 minutes' },
//     { value: '30', label: '30 minutes' },
//     { value: '60', label: '60 minutes' },
//     { value: '120', label: '120 minutes' },
//     { value: '240', label: '240 minutes' },
//     { value: '480', label: '480 minutes' },
//     { value: '1440', label: '1440 minutes' }
//   ];

//   const proofTypes = [
//     { value: 'url', label: 'URL' },
//     { value: 'file', label: 'File' }
//   ];

// const getSelectedUserDepartments = () => {
//   if (!formData.assigned_to_employee_id) return [];

//   const selectedUser = hierarchyUsers.find(user => user.userId === formData.assigned_to_employee_id);
//   if (!selectedUser || !selectedUser.departments) return [];

//   // Handle both string and array cases
//   if (typeof selectedUser.departments === 'string') {
//     try {
//       const parsedDepartments = JSON.parse(selectedUser.departments);
//       return Array.isArray(parsedDepartments) 
//         ? parsedDepartments.map((dept: any) => ({
//             id: dept.id || dept._id || '',
//             name: dept.name || ''
//           }))
//         : [];
//     } catch {
//       return [];
//     }
//   }

//   // If it's already an array
//   return (selectedUser.departments as any[]).map((dept: any) => ({
//     id: dept.id || dept._id || '',
//     name: dept.name || ''
//   }));
// };

// const getBulkUserDepartments = () => {
//   if (!selectedBulkAssignee) return [];
//   const selectedUser = hierarchyUsers.find(user => user.userId === selectedBulkAssignee);
//   if (!selectedUser || !selectedUser.departments) return [];

//   // Handle both string and array cases
//   if (typeof selectedUser.departments === 'string') {
//     // If departments is a string, try to parse it or return empty array
//     try {
//       const parsedDepartments = JSON.parse(selectedUser.departments);
//       return Array.isArray(parsedDepartments) 
//         ? parsedDepartments.map((dept: any) => ({
//             id: dept.id || dept._id || '',
//             name: dept.name || ''
//           }))
//         : [];
//     } catch {
//       return [];
//     }
//   }

//   // If it's already an array
//   return (selectedUser.departments as any[]).map((dept: any) => ({
//     id: dept.id || dept._id || '',
//     name: dept.name || ''
//   }));
// };

//   const clearBulkUploadForm = () => {
//     setSelectedBulkAssignee('');
//     setSelectedBulkDepartment('');
//     setBulkUploadFile(null);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }
//     toast.success('Bulk upload form cleared');
//   };

//   const clearSingleTaskForm = () => {
//     setFormData({
//       title: '',
//       description: '',
//       assigned_to_employee_id: '',
//       proof: [],
//       TAT: 0,
//       deadline: '',
//     });
//     setNewProofField({
//       fieldName: '',
//       type: 'url'
//     });
//     setIsPreviousTaskSelected(false);
//     setShowSearchResults(false);
//     toast.success('Task form cleared');
//   };

//   const handleTitleChange = async (value: string) => {
//     setFormData(prev => ({
//       ...prev,
//       title: value
//     }));

//     if (isPreviousTaskSelected && value !== formData.title) {
//       setIsPreviousTaskSelected(false);
//       setFormData({
//         title: value,
//         description: '',
//         assigned_to_employee_id: '',
//         proof: [],
//         TAT: 0,
//         deadline: '',
//       });
//     }

//     if (value.trim().length > 2) {
//       setIsSearching(true);
//       try {
//         await dispatch(fetchPreviousTasks(value)).unwrap();
//         setShowSearchResults(true);
//       } catch (error) {
//         console.error('Failed to search previous tasks');
//       } finally {
//         setIsSearching(false);
//       }
//     } else {
//       setShowSearchResults(false);
//     }
//   };

//   const handleTaskSelect = (task: any) => {
//     setFormData({
//       title: task.title,
//       description: task.description || '',
//       assigned_to_employee_id: task.assigned_to_employee_id?._id || '',
//       proof: task.proof || [],
//       TAT: task.TAT || 0,
//       deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
//       department_id: task.department_id || '', 
//     });
    
//     setShowSearchResults(false);
//     setIsPreviousTaskSelected(true);
//     toast.success('Previous task loaded! You can edit details before submitting.');
//   };

//   const handleInputChange = (field: keyof CreateTaskFormData, value: string | number | ProofRequirement[]) => {
//     if (field === 'assigned_to_employee_id') {
//       setFormData(prev => ({
//         ...prev,
//         [field]: value as string, 
//         department_id: ''
//       }));
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         [field]: value
//       }));
//     }
//   };

//   const handleProofFieldChange = (field: keyof ProofField, value: string) => {
//     setNewProofField(prev => ({
//       ...prev,
//       [field]: value
//     }));
//   };

//   const addProofField = () => {
//     if (!newProofField.fieldName.trim()) {
//       toast.error('Please enter a field name for the proof');
//       return;
//     }

//     setFormData(prev => ({
//       ...prev,
//       proof: [...prev.proof, newProofField]
//     }));

//     setNewProofField({
//       fieldName: '',
//       type: 'url'
//     });
//   };

//   const removeProofField = (index: number) => {
//     setFormData(prev => {
//       const newProof = [...prev.proof];
//       newProof.splice(index, 1);
//       return {
//         ...prev,
//         proof: newProof
//       };
//     });
//   };

//   const handleSubmit = async () => {
//     try {
//       if (!formData.title.trim()) {
//         throw new Error('Please enter a task title');
//       }
//       if (!formData.assigned_to_employee_id) {
//         throw new Error('Please select an assignee');
//       }
//       if (!formData.department_id) {
//         throw new Error('Please select a department');
//       }
//       if (!formData.TAT) {
//         throw new Error('Please select time to approval');
//       }
//       if (!formData.deadline) {
//         throw new Error('Please set a deadline');
//       }
//       if (formData.proof.length === 0) {
//         throw new Error('Please add at least one proof requirement');
//       }

//       const payload = {
//         ...formData,
//         TAT: Number(formData.TAT),
//         proof: formData.proof,
//         department_id: formData.department_id,
//       };

//       await dispatch(createTaskAssignment(payload)).unwrap();

//       toast.success('Task assigned successfully!', {
//         description: `"${formData.title}" has been assigned successfully.`
//       });

//       clearSingleTaskForm();

//     } catch (error: any) {
//       toast.error('Failed to assign task', {
//         description: error.message || 'Please try again.'
//       });
//     }
//   };

//   const downloadTemplate = () => {
//     const templateData = [
//       {
//         title: 'Prepare Sales Report',
//         description: 'Compile the monthly sales report with charts',
//         proof: JSON.stringify([{ fieldName: 'Github', type: 'url' }]),
//         TAT: 60,
//         deadline: '2025-08-22T18:30',
//         createdAt: '2025-08-22T18:30',
//         updatedAt: '2025-08-22T18:30'
//       },
//       {
//         title: 'Client Presentation',
//         description: 'Prepare slides for upcoming client meeting',
//         proof: JSON.stringify([{ fieldName: 'Drive', type: 'url' }]),
//         TAT: 120,
//         deadline: '2025-08-22T18:30',
//         createdAt: '2025-08-22T18:30',
//         updatedAt: '2025-08-22T18:30'
//       },
//       {
//         title: 'Website Bug Fix',
//         description: 'Resolve UI issues on homepage banner',
//         proof: JSON.stringify([{ fieldName: 'Image', type: 'file' }]),
//         TAT: 180,
//         deadline: '2025-08-22T18:30',

//       }
//     ];

//     const headers = ['title', 'description', 'proof', 'TAT', 'deadline'];
//     const csvContent = [
//       headers.join(','),
//       ...templateData.map(row => 
//         headers.map(header => {
//           const value = row[header as keyof typeof row];
//           const escapedValue = String(value).replace(/"/g, '""');
//           return String(value).includes(',') || String(value).includes('"') ? `"${escapedValue}"` : escapedValue;
//         }).join(',')
//       )
//     ].join('\n');

//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.setAttribute('href', url);
//     link.setAttribute('download', 'bulk_task_template.csv');
//     link.style.visibility = 'hidden';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
    
//     toast.success('Template downloaded successfully!', {
//       description: 'You can now fill in your task details and upload the file.'
//     });
//   };

//   const handleBulkFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const files = event.target.files;
//     if (!files || files.length === 0) return;

//     const file = files[0];
    
//     const validExtensions = ['.xlsx', '.csv', '.xls'];
//     const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
//     if (!validExtensions.includes(fileExtension)) {
//       toast.error('Invalid file type', {
//         description: 'Please select an Excel (.xlsx, .xls) or CSV file.'
//       });
//       if (fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//       return;
//     }

//     if (file.size > 10 * 1024 * 1024) {
//       toast.error('File too large', {
//         description: 'Please select a file smaller than 10MB.'
//       });
//       if (fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//       return;
//     }

//     if (!selectedBulkAssignee) {
//       toast.error('Assignee required', {
//         description: 'Please select an assignee for bulk upload first.'
//       });
//       if (fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//       return;
//     }

//     if (!selectedBulkDepartment) {
//       toast.error('Department required', {
//         description: 'Please select a department for bulk upload first.'
//       });
//       if (fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//       return;
//     }

//     setBulkUploadFile(file);
//     toast.success('File selected', {
//       description: `${file.name} is ready for upload.`
//     });
//   };

//   const handleBulkUpload = async () => {
//     if (!bulkUploadFile) {
//       toast.error('No file selected', {
//         description: 'Please select a file first.'
//       });
//       return;
//     }

//     if (!selectedBulkAssignee) {
//       toast.error('No assignee selected', {
//         description: 'Please select an assignee for bulk upload.'
//       });
//       return;
//     }

//     if (!selectedBulkDepartment) {
//       toast.error('No department selected', {
//         description: 'Please select a department for bulk upload.'
//       });
//       return;
//     }

//     setBulkUploadLoading(true);
    
//     const loadingToast = toast.loading('Uploading bulk tasks...');
    
//     try {
//       const bulkData: BulkUploadData = {
//         assigned_to_employee_id: selectedBulkAssignee,
//         department_id: selectedBulkDepartment,
//         taskFile: bulkUploadFile
//       };

//       const result = await dispatch(bulkTaskAssignments(bulkData)).unwrap();
      
//       toast.dismiss(loadingToast);
//       toast.success('Bulk tasks uploaded successfully!', {
//         description: `${result.length || 'Multiple'} tasks have been assigned successfully.`
//       });

//       clearBulkUploadForm();
      
//     } catch (error: any) {
//       toast.dismiss(loadingToast);
//       toast.error('Failed to upload bulk tasks', {
//         description: error.message || 'Please check your file format and try again.'
//       });
//     } finally {
//       setBulkUploadLoading(false);
//     }
//   };

//   const isFormValid = !!(formData.title.trim() && 
//                      formData.assigned_to_employee_id && 
//                      formData.department_id &&
//                      formData.TAT && 
//                      formData.deadline &&
//                      formData.proof.length > 0);

//   const isBulkFormValid = !!(selectedBulkAssignee && selectedBulkDepartment && bulkUploadFile);

//   // const getSelectedUserInfo = () => {
//   //   if (!formData.assigned_to_employee_id) return { department: '', role: '' };
//   //   const selectedUser = hierarchyUsers.find(user => user.userId === formData.assigned_to_employee_id);
//   //   const selectedDepartmentName =
//   //     selectedUser?.departmentId && selectedUser.departmentId === formData.department_id
//   //       ? selectedUser.departmentId
//   //       : undefined;
//   //   return {
//   //     department: selectedDepartmentName || 'No department selected',
//   //     role: selectedUser?.role || ''
//   //   };
//   // };

// const getSelectedUserInfo = () => {
//   if (!formData.assigned_to_employee_id) return { department: '', role: '' };
//   const selectedUser = hierarchyUsers.find(
//     user => user.userId === formData.assigned_to_employee_id
//   );
//   if (!selectedUser) return { department: '', role: '' };
//   // IMPORTANT: Use _id for matching as it's the actual id in the department object
//   const selectedDepartment = selectedUser.departments?.find(
//     dep => dep._id === formData.department_id
//   );
//   return {
//     department: selectedDepartment ? selectedDepartment.name : 'No department selected',
//     role: selectedUser.role || ''
//   };
// };


//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-[#1e2939] py-8 px-4">
//       <div className="max-w-2xl mx-auto">
//         <Card className="shadow-sm">
//           <CardHeader className="pb-6">
//             <CardTitle className="text-2xl">Task Assignment</CardTitle>
//             <CardDescription>
//               Assign tasks to your team members efficiently
//             </CardDescription>
//           </CardHeader>
          
//           <CardContent>
//             <div className="space-y-6">
//               <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
//                 <div className="flex items-center justify-between">
//                   <h3 className="text-lg font-medium">Bulk Task Upload</h3>
//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="sm"
//                     onClick={clearBulkUploadForm}
//                     disabled={!selectedBulkAssignee && !selectedBulkDepartment && !bulkUploadFile}
//                     className="text-muted-foreground hover:text-foreground"
//                   >
//                     Clear
//                   </Button>
//                 </div>
//                 <p className="text-sm text-muted-foreground">
//                   Upload multiple tasks at once using an Excel template
//                 </p>
                
//                 <div className="flex flex-col gap-4 sm:flex-row">
//                   <Button 
//                     type="button" 
//                     variant="outline" 
//                     onClick={downloadTemplate}
//                     className="flex-1"
//                   >
//                     Download Template
//                   </Button>
                  
//                   <div className="flex-1 flex flex-col gap-2">
//                     <Select 
//                       value={selectedBulkAssignee} 
//                       onValueChange={(value) => {
//                         setSelectedBulkAssignee(value);
//                         setSelectedBulkDepartment(''); 
//                       }}
//                       disabled={hierarchyLoading || sortedHierarchyUsers.length === 0}
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select bulk assignee" />
//                       </SelectTrigger>
//                       {sortedHierarchyUsers.length > 0 && (
//                         <SelectContent>
//                           {sortedHierarchyUsers.map((user) => (
//                             <SelectItem key={user.userId} value={user.userId}>
//                               {user.name} ({user.email}) - {user.role} - Level {user.hierarchyLevel}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       )}
//                     </Select>

//                     {selectedBulkAssignee && getBulkUserDepartments().length > 0 && (
//                       <Select 
//                         value={selectedBulkDepartment} 
//                         onValueChange={setSelectedBulkDepartment}
//                       >
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select department" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           {getBulkUserDepartments().map((department) => (
//                             <SelectItem key={department.id} value={department.id}>
//                               {department.name}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     )}
                    
//                     <div className="flex flex-col gap-2">
//                       <div className="flex gap-2">
//                         <Input
//                           ref={fileInputRef}
//                           type="file"
//                           accept=".xlsx,.csv,.xls"
//                           onChange={handleBulkFileSelect}
//                           className="flex-1"
//                           disabled={!selectedBulkAssignee || !selectedBulkDepartment || bulkUploadLoading}
//                         />
//                         <Button 
//                           onClick={handleBulkUpload}
//                           disabled={!isBulkFormValid || bulkUploadLoading}
//                           className="whitespace-nowrap"
//                         >
//                           {bulkUploadLoading ? 'Uploading...' : 'Upload File'}
//                         </Button>
//                       </div>
//                       {bulkUploadFile && (
//                         <div className="flex items-center justify-between">
//                           <p className="text-xs text-muted-foreground">
//                             Selected: {bulkUploadFile.name}
//                           </p>
//                           <Button
//                             type="button"
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => {
//                               setBulkUploadFile(null);
//                               if (fileInputRef.current) {
//                                 fileInputRef.current.value = '';
//                               }
//                               toast.info('File removed');
//                             }}
//                             className="text-red-500 hover:text-red-600 text-xs h-6"
//                           >
//                             Remove
//                           </Button>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="relative">
//                 <div className="absolute inset-0 flex items-center">
//                   <span className="w-full border-t" />
//                 </div>
//                 <div className="relative flex justify-center text-xs uppercase">
//                   <span className="bg-background px-2 text-muted-foreground">
//                     Or create single task
//                   </span>
//                 </div>
//               </div>
             
//               <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
//                 <div className="flex items-center justify-between">
//                   <h3 className="text-lg font-medium">Single Task Assignment</h3>
//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="sm"
//                     onClick={clearSingleTaskForm}
//                     disabled={!formData.title && !formData.assigned_to_employee_id}
//                     className="text-muted-foreground hover:text-foreground"
//                   >
//                     Clear
//                   </Button>
//                 </div>
                
//                 <div className="space-y-2">
//                   <Label htmlFor="title" className="text-sm font-medium">
//                     Task Title <span className="text-red-500">*</span>
//                   </Label>
//                   <div className="relative">
//                     <Input 
//                       id="title" 
//                       type="text" 
//                       value={formData.title} 
//                       onChange={(e) => handleTitleChange(e.target.value)}
//                       placeholder="Start typing to search previous tasks or enter a new title"
//                       className="transition-all duration-200 pr-10" 
//                       required 
//                       ref={titleInputRef}
//                     />
//                     {isSearching && (
//                       <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
//                       </div>
//                     )}
                    
//                     {showSearchResults && previousTasks.length > 0 && (
//                       <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
//                         {previousTasks.map((task) => (
//                           <div
//                             key={task._id}
//                             className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
//                             onClick={() => handleTaskSelect(task)}
//                           >
//                             <div className="font-medium">{task.title}</div>
//                             <div className="text-sm text-muted-foreground">
//                               Assigned to: {task.assigned_to_employee_id?.name || 'Unknown'}
//                             </div>
//                             <div className="text-xs text-muted-foreground">
//                               {new Date(task.createdAt).toLocaleDateString()}
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
                  
//                   {isPreviousTaskSelected && (
//                     <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md mt-2">
//                       <span className="text-xs text-blue-600">
//                         Loaded from previous task
//                       </span>
//                       <Button
//                         type="button"
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => {
//                           setFormData(prev => ({
//                             ...prev,
//                             description: '',
//                             assigned_to_employee_id: '',
//                             proof: [],
//                             TAT: 0,
//                             deadline: '',
//                             department_id: '',
//                           }));
//                           setIsPreviousTaskSelected(false);
//                           toast.info('Form partially cleared - title kept');
//                         }}
//                         className="text-blue-600 hover:text-blue-800 text-xs"
//                       >
//                         Clear Details
//                       </Button>
//                     </div>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="description" className="text-sm font-medium">
//                     Description
//                   </Label>
//                   <Textarea 
//                     id="description" 
//                     value={formData.description} 
//                     onChange={(e) => handleInputChange('description', e.target.value)} 
//                     placeholder="Provide detailed instructions for this task" 
//                     rows={4} 
//                     className="transition-all duration-200 resize-none" 
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium">
//                     Assignee <span className="text-red-500">*</span>
//                   </Label>
                
//                   <Select 
//                     value={formData.assigned_to_employee_id} 
//                     onValueChange={(value) => handleInputChange('assigned_to_employee_id', value)}
//                     required
//                     disabled={hierarchyLoading || sortedHierarchyUsers.length === 0}
//                   >
//                     <SelectTrigger className="transition-all duration-200">
//                       <SelectValue placeholder={
//                         hierarchyLoading
//                           ? "Loading assignees..." 
//                           : sortedHierarchyUsers.length === 0
//                             ? "No assignees available"
//                             : "Select a user"
//                       } />
//                     </SelectTrigger>
//                     {sortedHierarchyUsers.length > 0 && (
//                       <SelectContent>
//                         {sortedHierarchyUsers.map((user) => (
//                           <SelectItem 
//                             key={user.userId} 
//                             value={user.userId}
//                           >
//                             {user.name} ({user.email}) - {user.role} - Level {user.hierarchyLevel}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     )}
//                   </Select>
//                 </div>

//                 {formData.assigned_to_employee_id && getSelectedUserDepartments().length > 0 && (
//                   <div className="space-y-2">
//                     <Label className="text-sm font-medium">
//                       Department <span className="text-red-500">*</span>
//                     </Label>
//                     <Select 
//                       value={formData.department_id || ''} 
//                       onValueChange={(value) => handleInputChange('department_id', value)}
//                       required
//                     >
//                       <SelectTrigger className="transition-all duration-200">
//                         <SelectValue placeholder="Select a department" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {getSelectedUserDepartments().map((department) => (
//                           <SelectItem 
//                             key={department.id} 
//                             value={department.id}
//                           >
//                             {department.name}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 )}

//                 {formData.assigned_to_employee_id && formData.department_id && (
//                   <div className="grid grid-cols-2 gap-4">
//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium">
//                         Selected Department
//                       </Label>
//                       <Input
//                         value={getSelectedUserInfo().department}
//                         readOnly
//                         className="transition-all duration-200"
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium">
//                         User Role
//                       </Label>
//                       <Input
//                         value={getSelectedUserInfo().role}
//                         readOnly
//                         className="transition-all duration-200"
//                       />
//                     </div>
//                   </div>
//                 )}

//                 <div className="space-y-2">
//                   <Label htmlFor="deadline" className="text-sm font-medium">
//                     Deadline <span className="text-red-500">*</span>
//                   </Label>
//                   <Input
//                     id="deadline"
//                     type="datetime-local"
//                     value={formData.deadline}
//                     onChange={(e) => handleInputChange('deadline', e.target.value)}
//                     className="transition-all duration-200"
//                     required
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="TAT" className="text-sm font-medium">
//                     Time to Approval (TAT) in minutes <span className="text-red-500">*</span>
//                   </Label>
//                   <div className="flex gap-2">
//                     <Select 
//                       value={formData.TAT.toString()}
//                       onValueChange={(value) => handleInputChange('TAT', value)}
//                     >
//                       <SelectTrigger className="flex-1 transition-all duration-200">
//                         <SelectValue placeholder="Select time" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {timeOptions.map((option) => (
//                           <SelectItem key={option.value} value={option.value}>
//                             {option.label}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                     <span className="text-sm text-muted-foreground self-center">or</span>
//                     <Input
//                       type="number"
//                       placeholder="Custom"
//                       value={formData.TAT}
//                       onChange={(e) => handleInputChange('TAT', e.target.value)}
//                       className="w-24 transition-all duration-200"
//                       min="1"
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-4">
//                   <Label className="text-sm font-medium">
//                     Required Proof Fields <span className="text-red-500">*</span>
//                   </Label>
                  
//                   {formData.proof.length > 0 ? (
//                     <div className="space-y-2">
//                       {formData.proof.map((proof, index) => (
//                         <div key={index} className="flex items-center gap-2">
//                           <div className="flex-1 grid grid-cols-2 gap-2">
//                             <div>
//                               <Label className="text-xs">Field Name</Label>
//                               <Input
//                                 value={proof.fieldName}
//                                 readOnly
//                                 className="text-sm"
//                               />
//                             </div>
//                             <div>
//                               <Label className="text-xs">Type</Label>
//                               <Input
//                                 value={proof.type}
//                                 readOnly
//                                 className="text-sm"
//                               />
//                             </div>
//                           </div>
//                           <Button
//                             type="button"
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => removeProofField(index)}
//                             className="text-red-500 hover:text-red-600"
//                           >
//                             Remove
//                           </Button>
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <p className="text-xs text-muted-foreground">
//                       No proof fields added yet
//                     </p>
//                   )}

//                   <div className="border-t pt-4">
//                     <div className="grid grid-cols-2 gap-2">
//                       <div>
//                         <Label className="text-xs">Field Name</Label>
//                         <Input
//                           value={newProofField.fieldName}
//                           onChange={(e) => handleProofFieldChange('fieldName', e.target.value)}
//                           placeholder="e.g. Screenshot, Report"
//                           className="text-sm"
//                         />
//                       </div>
//                       <div>
//                         <Label className="text-xs">Type</Label>
//                         <Select
//                           value={newProofField.type}
//                           onValueChange={(value: 'url' | 'file') => handleProofFieldChange('type', value)}
//                         >
//                           <SelectTrigger className="text-sm">
//                             <SelectValue placeholder="Select type" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             {proofTypes.map((type) => (
//                               <SelectItem key={type.value} value={type.value}>
//                                 {type.label}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                       </div>
//                     </div>
//                     <Button
//                       type="button"
//                       variant="outline"
//                       size="sm"
//                       onClick={addProofField}
//                       className="mt-2"
//                     >
//                       Add Proof Field
//                     </Button>
//                   </div>
//                 </div>

//                 <div className="pt-4">
//                   <Button 
//                     type="button"
//                     onClick={handleSubmit}
//                     className="w-full"
//                     disabled={!isFormValid || loading}
//                   >
//                     {loading ? 'Processing...' : 'Assign Task'}
//                   </Button>
//                 </div>
                
//                 {!isFormValid && (
//                   <p className="text-xs text-muted-foreground text-center">
//                     Please fill in all required fields to assign the task
//                   </p>
//                 )}
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default TaskAssignmentForm;