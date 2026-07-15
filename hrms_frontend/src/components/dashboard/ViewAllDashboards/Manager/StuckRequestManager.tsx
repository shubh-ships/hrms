"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { Clock, AlertCircle, Check, X, Play, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchStuckRequests,
  respondToStuckRequest,
  convertToInProgress,
  changeDeadline,
  selectStuckRequests,
} from "@/features/taskAssignments/taskAssignmentSlice";
import { format } from "date-fns";
import { toast } from "sonner";
import useSocket from "@/hooks/useSocket";
import Cloud from "@/assets/Dashicons/Cloud.png";

const StuckRequestsManager = () => {
  const dispatch = useAppDispatch();
  const stuckRequests = useAppSelector(selectStuckRequests);
  const { loading, error } = useAppSelector((state) => state.taskAssignments);
  const { user } = useAppSelector((state) => state.auth);

  const { on, joinUserRoom, joinTaskRoom } = useSocket();

  useEffect(() => {
    dispatch(fetchStuckRequests());
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

    stuckRequests.forEach((task) => {
      if (task?._id) {
        joinTaskRoom(task._id.toString());
      }
    });
  }, [user, stuckRequests, joinUserRoom, joinTaskRoom]);

  useEffect(() => {
    const offCreated = on("stuck_request_created", () => {
      dispatch(fetchStuckRequests());
    });

    const offResponse = on("stuck_request_response", () => {
      dispatch(fetchStuckRequests());
    });

    return () => {
      offCreated && offCreated();
      offResponse && offResponse();
    };
  }, [on, dispatch]);

  const handleRespondToRequest = async (id: string, accept: boolean) => {
    try {
      await dispatch(
        respondToStuckRequest({ id, stuck_request: accept })
      ).unwrap();
      toast.success(`Request ${accept ? "accepted" : "rejected"} successfully`);
      // backup fetch (in case socket fails)
      dispatch(fetchStuckRequests());
    } catch {
      toast.error(`Failed to ${accept ? "accept" : "reject"} request`);
    }
  };

  const handleConvertToInProgress = async (id: string) => {
    try {
      await dispatch(convertToInProgress(id)).unwrap();
      toast.success("Task converted to In Progress");
      dispatch(fetchStuckRequests());
    } catch {
      toast.error("Failed to convert task to In Progress");
    }
  };

  const handleShiftToAnotherDay = async (id: string) => {
    try {
      await dispatch(changeDeadline({ id })).unwrap();
      toast.success("Deadline shifted to next day successfully");
      dispatch(fetchStuckRequests());
    } catch (error: any) {
      toast.error(error || "Failed to shift deadline");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );
  if (error)
    return (
      <div className="text-red-500 text-center p-4">Error: {error}</div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1e2939] p-4 text-gray-900">
      <div className="w-full mx-auto" style={{ maxWidth: '80rem' }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Stuck Requests Management
          </h1>
          <p className="text-sm text-muted-foreground">
            {stuckRequests.length} stuck requests waiting for your action
          </p>
        </div>

        <Card className="shadow-sm border-gray-100">
          <CardHeader className="border-b-1 border-gray-200 bg-white rounded-t-lg pb-4">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Pending Stuck Requests
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className=" ">
              {stuckRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
                  <Image
                    src={Cloud}
                    alt="No stuck requests"
                    width={150}
                    height={150}
                    className="mb-4 opacity-80"
                  />
                  <p className="text-lg text-muted-foreground font-medium">
                    No stuck requests found
                  </p>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {stuckRequests.map((request) => (
                    <div
                      key={request._id}
                      className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
                        <div className="flex-1">
                          <h3 className="text-base text-gray-900 mb-6">
                            <span className="font-semibold text-gray-700">title:</span>{" "}
                            {request.title}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                            <div>
                              <span className="text-muted-foreground">Assigned by:</span>{" "}
                              <span className="text-gray-900 font-medium ml-1">
                                {typeof request.assigned_by_user_id === "object"
                                  ? request.assigned_by_user_id.name
                                  : "Unknown"}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Assigned to:</span>{" "}
                              <span className="text-gray-900 font-medium ml-1">
                                {typeof request.assigned_to_employee_id === "object"
                                  ? request.assigned_to_employee_id.name
                                  : "Unknown"}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">TAT:</span>{" "}
                              <span className="text-gray-900 font-medium ml-1">
                                {request.TAT ? `${request.TAT} mins` : "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Department:</span>{" "}
                              <span className="text-gray-900 font-medium ml-1">
                                {typeof request.department_id === "object"
                                  ? request.department_id.name
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge className="bg-[#fef9c3] hover:bg-[#fef9c3] text-[#854d0e] border-none font-medium px-3 py-1 flex items-center gap-1.5 shadow-none">
                            <Clock className="w-3.5 h-3.5" />
                            Submitted:{" "}
                            {format(
                              new Date(request.createdAt || request.deadline || new Date()),
                              "MMM dd, h:mm a"
                            )}
                          </Badge>
                          <Badge className="bg-[#fee2e2] hover:bg-[#fee2e2] text-[#ef4444] border-none font-medium px-3 py-1 shadow-none tracking-wide text-xs">
                            STUCK
                          </Badge>
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="text-gray-900 font-medium mb-3 text-sm">
                          Reason:
                        </div>
                        <div className="bg-[#fef9c3] rounded-md p-4 flex gap-3 border-l-4 border-yellow-400">
                          <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5">
                            !
                          </div>
                          <p className="text-sm text-gray-800">
                            {request.stuck_reason ||
                              request.description ||
                              "No reason provided"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-end gap-3 pt-2">
                        <Button
                          className="bg-[#ef4444] hover:bg-[#dc2626] text-white gap-2 px-6"
                          onClick={() => handleShiftToAnotherDay(request._id)}
                        >
                          <Calendar className="w-4 h-4" /> Shift to Another Day
                        </Button>
                        <Button
                          variant="outline"
                          className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200 gap-2 px-6"
                          onClick={() => handleConvertToInProgress(request._id)}
                        >
                          <Play className="w-4 h-4" /> Convert to In Progress
                        </Button>
                        <Button
                          variant="outline"
                          className="bg-white hover:bg-red-50 text-red-500 border-red-500 gap-2 px-6"
                          onClick={() => handleRespondToRequest(request._id, false)}
                        >
                          <X className="w-4 h-4" /> Reject Request
                        </Button>
                        <Button
                          className="bg-[#22c55e] hover:bg-[#16a34a] text-white gap-2 px-6"
                          onClick={() => handleRespondToRequest(request._id, true)}
                        >
                          <Check className="w-4 h-4" /> Accept Request
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StuckRequestsManager;
