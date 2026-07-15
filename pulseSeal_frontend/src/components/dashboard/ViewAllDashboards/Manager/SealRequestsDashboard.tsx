"use client";

import * as React from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, RefreshCw, ChevronDown, ChevronUp, FileText, Image as ImageIcon, AlertCircle, Link as LinkIcon, Clock } from "lucide-react";
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchManagerApprovals, updateApproval, fetchUserApprovalsById } from '@/features/approvals/approvalSlice';
import { fetchDepartmentMembers } from '@/features/departments/departmentSlice';
import { toast } from 'sonner';
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface ProofItem {
  type?: string;
  fieldName?: string;
  proof_type?: string;
  url?: string;
  text?: string;
  original_name?: string;
  field_name?: string;
}

interface SubmissionData {
  _id: string;
  title?: string;
  description?: string;
  proof?: ProofItem[];
  submission_data?: any[];
  createdAt: string;
}

interface TaskAssign {
  _id: string;
  title: string;
  description: string;
  TAT: number;
  deadline: string;
  proof: ProofItem[];
}

interface Approval {
  _id: string;
  taskAssignId?: TaskAssign;
  task_assign_id?: string | TaskAssign;
  submissionId?: SubmissionData;
  submission_data?: SubmissionData;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Fraud' | 'Reversed';
  assignBy?: User;
  assignTo?: User;
  createdAt: string;
}

export default function SealRequestsDashboard() {
  const dispatch = useAppDispatch();
  const { managerApprovals, userApprovals, loading: approvalsLoading } = useAppSelector((state) => state.approvals);
  const { departmentMembers, loading: membersLoading } = useAppSelector((state) => state.departments);
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = React.useState<string>('');
  const [expandedCards, setExpandedCards] = React.useState<Set<string>>(new Set());
  const [comment, setComment] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [activeAction, setActiveAction] = React.useState<{
    id: string;
    action: 'approve' | 'reject' | 'fraud' | null;
  }>({ id: '', action: null });

  React.useEffect(() => {
    dispatch(fetchDepartmentMembers());
    dispatch(fetchManagerApprovals());
  }, [dispatch]);

  const memberUsers: User[] = departmentMembers
    .filter(member => member.role === 'MEMBER')
    .map(member => {
      const userId = member.user_id;
      if (typeof userId === 'string') {
        return { _id: userId, name: '', email: '' }; 
      }
      return userId as User; 
    });

  const safeUserApprovals: Approval[] = Array.isArray(userApprovals) 
    ? userApprovals.map(approval => {
        const taskAssign = approval.taskAssignId || 
          (typeof approval.task_assign_id === 'string' ? 
            { _id: approval.task_assign_id, title: '', description: '', TAT: 0, deadline: '', proof: [] } as TaskAssign : 
            approval.task_assign_id || { _id: '', title: '', description: '', TAT: 0, deadline: '', proof: [] });

        const submissionData = approval.submissionId || approval.submission_data || { 
          _id: '', 
          title: taskAssign.title, 
          description: taskAssign.description, 
          createdAt: approval.createdAt,
          proof: [],
          submission_data: []
        };

        return {
          ...approval,
          submission_data: submissionData,
          task_assign_id: taskAssign,
          assignBy: typeof approval.assignBy === 'string' 
            ? { _id: approval.assignBy, name: '', email: '' } 
            : (approval.assignBy || { _id: '', name: '', email: '' }),
          assignTo: typeof approval.assignTo === 'string' 
            ? { _id: approval.assignTo, name: '', email: '' } 
            : (approval.assignTo || { _id: '', name: '', email: '' }),
          status: approval.status || 'Pending'
        };
      })
    : [];

  const handleViewUserApprovals = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setExpandedCards(new Set());
    dispatch(fetchUserApprovalsById(userId));
  };

  const handleBackToAllUsers = () => {
    setSelectedUserId(null);
    setSelectedUserName('');
    setExpandedCards(new Set());
  };

  const toggleCard = (approvalId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(approvalId)) {
      newExpanded.delete(approvalId);
    } else {
      newExpanded.add(approvalId);
    }
    setExpandedCards(newExpanded);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Pending': return 'secondary';
      case 'Approved': return 'default';
      case 'Rejected': 
      case 'Fraud': 
        return 'destructive';
      default: return 'outline';
    }
  };

  const handleActionClick = (id: string, action: 'approve' | 'reject' | 'fraud') => {
    setActiveAction({ id, action });
    setComment('');
    setReason('');
  };

  const cancelAction = () => {
    setActiveAction({ id: '', action: null });
    setComment('');
    setReason('');
  };

  const submitAction = async () => {
    if (!activeAction.id) return;
    
    try {
      let status: 'Approved' | 'Rejected' | 'Fraud';
      let updateData: { status: 'Approved' | 'Rejected' | 'Fraud'; comment?: string; reason?: string };

      switch (activeAction.action) {
        case 'approve':
          status = 'Approved';
          updateData = { status, comment };
          break;
        case 'reject':
          status = 'Rejected';
          if (!reason.trim()) {
            toast.error('Reason is required for rejection');
            return;
          }
          updateData = { status, reason };
          break;
        case 'fraud':
          status = 'Fraud';
          if (!reason.trim()) {
            toast.error('Reason is required for fraud report');
            return;
          }
          updateData = { status, reason };
          break;
        default:
          return;
      }

      await dispatch(updateApproval({
        id: activeAction.id,
        updateData
      })).unwrap();

      toast.success(`Submission has been ${status}`);
      dispatch(fetchUserApprovalsById(selectedUserId!)); 
      cancelAction();
    } catch (error) {
      toast.error('Failed to update approval status');
    }
  };

  const renderProof = (proofItems: any[] = []) => {
    return proofItems.map((item, idx) => {
      if (item.field_name) {
        return (
          <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-3">
            <div className="flex items-start gap-3">
              {item.proof_type === 'url' ? (
                <LinkIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              ) : (
                <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium text-sm mb-1">
                  {item.field_name} - {item.proof_type === 'url' ? 'URL Proof' : 'File Proof'}
                </p>
                {item.proof_type === 'url' ? (
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm break-all"
                  >
                    {item.url}
                  </a>
                ) : (
                  <>
                    <p className="text-sm mb-1">{item.original_name}</p>
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm break-all"
                    >
                      View File
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      } else if (item.type === 'URL' || item.type === 'url') {
        return (
          <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-3">
            <div className="flex items-start gap-3">
              <LinkIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm mb-1">URL Proof</p>
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
      } else {
        return (
          <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-3">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm mb-1">Text Proof</p>
                <p className="text-sm whitespace-pre-line">{item.text || JSON.stringify(item)}</p>
              </div>
            </div>
          </div>
        );
      }
    });
  };

  if (approvalsLoading || membersLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" aria-label="Loading dashboard" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1e2939] p-4">
      <div className="w-full max-w-7xl mx-auto">
        {selectedUserId ? (
          <div className="space-y-6">
            <div className="mb-6">
              <Button 
                variant="outline" 
                onClick={handleBackToAllUsers}
                className="mb-4"
              >
                Back to All Members
              </Button>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {selectedUserName}'s Approvals
              </h1>
              <p className="text-muted-foreground">
                {safeUserApprovals.length} approvals found
              </p>
            </div>

            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      Approval Queue
                    </CardTitle>
                    <CardDescription>
                      Review and approve tasks submitted by {selectedUserName}.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-0">
                    {safeUserApprovals.length > 0 ? (
                      safeUserApprovals.map((approval: Approval, index: number) => {
                        const taskAssign = typeof approval.task_assign_id === 'string' 
                          ? { _id: approval.task_assign_id, title: '', description: '', TAT: 0, deadline: '', proof: [] } as TaskAssign 
                          : (approval.task_assign_id || { _id: '', title: '', description: '', TAT: 0, deadline: '', proof: [] });
                        
                        const proofItems = approval.submission_data?.proof || 
                                          (Array.isArray(approval.submission_data?.submission_data) 
                                            ? approval.submission_data.submission_data 
                                            : []) || [];

                        return (
                          <div key={approval._id}>
                            <div className="p-6">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                                <div className="flex-1">
                                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                                    {taskAssign.title || approval.submission_data?.title || 'No Title'}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    Submitted: {format(new Date(approval.createdAt), 'MMM dd, h:mm a')}
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <Badge variant={getStatusVariant(approval.status || 'Pending')}>
                                    {approval.status || 'Pending'}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleCard(approval._id)}
                                    className="p-1 h-8 w-8"
                                  >
                                    {expandedCards.has(approval._id) ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>

                              <div className="mb-4">
                                <div className="flex flex-col sm:flex-row gap-4 text-sm mb-3">
                                  <div className="flex gap-2">
                                    <span className="text-muted-foreground">Task Title:</span>
                                    <span className="font-medium">{taskAssign.title || 'N/A'}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="text-muted-foreground">TAT:</span>
                                    <span className="font-medium">
                                      {taskAssign.TAT ? `${taskAssign.TAT} mins` : 'N/A'}
                                    </span>
                                  </div>
                                </div>
                                <Card className="bg-muted/30">
                                  <CardContent className="p-3">
                                    <p className="text-sm leading-relaxed">
                                      {taskAssign.description || approval.submission_data?.description || 'No description provided'}
                                    </p>
                                  </CardContent>
                                </Card>
                              </div>

                              {expandedCards.has(approval._id) && (
                                <div className="space-y-4">
                                  <Separator />
                                  
                                  {proofItems.length > 0 && (
                                    <div>
                                      <div className="flex items-center gap-2 mb-3">
                                        <ImageIcon className="w-4 h-4 text-blue-600" />
                                        <h4 className="font-medium text-sm">Submitted Proofs:</h4>
                                      </div>
                                      
                                      <div className="space-y-3">
                                        {renderProof(proofItems)}
                                      </div>
                                    </div>
                                  )}

                                  <div className="pt-2">
                                    <Separator className="mb-4" />
                                    
                                    {activeAction.id === approval._id ? (
                                      <div className="space-y-4">
                                        {activeAction.action === 'approve' && (
                                          <div>
                                            <h4 className="font-medium mb-2">Add Comment (Optional)</h4>
                                            <Textarea
                                              value={comment}
                                              onChange={(e) => setComment(e.target.value)}
                                              placeholder="Add any comments for the approval..."
                                              className="mb-3"
                                            />
                                          </div>
                                        )}
                                        
                                        {(activeAction.action === 'reject' || activeAction.action === 'fraud') && (
                                          <div>
                                            <h4 className="font-medium mb-2 flex items-center gap-2">
                                              <AlertCircle className="w-4 h-4 text-red-500" />
                                              {activeAction.action === 'reject' 
                                                ? 'Reason for Rejection (Required)' 
                                                : 'Reason for Fraud Report (Required)'}
                                            </h4>
                                            <Textarea
                                              value={reason}
                                              onChange={(e) => setReason(e.target.value)}
                                              placeholder={
                                                activeAction.action === 'reject' 
                                                  ? 'Explain why you are rejecting this submission...' 
                                                  : 'Explain why you are reporting this as fraud...'
                                              }
                                              className="mb-3"
                                              required
                                            />
                                          </div>
                                        )}
                                        
                                        <div className="flex gap-2">
                                          <Button onClick={cancelAction} variant="outline">
                                            Cancel
                                          </Button>
                                          <Button onClick={submitAction}>
                                            {activeAction.action === 'approve' 
                                              ? 'Confirm Approval' 
                                              : activeAction.action === 'reject' 
                                                ? 'Confirm Rejection' 
                                                : 'Report Fraud'}
                                          </Button>
                                        </div>
                                      </div>
                                    ) : approval.status === 'Pending' && (
                                      <div className="flex flex-col sm:flex-row gap-2">
                                        <Button 
                                          className="flex-1 bg-green-600 hover:bg-green-700"
                                          onClick={() => handleActionClick(approval._id, 'approve')}
                                        >
                                          Approve
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                                          onClick={() => handleActionClick(approval._id, 'reject')}
                                        >
                                          Reject
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                                          onClick={() => handleActionClick(approval._id, 'fraud')}
                                        >
                                          Report Fraud
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            {index < safeUserApprovals.length - 1 && <Separator />}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No approvals found for this user</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Team Members
              </h1>
              <p className="text-muted-foreground">
                View and manage your team members
              </p>
            </div>

            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        Team Members List
                      </CardTitle>
                      <CardDescription>
                        Select a member to view their approvals
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      dispatch(fetchDepartmentMembers());
                      dispatch(fetchManagerApprovals());
                      toast.success('Data refreshed');
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {user.name?.split(' ').map((n: string) => n[0]).join('') || 'UU'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name || 'Unknown User'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.email || 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewUserApprovals(user._id, user.name || 'Unknown')}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Approvals
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
