// "use client";

// import { useEffect } from 'react';
// import { useAppDispatch, useAppSelector } from '@/store/hooks';
// import Link from 'next/link';
// import { fetchTaskAssignments, selectAllTaskAssignments, selectTaskAssignmentLoading, selectTaskAssignmentError } from '@/features/taskAssignments/taskAssignmentSlice';
// import { RootState } from '@/store/index';
// import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Loader2 } from 'lucide-react';
// import { format } from 'date-fns';

// const TaskList = () => {
//  const dispatch = useAppDispatch();
//   const assignments = useAppSelector(selectAllTaskAssignments);
//   const loading = useAppSelector(selectTaskAssignmentLoading);
//   const error = useAppSelector(selectTaskAssignmentError);

//   useEffect(() => {
//     dispatch(fetchTaskAssignments());
//   }, [dispatch]);

//   const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
//     switch (status) {
//       case 'Completed':
//         return 'secondary';
//       case 'Overdue':
//         return 'destructive';
//       case 'Pending':
//         return 'outline';
//       default:
//         return 'default';
//     }
//   };

//   const getTimerStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
//     switch (status) {
//       case 'Done':
//         return 'secondary';
//       case 'Stuck':
//         return 'destructive';
//       case 'InProgress':
//         return 'outline';
//       case 'Todo':
//         return 'outline';
//       default:
//         return 'default';
//     }
//   };

//   const getStatusClass = (status: string) => {
//     switch (status) {
//       case 'Completed':
//       case 'Done':
//         return 'bg-green-100 text-green-800';
//       case 'Overdue':
//       case 'Stuck':
//         return 'bg-red-100 text-red-800';
//       case 'Pending':
//       case 'InProgress':
//         return 'bg-yellow-100 text-yellow-800';
//       case 'Todo':
//         return 'bg-gray-100 text-gray-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const formatDate = (dateString: string) => {
//     try {
//       return format(new Date(dateString), 'PPP');
//     } catch {
//       return 'Invalid Date';
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <Loader2 className="h-8 w-8 animate-spin" aria-label="Loading tasks" />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="text-red-500 text-center p-4">
//         Error loading tasks: {error}
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <h1 className="text-2xl font-bold mb-6">Your Tasks</h1>
      
//       {assignments.length === 0 ? (
//         <div className="text-center py-12">
//           <p className="text-gray-500">No tasks assigned to you yet.</p>
//         </div>
//       ) : (
//         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//           {assignments.map((task) => (
//             <Card key={task._id} className="hover:shadow-lg transition-shadow">
//               <CardHeader>
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <CardTitle className="text-lg">{task.title}</CardTitle>
//                     <CardDescription className="mt-1">
//                       Due: {formatDate(task.deadline)}
//                     </CardDescription>
//                   </div>
//                   <div className="flex flex-col items-end gap-1">
//                     <Badge 
//                       variant={getStatusBadgeVariant(task.status)} 
//                       className={getStatusClass(task.status)}
//                     >
//                       {task.status}
//                     </Badge>
//                     <Badge 
//                       variant={getTimerStatusBadgeVariant(task.timer_status)} 
//                       className={getStatusClass(task.timer_status)}
//                     >
//                       {task.timer_status}
//                     </Badge>
//                   </div>
//                 </div>
//               </CardHeader>
//               <CardContent>
//                 <p className="text-sm text-gray-600 line-clamp-2 mb-4">
//                   {task.description || 'No description available'}
//                 </p>
//                 <div className="flex justify-between items-center">
//                   <span className="text-sm font-medium">
//                     TAT: {task.TAT} hours
//                   </span>
//                   <Button asChild size="sm">
//                     <Link href={`/tasks/${task._id}`}>View Details</Link>
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default TaskList;












"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchTaskAssignments,
  selectAllTaskAssignments,
  selectTaskAssignmentLoading,
  selectTaskAssignmentError,
  upsertTask,
} from "@/features/taskAssignments/taskAssignmentSlice";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import useSocket from "@/hooks/useSocket";

const TaskList = () => {
  const dispatch = useAppDispatch();
  const assignments = useAppSelector(selectAllTaskAssignments);
  const loading = useAppSelector(selectTaskAssignmentLoading);
  const error = useAppSelector(selectTaskAssignmentError);
  const { user } = useAppSelector((state) => state.auth);

  const { on: socketOn, joinUserRoom } = useSocket();

  useEffect(() => {
    dispatch(fetchTaskAssignments());
  }, [dispatch]);

  useEffect(() => {
    const resolvedUserId =
      (user as any)?._id ||
      (user as any)?.id ||
      (user as any)?.userId?._id ||
      (user as any)?.userId?.id;

    if (resolvedUserId) {
      joinUserRoom(resolvedUserId.toString());
    }
  }, [user, joinUserRoom]);

  useEffect(() => {
    const offTaskUpdated = socketOn("task_updated", (payload: any) => {
      if (payload?.data) {
        dispatch(upsertTask(payload.data));
      } else if (payload?.task) {
        dispatch(upsertTask(payload.task));
      } else {
        dispatch(fetchTaskAssignments());
      }
    });

    const offTaskCreated = socketOn("task_created", (payload: any) => {
      if (payload?.task) {
        dispatch(upsertTask(payload.task));
      } else {
        dispatch(fetchTaskAssignments());
      }
    });

    const offTaskDeleted = socketOn("task_deleted", (payload: any) => {
      // easiest: just refetch list
      if (payload?.taskId) {
        dispatch(fetchTaskAssignments());
      }
    });

    return () => {
      offTaskUpdated?.();
      offTaskCreated?.();
      offTaskDeleted?.();
    };
  }, [socketOn, dispatch]);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" aria-label="Loading tasks" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        Error loading tasks: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Tasks</h1>

      {assignments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No tasks assigned to you yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((task) => (
            <Card key={task._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <CardDescription className="mt-1">
                      Due: {formatDate(task.deadline)}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-1">
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
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {task.description || "No description available"}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    TAT: {task.TAT} mins
                  </span>
                  <Button asChild size="sm">
                    <Link href={`/tasks/${task._id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;
