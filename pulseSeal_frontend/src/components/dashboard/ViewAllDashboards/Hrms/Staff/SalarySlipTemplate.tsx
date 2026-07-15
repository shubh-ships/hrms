"use client"

import React from "react";
import { StaffData } from "./EmployeeProfile";

interface SalarySlipTemplateProps {
    staff: StaffData;
    month: string;
    year: string;
}

/**
 * SALARY SLIP TEMPLATE - PDF RENDERER
 * 
 * CRITICAL: This file MUST NOT use any Tailwind CSS classes.
 * Instead, it uses explicit inline styles with HEX codes.
 * This is because html2canvas (v1.4.1) crashes when it encounters modern 
 * CSS color functions (oklch, lab) introduced in Tailwind CSS 4.
 */
export const SalarySlipTemplate = ({ staff, month, year }: SalarySlipTemplateProps) => {
    // Definitive HEX color palette
    const colors = {
        white: "#FFFFFF",
        dark: "#1F2937",
        gray: "#4B5563",
        lightGray: "#9CA3AF",
        border: "#E5E7EB",
        bgLight: "#F9FAFB",
        bgHeader: "#F3F4F6",
        textGray: "#6B7280"
    };

    const s: { [key: string]: React.CSSProperties } = {
        container: {
            width: '800px',
            backgroundColor: colors.white,
            padding: '40px',
            fontFamily: 'Arial, sans-serif',
            color: colors.dark,
            display: 'block',
            margin: '0 auto',
            position: 'relative',
            boxSizing: 'border-box'
        },
        header: {
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '16px'
        },
        brand: {
            fontSize: '20px',
            fontWeight: 'bold',
            margin: 0
        },
        titleBox: {
            width: '100%',
            textAlign: 'center',
            marginTop: '8px'
        },
        title: {
            fontSize: '24px',
            fontWeight: 'bold',
            color: colors.gray,
            margin: 0
        },
        hr: {
            width: '100%',
            height: '1px',
            backgroundColor: colors.border,
            marginBottom: '24px',
            border: 'none'
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '48px',
            marginBottom: '32px',
            fontSize: '12px'
        },
        column: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
        },
        flexRow: {
            display: 'flex',
            justifyContent: 'space-between'
        },
        label: {
            fontWeight: 'bold',
            width: '50%'
        },
        value: {
            width: '50%',
            textTransform: 'uppercase'
        },
        statsRow: {
            backgroundColor: colors.bgLight,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            marginBottom: '32px',
            textAlign: 'center',
            fontSize: '11px'
        },
        statItem: {
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
        },
        statLabel: {
            color: colors.textGray
        },
        statValue: {
            fontWeight: 'bold',
            fontSize: '13px'
        },
        tablesContainer: {
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            display: 'flex',
            overflow: 'hidden',
            marginBottom: '48px',
            minHeight: '350px'
        },
        leftTable: {
            width: '60%',
            borderRight: `1px solid ${colors.border}`,
            display: 'flex',
            flexDirection: 'column'
        },
        rightTable: {
            width: '40%',
            display: 'flex',
            flexDirection: 'column'
        },
        tHeader: {
            backgroundColor: colors.bgHeader,
            padding: '8px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            fontWeight: 'bold',
            borderBottom: `1px solid ${colors.border}`
        },
        tRow: {
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            borderBottom: `1px solid ${colors.bgLight}`
        },
        tFooter: {
            backgroundColor: colors.white,
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            fontWeight: 'bold',
            marginTop: 'auto',
            borderTop: `1px solid ${colors.border}`
        },
        disclaimer: {
            padding: '32px 16px',
            fontSize: '10px',
            color: colors.lightGray,
            marginTop: 'auto',
            lineHeight: '1.4'
        },
        netPayBox: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
            borderTop: `1px solid ${colors.border}`,
            backgroundColor: colors.white
        },
        netPayLabel: {
            fontSize: '12px',
            color: colors.textGray,
            fontWeight: '500',
            marginBottom: '12px'
        },
        netPayVal: {
            fontSize: '32px',
            fontWeight: 'bold',
            color: colors.dark,
            marginBottom: '16px'
        },
        netPayWords: {
            fontSize: '11px',
            fontWeight: 'bold',
            color: colors.dark,
            textTransform: 'uppercase'
        }
    };

    return (
        <div id="salary-slip-pdf-content" style={s.container}>
            {/* Header */}
            <div style={s.header}>
                <h1 style={s.brand}>Delizia</h1>
                <div style={s.titleBox}>
                    <h2 style={s.title}>{month} {year}</h2>
                </div>
            </div>

            <div style={s.hr} />

            {/* Info Grid */}
            <div style={s.grid}>
                <div style={s.column}>
                    <div style={s.flexRow}><span style={s.label}>Employee Name:</span><span style={s.value}>{staff.name}</span></div>
                    <div style={s.flexRow}><span style={s.label}>Employee Id:</span><span style={s.value}>{staff.empId}</span></div>
                    <div style={s.flexRow}><span style={s.label}>Department:</span><span style={s.value}>{staff.department}</span></div>
                    <div style={s.flexRow}><span style={s.label}>Designation:</span><span style={s.value}>{staff.designation}</span></div>
                    <div style={s.flexRow}><span style={s.label}>Work Location:</span><span style={s.value}>Delizia</span></div>
                    <div style={s.flexRow}><span style={s.label}>Blood Group:</span><span style={s.value}>{staff.bloodGroup}</span></div>
                    <div style={s.flexRow}><span style={s.label}>Date Joined:</span><span style={s.value}>{staff.joiningDate}</span></div>
                </div>
                <div style={s.column}>
                    <div style={s.flexRow}><span style={s.label}>PAN Number:</span><span style={s.value}>{staff.panNumber || "-"}</span></div>
                    <div style={s.flexRow}><span style={s.label}>UAN:</span><span style={s.value}>{staff.uan || "-"}</span></div>
                    <div style={s.flexRow}><span style={s.label}>PF Number:</span><span style={s.value}>{staff.pfNumber || "-"}</span></div>
                    <div style={s.flexRow}><span style={s.label}>ESI Number:</span><span style={s.value}>{staff.esiNumber || "-"}</span></div>
                    <div style={s.flexRow}><span style={s.label}>Bank Account Number:</span><span style={s.value}>{staff.accountNumber || "-"}</span></div>
                    <div style={s.flexRow}><span style={s.label}>Bank Name:</span><span style={s.value}>{staff.bankName || "-"}</span></div>
                    <div style={s.flexRow}><span style={{...s.label, color: colors.lightGray}}>Payable Days:</span><span style={{...s.value, color: colors.lightGray}}>30 Days</span></div>
                </div>
            </div>

            {/* Attendance Stats Row */}
            <div style={s.statsRow}>
                <div style={s.statItem}><span style={s.statLabel}>Present Days</span><span style={s.statValue}>30</span></div>
                <div style={s.statItem}><span style={s.statLabel}>Absent Days</span><span style={s.statValue}>0</span></div>
                <div style={s.statItem}><span style={s.statLabel}>Half Days</span><span style={s.statValue}>0</span></div>
                <div style={s.statItem}><span style={s.statLabel}>Leaves</span><span style={s.statValue}>0</span></div>
                <div style={s.statItem}><span style={s.statLabel}>Hours Worked</span><span style={s.statValue}>240 Mins</span></div>
                <div style={s.statItem}><span style={s.statLabel}>OT Hours</span><span style={s.statValue}>0 Mins</span></div>
                <div style={s.statItem}><span style={{...s.statLabel, textTransform: 'uppercase'}}>Total Fine Hours</span><span style={s.statValue}>0:00 Hrs</span></div>
            </div>

            {/* Tables Area */}
            <div style={s.tablesContainer}>
                {/* Earnings */}
                <div style={s.leftTable}>
                    <div style={s.tHeader}>
                        <span style={{width: '50%'}}>Earnings</span>
                        <span style={{width: '25%', textAlign: 'center'}}>Full</span>
                        <span style={{width: '25%', textAlign: 'right'}}>Earned Wages</span>
                    </div>
                    <div style={s.tRow}><span style={{width: '50%'}}>Basic</span><span style={{width: '25%', textAlign: 'center'}}>45,000.00</span><span style={{width: '25%', textAlign: 'right', fontWeight: 'bold'}}>45,000.00</span></div>
                    <div style={s.tRow}><span style={{width: '50%'}}>HRA</span><span style={{width: '25%', textAlign: 'center'}}>5,000.00</span><span style={{width: '25%', textAlign: 'right', fontWeight: 'bold'}}>5,000.00</span></div>
                    
                    <div style={s.tFooter}>
                        <span style={{width: '50%'}}>Total</span>
                        <span style={{width: '25%', textAlign: 'center'}}>Fixed Gross 50,000.00</span>
                        <div style={{width: '25%', display: 'flex', justifyContent: 'space-between'}}>
                            <span style={{color: colors.gray}}>Total Earnings</span>
                            <span>50,000.00</span>
                        </div>
                    </div>
                    
                    <div style={s.disclaimer}>
                        Downloaded from PulseSeal at {new Date().toLocaleString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}. This is a digitally generated document<br />
                        and does not require signature or a seal.
                    </div>
                </div>

                {/* Deductions & Net Pay */}
                <div style={s.rightTable}>
                    <div style={s.tHeader}>Deductions</div>
                    <div style={s.tRow}><span>PF Contribution</span><span style={{fontWeight: 'bold'}}>1,800.00</span></div>
                    <div style={s.tRow}><span>ESI Contribution</span><span style={{fontWeight: 'bold'}}>200.00</span></div>
                    
                    <div style={s.tFooter}>
                        <span>Total Deductions</span>
                        <span>2,000.00</span>
                    </div>

                    <div style={s.netPayBox}>
                        <span style={s.netPayLabel}>Employee Net Pay (Earnings-Deductions)</span>
                        <div style={s.netPayVal}>₹ 48,000.00</div>
                        <span style={s.netPayWords}>Forty Eight Thousand Only</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
