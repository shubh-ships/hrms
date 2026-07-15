"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
    fetchApprovalById,
    updateApproval,
    overrideApprovalDecision,
    fetchUserApprovalsById,
    fetchManagerApprovals,
    clearApprovalError,
} from "@/features/approvals/approvalSlice";
import { fetchUsers } from "@/features/user/userSlice";
import { fetchDepartments } from "@/features/departments/departmentSlice";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

import {
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    Search,
    Eye,
    Check,
    X,
    RotateCcw,
    AlertTriangle,
    Users,
    ExternalLink,
    RefreshCw,
    Hourglass,
    CheckCircle2,
    FileQuestion,
    ChevronDown,
    LayoutGrid,
    Tally4,
    Trash2
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Minimal Approval type to satisfy the compiler; extend fields as needed.
interface Approval {
    _id: string;
    status?: "Pending" | "Approved" | "Rejected" | "Fraud" | string;
    signalColor?: "Green" | "Yellow" | "Red" | string;
    createdAt?: string;
    assignTo?: any;
    assignBy?: any;
    taskAssignId?: any;
    submissionId?: any;
    comment?: string;
    reason?: string;
    [key: string]: any;
}

const ApprovalQueue = () => {
    const dispatch = useAppDispatch();

    const approvalState = useAppSelector((state) => state.approvals);
    const departmentState = useAppSelector((state) => state.departments);
    const { users } = useAppSelector((state) => state.users);

    const { loading = false, error = null } = approvalState || {};
    const { departments = [] } = departmentState || {};

    const [actionDialog, setActionDialog] = useState<{
        open: boolean;
        type: "approve" | "reject" | "override" | "reverse" | "view" | "fraud" | "delete";
        approval: any | null;
        isLoading?: boolean;
    }>({
        open: false,
        type: "view",
        approval: null,
        isLoading: false,
    });

    const [actionComment, setActionComment] = useState("");
    const [actionReason, setActionReason] = useState("");
    const [overrideStatus, setOverrideStatus] = useState<
        "Approved" | "Rejected" | "Fraud" | "Reversed"
    >("Rejected");

    const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
    const [filters, setFilters] = useState({ search: "", status: "" });

    // Controlled Accordion: which user's panel is open
    const [openUserId, setOpenUserId] = useState<string | undefined>(undefined);

    // Cache approvals by user + loading flags
    const [userApprovalsMap, setUserApprovalsMap] = useState<
        Record<string, Approval[]>
    >({});
    const [loadingUsers, setLoadingUsers] = useState<Set<string>>(new Set());

    // Initialize users + departments
    useEffect(() => {
        const init = async () => {
            try {
                await Promise.all([
                    dispatch(fetchDepartments({} as any)).unwrap(),
                    dispatch(fetchUsers()).unwrap(),
                    dispatch(fetchManagerApprovals()).unwrap(),
                ]);
            } catch {
                toast.error("Failed to initialize data.");
            }
        };
        init();
    }, [dispatch]);

    // Global error toast
    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearApprovalError());
        }
    }, [error, dispatch]);

    // Filter users by search + department + status
    const filteredUsers = useMemo(() => {
        if (!users || !Array.isArray(users)) return [];
        const searchTerm = (filters.search || "").toLowerCase();
        const selectedStatus = filters.status;

        // Group all approvals from the global list by user for quick lookups
        const approvalsByUser = new Map();
        if (approvalState.managerApprovals && Array.isArray(approvalState.managerApprovals)) {
            approvalState.managerApprovals.forEach((a: any) => {
                const uid = a.assignTo?._id || a.assignTo;
                if (uid) {
                    if (!approvalsByUser.has(uid)) approvalsByUser.set(uid, []);
                    approvalsByUser.get(uid).push(a);
                }
            });
        }

        // Use a Map to deduplicate users by their ID
        const userMap = new Map();

        users.forEach((u: any) => {
            const uid = u?.user_id?._id || u?._id;
            if (!uid) return;

            const matchesSearch =
                !searchTerm ||
                u.user_id?.name?.toLowerCase().includes(searchTerm) ||
                (u.user_id?.email || "").toLowerCase().includes(searchTerm);

            const matchesDepartment =
                selectedDepartment === "all" ||
                (u.departments &&
                    u.departments.some((d: any) => d._id === selectedDepartment));

            // NEW: Matches Status Filter
            // If no status is selected, this is true.
            // Otherwise, user must have at least one approval with that status in our global list.
            const userApprovals = approvalsByUser.get(uid) || [];
            const matchesStatus =
                !selectedStatus ||
                userApprovals.some((a: any) => a.status === selectedStatus);

            if (matchesSearch && matchesDepartment && matchesStatus) {
                if (!userMap.has(uid)) {
                    userMap.set(uid, u);
                }
            }
        });

        return Array.from(userMap.values());
    }, [users, filters.search, selectedDepartment, filters.status, approvalState.managerApprovals]);

    // Collect available departments from users
    const availableDepartments = useMemo(() => {
        const map = new Map();
        if (users && Array.isArray(users)) {
            users.forEach((u: any) => {
                (u.departments || []).forEach((d: any) => {
                    if (d?._id && d?.name) map.set(d._id, d);
                });
            });
        }
        return Array.from(map.values());
    }, [users]);



    // Fetch approvals when a user accordion is opened (once per user)
    useEffect(() => {
        if (!openUserId) return;
        if (userApprovalsMap[openUserId]) return;

        setLoadingUsers((prev) => new Set(prev).add(openUserId));
        dispatch(fetchUserApprovalsById(openUserId))
            .unwrap()
            .then((result) => {
                const approvalsData = (result as any)?.data || result;
                setUserApprovalsMap((prev) => ({
                    ...prev,
                    [openUserId]: Array.isArray(approvalsData)
                        ? approvalsData
                        : approvalsData
                            ? [approvalsData]
                            : [],
                }));
            })
            .catch(() => {
                toast.error("Failed to load user approvals");
            })
            .finally(() => {
                setLoadingUsers((prev) => {
                    const s = new Set(prev);
                    s.delete(openUserId);
                    return s;
                });
            });
    }, [openUserId, userApprovalsMap, dispatch]);

    // Filters
    const handleFilterChange = (key: string, value: string) => {
        setFilters((p) => ({ ...p, [key]: value }));
    };

    // Manual refresh for current open user
    const refreshData = () => {
        if (!openUserId) {
            toast.success("Nothing to refresh. Open a user first.");
            return;
        }
        setLoadingUsers((prev) => new Set(prev).add(openUserId));
        dispatch(fetchUserApprovalsById(openUserId))
            .unwrap()
            .then((result) => {
                const approvalsData = (result as any)?.data || result;
                setUserApprovalsMap((prev) => ({
                    ...prev,
                    [openUserId]: Array.isArray(approvalsData)
                        ? approvalsData
                        : approvalsData
                            ? [approvalsData]
                            : [],
                }));
            })
            .finally(() => {
                setLoadingUsers((prev) => {
                    const s = new Set(prev);
                    s.delete(openUserId);
                    return s;
                });
            });
        toast.success("Data refreshed.");
    };

    const getStatusBadge = (status?: string, signalColor?: string) => {
        const variants: Record<
            string,
            "default" | "secondary" | "destructive" | "outline"
        > = {
            Pending: "secondary",
            Approved: "default",
            Rejected: "destructive",
            Fraud: "destructive",
            Reversed: "outline",
        };
        const colors: Record<string, string> = {
            Green: "bg-green-100 text-green-800 hover:bg-green-100",
            Yellow: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
            Red: "bg-red-100 text-red-800 hover:bg-red-100",
        };
        const displayStatus = status || "—";
        return (
            <div className="flex items-center gap-2">
                <Badge
                    variant={variants[status || ""] || "outline"}
                    className={
                        status === "Pending" && signalColor ? colors[signalColor] || "" : ""
                    }
                >
                    {displayStatus}
                </Badge>
                {status === "Fraud" && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
            </div>
        );
    };

    const handleAction = async (
        type: "approve" | "reject" | "override" | "reverse" | "fraud" | "delete",
        approval: Approval
    ) => {
        setActionDialog({ open: true, type, approval });
        setActionComment("");
        setActionReason("");
        setOverrideStatus("Rejected");
    };

    const handleQuickView = async (
        approval: Approval,
        event?: React.MouseEvent<HTMLButtonElement>
    ) => {
        event?.stopPropagation();
        try {
            setActionDialog({
                open: true,
                type: "view",
                approval: null,
                isLoading: true,
            });
            const resultAction = await dispatch(fetchApprovalById(approval._id));
            if (fetchApprovalById.fulfilled.match(resultAction)) {
                const approvalData =
                    (resultAction.payload as any)?.data || resultAction.payload;
                setActionDialog({
                    open: true,
                    type: "view",
                    approval: approvalData,
                    isLoading: false,
                });
            }
        } catch {
            toast.error("Failed to load approval details");
            setActionDialog((prev) => ({ ...prev, isLoading: false }));
        }
    };

    const submitAction = async () => {
        if (!actionDialog.approval) return;

        try {
            setActionDialog((prev) => ({ ...prev, isLoading: true }));

            // Determine values based on action type
            const isValidValue =
                actionDialog.approval.submissionId?.reason?.isValid || false;
            const statusValue =
                actionDialog.type === "override"
                    ? overrideStatus
                    : actionDialog.type === "approve"
                        ? "Approved"
                        : actionDialog.type === "reject"
                            ? "Rejected"
                            : actionDialog.type === "fraud"
                                ? "Fraud"
                                : "Reversed";



            if (actionDialog.type === "delete") {
                const { deleteApproval } = await import("@/features/approvals/approvalSlice");
                await dispatch(deleteApproval(actionDialog.approval._id)).unwrap();
            } else if (actionDialog.type === "override") {
                await dispatch(
                    overrideApprovalDecision({
                        id: actionDialog.approval._id,
                        status: statusValue,
                        reason: actionReason,
                        isValid: isValidValue,
                    })
                ).unwrap();
            } else {
                await dispatch(
                    updateApproval({
                        id: actionDialog.approval._id,
                        updateData: {
                            status: statusValue,
                            reason: actionReason,
                            isValid: isValidValue,
                            comment: actionComment,
                        },
                    })
                ).unwrap();
            }

            setActionDialog({ open: false, type: "view", approval: null });
            toast.success("Approval action processed successfully");

            // Refresh the approvals for that user
            const userId = actionDialog.approval.assignTo?._id;
            if (userId) {
                setLoadingUsers((prev) => new Set(prev).add(userId));
                const result = await dispatch(fetchUserApprovalsById(userId)).unwrap();
                const approvalsData = (result as any)?.data || result;
                setUserApprovalsMap((prev) => ({
                    ...prev,
                    [userId]: Array.isArray(approvalsData)
                        ? approvalsData
                        : approvalsData
                            ? [approvalsData]
                            : [],
                }));
                setLoadingUsers((prev) => {
                    const s = new Set(prev);
                    s.delete(userId);
                    return s;
                });
            }
        } catch (e: any) {
            console.error("Action failed:", e);
            toast.error(e?.message || "Failed to process action");
        } finally {
            setActionDialog((prev) => ({ ...prev, isLoading: false }));
        }
    };

    // Function to toggle reason validity (LOCAL STATE ONLY)
    const toggleReasonValidity = () => {
        if (!actionDialog.approval) return;

        const newIsValid = !actionDialog.approval.submissionId.reason.isValid;

        // Update local state only - no API call
        setActionDialog((prev) => ({
            ...prev,
            approval: {
                ...prev.approval,
                submissionId: {
                    ...prev.approval.submissionId,
                    reason: {
                        ...prev.approval.submissionId.reason,
                        isValid: newIsValid,
                    },
                },
            },
        }));

        toast.success(`Reason marked as ${newIsValid ? "valid" : "invalid"}`);
    };

    // Stats from loaded approvals
    const currentStats = useMemo(() => {
        let totalRequests = 0;
        let pendingApprovals = 0;
        let approved = 0;
        let rejected = 0;
        let fraudCases = 0;

        // Use global managerApprovals for overall stats
        const sourceList = approvalState.managerApprovals.length > 0
            ? approvalState.managerApprovals
            : Object.values(userApprovalsMap).flat();

        sourceList.forEach((a) => {
            totalRequests++;
            if (a.status === "Pending") pendingApprovals++;
            if (a.status === "Approved") approved++;
            if (a.status === "Rejected") rejected++;
            if (a.status === "Fraud") fraudCases++;
        });
        return {
            totalRequests,
            pendingApprovals,
            approvedToday: approved,
            rejectedThisWeek: rejected,
            fraudCases,
        };
    }, [userApprovalsMap]);

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] p-[40px] space-y-8">
            {/* Header */}
            <div className="flex flex-col">
                <h1 className="text-[20px] font-semibold text-[#1e293b] dark:text-white">Approval Queue</h1>
                <p className="text-[#9CA3AF] text-[12px] dark:text-gray-400">Admin Dashboard — Select a Department</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {[
                    { title: "Total Requests", value: currentStats.totalRequests, sub: "Requests in current view", icon: <Tally4 className="h-[16px] w-[16px]" />, iconBg: "bg-[#EDEDED] text-[#1F2937]", textColor: "text-[#1F2937]" },
                    { title: "Pending Approvals", value: currentStats.pendingApprovals, sub: "Action required", icon: <Hourglass className="h-[16px] w-[16px]" />, iconBg: "bg-yellow-50 text-yellow-500", textColor: "text-yellow-600" },
                    { title: "Approved", value: currentStats.approvedToday, sub: "Approved in current view", icon: <CheckCircle2 className="h-[16px] w-[16px]" />, iconBg: "bg-emerald-50 text-emerald-500", textColor: "text-emerald-600" },
                    { title: "Rejected", value: currentStats.rejectedThisWeek, sub: "Rejected in current view", icon: <XCircle className="h-[16px] w-[16px]" />, iconBg: "bg-red-50 text-red-500", textColor: "text-red-600" },
                    { title: "Fraud Cases", value: currentStats.fraudCases, sub: "Flagged as fraudulent", icon: <AlertTriangle className="h-[16px] w-[16px]" />, iconBg: "bg-red-50 text-red-600", textColor: "text-red-600" }
                ].map((stat, i) => (
                    <Card key={i} className="h-[138px] border border-[#E5E7EB] shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white dark:bg-slate-900 rounded-[10px] overflow-hidden p-[20px] pt-[24px] flex flex-col justify-between animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="flex justify-between items-start">
                            <span className="text-[12px] font-medium text-[#9CA3AF]">{stat.title}</span>
                            <div className={`h-[24px] w-[24px] flex items-center justify-center rounded-[6px] ${stat.iconBg}`}>
                                {stat.icon}
                            </div>
                        </div>
                        <div className="space-y-[2px]">
                            <div className={`text-[14px] font-medium ${stat.textColor} dark:text-white`}>
                                {stat.value}
                            </div>
                            <p className="text-[10px] text-[#4B5563] font-normal leading-tight">{stat.sub}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card className="border border-[#E5E7EB] shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white dark:bg-slate-900 rounded-[10px] overflow-hidden p-0 gap-0">
                <div className="px-[20px] dark:border-slate-800 flex items-center pt-[20px]">
                    <h3 className="text-[16px] font-medium text-[#0F172A] dark:text-white">Filter & Search Options</h3>
                </div>
                <CardContent className="p-[20px]">
                    <div className="flex flex-col gap-6 md:flex-row md:items-end">
                        <div className="flex-1 space-y-1">
                            <Label htmlFor="search" className="text-[10px] font-medium tracking-wider text-[#334155]">Search Users</Label>
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                                <Input
                                    id="search"
                                    placeholder="Search by username or email"
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange("search", e.target.value)}
                                    className="h-[36px] pl-10 text-[10px] text-[#1F2937] font-normal border-[#E5E7EB] rounded-[10px] bg-white dark:bg-slate-800 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#9CA3AF]"
                                />
                            </div>
                        </div>

                        <div className="w-full md:w-[240px] space-y-1">
                            <Label className="text-[10px] font-medium tracking-wider text-[#334155]">Department</Label>
                            <Select
                                value={selectedDepartment}
                                onValueChange={setSelectedDepartment}
                            >
                                <SelectTrigger className="h-[36px] w-full text-[10px] text-[#1F2937] font-normal border-[#E5E7EB] bg-white dark:bg-slate-800 focus:ring-0 focus:ring-offset-0">
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent position="popper" side="bottom" sideOffset={4} avoidCollisions={false} className="border-[#E5E7EB] dark:border-slate-800 [&>button]:hidden">
                                    <SelectItem value="all" className="text-[10px] py-1">All Departments</SelectItem>
                                    {availableDepartments.map((d: any) => (
                                        <SelectItem key={d._id} value={d._id} className="text-[10px] py-1">
                                            {d.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full md:w-[180px] space-y-1">
                            <Label className="text-[10px] font-medium tracking-wider text-[#334155]">Status Filter</Label>
                            <Select
                                value={filters.status || "all"}
                                onValueChange={(v) =>
                                    handleFilterChange("status", v === "all" ? "" : v)
                                }
                            >
                                <SelectTrigger className="h-[36px] w-full text-[10px] text-[#1F2937] font-normal border-[#E5E7EB] bg-white dark:bg-slate-800 focus:ring-0 focus:ring-offset-0">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent position="popper" side="bottom" sideOffset={4} avoidCollisions={false} className="border-[#E5E7EB] dark:border-slate-800 [&>button]:hidden">
                                    <SelectItem value="all" className="text-[10px] py-1">All Status</SelectItem>
                                    <SelectItem value="Pending" className="text-[10px] py-1 text-yellow-600">Pending</SelectItem>
                                    <SelectItem value="Approved" className="text-[10px] py-1 text-emerald-600">Approved</SelectItem>
                                    <SelectItem value="Rejected" className="text-[10px] py-1 text-red-600">Rejected</SelectItem>
                                    <SelectItem value="Fraud" className="text-[10px] py-1 text-red-700">Fraud</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setFilters({ search: "", status: "" });
                                setSelectedDepartment("all");
                            }}
                            className="h-[36px] px-6 text-[12px] font-medium text-slate-600 border-[#E5E7EB] hover:bg-slate-50 rounded-lg transition-all"
                        >
                            Clear Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Members + Approvals */}
            <Card className="border-[#E5E7EB] shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white dark:bg-slate-900 rounded-[10px] overflow-hidden p-0 gap-0">
                <div className="h-[60px] px-[20px] border-b border-[#E5E7EB] dark:border-slate-800 flex justify-between items-center bg-[#F0F0F0]/80">
                    <div className="flex items-center gap-2">
                        <h3 className="text-[16px] font-medium text-[#1F2937] dark:text-white">Department Members</h3>
                        <span className="text-[12px] text-slate-400">({Object.keys(userApprovalsMap).length} with approval requests loaded)</span>
                    </div>
                    <span className="text-[12px] font-medium text-[#4B5563]">Total: {filteredUsers.length}</span>
                </div>
                <CardContent className="p-0">
                    {filteredUsers.length > 0 ? (
                        <Accordion
                            type="single"
                            collapsible
                            value={openUserId}
                            onValueChange={(val) => setOpenUserId(val || undefined)}
                            className="w-full"
                        >
                            {filteredUsers.map((user) => {
                                const userId = user?.user_id?._id || user?._id;
                                if (!userId) return null;

                                const name = user.user_id?.name || "Unknown";
                                const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                                const role = user.roleDefinitionId?.roleName || "Member";
                                const email = user?.user_id?.email || "";

                                const approvals = userApprovalsMap[userId] || [];
                                const filteredApprovals = filters.status
                                    ? approvals.filter((a) => a.status === filters.status)
                                    : approvals;

                                return (
                                    <AccordionItem value={userId} key={userId} className="border-b border-[#E5E7EB] last:border-0">
                                        <AccordionTrigger className="hover:no-underline px-6 py-4 flex justify-between items-center w-full cursor-pointer [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-slate-400">
                                            <div className="flex items-center gap-4 text-left">
                                                <div className="h-10 w-10 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[14px] font-semibold text-[#4B5563]">
                                                    {initials}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="text-[14px] font-bold text-[#1F2937] dark:text-white leading-none">{name}</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-medium text-[#334155]">Role: {role}</span>
                                                        <span className="text-slate-200">|</span>
                                                        <span className="text-[10px] text-slate-400">{email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="p-[20px]">
                                            {loadingUsers.has(userId) ? (
                                                <div className="flex flex-col items-center justify-center py-12 gap-4">
                                                    <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                                                    <p className="text-sm text-muted-foreground">Loading approval requests...</p>
                                                </div>
                                            ) : filteredApprovals.length > 0 ? (
                                                <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
                                                    <Table>
                                                        <TableHeader className="bg-slate-50/80">
                                                            <TableRow className="border-slate-100 italic">
                                                                <TableHead className="text-[10px] uppercase font-bold text-slate-800">Task Title</TableHead>
                                                                <TableHead className="text-[10px] uppercase font-bold text-slate-800">Manager</TableHead>
                                                                <TableHead className="text-[10px] uppercase font-bold text-slate-800">Department</TableHead>
                                                                <TableHead className="text-[10px] uppercase font-bold text-slate-800">Signal</TableHead>
                                                                <TableHead className="text-[10px] uppercase font-bold text-slate-800">Date</TableHead>
                                                                <TableHead className="text-[10px] uppercase font-bold text-slate-800">Status</TableHead>
                                                                <TableHead className="text-[10px] uppercase font-bold text-slate-800 text-right">Actions</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {filteredApprovals.map((approval) => {
                                                                const assignBy =
                                                                    typeof approval.assignBy === "string"
                                                                        ? { name: "Unknown", email: "" }
                                                                        : approval.assignBy;
                                                                const department = approval.taskAssignId
                                                                    ?.department_id || { name: "Unknown" };

                                                                return (
                                                                    <TableRow key={approval._id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                                        <TableCell>
                                                                            <div
                                                                                className="text-[13px] font-medium text-slate-700 max-w-[220px] truncate"
                                                                                title={
                                                                                    approval.taskAssignId?.title || ""
                                                                                }
                                                                            >
                                                                                {approval.taskAssignId?.title ||
                                                                                    "No Title"}
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div>
                                                                                <div className="text-[13px] font-semibold text-slate-800">
                                                                                    {assignBy?.name || "Unknown"}
                                                                                </div>
                                                                                <div className="text-[11px] text-slate-400">
                                                                                    {assignBy?.email || ""}
                                                                                </div>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="text-[13px] text-slate-600">
                                                                                {department?.name || "Unknown"}
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className={`h-2 w-2 rounded-full ${approval.signalColor === "Green"
                                                                                ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                                                                                : approval.signalColor === "Yellow"
                                                                                    ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]"
                                                                                    : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                                                                                }`} />
                                                                        </TableCell>
                                                                        <TableCell className="text-[12px] text-slate-500">
                                                                            {approval.createdAt
                                                                                ? new Date(approval.createdAt).toLocaleDateString(undefined, {
                                                                                    month: 'short',
                                                                                    day: 'numeric',
                                                                                    year: 'numeric'
                                                                                })
                                                                                : "—"}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {getStatusBadge(
                                                                                approval.status,
                                                                                approval.signalColor
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="flex items-center justify-end gap-2 text-right">
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                                                                                    onClick={(e) =>
                                                                                        handleQuickView(approval, e)
                                                                                    }
                                                                                >
                                                                                    <Eye className="h-4 w-4" />
                                                                                </Button>
                                                                                {approval.status === "Pending" && (
                                                                                    <div className="flex gap-1">
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleAction(
                                                                                                    "approve",
                                                                                                    approval
                                                                                                );
                                                                                            }}
                                                                                        >
                                                                                            <Check className="h-4 w-4" />
                                                                                        </Button>
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleAction(
                                                                                                    "reject",
                                                                                                    approval
                                                                                                );
                                                                                            }}
                                                                                        >
                                                                                            <X className="h-4 w-4" />
                                                                                        </Button>
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                                                            title="Reverse"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleAction("reverse", approval);
                                                                                            }}
                                                                                        >
                                                                                            <RotateCcw className="h-4 w-4" />
                                                                                        </Button>
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                                                                                            title="Mark as Fraud"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleAction("fraud", approval);
                                                                                            }}
                                                                                        >
                                                                                            <AlertTriangle className="h-4 w-4" />
                                                                                        </Button>
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                                                            title="Delete Approval"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleAction("delete", approval);
                                                                                            }}
                                                                                        >
                                                                                            <Trash2 className="h-4 w-4" />
                                                                                        </Button>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed border-[#E5E7EB] rounded-[10px] bg-[#F5F8F7] animate-in zoom-in-95 duration-500">
                                                    <div className="h-[56px] w-[56px] rounded-full bg-white flex items-center justify-center text-[#1F2937] mb-4">
                                                        <FileText className="h-[24px] w-[24px]" />
                                                    </div>
                                                    <h4 className="text-[16px] font-medium text-[#64748B] mb-1">No approval requests found for this user.</h4>
                                                    <p className="text-[12px] text-[#94A3B8] text-center max-w-[300px]">Check back later or try adjusting your filters.</p>
                                                </div>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 px-6 animate-in fade-in duration-700">
                            <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-6">
                                <Users className="h-10 w-10" />
                            </div>
                            <h3 className="text-[18px] font-bold text-slate-800 mb-2">No matching users found</h3>
                            <p className="text-[14px] text-slate-400 text-center max-w-[320px]">
                                We couldn't find any members matching your current filters. Try searching for someone else or clearing the filters.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-8 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl px-8"
                                onClick={() => {
                                    setFilters({ search: "", status: "" });
                                    setSelectedDepartment("all");
                                }}
                            >
                                Reset All Filters
                            </Button>
                        </div>
                    )}
                </CardContent>
                <div className="h-[60px] border-t border-slate-50 bg-slate-50/30 flex items-center justify-center transition-colors hover:bg-slate-50/80 cursor-pointer group rounded-b-2xl">
                    <button className="flex items-center gap-2 text-[13px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                        Load more members
                        <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                    </button>
                </div>
            </Card>

            {/* Action Dialog */}
            <Dialog
                open={actionDialog.open}
                onOpenChange={(open) =>
                    !actionDialog.isLoading &&
                    setActionDialog((prev) => ({ ...prev, open }))
                }
            >
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            {actionDialog.type === "view" && "View Approval Details"}
                            {actionDialog.type === "approve" && "Approve Request"}
                            {actionDialog.type === "reject" && "Reject Request"}
                            {actionDialog.type === "override" && "Override Decision"}
                            {actionDialog.type === "reverse" && "Reverse Decision"}
                            {actionDialog.type === "fraud" && "Flag as Fraud"}
                            {actionDialog.type === "delete" && "Delete Approval Request"}
                        </DialogTitle>
                        <DialogDescription>
                            {actionDialog.type === "view" &&
                                "Review the approval request details."}
                            {actionDialog.type === "approve" &&
                                "Add any comments for this approval."}
                            {actionDialog.type === "reject" &&
                                "Please provide a reason for rejection."}
                            {actionDialog.type === "override" &&
                                "Override the previous decision with a new status."}
                            {actionDialog.type === "reverse" &&
                                "Reverse the current submission and reset the task to Todo."}
                            {actionDialog.type === "fraud" &&
                                "Mark this submission as fraudulent. This will flag the user."}
                            {actionDialog.type === "delete" &&
                                "Are you sure you want to permanently delete this request? This cannot be undone."}
                        </DialogDescription>

                    </DialogHeader>

                    {actionDialog.approval && (
                        <ScrollArea className="flex-1 overflow-y-auto pr-4">
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right font-medium">User:</Label>
                                    <div className="col-span-3">
                                        <div className="font-medium">
                                            {typeof actionDialog.approval.assignTo === "string"
                                                ? "Unknown"
                                                : actionDialog.approval.assignTo?.name || "Unknown"}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {typeof actionDialog.approval.assignTo === "string"
                                                ? ""
                                                : actionDialog.approval.assignTo?.email || ""}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right font-medium">Manager:</Label>
                                    <div className="col-span-3">
                                        <div className="font-medium">
                                            {typeof actionDialog.approval.assignBy === "string"
                                                ? "Unknown"
                                                : actionDialog.approval.assignBy?.name || "Unknown"}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {typeof actionDialog.approval.assignBy === "string"
                                                ? ""
                                                : actionDialog.approval.assignBy?.email || ""}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right font-medium">Department:</Label>
                                    <div className="col-span-3">
                                        <div className="font-medium">
                                            {actionDialog.approval.taskAssignId?.department_id
                                                ?.name || "Unknown"}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right font-medium">Task:</Label>
                                    <div className="col-span-3">
                                        <div className="font-medium">
                                            {actionDialog.approval.taskAssignId?.title || "No Title"}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right font-medium">Signal:</Label>
                                    <div className="col-span-3">
                                        <Badge
                                            variant="outline"
                                            className={
                                                actionDialog.approval.signalColor === "Green"
                                                    ? "border-green-500 text-green-700"
                                                    : actionDialog.approval.signalColor === "Yellow"
                                                        ? "border-yellow-500 text-yellow-700"
                                                        : "border-red-500 text-red-700"
                                            }
                                        >
                                            {actionDialog.approval.signalColor || "None"}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right font-medium">Status:</Label>
                                    <div className="col-span-3">
                                        {getStatusBadge(
                                            actionDialog.approval.status,
                                            actionDialog.approval.signalColor
                                        )}
                                    </div>
                                </div>

                                {/* {actionDialog.approval.submissionId?.submission_data && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right font-medium pt-2">Submission Data:</Label>
                  <div className="col-span-3">
                    <div className="space-y-2">
                      {actionDialog.approval.submissionId.submission_data.map((item, index) => (
                        <div key={index} className="p-2 border rounded-md">
                          <div className="font-medium">{item.field_name || item.fieldName || `Field ${index + 1}`}</div>
                          <div className="text-sm text-muted-foreground">Type: {item.proof_type || item.type}</div>
                          {item.url && (
                            <div className="mt-1">
                              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                                {item.original_name || "View Link"} <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            </div>
                          )}
                          {item.text && <div className="mt-1 text-sm">{item.text}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )} */}

                                {actionDialog.approval.submissionId?.submission_data && (
                                    <div className="grid grid-cols-4 items-start gap-4">
                                        <Label className="text-right font-medium pt-2">
                                            Submission Data:
                                        </Label>
                                        <div className="col-span-3">
                                            <div className="space-y-2">
                                                {actionDialog.approval.submissionId.submission_data.map(
                                                    (item: { field_name: any; fieldName: any; proof_type: any; type: any; url: string | undefined; original_name: any; text: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }, index: number) => (
                                                        <div key={index} className="p-2 border rounded-md">
                                                            <div className="font-medium">
                                                                {item.field_name ||
                                                                    item.fieldName ||
                                                                    `Field ${index + 1}`}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                Type: {item.proof_type || item.type}
                                                            </div>
                                                            {item.url && (
                                                                <div className="mt-1">
                                                                    <a
                                                                        href={item.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-blue-600 hover:underline flex items-center"
                                                                    >
                                                                        {item.original_name || "View Link"}{" "}
                                                                        <ExternalLink className="ml-1 h-3 w-3" />
                                                                    </a>
                                                                </div>
                                                            )}
                                                            {item.text && (
                                                                <div className="mt-1 text-sm">{item.text}</div>
                                                            )}
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {actionDialog.approval.submissionId?.reason && (
                                    <div className="grid grid-cols-4 items-start gap-4">
                                        {/* <Label className="text-right font-medium">Submission Reason:</Label> */}
                                        <div className="col-span-3">
                                            {/* <div className="text-sm bg-muted p-2 rounded">
                        {actionDialog.approval.submissionId.reason.message}
                      </div> */}
                                            {typeof actionDialog.approval.submissionId.reason
                                                .isValid !== "undefined" && (
                                                    <div className="flex items-center justify-between mt-2">
                                                        <div
                                                            className={`font-semibold ${actionDialog.approval.submissionId.reason.isValid
                                                                ? "text-green-600"
                                                                : "text-red-600"
                                                                }`}
                                                        >
                                                            {actionDialog.approval.submissionId.reason.isValid
                                                                ? "Valid"
                                                                : "Invalid"}
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={toggleReasonValidity}
                                                            className={`ml-2 ${actionDialog.approval.submissionId.reason.isValid
                                                                ? "hover:bg-red-50 hover:text-red-600"
                                                                : "hover:bg-green-50 hover:text-green-600"
                                                                }`}
                                                        >
                                                            Mark as{" "}
                                                            {actionDialog.approval.submissionId.reason.isValid
                                                                ? "Invalid"
                                                                : "Valid"}
                                                        </Button>
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                )}

                                {/* {
                actionDialog.approval.submissionId.comment && (
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className=" font-medium">Submission Comment:</Label>
                    <div className="col-span-3">
                      <div className="text-sm bg-muted p-2 rounded">{actionDialog.approval.submissionId.comment}</div>
                    </div>
                  </div>
                )
              } */}
                                {actionDialog.approval.submissionId.reason && (
                                    <div className="grid grid-cols-4 items-start gap-4">
                                        <Label className=" font-medium">Overdue Reason:</Label>
                                        <div className="col-span-3">
                                            <div className="text-sm bg-muted p-2 rounded">
                                                {actionDialog.approval.submissionId.reason.message}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {actionDialog.approval.comment && (
                                    <div className="grid grid-cols-4 items-start gap-4">
                                        <Label className="text-right font-medium">
                                            Senior's Comment:
                                        </Label>
                                        <div className="col-span-3">
                                            <div className="text-sm bg-muted p-2 rounded">
                                                {actionDialog.approval.comment}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {actionDialog.approval.reason && (
                                    <div className="grid grid-cols-4 items-start gap-4">
                                        <Label className="text-right font-medium">
                                            Senior's Reason:
                                        </Label>
                                        <div className="col-span-3">
                                            <div className="text-sm bg-muted p-2 rounded">
                                                {actionDialog.approval.reason}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {actionDialog.type !== "view" && (
                                    <>
                                        {actionDialog.type === "override" && (
                                            <div className="grid gap-2">
                                                <Label htmlFor="overrideStatus">
                                                    Override Status *
                                                </Label>
                                                <Select
                                                    value={overrideStatus}
                                                    onValueChange={(v) =>
                                                        setOverrideStatus(v as "Approved" | "Rejected" | "Fraud")
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Approved">Approved</SelectItem>
                                                        <SelectItem value="Rejected">Rejected</SelectItem>
                                                        <SelectItem value="Fraud">Fraud</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                        {(actionDialog.type === "reject" ||
                                            actionDialog.type === "override") && (
                                                <div className="grid gap-2">
                                                    <Label htmlFor="reason">Reason *</Label>
                                                    <Textarea
                                                        id="reason"
                                                        placeholder="Please provide a reason..."
                                                        value={actionReason}
                                                        onChange={(e) => setActionReason(e.target.value)}
                                                    />
                                                </div>
                                            )}
                                        {/* <div className="grid gap-2">
                    <Label htmlFor="comment">Comment</Label>
                    <Textarea id="comment" placeholder="Add any additional comments..." value={actionComment} onChange={(e) => setActionComment(e.target.value)} />
                  </div> */}
                                    </>
                                )}
                            </div>
                        </ScrollArea>
                    )}

                    <DialogFooter className="mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                setActionDialog((prev) => ({ ...prev, open: false }))
                            }
                        >
                            {actionDialog.type === "view" ? "Close" : "Cancel"}
                        </Button>
                        {actionDialog.type !== "view" && (
                            <Button
                                type="button"
                                variant={
                                    actionDialog.type === "delete" || actionDialog.type === "fraud"
                                        ? "destructive"
                                        : "default"
                                }
                                onClick={submitAction}
                                disabled={
                                    loading ||
                                    ((actionDialog.type === "reject" ||
                                        actionDialog.type === "override" ||
                                        actionDialog.type === "fraud") &&
                                        !actionReason.trim())
                                }
                            >
                                {loading
                                    ? "Processing..."
                                    : actionDialog.type === "delete"
                                        ? "Delete Permanently"
                                        : actionDialog.type === "fraud"
                                            ? "Flag as Fraud"
                                            : "Confirm Action"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ApprovalQueue;
