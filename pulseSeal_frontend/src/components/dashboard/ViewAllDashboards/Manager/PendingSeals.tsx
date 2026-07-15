"use client";

import React, { useState, useEffect } from 'react';
import { Clock, ChevronDown, ChevronUp, FileText, Image, AlertCircle, LinkIcon, Check, RotateCcw, Edit, Users, Building } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchManagerApprovals, updateApproval } from '@/features/approvals/approvalSlice';
import { fetchDepartments } from '@/features/departments/departmentSlice';
import { fetchUsers } from '@/features/user/userSlice';
import { format, addMinutes } from 'date-fns';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    submission_data?: any[] | ProofItem[];
    createdAt: string;
    ETAT?: number;
    reason?: {
        message?: string;
        isValid?: boolean;
    };
}

interface User {
    _id: string;
    name: string;
    email: string;
    departmentId?: string | string[]; // Accept both string and string[]
    organizationId?: string;
    phoneNumber?: number;
    isActive?: boolean;
    isFreezed?: boolean;
    is_organizer?: boolean;
    is_superuser?: boolean;
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
    faceImages?: string[];
    faceEmbedding?: number[];
    faceImageUrl?: string;
}

interface Department {
    _id: string;
    name: string;
    description?: string;
    organizationId?: string;
}

interface TaskAssign {
    _id: string;
    title: string;
    description: string;
    TAT: number;
    deadline: string;
    proof: ProofItem[];
    status?: string;
    previous_TAT?: (number | string)[];
    assigned_to_employee_id?: string;
    department_id?: string;
    assigned_by_user_id?: string;
}

interface Approval {
    _id: string;
    department_id: string;
    submitted_by_user_id: string;
    task_assign_id: string | TaskAssign;
    taskAssignId?: TaskAssign | null;
    submissionId?: SubmissionData | null;
    submission_data?: SubmissionData;
    reason?: string;
    ETAT?: number;
    previous_TAT?: (number | string)[];
    createdAt: string;
    updatedAt: string;
    __v: number;
    signalColor?: 'Green' | 'Yellow' | 'Red';
    status?: 'Pending' | 'Approved' | 'Rejected' | 'Fraud' | 'Reversed';
    assignBy?: User | string;
    assignTo?: User;
    organizationId?: string;
    comment?: string;
    isValid?: boolean;
}

interface ReversalFormData {
    title: string;
    description: string;
    TAT: number;
    deadline: string;
    assigned_to_employee_id: string;
    department_id: string;
    proof: ProofItem[];
}

const PendingSeals: React.FC = () => {
    const dispatch = useAppDispatch();
    const { managerApprovals, loading, error } = useAppSelector((state) => state.approvals);
    const { departments } = useAppSelector((state) => state.departments);
    const { users, loading: usersLoading } = useAppSelector((state) => state.users);

    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
    const [comment, setComment] = useState('');
    const [reason, setReason] = useState('');
    const [isValidReason, setIsValidReason] = useState(false);
    const [activeAction, setActiveAction] = useState<{
        id: string;
        action: 'approve' | 'reject' | 'fraud' | 'reversed' | null;
    }>({ id: '', action: null });
    const [reversalDialogOpen, setReversalDialogOpen] = useState(false);
    const [selectedApprovalForReversal, setSelectedApprovalForReversal] = useState<Approval | null>(null);
    const [reversalFormData, setReversalFormData] = useState<ReversalFormData>({
        title: '',
        description: '',
        TAT: 0,
        deadline: '',
        assigned_to_employee_id: '',
        department_id: '',
        proof: []
    });
    const [newProofItem, setNewProofItem] = useState({ fieldName: '', type: 'file' });

    // Filter users by selected department
    const filteredUsers = reversalFormData.department_id
        ? users.filter(user => {
            const deptId = user.departmentId;
            if (Array.isArray(deptId)) {
                return deptId.includes(reversalFormData.department_id);
            } else if (typeof deptId === 'string') {
                return deptId === reversalFormData.department_id;
            }
            return false;
        })
        : users;

    const safeManagerApprovals: Approval[] = Array.isArray(managerApprovals)
        ? managerApprovals.map(approval => {
            const taskAssign = approval.taskAssignId ||
                (typeof approval.task_assign_id === 'string' ?
                    { _id: approval.task_assign_id } as TaskAssign :
                    approval.task_assign_id) ||
                { _id: '', title: '', description: '', TAT: 0, deadline: '', proof: [] };

            const submissionData = approval.submissionId || approval.submission_data || {
                _id: '',
                title: taskAssign.title,
                description: taskAssign.description,
                createdAt: approval.createdAt,
                proof: [],
                submission_data: []
            };

            // Handle assignBy - ensure it's a User object
            let assignBy: User;
            if (typeof approval.assignBy === 'string') {
                assignBy = { _id: approval.assignBy, name: '', email: '' };
            } else if (approval.assignBy && typeof approval.assignBy === 'object') {
                assignBy = approval.assignBy as User;
            } else {
                assignBy = { _id: '', name: '', email: '' };
            }

            // Handle assignTo - ensure it's a User object
            let assignTo: User;
            if (typeof approval.assignTo === 'string') {
                assignTo = { _id: approval.assignTo, name: '', email: '' };
            } else if (approval.assignTo && typeof approval.assignTo === 'object') {
                assignTo = approval.assignTo as User;
            } else {
                assignTo = { _id: '', name: '', email: '' };
            }

            return {
                ...approval,
                submission_data: submissionData,
                task_assign_id: taskAssign,
                assignBy: assignBy,
                assignTo: assignTo,
                status: approval.status || 'Pending'
            } as Approval;
        })
        : [];

    const todayPendingApprovals = React.useMemo(() => {
        const filtered = safeManagerApprovals.filter((approval: Approval) => {
            const approvalDate = new Date(approval.createdAt);
            const today = new Date();
            return (
                approvalDate.getDate() === today.getDate() &&
                approvalDate.getMonth() === today.getMonth() &&
                approvalDate.getFullYear() === today.getFullYear() &&
                approval.status === 'Pending'
            );
        });

        return filtered;
    }, [safeManagerApprovals]);

    useEffect(() => {
        dispatch(fetchManagerApprovals());
        dispatch(fetchDepartments({})); // Fixed: pass empty object
        dispatch(fetchUsers());
    }, [dispatch]);

    useEffect(() => {
        // Set default deadline when TAT changes
        if (reversalFormData.TAT > 0 && !reversalFormData.deadline) {
            const now = new Date();
            const deadline = addMinutes(now, reversalFormData.TAT);
            // Convert to local datetime-local format (YYYY-MM-DDTHH:MM)
            const localDeadline = format(deadline, "yyyy-MM-dd'T'HH:mm");
            setReversalFormData(prev => ({
                ...prev,
                deadline: localDeadline
            }));
        }
    }, [reversalFormData.TAT]);

    const toggleCard = (approvalId: string) => {
        const newExpanded = new Set(expandedCards);
        if (newExpanded.has(approvalId)) {
            newExpanded.delete(approvalId);
        } else {
            newExpanded.add(approvalId);
        }
        setExpandedCards(newExpanded);
    };

    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case 'Pending': return 'secondary';
            case 'Approved': return 'default';
            case 'Rejected':
            case 'Fraud':
            case 'Reversed':
                return 'destructive';
            default: return 'outline';
        }
    };

    const convertUTCToLocal = (utcDateString: string): string => {
        if (!utcDateString) return '';
        try {
            const date = new Date(utcDateString);
            // Check if date is valid
            if (isNaN(date.getTime())) return '';

            // Format to local datetime string for input[type="datetime-local"]
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');

            return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch (error) {
            console.error('Error converting UTC to local:', error);
            return '';
        }
    };

    const handleActionClick = (id: string, action: 'approve' | 'reject' | 'fraud' | 'reversed') => {
        if (action === 'reversed') {
            const approval = safeManagerApprovals.find(a => a._id === id);
            if (approval) {
                setSelectedApprovalForReversal(approval);
                const task = typeof approval.task_assign_id === 'object' ? approval.task_assign_id : {} as TaskAssign;

                // Get assignee ID from approval response
                const assigneeId = approval.assignTo?._id || task.assigned_to_employee_id || '';

                // Get department ID from approval response
                const departmentId = approval.department_id || task.department_id || '';

                // Convert UTC deadline to local time for the input
                const localDeadline = convertUTCToLocal(task.deadline);

                // If no deadline in task, set default based on TAT
                let deadlineToUse = localDeadline;
                if (!deadlineToUse && task.TAT) {
                    const now = new Date();
                    const defaultDeadline = addMinutes(now, task.TAT);
                    deadlineToUse = format(defaultDeadline, "yyyy-MM-dd'T'HH:mm");
                }

                setReversalFormData({
                    title: task.title || '',
                    description: task.description || '',
                    TAT: task.TAT || 15,
                    deadline: deadlineToUse,
                    assigned_to_employee_id: assigneeId,
                    department_id: departmentId,
                    proof: task.proof || []
                });
                setReversalDialogOpen(true);
            }
        } else {
            setActiveAction({ id, action });
            setComment('');
            setReason('');
            setIsValidReason(false);
        }
    };

    const cancelAction = () => {
        setActiveAction({ id: '', action: null });
        setComment('');
        setReason('');
        setIsValidReason(false);
    };

    const submitAction = async () => {
        if (!activeAction.id) return;

        try {
            let status: 'Approved' | 'Rejected' | 'Fraud' | 'Reversed';
            let updateData: {
                status: 'Approved' | 'Rejected' | 'Fraud' | 'Reversed';
                comment?: string;
                reason?: string;
                isValid?: boolean;
            };

            switch (activeAction.action) {
                case 'approve':
                    status = 'Approved';
                    updateData = {
                        status,
                        comment,
                        isValid: isValidReason
                    };
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
            dispatch(fetchManagerApprovals());
            cancelAction();
        } catch (error) {
            toast.error('Failed to update approval status');
        }
    };

    const submitReversal = async () => {
        if (!selectedApprovalForReversal) return;

        try {
            // Validate required fields
            if (!reversalFormData.title.trim()) {
                toast.error('Task title is required');
                return;
            }
            if (!reversalFormData.description.trim()) {
                toast.error('Task description is required');
                return;
            }
            if (reversalFormData.TAT <= 0) {
                toast.error('TAT must be greater than 0');
                return;
            }
            if (!reversalFormData.deadline) {
                toast.error('Deadline is required');
                return;
            }
            if (!reversalFormData.department_id) {
                toast.error('Department is required');
                return;
            }
            if (!reversalFormData.assigned_to_employee_id) {
                toast.error('Assignee is required');
                return;
            }

            const status = 'Reversed' as const;

            // Convert local datetime back to UTC for backend
            const deadlineDate = new Date(reversalFormData.deadline);
            const utcDeadline = deadlineDate.toISOString();

            // Prepare update data matching backend structure
            const updateData = {
                status,
                title: reversalFormData.title,
                description: reversalFormData.description,
                TAT: reversalFormData.TAT,
                deadline: utcDeadline,
                assigned_to_employee_id: reversalFormData.assigned_to_employee_id,
                department_id: reversalFormData.department_id,
                proof: reversalFormData.proof
            };

            await dispatch(updateApproval({
                id: selectedApprovalForReversal._id,
                updateData: updateData as any
            })).unwrap();

            toast.success('Task has been reversed and reassigned');
            dispatch(fetchManagerApprovals());
            setReversalDialogOpen(false);
            setSelectedApprovalForReversal(null);
            resetReversalForm();
        } catch (error: any) {
            toast.error(error?.message || 'Failed to reverse task');
        }
    };

    const resetReversalForm = () => {
        setReversalFormData({
            title: '',
            description: '',
            TAT: 0,
            deadline: '',
            assigned_to_employee_id: '',
            department_id: '',
            proof: []
        });
        setNewProofItem({ fieldName: '', type: 'file' });
    };

    const addProofItem = () => {
        if (!newProofItem.fieldName.trim()) {
            toast.error('Proof field name is required');
            return;
        }

        setReversalFormData(prev => ({
            ...prev,
            proof: [...prev.proof, { ...newProofItem }]
        }));

        setNewProofItem({ fieldName: '', type: 'file' });
    };

    const removeProofItem = (index: number) => {
        setReversalFormData(prev => ({
            ...prev,
            proof: prev.proof.filter((_, i) => i !== index)
        }));
    };

    const renderProof = (proofItems: any[] = []) => {
        const proofs = Array.isArray(proofItems) ? proofItems : [];

        return proofs.map((item, idx) => {
            const fieldName = item.field_name || item.fieldName || 'Submission Proof';
            const proofType = item.proof_type || item.type || 'file';
            const url = item.url || '';
            const isUrl = proofType === 'url' || proofType === 'URL';

            return (
                <div key={idx} className="flex items-center justify-between p-4 bg-[#F9FAFB] dark:bg-slate-800/50 border border-[#DFE8E5] rounded-[10px] mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-[48px] h-[48px] rounded-[5px] bg-[#E8F0F7] dark:bg-slate-800 flex items-center justify-center border border-[#E5E7EB] dark:border-slate-700">
                            {isUrl ? (
                                <LinkIcon className="w-5 h-5 text-[#6B7280]" />
                            ) : (
                                <FileText className="w-5 h-5 text-[#6B7280]" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-[14px] font-semibold text-[#1F2937] dark:text-white">
                                    {fieldName}
                                </p>
                                <span className="text-[14px] text-[#4B5563] dark:text-gray-400">- {isUrl ? 'URL Proff' : 'File Proff'}</span>
                            </div>
                            <p className="text-[10px] text-[#9CA3AF] dark:text-gray-500 mt-0.5">
                                Type: {proofType}
                            </p>
                        </div>
                    </div>
                    {url && (
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-[#4B5563] dark:text-gray-300 hover:text-[#1F2937] dark:hover:text-white transition-colors"
                        >
                            <span className="text-[14px] font-medium">
                                {url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                            </span>
                            <div className="w-4 h-4">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#4B5563]"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                            </div>
                        </a>
                    )}
                </div>
            );
        });
    };

    // Get current assignee details for display
    const getCurrentAssigneeDetails = () => {
        if (!selectedApprovalForReversal) return null;
        return selectedApprovalForReversal.assignTo;
    };

    if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
    if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

    return (
        <div className="min-h-screen dark:bg-[#0f172a] p-[40px]">
            <div className="w-full max-w-7xl mx-auto">
                <div className="mb-[24px]">
                    <h1 className="text-[20px] font-semibold text-[#1F2937] dark:text-white">
                        Today Team's Summary
                    </h1>
                    <p className="text-[12px] text-[#9CA3AF] dark:text-gray-400">
                        {todayPendingApprovals.length} pending approvals for today
                    </p>
                </div>

                <Card className="border border-[#E5E7EB] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white dark:bg-slate-900 rounded-[10px] p-0 gap-0 overflow-hidden">
                    <CardHeader className="p-[20px] pb-[20px] border-b border-[#E5E7EB] dark:border-slate-800">
                        <div>
                            <CardTitle className="text-[16px] font-medium text-[#1F2937] dark:text-white">
                                Pending Seals (Approval Queue)
                            </CardTitle>
                            <CardDescription className="text-[12px] text-[#9CA3AF] dark:text-gray-400">
                                Review and approve tasks submitted by your team for final seal of approval.
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 min-h-[600px] h-auto">
                        <div className="space-y-0 pb-[20px]">
                            {todayPendingApprovals.map((approval: Approval, index: number) => {
                                const taskAssign = typeof approval.task_assign_id === 'string'
                                    ? { _id: approval.task_assign_id } as TaskAssign
                                    : approval.task_assign_id || { _id: '', title: '', description: '', TAT: 0, deadline: '', proof: [] };

                                const isOverdue = !!approval.is_overdue;
                                const overdueReason = approval.overdue_reason || '';
                                const proofItems = approval.submission_data?.proof || [];

                                return (
                                    <div key={approval._id} className="px-[20px] pt-[20px]">
                                        <div
                                            className="w-full transition-all duration-300 rounded-[10px] border border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-900/50 p-[20px]"
                                        >
                                            <div className="flex w-full items-start justify-between">
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-[15px] font-semibold text-[#1F2937] dark:text-white truncate">
                                                            Task title: <span className="font-normal">{taskAssign.title || 'Untitled Task'}</span>
                                                        </h3>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                                        <div className="text-[13px] text-[#9CA3AF] dark:text-gray-400">
                                                            Assigned to: <span className="font-semibold text-[#4B5563] dark:text-gray-300">{approval.assignTo?.name || 'Unassigned'}</span>
                                                            <span className="ml-1">({approval.assignTo?.email || 'No email'})</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex items-center gap-2 text-[#9CA3AF] dark:text-gray-400">
                                                            <Clock className="w-[16px] h-[16px]" />
                                                            <span className="text-[12px] font-medium whitespace-nowrap">Submitted: {format(new Date(approval.createdAt), 'MMM dd, hh:mm a')}</span>
                                                        </div>

                                                        <Badge className="bg-[#FFF8E6] text-[#F59E0B] hover:bg-[#FFF8E6] border-none px-4 py-1.5 rounded-lg text-[12px] font-medium">
                                                            Pending
                                                        </Badge>

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => toggleCard(approval._id)}
                                                            className="p-1 h-auto hover:bg-gray-100 dark:hover:bg-slate-800 text-[#9CA3AF]"
                                                        >
                                                            {expandedCards.has(approval._id) ? (
                                                                <ChevronUp className="w-[18px] h-[18px]" />
                                                            ) : (
                                                                <ChevronDown className="w-[18px] h-[18px]" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            {expandedCards.has(approval._id) && (
                                                <div className="mt-6 space-y-6">
                                                    <div className="border border-[#E5E7EB] rounded-[10px] bg-[#F9FAFB] dark:bg-slate-900 p-[16px]">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                            <div className="space-y-1">
                                                                <div className="text-[12px] font-medium text-[#9CA3AF] uppercase">TAT</div>
                                                                <div className="text-[14px] font-medium text-[#1F2937] dark:text-white">
                                                                    {taskAssign.TAT ? `${taskAssign.TAT} mins` : 'N/A'}
                                                                </div>
                                                                <div className="text-[12px] text-[#3B82F6] font-medium">
                                                                    Original TAT: {taskAssign.TAT || 0} mins
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="text-[12px] font-medium text-[#9CA3AF]">Deadline</div>
                                                                <div className="text-[14px] font-medium text-[#1F2937] dark:text-white">
                                                                    {taskAssign.deadline ? format(new Date(taskAssign.deadline), 'MMM dd, hh:mm a') : 'N/A'}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="text-[12px] font-medium text-[#9CA3AF]">Stuck Records</div>
                                                                <div className="text-[14px] font-medium text-[#EF4444]">
                                                                    {(taskAssign.previous_TAT && taskAssign.previous_TAT.length > 0) ? (
                                                                        taskAssign.previous_TAT.join(', ')
                                                                    ) : 'None'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 border border-[#E5E7EB] dark:border-slate-800 rounded-[10px] bg-white dark:bg-slate-900">
                                                        <p className="text-[14px] text-[#4B5563] dark:text-gray-300 leading-relaxed">
                                                            {taskAssign.description || approval.submission_data?.description || 'The quiet morning breeze moved slowly through the narrow streets as the city began to wake up. A few shops opened their shutters while the sunlight reflected softly on the windows of tall buildings.'}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <h5 className="text-[14px] font-medium text-[#4B5563] dark:text-white mb-4">Submission Data:</h5>
                                                        <div className="space-y-0">
                                                            {renderProof(proofItems)}
                                                        </div>
                                                    </div>

                                                    <Separator className="mt-[30px] bg-[#E5E7EB] dark:bg-slate-800" />

                                                    <div className="pt-[5px] flex flex-wrap justify-end gap-3 items-center">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleActionClick(approval._id, 'reversed')}
                                                            className="border-[#D1D5DB] text-[#4B5563] h-[37px] w-[146px] text-[14px] font-medium rounded-[5px]"
                                                        >
                                                            Reverse
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleActionClick(approval._id, 'fraud')}
                                                            className="bg-[#EF4444] hover:bg-[#E04444] text-white h-[37px] w-[146px] text-[14px] font-medium rounded-[5px]"
                                                        >
                                                            Report Fraud
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleActionClick(approval._id, 'reject')}
                                                            className="border-[#EF4444] text-[#EF4444] hover:bg-[#FFF5F5] h-[37px] w-[146px] text-[14px] font-medium rounded-[5px]"
                                                        >
                                                            Reject
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleActionClick(approval._id, 'approve')}
                                                            className="bg-[#22C55E] hover:bg-[#20AC62] text-white h-[37px] w-[146px] text-[14px] font-medium rounded-[5px]"
                                                        >
                                                            Approve
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Reversal Dialog */}
            <Dialog open={reversalDialogOpen} onOpenChange={setReversalDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RotateCcw className="w-5 h-5 text-orange-600" />
                            Reverse and Reassign Task
                        </DialogTitle>
                        <DialogDescription>
                            Reverse the current approval and reassign the task with modified details.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        {/* Task Details */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="flex items-center gap-2">
                                Task Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                value={reversalFormData.title}
                                onChange={(e) => setReversalFormData({ ...reversalFormData, title: e.target.value })}
                                placeholder="Enter task title"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tat" className="flex items-center gap-2">
                                TAT (in minutes) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="tat"
                                type="number"
                                min="1"
                                value={reversalFormData.TAT}
                                onChange={(e) => setReversalFormData({ ...reversalFormData, TAT: parseInt(e.target.value) || 0 })}
                                placeholder="Enter TAT"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="deadline" className="flex items-center gap-2">
                                Deadline <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="deadline"
                                type="datetime-local"
                                value={reversalFormData.deadline}
                                onChange={(e) => setReversalFormData({ ...reversalFormData, deadline: e.target.value })}
                                required
                            />
                        </div>

                        {/* Department Display (Read-only) */}
                        <div className="space-y-2">
                            <Label htmlFor="department" className="flex items-center gap-2">
                                <Building className="w-4 h-4" />
                                Department
                            </Label>
                            <div className="flex items-center gap-3 p-2 border rounded-md bg-muted/30">
                                <Building className="w-4 h-4 text-muted-foreground" />
                                <div className="shrink-0">
                                    <p className="text-sm font-medium">
                                        {departments.find(d => d._id === reversalFormData.department_id)?.name ||
                                            "Department not found"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        ID: {reversalFormData.department_id || "Not set"}
                                    </p>
                                </div>

                            </div>
                            <p className="text-xs text-muted-foreground">
                                Department cannot be changed for reversal
                            </p>
                        </div>

                        {/* Employee Selection */}
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="assigned_to" className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Assign To <span className="text-red-500">*</span>
                            </Label>
                            <div className="space-y-3">
                                {/* Current Assignee Info */}
                                {selectedApprovalForReversal?.assignTo && typeof selectedApprovalForReversal.assignTo === 'object' && (
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Current Assignee:</p>
                                        <p className="text-sm">
                                            {selectedApprovalForReversal.assignTo.name}
                                            <span className="text-muted-foreground ml-2">
                                                ({selectedApprovalForReversal.assignTo.email})
                                            </span>
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            ID: {selectedApprovalForReversal.assignTo._id}
                                        </p>
                                    </div>
                                )}

                                {reversalFormData.department_id && filteredUsers.length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        {filteredUsers.length} employee(s) available in selected department
                                    </p>
                                )}
                            </div>
                        </div>


                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="description">
                                Description <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="description"
                                value={reversalFormData.description}
                                onChange={(e) => setReversalFormData({ ...reversalFormData, description: e.target.value })}
                                placeholder="Enter task description"
                                rows={4}
                                required
                            />
                        </div>


                        <div className="md:col-span-2 space-y-2">
                            <Label className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Proof Requirements
                            </Label>
                            <div className="border rounded-md p-3 bg-muted/20">
                                <p className="text-sm text-muted-foreground mb-2">
                                    Define what proof is required for this task:
                                </p>
                                {reversalFormData.proof.length > 0 ? (
                                    <div className="space-y-2 mb-3">
                                        {reversalFormData.proof.map((proof, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-background rounded">
                                                <div>
                                                    <span className="font-medium">{proof.fieldName || proof.field_name}</span>
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        ({proof.type || proof.proof_type || 'file'})
                                                    </span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeProofItem(index)}
                                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                                                >
                                                    ×
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic mb-3">No proof requirements set</p>
                                )}
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Input
                                        placeholder="Field name (e.g., Screenshot)"
                                        value={newProofItem.fieldName}
                                        onChange={(e) => setNewProofItem({ ...newProofItem, fieldName: e.target.value })}
                                        className="flex-1"
                                    />
                                    <Select
                                        value={newProofItem.type}
                                        onValueChange={(value: 'file' | 'url') => setNewProofItem({ ...newProofItem, type: value })}
                                    >
                                        <SelectTrigger className="w-full sm:w-[120px]">
                                            <SelectValue placeholder="Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="file">File</SelectItem>
                                            <SelectItem value="url">URL</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addProofItem}
                                        className="whitespace-nowrap"
                                    >
                                        Add Proof
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Section */}
                    <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">Task Summary</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-muted-foreground">Title:</span>
                                <p className="font-medium truncate">{reversalFormData.title || "Not set"}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">TAT:</span>
                                <p className="font-medium">{reversalFormData.TAT || 0} minutes</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Deadline:</span>
                                <p className="font-medium">
                                    {reversalFormData.deadline
                                        ? format(new Date(reversalFormData.deadline), 'MMM dd, yyyy h:mm a')
                                        : "Not set"}
                                </p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Department:</span>
                                <p className="font-medium truncate">
                                    {departments.find(d => d._id === reversalFormData.department_id)?.name || "Not set"}
                                </p>
                            </div>
                            <div className="col-span-2">
                                <span className="text-muted-foreground">Assignee:</span>
                                <p className="font-medium">
                                    {users.find(u => u._id === reversalFormData.assigned_to_employee_id)?.name ||
                                        (selectedApprovalForReversal?.assignTo && typeof selectedApprovalForReversal.assignTo === 'object'
                                            ? selectedApprovalForReversal.assignTo.name
                                            : "Not set")}
                                    {reversalFormData.assigned_to_employee_id && (
                                        <span className="text-muted-foreground text-xs ml-2">
                                            ({users.find(u => u._id === reversalFormData.assigned_to_employee_id)?.email ||
                                                (selectedApprovalForReversal?.assignTo && typeof selectedApprovalForReversal.assignTo === 'object'
                                                    ? selectedApprovalForReversal.assignTo.email
                                                    : '')})
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button variant="outline" onClick={() => {
                            setReversalDialogOpen(false);
                            resetReversalForm();
                        }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={submitReversal}
                            className="bg-orange-600 hover:bg-orange-700"
                            disabled={
                                !reversalFormData.title.trim() ||
                                !reversalFormData.description.trim() ||
                                reversalFormData.TAT <= 0 ||
                                !reversalFormData.deadline ||
                                !reversalFormData.department_id ||
                                !reversalFormData.assigned_to_employee_id
                            }
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reverse Task
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PendingSeals;