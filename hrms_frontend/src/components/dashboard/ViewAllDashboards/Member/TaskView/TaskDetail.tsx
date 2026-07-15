"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchTaskAssignmentById,
  selectCurrentTaskAssignment,
  selectTaskAssignmentLoading,
  selectTaskAssignmentError,
  clearCurrentAssignment,
  upsertTask,
} from "@/features/taskAssignments/taskAssignmentSlice";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import useSocket from "@/hooks/useSocket";

const TaskDetail = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const task = useAppSelector(selectCurrentTaskAssignment);
  const loading = useAppSelector(selectTaskAssignmentLoading);
  const error = useAppSelector(selectTaskAssignmentError);

  const { on: socketOn, joinTaskRoom } = useSocket();

  useEffect(() => {
    if (id) {
      dispatch(fetchTaskAssignmentById(id as string));
      joinTaskRoom(id as string);
    }

    return () => {
      dispatch(clearCurrentAssignment());
    };
  }, [id, dispatch, joinTaskRoom]);

  useEffect(() => {
    const offTaskUpdated = socketOn("task_updated", (payload: any) => {
      if (payload?.data?._id === id) {
        dispatch(upsertTask(payload.data));
      } else if (payload?.task?._id === id) {
        dispatch(upsertTask(payload.task));
      } else {
        // Refresh the task if we can't identify the specific task
        dispatch(fetchTaskAssignmentById(id as string));
      }
    });

    const offTaskDeleted = socketOn("task_deleted", (payload: any) => {
      if (payload?.taskId === id || payload?.data?.taskId === id) {
        router.push("/tasks");
      }
    });

    const offStuckRequestCreated = socketOn(
      "stuck_request_created",
      (payload: any) => {
        if (
          payload?.data?.assignmentId === id ||
          payload?.assignmentId === id
        ) {
          dispatch(fetchTaskAssignmentById(id as string));
        }
      }
    );

    const offStuckRequestResponse = socketOn(
      "stuck_request_response",
      (payload: any) => {
        if (
          payload?.data?.assignmentId === id ||
          payload?.assignmentId === id
        ) {
          dispatch(fetchTaskAssignmentById(id as string));
        }
      }
    );

    const offTaskStatusChanged = socketOn(
      "task_status_changed",
      (payload: any) => {
        if (
          payload?.data?.assignmentId === id ||
          payload?.assignmentId === id
        ) {
          dispatch(fetchTaskAssignmentById(id as string));
        }
      }
    );

    return () => {
      offTaskUpdated?.();
      offTaskDeleted?.();
      offStuckRequestCreated?.();
      offStuckRequestResponse?.();
      offTaskStatusChanged?.();
    };
  }, [socketOn, dispatch, id, router]);

  const getStatusBadgeVariant = (
    status: string
  ): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case "Completed":
        return "secondary";
      case "Overdue":
        return "destructive";
      case "Pending":
        return "outline";
      default:
        return "default";
    }
  };

  const getTimerStatusBadgeVariant = (
    status: string
  ): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case "Done":
        return "secondary";
      case "Stuck":
        return "destructive";
      case "InProgress":
        return "outline";
      case "Todo":
        return "outline";
      default:
        return "default";
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Completed":
      case "Done":
        return "bg-green-100 text-green-800";
      case "Overdue":
      case "Stuck":
        return "bg-red-100 text-red-800";
      case "Pending":
      case "InProgress":
        return "bg-yellow-100 text-yellow-800";
      case "Todo":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP");
    } catch {
      return "Invalid Date";
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPPp");
    } catch {
      return "Invalid Date";
    }
  };

  const handleMarkInProgress = () => {
    // Add your mark as in progress logic here
    console.log("Mark as In Progress clicked");
  };

  const handleSubmitProof = () => {
    // Add your submit proof logic here
    console.log("Submit Proof clicked");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2
          className="h-8 w-8 animate-spin"
          aria-label="Loading task details"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        Error loading task: {error}
        <Button asChild className="mt-4 ml-4">
          <Link href="/tasks">Back to Tasks</Link>
        </Button>
      </div>
    );
  }

  if (!task || !id) {
    return (
      <div className="text-center p-4">
        <p>Task not found</p>
        <Button asChild className="mt-4">
          <Link href="/tasks">Back to Tasks</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button asChild variant="outline" className="mb-6">
        <Link href="/tasks">&larr; Back to Tasks</Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{task.title}</CardTitle>
              <CardDescription className="mt-2">
                Assigned on: {formatDate(task.createdAt)}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge
                variant={getStatusBadgeVariant(task.status)}
                className={getStatusClass(task.status)}
              >
                {task.status}
              </Badge>
              <Badge
                variant={getTimerStatusBadgeVariant(task.timer_status)}
                className={getStatusClass(task.timer_status)}
              >
                {task.timer_status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Description</h3>
            <p className="text-gray-700">
              {task.description || "No description available"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Deadline</h3>
              <p>{formatDateTime(task.deadline)}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Time Allocated</h3>
              <p>
                {task.TAT} {task.TAT === 1 ? "min" : "mins"}
              </p>
            </div>
          </div>

          {task.timerStartTime && (
            <div>
              <h3 className="font-medium mb-2">Timer Started</h3>
              <p>{formatDateTime(task.timerStartTime)}</p>
            </div>
          )}

          {task.proof && task.proof.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Proof Requirements</h3>
              <ul className="list-disc pl-5 space-y-1">
                {task.proof.map((proof, index) => (
                  <li key={index} className="text-sm">
                    {proof.fieldName || `Proof ${index + 1}`}: {proof.type}
                    {proof && <span className="text-red-500 ml-1">*</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {task.previous_TAT && task.previous_TAT.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Previous Time Adjustments</h3>
              <ul className="list-disc pl-5 space-y-1">
                {task.previous_TAT.map((tat: number, index: number) => (
                  <li key={index} className="text-sm">
                    {tat} {tat === 1 ? "min" : "mins"}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleMarkInProgress}
            disabled={
              task.timer_status === "InProgress" || task.timer_status === "Done"
            }
            aria-label="Mark task as in progress"
          >
            {task.timer_status === "InProgress"
              ? "In Progress"
              : "Mark as In Progress"}
          </Button>
          <Button
            onClick={handleSubmitProof}
            disabled={task.timer_status !== "InProgress"}
            aria-label="Submit proof for task"
          >
            Submit Proof
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TaskDetail;
// "use client";

// import { useEffect } from "react";
// import Link from "next/link";
// import { useParams, useRouter } from "next/navigation";
// import { useAppDispatch, useAppSelector } from "@/store/hooks";
// import {
//   fetchTaskAssignmentById,
//   selectCurrentTaskAssignment,
//   selectTaskAssignmentLoading,
//   selectTaskAssignmentError,
//   clearCurrentAssignment,
//   upsertTask,
// } from "@/features/taskAssignments/taskAssignmentSlice";
// import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Loader2 } from "lucide-react";
// import { format } from "date-fns";
// import useSocket from "@/hooks/useSocket";

// const TaskDetail = () => {
//   const dispatch = useAppDispatch();
//   const router = useRouter();
//   const params = useParams<{ id: string }>();
//   const id = params?.id;
//   const task = useAppSelector(selectCurrentTaskAssignment);
//   const loading = useAppSelector(selectTaskAssignmentLoading);
//   const error = useAppSelector(selectTaskAssignmentError);

//   const { on: socketOn, joinTaskRoom } = useSocket();

//   useEffect(() => {
//     if (id) {
//       dispatch(fetchTaskAssignmentById(id as string));
//       joinTaskRoom(id as string);
//     }

//     return () => {
//       dispatch(clearCurrentAssignment());
//     };
//   }, [id, dispatch, joinTaskRoom]);

//   useEffect(() => {
//     const offTaskUpdated = socketOn("task_updated", (payload: any) => {
//       if (payload?.data?._id === id) {
//         dispatch(upsertTask(payload.data));
//       } else if (payload?.task?._id === id) {
//         dispatch(upsertTask(payload.task));
//       }
//     });

//     const offTaskDeleted = socketOn("task_deleted", (payload: any) => {
//       if (payload?.taskId === id) {
//         router.push("/tasks");
//       }
//     });

//     return () => {
//       offTaskUpdated?.();
//       offTaskDeleted?.();
//     };
//   }, [socketOn, dispatch, id, router]);

//   const getStatusBadgeVariant = (
//     status: string
//   ): "default" | "secondary" | "outline" | "destructive" => {
//     switch (status) {
//       case "Completed":
//         return "secondary";
//       case "Overdue":
//         return "destructive";
//       case "Pending":
//         return "outline";
//       default:
//         return "default";
//     }
//   };

//   const getTimerStatusBadgeVariant = (
//     status: string
//   ): "default" | "secondary" | "outline" | "destructive" => {
//     switch (status) {
//       case "Done":
//         return "secondary";
//       case "Stuck":
//         return "destructive";
//       case "InProgress":
//         return "outline";
//       case "Todo":
//         return "outline";
//       default:
//         return "default";
//     }
//   };

//   const getStatusClass = (status: string) => {
//     switch (status) {
//       case "Completed":
//       case "Done":
//         return "bg-green-100 text-green-800";
//       case "Overdue":
//       case "Stuck":
//         return "bg-red-100 text-red-800";
//       case "Pending":
//       case "InProgress":
//         return "bg-yellow-100 text-yellow-800";
//       case "Todo":
//         return "bg-gray-100 text-gray-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   const formatDate = (dateString: string) => {
//     try {
//       return format(new Date(dateString), "PPP");
//     } catch {
//       return "Invalid Date";
//     }
//   };

//   const formatDateTime = (dateString: string) => {
//     try {
//       return format(new Date(dateString), "PPPp");
//     } catch {
//       return "Invalid Date";
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <Loader2 className="h-8 w-8 animate-spin" aria-label="Loading task details" />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="text-red-500 text-center p-4">
//         Error loading task: {error}
//       </div>
//     );
//   }

//   if (!task || !id) {
//     return (
//       <div className="text-center p-4">
//         <p>Task not found</p>
//         <Button asChild className="mt-4">
//           <Link href="/tasks">Back to Tasks</Link>
//         </Button>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-4 py-8 max-w-4xl">
//       <Button asChild variant="outline" className="mb-6">
//         <Link href="/tasks">&larr; Back to Tasks</Link>
//       </Button>

//       <Card>
//         <CardHeader>
//           <div className="flex justify-between items-start">
//             <div>
//               <CardTitle className="text-2xl">{task.title}</CardTitle>
//               <CardDescription className="mt-2">
//                 Assigned on: {formatDate(task.createdAt)}
//               </CardDescription>
//             </div>
//             <div className="flex flex-col items-end gap-2">
//               <Badge
//                 variant={getStatusBadgeVariant(task.status)}
//                 className={getStatusClass(task.status)}
//               >
//                 {task.status}
//               </Badge>
//               <Badge
//                 variant={getTimerStatusBadgeVariant(task.timer_status)}
//                 className={getStatusClass(task.timer_status)}
//               >
//                 {task.timer_status}
//               </Badge>
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div>
//             <h3 className="font-medium mb-2">Description</h3>
//             <p className="text-gray-700">
//               {task.description || "No description available"}
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <h3 className="font-medium mb-2">Deadline</h3>
//               <p>{formatDateTime(task.deadline)}</p>
//             </div>
//             <div>
//               <h3 className="font-medium mb-2">Time Allocated</h3>
//               <p>{task.TAT} mins</p>
//             </div>
//           </div>

//           {task.proof && task.proof.length > 0 && (
//             <div>
//               <h3 className="font-medium mb-2">Proof Requirements</h3>
//               <ul className="list-disc pl-5">
//                 {task.proof.map((proof, index) => (
//                   <li key={index}>{proof.type}</li>
//                 ))}
//               </ul>
//             </div>
//           )}
//         </CardContent>
//         <CardFooter className="flex justify-end gap-2">
//           <Button variant="outline" aria-label="Mark task as in progress">
//             Mark as In Progress
//           </Button>
//           <Button aria-label="Submit proof for task">Submit Proof</Button>
//         </CardFooter>
//       </Card>
//     </div>
//   );
// };

// export default TaskDetail;
