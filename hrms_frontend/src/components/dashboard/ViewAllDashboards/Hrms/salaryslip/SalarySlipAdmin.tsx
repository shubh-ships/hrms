"use client";
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import {
    generateSalarySlipForUser,
    selectSalarySlip,
    selectSalarySlipLoading,
    selectSalarySlipError,
    clearSalarySlip,
    clearError
} from '@/features/salarySlip/salarySlip';
import { selectUsers, fetchUsers, selectUsersLoading } from '@/features/user/userSlice';
import {
    Card,
    CardContent,
    CardDescription,
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
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Search,
    Calendar,
    DollarSign,
    Download,
    Eye,
    Users,
    Clock,
    TrendingUp,
    FileText,
    Building,
    RefreshCw,
    Loader2,
    AlertCircle,
    MapPin,
    User,
    Briefcase,
    Banknote,
    CalendarDays,
    Calculator,
    FileSpreadsheet,
    Receipt,
    Percent,
    Clock8,
    LogOut,
    Coffee,
    AlertTriangle,
    Info,
    X,
    Moon,
    Sun,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTheme } from "next-themes";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Updated interfaces to match the new API response structure
interface SalarySlipResponseData {
    success: boolean;
    message: string;
    data: {
        employeeDetails: {
            employeeId: string;
            employeeCode: string;
            name: string;
            joinDate: string;
            workType: string;
        };
        salaryPeriod: {
            month: string;
            monthNumber: number;
            year: number;
            fromDate: string;
            toDate: string;
        };
        attendanceSummary: {
            totalWorkingDays: number;
            presentDays: number;
            paidLeaves: number;
            unpaidLeaves: number;
        };
        earnings: {
            basic: number;
            hra: number;
            allowances: number;
            overtimePay: number;
            totalEarnings: number;
        };
        deductions: {
            salaryDeduction: number;
            policyDeductions: number;
            otherDeductions: number;
            totalDeductions: number;
        };
        policyDetails: {
            deductions: {
                summary: {
                    lateEntryDeductions: number;
                    earlyLeaveDeductions: number;
                    breakDeductions: number;
                    total: number;
                };
                dailyDetails: Array<{
                    date: string;
                    lateEntry: {
                        deduction: number;
                        ruleApplied: string | null;
                        violationMinutes: number;
                        occurrenceCount: number;
                        totalMinutes: number;
                        isOccurrenceRule: boolean;
                        occurrenceType: string;
                        occurrenceValue: number;
                    };
                    earlyLeave: {
                        deduction: number;
                        ruleApplied: string | null;
                        violationMinutes: number;
                        occurrenceCount: number;
                        totalMinutes: number;
                        isOccurrenceRule: boolean;
                        occurrenceType: string;
                        occurrenceValue: number;
                    };
                    breaks: {
                        deduction: number;
                        ruleApplied: string | null;
                        violationMinutes: number;
                        occurrenceCount: number;
                        totalMinutes: number;
                        isOccurrenceRule: boolean;
                        occurrenceType: string;
                        occurrenceValue: number;
                    };
                }>;
                occurrenceCounters: {
                    late_entry: Record<string, any>;
                    early_leave: Record<string, any>;
                    breaks: Record<string, any>;
                };
            };
            overtime: {
                summary: {
                    regularOvertimePay: number;
                    earlyOvertimePay: number;
                    total: number;
                };
                dailyDetails: any[];
                occurrenceCounters: {
                    overtime: Record<string, any>;
                    early_overtime: Record<string, any>;
                };
            };
        };
        calculation: {
            perDayRate: number;
            perDayFormula: string;
            workingDaysFormula: string;
        };
        netSalary: number;
        bankDetails: {
            accountHolderName: string;
            accountNumber: string;
            bankName: string;
            ifsc: string;
        };
        generatedAt: string;
        calculationNotes: string;
    };
}

interface UserData {
    _id: string;
    user_id: {
        _id: string;
        name: string;
        email: string;
        phoneNumber?: number;
        isActive: boolean;
        isFreezed: boolean;
        is_organizer: boolean;
        is_superuser: boolean;
    };
    roleDefinitionId: {
        _id: string;
        roleName: string;
        hierarchyLevel?: number;
        permissions?: string[];
    };
    departments: Array<{
        _id: string;
        name: string;
        alias: string;
    }>;
    parentRoleId?: {
        _id: string;
        user_id: {
            _id: string;
            name: string;
            email: string;
        };
        roleDefinitionId: {
            _id: string;
            roleName: string;
        };
    };
    status: string;
    history: any[];
}

// Salary Slip Details Component for Show Details Modal
const SalarySlipDetails = ({
                               salaryData,
                               selectedUser
                           }: {
    salaryData: SalarySlipResponseData['data'];
    selectedUser: UserData;
}) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    const getPolicyViolationStats = () => {
        const stats = {
            lateEntries: 0,
            earlyLeaves: 0,
            breakViolations: 0,
            totalPolicyViolations: 0
        };

        salaryData.policyDetails.deductions.dailyDetails.forEach(day => {
            if (day.lateEntry.deduction > 0) stats.lateEntries++;
            if (day.earlyLeave.deduction > 0) stats.earlyLeaves++;
            if (day.breaks.deduction > 0) stats.breakViolations++;
            if (day.lateEntry.deduction > 0 || day.earlyLeave.deduction > 0 || day.breaks.deduction > 0) {
                stats.totalPolicyViolations++;
            }
        });

        return stats;
    };

    const policyStats = getPolicyViolationStats();

    // State for daily details pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(salaryData.policyDetails.deductions.dailyDetails.filter(day =>
        day.lateEntry.deduction > 0 || day.earlyLeave.deduction > 0 || day.breaks.deduction > 0
    ).length / itemsPerPage);

    const filteredDailyDetails = salaryData.policyDetails.deductions.dailyDetails
        .filter(day => day.lateEntry.deduction > 0 || day.earlyLeave.deduction > 0 || day.breaks.deduction > 0)
        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 space-y-6 md:space-y-8 lg:space-y-10">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
                    <Avatar className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 border-4 border-white dark:border-gray-800 shadow-lg">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl sm:text-2xl md:text-2xl font-extrabold select-none">
                            {selectedUser.user_id.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">{salaryData.employeeDetails.name}</h1>
                        <p className="text-sm md:text-lg text-gray-600 dark:text-gray-300 mt-1 break-words">{selectedUser.user_id.email}</p>
                        <div className="flex flex-wrap gap-2 md:gap-3 mt-2 md:mt-3">
                            <Badge variant="outline" className="text-xs md:text-sm px-3 md:px-4 py-1 uppercase tracking-wide font-semibold dark:bg-gray-800 dark:text-gray-200">
                                {selectedUser.roleDefinitionId.roleName}
                            </Badge>
                            <Badge variant="secondary" className="text-xs md:text-sm px-3 md:px-4 py-1 font-semibold">
                                {salaryData.employeeDetails.workType}
                            </Badge>
                            <Badge variant="default" className="text-xs md:text-sm px-3 md:px-4 py-1 bg-green-600 text-white font-semibold">
                                {salaryData.employeeDetails.employeeCode}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="text-right bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-300 dark:border-gray-600 px-4 md:px-6 py-4 md:py-5 w-full md:w-auto">
                    <p className="text-xl md:text-2xl lg:text-3xl font-bold text-blue-700 dark:text-blue-400">
                        {salaryData.salaryPeriod.month} {salaryData.salaryPeriod.year}
                    </p>
                    <p className="text-xs md:text-sm font-semibold text-gray-500 dark:text-gray-400">Pay Period</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {formatDate(salaryData.salaryPeriod.fromDate)} - {formatDate(salaryData.salaryPeriod.toDate)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                        Generated: {formatDateTime(salaryData.generatedAt)}
                    </p>
                </div>
            </header>

            <Separator className="my-6 md:my-8 dark:bg-gray-700" />

            {/* Employee & Period Info */}
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
                {/* Employee Info Card */}
                <Card className="shadow-lg border border-blue-200 dark:border-blue-800 rounded-lg">
                    <CardHeader className="pb-4 md:pb-5 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-t-lg">
                        <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center gap-2 md:gap-3 text-blue-800 dark:text-blue-300 font-semibold">
                            <div className="p-1 md:p-2 bg-blue-600 rounded-lg">
                                <User className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
                            </div>
                            Employee Information
                        </CardTitle>
                        <p className="text-xs md:text-sm text-blue-700 dark:text-blue-400 mt-1 font-medium">Personal & Work Details</p>
                    </CardHeader>
                    <CardContent className="pt-4 md:pt-6 space-y-3 md:space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 text-gray-900 dark:text-gray-100">
                            <div>
                                <label className="block text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Employee ID</label>
                                <div className="text-sm md:text-lg font-bold font-mono break-words">{salaryData.employeeDetails.employeeId}</div>
                            </div>
                            <div>
                                <label className="block text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Employee Code</label>
                                <div className="text-sm md:text-lg font-bold break-words">{salaryData.employeeDetails.employeeCode}</div>
                            </div>
                            <div>
                                <label className="block text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Join Date</label>
                                <div className="text-sm md:text-lg font-bold">{formatDate(salaryData.employeeDetails.joinDate)}</div>
                            </div>
                            <div>
                                <label className="block text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Work Type</label>
                                <div className="text-sm md:text-lg font-bold">{salaryData.employeeDetails.workType}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Period & Attendance Card */}
                <Card className="shadow-lg border border-green-200 dark:border-green-800 rounded-lg">
                    <CardHeader className="pb-4 md:pb-5 bg-gradient-to-r from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-800/30 rounded-t-lg">
                        <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center gap-2 md:gap-3 text-green-800 dark:text-green-300 font-semibold">
                            <div className="p-1 md:p-2 bg-green-600 rounded-lg">
                                <Calendar className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
                            </div>
                            Attendance Summary
                        </CardTitle>
                        <p className="text-xs md:text-sm text-green-700 dark:text-green-400 mt-1 font-medium">Working & Payable Days</p>
                    </CardHeader>
                    <CardContent className="pt-4 md:pt-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                            <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 border border-green-300 dark:border-green-700 shadow-sm">
                                <div className="text-lg md:text-2xl lg:text-3xl font-extrabold text-green-600 dark:text-green-400 mb-1 md:mb-2">{salaryData.attendanceSummary.totalWorkingDays}</div>
                                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 font-semibold">Total Working Days</div>
                            </div>
                            <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 border border-green-300 dark:border-green-700 shadow-sm">
                                <div className="text-lg md:text-2xl lg:text-3xl font-extrabold text-green-600 dark:text-green-400 mb-1 md:mb-2">{salaryData.attendanceSummary.presentDays}</div>
                                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 font-semibold">Present Days</div>
                            </div>
                            <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 border border-yellow-300 dark:border-yellow-700 shadow-sm">
                                <div className="text-lg md:text-2xl lg:text-3xl font-extrabold text-yellow-600 dark:text-yellow-400 mb-1 md:mb-2">{salaryData.attendanceSummary.paidLeaves}</div>
                                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 font-semibold">Paid Leaves</div>
                            </div>
                            <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 border border-red-300 dark:border-red-700 shadow-sm">
                                <div className="text-lg md:text-2xl lg:text-3xl font-extrabold text-red-600 dark:text-red-400 mb-1 md:mb-2">{salaryData.attendanceSummary.unpaidLeaves}</div>
                                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 font-semibold">Unpaid Leaves</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Earnings & Deductions */}
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 lg:gap-10 mt-6 md:mt-8 lg:mt-10">
                {/* Earnings */}
                <Card className="shadow-lg border border-green-300 dark:border-green-700 rounded-lg">
                    <CardHeader className="pb-4 md:pb-5 bg-gradient-to-r from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-800/30 rounded-t-lg border-b border-green-300 dark:border-green-700">
                        <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center gap-2 md:gap-3 text-green-800 dark:text-green-300 font-semibold">
                            <div className="p-1 md:p-2 bg-green-600 rounded-lg">
                                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
                            </div>
                            Earnings
                        </CardTitle>
                        <p className="text-xs md:text-sm text-green-700 dark:text-green-400 mt-1 font-medium">Salary Components & Benefits</p>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-green-50 dark:bg-green-900/20 hover:bg-green-50 dark:hover:bg-green-900/30">
                                    <TableHead className="text-green-800 dark:text-green-300 font-bold py-3 md:py-4">Component</TableHead>
                                    <TableHead className="text-green-800 dark:text-green-300 font-bold py-3 md:py-4 text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow className="hover:bg-green-50/50 dark:hover:bg-green-900/10">
                                    <TableCell className="py-3 md:py-4">
                                        <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">Basic Salary</div>
                                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">Base salary component</p>
                                    </TableCell>
                                    <TableCell className="py-3 md:py-4 text-right font-bold text-green-700 dark:text-green-400 text-base md:text-lg">
                                        {formatCurrency(salaryData.earnings.basic)}
                                    </TableCell>
                                </TableRow>
                                <TableRow className="hover:bg-green-50/50 dark:hover:bg-green-900/10">
                                    <TableCell className="py-3 md:py-4">
                                        <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">HRA (House Rent Allowance)</div>
                                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">Housing allowance</p>
                                    </TableCell>
                                    <TableCell className="py-3 md:py-4 text-right font-bold text-green-700 dark:text-green-400 text-base md:text-lg">
                                        {formatCurrency(salaryData.earnings.hra)}
                                    </TableCell>
                                </TableRow>
                                <TableRow className="hover:bg-green-50/50 dark:hover:bg-green-900/10">
                                    <TableCell className="py-3 md:py-4">
                                        <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">Other Allowances</div>
                                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">Additional allowances</p>
                                    </TableCell>
                                    <TableCell className="py-3 md:py-4 text-right font-bold text-green-700 dark:text-green-400 text-base md:text-lg">
                                        {formatCurrency(salaryData.earnings.allowances)}
                                    </TableCell>
                                </TableRow>
                                <TableRow className="hover:bg-green-50/50 dark:hover:bg-green-900/10">
                                    <TableCell className="py-3 md:py-4">
                                        <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">Overtime Pay</div>
                                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">Extra hours worked</p>
                                    </TableCell>
                                    <TableCell className="py-3 md:py-4 text-right font-bold text-green-700 dark:text-green-400 text-base md:text-lg">
                                        {formatCurrency(salaryData.earnings.overtimePay)}
                                    </TableCell>
                                </TableRow>
                                <TableRow className="bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border-t-2 border-green-300 dark:border-green-700">
                                    <TableCell className="py-3 md:py-4 font-bold text-green-900 dark:text-green-300 text-base md:text-lg">Total Earnings</TableCell>
                                    <TableCell className="py-3 md:py-4 text-right font-bold text-green-900 dark:text-green-300 text-lg md:text-xl">
                                        {formatCurrency(salaryData.earnings.totalEarnings)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Deductions */}
                <Card className="shadow-lg border border-red-300 dark:border-red-700 rounded-lg">
                    <CardHeader className="pb-4 md:pb-5 bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 rounded-t-lg border-b border-red-300 dark:border-red-700">
                        <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center gap-2 md:gap-3 text-red-800 dark:text-red-300 font-semibold">
                            <div className="p-1 md:p-2 bg-red-600 rounded-lg">
                                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
                            </div>
                            Deductions
                        </CardTitle>
                        <p className="text-xs md:text-sm text-red-700 dark:text-red-400 mt-1 font-medium">Taxes & Other Deductions</p>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-red-50 dark:bg-red-900/20 hover:bg-red-50 dark:hover:bg-red-900/30">
                                    <TableHead className="text-red-800 dark:text-red-300 font-bold py-3 md:py-4">Component</TableHead>
                                    <TableHead className="text-red-800 dark:text-red-300 font-bold py-3 md:py-4 text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow className="hover:bg-red-50/50 dark:hover:bg-red-900/10">
                                    <TableCell className="py-3 md:py-4">
                                        <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">Salary Deduction</div>
                                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">Unpaid leaves deduction</p>
                                    </TableCell>
                                    <TableCell className="py-3 md:py-4 text-right font-bold text-red-700 dark:text-red-400 text-base md:text-lg">
                                        {formatCurrency(salaryData.deductions.salaryDeduction)}
                                    </TableCell>
                                </TableRow>
                                <TableRow className="hover:bg-red-50/50 dark:hover:bg-red-900/10">
                                    <TableCell className="py-3 md:py-4">
                                        <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">Policy Deductions</div>
                                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">Policy violations & penalties</p>
                                    </TableCell>
                                    <TableCell className="py-3 md:py-4 text-right font-bold text-red-700 dark:text-red-400 text-base md:text-lg">
                                        {formatCurrency(salaryData.deductions.policyDeductions)}
                                    </TableCell>
                                </TableRow>
                                <TableRow className="hover:bg-red-50/50 dark:hover:bg-red-900/10">
                                    <TableCell className="py-3 md:py-4">
                                        <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">Other Deductions</div>
                                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">Miscellaneous deductions</p>
                                    </TableCell>
                                    <TableCell className="py-3 md:py-4 text-right font-bold text-red-700 dark:text-red-400 text-base md:text-lg">
                                        {formatCurrency(salaryData.deductions.otherDeductions)}
                                    </TableCell>
                                </TableRow>
                                <TableRow className="bg-gradient-to-r from-red-50 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 border-t-2 border-red-300 dark:border-red-700">
                                    <TableCell className="py-3 md:py-4 font-bold text-red-900 dark:text-red-300 text-base md:text-lg">Total Deductions</TableCell>
                                    <TableCell className="py-3 md:py-4 text-right font-bold text-red-900 dark:text-red-300 text-lg md:text-xl">
                                        {formatCurrency(salaryData.deductions.totalDeductions)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </section>

            {/* Policy Deductions Details */}
            <Card className="shadow-lg border border-orange-300 dark:border-orange-700 rounded-lg">
                <CardHeader className="pb-4 md:pb-5 bg-gradient-to-r from-orange-100 to-amber-200 dark:from-orange-900/30 dark:to-amber-900/30 rounded-t-lg">
                    <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center gap-2 md:gap-3 text-orange-800 dark:text-orange-300 font-semibold">
                        <div className="p-1 md:p-2 bg-orange-600 rounded-lg">
                            <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
                        </div>
                        Policy Deductions Breakdown
                    </CardTitle>
                    <p className="text-xs md:text-sm text-orange-700 dark:text-orange-400 mt-1 font-medium">Late Entries, Early Leaves & Break Violations</p>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 md:p-5 border border-orange-200 dark:border-orange-800">
                            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                                <Clock8 className="w-4 h-4 md:w-5 md:h-5 text-orange-600 dark:text-orange-400" />
                                <h4 className="font-semibold text-orange-800 dark:text-orange-300 text-sm md:text-base">Late Entry Deductions</h4>
                            </div>
                            <div className="text-xl md:text-2xl lg:text-3xl font-bold text-orange-700 dark:text-orange-400 mb-1 md:mb-2">
                                {formatCurrency(salaryData.policyDetails.deductions.summary.lateEntryDeductions)}
                            </div>
                            <p className="text-xs md:text-sm text-orange-600 dark:text-orange-400">
                                {policyStats.lateEntries} late entry violation(s)
                            </p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 md:p-5 border border-red-200 dark:border-red-800">
                            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                                <LogOut className="w-4 h-4 md:w-5 md:h-5 text-red-600 dark:text-red-400" />
                                <h4 className="font-semibold text-red-800 dark:text-red-300 text-sm md:text-base">Early Leave Deductions</h4>
                            </div>
                            <div className="text-xl md:text-2xl lg:text-3xl font-bold text-red-700 dark:text-red-400 mb-1 md:mb-2">
                                {formatCurrency(salaryData.policyDetails.deductions.summary.earlyLeaveDeductions)}
                            </div>
                            <p className="text-xs md:text-sm text-red-600 dark:text-red-400">
                                {policyStats.earlyLeaves} early leave violation(s)
                            </p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 md:p-5 border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                                <Coffee className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
                                <h4 className="font-semibold text-purple-800 dark:text-purple-300 text-sm md:text-base">Break Violation Deductions</h4>
                            </div>
                            <div className="text-xl md:text-2xl lg:text-3xl font-bold text-purple-700 dark:text-purple-400 mb-1 md:mb-2">
                                {formatCurrency(salaryData.policyDetails.deductions.summary.breakDeductions)}
                            </div>
                            <p className="text-xs md:text-sm text-purple-600 dark:text-purple-400">
                                {policyStats.breakViolations} break violation(s)
                            </p>
                        </div>
                    </div>

                    {/* Daily Policy Details Table with Pagination */}
                    <div className="overflow-x-auto">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 md:mb-4 gap-3">
                            <h4 className="font-semibold text-base md:text-lg text-gray-700 dark:text-gray-300">Daily Violation Details</h4>

                            {totalPages > 1 && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="relative overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                            <Table>
                                <TableHeader className="bg-gray-50 dark:bg-gray-800">
                                    <TableRow>
                                        <TableHead className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300">Date</TableHead>
                                        <TableHead className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">Late Entry</TableHead>
                                        <TableHead className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">Early Leave</TableHead>
                                        <TableHead className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">Break Violation</TableHead>
                                        <TableHead className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 text-right">Total Deduction</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDailyDetails.map((day, index) => (
                                        <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <TableCell className="font-medium text-xs md:text-sm dark:text-gray-300 py-3">
                                                {formatDate(day.date)}
                                            </TableCell>
                                            <TableCell className="text-center py-3">
                                                {day.lateEntry.deduction > 0 ? (
                                                    <div className="inline-flex flex-col items-center">
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 text-xs"
                                                        >
                                                            {formatCurrency(day.lateEntry.deduction)}
                                                        </Badge>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {day.lateEntry.violationMinutes} min
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs md:text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center py-3">
                                                {day.earlyLeave.deduction > 0 ? (
                                                    <div className="inline-flex flex-col items-center">
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 text-xs"
                                                        >
                                                            {formatCurrency(day.earlyLeave.deduction)}
                                                        </Badge>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {day.earlyLeave.violationMinutes} min
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs md:text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center py-3">
                                                {day.breaks.deduction > 0 ? (
                                                    <div className="inline-flex flex-col items-center">
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 text-xs"
                                                        >
                                                            {formatCurrency(day.breaks.deduction)}
                                                        </Badge>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {day.breaks.violationMinutes} min
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs md:text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-xs md:text-sm dark:text-gray-300 py-3">
                                                {formatCurrency(day.lateEntry.deduction + day.earlyLeave.deduction + day.breaks.deduction)}
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {filteredDailyDetails.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-6 md:py-8 text-gray-500 dark:text-gray-400 text-sm">
                                                No policy violations for this period
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-center mt-4">
                                <div className="flex items-center gap-2">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(pageNum)}
                                                className="h-8 w-8 p-0 text-xs"
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Salary Summary & Calculation */}
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 lg:gap-10 mt-6 md:mt-8 lg:mt-10">
                {/* Salary Summary */}
                <Card className="shadow-2xl border-2 border-blue-400 dark:border-blue-600 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 dark:from-blue-900 dark:via-blue-800 dark:to-indigo-900 text-white rounded-xl">
                    <CardHeader className="pb-4 md:pb-6">
                        <CardTitle className="text-xl md:text-2xl lg:text-3xl flex items-center gap-3 md:gap-4">
                            <div className="p-2 md:p-3 bg-white/30 rounded-lg backdrop-blur-sm">
                                <DollarSign className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8" />
                            </div>
                            Salary Summary
                        </CardTitle>
                        <p className="text-xs md:text-sm font-normal text-blue-100 mt-1">Final Take Home Amount</p>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 text-center">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 md:p-6 lg:p-8 border border-white/25">
                                <div className="text-blue-200 text-xs md:text-sm font-semibold mb-2 md:mb-3">Gross Salary</div>
                                <div className="text-2xl md:text-3xl lg:text-4xl font-extrabold">{formatCurrency(salaryData.earnings.totalEarnings)}</div>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 md:p-6 lg:p-8 border border-white/25">
                                <div className="text-blue-200 text-xs md:text-sm font-semibold mb-2 md:mb-3">Total Deductions</div>
                                <div className="text-2xl md:text-3xl lg:text-4xl font-extrabold">{formatCurrency(salaryData.deductions.totalDeductions)}</div>
                            </div>
                            <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4 md:p-6 lg:p-8 border-2 border-green-400 shadow-lg">
                                <div className="text-green-200 text-xs md:text-sm font-semibold mb-2 md:mb-3">Net Salary</div>
                                <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-green-300">{formatCurrency(salaryData.netSalary)}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Calculation Details */}
                <Card className="shadow-lg border border-purple-300 dark:border-purple-700 rounded-lg">
                    <CardHeader className="pb-4 md:pb-5 bg-gradient-to-r from-purple-100 to-violet-200 dark:from-purple-900/30 dark:to-violet-900/30 rounded-t-lg">
                        <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center gap-2 md:gap-3 text-purple-800 dark:text-purple-300 font-semibold">
                            <div className="p-1 md:p-2 bg-purple-600 rounded-lg">
                                <Calculator className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
                            </div>
                            Calculation Details
                        </CardTitle>
                        <p className="text-xs md:text-sm text-purple-700 dark:text-purple-400 mt-1 font-medium">Salary Computation Formulas</p>
                    </CardHeader>
                    <CardContent className="pt-4 md:pt-6 space-y-3 md:space-y-5 text-gray-900 dark:text-gray-100">
                        <div className="space-y-3 md:space-y-4">
                            <div className="flex justify-between border-b border-purple-100 dark:border-purple-800 pb-2 md:pb-3">
                                <span className="font-medium text-gray-600 dark:text-gray-400 text-sm md:text-base">Per Day Rate:</span>
                                <span className="font-bold text-gray-900 dark:text-white text-sm md:text-base">{formatCurrency(salaryData.calculation.perDayRate)}</span>
                            </div>
                            <div className="flex flex-col border-b border-purple-100 dark:border-purple-800 pb-2 md:pb-3">
                                <span className="font-medium text-gray-600 dark:text-gray-400 mb-1 md:mb-2 text-sm md:text-base">Per Day Formula:</span>
                                <code className="bg-purple-50 dark:bg-purple-900/20 p-2 md:p-3 rounded-md text-xs md:text-sm font-mono text-purple-800 dark:text-purple-300 break-words">
                                    {salaryData.calculation.perDayFormula}
                                </code>
                            </div>
                            <div className="flex flex-col border-b border-purple-100 dark:border-purple-800 pb-2 md:pb-3">
                                <span className="font-medium text-gray-600 dark:text-gray-400 mb-1 md:mb-2 text-sm md:text-base">Working Days Formula:</span>
                                <code className="bg-purple-50 dark:bg-purple-900/20 p-2 md:p-3 rounded-md text-xs md:text-sm font-mono text-purple-800 dark:text-purple-300 break-words">
                                    {salaryData.calculation.workingDaysFormula}
                                </code>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium text-gray-600 dark:text-gray-400 mb-1 md:mb-2 text-sm md:text-base">Calculation Notes:</span>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 md:p-4 rounded-md text-xs md:text-sm text-blue-800 dark:text-blue-300">
                                    <Info className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
                                    {salaryData.calculationNotes}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Bank Details & Additional Info */}
            {salaryData.bankDetails && (
                <Card className="shadow-lg border border-gray-300 dark:border-gray-700 rounded-lg mt-6 md:mt-8 lg:mt-10">
                    <CardHeader className="pb-4 md:pb-5 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-900/30 dark:to-gray-800/30 rounded-t-lg">
                        <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center gap-2 md:gap-3 text-gray-800 dark:text-gray-300 font-semibold">
                            <div className="p-1 md:p-2 bg-gray-600 rounded-lg">
                                <Banknote className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
                            </div>
                            Bank Details & Additional Information
                        </CardTitle>
                        <p className="text-xs md:text-sm text-gray-700 dark:text-gray-400 mt-1 font-medium">Salary Transfer & System Information</p>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                            {/* Bank Details */}
                            <div className="space-y-3 md:space-y-5">
                                <h4 className="font-semibold text-base md:text-lg text-gray-700 dark:text-gray-300">Bank Details</h4>
                                <div className="space-y-3 md:space-y-4 text-gray-900 dark:text-gray-100">
                                    <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2 md:pb-3">
                                        <span className="font-medium text-gray-600 dark:text-gray-400 text-sm md:text-base">Account Holder:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{salaryData.bankDetails.accountHolderName}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2 md:pb-3">
                                        <span className="font-medium text-gray-600 dark:text-gray-400 text-sm md:text-base">Account Number:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white font-mono text-sm md:text-base">{salaryData.bankDetails.accountNumber}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2 md:pb-3">
                                        <span className="font-medium text-gray-600 dark:text-gray-400 text-sm md:text-base">IFSC Code:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white font-mono text-sm md:text-base">{salaryData.bankDetails.ifsc}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2 md:pb-3">
                                        <span className="font-medium text-gray-600 dark:text-gray-400 text-sm md:text-base">Bank Name:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{salaryData.bankDetails.bankName}</span>
                                    </div>
                                </div>
                            </div>

                            {/* System Information */}
                            <div className="space-y-3 md:space-y-5">
                                <h4 className="font-semibold text-base md:text-lg text-gray-700 dark:text-gray-300">System Information</h4>
                                <div className="space-y-3 md:space-y-4 text-gray-900 dark:text-gray-100">
                                    <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2 md:pb-3">
                                        <span className="font-medium text-gray-600 dark:text-gray-400 text-sm md:text-base">Generated At:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{formatDateTime(salaryData.generatedAt)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2 md:pb-3">
                                        <span className="font-medium text-gray-600 dark:text-gray-400 text-sm md:text-base">Employee ID:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white font-mono text-sm md:text-base">{salaryData.employeeDetails.employeeId}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2 md:pb-3">
                                        <span className="font-medium text-gray-600 dark:text-gray-400 text-sm md:text-base">Month Number:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{salaryData.salaryPeriod.monthNumber}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2 md:pb-3">
                                        <span className="font-medium text-gray-600 dark:text-gray-400 text-sm md:text-base">Year:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{salaryData.salaryPeriod.year}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

// PDF Component with 2 pages and Daily Violation Details
const PdfSalarySlip = ({
                           salaryData,
                           selectedUser
                       }: {
    salaryData: SalarySlipResponseData['data'];
    selectedUser: UserData;
}) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const numberToWords = (num: number): string => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        if (num === 0) return 'Zero';

        const convertHundreds = (n: number): string => {
            let result = '';
            if (n >= 100) {
                result += ones[Math.floor(n / 100)] + ' Hundred ';
                n %= 100;
            }
            if (n >= 20) {
                result += tens[Math.floor(n / 10)] + ' ';
                n %= 10;
            } else if (n >= 10) {
                result += teens[n - 10] + ' ';
                return result;
            }
            if (n > 0) {
                result += ones[n] + ' ';
            }
            return result;
        };

        if (num >= 10000000) {
            const crores = Math.floor(num / 10000000);
            const remaining = num % 10000000;
            return convertHundreds(crores) + 'Crore ' + numberToWords(remaining);
        } else if (num >= 100000) {
            const lakhs = Math.floor(num / 100000);
            const remaining = num % 100000;
            return convertHundreds(lakhs) + 'Lakh ' + numberToWords(remaining);
        } else if (num >= 1000) {
            const thousands = Math.floor(num / 1000);
            const remaining = num % 1000;
            return convertHundreds(thousands) + 'Thousand ' + numberToWords(remaining);
        } else {
            return convertHundreds(num);
        }
    };

    const getPolicyViolationStats = () => {
        const stats = {
            lateEntries: 0,
            earlyLeaves: 0,
            breakViolations: 0
        };

        salaryData.policyDetails.deductions.dailyDetails.forEach(day => {
            if (day.lateEntry.deduction > 0) stats.lateEntries++;
            if (day.earlyLeave.deduction > 0) stats.earlyLeaves++;
            if (day.breaks.deduction > 0) stats.breakViolations++;
        });

        return stats;
    };

    const policyStats = getPolicyViolationStats();

    return (
        <div
            id="salary-slip-pdf"
            style={{
                width: '100%',
                maxWidth: '800px',
                minHeight: '600px',
                padding: '20px',
                margin: '0 auto',
                backgroundColor: '#ffffff',
                color: '#000000',
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                lineHeight: '1.5',
                boxSizing: 'border-box'
            }}
        >
            {/* PAGE 1 - Main Salary Slip */}
            <div className="page-1" style={{ pageBreakAfter: 'always', marginBottom: '30px' }}>
                <table style={{
                    width: '100%',
                    border: '2px solid #000',
                    borderCollapse: 'collapse',
                    marginBottom: '30px',
                    fontSize: '13px',
                    pageBreakInside: 'avoid'
                }}>
                    <tbody>
                    {/* Header */}
                    <tr>
                        <td colSpan={2} style={{
                            textAlign: 'center',
                            backgroundColor: '#f0f0f0',
                            padding: '15px',
                            border: '1px solid #000',
                            fontWeight: 'bold',
                            fontSize: '18px'
                        }}>
                            Payslip - {salaryData.salaryPeriod.month} {salaryData.salaryPeriod.year}
                        </td>
                    </tr>

                    {/* Company Info */}
                    <tr>
                        <td colSpan={2} style={{
                            textAlign: 'center',
                            padding: '20px',
                            border: '1px solid #000'
                        }}>
                            <div style={{ fontWeight: 'bold', fontSize: '24px', marginBottom: '10px' }}>
                                PulseSeal
                            </div>
                            <div style={{ fontSize: '14px', margin: '5px 0', fontWeight: '600' }}>
                                Salary Period: {formatDate(salaryData.salaryPeriod.fromDate)} to {formatDate(salaryData.salaryPeriod.toDate)}
                            </div>
                            <div style={{ fontSize: '12px', margin: '5px 0', color: '#666' }}>
                                Generated: {new Date(salaryData.generatedAt).toLocaleString('en-IN')}
                            </div>
                        </td>
                    </tr>

                    {/* Employee Details */}
                    <tr>
                        <td style={{
                            width: '50%',
                            padding: '15px',
                            border: '1px solid #000',
                            verticalAlign: 'top'
                        }}>
                            <div style={{ marginBottom: '12px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Employee Name:</span>
                                <br />
                                <span style={{ fontSize: '14px' }}>{salaryData.employeeDetails.name}</span>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Employee Code:</span>
                                <br />
                                <span style={{ fontSize: '14px' }}>{salaryData.employeeDetails.employeeCode}</span>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Employee ID:</span>
                                <br />
                                <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{salaryData.employeeDetails.employeeId}</span>
                            </div>
                            <div>
                                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Work Type:</span>
                                <br />
                                <span style={{ fontSize: '14px' }}>{salaryData.employeeDetails.workType}</span>
                            </div>
                        </td>
                        <td style={{
                            width: '50%',
                            padding: '15px',
                            border: '1px solid #000',
                            verticalAlign: 'top'
                        }}>
                            <div style={{ marginBottom: '12px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Join Date:</span>
                                <br />
                                <span style={{ fontSize: '14px' }}>{formatDate(salaryData.employeeDetails.joinDate)}</span>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Designation:</span>
                                <br />
                                <span style={{ fontSize: '14px' }}>{selectedUser?.roleDefinitionId.roleName || 'N/A'}</span>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Per Day Rate:</span>
                                <br />
                                <span style={{ fontSize: '14px' }}>₹{salaryData.calculation.perDayRate.toFixed(2)}</span>
                            </div>
                        </td>
                    </tr>

                    {/* Attendance Summary */}
                    <tr>
                        <td colSpan={2} style={{
                            padding: '15px',
                            border: '1px solid #000',
                            backgroundColor: '#f8f9fa',
                            pageBreakInside: 'avoid'
                        }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>Attendance Summary</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', fontSize: '12px' }}>
                                <div>
                                    <div style={{ fontWeight: '600' }}>Total Working Days</div>
                                    <div>{salaryData.attendanceSummary.totalWorkingDays}</div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600' }}>Present Days</div>
                                    <div>{salaryData.attendanceSummary.presentDays}</div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600' }}>Paid Leaves</div>
                                    <div>{salaryData.attendanceSummary.paidLeaves}</div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600' }}>Unpaid Leaves</div>
                                    <div>{salaryData.attendanceSummary.unpaidLeaves}</div>
                                </div>
                            </div>
                        </td>
                    </tr>

                    {/* Earnings Header */}
                    <tr>
                        <td style={{
                            padding: '12px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            border: '1px solid #000',
                            backgroundColor: '#f0f0f0',
                            fontSize: '14px'
                        }}>
                            Earnings
                        </td>
                        <td style={{
                            padding: '12px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            border: '1px solid #000',
                            backgroundColor: '#f0f0f0',
                            width: '150px',
                            fontSize: '14px'
                        }}>
                            Amount
                        </td>
                    </tr>

                    {/* Earnings Items */}
                    <tr>
                        <td style={{ padding: '12px', border: '1px solid #000' }}>
                            <div style={{ fontWeight: '500', fontSize: '13px' }}>Basic Salary</div>
                            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Base salary component</div>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
                            ₹{salaryData.earnings.basic.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                    </tr>
                    <tr>
                        <td style={{ padding: '12px', border: '1px solid #000' }}>
                            <div style={{ fontWeight: '500', fontSize: '13px' }}>HRA (House Rent Allowance)</div>
                            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Housing allowance</div>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
                            ₹{salaryData.earnings.hra.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                    </tr>
                    <tr>
                        <td style={{ padding: '12px', border: '1px solid #000' }}>
                            <div style={{ fontWeight: '500', fontSize: '13px' }}>Other Allowances</div>
                            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Additional allowances</div>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
                            ₹{salaryData.earnings.allowances.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                    </tr>
                    <tr>
                        <td style={{ padding: '12px', border: '1px solid #000' }}>
                            <div style={{ fontWeight: '500', fontSize: '13px' }}>Overtime Pay</div>
                            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Extra hours worked</div>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
                            ₹{salaryData.earnings.overtimePay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                    </tr>

                    {/* Total Earnings */}
                    <tr>
                        <td style={{
                            padding: '12px',
                            fontWeight: 'bold',
                            textAlign: 'right',
                            border: '1px solid #000',
                            backgroundColor: '#f0f0f0',
                            fontSize: '14px'
                        }}>
                            Total Earnings
                        </td>
                        <td style={{
                            padding: '12px',
                            fontWeight: 'bold',
                            textAlign: 'right',
                            border: '1px solid #000',
                            backgroundColor: '#f0f0f0',
                            fontSize: '14px'
                        }}>
                            ₹{salaryData.earnings.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                    </tr>

                    {/* Deductions Header */}
                    <tr>
                        <td style={{
                            padding: '12px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            border: '1px solid #000',
                            backgroundColor: '#f0f0f0',
                            fontSize: '14px'
                        }}>
                            Deductions
                        </td>
                        <td style={{
                            padding: '12px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            border: '1px solid #000',
                            backgroundColor: '#f0f0f0',
                            fontSize: '14px'
                        }}>
                            Amount
                        </td>
                    </tr>

                    {/* Deductions Items */}
                    <tr>
                        <td style={{ padding: '12px', border: '1px solid #000' }}>
                            <div style={{ fontWeight: '500', fontSize: '13px' }}>Salary Deduction (Unpaid Leaves)</div>
                            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>{salaryData.attendanceSummary.unpaidLeaves} unpaid leave(s)</div>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
                            ₹{salaryData.deductions.salaryDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                    </tr>
                    <tr>
                        <td style={{ padding: '12px', border: '1px solid #000' }}>
                            <div style={{ fontWeight: '500', fontSize: '13px' }}>Policy Deductions</div>
                            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                Late: {policyStats.lateEntries}, Early: {policyStats.earlyLeaves}, Break: {policyStats.breakViolations}
                            </div>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
                            ₹{salaryData.deductions.policyDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                    </tr>
                    <tr>
                        <td style={{ padding: '12px', border: '1px solid #000' }}>
                            <div style={{ fontWeight: '500', fontSize: '13px' }}>Other Deductions</div>
                            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Miscellaneous deductions</div>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
                            ₹{salaryData.deductions.otherDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                    </tr>

                    {/* Total Deductions */}
                    <tr>
                        <td style={{
                            padding: '12px',
                            fontWeight: 'bold',
                            textAlign: 'right',
                            border: '1px solid #000',
                            backgroundColor: '#f0f0f0',
                            fontSize: '14px'
                        }}>
                            Total Deductions
                        </td>
                        <td style={{
                            padding: '12px',
                            fontWeight: 'bold',
                            textAlign: 'right',
                            border: '1px solid #000',
                            backgroundColor: '#f0f0f0',
                            fontSize: '14px'
                        }}>
                            ₹{salaryData.deductions.totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                    </tr>

                    {/* Net Pay */}
                    <tr>
                        <td style={{
                            padding: '12px',
                            fontWeight: 'bold',
                            textAlign: 'right',
                            border: '1px solid #000',
                            backgroundColor: '#e8f4fd',
                            fontSize: '14px'
                        }}>
                            Net Pay
                        </td>
                        <td style={{
                            padding: '12px',
                            fontWeight: 'bold',
                            textAlign: 'right',
                            border: '1px solid #000',
                            backgroundColor: '#e8f4fd',
                            fontSize: '16px'
                        }}>
                            ₹{salaryData.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>

            {/* PAGE 2 - Policy Deductions & Details */}
            <div className="page-2" style={{ pageBreakBefore: 'always' }}>
                {/* Policy Deductions Breakdown */}
                <div style={{
                    marginBottom: '30px',
                    padding: '20px',
                    border: '2px solid #000',
                    borderRadius: '5px',
                    backgroundColor: '#f9f9f9',
                    pageBreakInside: 'avoid'
                }}>
                    <h4 style={{ margin: '0 0 15px 0', fontWeight: 'bold', fontSize: '18px', textAlign: 'center' }}>
                        Policy Deductions Breakdown
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', fontSize: '13px', marginBottom: '25px' }}>
                        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '6px', border: '1px solid #ffeaa7' }}>
                            <div style={{ fontWeight: '600', color: '#856404', fontSize: '14px' }}>Late Entry</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#856404', margin: '10px 0' }}>
                                ₹{salaryData.policyDetails.deductions.summary.lateEntryDeductions.toFixed(2)}
                            </div>
                            <div style={{ fontSize: '12px', color: '#856404' }}>{policyStats.lateEntries} violation(s)</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8d7da', borderRadius: '6px', border: '1px solid #f5c6cb' }}>
                            <div style={{ fontWeight: '600', color: '#721c24', fontSize: '14px' }}>Early Leave</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#721c24', margin: '10px 0' }}>
                                ₹{salaryData.policyDetails.deductions.summary.earlyLeaveDeductions.toFixed(2)}
                            </div>
                            <div style={{ fontSize: '12px', color: '#721c24' }}>{policyStats.earlyLeaves} violation(s)</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#e2d9f3', borderRadius: '6px', border: '1px solid #d6c6e9' }}>
                            <div style={{ fontWeight: '600', color: '#4a3c6e', fontSize: '14px' }}>Break Violation</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4a3c6e', margin: '10px 0' }}>
                                ₹{salaryData.policyDetails.deductions.summary.breakDeductions.toFixed(2)}
                            </div>
                            <div style={{ fontSize: '12px', color: '#4a3c6e' }}>{policyStats.breakViolations} violation(s)</div>
                        </div>
                    </div>

                    {/* Daily Violation Details Table */}
                    <h4 style={{ margin: '25px 0 15px 0', fontWeight: 'bold', fontSize: '16px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>
                        Daily Violation Details
                    </h4>

                    {salaryData.policyDetails.deductions.dailyDetails.filter(day =>
                        day.lateEntry.deduction > 0 || day.earlyLeave.deduction > 0 || day.breaks.deduction > 0
                    ).length > 0 ? (
                        <>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '12px',
                                marginBottom: '15px',
                                border: '1px solid #ddd'
                            }}>
                                <thead>
                                <tr style={{ backgroundColor: '#f0f0f0' }}>
                                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>Date</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>Late Entry</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>Early Leave</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>Break Violation</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold' }}>Total Deduction</th>
                                </tr>
                                </thead>
                                <tbody>
                                {salaryData.policyDetails.deductions.dailyDetails
                                    .filter(day => day.lateEntry.deduction > 0 || day.earlyLeave.deduction > 0 || day.breaks.deduction > 0)
                                    .map((day, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{formatDate(day.date)}</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                                {day.lateEntry.deduction > 0 ? (
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: '#856404' }}>
                                                            ₹{day.lateEntry.deduction.toFixed(2)}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#666' }}>
                                                            {day.lateEntry.violationMinutes} min
                                                        </div>
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                                {day.earlyLeave.deduction > 0 ? (
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: '#721c24' }}>
                                                            ₹{day.earlyLeave.deduction.toFixed(2)}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#666' }}>
                                                            {day.earlyLeave.violationMinutes} min
                                                        </div>
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                                {day.breaks.deduction > 0 ? (
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: '#4a3c6e' }}>
                                                            ₹{day.breaks.deduction.toFixed(2)}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#666' }}>
                                                            {day.breaks.violationMinutes} min
                                                        </div>
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right', fontWeight: '600' }}>
                                                ₹{(day.lateEntry.deduction + day.earlyLeave.deduction + day.breaks.deduction).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div style={{ fontSize: '12px', color: '#666', marginTop: '10px', textAlign: 'center' }}>
                                Total Days with Violations: {salaryData.policyDetails.deductions.dailyDetails.filter(day =>
                                day.lateEntry.deduction > 0 || day.earlyLeave.deduction > 0 || day.breaks.deduction > 0
                            ).length}
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px', fontSize: '14px', color: '#666' }}>
                            No policy violations for this period
                        </div>
                    )}
                </div>

                {/* Calculation Details */}
                <div style={{
                    marginBottom: '30px',
                    padding: '20px',
                    border: '2px solid #000',
                    borderRadius: '5px',
                    backgroundColor: '#f8f9fa',
                    fontSize: '13px',
                    pageBreakInside: 'avoid'
                }}>
                    <h4 style={{ margin: '0 0 15px 0', fontWeight: 'bold', fontSize: '16px', textAlign: 'center' }}>Calculation Details</h4>
                    <div style={{ marginBottom: '15px' }}>
                        <strong>Per Day Rate Formula:</strong> {salaryData.calculation.perDayFormula}
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <strong>Working Days Formula:</strong> {salaryData.calculation.workingDaysFormula}
                    </div>
                    <div>
                        <strong>Calculation Notes:</strong> {salaryData.calculationNotes}
                    </div>
                </div>

                {/* Bank Details */}
                {salaryData.bankDetails && (
                    <div style={{
                        marginBottom: '30px',
                        padding: '20px',
                        border: '2px solid #000',
                        borderRadius: '5px',
                        backgroundColor: '#f9f9f9',
                        pageBreakInside: 'avoid'
                    }}>
                        <h4 style={{ margin: '0 0 15px 0', fontWeight: 'bold', fontSize: '16px', textAlign: 'center' }}>Bank Details</h4>
                        <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                            <div><strong>Account Holder:</strong> {salaryData.bankDetails.accountHolderName}</div>
                            <div><strong>Account Number:</strong> {salaryData.bankDetails.accountNumber}</div>
                            <div><strong>IFSC Code:</strong> {salaryData.bankDetails.ifsc}</div>
                            <div><strong>Bank:</strong> {salaryData.bankDetails.bankName}</div>
                        </div>
                    </div>
                )}

                {/* Amount in words section */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '30px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    padding: '15px',
                    backgroundColor: '#f0f8ff',
                    borderRadius: '5px',
                    border: '2px solid #000'
                }}>
                    Net Pay: ₹{Math.round(salaryData.netSalary).toLocaleString('en-IN')}
                </div>

                <div style={{
                    textAlign: 'center',
                    marginBottom: '40px',
                    fontSize: '14px',
                    padding: '15px',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '5px',
                    border: '2px solid #000'
                }}>
                    <strong style={{ fontSize: '15px' }}>
                        In Words: {numberToWords(Math.round(salaryData.netSalary)).trim()} Rupees Only
                    </strong>
                </div>

                {/* Signatures */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '60px',
                    paddingTop: '25px',
                    borderTop: '2px solid #000',
                    pageBreakInside: 'avoid'
                }}>
                    <div style={{ textAlign: 'center', width: '300px' }}>
                        <div style={{
                            borderTop: '1px solid #000',
                            marginBottom: '15px',
                            height: '70px'
                        }}></div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Employee Signature</div>
                        <div style={{ fontSize: '12px', marginTop: '5px', color: '#666' }}>Date: ________________</div>
                    </div>
                    <div style={{ textAlign: 'center', width: '300px' }}>
                        <div style={{
                            borderTop: '1px solid #000',
                            marginBottom: '15px',
                            height: '70px'
                        }}></div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Employer Signature</div>
                        <div style={{ fontSize: '12px', marginTop: '5px', color: '#666' }}>Date: ________________</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminSalarySlipManager = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { theme, setTheme } = useTheme();
    const users = useSelector(selectUsers) as UserData[];
    const usersLoading = useSelector(selectUsersLoading);

    const salarySlipResponse = useSelector(selectSalarySlip) as SalarySlipResponseData | SalarySlipResponseData['data'] | null;
    const loading = useSelector(selectSalarySlipLoading);
    const error = useSelector(selectSalarySlipError);

    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isSalarySlipModalOpen, setIsSalarySlipModalOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [actionType, setActionType] = useState<'details' | 'generate' | null>(null);

    const months = [
        { value: "1", label: 'January' },
        { value: "2", label: 'February' },
        { value: "3", label: 'March' },
        { value: "4", label: 'April' },
        { value: "5", label: 'May' },
        { value: "6", label: 'June' },
        { value: "7", label: 'July' },
        { value: "8", label: 'August' },
        { value: "9", label: 'September' },
        { value: "10", label: 'October' },
        { value: "11", label: 'November' },
        { value: "12", label: 'December' }
    ];

    const years = Array.from({ length: 5 }, (_, i) => {
        const year = new Date().getFullYear() - i;
        return { value: year.toString(), label: year.toString() };
    });

    useEffect(() => {
        dispatch(fetchUsers());
    }, [dispatch]);

    const filteredUsers = users?.filter(user =>
        user?.user_id?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.user_id?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.roleDefinitionId?.roleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.departments?.some(dept =>
            dept?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dept?.alias?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    ) || [];

    // Extract salary data from response
    const salaryData: SalarySlipResponseData['data'] | null = React.useMemo(() => {
        if (!salarySlipResponse) return null;

        // Check if response has success property
        if (typeof salarySlipResponse === 'object' && 'success' in salarySlipResponse) {
            return salarySlipResponse.data;
        }

        // If response is already the data object
        return salarySlipResponse as SalarySlipResponseData['data'];
    }, [salarySlipResponse]);

    const handleShowDetails = (user: UserData) => {
        if (!selectedMonth || !selectedYear) {
            alert('Please select month and year first');
            return;
        }

        setSelectedUser(user);
        setActionType('details');
        dispatch(clearError());
        dispatch(generateSalarySlipForUser({
            userId: user.user_id._id,
            month: parseInt(selectedMonth),
            year: parseInt(selectedYear)
        }));
        setIsDetailsModalOpen(true);
    };

    const handleGenerateSalarySlip = (user: UserData) => {
        if (!selectedMonth || !selectedYear) {
            alert('Please select month and year first');
            return;
        }

        setSelectedUser(user);
        setActionType('generate');
        dispatch(clearError());
        dispatch(generateSalarySlipForUser({
            userId: user.user_id._id,
            month: parseInt(selectedMonth),
            year: parseInt(selectedYear)
        }));
        setIsSalarySlipModalOpen(true);
    };

    // Enhanced PDF download function with 2-page support
    const downloadSalarySlip = async () => {
        if (!salaryData || !selectedUser) return;

        setIsDownloading(true);

        try {
            // Create a new iframe to completely isolate from main page CSS
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.left = '-99999px';
            iframe.style.top = '0';
            iframe.style.width = '794px';
            iframe.style.height = '1123px';
            iframe.style.border = 'none';

            document.body.appendChild(iframe);

            // Wait for iframe to load
            await new Promise((resolve) => {
                iframe.onload = resolve;
                iframe.src = 'about:blank';
            });

            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDoc) throw new Error('Cannot access iframe document');

            // Generate HTML for PDF
            const pdfHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              background-color: white;
              color: black;
              width: 794px;
              padding: 20px;
            }
            .page-1 {
              page-break-after: always;
              margin-bottom: 30px;
            }
            .page-2 {
              page-break-before: always;
            }
            table {
              width: 100%;
              border: 2px solid black;
              border-collapse: collapse;
              margin-bottom: 30px;
              font-size: 13px;
            }
            td {
              padding: 12px;
              border: 1px solid black;
              vertical-align: top;
            }
            .header {
              text-align: center;
              background-color: #f0f0f0;
              font-weight: bold;
              font-size: 18px;
            }
          </style>
        </head>
        <body>
          ${document.getElementById('salary-slip-pdf')?.innerHTML || ''}
        </body>
        </html>
      `;

            iframeDoc.open();
            iframeDoc.write(pdfHtml);
            iframeDoc.close();

            // Wait for content to render
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Generate PDF with 2 pages
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Get both pages
            const page1 = iframeDoc.querySelector('.page-1');
            const page2 = iframeDoc.querySelector('.page-2');

            if (page1) {
                const canvas1 = await html2canvas(page1 as HTMLElement, {
                    scale: 1.5,
                    useCORS: true,
                    allowTaint: false,
                    backgroundColor: '#ffffff',
                    logging: false,
                });

                const imgData1 = canvas1.toDataURL('image/png', 0.95);
                const imgHeight1 = (canvas1.height * pageWidth) / canvas1.width;

                pdf.addImage(imgData1, 'PNG', 0, 0, pageWidth, imgHeight1);
            }

            // Add second page
            if (page2) {
                pdf.addPage();
                const canvas2 = await html2canvas(page2 as HTMLElement, {
                    scale: 1.5,
                    useCORS: true,
                    allowTaint: false,
                    backgroundColor: '#ffffff',
                    logging: false,
                });

                const imgData2 = canvas2.toDataURL('image/png', 0.95);
                const imgHeight2 = (canvas2.height * pageWidth) / canvas2.width;

                pdf.addImage(imgData2, 'PNG', 0, 0, pageWidth, imgHeight2);
            }

            // Download
            const fileName = `payslip-${salaryData.employeeDetails.name.replace(/\s+/g, '-').toLowerCase()}-${salaryData.salaryPeriod.month}-${salaryData.salaryPeriod.year}.pdf`;
            pdf.save(fileName);

            // Clean up
            document.body.removeChild(iframe);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDetailsModalClose = () => {
        setIsDetailsModalOpen(false);
        setSelectedUser(null);
        dispatch(clearSalarySlip());
        setActionType(null);
    };

    const handleSalarySlipModalClose = () => {
        setIsSalarySlipModalOpen(false);
        dispatch(clearSalarySlip());
        setSelectedUser(null);
        setActionType(null);
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-3 sm:p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
                {/* Header with Theme Toggle */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                        <div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
                                <FileText className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-blue-600 dark:text-blue-400" />
                                Salary Slip Manager
                            </h1>
                            <p className="text-sm sm:text-base text-muted-foreground dark:text-gray-300">
                                Generate and manage salary slips for all employees - {filteredUsers.length} employees found
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleTheme}
                            className="w-fit"
                        >
                            {theme === 'dark' ? (
                                <>
                                    <Sun className="w-4 h-4 mr-2" />
                                    Light Mode
                                </>
                            ) : (
                                <>
                                    <Moon className="w-4 h-4 mr-2" />
                                    Dark Mode
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Controls */}
                <Card className="shadow-lg border-2 border-blue-100 dark:border-blue-900">
                    <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="text-lg sm:text-xl md:text-2xl dark:text-white">Filters & Controls</CardTitle>
                        <CardDescription className="text-xs sm:text-sm dark:text-gray-300">
                            Select month and year, then search and select an employee to view details or generate salary slip
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <div className="space-y-1 sm:space-y-2 w-full sm:w-40 md:w-48">
                                <Label htmlFor="filter-month" className="text-xs sm:text-sm dark:text-gray-300">Month</Label>
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger id="filter-month" className="h-9 sm:h-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                        <SelectValue placeholder="Select Month" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                                        {months.map((month) => (
                                            <SelectItem key={month.value} value={month.value} className="dark:text-white dark:hover:bg-gray-700">
                                                {month.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1 sm:space-y-2 w-full sm:w-28 md:w-32">
                                <Label htmlFor="filter-year" className="text-xs sm:text-sm dark:text-gray-300">Year</Label>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger id="filter-year" className="h-9 sm:h-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                                        {years.map((year) => (
                                            <SelectItem key={year.value} value={year.value} className="dark:text-white dark:hover:bg-gray-700">
                                                {year.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1 sm:space-y-2 flex-1">
                                <Label htmlFor="search-users" className="text-xs sm:text-sm dark:text-gray-300">Search Employees</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 sm:h-4 sm:w-4" />
                                    <Input
                                        id="search-users"
                                        placeholder="Search by name, email, role, or department..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8 sm:pl-10 h-9 sm:h-10 text-xs sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    onClick={() => dispatch(fetchUsers())}
                                    disabled={usersLoading}
                                    className="h-9 sm:h-10 w-full sm:w-auto text-xs sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                >
                                    {usersLoading ? (
                                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                    )}
                                    Refresh
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Error Display */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
                    </Alert>
                )}

                {/* Users Table */}
                <Card className="shadow-lg border-2 border-blue-100 dark:border-blue-900">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b dark:border-gray-700 py-3 sm:py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                                <div>
                                    <CardTitle className="text-lg sm:text-xl md:text-2xl dark:text-white">Employee Directory</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm dark:text-gray-300">Select an employee to view details or generate salary slip</CardDescription>
                                </div>
                            </div>

                            <Badge variant="secondary" className="w-fit text-xs sm:text-sm dark:bg-gray-700 dark:text-gray-300">
                                {filteredUsers.length} employees
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {usersLoading ? (
                            <div className="flex flex-col justify-center items-center py-8 sm:py-12">
                                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600 dark:text-blue-400" />
                                <p className="mt-2 sm:mt-4 text-muted-foreground dark:text-gray-300 text-xs sm:text-sm">Loading employees...</p>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-8 sm:py-12">
                                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground dark:text-gray-500 mx-auto mb-3 sm:mb-4" />
                                <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2 dark:text-white">No employees found</h3>
                                <p className="text-muted-foreground dark:text-gray-400 text-xs sm:text-sm">
                                    {searchTerm ? 'Try adjusting your search criteria' : 'No employees available'}
                                </p>
                            </div>
                        ) : (
                            <ScrollArea className="h-[500px] sm:h-[600px]">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background dark:bg-gray-800">
                                        <TableRow className="dark:border-gray-700">
                                            <TableHead className="text-xs sm:text-sm dark:text-gray-300">Employee</TableHead>
                                            <TableHead className="text-xs sm:text-sm dark:text-gray-300">Role</TableHead>
                                            <TableHead className="text-xs sm:text-sm hidden sm:table-cell dark:text-gray-300">Department</TableHead>
                                            <TableHead className="text-xs sm:text-sm hidden md:table-cell dark:text-gray-300">Manager</TableHead>
                                            <TableHead className="text-xs sm:text-sm dark:text-gray-300">Status</TableHead>
                                            <TableHead className="text-right text-xs sm:text-sm dark:text-gray-300">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((user) => (
                                            <TableRow key={user._id} className="hover:bg-muted/50 dark:hover:bg-gray-800/50 dark:border-gray-700">
                                                <TableCell>
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                                                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs sm:text-sm">
                                                                {user?.user_id?.name?.charAt(0) || 'U'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-xs sm:text-sm truncate dark:text-white">
                                                                {user?.user_id?.name || 'Unknown'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground dark:text-gray-400 truncate">{user?.user_id?.email || 'No email'}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                                        {user?.roleDefinitionId?.roleName || 'Unknown'}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell className="hidden sm:table-cell">
                                                    <div className="flex flex-col gap-1">
                                                        {user?.departments?.slice(0, 2).map((dept) => (
                                                            <Badge key={dept._id} variant="secondary" className="text-xs dark:bg-gray-700 dark:text-gray-300">
                                                                {dept.name}
                                                            </Badge>
                                                        ))}
                                                        {user?.departments?.length > 2 && (
                                                            <Badge variant="outline" className="text-xs dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                                                +{user.departments.length - 2} more
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell className="hidden md:table-cell">
                          <span className="text-muted-foreground dark:text-gray-400 text-xs sm:text-sm truncate">
                            {user?.parentRoleId?.user_id?.name || 'CEO'}
                          </span>
                                                </TableCell>

                                                <TableCell>
                                                    <Badge
                                                        variant={user?.status === 'active' ? 'default' : 'secondary'}
                                                        className="capitalize text-xs dark:bg-gray-700 dark:text-gray-300"
                                                    >
                                                        {user?.status || 'unknown'}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <div className="flex flex-col sm:flex-row justify-end gap-1 sm:gap-2">
                                                        {/* Show Details Button */}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleShowDetails(user)}
                                                            className="flex items-center gap-1 h-7 sm:h-8 text-xs dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
                                                            disabled={!selectedMonth || !selectedYear}
                                                        >
                                                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                                            <span className="hidden xs:inline">Details</span>
                                                        </Button>

                                                        {/* Generate Salary Slip Button */}
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleGenerateSalarySlip(user)}
                                                            disabled={!selectedMonth || !selectedYear}
                                                            className="flex items-center gap-1 h-7 sm:h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                                        >
                                                            <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                                                            <span className="hidden xs:inline">Generate</span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>

                {/* Salary Slip Details Modal - Responsive */}
                <Dialog open={isDetailsModalOpen} onOpenChange={handleDetailsModalClose}>
                    <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] overflow-hidden sm:max-w-[90vw] sm:w-[90vw] lg:max-w-[85vw] lg:w-[85vw] p-3 sm:p-4 md:p-6 dark:bg-gray-900 dark:border-gray-700">
                        <DialogHeader className="pb-3 sm:pb-4">
                            <div className="flex justify-between items-center">
                                <DialogTitle className="text-lg sm:text-xl md:text-2xl flex items-center gap-2 dark:text-white">
                                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                                    Salary Slip Details - {selectedUser?.user_id?.name}
                                </DialogTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDetailsModalClose}
                                    className="h-8 w-8 p-0 dark:text-gray-300 dark:hover:bg-gray-800"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </DialogHeader>
                        <ScrollArea className="max-h-[70vh] pr-3 sm:pr-4">
                            {loading && actionType === 'details' ? (
                                <div className="flex flex-col justify-center items-center py-12 sm:py-16">
                                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600 dark:text-blue-400" />
                                    <p className="mt-2 sm:mt-4 text-muted-foreground dark:text-gray-300 text-xs sm:text-sm">Loading salary slip details...</p>
                                </div>
                            ) : salaryData && selectedUser ? (
                                <SalarySlipDetails
                                    salaryData={salaryData}
                                    selectedUser={selectedUser}
                                />
                            ) : (
                                <div className="text-center py-12 sm:py-16">
                                    <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground dark:text-gray-500 mx-auto mb-3 sm:mb-4" />
                                    <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2 dark:text-white">No salary slip details available</h3>
                                    <p className="text-muted-foreground dark:text-gray-400 text-xs sm:text-sm">Unable to load salary slip details</p>
                                </div>
                            )}
                        </ScrollArea>
                    </DialogContent>
                </Dialog>

                {/* Salary Slip PDF Modal */}
                <Dialog open={isSalarySlipModalOpen} onOpenChange={handleSalarySlipModalClose}>
                    <DialogContent
                        className="max-w-[95vw] w-[95vw] max-h-[90vh] overflow-hidden sm:max-w-[90vw] sm:w-[90vw] lg:max-w-[85vw] lg:w-[85vw] p-3 sm:p-4 md:p-6 dark:bg-gray-900 dark:border-gray-700"
                    >
                        <DialogHeader className="border-b pb-3 sm:pb-4 dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                                <div className="min-w-0">
                                    <div className="flex justify-between items-center mb-1 sm:mb-2">
                                        <DialogTitle className="text-lg sm:text-xl md:text-2xl flex items-center gap-2 truncate dark:text-white">
                                            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                            <span className="truncate">Salary Slip - {salaryData?.salaryPeriod.month} {salaryData?.salaryPeriod.year}</span>
                                        </DialogTitle>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleSalarySlipModalClose}
                                            className="h-8 w-8 p-0 flex-shrink-0 ml-2 dark:text-gray-300 dark:hover:bg-gray-800"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {selectedUser && salaryData && (
                                        <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 truncate">
                                            {salaryData.employeeDetails.name} - Employee Code: {salaryData.employeeDetails.employeeCode}
                                        </p>
                                    )}
                                </div>

                                <Button
                                    variant="default"
                                    onClick={downloadSalarySlip}
                                    disabled={!salaryData || isDownloading}
                                    className="shrink-0 w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                                    size="sm"
                                >
                                    {isDownloading ? (
                                        <>
                                            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                            Download PDF
                                        </>
                                    )}
                                </Button>
                            </div>
                        </DialogHeader>

                        <ScrollArea className="max-h-[75vh] w-full">
                            {loading && actionType === 'generate' ? (
                                <div className="flex flex-col justify-center items-center py-12 sm:py-16">
                                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600 dark:text-blue-400" />
                                    <p className="mt-2 sm:mt-4 text-muted-foreground dark:text-gray-300 text-xs sm:text-sm">Generating salary slip...</p>
                                </div>
                            ) : salaryData && selectedUser ? (
                                <div className="p-3 sm:p-4 md:p-6">
                                    <div className="w-full bg-white dark:bg-gray-800 border rounded-lg shadow-sm overflow-auto dark:border-gray-700">
                                        <PdfSalarySlip
                                            salaryData={salaryData}
                                            selectedUser={selectedUser}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 sm:py-16 px-4">
                                    <FileText className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-muted-foreground dark:text-gray-500 mx-auto mb-3 sm:mb-4" />
                                    <h3 className="text-sm sm:text-base md:text-lg font-medium mb-1 sm:mb-2 dark:text-white">No salary slip generated</h3>
                                    <p className="text-muted-foreground dark:text-gray-400 text-xs sm:text-sm">Select a month and year, then click on an employee to generate their salary slip</p>
                                </div>
                            )}
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default AdminSalarySlipManager;

// "use client";
// import React, { useState, useEffect, useRef } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { AppDispatch, RootState } from '@/store';
// import {
//     generateSalarySlipForUser,
//     selectSalarySlip,
//     selectSalarySlipLoading,
//     selectSalarySlipError,
//     clearSalarySlip,
//     clearError
// } from '@/features/salarySlip/salarySlip';
// import { selectUsers, fetchUsers, selectUsersLoading } from '@/features/user/userSlice';
// import {
//     Card,
//     CardContent,
//     CardDescription,
//     CardHeader,
//     CardTitle,
// } from "@/components/ui/card";
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow,
// } from "@/components/ui/table";
// import { Button } from "@/components/ui/button";
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Separator } from "@/components/ui/separator";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import {
//     Dialog,
//     DialogContent,
//     DialogHeader,
//     DialogTitle,
// } from "@/components/ui/dialog";
// import {
//     Search,
//     Calendar,
//     DollarSign,
//     Download,
//     Eye,
//     Users,
//     Clock,
//     TrendingUp,
//     FileText,
//     Building,
//     RefreshCw,
//     Loader2,
//     AlertCircle,
//     MapPin,
//     User,
//     Briefcase,
//     Banknote,
//     CalendarDays,
//     Calculator,
//     FileSpreadsheet,
//     Receipt,
//     Percent,
//     Clock8,
//     LogOut,
//     Coffee,
//     AlertTriangle,
//     Info,
//     X
// } from "lucide-react";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import html2canvas from 'html2canvas';
// import { jsPDF } from 'jspdf';
//
// // Updated interfaces to match the new API response structure
// interface SalarySlipResponseData {
//     success: boolean;
//     message: string;
//     data: {
//         employeeDetails: {
//             employeeId: string;
//             employeeCode: string;
//             name: string;
//             joinDate: string;
//             workType: string;
//         };
//         salaryPeriod: {
//             month: string;
//             monthNumber: number;
//             year: number;
//             fromDate: string;
//             toDate: string;
//         };
//         attendanceSummary: {
//             totalWorkingDays: number;
//             presentDays: number;
//             paidLeaves: number;
//             unpaidLeaves: number;
//         };
//         earnings: {
//             basic: number;
//             hra: number;
//             allowances: number;
//             overtimePay: number;
//             totalEarnings: number;
//         };
//         deductions: {
//             salaryDeduction: number;
//             policyDeductions: number;
//             otherDeductions: number;
//             totalDeductions: number;
//         };
//         policyDetails: {
//             deductions: {
//                 summary: {
//                     lateEntryDeductions: number;
//                     earlyLeaveDeductions: number;
//                     breakDeductions: number;
//                     total: number;
//                 };
//                 dailyDetails: Array<{
//                     date: string;
//                     lateEntry: {
//                         deduction: number;
//                         ruleApplied: string | null;
//                         violationMinutes: number;
//                         occurrenceCount: number;
//                         totalMinutes: number;
//                         isOccurrenceRule: boolean;
//                         occurrenceType: string;
//                         occurrenceValue: number;
//                     };
//                     earlyLeave: {
//                         deduction: number;
//                         ruleApplied: string | null;
//                         violationMinutes: number;
//                         occurrenceCount: number;
//                         totalMinutes: number;
//                         isOccurrenceRule: boolean;
//                         occurrenceType: string;
//                         occurrenceValue: number;
//                     };
//                     breaks: {
//                         deduction: number;
//                         ruleApplied: string | null;
//                         violationMinutes: number;
//                         occurrenceCount: number;
//                         totalMinutes: number;
//                         isOccurrenceRule: boolean;
//                         occurrenceType: string;
//                         occurrenceValue: number;
//                     };
//                 }>;
//                 occurrenceCounters: {
//                     late_entry: Record<string, any>;
//                     early_leave: Record<string, any>;
//                     breaks: Record<string, any>;
//                 };
//             };
//             overtime: {
//                 summary: {
//                     regularOvertimePay: number;
//                     earlyOvertimePay: number;
//                     total: number;
//                 };
//                 dailyDetails: any[];
//                 occurrenceCounters: {
//                     overtime: Record<string, any>;
//                     early_overtime: Record<string, any>;
//                 };
//             };
//         };
//         calculation: {
//             perDayRate: number;
//             perDayFormula: string;
//             workingDaysFormula: string;
//         };
//         netSalary: number;
//         bankDetails: {
//             accountHolderName: string;
//             accountNumber: string;
//             bankName: string;
//             ifsc: string;
//         };
//         generatedAt: string;
//         calculationNotes: string;
//     };
// }
//
// interface UserData {
//     _id: string;
//     user_id: {
//         _id: string;
//         name: string;
//         email: string;
//         phoneNumber?: number;
//         isActive: boolean;
//         isFreezed: boolean;
//         is_organizer: boolean;
//         is_superuser: boolean;
//     };
//     roleDefinitionId: {
//         _id: string;
//         roleName: string;
//         hierarchyLevel?: number;
//         permissions?: string[];
//     };
//     departments: Array<{
//         _id: string;
//         name: string;
//         alias: string;
//     }>;
//     parentRoleId?: {
//         _id: string;
//         user_id: {
//             _id: string;
//             name: string;
//             email: string;
//         };
//         roleDefinitionId: {
//             _id: string;
//             roleName: string;
//         };
//     };
//     status: string;
//     history: any[];
// }
//
// interface SalarySlipState {
//     data: SalarySlipResponseData['data'] | null;
//     loading: boolean;
//     error: string | null;
// }
//
// // Salary Slip Details Component for Show Details Modal
// const   SalarySlipDetails = ({
//                                salaryData,
//                                selectedUser
//                            }: {
//     salaryData: SalarySlipResponseData['data'];
//     selectedUser: UserData;
// }) => {
//     const formatCurrency = (amount: number) => {
//         return new Intl.NumberFormat('en-IN', {
//             style: 'currency',
//             currency: 'INR',
//             minimumFractionDigits: 2
//         }).format(amount);
//     };
//
//     const formatDate = (dateString: string) => {
//         return new Date(dateString).toLocaleDateString('en-IN', {
//             day: '2-digit',
//             month: 'short',
//             year: 'numeric'
//         });
//     };
//
//     const formatDateTime = (dateString: string) => {
//         return new Date(dateString).toLocaleString('en-IN', {
//             day: '2-digit',
//             month: 'short',
//             year: 'numeric',
//             hour: '2-digit',
//             minute: '2-digit',
//             second: '2-digit',
//             hour12: true
//         });
//     };
//
//     const getPolicyViolationStats = () => {
//         const stats = {
//             lateEntries: 0,
//             earlyLeaves: 0,
//             breakViolations: 0,
//             totalPolicyViolations: 0
//         };
//
//         salaryData.policyDetails.deductions.dailyDetails.forEach(day => {
//             if (day.lateEntry.deduction > 0) stats.lateEntries++;
//             if (day.earlyLeave.deduction > 0) stats.earlyLeaves++;
//             if (day.breaks.deduction > 0) stats.breakViolations++;
//             if (day.lateEntry.deduction > 0 || day.earlyLeave.deduction > 0 || day.breaks.deduction > 0) {
//                 stats.totalPolicyViolations++;
//             }
//         });
//
//         return stats;
//     };
//
//     const policyStats = getPolicyViolationStats();
//
//     return (
//         <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 bg-white rounded-xl shadow-xl border border-gray-200 space-y-6 md:space-y-8 lg:space-y-10">
//             {/* Header */}
//             <header className="flex flex-col md:flex-row justify-between items-start gap-6">
//                 <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
//                     <Avatar className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 border-4 border-white shadow-lg">
//                         <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl sm:text-2xl md:text-2xl font-extrabold select-none">
//                             {selectedUser.user_id.name?.charAt(0) || 'U'}
//                         </AvatarFallback>
//                     </Avatar>
//                     <div>
//                         <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">{salaryData.employeeDetails.name}</h1>
//                         <p className="text-sm md:text-lg text-gray-600 mt-1 break-words">{selectedUser.user_id.email}</p>
//                         <div className="flex flex-wrap gap-2 md:gap-3 mt-2 md:mt-3">
//                             <Badge variant="outline" className="text-xs md:text-sm px-3 md:px-4 py-1 uppercase tracking-wide font-semibold">
//                                 {selectedUser.roleDefinitionId.roleName}
//                             </Badge>
//                             <Badge variant="secondary" className="text-xs md:text-sm px-3 md:px-4 py-1 font-semibold">
//                                 {salaryData.employeeDetails.workType}
//                             </Badge>
//                             <Badge variant="default" className="text-xs md:text-sm px-3 md:px-4 py-1 bg-green-600 text-white font-semibold">
//                                 {salaryData.employeeDetails.employeeCode}
//                             </Badge>
//                         </div>
//                     </div>
//                 </div>
//
//                 <div className="text-right bg-white rounded-lg shadow border border-gray-300 px-4 md:px-6 py-4 md:py-5 w-full md:w-auto">
//                     <p className="text-xl md:text-2xl lg:text-3xl font-bold text-blue-700">
//                         {salaryData.salaryPeriod.month} {salaryData.salaryPeriod.year}
//                     </p>
//                     <p className="text-xs md:text-sm font-semibold text-gray-500">Pay Period</p>
//                     <p className="text-xs text-gray-400 mt-0.5">
//                         {formatDate(salaryData.salaryPeriod.fromDate)} - {formatDate(salaryData.salaryPeriod.toDate)}
//                     </p>
//                     <p className="text-xs text-gray-400 mt-0.5 truncate">
//                         Generated: {formatDateTime(salaryData.generatedAt)}
//                     </p>
//                 </div>
//             </header>
//
//             <Separator className="my-6 md:my-8" />
//
//             {/* Employee & Period Info */}
//             <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
//                 {/* Employee Info Card */}
//                 <Card className="shadow-lg border border-blue-200 rounded-lg">
//                     <CardHeader className="pb-4 md:pb-5 bg-gradient-to-r from-blue-100 to-blue-200 rounded-t-lg">
//                         <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center gap-2 md:gap-3 text-blue-800 font-semibold">
//                             <div className="p-1 md:p-2 bg-blue-600 rounded-lg">
//                                 <User className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
//                             </div>
//                             Employee Information
//                         </CardTitle>
//                         <p className="text-xs md:text-sm text-blue-700 mt-1 font-medium">Personal & Work Details</p>
//                     </CardHeader>
//                     <CardContent className="pt-4 md:pt-6 space-y-3 md:space-y-5">
//                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 text-gray-900">
//                             <div>
//                                 <label className="block text-xs md:text-sm font-semibold text-gray-600 mb-1">Employee ID</label>
//                                 <div className="text-sm md:text-lg font-bold font-mono break-words">{salaryData.employeeDetails.employeeId}</div>
//                             </div>
//                             <div>
//                                 <label className="block text-xs md:text-sm font-semibold text-gray-600 mb-1">Employee Code</label>
//                                 <div className="text-sm md:text-lg font-bold break-words">{salaryData.employeeDetails.employeeCode}</div>
//                             </div>
//                             <div>
//                                 <label className="block text-xs md:text-sm font-semibold text-gray-600 mb-1">Join Date</label>
//                                 <div className="text-sm md:text-lg font-bold">{formatDate(salaryData.employeeDetails.joinDate)}</div>
//                             </div>
//                             <div>
//                                 <label className="block text-xs md:text-sm font-semibold text-gray-600 mb-1">Work Type</label>
//                                 <div className="text-sm md:text-lg font-bold">{salaryData.employeeDetails.workType}</div>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>
//
//                 {/* Period & Attendance Card */}
//                 <Card className="shadow-lg border border-green-200 rounded-lg">
//                     <CardHeader className="pb-4 md:pb-5 bg-gradient-to-r from-green-100 to-emerald-200 rounded-t-lg">
//                         <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center gap-2 md:gap-3 text-green-800 font-semibold">
//                             <div className="p-1 md:p-2 bg-green-600 rounded-lg">
//                                 <Calendar className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
//                             </div>
//                             Attendance Summary
//                         </CardTitle>
//                         <p className="text-xs md:text-sm text-green-700 mt-1 font-medium">Working & Payable Days</p>
//                     </CardHeader>
//                     <CardContent className="pt-4 md:pt-6">
//                         <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
//                             <div className="text-center bg-white rounded-lg p-3 md:p-4 border border-green-300 shadow-sm">
//                                 <div className="text-lg md:text-2xl lg:text-3xl font-extrabold text-green-600 mb-1 md:mb-2">{salaryData.attendanceSummary.totalWorkingDays}</div>
//                                 <div className="text-xs md:text-sm text-gray-600 font-semibold">Total Working Days</div>
//                             </div>
//                             <div className="text-center bg-white rounded-lg p-3 md:p-4 border border-green-300 shadow-sm">
//                                 <div className="text-lg md:text-2xl lg:text-3xl font-extrabold text-green-600 mb-1 md:mb-2">{salaryData.attendanceSummary.presentDays}</div>
//                                 <div className="text-xs md:text-sm text-gray-600 font-semibold">Present Days</div>
//                             </div>
//                             <div className="text-center bg-white rounded-lg p-3 md:p-4 border border-yellow-300 shadow-sm">
//                                 <div className="text-lg md:text-2xl lg:text-3xl font-extrabold text-yellow-600 mb-1 md:mb-2">{salaryData.attendanceSummary.paidLeaves}</div>
//                                 <div className="text-xs md:text-sm text-gray-600 font-semibold">Paid Leaves</div>
//                             </div>
//                             <div className="text-center bg-white rounded-lg p-3 md:p-4 border border-red-300 shadow-sm">
//                                 <div className="text-lg md:text-2xl lg:text-3xl font-extrabold text-red-600 mb-1 md:mb-2">{salaryData.attendanceSummary.unpaidLeaves}</div>
//                                 <div className="text-xs md:text-sm text-gray-600 font-semibold">Unpaid Leaves</div>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>
//             </section>
//
//             {/* Earnings & Deductions */}
//             <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 lg:gap-10 mt-6 md:mt-8 lg:mt-10">
//                 {/* Earnings */}
//                 <Card className="shadow-lg border border-green-300 rounded-lg">
//                     <CardHeader className="pb-4 md:pb-5 bg-gradient-to-r from-green-100 to-emerald-200 rounded-t-lg border-b border-green-300">
//                         <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center gap-2 md:gap-3 text-green-800 font-semibold">
//                             <div className="p-1 md:p-2 bg-green-600 rounded-lg">
//                                 <TrendingUp className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
//                             </div>
//                             Earnings
//                         </CardTitle>
//                         <p className="text-xs md:text-sm text-green-700 mt-1 font-medium">Salary Components & Benefits</p>
//                     </CardHeader>
//                     <CardContent className="p-0">
//                         <Table>
//                             <TableHeader>
//                                 <TableRow className="bg-green-50 hover:bg-green-50">
//                                     <TableHead className="text-green-800 font-bold py-3 md:py-4">Component</TableHead>
//                                     <TableHead className="text-green-800 font-bold py-3 md:py-4 text-right">Amount</TableHead>
//                                 </TableRow>
//                             </TableHeader>
//                             <TableBody>
//                                 <TableRow className="hover:bg-green-50/50">
//                                     <TableCell className="py-3 md:py-4">
//                                         <div className="font-semibold text-gray-900 text-sm md:text-base">Basic Salary</div>
//                                         <p className="text-xs md:text-sm text-gray-500 mt-1">Base salary component</p>
//                                     </TableCell>
//                                     <TableCell className="py-3 md:py-4 text-right font-bold text-green-700 text-base md:text-lg">
//                                         {formatCurrency(salaryData.earnings.basic)}
//                                     </TableCell>
//                                 </TableRow>
//                                 <TableRow className="hover:bg-green-50/50">
//                                     <TableCell className="py-3 md:py-4">
//                                         <div className="font-semibold text-gray-900 text-sm md:text-base">HRA (House Rent Allowance)</div>
//                                         <p className="text-xs md:text-sm text-gray-500 mt-1">Housing allowance</p>
//                                     </TableCell>
//                                     <TableCell className="py-3 md:py-4 text-right font-bold text-green-700 text-base md:text-lg">
//                                         {formatCurrency(salaryData.earnings.hra)}
//                                     </TableCell>
//                                 </TableRow>
//                                 <TableRow className="hover:bg-green-50/50">
//                                     <TableCell className="py-3 md:py-4">
//                                         <div className="font-semibold text-gray-900 text-sm md:text-base">Other Allowances</div>
//                                         <p className="text-xs md:text-sm text-gray-500 mt-1">Additional allowances</p>
//                                     </TableCell>
//                                     <TableCell className="py-3 md:py-4 text-right font-bold text-green-700 text-base md:text-lg">
//                                         {formatCurrency(salaryData.earnings.allowances)}
//                                     </TableCell>
//                                 </TableRow>
//                                 <TableRow className="hover:bg-green-50/50">
//                                     <TableCell className="py-3 md:py-4">
//                                         <div className="font-semibold text-gray-900 text-sm md:text-base">Overtime Pay</div>
//                                         <p className="text-xs md:text-sm text-gray-500 mt-1">Extra hours worked</p>
//                                     </TableCell>
//                                     <TableCell className="py-3 md:py-4 text-right font-bold text-green-700 text-base md:text-lg">
//                                         {formatCurrency(salaryData.earnings.overtimePay)}
//                                     </TableCell>
//                                 </TableRow>
//                                 <TableRow className="bg-gradient-to-r from-green-50 to-emerald-100 border-t-2 border-green-300">
//                                     <TableCell className="py-3 md:py-4 font-bold text-green-900 text-base md:text-lg">Total Earnings</TableCell>
//                                     <TableCell className="py-3 md:py-4 text-right font-bold text-green-900 text-lg md:text-xl">
//                                         {formatCurrency(salaryData.earnings.totalEarnings)}
//                                     </TableCell>
//                                 </TableRow>
//                             </TableBody>
//                         </Table>
//                     </CardContent>
//                 </Card>
//
//                 {/* Deductions */}
//                 <Card className="shadow-lg border border-red-300 rounded-lg">
//                     <CardHeader className="pb-4 md:pb-5 bg-gradient-to-r from-red-100 to-pink-100 rounded-t-lg border-b border-red-300">
//                         <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center gap-2 md:gap-3 text-red-800 font-semibold">
//                             <div className="p-1 md:p-2 bg-red-600 rounded-lg">
//                                 <TrendingUp className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
//                             </div>
//                             Deductions
//                         </CardTitle>
//                         <p className="text-xs md:text-sm text-red-700 mt-1 font-medium">Taxes & Other Deductions</p>
//                     </CardHeader>
//                     <CardContent className="p-0">
//                         <Table>
//                             <TableHeader>
//                                 <TableRow className="bg-red-50 hover:bg-red-50">
//                                     <TableHead className="text-red-800 font-bold py-3 md:py-4">Component</TableHead>
//                                     <TableHead className="text-red-800 font-bold py-3 md:py-4 text-right">Amount</TableHead>
//                                 </TableRow>
//                             </TableHeader>
//                             <TableBody>
//                                 <TableRow className="hover:bg-red-50/50">
//                                     <TableCell className="py-3 md:py-4">
//                                         <div className="font-semibold text-gray-900 text-sm md:text-base">Salary Deduction</div>
//                                         <p className="text-xs md:text-sm text-gray-500 mt-1">Unpaid leaves deduction</p>
//                                     </TableCell>
//                                     <TableCell className="py-3 md:py-4 text-right font-bold text-red-700 text-base md:text-lg">
//                                         {formatCurrency(salaryData.deductions.salaryDeduction)}
//                                     </TableCell>
//                                 </TableRow>
//                                 <TableRow className="hover:bg-red-50/50">
//                                     <TableCell className="py-3 md:py-4">
//                                         <div className="font-semibold text-gray-900 text-sm md:text-base">Policy Deductions</div>
//                                         <p className="text-xs md:text-sm text-gray-500 mt-1">Policy violations & penalties</p>
//                                     </TableCell>
//                                     <TableCell className="py-3 md:py-4 text-right font-bold text-red-700 text-base md:text-lg">
//                                         {formatCurrency(salaryData.deductions.policyDeductions)}
//                                     </TableCell>
//                                 </TableRow>
//                                 <TableRow className="hover:bg-red-50/50">
//                                     <TableCell className="py-3 md:py-4">
//                                         <div className="font-semibold text-gray-900 text-sm md:text-base">Other Deductions</div>
//                                         <p className="text-xs md:text-sm text-gray-500 mt-1">Miscellaneous deductions</p>
//                                     </TableCell>
//                                     <TableCell className="py-3 md:py-4 text-right font-bold text-red-700 text-base md:text-lg">
//                                         {formatCurrency(salaryData.deductions.otherDeductions)}
//                                     </TableCell>
//                                 </TableRow>
//                                 <TableRow className="bg-gradient-to-r from-red-50 to-pink-100 border-t-2 border-red-300">
//                                     <TableCell className="py-3 md:py-4 font-bold text-red-900 text-base md:text-lg">Total Deductions</TableCell>
//                                     <TableCell className="py-3 md:py-4 text-right font-bold text-red-900 text-lg md:text-xl">
//                                         {formatCurrency(salaryData.deductions.totalDeductions)}
//                                     </TableCell>
//                                 </TableRow>
//                             </TableBody>
//                         </Table>
//                     </CardContent>
//                 </Card>
//             </section>
//
//             {/* Policy Deductions Details */}
//             <Card className="shadow-lg border border-orange-300 rounded-lg">
//                 <CardHeader className="pb-4 md:pb-5 bg-gradient-to-r from-orange-100 to-amber-200 rounded-t-lg">
//                     <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center gap-2 md:gap-3 text-orange-800 font-semibold">
//                         <div className="p-1 md:p-2 bg-orange-600 rounded-lg">
//                             <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
//                         </div>
//                         Policy Deductions Breakdown
//                     </CardTitle>
//                     <p className="text-xs md:text-sm text-orange-700 mt-1 font-medium">Late Entries, Early Leaves & Break Violations</p>
//                 </CardHeader>
//                 <CardContent>
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
//                         <div className="bg-orange-50 rounded-lg p-4 md:p-5 border border-orange-200">
//                             <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
//                                 <Clock8 className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
//                                 <h4 className="font-semibold text-orange-800 text-sm md:text-base">Late Entry Deductions</h4>
//                             </div>
//                             <div className="text-xl md:text-2xl lg:text-3xl font-bold text-orange-700 mb-1 md:mb-2">
//                                 {formatCurrency(salaryData.policyDetails.deductions.summary.lateEntryDeductions)}
//                             </div>
//                             <p className="text-xs md:text-sm text-orange-600">
//                                 {policyStats.lateEntries} late entry violation(s)
//                             </p>
//                         </div>
//                         <div className="bg-red-50 rounded-lg p-4 md:p-5 border border-red-200">
//                             <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
//                                 <LogOut className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
//                                 <h4 className="font-semibold text-red-800 text-sm md:text-base">Early Leave Deductions</h4>
//                             </div>
//                             <div className="text-xl md:text-2xl lg:text-3xl font-bold text-red-700 mb-1 md:mb-2">
//                                 {formatCurrency(salaryData.policyDetails.deductions.summary.earlyLeaveDeductions)}
//                             </div>
//                             <p className="text-xs md:text-sm text-red-600">
//                                 {policyStats.earlyLeaves} early leave violation(s)
//                             </p>
//                         </div>
//                         <div className="bg-purple-50 rounded-lg p-4 md:p-5 border border-purple-200">
//                             <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
//                                 <Coffee className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
//                                 <h4 className="font-semibold text-purple-800 text-sm md:text-base">Break Violation Deductions</h4>
//                             </div>
//                             <div className="text-xl md:text-2xl lg:text-3xl font-bold text-purple-700 mb-1 md:mb-2">
//                                 {formatCurrency(salaryData.policyDetails.deductions.summary.breakDeductions)}
//                             </div>
//                             <p className="text-xs md:text-sm text-purple-600">
//                                 {policyStats.breakViolations} break violation(s)
//                             </p>
//                         </div>
//                     </div>
//
//                     {/* Daily Policy Details Table */}
//                     <div className="overflow-x-auto">
//                         <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4 text-gray-700">Daily Violation Details</h4>
//                         <Table>
//                             <TableHeader>
//                                 <TableRow>
//                                     <TableHead className="text-xs md:text-sm">Date</TableHead>
//                                     <TableHead className="text-xs md:text-sm text-center">Late Entry</TableHead>
//                                     <TableHead className="text-xs md:text-sm text-center">Early Leave</TableHead>
//                                     <TableHead className="text-xs md:text-sm text-center">Break Violation</TableHead>
//                                     <TableHead className="text-xs md:text-sm text-right">Total Deduction</TableHead>
//                                 </TableRow>
//                             </TableHeader>
//                             <TableBody>
//                                 {salaryData.policyDetails.deductions.dailyDetails
//                                     .filter(day => day.lateEntry.deduction > 0 || day.earlyLeave.deduction > 0 || day.breaks.deduction > 0)
//                                     .map((day, index) => (
//                                         <TableRow key={index}>
//                                             <TableCell className="font-medium text-xs md:text-sm">
//                                                 {formatDate(day.date)}
//                                             </TableCell>
//                                             <TableCell className="text-center">
//                                                 {day.lateEntry.deduction > 0 ? (
//                                                     <div className="inline-flex flex-col">
//                                                         <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
//                                                             {formatCurrency(day.lateEntry.deduction)}
//                                                         </Badge>
//                                                         <span className="text-xs text-gray-500 mt-1">
//                                                             {day.lateEntry.violationMinutes} min
//                                                         </span>
//                                                     </div>
//                                                 ) : (
//                                                     <span className="text-gray-400 text-xs md:text-sm">-</span>
//                                                 )}
//                                             </TableCell>
//                                             <TableCell className="text-center">
//                                                 {day.earlyLeave.deduction > 0 ? (
//                                                     <div className="inline-flex flex-col">
//                                                         <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
//                                                             {formatCurrency(day.earlyLeave.deduction)}
//                                                         </Badge>
//                                                         <span className="text-xs text-gray-500 mt-1">
//                                                             {day.earlyLeave.violationMinutes} min
//                                                         </span>
//                                                     </div>
//                                                 ) : (
//                                                     <span className="text-gray-400 text-xs md:text-sm">-</span>
//                                                 )}
//                                             </TableCell>
//                                             <TableCell className="text-center">
//                                                 {day.breaks.deduction > 0 ? (
//                                                     <div className="inline-flex flex-col">
//                                                         <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
//                                                             {formatCurrency(day.breaks.deduction)}
//                                                         </Badge>
//                                                         <span className="text-xs text-gray-500 mt-1">
//                                                             {day.breaks.violationMinutes} min
//                                                         </span>
//                                                     </div>
//                                                 ) : (
//                                                     <span className="text-gray-400 text-xs md:text-sm">-</span>
//                                                 )}
//                                             </TableCell>
//                                             <TableCell className="text-right font-bold text-xs md:text-sm">
//                                                 {formatCurrency(day.lateEntry.deduction + day.earlyLeave.deduction + day.breaks.deduction)}
//                                             </TableCell>
//                                         </TableRow>
//                                     ))}
//                                 {salaryData.policyDetails.deductions.dailyDetails.filter(day =>
//                                     day.lateEntry.deduction > 0 || day.earlyLeave.deduction > 0 || day.breaks.deduction > 0
//                                 ).length === 0 && (
//                                     <TableRow>
//                                         <TableCell colSpan={5} className="text-center py-6 md:py-8 text-gray-500 text-sm">
//                                             No policy violations for this period
//                                         </TableCell>
//                                     </TableRow>
//                                 )}
//                             </TableBody>
//                         </Table>
//                     </div>
//                 </CardContent>
//             </Card>
//
//             {/* Salary Summary & Calculation */}
//             <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 lg:gap-10 mt-6 md:mt-8 lg:mt-10">
//                 {/* Salary Summary */}
//                 <Card className="shadow-2xl border-2 border-blue-400 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white rounded-xl">
//                     <CardHeader className="pb-4 md:pb-6">
//                         <CardTitle className="text-xl md:text-2xl lg:text-3xl flex items-center gap-3 md:gap-4">
//                             <div className="p-2 md:p-3 bg-white/30 rounded-lg backdrop-blur-sm">
//                                 <DollarSign className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8" />
//                             </div>
//                             Salary Summary
//                         </CardTitle>
//                         <p className="text-xs md:text-sm font-normal text-blue-100 mt-1">Final Take Home Amount</p>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 text-center">
//                             <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 md:p-6 lg:p-8 border border-white/25">
//                                 <div className="text-blue-200 text-xs md:text-sm font-semibold mb-2 md:mb-3">Gross Salary</div>
//                                 <div className="text-2xl md:text-3xl lg:text-4xl font-extrabold">{formatCurrency(salaryData.earnings.totalEarnings)}</div>
//                             </div>
//                             <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 md:p-6 lg:p-8 border border-white/25">
//                                 <div className="text-blue-200 text-xs md:text-sm font-semibold mb-2 md:mb-3">Total Deductions</div>
//                                 <div className="text-2xl md:text-3xl lg:text-4xl font-extrabold">{formatCurrency(salaryData.deductions.totalDeductions)}</div>
//                             </div>
//                             <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4 md:p-6 lg:p-8 border-2 border-green-400 shadow-lg">
//                                 <div className="text-green-200 text-xs md:text-sm font-semibold mb-2 md:mb-3">Net Salary</div>
//                                 <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-green-300">{formatCurrency(salaryData.netSalary)}</div>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>
//
//                 {/* Calculation Details */}
//                 <Card className="shadow-lg border border-purple-300 rounded-lg">
//                     <CardHeader className="pb-4 md:pb-5 bg-gradient-to-r from-purple-100 to-violet-200 rounded-t-lg">
//                         <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center gap-2 md:gap-3 text-purple-800 font-semibold">
//                             <div className="p-1 md:p-2 bg-purple-600 rounded-lg">
//                                 <Calculator className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
//                             </div>
//                             Calculation Details
//                         </CardTitle>
//                         <p className="text-xs md:text-sm text-purple-700 mt-1 font-medium">Salary Computation Formulas</p>
//                     </CardHeader>
//                     <CardContent className="pt-4 md:pt-6 space-y-3 md:space-y-5 text-gray-900">
//                         <div className="space-y-3 md:space-y-4">
//                             <div className="flex justify-between border-b border-purple-100 pb-2 md:pb-3">
//                                 <span className="font-medium text-gray-600 text-sm md:text-base">Per Day Rate:</span>
//                                 <span className="font-bold text-gray-900 text-sm md:text-base">{formatCurrency(salaryData.calculation.perDayRate)}</span>
//                             </div>
//                             <div className="flex flex-col border-b border-purple-100 pb-2 md:pb-3">
//                                 <span className="font-medium text-gray-600 mb-1 md:mb-2 text-sm md:text-base">Per Day Formula:</span>
//                                 <code className="bg-purple-50 p-2 md:p-3 rounded-md text-xs md:text-sm font-mono text-purple-800 break-words">
//                                     {salaryData.calculation.perDayFormula}
//                                 </code>
//                             </div>
//                             <div className="flex flex-col border-b border-purple-100 pb-2 md:pb-3">
//                                 <span className="font-medium text-gray-600 mb-1 md:mb-2 text-sm md:text-base">Working Days Formula:</span>
//                                 <code className="bg-purple-50 p-2 md:p-3 rounded-md text-xs md:text-sm font-mono text-purple-800 break-words">
//                                     {salaryData.calculation.workingDaysFormula}
//                                 </code>
//                             </div>
//                             <div className="flex flex-col">
//                                 <span className="font-medium text-gray-600 mb-1 md:mb-2 text-sm md:text-base">Calculation Notes:</span>
//                                 <div className="bg-blue-50 p-3 md:p-4 rounded-md text-xs md:text-sm text-blue-800">
//                                     <Info className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
//                                     {salaryData.calculationNotes}
//                                 </div>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>
//             </section>
//
//             {/* Bank Details & Additional Info */}
//             {salaryData.bankDetails && (
//                 <Card className="shadow-lg border border-gray-300 rounded-lg mt-6 md:mt-8 lg:mt-10">
//                     <CardHeader className="pb-4 md:pb-5 bg-gradient-to-r from-gray-100 to-gray-200 rounded-t-lg">
//                         <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center gap-2 md:gap-3 text-gray-800 font-semibold">
//                             <div className="p-1 md:p-2 bg-gray-600 rounded-lg">
//                                 <Banknote className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
//                             </div>
//                             Bank Details & Additional Information
//                         </CardTitle>
//                         <p className="text-xs md:text-sm text-gray-700 mt-1 font-medium">Salary Transfer & System Information</p>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
//                             {/* Bank Details */}
//                             <div className="space-y-3 md:space-y-5">
//                                 <h4 className="font-semibold text-base md:text-lg text-gray-700">Bank Details</h4>
//                                 <div className="space-y-3 md:space-y-4 text-gray-900">
//                                     <div className="flex justify-between border-b border-gray-200 pb-2 md:pb-3">
//                                         <span className="font-medium text-gray-600 text-sm md:text-base">Account Holder:</span>
//                                         <span className="font-semibold text-gray-900 text-sm md:text-base">{salaryData.bankDetails.accountHolderName}</span>
//                                     </div>
//                                     <div className="flex justify-between border-b border-gray-200 pb-2 md:pb-3">
//                                         <span className="font-medium text-gray-600 text-sm md:text-base">Account Number:</span>
//                                         <span className="font-semibold text-gray-900 font-mono text-sm md:text-base">{salaryData.bankDetails.accountNumber}</span>
//                                     </div>
//                                     <div className="flex justify-between border-b border-gray-200 pb-2 md:pb-3">
//                                         <span className="font-medium text-gray-600 text-sm md:text-base">IFSC Code:</span>
//                                         <span className="font-semibold text-gray-900 font-mono text-sm md:text-base">{salaryData.bankDetails.ifsc}</span>
//                                     </div>
//                                     <div className="flex justify-between border-b border-gray-200 pb-2 md:pb-3">
//                                         <span className="font-medium text-gray-600 text-sm md:text-base">Bank Name:</span>
//                                         <span className="font-semibold text-gray-900 text-sm md:text-base">{salaryData.bankDetails.bankName}</span>
//                                     </div>
//                                 </div>
//                             </div>
//
//                             {/* System Information */}
//                             <div className="space-y-3 md:space-y-5">
//                                 <h4 className="font-semibold text-base md:text-lg text-gray-700">System Information</h4>
//                                 <div className="space-y-3 md:space-y-4 text-gray-900">
//                                     <div className="flex justify-between border-b border-gray-200 pb-2 md:pb-3">
//                                         <span className="font-medium text-gray-600 text-sm md:text-base">Generated At:</span>
//                                         <span className="font-semibold text-gray-900 text-sm md:text-base">{formatDateTime(salaryData.generatedAt)}</span>
//                                     </div>
//                                     <div className="flex justify-between border-b border-gray-200 pb-2 md:pb-3">
//                                         <span className="font-medium text-gray-600 text-sm md:text-base">Employee ID:</span>
//                                         <span className="font-semibold text-gray-900 font-mono text-sm md:text-base">{salaryData.employeeDetails.employeeId}</span>
//                                     </div>
//                                     <div className="flex justify-between border-b border-gray-200 pb-2 md:pb-3">
//                                         <span className="font-medium text-gray-600 text-sm md:text-base">Month Number:</span>
//                                         <span className="font-semibold text-gray-900 text-sm md:text-base">{salaryData.salaryPeriod.monthNumber}</span>
//                                     </div>
//                                     <div className="flex justify-between border-b border-gray-200 pb-2 md:pb-3">
//                                         <span className="font-medium text-gray-600 text-sm md:text-base">Year:</span>
//                                         <span className="font-semibold text-gray-900 text-sm md:text-base">{salaryData.salaryPeriod.year}</span>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>
//             )}
//         </div>
//     );
// };
//
// const PdfSalarySlip = ({
//                            salaryData,
//                            selectedUser
//                        }: {
//     salaryData: SalarySlipResponseData['data'];
//     selectedUser: UserData;
// }) => {
//     const formatDate = (dateString: string) => {
//         return new Date(dateString).toLocaleDateString('en-IN', {
//             day: '2-digit',
//             month: 'short',
//             year: 'numeric'
//         });
//     };
//
//     const numberToWords = (num: number): string => {
//         const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
//         const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
//         const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
//
//         if (num === 0) return 'Zero';
//
//         const convertHundreds = (n: number): string => {
//             let result = '';
//             if (n >= 100) {
//                 result += ones[Math.floor(n / 100)] + ' Hundred ';
//                 n %= 100;
//             }
//             if (n >= 20) {
//                 result += tens[Math.floor(n / 10)] + ' ';
//                 n %= 10;
//             } else if (n >= 10) {
//                 result += teens[n - 10] + ' ';
//                 return result;
//             }
//             if (n > 0) {
//                 result += ones[n] + ' ';
//             }
//             return result;
//         };
//
//         if (num >= 10000000) {
//             const crores = Math.floor(num / 10000000);
//             const remaining = num % 10000000;
//             return convertHundreds(crores) + 'Crore ' + numberToWords(remaining);
//         } else if (num >= 100000) {
//             const lakhs = Math.floor(num / 100000);
//             const remaining = num % 100000;
//             return convertHundreds(lakhs) + 'Lakh ' + numberToWords(remaining);
//         } else if (num >= 1000) {
//             const thousands = Math.floor(num / 1000);
//             const remaining = num % 1000;
//             return convertHundreds(thousands) + 'Thousand ' + numberToWords(remaining);
//         } else {
//             return convertHundreds(num);
//         }
//     };
//
//     const getPolicyViolationStats = () => {
//         const stats = {
//             lateEntries: 0,
//             earlyLeaves: 0,
//             breakViolations: 0
//         };
//
//         salaryData.policyDetails.deductions.dailyDetails.forEach(day => {
//             if (day.lateEntry.deduction > 0) stats.lateEntries++;
//             if (day.earlyLeave.deduction > 0) stats.earlyLeaves++;
//             if (day.breaks.deduction > 0) stats.breakViolations++;
//         });
//
//         return stats;
//     };
//
//     const policyStats = getPolicyViolationStats();
//
//     return (
//         <div
//             id="salary-slip-pdf"
//             style={{
//                 width: '100%',
//                 maxWidth: '800px',
//                 minHeight: '600px',
//                 padding: '15px',
//                 margin: '0 auto',
//                 backgroundColor: '#ffffff',
//                 color: '#000000',
//                 fontFamily: 'Arial, sans-serif',
//                 fontSize: '14px',
//                 lineHeight: '1.4',
//                 boxSizing: 'border-box'
//             }}
//         >
//             <table style={{
//                 width: '100%',
//                 border: '2px solid #000',
//                 borderCollapse: 'collapse',
//                 marginBottom: '20px',
//                 fontSize: '12px'
//             }}>
//                 <tbody>
//                 {/* Header */}
//                 <tr>
//                     <td colSpan={2} style={{
//                         textAlign: 'center',
//                         backgroundColor: '#f0f0f0',
//                         padding: '10px',
//                         border: '1px solid #000',
//                         fontWeight: 'bold',
//                         fontSize: '14px'
//                     }}>
//                         Payslip - {salaryData.salaryPeriod.month} {salaryData.salaryPeriod.year}
//                     </td>
//                 </tr>
//
//                 {/* Company Info */}
//                 <tr>
//                     <td colSpan={2} style={{
//                         textAlign: 'center',
//                         padding: '15px',
//                         border: '1px solid #000'
//                     }}>
//                         <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '6px' }}>
//                             PulseSeal
//                         </div>
//                         <div style={{ fontSize: '11px', margin: '3px 0', fontWeight: '600' }}>
//                             Salary Period: {formatDate(salaryData.salaryPeriod.fromDate)} to {formatDate(salaryData.salaryPeriod.toDate)}
//                         </div>
//                         <div style={{ fontSize: '10px', margin: '3px 0', color: '#666' }}>
//                             Generated: {new Date(salaryData.generatedAt).toLocaleString('en-IN')}
//                         </div>
//                     </td>
//                 </tr>
//
//                 {/* Employee Details */}
//                 <tr>
//                     <td style={{
//                         width: '50%',
//                         padding: '12px',
//                         border: '1px solid #000',
//                         verticalAlign: 'top'
//                     }}>
//                         <div style={{ marginBottom: '10px' }}>
//                             <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Employee Name:</span>
//                             <br />
//                             <span style={{ fontSize: '13px' }}>{salaryData.employeeDetails.name}</span>
//                         </div>
//                         <div style={{ marginBottom: '10px' }}>
//                             <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Employee Code:</span>
//                             <br />
//                             <span style={{ fontSize: '13px' }}>{salaryData.employeeDetails.employeeCode}</span>
//                         </div>
//                         <div style={{ marginBottom: '10px' }}>
//                             <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Employee ID:</span>
//                             <br />
//                             <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{salaryData.employeeDetails.employeeId}</span>
//                         </div>
//                         <div>
//                             <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Work Type:</span>
//                             <br />
//                             <span style={{ fontSize: '13px' }}>{salaryData.employeeDetails.workType}</span>
//                         </div>
//                     </td>
//                     <td style={{
//                         width: '50%',
//                         padding: '12px',
//                         border: '1px solid #000',
//                         verticalAlign: 'top'
//                     }}>
//                         <div style={{ marginBottom: '10px' }}>
//                             <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Join Date:</span>
//                             <br />
//                             <span style={{ fontSize: '13px' }}>{formatDate(salaryData.employeeDetails.joinDate)}</span>
//                         </div>
//                         <div style={{ marginBottom: '10px' }}>
//                             <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Designation:</span>
//                             <br />
//                             <span style={{ fontSize: '13px' }}>{selectedUser?.roleDefinitionId.roleName || 'N/A'}</span>
//                         </div>
//                         <div style={{ marginBottom: '10px' }}>
//                             <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Per Day Rate:</span>
//                             <br />
//                             <span style={{ fontSize: '13px' }}>₹{salaryData.calculation.perDayRate.toFixed(2)}</span>
//                         </div>
//                     </td>
//                 </tr>
//
//                 {/* Attendance Summary */}
//                 <tr>
//                     <td colSpan={2} style={{
//                         padding: '10px',
//                         border: '1px solid #000',
//                         backgroundColor: '#f8f9fa'
//                     }}>
//                         <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '13px' }}>Attendance Summary</div>
//                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', fontSize: '11px' }}>
//                             <div>
//                                 <div style={{ fontWeight: '600' }}>Total Working Days</div>
//                                 <div>{salaryData.attendanceSummary.totalWorkingDays}</div>
//                             </div>
//                             <div>
//                                 <div style={{ fontWeight: '600' }}>Present Days</div>
//                                 <div>{salaryData.attendanceSummary.presentDays}</div>
//                             </div>
//                             <div>
//                                 <div style={{ fontWeight: '600' }}>Paid Leaves</div>
//                                 <div>{salaryData.attendanceSummary.paidLeaves}</div>
//                             </div>
//                             <div>
//                                 <div style={{ fontWeight: '600' }}>Unpaid Leaves</div>
//                                 <div>{salaryData.attendanceSummary.unpaidLeaves}</div>
//                             </div>
//                         </div>
//                     </td>
//                 </tr>
//
//                 {/* Earnings Header */}
//                 <tr>
//                     <td style={{
//                         padding: '10px',
//                         fontWeight: 'bold',
//                         textAlign: 'center',
//                         border: '1px solid #000',
//                         backgroundColor: '#f0f0f0',
//                         fontSize: '13px'
//                     }}>
//                         Earnings
//                     </td>
//                     <td style={{
//                         padding: '10px',
//                         fontWeight: 'bold',
//                         textAlign: 'center',
//                         border: '1px solid #000',
//                         backgroundColor: '#f0f0f0',
//                         width: '120px',
//                         fontSize: '13px'
//                     }}>
//                         Amount
//                     </td>
//                 </tr>
//
//                 {/* Earnings Items */}
//                 <tr>
//                     <td style={{ padding: '10px', border: '1px solid #000' }}>
//                         <div style={{ fontWeight: '500', fontSize: '13px' }}>Basic Salary</div>
//                         <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>Base salary component</div>
//                     </td>
//                     <td style={{ padding: '10px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
//                         ₹{salaryData.earnings.basic.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </td>
//                 </tr>
//                 <tr>
//                     <td style={{ padding: '10px', border: '1px solid #000' }}>
//                         <div style={{ fontWeight: '500', fontSize: '13px' }}>HRA (House Rent Allowance)</div>
//                         <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>Housing allowance</div>
//                     </td>
//                     <td style={{ padding: '10px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
//                         ₹{salaryData.earnings.hra.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </td>
//                 </tr>
//                 <tr>
//                     <td style={{ padding: '10px', border: '1px solid #000' }}>
//                         <div style={{ fontWeight: '500', fontSize: '13px' }}>Other Allowances</div>
//                         <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>Additional allowances</div>
//                     </td>
//                     <td style={{ padding: '10px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
//                         ₹{salaryData.earnings.allowances.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </td>
//                 </tr>
//                 <tr>
//                     <td style={{ padding: '10px', border: '1px solid #000' }}>
//                         <div style={{ fontWeight: '500', fontSize: '13px' }}>Overtime Pay</div>
//                         <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>Extra hours worked</div>
//                     </td>
//                     <td style={{ padding: '10px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
//                         ₹{salaryData.earnings.overtimePay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </td>
//                 </tr>
//
//                 {/* Total Earnings */}
//                 <tr>
//                     <td style={{
//                         padding: '10px',
//                         fontWeight: 'bold',
//                         textAlign: 'right',
//                         border: '1px solid #000',
//                         backgroundColor: '#f0f0f0',
//                         fontSize: '13px'
//                     }}>
//                         Total Earnings
//                     </td>
//                     <td style={{
//                         padding: '10px',
//                         fontWeight: 'bold',
//                         textAlign: 'right',
//                         border: '1px solid #000',
//                         backgroundColor: '#f0f0f0',
//                         fontSize: '13px'
//                     }}>
//                         ₹{salaryData.earnings.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </td>
//                 </tr>
//
//                 {/* Deductions Header */}
//                 <tr>
//                     <td style={{
//                         padding: '10px',
//                         fontWeight: 'bold',
//                         textAlign: 'center',
//                         border: '1px solid #000',
//                         backgroundColor: '#f0f0f0',
//                         fontSize: '13px'
//                     }}>
//                         Deductions
//                     </td>
//                     <td style={{
//                         padding: '10px',
//                         fontWeight: 'bold',
//                         textAlign: 'center',
//                         border: '1px solid #000',
//                         backgroundColor: '#f0f0f0',
//                         fontSize: '13px'
//                     }}>
//                         Amount
//                     </td>
//                 </tr>
//
//                 {/* Deductions Items */}
//                 <tr>
//                     <td style={{ padding: '10px', border: '1px solid #000' }}>
//                         <div style={{ fontWeight: '500', fontSize: '13px' }}>Salary Deduction (Unpaid Leaves)</div>
//                         <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{salaryData.attendanceSummary.unpaidLeaves} unpaid leave(s)</div>
//                     </td>
//                     <td style={{ padding: '10px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
//                         ₹{salaryData.deductions.salaryDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </td>
//                 </tr>
//                 <tr>
//                     <td style={{ padding: '10px', border: '1px solid #000' }}>
//                         <div style={{ fontWeight: '500', fontSize: '13px' }}>Policy Deductions</div>
//                         <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
//                             Late: {policyStats.lateEntries}, Early: {policyStats.earlyLeaves}, Break: {policyStats.breakViolations}
//                         </div>
//                     </td>
//                     <td style={{ padding: '10px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
//                         ₹{salaryData.deductions.policyDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </td>
//                 </tr>
//                 <tr>
//                     <td style={{ padding: '10px', border: '1px solid #000' }}>
//                         <div style={{ fontWeight: '500', fontSize: '13px' }}>Other Deductions</div>
//                         <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>Miscellaneous deductions</div>
//                     </td>
//                     <td style={{ padding: '10px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
//                         ₹{salaryData.deductions.otherDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </td>
//                 </tr>
//
//                 {/* Total Deductions */}
//                 <tr>
//                     <td style={{
//                         padding: '10px',
//                         fontWeight: 'bold',
//                         textAlign: 'right',
//                         border: '1px solid #000',
//                         backgroundColor: '#f0f0f0',
//                         fontSize: '13px'
//                     }}>
//                         Total Deductions
//                     </td>
//                     <td style={{
//                         padding: '10px',
//                         fontWeight: 'bold',
//                         textAlign: 'right',
//                         border: '1px solid #000',
//                         backgroundColor: '#f0f0f0',
//                         fontSize: '13px'
//                     }}>
//                         ₹{salaryData.deductions.totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </td>
//                 </tr>
//
//                 {/* Net Pay */}
//                 <tr>
//                     <td style={{
//                         padding: '10px',
//                         fontWeight: 'bold',
//                         textAlign: 'right',
//                         border: '1px solid #000',
//                         backgroundColor: '#e8f4fd',
//                         fontSize: '13px'
//                     }}>
//                         Net Pay
//                     </td>
//                     <td style={{
//                         padding: '10px',
//                         fontWeight: 'bold',
//                         textAlign: 'right',
//                         border: '1px solid #000',
//                         backgroundColor: '#e8f4fd',
//                         fontSize: '14px'
//                     }}>
//                         ₹{salaryData.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </td>
//                 </tr>
//                 </tbody>
//             </table>
//
//             {/* Policy Deductions Breakdown */}
//             <div style={{
//                 marginBottom: '20px',
//                 marginTop: '50px',
//                 padding: '12px',
//                 border: '1px solid #ddd',
//                 borderRadius: '5px',
//                 backgroundColor: '#f9f9f9'
//             }}>
//                 <h4 style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '13px' }}>Policy Deductions Breakdown:</h4>
//                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '11px' }}>
//                     <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
//                         <div style={{ fontWeight: '600', color: '#856404' }}>Late Entry</div>
//                         <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#856404' }}>
//                             ₹{salaryData.policyDetails.deductions.summary.lateEntryDeductions.toFixed(2)}
//                         </div>
//                         <div style={{ fontSize: '10px', color: '#856404' }}>{policyStats.lateEntries} violation(s)</div>
//                     </div>
//                     <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f8d7da', borderRadius: '4px' }}>
//                         <div style={{ fontWeight: '600', color: '#721c24' }}>Early Leave</div>
//                         <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#721c24' }}>
//                             ₹{salaryData.policyDetails.deductions.summary.earlyLeaveDeductions.toFixed(2)}
//                         </div>
//                         <div style={{ fontSize: '10px', color: '#721c24' }}>{policyStats.earlyLeaves} violation(s)</div>
//                     </div>
//                     <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#e2d9f3', borderRadius: '4px' }}>
//                         <div style={{ fontWeight: '600', color: '#4a3c6e' }}>Break Violation</div>
//                         <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a3c6e' }}>
//                             ₹{salaryData.policyDetails.deductions.summary.breakDeductions.toFixed(2)}
//                         </div>
//                         <div style={{ fontSize: '10px', color: '#4a3c6e' }}>{policyStats.breakViolations} violation(s)</div>
//                     </div>
//                 </div>
//             </div>
//
//             {/* Calculation Details */}
//             <div style={{
//                 marginBottom: '20px',
//                 padding: '12px',
//                 border: '1px solid #ddd',
//                 borderRadius: '5px',
//                 backgroundColor: '#f8f9fa',
//                 fontSize: '11px'
//             }}>
//                 <h4 style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '13px' }}>Calculation Details:</h4>
//                 <div style={{ marginBottom: '6px' }}>
//                     <strong>Per Day Rate Formula:</strong> {salaryData.calculation.perDayFormula}
//                 </div>
//                 <div style={{ marginBottom: '6px' }}>
//                     <strong>Working Days Formula:</strong> {salaryData.calculation.workingDaysFormula}
//                 </div>
//                 <div>
//                     <strong>Calculation Notes:</strong> {salaryData.calculationNotes}
//                 </div>
//             </div>
//
//             {/* Bank Details */}
//             {salaryData.bankDetails && (
//                 <div style={{
//                     marginBottom: '20px',
//                     padding: '12px',
//                     border: '1px solid #ddd',
//                     borderRadius: '5px',
//                     backgroundColor: '#f9f9f9'
//                 }}>
//                     <h4 style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '13px' }}>Bank Details:</h4>
//                     <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
//                         <div><strong>Account Holder:</strong> {salaryData.bankDetails.accountHolderName}</div>
//                         <div><strong>Account Number:</strong> {salaryData.bankDetails.accountNumber}</div>
//                         <div><strong>IFSC Code:</strong> {salaryData.bankDetails.ifsc}</div>
//                         <div><strong>Bank:</strong> {salaryData.bankDetails.bankName}</div>
//                     </div>
//                 </div>
//             )}
//
//             {/* Amount in words section */}
//             <div style={{
//                 textAlign: 'center',
//                 marginBottom: '20px',
//                 fontSize: '14px',
//                 fontWeight: 'bold'
//             }}>
//                 Net Pay: ₹{Math.round(salaryData.netSalary).toLocaleString('en-IN')}
//             </div>
//
//             <div style={{
//                 textAlign: 'center',
//                 marginBottom: '30px',
//                 fontSize: '11px'
//             }}>
//                 <strong style={{ fontSize: '12px' }}>
//                     In Words: {numberToWords(Math.round(salaryData.netSalary)).trim()} Rupees Only
//                 </strong>
//             </div>
//
//             {/* Signatures */}
//             <div style={{
//                 display: 'flex',
//                 justifyContent: 'space-between',
//                 marginTop: '40px',
//                 paddingTop: '15px'
//             }}>
//                 <div style={{ textAlign: 'center', width: '200px' }}>
//                     <div style={{
//                         borderTop: '1px solid #000',
//                         marginBottom: '8px',
//                         height: '50px'
//                     }}></div>
//                     <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Employee Signature</div>
//                 </div>
//                 <div style={{ textAlign: 'center', width: '200px' }}>
//                     <div style={{
//                         borderTop: '1px solid #000',
//                         marginBottom: '8px',
//                         height: '50px'
//                     }}></div>
//                     <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Employer Signature</div>
//                 </div>
//             </div>
//         </div>
//     );
// };
//
// const AdminSalarySlipManager = () => {
//     const dispatch = useDispatch<AppDispatch>();
//     const users = useSelector(selectUsers) as UserData[];
//     const usersLoading = useSelector(selectUsersLoading);
//
//     const salarySlipResponse = useSelector(selectSalarySlip) as SalarySlipResponseData | SalarySlipResponseData['data'] | null;
//     const loading = useSelector(selectSalarySlipLoading);
//     const error = useSelector(selectSalarySlipError);
//
//     const [selectedMonth, setSelectedMonth] = useState<string>('');
//     const [selectedYear, setSelectedYear] = useState<string>('');
//     const [searchTerm, setSearchTerm] = useState('');
//     const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
//     const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
//     const [isSalarySlipModalOpen, setIsSalarySlipModalOpen] = useState(false);
//     const [isDownloading, setIsDownloading] = useState(false);
//
//     const months = [
//         { value: "1", label: 'January' },
//         { value: "2", label: 'February' },
//         { value: "3", label: 'March' },
//         { value: "4", label: 'April' },
//         { value: "5", label: 'May' },
//         { value: "6", label: 'June' },
//         { value: "7", label: 'July' },
//         { value: "8", label: 'August' },
//         { value: "9", label: 'September' },
//         { value: "10", label: 'October' },
//         { value: "11", label: 'November' },
//         { value: "12", label: 'December' }
//     ];
//
//     const years = Array.from({ length: 5 }, (_, i) => {
//         const year = new Date().getFullYear() - i;
//         return { value: year.toString(), label: year.toString() };
//     });
//
//     useEffect(() => {
//         dispatch(fetchUsers());
//     }, [dispatch]);
//
//     const filteredUsers = users?.filter(user =>
//         user?.user_id?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         user?.user_id?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         user?.roleDefinitionId?.roleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         user?.departments?.some(dept =>
//             dept?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//             dept?.alias?.toLowerCase().includes(searchTerm.toLowerCase())
//         )
//     ) || [];
//
//     // Extract salary data from response
//     const salaryData: SalarySlipResponseData['data'] | null = React.useMemo(() => {
//         if (!salarySlipResponse) return null;
//
//         // Check if response has success property
//         if (typeof salarySlipResponse === 'object' && 'success' in salarySlipResponse) {
//             return salarySlipResponse.data;
//         }
//
//         // If response is already the data object
//         return salarySlipResponse as SalarySlipResponseData['data'];
//     }, [salarySlipResponse]);
//
//     const handleShowDetails = (user: UserData) => {
//         if (!selectedMonth || !selectedYear) {
//             alert('Please select month and year first');
//             return;
//         }
//
//         setSelectedUser(user);
//         dispatch(clearError());
//         dispatch(generateSalarySlipForUser({
//             userId: user.user_id._id,
//             month: parseInt(selectedMonth),
//             year: parseInt(selectedYear)
//         }));
//         setIsDetailsModalOpen(true);
//     };
//
//     const handleGenerateSalarySlip = () => {
//         if (!selectedUser) {
//             alert('Please select an employee first');
//             return;
//         }
//
//         if (!selectedMonth || !selectedYear) {
//             alert('Please select month and year first');
//             return;
//         }
//
//         dispatch(clearError());
//         dispatch(generateSalarySlipForUser({
//             userId: selectedUser.user_id._id,
//             month: parseInt(selectedMonth),
//             year: parseInt(selectedYear)
//         }));
//         setIsSalarySlipModalOpen(true);
//     };
//
//     // Enhanced PDF download function with iframe isolation
//     const downloadSalarySlip = async () => {
//         if (!salaryData || !selectedUser) return;
//
//         setIsDownloading(true);
//
//         try {
//             // Create a new iframe to completely isolate from main page CSS
//             const iframe = document.createElement('iframe');
//             iframe.style.position = 'absolute';
//             iframe.style.left = '-99999px';
//             iframe.style.top = '0';
//             iframe.style.width = '794px';
//             iframe.style.height = '1123px';
//             iframe.style.border = 'none';
//
//             document.body.appendChild(iframe);
//
//             // Wait for iframe to load
//             await new Promise((resolve) => {
//                 iframe.onload = resolve;
//                 iframe.src = 'about:blank';
//             });
//
//             const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
//             if (!iframeDoc) throw new Error('Cannot access iframe document');
//
//             // Write completely isolated HTML
//             iframeDoc.open();
//             iframeDoc.write(`
//         <!DOCTYPE html>
//         <html>
//         <head>
//           <style>
//             * {
//               margin: 0;
//               padding: 0;
//               box-sizing: border-box;
//             }
//             body {
//               font-family: Arial, sans-serif;
//               background-color: white;
//               color: black;
//               width: 794px;
//               padding: 15px;
//             }
//             table {
//               width: 100%;
//               border: 2px solid black;
//               border-collapse: collapse;
//               margin-bottom: 15px;
//             }
//             td {
//               padding: 10px;
//               border: 1px solid black;
//               vertical-align: top;
//             }
//             .header {
//               text-align: center;
//               background-color: #f0f0f0;
//               font-weight: bold;
//               font-size: 14px;
//             }
//             .company-info {
//               text-align: center;
//               padding: 15px;
//             }
//             .company-name {
//               font-weight: bold;
//               font-size: 18px;
//               margin-bottom: 6px;
//             }
//             .org-name {
//               font-size: 11px;
//               margin: 3px 0;
//               font-weight: 600;
//             }
//             .section-header {
//               padding: 10px;
//               font-weight: bold;
//               text-align: center;
//               background-color: #f0f0f0;
//             }
//             .amount-col {
//               width: 120px;
//             }
//             .text-right {
//               text-align: right;
//               font-weight: bold;
//             }
//             .attendance-summary {
//               margin-bottom: 20px;
//               padding: 12px;
//               border: 1px solid #ddd;
//               border-radius: 5px;
//               background-color: #f8f9fa;
//             }
//             .summary-title {
//               margin: 0 0 8px 0;
//               font-weight: bold;
//               font-size: 13px;
//             }
//             .policy-breakdown {
//               margin-bottom: 20px;
//               margin-top: 90px;
//               padding: 12px;
//               border: 1px solid #ddd;
//               border-radius: 5px;
//               background-color: #f9f9f9;
//             }
//             .calculation-details {
//               margin-bottom: 20px;
//               padding: 12px;
//               border: 1px solid #ddd;
//               border-radius: 5px;
//               background-color: #f8f9fa;
//               font-size: 11px;
//             }
//             .bank-details {
//               margin-bottom: 20px;
//               padding: 12px;
//               border: 1px solid #ddd;
//               border-radius: 5px;
//               background-color: #f9f9f9;
//             }
//             .net-pay-display {
//               text-align: center;
//               margin-bottom: 20px;
//               font-size: 14px;
//               font-weight: bold;
//             }
//             .amount-words {
//               text-align: center;
//               margin-bottom: 30px;
//               font-size: 11px;
//             }
//             .signatures {
//               display: flex;
//               justify-content: space-between;
//               margin-top: 40px;
//               padding-top: 15px;
//             }
//             .signature-box {
//               text-align: center;
//               width: 200px;
//             }
//             .signature-line {
//               border-top: 1px solid black;
//               margin-bottom: 8px;
//               height: 50px;
//             }
//             .signature-label {
//               font-size: 11px;
//               font-weight: bold;
//             }
//             .policy-grid {
//               display: grid;
//               grid-template-columns: 1fr 1fr 1fr;
//               gap: 10px;
//               font-size: 11px;
//             }
//             .attendance-grid {
//               display: grid;
//               gridTemplateColumns: 1fr 1fr 1fr 1fr;
//               gap: 8px;
//               font-size: 11px;
//             }
//           </style>
//         </head>
//         <body>
//           <table>
//             <tbody>
//               <tr>
//                 <td colspan="2" class="header">Payslip - ${salaryData.salaryPeriod.month} ${salaryData.salaryPeriod.year}</td>
//               </tr>
//               <tr>
//                 <td colspan="2" class="company-info">
//                   <div class="company-name">PulseSeal</div>
//                   <div class="org-name">Salary Period: ${new Date(salaryData.salaryPeriod.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} to ${new Date(salaryData.salaryPeriod.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
//                   <div style="font-size: 10px; margin: 3px 0; color: #666;">Generated: ${new Date(salaryData.generatedAt).toLocaleString('en-IN')}</div>
//                 </td>
//               </tr>
//               <tr>
//                 <td style="width: 50%;">
//                   <div style="margin-bottom: 10px;"><span style="font-weight: bold; font-size: 13px;">Employee Name:</span><br/><span style="font-size: 13px;">${salaryData.employeeDetails.name}</span></div>
//                   <div style="margin-bottom: 10px;"><span style="font-weight: bold; font-size: 13px;">Employee Code:</span><br/><span style="font-size: 13px;">${salaryData.employeeDetails.employeeCode}</span></div>
//                   <div style="margin-bottom: 10px;"><span style="font-weight: bold; font-size: 13px;">Employee ID:</span><br/><span style="font-size: 11px; font-family: monospace;">${salaryData.employeeDetails.employeeId}</span></div>
//                   <div><span style="font-weight: bold; font-size: 13px;">Work Type:</span><br/><span style="font-size: 13px;">${salaryData.employeeDetails.workType}</span></div>
//                 </td>
//                 <td style="width: 50%;">
//                   <div style="margin-bottom: 10px;"><span style="font-weight: bold; font-size: 13px;">Join Date:</span><br/><span style="font-size: 13px;">${new Date(salaryData.employeeDetails.joinDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
//                   <div style="margin-bottom: 10px;"><span style="font-weight: bold; font-size: 13px;">Designation:</span><br/><span style="font-size: 13px;">${selectedUser.roleDefinitionId.roleName}</span></div>
//                   <div><span style="font-weight: bold; font-size: 13px;">Per Day Rate:</span><br/><span style="font-size: 13px;">₹${salaryData.calculation.perDayRate.toFixed(2)}</span></div>
//                 </td>
//               </tr>
//               <tr>
//                 <td colspan="2" style="padding: 10px; border: 1px solid #000; background-color: #f8f9fa;">
//                   <div style="font-weight: bold; margin-bottom: 6px; font-size: 13px;">Attendance Summary</div>
//                   <div class="attendance-grid">
//                     <div>
//                       <div style="font-weight: 600;">Total Working Days</div>
//                       <div>${salaryData.attendanceSummary.totalWorkingDays}</div>
//                     </div>
//                     <div>
//                       <div style="font-weight: 600;">Present Days</div>
//                       <div>${salaryData.attendanceSummary.presentDays}</div>
//                     </div>
//                     <div>
//                       <div style="font-weight: 600;">Paid Leaves</div>
//                       <div>${salaryData.attendanceSummary.paidLeaves}</div>
//                     </div>
//                     <div>
//                       <div style="font-weight: 600;">Unpaid Leaves</div>
//                       <div>${salaryData.attendanceSummary.unpaidLeaves}</div>
//                     </div>
//                   </div>
//                 </td>
//               </tr>
//               <tr>
//                 <td class="section-header">Earnings</td>
//                 <td class="section-header amount-col">Amount</td>
//               </tr>
//               <tr>
//                 <td>
//                   <div style="font-weight: 500; font-size: 13px;">Basic Salary</div>
//                   <div style="font-size: 10px; color: #666; margin-top: 2px;">Base salary component</div>
//                 </td>
//                 <td class="text-right">₹${salaryData.earnings.basic.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//               </tr>
//               <tr>
//                 <td>
//                   <div style="font-weight: 500; font-size: 13px;">HRA (House Rent Allowance)</div>
//                   <div style="font-size: 10px; color: #666; margin-top: 2px;">Housing allowance</div>
//                 </td>
//                 <td class="text-right">₹${salaryData.earnings.hra.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//               </tr>
//               <tr>
//                 <td>
//                   <div style="font-weight: 500; font-size: 13px;">Other Allowances</div>
//                   <div style="font-size: 10px; color: #666; margin-top: 2px;">Additional allowances</div>
//                 </td>
//                 <td class="text-right">₹${salaryData.earnings.allowances.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//               </tr>
//               <tr>
//                 <td>
//                   <div style="font-weight: 500; font-size: 13px;">Overtime Pay</div>
//                   <div style="font-size: 10px; color: #666; margin-top: 2px;">Extra hours worked</div>
//                 </td>
//                 <td class="text-right">₹${salaryData.earnings.overtimePay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//               </tr>
//               <tr>
//                 <td class="text-right section-header">Total Earnings</td>
//                 <td class="text-right section-header">₹${salaryData.earnings.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//               </tr>
//               <tr>
//                 <td class="section-header">Deductions</td>
//                 <td class="section-header">Amount</td>
//               </tr>
//               <tr>
//                 <td>
//                   <div style="font-weight: 500; font-size: 13px;">Salary Deduction (Unpaid Leaves)</div>
//                   <div style="font-size: 10px; color: #666; margin-top: 2px;">${salaryData.attendanceSummary.unpaidLeaves} unpaid leave(s)</div>
//                 </td>
//                 <td class="text-right">₹${salaryData.deductions.salaryDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//               </tr>
//               <tr>
//                 <td>
//                   <div style="font-weight: 500; font-size: 13px;">Policy Deductions</div>
//                   <div style="font-size: 10px; color: #666; margin-top: 2px;">Policy violations & penalties</div>
//                 </td>
//                 <td class="text-right">₹${salaryData.deductions.policyDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//               </tr>
//               <tr>
//                 <td>
//                   <div style="font-weight: 500; font-size: 13px;">Other Deductions</div>
//                   <div style="font-size: 10px; color: #666; margin-top: 2px;">Miscellaneous deductions</div>
//                 </td>
//                 <td class="text-right">₹${salaryData.deductions.otherDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//               </tr>
//               <tr>
//                 <td class="text-right section-header">Total Deductions</td>
//                 <td class="text-right section-header">₹${salaryData.deductions.totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//               </tr>
//               <tr>
//                 <td class="text-right section-header">Net Pay</td>
//                 <td class="text-right section-header">₹${salaryData.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//               </tr>
//             </tbody>
//           </table>
//
//           <div class="policy-breakdown">
//             <h4 class="summary-title">Policy Deductions Breakdown:</h4>
//             <div class="policy-grid">
//               <div style="text-align: center; padding: 8px; background-color: #fff3cd; border-radius: 4px;">
//                 <div style="font-weight: 600; color: #856404;">Late Entry</div>
//                 <div style="font-size: 12px; font-weight: bold; color: #856404;">₹${salaryData.policyDetails.deductions.summary.lateEntryDeductions.toFixed(2)}</div>
//                 <div style="font-size: 10px; color: #856404;">${salaryData.policyDetails.deductions.dailyDetails.filter(day => day.lateEntry.deduction > 0).length} violation(s)</div>
//               </div>
//               <div style="text-align: center; padding: 8px; background-color: #f8d7da; border-radius: 4px;">
//                 <div style="font-weight: 600; color: #721c24;">Early Leave</div>
//                 <div style="font-size: 12px; font-weight: bold; color: #721c24;">₹${salaryData.policyDetails.deductions.summary.earlyLeaveDeductions.toFixed(2)}</div>
//                 <div style="font-size: 10px; color: #721c24;">${salaryData.policyDetails.deductions.dailyDetails.filter(day => day.earlyLeave.deduction > 0).length} violation(s)</div>
//               </div>
//               <div style="text-align: center; padding: 8px; background-color: #e2d9f3; border-radius: 4px;">
//                 <div style="font-weight: 600; color: #4a3c6e;">Break Violation</div>
//                 <div style="font-size: 12px; font-weight: bold; color: #4a3c6e;">₹${salaryData.policyDetails.deductions.summary.breakDeductions.toFixed(2)}</div>
//                 <div style="font-size: 10px; color: #4a3c6e;">${salaryData.policyDetails.deductions.dailyDetails.filter(day => day.breaks.deduction > 0).length} violation(s)</div>
//               </div>
//             </div>
//           </div>
//
//           <div class="calculation-details">
//             <h4 class="summary-title">Calculation Details:</h4>
//             <div style="margin-bottom: 6px;"><strong>Per Day Rate Formula:</strong> ${salaryData.calculation.perDayFormula}</div>
//             <div style="margin-bottom: 6px;"><strong>Working Days Formula:</strong> ${salaryData.calculation.workingDaysFormula}</div>
//             <div><strong>Calculation Notes:</strong> ${salaryData.calculationNotes}</div>
//           </div>
//
//           ${salaryData.bankDetails ? `
//             <div class="bank-details">
//               <h4 class="summary-title">Bank Details:</h4>
//               <div style="font-size: 11px; line-height: 1.5;">
//                 <div><strong>Account Holder:</strong> ${salaryData.bankDetails.accountHolderName}</div>
//                 <div><strong>Account Number:</strong> ${salaryData.bankDetails.accountNumber}</div>
//                 <div><strong>IFSC Code:</strong> ${salaryData.bankDetails.ifsc}</div>
//                 <div><strong>Bank:</strong> ${salaryData.bankDetails.bankName}</div>
//               </div>
//             </div>
//           ` : ''}
//
//           <div class="net-pay-display">
//             Net Pay: ₹${Math.round(salaryData.netSalary).toLocaleString('en-IN')}
//           </div>
//
//           <div class="signatures">
//             <div class="signature-box">
//               <div class="signature-line"></div>
//               <div class="signature-label">Employee Signature</div>
//             </div>
//             <div class="signature-box">
//               <div class="signature-line"></div>
//               <div class="signature-label">Employer Signature</div>
//             </div>
//           </div>
//         </body>
//         </html>
//       `);
//             iframeDoc.close();
//
//             // Wait for content to render
//             await new Promise(resolve => setTimeout(resolve, 1000));
//
//             // Generate canvas from iframe body
//             const canvas = await html2canvas(iframeDoc.body, {
//                 scale: 1.5,
//                 useCORS: true,
//                 allowTaint: false,
//                 backgroundColor: '#ffffff',
//                 logging: false,
//                 width: 794,
//                 height: iframeDoc.body.scrollHeight,
//             });
//
//             // Generate PDF
//             const pdf = new jsPDF('p', 'mm', 'a4');
//             const imgData = canvas.toDataURL('image/png', 0.95);
//
//             const imgWidth = 210;
//             const pageHeight = 295;
//             const imgHeight = (canvas.height * imgWidth) / canvas.width;
//             let heightLeft = imgHeight;
//             let position = 0;
//
//             pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
//             heightLeft -= pageHeight;
//
//             while (heightLeft >= 0) {
//                 position = heightLeft - imgHeight;
//                 pdf.addPage();
//                 pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
//                 heightLeft -= pageHeight;
//             }
//
//             // Download
//             const fileName = `payslip-${salaryData.employeeDetails.name.replace(/\s+/g, '-').toLowerCase()}-${salaryData.salaryPeriod.month}-${salaryData.salaryPeriod.year}.pdf`;
//             pdf.save(fileName);
//
//             // Clean up
//             document.body.removeChild(iframe);
//
//         } catch (error) {
//             console.error('Error generating PDF:', error);
//             alert('Error generating PDF. Please try again.');
//         } finally {
//             setIsDownloading(false);
//         }
//     };
//
//     const handleDetailsModalClose = () => {
//         setIsDetailsModalOpen(false);
//         setSelectedUser(null);
//         dispatch(clearSalarySlip());
//     };
//
//     const handleSalarySlipModalClose = () => {
//         setIsSalarySlipModalOpen(false);
//         dispatch(clearSalarySlip());
//         setSelectedUser(null);
//     };
//
//     return (
//         <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-3 sm:p-4 md:p-6">
//             <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
//                 {/* Header */}
//                 <div className="mb-4 sm:mb-6">
//                     <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
//                         <FileText className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-blue-600" />
//                         Salary Slip Manager
//                     </h1>
//                     <p className="text-sm sm:text-base text-muted-foreground">
//                         Generate and manage salary slips for all employees - {filteredUsers.length} employees found
//                     </p>
//                 </div>
//
//                 {/* Controls */}
//                 <Card className="shadow-lg border-2 border-blue-100">
//                     <CardHeader className="pb-3 sm:pb-4">
//                         <CardTitle className="text-lg sm:text-xl md:text-2xl">Filters & Controls</CardTitle>
//                         <CardDescription className="text-xs sm:text-sm">
//                             Select month and year, then search and select an employee to view details or generate salary slip
//                         </CardDescription>
//                     </CardHeader>
//                     <CardContent className="space-y-3 sm:space-y-4">
//                         <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
//                             <div className="space-y-1 sm:space-y-2 w-full sm:w-40 md:w-48">
//                                 <Label htmlFor="filter-month" className="text-xs sm:text-sm">Month</Label>
//                                 <Select value={selectedMonth} onValueChange={setSelectedMonth}>
//                                     <SelectTrigger id="filter-month" className="h-9 sm:h-10">
//                                         <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
//                                         <SelectValue placeholder="Select Month" />
//                                     </SelectTrigger>
//                                     <SelectContent>
//                                         {months.map((month) => (
//                                             <SelectItem key={month.value} value={month.value}>
//                                                 {month.label}
//                                             </SelectItem>
//                                         ))}
//                                     </SelectContent>
//                                 </Select>
//                             </div>
//
//                             <div className="space-y-1 sm:space-y-2 w-full sm:w-28 md:w-32">
//                                 <Label htmlFor="filter-year" className="text-xs sm:text-sm">Year</Label>
//                                 <Select value={selectedYear} onValueChange={setSelectedYear}>
//                                     <SelectTrigger id="filter-year" className="h-9 sm:h-10">
//                                         <SelectValue placeholder="Year" />
//                                     </SelectTrigger>
//                                     <SelectContent>
//                                         {years.map((year) => (
//                                             <SelectItem key={year.value} value={year.value}>
//                                                 {year.label}
//                                             </SelectItem>
//                                         ))}
//                                     </SelectContent>
//                                 </Select>
//                             </div>
//
//                             <div className="space-y-1 sm:space-y-2 flex-1">
//                                 <Label htmlFor="search-users" className="text-xs sm:text-sm">Search Employees</Label>
//                                 <div className="relative">
//                                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 sm:h-4 sm:w-4" />
//                                     <Input
//                                         id="search-users"
//                                         placeholder="Search by name, email, role, or department..."
//                                         value={searchTerm}
//                                         onChange={(e) => setSearchTerm(e.target.value)}
//                                         className="pl-8 sm:pl-10 h-9 sm:h-10 text-xs sm:text-sm"
//                                     />
//                                 </div>
//                             </div>
//
//                             <div className="flex items-end">
//                                 <Button
//                                     variant="outline"
//                                     onClick={() => dispatch(fetchUsers())}
//                                     disabled={usersLoading}
//                                     className="h-9 sm:h-10 w-full sm:w-auto text-xs sm:text-sm"
//                                 >
//                                     {usersLoading ? (
//                                         <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
//                                     ) : (
//                                         <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
//                                     )}
//                                     Refresh
//                                 </Button>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>
//
//                 {/* Error Display */}
//                 {error && (
//                     <Alert variant="destructive">
//                         <AlertCircle className="h-4 w-4" />
//                         <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
//                     </Alert>
//                 )}
//
//                 {/* Users Table */}
//                 <Card className="shadow-lg border-2 border-blue-100">
//                     <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b dark:from-blue-950/20 dark:to-indigo-950/20 py-3 sm:py-4">
//                         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
//                             <div className="flex items-center gap-2 sm:gap-3">
//                                 <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
//                                 <div>
//                                     <CardTitle className="text-lg sm:text-xl md:text-2xl">Employee Directory</CardTitle>
//                                     <CardDescription className="text-xs sm:text-sm">Select an employee to view details or generate salary slip</CardDescription>
//                                 </div>
//                             </div>
//
//                             <Badge variant="secondary" className="w-fit text-xs sm:text-sm">
//                                 {filteredUsers.length} employees
//                             </Badge>
//                         </div>
//                     </CardHeader>
//
//                     <CardContent className="p-0">
//                         {usersLoading ? (
//                             <div className="flex flex-col justify-center items-center py-8 sm:py-12">
//                                 <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
//                                 <p className="mt-2 sm:mt-4 text-muted-foreground text-xs sm:text-sm">Loading employees...</p>
//                             </div>
//                         ) : filteredUsers.length === 0 ? (
//                             <div className="text-center py-8 sm:py-12">
//                                 <Users className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
//                                 <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No employees found</h3>
//                                 <p className="text-muted-foreground text-xs sm:text-sm">
//                                     {searchTerm ? 'Try adjusting your search criteria' : 'No employees available'}
//                                 </p>
//                             </div>
//                         ) : (
//                             <ScrollArea className="h-[500px] sm:h-[600px]">
//                                 <Table>
//                                     <TableHeader className="sticky top-0 bg-background">
//                                         <TableRow>
//                                             <TableHead className="text-xs sm:text-sm">Employee</TableHead>
//                                             <TableHead className="text-xs sm:text-sm">Role</TableHead>
//                                             <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Department</TableHead>
//                                             <TableHead className="text-xs sm:text-sm hidden md:table-cell">Manager</TableHead>
//                                             <TableHead className="text-xs sm:text-sm">Status</TableHead>
//                                             <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
//                                         </TableRow>
//                                     </TableHeader>
//                                     <TableBody>
//                                         {filteredUsers.map((user) => (
//                                             <TableRow key={user._id} className="hover:bg-muted/50">
//                                                 <TableCell>
//                                                     <div className="flex items-center gap-2 sm:gap-3">
//                                                         <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
//                                                             <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs sm:text-sm">
//                                                                 {user?.user_id?.name?.charAt(0) || 'U'}
//                                                             </AvatarFallback>
//                                                         </Avatar>
//                                                         <div className="min-w-0">
//                                                             <p className="font-medium text-xs sm:text-sm truncate">
//                                                                 {user?.user_id?.name || 'Unknown'}
//                                                             </p>
//                                                             <p className="text-xs text-muted-foreground truncate">{user?.user_id?.email || 'No email'}</p>
//                                                         </div>
//                                                     </div>
//                                                 </TableCell>
//
//                                                 <TableCell>
//                                                     <Badge variant="outline" className="text-xs">
//                                                         {user?.roleDefinitionId?.roleName || 'Unknown'}
//                                                     </Badge>
//                                                 </TableCell>
//
//                                                 <TableCell className="hidden sm:table-cell">
//                                                     <div className="flex flex-col gap-1">
//                                                         {user?.departments?.slice(0, 2).map((dept) => (
//                                                             <Badge key={dept._id} variant="secondary" className="text-xs">
//                                                                 {dept.name}
//                                                             </Badge>
//                                                         ))}
//                                                         {user?.departments?.length > 2 && (
//                                                             <Badge variant="outline" className="text-xs">
//                                                                 +{user.departments.length - 2} more
//                                                             </Badge>
//                                                         )}
//                                                     </div>
//                                                 </TableCell>
//
//                                                 <TableCell className="hidden md:table-cell">
//                           <span className="text-muted-foreground text-xs sm:text-sm truncate">
//                             {user?.parentRoleId?.user_id?.name || 'CEO'}
//                           </span>
//                                                 </TableCell>
//
//                                                 <TableCell>
//                                                     <Badge
//                                                         variant={user?.status === 'active' ? 'default' : 'secondary'}
//                                                         className="capitalize text-xs"
//                                                     >
//                                                         {user?.status || 'unknown'}
//                                                     </Badge>
//                                                 </TableCell>
//
//                                                 <TableCell className="text-right">
//                                                     <div className="flex flex-col sm:flex-row justify-end gap-1 sm:gap-2">
//                                                         {/* Show Details Button */}
//                                                         <Button
//                                                             size="sm"
//                                                             variant="outline"
//                                                             onClick={() => handleShowDetails(user)}
//                                                             className="flex items-center gap-1 h-7 sm:h-8 text-xs"
//                                                             disabled={!selectedMonth || !selectedYear}
//                                                         >
//                                                             <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
//                                                             <span className="hidden xs:inline">Details</span>
//                                                         </Button>
//
//                                                         {/* Generate Salary Slip Button */}
//                                                         <Button
//                                                             size="sm"
//                                                             onClick={() => {
//                                                                 setSelectedUser(user);
//                                                                 handleGenerateSalarySlip();
//                                                             }}
//                                                             disabled={!selectedMonth || !selectedYear}
//                                                             className="flex items-center gap-1 h-7 sm:h-8 text-xs"
//                                                         >
//                                                             <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
//                                                             <span className="hidden xs:inline">Generate Slip</span>
//                                                         </Button>
//                                                     </div>
//                                                 </TableCell>
//                                             </TableRow>
//                                         ))}
//                                     </TableBody>
//                                 </Table>
//                             </ScrollArea>
//                         )}
//                     </CardContent>
//                 </Card>
//
//                 {/* Salary Slip Details Modal */}
//                 <Dialog open={isDetailsModalOpen} onOpenChange={handleDetailsModalClose}>
//                     <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] overflow-hidden sm:max-w-[90vw] sm:w-[90vw] lg:max-w-[85vw] lg:w-[85vw] p-3 sm:p-4 md:p-6">
//                         <DialogHeader className="pb-3 sm:pb-4">
//                             <div className="flex justify-between items-center">
//                                 <DialogTitle className="text-lg sm:text-xl md:text-2xl flex items-center gap-2">
//                                     <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
//                                     Salary Slip Details - {selectedUser?.user_id?.name}
//                                 </DialogTitle>
//                                 <Button
//                                     variant="ghost"
//                                     size="sm"
//                                     onClick={handleDetailsModalClose}
//                                     className="h-8 w-8 p-0"
//                                 >
//                                     <X className="h-4 w-4" />
//                                 </Button>
//                             </div>
//                         </DialogHeader>
//                         <ScrollArea className="max-h-[70vh] pr-3 sm:pr-4">
//                             {loading ? (
//                                 <div className="flex flex-col justify-center items-center py-12 sm:py-16">
//                                     <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
//                                     <p className="mt-2 sm:mt-4 text-muted-foreground text-xs sm:text-sm">Loading salary slip details...</p>
//                                 </div>
//                             ) : salaryData && selectedUser ? (
//                                 <SalarySlipDetails
//                                     salaryData={salaryData}
//                                     selectedUser={selectedUser}
//                                 />
//                             ) : (
//                                 <div className="text-center py-12 sm:py-16">
//                                     <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
//                                     <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No salary slip details available</h3>
//                                     <p className="text-muted-foreground text-xs sm:text-sm">Unable to load salary slip details</p>
//                                 </div>
//                             )}
//                         </ScrollArea>
//                     </DialogContent>
//                 </Dialog>
//
//                 {/* Salary Slip PDF Modal */}
//                 <Dialog open={isSalarySlipModalOpen} onOpenChange={handleSalarySlipModalClose}>
//                     <DialogContent
//                         className="max-w-[95vw] w-[95vw] max-h-[90vh] overflow-hidden sm:max-w-[90vw] sm:w-[90vw] lg:max-w-[85vw] lg:w-[85vw] p-3 sm:p-4 md:p-6"
//                     >
//                         <DialogHeader className="border-b pb-3 sm:pb-4">
//                             <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
//                                 <div className="min-w-0">
//                                     <div className="flex justify-between items-center mb-1 sm:mb-2">
//                                         <DialogTitle className="text-lg sm:text-xl md:text-2xl flex items-center gap-2 truncate">
//                                             <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
//                                             <span className="truncate">Salary Slip - {salaryData?.salaryPeriod.month} {salaryData?.salaryPeriod.year}</span>
//                                         </DialogTitle>
//                                         <Button
//                                             variant="ghost"
//                                             size="sm"
//                                             onClick={handleSalarySlipModalClose}
//                                             className="h-8 w-8 p-0 flex-shrink-0 ml-2"
//                                         >
//                                             <X className="h-4 w-4" />
//                                         </Button>
//                                     </div>
//                                     {selectedUser && salaryData && (
//                                         <p className="text-xs sm:text-sm text-muted-foreground truncate">
//                                             {salaryData.employeeDetails.name} - Employee Code: {salaryData.employeeDetails.employeeCode}
//                                         </p>
//                                     )}
//                                 </div>
//
//                                 <Button
//                                     variant="default"
//                                     onClick={downloadSalarySlip}
//                                     disabled={!salaryData || isDownloading}
//                                     className="shrink-0 w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
//                                     size="sm"
//                                 >
//                                     {isDownloading ? (
//                                         <>
//                                             <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
//                                             Generating...
//                                         </>
//                                     ) : (
//                                         <>
//                                             <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
//                                             Download PDF
//                                         </>
//                                     )}
//                                 </Button>
//                             </div>
//                         </DialogHeader>
//
//                         <ScrollArea className="max-h-[75vh] w-full">
//                             {loading ? (
//                                 <div className="flex flex-col justify-center items-center py-12 sm:py-16">
//                                     <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
//                                     <p className="mt-2 sm:mt-4 text-muted-foreground text-xs sm:text-sm">Generating salary slip...</p>
//                                 </div>
//                             ) : salaryData && selectedUser ? (
//                                 <div className="p-3 sm:p-4 md:p-6">
//                                     <div className="w-full bg-white border rounded-lg shadow-sm overflow-auto">
//                                         <PdfSalarySlip
//                                             salaryData={salaryData}
//                                             selectedUser={selectedUser}
//                                         />
//                                     </div>
//                                 </div>
//                             ) : (
//                                 <div className="text-center py-12 sm:py-16 px-4">
//                                     <FileText className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
//                                     <h3 className="text-sm sm:text-base md:text-lg font-medium mb-1 sm:mb-2">No salary slip generated</h3>
//                                     <p className="text-muted-foreground text-xs sm:text-sm">Select a month and year, then click on an employee to generate their salary slip</p>
//                                 </div>
//                             )}
//                         </ScrollArea>
//                     </DialogContent>
//                 </Dialog>
//             </div>
//         </div>
//     );
// };
//
// export default AdminSalarySlipManager;




//
//
//
// "use client";
// import React, { useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { AppDispatch, RootState } from '@/store';
// import {
//     generateSalarySlipForUser,
//     selectSalarySlip,
//     selectSalarySlipLoading,
//     selectSalarySlipError,
//     clearSalarySlip,
//     clearError
// } from '@/features/salarySlip/salarySlip';
// import { selectUsers, fetchUsers, selectUsersLoading } from '@/features/user/userSlice';
// import {
//     Card,
//     CardContent,
//     CardDescription,
//     CardHeader,
//     CardTitle,
// } from "@/components/ui/card";
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow,
// } from "@/components/ui/table";
// import { Button } from "@/components/ui/button";
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Separator } from "@/components/ui/separator";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import {
//     Dialog,
//     DialogContent,
//     DialogHeader,
//     DialogTitle,
// } from "@/components/ui/dialog";
// import {
//     Search,
//     Calendar,
//     DollarSign,
//     Download,
//     Eye,
//     Users,
//     TrendingUp,
//     FileText,
//     RefreshCw,
//     Loader2,
//     AlertCircle,
//     User,
//     Banknote,
//     Calculator,
//     AlertTriangle,
//     Info,
//     Clock8,
//     LogOut,
//     Coffee,
//     X,
//     Moon,
//     Sun
// } from "lucide-react";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { useTheme } from "next-themes";
// import html2canvas from 'html2canvas';
// import { jsPDF } from 'jspdf';
//
// // Updated interfaces to match the new API response structure
// interface SalarySlipResponseData {
//     success: boolean;
//     message: string;
//     data: {
//         employeeDetails: {
//             employeeId: string;
//             employeeCode: string;
//             name: string;
//             joinDate: string;
//             workType: string;
//         };
//         salaryPeriod: {
//             month: string;
//             monthNumber: number;
//             year: number;
//             fromDate: string;
//             toDate: string;
//         };
//         attendanceSummary: {
//             totalWorkingDays: number;
//             presentDays: number;
//             paidLeaves: number;
//             unpaidLeaves: number;
//         };
//         earnings: {
//             basic: number;
//             hra: number;
//             allowances: number;
//             overtimePay: number;
//             totalEarnings: number;
//         };
//         deductions: {
//             salaryDeduction: number;
//             policyDeductions: number;
//             otherDeductions: number;
//             totalDeductions: number;
//         };
//         policyDetails: {
//             deductions: {
//                 summary: {
//                     lateEntryDeductions: number;
//                     earlyLeaveDeductions: number;
//                     breakDeductions: number;
//                     total: number;
//                 };
//                 dailyDetails: Array<{
//                     date: string;
//                     lateEntry: {
//                         deduction: number;
//                         ruleApplied: string | null;
//                         violationMinutes: number;
//                         occurrenceCount: number;
//                         totalMinutes: number;
//                         isOccurrenceRule: boolean;
//                         occurrenceType: string;
//                         occurrenceValue: number;
//                     };
//                     earlyLeave: {
//                         deduction: number;
//                         ruleApplied: string | null;
//                         violationMinutes: number;
//                         occurrenceCount: number;
//                         totalMinutes: number;
//                         isOccurrenceRule: boolean;
//                         occurrenceType: string;
//                         occurrenceValue: number;
//                     };
//                     breaks: {
//                         deduction: number;
//                         ruleApplied: string | null;
//                         violationMinutes: number;
//                         occurrenceCount: number;
//                         totalMinutes: number;
//                         isOccurrenceRule: boolean;
//                         occurrenceType: string;
//                         occurrenceValue: number;
//                     };
//                 }>;
//                 occurrenceCounters: {
//                     late_entry: Record<string, any>;
//                     early_leave: Record<string, any>;
//                     breaks: Record<string, any>;
//                 };
//             };
//             overtime: {
//                 summary: {
//                     regularOvertimePay: number;
//                     earlyOvertimePay: number;
//                     total: number;
//                 };
//                 dailyDetails: any[];
//                 occurrenceCounters: {
//                     overtime: Record<string, any>;
//                     early_overtime: Record<string, any>;
//                 };
//             };
//         };
//         calculation: {
//             perDayRate: number;
//             perDayFormula: string;
//             workingDaysFormula: string;
//         };
//         netSalary: number;
//         bankDetails: {
//             accountHolderName: string;
//             accountNumber: string;
//             bankName: string;
//             ifsc: string;
//         };
//         generatedAt: string;
//         calculationNotes: string;
//     };
// }
//
// interface UserData {
//     _id: string;
//     user_id: {
//         _id: string;
//         name: string;
//         email: string;
//         phoneNumber?: number;
//         isActive: boolean;
//         isFreezed: boolean;
//         is_organizer: boolean;
//         is_superuser: boolean;
//     };
//     roleDefinitionId: {
//         _id: string;
//         roleName: string;
//         hierarchyLevel?: number;
//         permissions?: string[];
//     };
//     departments: Array<{
//         _id: string;
//         name: string;
//         alias: string;
//     }>;
//     parentRoleId?: {
//         _id: string;
//         user_id: {
//             _id: string;
//             name: string;
//             email: string;
//         };
//         roleDefinitionId: {
//             _id: string;
//             roleName: string;
//         };
//     };
//     status: string;
//     history: any[];
// }
//
// // Salary Slip Details Component for Show Details Modal
// const SalarySlipDetails = ({
//                                salaryData,
//                                selectedUser
//                            }: {
//     salaryData: SalarySlipResponseData['data'];
//     selectedUser: UserData;
// }) => {
//     const formatCurrency = (amount: number) => {
//         return new Intl.NumberFormat('en-IN', {
//             style: 'currency',
//             currency: 'INR',
//             minimumFractionDigits: 2
//         }).format(amount);
//     };
//
//     const formatDate = (dateString: string) => {
//         return new Date(dateString).toLocaleDateString('en-IN', {
//             day: '2-digit',
//             month: 'short',
//             year: 'numeric'
//         });
//     };
//
//     const formatDateTime = (dateString: string) => {
//         return new Date(dateString).toLocaleString('en-IN', {
//             day: '2-digit',
//             month: 'short',
//             year: 'numeric',
//             hour: '2-digit',
//             minute: '2-digit',
//             second: '2-digit',
//             hour12: true
//         });
//     };
//
//     const getPolicyViolationStats = () => {
//         const stats = {
//             lateEntries: 0,
//             earlyLeaves: 0,
//             breakViolations: 0,
//             totalPolicyViolations: 0
//         };
//
//         salaryData.policyDetails.deductions.dailyDetails.forEach(day => {
//             if (day.lateEntry.deduction > 0) stats.lateEntries++;
//             if (day.earlyLeave.deduction > 0) stats.earlyLeaves++;
//             if (day.breaks.deduction > 0) stats.breakViolations++;
//             if (day.lateEntry.deduction > 0 || day.earlyLeave.deduction > 0 || day.breaks.deduction > 0) {
//                 stats.totalPolicyViolations++;
//             }
//         });
//
//         return stats;
//     };
//
//     const policyStats = getPolicyViolationStats();
//
//     return (
//         <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 space-y-6 md:space-y-8 lg:space-y-10">
//             {/* Header */}
//             <header className="flex flex-col md:flex-row justify-between items-start gap-6">
//                 <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
//                     <Avatar className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 border-4 border-white dark:border-gray-800 shadow-lg">
//                         <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl sm:text-2xl md:text-2xl font-extrabold select-none">
//                             {selectedUser.user_id.name?.charAt(0) || 'U'}
//                         </AvatarFallback>
//                     </Avatar>
//                     <div>
//                         <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">{salaryData.employeeDetails.name}</h1>
//                         <p className="text-sm md:text-lg text-gray-600 dark:text-gray-300 mt-1 break-words">{selectedUser.user_id.email}</p>
//                         <div className="flex flex-wrap gap-2 md:gap-3 mt-2 md:mt-3">
//                             <Badge variant="outline" className="text-xs md:text-sm px-3 md:px-4 py-1 uppercase tracking-wide font-semibold dark:bg-gray-800 dark:text-gray-200">
//                                 {selectedUser.roleDefinitionId.roleName}
//                             </Badge>
//                             <Badge variant="secondary" className="text-xs md:text-sm px-3 md:px-4 py-1 font-semibold">
//                                 {salaryData.employeeDetails.workType}
//                             </Badge>
//                             <Badge variant="default" className="text-xs md:text-sm px-3 md:px-4 py-1 bg-green-600 text-white font-semibold">
//                                 {salaryData.employeeDetails.employeeCode}
//                             </Badge>
//                         </div>
//                     </div>
//                 </div>
//
//                 <div className="text-right bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-300 dark:border-gray-600 px-4 md:px-6 py-4 md:py-5 w-full md:w-auto">
//                     <p className="text-xl md:text-2xl lg:text-3xl font-bold text-blue-700 dark:text-blue-400">
//                         {salaryData.salaryPeriod.month} {salaryData.salaryPeriod.year}
//                     </p>
//                     <p className="text-xs md:text-sm font-semibold text-gray-500 dark:text-gray-400">Pay Period</p>
//                     <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
//                         {formatDate(salaryData.salaryPeriod.fromDate)} - {formatDate(salaryData.salaryPeriod.toDate)}
//                     </p>
//                     <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
//                         Generated: {formatDateTime(salaryData.generatedAt)}
//                     </p>
//                 </div>
//             </header>
//
//             <Separator className="my-6 md:my-8 dark:bg-gray-700" />
//
//             {/* Employee & Period Info */}
//             <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
//                 {/* Employee Info Card */}
//                 <Card className="shadow-lg border border-blue-200 dark:border-blue-800 rounded-lg">
//                     <CardHeader className="pb-4 md:pb-5 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-t-lg">
//                         <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center gap-2 md:gap-3 text-blue-800 dark:text-blue-300 font-semibold">
//                             <div className="p-1 md:p-2 bg-blue-600 rounded-lg">
//                                 <User className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
//                             </div>
//                             Employee Information
//                         </CardTitle>
//                         <p className="text-xs md:text-sm text-blue-700 dark:text-blue-400 mt-1 font-medium">Personal & Work Details</p>
//                     </CardHeader>
//                     <CardContent className="pt-4 md:pt-6 space-y-3 md:space-y-5">
//                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 text-gray-900 dark:text-gray-100">
//                             <div>
//                                 <label className="block text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Employee ID</label>
//                                 <div className="text-sm md:text-lg font-bold font-mono break-words">{salaryData.employeeDetails.employeeId}</div>
//                             </div>
//                             <div>
//                                 <label className="block text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Employee Code</label>
//                                 <div className="text-sm md:text-lg font-bold break-words">{salaryData.employeeDetails.employeeCode}</div>
//                             </div>
//                             <div>
//                                 <label className="block text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Join Date</label>
//                                 <div className="text-sm md:text-lg font-bold">{formatDate(salaryData.employeeDetails.joinDate)}</div>
//                             </div>
//                             <div>
//                                 <label className="block text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Work Type</label>
//                                 <div className="text-sm md:text-lg font-bold">{salaryData.employeeDetails.workType}</div>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>
//
//                 {/* Period & Attendance Card */}
//                 <Card className="shadow-lg border border-green-200 dark:border-green-800 rounded-lg">
//                     <CardHeader className="pb-4 md:pb-5 bg-gradient-to-r from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-800/30 rounded-t-lg">
//                         <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center gap-2 md:gap-3 text-green-800 dark:text-green-300 font-semibold">
//                             <div className="p-1 md:p-2 bg-green-600 rounded-lg">
//                                 <Calendar className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
//                             </div>
//                             Attendance Summary
//                         </CardTitle>
//                         <p className="text-xs md:text-sm text-green-700 dark:text-green-400 mt-1 font-medium">Working & Payable Days</p>
//                     </CardHeader>
//                     <CardContent className="pt-4 md:pt-6">
//                         <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
//                             <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 border border-green-300 dark:border-green-700 shadow-sm">
//                                 <div className="text-lg md:text-2xl lg:text-3xl font-extrabold text-green-600 dark:text-green-400 mb-1 md:mb-2">{salaryData.attendanceSummary.totalWorkingDays}</div>
//                                 <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 font-semibold">Total Working Days</div>
//                             </div>
//                             <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 border border-green-300 dark:border-green-700 shadow-sm">
//                                 <div className="text-lg md:text-2xl lg:text-3xl font-extrabold text-green-600 dark:text-green-400 mb-1 md:mb-2">{salaryData.attendanceSummary.presentDays}</div>
//                                 <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 font-semibold">Present Days</div>
//                             </div>
//                             <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 border border-yellow-300 dark:border-yellow-700 shadow-sm">
//                                 <div className="text-lg md:text-2xl lg:text-3xl font-extrabold text-yellow-600 dark:text-yellow-400 mb-1 md:mb-2">{salaryData.attendanceSummary.paidLeaves}</div>
//                                 <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 font-semibold">Paid Leaves</div>
//                             </div>
//                             <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 border border-red-300 dark:border-red-700 shadow-sm">
//                                 <div className="text-lg md:text-2xl lg:text-3xl font-extrabold text-red-600 dark:text-red-400 mb-1 md:mb-2">{salaryData.attendanceSummary.unpaidLeaves}</div>
//                                 <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 font-semibold">Unpaid Leaves</div>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>
//             </section>
//
//             {/* Earnings & Deductions */}
//             <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 lg:gap-10 mt-6 md:mt-8 lg:mt-10">
//                 {/* Earnings */}
//                 <Card className="shadow-lg border border-green-300 dark:border-green-700 rounded-lg">
//                     <CardHeader className="pb-4 md:pb-5 bg-gradient-to-r from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-800/30 rounded-t-lg border-b border-green-300 dark:border-green-700">
//                         <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center gap-2 md:gap-3 text-green-800 dark:text-green-300 font-semibold">
//                             <div className="p-1 md:p-2 bg-green-600 rounded-lg">
//                                 <TrendingUp className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
//                             </div>
//                             Earnings
//                         </CardTitle>
//                         <p className="text-xs md:text-sm text-green-700 dark:text-green-400 mt-1 font-medium">Salary Components & Benefits</p>
//                     </CardHeader>
//                     <CardContent className="p-0">
//                         <Table>
//                             <TableHeader>
//                                 <TableRow className="bg-green-50 dark:bg-green-900/20 hover:bg-green-50 dark:hover:bg-green-900/30">
//                                     <TableHead className="text-green-800 dark:text-green-300 font-bold py-3 md:py-4">Component</TableHead>
//                                     <TableHead className="text-green-800 dark:text-green-300 font-bold py-3 md:py-4 text-right">Amount</TableHead>
//                                 </TableRow>
//                             </TableHeader>
//                             <TableBody>
//                                 <TableRow className="hover:bg-green-50/50 dark:hover:bg-green-900/10">
//                                     <TableCell className="py-3 md:py-4">
//                                         <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">Basic Salary</div>
//                                         <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">Base salary component</p>
//                                     </TableCell>
//                                     <TableCell className="py-3 md:py-4 text-right font-bold text-green-700 dark:text-green-400 text-base md:text-lg">
//                                         {formatCurrency(salaryData.earnings.basic)}
//                                     </TableCell>
//                                 </TableRow>
//                                 <TableRow className="hover:bg-green-50/50 dark:hover:bg-green-900/10">
//                                     <TableCell className="py-3 md:py-4">
//                                         <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">HRA (House Rent Allowance)</div>
//                                         <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">Housing allowance</p>
//                                     </TableCell>
//                                     <TableCell className="py-3 md:py-4 text-right font-bold text-green-700 dark:text-green-400 text-base md:text-lg">
//                                         {formatCurrency(salaryData.earnings.hra)}
//                                     </TableCell>
//                                 </TableRow>
//                                 <TableRow className="hover:bg-green-50/50 dark:hover:bg-green-900/10">
//                                     <TableCell className="py-3 md:py-4">
//                                         <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">Other Allowances</div>
//                                         <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">Additional allowances</p>
//                                     </TableCell>
//                                     <TableCell className="py-3 md:py-4 text-right font-bold text-green-700 dark:text-green-400 text-base md:text-lg">
//                                         {formatCurrency(salaryData.earnings.allowances)}
//                                     </TableCell>
//                                 </TableRow>
//                                 <TableRow className="hover:bg-green-50/50 dark:hover:bg-green-900/10">
//                                     <TableCell className="py-3 md:py-4">
//                                         <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">Overtime Pay</div>
//                                         <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">Extra hours worked</p>
//                                     </TableCell>
//                                     <TableCell className="py-3 md:py-4 text-right font-bold text-green-700 dark:text-green-400 text-base md:text-lg">
//                                         {formatCurrency(salaryData.earnings.overtimePay)}
//                                     </TableCell>
//                                 </TableRow>
//                                 <TableRow className="bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border-t-2 border-green-300 dark:border-green-700">
//                                     <TableCell className="py-3 md:py-4 font-bold text-green-900 dark:text-green-300 text-base md:text-lg">Total Earnings</TableCell>
//                                     <TableCell className="py-3 md:py-4 text-right font-bold text-green-900 dark:text-green-300 text-lg md:text-xl">
//                                         {formatCurrency(salaryData.earnings.totalEarnings)}
//                                     </TableCell>
//                                 </TableRow>
//                             </TableBody>
//                         </Table>
//                     </CardContent>
//                 </Card>
//
//                 {/* Deductions */}
//                 <Card className="shadow-lg border border-red-300 dark:border-red-700 rounded-lg">
//                     <CardHeader className="pb-4 md:pb-5 bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 rounded-t-lg border-b border-red-300 dark:border-red-700">
//                         <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center gap-2 md:gap-3 text-red-800 dark:text-red-300 font-semibold">
//                             <div className="p-1 md:p-2 bg-red-600 rounded-lg">
//                                 <TrendingUp className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
//                             </div>
//                             Deductions
//                         </CardTitle>
//                         <p className="text-xs md:text-sm text-red-700 dark:text-red-400 mt-1 font-medium">Taxes & Other Deductions</p>
//                     </CardHeader>
//                     <CardContent className="p-0">
//                         <Table>
//                             <TableHeader>
//                                 <TableRow className="bg-red-50 dark:bg-red-900/20 hover:bg-red-50 dark:hover:bg-red-900/30">
//                                     <TableHead className="text-red-800 dark:text-red-300 font-bold py-3 md:py-4">Component</TableHead>
//                                     <TableHead className="text-red-800 dark:text-red-300 font-bold py-3 md:py-4 text-right">Amount</TableHead>
//                                 </TableRow>
//                             </TableHeader>
//                             <TableBody>
//                                 <TableRow className="hover:bg-red-50/50 dark:hover:bg-red-900/10">
//                                     <TableCell className="py-3 md:py-4">
//                                         <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">Salary Deduction</div>
//                                         <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">Unpaid leaves deduction</p>
//                                     </TableCell>
//                                     <TableCell className="py-3 md:py-4 text-right font-bold text-red-700 dark:text-red-400 text-base md:text-lg">
//                                         {formatCurrency(salaryData.deductions.salaryDeduction)}
//                                     </TableCell>
//                                 </TableRow>
//                                 <TableRow className="hover:bg-red-50/50 dark:hover:bg-red-900/10">
//                                     <TableCell className="py-3 md:py-4">
//                                         <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">Policy Deductions</div>
//                                         <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">Policy violations & penalties</p>
//                                     </TableCell>
//                                     <TableCell className="py-3 md:py-4 text-right font-bold text-red-700 dark:text-red-400 text-base md:text-lg">
//                                         {formatCurrency(salaryData.deductions.policyDeductions)}
//                                     </TableCell>
//                                 </TableRow>
//                                 <TableRow className="hover:bg-red-50/50 dark:hover:bg-red-900/10">
//                                     <TableCell className="py-3 md:py-4">
//                                         <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">Other Deductions</div>
//                                         <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">Miscellaneous deductions</p>
//                                     </TableCell>
//                                     <TableCell className="py-3 md:py-4 text-right font-bold text-red-700 dark:text-red-400 text-base md:text-lg">
//                                         {formatCurrency(salaryData.deductions.otherDeductions)}
//                                     </TableCell>
//                                 </TableRow>
//                                 <TableRow className="bg-gradient-to-r from-red-50 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 border-t-2 border-red-300 dark:border-red-700">
//                                     <TableCell className="py-3 md:py-4 font-bold text-red-900 dark:text-red-300 text-base md:text-lg">Total Deductions</TableCell>
//                                     <TableCell className="py-3 md:py-4 text-right font-bold text-red-900 dark:text-red-300 text-lg md:text-xl">
//                                         {formatCurrency(salaryData.deductions.totalDeductions)}
//                                     </TableCell>
//                                 </TableRow>
//                             </TableBody>
//                         </Table>
//                     </CardContent>
//                 </Card>
//             </section>
//
//             {/* Policy Deductions Details */}
//             <Card className="shadow-lg border border-orange-300 dark:border-orange-700 rounded-lg">
//                 <CardHeader className="pb-4 md:pb-5 bg-gradient-to-r from-orange-100 to-amber-200 dark:from-orange-900/30 dark:to-amber-900/30 rounded-t-lg">
//                     <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center gap-2 md:gap-3 text-orange-800 dark:text-orange-300 font-semibold">
//                         <div className="p-1 md:p-2 bg-orange-600 rounded-lg">
//                             <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
//                         </div>
//                         Policy Deductions Breakdown
//                     </CardTitle>
//                     <p className="text-xs md:text-sm text-orange-700 dark:text-orange-400 mt-1 font-medium">Late Entries, Early Leaves & Break Violations</p>
//                 </CardHeader>
//                 <CardContent>
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
//                         <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 md:p-5 border border-orange-200 dark:border-orange-800">
//                             <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
//                                 <Clock8 className="w-4 h-4 md:w-5 md:h-5 text-orange-600 dark:text-orange-400" />
//                                 <h4 className="font-semibold text-orange-800 dark:text-orange-300 text-sm md:text-base">Late Entry Deductions</h4>
//                             </div>
//                             <div className="text-xl md:text-2xl lg:text-3xl font-bold text-orange-700 dark:text-orange-400 mb-1 md:mb-2">
//                                 {formatCurrency(salaryData.policyDetails.deductions.summary.lateEntryDeductions)}
//                             </div>
//                             <p className="text-xs md:text-sm text-orange-600 dark:text-orange-400">
//                                 {policyStats.lateEntries} late entry violation(s)
//                             </p>
//                         </div>
//                         <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 md:p-5 border border-red-200 dark:border-red-800">
//                             <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
//                                 <LogOut className="w-4 h-4 md:w-5 md:h-5 text-red-600 dark:text-red-400" />
//                                 <h4 className="font-semibold text-red-800 dark:text-red-300 text-sm md:text-base">Early Leave Deductions</h4>
//                             </div>
//                             <div className="text-xl md:text-2xl lg:text-3xl font-bold text-red-700 dark:text-red-400 mb-1 md:mb-2">
//                                 {formatCurrency(salaryData.policyDetails.deductions.summary.earlyLeaveDeductions)}
//                             </div>
//                             <p className="text-xs md:text-sm text-red-600 dark:text-red-400">
//                                 {policyStats.earlyLeaves} early leave violation(s)
//                             </p>
//                         </div>
//                         <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 md:p-5 border border-purple-200 dark:border-purple-800">
//                             <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
//                                 <Coffee className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
//                                 <h4 className="font-semibold text-purple-800 dark:text-purple-300 text-sm md:text-base">Break Violation Deductions</h4>
//                             </div>
//                             <div className="text-xl md:text-2xl lg:text-3xl font-bold text-purple-700 dark:text-purple-400 mb-1 md:mb-2">
//                                 {formatCurrency(salaryData.policyDetails.deductions.summary.breakDeductions)}
//                             </div>
//                             <p className="text-xs md:text-sm text-purple-600 dark:text-purple-400">
//                                 {policyStats.breakViolations} break violation(s)
//                             </p>
//                         </div>
//                     </div>
//
//                     {/* Daily Policy Details Table */}
//                     <div className="overflow-x-auto">
//                         <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4 text-gray-700 dark:text-gray-300">Daily Violation Details</h4>
//                         <Table>
//                             <TableHeader>
//                                 <TableRow>
//                                     <TableHead className="text-xs md:text-sm">Date</TableHead>
//                                     <TableHead className="text-xs md:text-sm text-center">Late Entry</TableHead>
//                                     <TableHead className="text-xs md:text-sm text-center">Early Leave</TableHead>
//                                     <TableHead className="text-xs md:text-sm text-center">Break Violation</TableHead>
//                                     <TableHead className="text-xs md:text-sm text-right">Total Deduction</TableHead>
//                                 </TableRow>
//                             </TableHeader>
//                             <TableBody>
//                                 {salaryData.policyDetails.deductions.dailyDetails
//                                     .filter(day => day.lateEntry.deduction > 0 || day.earlyLeave.deduction > 0 || day.breaks.deduction > 0)
//                                     .map((day, index) => (
//                                         <TableRow key={index}>
//                                             <TableCell className="font-medium text-xs md:text-sm dark:text-gray-300">
//                                                 {formatDate(day.date)}
//                                             </TableCell>
//                                             <TableCell className="text-center">
//                                                 {day.lateEntry.deduction > 0 ? (
//                                                     <div className="inline-flex flex-col">
//                                                         <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 text-xs">
//                                                             {formatCurrency(day.lateEntry.deduction)}
//                                                         </Badge>
//                                                         <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//                                                             {day.lateEntry.violationMinutes} min
//                                                         </span>
//                                                     </div>
//                                                 ) : (
//                                                     <span className="text-gray-400 text-xs md:text-sm">-</span>
//                                                 )}
//                                             </TableCell>
//                                             <TableCell className="text-center">
//                                                 {day.earlyLeave.deduction > 0 ? (
//                                                     <div className="inline-flex flex-col">
//                                                         <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 text-xs">
//                                                             {formatCurrency(day.earlyLeave.deduction)}
//                                                         </Badge>
//                                                         <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//                                                             {day.earlyLeave.violationMinutes} min
//                                                         </span>
//                                                     </div>
//                                                 ) : (
//                                                     <span className="text-gray-400 text-xs md:text-sm">-</span>
//                                                 )}
//                                             </TableCell>
//                                             <TableCell className="text-center">
//                                                 {day.breaks.deduction > 0 ? (
//                                                     <div className="inline-flex flex-col">
//                                                         <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 text-xs">
//                                                             {formatCurrency(day.breaks.deduction)}
//                                                         </Badge>
//                                                         <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//                                                             {day.breaks.violationMinutes} min
//                                                         </span>
//                                                     </div>
//                                                 ) : (
//                                                     <span className="text-gray-400 text-xs md:text-sm">-</span>
//                                                 )}
//                                             </TableCell>
//                                             <TableCell className="text-right font-bold text-xs md:text-sm dark:text-gray-300">
//                                                 {formatCurrency(day.lateEntry.deduction + day.earlyLeave.deduction + day.breaks.deduction)}
//                                             </TableCell>
//                                         </TableRow>
//                                     ))}
//                                 {salaryData.policyDetails.deductions.dailyDetails.filter(day =>
//                                     day.lateEntry.deduction > 0 || day.earlyLeave.deduction > 0 || day.breaks.deduction > 0
//                                 ).length === 0 && (
//                                     <TableRow>
//                                         <TableCell colSpan={5} className="text-center py-6 md:py-8 text-gray-500 dark:text-gray-400 text-sm">
//                                             No policy violations for this period
//                                         </TableCell>
//                                     </TableRow>
//                                 )}
//                             </TableBody>
//                         </Table>
//                     </div>
//                 </CardContent>
//             </Card>
//
//             {/* Salary Summary & Calculation */}
//             <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 lg:gap-10 mt-6 md:mt-8 lg:mt-10">
//                 {/* Salary Summary */}
//                 <Card className="shadow-2xl border-2 border-blue-400 dark:border-blue-600 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 dark:from-blue-900 dark:via-blue-800 dark:to-indigo-900 text-white rounded-xl">
//                     <CardHeader className="pb-4 md:pb-6">
//                         <CardTitle className="text-xl md:text-2xl lg:text-3xl flex items-center gap-3 md:gap-4">
//                             <div className="p-2 md:p-3 bg-white/30 rounded-lg backdrop-blur-sm">
//                                 <DollarSign className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8" />
//                             </div>
//                             Salary Summary
//                         </CardTitle>
//                         <p className="text-xs md:text-sm font-normal text-blue-100 mt-1">Final Take Home Amount</p>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 text-center">
//                             <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 md:p-6 lg:p-8 border border-white/25">
//                                 <div className="text-blue-200 text-xs md:text-sm font-semibold mb-2 md:mb-3">Gross Salary</div>
//                                 <div className="text-2xl md:text-3xl lg:text-4xl font-extrabold">{formatCurrency(salaryData.earnings.totalEarnings)}</div>
//                             </div>
//                             <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 md:p-6 lg:p-8 border border-white/25">
//                                 <div className="text-blue-200 text-xs md:text-sm font-semibold mb-2 md:mb-3">Total Deductions</div>
//                                 <div className="text-2xl md:text-3xl lg:text-4xl font-extrabold">{formatCurrency(salaryData.deductions.totalDeductions)}</div>
//                             </div>
//                             <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4 md:p-6 lg:p-8 border-2 border-green-400 shadow-lg">
//                                 <div className="text-green-200 text-xs md:text-sm font-semibold mb-2 md:mb-3">Net Salary</div>
//                                 <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-green-300">{formatCurrency(salaryData.netSalary)}</div>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>
//
//                 {/* Calculation Details */}
//                 <Card className="shadow-lg border border-purple-300 dark:border-purple-700 rounded-lg">
//                     <CardHeader className="pb-4 md:pb-5 bg-gradient-to-r from-purple-100 to-violet-200 dark:from-purple-900/30 dark:to-violet-900/30 rounded-t-lg">
//                         <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center gap-2 md:gap-3 text-purple-800 dark:text-purple-300 font-semibold">
//                             <div className="p-1 md:p-2 bg-purple-600 rounded-lg">
//                                 <Calculator className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
//                             </div>
//                             Calculation Details
//                         </CardTitle>
//                         <p className="text-xs md:text-sm text-purple-700 dark:text-purple-400 mt-1 font-medium">Salary Computation Formulas</p>
//                     </CardHeader>
//                     <CardContent className="pt-4 md:pt-6 space-y-3 md:space-y-5 text-gray-900 dark:text-gray-100">
//                         <div className="space-y-3 md:space-y-4">
//                             <div className="flex justify-between border-b border-purple-100 dark:border-purple-800 pb-2 md:pb-3">
//                                 <span className="font-medium text-gray-600 dark:text-gray-400 text-sm md:text-base">Per Day Rate:</span>
//                                 <span className="font-bold text-gray-900 dark:text-white text-sm md:text-base">{formatCurrency(salaryData.calculation.perDayRate)}</span>
//                             </div>
//                             <div className="flex flex-col border-b border-purple-100 dark:border-purple-800 pb-2 md:pb-3">
//                                 <span className="font-medium text-gray-600 dark:text-gray-400 mb-1 md:mb-2 text-sm md:text-base">Per Day Formula:</span>
//                                 <code className="bg-purple-50 dark:bg-purple-900/20 p-2 md:p-3 rounded-md text-xs md:text-sm font-mono text-purple-800 dark:text-purple-300 break-words">
//                                     {salaryData.calculation.perDayFormula}
//                                 </code>
//                             </div>
//                             <div className="flex flex-col border-b border-purple-100 dark:border-purple-800 pb-2 md:pb-3">
//                                 <span className="font-medium text-gray-600 dark:text-gray-400 mb-1 md:mb-2 text-sm md:text-base">Working Days Formula:</span>
//                                 <code className="bg-purple-50 dark:bg-purple-900/20 p-2 md:p-3 rounded-md text-xs md:text-sm font-mono text-purple-800 dark:text-purple-300 break-words">
//                                     {salaryData.calculation.workingDaysFormula}
//                                 </code>
//                             </div>
//                             <div className="flex flex-col">
//                                 <span className="font-medium text-gray-600 dark:text-gray-400 mb-1 md:mb-2 text-sm md:text-base">Calculation Notes:</span>
//                                 <div className="bg-blue-50 dark:bg-blue-900/20 p-3 md:p-4 rounded-md text-xs md:text-sm text-blue-800 dark:text-blue-300">
//                                     <Info className="w-3 h-3 md:w-4 md:h-4 inline mr-1 md:mr-2" />
//                                     {salaryData.calculationNotes}
//                                 </div>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>
//             </section>
//
//             {/* Bank Details & Additional Info */}
//             {salaryData.bankDetails && (
//                 <Card className="shadow-lg border border-gray-300 dark:border-gray-700 rounded-lg mt-6 md:mt-8 lg:mt-10">
//                     <CardHeader className="pb-4 md:pb-5 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-900/30 dark:to-gray-800/30 rounded-t-lg">
//                         <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center gap-2 md:gap-3 text-gray-800 dark:text-gray-300 font-semibold">
//                             <div className="p-1 md:p-2 bg-gray-600 rounded-lg">
//                                 <Banknote className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
//                             </div>
//                             Bank Details & Additional Information
//                         </CardTitle>
//                         <p className="text-xs md:text-sm text-gray-700 dark:text-gray-400 mt-1 font-medium">Salary Transfer & System Information</p>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
//                             {/* Bank Details */}
//                             <div className="space-y-3 md:space-y-5">
//                                 <h4 className="font-semibold text-base md:text-lg text-gray-700 dark:text-gray-300">Bank Details</h4>
//                                 <div className="space-y-3 md:space-y-4 text-gray-900 dark:text-gray-100">
//                                     <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2 md:pb-3">
//                                         <span className="font-medium text-gray-600 dark:text-gray-400 text-sm md:text-base">Account Holder:</span>
//                                         <span className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{salaryData.bankDetails.accountHolderName}</span>
//                                     </div>
//                                     <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2 md:pb-3">
//                                         <span className="font-medium text-gray-600 dark:text-gray-400 text-sm md:text-base">Account Number:</span>
//                                         <span className="font-semibold text-gray-900 dark:text-white font-mono text-sm md:text-base">{salaryData.bankDetails.accountNumber}</span>
//                                     </div>
//                                     <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2 md:pb-3">
//                                         <span className="font-medium text-gray-600 dark:text-gray-400 text-sm md:text-base">IFSC Code:</span>
//                                         <span className="font-semibold text-gray-900 dark:text-white font-mono text-sm md:text-base">{salaryData.bankDetails.ifsc}</span>
//                                     </div>
//                                     <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2 md:pb-3">
//                                         <span className="font-medium text-gray-600 dark:text-gray-400 text-sm md:text-base">Bank Name:</span>
//                                         <span className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{salaryData.bankDetails.bankName}</span>
//                                     </div>
//                                 </div>
//                             </div>
//
//                             {/* System Information */}
//                             <div className="space-y-3 md:space-y-5">
//                                 <h4 className="font-semibold text-base md:text-lg text-gray-700 dark:text-gray-300">System Information</h4>
//                                 <div className="space-y-3 md:space-y-4 text-gray-900 dark:text-gray-100">
//                                     <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2 md:pb-3">
//                                         <span className="font-medium text-gray-600 dark:text-gray-400 text-sm md:text-base">Generated At:</span>
//                                         <span className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{formatDateTime(salaryData.generatedAt)}</span>
//                                     </div>
//                                     <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2 md:pb-3">
//                                         <span className="font-medium text-gray-600 dark:text-gray-400 text-sm md:text-base">Employee ID:</span>
//                                         <span className="font-semibold text-gray-900 dark:text-white font-mono text-sm md:text-base">{salaryData.employeeDetails.employeeId}</span>
//                                     </div>
//                                     <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2 md:pb-3">
//                                         <span className="font-medium text-gray-600 dark:text-gray-400 text-sm md:text-base">Month Number:</span>
//                                         <span className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{salaryData.salaryPeriod.monthNumber}</span>
//                                     </div>
//                                     <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2 md:pb-3">
//                                         <span className="font-medium text-gray-600 dark:text-gray-400 text-sm md:text-base">Year:</span>
//                                         <span className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{salaryData.salaryPeriod.year}</span>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>
//             )}
//         </div>
//     );
// };
//
// const PdfSalarySlip = ({
//                            salaryData,
//                            selectedUser
//                        }: {
//     salaryData: SalarySlipResponseData['data'];
//     selectedUser: UserData;
// }) => {
//     const formatDate = (dateString: string) => {
//         return new Date(dateString).toLocaleDateString('en-IN', {
//             day: '2-digit',
//             month: 'short',
//             year: 'numeric'
//         });
//     };
//
//     const numberToWords = (num: number): string => {
//         const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
//         const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
//         const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
//
//         if (num === 0) return 'Zero';
//
//         const convertHundreds = (n: number): string => {
//             let result = '';
//             if (n >= 100) {
//                 result += ones[Math.floor(n / 100)] + ' Hundred ';
//                 n %= 100;
//             }
//             if (n >= 20) {
//                 result += tens[Math.floor(n / 10)] + ' ';
//                 n %= 10;
//             } else if (n >= 10) {
//                 result += teens[n - 10] + ' ';
//                 return result;
//             }
//             if (n > 0) {
//                 result += ones[n] + ' ';
//             }
//             return result;
//         };
//
//         if (num >= 10000000) {
//             const crores = Math.floor(num / 10000000);
//             const remaining = num % 10000000;
//             return convertHundreds(crores) + 'Crore ' + numberToWords(remaining);
//         } else if (num >= 100000) {
//             const lakhs = Math.floor(num / 100000);
//             const remaining = num % 100000;
//             return convertHundreds(lakhs) + 'Lakh ' + numberToWords(remaining);
//         } else if (num >= 1000) {
//             const thousands = Math.floor(num / 1000);
//             const remaining = num % 1000;
//             return convertHundreds(thousands) + 'Thousand ' + numberToWords(remaining);
//         } else {
//             return convertHundreds(num);
//         }
//     };
//
//     const getPolicyViolationStats = () => {
//         const stats = {
//             lateEntries: 0,
//             earlyLeaves: 0,
//             breakViolations: 0
//         };
//
//         salaryData.policyDetails.deductions.dailyDetails.forEach(day => {
//             if (day.lateEntry.deduction > 0) stats.lateEntries++;
//             if (day.earlyLeave.deduction > 0) stats.earlyLeaves++;
//             if (day.breaks.deduction > 0) stats.breakViolations++;
//         });
//
//         return stats;
//     };
//
//     const policyStats = getPolicyViolationStats();
//
//     return (
//         <div
//             id="salary-slip-pdf"
//             style={{
//                 width: '100%',
//                 maxWidth: '800px',
//                 minHeight: '600px',
//                 padding: '20px',
//                 margin: '0 auto',
//                 backgroundColor: '#ffffff',
//                 color: '#000000',
//                 fontFamily: 'Arial, sans-serif',
//                 fontSize: '14px',
//                 lineHeight: '1.5',
//                 boxSizing: 'border-box'
//             }}
//         >
//             {/* Main Salary Slip Table */}
//             <table style={{
//                 width: '100%',
//                 border: '2px solid #000',
//                 borderCollapse: 'collapse',
//                 marginBottom: '25px',
//                 fontSize: '13px',
//                 pageBreakInside: 'avoid'
//             }}>
//                 <tbody>
//                 {/* Header */}
//                 <tr>
//                     <td colSpan={2} style={{
//                         textAlign: 'center',
//                         backgroundColor: '#f0f0f0',
//                         padding: '15px',
//                         border: '1px solid #000',
//                         fontWeight: 'bold',
//                         fontSize: '18px'
//                     }}>
//                         Payslip - {salaryData.salaryPeriod.month} {salaryData.salaryPeriod.year}
//                     </td>
//                 </tr>
//
//                 {/* Company Info */}
//                 <tr>
//                     <td colSpan={2} style={{
//                         textAlign: 'center',
//                         padding: '20px',
//                         border: '1px solid #000'
//                     }}>
//                         <div style={{ fontWeight: 'bold', fontSize: '24px', marginBottom: '10px' }}>
//                             PulseSeal
//                         </div>
//                         <div style={{ fontSize: '14px', margin: '5px 0', fontWeight: '600' }}>
//                             Salary Period: {formatDate(salaryData.salaryPeriod.fromDate)} to {formatDate(salaryData.salaryPeriod.toDate)}
//                         </div>
//                         <div style={{ fontSize: '12px', margin: '5px 0', color: '#666' }}>
//                             Generated: {new Date(salaryData.generatedAt).toLocaleString('en-IN')}
//                         </div>
//                     </td>
//                 </tr>
//
//                 {/* Employee Details */}
//                 <tr>
//                     <td style={{
//                         width: '50%',
//                         padding: '15px',
//                         border: '1px solid #000',
//                         verticalAlign: 'top'
//                     }}>
//                         <div style={{ marginBottom: '12px' }}>
//                             <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Employee Name:</span>
//                             <br />
//                             <span style={{ fontSize: '14px' }}>{salaryData.employeeDetails.name}</span>
//                         </div>
//                         <div style={{ marginBottom: '12px' }}>
//                             <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Employee Code:</span>
//                             <br />
//                             <span style={{ fontSize: '14px' }}>{salaryData.employeeDetails.employeeCode}</span>
//                         </div>
//                         <div style={{ marginBottom: '12px' }}>
//                             <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Employee ID:</span>
//                             <br />
//                             <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{salaryData.employeeDetails.employeeId}</span>
//                         </div>
//                         <div>
//                             <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Work Type:</span>
//                             <br />
//                             <span style={{ fontSize: '14px' }}>{salaryData.employeeDetails.workType}</span>
//                         </div>
//                     </td>
//                     <td style={{
//                         width: '50%',
//                         padding: '15px',
//                         border: '1px solid #000',
//                         verticalAlign: 'top'
//                     }}>
//                         <div style={{ marginBottom: '12px' }}>
//                             <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Join Date:</span>
//                             <br />
//                             <span style={{ fontSize: '14px' }}>{formatDate(salaryData.employeeDetails.joinDate)}</span>
//                         </div>
//                         <div style={{ marginBottom: '12px' }}>
//                             <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Designation:</span>
//                             <br />
//                             <span style={{ fontSize: '14px' }}>{selectedUser?.roleDefinitionId.roleName || 'N/A'}</span>
//                         </div>
//                         <div style={{ marginBottom: '12px' }}>
//                             <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Per Day Rate:</span>
//                             <br />
//                             <span style={{ fontSize: '14px' }}>₹{salaryData.calculation.perDayRate.toFixed(2)}</span>
//                         </div>
//                     </td>
//                 </tr>
//
//                 {/* Attendance Summary */}
//                 <tr>
//                     <td colSpan={2} style={{
//                         padding: '15px',
//                         border: '1px solid #000',
//                         backgroundColor: '#f8f9fa',
//                         pageBreakInside: 'avoid'
//                     }}>
//                         <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>Attendance Summary</div>
//                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', fontSize: '12px' }}>
//                             <div>
//                                 <div style={{ fontWeight: '600' }}>Total Working Days</div>
//                                 <div>{salaryData.attendanceSummary.totalWorkingDays}</div>
//                             </div>
//                             <div>
//                                 <div style={{ fontWeight: '600' }}>Present Days</div>
//                                 <div>{salaryData.attendanceSummary.presentDays}</div>
//                             </div>
//                             <div>
//                                 <div style={{ fontWeight: '600' }}>Paid Leaves</div>
//                                 <div>{salaryData.attendanceSummary.paidLeaves}</div>
//                             </div>
//                             <div>
//                                 <div style={{ fontWeight: '600' }}>Unpaid Leaves</div>
//                                 <div>{salaryData.attendanceSummary.unpaidLeaves}</div>
//                             </div>
//                         </div>
//                     </td>
//                 </tr>
//
//                 {/* Earnings Header */}
//                 <tr>
//                     <td style={{
//                         padding: '12px',
//                         fontWeight: 'bold',
//                         textAlign: 'center',
//                         border: '1px solid #000',
//                         backgroundColor: '#f0f0f0',
//                         fontSize: '14px'
//                     }}>
//                         Earnings
//                     </td>
//                     <td style={{
//                         padding: '12px',
//                         fontWeight: 'bold',
//                         textAlign: 'center',
//                         border: '1px solid #000',
//                         backgroundColor: '#f0f0f0',
//                         width: '150px',
//                         fontSize: '14px'
//                     }}>
//                         Amount
//                     </td>
//                 </tr>
//
//                 {/* Earnings Items */}
//                 <tr>
//                     <td style={{ padding: '12px', border: '1px solid #000' }}>
//                         <div style={{ fontWeight: '500', fontSize: '13px' }}>Basic Salary</div>
//                         <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Base salary component</div>
//                     </td>
//                     <td style={{ padding: '12px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
//                         ₹{salaryData.earnings.basic.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </td>
//                 </tr>
//                 <tr>
//                     <td style={{ padding: '12px', border: '1px solid #000' }}>
//                         <div style={{ fontWeight: '500', fontSize: '13px' }}>HRA (House Rent Allowance)</div>
//                         <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Housing allowance</div>
//                     </td>
//                     <td style={{ padding: '12px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
//                         ₹{salaryData.earnings.hra.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </td>
//                 </tr>
//                 <tr>
//                     <td style={{ padding: '12px', border: '1px solid #000' }}>
//                         <div style={{ fontWeight: '500', fontSize: '13px' }}>Other Allowances</div>
//                         <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Additional allowances</div>
//                     </td>
//                     <td style={{ padding: '12px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
//                         ₹{salaryData.earnings.allowances.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </td>
//                 </tr>
//                 <tr>
//                     <td style={{ padding: '12px', border: '1px solid #000' }}>
//                         <div style={{ fontWeight: '500', fontSize: '13px' }}>Overtime Pay</div>
//                         <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Extra hours worked</div>
//                     </td>
//                     <td style={{ padding: '12px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
//                         ₹{salaryData.earnings.overtimePay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </td>
//                 </tr>
//
//                 {/* Total Earnings */}
//                 <tr>
//                     <td style={{
//                         padding: '12px',
//                         fontWeight: 'bold',
//                         textAlign: 'right',
//                         border: '1px solid #000',
//                         backgroundColor: '#f0f0f0',
//                         fontSize: '14px'
//                     }}>
//                         Total Earnings
//                     </td>
//                     <td style={{
//                         padding: '12px',
//                         fontWeight: 'bold',
//                         textAlign: 'right',
//                         border: '1px solid #000',
//                         backgroundColor: '#f0f0f0',
//                         fontSize: '14px'
//                     }}>
//                         ₹{salaryData.earnings.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </td>
//                 </tr>
//
//                 {/* Deductions Header */}
//                 <tr>
//                     <td style={{
//                         padding: '12px',
//                         fontWeight: 'bold',
//                         textAlign: 'center',
//                         border: '1px solid #000',
//                         backgroundColor: '#f0f0f0',
//                         fontSize: '14px'
//                     }}>
//                         Deductions
//                     </td>
//                     <td style={{
//                         padding: '12px',
//                         fontWeight: 'bold',
//                         textAlign: 'center',
//                         border: '1px solid #000',
//                         backgroundColor: '#f0f0f0',
//                         fontSize: '14px'
//                     }}>
//                         Amount
//                     </td>
//                 </tr>
//
//                 {/* Deductions Items */}
//                 <tr>
//                     <td style={{ padding: '12px', border: '1px solid #000' }}>
//                         <div style={{ fontWeight: '500', fontSize: '13px' }}>Salary Deduction (Unpaid Leaves)</div>
//                         <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>{salaryData.attendanceSummary.unpaidLeaves} unpaid leave(s)</div>
//                     </td>
//                     <td style={{ padding: '12px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
//                         ₹{salaryData.deductions.salaryDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </td>
//                 </tr>
//                 <tr>
//                     <td style={{ padding: '12px', border: '1px solid #000' }}>
//                         <div style={{ fontWeight: '500', fontSize: '13px' }}>Policy Deductions</div>
//                         <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
//                             Late: {policyStats.lateEntries}, Early: {policyStats.earlyLeaves}, Break: {policyStats.breakViolations}
//                         </div>
//                     </td>
//                     <td style={{ padding: '12px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
//                         ₹{salaryData.deductions.policyDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </td>
//                 </tr>
//                 <tr>
//                     <td style={{ padding: '12px', border: '1px solid #000' }}>
//                         <div style={{ fontWeight: '500', fontSize: '13px' }}>Other Deductions</div>
//                         <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Miscellaneous deductions</div>
//                     </td>
//                     <td style={{ padding: '12px', border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
//                         ₹{salaryData.deductions.otherDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </td>
//                 </tr>
//
//                 {/* Total Deductions */}
//                 <tr>
//                     <td style={{
//                         padding: '12px',
//                         fontWeight: 'bold',
//                         textAlign: 'right',
//                         border: '1px solid #000',
//                         backgroundColor: '#f0f0f0',
//                         fontSize: '14px'
//                     }}>
//                         Total Deductions
//                     </td>
//                     <td style={{
//                         padding: '12px',
//                         fontWeight: 'bold',
//                         textAlign: 'right',
//                         border: '1px solid #000',
//                         backgroundColor: '#f0f0f0',
//                         fontSize: '14px'
//                     }}>
//                         ₹{salaryData.deductions.totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </td>
//                 </tr>
//
//                 {/* Net Pay */}
//                 <tr>
//                     <td style={{
//                         padding: '12px',
//                         fontWeight: 'bold',
//                         textAlign: 'right',
//                         border: '1px solid #000',
//                         backgroundColor: '#e8f4fd',
//                         fontSize: '14px'
//                     }}>
//                         Net Pay
//                     </td>
//                     <td style={{
//                         padding: '12px',
//                         fontWeight: 'bold',
//                         textAlign: 'right',
//                         border: '1px solid #000',
//                         backgroundColor: '#e8f4fd',
//                         fontSize: '16px'
//                     }}>
//                         ₹{salaryData.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </td>
//                 </tr>
//                 </tbody>
//             </table>
//
//             {/* Policy Deductions Breakdown - NOW ON SEPARATE PAGE */}
//             <div style={{
//                 marginBottom: '30px',
//                 padding: '20px',
//                 border: '1px solid #ddd',
//                 borderRadius: '5px',
//                 backgroundColor: '#f9f9f9',
//                 pageBreakBefore: 'always',
//                 pageBreakInside: 'avoid'
//             }}>
//                 <h4 style={{ margin: '0 0 15px 0', fontWeight: 'bold', fontSize: '16px' }}>Policy Deductions Breakdown:</h4>
//                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', fontSize: '13px', marginBottom: '25px' }}>
//                     <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '6px', border: '1px solid #ffeaa7' }}>
//                         <div style={{ fontWeight: '600', color: '#856404', fontSize: '14px' }}>Late Entry</div>
//                         <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#856404', margin: '10px 0' }}>
//                             ₹{salaryData.policyDetails.deductions.summary.lateEntryDeductions.toFixed(2)}
//                         </div>
//                         <div style={{ fontSize: '12px', color: '#856404' }}>{policyStats.lateEntries} violation(s)</div>
//                     </div>
//                     <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8d7da', borderRadius: '6px', border: '1px solid #f5c6cb' }}>
//                         <div style={{ fontWeight: '600', color: '#721c24', fontSize: '14px' }}>Early Leave</div>
//                         <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#721c24', margin: '10px 0' }}>
//                             ₹{salaryData.policyDetails.deductions.summary.earlyLeaveDeductions.toFixed(2)}
//                         </div>
//                         <div style={{ fontSize: '12px', color: '#721c24' }}>{policyStats.earlyLeaves} violation(s)</div>
//                     </div>
//                     <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#e2d9f3', borderRadius: '6px', border: '1px solid #d6c6e9' }}>
//                         <div style={{ fontWeight: '600', color: '#4a3c6e', fontSize: '14px' }}>Break Violation</div>
//                         <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4a3c6e', margin: '10px 0' }}>
//                             ₹{salaryData.policyDetails.deductions.summary.breakDeductions.toFixed(2)}
//                         </div>
//                         <div style={{ fontSize: '12px', color: '#4a3c6e' }}>{policyStats.breakViolations} violation(s)</div>
//                     </div>
//                 </div>
//
//                 {/* Daily Violation Details */}
//                 {salaryData.policyDetails.deductions.dailyDetails.filter(day =>
//                     day.lateEntry.deduction > 0 || day.earlyLeave.deduction > 0 || day.breaks.deduction > 0
//                 ).length > 0 && (
//                     <div>
//                         <h4 style={{ margin: '0 0 15px 0', fontWeight: 'bold', fontSize: '16px' }}>Daily Violation Details:</h4>
//                         <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
//                             <thead>
//                             <tr style={{ backgroundColor: '#f0f0f0' }}>
//                                 <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Date</th>
//                                 <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Late Entry</th>
//                                 <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Early Leave</th>
//                                 <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Break Violation</th>
//                                 <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>Total Deduction</th>
//                             </tr>
//                             </thead>
//                             <tbody>
//                             {salaryData.policyDetails.deductions.dailyDetails
//                                 .filter(day => day.lateEntry.deduction > 0 || day.earlyLeave.deduction > 0 || day.breaks.deduction > 0)
//                                 .map((day, index) => (
//                                     <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
//                                         <td style={{ padding: '10px', border: '1px solid #ddd' }}>{formatDate(day.date)}</td>
//                                         <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
//                                             {day.lateEntry.deduction > 0 ? (
//                                                 <div>
//                                                     <div style={{ fontWeight: '600', color: '#856404' }}>
//                                                         ₹{day.lateEntry.deduction.toFixed(2)}
//                                                     </div>
//                                                     <div style={{ fontSize: '11px', color: '#666' }}>
//                                                         {day.lateEntry.violationMinutes} min
//                                                     </div>
//                                                 </div>
//                                             ) : '-'}
//                                         </td>
//                                         <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
//                                             {day.earlyLeave.deduction > 0 ? (
//                                                 <div>
//                                                     <div style={{ fontWeight: '600', color: '#721c24' }}>
//                                                         ₹{day.earlyLeave.deduction.toFixed(2)}
//                                                     </div>
//                                                     <div style={{ fontSize: '11px', color: '#666' }}>
//                                                         {day.earlyLeave.violationMinutes} min
//                                                     </div>
//                                                 </div>
//                                             ) : '-'}
//                                         </td>
//                                         <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
//                                             {day.breaks.deduction > 0 ? (
//                                                 <div>
//                                                     <div style={{ fontWeight: '600', color: '#4a3c6e' }}>
//                                                         ₹{day.breaks.deduction.toFixed(2)}
//                                                     </div>
//                                                     <div style={{ fontSize: '11px', color: '#666' }}>
//                                                         {day.breaks.violationMinutes} min
//                                                     </div>
//                                                 </div>
//                                             ) : '-'}
//                                         </td>
//                                         <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right', fontWeight: '600' }}>
//                                             ₹{(day.lateEntry.deduction + day.earlyLeave.deduction + day.breaks.deduction).toFixed(2)}
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>
//                 )}
//             </div>
//
//             {/* Calculation Details */}
//             <div style={{
//                 marginBottom: '30px',
//                 padding: '20px',
//                 border: '1px solid #ddd',
//                 borderRadius: '5px',
//                 backgroundColor: '#f8f9fa',
//                 fontSize: '13px',
//                 pageBreakInside: 'avoid'
//             }}>
//                 <h4 style={{ margin: '0 0 15px 0', fontWeight: 'bold', fontSize: '16px' }}>Calculation Details:</h4>
//                 <div style={{ marginBottom: '15px' }}>
//                     <strong>Per Day Rate Formula:</strong> {salaryData.calculation.perDayFormula}
//                 </div>
//                 <div style={{ marginBottom: '15px' }}>
//                     <strong>Working Days Formula:</strong> {salaryData.calculation.workingDaysFormula}
//                 </div>
//                 <div>
//                     <strong>Calculation Notes:</strong> {salaryData.calculationNotes}
//                 </div>
//             </div>
//
//             {/* Bank Details */}
//             {salaryData.bankDetails && (
//                 <div style={{
//                     marginBottom: '30px',
//                     padding: '20px',
//                     border: '1px solid #ddd',
//                     borderRadius: '5px',
//                     backgroundColor: '#f9f9f9',
//                     pageBreakInside: 'avoid'
//                 }}>
//                     <h4 style={{ margin: '0 0 15px 0', fontWeight: 'bold', fontSize: '16px' }}>Bank Details:</h4>
//                     <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
//                         <div><strong>Account Holder:</strong> {salaryData.bankDetails.accountHolderName}</div>
//                         <div><strong>Account Number:</strong> {salaryData.bankDetails.accountNumber}</div>
//                         <div><strong>IFSC Code:</strong> {salaryData.bankDetails.ifsc}</div>
//                         <div><strong>Bank:</strong> {salaryData.bankDetails.bankName}</div>
//                     </div>
//                 </div>
//             )}
//
//             {/* Amount in words section */}
//             <div style={{
//                 textAlign: 'center',
//                 marginBottom: '30px',
//                 fontSize: '18px',
//                 fontWeight: 'bold',
//                 padding: '15px',
//                 backgroundColor: '#f0f8ff',
//                 borderRadius: '5px',
//                 border: '1px solid #b3d9ff'
//             }}>
//                 Net Pay: ₹{Math.round(salaryData.netSalary).toLocaleString('en-IN')}
//             </div>
//
//             <div style={{
//                 textAlign: 'center',
//                 marginBottom: '40px',
//                 fontSize: '14px',
//                 padding: '15px',
//                 backgroundColor: '#f9f9f9',
//                 borderRadius: '5px',
//                 border: '1px solid #ddd'
//             }}>
//                 <strong style={{ fontSize: '15px' }}>
//                     In Words: {numberToWords(Math.round(salaryData.netSalary)).trim()} Rupees Only
//                 </strong>
//             </div>
//
//             {/* Signatures */}
//             <div style={{
//                 display: 'flex',
//                 justifyContent: 'space-between',
//                 marginTop: '60px',
//                 paddingTop: '25px',
//                 borderTop: '2px solid #000',
//                 pageBreakInside: 'avoid'
//             }}>
//                 <div style={{ textAlign: 'center', width: '300px' }}>
//                     <div style={{
//                         borderTop: '1px solid #000',
//                         marginBottom: '15px',
//                         height: '70px'
//                     }}></div>
//                     <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Employee Signature</div>
//                     <div style={{ fontSize: '12px', marginTop: '5px', color: '#666' }}>Date: ________________</div>
//                 </div>
//                 <div style={{ textAlign: 'center', width: '300px' }}>
//                     <div style={{
//                         borderTop: '1px solid #000',
//                         marginBottom: '15px',
//                         height: '70px'
//                     }}></div>
//                     <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Employer Signature</div>
//                     <div style={{ fontSize: '12px', marginTop: '5px', color: '#666' }}>Date: ________________</div>
//                 </div>
//             </div>
//         </div>
//     );
// };
//
// const AdminSalarySlipManager = () => {
//     const dispatch = useDispatch<AppDispatch>();
//     const { theme, setTheme } = useTheme();
//     const users = useSelector(selectUsers) as UserData[];
//     const usersLoading = useSelector(selectUsersLoading);
//
//     const salarySlipResponse = useSelector(selectSalarySlip) as SalarySlipResponseData | SalarySlipResponseData['data'] | null;
//     const loading = useSelector(selectSalarySlipLoading);
//     const error = useSelector(selectSalarySlipError);
//
//     const [selectedMonth, setSelectedMonth] = useState<string>('');
//     const [selectedYear, setSelectedYear] = useState<string>('');
//     const [searchTerm, setSearchTerm] = useState('');
//     const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
//     const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
//     const [isSalarySlipModalOpen, setIsSalarySlipModalOpen] = useState(false);
//     const [isDownloading, setIsDownloading] = useState(false);
//     const [actionType, setActionType] = useState<'details' | 'generate' | null>(null);
//
//     const months = [
//         { value: "1", label: 'January' },
//         { value: "2", label: 'February' },
//         { value: "3", label: 'March' },
//         { value: "4", label: 'April' },
//         { value: "5", label: 'May' },
//         { value: "6", label: 'June' },
//         { value: "7", label: 'July' },
//         { value: "8", label: 'August' },
//         { value: "9", label: 'September' },
//         { value: "10", label: 'October' },
//         { value: "11", label: 'November' },
//         { value: "12", label: 'December' }
//     ];
//
//     const years = Array.from({ length: 5 }, (_, i) => {
//         const year = new Date().getFullYear() - i;
//         return { value: year.toString(), label: year.toString() };
//     });
//
//     useEffect(() => {
//         dispatch(fetchUsers());
//     }, [dispatch]);
//
//     const filteredUsers = users?.filter(user =>
//         user?.user_id?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         user?.user_id?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         user?.roleDefinitionId?.roleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         user?.departments?.some(dept =>
//             dept?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//             dept?.alias?.toLowerCase().includes(searchTerm.toLowerCase())
//         )
//     ) || [];
//
//     // Extract salary data from response
//     const salaryData: SalarySlipResponseData['data'] | null = React.useMemo(() => {
//         if (!salarySlipResponse) return null;
//
//         // Check if response has success property
//         if (typeof salarySlipResponse === 'object' && 'success' in salarySlipResponse) {
//             return salarySlipResponse.data;
//         }
//
//         // If response is already the data object
//         return salarySlipResponse as SalarySlipResponseData['data'];
//     }, [salarySlipResponse]);
//
//     const handleShowDetails = (user: UserData) => {
//         if (!selectedMonth || !selectedYear) {
//             alert('Please select month and year first');
//             return;
//         }
//
//         setSelectedUser(user);
//         setActionType('details');
//         dispatch(clearError());
//         dispatch(generateSalarySlipForUser({
//             userId: user.user_id._id,
//             month: parseInt(selectedMonth),
//             year: parseInt(selectedYear)
//         }));
//         setIsDetailsModalOpen(true);
//     };
//
//     const handleGenerateSalarySlip = (user: UserData) => {
//         if (!selectedMonth || !selectedYear) {
//             alert('Please select month and year first');
//             return;
//         }
//
//         setSelectedUser(user);
//         setActionType('generate');
//         dispatch(clearError());
//         dispatch(generateSalarySlipForUser({
//             userId: user.user_id._id,
//             month: parseInt(selectedMonth),
//             year: parseInt(selectedYear)
//         }));
//         setIsSalarySlipModalOpen(true);
//     };
//
//     // Enhanced PDF download function with proper page breaks
//     const downloadSalarySlip = async () => {
//         if (!salaryData || !selectedUser) return;
//
//         setIsDownloading(true);
//
//         try {
//             // Create a new iframe to completely isolate from main page CSS
//             const iframe = document.createElement('iframe');
//             iframe.style.position = 'absolute';
//             iframe.style.left = '-99999px';
//             iframe.style.top = '0';
//             iframe.style.width = '794px';
//             iframe.style.height = '1123px';
//             iframe.style.border = 'none';
//
//             document.body.appendChild(iframe);
//
//             // Wait for iframe to load
//             await new Promise((resolve) => {
//                 iframe.onload = resolve;
//                 iframe.src = 'about:blank';
//             });
//
//             const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
//             if (!iframeDoc) throw new Error('Cannot access iframe document');
//
//             // Generate HTML for PDF
//             const pdfHtml = `
//         <!DOCTYPE html>
//         <html>
//         <head>
//           <style>
//             * {
//               margin: 0;
//               padding: 0;
//               box-sizing: border-box;
//             }
//             body {
//               font-family: Arial, sans-serif;
//               background-color: white;
//               color: black;
//               width: 794px;
//               padding: 20px;
//             }
//             .salary-slip-container {
//               page-break-before: always;
//               page-break-inside: avoid;
//             }
//             table {
//               width: 100%;
//               border: 2px solid black;
//               border-collapse: collapse;
//               margin-bottom: 25px;
//               font-size: 13px;
//             }
//             td {
//               padding: 12px;
//               border: 1px solid black;
//               vertical-align: top;
//             }
//             .header {
//               text-align: center;
//               background-color: #f0f0f0;
//               font-weight: bold;
//               font-size: 18px;
//             }
//             .policy-section {
//               page-break-before: always;
//               margin-top: 30px;
//             }
//             .signature-section {
//               page-break-inside: avoid;
//             }
//           </style>
//         </head>
//         <body>
//           ${document.getElementById('salary-slip-pdf')?.innerHTML || ''}
//         </body>
//         </html>
//       `;
//
//             iframeDoc.open();
//             iframeDoc.write(pdfHtml);
//             iframeDoc.close();
//
//             // Wait for content to render
//             await new Promise(resolve => setTimeout(resolve, 1500));
//
//             // Generate PDF with proper page breaks
//             const pdf = new jsPDF('p', 'mm', 'a4');
//             const pageWidth = pdf.internal.pageSize.getWidth();
//             const pageHeight = pdf.internal.pageSize.getHeight();
//
//             // Get all elements that need to be captured
//             const elements = iframeDoc.querySelectorAll('.salary-slip-container, table, .policy-section, .signature-section');
//
//             let currentY = 0;
//
//             for (let i = 0; i < elements.length; i++) {
//                 const element = elements[i] as HTMLElement;
//
//                 // Create canvas for each section
//                 const canvas = await html2canvas(element, {
//                     scale: 1.5,
//                     useCORS: true,
//                     allowTaint: false,
//                     backgroundColor: '#ffffff',
//                     logging: false,
//                     width: element.offsetWidth,
//                     height: element.offsetHeight,
//                 });
//
//                 const imgData = canvas.toDataURL('image/png', 0.95);
//                 const imgHeight = (canvas.height * pageWidth) / canvas.width;
//
//                 // Check if we need a new page
//                 if (currentY + imgHeight > pageHeight - 20) {
//                     pdf.addPage();
//                     currentY = 0;
//                 }
//
//                 pdf.addImage(imgData, 'PNG', 0, currentY, pageWidth, imgHeight);
//                 currentY += imgHeight + 10;
//             }
//
//             // Download
//             const fileName = `payslip-${salaryData.employeeDetails.name.replace(/\s+/g, '-').toLowerCase()}-${salaryData.salaryPeriod.month}-${salaryData.salaryPeriod.year}.pdf`;
//             pdf.save(fileName);
//
//             // Clean up
//             document.body.removeChild(iframe);
//
//         } catch (error) {
//             console.error('Error generating PDF:', error);
//             alert('Error generating PDF. Please try again.');
//         } finally {
//             setIsDownloading(false);
//         }
//     };
//
//     const handleDetailsModalClose = () => {
//         setIsDetailsModalOpen(false);
//         setSelectedUser(null);
//         dispatch(clearSalarySlip());
//         setActionType(null);
//     };
//
//     const handleSalarySlipModalClose = () => {
//         setIsSalarySlipModalOpen(false);
//         dispatch(clearSalarySlip());
//         setSelectedUser(null);
//         setActionType(null);
//     };
//
//     const toggleTheme = () => {
//         setTheme(theme === 'dark' ? 'light' : 'dark');
//     };
//
//     return (
//         <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-3 sm:p-4 md:p-6">
//             <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
//                 {/* Header with Theme Toggle */}
//                 <div className="mb-4 sm:mb-6">
//                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
//                         <div>
//                             <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
//                                 <FileText className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-blue-600 dark:text-blue-400" />
//                                 Salary Slip Manager
//                             </h1>
//                             <p className="text-sm sm:text-base text-muted-foreground dark:text-gray-300">
//                                 Generate and manage salary slips for all employees - {filteredUsers.length} employees found
//                             </p>
//                         </div>
//                         <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={toggleTheme}
//                             className="w-fit"
//                         >
//                             {theme === 'dark' ? (
//                                 <>
//                                     <Sun className="w-4 h-4 mr-2" />
//                                     Light Mode
//                                 </>
//                             ) : (
//                                 <>
//                                     <Moon className="w-4 h-4 mr-2" />
//                                     Dark Mode
//                                 </>
//                             )}
//                         </Button>
//                     </div>
//                 </div>
//
//                 {/* Controls */}
//                 <Card className="shadow-lg border-2 border-blue-100 dark:border-blue-900">
//                     <CardHeader className="pb-3 sm:pb-4">
//                         <CardTitle className="text-lg sm:text-xl md:text-2xl dark:text-white">Filters & Controls</CardTitle>
//                         <CardDescription className="text-xs sm:text-sm dark:text-gray-300">
//                             Select month and year, then search and select an employee to view details or generate salary slip
//                         </CardDescription>
//                     </CardHeader>
//                     <CardContent className="space-y-3 sm:space-y-4">
//                         <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
//                             <div className="space-y-1 sm:space-y-2 w-full sm:w-40 md:w-48">
//                                 <Label htmlFor="filter-month" className="text-xs sm:text-sm dark:text-gray-300">Month</Label>
//                                 <Select value={selectedMonth} onValueChange={setSelectedMonth}>
//                                     <SelectTrigger id="filter-month" className="h-9 sm:h-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
//                                         <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
//                                         <SelectValue placeholder="Select Month" />
//                                     </SelectTrigger>
//                                     <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
//                                         {months.map((month) => (
//                                             <SelectItem key={month.value} value={month.value} className="dark:text-white dark:hover:bg-gray-700">
//                                                 {month.label}
//                                             </SelectItem>
//                                         ))}
//                                     </SelectContent>
//                                 </Select>
//                             </div>
//
//                             <div className="space-y-1 sm:space-y-2 w-full sm:w-28 md:w-32">
//                                 <Label htmlFor="filter-year" className="text-xs sm:text-sm dark:text-gray-300">Year</Label>
//                                 <Select value={selectedYear} onValueChange={setSelectedYear}>
//                                     <SelectTrigger id="filter-year" className="h-9 sm:h-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
//                                         <SelectValue placeholder="Year" />
//                                     </SelectTrigger>
//                                     <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
//                                         {years.map((year) => (
//                                             <SelectItem key={year.value} value={year.value} className="dark:text-white dark:hover:bg-gray-700">
//                                                 {year.label}
//                                             </SelectItem>
//                                         ))}
//                                     </SelectContent>
//                                 </Select>
//                             </div>
//
//                             <div className="space-y-1 sm:space-y-2 flex-1">
//                                 <Label htmlFor="search-users" className="text-xs sm:text-sm dark:text-gray-300">Search Employees</Label>
//                                 <div className="relative">
//                                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 sm:h-4 sm:w-4" />
//                                     <Input
//                                         id="search-users"
//                                         placeholder="Search by name, email, role, or department..."
//                                         value={searchTerm}
//                                         onChange={(e) => setSearchTerm(e.target.value)}
//                                         className="pl-8 sm:pl-10 h-9 sm:h-10 text-xs sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
//                                     />
//                                 </div>
//                             </div>
//
//                             <div className="flex items-end">
//                                 <Button
//                                     variant="outline"
//                                     onClick={() => dispatch(fetchUsers())}
//                                     disabled={usersLoading}
//                                     className="h-9 sm:h-10 w-full sm:w-auto text-xs sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
//                                 >
//                                     {usersLoading ? (
//                                         <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
//                                     ) : (
//                                         <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
//                                     )}
//                                     Refresh
//                                 </Button>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>
//
//                 {/* Error Display */}
//                 {error && (
//                     <Alert variant="destructive">
//                         <AlertCircle className="h-4 w-4" />
//                         <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
//                     </Alert>
//                 )}
//
//                 {/* Users Table */}
//                 <Card className="shadow-lg border-2 border-blue-100 dark:border-blue-900">
//                     <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b dark:border-gray-700 py-3 sm:py-4">
//                         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
//                             <div className="flex items-center gap-2 sm:gap-3">
//                                 <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
//                                 <div>
//                                     <CardTitle className="text-lg sm:text-xl md:text-2xl dark:text-white">Employee Directory</CardTitle>
//                                     <CardDescription className="text-xs sm:text-sm dark:text-gray-300">Select an employee to view details or generate salary slip</CardDescription>
//                                 </div>
//                             </div>
//
//                             <Badge variant="secondary" className="w-fit text-xs sm:text-sm dark:bg-gray-700 dark:text-gray-300">
//                                 {filteredUsers.length} employees
//                             </Badge>
//                         </div>
//                     </CardHeader>
//
//                     <CardContent className="p-0">
//                         {usersLoading ? (
//                             <div className="flex flex-col justify-center items-center py-8 sm:py-12">
//                                 <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600 dark:text-blue-400" />
//                                 <p className="mt-2 sm:mt-4 text-muted-foreground dark:text-gray-300 text-xs sm:text-sm">Loading employees...</p>
//                             </div>
//                         ) : filteredUsers.length === 0 ? (
//                             <div className="text-center py-8 sm:py-12">
//                                 <Users className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground dark:text-gray-500 mx-auto mb-3 sm:mb-4" />
//                                 <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2 dark:text-white">No employees found</h3>
//                                 <p className="text-muted-foreground dark:text-gray-400 text-xs sm:text-sm">
//                                     {searchTerm ? 'Try adjusting your search criteria' : 'No employees available'}
//                                 </p>
//                             </div>
//                         ) : (
//                             <ScrollArea className="h-[500px] sm:h-[600px]">
//                                 <Table>
//                                     <TableHeader className="sticky top-0 bg-background dark:bg-gray-800">
//                                         <TableRow className="dark:border-gray-700">
//                                             <TableHead className="text-xs sm:text-sm dark:text-gray-300">Employee</TableHead>
//                                             <TableHead className="text-xs sm:text-sm dark:text-gray-300">Role</TableHead>
//                                             <TableHead className="text-xs sm:text-sm hidden sm:table-cell dark:text-gray-300">Department</TableHead>
//                                             <TableHead className="text-xs sm:text-sm hidden md:table-cell dark:text-gray-300">Manager</TableHead>
//                                             <TableHead className="text-xs sm:text-sm dark:text-gray-300">Status</TableHead>
//                                             <TableHead className="text-right text-xs sm:text-sm dark:text-gray-300">Actions</TableHead>
//                                         </TableRow>
//                                     </TableHeader>
//                                     <TableBody>
//                                         {filteredUsers.map((user) => (
//                                             <TableRow key={user._id} className="hover:bg-muted/50 dark:hover:bg-gray-800/50 dark:border-gray-700">
//                                                 <TableCell>
//                                                     <div className="flex items-center gap-2 sm:gap-3">
//                                                         <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
//                                                             <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs sm:text-sm">
//                                                                 {user?.user_id?.name?.charAt(0) || 'U'}
//                                                             </AvatarFallback>
//                                                         </Avatar>
//                                                         <div className="min-w-0">
//                                                             <p className="font-medium text-xs sm:text-sm truncate dark:text-white">
//                                                                 {user?.user_id?.name || 'Unknown'}
//                                                             </p>
//                                                             <p className="text-xs text-muted-foreground dark:text-gray-400 truncate">{user?.user_id?.email || 'No email'}</p>
//                                                         </div>
//                                                     </div>
//                                                 </TableCell>
//
//                                                 <TableCell>
//                                                     <Badge variant="outline" className="text-xs dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
//                                                         {user?.roleDefinitionId?.roleName || 'Unknown'}
//                                                     </Badge>
//                                                 </TableCell>
//
//                                                 <TableCell className="hidden sm:table-cell">
//                                                     <div className="flex flex-col gap-1">
//                                                         {user?.departments?.slice(0, 2).map((dept) => (
//                                                             <Badge key={dept._id} variant="secondary" className="text-xs dark:bg-gray-700 dark:text-gray-300">
//                                                                 {dept.name}
//                                                             </Badge>
//                                                         ))}
//                                                         {user?.departments?.length > 2 && (
//                                                             <Badge variant="outline" className="text-xs dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
//                                                                 +{user.departments.length - 2} more
//                                                             </Badge>
//                                                         )}
//                                                     </div>
//                                                 </TableCell>
//
//                                                 <TableCell className="hidden md:table-cell">
//                           <span className="text-muted-foreground dark:text-gray-400 text-xs sm:text-sm truncate">
//                             {user?.parentRoleId?.user_id?.name || 'CEO'}
//                           </span>
//                                                 </TableCell>
//
//                                                 <TableCell>
//                                                     <Badge
//                                                         variant={user?.status === 'active' ? 'default' : 'secondary'}
//                                                         className="capitalize text-xs dark:bg-gray-700 dark:text-gray-300"
//                                                     >
//                                                         {user?.status || 'unknown'}
//                                                     </Badge>
//                                                 </TableCell>
//
//                                                 <TableCell className="text-right">
//                                                     <div className="flex flex-col sm:flex-row justify-end gap-1 sm:gap-2">
//                                                         {/* Show Details Button */}
//                                                         <Button
//                                                             size="sm"
//                                                             variant="outline"
//                                                             onClick={() => handleShowDetails(user)}
//                                                             className="flex items-center gap-1 h-7 sm:h-8 text-xs dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
//                                                             disabled={!selectedMonth || !selectedYear}
//                                                         >
//                                                             <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
//                                                             <span className="hidden xs:inline">Details</span>
//                                                         </Button>
//
//                                                         {/* Generate Salary Slip Button */}
//                                                         <Button
//                                                             size="sm"
//                                                             onClick={() => handleGenerateSalarySlip(user)}
//                                                             disabled={!selectedMonth || !selectedYear}
//                                                             className="flex items-center gap-1 h-7 sm:h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
//                                                         >
//                                                             <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
//                                                             <span className="hidden xs:inline">Generate</span>
//                                                         </Button>
//                                                     </div>
//                                                 </TableCell>
//                                             </TableRow>
//                                         ))}
//                                     </TableBody>
//                                 </Table>
//                             </ScrollArea>
//                         )}
//                     </CardContent>
//                 </Card>
//
//                 {/* Salary Slip Details Modal */}
//                 <Dialog open={isDetailsModalOpen} onOpenChange={handleDetailsModalClose}>
//                     <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] overflow-hidden sm:max-w-[90vw] sm:w-[90vw] lg:max-w-[85vw] lg:w-[85vw] p-3 sm:p-4 md:p-6 dark:bg-gray-900 dark:border-gray-700">
//                         <DialogHeader className="pb-3 sm:pb-4">
//                             <div className="flex justify-between items-center">
//                                 <DialogTitle className="text-lg sm:text-xl md:text-2xl flex items-center gap-2 dark:text-white">
//                                     <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
//                                     Salary Slip Details - {selectedUser?.user_id?.name}
//                                 </DialogTitle>
//                                 <Button
//                                     variant="ghost"
//                                     size="sm"
//                                     onClick={handleDetailsModalClose}
//                                     className="h-8 w-8 p-0 dark:text-gray-300 dark:hover:bg-gray-800"
//                                 >
//                                     <X className="h-4 w-4" />
//                                 </Button>
//                             </div>
//                         </DialogHeader>
//                         <ScrollArea className="max-h-[70vh] pr-3 sm:pr-4">
//                             {loading && actionType === 'details' ? (
//                                 <div className="flex flex-col justify-center items-center py-12 sm:py-16">
//                                     <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600 dark:text-blue-400" />
//                                     <p className="mt-2 sm:mt-4 text-muted-foreground dark:text-gray-300 text-xs sm:text-sm">Loading salary slip details...</p>
//                                 </div>
//                             ) : salaryData && selectedUser ? (
//                                 <SalarySlipDetails
//                                     salaryData={salaryData}
//                                     selectedUser={selectedUser}
//                                 />
//                             ) : (
//                                 <div className="text-center py-12 sm:py-16">
//                                     <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground dark:text-gray-500 mx-auto mb-3 sm:mb-4" />
//                                     <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2 dark:text-white">No salary slip details available</h3>
//                                     <p className="text-muted-foreground dark:text-gray-400 text-xs sm:text-sm">Unable to load salary slip details</p>
//                                 </div>
//                             )}
//                         </ScrollArea>
//                     </DialogContent>
//                 </Dialog>
//
//                 {/* Salary Slip PDF Modal */}
//                 <Dialog open={isSalarySlipModalOpen} onOpenChange={handleSalarySlipModalClose}>
//                     <DialogContent
//                         className="max-w-[95vw] w-[95vw] max-h-[90vh] overflow-hidden sm:max-w-[90vw] sm:w-[90vw] lg:max-w-[85vw] lg:w-[85vw] p-3 sm:p-4 md:p-6 dark:bg-gray-900 dark:border-gray-700"
//                     >
//                         <DialogHeader className="border-b pb-3 sm:pb-4 dark:border-gray-700">
//                             <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
//                                 <div className="min-w-0">
//                                     <div className="flex justify-between items-center mb-1 sm:mb-2">
//                                         <DialogTitle className="text-lg sm:text-xl md:text-2xl flex items-center gap-2 truncate dark:text-white">
//                                             <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
//                                             <span className="truncate">Salary Slip - {salaryData?.salaryPeriod.month} {salaryData?.salaryPeriod.year}</span>
//                                         </DialogTitle>
//                                         <Button
//                                             variant="ghost"
//                                             size="sm"
//                                             onClick={handleSalarySlipModalClose}
//                                             className="h-8 w-8 p-0 flex-shrink-0 ml-2 dark:text-gray-300 dark:hover:bg-gray-800"
//                                         >
//                                             <X className="h-4 w-4" />
//                                         </Button>
//                                     </div>
//                                     {selectedUser && salaryData && (
//                                         <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 truncate">
//                                             {salaryData.employeeDetails.name} - Employee Code: {salaryData.employeeDetails.employeeCode}
//                                         </p>
//                                     )}
//                                 </div>
//
//                                 <Button
//                                     variant="default"
//                                     onClick={downloadSalarySlip}
//                                     disabled={!salaryData || isDownloading}
//                                     className="shrink-0 w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
//                                     size="sm"
//                                 >
//                                     {isDownloading ? (
//                                         <>
//                                             <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
//                                             Generating...
//                                         </>
//                                     ) : (
//                                         <>
//                                             <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
//                                             Download PDF
//                                         </>
//                                     )}
//                                 </Button>
//                             </div>
//                         </DialogHeader>
//
//                         <ScrollArea className="max-h-[75vh] w-full">
//                             {loading && actionType === 'generate' ? (
//                                 <div className="flex flex-col justify-center items-center py-12 sm:py-16">
//                                     <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600 dark:text-blue-400" />
//                                     <p className="mt-2 sm:mt-4 text-muted-foreground dark:text-gray-300 text-xs sm:text-sm">Generating salary slip...</p>
//                                 </div>
//                             ) : salaryData && selectedUser ? (
//                                 <div className="p-3 sm:p-4 md:p-6">
//                                     <div className="w-full bg-white dark:bg-gray-800 border rounded-lg shadow-sm overflow-auto dark:border-gray-700">
//                                         <PdfSalarySlip
//                                             salaryData={salaryData}
//                                             selectedUser={selectedUser}
//                                         />
//                                     </div>
//                                 </div>
//                             ) : (
//                                 <div className="text-center py-12 sm:py-16 px-4">
//                                     <FileText className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-muted-foreground dark:text-gray-500 mx-auto mb-3 sm:mb-4" />
//                                     <h3 className="text-sm sm:text-base md:text-lg font-medium mb-1 sm:mb-2 dark:text-white">No salary slip generated</h3>
//                                     <p className="text-muted-foreground dark:text-gray-400 text-xs sm:text-sm">Select a month and year, then click on an employee to generate their salary slip</p>
//                                 </div>
//                             )}
//                         </ScrollArea>
//                     </DialogContent>
//                 </Dialog>
//             </div>
//         </div>
//     );
// };
//
// export default AdminSalarySlipManager;