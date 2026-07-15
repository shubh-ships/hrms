"use client";
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store';
import {
    generateSalarySlip,
    selectSalarySlip,
    selectSalarySlipLoading,
    selectSalarySlipError,
    clearSalarySlip,
    clearError
} from '@/features/salarySlip/salarySlip';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
    Download,
    Calendar,
    DollarSign,
    Clock,
    Users,
    TrendingUp,
    FileText,
    Building,
    MapPin,
    Phone,
    Mail,
    Loader2,
    AlertCircle,
    Trash2,
    Info,
    RefreshCw,
    AlertTriangle,
    Clock8,
    LogOut,
    Coffee,
    Calculator,
    Banknote
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Updated interface to match the new API response structure
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

// Type for the actual salary slip data (without the wrapper)
type SalarySlipData = SalarySlipResponseData['data'];

// Type for the selector response (could be wrapped or unwrapped)
type SalarySlipSelectorResponse =
    | SalarySlipResponseData
    | SalarySlipData
    | null
    | undefined;

// Daily Violation Details Component
const DailyViolationDetails = ({
                                   dailyDetails
                               }: {
    dailyDetails: SalarySlipResponseData['data']['policyDetails']['deductions']['dailyDetails']
}) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Filter days with violations
    const daysWithViolations = dailyDetails.filter(day =>
        day.lateEntry.deduction > 0 ||
        day.earlyLeave.deduction > 0 ||
        day.breaks.deduction > 0
    );

    if (daysWithViolations.length === 0) {
        return (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                No policy violations for this period
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h4 className="font-semibold text-lg mb-3 text-gray-700 dark:text-gray-300">
                Daily Violation Breakdown
            </h4>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                    <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                        <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                            Date
                        </th>
                        <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
                            Late Entry
                        </th>
                        <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
                            Early Leave
                        </th>
                        <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
                            Break Violation
                        </th>
                        <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right text-sm font-medium text-gray-600 dark:text-gray-300">
                            Total Deduction
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {daysWithViolations.map((day, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm dark:text-gray-300">
                                {formatDate(day.date)}
                            </td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center">
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
                                    <span className="text-gray-400 text-sm">-</span>
                                )}
                            </td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center">
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
                                    <span className="text-gray-400 text-sm">-</span>
                                )}
                            </td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-center">
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
                                    <span className="text-gray-400 text-sm">-</span>
                                )}
                            </td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right font-semibold text-sm dark:text-gray-300">
                                {formatCurrency(
                                    day.lateEntry.deduction +
                                    day.earlyLeave.deduction +
                                    day.breaks.deduction
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Showing {daysWithViolations.length} day(s) with policy violations
            </div>
        </div>
    );
};

// PDF Salary Slip Component for individual view
const PdfSalarySlip = ({
                           salaryData,
                           selectedMonth,
                           selectedYear,
                           months
                       }: {
    salaryData: SalarySlipData;
    selectedMonth: string;
    selectedYear: string;
    months: any[];
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
            <table style={{
                width: '100%',
                border: '2px solid #000',
                borderCollapse: 'collapse',
                marginBottom: '30px',
                fontSize: '13px'
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

            {/* Policy Deductions Breakdown */}
            <div style={{
                marginBottom: '25px',
                padding: '20px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                backgroundColor: '#f9f9f9',
                pageBreakInside: 'avoid'
            }}>
                <h4 style={{ margin: '0 0 15px 0', fontWeight: 'bold', fontSize: '16px' }}>Policy Deductions Breakdown:</h4>
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
            </div>

            {/* Daily Violation Details - Add this section */}
            <div style={{
                marginBottom: '25px',
                padding: '20px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                backgroundColor: '#f8f9fa'
            }}>
                <h4 style={{ margin: '0 0 15px 0', fontWeight: 'bold', fontSize: '16px' }}>Daily Violation Details:</h4>
                {salaryData.policyDetails.deductions.dailyDetails.filter(day =>
                    day.lateEntry.deduction > 0 ||
                    day.earlyLeave.deduction > 0 ||
                    day.breaks.deduction > 0
                ).length > 0 ? (
                    <>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '12px',
                            marginBottom: '10px'
                        }}>
                            <thead>
                            <tr style={{ backgroundColor: '#f0f0f0' }}>
                                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Date</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Late Entry</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Early Leave</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Break Violation</th>
                                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>Total Deduction</th>
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
                        <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
                            Total Days with Violations: {salaryData.policyDetails.deductions.dailyDetails.filter(day =>
                            day.lateEntry.deduction > 0 || day.earlyLeave.deduction > 0 || day.breaks.deduction > 0
                        ).length}
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px', fontSize: '14px', color: '#666' }}>
                        No daily violation details available
                    </div>
                )}
            </div>

            {/* Calculation Details */}
            <div style={{
                marginBottom: '25px',
                padding: '20px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                backgroundColor: '#f8f9fa',
                fontSize: '13px',
                pageBreakInside: 'avoid'
            }}>
                <h4 style={{ margin: '0 0 15px 0', fontWeight: 'bold', fontSize: '16px' }}>Calculation Details:</h4>
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
                    marginBottom: '25px',
                    padding: '20px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    backgroundColor: '#f9f9f9',
                    pageBreakInside: 'avoid'
                }}>
                    <h4 style={{ margin: '0 0 15px 0', fontWeight: 'bold', fontSize: '16px' }}>Bank Details:</h4>
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
                border: '1px solid #b3d9ff'
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
                border: '1px solid #ddd'
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
    );
};

// Salary Details Component for Modal View (if needed)
const SalaryDetails = ({ salaryData }: { salaryData: SalarySlipData }) => {
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
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Employee Information</h3>
                        <div className="mt-2 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Name:</span>
                                <span className="font-medium">{salaryData.employeeDetails.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Employee Code:</span>
                                <span className="font-medium">{salaryData.employeeDetails.employeeCode}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Work Type:</span>
                                <span className="font-medium">{salaryData.employeeDetails.workType}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Attendance Summary</h3>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400">Total Working Days</div>
                                <div className="text-xl font-bold text-blue-700 dark:text-blue-400">{salaryData.attendanceSummary.totalWorkingDays}</div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400">Present Days</div>
                                <div className="text-xl font-bold text-green-700 dark:text-green-400">{salaryData.attendanceSummary.presentDays}</div>
                            </div>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400">Paid Leaves</div>
                                <div className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{salaryData.attendanceSummary.paidLeaves}</div>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400">Unpaid Leaves</div>
                                <div className="text-xl font-bold text-red-700 dark:text-red-400">{salaryData.attendanceSummary.unpaidLeaves}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Salary Period</h3>
                        <div className="mt-2 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Month:</span>
                                <span className="font-medium">{salaryData.salaryPeriod.month} {salaryData.salaryPeriod.year}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">From:</span>
                                <span className="font-medium">{formatDate(salaryData.salaryPeriod.fromDate)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">To:</span>
                                <span className="font-medium">{formatDate(salaryData.salaryPeriod.toDate)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Per Day Rate:</span>
                                <span className="font-medium">{formatCurrency(salaryData.calculation.perDayRate)}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Policy Violations</h3>
                        <div className="mt-2 grid grid-cols-3 gap-4">
                            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg text-center">
                                <Clock8 className="w-8 h-8 mx-auto text-orange-600 dark:text-orange-400 mb-1" />
                                <div className="text-lg font-bold text-orange-700 dark:text-orange-400">{policyStats.lateEntries}</div>
                                <div className="text-sm text-orange-600 dark:text-orange-400">Late Entries</div>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-center">
                                <LogOut className="w-8 h-8 mx-auto text-red-600 dark:text-red-400 mb-1" />
                                <div className="text-lg font-bold text-red-700 dark:text-red-400">{policyStats.earlyLeaves}</div>
                                <div className="text-sm text-red-600 dark:text-red-400">Early Leaves</div>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
                                <Coffee className="w-8 h-8 mx-auto text-purple-600 dark:text-purple-400 mb-1" />
                                <div className="text-lg font-bold text-purple-700 dark:text-purple-400">{policyStats.breakViolations}</div>
                                <div className="text-sm text-purple-600 dark:text-purple-400">Break Violations</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Earnings</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div>
                                <div className="font-medium">Basic Salary</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Base salary component</div>
                            </div>
                            <div className="font-bold text-green-700 dark:text-green-400">{formatCurrency(salaryData.earnings.basic)}</div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div>
                                <div className="font-medium">HRA</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">House Rent Allowance</div>
                            </div>
                            <div className="font-bold text-green-700 dark:text-green-400">{formatCurrency(salaryData.earnings.hra)}</div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div>
                                <div className="font-medium">Other Allowances</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Additional allowances</div>
                            </div>
                            <div className="font-bold text-green-700 dark:text-green-400">{formatCurrency(salaryData.earnings.allowances)}</div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div>
                                <div className="font-medium">Overtime Pay</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Extra hours worked</div>
                            </div>
                            <div className="font-bold text-green-700 dark:text-green-400">{formatCurrency(salaryData.earnings.overtimePay)}</div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-100 dark:bg-green-900/40 rounded-lg border-2 border-green-300 dark:border-green-700">
                            <div className="font-bold text-green-900 dark:text-green-300">Total Earnings</div>
                            <div className="font-bold text-green-900 dark:text-green-300 text-lg">{formatCurrency(salaryData.earnings.totalEarnings)}</div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Deductions</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <div>
                                <div className="font-medium">Salary Deduction</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{salaryData.attendanceSummary.unpaidLeaves} unpaid leave(s)</div>
                            </div>
                            <div className="font-bold text-red-700 dark:text-red-400">{formatCurrency(salaryData.deductions.salaryDeduction)}</div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <div>
                                <div className="font-medium">Policy Deductions</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Policy violations & penalties</div>
                            </div>
                            <div className="font-bold text-red-700 dark:text-red-400">{formatCurrency(salaryData.deductions.policyDeductions)}</div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <div>
                                <div className="font-medium">Other Deductions</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Miscellaneous deductions</div>
                            </div>
                            <div className="font-bold text-red-700 dark:text-red-400">{formatCurrency(salaryData.deductions.otherDeductions)}</div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-100 dark:bg-red-900/40 rounded-lg border-2 border-red-300 dark:border-red-700">
                            <div className="font-bold text-red-900 dark:text-red-300">Total Deductions</div>
                            <div className="font-bold text-red-900 dark:text-red-300 text-lg">{formatCurrency(salaryData.deductions.totalDeductions)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white rounded-xl p-6 mb-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                    <DollarSign className="w-6 h-6" />
                    Salary Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                        <div className="text-blue-200 text-sm font-semibold mb-2">Gross Salary</div>
                        <div className="text-2xl font-extrabold">{formatCurrency(salaryData.earnings.totalEarnings)}</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                        <div className="text-blue-200 text-sm font-semibold mb-2">Total Deductions</div>
                        <div className="text-2xl font-extrabold">{formatCurrency(salaryData.deductions.totalDeductions)}</div>
                    </div>
                    <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4 border-2 border-green-400">
                        <div className="text-green-200 text-sm font-semibold mb-2">Net Salary</div>
                        <div className="text-3xl font-extrabold text-green-300">{formatCurrency(salaryData.netSalary)}</div>
                    </div>
                </div>
            </div>

            {/* Daily Violation Details Section - Added here */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
                <DailyViolationDetails dailyDetails={salaryData.policyDetails.deductions.dailyDetails} />
            </div>
        </div>
    );
};

const MySalarySlip = () => {
    const dispatch = useDispatch<AppDispatch>();

    // Normalize selector response to accommodate different payload wrappers
    const salarySlipResponse: SalarySlipSelectorResponse = useSelector(selectSalarySlip);

    // Extract salary data from response
    const salaryData: SalarySlipData | null = React.useMemo(() => {
        if (!salarySlipResponse) return null;

        // Check if response has success property (new API format)
        if (typeof salarySlipResponse === 'object' && 'success' in salarySlipResponse) {
            return (salarySlipResponse as SalarySlipResponseData).data;
        }

        // If response is already the data object
        if (typeof salarySlipResponse === 'object' && 'employeeDetails' in salarySlipResponse) {
            return salarySlipResponse as SalarySlipData;
        }

        // Legacy format handling
        if (salarySlipResponse && typeof salarySlipResponse === 'object' && 'data' in salarySlipResponse) {
            return (salarySlipResponse as any).data;
        }

        return null;
    }, [salarySlipResponse]);

    const loading = useSelector(selectSalarySlipLoading);
    const error = useSelector(selectSalarySlipError);

    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [isDownloading, setIsDownloading] = useState(false);

    // Check for specific error types
    const isWorkingDaysError = error && (
        error.includes('Total working days not found') ||
        error.includes('working days') ||
        error.includes('Working days')
    );

    const isShiftError = error && error.includes('Shift not found');
    const isEmployeeError = error && error.includes('Employee not found');
    const isSalaryError = error && error.includes('salary not found');

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

    const handleGenerateSlip = () => {
        if (!selectedMonth || !selectedYear) return;

        dispatch(clearError());
        dispatch(generateSalarySlip({
            month: parseInt(selectedMonth),
            year: parseInt(selectedYear)
        }));
    };

    const handleRetry = () => {
        if (selectedMonth && selectedYear) {
            dispatch(clearError());
            dispatch(generateSalarySlip({
                month: parseInt(selectedMonth),
                year: parseInt(selectedYear)
            }));
        }
    };

    // Enhanced PDF download function with iframe isolation
    const downloadSalarySlip = async () => {
        if (!salaryData) return;

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

            // Write completely isolated HTML
            iframeDoc.open();
            iframeDoc.write(`
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
            table {
              width: 100%;
              border: 2px solid black;
              border-collapse: collapse;
              margin-bottom: 25px;
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
            .company-info {
              text-align: center;
              padding: 20px;
            }
            .company-name {
              font-weight: bold;
              font-size: 24px;
              margin-bottom: 10px;
            }
            .section-header {
              padding: 12px;
              font-weight: bold;
              text-align: center;
              background-color: #f0f0f0;
              font-size: 14px;
            }
            .amount-col {
              width: 150px;
            }
            .text-right {
              text-align: right;
              font-weight: bold;
            }
            .policy-breakdown {
              margin-bottom: 25px;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 5px;
              background-color: #f9f9f9;
              page-break-inside: avoid;
            }
            .summary-title {
              margin: 0 0 15px 0;
              font-weight: bold;
              font-size: 16px;
            }
            .policy-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 20px;
              font-size: 13px;
              margin-bottom: 25px;
            }
            .calculation-details {
              margin-bottom: 25px;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 5px;
              background-color: #f8f9fa;
              font-size: 13px;
              page-break-inside: avoid;
            }
            .bank-details {
              margin-bottom: 25px;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 5px;
              background-color: #f9f9f9;
              page-break-inside: avoid;
            }
            .net-pay-display {
              text-align: center;
              margin-bottom: 30px;
              font-size: 18px;
              font-weight: bold;
              padding: 15px;
              background-color: #f0f8ff;
              border-radius: 5px;
              border: 1px solid #b3d9ff;
            }
            .amount-words {
              text-align: center;
              margin-bottom: 40px;
              font-size: 14px;
              padding: 15px;
              background-color: #f9f9f9;
              border-radius: 5px;
              border: 1px solid #ddd;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
              padding-top: 25px;
              border-top: 2px solid #000;
              page-break-inside: avoid;
            }
            .signature-box {
              text-align: center;
              width: 300px;
            }
            .signature-line {
              border-top: 1px solid #000;
              margin-bottom: 15px;
              height: 70px;
            }
            .signature-label {
              font-size: 14px;
              font-weight: bold;
            }
            .attendance-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr 1fr;
              gap: 12px;
              font-size: 12px;
            }
            .daily-violations {
              margin-bottom: 25px;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 5px;
              background-color: #f8f9fa;
            }
          </style>
        </head>
        <body>
          <table>
            <tbody>
              <tr>
                <td colspan="2" class="header">Payslip - ${salaryData.salaryPeriod.month} ${salaryData.salaryPeriod.year}</td>
              </tr>
              <tr>
                <td colspan="2" class="company-info">
                  <div class="company-name">PulseSeal</div>
                  <div style="font-size: 14px; margin: 5px 0; font-weight: 600;">Salary Period: ${new Date(salaryData.salaryPeriod.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} to ${new Date(salaryData.salaryPeriod.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  <div style="font-size: 12px; margin: 5px 0; color: #666;">Generated: ${new Date(salaryData.generatedAt).toLocaleString('en-IN')}</div>
                </td>
              </tr>
              <tr>
                <td style="width: 50%;">
                  <div style="margin-bottom: 12px;"><span style="font-weight: bold; font-size: 14px;">Employee Name:</span><br/><span style="font-size: 14px;">${salaryData.employeeDetails.name}</span></div>
                  <div style="margin-bottom: 12px;"><span style="font-weight: bold; font-size: 14px;">Employee Code:</span><br/><span style="font-size: 14px;">${salaryData.employeeDetails.employeeCode}</span></div>
                  <div style="margin-bottom: 12px;"><span style="font-weight: bold; font-size: 14px;">Employee ID:</span><br/><span style="font-size: 12px; font-family: monospace;">${salaryData.employeeDetails.employeeId}</span></div>
                  <div><span style="font-weight: bold; font-size: 14px;">Work Type:</span><br/><span style="font-size: 14px;">${salaryData.employeeDetails.workType}</span></div>
                </td>
                <td style="width: 50%;">
                  <div style="margin-bottom: 12px;"><span style="font-weight: bold; font-size: 14px;">Join Date:</span><br/><span style="font-size: 14px;">${new Date(salaryData.employeeDetails.joinDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
                  <div><span style="font-weight: bold; font-size: 14px;">Per Day Rate:</span><br/><span style="font-size: 14px;">₹${salaryData.calculation.perDayRate.toFixed(2)}</span></div>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 15px; border: 1px solid #000; background-color: #f8f9fa;">
                  <div style="font-weight: bold; margin-bottom: 10px; font-size: 14px;">Attendance Summary</div>
                  <div class="attendance-grid">
                    <div>
                      <div style="font-weight: 600;">Total Working Days</div>
                      <div>${salaryData.attendanceSummary.totalWorkingDays}</div>
                    </div>
                    <div>
                      <div style="font-weight: 600;">Present Days</div>
                      <div>${salaryData.attendanceSummary.presentDays}</div>
                    </div>
                    <div>
                      <div style="font-weight: 600;">Paid Leaves</div>
                      <div>${salaryData.attendanceSummary.paidLeaves}</div>
                    </div>
                    <div>
                      <div style="font-weight: 600;">Unpaid Leaves</div>
                      <div>${salaryData.attendanceSummary.unpaidLeaves}</div>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td class="section-header">Earnings</td>
                <td class="section-header amount-col">Amount</td>
              </tr>
              <tr>
                <td>
                  <div style="font-weight: 500; font-size: 13px;">Basic Salary</div>
                  <div style="font-size: 11px; color: #666; margin-top: 4px;">Base salary component</div>
                </td>
                <td class="text-right">₹${salaryData.earnings.basic.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td>
                  <div style="font-weight: 500; font-size: 13px;">HRA (House Rent Allowance)</div>
                  <div style="font-size: 11px; color: #666; margin-top: 4px;">Housing allowance</div>
                </td>
                <td class="text-right">₹${salaryData.earnings.hra.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td>
                  <div style="font-weight: 500; font-size: 13px;">Other Allowances</div>
                  <div style="font-size: 11px; color: #666; margin-top: 4px;">Additional allowances</div>
                </td>
                <td class="text-right">₹${salaryData.earnings.allowances.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td>
                  <div style="font-weight: 500; font-size: 13px;">Overtime Pay</div>
                  <div style="font-size: 11px; color: #666; margin-top: 4px;">Extra hours worked</div>
                </td>
                <td class="text-right">₹${salaryData.earnings.overtimePay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td class="text-right section-header">Total Earnings</td>
                <td class="text-right section-header">₹${salaryData.earnings.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td class="section-header">Deductions</td>
                <td class="section-header">Amount</td>
              </tr>
              <tr>
                <td>
                  <div style="font-weight: 500; font-size: 13px;">Salary Deduction (Unpaid Leaves)</div>
                  <div style="font-size: 11px; color: #666; margin-top: 4px;">${salaryData.attendanceSummary.unpaidLeaves} unpaid leave(s)</div>
                </td>
                <td class="text-right">₹${salaryData.deductions.salaryDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td>
                  <div style="font-weight: 500; font-size: 13px;">Policy Deductions</div>
                  <div style="font-size: 11px; color: #666; margin-top: 4px;">Policy violations & penalties</div>
                </td>
                <td class="text-right">₹${salaryData.deductions.policyDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td>
                  <div style="font-weight: 500; font-size: 13px;">Other Deductions</div>
                  <div style="font-size: 11px; color: #666; margin-top: 4px;">Miscellaneous deductions</div>
                </td>
                <td class="text-right">₹${salaryData.deductions.otherDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td class="text-right section-header">Total Deductions</td>
                <td class="text-right section-header">₹${salaryData.deductions.totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td class="text-right section-header">Net Pay</td>
                <td class="text-right section-header">₹${salaryData.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="policy-breakdown">
            <h4 class="summary-title">Policy Deductions Breakdown:</h4>
            <div class="policy-grid">
              <div style="text-align: center; padding: 15px; background-color: #fff3cd; border-radius: 6px; border: 1px solid #ffeaa7;">
                <div style="font-weight: 600; color: #856404; font-size: 14px;">Late Entry</div>
                <div style="font-size: 16px; font-weight: bold; color: #856404; margin: 10px 0;">₹${salaryData.policyDetails.deductions.summary.lateEntryDeductions.toFixed(2)}</div>
                <div style="font-size: 12px; color: #856404;">${salaryData.policyDetails.deductions.dailyDetails.filter(day => day.lateEntry.deduction > 0).length} violation(s)</div>
              </div>
              <div style="text-align: center; padding: 15px; background-color: #f8d7da; border-radius: 6px; border: 1px solid #f5c6cb;">
                <div style="font-weight: 600; color: #721c24; font-size: 14px;">Early Leave</div>
                <div style="font-size: 16px; font-weight: bold; color: #721c24; margin: 10px 0;">₹${salaryData.policyDetails.deductions.summary.earlyLeaveDeductions.toFixed(2)}</div>
                <div style="font-size: 12px; color: #721c24;">${salaryData.policyDetails.deductions.dailyDetails.filter(day => day.earlyLeave.deduction > 0).length} violation(s)</div>
              </div>
              <div style="text-align: center; padding: 15px; background-color: #e2d9f3; border-radius: 6px; border: 1px solid #d6c6e9;">
                <div style="font-weight: 600; color: #4a3c6e; font-size: 14px;">Break Violation</div>
                <div style="font-size: 16px; font-weight: bold; color: #4a3c6e; margin: 10px 0;">₹${salaryData.policyDetails.deductions.summary.breakDeductions.toFixed(2)}</div>
                <div style="font-size: 12px; color: #4a3c6e;">${salaryData.policyDetails.deductions.dailyDetails.filter(day => day.breaks.deduction > 0).length} violation(s)</div>
              </div>
            </div>
          </div>
          
          <div class="daily-violations">
            <h4 class="summary-title">Daily Violation Details:</h4>
            ${salaryData.policyDetails.deductions.dailyDetails.filter(day =>
                day.lateEntry.deduction > 0 ||
                day.earlyLeave.deduction > 0 ||
                day.breaks.deduction > 0
            ).length > 0 ? `
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 10px;">
                <thead>
                  <tr style="background-color: #f0f0f0;">
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Date</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Late Entry</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Early Leave</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Break Violation</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Total Deduction</th>
                  </tr>
                </thead>
                <tbody>
                  ${salaryData.policyDetails.deductions.dailyDetails
                .filter(day => day.lateEntry.deduction > 0 || day.earlyLeave.deduction > 0 || day.breaks.deduction > 0)
                .map((day, index) => `
                      <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px; border: 1px solid #ddd;">${new Date(day.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                          ${day.lateEntry.deduction > 0 ? `
                            <div>
                              <div style="font-weight: 600; color: #856404;">₹${day.lateEntry.deduction.toFixed(2)}</div>
                              <div style="font-size: 11px; color: #666;">${day.lateEntry.violationMinutes} min</div>
                            </div>
                          ` : '-'}
                        </td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                          ${day.earlyLeave.deduction > 0 ? `
                            <div>
                              <div style="font-weight: 600; color: #721c24;">₹${day.earlyLeave.deduction.toFixed(2)}</div>
                              <div style="font-size: 11px; color: #666;">${day.earlyLeave.violationMinutes} min</div>
                            </div>
                          ` : '-'}
                        </td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                          ${day.breaks.deduction > 0 ? `
                            <div>
                              <div style="font-weight: 600; color: #4a3c6e;">₹${day.breaks.deduction.toFixed(2)}</div>
                              <div style="font-size: 11px; color: #666;">${day.breaks.violationMinutes} min</div>
                            </div>
                          ` : '-'}
                        </td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: 600;">
                          ₹${(day.lateEntry.deduction + day.earlyLeave.deduction + day.breaks.deduction).toFixed(2)}
                        </td>
                      </tr>
                    `).join('')}
                </tbody>
              </table>
              <div style="font-size: 12px; color: #666; text-align: center;">
                Total Days with Violations: ${salaryData.policyDetails.deductions.dailyDetails.filter(day =>
                day.lateEntry.deduction > 0 || day.earlyLeave.deduction > 0 || day.breaks.deduction > 0
            ).length}
              </div>
            ` : `
              <div style="text-align: center; padding: 20px; font-size: 14px; color: #666;">
                No daily violation details available
              </div>
            `}
          </div>
          
          <div class="calculation-details">
            <h4 class="summary-title">Calculation Details:</h4>
            <div style="margin-bottom: 15px;"><strong>Per Day Rate Formula:</strong> ${salaryData.calculation.perDayFormula}</div>
            <div style="margin-bottom: 15px;"><strong>Working Days Formula:</strong> ${salaryData.calculation.workingDaysFormula}</div>
            <div><strong>Calculation Notes:</strong> ${salaryData.calculationNotes}</div>
          </div>
          
          ${salaryData.bankDetails ? `
            <div class="bank-details">
              <h4 class="summary-title">Bank Details:</h4>
              <div style="font-size: 13px; line-height: 1.8;">
                <div><strong>Account Holder:</strong> ${salaryData.bankDetails.accountHolderName}</div>
                <div><strong>Account Number:</strong> ${salaryData.bankDetails.accountNumber}</div>
                <div><strong>IFSC Code:</strong> ${salaryData.bankDetails.ifsc}</div>
                <div><strong>Bank:</strong> ${salaryData.bankDetails.bankName}</div>
              </div>
            </div>
          ` : ''}
          
          <div class="net-pay-display">
            Net Pay: ₹${Math.round(salaryData.netSalary).toLocaleString('en-IN')}
          </div>
          
          <div class="signatures">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Employee Signature</div>
              <div style="font-size: 12px; margin-top: 5px; color: #666;">Date: ________________</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Employer Signature</div>
              <div style="font-size: 12px; margin-top: 5px; color: #666;">Date: ________________</div>
            </div>
          </div>
        </body>
        </html>
      `);
            iframeDoc.close();

            // Wait for content to render
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Generate canvas from iframe body
            const canvas = await html2canvas(iframeDoc.body, {
                scale: 1.5,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                logging: false,
                width: 794,
                height: iframeDoc.body.scrollHeight,
            });

            // Generate PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png', 0.95);

            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
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

    const handleClearSlip = () => {
        dispatch(clearSalarySlip());
        dispatch(clearError());
        setSelectedMonth('');
        setSelectedYear('');
    };

    return (
        <div className="min-h-screen dark:bg-[#101828] bg-gray-50 p-4">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header Controls */}
                <div className="mb-6">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                        <FileText className="w-10 h-10 text-blue-600" />
                        My Salary Slip
                    </h1>
                    <p className="text-muted-foreground dark:text-gray-300">
                        Generate and view your monthly salary statement
                    </p>
                </div>

                <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="dark:text-white">Generate Salary Slip</CardTitle>
                        <CardDescription className="dark:text-gray-300">
                            Select month and year to generate your salary slip
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="space-y-2 flex-1">
                                <Label htmlFor="month" className="dark:text-gray-300">Month</Label>
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger id="month" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        <SelectValue placeholder="Select Month" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                                        {months.map((month) => (
                                            <SelectItem key={month.value} value={month.value} className="dark:text-white dark:hover:bg-gray-600">
                                                {month.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 flex-1">
                                <Label htmlFor="year" className="dark:text-gray-300">Year</Label>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger id="year" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                                        {years.map((year) => (
                                            <SelectItem key={year.value} value={year.value} className="dark:text-white dark:hover:bg-gray-600">
                                                {year.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-end gap-2">
                                <Button
                                    onClick={handleGenerateSlip}
                                    disabled={!selectedMonth || !selectedYear || loading}
                                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="w-4 h-4 mr-2" />
                                            Generate Slip
                                        </>
                                    )}
                                </Button>

                                {salaryData && (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={downloadSalarySlip}
                                            disabled={isDownloading}
                                            className="w-full md:w-auto dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                                        >
                                            {isDownloading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Downloading...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download PDF
                                                </>
                                            )}
                                        </Button>

                                        <Button
                                            variant="outline"
                                            onClick={handleClearSlip}
                                            className="w-full md:w-auto dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Clear
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Enhanced Error Display with specific handling */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <div className="space-y-3">
                                {isWorkingDaysError && (
                                    <>
                                        <div>
                                            <p className="font-semibold text-red-800 dark:text-red-300">Working Days Configuration Missing</p>
                                            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                                                The salary slip cannot be generated because working days are not configured for{' '}
                                                <strong>{months.find(m => m.value === selectedMonth)?.label} {selectedYear}</strong>.
                                            </p>
                                        </div>
                                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                                            <p className="text-sm font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2">
                                                <Info className="w-4 h-4" />
                                                What you can do:
                                            </p>
                                            <ul className="text-sm text-blue-700 dark:text-blue-400 mt-2 space-y-1 ml-6">
                                                <li>• Contact your HR administrator to set up working days for this month</li>
                                                <li>• Try a different month that has working days configured</li>
                                                <li>• Check if the organization payroll settings are complete</li>
                                            </ul>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleRetry}
                                                disabled={loading}
                                                className="text-xs dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                                            >
                                                <RefreshCw className="w-3 h-3 mr-1" />
                                                Retry
                                            </Button>
                                        </div>
                                    </>
                                )}

                                {isShiftError && (
                                    <>
                                        <div>
                                            <p className="font-semibold text-red-800 dark:text-red-300">Shift Configuration Missing</p>
                                            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                                                Your shift details are not properly configured. Please contact HR to assign your shift.
                                            </p>
                                        </div>
                                    </>
                                )}

                                {isEmployeeError && (
                                    <>
                                        <div>
                                            <p className="font-semibold text-red-800 dark:text-red-300">Employee Profile Not Found</p>
                                            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                                                Your employee profile could not be found. Please contact your administrator.
                                            </p>
                                        </div>
                                    </>
                                )}

                                {isSalaryError && (
                                    <>
                                        <div>
                                            <p className="font-semibold text-red-800 dark:text-red-300">Salary Configuration Missing</p>
                                            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                                                Your salary structure is not configured. Please contact HR to set up your salary details.
                                            </p>
                                        </div>
                                    </>
                                )}

                                {!isWorkingDaysError && !isShiftError && !isEmployeeError && !isSalaryError && (
                                    <>
                                        <div>
                                            <p className="font-semibold text-red-800 dark:text-red-300">Error Generating Salary Slip</p>
                                            <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleRetry}
                                                disabled={loading}
                                                className="text-xs dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                                            >
                                                <RefreshCw className="w-3 h-3 mr-1" />
                                                Try Again
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Salary Details Preview */}
                {salaryData && (
                    <Card className="shadow-2xl border-0 print:shadow-none dark:bg-gray-800 dark:border-gray-700">
                        <CardContent className="p-0">
                            {/* Salary Summary Banner */}
                            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-6 rounded-t-lg">
                                <div className="flex flex-col md:flex-row justify-between items-center">
                                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                                        <Avatar className="w-16 h-16 border-4 border-white/30">
                                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl font-bold">
                                                {salaryData.employeeDetails.name?.charAt(0) || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h2 className="text-2xl font-bold">{salaryData.employeeDetails.name}</h2>
                                            <p className="text-blue-200">{salaryData.employeeDetails.employeeCode} • {salaryData.salaryPeriod.month} {salaryData.salaryPeriod.year}</p>
                                        </div>
                                    </div>
                                    <div className="text-center md:text-right">
                                        <div className="text-3xl md:text-4xl font-bold text-green-300">
                                            ₹{salaryData.netSalary.toLocaleString('en-IN')}
                                        </div>
                                        <p className="text-blue-200 mt-1">Net Take Home Salary</p>
                                    </div>
                                </div>
                            </div>

                            {/* Salary Details Grid */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-5 rounded-xl">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-blue-600 rounded-lg">
                                                <TrendingUp className="w-6 h-6 text-white" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">Total Earnings</h3>
                                        </div>
                                        <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                                            ₹{salaryData.earnings.totalEarnings.toLocaleString('en-IN')}
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 p-5 rounded-xl">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-red-600 rounded-lg">
                                                <TrendingUp className="w-6 h-6 text-white" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Total Deductions</h3>
                                        </div>
                                        <div className="text-3xl font-bold text-red-700 dark:text-red-400">
                                            ₹{salaryData.deductions.totalDeductions.toLocaleString('en-IN')}
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-5 rounded-xl border-2 border-green-300 dark:border-green-700">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-green-600 rounded-lg">
                                                <DollarSign className="w-6 h-6 text-white" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">Net Salary</h3>
                                        </div>
                                        <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                                            ₹{salaryData.netSalary.toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                </div>

                                {/* Attendance & Policy Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-blue-600" />
                                            Attendance Summary
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                                <div className="text-sm text-gray-600 dark:text-gray-400">Working Days</div>
                                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{salaryData.attendanceSummary.totalWorkingDays}</div>
                                            </div>
                                            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                                <div className="text-sm text-gray-600 dark:text-gray-400">Present Days</div>
                                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{salaryData.attendanceSummary.presentDays}</div>
                                            </div>
                                            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                                <div className="text-sm text-gray-600 dark:text-gray-400">Paid Leaves</div>
                                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{salaryData.attendanceSummary.paidLeaves}</div>
                                            </div>
                                            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                                <div className="text-sm text-gray-600 dark:text-gray-400">Unpaid Leaves</div>
                                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{salaryData.attendanceSummary.unpaidLeaves}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                                            Policy Violations
                                        </h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center border border-orange-200 dark:border-orange-800">
                                                <Clock8 className="w-8 h-8 mx-auto text-orange-600 dark:text-orange-400 mb-2" />
                                                <div className="text-lg font-bold text-orange-700 dark:text-orange-400">
                                                    {salaryData.policyDetails.deductions.dailyDetails.filter(day => day.lateEntry.deduction > 0).length}
                                                </div>
                                                <div className="text-sm text-orange-600 dark:text-orange-400">Late Entries</div>
                                            </div>
                                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center border border-red-200 dark:border-red-800">
                                                <LogOut className="w-8 h-8 mx-auto text-red-600 dark:text-red-400 mb-2" />
                                                <div className="text-lg font-bold text-red-700 dark:text-red-400">
                                                    {salaryData.policyDetails.deductions.dailyDetails.filter(day => day.earlyLeave.deduction > 0).length}
                                                </div>
                                                <div className="text-sm text-red-600 dark:text-red-400">Early Leaves</div>
                                            </div>
                                            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center border border-purple-200 dark:border-purple-800">
                                                <Coffee className="w-8 h-8 mx-auto text-purple-600 dark:text-purple-400 mb-2" />
                                                <div className="text-lg font-bold text-purple-700 dark:text-purple-400">
                                                    {salaryData.policyDetails.deductions.dailyDetails.filter(day => day.breaks.deduction > 0).length}
                                                </div>
                                                <div className="text-sm text-purple-600 dark:text-purple-400">Break Violations</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Daily Violation Details Section - Added here */}
                                <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                                    <DailyViolationDetails dailyDetails={salaryData.policyDetails.deductions.dailyDetails} />
                                </div>

                                {/* PDF Preview Section */}
                                <div className="mt-8 border-t pt-6 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">PDF Preview</h3>
                                    <div className="w-full bg-white dark:bg-gray-900 border rounded-lg shadow-sm overflow-auto">
                                        <PdfSalarySlip
                                            salaryData={salaryData}
                                            selectedMonth={selectedMonth}
                                            selectedYear={selectedYear}
                                            months={months}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default MySalarySlip;