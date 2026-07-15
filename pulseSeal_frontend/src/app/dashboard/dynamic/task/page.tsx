
'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchUserTaskAssignments,
  selectUserTaskAssignments,
  selectTaskAssignmentLoading,
  selectTaskAssignmentError,
} from '@/features/taskAssignments/taskAssignmentSlice';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export default function TaskListPage() {
  const dispatch = useAppDispatch();
  const assignments = useAppSelector(selectUserTaskAssignments);
  const loading = useAppSelector(selectTaskAssignmentLoading);
  const error = useAppSelector(selectTaskAssignmentError);

  useEffect(() => {
    dispatch(fetchUserTaskAssignments());
  }, [dispatch]);

  
  const pendingTasks = assignments.filter(task => task.status === 'Pending');
  const overdueTasks = assignments.filter(task => task.status === 'Overdue');
  const completedTasks = assignments.filter(task => task.status === 'Completed');

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Overdue':
        return 'bg-destructive text-destructive-foreground';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return '';
    }
  };

  const getTimerStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'Done':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Stuck':
        return 'bg-destructive text-destructive-foreground';
      case 'InProgress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Todo':
        return 'border-border bg-background hover:bg-accent hover:text-accent-foreground';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
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

  const renderTaskSection = (title: string, tasks: typeof assignments) => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">{title} ({tasks.length})</h2>
      {tasks.length === 0 ? (
        <p className="text-gray-500">No {title.toLowerCase()} tasks</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map(task => (
            <Card key={task._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <CardDescription className="mt-1">
                      Due: {new Date(task.deadline).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant="outline"
                      className={getStatusBadgeClasses(task.status)}
                    >
                      {task.status}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={getTimerStatusBadgeClasses(task.timer_status)}
                    >
                      {task.timer_status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                  {task.description}
                </p>
                <div className="text-sm font-medium">
                  TAT: {task.TAT} Minutes
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Tasks</h1>

      {assignments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No tasks assigned to you yet.</p>
        </div>
      ) : (
        <>
          {renderTaskSection('Overdue', overdueTasks)}
          {renderTaskSection('Pending', pendingTasks)}
          {renderTaskSection('Completed', completedTasks)}
        </>
      )}
    </div>
  );
}