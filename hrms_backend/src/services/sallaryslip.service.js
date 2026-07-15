import moment from "moment";
import Employee from "../models/employee.Model.js";
import { Office } from "../models/organizationTiming.Model.js";
import TotalWorkingDays from "../models/workingDays.Model.js";
import DailyAttendance from "../models/dailyscanAttendance.js";
import { Holiday } from "../models/holidays.Model.js";
import { Leave } from "../models/leave.Model.js";
import Policy from "../models/policy.Model.js";
import { LeavePolicy } from "../models/leavePolicy.Model.js";

// Helper function to convert month number to name for querying TotalWorkingDays
const getMonthName = (monthNumber) => {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return monthNames[monthNumber - 1];
};

// Calculate date range for the month
const getMonthDateRange = (month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

// Helper function to calculate policy-based deductions with corrected half day/full day occurrence logic
const calculatePolicyDeductions = async (
  employeeId,
  organizationId,
  month,
  year,
  attendanceRecords,
  perDayRate,
) => {
  try {
    // Get all active policies for the organization
    const policies = await Policy.find({
      organizationId: organizationId,
      isActive: true,
      name: { $in: ["late_entry", "early_leave", "breaks"] },
    });

    // Get employee to fetch shift details
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      console.log("Employee not found");
      return { totalDeductions: 0, policyDetails: [] };
    }

    const shift = await Office.findOne({ organizationId: organizationId }).then(
      (office) => {
        if (!office || !office.shifts) return null;
        return office.shifts.find(
          (s) => s._id.toString() === employee.shiftId?.toString(),
        );
      },
    );

    if (!shift) {
      console.log("Shift not found for employee");
      return { totalDeductions: 0, policyDetails: [] };
    }

    let totalPolicyDeductions = 0;
    const policyDetails = [];

    // Separate policies by type
    const lateEntryPolicy = policies.find((p) => p.name === "late_entry");
    const earlyLeavePolicy = policies.find((p) => p.name === "early_leave");
    const breaksPolicy = policies.find((p) => p.name === "breaks");

    // Counters for occurrence tracking
    const occurrenceCounters = {
      late_entry: {},
      early_leave: {},
      breaks: {},
    };

    // Trackers for hours-based occurrence (total minutes per rule)
    const totalViolationMinutes = {
      late_entry: {},
      early_leave: {},
      breaks: {},
    };

    // Helper function to convert hours and minutes to total minutes
    const convertToMinutes = (hours = 0, minutes = 0) => {
      return hours * 60 + minutes;
    };

    const processPolicyForDay = (
      policy,
      policyName,
      violationMinutes,
      recordDate,
      perDayRate,
      thresholdField = "lateMinutesThreshold",
      hoursField = "lateHoursThreshold",
    ) => {
      if (!policy || !policy.penliteRules || violationMinutes <= 0) {
        return { deduction: 0, ruleApplied: null, occurrenceCount: 0 };
      }

      const activeRules = policy.penliteRules.filter((rule) => rule.isActive);

      for (const rule of activeRules) {
        // DIFFERENT THRESHOLD LOGIC FOR DIFFERENT RULE TYPES
        let ruleApplies = false;
        let applicableDeduction = null;
        let deductionLevel = null;

        if (rule.ruleType === "salary_deduction") {
          // For salary deduction: Check if ANY deduction threshold is met
          if (rule.deductions && rule.deductions.length > 0) {
            // Sort deductions by threshold in descending order
            const sortedDeductions = [...rule.deductions].sort((a, b) => {
              const aMinutes = convertToMinutes(a.lateHours, a.lateMinutes);
              const bMinutes = convertToMinutes(b.lateHours, b.lateMinutes);
              return bMinutes - aMinutes;
            });

            // Find the applicable deduction (highest threshold <= violationMinutes)
            for (const deduction of sortedDeductions) {
              const deductionThreshold = convertToMinutes(
                deduction.lateHours,
                deduction.lateMinutes,
              );
              if (violationMinutes >= deductionThreshold) {
                applicableDeduction = deduction;
                deductionLevel = deductionThreshold; // Use threshold as level identifier
                break;
              }
            }

            ruleApplies = applicableDeduction !== null;
          }
        } else {
          // For half_day_deduct and full_day_deduct: Use the threshold field
          const thresholdHours = rule[hoursField] || 0;
          const thresholdMinutes = rule[thresholdField] || 0;
          const totalThresholdMinutes = convertToMinutes(
            thresholdHours,
            thresholdMinutes,
          );

          ruleApplies = violationMinutes >= totalThresholdMinutes;
          deductionLevel = totalThresholdMinutes; // For consistency
        }

        if (ruleApplies) {
          // For salary deduction: Create unique key based on deduction level
          let ruleKey;
          if (rule.ruleType === "salary_deduction" && applicableDeduction) {
            // Use ruleId + deduction threshold as key for separate tracking per level
            const deductionThreshold = convertToMinutes(
              applicableDeduction.lateHours,
              applicableDeduction.lateMinutes,
            );
            ruleKey = `${rule._id.toString()}_${deductionThreshold}`;
          } else {
            // For half/full day: Just use ruleId
            ruleKey = rule._id.toString();
          }

          // Initialize counter for this rule if not exists
          if (!occurrenceCounters[policyName][ruleKey]) {
            occurrenceCounters[policyName][ruleKey] = {
              count: 0,
              appliedCount: 0,
              lastAppliedDate: null,
              deductionLevel: deductionLevel,
              ruleType: rule.ruleType,
              ruleName: rule.ruleName,
              applicableDeduction: applicableDeduction,
            };
          }

          // Initialize total violation minutes tracker for hours-based occurrence
          if (!totalViolationMinutes[policyName][ruleKey]) {
            totalViolationMinutes[policyName][ruleKey] = {
              totalMinutes: 0,
              deductionApplied: false,
            };
          }

          // Increment counter for this specific deduction level
          occurrenceCounters[policyName][ruleKey].count++;
          const currentCount = occurrenceCounters[policyName][ruleKey].count;

          // Add to total violation minutes for hours-based occurrence
          totalViolationMinutes[policyName][ruleKey].totalMinutes +=
            violationMinutes;

          // DEBUG: Log current state
          console.log(
            `[DEBUG] Processing ${policyName} rule: ${rule.ruleName}`,
          );
          console.log(`  Rule Type: ${rule.ruleType}`);

          // Show threshold details
          if (rule.ruleType === "salary_deduction" && applicableDeduction) {
            const hours = applicableDeduction.lateHours || 0;
            const minutes = applicableDeduction.lateMinutes || 0;
            console.log(
              `  Deduction Level: ${
                hours > 0 ? hours + "h " : ""
              }${minutes}min (${deductionLevel} total minutes)`,
            );
          } else {
            const thresholdHours = rule[hoursField] || 0;
            const thresholdMinutes = rule[thresholdField] || 0;
            console.log(
              `  Threshold: ${
                thresholdHours > 0 ? thresholdHours + "h " : ""
              }${thresholdMinutes}min (${deductionLevel} total minutes)`,
            );
          }

          console.log(`  Current Count for this level: ${currentCount}`);
          console.log(`  Violation Minutes: ${violationMinutes}`);
          console.log(
            `  Total Minutes for this rule: ${totalViolationMinutes[policyName][ruleKey].totalMinutes}`,
          );

          // Check if deduction should be applied based on occurrence
          let shouldApplyDeduction = false;
          let isOccurrenceRule = false;
          let occurrenceValue = 0;
          let occurrenceType = "none";

          // Handle different occurrence types
          if (rule.occurrence && rule.occurrence.isActive) {
            if (rule.occurrence.count > 0) {
              // COUNT-BASED OCCURRENCE (existing logic)
              occurrenceValue = rule.occurrence.count;
              occurrenceType = "count";
              isOccurrenceRule = true;

              console.log(
                `  Occurrence Type: Count, Value: ${occurrenceValue}`,
              );

              if (
                rule.ruleType === "half_day_deduct" ||
                rule.ruleType === "full_day_deduct"
              ) {
                shouldApplyDeduction = currentCount % occurrenceValue === 0;
              } else if (rule.ruleType === "salary_deduction") {
                shouldApplyDeduction = currentCount >= occurrenceValue;
              }
            } else if (rule.occurrence.hours > 0) {
              // HOURS-BASED OCCURRENCE (corrected logic)
              const hoursValue = rule.occurrence.hours;
              occurrenceValue = hoursValue * 60; // Convert to minutes
              occurrenceType = "hours";
              isOccurrenceRule = true;

              console.log(
                `  Occurrence Type: Hours, Value: ${hoursValue} hours (${occurrenceValue} minutes)`,
              );

              const totalMinutes =
                totalViolationMinutes[policyName][ruleKey].totalMinutes;
              console.log(`  Total Minutes: ${totalMinutes}`);

              if (
                rule.ruleType === "half_day_deduct" ||
                rule.ruleType === "full_day_deduct"
              ) {
                // Calculate current multiple of hours threshold
                const currentMultiple = Math.floor(
                  totalMinutes / occurrenceValue,
                );
                const previousMultiple =
                  totalViolationMinutes[policyName][ruleKey].lastMultiple || 0;

                // Deduct each time we reach a new multiple
                shouldApplyDeduction = currentMultiple > previousMultiple;

                console.log(
                  `  Current multiple: ${currentMultiple}, Previous: ${previousMultiple}, Apply: ${shouldApplyDeduction}`,
                );

                if (shouldApplyDeduction) {
                  totalViolationMinutes[policyName][ruleKey].lastMultiple =
                    currentMultiple;
                }
              } else if (rule.ruleType === "salary_deduction") {
                // For salary deduction: apply to every violation after reaching threshold
                shouldApplyDeduction = totalMinutes >= occurrenceValue;

                if (
                  totalMinutes >= occurrenceValue &&
                  !totalViolationMinutes[policyName][ruleKey].deductionApplied
                ) {
                  totalViolationMinutes[policyName][ruleKey].deductionApplied =
                    true;
                }
              }
            }
          } else {
            // If occurrence is not active, apply to every violation
            shouldApplyDeduction = true;
            console.log(`  No Occurrence Rule: Apply to every violation`);
          }

          if (shouldApplyDeduction) {
            let deductionAmount = 0;
            let ruleApplied = rule.ruleName;

            if (rule.ruleType === "half_day_deduct") {
              deductionAmount = perDayRate / 2;
              if (occurrenceType === "count") {
                ruleApplied += ` (Half Day - ${currentCount}th violation)`;
              } else if (occurrenceType === "hours") {
                ruleApplied += ` (Half Day - Total ${Math.floor(
                  totalViolationMinutes[policyName][ruleKey].totalMinutes / 60,
                )}h ${
                  totalViolationMinutes[policyName][ruleKey].totalMinutes % 60
                }min late)`;
              }
              occurrenceCounters[policyName][ruleKey].appliedCount++;
            } else if (rule.ruleType === "full_day_deduct") {
              deductionAmount = perDayRate;
              if (occurrenceType === "count") {
                ruleApplied += ` (Full Day - ${currentCount}th violation)`;
              } else if (occurrenceType === "hours") {
                ruleApplied += ` (Full Day - Total ${Math.floor(
                  totalViolationMinutes[policyName][ruleKey].totalMinutes / 60,
                )}h ${
                  totalViolationMinutes[policyName][ruleKey].totalMinutes % 60
                }min late)`;
              }
              occurrenceCounters[policyName][ruleKey].appliedCount++;
            } else if (
              rule.ruleType === "salary_deduction" &&
              applicableDeduction
            ) {
              const hours = applicableDeduction.lateHours || 0;
              const minutes = applicableDeduction.lateMinutes || 0;
              const thresholdDisplay =
                hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;

              if (applicableDeduction.deductionType === "fixed") {
                deductionAmount = applicableDeduction.amount;
                if (occurrenceType === "count") {
                  ruleApplied += ` (Threshold: ${thresholdDisplay} - Fixed ₹${applicableDeduction.amount} - ${currentCount}th violation)`;
                } else if (occurrenceType === "hours") {
                  ruleApplied += ` (Threshold: ${thresholdDisplay} - Fixed ₹${
                    applicableDeduction.amount
                  } - Total ${Math.floor(
                    totalViolationMinutes[policyName][ruleKey].totalMinutes /
                      60,
                  )}h ${
                    totalViolationMinutes[policyName][ruleKey].totalMinutes % 60
                  }min late)`;
                }
              } else if (applicableDeduction.deductionType === "multiplier") {
                deductionAmount = perDayRate * applicableDeduction.amount;
                if (occurrenceType === "count") {
                  ruleApplied += ` (Threshold: ${thresholdDisplay} - Multiplier ${applicableDeduction.amount}x - ${currentCount}th violation)`;
                } else if (occurrenceType === "hours") {
                  ruleApplied += ` (Threshold: ${thresholdDisplay} - Multiplier ${
                    applicableDeduction.amount
                  }x - Total ${Math.floor(
                    totalViolationMinutes[policyName][ruleKey].totalMinutes /
                      60,
                  )}h ${
                    totalViolationMinutes[policyName][ruleKey].totalMinutes % 60
                  }min late)`;
                }
              }
              occurrenceCounters[policyName][ruleKey].appliedCount++;
            }

            console.log(
              `  APPLYING DEDUCTION: ${deductionAmount} for rule: ${ruleApplied}`,
            );
            return {
              deduction: deductionAmount,
              ruleApplied,
              occurrenceCount: currentCount,
              totalMinutes:
                totalViolationMinutes[policyName][ruleKey].totalMinutes,
              deductionLevel: deductionLevel,
              isOccurrenceRule,
              occurrenceType,
              occurrenceValue:
                rule.occurrence?.count || rule.occurrence?.hours || 0,
            };
          }

          // No deduction this time (before reaching occurrence threshold)
          const thresholdHours = rule[hoursField] || 0;
          const thresholdMinutes = rule[thresholdField] || 0;
          const thresholdDisplay =
            thresholdHours > 0
              ? `${thresholdHours}h ${thresholdMinutes}min`
              : `${thresholdMinutes}min`;

          if (occurrenceType === "count") {
            console.log(
              `  NO DEDUCTION for Threshold ${thresholdDisplay}: count=${currentCount}, need ${
                rule.occurrence?.count || "N/A"
              } violations`,
            );
          } else if (occurrenceType === "hours") {
            console.log(
              `  NO DEDUCTION for Threshold ${thresholdDisplay}: total minutes=${
                totalViolationMinutes[policyName][ruleKey].totalMinutes
              }, need ${
                rule.occurrence?.hours || "N/A"
              } hours (${occurrenceValue} minutes)`,
            );
          } else {
            console.log(`  NO DEDUCTION: No occurrence rule configured`);
          }

          return {
            deduction: 0,
            ruleApplied: null,
            occurrenceCount: currentCount,
            totalMinutes:
              totalViolationMinutes[policyName][ruleKey].totalMinutes,
            deductionLevel: deductionLevel,
            isOccurrenceRule,
            occurrenceType,
            occurrenceValue:
              rule.occurrence?.count || rule.occurrence?.hours || 0,
          };
        }
      }

      return {
        deduction: 0,
        ruleApplied: null,
        occurrenceCount: 0,
        totalMinutes: 0,
        deductionLevel: null,
        isOccurrenceRule: false,
        occurrenceType: "none",
        occurrenceValue: 0,
      };
    };

    const sortedRecords = [...attendanceRecords].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );

    // Process each attendance record in chronological order
    for (const record of sortedRecords) {
      const dailyDetails = {
        date: record.date,
        lateEntry: {
          deduction: 0,
          ruleApplied: null,
          violationMinutes: record.lateLoginMinutes || 0,
          occurrenceCount: 0,
          totalMinutes: 0,
          isOccurrenceRule: false,
          occurrenceType: "none",
          occurrenceValue: 0,
        },
        earlyLeave: {
          deduction: 0,
          ruleApplied: null,
          violationMinutes: record.earlyLogoutMinutes || 0,
          occurrenceCount: 0,
          totalMinutes: 0,
          isOccurrenceRule: false,
          occurrenceType: "none",
          occurrenceValue: 0,
        },
        breaks: {
          deduction: 0,
          ruleApplied: null,
          violationMinutes: 0,
          occurrenceCount: 0,
          totalMinutes: 0,
          isOccurrenceRule: false,
          occurrenceType: "none",
          occurrenceValue: 0,
        },
      };

      // 1. Late Entry Deductions
      if (record.isLateLogin && record.lateLoginMinutes > 0) {
        const result = processPolicyForDay(
          lateEntryPolicy,
          "late_entry",
          record.lateLoginMinutes,
          record.date,
          perDayRate,
          "lateMinutesThreshold",
          "lateHoursThreshold", // Added hours field
        );

        dailyDetails.lateEntry = {
          ...dailyDetails.lateEntry,
          deduction: result.deduction,
          ruleApplied: result.ruleApplied,
          occurrenceCount: result.occurrenceCount,
          totalMinutes: result.totalMinutes,
          isOccurrenceRule: result.isOccurrenceRule,
          occurrenceType: result.occurrenceType,
          occurrenceValue: result.occurrenceValue,
        };
        totalPolicyDeductions += result.deduction;
      }

      // 2. Early Leave Deductions
      if (record.isEarlyLogout && record.earlyLogoutMinutes > 0) {
        const result = processPolicyForDay(
          earlyLeavePolicy,
          "early_leave",
          record.earlyLogoutMinutes,
          record.date,
          perDayRate,
          "lateMinutesThreshold",
          "lateHoursThreshold", // Added hours field
        );

        dailyDetails.earlyLeave = {
          ...dailyDetails.earlyLeave,
          deduction: result.deduction,
          ruleApplied: result.ruleApplied,
          occurrenceCount: result.occurrenceCount,
          totalMinutes: result.totalMinutes,
          isOccurrenceRule: result.isOccurrenceRule,
          occurrenceType: result.occurrenceType,
          occurrenceValue: result.occurrenceValue,
        };
        totalPolicyDeductions += result.deduction;
      }

      // 3. Break Time Deductions
      if (record.totalBreakMinutes > 0 && shift && shift.breaks) {
        // Calculate allowed break minutes
        const allowedBreakMinutes = shift.breaks.reduce((total, br) => {
          const start = moment(br.startTime, "HH:mm");
          const end = moment(br.endTime, "HH:mm");
          return total + moment.duration(end.diff(start)).asMinutes();
        }, 0);

        const excessBreakMinutes = Math.max(
          0,
          record.totalBreakMinutes - allowedBreakMinutes,
        );

        if (excessBreakMinutes > 0) {
          const result = processPolicyForDay(
            breaksPolicy,
            "breaks",
            excessBreakMinutes,
            record.date,
            perDayRate,
            "lateMinutesThreshold",
            "lateHoursThreshold", // Added hours field
          );

          dailyDetails.breaks = {
            deduction: result.deduction,
            ruleApplied: result.ruleApplied,
            violationMinutes: excessBreakMinutes,
            occurrenceCount: result.occurrenceCount,
            totalMinutes: result.totalMinutes,
            isOccurrenceRule: result.isOccurrenceRule,
            occurrenceType: result.occurrenceType,
            occurrenceValue: result.occurrenceValue,
          };
          totalPolicyDeductions += result.deduction;
        }
      }

      // Add to details
      policyDetails.push(dailyDetails);
    }

    return {
      totalPolicyDeductions,
      policyDetails,
      occurrenceCounters,
      totalViolationMinutes, // Added for debugging
    };
  } catch (error) {
    console.error("Error calculating policy deductions:", error);
    return {
      totalPolicyDeductions: 0,
      policyDetails: [],
      occurrenceCounters: {},
      totalViolationMinutes: {},
    };
  }
};

// Function to calculate overtime pay with corrected occurrence logic
const calculateOvertimePay = async (
  employeeId,
  organizationId,
  month,
  year,
  attendanceRecords,
  perDayRate,
) => {
  try {
    // Get overtime policies
    const policies = await Policy.find({
      organizationId: organizationId,
      isActive: true,
      name: { $in: ["overtime", "early_overtime"] },
    });

    // Get employee to fetch shift details
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return { totalOvertimePay: 0, overtimeDetails: [] };
    }

    const shift = await Office.findOne({ organizationId: organizationId }).then(
      (office) => {
        if (!office || !office.shifts) return null;
        return office.shifts.find(
          (s) => s._id.toString() === employee.shiftId?.toString(),
        );
      },
    );

    if (!shift) {
      return { totalOvertimePay: 0, overtimeDetails: [] };
    }

    let totalOvertimePay = 0;
    const overtimeDetails = [];

    // Separate policies by type
    const overtimePolicy = policies.find((p) => p.name === "overtime");
    const earlyOvertimePolicy = policies.find(
      (p) => p.name === "early_overtime",
    );

    // Counters for occurrence tracking
    const occurrenceCounters = {
      overtime: {},
      early_overtime: {},
    };

    // Helper function to process overtime
    // Helper function to process overtime with hours support
    const processOvertimeForDay = (
      policy,
      policyName,
      overtimeMinutes,
      recordDate,
      perDayRate,
    ) => {
      if (!policy || !policy.overtimeRules || overtimeMinutes <= 0) {
        return {
          pay: 0,
          ruleApplied: null,
          occurrenceCount: 0,
          isAfterOccurrence: false,
        };
      }

      const activeRules = policy.overtimeRules.filter((rule) => rule.isActive);

      for (const rule of activeRules) {
        // Check if rule applies based on threshold (hours + minutes)
        const thresholdHours = rule.hoursThreshold || 0;
        const thresholdMinutes = rule.minutesThreshold || 0;
        const totalThresholdMinutes = convertToMinutes(
          thresholdHours,
          thresholdMinutes,
        );

        if (overtimeMinutes >= totalThresholdMinutes) {
          // Initialize counter for this rule if not exists
          const ruleKey = rule._id.toString();
          if (!occurrenceCounters[policyName][ruleKey]) {
            occurrenceCounters[policyName][ruleKey] = {
              count: 0,
              appliedCount: 0,
              lastAppliedDate: null,
              thresholdMinutes: totalThresholdMinutes,
            };
          }

          // Increment counter
          occurrenceCounters[policyName][ruleKey].count++;
          const currentCount = occurrenceCounters[policyName][ruleKey].count;

          // Check if pay should be applied based on occurrence
          let shouldApplyPay = false;

          if (
            rule.occurrence &&
            rule.occurrence.isActive &&
            rule.occurrence.count > 0
          ) {
            const occurrenceValue = rule.occurrence.count;

            // CORRECTED LOGIC for overtime:
            // After reaching the occurrence threshold, pay for EVERY occurrence
            shouldApplyPay = currentCount >= occurrenceValue;
          } else {
            // If occurrence is not active, apply to every occurrence
            shouldApplyPay = true;
          }

          if (shouldApplyPay) {
            let payAmount = 0;
            let ruleApplied = rule.ruleName;

            if (rule.ruleType === "half_day_pay") {
              payAmount = perDayRate / 2;
              ruleApplied += ` (Half Day Pay)`;
              occurrenceCounters[policyName][ruleKey].appliedCount++;
            } else if (rule.ruleType === "full_day_pay") {
              payAmount = perDayRate;
              ruleApplied += ` (Full Day Pay)`;
              occurrenceCounters[policyName][ruleKey].appliedCount++;
            } else if (
              rule.ruleType === "salary_pay" &&
              rule.overtimePay &&
              rule.overtimePay.length > 0
            ) {
              // Find the applicable overtime pay from the array
              let applicableOvertime = null;

              // Sort by total minutes in descending order
              for (const overtime of rule.overtimePay.sort((a, b) => {
                const aMinutes = convertToMinutes(a.hours, a.minutes);
                const bMinutes = convertToMinutes(b.hours, b.minutes);
                return bMinutes - aMinutes;
              })) {
                const overtimeThreshold = convertToMinutes(
                  overtime.hours,
                  overtime.minutes,
                );
                if (overtimeMinutes >= overtimeThreshold) {
                  applicableOvertime = overtime;
                  break;
                }
              }

              if (applicableOvertime) {
                if (applicableOvertime.overtimeType === "fixed") {
                  payAmount = applicableOvertime.amount;
                  ruleApplied += ` (Fixed: ${applicableOvertime.amount})`;
                } else if (applicableOvertime.overtimeType === "multiplier") {
                  payAmount = perDayRate * applicableOvertime.amount;
                  ruleApplied += ` (Multiplier: ${applicableOvertime.amount}x)`;
                } else if (
                  applicableOvertime.overtimeType === "fixed_per_hour"
                ) {
                  const overtimeHours = overtimeMinutes / 60;
                  payAmount = overtimeHours * applicableOvertime.amount;
                  ruleApplied += ` (${overtimeHours.toFixed(2)} hrs x ${
                    applicableOvertime.amount
                  }/hr)`;
                }
                occurrenceCounters[policyName][ruleKey].appliedCount++;
              }
            }

            return {
              pay: payAmount,
              ruleApplied,
              occurrenceCount: currentCount,
              isAfterOccurrence: true,
            };
          }

          return {
            pay: 0,
            ruleApplied: null,
            occurrenceCount: currentCount,
            isAfterOccurrence: false,
          };
        }
      }

      return {
        pay: 0,
        ruleApplied: null,
        occurrenceCount: 0,
        isAfterOccurrence: false,
      };
    };

    // Sort attendance records by date
    const sortedRecords = [...attendanceRecords].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );

    // Process each attendance record
    for (const record of sortedRecords) {
      const dailyDetails = {
        date: record.date,
        overtime: {
          pay: 0,
          ruleApplied: null,
          overtimeMinutes: record.totalOvertimeMinutes || 0,
          occurrenceCount: 0,
          isAfterOccurrence: false,
        },
        earlyOvertime: {
          pay: 0,
          ruleApplied: null,
          overtimeMinutes: 0,
          occurrenceCount: 0,
          isAfterOccurrence: false,
        },
      };

      // 1. Regular Overtime (after shift)
      if (record.isOvertime && record.totalOvertimeMinutes > 0) {
        const result = processOvertimeForDay(
          overtimePolicy,
          "overtime",
          record.totalOvertimeMinutes,
          record.date,
          perDayRate,
        );

        dailyDetails.overtime = {
          pay: result.pay,
          ruleApplied: result.ruleApplied,
          overtimeMinutes: record.totalOvertimeMinutes,
          occurrenceCount: result.occurrenceCount,
          isAfterOccurrence: result.isAfterOccurrence,
        };
        totalOvertimePay += result.pay;
      }

      // 2. Early Overtime (before shift)
      if (record.scans && record.scans.length > 0 && earlyOvertimePolicy) {
        // Find first IN scan
        const firstInScan = record.scans.find((s) => s.type === "IN");
        if (firstInScan && shift) {
          const scanTime = moment(firstInScan.scanTime);
          const shiftStart = moment(shift.startTime, "HH:mm");

          // Calculate early minutes (if scan is before shift start)
          const earlyMinutes = Math.max(
            0,
            moment.duration(shiftStart.diff(scanTime)).asMinutes(),
          );

          if (earlyMinutes > 0) {
            // Check if early overtime applies
            const earlyOTThreshold = earlyOvertimePolicy.earlyOTMinutes || 0;

            if (earlyMinutes >= earlyOTThreshold) {
              const result = processOvertimeForDay(
                earlyOvertimePolicy,
                "early_overtime",
                earlyMinutes,
                record.date,
                perDayRate,
              );

              dailyDetails.earlyOvertime = {
                pay: result.pay,
                ruleApplied: result.ruleApplied,
                overtimeMinutes: earlyMinutes,
                occurrenceCount: result.occurrenceCount,
                isAfterOccurrence: result.isAfterOccurrence,
              };
              totalOvertimePay += result.pay;
            }
          }
        }
      }

      // Add to details if any overtime pay occurred or tracking needed
      if (
        dailyDetails.overtime.pay > 0 ||
        dailyDetails.earlyOvertime.pay > 0 ||
        dailyDetails.overtime.overtimeMinutes > 0 ||
        dailyDetails.earlyOvertime.overtimeMinutes > 0
      ) {
        overtimeDetails.push(dailyDetails);
      }
    }

    return {
      totalOvertimePay,
      overtimeDetails,
      occurrenceCounters,
    };
  } catch (error) {
    console.error("Error calculating overtime pay:", error);
    return { totalOvertimePay: 0, overtimeDetails: [], occurrenceCounters: {} };
  }
};

// Main Salary Slip Service
export const salaryslipService = async ({
  userId,
  month,
  year,
  organizationId,
}) => {
  try {
    const monthName = getMonthName(month);

    // Step 1: Get employee details
    const employee = await Employee.findOne({
      userId: userId,
      organizationId: organizationId,
      isDeleted: false,
    }).populate("userId", "name email");

    if (!employee) {
      throw new ApiError(404, "Employee not found in this organization");
    }

    // Step 2: Get working days configuration
    const workingDaysConfig = await TotalWorkingDays.findOne({
      organizationId: organizationId,
      month: monthName,
      year: year.toString(),
    });

    if (!workingDaysConfig) {
      throw new ApiError(
        404,
        `Working days not configured for ${monthName} ${year}`,
      );
    }

    const totalWorkingDays = workingDaysConfig.totalWorkingDays;

    // Step 3: Get date range
    const { startDate, endDate } = getMonthDateRange(month, year);

    // Step 4: Check employee active status
    const joinDate = new Date(employee.employment.joinDate);
    const exitDate = employee.employment.exitDate
      ? new Date(employee.employment.exitDate)
      : null;

    if (joinDate > endDate) {
      throw new ApiError(400, `Employee joined after ${monthName} ${year}`);
    }

    if (exitDate && exitDate < startDate) {
      throw new ApiError(400, `Employee exited before ${monthName} ${year}`);
    }

    // Step 5: Get attendance records
    const attendanceQuery = {
      userId: userId,
      organizationId: organizationId,
      date: { $gte: startDate, $lte: endDate },
    };

    if (joinDate > startDate) {
      attendanceQuery.date.$gte = joinDate;
    }

    if (exitDate && exitDate < endDate) {
      attendanceQuery.date.$lte = exitDate;
    }

    const attendanceRecords = await DailyAttendance.find(attendanceQuery);
    const presentDays = attendanceRecords.length;

    // Step 6: Get approved leaves (including half days)
    const leaves = await Leave.find({
      employeeId: employee._id,
      organizationId: organizationId,
      status: "approved",
      $or: [{ durationType: "fullDay" }, { durationType: "halfDay" }],
    });

    // Calculate paid leave days (0.5 for half day, 1 for full day)
    let paidLeaveDays = 0;
    leaves.forEach((leave) => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);

      // Adjust leave dates to month boundaries
      const effectiveStart = leaveStart < startDate ? startDate : leaveStart;
      const effectiveEnd = leaveEnd > endDate ? endDate : leaveEnd;

      if (effectiveStart <= effectiveEnd) {
        const timeDiff = effectiveEnd.getTime() - effectiveStart.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

        if (leave.durationType === "halfDay") {
          paidLeaveDays += daysDiff * 0.5;
        } else {
          paidLeaveDays += daysDiff;
        }
      }
    });

    // Step 7: Extract salary components
    const salaryComponents = employee.salary || [];

    const basicSalaryObj = salaryComponents.find((s) => s.type === "basic");
    const hraObj = salaryComponents.find((s) => s.type === "hra");

    if (!basicSalaryObj) {
      throw new ApiError(400, "Basic salary not configured for employee");
    }

    const basicSalary = basicSalaryObj.amount || 0;
    const hra = hraObj?.amount || 0;

    // Calculate allowances
    const allowances = salaryComponents
      .filter((s) => s.type === "allowance")
      .reduce((sum, item) => sum + (item.amount || 0), 0);

    // Calculate other deductions (excluding policy deductions)
    const otherDeductions = salaryComponents
      .filter((s) => s.type === "deduction")
      .reduce((sum, item) => sum + (item.amount || 0), 0);

    // Step 8: Calculate per day rate
    const perDayRate = basicSalary / 30;

    // Step 9: Calculate payable days (considering join/exit date adjustments)
    let actualWorkingDays = totalWorkingDays;

    if (joinDate > startDate) {
      const joinDay = joinDate.getDate();
      const daysInMonth = endDate.getDate();
      const workingDaysBeforeJoin = Math.floor(
        (joinDay - 1) * (totalWorkingDays / daysInMonth),
      );
      actualWorkingDays = totalWorkingDays - workingDaysBeforeJoin;
    }

    if (exitDate && exitDate < endDate) {
      const exitDay = exitDate.getDate();
      const daysInMonth = endDate.getDate();
      const workingDaysAfterExit = Math.floor(
        (daysInMonth - exitDay) * (totalWorkingDays / daysInMonth),
      );
      actualWorkingDays = totalWorkingDays - workingDaysAfterExit;
    }

    // Step 10: Calculate unpaid leaves
    const totalPayableDays = presentDays + paidLeaveDays;
    let unpaidLeaveDays = Math.max(0, actualWorkingDays - totalPayableDays);

    // Step 11: Calculate policy-based deductions
    const policyDeductions = await calculatePolicyDeductions(
      employee._id,
      organizationId,
      month,
      year,
      attendanceRecords,
      perDayRate,
    );

    // Step 12: Calculate overtime pay
    const overtimePay = await calculateOvertimePay(
      employee._id,
      organizationId,
      month,
      year,
      attendanceRecords,
      perDayRate,
    );

    // Step 13: Calculate amounts
    const salaryDeduction = unpaidLeaveDays * perDayRate;
    const totalPolicyDeductions = policyDeductions.totalPolicyDeductions;
    const totalOvertimePay = overtimePay.totalOvertimePay;

    const totalEarnings = basicSalary + hra + allowances + totalOvertimePay;
    const totalDeductions =
      salaryDeduction + otherDeductions + totalPolicyDeductions;
    const netSalary = totalEarnings - totalDeductions;

    // Step 14: Prepare salary slip response
    const salarySlip = {
      employeeDetails: {
        employeeId: employee._id,
        employeeCode: employee.employment.employeeCode,
        name: `${employee.personal.firstName} ${
          employee.personal.lastName || ""
        }`.trim(),
        department: employee.departmentId,
        designation: employee.userRoleTableId,
        joinDate: employee.employment.joinDate,
        workType: employee.employment.workType,
      },
      salaryPeriod: {
        month: monthName,
        monthNumber: month,
        year: year,
        fromDate: startDate,
        toDate: endDate,
      },
      attendanceSummary: {
        totalWorkingDays: Math.round(actualWorkingDays * 100) / 100,
        presentDays: presentDays,
        paidLeaves: Math.round(paidLeaveDays * 100) / 100,
        unpaidLeaves: Math.round(unpaidLeaveDays * 100) / 100,
      },
      earnings: {
        basic: basicSalary,
        hra: hra,
        allowances: allowances,
        overtimePay: Math.round(totalOvertimePay * 100) / 100,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
      },
      deductions: {
        salaryDeduction: Math.round(salaryDeduction * 100) / 100,
        policyDeductions: Math.round(totalPolicyDeductions * 100) / 100,
        otherDeductions: otherDeductions,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
      },
      policyDetails: {
        deductions: {
          summary: {
            lateEntryDeductions: policyDeductions.policyDetails.reduce(
              (sum, p) => sum + p.lateEntry.deduction,
              0,
            ),
            earlyLeaveDeductions: policyDeductions.policyDetails.reduce(
              (sum, p) => sum + p.earlyLeave.deduction,
              0,
            ),
            breakDeductions: policyDeductions.policyDetails.reduce(
              (sum, p) => sum + p.breaks.deduction,
              0,
            ),
            total: totalPolicyDeductions,
          },
          dailyDetails: policyDeductions.policyDetails,
          occurrenceCounters: policyDeductions.occurrenceCounters,
        },
        overtime: {
          summary: {
            regularOvertimePay: overtimePay.overtimeDetails.reduce(
              (sum, p) => sum + p.overtime.pay,
              0,
            ),
            earlyOvertimePay: overtimePay.overtimeDetails.reduce(
              (sum, p) => sum + p.earlyOvertime.pay,
              0,
            ),
            total: totalOvertimePay,
          },
          dailyDetails: overtimePay.overtimeDetails,
          occurrenceCounters: overtimePay.occurrenceCounters,
        },
      },
      calculation: {
        perDayRate: Math.round(perDayRate * 100) / 100,
        perDayFormula: "Basic Salary / 30",
        workingDaysFormula:
          "totalWorkingDays - presentDays - paidLeaves = unpaidLeaves",
      },
      netSalary: Math.round(netSalary * 100) / 100,
      bankDetails: {
        accountHolderName: employee.bank?.accountHolderName || "Not provided",
        accountNumber: employee.bank?.accountNumber
          ? "****" + employee.bank.accountNumber.slice(-4)
          : "Not provided",
        bankName: employee.bank?.bankName || "Not provided",
        ifsc: employee.bank?.ifsc
          ? "****" + employee.bank.ifsc.slice(-4)
          : "Not provided",
      },
      generatedAt: new Date(),
      calculationNotes: `Salary calculated with policy adjustments. Basic salary: ${basicSalary}, Per day rate: ${
        Math.round(perDayRate * 100) / 100
      }.`,
    };

    return salarySlip;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to generate salary slip: ${error.message}`);
  }
};
